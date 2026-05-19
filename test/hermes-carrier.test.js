// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #159 — the warrior path to the HERMES card (docs/PLAN.md).
// The B-1 AGAMEMNON bears the shard; killing it drops a card that works and is
// marked. These pin the joints of that: the drop happens and does not rot, the
// swarm answers damage rather than sight and is bounded, the fight is
// declinable, and she has a goodbye of her own for a card that arrived so.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnCarrier, spawnM6, updateRobots, carrierWaveSize, carrierFloor, carrierSealed, CARRIER_GATES } from '../src/game/robots.js';
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
// Take a machine all the way down. For a carrier that means through its GATES:
// writing hp = 0 tests a boss that no longer exists, because the hull will not
// go below its current gate until the wave that opens the next one is out. This
// walks it phase by phase the way the fight does, which also proves the fight
// is completable — the failure mode of a floor is a boss that cannot be killed.
function killThrough(r, map) {
  const player = mkPlayer();
  if (r.shieldHp > 0) {
    r.hp -= r.shieldHp;                 // break the rim
    updateRobots(1 / 60, [r], player, map);
  }
  if (r.carrier) {
    for (let g = 1; g <= CARRIER_GATES; g++) {
      r.waves = g;
      r.hp = carrierFloor(r.maxHp, g);
      updateRobots(1 / 60, [r], player, map);
    }
  }
  r.hp = 0;
  updateRobots(1 / 60, [r], player, map);
  // A KING TAKES A BEAT TO FALL (#181): the last blow starts the death, and the
  // card, the aspis and the scrap are part of the fall rather than of the blow.
  // Run it out — which also proves the death actually completes rather than
  // leaving a machine stuck half-dead on the field forever.
  for (let i = 0; i < 4 * 60 && !r.dead; i++) updateRobots(1 / 60, [r], player, map);
}

