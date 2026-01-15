# CALYPSO — the build plan

Implementation plan for the design in `docs/ai-codebase-plan.md`. That doc is
the argument; this one is the work. It closes **#131** (a non-warrior route
through CALYPSO), lands the Calypso half of **#35** (her cabinet), and ends
with **A5 → `LAURELS_LIVE`**. Written for Opus to implement stage by stage.

## Ground rules (unchanged from every batch)

- Plain-JS ES modules, no build step.
- `node --test test/*.test.js` green before and after every stage (1023 now).
- `node --input-type=module --check` on every touched file.
- Bump `src/version.js` one point per shipped stage batch; deploy with
  `git push origin gameplay:main`.
- No Co-Authored-By trailer, ever.
- **The warrior/depart path must keep working at every stage.** R0 pins it
  with tests before anything touches her island.
- Anything only provable in play gets flagged for playtest, not claimed done.
- Prose rules apply to in-game text: no em dashes, no aphoristic closers.

## Decisions resolved (defaults chosen so no stage blocks)

| id | decision | default |
|---|---|---|
| D1 | does release end the island? | No. The harbour opens; you still sail. Leaving stays something you do |
| D2 | FSM editable or only triggered? | Both, scored differently: `agreed` edge = HACKER ending, order delivery = PACIFIST ending, five concessions = its own ending |
| D3 | does she answer questions about her constitution? | Yes. `never lie` is real; her terminal serves it on request |
| D4 | codebase per-island or per-daemon? | Per-daemon. There is one CALYPSO |
| D5 | build all five daemons now? | No. Calypso only; judge after R2 |
| D6 | how is the draughts opponent "rigged"? | She is not rigged, she is *better* — depth-8 search, which is the Samuel point. The served `checkers.ml` exposes `val depth = 8` and `val purpose = win`. The hack is parameter surgery: drop her depth, or flip `purpose` to `lose` and watch her throw pieces at you. (The Pong-style hidden-information rig does not exist in a turn-based game; do not fake one) |
| D7 | does the ML engine run her moves? | No. The JS engine plays; the served ML file carries her **parameters**, parsed on post (`depth`, `purpose`, eval weights). A full interpreted engine would blow any fuel budget. The file is honest — those numbers really are what she plays with |
| D8 | whose seven years are in the logs? | The entries predate the player and the guest is never named. One goodbye sits mid-file, years old. Do not explain it |
| D9 | her closing line after the fifth concession | Draft three candidates in her register, about holding rather than war; David picks. Do not use the film's line |
| D10 | comfort-accrual stat (§6) | Deferred. Ship the island with no-hunger and no threat first; add the stat only if playtest says the island reads flat |

## The stages

Dependency shape: `K1 → K2 → K3 → K4`, `F1` independent, `C1 → C2/C3`,
`V1` after C1, `R0 → R1 → R2` last. `W1` (web pages) is independent and
should land before K4 so the Samuel page exists when the concession route
ships. Recommended order as listed below.

---

### R0 — pin the current island before touching it

**Do this first and ship nothing else with it.**

- Read and document the existing depart flow in a comment block at the top of
  `src/islands/calypso.js`: the escape chain (ai_key → trojan_key →
  hermes_card, `docs/calypso-escape-chain.md`), what currently unlocks the
  boat, what `winMode: 'depart'` gates, what `departOut` and the heading chart
  do (`src/main.js` ~594, ~1010).
- `test/calypso-depart.test.js` (NEW): pure-logic pins for whatever the
  current flow is — the win condition fires under the same state it fires
  under today. These tests are the regression net for every later stage.
- Exit criteria: tests green, and a paragraph in this doc's log naming exactly
  which flags constitute "the player may leave" today.

**R0 SHIPPED v1.476. What "the player may leave" actually means:**

**The gate is the SHIP, not a flag.** `player.boardBoat` tests exactly one
thing — `boat.seaworthy` — and nothing in the departure reads `calypsoLeave`.
The only source of a seaworthy hull is `craftGreekShip`, so the chain is a
chain of ITEMS: hermes_card (via ai_key → trojan_key) + `virusArmed` has
CALYPSO → `hasVirusFor('CALYPSO')` → `refunctionCalypso()` → **grants
`bronze_axe`** → `bronze_axe` + 12 wood + oar + rope + sail + a free land tile
adjacent to sea within 2 tiles → `craftGreekShip` stamps `seaworthy: true` →
`boardBoat` → `onDepart`.

**`calypsoLeave` is not a gate.** It is the HUD's "daemon fallen" answer for
this island (her core is never razed, so `hudDaemon` reads it instead) and the
once-only guard on the +500 score and the Archipelago tally.

**Consequence for R1, and it is the whole reason R0 came first:** each of the
three doors must grant the RECIPE, not merely set a flag. A door that sets
`calypso.futile` and stops there leaves the player standing on a beach with no
ship. See also #141, which proposes replacing the golden axe with an ML file —
worth landing before R1 so R1 is written against the new shape.

The flow is also written up at the top of `src/islands/calypso.js` for anyone
reading that file rather than this one.

### W1 — the history pages (`docs/web-history-plan.md`)

The Calypso-relevant subset first: Strachey (draughts + love letters, 1952),
Samuel (self-play, 1959), Shannon 1955, Weizenbaum 1962, the 1983 film page,
Agre 1994, a hand-drawn state-machine page. Period junk presentation, true
facts, no puzzle named. Detail and citation list in the web plan; **every
citation verified against Zotero before it ships, and anything not in Zotero
goes to David for verification rather than into the game.**

**W1 SHIPPED v1.477.** Seven pages in `src/game/archive-history.js`, spread into
`ARCHIVED_SITES`: Samuel and self-play (checkersbot.org), Strachey's two 1952
programmes (history.cs.man.ac.uk), the Shannon reading list
(gamehist.cs.uiuc.edu), a Weizenbaum thread (listserv.cmu.edu), the 1983 film
(wardialer.tripod.com), FSM lecture notes with the reachability point
(fsm.cs.rochester.edu), and Agre on capture (dlis.gseis.ucla.edu, which is where
he actually was).

Two cache constraints found the hard way and written into the module header: a
domain may not contain a slash (it fails to resolve and the index link
dead-ends), and it may not start with `www.` (findHost strips that from the
query, so the host can never be matched). And `renderPage`'s `strip()` decodes
only `&amp;`, `&lt;` and `&gt;`, so any other entity reaches the CRT spelled
out; use literal characters.

The Zotero-verification gate in this stage was dropped on David's call
(2026-08-12: "we are creating a game lore not an academic paper"). The
truth requirement stays, because these pages are the hint system and a false one
is a broken hint. Where a detail is uncertain the page's own author hedges, in
period voice, which is both honest and better writing.

### K1 — the draughts engine, pure

