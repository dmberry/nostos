// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #191 — circuits as the currency of maintenance mode.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PART_COST, WINDOW, BOARDS_PER_TOWER,
  canSchedule, schedule, tickWindows, windowLeft, isOpenToHack, statusLine, serviceLog,
} from '../src/game/maintenance.js';
import { obeliskLive } from '../src/game/blight.js';

const node = (over = {}) => ({ code: 'OB_7781', x: 10, y: 10, ...over });

test('THE ECONOMY CLOSES: a tower pays for more windows than it costs', () => {
  // If a window cost more than felling a tower yields, the currency is
  // decoration and the choice is not a choice.
  assert.ok(BOARDS_PER_TOWER >= PART_COST * 2, 'one fight buys more than one window');
});

test('a work order needs a part', () => {
  assert.equal(canSchedule(node(), 0).ok, false);
  assert.match(canSchedule(node(), 0).why, /circuit board/);
  assert.equal(canSchedule(node(), PART_COST).ok, true);
});

test('a node already out of service takes no work order', () => {
  assert.equal(canSchedule(node({ destroyed: true }), 9).ok, false);
  assert.equal(canSchedule(node({ needsRebuild: true }), 9).ok, false);
  assert.equal(canSchedule(node({ jammed: true }), 9).ok, false);
  assert.equal(canSchedule(null, 9).ok, false);
});

test('A BOOKED NODE IS OFF THE NETWORK, by the same flag as a felled one', () => {
  // The point of using `jammed`: the fog, the blight, the shared sight, the
  // unit check-in and the light pools all already read it, so a window does to
  // the network everything felling does — without taking the tower off the
  // island, which is the trade.
  const o = node();
  assert.equal(obeliskLive(o), true);
  schedule(o);
  assert.equal(obeliskLive(o), false, 'the estate reads it as down');
  assert.equal(o.destroyed, undefined, 'but the tower is still standing');
});

test('and its covers are off while the window is open', () => {
  const o = node();
  assert.equal(isOpenToHack(o), false);
  schedule(o);
  assert.equal(isOpenToHack(o), true, 'one board, two doors');
  tickWindows([o], WINDOW + 1);
  assert.equal(isOpenToHack(o), false, 'and shut again when the order closes');
});

test('the window closes on its own and the node says so', () => {
  const o = node();
  schedule(o);
  assert.equal(windowLeft(o), WINDOW);
  assert.deepEqual(tickWindows([o], WINDOW / 2), [], 'not yet');
  assert.ok(windowLeft(o) < WINDOW);
  const back = tickWindows([o], WINDOW);
  assert.deepEqual(back, [o], 'the caller is handed the node so it can say so');
  assert.equal(o.jammed, false);
  assert.equal(obeliskLive(o), true, 'and it is back on the wire');
});

test('tickWindows leaves a felled node alone', () => {
  const dead = node({ destroyed: true, jammed: true });   // felled, not booked
  assert.deepEqual(tickWindows([dead], 999), [], 'no work order, nothing to close');
  assert.equal(dead.jammed, true);
});

test('the status line reads as the estate would file it', () => {
  const o = node();
  assert.equal(statusLine(o), null, 'nothing to report on a working node');
  schedule(o);
  assert.match(statusLine(o), /MAINTENANCE/);
  assert.match(statusLine(o), /window closes in/);
});

test("WHAT IS IN THE CABINET is the node's own, and always the same", () => {
  // These are people who came back: the engineer's handwriting on the tower you
  // booked out last week is the same handwriting this week.
  const a = serviceLog(node({ code: 'OB_1111' }));
  const b = serviceLog(node({ code: 'OB_1111' }));
  const c = serviceLog(node({ code: 'OB_9999' }));
  assert.deepEqual(a, b, 'deterministic per node');
  assert.notDeepEqual(a, c, 'and different nodes have different drawers');
  assert.ok(a.some((l) => /WORK ORDER/.test(l)), 'the estate printed a job card');
  assert.ok(a[a.length - 1].length > 20, 'and somebody left something in it');
});
