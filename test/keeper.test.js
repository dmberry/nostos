// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE FILE HAS TO CONTAIN THE PROGRAM THAT ACTUALLY WORKS.
//
// keeping.ml is the only place in the world that teaches the refunction. If the
// verb's shape ever changes and this file does not, the game keeps a lesson
// that no longer runs — and it would still read perfectly well, which is what
// makes it worth a test rather than a proofread.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keeperLs, keeperRead, keeperIsDir, KEEPER_FILES } from '../src/game/keeper.js';
import { runRonml } from '../src/game/ai_ml.js';

test('the store has a folder in it, and the folder has the file', () => {
  assert.ok(keeperLs('').includes('handover/'));
  assert.equal(keeperIsDir('', 'handover'), true);
  assert.ok(keeperLs('handover').includes('keeping.ml'));
  assert.equal(keeperIsDir('handover', 'keeping.ml'), false);
});

test('every name listed anywhere in the tree can be read or entered', () => {
  // A listing that names a file nothing can open is the stale-list defect in
  // its purest form: `ls` promises, `read` denies.
  for (const [sub, names] of [['', keeperLs('')], ['handover', keeperLs('handover')]]) {
    for (const n of names) {
      if (n.endsWith('/')) assert.ok(keeperIsDir(sub, n.slice(0, -1)), `${n} listed but not a folder`);
      else assert.ok(keeperRead(sub, n), `${sub}/${n} listed but has no text`);
    }
  }
});

test('nothing outside the tree can be read', () => {
  assert.equal(keeperRead('', 'keeping.ml'), null, 'the file is one folder down, not at the root');
  assert.equal(keeperRead('handover', 'nothing.ml'), null);
  assert.equal(keeperRead('../..', 'items.js'), null);
});

test('the program in keeping.ml RUNS, and stands the guards down', () => {
  const text = KEEPER_FILES['handover/keeping.ml'];
  const m = text.match(/let val k = decrypt aikey[\s\S]*?\bend/);
  assert.ok(m, 'keeping.ml no longer contains a let-program at all');
  let called = false;
  const ctx = {
    station: 'ob',
    session: {},
    hasAiKey: () => true,
    bindSession(name, val) { this.session[name] = val; },
    retire: () => { called = true; },
  };
  const r = runRonml(`copy aikey; ${m[0]}`, ctx);
  assert.ok(r.ok, r.text);
  assert.equal(called, true, 'the file teaches a program the game refuses');
});

test('the file does not give the answer away as a bare word', () => {
  const text = KEEPER_FILES['handover/keeping.ml'];
  assert.doesNotMatch(text, /^\s*retire\s*$/m, 'the six-letter version must not be back in the world');
});

test('`read` answers at a tower as well as at a relay', () => {
  // It was tagged 'hermes' only, so the store could be listed and not opened.
  for (const station of ['ob', 'hermes']) {
    let got = null;
    const r = runRonml('read keeping.ml', { station, session: {}, read: (n) => { got = n; } });
    assert.ok(r.ok, `${station}: ${r.text}`);
    assert.equal(got, 'keeping.ml', `read did not reach the ${station} console`);
  }
});

test('a machine still has no `read`', () => {
  // Tagging it for two stations must not quietly untag it for the third.
  const r = runRonml('read keeping.ml', { station: 'robot', session: {}, read: () => {} });
  assert.ok(!r.ok, 'a unit answering `read` means the station list stopped filtering');
});

test('a HERMES `print` takes a number as well as a topic', () => {
  // The membership check texts four digits and asks for them back. 3689 lexes
  // as an int, not an atom, so a print that read only `.id` handed the relay an
  // empty string and it answered "No document" about a code it had just sent.
  const got = [];
  const ctx = { station: 'hermes', session: {}, printDoc: (t) => got.push(t) };
  assert.ok(runRonml('print 3689', ctx).ok);
  assert.ok(runRonml('print history', ctx).ok);
  assert.deepEqual(got, ['3689', 'history']);
});
