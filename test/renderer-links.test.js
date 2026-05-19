// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the GNU General
// Public License as published by the Free Software Foundation, either version 3
// of the License, or (at your option) any later version. This program is
// distributed WITHOUT ANY WARRANTY; see <https://www.gnu.org/licenses/>.

// Two bugs that broke quietly: a link the renderer could not see, and a verb
// whose argument check named a tag that no longer existed. Neither threw, and
// both were only visible by using the thing.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPage, relayBookmarksPage, pageFor, hostTable, RELAY_IP, RELAY_FILES, RELAY_BUNDLES } from '../src/game/net.js';
import { runRonml } from '../src/game/ai_ml.js';

test('A LINK COUNTS WHEREVER IT SITS ON THE LINE', () => {
  // The renderer used to match only a line that was ENTIRELY one anchor, so
  // every `<p><a …>name</a> — blurb</p>` printed as prose and was unclickable.
  const { text, links } = renderPage('<p><a href="ronfile:x">x</a> — a thing</p>');
  assert.equal(links.length, 1, 'an anchor with text around it is still a link');
  assert.equal(links[0].addr, 'ronfile:x');
  assert.match(text, /x \[1\]/, 'and it is numbered where it stands, so the sentence reads');
});

test('several anchors on one line all count, in order', () => {
  const { links } = renderPage('<p>see <a href="a">A</a> and <a href="b">B</a>.</p>');
  assert.deepEqual(links.map((l) => l.addr), ['a', 'b']);
  assert.deepEqual(links.map((l) => l.n), [1, 2]);
});

test('an anchor alone on its line keeps its own row', () => {
  const { text, links } = renderPage('<a href="wikipedia.org">Wikipedia</a>');
  assert.equal(links.length, 1);
  assert.match(text, /^ {2}\[1\] Wikipedia$/m, 'the index pages are written against this shape');
});

test('the named entities the pages use are decoded, not printed', () => {
  const { text } = renderPage('<p>a &mdash; b &rarr; c &amp; d &rsquo;e&rsquo;</p>');
  assert.match(text, /a — b → c & d ’e’/);
  assert.ok(!text.includes('&mdash;'), 'an entity must not reach the screen as its source');
});

test("EVERY DOWNLOAD ON RON'S RELAY IS REACHABLE", () => {
  // The regression that started this: the relay index rendered its whole file
  // list as plain text, so the app store was visible and inert.
  const { links } = renderPage(pageFor({ ip: RELAY_IP, host: 'hermes.local', kind: 'relay', relay: {} }, []));
  const addrs = links.map((l) => l.addr);
  for (const f of RELAY_FILES) assert.ok(addrs.includes(`ronfile:${f.name}`), `${f.name} is not downloadable`);
  for (const b of RELAY_BUNDLES) assert.ok(addrs.includes(`ronpkg:${b.name}`), `${b.name} is not downloadable`);
});

test("RON's bookmark page names the sample code and the V-class weights", () => {
  // What the player is actually hunting for. Naming the packages is not enough:
  // the worked examples and the checkpoints live INSIDE them, so the page says
  // so rather than leaving somebody to unpack a folder to find out.
  const html = relayBookmarksPage({ ip: RELAY_IP });
  const { links, text } = renderPage(html);
  assert.ok(links.some((l) => l.addr === 'ronpkg:unit-sdk'));
  assert.ok(links.some((l) => l.addr === 'ronpkg:checkpoints'));
  assert.match(text, /braincode\.ml/, 'the worked examples are named');
  assert.match(text, /vector|courier/i, 'and so are the V-class weights');
  assert.match(text, /home\/weights/, 'with where they land');
});

test('every link on the relay bookmarks resolves on the relay network', () => {
  // The fault this page exists to fix: the estate bookmarks all render '' here
  // because none of those hosts are on RON's aerial, leaving bare headings.
  // Nothing on this page may depend on a host that is not reachable from it.
  const { links } = renderPage(relayBookmarksPage({ ip: RELAY_IP }));
  assert.ok(links.length >= 6, 'the page is not empty');
  for (const l of links) {
    assert.ok(/^(ronfile:|ronpkg:)/.test(l.addr) || l.addr === RELAY_IP,
      `${l.addr} is not on RON's network`);
  }
});

test('the estate bookmarks still find their links', () => {
  const hosts = hostTable({ islandId: 'calypso', daemon: 'calypso', robots: [], obelisks: [], hold: null });
  const { links } = renderPage(pageFor(hosts.find((h) => h.kind === 'search'), hosts));
  assert.ok(links.length > 0, 'the ordinary web did not regress');
});

test('A NUMERIC VERB TAKES A NUMBER: sleep and rewind checked a tag that does not exist', () => {
  // Both read `num.tag !== 'num'`, but an integer is tagged 'int'. The check
  // could never pass, so both verbs were dead for every argument, and the error
  // they printed was the one for a WRONG argument — which read as user error.
  const seen = {};
  const ctx = { rewindClock: (h) => { seen.rewind = h; }, sleepNearby: (n) => { seen.sleep = n; }, skylinkActive: () => false };
  assert.equal(runRonml('rewind 3', ctx).ok, true, 'rewind 3 is a valid call');
  assert.equal(seen.rewind, 3, 'and the hours reach the world');
  assert.equal(runRonml('sleep 30', ctx).ok, true);
  assert.equal(seen.sleep, 30);
  // A genuinely wrong argument must still be refused.
  assert.equal(runRonml('rewind OB_1234', ctx).ok, false);
});
