# AI-ML — the obelisk terminal language (design)

This is the design record for the console language: what it is for, why it is
shaped this way, and where it departs from Standard ML. It is not the manual.

*Renamed 2026-07-25 from **RON-ML** to **AI-ML**: the obelisk console is the
machines' own OS (green), not RON's — the RON access chip only lets you IN. The
module file is still `src/game/ai_ml.js` and the error class `RonmlError`
(internal names unchanged).*

## Where the truth lives

Three files, three jobs. This one drifted once by trying to do all three.

| Question | Answer |
|---|---|
| What verbs exist, their types and gates | the `VERBS` table in [`src/game/ai_ml.js`](../src/game/ai_ml.js), which `help` prints |
| How a player learns it | [`src/game/ml-docs.js`](../src/game/ml-docs.js), served in-game |
| Why it is like this | this file |

**Do not copy the verb list into this document.** It was here once, fell nine
version-hundreds behind, and told anyone who read it that verbs which exist do
not. `help` at the terminal is authoritative because it reads the table the
interpreter reads.

## 1. The fiction

The obelisks are terminals into POSEIDON, the AI network (SKYLINK in earlier
builds). Before the collapse, RON (the resistance) reverse-engineered a sliver of
the operators' own console language and left fragments of it scrawled across the
world: on walls, in notebooks, on floppy disks and dead machines. A survivor who
collects those fragments, finds an **AI key** (dropped by a wrecked W-factory),
and jacks into an obelisk can type those fragments back in to make the machines
do things they were never meant to.

The language is deliberately small enough that a player can *learn* it, rather
than copy-paste blindly: `let ... in`, function application, the pipe, and then
their own compositions. Late game the same language drives robots directly, not
just obelisks.

Design north star: **the player should be able to write a command they were
never handed, because they understood the pieces.**

## 2. Why ML, and how small

Functional because it fits the fiction (a query language over "the network"
reads as declarative), and because a pure expression language is the smallest
thing that still behaves like a real one. No statements, loops or mutable state
to teach. Everything is an expression that evaluates to a value, and some
values, on reaching the top level, *happen*.

### Values (implicit types, never written)
- **node** — an obelisk or robot id, written as its hex: `OB_BB05`, `T2-1F`.
- **key** — an access token, from `hack` or the physical AI key you hold.
- **num** — `30`, `0`.
- **list** — `[OB_BB05, OB_1C0E]`, which is what `scan` returns.
- **unit** — `()`, the result of an effect.

### Syntactic forms
1. **Application by juxtaposition** — `sleep 30`, `hack OB_BB05`. Parens are
   accepted too, so beginners are not punished for writing `sleep(30)`.
2. **`let name = expr in expr`** — bind a result to reuse it. The one real idea
   to teach, and the hack-then-crash chain forces it.
3. **Pipe `|>`** — `scan |> nearest |> crash` feeds a value left to right. Sugar
   for nested application, entirely optional, and how the one-liners read.

Comments are `(* ml style *)`. Whitespace-insensitive, case-insensitive
keywords.

Two deliberate additions past "pure expressions only": `echo` emits a line as it
evaluates and returns unit, and `;` sequences, running the left side for its
effect before evaluating the right. Together they give step-by-step output from
a recursion. `while`, `ref` and mutable bindings are still not added: the loop
is the recursion.

The `*command` form (BBC-Micro filing-system style) runs a verb with literal
arguments, no `let`, no pipes, no variable lookup. That is what separates a
command from the ML, and it is why `*print map` names the topic `map` rather
than the verb.

## 3. The gating model

Two key items, two command tiers, and a persistent top-level `let`.

### Two currencies
- **Access key (the chip)** — opens the terminal. Once inside, every Type 2
  command runs if you know the word. Common: fell a tower, or craft from
  fragments.
- **AI key** — rare, from a wrecked W-factory, and encrypted. Not usable raw.
  This is the only gate on Type 1.

### Type 2 — the hacks (access key and the language, no AI key)
The reading and interference verbs. None needs the AI key. Because the three
board verbs (`sleep`, `repel`, `rewind`) are this easy to reach, their effects
are nerfed: smaller radius, shorter duration, so easy access is not
overpowering.

### Type 1 — the deep hack
The endgame unlock takes a deliberate multi-step program: copy the physical AI
key into the terminal so the language can name it, decrypt it, then spend the
decrypted token with a freshly hacked node key.

```ml
copy aikey
let k = hack OB_1A2B
let d = decrypt aikey
unlock k d
```

`copy aikey` fails if you hold no AI key, which is where the "AI key held" check
lives. Diegetically, you copy the code off the key into the machine. Three real
steps is the point: the endgame key is earned rather than typed.

### Backing up at HERMES
The AI key is hard-won and easy to lose, so RON's relays hold a safety copy off
the AI's own hardware. `backup aikey` and `restore aikey` are HERMES-station
verbs, and the backup rides the campaign save rather than the regenerated world,
so it survives death.

## 4. Seeding the language in the world

Fragments are scattered as lore rather than taught in a tutorial: wall graffiti,
notebook pages, floppy disks, dead machines. Each teaches one idea, in an order
that assumes nothing about which the player finds first. The recipe for the
fortress key is a found scrap and is deliberately not taught by `help`.

## 5. Departures from Standard ML

The language is versioned separately from the game. `ml -ver` prints the line,
`ml -full` the survey.

**Type inference** (`src/lang/types.js`) is Hindley-Milner: unification with an
occurs check, let-polymorphism, fresh instantiation at each use.

```
let map f l = case l of nil => nil | x :: r => f x :: map f r
> val map = fn : ('a -> 'b) -> 'a list -> 'b list
```

**It reports and does not refuse.** A clash is named and the line still runs.
The reason is the machine: it is in a ruin, and a console that will not run what
you typed is no use to a survivor. Inference runs on the **laptop only**. A unit
carrying its own program has 2,000 steps and nobody aboard to read a report, and
the tower consoles reach into a world the checker knows nothing about.

**Annotations are checked**, in bindings, parameters, `(e : t)` and on results.
`fun sq (n:int):int` peels one arrow per parameter before comparing.

**Modules**: `structure`, `signature`, `sig`/`struct`/`end`, opaque `:>`, and
qualified names. A signature restricts which **names** are visible. Without a
checker enforcing abstraction it cannot make a *representation* opaque, and the
Modules page says so rather than implying the guarantee.

**Exceptions**: `exception`, `raise`, `handle` with full pattern arms.

**Also**: `=` as equality (a declaration eats its own `=` first), `andalso` and
`orelse`, `()` as value and pattern, `type` abbreviations.

An earlier draft of this document said there was no type checker, on the grounds
that inference needs a whole program and a console has one line at a time. That
was wrong. Standard ML's own top level infers and prints a type for every
declaration entered, which is how the manuals display everything. There was no
barrier; there was no implementation.

For how the language scores against Harper's teaching corpus, see
[`docs/isml-conformance.md`](isml-conformance.md).

## 6. Status

Implemented. The terminal UI and click-to-open shipped as a read-only VT220
shell; this document was the plan for making it do something. `sing` deviates
from the original interrupt-on-hit plan: being jacked in keeps you hidden from
the machines the whole time (`player.terminalSafe`), and typing `sing` drops you
out of the terminal so the choir sequence happens in the world where you can
watch it.
