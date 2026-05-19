// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #164 — the towers log you.
//
// The properties worth pinning are the ones that carry the argument: the
// classification moves with the PAPERWORK rather than the person, each node
// escalates on its own partial tally, and the route only exists once the
// slivers are pooled.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classify, statusNote, makeSighting, addSighting, sightingsText,
  mergeSightings, trackText, SIGHTINGS_KEPT,
  glitchFor, corrupt, clockSkew, shiftClock, duplicateCount,
} from '../src/game/sightings.js';

const see = (n, documented = false, over = {}) => makeSighting({
  at: '04:12', x: 118, y: 205, how: 'sight', count: n, documented, ...over,
});

test('THE PAPER CHANGES THE PERSON, AND NOTHING ELSE DOES', () => {
  // Same node, same tally, same person standing in the same place. The only
  // difference is whether a document was filed.
  const without = see(12, false);
  const with_ = see(12, true);
  assert.equal(without.cls, 'DELAY PENDING REVIEW');
  assert.equal(with_.cls, 'RESIDENT, DOCUMENTED');
  assert.equal(without.x, with_.x, 'they are standing in the same place');
  assert.match(without.note, /no permission on file/);
  assert.match(with_.note, /no action required/);
});

test('THE LADDER ENDS IN IMMOBILITY, NOT EXPULSION', () => {
  // These systems do not mostly throw people out. They restrict, they defer,
  // they schedule a review that never comes, and the waiting is the sanction.
  // Nowhere on the ladder is there an event with an end.
  assert.equal(classify(1, false), 'UNREGISTERED BIOFORM', 'not yet a person');
  assert.equal(classify(3, false), 'MIGRANT, UNDOCUMENTED');
  assert.equal(classify(7, false), 'RESTRICT — MOVEMENT LOGGED');
  assert.equal(classify(12, false), 'DELAY PENDING REVIEW');
  assert.equal(classify(40, false), 'HOLD IN PLACE');
  for (const n of [1, 3, 7, 12, 40]) {
    assert.ok(!/REMOV|DEPORT|EJECT/.test(classify(n, false)), `rung ${n} threatens removal`);
  }
});

test('the deferral never acquires a date', () => {
  assert.match(statusNote(false, 12), /no date set/);
  assert.match(statusNote(false, 40), /review not scheduled/);
});

test('documented, no amount of being seen escalates anything', () => {
  for (const n of [1, 5, 12, 400]) {
    assert.equal(classify(n, true), 'RESIDENT, DOCUMENTED', `at ${n} sightings`);
  }
});

test('EVERY NODE SEES A SLIVER: two towers classify one person differently', () => {
  // The tally is per node, so a tower you walked past once still calls you a
  // bioform while the one outside the grove has you down for removal. Neither
  // is wrong from where it stands, and that is the point.
  assert.equal(see(1).cls, 'UNREGISTERED BIOFORM');
  assert.equal(see(14).cls, 'DELAY PENDING REVIEW');
});

test('a node says its view is partial rather than implying it is whole', () => {
  const txt = sightingsText({ code: 'OB_5D33' }, [see(1)], { clock: '04:12', total: 1 });
  assert.match(txt, /PARTIAL/);
  assert.match(txt, /monitoring subject/);
  assert.match(txt, /OB_5D33 sightings/);
});

test('a node that has seen nothing says so rather than being blank', () => {
  assert.match(sightingsText({ code: 'OB_0000' }, []), /nothing has been seen/);
});

test('the roll-off is stated, never silent', () => {
  // A log that quietly forgets is claiming a completeness it does not have.
  let list = [];
  for (let i = 1; i <= SIGHTINGS_KEPT + 9; i++) list = addSighting(list, see(i));
  assert.equal(list.length, SIGHTINGS_KEPT, 'the node keeps a bounded window');
  const txt = sightingsText({ code: 'OB_X' }, list, { total: SIGHTINGS_KEPT + 9 });
  assert.match(txt, /9 earlier entries rolled off/);
});

test('THE ROUTE ONLY EXISTS ONCE THE SLIVERS ARE POOLED', () => {
  // No tower holds a track. Three towers each hold one moment; merging them is
  // what produces a day of somebody's movements.
  const nodes = {
    OB_A: [see(1, false, { at: '09:10' })],
    OB_B: [see(1, false, { at: '04:12' })],
    OB_C: [see(1, false, { at: '06:15' })],
  };
  for (const entries of Object.values(nodes)) assert.equal(entries.length, 1, 'each node has one moment');
  const track = mergeSightings(nodes);
  assert.equal(track.length, 3);
  assert.deepEqual(track.map((e) => e.at), ['04:12', '06:15', '09:10'], 'in time order');
  assert.deepEqual(track.map((e) => e.node), ['OB_B', 'OB_C', 'OB_A'], 'each keeps its provenance');
});

test('A NODE OFF THE NET LEAVES A HOLE, and the track admits it', () => {
  // Jamming, looping or felling a tower is a real act: its arc is absent, and
  // the file says how much of the network was actually reporting.
  const txt = trackText(mergeSightings({ OB_A: [see(1)] }), { reporting: 1, total: 12, clock: '09:10' });
  assert.match(txt, /pooled from 1 of 12 nodes reporting/);
  assert.match(txt, /11 nodes are off the net/);
  assert.match(txt, /absent from this track/);
});

