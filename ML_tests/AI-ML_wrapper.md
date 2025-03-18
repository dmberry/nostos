# The AI-ML wrapper

The language is one thing; the wrapper that gives it a world is another. This
half of the suite tests the join: what a machine senses, what it may intend, and
which verbs exist at which station.

Tested in `wrapper/machine-contract.test.js`.

## The machine contract

A machine's program is a pure function from what it senses to what it intends.
The engine does the intending; the program only chooses. Held here:

- The same senses always give the same intent.
- A program may answer with one word (`patrol`) or with a pair, feet first
  (`[hunt, fire]`).
- An intent the unit cannot carry out is a fault that names the intent.
- An empty or unreadable program faults rather than throwing.
- A sense the world did not supply reads false rather than stopping the machine.
  A unit with a broken aerial must keep thinking.

## Two registries that have drifted

Both are asserted as exact sets, so wiring one up turns the test red and asks
for the list to be updated.

**Intents with nowhere to go.** `INTENTS` is what a program may return;
`T1_CAN` is what a T-1 accepts. `tend` is in the first and in no capability
list, so a program that returns it always faults. The language advertises
something no machine does.

**Senses nothing supplies.** The language declares fourteen senses. `t1Sense`
supplies seven: `charge`, `integrity`, `range`, `home_range`, `threat`, `hurt`,
`linked`. The other seven are never filled by any live unit:

| Sense | Why it exists |
|---|---|
| `blight` | Declared, never wired. `blight.js` has the data. |
| `daylight` | Declared, never wired. `daynight.js` has the data. |
| `sight`, `armed`, `shielded`, `contact`, `lost_for` | Added at v1.261 for fire control. |

A program branching on any of these takes the false branch for ever and nothing
reports it. The five fire-control senses are reachable through `decide()` in
tests, which is how `demos/engage.ml` is verified, but no live unit fills them,
so that worked example cannot run in the world yet.

`t1Sense` is also the only sense function in `robots.js`, and `T1_CAN` the only
capability list, which is P3 of `docs/robot-programs-plan.md` still standing at
"T-1 only": every other class has its policy hard-coded.

## Stations

Four consoles share one language and differ only in which verbs are in scope:
the obelisks (`ob`), the RON relays (`hermes`), the NostBook (`laptop`), and a
machine reading its own program (`robot`). Held here:

- A verb that belongs to another station is refused with a message that says
  where it lives, rather than being reported as a typo.
- A machine cannot reach the console verbs from its own program.
- A bare unknown word is a typo at a console and an **intent** in a machine's
  program, so the typo rule must not fire there.

The type checker runs at the laptop and nowhere else. A machine carrying its own
program has a quarter of a second and nobody to read a report; the obelisk and
relay consoles reach into a world this build cannot type.

## What is covered elsewhere

The game's own `test/` suite already walks the shipped `.ml` programs: the
relay disk, the `robots_code/` folder, and the demos. Those are not repeated
here. What is here is the contract those programs are written against.
