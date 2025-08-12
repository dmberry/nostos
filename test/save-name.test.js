// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// `save <name>` at a terminal. The name is typed by a player and then rendered
// into the gate's list as HTML and used to key a store, so these hold the two
// things that matters: it comes out readable, and it cannot carry markup in.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runUnix, makeDisk } from '../src/game/unix.js';
import { checkpointName as saveName, saveStageId } from '../src/game/stages.js';

// The shell has to hand the whole phrase over, not the first word of it.
test('every word after the verb reaches the hook', () => {
  const env = { cwd: ['home'], disk: makeDisk() };
  let got = null;
  runUnix('save before the fortress', env, { save: (a) => { got = a; return { ok: true, text: '' }; } });
  assert.deepEqual(got, ['before', 'the', 'fortress']);
});

test('a bare save still reaches the hook with nothing', () => {
  const env = { cwd: ['home'], disk: makeDisk() };
  let got = 'not called';
  runUnix('save', env, { save: (a) => { got = a; return { ok: true, text: '' }; } });
  assert.deepEqual(got, []);
});

test('a typed name is tidied but left recognisable', () => {
  assert.equal(saveName('  before   the fortress '), 'before the fortress');
  assert.equal(saveName('"got the key"'), 'got the key');
  // Quotes typed with a space in front of them. The anchors only matched a
  // string that already started with the quote, so both survived.
  assert.equal(saveName('  "before   the fortress" '), 'before the fortress');
  assert.equal(saveName(''), '');
  assert.equal(saveName(undefined), '');
});

test('a name cannot carry markup into the gate list', () => {
  // The load list renders the label straight into innerHTML. A name is the one
  // string on that screen a player wrote, so it is the one that has to be safe.
  assert.equal(saveName('<img src=x onerror=alert(1)>'), '');
  // A whole tag goes, brackets and all. Taking out only the brackets left
  // `<b>x</b>` as `bx/b`, which is neither markup nor a name.
  assert.equal(saveName('<b>bold</b>'), 'bold');
  assert.equal(saveName('a & b'), 'a b');
});

test('a very long name is cut, so it cannot push the score off the row', () => {
  assert.equal(saveName('x'.repeat(80)).length, 28);
});

test('a named save gets its own slot; an unnamed one is per island', () => {
  assert.equal(saveStageId('ithaca', ''), 'save-ithaca');
  assert.equal(saveStageId('ithaca', 'before the fortress'), 'save-ithaca-before-the-fortress');
  // Two different names on one island must not collide, or naming them was
  // pointless: the second would silently replace the first.
  assert.notEqual(saveStageId('ithaca', 'before'), saveStageId('ithaca', 'after'));
  // And punctuation must not leave a key with a dash hanging off the end.
  assert.equal(saveStageId('ithaca', '  got the key!  '), 'save-ithaca-got-the-key');
});
