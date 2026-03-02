# #159 — a warrior path to the HERMES card

Companion to [`calypso-escape-chain.md`](calypso-escape-chain.md), which is the
**hacker** route to the same object: read the recipe at HERMES, forge
`zeus_lightning.ml` out of three files, copy it onto the Trojan key. That route
is good and stays exactly as it is. It is also the only route, and it asks a
player to read a filesystem to get off the island.

**Status: built (David, 2026-08-14).** Decisions his: *the boss carrier drops it*,
and *it leaves a trace*.

---

## 1. The shape

A player who fights rather than reads has no way to the card. So the fortress
carries one. Not the recipe — the **shard itself**, a physical HERMES credential
moving under guard, because a fortress that can forge the thing has to move the
thing.

- **B-1 CARRIER**, a named M-class captain, the only one of its kind on the
  island, seated at the W-factory with a two-machine escort.
- Kill it and it drops a working `hermes_card`.

### It is cautious, and it prints

David's call, and it decides the whole encounter: the carrier **will not trade
blows**. It withdraws at a walk (1.9, well under half an M6's pace), orbits at
five tiles, and answers being **struck** — not being seen — by printing a wave
of **T-1w swarm robots**. Walk up and look at it and nothing happens.

So the fight is getting *through* the swarm, and the carrier's own HP is modest:

| | HP | strike |
|---|---|---|
| M6 (pack) | 40 | 14 |
| **B-1 carrier** | **60** + 34 shield | **8** |
| T-1w (swarm) | 4 | 3 |

Waves run every **5 seconds** (a 0.6s fuse after a blow, so the wave reads as an
answer to being hit rather than a timer coming round), **4 while it is whole to
10 at the end**, capped at 14 live w-units,
plus up to **+3 for what you are carrying** (`player.weaponThreat`) — the
factory can see what walked up to it, and a robot-sword behind a forcefield is a
different problem from a shovel. Bounded so good kit tunes the fight rather than
punishing you for earning it.

### The last stand

Under **a third of its hull** it stops rationing: waves every **2 seconds**, at
full size, with the cap raised to **20**. Announced once, with its own beat, so
the player knows the rules changed rather than wondering why the swarm doubled.

By construction this is a second-phase behaviour — while the shield holds,
damage never reaches the hull, so the fraction cannot fall far enough to tip it.
And it is meant to be **short**: by the time it triggers the fight is nearly
over, so the last twenty seconds are the loudest rather than the whole encounter
being harder.

### Two phases: the shield

The great shield eats every blow while the rim holds, cracking visibly as it
wears. Break it and it **falls off and drops as the `aspis`**, which the player
can pick up and carry; the arm is bare and the hull takes everything after.

Implemented by having the carrier **undo the write to its own `hp`** and book the
loss against the rim, so none of the ~20 damage sites had to learn what a shield
is. It resolves in `updateRobots` **before** the death check — putting it in
`updateCarrier` was a tick too late and one electro-gun bolt killed the boss
through a full shield.

The electro-gun's `fuse` writes `hp = 0` outright on any robot. Against
foundry-sealed plate it does `FUSE_SEALED_DAMAGE` (22) instead: two bolts through
the shield, three through the hull.

### It guards the factory

Seated off the building on an eight-tile beat, watching the factory's own hull
the same way it watches its own — so swinging at the **building** brings the
carrier and starts the waves. The two warrior objectives on Ogygia (wreck the
factory for the ai-key, kill the carrier for the card) are one errand.

Break contact — no damage, nobody within 14 tiles for 8 seconds — and it stands
down, shield whole, and goes back to its beat. The fight is declinable.

### The look

Black and gold, Agamemnon arming (*Iliad* XI): greaves with clasps, a corslet
worked in bands, the great round shield, a helm. Half again the size of anything
else on the island and the only black machine in the game.

No crest — a plume was tried and cut; at sprite size it read as a scythe stuck to
its head and wrecked the flat, heavy silhouette. Overheat is the **gold**, not
the machine: the bands and the vent slits between them run up through orange to
white as the hull goes, and the black stays black.

## 3. Why not gate the sea

The first design withheld `seaPermission` on the traced route and sent the
player to upload `permission.ml` at a tower. It was cut: `permission.ml` is
written onto the NostBook, and a warrior may not be carrying one. That is a
soft-lock reachable by exactly the player the feature exists for.

## 4. Files

- `src/game/robots.js` — `spawnCarrier`, the `carrier` flag, the death drop.
- `src/game/player.js` — pickup reads `gi.traced` onto `hermesTraced`.
- `src/game/calypso-code.js` — the `seized` farewell.
- `src/main.js` — seat the carrier on Ogygia; persist the flag; POSEIDON's text;
  pick the farewell; the KLEOS beat.
- `test/hermes-carrier.test.js` — the drop, the flag, the farewell.
