// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// S3 — the T-3 ambusher (docs/robot-ml-rollout-plan.md). An emplacement: its
// stock program returns `[wait, fire]` — feet still, weapon firing — which is
// the case the pair model exists for. It must never choose a moving intent
// with the player in sight.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T3_PROGRAM } from '../src/game/robots.js';
import { decide } from '../src/game/ai_ml.js';

const SENSE = {
  charge: 90, integrity: 100, range: 8, home_range: 2, threat: true, hurt: false,
  linked: true, sight: true, armed: true, shielded: false, contact: false, lost_for: 0,
};
const pick = (r) => [r.intent, r.fire ?? null];

test('sighted and armed: it fires without moving its feet', () => {
  assert.deepEqual(pick(decide(T3_PROGRAM, SENSE)), ['wait', 'fire']);
});

test('the nest is the post: it never chooses a moving intent while it can see you', () => {
  for (const over of [{}, { armed: false }, { sight: false }, { hurt: true }]) {
    const r = decide(T3_PROGRAM, { ...SENSE, ...over });
    assert.ok(r.ok, r.fault);
    assert.notEqual(r.intent, 'hunt', `chased with ${JSON.stringify(over)}`);
    assert.notEqual(r.intent, 'patrol', `wandered with ${JSON.stringify(over)}`);
  }
});

test('flat cell sends it home; weapon cooling holds fire at the post', () => {
  assert.equal(decide(T3_PROGRAM, { ...SENSE, charge: 8 }).intent, 'home');
  assert.deepEqual(pick(decide(T3_PROGRAM, { ...SENSE, armed: false })), ['wait', null]);
  assert.deepEqual(pick(decide(T3_PROGRAM, { ...SENSE, sight: false })), ['wait', null]);
});
