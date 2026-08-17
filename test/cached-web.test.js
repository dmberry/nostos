// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE CACHED WEB, END TO END.
//
// test/archive-links.test.js already checks that every link points at something
// that exists. This file checks the things that were still broken while all of
// those passed, which is every bug the cached web actually had:
//
//   ROUTING     A page can exist, be linked, and still not open. ?cache= passed
//               department addresses to the browser as hostnames, so every
//               department deep link answered "not found" while the page sat
//               there in the corpus (usc.edu/retroai, all three Sussex pages).
//               Existence was tested. Openability was not.
//
//   RENDERING   The renderer only saw an anchor that was alone on its line, so
//               401 links across 79 pages were visible, unnumbered and
//               unfollowable. Nothing failed. The pages looked fine.
//
//   HIERARCHY   A department nobody links to is unreachable however good it is:
//               the Retro AI symposium sat in the corpus with zero inbound
//               links, and Poplog had no way back to the department it came out
//               of, because the footer skips a level.
//
//   FRAGILITY   A body that throws in the renderer takes the browser down, and
//               a page whose title is empty shows as a blank tab.
//
// WHAT IS DELIBERATELY NOT ASSERTED. Orphans and dead ends are counted at the
// bottom and reported, not failed. 127 of 285 pages are unreachable by walking
// links from the start pages, and that is correct: the player also finds
// addresses through AltaVista, in lore fragments, on scraps of paper and in
// other people's pages. A test that demanded a click-path to everything would
// be wrong about how the game is played, and would be turned off within a week.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ARCHIVED_SITES, DEPARTMENTS, UNIVERSITIES,
  archivedSite, departmentPage, universityAt, universityBody, deptPagesFor,
} from '../src/game/archive.js';
import { cacheLink, isDept, renderPage, CACHE_ALIASES, bookmarksPage, favouritesPage, whatsNewPage }
  from '../src/game/net.js';

const SITES = ARCHIVED_SITES.map((s) => s.domain).filter(Boolean);
const DEPTS = Object.keys(DEPARTMENTS);
const UNIS = (Array.isArray(UNIVERSITIES) ? UNIVERSITIES : Object.values(UNIVERSITIES))
  .map((u) => u.domain).filter(Boolean);
const ALL = [...new Set([...SITES, ...DEPTS, ...UNIS])];

/** The body of any address, whichever of the three registries holds it. */
function bodyOf(addr) {
  const s = archivedSite(addr);
  if (s) return [].concat(s.body).join('\n');
  const d = departmentPage(addr);
  if (d) return [].concat(d.body).join('\n');
  if (universityAt(addr)) return String(universityBody(addr) || '');
  return null;
}

/** Corpus links out of a page, with dept: stripped and off-corpus dropped. */
function corpusLinks(html) {
  return [...new Set([...String(html || '').matchAll(/href="([^"]+)"/g)]
    .map((m) => m[1].replace(/^dept:/, ''))
    .filter((l) => ALL.includes(l)))];
}

/**
 * The route the game takes when a ?cache= link is opened: cacheLink normalises
 * the address, then isDept decides whether it is a page or a host. Both halves
 * have to agree or the address does not open, which is exactly what went wrong.
 */
function opens(addr) {
  const host = cacheLink(`?cache=${addr}`, '');
  if (!host) return false;
  return isDept(host) ? !!departmentPage(host) : !!(archivedSite(host) || universityAt(host));
}

// ---- routing ---------------------------------------------------------------

test('EVERY ADDRESS IN THE CORPUS OPENS THROUGH THE ?cache= ROUTE', () => {
  // The one that was broken. A department address went down the host path,
  // failed DNS and answered "not found" on a page that was right there.
  const dead = ALL.filter((a) => !opens(a));
  assert.deepEqual(dead, [], 'these exist in the corpus but will not open when shared');
});

test('every alias opens, not merely resolves', () => {
  // An alias is quoted in prose that cannot be edited afterwards.
  const dead = Object.entries(CACHE_ALIASES)
    .filter(([, target]) => !opens(target))
    .map(([k, t]) => `${k} -> ${t}`);
  assert.deepEqual(dead, []);
});

test('a department address is routed as a page and a host address as a host', () => {
  // isDept is what tells the two apart. If it ever answered the same for both,
  // one whole class of address would break and nothing else here would notice.
  for (const d of DEPTS) assert.equal(isDept(d), true, `${d} should route as a department`);
  for (const s of SITES.slice(0, 40)) assert.equal(isDept(s), false, `${s} should route as a host`);
});

// ---- rendering -------------------------------------------------------------

test('EVERY PAGE RENDERS WITHOUT THROWING', () => {
  const broken = [];
  for (const a of ALL) {
    try {
      const r = renderPage(bodyOf(a));
      if (!r || typeof r.text !== 'string') broken.push(`${a}: no text`);
    } catch (e) {
      broken.push(`${a}: ${e.message}`);
    }
  }
  assert.deepEqual(broken, []);
});

