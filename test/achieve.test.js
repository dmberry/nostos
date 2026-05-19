// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// KLEOS engine tests (docs/PLAN.md §10, stage A1). The engine is
// pure, so every one of these is a synthetic event stream in and an assertion
// out — no world, no DOM, no clock.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  initAchievements, achieveEvent, achieveModel, achieveProfile, achieveRunState,
  achieveTick, resetRun,
} from '../src/game/achieve.js';
import {
  TRACKS, BADGES, MILESTONES, COUNTERS, PURITY_BREAKS, tierThresholds, LAURELS_LIVE,
} from '../src/game/achievements-registry.js';

beforeEach(() => initAchievements({}));

const kill = (cause = 'weapon', type = 't1') => achieveEvent('unitDestroyed', { cause, type });
const ids = (awards) => awards.map((a) => a.id);

// ---- registry sanity --------------------------------------------------------

test('every counter a track names exists in the counter table', () => {
  for (const t of TRACKS) {
    for (const c of t.counters) {
      assert.ok(COUNTERS[c], `${t.id} names a counter that does not exist: ${c}`);
    }
  }
});

test('every milestone names a real counter, and every badge a real event', () => {
  const events = new Set(Object.values(COUNTERS).map((c) => c.on));
  for (const b of BADGES) assert.ok(b.on && b.on.event, `${b.id} has no event`);
  for (const m of MILESTONES) {
    assert.ok(COUNTERS[m.counter] || m.counter === 'playSeconds',
      `${m.id} reads a counter nothing feeds: ${m.counter}`);
  }
  assert.ok(events.size > 0);
});

test('thresholds ascend, and every dynamic target resolves to a real number', () => {
  // TEN RUNGS, or fewer where ten would repeat themselves. A five-item
  // collection cannot have ten distinct thresholds, and a panel showing five
  // pips lit for one book read would be a lie about where you are — so the
  // duplicates collapse and the track simply has fewer rungs.
  for (const t of TRACKS) {
    const tiers = tierThresholds(t);
    assert.ok(tiers.length >= 1 && tiers.length <= 10, `${t.id} has ${tiers.length} tiers`);
    if (Array.isArray(t.tiers)) assert.equal(tiers.length, 10, `${t.id} spells its rungs out; it should have ten`);
    for (let i = 1; i < tiers.length; i++) {
      assert.ok(tiers[i].at > tiers[i - 1].at, `${t.id} tier ${i} does not ascend`);
    }
    assert.ok(tiers[tiers.length - 1].name, `${t.id} has no summit name on its last rung`);
    if (t.target) assert.ok(t.target() > 0, `${t.id} target is not positive`);
  }
});

test('a purity signal named by a track has rules behind it', () => {
  for (const t of TRACKS) {
    if (!t.purity) continue;
    for (const sig of t.purity.brokenBy) {
      assert.ok(PURITY_BREAKS[sig] && PURITY_BREAKS[sig].length, `${t.id}: no rules for ${sig}`);
    }
  }
});

test('ids are unique across the registry', () => {
  const all = [...TRACKS, ...BADGES, ...MILESTONES].map((x) => x.id);
  assert.equal(new Set(all).size, all.length, 'duplicate id in the registry');
});

// ---- tiers ------------------------------------------------------------------

test('a track climbs its tiers as its counter fills, once each', () => {
  // WARRIOR's rungs are 1, 3, 6, ... so the first kill is I and the third is II.
  // Read off the registry rather than hardcoded, so retuning the ladder does not
  // break a test that is about the CLIMBING.
  const at = tierThresholds(TRACKS.find((t) => t.id === 'warrior')).map((x) => x.at);
  const first = kill().find((a) => a.kind === 'tier' && a.id === 'warrior');
  assert.ok(first, `the first kill should award WARRIOR I (rung one is at ${at[0]})`);
  assert.equal(first.tier, 1);
  assert.equal(first.tierName, 'I');
  // Nothing again until the next rung.
  for (let n = at[0] + 1; n < at[1]; n++) {
    assert.equal(kill().filter((a) => a.kind === 'tier').length, 0,
      'a tier is awarded once, not on every event after it');
  }
  const second = kill().find((a) => a.kind === 'tier' && a.id === 'warrior');
  assert.ok(second, `kill ${at[1]} should award WARRIOR II`);
  assert.equal(second.tier, 2);
});

test('the summit tier carries the mythic name', () => {
  const rungs = tierThresholds(TRACKS.find((t) => t.id === 'warrior'));
  for (let i = 0; i < rungs[rungs.length - 1].at; i++) kill();
  const t = achieveModel().tracks.find((x) => x.id === 'warrior');
  assert.equal(t.tier, rungs.length, 'the summit is the last rung, whatever the count');
  assert.equal(t.tierLabel, 'ACHILLES');
  assert.ok(t.summited);
});

