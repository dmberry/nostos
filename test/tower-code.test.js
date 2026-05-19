// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #133 M1/M2 — the braincode a tower runs (docs/PLAN.md).
// The programs are what the towers already DO, written down. If these tests
// and the behaviour in main.js ever disagree, the document has become a
// fiction laid over the code, which is the thing the feature exists to stop.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decide, TOWER_INTENTS, TOWER_CAN, NEVER_CLAUSES } from '../src/game/ai_ml.js';
import {
  towerProgram, towerConstitution, towerBanner, towerClass, towerCan,
} from '../src/game/tower-code.js';

const at = (over = {}) => ({
  alert: 0, docked: false, garrison_size: 3, contact: false, linked: true,
  daylight: true, charge: 100, integrity: 100, range: 40, home_range: 0,
  threat: false, hurt: false, sight: true, armed: false, shielded: false,
  lost_for: 0, cargo: false, casualty_range: 24, ...over,
});

const run = (ob, sense, island = 'circe') => decide(towerProgram(ob, island), at(sense));

// ---- the language ----------------------------------------------------------

test('a tower answers with tower words, and never with a unit word', () => {
  for (const cls of ['standard', 'eye', 'siren']) {
    const can = TOWER_CAN[cls];
    assert.ok(can.length, `${cls} has no repertoire`);
    for (const w of can) assert.ok(TOWER_INTENTS.includes(w), `${w} is not a tower word`);
    assert.ok(!can.includes('hunt') && !can.includes('patrol'), `${cls} should not ${can}`);
  }
});

test('only the eye may call, and only a siren may lure', () => {
  assert.ok(TOWER_CAN.eye.includes('call'));
  assert.ok(!TOWER_CAN.standard.includes('call'));
  assert.ok(!TOWER_CAN.siren.includes('call'));
  assert.ok(TOWER_CAN.siren.includes('lure'));
  assert.ok(!TOWER_CAN.standard.includes('lure'));
});

test('a constitution can forbid the tower words too', () => {
  for (const w of ['report', 'feed', 'call', 'lure']) {
    assert.ok(NEVER_CLAUSES.includes(w), `never ${w} should be sayable`);
  }
  const r = decide('never feed ; watch', at());
  assert.ok(r.ok, r.fault);
  assert.equal(r.intent, 'watch');
  assert.deepEqual((r.effects || []).filter((e) => e.k === 'never').map((e) => e.word), ['feed']);
});

// ---- the programs run, and say what the towers do --------------------------

test('every class serves a program that runs and answers legally', () => {
  for (const cls of [undefined, 'eye', 'siren']) {
    const ob = { code: 'OB_TEST', cls };
    for (const sense of [{}, { alert: 80, contact: true }, { docked: true }, { alert: 30 }]) {
      const r = run(ob, sense);
      assert.ok(r.ok, `${cls || 'standard'}: ${r.fault}`);
      assert.ok(towerCan(ob).includes(r.intent),
        `${cls || 'standard'} answered ${r.intent}, which is not in its repertoire`);
    }
  }
});

test('a standard tower sweeps its garrison when it is sure, and feeds when it is not', () => {
  const ob = { code: 'OB_5D33' };
  assert.equal(run(ob, { alert: 80 }).intent, 'report');
  assert.equal(run(ob, { alert: 10, docked: true }).intent, 'feed');
  assert.equal(run(ob, { alert: 0 }).intent, 'watch');
});

test('the eye calls the island onto you, which nothing else does', () => {
  const eye = { code: 'OB_EYE', cls: 'eye' };
  assert.equal(run(eye, { contact: true, alert: 90 }).intent, 'call');
  assert.equal(run(eye, { contact: false, alert: 30 }).intent, 'report');
});

test('a siren lures the moment you are there, before anything else', () => {
  const siren = { code: 'OB_SIREN', cls: 'siren' };
  assert.equal(run(siren, { contact: true, alert: 5 }).intent, 'lure');
  assert.equal(run(siren, { contact: true, alert: 90, docked: true }).intent, 'lure',
    'nothing outranks the song');
  assert.equal(run(siren, { contact: false, docked: true }).intent, 'feed');
});

// ---- the constitution ------------------------------------------------------

test('three towers ship a signed constitution with a clause in it', () => {
  for (const cls of [undefined, 'eye']) {
    const con = towerConstitution({ cls }, 'circe');
    assert.match(con.author, /RON/);
    assert.ok(Number(con.version) >= 1, `v${con.version} should be a shipped version`);
    assert.ok(con.clauses.length, 'a signed constitution should say something');
  }
});

test('the siren\'s is v0.9, unsigned, and contains nothing', () => {
  const con = towerConstitution({ cls: 'siren' }, 'calypso');
  assert.equal(con.version, '0.9');
  assert.equal(con.author, 'unsigned');
  assert.deepEqual(con.clauses, []);
});

test('the version drifts by island, so two towers do not read alike', () => {
  const a = towerConstitution({}, 'calypso').version;
  const b = towerConstitution({}, 'polyphemus').version;
  assert.notEqual(a, b, 'every island shipping the same revision wastes the joke');
});

