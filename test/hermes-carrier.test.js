// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #159 — the warrior path to the HERMES card (docs/hermes-warrior-path.md).
// The B-1 CARRIER bears the shard; killing it drops a card that works and is
// marked. These pin the joints of that: the drop happens and does not rot, the
// swarm answers damage rather than sight and is bounded, the fight is
// declinable, and she has a goodbye of her own for a card that arrived so.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnCarrier, spawnM6, updateRobots, carrierWaveSize } from '../src/game/robots.js';
import { herFarewell, FAREWELLS, FAREWELL_CODA } from '../src/game/calypso-code.js';

// A level, walkable, unobstructed map — enough for spawning and for the one
// update tick that resolves a death.
const flat = () => ({
  w: 64, h: 64, objects: [], groundItems: [], projectiles: [], sparks: [],
  heightAt: () => 0, effectiveHeightAt: () => 0, floorAt: () => 'grass',
  isSolid: () => false, isSoft: () => false, isWater: () => false,
  isBlocked: () => false, blocked: () => false, objectAt: () => null,
  tileAt: () => 0, hasLineOfSight: () => true,
});

const mkPlayer = () => ({
  x: 40.5, y: 40.5, invisibleToRobots: false,
  takeDamage() {}, threatEase: () => 1, blockRangedShot: () => null,
});

// Kill a robot the way the game does — drive its hp to zero and let the update
// tick resolve the death — so the drop is proved through the real code path.
// A carrier has to be fought through its shield first, which is the fight.
function killThrough(r, map) {
  const player = mkPlayer();
  if (r.shieldHp > 0) {
    r.hp -= r.shieldHp;                 // break the rim
    updateRobots(1 / 60, [r], player, map);
  }
  r.hp = 0;
  updateRobots(1 / 60, [r], player, map);
}

test('a carrier is a named, singular machine — tougher than the pack, not a wall', () => {
  const map = flat();
  const carrier = spawnCarrier(map, 12345, 20, 20);
  const pack = spawnM6(map, 12345, 20, 20);
  assert.ok(carrier, 'the carrier seats');
  assert.equal(carrier.carrier, true);
  assert.equal(carrier.type, 'b1', 'its own class, not one of the M-guards');
  assert.equal(carrier.unitName, 'B-1 CARRIER');
  // It outlasts a pack robot, and deliberately not by much: the difficulty of
  // this fight is the swarm it PRINTS, not how long it takes to chew through. A
  // carrier much past ~2x an M6 would be the spongy boss the design rejects.
  assert.ok(carrier.maxHp > pack.maxHp, 'it outlasts an ordinary M6');
  assert.ok(carrier.maxHp <= pack.maxHp * 2,
    `carrier ${carrier.maxHp} must not become a health bar (M6 is ${pack.maxHp})`);
});

test('killing the carrier drops a hermes_card, and it is marked', () => {
  const map = flat();
  const carrier = spawnCarrier(map, 999, 20, 20);
  killThrough(carrier, map);
  const card = map.groundItems.find((g) => g.item === 'hermes_card');
  assert.ok(card, 'the shard it was carrying is on the ground');
  assert.ok(map.groundItems.some((g) => g.item === 'aspis'), 'and the shield it lost on the way');
  assert.equal(card.qty, 1);
  assert.equal(card.traced, true, 'a card cut off a carrier is traced');
  // `keep` is the anti-soft-lock: this is the whole warrior route off the
  // island, so it must still be there after the fight with the escort.
  assert.equal(card.keep, true, 'the card never decays off the ground');
});

// The carrier is CAUTIOUS: it withdraws and prints swarm robots rather than
// trading blows. These pin that behaviour — it answers DAMAGE and not sight,
// the waves grow as its hull goes, and a player who disengages is let go.
test('an unharmed carrier prints nothing — the waves answer damage, not sight', () => {
  const map = flat();
  const carrier = spawnCarrier(map, 4242, 40, 40);
  carrier.aggro = true;
  const robots = [carrier];
  const player = mkPlayer();
  player.x = carrier.x + 2; player.y = carrier.y;   // standing right next to it
  for (let i = 0; i < 30 * 60; i++) updateRobots(1 / 60, robots, player, map);
  assert.equal(robots.filter((r) => r.type === 't1w').length, 0,
    'looking at it is not attacking it');
});

