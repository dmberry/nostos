// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #143 — the one helper every cached page uses, in its own file so that the
// corpus files can take it without importing archive.js and archive.js can
// take it back without a cycle.

export const CACHE_SUB = 'cache';

// A photograph on a cached page. These are real pictures, small ones, of the
// size a camera of the period actually gave you; the stylesheet floats them and
// wraps the text past. Pass 'r' as the third argument to send one to the right
// margin, which is how you get a column of pictures down alternating sides
// instead of a single stripe down the left.
//
// The caption doubles as the alt text on purpose. If the file is missing the
// page still reads, and archive-links.test.js asserts none of them is.
export const pic = (name, cap, side) =>
  `<figure${side === 'r' ? ' class="r"' : ''}>` +
  `<img src="assets/media/web/${name}.jpg" alt="${cap}">` +
  `<figcaption>${cap}</figcaption></figure>`;
