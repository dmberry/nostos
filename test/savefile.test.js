// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #157: a run as a file. The failure mode of a bad importer is somebody's wiped
// save, so the validator is tested harder than the exporter.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  FILE_MAGIC, FILE_VERSION, RUN_KEYS, PROFILE_KEYS, ALL_KEYS,
  buildSaveFile, validateSaveFile, applySaveFile, describeSaveFile, saveFileName,
} from '../src/game/savefile.js';

function store(obj) {
  const m = new Map(Object.entries(obj));
  return {
    map: m,
    read: (k) => (m.has(k) ? m.get(k) : null),
    write: (k, v) => m.set(k, v),
    remove: (k) => m.delete(k),
  };
}

const CHAR = JSON.stringify({ name: 'Odysseus', score: 420, world: { currentIsland: 'circe' } });

test('a built file carries every key that was set, and no key that was not', () => {
  const s = store({ 'postai-character': CHAR, 'postai-seed': '77', 'nostos-kleos': '{}' });
  const doc = buildSaveFile(s.read, { version: '1.515', at: '2026-08-13T00:00:00Z' });
  assert.equal(doc.magic, FILE_MAGIC);
  assert.equal(doc.format, FILE_VERSION);
  assert.equal(doc.game, '1.515');
  assert.deepEqual(Object.keys(doc.data).sort(), ['nostos-kleos', 'postai-character', 'postai-seed']);
  // An unset key is absent, not null — importing must not clear what the
  // exporting machine simply never had.
  assert.ok(!('postai-lore' in doc.data));
});

test('a run round-trips through export and import into an empty store', () => {
  const from = store({ 'postai-character': CHAR, 'postai-seed': '77', 'postai-lore': '{"found":["a"]}' });
  const doc = buildSaveFile(from.read, {});
  const to = store({});
  const r = applySaveFile(doc, to.write, to.remove);
  assert.equal(r.ok, true);
  assert.equal(to.read('postai-character'), CHAR);
  assert.equal(to.read('postai-seed'), '77');
  assert.equal(to.read('postai-lore'), '{"found":["a"]}');
});

test('import CLEARS a key the file does not carry', () => {
  // Otherwise an imported run inherits the previous run's recovered fragments.
  const doc = buildSaveFile(store({ 'postai-character': CHAR }).read, {});
  const to = store({ 'postai-character': '{"name":"someone else"}', 'postai-lore': '{"found":["stale"]}' });
  applySaveFile(doc, to.write, to.remove);
  assert.equal(to.read('postai-lore'), null);
  assert.equal(to.read('postai-character'), CHAR);
});

// ---- the validator ----------------------------------------------------------

test('rubbish is refused', () => {
  for (const bad of [null, undefined, 42, 'a string', [], {}]) {
    assert.equal(validateSaveFile(bad).ok, false, `${JSON.stringify(bad)} should be refused`);
  }
});

test('a JSON file that is not ours is refused by name', () => {
  const r = validateSaveFile({ magic: 'some-other-game', format: 1, data: {} });
  assert.equal(r.ok, false);
  assert.match(r.error, /not a NostOS save file/);
});

test('a file from a newer build is refused, and says so', () => {
  const r = validateSaveFile({ magic: FILE_MAGIC, format: FILE_VERSION + 1, data: { 'postai-character': CHAR } });
  assert.equal(r.ok, false);
  assert.match(r.error, /newer NostOS/);
});

test('a file with no run in it is refused', () => {
  const r = validateSaveFile({ magic: FILE_MAGIC, format: 1, data: { 'postai-seed': '1' } });
  assert.equal(r.ok, false);
  assert.match(r.error, /no run/);
});

test('a corrupt character block is caught HERE, not at boot', () => {
  const r = validateSaveFile({ magic: FILE_MAGIC, format: 1, data: { 'postai-character': '{not json' } });
  assert.equal(r.ok, false);
  assert.match(r.error, /corrupt/);
});

test('an unknown key is refused rather than written', () => {
  const r = validateSaveFile({ magic: FILE_MAGIC, format: 1, data: { 'postai-character': CHAR, 'evil-key': 'x' } });
  assert.equal(r.ok, false);
  assert.match(r.error, /unknown key/);
});

test('a non-string value is refused', () => {
  const r = validateSaveFile({ magic: FILE_MAGIC, format: 1, data: { 'postai-character': CHAR, 'postai-seed': 77 } });
  assert.equal(r.ok, false);
});

test('a refused file writes NOTHING', () => {
  const to = store({ 'postai-character': 'MINE', 'postai-lore': 'MINE TOO' });
  const r = applySaveFile({ magic: 'nope' }, to.write, to.remove);
  assert.equal(r.ok, false);
  assert.equal(to.read('postai-character'), 'MINE');
  assert.equal(to.read('postai-lore'), 'MINE TOO');
});

// ---- the human-facing bits --------------------------------------------------

test('the description says whose run it is and where they were', () => {
  const doc = buildSaveFile(store({ 'postai-character': CHAR }).read, { version: '1.515', at: '2026-08-13T09:00:00Z' });
  const s = describeSaveFile(doc);
  assert.match(s, /Odysseus/);
  assert.match(s, /circe/);
  assert.match(s, /420/);
  assert.match(s, /1\.515/);
});

test('a description of a corrupt file does not throw', () => {
  assert.doesNotThrow(() => describeSaveFile({ data: { 'postai-character': '{broken' } }));
  assert.doesNotThrow(() => describeSaveFile(null));
});

test('the filename is safe for a filesystem', () => {
  const doc = buildSaveFile(store({ 'postai-character': JSON.stringify({ name: 'Ody / sseus!!' }) }).read, {});
  const n = saveFileName(doc, '2026-08-13');
  assert.match(n, /^nostos-[a-z0-9-]+-2026-08-13\.nostos\.json$/);
  assert.ok(!n.includes('/'), 'no path separators');
});

// ---- the list must not go stale --------------------------------------------

test('ALL_KEYS covers every key the game persists under', () => {
  // A key added to the game and not to ALL_KEYS is a silently incomplete
  // export, which the player only discovers on the machine they moved to.
  const sources = ['src/main.js', 'src/engine/sound.js', 'src/game/lore.js', 'src/game/achieve.js']
    .map((f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')).join('\n');
  const found = new Set();
  for (const m of sources.matchAll(/localStorage\.(?:getItem|setItem|removeItem)\(\s*'([^']+)'/g)) found.add(m[1]);
  for (const m of sources.matchAll(/^const \w+ = '((?:postai|nostos)[-_][\w-]+)';/gm)) found.add(m[1]);
  const missing = [...found].filter((k) => !ALL_KEYS.includes(k));
  assert.deepEqual(missing, [], `keys the game stores but a save file would not carry: ${missing.join(', ')}`);
});

test('run keys and profile keys do not overlap', () => {
  assert.equal(new Set(ALL_KEYS).size, ALL_KEYS.length);
  for (const k of RUN_KEYS) assert.ok(!PROFILE_KEYS.includes(k), `${k} is in both lists`);
});
