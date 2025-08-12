// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ARMOUR_SLOTS, MAX_REDUCTION, PER_POINT, ARMOUR_TIERS, armourKey,
  armourPoints, armourReduction, armourTint, takeHit,
  slotOf, shouldWear, durFraction, freshPiece,
} from '../src/game/armour.js';
import { ITEMS } from '../src/game/items.js';

const DEFS = {
  helm:  { kind: 'armour', slot: 'head',  armour: 2, maxDur: 10 },
  chest: { kind: 'armour', slot: 'chest', armour: 4, maxDur: 10 },
  legs:  { kind: 'armour', slot: 'legs',  armour: 3, maxDur: 10 },
  boots: { kind: 'armour', slot: 'feet',  armour: 1, maxDur: 10 },
  cap:   { kind: 'armour', slot: 'head',  armour: 1, maxDur: 10 },
  tin:   { kind: 'food' },
};
const defOf = (k) => DEFS[k];
const full = () => ({
  head: freshPiece('helm', defOf), chest: freshPiece('chest', defOf),
  legs: freshPiece('legs', defOf), feet: freshPiece('boots', defOf),
});

test('points ADD, and the reduction is the sum times the rate', () => {
  assert.equal(armourPoints(full(), defOf), 10);
  assert.equal(armourReduction(full(), defOf), 10 * PER_POINT);
  // Any one piece is worth the same wherever it goes, which is the whole of
  // what additive means and the thing a player has to be able to rely on.
  const justChest = { chest: freshPiece('chest', defOf) };
  const noChest = { head: freshPiece('helm', defOf), legs: freshPiece('legs', defOf), feet: freshPiece('boots', defOf) };
  assert.equal(armourPoints(justChest, defOf) + armourPoints(noChest, defOf), armourPoints(full(), defOf));
});

test('nothing worn turns nothing, and no set turns everything', () => {
  assert.equal(armourReduction(null, defOf), 0);
  assert.equal(armourReduction({}, defOf), 0);
  const huge = { chest: { item: 'chest', dur: 5 } };
  DEFS.chest.armour = 999;
  assert.equal(armourReduction(huge, defOf), MAX_REDUCTION, 'capped, or a set makes you immortal');
  DEFS.chest.armour = 4;
});

test('every hit wears every piece, and a broken piece stops protecting', () => {
  const worn = full();
  for (let i = 0; i < 9; i++) takeHit(worn, defOf);
  assert.equal(armourPoints(worn, defOf), 10, 'still whole at 1 durability each');
  const { reduction, broke } = takeHit(worn, defOf);
  assert.equal(reduction, 10 * PER_POINT, 'the plate that stopped the blow was whole when it landed');
  assert.deepEqual(broke.sort(), ['boots', 'chest', 'helm', 'legs']);
  assert.equal(armourReduction(worn, defOf), 0, 'and now there is nothing left');
  for (const slot of ARMOUR_SLOTS) assert.equal(worn[slot], null);
});

test('picking up better armour wears it; picking up worse does not', () => {
  const worn = full();
  assert.equal(shouldWear(worn, DEFS.cap, defOf), false, 'a cap does not replace a helm');
  assert.equal(shouldWear({}, DEFS.cap, defOf), true, 'but an empty head takes anything');
  assert.equal(shouldWear({ head: { item: 'cap', dur: 4 } }, DEFS.helm, defOf), true);
  assert.equal(shouldWear(worn, DEFS.tin, defOf), false, 'a tin is not armour');
});

test('a slot only takes the piece made for it', () => {
  assert.equal(slotOf(DEFS.helm), 'head');
  assert.equal(slotOf(DEFS.tin), null);
  assert.equal(slotOf({ kind: 'armour', slot: 'hat' }), null, 'an unknown slot is no slot');
  assert.equal(slotOf(null), null);
});

