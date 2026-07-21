// THE NARROWS — the Scylla/Charybdis passage as a SNES-era arcade run.
//
// Homer's bargain was a choice: hug the cliff and lose a few for certain, or
// steer wide and gamble the ship. As a two-button modal that choice was made
// once and watched. Here it is made continuously, with your hands.
//
// BOTH monsters are in the water. SCYLLA lives on the left wall: ONE creature,
// keeping station on you, who rears and lunges when you come inside her reach —
// each lunge takes one thing off the deck. CHARYBDIS is the right-hand water
// itself: a single enormous whirlpool that surfaces at the head of the channel,
// opens as it comes down on you, and takes the ship whole. So the channel is a
// weave: her side is cheap and provoked, hers is rare, huge and final, and the
// safe water is the seam between them — which the rocks and the chicanes make
// you work for.
//
// Earlier this was a field of independent per-row heads, which read as wallpaper
// rather than as two named monsters. One of each, with states you can see coming,
// is the whole difference between a hazard table and an antagonist.
//
// Pure state, no canvas and no globals, in the shape of game/snake.js — the hub
// owns the clock and the input, this owns the rules. `rng` is injected so a test
// can pin the run.

export const NARROWS_W = 13;      // channel width, in cells
export const VIEW_ROWS = 20;      // rows of channel on screen at once
export const SHIP_ROW = 15;       // where you start, and where the helm sits at rest
// You can work the ship UP and DOWN the channel as well as across it. Rowing
// forward to beat a whirlpool down the channel, or backing off a rearing head
// until it drops, is the manoeuvre the fixed-row version could not express — and
// with monsters that key off where you ARE, moving in two axes is what makes
// avoidance a decision rather than a shuffle.
export const SHIP_ROW_MIN = 8;
export const SHIP_ROW_MAX = 17;

// About a minute of channel at the hub's tick (~0.1s a row). Two minutes turned
// out to be a haul rather than a game; the density still ramps across it, so the
// back half is tight without outstaying itself.
export const RUN_ROWS = 570;
export const WARMUP_ROWS = 30;    // open water first: you come UP to the narrows
export const TOTAL_ROWS = WARMUP_ROWS + RUN_ROWS;

// How far each of them can reach in from her own side. The pair is capped so
// that even at their worst there is clear water between them:
//   SCYLLA_MAX + CHARYBDIS_MAX + SAFE_LANE <= NARROWS_W
// That invariant is what keeps a run winnable, and it is asserted in the tests
// rather than merely intended.
export const SCYLLA_MAX = 4;
export const CHARYBDIS_MAX = 5;
export const SAFE_LANE = 3;

// SCYLLA's cycle. She notices you inside SCYLLA_TRIGGER, rears for a beat you
// can see and act on, strikes, then hangs slack while she swallows. Only the
// STRIKE bites: the rearing neck is a warning and is drawn short enough that it
// visibly does not cross the water yet.
export const SCYLLA_TRIGGER = 5;  // columns from the left that draw her attention
// She is INVISIBLE while she lurks — the cabinet shows her only as she comes up
// to strike, which is why the telegraph is long: seven ticks is most of a second
// of her rising out of the water at you before anything can be taken.
export const SCYLLA_REAR = 7;     // ticks of telegraph before the lunge
export const SCYLLA_STRIKE = 2;   // ticks the neck is actually out
export const SCYLLA_RECOVER = 10;
export const SCYLLA_COOL = 8;     // and a breath after that before she looks again

// CHARYBDIS. One at a time, big: she covers a band of rows rather than a line,
// and her mouth widens as she comes down the channel, so you can see how much
// water she is going to want before she wants it.
export const CHARYBDIS_ROWS = 4;
export const CHARYBDIS_GAP = 26;  // ticks between whirlpools, minimum

// ROCKS. Without them the seam between the two monsters is a permanently safe
// column and the correct play is to park mid-channel and never touch the helm —
// which is not a game, it is a screensaver. Rocks sit IN the seam, so dodging
// one is what pushes you toward one monster or the other.
const ROCK_GAP = 2;
// THE CHICANE. Late in the passage the rocks stop arriving one at a time and
// start walking: a column of them stepping one cell sideways per row, so the gap
// slides across the channel and you have to follow it. Straight out of the
// side-scrollers this cabinet is pretending to be, and it is the only hazard
// here that demands continuous steering rather than one decision.
export const CHICANE_FROM = 0.55; // pressure at which the channel starts doing this
export const CHICANE_LEN = 16;    // rows in one chicane
export const CHICANE_COOL = 40;   // rows of ordinary channel between chicanes
const CHICANE_LO = 2, CHICANE_HI = NARROWS_W - 3;

