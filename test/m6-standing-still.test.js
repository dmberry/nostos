// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The M-6, when you stop walking, with trees about.
//
// Reported by David, 2026-08-17: "when I stop moving this causes the M6s to
// glitch... they should not get stuck and glitch. if I stop they can pause or
// attack". The cause was that the guard holds a standoff RING around where it
// last saw you, and the give-up clause for being wedged threw a random half to
// full turn onto the orbit angle. That moves the ring's target to the far side
// of you. Wedged again on the way, it threw again, independently, so it could
// come straight back and do it once more.
//
// It only shows when the player is still, which is why it survived: a moving
// aim point slides the ring off the obstacle long before the seven-second
// timer expires, so in ordinary play the clause almost never fires twice.
//
// These tests stand a player still in a wood and watch what the guard does.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateRobots } from '../src/game/robots.js';

/** Level ground, clear sight, and a belt of trees the guard cannot pass. */
const woodedMap = (isTree) => ({
  w: 64,
  h: 64,
  objects: [],
  heightAt: () => 0,
  effectiveHeightAt: () => 0,
  floorAt: () => 'grass',
  // A tree is SOFT: not a wall, but not passable either until the unstick
  // burst, which is exactly the surface this bug lived on.
  isSoft: (x, y) => isTree(x, y),
  isSolid: (x, y) => isTree(x, y),
  isBlocked: (x, y) => isTree(x, y),
  blocked: (x, y) => isTree(x, y),
  objectAt: () => null,
  tileAt: () => 0,
  isWater: () => false,
  hasLineOfSight: () => true,
  projectiles: [],
  sparks: [],
  groundItems: [],
});

const m6 = (over = {}) => ({
  type: 'm6', x: 14.5, y: 10.5, hp: 100, maxHp: 100, dead: false, fused: false,
  home: { x: 14.5, y: 10.5 }, facing: { x: -1, y: 0 }, animT: 0, battery: 100,
  drained: false, limping: false, reserveSpent: false, aggro: true, friendly: false,
  recharging: false, returning: false, disabledT: 0, knockT: 0, attackTimer: 0,
  noProgressT: 0, wanderTimer: 0, walkPhase: 0, reportT: 0, reportCool: 0,
  program: null, intent: null, fault: null, fireWish: null, mlT: 0, beepT: 0,
  route: null, singing: false, repelledT: 0, spawnT: 0, loseInterestT: 0,
  bumpCooldown: 0, rng: () => 0.5, ...over,
});

const stillPlayer = () => ({
  x: 10.5, y: 10.5, invisibleToRobots: false,
  takeDamage() {}, threatEase: () => 1, blockRangedShot: () => null,
});

/** Run the world forward and return where the guard was on every frame. */
function walk(map, seconds = 30) {
  const r = m6();
  const p = stillPlayer();
  const track = [];
  const dt = 1 / 60;
  for (let i = 0; i < seconds * 60; i++) {
    updateRobots(dt, [r], p, map, { isNight: () => false, hour: 12 });
    track.push({ x: r.x, y: r.y, dir: r.m6OrbitDir, boxed: !!r.m6Boxed });
  }
  return { r, track };
}

/** How many times the path doubles back on itself, frame to frame. */
function reversals(track) {
  let n = 0;
  for (let i = 2; i < track.length; i++) {
    const ax = track[i - 1].x - track[i - 2].x, ay = track[i - 1].y - track[i - 2].y;
    const bx = track[i].x - track[i - 1].x, by = track[i].y - track[i - 1].y;
    if (Math.hypot(ax, ay) < 1e-4 || Math.hypot(bx, by) < 1e-4) continue;
    // dot product below zero means it turned back the way it came
    if (ax * bx + ay * by < 0) n++;
  }
  return n;
}

test('a guard circling a standing player in the open does not judder', () => {
  const { track } = walk(woodedMap(() => false), 30);
  const back = reversals(track);
  assert.ok(back < 60, `path doubles back ${back} times in 30s of open ground`);
});

