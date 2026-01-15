// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

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


// ---- WHAT A THING IS FOR (task #91) ---------------------------------------
//
// Hovering a HUD slot named the item and stopped. "Blue box" tells a player who
// has never met one exactly nothing, and the opaque devices are the ones worth
// carrying — a bluebox, a spoofer, a Wi-Fi block, three ship parts that have
// already been thrown away once for looking like junk.
//
// `use` sits beside `name` in the definition and is optional, so it falls back
// to the bare name where it is absent rather than needing to be filled in
// everywhere at once.
import { ITEMS as ITEM_DEFS } from '../src/game/items.js';
import { BOOKS as BOOK_VOLUMES } from '../src/game/books.js';

test('the opaque items say what they are for', () => {
  // The list David named, plus the cards. These are the ones a player meets
  // with no idea what to do; anything else can be filled in later.
  const MUST = ['bluebox', 'ob_spoofer', 'wifiblock', 'forcefield', 'mirror_shield', 'compass',
    'goggles', 'grass_seed', 'moly', 'bronze_axe', 'oar', 'rope', 'sail', 'chip',
    'chip_fragment', 'circuit', 'ai_key', 'trojan_key', 'hermes_card'];
  const silent = MUST.filter((k) => !(ITEM_DEFS[k] && ITEM_DEFS[k].use));
  assert.deepEqual(silent, [], `these still only give their name: ${silent.join(', ')}`);
});

test('a use line is a line, not an essay', () => {
  // The tooltip is drawn on the canvas and wraps at 260px, so a long one turns
  // into a paragraph floating over the game. Two clauses is the brief.
  const tooLong = Object.entries(ITEM_DEFS)
    .filter(([, d]) => d.use && d.use.length > 180)
    .map(([k, d]) => `${k} (${d.use.length})`);
  assert.deepEqual(tooLong, [], `use lines over 180 characters: ${tooLong.join(', ')}`);
  for (const [k, d] of Object.entries(ITEM_DEFS)) {
    if (!d.use) continue;
    assert.equal(d.use, d.use.trim(), `${k}'s use line has loose whitespace`);
    assert.match(d.use, /[.!?]$/, `${k}'s use line does not end in a full stop`);
    assert.ok(!d.use.includes('\n'), `${k}'s use line has a newline in it; the tooltip wraps for you`);
  }
});

test('a use line never just repeats the name', () => {
  for (const [k, d] of Object.entries(ITEM_DEFS)) {
    if (!d.use) continue;
    assert.notEqual(d.use.toLowerCase().replace(/\.$/, ''), String(d.name).toLowerCase(),
      `${k}'s use line says nothing the name did not`);
  }
});


// ---- THE LIBRARY IS PHYSICAL ------------------------------------------------
//
// The shelf is which books you picked up and read. The laptop is a separate
// thing holding digital copies, read in Netscape, and the two are not the same
// library — what connects them is that some of the paperbacks are books whose
// whole text also exists as a file, so finding the physical copy lets you read
// all of it.

test('every book carries a page worth reading', () => {
  // The Library was showing a byline and a hundred-character abstract, which is
  // a catalogue entry. A page is what the reader is for.
  const books = Object.entries(ITEM_DEFS).filter(([, d]) => d.kind === 'book' || d.kind === 'paperbook');
  assert.ok(books.length >= 28, `only ${books.length} book items`);
  const thin = books
    .filter(([, d]) => !d.manual && !d.toNotepad)
    .filter(([, d]) => !d.notepadText || d.notepadText.length < 300)
    .map(([k]) => k);
  assert.deepEqual(thin, [], `these have no page, or a stub: ${thin.join(', ')}`);
});

test('a page is paragraphs, not one block', () => {
  // The Library splits on blank lines to set a drop cap on the first paragraph.
  // One unbroken block gets a drop cap on the whole page.
  for (const [k, d] of Object.entries(ITEM_DEFS)) {
    if (!d.notepadText || d.kind === 'book' && d.manual) continue;
    if (d.kind !== 'book' && d.kind !== 'paperbook') continue;
    assert.ok(d.notepadText.split(/\n{2,}/).length >= 2, `${k}'s page is a single block`);
  }
});

test('a paperback teaches no skill, and must not pretend to', () => {
  // learnFromBook's else-branch used to add `undefined` to the skills set and
  // push {skill: undefined} into the skill log — both saved, both drawn by the
  // Record panel. 28 paperbacks now reach that branch from a click.
  for (const [k, d] of Object.entries(ITEM_DEFS)) {
    if (d.kind !== 'paperbook') continue;
    assert.equal(d.skill, undefined, `${k} claims a skill`);
    assert.ok(d.notepadText, `${k} has no page to show instead`);
  }
});

test('a book naming a whole text names one that exists', () => {
  // `full` points at a books.js key. A typo there is a Library entry offering
  // to open a book that is not there.
  const keys = new Set(BOOK_VOLUMES.map((b) => b.key));
  for (const [k, d] of Object.entries(ITEM_DEFS)) {
    if (!d.full) continue;
    assert.ok(keys.has(d.full), `${k} points at "${d.full}", which is not in books.js`);
  }
});

test('every whole text is reachable by finding a physical book', () => {
  // The laptop is the digital library and is not this one. If a volume has no
  // paperback, the only way to it is the machine — which is the confusion this
  // was built to avoid.
  const linked = new Set(Object.values(ITEM_DEFS).map((d) => d.full).filter(Boolean));
  const orphans = BOOK_VOLUMES.map((b) => b.key).filter((k) => !linked.has(k));
  assert.deepEqual(orphans, [], `no paperback leads to: ${orphans.join(', ')}`);
});

test('the readable kinds are exactly the ones the click gate accepts', () => {
  // A CANARY, because the gate itself lives in main.js and no test can import
  // it. `bookInSlot` accepts kind 'book', kind 'paperbook' and anything with
  // toNotepad; a readable item outside that set falls through to the drag path
  // and answers "Can't hold <title> in hand", which is what shipped for all 28
  // paperbacks. If this list grows, widen the gate in the same change.
  const readable = new Set(Object.values(ITEM_DEFS)
    .filter((d) => d.notepadText || d.toNotepad || d.skill)
    .map((d) => d.kind));
  assert.deepEqual([...readable].sort(), ['book', 'paperbook'],
    'a readable kind the click gate does not know about');
});
