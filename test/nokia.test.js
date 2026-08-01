// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createNokia, sendNokia, holdRise, holdFall, holdBand,
  HOLD_INIT, HOLD_WARM, HOLD_COLD,
  calypsoSms, ronSms, bearingText,
} from '../src/game/nokia.js';

const mkPlayer = (hold = HOLD_INIT) => ({ calypsoHold: hold, nokiaSent: new Set(), _nokiaIvIdx: 0 });

test('holdBand: warm / wary / cold at the thresholds', () => {
  assert.equal(holdBand(HOLD_WARM), 'warm');
  assert.equal(holdBand(HOLD_WARM - 0.01), 'wary');
  assert.equal(holdBand(HOLD_COLD), 'wary');
  assert.equal(holdBand(HOLD_COLD - 0.01), 'cold');
});

test('holdRise / holdFall clamp to [0,1]', () => {
  const p = mkPlayer(0.95);
  holdRise(p, 0.2); assert.equal(p.calypsoHold, 1);
  holdFall(p, 5); assert.equal(p.calypsoHold, 0);
});

test('sendNokia: once-texts fire exactly once (survives the tutorial across reload via nokiaSent)', () => {
  const n = createNokia(); const p = mkPlayer();
  assert.equal(sendNokia(n, 'landfall', { player: p }), true, 'first landfall sends');
  assert.equal(sendNokia(n, 'landfall', { player: p }), false, 'second is suppressed');
  assert.ok(p.nokiaSent.has('landfall'));
  // a fresh player whose nokiaSent was restored from a save is not re-tutorialed
  const p2 = { calypsoHold: HOLD_INIT, nokiaSent: new Set([...p.nokiaSent]) };
  assert.equal(sendNokia(n, 'landfall', { player: p2 }), false, 'restored save does not re-send');
});

test('sendNokia: repeatable texts (no `once`) fire every time', () => {
  const n = createNokia(); const p = mkPlayer();
  assert.equal(sendNokia(n, 'crossFailReturn', { player: p }), true);
  assert.equal(sendNokia(n, 'crossFailReturn', { player: p }), true, 'the pincer beat repeats each failed crossing');
});

test('tiered texts change tone with her hold', () => {
  const n = createNokia();
  const warm = mkPlayer(0.9), cold = mkPlayer(0.2);
  sendNokia(n, 'firstRest', { player: warm });
  n.tick(0.1);
  const warmLines = n.current.lines.join(' ');
  const n2 = createNokia();
  sendNokia(n2, 'firstRest', { player: cold });
  n2.tick(0.1);
  const coldLines = n2.current.lines.join(' ');
  assert.notEqual(warmLines, coldLines, 'warm and cold rest texts differ');
});

test('queue: texts show one at a time, beep on appearance, expire, then the next', () => {
  const n = createNokia(); const p = mkPlayer();
  n.enqueue('CALYPSO', ['one']);
  n.enqueue('CALYPSO', ['two']);
  assert.equal(n.current, null);
  n.tick(0.016);                       // first becomes current
  assert.equal(n.current.lines[0], 'one');
  assert.equal(n.justShown, true, 'beep fires the frame it appears');
  n.tick(0.016);
  assert.equal(n.justShown, false, 'not on subsequent frames');
  n.tick(999);                          // expire the first → into the inter-text gap
  assert.equal(n.current, null, 'gap between texts');
  n.tick(999);                          // clear the gap (this tick consumes it)
  n.tick(0.016);                        // now the second appears
  assert.equal(n.current.lines[0], 'two');
  assert.equal(n.pending, 0);
});


// ---- THE HANDSET AS A TOOL -------------------------------------------------
//
// The SMS channel was flavour: a regex matched and somebody said something. It
// is the one part of the phone that could not DO anything, which is why nobody
// used it. Both correspondents take commands now, and the difference between
// them is the design:
//
//   CALYPSO ACTS, and every favour raises her hold — accepting help from the
//   keeper is the rope. She refuses outright when she is cold.
//   RON KNOWS, and never does anything. Bearings, counts, field notes.
//
// nokia.js reaches the world through a ctx, the way the terminals do, so all of
// this drives against a stub with no map and no canvas.