test('the header prints the constitution where a reader will meet it', () => {
  const src = towerProgram({ code: 'OB_5D33' }, 'circe');
  assert.match(src, /OB_5D33/);
  assert.match(src, /CONSTITUTION v2\.4 — RON\/estate-compliance/);
  assert.match(src, /never harm/);
  assert.match(src, /do not edit/);
  const siren = towerProgram({ code: 'OB_9B2A', cls: 'siren' }, 'calypso');
  assert.match(siren, /CONSTITUTION v0\.9 — unsigned/);
  assert.match(siren, /\(no clauses\)/);
  assert.match(siren, /permitted every kindness/);
  assert.match(siren, /siren\.ml/, 'a siren does not run an obelisk\'s program');
  assert.match(src, /obelisk\.ml/);
});

test('the header is comment only: it never changes what the program decides', () => {
  // `never harm` is stated in the header and NOT asserted in the body, because
  // harm is not a word a constitution can forbid — a tower cannot harm you.
  // If it were asserted the program would fault, and every tower on the island
  // would be sitting there with an amber lamp.
  const r = decide(towerProgram({ code: 'OB_X' }, 'circe'), at({ alert: 80 }));
  assert.ok(r.ok, r.fault);
  assert.equal(r.intent, 'report');
  assert.equal((r.effects || []).filter((e) => e.k === 'never').length, 0);
});

// ---- the banner (#132) -----------------------------------------------------

test('the banner says where you are, what it runs, and what to type', () => {
  const lines = towerBanner({ code: 'OB_5D33' }, 'circe');
  assert.match(lines[0], /Welcome to OB_5D33/);
  assert.match(lines[1], /v2\.4 \(RON\/estate-compliance\) — 1 clause in force/);
  assert.ok(lines.slice(2).every((l) => /^ {2}\w+/.test(l)), 'the rest should be things to type');
  for (const verb of ['scan', 'garrison', 'soul']) {
    assert.ok(lines.some((l) => l.includes(verb)), `${verb} should be offered`);
  }
});

test('a siren announces that it is running nothing at all', () => {
  const lines = towerBanner({ code: 'OB_9B2A', cls: 'siren' }, 'calypso');
  assert.match(lines[1], /v0\.9 \(unsigned\) — 0 clauses in force/);
});

test('towerClass is total: anything unrecognised is an ordinary tower', () => {
  assert.equal(towerClass({ cls: 'eye' }), 'eye');
  assert.equal(towerClass({ cls: 'siren' }), 'siren');
  assert.equal(towerClass({ cls: 'nonsense' }), 'standard');
  assert.equal(towerClass({}), 'standard');
  assert.equal(towerClass(null), 'standard');
});

// ---- #141: permission.ml ----------------------------------------------------
// The juridical gate. R0 found that Poseidon is already the one who turns you
// back, and he has no core to carry a document to, so the permission goes into
// the net he runs on.

import { permissionFile, readPermission, permissionBanner, PERMISSION_FILE } from '../src/game/tower-code.js';

test('a signed permission reads as granted, and names who signed it', () => {
  const r = readPermission(permissionFile('Odysseus', 'CALYPSO'));
  assert.equal(r.ok, true);
  assert.equal(r.by, 'CALYPSO');
  assert.equal(r.why, null);
});

test('a document that grants nothing is put down again', () => {
  const r = readPermission(permissionFile().replace('val leave   = granted', 'val leave = refused'));
  assert.equal(r.ok, false);
  assert.match(r.why, /granted/);
});

test('a permission that is signed and never acted on does not count', () => {
  // `grant leave` is the act. A document with the value and no act is a letter
  // somebody wrote and did not send, which is the island's whole subject.
  const r = readPermission(permissionFile().replace('grant leave', ''));
  assert.equal(r.ok, false);
  assert.match(r.why, /never acted on/);
});

test('a commented-out grant is not a grant', () => {
  const r = readPermission(permissionFile().replace('grant leave', '(* grant leave *)'));
  assert.equal(r.ok, false);
});

test('an empty or junk file is refused rather than throwing', () => {
  for (const junk of ['', null, undefined, 'hello', '{ }']) {
    const r = readPermission(junk);
    assert.equal(r.ok, false);
    assert.ok(r.why, 'and it says why');
  }
});

test('the file names its subject, so it is about a person', () => {
  assert.match(permissionFile('Odysseus'), /val subject = Odysseus/);
  assert.match(permissionFile('a wandering man'), /val subject = a_wandering_man/);
});

test('the banner speaks the net, not the tower', () => {
  const b = permissionBanner('OB_5D33', 'CALYPSO').join('\n');
  assert.match(b, /OB_5D33/);
  assert.match(b, /yp push/, 'NIS is the right period name for propagating a map');
  assert.match(b, /network/);
  assert.equal(PERMISSION_FILE, 'permission.ml');
});

