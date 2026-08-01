// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// Isometric projection maths. World units are tiles: (x, y) with integer
// values at tile corners. Screen space uses classic 2:1 diamonds.

export const TILE_W = 64;
export const TILE_H = 32;
// Screen pixels a tile lifts per height level. The renderer draws hill tiles and
// everything on them raised by this; the camera reads it to keep the player
// centred when they climb (otherwise a lifted sprite walks off the top of view).
export const ELEV = 16;
// TRIED AT 32 AND REVERTED (2026-08-16). A true cube on a 64x32 diamond wants a
// 32px vertical edge, and at 32 a hand-placed block finally reads as a cube —
// but every generated hill becomes a sheer mesa with the same change, and the
// five islands' terrain was authored for gentle single-level rises. Ogygia came
// out a field of towers with trees balanced on them. If blocks are to be cubes,
// the way is a PLACED BLOCK BEING TWO LEVELS THICK, not a taller level: one
// vertical scale for the whole world, and only the build tool's unit changes.
//
// Screen pixels a JUMP lifts the sprite per unit of `z`. Terrain height and jump
// height are two different currencies that both end up as pixels, and the
// conversion between them lives here rather than as a 0.5 somewhere in the
// player: `ELEV / Z_PX` is how many z-units one whole level is worth.
export const Z_PX = 32;

const HW = TILE_W / 2;
const HH = TILE_H / 2;

export function worldToScreen(x, y) {
  return { x: (x - y) * HW, y: (x + y) * HH };
}

export function screenToWorld(sx, sy) {
  return { x: (sx / HW + sy / HH) / 2, y: (sy / HH - sx / HW) / 2 };
}

// Screen-space movement intent -> world-space direction, so that pressing
// "up" moves the character up the screen rather than along a world axis.
// Screen right = world (+x, -y), screen down = world (+x, +y).
export function screenDirToWorld(dx, dy) {
  const wx = dx + dy;
  const wy = dy - dx;
  const len = Math.hypot(wx, wy);
  if (len === 0) return { x: 0, y: 0 };
  return { x: wx / len, y: wy / len };
}

/**
 * Which recorded tile is under a canvas point (docs/terrain-3d-plan.md, stage 3).
 *
 * The prism pass records the centre of every top face it paints, in iso space,
 * along with the matrix it painted them under. This inverts that matrix and
 * finds the tile — so picking is a lookup on what was drawn rather than a
 * second implementation of the projection kept in step by hand. The two used to
 * be separate and stopped agreeing the moment terrain could be six steps tall.
 *
 * `scale` carries CSS pixels into the matrix's space: the canvas backing store
 * is `w * devicePixelRatio` wide, so the transform is in DEVICE pixels while
 * every pointer the game handles is in CSS pixels. At dpr 2 that is a factor of
 * two, and it picks a tile seven rows out.
 *
 * BACK TO FRONT, first hit wins. Paint order is depth order, so the last prism
 * painted over a pixel is the one you are looking at; that is what makes a tall
 * block in front of low ground pick the block and not the ground.
 *
 * Lives here rather than in the renderer because it is projection arithmetic
 * and this module has no DOM in it — which is the only reason it can be tested.
 */
export function pickTile(hits, xf, px, py, scale = 1) {
  if (!hits || !hits.length) return null;
  let ix = px * scale, iy = py * scale;
  if (xf) {
    const det = xf.a * xf.d - xf.b * xf.c;
    if (!det) return null;
    const dx = px * scale - xf.e, dy = py * scale - xf.f;
    ix = (dx * xf.d - dy * xf.c) / det;
    iy = (dy * xf.a - dx * xf.b) / det;
  }
  for (let i = hits.length - 1; i >= 0; i--) {
    const t = hits[i];
    // A SIDE FACE IS A THING YOU CAN POINT AT (#186). A face records its four
    // corners rather than a centre, because it is a parallelogram standing on
    // the ground plane and the diamond test says nothing about it. Pointing at
    // one is how you place a block BESIDE a block instead of on top of it,
    // which is the only way to build an arch.
    if (t.quad) { if (pointInQuad(ix, iy, t.quad)) return t; continue; }
    // Exact for a 2:1 diamond: the unit ball of the L1 norm on the tile's axes.
    if (Math.abs(ix - t.x) / HW + Math.abs(iy - t.y) / HH <= 1) return t;
  }
  return null;
}

/** Is this point inside the convex quad? Same winding throughout, so one sign. */
export function pointInQuad(px, py, q) {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = q[i], b = q[(i + 1) % 4];
    const cross = (b.x - a.x) * (py - a.y) - (b.y - a.y) * (px - a.x);
    if (cross === 0) continue;
    const s = cross > 0 ? 1 : -1;
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}
