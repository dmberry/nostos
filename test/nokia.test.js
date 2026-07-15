import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createNokia, sendNokia, holdRise, holdFall, holdBand,
  HOLD_INIT, HOLD_WARM, HOLD_COLD,
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
