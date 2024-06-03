import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seaRun, seawardFrom, boatMirror, CF_DIST } from '../src/game/crossing.js';

// A map-like: `land` is a predicate over tiles; everything else is open sea.
function seaMap(w, h, land = () => false) {
  return { w, h, floorAt: (x, y) => (land(x, y) ? 'sand' : 'sea') };
}

test('seaRun: counts open water and stops at the shore', () => {
  // Land everywhere at y >= 40; open sea above it, deeper than the cap.
  const m = seaMap(64, 64, (x, y) => y >= 40);
  assert.equal(seaRun(m, 10, 39.5, 0, -1), CF_DIST, 'straight out: open all the way');
  assert.equal(seaRun(m, 10, 30, 0, 1), 9, 'straight back: stops on the sand at y=40');
});

test('seaRun: the map edge is open ocean, not a wall', () => {
  // An island's map carries only a thin rim of sea. If the edge ended the voyage,
  // there would be nowhere to sail and the island could never fall away behind you.
  const m = seaMap(64, 64);                    // all sea, no land at all
  assert.equal(seaRun(m, 30, 5, 0, -1), CF_DIST, 'straight out over the edge: keeps going');
});

test('seaRun: LAND still stops you, even a step from the edge', () => {
  // The edge being open must not become "anything is sailable". A headland in the
  // way is still a headland.
  const m = seaMap(64, 64, (x, y) => y <= 2);  // a bar of land along the top
  assert.ok(seaRun(m, 30, 10, 0, -1) < CF_DIST, 'the bar stops her short');
  assert.equal(seaRun(m, 30, 10, 0, -1), 7, 'seven tiles of water, then the land');
});

test('seaRun: a beach with a thin rim of sea still gets a real voyage', () => {
  // The regression this whole thing exists for: a north-shore beach with 3 rows of
  // sea above it. It must not row through the sand, and it must not be stranded on
  // the beach either — it sails out over the rim into the ocean.
  const m = seaMap(64, 64, (x, y) => y >= 4);
  const d = seawardFrom(m, 30, 4);
  assert.ok(d.run >= 10, `should get properly out to sea, got ${d.run} tiles`);
  assert.ok(d.y < 0, 'and head away from the island');
  // No step may cross land (out-of-bounds ocean is fine).
  for (let s = 1; s <= d.run; s++) {
    const tx = Math.round(30 + d.x * s), ty = Math.round(4 + d.y * s);
    const off = tx < 1 || ty < 1 || tx > m.w - 2 || ty > m.h - 2;
    assert.ok(off || m.floorAt(tx, ty) === 'sea', `step ${s} is water or open ocean`);
  }
});

test('seawardFrom: open water gets the full voyage', () => {
  const m = seaMap(64, 64, (x, y) => y >= 40);     // a big sea to the north
  const d = seawardFrom(m, 30, 39);
  assert.equal(d.run, CF_DIST, 'nothing in the way: the full run');
  assert.ok(d.y < 0, 'and it heads out to sea, not inland');
});

test('seawardFrom: sails OUT, not along the beach', () => {
  // A coast running north-south with land to the east, and only a thin strip of
  // sea to the west. The longest ray from the shore is straight up the channel,
  // parallel to the beach — but sailing down the coast is not leaving, so the
  // heading must still point out to sea (west).
  const m = seaMap(64, 64, (x, y) => x >= 30 || x <= 25);   // water only in x = 26..29
  const d = seawardFrom(m, 29, 32);
  // Dead along the coast is wide open — 22 tiles, the full cap — and it is exactly
  // what we must NOT choose.
  assert.equal(seaRun(m, 29, 32, 0, -1), CF_DIST, 'the alongshore ray really is the longest');
  assert.ok(d.run < CF_DIST, 'so it was not taken');
  assert.ok(d.x < 0, `must carry you off the beach — got dx=${d.x.toFixed(2)}`);
});

test('seawardFrom: heads AWAY from the land', () => {
  const m = seaMap(64, 64, (x, y) => x >= 32);     // land to the east, sea to the west
  const d = seawardFrom(m, 31, 30);
  assert.ok(d.x < 0, `heading should run west into the water, got ${d.x}`);
  assert.ok(d.run > 0);
});

test('boatMirror: the bow points the way she is going, and swings round when turned', () => {
  // The sprite's bow natively runs to world +y (down-left on screen); mirrored it
  // runs to world +x (down-right). screen-x tracks (x - y).
  assert.equal(boatMirror(0, 1), false, 'heading +y: the sprite as drawn');
  assert.equal(boatMirror(1, 0), true, 'heading +x: mirrored');
  // Poseidon turns you: the heading reverses and so must the hull.
  const out = boatMirror(0.8, -0.6);
  const home = boatMirror(-0.8, 0.6);
  assert.notEqual(out, home, 'she comes about on the way home');
});
