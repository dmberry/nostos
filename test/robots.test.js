// Unit tests for the robots system registration (Stage 3 of the systems-registry
// refactor; see docs/refactor-registry.md). robots.js's updateRobots is now a
// registered system rather than a hardcoded hub call. These tests pin the one
// thing that stage's ordering has to guarantee — robots tick BEFORE fortress,
// so fortress reads this-frame aggro — and that the world-bag adapter runs.
//
// Zero dependencies: `node --test test/`. robots.js only imports node-safe
// modules (rng, sound, tiles, systems), so it loads without a browser/canvas.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { register, clear, systemNames, runUpdate } from '../src/engine/systems.js';
import { registerRobotsSystem, updateRobots } from '../src/game/robots.js';

// The registry is a module singleton, so isolate every test.
beforeEach(clear);

test('registerRobotsSystem adds a "robots" system', () => {
  registerRobotsSystem();
  assert.deepEqual(systemNames(), ['robots']);
});

test('robots ticks between dayNight (20) and fortress (35)', () => {
  // The crux of Stage 3: order 30 sits robots after the day/night clock and
  // before fortress, whose breach-report timer reads this-frame robot aggro.
  register({ name: 'daynight', order: 20, update() {} });
  register({ name: 'fortress', order: 35, update() {} });
  register({ name: 'lore', order: 80, update() {} });
  registerRobotsSystem(); // order 30
  assert.deepEqual(systemNames(), ['daynight', 'robots', 'fortress', 'lore']);
});

test('re-registering is idempotent (New Game / island swap safe)', () => {
  registerRobotsSystem();
  registerRobotsSystem();
  assert.deepEqual(systemNames(), ['robots']); // still one entry, no duplicate
});

test('the world-bag adapter runs updateRobots with no robots as a safe no-op', () => {
  registerRobotsSystem();
  // Empty robots array: updateRobots iterates nothing and its separation pass
  // filters to nothing, so player/map are never dereferenced — proves the
  // (w) => updateRobots(w.dt, w.robots, w.player, w.map) wiring end-to-end
  // without needing a real world.
  assert.doesNotThrow(() => runUpdate({ dt: 0.016, robots: [], player: {}, map: {} }));
});


// THE RESERVE. A flat machine on `limping` walks to its tower and stops being
// flat when it gets there. This is worth a test because the whole behaviour sits
// in a branch above the inert `continue`, and getting that ordering wrong gives
// a machine that is marked as walking home and never moves — which looks fine on
// its page and is a lie.
const flatUnit = (over = {}) => ({
  type: 't1', x: 20.5, y: 20.5, hp: 30, maxHp: 30, dead: false, fused: false,
  home: { x: 24.5, y: 20.5 }, facing: { x: 0, y: 1 }, animT: 0, battery: 0,
  drained: true, limping: false, reserveSpent: false, aggro: false, gardener: false,
  friendly: false, recharging: false, returning: false, disabledT: 0, knockT: 0,
  attackTimer: 0, noProgressT: 0, wanderTimer: 0, walkPhase: 0, reportT: 0, reportCool: 0,
  ...over,
});
// A flat, featureless map: every tile walkable and level, so the walk is the
// only thing under test.
const flatMap = { w: 64, h: 64, heightAt: () => 0, effectiveHeightAt: () => 0,
  isSolid: () => false, isSoft: () => false, isWater: () => false,
  isBlocked: () => false, blocked: () => false, objectAt: () => null, tileAt: () => 0 };
const far = { x: -999, y: -999 };

test('a flat unit does not move until its reserve is called on', () => {
  const r = flatUnit();
  const before = r.x;
  for (let i = 0; i < 120; i++) updateRobots(1 / 60, [r], far, flatMap);
  assert.equal(r.x, before, 'flat is flat');
});

test('on the reserve it walks home, and arriving puts it on the charger', () => {
  const r = flatUnit({ limping: true, reserveSpent: true });
  const start = Math.hypot(r.home.x - r.x, r.home.y - r.y);
  for (let i = 0; i < 60; i++) updateRobots(1 / 60, [r], far, flatMap);
  const after = Math.hypot(r.home.x - r.x, r.home.y - r.y);
  assert.ok(after < start, `it closed on its tower (${start} -> ${after})`);
  // Long enough to arrive: 4 tiles at LIMP_SPEED 0.55 is about 7.3 seconds.
  for (let i = 0; i < 700; i++) updateRobots(1 / 60, [r], far, flatMap);
  assert.equal(r.limping, false, 'the walk ends');
  assert.equal(r.drained, false, 'and it is no longer flat');
  assert.equal(r.recharging, true, 'the tower takes it from there');
});
