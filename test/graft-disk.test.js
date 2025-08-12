// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// Grafting this build's files onto a disk that came out of somebody's save.
//
// The laptop's whole filesystem serialises into the save, so anything shipped
// after a player started is invisible to them for ever unless the graft puts it
// there. It used to look only at the TOP level of /home: if the folder existed
// the folder was skipped whole, so eliza.ml never reached anybody who had a
// save from before it was written, and they went on being served doctor.ml — a
// file this build does not have. That is what these hold.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeDisk, graftSystemDirs } from '../src/game/unix.js';

/** A save-shaped disk: this build's, with the eliza folder wound back. */
function oldSave() {
  const d = makeDisk();
  d.d.home.d.eliza.d = { readme: { f: 'old readme' }, 'doctor.ml': { f: '(* the canned one *)' } };
  return d;
}

test('a folder that already exists still gets this build\'s new files', () => {
  const disk = oldSave();
  graftSystemDirs(disk);
  const eliza = Object.keys(disk.d.home.d.eliza.d);
  assert.ok(eliza.includes('eliza.ml'), `eliza.ml never arrived: ${eliza.join(', ')}`);
});

test('a file this build has retired is taken off an old disk', () => {
  const disk = oldSave();
  graftSystemDirs(disk);
  assert.ok(!disk.d.home.d.eliza.d['doctor.ml'],
    'doctor.ml survived the graft; the machine will serve a program that no longer exists');
});

test('the graft says what it did, in both directions', () => {
  const added = graftSystemDirs(oldSave());
  assert.ok(added.includes('home/eliza/eliza.ml'), 'an addition must be reported');
  assert.ok(added.includes('-home/eliza/doctor.ml'), 'a removal must be reported, with its sign');
});

test('a file the player edited is left exactly as they left it', () => {
  // The whole reason this only ever ADDS. Their version of a shipped file is
  // still their work and a graft is not allowed to take it back.
  const disk = oldSave();
  disk.d.home.d.eliza.d.readme = { f: 'MY NOTES' };
  graftSystemDirs(disk);
  assert.equal(disk.d.home.d.eliza.d.readme.f, 'MY NOTES');
});

test('a folder the player made is untouched', () => {
  const disk = oldSave();
  disk.d.home.d.mine = { d: { 'notes.txt': { f: 'hello' } } };
  graftSystemDirs(disk);
  assert.deepEqual(Object.keys(disk.d.home.d.mine.d), ['notes.txt']);
});

test('grafting a current disk changes nothing', () => {
  // The common case, run on every load. It has to be a no-op or it is churning
  // somebody's save every time they open the lid.
  assert.deepEqual(graftSystemDirs(makeDisk()), []);
});

test('every folder this build ships under /home reaches an empty home', () => {
  const disk = makeDisk();
  const shipped = Object.keys(disk.d.home.d);
  const bare = makeDisk();
  bare.d.home.d = {};
  graftSystemDirs(bare);
  assert.deepEqual(Object.keys(bare.d.home.d).sort(), shipped.sort());
});
