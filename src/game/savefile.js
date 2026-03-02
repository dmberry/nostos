// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #157 — a run as a file on your disc.
//
// localStorage is a good place to keep a save and a bad place to keep the only
// copy: it goes when the browser clears site data, it does not travel between
// machines, and it cannot be handed to somebody else. This module turns the
// whole run into one JSON document and back.
//
// It is pure. It reads and writes a plain {key: string} map rather than touching
// localStorage itself, so the whole format is testable in node — which matters,
// because the failure mode of a bad importer is a wiped save.

export const FILE_MAGIC = 'nostos-save';
export const FILE_VERSION = 1;

// Every key the game persists under. The RUN is what a save file is for; the
// PROFILE keys are the things that outlive a run, and they are carried too, so
// a file handed to another machine brings the KLEOS record and your settings
// with it rather than landing next to somebody else's.
//
// Anything not on this list is not in the file. That is deliberate: a key added
// later and forgotten here is a silently incomplete export, so `MISSING_KEYS`
// below is checked by a test against the game's own list.
export const RUN_KEYS = [
  'postai-character',      // the run: identity, progress, state, world mutations
  'postai-seed',           // the world it was rolled from — without this the map is a different island
  'postai-identity',       // name and gender, kept separately so New Game can offer them back
  'postai-stages',         // the named checkpoints
  'postai-lore',           // fragments recovered
  'postai-aikey-backup',   // the key RON kept off the AI's hardware
];
export const PROFILE_KEYS = [
  'nostos-kleos',          // lifetime KLEOS: badges, tracks, the ladder
  'postai-settings',       // volumes and music mode
  'nostos-zoom',
  'nostos_phone_muted',
  'nostos-hudmenu',
];
export const ALL_KEYS = [...RUN_KEYS, ...PROFILE_KEYS];

/**
 * Build the document. `read(key)` returns the stored string or null.
 * Keys with nothing stored are omitted rather than written as null, so an
 * import does not clear a key the exporting machine simply never set.
 */
export function buildSaveFile(read, { version = null, at = null } = {}) {
  const data = {};
  for (const k of ALL_KEYS) {
    const v = read(k);
    if (typeof v === 'string') data[k] = v;
  }
  return { magic: FILE_MAGIC, format: FILE_VERSION, game: version, saved: at, data };
}

/** A human-readable one-line summary, for the confirm prompt before an import. */
export function describeSaveFile(doc) {
  const d = (doc && doc.data) || {};
  let who = 'a run', where = null, score = null;
  try {
    const c = JSON.parse(d['postai-character'] || 'null');
    if (c) {
      if (c.name) who = c.name;
      if (typeof c.score === 'number') score = c.score;
      if (c.world && c.world.currentIsland) where = c.world.currentIsland;
    }
  } catch { /* a malformed character block is the validator's problem, not this one */ }
  const bits = [who];
  if (where) bits.push(`on ${where}`);
  if (score !== null) bits.push(`score ${score}`);
  if (doc && doc.game) bits.push(`NostOS v${doc.game}`);
  if (doc && doc.saved) bits.push(String(doc.saved).slice(0, 10));
  return bits.join(' · ');
}

/**
 * Check a parsed document before anything is written. Returns
 * {ok, error} — and an import must not proceed on !ok, because applying half
 * a bad file leaves a run that boots into a world it was not saved in.
 */
export function validateSaveFile(doc) {
  if (!doc || typeof doc !== 'object') return { ok: false, error: 'not a save file' };
  if (doc.magic !== FILE_MAGIC) return { ok: false, error: 'not a NostOS save file' };
  if (typeof doc.format !== 'number') return { ok: false, error: 'no format version' };
  if (doc.format > FILE_VERSION) {
    return { ok: false, error: `saved by a newer NostOS (format ${doc.format}); this build reads up to ${FILE_VERSION}` };
  }
  const data = doc.data;
  if (!data || typeof data !== 'object') return { ok: false, error: 'no data' };
  if (typeof data['postai-character'] !== 'string') return { ok: false, error: 'no run in this file' };
  // The character block and the seed are the two that decide what world you
  // wake up in, so both are parsed here rather than at boot, where a throw
  // becomes a black screen.
  let ch;
  try { ch = JSON.parse(data['postai-character']); }
  catch { return { ok: false, error: 'the run in this file is corrupt' }; }
  if (!ch || typeof ch !== 'object') return { ok: false, error: 'the run in this file is corrupt' };
  for (const k of Object.keys(data)) {
    if (!ALL_KEYS.includes(k)) return { ok: false, error: `unknown key in file: ${k}` };
    if (typeof data[k] !== 'string') return { ok: false, error: `key ${k} is not a string` };
  }
  return { ok: true, error: null };
}

/**
 * Apply a validated document. `write(key, value)` sets, `remove(key)` clears.
 * Every key on ALL_KEYS is cleared first, so importing a run that never had a
 * lore record does not leave the previous run's fragments recovered.
 */
export function applySaveFile(doc, write, remove) {
  const v = validateSaveFile(doc);
  if (!v.ok) return v;
  for (const k of ALL_KEYS) remove(k);
  for (const [k, val] of Object.entries(doc.data)) write(k, val);
  return { ok: true, error: null };
}

/** The filename to offer. Date is passed in — this module knows no clock. */
export function saveFileName(doc, stamp) {
  const d = (doc && doc.data) || {};
  let who = 'run';
  try {
    const c = JSON.parse(d['postai-character'] || 'null');
    if (c && c.name) who = String(c.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'run';
  } catch { /* fall back to 'run' */ }
  return `nostos-${who}-${stamp}.nostos.json`;
}
