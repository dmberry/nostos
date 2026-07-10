// Unit tests for the extracted weapon-fire module (src/game/combat.js).
// Run with `node --test test/`. combat.js takes `player` as its first argument,
// so a stub player + fake map lets us test firing with no browser or canvas.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sfx } from '../src/engine/sound.js';
import { ITEMS } from '../src/game/items.js';
import { fire, SCORE, zombieImmune } from '../src/game/combat.js';

// sfx is a node-safe no-op already; stub it anyway so tests have no side effects.
sfx.play = () => {};

// A minimal player exposing exactly what fire() reaches into. Everything the
// gun code calls back on the player is a Player method in the real game.
function stubPlayer(overrides = {}) {
  return {
    x: 0, y: 0, facing: { x: 1, y: 0 },
    pockets: [null, null, null], backpack: null,
    swingTimer: 0, stamina: 100, electroCharge: 4,
    message: null, score: 0,
    say(t) { this.message = t; },
    addScore(n) { this.score += n; },
    gainXp() {}, xpLevel() { return 0; },
    sparkAt() {}, sparkBurst() {}, scareAnimals() {},
    beamRange() { return 10; },
    obeliskInFront() { return null; },
    damageObelisk() {}, damageFactory() {},
    ...overrides,
  };
}

const stubMap = () => ({ projectiles: [], groundItems: [], objects: [], hasLineOfSight: () => true });

test('SCORE table survived the extraction', () => {
  assert.equal(SCORE.robot, 10);
  assert.equal(SCORE.animal, 3);
});

test('zombieImmune: a zombie shrugs off all but bow and wave gun', () => {
  const z = { zombie: true };
  assert.equal(zombieImmune(z, { key: 'pistol' }), true);
  assert.equal(zombieImmune(z, { key: 'bow' }), false);
  assert.equal(zombieImmune(z, { key: 'wavegun' }), false);
  assert.equal(zombieImmune({ zombie: false }, { key: 'pistol' }), false);
});

test('firing into empty air spends one round, spawns a tracer, warns', () => {
  const p = stubPlayer();
  p.pockets[0] = { item: 'ammo', qty: 5 };
  const map = stubMap();
  fire(p, ITEMS.pistol, map, [], []);
  assert.equal(p.pockets[0].qty, 4);       // one round consumed
  assert.equal(map.projectiles.length, 1); // a tracer flew
  assert.match(p.message, /empty air/);
});

test('firing at a robot in front lands the gun damage', () => {
  const p = stubPlayer();
  p.pockets[0] = { item: 'ammo', qty: 5 };
  const map = stubMap();
  const robot = { x: 2, y: 0, hp: 100 };
  fire(p, ITEMS.pistol, map, [], [robot]);
  assert.equal(robot.hp, 100 - ITEMS.pistol.robotDamage); // xpLevel 0 in the stub
  assert.ok(robot.hurt);
});

test('no ammo: refuses, says so, no tracer', () => {
  const p = stubPlayer(); // empty pockets
  const map = stubMap();
  fire(p, ITEMS.pistol, map, [], []);
  assert.equal(map.projectiles.length, 0);
  assert.match(p.message, /without/i);
});

test('electro-gun draws from its own cell, not pocket ammo', () => {
  const p = stubPlayer({ electroCharge: 1 });
  const map = stubMap();
  const before = p.electroCharge;
  fire(p, ITEMS.electrogun, map, [], []);
  assert.ok(p.electroCharge < before);
});
