# NostOS — outstanding work, phased

A living list of everything raised across our sessions that isn't built yet,
grouped into phases by size and dependency. Shipped features live in the README
version table and `VERSION-PLAN.md`; this file is only what's *ahead*.

Order within a phase is rough priority. Nothing here is committed to — it's a
map, not a schedule.

*Last full reconciliation against the code: **v1.167**. Targeted pass at
**v1.273** (2026-07-27): the v1.168–v1.273 arc moved to "recently cleared",
two stale entries corrected (the dead-internet browser and the Calypso
cabinet, both of which had shipped), and the POSEIDON item updated to what
actually got built. Items not named in that pass were NOT re-verified.*

---

## Standing: the BML vs SML modal is a claim, keep it true

`index.html` in the BML repository has a **BML vs SML** modal listing what
Standard ML has and this does not. It is hand-written, and it is the page's
answer to the one question a visitor actually asks.

**Whenever a gap on that list is closed, take it off the list in the same
change.** The list, as of BML 0.36.0, is down to three rows and two of them are
deliberate:

| | |
|---|---|
| the stack | non-tail recursion is bounded by the host stack: about **1,200** on a first run, about **4,200** once the browser has compiled the evaluator. Tail calls are not bounded |
| no `OS` | runs in the browser, so no OS support as such. Not going to change |
| `Date` is UTC | follows from the row above |

**This table has itself gone stale twice**, which is the joke at its own
expense: it sat at "eighteen structures; no `StringCvt`, `IntInf`, monomorphic
arrays" and at BML 0.21.0 long after all of those landed. Nothing checks it but
whoever is reading. The Basis Library is 29 structures and 430 members, the
operator and block rows are gone (v1.322 closed all eight language gaps), and
the corpus is 355/408.

The page also once carried a corpus figure that sat three versions out of date,
which is why the counts came off it. If a number goes back on, it needs a test
that reads the page and checks it against what the harnesses report.

**And the same rot reached the BML README**, found at v1.330: `## What it is
not` claimed identifiers were lower-cased, that the Basis was 16 structures, and
that `Word` had no unsigned division, all false for some versions. When the
modal changes, check that file in the same pass.

---

## Recently cleared off this list

Kept briefly so the map reads honestly — these were Phase 2/3 items here for a
long time and are now in the game:

- **The phone / comms** — built as the **Nokia 3310** (v1.112–v1.122). Calypso's
  channel on Ogygia, per-island daemon threads elsewhere, roaming welcomes,
  Snake, and an SMS log that survives reload. The "dead-internet browser of
  cached pages" was later built on the *laptop* instead (Netscape + the caching
  proxy, v1.208+), not on the phone.
- **The other three AIs as islands** — built as the archipelago (v1.95–v1.131):
  OGYGIA, AEGILIA (Polyphemus), AEAEA (Circe), THRINACIA (Helios), ITHACA. Note
  the roster changed: the old APOLLO / ATHENA / HADES names in earlier drafts of
  this file were superseded by the Homeric roster in
  [islands-odyssey-revision.md](islands-odyssey-revision.md).
- **Sea crossings + boat crafting** — the row-out, the Homeric heading chart, the
  greek-ship recipe, Poseidon's refusal, and the Backspace's labelled doors.
- **The fortress as a per-island module** (R1/R2) and **Calypso's depart mode**
  (R3) — she is left, not killed.
- **Scylla and Charybdis** (v1.145, rebuilt as an arcade cabinet v1.150–v1.160) —
  the AEAEA ↔ THRINACIA passage. It began as a two-button modal: you picked your
  loss once and watched it happen. It is now a played 8-bit run with a title card
  and a coin, a helm that works across the channel and along it, one Scylla who
  keeps station on you and lunges out of the water, one Charybdis who comes down
  the channel as a widening whirlpool, walking rock chicanes in the back half, and
  a bronze ram found on Aeaea that shoulders three rocks aside. Rules in
  `src/game/narrows.js`, unit-tested without a canvas.
