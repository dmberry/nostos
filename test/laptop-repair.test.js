// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The dead NostBook is the one item whose entire purpose is a recipe you cannot
// see: you start the game holding it, and nothing in the world tells you that it
// wants a cell and a chip fragment. Tapping it used to move it silently to your
// hand. Now it answers, and these tests pin what it says — including the plural
// rule, because "2 more batterys" is the kind of small wrongness that makes a
// game read as unfinished. The recipe was halved at v1.336: the NostBook is
// where you LEARN the language, so a shopping list in front of it keeps players
// away from the thing the game most wants them to find.
//
// Drives the real Player.prototype methods over a stub `this` (as card-swap and
// boat do), so there is no canvas and no world.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Player } from '../src/game/player.js';

function stub(overrides = {}) {
  const said = [];
  return {
    said,
    hands: null,
    pockets: [{ item: 'laptop_broken', qty: 1 }, null, null, null],
    backpack: null,
    laptop: null,
    say: (m) => said.push(m),
    countItem: Player.prototype.countItem,
    getSlot: Player.prototype.getSlot,
    setSlot: Player.prototype.setSlot,
    hasItem: Player.prototype.hasItem,
    laptopRepairShort: Player.prototype.laptopRepairShort,
    canRepairLaptop: Player.prototype.canRepairLaptop,
    equipSlot: Player.prototype.equipSlot,
    ...overrides,
  };
}

test('tapping the dead NostBook says exactly what its board still wants', () => {
  const p = stub();
  p.equipSlot({ kind: 'pocket', i: 0 });
  assert.equal(p.said.length, 1);
  assert.match(p.said[0], /1 more battery\b/);
  assert.match(p.said[0], /1 more chip fragment\b/);
  assert.match(p.said[0], /\bC\b/, 'and which key does the soldering');
  // It must NOT quietly move to the hand instead, which is what it did before.
  assert.equal(p.hands, null);
  assert.deepEqual(p.pockets[0], { item: 'laptop_broken', qty: 1 });
});

test('the count is what is SHORT, not what the recipe costs', () => {
  // Holding the battery already, so only the fragment is named — and the
  // pluralisation still has to be right, which is what a count of one tests.
  const p = stub({ pockets: [{ item: 'laptop_broken', qty: 1 }, { item: 'battery', qty: 1 }, null, null] });
  p.equipSlot({ kind: 'pocket', i: 0 });
  assert.match(p.said[0], /1 more chip fragment\b/, 'singular, and only what is missing');
  assert.doesNotMatch(p.said[0], /battery|batteries/, 'the battery is in hand, so it is not asked for');
});

test('with the parts in the pack it stops listing and names the key', () => {
  const p = stub({
    pockets: [{ item: 'laptop_broken', qty: 1 }, { item: 'battery', qty: 1 }, { item: 'chip_fragment', qty: 1 }, null],
  });
  assert.equal(p.canRepairLaptop(), true);
  p.equipSlot({ kind: 'pocket', i: 0 });
  assert.match(p.said[0], /Press C/);
  assert.doesNotMatch(p.said[0], /more/);
});

test('a spare dead machine, once you already have a working one, is spares', () => {
  const p = stub({ laptop: { model: 'laptop' } });
  p.equipSlot({ kind: 'pocket', i: 0 });
  assert.match(p.said[0], /already carry a working NostBook/);
  assert.equal(p.canRepairLaptop(), false, 'and it cannot be built twice');
});

// ---- THE CRADLE -----------------------------------------------------------
//
// The laptop slot was display-and-click only. A NostBook picked up off the
// ground went into a pocket, where the only thing you can do with an item is
// hold it, and a laptop cannot be held — so it answered "can't hold nostbook in
// hand" and there was no way to get it into the one slot made for it.

test('a working NostBook goes into the cradle, by drag and by pickup', () => {
  const p = stub();
  p.laptop = null;
  assert.equal(p.getSlot({ kind: 'laptop' }), null, 'empty to start');
  assert.equal(p.setSlot({ kind: 'laptop' }, { item: 'laptop', qty: 1 }), true);
  assert.ok(p.laptop, 'the machine is in the cradle');
  const held = p.getSlot({ kind: 'laptop' });
  assert.equal(held.item, 'laptop');
  assert.ok(held.machine, 'the slot carries the machine, not just its name');
});

test('the disk rides with the machine, out of the cradle and back', () => {
  // A drag that dropped the filesystem would be a theft: everything the player
  // has written is on it.
  const p = stub();
  p.setSlot({ kind: 'laptop' }, { item: 'laptop', qty: 1 });
  p.laptop.fs = { d: { home: { d: { 'notes.txt': { f: 'mine' } } } } };
  const out = p.getSlot({ kind: 'laptop' });
  p.setSlot({ kind: 'laptop' }, null);
  assert.equal(p.laptop, null);
  p.setSlot({ kind: 'laptop' }, out);
  assert.equal(p.laptop.fs.d.home.d['notes.txt'].f, 'mine', 'the disk came back');
});

test('a burnt board is not a machine and the cradle refuses it', () => {
  // Refusing is what tells moveItem to leave it where it was. Accepting it
  // would put an unusable object in the one slot that opens the shell.
  const p = stub();
  p.laptop = null;
  assert.equal(p.setSlot({ kind: 'laptop' }, { item: 'laptop_broken', qty: 1 }), false);
  assert.equal(p.setSlot({ kind: 'laptop' }, { item: 'dead_laptop', qty: 1 }), false);
  assert.equal(p.setSlot({ kind: 'laptop' }, { item: 'tin', qty: 1 }), false);
  assert.equal(p.laptop, null, 'nothing got in');
});
