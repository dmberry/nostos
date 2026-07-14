// The failed crossing: the geometry of launching a boat that was never going to
// make it. Kept pure (a map-like with floorAt/w/h is all it needs) so the rules
// can be tested without a canvas — main.js owns the sequence and the narration,
// this owns the question "where does the water actually let you go, and which way
// is the boat pointing while it takes you there".

export const CF_DIST = 22;   // tiles of open water you'd LIKE before the sea answers
// ...and the least that is worth playing a voyage for. Below this there is nowhere
// to sail: the boat is on a stream mouth or a pinched cove, and forcing the trip
// anyway would row the player straight across the sand. Under CF_MIN, the launch
// falls back to the plain washed-back bounce, which is the truth of it.
export const CF_MIN = 4;

// The first couple of steps are still the beach — you are shoving the hull down
// the sand and off the lip. Land there does not end the voyage.
const SHORE_GRACE = 2;

// How far can you row that way before you hit something that isn't water?
//
// The map edge is NOT a wall. An island's map carries only a thin rim of sea (on
// Aeaea, about three tiles), and the renderer already draws open ocean past the
// edge — so a boat that clears the rim is not at a boundary, it is at sea. That
// is the whole point of the voyage: the island has to fall away behind you. Land
// stops you; the edge of the world does not.
//
// Counts tiles of open water from (x, y) along (dx, dy), capped at CF_DIST.
export function seaRun(map, x, y, dx, dy, cap = CF_DIST) {
  let run = 0;
  for (let s = 1; s <= cap; s++) {
    const tx = Math.round(x + dx * s), ty = Math.round(y + dy * s);
    const off = tx < 1 || ty < 1 || tx > map.w - 2 || ty > map.h - 2;
    if (off || map.floorAt(tx, ty) === 'sea') { run = s; continue; }  // water, or the ocean beyond
    if (s <= SHORE_GRACE) continue;                                   // still leaving the sand
    return run;                                                       // land: this is as far as she goes
  }
  return run;
}

// How far off a heading may lie from "straight out to sea" and still count as
// leaving. Without this, the longest ray from a beach is often the one that runs
// PARALLEL to the coast — a channel hugging the shore — and the boat sails along
// the beach instead of away from it. Sailing down the coast is not departing.
const SEAWARD_DOT = 0.45;   // ~63° either side of dead offshore

// Which way is out? The direction with the most open water in front of it, among
// the headings that genuinely lead away from the land. The voyage has to fit: a
// beach in a narrow cove or up against the map edge gets a short trip, not a trip
// through the sand (and if the trip is too short to be worth having, the caller
// declines — see CF_MIN). Returns {x, y, run}: a unit heading and its water.
export function seawardFrom(map, x, y, cap = CF_DIST) {
  // Where the sea lies, as the average direction of the water around you.
  let vx = 0, vy = 0;
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      if (!dx && !dy) continue;
      if (map.floorAt(Math.round(x) + dx, Math.round(y) + dy) !== 'sea') continue;
      const d = Math.hypot(dx, dy);
      vx += dx / d; vy += dy / d;
    }
  }
  const len = Math.hypot(vx, vy) || 1;
  const avg = { x: vx / len, y: vy / len };

  let best = { x: avg.x, y: avg.y, run: seaRun(map, x, y, avg.x, avg.y, cap) };
  if (best.run >= cap) return best;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const d = { x: Math.cos(a), y: Math.sin(a) };
    const dot = d.x * avg.x + d.y * avg.y;
    if (dot < SEAWARD_DOT) continue;              // that way lies the coast, not the open sea
    const run = seaRun(map, x, y, d.x, d.y, cap);
    const bestDot = best.x * avg.x + best.y * avg.y;
    if (run > best.run || (run === best.run && dot > bestDot)) best = { x: d.x, y: d.y, run };
  }
  return best;
}

// Point the boat where it is going. The sprite's bow natively runs to world +y,
// and mirroring the image maps that to world +x, so the flip is chosen by which
// side of the screen the heading falls on: screen-x tracks (x - y), so a positive
// (hx - hy) puts the bow on the right. When Poseidon turns you the heading
// reverses, and the hull swings round with it.
//
// NOTE: one sprite + its mirror covers only the two DOWN-screen headings. Sailing
// away from the camera still shows the bow, not the stern. Four sprites, keyed
// se/sw/ne/nw the way CAR_SPRITES already are, would fix it properly.
export function boatMirror(hx, hy) {
  return (hx - hy) > 0;
}
