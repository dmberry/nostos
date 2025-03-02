# The word type: what to build, and what to keep saying

*Written 2026-08-09 at v1.345, before any code, as basis-plan.md and
deep-recursion-plan.md were. Task #82.*

## What is actually wrong

Measured, at v1.345:

```
0w5                ->  5           (* SML: 0wx5 *)
typeReport "0w5"   ->  int         (* SML: word  *)
0wxFFFFFFFF + 0w1  ->  4294967296  (* SML: 0wx0  *)
Word.~ 0w1         ->  0wxFFFFFFFF (* correct, v1.334 *)
```

The task was filed as "Word arithmetic does not wrap". That is the symptom. The
fact underneath it is that **a word literal lexes to a plain int token and there
is no `word` value tag anywhere**, so nothing downstream can tell a word from a
whole number, and the overloaded `+` has nothing to dispatch on.

## The two things that were blocking the small route

Both are fixed as of v1.345, so the small route is now open:

- **#83** — `local` after any other declaration in a struct body was refused,
  and a struct whose body will not parse is dropped WHOLE and in silence. Fixed:
  `atomStarts` is built from `DECL_KEYWORDS` instead of a hand-written list that
  had gone stale.
- **#84** — `val (op +) = …` did not parse, so the ordinary Standard ML way to
  shadow an operator was unavailable. Fixed: `val` now takes the `op` shapes.
  `structure W = struct val (op +) = fn (a, b) => a + b + 1 end` binds `W.+`
  with the inner `+` still the ordinary one, and the outer `+` untouched.

## What to build now

`Word.+`, `Word.-`, `Word.*` and the `Word8` equivalents, written with the
shadowing idiom #84 unblocked:

```sml
structure Word = struct
  fun mask w = wordand w 4294967295
  val (op + ) = fn (a, b) => mask (a + b)   (* the inner + is the old one *)
  val (op - ) = fn (a, b) => mask (a - b)
  val (op * ) = fn (a, b) => mask (a * b)
  …
end
```

They are real Basis members, they make wrapping **expressible** —
`Word.+ (0wxFFFFFFFF, 0w1)` gives `0wx0` — and they cost three lines each.

They do not fix `0wxFFFFFFFF + 0w1`. Bare infix on a word literal needs the
type, and nothing short of the type will do it.

## What NOT to build, and why

**The `word` tag is not worth it.** Recommendation: do not build it; keep saying
plainly that it is not there.

The work is a new value tag threaded through the lexer, the parser, the
evaluator, the printer, structural equality, the checker's base types, the
primitives and the Basis. That is the shape of the IntInf work at v1.326, which
basis-plan.md called the largest single piece in the language.

What it buys:

- Harper's corpus contains **no words at all**. The 53 declarations that do not
  run do not fail on this, and the conformance figure would not move.
- The checklist scores it as one entry out of a hundred, already counted.
- No program in `examples/` uses one, and no program in the game does.
- The overloading it would enable, `+` dispatching on word versus int, is the
  one piece of Standard ML's type system this build deliberately does not have
  anywhere else either: `Real.+` and `Int.+` are separate names here too.

Against that, a tag touching nine subsystems is where silent breakage comes
from, and the two most recent examples in this repository — the qualified
constructor blow-up and the struct dropped whole — were both from threading
something new through a place that had a hand-written list in it.

So the honest position is the one already on the page: **there is no `word`
type, a word literal is an `int`, and here is exactly what that means.** With
`Word.+/-/*` added, that paragraph gets shorter and more precise rather than
disappearing.

## What has to change with it

- `README.md` (nostos and BML), `## What it is not`: the paragraph currently
  says `Word.+`, `Word.-` and `Word.*` are not there. They will be.
- The BML-vs-SML modal on the BML page says the same thing and must match.
- Both are copied by `tools/sync-bml.sh`, so they are edited **in nostos**.
- `test/basis-members.test.js` walks the structures, so the three new members
  need their cases.

## Verification

1. `Word.+ (0wxFFFFFFFF, 0w1)` is `0wx0`; `Word.- (0w0, 0w1)` is `0wxFFFFFFFF`;
   `Word.* (0w65536, 0w65536)` is `0wx0`.
2. `Word8` the same, at 255.
3. The inner operators are the ordinary ones: `Word.+ (0w1, 0w2)` is `0wx3`, not
   a recursion.
4. Top-level `1 + 2` is still `3` after the Basis loads.
5. Checklist stays 100/100 and the corpus stays 355/408. Neither uses a word;
   both would notice a broken structure, since a struct that fails to parse is
   dropped whole.
