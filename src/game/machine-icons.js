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

import { drawRobot } from './robots.js';
import { drawWaterDroid } from './waterdroids.js';
import { worldToScreen } from '../engine/iso.js';

/** Every machine the gallery shows, in the order the panel lists them. */
export const GALLERY_TYPES = ['t1', 't2', 't3', 'w1', 'w2', 'w3', 'w4', 'w5', 'm4', 'm5', 'm6'];

/** One machine, drawn to a data URL at gallery size. */
export function renderMachineIcon(type) {
  const size = 96;
  const off = document.createElement('canvas');
  off.width = size; off.height = size;
  const octx = off.getContext('2d');
  // Scale the world-space robot draw up so it fills the box: at 1:1 the
  // renderer draws a machine at its ~30px in-world size, which sits lost in
  // the middle of a 96px chip. 1.9x brings it up close to the edges without
  // clipping the tallest ones (the W-class towers).
  octx.translate(size / 2, size * 0.82);
  octx.scale(1.9, 1.9);
  if (type === 'w2') {
    drawWaterDroid(octx, { type: 'w2', x: 0, y: 0, dead: false, z: 0.5, animT: 1.2, aggro: false, facing: { x: 0, y: 1 } }, worldToScreen);
  } else {
    drawRobot(octx, {
      type, x: 0, y: 0, dead: false, fused: false, drained: false, disabledT: 0,
      friendly: false, aggro: type === 'w1' || type === 'w4', zombie: false, stuck: false,
      facing: { x: 0, y: 1 }, animT: 1.5, walkPhase: 0.6,
    }, worldToScreen);
  }
  return off.toDataURL('image/png');
}

/**
 * Fill the gallery's <img> elements, once. Idempotent and cheap to call again:
 * a chip that already has a picture is left alone, so the gate filling them at
 * the title and main.js filling them at boot do not draw eleven robots twice.
 */
export function fillMachineGallery(root = document) {
  for (const type of GALLERY_TYPES) {
    const img = root.querySelector(`#gal-${type}`) || document.getElementById(`gal-${type}`);
    if (img && !img.src) img.src = renderMachineIcon(type);
  }
}
