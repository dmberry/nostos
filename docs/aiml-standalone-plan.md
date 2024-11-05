# AI-ML → a real Standard ML, and a repository of its own

*Written 2026-07-27 at v1.273 / AI-ML 1.5, after a critical review of the type
system (five defects found and fixed the same day) and a measured survey of the
distance to Standard ML. Companion to
[isml-conformance.md](isml-conformance.md), which documents the measuring
instrument, and [ob-terminal-language.md](ob-terminal-language.md), which
documents the dialect as it stands.*

The two goals are one project. Making the language a real ML and making it a
repository that can stand on its own require the same first move: separate the
language from the game that grew it, so that each can be tested, measured and
shipped without the other. This document is the plan for both, in stages that
are each shippable and each verified before the next begins.

**The credit travels with every stage.** AI-ML created by David M. Berry, 2026.
Based on Standard ML developed by Robin Milner, Mads Tofte, and Robert Harper.
The conformance target throughout is Harper's *Introduction to Standard ML*
corpus (32 files, 509 declarations), which is his teaching material and is
fetched, never vendored.

---

## 1. Where the language stands (measured, 2026-07-27)

**Runs today**, verified against the interpreter this session:

- Core: `val`, `fun` (clausal, curried, tuple-argument), `fn`, `let…in…end`,
  `if`, `case`, `andalso`/`orelse` (short-circuit), `raise`/`handle`,
  `ref`/`!`/`:=`, `local`, `type` abbreviations.
- Data: int/real/char/string/bool/unit, tuples, records with `#label`, lists,
  `datatype` with type variables, as-patterns, wildcard and variable patterns.
- Spelling: `=` and `<>` in expression position, `~` negation, `#"a"` chars,
  `(* *)` comments. `div`/`mod` use floor semantics with the sign of the
  divisor, which is SML's rule and not JavaScript's.
- Types: Hindley-Milner inference with occurs check, let-polymorphism, the
  value restriction, typed refs, exhaustiveness warnings on `case` (datatypes
  and lists), arity-checked annotations. It reports and does not refuse.
- Modules: `structure`, `signature` (name-hiding), `struct`/`sig`/`end`,
  qualified names, functors (generative). Signatures restrict names, not types.
- Library: `List`, `String`, `Char`, `Int`, `Option` written in AI-ML and
  loaded as source.
- Equality: structural on records (label-order independent), lists, tuples,
  constructors; by identity on refs; refused on functions with a message.

**Conformance: 303 / 509 declarations (60%)** against the ISML corpus, raw
Standard ML with no translator. The failure histogram from the same run:

| Count | Failure | What it actually is |
|---|---|---|
| 47 | `no such command: end` | mostly the **harness splitter** cutting multi-line structures apart |
| 14 | `no infix declarations` | real gap: `infix`, `infixr`, `op` |
| 14 | `expected 'sig' after a signature name` | real gap: ascription to a *named* signature |
| 10 | `expected eof, got 'fun'` | splitter again |
| ~25 | assorted `expected eq/eof` | mixture: splitter, `and`-chains inside structures |
| 4 | `fn` with multiple clauses in one file | parse edge |
| 2 | `unexpected character '\'` | string escapes |

**Known defects**, found this session and not yet fixed:

1. String escapes are eaten: `"a\nb"` evaluates to `anb` (3 chars, no newline).
2. `datatype u = B of {n:int}` is a parse error — record types cannot be
   constructor arguments.
3. `C (1,2)` prints `<C>` — the printer loses a multi-argument constructor's
   payload. `A 1` prints correctly.
4. REPL echo prints `7`, not `val it = 7 : int`.
5. `while … do` is not parsed.

**Structure**: `src/game/ai_ml.js` is 2,842 lines and imports only
`src/game/types.js` (570 lines, already pure). Every game-facing surface is
data inside the file: the verb tables (`OB_VERBS`, `HERMES_VERBS`,
`LAPTOP_VERBS`, `MACHINE_ONLY`), the sensors (`SENSE`), the robot contract
(`decide`, `INTENTS`, `FIRE`), and ~80 `ctx.*` hook calls, all injected by the
caller. Nothing structural binds the language to the game. Seven files import
it: `main.js`, `robots.js`, `boot-loader.js`, three test files, and the
conformance harness.

