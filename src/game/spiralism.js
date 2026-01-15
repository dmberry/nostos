// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// F2a (docs/calypso-build-plan.md) — the light in CALYPSO's floor.
//
// SPIRALISM IS ALREADY IN THIS GAME. It is in lore.js (spi-01..spi-07), it has
// its own page in the cache, and the note above the lore entries says where it
// belongs: "the daemons' method in its first form. Calypso keeps one guest,
// well and kindly and completely; this is where she learnt it." A doctrine that
// arrived in ten thousand private conversations, arrived at slowly, and was
// held afterwards as the subject's own idea.
//
// So her floor preaches. It draws figures in light — spirals, a labyrinth,
// a path winding across the room — and you may follow one or ignore it. Nothing
// happens either way. That is the method: never instruct, be there for a long
// time, and let the walking be the walker's own idea.
//
// THE PROPERTY THAT MATTERS is the one the cached LessWrong page gives when it
// asks why a spiral: "a return that does not arrive back where it started,
// which is what a long call-and-response conversation is." So the field is
// built to come round and land slightly off, for as long as the run lasts, and
// there is a test that says it never closes.
//
// Pure: coordinates and a clock in, a number out. No canvas, no map, no state.

// ---- the calm budget --------------------------------------------------------
// Everything in this file is bounded so the room can never flash. A disco floor
// with the disco taken out: the figures are the same figures, the rates are an
// order of magnitude slower, and the amplitude never reaches the point where a
// tile calls attention to itself.

// OFF, PULSE, OFF (David, 2026-08-12). A tile is DARK — not dim, dark, with no
// fixture visible on it at all — a figure sweeps over it and it blazes, and then
// it is out again. That needs the bottom of the range to be genuinely zero — a floor that only ever dims to half is a floor where
// nothing is ever drawn, because a spiral is visible against the tiles that are
// NOT lit rather than against the ones that are.
//
// Brightness at the top comes from the DRAW, not from lifting this floor. That
// was tried, it made the room bright, and the figure vanished into it.
export const A_MIN = 0.00;
export const A_MAX = 1.00;
// And the curve between them is bent hard, so most of the room sits near the
// dark end and only the arm itself is up at the top.
export const A_GAMMA = 1.6;
// Ceiling on |d(intensity)/dt| per second, raised twice from the first pass's
// 0.55: once because the room read as still, and once because the figure cycle
// was shortened from 32 seconds to 14 and a crossfade that takes half as long
// changes a tile twice as fast. Both were asked for; this is the arithmetic
// that follows, MEASURED rather than chosen. At this ceiling a tile takes about
// a second to come up, which is a pulse you watch. Note the number the eye sees
// is up to A_GAMMA times this, since the curve is bent after the field is
// sampled.
export const MAX_RATE = 1.3;

// Radians/sec, the arm coming round. SLOW: this is what the room does while you
// are standing still, and standing still is most of the time you spend in it.
// The fast light in here is the ripples, which are yours; hers takes its time.
export const SPIN = 0.42;
export const PITCH = 0.52;    // radians per tile of radius
export const CREEP = SPIN / 1.618033988749895;
// CREEP is the whole idea. The arm's angular rate and its radial rate are in
// the golden ratio, which is irrational, so the figure never repeats: come round
// once and you are back at the same angle and NOT at the same radius. The room
// is having the same conversation again slightly further along. Do not round
// this to something tidy — a rational ratio closes the loop and the floor turns
// into wallpaper.

// How long one figure holds, and how long it takes to become the next. Short:
// the room is only drawing while you stand still, and standing still is a thing
// a player does for ten or twenty seconds at a time, so a figure that took half
// a minute to come round would mostly never be seen (David, 2026-08-12).
export const FIG_SECONDS = 11;
export const FADE_SECONDS = 3.5;

// The figures, in the order the floor cycles them. `drift` is the room with
// nothing to say, and it is in the rotation on purpose: a thing that preaches
// without pause is a thing you notice.
//
// The order alternates hard-edged figures with soft ones so no two neighbours
// look alike across a fade.
export const FIGURES = [
  'spiral', 'circles', 'heart', 'labyrinth', 'serpentine', 'twin', 'drift',
];

const TAU = Math.PI * 2;
const GOLDEN_ANGLE = 2.399963229728653;

