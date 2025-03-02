// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// Walk the departure register and assert every entry is still a departure.
//
// This test failing is usually GOOD NEWS: it means the language grew to cover
// something the register says it does not, and the entry should be pruned. The
// failure message says so. The console's own diagnostic list went stale six
// times before a walking test was put on it; this is the same guard aimed at
// the conformance claims instead.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEPARTURES, countBySeverity } from '../harness/departures.mjs';
import { session } from '../harness/interp.mjs';
import { noJsLeak } from '../harness/expect.mjs';

const PRUNE = (d) => `${d.id} (${d.area}): ${JSON.stringify(d.sml)} is no longer a departure.\n` +
  `  Standard ML: ${d.standard}\n` +
  `  If the build now agrees, delete ${d.id} from ML_tests/harness/departures.mjs\n` +
  `  and move its case into the matching file under ML_tests/core/.`;

function runEntry(d) {
  const s = session({ types: 'report' });
  for (const line of d.setup || []) s.run(line);
  return { s, r: s.run(d.sml) };
}

for (const d of DEPARTURES) {
  test(`${d.id} ${d.area}: ${d.sml.split('\n')[0]}`, () => {
    const { s, r } = runEntry(d);

    if (d.build.refused) {
      assert.equal(r.ok, false, PRUNE(d));
      assert.match(String(r.text), d.build.refused,
        `${d.id}: still refused, but the message changed to ${JSON.stringify(r.text)}.\n` +
        '  Update the register entry if the new message is the intended one.');
      // Even a refusal must be a teaching error rather than a JavaScript one.
      noJsLeak(r.text, d.sml);
      return;
    }

    if (d.build.prints !== undefined) {
      assert.equal(r.text, d.build.prints, PRUNE(d));
      return;
    }

    if ('notType' in d.build) {
      assert.notEqual(s.type(d.sml), d.build.notType,
        `${PRUNE(d)}\n  The checker now reports ${JSON.stringify(d.build.notType)}, which is right.`);
      return;
    }

    if (d.build.refusedOrLeaks) {
      assert.notEqual(r.ok, true, PRUNE(d));
      return;
    }

    assert.fail(`${d.id} has no checkable expectation in its build field`);
  });
}

test('every entry is fully filled in', () => {
  const seen = new Set();
  for (const d of DEPARTURES) {
    assert.ok(/^D-\d+$/.test(d.id), `${d.id} is not a well-formed id`);
    assert.ok(!seen.has(d.id), `${d.id} appears twice`);
    seen.add(d.id);
    assert.ok(d.area && d.severity && d.sml && d.standard,
      `${d.id} is missing one of area/severity/sml/standard`);
    assert.ok(['silent', 'gap', 'report', 'shape'].includes(d.severity),
      `${d.id} has an unknown severity ${d.severity}`);
    assert.ok(d.build && Object.keys(d.build).length, `${d.id} records no current behaviour`);
  }
});

test('the register is summarised for the report', () => {
  const c = countBySeverity();
  // Not a threshold, just proof the summary the docs quote can be computed.
  // An EMPTY register is a valid state and has been the state since v1.303, so
  // this counts rather than requiring entries to exist.
  assert.equal(Object.values(c).reduce((a, b) => a + b, 0), DEPARTURES.length);
});
