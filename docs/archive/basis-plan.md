# Finishing the Basis

*Written 2026-08-08 at v1.323. The core language and the module system are
complete; the Basis is the whole of the remaining distance to Standard ML.*

## Where it stands

Eighteen structures, and the count of members each has today:

```
Array 16   Bool 3    Char 12   Date 32   General 4   IO 1    Int 7    List 20
ListPair 2 Math 17   Option 6  Real 6    String 16   Substring 10
TextIO 6   Time 11   Vector 10 Word 8
```

`Math` is effectively complete. `ListPair` has two of its dozen. `Bool`, `IO`,
`General`, `Real` and `Word` are the thinnest.

## Order, and why

**Phase 1 — complete the eighteen.** Purely additive, mostly prelude ML over
primitives that already exist, and it is what a reader actually reaches for.
Biggest value per line. Grouped so each batch can be measured:

1. `List`, `ListPair`, `Option`, `Vector` — the ones a program uses most.
2. `String`, `Substring`, `Char` — the text half.
3. `Int`, `Real`, `Word`, `Bool`, `General`, `Array`, `Time`, `Date`.

**Phase 2 — `StringCvt`.** Mostly constants and the `GEN`/`FIX`/`SCI` formats.
`Real.fmt` and `Word.fmt` should route through it rather than each spelling its
own, which is also how `showReal`'s twelve digits get a name.

**Phase 3 — the monomorphic arrays and vectors.** `CharArray`, `CharVector`,
`Word8Array`, `Word8Vector`, `RealArray`, `RealVector`, `IntArray`,
`IntVector`. Thin wrappers over the `array` and `vector` tags that exist.

**Phase 4 — `Word8`.** Masking to eight bits, and the bitwise operators
`andb orb xorb notb << >> ~>>` that `Word` itself is missing too.

**Phase 5 — `IntInf`.** Arbitrary precision, over JavaScript's `BigInt`. A new
value tag, so it touches the evaluator, the printer, the checker and equality.
The largest piece and the last, because everything above is independent of it.

`OS` stays out for good: nothing behind this has a file system, and the modal
says so.

## What this must not do

**The checklist compares ANSWERS, not types.** A structure added with a wrong
type passes it. Type assertions go in `test/lang-interp.test.js`, which can ask.
That was learnt at v1.319, where three checklist cases written for a type-only
defect passed against the broken checker.

**Nothing game-shaped.** The walking test added at v1.323 reads `src/lang/` and
fails on a game word in code; the Basis is written in the prelude and is subject
to the same rule.

**Measure per structure, not by the total.** v1.312 shipped a per-file corpus
regression that a rising total hid.

## How it will be verified

1. Each batch: every new member called once, against its expected answer,
   before the suite.
2. A type assertion for anything whose type is not obvious from its answer.
3. The corpus after each phase — it should not move, since Harper's files use
   the Basis lightly, and any movement is worth reading.
4. The BML vs SML modal loses the Basis row's named absences as each lands.
5. 848 tests, checklist 100/100, all 30 examples.

## What happened (v1.324 – v1.326)

All five phases. **Eighteen structures and roughly 190 members became
twenty-nine and 442**, and `OS` is still out, as the modal says.

The corpus did not move once — 355 of 408 throughout — which is right: Harper's
files use the Basis lightly, and a Basis change that moved it would have been
worth reading.

### What each phase found, which was the point of doing it

**Phase 1.** `Real.floor` written as a FUNCTION shadowed the primitive, and
`Real.round`, defined above it in terms of floor, began calling the new one. It
broke in the GAME, not here: a station is handed a narrow slice of the
primitives and `trunc` is not in it. A `val` alias reads the primitive; only a
`fun` is pre-bound.

**Phase 2.** Writing `StringCvt` showed that `GEN of int option` typed its
payload as plain `int`. `typeOfWords` named `list` and nothing else, so every
other type constructor was dropped and the head taken — every datatype carrying
an `option` or a `tree` had been mistyped since parameterised datatypes landed.

**Phases 3 and 4.** `Word.<<` could not be written: the identifier lexer stops
at the `<`, so `Word.` was one token and `<<` the next. And all eight
monomorphic structures bound NOTHING at first, being declared before `Array` and
`Vector` — `val fromList = Vector.fromList` is evaluated where it stands.

**Phase 5.** `(op ~)` could not be lexed, since `~` becomes a token only before
a digit, a letter or a bracket — never before `)`. IntInf declares its negation,
so the whole structure was dropped.

### The lesson worth keeping

**A structure whose body will not parse or load is dropped WHOLE, in silence.**
One member that will not type does not stop the rest, which is right for a
console, and it means an absent structure says nothing at all. It happened three
times in one afternoon. A walking test now asserts every member of every
structure is bound — 29 and 442 — and names the structures that must be there,
so a vanishing one is a failure rather than a smaller number nobody reads.
