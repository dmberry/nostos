// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The rings.
//
// Membership is written out by hand, which is right for quality and is exactly
// the kind of list that rots: a page gets renamed and a ring quietly points at
// nothing. Nothing would report it. The page still renders, the strip still
// draws, and only somebody clicking Next finds out.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALL_RINGS, ringsOf } from '../src/game/archive-geocities.js';
import { ARCHIVED_SITES, archivedSite } from '../src/game/archive.js';
import { renderPage } from '../src/game/net.js';

test('every page a ring names exists', () => {
  const dead = [];
  for (const r of ALL_RINGS) {
    for (const m of r.members) if (!archivedSite(m)) dead.push(`${r.name} -> ${m}`);
  }
  assert.deepEqual(dead, []);
});

test('no ring names the same page twice', () => {
  for (const r of ALL_RINGS) {
    assert.equal(new Set(r.members).size, r.members.length, `${r.name} repeats a member`);
  }
});

test('a ring of one or two is not a ring', () => {
  // Prev and Next on a two-member ring are the same page, which reads as broken
  // rather than as small.
  for (const r of ALL_RINGS) {
    assert.ok(r.members.length >= 3, `${r.name} has only ${r.members.length}`);
  }
});

test('every ring strip survives rendering and can be followed', () => {
  // The fault this guards is the one the corpus already had once: a strip that
  // is on the page as text, with nothing to click.
  const lost = [];
  for (const s of ARCHIVED_SITES) {
    const rings = ringsOf(s.domain);
    if (!rings.length) continue;
    const html = [].concat(s.body).join('\n');
    const got = new Set(renderPage(html).links.map((l) => l.addr));
    for (const r of rings) {
      const i = r.members.indexOf(s.domain);
      const prev = r.members[(i - 1 + r.members.length) % r.members.length];
      const next = r.members[(i + 1) % r.members.length];
      for (const [what, addr] of [['prev', prev], ['next', next]]) {
        if (!got.has(addr)) lost.push(`${s.domain} ${r.name} ${what} -> ${addr}`);
      }
    }
  }
  assert.deepEqual(lost, []);
});

test('a ring never sends you to the page you are on', () => {
  const self = [];
  for (const s of ARCHIVED_SITES) {
    for (const r of ringsOf(s.domain)) {
      const i = r.members.indexOf(s.domain);
      const prev = r.members[(i - 1 + r.members.length) % r.members.length];
      const next = r.members[(i + 1) % r.members.length];
      if (prev === s.domain || next === s.domain) self.push(`${s.domain} in ${r.name}`);
    }
  }
  assert.deepEqual(self, []);
});

test('the rings actually overlap, or they are just categories', () => {
  // The point of belonging to several is that they cross. If every page sat in
  // exactly one, this would be a taxonomy with badges on it.
  const counts = new Map();
  for (const r of ALL_RINGS) for (const m of r.members) counts.set(m, (counts.get(m) || 0) + 1);
  const multi = [...counts.values()].filter((n) => n > 1).length;
  assert.ok(multi >= 4, `only ${multi} pages are in more than one ring`);
});
