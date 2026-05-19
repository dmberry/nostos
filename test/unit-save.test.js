// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// Matching saved units back to live ones. The bug this pins destroyed player
// work silently: the save was written correctly, the load ran without error,
// and the programs were simply gone.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchSavedUnits, unitKey, recordKey, stampUnitIds } from '../src/game/unit-save.js';

const homeCode = (u) => u.home;
const key = (u) => unitKey(u, homeCode);
const unit = (home, type, over = {}) => ({ home, type, ...over });

test('A TOWER WITH THREE W-4s REMEMBERS ALL THREE', () => {
  // The whole bug. Keyed by (tower, chassis) these are one machine, so two of
  // the three programs were written and thrown away on load.
  const live = [unit('OB_A', 'w4', { uid: 1 }), unit('OB_A', 'w4', { uid: 2 }), unit('OB_A', 'w4', { uid: 3 })];
  const saved = [
    { uid: 1, ob: 'OB_A', type: 'w4', program: 'one' },
    { uid: 2, ob: 'OB_A', type: 'w4', program: 'two' },
    { uid: 3, ob: 'OB_A', type: 'w4', program: 'three' },
  ];
  const pairs = matchSavedUnits(saved, live, key);
  assert.equal(pairs.length, 3, 'every record found its machine');
  assert.deepEqual(pairs.map((p) => p.record.program), ['one', 'two', 'three']);
  assert.equal(new Set(pairs.map((p) => p.unit)).size, 3, 'and no machine was used twice');
});

test('four T-8s at one tower keep four separate programs', () => {
  const live = [1, 2, 3, 4].map((uid) => unit('OB_F', 't8', { uid }));
  const saved = [1, 2, 3, 4].map((uid) => ({ uid, ob: 'OB_F', type: 't8', program: `p${uid}` }));
  const pairs = matchSavedUnits(saved, live, key);
  assert.equal(pairs.length, 4);
  for (const { record, unit: u } of pairs) assert.equal(record.program, `p${u.uid}`, 'each got its OWN program');
});

test('a machine gets its own program, never another machine\'s', () => {
  const live = [unit('OB_A', 'w4', { uid: 7 }), unit('OB_B', 'w4', { uid: 9 })];
  const saved = [{ uid: 9, ob: 'OB_B', type: 'w4', program: 'nine' }, { uid: 7, ob: 'OB_A', type: 'w4', program: 'seven' }];
  const pairs = matchSavedUnits(saved, live, key);
  for (const { record, unit: u } of pairs) assert.equal(record.uid, u.uid);
});

test('the gardener variant is not the courier', () => {
  // A V-1 and a V-5 share a chassis. Under the old key they were one unit and
  // a reload put one's model onto the other.
  const live = [unit('OB_C', 'v1', { uid: 1 }), unit('OB_C', 'v1', { uid: 2, gardener: true })];
  const saved = [
    { uid: 1, ob: 'OB_C', type: 'v1', program: 'courier' },
    { uid: 2, ob: 'OB_C', type: 'v1', gfit: 1, program: 'gardener' },
  ];
  const pairs = matchSavedUnits(saved, live, key);
  assert.equal(pairs.find((p) => p.unit.gardener).record.program, 'gardener');
  assert.equal(pairs.find((p) => !p.unit.gardener).record.program, 'courier');
});

test('LEGACY SAVES STILL LOAD, and share out rather than piling up', () => {
  // Records written before uids existed. They cannot be matched exactly, but
  // three records on one key must still reach three machines rather than one.
  const live = [unit('OB_A', 'w4', { uid: 1 }), unit('OB_A', 'w4', { uid: 2 }), unit('OB_A', 'w4', { uid: 3 })];
  const saved = [
    { ob: 'OB_A', type: 'w4', program: 'one' },
    { ob: 'OB_A', type: 'w4', program: 'two' },
    { ob: 'OB_A', type: 'w4', program: 'three' },
  ];
  const pairs = matchSavedUnits(saved, live, key);
  assert.equal(pairs.length, 3, 'a legacy save loses nothing it can place');
  assert.equal(new Set(pairs.map((p) => p.unit)).size, 3);
});

test('a record whose machine is gone is dropped, not misapplied', () => {
  // Killed, or printed by the factory after the roster was seeded. It must not
  // land its program on some other machine.
  const live = [unit('OB_A', 'w4', { uid: 1 })];
  const saved = [{ uid: 1, ob: 'OB_A', type: 'w4', program: 'mine' }, { uid: 99, ob: 'OB_A', type: 'w4', program: 'ghost' }];
  const pairs = matchSavedUnits(saved, live, key);
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].record.program, 'mine');
});

test('no machine is ever written to twice', () => {
  const live = [unit('OB_A', 'w4', { uid: 1 })];
  const saved = [
    { uid: 1, ob: 'OB_A', type: 'w4', program: 'first' },
    { uid: 1, ob: 'OB_A', type: 'w4', program: 'second' },
  ];
  const pairs = matchSavedUnits(saved, live, key);
  assert.equal(pairs.length, 1, 'a duplicated record does not overwrite the first');
});

test('identities are stamped once and are stable', () => {
  const w = { robots: [{}, {}, {}] };
  stampUnitIds(w);
  const first = w.robots.map((r) => r.uid);
  assert.equal(new Set(first).size, 3, 'distinct');
  w.robots.push({});             // the factory prints one mid-run
  stampUnitIds(w);
  assert.deepEqual(w.robots.slice(0, 3).map((r) => r.uid), first, 'the existing machines keep their names');
  assert.ok(!first.includes(w.robots[3].uid), 'and the new one does not steal a name');
});

test('empty and missing inputs are not an error', () => {
  assert.deepEqual(matchSavedUnits(null, null, key), []);
  assert.deepEqual(matchSavedUnits([], [], key), []);
  assert.equal(recordKey({ ob: 'OB_A', type: 'w4' }), 'OB_A.w4');
  assert.equal(recordKey({ ob: 'OB_A', type: 'v1', gfit: 1 }), 'OB_A.v1g');
  assert.doesNotThrow(() => stampUnitIds(null));
  assert.doesNotThrow(() => stampUnitIds({}));
});

test('THE ID COUNTER CLEARS EVERY NAME ALREADY IN USE', () => {
  // A revived machine carries the uid it was saved with, which sits above the
  // range stampUnitIds just issued to the fresh roster. If the counter is not
  // advanced past it, the next unit the factory prints is handed a name that is
  // already taken — and one saved record then matches two machines.
  const w = { robots: [{}, {}, {}] };
  stampUnitIds(w);                       // 1,2,3
  w.robots.push({ uid: 57 });            // revived, carrying its saved name
  for (const r of w.robots) if (Number.isFinite(r.uid) && r.uid > (w._nextUid || 0)) w._nextUid = r.uid;
  w.robots.push({});                     // the factory prints one
  stampUnitIds(w);
  const ids = w.robots.map((r) => r.uid);
  assert.equal(new Set(ids).size, ids.length, `a name was reused: ${ids}`);
  assert.ok(w.robots[4].uid > 57, 'the new machine is named past the revived one');
});
