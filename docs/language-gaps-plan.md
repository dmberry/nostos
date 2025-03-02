# The eight remaining language gaps

*Written 2026-08-08 at v1.321, from a sweep of 31 features across core, types,
modules and lexis. The other three areas are complete; these eight are what is
left that is Standard ML and is not here.*

Ordered by risk, lowest first, because two of them touch the declaration parser
and one touches the operator grammar — the two places this session has already
been bitten.

| | gap | where |
|---|---|---|
| **G1** | control and unicode escapes, `\^A` and `A` | lexer |
| **G2** | numeric record labels, `{1 = 9, 2 = 8}` | parser, record literal and pattern |
| **G3** | `datatype t = datatype u` | declaration parser + the constructor registry |
| **G4** | `open` inside a `let` | the let parser |
| **G5** | `let … end` as an operator's RIGHT operand | operator grammar |
| **G6** | a functor taking several structure arguments | functor header |
| **G7** | `op` in a pattern, `fun (op +) (a, b) = …` | pattern parser |
| **G8** | an operator DEFINED infix, `fun (f ** g) (x, y) = …` | declaration parser |

## What each is

**G1.** `\^A` is the control character whose code is `A` minus 64; `A` is
four hex digits. Both are in the Definition's string escapes and neither lexes.

**G2.** In Standard ML a tuple IS a record with numeric labels: `(1, 2)` and
`{1 = 1, 2 = 2}` are the same value. The labels parse as identifiers here, so
the numeric form is a parse error.

**G3.** `datatype t = datatype u` makes `t` another name for `u`, sharing its
constructors. The same shape as `exception E = Fail`, done at v1.320.

**G4.** `let open List in null [] end`. The let parser takes bindings and
nothing else.

**G5.** `1 + let val m = 2 in m end`. The left operand works since v1.312; the
right is read by the operator grammar, which has no `let` in it.

**G6.** `functor F (structure P : S structure Q : S) = …`. One structure
argument works; a list of them does not.

**G7/G8.** Both need the declaration parser to read a parenthesised left-hand
side: `(op +)` as a name, and `(f ** g)` as a name with two parameters around
it. G8 is the one that appears in the corpus (`seq.sml`).

## The risks

**G5 is the operator grammar**, which is where the `;` work and the
`let … end` left-operand work both had to be checked by hand. Same five shapes
again: a sequence in a let body, the countdown in the game's spelling, a let as
a whole declaration, a let with nothing after it, a let inside a let.

**G8 rewrites a declaration's left-hand side**, and the declaration parser is
where `val`/`fun` conflation already caused a silent wrong answer this session.
`fun (f ** g) (x, y) = …` must define `**`, not a function called `f`.

**G3 must share identity, not copy it.** `datatype t = datatype u` then a
constructor of `u` must match a pattern written against `t`. The exception
replication at v1.320 got this wrong on the first attempt: it bound the alias
and left the matcher comparing the written name, so only one direction worked.

## How each will be verified

1. In isolation, with the form that already works beside it, before any suite.
2. G5's five at-risk shapes by hand.
3. A test per gap, each asserted to fail against the parser as it stands.
4. The corpus after each, not just at the end: v1.312 shipped a per-file
   regression that a rising total hid.
5. 841 tests, checklist 100/100, all 30 examples.

## What happened (v1.322)

**All eight.** Corpus **350 → 355 of 408 (87%)**, `refused: parse` **9 → 8**,
which was not the aim: none of these was chosen for the corpus, and the five it
moved are a side effect of G5 and G8.

Each of the eight has a test that fails against the parser as it stood, checked
by stashing it. G5's five at-risk shapes were checked by hand before any suite,
as the plan said, and all five held.

### Three that were bigger than the plan said

**G5 also fixed `if`, `case` and `fn` on the right.** The gap was never about
`let`: the operator grammar had no room for anything parseExpr1 reads whole, so
`1 + if true then 2 else 3` was refused too. One predicate covers them all.

**G6 needed the application form as well as the header**, and then a second
spelling of it: `examples/25-functors.ml` writes
`Sorter (structure Elt = struct … end)`, an anonymous structure per binding,
which the first version refused. The example caught it, which is what the
examples are for.

**G7 and G8 had to be tried BEFORE the pattern branch.** `fun (f ** g) …`
begins with a `(`, so the val-pattern path took it first and read the whole
left-hand side as something to bind. Nothing is consumed when the shape is
neither, so `fun idp (x) = x`, `fun swp (a, b) = …` and `val (a, b) = …` are
untouched — asserted rather than assumed.

### And one test went red on purpose

The v1.312 test asserting `let … end` is **still refused** as an operator's
right operand. That is the walking-test pattern working: the assertion was
written to go red when the gap closed, and it did.
