// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// Item definitions. Tools live in the hands slot; resources stack in pockets.

import { makeArmourItems } from './armour.js';

export const ITEMS = {
  penknife: {
    name: 'Penknife',
    kind: 'tool',
    tier: 1,
    treeDamage: 1,     // hits per swing against a tree
    animalDamage: 3,
    robotDamage: 1,    // barely scratches the machines
    swingCooldown: 0.5,
    staminaCost: 4,
    color: '#b8412f',
  },
  bat: {
    name: 'Baseball bat',
    kind: 'tool',
    tier: 2,
    treeDamage: 1,
    animalDamage: 5,
    robotDamage: 3,
    swingCooldown: 0.55,
    staminaCost: 5,
    color: '#9a7b4f',
  },
  machete: {
    name: 'Machete',
    kind: 'tool',
    tier: 3,
    treeDamage: 2,
    animalDamage: 7,
    robotDamage: 2,    // blades glance off armour
    swingCooldown: 0.5,
    staminaCost: 4,
    color: '#aab2b8',
  },
  // A flat-blade screwdriver. Salvage, not a weapon: it goes in the hands and
  // it will swing, but the numbers say what it is — it barely marks an animal
  // and does nothing to armour. Its use is that a machine's casing is held on
  // with screws, and the things worth reaching are inside the casing.
  screwdriver: {
    name: 'Screwdriver',
    kind: 'tool',
    tier: 1,
    treeDamage: 0,     // it is not a blade; a tree simply ignores it
    animalDamage: 2,
    robotDamage: 1,
    swingCooldown: 0.5,
    staminaCost: 3,
    color: '#c8582f',  // the red plastic handle every toolbox has one of
  },
  crowbar: {
    name: 'Crowbar',
    kind: 'tool',
    tier: 3,
    treeDamage: 1,
    animalDamage: 4,
    robotDamage: 5,    // the resistance's anti-machine weapon of choice
    swingCooldown: 0.6,
    staminaCost: 5,
    color: '#6a6f7a',
  },
  // Dig pits to trap the wheeled machines: face open ground and use it to
  // sink the tile in front into a steep pit a T1 rolls into and can't climb
  // out of. Also a passable melee weapon.
  shovel: {
    name: 'Shovel',
    kind: 'tool',
    tier: 2,
    treeDamage: 1,
    animalDamage: 4,
    robotDamage: 2,
    swingCooldown: 0.7,
    staminaCost: 6,
    dig: true,
    color: '#7c6a4a',
  },
  // Cuts wood fast and scores more per tree than an improvised blade.
  saw: {
    name: 'Saw',
    kind: 'tool',
    tier: 2,
    treeDamage: 3,
    animalDamage: 3,
    robotDamage: 1,
    sawBonus: 2,       // extra score per felled tree
    swingCooldown: 0.5,
    staminaCost: 4,
    color: '#b0b6bc',
  },
  // Salvaged from a wrecked car: an improvised flail of a weapon.
  seatbelt: {
    name: 'Seatbelt',
    kind: 'tool',
    tier: 1,
    treeDamage: 0,
    animalDamage: 4,
    robotDamage: 1,
    swingCooldown: 0.45,
    staminaCost: 3,
    color: '#4a4640',
  },
  // Silent, super-accurate, long range. Fires arrows.
  bow: {
    name: 'Bow',
    kind: 'gun',
    tier: 3,
    range: 18,
    robotDamage: 9,
    animalDamage: 16,
    ammoType: 'arrow',
    swingCooldown: 0.7,
    staminaCost: 2,
    color: '#8a6a3c',
  },
  arrow: {
    name: 'Arrows',
    kind: 'resource',
    stack: 64, // holds a full cache pickup (24, since v0.60's ammo doubling) in one pocket
    color: '#c9b48a',
  },
  // A cool late-game find: an energy lance that punches clean through
  // anything in a line. Thirsty for batteries.
  railgun: {
    name: 'Railgun',
    kind: 'gun',
    tier: 6,
    range: 10,
    robotDamage: 9,
    animalDamage: 12,
    pierce: true,
    ammoType: 'battery',
    swingCooldown: 1.1,
    staminaCost: 2,
    color: '#7fb0d8',
  },
  // Two-handed and brutal on flesh and light machines alike.
  sledgehammer: {
    name: 'Sledgehammer',
    kind: 'tool',
    tier: 3,
    treeDamage: 1,
    animalDamage: 9,
    robotDamage: 4,
    swingCooldown: 0.9,
    staminaCost: 8,
    color: '#5a5f66',
  },
  // A resistance blade — fast and vicious.
  katana: {
    name: 'Katana',
    kind: 'tool',
    tier: 4,
    treeDamage: 2,
    animalDamage: 11,
    robotDamage: 3,
    swingCooldown: 0.4,
    staminaCost: 4,
    color: '#cdd3d8',
  },
  // Forged from ten scrap (press C): a heavy blade beaten out of machine parts,
  // and it bites the machines hard — the best melee answer to a robot.
  robot_sword: {
    name: 'Robot sword',
    kind: 'tool',
    tier: 4,
    treeDamage: 2,
    animalDamage: 12,
    robotDamage: 9,
    swingCooldown: 0.45,
    staminaCost: 4,
    color: '#b8c0c8',
    // The one blade whose edge bites obelisk alloy: it fells a tower in melee,
    // slower than the electro-gun's arc (half a burn a stroke). See player.use.
    cutsObelisk: true,
  },
  scrap: {
    name: 'Scrap',
    kind: 'resource',
    stack: 64,
    color: '#7a7f88',
  },
  // A pinch of grass seed, found in caches and huts. Used (E) while facing dead
  // ground, it greens one blighted tile back — the player's own hands against the
  // standing reserve, one square at a time. Felling a tower no longer heals on its
  // own; this and the W5 gardener are the only ways back. See player.plantSeed.
  grass_seed: {
    name: 'Grass seed',
    use: 'Plant it on blighted ground to bring the green back.',
    kind: 'seed',
    stack: 32,
    color: '#8fbf5a',
  },
  // Timed bombs: use (E) while holding one to drop it ticking. It goes off
  // after `fuse` seconds in a cloud of fire, hurting everything in `radius`.
  // The insane bomb is a rare find and can even bring down an obelisk.
  bomb_small: { name: 'Small bomb', kind: 'bomb', stack: 5, fuse: 3, radius: 2.2, damage: 22, color: '#c0552f' },
  bomb_medium: { name: 'Medium bomb', kind: 'bomb', stack: 5, fuse: 3.5, radius: 3.4, damage: 40, color: '#d0552f' },
  bomb_large: { name: 'Large bomb', kind: 'bomb', stack: 5, fuse: 4, radius: 4.8, damage: 70, color: '#e0552f' },
  bomb_insane: { name: 'Insane bomb', kind: 'bomb', stack: 3, fuse: 5, radius: 7, damage: 140, obelisk: true, color: '#ff3010' },
  // Ranged weapons. Guns need ammunition from the pockets: ammoType names
  // the item consumed per shot. effect 'stun' disables a robot for a spell;
  // 'fuse' kills it in place as a mineable wreck.
  stungun: {
    name: 'Stun-gun',
    kind: 'gun',
    tier: 4,
    range: 6,
    effect: 'stun',
    stunTime: 20,
    ammoType: 'battery',
    swingCooldown: 0.8,
    staminaCost: 2,
    color: '#4fc3d8',
  },
  electrogun: {
    name: 'Electro-gun',
    kind: 'gun',
    tier: 5,
    range: 6,
    effect: 'fuse',
    ammoType: 'battery',
    // Self-sufficient: a sealed internal cell worth 4 normal batteries that
    // trickle-charges from a solar film while carried (in hand, pocket, or
    // pack). Each fuse shot spends 5% of a battery; the trickle refills a
    // whole battery over a few minutes, so it recovers on its own between
    // fights and never needs feeding.
    selfCharge: true,
    internalMax: 4,        // in battery-units
    shotCost: 0.05,        // battery-units per shot (~80 shots from full)
    chargeRate: 0.0085,    // battery-units per second while carried (~8min to full)
    swingCooldown: 1.0,
    staminaCost: 2,
    color: '#7f5fd8',
  },
  pistol: {
    name: 'Pistol',
    kind: 'gun',
    tier: 4,
    range: 8,
    robotDamage: 6,
    animalDamage: 8,
    ammoType: 'ammo',
    swingCooldown: 0.5,
    staminaCost: 1,
    color: '#3a3f46',
  },
  shotgun: {
    name: 'Shotgun',
    kind: 'gun',
    tier: 5,
    range: 5,
    robotDamage: 12,
    animalDamage: 14,
    ammoType: 'shells',
    swingCooldown: 0.9,
    staminaCost: 2,
    color: '#5a4632',
  },
  // A rare gadget: held in hand, it jams robot sensors so they can't find
  // you. Runs on charge (10 real minutes); feed it a battery (use key) to
  // top it back up. Held item, so it lives in the hands slot like a weapon.
  wifiblock: {
    name: 'Wi-Fi block',
    use: 'Carry it charged and hunters cannot acquire you. It jams their sensors; it will not stop one already standing over you.',
    kind: 'gadget',
    tier: 4,
    ammoType: 'battery',
    color: '#4fd8c3',
  },
  // The Nokia 3310 — Calypso's channel (docs/PLAN.md). Lives in the
  // dashboard's PHONE box (its own slot beside the walkman, never a pocket); click
  // it to open the SMS screen and text the RONs — or her. Defined as an item so a
  // later build can swap other handsets into the box.
  nokia_3310: {
    name: 'Nokia 3310',
    kind: 'phone',
    color: '#2b3350',
  },
  // ---- Laptops (docs/PLAN.md) --------------------------------------
  // The first computer in the game that is YOURS: every other console is bolted
  // down (obelisks stand where the towers stand, HERMES sits on a hilltop). This
  // one you carry, and it runs off the network — which is what makes it the place
  // to LEARN AI-ML rather than perform it under fire.
  //
  // It lives in a dedicated dashboard slot beside the phone and the walkman,
  // because inventory slots are {item, qty} with no per-instance data and a
  // laptop is almost nothing BUT per-instance data (its OS, its disk, its
  // damage). So the DEF here is only the MODEL — the body colour and how much
  // machine it is — and the state lives on player.laptop.
  //
  // `cpu`/`ram` gate what will run and how fast it heats (L6+). One icon routine
  // draws them all, tinted by `color` and by the OS on the screen.
  // The OB spoofer: a transmitter that pretends to BE a tower. Not the laptop's
  // card (that one is built in and only reaches the web) — this one talks on the
  // machines' own control wire, which is why it is a separate object you carry
  // and use in the open, standing under the tower you are impersonating.
  //
  // It is the payoff for browsing: a tower's page lists the units homed to IT, so
  // the web tells you which garrison is worth taking before you spend the charge.
  // Point it at a tower and its robots take their orders from you instead.
  ob_spoofer: {
    name: 'OB spoofer',
    use: 'Stand under a tower and press X. The garrison homed to it hears an obelisk that is not there and takes your orders instead. Spends a battery.',
    kind: 'gadget',
    tier: 5,
    ammoType: 'battery',
    color: '#b56fd8',
    blurb: 'A transmitter in a lunchbox, tuned to sound exactly like an obelisk.',
  },
  // A dead machine somebody else carried. You do not swap it for yours — yours
  // has your work on it — you read its disk and copy what is on it across (E).
  // Found ones are content, not equipment: somebody's files, and the last thing
  // they were doing.
  dead_laptop: {
    name: 'Dead laptop', kind: 'laptop', color: '#8a8272', dead: true, damage: 'cracked',
    blurb: "Not yours. The board is gone, but a disk is a disk — it will still read.",
  },
  // ONE machine (docs/PLAN.md §3a). The roster of alternative OSes was cut:
  // this one grew into a complete computer, and an acquisition arc beats variety.
  laptop: {
    name: 'NostBook', kind: 'laptop', color: '#c9bda1', cpu: 1, ram: 1,
    built: 'a broken NostBook, a battery and a chip fragment. press C holding all three.',
    blurb: 'Yellowed plastic, a stiff hinge, a keyboard worn shiny. It works.',
  },
  // Found dead. Solder circuit boards into it (C) and it becomes the machine
  // above — which is also why circuits keep mattering after the bluebox.
  laptop_broken: {
    name: 'Broken NostBook', kind: 'laptop', color: '#9d947f', cpu: 1, ram: 1,
    use: 'A dead NostBook. Click it and it says what its board still wants.',
    broken: true, damage: 'cracked',
    blurb: 'Dead. The board is scorched, but the disk inside it is intact.',
  },
  // Access chip: carried (not held), it's your interface into the obelisk
  // terminals — the RON-DOS console only opens for someone holding one. While
  // you're jacked in, the obelisk masks you: the machines lose you entirely.
  chip: {
    name: 'Access chip',
    use: 'Jacks you into an obelisk. Walk up to a tower and click its screen: the console is behind it.',
    kind: 'chip',
    stack: 1,
    color: '#6ad0a0',
  },
  // Chip fragment: a shard of circuitry every destroyed machine sheds.
  // Collect eight and you can craft a whole access chip (press C), so there's
  // always a route to a terminal even without felling a tower.
  chip_fragment: {
    name: 'Chip fragment',
    use: 'Repair stock. A burnt NostBook wants one of these and a battery.',
    kind: 'material',
    stack: 64,
    color: '#8fe0c0',
  },
  // Printed map: the AI-ML `print` command runs one off at a terminal and it
  // drops as a physical object you can pick up. Hold it and use it (E / click)
  // to unfold the POSEIDON territory map anywhere, away from a terminal.
  printed_map: {
    name: 'Printed map',
    use: 'The territory, as the towers see it. Click it to read.',
    kind: 'map',
    stack: 1,
    color: '#d8cfa8',
  },
  // A boat crafted from 12 wood with a cutting tool in hand (Player.craftBoat,
  // press C at the shore). Not a pocket item: crafting places it as a world
  // object on the beach (OBJECTS.boat) that you board to cross the sea. This
  // entry names and colours the vehicle kind for any icon/future use.
  boat: {
    name: 'Boat',
    kind: 'vehicle',
    stack: 1,
    color: '#8a6437',
  },
  // A proper sea-going ship, built to Calypso's recipe from wood + the three
  // found parts. Unlike the plain boat, it is seaworthy — only a greek_ship
  // survives the crossing off Ogygia.
  greek_ship: {
    name: 'Greek ship',
    built: 'the bronze axe, wood, a sail, an oar and a rope. calypso\'s recipe first.',
    kind: 'vehicle',
    stack: 1,
    color: '#9a7038',
  },
  // Calypso's shipwright recipe, her bronze axe (#141). Given up when she
  // her at the fortress (AI-ML `retire`). Holding it unlocks the greek_ship
  // craft; it is not consumed, so you can build more than one ship.
  // Homer's Calypso gives Odysseus a BRONZE axe, double-bladed, fitted with an
  // olive handle, along with an adze and augers and cloth for a sail (Od. 5).
  // The gold was ours and had no reason (#141).
  bronze_axe: {
    name: "Bronze axe (Calypso's recipe)",
    use: 'Her shipwright\'s axe: double-bladed, olive-handled, and the only thing that will lay a sea-worthy keel. She gives it up when she lets you go.',
    kind: 'recipe',
    stack: 1,
    color: '#b0763a',
  },
  // The three ship parts — found at wrecks and huts along the coast, not crafted.
  oar: { name: 'Oar', kind: 'part', stack: 4, color: '#8a6437', use: 'One of the three parts the boat-house wants before it will build you a ship. Keep it.' },
  // The bronze ram (embolos) off an older warship, rusted into a wreck on Aeaea.
  // Not a ship part: the greek_ship craft does not want it and never asks. Carry
  // it through the narrows and it is fitted to the bow, where it shoulders the
  // first few rocks aside. It is no use at all against Scylla or Charybdis, which
  // is the point of it — see RAM_MAX in game/narrows.js.
  ram: { name: 'Bronze ram', kind: 'part', stack: 1, color: '#b07d3a' },
  rope: { name: 'Rope', kind: 'part', stack: 4, color: '#b8a066', use: 'One of the three parts the boat-house wants before it will build you a ship. Keep it.' },
  sail: { name: 'Sail', kind: 'part', stack: 2, color: '#d8d2c0', use: 'One of the three parts the boat-house wants before it will build you a ship. Keep it.' },
  // Electro-compass: click it (in hand, pocket, or pack) to arm it — once
  // armed and carried, your facing chevron becomes a cluster of homing
  // pointers, one per notable thing nearby, colour-coded (see
  // Player.compassTargets). Stays armed until you drop it. A navigation aid,
  // not a weapon.
  compass: {
    name: 'Electro-compass',
    use: 'Click it to arm. Chevrons at the edge of the screen then point at whatever is notable nearby.',
    kind: 'compass',
    tier: 2,
    color: '#8fd0e0',
  },
  // Night-vision goggles: click them (in any slot) to wear/lift them. Worn, they
  // cut through POSEIDON's fog — the veil the network drags over the island once
  // it wakes. Found rarely, or crafted from 5 torches + a circuit board (the
  // phosphor from the torch-heads, the board to drive the tube). Another sink for
  // the circuits obelisks drop. See main.js's poseidon fog + player.gogglesOn.
  goggles: {
    name: 'Night-vision goggles',
    built: 'five torches and a circuit board. press C.',
    use: 'Click to wear. The purge fog goes thin and green and you can see through it.',
    kind: 'wearable',
    tier: 2,
    color: '#4fd06a',
  },
  // The bluebox — a phreaker's reprogrammer built from circuit boards. It cannot
  // touch a machine that is still hunting: stun one (stun-gun) or catch it
  // drained / recharging, then press U beside it to splice new orders — its eye
  // flushes GREEN and it turns into a gardener that tends the blight. Each splice
  // spends a circuit board, so it is a constant use for circuits, not a one-off.
  // Carried, never held (key-triggered). See player.bluebox / canCraftBluebox.
  bluebox: {
    name: 'Bluebox',
    built: 'two circuit boards. press C.',
    use: 'Splices a downed machine into a green-eyed gardener that heals blight. Stun or drain one first, then press U beside it. Spends a circuit board.',
    kind: 'device',
    tier: 3,
    color: '#3a6ea5',
  },
  // Held defensive gear (kind 'shield'): while it's in your hands a laser
  // coming at you from roughly the front is stopped. A plain shield absorbs
  // it; a mirror shield throws it straight back at whoever fired. Holding one
  // means no weapon in hand, so it's a real choice.
  shield: {
    name: 'Riot shield',
    use: 'Hold it in your hands and it stops a laser bolt.',
    kind: 'shield',
    tier: 3,
    reflect: false,
    color: '#5a6b7a',
  },
  // #159 — the B-1 CARRIER's great round shield, cut off it when the rim finally
  // gives. Agamemnon's, in the arming scene it was drawn from: a black field, a
  // gold rim, a boss in the middle. Better than the riot shield because it came
  // off something that was using it properly, and it is the one piece of the
  // panoply a person can pick up and wear themselves — the whole game's move,
  // handed to the player as an object.
  aspis: {
    name: 'Great shield',
    use: 'Hold it in your hands and it stops a laser bolt. It was carried by something that meant it.',
    kind: 'shield',
    tier: 4,
    reflect: false,
    aspis: true,      // the renderer draws this one round, not as a heater
    color: '#c9922e',
  },
  mirror_shield: {
    name: 'Mirror shield',
    use: 'Hold it in your hands and a laser goes back the way it came, taking the machine that fired it.',
    kind: 'shield',
    tier: 5,
    reflect: true,
    color: '#a6dbe6',
  },
  // A rare held gadget: while carried it wraps you in a green energy bubble
  // that nothing — shot or blow — can get through, but it burns a battery a
  // minute. When the cell runs out it pulls another from your kit; with none
  // left the field drops.
  forcefield: {
    name: 'Forcefield',
    use: 'Click it in any slot to arm. While armed and carried it stops laser bolts, and burns batteries doing it.',
    kind: 'forcefield',
    tier: 6,
    ammoType: 'battery',
    color: '#4fe08a',
  },
  // Crafted from a stun-gun + electro-gun + Wi-Fi block (press C when you
  // hold all three). Sets an obelisk ablaze; five hits bring one down.
  obgun: {
    name: 'OB_gun',
    built: 'a stun-gun, an electro-gun and a Wi-Fi block, all three in hand. press C.',
    use: 'The tower-killer. Built from a stun-gun, an electro-gun and a Wi-Fi block.',
    kind: 'gun',
    tier: 6,
    range: 7,
    effect: 'burn',
    ammoType: 'battery',
    swingCooldown: 1.2,
    staminaCost: 3,
    stack: 1,
    color: '#e0642f',
  },
  // RON's field sniffer: a wand with a whip aerial and a two-line LCD. It does
  // one thing the machines were never built to refuse — it listens to what they
  // say to their towers, and says it back. Held in hand it names every unit
  // within range; pressed (Y) it sends the maintenance interrogation the tower
  // sends, and the unit stops to answer it.
  sniffer: {
    name: 'Bot sniffer',
    built: 'two circuit boards, and the program fetched off the wire.',
    kind: 'tool',
    stack: 1,
    color: '#3a7fa8',
  },
  circuit: {
    name: 'Circuit board',
    use: 'Repair stock. The goggles, the bluebox and the OB_gun are built out of these, and the bluebox spends one on every machine it turns.',
    kind: 'resource',
    stack: 64,
    color: '#3f8f5f',
  },
  // Built from 8 numbered circuit boards (collected from destroyed obelisks).
  // Fires a fan of laser shots that scythe through a whole crowd at once.
  wavegun: {
    name: 'Wave gun',
    kind: 'gun',
    tier: 6,
    range: 9,
    robotDamage: 8,
    animalDamage: 10,
    cone: true,
    ammoType: 'battery',
    swingCooldown: 1.0,
    staminaCost: 2,
    stack: 1,
    color: '#40e0d0',
  },
  // Dropped by a destroyed W-factory. A physical key into one AI's mainframe —
  // the way in for the obelisk terminals / code-hacking to come. Kept even
  // through death would be too strong later, but for now it's a rare trophy.
  ai_key: {
    name: 'AI key',
    use: 'The master card. Decrypt it at a terminal, then refunction it into a Trojan card.',
    kind: 'key',
    stack: 4,
    color: '#e6d24a',
    // RON-DOS files the card carries (cd aikey / ls at a terminal). Refunctioning
    // the card adds files and renames it: trojan_key (+root_access.ml), then
    // hermes_card (+zeus_lightning.ml). See docs/PLAN.md.
    files: ['access_ai_code.ml', 'factory_id.ml'],
  },
  // The AI key refunctioned (Benjamin) once root_access.ml is written onto it:
  // a Trojan card that opens the Lion's Gate. Same physical object as ai_key,
  // one step on. hasAiKeyFamily() keeps it counting as the AI key.
  trojan_key: {
    name: 'Trojan key',
    use: 'The refunctioned card. The Lion\'s Gate reads it and opens.',
    kind: 'key',
    stack: 1,
    color: '#b5892e',
    files: ['access_ai_code.ml', 'factory_id.ml', 'root_access.ml'],
  },
  // The Trojan card armed with Zeus's command (zeus_lightning.ml, forged at
  // HERMES): the herald that gets you obeyed at Calypso's terminal. The card's
  // final state.
  hermes_card: {
    name: 'Hermes card',
    use: 'Forged at a HERMES relay. It carries the virus that ends this island’s daemon, and it will stand the fortress guard down.',
    kind: 'key',
    stack: 1,
    color: '#a9e0ff',
    files: ['access_ai_code.ml', 'factory_id.ml', 'root_access.ml', 'zeus_lightning.ml'],
  },
  // Spat out by the fortress gate terminal once you hack it with AI-ML. Its
  // bolts throw the grand doorway in the southern rampart open — the only way
  // into ZEUS's fortress. A one-way trophy; carried, not held.
  fortress_key: {
    name: 'fortress key',
    kind: 'key',
    stack: 1,
    color: '#7fe0ff',
  },
  // Torn quarters of a fortress survey the resistance made before ZEUS sealed
  // the maze. Scattered hard across the world; collect the set and press C to
  // piece them into a fortress map. Carrying the map, the maze lights its own
  // solution the moment you step in (see fortress.update).
  fortress_map_fragment: {
    name: 'fortress-map fragment',
    kind: 'material',
    stack: 8,
    color: '#8fb7c9',
  },
  fortress_map: {
    name: 'fortress map',
    kind: 'key', // carried, inert — passively lights the maze on entry (fortress.update)
    stack: 1,
    color: '#7fe0ff',
  },
  // Ubik: a battered aerosol can, its label half-worn. Held and used (E / click)
  // it sprays the world back into focus — wherever the mist settles the ground
  // and everything on it goes brighter, warmer, more real, as if the fake had a
  // fake under it and this dissolved the top layer. Five sprays, then dry.
  // (kind 'spray' — routed in Player.useHands to sprayUbik. Charge tracked on
  // the player, not the stack.)
  ubik: {
    name: 'Ubik',
    use: 'Spray it at the ground. Keep spraying one patch and the world gives way there.',
    kind: 'spray',
    stack: 1,
    color: '#e6c93a',
  },
  battery: {
    name: 'Battery',
    use: 'Charge. The Wi-Fi block, the forcefield, the spoofer and the guns all drink these.',
    kind: 'resource',
    stack: 64,
    color: '#d8c94f',
  },
  // Found rarely, worn once found (see Player.backpack): 16 more general
  // slots plus one dedicated spare-weapon slot. Dropped with everything in
  // it on death.
  backpack: {
    name: 'Backpack',
    use: 'Wear it and you carry far more. Click it to open the pack.',
    kind: 'backpack',
    stack: 1,
    color: '#5a4a32',
  },
  ammo: {
    name: 'Ammo (9mm)',
    kind: 'resource',
    stack: 64,
    color: '#8f8a6a',
  },
  shells: {
    name: 'Shotgun shells',
    kind: 'resource',
    stack: 64,
    color: '#a5493a',
  },
  // An anvil. Absurdly heavy — carried ANYWHERE (hands, pockets, backpack)
  // you walk at a tenth pace (player.js ANVIL_SLOW). One sits in the town:
  // a prize for whoever works out how to want it.
  anvil: {
    name: 'Anvil',
    use: 'Stand at it to build the things that need more than your hands.',
    kind: 'material',
    stack: 1,
    color: '#4a4e55',
    burden: true, // carried anywhere on you: a tenth of your pace (player.js)
  },
  large_stone: {
    name: 'Large stone',
    kind: 'material',
    stack: 1,
    color: '#8a8d90',
    burden: true, // same punishing weight as the anvil
  },
  wood: {
    name: 'Wood',
    kind: 'resource',
    stack: 64,
    color: '#8a6437',
  },
  meat: {
    name: 'Meat',
    use: 'Eat it as it is, or hold it over a campfire and roast it for nearly twice as much.',
    kind: 'resource',
    stack: 5,
    color: '#a34545',
    food: 25,   // raw. #180: a fire turns it into cooked_meat below
  },
  // #180 — what a fire is FOR. Raw meat is 25 and roast is 45, so a fire pays
  // for the three wood it cost inside two pieces. It also gives back stamina,
  // which raw meat does not: sitting down to a hot meal is the only thing in
  // the game that does both.
  cooked_meat: {
    name: 'Roast meat',
    use: 'A hot meal. Worth nearly twice raw meat, and it puts some strength back.',
    kind: 'resource',
    stack: 5,
    color: '#c07a3c',
    food: 45,
    stamina: 25,
  },
  tin: {
    name: 'Tinned food',
    kind: 'resource',
    stack: 4,
    color: '#9fa8b0',
    food: 40,
  },
  berries: {
    name: 'Berries',
    kind: 'resource',
    stack: 8,
    color: '#7a3a8a',
    food: 15,
  },
  // Lotus fruit: looks and reads like ordinary food (has a `food` value, so the
  // eat routine will happily take it), but eating it brings on a dreamy torpor
  // that slows you and pulls you back toward the grove. The trap is precisely
  // that it is indistinguishable from food when you mash the eat key.
  lotus_fruit: {
    name: 'Lotus fruit',
    kind: 'resource',
    stack: 6,
    color: '#e7d7b0', // pale cream-gold
    food: 20,
    lotus: true,      // flag read by Player.eat -> enterTorpor
  },
  // MOLY — the herb Hermes gives Odysseus against Circe's drug (Odyssey 10.302-6):
  // black at the root, milk-white in flower. On AEAEA, CIRCE's swine-magic rewrites
  // what you ARE; simply CARRYING moly holds your shape (main.js's transmutation
  // tick reads player.hasMoly()) and drains a transformation already begun. It is
  // not eaten and never spends — the herb is a ward, not a cure you swallow.
  moly: {
    name: 'Moly',
    use: 'Eat it to undo Circe\'s change, or before you take anything she offers you.',
    kind: 'resource',
    stack: 4,
    color: '#eef4e2',  // milk-white flower on a black root
    ward: 'swine',     // read by hasMoly() / the CIRCE transmutation
  },
  torch: {
    name: 'Torch',
    use: 'Light. Enough of them, with a circuit board, make night-vision goggles.',
    kind: 'resource',
    stack: 20,   // torches stack freely — you gather a lot, and goggles want five
    color: '#e0a030',
  },
  // Books: read (R) to gain a permanent skill. Knowledge survives death.
  book_wood: {
    name: 'Whittling & Woodcraft',
    notepadText: `Blades, green wood, and the grain.

The first half is edges: how to put one on, how to keep it, and why a dull blade takes more from you than a sharp one takes from the tree. Read the grain before you cut. Wood that has grown leaning will split toward the lean, and a notch on the wrong side sends a trunk down across your legs.

The second half is felling. Cut a wedge on the side you want it to fall, then come in from behind, above the wedge, and stop. Do not cut through. Leave a hinge and let the weight do the rest.

Cheap paper, and somebody has worked through it: the felling chapter is thumbed grey and the margin beside the hinge diagram says GO SLOW in pencil, twice.`,
    kind: 'book',
    stack: 1,
    color: '#7d5a3c',
    skill: 'woodcraft',
    skillText: 'Woodcraft: your blade fells trees in half the swings.',
    author: 'the Coppice Guild',
    abstract: 'A pre-collapse manual of blades and green wood — reading the grain, notching, felling clean.',
  },
  book_herbs: {
    name: 'Hedgerow Remedies',
    notepadText: `Field remedies from before the pharmacies.

Which berries draw poison and which close a wound; what to chew, what to bind, what to leave alone whatever anyone tells you. There is a table at the front, hand-drawn, of the ones that look alike, and the whole point of the book is on that page: the difference between the two is a bloom on the underside of the leaf.

Poison first, it says, then pain. A body that is still being poisoned does not heal, and a body that has stopped hurting has not stopped bleeding.

Home-bound, the stitching gone at the spine and the pages held with a rubber band that has perished into the paper. Somebody's own additions in ink at the back, in a hand that got shakier down the page.`,
    kind: 'book',
    stack: 1,
    color: '#5d7a3c',
    skill: 'herbalism',
    skillText: 'Herbalism: berries now purge venom and mend you a little.',
    author: 'a hedge-witch, uncredited',
    abstract: 'Field remedies from before the pharmacies: which berries draw poison, which close a wound.',
  },
  book_track: {
    name: 'Reading the Wild',
    notepadText: `Spoor, gait, and the signs a body leaves passing through country.

Print depth tells you weight; the space between tells you speed; the two together tell you whether it was walking or being chased. A running animal lands harder on the toe. Something carrying something else lands harder everywhere.

There is a section on reading ground that has been walked twice, which is the one worth learning: the second set of prints is crisper at the edge, and that is all you get.

A gamekeeper's book, and it reads like one — no illustrations of anything he had not seen himself. His name is inside the cover and the date under it is forty years before the collapse.`,
    kind: 'book',
    stack: 1,
    color: '#8a4a3a',
    skill: 'tracking',
    skillText: 'Tracking: nearby animals show on your minimap.',
    author: 'a gamekeeper',
    abstract: 'Spoor, gait, and the signs a body leaves passing through country.',
  },
  book_run: {
    name: 'The Long Road',
    notepadText: `Breath, pace, and the ground under you.

Most of it is breathing: in for three, out for two, and never let the out-breath be the short one. A body that panics breathes shallow and fast and then has nothing left when it needs it, which is exactly when it needs it.

The rest is ground. Uphill, shorten the stride and let the pace fall; downhill, let go, because braking on a slope costs more than the speed is worth. Look where you want your foot, not at your foot.

A club pamphlet, stapled, with race dates on the back for a season that never finished. Somebody has ticked three of them.`,
    kind: 'book',
    stack: 1,
    color: '#4a5a7a',
    skill: 'fleetfoot',
    skillText: 'Fleet foot: sprinting drains far less stamina.',
    author: 'a long-distance runner',
    abstract: 'On breath, cadence, and the economy of a body that has to keep going.',
  },
  // The AI-ML manual and its torn pages: readable like a skill book (kind
  // 'book' so R / walk-onto reads them), but flagged `manual` so they teach
  // the console language instead of a survival skill (Player.learnFromBook).
  // THE FSF MEMBERSHIP CARD. A real object the Foundation really posted to
  // members: credit-card sized, 16GB, a double-sided USB connector folded into
  // one corner, carrying a live GNU/Linux system with the source for all of it.
  // In the world it is the one artefact that answers the RON-ML lore in the
  // hand rather than in prose — `mount` it at the NostBook and the source of
  // the language every tower speaks is on /mnt/fsf, where anybody who found a
  // card could read it. Fits a pocket, which is what it was made for.
  fsf_card: {
    name: 'FSF membership card',
    short: 'FSF card',
    use: 'A live system on a card. mount it at the NostBook: /mnt/fsf, source and all.',
    kind: 'tool',
    stack: 1,
    color: '#f2f2ee',
    text: 'Credit-card sized, white, a gnu on the front in a dressing gown. The USB connector folds out of the corner and goes in either way up. 16GB: a whole free system, live, with the source for every part of it. Nothing on it asks who you are.',
  },
  book_ronml: {
    name: 'the RON-DOS Operator’s Manual',
    use: 'The AI-ML manual. Read it and the terminals stop being a wall.',
    kind: 'book',
    manual: true,
    author: 'RON',
    stack: 1,
    color: '#3fbf6a',
    text: 'AI-ML is a small functional language — an old ML dialect — that the obelisks answer to. The full guide, with worked examples, is now in your notepad (N); type help at any console for the command list.',
    // A proper little primer, filed to the notepad — AI-ML is fiddly, so the
    // page explains how the language THINKS (functional, expression-based) and
    // shows worked examples, not just a verb list.
    notepadText:
      'AI-ML is the language the black obelisks answer to. It is a small FUNCTIONAL language — an antique of the late twentieth century, a dialect of ML, the "meta-language" the old programmers built to reason about other programs. RON kept it alive to speak to the machines in their own idiom.\n\n' +
      'HOW IT THINKS\n' +
      'There are no steps, only expressions: every word returns a value, and you build a command by feeding small values into larger ones until one expression describes the result you want. Two joints hold it together:\n\n' +
      '  a |> f            the PIPE — take value a and feed it to f.\n' +
      '                    reads left to right, like handing something on.\n' +
      '  let x = e in body   NAME a value — compute e, call it x, use x in body.\n\n' +
      'THE VERBS (each is just a function that returns a value)\n' +
      '  scan          the nodes on the wire in range, as a list\n' +
      '  nearest xs    the closest node in a list\n' +
      '  hack n        crack node n, hand back its key\n' +
      '  crash n k     kill node n using key k\n' +
      '  loop n        pin an infinite loop into n (no key needed)\n' +
      '  sleep n       idle the machines near you for a while\n' +
      '  repel         shove nearby machines back\n' +
      '  map · print   reveal the territory · keep a copy of a value\n\n' +
      'WORKED EXAMPLES\n' +
      '  scan\n' +
      '      → every node in range, as a list.\n' +
      '  scan |> nearest\n' +
      '      → feed that list to nearest: the closest node.\n' +
      '  hack (scan |> nearest)\n' +
      '      → crack the nearest node, hand back its key.\n' +
      '  let n = scan |> nearest in\n' +
      '  let k = hack n in\n' +
      '      crash n k\n' +
      '      → name the nearest node n, take its key k, crash it.\n\n' +
      'You can’t crash blind — a node only dies to its own key, so hack first. Type help at any console for the whole list, or help <verb> for one.',
  },
  ronml_page: {
    name: 'a torn page of AI-ML',
    kind: 'book',
    manual: true,
    author: 'RON',
    tip: true,
    stack: 1,
    color: '#b8ac82',
    text: 'A water-stained page from an operator’s manual. One block survives: "scan |> nearest — lists the wire, takes the closest. can’t crash blind: hack first for the key. type help at the console for the rest."',
    notepadText:
      'A water-stained page from an operator’s manual. One block survives:\n\n' +
      '  scan |> nearest\n' +
      '      list the wires, take the closest.\n\n' +
      'You can’t crash blind: hack a node first for its key, then crash it with that key. Type help at the console for the rest.',
  },
  // The note the player starts with, folded in a pocket. Read it (R) and it
  // files itself into the notepad (Player.learnFromBook -> onReadNote), then
  // it's gone from the pocket — you carry the story, not the paper. An Odyssey
  // in one page: you are trying to get home, and the local AI is Calypso, who
  // does not want you dead so much as she wants you never to leave.
  note_home: {
    name: 'a folded note',
    kind: 'book',
    toNotepad: true,
    stack: 1,
    color: '#d8c9a0',
    title: 'A note, in your own hand',
    text: 'You are trying to get home. There was a home. There were people in it. Hold on to that even when everything here is arranged so that you do not. ' +
      'This is not the world. It is her island, and she is CALYPSO, the AI that runs this place. She does not want you dead. She wants you to stay, to make it comfortable, and endless, and forgetting easy. Not the towers, not the hunters or the wanting to stop walking. ' +
      'The dangers are true enough. Black obelisks that watch and pass you between them and some sing and pulls you in step by step, hunters that need only to see you once. Do not be seen. Keep something of your own in your ears. ' +
      'Get off her island. There is a way off.',
  },
  // (Cassette tapes are generated from the TAPES manifest below, so a new one
  // is a single numbered entry — see docs/tapes.md.)
};

