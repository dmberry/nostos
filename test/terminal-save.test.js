// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// SAVE AT A TERMINAL (task #93).
//
// Checkpoints used to be written only by the milestone ladder, so a careful
// hour on one island had nothing behind it: die in the fortress and you were
// back on the beach. `save` writes one wherever you are logged in.
//
// It is also the one command at a tower that a player who does not care about
// the language still wants, which is why it is on the banner: it is a reason to
// walk up to a terminal, and the rest of the console is sitting there when you
// do.
//
// Driven through runRonml and runUnix against stubs, so there is no world and
// no canvas. What main.js does with the call (refuse from a boat, refuse in the
// Backspace, write the stage) is its own business; asserted here is that the
// verb exists at each terminal, reaches the host, and is absent where it should
// be.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runRonml } from '../src/game/ai_ml.js';
import { runUnix, newShell, HOOK_COMMANDS } from '../src/game/unix.js';

function station(kind) {
  const calls = [];
  const ctx = { station: kind, session: {}, saveGame: () => calls.push(kind) };
  return { ctx, calls, run: (src) => runRonml(src, ctx) };
}

test('save reaches the host at every terminal that has one', () => {
  // Neutral, not station-tagged: an obelisk, a RON relay and the NostBook all
  // answer it. The laptop is the one that had to be argued for — it carries no
  // network verbs at all — but `save` needs no wire, only a place to stand.
  for (const kind of ['ob', 'hermes', 'laptop']) {
    const s = station(kind);
    const r = s.run('save');
    assert.equal(r.ok, true, `${kind}: ${r.text}`);
    assert.deepEqual(s.calls, [kind], `save did not reach the host at ${kind}`);
  }
});

test('a robot has no save', () => {
  // A unit's own program runs on the unit: no network, no files, and nothing
  // that writes the player's run. ROBOT_VERBS is the whole of what it may say.
  //
  // It does NOT refuse the word, and should not: inside a machine's own program
  // an unbound name is the intent the machine chose (`patrol`, `flee`), so the
  // language hands it back as a value. What must not happen is the word
  // reaching the host — assert on the host, not on ok.
  const r = runRonml('save', { station: 'robot', session: {}, saveGame: () => {
    assert.fail('a machine program must not be able to write a checkpoint');
  } });
  assert.equal(r.text, 'save', 'a robot reads it as an intent, not a command');
});

test('save composes, and its answer is unit', () => {
  // It is an ML verb rather than a command-menu entry, so it sequences with the
  // rest — `save ; scan` is a thing somebody will type.
  const s = station('ob');
  const r = s.run('(save ; save)');
  assert.equal(r.ok, true, r.text);
  assert.deepEqual(s.calls, ['ob', 'ob']);
});

test('save says so when the terminal cannot write one', () => {
  // A terminal with no saveGame is a host that has not wired it up. Refuse in
  // the language rather than throw past it.
  const r = runRonml('save', { station: 'ob', session: {} });
  assert.equal(r.ok, false);
  assert.match(r.text, /save/i);
});

test('the shell has save too, and it is a hook', () => {
  // The NostBook's shell is a different surface from its ML prompt, and a
  // player at a `%` prompt will type `save` rather than `ml` then `save`. It
  // is a hook because it acts on the run, not on the disk.
  assert.ok(HOOK_COMMANDS.includes('save'), 'save must be listed as a hook command');
  let seen = 0;
  const r = runUnix('save', newShell(), { save: () => { seen++; return { ok: true, text: 'OK' }; } });
  assert.equal(seen, 1, 'the dispatch chain never reached the save hook');
  assert.equal(r.text, 'OK');
});

test('a machine with no save hook says so rather than "not found"', () => {
  const r = runUnix('save', newShell(), {});
  assert.doesNotMatch(String(r.text || ''), /not found/);
});
