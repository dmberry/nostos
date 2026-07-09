// Ruined marble columns — Odyssey set-dressing. The island was somewhere once;
// what's left of it are little groves of fallen temple columns half-swallowed by
// the grass. We scatter a handful of clusters at worldgen, each a loose ring of
// standing columns (some snapped off) with a few toppled drums between them.
//
// This owns placement only; tiles.js registers the 'column'/'colfall' objects
// and renderer.js (drawColumn) draws them. Runs after the coast is stamped so a
// grove never lands in the sea, and it keeps clear of spawn, water and anything
// already standing.

// A tile a column may stand on: in bounds, open grass/dirt at ground level,
// nothing already there.
function buildable(map, x, y) {
  if (x < 3 || y < 3 || x >= map.w - 3 || y >= map.h - 3) return false;
  const f = map.floorAt(x, y);
  if (f !== 'grass' && f !== 'tallgrass' && f !== 'dirt') return false;
  if (map.heightAt && map.heightAt(x, y) < 0) return false;
  return !map.objectAt(x, y);
}

// Scatter a few column groves across the map. Returns the placed grove centres.
export function placeRuins(map, rng, opts = {}) {
  const { clusters = 3, spawn = null, avoidSpawn = 16, minGap = 22 } = opts;
  const centres = [];
  let guard = 0;
  while (centres.length < clusters && guard++ < 500) {
    const cx = 3 + Math.floor(rng() * (map.w - 6));
    const cy = 3 + Math.floor(rng() * (map.h - 6));
    if (spawn && Math.hypot(cx - spawn.x, cy - spawn.y) < avoidSpawn) continue;
    if (centres.some((p) => Math.hypot(p.x - cx, p.y - cy) < minGap)) continue;
    if (!buildable(map, cx, cy)) continue;
    // Lay a loose grove: 3..6 pieces within a small radius, mixing standing
    // columns (mostly whole, some snapped) with toppled drums.
    const want = 3 + Math.floor(rng() * 4);
    let put = 0;
    for (let k = 0; k < want * 4 && put < want; k++) {
      const x = cx + Math.round((rng() - 0.5) * 5);
      const y = cy + Math.round((rng() - 0.5) * 5);
      if (!buildable(map, x, y)) continue;
      const standing = rng() < 0.6;
      const type = standing ? 'column' : 'colfall';
      const variant = standing ? (rng() < 0.62 ? 0 : 1) : 0; // 0 tall, 1 broken stump
      map.addObject(type, x, y, { variant, rot: Math.floor(rng() * 2) });
      put++;
    }
    if (put >= 2) centres.push({ x: cx, y: cy });
  }
  return centres;
}
