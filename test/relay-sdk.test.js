// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The unit SDK: a package the HERMES relay serves (RELAY_BUNDLES / ronpkg),
// unpacked into /home/sdk on the NostBook. The point of these tests is that the
// SHIPPED examples decode and run — a broken sample is worse than none, so they
// are pulled from the bundle itself and put through the same decode/run path the
// game uses, not a copy that can drift.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RELAY_BUNDLES, relayBundle } from '../src/game/net.js';
import { makeDisk, graftSystemDirs } from '../src/game/unix.js';
import { decide, runRonml } from '../src/game/ai_ml.js';

const bundle = relayBundle('unit-sdk');
const byName = Object.fromEntries((bundle ? bundle.files : []).map((f) => [f.name, f.body]));

test('the relay serves a unit-sdk package that unpacks into /home/sdk', () => {
  assert.ok(bundle, 'relayBundle finds unit-sdk');
  assert.equal(bundle.dir, 'sdk');
  assert.ok(RELAY_BUNDLES.includes(bundle));
  for (const f of ['readme.txt', 'GUIDE.txt', 'reprogram.ml', 'braincode.ml', 'logo.ml']) {
    assert.ok(byName[f], `bundle carries ${f}`);
  }
  assert.equal(relayBundle('no-such-thing'), null);
});

test('the GUIDE names the three network verbs and the program vocabulary', () => {
  const g = byName['GUIDE.txt'];
  for (const word of ['sniffer', 'get <addr>', 'fetch', 'post <file>', 'patrol', 'route', 'eye ', 'move <dx>']) {
    assert.match(g, new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `GUIDE mentions ${word}`);
  }
});

test('reprogram.ml strips the hunt: it patrols whole, homes when flat, never hunts', () => {
  const whole = decide(byName['reprogram.ml'], { charge: 90 });
  assert.equal(whole.ok, true);
  assert.equal(whole.intent, 'patrol');
  // The green lamp so you can pick out the unit you have turned.
  assert.ok(whole.effects.some((e) => e.k === 'eye' && e.colour === 'green'));
  const flat = decide(byName['reprogram.ml'], { charge: 10 });
  assert.equal(flat.intent, 'home');
  // Whatever the senses, it must never choose hunt — that is the whole point.
  for (const charge of [0, 14, 15, 40, 100]) {
    assert.notEqual(decide(byName['reprogram.ml'], { charge, threat: true }).intent, 'hunt');
  }
});

test('logo.ml drives a square: route, four legs, a colour before each, tilde negatives', () => {
  const r = decide(byName['logo.ml'], { charge: 90 });
  assert.equal(r.ok, true);
  assert.equal(r.intent, 'route');
  const moves = r.effects.filter((e) => e.k === 'move');
  assert.deepEqual(moves, [
    { k: 'move', dx: 4, dy: 0 }, { k: 'move', dx: 0, dy: 4 },
    { k: 'move', dx: -4, dy: 0 }, { k: 'move', dx: 0, dy: -4 },
  ]);
  assert.deepEqual(r.effects.filter((e) => e.k === 'eye').map((e) => e.colour),
    ['red', 'green', 'blue', 'white']);
});

test('braincode.ml runs on the laptop: the program string, or a no-answer line', () => {
  const gone = { station: 'laptop', session: {}, fetchResource: () => '' };
  const up = { station: 'laptop', session: {}, fetchResource: () => 'if threat then hunt else patrol' };
  assert.match(runRonml(byName['braincode.ml'], gone).text, /no answer/);
  assert.equal(runRonml(byName['braincode.ml'], up).text, 'if threat then hunt else patrol');
});

test('the disk ships a /home/sdk pointer, and graft lands it on an older save', () => {
  const fresh = makeDisk();
  const pointer = fresh.d.home.d.sdk.d['readme.txt'];
  assert.ok(pointer && /ron-relay/.test(pointer.f), 'the pointer names the relay to join');
  assert.ok(/not installed/i.test(pointer.f), 'the pointer says the kit is not here yet');

  // An older save made before the folder existed: strip it, then graft.
  const old = makeDisk();
  delete old.d.home.d.sdk;
  const added = graftSystemDirs(old);
  assert.ok(old.d.home.d.sdk && old.d.home.d.sdk.d['readme.txt'], 'graft re-adds /home/sdk');
  assert.ok(added.includes('home/sdk'), 'and reports it');
});
