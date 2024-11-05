# POSEIDON with teeth — the network as a threat, and circuits as the answer

**Status:** design, not yet built. Filed under Phase 3 of [ROADMAP.md](ROADMAP.md)
(machine systems / AI escalation), which is the master list; this doc is the
detail behind it. Raised 2026-07-25 from playtest feedback: POSEIDON coming
online does nothing that makes felling the obelisks feel *imperative*, and the
circuit boards obelisks drop have no everyday use. This solves both with one
idea.

## The two problems, and why they are one problem

**POSEIDON is toothless.** Today, when the countdown reaches zero, `skylinkActive`
flips true and the hub spawns W4 hunter-killers in waves (`dispatchSkylinkW4s`,
2–4 every 1.2s, capped at 50; `main.js:4840`). That is *more enemies*, not a
consequence. Nothing about it makes the **obelisks** the thing you must act on,
and it fires only *after* the countdown is already lost, so it reads as a
fail-state rather than a rising pressure you are racing.

**Circuits are dead weight.** Felling a tower drops exactly one numbered circuit
board, 1–8 (`player.js:2139`). Collect all eight (plus a spare) and you can craft
the wave gun (`canCraftWaveGun`). That is the *only* use. Until you have all
eight, every board is inventory clutter, and a player who fells three towers and
moves on never learns the boards matter.

They are one problem because **the network is the threat and the circuits are how
you cut it.** Wire them together and POSEIDON gets teeth, the obelisks become
imperative, and circuits get a constant purpose that scales with the danger.

## The frame

When POSEIDON wakes, the obelisk network stops being a set of individual towers
and becomes **one organism**. It sees as one, it hunts as one, and — the
consequential part — it begins to *consume the island*. The only relief is at the
knots: the obelisks. You **destroy** them (permanent, costly) or you **jam** them
(cheap, temporary, and this is what circuits are for). Every tower you fell drops
the boards that let you blind and starve the ones you cannot reach.

This is also the game's own thesis made mechanical. The title screen reads *"The
machines made the world standing reserve."* POSEIDON converting the living island
into grey, drained, inventoried ground is *standing reserve*, literally, on a
clock you feel in the terrain rather than read in the corner.

## Three consequences, escalating

