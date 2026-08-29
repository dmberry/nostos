// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The malformed build orders. This lived in main.js, where nothing could reach
// it: the boot test imports that module but never runs a frame, so every rule
// below was carried by one uninspected branch. Lifting it into game/gardeners.js
// is what makes these assertions possible at all.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  makeGardenerState, gardenerOrder, gardenerUrgent, calypsoStamp,
  GARDENER_URGENT_EVERY, GARDENER_CARE_EVERY, GARDENER_CAP, GARDENER_BLIGHT_TRIGGER,
} from '../src/game/gardeners.js';
import { W5_PROGRAM } from '../src/game/robots.js';
import { makeVModel } from '../src/game/v-model.js';

// A world where everything is permitted, so each test can deny one thing.
const ok = (over = {}) => ({
  worksLive: true, alarm: false, ended: false,
  blightRunning: true, front: 20, live: 0, ...over,
});

// Run `secs` of game time through the rule a second at a time, collecting orders.
function run(state, secs, world) {
  const got = [];
  for (let i = 0; i < secs; i++) {
    const k = gardenerOrder(state, 1, typeof world === 'function' ? world(i) : world);
    if (k) got.push(k);
  }
  return got;
}

test('she waits before the first order, then keeps the urgent tempo', () => {
  const s = makeGardenerState();
  // starts half-wound, so the first order is due at half the urgent interval
  assert.deepEqual(run(s, Math.floor(GARDENER_URGENT_EVERY / 2) - 1, ok()), []);
  const first = run(s, 2, ok());
  assert.equal(first.length, 1, 'the first order goes in once the wait is up');
  const over = GARDENER_URGENT_EVERY * 3;
  assert.equal(run(makeGardenerState(), over, ok()).length, 3, 'roughly one per interval');
});

test('no blight running means the slow tempo, not silence', () => {
  const quiet = ok({ blightRunning: false });
  assert.equal(gardenerUrgent(false, 99), false, 'a dead link is never urgent');
  // nothing at the urgent interval...
  const s = makeGardenerState();
  assert.deepEqual(run(s, GARDENER_URGENT_EVERY + 5, quiet), [],
    'she does not fire on the quick clock when the ground is not going');
  // ...but she does come round eventually, because the scar still wants working
  const s2 = makeGardenerState();
  assert.equal(run(s2, GARDENER_CARE_EVERY + 5, quiet).length, 1,
    'the island gets kept whether or not anything is currently killing it');
});

test('a front under the trigger is not urgent even with the link up', () => {
  assert.equal(gardenerUrgent(true, GARDENER_BLIGHT_TRIGGER - 0.1), false);
  assert.equal(gardenerUrgent(true, GARDENER_BLIGHT_TRIGGER), true);
  const s = makeGardenerState();
  assert.deepEqual(run(s, GARDENER_URGENT_EVERY + 5, ok({ front: 0 })), [],
    'a tower that has taken no ground yet does not rush her');
});

test('the works must be standing, the alarm down, and the run still going', () => {
  for (const [label, world] of [
    ['a felled factory', ok({ worksLive: false })],
    ['the fortress alarm up', ok({ alarm: true })],
    ['the run over', ok({ ended: true })],
  ]) {
    const s = makeGardenerState();
    assert.deepEqual(run(s, GARDENER_URGENT_EVERY * 3, world), [], label);
  }
});

test('felling the works closes the fault for good, but a repair is answered at once', () => {
  const s = makeGardenerState();
  // she waits out the whole interval with the line down
  assert.deepEqual(run(s, GARDENER_URGENT_EVERY * 2, ok({ worksLive: false })), []);
  // the moment it can answer, it does — the wait was served while she waited
  const back = run(s, 1, ok());
  assert.equal(back.length, 1, 'no second full wait once the works can answer');
});

test('the cap holds, and a freed slot is filled without another full wait', () => {
  const s = makeGardenerState();
  assert.deepEqual(run(s, GARDENER_URGENT_EVERY * 3, ok({ live: GARDENER_CAP })), [],
    'she will not silt the island up with gardeners');
  assert.deepEqual(run(s, 1, ok({ live: GARDENER_CAP - 1 })), ['w5'],
    'one dies, one is ordered');
});

test('she alternates the two chassis the fault will accept', () => {
  const s = makeGardenerState();
  const got = run(s, GARDENER_URGENT_EVERY * 6, ok());
  assert.ok(got.length >= 4, 'enough orders to see the pattern');
  assert.deepEqual(got.slice(0, 4), ['w5', 'v5', 'w5', 'v5'],
    'a readable one, then an opaque one, then a readable one');
});

test('the stamp replaces the press header and leaves the program running', () => {
  const w = calypsoStamp(W5_PROGRAM, 'w5');
  assert.match(w, /— CALYPSO/, 'she signs it');
  assert.doesNotMatch(w, /TIRESIAS-works/, 'the foundry header is gone');
  for (const line of ['if charge < 15 then home', 'else if work then tend', 'else patrol']) {
    assert.ok(w.includes(line), `the code survives: ${line}`);
  }
});

test('the V-5 stamp keeps the legend her own header points at', () => {
  const v = calypsoStamp(makeVModel(7, 'V5_07'), 'v5');
  assert.match(v, /— CALYPSO/);
  assert.doesNotMatch(v, /grown at the foundry/, 'not a foundry press any more');
  assert.match(v, /\(\* in: /, 'the input legend survives');
  assert.match(v, /\(\* out: /, 'the output legend survives');
  assert.ok(v.includes('let relu = fn x =>'), 'the weights and the forward pass are untouched');
  // and the rows themselves are not disturbed
  assert.equal(v.split('\n').filter((l) => /^\s*\[[~\d]/.test(l)).length,
    makeVModel(7, 'V5_07').split('\n').filter((l) => /^\s*\[[~\d]/.test(l)).length,
    'every weight row still there');
});

test('an empty program is left alone rather than given a header', () => {
  assert.equal(calypsoStamp('', 'w5'), '');
  assert.equal(calypsoStamp(null, 'v5'), null);
});
