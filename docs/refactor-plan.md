# Refactor review — where it is needed, and where it is not

*Written 2026-07-26 at v1.218, after a full survey of `src/` (40,214 lines across
57 modules, 300 tests). Companion to [refactor-registry.md](refactor-registry.md),
which records the systems-registry work already landed (Stages 0–3) and the one
stage still open.*

The question asked was whether `main.js` and `robots.js` are too big. The honest
answer is that **one of them is a real problem and the other is mostly fine**,
and that the *size* of neither is the thing that matters. What matters is where
new code lands, what can be tested, and which parts have actually hurt.

## 1. The standard applied here

A refactor is worth doing when it pays one of these:

1. **It makes something testable that has broken in production.**
2. **It stops a file growing** — not by moving lines once, but by giving new code
   somewhere else to go.
3. **It removes a hazard** that has already caused a bug.

A refactor is *not* worth doing because a file is long, because a function is
long, or because a shape is unfashionable. Several of the largest files here are
long for good reasons and should be left alone. Section 5 names them, because a
plan that only says what to change is half a plan.

## 2. What the survey found

| File | Lines | Pure? | Tests | Verdict |
|---|---:|---|---|---|
| `src/main.js` | 6,619 | no | **none, ever** | **Act.** §3.1 |
| `src/engine/renderer.js` | 5,082 | no | none | Watch. §3.4 |
| `src/game/player.js` | 2,881 | yes | 6 files | Partial. §3.3 |
| `src/game/robots.js` | 2,640 | yes | 2 files | Small, targeted. §3.2 |
| `src/engine/ui.js` | 2,376 | no | none | Leave. §5 |
| `src/game/lore.js` | 1,709 | no | none | Leave — data. §5 |
| `src/game/ai_ml.js` | 1,325 | yes | 3 files | Leave. §5 |
| `src/game/worldgen.js` | 1,153 | yes | 1 file | Leave. §5 |

Two measurements decide most of what follows.

**`main.js` grows about 39 lines per commit.** It was 5,461 lines thirty commits
ago and is 6,619 now. It has 258 commits against it, more than any other file.
On the current slope it passes 8,000 within about thirty-five more commits.

**Extraction alone does not hold.** `renderer.js` was 4,925 lines when `ui.js`
was carved out of it on 2026-07-11; the registry doc records it dropping to
4,123 when the split completed. It is **5,082 today** — larger than before the
refactor, two weeks later. The 861 lines came out and 959 went back in. This is
the single most useful fact in this review: *moving code out of a file does
nothing unless new code has somewhere else to go by default.* Every stage below
is therefore judged on whether it changes the destination of the **next** feature,
not on how many lines it moves today.

## 3. Where it is needed

### 3.1 `main.js` — the terminal/laptop/web layer (act on this one)

This is the only urgent item.

**The evidence, not the line count.** `main.js` imports the DOM at 98 sites and
is imported by no test, ever. It cannot be tested as it stands. In this month
alone it shipped two runtime `ReferenceError`s — `worldSeed` for `WORLD_SEED`,
and `searchResults`/`bookmarksPage` used without imports — both inside the
laptop/browser code, both invisible to `node --check`, and both fatal: because
`openLaptop()` is reached from `update()` inside `frame()`, the throw killed the
rAF loop and the whole game stopped. That is the cost being paid, and it is being
paid in exactly one region.

**That region is also the growth.** The terminal, laptop, Netscape, `ed`/`pico`
and POST code occupies roughly **lines 2363–4790 — about 2,400 lines, 36% of the
file**, and it took most of the +1,158 lines of the last thirty commits.

**And it is the cheapest thing in the file to move**, because most of it is DOM
wiring over modules that are already pure and already tested:

| In `main.js` | Wiring over | Already tested |
|---|---|---|
| Netscape (3933–4557) | `net.js` | 31 tests |
| Laptop shell (3798–3932, 4557–4790) | `unix.js` | 39 tests |
| `ronmlCtx` (2667–2844) | `ai_ml.js` | 3 files |
| ELIZA session (3366–3382) | `eliza.js` | none |

The language, the filesystem, the host table and the page rendering are not in
`main.js` and never were. What is in `main.js` is which element to show, which
`let` to reset, and what to print.

**The three shared hubs any split must respect.** These are the real structure,
and they are why this cannot be a naive file-per-screen chop:

1. **`terminalKind`** (3362) — the enum every console agrees on. Set by
   `openObTerminal`, `openGateTerminal`, `openHermesTerminal`, `openCoreTerminal`,
   `openLaptop`; read by `replRun`, `ronmlCompletion`, `updateHermesBattEl`,
   `closeObTerminal`.
