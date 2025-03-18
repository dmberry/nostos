# AI-ML → BML: a real Standard ML, and a repository of its own

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

**Conformance: 292 / 395 declarations (74%)** against the ISML corpus, raw
Standard ML with no translator. *(74% measured at v1.277 after L-A/B/D/E; the histogram below is the v1.274 run that ranked them. The previous
figure of 303/509 = 60% was taken with a broken instrument: the splitter
fragmented every `local`/`struct` block and the translator still skipped four
things the language had. 572 fragments were really 408 declarations. The
language did not change between the two numbers.)*

The failure histogram from the corrected run:

| Count | Failure | What it actually is |
|---|---|---|
| 14 | `expected 'sig' after a signature name` | signature abbreviation (**L-D**, done v1.276) |
| 13 | `no infix declarations` | `infix`, `infixr`, `op` (**L-E**, done v1.277) |
| 6 | `expected rp, got 'K'` | parse edge inside parenthesised forms |
| 6 | `expected eof, got 'end'` | residual block-parse gap, not the splitter |
| 5 | `that library is not on this machine` | Basis beyond List/String/Int/Option (**L-G**) |
| 5 | `expected eof, got 'EQ'` | `and`-chains, mostly inside structures |
| 4 | `expected '=>' after fn's parameter` | multi-clause `fn` |
| 3 | `unexpected character '\'` | string escapes (**L-B**) |
| 3 | `unexpected 'BAR'` | multi-clause `fn` again |
| ~10 | assorted singletons | pattern and tuple-binding edges |

**Known defects.** ~~1. String escapes are eaten~~ *(fixed v1.275)*. Still open:

1. `datatype u = B of {n:int}` is a parse error — record types cannot be
   constructor arguments.
2. `C (1,2)` prints `<C>` — the printer loses a multi-argument constructor's
   payload. `A 1` prints correctly.
3. REPL echo prints `7`, not `val it = 7 : int`.
4. `while … do` is not parsed.
5. *(new, v1.277; **closed v1.303**)* Recursion depth is the **host's**, not
   the interpreter's: a deep continuation-passing program can exhaust the JS
   stack. Inlining the closure application bought one frame; a trampoline would
   remove the dependency. The step budget counts steps, not depth, so it does
   not protect against this. — *Closed by proper tail calls, D-50. A tail call
   now reassigns and loops instead of recursing, so tail depth is bounded by the
   step budget. Non-tail depth is still the host's, which is the half Standard
   ML does not mandate. See `docs/tail-calls-plan.md`.*

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

### L-A. Fix the conformance splitter — **DONE, v1.274**

The splitter treated `in` and `end` as declaration starters, cutting every
`local … in … end` and `structure … struct … end` into unparseable fragments;
it also ended a declaration at any blank line and stripped comments with a
non-greedy regex blind to SML's nested comments. And `translate()` was still
skipping `local`, `functor`, `ref`/`:=` and the standard library — all four
added in v1.257. Both fixed: the splitter now tracks nesting depth over masked
text (comments and string bodies blanked) and ends a declaration only at depth
zero. **572 fragments → 408 declarations, skips 63 → 13, score 60% → 68%, no
language change.** Seven tests cover the splitter (`test/isml-splitter.test.js`),
and the harness is importable without running so they can reach it. The
prediction ("low 70s") was close; the real gain was smaller because the old
number was inflated by the translator counting skips as out-of-scope rather
than by fragments failing.

### L-B. String escapes — **DONE, v1.275**

