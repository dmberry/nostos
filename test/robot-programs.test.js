// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// P1/P2 of docs/robot-programs-plan.md: machines that carry their reasoning as
// an AI-ML program you can read. Proves the shape works before any of it is
// wired to the world — the program is a PURE function from what a machine
// senses to what it intends, and the engine does the intending.

import { test } from 'node:test';
import { newShell, runUnix } from '../src/game/unix.js';
import assert from 'node:assert/strict';
import { decide, runRonml, INTENTS, LAMP_COLOURS } from '../src/game/ai_ml.js';
import { T1_PROGRAM } from '../src/game/robots.js';

// The program a W4 hunter-killer leaves the foundry carrying.
const FACTORY_W4 = [
  '(* w4_07 — factory default. Do not edit. *)',
  'if charge < 20 then home',
  'else if threat and hurt then flee',
  'else if threat then hunt',
  'else patrol',
].join('\n');

test('a machine chooses an intent from what it senses', () => {
  const run = (sense) => decide(FACTORY_W4, sense);
  // `effects` rides along with every decision (beep/eye/flash); this program asks
  // for none, so it is empty. `fire` is null because this program answers with
  // one word rather than a pair — see the fire-control tests below.
  const F = { ok: true, effects: [], fire: null };
  assert.deepEqual(run({ charge: 90, threat: false, hurt: false }), { ...F, intent: 'patrol' });
  assert.deepEqual(run({ charge: 90, threat: true, hurt: false }), { ...F, intent: 'hunt' });
  assert.deepEqual(run({ charge: 90, threat: true, hurt: true }), { ...F, intent: 'flee' });
  assert.deepEqual(run({ charge: 12, threat: true, hurt: false }), { ...F, intent: 'home' });
});

test('a program is ONE expression, however many lines it is laid out over', () => {
  // The four-line if/else above is a single expression; a line-at-a-time reading
  // would cut it in half at the first `then`.
  assert.equal(decide(FACTORY_W4, { charge: 90 }).intent, 'patrol');
  assert.equal(decide('patrol', {}).intent, 'patrol', 'and one line is a whole program');
});

test('locals come from let ... in, and may recurse', () => {
  const p = ['let danger = threat and hurt in',
    'if danger then flee else patrol'].join('\n');
  assert.equal(decide(p, { threat: true, hurt: true }).intent, 'flee');
  assert.equal(decide(p, { threat: true, hurt: false }).intent, 'patrol');
  // let is recursive (SML's `fun`), so a local function can call itself
  assert.equal(runRonml('let f n = if n == 0 then 1 else n * f (n - 1) in f 5',
    { station: 'laptop', session: {} }).text, '120');
});

test('rewriting the program rewrites what the machine IS', () => {
  // The same chassis, told to garden and to run from you instead.
  const mine = ['if blight then tend', 'else if threat then flee', 'else patrol'].join('\n');
  assert.equal(decide(mine, { blight: true }).intent, 'tend');
  assert.equal(decide(mine, { threat: true }).intent, 'flee');
  assert.equal(decide(mine, {}).intent, 'patrol');
});

// ---- the three ways a program can be wrong -------------------------------

test('a runaway program FAULTS on fuel rather than hanging the game', () => {
  const r = decide('let f x = f x in f 1', {});
  assert.equal(r.ok, false);
  assert.match(r.fault, /step budget/);
});

test('a program asking for something the unit cannot do is a fault', () => {
  const r = decide('if threat then dance else patrol', { threat: true });
  assert.equal(r.ok, false);
  assert.match(r.fault, /not something this unit can do/);
});

test('a unit cannot reach the network from its own program', () => {
  for (const line of ['scan', 'hack OB_1A2B', 'crash OB_1A2B k']) {
    const r = decide(line, {});
    assert.equal(r.ok, false, `${line} is refused`);
  }
});

test('an empty program is a fault, not a silent default', () => {
  assert.equal(decide('', {}).ok, false);
  assert.equal(decide('(* nothing but a comment *)', {}).ok, false);
});

// ---- the sensors ---------------------------------------------------------

test('sensors are functions, so the language needs no records', () => {
  const sense = { charge: 55, integrity: 40, range: 3, home_range: 20 };
  assert.equal(runRonml('charge', { station: 'robot', session: {}, sense }).text, '55');
  assert.equal(runRonml('range < 5', { station: 'robot', session: {}, sense }).text, 'true');
  assert.equal(runRonml('charge + integrity', { station: 'robot', session: {}, sense }).text, '95');
});

test('a missing reading is zero or false, never a crash', () => {
  // A machine with broken sensors still runs its program — and reads its own
  // cell as flat, so the factory program sends it home. That is the right
  // failure: a unit that cannot tell how much charge it has goes back.
  assert.equal(decide(FACTORY_W4, {}).intent, 'home');
  assert.equal(runRonml('charge', { station: 'robot', session: {}, sense: {} }).text, '0');
  assert.equal(runRonml('threat', { station: 'robot', session: {} }).text, 'false');
});

test('and / or short-circuit, and not inverts', () => {
  const c = () => ({ station: 'laptop', session: {} });
  assert.equal(runRonml('true and false', c()).text, 'false');
  assert.equal(runRonml('false or true', c()).text, 'true');
  assert.equal(runRonml('not true', c()).text, 'false');
  assert.equal(runRonml('3 < 5 and 2 > 1', c()).text, 'true');
});

test('the intent vocabulary is fixed and known', () => {
  for (const i of ['patrol', 'hunt', 'flee', 'home', 'tend', 'wait']) assert.ok(INTENTS.includes(i));
  for (const i of INTENTS) assert.equal(decide(i, {}).intent, i, `${i} is a whole program`);
});