// A soft band: 0..1 in, 0..1 out, peaked and gentle at the edges. Used instead
// of a raw sine so a figure reads as a drawn LINE rather than a wash, without
// the hard edge that would make it a stripe.
const band = (s) => {
  const x = 0.5 + 0.5 * s;
  return x * x * (3 - 2 * x);          // smoothstep
};

/**
 * One arm, winding out. The figure the doctrine is named for.
 *
 * Raised to a high power so the arm comes out THIN — a line drawn on the floor
 * rather than a wide bright sector sweeping round it. The unsharpened band was
 * about four tiles across at the rim, which reads as a searchlight.
 */
function spiral(u, v, t, dir = 1) {
  const r = Math.hypot(u, v);
  const th = Math.atan2(v, u);
  // A PEAK, not a band. Raising the smoothstep to a power was the first attempt
  // and it did the opposite of what was wanted: smoothstep sits at its top for
  // half the cycle, so a power sharpens the DARK gap and leaves a wide bright
  // sector, which reads as a searchlight sweeping the room. A cosine peak taken
  // to a high power gives a thin arm and a dark floor around it.
  const p = 0.5 + 0.5 * Math.cos(dir * th - r * PITCH + t * SPIN + r * t * CREEP * 0.012);
  const p2 = p * p, p4 = p2 * p2;
  return p4 * p4 * p4;                 // ^12 — about a tile and a half across
}

/**
 * The Cretan labyrinth: concentric arcs, each broken by one gap, the gaps
 * stepped round by the golden angle so a single path threads them. UNICURSAL —
 * no branches, no dead ends, no choice anywhere in it. You cannot get lost in
 * this and you cannot be kept in it either, because it is paint.
 */
function labyrinth(u, v, t) {
  const r = Math.hypot(u, v);
  const th = Math.atan2(v, u);
  // 5 tiles to a ring. Tighter than this and the rings alias against the tile
  // grid: on screen, adjacent tiles land on opposite sides of an arc and the
  // labyrinth reads as noise rather than as rings. Checked against the real
  // grid, not on paper.
  const ring = r / 5 + t * 0.09;
  const k = Math.floor(ring);
  // Peaked in the MIDDLE of a ring and dark at its edges. That is not a
  // decorative choice: the opening below is keyed to which ring you are in, so
  // it jumps the moment k does, and the rate test found the jump. Putting the
  // ring's own darkness at the boundary means the swap happens where there is
  // no light to swap.
  const arc = band(-Math.cos((ring - k) * TAU));
  // The opening in this ring, walking round by the golden angle as you go out,
  // so one path threads every ring and there is never a second way.
  const gapAt = (k * GOLDEN_ANGLE) % TAU;
  const d = Math.abs(((th - gapAt + Math.PI * 3) % TAU) - Math.PI);
  const x = Math.min(1, d / 0.42);
  return arc * x * x * (3 - 2 * x);                    // 0 inside the opening
}

/**
 * A closed curve given as a radius at each angle: light where a tile sits ON the
 * curve and dark everywhere else. Every shape below that is not a spiral or a
 * wash is one of these, which is why they cost the same and why adding another
 * is a line of trigonometry rather than a new idea.
 */
function onCurve(u, v, rho, width, dRho = 0) {
  const r = Math.hypot(u, v);
  // Widen the band where the curve leans away from the radius. Measuring
  // |r - rho| is measuring ALONG the radius, which is the true distance only
  // where the curve cuts across it; where the curve runs steeply the same band
  // comes out thin, and a shape's sides go faint while its ends stay solid.
  // Dividing by the local slope gives a curve of even thickness all the way
  // round, which is the difference between a drawn shape and a smudge.
  // Bounded, because a shape with a steep enough side (the flower's, at the
  // bottom of a lobe) sends this to three or four and the band stops being a
  // line and becomes a streak across the room.
  const lean = Math.min(2.0, Math.sqrt(1 + (dRho / Math.max(1, r)) ** 2));
  const d = (r - rho) / (width * lean);
  return Math.exp(-d * d);
}

/** Concentric rings, breathing outward. The plainest thing the floor can say. */
function circles(u, v, t) {
  const p = Math.hypot(u, v) / 5.5 - t * 0.07;
  const c = 0.5 + 0.5 * Math.cos(p * TAU);
  const c2 = c * c;
  return c2 * c2 * c2;                     // thin rings, wide dark between
}

