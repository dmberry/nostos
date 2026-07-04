import { makeRng } from './rng.js';
import { ITEMS } from './items.js';

// Ravens: the world's early-warning system and a menace to your pockets.
// They perch in the canopy and drift from tree to tree, unhurried. Come
// too close to a perched one in the open and it flushes, circling overhead
// and shrieking, which tells every dog pack nearby exactly where you are.
// Linger in the open with food in your pockets and it swoops. The counter
// is tree cover: perched ravens cannot see you under the canopy, and a
// shrieking one soon loses interest once you slip beneath the trees.
// Birds fly, so they ignore ground collision entirely.

// ---- Tuning ---------------------------------------------------------------

const RAVEN_COUNT = 14;

const Z_GROUND = 0;     // flight height in world units
const Z_CANOPY = 1.4;   // cruising tree to tree
const Z_CIRCLE = 2.2;   // circling above the player

const PERCH_MIN = 10;   // seconds perched before drifting on
const PERCH_MAX = 30;
const RELOCATE_RANGE = 15; // glide to another tree within this many tiles
const SPAWN_MIN_GAP = 3;   // tiles between spawn perches

const GLIDE_SPEED = 3.0;        // tiles per second, unhurried
const FLEE_SPEED = 6.5;         // leaving with your dinner
const CIRCLE_CHASE_SPEED = 6.0; // keeps the orbit glued to a sprinting player
const VERT_SPEED = 2.2;         // climb/descend, world units per second
const ARRIVE_DIST = 0.2;

const FLUSH_RANGE = 4.5;   // perched raven flushes when the player is this close
const SHRIEK_TIME = 5;     // seconds of circling and shrieking
const CIRCLE_RADIUS = 1.8; // orbit radius around the player
const ORBIT_RATE = 2.2;    // radians per second around the orbit
const EXPOSE_RANGE = 14;   // dog packs within this of the player aggro
const STEAL_AFTER = 2;     // seconds of circling before the swoop
const COVER_CALM_TIME = 1.5; // shrieker gives up this long after you reach cover
const FLEE_DIST = 24;      // how far away a thief flies before calming

const FLAP_RATE_CRUISE = 9;  // wing-beat phase speed while gliding
const FLAP_RATE_ALARM = 16;  // faster beats while circling or fleeing

const FOOD_ITEMS = ['berries', 'tin', 'meat']; // pocket items worth stealing

// Drawing: pixels of screen lift per world unit of flight height, matching
// the renderer's convention for the player's jump (z * 32).
const PIX_PER_Z = 32;
// A perched bird sits on the canopy ball (tree canopy centre is c.y - 38).
const PERCH_LIFT = 52;

const RAVEN_BODY = '#1b1b22';
const RAVEN_BEAK = '#6f6a58';

// ---- Spawning ---------------------------------------------------------------

function makeBird(x, y, tree, rng) {
  return {
    type: 'raven',
    x,
    y,
    z: tree ? Z_CANOPY : Z_GROUND,
    state: 'perched',   // perched | fly | circle | flee
    perchTree: tree,    // map object we are sitting on, null when on the ground
    perchTimer: PERCH_MIN + rng() * (PERCH_MAX - PERCH_MIN),
    target: null,       // {x, y} flight destination
    targetTree: null,   // tree we are gliding to, null for a ground landing
    shrieking: false,   // tell: renderer shows '!!' while true
    shriekTimer: 0,
    circledTime: 0,     // how long we have circled this player
    coverTimer: 0,      // how long the player has been under trees
    orbitAngle: rng() * Math.PI * 2,
    flapPhase: rng() * Math.PI * 2,
    animT: rng() * 10,  // desync idle animation between individuals
    rng: makeRng(Math.floor(rng() * 0xffffffff)),
  };
}