function smsStub(over = {}) {
  const calls = [];
  return {
    calls,
    holdRise: (a) => calls.push(['hold', a]),
    sleepNearby: (m) => { calls.push(['sleep', m]); return 3; },
    thinFog: () => calls.push(['fog']),
    toShelter: () => 'NE, about 12 paces',
    leaveFood: () => 'NE, about 12 paces',
    whereAmI: () => 'out in the open on OGYGIA',
    toCache: () => 'S, about 30 paces',
    toRelay: () => 'W, about 44 paces',
    toCover: () => 'E, about 6 paces',
    status: () => ({ live: 9, total: 12, factory: true, hours: 7 }),
    manualOn: (q) => (/bluebox/i.test(q) ? 'Bluebox: splices a downed machine.' : null),
    recipeOf: (q) => (/bluebox/i.test(q) ? 'two circuit boards. press C.' : /rope/i.test(q) ? '' : null),
    helpState: () => ({ hasLaptop: true, hurt: false, night: false, live: 9 }),
    ...over,
  };
}

test('Calypso acts on a command, and it costs you', () => {
  const s = smsStub();
  const r = calypsoSms('sleep', 'warm', 0, s);
  assert.match(r, /stopped where they stand/);
  assert.deepEqual(s.calls, [['sleep', 20], ['hold', 0.05]], 'the favour ran and the hold rose');
});

test('every favour of hers raises the hold', () => {
  for (const word of ['sleep', 'fog', 'light', 'hungry']) {
    const s = smsStub();
    calypsoSms(word, 'warm', 0, s);
    assert.ok(s.calls.some(([k]) => k === 'hold'), `"${word}" was free, and none of hers should be`);
  }
});

test('asking where you are is free — she likes being asked', () => {
  const s = smsStub();
  const r = calypsoSms('where am i', 'warm', 0, s);
  assert.match(r, /out in the open on OGYGIA/);
  assert.deepEqual(s.calls, [], 'no cost for a question she enjoys');
});

test('cold, she does no favours at all', () => {
  const s = smsStub();
  const r = calypsoSms('sleep', 'cold', 0, s);
  assert.match(r, /boat on my sand/);
  assert.deepEqual(s.calls, [], 'nothing ran, and nothing was charged');
  // ...but a free question still answers, because it costs her nothing to look.
  const s2 = smsStub();
  assert.match(calypsoSms('where am i', 'cold', 0, s2), /OGYGIA/);
});

test('with no ctx she is exactly as talkative as before', () => {
  // The flavour tables are untouched, and a host that passes nothing gets the
  // old behaviour — which is what the game did before this and what the tests
  // above this line still assert.
  const r = calypsoSms('sleep', 'warm', 0);
  assert.ok(typeof r === 'string' && r.length > 0);
  assert.doesNotMatch(r, /stopped where they stand/);
});

test('RON answers with bearings and counts, and touches nothing', () => {
  const s = smsStub();
  assert.match(ronSms('supply', 0, s), /S, about 30 paces/);
  assert.match(ronSms('where is the nearest relay', 0, s), /W, about 44 paces/);
  assert.match(ronSms('mayday', 0, s), /E, about 6 paces/);
  assert.deepEqual(s.calls, [], 'the mesh does nothing for you, ever');
});

test('RON status reports the network', () => {
  const s = smsStub();
  const r = ronSms('status', 0, s);
  assert.match(r, /9 of 12 towers/);
  assert.match(r, /factory running/);
  assert.match(r, /7h to the purge/);
});

test('WHAT IS reads the same field note the tooltip prints', () => {
  const s = smsStub();
  assert.match(ronSms('what is a bluebox', 0, s), /splices a downed machine/);
  assert.match(ronSms('what is the bluebox?', 0, s), /splices a downed machine/);
  assert.match(ronSms('what is a flibbertigibbet', 0, s), /nothing in the manual/);
});

