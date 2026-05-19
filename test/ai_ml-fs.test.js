// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// Unit tests for the RON-ML terminal filesystem — Stage S1 of the Calypso
// escape chain (docs/PLAN.md, §8). Exercises the LANGUAGE layer
// in ronml.js: filenames lexing to `file` values, the cd/ls verbs, and the
// polymorphic `copy` (a file to a device vs the classic `copy aikey` key-bind).
// The main.js device wiring (which card state maps to which files) is verified
// live in the browser; here we drive runRonml against a self-contained fake ctx.
//
// Zero dependencies: `node --test test/` (Node 18+).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runRonml } from '../src/game/ai_ml.js';

// A minimal stand-in for main.js's fs ctx: an `aikey` drive holding the card's
// two files, and a writable `ob` scratch. cwd + scratch live in the closure the
// way replSession holds them in the real terminal.
function fakeCtx() {
  const files = { aikey: ['access_ai_code.ml', 'factory_id.ml'], ob: [] };
  let cwd = 'aikey';
  return {
    station: 'ob',
    session: {},
    hasAiKey: () => true,
    bindSession() {},
    cd: (d) => {
      const dev = d === 'card' ? 'aikey' : d;
      if (!(dev in files)) return { ok: false, msg: `no drive '${d}'` };
      cwd = dev; return { ok: true };
    },
    ls: () => files[cwd].slice(),
    copyFile: (name, destRaw) => {
      const dest = destRaw === 'card' ? 'aikey' : destRaw;
      if (!files[cwd].includes(name)) return { ok: false, msg: `no file '${name}'` };
      if (dest !== 'ob') return { ok: false, msg: 'sealed' };
      if (!files.ob.includes(name)) files.ob.push(name);
      return { ok: true };
    },
    _files: files,
  };
}

test('a filename lexes to a file value (not a node)', () => {
  const r = runRonml('factory_id.ml', fakeCtx());
  assert.ok(r.ok, r.text);
  assert.equal(r.text, 'factory_id.ml');
});

test('ls lists the card files on the default (aikey) drive', () => {
  const r = runRonml('ls', fakeCtx());
  assert.ok(r.ok, r.text);
  assert.match(r.text, /factory_id\.ml/);
  assert.match(r.text, /access_ai_code\.ml/);
});

test('cd ob then ls shows the (empty) scratch, not the card', () => {
  const ctx = fakeCtx();
  assert.ok(runRonml('cd ob', ctx).ok);
  assert.equal(runRonml('ls', ctx).text, '[]');
});

test('copy moves a file from the card to the ob scratch', () => {
  const ctx = fakeCtx();
  const c = runRonml('copy factory_id.ml ob', ctx);
  assert.ok(c.ok, c.text);
  assert.equal(c.text, 'factory_id.ml');
  assert.deepEqual(ctx._files.ob, ['factory_id.ml']);
  // and now it lists on the ob drive
  runRonml('cd ob', ctx);
  assert.match(runRonml('ls', ctx).text, /factory_id\.ml/);
});

test('copy aikey still binds the sealed key token (polymorphism preserved)', () => {
  const r = runRonml('copy aikey', fakeCtx());
  assert.ok(r.ok, r.text);
  assert.match(r.text, /AIKEY:sealed/);
});

test('copying to the sealed card is refused with a teaching error', () => {
  const r = runRonml('copy factory_id.ml aikey', fakeCtx());
  assert.ok(!r.ok);
  assert.match(r.text, /ERR:/);
  assert.match(r.text, /sealed/);
});

test('copy with no device left of it reports the file usage, not the key one', () => {
  const r = runRonml('copy factory_id.ml', fakeCtx());
  assert.ok(!r.ok);
  assert.match(r.text, /copy factory_id\.ml ob|a file to a device/);
});

test('cd to an unknown drive errors', () => {
  const r = runRonml('cd nowhere', fakeCtx());
  assert.ok(!r.ok);
  assert.match(r.text, /ERR:/);
});

test('a hyphen-only identifier is still a node (OB_XXXX unaffected)', () => {
  const r = runRonml('OB_BB05', fakeCtx());
  assert.ok(r.ok, r.text);
  assert.equal(r.text, 'OB_BB05');
});

// ---- S2: the ELIZA transform (eliza <file>) --------------------------------

test('eliza <file> runs the transform via ctx and returns the output file', () => {
  let called = null;
  const ctx = { station: 'ob', session: {}, elizaTransform: (n) => { called = n; return { ok: true, out: 'root_access.ml' }; } };
  const r = runRonml('eliza factory_id.ml', ctx);
  assert.ok(r.ok, r.text);
  assert.equal(called, 'factory_id.ml');
  assert.equal(r.text, 'root_access.ml');
});

test('eliza needs a file, not a bare word (bare eliza is a REPL mode, tested live)', () => {
  const ctx = { station: 'ob', session: {}, elizaTransform: () => ({ ok: true, out: 'x' }) };
  const r = runRonml('eliza banana', ctx);
  assert.ok(!r.ok);
  assert.match(r.text, /needs a file/);
});

test('eliza transform failure surfaces the ctx message', () => {
  const ctx = { station: 'ob', session: {}, elizaTransform: () => ({ ok: false, msg: 'no factory_id.ml on the ob bench — copy it here first' }) };
  const r = runRonml('eliza factory_id.ml', ctx);
  assert.ok(!r.ok);
  assert.match(r.text, /ob bench/);
});

// ---- S4: the HERMES forge (forge <file>) -----------------------------------

