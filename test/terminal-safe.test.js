// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// JACKED IN, AND STILL BEING HIT (task #92).
//
// The obelisk prints `shield .......... you are hidden while jacked in` on its
// own banner, and one class of machine hit you anyway. The detection plumbing
// was never the fault: `terminalSafe` feeds `invisibleToRobots`, and distTo,
// the sight checks and the acquire checks all honour it. The W1 swarm reads the
// LIVE distance when it strikes, on purpose — a Wi-Fi block confuses sensors
// but a machine already on top of you connects — and a console inherited that
// rule without anyone deciding it should.
//
// So the terminal has its own flag now. A jam is not a shield; a terminal is.
// The fortress guard is exempt, because an access chip is a credential on
// POSEIDON's network and the daemon's household troops are not fooled by one.
//
// Driven through updateRobots against a stub map and player, with each machine
// pinned adjacent so what is under test is the HIT, not the chase.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateRobots } from '../src/game/robots.js';

const CLASSES = ['t1', 't2', 't3', 'w1', 'w2', 'w4', 'm4', 'm5', 'm6'];

const stubMap = () => ({
  w: 64, h: 64,
  inBounds: () => true, isSolid: () => false, heightAt: () => 0, floorAt: () => 'grass',
  objectAt: () => null, addObject: () => {}, removeObject: () => {},
  hasLineOfSight: () => true,
  objectGrid: [], objects: [], projectiles: [], groundItems: [],
});

function stubPlayer({ invisible = false, jackedIn = false } = {}) {
  return {
    x: 10, y: 10, health: 100, hits: [],
    invisibleToRobots: invisible, jackedIn,
    takeDamage(n, src) { this.hits.push([n, src]); },
    threatEase: () => 1, shielded: () => false, isSwine: () => false,
    say: () => {}, detainMode: false, hasItem: () => false, skills: new Set(),
  };
}

// A machine standing right beside the player, aggro'd, mid-attack-phase.
function stubRobot(type, i = 0) {
  let n = 1 + i;
  return {
    type, x: 10.6 + i * 0.05, y: 10.4, hp: 100, maxHp: 100, dead: false, hurt: false,
    facing: { x: 0.35, y: 1 }, aggro: true, stuck: false, returning: false,
    attackTimer: 0, noProgressT: 0, wanderTarget: null, wanderTimer: 0,
    walkPhase: 0, animT: 0, battery: 100, drained: false, recharging: false,
    friendly: false, fused: false, zombie: false, disabledT: 0, scrapPenalty: false,
    workTarget: null, workScanT: 0, chopPulseT: 0, following: false, bumpCooldown: 0,
    spawnT: 0, ubikConfusedT: 0, _confuseHopT: 0, tremor: 0, home: { x: 10, y: 10 },
    losLostT: 0, loseInterestT: 0, repelledT: 0, singing: false, knockT: 0,
    rng: () => ((n = (n * 16807) % 2147483647) / 2147483647),
    w1Phase: 'attack', w1PhaseT: 99, swarmAngle: 0, swarmSpin: 0.1,
    m6Phase: 'attack', m6PhaseT: 99, m5Phase: 'attack', m5PhaseT: 99,
  };
}

// Run a squad next to the player for a few seconds, pinned in place.
function run(player, robots, ticks = 300) {
  const map = stubMap();
  const pinned = robots.map((r) => ({ r, x: r.x, y: r.y }));
  for (let i = 0; i < ticks; i++) {
    for (const p of pinned) { p.r.x = p.x; p.r.y = p.y; }
    updateRobots(1 / 30, robots, player, map);
  }
  return player.hits.length;
}

test('exposed, every armed class lands hits — the harness can draw blood', () => {
  // The control. Without this the test below passes for the wrong reason (a
  // stub that never reaches an attack at all is not evidence of a shield).
  const armed = [];
  for (const type of CLASSES) {
    if (run(stubPlayer(), [stubRobot(type)])) armed.push(type);
  }
  assert.ok(armed.length >= 6, `only ${armed.join(',')} could hit an exposed player`);
  assert.ok(armed.includes('w1'), 'the W1 swarm must be able to hit at all');
});

test('at a terminal, no machine lands a hit', () => {
  // The bug, and the promise on the obelisk's banner.
  const gotThrough = [];
  for (const type of CLASSES) {
    const p = stubPlayer({ invisible: true, jackedIn: true });
    if (run(p, [stubRobot(type)])) gotThrough.push(type);
  }
  assert.deepEqual(gotThrough, [], `these hit you while you were jacked in: ${gotThrough.join(', ')}`);
});

test('a W1 already on top of you cannot connect once you jack in', () => {
  // The case the report was about, and the design decision in it: logging in
  // does NOT make a swarm forget you — it keeps circling — but it cannot land
  // a blow while you are in there, because you cannot move, dodge or swing.
  const swarm = [stubRobot('w1', 0), stubRobot('w1', 1), stubRobot('w1', 2)];
  assert.ok(run(stubPlayer(), swarm.map((r) => ({ ...r }))) > 0, 'a W1 swarm hits an exposed player');

  const jacked = stubPlayer({ invisible: true, jackedIn: true });
  assert.equal(run(jacked, swarm), 0, 'a W1 swarm must not land a hit at a terminal');
  assert.ok(swarm.every((r) => r.aggro), 'and it does not forget you — it is still there when you log out');
});

test('a Wi-Fi block is still not a shield', () => {
  // Unchanged on purpose. The block jams the network, and a W1 that has already
  // triangulated its way on top of you still connects — that is the trade for a
  // jammer you can carry around and swing a bat next to.
  const p = stubPlayer({ invisible: true, jackedIn: false });
  assert.ok(run(p, [stubRobot('w1')]) > 0, 'the block must not have become a shield');
});

test('the fortress guard is not fooled by a network credential', () => {
  // M6 commits only once its pack is up, so this needs a squad. The gate and
  // core terminals stand inside their reach on purpose: an access chip is a
  // credential on POSEIDON's network, not on the daemon's household troops.
  const pack = [stubRobot('m6', 0), stubRobot('m6', 1), stubRobot('m6', 2), stubRobot('m6', 3)];
  const jacked = stubPlayer({ invisible: true, jackedIn: true });
  assert.ok(run(jacked, pack) > 0, 'an M6 pack must still reach you at the core terminal');
});

test('a swarm that lost you does not re-acquire through a jam or a console', () => {
  // The acquire check read a raw distance rather than distTo, so a W1 that had
  // given up picked you straight back up the moment its cooldown expired.
  for (const flags of [{ invisible: true }, { invisible: true, jackedIn: true }]) {
    const r = stubRobot('w1');
    r.aggro = false; r.loseInterestT = 0;
    run(stubPlayer(flags), [r], 60);
    assert.equal(r.aggro, false, `re-acquired through ${JSON.stringify(flags)}`);
  }
  // ...but it does re-acquire someone standing there in the open.
  const seen = stubRobot('w1');
  seen.aggro = false; seen.loseInterestT = 0;
  run(stubPlayer(), [seen], 60);
  assert.equal(seen.aggro, true, 'an exposed player must still be picked up');
});
