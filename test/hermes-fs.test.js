// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The relay's disk. A HERMES terminal answered `ls` with two files while the
// box served nine documents, the unit SDK and the V-class weights over its own
// aerial — all of it reachable only if you knew a topic word or opened
// Netscape.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hermesTree, hermesReadIn, hermesIsDir, HERMES_DIRS, hermesTopics, HERMES_DOCS } from '../src/game/hermes.js';
import { RELAY_BUNDLES, RELAY_FILES } from '../src/game/net.js';

test('the relay has folders, and the payload still sits at the top', () => {
  const top = hermesTree('CALYPSO', ['zeus_lightning.ml'])[''];
  assert.ok(top.includes('zeus_virus.ml'), 'the island payload is where it was');
  assert.ok(top.includes('zeus_lightning.ml'), 'and so is what you forged');
  for (const d of ['doc/', 'sdk/', 'weights/', 'bin/']) assert.ok(top.includes(d), `${d} is missing`);
});

test('THE SAMPLE ROBOT CODE AND THE WEIGHTS ARE FINDABLE BY LOOKING', () => {
  // The whole point: no topic word, no browser, just cd and ls.
  const t = hermesTree('CALYPSO');
  assert.ok(t.sdk.includes('braincode.ml'), 'the worked examples are in sdk/');
  assert.ok(t.sdk.includes('reprogram.ml'));
  assert.ok(t.weights.includes('vector_courier.ml'), 'the checkpoints are in weights/');
  assert.equal(t.weights.length, 5, 'four models and their readme');
});

test('a folder is a folder and a file is not', () => {
  assert.equal(hermesIsDir('', 'sdk'), true);
  assert.equal(hermesIsDir('', 'weights'), true);
  assert.equal(hermesIsDir('', 'zeus_virus.ml'), false);
  assert.equal(hermesIsDir('', 'nonesuch'), false);
});

test('every file the tree lists can actually be read', () => {
  // A filesystem you can ls and not cat is worse than none: it advertises
  // files that are not there.
  const t = hermesTree('CALYPSO');
  for (const [sub, names] of Object.entries(t)) {
    if (sub === '') continue;
    for (const n of names) {
      assert.ok(hermesReadIn(sub, n) != null, `${sub}/${n} lists but does not open`);
    }
  }
});

test('the docs read as files, wrapped, not as a raw record', () => {
  const txt = hermesReadIn('doc', 'vector.txt');
  assert.match(txt, /^On vector theory\n=+\n/, 'a heading and a rule');
  const body = txt.split('\n').slice(3);
  assert.ok(body.every((l) => l.length <= 64), 'wrapped to the terminal width');
  // The real property: rejoining the wrapped lines with single spaces must give
  // back the original text. Nothing was cut in half, nothing was lost.
  assert.equal(body.join(' ').replace(/\s+/g, ' ').trim(),
    HERMES_DOCS.vector.text.replace(/\s+/g, ' ').trim(),
    'wrapping must not break a word or drop one');
  assert.equal(hermesTopics().length, 9);
});

test('the extension is optional, the way it is everywhere else here', () => {
  assert.ok(hermesReadIn('doc', 'vector') != null, 'cat vector works as well as cat vector.txt');
});

test('ONE SOURCE OF TRUTH: the disk and the web downloads cannot drift', () => {
  // The files served over the aerial and the files on the disk are the same
  // objects, so a change to one is a change to both.
  const t = hermesTree('CALYPSO');
  const sdk = RELAY_BUNDLES.find((b) => b.name === 'unit-sdk');
  assert.deepEqual(t.sdk, sdk.files.map((f) => f.name));
  assert.equal(hermesReadIn('sdk', 'braincode.ml'), sdk.files.find((f) => f.name === 'braincode.ml').body);
  assert.deepEqual(t.bin, RELAY_FILES.map((f) => f.name));
});

test('every folder says what it is for', () => {
  for (const d of Object.keys(hermesTree('CALYPSO'))) {
    if (d === '') continue;
    assert.ok(HERMES_DIRS[d], `${d}/ has no description for the drives listing`);
  }
});

test('an unknown path is empty rather than an error', () => {
  assert.deepEqual(hermesTree('CALYPSO').nonesuch, undefined);
  assert.equal(hermesReadIn('nonesuch', 'x'), null);
  assert.equal(hermesReadIn('sdk', 'nonesuch.ml'), null);
});
