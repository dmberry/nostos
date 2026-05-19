// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE COLUMN WORLD (docs/terrain-3d-plan.md, stage 1).
//
// The load-bearing test in this file is the last one: a PROPERTY test that runs
// thousands of random setFloor/setHeight sequences through the old model and
// the new one and asserts they answer identically. Sixteen files call
// `heightAt` or `floorAt`, and none of them are going to be rewritten — the
// only honest way to claim they still work is to show that the thing under them
// cannot tell a different story. Everything above it is the new capability the
// old model could not express at all.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GROUND_BASE, simpleColumn, columnTop, columnSurface, isSimple, cloneColumn,
  setColumnTop, setColumnSurface, pushBlock, popBlock, pushGap,
  solidAt, surfaceBelow, slabs, packColumn, unpackColumn, standOn,
} from '../src/game/terrain.js';

// ---- the shape of an ordinary tile ------------------------------------------

test('flat ground is one block of soil whose lid is the world floor', () => {
  const c = simpleColumn('grass', 0);
  assert.equal(c.base, GROUND_BASE);
  assert.equal(columnTop(c), 0);
  assert.equal(columnSurface(c), 'grass');
  assert.equal(isSimple(c), true);
});

test('a column knows its top and its surface at any height, including below zero', () => {
  for (const h of [-2, -1, 0, 1, 6]) {
    const c = simpleColumn('sand', h);
    assert.equal(columnTop(c), h, `top at ${h}`);
    assert.equal(columnSurface(c), 'sand');
  }
});

// ---- raising and lowering ---------------------------------------------------

test('raising thickens the top run, so a raised grass tile is more grass', () => {
  const c = simpleColumn('grass', 0);
  setColumnTop(c, 3);
  assert.equal(columnTop(c), 3);
  assert.equal(c.runs.length, 1, 'one run, not one per click');
  assert.equal(c.runs[0].n, 4, 'four levels of soil: base -1 up to lid 3');
});

test('lowering eats runs off the top and never leaves nothing', () => {
  const c = simpleColumn('grass', 0);
  setColumnTop(c, 4);
  setColumnTop(c, -2);
  assert.equal(columnTop(c), -2);
  assert.ok(c.runs.length >= 1, 'a tile always exists; there is no hole to fall through');
  assert.equal(columnSurface(c), 'grass', 'and it is still made of what it was');
});

test('raise then lower returns the column to where it began', () => {
  const c = simpleColumn('road', 0);
  const before = JSON.stringify(c);
  setColumnTop(c, 5);
  setColumnTop(c, 0);
  assert.equal(JSON.stringify(c), before);
});

test('setting the surface repaints the top without moving it', () => {
  const c = simpleColumn('grass', 2);
  setColumnSurface(c, 'stone');
  assert.equal(columnSurface(c), 'stone');
  assert.equal(columnTop(c), 2, 'the tile did not move');
});

// ---- what the heightmap could never say -------------------------------------

test('stone under grass: two materials in one column', () => {
  // Unrepresentable before: floor and height had one entry each, so raising a
  // tile stretched its single material upward and that was the whole of it.
  const c = simpleColumn('stone', 2);
  pushBlock(c, 'grass');
  assert.equal(columnTop(c), 3);
  assert.equal(columnSurface(c), 'grass');
  assert.deepEqual(slabs(c).map((s) => s.mat), ['stone', 'grass']);
  assert.equal(isSimple(c), false, 'and it can no longer live in the two arrays');
});

test('placing the same material merges, so a wall has no seams in it', () => {
  const c = simpleColumn('stone', 0);
  pushBlock(c, 'stone'); pushBlock(c, 'stone'); pushBlock(c, 'stone');
  assert.equal(c.runs.length, 1, 'one run of four, not four runs of one');
  assert.equal(columnTop(c), 3);
});

test('a gap is air, and that is what a bridge spans', () => {
  const c = simpleColumn('grass', 0);   // ground at 0
  pushGap(c, 2);                        // two levels of nothing
  pushBlock(c, 'boards');               // a deck at 3
  assert.equal(columnTop(c), 3);
  assert.equal(solidAt(c, 0), true, 'the ground is solid');
  assert.equal(solidAt(c, 1), false, 'and you can walk through here');
  assert.equal(solidAt(c, 2), false);
  assert.equal(solidAt(c, 3), true, 'the deck');
  assert.deepEqual(slabs(c).map((s) => s.mat), ['grass', 'boards'],
    'the renderer sees two slabs with a hole between them');
});

test('surfaceBelow is what walking under a bridge is made of', () => {
  const c = simpleColumn('grass', 0);
  pushGap(c, 2);
  pushBlock(c, 'boards');
  assert.equal(surfaceBelow(c, 0), 0, 'standing on the ground, under the deck');
  assert.equal(surfaceBelow(c, 3), 3, 'standing on the deck');
  assert.equal(surfaceBelow(c, 2), 0, 'mid-air between them, the ground is what catches you');
});