---

## 2. What "a real Standard ML" means here

The destination is not full SML '97. Full conformance (the complete Basis of
47 structures, `abstype`, sharing constraints, functor signatures) is years of
work that no teaching implementation attempts. The achievable and defensible
identity is:

> **A small Standard ML.** Core language complete against Harper's
> *Introduction to Standard ML*; modules restricted and documented; a Basis
> subset; every departure named on a page that says why.

Concretely, done means:

- **≥ 90% of the ISML corpus's non-module declarations run** with correct
  results, and the module files run except for documented absences.
- **A strict mode in which ill-typed programs do not run.** This is the
  definitional property of ML. The in-game console keeps its advisory
  report-and-run behaviour (a machine in a ruin should say what it worked out
  and let the operator decide); the standalone REPL defaults strict. Until this
  exists, Harper's unityped critique applies in full, and the accurate claim is
  "infers types", not "is typed".
- **SML-shaped output**: `val it = 7 : int`, `val f = fn : int -> int`,
  constructor payloads printed.
- The conformance number is produced by an instrument that has been verified
  against hand-run files, because the instrument has now been wrong **three
  times** (the `h::t` colon-eater, the second-clause `=` converter, and the
  splitter above) and each time looked like a language regression.

---

## 3. Language work, in order

Ordered by measured value: each item's rank comes from the failure histogram
or from what a fluent SML reader hits first, not from difficulty.

### L-A. Fix the conformance splitter *(first, before any language work)*

`tools/isml-conformance.mjs` splits files into declarations by line shape and
cuts multi-line `structure … end` blocks apart, producing ~57 of the 206
failures. Rewrite the splitter to track `struct`/`sig`/`let`/`local`/`(*`
nesting depth and only split at depth zero. Then re-measure. **No language
decision is sound until this number is real.** Expected effect: 60% → low 70s
with zero language changes. Add a test: the splitter, run over a file of known
declaration count, produces that count.

### L-B. String escapes

