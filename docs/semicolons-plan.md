# `;` between declarations

*Written 2026-08-06 at v1.306. Planned before the code because the change is to
a loop the GAME leans on: `(echo n ; go (n - 1))` is the countdown program in
`ai_ml.js`, `ml-docs.js` and on the relay disk, and it is a sequence inside
parentheses.*

## What fails

```
val p = 1; val q = 2      ERR: expected 'in' after let
open List;                ERR: expected eof, got 'SEMI'
```

The first is the interesting one. `val p = 1` at the top level is read by the
declaration parser, which calls `parseExpr()` for the value — and `parseExpr`
has a `;` loop, so `1; val q = 2` becomes a SEQUENCE, `val q` is read as an
expression, and the `let` path in it asks for the `in` that is not there.

The second is simply that a trailing `;` reaches `eat('EOF')`.

Directly worth **4 corpus declarations**, plus an unknown number downstream: a
refused declaration leaves its names unbound, and there are four
`unbound variable: t` failures that look like exactly that.

## The distinction the parser is missing

`;` means two different things in Standard ML, and this build implements only
the second:

| where | what it means |
|---|---|
| between and after TOP-LEVEL declarations | a separator, and a terminator |
| inside `( … )`, or a `let … in HERE end` body | an expression sequence, answering the last |

One `;` loop serves the second, and it runs everywhere — so at the top level it
eats a `;` that was never its own.

## The change

1. **A depth counter, `seqDepth`.** Raised while parsing inside `( )` and
   inside a `let … in HERE end` body; the `;` loop in `parseExpr` runs only
   when it is above zero. At the top level `;` is then left for:

2. **`parse()` reading a `;`-separated run of declarations.** One declaration
   is returned as it is today. More than one becomes
   `{type: 'Decls', items, sequential: true}` — the marking `abstype` already
   uses, because these run in order and each may use the names before it, which
   is not what a bare `Decls` means (an `and`-chain, simultaneous since v1.299).
   A trailing `;` is allowed and produces nothing.

## The risk

`(echo n ; go (n - 1))` is inside parentheses, so `seqDepth` is above zero and
it is untouched. `let … in a; b end` is a let body, likewise. The shapes to
check by hand, because a green suite would not tell me which of them was ever
at risk:

1. The countdown program, in the exact spelling the game ships.
2. `(1; 2; 3)` and `(if true then 1 else 2; 7)` — v1.306's own fix.
3. `let val x = 1 in x; x + 1 end` — a sequence in a let body, no parentheses.
4. `while c do (a; b)` — a sequence inside a loop inside parentheses.
5. A machine program at a station, which is where a sequence is normally typed.

## What this does not do

`;` inside a `struct … end` body. Standard ML allows it and the corpus uses it;
the struct body is a list of declarations parsed by a different loop, and if it
falls out of the same change it is a bonus rather than the aim. Say which,
afterwards.

## How it will be verified

1. The five shapes above, by hand, before the suite.
2. `val p = 1; val q = 2` binds both and reports both.
3. `open List;` runs, and so does a file whose every line ends in `;`.
4. The corpus figure, which should rise; whatever it does is the honest number.
5. The nine examples, and 771 tests.

## What happened (v1.307)

All five at-risk shapes held on the first run, checked by hand before the suite:
the countdown in the game's exact spelling, `(1; 2; 3)`, `(if … else …; 7)`,
a `let` body without parentheses, and a sequence inside a loop. `seqDepth` is
the whole mechanism — nine `let … in` bodies and the paren atom raise it, and
the `;` loop consults it.

Corpus **338/408 → 344/408 (83% → 84%)**, six declarations, which is what the
four direct failures plus their downstream cost. 771 tests, checklist 82/82.

**The open question needed its own fix.** `;` inside a `struct` body did not
fall out of the change: those bodies are read by a different loop,
one declaration after another, with nowhere for the token to go. Same for
`local` and an `abstype` with-block. One helper, `eatDeclSemis`, called by all
five list loops, which is the top-level rule one level down. A `sig` body and a
`let`'s declarations already worked.

**One test changed, deliberately.** `let go n = if … else echo n ; go (n - 1)`
now REFUSES, where yesterday it merely parsed: the `;` makes it two
declarations, and the second is `go (n - 1)` with no `n` in scope. That is what
Standard ML reads it as, and `go` is bound all the same. Every place the game
teaches this program parenthesises it.

## What is still left, after this

Two parser gaps, from the same corpus tally:

- **`structure Q = Queue`** — a structure alias. Read as a functor application
  with no argument, so it answers *Queue is not a functor*.
- **`fun (f ** g) (x, y) = (f x, g y)`** — defining an operator in its infix
  form.

## What the `;` work exposed, and is also fixed

Routing `;` through the `Decls` node made a hole visible that had been there
since `Decls` existed: **the checker had no case for it at all.** So
`remember` was never told what an `and`-chain declares — the evaluator bound
the names and the checker did not — and under strict, which is the command
line's default, `val u = 1 and v = 2` declared two names and then refused both
the moment you used one.

Three parts to closing it:

- `infer` walks the items, leaving each one's type on the item the way
  `StructDecl` leaves its members, and `remember` records them one by one.
- A **sequential** run registers as it goes, so `datatype c = R; val z = R`
  knows what `R` is by the time it reaches `z`. An `and`-chain does not, being
  simultaneous.
- **No `try`/`catch`.** `StructDecl` has one and copying it here was wrong: a
  clash in one declaration of a top-level run must refuse the LINE, exactly as
  it would if the declaration stood alone. With the catch,
  `type ct = int; val w : ct = "s"` ran.

And a run reports **one type per declaration**, paired with its answer line.
Reporting the run's own type printed `val q = 2 : unit`, which says the wrong
thing about `q`. Where the counts do not line up — a declaration that binds no
value echoes nothing — the answer prints with no type rather than with a
multi-line one.
