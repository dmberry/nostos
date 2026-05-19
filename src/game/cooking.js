// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// COOKING (#180).
//
// `meat` has carried the comment `food: 25, // raw; cooking comes later` since
// it was written. This is later.
//
// THE SHAPE IS A FIRE, not a menu. Wood makes a campfire, the campfire burns
// down, raw meat held over it becomes roast meat worth nearly twice as much,
// and the fire goes out if you stop feeding it. That is the whole system: one
// object with a fuel number on it and one conversion. There is no recipe book,
// no stations, no ingredients that only exist to be combined — the island has
// four foods and a hunger bar, and a cooking system larger than that would be
// machinery in search of a reason.
//
// WHY IT IS WORTH DOING AT ALL, given you can already eat the meat raw: a fire
// is the first thing you can MAKE that is not a weapon or a way off the island.
// It burns, it lights the ground around it at night, it wants feeding, and it
// is somewhere to come back to. Roast meat is the reward for having built one.
//
// PURE, like build.js: a map, a fire and a time step. Nothing here knows about
// the renderer, the player class or the DOM.

/** Seconds a fire burns per wood. Three logs is a bit over three minutes. */
export const FUEL_PER_WOOD = 70;

/** What it takes to lay a fire, and the most it will hold. */
export const WOOD_PER_FIRE = 3;
export const FUEL_MAX = FUEL_PER_WOOD * 6;

/** Below this it is embers: still hot enough to cook on, plainly nearly out. */
export const EMBERS_AT = 25;

/** Seconds of holding a piece over the flame before it is done. */
export const COOK_TIME = 6;

/**
 * What turns into what. Raw on the left, roast on the right.
 *
 * One entry, because the island has one raw food. A table with a second row for
 * something the game does not have is a promise a player will go looking for.
 */
export const ROASTS = { meat: 'cooked_meat' };

/** Is this a fire that will still cook? Embers count; a dead one does not. */
export function isLit(obj) {
  return !!(obj && obj.type === 'campfire' && (obj.fuel || 0) > 0);
}

/** 0..1 for the renderer: how big the flame should be right now. */
export function fireStrength(obj) {
  if (!isLit(obj)) return 0;
  return Math.max(0.18, Math.min(1, obj.fuel / FUEL_PER_WOOD));
}

/**
 * Burn every fire on the map down, and take away the ones that have gone out.
 *
 * A dead fire is REMOVED rather than left as a cold prop, because a map that
 * slowly fills with the ash of every fire you ever lit is a map nobody wants
 * to walk through. `cook` is reset on any fire that dies mid-roast, so a piece
 * left over a fire that went out is raw again rather than silently finished.
 */
export function tickFires(map, dt) {
  if (!map || !map.objects || !map.objects.length) return [];
  const died = [];
  // A copy, because removeObject splices the list this is walking.
  for (const o of map.objects.slice()) {
    if (o.type !== 'campfire') continue;
    o.fuel = Math.max(0, (o.fuel || 0) - dt);
    o.flick = (o.flick || 0) + dt;
    if (o.fuel <= 0) {
      o.cook = 0;
      died.push({ x: o.x, y: o.y });
      map.removeObject(o);
    }
  }
  return died;
}

/**
 * Put wood on a fire. Returns `{ok, what}` or `{ok: false, why}`.
 *
 * Capped at FUEL_MAX so a pack of sixty wood cannot become a fire that outlasts
 * the run — the point of a fire is that it wants coming back to.
 */
export function feedFire(fire, seconds = FUEL_PER_WOOD) {
  if (!fire || fire.type !== 'campfire') return { ok: false, why: 'that is not a fire' };
  if ((fire.fuel || 0) >= FUEL_MAX) return { ok: false, why: 'it will not take any more' };
  fire.fuel = Math.min(FUEL_MAX, (fire.fuel || 0) + seconds);
  return { ok: true, what: 'fed' };
}

/**
 * Advance the roast on a fire while a piece is held over it.
 *
 * The CALLER decides whether the player is still standing there and still
 * holding something raw; this only counts. Returns `{done}` when the piece has
 * had its time, and the caller does the swap — which keeps every question about
 * pockets and stacks on the player's side of the line.
 */
export function tickCook(fire, dt) {
  if (!isLit(fire)) { if (fire) fire.cook = 0; return { done: false, progress: 0 }; }
  fire.cook = (fire.cook || 0) + dt;
  if (fire.cook >= COOK_TIME) { fire.cook = 0; return { done: true, progress: 1 }; }
  return { done: false, progress: fire.cook / COOK_TIME };
}

/** The roast a raw item becomes, or null if it is not something you cook. */
export function roastOf(itemKey) {
  return ROASTS[itemKey] || null;
}
