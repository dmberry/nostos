// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// What a building IS, in one place.
//
// The town has always had thirteen lots with sizes and ruin levels, and the
// comments beside them already said what they were ("warehouse", "cottage") —
// but only in comments, so nothing could read it. A building's kind is a real
// fact about it: it decides what is inside, what colour it is, and what the
// place felt like before the machines. This module is the single record of that,
// the way islands.js is the single record of what a place is.
//
// Deliberately pure: no map, no canvas, no rng of its own (callers pass one).
// It answers questions about TYPES; worldgen assigns them and the renderer will
// read the palette. Nothing here mutates anything.
//
// Scope today (docs/PLAN.md): the type is assigned, stored and readable. The
// loot tables and palettes below are DATA THAT NOTHING CONSUMES YET, written now
// so that when the loot grouping and the per-type colouring land, they read from
// this file rather than growing a second source of truth somewhere else.

// A lot's size decides what it can plausibly be: nobody runs a hospital out of a
// 5x4 cottage, and nobody lives in a 12x8 shed. `min` is the floor area needed.
// `weight` is how common the type is once it fits. `unique` caps it at one per
// island, so a town has one ironmonger and one hospital rather than four.
export const BUILDING_TYPES = {
  domestic: {
    name: 'House',
    look: 'a house', // for the inspect line: "You are looking at a house."
    min: 0,
    weight: 10,
    // Wall, roof and trim. Domestic is the baseline everything else departs
    // from — brick and stone, whatever the island's palette makes of it.
    palette: { wall: '#8d7a68', roof: '#6b4f3f', trim: '#a2907c' },
    // What tends to be found inside. Weights, not guarantees; a caller rolls
    // against them. Kept as item keys so items.js stays the only item registry.
    loot: [['tin', 4], ['berries', 3], ['torch', 3], ['tape_1', 1], ['battery', 1]],
  },
  ironmonger: {
    name: "Ironmonger's",
    look: "an ironmonger's, its racks still bolted to the wall",
    min: 30,
    weight: 3,
    unique: true,
    palette: { wall: '#77706a', roof: '#4a4643', trim: '#9a8f66' },
    loot: [['screwdriver', 5], ['crowbar', 3], ['saw', 3], ['shovel', 3], ['scrap', 4], ['circuit', 2]],
  },
  warehouse: {
    name: 'Warehouse',
    look: 'a warehouse, its roof half gone',
    min: 60,
    weight: 4,
    palette: { wall: '#6f6a63', roof: '#585350', trim: '#8a8078' },
    loot: [['wood', 5], ['scrap', 5], ['circuit', 2], ['bomb_small', 1], ['tin', 3]],
  },
  hospital: {
    name: 'Clinic',
    look: 'a clinic. The paint is still that particular pale green',
    min: 48,
    weight: 2,
    unique: true,
    // The white the user asked for: clinical, and it should read as the one
    // building on the island that was trying to be clean.
    palette: { wall: '#d8dcd6', roof: '#b9c2bd', trim: '#eef1ec' },
    // No bandages in the game yet (wounds by type are Phase 4 in the roadmap);
    // when they land, this is the door they go behind. Until then a clinic holds
    // what a clinic would still have: the herb, and what was in the cupboard.
    loot: [['moly', 3], ['berries', 3], ['tin', 3], ['torch', 1]],
  },
  workshop: {
    name: 'Workshop',
    look: 'a workshop. Somebody mended things here',
    min: 24,
    weight: 3,
    palette: { wall: '#7d7268', roof: '#514a44', trim: '#9d8b60' },
    loot: [['circuit', 4], ['chip_fragment', 3], ['battery', 3], ['scrap', 4], ['screwdriver', 2]],
  },
  grocer: {
    name: 'Grocer',
    look: 'a grocer. The shelves are bare and the shelving is not',
    min: 20,
    weight: 3,
    palette: { wall: '#8a7f6a', roof: '#63513c', trim: '#b3a074' },
    loot: [['tin', 6], ['berries', 4], ['meat', 2]],
  },
  // Sea-side. `sited` means this type is PLACED, never rolled: a boat-builder's
  // yard belongs on the shore beside its jetty (boatyard.js finds that site), and
  // a town lot two hundred tiles inland must never come up as one.
  boatyard: {
    name: "Boat-builder's",
    look: "a boat-builder's yard. The slipway still runs down to the water",
    min: 0,
    weight: 0,
    sited: 'shore',
    palette: { wall: '#7c6a52', roof: '#4f4336', trim: '#9d8256' },
    // NOT sail / oar / rope. Those three are the greek-ship parts, and they are
    // scarce on purpose: the crossing has to be a thing you went and found. They
    // are placed by hand in the FIRST yard's boxes (boatyard.js) and must never
    // be rollable, or a second yard quietly hands out a second sail.
    loot: [['wood', 6], ['tin', 3], ['torch', 2], ['scrap', 3], ['tape_1', 1]],
  },
  civic: {
    name: 'Library',
    look: 'a library. Most of it burned, and not recently',
    min: 36,
    weight: 2,
    unique: true,
    palette: { wall: '#8e8474', roof: '#5d5346', trim: '#c0b498' },
    // Real keys only: `paperbook` is a KIND in items.js, not an item — the
    // twenty-three of them are pbook_1..pbook_23. When the loot roller lands it
    // will want "any paperbook", which is a job for a class query
    // (item-classes.js) rather than for a longer list here.
    loot: [['book_ronml', 3], ['ronml_page', 4], ['pbook_4', 2], ['pbook_11', 2], ['torch', 2]],
  },
};

