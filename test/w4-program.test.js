// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// S2 — the W-4, the first shooter (docs/PLAN.md). The stock
// hunter-killer's doctrine, and that its decisions carry a weapon word the
// update function reads. The fire GATE itself (hold suppresses the shot) is a
// one-liner in updateW4 and is verified in the browser; here we prove the
// decision that feeds it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { W4_PROGRAM } from '../src/game/robots.js';
import { decide } from '../src/game/ai_ml.js';

// The full W-4 sense pack: the common readings plus fire control.
const SENSE = {
  charge: 90, integrity: 100, range: 6, home_range: 3, threat: true, hurt: false,
  linked: true, sight: true, armed: true, shielded: false, contact: false, lost_for: 0,
};

test('the doctrine: flat goes home, whole-and-hurt flees, sighted-and-armed shoots', () => {
  assert.equal(decide(W4_PROGRAM, { ...SENSE, charge: 12 }).intent, 'home');
  assert.deepEqual(pick(decide(W4_PROGRAM, { ...SENSE, hurt: true })), ['flee', null]);
  assert.deepEqual(pick(decide(W4_PROGRAM, SENSE)), ['hunt', 'fire']);
  assert.deepEqual(pick(decide(W4_PROGRAM, { ...SENSE, threat: false })), ['patrol', null]);
});

test('in sight but weapon cooling: it closes, it does not fire', () => {
  // armed false — the [hunt, fire] branch needs it, so this falls to bare hunt.
  const r = decide(W4_PROGRAM, { ...SENSE, armed: false });
  assert.deepEqual(pick(r), ['hunt', null], 'no shot queued while the weapon is cold');
});

test('no line of sight: hunt to open one, no fire word', () => {
  const r = decide(W4_PROGRAM, { ...SENSE, sight: false });
  assert.deepEqual(pick(r), ['hunt', null]);
});

test('the fire word reaches the caller as its own field', () => {
  // updateW4 reads r.fireWish = res.fire; the pair must survive decode.
  const r = decide(W4_PROGRAM, SENSE);
  assert.equal(r.ok, true);
  assert.equal(r.fire, 'fire');
});

function pick(r) { return [r.intent, r.fire ?? null]; }
