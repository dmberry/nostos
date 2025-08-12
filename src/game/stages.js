// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// CHECKPOINTS: the order they are offered in, and how many are kept.
//
// The store is keyed by id, so it cannot grow without limit — eleven ladder
// rungs and one hand-written slot per island. It can still reach seventeen, and
// each entry carries a whole save blob (with the fog of war in it since
// v1.364), which is a quarter of a megabyte of the browser's storage to offer
// somebody a rung they passed two islands ago.
//
// Pure, and shared: the gate sorts for display and main.js prunes on write, and
// they have to agree about which end of the list is the valuable one.

/** How many checkpoints are kept. Enough to reach back past a bad run. */
export const KEEP_STAGES = 8;

/**
 * Newest and highest first. `order` is the rung — hand-written saves sit above
 * every rung, because the point of writing one is that it is where you want to
 * come back to — and ties break by when it was written, so the hand-written
 * ones come newest first rather than in whatever order the store holds them.
 */
export const byRecency = (a, b) => ((b.order || 0) - (a.order || 0)) || ((b.ts || 0) - (a.ts || 0));

/** The stage list, in the order it is offered. */
export function sortStages(stages) {
  return Object.values(stages || {}).sort(byRecency);
}

/**
 * Drop everything past the first KEEP_STAGES, by the same order the gate shows
 * them in — so what falls off the bottom of the list is what falls out of the
 * store, and a player never sees a row that is about to vanish.
 */
export function pruneStages(stages, keep = KEEP_STAGES) {
  const kept = sortStages(stages).slice(0, keep);
  const out = {};
  for (const s of kept) if (s && s.id) out[s.id] = s;
  return out;
}

// Tidy a checkpoint name the player typed into something that reads well in a
// list of eight and cannot carry markup into it. The gate renders the label
// straight into innerHTML, and a save name is the one string on that screen a
// player wrote, so it is the one that has to be safe.
//
// Here rather than in main.js because main.js needs a DOM to import and this
// wants testing. It lives beside pruneStages for the same reason: both are
// rules about what goes in the store, and neither needs a world.
export function checkpointName(raw) {
  return String(raw == null ? '' : raw)
    // Trim BEFORE unquoting, or a name typed with a space in front of the
    // opening quote keeps both quotes: the anchors never matched.
    .trim()
    .replace(/^(["'])([\s\S]*)\1$/, '$2')
    // Whole tags, not their brackets. Removing only `<` and `>` turned
    // `<b>x</b>` into `bx/b`, which is not markup any more and is not a name
    // either.
    .replace(/<[^>]*>/g, '')
    .replace(/[<>&]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 28);                 // or one long name pushes the score off the row
}

/** The store key for a checkpoint: one slot per island, or one per name when
 *  the player gave one, because a name is them saying these are two moments. */
export function saveStageId(worldId, name) {
  const slug = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug ? `save-${worldId}-${slug}` : `save-${worldId}`;
}
