# The harness, and the module forms

*Written 2026-08-08 at v1.307, in answer to "how do we get to 100% of SML".
Planned before the code because the first half changes what the number MEANS,
and it would be embarrassing to move the number without knowing that.*

## Part 1: the harness is scoring the wrong thing

Three ways the current figure understates the language, each verified against
the corpus source rather than assumed.

### Harper prints deliberate errors

`typval.sml` line 8 onward:

```
size 45 ;        #"1" + 1 ;        #"2" ^ "1" ;        3.14 + 2 ;
```

Four ill-typed expressions in a row, put there to show a student what a type
error looks like. BML refuses all four, correctly, and the harness counts a
refusal as *did not run*. **BML is penalised for being right.** Same for
`val (m:int, r:real) = (7, 7.0, "7")`, a two-pattern against a three-tuple.

### A raise is not a failure

`hd nil` runs and raises `Empty`. Standard ML does the same. The harness counts
it against us.

### Parts of the corpus are not valid Standard ML

This is the one that settles the question. In `parameterization.sml`:

```
fun lookup (Empty, \_) = NONE          (* a LaTeX escape, left in the file *)
fun insert (None, k, v) =              (* None, for NONE *)
    Node (Empty, k, v, Empty)          (* Node takes THREE arguments *)
```

and in `hierarchies.sml`, `structure MyIntDict :> MY_INT_DICT = sig …` where
Standard ML wants `struct`. These are teaching listings, and some of them have
never been through a compiler. **100% is not reachable, and the ceiling is not
a fact about BML.**

### What the harness will report instead

One number is doing too many jobs. It becomes a shape:

| outcome | meaning |
|---|---|
| **ran** | the headline, unchanged |
| **raised** | ran and raised, as Standard ML would |
| **refused: type** | the checker refused it. MAY BE CORRECT: this is where Harper's error examples land |
| **refused: parse** | could not read it. Never correct, always ours |
| **cascade** | failed naming something an EARLIER failed declaration would have bound |

The cascade bucket is the one worth having. A single refused `structure` turns
every later use of it into an unbound name, so the raw failure count says more
about one bug than about the language. Detected by keeping the names each
failed declaration would have bound and checking later failures against them.

**No hand-maintained list of known-good refusals.** That is the register's
lesson in reverse: a list nobody walks goes stale, and this one could not be
walked, because deciding whether a refusal is correct needs a reference
implementation and there is none on this machine.

## Part 2: the module forms

Most of what I expected to be missing is already there, checked one by one:
ascription on a structure, a functor taking `(structure K : SIG)`, applying
one, `:> SIG`, and `:> SIG where type` all work. Two things do not.

### M1. A structure bound to another structure

```
structure Q = Queue                     → Queue is not a functor
structure Key : ORDERED = K             → K is not a functor        (inside a struct)
```

`structure A = B` is read as a functor application with no argument. One fix,
and it is the cascade source: `Key` appears inside nearly every dictionary
structure in `subfun.sml` and `hierarchies.sml`, so each failure takes the
whole structure with it and then everything downstream that uses it.

### M2. The functor header is cut from its body

```
functor DictFun (structure K : ORDERED) :> DICT where type Key.t = K.t =
struct
  …
```

`joinProgram` splits these into two declarations, so the header fails on the
missing `struct` and the body arrives as a stray `struct …`. A declaration
ending in `=` should take the next line with it.

## Order, and why

The harness first. Moving the language without a trustworthy instrument is how
this project has fooled itself before, twice with this same harness.

Then M1, then M2, re-measuring after each so it is clear which one paid.

## What will be checked

1. The five outcome buckets each get a case that lands in them, asserted.
2. The cascade detector: a refused `structure Q = …` followed by `Q.foo` marks
   the second as a cascade rather than as an independent failure.
3. `structure Q = Queue`, `structure Key : ORDERED = K` inside a struct, and
   ascription on both.