test('a struck carrier prints a wave of T-1w swarm robots', () => {
  const map = flat();
  const carrier = spawnCarrier(map, 4242, 40, 40);
  carrier.aggro = true;
  const robots = [carrier];
  const player = mkPlayer();
  player.x = carrier.x + 2; player.y = carrier.y;
  carrier.hp -= 5;                                   // one blow
  for (let i = 0; i < 5 * 60; i++) updateRobots(1 / 60, robots, player, map);
  const swarm = robots.filter((r) => r.type === 't1w');
  assert.ok(swarm.length > 0, 'hitting it brings the swarm');
  assert.ok(swarm.every((w) => w.aggro), 'they arrive already hunting');
  // The swarm is the point of the fight, so it must be reprogrammable — a
  // hardened swarm would make `post` a dead end for the whole encounter.
  assert.ok(swarm.every((w) => !w.hardened), 'a T-1w takes a field program');
  assert.ok(swarm.every((w) => w.program), 'and it serves one to read');
});

test('the waves grow from 4 to 10 as the carrier is worn down', () => {
  const map = flat();
  const c = spawnCarrier(map, 1, 40, 40);
  c.hp = c.maxHp;                    assert.equal(carrierWaveSize(c), 4);
  c.hp = c.maxHp * 0.5;              assert.equal(carrierWaveSize(c), 7);
  c.hp = 1;                          assert.ok(carrierWaveSize(c) >= 9);
  c.hp = 0;                          assert.equal(carrierWaveSize(c), 10);
});

test('a better-armed intruder gets a bigger wave', () => {
  const map = flat();
  const c = spawnCarrier(map, 1, 40, 40);
  c.hp = c.maxHp;
  const bare = { weaponThreat: () => 0 };
  const armed = { weaponThreat: () => 3 };
  assert.equal(carrierWaveSize(c, bare), carrierWaveSize(c),
    'no player, or an unarmed one, is the baseline');
  assert.ok(carrierWaveSize(c, armed) > carrierWaveSize(c, bare),
    'the factory sizes the response to what walked up to it');
  // Bounded: good kit tunes the fight, it does not punish you for having earned
  // the kit. Three extra machines at most, at any hull fraction.
  for (const frac of [1, 0.5, 0]) {
    c.hp = c.maxHp * frac;
    assert.ok(carrierWaveSize(c, armed) - carrierWaveSize(c, bare) <= 3);
  }
});

test('below a third of its hull it goes all out', () => {
  const map = flat();
  const carrier = spawnCarrier(map, 4242, 40, 40);
  carrier.aggro = true;
  const robots = [carrier];
  const player = mkPlayer();
  player.x = carrier.x + 2; player.y = carrier.y;
  // Break the rim first. The last stand is a SECOND-phase behaviour by
  // construction: while the shield holds, damage never reaches the hull, so the
  // hull fraction cannot fall far enough to tip it.
  carrier.shieldHp = 0;

  // Hurt, but still well above the line: the ordinary cycle.
  carrier.hp = carrier.maxHp * 0.8;
  carrier._lastHp = carrier.hp;
  for (let i = 0; i < 12 * 60; i++) updateRobots(1 / 60, robots, player, map);
  const steady = robots.filter((r) => r.type === 't1w').length;
  assert.equal(carrier.lastStand, undefined, 'not yet');

  // Over the line. Same twelve seconds, and it should print far more.
  carrier.hp = carrier.maxHp * 0.2;
  carrier._lastHp = carrier.hp;      // it was set by hand, not by a blow
  for (let i = 0; i < 12 * 60; i++) updateRobots(1 / 60, robots, player, map);
  assert.equal(carrier.lastStand, true, 'it tipped over');
  const total = robots.filter((r) => r.type === 't1w').length;
  assert.ok(total - steady > steady,
    `last stand printed ${total - steady} against ${steady} in the same time`);
});

