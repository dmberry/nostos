// Item classes (src/game/item-classes.js): the "what is this FOR" axis over
// items.js, added because `kind` was doing three jobs at once and `resource`
// alone held food, ammunition, timber and torches.
//
// These tests pin the contract before anything consumes it, so the features it
// was built for (inventory filtering, what a building type stocks, what a
// machine will trade) cannot each invent their own answer.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../src/game/items.js';
import {
  ITEM_CLASSES, CRAFT_INPUTS, itemClass, itemsOfClass,
  isConsumable, isDevice, isMaterial, isCraftInput,
} from '../src/game/item-classes.js';

test('every item in the game gets exactly one declared class', () => {
  const names = Object.keys(ITEM_CLASSES);
  for (const [key, def] of Object.entries(ITEMS)) {
    const cls = itemClass(def);
    assert.ok(names.includes(cls), `${key} classed as "${cls}", which is not a declared class`);
  }
});

test('a missing or unknown item is stock, never a crash', () => {
  assert.equal(itemClass(undefined), 'material');
  assert.equal(itemClass({ key: 'sporran', kind: 'sporran' }), 'material');
});

test('food is a consumable however items.js happens to file it', () => {
  // These four live under kind:'resource' with timber and scrap, which is the
  // exact confusion this axis exists to fix.
  for (const k of ['meat', 'tin', 'berries', 'lotus_fruit']) {
    assert.equal(ITEMS[k].kind, 'resource', `${k} is still filed as a resource`);
    assert.equal(itemClass(ITEMS[k]), 'consumable', `${k} feeds you and is used up`);
  }
  // And the rule is derived, not listed: a new food needs no entry anywhere.
  assert.equal(itemClass({ key: 'quince', kind: 'resource', food: 12 }), 'consumable');
});

test('the classes carve the item set up, and each holds what you would expect', () => {
  const seen = new Set();
  for (const cls of Object.keys(ITEM_CLASSES)) {
    const items = itemsOfClass(ITEMS, cls);
    assert.ok(items.length, `${cls} has at least one item`);
    for (const k of items) {
      assert.ok(!seen.has(k), `${k} is in two classes`);
      seen.add(k);
    }
  }
  assert.equal(seen.size, Object.keys(ITEMS).length, 'every item is classed exactly once');

  const has = (cls, k) => assert.ok(itemsOfClass(ITEMS, cls).includes(k), `${k} should be a ${cls}`);
  has('tool', 'screwdriver');
  has('tool', 'crowbar');
  has('weapon', 'shotgun');
  has('weapon', 'bow');
  has('device', 'laptop');
  has('device', 'nokia_3310');
  has('device', 'bluebox');
  has('consumable', 'battery');
  has('consumable', 'bomb_small');
  has('material', 'wood');
  has('material', 'circuit');
  has('material', 'sail');       // a ship part is stock for the ship
  has('media', 'book_ronml');
  has('media', 'tape_1');
  has('key', 'ai_key');
  has('key', 'chip');
  has('wearable', 'backpack');
  has('wearable', 'shield');
  has('vehicle', 'greek_ship');
});

test('the guards agree with the classifier', () => {
  assert.ok(isConsumable(ITEMS.berries));
  assert.ok(isDevice(ITEMS.laptop));
  assert.ok(isMaterial(ITEMS.wood));
  assert.ok(!isConsumable(ITEMS.crowbar));
  assert.ok(!isDevice(ITEMS.wood));
});

test('every craft input is a real item, and none of them is a tool or a weapon', () => {
  for (const k of CRAFT_INPUTS) {
    assert.ok(ITEMS[k], `${k} is a real item`);
    const cls = itemClass(ITEMS[k]);
    assert.ok(cls === 'material' || cls === 'consumable',
      `${k} is a ${cls}; a recipe input should be stock or spent, not something you keep`);
    assert.ok(isCraftInput(k));
  }
  assert.ok(!isCraftInput('crowbar'), 'you do not melt a crowbar down');
});
