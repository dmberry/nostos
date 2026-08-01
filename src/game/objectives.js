// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// OBJECTIVES (#190).
//
// David, 2026-08-17: "Having objectives might be worth building in - so the
// user KNOWS WHAT TO DO", with Parallel Realities' shooter part 12.
//
// THE SHAPE IS A KEY, A COUNT AND A GOAL, and that is the whole of it. Anything
// in the game that happens calls `bump(list, 'obeliskDown', 1)`; a list with no
// objective under that key does nothing at all. So a trigger can be dropped
// wherever the event already is, without that code learning what an objective
// is or which island it is on — which is the property that makes this cheap to
// extend and impossible to get tangled in.
//
// WHAT IT IS NOT. KLEOS is the record of what you did and how you did it: it is
// read at the end and it judges. This is read at the start and it points. A
// player who does not know that the island's towers are the thing to bring down
// cannot be helped by a badge awarded for having brought them down.
//
// ONLY WHAT IS TRUE. Every objective here is something the run genuinely turns
// on — the towers, the core, the ship — because an objective list that names a
// task the game does not actually require is worse than no list: it sends a
// player to spend an hour on something that was never the door.
//
// PURE, like build.js, cooking.js and lights.js: a world description goes in, a
// list comes out; an event and a list go in, a message comes out.

/** A fresh copy at zero, so a template is never handed out as live state. */
const fresh = (o) => ({ ...o, at: 0 });

/**
 * The objectives an island wants, from what the island IS.
 *
 * Two endings exist (world.js `winMode`), and they want different things. On a
 * martial island the run ends when every tower is down and the core is razed.
 * On Ogygia the win is leaving, so nothing is required to fall at all — the
 * whole task is a boat that will hold the sea.
 *
 * `goal` for the towers comes from the island rather than a constant: islands
 * carry different numbers of them, and an objective that says 6 on an island
 * with 4 is a player looking for two towers that were never built.
 */
export function objectivesFor(world) {
  const towers = (world && world.obeliskObjs ? world.obeliskObjs.length : 0);
  const out = [];
  if ((world && world.winMode) === 'depart') {
    out.push({ key: 'shipBuilt', goal: 1, what: 'Build a ship that will hold the sea' });
    out.push({ key: 'leaveGranted', goal: 1, what: 'Get her leave to go' });
    return out.map(fresh);
  }
  if (towers > 0) out.push({ key: 'obeliskDown', goal: towers, what: `Bring down the network — ${towers} tower${towers > 1 ? 's' : ''}` });
  out.push({ key: 'coreDown', goal: 1, what: "Raze the daemon's core" });
  return out.map(fresh);
}

/** Has this one been met? */
export const isDone = (o) => !!o && o.at >= o.goal;

/** `{done, total}` for the dashboard counter. */
export function progress(list) {
  const all = list || [];
  return { done: all.filter(isDone).length, total: all.length };
}

/** Every objective met — the run's own answer, not the HUD's. */
export function allComplete(list) {
  return !!(list && list.length) && list.every(isDone);
}

/** How an objective reads on a panel: `Raze the daemon's core — 0 / 1`. */
export function line(o) {
  return o.goal > 1 ? `${o.what} — ${Math.min(o.at, o.goal)} / ${o.goal}` : o.what;
}

/**
 * Record `n` of something happening. Returns the messages worth showing, which
 * is usually none.
 *
 * THE TENTH IS NOT WORTH SAYING when the goal is a hundred. Progress is
 * announced only when it crosses a tenth of the way, which is the tutorial's
 * rule and a good one: a `goal` of 6 speaks every step, a `goal` of 150 speaks
 * fifteen times instead of a hundred and fifty. Completion always speaks.
 *
 * Mutates the objectives, because they ARE the run's state — the alternative is
 * every call site threading a new list back to wherever the old one was kept.
 */
export function bump(list, key, n = 1) {
  const said = [];
  for (const o of list || []) {
    if (o.key !== key || isDone(o)) continue;
    const before = Math.floor((o.at / o.goal) * 10);
    o.at = Math.min(o.goal, o.at + n);
    if (isDone(o)) said.push({ done: true, text: `${o.what} — done` });
    else if (Math.floor((o.at / o.goal) * 10) > before) said.push({ done: false, text: line(o) });
  }
  return said;
}

/**
 * Set an objective's count outright, for the ones the world already knows the
 * answer to.
 *
 * Towers are the case this exists for: they can come down by an axe, by a
 * `crash` typed at a terminal, or by a repair drone failing to raise one, and
 * counting each route separately is three chances to count one tower twice. The
 * world knows how many are standing; it can just say so.
 */
export function setTo(list, key, value) {
  const said = [];
  for (const o of list || []) {
    if (o.key !== key || isDone(o)) continue;
    const before = Math.floor((o.at / o.goal) * 10);
    o.at = Math.max(o.at, Math.min(o.goal, value));
    if (isDone(o)) said.push({ done: true, text: `${o.what} — done` });
    else if (Math.floor((o.at / o.goal) * 10) > before) said.push({ done: false, text: line(o) });
  }
  return said;
}

// ---- persistence ------------------------------------------------------------
//
// Only the counts ride the save. The list itself is rebuilt from the world on
// load, so an objective whose wording is improved (or an island whose tower
// count changes) does not leave old saves carrying the old text for ever.

export function packObjectives(list) {
  const out = {};
  for (const o of list || []) out[o.key] = o.at;
  return out;
}

export function applyObjectives(list, packed) {
  if (!list || !packed) return list;
  for (const o of list) {
    const v = packed[o.key];
    if (typeof v === 'number' && v > 0) o.at = Math.min(o.goal, v);
  }
  return list;
}
