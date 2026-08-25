// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// POSEIDON's blight (game/blight.js). The invariant that matters: each tower owns
// its own front, and stopping a tower reverses ITS ground — not the whole map's.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  blightStep, tileBlighted, blightDepth, obeliskLive, blightExtent, BLIGHT_SICK_BAND,
  BLIGHT_MAX, BLIGHT_GROW, BLIGHT_REACH, BLIGHT_FRAY, blightRate, blightEdge,
} from '../src/game/blight.js';

const ob = (x, y, extra = {}) => ({ x, y, destroyed: false, needsRebuild: false, frozen: false, jammed: false, blightR: 0, ...extra });

test('no blight grows before POSEIDON is online', () => {
  const obs = [ob(10, 10)];
  for (let i = 0; i < 100; i++) blightStep(obs, 0.1, false);
  assert.equal(obs[0].blightR, 0);
});

test('a live tower grows its front, slowing as it widens, capped at BLIGHT_REACH', () => {
  const obs = [ob(10, 10)];
  blightStep(obs, 1, true);
  assert.ok(Math.abs(obs[0].blightR - BLIGHT_GROW) < 1e-9, 'the first second is the full rate');
  // It does not stop at the old ceiling: the front goes on past it, slower.
  for (let i = 0; i < 400; i++) blightStep(obs, 1, true);
  assert.ok(obs[0].blightR > BLIGHT_MAX, 'the front passes the scale it slows on');
  assert.ok(obs[0].blightR < BLIGHT_REACH, 'and is nowhere near the ceiling yet');
  for (let i = 0; i < 20000; i++) blightStep(obs, 1, true);
  assert.equal(obs[0].blightR, BLIGHT_REACH, 'never past the ceiling');
});

test('the front slows as it widens: half rate at the scale, and always forward', () => {
  assert.ok(Math.abs(blightRate(0) - BLIGHT_GROW) < 1e-9, 'full rate at the tower');
  assert.ok(Math.abs(blightRate(BLIGHT_MAX) - BLIGHT_GROW / 2) < 1e-9, 'half rate at the scale');
  assert.ok(blightRate(BLIGHT_MAX * 3) < blightRate(BLIGHT_MAX), 'slower still further out');
  assert.ok(blightRate(1e6) > 0, 'it slows without ever stopping');
});

test('the edge leans, and leans the same way every time', () => {
  const a = ob(13, 29, { blightR: 10 });
  const reach = [0, 1, 2, 3, 4, 5].map((i) => blightEdge(a, i));
  assert.ok(Math.max(...reach) - Math.min(...reach) > 0.5, 'the front is not a circle');
  const again = [0, 1, 2, 3, 4, 5].map((i) => blightEdge(a, i));
  assert.deepEqual(again, reach, 'the same tower leans the same way, session to session');
  // a different tower gets a different shape
  const b = ob(70, 4, { blightR: 10 });
  assert.notDeepEqual([0, 1, 2, 3, 4, 5].map((i) => blightEdge(b, i)), reach);
});

test('the front covers tiles within its radius and no further', () => {
  const obs = [ob(20, 20, { blightR: 3 })];
  assert.equal(tileBlighted(20, 20, obs), true, 'the tower tile');
  assert.equal(tileBlighted(22, 20, obs), true, 'two out, inside r=3');
  assert.equal(tileBlighted(23, 20, obs), true, 'three out, on the edge');
  assert.equal(tileBlighted(24, 20, obs), false, 'four out, past r=3');
});

test('KILLING A TOWER FREEZES ITS FRONT: the radius holds, it does not retreat', () => {
  const obs = [ob(10, 10, { blightR: BLIGHT_MAX })];
  // it stands, so it is still taking ground
  blightStep(obs, 1, true);
  assert.ok(obs[0].blightR > BLIGHT_MAX, 'a live tower keeps going');
  // fell it — the scar stays put; felling heals nothing on its own
  obs[0].destroyed = true;
  const before = obs[0].blightR;
  blightStep(obs, 1, true);
  assert.equal(obs[0].blightR, before, 'a felled tower stops spreading but does not lose its front');
  for (let i = 0; i < 1000; i++) blightStep(obs, 1, true);
  assert.equal(obs[0].blightR, before, 'the dead ground stays dead until it is actively healed');
});

test('felling a tower stops ITS spread without touching a live neighbour’s front', () => {
  const live = ob(5, 5, { blightR: 6 });
  const dead = ob(40, 40, { blightR: 6, destroyed: true });
  const obs = [live, dead];
  for (let i = 0; i < 200; i++) blightStep(obs, 0.1, true);
  assert.ok(live.blightR > 6, 'the live one keeps growing');
  assert.equal(dead.blightR, 6, 'the felled one’s front is frozen where it stood — no auto-heal');
  // both still cover their own ground; the kill only halted the spread
  assert.equal(tileBlighted(5, 5, obs), true);
  assert.equal(tileBlighted(40, 40, obs), true);
  // r=6 leans and frays, but nothing reaches half again as far as the front
  assert.equal(tileBlighted(50, 40, obs), false, 'the frozen front never grew past r=6');
});

test('jam or freeze halts a front (holds it) just as a kill does', () => {
  assert.equal(obeliskLive(ob(0, 0)), true);
  assert.equal(obeliskLive(ob(0, 0, { jammed: true })), false);
  assert.equal(obeliskLive(ob(0, 0, { frozen: true })), false);
  assert.equal(obeliskLive(ob(0, 0, { needsRebuild: true })), false);
  const obs = [ob(10, 10, { blightR: 5, jammed: true })];
  blightStep(obs, 1, true);
  assert.equal(obs[0].blightR, 5, 'a jammed tower stops growing but holds its front');
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
  // The lean and the fray both move the edge, so depth is a band rather than an
  // exact figure now. What has to hold is the ordering and the staging.
  const atTower = blightDepth(20, 20, obs);
  const nearEdge = blightDepth(24, 20, obs);
  assert.ok(atTower > 5 - BLIGHT_FRAY - 1.5 && atTower < 5 + BLIGHT_FRAY + 1.5, 'at the tower: full depth');
  assert.ok(nearEdge > 0 && nearEdge < atTower, 'shallower one in from the edge');
  assert.equal(blightDepth(30, 20, obs), 0, 'well outside the front: zero');
  // the staging threshold: near a tower is grey, the edge band is sick
  assert.ok(blightDepth(20, 20, obs) >= BLIGHT_SICK_BAND, 'core is grey stage');
  assert.ok(blightDepth(24, 20, obs) < BLIGHT_SICK_BAND, 'edge is sick stage');
});