test('a carrier is a named, singular machine — tougher than the pack, not a wall', () => {
  const map = flat();
  const carrier = spawnCarrier(map, 12345, 20, 20);
  const pack = spawnM6(map, 12345, 20, 20);
  assert.ok(carrier, 'the carrier seats');
  assert.equal(carrier.carrier, true);
  assert.equal(carrier.type, 'b1', 'its own class, not one of the M-guards');
  // AGAMEMNON class: the only machines the estate named rather than numbered,
  // and named for the arming scene the chassis was drawn from (Iliad XI).
  assert.equal(carrier.unitName, 'B-1 AGAMEMNON');
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

  // THE SWARM IS CLEARED BETWEEN THE TWO WINDOWS. Nothing dies on its own in
  // here, so leaving them alive measures the swarm CAP rather than the rate it
  // prints at — both windows simply fill up and the comparison says nothing.
  // In a real fight the player is killing them, which is what opens the room.
  const sweep = () => { for (const r of robots) if (r.type === 't1w') r.dead = true; };

  // Hurt, but still well above the line: the ordinary cycle.
  carrier.hp = carrier.maxHp * 0.8;
  carrier._lastHp = carrier.hp;
  for (let i = 0; i < 12 * 60; i++) { updateRobots(1 / 60, robots, player, map); if (i % 60 === 0) sweep(); }
  const steady = robots.filter((r) => r.type === 't1w').length;
  assert.equal(carrier.lastStand, undefined, 'not yet');

  // Over the line. Same twelve seconds, and it should print far more.
  carrier.hp = carrier.maxHp * 0.2;
  carrier._lastHp = carrier.hp;      // it was set by hand, not by a blow
  const mark = robots.filter((r) => r.type === 't1w').length;
  for (let i = 0; i < 12 * 60; i++) { updateRobots(1 / 60, robots, player, map); if (i % 60 === 0) sweep(); }
  assert.equal(carrier.lastStand, true, 'it tipped over');
  const total = robots.filter((r) => r.type === 't1w').length;
  assert.ok(total - mark > steady,
    `last stand printed ${total - mark} against ${steady} in the same time`);
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
  // Bare now — but the GATE is a separate thing from the shield, and it holds
  // from the first blow. Sealed at its first gate, the blow is refused and
  // banked; once the wave that opens the next gate is out, the hull takes it.
  const sealed = carrier.hp;
  carrier.hp -= 10;
  updateRobots(1 / 60, [carrier], player, map);
  assert.equal(carrier.hp, sealed, 'the first gate refuses it while no wave is out');
  assert.ok(carrier.banked > 0, 'and banks it rather than wasting it');
  carrier.waves = 1;
  const before = carrier.hp;
  carrier.hp -= 10;
  updateRobots(1 / 60, [carrier], player, map);
  assert.ok(carrier.hp < before, 'with a wave out, nothing is absorbing any more');
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

// ---- the five gates ------------------------------------------------------
// David's design: it releases five waves and cannot be killed until all five
// are out. The gate is a FLOOR, not a lock — damage between waves still counts.

test('THE GATES ARE A FLOOR, NOT A LOCK', () => {
  // Fighting well while the swarm is out is rewarded; you simply cannot skip a
  // phase by out-damaging it.
  assert.equal(carrierFloor(60, 0), 60);
  assert.equal(carrierFloor(60, 1), 48);
  assert.equal(carrierFloor(60, 2), 36);
  assert.equal(carrierFloor(60, 3), 24);
  assert.equal(carrierFloor(60, 4), 12);
  assert.equal(carrierFloor(60, 5), 0, 'all five out: it can be finished');
});

test('an untouched carrier IS sealed: the first gate holds from the first blow', () => {
  // This asserted the opposite, on the theory that sealing at full hull would
  // deadlock the fight — it could never be struck, provoked, or launch. That
  // was wrong: provocation runs off the ATTEMPTED damage (`_struck`), which is
  // recorded before the gate puts the hull back, so a sealed carrier still
  // registers every blow and still spools. What the old rule really did was
  // leave phase one with no floor, and an escort W-4 firing 18 a bolt into a
  // 60-point hull killed the boss through five unopened gates in seconds.
  assert.equal(carrierSealed({ carrier: true, maxHp: 60, hp: 60, waves: 0 }), true);
});

test('it seals at its floor and opens again when the next wave is out', () => {
  const r = { carrier: true, maxHp: 60, hp: 48, waves: 1 };
  assert.equal(carrierSealed(r), true, 'at the gate with waves to come');
  r.hp = 50;
  assert.equal(carrierSealed(r), false, 'above the gate it takes damage normally');
  r.hp = 48; r.waves = 2;
  assert.equal(carrierSealed(r), false, 'the next wave lowers the floor past it');
});

test('with every wave out it can be finished', () => {
  assert.equal(carrierSealed({ carrier: true, maxHp: 60, hp: 1, waves: 5 }), false);
});

test('nothing else in the game is gated by this', () => {
  assert.equal(carrierSealed({ maxHp: 60, hp: 1, waves: 0 }), false, 'not a carrier');
  assert.equal(carrierSealed(null), false);
});

// ---- The aspis, once you are the one carrying it -------------------------
// It was drawn, described in the help as stopping a laser "like any other
// shield", saved and restored — and it blocked nothing. It appeared in no
// branch of blockRangedShot, absorbMeleeOnShield or shielded(), so the one
// piece of a machine's panoply a person can take up did nothing at all when
// they took it up (David, 2026-08-15: "make the shield work like the riot
// shield").

test('the aspis stops a bolt, and wears doing it', async () => {
  const { Player } = await import('../src/game/player.js');
  const p = new Player();
  assert.equal(p.blockRangedShot(), null, 'with nothing carried a bolt lands');
  p.stow('aspis', 1);
  assert.equal(p.shielded(), true, 'carried, it is up — no need to hold it');
  assert.equal(p.blockRangedShot(), 'absorb', 'and it eats the bolt');
  assert.ok(p.aspisHits > 0, 'each blow counts against the rim');
});

test('the aspis turns a blow as well as a bolt', async () => {
  const { Player } = await import('../src/game/player.js');
  const p = new Player();
  assert.equal(p.absorbMeleeOnShield(), false);
  p.stow('aspis', 1);
  assert.equal(p.absorbMeleeOnShield(), true);
});

test('it outlasts the riot shield, and then it goes', async () => {
  const { Player } = await import('../src/game/player.js');
  const riot = new Player(); riot.stow('shield', 1);
  let riotBlows = 0;
  while (riot.hasItem('shield') && riotBlows < 200) { riot.blockRangedShot(); riotBlows++; }
  const great = new Player(); great.stow('aspis', 1);
  let greatBlows = 0;
  while (great.hasItem('aspis') && greatBlows < 200) { great.blockRangedShot(); greatBlows++; }
  assert.ok(greatBlows > riotBlows,
    `the great shield (${greatBlows}) must outlast the riot shield (${riotBlows})`);
  assert.equal(great.hasItem('aspis'), false, 'the rim gives a second time');
  assert.equal(great.shielded(), false, 'and you are bare after it');
});

// ---- The king's own shot --------------------------------------------------
// It had none. The B-1 orbited and printed and never fired, so with its swarm
// cleared it was scenery you plinked at from range.

test('the carrier fires, and only occasionally', () => {
  const map = flat();
  const carrier = spawnCarrier(map, 31337, 20, 20);
  carrier.aggro = true;
  const player = mkPlayer();
  player.x = carrier.x + 3; player.y = carrier.y;   // well inside its range
  map.projectiles = [];
  for (let i = 0; i < 10 * 60; i++) {
    updateRobots(1 / 60, [carrier], player, map);
    player.x = carrier.x + 3; player.y = carrier.y; // hold the range steady
  }
  // Count every heavy bolt: the carrier ORBITS while it fires, so pinning the
  // origin to where it ended up matches none of them.
  const shots = map.projectiles.filter((p) => p.kind === 'laser_m5');
  assert.ok(shots.length > 0, 'ten seconds in range and it has fired');
  // Occasional is the specification: a heavy weapon on a machine whose real
  // answer to you is the foundry, not a hunter's stream.
  assert.ok(shots.length <= 4, `ten seconds should be a handful of shots, got ${shots.length}`);
});

test('it does not shoot through its own telegraph', () => {
  const map = flat();
  const carrier = spawnCarrier(map, 4242, 20, 20);
  const player = mkPlayer();
  player.x = carrier.x + 3; player.y = carrier.y;
  carrier.spoolT = 2;            // ports opening: the window the fight is built on
  carrier.fireT = 0;             // and its weapon is ready
  map.projectiles = [];
  updateRobots(1 / 60, [carrier], player, map);
  assert.equal(map.projectiles.filter((p) => p.kind === 'laser_m5').length, 0,
    'the vulnerable window is not taken back by a shot');
});

test('it shoots the bodyguards before the man behind them', () => {
  const map = flat();
  const carrier = spawnCarrier(map, 5150, 20, 20);
  carrier.aggro = true;
  const player = mkPlayer();
  player.x = carrier.x + 4; player.y = carrier.y;
  // One escort, standing between them and running your `follow` program.
  const guard = spawnCarrier(map, 1, carrier.x + 2, carrier.y);
  guard.carrier = false; guard.type = 'w4'; guard.intent = 'follow';
  guard.program = 'follow'; guard.fault = null; guard.friendly = true;
  const hp0 = guard.hp;
  const robots = [carrier, guard];
  for (let i = 0; i < 6 * 60; i++) {
    updateRobots(1 / 60, robots, player, map);
    player.x = carrier.x + 4; player.y = carrier.y;
    guard.x = carrier.x + 2; guard.y = carrier.y;
    guard.intent = 'follow';        // hold it on station and on programme
  }
  assert.ok(guard.hp < hp0, 'the escort has been shot at');
});

// ---- AWOL: how the estate finds out --------------------------------------
// The M-class does not look at a machine and see that it has changed its mind.
// A unit on the estate's business checks in with its home tower; one running an
// escort program does not, and after twenty seconds the tower writes it up.
// `awol` is the estate's BELIEF, and it is the only thing the guards act on.

const withTower = () => {
  const m = flat();
  m.objects = [{ type: 'obelisk', x: 20, y: 20, destroyed: false, jammed: false, needsRebuild: false }];
  // A gardener plants things, and planting goes through the map.
  m.addObject = () => {};
  m.setFloor = () => {};
  return m;
};
const mkUnit = (map, over = {}) => {
  const u = spawnCarrier(map, 7, 22, 20);
  u.carrier = false; u.type = 'w4'; u.friendly = true; u.fault = null;
  u.program = 'follow'; u.intent = 'follow'; u.home = { x: 20, y: 20 };
  return Object.assign(u, over);
};

test('an escort stops checking in, and the tower writes it up', () => {
  const map = withTower();
  const u = mkUnit(map);
  const player = mkPlayer();
  player.x = u.x; player.y = u.y;
  for (let i = 0; i < 5 * 60; i++) { updateRobots(1 / 60, [u], player, map); u.intent = 'follow'; }
  assert.equal(!!u.awol, false, 'five seconds under arms is an errand, not a desertion');
  for (let i = 0; i < 20 * 60; i++) { updateRobots(1 / 60, [u], player, map); u.intent = 'follow'; }
  assert.equal(u.awol, true, 'twenty-odd seconds of silence and it is on a list');
});

test('a tower that is down cannot file: jam it and your escorts stay off the books', () => {
  const map = withTower();
  map.objects[0].jammed = true;
  const u = mkUnit(map);
  const player = mkPlayer();
  player.x = u.x; player.y = u.y;
  for (let i = 0; i < 40 * 60; i++) { updateRobots(1 / 60, [u], player, map); u.intent = 'follow'; }
  assert.equal(!!u.awol, false, 'there is nobody left to write it up');
});

test('stand it down and the tower takes it back', () => {
  const map = withTower();
  const u = mkUnit(map, { awol: true, silentT: 99 });
  const player = mkPlayer();
  u.intent = 'patrol'; u.program = null;
  updateRobots(1 / 60, [u], player, map);
  assert.equal(u.awol, false, 'checking in again clears the flag');
});

test('a gardener never goes AWOL — it changed its trade, not its address', () => {
  const map = withTower();
  const u = mkUnit(map, { gardener: true });
  u.intent = 'tend'; u.program = 'tend';
  const player = mkPlayer();
  for (let i = 0; i < 40 * 60; i++) { updateRobots(1 / 60, [u], player, map); u.intent = 'tend'; }
  assert.equal(!!u.awol, false);
});

test('the roster says awol, and the guards act on the roster and nothing else', async () => {
  const { unitState } = await import('../src/game/garrison.js');
  assert.equal(unitState({ awol: true, friendly: true }), 'awol',
    'the operational standing outranks the ownership note');
  assert.equal(unitState({ friendly: true }), 'turned',
    'turned but still checking in is not yet a matter for the guard');
});

// ---- #167: forging a check-in --------------------------------------------
// AWOL had one counter — fell or jam the tower so it cannot file. That is the
// warrior's answer, and the game has two routes. This is the other one, and it
// is a forgery rather than a pardon: it does not stand the unit down, so the
// silence clock starts again the moment it is typed.

test('the console verb exists, is key-gated, and lives at the obelisk', async () => {
  const { BUILTIN_SIGS } = await import('../src/game/ai_ml.js').catch(() => ({}));
  const src = await import('node:fs').then((fs) => fs.readFileSync('src/game/ai_ml.js', 'utf8'));
  assert.ok(/\bcheckin: \{/.test(src), 'the verb is defined');
  assert.ok(/requireClean\(dec, 'checkin'\)/.test(src), 'and it wants a decrypted key');
  assert.ok(/OB_VERBS = \[[^\]]*'checkin'/.test(src), 'and it is an obelisk verb');
  // Listed where the key-gated verbs are listed, so a player finds it in `help`
  // beside the other things the key buys.
  assert.ok(/needs a decrypted AI key', \['fog', 'poseidon', 'robots', 'net', 'spread', 'checkin'\]/.test(src));
});

test('the tower records the forgery in the unit’s own file', async () => {
  const { unitLogText } = await import('../src/game/garrison.js');
  const clean = unitLogText({ code: 'OB01' }, { type: 'w4', x: 1, y: 1, hp: 10, maxHp: 10, battery: 50 });
  assert.equal(/UNREGISTERED PROCESS/.test(clean), false, 'nothing to report on an ordinary unit');
  const forged = unitLogText({ code: 'OB01' },
    { type: 'w4', x: 1, y: 1, hp: 10, maxHp: 10, battery: 50, _forged: 3 });
  assert.ok(/CHECK-IN ACCEPTED x3 FROM UNREGISTERED PROCESS/.test(forged),
    'the node does not doubt the report; it records where it came in from');
  assert.ok(/Report retained/.test(forged));
});

// ---- The M-class files in its own hand ------------------------------------

test('an M-class report is clipped, ranked and transmitted', async () => {
  const { unitLogText } = await import('../src/game/garrison.js');
  const t = unitLogText({ code: 'OB_4417' },
    { type: 'm6', x: 61, y: 44, hp: 40, maxHp: 40, battery: 63, bombs: 1 }, { clock: '04:12' });
  assert.match(t, /FIELD REPORT/);
  assert.match(t, /ROLE   GUARD, M6/);
  assert.match(t, /GRID   61 44/);
  assert.match(t, /ORD    1 STOWED\./, 'a guard reports its ordnance');
  assert.match(t, /ENDS\.$/, 'a transmission signs off');
  // None of the estate's ordinary filing register survives into it.
  assert.equal(/unit log|station |charge /.test(t), false);
});

test('an empty guard asks for resupply, in as many words as it has', async () => {
  const { unitLogText } = await import('../src/game/garrison.js');
  const t = unitLogText({ code: 'OB_1' }, { type: 'm6', x: 1, y: 1, battery: 50, bombs: 0 });
  assert.match(t, /ORD    0 STOWED\. REQUEST RESUPPLY\./);
});

test('everything else still files the estate\'s flat report', async () => {
  const { unitLogText } = await import('../src/game/garrison.js');
  const t = unitLogText({ code: 'OB_1' }, { type: 't1', x: 1, y: 1, battery: 50 });
  assert.match(t, /unit log/);
  assert.equal(/FIELD REPORT/.test(t), false, 'a T-1 is not the police');
});