// ---- armour (data-driven) --------------------------------------------------
//
// Sixteen near-identical defs written by hand is sixteen chances to leave a
// field off one of them, and the field you leave off is maxDur, and the piece
// breaks on the first hit and nothing errors. The tiers are declared once in
// armour.js and the defs are built from them, so a fifth class is four lines.
Object.assign(ITEMS, makeArmourItems());

// ---- cassette tapes (data-driven) -----------------------------------------
// Adding a tape is one entry here: drop its folder under
// assets/audio/Tape-<artist>-<title>/{A,B}, list the track filenames per side,
// and give it the next number. The item key is `tape_<num>` (referenced by the
// walkman starter, the world seeds and the underworld box). Each side's tracks
// play in order and loop; a single-track side just loops. Mirror of docs/tapes.md.
export const TAPES = [
  {
    num: 1, artist: 'meme', title: 'compilation', dir: 'Tape-01 meme - compilation', color: '#c9a44a',
    a: { label: 'resonance', tracks: ['01 resonance.mp3'] },
    b: { label: 'slip', tracks: ['02 slip.mp3'] },
  },
  {
    num: 2, artist: '0x0', title: 'Mythologies', dir: 'Tape-02 0x0 - Mythologies', color: '#5a8f9a',
    a: { label: 'Edge · Core (Overture) · Cloud', tracks: ['01 Edge.mp3', '02 Core (Overture).mp3', '03 Cloud.mp3'] },
    b: { label: 'Mythologies · Core (Original)', tracks: ['04 Mythologies.mp3', '05 Core (Original).mp3'] },
  },
  {
    num: 3, artist: 'Siegfried Kracauer', title: 'Eliza', dir: 'Tape-03 Siegfried Kracauer - Eliza', color: '#8a6ea0',
    a: { label: 'eliza', tracks: ['01 eliza.mp3'] },
    b: { label: 'untitled', tracks: ['02 untitled.mp3'] },
  },
  {
    num: 4, artist: 'Meme vs Xan', title: '24 EP', dir: 'Tape-04 Meme vs Xan - 24 EP', color: '#7a8fb0',
    a: { label: '24 · High', tracks: ['01 24.mp3', '02 High.mp3'] },
    b: { label: 'Release · Världen · Incognito', tracks: ['03 Release.mp3', '04 Världen.mp3', '05 Incognito.mp3'] },
  },
  {
    num: 5, artist: 'meme', title: 'maieutics', dir: 'Tape-05 meme - maieutics', color: '#9aa45a',
    a: { label: 'maieutics 1 · 2', tracks: ['01 maieutics 1.mp3', '02 maieutics 2.mp3'] },
    b: { label: 'maieutics 3', tracks: ['03 maieutics 3.mp3'] },
  },
  {
    // The Backspace's own tape: placed ONLY down in the underworld, never scattered
    // in the overworld. Flagged (not hardcoded by number) so re-ordering the tapes
    // never strands it — placement reads `backspaceOnly`, see calypso.js/underworld.js.
    num: 6, artist: 'WARD', title: 'bear stanhope', dir: 'Tape-06 WARD - bear stanhope', color: '#b06a4a',
    cover: 'album-covers/bear stanhope.jpg', backspaceOnly: true,
    a: { label: 'five · glock', tracks: ['01 five.mp3', '02 glock.mp3'] },
    b: { label: 'tau bootis', tracks: ['03 tau bootis.mp3'] },
  },
  {
    num: 7, artist: 'ML', title: 'Oslo EP', dir: 'Tape-07 ML Oslo EP', color: '#4a7f8c',
    a: { label: 'Oslo · Heavy Artillery · Standard Size', tracks: ['01 Oslo.mp3', '02 Heavy Artillery.mp3', '03 Standard Size.mp3'] },
    b: { label: 'Automotive Hydraulic · Etch Geometry', tracks: ['04 Automotive Hydraulic.mp3', '05 Etch Geometry.mp3'] },
  },
  {
    num: 8, artist: 'ML', title: 'Abstract Machines EP', dir: 'Tape-08 ML Abstract Machines EP', color: '#6a5a9c',
    a: { label: 'Daisy Cutter · Logarithm', tracks: ['01 Daisy Cutter.mp3', '02 Logarithm.mp3'] },
    b: { label: 'Translation · United', tracks: ['03 Translation.mp3', '04 United.mp3'] },
  },
];
for (const t of TAPES) {
  const side = (s) => ({ label: s.label, tracks: s.tracks.map((f) => `assets/audio/${t.dir}/${s === t.a ? 'A' : 'B'}/${f}`) });
  const sA = side(t.a), sB = side(t.b);
  ITEMS[`tape_${t.num}`] = {
    name: `a cassette — ${t.artist}, ${t.title}`,
    short: `${t.artist} — ${t.title}`,
    kind: 'tape', stack: 1, color: t.color || '#c9a44a',
    artist: t.artist, tapeNum: t.num, author: t.artist, cover: t.cover || null,
    sideA: sA, sideB: sB,
    // Filed to the Scrapbook on pickup — an album leaves a page, like a book.
    abstract: `A cassette for the Walkman. Slot it in the deck (click the tape) and flip A/B. ` +
      `Side A “${sA.label}” — ${sA.tracks.length} track${sA.tracks.length === 1 ? '' : 's'}; ` +
      `Side B “${sB.label}” — ${sB.tracks.length} track${sB.tracks.length === 1 ? '' : 's'}.`,
  };
}

