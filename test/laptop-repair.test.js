// The dead NostBook is the one item whose entire purpose is a recipe you cannot
// see: you start the game holding it, and nothing in the world tells you that it
// wants two cells and two chip fragments. Tapping it used to move it silently to
// your hand. Now it answers, and these tests pin what it says — including the
// plural, because "2 more batterys" is the kind of small wrongness that makes a
// game read as unfinished.
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
  assert.match(p.said[0], /2 more batteries/, 'batteries, not batterys');
  assert.match(p.said[0], /2 more chip fragments/);
  assert.match(p.said[0], /\bC\b/, 'and which key does the soldering');
  // It must NOT quietly move to the hand instead, which is what it did before.
  assert.equal(p.hands, null);
  assert.deepEqual(p.pockets[0], { item: 'laptop_broken', qty: 1 });
});

test('the count is what is SHORT, not what the recipe costs', () => {
  const p = stub({ pockets: [{ item: 'laptop_broken', qty: 1 }, { item: 'battery', qty: 1 }, null, null] });
  p.equipSlot({ kind: 'pocket', i: 0 });
  assert.match(p.said[0], /1 more battery\b/, 'singular, and one, not two');
  assert.doesNotMatch(p.said[0], /batteries/);
});

test('with the parts in the pack it stops listing and names the key', () => {
  const p = stub({
    pockets: [{ item: 'laptop_broken', qty: 1 }, { item: 'battery', qty: 2 }, { item: 'chip_fragment', qty: 2 }, null],
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
