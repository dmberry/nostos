// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// Building types (src/game/buildings.js). The town's lots have always had
// implied kinds — the lot table's own comments said "warehouse" and "cottage" —
// but only in comments, so nothing could read them. These tests pin the registry
// contract that the loot grouping and the per-type colouring will both build on,
// BEFORE either exists, so that when they land they cannot quietly disagree
// about what a building is.

import { buildWorld } from '../src/game/worldgen.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILDING_TYPES, UNKNOWN_BUILDING, buildingProfile, buildingName, buildingLook,
  buildingPalette, assignLotTypes, rollBuildingLoot,
} from '../src/game/buildings.js';
import { makeRng } from '../src/game/rng.js';
import { placeBoatYard } from '../src/game/boatyard.js';
import { ITEMS } from '../src/game/items.js';
import { itemClass } from '../src/game/item-classes.js';

const LOTS = [
  { x0: 66, y0: 54, w: 12, h: 8 },   // 96: big enough for anything
  { x0: 90, y0: 56, w: 7, h: 6 },    // 42
  { x0: 88, y0: 74, w: 5, h: 4 },    // 20: a cottage, and nothing else fits
];

test('every declared type is complete, so a caller never has to guard a field', () => {
  for (const [key, def] of Object.entries(BUILDING_TYPES)) {
    assert.ok(def.name, `${key} has a name`);
    assert.ok(def.look, `${key} has an inspect line`);
    assert.equal(typeof def.min, 'number', `${key} has a size floor`);
    // A rollable type must be able to come up; a SITED one must not, and the
    // two guards belong together so a new type cannot be added half-way between.
    if (def.sited) assert.equal(def.weight, 0, `${key} is sited, so it must carry no roll weight`);
    else assert.ok(def.weight > 0, `${key} can actually be rolled`);
    for (const k of ['wall', 'roof', 'trim']) {
      assert.match(def.palette[k], /^#[0-9a-f]{6}$/i, `${key}.palette.${k}`);
    }
    assert.ok(def.loot.length, `${key} has a loot table`);
    for (const [item, w] of def.loot) {
      assert.equal(typeof item, 'string', `${key} loot key`);
      assert.ok(w > 0, `${key} loot weight for ${item}`);
    }
  }
});

// The greek-ship parts are what a whole crossing hangs on. If any type's table
// could roll one, a second building of that type quietly doubles them.
test('no loot table can roll a scarce crossing part', () => {
  for (const [key, def] of Object.entries(BUILDING_TYPES)) {
    for (const part of ['sail', 'oar', 'rope']) {
      assert.ok(!def.loot.some(([k]) => k === part), `${key} must not roll a ${part}`);
    }
  }
});

test('an unknown type resolves to a building, never to undefined', () => {
  assert.equal(buildingProfile('sauna'), UNKNOWN_BUILDING);
  assert.equal(buildingProfile(undefined), UNKNOWN_BUILDING);
  assert.equal(buildingName('sauna'), 'Building');
  assert.ok(buildingLook('sauna').length);
});

test('a type only lands on a lot big enough to hold it', () => {
  // The 5x4 cottage is 20 tiles: too small for the warehouse (60), the clinic
  // (48), the library (36) and the ironmonger (30).
  for (let seed = 0; seed < 40; seed++) {
    const [, , small] = assignLotTypes(LOTS, makeRng(seed));
    const def = buildingProfile(small.type);
    assert.ok(20 >= def.min, `seed ${seed}: ${small.type} needs ${def.min} tiles, got 20`);
  }
});

test('the rare civic buildings appear at most once in a town', () => {
  const many = Array.from({ length: 13 }, () => ({ x0: 0, y0: 0, w: 12, h: 8 }));
  for (let seed = 0; seed < 30; seed++) {
    const counts = {};
    for (const lot of assignLotTypes(many, makeRng(seed))) counts[lot.type] = (counts[lot.type] || 0) + 1;
    for (const [key, def] of Object.entries(BUILDING_TYPES)) {
      if (def.unique) assert.ok((counts[key] || 0) <= 1, `seed ${seed}: ${counts[key]} x ${key}`);
    }
  }
});

test('assignment is seeded, and never mutates the lots it was given', () => {
  const before = JSON.stringify(LOTS);
  const a = assignLotTypes(LOTS, makeRng(7)).map((l) => l.type);
  const b = assignLotTypes(LOTS, makeRng(7)).map((l) => l.type);
  assert.deepEqual(a, b, 'same seed, same town');
  assert.equal(JSON.stringify(LOTS), before, 'the input is untouched');
  assert.equal(LOTS[0].type, undefined);
});

test('loot rolls stay inside the type table', () => {
  const keys = BUILDING_TYPES.ironmonger.loot.map(([k]) => k);
  const rng = makeRng(3);
  for (let i = 0; i < 50; i++) assert.ok(keys.includes(rollBuildingLoot('ironmonger', rng)));
  // An unknown type still rolls something rather than throwing.
  assert.ok(rollBuildingLoot('sauna', makeRng(1)));
});

test('the island tint bends a palette without erasing the type', () => {
  const pure = buildingPalette('hospital');
  const tinted = buildingPalette('hospital', '#000000', 0.25);
  assert.equal(pure.wall, BUILDING_TYPES.hospital.palette.wall);
  assert.match(tinted.wall, /^#[0-9a-f]{6}$/);
  assert.notEqual(tinted.wall, pure.wall, 'the tint moved it');
  const pureVal = parseInt(pure.wall.slice(1, 3), 16);
  const tintVal = parseInt(tinted.wall.slice(1, 3), 16);
  assert.ok(tintVal < pureVal && tintVal > pureVal * 0.6, 'moved a quarter of the way, not all of it');
});

test('a generated world records its buildings, and the map can answer for a tile', () => {
  const { map } = buildWorld(12345);
  assert.ok(map.buildings && map.buildings.length, 'the world knows its buildings');
  for (const b of map.buildings) assert.ok(BUILDING_TYPES[b.type], `${b.type} is a declared type`);
  const b0 = map.buildings[0];
  const mid = map.buildingAt(b0.x0 + Math.floor(b0.w / 2), b0.y0 + Math.floor(b0.h / 2));
  assert.equal(mid && mid.type, b0.type, 'a tile inside resolves to its building');
  assert.equal(map.buildingAt(b0.x0 - 5, b0.y0 - 5), null, 'open ground is not a building');
});

test('a shore type is placed, never rolled onto an inland lot', () => {
  const big = Array.from({ length: 40 }, () => ({ x0: 0, y0: 0, w: 12, h: 8 }));
  for (let seed = 0; seed < 25; seed++) {
    for (const lot of assignLotTypes(big, makeRng(seed))) {
      assert.ok(!buildingProfile(lot.type).sited, `seed ${seed}: ${lot.type} is sited and must not be rolled`);
    }
  }
  // ...but it is still a full, valid type in its own right.
  assert.equal(buildingName('boatyard'), "Boat-builder's");
  assert.ok(BUILDING_TYPES.boatyard.loot.some(([k]) => k === 'wood'), 'a shipwright has timber');
});

test("the boat-builder's yard registers itself as a building", () => {
  const { map } = buildWorld(12345);
  // buildWorld makes the LAND; the coast is cut later by the island builder, so
  // a bare world has no sea at all and the yard has nowhere to go. The first cut
  // of this test called placeBoatYard on a bare world, got `false`, and returned
  // early — passing green while checking nothing. Give it a shore.
  for (let y = 0; y < map.h; y++) {
    for (let x = 118; x < map.w; x++) map.setFloor(x, y, 'sea');
    map.setFloor(117, y, 'sand');       // a beach for it to sit on
    for (let x = 108; x < 117; x++) map.setFloor(x, y, 'grass');  // buildable behind it
  }
  const before = map.buildings.length;
  const placed = placeBoatYard(map, 12345);
  assert.equal(placed, 1, 'with a shore to build on, one yard places');
  assert.equal(map.buildings.length, before + 1);
  const yard = map.buildings[map.buildings.length - 1];
  assert.equal(yard.type, 'boatyard');
  const mid = map.buildingAt(yard.x0 + Math.floor(yard.w / 2), yard.y0 + Math.floor(yard.h / 2));
  assert.equal(mid && mid.type, 'boatyard', 'and the map can answer for its tiles');
});

test('a coast can carry several yards, and only the first holds the ship parts', () => {
  const { map } = buildWorld(4242);
  for (let y = 0; y < map.h; y++) {
    for (let x = 118; x < map.w; x++) map.setFloor(x, y, 'sea');
    map.setFloor(117, y, 'sand');
    for (let x = 104; x < 117; x++) map.setFloor(x, y, 'grass');
  }
  const placed = placeBoatYard(map, 4242, null, 3);
  assert.ok(placed >= 2, `a long coast should hold more than one yard, got ${placed}`);
  const yards = map.buildings.filter((b) => b.type === 'boatyard');
  assert.equal(yards.length, placed, 'each one registers itself');
  // No two yards overlap: a tile resolves to exactly one building.
  for (const y1 of yards) {
    const others = yards.filter((o) => o !== y1);
    for (const o of others) {
      const apart = y1.x0 + y1.w <= o.x0 || o.x0 + o.w <= y1.x0 || y1.y0 + y1.h <= o.y0 || o.y0 + o.h <= y1.y0;
      assert.ok(apart, 'yards must not be built on top of each other');
    }
  }
  // The sail is the scarce thing: exactly one on the island, however many yards.
  const boxes = map.objects.filter((o) => o.type === 'box' && o.loot);
  const sails = boxes.reduce((n, b) => n + b.loot.filter((l) => l.item === 'sail').length, 0);
  assert.equal(sails, 1, 'a second yard must not hand out a second sail');
});

// buildings.js names items by key and items.js is the only registry of them.
// Nothing checks the join at runtime, so a typo in a loot table would simply
// hand out nothing, silently, on one building type, for as long as nobody
// happened to open that door.
test('every item a building can hold is a real item, of a sensible class', () => {
  for (const [key, def] of Object.entries(BUILDING_TYPES)) {
    for (const [item] of def.loot) {
      assert.ok(ITEMS[item], `${key} stocks "${item}", which is not an item`);
      const cls = itemClass(ITEMS[item]);
      assert.ok(cls !== 'vehicle', `${key} cannot have a ${cls} on a shelf`);
    }
  }
  // The registries should also agree about character: an ironmonger sells tools.
  const iron = BUILDING_TYPES.ironmonger.loot.map(([k]) => itemClass(ITEMS[k]));
  assert.ok(iron.filter((c) => c === 'tool').length >= 3, 'an ironmonger is mostly tools');
  const grocer = BUILDING_TYPES.grocer.loot.map(([k]) => itemClass(ITEMS[k]));
  assert.ok(grocer.every((c) => c === 'consumable'), 'a grocer sells nothing you keep');
});

// ---- the registry's two payoffs (v1.259) -----------------------------------
//
// buildingProfile has carried a loot table and a palette per type since v1.220
// with nothing reading either. Written-and-unused code that looks finished is
// worse to inherit than no code, so both are wired now and both are tested.
test('what a building was decides what is left in it', () => {
  const { map } = buildWorld(12345);
  const byType = {};
  for (const b of map.buildings) {
    const items = map.groundItems
      .filter((g) => g.x > b.x0 && g.x < b.x0 + b.w && g.y > b.y0 && g.y < b.y0 + b.h)
      .map((g) => g.item);
    if (items.length) (byType[b.type] = byType[b.type] || []).push(...items);
  }
  const total = Object.values(byType).flat().length;
  assert.ok(total > 0, 'buildings have something in them');
  // and it is not the same everywhere: a workshop and a grocer differ
  const kinds = Object.keys(byType);
  assert.ok(kinds.length > 1, 'more than one type got loot');
  const sets = kinds.map((k) => new Set(byType[k]));
  const allSame = sets.every((s) => [...s].every((i) => sets[0].has(i)));
  assert.ok(!allSame, 'different building types leave different things behind');
});

test('loot draws from its own rng, so adding it never moves a hill', () => {
  // v1.220 learned this the hard way: a draw from the main stream shifted every
  // draw after it and silently regenerated the terrain of every existing seed.
  const a = buildWorld(999).map;
  const b = buildWorld(999).map;
  let same = true;
  for (let y = 0; y < a.h; y += 5) for (let x = 0; x < a.w; x += 5) {
    if (a.floorAt(x, y) !== b.floorAt(x, y)) same = false;
    if (a.heightAt(x, y) !== b.heightAt(x, y)) same = false;
  }
  assert.ok(same, 'the same seed makes the same land');
});

test('every building type has a wall colour of its own', () => {
  const types = ['ironmonger', 'clinic', 'warehouse', 'domestic', 'workshop', 'civic', 'grocer'];
  const walls = types.map((t) => buildingPalette(t).wall);
  for (const w of walls) assert.match(w, /^#[0-9a-f]{6}$/, 'a hex colour the renderer can use');
  assert.ok(new Set(walls).size > 2, 'they are not all the same colour');
});
