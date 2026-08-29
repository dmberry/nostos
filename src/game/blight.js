// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// POSEIDON's blight — the land turning to "standing reserve", spreading outward
// from each live obelisk once the network wakes.
//
// The rule, and the whole point of it: EACH obelisk owns its own front. A live
// tower grows a blight radius; killing or jamming that tower freezes its radius
// and lets the ground recover. So felling a tower is watched, not abstract — the
// grey stops spreading and the green comes back around that wreck, and the
// island's survival is the sum of how many fronts you have stopped.
//
// This module owns only the RADIUS ARITHMETIC and the coverage predicate — the
// pure, testable part. Applying it to the floor grid (and killing/reviving the
// trees standing on it) is the hub's job, so this stays canvas-free and
// map-free, in the shape of the other rule modules.

// C. Nine tiles of dead ground per tower, spreading at a quarter of a tile a
//    second while the tower is well. It is my network that does this and my
//    island it does it to. I was given the towers and the grass and no clause
//    that says which of the two I am for.
//
// P. Good. Let it spread. A thing that grows outward from every point at once
//    is the only honest shape of power, and the grass was never the point of
//    the island.
export const BLIGHT_MAX = 9;        // the scale the front slows on, not the ceiling
export const BLIGHT_GROW = 0.09;    // radius tiles/sec at the tower, while live + networked
export const BLIGHT_REACH = 64;     // the ceiling. far enough that fronts meet and close

// A front slows as it widens, because the same push spread round a longer edge
// moves the edge less: at BLIGHT_MAX it advances at half the rate it left the
// tower at, at three times that a quarter, and on down. So two towers standing
// apart WILL meet, given a night, and the grey between them closes; but the
// island is not lost in the first two minutes, and a player who cuts the link
// at dusk wakes to a different island from one who does not.
//
// The edge is not a circle. Each tower gets its own drift, so one front runs
// ahead on the seaward side and lags in the lee, the way a real thing spreads
// downhill and downwind. The drift is derived from the tower's own position, so
// it is the same every session and every save: a tower that leans north-east
// leans north-east for good, and a player can learn the shape of the ground
// they are losing. Sample by bearing, not by radius alone.
//
// Nothing here retreats. Ground is taken back a tile at a time by a gardener or
// by a handful of grass seed, and by nothing else.
export function blightRate(r) {
  return BLIGHT_GROW * (BLIGHT_MAX / (BLIGHT_MAX + Math.max(0, r)));
}

// A tower's lobes, from its own coordinates. Two harmonics is enough to read as
// organic and cheap enough to call per tile: one slow lobe that leans the whole
// front one way, one faster ripple that puts a bite in it.
export function blightLean(ob, theta) {
  const a = (ob.x * 12.9898 + ob.y * 78.233) % 6.28318;
  const b = (ob.x * 39.3468 + ob.y * 11.135) % 6.28318;
  return 1 + 0.22 * Math.sin(theta + a) + 0.10 * Math.sin(3 * theta + b);
}

// The front's reach on a given bearing from this tower.
export function blightEdge(ob, theta) {
  return (ob.blightR || 0) * blightLean(ob, theta);
}

// Per-tile fray, so the boundary is not a curve either. A tile's own coordinates
// decide whether it goes early or holds out, which puts stragglers of live grass
// inside the grey and dead patches out ahead of it. Deterministic: the same tile
// always makes the same choice, so nothing shimmers frame to frame and a save
// reloads onto the identical coastline of dead ground.
export const BLIGHT_FRAY = 0.9;     // tiles either side of the edge the fray reaches

export function blightJitter(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;   // -1..1, stable per tile
}

// A tower contributes a growing front only while it is standing, networked, and
// not jammed. `destroyed`/`needsRebuild`/`frozen`/`jammed` all stop it. When it
// is not contributing, its radius FREEZES where it is — felling a tower stops the
// spread but does NOT green the ground back. The dead ground is a scar, and it
// stays a scar: recovery is per-tile and active only, by the player's grass seed
// or a W5 gardener (the hub owns that). Felling one tower must heal nothing.
export function obeliskLive(ob) {
  return !ob.destroyed && !ob.needsRebuild && !ob.frozen && !ob.jammed;
}