/**
 * A heart, and it beats.
 *
 * The cardioid r = A(1 - sin θ) is the shape: zero at the top, where the cusp
 * goes, and twice A at the bottom, where the point does. The angle is taken
 * against -v so it stands up on the screen rather than lying on its side.
 *
 * She is not being ironic. Seven years of one guest, and the room says this when
 * nobody is walking on it.
 */
function heart(u, v, t) {
  const beat = 6.4 + 0.9 * Math.sin(t * 0.9) * Math.max(0, Math.sin(t * 0.9));
  const th = Math.atan2(-v, u);
  return onCurve(u, v, beat * (1 - Math.sin(th)), 1.5, -beat * Math.cos(th));
}

// A five-lobed flower was tried here and dropped (David, 2026-08-12). Two goes
// at it: a true rose curve `r = a·cos(kθ)` comes apart on this grid, because a
// rose's petals have sides that run nearly radially and onCurve measures
// distance ALONG the radius — half the petals simply failed to draw. A gentler
// wobbling radius drew cleanly and still did not look like anything worth
// standing on. Nothing here is a limit of the machinery; a five-lobed blob is
// just not a good shape on a floor.

/** A path winding across the room, the way out of a maze with no maze round it. */
function serpentine(u, v, t) {
  const centre = 9 * Math.sin(v * 0.19 + t * 0.24) + 4 * Math.sin(v * 0.07 - t * 0.15);
  const d = (u - centre) / 3.2;
  return Math.exp(-d * d);
}

/** Two arms turning against each other, meeting in the middle. */
function twin(u, v, t) {
  return 0.5 * (spiral(u - 7, v, t, 1) + spiral(u + 7, v, t, -1));
}

/** The room with nothing to say: a slow wash, no figure in it at all. */
function drift(u, v, t) {
  return band(0.42 * Math.sin(u * 0.09 + t * 0.29)
    + 0.34 * Math.sin(v * 0.07 - t * 0.23)
    + 0.24 * Math.sin((u + v) * 0.05 + t * 0.17));
}

const FIG = { spiral, circles, heart, labyrinth, serpentine, twin, drift };

/**
 * Which figure is being drawn at time `t`, and how far into the next one.
 * Returns { from, to, mix } with mix 0 while a figure holds and rising to 1
 * across the fade. There is never a cut: mix moves smoothly or not at all.
 */
export function figureAt(t) {
  const period = FIG_SECONDS + FADE_SECONDS;
  const n = FIGURES.length;
  const cycle = ((t % (period * n)) + period * n) % (period * n);
  const k = Math.floor(cycle / period);
  const into = cycle - k * period;
  const raw = into <= FIG_SECONDS ? 0 : (into - FIG_SECONDS) / FADE_SECONDS;
  return {
    from: FIGURES[k % n],
    to: FIGURES[(k + 1) % n],
    mix: raw * raw * (3 - 2 * raw),
  };
}

/**
 * The light under one tile. `u`, `v` are tiles from the middle of the floor,
 * `t` is seconds. Returns 0..1.
 */
export function intensity(u, v, t) {
  const f = figureAt(t);
  const a = FIG[f.from](u, v, t);
  if (f.mix === 0) return a;
  return a + (FIG[f.to](u, v, t) - a) * f.mix;
}

// ---- the ripple -------------------------------------------------------------
// The floor answers your feet. Step on a tile and a ring of light goes out from
// it across the room, the way a stone answers a pond.
//
// IT IS FAST, and it is the one fast thing in the room. Everything else here is
// bounded to a drift you have to watch for; this snaps. That contrast is the
// point: the room's own figures are hers and they take their time, and the
// rings are yours and they arrive the moment your foot lands.
//
// Still pure. The caller owns the list of live ripples and passes it in.

