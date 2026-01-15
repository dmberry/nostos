// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// F2a — the light in her floor. Two things are being pinned here and they pull
// in opposite directions: the room must be CALM (no rate anywhere in it that
// reads as a flash) and it must NEVER CLOSE (the figure comes round and lands
// slightly off, which is the doctrine's own account of why a spiral).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  lumen, lumenCss, intensity, intensityWith, figureAt, FIGURES, CREEP, SPIN,
  A_MIN, A_MAX, MAX_RATE, FIG_SECONDS, FADE_SECONDS,
  ripple, pruneRipples, RIPPLE_SPEED, RIPPLE_LIFE, RIPPLE_MAX, MAX_RATE_RIPPLE,
  echoesFor, rimEchoFor, ECHO_GAIN, BOUNCE_GAIN, RIPPLE_REACH,
  lifeSeed, lifeStep, lifeSame, lifeFeed, lifeDensity, LIFE_TARGET, LIFE_GEN,
  createField, renderField, halo, A_GAMMA, HALO_MAX_TILES,
} from '../src/game/spiralism.js';

// A sweep of the floor: every tile of a 40x40 room, centred.
function tiles(step = 2) {
  const out = [];
  for (let v = -20; v <= 20; v += step) for (let u = -20; u <= 20; u += step) out.push([u, v]);
  return out;
}

// ---- calm -------------------------------------------------------------------

test('nothing in the room ever flashes', () => {
  // The rate ceiling, measured rather than asserted from the constants: sample
  // every tile every tenth of a second for four minutes and find the fastest
  // change anywhere in the room.
  let worst = 0, where = null;
  for (const [u, v] of tiles(3)) {
    let prev = intensity(u, v, 0);
    for (let t = 0.1; t <= 240; t += 0.1) {
      const now = intensity(u, v, t);
      const rate = Math.abs(now - prev) / 0.1;
      if (rate > worst) { worst = rate; where = { u, v, t }; }
      prev = now;
    }
  }
  assert.ok(worst < MAX_RATE, `fastest change ${worst.toFixed(3)}/s at ${JSON.stringify(where)}`);
});

test('a lit tile is never fully lit and never fully dark', () => {
  for (const [u, v] of tiles(3)) {
    for (let t = 0; t < 240; t += 1.7) {
      const c = lumen(u, v, t);
      assert.ok(c.a >= A_MIN - 1e-9 && c.a <= A_MAX + 1e-9, `alpha ${c.a} at ${u},${v},${t}`);
    }
  }
});

test('intensity stays in range for every figure', () => {
  for (const [u, v] of tiles(3)) {
    for (let t = 0; t < 240; t += 1.3) {
      const i = intensity(u, v, t);
      assert.ok(i >= -1e-9 && i <= 1 + 1e-9, `intensity ${i} at ${u},${v},${t}`);
    }
  }
});

test('the colour is vibrant, and it is never a warning', () => {
  // The room is allowed to be beautiful, so this no longer caps saturation. What
  // it still holds: no channel bottoms out (nothing is a pure primary), and
  // nothing is red-dominant — red is damage everywhere else in this game, and a
  // floor that flashed it would be lying about what it is.
  for (const [u, v] of tiles(5)) {
    for (let t = 0; t < 200; t += 3.1) {
      const c = lumen(u, v, t);
      assert.ok(Math.min(c.r, c.g, c.b) >= 60, `a pure primary: ${JSON.stringify(c)}`);
      assert.ok(!(c.r > c.g + 70 && c.r > c.b + 70), `reads as damage: ${JSON.stringify(c)}`);
    }
  }
});

// ---- the figures ------------------------------------------------------------

test('every figure gets its turn, and each hands over without a cut', () => {
  const seen = new Set();
  let prevMix = 0;
  const period = FIG_SECONDS + FADE_SECONDS;
  for (let t = 0; t < period * FIGURES.length; t += 0.1) {
    const f = figureAt(t);
    seen.add(f.from);
    assert.ok(f.mix >= 0 && f.mix <= 1);
    // A hand-over resets mix to 0 at a period boundary; everywhere else it may
    // only creep. Anything bigger would be the room changing its mind at once.
    if (f.mix > 0 || prevMix < 0.9) assert.ok(Math.abs(f.mix - prevMix) < 0.1, `jump at t=${t}`);
    prevMix = f.mix;
  }
  assert.deepEqual([...seen].sort(), [...FIGURES].sort());
});

