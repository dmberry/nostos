// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { packFog, unpackFogInto, fogSeenFraction } from '../src/game/fog.js';

const mk = (n, pick) => {
  const a = new Uint8Array(n);
  for (let i = 0; i < n; i++) a[i] = pick(i) ? 1 : 0;
  return a;
};

test('a fog survives the round trip exactly', () => {
  const src = mk(16384, (i) => (i * 7919) % 13 === 0);
  const back = new Uint8Array(16384);
  assert.equal(unpackFogInto(packFog(src), back), true);
  assert.deepEqual([...back], [...src]);
});

test('the last bits of a length that is not a multiple of 8 survive', () => {
  // 16,384 divides by 8; a map that does not would lose its tail to an
  // off-by-one in the shift, and nobody would notice but the far corner.
  const src = mk(19, (i) => i === 0 || i === 17 || i === 18);
  const back = new Uint8Array(19);
  assert.equal(unpackFogInto(packFog(src), back), true);
  assert.deepEqual([...back], [...src]);
});

test('all-walked and never-walked both survive', () => {
  for (const fill of [0, 1]) {
    const src = mk(1024, () => fill);
    const back = new Uint8Array(1024);
    assert.equal(unpackFogInto(packFog(src), back), true);
    assert.equal(fogSeenFraction(back), fill);
  }
});

test('packed is far smaller than the array it came from', () => {
  const src = mk(16384, (i) => i % 3 === 0);
  assert.ok(packFog(src).length < src.length / 4,
    'a bit per tile, base64 — if this grows, something is storing a byte per tile again');
});

test('a fog of the wrong size is refused WHOLE, not applied halfway', () => {
  // The save is keyed by island, and an island could be regenerated at a
  // different size. Half a fog is worse than none: it would show grey where you
  // had walked and clear where you had not.
  const src = mk(1024, (i) => i < 512);
  const smaller = new Uint8Array(256).fill(1);
  assert.equal(unpackFogInto(packFog(src), smaller), false);
  assert.equal(fogSeenFraction(smaller), 1, 'left exactly as it was');
});

test('junk in the save cannot throw', () => {
  const back = new Uint8Array(64);
  for (const junk of [null, undefined, '', 42, '!!!not base64!!!', {}]) {
    assert.equal(unpackFogInto(junk, back), false);
  }
  assert.equal(fogSeenFraction(back), 0);
});
