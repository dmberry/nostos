// The underworld: a Ubik tear doesn't just brighten reality any more — walk
// into one and it tears clean through into a liminal pocket, Backrooms-style:
// a block of huge, echoing rooms with furniture stacked around at random,
// joined only by doorways, its own faded-yellow palette, and one wrong,
// lurking thing wandering it. Generated once (lazily, on first entry) and
// kept for the rest of the session rather than regenerated per visit — a
// deliberate v1 scope cut (see PAI-version-plan.md). Self-contained: main.js
// calls createUnderworldPocket() once, then updateUnderworldCreatures() and
// drawUnderworldCreature() every frame while the player is down there, same
// shape as every other creature/AI module in this codebase.

import { GameMap } from './map.js';
import { makeRng } from './rng.js';
import { ANIMAL_SPRITE_SETS } from '../engine/textures.js';

// The pocket is a block of huge rooms rather than a thin-corridor maze —
// cavernous, sparse, furniture stacked around at random, rooms joined only
// by doorways punched in their shared walls. Backrooms proper.
const UW_GRID = 3;                          // a 3x3 block of rooms
const UW_ROOM = 13;                         // interior tiles per room side — big and echoing
const UW_PITCH = UW_ROOM + 1;               // room interior + its one shared wall
const UW_SIZE = UW_GRID * UW_PITCH + 1;     // + the far outer wall (= 43)
const UW_DOOR_W = 2;                        // doorway width between adjacent rooms
const UW_WALL_H = 42;                       // tall walls — you can't see over into the next room
const UW_FURN_MIN = 4;                      // furniture piles per room, minimum

const LURKER_WANDER_SPEED = 1.0;
const LURKER_HUNT_SPEED = 2.6;
const LURKER_NOTICE_RANGE = 7;    // needs genuine line of sight within this to ever notice you
const LURKER_LOSE_RANGE = 11;
const LURKER_HIT_RANGE = 0.6;
const LURKER_HIT_DAMAGE = 8;
const LURKER_HIT_COOLDOWN = 1.2;

// ---- rooms & doors ----------------------------------------------------

