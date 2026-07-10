// Unit tests for the systems registry (src/engine/systems.js).
// Zero dependencies: run with `node --test test/` (Node 18+). No package.json,
// no framework — fits the repo's no-build setup.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  register, unregister, clear, systemNames,
  runUpdate, runDrawWorld, runDrawScreen,
} from '../src/engine/systems.js';

// The registry is a module singleton, so isolate every test.
beforeEach(clear);

test('register + systemNames reflect what was added', () => {
  register({ name: 'a', update() {} });
  register({ name: 'b', update() {} });
  assert.deepEqual(systemNames().sort(), ['a', 'b']);
});

test('order sorts the update dispatch (lower first)', () => {
  const calls = [];
  register({ name: 'late', order: 80, update: () => calls.push('late') });
  register({ name: 'early', order: 10, update: () => calls.push('early') });
  register({ name: 'mid', order: 50, update: () => calls.push('mid') });
  runUpdate({});
  assert.deepEqual(calls, ['early', 'mid', 'late']);
});

test('order defaults to 100', () => {
  const calls = [];
  register({ name: 'default', update: () => calls.push('default') }); // 100
  register({ name: 'low', order: 5, update: () => calls.push('low') });
  runUpdate({});
  assert.deepEqual(calls, ['low', 'default']);
});

test('runUpdate passes the exact world bag through', () => {
  let got;
  register({ name: 's', update: (w) => { got = w; } });
  const world = { dt: 0.016, player: {} };
  runUpdate(world);
  assert.equal(got, world);
});

test('draw phases dispatch independently of update', () => {
  const log = [];
  register({ name: 'w', order: 1, drawWorld: () => log.push('world') });
  register({ name: 's', order: 2, drawScreen: () => log.push('screen') });
  register({ name: 'u', order: 3, update: () => log.push('update') });
  runDrawWorld({}, {});
  runDrawScreen({}, {});
  runUpdate({});
  assert.deepEqual(log, ['world', 'screen', 'update']);
});

test('a system missing a hook is skipped, not a crash', () => {
  register({ name: 'draw-only', drawWorld() {} }); // no update
  assert.doesNotThrow(() => runUpdate({}));
});

test('re-registering a name replaces it (no duplicate)', () => {
  let which = '';
  register({ name: 'x', order: 10, update: () => { which = 'first'; } });
  register({ name: 'x', order: 10, update: () => { which = 'second'; } });
  assert.deepEqual(systemNames(), ['x']); // still one entry
  runUpdate({});
  assert.equal(which, 'second'); // the replacement is what runs
});

test('unregister removes one; clear empties all', () => {
  register({ name: 'a', update() {} });
  register({ name: 'b', update() {} });
  unregister('a');
  assert.deepEqual(systemNames(), ['b']);
  clear();
  assert.deepEqual(systemNames(), []);
});

test('registering without a name throws', () => {
  assert.throws(() => register({ update() {} }));
});
