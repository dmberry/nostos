// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE MACHINE GALLERY'S PICTURES.
//
// Each chip in the help panel's Machines tab is the robot drawn by the same
// code that draws it in the world, rather than an icon kept beside it that
// could drift out of sync.
//
// It lived in main.js, which meant the help panel opened from the TITLE screen
// showed eleven broken-image icons: the gate runs before main.js is fetched, so
// nothing had drawn them. It is here now because two callers need it and
// neither should own it.

import { drawRobot, KINGS } from './robots.js';
import { drawWaterDroid } from './waterdroids.js';
import { worldToScreen } from '../engine/iso.js';

/** Every machine the gallery shows, in the order the panel lists them. */
export const GALLERY_TYPES = ['t1', 't1w', 't2', 't3', 't8', 'w1', 'w2', 'w3', 'w4', 'w5',
  'v1', 'v5', 'm4', 'm5', 'm6', 'b1', 'b2', 'b3', 'b4'];

/** The AGAMEMNON marks: one chassis, four kings, told apart by their metal. */
const KING_MARKS = new Set(['b1', 'b2', 'b3', 'b4']);

/** One machine, drawn to a data URL at gallery size. */
export function renderMachineIcon(type) {
  const size = 72;
  // AUTO-FIT, MEASURED. Every chassis is a different height and the B-1 is drawn
  // at its own scale on top of the common one, so a single hand-picked zoom
  // cropped it on every side and every guess at a better number cropped it
  // somewhere else (David, 2026-08-15). Draw once oversized, measure the ink
  // that actually landed, then draw again scaled to that. No per-type table,
  // and a new machine fits its tile the day it is added.
  const PAD = 3;
  const probe = 240;
  const off = document.createElement('canvas');
  off.width = probe; off.height = probe;
  const octx = off.getContext('2d', { willReadFrequently: true });
  const paint = (ctx, scale, ox, oy) => {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    if (type === 'w2') {
      drawWaterDroid(ctx, { type: 'w2', x: 0, y: 0, dead: false, z: 0.5, animT: 1.2, aggro: false, facing: { x: 0, y: 1 } }, worldToScreen);
    } else {
      drawRobot(ctx, {
        type: KING_MARKS.has(type) ? 'b1' : type, x: 0, y: 0, dead: false, fused: false, drained: false, disabledT: 0,
        friendly: false, aggro: type === 'w1' || type === 'w4', zombie: false, stuck: false,
        facing: { x: 0, y: 1 }, animT: 1.5, walkPhase: 0.6,
        // #159: the B-1 is drawn from its own state — full hull, shield up — so
        // the chip shows the machine as you first meet it rather than a stripped
        // one. `designation` gives the T-1w its lowercase w (and its darker shell).
        ...(KING_MARKS.has(type) ? kingProps(type) : {}),
        ...(type === 't1w' ? { designation: 'T1w' } : {}),
        // #165: the two V-class minds share a chassis, so the chips are told
        // apart by their plate — V1 the courier, V5 the gardener.
        ...(type === 'v5' ? { type: 'v1', designation: 'V5', gardener: true } : {}),
      }, worldToScreen);
    }
    ctx.restore();
  };

  paint(octx, PROBE_SCALE, probe / 2, probe * 0.72);
  const box = inkBounds(octx, probe, probe);

  const out = document.createElement('canvas');
  out.width = size; out.height = size;
  const c = out.getContext('2d');
  if (!box) { paint(c, 1.6, size / 2, size * 0.78); return out.toDataURL('image/png'); }
  // ONE SCALE FOR THE WHOLE SET, not one per machine.
  //
  // Fitting each chassis to its own tile made a T-1 — a low wide thing — fill
  // its box edge to edge while a tall narrow T-3 sat correctly, so the swarm
  // unit looked bigger than the sniper (David, 2026-08-15: "the T1s are too big
  // now"). Worse, it threw away the one thing the gallery is for: these
  // machines are different SIZES, and a player should be able to see that a
  // carrier dwarfs a T-1 by looking at the two chips.
  //
  // So the biggest machine in the roster sets the zoom and everybody is drawn
  // at it. Each still gets its own vertical centring, because a tall machine
  // and a flat one do not sit at the same height on the tile.
  //
  // EXCEPT THE CARRIER (David, 2026-08-15: "shared except for B1"). It is so
  // much larger than the roster that letting it set the ruler would shrink
  // every other machine to a smudge to make room for one chip. There is one to
  // an island and it is the boss; it is fitted to its own tile, and the reader
  // loses nothing because there is nothing beside it to compare it with.
  const k = KING_MARKS.has(type)
    ? Math.min((size - PAD * 2) / box.w, (size - PAD * 2) / box.h) * PROBE_SCALE
    : commonScale();
  paint(c, k, size / 2 - (box.cx - probe / 2) * (k / PROBE_SCALE),
        size / 2 - (box.cy - probe * 0.72) * (k / PROBE_SCALE));
  return out.toDataURL('image/png');
}

