// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE OBELISK CONTROL VERBS (docs/PLAN.md).
//
// `unlock` was the only thing a decrypted AI key was for, which made the most
// laborious object in the game single-use. These five reach the island as a
// system rather than one node at a time, and they all want that same key.
//
// Driven through runRonml against a stub ctx, so there is no world and no
// canvas: what is asserted is that the verb reaches the right ctx method with
// the right argument, and refuses cleanly when it should.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runRonml } from '../src/game/ai_ml.js';

function station() {
  const calls = [];
  const ctx = {
    station: 'ob',
    session: {
      d: { tag: 'key', kind: 'aikey', enc: false },      // decrypt aikey
      sealed: { tag: 'key', kind: 'aikey', enc: true },  // copy aikey, undecrypted
      node: { tag: 'key', kind: 'node', id: 'OB_1A2B' }, // hack OB_1A2B
    },
    setFog: (l) => calls.push(['fog', l]),
    setPurge: (on) => calls.push(['purge', on]),
    setRobots: (on) => calls.push(['robots', on]),
    setSharedSight: (on) => calls.push(['net', on]),
    setBlight: (on) => calls.push(['spread', on]),
    currentNode: () => 'OB_1A2B',
    listObelisks: () => ['OB_1A2B'],
  };
  return { ctx, calls, run: (src) => runRonml(src, ctx) };
}

test('every control verb needs the AI key, and decrypted', () => {
  for (const [src, verb] of [
    ['fog HIGH', 'fog'], ['poseidon DOWN', 'poseidon'], ['robots OFF', 'robots'],
    ['net OFF', 'net'], ['spread STOP', 'spread'],
  ]) {
    const s = station();
    const bare = s.run(src);
    assert.equal(bare.ok, false, `${src} must not run without a key`);
    assert.match(bare.text, /decrypted AI key/, `${verb} should name what it wants`);

    const sealed = s.run(`${src} sealed`);
    assert.equal(sealed.ok, false, `${src} must refuse a sealed key`);
    assert.match(sealed.text, /still sealed/);

    // A NODE key is not an AI key: `hack` gives one and it is the wrong shape.
    const wrong = s.run(`${src} node`);
    assert.equal(wrong.ok, false, `${src} must refuse a node key`);
    assert.equal(s.calls.length, 0, 'and nothing reached the world');
  }
});

test('a setting is a bare word or a string, either case', () => {
  const s = station();
  for (const src of ['fog HIGH d', 'fog high d', 'fog "LOW" d', 'fog clear d']) {
    assert.equal(s.run(src).ok, true, src);
  }
  assert.deepEqual(s.calls, [['fog', 'high'], ['fog', 'high'], ['fog', 'low'], ['fog', 'clear']]);
});

test('an unknown setting is named back rather than ignored', () => {
  const s = station();
  const r = s.run('fog PURPLE d');
  assert.equal(r.ok, false);
  assert.match(r.text, /high \| low \| clear/, 'it lists what it does take');
  assert.equal(s.calls.length, 0);
});

test('each verb reaches its own switch', () => {
  const s = station();
  s.run('fog HIGH d');
  s.run('poseidon DOWN d');
  s.run('poseidon UP d');
  s.run('robots OFF d');
  s.run('robots ON d');
  s.run('net OFF d');
  s.run('spread STOP d');
  s.run('spread GO d');
  assert.deepEqual(s.calls, [
    ['fog', 'high'],
    ['purge', false], ['purge', true],
    ['robots', false], ['robots', true],
    ['net', false],
    ['spread', false], ['spread', true],
  ]);
});

test('they compose like anything else in the language', () => {
  // The key is a value, so it binds once and serves every verb after it —
  // which is the whole reason these are ML verbs and not a command menu.
  const s = station();
  const r = s.run('let k = d in (fog CLEAR k; robots OFF k; poseidon DOWN k)');
  assert.equal(r.ok, true, r.text);
  assert.deepEqual(s.calls, [['fog', 'clear'], ['robots', false], ['purge', false]]);
});

