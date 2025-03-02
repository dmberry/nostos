// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE PROGRAMS ON THE CARD HAVE TO RUN.
//
// The card is the game's library of working hacks. A file that reads perfectly
// and no longer parses is the exact failure this cannot have: the player types
// it at a tower, it errors, and the fault looks like theirs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeFsfCard } from '../src/game/fsfcard.js';
import { runRonml } from '../src/game/ai_ml.js';

const card = makeFsfCard();
const examples = card.d.usr.d.src.d.ronml.d.examples.d;
const src = (n) => examples[n].f;

const ctx = () => ({
  station: 'ob', session: {}, hasAiKey: () => true,
  bindSession(name, val) { this.session[name] = val; },
  // Every host hook the examples reach for. A missing one fails the example
  // rather than silently passing, which is the point of running them here.
  setFog() {}, setRobots() {}, setBlight() {}, setPurge() {}, setSharedSight() {},
  forge() { return { ok: true, out: 'zeus_virus.ml' }; },
  cd() { return { ok: true }; }, ls: () => ['zeus_virus.ml'],
  copyFile: () => ({ ok: true }),
  retire() { this.retired = true; },
});

test('every example the README names is on the card', () => {
  for (const m of src('README').matchAll(/^ {2}(\S+\.ml)/gm)) {
    assert.ok(examples[m[1]], `README names ${m[1]}, which is not there`);
  }
});

test('every .ml on the card parses and runs, at the station it belongs to', () => {
  // Some of these are relay work (forging a payload) and some are tower work.
  // Rather than keep a list of which is which — the exact thing that goes stale
  // — each is tried at both, and only a file that runs at NEITHER is a failure.
  for (const [name, node] of Object.entries(examples)) {
    if (!name.endsWith('.ml')) continue;
    const tries = ['ob', 'hermes'].map((station) => {
      const c = ctx(); c.station = station;
      return runRonml(node.f, c);
    });
    assert.ok(tries.some((r) => r.ok),
      `${name} runs at no console: ${tries.map((r) => r.text).join(' | ')}`);
  }
});

test('30-refunction.ml actually refunctions', () => {
  let retired = false;
  const c = ctx();
  c.retire = () => { retired = true; };
  const r = runRonml(src('30-refunction.ml'), c);
  assert.ok(r.ok, r.text);
  assert.equal(retired, true, 'the file teaches a release that does not release');
});

test('the terms are on it, because that was the argument', () => {
  assert.match(card.d.COPYING.f, /Run it|Read it|Change it|Pass it on/);
});