test('breaking the last block leaves ground one lower, not a hole', () => {
  const c = simpleColumn('grass', 0);
  popBlock(c);
  assert.equal(columnTop(c), -1);
  assert.ok(columnSurface(c), 'there is still a tile here');
});

// ---- persistence ------------------------------------------------------------

test('a column survives a round trip through the save', () => {
  const c = simpleColumn('stone', 1);
  pushGap(c, 2);
  pushBlock(c, 'boards');
  const back = unpackColumn(packColumn(c));
  assert.deepEqual(back, c);
});

test('rubbish unpacks to null rather than to a broken column', () => {
  // A save written by a build that knew a different format must not become a
  // tile nobody can stand on.
  assert.equal(unpackColumn(null), null);
  assert.equal(unpackColumn([]), null);
  assert.equal(unpackColumn([0]), null);
  assert.equal(unpackColumn([0, 'grass', 0]), null, 'a zero-thickness run is not a run');
});

test('cloning a column does not alias the original', () => {
  const c = simpleColumn('grass', 0);
  const d = cloneColumn(c);
  setColumnTop(d, 4);
  assert.equal(columnTop(c), 0);
});

// ---- THE PROPERTY TEST ------------------------------------------------------

test('for any run of setFloor/setHeight, the column answers exactly as the heightmap did', () => {
  // The old model, in four lines — one material and one height per tile, which
  // is precisely what map.js held. If the column can be driven through the same
  // edits and never disagree, then the sixteen files that read `floorAt` and
  // `heightAt` cannot tell that anything underneath them has changed, and the
  // rest of the rewrite is free to proceed.
  const MATS = ['grass', 'sand', 'road', 'stone', 'dirt', 'water'];
  let seed = 20260815;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  for (let trial = 0; trial < 400; trial++) {
    let oldMat = MATS[(rnd() * MATS.length) | 0];
    let oldH = ((rnd() * 9) | 0) - 2;                 // -2..6, the build limits
    const col = simpleColumn(oldMat, oldH);

    for (let step = 0; step < 30; step++) {
      if (rnd() < 0.5) {
        const m = MATS[(rnd() * MATS.length) | 0];
        oldMat = m; setColumnSurface(col, m);
      } else {
        const h = ((rnd() * 9) | 0) - 2;
        oldH = h; setColumnTop(col, h);
      }
      assert.equal(columnSurface(col), oldMat,
        `trial ${trial} step ${step}: surface drifted`);
      assert.equal(columnTop(col), oldH,
        `trial ${trial} step ${step}: height drifted`);
      assert.equal(isSimple(col), true,
        `trial ${trial} step ${step}: an ordinary tile must stay cheap enough to live in the arrays`);
    }
  }
});

// ---- stage 2: the store inside GameMap --------------------------------------

test('an ordinary tile is never stored as a column, and still answers everything', async () => {
  const { GameMap } = await import('../src/game/map.js');
  const m = new GameMap(8, 8, 'grass');
  m.setFloor(2, 2, 'sand');
  m.setHeight(2, 2, 3);
  assert.equal(m.columns.size, 0, 'a floor type and a height need no Map entry');
  assert.equal(m.floorAt(2, 2), 'sand');
  assert.equal(m.heightAt(2, 2), 3);
  const c = m.columnAt(2, 2);
  assert.equal(columnSurface(c), 'sand');
  assert.equal(columnTop(c), 3);
});

test('a built column is stored, and the old accessors keep telling the truth', async () => {
  const { GameMap } = await import('../src/game/map.js');
  const m = new GameMap(8, 8, 'grass');
  const col = m.editColumn(3, 3);
  pushBlock(col, 'stone');
  pushBlock(col, 'sand');
  m.setColumn(3, 3, col);
  assert.equal(m.columns.size, 1);
  assert.equal(m.floorAt(3, 3), 'sand', 'floorAt is the surface');
  assert.equal(m.heightAt(3, 3), 2, 'heightAt is the top');
});

test('flattening a built tile drops it from the store again', async () => {
  const { GameMap } = await import('../src/game/map.js');
  const m = new GameMap(8, 8, 'grass');
  const col = m.editColumn(4, 4);
  pushBlock(col, 'stone');
  m.setColumn(4, 4, col);
  assert.equal(m.columns.size, 1);
  m.setColumn(4, 4, simpleColumn('grass', 0));
  assert.equal(m.columns.size, 0, 'built up and flattened again costs nothing');
});

