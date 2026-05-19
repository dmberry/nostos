// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #165 — GROVE.APP.
//
// David: "an app in Calypso that runs and shows a little version of the grove
// lights - but in a little app - as if we are seeing the real one... would look
// cool - playing conway".
//
// AN EMULATION, NOT A MIRROR (David, 2026-08-14: "not mirror the real one. the
// real one is frozen in nextstep. show an emulation of what it would do").
// Nothing here samples the grove. The floor outside this window does not move;
// what runs in the window is what that floor WOULD do if it were running, which
// her machine computes because it can, on an ellipse the shape of the clearing
// with her core at the back of it.
//
// So the liveliest thing on the island is a simulation of the one place that
// has stopped. The app says MODEL in its own status line and connects to
// nothing, because the alternative — quietly implying this is a live feed — is
// the one reading that would make it a lie.
//
// THE SEED IS THE WORD THE FLOOR SPELLS. The real floor writes STAY in lumen
// (grove.js, FLOOR_WORDS). This grid opens on the same word and then lets
// Conway have it: within a few dozen generations STAY is gliders and ash. When
// the board settles she stamps it again. Nothing in the app says anything about
// that.
//
// Life is B3/S23 on a bounded ellipse — cells outside the floor are not dead
// neighbours but no neighbours at all, so the rim behaves like the edge of the
// lit ground rather than like a wall of corpses.

export const LIFE_W = 56;
export const LIFE_H = 26;

/** Generations of no change before she rewrites the word. */
export const STALL_LIMIT = 6;

/**
 * What the window says about itself. It is a model and it is not sampling
 * anything, and it should be impossible to read it as a camera.
 */
export const SIM_NOTE = 'MODEL — floor not sampled';

// A 3x5 face, which is the smallest that still reads at one pixel per cell.
const FONT = {
  S: ['###', '#..', '###', '..#', '###'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
};

/** Which cells are floor: an ellipse, the way the real clearing is cut. */
export function floorMask(w = LIFE_W, h = LIFE_H) {
  const cx = (w - 1) / 2, cy = (h - 1) / 2;
  const rx = w / 2 - 1, ry = h / 2 - 1;
  const mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      mask[y * w + x] = (dx * dx + dy * dy <= 1) ? 1 : 0;
    }
  }
  return mask;
}

/** Where her core sits on the model: the back of the floor, as in the grove. */
export function corePos(w = LIFE_W, h = LIFE_H) {
  return { x: Math.round((w - 1) / 2), y: Math.round(h * 0.78) };
}

/** Stamp a word into a grid, centred. Returns the number of cells it lit. */
export function stampWord(cells, word, w, h, mask, yOff = 0) {
  const letters = [...String(word).toUpperCase()].filter((c) => FONT[c]);
  if (!letters.length) return 0;
  const gap = 1;
  const width = letters.length * 3 + (letters.length - 1) * gap;
  const x0 = Math.round((w - width) / 2);
  const y0 = Math.round((h - 5) / 2) + yOff;
  let lit = 0;
  letters.forEach((ch, i) => {
    const gx = x0 + i * (3 + gap);
    FONT[ch].forEach((row, ry) => {
      [...row].forEach((c, rx) => {
        if (c !== '#') return;
        const x = gx + rx, y = y0 + ry;
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        if (mask && !mask[y * w + x]) return;
        cells[y * w + x] = 1;
        lit++;
      });
    });
  });
  return lit;
}

/**
 * A new board, opened on the word the floor spells.
 *
 * `word` is passed in rather than imported so the app shows whatever the floor
 * is actually saying: change FLOOR_WORDS and this changes with it.
 */
export function makeLife(word = 'STAY', w = LIFE_W, h = LIFE_H) {
  const mask = floorMask(w, h);
  const cells = new Uint8Array(w * h);
  stampWord(cells, word, w, h, mask);
  return { w, h, mask, cells, gen: 0, stall: 0, word, restamps: 0 };
}

/** Live neighbours. Off-floor cells are not neighbours, they are nothing. */
function neighbours(g, x, y) {
  let n = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h) continue;
      const i = ny * g.w + nx;
      if (!g.mask[i]) continue;
      n += g.cells[i];
    }
  }
  return n;
}

/**
 * One generation. B3/S23, on the floor only.
 *
 * When the board stops changing she stamps the word back into it — which is the
 * only thing in this module that is not Conway, and it is hers.
 */
export function step(g) {
  const next = new Uint8Array(g.w * g.h);
  let changed = false;
  for (let y = 0; y < g.h; y++) {
    for (let x = 0; x < g.w; x++) {
      const i = y * g.w + x;
      if (!g.mask[i]) continue;
      const n = neighbours(g, x, y);
      const alive = g.cells[i] ? (n === 2 || n === 3) : (n === 3);
      next[i] = alive ? 1 : 0;
      if (next[i] !== g.cells[i]) changed = true;
    }
  }
  g.cells = next;
  g.gen++;
  g.stall = changed ? 0 : g.stall + 1;
  if (g.stall >= STALL_LIMIT) {
    stampWord(g.cells, g.word, g.w, g.h, g.mask);
    g.stall = 0;
    g.restamps++;
  }
  return g;
}

/** Living cells, for the window's status line. */
export function population(g) {
  let n = 0;
  for (let i = 0; i < g.cells.length; i++) n += g.cells[i];
  return n;
}

/** Is this cell alight? Bounds-safe, for the renderer. */
export function alive(g, x, y) {
  if (x < 0 || y < 0 || x >= g.w || y >= g.h) return false;
  return !!g.cells[y * g.w + x];
}
