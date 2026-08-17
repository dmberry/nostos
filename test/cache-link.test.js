// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The deep link. A URL from outside opens one page of the cached web.
//
// The parser is the whole of the feature that can be got wrong quietly: a bad
// link does not throw, it just opens the bookmarks, so nobody would notice a
// regression here until somebody followed a link that had been printed
// somewhere unchangeable. Hence a test per form rather than one round trip.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cacheLink, CACHE_ALIASES } from '../src/game/net.js';
import { ARCHIVED_SITES, departmentPage, universityAt } from '../src/game/archive.js';

test('the query form resolves a host', () => {
  assert.equal(cacheLink('?cache=whatishistory.geocities.ws', '/'),
    'whatishistory.geocities.ws');
});

test('the path form resolves a host, which is what the vercel rewrite leaves behind', () => {
  // A REWRITE does not change the browser's URL, so the client sees the path
  // and an empty query. If this stops working the short links die silently.
  assert.equal(cacheLink('', '/c/whatishistory.geocities.ws'),
    'whatishistory.geocities.ws');
  assert.equal(cacheLink('', '/c/whatishistory.geocities.ws/'),
    'whatishistory.geocities.ws');
});

test('a path with slashes in the host survives, because some cached hosts have them', () => {
  assert.equal(cacheLink('', '/c/homepage.mac.com/mirrordisc'),
    'homepage.mac.com/mirrordisc');
});

test('aliases resolve, and are case-insensitive', () => {
  assert.equal(cacheLink('', '/c/history'), 'whatishistory.geocities.ws');
  assert.equal(cacheLink('?cache=ELIZA', '/'), 'eliza.geocities.ws');
});

test('EVERY ALIAS POINTS AT A PAGE THAT EXISTS', () => {
  // The reason this test is here: an alias is quoted in prose that cannot be
  // edited afterwards. Renaming a page in the corpus must fail the build
  // rather than break a printed link.
  //
  // Widened 2026-08-17: an alias may point at a DEPARTMENT page as well as an
  // archived site (`retroai -> usc.edu/retroai`), which the game resolves and
  // this test did not know about. The intent is unchanged; the set of things
  // that count as a page is now the set the game can actually open.
  const domains = new Set(ARCHIVED_SITES.map((s) => s.domain));
  const resolves = (host) => domains.has(host) || !!departmentPage(host) || !!universityAt(host);
  const dead = Object.entries(CACHE_ALIASES)
    .filter(([, host]) => !resolves(host))
    .map(([k, host]) => `${k} -> ${host}`);
  assert.deepEqual(dead, []);
});

test('a scheme on the front is stripped, including the unresolvable cache:// one', () => {
  assert.equal(cacheLink('?cache=cache://eliza.geocities.ws/', '/'), 'eliza.geocities.ws');
  assert.equal(cacheLink('?cache=http://eliza.geocities.ws', '/'), 'eliza.geocities.ws');
});

test('no link is no link, and never an exception', () => {
  assert.equal(cacheLink('', '/'), null);
  assert.equal(cacheLink('?cache=', '/c/'), null);
  assert.equal(cacheLink(undefined, undefined), null);
  assert.equal(cacheLink('?%%%', '/'), null);
});

test('somebody else’s URL pasted in is refused rather than half-parsed', () => {
  assert.equal(cacheLink('?cache=http://example.com/a b', '/'), null);
  assert.equal(cacheLink('?cache=user@example.com', '/'), null);
});

test('the query wins over the path, so an explicit link is never overridden', () => {
  assert.equal(cacheLink('?cache=eliza.geocities.ws', '/c/history'),
    'eliza.geocities.ws');
});

test('any page in the corpus can be addressed, not just the aliased ones', () => {
  // The feature is only worth having if it covers the whole cached web, so
  // walk all of it rather than spot-checking.
  const bad = [];
  for (const site of ARCHIVED_SITES) {
    if (cacheLink('', `/c/${site.domain}`) !== site.domain) bad.push(site.domain);
    if (cacheLink(`?cache=${site.domain}`, '/') !== site.domain) bad.push(site.domain);
  }
  assert.deepEqual(bad, []);
});
