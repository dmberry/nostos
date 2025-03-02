// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// Every link on a cached page goes somewhere, and every page offered is a page
// that exists.
//
// This is the walking test the archive did not have. The pattern it guards is
// the one this repo keeps paying for: a registry and the thing it describes
// drift apart silently. The man pages did it, the help box did it, the command
// dispatch did it, and the diagnostic list did it six times. Nothing breaks when
// a link rots. The suite passes, the linter is happy, and only a player who
// clicks it finds out.
//
// The specific failure to avoid here was found once already, in the cached web
// itself: sixty pages of writing, all reachable, every link resolving to the
// wrong host. Asserting that a link RESOLVES is weaker than asserting where it
// goes, so this test checks the destination.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ARCHIVED_SITES, DEPARTMENTS, WIKI_ARTICLES, KNOWN_DOMAINS, UNIVERSITIES,
  deptPagesFor, departmentPage, wikiArticle, archivedSite, universityAt,
} from '../src/game/archive.js';
import { FRAGMENTS } from '../src/game/lore.js';
import { isPaper } from '../src/game/press.js';

/** Every page in the archive, with a name to report it by. */
function allPages() {
  return [
    ...Object.entries(DEPARTMENTS).map(([k, v]) => [`dept:${k}`, v]),
    ...ARCHIVED_SITES.map((s) => [`site:${s.domain}`, s]),
    ...Object.entries(WIKI_ARTICLES).map(([k, v]) => [`wiki:${k}`, v]),
  ];
}

const hrefsIn = (page) => [...page.body.join('\n').matchAll(/href="([^"]+)"/g)].map((m) => m[1]);

test('every department listed on a university has a page', () => {
  for (const u of UNIVERSITIES) {
    for (const d of deptPagesFor(u.domain)) {
      const key = `${u.domain}/${d.key}`;
      assert.ok(departmentPage(key),
        `${u.domain} lists "${d.name}" and dept:${key} is not in store`);
    }
  }
});

test('every department page belongs to a university that exists', () => {
  for (const key of Object.keys(DEPARTMENTS)) {
    const domain = key.split('/')[0];
    assert.ok(universityAt(domain),
      `dept:${key} hangs off ${domain}, which is not in UNIVERSITIES, so the ` +
      'link back to the university index goes nowhere');
  }
});

test('every wiki: link on any page names an article that is held', () => {
  for (const [name, page] of allPages()) {
    for (const href of hrefsIn(page)) {
      if (!href.startsWith('wiki:')) continue;
      const key = href.slice(5);
      assert.ok(wikiArticle(key), `${name} links to wiki:${key}, which is not in store`);
    }
  }
});

test('every dept: link on any page names a page that is held', () => {
  for (const [name, page] of allPages()) {
    for (const href of hrefsIn(page)) {
      if (!href.startsWith('dept:')) continue;
      const key = href.slice(5);
      assert.ok(departmentPage(key), `${name} links to dept:${key}, which is not in store`);
    }
  }
});

test('every bare domain link is one the archive can answer for', () => {
  // Either it has a written page, or it is a known damaged record. A domain in
  // neither list is a not-found, and a not-found reads as a mistake rather than
  // as damage.
  for (const [name, page] of allPages()) {
    for (const href of hrefsIn(page)) {
      if (/^(wiki|dept|http|#):/.test(href) || href.includes(':')) continue;
      const known = archivedSite(href) || universityAt(href) || KNOWN_DOMAINS.includes(href);
      assert.ok(known,
        `${name} links to ${href}, which is neither written out, nor a ` +
        'university, nor in KNOWN_DOMAINS: it will answer "unable to locate".');
    }
  }
});

test('the wikipedia index lists only articles that are held', () => {
  const wiki = archivedSite('wikipedia.org');
  assert.ok(wiki, 'wikipedia.org should be a written site');
  const listed = hrefsIn(wiki).filter((h) => h.startsWith('wiki:')).map((h) => h.slice(5));
  for (const key of listed) {
    assert.ok(wikiArticle(key), `the index offers wiki:${key} and it is not in store`);
  }
  // The count the page prints must match what it actually lists.
  const claim = wiki.body.join('\n').match(/(\d+) of [\d,]+ articles in store/);
  if (claim) {
    assert.equal(Number(claim[1]), listed.length,
      `the index says ${claim[1]} articles and lists ${listed.length}. ` +
      'Counts in prose go stale as data grows; compute it or correct it.');
  }
});

test('every address a lore fragment names is one the cache can answer for', () => {
  // Fragments send the player to the browser by naming a domain in prose. An
  // address that answers "unable to locate" turns a lead into a dead end, and
  // nothing in the game would report it: the fragment still reads fine.
  const domains = new Set();
  for (const f of FRAGMENTS) {
    for (const m of String(f.text).matchAll(/\b([a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:org|com|net|co\.uk|ac\.uk|edu|gov|nl|de|no|dk|ch|jp|cn|za|ug|lb|eg|au))\b/g)) {
      domains.add({ domain: m[1], from: f.id });
    }
  }
  for (const { domain, from } of domains) {
    // Four registries can answer for an address: the written sites, the
    // universities, the newspapers in press.js, and the named damaged records.
    // The first version of this test forgot the newspapers and reported four
    // working leads as dead, which is the instrument being wrong before the
    // thing it measures. Again.
    const known = archivedSite(domain) || universityAt(domain)
      || isPaper(domain) || KNOWN_DOMAINS.includes(domain);
    assert.ok(known,
      `fragment ${from} sends the player to ${domain}, and the cache has no ` +
      'record of it. Write the site, or add it to KNOWN_DOMAINS as damage.');
  }
});

test('every page has a title and a non-empty body', () => {
  for (const [name, page] of allPages()) {
    assert.ok(page.title, `${name} has no title`);
    assert.ok(Array.isArray(page.body) && page.body.length, `${name} has no body`);
  }
});

// ---- THE CORPUS ITSELF ----------------------------------------------------

test('no two fragments share an id', () => {
  // Placement, the Scrapbook list and the found-set are all keyed by id, so a
  // duplicate does not error — it quietly makes one of the two unreachable,
  // and the corpus still reads fine, which is why nothing would report it.
  const seen = new Map();
  for (const f of FRAGMENTS) {
    assert.ok(!seen.has(f.id), `two fragments share the id ${f.id}: "${seen.get(f.id)}" and "${f.title}"`);
    seen.set(f.id, f.title);
  }
});

test('every fragment has a kind the Scrapbook can draw', () => {
  // `kind` picks the object it reads as. An unknown one falls through to
  // nothing in particular and the entry looks broken rather than missing.
  const KINDS = new Set(['science', 'code', 'ron', 'letter', 'handwritten', 'note', 'secret', 'liminal', 'crafting']);
  for (const f of FRAGMENTS) {
    assert.ok(KINDS.has(f.kind), `${f.id} has kind "${f.kind}", which nothing draws`);
    assert.ok([0, 1, 2].includes(f.era), `${f.id} has era ${f.era}, outside 0..2`);
    assert.ok(f.title && f.text, `${f.id} is missing a title or a body`);
  }
});
