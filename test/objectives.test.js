// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #190 — objectives, so the player knows what to do.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  objectivesFor, bump, setTo, progress, allComplete, isDone, line,
  packObjectives, applyObjectives,
} from '../src/game/objectives.js';

const martial = (n) => objectivesFor({ winMode: 'kill', obeliskObjs: Array(n).fill({}) });

test('the list comes from the island, not from a constant', () => {
  // An objective that says six towers on an island with four is a player
  // looking for two that were never built.
  assert.equal(martial(4).find((o) => o.key === 'obeliskDown').goal, 4);
  assert.equal(martial(7).find((o) => o.key === 'obeliskDown').goal, 7);
  // An island with no network asks only for the core.
  assert.deepEqual(martial(0).map((o) => o.key), ['coreDown']);
});

test('Ogygia asks for a boat, not for a kill', () => {
  const l = objectivesFor({ winMode: 'depart', obeliskObjs: [{}, {}, {}] });
  assert.deepEqual(l.map((o) => o.key), ['shipBuilt', 'leaveGranted']);
  assert.ok(!l.some((o) => o.key === 'coreDown'), 'her core cannot be razed, so it must not be asked for');
});

test('a bump on a key nobody wants does nothing at all', () => {
  // The property the whole design rests on: a trigger can be dropped wherever
  // the event already is, without that code knowing which island it is on.
  const l = martial(3);
  assert.deepEqual(bump(l, 'catnip', 5), []);
  assert.deepEqual(progress(l), { done: 0, total: 2 });
});

test('a goal of one speaks once, on completion', () => {
  const l = martial(0);
  const said = bump(l, 'coreDown', 1);
  assert.equal(said.length, 1);
  assert.equal(said[0].done, true);
  assert.ok(allComplete(l));
});

test('progress speaks at each tenth, not at each step', () => {
  const l = [{ key: 'x', goal: 100, at: 0, what: 'Collect a hundred' }];
  let spoke = 0;
  for (let i = 0; i < 100; i++) spoke += bump(l, 'x', 1).length;
  assert.equal(spoke, 10, 'ten notices for a hundred, not a hundred');
  assert.ok(isDone(l[0]));
});

test('a finished objective stops counting and stops speaking', () => {
  const l = martial(2);
  bump(l, 'obeliskDown', 5);
  assert.equal(l[0].at, 2, 'clamped to the goal');
  assert.deepEqual(bump(l, 'obeliskDown', 1), [], 'and silent after');
});

test('setTo is idempotent, which is why the towers use it', () => {
  // Towers come down by an axe, by `crash` at a terminal, or by a repair drone
  // failing to raise one. Counting each route is three chances to count one
  // tower twice; the world knows how many are standing, so it just says so.
  const l = martial(4);
  setTo(l, 'obeliskDown', 2);
  setTo(l, 'obeliskDown', 2);
  setTo(l, 'obeliskDown', 2);
  assert.equal(l[0].at, 2);
  setTo(l, 'obeliskDown', 1);
  assert.equal(l[0].at, 2, 'and it never counts backwards');
});

test('allComplete wants every one of them', () => {
  const l = martial(2);
  assert.equal(allComplete(l), false);
  setTo(l, 'obeliskDown', 2);
  assert.equal(allComplete(l), false, 'the towers are not the core');
  bump(l, 'coreDown', 1);
  assert.equal(allComplete(l), true);
  assert.equal(allComplete([]), false, 'and an empty list is not a won run');
});

test('a line reads as a task, with a count only where a count helps', () => {
  const l = martial(3);
  assert.ok(line(l[0]).endsWith('0 / 3'));
  assert.ok(!line(l[1]).includes('/'), 'one-of-one needs no fraction');
});

test('only the counts ride the save, so the wording can be improved later', () => {
  const l = martial(4);
  setTo(l, 'obeliskDown', 3);
  const packed = packObjectives(l);
  assert.deepEqual(packed, { obeliskDown: 3, coreDown: 0 });

  const back = applyObjectives(martial(4), packed);
  assert.equal(back[0].at, 3);
  // A save from an island that has since gained a tower still loads.
  const wider = applyObjectives(martial(6), packed);
  assert.equal(wider[0].at, 3);
  assert.equal(wider[0].goal, 6);
  // And one whose count was cut does not end up over its own goal.
  const narrow = applyObjectives(martial(2), packed);
  assert.equal(narrow[0].at, 2);
});

test('applyObjectives survives nothing to apply', () => {
  assert.doesNotThrow(() => applyObjectives(null, null));
  assert.doesNotThrow(() => applyObjectives(martial(2), null));
});
