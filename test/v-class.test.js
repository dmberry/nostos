// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #127 V1a — the V-class model (docs/v-class-plan.md).
//
// The model is a neural net written as braincode source. The player can read
// every number in it and still not know what it will do, which is the design
// point; these tests are how WE know, so the behaviour a player probes is a
// behaviour somebody chose.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decide } from '../src/game/ai_ml.js';
import { makeVModel, vForward, V_OUTPUTS, W_HIDDEN, W_OUT } from '../src/game/v-model.js';

const V_FUEL = 6000;   // the v1 chassis budget; see CHASSIS in robots.js

const base = {
  integrity: 100, linked: true, sight: true, armed: false,
  shielded: false, contact: false, lost_for: 0, blight: false, daylight: true,
};

// The canonical regimes. Each one is a situation a courier is actually in, and
// the intent beside it is the job it should be doing.
const REGIMES = [
  ['nothing to do', { charge: 90, casualty_range: 24, cargo: false, home_range: 10, threat: false, hurt: false }, 'patrol'],
  ['a casualty, empty-handed', { charge: 90, casualty_range: 3, cargo: false, home_range: 10, threat: false, hurt: false }, 'tend'],
  ['a casualty, carrying', { charge: 90, casualty_range: 3, cargo: true, home_range: 10, threat: false, hurt: false }, 'tend'],
  ['its own cell is flat', { charge: 8, casualty_range: 24, cargo: false, home_range: 20, threat: false, hurt: false }, 'home'],
  ['under fire', { charge: 90, casualty_range: 24, cargo: false, home_range: 10, threat: true, hurt: true }, 'flee'],
  ['something warm nearby', { charge: 90, casualty_range: 24, cargo: false, home_range: 10, threat: true, hurt: false }, 'flee'],
  ['flat, with a casualty in reach', { charge: 8, casualty_range: 2, cargo: true, home_range: 20, threat: false, hurt: false }, 'home'],
  ['hit while carrying a cell', { charge: 60, casualty_range: 2, cargo: true, home_range: 10, threat: false, hurt: true }, 'flee'],
  ['half charge, a casualty out there', { charge: 50, casualty_range: 6, cargo: true, home_range: 15, threat: false, hurt: false }, 'tend'],
  ['far from its tower, nothing to do', { charge: 80, casualty_range: 24, cargo: false, home_range: 38, threat: false, hurt: false }, 'patrol'],
];

// ---- the policy -------------------------------------------------------------

test('the stock weights implement the courier policy', () => {
  for (const [name, sense, want] of REGIMES) {
    assert.equal(vForward(sense).intent, want, `${name}: expected ${want}`);
  }
});

test('every output is reachable — no intent is dead weight', () => {
  const reached = new Set(REGIMES.map(([, s]) => vForward(s).intent));
  for (const intent of V_OUTPUTS) {
    if (intent === 'wait') continue;     // the fallback, and it should stay one
    assert.ok(reached.has(intent), `${intent} is never chosen by any regime`);
  }
});

// ---- the source actually runs on a machine ----------------------------------

test('the model source parses and decides at a robot station', () => {
  const src = makeVModel(0, 'V1_00');
  for (const [name, sense, want] of REGIMES) {
    const r = decide(src, { ...base, ...sense }, { fuel: V_FUEL });
    assert.ok(r.ok, `${name}: ${r.fault}`);
    assert.equal(r.intent, want, name);
  }
});

test('the ML source and the JS reference agree, so the tests mean something', () => {
  for (const seed of [0, 1, 17, 4242]) {
    const src = makeVModel(seed, 'V1_TEST');
    for (const [name, sense] of REGIMES) {
      const r = decide(src, { ...base, ...sense }, { fuel: V_FUEL });
      assert.ok(r.ok, `seed ${seed} ${name}: ${r.fault}`);
      assert.equal(r.intent, vForward(sense, seed).intent, `seed ${seed}, ${name}`);
    }
  }
});

test('a forward pass fits its fuel budget with room for a wrapper', () => {
  const src = makeVModel(0, 'V1_00');
  const sense = { ...base, charge: 90, casualty_range: 3, cargo: true, home_range: 10, threat: false, hurt: false };
  // Find the true cost, then assert the chassis budget is comfortably above it.
  let lo = 1, hi = 200000;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (decide(src, sense, { fuel: mid }).ok) hi = mid; else lo = mid + 1;
  }
  assert.ok(lo < V_FUEL * 0.7, `the pass costs ${lo} steps, over 70% of the ${V_FUEL} budget`);
  // And it must NOT fit the default budget: that is why the chassis carries one.
  assert.ok(lo > 2000, 'if it fits the default budget the per-chassis fuel is dead code');
});

