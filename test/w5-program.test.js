// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// S6 — the W-5 gardener (docs/robot-ml-rollout-plan.md). Its stock is the
// fitter's works build, g-fit; it reads blight, work and daylight, and never
// fights. A converted guard and a blueboxed hunter both carry this program so
// their pages read true.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { W5_PROGRAM, W3_PROGRAM } from '../src/game/robots.js';
import { decide } from '../src/game/ai_ml.js';

const SENSE = { charge: 90, integrity: 100, range: 10, threat: false, work: true, blight: true, daylight: true };

test('the stock: plant when there is work, wander when the ground is whole, home when flat', () => {
  assert.equal(decide(W5_PROGRAM, SENSE).intent, 'tend');
  assert.equal(decide(W5_PROGRAM, { ...SENSE, work: false }).intent, 'patrol');
  assert.equal(decide(W5_PROGRAM, { ...SENSE, charge: 10 }).intent, 'home');
});

test('the works build is shared g-fit: the choice logic matches the W-3', () => {
  // Same three-line policy, so on the readings they share they choose alike.
  const shared = { charge: 90, work: true };
  assert.equal(decide(W5_PROGRAM, shared).intent, decide(W3_PROGRAM, shared).intent);
});

test('daylight and blight are real sensors a gardener can branch on', () => {
  assert.equal(decide('if daylight then tend else wait', SENSE).intent, 'tend');
  assert.equal(decide('if daylight then tend else wait', { ...SENSE, daylight: false }).intent, 'wait');
  assert.equal(decide('if blight then tend else patrol', SENSE).intent, 'tend');
  assert.equal(decide('if blight then tend else patrol', { ...SENSE, blight: false }).intent, 'patrol');
});

test('a gardener can be told to flee you: threat and flee are usable', () => {
  assert.equal(decide('if threat then flee else tend', { ...SENSE, threat: true }).intent, 'flee');
  assert.equal(decide('if threat then flee else tend', { ...SENSE, threat: false }).intent, 'tend');
});
