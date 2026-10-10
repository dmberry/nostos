// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The borrowed forms have to work in the game's own terms: every program on
// the poetry page and in cent runs, the history's last delta is the program
// the machines run, the diskette decrypts, nim cannot be beaten and ttt
// cannot be won.

import { test } from 'node:test';
import assert from 'node:assert';
import { decide } from '../src/game/ai_ml.js';
import { T1_PROGRAM, W1_PROGRAM } from '../src/game/robots.js';
import * as I from '../src/game/intertext.js';
import { POEMS } from '../src/game/archive-elit.js';
import { makeDisk, runUnix, graftSystemDirs, dir } from '../src/game/unix.js';

const SENSE = { charge: 50, threat: true, range: 4, hurt: false, integrity: 90, home_range: 3, linked: true, lost_for: 0 };

test('the last delta of s.pursuit.ml is the program the T-1 runs', () => {
  assert.equal(I.PURSUIT_TEXT_14, T1_PROGRAM);
  const p = I.parseSfile(I.S_PURSUIT);
  assert.deepEqual(p.deltas.map((d) => d.sid), ['1.1', '1.2', '1.3', '1.4']);
  assert.equal(p.deltas[3].text.join('\n'), T1_PROGRAM);
});

test('every cent source, and any combination of their lines, parses', () => {
  for (const src of I.CENT_SOURCES) {
    assert.equal(src.length, 14);
    assert.ok(decide(src.join('\n'), SENSE).ok, src[0]);
  }
  let seed = 7;
  const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 300; i++) {
    const d = I.centDigits(rng);
    const r = decide(I.cent(d), SENSE);
    assert.ok(r.ok, `cent ${d}: ${r.fault}`);
  }
  assert.equal(I.cent('123'), null);
});

test('every poem on the poetry page runs', () => {
  for (const [title, , lines] of POEMS) assert.ok(decide(lines.join('\n'), SENSE).ok, title);
  const lipo = POEMS.find(([t]) => t === 'no e');
  assert.ok(!/e/i.test(lipo[2].join('\n')));
});

test('the patchwork and the pair by the tree run', () => {
  assert.ok(decide(I.PATCH_PROGRAM, SENSE).ok);
  assert.equal(decide(I.GODOT_PROGRAM, SENSE).intent, 'wait');
  assert.equal(decide(I.GODOT_PROGRAM, { ...SENSE, charge: 3 }).intent, 'home');
});

test('the W-1 loader refuses only too much please', () => {
  assert.equal(I.politeness(W1_PROGRAM), null);
  assert.equal(I.politeness('if threat then hunt\nelse patrol'), null);
  assert.match(I.politeness('(* please *) (* please *)\nwait'), /E099/);
});

test('nim: the opening is lost for whoever moves first, and the machine never loses', () => {
  assert.equal(I.nimWins(I.NIM_START), false);
  let seed = 11;
  const rng = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  for (let g = 0; g < 200; g++) {
    const rows = I.NIM_START.slice();
    for (;;) {
      const live = rows.map((n, i) => (n ? i : -1)).filter((i) => i >= 0);
      const r = live[Math.floor(rng() * live.length)];
      rows[r] -= 1 + Math.floor(rng() * rows[r]);
      if (rows.every((n) => n === 0)) break;   // the player took the last one
      const [mr, mn] = I.nimReply(rows);
      rows[mr] -= mn;
      assert.ok(rows.some((n) => n > 0), 'the machine took the last match');
    }
  }
});

test('ttt is always a draw', () => {
  for (let i = 0; i < 40; i++) assert.equal(I.tttGame().result, 'draw');
});

test('the diskette: strings, then crypt with the album maker', () => {
  const env = { root: makeDisk(), cwd: ['home'] };
  const r = runUnix('strings misc/1992/disk.img | crypt kodak', env, {});
  assert.equal(r.text, I.AGRIPPA_NOTE);
});