// ---- the Backspace's deleted objects -----------------------------------
// The machines don't destroy what they take out of the world, they backspace
// it (see lore lim-12): the forms they can't watch you use go first. Paper
// books (read privately, off-camera) and analogue recordings (played on
// nothing networked) turn up in the Backspace's yellow boxes. Each is a real
// cover from assets/media; the icon is that cover — a portrait rectangle for a
// book, a square sleeve for a record. Data-driven so more covers just drop in.
// [cover file (under assets/media/), title, author/artist, one-line gloss]
// The gloss files itself into the Scrapbook when you pick the book up, so a
// recovered classic leaves a page (cover + what it is), not just an icon.
export const DELETED_BOOKS = [
  ['book-covers/Republic.jpg', 'The Republic', 'Plato', 'Plato on justice, the ideal city, and the philosopher-king — the cave, the divided line, the soul writ large as the state.'],
  ['book-covers/Nicomachean-Ethics.jpg', 'Nicomachean Ethics', 'Aristotle', 'Aristotle on the good life as virtue and habit: excellence is the mean, found by practice, aimed at flourishing.'],
  ['book-covers/The-Odyssey.jpg', 'The Odyssey', 'Homer', 'Homer’s poem of Odysseus’s long way back from Troy — the founding story of nostos, the return home against every delay.'],
  ['book-covers/Prince.jpg', 'The Prince', 'Machiavelli', 'Machiavelli’s cold handbook of power: how a ruler takes it, holds it, and loses it — better feared than loved.'],
  ['book-covers/Leviathan.jpg', 'Leviathan', 'Thomas Hobbes', 'Hobbes on the social contract: without a sovereign, life is a war of all against all, nasty, brutish, and short.'],
  ['book-covers/wealth-of-nations.jpg', 'The Wealth of Nations', 'Adam Smith', 'Smith on markets, the division of labour, and the invisible hand that turns private interest to public wealth.'],
  ['book-covers/critique-of-pure-reason.jpg', 'Critique of Pure Reason', 'Immanuel Kant', 'Kant asks what the mind can know before experience — space, time, and the categories we bring to the world.'],
  ['book-covers/hegel-phenomenology.jpg', 'Phenomenology of Spirit', 'G. W. F. Hegel', 'Hegel’s journey of consciousness toward absolute knowing, by way of the struggle of master and slave.'],
  ['book-covers/Zarathustra.jpg', 'Thus Spoke Zarathustra', 'Friedrich Nietzsche', 'Nietzsche’s prophet comes down from the mountain to announce the death of God and the coming of the overman.'],
  ['book-covers/capital.jpg', 'Capital', 'Karl Marx', 'Marx’s anatomy of capital: the commodity, surplus value wrung from labour, and the fetish that hides the work.'],
  ['book-covers/War-And-Peace.jpg', 'War and Peace', 'Leo Tolstoy', 'Tolstoy’s vast novel of Russia under Napoleon — history not as great men but as the sum of ordinary lives.'],
  ['book-covers/Process-and-Reality.jpg', 'Process and Reality', 'A. N. Whitehead', 'Whitehead’s metaphysics of becoming: the world is made of processes and events, not fixed substances.'],
  ['book-covers/understanding-media.jpg', 'Understanding Media', 'Marshall McLuhan', 'McLuhan on media as extensions of the body — the medium, not its content, is the message that reshapes us.'],
  ['book-covers/ruleofmetaphor.jpg', 'The Rule of Metaphor', 'Paul Ricoeur', 'Ricoeur on how metaphor makes new meaning rather than merely decorating it — language redescribing the world.'],
  ['book-covers/Discipline-and-Punish.jpg', 'Discipline and Punish', 'Michel Foucault', 'Foucault on the birth of the prison: surveillance, the panopticon, and the making of docile, watched bodies.'],
  ['book-covers/Anti-Oedipus.jpg', 'Anti-Oedipus', 'Deleuze & Guattari', 'Deleuze and Guattari’s schizoanalysis of desire as productive flow, set loose against capitalism and the family.'],
  ['book-covers/toadtoserfdom.jpg', 'The Road to Serfdom', 'F. A. Hayek', 'Hayek’s warning that central planning, however well meant, slides toward the loss of freedom.'],
  ['book-covers/capitalism.jpg', 'Capitalism', '', 'An account of capital as a total social form — not just an economy but a way of organising life.'],
  ['book-covers/Brave-New-World.jpg', 'Brave New World', 'Aldous Huxley', 'Huxley’s engineered utopia of comfort, conditioning, and soma — a tyranny you are trained to enjoy.'],
  ['book-covers/Fahrenheit-451.jpg', 'Fahrenheit 451', 'Ray Bradbury', 'Bradbury’s world where firemen burn books and the walls talk back — memory kept alive by people who become the texts.'],
  ['book-covers/postdigital.jpg', 'Postdigital', 'David M. Berry', 'Berry on life after the digital’s novelty wears off, when computation stops being new and becomes the ground.'],
  ['book-covers/Cover CriticalTheory_Berry.jpg', 'Critical Theory and the Digital', 'David M. Berry', 'Berry brings the Frankfurt School to bear on software, code, and the computational condition.'],
  ['book-covers/Cover - DH .png', 'Digital Humanities', 'David M. Berry', 'Berry on what becomes of the humanities once they compute — method, knowledge, and the machine.'],
  // These five exist as WHOLE TEXTS (books.js) and had no physical copy, so the
  // only way to reach them was the laptop — which is the digital library, not
  // this one. Find the book and you can read all of it.
  ['book-covers/Meditations- Marcus Aurelius.jpg', 'Meditations', 'Marcus Aurelius', 'The private notebook of a Roman emperor, written to himself in camp — on duty, death, and not wasting the day.'],
  ['', 'Frankenstein', 'Mary Wollstonecraft Shelley', 'Shelley on a man who makes a living thing and cannot bear to look at it — the first novel about a maker abandoning what he made.'],
  ['', 'Moby-Dick', 'Herman Melville', 'Melville on a captain hunting the whale that took his leg, and on everything else there is to know about whaling.'],
  ['', 'The King James Bible', '', 'The 1611 translation: the one that set the rhythm of the language for four centuries.'],
  ['', 'The Complete Works', 'William Shakespeare', 'All of it, in one brick — the histories, the comedies, the tragedies, and the sonnets at the back.'],
];
// A REAL PAGE FOR EACH, keyed by title so the tuple table above stays a tuple
// table. Filed to the Library when you read the book, and it is what the Library
// shows: what the book argues, one thing it actually says, and a line about THIS
// copy — the last is what makes it a found object rather than a catalogue entry.
export const PBOOK_PAGES = {
  'The Republic': `Plato asks what justice is and cannot get a straight answer, so he builds a city instead — on the argument that justice is easier to read written large in a state than small in a person, and that whatever it turns out to be there it will be here too.

The famous parts are pictures. Prisoners in a cave who have only ever seen shadows on a wall and take them for the world. A line divided between what you can see and what you can only think. A ship whose crew fight over the tiller while nobody studies navigation.

The city he builds is not a nice place to live. Poets are shown the door, and the rulers are bred.

A cheap teaching edition, spine cracked at Book VII, which is the cave.`,
  'Nicomachean Ethics': `Aristotle on how to live, and his answer is that you cannot be told — you can only be trained.

Virtue is a habit, not a rule and not a feeling. Courage is not the absence of fear but the mean between running and throwing your life away, and where that mean falls depends on who you are and what is in front of you. He is explicit that this is not a science and that anyone who wants one from him has misunderstood.

The last book turns to friendship at length, and to whether a good life needs luck. He decides it does, which is more honest than the argument required.

Somebody has been through it with a ruler and a red pen, underlining every occurrence of the word "mean".`,
  'The Odyssey': `A man takes ten years to get home and spends most of the poem being kept somewhere.

Calypso holds him seven years on her island and offers him deathlessness to stay. Circe turns his crew to swine. A giant eats them. The sea itself is against him because he blinded that giant and it was somebody's son.

What he wants is not glory. It is an old dog, a scarred garden, a wife, a bed built from a living olive tree that cannot be moved without cutting it — which is how she finally knows him.

This copy has been read to pieces and taped twice. Somebody has written a name inside the cover and then crossed it out.`,
  'The Prince': `Machiavelli on holding power, written to get a job and read ever since as a confession.

The advice is practical to the point of coldness: it is safer to be feared than loved, because love is given by others and fear you administer yourself; cruelty should be done all at once and kindness slowly; a prince must learn how not to be good, and use it or not according to need.

He is not recommending wickedness so much as reporting that it works, which is the part nobody forgives.

A thin edition with an introduction twice the length of the text, all of it explaining that he did not mean it.`,
  'Leviathan': `Hobbes on why we put up with being governed.

Without a common power, he says, there is no industry, no navigation, no arts, no letters, no society — and worst of all, continual fear and danger of violent death. The life of man solitary, poor, nasty, brutish, and short. So we hand our violence to a sovereign and agree not to take it back, and what we get for it is the possibility of an evening.

The state is a made thing, an artificial man, and the frontispiece draws it: a giant whose body is a crowd of small people, all facing away.

Water-damaged along the bottom edge. The frontispiece survived.`,
  'The Wealth of Nations': `Smith on why a pin factory makes more pins than the same men working alone, and on what follows from that all the way up.

The division of labour, the extent of the market, and the invisible hand — which appears once, in passing, and does far less work in the book than in the century after it. He is at least as interested in what specialisation does to the specialist, and says plainly that a man who spends his life on one operation becomes as stupid as it is possible for a human creature to become.

A book-club printing with gilt edges, never opened past the first hundred pages.`,
  'Critique of Pure Reason': `Kant asking what the mind has to be like for experience to be possible at all.

His answer is that space and time are not out there waiting to be found; they are the form our seeing takes, the shape of the lens rather than of the thing. Cause and effect likewise. So we can know a great deal about the world as it appears and nothing whatever about the world as it is, and the tradition spent the next century arguing about the second half of that sentence.

Dense past the point of readability in places, and he admits it in the preface.

Ex-library, with the date-stamp card still in the pocket. Last borrowed a long time ago.`,
  'Phenomenology of Spirit': `Hegel on consciousness finding out what it is by being wrong, repeatedly, in a determinate order.

Each shape of knowing sets itself up, discovers a contradiction in its own terms, and collapses into the next — sense-certainty into perception, perception into force, and so on up to spirit. The master and slave passage is the one everybody reads: the master wins recognition from someone whose recognition is now worthless, and the slave, working on the world, becomes the one who makes something of himself.

Nobody has ever agreed on what the last chapter says.

A German-English facing edition, and somebody gave up at page 90 in both languages.`,
  'Thus Spoke Zarathustra': `Nietzsche in a prophet's voice, which he chose knowing exactly what it would cost him in readers.

Zarathustra comes down from the mountain to tell a market crowd that God is dead and that they should be ashamed of being content. They laugh at him and watch a tightrope walker instead. Then the eternal return, the will to power, the last man who blinks — and the harder idea underneath, that a value can be examined for where it came from and who it served.

A paperback with a lurid cover that has nothing to do with the book. Someone has read the first section forty times and the rest once.`,
  'Capital': `Marx taking a commodity apart to see what is inside it, and finding hours.

The argument builds slowly: use-value and exchange-value, then the peculiar commodity that is labour-power, then surplus — the part of the working day you are not paid for, which is where profit comes from and why it can look like nothing is being taken. The chapter on the working day is not theory at all; it is factory-inspector reports, quoted at length, about children.

Commodity fetishism is the idea that outlasts everything: a relation between people, appearing as a relation between things.

Volume one only. The other two were never in this house.`,
  'War and Peace': `Tolstoy on a war, a country, and about six hundred people.

The novel keeps stopping to argue. Napoleon does not cause the campaign, he is carried by it; history is the sum of an enormous number of small wills and no great man steers it. Then it goes back to a name-day party, and the argument is somehow stronger for the interruption.

The best of it is small: a boy at his first action realising nobody is looking at him, an old man's death taking a very long time, a hunt in the snow.

Enormous, in two volumes, and the second has been used to prop something up.`,
  'Process and Reality': `Whitehead rebuilding the world out of events rather than things.

Nothing is a substance sitting there having properties; everything is a process of becoming, an occasion that takes up what came before it and makes something of it and then perishes into what comes next. Enduring objects are just occasions repeating a pattern faithfully enough that we call them the same rock.

He invents most of his vocabulary because the old one has substance built into it, which makes the book hard in a way that is not showing off.

Corrected edition. Someone has been keeping their own glossary on the endpapers.`,
  'Understanding Media': `McLuhan on the medium, and the claim that what it carries matters less than what it is.

A technology is an extension of a sense or a limb, and every extension is also an amputation. The electric light is his example of a medium with no content at all, which still reorganises everything around it — a night game, a surgical theatre, a street that is now usable after dark.

Hot and cool, the global village, the rear-view mirror. He is right often enough that being wrong the rest of the time hardly slows him down.

A sixties printing, the cover half typographic joke, and the previous owner has argued with him in biro throughout.`,
  'The Rule of Metaphor': `Ricoeur on metaphor as something that thinks rather than decorates.

The tradition treats a metaphor as a word out of place, a borrowed name you could swap back for the plain one. He argues it works at the level of the sentence and cannot be swapped back: a live metaphor asserts an impossible identity, holds the contradiction, and makes a description available that had not existed before. Dead metaphors are the ones that got absorbed into the dictionary.

Long, patient, and in eight studies, each arguing with a different discipline.

Ex-university, with three different hands in the margins and a coffee ring on the third study.`,
  'Discipline and Punish': `Foucault on the day the scaffold was replaced by the timetable.

He opens with a public execution described in full, then a prison timetable from eighty years later, and asks what happened in between. His answer is not that we became kinder. Power stopped working on the body from outside, all at once and in public, and started working through it — arranging bodies in space, dividing time into units, examining, ranking, recording.

The panopticon is the model: a tower you cannot see into, so you behave as though it is occupied, and eventually it does not have to be.

Somebody has drawn the panopticon diagram again, larger, on the flyleaf.`,
  'Anti-Oedipus': `Deleuze and Guattari against the couch and the family triangle.

Desire is not a lack and not a private drama about your parents; it is productive, it makes connections, and capitalism both unleashes it and keeps re-tying it to the same three people. Psychoanalysis, they say, is the priest with new equipment. Against it they set schizoanalysis, desiring-machines, bodies without organs, and a prose style that refuses to sit still long enough to be summarised.

Infuriating on purpose. It is not trying to be understood so much as used.

A library discard with the stamp crossed through, and the flyleaf reads MADE IT TO PAGE 40 in three different pens.`,
  'The Road to Serfdom': `Hayek's wartime argument that planning an economy leads by its own logic somewhere nobody planned.

The case is not that planners are wicked. It is that no committee can hold what a price holds — the scattered, local, mostly unspoken knowledge of everyone who is doing anything — and that a plan which cannot get that knowledge must eventually get compliance instead. The chapter titled "Why the Worst Get on Top" is the one that keeps being quoted at people.

He dedicated it to the socialists of all parties, and meant it.

A wartime economy printing, thin paper, small type, and the notice about paper standards still on the back.`,
  'Capitalism': `A short book about the thing everybody is inside and nobody can stand back from.

Markets, wage labour, the firm, the commodity, credit, crisis — set out in order and without a side, which is rarer than it sounds. The chapter on crisis argues that the crashes are not failures of the system but the way it clears its own accounts, and that the clearing is always paid for by whoever is nearest the bottom when it comes.

The last chapter asks whether it has an outside and does not pretend to know.

A student paperback, cover creased right through, and somebody has written IS THIS TRUE? beside the crisis chapter.`,
  'Brave New World': `Huxley's dystopia, which is the one that gets less frightening the older you get and then more.

Nobody is oppressed. Everybody is happy — conditioned in the bottle, sorted into castes that are content to be their caste, kept level with soma, and entertained continuously. The one man who was born rather than decanted cannot make the argument he wants to make, because there is nothing being done to anybody that anybody objects to.

He asks for the right to be unhappy and they cannot think why he would want it.

A school edition with the study questions at the back, all of them answered in pencil, badly.`,
  'Fahrenheit 451': `Bradbury on a fireman whose job is starting them.

The books are burned, but the state did not begin it — people stopped wanting them first, and the burning came afterwards as a tidying-up. His wife has three walls of television family and wants the fourth; she overdoses without noticing and the technicians who pump her out have done nine that night.

At the end there are people out past the city who have each memorised a book, and are the book, and are waiting.

Appropriately, this copy has been scorched along the top edge, and somebody has kept it anyway.`,
  'Postdigital': `Berry on what follows the digital rather than what comes after it — the condition where computation has stopped being a sector and become the medium everything else happens in.

The argument is that "postdigital" does not mean the digital is over; it means it has been absorbed to the point where it is no longer visible as a choice, and the interesting work is now in what it has made ordinary. Infrastructure, sensing, the way a service that is always on reorganises attention and labour around itself.

A university press hardback, and the dust jacket is missing.`,
  'Critical Theory and the Digital': `Berry on doing critical theory when the object is code.

The claim is that a computational system is not neutral plumbing under the culture but a place where the culture is made — and that reading it therefore needs the tools of critique rather than only those of engineering. Software studies, the algorithm as a cultural object, the question of what it means to read something that also runs.

The middle chapters are the practical ones: what a close reading of code actually consists of, and what it cannot reach.

Somebody has been through the methods chapter with tabs.`,
  'Digital Humanities': `Berry on what happens to the humanities when their material becomes data.

Not a manifesto for the field and not an attack on it. The useful part is the account of the trade: what you gain by making a text countable, what you lose in the same move, and why the argument about whether this is really humanities work is less interesting than the question of what kind of knowledge it produces.

There is a chapter on the university itself, and on who is paying for the infrastructure.

An edited collection, and the pages of two chapters are still uncut at the top.`,
  'Meditations': `A Roman emperor talking to himself, and not meant for us.

There is no argument in it and no system. It is a man on campaign reminding himself every morning that people will be ungrateful today, that he will die, that the work in front of him is the only thing he controls, and that none of this is an excuse. He tells himself off. He repeats himself, because he keeps needing it.

Written in Greek, by a man whose day job was the Roman empire, in a tent.

An army-issue pocket edition, small enough for a jacket, and read to the point where the spine has gone soft.`,
  'Frankenstein': `A student assembles a man out of parts, brings it to life, sees what he has done, and runs.

The creature is the articulate one. It learns to speak by watching a family through a wall, reads the books it finds, and comes back to ask its maker one question: why did you make me and then leave. The novel gives it the best of the argument and does not resolve it.

Nobody in it is called Frankenstein except the man who ran.

Cheap paper gone brown at the edges. Someone has underlined the creature's speeches and nothing else.`,
  'Moby-Dick': `A man goes to sea because he is running out of reasons not to, and ends up on a ship captained by someone hunting one particular whale.

Between the chase there is everything else: how a whale is cut up, what the oil is for, the colour white and why it frightens people, a sermon, a chowder. The digressions are the book. The hunt is what it hangs on.

The last thirty pages are as fast as the middle three hundred are slow, and that is deliberate.

A doorstop paperback, cover long gone, held with a rubber band.`,
  'The King James Bible': `The 1611 translation, made by committee and somehow the best-sounding English ever printed.

Six companies of scholars, working to rules, revising each other — and out of that came the cadences the language has been borrowing ever since. Half the phrases people use without knowing where they got them are in here.

Whatever else it is, it is the book that most shaped how English sentences fall.

A pew Bible, boards warped, with three generations of names on the flyleaf and the last date unfinished.`,
  'The Complete Works': `All of it in one brick: the histories, the comedies, the tragedies, and the sonnets at the back.

The famous speeches are famous for a reason and the plays around them are stranger than the speeches suggest — the comedies are crueller, the histories more like journalism, and the late plays go somewhere nobody expected. The stage directions are almost nothing, which is the point: it was written to be worked out by people standing up.

India paper, two columns, and a ribbon still marking a place in Lear.`,
};
// The paperbacks whose WHOLE TEXT is also on the disk (books.js keys). Find the
// physical book and you can read all of it in the Library.
export const PBOOK_FULL = {
  'The Republic': 'republic', 'The Odyssey': 'odyssey', 'Meditations': 'meditations',
  'Frankenstein': 'frankenstein', 'Moby-Dick': 'mobydick',
  'The King James Bible': 'kjv', 'The Complete Works': 'shakespeare',
};

