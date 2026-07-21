// Unit tests for the Scylla/Charybdis arcade run (src/game/narrows.js). Pure
// rules, so no canvas — same deal as snake and strait.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  newNarrowsRun, narrowsSteer, narrowsRow, narrowsTick, narrowsProgress,
  narrowsStart, narrowsCalm, narrowsPressure, narrowsAnimate, charybdisReachAt,
  HULL_MAX, NARROWS_W, SHIP_ROW, SHIP_ROW_MIN, SHIP_ROW_MAX,
  RUN_ROWS, TOTAL_ROWS, WARMUP_ROWS, VIEW_ROWS,
  SCYLLA_MAX, SCYLLA_TRIGGER, SCYLLA_REAR, CHARYBDIS_MAX, CHARYBDIS_ROWS, CHARYBDIS_CORE, RAM_MAX,
  SAFE_LANE, MONSTERS, CHICANE_FROM,
} from '../src/game/narrows.js';

const never = () => 0.99;   // rng that never surfaces anything
const always = () => 0.0;   // rng that surfaces everything, as big as it goes

// Most tests are about the DANGEROUS part of the passage, so they start a run
// with the coin in and the open-water run-in already behind them.
const started = (rng) => { const s = newNarrowsRun(rng); narrowsStart(s); s.warmup = 0; return s; };
const clear = (s) => { s.rows.forEach((r) => { r.rock = -1; }); };
// Park Scylla out of the way for tests that are about something else.
const calmScylla = (s) => { s.scylla = { row: 0, reach: 0, state: 'lurk', timer: 0, cool: 999 }; };

// Charybdis's reach is RECOMPUTED from her row every tick (she widens as she
// comes down the channel), so a test cannot just assign a reach and expect it to
// survive the step. This puts her where the step will open her fully, across the
// ship's row.
const whirlpoolAcross = (s) => {
  s.y = 11; s.yDraw = 11;
  s.charybdis = { row: 9, reach: 0 };
};

test('THE LANE INVARIANT: the two of them can never seal the channel', () => {
  // If Scylla at her deepest and Charybdis at hers could meet, a row would be a
  // wall and the run would be luck rather than steering. Checked as arithmetic
  // AND against the generator at its most aggressive.
  assert.ok(SCYLLA_MAX + CHARYBDIS_MAX + SAFE_LANE <= NARROWS_W,
    `${SCYLLA_MAX} + ${CHARYBDIS_MAX} + ${SAFE_LANE} must fit in ${NARROWS_W}`);
  const s = started(always);
  let worstGap = NARROWS_W;
  for (let i = 0; i < 400 && !s.over; i++) {
    s.x = 6;                                  // never actually touch anything
    narrowsTick(s, always);
    for (let r = 0; r < VIEW_ROWS; r++) {
      const left = s.scylla.row === r ? Math.ceil(s.scylla.reach) : 0;
      worstGap = Math.min(worstGap, NARROWS_W - left - charybdisReachAt(s, r));
    }
  }
  assert.ok(worstGap >= SAFE_LANE, `every row must leave ${SAFE_LANE} clear; worst was ${worstGap}`);
});

