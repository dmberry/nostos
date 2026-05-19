// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MODES, DEFAULT_MODE, modeOf, isMode, hurtScale, easeApplies } from '../src/game/modes.js';

test('five modes, in the order they are offered', () => {
  assert.deepEqual(MODES.map((m) => m.key), ['creative', 'easy', 'medium', 'hard', 'insane']);
});

test('Medium is 1.0 across the board, and is the game as it was', () => {
  // Every other mode is measured against it, so there is no fifth set of
  // numbers nobody has ever played. A save from before modes is a Medium run.
  const m = modeOf('medium');
  assert.equal(m.hurt, 1);
  assert.equal(m.hunger, 1);
  assert.equal(m.pressure, 1);
  assert.equal(m.clock, 1);
  assert.equal(DEFAULT_MODE, 'medium');
});

test('the difficulty is monotonic — no mode is easier than one below it', () => {
  const ordered = ['easy', 'medium', 'hard', 'insane'].map(modeOf);
  for (let i = 1; i < ordered.length; i++) {
    for (const k of ['hurt', 'hunger', 'pressure', 'clock']) {
      assert.ok(ordered[i][k] > ordered[i - 1][k],
        `${ordered[i].name}.${k} (${ordered[i][k]}) must exceed ${ordered[i - 1].name}'s (${ordered[i - 1][k]})`);
    }
  }
});

test('Creative takes NO damage, rather than a little', () => {
  // "Almost nothing" is a mode where a long enough fight still kills you, and
  // that is not what it says on the tin.
  assert.equal(hurtScale('creative'), 0);
  assert.equal(modeOf('creative').creative, true);
  // And it is the only one that sets the flag.
  assert.equal(MODES.filter((m) => m.creative).length, 1);
});

test('only Insane refuses the beginner easing', () => {
  assert.equal(easeApplies('insane'), false);
  for (const k of ['creative', 'easy', 'medium', 'hard']) assert.equal(easeApplies(k), true);
});

test('an unknown mode is Medium, never a crash', () => {
  assert.equal(modeOf('nonsense').key, 'medium');
  assert.equal(modeOf(undefined).key, 'medium');
  assert.equal(modeOf(null).key, 'medium');
  assert.equal(isMode('hard'), true);
  assert.equal(isMode('HARD'), true, 'the key is compared case-insensitively');
  assert.equal(isMode('nonsense'), false);
});

test('every mode says what it does, in a sentence', () => {
  for (const m of MODES) {
    assert.ok(m.name && m.blurb && m.detail, `${m.key} needs a name, a blurb and a detail`);
    assert.ok(m.blurb.length < 90, `${m.key}'s blurb should fit a line`);
  }
});

test('the player adopts a mode and derives creative from it', async () => {
  const { Player } = await import('../src/game/player.js');
  const p = new Player();
  assert.equal(p.mode, 'medium');
  assert.equal(p.creative, false);
  p.setMode('creative');
  assert.equal(p.creative, true, 'creative is derived, not set beside the mode');
  p.setMode('hard');
  assert.equal(p.creative, false);
  p.setMode('rubbish');
  assert.equal(p.mode, 'medium', 'a bad key falls back rather than breaking a run');
});

test('the mode scales what a blow costs', async () => {
  const { Player } = await import('../src/game/player.js');
  const hit = (key) => {
    const p = new Player();
    p.setMode(key);
    p.takeDamage(20, 'test');
    return 100 - p.health;
  };
  assert.equal(hit('creative'), 0, 'nothing can hurt you');
  assert.ok(hit('easy') < hit('medium'));
  assert.ok(hit('hard') > hit('medium'));
  assert.ok(hit('insane') > hit('hard'));
});

test('Insane does not ease the opening minutes', async () => {
  const { Player } = await import('../src/game/player.js');
  const p = new Player();
  p.playSeconds = 10;          // well inside the easing window
  p.distanceTraveled = 0;      // and clearly not moving: maximum easing
  p.setMode('medium');
  assert.ok(p.threatEase() < 1, 'Medium eases a player who is still finding the controls');
  p.setMode('insane');
  assert.equal(p.threatEase(), 1, 'Insane is the mode from the first second');
});

// ---- Creative must mean what it says --------------------------------------
// It blocked combat damage and nothing else. Four sites wrote `this.health`
// directly — starvation, venom, swimming, the penknife — and none of them
// consulted the mode, so a player in the one mode whose whole promise is
// "nothing can hurt you" drowned on the beach (David, 2026-08-15: "creative
// mode doesn't work. I got killed almost immediately").

test('nothing at all can hurt you in Creative', async () => {
  const { Player } = await import('../src/game/player.js');
  const p = new Player();
  p.setMode('creative');
  // Every route to a lower `health` in the whole class goes through `harm` or
  // `takeDamage`, and both answer zero.
  assert.equal(p.harm(999), 0, 'attrition — starving, venom, the cold sea');
  p.takeDamage(999, 'machine');
  assert.equal(p.health, 100, 'and a blow');
});

test('the attrition funnel scales with the mode, like a blow does', async () => {
  const { Player } = await import('../src/game/player.js');
  const scale = (key) => { const p = new Player(); p.setMode(key); return p.harm(10); };
  assert.equal(scale('creative'), 0);
  assert.ok(scale('easy') < scale('medium'), 'starving on Easy costs less');
  assert.ok(scale('hard') > scale('medium'));
  assert.ok(scale('insane') > scale('hard'), 'starving on Insane costs what being shot on Insane costs');
});

test('no route to lower health bypasses the mode', async () => {
  // A structural check, because the bug was not in the funnel — it was in the
  // four places that never went near it. Any NEW `this.health -=` or
  // `this.health = ... - ...` in player.js must go through `harm`.
  const fs = await import('node:fs');
  const url = await import('node:url');
  const src = fs.readFileSync(
    url.fileURLToPath(new URL('../src/game/player.js', import.meta.url)), 'utf8');
  const bad = [];
  src.split('\n').forEach((line, i) => {
    if (!/this\.health\s*(-=|=[^=])/.test(line)) return;
    if (/modeHarm\(this,/.test(line)) return;          // through the funnel
    // Heals and resets take health UP, which no mode needs to scale.
    if (/this\.health\s*=\s*(100|0|this\.maxHealth|Math\.min\(this\.maxHealth)/.test(line)) return;
    if (/this\.health\s*-=\s*amount;/.test(line)) return;  // takeDamage, already scaled above
    bad.push(`player.js:${i + 1}  ${line.trim()}`);
  });
  assert.deepEqual(bad, [],
    'These take health without asking the game mode, so Creative does not protect against them:\n  '
    + bad.join('\n  '));
});

test('in Creative the machines do not come for you at all', async () => {
  const { Player } = await import('../src/game/player.js');
  const p = new Player();
  p.setMode('creative');
  assert.equal(p.unseenByMachines(), true,
    'Creative is not a target — update() assigns invisibleToRobots from this, and every '
    + 'sensing site in robots.js reads that flag');
  p.setMode('medium');
  assert.equal(p.unseenByMachines(), false, 'and every other mode is hunted normally');
  // The other three ways to be nobody still work, so Creative joined them
  // rather than replacing them.
  p.terminalSafe = true;
  assert.equal(p.unseenByMachines(), true, 'jacked into a terminal');
});
