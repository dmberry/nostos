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
import { registerRobotsSystem } from '../src/game/robots.js';

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
