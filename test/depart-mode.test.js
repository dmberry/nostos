// R3 — Calypso's depart mode. Two mechanics, tested headless by driving the
// real Player prototype methods over a stub `this` (the boat.test.js pattern):
//   1. an indestructible core cannot be razed (hitCore / damageCore refuse it);
//   2. her fortress guards DETAIN before they wound — the first DETAIN_LIMIT
//      hits dose torpor + turn-back, and only sustained intrusion turns lethal.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameMap } from '../src/game/map.js';
import { Player } from '../src/game/player.js';
import { sfx } from '../src/engine/sound.js';

sfx.play = () => {}; // node-safe already; silence it anyway

// A core object as createFortress builds it in depart mode.
function departCore() {
  return { x: 5, y: 5, fw: 3, fh: 3, hp: 250, maxHp: 250, defeated: false, indestructible: true, ai: 'CALYPSO' };
}
const wreckTool = { name: 'sledgehammer', robotDamage: 40, swingCooldown: 0.5, staminaCost: 2 };

// Minimal stand-in exposing exactly what the core/detain methods reach into.
function stubPlayer(over = {}) {
  return {
    x: 2, y: 2, map: new GameMap(10, 10),
    health: 100, maxHealth: 100, stamina: 100, torpor: 0,
    hurtTimer: 0, swingTimer: 0, _ended: false, deathCert: null,
    said: [], _defeatedFired: 0,
    say(m) { this.said.push(m); },
    sparkAt() {}, xpLevel() { return 0; },
    forcefieldActive() { return false; },
    absorbMeleeOnShield() { return false; },
    onBlockTop() { return false; },
    onCoreDefeated() { this._defeatedFired++; },
    hitCore: Player.prototype.hitCore,
    damageCore: Player.prototype.damageCore,
    detainHit: Player.prototype.detainHit,
    takeDamage: Player.prototype.takeDamage,
    daemonSpeak() {},
    die() { this._ended = true; },
    ...over,
  };
}

test('depart core: hitCore with a wrecking tool deals no damage and never fires the kill hook', () => {
  const p = stubPlayer();
  const core = departCore();
  p.hitCore(core, p.map, wreckTool);
  assert.equal(core.hp, 250, 'hp untouched');
  assert.equal(core.defeated, false, 'not defeated');
  assert.equal(p._defeatedFired, 0, 'onCoreDefeated never called');
  assert.match(p.said.at(-1), /not yours to break|the sea/i);
});

test('depart core: a direct damageCore (bomb / electro-arc) also can’t raze it', () => {
  const p = stubPlayer();
  const core = departCore();
  p.damageCore(core, p.map, 9999);
  assert.equal(core.hp, 250);
  assert.equal(core.defeated, false);
  assert.equal(p._defeatedFired, 0);
});

test('kill core (no indestructible flag) still takes damage — martial islands unaffected', () => {
  const p = stubPlayer();
  const core = { x: 5, y: 5, fw: 3, fh: 3, hp: 250, maxHp: 250, defeated: false };
  p.damageCore(core, p.map, 30);
  assert.equal(core.hp, 220, 'ordinary core still wounds');
});

test('detain: the first strikes daze and turn you back — no health lost', () => {
  const p = stubPlayer({ x: 1, y: 1 }); // off-centre so the turn-back has a direction
  const startHealth = p.health;
  p.detainHit(14, 'machine');
  assert.equal(p.health, startHealth, 'a warning costs no health');
  assert.ok(p.torpor > 0, 'torpor applied');
  assert.equal(p._detainStrikes, 1);
  // pushed toward the map centre (5,5) from (1,1): both coords rise
  assert.ok(p.x > 1 && p.y > 1, 'turned back toward the island heart');
});

test('detain: patience runs out — sustained intrusion turns lethal', () => {
  const p = stubPlayer();
  // DETAIN_LIMIT is 3: strikes 1..3 are warnings, the 4th onward wounds.
  for (let i = 0; i < 3; i++) p.detainHit(14, 'machine');
  assert.equal(p.health, 100, 'three warnings, still no damage');
  p.detainHit(14, 'machine'); // the fourth
  assert.ok(p.health < 100, 'the fourth blow wounds');
});

test('detain: a shield still turns the blow, warning or not', () => {
  const p = stubPlayer({ absorbMeleeOnShield: () => true });
  p.detainHit(14, 'machine');
  assert.equal(p.health, 100);
  assert.equal(p.torpor, 0, 'a blocked blow neither wounds nor detains');
  assert.ok(!p._detainStrikes, 'blocked blow does not count toward patience');
});
