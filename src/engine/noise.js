// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// Deterministic noise, kept out of the renderer so it can be tested.
//
// renderer.js cannot be imported under `node --test` — it touches Image and
// document at class-definition time — so anything in there is verified only by
// looking at the screen. The purge fog's field has properties that a look does
// not check reliably (that it is smooth rather than snow, that it varies rather
// than sitting flat, that it repeats frame to frame), so it lives here.

// Cheap deterministic hash for per-tile pseudo-randomness (grass blades,
// lattice corners) that stays put frame to frame instead of shimmering like
// Math.random(). Integer in, [0,1) out.
export function tileHash(x, y) {
  let h = (x * 374761393 + y * 668265263) ^ (x * 3266489917);
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

// Smooth value noise over that lattice: a value per integer corner, eased
// between them. Smooth in space, which a bare hash is not — sampling a hash per
// screen cell reads as television snow.
export function valueNoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = tileHash(xi, yi), b = tileHash(xi + 1, yi);
  const c = tileHash(xi, yi + 1), d = tileHash(xi + 1, yi + 1);
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
}

// Two octaves: the first gives the banks, the second breaks their edges up so
// they do not read as a repeating blob. Offset the second so the two do not
// share their lattice corners and cancel.
export function fogNoise(x, y) {
  return 0.66 * valueNoise(x, y) + 0.34 * valueNoise(x * 2.31 + 19.7, y * 2.31 - 8.3);
}

// The purge fog's field, in the projection units worldToScreen returns (a world
// tile is HW across). BANK is how wide a thick patch runs; WIND is how fast the
// whole field slides, which is what makes it weather rather than a filter on
// the camera.
export const FOG_BANK = 190;      // ~6 tiles between thick and thin
export const FOG_WIND_X = 15;     // projection units per second
export const FOG_WIND_Y = 6;
export const FOG_STEP = 14;       // screen px per sampled cell; the rest is bilinear