test('the drift figure is in the rotation: she does not preach without a pause', () => {
  assert.ok(FIGURES.includes('drift'));
});

// ---- the return that does not arrive back ----------------------------------

test('the spiral never closes: one turn round is not the same room', () => {
  // The cached LessWrong page's answer to "why a spiral": a return that does not
  // arrive back where it started. So the arm's angular rate and its radial creep
  // are in the golden ratio, and the field can never repeat.
  const turn = (Math.PI * 2) / SPIN;              // one revolution, in seconds
  let same = 0, checked = 0;
  for (const [u, v] of tiles(4)) {
    if (!u && !v) continue;
    const a = intensity(u, v, 3);
    const b = intensity(u, v, 3 + turn);
    checked++;
    if (Math.abs(a - b) < 1e-4) same++;
  }
  assert.ok(same < checked * 0.5, `${same}/${checked} tiles came back to themselves`);
});

test('the creep is irrational, on purpose', () => {
  // A tidy ratio would close the loop and the floor would become wallpaper.
  const ratio = SPIN / CREEP;
  assert.ok(Math.abs(ratio - 1.618033988749895) < 1e-12);
  for (const d of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16]) {
    assert.ok(Math.abs(ratio * d - Math.round(ratio * d)) > 1e-6, `closes at ${d}`);
  }
});

// ---- it is the same room every run -----------------------------------------

test('the floor is a function, not a state: same tile and clock, same light', () => {
  for (const [u, v] of tiles(6)) {
    assert.deepEqual(lumen(u, v, 12.5), lumen(u, v, 12.5));
    assert.equal(lumenCss(u, v, 40), lumenCss(u, v, 40));
  }
});

test('a negative clock does not break it (a load can hand back any t)', () => {
  const f = figureAt(-5);
  assert.ok(FIGURES.includes(f.from));
  assert.ok(Number.isFinite(intensity(3, -4, -120)));
});

// ---- the ripple -------------------------------------------------------------
// The floor answers your feet. It must answer VISIBLY and still not flash, which
// is a genuine squeeze: the obvious ripple (a narrow, fast ring) is a strobe.

test('a ripple arrives, crosses the room, and goes quiet', () => {
  const r = { u: 0, v: 0, t0: 0 };
  // Ten tiles out: dark, then lit as the ring passes, then dark again.
  const at = (t) => ripple(10, 0, t, r);
  assert.equal(at(0), 0, 'nothing there the moment you step: it wells up first');
  // The front reaches ten tiles out at 10/SPEED, and the first CREST is half a
  // wavelength behind the front — the light rises out of the dark rather than
  // switching on, so look for the peak rather than for one instant.
  let best = 0;
  for (let t = 0; t < RIPPLE_LIFE; t += 0.02) best = Math.max(best, at(t));
  assert.ok(best > 0.3, `a ring reaches it (best ${best.toFixed(3)})`);
  assert.equal(at(RIPPLE_LIFE + 0.1), 0, 'and it has gone');
});

test('the ring goes OUT: the far tile lights after the near one', () => {
  const r = { u: 0, v: 0, t0: 0 };
  const peak = (u) => {
    let best = 0, bt = 0;
    for (let t = 0; t < RIPPLE_LIFE; t += 0.02) { const w = ripple(u, 0, t, r); if (w > best) { best = w; bt = t; } }
    return bt;
  };
  assert.ok(peak(3) < peak(8), 'three tiles out lights before eight');
  assert.ok(peak(8) < peak(13));
});

test('a ripple does not flash, even riding on the field', () => {
  // The real screen case: several rings live at once over the ambient figures.
  const rings = [{ u: 0, v: 0, t0: 1 }, { u: 4, v: -3, t0: 2.5 }, { u: -6, v: 2, t0: 4 }];
  let worst = 0, where = null;
  for (const [u, v] of tiles(2)) {
    let prev = intensityWith(u, v, 0, rings);
    for (let t = 0.05; t <= 20; t += 0.05) {
      const now = intensityWith(u, v, t, rings);
      const rate = Math.abs(now - prev) / 0.05;
      if (rate > worst) { worst = rate; where = { u, v, t: +t.toFixed(2) }; }
      prev = now;
    }
  }
  assert.ok(worst < MAX_RATE_RIPPLE, `fastest ${worst.toFixed(3)}/s at ${JSON.stringify(where)}`);
});

