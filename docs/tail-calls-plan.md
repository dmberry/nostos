# D-50: recursion on the host's stack

*Written 2026-08-06 at v1.302, the last entry in the departure register. Planned
before any code, because this touches every case in `evalNode` and the day has
already produced three "fixed one branch, not its sibling" mistakes.*

## What is measured, now

`bin/bml.js`, binary search for the deepest call that completes:

```
count (tail call)      1951      fun count n = if n = 0 then 0 else count (n - 1)
fact  (not tail)       2030      fun fact n = if n = 0 then 1 else n * fact (n - 1)
build (not tail)       1574      fun build n = if n = 0 then nil else n :: build (n - 1)
```

All three are bounded by the JavaScript stack, not by the step budget and not by
memory. *(These three figures are from a binary search, and the section below
explains why that method flatters itself. The direction is right; the numbers
are not comparable to the after-figures unless the same probe produces both,
which is what the after-section does.)* `evalNode` recurses for every sub-expression, so the depth a program can
reach is whatever the host left behind — which is why the same program passes
alone and fails inside a full test run, and why the N-queens test had to move
off n=6.

## The distinction that decides the scope

**Standard ML requires proper tail calls.** It does not promise unbounded
non-tail recursion; that is bounded by memory, and in a real implementation the
memory is a large heap-allocated stack rather than the host's.

So the two halves are different jobs:

| | fix | size |
|---|---|---|
| **Tail calls** — `count`, accumulator loops, continuation-passing | a loop at the top of `evalNode` | contained |
| **Non-tail depth** — `fact`, `build`, anything that does work after the call | an explicit stack machine over all ~40 cases | a rewrite |

D-50's own example is `count 5000`, which is tail recursive. **Proper tail calls
close it**, and they are the half Standard ML actually mandates.

## Stage 1 — proper tail calls

Wrap the body of `evalNode` in `for (;;)`, and in every TAIL position reassign
`node` / `env` / `ctx` / `builtins` and `continue` instead of recursing.

The step counter moves inside the loop, so a tail loop still counts steps and
the budget still bounds a program that never returns.

Tail positions, and what each becomes:

- **`If`** — evaluate the condition, then `node = branch; continue`
- **`Seq`** — evaluate the left for effect, then `node = right; continue`
- **`Case`** — match, build the arm's scope, then `node = arm.body; env = scope`
- **`Let` / `LetRec`** — bind, then `node = body; env = env2`
- **`Annot`** — `node = node.expr; continue`
- **`App` on a closure** — bind the parameter, then `node = fn.body; env = env2;
  ctx = fn.ctx; builtins = fn.builtins`. **This is the one that matters**; the
  others only stop it being undone one frame later.

Deliberately NOT in stage 1:

- **`Bool`** (`andalso` / `orelse`). Planned as a stage 1b and then **decided
  against**, which is worth recording rather than quietly omitting. Standard ML
  defines these as sugar for `if`, so the right operand IS in tail position and
  the jump would be correct by the book. But the code checks that the right
  operand came back a `bool`, and a tail jump has nowhere to put that check:
  `true andalso 5` would answer `5` instead of saying `5 is not true or false`.
  The type checker catches it in strict mode; the GAME runs advisory, so in the
  game it would simply be wrong. Recursion through `andalso` is rarer than
  recursion through `if`, which is already handled, so the trade is a real
  runtime check against a pattern the language can already express another way.
- **`Handle`**. The body must stay inside the `try`, so it cannot be a tail
  jump. The ARM body could be, but only by restructuring the catch, and
  `handle` is not a recursion hot path.
- **`While`**. Already a loop.

## What stage 1 will and will not do

**Will**: make `count 5000` work, and `count 5000000` too, bounded by the step
budget rather than the stack. Same for the continuation-passing N-queens, whose
`fc ()` and `addqueen (…, fn () => …)` are both tail calls — which should let
the N-queens test go back to n=6, where it was before it became a barometer.

**Will not**: change `fact` or `build`. Those do work after the recursive call
returns, so the frames are genuinely needed. They stay at roughly 2000.

