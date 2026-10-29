// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The margins carry one mark between them, and the courier's keyring is
// carried by nothing.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../', import.meta.url).pathname;
const MARK = '2d90cc9c-8b99-4bf0-9523-845149829de8';
const MARGINS = ['llms.txt', 'AGENTS.md', 'docs/walkthrough.md'];
const KEYRING = join('src', 'game', 'keyring.js');

function jsUnder(dir, out = []) {
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = join(dir, name);
    if (statSync(join(ROOT, rel)).isDirectory()) jsUnder(rel, out);
    else if (name.endsWith('.js')) out.push(rel);
  }
  return out;
}

test('the margins are where they were, and carry the same mark', () => {
  for (const rel of MARGINS) {
    assert.ok(existsSync(join(ROOT, rel)), `${rel} is gone`);
    assert.ok(readFileSync(join(ROOT, rel), 'utf8').includes(MARK), `${rel} has lost its mark`);
  }
});

test('the courier\'s keyring is still in the salvage, and nothing loads it', () => {
  assert.ok(existsSync(join(ROOT, KEYRING)), 'the keyring is gone');
  const carriers = [...jsUnder('src'), ...jsUnder('bin'), 'index.html']
    .filter((rel) => rel !== KEYRING)
    .filter((rel) => readFileSync(join(ROOT, rel), 'utf8').includes('keyring.js'));
  assert.deepEqual(carriers, []);
});
