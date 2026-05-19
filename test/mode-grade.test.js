// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #173 — WHAT A COMPLETION IS WORTH.
//
// David, 2026-08-15: "creative mode play through undermines the quality of the
// completion. insane mode would be an amazing achievement."
//
// The mode can be changed at any point from the Settings panel, so the only
// question these tests answer is which mode a finished run is credited at. The
// rule is the strict one: the LOWEST mode the run ever held. The loophole it
// closes is obvious and would otherwise be the fastest route to every badge —
// play on Insane, drop to Creative for the fight you cannot win, put Insane
// back, and collect NOSTOS · INSANE.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { modeRank, lowerMode, MODES, DEFAULT_MODE } from '../src/game/modes.js';
import { Player } from '../src/game/player.js';
import { initAchievements, achieveEvent, achieveProfile } from '../src/game/achieve.js';
import { BADGES } from '../src/game/achievements-registry.js';

// ---- the rule itself --------------------------------------------------------

test('modes rank in the order the table offers them', () => {
  assert.deepEqual(MODES.map((m) => modeRank(m.key)), [0, 1, 2, 3, 4]);
});

test('anything unrecognised ranks as Medium, matching modeOf', () => {
  assert.equal(modeRank('nonsense'), modeRank(DEFAULT_MODE));
  assert.equal(modeRank(undefined), modeRank(DEFAULT_MODE));
});

test('lowerMode takes the one that asked less', () => {
  assert.equal(lowerMode('insane', 'creative'), 'creative');
  assert.equal(lowerMode('creative', 'insane'), 'creative');
  assert.equal(lowerMode('hard', 'easy'), 'easy');
  assert.equal(lowerMode('hard', 'hard'), 'hard');
  assert.equal(lowerMode(null, 'hard'), 'hard');
  assert.equal(lowerMode('hard', null), 'hard');
});

// ---- the floor, on a real player -------------------------------------------

test('adopting a mode sets the floor; it is not a switch', () => {
  // The title screen's choice, and a save being restored, both come through
  // setMode. Counting either as a switch would mark every run switched before
  // it began.
  const p = new Player();
  p.setMode('insane');
  assert.equal(p.mode, 'insane');
  assert.equal(p.modeFloor, 'insane', 'starting on Insane is an Insane run, not a Medium one');
  assert.equal(p.modeSwitched, false);
});

test('the floor only goes down: a Creative detour is not undone by putting Hard back', () => {
  const p = new Player();
  p.setMode('hard');
  p.setMode('creative');       // the fight you could not win
  p.setMode('hard');           // ...and back, as though nothing happened
  assert.equal(p.mode, 'hard', 'the LIVE mode is whatever was last chosen');
  assert.equal(p.modeFloor, 'creative', 'but the run is graded at its floor');
  assert.equal(p.modeSwitched, true);
});

test('a certificate is stamped with the floor, and says the mode moved', () => {
  const p = new Player();
  p.setMode('insane');
  p.setMode('easy');
  const s = p.modeStamp();
  assert.equal(s.mode, 'easy', 'the grade');
  assert.equal(s.modeSet, 'easy', 'and what it was actually on at the end');
  assert.equal(s.modeSwitched, true);
});

test('modeStamp survives being borrowed off a plain object', () => {
  // The same lesson as `modeHarm`: the death and departure paths are exercised
  // on stand-ins in ship.test.js and depart-mode.test.js, and a certificate
  // builder that throws when borrowed is one people route around.
  const stand = {
    die: Player.prototype.die, deaths: 0, name: 'X', gender: 'n', score: 0, skills: [],
    say() {}, maxHealth: 10, maxStamina: 10, maxFood: 10, spawnX: 0, spawnY: 0,
  };
  assert.doesNotThrow(() => stand.die({}, 'a test'));
  assert.equal(stand.deathCert.mode, DEFAULT_MODE);
});

// ---- the badge it earns -----------------------------------------------------

beforeEach(() => initAchievements({}));

test('a completion earns exactly one NOSTOS badge, the one for its floor', () => {
  const awards = achieveEvent('runCompleted', { mode: 'hard', modeSet: 'hard', modeSwitched: false });
  const nostos = awards.filter((a) => String(a.id).startsWith('nostos-'));
  assert.equal(nostos.length, 1);
  assert.equal(nostos[0].id, 'nostos-hard');
});

test('every mode has a badge, and no mode has two', () => {
  const byMode = MODES.map((m) => BADGES.filter(
    (b) => b.on.event === 'runCompleted' && b.on.when && b.on.when({ mode: m.key })));
  for (let i = 0; i < MODES.length; i++) {
    assert.equal(byMode[i].length, 1, `${MODES[i].key} should match exactly one NOSTOS badge`);
  }
});

test('the Creative detour earns the Creative badge, not the Insane one', () => {
  // The whole loophole, end to end: the player object decides the grade and the
  // engine only reads it.
  const p = new Player();
  p.setMode('insane');
  p.setMode('creative');
  p.setMode('insane');
  const awards = achieveEvent('runCompleted', p.modeStamp());
  assert.deepEqual(awards.filter((a) => String(a.id).startsWith('nostos-')).map((a) => a.id),
    ['nostos-creative']);
  assert.ok(!achieveProfile().badges['nostos-insane'], 'and Insane is NOT in the lifetime record');
});

test('the lifetime record keeps a completion after the run is gone', () => {
  achieveEvent('runCompleted', { mode: 'insane' });
  assert.ok(achieveProfile().badges['nostos-insane'],
    'the profile is where "has ever completed on Insane" lives; the run scope dies with the run');
});