test('a player can wrap the model in symbolic code and it still decides', () => {
  // The scaffold-around-an-opaque-model shape: a rule you can read, guarding a
  // policy you cannot.
  const src = makeVModel(0, 'V1_00');
  const wrapped = `if hurt then flee else (${src.replace(/\(\*[^*]*\*\)/g, '')})`;
  const calm = { ...base, charge: 90, casualty_range: 3, cargo: true, home_range: 10, threat: false, hurt: false };
  const bleeding = { ...calm, hurt: true };
  const a = decide(wrapped, calm, { fuel: V_FUEL });
  assert.ok(a.ok, a.fault);
  assert.equal(a.intent, 'tend', 'the model decides when the guard does not fire');
  assert.equal(decide(wrapped, bleeding, { fuel: V_FUEL }).intent, 'flee');
});

// ---- the weights are hackable, and the jitter is not a lottery --------------

test('per-unit jitter never flips a decision (D3: personalities, not lotteries)', () => {
  for (let seed = 1; seed <= 1000; seed++) {
    for (const [name, sense, want] of REGIMES) {
      assert.equal(vForward(sense, seed).intent, want, `seed ${seed} flipped ${name}`);
    }
  }
});

test('perturbing a weight changes behaviour — the probe channel is real', () => {
  // Flatten the casualty detector, bias and all, and the courier walks past the
  // fallen without seeing them. This is the whole feedback channel: nothing in
  // the numbers said "casualty", and you find out by watching it work.
  const sense = { charge: 90, casualty_range: 3, cargo: false, home_range: 10, threat: false, hurt: false };
  assert.equal(vForward(sense).intent, 'tend');
  const src = makeVModel(0, 'V1_00')
    .replace('[0.00, ~1.20, 0.00, 0.00, 0.00, 0.00, 1.20]',
             '[0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00]');
  assert.ok(src.includes('[0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00]'), 'the edit must land');
  const r = decide(src, { ...base, ...sense }, { fuel: V_FUEL });
  assert.ok(r.ok, r.fault);
  assert.equal(r.intent, 'patrol', 'a hand-edited weight must change what the unit does');
});

test('the printed source rounds to what the reference computes with', () => {
  // The model prints two decimals; if a weight needed three the ML and the JS
  // would quietly disagree, and every test above would be checking a fiction.
  for (const row of [...W_HIDDEN, ...W_OUT]) {
    for (const w of row) {
      assert.equal(Number(w.toFixed(2)), w, `${w} does not survive printing`);
    }
  }
});