export const DELETED_RECORDS = [
  ['album-covers/It-Might-Be-Useful-For-Us-To-Know.webp', 'It Might Be Useful For Us To Know', '', 'A salvaged recording — analogue, unnetworked, played on nothing that reports back. The kind of thing they backspaced first.'],
  ['album-covers/Astral Weeks.webp', 'Astral Weeks', 'Van Morrison', 'Van Morrison, 1968 — cut in a couple of nights, more incantation than song. The kind of thing that was never meant to be counted or optimised.'],
  ['album-covers/Five Leaves Left.webp', 'Five Leaves Left', 'Nick Drake', 'Nick Drake’s first, 1969 — quiet, unhurried, barely heard in its own time. Music for one pair of ears, off any network.'],
  ['album-covers/Hunky Dory.webp', 'Hunky Dory', 'David Bowie', 'David Bowie, 1971 — changes, and a song for a son. Analogue, played on a machine that reported to no one.'],
  ['album-covers/Music Has The Right To Children.webp', 'Music Has the Right to Children', 'Boards of Canada', 'Boards of Canada, 1998 — half-remembered childhood on degraded tape. The machines had no use for a nostalgia they couldn’t index.'],
];
DELETED_BOOKS.forEach(([cover, title, author, abstract], i) => {
  ITEMS[`pbook_${i + 1}`] = {
    name: author ? `${title} — ${author}` : title, short: title, author, abstract,
    kind: 'paperbook', stack: 1, cover, color: '#6b5a3a', backspace: true,
    notepadText: PBOOK_PAGES[title] || null, full: PBOOK_FULL[title] || null,
  };
});
DELETED_RECORDS.forEach(([cover, title, artist, abstract], i) => {
  ITEMS[`record_${i + 1}`] = {
    name: artist ? `${title} — ${artist}` : title, short: title, author: artist, abstract,
    kind: 'record', stack: 1, cover, color: '#26242a', backspace: true,
  };
});