`\n \t \r \\ \" \a \b \f \v`, the numeric `\ddd`, and the `\…\`
line-continuation, in the tokenizer. The old code copied the character after a
backslash verbatim, so `"a\nb"` was three plain letters — silent corruption.
Eight round-trip tests (`size "a\nb" = 3` with a real newline at position 1,
and an unknown escape reported not swallowed). The printer side was already
correct: `echo` emits the real newline. Score unchanged at 68% — the three
files with escapes fail on other constructs — so this was correctness, not
count.

### L-C. Printer fidelity — **DONE, v1.282**

- `C (1,2)` prints `C (1, 2)`; nested constructors parenthesise correctly.
- `val it = <value> : <type>` echo at the laptop when the checker is on,
  matching SML's top level. In the game this appears only with `ml` at the
  NostBook, where the checker already runs.
- Reals print as SML prints them (`2.0`, `~1.5`).

*(Order note, v1.274: on the corrected histogram L-D and L-E are 13 and 14, a
statistical tie, so the two are interchangeable in priority. L-E is the smaller
change — one name-lookup table against a whole precedence pass — so it is worth
doing first, and is listed first below. The old text called L-D "the largest
genuine gap"; the largest is now ascription, narrowly.)*

### L-D. Signature abbreviation — **DONE, v1.276**

Turned out to be `signature INT_DICT = DICT where type key = int`, not the
structure ascription (that already parsed a named signature). The parser
demanded `sig` after the `=`; the body may now be another signature's name, and
the new signature inherits its public names. `where type` is a no-op because
signatures track names not types. Opaque ascription through an abbreviated
signature hides the omitted names as through a literal one. **68% → 71%**, the
whole of `views.sml` recovered. Two tests.

### L-E. `infix`, `infixr`, `op` — **DONE, v1.277**

Fixity is parse-time, so the parser carries the table and updates it mid-parse.
The four hand-written levels became one precedence-climbing loop seeded with
SML's own table; a declared operator applies to the pair. `op` desugars to the
pair-taking function. **71% → 74%.**

Three findings worth keeping. **`o` and `before` must NOT be seeded** even
though the Basis has them infix: neither exists here and `o` is an ordinary
variable name, so seeding them reinterpreted every `x o y` and broke N-queens.
**Application must stop at a declared operator**, or `1 PLUS3 2` reads as
application. And a deep continuation-passing program sat within one host frame
of exhausting the JS stack — the closure case of application is now inlined at
the call site to buy that frame back, and a host stack overflow reports as
*this recursion never comes back* instead of leaking the engine's message.

**Still open (new, from this work):** the interpreter's depth limit is the
host's, not its own. A trampoline for the closure tail call would make deep
recursion independent of the JS stack. Worth its own item before the standalone
REPL, since a REPL invites exactly that kind of program. — **Done at v1.303**,
and the prediction held: the REPL is where it was met, in the shape of a
register entry (D-50) rather than a bug report.

### L-F. Small parse and semantics items — **DONE, v1.278–v1.281**

- `while e1 do e2` (parse to a recursive loop; it is sugar and SML defines it
  as such).
- Record types as constructor arguments: `datatype u = B of {n:int}`.
- Multi-clause `fn` at the top level of a file (parses at the console, fails in
  a file: 4 measured).
- Equality types in the checker: `''a` so that comparing functions is a TYPE
  report, matching the runtime refusal that already exists.
- A blank line inside a multi-line declaration must not end it when a file is
  read whole (interacts with L-A: splitter and parser must agree on this).

### L-G. A Basis slice — **DONE, v1.285**

Keep the prelude written in AI-ML and grow it to the ISML working set:
`List.exists/find/partition/zip`, `String.sub/substring/translate/tokens`,
`Int.toString/fromString`, `Real.toString`, `Bool.toString`, `o` composition,
`before`, `ignore`. The yardstick is what Harper's files call, not the Basis
document's 47 structures. Anything added is added as AI-ML source so a player
can read it, which is the standing rule.

*(Outcome, v1.285. All of it landed, plus `String.compare`, `Int.compare`,
`Char.compare`, a `Real` and a `Bool` structure, `ListPair`, and `datatype
order`. **Conformance did not move: 81% before, 81% after.** The prediction
above, and the histogram row ranking this stage at 5 declarations, were both
wrong. Harper's 32 files reference the Basis **nine times in total** — five
`String.compare`, three `String.explode`, one `String.implode` — and every one
sits inside a function body the harness never calls, so those declarations
already parsed and bound. A teaching text defines its own `map` and `reduce`
rather than importing them; that is what a teaching text is for. The value of
L-G is real and is not conformance: the standalone REPL now has the library a
person writing ML reaches for. **Measure what the corpus actually calls before
ranking a stage by it.** The harness loads the prelude now regardless, on the
principle that the instrument should do what the thing it measures does.*

*(`o` settled here too. v1.277 seeded it into `defaultFixity()`, hit a program
using `o` as a parameter name, and reverted; the test pinning that retreat
blamed Harper's N-queens, which never uses `o`. Every use of `o` in the corpus
is composition, and `fun f o = …` is a syntax error in real Standard ML as
well, where `o` is infix in the top-level environment. It is infix again,
declared in the prelude rather than seeded, and `nonfix o` gives the name
back — which is the distinction the plan wanted, and the reason fixity belongs
in a program rather than in a parser.)*

### L-H. Strict mode — **DONE, v1.283**

`typecheck: 'strict'` in the interpreter options. In strict mode a line whose
inference fails is refused with the type error, before evaluation; warnings
(exhaustiveness) stay warnings. The game keeps advisory mode everywhere. The
standalone REPL defaults strict with a `--sloppy` flag. One switch, no fork:
same checker, same messages, the only difference is whether the line then runs.

Order of work: **L-A, L-B, L-D and L-E all done (v1.274–v1.277): 60% → 74%.** Next by the
histogram: L-C (printer fidelity) and L-F (parse edges — multi-clause `fn` is
~7 of the remainder), then L-G (a Basis slice). Re-measure after each and
re-rank — the histogram is the authority, not this paragraph.

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
`LAMP_COLOURS` — so the seven importing files keep working unchanged.
(`parseSelection` lives in `unix.js`, not here, and is unaffected.)

Stages, each landing with the full suite green and zero behaviour change:

- **M1** — extract `lex.js` + `parse.js` (pure already; the largest cut). —
  **DONE, v1.286.** 1,175 lines left `ai_ml.js` (3,292 → 2,117). One addition to
  the file list above: **`errors.js`**, holding `RonmlError`, `RonmlFuelError`
  and `RonmlRaise`. All three layers throw them, and none of lex, parse or eval
  should have to import another just to say what went wrong. The cut itself was
  clean — the two blocks referenced exactly one name between them, `RonmlError`,
  which is what "pure already" meant.
- **M2** — extract `eval.js` + move `types.js`; `ai_ml.js` shrinks to the
  adapter plus a temporary pile of re-exports. — **DONE, v1.287.** 673 more
  lines out (2,117 → 1,444). `src/lang/` is now 2,527 lines against the
  adapter's 1,444. Two things worth recording:
  **The fuel counters moved rather than being re-plumbed.** `STEPS` and `FUEL`
  are module-level for the same reason `OUT` is, and the comment saying so
  moved with them: a closure captures the ctx of the line that DEFINED it, so a
  counter on `ctx` charges a function called on a later line against the wrong
  budget. Threading them as parameters means touching every recursive call in
  `evalNode`, which is a bigger change than a move-only stage may make.
  **The evaluator's one piece of game knowledge became a hook.** It read
  `ALL_VERBS` directly to say "that is a HERMES command, not an obelisk one",
  which meant the language knew about verbs and stations. `setHostNameHint`
  inverts the dependency: the language asks whether the host wants to say
  anything about an unknown name, and the adapter answers. This is the shape
  M3's `createInterpreter` will generalise — a host policy the language calls,
  not a host table the language reads.
- **M3** — introduce `createInterpreter`; the adapter builds its four station
  interpreters through it; kill the temporary pile. — **DONE, v1.288.** Also
  `basis.js` (the PRELUDE source) and `diag.js`, which §4's tree names but no
  numbered stage claimed, and `index.js`. Two notes:
  **`{ok, text, value}` is `{ok, text}`.** The contract sketched above returns
  the raw value; a closure's value holds the environment it captured, which
  holds the closure, so every result became unstringifiable the moment it was a
  function. A caller that needs the value can have a call that says so.
  **`createInterpreter` owns a session, not the sessions.** NostOS keeps one per
  terminal on `ctx`, so the adapter builds a wrapper per call. That is cheap —
  the state is in `ctx.session` either way — and it keeps the game's "bindings
  survive between visits" behaviour without the language knowing about visits.
- **M4a** — `prims.js`. **DONE, v1.288**, and it was not in the plan because
  nobody knew it was needed. See the entry under M4 below.
- **M4** — port the conformance harness and the language tests to import
  `src/lang/` directly, so they no longer touch game code at all. — **HARNESS
  DONE, v1.288.**
  **This is the stage that earned its keep.** Pointing the harness at the
  language dropped conformance 81% → 79%, eight declarations, and the cause was
  not a regression: `hd`, `tl`, `length`, `explode`, `implode`, `ord`, `chr`,
  `not`, `abs`, `real`, `floor`, `size` and `echo` were **game verbs**, defined
  in the laptop's table beside `scan` and `hack` because that is where they were
  first needed. They are Standard ML, and `basis.js` calls them — `String.size`
  is `length (explode s)`, `Char.isDigit` is `ord c >= 48` — so the language
  could not load its own library without the game attached. Nothing had noticed,
  and nothing would have until somebody cloned the split repository and typed
  `hd [1,2,3]`.
  They are `src/lang/prims.js` now. The adapter SOURCES them rather than copying
  them, and `createInterpreter({primitives: false})` lets a host that does its
  own filtering supply the set itself, which NostOS does: an obelisk control
  terminal has no `explode` and never did. Conformance 320/395.
  **The rule this settles: if the prelude can call it, it belongs to the
  language.** Everything that reaches into the world stays a host verb.
  Still to do under M4: `test/ai-ml-lang.test.js` keeps importing the adapter,
  and correctly — much of it tests adapter behaviour (stations, verb tables,
  `ml -full` wording). The language-only tests are `test/lang-interp.test.js`,
  which imports `src/lang/index.js` and nothing else.
- **M5** — strict mode (L-H lands here, in `interp.js`). **Done early, v1.283**,
  in `ai_ml.js`; it moves to `interp.js` with the rest.
- **M6** — `bin/bml.js`: a node REPL (readline, `val it = … : ty`, strict by
  default, `use "file.ml"`). At this point the language is demonstrable
  outside the game: `node bin/bml.js`. — **DONE, v1.284**

*(Order note, v1.284: M6 was taken first, against the order above, and the
reasoning is worth keeping. The REPL is what demonstrates the language stands
alone; the file split is reorganisation that leaves behaviour identical. Doing
the demonstrable thing first costs nothing, because `bin/bml.js` imports
`ai_ml.js` today and will import `src/lang/index.js` after M3 with no other
change, and it buys a second check on the split: 15 tests that drive the
language as a program, over a pipe, through argument parsing and exit codes.
It earned that on its first run by finding the fixity/typecheck disagreement
below.)*

**What M6 found.** `typeReport` parsed with the default fixity table while the
evaluator parsed with the session's, so after `infix 6 plus` the two read
`2 plus 3` as different programs and the checker rejected a good line. No unit
test had caught it because the language tests call `runRonml` alone, where the
checker never runs. This is the same shape as every other defect the plan has
paid for: **a fix applied to one branch and not its sibling**. The session
fixity had been threaded into the evaluator's parse and not the checker's.

---

## 5. The standalone repository

Made after M6, not before: a repo whose first commit already runs a REPL and
passes CI is worth looking at; a repo of parts is not.

**Mechanics.** *(Rewritten v1.288 after a dry run. The sentence here used to
say `git subtree split --prefix=src/lang` "plus bin/, the language tests, and
the harness", which is not a thing subtree split can do: it takes ONE prefix
and cannot rename. The tool that does the job is `git-filter-repo`.)*

```
git clone <nostos> bml && cd bml
git filter-repo --force \
  --path src/lang --path bin --path tools/isml-conformance.mjs \
  --path test/lang-interp.test.js --path test/bml-repl.test.js \
  --path test/isml-splitter.test.js \
  --path src/game/types.js --path src/game/ai_ml.js \
  --path-rename src/lang/:src/ --path-rename src/game/types.js:src/types.js