const PROBE_SCALE = 2.4;
let _commonScale = 0;

/**
 * The zoom at which the LARGEST machine fits its tile. Measured once over the
 * whole roster and cached, so every chip is drawn to the same ruler.
 */
function commonScale() {
  if (_commonScale) return _commonScale;
  const size = 72, PAD = 3, probe = 240;
  let worst = 1;
  for (const t of GALLERY_TYPES) {
    if (KING_MARKS.has(t)) continue;   // the kings are fitted on their own, see above
    const box = measureType(t, probe);
    if (!box) continue;
    // What this one would need to fit. The smallest such number across the
    // roster is the one that fits all of them.
    worst = Math.min(worst === 1 ? Infinity : worst,
      Math.min((size - PAD * 2) / box.w, (size - PAD * 2) / box.h));
  }
  _commonScale = (Number.isFinite(worst) ? worst : 0.4) * PROBE_SCALE;
  return _commonScale;
}

/**
 * A king shown as you first meet it: full hull, rim up, and its own metal. The
 * mark rides on `designation`, which is what drawB1 reads to pick the palette.
 */
function kingProps(mark) {
  const K = KINGS[mark] || KINGS.b1;
  return {
    designation: mark.toUpperCase(),
    metal: K.metal, metalHi: K.hi, metalLo: K.lo,
    hp: 60, maxHp: 60,
    shieldHp: Math.round(34 * (K.shield || 1)), shieldMax: Math.round(34 * (K.shield || 1)),
    shieldScale: K.shield || 1,   // layers of rim (Ajax's sevenfold)
    rimScale: K.rim || 1,         // how big the disc is drawn
    shieldScale: K.shield || 1,      // Ajax's tower shield is drawn at its real size

    engageT: 0,
  };
}

/** Draw one chassis oversized and report the ink it lands, for the shared ruler. */
function measureType(type, probe) {
  const off = document.createElement('canvas');
  off.width = probe; off.height = probe;
  const ctx = off.getContext('2d', { willReadFrequently: true });
  ctx.save();
  ctx.translate(probe / 2, probe * 0.72);
  ctx.scale(PROBE_SCALE, PROBE_SCALE);
  if (type === 'w2') {
    drawWaterDroid(ctx, { type: 'w2', x: 0, y: 0, dead: false, z: 0.5, animT: 1.2, aggro: false, facing: { x: 0, y: 1 } }, worldToScreen);
  } else {
    drawRobot(ctx, {
      type: KING_MARKS.has(type) ? 'b1' : type, x: 0, y: 0,
      dead: false, fused: false, drained: false, disabledT: 0,
      friendly: false, aggro: false, zombie: false, stuck: false,
      facing: { x: 0, y: 1 }, animT: 1.5, walkPhase: 0.6,
      ...(KING_MARKS.has(type) ? kingProps(type) : {}),
      ...(type === 't1w' ? { designation: 'T1w' } : {}),
      ...(type === 'v5' ? { type: 'v1', designation: 'V5', gardener: true } : {}),
    }, worldToScreen);
  }
  ctx.restore();
  return inkBounds(ctx, probe, probe);
}

/** The bounding box of everything actually painted, or null for a blank canvas. */
function inkBounds(ctx, w, h) {
  const d = ctx.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] < 8) continue;       // effectively transparent
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return null;
  return { w: x1 - x0 + 1, h: y1 - y0 + 1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

/**
 * Fill the gallery's <img> elements, once. Idempotent and cheap to call again:
 * a chip that already has a picture is left alone, so the gate filling them at
 * the title and main.js filling them at boot do not draw the roster twice.
 */
export function fillMachineGallery(root = document) {
  for (const type of GALLERY_TYPES) {
    const img = root.querySelector(`#gal-${type}`) || document.getElementById(`gal-${type}`);
    if (img && !img.src) img.src = renderMachineIcon(type);
  }
}