test('the durability bar reads 1 at full and 0 at broken', () => {
  assert.equal(durFraction(freshPiece('helm', defOf), defOf), 1);
  assert.equal(durFraction({ item: 'helm', dur: 5 }, defOf), 0.5);
  assert.equal(durFraction({ item: 'helm', dur: 0 }, defOf), 0);
  assert.equal(durFraction(null, defOf), 0);
});

// ---- the real table -------------------------------------------------------

test('every armour item in ITEMS has a slot, points and a durability', () => {
  // A piece missing maxDur would be worn once and break on the first hit; a
  // piece missing `slot` could never be worn at all, and neither would error.
  const pieces = Object.entries(ITEMS).filter(([, d]) => d.kind === 'armour');
  assert.ok(pieces.length >= 4, 'the four slots need filling');
  const seen = new Set();
  for (const [key, def] of pieces) {
    assert.ok(ARMOUR_SLOTS.includes(def.slot), `${key} has slot "${def.slot}"`);
    assert.ok(def.armour > 0, `${key} protects nothing`);
    assert.ok(def.maxDur > 0, `${key} would break on the first hit`);
    seen.add(def.slot);
  }
  assert.deepEqual([...seen].sort(), [...ARMOUR_SLOTS].sort(), 'every slot has something to put in it');
});

test('the tiers ascend, and no set reaches the cap', () => {
  // The cap exists so a future heavier class cannot reach immortality. If a
  // tier that ships today hits it, two tiers have quietly become the same tier.
  const realOf = (k) => ITEMS[k];
  const setOf = (t) => Object.fromEntries(ARMOUR_SLOTS.map((s) =>
    [s, freshPiece(armourKey(t, s), realOf)]));
  const pts = ARMOUR_TIERS.map((t) => armourPoints(setOf(t.key), realOf));
  for (let i = 1; i < pts.length; i++) {
    assert.ok(pts[i] > pts[i - 1], `tier ${ARMOUR_TIERS[i].key} is not stronger than ${ARMOUR_TIERS[i - 1].key}`);
  }
  for (const t of ARMOUR_TIERS) {
    assert.ok(armourReduction(setOf(t.key), realOf) < MAX_REDUCTION,
      `a full set of ${t.key} is at the cap, so the tier above it cannot be better`);
  }
});

test('every tier is coloured like the machines it came off', () => {
  // A piece on the ground has to read as "that is off a W" before you are
  // close enough for the name, so the colour is the tier's and not a default.
  const seen = new Set();
  for (const t of ARMOUR_TIERS) {
    for (const s of ARMOUR_SLOTS) {
      const def = ITEMS[armourKey(t.key, s)];
      assert.ok(def, `${armourKey(t.key, s)} is missing from ITEMS`);
      assert.equal(def.color, t.colour, `${armourKey(t.key, s)} is not its tier's colour`);
    }
    assert.ok(!seen.has(t.colour), `two tiers share the colour ${t.colour}`);
    seen.add(t.colour);
  }
});

test('the sprite tint climbs with the set and takes the heaviest colour', () => {
  const realOf = (k) => ITEMS[k];
  const setOf = (t) => Object.fromEntries(ARMOUR_SLOTS.map((s) => [s, freshPiece(armourKey(t, s), realOf)]));
  assert.equal(armourTint(null, realOf), null, 'bare is bare');
  assert.equal(armourTint({}, realOf), null);
  let last = 0;
  for (const t of ARMOUR_TIERS) {
    const tint = armourTint(setOf(t.key), realOf);
    assert.equal(tint.colour, t.colour, 'the tint is the heaviest piece worn, and a set is all one tier');
    assert.ok(tint.strength > last, `${t.key} does not read heavier than the tier under it`);
    assert.ok(tint.strength <= 0.55, 'a tint that strong stops being a person');
    last = tint.strength;
  }
});

test('a broken piece stops tinting as well as stops protecting', () => {
  const realOf = (k) => ITEMS[k];
  const worn = { chest: { item: armourKey('x', 'chest'), dur: 0 } };
  assert.equal(armourTint(worn, realOf), null, 'plate at zero is gone, not just inert');
});
