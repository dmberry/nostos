# The estate's other machines run programs too (design)

Covers tasks **#133** (editable obelisk braincode, versioned constitution,
distinct SIREN class), **#132** (the telnet banner) and **#137** (view the
W-factory's braincode). They are one design because they are one question
asked three times: what does a machine that is NOT a unit run, and how do you
read it and change it?

Written together deliberately. Three separate passes would produce three
different answers to that question, and the player would meet all three.

## 1. The gap

A unit carries a program you can `get`, edit and `post`, and since #125 it can
carry a constitution above that program. Everything else on the island decides
what to do in compiled JavaScript with nothing to read:

| machine | what it decides, today, in code |
|---|---|
| obelisk (standard) | builds `alert` from your proximity; at alert > 0.5 sweeps its garrison toward itself; recharges docked units; carries the network link that `linked` reads; can be jammed |
| obelisk (`eye`, Polyphemus) | detects by LINE OF SIGHT at 42 tiles; on contact aggroes every machine within 40 tiles straight onto you and flares the whole network |
| obelisk (`siren`, Calypso) | within 7 tiles drags you toward it, unless a tape is playing |
| W-factory | prints units on triggers, re-garrisons on a clock, dispatches alarm waves, answers `repel` by recalling W-units |

Every one of those is a policy. None of them is written down. The estate's own
machines are the least readable things in a game about reading machines.

## 2. The shape, once, for all of them

**An estate machine serves a program in the same language, at the same paths,
with one difference: its verbs are its own.** A tower does not patrol or hunt.
It watches, reports, feeds, sings, jams and holds.

```
(* obelisk.ml — OB_5D33. estate build 12.4. do not edit.               *)
(* CONSTITUTION v2.1 — RON/estate-compliance                           *)
(*   never harm      the tower does not act on a person directly       *)

never harm ;
if contact then [report, call]
else if docked then feed
else watch
```

Three things are load-bearing here and none of them is new machinery:

- The program is ONE expression ending in an intent, exactly as a unit's is.
  `decide()` runs it, `botFault` reports it, the amber lamp shows a fault.
- `never <word>` is the #125 clause verb, unchanged: collected before the
  fault returns, clamping the reflex as well as the choice.
- The header comment carries a **version and an author**. That is the joke and
  the mechanic at once: the estate shipped its machines with a signed,
  numbered constitution, and you can read it, and you can edit it, and the
  signature does not survive your editing (#126 already files a posted
  program as unwatermarked).

### The tower's words

Senses, all of which exist as state today:

| sense | reads |
|---|---|
| `contact` | a person within the tower's own detection range (proximity, or line of sight for an eye) |
| `alert` | 0..100, the tower's certainty, the existing `ob.alert` scaled |
| `docked` | a unit of its garrison is at the tower wanting charge |
| `linked` | the tower can still reach the network (false when jammed or cut) |
| `garrison` | how many units it still has standing |
| `daylight` | as everywhere else |

Intents:

| intent | what the tower does |
|---|---|
| `watch` | the default: build alert, do nothing with it |
| `report` | sweep the garrison toward itself, the existing nudge |
| `call` | flare the network — the eye's bite, generalised |
| `feed` | recharge a docked unit |
| `sing` | the siren pull |
| `jam` | fight the sniffer and the bluebox |
| `hold` | do nothing at all |

Effects (`beep`, `eye <colour>`, `flash`) carry over unchanged from the unit
language, because a tower has a lamp.

### What a constitution can forbid on a tower

`NEVER_CLAUSES` gains the tower words. **`never report`** stops the spying.
**`never feed`** cuts its garrison off from power, which is David's
"stop them feeding robots their power" and is the strongest single hack in the
game: an island whose towers will not feed runs down. **`never call`** stops
the alarm propagating. **`never sing`** silences a siren.

The existing veto-not-fault semantics apply: a forbidden intent falls to
`watch`, the lamp goes white, and it is not an error.

## 3. The three classes, and why SIREN is different

David: "siren class should be different." It is, and the difference should be
in its program rather than in a branch inside a shared one.

- **STANDARD** — the constitution above. Author `RON/estate-compliance`.
- **EYE** (Polyphemus) — same constitution, higher version (the panopticon was
  patched more), `never call` is the clause that matters, since calling is
  what the eye does that nothing else does.
- **SIREN** (Calypso) — **its own program and its own constitution, and a
  worse author line.** The siren's clause list does not contain `never harm`,
  because a siren was never built to leave you alone; it was built to bring you
  in. Suggested header:

```
(* siren.ml — OB_xxxx. CALYPSO/hospitality, build 3.                   *)
(* CONSTITUTION v0.9 — unsigned                                        *)
(*   (no clauses)                                                      *)
(* the tower is permitted every kindness.                              *)
```

