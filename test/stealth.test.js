// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #179 — STEALTH, for the run that does not want to kill anything.
//
// The only stealth in the game was the Wi-Fi block: a found object with a
// battery that makes you flat invisible while it lasts. Good item, bad system —
// it runs out, and the run that most needs to get past a machine without
// killing it is the run least likely to be carrying one.
//
// So: no key and no item. Tall grass hides you, standing still hides you
// further, sprinting gives you away. The whole thing scales the ONE distance
// every hostile reads, so these tests check the multiplier and then check that
// a real T-1 behaves differently because of it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameMap } from '../src/game/map.js';
import { Player } from '../src/game/player.js';
import { updateRobots } from '../src/game/robots.js';

function field(floor = 'grass') {
  const m = new GameMap(40, 40, floor);
  const p = new Player();
  p.x = 20.5; p.y = 20.5; p.map = m;
  return { m, p };
}

// ---- the multiplier ---------------------------------------------------------

test('walking in the open reads as exactly where you are', () => {
  const { p } = field();
  p.moving = true; p.sprinting = false;
  assert.equal(p.stealthFactor(), 1);
});

test('standing still helps a little; tall grass helps a lot; both help most', () => {
  const { m, p } = field();
  p.moving = true;
  const openWalk = p.stealthFactor();
  p.moving = false;
  const openStill = p.stealthFactor();
  m.setFloor(20, 20, 'tallgrass');
  p.moving = true;
  const grassWalk = p.stealthFactor();
  p.moving = false;
  const grassStill = p.stealthFactor();
  assert.ok(openStill > openWalk, 'holding still is worth something anywhere');
  assert.ok(grassWalk > openStill, 'and cover is worth more than holding still in the open');
  assert.ok(grassStill > grassWalk, 'and holding still IN cover is the best of it');
});

test('sprinting gives you away — you read as closer than you are', () => {
  // The only way the game says out loud that running is loud. Without this,
  // stealth is a thing you switch on and never switch off.
  const { m, p } = field();
  m.setFloor(20, 20, 'tallgrass');
  p.moving = true; p.sprinting = true;
  assert.ok(p.stealthFactor() < 1, 'even in cover');
});

test('the HUD word tracks the state, and says nothing when there is nothing to say', () => {
  const { m, p } = field();
  p.moving = true;
  assert.equal(p.stealthState(), null, 'walking in the open is not a status');
  m.setFloor(20, 20, 'tallgrass');
  assert.equal(p.stealthState().text, 'IN COVER');
  p.moving = false;
  assert.equal(p.stealthState().text, 'HIDDEN');
  p.moving = true; p.sprinting = true;
  assert.equal(p.stealthState().good, false, 'LOUD is a warning, not a boast');
  p.sprinting = false;
  p.invisibleToRobots = true;
  assert.equal(p.stealthState(), null, 'the Wi-Fi block has its own readout; two would fight');
});

// ---- what a machine actually does about it ----------------------------------

// A plain T-1 record, the shape escort-program.test.js uses. Built by hand
// rather than through a spawner so the test says exactly what it is testing:
// a hunter with no program, standing where it is put.
function hunterAt(m, x, y) {
  return {
    type: 't1', x, y, hp: 100, maxHp: 100, dead: false, fused: false,
    home: { x, y }, facing: { x: -1, y: 0 }, animT: 0, battery: 100,
    drained: false, limping: false, reserveSpent: false, aggro: false, friendly: false,
    recharging: false, returning: false, disabledT: 0, knockT: 0, attackTimer: 0,
    noProgressT: 0, wanderTimer: 0, walkPhase: 0, reportT: 0, reportCool: 0,
    program: null, intent: null, fault: null, fireWish: null, mlT: 0, beepT: 0,
    route: null, singing: false, repelledT: 0, spawnT: 0, loseInterestT: 0,
    // Patrol wander wants a generator of its own. Fixed, so the test is the
    // same run every time.
    rng: () => 0.5, patrolX: x, patrolY: y, wanderTarget: null,
  };
}

function runFor(seconds, robots, p, m) {
  for (let i = 0; i < seconds * 60; i++) updateRobots(1 / 60, robots, p, m, null);
}

test('a T-1 that takes an interest in the open leaves you alone in the grass', () => {
  // The claim the whole feature rests on, checked against the real update loop
  // rather than against the multiplier that is supposed to cause it.
  const open = field();
  const rOpen = hunterAt(open.m, 27.5, 20.5);
  open.p.moving = true;
  runFor(2, [rOpen], open.p, open.m);
  assert.equal(rOpen.aggro, true, 'seven tiles across open ground and it has you');

  const cover = field('tallgrass');
  const rCover = hunterAt(cover.m, 27.5, 20.5);
  cover.p.moving = false;                       // holding still in the grass
  runFor(2, [rCover], cover.p, cover.m);
  assert.equal(rCover.aggro, false, 'the same seven tiles, and it walks past');
});

test('cover hides nothing from a machine standing over you', () => {
  // A hunter that has already closed must still be able to land its blow;
  // otherwise the grass is not stealth, it is invulnerability.
  const { m, p } = field('tallgrass');
  const r = hunterAt(m, 21.2, 20.5);
  p.moving = false;
  runFor(2, [r], p, m);
  assert.equal(r.aggro, true, 'it is a tile away — the grass is not a wall');
});