2. **`replLog` / `replHistory` / `replSession`** (2427–2429, 2377) — one screen
   buffer shared by all four console types, reset by whichever one takes the
   screen.
3. **`closeObTerminal`** (~4790) — the single teardown for *all four*, touching
   `nsEl`, `picoEl`, `pico`, `elizaBot`, `web`, `edState`, `laptopMl`,
   `laptopShell`, `laptopBooting`, `terminalKind`, `terminalOb`, `replSession`.

These three are a **terminal session object** that has never been written down.
That is the actual finding: not "the file is long" but "there is an unnamed
object here, and every console reaches into its fields directly."

**Proposed shape.** A new `src/ui/` directory — a third layer beside `engine/`
(canvas, input, sound) and `game/` (rules), for **DOM screens**:

```
src/ui/terminal-session.js   the session object: kind, log, history, teardown   (~200)
src/ui/console-ob.js         obelisk + gate + core terminals, ronmlCtx          (~700)
src/ui/console-hermes.js     relay, records, forge, drive-a-robot              (~280)
src/ui/laptop.js             boot, shell run loop, hooks, session persistence   (~430)
src/ui/netscape.js           browser, menus, chrome, POST wiring                (~620)
src/ui/editors.js            ed + pico                                          (~250)
```

Roughly **2,400 lines out of `main.js`**, leaving ~4,200. But the number is not
the point — the point is that `src/ui/` becomes the obvious home for the next
screen, so the next 1,000 lines of laptop work do not land in the hub.

**What this buys immediately:** each of those files can be loaded by a test with
a DOM stub, or at minimum linted for undefined identifiers as a unit. The
identifier sweep I have been running by hand (`/tmp/sweep.mjs`) becomes
unnecessary for the region that has needed it.

**The hazard to clear first.** Lines 441–445 declare `crossFail`, `departOut`,
`pendingCrossing`, `strait`, `pong` early *purely so `persist()`'s guard can read
them* before their real owners are defined — a deliberate temporal-dead-zone
dodge, commented as such. Five different systems own those variables' actual
lifecycles. Any extraction that moves one of them without noticing this will
produce a `persist()` that silently saves during a cutscene. **Fix this before
Stage 1**, by giving `persist()` a `canSave()` predicate that the systems set,
rather than five hoisted `let`s it peeks at.

### 3.2 `robots.js` — two small cuts, and a firm no

`robots.js` is in much better shape than its size suggests: it is **pure** (no
DOM at all), it has tests, and it is one coherent subject. It is not the problem
the question assumed. Two targeted cuts are still worth it:

**Cut 1 — drawing (440 lines, 17%).** Lines 2201–2640 are canvas code:
`sensorStyle`, `bodyTone`, `drawDesignation`, `drawSmoke`, `drawBatteryIcon`,
`drawRobot`, `drawT1/T2/T3`. They read robot fields and mutate nothing. Moving
them to `src/engine/robot-draw.js` makes `robots.js` a **simulation-only** module
and puts drawing where the other drawing lives. `drawT3` alone is 159 lines, the
second-longest function in the file. Low risk, clear boundary.

**Cut 2 — the fortress guards (275 lines).** Lines 1840–2114 (`guardSees`,
`guardNextWaypoint`, `pursueMaze`, `updateGuard`, `updateM4/M5/M6Pack`) are a
self-contained cluster with **their own** helpers — maze BFS pathfinding and a
vision cone that nothing else uses. They belong beside `fortress.js`. This one
also improves the fiction: fortress guards are a different system with different
rules (they never break off, they run on mains, they report breaches), and the
file boundary would say so.

**The firm no: do not split per robot type.** It looks tempting — twelve
`update*` functions, one file each. It fails on the data: `moveToward` is called
by 11 of the 12, `patrol` by 8, `drainBattery` by 8, `distTo` by 5,
`chaseTarget` by 3. And none of them is reachable except through the shared
225-line `updateRobots` gate, which owns aggro, line-of-sight give-up, recharge,
repel, ubik-confusion and knockback for every type. A per-type split means either
duplicating the 244-line movement toolkit, or a `robot-movement.js` that every
type file imports plus a dispatcher that imports them all — more files, more
imports, same coupling, and a reader who now needs four files open to follow one
machine. **After the two cuts above, `robots.js` is ~1,900 lines of one subject.
That is an acceptable size for the thing it describes.**

### 3.3 `player.js` — one extraction, not a decomposition

`player.js` is 2,881 lines, **pure**, and covered by six test files. It has no
drawing in it at all. The mass is in two places:

- **`update()` — 319 lines** (1012–1330), which ticks nearly every subsystem the
  player has: food, stamina, torpor, swimming, jumping, wifi block, forcefield,
  mirror-shield heat, compass, gun charge.
