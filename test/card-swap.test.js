// Regression: refunctioning the AI card (ai_key -> trojan_key -> hermes_card,
// the Calypso escape chain) must be an IN-PLACE swap. The first cut used
// remove-then-restow, which failed — and could LOSE the card — when the key was
// held in hand or the pack was full ("ERR: no room to refunction the card",
// hit in playtest). Player.swapItem keeps the card in its exact slot/hand.
//
// Drives the real Player.prototype method over a stub `this` (as boat.test.js
// does), so no canvas/sprites. Zero deps: `node --test test/`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Player } from '../src/game/player.js';

function stub(overrides = {}) {
  return {
    hands: null,
    pockets: [null, null, null, null],
    backpack: null,
    stow: Player.prototype.stow,
    _fillSlots: Player.prototype._fillSlots,
    hasItem: Player.prototype.hasItem,
    swapItem: Player.prototype.swapItem,
    ...overrides,
  };
}

test('swapItem: card IN HAND with pockets full — swaps in place, nothing lost', () => {
  const p = stub({
    hands: 'ai_key',
    pockets: [{ item: 'scrap', qty: 1 }, { item: 'scrap', qty: 1 }, { item: 'scrap', qty: 1 }, { item: 'scrap', qty: 1 }],
  });
  assert.equal(p.swapItem('ai_key', 'trojan_key'), true);
  assert.equal(p.hands, 'trojan_key');
  assert.ok(p.pockets.every((s) => s && s.item === 'scrap')); // pockets untouched
  assert.equal(p.hasItem('ai_key'), false);
  assert.equal(p.hasItem('trojan_key'), true);
});

test('swapItem: card in a POCKET — swaps that slot in place', () => {
  const p = stub({ pockets: [{ item: 'ai_key', qty: 1 }, { item: 'scrap', qty: 1 }, null, null] });
  assert.equal(p.swapItem('ai_key', 'trojan_key'), true);
  assert.deepEqual(p.pockets[0], { item: 'trojan_key', qty: 1 });
});

test('swapItem: card in the backpack weapon slot — swaps in place', () => {
  const p = stub({ backpack: { weapon: 'trojan_key', slots: new Array(16).fill(null) } });
  assert.equal(p.swapItem('trojan_key', 'hermes_card'), true);
  assert.equal(p.backpack.weapon, 'hermes_card');
});

test('swapItem: a stacked qty>1 key decrements and stows the new card', () => {
  const p = stub({ pockets: [{ item: 'ai_key', qty: 2 }, null, null, null] });
  assert.equal(p.swapItem('ai_key', 'trojan_key'), true);
  assert.equal(p.pockets[0].qty, 1); // one ai_key remains
  assert.ok(p.pockets.some((s) => s && s.item === 'trojan_key'));
});

test('swapItem: fromKey not held -> false, no change', () => {
  const p = stub({ pockets: [{ item: 'scrap', qty: 1 }, null, null, null] });
  assert.equal(p.swapItem('ai_key', 'trojan_key'), false);
  assert.deepEqual(p.pockets[0], { item: 'scrap', qty: 1 });
});
