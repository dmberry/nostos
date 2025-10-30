// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The stock T-2 program (task #96). A T2 spawns carrying it, which is what
// makes the unit programmable at all: postProgram refuses a unit whose
// behaviour is not a program, so a null here would leave every T2 page saying
// "nothing to replace" and the whole feature unreachable.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T2_PROGRAM, T1_PROGRAM } from '../src/game/robots.js';
import { decide } from '../src/game/ai_ml.js';

const SENSE = { charge: 80, integrity: 100, range: 7, home_range: 2, threat: true, hurt: false, linked: true };

test('the doctrine: press while whole, break off when opened', () => {
  assert.equal(decide(T2_PROGRAM, SENSE).intent, 'hunt');
  assert.equal(decide(T2_PROGRAM, { ...SENSE, hurt: true }).intent, 'home');
  assert.equal(decide(T2_PROGRAM, { ...SENSE, charge: 9 }).intent, 'home');
  assert.equal(decide(T2_PROGRAM, { ...SENSE, threat: false }).intent, 'patrol');
});

test('hurt outranks the chase — the hull is the asset', () => {
  // Both true at once: a hurt T2 with the player in sight goes home. This is
  // the line that distinguishes it from the T-1, which has no flee doctrine.
  assert.equal(decide(T2_PROGRAM, { ...SENSE, hurt: true, threat: true }).intent, 'home');
  assert.equal(decide(T1_PROGRAM, { ...SENSE, hurt: true, threat: true }).intent, 'hunt');
});

test('the stock program runs clean — no fault on any ordinary reading', () => {
  for (const threat of [true, false]) {
    for (const hurt of [true, false]) {
      const r = decide(T2_PROGRAM, { ...SENSE, threat, hurt });
      assert.ok(r.ok, `threat=${threat} hurt=${hurt}: ${r.fault}`);
    }
  }
});
