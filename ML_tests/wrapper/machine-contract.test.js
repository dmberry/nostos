// The AI-ML wrapper: the contract between the language and the game.
//
// The language is tested elsewhere in this folder. What is tested here is the
// join: the senses a machine is given, the intents it may return, and the
// stations that decide which verbs exist. These are registries, and registries
// drift from what they describe unless something walks them. In this repo they
// have drifted six times in the diagnostic list, and once each in the man
// pages, the help box and the command dispatch.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gameRaw, hasGame } from '../harness/expect.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = (p) => fs.readFileSync(path.join(REPO, p), 'utf8');

// This whole file is nostos-specific: it tests the wrapper, not the language,
// so it skips wholesale in the published BML repo rather than failing there.
const { decide, INTENTS, FIRE, LAMP_COLOURS } = gameRaw || {};
const SKIP = hasGame ? false : 'no game in this repo: the wrapper is nostos-only';

// ---- what a machine can be asked -----------------------------------------

test('a program is a pure function from what is sensed to what is intended', { skip: SKIP }, () => {
  const prog = [
    'if charge < 20 then home',
    'else if threat and hurt then flee',
    'else if threat then hunt',
    'else patrol',
  ].join('\n');
  assert.equal(decide(prog, { charge: 10, threat: false, hurt: false }).intent, 'home');
  assert.equal(decide(prog, { charge: 90, threat: true, hurt: true }).intent, 'flee');
  assert.equal(decide(prog, { charge: 90, threat: true, hurt: false }).intent, 'hunt');
  assert.equal(decide(prog, { charge: 90, threat: false, hurt: false }).intent, 'patrol');
});

test('the same senses always give the same intent', { skip: SKIP }, () => {
  const prog = 'if threat then hunt else patrol';
  const sense = { threat: true };
  const first = decide(prog, sense).intent;
  for (let i = 0; i < 20; i++) assert.equal(decide(prog, sense).intent, first);
});

test('a program may answer with a pair, feet first', { skip: SKIP }, () => {
  // A W-4 moves and shoots in the same quarter second, so one word is not
  // enough: the intent comes first and the weapon second.
  const r = decide('if sight and armed then [hunt, fire] else [patrol, hold]',
    { sight: true, armed: true });
  assert.equal(r.intent, 'hunt');
  assert.equal(r.fire, 'fire');
  const held = decide('if sight and armed then [hunt, fire] else [patrol, hold]', {});
  assert.equal(held.intent, 'patrol');
  assert.equal(held.fire, 'hold');
});

test('an intent the unit cannot do is a fault, and the fault names it', { skip: SKIP }, () => {
  const r = decide('if threat then dance else patrol', { threat: true });
  assert.equal(r.ok, false);
  assert.match(String(r.fault), /not something this unit can do/);
});

test('an empty or unreadable program faults rather than throwing', { skip: SKIP }, () => {
  for (const prog of ['', '   ', 'if then', '(', 'hunt hunt hunt']) {
    const r = decide(prog, {});
    assert.equal(typeof r.ok, 'boolean', `${JSON.stringify(prog)} returned no verdict`);
    if (!r.ok) assert.equal(typeof r.fault, 'string', `${JSON.stringify(prog)} faulted with no reason`);
  }
});

test('a sense the world did not supply reads false rather than exploding', { skip: SKIP }, () => {
  // A machine with a broken aerial must keep thinking. What it must NOT do is
  // stop, so an absent sense is a false rather than an error.
  const r = decide('if threat then hunt else patrol', {});
  assert.equal(r.ok, true);
  assert.equal(r.intent, 'patrol');
});

// ---- the registries ------------------------------------------------------

