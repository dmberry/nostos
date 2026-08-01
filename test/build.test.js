// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #182 — building in Creative (Hedda's report). The module is pure, so every
// test here is a map, a tile and a tool.
//
// MOST OF THESE ARE REFUSALS, deliberately. What a build tool must not do is
// the whole of the risk: an island whose obelisk has been deleted is an island
// that cannot be finished, and the player who did it will not know why.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameMap } from '../src/game/map.js';
import {
  TOOLS, PROTECTED, toolOf, canBuildAt, applyBuild, BUILD_MAX,
} from '../src/game/build.js';
import { slabs, solidAt } from '../src/game/terrain.js';
import { FLOORS, OBJECTS } from '../src/game/tiles.js';

const mk = () => new GameMap(12, 12, 'grass');

test('every tool names something that exists', () => {
  for (const t of TOOLS) {
    if (t.kind === 'block') assert.ok(FLOORS[t.floor], `${t.key} names a material that does not exist`);
    if (t.kind === 'object') assert.ok(OBJECTS[t.object], `${t.key} names an object that does not exist`);
  }
  assert.ok(TOOLS.length <= 12, 'short enough that the palette never scrolls');
  assert.equal(new Set(TOOLS.map((t) => t.key)).size, TOOLS.length, 'and no duplicate keys');
});

test('an unknown tool is refused, not guessed at', () => {
  assert.equal(toolOf('nonsense'), null);
  assert.equal(applyBuild(mk(), 3, 3, 'nonsense').ok, false);
});

// ---- what it does -----------------------------------------------------------

test('there is no raise and no lower — the ground is not a tool', () => {
  // They were heightmap verbs: they moved the GROUND rather than putting
  // anything on it, and Lower dug into the island, which is a hole in the world
  // by construction (David, 2026-08-16).
  assert.equal(toolOf('raise'), null);
  assert.equal(toolOf('lower'), null);
  assert.equal(applyBuild(mk(), 3, 3, 'raise').ok, false);
});

test('a material tool PLACES A BLOCK — the thing you could not do before', () => {
  // The old behaviour repainted the tile's one floor type, because a tile had
  // one floor type: choosing Stone on a grass hill turned the whole hill to
  // stone (David: "you can only raise - you cannot choose the type of block").
  const m = mk();
  assert.equal(applyBuild(m, 4, 4, 'sand').ok, true);
  assert.equal(m.floorAt(4, 4), 'sand', 'the surface is what you placed');
  assert.equal(m.heightAt(4, 4), 1, 'and the ground is one block higher for it');
  assert.equal(applyBuild(m, 4, 4, 'stone').ok, true, 'stacking a different material is the point');
  assert.equal(m.floorAt(4, 4), 'stone');
  assert.equal(m.heightAt(4, 4), 2);
  // And underneath it, the sand and the grass are still there — which is the
  // whole of what the heightmap could not say.
  const mats = slabs(m.columnAt(4, 4)).map((sl) => sl.mat);
  assert.deepEqual(mats, ['dirt', 'grass', 'sand', 'stone'],
    'the plinth, the ground it was, and the two you put on it');
});

test('a stack cannot be built past the ceiling, measured from its own ground', () => {
  // Six blocks on a hilltop are six blocks, the same as six on a beach — the
  // limit is a height ABOVE the ground, not an absolute level.
  const m = mk();
  m.setHeight(4, 5, 3);                       // a natural rise
  for (let i = 0; i < BUILD_MAX; i++) assert.equal(applyBuild(m, 4, 5, 'stone').ok, true);
  assert.equal(applyBuild(m, 4, 5, 'stone').ok, false, 'and it says so rather than doing nothing');
  assert.equal(m.heightAt(4, 5), 3 + BUILD_MAX);
});

test('placing an object replaces what was there in one click', () => {
  const m = mk();
  applyBuild(m, 5, 5, 'tree');
  assert.equal(m.objectAt(5, 5).type, 'tree');
  const r = applyBuild(m, 5, 5, 'wall');
  assert.equal(r.ok, true);
  assert.equal(m.objectAt(5, 5).type, 'wall');
  assert.equal(m.objects.filter((o) => o.x === 5 && o.y === 5).length, 1,
    'the old one is gone from the list too, not just from the grid');
});

