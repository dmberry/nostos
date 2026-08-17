// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The share-card titles are a GENERATED COPY of what the corpus says, kept
// inside /api so the serverless function never reaches into ../src. A copy can
// drift from its source, and drift is this project's recurring failure, so the
// copy is regenerated here and compared. Adding a page to the cached web without
// re-running tools/gen-card-titles.mjs fails the suite rather than shipping a
// share card that names the wrong thing or nothing at all.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TITLES } from '../api/_titles.mjs';
import { buildTitles } from '../tools/gen-card-titles.mjs';
import { addressFrom, cardFor } from '../api/card.mjs';
import { CACHE_ALIASES } from '../src/game/net.js';

test('the generated titles match the corpus', () => {
  const fresh = buildTitles();
  const missing = Object.keys(fresh).filter((k) => !(k in TITLES));
  const stale = Object.keys(TITLES).filter((k) => !(k in fresh));
  const wrong = Object.keys(fresh).filter((k) => k in TITLES && TITLES[k] !== fresh[k]);
  assert.deepEqual(
    { missing, stale, wrong }, { missing: [], stale: [], wrong: [] },
    'run: node tools/gen-card-titles.mjs',
  );
});

test('every cache alias has a card', () => {
  // An alias is quoted in prose. If it unfurls as "Not in store" the link looks
  // broken to everyone who has not clicked it.
  const dead = Object.keys(CACHE_ALIASES).filter((a) => !TITLES[a]);
  assert.deepEqual(dead, []);
});

test('an address is read out of the query the way the game reads it', () => {
  assert.equal(addressFrom('?cache=locarecords.com'), 'locarecords.com');
  assert.equal(addressFrom('?cache=http://eliza.geocities.ws/'), 'eliza.geocities.ws');
  assert.equal(addressFrom('?cache=usc.edu/retroai'), 'usc.edu/retroai');
  assert.equal(addressFrom('?cache='), null);
  assert.equal(addressFrom(''), null);
  assert.equal(addressFrom('?cache=two words'), null, 'somebody else\'s URL, pasted');
  assert.equal(addressFrom('?cache=a@b.com'), null);
});

test('a page in store gets its own title, not a generic one', () => {
  const c = cardFor('locarecords.com');
  assert.equal(c.title, 'Loca Records', 'the page\'s own title, nothing appended');
  assert.ok(c.title.length < 70, 'a card title that runs long is truncated by the platform');
  assert.match(cardFor('retroai').title, /^Retro AI/, 'aliases resolve');
  assert.equal(cardFor('USC.EDU/RETROAI').title, cardFor('usc.edu/retroai').title, 'case insensitive');
});

test('a miss is the 404, not the default card', () => {
  // David, 2026-08-17: a link to something never held should unfurl as the
  // archive saying so, the same answer the game gives on the same address.
  const c = cardFor('nosuchplace.com');
  assert.equal(c.title, 'Not in store');
  assert.match(c.desc, /no record of nosuchplace\.com/);
  assert.match(c.desc, /the crawl took what was answering/);
  assert.doesNotMatch(c.title, /postAI Odyssey/, 'not the game default');
});

test('a missing address does not throw and does not invent a name', () => {
  const c = cardFor(null);
  assert.equal(c.title, 'Not in store');
  assert.match(c.desc, /that address/);
});