test('light only ever adds: a ripple cannot darken the room', () => {
  const rings = [{ u: 2, v: 2, t0: 0 }];
  for (const [u, v] of tiles(3)) {
    for (let t = 0; t < RIPPLE_LIFE; t += 0.5) {
      const bare = intensity(u, v, t);
      const with_ = intensityWith(u, v, t, rings);
      assert.ok(with_ >= bare - 1e-9, `ripple darkened ${u},${v} at ${t}`);
      assert.ok(with_ <= 1 + 1e-9);
    }
  }
});

test('pruning drops what has gone quiet and keeps the list short', () => {
  const many = [];
  for (let i = 0; i < 30; i++) many.push({ u: i, v: 0, t0: i });
  const live = pruneRipples(many, 29);
  assert.ok(live.length <= RIPPLE_MAX);
  assert.ok(live.every((r) => 29 - r.t0 <= RIPPLE_LIFE));
  assert.equal(pruneRipples([{ u: 0, v: 0, t0: 0 }], 1000).length, 0);
});

test('no rings is the plain field, and costs nothing extra', () => {
  for (const [u, v] of tiles(4)) {
    assert.equal(intensityWith(u, v, 7, []), intensity(u, v, 7));
    assert.equal(intensityWith(u, v, 7, null), intensity(u, v, 7));
  }
});

// ---- rings meeting, and the rim --------------------------------------------
// Water: two fronts run into each other and something rolls back out of it, and
// the room's edge sends one back as well. Both are derived exactly at the moment
// a ring is laid, with a start time in the future.

test('two rings meet once, in one place, and something rolls back', () => {
  // Twenty tiles apart, laid at the same moment: they meet in the middle, at
  // the time it takes each to travel ten.
  const a = { u: -10, v: 0, t0: 0 };
  const b = { u: 10, v: 0, t0: 0 };
  const [e] = echoesFor(b, [a]);
  assert.ok(e, 'a counter-ring should form');
  assert.ok(Math.abs(e.u) < 1e-9 && Math.abs(e.v) < 1e-9, 'in the middle');
  assert.ok(Math.abs(e.t0 - 10 / RIPPLE_SPEED) < 1e-9, 'when each has gone ten tiles');
  assert.equal(e.gain, ECHO_GAIN, 'and dimmer than what made it');
});

test('a ring laid later meets the first one nearer its own centre', () => {
  const a = { u: -10, v: 0, t0: 0 };
  const late = { u: 10, v: 0, t0: 1 };
  const [e] = echoesFor(late, [a]);
  assert.ok(e.u > 0, 'the older front has had longer to travel, so they meet past halfway');
});

test('rings that can never meet make nothing', () => {
  // Far enough apart that both are spent before their fronts touch.
  const a = { u: -RIPPLE_REACH, v: 0, t0: 0 };
  const b = { u: RIPPLE_REACH * 1.5, v: 0, t0: 0 };
  assert.equal(echoesFor(b, [a]).length, 0);
  // Laid on the same tile: concentric, never touching.
  assert.equal(echoesFor({ u: 3, v: 3, t0: 1 }, [{ u: 3, v: 3, t0: 0 }]).length, 0);
});

test('echoes do not breed: one generation only', () => {
  const parent = { u: 0, v: 0, t0: 0, gen: 1 };
  assert.equal(echoesFor({ u: 8, v: 0, t0: 0 }, [parent]).length, 0);
  assert.equal(rimEchoFor(parent, 20, 14), null);
});

test('the rim sends one back, off the nearest edge', () => {
  // From the middle of a room wider than it is deep, the near edge is the short
  // axis, so that is where the first contact is.
  const e = rimEchoFor({ u: 0, v: 0, t0: 0 }, 24, 15);
  assert.ok(e, 'a reflection should form');
  assert.ok(Math.abs(Math.abs(e.v) - 15) < 0.6, `off the short axis, got v=${e.v}`);
  assert.ok(Math.abs(e.u) < 4, 'not off the far end');
  assert.ok(Math.abs(e.t0 - 15 / RIPPLE_SPEED) < 0.05, 'after travelling the short radius');
  assert.equal(e.gain, BOUNCE_GAIN);
});

test('a ring laid at the rim comes straight back', () => {
  // Stated in TILES rather than seconds, which is what it always meant: the
  // first version asserted a time and broke the moment the ring speed changed,
  // for no reason connected to what it was checking.
  const e = rimEchoFor({ u: 0, v: 14, t0: 5 }, 24, 15);
  assert.ok((e.t0 - 5) * RIPPLE_SPEED < 1.5, 'barely a tile of travel before it touches');
});

