// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #113 — the SD-card clips. Video as a laptop did it in 1995: 64x48, sixteen
// colours, a few frames a second. These pin the properties a player and a save
// both depend on — that a frame is always a full buffer of real palette indices,
// that playback is reproducible, and that a card mounts as an ordinary
// filesystem so `ls` and `cat` work on it without knowing what a clip is.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CLIPS, PALETTE, CLIP_W, CLIP_H, renderFrame, frameCount,
  MEDIA_CARDS, makeMediaCard, clipForFile, packFrame, unpackFrame,
} from '../src/game/sdmedia.js';

test('every clip paints a full buffer of real palette indices', () => {
  for (const clip of Object.values(CLIPS)) {
    const n = frameCount(clip);
    assert.ok(n > 1, `${clip.id} should run to more than one frame`);
    for (const f of [0, 1, Math.floor(n / 2), n - 1]) {
      const buf = renderFrame(clip, f);
      assert.equal(buf.length, CLIP_W * CLIP_H, `${clip.id} frame ${f} is the wrong size`);
      for (const v of buf) {
        assert.ok(v >= 0 && v < PALETTE.length, `${clip.id} frame ${f}: index ${v} is not a colour`);
      }
    }
  }
});

test('playback is reproducible — the same card shows the same film twice', () => {
  for (const clip of Object.values(CLIPS)) {
    const a = renderFrame(clip, 7);
    const b = renderFrame(clip, 7);
    assert.deepEqual(a, b, `${clip.id} frame 7 differs between reads`);
  }
});

test('a clip loops rather than running off the end', () => {
  const clip = CLIPS.birthday;
  const n = frameCount(clip);
  assert.deepEqual(renderFrame(clip, n), renderFrame(clip, 0), 'wraps forward');
  assert.deepEqual(renderFrame(clip, -1), renderFrame(clip, n - 1), 'and backward');
});

test('the clips actually move', () => {
  // A still picture is not a video. Every clip must differ across its own run,
  // which is the one property that hand-authored frame data usually loses first.
  for (const clip of Object.values(CLIPS)) {
    const first = renderFrame(clip, 0);
    const later = renderFrame(clip, Math.floor(frameCount(clip) / 2));
    assert.notDeepEqual(first, later, `${clip.id} is a still, not a clip`);
  }
});

test('the security camera is monochrome, and the garden is not', () => {
  const cam = new Set(renderFrame(CLIPS.yard, 20));
  for (const v of cam) {
    assert.ok([0, 7, 8, 15].includes(v), `camera used colour ${v}; it is a mono camera`);
  }
  const garden = new Set(renderFrame(CLIPS.birthday, 10));
  assert.ok(garden.size > 4, 'the garden should be in colour');
});

test('a card mounts as an ordinary filesystem', () => {
  for (const key of Object.keys(MEDIA_CARDS)) {
    const tree = makeMediaCard(key);
    assert.ok(tree && tree.d, `${key} should mount a directory`);
    assert.ok(tree.d['README.TXT'], `${key} needs a README you can cat`);
    assert.match(tree.d['README.TXT'].f, /\S/);
    // Every clip on the card is present as a file, and every such file says
    // what to type — catting a video should explain itself, not dump bytes.
    for (const id of MEDIA_CARDS[key].clips) {
      const name = CLIPS[id].title.toUpperCase();
      assert.ok(tree.d[name], `${key} is missing ${name}`);
      assert.equal(tree.d[name].clip, id, 'the file carries its clip id for the player');
      assert.match(tree.d[name].f, /play /, 'and tells you how to watch it');
    }
  }
});

test('unknown cards mount nothing rather than throwing', () => {
  assert.equal(makeMediaCard('sd_not_a_card'), null);
});

test('a filename resolves to its clip, case-insensitively', () => {
  assert.equal(clipForFile('garden.avi'), CLIPS.birthday);
  assert.equal(clipForFile('GARDEN.AVI'), CLIPS.birthday);
  assert.equal(clipForFile('  cam04.avi '), CLIPS.yard);
  assert.equal(clipForFile('nope.avi'), null);
  assert.equal(clipForFile(''), null);
  assert.equal(clipForFile(null), null);
});

// Real footage arrives as DATA rather than a render function (David is making
// some). These pin the wire format: a frame must survive the round trip exactly,
// the encoding must be paste-safe in a source file, and a clip carrying frames
// must play from them without ever calling a renderer.

test('a frame survives the round trip through the packed form', () => {
  for (const clip of Object.values(CLIPS)) {
    for (const f of [0, 5, frameCount(clip) - 1]) {
      const buf = renderFrame(clip, f);
      assert.deepEqual(unpackFrame(packFrame(buf)), buf, `${clip.id} frame ${f}`);
    }
  }
});

test('the packed form is paste-safe and worth packing', () => {
  const buf = renderFrame(CLIPS.yard, 3);
  const packed = packFrame(buf);
  assert.match(packed, /^[A-Za-z0-9+-]+$/, 'no quotes, no backslashes, no escaping to get wrong');
  assert.ok(packed.length < buf.length, `packed ${packed.length} vs raw ${buf.length}`);
});

test('a clip carrying frames plays from them and never renders', () => {
  const frames = [
    packFrame(renderFrame(CLIPS.promo, 0)),
    packFrame(renderFrame(CLIPS.promo, 8)),
  ];
  const shot = {
    id: 'shot', title: 'real.avi', caption: 'footage', fps: 12, frames,
    render() { throw new Error('a clip with frames must not call its renderer'); },
  };
  assert.equal(frameCount(shot), 2, 'its length is its frame count, not fps x secs');
  assert.deepEqual(renderFrame(shot, 0), renderFrame(CLIPS.promo, 0));
  assert.deepEqual(renderFrame(shot, 1), renderFrame(CLIPS.promo, 8));
  assert.deepEqual(renderFrame(shot, 2), renderFrame(shot, 0), 'and it still loops');
});

test('malformed clip data is refused rather than half-painted', () => {
  assert.throws(() => unpackFrame('A'), /bad symbol|expected/);
  assert.throws(() => unpackFrame('!!'), /bad symbol/);
  assert.throws(() => unpackFrame('AA'), /expected/, 'a short frame is not a frame');
});
