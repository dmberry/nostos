# Machines that run a program you can read (design)

*David, 2026-07-26: "can we code the robot core logic into the ML we have been
developing? … each robot as an ML file that it actually follows (same for OB) …
download that ML code, edit it on the laptop, and reupload it. It could then
allow us to program them like in LOGO."*

Yes. It is the terminus of everything already built — the language, the laptop,
`ed`, the web, the spoofer — and it turns the whole tech tree into one sentence:
**you learn the machines' language well enough to rewrite what they are.**

But it only works in one particular shape, and getting the shape wrong makes it
either impossible or unbearably slow. This document argues for the shape.

## 1. The one decision that matters: ML decides, the engine acts

The tempting reading is "the robot's behaviour IS an ML program" — the program
moves it, swings at you, walks home. That reading fails, for three reasons:

- it needs **mutable state** (position, timers, targets), and this language has
  none, deliberately;
- it needs to run **every frame**, for every machine, which an interpreted
  language written for a console cannot afford;
- a bad program would have to be able to *crash the robot's body*, not just its
  reasoning, which means every engine invariant becomes the program's problem.

The shape that works is the standard policy split:

> **The program is a pure function from what the machine SENSES to what it
> INTENDS. The engine does the intending.**

```
let think =
  if charge < 20 then home
  else if threat and hurt then flee
  else if threat then hunt
  else patrol
```

`patrol`, `hunt`, `flee`, `home` are **intents**, not actions. The engine already
knows how to patrol, hunt, flee and go home — that code exists in `robots.js`
and is good. The program only chooses between them, and it is:

- **pure** — exactly what this language is for;
- **cheap** — evaluated on a decision tick (~4/sec, staggered), not per frame;
- **safe** — a bad program yields a bad *decision*, never a broken body;
- **readable** — which is the entire point, since the player has to understand it
  before they can rewrite it.

Everything below follows from this one decision.

## 2. Sensors are functions, not fields

The language has no records and no `.` accessor (`.` belongs to filenames). It
does not need them. A sensor is a **nullary builtin** that reads the machine's
own state — exactly how `timer` and `name` already work at an obelisk console:

| Sensor | Gives |
|---|---|
| `charge` | cell, 0-100 |
| `integrity` | condition, 0-100 |
| `range` | distance to the nearest human, in tiles |
| `threat` | true if one is in sight *and* reachable |
| `hurt` | true below the flee threshold |
| `home_range` | distance to the tower this unit is homed to |
| `linked` | true while its tower still answers |
| `blight` | dead ground within reach (gardeners) |
| `daylight` | true by day |

This is the same **station** mechanism the consoles already use
(`makeBuiltins(station)`): a robot program evaluates with `station: 'robot'`, and
that station's builtins are its senses. No new machinery, and it means a program
written for a unit cannot accidentally reach the network — the wrong verbs simply
are not there, and the error already says so.

## 3. Fuel: the non-negotiable part

`let f x = f x` must not hang the game. Every program runs under a **step
budget**: a reduction counter that aborts evaluation past a limit.

A program that overruns is not an error message to the player — it is a **fault
in the machine**, and it should read that way: the unit reverts to its factory
default, its eye flickers amber, and its own page reports `program faulted —
step budget exceeded`. Sabotage by writing an infinite loop into a hunter is a
legitimate and very funny attack, and the fault state is what makes it one.

## 4. Where the programs live, and how you get at them

Each machine carries its program as an `.ml` file — genuinely, not decoratively:

```
w4_07.calypso.com/program.ml
ob_1a2b.calypso.com/program.ml
```

- **READ is free.** The web already serves the machine's public face; the program
  is part of it. `GET` it, and it lands on your NostBook. This makes the browser
  properly useful: you go looking for a unit whose program is worth having.
- **WRITE is the escalation.** Uploading is what breaking through the httpd
  actually *buys* you (the standing L9 task) — the difference between reading a
  box and having it. Physical access (standing over a stunned unit) is the other
  route, which is where the bluebox ladder ends up.

That gives L9 its content, which it has been missing.

## 5. The ladder this completes