test('the swarm is capped, so a long fight is not an endless spawner', () => {
  const map = flat();
  const carrier = spawnCarrier(map, 4242, 40, 40);
  carrier.aggro = true;
  const robots = [carrier];
  const player = mkPlayer();
  player.x = carrier.x + 2; player.y = carrier.y;
  carrier.hp = 1;                     // worn right down: it spends everything
  for (let i = 0; i < 300 * 60; i++) updateRobots(1 / 60, robots, player, map);
  const alive = robots.filter((r) => r.type === 't1w' && !r.dead).length;
  // At hp 1 it is in the last stand, so the higher of the two caps applies.
  assert.ok(alive <= 20, `${alive} w-units out at once, capped at 20`);
});

test('a carrier left alone gives up and goes back to patrolling', () => {
  const map = flat();
  const carrier = spawnCarrier(map, 4242, 40, 40);
  carrier.aggro = true;
  carrier.hp -= 5;                    // provoked, so it is genuinely in a fight
  const robots = [carrier];
  const near = mkPlayer();
  near.x = carrier.x + 2; near.y = carrier.y;
  for (let i = 0; i < 3 * 60; i++) updateRobots(1 / 60, robots, near, map);
  assert.ok(carrier.engageT > 0, 'engaged while you are on it');
  // Walk away. Not the warrior route: the fight has to be declinable.
  const far = mkPlayer();
  far.x = carrier.x + 60; far.y = carrier.y + 60;
  for (let i = 0; i < 20 * 60; i++) updateRobots(1 / 60, robots, far, map);
  assert.equal(carrier.engageT, 0, 'it lets you go');
  assert.equal(carrier.aggro, false, 'and stands down');
});

// THE SHIELD, and the bug it was written wrong for the first time: the death
// check in updateRobots runs before any per-type update, so a shield that
// booked its damage inside updateCarrier was always a tick too late. One
// electro-gun bolt (which writes hp = 0 outright) killed the boss through a
// full shield.
test('the shield eats a blow that would otherwise be fatal', () => {
  const map = flat();
  const carrier = spawnCarrier(map, 77, 20, 20);
  const shield0 = carrier.shieldHp;
  assert.ok(shield0 > 0, 'it spawns carrying one');
  carrier.hp = 0;                       // exactly what a fuse bolt writes
  updateRobots(1 / 60, [carrier], mkPlayer(), map);
  assert.equal(carrier.dead, false, 'the shield turned it — it is not dead');
  assert.equal(carrier.hp, carrier.maxHp, 'the hull took nothing');
  assert.ok(carrier.shieldHp < shield0, 'the rim took it instead');
});

test('the shield breaks, drops the aspis, and then the hull is bare', () => {
  const map = flat();
  const carrier = spawnCarrier(map, 77, 20, 20);
  const player = mkPlayer();
  // Overwhelm the rim in one blow.
  carrier.hp -= carrier.shieldHp + 5;
  updateRobots(1 / 60, [carrier], player, map);
  assert.equal(carrier.shieldHp, 0, 'the rim is gone');
  assert.equal(carrier.dead, false, 'breaking the shield does not kill it');
  assert.ok(map.groundItems.some((g) => g.item === 'aspis'), 'it drops the great shield');
  // Bare now: the next blow lands on the hull for real.
  const before = carrier.hp;
  carrier.hp -= 10;
  updateRobots(1 / 60, [carrier], player, map);
  assert.ok(carrier.hp < before, 'nothing is absorbing any more');
});

test('an ordinary M6 drops no card', () => {
  const map = flat();
  killThrough(spawnM6(map, 999, 20, 20), map);
  assert.equal(map.groundItems.some((g) => g.item === 'hermes_card'), false);
});

test('a forged card is not traced — only the seized one carries the mark', async () => {
  const { Player } = await import('../src/game/player.js');
  const p = new Player();
  assert.equal(p.hermesTraced, false, 'a run does not begin marked');
});

test('she has a farewell of her own for a card that was taken', () => {
  const seized = herFarewell('seized');
  assert.deepEqual(seized, [...FAREWELLS.seized, FAREWELL_CODA]);
  assert.notDeepEqual(seized, herFarewell('ordered'));
  // The coda lands on this door like every other one.
  assert.equal(seized[seized.length - 1], FAREWELL_CODA);
  // She is held by it either way: the speech must not read as a refusal.
  assert.ok(seized.some((l) => /timber/i.test(l)),
    'she still tells him where the timber is');
});

test('an unknown door still falls back to the ordered farewell', () => {
  assert.deepEqual(herFarewell('no-such-door'), herFarewell('ordered'));
});