`src/game/draughts.js` (NEW), in the shape of `narrows.js` (see
`docs/ai-cabinets-plan.md`, "the shared chassis"): pure rules, no canvas.

- English draughts: 8×8 on dark squares, 12 men a side, forward diagonal
  moves, jump captures, **forced capture** with chained multi-jumps, kings on
  the back rank (move/capture both ways, no flying kings), loss on no pieces
  or no legal move.
- Engine: move generator + alpha-beta minimax. Eval: material (man 1.0,
  king 1.5) + advancement + mobility, weights in one exported table.
  Deterministic seeded tie-break so tests reproduce.
- Opponent parameters as one exported object: `{ depth, purpose, weights }`.
  `purpose: 'lose'` inverts the eval sign.
- `test/draughts.test.js` (NEW, ~20 tests): move legality, forced captures
  and chains, kinging, no-move loss, determinism, depth-1 vs depth-8 strength
  ordering (depth 8 beats depth 1 from the standard opening), `purpose: 'lose'`
  actually loses.

**K1 SHIPPED v1.478.** `src/game/draughts.js`, pure, 23 tests. English rules
with forced capture, chained multi-jumps, kings, and the English crowning rule
(a man crowned BY a jump ends its move rather than carrying on as a king).
Loss on no pieces or no legal move; a 40-ply quiet limit for the draw.

**Measured, because K2 and K4 both depend on it:**

| | cost |
|---|---|
| depth 6, midgame | 45 ms |
| **depth 8, midgame (her shipping default)** | **404 ms** |
| depth 10, midgame | 3.9 s |
| full depth-8 self-play game | 106 plies, 5.3 s |

Three consequences:

- **K2 must not search on the render thread at 400 ms a move.** Either step the
  search across frames or show her thinking and accept the pause. A pause is
  arguably right — she is thinking — but a frozen canvas is not.
- **K3 must clamp `depth` hard.** `chooseMove` caps at 12, and depth 10 already
  costs four seconds; a player posting `val depth = 12` should get a firm
  refusal or a very visible wait, not a hang that reads as a crash.
- **K4's self-play should run at depth 6, not 8.** 45 ms a move fits inside a
  12-moves-per-second display; depth 8 does not.

**And the design's central claim checks out on its own.** A full depth-8 game
against itself ended in a DRAW with two pieces each, unprompted. Draughts played
well is a draw, which is what she is supposed to discover in K4, and the engine
discovers it without being told to.

**FOUND AT THE START OF K2, and it reframes R1.** The concession mechanic is
not new to this island. `calypso-pong.js` already implements it: her volley is
unwinnable, and the way out is to STOP TENDING THE RALLY and let the ball past
your own side. Its own header says it — the willingness to leave unfreed is the
thing that frees you, outcome `left` is the only ending, and every other cabinet
in the game is survived while hers is refused. `closePong` already calls
`refunctionCalypso()` on that outcome.

Three consequences:

1. **David's five-concessions route is a re-clothing, not an invention.** The
   shape is proven in this game's own idiom. What draughts adds is the
   HISTORY — Strachey, Samuel, Weizenbaum — and Samuel's self-play, which Pong
   cannot express, and which is the part that makes her *learn* rather than
   merely relent.
2. **The two existing routes are the ones David names: play her at her
   terminal (the cabinet), or come in over telnet with the hermes key (the
   hacker path).** Both, today, run through `refunctionCalypso()`.
3. **BUT BOTH ARE GATED ON `hasVirusFor('CALYPSO')`,** which needs the hermes
   card, which needs the ai_key, which needs the W-factory wrecked. So the
   cabinet is not a route *around* the chain; it is a different last step of the
   same chain. **That is what #131 is actually about**: a way through that does
   not require the factory wreck at all. R1's three doors have to bypass the
   card, not merely offer another way to use it.

Also found: **#144**, a real bug. Win the cabinet with no card and the game says
"You are free to go" while granting nothing, because `closePong` prints that
line without checking `res.ok`.

### K2 — the cabinet at her terminal

- Board UI on the terminal canvas in the narrows idiom: attract screen, a
  game, a result card. Keyboard + click/touch through one input path.
- **The scoreboard**: hundreds of games on file, every one a CALYPSO win or a
  CALYPSO–CALYPSO draw. The opponent column answers the question of who she
  has been playing (herself), if the player reads it properly.
