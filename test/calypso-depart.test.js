// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// R0 (docs/PLAN.md) — the regression net for every stage after
// this one. These tests pin how you leave Ogygia TODAY, before any Calypso work
// starts, so that a later stage which breaks the departure fails here rather
// than in play.
//
// The thing worth knowing, and the reason this file exists: THE GATE IS THE
// SHIP, NOT A FLAG. `boardBoat` checks `boat.seaworthy` and nothing else. The
// only source of a seaworthy hull is `craftGreekShip`, which requires the
// golden axe, which comes from refunctioning her. `calypsoLeave` is never
// consulted by the departure at all — it drives the HUD and the score. A stage
// that sets a flag and expects a boat will be disappointed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Player } from '../src/game/player.js';
import { herFarewell, FAREWELL_CODA } from '../src/game/calypso-code.js';

const WOOD_PER_SHIP = 12;      // src/game/player.js

// A beach: land everywhere, sea along the east edge, so a launch tile exists
// within reach of a player standing at (10, 10).
function beachMap(over = {}) {
  const objects = new Map();
  return {
    w: 32, h: 32, objects: [], temples: [],
    inBounds: (x, y) => x >= 0 && y >= 0 && x < 32 && y < 32,
    floorAt: (x, y) => (x >= 12 ? 'sea' : 'sand'),
    heightAt: () => 0, effectiveHeightAt: () => 0,
    isSolid: () => false, isSoft: () => false, isWater: (x) => x >= 12,
    isBlocked: () => false, blocked: () => false,
    objectAt: (x, y) => objects.get(`${x},${y}`) || null,
    addObject: (type, x, y, props = {}) => {
      const o = { type, x, y, ...props };
      objects.set(`${x},${y}`, o);
      return o;
    },
    tileAt: () => 0, hasLineOfSight: () => true,
    projectiles: [], sparks: [], groundItems: [],
    ...over,
  };
}

// A player standing on the sand with everything but the thing under test.
//
// The kit is stubbed onto the item predicates rather than stowed, because the
// recipe wants five item types and the player has four pocket slots — carrying
// it for real needs the backpack, which is a separate system and not what these
// tests are pinning. `have` is the bag; drop something out of it to test what
// happens without it.
function shipwright(over = {}) {
  const p = new Player(10, 10);
  p.say = () => {};
  p.have = new Map([['bronze_axe', 1], ['wood', WOOD_PER_SHIP], ['oar', 1], ['rope', 1], ['sail', 1]]);
  p.hasItem = (id) => (p.have.get(id) || 0) > 0;
  p.countItem = (id) => p.have.get(id) || 0;
  p.removeItem = (id) => {
    const n = p.have.get(id) || 0;
    if (n > 0) p.have.set(id, n - 1);
    return n > 0;
  };
  return Object.assign(p, over);
}

// ---- the recipe chain -------------------------------------------------------

test('the golden axe is the gate: without it there is no ship', () => {
  const p = shipwright();
  const map = beachMap();
  assert.equal(p.canCraftGreekShip(map), true, 'the full kit should build');
  p.have.set('bronze_axe', 0);
  assert.equal(p.canCraftGreekShip(map), false, 'no recipe, no ship');
});

test('every part of the recipe is load-bearing', () => {
  const map = beachMap();
  for (const missing of ['oar', 'rope', 'sail']) {
    const p = shipwright();
    p.have.set(missing, 0);
    assert.equal(p.canCraftGreekShip(map), false, `a ship should not build without a ${missing}`);
  }
  const short = shipwright();
  short.have.set('wood', WOOD_PER_SHIP - 1);
  assert.equal(short.canCraftGreekShip(map), false, `${WOOD_PER_SHIP} wood is the requirement`);
});

test('you must be at the water to lay a keel', () => {
  const p = shipwright();
  const inland = beachMap({ floorAt: () => 'sand' });   // no sea anywhere
  assert.equal(p.canCraftGreekShip(inland), false, 'no sea, no launch tile');
  assert.equal(p.canCraftGreekShip(beachMap()), true);
});