// The hull is finite. Rocks used to be a tally that only ever went up, so a bad
// run had no floor: you could grind the whole passage off the rocks and still
// arrive. Six strikes and she breaks up — which is what makes a hopeless run end
// rather than merely hurt.
export const HULL_MAX = 6;

// THE BRONZE RAM. Found at a wreck on Aeaea and fitted to the bow, it shoulders
// the first few rocks aside instead of taking them on the hull. Note what it
// deliberately does NOT do: it cannot clear a rock out of the channel, and it is
// no use whatever against either monster. A weapon that removed rocks would undo
// the only job rocks have — making the seam between the two of them cost
// something — and the correct play would go back to parking mid-channel. This
// changes what a mistake COSTS, not whether the hazard is there.
export const RAM_MAX = 3;

// Named, because "the left one" and "the right one" is not how you talk about
// monsters. The cabinet labels them on the water.
export const MONSTERS = {
  scylla: { name: 'SCYLLA', side: 'left', cost: 'takes one thing' },
  charybdis: { name: 'CHARYBDIS', side: 'right', cost: 'takes the ship' },
};

// `opts.ram` fits the bronze ram to the bow for this run: see RAM_MAX.
export function newNarrowsRun(opts = {}) {
  return {
    x: 6,                          // the ship's column, mid-channel
    y: SHIP_ROW,                   // and its row: the helm works fore-and-aft too
    // Rows carry the rocks and nothing else now — both monsters are single
    // creatures with their own state, not a property of every row.
    rows: Array.from({ length: VIEW_ROWS }, () => ({ rock: -1 })),
    scylla: { row: SHIP_ROW, reach: 0, vis: 0, state: 'lurk', timer: 0, cool: 0 },
    charybdis: null,               // { row, reach } while one is in the channel
    rowsLeft: TOTAL_ROWS,
    warmup: WARMUP_ROWS,
    bites: 0,                      // Scylla's tally: one thing off the deck each
    rocks: 0,                      // rocks struck: hull damage, not cargo
    hull: HULL_MAX,                // strikes left before she comes apart
    ram: opts.ram ? RAM_MAX : 0,   // rocks the bronze beak will shoulder aside
    ramFitted: !!opts.ram,         // kept once spent, so the HUD can show it empty
    grace: 0,                      // brief invulnerability after a bite
    sinceR: 0,
    sinceK: ROCK_GAP,
    chicane: null,                 // { col, dir, left } while one is running
    chicaneCool: 0,
    over: false,
    outcome: null,                 // 'through' | 'swallowed' | 'wrecked'
    attract: true,                 // the cabinet opens on its title card
    t: 0,                          // frames, for blinks and the churn
    // Presentation only — the RULES stay on whole rows and whole columns, so
    // none of this can change what hits what. `frac` is how far through the
    // current row we are (0..1); `xDraw`/`yDraw` are the hull easing toward the
    // cell the helm has actually selected. Without them the channel jumps a
    // whole cell ten times a second, which looks like a slideshow.
    frac: 0,
    xDraw: 6,
    yDraw: SHIP_ROW,
  };
}

// How hard the channel is right now, 0..1. It thickens as you go, so a long run
// escalates instead of flatlining.
export function narrowsPressure(s) {
  const danger = Math.max(0, s.rowsLeft - WARMUP_ROWS);
  return Math.max(0, Math.min(1, 1 - danger / RUN_ROWS));
}

