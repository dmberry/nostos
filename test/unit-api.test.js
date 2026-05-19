// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// S8 — the unit API (docs/PLAN.md). get/fetch are the read
// half over the same wire post writes on. These cover the shell command's
// plumbing (card/up gate, argument passing, redirect) and the ML builtin's
// reachability contract; the getResource resolver itself is DOM-bound (webHosts
// / findHost) and is verified in the browser.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runUnix, newShell } from '../src/game/unix.js';
import { runRonml, loadPrelude } from '../src/game/ai_ml.js';

// A booted NostBook shell with the wireless card up. newShell (not a
// hand-built env) so the disk has the shape writeFile and cat expect.
function laptopEnv() {
  const sh = newShell();
  sh.net = { card: true, up: true, iface: 'wifi0' };
  return sh;
}

test('get hands its address and path straight to the hook', () => {
  const env = laptopEnv();
  let seen = null;
  runUnix('get 10.3.4.7 program.ml', env, { get: (a) => { seen = a.map(String); return { ok: true, text: 'x' }; } });
  assert.deepEqual(seen, ['10.3.4.7', 'program.ml']);
});

test('get needs the card up, like post', () => {
  const down = laptopEnv(); down.net.up = false;
  const r = runUnix('get 10.3.4.7', down, { get: () => ({ ok: true, text: 'x' }) });
  assert.equal(r.ok, false);
  assert.match(r.text, /wifi0 is down/);
  const noCard = laptopEnv(); noCard.net = { card: false };
  assert.match(runUnix('get x', noCard, { get: () => ({ ok: true, text: '' }) }).text, /no network card/);
});

test('get redirects its output to a file, so the read-write loop is scriptable', () => {
  const env = laptopEnv();
  const prog = '(* fetched *)\nif threat then hunt else patrol';
  runUnix('get 10.3.4.7 > download/u.ml', env, { get: () => ({ ok: true, text: prog }) });
  const back = runUnix('cat download/u.ml', env, {});
  assert.equal(back.text, prog, 'the fetched program landed on the disk');
});

test('fetch at the laptop returns the served string; "" means unreachable', () => {
  const ctx = { station: 'laptop', session: {}, fetchResource: (a) => (a === 'up' ? 'PROG' : '') };
  loadPrelude(ctx);
  assert.equal(runRonml('fetch "up"', ctx).text, 'PROG');
  assert.equal(runRonml('fetch "gone"', ctx).text, '');
  // the reachability idiom a program actually uses
  assert.equal(runRonml('if fetch "up" <> "" then "y" else "n"', ctx).text, 'y');
});

test('fetch is refused at a robot station — a unit does not call the network', () => {
  const ctx = { station: 'robot', session: {} };
  loadPrelude(ctx);
  assert.ok(runRonml('fetch "x"', ctx).text.startsWith('ERR'));
});
