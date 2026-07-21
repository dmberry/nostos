// Unit tests for the Scylla/Charybdis arcade run (src/game/narrows.js). Pure
// rules, so no canvas — same deal as snake and strait.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  newNarrowsRun, narrowsSteer, narrowsTick, narrowsProgress,
  NARROWS_W, SHIP_ROW, RUN_ROWS, PULL_FROM, DRAG_LIMIT, MAX_REACH,
} from '../src/game/narrows.js';

const never = () => 0.99;   // rng that never spawns a head and never tugs
const always = () => 0.0;   // rng that always spawns the deepest head, always tugs

test('a clean run through open water costs nothing', () => {
  const s = newNarrowsRun(never);
  s.rows.fill(0);                       // open channel ahead
  let bites = 0;
  for (let i = 0; i < RUN_ROWS + 2 && !s.over; i++) {
    if (narrowsTick(s, never) === 'bite') bites += 1;
  }
  assert.equal(s.over, true);
  assert.equal(s.outcome, 'through');
  assert.equal(bites, 0, 'nothing touched you');
  assert.equal(s.bites, 0);
});

test('THE LANE INVARIANT: a head can never reach into Charybdis\'s pull', () => {
  // If the deepest possible head sealed the channel up to the pull zone, the
  // only way past would be to drift into her — and the run would be a coin
  // flip rather than a passage. There must always be clear water between them.
  assert.ok(MAX_REACH < PULL_FROM, `MAX_REACH ${MAX_REACH} must be < PULL_FROM ${PULL_FROM}`);
  // ...and that gap must be sailable, not a single hair-width column.
  assert.ok(PULL_FROM - MAX_REACH >= 2, 'the safe lane must be at least two columns wide');
});

test('a head that reaches the ship takes one thing, and the run goes on', () => {
  const s = newNarrowsRun(never);
  s.rows.fill(0);
  s.rows[SHIP_ROW - 1] = NARROWS_W;      // a head about to arrive on the ship's row
  s.x = 2;
  const ev = narrowsTick(s, never);
  assert.equal(ev, 'bite');
  assert.equal(s.bites, 1);
  assert.equal(s.over, false, 'a bite does NOT end the passage');
});

test('bites accumulate rather than ending it — you can be nibbled the whole way', () => {
  const s = newNarrowsRun(never);
  s.x = 1;
  let bites = 0;
  for (let i = 0; i < RUN_ROWS + 2 && !s.over; i++) {
    s.rows[SHIP_ROW - 1] = NARROWS_W;    // keep feeding heads onto her line
    if (narrowsTick(s, never) === 'bite') bites += 1;
  }
  assert.ok(bites > 1, `expected repeated bites, got ${bites}`);
  assert.equal(s.outcome, 'through', 'she nibbles, she does not sink you');
});

test('the grace period stops one head taking everything at once', () => {
  const s = newNarrowsRun(never);
  s.x = 1;
  s.rows[SHIP_ROW - 1] = NARROWS_W;
  assert.equal(narrowsTick(s, never), 'bite');
  // immediately present another: within grace it must not count
  s.rows[SHIP_ROW - 1] = NARROWS_W;
  assert.equal(narrowsTick(s, never), null, 'still in grace');
  assert.equal(s.bites, 1);
});

test('lingering in the pull is what sinks you, not one brush with it', () => {
  const s = newNarrowsRun(never);
  s.rows.fill(0);
  s.x = NARROWS_W - 1;                   // deep in her
  let ev = null, ticks = 0;
  while (!s.over && ticks < 100) { ev = narrowsTick(s, never); ticks += 1; }
  assert.equal(ev, 'swallowed');
  assert.equal(s.outcome, 'swallowed');
  assert.ok(ticks > 1, 'she does not take you on the first tick');
});

test('steering out of the pull sheds the drag, but slower than it built', () => {
  const s = newNarrowsRun(never);
  s.rows.fill(0);
  s.x = NARROWS_W - 1;
  narrowsTick(s, never);
  const peak = s.drag;
  assert.ok(peak > 0);
  s.x = 2;                               // hard over, out of her
  narrowsTick(s, never);
  assert.ok(s.drag < peak, 'drag falls once clear');
  assert.ok(s.drag > 0 || peak <= 2, 'but is not wiped in a single tick');
});

test('the helm is clamped to the channel: never onto the cliff, never past the edge', () => {
  const s = newNarrowsRun(never);
  for (let i = 0; i < 40; i++) narrowsSteer(s, -1);
  assert.equal(s.x, 1, 'column 0 is the cliff face itself');
  for (let i = 0; i < 40; i++) narrowsSteer(s, +1);
  assert.equal(s.x, NARROWS_W - 1);
});

test('a finished run ignores further steering and ticks', () => {
  const s = newNarrowsRun(never);
  s.over = true; s.outcome = 'through';
  const x = s.x;
  narrowsSteer(s, +1);
  assert.equal(s.x, x);
  assert.equal(narrowsTick(s, never), null);
});

test('progress runs 0 to 1 across the passage', () => {
  const s = newNarrowsRun(never);
  assert.equal(narrowsProgress(s), 0);
  s.rows.fill(0);
  for (let i = 0; i < RUN_ROWS && !s.over; i++) narrowsTick(s, never);
  assert.equal(narrowsProgress(s), 1);
});

test('heads are spaced: the generator never walls the channel off row after row', () => {
  const s = newNarrowsRun(always);        // rng that always wants a head
  let consecutive = 0, worst = 0, ticks = 0;
  // Only while the run is LIVE: a finished run stops shifting rows, so ticking
  // on would count the same frozen row over and over and report a false stack.
  while (!s.over && ticks < 200) {
    narrowsTick(s, always);
    ticks += 1;
    if (s.rows[0] > 0) { consecutive += 1; worst = Math.max(worst, consecutive); }
    else consecutive = 0;
  }
  assert.ok(ticks > 10, 'the run actually advanced');
  assert.ok(worst <= 1, `heads must not stack row on row (worst run: ${worst})`);
});
