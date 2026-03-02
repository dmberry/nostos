// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #149 — the T-8. The grove holds you with light, so what is standing in it is
// not a garrison. These tests are mostly about what the chassis CANNOT do,
// because that is the design: a machine that could be told to hunt would make
// the clearing a guarded room again.
//
// Revised 2026-08-14: the T-8s no longer dance. `dance`/`sway` became
// `usher`/`stand`, and the unit's job is to move a person off her floor rather
// than to keep time on it. What it still cannot do is the important half.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decide, INTENTS } from '../src/game/ai_ml.js';
import { T8_PROGRAM, T8_CAN, T1_PROGRAM, W5_PROGRAM } from '../src/game/robots.js';

const LIT = { charge: 90, floorlight: 40, lit: true, brighter: false, trespass: false };

test('the shipped program decides in every state of the floor', () => {
  const at = (s) => { const r = decide(T8_PROGRAM, s); assert.ok(r.ok, `faulted: ${r.fault}`); return r.intent; };
  assert.equal(at({ ...LIT, trespass: true }), 'usher', 'somebody on her floor: move them off it');
  assert.equal(at(LIT), 'stand', 'the floor is lit and empty: hold the post');
  assert.equal(at({ charge: 90, floorlight: 2, lit: false, trespass: false }), 'wait',
    'off the lumen there is no floor to keep');
  assert.equal(at({ ...LIT, trespass: true, charge: 4 }), 'home', 'flat: the battery comes first');
});

test('the program carries the clause it is there to carry', () => {
  assert.match(T8_PROGRAM, /s\.63/);
  assert.match(T8_PROGRAM, /repetitive beats/);
  // The finding matters more than the quotation: the unit has decided it is at
  // a gathering and that it may stay. Losing this leaves the joke as decoration.
  assert.match(T8_PROGRAM, /gathering/i);
});

test('usher and stand are real intents, and reachable from a program', () => {
  for (const w of ['usher', 'stand']) assert.ok(INTENTS.includes(w), `${w} should be an intent`);
  // The regression this pins: a sense has to be on MACHINE_ONLY to be reachable
  // at all. Before that, `if trespass then usher` faulted with "if needs a
  // true/false test" and `floorlight` read as a bare node id — both of which
  // say nothing about the actual cause.
  for (const p of ['if trespass then usher else stand', 'if lit then stand else wait',
    'if floorlight > 10 then stand else wait']) {
    const r = decide(p, LIT);
    assert.ok(r.ok, `${p} faulted: ${r.fault}`);
  }
});

test('the floor senses read safe off her island, where there is no lit floor', () => {
  // Every other island has no lumenField at all, so these arrive undefined.
  // They must read dark rather than fault, or a T-8 anywhere else is a broken
  // machine with an amber lamp.
  const r = decide(T8_PROGRAM, { charge: 90 });
  assert.ok(r.ok, `faulted with no floor: ${r.fault}`);
  assert.equal(r.intent, 'wait');
});

test('the other chassis are untouched by the new senses', () => {
  const t1 = decide(T1_PROGRAM, { charge: 90, threat: true, range: 5, home_range: 9, integrity: 100 });
  assert.ok(t1.ok && t1.intent === 'hunt');
  const w5 = decide(W5_PROGRAM, { charge: 90, work: true });
  assert.ok(w5.ok && w5.intent === 'tend');
});

test('a T-8 cannot be told to hunt, and the language is not what stops it', () => {
  // `hunt` is a perfectly good word — it just is not this chassis's. The gate
  // is the CAN list, and it has to be, because the whole design of the clearing
  // is that a machine standing in it could not be turned into a guard even by
  // somebody who wrote it a program saying so.
  const r = decide('hunt', LIT);
  assert.ok(r.ok && r.intent === 'hunt', 'hunt parses: it is real for other machines');
  for (const w of ['hunt', 'flee', 'patrol', 'tend']) {
    assert.ok(!T8_CAN.includes(w), `${w} must not be in an usher's repertoire`);
  }
  // And what it CAN do is exactly what the shipped program asks for. `usher` is
  // in and `hunt` is out, which is the line between moving someone along and
  // going after them.
  for (const w of ['usher', 'stand', 'wait', 'home']) assert.ok(T8_CAN.includes(w));
});