That residue is worth stating plainly in the README rather than implying the
problem is gone.

## Stage 2 — the rest, if it is ever wanted

An explicit stack machine: `evalNode` becomes a loop over a work stack of
continuations, and every case pushes rather than recurses. It removes the host
stack from the picture entirely, at the cost of rewriting all ~40 cases and
making the evaluator considerably harder to read — which matters more here than
in most interpreters, because being readable is the argument of the project.

Not planned. If `fact 100000` ever needs to work, this is what it costs.

## Measured, after (v1.303)

**First, a correction about the measuring.** The before-figures at the top of
this page came from a binary search for the deepest call that completes, and
that method does not measure what it claims to. Its first probe is a deliberate
deep failure, and a deep failure changes what the next measurement gets: the
same `fact` probe answers 609 with an upper bound of 20,000 and 6,116 with an
upper bound of 200,000, on the same code, in the same process. The ceiling is
not a property of the interpreter alone; it moves with what the host stack has
already been through.

So here is one probe, doubling up from 100 so that nothing fails until the
ceiling does, run against both trees with `git stash` in between:

```
                     before      after
count (tail call)       255    1955663   (the probe's cap is 2000000)
fact  (not tail)       1913       5719
build (not tail)        176       4765
```

`count` is bounded by the step budget rather than the stack, which is what
proper tail calls means. `sum (100000, 0)` — a tail-recursive accumulator —
answers 5000050000. At the console's own 200,000-step budget, `count 20000`
runs and `count 25000` reports *step budget exceeded*, at about eight steps an
iteration.

The non-tail numbers went up **by a factor of three to twenty-five**, and that
was not planned for. `If`, `Let` and `Case` each used to leave a host frame on
the way to the recursive call even though nothing was waiting on them; removing
those left more room for the frames that are genuinely needed. `build` gains
most because a list construction goes through more of them. Non-tail recursion
is still bounded by the host stack, just further away, and still probe-sensitive
in the way described above — treat these as an order of magnitude, not a figure.

## How it was verified

1. The depth probe, before and after, for all three shapes. ✓
2. `node --test test/*.test.js` and the register suite, green. ✓
3. Conformance unchanged by the tail calls themselves, at 317/395: this is not
   a language change. ✓ *(It then rose to 329/399, 82%, for an unrelated reason
   found in the same session — see the parser note below.)*

## What else the same session found

Checking the BML README's claim that `abstype` works turned up that it does
not, once the constructor has a payload — which is the only reason to write
`abstype`. The test covering it used `abstype ab = A with …`, no payload, so it
never reached the code that breaks.

The cause is a stop list. `skipTypeExpr` SKIPS a type rather than parsing one,
so the only thing that ends it is a list of words, and `with` was not in the
list: `T of int with fun mk …` put the `with` inside the type and the with-block
was never parsed. The same shape turned out to be in two more parsers, each
having written its own answer or none — `open A B C` and `infix 6 f g` both take
a list of names and both consumed straight through the declaration that followed
them inside a `struct`. A missing word is not reported, it is eaten.

One list now, `DECL_KEYWORDS` + `BLOCK_ENDERS` in `parse.js`, used by all three,
with a test that walks every word in it.

And the conformance harness was skipping `infix`, `infixr`, `nonfix`, `open` and
`abstype` as unimplemented. All five had landed — `infix` at L-E, `open` at
v1.300, `abstype` at v1.302 — and the skip stayed put through all three, so the
score under-reported by 12 declarations. The comment above that line predicted
exactly this, having been wrong four times before; it is now wrong a fifth time
and pruned a fifth time. The closing summary prints the skip list itself rather
than a sentence describing it.
4. The N-queens test raised back to n=6 and passing **inside the full suite**,
   which is where it failed before. ✓
5. The game: `decide()` on a runaway program still faults in 5ms rather than
   hanging, because a machine whose program never returns is a fault in that
   machine. ✓
6. A closure's `ctx` and `builtins` travel with the tail jump, so a closure made
   at one station and called at another still sees the verbs it was made with. ✓