Every machine-turning tool the game has becomes a rung, and they stop
overlapping:

| Rung | Reach | Precision | Cost |
|---|---|---|---|
| **Bluebox** | one machine, already down | none — a fixed gardener program | a circuit |
| **OB spoofer** | a whole garrison at once | none — allegiance only | a battery, in the open |
| **Program upload** | one machine, exactly | total — you wrote it | the hack, and knowing the language |

The bluebox writes a canned program. The spoofer lies about who a program's
tower is. Uploading writes the program. Same fiction, three depths.

## 6. LOGO: orders, as a second mode

Policy answers *what should I do now*. LOGO answers *do these things in order*,
and for the working machines (gardeners, haulers) that is the better fit and the
more delightful one:

```
plant ; forward 4 ; right ; plant ; forward 4 ; home
```

This is the same language — `;` already sequences, and these are just verbs at a
different station — but a different **contract**: the engine runs the list to
completion rather than asking each tick. Worth having *both*, and worth being
explicit about which a given program is (a `route` file versus a `think` file).

The LOGO comparison is exact in the way that matters: a child can read the
program, run it, watch the machine do the wrong thing, and see *why*.

## 7. What the language still needs

Small, and all of it useful anyway:

- `and` / `or` / `not` — currently absent, and unavoidable in conditions.
- The intent atoms (`patrol`, `hunt`, …) — bare words already evaluate to atoms,
  so this may need nothing at all beyond agreeing the vocabulary.
- A **step budget** in `evalNode` (see §3).
- Possibly `let` chains with no `in` inside a program file, which the top-level
  already supports at a console.

Nothing here needs records, pattern matching, or a type checker.

## 8. Risks, stated plainly

- **Threat collapse.** If every machine can be rewritten, nothing is dangerous.
  Mitigations already exist in the code: `hardened` units refuse (the fortress
  guards already carry that flag), write access is gated on the hack, and a
  reprogrammed unit still answers to its tower unless the tower is dealt with.
- **Difficulty cliff.** Writing a policy is harder than pressing U. It must stay
  *optional* — the bluebox and spoofer remain the routes for players who do not
  want to program. This is a depth feature, not a required one.
- **Performance.** Staggered decision ticks and a hard step budget. Measure with
  a full island of units before shipping.
- **Debuggability.** A program that faults must say why, on the machine's own
  page, in the machine's own voice. Otherwise it is unplayable.

## 8b. P1 and P2 are BUILT (v1.213) — what the prototype settled

The risky half is done and tested (`test/robot-programs.test.js`), with no engine
wiring: `decide(program, senses)` is a pure function returning an intent or a
fault. Four things were learned by building it rather than by arguing about it.

**A program is ONE expression, not a list of lines.** The first cut evaluated
line by line, which cut a four-line `if/else` in half at the first `then`. Lines
are joined before evaluation; locals come from `let … in`.

**`let` had to become recursive.** Only the top-level `let` was self-referential.
A machine's program has no top level — it is one expression — so a local function
could never call itself. `let` now binds the name before evaluating the value,
which also makes it agree with SML's `fun` and with our own top-level `let`.

**A bare word is an intent, not a typo.** The console's "no such command" guard
had to be turned off for a machine's own station, where `patrol` alone is the
whole program.

**A blind machine goes home.** With no sensor readings at all, `charge` reads 0,
so the factory program sends the unit back to its tower. That fell out of the
design rather than being written, and it is the right failure: a unit that cannot
tell how much charge it has should return.

Also added, and useful everywhere: `and` / `or` (short-circuiting) and `not`.

## 8c. Real programs, and what they actually decide

All verified against the shipped interpreter.

**A W-4 hunter-killer, as it leaves the foundry:**

```
(* W-4 hunter-killer. TIRESIAS-tactical 2.11.      *)
(* Do not edit. Faults are reported to the foundry. *)
if charge < 20 then home
else if threat and hurt then flee
else if threat then hunt
else patrol
```

| It senses | It decides |
|---|---|
| cell 90, nobody in sight | `patrol` |
| cell 90, sees you, intact | `hunt` |
| cell 90, sees you, shot up | `flee` |
| cell 12, sees you | `home` |

