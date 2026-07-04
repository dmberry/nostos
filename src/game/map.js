import { FLOORS, OBJECTS } from './tiles.js';
import { makeRng } from './rng.js';

// Tile map: a floor-type grid, an object list, and derived lookup grids for
// solidity and per-tile shading. Phase 1 uses a hand-written test map; the
// same structure will be fed by the world generator in Phase 2.

export class GameMap {
  constructor(w, h, fillFloor = 'grass') {
    this.w = w;
    this.h = h;
    this.floor = new Array(w * h).fill(fillFloor);
    this.objects = [];
    this.objectGrid = new Array(w * h).fill(null);
    // Subtle per-tile brightness variation so large floors read as texture.
    const rng = makeRng(1234);
    this.shade = Float32Array.from({ length: w * h }, () => (rng() - 0.5) * 0.12);
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  floorAt(x, y) {
    return this.inBounds(x, y) ? this.floor[y * this.w + x] : null;
  }

  setFloor(x, y, type) {
    if (this.inBounds(x, y)) this.floor[y * this.w + x] = type;
  }

  shadeAt(x, y) {
    return this.inBounds(x, y) ? this.shade[y * this.w + x] : 0;
  }

  objectAt(x, y) {
    return this.inBounds(x, y) ? this.objectGrid[y * this.w + x] : null;
  }

  addObject(type, x, y, props = {}) {
    if (!this.inBounds(x, y) || this.objectGrid[y * this.w + x]) return null;
    const obj = { type, x, y, ...props };
    this.objects.push(obj);
    this.objectGrid[y * this.w + x] = obj;
    return obj;
  }

  // Out-of-bounds counts as solid so the map edge is a wall.
  isSolid(x, y) {
    if (!this.inBounds(x, y)) return true;
    const f = FLOORS[this.floor[y * this.w + x]];
    if (f && f.solid) return true;
    const o = this.objectGrid[y * this.w + x];
    return !!(o && OBJECTS[o.type].solid);
  }
}

// Hand-written 48x48 test map: grass with a crossroads, a pond, a tree
// cluster, scattered lone trees, and one broken-down house.
export function buildTestMap() {
  const map = new GameMap(48, 48, 'grass');
  const rng = makeRng(42);

  // Crossroads: a horizontal and a vertical road, two tiles wide.
  for (let x = 0; x < map.w; x++) {
    map.setFloor(x, 23, 'road');
    map.setFloor(x, 24, 'road');
  }
  for (let y = 0; y < map.h; y++) {
    map.setFloor(23, y, 'road');
    map.setFloor(24, y, 'road');
  }

  // Pond with a sand rim, north-east of the crossroads.
  const px = 35, py = 10, pr = 4.2;
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      const d = Math.hypot(x - px, y - py);
      if (d < pr) map.setFloor(x, y, 'water');
      else if (d < pr + 1.4 && map.floorAt(x, y) === 'grass') map.setFloor(x, y, 'sand');
    }
  }

  // Broken-down house south-west of the crossroads: floorboards, a wall
  // perimeter with a doorway, a collapsed corner, and rubble.
  const hx0 = 8, hy0 = 30, hx1 = 16, hy1 = 37;
  for (let y = hy0; y <= hy1; y++) {
    for (let x = hx0; x <= hx1; x++) {
      map.setFloor(x, y, 'boards');
    }
  }
  for (let x = hx0; x <= hx1; x++) {
    if (x !== hx0 + 4) map.addObject('wall', x, hy0);          // north wall, window gap
    if (x < hx1 - 2) map.addObject('wall', x, hy1);            // south wall, collapsed east end
  }
  for (let y = hy0; y <= hy1; y++) {
    if (y !== hy0 + 3 && y !== hy0 + 4) map.addObject('wall', hx0, y); // west wall, doorway
    if (y < hy1 - 2) map.addObject('wall', hx1, y);            // east wall, collapsed south end
  }
  map.addObject('rubble', hx1 - 1, hy1);
  map.addObject('rubble', hx1, hy1 - 1);
  map.addObject('rubble', hx1 + 1, hy1 - 2);
  const dirtPatch = [[hx0 - 1, hy0 + 3], [hx0 - 2, hy0 + 3], [hx0 - 1, hy0 + 4]];
  for (const [x, y] of dirtPatch) map.setFloor(x, y, 'dirt');  // worn path at the door

  // Dense tree cluster (mini forest) in the north-west corner.
  for (let i = 0; i < 120; i++) {
    const x = Math.floor(rng() * 16);
    const y = Math.floor(rng() * 14);
    if (map.floorAt(x, y) === 'grass' && rng() < 0.5) map.addObject('tree', x, y);
  }

  // Lone trees and rocks scattered on remaining grass.
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(rng() * map.w);
    const y = Math.floor(rng() * map.h);
    if (map.floorAt(x, y) !== 'grass' || map.objectAt(x, y)) continue;
    if (rng() < 0.8) map.addObject('tree', x, y);
    else map.addObject('rock', x, y);
  }

  return map;
}
