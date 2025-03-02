# Row polymorphism

*Written 2026-08-08 at v1.320. Planned before the code because it changes
UNIFICATION, which every type in the language passes through, and because the
last two checker changes each broke something a test only caught by accident.*

## What is wrong

```
fn x => #a x        'a -> 'b        SML: {a : 'a, ...} -> 'a
Date.year           'a -> 'b        SML: date -> int
Date.fromTimeUniv   'a              SML: time -> date
```

`#lab` applied to a record the checker already knows is fine — `#a {a=1}` is
`int`, because there is a special case for that shape. What cannot be done is
`#lab` on an argument not yet known, which is every projection written inside a
function. The line in `types.js` says so:

```js
case 'Select': return fresh();     // needs row polymorphism; honestly unknown
```

`Date`'s accessors are all of that form, which is why the structure reports
`'a` throughout even now its constructors are published.

## What is already in place

- **Records have a real type.** `{a : int, b : string}`, held as
  `con('record', types)` with a `labels` array beside the args.
- **Closed records unify** and print correctly.
- **The flexible PATTERN parses.** `fn {a, ...} => a` reads, and the parser
  keeps an `open` flag on the pattern node.

## The change

1. **An open record.** `recordOf(labels, types, open)`. Open means *at least
   these fields*; closed means *exactly these*.

2. **`Select`** infers `{lab : 'a, ...} -> 'a` instead of a fresh variable.

3. **Unify, a record branch of its own.** The existing one compares `args`
   POSITIONALLY, which is already wrong for two closed records whose labels are
   written in a different order. By label instead:

   | | |
   |---|---|
   | closed / closed | same label set, or they are not the same type |
   | open / closed | every open label must be in the closed one; unify those; the open one BECOMES the closed one |
   | open / open | union the labels; unify the shared; both become the union, still open |

   "Becomes" is a mutation of the type object, which is what `x.ref = y` already
   does for a variable. Safe only because `instantiate` rebuilds a con per use.

4. **`instantiate` must carry `labels` and `open`.** It rebuilds with
   `con(p.name, p.args.map(go))` and drops both today. A latent bug on its own:
   any generalised record type loses its labels the moment it is used.

5. **`show`** prints `{a : 'a, ...}` for an open record.

6. **The flexible pattern** produces an open record, so `fn {a, ...} => a` is
   `{a : 'a, ...} -> 'a` rather than the closed `{a : 'a} -> 'a` it gives now.

## The risk, stated plainly

Unification is the floor everything stands on, and this adds a case to it that
can now REFUSE where it previously stayed quiet: two records with different
labels used to unify positionally if they had the same number of fields.
`{a : int, b : int}` and `{c : int, d : int}` are currently the same type to
this checker. They will not be.

So the shapes to check by hand, before any suite:

1. The prelude loads, and `Option`, `List`, `ListPair` still type.
2. `{a = 1, b = 2}` against `{b = 2, a = 1}` — same record, written in two
   orders. Should unify, and does not today by luck.
3. `#a {a = 1}`, which works now through the special case.
4. A record in a datatype payload.
5. The thirty examples, `04-your-own-types` in particular.
6. `Date.year`, which is what started this.

## How it will be verified

1. Each of the six above by hand, before the suite.
2. `fn x => #a x` is `{a : 'a, ...} -> 'a`, asserted exactly.
3. A projection that cannot work is REFUSED: `(fn x => #a x) {b = 1}`.
4. Two records of the same size and different labels are refused.
5. A test per behaviour in the shared file, each failing against the parser and
   checker as they stand.
6. 839 tests, checklist 100/100, all 30 examples, and the corpus.

## What happened (v1.321)

All six at-risk shapes held on the first run, checked by hand before the suite.
The corpus did not move, which for a change to unification is the result to
want: 350 of 408, exactly as before.

```
#a                  {a : 'a, ...} -> 'a
fn x => #a x        {a : 'a, ...} -> 'a
fn r => #a r + 1    {a : int, ...} -> int
(fn x => #a x) {b = 1}   REFUSED: {b : int} has no field a
```

The last line is the point: the constraint is checked where it is written,
rather than at run time or not at all.

### Two defects the plan predicted, and one it did not

**Records unified POSITIONALLY**, so the same record written in two field
orders was refused — `{b = "x", a = 1}` given to something wanting
`{a : int, b : string}` reported *int and string are not the same type* — and
two records of the same width with different labels were accepted as the same
type, failing at run time with *no field a*. Both were in the plan.

**`instantiate` dropped `labels`.** It rebuilt a record with
`con(p.name, p.args.map(go))`, so a generalised record type lost its fields at
the first use. Nothing noticed because almost nothing generalised a record.

The one not in the plan: **`#1` on an unknown argument stays unknown**. A
tuple label is a projection out of a tuple of unknown WIDTH, and there is no
open tuple here the way there is an open record. `#1 (4, 5)` works, as it did;
`fn x => #1 x` does not, and saying so is better than an open record with a
numeric label in it.

### What is still `'a`

`Date.fromTimeUniv`, because it builds its record through a tuple
destructuring of `clockparts`, and the record is assembled from names the
checker has not tied together. The accessors are right, which is what was asked
for.
