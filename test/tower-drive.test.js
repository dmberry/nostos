// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #133 part two — the program actually drives the tower.
//
// Part one gave every tower a program you could READ. The risk in making it
// TRUE is that gating live behaviour on a program changes the game the moment
// it ships, before anybody has edited anything. The first test here is the one
// that matters: the STOCK programs must decide exactly what the towers already
// did, so nothing moves until a player posts something.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decide, TOWER_CAN } from '../src/game/ai_ml.js';
import { towerSense, towerDecide, towerAllows, towerProgram } from '../src/game/tower-code.js';

const ob = (over = {}) => ({ code: 'OB_5D33', cls: 'standard', alert: 0, ...over });
const at = (o, w = {}) => towerDecide(o, towerSense(o, w), 'calypso', decide);

test('THE SAFETY PROPERTY: a stock tower decides what it already did', () => {
  // A standard tower swept its garrison above alert 0.5, fed a docked unit, and
  // otherwise only watched. Those three, and nothing else.
  assert.equal(at(ob({ alert: 0.6 })).intent, 'report', 'above half alert it sweeps, as before');
  assert.equal(at(ob({ alert: 0.4 })).intent, 'watch', 'below it, nothing, as before');
  assert.equal(at(ob({ alert: 0.51 })).intent, 'report', 'the threshold is where it was');
  assert.equal(at(ob({ alert: 0.1 }), { docked: true }).intent, 'feed', 'and it still feeds');

  // The eye calls only while it actually has you, which is what made it the eye.
  const eye = ob({ cls: 'eye', alert: 0.6 });
  assert.equal(at(eye, { contact: true }).intent, 'call', 'in its line: it names you to the island');
  assert.equal(at(eye, { contact: false }).intent, 'report', 'out of its line it is an ordinary tower');

  // The siren sings when you are inside its song, and that is all it ever did.
  const siren = ob({ cls: 'siren' });
  assert.equal(at(siren, { contact: true }).intent, 'lure');
  assert.equal(at(siren, { contact: false }).intent, 'watch');
});

test('every stock program is inside its own class repertoire', () => {
  // A tower that could choose a word its class cannot answer would fault on a
  // fresh save, which is the other way this change could break the game.
  for (const cls of ['standard', 'eye', 'siren']) {
    const o = ob({ cls });
    for (const w of [{}, { contact: true }, { docked: true }, { contact: true, docked: true }]) {
      for (const alert of [0, 0.3, 0.6, 1]) {
        const r = towerDecide({ ...o, alert }, towerSense({ ...o, alert }, w), 'calypso', decide);
        assert.equal(r.fault, null, `${cls} faulted on ${JSON.stringify({ ...w, alert })}: ${r.fault}`);
        assert.ok(TOWER_CAN[cls].includes(r.intent), `${cls} chose ${r.intent}, which it cannot do`);
      }
    }
  }
});

test('a posted program wins over the stock one', () => {
  const o = ob({ alert: 0.9, program: 'hold' });
  assert.equal(at(o).intent, 'hold', 'posting is the whole point');
  assert.equal(at(ob({ alert: 0.9 })).intent, 'report', 'and the unedited one is unaffected');
});

test('a clause vetoes rather than faults, and the tower falls to watch', () => {
  const o = ob({ alert: 0.9, program: 'never report ; if alert > 50 then report else watch' });
  const r = at(o);
  assert.equal(r.intent, 'watch', 'the forbidden intent drops to watch');
  assert.equal(r.vetoed, 'report', 'and the tower says which one it refused');
  assert.equal(r.fault, null, 'a constitution holding is not an error');
  assert.deepEqual(r.clauses, { report: true });
});

test('never feed is a real hack: the tower keeps watching and stops charging', () => {
  // David's "stop them feeding robots their power" — an island whose towers
  // will not feed runs itself down. It has to VETO rather than fault, or the
  // player has cost the tower nothing.
  const o = ob({ program: 'never feed ; if docked then feed else watch' });
  const r = at(o, { docked: true });
  assert.equal(r.vetoed, 'feed');
  assert.equal(r.intent, 'watch');
  assert.equal(towerAllows({ towerIntent: r.intent, towerVeto: r.clauses }, 'feed'), false);
});

test('a faulted program does not brick the tower', () => {
  // A mistyped program must not be able to switch a tower off by accident —
  // that is what `hold` is for, on purpose. A fault lights the lamp and the
  // tower falls back to watching.
  const r = at(ob({ alert: 0.9, program: 'if wibble then report else watch' }));
  assert.equal(r.intent, 'watch');
  assert.ok(r.fault, 'and it says what is wrong with it');
  const empty = at(ob({ program: '   ' }));
  assert.equal(empty.intent, 'watch');
  assert.ok(empty.fault);
});

test('a watching tower still feeds — only a clause stops it', () => {
  // The bug this pins: feeding is continuous, so gating it on the current
  // intent meant a tower that was merely watching reported feedOff and NOTHING
  // ON THE ISLAND COULD RECHARGE. Only a constitution stops a tower feeding.
  const watching = { towerIntent: 'watch', towerVeto: null };
  assert.equal(towerAllows(watching, 'feed'), true, 'a watching tower still has power at the socket');
  assert.equal(towerAllows(watching, 'report'), false, 'but it is not sweeping');
  const forbidden = { towerIntent: 'watch', towerVeto: { feed: true } };
  assert.equal(towerAllows(forbidden, 'feed'), false, 'and a clause is what cuts the power');
});

test('towerAllows lets the continuous jobs coexist with watching', () => {
  // Feeding and singing are things a tower is DOING rather than choices it made
  // once, so the behaviour sites ask this rather than comparing intents — a
  // straight equality test would make a feeding tower a blind one.
  const feeding = { towerIntent: 'feed', towerVeto: null };
  assert.equal(towerAllows(feeding, 'feed'), true);
  assert.equal(towerAllows(feeding, 'watch'), true, 'a tower that feeds still watches');
  assert.equal(towerAllows(feeding, 'report'), false);
  assert.equal(towerAllows(null, 'feed'), false, 'and nothing is allowed of nothing');
});

test('the senses a tower is given are the ones its program is written against', () => {
  const s = towerSense({ alert: 0.42 }, { contact: true, docked: false, garrison: 3 });
  assert.equal(s.alert, 42, 'alert is 0..100, so a person writes alert > 50');
  assert.equal(s.contact, true);
  assert.equal(s.docked, false);
  assert.equal(s.garrison, 3);
  assert.equal(s.linked, true, 'linked defaults true — a tower is on the net unless cut');
  assert.equal(s.daylight, true);
  // A tower with nothing known about it still answers rather than faulting.
  const bare = towerSense();
  assert.equal(bare.alert, 0);
  assert.equal(bare.contact, false);
});

test('the shipped source is what runs — the file is not a fiction over it', () => {
  // The plan's first rule: where a file claims to drive something, it drives it.
  // So the text a player reads with `soul` has to be the text that decided.
  const o = ob({ alert: 0.6 });
  const src = towerProgram(o, 'calypso');
  const direct = decide(src, towerSense(o, {}), { can: TOWER_CAN.standard });
  assert.equal(direct.intent, at(o).intent, 'reading it and running it must agree');
});
