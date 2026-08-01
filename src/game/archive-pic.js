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

// A film on a cached page, drawn as the QuickTime plugin it would have been
// served through: a grey bezel, the title in the strip above, and a controller
// under the picture. In 2002 a video on a web page WAS a window inside the
// window and looked like somebody else's application, so it should here.
//
// Nothing autoplays and nothing loops. You press it or it does not run, which
// is the other half of what that plugin was like, and keeps a page that has
// two films on it from being two films at once.
export const vid = (name, title, cap) =>
  `<figure class="ns-vid">` +
  `<div class="qt-bar">${title}</div>` +
  `<video src="assets/media/web/${name}.mp4" controls preload="none" playsinline></video>` +
  `<figcaption>${cap}</figcaption></figure>`;