test('a guard wedged on trees stops throwing itself back and forth', () => {
  // A belt of trees across the ring it wants to hold, so the standoff point is
  // repeatedly unreachable. This is the reported case.
  const belt = (x, y) => Math.floor(y) === 8 && Math.floor(x) >= 6 && Math.floor(x) <= 15;
  const { track } = walk(woodedMap(belt), 40);
  const back = reversals(track);
  assert.ok(back < 120, `path doubles back ${back} times in 40s against a tree belt`);
});

test('the orbit direction is committed to, not redrawn every frame', () => {
  const belt = (x, y) => Math.floor(y) === 8 && Math.floor(x) >= 6 && Math.floor(x) <= 15;
  const { track } = walk(woodedMap(belt), 40);
  let flips = 0;
  for (let i = 1; i < track.length; i++) if (track[i].dir !== track[i - 1].dir) flips++;
  // Reversing is the fix for an obstacle, so some flips are correct. What must
  // not happen is one every few frames.
  assert.ok(flips <= 12, `orbit direction changed ${flips} times in 40s`);
});

test('once it counts itself blocked twice, it closes to arm\u2019s length', () => {
  // NOT driven through terrain. No wood I could build in this harness pinned a
  // guard for the seconds the give-up clause needs: it always found a way along
  // the corridor. That is the clause being rare rather than the fix being
  // wrong, so it is exercised directly.
  //
  // What is asserted is that it REACHES you, not where it parks afterwards.
  // Its place on the ring is seeded per machine now, so the press is at a point
  // on the far side of you as often as the near one, and the run ends with the
  // guard back on its ordinary standoff because arriving is what clears the box.
  const r = m6({ m6Blocked: 2, m6Boxed: true, m6BoxedT: 30 });
  const p = stillPlayer();
  const map = woodedMap(() => false);
  let closest = Infinity;
  for (let i = 0; i < 8 * 60; i++) {
    updateRobots(1 / 60, [r], p, map, { isNight: () => false, hour: 12 });
    closest = Math.min(closest, Math.hypot(r.x - p.x, r.y - p.y));
  }
  assert.ok(closest < 1, `boxed in, it never closed: nearest ${closest.toFixed(1)} tiles`);
  assert.equal(r.m6Boxed, false, 'arriving should have cleared the box');
});

test('a pack of guards fans out instead of standing in one place', () => {
  // The reported fault: every guard took its place on the ring from
  // `swarmAngle ?? 0`, so they all started at the same point and advanced at
  // the same rate, and a pack was one machine with several heads.
  const map = woodedMap(() => false);
  const p = stillPlayer();
  // Distinct generators, as real spawns have. Identical ones would be a
  // different bug and not this one.
  const pack = [0.11, 0.37, 0.62, 0.88].map((v, i) =>
    m6({ x: 14.5 + i * 0.1, y: 10.5, rng: () => v }));
  for (let i = 0; i < 12 * 60; i++) {
    updateRobots(1 / 60, pack, p, map, { isNight: () => false, hour: 12 });
  }
  let closest = Infinity;
  for (let i = 0; i < pack.length; i++) {
    for (let j = i + 1; j < pack.length; j++) {
      closest = Math.min(closest, Math.hypot(pack[i].x - pack[j].x, pack[i].y - pack[j].y));
    }
  }
  assert.ok(closest > 0.9, `two guards ended ${closest.toFixed(2)} tiles apart, which is a stack`);
});

test('the box lets go, so the next obstacle gets the cheap fix first', () => {
  const r = m6({ m6Blocked: 2, m6Boxed: true, m6BoxedT: 0.5 });
  const p = stillPlayer();
  const map = woodedMap(() => false);
  for (let i = 0; i < 3 * 60; i++) {
    updateRobots(1 / 60, [r], p, map, { isNight: () => false, hour: 12 });
  }
  assert.equal(r.m6Boxed, false, 'stayed boxed for good');
  assert.equal(r.m6Blocked, 0, 'kept the count, so it would charge at the next tree');
});