```

Two of those paths need explaining. **`src/game/types.js`** is where the type
checker lived until M2, so without it the checker's history stops at the move;
the rename brings it to `src/types.js` and the history follows. **`src/game/
ai_ml.js`** is the language's whole prehistory — every stage from L-A to L-H
happened inside that file, which is to say the 60% → 81% climb is recorded
nowhere else. The path is kept for the history and the FILE is deleted at the
tip, so the repository carries the record without carrying the game.

Afterwards, three import paths point at the old layout (`../src/lang/index.js`
in `bin/bml.js`, the harness, and `test/lang-interp.test.js`) and are fixed in
the first commit on top.

**Verified by dry run, v1.288**: 485 commits in, **38 out**, back to v1.242
where `ronml.js` became `ai_ml.js`. In the split tree `node --test test/*.js`
is 35/35, `node bin/bml.js` runs, and the conformance harness reports the same
81%. Nothing was pushed.

**The repository exists**: [critical-code-studies/BML](https://github.com/critical-code-studies/BML),
created 2026-07-27, empty and waiting for the split. Nothing is pushed to it
until M6 lands.

```
BML/
  src/            lex, parse, eval, types, basis, diag, interp, index
  bin/bml.js      the REPL
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

1. ~~**Name.**~~ **DECIDED 2026-07-27: BML** (Berry ML), at
   [critical-code-studies/BML](https://github.com/critical-code-studies/BML).
   Considered and set aside: `LitenML` (Norwegian, "little ML") and
   `BitteLitenML`. Suggested README tagline **"a little Standard ML"**, which
   keeps the LitenML sense without the spelling. The binary is `bml`. The
   in-fiction name stays AI-ML, and so does `AIML_VERSION`.
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

*(This section is rewritten at each stage. Its history is in the CHANGELOG.)*

**Where it stands at v1.290.** Every language stage is done (L-A through L-H),
every modularisation stage is done (M1–M6, plus `prims.js` which no stage had
foreseen). `src/lang/` is eleven files behind one `createInterpreter`.
Conformance 320/395 (81%). CI exists. `ml -strict` exists. **Printer fidelity is
closed**: D-13, D-51 and D-52 retired at v1.290.

**The split is the remaining step, and it is rehearsed.** §5 carries the
commands that work; the dry run produced 38 commits, 35/35 tests and the same
81%. Nothing has been pushed to
[critical-code-studies/BML](https://github.com/critical-code-studies/BML) but
the README and the MIT licence.

### The defects, closed

**Closures capturing the top-level store — CLOSED, v1.291.** A top-level
rebinding now opens a frame on a prototype chain rather than writing over the
slot an existing closure is reading, so `val n = 10; fun addn m = m + n; val n =
99; addn 1` answers 11. The tip of the chain lives on the session (`__env`)
rather than in a local, because NostOS builds a fresh interpreter per line
around one session object. Recursion is untouched: it needs the environment live
at definition and still gets it.

The save collision the previous note predicted was real, and turned out to be
hiding something worse. `flattenSession` walks the chain so a save keeps every
visible binding. But a closure holds the environment that holds the closure, so
a session with a function in it **could not be stringified at all**, and
`player.laptop` goes into the save blob, and the throw was swallowed by the
`catch` around `localStorage`. Defining a function at the NostBook stopped the
game saving and said nothing. `flattenSession` drops what cannot survive a round
trip, tested by trying rather than by listing tags.

*(Two guesses were wrong on the way, both now noted in the code. The pattern
node types are lowercase, not `PVar`/`PAs`, and the node is `TopLetPat`, not
`LetPat`, so the first version of the fix left `val (a, b) = …` binding over a
captured frame exactly as before. Read the node names out of eval.js; do not
guess them.)*

**Printer fidelity — CLOSED, v1.290.** D-13, D-51 and D-52 retired.

---

## 9. Where this leaves the project

Every stage in this document is done. The language is at
[critical-code-studies/BML](https://github.com/critical-code-studies/BML) under
MIT, 45 commits of real history reaching back to v1.242, with CI, a REPL, and
81% of Harper's corpus running as written.

What would come next, if it continues, is no longer modularisation but the
language itself: the remaining 19% of the corpus, `while … do`, record types as
constructor arguments, case-sensitive identifiers (names are lower-cased here,
which Standard ML does not do), and a trampoline so recursion depth stops being
the host's. None of that is planned here. This plan is finished.

*(Postscript, v1.303: all of that list except case-sensitive identifiers and the
remaining corpus percentage has since been done — `while … do` at v1.300, record
constructor arguments at v1.302, the trampoline at v1.303 as proper tail calls.
It continued.)*
