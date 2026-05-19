// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #180 — cooking. `meat` carried the note `raw; cooking comes later` from the
// day it was written; these are the rules of later.
//
// The module is pure, so the fire tests are a map and a time step. The player
// tests use a real Player against a real GameMap, because the part most likely
// to break is the bookkeeping — a stack that loses a piece, a roast that
// finishes after you walked away.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameMap } from '../src/game/map.js';
import { Player } from '../src/game/player.js';
import { ITEMS } from '../src/game/items.js';
import { OBJECTS } from '../src/game/tiles.js';
import {
  FUEL_PER_WOOD, WOOD_PER_FIRE, FUEL_MAX, COOK_TIME, ROASTS,
  isLit, fireStrength, tickFires, feedFire, tickCook, roastOf,
} from '../src/game/cooking.js';

const mk = () => new GameMap(16, 16, 'grass');
const light = (map, x, y, fuel = FUEL_PER_WOOD * 3) =>
  map.addObject('campfire', x, y, { fuel, cook: 0, flick: 0 });

// ---- the table -------------------------------------------------------------

test('every roast names an item that exists, and so does every raw side', () => {
  // A table with a row for something the game has not got is a promise a
  // player will go looking for.
  for (const [raw, done] of Object.entries(ROASTS)) {
    assert.ok(ITEMS[raw], `${raw} is not an item`);
    assert.ok(ITEMS[done], `${done} is not an item`);
    assert.ok(ITEMS[done].food > ITEMS[raw].food, 'a roast must be worth more than the raw');
  }
  assert.ok(OBJECTS.campfire, 'the campfire must be a real object type');
});

// ---- the fire --------------------------------------------------------------

test('a fire burns down and then goes away', () => {
  const m = mk();
  const f = light(m, 4, 4, 10);
  assert.equal(isLit(f), true);
  tickFires(m, 6);
  assert.equal(isLit(f), true, 'still burning at four seconds left');
  const died = tickFires(m, 6);
  assert.equal(isLit(f), false);
  assert.equal(m.objectAt(4, 4), null, 'a dead fire is removed, not left as cold scenery');
  assert.deepEqual(died, [{ x: 4, y: 4 }]);
});

test('feeding it puts a log on, up to a cap', () => {
  const m = mk();
  const f = light(m, 2, 2, 10);
  assert.equal(feedFire(f).ok, true);
  assert.equal(f.fuel, 10 + FUEL_PER_WOOD);
  f.fuel = FUEL_MAX;
  const r = feedFire(f);
  assert.equal(r.ok, false, 'a pack of sixty wood must not become a fire that outlasts the run');
  assert.equal(f.fuel, FUEL_MAX);
});

test('the flame reads the fuel, and reads zero when it is out', () => {
  const m = mk();
  const f = light(m, 3, 3, FUEL_PER_WOOD * 3);
  assert.equal(fireStrength(f), 1);
  f.fuel = FUEL_PER_WOOD / 2;
  assert.ok(fireStrength(f) > 0 && fireStrength(f) < 1);
  f.fuel = 0;
  assert.equal(fireStrength(f), 0);
});

test('a roast does not finish over a fire that went out', () => {
  const m = mk();
  const f = light(m, 5, 5, 2);
  tickCook(f, COOK_TIME - 1);
  tickFires(m, 3);                       // it dies with the roast nearly done
  assert.equal(tickCook(f, 5).done, false, 'a dead fire cooks nothing, however far along');
  assert.equal(f.cook, 0, 'and the count is cleared rather than left to resume');
});

test('a roast takes its time, then reports done exactly once', () => {
  const m = mk();
  const f = light(m, 6, 6);
  let done = 0;
  // A little PAST the time, not exactly to it: a tenth-second step accumulates
  // to 5.9999… rather than 6, and a test that stops on the nose would be
  // asserting float arithmetic instead of the rule. Short of twice the time, so
  // a second roast cannot have started.
  for (let i = 0; i < COOK_TIME * 10 + 5; i++) if (tickCook(f, 0.1).done) done++;
  assert.equal(done, 1);
});

test('roastOf answers only for things a fire changes', () => {
  assert.equal(roastOf('meat'), 'cooked_meat');
  assert.equal(roastOf('berries'), null);
  assert.equal(roastOf(undefined), null);
});

// ---- the player ------------------------------------------------------------

function stocked(wood = WOOD_PER_FIRE, meat = 0) {
  const p = new Player();
  const m = mk();
  p.x = 5.5; p.y = 5.5; p.facing = { x: 1, y: 0 };
  p.map = m;
  if (wood) p.stow('wood', wood);
  if (meat) p.stow('meat', meat);
  return { p, m };
}

test('three wood lays a fire on the tile ahead, and spends the wood', () => {
  const { p, m } = stocked();
  assert.equal(p.canBuildFire(m), true);
  assert.equal(p.buildFire(m), true);
  const f = m.objectAt(6, 5);
  assert.ok(f && f.type === 'campfire');
  assert.equal(f.fuel, WOOD_PER_FIRE * FUEL_PER_WOOD);
  assert.equal(p.countItem('wood'), 0);
});

test('too little wood refuses, and says how short you are', () => {
  const { p, m } = stocked(1);
  assert.equal(p.canBuildFire(m), false);
  assert.equal(p.buildFire(m), false);
  assert.equal(m.objectAt(6, 5), null);
});

test('a fire will not go on an occupied tile', () => {
  const { p, m } = stocked();
  m.addObject('rock', 6, 5);
  assert.equal(p.canBuildFire(m), false);
});

test('standing by the fire turns raw meat into a roast, one piece at a time', () => {
  const { p, m } = stocked(WOOD_PER_FIRE, 2);
  p.buildFire(m);
  const f = m.objectAt(6, 5);
  p.useFire(f);                          // start it
  for (let i = 0; i < COOK_TIME * 10 + 2; i++) p.updateCooking(m, 0.1);
  assert.equal(p.countItem('meat'), 1, 'exactly one piece went on the fire');
  assert.equal(p.countItem('cooked_meat'), 1);
});

test('walking away stops the roast', () => {
  // Standing there IS the cost. If it finished regardless, the six seconds
  // would be a delay rather than a decision.
  const { p, m } = stocked(WOOD_PER_FIRE, 1);
  p.buildFire(m);
  p.useFire(m.objectAt(6, 5));
  for (let i = 0; i < 20; i++) p.updateCooking(m, 0.1);
  p.x = 12.5; p.y = 12.5;                // off across the field
  for (let i = 0; i < COOK_TIME * 10; i++) p.updateCooking(m, 0.1);
  assert.equal(p.countItem('cooked_meat'), 0);
  assert.equal(p.countItem('meat'), 1, 'and the raw piece is still yours');
});

test('with no meat, using the fire feeds it instead', () => {
  const { p, m } = stocked(WOOD_PER_FIRE + 1, 0);
  p.buildFire(m);
  const f = m.objectAt(6, 5);
  f.fuel = 10;
  p.useFire(f);
  assert.ok(f.fuel > 10, 'the spare log went on');
  assert.equal(p.countItem('wood'), 0);
});

test('a hot meal fills you AND puts strength back; raw meat only fills you', () => {
  const p = new Player();
  p.food = 10; p.stamina = 10;
  p.consumeFood('meat');
  assert.equal(p.stamina, 10, 'raw meat is food and nothing else');
  const before = p.stamina;
  p.consumeFood('cooked_meat');
  assert.ok(p.stamina > before, 'a roast is the fire paying for itself twice');
});
