# D-56: a datatype's type parameters

*Written 2026-08-06 at v1.304, the first register entry after the register
emptied. Planned before the code, because it touches the parser, the checker
and the printer, and because the last two checker changes each broke something
a test only caught by accident.*

## What is wrong

```
datatype 'a box = Box of 'a
Box 1                          box          SML: int box
SOME 1                         option       SML: int option
NONE                           option       SML: 'a option
valOf (SOME 3)                 'a           SML: int
```

The parser reads the head parameters and throws them away. The comment saying
so is honest about its own date: *"Nothing here is typed, so they carry no
meaning."* That was true when it was written and stopped being true when the
checker landed.

So the checker builds `con('box', [])` — a type constructor of no arguments —
and every value of the type prints as the bare name. `list` is the only
parameterised type that works, and only because it is written into
`fromAnnotation` and `typeOfWords` by hand.

The **values are right**. `SOME 1` evaluates correctly, `valOf (SOME 3)` is 3.
This is a report defect, not a wrong answer, which is why it sat unnoticed: you
have to read the `: option` to see it.

## What is already in place

More than expected, which is why this is worth doing now rather than later.

- **The parser already keeps the payload tyvars.** `datatype 'a tree = Leaf |
  Node of 'a tree * 'a * 'a tree` gives `argWords` of `[["'a","tree"], ["'a"],
  ["'a","tree"]]`. Only the head is dropped.
- **`('a,'b) pair` already parses**, and names the type `pair`.
- **The printer already handles the general case.** `show` ends with
  ``if (!p.args.length) return p.name; return `${args} ${name}`;`` so
  `con('box',[INT])` would print `int box` today if anything built one.
- **`generalise({}, ty)`** is already applied to each constructor's type, so
  the parameters become the scheme's quantified variables for free.

## The change

1. **Parser** — record the head parameters instead of skipping them.
   `{type:'Datatype', name, params:["'a"], cons:[…]}`. Both spellings:
   `'a box` and `('a,'b) pair`.

2. **Checker, the Datatype branch of `remember`** — build
   `self = con(name, params.map(() => fresh()))` and a map from each parameter
   name to the variable it got. Today `self` is `con(name)`.

3. **`typeOfWords`** — take that map. A word `'a` resolves to the mapped
   variable rather than to a fresh one, so `Box of 'a` types as `'a -> 'a box`
   with the SAME variable on both sides. That identity is the whole point; get
   it wrong and `Box 1` unifies to `'b box` and reports worse than it does now.

4. **`show`, multi-parameter case** — `(int, string) pair`, not
   `int string pair`. One line, and only the two-or-more case.

## What this does not touch

- **`type 'a syn = 'a list`** — abbreviations parse to `TypeAbbrev` with no
  arguments recorded at all. Separate, smaller, and out of scope here.
- **Functor result members** (`T.m` after `structure T = F (…)`) still report
  `'a`. That is the deliberate qualified-name fallback from v1.304, not this.

## The risk, stated plainly

The checker currently unifies a parameterised datatype with anything, because
`con('box',[])` has no arguments to disagree about. Giving it arguments means
it can now CLASH where it previously stayed quiet, and strict mode refuses a
clash. So this can turn a program that ran into a program that is refused.

The three places to watch, in the order they will bite:

1. **The prelude.** `option` is declared there, and `valOf`, `isSome`, `getOpt`,
   `Option.map`, `ListPair` all pattern-match on it.
2. **`examples/`.** Nine programs, all run under strict by CI. `04-your-own-types`
   and `07-modules` are the exposed ones.
3. **Conformance.** Harper's corpus is full of parameterised datatypes; the
   number can go either way and whichever way it goes is the honest one.

Each gets checked separately rather than as one green suite, because a suite
that goes green tells you nothing about which of the three was ever at risk.

## How it will be verified

1. `Box 1` is `int box`, `SOME 1` is `int option`, `NONE` is `'a option`,
   `valOf (SOME 3)` is `int`.
2. The identity check: `datatype 'a box = Box of 'a` then `fun un (Box x) = x`
   reports `'a box -> 'a`, one variable, not two.
3. `datatype 'a tree = Leaf | Node of 'a tree * 'a * 'a tree` — the recursive
   case, where the payload names the type being declared.
4. `('a,'b) pair` prints with brackets and commas.
5. A genuine clash is refused: `Box 1 = Box "s"` under strict.
6. The prelude, the examples and the conformance figure, each looked at on its
   own.

## What happened (v1.305)

All six verification points hold, and the three risk areas were clean on the
first run: the prelude loads under strict with `Option.map` at
`('a -> 'b) -> 'a option -> 'b option`, the nine examples pass, conformance is
unchanged at 329/399. The risk section said the checker could now clash where
it previously stayed quiet; it does, and every clash it found was a real one.

**Two things the plan did not anticipate.**

The **annotation side is the same defect** and needed the same fix. `val z :
int box = Box "s"` ran, because `fromAnnotation` knew only `list` and made
everything else a fresh variable. It is rigid now for names known to be
datatypes and permissive otherwise, and that line matters: a type ABBREVIATION
is not tracked, so `type 'a syn = 'a list` then `val c : int syn = [1,2]` would
be refused for saying `syn` where the checker worked out `list`. A variable
under-reports; a wrong rigid type refuses a correct program.

And `(int, string) pair` **could not be written**. The annotation parser read
one type inside the brackets, so the comma was a parse error — the form
`datatype ('a,'b) pair` declares happily was one nothing could annotate.

## What the sweep found afterwards, and is also fixed

Re-running the type sweep left one `'a`: `T.m` after `structure T = F (A)`.
Chasing it turned up two more gaps, both out of this plan's scope and both
fixed in the same version because they were the last of the class.

- **A functor application had no checker case**, so every member of the result
  reported `'a`, and the qualified-name fallback meant nothing said so. The
  functor's body is inferred again against the actual argument, which is the
  point of doing it that way rather than copying the functor's own member
  types: the same `Wrap` gives `int list` for one argument and `string list`
  for another.
- **`F (struct val z = 5 end)` was a parse error.** An anonymous structure as
  the argument is Standard ML, and the named-argument path had no room for it.

Also from the same sweep, and smaller: a record projection checked the
argument's SYNTAX rather than its type, so `#age r` on a variable was `'a`
while the same record written out at the call was `int`; and `while … do` had
no case at all and reported `'a` for a form that is always `unit`.

Twenty expressions now report exactly what Standard ML says, asserted one by
one rather than by a suite going green.