- **`useHands()` — 255 lines** (1622–1876), a dispatch on tool kind and target.

Both are long, and **both are long for a defensible reason**: they are ordered
sequences where the order is the behaviour, exactly like the ML programs the
machines run. Splitting `update()` into eight private methods would not reduce
the coupling by a line; it would only hide the ordering that makes it correct.

The one genuinely separable group is **crafting: 411 lines** (388–798), fourteen
`canCraft*`/`craft*` pairs that share nothing with the rest of the class except
`hasItem`/`removeItem`/`stow`/`say`. They are recipes, and recipes are data plus
a check. Moving them to `src/game/crafting.js` as free functions taking the
player — the same shape `combat.js` already uses after Stage 2a of the registry
work — takes the class under 2,500 and gives recipes a home where a new one is
obviously a data entry rather than another method on an ever-growing class.

**Everything else in `player.js` stays.** It is a coherent object, it is pure,
and it is tested.

### 3.4 `renderer.js` — watch, do not cut again

5,082 lines, no DOM-free surface, no tests, and — as §2 records — it has already
grown back past the size it was when `ui.js` was extracted from it. Cutting a
second slice now would repeat the experiment and get the same result.

The useful move is much smaller: the pure helpers trapped inside it —
`shadeHex`, `rgbScale`, `hexRgb`, `tileHash`, `scaleRgbaAlpha`,
`facingToCompassDir` (renderer.js:54–132) — are string and number transforms with
no canvas access, and `robots.js` has its **own copy of `shadeHex`** (line 2146,
commented "local copy of the renderer's hex shader so this module stays
engine-free"). One duplicated function is a symptom worth fixing cheaply:
`src/engine/colour.js`, ~40 lines, pure, tested, imported by both. Do that; leave
the rest of `renderer.js` until there is a reason beyond its size.

## 4. What has actually gone wrong, and what would have caught it

A refactor plan should be judged against the bugs the codebase really produced.
This month's, in order:

| Bug | Root cause | Which stage prevents it |
|---|---|---|
| Game froze on opening the laptop (v1.203) | `worldSeed` undefined in `main.js` | **1** (the region becomes lintable/testable) |
| Missing foundry on the AI index | `w.factory` vs `w.wfactory` in the descriptor | 1 (descriptor gets a test) |
| "undefined Tourist Board" | stale field path after registry migration | 1 |
| `phonePressed` defined twice, so **O never opened the phone** | two methods, same name, one file | any linter (§6) |
| `ed` soft-lock (v1.216) | no test could reach the input-mode branch | 1 |
| v1.217 chassis never rendered | CSS `display: contents` not restored | none — needs a browser check, §6 |

Note the pattern: **five of six are in the DOM-bound region with no tests, and
none is in `robots.js` or `player.js`.** That is why §3.1 is the only urgent item
and §3.2/3.3 are marked small and partial.

## 5. What NOT to refactor

Named explicitly, because the risk in a review like this is that everything looks
like a candidate.

- **`lore.js` (1,709)** — it is a data file with a thin reader. Long because
  there is a lot of writing in it. Leave it.
- **`items.js` (909)** — a registry of item definitions. Same.
- **`worldgen.js` (1,153)** — one algorithm, already parameterised per island
  (Stage B1). Splitting terrain generation across files makes it harder to read,
  not easier.
- **`ai_ml.js` (1,325)** — a tokeniser, parser and evaluator for one language.
  Three phases, one subject, three test files. Textbook cohesion; leave it.
- **`ui.js` (2,376)** — the result of the last refactor. Leave it alone and let
  it prove itself.
- **The `player.onX = …` callback pattern** (22 injection points in `main.js`,
  24 guarded call sites in `player.js`). This looks like a smell and is not: it
  is what keeps `player.js` pure and testable while still letting the hub react.
  It is inversion of control done with the smallest possible mechanism. **Do not
  replace it with an event bus.** The one thing worth doing is writing the slots
  down in one place, since they are currently discoverable only by grep.
- **The 20 pure modules with no tests** (`birds.js`, `waterdroids.js`,
  `eliza.js`, `snake.js`, `boatyard.js`, the five `islands/*.js`, …). These want
  *tests*, not refactoring. They are already the right shape.
- **Anything requiring a build step, a framework, a bundler, or a dependency.**
  The repo's whole posture is plain ES modules served as files, and it works.

## 6. The thing that is not a refactor and matters more

**Adopt a linter with `no-undef` and `no-redeclare`.** Three of the six bugs in
§4 are undefined-identifier or duplicate-definition errors, which is a category
no amount of restructuring removes and one config line does. `node --check` only
parses; it cannot see them. This is the single highest value-per-effort change
available, and it is worth doing **before** Stage 1 so the extraction itself is
checked as it happens.

The constraint is real, though: the repo has no `package.json` and rule 6 in the
project instructions forbids installing packages here. Options, in order of
preference:

1. A standalone `eslint` run from outside the repo (installed in `~/Documents`,
   pointed at this directory) — no dependency lands in the project.
2. Promote the hand-rolled sweep (`/tmp/sweep.mjs`) into `tools/sweep.mjs` in the
   repo — zero dependency, already catches the exact class of bug that froze the
   game, and currently exists only in a temp directory where it will be lost.

Do (2) regardless; it costs nothing and the script has already earned its place.

**DONE, v1.231.** `tools/lint.mjs` implements both rules with no dependencies:
63 files in 0.3 seconds, clean. It is a heuristic at file scope rather than a
parser, which is coarser than ESLint and enough for this bug class.

It was **proved against the real bugs** before being trusted, which matters more
than the implementation: reintroduce `worldSeed` for `WORLD_SEED` and a second
`notesPressed` in one class, and the linter reports both while `node --check`
passes them silently. Writing it also produced four rounds of its own false
positives — prose leaking out of nested template interpolations (396),
multi-declarator statements (249), a regex swallowing across statement
boundaries (55), destructuring defaults and static class fields (5) — and one
outright hang, from running `/\w+$/` against the whole output on every
character. Each of those is a thing it now knows about.

## 7. The plan

Each stage ships on its own, is verifiable on its own, and is ordered so that the
riskiest work happens when the safety net is largest.

| # | Stage | Moves | Risk | Buys |
|---|---|---|---:|---|
| **0** | ~~`tools/sweep.mjs` + a linter pass (§6)~~ **DONE v1.231** — `tools/lint.mjs` | 0 | none | Catches the §4 bug class permanently |
| **0b** | `persist()` gets `canSave()`; delete the five hoisted `let`s (§3.1) | ~30 | low | Removes the TDZ hazard before anything moves |
| **1a** | `src/ui/terminal-session.js` — name the session object | ~200 | medium | The precondition for everything else |
| **1b** | `src/ui/netscape.js` + `src/ui/editors.js` | ~870 | low | Biggest, newest, best-isolated region |
| **1c** | `src/ui/laptop.js` | ~430 | low | |
| **1d** | `src/ui/console-ob.js`, `console-hermes.js` | ~980 | medium | Oldest code; most entangled with world state |
| **2** | `src/engine/robot-draw.js` (§3.2) | ~440 | low | `robots.js` becomes simulation-only |
| **3** | `src/engine/colour.js` (§3.4) | ~40 | none | Kills the duplicated `shadeHex` |
| **4** | `src/game/crafting.js` (§3.3) | ~411 | low | Recipes get a home |
| **5** | `src/game/fortress-guards.js` (§3.2) | ~275 | medium | Guards sit beside the fortress |
| **6** | Registry Stage 4 (from [refactor-registry.md](refactor-registry.md)) | — | medium | Finishes the work already started |

**Do 0, 0b, 1a, 1b and stop.** Reassess after that: if `main.js` keeps growing at
39 lines a commit *after* `src/ui/` exists, then the extraction did not change
where code lands and the rest of Stage 1 will not either — and the real answer is
a different one about how features are added, not about files. If the growth
moves into `src/ui/`, the plan is working and 1c/1d follow.

Stages 2–5 are opportunistic. Take them when touching that code anyway; none is
urgent.

## 8. Verification protocol

The registry work established this and it should not be relaxed:

1. `node --test test/*.test.js` — 300 tests, all green, after **every** stage.
2. `node --check` on every touched module.
3. `tools/sweep.mjs` (once §6 lands) on the extracted region.
4. **In the browser**, for anything with a screen: open it, use it, read the
   console. The `nostos` entry now in `.claude/launch.json` makes this a
   two-command check. v1.217 shipped a chassis that never rendered because this
   step was skipped; v1.218 fixed it because it was not.
5. One stage per commit, with the line counts before and after in the message.

## 9. What I would not claim

- I have not read `renderer.js` or `ui.js` closely; §3.4 rests on size, on the
  regrowth measurement, and on the duplicated helper. Before doing anything there
  beyond `colour.js`, survey it properly.
- The line estimates in §7 are from a structural survey, not from doing the work.
  Expect ±20%.
- Stage 1d (`console-ob.js`) is the one I would expect to hurt: `ronmlCtx` binds
  directly into live obelisks, robots and the player, and the core-terminal
  dialogue state machine is bespoke. It is last for that reason.
