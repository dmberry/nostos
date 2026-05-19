// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// MATCHING SAVED UNITS BACK TO LIVE ONES.
//
// This was inline in main.js and it was wrong in a way that destroyed work.
// Units were keyed by (home tower, chassis, gardener-fit), which is not an
// identity: a tower with three W-4s wrote three records under one key, and on
// load exactly one machine claimed it. Everything done to the other two was
// saved and then dropped (David, 2026-08-15: "robots braincode is not
// persistent - I just lost lots of changed robots"). Measured on a fresh world:
// 8 of 33 machines could not be restored, and every one of them was in a
// colliding group — the W-4s and T-8s, which come in threes and fours and are
// exactly what a player reprograms.
//
// It lives here so the rule can be tested, because the failure was silent: the
// save was correct, the load ran without error, and the work was simply gone.

/**
 * Pair saved records with live machines.
 *
 * `uid` is the identity. The world rebuilds deterministically from its seed, so
 * the nth machine spawned is the same machine it was last run; that ordinal is
 * stamped on the unit and written with the record.
 *
 * A record with NO uid predates the change. Those fall back to the old key, but
 * each bucket is consumed once — take the next unclaimed machine rather than
 * always the first, so a tower's three W-4s recover three records instead of
 * one machine being handed all three in turn.
 *
 * Returns [{ record, unit }]. Records that match nothing are dropped: a machine
 * that no longer exists (killed, or printed by the factory after the roster was
 * seeded) has nothing to restore onto.
 */
export function matchSavedUnits(records, units, oldKeyOf) {
  const byUid = new Map();
  const buckets = new Map();
  for (const u of units || []) {
    if (u.uid !== undefined) byUid.set(u.uid, u);
    const k = oldKeyOf(u);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(u);
  }
  const out = [];
  const claimed = new Set();
  for (const rec of records || []) {
    let unit = null;
    if (rec.uid !== undefined) {
      unit = byUid.get(rec.uid) || null;
    } else {
      const b = buckets.get(recordKey(rec));
      while (b && b.length && !unit) {
        const cand = b.shift();
        if (!claimed.has(cand)) unit = cand;
      }
    }
    if (!unit || claimed.has(unit)) continue;
    claimed.add(unit);
    out.push({ record: rec, unit });
  }
  return out;
}

/** The legacy key a record was written under, before uids. */
export function recordKey(rec) {
  return `${rec.ob}.${rec.type}${rec.gfit ? 'g' : ''}`;
}

/** The same key, off a live machine. `homeCode` resolves its tower. */
export function unitKey(u, homeCode) {
  return `${homeCode(u)}.${u.type}${u.gardener ? 'g' : ''}`;
}

/**
 * Stamp identities on anything that has not got one. Call before writing a save
 * and before reading one, so machines the factory printed mid-run are named
 * too — they cannot be restored, but they must not be mistaken for one that can.
 */
export function stampUnitIds(world) {
  if (!world || !world.robots) return world;
  for (const r of world.robots) {
    if (r.uid === undefined) r.uid = (world._nextUid = (world._nextUid || 0) + 1);
  }
  return world;
}
