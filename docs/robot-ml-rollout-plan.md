# Every island machine runs a program you can read — rollout plan

> **Current intent set (v1.456+).** Beyond the per-chassis CAN lists below, two
> more feet intents shipped with the escort braincode (#111): `follow` (trail
> the player, fight nothing) and `defend` (trail the player and intercept what
> hunts them). Both are on every fighter chassis (T-1/T-2/T-3/W-1/W-4), alongside
> `route` (the LOGO walk). Gardeners (W-3/W-5) keep `patrol home flee wait route
> tend`. A branch that ends on an effect rather than an intent evaluates to `()`
> and now faults as **MISSING INTENT** (v1.459). The player-facing reference is
> shipped in-game at `robots_code/intents.txt`; keep the two in step.

Implementation plan for the rest of task #96. The design argument lives in
`docs/robot-programs-plan.md` and is settled; this document is the per-chassis
execution spec. It is written to be implemented cold: every decision is made,
every file named, and the order is the order to build in.

## Where this starts from (v1.423)

- `decide(program, senses)` is pure, fuel-capped, and returns
  `{ ok, intent, fire, effects }` — a bare intent or a `[feet, weapon]` pair
  (P8, v1.261). `demos/engage.ml` is the worked example.
- `botThink` / `botFault` and the `CHASSIS` table in `src/game/robots.js`
  generalise the T1 machinery: one row per programmable type,
  `{ sense, can }`. T1 (v1.215) and T2 (v1.422) are rows; every other class
  still has its policy compiled into its update function.
- Every unit already serves `program.ml` when `r.program` is set, and
  `postProgram` (src/main.js) writes one back, gated by L9. Read is free,
  write is the escalation. None of that changes here.
- Checkpoints store the world SEED, not the robots: units respawn through the
  spawn factory (`robots.js` ~line 570) on every load. A stock program added
  there reaches every save with no migration. (Verify once in S1: confirm no
  robot array is serialised anywhere in `buildSaveBlob`.)

## Lessons already paid for — do not relearn

1. **A class without a stock program is not programmable at all.**
   `postProgram` refuses a unit with `!h.program` ("nothing to replace"), so
   the browser route is unreachable until the spawn factory ships a program.
   This is why T2 gained `T2_PROGRAM` in v1.422. Every class below gets one.
2. **An unbound name inside evaluation reads as an ATOM.** That is how
   `patrol` works as a value. Never probe the engine to ask whether something
   is defined; look it up. (`laptopBinds` in main.js is the worked example.)
3. **The host folds case.** Builtin keys fold through `foldKeys`
   (src/lang/interp.js). New sensor words must be lower-case.
4. **`node --check` misses ESM errors.** `test/module-syntax.test.js` guards
   it; run the full suite after every stage, not at the end.

## The rule that settles every interaction question

**Authority beats program beats reflex.** A tower's recall (`repel`), the
spoofer, and the bluebox are the network's authority over the unit; a stored
program is the unit's own head; the compiled reflexes are its spine. While an
authority state is active (`r.returning` forced by repel, spoofer allegiance,
bluebox conversion), `botThink` is not consulted and the unit's page reports
`overridden — recall order from tower` in the fault slot (without the amber
lamp: it is not broken, it is obeying). Implement the skip once, in
`botThink`, keyed on a new `r.overridden` flag set/cleared by those systems.

## S1 — shared substrate (no behaviour change)

**`src/game/robots.js`:**

- Replace `t1Sense`/`t2Sense` with one `makeSense(r, d, map, caps)` where
  `caps = { detect, hurtAt }` come from the chassis row. The two existing
  functions differ only in those constants. The `_homeOb` lookup stays as is.
- A sense builder supplies ONLY the instruments the chassis carries; a missing
  key reads as the language default (false/0). That is the honesty rule from
  the design doc §2 and it is load-bearing for programs that "never fire a
  branch" on the wrong chassis.