test('sccs prs and get read the history off the disk', () => {
  const env = { root: makeDisk(), cwd: ['home'] };
  assert.match(runUnix('sccs prs /usr/src/robots/s.pursuit.ml', env, {}).text, /D 1\.3 .* e\.marsh/);
  assert.match(runUnix('sccs get -r1.3 /usr/src/robots/s.pursuit.ml', env, {}).text, /else if hurt then flee/);
});

test('an old disk gets the new /usr files without losing its own', () => {
  const root = makeDisk();
  delete root.d.usr.d.games;
  delete root.d.usr.d.src.d.sys;
  root.d.usr.d.src.d['mine.c'] = { f: 'kept' };
  root.d.usr.d.spool.d.uucp = dir({ 'job.1': { f: 'queued' } });
  graftSystemDirs(root);
  assert.ok(root.d.usr.d.games.d.nim);
  assert.ok(root.d.usr.d.src.d.sys.d['slp.c']);
  assert.equal(root.d.usr.d.src.d['mine.c'].f, 'kept');
  assert.equal(root.d.usr.d.spool.d.uucp.d['job.1'].f, 'queued');
});

test('taleSpin says what it knew and what it did', () => {
  assert.equal(I.taleSpin('t1_02', { charge: 10 }, { ok: true, intent: 'home' }), 'T1_02 WAS LOW ON CHARGE. T1_02 WENT HOME.');
  assert.equal(I.taleSpin('t1_02', SENSE, null, { powerDown: true }), 'T1_02 WAS SHUT DOWN. T1_02 STOOD THERE.');
});

test('every still and narration clip La Plage names is a file that exists', async () => {
  const fs = await import('node:fs');
  const { STILLS, STILLS_LAST, STILLS_DIR, STILLS_AUDIO, stillsReel } = await import('../src/game/stills.js');
  const imgs = STILLS.flatMap(([f]) => (Array.isArray(f) ? f : [f]));
  const clips = [...STILLS.flatMap(([, , , v, u]) => [v, u]).filter(Boolean), STILLS_LAST[1]];
  assert.ok(imgs.length >= 12 && clips.length >= 11);
  for (const n of imgs) assert.ok(fs.existsSync(new URL(`../${STILLS_DIR}/${n}`, import.meta.url)), n);
  for (const c of clips) assert.ok(fs.existsSync(new URL(`../${STILLS_AUDIO}/${c}.m4a`, import.meta.url)), c);
  assert.match(stillsReel({ embed: true }), /class="stills-embed"/);
  assert.doesNotMatch(stillsReel({ bare: true }), /bg:stills/);
  assert.match(stillsReel(), /<!--bg:stills-->/);
});

test('an old disk loses the untouched stills folder and gains laplage', () => {
  const root = makeDisk();
  const home = root.d.home;
  delete home.d.laplage;
  home.d.stills = dir({ readme: { f: 'Twelve photographs and two title cards.\nThey play in order: stills' }, '01.jpg': { f: 'x' } });
  graftSystemDirs(root);
  assert.ok(home.d.laplage);
  assert.equal(home.d.stills, undefined);
  const kept = makeDisk();
  delete kept.d.home.d.laplage;
  kept.d.home.d.stills = dir({ readme: { f: 'They play in order: stills' }, 'mine.txt': { f: 'kept' } });
  graftSystemDirs(kept);
  assert.equal(kept.d.home.d.stills.d['mine.txt'].f, 'kept');
});

test('the page keeps a sealed block that nothing but the phrase opens', async () => {
  const { archivedSite } = await import('../src/game/archive.js');
  const { openSigned, fromBase64 } = await import('../src/game/digest.js');
  const { PLAGE_SEALED } = await import('../src/game/stills.js');
  const html = [].concat(archivedSite('photo-roman.geocities.ws').body).join('\n');
  assert.match(html, /<!-------BEGIN LA PLAGE-----[\s\S]+-----END LA PLAGE------->/);
  assert.ok(fromBase64(PLAGE_SEALED).length > 400);
  assert.equal(openSigned('la plage', fromBase64(PLAGE_SEALED)), null);
  const env = { root: makeDisk(), cwd: ['home'] };
  env.root.d.home.d['p.asc'] = { f: html.slice(html.indexOf('<!-------BEGIN LA PLAGE')) };
  assert.match(runUnix('unseal p.asc la jetee', env, {}).text, /does not open/);
});

