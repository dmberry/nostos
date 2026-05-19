// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

import { FLOORS, OBJECTS } from './tiles.js';
import { makeRng } from './rng.js';
import {
  simpleColumn, columnTop, columnSurface, isSimple, cloneColumn,
  setColumnTop, setColumnSurface, packColumn, unpackColumn, standOn,
} from './terrain.js';

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
    this.shaking = new Set(); // objects currently animating a hit wobble
    this.groundItems = [];    // dropped loot: {item, qty, x, y}
    // Per-tile terrain elevation in whole steps (hills). Default flat.
    this.height = new Int8Array(w * h);
    // THE COLUMN STORE (docs/terrain-3d-plan.md). `floor` and `height` above
    // still hold every ORDINARY tile — one material, one top surface — because
    // that is what an ordinary tile is and two typed arrays are the cheapest
    // possible way to say it. This Map holds only the tiles that have become
    // something the two arrays cannot express: grass over stone, a deck with air
    // under it, anything a player has actually built. One entry per built tile,
    // not a second copy of the island, and an untouched island never allocates.
    //
    // The two are kept in step by every writer below: a complex tile's `floor`
    // and `height` entries always agree with its column's surface and top, so
    // the sixteen files that read the old accessors cannot tell the difference —
    // which is the whole compatibility contract, and test/terrain.test.js's
    // property test is what holds it to account.
    this.columns = new Map();
    // WHERE THE WORLD'S OWN GROUND IS (David, 2026-08-16: "like Minecraft - you
    // can only build on existing blocks - preventing the problem of RAISING and
    // LOWERING blocks and causing holes in the world").
    //
    // Remembered LAZILY, per tile, the first time a build tool touches it: the
    // height it stood at before anybody built on it. Untouched tiles are not in
    // here at all and do not need to be — an untouched tile IS the ground, so
    // its current height is the answer. One entry per built tile, the same shape
    // and the same cost as the column store beside it.
    //
    // What it is FOR: breaking stops here. You can take back every block you
    // put down and not one grain of the island underneath, so there is no way to
    // dig a hole through the world — which was the failure mode the old Raise
    // and Lower tools had by construction, since they moved the ground itself.
    this.bedrock = new Map();
    // Subtle per-tile brightness variation so large floors read as texture.
    const rng = makeRng(1234);
    this.shade = Float32Array.from({ length: w * h }, () => (rng() - 0.5) * 0.12);
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  // #138. Every accessor below takes a POINT and answers about the TILE THAT
  // CONTAINS IT, so a caller holding an entity's position may ask directly.
  //
  // Before this, a fractional coordinate produced a fractional array index:
  // `objectGrid[5.7]` is undefined, so objectAt said "nothing here" while a
  // factory stood on the tile, and isSolid said "walkable" for the same reason.
  // Wrong answers, in the shape of ordinary ones, from the accessors the whole
  // game asks about collision. That is how #136 (robots printed inside the
  // factory) happened, and every call site that hand-floors is a place someone
  // had to know. Flooring here is idempotent for the callers that already do.
  //
  // Returns -1 for a point outside the map, which each caller reads as its own
  // kind of nothing (null floor, no object, height 0, solid).
  idx(x, y) {
    const tx = Math.floor(x), ty = Math.floor(y);
    return this.inBounds(tx, ty) ? ty * this.w + tx : -1;
  }

  floorAt(x, y) {
    const i = this.idx(x, y);
    return i < 0 ? null : this.floor[i];
  }

  setFloor(x, y, type) {
    const i = this.idx(x, y);
    if (i < 0) return;
    this.floor[i] = type;
    const col = this.columns.get(i);
    if (col) setColumnSurface(col, type);
  }

  shadeAt(x, y) {
    const i = this.idx(x, y);
    return i < 0 ? 0 : this.shade[i];
  }

  heightAt(x, y) {
    const i = this.idx(x, y);
    return i < 0 ? 0 : this.height[i];
  }

  setHeight(x, y, h) {
    const i = this.idx(x, y);
    if (i < 0) return;
    this.height[i] = h;
    const col = this.columns.get(i);
    if (col) setColumnTop(col, h);
  }

  // ---- columns (docs/terrain-3d-plan.md) ------------------------------------

  /**
   * The full column at a tile — the stack, not just its lid.
   *
   * Synthesised from the two arrays for an ordinary tile, so a caller may ask
   * about ANY tile without knowing or caring which tiles have been built on.
   * The synthesised column is a fresh object each time; write through
   * `setColumn` rather than mutating what you are handed.
   */
  columnAt(x, y) {
    const i = this.idx(x, y);
    if (i < 0) return null;
    const col = this.columns.get(i);
    return col ? col : simpleColumn(this.floor[i], this.height[i]);
  }

  /**
   * Put a column down, and keep the old accessors telling the truth about it.
   *
   * A column that turns out to be ORDINARY is not stored at all — it goes back
   * into the two arrays and its Map entry is dropped. So a tile built up and
   * then flattened again costs nothing, and the store only ever holds tiles that
   * are genuinely more than a floor type and a height.
   */
  setColumn(x, y, col) {
    const i = this.idx(x, y);
    if (i < 0 || !col || !col.runs || !col.runs.length) return null;
    this.floor[i] = columnSurface(col) ?? this.floor[i];
    this.height[i] = columnTop(col);
    if (isSimple(col)) this.columns.delete(i);
    else this.columns.set(i, col);
    return col;
  }

  /**
   * The world's own ground level at a tile — the floor a player cannot dig past.
   *
   * A tile nobody has built on IS the ground, so its current height is the
   * answer and nothing needs storing. `rememberBedrock` is called by the build
   * tools before their first edit to a tile, which is the only moment the
   * pre-build height is still known.
   */
  bedrockAt(x, y) {
    const i = this.idx(x, y);
    if (i < 0) return 0;
    const b = this.bedrock.get(i);
    return b === undefined ? this.height[i] : b;
  }

  rememberBedrock(x, y) {
    const i = this.idx(x, y);
    if (i < 0 || this.bedrock.has(i)) return;
    this.bedrock.set(i, this.height[i]);
  }

  /** Built tiles' original ground, for the save — same shape as packColumns. */
  packBedrock() {
    const out = [];
    for (const [i, b] of this.bedrock) out.push([i % this.w, (i / this.w) | 0, b]);
    return out;
  }

  applyBedrock(list) {
    if (!Array.isArray(list)) return 0;
    let n = 0;
    for (const e of list) {
      if (!Array.isArray(e) || e.length < 3) continue;
      const i = this.idx(e[0], e[1]);
      if (i >= 0) { this.bedrock.set(i, e[2]); n++; }
    }
    return n;
  }

  /** A mutable copy of a tile's column, ready to be handed back to setColumn. */
  editColumn(x, y) {
    const col = this.columnAt(x, y);
    return col ? cloneColumn(col) : null;
  }

  /**
   * The built tiles, for the island save — the store IS the diff.
   *
   * Nothing generated needs saving: an island rebuilds identically from its
   * seed, so the only terrain worth writing down is the terrain a player made,
   * and that is exactly what the Map holds.
   */
  packColumns() {
    const out = [];
    for (const [i, col] of this.columns) out.push([i % this.w, (i / this.w) | 0, packColumn(col)]);
    return out;
  }

  applyColumns(list) {
    if (!Array.isArray(list)) return 0;
    let n = 0;
    for (const entry of list) {
      if (!Array.isArray(entry) || entry.length < 3) continue;
      const col = unpackColumn(entry[2]);
      if (col && this.setColumn(entry[0], entry[1], col)) n++;
    }
    return n;
  }

  // Ground height, plus the extra step of standing on top of a climbable
  // object (a wall, rubble, a rock — see OBJECTS in tiles.js) if one
  // occupies this tile. Used by the player's own climb check and by the
  // renderer, so a climbed block visually lifts them the same way a hill
  // does.
  effectiveHeightAt(x, y) {
    const base = this.heightAt(x, y);
    const obj = this.objectAt(x, y);
    const def = obj && OBJECTS[obj.type];
    return def && def.climbable ? base + (def.climbHeight || 1) : base;
  }

  /**
   * The height a walker at `feetZ` would stand at on this tile (stage 5).
   *
   * FOR AN ORDINARY TILE THIS IS `effectiveHeightAt`, to the byte — no stored
   * column means no interior air, so there is one surface and it is the one
   * that was always returned. That is deliberate: this goes underneath a
   * movement system that is already in play, and the only tiles whose answer
   * can change are the ones somebody built a gap into.
   *
   * On a column WITH air in it, the answer depends on where your feet are: the
   * ground if you are under the deck, the deck if you are on it. A column with
   * nothing reachable reports its top, which the step check then reads as the
   * wall it is.
   */
  standingHeightAt(x, y, feetZ = Infinity, maxStep = 1, headroom = 1) {
    const i = this.idx(x, y);
    if (i < 0) return 0;
    const col = this.columns.get(i);
    let base;
    if (!col) base = this.height[i];
    else {
      const lid = standOn(col, feetZ, maxStep, headroom);
      base = lid === null ? columnTop(col) : lid;
    }
    const obj = this.objectGrid[i];
    const def = obj && OBJECTS[obj.type];
    return def && def.climbable ? base + (def.climbHeight || 1) : base;
  }

  objectAt(x, y) {
    const i = this.idx(x, y);
    return i < 0 ? null : this.objectGrid[i];
  }

  // The object records its tile, not the point it was placed from, so
  // removeObject's grid lookup finds the same cell addObject wrote.
  addObject(type, x, y, props = {}) {
    const tx = Math.floor(x), ty = Math.floor(y);
    const i = this.idx(tx, ty);
    if (i < 0 || this.objectGrid[i]) return null;
    const obj = { type, x: tx, y: ty, ...props };
    this.objects.push(obj);
    this.objectGrid[i] = obj;
    return obj;
  }

  removeObject(obj) {
    const i = this.objects.indexOf(obj);
    if (i >= 0) this.objects.splice(i, 1);
    if (this.objectGrid[obj.y * this.w + obj.x] === obj) {
      this.objectGrid[obj.y * this.w + obj.x] = null;
    }
    this.shaking.delete(obj);
  }

  // Tick down hit-wobble timers; called once per update step.
  updateShakes(dt) {
    for (const obj of this.shaking) {
      obj.shake -= dt;
      if (obj.shake <= 0) {
        obj.shake = 0;
        this.shaking.delete(obj);
      }
    }
  }

  // Out-of-bounds counts as solid so the map edge is a wall.
  // Which building a tile belongs to, or null for open ground. The list is put
  // here by worldgen (each entry carries its `type`, see buildings.js) and is
  // small — a dozen or so lots — so a linear scan is the right amount of
  // machinery. The lot rectangle INCLUDES its walls, so standing in a doorway
  // still counts as being at that building, which is what a caller asking "what
  // is this place?" means by the question.
  buildingAt(x, y) {
    const list = this.buildings;
    if (!list) return null;
    for (const b of list) {
      if (x >= b.x0 && x < b.x0 + b.w && y >= b.y0 && y < b.y0 + b.h) return b;
    }
    return null;
  }

  isSolid(x, y) {
    const i = this.idx(x, y);
    if (i < 0) return true;
    const f = FLOORS[this.floor[i]];
    if (f && f.solid) return true;
    const o = this.objectGrid[i];
    return !!(o && OBJECTS[o.type].solid);
  }

  // Whether a solid *object* — wall, tree, rock, wreck, obelisk, cache, car,
  // the W-factory — occupies this tile. Deliberately narrower than isSolid:
  // solid floor (deep water) blocks walking but must never block a shot
  // fired across or over it.
  blocksShot(x, y) {
    const i = this.idx(x, y);
    if (i < 0) return true;
    const o = this.objectGrid[i];
    return !!(o && OBJECTS[o.type].solid);
  }

  // True if nothing solid — nor a ridge of raised terrain — stands between
  // the two points. Sampled at a fine enough interval for this game's short
  // weapon ranges (a dozen tiles at most) — a full Bresenham walk isn't
  // needed at that scale. A tile blocks sight only if it's higher than
  // *both* endpoints (a hill genuinely taller than shooter and target
  // alike); checking against an interpolated straight sightline instead
  // sounds more precise but isn't — it falsely blocks a shooter's own view
  // across a plateau sitting at their own height for several tiles before
  // it drops away.
  hasLineOfSight(x0, y0, x1, y1) {
    const dx = x1 - x0, dy = y1 - y0;
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-6) return true;
    const ceiling = Math.max(this.heightAt(x0, y0), this.heightAt(x1, y1)) + 0.5;
    const steps = Math.ceil(dist * 4);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = x0 + dx * t, y = y0 + dy * t;
      if (this.blocksShot(x, y)) return false;
      if (this.heightAt(x, y) > ceiling) return false;
    }
    return true;
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