- `botThink` gains the fire half: after a successful decide,
  `r.fireWish = res.fire || null`. Chassis rows gain `fire: true` where the
  unit has a weapon the pair can drive. A pair returned on a chassis without
  `fire: true` faults: `` `${res.fire}: this chassis has no fire control` ``.
- `botThink` starts with the authority skip:
  `if (r.overridden) { r.intent = null; return; }`.
- `postProgram` (src/main.js) refuses hardened units, BEFORE the
  `!h.program` check:
  `post: ${h.host}: 403 — foundry-sealed firmware. This unit does not take field programs.`
  Guards (`robots.js:768`) are the only hardened units.
- Tests: existing T1/T2 tests unchanged (the refactor must be invisible);
  new tests that a pair on a fireless chassis faults, and that `overridden`
  suppresses the program without lighting the fault lamp.

## S2 — W4, the first shooter

The class the fire-control senses were built for. Reference reflexes:
`updateW4` (robots.js ~1970).

**Senses** (all real): `charge integrity range home_range threat hurt linked`
plus `sight` (LOS && d ≤ W4_RANGE), `armed` (attackTimer ≤ 0), `shielded`
(player shield/forcefield up — the `pressShielded` read), `contact`
(d < 1.6), `lost_for` (the generic LOS-give-up clock in `updateRobots`; find
the field feeding `LOS_GIVEUP_AFTER` and expose its seconds).

**CAN:** `patrol hunt home flee wait` + fire control.

**Fire semantics in `updateW4`:** the firing block runs when
`r.fireWish !== 'hold'` (null = reflex = fire when able; `fire` = same;
`hold` = never shoot; `reload` = do not shoot, let attackTimer run).
Movement under `hunt` keeps the whole existing aggro block — hold-at-range,
min-range backoff, press-shielded. Those are chassis, not policy.

**Stock program** (`W4_PROGRAM`, spawn factory serves it):

```
(* W-4 hunter-killer. TIRESIAS-tactical 2.11.       *)
(* Do not edit. Faults are reported to the foundry. *)
if charge < 20 then home
else if threat and hurt then flee
else if threat and sight and armed then [hunt, fire]
else if threat then hunt
else patrol
```

**Dry run:** extend the sense snapshot in `postProgram` with the fire-control
fields so the verdict on a shooter is not a guess.

**Tests:** doctrine table for W4_PROGRAM (the four rows in the design doc
§8c, plus `[hunt, fire]` when sighted-and-armed); `hold` suppresses the shot
with the player in range; `reload` lets the timer run; posting onto a
hardened m6 refuses with the 403.

## S3 — T3, the ambusher

Reference: `updateT3` (~1687). A camper: never chases, claws when crowded,
fires twin lasers on sight.

**Senses:** as W4 but `sight` uses `T3_AMBUSH_RANGE` and `contact` uses
`T3_HIT_RANGE + reach`. All fire-control senses real.

**CAN:** `patrol hunt home flee wait` + fire. `hunt` for a T3 means its OWN
engage: face the target, nudge back below min range, claw at contact — the
camped block, not a sprint. `wait` is the nest state (no patrol drift) and is
the stock default.

**Stock program:**

```
(* T-3 ambusher. TIRESIAS-emplacement 1.2.          *)
(* It does not chase. The nest is the post.         *)
if charge < 10 then home
else if sight and armed then [wait, fire]
else wait
```

**Tests:** stock never chooses a moving intent with the player visible;
`[wait, fire]` on sight; a posted `hunt` program engages without leaving the
camped behaviour envelope.

## S4 — W1, the revenge squad

Reference: `updateW1` (~1799). Spawned already aggro, attacks in waves,
tracks a triangulated fix, cannot hit a jacked-in player.

**Senses:** `charge integrity range home_range threat hurt` — no fire
control (melee), no `linked` (its fix comes from the obelisk net; if the net
mattered it would be a different machine). `threat` = within
`HUNTER_REACQUIRE_RANGE`.

