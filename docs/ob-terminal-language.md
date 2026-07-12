# RON-ML — the obelisk terminal language (design)

*Status: implemented in v0.84 (`src/game/ronml.js` + the REPL wired into `#obterminal`
in `main.js`). The terminal UI + click-to-open shipped in v0.80 as a read-only VT220
shell; this doc was the plan for making it do something, and is now also the reference
for how it actually works. Shipped without lambdas, per §8. `sing` deviates from the
"kicked out on a hit" plan below: instead of an interrupt-on-hit mechanic, being
jacked in keeps you fully hidden from the machines the whole time (`player.terminalSafe`),
and typing `sing` deliberately drops you straight out of the terminal so you can watch
the choir sequence happen in the world, rather than reading about it in the console.*

## 1. The fiction

The obelisks are terminals into POSEIDON — the AI network (named SKYLINK in earlier builds). Before the collapse, RON
(the resistance) reverse-engineered a sliver of the operators' own console language
and left fragments of it scrawled across the world: on walls, in notebooks, on
floppy disks and dead machines. A survivor who collects those fragments, finds an
**AI key** (dropped by a destroyed W-factory), and jacks into an obelisk can type
those fragments back in to make the machines do things they were never meant to.

The language is **RON-ML**: a tiny, functional, ML-flavoured console language. It is
deliberately small enough that a player can *learn* it — not copy-paste blindly, but
come to understand `let ... in`, function application, and the pipe, and start
composing their own commands. That understanding is the real reward: late game, the
same language hacks robots directly, not just obelisks.

Design north star: **the player should be able to write a command they were never
handed, because they understood the pieces.**

## 2. Why ML (functional), and how small

Functional because it fits the fiction (a query/console language over "the network"
reads as declarative), and because a pure expression language is the *smallest*
thing that still feels like a real language — no statements, loops, or mutable state
to teach. Everything is an expression that evaluates to a value; some values, when
they reach the top level, *happen* (an effect).

The whole language is ~7 primitives + 3 syntactic forms. That's the entire surface
area a player must learn.

### Values (implicit types — never written)
- **node** — an obelisk/robot id, written as its hex, e.g. `OB-BB05`, `T2-1F` .
- **key** — an access token (from `hack`, or the physical AI key you hold).
- **num** — `30`, `0`.
- **list** — `[OB-BB05, OB-1C0E]` (what `scan` returns).
- **unit** — `()`, the result of an effect.

