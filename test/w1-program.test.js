// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// S4 — the W-1 revenge squad (docs/PLAN.md). Melee, no fire
// control: a [feet, weapon] pair must fault. The stock only chooses to keep
// hunting or break off; the wave rhythm is the chassis.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { W1_PROGRAM } from '../src/game/robots.js';
import { decide } from '../src/game/ai_ml.js';

const SENSE = { charge: 90, integrity: 100, range: 5, home_range: 20, threat: true, hurt: false };

test('the stock: hunt while charged and threatened, home on a flat cell', () => {
  assert.equal(decide(W1_PROGRAM, SENSE).intent, 'hunt');
  assert.equal(decide(W1_PROGRAM, { ...SENSE, charge: 10 }).intent, 'home');
  assert.equal(decide(W1_PROGRAM, { ...SENSE, threat: false }).intent, 'patrol');
});

test('a W-1 has no weapon word: a fire pair is a decode-level fault', () => {
  // decide accepts the pair syntactically, but a W-1 chassis (fire: false)
  // rejects it in botThink. The pair still parses to a fire word here, which
  // is what the chassis gate keys on.
  const r = decide('[hunt, fire]', SENSE);
  assert.equal(r.fire, 'fire', 'the pair decodes; the chassis is what refuses it');
});

test('a W-1 program reading linked gets the honest false (it has no tower link)', () => {
  // `linked` is dropped from a W-1 sense, so a branch on it never fires.
  const r = decide('if linked then wait else hunt', SENSE);
  assert.equal(r.intent, 'hunt');
});