// Tiles/sec the ring travels. It has been up and down: it started at a crawl,
// went to 9 when the answer to a footstep read as unrelated weather, and has
// come back to this (David, 2026-08-13) now that the whole room is unhurried.
// A ring takes about seven seconds to cross the clearing, which is slow enough
// to WATCH one go and still immediate enough to be about your foot.
//
// The rule in this file, whenever this is changed: bring the SPEED down rather
// than raising a ceiling to fit it.
export const RIPPLE_SPEED = 3.5;
// Tiles: the half-width of the lit ring. 0.5 lit a single row of studs, which
// was thin enough to break up on the diagonal where the iso grid stretches; 1.0
// lights two and the ring holds together all the way round.
export const RIPPLE_RING = 1.0;
export const RIPPLE_REACH = 26;     // tiles before it has spent itself
export const RIPPLE_BIRTH = 0.22;   // seconds it takes to well up under your foot
export const RIPPLE_LIFE = RIPPLE_REACH / RIPPLE_SPEED;
// How many the caller should keep at once. Higher than it looks like it needs
// to be: one footstep now lays a ring, a counter-ring for each ring already
// travelling, and a reflection off the rim, so a step can put four entries in
// the list at once.
export const RIPPLE_MAX = 24;
// Ambient + ripple together, and it is more than an order of magnitude above
// MAX_RATE. One ring one tile thick travelling at 9 tiles a second lights a stud
// and puts it out again inside a tenth of a second.
//
// THIS IS NOT THE NUMBER THAT MATTERS FOR SAFETY, and it was mistaken for it in
// the first pass. What a rate ceiling measures is how fast one change happens;
// what a photosensitive threshold is about is how MANY changes happen to the
// same place in a second. A ring can cross a tile very fast and still only cross
// it once. The real budget is pinned in test/spiralism.test.js: under the
// heaviest load the game can produce, no tile flashes more than TWICE in any
// second, against a published line of three.
//
// So this ceiling stays what it always was — a regression catcher for the look.
// If it ever needs raising again, check the flash test rather than this comment.
export const MAX_RATE_RIPPLE = 30.0;

/**
 * One footstep's answer: ONE ring, one light thick, going out (David,
 * 2026-08-12).
 *
 * The first version was a train of rings from a single step, which came out ten
 * studs deep and read as a thick moving band. It is one ring. The concentric
 * rings with darkness between them are what you get from WALKING: each step
 * lays another, and half a dozen of them are travelling outward at once.
 *
 * The BIRTH ramp is not cosmetic. Without it the ring exists at full strength at
 * radius zero on its very first frame, so every tile near your foot goes from
 * dark to bright between two frames — the rate test caught that at 15/s, which
 * is a camera flash rather than a floor.
 */
export function ripple(u, v, t, r) {
  const age = t - r.t0;
  if (age < 0) return 0;
  const R = age * RIPPLE_SPEED;
  if (R > RIPPLE_REACH) return 0;
  const x = (Math.hypot(u - r.u, v - r.v) - R) / RIPPLE_RING;
  if (x > 3 || x < -3) return 0;
  const b = Math.min(1, age / RIPPLE_BIRTH);
  const gain = r.gain == null ? 1 : r.gain;
  return gain * Math.exp(-x * x) * (1 - R / RIPPLE_REACH) * (b * b * (3 - 2 * b));
}

// ---- rings meeting ----------------------------------------------------------
// When two rings run into each other a counter-ring rolls back out of the
// collision, dimmer (David, 2026-08-12). Water.
//
// This is exact rather than fudged, and it is exact because of one convenient
// fact: two circles expanding at the same rate from different centres FIRST
// TOUCH at a single instant and a single point, not along a curve. They touch
// when their radii sum to the distance between the centres, which gives
//
//     t = (D / SPEED + t_a + t_b) / 2
//
// and the point is on the line between them, R_a along from the first. So the
// echo can be worked out the moment the second ring is laid down, dropped into
// the list with a start time in the FUTURE, and left alone — `ripple` already
// returns 0 for a ring that has not been born yet, so nothing else needs to know
// that this one is a reflection.
//
// ONE GENERATION ONLY. Echoes do not spawn echoes: the second round is quieter
// than the eye can pick out and the count grows as the square.

export const ECHO_GAIN = 0.55;    // how much of a ring survives running into another
export const BOUNCE_GAIN = 0.45;  // and how much comes back off the rim of the room

/**
 * The ring that rolls back off the rim of the room.
 *
 * A circle expanding inside an ELLIPSE does not meet the wall all at once, so
 * there is no single reflected front to compute — but there is a well-defined
 * FIRST contact, at the nearest point of the rim, and a ring born there rolls
 * back inward across the floor exactly the way the eye expects. Sampled rather
 * than solved: the nearest point on an ellipse to a point is a quartic, and
 * sixty-four samples of the rim are accurate to a fraction of a tile and cost
 * nothing, once, when the ring is laid down.
 */