test('a collection track measures distinct things, not repeats', () => {
  achieveEvent('bookRead', { id: 'b1' });
  achieveEvent('bookRead', { id: 'b1' });
  achieveEvent('bookRead', { id: 'b1' });
  assert.equal(achieveModel().tracks.find((t) => t.id === 'librarian').have, 1,
    'the same book read three times is one book');
  achieveEvent('bookRead', { id: 'b2' });
  assert.equal(achieveModel().tracks.find((t) => t.id === 'librarian').have, 2);
});

test('daysSurvived is set, not accumulated — a reloaded day cannot count twice', () => {
  achieveEvent('dayEnd', { day: 3 });
  achieveEvent('dayEnd', { day: 3 });
  achieveEvent('dayEnd', { day: 2 });   // an earlier checkpoint, replayed
  assert.equal(achieveModel().tracks.find((t) => t.id === 'survivor').have, 3);
});

// ---- badges -----------------------------------------------------------------

test('a badge fires once, on its own event, and never again', () => {
  assert.deepEqual(ids(achieveEvent('summit', {})).filter((i) => i === 'pilgrim'), ['pilgrim']);
  assert.deepEqual(ids(achieveEvent('summit', {})).filter((i) => i === 'pilgrim'), []);
});

test("Hello, World! wants a run that worked AND printed", () => {
  assert.equal(ids(achieveEvent('mlRun', { ok: false, printed: true })).includes('hello-world'), false);
  assert.equal(ids(achieveEvent('mlRun', { ok: true, printed: false })).includes('hello-world'), false);
  assert.ok(ids(achieveEvent('mlRun', { ok: true, printed: true })).includes('hello-world'));
});

test('a counted badge waits for its count; a distinct one wants different things', () => {
  for (let i = 0; i < 9; i++) achieveEvent('manRead', { topic: `t${i}` });
  assert.equal(achieveModel().badges.find((b) => b.id === 'rtfm').earned, false);
  achieveEvent('manRead', { topic: 't0' });   // a repeat does not advance it
  assert.equal(achieveModel().badges.find((b) => b.id === 'rtfm').earned, false);
  achieveEvent('manRead', { topic: 't9' });
  assert.ok(achieveModel().badges.find((b) => b.id === 'rtfm').earned);
});

test('Perseus wants the mirror, First Tincan wants your own hand', () => {
  assert.ok(ids(kill('reflect')).includes('perseus'));
  assert.equal(ids(kill('reflect')).includes('first-tincan'), false, 'the mirror is not your hand');
  assert.ok(ids(kill('melee')).includes('first-tincan'));
});

test('AI SAFETY counts five machines made safe by any means at all', () => {
  const how = ['repel', 'convert', 'reprogram', 'unplug', 'jam'];
  let earned = false;
  for (const h of how) earned = earned || ids(achieveEvent('madeSafe', { how: h })).includes('ai-safety');
  assert.ok(earned, 'five machines, four different routes, one badge');
});

// ---- purity -----------------------------------------------------------------

test('a kill breaks the pacifist once, and names the deed', () => {
  const awards = kill('weapon', 'w4');
  const lost = awards.find((a) => a.kind === 'purity-lost' && a.id === 'pacifist');
  assert.ok(lost, 'a kill should break PACIFIST');
  assert.match(lost.why, /W4/);
  assert.match(lost.why, /gun/);
  assert.equal(kill().filter((a) => a.kind === 'purity-lost' && a.id === 'pacifist').length, 0,
    'the first deed is the one that cost it; later ones are not re-reported');
  const p = achieveModel().tracks.find((t) => t.id === 'pacifist').purity;
  assert.equal(p.intact, false);
});

test('machines fighting machines are the island\'s business, not yours', () => {
  assert.equal(kill('ubik').filter((a) => a.kind === 'purity-lost').length, 0);
  assert.equal(kill('machine').filter((a) => a.kind === 'purity-lost').length, 0);
  assert.ok(achieveModel().tracks.find((t) => t.id === 'pacifist').purity.intact);
});

test('an escort kill is yours: it breaks the pacifist', () => {
  assert.ok(kill('escort').some((a) => a.kind === 'purity-lost' && a.id === 'pacifist'));
});

test('a story hack keeps the warrior; an optional one breaks it', () => {
  assert.equal(achieveEvent('optionalHack', { verb: 'decrypt' }).filter((a) => a.kind === 'purity-lost').length, 0,
    'the escape chain cannot cost the laurel');
  const lost = achieveEvent('optionalHack', { verb: 'repel' }).find((a) => a.id === 'warrior');
  assert.ok(lost, 'turning a machine by code is not the spear');
});

test('striking a machine yourself breaks the hacker', () => {
  assert.ok(achieveEvent('handDamage', {}).some((a) => a.kind === 'purity-lost' && a.id === 'hacker'));
});

test('death breaks the survivor', () => {
  assert.ok(achieveEvent('death', {}).some((a) => a.kind === 'purity-lost' && a.id === 'survivor'));
});

// ---- laurels ----------------------------------------------------------------