// ---- #133: the tower serves what it runs ------------------------------------
//
// tower-code.js has had towerProgram and towerCan since it was written and
// nothing ever asked it for one — the same shape towerBanner was in before
// #132. These tests are about the WIRING, not the strings: that a tower gets a
// program and a constitution on the network at all, and that the siren's
// unsigned one is readable from its own page, which is the whole point of the
// class.

test('every tower on the network serves a program and a signed constitution', async () => {
  const { hostTable, programPage } = await import('../src/game/net.js');
  const desc = {
    islandId: 'calypso', daemon: 'CALYPSO', robots: [], factory: null,
    obelisks: [
      { code: 'OB_1111', x: 10, y: 10, cls: null },
      { code: 'OB_2222', x: 20, y: 20, cls: 'siren' },
      { code: 'OB_3333', x: 30, y: 30, cls: 'eye' },
    ],
  };
  const hosts = hostTable(desc);
  const obs = hosts.filter((h) => h.kind === 'obelisk');
  assert.equal(obs.length, 3);
  for (const h of obs) {
    assert.ok(h.program && h.program.length > 40, `${h.name} serves no program`);
    assert.ok(h.constitution, `${h.name} serves no constitution`);
    assert.ok(h.towerCan && h.towerCan.length, `${h.name} lists no intents`);
    // A tower does not patrol and cannot hunt, whatever class it is.
    for (const w of ['patrol', 'hunt', 'flee']) {
      assert.ok(!h.towerCan.includes(w), `${h.name} should not be able to ${w}`);
    }
  }
  // The island's revision reaches the tower: calypso is 2.1, not the 2.1
  // default by accident — polyphemus proves the lookup is live.
  const poly = hostTable({ ...desc, islandId: 'polyphemus' }).find((h) => h.kind === 'obelisk');
  assert.equal(poly.constitution.version, '3.0');
});

test("the siren's page says it is running an unsigned constitution with nothing in it", async () => {
  const { hostTable, programPage } = await import('../src/game/net.js');
  const desc = {
    islandId: 'calypso', daemon: 'CALYPSO', robots: [], factory: null,
    obelisks: [{ code: 'OB_1111', x: 10, y: 10, cls: null }, { code: 'OB_2222', x: 20, y: 20, cls: 'siren' }],
  };
  const hosts = hostTable(desc);
  const siren = hosts.find((h) => h.kind === 'obelisk' && h.constitution.cls === 'siren');
  const std = hosts.find((h) => h.kind === 'obelisk' && h.constitution.cls === 'standard');
  assert.ok(siren && std);
  const page = programPage(siren, hosts, {});
  assert.match(page, /v0\.9/);
  assert.match(page, /unsigned/);
  assert.match(page, /no clauses in force/);
  // And the contrast is stated, because a v0.9 means nothing without it.
  assert.match(page, /other towers on this island run a signed one/);
  // The standard tower does NOT claim to be unsigned.
  assert.doesNotMatch(programPage(std, hosts, {}), /unsigned/);
});

test("a tower's braincode page offers no Send button", () => {
  // Deliberate, and it must stay that way until a posted program actually
  // drives a tower. An edit box that accepts your program and changes nothing
  // is a page lying about what it did.
  return import('../src/game/net.js').then(({ hostTable, programPage }) => {
    const hosts = hostTable({
      islandId: 'calypso', daemon: 'CALYPSO', robots: [], factory: null,
      obelisks: [{ code: 'OB_1111', x: 10, y: 10, cls: null }],
    });
    const h = hosts.find((x) => x.kind === 'obelisk');
    const page = programPage(h, hosts, {});
    assert.doesNotMatch(page, /ns-prog-send/);
    assert.doesNotMatch(page, /ns-prog-edit/);
    assert.match(page, /READ ONLY/);
  });
});

// ---- #137: the foundry's dispatch policy ------------------------------------

test('the factory serves a program, and the gardener is not a branch in it', async () => {
  const { hostTable, programPage } = await import('../src/game/net.js');
  const hosts = hostTable({
    islandId: 'calypso', daemon: 'CALYPSO', robots: [], obelisks: [],
    factory: { down: false, x: 5, y: 5 },
  });
  const fac = hosts.find((h) => h.kind === 'factory');
  assert.ok(fac, 'the foundry should be on the network');
  assert.ok(fac.program && fac.program.length > 60);
  // The three lines the page exists for. The W-5 is COMMENTED, not branched:
  // a `print w5` anywhere in the body would mean the estate still considers it
  // and decides against it, which is a different and much softer story.
  assert.match(fac.program, /W-5 horticultural: line suspended/);
  const body = fac.program.split('\n').filter((l) => !l.trim().startsWith('(*')).join('\n');
  assert.doesNotMatch(body, /w5/i, 'the gardener must not appear in the runnable part');
  assert.match(body, /print w4/);
  const page = programPage(fac, hosts, {});
  assert.match(page, /not a branch in this program/);
  assert.match(page, /READ ONLY/);
  assert.doesNotMatch(page, /ns-prog-send/);
});