### 1a. Fog — the network draws a veil, and only the goggles pierce it
When POSEIDON wakes it **fogs the whole island**: sight collapses to a short
radius, and moving is groping through grey. **Night-vision goggles** (find, or
craft from ~5 torches + a circuit board) are the one thing that lifts it — so the
goggles stop being a nice-to-have and become how you can function at all under
the network. And it ties straight to the knots: **take down an obelisk and the
fog thins**, dispersing slowly as the network loses cohesion, until with the
towers gone the island clears. So the fog is a second reading of "cut the net":
the shared sight (below) finds you through it, and the fog blinds *you* — two
pressures the same act of felling a tower relieves. (Overlaps the "day never
comes" note; treat them as one veil.)

### 1. Shared sight (small alone, but the delivery system)
Individually an obelisk sees a cone (its red eye, blinking faster once it has
you). **Networked, they pool sight:** step into *any* live tower's view and
*every* tower knows where you are, and hunters converge from across the map and
do not lose you. Stealth — the whole "stay unrecorded, stay unkillable" survival
theme (see the HERMES `theory` doc) — stops working while the web is up. On its
own this is minor, as noted in the feedback; its job is to make jamming and
felling *legible*: cut a tower and you can feel the net loosen around you.

### 2. The land turns — standing reserve, made literal (the consequential one)
**Each obelisk owns a spreading front.** From every live, networked tower a
**blight** grows outward tile by tile — grass greys toward slag, the ground
drained and inventoried — a radius that widens for as long as that tower stands.
Leave the network up and the fronts meet and the island disappears under them
from the towers outward. This is the core loop the feedback is asking for, and it
is per-tower on purpose:

> **Killing (or jamming) an obelisk FREEZES its front where it stands — it does
> NOT heal the ground.** (Decision, 2026-07-25: felling one tower must heal
> nothing on its own, or the towers feel disposable.) The spread stops dead, but
> the dead ground stays a scar until it is *actively* brought back — by the
> player's grass seed or the W5 gardeners (below). So felling a tower is not an
> abstract objective — you watch the grey stop spreading, and the scar it left is
> yours to heal. Nine towers, nine frozen fronts; the island's survival is the
> sum of how many you stop AND how much you reseed.

Blighted ground also **stops restocking caches** and **stops the temples
healing**, so the spread is not only cosmetic dread — it takes the map's
resources with it. The blight also **runs off the coast into the water**: sea and river within a front go dark and stagnant (a poisoned green-grey wash), kept swimmable — only their look changes. And a **tree standing on blighted ground dies** — its canopy
greys and drops, so the woods that gave you cover and firewood go bare as the
grey reaches them. Not a number in the corner: the ground itself dying outward
from every tower you have not yet dealt with.

**Healing the ground back.** Freezing a front (kill/jam) lets it recover slowly on
its own, but the player also gets hands in it:
- **Grass seed**, found occasionally in caches and huts, plants on a blighted
  tile to restore it directly — a small, deliberate act of bringing the island
  back one square at a time.
- The **W5 gardener robots** — the guards you stand down at Calypso's fortress,
  who already "plant where they hunted" — turn to **reseeding the blight** once
  the island's obelisk network is down. Refunctioning the garrison becomes a way
  to heal the map, not just to disarm it: your reprogrammed machines walk the
  grey and bring the green back behind them.

### 3. The knots — destroy, or JAM (this is where circuits live)
- **Destroy** stays as it is: 5 OB_gun burns or an insane bomb fells a tower.
  Permanent, expensive, and it drops **one circuit board**. But W3 repair drones
  raise felled towers again (`robots.js:1495`), so destruction alone is a
  treadmill.
- **Jam** is new, and it is what circuits are for. A **jammer** built from ~3
  circuit boards is planted on a tower and drops that node **offline** — cut from
  the shared sight, its land-conversion halted — *without* felling it. It runs on
  a charge and **wears off** unless refed (the network reboots the node), so
  circuits become a **constant consumable**: you spend them to blind and starve
  the towers you cannot destroy fast enough, carving a safe corridor through the
  network tower by tower.

The result: every felled tower feeds the fight against the rest (its board
becomes a jam on the next one), the wave gun stays as the ultimate 8-board sink,
and leaving the network up is an *active, worsening cost* rather than a countdown
that already fired.

## Distinct from what already exists

There is already a terminal freeze: RON-ML `loop OB_XXXX` pins a node in an
infinite loop, freezing it and its guards, no AI key needed (`ai_ml.js:443`), and
obelisks carry a `frozen` flag. That is the **hacker's** way — it needs console
access (an access chip) and it is about *combat/stealth* around one tower before
POSEIDON. The **jammer** is deliberately different: a **physical** item you plant
with circuit boards, no console needed, and it targets the **network** membership
specifically (shared sight + land-conversion), which only matters once POSEIDON
is online. They should coexist and read as two tools for two situations.

## What exists now (grounding for the build)

- `player.skylinkActive`, set in `main.js:4840`; drives W4 waves and (`renderer`)
  the blue laser web. Being caught → `dieToSkylink`.
- Obelisk objects: `destroyed`, `needsRebuild`, `frozen`, `obDamage`, `burning`;
  W3 drones repair them (`robots.js`). Felling drops `{ item:'circuit', num }`.
- `circuitNums` Set (1–8) + `canCraftWaveGun` — the only current board sink.
- POSEIDON only activates if no tower `needsRebuild` — so the web needs a full
  standing set to light.

## Build slices (each shippable + verifiable)

- **J1 — the jammer item + planting.** `items.js` `jammer` (craft: 3 circuit
  boards); a plant action on a facing/near obelisk; per-tower `jammed` + a charge
  timer that expires (the node reboots) unless refed. Pure-ish rules in a small
  module so the charge logic is unit-testable. Verify: fell towers, craft a
  jammer, plant it, watch a tower go offline and come back.
- **J2 — shared sight, and jamming/felling cuts it.** While `skylinkActive`, live
  networked towers pool detection; a jammed or felled tower stops contributing.
  Hunters converge on the pooled fix. Verify: step into one cone, confirm
  convergence; jam the local tower, confirm the net loosens.
- **J3 — the land turns (the blight).** Each live tower grows a blight radius that
  converts the floor grid to a `blight` type outward; killing or jamming that
  tower halts its radius and lets the ground recover to what it was. Then hang the
  resource cost on it (blighted tiles suppress cache restock + temple healing).
  A terrain-mutation pass, and the most thematically load-bearing — but it
  **stands alone**: it uses the OB_felling that already exists, so "kill the tower
  to stop the spread" is a complete loop without J1 or J2. Core first (spread +
  recover + render), resource cost second.