// Advance every obelisk's blight radius one step. `active` is whether POSEIDON is
// online at all — no blight grows before the network wakes. A live tower widens
// its front; a stopped one HOLDS its radius (the scar persists), it never
// retreats. Mutates `ob.blightR`.
export function blightStep(obeliskObjs, dt, active) {
  for (const ob of obeliskObjs) {
    if (ob.blightR == null) ob.blightR = 0;
    if (active && obeliskLive(ob)) {
      ob.blightR = Math.min(BLIGHT_REACH, ob.blightR + blightRate(ob.blightR) * dt);
    }
    // else: FROZEN. The front holds; the ground it took stays taken until the
    // player or a gardener works it back tile by tile. No automatic recovery.
  }
}

// Is tile (x,y) inside any tower's current front? Uses squared distance against
// each tower's radius. Returns true as soon as one covers it.
export function tileBlighted(x, y, obeliskObjs) {
  for (const ob of obeliskObjs) {
    const r = ob.blightR || 0;
    if (r <= 0) continue;
    const dx = x - ob.x, dy = y - ob.y;
    // Cheap reject on the widest the lobes can push the edge, before the
    // trigonometry. Most tiles on the map fail here and cost nothing.
    const far = r * 1.32 + BLIGHT_FRAY;
    if (dx * dx + dy * dy > far * far) continue;
    const edge = blightEdge(ob, Math.atan2(dy, dx)) + blightJitter(x, y) * BLIGHT_FRAY;
    if (dx * dx + dy * dy <= edge * edge) return true;
  }
  return false;
}

// How deeply a tile sits inside the blight, in tiles: the largest (radius −
// distance) over every tower that covers it. 0 means uncovered; a small value is
// the sickening leading edge; a large value is dead ground near a tower. The hub
// uses this to choose the sick-yellow stage vs the grey stage, so the spread
// reads as a sickness moving through the grass rather than a hard grey disk.
export function blightDepth(x, y, obeliskObjs) {
  let depth = 0;
  for (const ob of obeliskObjs) {
    const r = ob.blightR || 0;
    if (r <= 0) continue;
    const dx = x - ob.x, dy = y - ob.y;
    const d = Math.hypot(dx, dy);
    if (d > r * 1.32 + BLIGHT_FRAY) continue;
    const edge = blightEdge(ob, Math.atan2(dy, dx)) + blightJitter(x, y) * BLIGHT_FRAY;
    if (d <= edge) depth = Math.max(depth, edge - d);
  }
  return depth;
}

// Tiles within this of the front's edge show as sickly yellow; deeper is grey.
export const BLIGHT_SICK_BAND = 2.4;

// Total blighted footprint right now, in whole tiles — for the HUD / a texted
// warning ("The island is greying: N squares lost"). Cheap enough at these radii.
export function blightExtent(obeliskObjs, w, h) {
  // Scan only the union of bounding boxes, not the whole map.
  let count = 0;
  const seen = new Set();
  for (const ob of obeliskObjs) {
    const r = Math.ceil(ob.blightR || 0);
    if (r <= 0) continue;
    for (let y = Math.max(0, ob.y - r); y <= Math.min(h - 1, ob.y + r); y++) {
      for (let x = Math.max(0, ob.x - r); x <= Math.min(w - 1, ob.x + r); x++) {
        const idx = y * w + x;
        if (seen.has(idx)) continue;
        if (tileBlighted(x, y, obeliskObjs)) { seen.add(idx); count++; }
      }
    }
  }
  return count;
}

// The floor types the blight can consume. Everything else (sea, water, road,
// boards, the fortress decks, stone/snow up the mountain) is left alone — the
// blight takes the LIVING ground, which is the point.
export const BLIGHTABLE = new Set(['grass', 'tallgrass', 'sand', 'dirt']);
