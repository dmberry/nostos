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

export const BLIGHT_MAX = 9;        // tiles a single tower's front reaches at full spread
export const BLIGHT_GROW = 0.28;    // radius tiles/sec while the tower is live + networked
export const BLIGHT_RECOVER = 0.5;  // radius tiles/sec the front retreats once the tower is stopped

// A tower contributes a growing front only while it is standing, networked, and
// not jammed. `destroyed`/`needsRebuild`/`frozen`/`jammed` all stop it. When it
// is not contributing, its radius retreats toward zero (the ground recovers).
export function obeliskLive(ob) {
  return !ob.destroyed && !ob.needsRebuild && !ob.frozen && !ob.jammed;
}

// Advance every obelisk's blight radius one step. `active` is whether POSEIDON is
// online at all — no blight grows before the network wakes. Mutates `ob.blightR`.
export function blightStep(obeliskObjs, dt, active) {
  for (const ob of obeliskObjs) {
    if (ob.blightR == null) ob.blightR = 0;
    if (active && obeliskLive(ob)) {
      ob.blightR = Math.min(BLIGHT_MAX, ob.blightR + BLIGHT_GROW * dt);
    } else {
      ob.blightR = Math.max(0, ob.blightR - BLIGHT_RECOVER * dt);
    }
  }
}

// Is tile (x,y) inside any tower's current front? Uses squared distance against
// each tower's radius. Returns true as soon as one covers it.
export function tileBlighted(x, y, obeliskObjs) {
  for (const ob of obeliskObjs) {
    const r = ob.blightR || 0;
    if (r <= 0) continue;
    const dx = x - ob.x, dy = y - ob.y;
    if (dx * dx + dy * dy <= r * r) return true;
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
    const d = Math.hypot(x - ob.x, y - ob.y);
    if (d <= r) depth = Math.max(depth, r - d);
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
