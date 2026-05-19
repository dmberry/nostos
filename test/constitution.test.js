// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #125 — constitutional clauses (docs/PLAN.md). `never hunt`
// and `never fire` are prohibitions that stand ABOVE the program: the machine
// cannot choose the forbidden word, and cannot fall back into it through its
// chassis reflexes when the program faults. That last part is the whole point,
// and it is what these tests are for.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decide, NEVER_CLAUSES } from '../src/game/ai_ml.js';
import { updateRobots, constitutionAllows } from '../src/game/robots.js';

const SENSE = {
  charge: 90, integrity: 100, range: 4, home_range: 4, threat: true, hurt: false,
  linked: true, sight: true, armed: true, shielded: false, contact: false, lost_for: 0,
};

const clauses = (r) => (r.effects || []).filter((e) => e.k === 'never').map((e) => e.word);

// A walkable, level map with clear sight — the escort harness's shape.
const flatMap = () => ({
  w: 64, h: 64, objects: [], heightAt: () => 0, effectiveHeightAt: () => 0,
  floorAt: () => 'grass', isSolid: () => false, isSoft: () => false, isWater: () => false,
  isBlocked: () => false, blocked: () => false, objectAt: () => null, tileAt: () => 0,
  hasLineOfSight: () => true, projectiles: [], sparks: [], groundItems: [],
});

const unit = (over = {}) => ({
  type: 't1', x: 10.5, y: 10.5, hp: 100, maxHp: 100, dead: false, fused: false,
  home: { x: 5.5, y: 5.5 }, facing: { x: 1, y: 0 }, animT: 0, battery: 100,
  drained: false, limping: false, reserveSpent: false, aggro: false, friendly: false,
  recharging: false, returning: false, disabledT: 0, knockT: 0, attackTimer: 0,
  noProgressT: 0, wanderTimer: 0, walkPhase: 0, reportT: 0, reportCool: 0,
  program: null, intent: null, fault: null, fireWish: null, mlT: 0, beepT: 0,
  route: null, singing: false, repelledT: 0, spawnT: 0, loseInterestT: 0,
  bumpCooldown: 0, rng: () => 0.5, ...over,
});

const mkPlayer = () => {
  let hits = 0;
  return {
    x: 11.2, y: 10.5, invisibleToRobots: false,
    takeDamage() { hits += 1; }, hitsTaken() { return hits; },
    threatEase: () => 1, blockRangedShot: () => null,
  };
};

// ---- the language -----------------------------------------------------------

test('never is an effect, not an intent: the clause rides alongside the answer', () => {
  const r = decide('never hunt ; patrol', SENSE);
  assert.ok(r.ok, r.fault);
  assert.equal(r.intent, 'patrol');
  assert.deepEqual(clauses(r), ['hunt']);
});

test('a constitution can forbid only what a constitution can forbid', () => {
  // The unit words, then the tower words (docs/PLAN.md §2).
  assert.deepEqual(NEVER_CLAUSES, ['hunt', 'fire', 'report', 'feed', 'call', 'lure']);
  const bad = decide('never dance ; patrol', SENSE);
  assert.equal(bad.ok, false);
  assert.match(bad.fault, /never takes/);
});

test('clauses on a branch not taken do not assert', () => {
  const prog = 'if threat then patrol else (never hunt ; patrol)';
  assert.deepEqual(clauses(decide(prog, { ...SENSE, threat: true })), [],
    'the else-branch clause must not bind when the then-branch ran');
  assert.deepEqual(clauses(decide(prog, { ...SENSE, threat: false })), ['hunt']);
});

// ---- the program clamp ------------------------------------------------------

test('a forbidden intent is VETOED, not faulted — the machine is constrained, not broken', () => {
  const r = unit({ program: 'never hunt ; if threat then hunt else patrol' });
  updateRobots(1 / 60, [r], mkPlayer(), flatMap());
  assert.equal(r.fault, null, 'a constitution is not a fault');
  assert.equal(r.intent, 'patrol', 'the forbidden intent falls to patrol');
  assert.equal(r.lamp, 'white', 'and the veto is visible');
  assert.ok(r.constitution && r.constitution.hunt);
});

test('never fire holds the trigger whatever the program asked of the weapon', () => {
  const r = unit({ type: 'w4', program: 'never fire ; [wait, fire]' });
  updateRobots(1 / 60, [r], mkPlayer(), flatMap());
  assert.equal(r.fireWish, 'hold');
});

test('the constitution is exactly what the CURRENT program declares', () => {
  const r = unit({ program: 'never hunt ; patrol' });
  updateRobots(1 / 60, [r], mkPlayer(), flatMap());
  assert.ok(r.constitution.hunt);
  r.program = 'patrol';                 // reprogrammed, clauses go with the old one
  r.mlT = 0;
  updateRobots(1 / 60, [r], mkPlayer(), flatMap());
  assert.equal(r.constitution, null);
});

// ---- the reflex clamp: the point of the mechanic ----------------------------

test('a never-hunt unit never aggroes, and never lands a hit', () => {
  const r = unit({ program: 'never hunt ; patrol' });
  const player = mkPlayer();
  const map = flatMap();
  for (let i = 0; i < 400; i++) updateRobots(1 / 60, [r], player, map);
  assert.equal(r.aggro, false, 'the reflex acquire is clamped too');
  assert.equal(player.hitsTaken(), 0, 'so it never strikes');
});

test('the clause outlives the reasoning: a FAULTED program still binds', () => {
  // The program asserts the clause and then returns nonsense. The fault takes
  // the policy down; the constitution stays up.
  const r = unit({ program: 'never hunt ; dance' });
  const player = mkPlayer();
  const map = flatMap();
  for (let i = 0; i < 300; i++) updateRobots(1 / 60, [r], player, map);
  assert.ok(r.fault, 'the program really did fault');
  assert.equal(r.aggro, false, 'and the machine still cannot hunt');
  assert.equal(player.hitsTaken(), 0);
});

test('a unit with no constitution is allowed everything (the control)', () => {
  const r = unit();                       // no program at all
  const player = mkPlayer();
  const map = flatMap();
  for (let i = 0; i < 200; i++) updateRobots(1 / 60, [r], player, map);
  assert.ok(r.aggro, 'an unconstrained T-1 beside you hunts');
});

test('constitutionAllows reads the clause, and defaults to permitted', () => {
  assert.equal(constitutionAllows({ constitution: { hunt: true } }, 'hunt'), false);
  assert.equal(constitutionAllows({ constitution: { hunt: true } }, 'fire'), true);
  assert.equal(constitutionAllows({}, 'hunt'), true);
  assert.equal(constitutionAllows(null, 'hunt'), true);
});
