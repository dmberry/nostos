// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameMap } from '../src/game/map.js';

// ---- #138: the accessors are total over points ------------------------------
//
// A caller holding an entity's position has a float. Before this, a float index
// read off the end of the backing array and every accessor returned its own
// flavour of "nothing" — no object, not solid, height 0 — for a tile that was
// occupied, solid and raised. #136 (robots printed inside the factory) was one
// instance of it.

function mapWithAWall() {
  const m = new GameMap(8, 8, 'grass');
  m.addObject('wall', 5, 3);
  m.setHeight(5, 3, 4);
  m.setFloor(5, 3, 'road');
  return m;
}

test('a fractional point reads the tile that contains it', () => {
  const m = mapWithAWall();
  for (const [x, y] of [[5, 3], [5.0, 3.0], [5.5, 3.5], [5.99, 3.01]]) {
    assert.equal(m.floorAt(x, y), 'road', `floorAt(${x},${y})`);
    assert.equal(m.heightAt(x, y), 4, `heightAt(${x},${y})`);
    assert.ok(m.objectAt(x, y), `objectAt(${x},${y}) should find the wall`);
    assert.equal(m.isSolid(x, y), true, `isSolid(${x},${y})`);
    assert.equal(m.blocksShot(x, y), true, `blocksShot(${x},${y})`);
  }
});

test('a fractional point one tile over does not read the wall', () => {
  const m = mapWithAWall();
  assert.equal(m.objectAt(4.9, 3.5), null);
  assert.equal(m.isSolid(4.9, 3.5), false);
  assert.equal(m.heightAt(6.0, 3.5), 0);
});

test('out of bounds stays out of bounds for fractions', () => {
  const m = mapWithAWall();
  // -0.5 floors to -1, which is off the map, not tile 0.
  assert.equal(m.isSolid(-0.5, 3), true);
  assert.equal(m.floorAt(-0.5, 3), null);
  assert.equal(m.heightAt(-0.5, 3), 0);
  assert.equal(m.isSolid(7.5, 7.5), false, 'the last tile is still on the map');
  assert.equal(m.isSolid(8.0, 7), true);
});

test('an object placed from a float records its tile, and can be removed', () => {
  const m = new GameMap(8, 8, 'grass');
  const o = m.addObject('rock', 2.7, 6.2);
  assert.deepEqual([o.x, o.y], [2, 6]);
  assert.equal(m.objectAt(2.1, 6.9), o);
  m.removeObject(o);
  assert.equal(m.objectAt(2, 6), null);
});

test('a second object cannot be placed on an occupied tile from a float', () => {
  const m = mapWithAWall();
  assert.equal(m.addObject('rock', 5.4, 3.8), null);
  assert.equal(m.objects.length, 1);
});

test('setFloor and setHeight from a float write the containing tile', () => {
  const m = new GameMap(8, 8, 'grass');
  m.setFloor(1.6, 1.2, 'sand');
  m.setHeight(1.6, 1.2, 3);
  assert.equal(m.floorAt(1, 1), 'sand');
  assert.equal(m.heightAt(1, 1), 3);
});

test('line of sight is blocked by a wall between two float positions', () => {
  const m = mapWithAWall();
  assert.equal(m.hasLineOfSight(3.5, 3.5, 7.5, 3.5), false);
  assert.equal(m.hasLineOfSight(3.5, 6.5, 7.5, 6.5), true);
});
