// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #192 — what the estate does with a list.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RECOVERY_AFTER, DETAIL_SIZE, awolList, awolText, dueForRecovery, standDown, isUnderRecovery,
} from '../src/game/awol.js';

const unit = (over = {}) => ({
  type: 't2', _netId: 'T2-114', _netHome: 'OB_7781', x: 30, y: 41, silentT: 24, ...over,
});

test('the list is what the M-class acts on, and nothing else', () => {
  // The page and the hunt read the same flag, so they can never disagree about
  // who is on it.
  const robots = [unit({ awol: true }), unit({ _netId: 'T1-002' }), unit({ _netId: 'T2-9', awol: true, dead: true })];
  const l = awolList(robots);
  assert.equal(l.length, 1);
  assert.equal(l[0].id, 'T2-114');
});

test('THE LIST CIRCULATES: it is the island\'s, not the tower\'s', () => {
  // A unit written up at the far end of the map is a unit every garrison here
  // knows about. That is what a network is for, and what makes cutting one
  // worth doing.
  const far = unit({ _netId: 'M4-77', _netHome: 'OB_0002', awol: true, x: 110, y: 9 });
  const page = awolText('OB_7781', awolList([far]));
  assert.match(page, /Distribution: all nodes/);
  assert.match(page, /M4-77/);
  assert.match(page, /OB_0002/, 'and it says whose unit it was');
});

test('the page names the node the way every other file in the folder does', () => {
  // The caller hands over the node OBJECT, not its code — `rosterText` and
  // `sightingsText` both take it that way, and taking it differently here
  // printed [object Object] at the top of the sheet.
  assert.match(awolText({ code: 'OB_3516' }, []), /^OB_3516 /);
  assert.match(awolText('OB_0001', []), /^OB_0001 /, 'and a bare string still works');
});

test('an empty muster says so plainly', () => {
  const page = awolText('OB_7781', []);
  assert.match(page, /All hands reporting/);
  assert.ok(!/RECOVERY/.test(page));
});

test('a broken wire is admitted on the page', () => {
  const page = awolText('OB_7781', awolList([unit({ awol: true })]), { netDown: true });
  assert.match(page, /distribution incomplete/i);
});

test('AND THEN SOMEBODY IS SENT — after a while, and only once', () => {
  const r = unit({ awol: true });
  assert.deepEqual(dueForRecovery([r], RECOVERY_AFTER / 2, true), [], 'not yet');
  const due = dueForRecovery([r], RECOVERY_AFTER, true);
  assert.deepEqual(due, [r]);
  assert.equal(isUnderRecovery(r), true);
  assert.deepEqual(dueForRecovery([r], 999, true), [], 'and never twice for one unit');
  assert.ok(DETAIL_SIZE >= 1);
});

test('A TOWER THAT IS DOWN CANNOT RAISE A DETAIL', () => {
  // The join between this and maintenance mode (#191): the board you spend to
  // silence a node is also the board that keeps your escort off a wanted list.
  const r = unit({ awol: true });
  assert.deepEqual(dueForRecovery([r], 999, false), [], 'no wire, no paperwork');
  assert.equal(isUnderRecovery(r), false);
  assert.deepEqual(dueForRecovery([r], 999, true), [r], 'and it resumes when the wire is back');
});

test('a unit that comes back takes its paperwork with it', () => {
  const r = unit({ awol: true });
  dueForRecovery([r], 999, true);
  assert.equal(isUnderRecovery(r), true);
  r.awol = false;
  standDown(r);
  assert.equal(isUnderRecovery(r), false);
  assert.deepEqual(awolList([r]), [], 'and off the circulated list');
});

test('the clock resets when the flag clears, so a second lapse starts again', () => {
  const r = unit({ awol: true });
  dueForRecovery([r], RECOVERY_AFTER - 5, true);
  r.awol = false;
  dueForRecovery([r], 1, true);           // clears the clock
  r.awol = true;
  assert.deepEqual(dueForRecovery([r], 5, true), [], 'not straight back onto a detail');
});
