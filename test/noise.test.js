// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE PURGE FOG'S FIELD (task #88).
//
// The fog used to be one number laid over the screen as a flat grey, which read
// as a filter on the camera rather than as weather on the island. It is a
// moving field now: `poseidonFog` still says how much of the network is up, and
// that density is multiplied per cell by this noise, so there are pockets you
// can see through and banks you cannot.
//
// Three properties the screen does not check reliably, all of which the field
// has to have or the effect fails in a way that looks like a different bug:
// smooth (a bare hash is television snow), varied (a flat field is the old wash
// back again), and repeatable (a field that re-rolls each frame boils).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tileHash, valueNoise, fogNoise, FOG_BANK, FOG_STEP } from '../src/engine/noise.js';

test('the field is bounded and repeatable', () => {
  // Sampled twice at the same point it must give the same answer: the fog is
  // redrawn every frame from the same coordinates, and a hash that drifted
  // would boil rather than blow.
  for (let i = 0; i < 200; i++) {
    const x = (i * 7.31) - 40, y = (i * -3.17) + 11;
    const a = fogNoise(x, y), b = fogNoise(x, y);
    assert.equal(a, b, `fogNoise is not deterministic at ${x},${y}`);
    assert.ok(a >= 0 && a <= 1, `fogNoise out of range at ${x},${y}: ${a}`);
  }
});

test('negative coordinates work', () => {
  // The camera goes negative in projection space on the west half of every map,
  // and a hash that folded negatives onto positives would mirror the weather
  // about the origin.
  assert.notEqual(fogNoise(-3.5, -9.25), fogNoise(3.5, 9.25));
  assert.ok(Number.isFinite(fogNoise(-1e4, -1e4)));
  assert.ok(tileHash(-7, -13) >= 0 && tileHash(-7, -13) < 1);
});

test('the field is smooth at the scale it is sampled', () => {
  // The renderer samples every FOG_STEP screen px, which is FOG_STEP/FOG_BANK
  // in noise space. Two neighbouring cells must be close, or the banks come out
  // as snow. The bound is loose (0.25) — this is a smoothness check, not a
  // fingerprint of the exact easing.
  const step = FOG_STEP / FOG_BANK;
  let worst = 0;
  for (let i = 0; i < 400; i++) {
    const x = i * 0.37 - 30, y = i * -0.21 + 5;
    worst = Math.max(worst, Math.abs(fogNoise(x + step, y) - fogNoise(x, y)));
    worst = Math.max(worst, Math.abs(fogNoise(x, y + step) - fogNoise(x, y)));
  }
  assert.ok(worst < 0.25, `neighbouring cells jump by ${worst.toFixed(3)} — that is snow, not banks`);
});

test('the field actually has banks in it', () => {
  // A field that barely varies is the flat wash again under a more expensive
  // implementation. Over a screen's worth of cells there must be both thick and
  // thin, and the spread has to be wide enough to see.
  const vals = [];
  const step = FOG_STEP / FOG_BANK;
  for (let cy = 0; cy < 60; cy++) for (let cx = 0; cx < 60; cx++) vals.push(fogNoise(cx * step, cy * step));
  const lo = Math.min(...vals), hi = Math.max(...vals);
  assert.ok(hi - lo > 0.35, `the field only spans ${(hi - lo).toFixed(3)} — no visible banks`);
});

test('one octave alone would band; two do not sit on the same lattice', () => {
  // The second octave is offset as well as scaled. Without the offset the two
  // share their lattice corners at every integer and reinforce into a grid.
  let same = 0;
  for (let i = 0; i < 100; i++) {
    if (Math.abs(valueNoise(i, i) - valueNoise(i * 2.31 + 19.7, i * 2.31 - 8.3)) < 1e-9) same++;
  }
  assert.equal(same, 0, 'the two octaves agree exactly somewhere — they share a lattice');
});