test('vault seals a file under a phrase and only that phrase opens it', () => {
  const env = { root: makeDisk(), cwd: ['home'] };
  env.root.d.home.d.note = { f: 'the dog was there' };
  assert.match(runUnix('vault -seal note "Once More"', env, {}).text, /sealed/);
  assert.match(env.root.d.home.d.note.f, /^-----BEGIN SEALED-----\n[\s\S]+\n-----END SEALED-----$/);
  assert.equal(runUnix('vault note once more -unseal', env, {}).text, 'the dog was there');
  assert.equal(runUnix('unseal note once more', env, {}).text, 'the dog was there');
  assert.match(runUnix('vault -u note once', env, {}).text, /does not open/);
  assert.match(runUnix('vault -s note again', env, {}).text, /already sealed/);
  assert.match(runUnix('vault note x /unseal', env, {}).text, /not a DOS machine/);
});

test('the Thursday group page: English under vault, German under crypt, Virno under a line of the Marx', async () => {
  const { archivedSite } = await import('../src/game/archive.js');
  const { renderPage } = await import('../src/game/net.js');
  const html = [].concat(archivedSite('illusion-of-the-epoch.geocities.ws').body).join('\n');
  const key1 = html.match(/if \(p == "([^"]+)"\)/)[1];
  const env = { root: makeDisk(), cwd: ['home'] };
  const shown = renderPage(html).text;
  const en = shown.slice(shown.indexOf('-----BEGIN SEALED-----'), shown.indexOf('-----END SEALED-----') + 20);
  env.root.d.home.d['en.asc'] = { f: en };
  const english = runUnix(`vault -unseal en.asc ${key1}`, env, {}).text;
  assert.match(english, /^Karl Marx\nThe German Ideology/);
  const de = html.match(/<pre>([^<]*)<\/pre>/g).find((p) => !/BEGIN SEALED/.test(p));
  env.root.d.home.d['de.txt'] = { f: de.slice(5, -6).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') };
  assert.match(runUnix('crypt wigand de.txt', env, {}).text, /^Karl Marx\nDie deutsche Ideologie/);
  const phrase = english.match(/circumstances make men just as much as men make circumstances/)[0];
  env.root.d.home.d['v.asc'] = { f: html.slice(html.indexOf('<!-------BEGIN SEALED')) };
  assert.match(runUnix(`unseal v.asc ${phrase}`, env, {}).text, /Paolo Virno, "General Intellect"/);
});

test('misc/1972/copy.ml: running it prints what cat prints', async () => {
  const { runRonml } = await import('../src/game/ai_ml.js');
  const { splitProgram } = await import('../src/lang/index.js');
  const env = { root: makeDisk(), cwd: ['home'] };
  const src = runUnix('cat misc/1972/copy.ml', env, {}).text;
  const ctx = { station: 'laptop', session: {}, bindSession() {} };
  const out = splitProgram(src).map(({ text }) => runRonml(text, ctx).text).filter(Boolean).join('\n');
  assert.equal(out, src);
});

test('the in-game security.txt is the file the site serves', async () => {
  const fs = await import('node:fs');
  const { SECURITY_TXT } = await import('../src/game/archive-provenance.js');
  const root = new URL('../', import.meta.url).pathname;
  assert.equal(SECURITY_TXT, fs.readFileSync(root + '.well-known/security.txt', 'utf8'));
  assert.equal(SECURITY_TXT, fs.readFileSync(root + 'security.txt', 'utf8'));
});

test('the six books, run on the NostBook, print one word', async () => {
  const { runRonml } = await import('../src/game/ai_ml.js');
  const { splitProgram } = await import('../src/lang/index.js');
  const { DRN_ML } = await import('../src/game/archive-phil-a.js');
  const ctx = { station: 'laptop', session: {}, bindSession() {} };
  const out = splitProgram(DRN_ML).map(({ text }) => runRonml(text, ctx).text).filter(Boolean).join('\n');
  assert.equal(out, 'Swerve');
});