test('break takes the object first, then the block under it', () => {
  // One tool for "get rid of what is here", because that is the only thing a
  // player means by pointing at something and pressing break. The object is
  // what your eye is on, so it goes first.
  const m = mk();
  applyBuild(m, 6, 6, 'stone');            // a block
  applyBuild(m, 6, 6, 'rock');             // and a rock standing on it
  assert.equal(applyBuild(m, 6, 6, 'erase').ok, true);
  assert.equal(m.objectAt(6, 6), null, 'the rock went first');
  assert.equal(m.heightAt(6, 6), 1, 'and the block is still there');
  assert.equal(applyBuild(m, 6, 6, 'erase').ok, true);
  assert.equal(m.heightAt(6, 6), 0, 'now the block');
});

test('THE ISLAND IS NOT YOURS TO DIG: break stops at the ground', () => {
  // The whole point of the Minecraft rule. You can take back every block you
  // put down and not one grain of the island underneath, so there is no way to
  // open a hole in the world.
  const m = mk();
  assert.equal(applyBuild(m, 7, 7, 'erase').ok, false, 'untouched ground is not breakable');
  assert.equal(m.heightAt(7, 7), 0);

  applyBuild(m, 7, 7, 'stone');
  applyBuild(m, 7, 7, 'stone');
  assert.equal(m.heightAt(7, 7), 2);
  for (let i = 0; i < 10; i++) applyBuild(m, 7, 7, 'erase');
  assert.equal(m.heightAt(7, 7), 0, 'back to the ground, and not one step below it');
});

test('the ground it stops at is the ground BEFORE you built, on a hill too', () => {
  const m = mk();
  m.setHeight(8, 3, 4);                     // a natural hilltop
  applyBuild(m, 8, 3, 'boards');
  assert.equal(m.heightAt(8, 3), 5);
  for (let i = 0; i < 10; i++) applyBuild(m, 8, 3, 'erase');
  assert.equal(m.heightAt(8, 3), 4, 'the hill survives; only the plank came off');
});

test('the remembered ground rides the save, or a reload would eat the island', () => {
  const m = mk();
  applyBuild(m, 9, 9, 'stone');
  const packed = { cols: m.packColumns(), bed: m.packBedrock() };
  assert.equal(packed.bed.length, 1, 'one entry per built tile, like the columns');

  const n = mk();
  n.applyColumns(packed.cols);
  n.applyBedrock(packed.bed);
  assert.equal(n.heightAt(9, 9), 1);
  assert.equal(applyBuild(n, 9, 9, 'erase').ok, true, 'your block is still yours to take back');
  assert.equal(applyBuild(n, 9, 9, 'erase').ok, false, 'and the ground under it is still the island');
});

test('a fractional coordinate edits the tile that contains it (#138)', () => {
  const m = mk();
  applyBuild(m, 7.8, 2.1, 'stone');
  assert.equal(m.floorAt(7, 2), 'stone');
});

// ---- what it refuses --------------------------------------------------------

test('the island\'s works cannot be built over', () => {
  // Delete an obelisk and the island stops being completable. Felling a tower
  // is a thing the game supports, through an axe and a consequence; this must
  // not be a second route to it.
  for (const type of PROTECTED) {
    const m = mk();
    m.addObject(type, 2, 2);
    assert.equal(canBuildAt(m, 2, 2).ok, false, `${type} should be protected`);
    assert.equal(applyBuild(m, 2, 2, 'erase').ok, false, `${type} must survive a clear`);
    assert.equal(applyBuild(m, 2, 2, 'raise').ok, false, `${type} must survive a raise`);
    assert.equal(m.objectAt(2, 2).type, type);
  }
});

test('the open sea is not yours to move', () => {
  // Filling the sea in from the beach is a walk to the next island, which is
  // the one thing the whole run is built around not being.
  const m = mk();
  m.setFloor(1, 1, 'sea');
  assert.equal(canBuildAt(m, 1, 1).ok, false);
  assert.equal(applyBuild(m, 1, 1, 'grass').ok, false);
  assert.equal(m.floorAt(1, 1), 'sea');
});

test('a building is not editable', () => {
  const m = mk();
  m.buildings = [{ x0: 3, y0: 3, w: 2, h: 2 }];
  assert.equal(canBuildAt(m, 3, 3).ok, false);
  assert.equal(canBuildAt(m, 5, 5).ok, true, 'and only inside its footprint');
});