// Lay out the pocket as a GRID x GRID block of big rooms. Every tile starts
// as wall; each room's interior is cleared to open floor; adjacent rooms are
// joined by a doorway gap punched in their shared wall. A randomized DFS over
// the room graph guarantees every room is reachable (a spanning tree), plus a
// few extra doors so it reads as connected rooms rather than a strict tree.
// Every doorway sits on the room's central lane, and the central plus (the
// row and column through each room's centre) is always kept clear of
// furniture — so whatever else is stacked around, there is always a path from
// any door to any other, and the exit is always reachable.
function carveRooms(map, rng) {
  const idx = (x, y) => y * UW_SIZE + x;
  const wall = new Set();
  for (let y = 0; y < UW_SIZE; y++) for (let x = 0; x < UW_SIZE; x++) wall.add(idx(x, y));
  const roomLo = (rc) => rc * UW_PITCH + 1;            // first interior tile of room index rc
  const roomMid = (rc) => roomLo(rc) + (UW_ROOM >> 1); // its central lane tile
  const inRoom = (rc, v) => v >= roomLo(rc) && v < roomLo(rc) + UW_ROOM;

  // Clear each room's interior.
  for (let rr = 0; rr < UW_GRID; rr++) for (let rc = 0; rc < UW_GRID; rc++) {
    for (let dy = 0; dy < UW_ROOM; dy++) for (let dx = 0; dx < UW_ROOM; dx++) {
      wall.delete(idx(roomLo(rc) + dx, roomLo(rr) + dy));
    }
  }

  // Randomized DFS spanning tree over the GRID x GRID room graph, tracking the
  // deepest room reached as a cheap "far from spawn" pick for the exit.
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const visited = Array.from({ length: UW_GRID }, () => new Array(UW_GRID).fill(false));
  const doors = [];
  const stack = [[0, 0]]; visited[0][0] = true;
  let deepest = [0, 0], deepestDepth = 1;
  while (stack.length) {
    const [rc, rr] = stack[stack.length - 1];
    const opts = [];
    for (const [dc, dr] of DIRS) {
      const nc = rc + dc, nr = rr + dr;
      if (nc >= 0 && nc < UW_GRID && nr >= 0 && nr < UW_GRID && !visited[nr][nc]) opts.push([nc, nr, dc, dr]);
    }
    if (!opts.length) { stack.pop(); continue; }
    const [nc, nr] = opts[Math.floor(rng() * opts.length)];
    visited[nr][nc] = true; doors.push([rc, rr, nc, nr]); stack.push([nc, nr]);
    if (stack.length > deepestDepth) { deepestDepth = stack.length; deepest = [nc, nr]; }
  }
  // A few extra doors for loops.
  for (let n = 0; n < 3; n++) {
    const rc = Math.floor(rng() * UW_GRID), rr = Math.floor(rng() * UW_GRID);
    const [dc, dr] = DIRS[Math.floor(rng() * 4)];
    const nc = rc + dc, nr = rr + dr;
    if (nc >= 0 && nc < UW_GRID && nr >= 0 && nr < UW_GRID) doors.push([rc, rr, nc, nr]);
  }
  // Punch each door as a UW_DOOR_W gap centred on the shared central lane.
  for (const [rc, rr, nc, nr] of doors) {
    if (nc !== rc) {                                   // vertical shared wall
      const wx = roomLo(Math.max(rc, nc)) - 1, cy = roomMid(rr);
      for (let k = 0; k < UW_DOOR_W; k++) wall.delete(idx(wx, cy - (UW_DOOR_W >> 1) + k));
    } else {                                           // horizontal shared wall
      const wy = roomLo(Math.max(rr, nr)) - 1, cx = roomMid(rc);
      for (let k = 0; k < UW_DOOR_W; k++) wall.delete(idx(cx - (UW_DOOR_W >> 1) + k, wy));
    }
  }

  // Materialise the walls.
  for (let y = 0; y < UW_SIZE; y++) for (let x = 0; x < UW_SIZE; x++) {
    if (wall.has(idx(x, y))) map.addObject('fortwall', x, y, { material: 'liminal', wallH: UW_WALL_H });
  }

  // The way back out sits right where you arrive — in the spawn room (0,0),
  // a few tiles off the landing spot so you don't step straight back through
  // it, and clearly signed EXIT (the renderer draws the sign). You can always
  // get home from where you came in; exploring deeper is the optional risk.
  const exitTX = roomLo(0) + 2, exitTY = roomLo(0) + 2;

  // Furniture: clusters stacked around each room, never on the central plus
  // (so doors always connect), the spawn landing, or the exit.
  const onPlus = (rc, rr, x, y) => x === roomMid(rc) || y === roomMid(rr);
  for (let rr = 0; rr < UW_GRID; rr++) for (let rc = 0; rc < UW_GRID; rc++) {
    const clusters = UW_FURN_MIN + Math.floor(rng() * 4);
    for (let n = 0; n < clusters; n++) {
      const ax = roomLo(rc) + Math.floor(rng() * UW_ROOM);
      const ay = roomLo(rr) + Math.floor(rng() * UW_ROOM);
      const pile = 1 + Math.floor(rng() * 3);
      for (let p = 0; p < pile; p++) {
        const fx = ax + (p === 0 ? 0 : Math.floor(rng() * 3) - 1);
        const fy = ay + (p === 0 ? 0 : Math.floor(rng() * 3) - 1);
        if (!inRoom(rc, fx) || !inRoom(rr, fy)) continue;
        if (onPlus(rc, rr, fx, fy)) continue;
        if (rc === 0 && rr === 0 && Math.abs(fx - roomMid(0)) <= 2 && Math.abs(fy - roomMid(0)) <= 2) continue;
        if (Math.abs(fx - exitTX) <= 1 && Math.abs(fy - exitTY) <= 1) continue; // clear round the exit
        if (map.objectAt(fx, fy)) continue;
        map.addObject('furniture', fx, fy, {
          variant: Math.floor(rng() * 3),
          seed: Math.floor(rng() * 1000),
          h: 9 + Math.floor(rng() * 15),
        });
      }
    }
  }

  return {
    spawn: { x: roomMid(0) + 0.5, y: roomMid(0) + 0.5 },
    exit: { x: exitTX + 0.5, y: exitTY + 0.5 },
    creature: { x: roomMid(deepest[0]) + 0.5, y: roomMid(deepest[1]) + 0.5 }, // lurking in the farthest room
  };
}