**A T-1 is the same idea, shorter, and tells you something about T-1s:**

```
(* T-1 pursuit. TIRESIAS-pursuit 1.4. No flee behaviour: *)
(* a T-1 that runs is a T-1 that has to be recovered.    *)
if charge < 15 then home else if threat then hunt else patrol
```

Shot to pieces and it still chooses `hunt`. That is not a bug; it is what a T-1
is, and the program is where you can *see* that it is.

**What you upload instead — a hunter told to garden and to avoid you:**

```
(* w4_07 — mine now. *)
let busy = blight and charge > 30 in
if busy then tend
else if threat then flee
else if charge < 30 then home
else patrol
```

| It senses | It decides |
|---|---|
| dead ground, good cell | `tend` |
| dead ground, **and you appear** | `tend` |
| nothing to tend, flat cell | `home` |

Look at the second row. You told it to flee from you, and it ignores you —
because `busy` is tested *first*, and tending wins. **The order of the conditions
is the behaviour.** Nothing warns you; the machine simply does what you wrote,
and you find out by watching it. That is the LOGO quality worth protecting: the
program is short enough to read, so the bug is yours and it is visible.

**A sentry that only cares about its own ground:**

```
let mine = home_range < 8 in
let intruder = threat and mine in
if intruder then hunt else if mine then wait else home
```

| It senses | It decides |
|---|---|
| you, far from its tower | `home` |
| you, right at its tower | `hunt` |
| quiet, at its post | `wait` |
| quiet, wandered off | `home` |

**Sabotage — what you write into a hunter you cannot beat:**

```
(* w4_11 *)
let spin n = spin (n + 1) in
if threat then spin 0 else patrol
```

It patrols perfectly well. The moment it sees you, it faults: `step budget
exceeded`. A machine bricked by its own reasoning, at exactly the moment it
mattered, and its own page will say so.

## 9. Stages

- **P1** — step budget in `ronml.js`, with tests. **DONE v1.213.**
- **P2** — the `'robot'` station and its sensors; a pure `decide(program, senses)`
  that returns an intent. Tested with no world attached. **DONE v1.213.**
- **P3** — engine: robots take an intent from their program on a staggered tick,
  falling back to the built-in behaviour on fault or absence.
  **DONE v1.215, T1 ONLY.** `updateT1` evaluates `T1_PROGRAM` at 4Hz through
  `decide()`; a fault drops it to its reflexes and lights the lamp amber. Every
  other class still has its policy compiled into `robots.js`.
- **P4** — `program.ml` served on each machine's page; `GET` downloads it to the
  NostBook. **DONE v1.215/v1.218**: served live with the unit's current intent
  and fault, saved to `/home/download`, editable in `pico` (v1.216).
- **P5** — write access. **HALF DONE.** The upload itself works both ways —
  `post <file> <unit>` at the shell (v1.216) and a chooser + Upload button on the
  unit's own page (v1.218), sharing one core (`postProgram` in main.js). What is
  NOT done is the GATE: it is deliberately ungated so it could be tested. L9
  (breaking the httpd) is what should buy it, and `postProgram` is the seam.
- **P6** — obelisk programs (alert policy, blight policy, what it calls and when).
- **P7** — LOGO-style `route` programs for the working machines.
- **P8** *(new, from the fire-control study)* — `engage.ml`: the level below
  `hunt`, where lock-on and firing live. Needs sensors `sight`/`armed`/`shielded`/
  `contact`/`lost_for` and a **list return** (`[back, fire]`), because a W-4 moves
  and shoots in the same frame and one intent per tick cannot say that. Prototyped
  and verified against the interpreter; not built.

## 10. The reason to build it

The game's argument is that the machines are *readable* — that the terrible thing
about them is not that they are alien but that they are ordinary systems doing
ordinary jobs nobody stopped. A hunter that carries its reasoning as six lines of
a language you can read, and that you can change, is that argument in the
player's hands rather than in the fiction. It is also the strongest possible
answer to "why learn AI-ML": not to open a door, but because the machines are
written in it.