test('RECIPE says how a thing is built, or that it is not built at all', () => {
  const s = smsStub();
  assert.match(ronSms('recipe bluebox', 0, s), /two circuit boards/);
  assert.match(ronSms('how do i build a bluebox', 0, s), /two circuit boards/);
  assert.match(ronSms('recipe rope', 0, s), /isn't built, it's found/);
  assert.match(ronSms('recipe unicorn', 0, s), /nothing in the manual/);
});

test('a command RON cannot answer falls through to the old advice', () => {
  // `status` with no world behind it must not answer half a sentence.
  const s = smsStub({ status: () => null });
  const r = ronSms('status of the towers', 0, s);
  assert.doesNotMatch(r, /undefined|null/);
  assert.match(r, /RON/);
});

test('bearingText names a direction and a distance you can walk', () => {
  const at = { x: 10, y: 10 };
  assert.match(bearingText(at, { x: 10, y: 0 }), /^N, about 10 paces$/);
  assert.match(bearingText(at, { x: 20, y: 10 }), /^E, about 10 paces$/);
  assert.equal(bearingText(at, { x: 10.2, y: 10 }), 'right where you are standing');
  assert.equal(bearingText(null, at), null);
});

// ---- asking for help (#201, #202) -------------------------------------------
//
// The one word a frightened player actually types. It used to reach a talk line
// and nothing else, from either correspondent.

test('CALYPSO stops the machines around you when you ask for help', () => {
  const s = smsStub();
  const r = calypsoSms('help', 'warm', 0, s);
  assert.match(r, /3 of his machines have stopped/);
  assert.deepEqual(s.calls, [['sleep', 20], ['hold', 0.06]], 'the hand ran and it cost the most');
});

test('with nothing near her, she tells you where to look instead — and it costs less', () => {
  const s = smsStub({ sleepNearby: () => 0 });
  const r = calypsoSms('help', 'warm', 0, s);
  assert.doesNotMatch(r, /stopped where they stand|machines have stopped/);
  assert.deepEqual(s.calls, [['hold', 0.02]], 'a hint is the cheaper favour');
});

test('not always: some asks she answers and does nothing', () => {
  // n % 4 === 3 falls through to the talk line, which is the existing one.
  const s = smsStub();
  const r = calypsoSms('help', 'warm', 3, s);
  assert.deepEqual(s.calls, [], 'no favour ran, so nothing was charged');
  assert.match(r, /Stand still in the dark/);
});

test('a hint names something the player has actually got', () => {
  const seen = [];
  for (let n = 0; n < 8; n++) {
    if (n % 4 === 3) continue;
    seen.push(calypsoSms('help', 'warm', n, smsStub({ sleepNearby: () => 0 })));
  }
  assert.ok(seen.some((r) => /Netscape/.test(r)), 'she never points at the web');
  assert.ok(new Set(seen).size > 1, 'she reads the same hint on a loop');
  // No machine in the pack, so no line about a machine in the pack.
  for (let n = 0; n < 12; n++) {
    if (n % 4 === 3) continue;
    const r = calypsoSms('help', 'warm', n, smsStub({
      sleepNearby: () => 0,
      helpState: () => ({ hasLaptop: false, hurt: false, night: false, live: 0 }),
    }));
    assert.doesNotMatch(r, /Netscape|Telnet|type man/i, `n=${n} hinted at a machine that is not there`);
  }
});

test('asking her for help while she is cold gets the refusal, not a hand', () => {
  const s = smsStub();
  const r = calypsoSms('help', 'cold', 0, s);
  assert.match(r, /boat on my sand/);
  assert.deepEqual(s.calls, [], 'nothing ran and nothing was charged');
});

test('a bare help to RON answers with the index, not just no cavalry', () => {
  const s = smsStub();
  const r = ronSms('help', 0, s);
  assert.match(r, /no cavalry/);
  assert.match(r, /STATUS/);
  assert.match(r, /WHAT IS/);
  assert.match(r, /9\/12 towers up/);
});

test('help wrapped around a real question still reaches the answer', () => {
  const s = smsStub();
  assert.match(ronSms('help me build a bluebox', 0, s), /two circuit boards/);
  assert.match(ronSms('help, what is a bluebox', 0, s), /splices a downed machine/);
});