test('the console help fits the console', () => {
  // The obelisk screen is about 66 characters wide and a wrapped line restarts
  // at column 0, so one long description takes the whole list apart. Grouping
  // the verbs (v1.339) did not fix that on its own: 24 of 49 lines still
  // overflowed, mostly because every row carried a `[needs a decrypted AI key]`
  // tag on the end. The gate moved to `help <verb>`, which has a screen to
  // itself, and the descriptions were cut to fit.
  const WIDTH = 66;
  for (const station of ['ob', 'hermes']) {
    const text = runRonml('help', { station, session: {} }).text;
    const over = text.split('\n').filter((l) => l.length > WIDTH);
    assert.deepEqual(over, [],
      `these ${station} help lines wrap: ${over.map((l) => `${l.length}: ${l.trim()}`).join(' / ')}`);
  }
});

test('no two verbs share a description', () => {
  // Shortening the list keyed on the verb NAME, and `copy k` and `copy f d` are
  // two different commands, so they ended up with one description between them
  // — a list that says the same thing twice teaches nothing the second time.
  const text = runRonml('help', { station: 'ob', session: {} }).text;
  const descs = text.split('\n')
    .filter((l) => /^ {2}\*?[a-z]/.test(l) && l.length > 16)
    .map((l) => l.slice(16).trim())
    .filter(Boolean);
  const seen = new Map();
  for (const d of descs) seen.set(d, (seen.get(d) || 0) + 1);
  const dupes = [...seen].filter(([, n]) => n > 1).map(([d]) => d);
  assert.deepEqual(dupes, [], `repeated in the verb list: ${dupes.join(' / ')}`);
});


// WHICH VERBS WEAR THE STAR.
//
// The reference shows imperative verbs in their BBC-Micro command form (`*scan`,
// `*print map`) and leaves the composable ones bare. The split is not decoration
// — a `*` command's arguments are LITERALS, so marking a verb that needs a value
// you bound earlier would print a form that cannot run.
//
// Two rules, and every verb in the table obeys one of them:
//   BARE if it takes a bound value (crash needs a key from hack), or if what it
//        hands back is what you came for (hack, decrypt, copy, cd, ls, eliza,
//        forge).
//   STAR otherwise: you type it with literal arguments, or none, and read what
//        it says.
//
// `forge` sat on the wrong side of that until v1.345, with the same `file ->
// file` signature as `eliza` two lines above it.
test('the star marks the verbs you can actually type that way', () => {
  const marking = {};
  for (const station of ['ob', 'hermes']) {
    for (const line of runRonml('help', { station, session: {} }).text.split('\n')) {
      const m = line.match(/^ {2}(\*?)([a-z]+)(?:\s|$)/);
      if (m && m[2].length > 1) marking[m[2]] = !!m[1];
    }
  }
  // Takes a value bound earlier: a literal-argument form cannot express it.
  for (const v of ['crash', 'unlock', 'fog', 'poseidon', 'robots', 'net', 'spread', 'nearest']) {
    assert.equal(marking[v], false, `${v} needs a bound value and must not be shown as *${v}`);
  }
  // Hands something back, and the answer is the point.
  for (const v of ['hack', 'decrypt', 'copy', 'cd', 'ls', 'eliza', 'forge']) {
    assert.equal(marking[v], false, `${v} returns a value you use, so it stays bare`);
  }
  // Type it and read it. Arity 0 or literal arguments only.
  for (const v of ['scan', 'keys', 'name', 'timer', 'map', 'print', 'sleep', 'rewind', 'repel',
    'loop', 'retire', 'explorer', 'drives', 'save', 'read', 'archive', 'records', 'drive',
    'backup', 'restore']) {
    assert.equal(marking[v], true, `${v} is an imperative command and should read as *${v}`);
  }
});

test('eliza and forge are marked the same way', () => {
  // They have the same signature (file -> file), the same shape of use (a
  // literal filename in, a file on the device out), and are two lines apart.
  const text = runRonml('help', { station: 'ob', session: {} }).text
    + runRonml('help', { station: 'hermes', session: {} }).text;
  const star = (v) => new RegExp(`^ {2}\\*${v}\\b`, 'm').test(text);
  assert.equal(star('eliza'), star('forge'), 'eliza and forge disagree about the star');
});