// Builds the pocket once. The way back up reuses the overworld's own
// portal-tear rendering (renderer.js reads map.ubikPatches off whichever map
// is current) — seeded here as a single permanent entry, never aged or
// culled since the underworld's own update path never runs the overworld's
// ubikPatches aging loop (see main.js: it early-returns before reaching it).
export function createUnderworldPocket(seed) {
  const map = new GameMap(UW_SIZE, UW_SIZE, 'liminal');
  const rng = makeRng(seed >>> 0);
  const { spawn, exit, creature } = carveRooms(map, rng);
  // t = 3, not 0: the tear render fades a patch IN over its first ~2 seconds
  // of age, but the underworld's own update loop never ages ubikPatches — so
  // a t of 0 would leave the exit permanently invisible. Start it past the
  // fade-in and well short of the (245s) fade-out so it renders fully, always.
  map.ubikPatches = [{ x: exit.x, y: exit.y, r: 1.5, t: 3, portal: true, linkedTo: true }];
  // Same defensive setup as the overworld map gets in main.js — most of this
  // is lazily created on first use anyway (player.js does `x = x || []`
  // throughout, renderer.js guards with `if (map.x)`), but set up front for
  // consistency with how the overworld map starts.
  map.projectiles = [];
  map.bombs = [];
  map.explosions = [];
  // Fog fields, so the pocket is a fully-formed map and any stray overworld
  // code that reaches it (it shouldn't) reads a valid array rather than
  // crashing on undefined. Marked all-explored — there is no fog down here.
  map.explored = new Uint8Array(map.w * map.h).fill(1);
  map.newlyRevealed = [];
  return {
    map, spawnX: spawn.x, spawnY: spawn.y, exitX: exit.x, exitY: exit.y,
    creatureX: creature.x, creatureY: creature.y,
  };
}

// ---- the lurker ---------------------------------------------------------

export function spawnUnderworldCreature(seed, x, y) {
  const rng = makeRng(seed >>> 0);
  return {
    x, y, facing: { x: 0, y: 1 }, hunting: false, animT: rng() * 10, walkPhase: 0,
    wanderTarget: null, wanderTimer: 0, attackTimer: 0, rng,
  };
}

function isBlocked(map, x, y) {
  return map.isSolid(Math.floor(x), Math.floor(y));
}

function stepToward(c, tx, ty, speed, dt, map) {
  const dx = tx - c.x, dy = ty - c.y, len = Math.hypot(dx, dy);
  if (len < 1e-6) return;
  const step = Math.min(speed * dt, len);
  const ox = c.x, oy = c.y;
  const nx = c.x + (dx / len) * step;
  if (!isBlocked(map, nx, c.y)) c.x = nx;
  const ny = c.y + (dy / len) * step;
  if (!isBlocked(map, c.x, ny)) c.y = ny;
  const moved = Math.hypot(c.x - ox, c.y - oy);
  if (moved > 1e-6) {
    c.facing = { x: (c.x - ox) / moved, y: (c.y - oy) / moved };
    c.walkPhase += dt * 10;
  }
}

function wander(c, dt, map) {
  c.wanderTimer -= dt;
  if (c.wanderTimer <= 0 || !c.wanderTarget) {
    const ang = c.rng() * Math.PI * 2;
    const d = 3 + c.rng() * 4;
    c.wanderTarget = { x: c.x + Math.cos(ang) * d, y: c.y + Math.sin(ang) * d };
    c.wanderTimer = 2 + c.rng() * 3;
  }
  stepToward(c, c.wanderTarget.x, c.wanderTarget.y, LURKER_WANDER_SPEED, dt, map);
}

