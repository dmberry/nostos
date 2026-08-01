// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #189 — a swarm that is aware of itself.
//
// David, 2026-08-17: "T1w should not crash into each other. They are aware of
// each other and work together as a swarm.. if they bump they can pause with no
// damage... otherwise they just destroy each other in seconds..."
//
// Driven through the real `updateRobots` on a real map, because the bug lived
// in the interaction between three things — the chase, the separation pass and
// the bump rule — and a test of any one of them in isolation would have passed
// while the pack still wiped itself out.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameMap } from '../src/game/map.js';
import { updateRobots, spawnGuard } from '../src/game/robots.js';
import { pushBlock, pushGap } from '../src/game/terrain.js';

const flatMap = () => {
  const m = new GameMap(40, 40, 'grass');
  m.buildings = [];
  return m;
};

const stubPlayer = (x, y) => ({
  x, y, z: 0, footZ: 0, health: 100, maxHealth: 100,
  hasItem: () => false, isSwine: () => false,
  threatEase: () => 1, drainField: () => false,
  takeDamage() {}, say() {}, addScore() {},
  stealthFactor: () => 1,
});

/** A pack of `n` wheeled hunters, dropped almost on top of each other. */
function pack(map, n, cx, cy) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = spawnGuard(map, 1000 + i * 37, cx, cy, 't1w', { x: cx, y: cy });
    if (!r) continue;
    r.spawnT = 0;             // already materialised; we are testing the walk
    r.x = cx + (i % 3) * 0.12; // deliberately inside the separation floor
    r.y = cy + Math.floor(i / 3) * 0.12;
    r.aggro = true;
    out.push(r);
  }
  return out;
}

const run = (robots, map, player, seconds = 3, dt = 1 / 30) => {
  for (let t = 0; t < seconds; t += dt) updateRobots(dt, robots, player, map, null);
};

test('A PACK DOES NOT WIPE ITSELF OUT ON THE WALK IN', () => {
  // The report, exactly: six machines converging on one point used to chip each
  // other 1 HP at a time until the player had nothing left to fight.
  const map = flatMap();
  const player = stubPlayer(20, 20);
  const swarm = pack(map, 6, 14, 14);
  assert.ok(swarm.length >= 4, 'the fixture needs a pack to be a test');
  const before = swarm.map((r) => r.hp);
  run(swarm, map, player, 4);
  for (let i = 0; i < swarm.length; i++) {
    assert.equal(swarm[i].hp, before[i], `unit ${i} lost HP to its own side`);
    assert.ok(!swarm[i].dead, `unit ${i} died on the walk in`);
  }
});

test('and it spreads out rather than piling up', () => {
  const map = flatMap();
  const player = stubPlayer(20, 20);
  const swarm = pack(map, 6, 14, 14);
  run(swarm, map, player, 4);
  let closest = Infinity;
  for (let i = 0; i < swarm.length; i++) {
    for (let j = i + 1; j < swarm.length; j++) {
      closest = Math.min(closest, Math.hypot(swarm[i].x - swarm[j].x, swarm[i].y - swarm[j].y));
    }
  }
  assert.ok(closest > 0.5, `two machines ended ${closest.toFixed(2)} tiles apart`);
});

test('a bump between its own costs a beat, not a wound', () => {
  const map = flatMap();
  const player = stubPlayer(20, 20);
  const swarm = pack(map, 2, 14, 14);
  swarm[0].x = 14; swarm[0].y = 14;
  swarm[1].x = 14.05; swarm[1].y = 14;   // overlapping, so the pass must fire
  updateRobots(1 / 30, swarm, player, map, null);
  assert.ok(swarm[0].yieldT > 0 || swarm[1].yieldT > 0, 'a same-side bump yields');
  assert.equal(swarm[0].hp, swarm[0].maxHp ?? swarm[0].hp, 'and takes nothing off');
});

test('BUT A CONVERTED UNIT AND AN ESTATE ONE STILL FIGHT', () => {
  // The exemption is "same side", not "any two machines". Two units genuinely
  // on opposite sides shouldering each other is a fight, and it should cost.
  const map = flatMap();
  const player = stubPlayer(20, 20);
  const two = pack(map, 2, 14, 14);
  two[0].intent = 'follow';   // yours
  two[0].program = 'x'; two[0].fault = false;
  two[1].x = two[0].x + 0.05; two[1].y = two[0].y;
  const hp0 = two[0].hp, hp1 = two[1].hp;
  updateRobots(1 / 30, two, player, map, null);
  assert.ok(two[0].hp < hp0 || two[1].hp < hp1, 'opposite sides still chip each other');
});

// ---- #188: the machines read columns ---------------------------------------

test('A WALKER GOES UNDER A DECK INSTEAD OF BEING WALLED IN BY IT', () => {
  // `heightAt` answers with the top of the column, so a machine standing under
  // a walkway read the DECK as the ground and found itself three levels below
  // where the map said it was — a wall it can neither see nor get round. The
  // player has walked on `standingHeightAt` since the terrain rewrite; this is
  // the half the machines never got.
  const map = flatMap();
  // a covered run: ground at 0, a deck at 3 with air between
  for (let x = 16; x <= 22; x++) {
    const col = map.editColumn(x, 14);
    pushGap(col, 2);
    pushBlock(col, 'boards');
    map.setColumn(x, 14, col);
    assert.equal(map.heightAt(x, 14), 3, 'the flat height is the deck, three levels up');
  }
  const player = stubPlayer(24, 14);
  const [m] = pack(map, 1, 14, 14);
  m.type = 'm6';                 // a walker, so the T2 height rule applies
  m.footZ = 0;
  const before = m.x;
  run([m], map, player, 6);
  assert.ok(m.x > before + 2, `it only reached ${m.x.toFixed(1)} from ${before.toFixed(1)}`);
  assert.equal(m.footZ, 0, 'and it is still on the ground, not up on the deck');
});

test('a wheeled unit still refuses to climb, columns or not', () => {
  // A long wall it cannot get round inside the test, so the only way through is
  // over — which a wheeled wedge may never do, whatever the column says.
  const map = flatMap();
  for (let y = 0; y < 40; y++) for (let i = 0; i < 3; i++) {
    const col = map.editColumn(18, y);
    pushBlock(col, 'stone');
    map.setColumn(18, y, col);
  }
  const player = stubPlayer(24, 14);
  const [t] = pack(map, 1, 14, 14);
  t.footZ = 0;
  run([t], map, player, 5);
  assert.ok(t.x < 18, `a T-1 climbed a three-block wall to ${t.x.toFixed(1)}`);
  assert.equal(t.footZ, 0, 'and never got up on top of it');
});
