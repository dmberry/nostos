# Non-tail recursion, and the host stack

*Written 2026-08-08 at v1.329, in answer to "how can we best address non-tail
recursion is bounded by the host stack?". Planned before any code, and the plan
was rewritten once when the first diagnosis turned out to be wrong.*

## What was assumed, and what is true

The modal has said "non-tail recursion is bounded by the host stack", and the
reading that invites is *deep recursion stops somewhere around ten thousand*.
Measured:

| | |
|---|---|
| plain non-tail recursion (`1 + deep (n-1)`) | **686** |
| a naive recursive sum over a list | **585** |
| `List.tabulate` | **505** |
| naive factorial (no list construction) | **4,230** |
| tail recursion | 1,000,000 and beyond, unbounded in practice |

**A list of more than about five hundred elements cannot be built.** That is
`List.tabulate (1000, f)`, which is the second exercise in any course. The
wording is true and gives entirely the wrong impression of the size of it.

## The first diagnosis, and why it was wrong

The host offers about 9,197 frames to a small function and BML manages 686 ML
calls, so the first guess was that one ML call costs about 13 host frames, and
the plan was to find the wasted ones.

There are none. Captured at the bottom of a 20-deep recursion, the chain is:

```
fn | applyValue | evalNode x21 | run
```

**One `evalNode` frame per ML call.** The tail-call loop added at D-50 already
did this job; `App` inlines the closure case specifically to save a frame, and
`Bin` evaluates both operands before it calls `applyBinOp`, so the arithmetic
spine costs nothing either.

The cost is not the number of frames. It is the **size** of one.

`evalNode` is a 600-line switch with **92 `const`/`let` bindings** across its
cases. V8 sizes a frame for the whole function, so every ML call reserves stack
for `StructApply`'s twelve locals and `OpenDecl`'s six whether or not it is
evaluating a structure. A recursive program pays, on every level, for cases it
will never enter.

Measured directly, two recursive functions of identical shape:

```
slim (3 locals) : 7849
fat  (90 locals): 1060
ratio           : 7.4x
```

That is the whole of it, and it is a fixable kind of problem.

## Where the weight sits

Locals per case, and whether the case uses the tail-call `continue`:

```
StructApply  12   Decls        8   StructDecl   7   OpenDecl     6
StructAlias   5   Local        5   Var          4   Datatype     4
Case          4   ExnDecl      3   App          3   TopLetPat    3
```

The ten heaviest are **declaration and module forms**. They run once when a
program is loaded and never appear inside a recursion. About sixty of the
ninety-two locals belong to cases a recursive program cannot reach.

## Four ways, costed

### A. Move the cold cases out of `evalNode`

`StructApply`, `StructDecl`, `StructAlias`, `OpenDecl`, `Decls`, `Local`,
`Datatype`, `ExnDecl`, `SigDecl`, `SigAbbrev`, `FixityDecl`, `FunctorDecl` and
the `TopLet` pair move into a second function that `evalNode` delegates to. Four
of them use `continue` for a tail position and will hand back a marker instead,
which costs an allocation on a path that runs at load time.

`evalNode` keeps the hot cases and about thirty locals. On the model fitted to
the measurement above (`frame ≈ 85 + 8n` bytes) that is roughly **2.5 to 4x**,
so 686 becomes something like 1,700 to 2,700 and `List.tabulate` clears a
thousand.

No semantic change at all, and 858 tests plus the corpus are the regression
suite.

**Cost:** small. **Risk:** low. **Ceiling:** a constant factor, but a large one.

### B. An explicit stack for the application spine only

Trampoline the shapes that recurse deeply and leave the rest recursive.

**Cost:** medium, in the evaluator's hottest path. **Ceiling:** removes the
bound for common shapes and leaves it for uncommon ones, which then fail in a
way that is harder to explain than a uniform limit.

### C. A CPS or explicit-state evaluator throughout

The real fix. `evalNode` becomes a loop over an explicit continuation stack and
the host stack stops being involved.