test('EVERY LINK IN A PAGE SURVIVES RENDERING AND IS FOLLOWABLE', () => {
  // The renderer once matched only an anchor alone on its line, so any link
  // with prose around it printed as ordinary text: on the page, unnumbered,
  // unfollowable, and silent. 401 of them across 79 pages.
  const lost = [];
  for (const a of ALL) {
    const html = bodyOf(a);
    const want = [...String(html).matchAll(/<a href="([^"]+)"/g)].map((m) => m[1]);
    if (!want.length) continue;
    const got = new Set(renderPage(html).links.map((l) => l.addr));
    for (const w of want) if (!got.has(w)) lost.push(`${a} -> ${w}`);
  }
  assert.deepEqual(lost.slice(0, 20), [], `${lost.length} links are on the page but cannot be followed`);
});

test('a rendered page carries its own text, not just its links', () => {
  const empty = ALL.filter((a) => renderPage(bodyOf(a)).text.trim().length < 40);
  assert.deepEqual(empty, [], 'these render to almost nothing');
});

// ---- hierarchy -------------------------------------------------------------

test('every department is reachable from its own university index', () => {
  const unreachable = [];
  for (const key of DEPTS) {
    const domain = key.split('/')[0];
    if (!universityAt(domain)) continue;
    const depth = key.split('/').length;
    if (depth > 2) continue;                       // sub-departments: next test
    const index = String(universityBody(domain) || '');
    if (!corpusLinks(index).includes(key)) unreachable.push(`${domain} does not link to ${key}`);
  }
  assert.deepEqual(unreachable, []);
});

test('every sub-department is reachable from its parent department', () => {
  // Poplog sits under cogs, and the footer deptPage appends goes to the
  // university, skipping the level in between: the one page you could not get
  // to from Poplog was the department it came out of.
  const orphaned = [];
  for (const key of DEPTS) {
    const parts = key.split('/');
    if (parts.length < 3) continue;
    const parent = parts.slice(0, -1).join('/');
    if (!departmentPage(parent)) { orphaned.push(`${key} has no parent page ${parent}`); continue; }
    if (!corpusLinks(bodyOf(parent)).includes(key)) orphaned.push(`${parent} does not link to ${key}`);
  }
  assert.deepEqual(orphaned, []);
});

test('every department links back out of itself', () => {
  // A page with no way out is where a reader stops. Every department must
  // reach at least one other thing in the corpus, its own university included.
  const stuck = DEPTS.filter((k) => {
    const links = corpusLinks(bodyOf(k));
    const domain = k.split('/')[0];
    return links.length === 0 && !universityAt(domain);
  });
  assert.deepEqual(stuck, []);
});

// ---- fragility -------------------------------------------------------------

test('every page has a title that would show in a title bar', () => {
  const bad = [];
  for (const s of ARCHIVED_SITES) {
    if (!s.title || !String(s.title).trim()) bad.push(`site ${s.domain}`);
  }
  for (const [k, d] of Object.entries(DEPARTMENTS)) {
    if (!d.title || !String(d.title).trim()) bad.push(`dept ${k}`);
  }
  assert.deepEqual(bad, []);
});

test('no page links to itself as its only way out', () => {
  const solipsists = ALL.filter((a) => {
    const links = corpusLinks(bodyOf(a));
    return links.length === 1 && links[0] === a;
  });
  assert.deepEqual(solipsists, []);
});

test('the browser start pages open without a host table', () => {
  // They are called before the world exists on a cold boot, and an empty host
  // table must not throw.
  for (const [name, fn] of [['bookmarks', bookmarksPage], ['favourites', favouritesPage], ['whatsNew', whatsNewPage]]) {
    assert.doesNotThrow(() => renderPage(fn([])), `${name} threw on an empty host table`);
  }
});

// ---- reported, not asserted ------------------------------------------------

test('the shape of the corpus is reported so a collapse would be noticed', () => {
  // Not a threshold to pass. These numbers are printed so that a change which
  // halves the web, or leaves fifty new pages with nothing pointing at them,
  // shows up in the run instead of going through quietly.
  const out = new Map(ALL.map((a) => [a, corpusLinks(bodyOf(a))]));
  const inbound = new Map(ALL.map((a) => [a, 0]));
  for (const [, ls] of out) for (const l of ls) inbound.set(l, (inbound.get(l) || 0) + 1);

  const roots = new Set(UNIS);
  for (const page of [bookmarksPage([]), favouritesPage([]), whatsNewPage([])]) {
    for (const l of corpusLinks(page)) roots.add(l);
  }
  for (const t of Object.values(CACHE_ALIASES)) if (ALL.includes(t)) roots.add(t);

  const seen = new Set(roots); const q = [...roots];
  while (q.length) { const c = q.shift(); for (const n of out.get(c) || []) if (!seen.has(n)) { seen.add(n); q.push(n); } }

  const edges = [...out.values()].reduce((a, l) => a + l.length, 0);
  console.log(`      cached web: ${ALL.length} pages (${SITES.length} sites, ${DEPTS.length} departments, ${UNIS.length} universities)`);
  console.log(`      ${edges} internal links, ${ALL.filter((a) => inbound.get(a) === 0).length} with nothing pointing at them`);
  console.log(`      ${seen.size} reachable by clicking from a start page; the rest are found by search, or in the world`);

  assert.ok(ALL.length > 200, 'the corpus has collapsed to a fraction of its size');
  assert.ok(edges > 200, 'the internal links have collapsed');
});