**CAN:** `patrol hunt home flee wait`. The wave rhythm (`w1Phase`), the
triangulation lag and the `jackedIn` rule stay engine-side under `hunt` —
they are what a W1 IS. State that in the program's comment.

**Stock program:**

```
(* W-1 response. TIRESIAS-vengeance 3.0.            *)
(* The waves are the chassis. This only chooses.    *)
if charge < 12 then home
else if threat then hunt
else patrol
```

## S5 — the `work` sensor, and W3 the fitter

**One new word.** `work` : true when the unit's own toolhead sees a job in
sensor range. For a W3 that is a repairable obelisk (`w3Repairable`) within
its scan; for a W5, plantable ground or blight. One sensor, defined by trade,
so working-machine programs can condition on whether there is anything to do.

Wiring checklist for a new sensor word (this is the complete list; missing
one is silent): `MACHINE_ONLY` in ai_ml.js, the `SENSE()` table beside it,
the sensors row in `programPage` (net.js ~579), the AI-ML docs page
(`docsPage` in net.js / ml-docs.js — grep `home_range` to find every surface
that lists sensors), and tests.

**W3.** Reference `updateW3` (~1880). Unarmed, never aggros, finds its own
targets.

**Senses:** `charge integrity range home_range linked work`.
**CAN:** `patrol home wait flee tend`. `tend` = run the repair trade exactly
as the reflex does (target-finding stays engine-side); `flee` gives an
uploaded program a self-preservation branch the reflex never had.

**Stock program:**

```
(* W-3 fitter. TIRESIAS-works 1.7.                  *)
if charge < 15 then home
else if work then tend
else patrol
```

**Interaction to preserve:** the frozen-tower unfreeze and rebuild logic is
the trade, inside `tend` — a program choosing `wait` must stop repairs, which
is the sabotage this class exists for (park the fitters, then fell towers).

## S6 — W5, the gardener

Reference: `updateW5` (~1939). No fixed home (re-anchors), never fights.

**Senses:** `charge integrity range threat work blight daylight`. `threat` =
d < 6 — a drone that plants around obstacles is not blind, and without it a
"flee when approached" upload is impossible. `home_range` reads 0 (its home
is wherever it is).

**CAN:** `patrol home wait flee tend`. `home` = stop re-anchoring and hold
the current anchor; `tend` = the planting trade.

**Stock program:**

```
(* W-5 gardener. TIRESIAS-works 1.7g.               *)
(* The same works build as the W-3, g-fit.          *)
if charge < 15 then home
else if work then tend
else patrol
```

**Bluebox:** the conversion (main.js ~2865) sets `type = 'w5'`; it must now
also set `r.program = W5_PROGRAM`, so a converted unit's page reads as the
gardener it has become rather than carrying the hunter's old program.

## S7 — routes: LOGO moves, and lights to go with them

