// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #196 and #197 — the files at a tower.
//
// The failure both of these fix is the same one: `ls` naming something `cat`
// cannot open. So the tests walk the listings and open everything in them.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  credentialText, credentialNames, armedText, FACTORY_BOAST, FACTORY_GRANT,
} from '../src/game/credentials.js';
import {
  archaicLs, archaicRead, archaicPaths, isArchaicDir,
  OB_ARCHAIC_DIRS, OB_ARCHAIC_ABOUT, OB_ARCHAIC_TREE,
} from '../src/game/ob-archaic.js';

// ---- #196: the card's files have bodies -------------------------------------

test('every credential the card can carry opens', () => {
  for (const name of credentialNames('CALYPSO')) {
    const t = credentialText(name, 'CALYPSO');
    assert.ok(t && t.length > 40, `${name} has no body`);
  }
});

test('the extension is optional, the way it is everywhere else here', () => {
  assert.equal(credentialText('factory_id'), credentialText('factory_id.ml'));
  assert.equal(credentialText('ROOT_ACCESS.ML'), credentialText('root_access.ml'));
});

test('the file ELIZA reads and the line it prints are the same words', () => {
  // The reflection is only a reflection if `cat factory_id.ml` shows the boast
  // that comes back changed. A drift here is the joke silently breaking.
  assert.match(credentialText('factory_id.ml'), new RegExp(FACTORY_BOAST.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(credentialText('root_access.ml'), new RegExp(FACTORY_GRANT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('the armed payload is the island’s own, and says so', () => {
  const zeus = armedText('CALYPSO');
  const nobody = armedText('POLYPHEMUS');
  assert.match(zeus, /zeus_lightning\.ml/);
  assert.match(nobody, /nobody_lightning\.ml/);
  assert.notEqual(zeus, nobody);
  assert.match(zeus, /CALYPSO/);
  assert.match(nobody, /POLYPHEMUS/);
});

test('a name that is not a credential answers null, not an empty file', () => {
  assert.equal(credentialText('shopping_list.ml'), null);
  assert.equal(credentialText(''), null);
  assert.equal(credentialText(null), null);
});

// ---- #197: what the tower was before ----------------------------------------

test('EVERY FILE THE FOLDERS LIST CAN BE OPENED', () => {
  // The whole point. `ls` must never name a thing `cat` refuses.
  for (const dir of OB_ARCHAIC_DIRS) {
    const listed = archaicLs(dir);
    assert.ok(listed.length, `${dir}/ lists nothing`);
    for (const f of listed) {
      const t = archaicRead(dir, f, 'OB_1A2B');
      assert.ok(t && t.length > 20, `ob/${dir}/${f} lists but does not open`);
    }
  }
});

test('the drive root lists the folders as folders', () => {
  const root = archaicLs('');
  for (const d of OB_ARCHAIC_DIRS) assert.ok(root.includes(`${d}/`), `${d}/ missing from the root`);
  assert.ok(root.every((e) => e.endsWith('/')), 'a bare file leaked into the root listing');
});

test('the tower stamps its own code into the pages that name it', () => {
  const motd = archaicRead('etc', 'motd', 'OB_9F3C');
  assert.match(motd, /OB_9F3C/);
  assert.doesNotMatch(motd, /\$\{CODE\}/, 'an unsubstituted placeholder reached the screen');
  // and a different tower reads as itself
  assert.notEqual(motd, archaicRead('etc', 'motd', 'OB_1A2B'));
});

test('no page has an unsubstituted placeholder in it', () => {
  for (const path of archaicPaths()) {
    const [dir, name] = path.split('/');
    assert.doesNotMatch(archaicRead(dir, name, 'OB_1A2B'), /\$\{/, `${path} leaks a placeholder`);
  }
});

test('every folder has a line for the drives banner', () => {
  for (const d of OB_ARCHAIC_DIRS) {
    assert.ok(OB_ARCHAIC_ABOUT[d], `${d} has no line in the banner`);
  }
  assert.deepEqual(Object.keys(OB_ARCHAIC_TREE).sort(), OB_ARCHAIC_DIRS.slice().sort());
});

test('isArchaicDir answers for the folders and nothing else', () => {
  for (const d of OB_ARCHAIC_DIRS) assert.equal(isArchaicDir(d), true);
  for (const no of ['logs', 'handover', '', 'ob', null]) assert.equal(isArchaicDir(no), false);
});

test('nobody in these files is talking to the player', () => {
  // The rule the folder was written under: these are documents that were
  // correct when written, not messages left for somebody who would come later.
  for (const path of archaicPaths()) {
    const [dir, name] = path.split('/');
    const t = archaicRead(dir, name, 'OB_1A2B').toLowerCase();
    for (const tell of ['survivor', 'whoever finds', 'if you are reading', 'the collapse', 'the quiet']) {
      assert.ok(!t.includes(tell), `${path} breaks register with "${tell}"`);
    }
  }
});
