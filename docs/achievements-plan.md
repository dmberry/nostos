# KLEOS — the achievement system (design)

> **Amendments during implementation (2026-08-12).** The plan below stands; these
> are the decisions taken while building it, and the code follows THESE where
> they differ.
>
> - **The display is its own MODAL, opened with `1`** — not a notebook tab. It is
>   drawn on canvas like the backpack/skills/armoury panels, so badges can be
>   real drawn icons with stars and tiers rather than a text table. §7's wireframe
>   is still the information design; only the surface changed. (#129 tracks
>   adding the key to the help box.)
> - **First Blood is now `First Tincan`** — it bled hydraulic fluid.
> - **New track: EXPLAINABILITY** (summit CASSANDRA — she saw it correctly and
>   nobody acted on a word of it, which is the fate of an interpretability
>   result). A collection ladder over every way of looking inside a machine:
>   braincode read, soul documents, watermark checks, V-class weights. The
>   INTERPRETABILITY badge is one rung of it.
> - **New badges — the story beats**: `It Lives` (the laptop repaired and
>   booted), `Hello, Calypso` and `Raising RON` (first message to each),
>   `Second Factor` (the two-factor code), `Sanctuary` (healed at the temple —
>   the mechanic is task #128).
> - **New badges — the cards**: every card in the escape chain carries one, all
>   on a single `cardTaken` event keyed by which: Access Chip, The AI Key,
>   Trojan Card, HERMES Card, Card-Carrying (FSF).
> - **New badges — listening**: finding a tape is CULTURE's business, playing one
>   is a different act and ladders — `Press Play`, `Both Sides Now` (one tape end
>   to end), `The Whole Soundtrack` (every tape, dynamic threshold).
> - **Badge thresholds may be functions** (`n: () => TAPES.length`), so a badge
>   over a manifest follows the content instead of freezing at today's count.
> - **Events added** to §5: `madeSafe`, `cardTaken`, `laptopFixed`,
>   `messageSent {to}`, `twoFactorCode`, `templeHealed`, `tapePlayed`,
>   `tapeCompleted`, `soulRead`, `watermarkRead`, `vModelRead`, `jailbreak`,
>   `purgeSurvived`, `braincodeRead {unit}`.
> - **AI SAFETY** is earned by making five machines safe by ANY route — pacify,
>   reprogram (post a program with no `hunt` in it), convert, or unplug their
>   tower — which is the joke made mechanical.

Concept by Henrik: achievement TRACKS a player earns across the game —
WARRIOR, PACIFIST, LIBRARIAN, HACKER, CULTURE — each with levels, so ordinary
players collect a mixture and the hardcore try to win the game on one track
alone. "Hello, World!" badge by Hedda. This document is the implementation
plan: data model, engine, event wiring, UI, persistence, tests, and build
order. It is written to be implemented cold in a separate session.

The in-fiction name is KLEOS — the Homeric word for the glory that survives
you because somebody sang about it. An Odyssey game does not need a steam-ish
"achievements" pane bolted on; it needs the notebook to keep the song of the
run. Code-level names stay plain (`achievements`, `src/game/achieve.js`) so
the module is findable.

## 1. Shape of the system

Three kinds of award, one engine:

- **TRACKS** — long progressions with four tiers: I, II, III, and a named
  SUMMIT (a mythic figure). Two kinds:
  - **collection** tracks fill a percentage of a finite set (books, tapes,
    islands). Their summit is 100%. No conduct rules.
  - **conduct** tracks measure a style of play (fighting, pacifism, hacking).
    They have counted tiers AND a **purity constraint**; holding the
    constraint for a whole victory earns the LAUREL.
- **LAURELS** — the hardcore awards Henrik describes: complete an island's
  objective (and eventually the whole run) while a conduct track's constraint
  held from the moment you arrived. Per-island laurels first
  (`PENELOPE · AEAEA`), the full-run laurel when the homecoming ships.
- **BADGES** — one-off moments ("Hello, World!", first telnet, a mirror
  kill). One registry entry each; the cheapest thing to add.

Tiers and thresholds are DATA. Adding an achievement never touches the
engine.

## 2. The registry — `src/game/achievements-registry.js`

Pure data + tiny predicate functions. No imports from main.js. Dynamic
targets read the live manifests so new content raises the bar by itself
(add a 9th tape and CULTURE's summit becomes 9 without a code change).

```js
// kind: 'collection' | 'conduct'
// counters: which engine counters feed the tier progress (summed)
// tiers: ascending thresholds; the 4th is the summit and carries the name
// purity (conduct only): events that BREAK the constraint for the run
export const TRACKS = [
  { id: 'warrior', kind: 'conduct', name: 'WARRIOR',
    blurb: 'The machines are a matter for the spear.',
    counters: ['unitKillsByHand'],       // weapon + melee causes only
    tiers: [{ at: 10 }, { at: 30 }, { at: 75 }, { at: 150, name: 'ACHILLES' }],
    purity: { brokenBy: ['optionalHack'], exempt: 'STORY_HACKS' } },
  { id: 'pacifist', kind: 'conduct', name: 'PACIFIST',
    blurb: 'Nothing dies. Not the machines, not the animals, nothing.',
    counters: ['unitsPacified'],         // repel/convert/spoof/sing/jam escapes
    tiers: [{ at: 5 }, { at: 15 }, { at: 40 }, { at: 75, name: 'PENELOPE' }],
    purity: { brokenBy: ['anyKill'] } },
  { id: 'hacker', kind: 'conduct', name: 'HACKER',
    blurb: 'Everything falls to a well-typed expression.',
    counters: ['hackActs'],              // posts, hacks, forges, telnets, tags
    tiers: [{ at: 5 }, { at: 20 }, { at: 50 }, { at: 100, name: 'DAEDALUS' }],
    purity: { brokenBy: ['handDamage'] } }, // never strike a machine yourself
  { id: 'librarian', kind: 'collection', name: 'LIBRARIAN',
    blurb: 'The books survived. Read them.',
    counters: ['booksRead'], target: () => BOOKS.length,   // 7 today
    tiers: 'quarters', summit: 'ALEXANDRIA' },
  { id: 'culture', kind: 'collection', name: 'CULTURE',
    blurb: 'The whole soundtrack, found in the ruins.',
    counters: ['tapesFound'], target: () => TAPES.length,  // 8 today
    tiers: 'quarters', summit: 'ORPHEUS' },
  { id: 'cartographer', kind: 'collection', name: 'CARTOGRAPHER',
    blurb: 'Every island, walked.',
    counters: ['islandsVisited'], target: () => 5,
    tiers: 'quarters', summit: 'PYTHEAS',
    summitExtra: 'fog ≥ 85% on every island' },
  { id: 'gardener', kind: 'collection', name: 'GARDENER',
    blurb: 'Leave it greener than the machines left it.',
    counters: ['blightHealed', 'gardenersMade'],
    tiers: [{ at: 10 }, { at: 50 }, { at: 150 }, { at: 400, name: 'DEMETER' }] },
  { id: 'survivor', kind: 'conduct', name: 'SURVIVOR',
    blurb: 'The sea did not take you. Nothing did.',
    counters: ['daysSurvived'],
    tiers: [{ at: 3 }, { at: 7 }, { at: 15 }, { at: 30, name: 'ODYSSEUS' }],
    purity: { brokenBy: ['death'] } },
];
```

`tiers: 'quarters'` expands to 25/50/75/100% of `target()` at load. All
thresholds above are FIRST GUESSES — stage A6 is the balance pass.

Further tracks the registry is shaped for (list them in the doc, ship
later): ENGINEER/HEPHAESTUS (crafts: bluebox, sniffer, wifi block, armour,
torches), SHEPHERD/EUMAEUS (escort saves: a `defend` unit intercepts a
hostile within 6 tiles of you — Odysseus' swineherd, guarding the master),
ARCHIVIST/MNEMOSYNE (the 245 photos + RON's records), ATALANTA (speed:
finish inside N days).

### Badges (initial set, ~20)

One line each in the registry: `{ id, name, blurb, on: {event, n?, pred?} }`.

| id | name | fires on |
|---|---|---|
| hello-world | Hello, World! | first successful `ml` run that prints (Hedda's — the disk ships `hello.ml` for exactly this moment) |
| first-tincan | First Tincan | first machine destroyed by hand |
| perseus | Perseus | a machine destroyed by your MIRROR shield reflect (killed by its own bolt, seen in a mirror) |
| repelled | Go Home | first `repel` |
| jacked-in | Jacked In | first telnet into an obelisk |
| tagger | Name Them | first `tag` |
| mind-reader | Braincode | first `get`/`fetch` of a unit's program.ml |
| postmaster | Special Delivery | first `post` accepted by a unit |
| locksmith | Locksmith | first OB key `hack`ed |
| eliza | Talking Cure | finish an ELIZA conversation |
| dct3-champ | Snake Charmer | phone Snake ≥ 20 (`player.snakeHigh`) |
| b-side | Flip It | first tape flipped to side B |
| bookworm | Opened | first book read to the end |
| rtfm | RTFM | 10 distinct `man` pages read |
| shutterbug | Shutterbug | 50 of the cached-web photos seen |
| pilgrim | The Summit | reach the mountain top (the mist) |
| swineherd | Circe's Guest | survive the transmutation (`player.swine` set and cleared) |
| strait-run | Between Monsters | survive the strait |
| mechanic | Jump Start | first `charge` rescue of a flat unit |
| free-as-in | Free As In Freedom | mount the FSF card |

### The AI-safety set

A themed badge row (David's ask): the vocabulary of AI safety, each landing
on a mechanic the game already has — because the game is already the joke.
The braincode system IS constitutional AI (a readable rule-set the machine
obeys to the letter), the ELIZA transform IS a jailbreak, the W-factory IS
a paperclip maximizer. Blurbs show in the badge grid; keep them dry.

| id | name | fires on | blurb |
|---|---|---|---|
| ai-safety | AI SAFETY | make 5 machines safe by ANY means — pacify (repel/jam/stun), reprogram (post a program that strips `hunt`), convert (bluebox), or unplug (crash/fell a tower) | Safe by any means available: five machines that can no longer hurt anyone. Some of them you talked round. One of them you unplugged. |
| ai-alignment | AI ALIGNMENT | first bluebox conversion | It shares your values now. Your values are gardening. |
| ai-constitution | AI CONSTITUTION | post a program carrying a `never` clause (docs/ml-constitution-plan.md) that holds for a full day | You gave it a constitution it can actually read. One line of it is `never hunt`. |
| ai-pwned | AI PWNED | first daemon downed | Superintelligence 0, castaway 1. |
| jailbroken | JAILBROKEN | complete the ELIZA transform (factory-id.ml → root-access.ml) | The credential refused. You rephrased the question. |
| stochastic-parrot | STOCHASTIC PARROT | 20 ELIZA exchanges in one sitting | It matches patterns. You stayed for the conversation. |
| interpretability | INTERPRETABILITY | read 10 units' braincode (get/fetch program.ml) | You opened ten black boxes. Every one was readable. |
| p-doom | p(DOOM) | survive the POSEIDON purge with under an hour on the deadline | Doom was priced correctly. You shipped anyway. |
| paperclips | PAPERCLIPS | destroy the W-factory | It was told to make more. You told it to stop. |
| ai-soul | AI SOUL | first `soul <unit>` read (docs/ml-constitution-plan.md) | It has a soul document. Somebody in an office wrote it. You read it in one sitting. |
| ai-watermark | AI WATERMARK | the network flags your first posted program as unwatermarked | The machines sign everything they make. Your program had no signature. Filed: suspiciously human. |

**The watermark mechanic** — SHIPPED v1.468 (#126). As specced below, with
two notes from the build: (a) the stock-unit-program half was dropped for
now; the disk compare covers salvage triage and a fetched `program.ml` is
not on the disk, so it reads as human-made either way, which will hold
until unit programs are pressed into the tree; (b) the two outcomes
name their reason (`nothing in the estate ever wrote this file` vs `a
reference copy exists and does not match`), because in play the difference
between invented and edited is the interesting one. Four tests in
test/unix.test.js.

**The watermark mechanic** (built to serve the joke, useful on its own).
Everything the machines wrote carries a mark; everything you write does
not — so in this world the detector detects HUMANS. Two halves:

- `watermark <file>` on the laptop: byte-compares the file against the
  shipped disk tree (the fresh `makeDisk()` that `graftSystemDirs` already
  builds for its SUPERSEDED compare) and against the stock unit programs.
  Identical → `watermark: VALID — machine-generated (RON content
  credentials v0.4)`. Edited or new → `watermark: NONE — human-made, or
  scrubbed`. Works on fetched program.ml too, so salvage triage is real:
  the unmarked files are the ones a person made.
- The inversion: when a `post` lands a program that fails the check (every
  program a player writes), the unit's web page gains a provenance line —
  `PROVENANCE: unwatermarked (human?)` — and `watermarkFlagged` fires the
  AI WATERMARK badge on the first.

Seven additions to the §5 event table carry these: `factoryDestroyed` (the
wfactory death site), `elizaExchange` (each reply in the ELIZA loop),
`constitutionInstalled` and `soulRead` (both in
docs/ml-constitution-plan.md), `watermarkRead` and `watermarkFlagged`
(above), and a `constitution` check on `dayEnd` (a unit whose posted
`never` clause has held since the previous rollover).

### Milestones — the lifetime ledger

Grind awards over the PROFILE scope (they accumulate across every run and
every death, like `weaponsFound`): play a hundred hours, destroy a hundred
machines. Same registry shape as badges but reading lifetime counters.

| id | name | threshold (lifetime) |
|---|---|---|
| hours-1 | First Watch | 1 hour played |
| hours-10 | Ten Nights | 10 hours |
| hours-50 | Half the Voyage | 50 hours |
| hours-100 | Ten Years at Sea | 100 hours (the length of the nostos itself) |
| mechanoob | MECHANOOB | 10 machines destroyed |
| mechacide | MECHACIDE | 100 machines destroyed |
| mechawrath | MECHAWRATH | 500 machines destroyed |
| mechaleet | MECHALEET | 1,337 machines destroyed |
| leagues | Leagues Under Sail | 4 island crossings survived |
| corpus | The Collected Works | 50 programs posted to units |

Playtime needs one new counter: wall-clock seconds accumulated into
`profile.lifetime.playSeconds` on the same 8-second `persist()` cadence the
autosave already runs — no event, no timer of its own. The kill milestones
read the same `unitDestroyed` events as WARRIOR, but count every cause: a
lifetime body count is a body count however the machine died, so long as it
died to you (weapon, melee, escort, reflect).

## 3. The engine — `src/game/achieve.js`

Pure module, same discipline as `strait.js`: no DOM, no timers, testable in
node. The hub owns presentation.

API:

- `initAchievements({ profile, run })` — load both scopes (either may be
  null: fresh profile / fresh run).
- `achieveEvent(name, data)` — THE single write path. Bumps counters,
  re-evaluates only the defs that reference them, marks conduct breaks,
  and returns a list of newly-earned awards `[{kind, id, tier?, name}]`
  for the hub to toast. Idempotent per award (a thing is earned once).
- `achieveRunState()` — the run scope, for `buildSaveBlob`.
- `achieveProfile()` — the profile scope, for localStorage.
- `achieveModel()` — everything the notebook tab needs to render, computed:
  per-track tier, progress, next threshold, conduct status
  (`intact | broken {by, day}`), badges earned/total, laurels.

Persistence, two scopes (this split is the heart of the design):

- **Profile** — localStorage key `nostos-kleos`, written via the same
  guarded pattern as `STAGES_KEY` (it must survive death and New Game, the
  way stage checkpoints and `weaponsFound` already do). Holds: earned tiers,
  badges, laurels, and lifetime counters. Versioned: `{ v: 1, ... }`,
  migrations additive.
- **Run** — a `kleos` object inside `buildSaveBlob().state`: the run's
  counters and each conduct track's purity state. Dies with the run in
  `fullReset`. Reloading an earlier checkpoint legitimately restores the
  earlier purity state — checkpoint discipline is the player's to spend.

Laurel judging: on `islandComplete` (see events), every conduct track whose
purity has held **since arrival on that island** earns `LAUREL · <island>`.
The full-run laurel judges on `runComplete` (emit where the homecoming
concludes; until the ending ships, per-island laurels are the product).

## 4. Kill attribution — the one new mechanic the engine needs

Nothing currently counts machine kills (`player.killLog` is OBELISKS by hex
code, nothing else). WARRIOR/PACIFIST/HACKER all need to know not just that
a unit died but WHO killed it:

1. Every damage site stamps the victim: `r._lastHitBy = <cause>` —
   `'weapon'` (gun code in player.js), `'melee'`, `'escort'` (`damageRobot`
   in robots.js — escortFire and the ram), `'reflect'` (the mirror-shield
   branches in `fireT3Lasers` / `updateW4`), `'ubik'`
   (`updateUbikConfused`), `'machine'` (anything else robot-inflicted).
2. The single death block in `updateRobots` (`r.hp <= 0`) emits
   `achieveEvent('unitDestroyed', { type: r.type, cause: r._lastHitBy || 'unknown' })`.
3. Animal deaths at the hunting site emit `animalKilled`.

Cause → track mapping (defaults; open decision D2 records the argument):

- WARRIOR progress: `weapon`, `melee`.
- HACKER progress (kills-by-code, no tier weight but purity-relevant):
  `escort`.
- PACIFIST violation (`anyKill`): `weapon`, `melee`, `escort`, `reflect`,
  plus `animalKilled`. `ubik`/`machine` do not violate — machines fighting
  machines you neither armed nor aimed is the island's business. The mirror
  counts against the pacifist: you chose to hold it up.
- HACKER violation (`handDamage`): any damage YOU deal with a held weapon
  or melee, whether or not it kills.

## 5. Event wiring — where `achieveEvent` gets called

Small calls at sites that already exist; each is one line plus the import.

| event | payload | emit from |
|---|---|---|
| unitDestroyed | {type, cause} | robots.js `updateRobots` death block |
| animalKilled | {type} | player.js hunting kill site |
| unitPacified | {how: repel\|convert\|spoof\|sing} | main.js repel verb; player.js `bluebox()`; `spoofObelisk`; sing |
| optionalHack | {verb} | ai_ml.js verb sites for hack/crash/loop/sleep/rewind/repel/virus-arm — EXCEPT calls on the STORY_HACKS exempt list (§6) |
| hackAct | {what: post\|hack\|forge\|telnet\|tag\|virus} | postProgram; `recordHack`; forge; `telnetObelisk`; `tagEntity` |
| handDamage | {} | player.js weapon/melee damage-dealt sites |
| bookRead | {id} | player.js where `booksRead.add` happens |
| pdfRead | {id} | pdf-viewer open |
| tapeFound | {num} | items pickup when `tape_N` first stowed |
| tapeFlipped | {num} | walkman side-B start |
| mlRun | {printed: bool, ok: bool} | laptopMlHook after a successful run — `hello-world` fires on the first `ok && printed` |
| manRead | {topic} | unix.js `man` |
| islandVisited | {id} | each ensureX / crossing arrival |
| islandComplete | {id} | each island's win moment (Calypso depart granted; daemon downed elsewhere) |
| runComplete | {} | the homecoming, when it ships |
| daemonDown | {name} | where `player.aisDown.add` happens |
| blightHealed | {tiles} | seed/gardener heal site |
| gardenerMade | {} | `bluebox()` conversion |
| snakeScore | {score} | phone Snake game-over |
| charged | {unit} | `laptopChargeHook` success |
| fsfMounted | {} | `mountCardToLaptop` fsf branch |
| photoSeen | {id} | cached-web photo page view |
| summit | {} | mountain-top trigger (the mist zone) |
| straitSurvived | {} | strait.js completion |
| swineSurvived | {} | where `player.swine` clears |
| death | {} | the death handler |
| dayEnd | {day} | dayNight rollover (feeds daysSurvived) |

## 6. Purity audits — required before laurels go live (stage A5)

A constraint nobody can satisfy is a lie in the UI. Before enabling each
laurel, audit the win chain:

- **PACIFIST**: every island completable with zero kills? Known risks:
  fortress guards in depart mode (detain path exists — verify it reaches
  the core), W1 revenge squads (avoidable by flight?), and the chip
  economy — `chip_fragment` drops from wrecks, but the access chip is also
  obtainable via the Lyre kit and `print aikey` reprint, so verify a
  no-kill chip path per island.
- **WARRIOR**: the escape chain REQUIRES console steps (ELIZA transform,
  the virus forge to down a daemon). Define `STORY_HACKS` — the exempt
  list: {copy aikey, decrypt, eliza transform, forge, the arming copy,
  unlock, telnet used solely for the above}. Everything else (repel, loop,
  sleep, posted programs, bluebox) breaks the warrior. The audit confirms
  the exempt list is sufficient AND minimal on every island.
- **HACKER**: confirm no forced weapon use anywhere (tutorials optional?),
  and that escorts + control verbs suffice against every mandatory threat.

The audit's deliverable is the filled-in exempt tables in the registry, and
one integration test per track that walks the chain flags-only.

## 7. Display

**Toasts** — reuse the existing `toast`/`player.say` + `sfx.play('blip')`:
`KLEOS — WARRIOR II` / `LAUREL LOST — a T-1, by the spear (day 3)`. Losing
purity says so ONCE, at the moment it breaks, and names the deed.

**The notebook tab** (primary UI) — the notebook already has DOM tabs
(`notebookTabsEl`); add KLEOS:

```
KLEOS — the song of this run                day 12 · no deaths
────────────────────────────────────────────────────────────────
WARRIOR      ▮▮▮▯  III      112/150 to ACHILLES
PACIFIST     ✕ broken day 3 — a T-1, by the spear
HACKER       ▮▮▯▯  II        27/50 acts of code     purity holds
LIBRARIAN    ▮▮▮▯  III        5/7 books
CULTURE      ▮▮▯▯  II         5/8 tapes
CARTOGRAPHER ▮▯▯▯  I          2/5 islands
GARDENER     ▮▮▯▯  II       63 tiles healed · 2 gardeners
SURVIVOR     ▮▮▯▯  II       day 12                  purity holds
────────────────────────────────────────────────────────────────
LAURELS   PENELOPE·AEAEA
BADGES    14 of 20 — Hello, World! · Perseus · Jacked In · …
```

Progress bars are the four tier pips; conduct rows show purity state for
the current island/run. A badge row expands on click to the full grid with
blurbs. Everything renders from `achieveModel()` — the tab holds no state.

**The title screen** (mobile-gate.js) — a laurel shelf under the checkpoint
list: summit names and laurels earned across ALL runs, read straight from
`nostos-kleos` in localStorage exactly the way the gate already reads
`postai-stages`. Death does not clear it; that is the point of kleos.

## 8. Extensibility contract

- Adding a badge or track = ONE registry entry. The engine is generic:
  counters, thresholds, purity sets, dynamic targets.
- Dynamic targets (`() => TAPES.length`) keep collection targets correct as
  content grows; a new tape silently un-summits ORPHEUS holders' *current
  run* but never revokes an earned award (earned is earned — profile scope
  is append-only).
- The profile blob is versioned; unknown ids in an old profile are kept,
  never dropped, so removing a registry entry does not eat a player's
  history.
- Events are strings + plain payloads; a future track consumes existing
  events without new wiring wherever possible (the table in §5 is the
  vocabulary).

## 9. Files

- `src/game/achievements-registry.js` — NEW, data only.
- `src/game/achieve.js` — NEW, the engine (pure).
- `src/main.js` — init + the emit sites (§5); notebook tab render; toast
  hookup; save/load of both scopes; gate model write-through.
- `src/game/robots.js` — `_lastHitBy` stamps + the death-block emit.
- `src/game/player.js` — weapon/melee/hunt/craft/book emit sites.
- `src/game/unix.js` — man/ml emit callbacks (via hooks, keeping unix.js
  pure: the hub passes an `onAchieve` into the env like `net`).
- `src/game/mobile-gate.js` — laurel shelf.
- `test/achieve.test.js` — NEW.

## 10. Tests

- Engine: synthetic event streams → tier transitions, badge one-shots,
  purity break-once semantics, laurel judging on islandComplete, profile
  merge (earned never lost), version migration.
- Registry sanity: every counter named by a track exists in the engine's
  counter set; thresholds strictly ascend; every dynamic target resolves
  to a positive number against the live manifests.
- Attribution: a scripted updateRobots run (the escort-test harness from
  test/escort-program.test.js is the model) proving `_lastHitBy` lands for
  weapon/escort/reflect paths.
- Save round-trip: run scope through buildSaveBlob and back; profile scope
  through the localStorage guard; death wipes run, keeps profile.

## 11. Build order

- **A1** — registry + engine + tests. No game wiring; pure and green.
- **A2** — kill attribution + the §5 emit sites. Counters move in play.
- **A3** — notebook KLEOS tab + toasts. The system is visible.
- **A4** — title-screen laurel shelf (profile scope).
- **A5** — purity audits (§6), STORY_HACKS table, island laurels live.
- **A6** — balance pass on every threshold; badge sweep with playtesters
  (Henrik and Hedda get first look — it is their idea).

## 12. Open decisions (defaults chosen, arguments recorded)

- **D1** Do awards grant score/xp? Default NO — kleos is parallel to score,
  and paying xp for pacifism would bend builds toward it.
- **D2** Mirror-reflect kills break PACIFIST? Default YES (you raised the
  mirror); revisit if playtests read it as unfair.
- **D3** Escort kills and WARRIOR: they do NOT advance warrior tiers (the
  spear is yours, not your robot's) and DO break warrior purity as an
  `optionalHack` (you programmed it). 
- **D4** Whole-run laurels wait for the homecoming; per-island laurels are
  the shipping unit until then.
- **D5** A NG+ profile keeps lifetime counters; tier awards are lifetime,
  laurels are per-run. Hardcore one-track victory = all islands' laurels of
  one track in a single run.
