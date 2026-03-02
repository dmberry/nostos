# Structure audit, 2026-08-14 (v1.541)

Answering one question: does `main.js`, or anything else, need refactoring?

Numbers from `node tools/structure.mjs`. Re-run it rather than quoting this
file; the figures were true on the day and `main.js` moves daily.

## The measurement

107 files, 72,779 lines, of which 50,099 are code and 19,062 comment (26%).

| file | total | code | cmt | fns | module-level `let`/`var` |
|---|---|---|---|---|---|
| `main.js` | 11,493 | 7,762 | 29% | 600 | **127** |
| `engine/renderer.js` | 5,859 | 4,135 | 26% | 188 | 1 |
| `engine/ui.js` | 4,233 | 3,169 | 20% | 127 | 0 |
| `game/robots.js` | 3,966 | 2,321 | 35% | 230 | 5 |
| `game/player.js` | 3,310 | 2,124 | 31% | 143 | 0 |
| `game/unix.js` | 2,535 | 2,047 | 14% | 52 | 0 |

Longest functions: `lang/parse.js:121 parse` (1,614), `main.js:10049 update`
(1,247), `renderer.js:4497 drawItemIcon` (978), `mobile-gate.js:67
initMobileGate` (807), `ai_ml.js:154 makeBuiltins` (776).

Repeated code: 14 distinct clone sites at 8+ identical lines, across 50,099
lines. The largest are a Fisher-Yates shuffle shared by `animals.js` and
`waterdroids.js`, an ammo lookup twice inside `combat.js`, an attack-timer
decrement three times inside `robots.js`, a `nearRoad` field twice in
`worldgen.js`, and the island scaffolding shared by the four `islands/*` files.
Copy-paste is not a problem in this codebase and nothing here is worth a pass of
its own.

## The finding

`main.js` cannot be imported. Line 127 is `const canvas =
document.getElementById('game')`, and there are 95 bare calls at the top level.
It is a script, not a module: importing it in Node throws before the first
declaration is reached.

No test imports it. `test/imports.test.js` and `test/module-syntax.test.js` read
it as text. So **7,762 lines, 15.5% of all the code in `src/`, sit where the
1,270-test suite cannot reach**, and the only way to exercise any of it is to
open a browser and play to the right state.

That is the same shape as the incident recorded at the head of
`tools/sweep.mjs`: v1.332 used two names in `main.js` without importing them and
shipped, because the only check was a hand-run tool and no test loads the file.

So the answer is yes for `main.js` and no for everything else, and the reason is
coverage rather than size. The measure of a successful pass is code lines moved
behind the suite, not lines removed from `main.js`.

### Why it resists

- **127 module-level mutable bindings.** Every one is reassigned somewhere; none
  is effectively a constant. `renderer.js` has 1 and `ui.js` has 0 at the same
  order of size, which is why the `ui.js` split was mechanical.
- **`update(dt)` is 1,247 lines** with 254 `if`/`else if` and 16 early returns.
  It is the mode sequencer, so length is partly inherent, but 20 of its
  statements are direct `updateX(...)`/`tickX(...)` calls that the systems
  registry was built to take.
- **The file's own section headers do not partition it.** The frame loop's
  constants (`STEP`, `last`, `acc`, `fps`, `MIN_RENDER_MS`, `lastRenderTime`,
  `_firstFramePainted`) are declared at L3555-3567, 800 lines inside the section
  headed `HERMES test console`. Any measurement that trusts the headers reports
  those as HERMES leaking into the frame loop.

### What can move, in order

Cohesion measured as the share of a section's declared names used outside it.

| section | size | leak | note |
|---|---|---|---|
| the wireless applet in the status tray | 92 | 13% | smallest real candidate |
| RON's scope | 184 | 20% | |
| pico(1) | 274 | 30% | one state bag, `edState` |
| the control verbs' side of the wire | 341 | 33% | leaks `printedDocs`, `HERMES_BATT` |
| HERMES test console | 902 | 27% | biggest single win; move the frame loop out from under its header first |
| the menu bar | 454 | 41% | |

Name clusters tell the same story from the other side. `notebook*` is 14
declarations inside a 383-line span with a median gap of 1 line, already a block.
`ns*` (Netscape) is 24 declarations with a median gap of 4. Against those,
`laptop*` is 38 declarations spread over 5,404 lines, `ob*` is 22 over 6,055, and
`ws*` is 8 over 8,682; those three would drag the file behind them and should be
left until the rest has gone.

### The registry programme

`docs/refactor-registry.md` describes Stages 0-3 as living on branch
`refactor/systems-registry` in worktree `~/Projects/nostos-registry`, with
"Nothing is on `main`". Both the branch and the worktree are gone, and the work
did land: `systems.js` is on `main` and five features self-register (`daynight`,
`fortress`, `grove`, `lore`, `robots`). The document's navigation is stale while
its content is accurate, which is the registry-drift failure this project keeps
hitting. It needs its header rewritten to point at `main` before Stage 4 starts.

## What does not need refactoring

- **`renderer.js` (4,135) and `ui.js` (3,169).** Large, but 1 and 0 module-level
  mutable bindings between them, and both are prototype mixins, so a split is
  mechanical and has been done once already. Size alone is not a reason here.
- **`robots.js`, `player.js`.** 35% and 31% comment, 5 and 0 module-level
  bindings, and both already import cleanly and carry tests.
- **`lang/*`.** `parse` at 1,614 lines is the longest function in the tree, and
  it is a recursive-descent parser held in one closure, which is a normal shape
  for one. BML has its own repository now; that call belongs there.
- **`archive-places.js`, `archive-forums.js`, `poplog.js`, `items.js`,
  `lore.js`.** 0 functions between the first four. They are data with a 2-6%
  comment ratio because a table does not need prose.