test('writing through the old setters keeps a built column in step', async () => {
  // The compatibility contract at its sharpest: worldgen and the islands call
  // setFloor/setHeight on tiles they know nothing about, and must not be able
  // to leave a stored column disagreeing with the arrays beside it.
  const { GameMap } = await import('../src/game/map.js');
  const m = new GameMap(8, 8, 'grass');
  const col = m.editColumn(5, 5);
  pushBlock(col, 'stone');
  m.setColumn(5, 5, col);
  m.setFloor(5, 5, 'road');
  m.setHeight(5, 5, 4);
  assert.equal(m.floorAt(5, 5), 'road');
  assert.equal(m.heightAt(5, 5), 4);
  const back = m.columnAt(5, 5);
  assert.equal(columnSurface(back), 'road', 'the column followed the array');
  assert.equal(columnTop(back), 4);
});

test('the store round-trips through the save, and only built tiles are in it', async () => {
  const { GameMap } = await import('../src/game/map.js');
  const m = new GameMap(8, 8, 'grass');
  m.setHeight(1, 1, 2);                       // generated terrain: not saved
  const col = m.editColumn(6, 6);
  pushGap(col, 2); pushBlock(col, 'boards');  // a player's bridge: saved
  m.setColumn(6, 6, col);

  const packed = m.packColumns();
  assert.equal(packed.length, 1, 'the store is the diff, not a copy of the island');

  const n = new GameMap(8, 8, 'grass');
  assert.equal(n.applyColumns(packed), 1);
  assert.deepEqual(n.columnAt(6, 6), m.columnAt(6, 6));
  assert.equal(n.heightAt(6, 6), m.heightAt(6, 6));
});

// ---- stage 3: the prism pass records what it drew ---------------------------

test('the picker inverts the stamped matrix, device pixels and all', async () => {
  // The bug this pins down: the backing store is `w * dpr` wide, so the matrix
  // the prisms are drawn under is in DEVICE pixels while every pointer the game
  // handles is in CSS pixels. At dpr 2 that picked a tile seven rows out.
  const { pickTile } = await import('../src/engine/iso.js');
  const xf = { a: 2, b: 0, c: 0, d: 2, e: 400, f: 300 };   // dpr 2, centred
  const hits = [
    { tx: 5, ty: 5, z: 0, x: 0, y: 0 },                    // iso origin
    { tx: 9, ty: 9, z: 3, x: 400, y: 100 },
  ];
  // The canvas centre in CSS pixels is (200, 150) — half the device centre.
  const hit = pickTile(hits, xf, 200, 150, 2);
  assert.ok(hit, 'a point over a drawn tile must find it');
  assert.equal(hit.tx, 5);
  assert.equal(hit.ty, 5);
  assert.equal(pickTile(hits, xf, 200, 150, 1), null,
    'and at the wrong scale it finds nothing — which is what the bug looked like');
  assert.equal(pickTile(hits, xf, 399, 299, 2), null,
    'a point outside every diamond finds nothing rather than guessing');
});

test('the picker takes the LAST tile drawn over a point, which is the nearest', async () => {
  // Paint order is depth order, so the front-most prism is painted last.
  // Reading the list backwards is what makes a tall block in front of low
  // ground pick the block rather than the ground behind it.
  const { pickTile } = await import('../src/engine/iso.js');
  const xf = { a: 1, b: 0, c: 0, d: 1, e: 50, f: 50 };
  const hits = [
    { tx: 1, ty: 1, z: 0, x: 0, y: 0 },   // behind
    { tx: 2, ty: 2, z: 4, x: 0, y: 0 },   // in front, same pixels
  ];
  assert.equal(pickTile(hits, xf, 50, 50, 1).tx, 2);
  assert.equal(pickTile([], xf, 50, 50, 1), null, 'an empty list is not a crash');
});

// ---- stage 5: standing on a column ------------------------------------------

test('standOn: an ordinary column answers what heightAt always did', () => {
  // The safety claim for the whole stage. A column with no interior air has one
  // surface, and it is the one the movement system has always been given.
  const c = simpleColumn('grass', 2);
  assert.equal(standOn(c, 2, 1), 2, 'standing on it');
  assert.equal(standOn(c, 1, 1), 2, 'one step below: reachable, so you step up');
  assert.equal(standOn(c, 0, 1), null, 'two steps below: out of reach, which is a wall');
  assert.equal(standOn(c, 5, 1), 2, 'from above, it is still the surface you land on');
});

test('standOn under a bridge gives the ground; on it, the deck', () => {
  const c = simpleColumn('grass', 0);
  pushGap(c, 2);
  pushBlock(c, 'boards');            // ground 0, air, deck at 3
  assert.equal(standOn(c, 0, 1), 0, 'feet on the ground: the deck is out of reach overhead');
  assert.equal(standOn(c, 3, 1), 3, 'feet on the deck: the deck');
  assert.equal(standOn(c, 2, 1), 3, 'stepping up onto it from one below');
});

