// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// LIGHT SOURCES (#189).
//
// David, 2026-08-17: "could the lights of the ob and factory etc. cast light
// into the scene?" — with Parallel Realities part 10, which builds a per-tile
// light level: a default level for the whole world, plus a falloff from each
// source, summed and clamped, then multiplied into every object's colour.
//
// SAME MODEL, DIFFERENT MACHINERY. That tutorial tints each sprite because SDL
// gives it a per-texture colour mod and nothing else. A canvas has compositing,
// so the night veil is already one dark layer OVER the world — and light is
// what you take OUT of it. Each source erases its own falloff from the veil
// (`destination-out`, so overlapping pools add exactly as the tutorial's sum
// does) and then lays its colour back in. The result reads the same and costs
// one buffer rather than a multiply per drawn thing.
//
// WHAT LIGHTS ARE FOR HERE. Every emitter on the island is something that is
// running: the tower's screen, the foundry's vents, the terminal you can log
// into, the fire you laid yourself. So the light is a state readout you can see
// from across a field — jam a tower and its pool goes out, let a fire burn down
// and the ground goes back to the dark. That is why a felled or jammed obelisk
// emits nothing rather than emitting less.
//
// PURE, like build.js and cooking.js: a map and a position go in, a list of
// lights comes out. The renderer projects them; nothing here knows about canvas.

import { isLit, fireStrength } from './cooking.js';
import { obeliskLive } from './blight.js';   // the one test for "is this node on the net"

/**
 * What each kind of fixture throws, before its own state is taken into account.
 *
 * `radius` is in TILES, `level` is how much of the dark it lifts at the centre
 * (0..1, the tutorial's light level), `rgb` is the colour it lays back in.
 *
 * The colours are the fixtures' own, not decoration: the towers and terminals
 * are the estate's green phosphor, the foundry is the cold blue-white of the
 * vents, and the campfire is the one warm light on the island — which is most
 * of why it is worth building.
 */
export const EMITTERS = {
  obelisk: { radius: 6.5, level: 0.72, rgb: [110, 245, 160], flicker: 'screen' },
  tor: { radius: 2.6, level: 0.6, rgb: [120, 235, 150], flicker: 'screen' },  // HERMES is a relay box, not a floodlight
  wfactory: { radius: 8, level: 0.85, rgb: [175, 215, 255], flicker: 'vent' },
  mainframe: { radius: 6, level: 0.8, rgb: [130, 200, 255], flicker: 'vent' },
  gateterm: { radius: 3.2, level: 0.5, rgb: [110, 235, 150], flicker: 'screen' },
  campfire: { radius: 3, level: 1, rgb: [255, 168, 72], flicker: 'fire' },   // a fire lights its own clearing, not a field
  lamp: { radius: 4.2, level: 0.62, rgb: [232, 208, 150], flicker: 'stutter' },
};

/**
 * The light this object is throwing right now, or null if it is throwing none.
 *
 * A dead machine is dark. `destroyed` is rubble, `needsRebuild` is a tower
 * you have knocked over, `frozen` and `jammed` are ones you have taken off the
 * network — all of them stop the screen, so all of them stop the light. Damage
 * short of that dims it, which is the tower visibly failing before it falls.
 */
export function emitterOf(obj) {
  if (!obj) return null;
  const base = EMITTERS[obj.type];
  if (!base) return null;
  if (!obeliskLive(obj)) return null;   // destroyed / needsRebuild / frozen / jammed
  if (obj.type === 'campfire') {
    // A fire is as bright as it is big, and embers still throw a little.
    if (!isLit(obj)) return null;
    const s = fireStrength(obj);
    return { ...base, radius: base.radius * (0.55 + 0.45 * s), level: base.level * (0.4 + 0.6 * s) };
  }
  // The panopticon eye is the island's great sensor and stands nearly twice as
  // tall as the lesser towers; it throws accordingly.
  if (obj.type === 'obelisk') {
    const dmg = obj.obDamage || 0;
    const eye = obj.cls === 'eye' ? 1.45 : 1;
    const hurt = Math.max(0.25, 1 - dmg * 0.22);
    return { ...base, radius: base.radius * eye, level: base.level * eye * hurt };
  }
  return { ...base };
}

/**
 * Every light within `cull` tiles of a point, as `{x, y, radius, level, rgb,
 * flicker, seed}` at the tile's centre.
 *
 * CULLED, and not as an optimisation to add later: a radial gradient per source
 * across a 128x192 map every frame is what cost the Backspace its framerate
 * when the underworld lamps went in (see `drawLampGlows`). Anything you cannot
 * see cannot light anything you can.
 */
export function lightsNear(map, cx, cy, cull = 26) {
  const out = [];
  if (!map || !map.objects) return out;
  for (const o of map.objects) {
    if (Math.abs(o.x - cx) > cull || Math.abs(o.y - cy) > cull) continue;
    const em = emitterOf(o);
    if (!em) continue;
    out.push({
      x: o.x + 0.5,
      y: o.y + 0.5,
      radius: em.radius,
      level: em.level,
      rgb: em.rgb,
      flicker: em.flicker,
      seed: o.seed != null ? o.seed : (o.x * 7 + o.y * 13) % 100,
    });
  }
  return out;
}

/**
 * How bright a source is at time `t` (seconds), 0..1ish.
 *
 * Pure in `t` so it can be tested, and so nothing here has to reach for a
 * clock. Each kind moves the way its fixture would: a screen breathes, a vent
 * pulses hard as the foundry works, a fire is never still, and the underworld
 * lamps stutter the way the existing `_lampFlicker` has them stutter.
 */
export function flickerAt(kind, seed, t) {
  switch (kind) {
    case 'screen':
      return 0.9 + 0.1 * Math.sin(t * 1.6 + seed);
    case 'vent':
      return 0.78 + 0.22 * Math.abs(Math.sin(t * 2.4 + seed * 0.7));
    case 'fire': {
      // Slower than a real flame flickers (David, 2026-08-17: "can you slow the
      // pulse of the fire slightly"). At the speed a fire actually moves, a
      // pool this size strobes the whole clearing; what you want is the
      // breathing of it, not the flicker.
      const a = Math.sin(t * 3.4 + seed) * 0.5 + Math.sin(t * 1.6 + seed * 2.3) * 0.32;
      return 0.82 + 0.18 * a;
    }
    case 'stutter': {
      // NOTHING HERE FLASHES ABOVE 3 Hz. The underworld lamps' stutter was
      // lifted from the renderer's own `_lampFlicker`, which square-waves on
      // `sin(t * 32)` — about 5 Hz, squarely inside the band photosensitive
      // epilepsy guidance tells you to stay out of (David asked for the check).
      // Slowed to a little under 2 Hz and shallowed, which still reads as a
      // failing tube. `flickerAt` is covered by a test that measures the rate
      // of every kind rather than trusting the constants to stay put.
      const slow = Math.sin(t * 0.7 + seed) * Math.sin(t * 0.13 + seed * 1.7);
      if (slow > 0.85) return (Math.sin(t * 11 + seed) > 0) ? 0.45 : 0.9;
      return 1;
    }
    default:
      return 1;
  }
}
