# Testing AI-ML against somebody else's programs

`tools/isml-conformance.mjs` runs AI-ML against the 32 example files from
Robert Harper's *Introduction to Standard ML* course at Carnegie Mellon, one
top-level declaration at a time, and reports how many the console accepts.

```bash
node tools/isml-conformance.mjs
node tools/isml-conformance.mjs --verbose   # every failing line, not the first three
```

## Why it exists

Every test in `test/` was written beside the feature it tests, by whoever wrote
the feature, and shares that person's assumptions about what the feature is for.
That makes the suite good at catching regressions and bad at catching the thing
nobody thought of.

Harper's files have no such problem. They were written in 1993 to teach Standard
ML, with no knowledge of this dialect and no interest in flattering it. Running
them found more in an afternoon than four sessions of our own tests had.

**Added to the language because these files wanted them:** clausal definitions,
`@`, type variables, records, blocks (`let val … val … in … end`), simultaneous
`and`, `fn` with alternatives, as-patterns, and `abs sqrt min max size`.

**Two silent bugs it surfaced that no test had caught:**

- `nil` in parameter position was treated as a **variable**, so
  `fun length nil = 0 | length (_::t) = 1 + length t` bound a variable called
  `nil`, matched every list, returned 0 for everything, and never reached the
  second clause. Wrong answers, no error. Every test we had written used `case`,
  where `nil` was handled correctly.
- `ml file.ml` fed the interpreter **one physical line at a time**, so a program
  file could only ever hold one-liners and every multi-line function failed on
  its second line. Nobody had noticed because the only two example files on the
  disk were both one-liners.

## The corpus is not in this repository

The `.sml` files are Harper's teaching material. The harness fetches them from
`cs.cmu.edu` on first run into `tools/.isml-cache/`, which is gitignored. If the
fetch fails it says so and stops. Nothing here reproduces them, and nothing here
should.

## How it works, and where it lies

Each file is split into top-level declarations and each declaration goes through
a **deliberately crude translator** before evaluation:

| SML | AI-ML | Why |
|---|---|---|
| `#"c"` | `"c"` | no char type |
| `andalso` / `orelse` | `and` / `or` | spelling |
| `=` in a body | `==` | a single `=` binds |
| `~3` | `(0 - 3)` | no unary negation |
| `x : int` | *(dropped)* | no types to annotate |
| `fun`, `val` | *(passed through)* | both are accepted now |

Declarations using `structure`, `signature`, `functor`, `exception`, `raise`,
`handle`, `ref`, `:=` or a `String.`/`List.`/`IO.` qualified name are **skipped,
not failed**. Those are documented absences rather than defects, and counting
them as failures would tell us nothing except that the translator gave up.

## A warning, from experience

**The translator has been wrong twice, in ways that looked exactly like language
regressions.**

Its type-annotation stripper once matched a bare `:` and ate the second colon of
every `h::t`, turning every list pattern in the corpus into `h:`. Six files
reported near-total failure. Later, its equality conversion turned each *second
clause's* defining `=` into `==`, and the score fell from 51% to 39% in one run.

Both times the language was fine. **Before believing a regression here, check the
translator.** The instrument has failed before the thing being measured did more
often than the other way round.

## What the numbers mean

A run reports attempted, ran, and skipped per file, then a total. The figure
worth tracking is **ran / attempted**, and it is only comparable across runs when
the translator has not changed — which it has, twice, deliberately, as the
language grew and needed less translating.

Recorded so far:

| Version | Ran / attempted | What changed |
|---|---|---|
| v1.244 | 145 / 282 (51%) | first run |
| v1.245 | 170 / 294 (58%) | clausal definitions, `@`, type variables |
| v1.246 | 178 / 356 (61% on the original basis) | records, blocks, `fn` matches, as-patterns, library |

Eight of the 32 files are entirely module-system material and score zero by
design. `lists.sml` and `regexp.sml` both port **100% by hand**; the mechanical
figure for those is translator noise and the module wrapper respectively.

The full survey, with per-file verdicts and the reasoning, is kept alongside the
essay in the WritingLab notes rather than here.

## Reference

Harper, R. (1993) *Introduction to Standard ML*. School of Computer Science,
Carnegie Mellon University. Exercises by Kevin Mitchell, University of
Edinburgh. Examples at `https://www.cs.cmu.edu/~rwh/isml/examples/`.

Where AI-ML departs from Standard ML, the game's own **Restrictions** page names
the departure and says why. See also `docs/ob-terminal-language.md`.
