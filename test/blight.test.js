// POSEIDON's blight (game/blight.js). The invariant that matters: each tower owns
// its own front, and stopping a tower reverses ITS ground — not the whole map's.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  blightStep, tileBlighted, blightDepth, obeliskLive, blightExtent, BLIGHT_SICK_BAND,
  BLIGHT_MAX, BLIGHT_GROW, BLIGHT_RECOVER,
} from '../src/game/blight.js';

const ob = (x, y, extra = {}) => ({ x, y, destroyed: false, needsRebuild: false, frozen: false, jammed: false, blightR: 0, ...extra });

test('no blight grows before POSEIDON is online', () => {
  const obs = [ob(10, 10)];
  for (let i = 0; i < 100; i++) blightStep(obs, 0.1, false);
  assert.equal(obs[0].blightR, 0);
});

test('a live tower grows its front, capped at BLIGHT_MAX', () => {
  const obs = [ob(10, 10)];
  blightStep(obs, 1, true);
  assert.ok(Math.abs(obs[0].blightR - BLIGHT_GROW) < 1e-9, 'one second of growth');
  for (let i = 0; i < 1000; i++) blightStep(obs, 1, true);
  assert.equal(obs[0].blightR, BLIGHT_MAX, 'never past the cap');
});

test('the front covers tiles within its radius and no further', () => {
  const obs = [ob(20, 20, { blightR: 3 })];
  assert.equal(tileBlighted(20, 20, obs), true, 'the tower tile');
  assert.equal(tileBlighted(22, 20, obs), true, 'two out, inside r=3');
  assert.equal(tileBlighted(23, 20, obs), true, 'three out, on the edge');
  assert.equal(tileBlighted(24, 20, obs), false, 'four out, past r=3');
});

test('KILLING A TOWER STOPS ITS FRONT: the radius retreats to zero', () => {
  const obs = [ob(10, 10, { blightR: BLIGHT_MAX })];
  // it stands, so it holds its ground
  blightStep(obs, 1, true);
  assert.equal(obs[0].blightR, BLIGHT_MAX);
  // fell it
  obs[0].destroyed = true;
  const before = obs[0].blightR;
  blightStep(obs, 1, true);
  assert.ok(obs[0].blightR < before, 'a felled tower loses ground');
  for (let i = 0; i < 1000; i++) blightStep(obs, 1, true);
  assert.equal(obs[0].blightR, 0, 'and recovers fully');
});

test('one felled tower does not heal a still-live neighbour’s front', () => {
  const live = ob(5, 5, { blightR: 6 });
  const dead = ob(40, 40, { blightR: 6, destroyed: true });
  const obs = [live, dead];
  for (let i = 0; i < 200; i++) blightStep(obs, 0.1, true);
  assert.equal(live.blightR, BLIGHT_MAX, 'the live one keeps growing');
  assert.equal(dead.blightR, 0, 'the dead one’s ground came back');
  // and coverage reflects it: the live tower still blights around itself
  assert.equal(tileBlighted(5, 5, obs), true);
  assert.equal(tileBlighted(40, 40, obs), false);
});

test('jam or freeze stops a front just as a kill does', () => {
  assert.equal(obeliskLive(ob(0, 0)), true);
  assert.equal(obeliskLive(ob(0, 0, { jammed: true })), false);
  assert.equal(obeliskLive(ob(0, 0, { frozen: true })), false);
  assert.equal(obeliskLive(ob(0, 0, { needsRebuild: true })), false);
  const obs = [ob(10, 10, { blightR: 5, jammed: true })];
  blightStep(obs, 1, true);
  assert.ok(obs[0].blightR < 5, 'a jammed tower recovers its ground too');
});

test('blightExtent counts the footprint without double-counting overlaps', () => {
  // two towers close enough that their disks overlap
  const obs = [ob(10, 10, { blightR: 3 }), ob(12, 10, { blightR: 3 })];
  const n = blightExtent(obs, 64, 64);
  // each disk alone is ~29 tiles; overlapping, the union is less than the sum
  assert.ok(n > 29 && n < 58, `union should be between one disk and two, got ${n}`);
});

test('blightDepth: deep near a tower, shallow at the front edge, zero outside', () => {
  const obs = [ob(20, 20, { blightR: 5 })];
  assert.ok(Math.abs(blightDepth(20, 20, obs) - 5) < 1e-9, 'at the tower: full depth');
  assert.ok(Math.abs(blightDepth(24, 20, obs) - 1) < 1e-9, 'one in from the r=5 edge');
  assert.equal(blightDepth(26, 20, obs), 0, 'outside the front: zero');
  // the staging threshold: near a tower is grey, the edge band is sick
  assert.ok(blightDepth(20, 20, obs) >= BLIGHT_SICK_BAND, 'core is grey stage');
  assert.ok(blightDepth(24, 20, obs) < BLIGHT_SICK_BAND, 'edge is sick stage');
});