`\n \t \\ \" \ddd` and the `\…\` line-continuation form, in the tokenizer.
Small, mechanical, and currently corrupting data silently — the worst kind of
wrong. Includes the printer side: `print`/echo of a string containing a
newline. Test: round-trip `size "a\nb" = 3` with a *real* newline in position 1.

### L-C. Printer fidelity

- `C (1,2)` prints `C (1, 2)`; nested constructors parenthesise correctly.
- `val it = <value> : <type>` echo at the laptop when the checker is on,
  matching SML's top level. In the game this appears only with `ml` at the
  NostBook, where the checker already runs.
- Reals print as SML prints them (`2.0`, `~1.5`).

### L-D. `infix`, `infixr`, `op` (14 measured failures)

The largest genuine language gap. Needs: fixity declarations held in the
session (they are scoping, not values), a precedence-climbing pass in the
parser that consults the fixity table, `op` to strip fixity, and the standard
default table (7 for `* / div mod`, 6 for `+ - ^`, 4 for comparisons, and
right-associative 5 for `:: @`). The prelude can then declare its own
operators, which is what Harper's dictionary and regexp files do.

### L-E. Ascription to a named signature (14 measured failures)

`structure IntDict :> DICT = struct ... end` where `DICT` was declared
earlier. The parser currently demands a literal `sig` after `:>`. The name
lookup is one table; the semantics (restrict to the named signature's names)
already exist for literal signatures. Opaque ascription still hides names
rather than types, and the Restrictions page goes on saying so.

### L-F. Small parse and semantics items

- `while e1 do e2` (parse to a recursive loop; it is sugar and SML defines it
  as such).
- Record types as constructor arguments: `datatype u = B of {n:int}`.
- Multi-clause `fn` at the top level of a file (parses at the console, fails in
  a file: 4 measured).
- Equality types in the checker: `''a` so that comparing functions is a TYPE
  report, matching the runtime refusal that already exists.
- A blank line inside a multi-line declaration must not end it when a file is
  read whole (interacts with L-A: splitter and parser must agree on this).

### L-G. A Basis slice

Keep the prelude written in AI-ML and grow it to the ISML working set:
`List.exists/find/partition/zip`, `String.sub/substring/translate/tokens`,
`Int.toString/fromString`, `Real.toString`, `Bool.toString`, `o` composition,
`before`, `ignore`. The yardstick is what Harper's files call, not the Basis
document's 47 structures. Anything added is added as AI-ML source so a player
can read it, which is the standing rule.

### L-H. Strict mode

`typecheck: 'strict'` in the interpreter options. In strict mode a line whose
inference fails is refused with the type error, before evaluation; warnings
(exhaustiveness) stay warnings. The game keeps advisory mode everywhere. The
standalone REPL defaults strict with a `--sloppy` flag. One switch, no fork:
same checker, same messages, the only difference is whether the line then runs.

Order of work: L-A first and alone, then re-measure and re-rank L-B…L-H
against the corrected number. The expectation is 60% → low 70s from L-A
alone, and ≥ 90% non-module after L-B/D/E/F.

---

## 4. Modularisation: the cut

The language becomes `src/lang/`, which imports nothing from `src/game/` or
`src/engine/`. The game keeps `src/game/ai_ml.js` as a thin adapter that owns
everything NostOS-specific.

```
src/lang/                       the language, pure, node-testable
  lex.js                        tokenize()  (from ai_ml.js:57)
  parse.js                      parse(), parseLine(), joinProgram()
  eval.js                       evalNode(), applyValue(), applyBinOp(),
                                valuesEqual(), formatValue/describeValue
  types.js                      moved unchanged from src/game/types.js
  basis.js                      PRELUDE source + loadPrelude()
  diag.js                       diagnose(), NOT_FITTED list
  interp.js                     createInterpreter({builtins, typecheck}) —
                                the one entry point; owns session state
  index.js                      re-exports the public surface

src/game/ai_ml.js               the adapter: OB/HERMES/LAPTOP/MACHINE verb
                                tables, SENSE(), decide(), INTENTS, FIRE,
                                lamp colours, station help text, ml -ver/-full
                                (game wording), AIML_CREDIT
```

Contract of `createInterpreter`:

```js
const interp = createInterpreter({
  builtins: { scan: {arity: 0, fn: (a, ctx) => ...}, ... },  // host verbs
  typecheck: 'off' | 'report' | 'strict',
});
interp.run(source, hostCtx)     // -> {ok, text, value}
interp.typeReport(source)       // -> 'int -> int' | 'TYPE: ...' | null
interp.session                  // bindings, fixity, datatype registry
```

The game's stations become four `builtins` tables built by the adapter. The
~80 `ctx.*` hooks keep exactly their current shape: `hostCtx` is passed
through to builtin `fn`s untouched, so `main.js` changes only its import path.

**Every current export keeps working** through re-export from the adapter:
`runRonml`, `decide`, `parseLine`, `joinProgram`, `joinProgramLines`,
`diagnose`, `typeReport`, `loadPrelude`, `PRELUDE`, `INTENTS`, `FIRE`,
`NOT_FITTED_SAMPLES`, `AIML_VERSION`, `AIML_NAME`, `AIML_CREDIT`,
`aimlVersion`, `aimlFull`, `RonmlError`, `RonmlFuelError`, `RonmlRaise`,
`LAMP_COLOURS`, `parseSelection` consumers, and the seven importing files.

Stages, each landing with the full suite green and zero behaviour change:

- **M1** — extract `lex.js` + `parse.js` (pure already; the largest cut).
- **M2** — extract `eval.js` + move `types.js`; `ai_ml.js` shrinks to the
  adapter plus a temporary pile of re-exports.
- **M3** — introduce `createInterpreter`; the adapter builds its four station
  interpreters through it; kill the temporary pile.
- **M4** — port the conformance harness and the language tests to import
  `src/lang/` directly, so they no longer touch game code at all.
- **M5** — strict mode (L-H lands here, in `interp.js`).
- **M6** — `bin/aiml.js`: a node REPL (readline, `val it = … : ty`, strict by
  default, `use "file.ml"`). At this point the language is demonstrable
  outside the game: `node bin/aiml.js`.

---

## 5. The standalone repository

Made after M6, not before: a repo whose first commit already runs a REPL and
passes CI is worth looking at; a repo of parts is not.

**Mechanics.** `git subtree split --prefix=src/lang` (plus `bin/`, the language
tests, and the harness) carries the history of every file, so the record of
how the language was built — which is part of the point of the project —
survives the move.

```
<repo>/
  src/            lex, parse, eval, types, basis, diag, interp, index
  bin/aiml.js     the REPL
  test/           the language tests (node --test, no deps)
  tools/isml-conformance.mjs
  docs/           restrictions page (from ob-terminal-language.md), this plan
  README.md       what it is, the credit, the conformance table, quickstart
  LICENSE