// The fallback, so a caller that asks about a type nobody declared gets a
// building rather than undefined. Same contract as islands.js's UNKNOWN_ISLAND.
export const UNKNOWN_BUILDING = {
  name: 'Building',
  look: 'a building. Whatever it was for, it is not for that now',
  min: 0,
  weight: 0,
  palette: { wall: '#8d7a68', roof: '#6b4f3f', trim: '#a2907c' },
  loot: [['scrap', 2], ['wood', 2]],
};

export function buildingProfile(type) {
  return BUILDING_TYPES[type] || UNKNOWN_BUILDING;
}

export const buildingName = (type) => buildingProfile(type).name;
export const buildingLook = (type) => buildingProfile(type).look;

// The palette a building should be drawn in. Takes the island's own tint so a
// clinic on a burnt island is still recognisably a clinic and still recognisably
// on that island: the type sets the colour, the island bends it. `blend` is how
// far towards the island tint to pull (0 = pure type colour, 1 = pure island).
// Nothing calls this yet; it is here so the colouring pass has one place to go.
export function buildingPalette(type, islandTint = null, blend = 0.25) {
  const base = buildingProfile(type).palette;
  if (!islandTint) return { ...base };
  const mix = (a, b) => {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (sh) => Math.round((((pa >> sh) & 255) * (1 - blend)) + (((pb >> sh) & 255) * blend));
    return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
  };
  return { wall: mix(base.wall, islandTint), roof: mix(base.roof, islandTint), trim: mix(base.trim, islandTint) };
}

// Assign a type to every lot on an island. Pure: same lots + same rng sequence
// gives the same town every time, which is what keeps a seeded world seeded.
//
// The rules are the ones a town obeys: a type only lands on a lot big enough to
// hold it, the rare civic buildings appear at most once, and everything left
// over is somebody's house — because most buildings in most places are.
export function assignLotTypes(lots, rng) {
  const used = new Set();
  return lots.map((lot) => {
    const area = (lot.w || 0) * (lot.h || 0);
    const pool = [];
    for (const [key, def] of Object.entries(BUILDING_TYPES)) {
      if (def.sited) continue;          // shore types are placed, never rolled
      if (area < def.min) continue;
      if (def.unique && used.has(key)) continue;
      for (let i = 0; i < def.weight; i++) pool.push(key);
    }
    if (!pool.length) return { ...lot, type: 'domestic' };
    const type = pool[Math.floor((rng ? rng() : 0) * pool.length)];
    if (BUILDING_TYPES[type].unique) used.add(type);
    return { ...lot, type };
  });
}

// Roll one item key from a type's table. For the loot grouping when it lands:
// the caller decides how many drops a building gets, this decides what kind of
// place it is drawing from.
export function rollBuildingLoot(type, rng) {
  const table = buildingProfile(type).loot;
  const total = table.reduce((n, [, w]) => n + w, 0);
  if (!total) return null;
  let r = (rng ? rng() : 0) * total;
  for (const [item, w] of table) { r -= w; if (r < 0) return item; }
  return table[table.length - 1][0];
}
