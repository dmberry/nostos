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
// The map was a heightmap wearing a costume: one material and one height per
// tile, and the vertical faces of a hill painted afterwards as fills between
// two heights. A tile WAS its top surface — there was nothing under it and
// nothing above it — so a stone block on grass, a bridge, or anything you could
// walk under was not a thing the data could say (David, 2026-08-15: "clearly
// bodged to make it work, but is not scalable as currently implemented").
//
// A COLUMN IS A STACK OF RUNS, bottom-up. `base` is the level of the underside
// of the first run; each run is `{mat, n}` for n whole levels of one material,
// and `mat: null` is AIR — which is the whole of what makes a bridge possible,
// since a heightmap has no holes to put one in.
//
//   { base: -1, runs: [{mat: 'grass', n: 1}] }        flat grass, top face at 0
//   { base: -1, runs: [{mat: 'grass', n: 4}] }        the same tile raised to 3
//   { base: -1, runs: [{mat: 'stone', n: 3},
//                      {mat: 'grass', n: 1}] }        grass laid over stone
//   { base: -1, runs: [{mat: 'stone', n: 1},
//                      {mat: null,    n: 2},
//                      {mat: 'boards',n: 1}] }        a walkway with a gap under it
//
// EVERY TILE IS AT LEAST ONE BLOCK THICK, and the ground you walk on is that
// block's top face. It is why `base` is -1 for ordinary ground: the world's
// floor is the lid of the soil, not a plane hanging in nothing. Lowering a tile
// below its neighbours moves `base` down with it, so a hollow is as
// representable as a hill and neither is a special case.
//
// PURE. No canvas, no map object, no game: a column and a level go in, an
// answer comes out. src/game/map.js owns where columns are kept and keeps the
// old accessors answering exactly as they did — see `isSimple`, which is what
// lets the overwhelming majority of tiles stay in the two typed arrays they
// have always lived in and cost nothing at all.

/** The underside of an ordinary tile: ground is one block of soil, lid at 0. */
export const GROUND_BASE = -1;

/** A column's top surface: the level you stand on. */
export function columnTop(col) {
  if (!col || !col.runs || !col.runs.length) return 0;
  let t = col.base;
  for (const r of col.runs) t += r.n;
  return t;
}

/**
 * The material of the top face — what the tile IS, to anything that asks the
 * old question. Air on top is not a surface, so the search skips it: a column
 * whose last run is a gap reports the solid below it, which is what you would
 * be standing on.
 */
export function columnSurface(col) {
  if (!col || !col.runs) return null;
  for (let i = col.runs.length - 1; i >= 0; i--) {
    if (col.runs[i].mat) return col.runs[i].mat;
  }
  return null;
}

/** An ordinary tile: one material, one top level, nothing under or above it. */
export function simpleColumn(mat, top = 0) {
  return { base: top - 1, runs: [{ mat, n: 1 }] };
}

/**
 * Is this column expressible as a floor type and a height, and nothing more?
 *
 * THE WHOLE COMPATIBILITY STORY HANGS ON THIS. A simple column is exactly what
 * the two typed arrays in map.js have always held, so it does not need storing
 * as a column at all — which is why building on one tile costs one Map entry
 * rather than a second copy of the island.
 */
export function isSimple(col) {
  return !!col && col.runs.length === 1 && !!col.runs[0].mat;
}

/** A deep copy, so callers can hand a column about without aliasing the store. */
export function cloneColumn(col) {
  return { base: col.base, runs: col.runs.map((r) => ({ mat: r.mat, n: r.n })) };
}

/**
 * Move the top surface to `top`, growing or shrinking from the top down.
 *
 * Growing thickens the topmost SOLID run, which is what makes raising a grass
 * tile give you more grass rather than a grass lid on a column of nothing.
 * Shrinking eats runs off the top and takes gaps with it; a column shrunk past
 * everything it had becomes one block of its old surface material at the new
 * level, so a tile can always be dug down and still be ground.
 */
export function setColumnTop(col, top) {
  const mat = columnSurface(col) || 'grass';
  let cur = columnTop(col);
  if (cur === top) return col;
  if (top > cur) {
    const last = col.runs[col.runs.length - 1];
    if (last && last.mat) last.n += top - cur;
    else col.runs.push({ mat, n: top - cur });
    return col;
  }
  while (cur > top && col.runs.length) {
    const last = col.runs[col.runs.length - 1];
    const drop = Math.min(last.n, cur - top);
    last.n -= drop;
    cur -= drop;
    if (last.n <= 0) col.runs.pop();
  }
  if (!col.runs.length) { col.base = top - 1; col.runs.push({ mat, n: 1 }); }
  return col;
}

/** Repaint the top face without moving it — the old `setFloor`, exactly. */
export function setColumnSurface(col, mat) {
  for (let i = col.runs.length - 1; i >= 0; i--) {
    if (col.runs[i].mat) { col.runs[i].mat = mat; return col; }
  }
  col.runs.push({ mat, n: 1 });
  return col;
}

/**
 * Put one block of `mat` on top. The build tool's PLACE.
 *
 * Merges into the run below when the material matches, so a tower of ten grass
 * blocks is one run of ten rather than ten runs of one — the renderer draws a
 * run as a single face, and a stack that remembers every click would draw ten
 * seams up a wall that has none.
 */
export function pushBlock(col, mat, n = 1) {
  const last = col.runs[col.runs.length - 1];
  if (last && last.mat === mat) last.n += n;
  else col.runs.push({ mat, n });
  return col;
}