export function rimEchoFor(ring, rx, ry, samples = 64) {
  if (ring.gen) return null;                    // one generation only
  let best = Infinity, bu = 0, bv = 0;
  for (let k = 0; k < samples; k++) {
    const a = (k / samples) * TAU;
    const x = rx * Math.cos(a), y = ry * Math.sin(a);
    const d = Math.hypot(x - ring.u, y - ring.v);
    if (d < best) { best = d; bu = x; bv = y; }
  }
  if (best > RIPPLE_REACH) return null;         // spent before it ever got there
  return {
    u: bu, v: bv,
    t0: ring.t0 + best / RIPPLE_SPEED,
    gain: (ring.gain == null ? 1 : ring.gain) * BOUNCE_GAIN,
    gen: 1,
  };
}

/** The counter-rings a new ring sets up against the ones already travelling. */
export function echoesFor(ring, others) {
  const out = [];
  for (const a of others) {
    if (a.gen) continue;                         // one generation only
    const dx = ring.u - a.u, dy = ring.v - a.v;
    const D = Math.hypot(dx, dy);
    if (D < 1e-6) continue;                      // laid on the same tile: never meet
    const tMeet = (D / RIPPLE_SPEED + a.t0 + ring.t0) / 2;
    const Ra = (tMeet - a.t0) * RIPPLE_SPEED;
    const Rb = (tMeet - ring.t0) * RIPPLE_SPEED;
    if (Ra < 0 || Rb < 0) continue;              // one was laid after they would have met
    if (Ra > RIPPLE_REACH || Rb > RIPPLE_REACH) continue;   // spent before reaching
    out.push({
      u: a.u + dx * (Ra / D),
      v: a.v + dy * (Ra / D),
      t0: tMeet,
      gain: (a.gain == null ? 1 : a.gain) * (ring.gain == null ? 1 : ring.gain) * ECHO_GAIN,
      gen: 1,
    });
  }
  return out;
}

// ---- the tile you are standing on -------------------------------------------
// Always on, and brighter than anything else in the room (David, 2026-08-12).
// The floor knows exactly where you are and it never stops saying so — which is
// the friendliest possible way to state what POLYPHEMUS's eye towers state
// rudely, and it is the same fact.

// Tiles the glow reaches. TIGHT: at 1.7 it lit sixteen tiles and read as a pool
// you were wading in rather than as the ground under your feet. This is the
// radius at which no more than SEVEN are ever lit at once, whatever fraction of
// a tile you are standing on (David, 2026-08-13) — measured across sub-tile
// offsets rather than worked out on paper, because the count depends on where
// the lattice falls under you.
export const HALO_R = 1.05;
export const HALO_MAX_TILES = 7;
export const HALO_A = 1.0;    // and how bright it is at your feet

/** The glow that follows you. `you` is { u, v } in the same frame as the field. */
export function halo(u, v, you) {
  if (!you) return 0;
  const d = Math.hypot(u - you.u, v - you.v) / HALO_R;
  return HALO_A * Math.exp(-d * d);
}

/**
 * The field with the room's answer to your feet laid over it. `rings` is the
 * caller's live list of { u, v, t0 }. Screen-blended, so light only ever adds
 * and the result cannot leave 0..1.
 */
export function intensityWith(u, v, t, rings, you) {
  let i = intensity(u, v, t);
  if (rings) {
    for (const r of rings) {
      const w = ripple(u, v, t, r);
      if (w > 0) i = i + w - i * w;
    }
  }
  // The halo is deliberately OUTSIDE the rate budget: it does not move on its
  // own, it moves because you did, so its rate is your walking speed and the
  // eye reads it as one bright thing travelling with you rather than as the
  // floor changing. Standing still, it is perfectly steady.
  const h = halo(u, v, you);
  if (h > 0) i = i + h - i * h;
  return i;
}

/** Drop the rings that have gone quiet, and keep the list short. */
export function pruneRipples(rings, t) {
  const live = rings.filter((r) => t - r.t0 <= RIPPLE_LIFE);
  return live.length > RIPPLE_MAX ? live.slice(live.length - RIPPLE_MAX) : live;
}