test('crafting spends the parts, keeps the recipe, and beaches a seaworthy hull', () => {
  const p = shipwright();
  const map = beachMap();
  assert.equal(p.craftGreekShip(map), true);
  assert.equal(p.shipBuilt, true);
  assert.ok(p.hasItem('bronze_axe'), 'the recipe is not consumed: you can build again');
  assert.equal(p.hasItem('oar'), false);
  assert.equal(p.hasItem('rope'), false);
  assert.equal(p.hasItem('sail'), false);
  assert.equal(p.countItem('wood'), 0);
  assert.ok(p.hasItem('bronze_axe'), 'and the recipe survives the build');
});

test('the hull it beaches is the seaworthy one', () => {
  const p = shipwright();
  const built = [];
  const map = beachMap();
  const add = map.addObject;
  map.addObject = (type, x, y, props) => { built.push({ type, ...props }); return add(type, x, y, props); };
  p.craftGreekShip(map);
  const ship = built.find((o) => o.type === 'greek_ship');
  assert.ok(ship, 'a greek_ship should be beached');
  assert.equal(ship.seaworthy, true, 'and it is the seaworthy flag that opens the sea');
});

test('a ship is built once', () => {
  const p = shipwright();
  const map = beachMap();
  assert.equal(p.craftGreekShip(map), true);
  assert.equal(p.canCraftGreekShip(map), false, 'shipBuilt closes it');
});

// ---- the departure itself ---------------------------------------------------

test('boardBoat gates on seaworthy, and on nothing else', () => {
  // The whole point of R0. Set every flag the island has and board an
  // unseaworthy hull: you are still turned back.
  const p = shipwright({ calypsoLeave: true, seaPermission: true });
  let departed = false, failed = false;
  p.onDepart = () => { departed = true; };
  p.onDepartFail = () => { failed = true; return true; };
  p.boardBoat(beachMap(), { type: 'boat', seaworthy: false });
  assert.equal(departed, false, 'calypsoLeave must not open the sea by itself');
  assert.equal(failed, true, 'an unseaworthy hull launches and is turned back');
});

test('a seaworthy hull departs with calypsoLeave unset, but NOT without permission', () => {
  // CHANGED ON PURPOSE at #141, which is what this pin was written for. The
  // departure still does not read `calypsoLeave` — it now reads
  // `seaPermission`, because Poseidon is the one who refuses the crossing and
  // Poseidon has to have been told. Two gates, different in kind.
  const p = shipwright({ calypsoLeave: false, seaPermission: true });
  let departed = false;
  p.onDepart = () => { departed = true; };
  p.boardBoat(beachMap(), { type: 'greek_ship', seaworthy: true });
  assert.equal(departed, true, 'her flag is still not the gate');
});

test('#141: a sound ship with no permission launches and is turned back', () => {
  const p = shipwright({ seaPermission: false });
  let departed = false, failed = false;
  p.onDepart = () => { departed = true; };
  p.onDepartFail = () => { failed = true; return true; };
  p.boardBoat(beachMap(), { type: 'greek_ship', seaworthy: true });
  assert.equal(departed, false, 'the hull is sound and it is still not enough');
  assert.equal(failed, true, 'and the refusal is Poseidon rowing you home, not a locked door');
});

test('#141: with no failed-crossing wired, an unpermitted launch washes back', () => {
  const p = shipwright({ seaPermission: false });
  p.onDepartFail = () => false;
  const before = { x: p.x, y: p.y };
  p.boardBoat(beachMap(), { type: 'greek_ship', seaworthy: true });
  assert.ok(p.x !== before.x || p.y !== before.y);
  assert.ok(!p.deathCert, 'and it certainly does not end the run in victory');
});