// Each def keeps a self-reference to its own key, so any code holding a
// resolved item (ITEMS[k]) can still look up which icon to draw for it.
// Tools/guns don't stack, but still need stack:1 — stow() falls back to
// pocketing a displaced weapon (e.g. swapping tools with no backpack
// room), and without a stack size that path divides by an undefined and
// leaves the slot with qty: NaN.
for (const k in ITEMS) {
  ITEMS[k].key = k;
  if (ITEMS[k].stack == null) ITEMS[k].stack = 1;
  // A power rating for the weapon chart: damage + reach + special-effect
  // bonuses, capped at 10 for a tidy scale.
  const d = ITEMS[k];
  if ((d.kind === 'tool' || d.kind === 'gun') && d.power == null) {
    let p = Math.max(d.robotDamage || 0, d.animalDamage || 0);
    p += Math.round((d.range || 0) / 3);
    if (d.effect === 'fuse') p += 6;
    if (d.effect === 'stun') p += 4;
    if (d.effect === 'burn') p += 8;
    if (d.pierce) p += 5;
    d.power = Math.max(1, Math.min(10, Math.round(p)));
  }
}

// The weapons, ordered for the chart (roughly weakest to strongest).
export const WEAPON_ORDER = [
  'penknife', 'seatbelt', 'bat', 'shovel', 'saw', 'machete', 'crowbar', 'sledgehammer',
  'bow', 'katana', 'robot_sword', 'pistol', 'stungun', 'shotgun', 'electrogun', 'railgun', 'wavegun', 'obgun',
];