// One new row at the head of the channel: rocks only, either walking as part of
// a chicane or dropped singly in the open water.
function nextRow(s, rng) {
  const p = narrowsPressure(s);

  if (!s.chicane) {
    if (s.chicaneCool > 0) s.chicaneCool -= 1;
    else if (p >= CHICANE_FROM && rng() < 0.05) {
      const dir = rng() < 0.5 ? 1 : -1;
      s.chicane = { col: dir > 0 ? CHICANE_LO : CHICANE_HI, dir, left: CHICANE_LEN };
    }
  }
  if (s.chicane) {
    const rock = s.chicane.col;
    s.chicane.col += s.chicane.dir;
    if (s.chicane.col <= CHICANE_LO || s.chicane.col >= CHICANE_HI) s.chicane.dir *= -1;
    s.chicane.left -= 1;
    if (s.chicane.left <= 0) { s.chicane = null; s.chicaneCool = CHICANE_COOL; }
    s.sinceK = 0;
    return { rock };
  }

  let rock = -1;
  s.sinceK += 1;
  if (s.sinceK >= ROCK_GAP && rng() < 0.26 + 0.30 * p) {
    rock = 1 + Math.floor(rng() * (NARROWS_W - 2));
    s.sinceK = 0;
  }
  return { rock };
}

// SCYLLA, one tick. She keeps station on your row while she lurks, so the head
// you can see on the wall is always the one that will come for you.
function stepScylla(s) {
  const k = s.scylla;
  if (k.state === 'lurk') {
    k.reach = 0;
    k.vis = 0;                     // gone: the water on the port hand is empty
    if (k.row < s.y) k.row += 1; else if (k.row > s.y) k.row -= 1;
    if (k.cool > 0) { k.cool -= 1; return; }
    if (s.x < SCYLLA_TRIGGER && Math.abs(k.row - s.y) <= 1) {
      k.state = 'rear'; k.timer = SCYLLA_REAR;
    }
    return;
  }
  k.timer -= 1;
  // `vis` is how much of her is out of the water, 0..1. It is kept SEPARATE from
  // reach because the two do different jobs: reach is how far she can take, and
  // the rear deliberately reaches almost nowhere. Derive one from the other and
  // the whole telegraph plays out nearly transparent — which is how she came to
  // be missable in the first place.
  if (k.state === 'rear') {
    // The warning. Deliberately short of the water she can actually take: she is
    // up out of the sea and looking at you, and has not committed yet.
    const up = 1 - Math.max(0, k.timer) / SCYLLA_REAR;
    k.reach = 1.5 * up;
    k.vis = Math.min(1, 0.45 + up * 1.4);      // out of the water fast, then solid
    if (k.timer <= 0) { k.state = 'strike'; k.timer = SCYLLA_STRIKE; k.reach = SCYLLA_MAX; k.vis = 1; }
  } else if (k.state === 'strike') {
    k.reach = SCYLLA_MAX;
    k.vis = 1;
    if (k.timer <= 0) { k.state = 'recover'; k.timer = SCYLLA_RECOVER; }
  } else {
    const left = Math.max(0, k.timer) / SCYLLA_RECOVER;
    k.reach = SCYLLA_MAX * left * 0.5;
    k.vis = left;                              // and sinks back out of sight
    if (k.timer <= 0) { k.state = 'lurk'; k.reach = 0; k.vis = 0; k.cool = SCYLLA_COOL; }
  }
}

