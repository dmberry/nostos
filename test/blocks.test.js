// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #187 — blocks as gear: a tool in hand to break, and what comes off it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HARDNESS, TOOL_TIER, tierOf, breakRule, dropOf, isPlaceable } from '../src/game/blocks.js';
import { FLOORS } from '../src/game/tiles.js';
import { GameMap } from '../src/game/map.js';
import { applyBuild } from '../src/game/build.js';

test('every hardness names a material the game has', () => {
  for (const mat of Object.keys(HARDNESS)) {
    assert.ok(FLOORS[mat], `${mat} has a hardness but is not a material`);
    assert.ok(HARDNESS[mat].secs > 0);
    assert.ok(HARDNESS[mat].tier >= 0 && HARDNESS[mat].tier <= 2);
  }
});

test('THE LADDER IS THREE RUNGS AND EARTH IS THE BOTTOM OF IT', () => {
  // Bare hands take soil and sand; a blade takes boards and glass; stone wants
  // something heavy. Short on purpose — three rungs a player can hold in their
  // head against a list of six materials.
  assert.equal(tierOf(null), 0);
  assert.equal(tierOf('nonsense'), 0);
  assert.ok(tierOf('bronze_axe') >= 1);
  assert.ok(tierOf('robot_sword') >= 2);

  assert.equal(breakRule('dirt', null).ok, true, 'hands take earth');
  assert.equal(breakRule('boards', null).ok, false, 'but not planks');
  assert.equal(breakRule('boards', 'bronze_axe').ok, true);
  assert.equal(breakRule('stone', 'bronze_axe').ok, false, 'and not cut stone');
  assert.equal(breakRule('stone', 'robot_sword').ok, true);
});

test('a refusal says what would do it', () => {
  // "You cannot break that" teaches a player nothing; naming the tool teaches
  // them the ladder exists.
  assert.match(breakRule('boards', null).why, /blade|bar/);
  assert.match(breakRule('stone', 'bronze_axe').why, /heavy/);
});

test('a better tool is faster, but only by so much', () => {
  const right = breakRule('stone', 'robot_sword').secs;
  const bare = HARDNESS.stone.secs;
  assert.ok(right <= bare);
  assert.ok(right > bare / 4, 'the point of the better tool is reach, not a stopwatch');
});

test('what comes off: itself, mostly', () => {
  assert.equal(dropOf('stone'), 'stone', 'a wall you took down is a wall you can put up');
  assert.equal(dropOf('boards'), 'boards');
  assert.equal(dropOf('grass'), 'dirt', 'grass breaks to the soil under it');
  assert.equal(dropOf('glass'), null, 'and glass breaks to nothing');
});

test('an unlisted material is soft and is not carried', () => {
  assert.equal(breakRule('stream', null).ok, true);
  assert.equal(isPlaceable('stream'), false);
  assert.equal(isPlaceable('stone'), true);
});

// ---- and how build.js uses it ----------------------------------------------

test('CREATIVE IS UNCHANGED: no tool asked for, nothing kept', () => {
  // build.js says, and means, that Creative has no economy. Passing no `held`
  // must behave exactly as it did before any of this existed.
  const m = new GameMap(12, 12, 'grass');
  applyBuild(m, 4, 4, 'stone');
  const r = applyBuild(m, 4, 4, 'erase');
  assert.equal(r.ok, true);
  assert.equal(r.drop, null, 'and nothing comes off in your hands');
});

test('with a tool in hand the material decides, and the pack fills', () => {
  const m = new GameMap(12, 12, 'grass');
  applyBuild(m, 4, 4, 'stone');
  const got = [];
  const pack = { stow: (k, n) => { got.push([k, n]); return n; } };

  const bare = applyBuild(m, 4, 4, 'erase', { held: null, pack });
  assert.equal(bare.ok, false, 'bare hands do not take cut stone');
  assert.deepEqual(got, [], 'and nothing reached the pack');

  const armed = applyBuild(m, 4, 4, 'erase', { held: 'robot_sword', pack });
  assert.equal(armed.ok, true);
  assert.equal(armed.drop, 'stone');
  assert.deepEqual(got, [['block_stone', 1]]);
});

test('the ground is still not yours to dig, tool or no tool', () => {
  const m = new GameMap(12, 12, 'grass');
  const pack = { stow: () => 1 };
  assert.equal(applyBuild(m, 6, 6, 'erase', { held: 'robot_sword', pack }).ok, false);
});