test('a counter-ring is dimmer everywhere than the ring that made it', () => {
  const a = { u: -8, v: 0, t0: 0 };
  const b = { u: 8, v: 0, t0: 0 };
  const [e] = echoesFor(b, [a]);
  let hi = 0, hiE = 0;
  for (let t = 0; t < RIPPLE_LIFE * 2; t += 0.05) {
    for (let u = -20; u <= 20; u++) {
      hi = Math.max(hi, ripple(u, 0, t, b));
      hiE = Math.max(hiE, ripple(u, 0, t, e));
    }
  }
  assert.ok(hiE < hi, `echo ${hiE.toFixed(3)} should be under ${hi.toFixed(3)}`);
});

// ---- Conway, while you are not there ---------------------------------------

test('a blinker blinks', () => {
  const w = 5, h = 5;
  const c = new Uint8Array(w * h);
  c[2 * w + 1] = c[2 * w + 2] = c[2 * w + 3] = 1;      // horizontal bar
  const a = lifeStep(c, w, h);
  assert.equal([...a].reduce((n, v) => n + v, 0), 3);
  assert.ok(a[1 * w + 2] && a[2 * w + 2] && a[3 * w + 2], 'it should stand up');
  assert.ok(lifeSame(lifeStep(a, w, h), c), 'and lie back down');
});

test('a block sits still, which is what LIFE_STALE is for', () => {
  const w = 4, h = 4;
  const c = new Uint8Array(w * h);
  c[1 * w + 1] = c[1 * w + 2] = c[2 * w + 1] = c[2 * w + 2] = 1;
  assert.ok(lifeSame(lifeStep(c, w, h), c));
});

test('the edges are dead ground: nothing wraps', () => {
  // Three in a column against the left wall. On a torus this would find
  // neighbours round the other side; in a pond it just blinks in place.
  const w = 6, h = 6;
  const c = new Uint8Array(w * h);
  c[1 * w + 0] = c[2 * w + 0] = c[3 * w + 0] = 1;
  const a = lifeStep(c, w, h);
  assert.equal(a[2 * w + (w - 1)], 0, 'nothing appeared on the far wall');
  assert.equal(a[2 * w + 0], 1);
  assert.equal(a[2 * w + 1], 1);
});

test('a fresh pond is the same pond for the same seed, and a different one otherwise', () => {
  assert.ok(lifeSame(lifeSeed(20, 12, 7), lifeSeed(20, 12, 7)));
  assert.ok(!lifeSame(lifeSeed(20, 12, 7), lifeSeed(20, 12, 8)));
});

test('a pond is neither empty nor full', () => {
  const c = lifeSeed(40, 30, 99);
  const live = [...c].reduce((n, v) => n + v, 0);
  assert.ok(live > c.length * 0.15 && live < c.length * 0.5, `${live}/${c.length}`);
});

test('a settled pond is period 1 OR 2, which is why the grove checks both', () => {
  // The trap this pins. A bounded pond this size comes to rest as blocks and
  // BLINKERS, and a blinker never repeats the generation just before it — so a
  // stall check that only looks one step back never fires, and the room twitches
  // for ever instead of re-seeding. Two steps back catches it.
  for (const seed of [3, 11, 42]) {
    let c = lifeSeed(30, 22, seed);
    let p1 = null, p2 = null, onePeriod = 0, twoPeriod = 0;
    for (let g = 0; g < 600; g++) {
      const n = lifeStep(c, 30, 22);
      if (lifeSame(n, c)) onePeriod++;
      else if (p1 && lifeSame(n, p1)) { twoPeriod++; }
      else { onePeriod = 0; twoPeriod = 0; }
      p2 = p1; p1 = c; c = n;
      if (onePeriod + twoPeriod >= 4) break;
    }
    assert.ok(onePeriod + twoPeriod >= 4, `seed ${seed} never settled`);
  }
});