4. The functor header joins to its body.
5. 779 tests, the checklist at 82/82, and the nine examples.
6. The corpus figure, whatever it does. It should rise, and the shape underneath
   it should show fewer cascades.

## What happened (v1.308)

### The harness

Six buckets, not five: **`not in listing`** was not in the plan and is the one
that settles the question. Harper's listings are sketches as often as programs.
`subfun.sml` writes `structure Key : ORDERED = StringLT` where `StringLT`
appears nowhere in the file, two lines above `val insert = raise
NotImplemented`. No implementation could run that, and counting it against this
one says nothing about this one.

Of 408 declarations:

```
ran              349   86%
raised             6   ran, and raised, as Standard ML does
refused: type     13   MAY BE CORRECT — Harper's deliberate errors land here
refused: parse    18   could not be read. Ours, and the only real gap
cascade           10   tripped over a name an earlier failure would have bound
not in listing    12   names something the file never defines
```

**Eighteen declarations are ours**, and two of those are Harper's stray LaTeX
escape (`\_` left in the source), so sixteen. The old scoring said fifty-nine.

### The modules

`structure A = B` was the cascade source and closing it moved 344 → 349. The
form appears three ways and all three now work: at the top level, inside a
struct (which needed the scope CHAIN walked rather than own keys, since a
struct body runs in a scope that inherits from the enclosing one), and naming a
functor's own parameter. The checker copies the member types across, so
`Q.insert` types as `Queue.insert` does.

`joinProgram` joins a line that cannot have ended, which fixed the functor
header being cut from its `struct`. It moved the number not at all, because the
functors it unblocked then failed on Harper's own broken source: `None` for
`NONE`, and a constructor declared with three arguments and applied to four.
Worth having anyway, and the reason it paid nothing is now visible in the
report rather than hidden in a count.

### And one the harness found on the way

A failed match threw a plain error instead of raising `Match`, so
`handle Match` had nothing to catch. That is the gap v1.301 closed for `Empty`,
`Div` and the rest, missed for this one because the evaluator raises it rather
than a primitive. Six declarations moved into `raised` as a result, which is
where Standard ML would put them.

## What is left, and what it is worth

Sixteen parse gaps, no two alike: `expected eq, got 'COLON'` twice,
`expected eof, got 'datatype'` twice, and eleven singletons. There is no
cascade left to unlock and no single fix worth more than one or two
declarations.

The reachable ceiling is about **367 of 408, near 90%**. The rest is a property
of the corpus.

## The annotation cluster (v1.310)

Four of those sixteen were one omission wearing four faces, and each had a
working twin one line above it:

| refused | accepted |
|---|---|
| `fun g (m:int,0):int = m \| g (0,n:int):int = n` | the same with ONE clause |
| `let val m:int = 3 val n:int = m*m in …` | the annotation on the FIRST val only |
| `val pi : real = 3.14 and e : real = 2.17` | the annotation on the FIRST binding only |
| `fun dst {x = x : real, y = y : real} = …` | the record pattern without annotations |

The annotation was read at the first binding of a run and nowhere else, so the
second of anything refused what the first accepted. `clausalRest` and both
`let` continuations now call `bindAnn`.

The `and` case had a second cause. Two lookaheads decide whether an `and`
starts a binding by scanning to the `=`; an annotation puts a type in the way,
they answered no, and the `and` read as a boolean conjunction — which lost
every name in the chain, including the one BEFORE the `and`. Hence
`unbound variable: pi` from a line that declares `pi`. `skipAnnAhead` steps
over the type, depth-tracked, since `(int * int) -> t` has brackets of its own.

The record-pattern field was calling `parsePattern` where `parsePatternAnn`
already existed one function above it.

**Checked, not stepped over.** A parser fix like this invites the failure where
the tokens are eaten and nothing is bound, so a deliberate lie in each of the
four positions is asserted to be refused.

Corpus **349 → 354 of 408 (86% → 87%)**, `refused: parse` **18 → 14**: these
four and nothing else. The remaining twelve are singletons.
