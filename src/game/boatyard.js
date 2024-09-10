// A boat-builder's yard on the shore: a plank jetty running out over the sea and
// a ruined boat-house beside it, its loot boxes holding the three greek-ship
// parts (oar, rope, sail) plus salvage. This is where a shipwright's tackle
// belongs, so it replaces the scattered sail-at-wreck / oar-and-rope-in-huts
// placement (ships.js placeShipParts) with one findable coastal landmark.
//
// Deterministic from the island seed; its own module with a one-line hook in the
// island builder (per the parallel-session file rules). Returns true if the yard
// placed (its boxes hold the parts) or false if no shore site was found — the
// caller falls back to the scatter so the parts can never be unobtainable.

import { makeRng } from './rng.js';
import { rollBuildingLoot } from './buildings.js';

function placeOneYard(map, seed, spawn, withParts) {
  const rng = makeRng((seed ^ 0x0badf00d) >>> 0);
  const W = map.w, H = map.h;
  const floorAt = (x, y) => (map.inBounds(x, y) ? map.floorAt(x, y) : null);
  const free = (x, y) => map.inBounds(x, y) && !map.objectAt(x, y);
  const land = (x, y) => { const f = floorAt(x, y); return f === 'grass' || f === 'tallgrass' || f === 'sand'; };
  const CARD = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // N S W E

  // Candidate beach tiles: sand with open sea on one cardinal side and buildable
  // land on the opposite side, away from spawn and clear of the southern fortress
  // annex (keep the yard in the ordinary overworld).
  const maxY = Math.min(H - 4, 122);
  const cands = [];
  for (let y = 4; y < maxY; y++) {
    for (let x = 4; x < W - 4; x++) {
      if (floorAt(x, y) !== 'sand') continue;
      if (spawn && Math.hypot(x - spawn.x, y - spawn.y) < 22) continue;
      for (const [dx, dy] of CARD) {
        if (floorAt(x + dx, y + dy) !== 'sea') continue;       // seaward
        if (!land(x - dx, y - dy)) continue;                    // landward buildable
        cands.push({ x, y, dx, dy });
        break;
      }
    }
  }
  if (!cands.length) return false;

  const HD = 4;        // house depth, landward
  const HALF = 2;      // house half-width (5 wide)
  const WIDTH = HALF * 2 + 1;

  for (let attempt = 0; attempt < 60 && cands.length; attempt++) {
    const site = cands.splice(Math.floor(rng() * cands.length), 1)[0];
    const { x: bx, y: by, dx, dy } = site;
    const perp = [-dy, dx]; // across the seaward axis

    // The house footprint: HD deep (starting 2 tiles landward of the beach) by
    // WIDTH across. rows[di][wi] = [tx, ty]; di 0 = seaward edge (jetty side).
    const rows = [];
    let ok = true;
    for (let di = 0; di < HD && ok; di++) {
      const row = [];
      for (let wi = 0; wi < WIDTH; wi++) {
        const tx = bx - dx * (2 + di) + perp[0] * (wi - HALF);
        const ty = by - dy * (2 + di) + perp[1] * (wi - HALF);
        if (!land(tx, ty) || !free(tx, ty)) { ok = false; break; }
        row.push([tx, ty]);
      }
      rows.push(row);
    }
    if (!ok) continue;

    // ---- stamp the house: boards floor, decayed perimeter walls (a doorway on
    // the seaward edge facing the jetty, plus random ruined gaps), boxes inside.
    for (const row of rows) for (const [tx, ty] of row) map.setFloor(tx, ty, 'boards');
    const isPerimeter = (di, wi) => di === 0 || di === HD - 1 || wi === 0 || wi === WIDTH - 1;
    const isDoor = (di, wi) => di === 0 && wi === HALF; // centre of the jetty-facing edge
    for (let di = 0; di < HD; di++) {
      for (let wi = 0; wi < WIDTH; wi++) {
        if (!isPerimeter(di, wi) || isDoor(di, wi)) continue;
        if (rng() < 0.28) continue;                 // ruined: a fallen-in gap
        const [tx, ty] = rows[di][wi];
        const decay = 3 + Math.floor(rng() * 3);    // 3..5: weathered to crumbling
        map.addObject('wall', tx, ty, { decay, material: 'stone' });
      }
    }

    // Loot: the three parts split across three boxes, each with sea salvage.
    // The three greek-ship parts live in the FIRST yard and only there: a second
    // yard must not hand out a second sail, or the crossing stops being a thing
    // you had to find. Later yards hold what a working yard holds, rolled off
    // the boatyard table in buildings.js — the first real consumer of it.
    const boxLoot = withParts ? [
      [{ item: 'sail', qty: 1 }, { item: 'tin', qty: 2 }],
      [{ item: 'oar', qty: 1 }, { item: 'torch', qty: 2 }, { item: 'wood', qty: 3 }],
      [{ item: 'rope', qty: 1 }, { item: 'tin', qty: 1 }, { item: 'tape_1', qty: 1 }],
    ] : [0, 1, 2].map(() => [
      { item: rollBuildingLoot('boatyard', rng), qty: 1 + Math.floor(rng() * 3) },
    ]);
    const interior = [];
    for (let di = 1; di < HD - 1; di++) for (let wi = 1; wi < WIDTH - 1; wi++) interior.push(rows[di][wi]);
    for (let i = interior.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [interior[i], interior[j]] = [interior[j], interior[i]]; }
    for (let b = 0; b < boxLoot.length && b < interior.length; b++) {
      const [tx, ty] = interior[b];
      map.addObject('box', tx, ty, { loot: boxLoot[b], opened: false });
    }

    // The yard is a BUILDING with a kind of its own (buildings.js), so
    // map.buildingAt answers for it exactly as it does for a town lot — and its
    // type is `sited`, meaning it is placed here on the shore beside its
    // slipway and can never be rolled onto a lot two hundred tiles inland.
    const xs = [], ys = [];
    for (let di = 0; di < HD; di++) for (let wi = 0; wi < WIDTH; wi++) { xs.push(rows[di][wi][0]); ys.push(rows[di][wi][1]); }
    const bx0 = Math.min(...xs), by0 = Math.min(...ys);
    (map.buildings ??= []).push({
      x0: bx0, y0: by0,
      w: Math.max(...xs) - bx0 + 1,
      h: Math.max(...ys) - by0 + 1,
      type: 'boatyard',
    });

    // ---- the jetty: planks from the beach tile out over the sea (stop at the
    // map edge or where the sea runs out). The root tile (the beach) planks too.
    map.setFloor(bx, by, 'boards');
    for (let s = 1; s <= 6; s++) {
      const jx = bx + dx * s, jy = by + dy * s;
      if (floorAt(jx, jy) !== 'sea' || !free(jx, jy)) break;
      map.setFloor(jx, jy, 'boards');
    }
    return true;
  }
  return false;
}

// An island may have MORE THAN ONE yard: a coast with one boat-builder on it is
// a coast with a plot device on it, and several read as a place where people put
// to sea. `count` is how many to try for; each finds its own site (a yard's own
// walls and boards stop the next one landing on top of it), and only the first
// carries the ship parts.
//
// Returns HOW MANY placed, so the existing `if (!placeBoatYard(...)) scatter()`
// fallback still reads correctly: zero yards is falsy, and the caller scatters
// the parts as it always did.
export function placeBoatYard(map, seed, spawn = null, count = 1) {
  let placed = 0;
  for (let i = 0; i < Math.max(1, count); i++) {
    // A different seed per yard, or every one of them picks the same site.
    if (placeOneYard(map, (seed ^ (0x1f7 * (i + 1))) >>> 0, spawn, placed === 0)) placed += 1;
  }
  return placed;
}
