// The first landfall after leaving Ogygia — a small, throwaway islet (islands-plan
// §4/§6: Stage 1b's "one beach, one shack" stub). It is NOT a full hack-island; it
// exists to give the boat a real destination and to prove the crossing round-trips
// (sail off CALYPSO, walk a new shore, sail back). A proper Stage 3 island replaces
// it later. Hand-painted rather than worldgen'd, and tiny: it lives in the slim
// off-overworld update loop (no obelisks, factory, or fortress).

import { GameMap } from '../game/map.js';
import { createWorld } from '../game/world.js';
import { makeRng } from '../game/rng.js';

export function createIslet(seed) {
  const W = 44, H = 44;
  const map = new GameMap(W, H, 'sea');
  const rng = makeRng((seed ^ 0x15e7) >>> 0);
  const cx = W / 2, cy = H / 2;
  const R = 14;          // land radius
  const BEACH = 2;       // sand ring width

  // A rounded landmass: grass interior, a sand beach ring, open sea beyond. The
  // wobble on the distance keeps the coast from reading as a perfect circle.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) + (rng() - 0.5) * 1.6;
      if (d < R - BEACH) map.setFloor(x, y, rng() < 0.16 ? 'tallgrass' : 'grass');
      else if (d < R) map.setFloor(x, y, 'sand');
      // else: stays sea (the fill)
    }
  }

  // One shack near the middle: a boards floor with a single cache box — the
  // island's one reward for landing and looking around.
  const shx = Math.floor(cx) - 2, shy = Math.floor(cy) - 2;
  for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 5; dx++) map.setFloor(shx + dx, shy + dy, 'boards');
  map.addObject('box', shx + 2, shy + 1, {
    loot: [{ item: 'tin', qty: 2 }, { item: 'berries', qty: 3 }, { item: 'torch', qty: 1 }],
    opened: false,
  });

  // A scatter of trees so the islet reads as land, not a bare disc. Grass only,
  // clear of the shack, kept off the beach.
  for (let i = 0; i < 12; i++) {
    const a = rng() * Math.PI * 2, r = (R - BEACH - 1) * Math.sqrt(rng());
    const tx = Math.round(cx + Math.cos(a) * r), ty = Math.round(cy + Math.sin(a) * r);
    if (map.floorAt(tx, ty) === 'grass' && !map.objectAt(tx, ty)) {
      map.addObject('tree', tx, ty, { variant: Math.floor(rng() * 3) });
    }
  }

  // The boat arrives beached with you on the south shore. Find the southmost sand
  // tile on the centre column with open sea just below it, and stand you one tile
  // inland of it so you can turn and board to sail back.
  let boatX = Math.floor(cx), boatY = Math.floor(cy);
  for (let y = H - 2; y >= 0; y--) {
    if (map.floorAt(boatX, y) === 'sand' && map.floorAt(boatX, y + 1) === 'sea') { boatY = y; break; }
  }
  if (map.objectAt(boatX, boatY)) { const o = map.objectAt(boatX, boatY); map.removeObject(o); }
  // The greek ship you crossed in, beached with you (islands-plan §4). Seaworthy,
  // so boarding it sails you back to Ogygia (main.js reads seaworthy + the world).
  const boat = map.addObject('greek_ship', boatX, boatY, { hull: 100, maxHull: 100, seaworthy: true });
  const spawn = { x: boatX + 0.5, y: boatY - 1 + 0.5 }; // inland of the hull

  // Defensive fields so the islet is a fully-formed, self-contained map (mirrors
  // the Backspace pocket): the slim loop + player.update touch these.
  map.projectiles = [];
  map.bombs = [];
  map.explosions = [];
  map.explored = new Uint8Array(W * H).fill(1);
  map.newlyRevealed = [];

  const world = createWorld('islet', {
    map, spawn,
    ambience: { minimap: false, musicBed: 'synth' },
  });
  world.boat = boat;
  return world;
}