test('standOn refuses a lid with a block sitting on it', () => {
  // The inside of a stack is not somewhere to stand, however reachable the
  // number is.
  const c = simpleColumn('stone', 0);
  pushBlock(c, 'stone');
  pushBlock(c, 'stone');             // solid 0..2, no air anywhere
  assert.equal(standOn(c, 2, 1), 2, 'only the top');
  assert.equal(standOn(c, 0, 1), null, 'and from the bottom it is a wall');
});

test('standingHeightAt is byte-identical to effectiveHeightAt on ordinary ground', async () => {
  const { GameMap } = await import('../src/game/map.js');
  const m = new GameMap(10, 10, 'grass');
  m.setHeight(3, 3, 2);
  m.addObject('wall', 4, 4);         // climbable, +2.5
  for (const [x, y] of [[3, 3], [4, 4], [5, 5], [0, 0]]) {
    assert.equal(m.standingHeightAt(x, y, 99, 1), m.effectiveHeightAt(x, y),
      `they must not disagree at ${x},${y} — movement is already in play on the old answer`);
  }
});

test('standingHeightAt puts you under a built bridge, or on it', async () => {
  const { GameMap } = await import('../src/game/map.js');
  const m = new GameMap(10, 10, 'grass');
  const c = m.editColumn(6, 6);
  pushGap(c, 2); pushBlock(c, 'boards');
  m.setColumn(6, 6, c);
  assert.equal(m.standingHeightAt(6, 6, 0, 1), 0, 'walking under it');
  assert.equal(m.standingHeightAt(6, 6, 3, 1), 3, 'walking along it');
  assert.equal(m.heightAt(6, 6), 3, 'and heightAt still reports the top, as everything expects');
});

// ---- continuity: a walker does not change layer without earning it ----------

test('walking under a deck never gains the deck, however the z wobbles', async () => {
  // David, 2026-08-16: "if the player is walking it is unlikely to suddenly
  // jump vertically... ditto walking on an arch". A drop off a kerb sets z, and
  // reading an airborne FLAG rather than the actual height let that widen the
  // reach enough to snatch the deck overhead.
  const { GameMap } = await import('../src/game/map.js');
  const { Player } = await import('../src/game/player.js');
  const m = new GameMap(10, 10, 'grass');
  const c = m.editColumn(5, 5);
  pushGap(c, 2); pushBlock(c, 'boards');      // ground 0, deck 3
  m.setColumn(5, 5, c);

  const p = new Player();
  p.x = 5.5; p.y = 5.5; p.footZ = 0;
  for (const z of [0, 0.2, 0.5, 0.9]) {       // a hop, a stumble, a drop
    p.z = z;
    assert.equal(p.groundUnder(m, 5.5, 5.5), 0,
      `z=${z} must not reach a deck three levels up`);
  }
  p.z = 1.6;                                   // now genuinely up there
  assert.equal(p.groundUnder(m, 5.5, 5.5), 3, 'jumped high enough, so the deck is yours');
});

test('on the deck, walking along it stays on it', async () => {
  const { GameMap } = await import('../src/game/map.js');
  const { Player } = await import('../src/game/player.js');
  const m = new GameMap(10, 10, 'grass');
  for (const x of [4, 5, 6]) {
    const c = m.editColumn(x, 5);
    pushGap(c, 2); pushBlock(c, 'boards');
    m.setColumn(x, 5, c);
  }
  const p = new Player();
  p.footZ = 3; p.z = 0;
  for (const x of [4.5, 5.5, 6.5]) {
    assert.equal(p.groundUnder(m, x, 5.5), 3, 'the arch does not drop you halfway across');
  }
});

test('a two-block body needs two blocks of clearance to stand somewhere', async () => {
  // David, 2026-08-16: "you should check that the character can fit! they are 2
  // blocks high?" A foothold is not a place to stand if your head is in a deck.
  const { GameMap } = await import('../src/game/map.js');
  const roomy = new GameMap(8, 8, 'grass');
  const a = roomy.editColumn(3, 3);
  pushGap(a, 2); pushBlock(a, 'boards');       // ground 0, clear at 1 and 2, deck 3
  roomy.setColumn(3, 3, a);
  assert.equal(roomy.standingHeightAt(3, 3, 0, 1, 2), 0, 'two clear levels: you fit under it');

  const tight = new GameMap(8, 8, 'grass');
  const b = tight.editColumn(3, 3);
  pushGap(b, 1); pushBlock(b, 'boards');       // ground 0, clear at 1 only, deck 2
  tight.setColumn(3, 3, b);
  assert.equal(tight.standingHeightAt(3, 3, 0, 1, 2), 2,
    'one clear level is a crawlspace — the ground below is not standable, so the deck is the answer');
  assert.equal(tight.standingHeightAt(3, 3, 0, 1, 1), 0,
    'and something one block high would happily walk under it');
});