test('laurels are judged per island — a break elsewhere does not cost this one', () => {
  achieveEvent('islandVisited', { id: 'calypso' });
  kill();                                        // pacifism lost on Calypso
  achieveEvent('islandVisited', { id: 'circe' }); // a clean landing
  const awards = achieveEvent('islandComplete', { id: 'circe' });
  const laurels = awards.filter((a) => a.kind === 'laurel');
  if (LAURELS_LIVE) {
    assert.ok(laurels.some((l) => l.track === 'pacifist'), 'a clean island earns its laurel');
    const dirty = achieveEvent('islandComplete', { id: 'calypso' }).filter((a) => a.kind === 'laurel');
    assert.equal(dirty.some((l) => l.track === 'pacifist'), false, 'the broken island does not');
  } else {
    assert.equal(laurels.length, 0, 'laurels stay dark until the A5 audit says otherwise');
  }
});

// ---- scopes -----------------------------------------------------------------

// CHANGED ON PURPOSE at v1.507. Badges and tiers used to survive death, on the
// argument that kleos is the glory which outlives the run. In play a fresh run
// opened the panel already showing a wall of earned badges, which reads as the
// game claiming credit you have not earned (David, 2026-08-13). A run's song is
// the run's; the lifetime view is a tab, and the MILESTONES are what genuinely
// outlive you.
test('death takes the run with it, and the lifetime view keeps its own count', () => {
  for (let i = 0; i < 10; i++) kill();
  achieveEvent('summit', {});
  const reached = achieveModel().tracks.find((t) => t.id === 'warrior').tier;
  assert.ok(reached > 0, 'ten kills should be worth some rungs');
  assert.ok(achieveModel().badges.find((b) => b.id === 'pilgrim').earned);

  resetRun();      // death, or a New Game

  const now = achieveModel();
  assert.equal(now.tracks.find((t) => t.id === 'warrior').tier, 0, 'the run starts at nothing');
  assert.ok(!now.badges.find((b) => b.id === 'pilgrim').earned, 'and so do its badges');
  assert.equal(achieveRunState().counters.unitKillsByHand || 0, 0, 'the run starts clean');
  assert.ok(now.tracks.find((t) => t.id === 'pacifist').purity.intact,
    'and its purity starts intact again');

  // ALL GAMES still remembers, which is the point of having three views.
  const all = achieveModel('all');
  assert.ok(all.badges.find((b) => b.id === 'pilgrim').earned, 'the lifetime tally holds it');
  assert.equal(all.tracks.find((t) => t.id === 'warrior').tier, reached, 'and the best tier reached');

  // LAST GAME is the run that just ended, whole.
  const last = achieveModel('last');
  assert.ok(last.badges.find((b) => b.id === 'pilgrim').earned, 'the finished run kept its badges');
  assert.equal(last.tracks.find((t) => t.id === 'warrior').tier, reached);
});

test('both scopes survive a JSON round trip', () => {
  for (let i = 0; i < 12; i++) kill();
  achieveEvent('bookRead', { id: 'b1' });
  achieveEvent('manRead', { topic: 'ls' });
  const p = JSON.parse(JSON.stringify(achieveProfile()));
  const r = JSON.parse(JSON.stringify(achieveRunState()));
  initAchievements({ profile: p, run: r });
  const m = achieveModel();
  assert.equal(m.tracks.find((t) => t.id === 'warrior').have, 12);
  assert.equal(m.tracks.find((t) => t.id === 'librarian').have, 1);
  // The TIER has to come back too, not just the counter it was earned from —
  // tiers live in the run scope now, so a round trip that dropped them would
  // silently re-award every rung on the next kill.
  const rungs = tierThresholds(TRACKS.find((t) => t.id === 'warrior')).map((x) => x.at);
  const want = rungs.filter((a) => a <= 12).length;
  assert.equal(m.tracks.find((t) => t.id === 'warrior').tier, want);
});

test('an unknown award id from another build is kept, not eaten', () => {
  initAchievements({ profile: { v: 1, badges: { 'from-the-future': { day: 2 } }, lifetime: {}, tiers: {}, milestones: {}, laurels: {}, distinct: {} } });
  assert.ok(achieveProfile().badges['from-the-future'], 'history is not ours to delete');
});

// ---- milestones -------------------------------------------------------------

test('the lifetime body count crosses MECHANOOB however the machines died', () => {
  for (let i = 0; i < 5; i++) kill('weapon');
  for (let i = 0; i < 4; i++) kill('escort');
  assert.equal(achieveModel().milestones.find((m) => m.id === 'mechanoob').earned, false);
  assert.ok(kill('reflect').some((a) => a.kind === 'milestone' && a.id === 'mechanoob'));
});

test('playtime accumulates on the tick and crosses its hour', () => {
  assert.equal(achieveTick(3599).length, 0);
  const awards = achieveTick(1);
  assert.ok(awards.some((a) => a.id === 'hours-1'), 'an hour played is First Watch');
  assert.equal(achieveTick(10).length, 0, 'and it is awarded once');
});

test('a milestone survives a profile reload', () => {
  achieveTick(3600);
  initAchievements({ profile: achieveProfile() });
  assert.ok(achieveModel().milestones.find((m) => m.id === 'hours-1').earned);
});