test('off the map is refused rather than thrown', () => {
  const m = mk();
  assert.equal(canBuildAt(m, -1, 4).ok, false);
  assert.equal(canBuildAt(m, 99, 4).ok, false);
  assert.doesNotThrow(() => applyBuild(m, 99, 99, 'wall'));
});

test('you cannot bury yourself', () => {
  // Creative deals no damage, so a player sealed inside a wall stands there
  // forever — the one way this mode can strand somebody.
  const m = mk();
  const player = { x: 8.5, y: 8.5 };
  assert.equal(applyBuild(m, 8, 8, 'wall', { player }).ok, false);
  assert.equal(applyBuild(m, 8, 8, 'lotus', { player }).ok, false, 'unknown tools stay refused too');
  assert.equal(applyBuild(m, 9, 8, 'wall', { player }).ok, true, 'the tile beside you is fine');
});

// ---- #186: a block against a face, which is what makes an arch -------------

test('A BLOCK GOES AGAINST A SIDE FACE, AT THAT FACE\'S OWN LEVEL', () => {
  // Placing only ever grew a column upward, so there was no way to put a block
  // at a height with air under it — and without that there are no arches, no
  // doorways, and no bridge you built yourself.
  const m = mk();
  for (let i = 0; i < 3; i++) applyBuild(m, 5, 5, 'stone');   // a pier, top at 3
  assert.equal(m.heightAt(5, 5), 3);

  const r = applyBuild(m, 5, 5, 'stone', { face: 's', z: 3 });
  assert.equal(r.ok, true, r.why);
  assert.deepEqual(r.at, { x: 5, y: 6, z: 3 });
  const col = m.columnAt(5, 6);
  assert.equal(solidAt(col, 3), true, 'the span is up at the pier\'s level');
  assert.equal(solidAt(col, 1), false, 'and there is a doorway under it');
  assert.equal(solidAt(col, 2), false);
});

test('the east face builds east, the south face south', () => {
  const m = mk();
  applyBuild(m, 4, 4, 'stone');
  assert.deepEqual(applyBuild(m, 4, 4, 'stone', { face: 'e', z: 1 }).at, { x: 5, y: 4, z: 1 });
  assert.deepEqual(applyBuild(m, 4, 4, 'stone', { face: 's', z: 1 }).at, { x: 4, y: 5, z: 1 });
});

test('an arch: two piers and a span you can walk under', () => {
  const m = mk();
  for (const x of [3, 6]) for (let i = 0; i < 3; i++) applyBuild(m, x, 3, 'stone');
  // walk the span out from each pier and close it in the middle
  assert.equal(applyBuild(m, 3, 3, 'stone', { face: 'e', z: 3 }).ok, true);   // span onto 4
  assert.equal(applyBuild(m, 4, 3, 'stone', { face: 'e', z: 3 }).ok, true);   // and onto 5, meeting the far pier
  assert.equal(applyBuild(m, 5, 3, 'stone', { face: 'e', z: 3 }).ok, false,
    'the far pier is already there — the arch is closed');
  for (const x of [4, 5]) {
    const col = m.columnAt(x, 3);
    assert.equal(solidAt(col, 3), true, `span at ${x}`);
    assert.equal(solidAt(col, 1), false, `open under ${x}`);
  }
  assert.equal(m.standingHeightAt(4, 3, 0, 1, 2), 0, 'and a two-block walker fits underneath');
});

test('the face rule keeps every rule the top rule had', () => {
  const m = mk();
  applyBuild(m, 7, 7, 'stone');
  assert.equal(applyBuild(m, 7, 7, 'stone', { face: 'e', z: 1 }).ok, true);
  assert.equal(applyBuild(m, 7, 7, 'stone', { face: 'e', z: 1 }).ok, false, 'nothing lands twice');
  // the ceiling is still six above the ground
  assert.equal(applyBuild(m, 7, 7, 'stone', { face: 's', z: BUILD_MAX + 1 }).ok, false);
  // the sea is still not yours to move
  m.setFloor(1, 2, 'sea');
  assert.equal(applyBuild(m, 1, 1, 'stone', { face: 's', z: 1 }).ok, false);
  // and you still cannot close a block over your own head
  const player = { x: 9.5, y: 9.5, footZ: 0 };
  assert.equal(applyBuild(m, 9, 8, 'stone', { face: 's', z: 1, player }).ok, false);
  assert.equal(applyBuild(m, 9, 8, 'stone', { face: 's', z: 5, player }).ok, true, 'but a ceiling well overhead is fine');
});