test('a fully-reporting net does not complain about nodes that are fine', () => {
  const txt = trackText(mergeSightings({ OB_A: [see(1)] }), { reporting: 12, total: 12 });
  assert.ok(!/off the net/.test(txt));
});

test('nothing in a field can break the columns', () => {
  const e = makeSighting({ at: '04:12', x: 118, y: 205, count: 1, documented: false, unit: 'OB_X.t1a\n|evil' });
  const line = sightingsText({ code: 'OB_X' }, [e]).split('\n').find((l) => l.startsWith('04:12'));
  assert.equal(line.split('|').length, 5, 'five columns, whatever a unit is called');
});

test('a unit report reads as one clause, not two', () => {
  assert.match(see(2, false, { unit: 'OB_5D33.t1a' }).note, /reported by unit OB_5D33\.t1a/);
});

test('the status clause is the whole of the difference', () => {
  assert.match(statusNote(false), /^no permission on file\.$/);
  assert.match(statusNote(true), /PERMISSION\.ML/);
});


// ---- the record is not clean --------------------------------------------

test('THE DAMAGE IS DETERMINISTIC: a reload shows the same corruption', () => {
  // A glitch that moves when you look away is a rendering bug, not a record —
  // and the entries are saved, so this has to hold across a session.
  for (const seq of [1, 7, 23, 400]) {
    assert.equal(glitchFor('OB_5D33', seq), glitchFor('OB_5D33', seq));
  }
  assert.equal(clockSkew('OB_A'), clockSkew('OB_A'), 'a clock drifts, it does not flicker');
});

test('different nodes are damaged differently', () => {
  const kinds = new Set();
  for (let i = 0; i < 200; i++) kinds.add(glitchFor(`OB_${i}`, i));
  assert.ok(kinds.size >= 4, 'the whole network does not fail in one way');
});

test('most records are fine, which is what makes the rest land', () => {
  let clean = 0;
  const N = 2000;
  for (let i = 0; i < N; i++) if (glitchFor(`OB_${i % 12}`, i) === 'none') clean++;
  const rate = clean / N;
  assert.ok(rate > 0.5 && rate < 0.75, `clean rate ${rate} should sit near 0.62`);
});

test('A DUPLICATE COUNTS: a flaky link escalates a person', () => {
  // The sharpest form of the argument. A retransmit is one moment filed twice,
  // both rows are kept, and the tally the classification is built on includes
  // both — so a bad radio moves somebody up the ladder.
  const seq = Array.from({ length: 400 }, (_, i) => i).find((i) => glitchFor('OB_R', i) === 'retx');
  assert.ok(seq != null, 'the corpus contains a retransmit');
  const rows = corrupt(see(3), 'OB_R', seq);
  assert.equal(rows.length, 2, 'one moment, two records');
  assert.equal(rows[1].flag, 'RETX');
  assert.equal(rows[0].at, rows[1].at, 'the same moment');
  assert.equal(duplicateCount(rows), 1);
});

test('a damaged record is retained rather than dropped', () => {
  // Which is the difficulty: the estate never treats its own corruption as a
  // reason to doubt what it concluded.
  for (const seq of Array.from({ length: 60 }, (_, i) => i)) {
    const rows = corrupt(see(2), 'OB_D', seq);
    assert.ok(rows.length >= 1, `seq ${seq} dropped the record`);
    for (const r of rows) assert.ok(r.cls, 'and it still carries a classification');
  }
});

test('a lost bearing prints as unknown, not as a coordinate', () => {
  const seq = Array.from({ length: 400 }, (_, i) => i).find((i) => glitchFor('OB_B2', i) === 'bearing');
  const [row] = corrupt(see(2), 'OB_B2', seq);
  assert.equal(row.x, null);
  const line = sightingsText({ code: 'OB_B2' }, [row]).split('\n').find((l) => l.startsWith('04:12'));
  assert.match(line, /\?,\?/, 'a missing position must not render as 0,0');
});

test('the file owns up to its own damage, and concludes anyway', () => {
  const seqs = Array.from({ length: 40 }, (_, i) => i);
  let list = [];
  for (const q of seqs) list = addSighting(list, see(q + 1), 'OB_F', q);
  const txt = sightingsText({ code: 'OB_F' }, list, { total: list.length });
  assert.match(txt, /arrived flagged/, 'it reports the damage');
  assert.match(txt, /counted toward classification|HOLD IN PLACE|DELAY/, 'and classifies regardless');
});

test('clock skew shifts a time and wraps the day', () => {
  assert.equal(shiftClock('04:12', 5), '04:17');
  assert.equal(shiftClock('23:58', 5), '00:03');
  assert.equal(shiftClock('00:02', -5), '23:57');
  assert.equal(shiftClock('not a time', 5), 'not a time');
});

test('the pooled track admits its order is only the reported order', () => {
  const skewed = { ...see(1), flag: 'CLK', at: '05:00' };
  const txt = trackText(mergeSightings({ OB_S: [skewed] }), { reporting: 2, total: 2 });
  assert.match(txt, /unsynchronised clock/);
  assert.match(txt, /by reported time/, 'it does not claim to know the real order');
});