// Wanders a maze it half-belongs to until it actually sees you (genuine line
// of sight, not blind proximity — same principle as this game's T3), then
// closes in with an erratic, off-line approach rather than a clean beeline,
// so it reads as wrong rather than as just another hunter.
export function updateUnderworldCreatures(dt, creatures, player, map) {
  for (const c of creatures) {
    c.attackTimer = Math.max(0, c.attackTimer - dt);
    c.animT += dt;
    const d = Math.hypot(player.x - c.x, player.y - c.y);
    if (!c.hunting) {
      if (d < LURKER_NOTICE_RANGE && map.hasLineOfSight(c.x, c.y, player.x, player.y)) {
        c.hunting = true;
      } else {
        wander(c, dt, map);
        continue;
      }
    }
    if (d > LURKER_LOSE_RANGE || !map.hasLineOfSight(c.x, c.y, player.x, player.y)) {
      c.hunting = false;
      continue;
    }
    const jx = player.x + Math.sin(c.animT * 7) * 0.6;
    const jy = player.y + Math.cos(c.animT * 6.3) * 0.6;
    stepToward(c, jx, jy, LURKER_HUNT_SPEED, dt, map);
    if (d < LURKER_HIT_RANGE && c.attackTimer <= 0) {
      c.attackTimer = LURKER_HIT_COOLDOWN;
      player.takeDamage(LURKER_HIT_DAMAGE, 'thing in the yellow room');
    }
  }
}

// ---- drawing --------------------------------------------------------------
// facingToCompassDir/pickAnimalFrame-equivalents duplicated locally rather
// than imported — same reasoning as animals.js's own local copies: this
// module stays out of the renderer/engine's private helpers.

const UW_DIRS = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
const UW_DIR_THETA = { E: 0, SE: 45, S: 90, SW: 135, W: 180, NW: 225, N: 270, NE: 315 };
function facingToDir(facing) {
  const sx = facing.y - facing.x, sy = facing.x + facing.y;
  let theta = Math.atan2(sy, sx) * 180 / Math.PI;
  if (theta < 0) theta += 360;
  let best = 'S', bestDiff = Infinity;
  for (const dir of UW_DIRS) {
    const diff = Math.min(Math.abs(theta - UW_DIR_THETA[dir]), 360 - Math.abs(theta - UW_DIR_THETA[dir]));
    if (diff < bestDiff) { bestDiff = diff; best = dir; }
  }
  return best;
}

let _uwTintCanvas = null;
function uwTintScratch(w, h) {
  if (!_uwTintCanvas) _uwTintCanvas = document.createElement('canvas');
  if (_uwTintCanvas.width !== w || _uwTintCanvas.height !== h) {
    _uwTintCanvas.width = w;
    _uwTintCanvas.height = h;
  }
  return { canvas: _uwTintCanvas, ctx: _uwTintCanvas.getContext('2d') };
}

// A monkey sprite (the nearest thing to a humanoid silhouette in the animal
// set) recoloured sickly and pale — same tint trick as the dog/boar recolour
// in animals.js — plus a small random jitter while hunting so it never quite
// reads as a normal, steady-moving creature.
export function drawUnderworldCreature(ctx, c, worldToScreen) {
  const set = ANIMAL_SPRITE_SETS.monkey;
  if (!set) return;
  const dir = facingToDir(c.facing);
  const moving = c.hunting || !!c.wanderTarget;
  const frames = set.walk[dir];
  const sprite = moving && frames ? frames[Math.floor((c.walkPhase / (Math.PI * 2)) * frames.length) % frames.length] : set.idle[dir];
  if (!sprite || !sprite.complete || !sprite.naturalWidth) return;

  const scale = 0.195;
  const jitter = c.hunting ? 3 : 0;
  const jx = (Math.random() - 0.5) * jitter, jy = (Math.random() - 0.5) * jitter;
  const pos = worldToScreen(c.x, c.y);
  const dw = sprite.naturalWidth * scale, dh = sprite.naturalHeight * scale;
  const dx = pos.x + jx - dw / 2, dy = pos.y + jy - dh + dh * 0.16;

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(pos.x, pos.y, dw * 0.32, dw * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  const off = uwTintScratch(sprite.naturalWidth, sprite.naturalHeight);
  off.ctx.clearRect(0, 0, off.canvas.width, off.canvas.height);
  off.ctx.drawImage(sprite, 0, 0);
  off.ctx.globalCompositeOperation = 'multiply';
  off.ctx.fillStyle = c.hunting ? 'rgba(214,204,118,0.62)' : 'rgba(182,177,150,0.5)';
  off.ctx.fillRect(0, 0, off.canvas.width, off.canvas.height);
  off.ctx.globalCompositeOperation = 'destination-in';
  off.ctx.drawImage(sprite, 0, 0);
  off.ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(off.canvas, dx, dy, dw, dh);
}