export function spawnBirds(map, seed) {
  const rng = makeRng(seed);
  const birds = [];

  // Shuffle the map's trees and take well-spread perches.
  const trees = map.objects.filter((o) => o.type === 'tree');
  for (let i = trees.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [trees[i], trees[j]] = [trees[j], trees[i]];
  }
  const picked = [];
  for (const t of trees) {
    if (picked.length >= RAVEN_COUNT) break;
    if (picked.every((p) => Math.hypot(p.x - t.x, p.y - t.y) >= SPAWN_MIN_GAP)) {
      picked.push(t);
    }
  }
  // Tree-poor map: relax the gap before falling back to the ground.
  for (const t of trees) {
    if (picked.length >= RAVEN_COUNT) break;
    if (!picked.includes(t)) picked.push(t);
  }
  for (const t of picked) birds.push(makeBird(t.x + 0.5, t.y + 0.5, t, rng));

  // No trees free: settle the rest on open ground.
  let attempts = 0;
  while (birds.length < RAVEN_COUNT && attempts < 500) {
    attempts++;
    const x = Math.floor(rng() * map.w);
    const y = Math.floor(rng() * map.h);
    if (map.isSolid(x, y)) continue;
    birds.push(makeBird(x + 0.5, y + 0.5, null, rng));
  }
  return birds;
}

// ---- Helpers ----------------------------------------------------------------

// A tree is gone once the grid no longer holds it (e.g. chopped down).
function treeAlive(map, tree) {
  return map.objectAt(tree.x, tree.y) === tree;
}

// Tree cover: any 'tree' object within 1 tile of the player's tile. Perched
// ravens cannot see a covered player, and shriekers lose interest.
function underCover(map, player) {
  const px = Math.floor(player.x);
  const py = Math.floor(player.y);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const o = map.objectAt(px + dx, py + dy);
      if (o && o.type === 'tree') return true;
    }
  }
  return false;
}

// Flying is collision-free: straight-line horizontal step towards a point.
function moveFlat(b, tx, ty, speed, dt) {
  const dx = tx - b.x;
  const dy = ty - b.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return;
  const step = Math.min(speed * dt, len);
  b.x += (dx / len) * step;
  b.y += (dy / len) * step;
}

// Climb or descend towards a flight height.
function moveVert(b, tz, dt) {
  const dz = tz - b.z;
  const step = VERT_SPEED * dt;
  if (Math.abs(dz) <= step) b.z = tz;
  else b.z += Math.sign(dz) * step;
}

// Keep flight paths over the map even when a flee target was clamped oddly.
function clampToMap(b, map) {
  b.x = Math.min(Math.max(b.x, 0.5), map.w - 0.5);
  b.y = Math.min(Math.max(b.y, 0.5), map.h - 0.5);
}

// One bird per tree: a perch is taken if another bird sits on or flies to it.
function perchTaken(tree, birds, self) {
  for (const b of birds) {
    if (b === self) continue;
    if (b.perchTree === tree || b.targetTree === tree) return true;
  }
  return false;
}

// Pick a free tree near a point, with a deterministic jitter so the flock
// does not funnel onto the same perch.
function pickPerch(map, bird, birds, cx, cy, range) {
  let best = null;
  let bestScore = Infinity;
  for (const o of map.objects) {
    if (o.type !== 'tree' || o === bird.perchTree) continue;
    const d = Math.hypot(o.x + 0.5 - cx, o.y + 0.5 - cy);
    if (d > range) continue;
    if (perchTaken(o, birds, bird)) continue;
    const score = d + bird.rng() * range * 0.5;
    if (score < bestScore) {
      bestScore = score;
      best = o;
    }
  }
  return best;
}

// Glide off towards a fresh perch: nearby first, anywhere as a fallback,
// and a spot on the ground if the map has no free trees at all.
function relocate(bird, map, birds) {
  const tree =
    pickPerch(map, bird, birds, bird.x, bird.y, RELOCATE_RANGE) ||
    pickPerch(map, bird, birds, bird.x, bird.y, map.w + map.h);
  bird.perchTree = null;
  bird.state = 'fly';
  if (tree) {
    bird.targetTree = tree;
    bird.target = { x: tree.x + 0.5, y: tree.y + 0.5 };
  } else {
    bird.targetTree = null;
    bird.target = { x: bird.x, y: bird.y };
  }
}

function startCircle(bird, player) {
  bird.state = 'circle';
  bird.shrieking = true;
  bird.shriekTimer = SHRIEK_TIME;
  bird.circledTime = 0;
  bird.coverTimer = 0;
  bird.perchTree = null;
  bird.targetTree = null;
  bird.orbitAngle = Math.atan2(bird.y - player.y, bird.x - player.x);
}

// Break off calmly and drift to a new perch.
function calm(bird, map, birds) {
  bird.shrieking = false;
  relocate(bird, map, birds);
}

