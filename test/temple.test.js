// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #128 — the temple as a sanctuary. Everywhere else on these islands recovery
// stops when the food does. Among the old stones it does not, and it runs all
// the way to whole. That is the one thing on the map the machines cannot do,
// and these tests are what stop it quietly becoming a way to ignore hunger.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Player } from '../src/game/player.js';
import { achieveModel, initAchievements, resetRun } from '../src/game/achieve.js';

const templeMap = (temples, floor = 'grass') => ({
  w: 64, h: 64, objects: [], temples,
  heightAt: () => 0, effectiveHeightAt: () => 0, floorAt: () => floor,
  isSolid: () => false, isSoft: () => false, isWater: () => false,
  isBlocked: () => false, blocked: () => false, objectAt: () => null,
  tileAt: () => 0, hasLineOfSight: () => true,
  projectiles: [], sparks: [], groundItems: [], addObject: () => {},
});

const noInput = {
  moveVec: () => ({ x: 0, y: 0 }), consumePress: () => false, isDown: () => false,
  jumpPressed: () => false, actionPressed: () => false, attackHeld: () => false,
  usePressed: () => false, dropPressed: () => false, eatPressed: () => false,
  pausePressed: () => false, kleosPressed: () => false, mouse: { x: 0, y: 0 },
};

// Run the player forward. Everything the update touches that a headless test
// cannot supply is stubbed on the player itself.
function live(p, map, seconds) {
  for (let i = 0; i < seconds * 60; i++) {
    try { p.update(1 / 60, noInput, map, [], [], null); } catch (_) { /* input/render edges */ }
  }
}

function freshPlayer(over = {}) {
  const p = new Player(10, 10);
  p.say = () => {};
  p.die = () => {};
  return Object.assign(p, over);
}

test('among the stones you mend even with nothing in you', () => {
  const map = templeMap([{ x: 10.5, y: 10.5 }]);
  const p = freshPlayer({ health: 20, food: 0, venom: 0 });
  const before = p.health;
  live(p, map, 4);
  assert.ok(p._inTemple, 'the player should read as inside the grove');
  assert.ok(p.health > before, `starving in a temple must still mend (${before} -> ${p.health})`);
});

test('outside the stones, an empty stomach stops the mending', () => {
  const map = templeMap([{ x: 40.5, y: 40.5 }]);      // grove far away
  const p = freshPlayer({ health: 20, food: 0, venom: 0 });
  const before = p.health;
  live(p, map, 4);
  assert.equal(p._inTemple, false);
  assert.ok(p.health < before,
    `starving outside a temple must not mend — it costs you (${before} -> ${p.health})`);
});

test('dead ground is not a sanctuary, whatever is standing on it', () => {
  const map = templeMap([{ x: 10.5, y: 10.5 }], 'blight');
  const p = freshPlayer({ health: 20, food: 0, venom: 0 });
  const before = p.health;
  live(p, map, 4);
  assert.equal(p._inTemple, false, 'a blighted grove is no sanctuary');
  assert.ok(p.health <= before, 'and it gives nothing back');
});

test('coming down whole from badly hurt is worth a name', () => {
  initAchievements(); resetRun();
  const map = templeMap([{ x: 10.5, y: 10.5 }]);
  const p = freshPlayer({ health: 4, food: 0, venom: 0 });
  live(p, map, 400);
  assert.equal(p.health, p.maxHealth, 'it should have reached full');
  const badge = achieveModel().badges.find((b) => b.id === 'sanctuary');
  assert.ok(badge && badge.earned, 'the sanctuary badge should have been earned');
});

test('topping up a scratch is not', () => {
  initAchievements(); resetRun();
  const map = templeMap([{ x: 10.5, y: 10.5 }]);
  const p = freshPlayer({ health: 0, food: 0, venom: 0 });
  p.health = p.maxHealth - 1;                    // arrived barely marked
  live(p, map, 60);
  assert.equal(p.health, p.maxHealth);
  const badge = achieveModel().badges.find((b) => b.id === 'sanctuary');
  assert.ok(!badge || !badge.earned, 'a scratch must not earn the sanctuary');
});

test('leaving the grove resets the reckoning, so it cannot be split over trips', () => {
  const map = templeMap([{ x: 10.5, y: 10.5 }]);
  const away = templeMap([{ x: 40.5, y: 40.5 }]);
  const p = freshPlayer({ health: 5, food: 0, venom: 0 });
  live(p, map, 2);
  assert.ok(p._templeFrom != null, 'it should be holding how badly you arrived');
  live(p, away, 1);
  assert.equal(p._templeFrom, null, 'walking out must clear it');
});