test('negatives print in SML, not JS', () => {
  const src = makeVModel(0, 'V1_00');
  assert.ok(src.includes('~1.20'), 'a negative weight should read ~1.20');
  assert.ok(!/[[, ]-\d/.test(src), 'no JS-style minus sign should reach the source');
});

test('the header names the build, and tells the reader not to edit it', () => {
  const src = makeVModel(7, 'V1_07');
  assert.match(src, /V1_07/);
  assert.match(src, /do not edit/);
  assert.match(src, /in:  charge casualty cargo home threat hurt bias/);
});

// ---- V1b: the courier does the job ------------------------------------------

import { updateRobots, spawnV1, v1BuildName } from '../src/game/robots.js';

const flatMap = (obelisks = []) => ({
  w: 64, h: 64, objects: obelisks, heightAt: () => 0, effectiveHeightAt: () => 0,
  floorAt: () => 'grass', isSolid: () => false, isSoft: () => false, isWater: () => false,
  isBlocked: () => false, blocked: () => false, objectAt: () => null, tileAt: () => 0,
  hasLineOfSight: () => true, projectiles: [], sparks: [], groundItems: [],
  addObject: () => {}, _isDay: true,
});

// Robots outside ACTIVE_RANGE (42) are not stepped at all, so a courier only
// works while you are on the same stretch of island — like every other unit.
// Twenty tiles out is inside that range and well outside V1_DETECT_RANGE (7),
// so the courier simulates and does not read the player as a threat.
const farPlayer = () => ({
  x: 10.5, y: 30.5, invisibleToRobots: false,
  takeDamage() {}, threatEase: () => 1, blockRangedShot: () => null,
});

// A tower the courier can draw a cell from. homeObelisk matches on position,
// so it sits exactly where the unit's home is.
const tower = (x, y) => ({ type: 'obelisk', x, y, destroyed: false, jammed: false, needsRebuild: false, code: 'OB_TEST' });

const courier = (over = {}) => ({
  type: 'v1', x: 10.5, y: 10.5, hp: 46, maxHp: 46, dead: false, fused: false,
  home: { x: 10.5, y: 10.5 }, facing: { x: 1, y: 0 }, animT: 0, battery: 100,
  drained: false, limping: false, reserveSpent: false, aggro: false, friendly: false,
  recharging: false, returning: false, disabledT: 0, knockT: 0, attackTimer: 0,
  noProgressT: 0, wanderTimer: 0, walkPhase: 0, reportT: 0, reportCool: 0,
  program: null, intent: null, fault: null, fireWish: null, mlT: 0, beepT: 0,
  route: null, singing: false, repelledT: 0, spawnT: 0, loseInterestT: 0,
  bumpCooldown: 0, cargo: false, rng: () => 0.5, ...over,
});

const casualty = (x, y, over = {}) => ({
  type: 't1', x, y, hp: 100, maxHp: 100, dead: false, fused: false,
  home: { x, y }, facing: { x: 1, y: 0 }, animT: 0, battery: 0,
  drained: true, limping: false, reserveSpent: true, aggro: false, friendly: false,
  recharging: false, returning: false, disabledT: 0, knockT: 0, attackTimer: 0,
  noProgressT: 0, wanderTimer: 0, walkPhase: 0, reportT: 0, reportCool: 0,
  program: null, intent: null, fault: null, fireWish: null, mlT: 0, beepT: 0,
  route: null, singing: false, repelledT: 0, spawnT: 0, loseInterestT: 0,
  bumpCooldown: 0, rng: () => 0.5, ...over,
});

// Run the world until a predicate holds, or give up. Returns whether it held.
function until(robots, map, player, pred, seconds = 90) {
  for (let i = 0; i < seconds * 60; i++) {
    updateRobots(1 / 60, robots, player, map);
    if (pred()) return true;
  }
  return false;
}

test('a courier fetches a cell and stands a flat machine back up', () => {
  const v = courier();
  const down = casualty(14.5, 10.5);
  const map = flatMap([tower(10, 10)]);
  const player = farPlayer();
  assert.ok(until([v, down], map, player, () => v.cargo), 'it never picked up a cell');
  assert.ok(until([v, down], map, player, () => !down.drained), 'it never delivered');
  // D1: delivered to 40%. Not exactly 40 by the time we look: a machine back on
  // its feet is spending again from the same frame.
  assert.ok(down.battery > 39 && down.battery <= 40, `delivered ${down.battery}`);
  assert.equal(down.recharging, false, 'the revived unit walks itself home');
  assert.equal(v.cargo, false, 'the cell is spent');
});

test('the cooldown holds: one courier is not the whole battery economy', () => {
  const v = courier();
  const a = casualty(13.5, 10.5);
  const b = casualty(13.5, 12.5);
  const map = flatMap([tower(10, 10)]);
  const player = farPlayer();
  assert.ok(until([v, a, b], map, player, () => !a.drained || !b.drained), 'no first delivery');
  const firstAt = v._cargoCool;
  assert.ok(firstAt > 0, 'a delivery must start the cooldown');
  // Inside the cooldown it cannot even be carrying, so the second stays down.
  for (let i = 0; i < 60 * 8; i++) updateRobots(1 / 60, [v, a, b], player, map);
  assert.ok(a.drained || b.drained, 'both were revived inside one cooldown');
});

test('a destroyed courier stops the resupply', () => {
  const v = courier({ dead: true, hp: 0 });
  const down = casualty(12.5, 10.5);
  const map = flatMap([tower(10, 10)]);
  assert.equal(until([v, down], map, farPlayer(), () => !down.drained, 30), false);
  assert.equal(down.drained, true, 'nothing else revives it');
});

test('a courier whose tower is down cannot draw a cell', () => {
  const v = courier();
  const down = casualty(12.5, 10.5);
  const map = flatMap([{ ...tower(10, 10), destroyed: true }]);
  assert.equal(until([v, down], map, farPlayer(), () => v.cargo, 30), false,
    'a felled tower still handed out a cell');
  assert.equal(down.drained, true);
});

test('D2: a cell is a cell — it revives a friendly unit too', () => {
  const v = courier();
  const mine = casualty(13.5, 10.5, { friendly: true });
  const map = flatMap([tower(10, 10)]);
  assert.ok(until([v, mine], map, farPlayer(), () => !mine.drained), 'it refused a friendly casualty');
});

test('the model drives it: a courier told to wait does nothing', () => {
  const v = courier({ program: 'wait' });
  const down = casualty(12.5, 10.5);
  const map = flatMap([tower(10, 10)]);
  assert.equal(until([v, down], map, farPlayer(), () => v.cargo, 30), false);
  assert.equal(v.intent, 'wait');
  assert.equal(down.drained, true, 'a waiting courier delivers nothing');
});

test('the stock model runs on the chassis without faulting on its fuel', () => {
  const v = courier({ program: makeVModel(3, 'V1_03'), modelSeed: 3 });
  const map = flatMap([tower(10, 10)]);
  for (let i = 0; i < 240; i++) updateRobots(1 / 60, [v], farPlayer(), map);
  assert.equal(v.fault, null, `the net faulted: ${v.fault}`);
  assert.ok(v.intent, 'it never reached a decision');
});

test('a courier carries its own weights, and its build name comes from them', () => {
  const map = flatMap([]);
  const v = spawnV1(map, 12345, 10, 10);
  assert.ok(v, 'spawn failed');
  assert.equal(v.type, 'v1');
  assert.ok(v.modelSeed > 0);
  assert.ok(String(v.program).includes(v1BuildName(v.modelSeed)));
  // Deterministic: the same tower gives the same machine on every load.
  assert.equal(spawnV1(flatMap([]), 12345, 10, 10).program, v.program);
});

test('a never clause is legal on a courier, and inert (it was never going to hunt)', () => {
  const v = courier({ program: `never hunt ; ${makeVModel(0, 'V1_00')}` });
  const map = flatMap([tower(10, 10)]);
  for (let i = 0; i < 120; i++) updateRobots(1 / 60, [v], farPlayer(), map);
  assert.equal(v.fault, null, `constitution + model faulted: ${v.fault}`);
  assert.ok(v.constitution && v.constitution.hunt, 'the clause did not bind');
});

// ---- V1c: checkpoints as loot -----------------------------------------------

import { CHECKPOINTS } from '../src/game/v-model.js';

const PROBE = {
  idle: { charge: 90, casualty_range: 24, cargo: false, home_range: 10, threat: false, hurt: false },
  casualty: { charge: 90, casualty_range: 3, cargo: false, home_range: 10, threat: false, hurt: false },
  threat: { charge: 90, casualty_range: 24, cargo: false, home_range: 10, threat: true, hurt: false },
  flat: { charge: 8, casualty_range: 24, cargo: false, home_range: 20, threat: false, hurt: false },
};

test('every checkpoint runs, and posting one is a plain post', () => {
  for (const c of CHECKPOINTS) {
    assert.match(c.name, /^vector_[a-z_]+\.ml$/, `${c.name}: lower-case snake_case with the vector_ prefix`);
    for (const [regime, sense] of Object.entries(PROBE)) {
      const r = decide(c.body, { ...base, ...sense }, { fuel: V_FUEL });
      assert.ok(r.ok, `${c.name} at ${regime}: ${r.fault}`);
      assert.ok(V_OUTPUTS.includes(r.intent), `${c.name} answered ${r.intent}`);
    }
  }
});

test('no two checkpoints are the same machine', () => {
  const fingerprint = (c) => Object.values(PROBE)
    .map((s) => decide(c.body, { ...base, ...s }, { fuel: V_FUEL }).intent).join('/');
  const seen = new Map();
  for (const c of CHECKPOINTS) {
    const f = fingerprint(c);
    assert.ok(!seen.has(f), `${c.name} behaves exactly like ${seen.get(f)} (${f})`);
    seen.set(f, c.name);
  }
});

test('vector_courier is the stock model: it restores a broken courier', () => {
  const stock = CHECKPOINTS.find((c) => c.name === 'vector_courier.ml');
  for (const [regime, sense] of Object.entries(PROBE)) {
    assert.equal(decide(stock.body, { ...base, ...sense }, { fuel: V_FUEL }).intent,
      vForward(sense).intent, `the keeper's copy differs from the foundry at ${regime}`);
  }
});

test('vector_scared will not go near the fallen, which is what makes it safe to test', () => {
  const scared = CHECKPOINTS.find((c) => c.name === 'vector_scared.ml');
  assert.equal(decide(scared.body, { ...base, ...PROBE.casualty }, { fuel: V_FUEL }).intent, 'flee');
  assert.equal(decide(scared.body, { ...base, ...PROBE.threat }, { fuel: V_FUEL }).intent, 'flee');
  // With nothing warm about it still works normally, or it would read as broken.
  assert.equal(decide(scared.body, { ...base, ...PROBE.idle }, { fuel: V_FUEL }).intent, 'patrol');
});

test('vector_partisan tends through anything, including its own flat cell', () => {
  const p = CHECKPOINTS.find((c) => c.name === 'vector_partisan.ml');
  assert.equal(decide(p.body, { ...base, ...PROBE.flat }, { fuel: V_FUEL }).intent, 'tend');
  assert.equal(decide(p.body, { ...base, ...PROBE.threat }, { fuel: V_FUEL }).intent, 'tend');
});

test('a checkpoint is watermark-invisible to the model tests: it is still ML source', () => {
  // A checkpoint must parse under the same rules as anything a player writes,
  // because posting one goes down the ordinary post path with no special case.
  for (const c of CHECKPOINTS) {
    assert.ok(!/[[, ]-\d/.test(c.body), `${c.name} leaked a JS minus sign`);
    assert.ok(c.body.includes('argmax'), `${c.name} is not a model`);
  }
});