**Cost:** large. It rewrites the file the whole language runs through, which
also carries the fuel counter, the print buffer, the host hooks and the D-50
tail loop. **Risk:** high, and the tests are the only thing between a subtle
mistake and a wrong answer. **Ceiling:** none.

### D. Raise the host stack and say so

`node --stack-size` moves it for the command line and does nothing for the page,
which is where most people will meet this.

**Cost:** trivial. **Ceiling:** not available in a browser at all.

## What to do

**A, now.** It is mechanical, it changes no behaviour, and the measurement says
it is worth several times the current bound. Do it and re-measure.

**Then re-read the numbers.** If A puts `List.tabulate` past a couple of
thousand, C stops being urgent and becomes a considered piece of work rather
than a response to a wall. If A disappoints, the measurement will say why.

**Skip B.** Most of C's risk for part of C's benefit, and it leaves a bound
harder to describe than the present one.

**The modal changes either way.** "Bounded by the host stack" should say the
number.

## And one thing found on the way, unrelated

`let fun f 0 = 1 | f n = n * f (n-1) in f 500 end` answers **`Infinity`**.
Standard ML raises `Overflow`. An integer that leaves the range should say so
rather than becoming a float that swallows every later comparison. Separate
piece of work, filed rather than fixed here.

**Fixed at v1.331.** `Int.maxInt` had answered 9007199254740991 and
`Int.precision` 53 since the Basis was written, so the range was already
declared and only the arithmetic disagreed. `+`, `-` and `*` check the result
and raise `Overflow`, which is catchable by name like `Div`. Reals are not
checked, `1E308 * 10.0` being `inf` in Standard ML too, and `IntInf` is
untouched.

It cost one existing test, and the reason is worth keeping: **the depth probe
was written as `fact`**, so the moment ints learnt to raise it stopped measuring
recursion depth and started measuring the range of int — `fact 20` is 2.4e18 and
raises long before the stack is anywhere near. It adds now. A probe that shares
a mechanism with the thing being changed will eventually measure the change
instead of the subject.

## How it will be verified

1. The five measurements above, re-run after the change: they are the
   specification.
2. The frame chain re-captured, to confirm it is still one `evalNode` per call.
3. The tail-call guarantee untouched — `loop (1000000, 0)` still returns.
4. The game's fuel budget still stops a runaway program at a station.
5. 858 tests, checklist 100/100, corpus 355/408, all 30 examples.

## What happened (v1.330)

Option A. Twelve declaration and module cases moved into `evalDecl`, and
`evalNode` went from **92 locals to 36**. No semantic change: 860 tests,
checklist 100/100, corpus 355/408, all 30 examples, all unmoved.

```
              before   after
cold             505    1191
warm           4,214   4,219
```

**A third measurement was needed before either of the first two meant
anything.** The numbers moved on their own between runs — `tabulate 1500`
failing while `tabulate 4000` in the same process succeeded — because V8 runs a
function in its interpreter first and compiles it after it has been called
enough times. Ignition sizes a register file for every local a function
declares; TurboFan allocates registers for the ones actually live. So the 92
dead locals cost a great deal cold and nothing at all warm, and any probe that
ran several sizes in one process was measuring its own warm-up.

Both earlier figures were that artefact. 686 was a cold run and 4,230 was a warm
one, from the same evaluator, and reading them as two different limits is what
produced the first version of this plan.

The bisection was redone with **a fresh process per probe** and a fixed warm-up.
That is the only form of this measurement worth keeping.

### Which number matters

The cold one. Someone typing `List.tabulate (1000, f)` at the BML page or a
station terminal runs it once, and once is interpreted. That path went from 505
to 1,191, so the thousand-element list that could not be built now can be.

The warm ceiling did not move, and will not move for any amount of this kind of
work: at ~4,200 the frame is as small as one `evalNode` call gets. Past that
needs option C.

### What the tests can and cannot see

Inside a test run `evalNode` is warm long before any depth assertion reaches it,
so a test asking for depth 1,000 passes against the 505 defect. The regression
guard therefore walks the source and counts `evalNode`'s locals, with a
threshold of 45. It fails against the old evaluator with `evalNode declares 92
locals`, which was checked by restoring it.
