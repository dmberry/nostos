// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE SOUNDTRACK LIST IN THE ABOUT BOX.
//
// Third time this shape has come up (help-tabs.js, machine-icons.js): a panel
// in index.html that the game fills at boot, and a title screen that runs
// before main.js exists and therefore kept its own copy. Two copies of a
// credits list is two credits lists, and the one nobody edits is the one
// everybody reads.
//
// Built from the TAPES manifest, so a new cassette is a single numbered entry
// and both openings of the panel get it.

import { Renderer } from '../engine/renderer.js';
import { ITEMS, TAPES } from './items.js';

const cleanTrack = (f) => String(f).replace(/\.mp3$/i, '').replace(/^\d+[-.\s]*\d*[-.\s]*/, '').trim();

/**
 * Each cassette drawn by the code that draws it in the walkman and on the
 * title deck, so the sleeve in the credits is the object you will find. One
 * offscreen canvas and one Renderer for all of them.
 */
function tapeIconFactory() {
  const off = document.createElement('canvas');
  off.width = 108; off.height = 68;
  const r = new Renderer(off);
  return (def) => {
    const c = off.getContext('2d');
    c.clearRect(0, 0, off.width, off.height);
    c.save();
    c.translate(off.width / 2, off.height / 2);
    c.scale(2.1, 2.1);
    r.drawCassette(def, 0);
    c.restore();
    return off.toDataURL('image/png');
  };
}

/** Fill the About box's tape list, once. Safe to call again. */
export function fillAboutTapes(root = document) {
  const ul = root.querySelector('#aboutTapes') || document.getElementById('aboutTapes');
  if (!ul || ul.childElementCount) return;
  let icon = null;
  try { icon = tapeIconFactory(); } catch { /* no canvas: the list still reads */ }
  ul.innerHTML = TAPES.map((t) => {
    const a = t.a.tracks.map(cleanTrack).join(', ');
    const b = t.b.tracks.map(cleanTrack).join(', ');
    // TAPES carries `num` and the items are keyed tape_<num> — the manifest and
    // the item table are keyed differently on purpose (docs/tapes.md), so the
    // join is by number rather than by a `key` field TAPES does not have.
    const def = ITEMS[`tape_${t.num}`];
    let img = '';
    try { if (icon && def) img = `<img class="tape-pic" src="${icon(def)}" alt="">`; } catch { /* skip */ }
    return `<li>${img}<span class="tape-txt"><b>${t.artist} &mdash; <i>${t.title}</i></b><br>`
      + `A: ${a} &nbsp;&middot;&nbsp; B: ${b}</span></li>`;
  }).join('');
}

/** Every artist on the soundtrack, for the one-line credit under the list. */
export const soundtrackArtists = () => [...new Set(TAPES.map((t) => t.artist))].join(', ');
