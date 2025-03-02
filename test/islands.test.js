// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The island registry (src/game/islands.js): one record per place, holding what
// an island IS — its epithet, its subnet, its tourist board, and the institution
// its daemon grew out of. Everything else reads from here rather than keeping a
// table of its own, so these tests guard the contract the other modules rely on.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ISLANDS, CROSSINGS, islandProfile, UNKNOWN_ISLAND } from '../src/game/islands.js';

test('every island declares the full profile the other modules read', () => {
  for (const [key, p] of Object.entries(ISLANDS)) {
    assert.equal(p.id, key, `${key}: id matches its key`);
    for (const f of ['place', 'epithet', 'desc', 'daemon', 'subnet', 'domain']) {
      assert.ok(p[f], `${key}: has ${f}`);
    }
    for (const f of ['domain', 'tag', 'welcome', 'climate', 'culture']) {
      assert.ok(p.tourism[f], `${key}: tourism.${f}`);
    }
    assert.ok(p.tourism.tips.length, `${key}: has travel tips`);
    for (const f of ['org', 'was', 'sub', 'subTitle']) {
      assert.ok(p.legacy[f], `${key}: legacy.${f}`);
    }
    assert.ok(p.legacy.notices.length && p.legacy.frags.length, `${key}: legacy records`);
  }
});

test('subnets and domains are unique — an address identifies one island', () => {
  const subnets = Object.values(ISLANDS).map((p) => p.subnet);
  const domains = Object.values(ISLANDS).map((p) => p.domain);
  assert.equal(new Set(subnets).size, subnets.length);
  assert.equal(new Set(domains).size, domains.length);
});

test('a profile resolves by world id, by place, and by daemon name', () => {
  assert.equal(islandProfile('calypso').place, 'OGYGIA');
  assert.equal(islandProfile('OGYGIA').id, 'calypso');
  assert.equal(islandProfile('CALYPSO').id, 'calypso');
  assert.equal(islandProfile('circe').place, 'AEAEA');
  assert.equal(islandProfile('AEAEA').daemon, 'CIRCE');
});

test('an unknown place still resolves, rather than crashing a page', () => {
  assert.equal(islandProfile('atlantis'), UNKNOWN_ISLAND);
  assert.equal(islandProfile(''), UNKNOWN_ISLAND);
  assert.equal(islandProfile(undefined), UNKNOWN_ISLAND);
  assert.ok(UNKNOWN_ISLAND.tourism.welcome, 'and still has a page to serve');
});

test('the chart derives from the registry, in voyage order', () => {
  assert.deepEqual(CROSSINGS.map((c) => c.id), ['calypso', 'polyphemus', 'circe', 'helios', 'ithaca']);
  for (const c of CROSSINGS) {
    for (const f of ['id', 'place', 'epithet', 'desc']) assert.ok(c[f], `${c.id}: chart needs ${f}`);
  }
  assert.equal(CROSSINGS[0].epithet, 'the navel of the sea');
});

test('each daemon grew out of a DIFFERENT institution', () => {
  const orgs = Object.values(ISLANDS).map((p) => p.legacy.org);
  assert.equal(new Set(orgs).size, orgs.length, 'no shared template');
  assert.match(ISLANDS.calypso.legacy.org, /CARE/);
  assert.match(ISLANDS.polyphemus.legacy.org, /LIVESTOCK/);
  assert.match(ISLANDS.circe.legacy.org, /CLASSIFICATION/);
  assert.match(ISLANDS.helios.legacy.org, /GRID/);
});