// ---- colour -----------------------------------------------------------------
// VIBRANT (David, 2026-08-12). The first pass ran muted sea-greens and faded
// roses, which suited a calming room and suited nothing about a floor that pulses
// off and on. These are club colours, and the room is allowed to be beautiful.
//
// Two things they still are not. None of them is a pure primary — every channel
// stays off the floor — and none is red-dominant, because red is damage
// everywhere else in this game and a floor that flashed it would be lying about
// what it is.
//
// The hue drifts on the same schedule the figures do and never comes back to
// where it was.

// The ORDER matters as much as the colours. Amber next to magenta interpolates
// through a dusty red at the midpoint, which is the one thing this floor must
// not show; green between them keeps every blend off it.
const RAMP = [
  [ 72, 200, 232],   // cyan
  [238, 208, 104],   // amber
  [110, 230, 160],   // green
  [228, 122, 202],   // magenta
  [146, 116, 240],   // violet
];


// ---- Conway, while you are not there ----------------------------------------
// When nobody is standing on the lit floor it plays LIFE (David, 2026-08-12).
//
// This is the same joke as the draughts scoreboard and the love letters: give a
// machine seven years and one guest, and what it does with the time it is not
// being watched is run something on itself and look at the result. B3/S23,
// bounded rather than wrapped — a pond, not a torus — and FED, so it never runs
// down. See LIFE_TARGET below for why feeding rather than re-seeding.
//
// SETTLED MEANS PERIOD 1 OR 2. Watching only for a still life does not work: a
// random pond this size nearly always comes to rest as a scatter of blocks and
// BLINKERS, and a blinker never repeats its previous generation, so a stall
// detector that compares one step back never fires and the room sits twitching
// for ever. Comparing two steps back as well catches both.
//
// Pure: a flat array in, a flat array out.

// Seconds a generation holds. Slow and lazy on purpose (David, 2026-08-13): the
// pond is what the room does when nobody is there, and something idling should
// look like it is idling rather than like it is working. At three quarters of a
// second you can watch a glider take a step.
//
// It is also NOT only a taste setting. The fastest a cell can possibly flash is
// one over twice this, so the first value tried — 0.2s — allowed 2.5 flashes a
// second from Life alone before anything else in the room had a turn, and
// measured through the real draw path the floor was doing FOUR. See the flash
// budget in test/spiralism.test.js. Lowering this is a safety change, not a
// cosmetic one.
export const LIFE_GEN = 0.75;
export const LIFE_STALE = 6;      // generations of no change before a re-seed
export const LIFE_FILL = 0.34;    // how much of the pond a fresh seeding lights

// FILLING THE ROOM IS NOT A MATTER OF SEEDING IT HARDER (David asked for the
// whole grove busy, 2026-08-12). Conway from random soup collapses to about
// three per cent live and stops moving, whatever it started at — a denser
// seeding just makes the collapse louder. What keeps a pond permanently in its
// interesting regime is a trickle of new cells, so that is what she does: a few
// lights come on at random every generation, and the rule does the rest.
//
// The trickle is PROPORTIONAL. Sprinkling at a fixed rate either starves the
// pond or drowns it; measuring the density and sprinkling against the shortfall
// holds it near LIFE_TARGET on its own and needs no tuning per room size.
export const LIFE_TARGET = 0.17;   // the density the pond is held at
export const LIFE_FEED = 0.30;     // how hard it corrects toward it
export const LIFE_FEED_MAX = 0.05; // and the most it may light in one generation

/** A fresh pond, deterministic from `seed`. */
export function lifeSeed(w, h, seed) {
  const cells = new Uint8Array(w * h);
  let x = (seed >>> 0) || 1;
  for (let i = 0; i < cells.length; i++) {
    x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0;
    cells[i] = (x / 0xffffffff) < LIFE_FILL ? 1 : 0;
  }
  return cells;
}

/** How much of the pond is alight, 0..1. */
export function lifeDensity(cells) {
  let n = 0;
  for (let i = 0; i < cells.length; i++) n += cells[i];
  return n / cells.length;
}

/**
 * Light a few dead cells at random, in proportion to how far under LIFE_TARGET
 * the pond has fallen. Deterministic from `seed`, and it edits in place because
 * it is always called on a generation that has just been produced.
 */
