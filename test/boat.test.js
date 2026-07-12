// Stage 1a — the craftable, shore-placed boat (Player.craftBoat).
//
// We drive the real prototype methods over a real GameMap via a stub `this`,
// rather than `new Player()` (its constructor pulls sprites/canvas). That keeps
// the test headless while exercising the actual craft logic, and — because it
// calls map.isSolid on the placed boat — it also proves `boat` is registered in
// OBJECTS (an unregistered type throws there: the drawObelisk-freeze class).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameMap } from '../src/game/map.js';
import { Player } from '../src/game/player.js';

// A 10x10 all-grass map with the west column (x=0) turned to open sea, so every
// land tile at x=1 sits at the water's edge.
function shoreMap() {
  const map = new GameMap(10, 10);
  for (let y = 0; y < 10; y++) map.setFloor(0, y, 'sea');
  return map;
}

// Minimal stand-in for the player: real craft methods, stubbed inventory/voice.
function stubPlayer({ x = 2.5, y = 2.5, hands = 'saw', wood = 12 } = {}) {
  return {
    x, y, hands, boatBuilt: false, _wood: wood, said: [],
    countItem(id) { return id === 'wood' ? this._wood : 0; },
    removeItem(id) { if (id === 'wood' && this._wood > 0) { this._wood--; return true; } return false; },
    say(m) { this.said.push(m); },
    canCraftBoat: Player.prototype.canCraftBoat,
    craftBoat: Player.prototype.craftBoat,
    _findLaunchTile: Player.prototype._findLaunchTile,
  };
}

test('boat: craftable at the shore with 12 wood and a cutting tool', () => {
  const map = shoreMap();
  const p = stubPlayer();
  assert.equal(p.canCraftBoat(map), true);
});

test('boat: crafting consumes 12 wood and beaches a solid hull at the sea edge', () => {
  const map = shoreMap();
  const p = stubPlayer();
  const before = map.objects.length;
  assert.equal(p.craftBoat(map), true);
  assert.equal(p._wood, 0, 'all 12 wood spent');
  assert.equal(p.boatBuilt, true);
  assert.equal(map.objects.length, before + 1, 'one boat object added');
  const boat = map.objects.find((o) => o.type === 'boat');
  assert.ok(boat, 'a boat object exists');
  assert.equal(boat.hull, 100);
  // At the water's edge: the boat tile is land, but 8-adjacent to a sea tile.
  const seaAdj = [-1, 0, 1].some((dx) => [-1, 0, 1].some((dy) =>
    (dx || dy) && map.floorAt(boat.x + dx, boat.y + dy) === 'sea'));
  assert.ok(seaAdj, 'boat sits at the sea edge');
  assert.notEqual(map.floorAt(boat.x, boat.y), 'sea');
  // Registered in OBJECTS → solid, and would throw here if it were not.
  assert.equal(map.isSolid(boat.x, boat.y), true);
});

test('boat: needs a full 12 wood', () => {
  const map = shoreMap();
  const p = stubPlayer({ wood: 11 });
  assert.equal(p.canCraftBoat(map), false);
  assert.equal(p.craftBoat(map), false);
  assert.equal(p._wood, 11, 'no wood spent on a failed craft');
  assert.equal(map.objects.some((o) => o.type === 'boat'), false);
});

test('boat: needs a real cutting tool in hand (treeDamage >= 2)', () => {
  const map = shoreMap();
  const p = stubPlayer({ hands: 'penknife' }); // treeDamage 1 — too blunt
  assert.equal(p.canCraftBoat(map), false);
  assert.equal(p.craftBoat(map), false);
  assert.equal(p._wood, 12, 'no wood spent');
  assert.match(p.said.at(-1), /cutting tool/i);
});

test('boat: must be built at the water\'s edge', () => {
  const map = shoreMap();
  const p = stubPlayer({ x: 8.5, y: 8.5 }); // far inland, no sea within reach
  assert.equal(p._findLaunchTile(map), null);
  assert.equal(p.canCraftBoat(map), false);
  assert.equal(p.craftBoat(map), false);
  assert.equal(p._wood, 12, 'no wood spent');
  assert.match(p.said.at(-1), /water's edge/i);
});

test('boat: never beached under the player, and only one at a time', () => {
  const map = shoreMap();
  const p = stubPlayer({ x: 1.5, y: 2.5 }); // standing ON a sea-edge tile (1,2)
  const tile = p._findLaunchTile(map);
  assert.ok(tile, 'a launch tile is found nearby');
  assert.ok(!(tile.x === 1 && tile.y === 2), 'not the tile the player stands on');
  assert.equal(p.craftBoat(map), true);
  // A second attempt is refused while a boat exists (boatBuilt guard).
  p._wood = 12;
  assert.equal(p.canCraftBoat(map), false);
  assert.equal(p.craftBoat(map), false);
  assert.match(p.said.at(-1), /already beached/i);
});