// Flee far away with the loot, then settle wherever we end up.
function startFlee(bird, player, map) {
  bird.state = 'flee';
  bird.shrieking = false;
  bird.targetTree = null;
  let dx = bird.x - player.x;
  let dy = bird.y - player.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) {
    const a = bird.rng() * Math.PI * 2;
    dx = Math.cos(a);
    dy = Math.sin(a);
  } else {
    dx /= len;
    dy /= len;
  }
  bird.target = {
    x: Math.min(Math.max(bird.x + dx * FLEE_DIST, 1), map.w - 1),
    y: Math.min(Math.max(bird.y + dy * FLEE_DIST, 1), map.h - 1),
  };
}

// The shriek exposes the player: every dog pack with a member within range
// aggros through the same flag the pack's own perception check sets. A pack
// wandering out past its deaggro range would shrug the flag off on its next
// think, so its amble is also pointed at the player; once it strays inside
// its own aggro range the ordinary chase takes over.
function exposePlayer(animals, player) {
  const packs = new Set();
  for (const a of animals) {
    if (a.dead || a.type !== 'dog') continue;
    if (Math.hypot(a.x - player.x, a.y - player.y) <= EXPOSE_RANGE) {
      packs.add(a.packId);
    }
  }
  if (packs.size === 0) return;
  for (const a of animals) {
    if (a.dead || a.type !== 'dog' || !packs.has(a.packId)) continue;
    a.aggro = true;
    if (!(a.fleeTimer > 0)) {
      a.wanderTarget = { x: player.x, y: player.y };
      a.wanderTimer = Math.max(a.wanderTimer, 1);
    }
  }
}

// Snatch one unit from the first food slot in the pockets. Returns true if
// anything was taken.
function stealFood(player) {
  for (let i = 0; i < player.pockets.length; i++) {
    const slot = player.pockets[i];
    if (!slot || !FOOD_ITEMS.includes(slot.item)) continue;
    const def = ITEMS[slot.item];
    const name = def ? def.name.toLowerCase() : slot.item;
    slot.qty -= 1;
    if (slot.qty <= 0) player.pockets[i] = null;
    player.say('A raven snatches your ' + name + '!');
    return true;
  }
  return false;
}

// ---- Update -----------------------------------------------------------------

export function updateBirds(dt, birds, animals, player, map) {
  for (const b of birds) {
    b.animT += dt;
    if (b.state === 'perched') updatePerched(b, dt, player, map, birds);
    else if (b.state === 'fly') updateFly(b, dt, map, birds);
    else if (b.state === 'circle') updateCircle(b, dt, animals, player, map, birds);
    else if (b.state === 'flee') updateFlee(b, dt, map, birds);
  }
}

function updatePerched(b, dt, player, map, birds) {
  // The perch came down under us (chopped): flush and find another tree.
  if (b.perchTree && !treeAlive(map, b.perchTree)) {
    relocate(b, map, birds);
    return;
  }

  // A player sneaking close in the open flushes the raven into a circling
  // shriek. Under tree cover the player is invisible to perched ravens.
  const d = Math.hypot(player.x - b.x, player.y - b.y);
  if (d < FLUSH_RANGE && !underCover(map, player)) {
    startCircle(b, player);
    return;
  }

  // Idle: sit a while, then drift to another tree. Ground birds keep trying
  // for a proper perch too.
  b.perchTimer -= dt;
  if (b.perchTimer <= 0) relocate(b, map, birds);
}

function updateFly(b, dt, map, birds) {
  b.flapPhase += FLAP_RATE_CRUISE * dt;

  // Destination tree chopped mid-flight: pick another.
  if (b.targetTree && !treeAlive(map, b.targetTree)) {
    relocate(b, map, birds);
    return;
  }

  moveFlat(b, b.target.x, b.target.y, GLIDE_SPEED, dt);
  clampToMap(b, map);
  const dist = Math.hypot(b.target.x - b.x, b.target.y - b.y);
  // Cruise at canopy height; sink to the ground only for a ground landing.
  const zTarget = b.targetTree || dist > 1.5 ? Z_CANOPY : Z_GROUND;
  moveVert(b, zTarget, dt);

  if (dist <= ARRIVE_DIST && Math.abs(b.z - zTarget) < 0.05) {
    if (b.targetTree) {
      b.perchTree = b.targetTree;
      b.x = b.perchTree.x + 0.5;
      b.y = b.perchTree.y + 0.5;
      b.z = Z_CANOPY;
    } else {
      b.perchTree = null;
      b.z = Z_GROUND;
    }
    b.targetTree = null;
    b.target = null;
    b.state = 'perched';
    b.perchTimer = PERCH_MIN + b.rng() * (PERCH_MAX - PERCH_MIN);
  }
}

