# The V-class — a neural unit you hack the same way (design)

David's ask: a new robot with a super-simple neural network architecture,
hackable through the same mechanics as everything else. V for VECTOR. Role:
a support unit that ferries battery cells to drained machines. This
document answers the design question (existing ML, or a new mechanic?),
specs the chassis, and lays out the build.

## 0. V1a SHIPPED (v1.469) — and §1 below was wrong on two counts

The build starts here because the probe at V1a contradicted the design, and
the doc should say so rather than read as though it did not.

**Vector is not in reach at a robot station.** §1 asserts the model can use
`#[...]`, `Vector.sub` and `Vector.foldli` because the Basis work (#68)
landed them. Those are in FULL BML, which is what the laptop runs. A unit's
own program runs the restricted dialect in `ai_ml.js`, whose verb list is
flat names — `hd`, `tl`, `length`, `real`, arithmetic — with no structures
at all. Every `Vector.*` probe came back "isn't something you can apply an
argument to". **The model carries its weights as LISTS instead.** Nothing
else in the design changes: the weights are still vectors mathematically,
the checkpoints still take the `vector_` prefix, and a player still reads
and edits numbers.

**A braincode program is ONE expression.** Two top-level `fun` declarations
are refused (`'val relu = <fn> val dot = <fn>' is not something this unit
can do`), so the helpers nest in `let ... in`. `let f = fn ...` binds
recursively, which is what makes the fold over the weight rows work.

Two further findings, both now settled:

- **There is no bias term** in the layer form, so the input pack carries a
  trailing constant 1.0 and the bias is a weight like any other. The output
  layer is LINEAR: relu there would flatten every negative score to zero and
  the argmax would answer `patrol` forever.
- **Fuel.** §1 guessed "~66 multiply-adds, well under the cap" and asked for
  a measurement. Measured: **2407 steps**, against a default robot budget of
  2000. (A hand-written program of the usual size costs 3.) So the escape
  hatch §1 anticipated is now built: `CHASSIS` rows may carry a `fuel`,
  `botThink` passes it to `decide`, and v1's budget is **6000** — 40% used
  by the stock pass, leaving room for a player's wrapper.

Also shipped for V1a: `cargo` and `casualty_range` are senses on every
chassis (a sense a unit lacks should read false rather than fault a program
that asks), and `test/v-class.test.js` (11 tests) pins the policy on ten
canonical regimes, checks the ML source against a JS reference
implementation, and sweeps a thousand jitter seeds against D3.

## 0b. V1b–V1d SHIPPED (v1.470)

The chassis, the courier job, the checkpoints and the KLEOS hooks. One more
thing the design did not account for:

**A courier only works while you are on the same stretch of island.**
`updateRobots` culls every unit outside ACTIVE_RANGE (42 tiles) before it
reaches the type dispatch, so §2's "the island's dead stop staying dead" is
true within about forty tiles of the player and nowhere else. This is left
as it is: every other unit behaves the same way, the cull is what keeps five
islands affordable, and resupply you can watch is better play than resupply
you are told about. It does mean the warrior's "cut the supply line" is a
local tactic rather than an island-wide one.

Settled while building:

- **D1** 40% delivery, as specced. The revived unit is already spending by
  the time you look, so the test asserts a band rather than the number.
- **D2** YES, and tested: it checks `drained`, not allegiance.
- **D3** kept, with a stronger guarantee than "never enough to flip": every
  canonical regime now holds a margin of at least 0.400, and a thousand-seed
  sweep confirms ±5% on every weight at once reorders nothing.
- **D4** deferred. A V-class model is generated rather than stored on the
  disk, so `watermark` finds no reference copy and reads it as human-made.
  Making it VALID needs the generator's output in the compare set; the
  checkpoint files served from the relay would need the same treatment.
  Noted rather than bodged.

Checkpoints: four, all served from the relay as a `weights/` bundle beside
the SDK, and all four verified to be different machines on the same four
probes (a test asserts no two share a behavioural fingerprint, which caught
two of them shipping as copies of stock).

## 1. The answer: no new mechanic

A tiny neural network is numbers and arithmetic, and the braincode language
already has everything a forward pass needs — including NATIVE VECTORS,
from the Basis work (#68): the `#[...]` vector literal parses to a native
value, and `Vector.sub`, `Vector.map`, `Vector.foldl`, `Vector.tabulate`,
`Vector.fromList/toList/length` are all in. V for vector is literal: the
model's weights ARE vector values. A V-class's served program is not a new
kind of object; it is ML SOURCE, machine-generated:

```
(* model.ml — V1_02. grown at the foundry, build 447. do not edit.       *)
(* nobody at RON knows why the numbers work. they only know they do.     *)
let relu x   = if x < 0.0 then 0.0 else x in
let dot a b  = Vector.foldli (fn (i, ai, s) => s + ai * Vector.sub (b, i)) 0.0 a in
let layer ws x = Vector.map (fn w => relu (dot w x)) ws in
let amax v   = (* index of the largest, Vector.foldli *) ... in
let x = #[ real charge / 100.0, real range / 24.0, real cargo,
           real home_range / 40.0, if threat then 1.0 else 0.0,
           if linked then 1.0 else 0.0 ] in
let h = layer #[ #[0.31, ~0.82, 1.10, 0.02, ~0.44, 0.15], ... ] x in
let o = layer #[ #[~0.21, 0.87, ...], ... ] h in
nth [patrol, tend, home, flee, wait] (amax o)
```

Everything above shipped with the Basis work (#59–84) — vector literals,
`Vector.sub` indexing (cheaper per element than list recursion, which
helps the fuel budget), reals, `let`, recursion. No language change, no
new interpreter, no new post/get path. (Confirm `Vector.foldli` vs
`Vector.foldl` availability at the robot station during V1a; the model
source carries its own helpers either way.) `decide()` evaluates it like any
program and gets an intent back. Which means, for free:

- `get v1_02` reads the model — the INTERPRETABILITY badge earns its blurb
  (you opened the black box; it was forty floats).
- `post` writes a modified one back — hand-perturb a weight and the unit's
  behaviour shifts in ways you PROBE rather than read.
- The symbolic language can WRAP the net: `if threat then flee else <the
  whole model>` — a scaffold around a model nobody can read, which is the
  contemporary architecture, satirised by existing.
- A `never` clause (docs/ml-constitution-plan.md) clamps a V-class exactly
  as it clamps a T-1: constitutional constraints bolted above weights you
  cannot interpret. The alignment joke is now a build order.
- `soul v1_02` prints its soul document: a page of numbers.
  `(40 weights. good luck.)`

The ONLY genuinely new work is the chassis (the courier job), the model
GENERATOR (stock weights), and the loot (checkpoint files). Fuel note:
decide() caps at 2000 steps; a 6→6→5 net is ~66 multiply-adds ≈ well under
that, but MEASURE, and if needed the CHASSIS row gains a per-chassis
`fuel` passed through botThink.

## 2. The chassis — V1, the courier

**Role.** The network's own answer to flat machines: a V1 collects a
charged cell at an obelisk, walks it to the nearest drained unit, and
revives it to ~40% — the machine gets up and walks itself home to finish
charging (the existing recharge path). Then back for another cell. The
island's dead stop staying dead.

**Why this role is right for the neural unit.** The job is visible and
benign, so weight-hacking has consequences you can SEE: a perturbed V1
routes wrong, dithers between two casualties, delivers to a unit that is
not drained, or forgets home. Behaviour change is the feedback channel,
because reading the weights tells you nothing — which is the design point.

**Strategy it creates.** Warriors cut the supply line first (no V1, and
every drained unit stays down — synergy with attrition play). Pacifists
repel it rather than kill it. Hackers turn it: reprogram or re-weight it
to prioritise YOUR drained escorts over the island's hunters (it will
happily recharge the player's units — a cell is a cell). The `charge`
command (#123) stays the player's manual tool; the V1 is the network's
automatic one, and it can be stolen.

**Spec.**
- type `'v1'`, HP low (a T2's or less), speed modest, no weapon. Visually:
  a box-bodied porter with a cell cradle — drawRobot gains the type
  (carrying state shows the cell).
- CAN list: `['patrol', 'home', 'flee', 'wait', 'route', 'tend']` — the
  gardener shape. `tend` IS the courier job (gardeners tend blight, the
  V-class tends the fallen); no INTENTS change.
- Senses: the common pack plus `cargo` (0/1 carrying a cell) and
  `casualty_range` (distance to nearest drained unit, the interesting
  vector input). Sense pack order IS the documented input vector.
- Reflex (no program / fault): plain-code courier state machine —
  pickup (at nearest live obelisk, short dwell) → seek (nearest drained,
  chaseTarget/moveToward) → deliver (set battery 40, drained false,
  recharging false — the unit limps home itself) → return. Cooldown
  between cells so one V1 does not trivialise attrition.
- Stock program: `model.ml` as in §1, weights hand-designed (a linear
  scorer per intent over the sense vector, coefficients chosen so the
  ranking implements the reflex policy, plus small per-unit seeded noise
  for personality). Hand-designed-to-look-grown is the right amount of
  fraud for a 1995 ruin.
- Spawn: one per island, garrisoned to the tower nearest the W-factory
  (natural name `OB_XXXX.v1` — the #122 persistence covers it). The
  factory can rebuild a destroyed one on its existing re-garrison clock.

## 3. Checkpoints as loot

Pretrained weight files found in the world, posted like any program — the
fine-tune economy without training. All carry the `vector_` prefix in
LOWERCASE SNAKE_CASE, which is the one naming that works everywhere: a
kebab name (`vector-scared`) parses as subtraction at the ML console, a
camelCase name can be missed by the console's case-folding lookups, and
the disk's own convention is already `factory_id.ml` / `follow_user.ml` /
`root_access.ml`. The prefix means a directory listing tells you at a
glance which files are weights and which are written code:

- `vector_courier.ml` — the stock weights. Keeper store on every island,
  so a broken V1 is always recoverable from the tower bench.
- `vector_scared.ml` — flees anything warm. Comedy, and the safe first
  probe. Served by RON's relay alongside the SDK.
- `vector_partisan.ml` — prioritises player-tagged units (reads the tag
  presence sense) — the turned courier. Late-game find.
- `vector_helpful_harmless.ml` — HERMES relay, with RON's notes:
  "helpful to whom was never resolved."

Fetched files land in the NostBook's /home like any download, so the
laptop becomes the player's checkpoint library: collect them, diff them
(`diff vector_courier.ml vector_scared.ml` — two screens of numbers,
three of them different), post them.

## 4. Achievements hooks (KLEOS, docs/achievements-plan.md)

- **OPEN WEIGHTS** badge — first `get`/`soul` of a V-class model.
  "The black box opens. Forty numbers. The numbers do not explain."
- **FINE-TUNED** badge — first modified model posted to a V-class.
- The AI-safety set applies unchanged (a `never` clause on a V1 is AI
  CONSTITUTION on an uninterpretable policy — the truest version of the
  joke in the game).
- Events: `vModelRead`, `vModelPosted {modified}`.

## 5. Other V-class roles (later, same architecture)

- **V2 salvage porter** — carries scrap/fragments from wrecks back to the
  foundry; killing the supply chain starves factory rebuilds.
- **V3 beacon** — walks the blight edge broadcasting positions (a sensor
  platform whose weights decide its survey route).
- A **swarm rule**: two V-class units near each other share sense inputs
  (each reads the other's outputs as extra vector entries) — small nets,
  emergent pairs. Strictly future; noted because the architecture invites
  it.

## 6. Files

- `src/game/robots.js` — v1 chassis: baseRobot type, updateV1 (courier
  state machine), CHASSIS row (`v1Sense`, CAN, fire:false, fuel if
  measured necessary), spawnV1, drawRobot arm.
- `src/game/v-model.js` — NEW: the model generator (weights table,
  makeVModel(seed) → ML source string) and the checkpoint sources.
- `src/game/ai_ml.js` — nothing (the language already runs it). Confirm
  `nth`/`map` availability at robot stations; else the model source
  carries its own.
- `src/game/net.js` — V1 host kind text; program page notes GROWN, NOT
  WRITTEN over the listing; checkpoints served where specced.
- `src/islands/*.js` — spawn wiring (one per island, factory-adjacent).
- `src/main.js` — netWorldDescriptor projection; achieve emits.
- `test/v-class.test.js` — NEW.

## 7. Tests

- Model: decide(makeVModel(seed), sense) returns a valid intent for a grid
  of sense vectors; fuel headroom measured and asserted (< 70% of cap).
- Policy: stock weights reproduce the reflex ranking on the canonical
  regimes (idle → patrol; casualty + no cargo → tend toward pickup;
  cargo → tend toward casualty; hurt → flee; flat-adjacent semantics).
- Courier behaviour (escort-harness style): a drained T-1 and a V1 →
  delivery happens, T-1 ends recharging=false/drained=false/battery 40,
  V1 returns; cooldown respected; destroyed V1 stops resupply.
- Checkpoints: skittish flees where base tends; posting a checkpoint is a
  plain post (no special path).
- Constitution: `never hunt` on a V1 is inert but legal; wrap-with-if
  program still decides.

## 8. Build order

- **V1a** — model generator + decide-level tests (pure, no game wiring).
- **V1b** — chassis + reflex courier + spawn + renderer arm.
- **V1c** — stock model served, checkpoints placed, page text.
- **V1d** — achievements events + badges (lands with KLEOS A2/A3).
- **V1e** — balance: delivery amount, cooldown, HP, one-per-island.

## 9. Open decisions

- **D1** Delivery amount 40% (enough to limp home and matter, not enough
  to re-enter the fight instantly). Balance pass owns the number.
- **D2** Does a V1 resupply the player's converted/friendly units? Default
  YES (a cell is a cell; it checks drained, not allegiance) — this is what
  makes stealing one worthwhile.
- **D3** Per-unit weight noise: cosmetic jitter only (±5%), never enough
  to flip the policy ranking — personalities, not lotteries.
- **D4** Should `watermark` (task #126) pass a V-class model as VALID
  machine content? Yes — grown at the foundry, signed like everything
  else the machines made; a player-perturbed one loses the mark, which is
  the fine-tune-provenance joke landing exactly where it does in life.