- **J5 — grass seed + gardener recovery.** A `grass_seed` item (found in caches
  and huts) plantable on a blighted tile to restore it; and W5 gardener robots
  reseeding the blight once an island's network is down (extending the "plant
  where they hunted" behaviour they already have).
- **Dead trees.** A tree whose tile is blighted converts to a `deadtree` — grey,
  bare, no canopy cover, still choppable for (less) wood. Recovers when the ground
  does. Part of J3's render pass.
- **J4 — POSEIDON balance pass.** Retune the W4 waves down now that the network
  itself is the pressure, so it is siege-and-attrition rather than a bullet hell.

## A related item, filed here because it came up together

**Night-vision goggles.** Findable (rare) or craftable from ~5 torches + a circuit
board. Worn, they lift the night/alarm-red veil so you can move in the dark the
blight brings — thematically of a piece with POSEIDON dragging the day away, and
another circuit-board sink. Needs an icon. Small, standalone; can land any time,
independent of J1–J5.

**Build order (revised).** J3 first — it is the consequence that matters, and the
per-tower "kill it to stop the spread" loop is complete on its own using existing
OB_felling. Then J1 (jammer) gives a cheaper temporary way to halt a front and
puts circuits to work, and J2 (shared sight) makes cutting a tower felt in a
second sense.

## Open questions

- **Jam charge length + board cost.** Long enough to matter, short enough that
  circuits are a real drain. Start ~90s per 3 boards; tune.
- **Can you jam BEFORE POSEIDON?** Probably yes (it cuts a tower's cone and its
  guard-link early too), so the mechanic is learned before it is critical — the
  same way the narrows teaches its controls in the run-in.
- **Does land-conversion threaten the WIN, or just squeeze?** Recommend squeeze
  only: it starves and exposes you, it does not itself end the run. The run still
  ends by the existing conditions.
- **Reversibility of the terrain.** Fully reversible (halts + recovers) keeps it a
  pressure, not a permanent scar that makes a slow start unwinnable.
  *(Superseded 2026-07-25: felling now FREEZES, does not auto-recover; recovery is
  active only, grass seed or W5 gardener — see the build log. Not a slow-start trap
  because felling still halts the spread; only the scar remains.)*

## Design notes raised 2026-07-25 (to think through, not yet built)

### J1 rethink — a "bluebox" robot-hack instead of a jammer
The jammer as specced (a physical item that drops a tower offline) is **redundant**:
we can already bring a tower down for real (destroy / RON-ML `crash` / RON-ML `loop`),
so a temporary-offline item adds little. Better use for circuits, and it plugs
straight into the blight system just built:

- Build a **bluebox** from circuit boards — a reprogrammer, not a jammer.
- The existing **`R` reprogram is broken** (David: "doesn't actually work") — replace
  that flow. You cannot bluebox a hunting robot mid-fight; you first make it inert —
  **stun it** (stun-gun), or catch it while it is **recharging / drained / otherwise
  inert** — and then apply the bluebox.
- A blueboxed robot is **turned to the blight**: its eyes go **GREEN** and it becomes
  a gardener, tending/reseeding the dead ground. So circuits let you **build an army
  of converted machines to fight the blight** — the enemy's own hunters refunctioned
  into gardeners (thematically of a piece with standing down Calypso's guards, and
  with the W5s already reseeding).
- Open: does a blueboxed hunter reseed like a W5, or do something distinct? Cost in
  circuits per conversion? Does it wear off (needs re-boxing) or is it permanent?
  How does it read against the felled-tower/network-down gate the gardeners use?

### Per-island networks — POSEIDON is Calypso-only right now
The whole POSEIDON package (deadline → fog + shared sight + blight + W4 purge) is
realized on **Ogygia (Calypso) only**. The other four daemons each rule their own
island with their own network, and we have not designed what "their network wakes"
does for each. Sketch per daemon, in character:
- **POLYPHEMUS** (Aegilia) — a single vast **eye**, line-of-sight already. Its network
  waking might be about *sight* (the whole island one cone) rather than blight.
- **CIRCE** (Aeaea) — she **rewrites** what she takes (moly holds your shape). Her
  network's threat could be transformation/terrain-rewrite, not greying.
- **HELIOS** (Thrinacia) — the **sun** and the forbidden cattle. Heat / exposure /
  a scorch rather than a blight?
- **ITHACA** — home; likely no hostile network (the endgame).
Decide whether each island reuses the blight system with a reskin, or gets its own
consequence. Until then, the blight/fog/shared-sight code is Ogygia-gated in play.
