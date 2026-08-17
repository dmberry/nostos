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
import { existsSync } from 'node:fs';
import {
  ARCHIVED_SITES, DEPARTMENTS, WIKI_ARTICLES, KNOWN_DOMAINS, UNIVERSITIES,
  deptPagesFor, departmentPage, wikiArticle, archivedSite, universityAt,
} from '../src/game/archive.js';
import { FRAGMENTS } from '../src/game/lore.js';
import { isPaper } from '../src/game/press.js';
import { searchResults } from '../src/game/net.js';

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
      // A department page is a real destination the cache answers for, at
      // <domain>/<key>, and the bare form is what the corpus uses for internal
      // links. Without this the test rejects a link that works.
      const known = archivedSite(href) || universityAt(href)
        || departmentPage(href) || KNOWN_DOMAINS.includes(href);
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

test('no two written sites claim the same address', () => {
  // archivedSite() is a .find, so a second entry for a domain is unreachable —
  // the page is in the file, reads perfectly, and nothing will ever serve it.
  // This happened the first time somebody added a personal GeoCities page
  // without noticing the neighbourhoods index was already there.
  const seen = new Map();
  for (const s of ARCHIVED_SITES) {
    assert.ok(!seen.has(s.domain),
      `two sites claim ${s.domain}: "${seen.get(s.domain)}" and "${s.title}" — the second is unreachable`);
    seen.set(s.domain, s.title);
  }
});

test('a written site is not also listed as a bare stub', () => {
  // KNOWN_DOMAINS is the "it was there and it is damaged" list. A domain in
  // both gets a real page and a stub entry, and which one answers is an
  // accident of lookup order.
  for (const s of ARCHIVED_SITES) {
    assert.ok(!KNOWN_DOMAINS.includes(s.domain),
      `${s.domain} has a written page AND sits in KNOWN_DOMAINS`);
  }
});

// Same drift, one layer down: a page names a picture file and the file is not
// there. Nothing throws. The page renders with a broken-image box in the
// corner and the caption underneath it, and only a player who opens that exact
// host ever sees it. So walk every src= on every cached page and stat it.
test('every picture a cached page names is a file that exists', () => {
  const root = new URL('../', import.meta.url);
  const missing = [];
  for (const site of ARCHIVED_SITES) {
    for (const m of site.body.join('\n').matchAll(/src="([^"]+)"/g)) {
      const src = m[1];
      if (!src.startsWith('assets/')) continue;
      if (!existsSync(new URL(src, root))) missing.push(`${site.domain} -> ${src}`);
    }
  }
  assert.deepEqual(missing, []);
});

// The game has a soundtrack of its own. A film on a cached page that started
// itself would talk over it, and the player would be hunting through a browser
// window for whatever was making the noise. Nothing autoplays, nothing loops,
// and nothing pulls five megabytes for a page you were only passing through.
test('no film on the cached web starts itself', () => {
  const bad = [];
  for (const site of ARCHIVED_SITES) {
    for (const m of site.body.join('\n').matchAll(/<video[^>]*>/g)) {
      const tag = m[0];
      if (/autoplay|loop/.test(tag)) bad.push(`${site.domain}: starts itself: ${tag}`);
      if (!/controls/.test(tag)) bad.push(`${site.domain}: no controls: ${tag}`);
      if (!/preload="none"/.test(tag)) bad.push(`${site.domain}: preloads: ${tag}`);
    }
  }
  assert.deepEqual(bad, []);
});

// A page hanging off a university has to be findable by a word written on it.
// The crawl walked the host table and nothing else, so every one of them —
// departments, research groups, a person's own faculty page — was invisible to
// the search box, and the only route in was knowing which university to open
// and reading down its list. Nothing reported it: the search returned results,
// they were simply never these.
test('the search finds pages that hang off a university, not only hosts', () => {
  
  const hosts = [];
  for (const key of Object.keys(DEPARTMENTS)) {
    const page = DEPARTMENTS[key];
    // A word that is on this page and is not the key itself.
    const words = page.body.join(' ').replace(/<[^>]+>/g, ' ')
      .split(/\s+/).filter((w) => /^[a-z]{6,}$/i.test(w));
    if (!words.length) continue;
    const html = searchResults(hosts, words[0]);
    assert.ok(html.includes(`dept:${key}`),
      `searching "${words[0]}" should offer dept:${key}, and the results were:\n${html}`);
    break;   // one is enough to pin the behaviour; the loop is to find a page with prose
  }
});
