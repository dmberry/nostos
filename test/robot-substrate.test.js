// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// S1 substrate (docs/robot-ml-rollout-plan.md). The rules every later chassis
// leans on: the T1/T2 sense refactor is invisible; a fire pair on a chassis
// with no weapon faults rather than being half-obeyed; and the network
// speaking over a unit silences its program WITHOUT lighting the fault lamp.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { botThink, unitOverridden } from '../src/game/robots.js';

// A minimal unit + map, enough for botThink. No obelisks: `linked` reads false,
// which is fine — these tests do not exercise it.
function unit(over = {}) {
  return {
    type: 't2', program: '', battery: 90, hp: 24, maxHp: 24,
    home: { x: 0, y: 0 }, x: 0, y: 0, mlT: 0, beepT: 0,
    intent: null, fault: null, fireWish: null,
    lamp: null, lampFlash: 0, lampFault: false, _homeOb: null,
    ...over,
  };
}
const MAP = { objects: [] };

test('a fire pair on a fireless chassis faults, not half-obeys', () => {
  const r = unit({ program: '[hunt, fire]' });
  botThink(r, 3, 1, MAP);
  assert.ok(r.fault, 'a T2 has no weapon; a pair must fault');
  assert.match(r.fault, /fire control/);
  assert.equal(r.intent, null, 'and it must not quietly move the feet');
  assert.equal(r.lampFault, true, 'a genuine fault DOES light the amber lamp');
});

test('a bare intent on the same chassis runs clean', () => {
  const r = unit({ program: 'patrol' });
  botThink(r, 99, 1, MAP);
  assert.equal(r.fault, null);
  assert.equal(r.intent, 'patrol');
  assert.equal(r.fireWish, null, 'no weapon opinion from a fireless chassis');
});

test('an overridden unit is silenced without the fault lamp', () => {
  // The network is recalling it (spoofer: reads friendly). Its program must
  // not get a vote, but nothing is broken, so the amber tell must stay off.
  const r = unit({ program: 'hunt', friendly: true, intent: 'hunt' });
  assert.equal(unitOverridden(r), true);
  botThink(r, 2, 1, MAP);
  assert.equal(r.intent, null, 'the program does not decide under recall');
  assert.equal(r.fault, null, 'and it is not a fault');
  assert.notEqual(r.lamp, 'amber', 'the amber fault lamp must stay off');
  assert.equal(r.lampFault, false);
});

test('unitOverridden reads the live authority states', () => {
  assert.equal(unitOverridden(unit()), false);
  assert.equal(unitOverridden(unit({ repelledT: 1.2 })), true, 'repel');
  assert.equal(unitOverridden(unit({ singing: true })), true, 'sing');
  assert.equal(unitOverridden(unit({ friendly: true })), true, 'spoofed');
  assert.equal(unitOverridden(null), false, 'and it is null-safe');
});
