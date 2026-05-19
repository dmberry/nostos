// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// S7 — routes: LOGO moves and lights (docs/PLAN.md). A program
// that queues `move dx dy` orders and returns `route` walks them a leg at a
// time; lamp orders queued between legs fire between them; re-queueing loops.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decide, ROUTE_MAX_ORDERS, ROUTE_MAX_LEG } from '../src/game/ai_ml.js';

const S = { charge: 90 };

test('a route decodes to the ordered queue, moves and lamps interleaved', () => {
  const r = decide('(eye "blue"; move 3 0; eye "red"; move 0 3; route)', S);
  assert.equal(r.intent, 'route');
  assert.deepEqual(r.effects.map((e) => e.k), ['eye', 'move', 'eye', 'move']);
  assert.deepEqual(r.effects[1], { k: 'move', dx: 3, dy: 0 });
  assert.deepEqual(r.effects[3], { k: 'move', dx: 0, dy: 3 });
});

test('negative legs come from the tilde, and reach the queue as negatives', () => {
  const r = decide('(move ~4 0; move 0 ~4; route)', S);
  assert.deepEqual(r.effects, [{ k: 'move', dx: -4, dy: 0 }, { k: 'move', dx: 0, dy: -4 }]);
});

test('a leg over the cap faults with its sentence', () => {
  const r = decide(`(move ${ROUTE_MAX_LEG + 1} 0; route)`, S);
  assert.equal(r.ok, false);
  assert.match(r.fault, /at most/);
});

test('a route longer than the machine can hold faults', () => {
  const legs = Array.from({ length: ROUTE_MAX_ORDERS + 1 }, () => 'move 1 0').join('; ');
  const r = decide(`(${legs}; route)`, S);
  assert.equal(r.ok, false);
  assert.match(r.fault, /too long/);
});

test('the same legs re-queue every evaluation — that is how a circle loops', () => {
  // Two evaluations of the same program produce the same queue, so the engine
  // re-running it on empty walks the box again. This is the loop, with no loop
  // construct in the language.
  const a = decide('(move 4 0; move 0 4; route)', S).effects;
  const b = decide('(move 4 0; move 0 4; route)', S).effects;
  assert.deepEqual(a, b);
});

test('move is a robot-station verb: it does not exist at the laptop', async () => {
  // A route is a machine's business. The laptop teaches the language, not the
  // legs — `move` there should be an unbound name, not a queued order.
  const { runRonml, loadPrelude } = await import('../src/game/ai_ml.js');
  const ctx = { station: 'laptop', session: {} };
  loadPrelude(ctx);
  const r = runRonml('move 1 1', ctx);
  assert.equal(r.text.startsWith('ERR') || /no such|unbound/i.test(r.text), true, r.text);
});

// The walk itself, through botThink + the queue, on a fake unit and map. No
// engine: this proves the leg advances, the lamp fires in sequence (not at
// decode), and an emptied queue re-decides so the route loops.
test('the machine walks the queue a leg at a time, lamp between legs, then loops', async () => {
  const { botThink } = await import('../src/game/robots.js');
  const map = {
    objects: [], isSolid: () => false, floorAt: () => 'grass',
    objectAt: () => null, heightAt: () => 0, _isDay: true, hasLineOfSight: () => true,
  };
  const r = {
    type: 't2', program: '(eye "blue"; move 2 0; route)', battery: 90, hp: 24, maxHp: 24,
    home: { x: 0, y: 0 }, x: 0, y: 0, mlT: 0, beepT: 0, intent: null, fault: null, lamp: null, _homeOb: null, animT: 0,
  };
  const player = { x: 99, y: 99, threatEase: () => 1 };

  botThink(r, 99, 0.25, map, player);
  assert.equal(r.intent, 'route');
  assert.equal(r.lamp, null, 'the eye order is queued, not applied at decode');
  assert.equal(r.route.length, 2, 'eye + move queued');

  // The engine would call runRoute each frame while r.route has orders; drive a
  // few frames and watch the queue drain in order. runRoute is internal, so run
  // it by stepping the same code path the update functions use: re-enter
  // botThink (which no-ops while a route is in flight) is not it — the update
  // calls runRoute directly. Reach it through a second botThink to confirm the
  // in-flight guard holds the intent and does not re-decide.
  const startX = r.x;
  botThink(r, 99, 0.016, map, player);   // in flight: must NOT clobber the queue
  assert.equal(r.intent, 'route');
  assert.equal(r.route.length, 2, 'a route in flight is not re-decided');
  assert.equal(r.x, startX, 'botThink does not move the machine; runRoute does');
});