*(Pulled forward from P7 at David's request, 2026-08-11: "commands like MOVE
+2, -1 … move back and forth or go around in circles whilst flashing their
lights/eyes in different colours.")*

No second contract needed. A route is a policy program that returns the new
intent **`route`**, having queued its orders as effects on the way — the
exact `plant ; forward 4 ; home` shape of design doc §6, built on the effects
channel that already exists (`beep ; eye "white" ; flash 6 ; hunt` works
today).

**The one new order-verb:** `move dx dy` — relative tiles, arity 2. Negative
is the language's own `~`, and this must be said everywhere the verb is
documented: `move 2 ~1`, because `move 2 -1` parses as subtraction.

**Semantics.** During evaluation, `move` and the lamp verbs append to an
order QUEUE in call order (for a route, `eye` no longer applies instantly —
position in the queue is the point: lights change WHERE the machine is when
the order comes up). `route` as the returned intent means: execute the queue,
one order at a time, ignoring reflexes; when it empties, think again. Because
re-thinking re-runs the program, a program that queues the same orders loops
for ever — circles and back-and-forth fall out with no loop construct:

```
(* dance.ml — a square, with corner lights. *)
(eye "blue"  ; move 3 0 ;
 eye "red"   ; move 0 3 ;
 eye "white" ; move ~3 0 ;
 eye "amber" ; move 0 ~3 ;
 route)
```

```
(* metronome.ml — back and forth while it is light. *)
if daylight then (flash 2 ; move 4 0 ; move ~4 0 ; route)
else (eye "off" ; wait)
```

**Engine wiring** (`robots.js`): `botThink` stores the queue on the unit when
intent is `route`; a `runRoute(r, dt, map)` helper executes the head —
`move` legs via `moveToward` at patrol speed, done on arrival, abandoned
after ~2s without progress (blocked is not a fault; the next leg starts from
where the machine actually is); lamp/beep orders apply instantly and pop.
The update functions treat `intent === 'route'` as its own branch, above the
reflex fallback.

**Limits, stated as faults:** |dx|,|dy| ≤ 12 per leg; ≤ 64 orders per
evaluation (`route too long — the machine cannot hold it`). `route` joins
every programmable chassis's CAN list — a hunter told to dance is harmless,
and watching it dance is the feature.

**Not in this pass:** turtle heading state (`forward` / `left` / `right`).
`move dx dy` covers the experiments asked for; heading verbs can sit on top
later without changing the contract.

**Tests:** order queue preserves interleaving (eye between moves fires
between legs); the square program loops (queue refills on empty); leg and
queue caps fault with their sentences; a blocked leg abandons and continues.
**Verify in the browser:** post `dance.ml` to a T1 through its own page and
watch it walk the square changing colour at each corner; `repel` it mid-dance
and confirm authority wins.

## S8 — the API: talk to a unit without Netscape

*(David, 2026-08-11: "an additional API system to call to the website that
runs on each robot rather than go through netscape … call the API GET/post
function and then post a file back to it. maybe to their IP address in game?")*

This is not a new subsystem. `unitd/0.4` already answers — the 200 OK on a
post says so — and Netscape's form was only ever the human face on it. What is
missing is the request layer as **shell verbs a program can compose**, so the
laptop can automate what a person does by hand: read a unit, decide, write
back. The fiction is exact: L9 breaks the httpd, and this is what you do with
it once it is broken.

**Two verbs, over the wire that already exists** (`post` proves the card/up
checks; reuse them verbatim). Both take an address `findHost` already
resolves — IP, bare name, or FQDN, confirmed all three:

- **`get <addr> [path]`** — fetch a served document to stdout. Default path
  `/program.ml`. It is `post` in reverse and shares its resolver and its
  L9 gate (a maintenance interface is read-write once broken; before that,
  `GET /program.ml` on a robot is the free public read that already exists —
  keep that split: the PUBLIC page is free, the maintenance paths 401 until
  L9). Wire it as `laptopGetHook` beside `laptopPostHook`, calling a new
  `getResource(addr, path)` split out of the same seam `postProgram` uses.
- **`post <file> <addr>`** — already exists. S8 only makes its address the
  same resolver `get` uses and confirms an IP works end to end.

**The automation, with what already exists:** `sh` already runs a script of
shell lines (unix.js ~2128) and `>` already redirects a command to a file.
So the loop is scriptable TODAY once `get` lands:

```
(* patrol-sweep.sh — read every unit the sniffer found, park the fitters. *)
get 10.3.4.7 > /home/download/u7.ml
(* ... edit, decide ... *)
post idle.ml 10.3.4.7
```

The one addition that turns "scriptable" into "automatable" is letting a
value come BACK from a machine into ML, so a program can branch on it rather
than a human reading the file. That is the reach item, kept small:

- **`fetch <addr> [path]`** as a laptop AI-ML builtin (LAPTOP_VERBS, not
  ROBOT_VERBS — a unit does not call the network) returning the served text
  as a string. Then `reply`-style automation is real ML:
  `if String.isSubstring "FAULTED" (fetch "10.3.4.7") then post "reset.ml" ...`
  — built on `get`'s resolver, so it inherits the L9 gate for free.

**Scope guard:** `get`/`post`/`fetch` reach only what the sniffer has already
found — they resolve through the live host table, so you cannot address a unit
you have not discovered, and a jammed card still refuses. No new network
model, no new security surface: the L9 gate is the whole of it, and it is one
check on the resolver both verbs share.

**Files:** `laptopGetHook` + the hook wiring line in main.js (~6809, beside
`post:`); `getResource`/`postResource` split from `postProgram`'s host-resolve
head so all three verbs share one resolver and one gate; `get` and `fetch` in
unix.js's command dispatch with the same card/up guards as `post`; `fetch` in
LAPTOP_VERBS + the ai_ml builtin; man pages for `get` and `fetch`; the
`docsPage`/laptop help surfaces that list `post`.

**Tests:** `get` by IP, by name, by FQDN returns the served program; `get` of
a maintenance path 401s before L9 and serves after; `fetch` returns a string
ML can branch on; a script (`sh`) that gets, edits via redirect, and posts
round-trips; `get`/`post` on an undiscovered address fail with host-not-found;
`fetch` is refused at the robot station.

**Verify in the browser:** with L9 open, `get 10.x.x.x > u.ml` on the laptop,
`pico u.ml`, `post u.ml 10.x.x.x`, and watch the unit change — the whole loop
without Netscape ever opening. Then a one-line `fetch` in an ML program that
reads a unit's own reported intent back and decides on it.

## Out of scope, and made true rather than left vague

- **M4/M5/M6 guards:** not programmable, by design (§8 threat collapse). The
  S1 hardened gate makes the refusal real; guards spawn with
  `program: null` so their pages advertise nothing.
- **Friendly units and Ubik-confused states:** no hosts worth programming;
  untouched.
- **Frozen / drained:** programs do not run in either state (existing gates
  in `updateRobots` run before the type dispatch). A flat unit still takes a
  post (stored, runs on charge) — that is already `postProgram`'s behaviour
  and its message is right.
- **Obelisk programs (P6):** a later document. (P7 routes are S7 above.)

## Stage order and versioning

S1 → S2 → S3 → S4 → S5 → S6 → S7 → S8, one version each, each pushed only when the full
suite is green. S2 is the proof of the substrate (fire control + hardened
gate + dry-run senses); if S2 fights, stop and fix S1 rather than pressing on. S8 (the API) needs only S1's shared post/get seam and may be built at any point after it — it does not wait on the shooter chassis.

## Verification, per stage

- `node --test test/*.test.js` — everything green, including the unchanged
  T1/T2 doctrine tests (the refactor must be invisible).
- `node --input-type=module --check` on touched files (module-syntax test
  covers, but run it consciously).
- `tools/sml-checklist.mjs` and `tools/isml-conformance.mjs` at 100/100 —
  S5 touches ai_ml.js, which is the adapter, not the language; the
  instruments must not move.
- In the browser, per class: open the unit's page, read the stock program,
  save it, edit one condition in pico, post it back, and watch the unit do
  the edited thing. For W4 specifically: post a `hold` program and stand in
  front of it; it must track and not fire. Post the sabotage spin program;
  amber lamp, page reports the fault, reflexes resume.
- `repel` a programmed W4: it must go home regardless of its program, page
  reading `overridden`, and resume the program when the recall lapses.

## The finish line for task #96

Every unit class on an island either runs a stored program you can read,
edit and re-post through Netscape (T1 T2 T3 W1 W3 W4 W5), or refuses with a
sentence that says why (M-guards, 403 foundry-sealed). No class serves a
program it does not execute, and no class executes what it does not serve.
And any of the programmable ones will walk a square flashing its eye at the
corners, because you told it to in six lines it printed for you itself.