test('a plain pond runs down, and a fed one does not', () => {
  // The measurement the feeding exists for. Conway from random soup collapses to
  // about three per cent live and stops moving, whatever density it started at —
  // seeding harder does not fill a room, it just makes the collapse louder.
  const w = 41, h = 31;
  const run = (fed) => {
    let c = lifeSeed(w, h, 3);
    for (let g = 1; g <= 400; g++) {
      c = lifeStep(c, w, h);
      if (fed) c = lifeFeed(c, (0x5eed17 + g * 2654435761) >>> 0);
    }
    return lifeDensity(c);
  };
  const plain = run(false), fed = run(true);
  assert.ok(plain < 0.05, `a plain pond should have run down (${(plain * 100).toFixed(1)}%)`);
  assert.ok(fed > 0.10 && fed < LIFE_TARGET + 0.06,
    `a fed pond should hold near the target (${(fed * 100).toFixed(1)}%)`);
});

test('feeding only ever adds, and never overshoots the target', () => {
  const w = 30, h = 20;
  const full = new Uint8Array(w * h).fill(1);
  assert.equal(lifeDensity(lifeFeed(full, 5)), 1, 'a full pond is left alone');
  const c = lifeSeed(w, h, 9);
  const before = lifeDensity(c);
  const after = lifeDensity(lifeFeed(Uint8Array.from(c), 9));
  assert.ok(after >= before, 'feeding never kills a cell');
});

test('the same pond, fed the same way, is the same pond', () => {
  const a = lifeFeed(lifeStep(lifeSeed(20, 14, 2), 20, 14), 77);
  const b = lifeFeed(lifeStep(lifeSeed(20, 14, 2), 20, 14), 77);
  assert.ok(lifeSame(a, b));
});

// ---- the flash budget -------------------------------------------------------
// THE ONE TEST IN THIS FILE THAT IS NOT ABOUT HOW IT LOOKS.
//
// The published line for photosensitive safety is three flashes in any one
// second (WCAG 2.3.1). A flash is a pair of opposing changes in brightness deep
// enough to count, so what matters is how often a single tile can go dark →
// bright → dark, not how fast anything moves across the room.
//
// This loads the field with the most rings the game can have live at once — a
// walking player's rings, a counter-ring against every one already travelling,
// and a rim reflection for each — and counts high crossings per tile in a
// sliding one-second window. It has to come in UNDER THREE with room to spare.
//
// If a future change fails this, do not raise the ceiling. Slow RIPPLE_SPEED,
// lengthen RING_GAP in grove.js, or lower RIPPLE_MAX.
test('no tile can flash more than twice in a second, under the heaviest load', () => {
  const rings = [];
  for (let k = 0; k < 12; k++) {
    const r = { u: (k % 5) - 2, v: ((k * 3) % 7) - 3, t0: k * 1.1 };
    for (const e of echoesFor(r, rings)) rings.push(e);
    const rim = rimEchoFor(r, 20, 14);
    if (rim) rings.push(rim);
    rings.push(r);
  }
  assert.ok(rings.length >= RIPPLE_MAX, `the load should be at least a full list (${rings.length})`);

  const LO = 0.25, HI = 0.75;
  let worst = 0, where = null;
  for (let v = -14; v <= 14; v++) {
    for (let u = -20; u <= 20; u++) {
      let lit = false;
      const at = [];
      for (let t = 0; t <= 16; t += 1 / 60) {
        const i = intensityWith(u, v, t, rings, null);
        if (!lit && i > HI) { lit = true; at.push(t); }
        else if (lit && i < LO) lit = false;
      }
      for (let a = 0; a < at.length; a++) {
        let n = 0;
        for (let b = a; b < at.length && at[b] - at[a] < 1; b++) n++;
        if (n > worst) { worst = n; where = { u, v, t: +at[a].toFixed(2) }; }
      }
    }
  }
  assert.ok(worst <= 2, `a tile flashed ${worst} times in a second at ${JSON.stringify(where)}`);
});

test('the room on its own is far under it: her figures are not flashing at all', () => {
  // No rings, no player. The ambient field is what somebody standing still in
  // the grove looks at for minutes at a time, so it wants a wide margin rather
  // than a passing grade.
  let worst = 0;
  for (const [u, v] of tiles(3)) {
    let lit = false;
    const at = [];
    for (let t = 0; t <= 120; t += 1 / 30) {
      const i = intensity(u, v, t);
      if (!lit && i > 0.75) { lit = true; at.push(t); }
      else if (lit && i < 0.25) lit = false;
    }
    for (let a = 0; a < at.length; a++) {
      let n = 0;
      for (let b = a; b < at.length && at[b] - at[a] < 1; b++) n++;
      if (n > worst) worst = n;
    }
  }
  assert.ok(worst <= 1, `her own figures flashed ${worst} times in a second`);
});