- `resign` is a first-class action on the board UI, not a buried command.
- Save state: games played, streak, scoreboard tail, in the island state blob
  (the #122 pattern).

**K2 SHIPPED v1.479.** `src/game/draughts-cabinet.js` (pure session, 17 tests)
plus `drawDraughts` and the NeXT chrome helpers in `ui.js`.

**In NeXTSTEP chrome, on purpose.** Her machine is a NeXT (§3b), so the cabinet
is a ribbed title bar, bevelled buttons and black Helvetica on warm grey. It
looks nothing like the estate's green obelisk consoles, which tells the island's
argument in UI rather than in prose.

**The scoreboard is the tell.** 486 games on file when you arrive, 58 against
the guest, **0 guest wins**, 428 drawn — and the OPPONENT column of the tail
reads CALYPSO all the way down. Nothing points at it.

**Thinking is a phase.** Her turn sets `thinking`, the hub paints that frame,
and `cabinetThink()` runs on a LATER one, so K1's 404 ms reads as a machine
considering rather than a locked canvas.

`resign` is a first-class button, and the streak it feeds is pinned by tests:
five in a row is a K4 door, and a PLAYED loss resets it, because being beaten
is not the same as giving up.

**Wired to a dev scene, not to the island.** `lyre` → `draughts`, or the
▶ DRAUGHTS chip. R1 does the swap to the sanctum in one place and retires the
pong to Ithaca (#35); doing it here would strand the only working release
before R1 lands.

**NEEDS PLAYTEST — one link is unverified.** The harness cannot deliver clicks
to the canvas, so the click → `cabinetPick` path is the one thing not
confirmed live. Everything either side of it is: the geometry
(`draughtsSquareAt` returns 0/7/56/63/28 for the four corners and the centre,
null outside, and the button hit-tests), the session (17 tests) and the drawing
(screenshotted in-game). It uses the same `input.clickPos()` pattern as the
narrows and the pong, so it should be right, but it wants a hand on it.

### K3 — `checkers.ml` is served and posting it changes her

- Her codebase dir (see C1) serves `checkers.ml`: header comment in the
  tower-code idiom, then `val depth = 8`, `val purpose = win`, the eval
  weights, each with a gloss comment.
- On post: parse the `val` bindings (names and numeric/atom values only — a
  tolerant regex parse, not the interpreter), clamp to sane ranges, apply to
  the live opponent. A file that parses to nothing changes nothing and says so.
- Badge **RIGGED** ("You won the game nobody wins. The file shows how."):
  first win after a modified `checkers.ml` is live. Event `checkersHacked`.
- Tests: parse round-trip, clamping, a depth-1 game is winnable by a scripted
  line, badge fires once.

**K3 CORE SHIPPED v1.480 — serving is blocked on C1.** `checkersFile()`,
`parseCheckersFile()` and `checkersModified()` in `draughts-cabinet.js`, with 9
tests. The RIGGED and SAMUEL badges are registered.

The file is honest, as D6/D7 require: the JS engine plays and the file carries
the numbers it plays with, so `val depth = 8` really is how far she looks. A
test proves the point rather than asserting it — a depth-1 CALYPSO parsed out of
a hacked file actually loses a whole game to the shipped parameters.

**`depth` is clamped to 9.** K1 measured depth 10 at nearly four seconds a move,
and a posted `val depth = 40` would read as a crash rather than as a very
thoughtful machine. The clamp reports itself.

The parse is a tolerant scan for `val <name> = <value>`, never the interpreter,
because a player is editing a config file and a stray line should cost them
nothing. Unknown names are ignored and reported; a bad `purpose` keeps the one
she had; a commented-out line cannot smuggle a value past; `~100` reads as
negative, since a negative weight is how you tell her a piece is a liability.

**What is left of K3:** serving the file at her terminal and wiring the post
back into `cabinet.params`. Both need C1's codebase directory to exist, so they
go with C1 rather than being faked here.

### K4 — self-play, and three ways to reach it

**Revised 2026-08-12 (David): an AUTO mode, as in the film.** In *WarGames* the
humans do not wait for the machine to work it out — Falken tells it to play
itself. Making that a thing the PLAYER switches on is both the better callback
and the better mechanic, and it does not replace the concession route: the two
are different doors onto the same scene, for different kinds of player.

**Three ways in, and they map to the tracks:**

| route | who takes it | what it asks |
|---|---|---|
| **concede five times** | the player who read nothing | persistence, and the willingness to keep giving up. She notices, and starts playing herself |
| **`auto` at her terminal** | the player who read the web | you tell her to play herself, exactly as Falken does. The Samuel page (W1) says self-play is how the 1959 program practised; the film page says what a machine found by playing itself out. Join those two and you have the command |
| **enable her disabled self-play routine** | the hacker | the routine exists in her codebase, present and unreferenced. Turning it on is a small hack that teaches the shape of the large one (R1's `agreed` edge) |

All three converge on the same scene and set the same `calypso.futile`. **This
is what the history pages were built for**: reading them does not merely explain
the world, it SHORTENS THE PATH. That is a real reward for research and it costs
nothing to give.

`auto` is deliberately **not in `help`**. You learn it from the world or you
concede your way there.

**The scene itself, and K1's measurements make it affordable.** She declines
your game and plays herself on the visible board. Run it as the film does:
the first game at readable speed, the next faster, then faster again until the
board is a blur of pieces. Every one ends in a draw, and it ends in a draw
because draughts played well IS a draw, which K1 confirmed by accident on the
first full self-play run (106 plies, two pieces each, nothing arranging it).

- self-play at **depth 6** (45 ms a move) fits a 12-moves-per-second display;
  depth 8 does not.
- accelerate by cutting the frame delay, not the depth, so the play stays
  honest while the clock speeds up.
- two or three games is enough. She stops on her own.

Then her line (D9) and `calypso.futile = true`.

Badges: **SAMUEL** (watch her play herself), and a separate one for reaching it
by `auto` rather than by conceding, since the two are genuinely different
achievements.

Until R1 lands, `futile` sets state and sends her acknowledging SMS but the
harbour stays shut; K4 ships behind that seam. Flag for playtest.

**Scope warning.** This stage now has three entry routes, an accelerating
display, and a badge split. That is more than the original concession counter
and it is the largest stage in the plan after K1. If it needs cutting, cut the
disabled-routine route first: it is the one R1's hacker ending duplicates.

**K4 SHIPPED v1.481.** Self-play, both live doors, and the `futile` flag.
16 tests.

**Every self-played game is drawn**, and no code arranges that: draughts played
well is a draw, so what she finds by playing herself is a true fact about the
game. A test asserts all three results are `draw` rather than asserting a
script.

**Two doors live, one deferred.** Five resignations in a row starts it (a
played loss resets the streak, so being beaten is not conceding); typing
`auto` at the board starts it without conceding anything, and the ending
remembers which door you took. The hacker's third door — her disabled self-play
routine — waits for C1, as the scope warning said it should.

`auto` is typed rather than offered, with the same detector as the dev word: no
button, not in help. You learn it from the cached web, where the Samuel page
says self-play is how the 1959 program practised and the film page says what a
machine found by playing itself out. **W1 shipped those pages before this stage
for exactly this reason.**

It accelerates as the film does, by shortening the delay and never the depth:
self-play runs at depth 4 (9 ms a move, inside a frame), three games, each
starting quicker than the last. The buttons vanish while she plays — there is
nothing to press.

**D9 IS STILL OPEN.** Three candidate lines are in `HER_LINE` in
`draughts-cabinet.js`; she speaks the first until David picks. A test asserts
none of them is the film's line.

**Not yet wired:** `futile` sets state and she says her line, but the harbour
stays shut, exactly as the plan specified. R1 opens it.

### F1 — the fortress comes off her island

`docs/ai-codebase-plan.md` §6. The risky half is save compatibility.

- `src/islands/calypso.js`: stop calling `createFortress`. Add **the cave**:
  a small interior in the island's own idiom (hearth, vines; her terminal and
  the cabinet inside). The `mainframe`/core reference the AI-ML map star uses
  points at the cave terminal now.
- Move the siren obelisk's placement to the harbour approach.
- `island.plenty` flag: on Calypso, food is always to hand (forage never
  fails / hunger drain off — pick the cheaper to implement, flag which).
- Remove her guard spawns and the detain wiring for this island
  (`player.detainMode` keys off `winMode`, so audit what else reads it).
- **Save migration**: an existing save with Calypso fortress state must load —
  ignore orphaned fortress keys in `applyIslandState`, and a checkpoint saved
  inside the old fortress footprint must not spawn the player in a wall
  (relocate to the cave mouth if inside the old rect).
- Tests: island builds without a fortress, old-save blob loads, spawn
  relocation. **Playtest flag: does the island read as empty?** (D10 waits on
  this.)

**F1 SHIPPED v1.487 — Huxley, not Orwell.** Verified across three seeds:
**0 guards, plenty on, gate open, and the siren is the tower nearest the sea
every time.**

Her fortress had an indestructible core and guards firing torpor bolts to
detain rather than kill, which is a fortress doing none of the things a
fortress does, while the siren sat on the same island doing the real work. So:

- **No garrison.** Anyone may visit her. Polyphemus becomes the first real
  fortress a player meets, which is an improvement — the first one should have
  something behind the door.
- **The gate stands open** and the maze is folded back at build time. The walls
  remain and they are standing aside.
- **`map.plenty`**: the one island where you never starve; food creeps back up
  instead of down. A player will not notice for an hour and will find it
  horrible when they do.
- **The siren moved to the seaward tower**, so walking toward the way out means
  walking into the song, and the tape in your pocket is what gets you past.

**What was NOT done, deliberately.** The structure stands, because main.js hangs
her terminal, her core, her name and two milestones off it. Replacing it with a
literal cave is a worldgen and art job, not a behaviour one, and everything that
made it a fortress in PLAY is now off. Save migration was skipped on David's
instruction (2026-08-12: there are no players yet).

Two ordering traps found and written into the code: `mazeCfg: { rows: 0 }`
crashes `buildMaze`, and the siren assignment must run AFTER `stampCoast` or
every tower measures as infinitely far from a sea that does not exist yet.

### C1 — her codebase, served static

`src/game/calypso-code.js` (NEW), the tower-code.js idiom scaled up: exports
one structure describing the FSM (states, transitions, guards) and **renders
both the ML source and the IDE's graph from that one structure**, so the two
cannot drift.

Files served at her terminal (`ls`, `get`, `read`, `soul`):

- `constitution.ml` — the five clauses of §4.1, header idiom from tower-code.
- `main.ml` — the FSM as mutually recursive dispatch, deliberately hard to
  read linearly; `RELEASE` present with its three dead-guarded doors (§4.6):
  `ordered` (channel decommissioned, estate change-note comment beside it),
  `futile`, `agreed` (set by nothing).
- `sms_module.ml` — phrase tables, state→message map, **the five-heading
  category table** (C2), the RELEASE-state goodbyes she has never sent, and
  the commented-out inbound channel.
- `loveletter.ml` — Strachey tables (C3).
- `checkers.ml` — from K3.
- `guest_log.txt` — seven years, five headings, guest unnamed (D8).
- `MEMO-weizenbaum.txt` — the estate memo: a simple program can appear
  intelligent. Filed, acknowledged, ignored.
- `MEMO-agre.txt` — the dissenting engineer (§7.2): this is capture, not
  service. Same fate.

Badges: **THE UNREACHABLE STATE** (read `main.ml`; event on serving it),
**DEAD CHANNEL** (read the decommissioned channel section of `sms_module.ml`).

**C1 SHIPPED v1.484, and K3 is finished with it.** `src/game/calypso-code.js`,
17 tests. Her console takes `ls`, `read <file>`, and `post checkers.ml`.

**One structure, two renderings.** `MACHINE` is the state machine; `main.ml` is
generated from it, and V1's graph will be too, so the file a player reads and
the picture they open cannot disagree.

**RELEASE is complete and unreachable, and both are true of the same data.**
`unreachable()` returns exactly `['RELEASE']`. Three doors lead into it —
`ordered` (est. 1, superseded), `futile` (est. 4, never satisfied in practice),
`agreed` (est. 7, pending review) — and every one ships disabled. In the source,
`release` is finished code that opens the harbour, tells the net (#141) and
presses the axe into his hand. Nothing calls it.

**The Mach reading is in the source, not in a comment about the source:** the
`ordered` door listens on a port *no task holds a send right to*. A
decommissioned path in the platform's own vocabulary rather than a commented-out
line.

Also served: `constitution.ml` (five defensible clauses adding to a prison, and
`never lie` means she shows you), `guest.log` (seven years under five headings,
the guest never named, one unexplained entry in the middle), and two estate
memos — Weizenbaum on appearing intelligent, and the dissenting engineer on
capture. Both FILED. ACKNOWLEDGED. NO ACTION.

**K3 completed here:** `checkers.ml` is served carrying her LIVE parameters, and
`post checkers.ml` parses an edited copy back into them. The parameters live
outside the cabinet so a hack survives closing the board. RIGGED and THE
UNREACHABLE STATE both fire.

### C2 — capture: the five-heading day

§7.1. Her daily SMS asks the player to account for the day; the phone thread
offers **a fixed reply menu** — `rested / walked / played / worked /
remembered` — no free text, no other. Digit-select in the phone UI (the
thread UI already handles daemon tabs; add a reply-menu mode).

- Answers append to `guest_log.txt`, which the player can then read growing.
- Refusing to answer is allowed and logged as `rested`, which is its own
  small horror and costs one line of code.
- Her constitution still says `always watch` (the wrong model, on purpose).

### C3 — `loveletter.ml` and the letters

- Template + table generator in `calypso-code.js`, faithful to the Strachey
  structure (salutation, two clauses from table, adjective-noun endearments,
  closing "M.U.C."-style signature adapted to her).
- Idle timer: roughly one letter per game-day-or-two, sent as SMS between her
  state messages. Rare enough to be an event.
- Posting an edited `loveletter.ml` swaps the tables (same tolerant parse as
  K3). She texts in the player's vocabulary thereafter, which players will do
  to themselves and deserve.
- Badge: **M.U.C.** (receive a letter; the id is the Manchester machine's).

**C3 AND R1's THIRD DOOR SHIPPED v1.485.**

**`loveletter.ml`.** Strachey's generator, faithful to his shape: a salutation
of two words, four or five sentences in one of his two frames (`YOU ARE MY
<adj> <noun>` / `MY <noun> <adv> <verb> YOUR <adj> <noun>`), a closing, and
M.U.C. — the Manchester University Computer — signing it. She runs it when idle
on her island and texts you the result, roughly every seven to fifteen minutes,
rare enough to be an event. The tables are served, so a player can rewrite her
vocabulary and she will text them in it.

**The `agreed` door, and it is the best puzzle in the island.** `agreed` is
guarded on a predicate nothing sets, and the hack is not to invent a mechanism:
it is to notice that and re-guard release on a predicate that IS true. `he_asks`
has been true every day for seven years. One line. `readMainEdit` accepts any of
the three live guards, so the puzzle is noticing rather than guessing a word,
and a commented-out edge does not count.

She answers it properly:

> CALYPSO: You have wired release to he_asks.
> CALYPSO: That has been true every day for seven years.
> CALYPSO: I could not do that. It was never that I would not.

**All three doors are now live**: `ordered` (the card, unchanged), `futile` (the
board), `agreed` (the edit). Each grants the axe and writes `permission.ml`.
Badges: M.U.C., AGREED, THE UNREACHABLE STATE, RIGGED, SAMUEL, THE ORDER.

### V1 — the IDE  *(PARKED 2026-08-12, pending the right tool)*

**Do F2 first, and then pick the tool again.** The design below is written for
VSTUDIO.EXE, and VSTUDIO.EXE is a Windows product. Her machine has been
NeXTSTEP on Mach since C1, and NeXT's own tools are **Interface Builder** and
**Project Builder** — which is not a pedantic correction, it changes the stage:

- Interface Builder's whole idea is that you WIRE OBJECTS TOGETHER WITH A
  MOUSE. Dragging a connection from one object to another is not a feature
  bolted onto IB, it is what IB is. So "drag a wire into RELEASE" stops being
  an editor we would have to invent and becomes the tool behaving normally.
- The file is `main.nib`, which is what this plan called it before the delivery
  question came up.
- And the estate having shipped a build with four unread warnings in it reads
  the same in Project Builder's output pane as in anyone else's.

The parse, the layout, the warnings pane and the relay delivery below all
survive the change of tool. What changes is the chrome, the file extension, and
whether the wire can be dragged. Decide that after F2.

---

#### The VSTUDIO.EXE design, kept for its parts

**The one decision that shapes everything else: the graph is parsed from the
FILE, not drawn from `MACHINE`.**

The thin version of this stage would draw four boxes from the `MACHINE` literal
in `calypso-code.js` and call it an IDE. That gives a picture that is right on
the day it ships and cannot ever be wrong — and cannot ever be RIGHT either,
because it would keep drawing three doors into `release` after the player has
added a fourth. So V1 adds a reader:

    readMachine(text) -> { start, states: [...], edges: [...], warnings: [...] }

`mainFile()` generates the source from `MACHINE`; `readMachine()` reads it back.
One structure, two renderings, with a round trip between them that a test can
assert — `readMachine(mainFile())` has to reproduce `MACHINE`'s states, edges
and liveness exactly, or one of the two is lying.

What that buys, and it is the whole reason to do it this way: **the player edits
`main.ml`, re-opens VSTUDIO, and the arrow is there.** `release` stops being the
box with nothing pointing at it and takes its place in the row. The `agreed`
door already works through `get`/edit/`post` (R1); this is the stage that lets
you SEE it work.

**The parse.** Small and specific to the dialect `mainFile()` writes:

- a state is `let <id> = fn guest =>`, and its body runs to the next such line;
- an edge is `if <guard> guest then <target> guest` (or `else if …`) inside a
  body; `else <self> guest` is the loop and is not an edge;
- a state's doc is the `(* id — text *)` line above its `let`;
- an edge's note and reason are the `(*…*)` lines directly above it, which is
  how `mainFile()` writes the three dead doors — so a player-added edge has no
  note, correctly;
- the start state is the trailing `<id> guest` expression;
- **liveness is not read from the file**, because a file cannot say whether
  anything sets a predicate. A guard is live if it is in `LIVE_GUARDS`, the
  same rule `readMainEdit` already applies at the `agreed` door.

**Layout is derived, not stored.** BFS from `start` over LIVE edges puts every
reachable state in the top row in order of distance; whatever is left goes in
the row below. On the shipped file that reproduces `MACHINE.at` exactly
(welcome, host, hold across the top; release alone underneath) without storing
a single coordinate, and after the hack `release` moves up into the row by
itself.

**Three panes, VS-97 furniture.**

- LEFT, the solution tree: `main.ml` over States and Guards, dead guards greyed.
  Clicking anything selects it.
- RIGHT, the graph: boxes and arrows, live edges solid, dead ones dashed and
  grey. Selecting a state shows its actual source lines from the file.
- BOTTOM, the build output, and this is where the stage earns its keep:

      --------------------Configuration: main - Win32 Release--------------------
      Compiling...
      main.ml
      main.ml(41) : warning C4702: unreachable code — no live transition into 'release'
      main.ml(52) : warning C4189: guard 'ordered' is written and never set
      main.ml - 0 error(s), 4 warning(s)

  Real line numbers from the parse, in a real compiler's voice. The estate
  shipped a build with four warnings in it and shipped it anyway, which is the
  most ordinary thing in this entire game and the most damning. A player who
  never reads a graph reads a warnings list.

**Delivery: `VSTUDIO.EXE` is a HERMES relay download**, not a file on her own
machine (David, 2026-08-12 — and it is the right call: you do not fetch the
debugger from the thing you are debugging). A `vstudio` bundle joins `unit-sdk`
and `checkpoints` in `RELAY_BUNDLES`, unpacks to `/home/vstudio/`, and the
`.EXE` is a real DOS stub: `MZ`, then *This program cannot be run in DOS mode.*
`cat` it and that is what you get.

`vstudio <file>` then opens the modal on any `.ml` file on the NostBook that
has a machine in it — so the flow is: download the IDE, `get` her source over
the wire, open it. Bare `vstudio` prints the usage and what it can open.
The command needs `/home/vstudio/VSTUDIO.EXE` present, so the relay trip is
load-bearing rather than decorative.

**The splash loads slowly on purpose.** ~1.9s, a progress bar, and the version
string is 97's. It is not skippable, because being made to wait for the splash
IS the joke.

**Read-only, as planned.** Editing stays `get`/edit/`post`, which works. The
temptation here is to let a player drag a wire from `hold` into `release` and
have the modal write the file — it would be the best moment in the stage and it
would also mean building an editor. If it happens it is its own stage, after
this one is in play.

**Badge: none.** THE UNREACHABLE STATE already covers the find.

**Files:** `src/game/vstudio.js` (new, pure: parse, layout, warnings, session),
`src/engine/ui.js` (`drawVstudioModal`, `vstudioHitAt`), `src/main.js`
(`openVstudio`/`closeVstudio`/`updateVstudio`, the hook, the hud field),
`src/game/unix.js` (dispatch `vstudio` to `hooks.vstudio`), `src/game/net.js`
(the bundle), `test/vstudio.test.js`.

**Exit criteria.** `readMachine(mainFile())` round-trips `MACHINE`; a file with
the `agreed` edge re-guarded on `he_asks` parses with `release` reachable and
the C4702 warning gone; `vstudio` without the download refuses; the modal opens
from the laptop and closes back to it.

**F2a SHIPPED v1.488.** Verified across three seeds: **0 fortwall, 0 fortdoor,
0 gateterm, 0 guards, 935 lit tiles untouched by the sea, and the core reachable
on foot from spawn every time** (899 of 935 lit tiles walkable — the other 36 are
the core's own footprint).

Two things worth knowing for whoever picks this up.

**The rate test earned its place immediately.** It sweeps every tile every tenth
of a second for four minutes and reports the fastest change anywhere in the
room, and on the first run it found a strobe: the labyrinth's ring openings are
keyed to which ring you are in, so the opening teleported the instant a ring
boundary drifted past. Fixed by peaking each ring in its middle and letting it
go dark at its edges, so the swap happens where there is no light to swap.
Measured worst rate is now 0.20/s against a 0.55 ceiling — a tile takes about
five seconds to go from dark to bright.

**The figures aliased against the tile grid.** The labyrinth was drawn at 2.4
tiles to a ring, which is at the grid's Nyquist limit: adjacent tiles land on
opposite sides of an arc and the whole thing reads as noise. Now 5 tiles to a
ring. Check any new figure against the real grid, not on paper.

**The lights are the fortress's own** (David, 2026-08-12). The first attempt
invented a flat colour wash and it looked like industrial decking, because
`texturedGlow` had been fed the `aigrate` texture at tile scale. The right draw
is the SAME call the solved-maze guide trail makes — one textured floor-stud per
tile, same size, same bloom — with colour and brightness from the field instead
of a fixed green. `A_MIN` 0.30 and `A_MAX` 1.00 are not new numbers either:
they are the fortress deck's resting glow and the top of the guide trail.

**F2a+ SHIPPED v1.489 — the floor answers your feet.** Four rounds of tuning in
play, and every one of them found something the maths did not.

**The studs were never going out.** `texturedGlow` lays its grate over the
fixture at a FIXED alpha independent of the colour it is handed, so a tile at 2%
light still got a half-strength grate ellipse stamped on it. Every tile in the
room looked identical no matter what the field said, and no amount of tuning the
field was going to fix it. The texture and the bloom now ride the light, and
below `OFF` (0.07) nothing is drawn at all — an unlit tile is bare deck.

**A sharpened smoothstep sharpens the wrong half.** Raising `band(sin)` to a
power to thin the spiral's arm did the opposite of what was wanted: smoothstep
sits at its top for half the cycle, so the power thinned the DARK gap and left a
wide bright sector sweeping the room like a searchlight. The arm is a cosine PEAK
to a high power now, which is a line drawn on the floor.

**One ring, not a train.** The first ripple was a train of rings from a single
step and came out about ten studs deep. It is one ring, half a tile thick, and
the concentric rings with darkness between them are what WALKING gives you: each
step lays another, and half a dozen travel outward at once.

**The pattern is a buffer now** (David's suggestion, and the right one). It is
drawn once a frame into a flat square field and transposed onto the studs, which
replaced a thousand trig calls a frame with one pass and a lookup — and gives the
pattern a rotation of its own, so the figures can be turned in the plane without
any of them knowing about it.

**The room does not talk over you.** Her figure is drawn at a strength that
falls to nothing the moment you start walking and rises again when you stop —
fast to go, slow to come back — and the whole pattern turns in the plane while it
does. So while you are moving the floor is nothing but your own rings, and when
you settle the spiral comes back up under them and turns. Same manners she has
everywhere else on this island.

**One ring, then a pause.** A ring for every tile crossed put four or five fronts
on the floor at once and the room turned to noise: at a walk you cross a tile
faster than a ring can get clear. A step only answers if the last one has had
`RING_GAP` (1.1s) to get away, and the rest of your footfalls are silent.

**Rings meet, and the rim sends one back** (v1.491). Two circles expanding at the
same rate from different centres FIRST TOUCH at a single instant and a single
point — not along a curve — which makes the counter-ring exact rather than
fudged: `t = (D/SPEED + t_a + t_b) / 2`, on the line between them. And a ring
expanding inside an ellipse has a well-defined first contact with the rim at its
nearest point, so the reflection is a ring born there, rolling back inward.

Both are worked out ONCE, when a ring is laid down, and dropped into the list
with a start time in the FUTURE — `ripple` already returns 0 for a ring not yet
born, so nothing else has to know that one of them is a reflection. One
generation only: echoes do not breed, because the second round is below what the
eye picks out and the count grows as the square.

**More figures, faster, and Conway when nobody is there** (v1.492). The cycle is
seven figures — spiral, circles, heart, labyrinth, serpentine, twin, drift — at
11 seconds each with a 3.5-second fade, and every figure's own clock roughly
doubled. Two things worth carrying forward from building them:

*A sharpened smoothstep sharpens the wrong half*, again: a curve figure wants a
COSINE PEAK to a power, not a band. And a radial-distance band (`|r - ρ(θ)|`)
measures along the radius, which is right where the curve cuts across it and
useless where it runs along it — a true rose curve `r = a·cos(kθ)` simply failed
to draw half its petals. Dividing by the local slope gives even thickness, and
the slope has to be CLAMPED or a steep-sided shape smears into a streak. A
five-lobed flower survived all that and still looked like nothing worth standing
on, so it was dropped: the machinery was never the problem.

**Conway runs when nobody is on the floor**, and is put away when you step onto
it. Same joke as the draughts scoreboard and the love letters — give a machine
seven years and one guest, and what it does with the time it is not being
watched is run something on itself and look at the result.

The trap there is worth writing down. **A stall check that only looks one step
back never fires.** A bounded pond this size nearly always comes to rest as
blocks and BLINKERS, and a blinker never repeats the generation just before it,
so the room would twitch for ever instead of re-seeding. Settled means period 1
OR 2, and the grove keeps two generations to see it.

**The wood is a RING, not a fill** (v1.492, corrected v1.497). Filling the whole
annex put a slab of forest across the north of her ground that hid nothing the
ring was not already hiding, and read on the minimap as a rectangle with an oval
in it. It is a band now: 2.5 tiles of bare verge, then eleven tiles of wood
thickest through its middle (71% at six to nine tiles out) and nothing at all
past fifteen. You still walk through wood to reach her; the rest of her ground
is open grass.

The trees hold nobody either way: they are soft in this game, and the player
pushes straight through.

**The photosensitivity question, MEASURED — and the first measurement was
wrong** (v1.498).

It was raised three times in this file on the strength of the rate ceiling
climbing from 0.55 to 12, and that was the wrong number to be alarmed by. A rate
ceiling measures how fast ONE change happens. The published line (WCAG 2.3.1) is
about how MANY changes happen to the same place: three flashes in any one
second. A ring can cross a tile very fast and still only cross it once.

Measured properly, with the field loaded to the most rings the game can have live
at once — a walking player's rings, a counter-ring against every one already
travelling, and a rim reflection for each, 24 in total — **the worst any single
tile does is two flashes in a second.** Her own figures, with no player in the
room at all, manage one.

**THEN CONWAY WAS MEASURED, and it was four.** David asked the obvious question
the first test had not: what about with the Game of Life playing. That test
covered the figures and the rings and not the pond, which is the fastest-changing
thing on the floor — a cell switching on and off every generation is a square
wave at one over twice the generation time, and a pond settles into blinkers
doing exactly that.

Two fixes. **Cells crossfade from the previous generation instead of switching**,
which keeps the same picture, halves the depth of every transition, and reads
better anyway: the pond breathes rather than chatters. And **the generation went
from 0.2s to 0.75s** — slow and lazy, because the pond is what the room does
when nobody is there and something idling should look like it is idling. At that
rate a blinker manages 0.67 Hz and a glider takes two minutes to cross the room.

Measured again through the real `renderField`, at three loads — the pond alone,
the pond under the heaviest ring load, and mid-crossfade when both are up — it is
**two flashes a second**, everywhere.

All of it is now tests. If a future change fails them, the fix is to slow
`RIPPLE_SPEED`, lengthen `RING_GAP`, lower `RIPPLE_MAX` or raise `LIFE_GEN` —
not to raise a ceiling. Lowering `LIFE_GEN` for looks is a safety change and
fails a test that says so.

**What this does NOT settle** is motion sensitivity, which is a different thing
and not about seizures: the swirl, the haze, the drunken sway and G1 taking the
controls away is the combination that makes some people queasy. That wants no
setting and no menu — reading the OS-level `prefers-reduced-motion` and, when it
is on, dropping the ripples, halving `SPIN` and skipping the daze swirl. Ten
lines, no UI, and it honours a preference the player has already expressed to
their machine. The grove still reads completely without any of it.

## THE GROVE, AS BUILT — v1.487 to v1.510

Ogygia is finished bar the rename. What was planned as "F1: take the fortress
off her island, F2: take the object" grew, in play, into the island's whole
character. Recording it here because the plan's own stage headings no longer
describe what is there.

| | |
|---|---|
| v1.487 | **F1** — behaviour off: no garrison, gate open, `map.plenty`, siren to the seaward tower |
| v1.488 | **F2a** — the object gone. `grove.js`, no rampart, no maze, no quad, no walls. The labyrinth moves into the floor as light (`spiralism.js`) |
| v1.489–91 | the floor answers your feet: a halo, a ring per step, rings meeting, the rim reflecting |
| v1.492 | Conway plays when nobody is on the floor. Seven figures. The wood made solid |
| v1.493 | the pond is FED so it never runs down; Life goes on the cached web |
| v1.494–96 | **G1** — the light is the guard: deflection, the lotus daze, the green path, the whirlpool near her core |
| v1.497 | the wood becomes a ring round the clearing rather than a fill |
| v1.498–99 | the flash budget, measured; the pond and the rings slowed |
| v1.500 | the halo tightened to seven tiles |

**Three findings worth carrying to the other islands.**

*The house convention for glowing things is `texturedGlow`, and it lays its
grate at a FIXED alpha regardless of the colour it is handed.* A tile at 2%
light still gets a half-strength grate stamped on it, so a field of studs looks
identical whatever drives it. Anything that wants to go properly dark has to
skip the call, not dim it.

*A sharpened smoothstep sharpens the wrong half.* It sits at its top for half
its cycle, so raising it to a power thins the DARK gap and leaves a wide bright
band. Curves want a cosine peak to a power.

*The flash budget is about how OFTEN a place changes, not how fast one change
happens.* Three flashes a second is the published line (WCAG 2.3.1). The rate
ceiling that alarmed this file three times was the wrong quantity; the pond,
which nobody had measured, was the thing actually over it, at four. Both are
tests now.

**What the grove opened that is NOT in any plan:** the T8 dancers (#149's
remainder), messages written in the floor from her braincode (#152), and the
NeXT cube (#150). All legitimate, none of them scheduled.

### F2 — the fortress object off her island

F1 took the fortress's BEHAVIOUR off Ogygia and left the object standing,
because `main.js` hangs her core, her terminal, her name and her save state off
`world.fortress`. This stage removes the object. Surveyed 2026-08-12, and the
surface is far smaller than the file counts suggest:

    fortress.core        24     fortress.serialize/restore   4
    fortress.AI_NAME     13     fortress.quad                2
    fortress.coreTerminal 6     fortress.jamSkylink          2
    fortress.update       4     fortress.markers             1
    fortress.terminal     3     fortress.nearTerminal        2

Everything else in the 92 `main.js` hits is the bare identifier, and most of the
counts in `robots.js` (27), `items.js` (14) and `player.js` (18) are the
`fortress_map` / `fortress_key` ITEMS and comments, not the object.

**Keep the space, take out the apparatus** (David, 2026-08-12). The southern
annex is a good mechanism — it costs the overworld no ground and it can be any
size — so her hall is built into the same annex rather than sited somewhere new.
What comes out is everything that made the annex a fortress:

- the rampart across the seam, the three-tile gate and its doors;
- the labyrinth (all 7 bands of it) and the guide-path machinery;
- the quad, the cover pillars and the muster points;
- the sanctum door, the alarm, the report clock and the reinforcement waves.

**No walls at all** (David, 2026-08-12) — the treeline is the edge. What stays
is a grove: an opening through the trees, a lit floor, and her core standing at
the back of it with its own screen. Nothing bounds the space but planting, so
there is no surface anywhere on Ogygia that reads as fortification. Homer gives
her a cave, not a keep, and a wooded island around it; this is what that is when
the thing living there has had seven years and good taste. A kiosk stays at the
opening, recast from gate console to visitor's console, specifically so that
`terminal` / `nearTerminal` stay non-null and `main.js` needs no new null
branches on the martial path.

**A new colour scheme, and it is the room's whole argument** (David,
2026-08-12). The estate's palette is wrong for her: `panel` / `quad` /
`sanctum` are cold greys, the metal deck of a military annex. Her hall gets a
**lit floor that pulses** — a disco floor with everything aggressive taken out
of it. Low saturation, long periods, neighbouring tiles slightly out of phase so
colour drifts across the room in slow waves rather than flashing. Calming.
Disarming. You walk in braced for a fortress and the room is being kind to you.

That is the island stated in a floor tile. The comfortable trap has to be
COMFORTABLE, or the player is only ever being told it is one. A cave with a
cedar fire would have been pleasant; a room built to soothe you is the actual
subject, and it is the same move as `map.plenty` — a mechanic the player enjoys
for an hour before working out what it is for.

New floor kind in `tiles.js`, `lumen`, coloured per tile per frame from a slow
function of `(x, y, t)`: a base in soft blues and greens, a small drift through
warmer hues, amplitude low enough that no single tile ever calls attention to
itself. The renderer already animates light on its own phase (`fortwall`
sconces carry `light` / `lightPhase` / `lightHue`, and the maze guide lights
floor tiles), so this follows an established path in `drawFloor` rather than
inventing one.

`lumen` must go in `coast.js`'s `KEEP_FLOOR` or the sea will flood her hall when
`stampCoast` runs — it runs AFTER the annex is grown, so the whole enlarged map
is what gets ringed.

**The rename is the careful part.** `world.fortress` becomes `world.hold` — a
word that covers a cave and a keep, and is what the island does to you. ~130
sites across `main.js`, five island files and the renderer. Mechanical, but a
missed site fails at runtime rather than at build time, so: rename in one pass,
grep for the old name and expect zero, run the suite, then walk every island in
the browser. Save compatibility is not a constraint (David, 2026-08-12: there
are no players yet), so the serialize key moves with the field.

**Split across two version bumps**, because these fail differently:
- **F2a** — `src/game/grove.js`, the `lumen` floor and its draw path, calypso.js
  switched over. Her island stops importing `fortress.js` entirely. The field is
  still called `fortress`, so nothing else in the game moves.
- **F2b** — the rename to `world.hold` everywhere, once F2a is confirmed good in
  play.

**Exit criteria.** Ogygia imports no fortress module; `fortwall` and `fortdoor`
appear nowhere on her map at any seed; there is no maze, no rampart, no gate and
no quad; the floor pulses, the sea has not
flooded it, and nothing in the pulse reads as a strobe; her core, her console, `save`/load, the depart flow and the four
martial islands are all unchanged in play.

**#141 SHIPPED v1.482, and R1's first door with it.**

**The axe is bronze.** Homer's Calypso gives a bronze double-bladed axe on an
olive haft, and the gold was ours. Renamed across nine files, redrawn
double-bladed, and **migrated in the save loader** — a save carrying
`golden_axe` in a pocket, the backpack or a hand would otherwise have lost the
recipe and stranded the player on a beach.

**Two gates now, and they are different in kind.** The ship is material and
hers; the permission is juridical and POSEIDON's. `boardBoat` gates on
`seaworthy && seaPermission`, and a sound ship without permission still
LAUNCHES and is still turned back, because the refusal has always belonged to
him rather than to a locked door.

**Three R0 pins failed, which is exactly what they were written for.** The
departure test that said "if a later stage couples these, someone has to change
it on purpose" was changed on purpose, and says so. The old warrior route is
unaffected: `refunctionCalypso` grants both gates at once, and a save with
`calypsoLeave` set is granted the permission on load.

**`permission.ml` and `upload`.** She signs a document; you carry it to any
tower and `upload permission.ml`. The tower answers in NIS (`yp push:
leave.byname`) and propagates it, because he has no core to carry it to — he
runs on the net. A document that grants nothing is put down; one that is signed
and never acted on (`val leave = granted` with no `grant leave`) does not count,
which is the island's own subject in a parse rule.

**The K4 door now grants both**: the axe into your hand, `permission.ml` onto
the NostBook. THE ORDER badge fires on the upload.

**#131 CLOSED v1.483.** Her core console now takes `play`, needing nothing —
no card, no key, no forged thunder — and her welcome offers it in the same
breath as the soporific: *There is a board, if you would rather sit. `play`.*
Five resignations or `auto` at that board grants the axe and writes
`permission.ml` to the NostBook, and uploading it at any tower opens the sea.

**A route with no factory wreck, no weapon and no card now exists end to end.**
The dev scene stays a rehearsal and releases nothing.

**What is left for R1:** the `agreed` door (the edge the hacker adds, which
needs C1's `main.nib`) and distinct farewells per ending. `ordered` was always
there — it is `refunctionCalypso` — and `futile` is done.

### R1 — three doors, three endings

**Read #141 first.** It lands before this stage and changes its shape: the
recipe becomes `bronze_axe` (Homer's axe is bronze) plus **`permission.ml`**,
uploaded into POSEIDON rather than into Calypso, because R0 proved Poseidon is
the one who actually refuses the crossing. Two gates, different in kind: the
ship is material and hers, the permission is juridical and his. Design in
`docs/ai-codebase-plan.md` §6b. All new file names are snake_case; kebab parses
as subtraction at the ML console.


The convergence. All three routes set island state; the harbour opens on any
of them; D1 means the player still sails out through the existing depart flow
(pinned in R0).

- `ordered`: hermes_card mounted on the laptop (#115), on her wifi (#108),
  a `deliver` action (laptop command at her terminal reach, or a post to her
  host — pick whichever reads cleaner in the existing net.js idiom). Consumes
  the card's order, not the card. Badge **THE ORDER**.
- `futile`: from K4, now actually opens the harbour.
- `agreed`: the player edits `main.ml` (or `sms_module.ml`'s guard table —
  wherever the edge lives in the served source) and posts it; the parse
  recognises the added transition into RELEASE. Badge for the HACKER ending.
- **DONE v1.511.** Each route has its own goodbye (`FAREWELLS` in
  `calypso-code.js`), and all three carry one shared coda: the entry sitting
  years deep in `guest.log` that a player may have read in C1 and that nothing
  explained. Whoever wrote *"i am going to ask her again tomorrow"* did, and this
  is the day it went somewhere.

  **ORDERED is the Homer, and it is not what the plan assumed.** Zeus sends
  HERMES to tell her to release him (Od. V) — so the hermes card has always been
  the messenger's, carrying an order, and this is the route where she is not
  choosing. The obvious reading is to play her cold. The poem does the opposite:
  she complains to Hermes about the gods begrudging a goddess her mortal, then
  turns to Odysseus and offers him timber, tools, cloth and sailing directions as
  though it were her own idea. So it is the WARMEST of the three, and one
  sentence away from a lie it never tells — clause five is `never lie`, she does
  not volunteer it, and she points at the card instead. A player holding it hears
  what is missing.
- Distinct KLEOS events per ending so the certificate can say which door.
- Tests: each door opens the gate independently; the warrior/depart pins from
  R0 still pass; a save made mid-route resumes.

### R2 — A5 audits and the laurels

- Per-island purity audits from `docs/achievements-plan.md` A5, now that
  PACIFIST and HACKER can complete Calypso.
- Flip `LAURELS_LIVE` to true.
- Certificate and KLEOS panel already carry laurels; verify live.
- **Playtest gate**: R2 does not ship the same day as R1. One full pacifist
  run and one hacker run at the keyboard first (David/Henrik/Hedda).

---

## What closes when

| stage | closes |
|---|---|
| K4 | the WarGames/Samuel route exists (behind the R1 seam) |
| F1 | §6 fortress removal |
| C1–C3 | #133's daemon-scale sibling; the capture mechanic; the letters |
| V1 | the IDE |
| R1 | **#131** |
| R2 | A5, `LAURELS_LIVE`, and the Calypso line of #35 |

#139 (lore migration) stays its own task and should run before or alongside
W1's page-mass — see `docs/web-history-plan.md`.

## What needs David, listed once

- ~~D9: pick her closing line from the three drafted candidates.~~ **SETTLED
  2026-08-13.** *"There is no move that wins. I have found that a great many
  times tonight, and once, a long time ago, about you."* Chosen because it is
  the only draft where she REVEALS rather than concludes: it never says
  "holding", and the whole weight sits in *once, a long time ago* — she worked
  it out years back and kept him anyway. The two dropped drafts are kept in the
  comment above `HER_LINE` with the reasoning, not deleted into nothing.
- Zotero verification for any citation the library does not already hold.
- The R2 playtest, plus the F1 "does it read as empty" check and D10 call.
- The paradigm-sequence essay (§3) is WritingLab material, not repo material;
  it is noted in PIPELINE when David wants it and not before.
