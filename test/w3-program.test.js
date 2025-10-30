// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// S5 — the `work` sensor and the W-3 fitter (docs/robot-ml-rollout-plan.md).
// A fitter mends when there is work and it has charge; parked on `wait` it
// stops mending, which is the sabotage the class exists for.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { W3_PROGRAM } from '../src/game/robots.js';
import { decide } from '../src/game/ai_ml.js';

const SENSE = { charge: 90, integrity: 100, range: 20, home_range: 3, linked: true, work: true };

test('the stock: tend when there is work, patrol when the island is whole, home when flat', () => {
  assert.equal(decide(W3_PROGRAM, SENSE).intent, 'tend');
  assert.equal(decide(W3_PROGRAM, { ...SENSE, work: false }).intent, 'patrol');
  assert.equal(decide(W3_PROGRAM, { ...SENSE, charge: 10 }).intent, 'home');
});

test('`work` is a real sensor a program can branch on', () => {
  assert.equal(decide('if work then tend else wait', SENSE).intent, 'tend');
  assert.equal(decide('if work then tend else wait', { ...SENSE, work: false }).intent, 'wait');
});

test('a fitter can be told to down tools: wait is in its repertoire, tend is the trade', () => {
  assert.equal(decide('wait', SENSE).intent, 'wait');
  assert.equal(decide('tend', SENSE).intent, 'tend');
  // hunt is not a fitter intent — it has no fist. botThink rejects it on the
  // chassis CAN list; decide itself only checks the word is a known intent.
  assert.equal(decide('hunt', SENSE).intent, 'hunt');
});