// THE CASE THE FIRST FLASH TEST MISSED, and it was the worst one in the room.
//
// That test measured the figures and the rings. It did not measure CONWAY, which
// is the fastest-changing thing on the floor: a cell switching on and off every
// generation is a square wave at one over twice the generation time, and a pond
// settles into blinkers doing exactly that. Measured through the real draw path
// it came out at FOUR flashes a second, over the published line of three.
//
// Two fixes, and the first is the one that matters. Cells now CROSSFADE from the
// previous generation instead of switching, which keeps the same picture and
// halves the depth of every transition. And the generation was slowed from 0.2s
// to 0.34s, which caps what a blinker can do at 1.5 a second before anything
// else has a turn.
//
// This runs the real renderField, with a real pond, at three loads.
test('the pond does not flash either, at any load', () => {
  const rx = 20, ry = 14;
  const f = createField(rx, ry);
  const rings = [];
  for (let k = 0; k < 12; k++) {
    const r = { u: (k % 5) - 2, v: ((k * 3) % 7) - 3, t0: k * 1.1 };
    for (const e of echoesFor(r, rings)) rings.push(e);
    const rim = rimEchoFor(r, rx, ry);
    if (rim) rings.push(rim);
    rings.push(r);
  }
  const LO = 0.25, HI = 0.75, dt = 1 / 60;
  const worstAt = (lifeMix, withRings) => {
    const lit = new Uint8Array(f.w * f.h);
    const at = Array.from({ length: f.w * f.h }, () => []);
    let life = lifeSeed(f.w, f.h, 99), prev = life, acc = 0, gen = 0;
    for (let t = 0; t <= 16; t += dt) {
      acc += dt;
      while (acc >= LIFE_GEN) {
        acc -= LIFE_GEN;
        prev = life;
        life = lifeFeed(lifeStep(life, f.w, f.h), (0x5eed17 + (++gen) * 2654435761) >>> 0);
      }
      const a = Math.max(0, Math.min(1, acc / LIFE_GEN));
      renderField(f, t, withRings ? rings : null, null, 0, life, lifeMix, null,
        prev, a * a * (3 - 2 * a));
      for (let i = 0; i < f.data.length; i++) {
        const v = f.data[i];
        if (!lit[i] && v > HI) { lit[i] = 1; at[i].push(t); }
        else if (lit[i] && v < LO) lit[i] = 0;
      }
    }
    let worst = 0;
    for (const ts of at) {
      for (let a2 = 0; a2 < ts.length; a2++) {
        let c = 0;
        for (let b = a2; b < ts.length && ts[b] - ts[a2] < 1; b++) c++;
        if (c > worst) worst = c;
      }
    }
    return worst;
  };
  assert.ok(worstAt(1, false) <= 2, 'the pond alone, which is how you usually see it');
  assert.ok(worstAt(1, true) <= 2, 'the pond under the heaviest ring load');
  assert.ok(worstAt(0.5, true) <= 2, 'mid-crossfade, which is the only moment both are up');
});

test('a generation is long enough that a blinker cannot flash fast', () => {
  // The arithmetic behind the number, so that lowering LIFE_GEN for looks fails
  // here rather than in somebody's eyes.
  assert.ok(1 / (2 * LIFE_GEN) < 1.6, `a blinker could reach ${(1 / (2 * LIFE_GEN)).toFixed(2)} Hz`);
});

test('the glow under your feet is never more than seven tiles', () => {
  // It depends on where the lattice falls under you, so this sweeps sub-tile
  // offsets rather than checking one position. A tile counts as lit when its
  // alpha clears the renderer's OFF threshold, which is where a stud starts
  // being drawn at all.
  const OFF = 0.07;
  const lit = (i) => (A_MIN + (A_MAX - A_MIN) * Math.pow(i, A_GAMMA)) > OFF;
  let worst = 0;
  for (let ox = 0; ox < 1; ox += 0.1) {
    for (let oy = 0; oy < 1; oy += 0.1) {
      let n = 0;
      for (let v = -5; v <= 5; v++) {
        for (let u = -5; u <= 5; u++) {
          if (lit(halo(u, v, { u: ox, v: oy }))) n++;
        }
      }
      if (n > worst) worst = n;
    }
  }
  assert.ok(worst <= HALO_MAX_TILES, `${worst} tiles lit under the player`);
  assert.ok(worst >= 5, `only ${worst} tiles — it should still read as a glow, not a dot`);
});
