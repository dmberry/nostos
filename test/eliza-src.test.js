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

test('eliza.ml reads its input and can be left', () => {
  // The point of the file. A canned session that prints a fixed exchange and
  // exits looks identical in a screenshot and is not the same program.
  assert.match(ELIZA_PROGRAM, /readLine \(\)/, 'it must actually read');
  assert.match(ELIZA_PROGRAM, /session \(\)/, 'and loop');
  assert.match(ELIZA_PROGRAM, /"quit"/, 'and offer a way out');
});

// The replay contract the laptop driver depends on.
//
// There is no way to suspend a synchronous evaluator, so a program that reads
// is run again from the top with one more answer on the queue every time, and
// the console prints only what is past what it has already shown. Two things
// can go wrong and both did: the transcript can repeat itself from the
// beginning after every answer, or the last thing the program says can vanish
// because the finished run reports its output in a different shape from the
// suspended one (a single joined string rather than a list of lines).
test('replaying the conversation reads forwards and loses nothing', async () => {
  const { createInterpreter, joinProgram } = await import('../src/lang/index.js');
  const lines = (chunk, out) => {
    for (const part of (Array.isArray(chunk) ? chunk : [chunk])) {
      if (part == null) continue;
      for (const l of String(part).split('\n')) out.push(l);
    }
  };
  const run = (queue) => {
    const bml = createInterpreter({ printing: 'bare' });
    bml.loadPrelude();
    const ctx = { stdin: queue, stdinPos: 0 };
    const out = [];
    for (const { text: l } of joinProgram(ELIZA_PROGRAM)) {
      if (!l || l.startsWith('(*')) continue;
      const r = bml.run(l, ctx);
      if (r.needInput) { lines(r.out, out); return { needInput: true, out }; }
      assert.ok(!String(r.text).startsWith('ERR'), `${l} -> ${r.text}`);
      lines(r.text, out);
    }
    return { done: true, out };
  };

  const opening = run([]);
  assert.equal(opening.needInput, true, 'it must stop and wait for the first line');
  assert.ok(opening.out.some((l) => /please state your problem/i.test(l)));

  // Each round must be a strict extension of the one before it. That is what
  // makes "print everything past what you have shown" a correct rule.
  const answers = [];
  let prev = opening.out;
  for (const said of ['i am unhappy', 'my mother worried', 'quit']) {
    answers.push(said);
    const r = run([...answers]);
    assert.deepEqual(r.out.slice(0, prev.length), prev,
      `round ${answers.length} changed what came before it`);
    assert.ok(r.out.length > prev.length, `round ${answers.length} said nothing new`);
    prev = r.out;
  }
  assert.equal(prev.at(-1).includes('Goodbye'), true,
    'quit must reach the goodbye, not stop one line short of it');
});
