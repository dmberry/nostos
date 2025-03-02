// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// FOG OF WAR, PACKED FOR THE SAVE.
//
// What you have walked is knowledge, and knowledge survives in this game: the
// skills do, the books do, the ground you have crossed does. The minimap's fog
// did not — every reload put the whole island back under grey, including the
// parts you had already died in.
//
// A map is 128x128, so `explored` is 16,384 bytes. One tile per character of
// JSON would be 22KB an island before quoting; a bit per tile is 2KB, and
// base64 of that is about 2.7KB. Five islands fit in a save without thinking
// about it.

/** Pack a 0/1 exploration array into base64: one bit per tile, low bit first. */
export function packFog(explored) {
  if (!explored || !explored.length) return '';
  const bytes = new Uint8Array((explored.length + 7) >> 3);
  for (let i = 0; i < explored.length; i++) {
    if (explored[i]) bytes[i >> 3] |= 1 << (i & 7);
  }
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

/**
 * Unpack into an existing array, in place. Returns false and leaves the array
 * untouched if the string is not a fog of exactly this size — a save written
 * against a different map must be refused whole rather than applied halfway,
 * which would show you a fog that is not the one you earned.
 */
export function unpackFogInto(packed, explored) {
  if (typeof packed !== 'string' || !packed || !explored || !explored.length) return false;
  let raw;
  try { raw = atob(packed); } catch { return false; }
  if (raw.length !== (explored.length + 7) >> 3) return false;
  for (let i = 0; i < explored.length; i++) {
    explored[i] = (raw.charCodeAt(i >> 3) >> (i & 7)) & 1;
  }
  return true;
}

/** How much of a map has been walked, 0..1 — for a save's own sanity checks. */
export function fogSeenFraction(explored) {
  if (!explored || !explored.length) return 0;
  let n = 0;
  for (let i = 0; i < explored.length; i++) if (explored[i]) n++;
  return n / explored.length;
}
