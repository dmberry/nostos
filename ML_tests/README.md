# ML_tests — the conformance suite for AI-ML / BML

Two questions, one suite:

1. **Has the quality of the ML gone backwards?** Everything in `core/` and
   `repl/` is a property that currently holds. A regression turns one of them
   red.
2. **How far is it from Standard ML?** Everything in `harness/departures.mjs`
   is a property that currently does not hold, with the SML answer recorded
   beside it. Closing one turns the register red, and the failure message says
   to prune the entry.

Both directions are load-bearing, and the second is the unusual one: a red
register is good news. It is the same guard the console's own diagnostic list
carries, aimed at the conformance claims instead.

```bash
node --test ML_tests/**/*.test.js
```

## Layout

| Path | What it holds |
|---|---|
| `harness/interp.mjs` | **The seam.** Every test reaches the language through this and nothing else. |
| `harness/expect.mjs` | Assertions phrased as claims about SML, plus the no-JavaScript-leak check. |
| `harness/departures.mjs` | The departure register: every known disagreement with Standard ML. |
| `core/` | The language: lexical, operators, bindings, functions, data, state, modules, types, robustness. |
| `departures/register.test.js` | Walks the register and asserts each entry is still a departure. |
| `repl/` | Drives `bin/bml.js` as a process, through stdin and argv. |
| `wrapper/` | The join between the language and the game: senses, intents, stations. |

Two documents sit beside the code: [SML_conformance.md](SML_conformance.md) for
the language, [AI-ML_wrapper.md](AI-ML_wrapper.md) for the game layer.

## It has already done both jobs

The suite went in on 28 July, while the `src/lang/` extraction was being written
in another session. In the first day it:

- stayed green across **M1, M2, M3 and M4**, which is the evidence that the
  extraction did not change behaviour;
- turned red at **v1.288** the moment `createInterpreter` landed, because the
  seam switched to the extracted language and the wrapper tests were still
  asking it for `decide`. That is the cut being noticed, and the fix was to say
  which tests want the game and which want the language (`gameRaw` against
  `raw`);
- retired four register entries as the language grew past them, each time by
  failing and saying which entry to prune.

## The seam, and why the suite survives the extraction

`docs/aiml-standalone-plan.md` moves the language out of `src/game/ai_ml.js`
into `src/lang/` behind one `createInterpreter` entry point, then splits it out
as its own repository. A suite that imported the game module directly would
have to be rewritten on the day of the cut.

So `harness/interp.mjs` probes for `src/lang/index.js` first and falls back to
`src/game/ai_ml.js`. When the new home appears and exports `createInterpreter`,
the suite starts using it with no edit anywhere else. `backend` reports which
one answered, so a test can say which side of the cut it is measuring.

## How the suite is meant to be used

- **Adding a language feature.** Run the suite. If the register goes red, the
  feature closed a departure: delete the entry and move its case into the
  matching file under `core/`, as a positive assertion of what SML does. The
  register only stays useful if it is pruned.
- **Finding a new departure.** Add an entry rather than a skipped test. An
  entry carries the SML answer, so it is a specification of the fix as well as
  a record of the gap. `plan:` links it to the item in the standalone plan that
  would close it.
- **Refactoring.** `core/` and `repl/` should not move at all. If they do, the
  refactor changed behaviour.

## The harness has to run the checker

`session().run()` calls `typeReport` before `runRonml` on every line, because
that is what `bin/bml.js` and the NostBook's `ml` both do. The checker keeps its
own view of what has been declared. A harness that evaluated a `datatype`
without checking it would leave the checker not knowing the constructors, and
the exhaustiveness warning would then never fire, so a working feature would be
reported as broken.

That was caught while writing this suite, and it is the fifth time on this
project that the instrument was wrong before the thing being measured was. The
harness is part of the instrument; check it first.

## What travels to BML, and what stays here

The language is published from this repo into
[critical-code-studies/BML](https://github.com/critical-code-studies/BML) by
`git filter-repo`; nostos stays canonical. This folder is written to be copied
into either repo unchanged, and that is checked rather than assumed: dropped
into a fresh clone of BML it runs **165 pass, 15 skipped, 0 fail**, with no edit
on either side.

| | |
|---|---|
| Travels | `harness/`, `core/`, `departures/`, `repl/`, and both language documents. |
| Stays | `wrapper/`, which tests the join with the game and nothing else. |

Three things make that work, and each was a real failure first:

- The seam tries **both homes** for the language, `src/lang/index.js` here and
  `src/index.js` in BML, because the split renames the prefix.
- `gameRaw` is loaded in a `try` and is **null where there is no game**.
  Importing it eagerly threw at module load in a repo without `src/game/`, which
  took down every core test as well, including the ones with nothing to do with
  the game.
- Tests that need the game **skip on `hasGame`** rather than failing. Fifteen
  skips in BML, and the skip reason says why.

Add `--path ML_tests` to the filter-repo line in
`docs/aiml-standalone-plan.md` §5 so the conformance suite goes with the
language it measures.

## What this does not cover

- The ISML corpus. `tools/isml-conformance.mjs` runs Harper's 32 files and is
  documented at `docs/isml-conformance.md`. That measures breadth against
  somebody else's programs; this suite measures depth against the definition.
  They answer different questions and neither replaces the other.
- The game's own suite in `test/`, which stays as it is: regression tests
  written beside each feature as it landed. This suite is organised by SML
  feature area instead, so the two are complementary rather than duplicates.
