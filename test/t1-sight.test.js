// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// A T-1 IS A PATROLLER AND A T-1w IS A HUNTER, and until now they were the same
// machine with different numbers: both acquired you at their full range through
// solid walls. A T-1 also chases at 5.0 against a 4.2 walk, so it could take an
// interest from nine tiles away through a building and then out-walk you to it
// (David, 2026-08-15: "T1 seems to be too aggressive now" and "T1 and T1w should
// be different").
//
// The difference is now behavioural: cover breaks a T-1's ACQUISITION. It does
// not break its chase — once it has you it comes on to `deaggro` as before —
// because a machine that forgets you the moment you step behind a rock is not
// frightening, it is a puzzle piece.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnT1w, updateRobots } from '../src/game/robots.js';

const mkMap = (canSee) => ({
  w: 64, h: 64, objects: [], groundItems: [], projectiles: [], sparks: [],
  heightAt: () => 0, effectiveHeightAt: () => 0, floorAt: () => 'grass',
  isSolid: () => false, isSoft: () => false, isWater: () => false,
  isBlocked: () => false, blocked: () => false, objectAt: () => null,
  tileAt: () => 0, hasLineOfSight: () => canSee, addObject() {}, setFloor() {},
});
const mkPlayer = () => ({
  x: 22, y: 20, invisibleToRobots: false,
  takeDamage() {}, threatEase: () => 1, blockRangedShot: () => null, say() {},
});

/** A T-1 (not the swarm variant), stood two tiles from the player. */
function t1(map) {
  const r = spawnT1w(map, 1234, 20, 20);
  r.type = 't1';           // the same chassis; the tune table is what differs
  r.program = null;        // no posted program: the reflex path is what is under test
  r.aggro = false;
  r.x = 20; r.y = 20;
  return r;
}

test('a T-1 in the open notices you', () => {
  const map = mkMap(true);
  const r = t1(map);
  const player = mkPlayer();
  for (let i = 0; i < 30; i++) updateRobots(1 / 60, [r], player, map);
  assert.equal(r.aggro, true, 'two tiles away, in plain sight');
});

test('a T-1 behind a wall does not', () => {
  const map = mkMap(false);          // nothing has a line to anything
  const r = t1(map);
  const player = mkPlayer();
  for (let i = 0; i < 60; i++) updateRobots(1 / 60, [r], player, map);
  assert.equal(r.aggro, false, 'cover breaks the acquisition');
});

test('the swarm does not care about walls: it was printed knowing', () => {
  const map = mkMap(false);
  const w = spawnT1w(map, 99, 20, 20);
  w.program = null; w.aggro = false; w.x = 20; w.y = 20;
  const player = mkPlayer();
  for (let i = 0; i < 30; i++) updateRobots(1 / 60, [w], player, map);
  assert.equal(w.aggro, true, 'a T-1w finds you through cover — that is what it is for');
});

test('cover breaks the acquisition, not the chase', () => {
  // It sees you, commits, and then you get behind something. It keeps coming.
  const map = mkMap(true);
  const r = t1(map);
  const player = mkPlayer();
  for (let i = 0; i < 30; i++) updateRobots(1 / 60, [r], player, map);
  assert.equal(r.aggro, true);
  map.hasLineOfSight = () => false;        // you break the line
  for (let i = 0; i < 60; i++) updateRobots(1 / 60, [r], player, map);
  assert.equal(r.aggro, true, 'a machine that forgets you behind a rock is a puzzle piece');
});

// ---- An escort in the way wears the blow ----------------------------------
// Nothing in the game could damage one of your own units. A hostile's strike
// only ever aimed at the player, so a follower could be chipped by BUMPING —
// one point on a 2.5s cooldown — and nothing else. Its health bar was reading
// the truth: it was not being hurt.

test('a hostile strikes the escort standing in its reach, not through it', () => {
  const map = mkMap(true);
  const r = t1(map);
  const player = mkPlayer();
  player.x = 30; player.y = 30;            // well out of reach
  // One of yours, right up against the hostile.
  const mine = spawnT1w(map, 7, 20, 20);
  mine.type = 'w4'; mine.friendly = true; mine.fault = null;
  mine.program = 'follow'; mine.intent = 'follow';
  mine.x = 20.3; mine.y = 20;
  const hp0 = mine.hp;
  r.aggro = true;
  for (let i = 0; i < 4 * 60; i++) {
    mine.x = 20.3; mine.y = 20; mine.intent = 'follow';
    r.x = 20; r.y = 20;
    updateRobots(1 / 60, [r, mine], player, map);
  }
  assert.ok(mine.hp < hp0, 'your machine wore the blow that was meant for you');
});

test('with nothing in the way the blow still goes to the player', () => {
  const map = mkMap(true);
  const r = t1(map);
  let hits = 0;
  const player = { ...mkPlayer(), x: 20.4, y: 20, takeDamage() { hits++; } };
  r.aggro = true;
  for (let i = 0; i < 4 * 60; i++) { r.x = 20; r.y = 20; updateRobots(1 / 60, [r], player, map); }
  assert.ok(hits > 0, 'an escort screen is a screen, not a redirect that never ends');
});
