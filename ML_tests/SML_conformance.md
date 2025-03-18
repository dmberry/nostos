# SML conformance

What "conformant" means here, how it is measured, and what is currently in the
way. The target is the one the standalone plan sets: **a small Standard ML**,
core language complete against Harper's *Introduction to Standard ML*, modules
restricted and documented, a Basis subset, every departure named.

Reference: Harper, R. (1993) *Introduction to Standard ML*, School of Computer
Science, Carnegie Mellon University (exercises by Kevin Mitchell, University of
Edinburgh). Second reference for the library yardstick: Wikström, Å. (1987)
*Functional Programming Using Standard ML*.

## Method

Each test states what **Standard ML** does. Where the build agrees, the case
lives in `core/` and is a regression guard from then on. Where it disagrees, the
case lives in `harness/departures.mjs` with the SML answer recorded next to what
the build does instead, and `departures/register.test.js` asserts the
disagreement is still real.

Nothing is skipped and nothing is marked "known failure" in a way that stops it
running. A skipped test is a claim nobody checks.

Cases are chosen so the two possible answers differ. `1 + 2 * 3` proves
precedence; `2 + 2 * 2` does not, because both parses give 6.

## Coverage by area

| Area | File | Holds today |
|---|---|---|
| Literals, escapes, comments, unit | `core/lexical.test.js` | int/real/char/string, `~` on both sides of the printer, the SML escape set with `\ddd`, floor `div`/`mod` with the divisor's sign |
| Precedence, associativity, fixity | `core/operators.test.js` | SML's levels, left/right associativity, short-circuiting, `infix`/`infixr`/`nonfix`/`op`, declared levels honoured, fixity scoped to its block |
| val, fun, let, local, and | `core/bindings.test.js` | pattern bindings, scoping, shadowing, mutual recursion at top level, the value restriction, annotations |
| Functions, patterns, exhaustiveness | `core/functions.test.js` | currying, closures over `let`, clausal definitions, `fn` alternatives, as-patterns, record/list/tuple patterns, warnings that name the missing constructor |
| Datatypes, records, lists, strings | `core/data.test.js` | constructors with payloads, type variables, recursive datatypes, label-order-independent records, `List`/`String` working set |
| Refs, equality, exceptions | `core/state.test.js` | typed cells, identity equality on refs, structural equality elsewhere, refusal on functions, declare/raise/handle |
| Modules | `core/modules.test.js` | structures, qualified and nested names, opaque ascription hiding names, generative functors |
| Inference and the two modes | `core/types.test.js` | Hindley-Milner with occurs check, let-polymorphism, value restriction, advisory mode, **strict mode**, `val it = 7 : int` echo |
| Error behaviour | `core/robustness.test.js` | no JavaScript error reaches the operator, under a battery of malformed input and every prefix of seven valid programs |
| The standalone REPL | `repl/bml-repl.test.js` | strict by default, `--sloppy`, `:t`, files, `use`, `-i`, exit codes, survives nonsense |

## Strict mode

Strict mode is the property that makes this an ML rather than a language that
infers types and then ignores itself. In advisory mode
`let val g = fn x => x ^ "!" in g 1 end` answers `1!`; strict refuses it before
evaluation. The game stays advisory everywhere, because a machine in a ruin
should say what it worked out and let the operator decide; `bin/bml.js` defaults
strict.

Exhaustiveness stays a warning in both modes. A case with a hole is not an
ill-typed program.

## The departure register

32 entries at v1.291, by severity. Counts move as the language grows; the
register itself is the authority.

| Severity | Count | Meaning |
|---|---|---|
| `silent` | 7 | Wrong answer, no error. Nothing tells the operator. |
| `gap` | 18 | Refused, correctly reported, feature absent. |
| `report` | 5 | The value is right and the inferred type is wrong. |
| `shape` | 2 | Right answer, printed differently from SML. |

Four entries have been retired since the register was written, each because the
language grew to cover it and the walking test said so: **D-13/D-51/D-52** (a
char and a string now print with their delimiters and the type is `string` and
not `str`, v1.289) and **D-54** (the top level is lexically scoped, v1.291).
Their cases moved into `core/` as positive assertions.

The `silent` ones are worth reading first, because every other class announces
itself:

- **D-07, `val rec f = ...` binds a variable called `rec`.** The name after
  `rec` is never bound, so `val rec fact = fn n => ... fact ...` followed by
  `fact 5` is an unknown name. Same shape as the historic `nil`-in-parameter
  bug: a keyword taken for an identifier, the wrong thing bound, no error.
- **D-01, boolean precedence is inverted.** `true orelse true andalso false`
  answers false; SML answers true, because `andalso` binds tighter.
- **D-53, `and` is not simultaneous.** The chain is rewritten into a sequence,
  so a right-hand side sees the bindings made earlier in the same declaration.
- **D-55, an unbound name on the right of a binding is not caught.** `val x =
  notbound` binds the atom `notbound`, so a typo in a `val` succeeds silently.
  In expression position it is now refused (`unbound variable: hfhfh`). The
  atom rule is a game-ism the consoles need, since a node code `OB_1A2B` and a
  filename `foo.ml` are values there; it should not be in the standalone
  language, where the host can supply it as a primitive if it still wants it.
- **D-04 and D-05, opaque ascription.** A hidden name evaluates to a bare atom
  of its own spelling rather than being refused, and an abbreviated signature
  (`signature ABBR = SIG`) inherits no names, so ascribing to one hides
  everything. Both are D-55's mechanism seen from the module system.

D-05 is worth a second look because of how it was found. v1.276 made the form
parse and the conformance score went 68% to 71%, which reads as the feature
working. The score measures whether a declaration is *accepted*, not whether it
*means* what SML means. A parse-level number cannot see this class of defect,
which is the argument for having both instruments.

## The instrument

The conformance harness has been wrong before the language was, four times, and
the harness in this suite nearly made it five: `run()` originally skipped the
type checker, which silently disabled exhaustiveness warnings and would have
reported a working feature as broken. Before believing a conformance change,
check the instrument.
