// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The listing on the laptop is rendered from the table the bot dispatches on,
// so it cannot go stale by hand. What it CAN do is stop rendering: a change to
// the shape of a rule that quietly drops entries, or a wildcard that stops
// being translated. These assert the generated file still describes the whole
// table, and that the notation is the one the readme says it is.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCRIPT, REFLECTIONS } from '../src/game/eliza.js';
import { DOCTOR_SCRIPT, DOCTOR_TABLES, ELIZA_PROGRAM } from '../src/game/eliza-src.js';

test('the listing holds every keyword the bot dispatches on', () => {
  for (const entry of SCRIPT) {
    assert.ok(DOCTOR_SCRIPT.includes(`(${entry.key.toUpperCase()} ${entry.rank}`),
      `${entry.key} is in the script table but not in the listing`);
  }
});

test('the listing holds every reassembly, and no * survives translation', () => {
  const total = SCRIPT.reduce((n, e) => n + e.rules.reduce((m, r) => m + r.reasmb.length, 0), 0);
  // Every reassembly is one bracketed line; the rule and keyword lines account
  // for the rest, so the count of '(' lines must be at least the reassemblies.
  const brackets = DOCTOR_SCRIPT.split('\n').filter((l) => /^\s+\(/.test(l)).length;
  assert.ok(brackets >= total, `${brackets} bracketed lines for ${total} reassemblies`);
  assert.ok(!/^\s*\(\(.*\*/m.test(DOCTOR_SCRIPT), 'a * reached the listing; the wildcard should render as 0');
});

test('the reflection table is rendered whole', () => {
  for (const [a, b] of Object.entries(REFLECTIONS)) {
    assert.ok(DOCTOR_TABLES.includes(a.toUpperCase()) && DOCTOR_TABLES.includes(b.toUpperCase()),
      `${a} -> ${b} missing from the reflect table`);
  }
});

test('eliza.ml calls only names this ML has', () => {
  // `drop` is not bound at top level; it is List.drop. This caught the first
  // draft, which ran fine as prose and stopped dead at the prompt.
  assert.ok(!/\bdrop \(/.test(ELIZA_PROGRAM.replace(/List\.drop/g, '')),
    'eliza.ml calls a bare drop; it must be List.drop');
});

test('eliza.ml is a conversation program: reply in, no loop', () => {
  // The convention the console drives: one line in, one answer out, and the
  // loop is the console's. A session loop in the file would suspend the load.
  assert.match(ELIZA_PROGRAM, /fun reply said/, 'it must define reply');
  assert.match(ELIZA_PROGRAM, /"quit"/, 'and answer quit with the goodbye');
  assert.ok(!/session \(\)/.test(ELIZA_PROGRAM), 'the loop belongs to the console now');
});

// The protocol the console drives. Load the file's declarations into one
// interpreter, then call reply once per line with the line queued as stdin —
// the exact constant source the laptop evaluates. The line rides the queue as
// a raw string, so quotes and backslashes in it must be boring.
test('reply answers turn by turn through the stdin queue', async () => {
  const { createInterpreter, joinProgram } = await import('../src/lang/index.js');
  const bml = createInterpreter({ printing: 'bare' });
  bml.loadPrelude();
  for (const { text: l } of joinProgram(ELIZA_PROGRAM)) {
    if (!l || l.startsWith('(*')) continue;
    const r = bml.run(l, {});
    assert.ok(r.ok, `${l.slice(0, 48)} -> ${r.text}`);
  }
  const say = (line) => bml.run('reply (readLine ())', { stdin: [line], stdinPos: 0 });

  const a = say('i am unhappy about the machines');
  assert.ok(a.ok, a.text);
  assert.match(a.text, /how long have you been unhappy about the machines/i);

  assert.match(say('my mother worried too').text, /family/i);

  // The transport must make punctuation boring: this is a whole line with a
  // quoted phrase and a backslash in it, and it must arrive as characters.
  const tricky = say('she said "be careful" \\ always');
  assert.ok(tricky.ok, tricky.text);

  assert.match(say('quit').text, /goodbye/i);
});

// State is real between turns: the session persists, so a program may keep a
// ref at top level and read it from reply. Replay could never offer this — it
// rebuilt the world each time — and it is half the reason for the protocol.
test('a ref survives from one reply call to the next', async () => {
  const { createInterpreter } = await import('../src/lang/index.js');
  const bml = createInterpreter({ printing: 'bare' });
  bml.loadPrelude();
  assert.ok(bml.run('val count = ref 0', {}).ok);
  assert.ok(bml.run('fun reply said = (count := !count + 1; makestring (!count))', {}).ok);
  const say = (line) => bml.run('reply (readLine ())', { stdin: [line], stdinPos: 0 }).text;
  assert.equal(say('a'), '1');
  assert.equal(say('b'), '2');
  assert.equal(say('c'), '3');
});