test('forge <file> runs the ctx forge and returns the output file', () => {
  let called = null;
  const ctx = { station: 'hermes', session: {}, forge: (n) => { called = n; return { ok: true, out: 'zeus_lightning.ml' }; } };
  const r = runRonml('forge zeus_virus.ml', ctx);
  assert.ok(r.ok, r.text);
  assert.equal(called, 'zeus_virus.ml');
  assert.equal(r.text, 'zeus_lightning.ml');
});

test('forge failure surfaces the ctx message', () => {
  const ctx = { station: 'hermes', session: {}, forge: () => ({ ok: false, msg: 'forge needs a Trojan card in hand' }) };
  const r = runRonml('forge zeus_virus.ml', ctx);
  assert.ok(!r.ok);
  assert.match(r.text, /Trojan card/);
});

test('forge is a HERMES verb — refused at an obelisk', () => {
  const ctx = { station: 'ob', session: {}, forge: () => ({ ok: true, out: 'x' }) };
  const r = runRonml('forge zeus_virus.ml', ctx);
  assert.ok(!r.ok);
  assert.match(r.text, /isn't a command on this terminal/);
});

test('read accepts a file value (readme.md), not just a topic', () => {
  let readArg = null;
  const ctx = { station: 'hermes', session: {}, read: (t) => { readArg = t; } };
  const r = runRonml('read readme.md', ctx);
  assert.ok(r.ok, r.text);
  assert.equal(readArg, 'readme.md');
});

// ---- Card naming: forgiving cd + the drives listing -------------------------

test('cd echoes the drive label (so you can see the card state)', () => {
  let arg = null;
  const ctx = { station: 'ob', session: {}, cd: (n) => { arg = n; return { ok: true, label: 'card (Trojan key)' }; } };
  const r = runRonml('cd trojan', ctx); // a synonym for the card
  assert.ok(r.ok, r.text);
  assert.equal(arg, 'trojan');
  assert.match(r.text, /Trojan key/);
});

test('drives calls ctx.drives (the listing)', () => {
  let called = false;
  const ctx = { station: 'ob', session: {}, drives: () => { called = true; } };
  const r = runRonml('drives', ctx);
  assert.ok(r.ok, r.text);
  assert.equal(called, true);
});

// ---- THE REFUNCTION IS A PROGRAM ------------------------------------------
//
// `retire` was arity 0: the largest turn in the game, typed in six letters, at
// any obelisk on any island. It takes the open key and a REPLACEMENT for her
// keeping, and it tries that replacement before accepting it — she keeps you,
// so the only thing that passes is a keeping that gives you back.

const retireCtx = () => {
  const st = { called: false };
  st.ctx = fakeCtx();
  // fakeCtx's bindSession is a no-op stub, which is fine for the file tests and
  // no use here: `retire` is reached THROUGH the key, so the binding has to land
  // somewhere the next line can read it, the way replSession does in the game.
  st.ctx.bindSession = (name, val) => { st.ctx.session[name] = val; };
  st.ctx.retire = () => { st.called = true; };
  return st;
};

test('retire: the open key and the identity stand the guards down', () => {
  const st = retireCtx();
  const r = runRonml('copy aikey; retire (decrypt aikey) (fn x => x)', st.ctx);
  assert.ok(r.ok, r.text);
  assert.equal(st.called, true);
});

test('retire: a program held in let-bindings works, because it is a program', () => {
  const st = retireCtx();
  const r = runRonml('copy aikey; let val k = decrypt aikey val keep = fn x => x in retire k keep end', st.ctx);
  assert.ok(r.ok, r.text);
  assert.equal(st.called, true);
});

test('retire: the bare word does nothing at all now', () => {
  const st = retireCtx();
  const r = runRonml('retire', st.ctx);
  assert.equal(st.called, false, 'six letters must not be the whole hack');
  assert.match(r.text, /decrypt aikey/, 'and it has to say what it wants instead');
});

test('retire: a sealed key is refused', () => {
  const st = retireCtx();
  const r = runRonml('copy aikey; retire aikey (fn x => x)', st.ctx);
  assert.equal(st.called, false);
  assert.match(r.text, /sealed/);
});

test('retire: anything that KEEPS what it is given is refused', () => {
  // Every wrong answer here is the same wrong answer — a function that gives
  // back something other than what it was handed is what she already is.
  for (const keeping of ['fn x => 0', 'fn x => x + 1', 'fn x => ~x']) {
    const st = retireCtx();
    const r = runRonml(`copy aikey; retire (decrypt aikey) (${keeping})`, st.ctx);
    assert.equal(st.called, false, `${keeping} should not have released her`);
    assert.match(r.text, /keeping, not a release/);
  }
});

test('retire: a keeping that throws is still a keeping', () => {
  const st = retireCtx();
  const r = runRonml('copy aikey; retire (decrypt aikey) (fn x => hd [])', st.ctx);
  assert.equal(st.called, false);
  assert.ok(!r.ok);
});

test('retire: not a function at all is refused before she runs anything', () => {
  const st = retireCtx();
  const r = runRonml('copy aikey; retire (decrypt aikey) 1', st.ctx);
  assert.equal(st.called, false);
  assert.match(r.text, /FUNCTION/);
});

test('retire: where there is no ctx.retire there is no refunction', () => {
  // The host decides WHERE. main.js supplies retire only on the island she
  // keeps; on any other the verb parses and then finds nothing to talk to.
  const ctx = fakeCtx();
  ctx.bindSession = (name, val) => { ctx.session[name] = val; };
  const r = runRonml('copy aikey; retire (decrypt aikey) (fn x => x)', ctx);
  assert.match(r.text, /nothing to retire/);
});
