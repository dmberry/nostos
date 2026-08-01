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

/**
 * HOW DEEP THE GROUND GOES (David, 2026-08-17: "we need to fix the depth cubes
 * - to stop this problem. so dirt four cubes deep", and 2026-08-16: "if you
 * gave 4 blocks beneath with dirt - then it would always be covered").
 *
 * A tile used to be ONE block thick, and that is the root of a whole family of
 * artefacts: any time the camera can see the side of something — a step, an
 * arch, the tile behind a raised block — the face has to reach down past the
 * bottom of a column that has nothing under it, and what is painted there is
 * whatever the renderer guesses. It has been patched twice (the black abyss in
 * v1.564, the clear colour in v1.565) and the patches are nets, not floors.
 *
 * Four blocks of soil under every tile removes the question instead of
 * answering it: there is always material below, so a face always has something
 * to be. It also draws better — a hillside is now a lip of grass or sand over a
 * band of earth, which is what a cut bank looks like.
 */
export const GROUND_DEPTH = 4;

/** The underside of an ordinary tile. Its lid is the surface you walk on. */
export const GROUND_BASE = -GROUND_DEPTH;

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

/**
 * An ordinary tile: a plinth of earth with one block of its own material on
 * top, and nothing above it.
 *
 * The surface is ONE block deep and the rest is soil, so painting a tile still
 * changes only what you can see. A tile whose surface IS dirt is one run of
 * four, because a seam between dirt and dirt is a line that is not there.
 */
export function simpleColumn(mat, top = 0) {
  const base = top - GROUND_DEPTH;
  if (mat === 'dirt') return { base, runs: [{ mat: 'dirt', n: GROUND_DEPTH }] };
  return { base, runs: [{ mat: 'dirt', n: GROUND_DEPTH - 1 }, { mat, n: 1 }] };
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
  if (!col || !col.runs.length) return false;
  if (col.base !== columnTop(col) - GROUND_DEPTH) return false;
  // One run of four: a tile of plain earth.
  if (col.runs.length === 1) return col.runs[0].mat === 'dirt' && col.runs[0].n === GROUND_DEPTH;
  // Or the plinth and its lid, which is every other ordinary tile.
  if (col.runs.length !== 2) return false;
  const [under, top] = col.runs;
  return under.mat === 'dirt' && under.n === GROUND_DEPTH - 1 && !!top.mat && top.n === 1;
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
  // AN ORDINARY TILE MOVES WHOLE. The ground is a four-deep plinth with its own
  // material on the lid, and a hill is that same plinth higher up — not a
  // stretched surface run over a base left behind at sea level. Rebuilding it
  // is what keeps a raised tile expressible as a floor and a height, which is
  // the whole reason the two typed arrays can still hold the island.
  if (isSimple(col)) {
    const fresh = simpleColumn(mat, top);
    col.base = fresh.base;
    col.runs = fresh.runs;
    return col;
  }
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
  if (!col.runs.length) { const f = simpleColumn(mat, top); col.base = f.base; col.runs = f.runs; return col; }
  // Cut down into the plinth, the tile is bare earth with no surface left on
  // it. Give it its own material back as a lid: a lowered grass tile is still
  // grass, which is what every caller of this has always assumed.
  const lastRun = col.runs[col.runs.length - 1];
  if (lastRun.mat !== mat) {
    if (lastRun.n > 1) { lastRun.n -= 1; col.runs.push({ mat, n: 1 }); }
    else lastRun.mat = mat;
  }
  return col;
}

/** Repaint the top face without moving it — the old `setFloor`, exactly. */
export function setColumnSurface(col, mat) {
  for (let i = col.runs.length - 1; i >= 0; i--) {
    const r = col.runs[i];
    if (!r.mat) continue;
    if (r.mat === mat) return col;
    // ONE LEVEL, NOT THE WHOLE RUN. Painting a tile sand is a change to its
    // surface; it does not turn the four levels of earth under it into sand.
    // Repainting the run entire also broke the cheap-tile shape — a plinth of
    // sand is not a plinth — and every ordinary tile would have moved out of
    // the typed arrays and into the exceptions Map.
    if (r.n > 1) { r.n -= 1; col.runs.splice(i + 1, 0, { mat, n: 1 }); }
    else r.mat = mat;
    return col;
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

/**
 * Put one solid block at level `z` — the block spanning `[z-1, z)` (#186).
 *
 * THIS IS WHAT AN ARCH IS MADE OF. Everything else here grows a column from its
 * top: `pushBlock` stacks, `popBlock` unstacks, and neither can put anything
 * beside something at a height without also filling in everything under it. A
 * span across a gap needs a block placed AT a level with air left below it, and
 * that is the only thing this does.
 *
 * Padding with air when the column is short is the whole trick: a tile whose
 * top is at 0 and a block asked for at 3 becomes ground, two levels of nothing,
 * then the block — which read from the side is a lintel with a doorway under
 * it. Placing into a level that is already solid is refused rather than
 * silently repainting it, because the caller meant an empty space.
 */
export function setBlockAt(col, z, mat) {
  if (!col || !col.runs || !mat) return false;
  if (z <= col.base) return false;            // below the tile's own underside
  if (solidAt(col, z)) return false;          // something is already there
  const top = columnTop(col);
  if (z > top) {
    if (z - 1 > top) pushGap(col, z - 1 - top);
    pushBlock(col, mat);
    return true;
  }
  // Inside an existing gap: split the run of air the block lands in.
  let lo = col.base;
  for (let i = 0; i < col.runs.length; i++) {
    const r = col.runs[i];
    const hi = lo + r.n;
    if (z > lo && z <= hi) {
      if (r.mat) return false;                 // solid after all — caller is wrong
      const below = z - 1 - lo;                // air left under the new block
      const above = hi - z;                    // air left over it
      const parts = [];
      if (below > 0) parts.push({ mat: null, n: below });
      parts.push({ mat, n: 1 });
      if (above > 0) parts.push({ mat: null, n: above });
      col.runs.splice(i, 1, ...parts);
      return true;
    }
    lo = hi;
  }
  return false;
}
