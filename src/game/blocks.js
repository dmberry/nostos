// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// BLOCKS AS GEAR (#187).
//
// David, 2026-08-16: "we need a tool in hand to break blocks... broken blocks
// into the pack, place what you hold."
//
// WHAT THIS IS AND IS NOT. build.js says, and means, that Creative has no
// economy: "a Creative mode with a materials economy is just the game again
// with a different name on it." Nothing here changes that. This is the RULE a
// break follows when somebody is holding a tool and carrying a pack — the
// arithmetic of hardness, the right tool for a material, and what comes off it
// — kept pure and apart so it can be tested, and so that turning building on
// outside Creative is one decision rather than a rewrite.
//
// Creative passes no tool and no pack, and gets exactly what it got before:
// break anything, keep nothing.
//
// THE TIERS ARE THE ISLAND'S OWN. There is no pickaxe on Ogygia and there never
// will be; what a castaway has is hands, then an axe, then the machines' own
// cutting gear. So the ladder is bare hands / bronze axe / robot sword, and it
// is short on purpose — three rungs a player can hold in their head, against a
// material list of six.

/**
 * How hard each material is, and the lowest tier that will take it.
 *
 * `secs` is how long a break takes at the right tier: earth comes away in a
 * moment, cut stone does not. `tier` is the rung needed at all — below it the
 * block does not come off however long you stand there, which is what makes
 * finding the axe worth something.
 */
export const HARDNESS = {
  grass: { secs: 0.4, tier: 0 },
  dirt: { secs: 0.5, tier: 0 },
  sand: { secs: 0.4, tier: 0 },
  boards: { secs: 0.9, tier: 1 },
  glass: { secs: 0.3, tier: 1 },
  stone: { secs: 2.2, tier: 2 },
};

/** The ladder, lowest first. Anything not named here is bare hands. */
export const TOOL_TIER = {
  bronze_axe: 1,
  golden_axe: 2,
  robot_sword: 2,
  sledgehammer: 2,
  crowbar: 1,
};

/** What rung this thing in your hand is on. Nothing in hand is rung 0. */
export function tierOf(tool) {
  if (!tool) return 0;
  return TOOL_TIER[tool] || 0;
}

/**
 * Can this tool take this block, and how long does it take?
 *
 * `{ok: false, why}` when the tier is too low — with the reason naming what
 * would do it, because "you cannot break that" teaches a player nothing and
 * "stone wants a heavier tool than that" teaches them the ladder exists.
 */
export function breakRule(mat, tool) {
  const h = HARDNESS[mat];
  if (!h) return { ok: true, secs: 0.5 };      // anything unlisted is soft
  const tier = tierOf(tool);
  if (tier < h.tier) {
    return { ok: false, why: h.tier === 1 ? 'that wants a blade or a bar' : 'that wants a heavy tool' };
  }
  // A tool above the rung the block needs is faster, but only by so much: the
  // point of the better tool is reach, not a stopwatch.
  const over = Math.min(2, tier - h.tier);
  return { ok: true, secs: h.secs / (1 + over * 0.6) };
}

/**
 * What a broken block leaves you holding.
 *
 * Mostly itself, which is what makes a wall you took down into a wall you can
 * put up somewhere else. Two exceptions, both of them the ordinary ones: grass
 * breaks to the dirt under it, and glass breaks to nothing at all.
 */
export const DROPS = {
  grass: 'dirt',
  glass: null,
};

export function dropOf(mat) {
  return Object.prototype.hasOwnProperty.call(DROPS, mat) ? DROPS[mat] : mat;
}

/** Is this material one a player can carry a stack of and put back down? */
export function isPlaceable(mat) {
  return Object.prototype.hasOwnProperty.call(HARDNESS, mat);
}
