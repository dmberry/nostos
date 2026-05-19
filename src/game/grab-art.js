// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// Grab's camera, as an image rather than a drawing.
//
// PROVENANCE, and a question for whoever ships this. The frames in
// assets/media/grab/ are converted from the resources of Grab.app — Keith
// Ohlfs' drawing for NeXTSTEP, the application by Keith Bernstein, carried by
// Apple into Mac OS X and shipped there for twenty years. They were taken from
// a NEXTSPACE recreation (github.com/armm77/Grab) and reduced here to the four
// levels a MegaPixel display could show. That artwork is not ours and it is not
// GPL, which is a real question for a public GPL-3.0 repository. Everything in
// this module degrades to the drawn camera in ui.js `_wsGrabIcon` if the files
// are absent, so removing assets/media/grab/ leaves a working app.
//
// The eye moves because the original moved: three frames, pupil left, centre
// and right. eye1 is the leftmost (pupil centroid x=47.84 of 64), eye2 the
// middle (48.91) and eye3 the rightmost (50.08), measured rather than guessed.

const DIR = 'assets/media/grab/';

// Guarded so the module can be imported outside a browser without throwing,
// which is how textures.js takes down anything that imports it under node.
function load(name) {
  if (typeof Image === 'undefined') return null;
  const img = new Image();
  img.src = DIR + name;
  return img;
}

export const GRAB_ART = {
  eye: [load('grab-eye1.png'), load('grab-eye2.png'), load('grab-eye3.png')],
  eyeFlash: load('grab-eyeflash.png'),
  normal: load('grab-normal.png'),
  watch: load('grab-watch.png'),
  watchFlash: load('grab-watchflash.png'),
};

/** Has it arrived? A half-loaded Image draws nothing and reports no error. */
export function grabReady(img) {
  return !!(img && img.complete && img.naturalWidth > 0);
}

/**
 * Which frame is looking at you. `aim.x` is the pointer's horizontal direction
 * from the eye, in roughly -1..1; the thirds are the three drawings the app
 * actually had.
 */
export function grabFrame(aim = { x: 0 }, flash = false, watch = false) {
  if (watch) return flash ? GRAB_ART.watchFlash : GRAB_ART.watch;
  if (flash) return GRAB_ART.eyeFlash;
  const i = aim.x < -0.34 ? 0 : (aim.x > 0.34 ? 2 : 1);
  return GRAB_ART.eye[i];
}
