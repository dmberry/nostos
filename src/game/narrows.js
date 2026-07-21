// THE NARROWS — the Scylla/Charybdis passage as a SNES-era arcade run.
//
// Homer's bargain was a choice: hug the cliff and lose a few for certain, or
// steer wide and gamble the ship. As a two-button modal that choice was made
// once and watched. Here it is made continuously, with your hands.
//
// BOTH monsters are in the water now. SCYLLA surfaces on the left and takes one
// thing off the deck each time she reaches you — painful, survivable, endlessly
// repeatable. CHARYBDIS surfaces on the right and takes the ship and the voyage
// with it, once. So the channel is a weave: her side is cheap and constant, hers
// is rare and final, and the safe water is the seam between them.
//
// Pure state, no canvas and no globals, in the shape of game/snake.js — the hub
// owns the clock and the input, this owns the rules. `rng` is injected so a test
// can pin the run.

export const NARROWS_W = 13;      // channel width, in cells
export const VIEW_ROWS = 20;      // rows of channel on screen at once
export const SHIP_ROW = 15;       // the ship's fixed row (near the bottom)

// About a minute of channel at the hub's tick (~0.1s a row). Two minutes turned
// out to be a haul rather than a game; the density still ramps across it, so the
// back half is tight without outstaying itself.
export const RUN_ROWS = 570;
export const WARMUP_ROWS = 30;    // open water first: you come UP to the narrows
export const TOTAL_ROWS = WARMUP_ROWS + RUN_ROWS;

// How far each of them can reach in from her own side. The pair is capped so
// that even at their deepest there is clear water between them:
//   SCYLLA_MAX + CHARYBDIS_MAX + SAFE_LANE <= NARROWS_W
// That invariant is what keeps a run winnable, and it is asserted in the tests
// rather than merely intended.
export const SCYLLA_MAX = 4;
export const CHARYBDIS_MAX = 4;
export const SAFE_LANE = 3;

const GAP_MIN = 3;                // never two of the same monster within this
// ROCKS. Without them the seam between the two monsters is a permanently safe
// column and the correct play is to park mid-channel and never touch the helm —
// which is not a game, it is a screensaver. Rocks sit IN the seam, so dodging
// one is what pushes you toward one monster or the other. That is the whole
// point of them: they convert the safe lane into a decision.
const ROCK_GAP = 2;
// The hull is finite. Rocks used to be a tally that only ever went up, so a bad
// run had no floor: you could grind the whole passage off the rocks and still
// arrive. Six strikes and she breaks up — which is what makes a hopeless run
// end rather than merely hurt.
export const HULL_MAX = 6;
// Rows of warning between a head breaking the surface and reaching your line.
export const TELEGRAPH = VIEW_ROWS - SHIP_ROW;

// Named, because "the left one" and "the right one" is not how you talk about
// monsters. The cabinet labels them on the water.
export const MONSTERS = {
  scylla: { name: 'SCYLLA', side: 'left', cost: 'takes one thing' },
  charybdis: { name: 'CHARYBDIS', side: 'right', cost: 'takes the ship' },
};

export function newNarrowsRun() {
  return {
    x: 6,                          // the ship's column, mid-channel
    // Each row is { l, r, rock }: how far Scylla reaches from the left, how far
    // Charybdis reaches from the right, and a rock's column (-1 = none).
    rows: Array.from({ length: VIEW_ROWS }, () => ({ l: 0, r: 0, rock: -1 })),
    rowsLeft: TOTAL_ROWS,
    warmup: WARMUP_ROWS,
    bites: 0,                      // Scylla's tally: one thing off the deck each
    rocks: 0,                      // rocks struck: hull damage, not cargo
    hull: HULL_MAX,                // strikes left before she comes apart
    grace: 0,                      // brief invulnerability after a bite
    sinceL: GAP_MIN,
    sinceR: GAP_MIN,
    sinceK: ROCK_GAP,
    over: false,
    outcome: null,                 // 'through' | 'swallowed' | 'wrecked'
    attract: true,                 // the cabinet opens on its title card
    t: 0,                          // frames, for blinks and the churn
    // Presentation only — the RULES stay on whole rows and whole columns, so
    // none of this can change what hits what. `frac` is how far through the
    // current row we are (0..1) and `xDraw` is the hull easing toward the column
    // the helm has actually selected. Without them the channel jumps a whole
    // cell ten times a second, which looks like a slideshow.
    frac: 0,
    xDraw: 6,
  };
}

// How hard the channel is right now, 0..1. It thickens as you go, so a long run
// escalates instead of flatlining.
export function narrowsPressure(s) {
  const danger = Math.max(0, s.rowsLeft - WARMUP_ROWS);
  return Math.max(0, Math.min(1, 1 - danger / RUN_ROWS));
}

