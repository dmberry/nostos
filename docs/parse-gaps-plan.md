# The last twelve parse failures

*Written 2026-08-08 at v1.311. Planned before the code because the biggest of
these changes the EXPRESSION grammar, which everything else in the language
sits on, and because the last count of these was made by eye and was wrong.*

## What they actually are

Twelve declarations the parser refuses. Each one's source was read rather than
inferred from its error message, and they are not twelve of anything: **six are
ours and six are not Standard ML.**

### Not ours, and no fix will reach them

| file | what it says | why |
|---|---|---|
| hierarchies.sml ×2 | `structure X :> SIG = sig … end` | `sig` where the language wants `struct` |
| parameterization.sml | `fun lookup (Empty, \_)` | a LaTeX escape left in the source |
| typinf.sml | `fn r : \{name:string\} =>` | the same, twice on one line |
| typinf.sml | `fn s:string => s ^ "\n".` | a full stop, from the prose around it |
| typinf.sml | `fun #name {name=n, ...} = n` | `#name` cannot be declared; Harper is showing what it MEANS |
| streams.sml | `datatype lazy 'a stream` | `lazy` is SML/NJ's, not the Definition's |

One more, `typinf.sml`, is two `fn` expressions on consecutive lines with no
separator between them. That is the splitter's, not the parser's, and it is
left alone: the two lines are two examples in a listing, and joining them would
be inventing a program Harper did not write.

### Ours, and what each is worth

| | form | corpus |
|---|---|---|
| **P1** | `let … end` as the operand of an operator: `let val m = 3 in m end * 2` | 2 |
| **P2** | a literal pattern in a `val`: `val 0 = 1-1` | 1 |
| **P3** | an operator defined in its infix form: `fun (f ** g) (x, y) = (f x, g y)` | 1 |
| **P4** | `fn` as a clause body when there is more than one clause | 1 |
| **P5** | `as` inside a parameter of an `and` continuation | 1 |

## P5 first, because it is already diagnosed

`fun z 0 = 0 and a (Pcl (r as ref c)) = c` answers *expected rp, got 'as'*, and
the same line without the `and` is fine.

`andIsBinding` decides whether an `and` starts a binding by scanning ahead for
the `=`. It scans a WHITELIST of token types, and the whitelist has no closing
bracket in it, so the scan stops at the first `)` it meets. A parameter it
cannot spell makes the `and` a boolean conjunction, and then the parameter is
parsed as an expression, where `as` means nothing.

The fix is not another token added to the list. It steps over balanced brackets
whole, and inside them accepts anything: what is in a pattern is the pattern
parser's business, not the lookahead's. **This is the third stale hand-written
list in this file** (the `with` stop list, the annotation lookahead, this), and
the shape is always the same.

## P1 is the one with risk

`let … end` is parsed as a whole expression, so nothing can follow it. In
Standard ML it is an ATOM: `let … end * x` multiplies. Two corpus declarations
want this and both are ordinary arithmetic.

The risk is the `;` work at v1.307. A `let` body sequences with `;`, and
`seqDepth` is raised while parsing one. If `let` becomes an atom in the operator
grammar, the shapes to check by hand before the suite:

1. `let val x = 1 in x; x + 1 end` — a sequence in a let body, no parentheses.
2. `(echo n ; go (n - 1))` — the countdown, in the game's exact spelling.
3. `let … in … end` as a whole declaration, which must not become an expression.
4. `let … end` on its own, with nothing after it.
5. A `let` inside a `let` body.

## P2, P3, P4

**P2.** `val SOME z = SOME 4` already works, so the `val` binding does take a
pattern; `val 0 = 1-1` does not, so it is the LITERAL that is refused. Standard
ML allows it, and it raises `Bind` when it does not match.

**P3.** `fun (f ** g) (x, y) = …` names the function in the position it will be
used in. `**` already lexes as a symbolic identifier since v1.306; what is
missing is the declaration form.

**P4.** `fun sa nil = fn l => l | sa (h::t) = …` — a `fn` as a clause body. One
clause is fine, so this is a repeat-position gap, the same family as v1.310's.

## How it will be verified

1. Each of the five in isolation, with its working twin beside it, before any
   suite is run.
2. P1's five at-risk shapes by hand, because a green suite would not say which
   of them was ever in danger.
3. A test per fix in the shared file, each asserted to FAIL against the parser
   as it stands now.
4. 815 tests, checklist 88/88, all 30 examples.
5. The corpus. It should reach 360 of 408; whatever it does is the number.

## What happened (v1.312)

**P1, P4 and P5 shipped. P2 did not, and the reason is the interesting part.**

Corpus **354 → 357 of 408 (87% → 88%)**, `refused: parse` **14 → 11**. Five
declarations moved: clauses is unaffected without P2, and fcns, vardec, fcnls
and refs each gained one.

P1 turned out to be half a fix and the test says so. `let … end` works as the
LEFT operand, which is what both corpus declarations write; on the right it is
still refused, because the right operand is read by the operator grammar and
there is no `let` in it. Asserted as refused rather than left unsaid.

### P2, and why the number went DOWN

`val` and `fun` were skipped without recording which word was written, so
`val SOME z = SOME 4` was read as a FUNCTION called SOME taking z. `z` was
never bound, the constructor was shadowed, and `SOME 9` afterwards recursed
until the step budget ran out. **No error at any point.** That is worse than the
parse error P2 set out to fix, and it is still there.

Teaching `val` to take a pattern cost the corpus **eight declarations**, and
nine of them are in streams.sml, where `val Cons _ = s'` had been "running" by
declaring a function called Cons. Those were never right; the number was
flattering itself. But the change also broke `repinv.sml`, where a `val` inside
a `structure … struct … end` has no `in` to nest toward, and the diagnosis was
not finished. Two further holes opened on the way, both fixed and both kept
here as notes for whoever picks this up:

- The pattern path handles ONE binding and then wants `in`. Sequential
  `val P1 = e1 val P2 = e2 in b end` needs the tail parsed as its own `let`,
  which also gives P1 the right scope inside e2. (datatype.sml writes this four
  times.)
- The name path's continuation must not swallow a `val` that takes a pattern,
  or the constructor is taken for the name being bound again.

**Shipping a parser change whose corpus effect is not understood is how this
project has fooled itself before.** The work is in the session record; the
silent wrong answer is the reason to come back to it.

### The six that no fix will reach

Unchanged, and listed above: two `sig`-for-`struct`, two LaTeX escapes, a full
stop carried in from the prose, `fun #name`, and SML/NJ's `lazy`.

## P2, finished (v1.313)

The diagnosis that was missing last time: the failure in `repinv.sml` was **not
P2's**. `and lk' ((key1, datum1), left, right) = …` was already refused at
v1.312, because whether an `and` starts a binding is decided by scanning to the
`=` and **three** places asked that question while only one had been given the
bracket-balanced scan. The other two still carried lists of permitted tokens,
and neither had a closing bracket or a comma in it, so a tuple parameter
stopped the scan short. All three share one scan now.

That also caught a regression **v1.312 shipped**: `repinv.sml` went 3/3 to 2/3
and the rising total hid it. Read the report per file, not the headline.

`val` takes a pattern now, and two holes behind it are closed: several pattern
bindings before an `in` (they nest, which also gives the first its scope inside
the second), and a `struct` body, which has no `in` and where a pattern binding
must end where it ends.

**Corpus 357 → 350, and the fall is the finding.** Nine of the declarations
that stopped running are in `streams.sml`, where `val Cons _ = s'` had been
running by declaring a function called `Cons`. `refused: parse` went 11 → 9.