// CHARYBDIS, one tick. She comes down the channel with the current, so she is
// visible for a dozen rows before she is a problem, and she is only wide in the
// middle of that — which is the window you have to be out of her water.
function stepCharybdis(s, rng) {
  const c = s.charybdis;
  if (c) {
    c.row += 1;
    const life = (c.row + CHARYBDIS_ROWS) / (VIEW_ROWS + CHARYBDIS_ROWS * 2);
    c.reach = Math.round(CHARYBDIS_MAX * Math.sin(Math.max(0, Math.min(1, life)) * Math.PI));
    if (c.row > VIEW_ROWS) { s.charybdis = null; s.sinceR = 0; }
    return;
  }
  s.sinceR += 1;
  if (s.sinceR >= CHARYBDIS_GAP && rng() < 0.06 + 0.14 * narrowsPressure(s)) {
    s.charybdis = { row: -CHARYBDIS_ROWS, reach: 0 };
  }
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

// Row forward or back. Negative is up the channel, into what is coming.
export function narrowsRow(s, dy) {
  if (s.over || s.attract) return;
  s.y = Math.max(SHIP_ROW_MIN, Math.min(SHIP_ROW_MAX, s.y + (dy < 0 ? -1 : 1)));
}

// Is a row covered by Charybdis's mouth right now, and how far in does it come?
export function charybdisReachAt(s, row) {
  const c = s.charybdis;
  if (!c || c.reach <= 0) return 0;
  return (row >= c.row && row < c.row + CHARYBDIS_ROWS) ? c.reach : 0;
}

// Advance one row. Returns 'bite' (Scylla took one), 'rock' (a strike on the
// hull), 'wrecked' (the hull is gone), 'swallowed' (Charybdis has the ship),
// 'through' (clear), or null.
export function narrowsTick(s, rng = Math.random) {
  if (s.over || s.attract) return null;   // no coin, no game

  const calm = s.warmup > 0;
  s.rows.pop();
  s.rows.unshift(calm ? { rock: -1 } : nextRow(s, rng));
  s.rowsLeft -= 1;
  if (s.warmup > 0) s.warmup -= 1;
  if (s.grace > 0) s.grace -= 1;
  if (!calm) { stepScylla(s); stepCharybdis(s, rng); }

  // CHARYBDIS first, and deliberately NOT behind the grace period: no amount of
  // recent luck saves you from the one that ends the voyage.
  if (s.x >= NARROWS_W - charybdisReachAt(s, s.y)) {
    s.over = true; s.outcome = 'swallowed';
    return 'swallowed';
  }
  // A rock: it costs you, but it is neither of them — it is the thing that makes
  // you move, and moving is what puts you in their reach.
  const row = s.rows[s.y];
  if (row && row.rock >= 0 && s.x === row.rock && s.grace <= 0) {
    s.rocks += 1;
    s.grace = 3;
    // The ram takes it. The rock is still there and still had to be dodged; you
    // simply do not pay for having failed to.
    if (s.ram > 0) {
      s.ram -= 1;
      if (s.rowsLeft <= 0) { s.over = true; s.outcome = 'through'; }
      return 'shatter';
    }
    s.hull -= 1;
    if (s.hull <= 0) {             // she comes apart under you
      s.over = true; s.outcome = 'wrecked';
      return 'wrecked';
    }
    if (s.rowsLeft <= 0) { s.over = true; s.outcome = 'through'; }
    return 'rock';
  }
  // SCYLLA, mid-lunge, on your row and with you inside her reach.
  const k = s.scylla;
  if (k.state === 'strike' && k.row === s.y && s.x < k.reach && s.grace <= 0) {
    s.bites += 1;
    // The grace period, not a state change, is what stops her taking twice: send
    // her straight to `recover` here and the lunge pose is over before it is
    // drawn, so the one frame that explains what just happened never appears.
    s.grace = 4;
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
  if (s.yDraw == null) s.yDraw = s.y;
  s.yDraw += (s.y - s.yDraw) * Math.min(1, dt * 10);   // slower fore-and-aft
  if (Math.abs(s.y - s.yDraw) < 0.01) s.yDraw = s.y;

  // The monsters need their own eased values, and for the same reason the ship
  // does: their rules move them a WHOLE cell at a time, ten times a second.
  // Scylla in particular does NOT scroll with the water — she keeps station on
  // you — so she cannot borrow the channel's sub-row offset the way the rocks
  // and the whirlpool do, and without this she jumped a cell per tick.
  const sc = s.scylla;
  if (sc) {
    if (sc.rowDraw == null) sc.rowDraw = sc.row;
    if (sc.reachDraw == null) sc.reachDraw = sc.reach;
    if (sc.visDraw == null) sc.visDraw = sc.vis || 0;
    sc.rowDraw += (sc.row - sc.rowDraw) * Math.min(1, dt * 9);
    // fast, so a lunge still lands like a lunge, but not a teleport
    sc.reachDraw += (sc.reach - sc.reachDraw) * Math.min(1, dt * 20);
    sc.visDraw += ((sc.vis || 0) - sc.visDraw) * Math.min(1, dt * 14);
  }
  const ch = s.charybdis;
  if (ch) {
    if (ch.reachDraw == null) ch.reachDraw = 0;
    ch.reachDraw += (ch.reach - ch.reachDraw) * Math.min(1, dt * 7);
  }
}

// Still on open water? The cabinet says so, so the calm reads as deliberate.
export function narrowsCalm(s) {
  return s.warmup > 0;
}
