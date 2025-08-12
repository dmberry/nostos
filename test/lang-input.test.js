// BML — a 2026 Standard ML. Part of NostOS; synced to the BML repository.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// readLine, and what happens when there is nothing to read.
//
// The contract these hold the language to: a queued line comes back as a
// string, the cursor advances across LINES of a program rather than resetting
// per declaration, and running off the end is reported as a suspension the
// caller can recognise (`needInput`) rather than as a message it would have to
// match on the text of.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInterpreter } from '../src/lang/index.js';

const fresh = () => {
  const bml = createInterpreter({ printing: 'bare' });
  bml.loadPrelude();
  return bml;
};

test('readLine takes the next queued line', () => {
  const bml = fresh();
  const ctx = { stdin: ['first'], stdinPos: 0 };
  const r = bml.run('echo (readLine ())', ctx);
  assert.ok(r.ok, r.text);
  assert.match(r.text, /first/);
});

test('the cursor carries from one line of a program to the next', () => {
  const bml = fresh();
  // One ctx across three runs, as a file gives the interpreter one declaration
  // at a time. A cursor reset per declaration hands line three the answer that
  // belonged to line one, which is the bug this exists to catch.
  const ctx = { stdin: ['one', 'two', 'three'], stdinPos: 0 };
  assert.match(bml.run('val a = readLine ()', ctx).text, /one/);
  assert.match(bml.run('val b = readLine ()', ctx).text, /two/);
  assert.match(bml.run('val c = readLine ()', ctx).text, /three/);
  assert.equal(ctx.stdinPos, 3);
});

test('running off the end suspends rather than failing', () => {
  const bml = fresh();
  const r = bml.run('echo (readLine ())', { stdin: [], stdinPos: 0 });
  assert.equal(r.ok, false);
  assert.equal(r.needInput, true, 'a run that wants input must say so as a flag');
});

test('a suspended run hands back the output it managed first', () => {
  const bml = fresh();
  // The console has to print what the program said BEFORE it stopped to ask,
  // or a prompt arrives with no question in front of it.
  const r = bml.run('(echo "what is your name?"; echo (readLine ()))', { stdin: [], stdinPos: 0 });
  assert.equal(r.needInput, true);
  assert.deepEqual(r.out, ['what is your name?']);
});

test('with no queue at all, readLine suspends and does not return ""', () => {
  const bml = fresh();
  const r = bml.run('echo (readLine ())', {});
  assert.equal(r.needInput, true);
});

test('TextIO.inputLine wraps the line in SOME and puts the newline back', () => {
  const bml = fresh();
  const ctx = { stdin: ['typed'], stdinPos: 0 };
  const r = bml.run('val got = case TextIO.inputLine TextIO.stdIn of SOME s => s | NONE => "none"', ctx);
  assert.ok(r.ok, r.text);
  assert.ok(r.text.includes('typed\n'),
    `the newline SML puts on the end must be there, got ${JSON.stringify(r.text)}`);
});

test('a camelCase builtin is reachable in a host that folds case', async () => {
  // NostOS folds — its terminal has always taken `IF` as `if` — so it looks a
  // name up as nameKey(name). A builtin whose key has a capital in it was
  // therefore unfindable: `readLine` was looked up as `readline` and missed.
  // BML does not fold, so the same primitive worked at the CLI and was
  // invisible in the game, and the two disagreed about what a name is.
  const { setNameFold } = await import('../src/lang/names.js');
  setNameFold(true);
  try {
    const bml = createInterpreter({ printing: 'bare' });
    bml.loadPrelude();
    const r = bml.run('echo (readLine ())', { stdin: ['typed'], stdinPos: 0 });
    assert.ok(r.ok, r.text);
    assert.match(r.text, /typed/);
  } finally {
    setNameFold(false);
  }
});