// ---- P3: the T1 actually runs on its program ------------------------------

test('the shipped T1 program decides the way a T1 behaves', () => {
  const s = (o) => ({ charge: 90, integrity: 100, range: 40, threat: false, ...o });
  assert.equal(decide(T1_PROGRAM, s({})).intent, 'patrol');
  assert.equal(decide(T1_PROGRAM, s({ threat: true, range: 5 })).intent, 'hunt');
  // No flee branch: shot to pieces, it still comes for you. That is what a T1 is,
  // and the program is where you can see that it is.
  assert.equal(decide(T1_PROGRAM, s({ threat: true, range: 5, integrity: 8, hurt: true })).intent, 'hunt');
  assert.equal(decide(T1_PROGRAM, s({ charge: 12, threat: true, range: 5 })).intent, 'home');
});

test('a commented service line is dropped, so uncommenting it fits the aid', () => {
  const aids = '(* eye "blue" ; flash 2 ; beep ;                          *)';
  assert.ok(T1_PROGRAM.includes(aids), 'the shipped unit carries the aids, disabled');
  const shipped = decide(T1_PROGRAM, { charge: 90 });
  assert.deepEqual(shipped.effects, [], 'commented out: the unit does nothing to itself');
  const fitted = decide(T1_PROGRAM.replace(aids, 'eye "blue" ; flash 2 ; beep ;'), { charge: 90 });
  assert.equal(fitted.intent, 'patrol', 'the aids do not change what it decides');
  assert.deepEqual(fitted.effects, [{ k: 'eye', colour: 'blue' }, { k: 'flash', hz: 2 }, { k: 'beep' }]);
});

test('effects only fire on the branch actually taken', () => {
  const p = 'if threat then (beep ; eye "white" ; hunt) else patrol';
  assert.deepEqual(decide(p, { threat: false }).effects, [], 'quiet while it sees nothing');
  const seen = decide(p, { threat: true });
  assert.equal(seen.intent, 'hunt');
  assert.deepEqual(seen.effects, [{ k: 'beep' }, { k: 'eye', colour: 'white' }]);
});

test('the lamp takes a named colour and a sane rate, or it faults', () => {
  assert.equal(decide('eye "puce" ; patrol', {}).ok, false);
  assert.match(decide('eye "puce" ; patrol', {}).fault, /no such lamp colour/);
  assert.equal(decide('flash 40 ; patrol', {}).ok, false);
  assert.equal(decide('flash 0 ; patrol', {}).intent, 'patrol', '0 is steady, not an error');
  for (const c of LAMP_COLOURS) assert.equal(decide(`eye "${c}" ; wait`, {}).intent, 'wait');
});

test('the service verbs are the machine\'s own: not available at a console', () => {
  const at = (station) => runRonml('beep', { station, session: {} });
  assert.equal(at('robot').ok, true);
  assert.equal(at('laptop').ok, false, 'a NostBook has no buzzer to sound');
  assert.equal(at('ob').ok, false);
});

// ---- P8: fire control ------------------------------------------------------
//
// A unit moves and shoots in the same quarter-second, so one intent per tick
// cannot describe it. A program may return a PAIR: what to do with its feet,
// and what to do with its weapon.
test('a program may answer with a pair, feet and weapon', () => {
  const sense = { threat: true, sight: true, armed: true };
  const one = decide('if threat then hunt else patrol', sense);
  assert.equal(one.intent, 'hunt');
  assert.equal(one.fire, null, 'a single intent leaves the weapon alone');
  const two = decide('if threat then [hunt, fire] else [patrol, hold]', sense);
  assert.equal(two.intent, 'hunt');
  assert.equal(two.fire, 'fire');
});

test('the five fire-control sensors reach a program', () => {
  const on = { sight: true, armed: true, shielded: true, contact: true, lost_for: 9 };
  for (const s of ['sight', 'armed', 'shielded', 'contact']) {
    assert.equal(decide(`if ${s} then wait else patrol`, on).intent, 'wait', s);
    assert.equal(decide(`if ${s} then wait else patrol`, {}).intent, 'patrol', `${s} off`);
  }
  assert.equal(decide('if lost_for > 8 then home else hunt', on).intent, 'home');
  assert.equal(decide('if lost_for > 8 then home else hunt', {}).intent, 'hunt');
});

test('a weapon word the chassis does not have is a fault, not a silent hold', () => {
  const r = decide('[hunt, detonate]', { threat: true });
  assert.equal(r.ok, false);
  assert.match(r.fault, /weapon/);
  // and a bad FOOT word is still caught the way it always was
  assert.match(decide('[dance, fire]', {}).fault, /is not something this unit can do/);
});

test('engage.ml on the disk answers correctly in every situation', () => {
  const disk = newShell();
  const src = runUnix('cat demos/engage.ml', disk, {}).text;
  const at = (sense) => {
    const r = decide(src, { armed: false, ...sense });
    assert.ok(r.ok, `faulted: ${r.fault}`);
    return `${r.intent}/${r.fire}`;
  };
  assert.equal(at({}), 'patrol/reload', 'nothing about: reload, do not hunt');
  assert.equal(at({ threat: true, sight: true }), 'flee/reload', 'dry and hunted: back off first');
  assert.equal(at({ threat: true, sight: true, armed: true }), 'hunt/fire');
  assert.equal(at({ threat: true, sight: true, armed: true, shielded: true }), 'hunt/hold',
    'behind cover: close, do not waste it');
  assert.equal(at({ threat: true, sight: true, armed: true, contact: true }), 'flee/fire',
    'grappled: break off and shoot on the way');
  assert.equal(at({ lost_for: 12, armed: true }), 'home/hold', 'lost you: give up and go back');
});