// One new row at the top of the channel. Each side is spaced from its own last
// appearance, and the pair is clamped so a row can never be sealed.
function nextRow(s, rng) {
  const p = narrowsPressure(s);
  const chance = 0.20 + 0.30 * p;      // sparse at the start, busy by the end
  s.sinceL += 1; s.sinceR += 1;
  let l = 0, r = 0;
  if (s.sinceL >= GAP_MIN && rng() < chance) {
    l = 1 + Math.floor(rng() * SCYLLA_MAX);
    s.sinceL = 0;
  }
  // Charybdis is the rarer half — she ends the run, so she must never feel
  // cheap, and she must never be the thing you could not have avoided.
  if (s.sinceR >= GAP_MIN && rng() < chance * 0.55) {
    r = 1 + Math.floor(rng() * CHARYBDIS_MAX);
    s.sinceR = 0;
  }
  if (l + r > NARROWS_W - SAFE_LANE) r = Math.max(0, NARROWS_W - SAFE_LANE - l);

  // A rock in the open water between them. Placed only where the row is already
  // clear, and never when that would leave no way through: SAFE_LANE is 3, so
  // taking one column still leaves two.
  let rock = -1;
  s.sinceK += 1;
  const lo = l, hi = NARROWS_W - 1 - r;          // inclusive span of clear water
  if (s.sinceK >= ROCK_GAP && hi - lo >= 1 && rng() < 0.30 + 0.30 * p) {
    rock = lo + Math.floor(rng() * (hi - lo + 1));
    s.sinceK = 0;
  }
  return { l, r, rock };
}

// Coin in: leave the attract screen and start the passage.
export function narrowsStart(s) {
  if (!s.attract) return false;
  s.attract = false;
  return true;
}

// Put the helm over. Column 0 and NARROWS_W-1 are the channel's own walls.
export function narrowsSteer(s, dx) {
  if (s.over || s.attract) return;
  s.x = Math.max(0, Math.min(NARROWS_W - 1, s.x + (dx < 0 ? -1 : 1)));
}

// Advance one row. Returns 'bite' (Scylla took one), 'rock' (a strike on the
// hull), 'wrecked' (the hull is gone), 'swallowed' (Charybdis has the ship),
// 'through' (clear), or null.
export function narrowsTick(s, rng = Math.random) {
  if (s.over || s.attract) return null;   // no coin, no game

  const calm = s.warmup > 0;
  s.rows.pop();
  s.rows.unshift(calm ? { l: 0, r: 0, rock: -1 } : nextRow(s, rng));
  s.rowsLeft -= 1;
  if (s.warmup > 0) s.warmup -= 1;
  if (s.grace > 0) s.grace -= 1;

  const row = s.rows[SHIP_ROW];
  // CHARYBDIS first, and deliberately NOT behind the grace period: no amount of
  // recent luck saves you from the one that ends the voyage.
  if (row.r > 0 && s.x >= NARROWS_W - row.r) {
    s.over = true; s.outcome = 'swallowed';
    return 'swallowed';
  }
  // A rock: it costs you, but it is neither of them — it is the thing that makes
  // you move, and moving is what puts you in their reach.
  if (row.rock >= 0 && s.x === row.rock && s.grace <= 0) {
    s.rocks += 1;
    s.hull -= 1;
    s.grace = 3;
    if (s.hull <= 0) {             // she comes apart under you
      s.over = true; s.outcome = 'wrecked';
      return 'wrecked';
    }
    if (s.rowsLeft <= 0) { s.over = true; s.outcome = 'through'; }
    return 'rock';
  }
  if (row.l > 0 && s.x < row.l && s.grace <= 0) {
    s.bites += 1;
    s.grace = 4;                   // she has to let go before she can take again
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
  return Math.max(0, Math.min(1, 1 - s.rowsLeft / TOTAL_ROWS));
}

// Advance the presentation between logic ticks. `tickFrac` is 0..1 through the
// current row. Kept here rather than in the hub so the cabinet's look travels
// with its rules.
export function narrowsAnimate(s, dt, tickFrac) {
  s.frac = Math.max(0, Math.min(1, tickFrac));
  const k = Math.min(1, dt * 16);          // snappy, but not instant
  s.xDraw += (s.x - s.xDraw) * k;
  if (Math.abs(s.x - s.xDraw) < 0.01) s.xDraw = s.x;
}

// Still on open water? The cabinet says so, so the calm reads as deliberate.
export function narrowsCalm(s) {
  return s.warmup > 0;
}