- **The NostBook and its language** (v1.180–v1.273) — the whole laptop arc: a
  carried UNIX V7 (60+ commands, pipes, `>` redirect, `more`, man pages under
  test), Netscape over the machines' surviving web and a cached pre-collapse
  internet, the wifi picker and RON's link-local relay, and **AI-ML**, a small
  Standard ML with Hindley-Milner inference, modules, exceptions and
  exhaustiveness warnings. The machines run it: a T-1 carries a `program.ml` you
  can read, edit and post. Its own future is a separate document,
  [aiml-standalone-plan.md](aiml-standalone-plan.md) — turning it into a real
  Standard ML and shipping it as **BML** at
  [critical-code-studies/BML](https://github.com/critical-code-studies/BML).
- **Telling one machine from another** (v1.262–v1.265) — stable per-unit names,
  the obelisk's printed map labelled, `arp`, a REPORT link, a craftable Bot
  sniffer and RON's downloadable `sniffer` scope, all reading one identity.
- **Per-island save fidelity** (v1.147) — the run snapshot now stores each
  island's own world state instead of reading Calypso's arrays whatever island
  you were on. Found while preparing the v1.147 release.

---

## Phase 1 — polish & small wins (low risk, mostly self-contained)

- **Limping / WOUNDED tell**: the low-health slowdown exists; add the limp
  animation + a WOUNDED tag so the player can read it.
- **Persist fog of war across reload/death** (like skills already do), so map
  knowledge survives.
- **Walkman deck cover art**: tapes carry a `cover` (the WARD tape's *bear
  stanhope* sleeve shows in the Scrapbook). Remaining: render that cover on the
  walkman deck itself while a tape is loaded.
- **Tapes as a runtime manifest**: tapes are already data-driven (`items.js`
  `TAPES` + `docs/tapes.md`). Optional next step: read the list from a markdown/
  JSON file at startup so a non-coder can add a tape without touching JS.
- **Friendly-robot orders**: currently follow + (T2) tree-felling. Add
  "collect wood/loot and bring it back", a guard/hold mode, and show your
  reprogrammed robots on the minimap.
- **Gate `retire` to Calypso's own terminal** (minor, noted in the escape-chain
  doc): the OB verb still fires the refunction from anywhere. *Confirmed still
  open at v1.167 — `ronmlCtx.retire` calls `refunctionCalypso()` unguarded.*
- **The daemon's death-aria named the wrong AI.** *FIXED v1.170.* Was hardcoded
  to ZEUS; the lines now template `{AI}` with the core's own name, locked with
  tests. Writing four genuinely distinct voices is the Phase 2 character pass
  below.
- **The rest of the sea's own monsters** — the strait proved the pattern (a held
  crossing + a modal + consequences, all on `game/strait.js`-style pure rules),
  so these are now cheap. Listed in §8 of
  [islands-odyssey-revision.md](islands-odyssey-revision.md): the
  **Laestrygonians** (an ambush that costs you on arrival), **Aeolus and the bag
  of winds** (a boon that turns on you), the **Cicones** (an opening raid), and
  seeding a **Siren** on a crossing as well as on the islands.
- **The AI cabinets** — the same observation as the line above, turned on the
  daemons: the narrows proved that an arcade cabinet can *be* the argument rather
  than decorate it, so each AI gets a game whose mechanic says something true
  about her. Calypso's un-winnable Pong (the hack is to stop playing),
  Polyphemus's Breakout played blind inside his gaze, Circe's memory game against
  an opponent editing your memory, Helios's cattle. Sketches, the test each one
  has to pass, the shared chassis and the open questions are in
  [ai-cabinets-plan.md](ai-cabinets-plan.md). *Calypso's pong built v1.171 and
  wired into her sanctum since. The other three (Polyphemus, Circe, Helios) are
  the open work; refactor a shared cabinet shell out of
  `narrows.js`+`calypso-pong.js` before the second.*
- **Deeper underworld**: the Backspace is one generated level. Add stacked
  levels — a tear/door within it dropping to a deeper, stranger floor (different
  palette, worse lurkers), Backrooms "levels" style. The separate-map plumbing
  exists, and the doors are now a crossing road, so this compounds.
