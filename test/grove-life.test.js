// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #165 — Grove.app. An emulation of her floor, not a view of it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  makeLife, step, population, alive, floorMask, corePos, stampWord,
  LIFE_W, LIFE_H, STALL_LIMIT, SIM_NOTE,
} from '../src/game/grove-life.js';

test('IT SAMPLES NOTHING: the model takes no world, only a word', () => {
  // The property that keeps it honest. A word is the whole input: the module
  // cannot be reading the grove because it is never handed the grove, and a
  // complete board comes back from a string alone.
  const g = makeLife('STAY');
  assert.ok(g.mask && g.cells && g.gen === 0, 'a full board out of one string');
  assert.equal(g.w, LIFE_W);
  assert.equal(g.h, LIFE_H);
  assert.match(SIM_NOTE, /MODEL/, 'and the window says so out loud');
  assert.match(SIM_NOTE, /not sampled/);
});

test('the floor is an ellipse, like the clearing', () => {
  const mask = floorMask(56, 26);
  const at = (x, y) => mask[y * 56 + x];
  assert.equal(at(28, 13), 1, 'the middle is floor');
  assert.equal(at(0, 0), 0, 'the corners are not');
  assert.equal(at(55, 25), 0);
  const lit = mask.reduce((a, b) => a + b, 0);
  const ratio = lit / (56 * 26);
  assert.ok(ratio > 0.6 && ratio < 0.85, `an ellipse fills about 3/4 of its box, got ${ratio}`);
});

test('her core stands at the back of the floor, as it does in the grove', () => {
  const c = corePos(56, 26);
  assert.ok(c.y > 26 / 2, 'south of centre');
  assert.equal(c.x, Math.round((56 - 1) / 2), 'and on the centre line');
  assert.equal(floorMask(56, 26)[c.y * 56 + c.x], 1, 'standing on lit ground');
});

test('IT OPENS ON THE WORD THE FLOOR SPELLS', () => {
  const g = makeLife('STAY');
  assert.ok(population(g) > 30, 'the word is there in cells');
  assert.equal(g.gen, 0);
  // The word sits across the middle, which is where the lumen writes it.
  let midRow = 0;
  for (let x = 0; x < g.w; x++) if (alive(g, x, Math.floor(g.h / 2))) midRow++;
  assert.ok(midRow > 4, 'and it is written across the floor, not in a corner');
});

test('the word is whatever it is given, so the app follows the floor', () => {
  const a = makeLife('STAY');
  const b = makeLife('STAY STAY');
  assert.ok(population(b) > population(a), 'a longer word lights more cells');
  assert.equal(population(makeLife('')), 0, 'and an empty one lights none');
});

test('CONWAY TAKES THE WORD APART', () => {
  // Which is the whole of the picture: she writes STAY and the rules eat it.
  const g = makeLife('STAY');
  const opening = [...g.cells];
  for (let i = 0; i < 30; i++) step(g);
  assert.equal(g.gen, 30);
  assert.notDeepEqual([...g.cells], opening, 'the board has moved');
  assert.ok(population(g) > 0, 'and it is not simply dead');
});

test('it is B3/S23 and nothing else', () => {
  // A blinker on the floor must blink, and come back after two generations.
  const g = makeLife('', 21, 21);
  const mid = 10;
  g.cells[mid * 21 + (mid - 1)] = 1;
  g.cells[mid * 21 + mid] = 1;
  g.cells[mid * 21 + (mid + 1)] = 1;
  const horizontal = [...g.cells];
  step(g);
  assert.ok(alive(g, mid, mid - 1) && alive(g, mid, mid + 1), 'it stood up');
  assert.ok(!alive(g, mid - 1, mid), 'and lay down');
  step(g);
  assert.deepEqual([...g.cells], horizontal, 'period two');
});

test('a block is still life', () => {
  const g = makeLife('', 21, 21);
  for (const [x, y] of [[10, 10], [11, 10], [10, 11], [11, 11]]) g.cells[y * 21 + x] = 1;
  const before = [...g.cells];
  step(g); step(g);
  assert.deepEqual([...g.cells], before);
});

test('the rim is an edge, not a wall of corpses', () => {
  // Cells outside the ellipse are no neighbours at all. If they counted as dead
  // neighbours the boundary would breed a crust, which the real floor does not.
  const g = makeLife('', 21, 21);
  assert.equal(g.mask[0], 0, 'the corner is off-floor');
  for (const [x, y] of [[1, 1], [2, 1], [1, 2]]) g.cells[y * 21 + x] = 1;
  for (let i = 0; i < 12; i++) step(g);
  for (let x = 0; x < 21; x++) {
    for (let y = 0; y < 21; y++) {
      if (!g.mask[y * 21 + x]) assert.ok(!alive(g, x, y), `life leaked off the floor at ${x},${y}`);
    }
  }
});

test('SHE WRITES THE WORD AGAIN WHEN THE BOARD STOPS', () => {
  // The one thing in the module that is not Conway. A settled board gets STAY
  // stamped back into it, indefinitely.
  const g = makeLife('', 41, 21);
  for (const [x, y] of [[20, 10], [21, 10], [20, 11], [21, 11]]) g.cells[y * 41 + x] = 1;
  g.word = 'STAY';
  for (let i = 0; i < STALL_LIMIT + 1; i++) step(g);
  assert.equal(g.restamps, 1, 'a still board is rewritten');
  assert.equal(g.stall, 0, 'and the count starts again');
});

test('a board that keeps moving is never rewritten', () => {
  const g = makeLife('', 21, 21);
  for (const [x, y] of [[9, 10], [10, 10], [11, 10]]) g.cells[y * 21 + x] = 1;
  g.word = 'STAY';
  for (let i = 0; i < 40; i++) step(g);
  assert.equal(g.restamps, 0, 'she does not interrupt a living board');
});

test('an empty board settles and is rewritten rather than staying dark', () => {
  const g = makeLife('', 41, 21);
  g.word = 'STAY';
  for (let i = 0; i < STALL_LIMIT + 2; i++) step(g);
  assert.ok(population(g) > 0, 'the window never sits blank');
});

test('stamping cannot write outside the floor', () => {
  const w = 21, h = 21;
  const mask = floorMask(w, h);
  const cells = new Uint8Array(w * h);
  stampWord(cells, 'STAY STAY STAY', w, h, mask);
  for (let i = 0; i < cells.length; i++) {
    if (cells[i]) assert.equal(mask[i], 1, 'a letter spilled off the lit ground');
  }
});
