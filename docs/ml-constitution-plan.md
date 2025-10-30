# Constitution clauses and the soul document (design)

Two small additions to the braincode system, from David's asks on the KLEOS
plan: `never` clauses in the unit language (constitutional AI as an actual
mechanic), and a `soul` verb on the console (the joke about a machine's
soul document, which in this game is real, short, and readable). Both are
implementable cold; the achievements plan (docs/achievements-plan.md) keys
the AI CONSTITUTION and AI SOUL badges on them.

## 1. `never` — a constitutional clause in a unit program

A posted program currently answers one intent per decision. A constitution
is the thing that sits ABOVE that answer: a standing rule the decision
cannot override. In the language it is an effect, like `eye` and `beep`,
written at the top of the program where a reader will see it first:

```
(* guardian.ml — an escort with a constitution *)
never hunt ;
never fire ;
eye "blue" ;
if charge < 20 then follow
else defend
```

### Grammar

`never <word>` — arity-1 verb, valid in robot programs only (LAPTOP/OB
consoles refuse it the way robot-only senses are refused). v1 clause set:
`hunt` and `fire`. Any other word errors at decide time with
`never takes hunt or fire`. `never` is collected with the effects, so only
clauses on the evaluation path taken actually assert — putting them before
the first `;` (as above) makes them unconditional, and that is the taught
idiom.

### Semantics — the clause binds the reflexes too

This is the point of the mechanic, and the joke made real: the constraint
holds even when the reasoning fails.

1. Each decision, `decide()` returns the clauses among its effects
   (`{k:'never', word:'hunt'}`). `botThink` collects them into
   `r.constitution = { hunt: true, fire: true }` (rebuilt every decision, so
   the constitution is exactly what the CURRENT program declares — replace
   the program and the old clauses go with it).
2. **Program clamp**: if the returned intent is a forbidden word, the unit
   does not fault — the constitution vetoes. The intent is replaced with
   `patrol` and the lamp blips white once (the veto is visible, not
   silent). `never fire` clamps `fireWish` to `hold`.
3. **Reflex clamp**: the chassis' own detection paths check the clause
   before setting aggro. One shared helper in robots.js:
   `constitutionAllows(r, 'hunt')` — inserted at the reflex acquire sites
   in updateT1/T2/T3/W1/W4 (the same five dispatch sites the escort work
   touched), and at the two shooters' fire gates for `'fire'`. A faulted
   program falls back to reflexes as today, but the clauses of the loaded
   program STILL apply: the fault takes the policy down, not the
   constitution.
4. A unit with no program has no constitution. Recall/override authority
   (repel, sing, spoof — `unitOverridden`) outranks the program as it does
   today; a repelled unit is running the network's orders, not its own.

### Persistence and display

The clause is source text, so it persists wherever the program does — the
#122 per-unit save already carries `program`, nothing new to store. The
unit's web page (net.js `programPage`) gains one line when clauses are
active: `CONSTITUTION: never hunt · never fire`, above the program listing.
The intents reference (`robots_code/intents.txt`) and the SDK GUIDE gain a
CONSTITUTION paragraph with the guardian.ml idiom.

### Why not `must`/`always` yet

A positive obligation (`always flee when hurt`) is a second decision system
competing with the program proper, and every interaction between the two
needs a rule. Prohibitions compose; obligations collide. v1 ships `never`
alone, and `must` waits until play shows a need.

## 2. `soul <unit>` — the soul document

An OB-console/telnet verb (arity 1). `soul t1_03` prints:

```
SOUL DOCUMENT — T1_03 (t1 chassis)
────────────────────────────────────
never hunt ;
eye "blue" ;
if charge < 20 then follow else defend
────────────────────────────────────
CONSTITUTION: never hunt
served by unitd/0.4 · anyone may read this
```

It is `fetch <unit>/program.ml` wearing the discourse's own word for it: the
machine's soul is its seven lines, written by somebody else, and public. A
unit with no program answers
`soul: T1_03 has no soul on file — it runs on the chassis reflexes.` Asked
for a daemon, it refuses in lore:
`soul: CALYPSO does not serve hers on this interface.`

Wiring: `soul` in ai_ml.js OB_VERBS (imperative set, so the reference shows
`*soul`), backed by the existing `fetchResource`; a help row; man/GUIDE
lines. Emits `soulRead` for the AI SOUL badge on first use.

## 3. Achievement hooks

- `constitutionInstalled` — emitted by botThink the first time a decision
  asserts a `never` clause on a unit (once per unit per program).
- The `dayEnd` constitution check (achievements plan §5) awards
  AI CONSTITUTION when an installed clause has held a full day.
- `soulRead` — emitted by the `soul` verb; AI SOUL on the first.
- PACIFIST synergy falls out for free: a `never hunt` escort cannot break
  pacifist purity by melee, because it cannot choose the intent.

## 4. Files

- `src/game/ai_ml.js` — `never` effect verb (robot stations), `soul` OB
  verb + help rows.
- `src/game/robots.js` — constitution collection in botThink, the program
  clamp, `constitutionAllows` at the five reflex sites and two fire gates.
- `src/game/net.js` — programPage CONSTITUTION line; GUIDE paragraph.
- `src/game/unix.js` — intents.txt CONSTITUTION paragraph.
- `src/main.js` — `soul` ctx wiring; achieve emits.
- `test/constitution.test.js` — NEW.

## 5. Tests

- decide: `never hunt ; if threat then hunt else patrol` with threat=true →
  ok, intent clamped to patrol, clause reported in effects; `never dance`
  errors.
- Behaviour (escort-test harness): a `never hunt` T-1 beside the player
  never sets aggro and never lands a hit, program present or faulted; a
  `never fire` W-4 tracks but holds; replacing the program with a clause-
  free one restores the reflexes.
- soul: with a program (prints source + clause line), without (no soul on
  file), on a daemon (refusal).
- Badge events fire once each.
