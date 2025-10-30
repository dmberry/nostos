// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// `tag` — an operator label hung on a unit or tower so four identical T-1s can
// be told apart on the wire and the right one gets the program. Set three ways
// (the obelisk console verb, the NostBook shell command, the sniffer scope);
// read back everywhere the network is queried. These cover the pure-module
// halves: the label riding hostTable into the pages and arp, the console verb,
// and the shell dispatch. The in-world plumbing (tagEntity, the radar UI) lives
// in main.js and is exercised in the browser.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hostTable, programPage } from '../src/game/net.js';
import { runRonml, OB_VERBS } from '../src/game/ai_ml.js';
import { newShell, makeDisk, runUnix } from '../src/game/unix.js';

const world = () => ({
  islandId: 'ogygia', daemon: 'calypso',
  obelisks: [{ code: 'OB_1A2B', tag: 'north gate', down: false }],
  robots: [
    { id: 'T1_03', type: 't1', tag: 'hunter', program: 'if threat then hunt else patrol' },
    { id: 'T1_04', type: 't1', tag: null, program: 'patrol' },
  ],
});

test('a tag rides hostTable onto the robot and the tower, null when unset', () => {
  const hosts = hostTable(world());
  assert.equal(hosts.find((h) => h.name === 'T1_03').tag, 'hunter');
  assert.equal(hosts.find((h) => h.name === 'OB_1A2B').tag, 'north gate');
  assert.equal(hosts.find((h) => h.name === 'T1_04').tag, null);
});

test("the unit's program.ml page shows the label beside its name", () => {
  const hosts = hostTable(world());
  const page = programPage(hosts.find((h) => h.name === 'T1_03'), hosts);
  assert.match(page, /T1_03 «hunter» · program\.ml/);
  const plain = programPage(hosts.find((h) => h.name === 'T1_04'), hosts);
  assert.doesNotMatch(plain, /«/);
});

test('the obelisk console tags a node through ctx.tagNode', () => {
  assert.ok(OB_VERBS.includes('tag'), 'tag is an obelisk verb');
  let seen = null;
  const ctx = { station: 'ob', tagNode: (id, label) => { seen = { id, label }; return { ok: true, text: `tagged ${id} «${label}»` }; } };
  const r = runRonml('tag t1_03 "hunter"', ctx);
  assert.deepEqual(seen, { id: 't1_03', label: 'hunter' });
  assert.match(r.text, /tagged t1_03 «hunter»/);
});

test('the console verb refuses a node without a label, and a console with no tagging', () => {
  const noStr = runRonml('tag t1_03 t1_04', { station: 'ob', tagNode: () => ({ ok: true }) });
  assert.match(noStr.text, /^ERR/);
  const noHook = runRonml('tag t1_03 "x"', { station: 'ob' });   // ctx.tagNode absent
  assert.match(noHook.text, /^ERR/);
});

test('arp shows the label beside a heard machine', () => {
  const shell = newShell(makeDisk());
  shell.net = {
    card: true, up: true, iface: 'wifi0',
    local: () => [
      { host: 't1_03.calypso.com', ip: '10.1.5.3', mac: 'aa:bb:cc:dd:ee:ff', range: 6, bearing: 'NE', down: false, tag: 'hunter' },
      { host: 't1_04.calypso.com', ip: '10.1.5.4', mac: 'aa:bb:cc:dd:ee:00', range: 9, bearing: 'S', down: false, tag: null },
    ],
  };
  const out = runUnix('arp -a', shell, {});
  assert.match(out.text, /t1_03\.calypso\.com.*«hunter»/);
  assert.doesNotMatch(out.text.split('\n').find((l) => /t1_04/.test(l)), /«/);
});