```

Properties to hold, all already true of the code today: **zero dependencies**,
no build step, ES modules, runs under plain `node`. CI is `node --test` plus
the conformance run with the corpus cached (never committed — it is Harper's
teaching material; the harness fetches it, as now).

**Back into the game.** NostOS has no package.json by design (its own standing
rule), so it cannot npm-install the language. Two options:

1. **The game repo stays canonical**; the standalone repo is a subtree that is
   pushed to (`git subtree push`) on each language release. Recommended: the
   game is where the language actually gets exercised, and one-way publishing
   cannot desynchronise the game.
2. The standalone repo becomes canonical and nostos vendors `src/lang/` back
   by subtree pull. More ceremony, only worth it if outside contributors
   appear.

Start with 1; moving to 2 later is a remote change, not a rewrite.

**Versioning.** The language already has its own number (AIML_VERSION, 1.5).
The repo tags releases from it. The game pins the subtree at a tag and says
which in `ml -ver`, which it already prints.

---

## 6. Decisions for David

1. **Name.** `ai-ml` is taken as a search term by half the internet. Candidate
   working names: `aiml-lang`, `nost-ml`, `smallml`. The in-fiction name stays
   AI-ML regardless.
2. **Licence.** The code is yours to licence (MIT is the default for teaching
   interpreters; GPL if you want derivatives kept open). The credit block
   rides in the README and `-ver` output either way. Harper's corpus stays
   out of the repo under any licence.
3. **Strict default in the game.** The plan keeps the game advisory. If you
   ever want `ml -strict` at the NostBook as a player-facing switch, it is
   free once L-H lands.
4. **Whether to tell Harper** when the standalone REPL exists. The exchange is
   warm and he ran the last one.

---

## 7. Risks, and the lessons already paid for

- **The instrument lies before the language does.** Three translator/splitter
  failures so far, each looking like a language regression. Rule: any
  surprising conformance change is investigated in the harness first
  (documented in isml-conformance.md).
- **Registries drift from what they describe.** The diagnostic list went stale
  six times; man pages, help text and HOOK_COMMANDS each rotted silently until
  a test walked them. Every table this plan adds (fixity, Basis functions,
  strict-mode errors) lands with a walking test in the same commit.
- **Two sources of truth.** The prelude, the credit, and the version each live
  in exactly one place today. The split must keep that: the adapter re-exports,
  it never copies.
- **The suite is blind to reach.** Every serious defect this month was correct
  in the module and wrong in the hand. The REPL (M6) is the standalone repo's
  "hand": test it by driving stdin, not only by calling functions.

## 8. Immediate next step

L-A, alone: fix the splitter, add its test, re-run the corpus, and re-rank
sections 3 and 2 against the corrected number before touching the language.