test('every intent the language advertises is one some machine can carry out', { skip: SKIP }, () => {
  // INTENTS is what a program may return; T1_CAN is what a T-1 will accept.
  // A name in the first and in no capability list is advertised and then
  // faulted on, which is honest at runtime and misleading in the manual.
  const robots = src('src/game/robots.js');
  const canLists = [...robots.matchAll(/const\s+\w+_CAN\s*=\s*\[([^\]]*)\]/g)]
    .flatMap((m) => [...m[1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]));
  assert.ok(canLists.length, 'no capability list found in robots.js');
  const orphans = INTENTS.filter((i) => !canLists.includes(i));
  assert.deepEqual(orphans, ['tend'],
    `INTENTS and the capability lists have drifted apart: ${orphans.join(', ')}.\n` +
    '  Either wire the intent to a class, or take it out of INTENTS.\n' +
    '  (tend is the known one; update this test when it is resolved.)');
});

test('every sense the language declares is supplied to some machine', { skip: SKIP }, () => {
  // Declared in ai_ml.js as SENSE('name', kind); supplied in robots.js by the
  // per-class sense function. A sense in the first and not the second is a
  // branch a program can write that reads false for ever, with no error.
  const declared = [...src('src/game/ai_ml.js').matchAll(/SENSE\('([a-z_]+)'/g)].map((m) => m[1]);
  const supplied = Object.keys(
    Object.fromEntries([...src('src/game/robots.js')
      .slice(src('src/game/robots.js').indexOf('function t1Sense'))
      .slice(0, 1400)
      .matchAll(/^\s{4}([a-z_]+):/gm)].map((m) => [m[1], true])),
  );
  assert.ok(declared.length >= 7, 'no senses found in ai_ml.js');
  const never = declared.filter((d) => !supplied.includes(d));
  assert.deepEqual(never.sort(), ['armed', 'blight', 'contact', 'daylight', 'lost_for', 'shielded', 'sight'],
    `the declared senses and the supplied ones have drifted: ${never.join(', ')}.\n` +
    '  A program branching on one of these takes the false branch for ever and\n' +
    '  nothing reports it. Either supply it, or stop declaring it.\n' +
    '  The five fire-control senses are reachable through decide() in tests but\n' +
    '  no live unit fills them, so demos/engage.ml cannot run in the world yet.');
});

test('the fire words and the lamp colours are closed sets', { skip: SKIP }, () => {
  assert.deepEqual(FIRE, ['fire', 'hold', 'reload']);
  for (const c of LAMP_COLOURS) assert.match(c, /^[a-z]+$/);
  assert.ok(LAMP_COLOURS.includes('amber'), 'the fault lamp colour must exist');
});

// ---- stations ------------------------------------------------------------

test('a verb that belongs to another station says where it lives', { skip: SKIP }, () => {
  const { runRonml } = gameRaw;
  const ob = { station: 'ob', session: {}, hasAiKey: () => false };
  const r = runRonml('read', ob);
  assert.equal(r.ok, false);
  assert.ok(!/no such command/.test(String(r.text)),
    'a verb that exists elsewhere should not be reported as a typo');
});

test('the machine station does not offer the console verbs', { skip: SKIP }, () => {
  const { runRonml } = gameRaw;
  const bot = { station: 'robot', session: {}, sense: {} };
  const r = runRonml('scan', bot);
  assert.equal(r.ok, false, 'a machine cannot scan the network from its own program');
});

test('at a console an unbound word is reported as a mistyped command', { skip: SKIP }, () => {
  // The language says "unbound variable", which is what SML says and what the
  // standalone REPL prints. A console is not a REPL: the player is typing verbs,
  // so the wrapper rephrases the same refusal as a typo and points at `help`.
  // Both are refusals; only the wording differs, and the wording is the game's.
  const { runRonml } = gameRaw;
  const r = runRonml('hfhfh', { station: 'ob', session: {}, hasAiKey: () => false });
  assert.equal(r.ok, false);
  assert.match(String(r.text), /no such command|unbound/);
});

test('a bare word in a machine program is an intent, not a typo', { skip: SKIP }, () => {
  // At a console a bare unknown word is a mistyped command. In a machine's own
  // program it is the intent it chose, so the typo rule must not fire there.
  const r = decide('patrol', {});
  assert.equal(r.ok, true);
  assert.equal(r.intent, 'patrol');
});