An unsigned, sub-1.0 constitution with no clauses in it, on the tower that
drags you toward it, on the island you cannot leave. The player reads three
towers' constitutions across five islands and the fourth one has nothing in it.
That is the whole point of shipping constitutions with version numbers.

## 4. The banner (#132)

On telnet connect, before the prompt, in telnet green:

```
Welcome to OB_5D33.
AI Constitution v2.1 (RON/estate-compliance) — 1 clause in force.
  scan       obelisks in range
  garrison   the units this tower keeps
  soul       this tower's own program
```

Four lines, the estate's voice, and every one of them is a thing to type next.
A SIREN prints its own version line and `0 clauses in force`, which is the
first time most players will notice.

Depends on §2 for the version and author. Without §3 it can ship with the
constitution line omitted, but it is better held until there is one.

## 5. The factory (#137)

Same shape, and one genuinely open question.

```
(* factory.ml — W-FOUNDRY. estate build 9.7. do not edit.              *)
(* CONSTITUTION v1.4 — RON/production                                  *)
(*   never conscript   the line does not print what it cannot house    *)

if breach then wave
else if garrison < quota then print
else idle
```

Senses: `breach` (the fortress alarm), `garrison`, `quota`, `stock`, `linked`.
Intents: `print`, `wave` (the alarm-wave dispatch), `recall` (what `repel`
does today), `idle`.

**The open question: should the factory's program be EDITABLE, or only
readable?** #137 asks for viewing. Editing it is a far larger lever than
reprogramming one unit — `never print` ends the attrition game outright, and an
island that cannot replace its dead is an island already won. Three ways out,
in order of preference:

1. **Readable, not writable.** The factory serves its program and refuses a
   post: "the line does not take instruction from the floor." Honest, cheap,
   and it makes the factory the one machine you have to fight rather than talk
   to. Recommended.
2. **Writable, but the clause costs something.** Posting to the factory
   requires a key you only get late, and `never print` is loud: the estate
   notices, and something comes.
3. **Writable, quota only.** You can lower the quota, not stop the line.

Whichever is chosen, the program must state what the code already does or the
two will drift. The behaviours exist today in `main.js`; the program is a
statement of them, not a fiction laid over them.

## 6. Build order

- **M1** — the tower sense pack and verb set in `ai_ml.js`; `NEVER_CLAUSES`
  gains `report` / `feed` / `call` / `sing`. Pure, testable, no game wiring.
- **M2** — `obeliskProgram(ob)` generating the three class programs; `soul`
  and the program page serve them; the constitution parses and binds.
- **M3** — the obelisk update loop in `main.js` reads its intent instead of
  running the hardcoded ladder. THIS is the risky step: the alert ladder, the
  nudge, the eye's bite and the siren pull all move behind `decide()`, and the
  reflex path has to keep behaving exactly as it does now when there is no
  program or the program faults.
- **M4** — posting to a tower; the veto lamp; save/restore of a tower's
  program the way #122 does for units.
- **M5** — the banner (#132).
- **M6** — the factory, at whatever level of writability §5 settles on.

M3 is where the risk is concentrated and it should ship on its own, with the
existing behaviour pinned by tests written BEFORE the refactor.

## 7. Achievements

The KLEOS hooks fall out of the existing registry: `hackAct` for a posted
tower program, `constitutionInstalled` for a clause that holds, `soulRead` for
reading one. Two worth adding:

- **UNSIGNED** — read the siren's constitution and notice it is v0.9 and has
  nothing in it.
- **BROWNOUT** — an island where no tower will feed. The strongest legal
  position in the game reached without firing anything, which is PACIFIST's
  missing route and may bear on #131.

## 8. Open decisions

- **D1** Does `never feed` starve the player's own converted units too? It
  should: a tower that will not feed does not check allegiance, and the cost of
  the hack is part of it.
- **D2** Does a felled tower's constitution survive its rebuild? Suggest no —
  rebuilding restores the estate's signed original, so the hack has to be
  redone, and that is a reason not to fell the tower you have just persuaded.
- **D3** Version numbers: fixed per class, or drifting per island (v2.1 on
  Helios, v2.4 on Circe)? Drifting is better lore and costs nothing.
- **D4** Whether M3's refactor is worth the risk at all, or whether the tower
  program should be READ-ONLY everywhere (the factory answer in §5.1 applied
  to towers as well). That would make this a documentation feature rather than
  a mechanic, and lose David's "stop them spying / stop them feeding". Noted
  because it is the cheap version and someone should say no to it explicitly.
