// Unit tests for the Scylla/Charybdis strait (src/game/strait.js). Pure rules, so
// no canvas and no map — the same deal as crossing.test.js.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isStraitCrossing, snatchable, scyllaToll, charybdisRoll,
  UNSNATCHABLE, SCYLLA_TAKE, CHARYBDIS_SWALLOW_CHANCE, STRAIT_COST,
} from '../src/game/strait.js';

// A pack in the Player's own shape.
const packOf = (pockets, bpslots) => ({
  pockets: pockets.map((k) => (k ? { item: k, qty: 1 } : null)),
  backpack: { slots: (bpslots || []).map((k) => (k ? { item: k, qty: 1 } : null)) },
});

test('the narrows are a place, not a direction: either way through counts', () => {
  assert.equal(isStraitCrossing('circe', 'helios'), true);
  assert.equal(isStraitCrossing('helios', 'circe'), true, 'sailing back passes it too');
});

test('every other crossing is open water', () => {
  for (const [a, b] of [
    ['calypso', 'polyphemus'], ['calypso', 'circe'], ['calypso', 'helios'],
    ['polyphemus', 'circe'], ['polyphemus', 'helios'], ['ithaca', 'helios'],
    ['circe', 'ithaca'], ['backspace', 'helios'],
  ]) {
    assert.equal(isStraitCrossing(a, b), false, `${a}->${b} must not pass the strait`);
  }
  assert.equal(isStraitCrossing('circe', 'circe'), false, 'not a crossing at all');
  assert.equal(isStraitCrossing(null, 'helios'), false);
});

test('SOFT-LOCK GUARD: Scylla can never take the AI card in any of its three states', () => {
  // The card is the game's only exit. If she could take the hermes card there is no
  // reprint for it, and the run would be quietly unwinnable.
  for (const card of ['ai_key', 'trojan_key', 'hermes_card']) {
    const pack = packOf([card], [card]);
    assert.deepEqual(snatchable(pack), [], `${card} must be out of her reach`);
    // ...and however the dice fall, she comes away with nothing.
    for (let seed = 0; seed < 20; seed++) {
      assert.deepEqual(scyllaToll(pack, () => seed / 20), [], `${card} survives the toll`);
    }
  }
  assert.ok(['ai_key', 'trojan_key', 'hermes_card'].every((k) => UNSNATCHABLE.has(k)));
});

test('what is in your hands is not hers: only pockets and pack storage are reachable', () => {
  const pack = packOf(['rope', 'apple'], ['axe']);
  pack.hands = 'spear';                       // gripped, and never offered
  pack.backpack.weapon = 'rifle';             // slung, not stowed on deck
  const reach = snatchable(pack);
  assert.deepEqual(reach, [
    { kind: 'pocket', i: 0 }, { kind: 'pocket', i: 1 }, { kind: 'bpstore', i: 0 },
  ]);
});

test('she takes three stacks, never the same one twice', () => {
  const pack = packOf(['a', 'b', 'c', 'd'], ['e', 'f']);
  const toll = scyllaToll(pack, () => 0.5);
  assert.equal(toll.length, SCYLLA_TAKE);
  const keys = toll.map((s) => `${s.kind}:${s.i}`);
  assert.equal(new Set(keys).size, toll.length, 'no slot is taken twice');
});

test('a thin pack gives her less, and a bare one gives her nothing', () => {
  assert.equal(scyllaToll(packOf(['only'], []), () => 0.5).length, 1);
  assert.deepEqual(scyllaToll(packOf([], []), () => 0.5), [], 'nothing to lose');
  assert.deepEqual(scyllaToll(packOf([null, null], [null]), () => 0.5), []);
});

test('Charybdis is a real gamble: mostly through, sometimes swallowed', () => {
  assert.equal(charybdisRoll(() => 0), 'swallowed', 'the bad end exists');
  assert.equal(charybdisRoll(() => 0.99), 'mauled', 'and is not certain');
  // The roll sits either side of the stated chance, so the odds are the odds.
  assert.equal(charybdisRoll(() => CHARYBDIS_SWALLOW_CHANCE - 0.01), 'swallowed');
  assert.equal(charybdisRoll(() => CHARYBDIS_SWALLOW_CHANCE + 0.01), 'mauled');
  assert.ok(CHARYBDIS_SWALLOW_CHANCE > 0 && CHARYBDIS_SWALLOW_CHANCE < 1);
});

test('the bargain holds: the certain toll costs less than either end of the gamble', () => {
  // If Scylla ever cost more than Charybdis, no one would take the certain loss and
  // the choice would collapse into a single right answer.
  assert.ok(STRAIT_COST.scylla.hull < STRAIT_COST.mauled.hull);
  assert.ok(STRAIT_COST.scylla.hurt < STRAIT_COST.mauled.hurt);
  assert.ok(STRAIT_COST.mauled.hull < STRAIT_COST.swallowed.hull);
  assert.ok(STRAIT_COST.mauled.hurt < STRAIT_COST.swallowed.hurt);
});
