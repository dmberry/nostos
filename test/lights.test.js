// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #189 — the machines light the ground they stand on.
//
// The module is pure, so every test here is an object and a question. What
// matters most is the OFF cases: a light that keeps burning on a tower you have
// felled tells the player the tower is still up, which is the opposite of what
// they just did.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMITTERS, emitterOf, lightsNear, flickerAt } from '../src/game/lights.js';
import { FUEL_PER_WOOD, EMBERS_AT } from '../src/game/cooking.js';
import { OBJECTS } from '../src/game/tiles.js';

test('every emitter names an object the game actually has', () => {
  for (const type of Object.keys(EMITTERS)) {
    assert.ok(OBJECTS[type], `${type} emits light but is not an object`);
    const e = EMITTERS[type];
    assert.ok(e.radius > 0 && e.level > 0 && e.level <= 1, `${type} has a usable falloff`);
    assert.equal(e.rgb.length, 3);
  }
});

test('a thing with no light in it emits none', () => {
  assert.equal(emitterOf(null), null);
  assert.equal(emitterOf({ type: 'tree' }), null);
  assert.equal(emitterOf({ type: 'rock' }), null);
});

test('A DEAD MACHINE IS DARK — every way a tower can be stopped', () => {
  // The point of the whole feature: the pool is a readout of a running machine,
  // so taking it off the network must put it out. A tower you have jammed that
  // still lights the field is telling the player their hack did nothing.
  assert.ok(emitterOf({ type: 'obelisk' }), 'a live one lights');
  for (const off of ['destroyed', 'needsRebuild', 'frozen', 'jammed']) {
    assert.equal(emitterOf({ type: 'obelisk', [off]: true }), null, `${off} must go dark`);
  }
});

test('damage dims a tower before it falls', () => {
  const whole = emitterOf({ type: 'obelisk' });
  const hurt = emitterOf({ type: 'obelisk', obDamage: 3 });
  assert.ok(hurt.level < whole.level);
  assert.ok(hurt.level > 0, 'but a standing tower is never fully out');
});

test('the panopticon eye throws further than a lesser tower', () => {
  const lesser = emitterOf({ type: 'obelisk' });
  const eye = emitterOf({ type: 'obelisk', cls: 'eye' });
  assert.ok(eye.radius > lesser.radius);
  assert.ok(eye.level > lesser.level);
});

test('a fire is as bright as it is big, and an unlit one is nothing', () => {
  assert.equal(emitterOf({ type: 'campfire', fuel: 0 }), null);
  const full = emitterOf({ type: 'campfire', fuel: FUEL_PER_WOOD * 3 });
  const embers = emitterOf({ type: 'campfire', fuel: EMBERS_AT - 5 });
  assert.ok(embers.level < full.level, 'embers throw less');
  assert.ok(embers.radius < full.radius);
  assert.ok(embers.level > 0, 'but embers still throw something');
});

test('lightsNear returns tile CENTRES, and culls', () => {
  const map = {
    objects: [
      { type: 'obelisk', x: 10, y: 10 },
      { type: 'campfire', x: 12, y: 9, fuel: 100 },
      { type: 'obelisk', x: 90, y: 90 },     // far away
      { type: 'obelisk', x: 11, y: 11, destroyed: true },  // near, but dead
      { type: 'tree', x: 10, y: 11 },
    ],
  };
  const got = lightsNear(map, 10, 10, 26);
  assert.equal(got.length, 2, 'the far one, the dead one and the tree are all out');
  const ob = got.find((l) => l.radius === EMITTERS.obelisk.radius);
  assert.equal(ob.x, 10.5);
  assert.equal(ob.y, 10.5, 'a light sits in the middle of its tile, not on its corner');
});

test('lightsNear survives a map with nothing in it', () => {
  assert.deepEqual(lightsNear(null, 0, 0), []);
  assert.deepEqual(lightsNear({}, 0, 0), []);
  assert.deepEqual(lightsNear({ objects: [] }, 0, 0), []);
});

test('flicker stays inside a usable range for every kind', () => {
  // A flicker that can reach zero is a light that blinks out; one that goes
  // over 1 washes the pool white. Sampled across a few seconds of clock.
  for (const kind of ['screen', 'vent', 'fire', 'stutter', 'none']) {
    for (let t = 0; t < 12; t += 0.05) {
      const v = flickerAt(kind, 3, t);
      assert.ok(v > 0.15 && v <= 1.001, `${kind} at ${t.toFixed(2)} gave ${v}`);
    }
  }
});

test('flicker is pure in t — the same clock gives the same light', () => {
  assert.equal(flickerAt('fire', 1, 4.5), flickerAt('fire', 1, 4.5));
  assert.notEqual(flickerAt('fire', 1, 4.5), flickerAt('fire', 2, 4.5), 'and each source is out of step');
});

test('NOTHING FLASHES IN THE 3 Hz BAND', () => {
  // Photosensitive epilepsy guidance: keep flashes under 3 Hz. Measured, not
  // asserted about the constants — a `sin(t * 32)` reads as a harmless-looking
  // number and is 5 Hz, which is how the underworld lamps' stutter got there.
  // Rate is counted as midpoint crossings over twenty seconds, which catches a
  // square wave as readily as a sine.
  const SPAN = 20, STEP = 0.001;
  for (const kind of ['screen', 'vent', 'fire', 'stutter']) {
    for (const seed of [0, 3, 17]) {
      let lo = Infinity, hi = -Infinity;
      for (let t = 0; t < SPAN; t += STEP) {
        const v = flickerAt(kind, seed, t);
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      if (hi - lo < 0.02) continue;         // steady enough not to flash at all
      const mid = (lo + hi) / 2;
      let crossings = 0, prev = flickerAt(kind, seed, 0) >= mid;
      for (let t = STEP; t < SPAN; t += STEP) {
        const now = flickerAt(kind, seed, t) >= mid;
        if (now !== prev) crossings++;
        prev = now;
      }
      const hz = crossings / 2 / SPAN;
      assert.ok(hz < 3, `${kind} (seed ${seed}) flashes at ${hz.toFixed(2)} Hz`);
    }
  }
});
