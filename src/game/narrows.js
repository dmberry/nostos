// THE NARROWS — the Scylla/Charybdis passage as an 8-bit arcade run.
//
// Homer's bargain was a choice: hug the cliff and lose a few for certain, or
// steer wide and gamble the ship. As a two-button modal that choice was made
// once and watched. Here it is made continuously, with your hands: the cliff is
// the left wall and Scylla's heads dart out of it, the right of the channel is
// Charybdis's pull. Every moment you are deciding how close to shave the rock,
// which is the same bargain played rather than picked.
//
// Pure state, no canvas and no globals, in the shape of game/snake.js — the hub
// owns the clock and the input, this owns the rules. `rng` is injected so a test
// can pin the run.

export const NARROWS_W = 12;      // channel width, in cells
export const VIEW_ROWS = 18;      // rows of channel on screen at once
export const SHIP_ROW = 13;       // the ship's fixed row (near the bottom)
export const RUN_ROWS = 64;       // how long the passage is, in ticks

// Charybdis owns the right of the channel. The further in you drift the harder
// she pulls, and `drag` is how much of you she has: reach the limit and she has
// all of it. Steering back out of the pull sheds it, but slower than it builds —
// so a long drift is not undone by one flick of the helm.
export const PULL_FROM = 8;
export const DRAG_LIMIT = 16;
export const DRAG_SHED = 2;

// Scylla's heads come out of the cliff (column 0) and reach into the channel.
// MAX_REACH is bounded well short of the pull zone: there is ALWAYS a lane
// through, so a run is never unwinnable — you just have to find it and be
// willing to sail closer to her than is comfortable.
export const MAX_REACH = 5;
const HEAD_GAP = 3;               // never two heads within this many rows

export function newNarrowsRun(rng = Math.random) {
  const s = {
    x: 4,                         // the ship's column
    rows: new Array(VIEW_ROWS).fill(0),   // rows[i] = how far a head reaches; 0 = clear
    rowsLeft: RUN_ROWS,
    drag: 0,                      // how much of you Charybdis has
    bites: 0,                     // heads that got you: each is one thing off the deck
    grace: 0,                     // brief invulnerability after a bite
    since: HEAD_GAP,              // rows since the last head
    over: false,
    outcome: null,                // 'through' | 'swallowed'
  };
  // Seed the visible channel so the run does not open on an empty screen.
  for (let i = 0; i < VIEW_ROWS; i++) s.rows[i] = nextRow(s, rng);
  return s;
}

// One new row at the top of the channel. Heads are spaced so there is always
// water between them, and never so deep that the only lane is inside the pull.
function nextRow(s, rng) {
  s.since += 1;
  if (s.since < HEAD_GAP) return 0;
  if (rng() < 0.42) {
    s.since = 0;
    return 1 + Math.floor(rng() * MAX_REACH);   // reaches columns 0..reach
  }
  return 0;
}

// Put the helm over. Clamped to the channel; column 0 is the cliff face itself,
// so the closest you may sail is 1.
export function narrowsSteer(s, dx) {
  if (s.over) return;
  s.x = Math.max(1, Math.min(NARROWS_W - 1, s.x + (dx < 0 ? -1 : 1)));
}

// Advance one row. Returns what happened this tick, for the hub to narrate:
// 'bite' (she took one), 'swallowed' (the pool has you), 'through' (clear), or
// null. Bites do NOT end the run — they accumulate, which is the whole shape of
// the thing: you can be nibbled the length of the strait and still get out.
export function narrowsTick(s, rng = Math.random) {
  if (s.over) return null;

  s.rows.pop();
  s.rows.unshift(nextRow(s, rng));
  s.rowsLeft -= 1;
  if (s.grace > 0) s.grace -= 1;

  // Charybdis tugs: inside her pull you are dragged a column further in, so
  // holding a line near the edge costs you steering, not just nerve.
  if (s.x >= PULL_FROM) {
    s.drag += (s.x - PULL_FROM) + 1;
    if (rng() < 0.5) s.x = Math.min(NARROWS_W - 1, s.x + 1);
  } else {
    s.drag = Math.max(0, s.drag - DRAG_SHED);
  }
  if (s.drag >= DRAG_LIMIT) {
    s.over = true; s.outcome = 'swallowed';
    return 'swallowed';
  }

  // A head on the ship's row reaching at least as far as the ship has it.
  const reach = s.rows[SHIP_ROW];
  if (reach >= s.x && s.grace <= 0) {
    s.bites += 1;
    s.grace = 3;                  // she has to let go before she can take again
    if (s.rowsLeft <= 0) { s.over = true; s.outcome = 'through'; }
    return 'bite';
  }

  if (s.rowsLeft <= 0) {
    s.over = true; s.outcome = 'through';
    return 'through';
  }
  return null;
}

// How far through the passage you are, 0..1 — the hub draws this as a bar.
export function narrowsProgress(s) {
  return Math.max(0, Math.min(1, 1 - s.rowsLeft / RUN_ROWS));
}