### Syntactic forms (all a player must learn)
1. **Application by juxtaposition** — `sleep 30`, `hack OB-BB05`. (Not `sleep(30)`,
   though we accept parens too, so beginners aren't punished.)
2. **`let name = expr in expr`** — bind a result to reuse it. This is the one real
   idea to teach, and the HACK→CRASH chain forces it.
3. **Pipe `|>`** — `scan |> nearest |> crash` feeds a value left-to-right. Sugar for
   nested application; entirely optional, but it's how the elegant one-liners read.

Comments are `(* ml style *)`. Whitespace-insensitive. Case-insensitive keywords.

## 3. The primitives (the "verbs")

| verb | type | effect | gate |
|---|---|---|---|
| `scan` | `unit -> list` | returns nodes/robots in range of this terminal | always |
| `nearest` | `list -> node` | the closest element of a list | always |
| `hack n` | `node -> key` | returns node `n`'s access key (its hex) | free (chip only, no AI key) |
| `crash n k` | `node -> key -> unit` | knocks node `n` offline until a repair drone reaches it; wrong/absent key fails | needs `k` from `hack n` |
| `sleep t` | `num -> unit` | this AI's local machines idle for `t` game-minutes | needs AI key |
| `repel` | `unit -> unit` | nearby robots' targeting inverts: they flee you for a spell | needs AI key |
| `sing` | `unit -> unit` | the Portal easter egg (§6) | secret; needs the exact fragment |
| `keys` | `unit -> list` | the keys you currently hold | always |
| `map` | `unit -> unit` | opens a schematic of the AI's territory: obelisks (coded), machines, the factory, the mainframe you're hunting, and you | always (added post-design) |
| `print` | `unit -> unit` | runs off a physical **printed map** item that drops at your feet — pick it up and use it to unfold the map anywhere, away from a terminal | always (added post-design) |
| `help` | (meta) | prints the command reference; `help <verb>` details one verb. Intercepted before evaluation, not a real expression | always (added post-design) |
| `notes` | `unit -> unit` | opens the notepad — a real page you flip through (Left/Right, or the on-screen buttons) with the language-teaching lore fragments (`lore.js`, `notepad: true`) you've found so far, in discovery order | always (added post-design) |

Two more worth adding once the base works:
- `disable n` (`node -> key -> unit`) — permanently fuses a *robot* (not an obelisk)
  you've hacked, for scrap. The robot analogue of `crash`.
- `beacon` (`unit -> unit`) — flip the awareness meter to *quiet* for this zone (ties
  into Henrik's awareness-meter idea).

### The HACK → CRASH chain (the teaching moment)
`crash` refuses to run without the node's own key. `hack` is the only way to get it.
So the first real program the player writes is the two-step:

```ml
let k = hack OB-BB05 in
crash OB-BB05 k
```

Once they've typed that a few times, the pipe version is a small, satisfying step up:

```ml
scan |> nearest |> (fn n => crash n (hack n))
```

(We can ship without lambdas; `let` alone teaches the idea. `fn x => e` is a stretch
goal for the players who want it.)

## 4. Gating — key, range, and not-getting-hit

Three gates, each doing narrative + mechanical work:

1. **The AI key** (physical item, from a destroyed W-factory) gates the *sharper*
   verbs, not all the ones with teeth. `scan`/`keys`/`nearest` are free (they read).
   `hack`/`crash`/`loop` are also free now (the access chip that opened the console is
   enough): you can knock a node dark without an AI key. What the AI key still unlocks
   is `sleep`/`rewind`/`repel` and the fortress `unlock`. One key unlocks one AI's
   quadrant for those (ties into the four-AI map). *(Revised 2026-07-12: `hack`/`crash`
   no longer need an AI key; row in §3 below marked accordingly.)*
2. **Range** — a terminal only `scan`s / `hack`s / `crash`es nodes in its own network
   neighbourhood, so you have to physically get to the right obelisk.
3. **You must not be hit while typing.** The terminal is a modal, but the world keeps
   running behind it (robots still hunt). Taking a hit **kicks you out** of the
   terminal mid-command ("CONNECTION LOST"). So hacking is a real decision: clear the
   area, or `repel`/`sleep` first to buy the seconds you need for the big command.
   This is why the modal deliberately does **not** pause the game.

## 5. Seeding the language in lore

The fragments already exist as a system (`lore.js`, the Archive). Add a new fragment
`kind: 'code'` (green-on-black, already styled) whose text is a runnable snippet plus
a scrap of operator commentary. The player learns by collecting and reading them:

- **Fragment A (early, teaches application):**
  > `sleep 30` — "typed it and the whole yard went quiet for half an hour. don't
  > know why it's minutes. — J"
- **Fragment B (teaches `scan`/`nearest`/pipe):**
  > `scan |> nearest` — "it lists what's on the wire. nearest picks the closest. the
  > `|>` just passes it along, like handing it down a line."
- **Fragment C (teaches `let`, the HACK→CRASH chain):**
  > ```
  > let k = hack node in
  > crash node k
  > ```
  > "you can't crash blind. hack first — it hands you the node's own key — then crash
  > with it. put your obelisk's code where it says node."
- **Fragment D (REPEL):** `repel` — "flips them. they run from you instead of at you.
  buys a minute, no more."
- **Fragment E (the secret):** a torn, half-legible page that only hints at `sing`
  (§6) — never spells it out, so discovering it feels earned.

Fragments teach one idea each, in roughly this order. The player assembles a
**personal cheat-sheet** in their head (or on paper) — that's the intended loop.

## 6. `sing` — the Portal easter egg

The secret command. Typing `sing` (only discoverable from Fragment E's riddle, or by
experiment) makes every robot within range **stop hunting, form a line, face the
player, and perform the choir/credits refrain**, then power down one by one — a
direct nod to *Portal*'s "Still Alive"/end sequence. It's a pure treat: no key
needed, no combat value beyond the deactivation, and it should feel like the game
winking at you. Implementation: a scripted `choir` state on the affected robots
(line-up target positions + a shared timed animation + a synthesised a-cappella
motif), then `drained = true`.

## 7. Implementation plan

Small and self-contained. Suggested new module `src/game/ronml.js`:

1. **Tokenizer** — identifiers/hex, numbers, `let`/`in`/`|>`/`=`/parens, `(* *)`
   comments. ~40 lines.
2. **Parser** → tiny AST: `App`, `Let`, `Pipe`, `Var`, `Lit`, `NodeRef`. Pratt or
   recursive-descent; the grammar is trivial. ~80 lines.
3. **Evaluator** — an environment of built-ins; each primitive is a JS function
   `(args, ctx) => value`, where `ctx` carries the world (`map`, `player`, `robots`,
   the terminal's owning obelisk, the player's held keys). Effects mutate the world
   via the same hooks the game already exposes (e.g. reuse the POSEIDON-cancel path
   for `crash`, the sleep mechanic for `sleep`, a targeting flag for `repel`). ~120
   lines.
4. **Terminal REPL** — wire the existing `#obterminal` modal to accept typed input:
   an input line, an output log, command history (up/down). Print results/errors
   RON-DOS style. Errors are *teaching* errors: `crash OB-BB05` alone →
   `ERR: crash needs a key. try: let k = hack OB-BB05 in crash OB-BB05 k`.
5. **Interrupt hook** — `player.takeDamage` (while a terminal is open) closes it with
   `CONNECTION LOST`.

Nothing here needs the four-AI map first; it works against the current single network
(one AI key, the existing obelisks/factory). The four-AI world later just means
"which key opens which quadrant's nodes."

## 8. Open questions (decide before building)

- **Lambdas or not?** `let` alone is enough for the HACK→CRASH chain and keeps the
  language teachable. Ship without `fn x => e`; add it only if players want the
  one-liner.
- **Persist learned commands?** A "known fragments" list survives death (like skills),
  so re-typing isn't punished — but you still need a key and range each time.
- **How forgiving is the parser?** Lean forgiving: accept both `sleep 30` and
  `sleep(30)`, ignore case, ignore trailing junk, and make every error a hint. The
  goal is teaching, not gatekeeping.
- **Effect scope of `sleep`/`repel`** — this obelisk's neighbourhood, or the whole
  AI's quadrant? Suggest neighbourhood now, quadrant once the key/quadrant model
  exists.

## 9. Revised gating model (David, 2026-07-12) — supersedes §4

Two key items, two command tiers, a fortress-key program, and a persistent
top-level `let`. This is the authoritative gating spec; §3/§4 above are the
original design and are kept for history.

### Two currencies
- **Access key (the chip)** — opens the terminal. Once you are inside, every
  Type 2 command runs *if you know the word*. Common (fell a tower, or craft from
  fragments). Unchanged as the console-entry gate: the `hack` verb itself takes
  no key, but you needed the access key to be in the console at all.
- **AI key** — rare, from a wrecked W-factory, and **encrypted**. Not usable
  raw: `decrypt aikey` turns it into a token that `unlock` consumes. This is the
  only gate on Type 1.

### Type 2 — the hacks (access key + language; NO AI key)
`scan`, `nearest`, `keys`, `name`, `map`, `print`, `hack`, `crash`, `loop`,
`sleep`, `repel`, `rewind`. None needs the AI key.

- **`name` (new verb):** `name -> node`. Prints the code of the obelisk you are
  jacked into (e.g. `OB-1A2B`) — a free read, like `scan`, so you can see which
  node you're on without scrolling the boot banner. Obelisk console only; at a
  HERMES relay it can echo the relay id (or stay ob-only — TBD).

Because the three board verbs
(`sleep`/`repel`/`rewind`) are now this easy to reach, their **effects are
nerfed** (smaller radius / shorter duration) so easy access is not overpowered.
(`hack`'s AI-key gate was removed 2026-07-12; `sleep`/`repel`/`rewind` follow.)

### Type 1 — the deep hack (copy the AI key in, decrypt it, unlock)
The **fortress key** is the endgame unlock, and it takes a deliberate multi-step
program: copy your physical AI key into the terminal so the language can name it,
decrypt it, then spend the decrypted token together with a freshly hacked node
key.

```ml
copy aikey
let k = hack OB-1A2B
let d = decrypt aikey
unlock k d
```

- **`copy` (new verb):** `copy aikey` reads the AI key you physically hold and
  copies its keyname OFF into the session, binding `aikey` so the rest of the
  language can use it (echoes `val aikey = KEY:AI-XXXX`, ML top-level style —
  it behaves like a `let` sourced from your pack rather than an expression).
  **Fails if you hold no AI key** — this is where the "AI key held" check now
  lives. Diegetically: you copy the code off the key into the machine.
- **`decrypt` (new verb):** `decrypt aikey -> token`. Turns the copied,
  still-encrypted key into the token `unlock` needs.
- **`unlock` reworked to `unlock k d`:** a hacked node key `k` AND a decrypted
  AI-key token `d`. Drops the fortress key. (Was `unlock k` on a hacked key
  alone — too easy.)

Once `aikey` is in scope from `copy`, the tail can also be the single-expression
form `let k = hack OB-1A2B in let d = decrypt aikey in unlock k d`; or line by
line as above (persistent top-level `let`). Three real steps — copy, decrypt,
unlock — is the point: the endgame key is earned, not typed.

### Backing up the AI key at HERMES
The AI key is hard-won (a wrecked W-factory) and easy to lose (death wipes the
run). RON's relays hold a safety copy so a single bad death does not cost you the
whole endgame path. These are HERMES-station verbs (RON's own system, off the AI
wire), free to use but spending relay charge like the other HERMES verbs.

- **`backup aikey` (HERMES relay only):** copies your held AI key into the RON
  relay mesh. **Persists across death** (rides the campaign save, not the
  regenerated world). RON keeping a copy off the AI's own hardware.
- **`restore aikey` (HERMES relay only):** if the mesh holds a backup and you are
  not carrying the key, mints a copy back into your pack. This is how you recover
  after losing it.

Symmetry with `copy`: `copy` copies the key OFF into an AI obelisk to spend it in
the language; `backup` copies it INTO RON's relay mesh to keep it. Towers let you
use it; relays let you not lose it.

Open: should `restore` cost charge, or be free (you already paid to `backup`)?
And is a restored key identical, or a fresh AI-key item? (Suggest: fresh item,
`restore` free, `backup` costs the charge.)

### Spares, and never decaying
Two more guards against losing the key:

- **Print spare copies.** Once `copy aikey` has brought the key into the OB
  session, `print aikey` drops a fresh physical AI key at your feet (the `print`
  verb already drops carryable items). Make duplicates, stash them apart.
  Requires `aikey` in scope, so you must hold and copy the real one first.
- **The AI key never decays on the ground.** It joins the critical-uniques set
  (like backpacks and other one-of-a-kind items, v0.91), so a placed or dropped
  key never rots — a stashed spare is a permanent stash.
- **Pickup toast teaches the copy.** Picking up an AI key fires a one-off toast
  pointing the player at the mechanic, e.g. *"AI key. Jack into an obelisk and
  `copy aikey` — then you can print spares and never lose it."* The mechanic is
  otherwise easy to never discover; the toast is the teaching moment.

How the three loss-guards divide the work: `print` spares hedge against dropping
one *mid-run*; never-decay makes those spares permanent in the world; HERMES
`backup` is the only one that survives *death* (world items, spares included, are
wiped when the run resets). They stack, but if HERMES death-recovery already
feels sufficient, `print` spares are just convenience — worth deciding whether
all three coexist or one is dropped.

### The fortress program is found, not given
The `copy`/`hack`/`decrypt`/`unlock` recipe is **not** taught by `help` or the
manual. It is a `kind: 'code'` lore fragment (extends §5's Fragments A–E as
Fragment F), **placed at random** in the world like the others, so the endgame
key is gated behind *reading the world*, not just holding an AI key. Draft, in
the operator-scrawl voice of the existing code fragments:

```
copy aikey
let k = hack OB-XXXX
let d = decrypt aikey
unlock k d
```
> "the gate won't take the key raw. copy it off your hand first so the console
> can hold it, then decrypt — the AI encrypts its own masters, force of habit —
> then unlock with the node's key and the clean one together. put the obelisk
> you're stood under where it says OB. burned three keys learning that. — M"

Placement: the random lore pool (`lore.js` `FRAGMENTS`, dealt into caches by
`_place`), same as any other fragment — no special guarantee, so a run that never
finds it has to piece the program together from the verb `help` lines. (Consider
a soft safety net: a HERMES `read` topic that hints at it, if playtests show it
is too easy to miss.)

### Persistent top-level `let` (the ML top-level)
The obelisk console is an ML top-level, not a one-shot line. A bare `let x = e`
(no `in`) evaluates `e`, **binds `x` for the rest of the terminal session**, and
echoes the binding (ML-style `val x = …`). So the fortress program can be entered
as three sequential lines that follow one another:

```ml
let k = hack OB-1A2B
let d = decrypt aikey
unlock k d
```

The single-expression form (`let … in … in …`) still works. Bindings live until
the terminal closes or resets. This is the one real evaluator change; everything
else is verb-level.

### Implementation touch-points
1. `ronml.js`: drop `requireAiKey` from `sleep`/`repel`/`rewind`; add `decrypt`,
   `copy`, and `name` (free, reads the current node from ctx); extend `print` to
   take `aikey` (drop a physical key copy when `aikey` is in scope); rework
   `unlock` to arity-2 (`k`, `d`). `crash` stays.
2. `ronml.js` + `main.js` REPL: a session environment that bare top-level `let`
   writes and later lines read; parser accepts `let x = e` with no `in` at the
   top level; echo `val x = …`.
3. Effect tuning for `sleep`/`repel`/`rewind` (radius/duration) in their ctx
   effect functions.
4. HERMES verbs: add `backup`/`restore` to `hermesCtx` (hermes.js verb set +
   the `HELP_VERBS` hermes rows), spending relay charge; a persisted
   `aikeyBackedUp` flag in the character/campaign save so it survives death.
5. Lore: add the fortress-program fragment (`kind: 'code'`, Fragment F) to
   `lore.js` `FRAGMENTS`, dealt at random by `_place` — no guaranteed placement.
   Also add the AI key to the critical-uniques never-decay set (items.js / the
   decay list, per v0.91), and fire a one-off pickup toast on the AI key (the
   pickup handler in player.js) pointing at `copy aikey`.
6. Help table, `read ronml` (hermes.js), the RON-ML manual (items.js), and §3/§4
   here updated to match.