- **More animals from the original design**: stags with shockwave antlers,
  wolves that track scent, bears, the panther.
- **Per-island character pass (R5)**: four distinct daemon voices — the aria
  currently shared by all four is one voice wearing four names (see the Phase 1
  defect). Circe should not threaten you the way Polyphemus does; Calypso should
  not threaten you at all. Colour and palette are already done.

## Phase 3 — big machine systems (combat & AI escalation)

- **POSEIDON with teeth + a use for circuits** — activation currently just spawns
  W4 waves; it needs a consequence that makes felling/jamming the obelisks
  imperative, and the circuit boards towers drop need an everyday purpose. One
  idea solves both: when POSEIDON wakes the network becomes one organism (shared
  sight, and it converts the island to "standing reserve" tile by tile), and a
  **jammer built from circuit boards** cuts a tower from the net without felling
  it. Full design, slices (J1–J4) and open questions in
  [poseidon-consequences-plan.md](poseidon-consequences-plan.md). *J1 shipped
  as the bluebox robot-hack (fell/convert a hunter to a gardener that reseeds
  blight) and J2 as shared sight (jam or fell a tower to cut it from the net).
  Still open: POSEIDON activation with a real consequence, and the everyday use
  for circuit boards.*

- **The portal gun** (a separate item from the Ubik tear): the clean sci-fi
  paired-portal teleporter, a deliberate homage. *Corrected at v1.167: paired
  portals already EXIST as a mechanic — `UBIK_PORTAL_LIFE` and
  `UBIK_TELEPORT_RANGE` in `main.js`, linked Ubik patches you step into and come
  out of. So what is missing is the item and its aesthetic, not the teleporting.
  Worth deciding whether that is still worth a second system.*
- **Awareness meter + escalation event** (Henrik): chain raven-sightings and
  obelisk-proximity into a rising "AI awareness"; crossing a threshold flips
  the game into a short, brutal, retry-friendly escalation (fast converging
  robots, paradrops, a telegraphed drone hum) — a different register for its
  duration, over quickly either way.
- **Ravens as scout drones** (Henrik): recast the bird as the AI's eyes in the
  sky — its spotting *is* the alert reaching the obelisk — shootable for scrap,
  wired into the awareness meter.
- **Hacking-parts resource** (Henrik): a rare salvage type from destroyed
  robots that accumulates toward disabling a specific obelisk — a concrete
  collectible goal for "quiet this area".
- **Scent / noise stealth model**: gunshots (already loud, low-salvage) draw
  attention; feeds the escalation and firearms trade-off.
- **"Scary approach" telegraph** for an incoming hunter (from the original
  design).

## Phase 4 — survival-sim depth (Project Zomboid register)

- **Wounds by type** (scratch / bite / gore) with bandages and infection (venom
  is in; the rest isn't).
- **Clothing & protection**: layers with bite/claw/venom resistance and
  mobility trade-offs.
- **Cooking**: raw meat is risky; a fire cooks it but attracts things at night.
- **Weather** (rain masks sound) + a **Field Journal** that fills in each
  animal's tells as you learn them.

## Phase 5 — infrastructure & tech debt

- **Four boat sprites** (se/sw/ne/nw, the way `CAR_SPRITES` already are): one
  sprite plus its mirror covers only the two down-screen headings, so sailing
  away from the camera still shows the bow rather than the stern.
- **Title screen seed selection** — carry a whole run from a chosen seed. (Full
  world save/load and the checkpoint Load list are in.)
- **File-size refactor, round two**: `renderer.js`, `player.js`, `robots.js` and
  `main.js` are large again. The systems registry landed in v1.85 and the
  renderer's HUD split into `ui.js`; remaining split candidates are robots' AI
  update apart from its draw code, and main.js's growing voyage/crossing block.
  Do it in a quiet window, one focused pass, since both of us push daily.
- **Visual pass on the machines art** (obelisks, crates, robots) and hollows.

---

*Maintained alongside `VERSION-PLAN.md` (design detail + shipped changelog).
When something here ships, move it there and delete it from this list.*