/** Take one block off the top. The build tool's BREAK. Never empties a column. */
export function popBlock(col, n = 1) {
  let left = n;
  while (left > 0 && col.runs.length) {
    const last = col.runs[col.runs.length - 1];
    const take = Math.min(last.n, left);
    last.n -= take;
    left -= take;
    if (last.n <= 0) col.runs.pop();
  }
  if (!col.runs.length) {
    // Digging out the last block leaves ground one level lower, not a hole in
    // the world: there is no representation for a tile that is not there, and
    // inventing one would mean every caller learning about it.
    col.base -= 1;
    col.runs.push({ mat: 'dirt', n: 1 });
  }
  return col;
}

/** Add a gap — air — on top, which is how a bridge gets something to span. */
export function pushGap(col, n = 1) {
  const last = col.runs[col.runs.length - 1];
  if (last && !last.mat) last.n += n;
  else col.runs.push({ mat: null, n });
  return col;
}

/**
 * Is the block whose TOP FACE is at level `z` solid?
 *
 * LEVELS COUNT LIDS, NOT SLABS, everywhere in this file — because everywhere
 * else in the game a height is a surface you stand on (`heightAt` returns one,
 * `columnTop` returns one), and a second convention counting the undersides
 * would be an off-by-one waiting at every call site. So the block that spans
 * `[z-1, z)` is "the block at z", and its lid is the ground at z.
 */
export function solidAt(col, z) {
  if (!col || !col.runs) return false;
  let lo = col.base;
  for (const r of col.runs) {
    if (z > lo && z <= lo + r.n) return !!r.mat;
    lo += r.n;
  }
  return false;
}

/**
 * The surface you would stand on at or below `z` — the top of the highest solid
 * run whose lid is no higher than your feet.
 *
 * This is what walking under a bridge is made of: standing at 0 under a walkway
 * whose deck is at 3, the answer is 0, and the deck is simply something over
 * your head. `null` when there is nothing at all below you.
 */
export function surfaceBelow(col, z) {
  if (!col || !col.runs) return null;
  let best = null;
  let lo = col.base;
  for (const r of col.runs) {
    const lid = lo + r.n;
    if (r.mat && lid <= z) best = lid;
    lo = lid;
  }
  return best;
}

/**
 * The runs as drawable slabs: `{mat, from, to}` bottom-up, gaps dropped.
 *
 * The renderer wants faces, not bookkeeping, and it must not have to know how
 * a column stores itself — that separation is the point of the whole file, and
 * the reason the picker can be handed the same geometry the draw pass used.
 */
export function slabs(col) {
  const out = [];
  if (!col || !col.runs) return out;
  let lo = col.base;
  for (const r of col.runs) {
    if (r.mat) out.push({ mat: r.mat, from: lo, to: lo + r.n });
    lo += r.n;
  }
  return out;
}

// ---- persistence ------------------------------------------------------------
//
// A column serialises as `[base, mat, n, mat, n, ...]`, with air written as a
// null material. Terse on purpose: this rides the island save, one entry per
// tile somebody has actually built on, and a run-length list is already the
// compressed form of what a player did.

export function packColumn(col) {
  const out = [col.base];
  for (const r of col.runs) { out.push(r.mat); out.push(r.n); }
  return out;
}

export function unpackColumn(a) {
  if (!Array.isArray(a) || a.length < 3) return null;
  const col = { base: a[0], runs: [] };
  for (let i = 1; i + 1 < a.length; i += 2) {
    const n = a[i + 1];
    if (typeof n === 'number' && n > 0) col.runs.push({ mat: a[i] ?? null, n });
  }
  return col.runs.length ? col : null;
}

/**
 * The surface a walker at `feetZ` would move onto in this column (stage 5).
 *
 * The highest run lid you could reach: no more than `maxStep` above your feet,
 * and with nothing solid sitting on top of it. `null` when there is nothing
 * reachable, which the caller reads as "blocked" — a wall is exactly a column
 * whose only lid is out of reach.
 *
 * THIS IS THE WHOLE OF WALKING UNDER THINGS. Standing at 0 beneath a deck at 3,
 * the deck is four steps up and out of reach, so the answer is the ground and
 * you walk under it; standing ON the deck, the deck is the reachable lid and
 * you walk along it. One rule, and the bridge falls out of it rather than being
 * a case anybody had to write.
 *
 * A column with no interior air answers exactly what `heightAt` always did —
 * its one lid, if you can reach it — so ordinary ground is unaffected, which is
 * what makes this safe to put underneath a movement system already in play.
 */
export function standOn(col, feetZ, maxStep = 1, headroom = 1) {
  if (!col || !col.runs || !col.runs.length) return null;
  const ceiling = feetZ + maxStep;
  let best = null;
  let lo = col.base;
  for (let i = 0; i < col.runs.length; i++) {
    const r = col.runs[i];
    const lid = lo + r.n;
    // ROOM FOR A BODY, not just a foot (David, 2026-08-16: "you should check
    // that the character can fit! they are 2 blocks high?"). A lid is only
    // somewhere to stand if the levels ABOVE it are clear for the whole height
    // of whoever is standing there — one block of clearance is a crawlspace,
    // and a two-block walker cannot use it. Checking only the block directly on
    // top let a deck two levels up read as walkable ground underneath.
    let fits = !!r.mat && lid <= ceiling;
    for (let k = 1; fits && k <= headroom; k++) if (solidAt(col, lid + k)) fits = false;
    if (fits) best = lid;
    lo = lid;
  }
  return best;
}