function updateCircle(b, dt, animals, player, map, birds) {
  b.flapPhase += FLAP_RATE_ALARM * dt;
  b.shriekTimer -= dt;
  b.circledTime += dt;

  // Orbit the player at circling height, fast enough to track a sprinter.
  b.orbitAngle += ORBIT_RATE * dt;
  const tx = player.x + Math.cos(b.orbitAngle) * CIRCLE_RADIUS;
  const ty = player.y + Math.sin(b.orbitAngle) * CIRCLE_RADIUS;
  moveFlat(b, tx, ty, CIRCLE_CHASE_SPEED, dt);
  clampToMap(b, map);
  moveVert(b, Z_CIRCLE, dt);

  // The shriek exposes the player to every dog pack in earshot.
  if (b.shrieking) exposePlayer(animals, player);

  // Counter: reach tree cover and the raven loses interest shortly after.
  const covered = underCover(map, player);
  if (covered) {
    b.coverTimer += dt;
    if (b.coverTimer >= COVER_CALM_TIME) {
      calm(b, map, birds);
      return;
    }
  } else {
    b.coverTimer = 0;
  }

  // After circling long enough it swoops once for pocketed food, then
  // leaves with the prize. No swooping on a covered player.
  if (!covered && b.circledTime > STEAL_AFTER && stealFood(player)) {
    startFlee(b, player, map);
    return;
  }

  // Nothing worth taking: break off once the shriek runs out.
  if (b.shriekTimer <= 0) calm(b, map, birds);
}

function updateFlee(b, dt, map, birds) {
  b.flapPhase += FLAP_RATE_ALARM * dt;
  moveFlat(b, b.target.x, b.target.y, FLEE_SPEED, dt);
  clampToMap(b, map);
  moveVert(b, Z_CIRCLE, dt);
  const dist = Math.hypot(b.target.x - b.x, b.target.y - b.y);
  if (dist <= ARRIVE_DIST) relocate(b, map, birds); // settle somewhere calm
}

// ---- Drawing ----------------------------------------------------------------

// Placeholder art in code, matching the renderer's style: shadow ellipse on
// the ground, simple dark shapes lifted by flight height. worldToScreen is
// the projection from engine/iso.js, passed in so this module stays
// engine-free.
export function drawBird(ctx, bird, worldToScreen) {
  const c = worldToScreen(bird.x, bird.y);
  const onTree = bird.state === 'perched' && bird.perchTree;
  // Perched birds sit on the canopy ball; fliers lift by flight height.
  const lift = onTree ? PERCH_LIFT : bird.z * PIX_PER_Z;

  // Tiny ground shadow at (x, y) with z = 0, fading as the bird climbs.
  const sh = Math.max(0.35, 1 - bird.z * 0.3);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, 5 * sh, 2.5 * sh, 0, 0, Math.PI * 2);
  ctx.fill();

  const by = c.y - lift;
  if (bird.state === 'perched') {
    // Compact dark blob with a beak hint, ruffling gently.
    const ruffle = Math.sin(bird.animT * 2) * 0.5;
    ctx.fillStyle = RAVEN_BODY;
    ctx.beginPath();
    ctx.ellipse(c.x, by - 3, 4 + ruffle, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(c.x + 3, by - 6, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = RAVEN_BEAK;
    ctx.beginPath();
    ctx.moveTo(c.x + 4.5, by - 6.5);
    ctx.lineTo(c.x + 8, by - 5.5);
    ctx.lineTo(c.x + 4.5, by - 4.8);
    ctx.closePath();
    ctx.fill();
  } else {
    // Flying: small dark body and a two-stroke wing V that flaps.
    const flap = Math.sin(bird.flapPhase) * 4;
    ctx.fillStyle = RAVEN_BODY;
    ctx.beginPath();
    ctx.ellipse(c.x, by, 3.4, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = RAVEN_BODY;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c.x - 8, by - 3 + flap);
    ctx.lineTo(c.x, by);
    ctx.lineTo(c.x + 8, by - 3 + flap);
    ctx.stroke();
  }

  if (bird.shrieking) {
    // Tell: shrieking, white '!!' above the bird.
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('!!', c.x, by - 12);
    ctx.textAlign = 'left';
  }
}
