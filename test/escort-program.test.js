// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #111 — FOLLOW / DEFEND braincode. A reprogrammed unit becomes an escort:
// `follow` trails the player and fights nothing; `defend` trails the player and
// engages the enemy nearest them — a melee chassis rams, a shooter fires. The
// escort never treats the player as prey (its intent is never `hunt`), so it is
// a bodyguard, not a threat. These pin the language layer (the words are valid
// intents, and the [feet, fire] pair still parses) and the behaviour (it closes
// on the player, damages an aggressor, and never hits the player itself).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateRobots } from '../src/game/robots.js';
import { decide } from '../src/game/ai_ml.js';

const SENSE = {
  charge: 90, integrity: 100, range: 5, home_range: 4, threat: true, hurt: false,
  linked: true, sight: true, armed: true, shielded: false, contact: false, lost_for: 0,
};

// A walkable, level, unobstructed map with clear sight everywhere.
const escMap = () => ({
  w: 64, h: 64, objects: [], heightAt: () => 0, effectiveHeightAt: () => 0,
  floorAt: () => 'grass', isSolid: () => false, isSoft: () => false, isWater: () => false,
  isBlocked: () => false, blocked: () => false, objectAt: () => null, tileAt: () => 0,
  hasLineOfSight: () => true, projectiles: [], sparks: [],
});

// A programmable unit, fully wired for botThink (program/intent/mlT/fault).
const unit = (over = {}) => ({
  type: 't1', x: 10.5, y: 10.5, hp: 100, maxHp: 100, dead: false, fused: false,
  home: { x: 5.5, y: 5.5 }, facing: { x: 1, y: 0 }, animT: 0, battery: 100,
  drained: false, limping: false, reserveSpent: false, aggro: false, friendly: false,
  recharging: false, returning: false, disabledT: 0, knockT: 0, attackTimer: 0,
  noProgressT: 0, wanderTimer: 0, walkPhase: 0, reportT: 0, reportCool: 0,
  program: null, intent: null, fault: null, fireWish: null, mlT: 0, beepT: 0,
  route: null, singing: false, repelledT: 0, spawnT: 0, loseInterestT: 0,
  ...over,
});

// A player that counts the hits it takes, so a test can prove an escort never
// dealt any of them.
const mkPlayer = (over = {}) => {
  let hits = 0;
  return {
    x: 20.5, y: 20.5, invisibleToRobots: false,
    takeDamage() { hits += 1; }, hitsTaken() { return hits; },
    threatEase: () => 1, blockRangedShot: () => null, ...over,
  };
};

test('follow and defend are valid intents; the [feet, fire] pair still parses', () => {
  assert.equal(decide('follow', SENSE).intent, 'follow');
  assert.equal(decide('defend', SENSE).intent, 'defend');
  const p = decide('[defend, fire]', SENSE);
  assert.ok(p.ok, p.fault);
  assert.equal(p.intent, 'defend');
  assert.equal(p.fire, 'fire');
});

test('a follow unit closes on the player and never aggroes or hits them', () => {
  const r = unit({ program: 'follow', x: 10.5, y: 10.5 });
  const player = mkPlayer({ x: 20.5, y: 20.5 });
  const map = escMap();
  const start = Math.hypot(player.x - r.x, player.y - r.y);
  for (let i = 0; i < 240; i++) updateRobots(1 / 60, [r], player, map);
  const end = Math.hypot(player.x - r.x, player.y - r.y);
  assert.ok(end < start - 1, `closed on the player (${start.toFixed(1)} -> ${end.toFixed(1)})`);
  assert.equal(r.intent, 'follow');
  assert.equal(r.aggro, false, 'an escort never hunts the player');
  assert.equal(player.hitsTaken(), 0, 'an escort never strikes the player');
});

test('follow keeps station through a Wi-Fi jam (raw distance, not distTo)', () => {
  // A held Wi-Fi block makes distTo read Infinity to blind hunters; an escort
  // must keep following the player through exactly that.
  const r = unit({ program: 'follow', x: 10.5, y: 10.5 });
  const player = mkPlayer({ x: 20.5, y: 20.5, invisibleToRobots: true });
  const map = escMap();
  const start = Math.hypot(player.x - r.x, player.y - r.y);
  for (let i = 0; i < 240; i++) updateRobots(1 / 60, [r], player, map);
  const end = Math.hypot(player.x - r.x, player.y - r.y);
  assert.ok(end < start - 1, `still followed while jammed (${start.toFixed(1)} -> ${end.toFixed(1)})`);
});

test('a defending melee unit rams the aggressor nearest the player', () => {
  const guard = unit({ program: 'defend', x: 19.0, y: 20.5 });
  const enemy = unit({ type: 't1', program: null, x: 21.5, y: 20.5, aggro: true });
  const player = mkPlayer({ x: 20.5, y: 20.5 });
  const map = escMap();
  const hp0 = enemy.hp;
  for (let i = 0; i < 300; i++) updateRobots(1 / 60, [guard, enemy], player, map);
  assert.ok(enemy.hp < hp0, `the enemy took ram damage (${hp0} -> ${enemy.hp})`);
  assert.equal(guard.aggro, false, 'the guard never hunts the player');
});

test('a defending shooter fires on the aggressor and damages it', () => {
  const guard = unit({ type: 'w4', program: 'defend', x: 15.5, y: 20.5, hp: 60, maxHp: 60 });
  const enemy = unit({ type: 't1', program: null, x: 22.5, y: 20.5, aggro: true });
  const player = mkPlayer({ x: 20.5, y: 20.5 });
  const map = escMap();
  const hp0 = enemy.hp;
  for (let i = 0; i < 300; i++) updateRobots(1 / 60, [guard, enemy], player, map);
  assert.ok(enemy.hp < hp0, `the enemy took bolt damage (${hp0} -> ${enemy.hp})`);
  assert.ok(map.projectiles.length > 0, 'the shooter threw at least one bolt');
});

test('with no aggressor near the player, defend just follows and holds fire', () => {
  const guard = unit({ type: 'w4', program: 'defend', x: 13.5, y: 20.5, hp: 60, maxHp: 60 });
  const player = mkPlayer({ x: 20.5, y: 20.5 });
  const map = escMap();
  const start = Math.hypot(player.x - guard.x, player.y - guard.y);
  for (let i = 0; i < 240; i++) updateRobots(1 / 60, [guard], player, map);
  const end = Math.hypot(player.x - guard.x, player.y - guard.y);
  assert.ok(end < start - 1, 'a quiet defender still keeps station on the player');
  assert.equal(map.projectiles.length, 0, 'no enemy, no fire');
  assert.equal(player.hitsTaken(), 0);
});