test('PARKING IS NOT A STRATEGY: sitting mid-channel must not survive the run', () => {
  // The bug this exists to prevent: Scylla reaches at most SCYLLA_MAX and
  // Charybdis at most CHARYBDIS_MAX, so the seam between them was permanently
  // safe water. You could hold one column for two minutes, never touch the helm
  // and win. Rocks and chicanes sit IN that seam precisely so the safe lane has
  // to be earned.
  let survivedParked = 0;
  for (let seed = 0; seed < 12; seed++) {
    let k = seed * 977 + 13;
    const rng = () => ((k = (k * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const s = started(rng);
    let hit = false;
    for (let i = 0; i < 600 && !s.over; i++) {
      // never steer: the whole point is that doing nothing must not be safe
      if (narrowsTick(s, rng)) hit = true;
    }
    if (!hit) survivedParked += 1;
  }
  assert.equal(survivedParked, 0,
    `a parked ship came through untouched in ${survivedParked}/12 runs — the seam is still free`);
});

test('a rock is always dodgeable: at most one column of any row is stone', () => {
  const s = started(always);
  for (let i = 0; i < 400 && !s.over; i++) {
    s.x = 6;
    narrowsTick(s, always);
    for (const row of s.rows) {
      assert.ok(row.rock < NARROWS_W, `a rock outside the channel: ${row.rock}`);
    }
  }
});

test('THE CHICANE: late on, the rocks walk across the channel instead of scattering', () => {
  // A run of rocks stepping one column per row, so the gap slides and you have
  // to follow it. Only in the back half — early channel stays scattered.
  const s = started(always);
  s.rowsLeft = WARMUP_ROWS + Math.round(RUN_ROWS * (1 - CHICANE_FROM)) - 10;
  s.x = 6;
  const cols = [];
  for (let i = 0; i < 12 && !s.over; i++) { narrowsTick(s, always); cols.push(s.rows[0].rock); }
  assert.ok(s.chicane || cols.every((c) => c >= 0), 'a chicane should have started');
  for (let i = 1; i < cols.length; i++) {
    assert.equal(Math.abs(cols[i] - cols[i - 1]), 1, `chicane rocks step one column: ${cols}`);
  }
});

test('the early channel does NOT run chicanes', () => {
  const s = started(always);
  s.rowsLeft = TOTAL_ROWS;                    // pressure 0
  for (let i = 0; i < 30 && !s.over; i++) narrowsTick(s, always);
  assert.equal(s.chicane, null, 'no chicane before the channel tightens');
});

test('both monsters are named', () => {
  assert.equal(MONSTERS.scylla.name, 'SCYLLA');
  assert.equal(MONSTERS.charybdis.name, 'CHARYBDIS');
  assert.equal(MONSTERS.scylla.side, 'left');
  assert.equal(MONSTERS.charybdis.side, 'right');
});

test('SCYLLA is ONE creature who lunges when you come near her, not a field of heads', () => {
  // She keeps station on your row, rears where you can see it, and only the
  // strike itself takes anything.
  const s = started(never);
  clear(s);
  s.x = 1; s.y = SHIP_ROW;
  s.scylla.row = SHIP_ROW;
  let ev = null, reared = false;
  for (let i = 0; i < SCYLLA_REAR + 4 && !ev; i++) {
    if (s.scylla.state === 'rear') reared = true;
    ev = narrowsTick(s, never);
    clear(s);
  }
  assert.ok(reared, 'she must telegraph before she takes');
  assert.equal(ev, 'bite');
  assert.equal(s.bites, 1);
  assert.equal(s.over, false, 'she nibbles; she does not end it');
});

test('SCYLLA is out of sight until she commits, and never takes without showing first', () => {
  // She is drawn from `vis`, so this is the rule the picture obeys: nothing on
  // the port hand while she lurks, and no bite that was not preceded by frames
  // of her out of the water.
  const s = started(never);
  clear(s);
  s.x = 1; s.y = SHIP_ROW; s.scylla.row = SHIP_ROW;
  assert.equal(s.scylla.vis, 0, 'invisible while lurking');
  let shown = 0, ev = null;
  for (let i = 0; i < SCYLLA_REAR + 4 && ev !== 'bite'; i++) {
    ev = narrowsTick(s, never);
    clear(s);
    if (s.scylla.vis > 0.5) shown += 1;
  }
  assert.equal(ev, 'bite');
  assert.ok(shown >= 3, `she must be plainly visible before she takes; only ${shown} ticks`);
  // and once she is done she goes back under
  for (let i = 0; i < 40; i++) { clear(s); narrowsTick(s, never); if (s.scylla.state === 'lurk') break; }
  assert.equal(s.scylla.state, 'lurk');
  assert.equal(s.scylla.vis, 0, 'and she is gone again');
});

test('SCYLLA ignores you if you keep off her side', () => {
  const s = started(never);
  clear(s);
  s.x = SCYLLA_TRIGGER;                        // one column outside her interest
  for (let i = 0; i < 60 && !s.over; i++) { clear(s); assert.equal(narrowsTick(s, never), null); }
  assert.equal(s.bites, 0);
  assert.equal(s.scylla.state, 'lurk');
});

test('you can duck a lunge by rowing out of her row', () => {
  // The whole reason the helm works fore-and-aft: her strike is one row wide and
  // you get SCYLLA_REAR ticks of warning to leave it.
  const s = started(never);
  clear(s);
  s.x = 1; s.y = SHIP_ROW; s.scylla.row = SHIP_ROW;
  narrowsTick(s, never);                       // she notices and rears
  assert.equal(s.scylla.state, 'rear');
  narrowsRow(s, -1); narrowsRow(s, -1); narrowsRow(s, -1);   // pull ahead of her
  let ev = null;
  for (let i = 0; i < SCYLLA_REAR + 3 && !ev; i++) { clear(s); ev = narrowsTick(s, never); }
  assert.equal(s.bites, 0, 'the lunge closed on empty water');
});

test('CHARYBDIS is one big whirlpool that comes down the channel and ends the voyage', () => {
  const s = started(never);
  clear(s);
  calmScylla(s);
  s.charybdis = { row: s.y - 1, reach: CHARYBDIS_MAX };
  s.x = NARROWS_W - 1;                         // hard against her side
  assert.equal(narrowsTick(s, never), 'swallowed');
  assert.equal(s.over, true);
  assert.equal(s.outcome, 'swallowed');
});

test('CHARYBDIS covers a BAND of rows, not a line', () => {
  const s = started(never);
  s.charybdis = { row: 5, reach: CHARYBDIS_MAX };
  assert.equal(charybdisReachAt(s, 4), 0);
  assert.equal(charybdisReachAt(s, 5), CHARYBDIS_MAX);
  assert.equal(charybdisReachAt(s, 5 + CHARYBDIS_ROWS - 1), CHARYBDIS_MAX);
  assert.equal(charybdisReachAt(s, 5 + CHARYBDIS_ROWS), 0);
});

test('a shut whirlpool takes nothing: her mouth has to be open', () => {
  const s = started(never);
  clear(s); calmScylla(s);
  s.charybdis = { row: s.y, reach: 0 };
  s.x = NARROWS_W - 1;
  assert.equal(narrowsTick(s, never), null);
  assert.equal(s.over, false);
});

test('the grace period never shields you from Charybdis', () => {
  // Being freshly bitten by Scylla must not buy a free pass through the thing
  // that ends the run — that would be the wrong lesson entirely.
  const s = started(never);
  clear(s); calmScylla(s);
  s.grace = 4;                                // just been bitten
  s.charybdis = { row: s.y - 1, reach: CHARYBDIS_MAX };
  s.x = NARROWS_W - 1;
  assert.equal(narrowsTick(s, never), 'swallowed');
});

test('steering between them is always possible: the seam is sailable', () => {
  const s = started(never);
  clear(s);
  s.scylla = { row: s.y, reach: SCYLLA_MAX, state: 'strike', timer: 2, cool: 0 };
  s.charybdis = { row: s.y - 1, reach: CHARYBDIS_MAX };
  s.x = SCYLLA_MAX;                           // first clear column past Scylla
  assert.equal(narrowsTick(s, never), null, 'the seam is clear water');
  assert.equal(s.over, false);
});

test('bites accumulate rather than ending it', () => {
  const s = started(never);
  s.x = 0;
  let bites = 0;
  for (let i = 0; i < 400 && !s.over; i++) {
    clear(s);
    if (narrowsTick(s, never) === 'bite') bites += 1;
  }
  assert.ok(bites > 3, `expected repeated bites, got ${bites}`);
  assert.equal(s.over, false, 'still afloat after a long mauling');
});

test('the grace period stops one head taking everything at once', () => {
  const s = started(never);
  clear(s);
  s.x = 0;
  s.scylla = { row: s.y, reach: SCYLLA_MAX, state: 'strike', timer: 4, cool: 0 };
  assert.equal(narrowsTick(s, never), 'bite');
  s.scylla = { row: s.y, reach: SCYLLA_MAX, state: 'strike', timer: 4, cool: 0 };
  clear(s);
  assert.equal(narrowsTick(s, never), null, 'still in grace');
  assert.equal(s.bites, 1);
});

test('striking a rock costs you but does not end the run', () => {
  const s = started(never);
  clear(s); calmScylla(s);
  s.rows[s.y] = { rock: 6 };
  s.x = 6;
  // the row the ship sits in shifts down one on the tick, so seed the one above
  s.rows[s.y - 1] = { rock: 6 };
  assert.equal(narrowsTick(s, never), 'rock');
  assert.equal(s.rocks, 1);
  assert.equal(s.over, false);
});

test('THE RUN-IN: you come up to the narrows on open water', () => {
  const s = newNarrowsRun();
  narrowsStart(s);
  assert.ok(narrowsCalm(s), 'opens calm');
  assert.ok(s.rows.every((r) => r.rock < 0), 'and on genuinely open water');
  let touched = 0;
  for (let i = 0; i < WARMUP_ROWS; i++) {
    s.x = 0;                                   // hard against the wall: still safe
    if (narrowsTick(s, always)) touched += 1;
  }
  assert.equal(touched, 0, 'nothing reaches you during the run-in');
  assert.equal(narrowsCalm(s), false, 'and then the channel closes');
});

test('the cabinet waits for a coin', () => {
  const s = newNarrowsRun();
  assert.equal(s.attract, true);
  const left = s.rowsLeft;
  assert.equal(narrowsTick(s, never), null, 'no tick without a coin');
  assert.equal(s.rowsLeft, left);
  narrowsSteer(s, +1);
  narrowsRow(s, -1);
  assert.equal(s.x, 6, 'the helm is dead too');
  assert.equal(s.y, SHIP_ROW);
  assert.equal(narrowsStart(s), true);
  assert.equal(narrowsStart(s), false, 'a second coin does nothing');
});

test('the passage is long enough to be a game, and gets harder', () => {
  // Long enough to be a game, short enough not to be a haul: about a minute.
  const secs = TOTAL_ROWS * 0.10;
  assert.ok(secs >= 45, `passage is only ${Math.round(secs)}s`);
  assert.ok(secs <= 90, `passage is ${Math.round(secs)}s — too long to sit through`);
  const s = started(never);
  s.rowsLeft = TOTAL_ROWS;
  const early = narrowsPressure(s);
  s.rowsLeft = WARMUP_ROWS + Math.round(RUN_ROWS * 0.1);
  const late = narrowsPressure(s);
  assert.ok(late > early, 'the channel thickens as you go');
});

test('the helm is clamped to the channel, across AND along', () => {
  const s = started(never);
  for (let i = 0; i < 60; i++) narrowsSteer(s, -1);
  assert.equal(s.x, 0);
  for (let i = 0; i < 60; i++) narrowsSteer(s, +1);
  assert.equal(s.x, NARROWS_W - 1);
  for (let i = 0; i < 60; i++) narrowsRow(s, -1);
  assert.equal(s.y, SHIP_ROW_MIN);
  for (let i = 0; i < 60; i++) narrowsRow(s, +1);
  assert.equal(s.y, SHIP_ROW_MAX);
  assert.ok(SHIP_ROW_MAX < VIEW_ROWS, 'and never off the bottom of the view');
});

test('a finished run ignores further steering and ticks', () => {
  const s = started(never);
  s.over = true; s.outcome = 'through';
  const x = s.x, y = s.y;
  narrowsSteer(s, +1);
  narrowsRow(s, -1);
  assert.equal(s.x, x);
  assert.equal(s.y, y);
  assert.equal(narrowsTick(s, never), null);
});

test('progress runs 0 to 1 across the passage', () => {
  const s = started(never);
  s.rowsLeft = TOTAL_ROWS;
  assert.equal(narrowsProgress(s), 0);
  s.x = 6;
  calmScylla(s);
  for (let i = 0; i < TOTAL_ROWS && !s.over; i++) { clear(s); s.charybdis = null; narrowsTick(s, never); }
  assert.equal(s.outcome, 'through');
  assert.equal(narrowsProgress(s), 1);
});

test('the hull is finite: six strikes and she comes apart', () => {
  // Rocks used to be a tally that only went up, so a hopeless run had no floor —
  // you could grind the whole passage off the rocks and still arrive.
  const s = started(never);
  calmScylla(s);
  let ev = null;
  for (let i = 0; i < HULL_MAX && !s.over; i++) {
    clear(s);
    s.rows[s.y - 1] = { rock: 6 };
    s.x = 6;
    s.grace = 0;                       // ignore the flash between strikes
    ev = narrowsTick(s, never);
  }
  assert.equal(ev, 'wrecked');
  assert.equal(s.over, true);
  assert.equal(s.outcome, 'wrecked');
  assert.ok(s.hull <= 0);
});

test('animation is presentation only: it never moves the ship the rules use', () => {
  const s = started(never);
  s.x = 3; s.y = 12;
  narrowsAnimate(s, 0.016, 0.5);
  assert.equal(s.x, 3, 'the logical column is untouched');
  assert.equal(s.y, 12, 'and so is the logical row');
  assert.equal(s.frac, 0.5);
  for (let i = 0; i < 90; i++) narrowsAnimate(s, 0.016, 0);
  assert.equal(s.xDraw, 3, 'and it settles exactly on the column');
  assert.equal(s.yDraw, 12);
});

test('THE BRONZE RAM shoulders rocks aside without touching the hull', () => {
  const s = started(never);
  calmScylla(s);
  s.ram = RAM_MAX;
  const hits = [];
  for (let i = 0; i < RAM_MAX; i++) {
    clear(s);
    s.rows[s.y - 1] = { rock: 6 };
    s.x = 6; s.grace = 0;
    hits.push(narrowsTick(s, never));
  }
  assert.deepEqual(hits, Array(RAM_MAX).fill('shatter'));
  assert.equal(s.hull, HULL_MAX, 'the hull is untouched while the beak holds');
  assert.equal(s.ram, 0);
  assert.equal(s.rocks, RAM_MAX, 'but the strikes are still counted');
  // and once it is spent, rocks cost what they always cost
  clear(s);
  s.rows[s.y - 1] = { rock: 6 };
  s.x = 6; s.grace = 0;
  assert.equal(narrowsTick(s, never), 'rock');
  assert.equal(s.hull, HULL_MAX - 1);
});

test('the ram is NO use against either monster', () => {
  // The whole reason it is a ram and not a gun. If it saved you from Scylla or
  // Charybdis it would be answering the wrong hazard.
  const s = started(never);
  clear(s); calmScylla(s);
  s.ram = RAM_MAX;
  s.charybdis = { row: s.y - 1, reach: CHARYBDIS_MAX };
  s.x = NARROWS_W - 1;
  assert.equal(narrowsTick(s, never), 'swallowed');
  assert.equal(s.ram, RAM_MAX, 'it is not even spent trying');

  const s2 = started(never);
  clear(s2);
  s2.ram = RAM_MAX;
  s2.x = 0;
  s2.scylla = { row: s2.y, reach: SCYLLA_MAX, vis: 1, state: 'strike', timer: 4, cool: 0 };
  assert.equal(narrowsTick(s2, never), 'bite');
  assert.equal(s2.ram, RAM_MAX);
});

test('no ram, no pips: a run without one is exactly as it was', () => {
  const s = newNarrowsRun();
  assert.equal(s.ram, 0);
  assert.equal(s.ramFitted, false);
  assert.equal(newNarrowsRun({ ram: true }).ram, RAM_MAX);
  assert.equal(newNarrowsRun({ ram: true }).ramFitted, true);
});

test('CHARYBDIS: her outer water costs the HULL and throws you clear', () => {
  // Clipping the edge of a whirlpool used to delete you from the run. The pull
  // batters you and spits you out to port instead; only the throat is final.
  const s = started(never);
  clear(s); calmScylla(s);
  whirlpoolAcross(s);
  s.x = NARROWS_W - CHARYBDIS_MAX;            // the outermost column of her reach
  assert.equal(narrowsTick(s, never), 'churn');
  assert.equal(s.over, false, 'the run goes on');
  assert.equal(s.hull, HULL_MAX - 1);
  assert.ok(s.x < NARROWS_W - s.charybdis.reach, `thrown clear of the pull, got x=${s.x}`);
  assert.ok(s.grace > 0, 'and not billed twice for the one mistake');
});

test('CHARYBDIS: her throat still takes the ship', () => {
  const s = started(never);
  clear(s); calmScylla(s);
  s.charybdis = { row: s.y - 1, reach: CHARYBDIS_MAX };
  s.x = NARROWS_W - 1;                        // hard against the wall: the mouth
  assert.equal(narrowsTick(s, never), 'swallowed');
  assert.equal(s.over, true);
  assert.equal(s.outcome, 'swallowed');
});

test('CHARYBDIS: the boundary between pull and throat is exactly CHARYBDIS_CORE', () => {
  const swallowedAt = (x) => {
    const s = started(never);
    clear(s); calmScylla(s);
    whirlpoolAcross(s);
    s.x = x;
    return narrowsTick(s, never) === 'swallowed';
  };
  assert.equal(swallowedAt(NARROWS_W - CHARYBDIS_CORE), true, 'innermost pull column is the mouth');
  assert.equal(swallowedAt(NARROWS_W - CHARYBDIS_CORE - 1), false, 'one out from it is only the pull');
});

test('the churn can still sink you: enough of her water and the hull goes', () => {
  const s = started(never);
  clear(s); calmScylla(s);
  let ev = null;
  for (let i = 0; i < HULL_MAX && !s.over; i++) {
    clear(s);
    whirlpoolAcross(s);
    s.x = NARROWS_W - CHARYBDIS_MAX;
    s.grace = 0;
    ev = narrowsTick(s, never);
  }
  assert.equal(ev, 'wrecked');
  assert.equal(s.outcome, 'wrecked');
});

test('FLOTSAM: timber puts a hull back, and only up to full', () => {
  const s = started(never);
  clear(s); calmScylla(s);
  s.hull = 2;
  s.rows[s.y - 1] = { rock: -1, pick: 6, kind: 'timber' };
  s.x = 6;
  assert.equal(narrowsTick(s, never), 'pickup');
  assert.equal(s.hull, 3);
  assert.equal(s.picks, 1);
  assert.equal(s.lastPick, 'timber');
  // and it cannot be taken twice
  assert.equal(s.rows[s.y].pick, -1);
  s.hull = HULL_MAX;
  clear(s);
  s.rows[s.y - 1] = { rock: -1, pick: 6, kind: 'timber' };
  narrowsTick(s, never);
  assert.equal(s.hull, HULL_MAX, 'never over full');
});

test('FLOTSAM: a broken beak recharges the ram, and fits one if you came without', () => {
  const s = started(never);
  clear(s); calmScylla(s);
  assert.equal(s.ramFitted, false);
  s.rows[s.y - 1] = { rock: -1, pick: 6, kind: 'beak' };
  s.x = 6;
  assert.equal(narrowsTick(s, never), 'pickup');
  assert.equal(s.ramFitted, true);
  assert.equal(s.ram, 1);
  for (let i = 0; i < RAM_MAX + 2; i++) {
    clear(s);
    s.rows[s.y - 1] = { rock: -1, pick: 6, kind: 'beak' };
    narrowsTick(s, never);
  }
  assert.equal(s.ram, RAM_MAX, 'never over a full set of charges');
});

test('FLOTSAM is reachable even in the grace period', () => {
  // A recent knock must not stop you getting a hand to a spar.
  const s = started(never);
  clear(s); calmScylla(s);
  s.hull = 1; s.grace = 3;
  s.rows[s.y - 1] = { rock: -1, pick: 6, kind: 'timber' };
  s.x = 6;
  narrowsTick(s, never);
  assert.equal(s.hull, 2);
});

test('THE RAM IS A CONSUMABLE: spending the last charge marks the beak gone', () => {
  const s = started(never);
  calmScylla(s);
  s.ram = RAM_MAX; s.ramFitted = true;
  assert.equal(s.ramSpent, false);
  for (let i = 0; i < RAM_MAX; i++) {
    clear(s);
    s.rows[s.y - 1] = { rock: 6, pick: -1, kind: null };
    s.x = 6; s.grace = 0;
    assert.equal(narrowsTick(s, never), 'shatter');
  }
  assert.equal(s.ram, 0);
  assert.equal(s.ramSpent, true, 'the hub reads this to take the item away');
});

test('a ram that is NOT run down survives the passage', () => {
  const s = started(never);
  calmScylla(s);
  s.ram = RAM_MAX; s.ramFitted = true;
  clear(s);
  s.rows[s.y - 1] = { rock: 6, pick: -1, kind: null };
  s.x = 6; s.grace = 0;
  narrowsTick(s, never);
  assert.equal(s.ram, RAM_MAX - 1);
  assert.equal(s.ramSpent, false);
});

test('the ship rides in the MIDDLE of the view, and can drop back for reading time', () => {
  assert.ok(Math.abs(SHIP_ROW - VIEW_ROWS / 2) <= 1, `SHIP_ROW ${SHIP_ROW} should be mid-view of ${VIEW_ROWS}`);
  assert.ok(SHIP_ROW_MAX - SHIP_ROW > SHIP_ROW - SHIP_ROW_MIN,
    'the band must run further aft than forward: dropping back is what buys warning');
  assert.ok(SHIP_ROW_MAX < VIEW_ROWS);
});