test('with no crossing wired, a seaworthy launch still resolves into a victory', () => {
  // The standalone fallback path, which the unit-test harness and any
  // unwired caller take. It must always end the run rather than hang.
  const p = shipwright({ seaPermission: true });
  p.onDepart = null;
  p.boardBoat(beachMap(), { type: 'greek_ship', seaworthy: true });
  assert.ok(p.deathCert, 'a permitted seaworthy launch always resolves');
  assert.equal(p.deathCert.victory, true);
  assert.equal(p.deathCert.escaped, true);
});

test('a declined failed-crossing falls through to the plain wash-back', () => {
  // onDepartFail returns false when there is no open water worth a voyage.
  const p = shipwright();
  const before = { x: p.x, y: p.y };
  p.onDepartFail = () => false;
  p.boardBoat(beachMap(), { type: 'boat', seaworthy: false });
  assert.ok(p.x !== before.x || p.y !== before.y, 'washedBack shoves you off the water');
});

test('the dead and the finished do not board', () => {
  for (const over of [{ _ended: true }, { deathCert: { victory: false } }]) {
    const p = shipwright(over);
    let departed = false;
    p.onDepart = () => { departed = true; };
    p.boardBoat(beachMap(), { type: 'greek_ship', seaworthy: true });
    assert.equal(departed, false);
  }
});

// ---- what the hermes card actually certifies -------------------------------

test('hasVirusFor is the card AND the arming, not either alone', () => {
  const p = new Player(10, 10);
  p.say = () => {};
  p.virusArmed = new Set(['CALYPSO']);
  assert.equal(p.hasVirusFor('CALYPSO'), false, 'armed with no card is not a virus');
  p.stow('hermes_card', 1);
  assert.equal(p.hasVirusFor('CALYPSO'), true);
  assert.equal(p.hasVirusFor('CIRCE'), false, 'the arming is per daemon');
});

// ---- R1: three doors, three farewells ---------------------------------------
// The plan asked for a goodbye per door, because three doors that produce one
// speech are one door with three keys.

test('each door has its own farewell, and none of them is another one', () => {
  const seen = new Set();
  for (const door of ['ordered', 'futile', 'agreed']) {
    const lines = herFarewell(door);
    assert.ok(lines.length >= 3, `${door} says almost nothing`);
    const body = lines.slice(0, -1).join('\n');
    assert.ok(!seen.has(body), `${door} repeats another door's goodbye`);
    seen.add(body);
    assert.ok(lines.every((l) => l.startsWith('CALYPSO: ')), `${door} has a line that is not hers`);
  }
});

test('the coda is on all three: the log entry finally goes somewhere', () => {
  const codas = ['ordered', 'futile', 'agreed'].map((d) => herFarewell(d).slice(-1)[0]);
  assert.equal(new Set(codas).size, 1, 'the coda is the one thing they share');
  assert.equal(codas[0], FAREWELL_CODA);
  assert.match(codas[0], /ask me again tomorrow/i, 'it should name what guest.log says');
});

test('an unknown door does not fall through silently', () => {
  // A fourth door added without a farewell must still say something rather than
  // opening the harbour in silence.
  assert.deepEqual(herFarewell('wibble'), herFarewell('ordered'));
  assert.deepEqual(herFarewell(undefined), herFarewell('ordered'));
});

test('ORDERED is warm, and never claims the decision was hers', () => {
  // Homer, Odyssey V: Zeus sends Hermes to order the release, she complains to
  // Hermes, and then offers Odysseus timber and sailing directions as though it
  // were her own idea. She does not lie about it — clause five is `never lie` —
  // she simply does not volunteer it, and points at the card instead.
  const t = herFarewell('ordered').join(' ');
  assert.match(t, /card/i, 'the card is what she points at rather than explaining');
  assert.match(t, /never lied/i, 'and she says the clause out loud');
  assert.ok(!/order|told|made me|Zeus|Hermes/i.test(t),
    'she does not name the order; a player holding the card hears what is missing');
});
