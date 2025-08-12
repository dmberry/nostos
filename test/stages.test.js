// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortStages, pruneStages, KEEP_STAGES } from '../src/game/stages.js';

const mk = (id, order, ts) => ({ id, order, ts, label: id, save: {} });
const store = (...rows) => Object.fromEntries(rows.map((r) => [r.id, r]));

test('the highest rung comes first, and a tie breaks by when it was written', () => {
  const list = sortStages(store(mk('a', 1, 10), mk('c', 9, 5), mk('b', 9, 99)));
  assert.deepEqual(list.map((s) => s.id), ['b', 'c', 'a']);
});

test('pruning keeps the top of the list the gate shows', () => {
  // What falls off the bottom of the list has to be what falls out of the
  // store, or a player is offered a row that is already gone.
  const rows = Array.from({ length: 14 }, (_, i) => mk(`s${i}`, i, i));
  const kept = pruneStages(store(...rows));
  assert.equal(Object.keys(kept).length, KEEP_STAGES);
  const shown = sortStages(store(...rows)).slice(0, KEEP_STAGES).map((s) => s.id);
  assert.deepEqual(sortStages(kept).map((s) => s.id), shown);
});

test('a store already under the cap is left exactly as it was', () => {
  const s = store(mk('a', 1, 1), mk('b', 2, 2));
  assert.deepEqual(Object.keys(pruneStages(s)).sort(), ['a', 'b']);
});

test('pruning is stable: pruning twice changes nothing', () => {
  // saveStage prunes on every write, so this runs constantly. A prune that
  // shifted the set each time would quietly eat checkpoints in the background.
  const rows = Array.from({ length: 20 }, (_, i) => mk(`s${i}`, i % 7, i));
  const once = pruneStages(store(...rows));
  assert.deepEqual(Object.keys(pruneStages(once)).sort(), Object.keys(once).sort());
});

test('junk in the store cannot throw', () => {
  assert.deepEqual(pruneStages(null), {});
  assert.deepEqual(pruneStages({}), {});
  assert.deepEqual(sortStages(undefined), []);
});