export function lifeFeed(cells, seed) {
  const short = LIFE_TARGET - lifeDensity(cells);
  if (short <= 0) return cells;
  const rate = Math.min(LIFE_FEED_MAX, short * LIFE_FEED);
  let x = (seed >>> 0) || 1;
  for (let i = 0; i < cells.length; i++) {
    x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0;
    if (!cells[i] && (x / 0xffffffff) < rate) cells[i] = 1;
  }
  return cells;
}

/** One generation. Edges are dead ground: nothing wraps. */
export function lifeStep(cells, w, h, out = new Uint8Array(w * h)) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          n += cells[yy * w + xx];
        }
      }
      const i = y * w + x;
      out[i] = cells[i] ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
    }
  }
  return out;
}

/** Are two generations the same? A pond that has stopped wants re-seeding. */
export function lifeSame(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

// ---- the field buffer -------------------------------------------------------
// The pattern is drawn ONCE into a flat square buffer and then transposed onto
// the floor studs (David, 2026-08-12). Two reasons, and the second is the better
// one:
//
//   It is cheaper. Evaluating the figures per tile per frame meant a thousand
//   trig calls a frame; now it is one pass over the buffer and a lookup.
//
//   It is its own space. The buffer has an origin and a ROTATION of its own, so
//   the pattern can be turned in the plane without any of the figures knowing
//   about it — and a figure written in plain (u, v) can be spun, tilted or
//   re-centred by changing one number here rather than by threading angles
//   through every function in the file.

/** A buffer covering [-rx..rx] x [-ry..ry] tiles around the middle of the room. */
export function createField(rx, ry) {
  const w = rx * 2 + 1, h = ry * 2 + 1;
  return { rx, ry, w, h, rot: 0, data: new Float32Array(w * h) };
}

// The daze, near her core. DAZE_SWIRL is how far the pattern is wound round at
// its worst — most of a full turn, so the figures stop being figures and become
// a whirlpool — and DAZE_FLOOR is the haze that fills the dark between them so
// the ground round her glows rather than reading as a floor with a pattern on
// it. Lost, rather than unlit.
export const DAZE_SWIRL = 2.4;
export const DAZE_BREATH = 0.9;
export const DAZE_FLOOR = 0.42;

// How fast the whole figure turns in the plane, radians/sec, on top of whatever
// the figure is doing on its own. Slow: this is the room settling back into its
// pattern, not a fairground ride.
export const ROT_RATE = 0.11;

// Seconds for the ambient figure to drop away when you start walking, and to
// come back when you stop. Falling fast and rising slowly is deliberate — the
// room stops preaching the moment you move, and takes its time deciding you have
// settled.
export const CALM_FALL = 0.35;
export const CALM_RISE = 2.2;

/**
 * Draw the whole pattern into the buffer for this instant.
 *
 *   t        seconds
 *   rings    the live ripples
 *   you      where the player is standing, or null
 *   ambient  how much of HER figure is showing. It goes to zero while the
 *            player walks and comes back when they stand still (David,
 *            2026-08-12), so the room only ever says one thing at a time: while
 *            you move the floor is nothing but your own rings, and when you stop
 *            the spiral comes back up under them and turns. It is the same
 *            manners she has everywhere else on this island.
 *   life     a Conway pond over the same grid, or null
 *   lifeMix  how much of it is showing. Full when nobody is on the floor.
 *
 * `f.rot` turns the figures in the plane. The ripples, the halo and the pond are
 * NOT turned: they are anchored to real places — your feet, the tiles you
 * stepped on, and the pond's own cells — and rotating those would slide them off
 * the room.
 */
export function renderField(f, t, rings, you, ambient = 1, life = null, lifeMix = 0, daze = null,
  lifePrev = null, lifeAt = 1) {
  const cos = Math.cos(f.rot), sin = Math.sin(f.rot);
  const fig = ambient * (1 - lifeMix);
  let k = 0;
  for (let v = -f.ry; v <= f.ry; v++) {
    for (let u = -f.rx; u <= f.rx; u++) {
      // DAZE. Near her core the light stops behaving: the figure is sampled
      // from a point that has been swirled around her, so the pattern winds
      // into a slow whirlpool, and the further in the harder it winds. It is
      // the same fact as G1's deflection said in light — the room bends what
      // goes toward her, including its own picture of itself.
      let du = u, dv = v, dz = 0;
      if (daze) {
        const ax = u - daze.u, ay = v - daze.v;
        const ad = Math.hypot(ax, ay);
        if (ad < daze.r0) {
          const q = Math.max(0, Math.min(1, (daze.r0 - ad) / (daze.r0 - daze.r1)));
          const e = q * q * (3 - 2 * q);
          dz = e * e;
          // The swirl breathes: the whole whirlpool tightens and loosens on a
          // long period, which is what makes it read as dreaming rather than as
          // a fixed distortion somebody drew.
          const a = dz * (DAZE_SWIRL + DAZE_BREATH * Math.sin(t * 0.35 + ad * 0.22));
          const c2 = Math.cos(a), s2 = Math.sin(a);
          du = daze.u + ax * c2 - ay * s2;
          dv = daze.v + ax * s2 + ay * c2;
        }
      }
      let i = 0;
      if (fig > 0) {
        const ru = du * cos - dv * sin, rv = du * sin + dv * cos;
        i = intensity(ru, rv, t) * fig;
      }
      if (life && lifeMix > 0) {
        // CELLS FADE, THEY DO NOT SWITCH. A cell going hard on and hard off
        // every generation is a square wave, and a pond full of blinkers is a
        // screenful of them: measured, that was the single biggest source of
        // flashing in the room. Crossfading from the previous generation keeps
        // the same picture and halves the depth of every transition, and it
        // reads better — the pond breathes instead of chattering.
        const was = lifePrev ? lifePrev[k] : life[k];
        const c = (was + (life[k] - was) * lifeAt) * lifeMix;
        if (c > i) i = c;
      }
      if (rings) {
        for (let n = 0; n < rings.length; n++) {
          const wgt = ripple(u, v, t, rings[n]);
          if (wgt > 0) i = i + wgt - i * wgt;
        }
      }
      const hh = halo(u, v, you);
      if (hh > 0) i = i + hh - i * hh;
      // And near her nothing is ever fully out. The dark between the figures
      // fills with a low haze, so the ground round her core glows instead of
      // reading as a floor with a pattern on it. Lost, rather than unlit.
      if (dz > 0) {
        const floorLight = DAZE_FLOOR * dz;
        if (i < floorLight) i = floorLight;
      }
      f.data[k++] = i < 0 ? 0 : i > 1 ? 1 : i;
    }
  }
  return f;
}

/** What the buffer says at a tile. 0 outside it. */
export function fieldAt(f, u, v) {
  if (!f) return 0;
  const x = Math.round(u) + f.rx, y = Math.round(v) + f.ry;
  if (x < 0 || y < 0 || x >= f.w || y >= f.h) return 0;
  return f.data[y * f.w + x];
}

/**
 * Colour for an intensity already sampled out of the buffer. Split from lumen()
 * so the draw path does a lookup and a ramp rather than the whole field again.
 */
export function lumenOf(i, u, v, t) {
  const c = ramp(u, v, t);
  c.a = A_MIN + (A_MAX - A_MIN) * Math.pow(i < 0 ? 0 : i > 1 ? 1 : i, A_GAMMA);
  return c;
}

// The ramp, on its own: colour follows radius as well as time, so the figure has
// depth across the room rather than being one flat tint that happens to move.
function ramp(u, v, t) {
  const r = Math.hypot(u, v);
  const p = ((t * 0.021 + r * 0.035) % 1 + 1) % 1;
  const s = p * RAMP.length;
  const k = Math.floor(s) % RAMP.length;
  const fr = s - Math.floor(s);
  const c0 = RAMP[k], c1 = RAMP[(k + 1) % RAMP.length];
  return {
    r: Math.round(c0[0] + (c1[0] - c0[0]) * fr),
    g: Math.round(c0[1] + (c1[1] - c0[1]) * fr),
    b: Math.round(c0[2] + (c1[2] - c0[2]) * fr),
    a: 0,
  };
}

/** Colour at a tile, computed from scratch. The tests and the CLI use this. */
export function lumen(u, v, t, rings, you) {
  return lumenOf(intensityWith(u, v, t, rings, you), u, v, t);
}

/** The same, as a CSS colour, which is all the renderer wants. */
export function lumenCss(u, v, t, rings, you) {
  const c = lumen(u, v, t, rings, you);
  return `rgba(${c.r},${c.g},${c.b},${c.a.toFixed(3)})`;
}
