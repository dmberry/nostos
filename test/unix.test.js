// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The laptop's UNIX (docs/laptop-plan.md): path filesystem, the shell commands,
// real pipes and `>` redirect. Pure module — no world, no DOM, no canvas.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeDisk, newShell, runUnix, hasFile, resolvePath, lookup, isDir, isFile, edOpen, edRun, SALVAGE_DISKS, graftSalvage, dir, file, graftSystemDirs, COMMAND_NAMES, parseSelection, handlesOwnPaste, isBrowserChord , HOOK_COMMANDS } from '../src/game/unix.js';
import { PDFS } from '../src/game/pdfs.js';
import { BOOKS } from '../src/game/books.js';

const sh = () => newShell(makeDisk());
const run = (line, env, hooks) => runUnix(line, env, hooks);

// ---- paths ---------------------------------------------------------------

test('resolvePath handles absolute, relative, .., . and ~', () => {
  assert.deepEqual(resolvePath('/usr/games'), ['usr', 'games']);
  assert.deepEqual(resolvePath('games', ['usr']), ['usr', 'games']);
  assert.deepEqual(resolvePath('..', ['usr', 'games']), ['usr']);
  assert.deepEqual(resolvePath('./x', ['home']), ['home', 'x']);
  assert.deepEqual(resolvePath('~'), ['home']);
  assert.deepEqual(resolvePath('~/fact.ml'), ['home', 'fact.ml']);
  assert.deepEqual(resolvePath('/'), []);
});

test('the starting disk has the shape the design asks for', () => {
  const d = makeDisk();
  assert.ok(isDir(lookup(d, ['usr', 'man'])), '/usr/man exists');
  assert.ok(isDir(lookup(d, ['usr', 'games'])), '/usr/games exists (L7 fills it)');
  assert.ok(isFile(lookup(d, ['home', 'readme'])), 'a readme to find first');
  assert.ok(isFile(lookup(d, ['home', 'hello.ml'])), 'an example program');
});

// ---- the shell -----------------------------------------------------------

test('pwd starts at /home and cd moves around', () => {
  const env = sh();
  assert.equal(run('pwd', env).text, '/home');
  run('cd /usr/man', env);
  assert.equal(run('pwd', env).text, '/usr/man');
  run('cd ..', env);
  assert.equal(run('pwd', env).text, '/usr');
  run('cd', env);   // bare cd goes home
  assert.equal(run('pwd', env).text, '/home');
});

test('ls lists, ls -l gives the long form', () => {
  const env = sh();
  const plain = run('ls', env).text;
  assert.match(plain, /readme/);
  assert.match(plain, /hello\.ml/);
  const long = run('ls -l', env).text;
  assert.match(long, /^-\s+\d+\s+readme$/m, 'long form shows kind and size');
});

test('cat reads a file; a missing file is a readable error', () => {
  const env = sh();
  assert.match(run('cat readme', env).text, /This machine is yours/);
  const bad = run('cat nope', env);
  assert.equal(bad.ok, false);
  assert.match(bad.text, /no such file/);
});

test('man reads the page off the disk (the manual IS a file)', () => {
  const env = sh();
  const r = run('man ml', env);
  assert.equal(r.ok, true);
  assert.match(r.text, /practise here, run it at a tower/i);
});

test('an unknown command says so and points at help', () => {
  const r = run('frobnicate', sh());
  assert.equal(r.ok, false);
  assert.match(r.text, /not found\. type help/);
});

// ---- pipes and redirect --------------------------------------------------

test('pipes chain: cat | grep | wc', () => {
  const env = sh();
  const grepped = run('cat readme | grep machine', env);
  assert.equal(grepped.ok, true);
  assert.ok(grepped.text.split('\n').every((l) => /machine/i.test(l)), 'only matching lines');
  const counted = run('cat readme | grep machine | wc', env);
  assert.equal(counted.text, String(grepped.text.split('\n').length));
});

test('head -n takes the first lines', () => {
  const env = sh();
  assert.equal(run('cat readme | head -2', env).text.split('\n').length, 2);
});

test('> redirects into a file, which is then readable', () => {
  const env = sh();
  const w = run('echo "hi there" > note', env);
  assert.equal(w.ok, true);
  assert.equal(w.text, '', 'redirected output is not also printed');
  assert.equal(run('cat note', env).text, 'hi there');
  assert.match(run('ls', env).text, /note/);
});

test('quoted strings survive as one argument', () => {
  assert.equal(run('echo "a b c"', sh()).text, 'a b c');
});

// ---- writing, moving, removing ------------------------------------------

test('mkdir / cp / mv / rm do what they say', () => {
  const env = sh();
  run('mkdir work', env);
  assert.match(run('ls', env).text, /work/);
  run('cp hello.ml work/hello.ml', env);
  assert.match(run('cat work/hello.ml', env).text, /hello world/);
  run('mv work/hello.ml work/first.ml', env);
  assert.equal(run('cat work/hello.ml', env).ok, false, 'the old name is gone');
  assert.match(run('cat work/first.ml', env).text, /hello world/);
  run('rm work/first.ml', env);
  assert.equal(run('cat work/first.ml', env).ok, false);
});

test('rm refuses a directory', () => {
  const env = sh();
  run('mkdir work', env);
  const r = run('rm work', env);
  assert.equal(r.ok, false);
  assert.match(r.text, /is a directory/);
});

// ---- sh scripts ----------------------------------------------------------

test('sh runs a file of commands, one per line', () => {
  const env = sh();
  run('echo "echo one" > s', env);
  // append a second line the long way (no >> yet): write the whole script at once
  env.root.d.home.d.s = { f: 'echo one\necho two' };
  const r = run('sh s', env);
  assert.equal(r.ok, true);
  assert.equal(r.text, 'one\ntwo');
});

test('a comment line and a blank line are skipped', () => {
  const env = sh();
  env.root.d.home.d.s = { f: '(* a note *)\n\necho only' };
  assert.equal(run('sh s', env).text, 'only');
});

// ---- the ml hook ---------------------------------------------------------

test('ml is handed to the hub as a MODE, not run as a filter', () => {
  const env = sh();
  let got = null;
  const r = run('ml hello.ml', env, { ml: (args) => { got = args; return { ok: true, mode: 'ml', text: 'ML' }; } });
  assert.deepEqual(got, ['hello.ml'], 'args reach the hook');
  assert.equal(r.mode, 'ml', 'the mode result is passed straight back');
});

test('ml without a hook says the machine has none', () => {
  const r = run('ml', sh());
  assert.equal(r.ok, false);
  assert.match(r.text, /no ML on this machine/);
});

// ---- the network card ----------------------------------------------------
// A fitted card comes up DOWN. `ifconfig wifi0 up` is the gate on the whole web,
// so getting online is something you learn to do, not something that happens.

const HOSTS = [{ ip: '192.0.0.1', host: 'calypso.com', down: false },
  { ip: '10.1.1.2', host: 'ob_3c4d.calypso.com', down: true }];
const withCard = (up = false) => {
  const env = sh();
  env.net = { card: true, up, iface: 'wifi0', spoof: { ip: '169.254.107.44', mac: '02:1f:3a:9c:04:b1' },
    find: (a) => HOSTS.find((h) => h.ip === a || h.host === a || h.host.split('.')[0] === a) || null };
  return env;
};

// `arp -a` is the field answer to "which of these four identical T-1s is which".
// It reports what the card can hear, nearest first, with a bearing — the printed
// map is the other answer and needs an obelisk you may not be able to reach.
// THE AIR. Two networks can be within reach and the card holds one at a time,
// which is what decides what netscape, ping and telnet can see.
const withAir = (nets, essid) => {
  const env = withCard(true);
  env.net.networks = () => nets;
  env.net.essid = essid || nets[0].essid;
  env.net.associate = (e) => { env.net.essid = e; };
  return env;
};
const AIR = [{ essid: 'calypso.com', kind: 'daemon', signal: 78, note: 'CALYPSO estate network' },
  { essid: 'ron-relay', kind: 'relay', signal: 96, note: 'unlisted' }];

test('arp renders a sweep and never crashes on an entry with no position', () => {
  const env = withCard(true);
  // A well-formed unit line, plus a host with no bearing/range — the shape the
  // positionless W-factory host took, which used to crash the formatter on
  // `undefined.padEnd`. The sweep itself now skips such an entry; the formatter
  // must also degrade rather than throw if one ever reaches it.
  env.net.local = () => [
    { host: 't1_03', ip: '10.1.1.9', mac: '8:0:2b:1:2:3', range: 4, bearing: 'NE', down: false, tag: 'guard' },
    { host: 'w-factory', ip: '10.1.1.1', mac: '8:0:2b:4:5:6', range: NaN, bearing: undefined, down: false, tag: null },
  ];
  let out;
  assert.doesNotThrow(() => { out = run('arp', env).text; });
  assert.match(out, /t1_03.*NE.*«guard»/, 'the good line renders with its bearing and tag');
  assert.match(out, /w-factory.*\?/, 'a positionless line degrades to ? rather than crashing');
});

test('scan lists the obelisks on the associated network, tagged and marked down', () => {
  const env = withCard(true);
  env.net.essid = 'calypso.com';
  env.net.obs = () => [
    { code: 'OB_5D33', host: 'ob_5d33.calypso.com', ip: '10.1.1.1', tag: 'gate', down: false },
    { code: 'OB_3C4D', host: 'ob_3c4d.calypso.com', ip: '10.1.1.2', tag: null, down: true },
  ];
  const out = run('scan', env).text;
  assert.match(out, /obelisks on calypso\.com/);
  assert.match(out, /OB_5D33\s+10\.1\.1\.1.*«gate»/, 'a live tower with its tag');
  assert.match(out, /OB_3C4D\s+10\.1\.1\.2.*\[down\]/, 'a felled tower flagged down');
});

test('scan needs a card, and needs it up', () => {
  assert.match(run('scan', withCard(false)).text, /wifi0 is down/);
  const noCard = sh(); noCard.net = null;
  assert.match(run('scan', noCard).text, /no network card/);
  const upNoObs = withCard(true); upNoObs.net.obs = () => [];
  assert.match(run('scan', upNoObs).text, /no obelisks/);
});

test('iwlist scan reports a Cell per network in range', () => {
  const out = run('iwlist wifi0 scan', withAir(AIR)).text;
  assert.match(out, /Scan completed/);
  assert.match(out, /Cell 01 - Address: 00:60:1D:/, 'real iwlist shape, not a made-up one');
  assert.match(out, /ESSID:"calypso\.com"/);
  assert.match(out, /ESSID:"ron-relay"/);
  assert.match(out, /Quality:96\/100/, 'the one you are standing next to is the loud one');
});

test('iwconfig associates, and refuses what is not on the air', () => {
  const env = withAir(AIR);
  assert.match(run('iwconfig', env).text, /ESSID:"calypso\.com"/, 'a card left alone joins the estate net');
  const on = run('iwconfig wifi0 essid ron-relay', env).text;
  assert.match(on, /associating with "ron-relay"/);
  assert.equal(env.net.essid, 'ron-relay', 'the association stuck');
  assert.match(run('iwconfig wifi0 essid ithaca.com', env).text, /no such network in range/);
  assert.match(run('iwconfig wifi0 essid', env).text, /essid <name>/);
});

test('a relay out of range is not on the air at all', () => {
  const env = withAir([AIR[0]]);
  assert.doesNotMatch(run('iwlist wifi0 scan', env).text, /ron-relay/);
  assert.match(run('iwconfig wifi0 essid ron-relay', env).text, /no such network in range/);
});

test('the wireless tools need the card up', () => {
  assert.match(run('iwlist wifi0 scan', withCard(false)).text, /wifi0 is down/);
  assert.match(run('iwconfig wifi0 essid ron-relay', withCard(false)).text, /wifi0 is down/);
  assert.match(run('iwconfig', sh()).text, /no wireless extensions/);
});

test('arp -a lists what is in radio range, nearest first', () => {
  const env = withCard(true);
  env.net.local = () => [
    { host: 't1_03.calypso.com', ip: '10.1.4.3', mac: '8:0:2b:11:22:33', range: 6, bearing: 'NE', down: false },
    { host: 't1_07.calypso.com', ip: '10.1.4.7', mac: '8:0:2b:44:55:66', range: 19, bearing: 'S', down: true },
  ];
  const out = run('arp -a', env).text;
  const lines = out.split('\n');
  assert.match(lines[0], /t1_03\.calypso\.com/);
  assert.match(lines[0], /6m NE/, 'a bearing and a range, so you can walk to it');
  assert.match(lines[1], /no answer/, 'a felled unit is still in the table and says so');
  assert.ok(lines[0].indexOf('(') === lines[1].indexOf('('), 'columns line up');
});

test('arp needs a card and needs it up', () => {
  assert.match(run('arp -a', sh()).text, /no network card fitted/);
  assert.match(run('arp -a', withCard(false)).text, /wifi0 is down/);
  const env = withCard(true);
  env.net.local = () => [];
  assert.match(run('arp -a', env).text, /nothing within range/);
});

test('no card fitted: ifconfig says so and netscape refuses', () => {
  const env = sh();
  assert.match(run('ifconfig', env).text, /no such interface/, 'a diagnostic, not a paragraph');
  const r = run('netscape', env, { netscape: () => ({ ok: true, mode: 'web' }) });
  assert.equal(r.ok, false);
  assert.match(r.text, /no network card fitted/);
});

test('a fitted card starts DOWN, and says how to bring it up', () => {
  const env = withCard(false);
  const out = run('ifconfig', env).text;
  assert.match(out, /status: down/);
  assert.match(out, /ifconfig wifi0 up/, 'the state report teaches the command');
  assert.match(out, /forged/, 'the hardware address is spoofed even while down');
});

test('ifconfig wifi0 up brings the card up and forges an identity', () => {
  const env = withCard(false);
  const up = run('ifconfig wifi0 up', env).text;
  assert.match(up, /associating/);
  assert.match(up, /169\.254\.107\.44/);
  assert.match(up, /Nothing on this network can follow that address home/);
  assert.equal(env.net.up, true, 'the state stuck');
  assert.match(run('ifconfig', env).text, /UP,BROADCAST,RUNNING,SPOOFED/);
  assert.match(run('ifconfig wifi0 up', env).text, /already up/);
  run('ifconfig wifi0 down', env);
  assert.equal(env.net.up, false);
});

test('nothing reaches the network while the card is down', () => {
  const env = withCard(false);
  const p = run('ping calypso.com', env);
  assert.equal(p.ok, false);
  assert.match(p.text, /wifi0 is down/);
  const n = run('netscape', env, { netscape: () => ({ ok: true, mode: 'web' }) });
  assert.equal(n.ok, false);
  assert.match(n.text, /is down/);
});

test('with the card up, ping reaches a live host and reports a dark one', () => {
  const env = withCard(true);
  assert.match(run('ping calypso.com', env).text, /0% packet loss/);
  assert.match(run('ping ob_3c4d', env).text, /100% packet loss/, 'a felled tower does not answer');
  assert.match(run('ping nowhere.invalid', env).text, /unknown host/);
});

test('netscape is handed to the hub as a MODE once the card is up', () => {
  const env = withCard(true);
  let got = null;
  const r = run('netscape calypso.com', env, { netscape: (a) => { got = a; return { ok: true, mode: 'web', text: 'WEB' }; } });
  assert.deepEqual(got, ['calypso.com']);
  assert.equal(r.mode, 'web');
});

test('help mentions the card only when one is fitted, and adapts to its state', () => {
  assert.doesNotMatch(run('help', sh()).text, /ifconfig wifi0 up/);
  assert.match(run('help', withCard(false)).text, /ifconfig wifi0 up/);
  // The line names the VERB and what it is for, not the interface state — a
  // player reading help wants to know that netscape is the way out onto the
  // web, and the ifconfig line below already says the card is what gates it.
  assert.match(run('help', withCard(true)).text, /netscape\s+browse what is left/);
});

test('uname names the system', () => {
  assert.equal(run('uname', sh()).text, 'UNIX');
  assert.match(run('uname -a', sh()).text, /^UNIX V7 nostbook/, 'fields, in the order uname prints them');
});

// ---- ed(1) ---------------------------------------------------------------
// The line editor: the only sane way to write an ML program on this machine.
// Terse on purpose — every complaint is a single `?`.

const feed = (ed, env, lines) => lines.map((l) => edRun(ed, l, env));

test('ed writes a new file from scratch, and ml can then run it', () => {
  const env = sh();
  const { ed, out } = edOpen(env, 'sq.ml');
  assert.equal(out, '?sq.ml', 'a new file is announced the way ed announces it');
  feed(ed, env, ['a', 'let sq x = x * x', 'echo (sq 7)', '.']);
  assert.equal(ed.lines.length, 2);
  const w = edRun(ed, 'w', env);
  assert.equal(w.out, String('let sq x = x * x\necho (sq 7)'.length), 'w reports the byte count');
  assert.equal(run('cat sq.ml', env).text, 'let sq x = x * x\necho (sq 7)');
  assert.equal(edRun(ed, 'q', env).quit, true);
});

test('ed opens an existing file and reports its size', () => {
  const env = sh();
  const { ed, out } = edOpen(env, 'hello.ml');
  assert.match(out, /^\d+$/);
  assert.equal(ed.lines.length, 2);
  assert.equal(edRun(ed, '1p', env).out, '(* hello.ml — the first program. Run it with:  ml hello.ml *)');
});

test('printing: p, n, ranges, and a bare address', () => {
  const env = sh();
  const { ed } = edOpen(env, 'demos/count.ml');
  assert.equal(edRun(ed, '2', env).out, 'let go n = if n == 0 then echo "liftoff" else (echo n ; go (n - 1))');
  assert.equal(ed.cur, 2, 'a bare address moves there');
  assert.match(edRun(ed, '1,$n', env).out, /^1\t/, 'n numbers the lines');
  assert.equal(edRun(ed, ',p', env).out.split('\n').length, 3);
  assert.equal(edRun(ed, '9p', env).out, '?', 'out of range is just ?');
});

test('editing: i, d, c and s///', () => {
  const env = sh();
  const { ed } = edOpen(env, 'x');
  feed(ed, env, ['a', 'one', 'two', 'three', '.']);
  edRun(ed, '2d', env);
  assert.deepEqual(ed.lines, ['one', 'three']);
  feed(ed, env, ['1i', 'zero', '.']);
  assert.deepEqual(ed.lines, ['zero', 'one', 'three']);
  edRun(ed, '3s/three/tri/', env);
  assert.deepEqual(ed.lines, ['zero', 'one', 'tri']);
  assert.equal(edRun(ed, '1s/nope/x/', env).out, '?', 'no match is ?');
  feed(ed, env, ['2c', 'ONE', '.']);
  assert.deepEqual(ed.lines, ['zero', 'ONE', 'tri']);
  assert.equal(edRun(ed, '=', env).out, '3');
});

test('q on unsaved work says ? the first time, and leaves on the second', () => {
  const env = sh();
  const { ed } = edOpen(env, 'y');
  feed(ed, env, ['a', 'unsaved', '.']);
  assert.equal(edRun(ed, 'q', env).out, '?');
  assert.equal(edRun(ed, 'q', env).quit, true, 'a second q abandons it, as ed does');
});

test('indentation survives — leading spaces are code, not noise', () => {
  const env = sh();
  const { ed } = edOpen(env, 'i.ml');
  feed(ed, env, ['a', 'let f x =', '    if x == 0 then 1', '.']);
  edRun(ed, 'w', env);
  assert.match(run('cat i.ml', env).text, /\n {4}if x == 0/);
});

test('ed is a MODE handed to the hub, and refuses a directory', () => {
  const env = sh();
  let got = null;
  const r = run('ed sq.ml', env, { ed: (a) => { got = a; return { ok: true, mode: 'ed' }; } });
  assert.deepEqual(got, ['sq.ml']);
  assert.equal(r.mode, 'ed');
  run('mkdir d', env);
  assert.throws(() => edOpen(env, 'd'), /is a directory/);
});

test('a blank line and a # comment are no-ops', () => {
  assert.equal(run('', sh()).text, '');
  assert.equal(run('# just thinking', sh()).text, '');
});

// ---- salvage: reading a dead machine's disk onto yours --------------------
// Found machines are CONTENT, not equipment. You do not swap them for yours —
// yours has your work on it — you copy their files across, into a folder each.

test('a salvaged archive lands in its own folder, under the owner name', () => {
  const env = sh();
  const names = graftSalvage(env.root, SALVAGE_DISKS[0]);
  assert.ok(names.length, 'it reports what it recovered');
  assert.match(run('ls /salvage', env).text, new RegExp(SALVAGE_DISKS[0].owner));
  const inside = run(`ls /salvage/${SALVAGE_DISKS[0].owner}`, env).text;
  for (const f of names) assert.match(inside, new RegExp(f.replace('.', '\\.')));
});

test('two archives sit side by side, and never touch /home', () => {
  const env = sh();
  const before = run('ls /home', env).text;
  graftSalvage(env.root, SALVAGE_DISKS[0]);
  graftSalvage(env.root, SALVAGE_DISKS[1]);
  const owners = run('ls /salvage', env).text;
  assert.match(owners, new RegExp(SALVAGE_DISKS[0].owner));
  assert.match(owners, new RegExp(SALVAGE_DISKS[1].owner));
  assert.equal(run('ls /home', env).text, before, 'your own files are untouched');
});

test("a salvaged .ml program runs, so somebody else's work is usable", () => {
  const env = sh();
  const eng = SALVAGE_DISKS.find((d) => Object.keys(d.files).some((f) => f.endsWith('.ml')));
  graftSalvage(env.root, eng);
  const file = Object.keys(eng.files).find((f) => f.endsWith('.ml'));
  assert.match(run(`cat /salvage/${eng.owner}/${file}`, env).text, /let /);
});

// ---- pico(1) and POST -----------------------------------------------------
// The hub owns both (one takes the screen, the other needs the world), so what
// this module owns is the routing and the refusals — which is where the useful
// mistakes are: no card, card down, wrong editor name.

test('pico is handed to the hub, and the editors we do not have point at it', () => {
  const env = newShell();
  let got = null;
  const r = runUnix('pico hello.ml', env, { pico: (args) => { got = args[0]; return { ok: true, mode: 'pico', text: '' }; } });
  assert.equal(r.mode, 'pico');
  assert.equal(String(got.name || got), 'hello.ml');
  for (const ed of ['nano', 'vi', 'vim', 'emacs']) {
    assert.match(runUnix(`${ed} x.ml`, env, {}).text, /not on this machine.*pico/i, ed);
  }
});

test('post needs a card that is up before it will send anything', () => {
  const env = newShell();
  const hook = () => ({ ok: true, text: '200 OK' });
  env.net = null;
  assert.match(runUnix('post a.ml t1_03', env, { post: hook }).text, /no network card/);
  env.net = { card: true, up: false };
  assert.match(runUnix('post a.ml t1_03', env, { post: hook }).text, /wifi0 is down/);
  env.net = { card: true, up: true };
  assert.equal(runUnix('post a.ml t1_03', env, { post: hook }).text, '200 OK');
});

test('the download folder exists on a fresh disk, kept apart from your own files', () => {
  const env = newShell();
  assert.match(runUnix('ls', env, {}).text, /download/);
  assert.equal(runUnix('cd download', env, {}).ok, true);
});

// ---- the document reader ---------------------------------------------------

test('the papers are on the disk, and cat points at the reader rather than printing binary', () => {
  const env = newShell();
  assert.match(runUnix('ls', env, {}).text, /documents/, 'the folder is in home');
  const listed = runUnix('ls documents', env, {}).text;
  for (const d of PDFS) assert.match(listed, new RegExp(d.name.replace('.', '\\.')), `${d.name} is on the disk`);
  const shown = runUnix(`cat documents/${PDFS[0].name}`, env, {}).text;
  assert.match(shown, /%PDF/, 'it looks like what it is');
  assert.match(shown, new RegExp(`pdf-viewer ${PDFS[0].name.replace('.', '\\.')}`), 'and says how to open it');
});

test('pdf-viewer and its pdf link both reach the reader', () => {
  for (const name of ['pdf-viewer', 'pdf']) {
    const env = newShell();
    let got = null;
    const r = runUnix(`${name} ${PDFS[0].name}`, env,
      { pdf: (args) => { got = String(args[0].name || args[0]); return { ok: true, mode: 'pdf', text: '' }; } });
    assert.equal(r.mode, 'pdf', `${name} opens the reader`);
    assert.equal(got, PDFS[0].name, `${name} passes the file through`);
  }
});

test('pdf is handed to the hub, and refuses politely with no reader', () => {
  const env = newShell();
  let got = null;
  const r = runUnix(`pdf ${PDFS[0].name}`, env, { pdf: (args) => { got = String(args[0].name || args[0]); return { ok: true, mode: 'pdf', text: '' }; } });
  assert.equal(r.mode, 'pdf');
  assert.equal(got, PDFS[0].name);
  assert.match(runUnix('pdf x.pdf', env, {}).text, /no document reader/);
});

// ---- the system tree -------------------------------------------------------
// V7's layout, not Linux's: this machine's own boot banner says UNIX V7, and
// /var, /opt, /proc and /sbin all postdate it.

test('the disk has a V7 system tree, and not a later one', () => {
  const env = newShell();
  const root = runUnix('ls /', env, {}).text;
  for (const d of ['bin', 'dev', 'etc', 'lib', 'mnt', 'tmp', 'usr', 'home', 'unix', 'readme.txt']) {
    assert.match(root, new RegExp(`\\b${d.replace('.', '\\.')}\\b`), `/${d} exists`);
  }
  for (const wrong of ['var', 'opt', 'proc', 'sbin']) {
    assert.doesNotMatch(root, new RegExp(`\\b${wrong}\\b`), `/${wrong} is later than V7 and must not be here`);
  }
});

test('the system files carry what a player can actually use', () => {
  const env = newShell();
  // Who owned this laptop before you did.
  assert.match(runUnix('cat /etc/passwd', env, {}).text, /e\.marsh/);
  // The card ifconfig talks to is a device on this machine.
  assert.match(runUnix('ls /dev', env, {}).text, /wifi0/);
  // The source is on the disk: the readable-machine argument, made concrete.
  assert.match(runUnix('ls /usr/src', env, {}).text, /main\.c/);
  // And the README explains why the build is old on purpose.
  const readme = runUnix('cat /readme.txt', env, {}).text;
  assert.match(readme, /TOR build/);
  assert.match(readme, /no telemetry|no update service/i);
  assert.match(readme, /control wire/, 'and is honest about what it cannot do');
});

test('the V7 text tools work, and pipe', () => {
  const env = newShell();
  assert.equal(runUnix('cat /etc/group | wc', env, {}).text, '3');
  assert.match(runUnix('cat /etc/passwd | sort | head -1', env, {}).text, /^e\.marsh/);
  assert.match(runUnix('tail -1 /etc/rc', env, {}).text, /ifconfig wifi0 up/);
  assert.match(runUnix('who', env, {}).text, /e\.marsh/);
  assert.match(runUnix('df', env, {}).text, /\/dev\/hd0/);
});

test('telnet needs a card that is up, and is handed to the hub', () => {
  const env = newShell();
  const hook = (args) => ({ ok: true, mode: 'telnet', text: String(args[0].id || args[0]) });
  env.net = null;
  assert.match(runUnix('telnet calypso.com', env, { telnet: hook }).text, /no network card/);
  env.net = { card: true, up: false };
  assert.match(runUnix('telnet calypso.com', env, { telnet: hook }).text, /wifi0 is down/);
  env.net = { card: true, up: true };
  const r = runUnix('telnet calypso.com 80', env, { telnet: hook });
  assert.equal(r.mode, 'telnet');
  assert.equal(r.text, 'calypso.com');
});

test('an older save gains the system tree without losing the player\'s files', () => {
  // A disk made before the tree existed: /home with the player's own work in it.
  const old = dir({ home: dir({ 'mine.ml': file('patrol') }) });
  const added = graftSystemDirs(old);
  assert.ok(added.includes('etc') && added.includes('tmp'), 'the tree arrives');
  assert.equal(old.d.home.d['mine.ml'].f, 'patrol', 'and their file is untouched');
  assert.ok(old.d.home.d.documents, 'including new home folders');
});

// ---- store and forward, and the Torite tools -------------------------------

test('mail reads the box the previous owner left', () => {
  const env = newShell();
  const list = runUnix('mail', env, {}).text;
  assert.match(list, /3 message/);
  assert.match(list, /j\.marsh/);
  assert.match(runUnix('mail 1', env, {}).text, /the boat/i);
  assert.match(runUnix('mail 9', env, {}).text, /no message 9/);
});

test('a letter is queued at the shore and only leaves at a relay', () => {
  const env = newShell();
  runUnix('echo "go up. you know where" > letter', env, {});
  const queued = runUnix('mail tor!mentor letter', env, {}).text;
  assert.match(queued, /Queued as c0001/);
  assert.match(queued, /standing next to a relay/);
  // No relay: the queue holds.
  assert.match(runUnix('uustat', env, {}).text, /No relay in range/);
  assert.match(runUnix('uucico', env, {}).text, /no carrier/i);
  assert.match(runUnix('uustat', env, {}).text, /1 job/);
  // Carry it up the hill.
  env.relay = { inRange: true, code: 'TOR-7C' };
  const run = runUnix('uucico', env, {}).text;
  assert.match(run, /Connected to TOR-7C/);
  assert.match(run, /1 sent, 0 held/);
  assert.match(runUnix('uustat', env, {}).text, /queue empty/);
});

test('a job with nowhere to go is held rather than lost', () => {
  const env = newShell();
  runUnix('echo home > note', env, {});
  runUnix('uucp note ithaca!anyone', env, {});
  env.relay = { inRange: true, code: 'TOR-1A' };
  const run = runUnix('uucico', env, {}).text;
  assert.match(run, /held/);
  assert.match(run, /never answered/);
  assert.match(runUnix('uustat', env, {}).text, /1 job/, 'and it is still in the queue');
});

test('strings reads what a thing has written inside itself', () => {
  const env = newShell();
  assert.match(runUnix('strings /unix', env, {}).text, /UNIX V7 \(TOR build\)/);
});

test('crypt is its own inverse, and does not leave the text readable', () => {
  const env = newShell();
  runUnix('echo "the ridge array" > plain', env, {});
  const cipher = runUnix('crypt moly plain', env, {}).text;
  assert.doesNotMatch(cipher, /ridge/, 'it is not readable');
  // Round trip through the filesystem, the way a player would.
  runUnix('crypt moly plain > secret', env, {});
  const back = runUnix('crypt moly secret', env, {}).text;
  assert.match(back, /the ridge array/);
  assert.match(runUnix('crypt', env, {}).text, /give a key/);
});

test('almanac answers from the machine\'s own clock', () => {
  const env = newShell();
  env.clock = { hour: 2.0, day: 1 };
  const night = runUnix('almanac', env, {}).text;
  assert.match(night, /\(dark\)/);
  assert.match(night, /sunrise/);
  assert.match(night, /low water/);
  env.clock = { hour: 12.0, day: 1 };
  assert.doesNotMatch(runUnix('almanac', env, {}).text, /\(dark\)/);
});

test('the books are on the disk and cat sends you to the browser', () => {
  const env = newShell();
  const listed = runUnix('ls books', env, {}).text;
  for (const b of BOOKS) assert.match(listed, new RegExp(`${b.key}\\.html`), `${b.key} is there`);
  const shown = runUnix('cat books/republic.html', env, {}).text;
  assert.match(shown, /<!DOCTYPE html>/);
  assert.match(shown, /book republic/, 'and says how to read it');
});

test('book and transcribe are handed to the hub', () => {
  const env = newShell();
  let opened = null;
  const r = runUnix('book republic', env, { book: (a) => { opened = String(a[0].id || a[0]); return { ok: true, mode: 'web', text: '' }; } });
  assert.equal(r.mode, 'web');
  assert.equal(opened, 'republic');
  // A book needs no card, unlike telnet or post.
  assert.equal(env.net, undefined);
  assert.match(runUnix('transcribe', env, {}).text, /nothing to type from/);
});

// A book added to the registry but not to the disk (or renamed on disk) would
// give a browser frame that loads nothing, which looks exactly like a slow book.
// The paths are checked here so a bad row cannot ship quietly.
test('every registered book names a file that exists, with a cover', async () => {
  const { existsSync } = await import('node:fs');
  const { bookPath, coverPath } = await import('../src/game/books.js');
  for (const b of BOOKS) {
    assert.ok(existsSync(decodeURIComponent(bookPath(b))), `${b.key}: ${b.file} is on disk`);
    assert.ok(b.cover, `${b.key} declares a cover`);
    assert.ok(existsSync(decodeURIComponent(coverPath(b))), `${b.key}: cover is on disk`);
    assert.ok(b.title && b.note, `${b.key} has a title and a note`);
  }
  assert.ok(BOOKS.length >= 7);
});

// ---- every command carries its own manual ----------------------------------
//
// This exists because seven of them did not. The V7 tools (tail, sort, uniq,
// who, ps, df, uptime) shipped in v1.232 as working commands with no page in
// /usr/man, and nothing noticed for five versions, because a missing manual
// breaks nothing: the command runs, the tests pass, and only a player typing
// `man sort` ever finds out. A machine whose whole argument is that you can
// read it has to answer when you ask.
test('every command a player can type has a man page', () => {
  const env = newShell();
  const listed = runUnix('ls /usr/man', env, {}).text.split(/\s+/).filter(Boolean);
  const missing = [];
  for (const name of COMMAND_NAMES) {
    if (!listed.includes(name)) { missing.push(name); continue; }
    const page = runUnix(`man ${name}`, env, {}).text || '';
    const lines = page.split('\n').filter((l) => l.trim());
    // A page has to do two things: name the command on a usage line, and say
    // something about it. Counting characters would pass 'cp\n  Copy.'
    if (!page.includes(name)) missing.push(`${name} (page does not name it)`);
    else if (lines.length < 2) missing.push(`${name} (usage line, no description)`);
    else if (lines[1].trim().length < 12) missing.push(`${name} (description too thin)`);
  }
  assert.deepEqual(missing, [], `no manual for: ${missing.join(', ')}`);
});

// ---- selectors -------------------------------------------------------------
//
// The argument grammar transcribe uses, and any later command that acts on a
// numbered list should use too. Lives in unix.js rather than main.js precisely
// so it can be tested at all.
test('parseSelection reads numbers, ranges, lists and -all', () => {
  const p = (spec, n = 9) => parseSelection(spec, n);
  assert.deepEqual(p('3').picks, [3]);
  assert.deepEqual(p('2-5').picks, [2, 3, 4, 5]);
  assert.deepEqual(p('1,3,7').picks, [1, 3, 7]);
  assert.deepEqual(p('1-3,9').picks, [1, 2, 3, 9]);
  assert.deepEqual(p('5-2').picks, [2, 3, 4, 5], 'a reversed range reads forwards');
  assert.deepEqual(p('2-4,3-5').picks, [2, 3, 4, 5], 'overlaps collapse, order kept');
  assert.deepEqual(p(' 2 - 5 ').picks, [2, 3, 4, 5], 'spaces around the dash are fine');
  for (const all of ['-all', '--all', 'all', '*', '-ALL']) {
    const r = p(all, 3);
    assert.equal(r.all, true, `${all} means everything`);
    assert.deepEqual(r.picks, [1, 2, 3]);
  }
});

test('parseSelection refuses what it cannot honour rather than guessing', () => {
  assert.equal(parseSelection('', 5).ok, false, 'empty is not a selection');
  assert.equal(parseSelection('0', 5).ok, false, 'the list is 1-based');
  assert.equal(parseSelection('6', 5).ok, false, 'past the end');
  assert.equal(parseSelection('1-6', 5).ok, false, 'a range past the end is not clamped');
  assert.equal(parseSelection('two', 5).ok, false, 'words are not numbers');
  assert.equal(parseSelection('1..3', 5).ok, false, 'only a single dash makes a range');
  assert.match(parseSelection('9', 5).error, /out of range/);
});

// ---- the paste guard -------------------------------------------------------
//
// The console scrapes a paste onto its command line. That must never fire over
// something you can type into, and guarding on the command line alone was wrong
// once pico, Netscape and the PDF reader began rendering inside the NostBook
// chassis: the terminal is still displayed behind them, so pasting into the
// EDITOR put the text on the command line and moved the focus there with it.
test('anything you can type into does its own pasting', () => {
  assert.equal(handlesOwnPaste({ tagName: 'TEXTAREA' }), true, 'pico');
  assert.equal(handlesOwnPaste({ tagName: 'INPUT' }), true, "the browser's URL bar");
  assert.equal(handlesOwnPaste({ tagName: 'DIV', isContentEditable: true }), true);
  assert.equal(handlesOwnPaste({ tagName: 'BODY' }), false, 'so the console still scrapes');
  assert.equal(handlesOwnPaste({ tagName: 'CANVAS' }), false);
  assert.equal(handlesOwnPaste(null), false, 'and nothing focused is not a crash');
});

// ---- what belongs to the browser -------------------------------------------
//
// A modal that swallows every key so none leaks into WASD will also swallow
// copy. The Scrapbook did exactly that, which meant you could select a lore
// page with the mouse and then fail to copy it — and the lore pages carry the
// addresses you are meant to type into the browser on the laptop.
test('a modifier chord belongs to the browser, a bare key to the game', () => {
  assert.equal(isBrowserChord({ key: 'c', metaKey: true }), true, 'Cmd+C on a Mac');
  assert.equal(isBrowserChord({ key: 'c', ctrlKey: true }), true, 'Ctrl+C elsewhere');
  assert.equal(isBrowserChord({ key: 'a', metaKey: true }), true, 'select all');
  assert.equal(isBrowserChord({ key: 'v', ctrlKey: true }), true, 'paste');
  assert.equal(isBrowserChord({ key: 'w' }), false, 'movement is unmodified');
  assert.equal(isBrowserChord({ key: 'Escape' }), false);
  assert.equal(isBrowserChord(null), false);
});

// ---- one grammar for naming an item in a list (v1.260) ---------------------
//
// transcribe established n / a-b / a,b,c / -all in v1.239. mail, book and
// pdf-viewer all act on numbered lists too, and a machine whose commands
// disagree about how to name item three has two conventions.
test('mail takes the same selector grammar as transcribe', () => {
  const env = newShell();
  assert.match(runUnix('mail 1', env, {}).text, /the boat/i);
  const two = runUnix('mail 1-2', env, {}).text;
  assert.match(two, /Message 1/);
  assert.match(two, /Message 2/);
  const all = runUnix('mail -all', env, {}).text;
  assert.equal((all.match(/^Message \d+:/gm) || []).length, 3, '-all reads the box');
  // The old wording survives for a single number, with the count added.
  assert.match(runUnix('mail 9', env, {}).text, /no message 9/);
  assert.match(runUnix('mail 9', env, {}).text, /You have 3/);
  assert.match(runUnix('mail 1-9', env, {}).text, /out of range/);
  // and an address is still an address, not a selector
  assert.doesNotMatch(runUnix('mail tor!mentor letter', env, {}).text, /out of range/);
});


// EVERY HOOK NAME IS REACHABLE. A command can sit in HOOK_COMMANDS, appear in
// `help`, have a man page, and still answer "not found", because the dispatch is
// a chain of explicit name checks and adding a name to the list does not add it
// to the chain. That is exactly what happened to `wifi`: listed, documented,
// unreachable. Nothing failed except a player typing it.
test('every command in HOOK_COMMANDS reaches its hook', () => {
  const skip = new Set(['www', 'vi', 'vim', 'emacs', 'nano']); // aliases and deliberate refusals
  const seen = [];
  const hooks = {};
  for (const n of HOOK_COMMANDS) hooks[n] = () => { seen.push(n); return { ok: true, text: '' }; };
  hooks.pdf = () => { seen.push('pdf'); return { ok: true, text: '' }; };
  for (const name of HOOK_COMMANDS) {
    if (skip.has(name)) continue;
    const env = sh();
    env.net = { card: true, up: true, iface: 'wifi0', spoof: { ip: '1.2.3.4', mac: 'aa' },
      networks: () => [], find: () => null };
    const r = runUnix(name, env, hooks);
    assert.doesNotMatch(String(r.text || ''), /not found/,
      `${name} is in HOOK_COMMANDS but the dispatch chain never reaches it`);
  }
});


// SOFTWARE YOU DO NOT HAVE. RON's scope is fetched, not built in, so the shell
// must refuse it until the file is actually on the disk — and must say where to
// get it rather than "not found", which teaches nothing.
test('sniffer refuses until the program is on the disk, and says where it is', () => {
  const env = withCard(true);
  env.net.networks = () => [];
  const hooks = { sniffer: () => ({ ok: true, text: 'scope' }) };
  // The hook is present, but main.js gates on the file; model that here by
  // asserting the disk check itself, which is what the gate reads.
  assert.equal(hasFile(env, 'sniffer'), false, 'a fresh disk does not carry it');
  const home = env.root.d.home;
  if (!home.d.download) home.d.download = { d: {} };
  home.d.download.d.sniffer = { f: 'ron/sniffer 1.0' };
  assert.equal(hasFile(env, 'sniffer'), true, 'fetched into /home/download, it is there');
  assert.equal(runUnix('sniffer', env, hooks).ok, true, 'and the dispatch reaches the hook');
});

test('hasFile looks where a person would actually put a program', () => {
  const env = sh();
  const home = env.root.d.home;
  home.d.tool = { f: 'x' };
  assert.equal(hasFile(env, 'tool'), true, '/home counts');
  assert.equal(hasFile(env, 'nothing_here'), false);
});

// #126 — the watermark. Everything the estate pressed is signed and nothing the
// player writes is, so run here the detector finds HUMANS. These tests pin that
// inversion: shipped file valid, edited file not, invented file not.
test('watermark: a shipped file is machine-generated, byte for byte', () => {
  const sh = newShell();
  const out = runUnix('watermark ' + firstShippedFile(sh), sh, {}).text;
  assert.match(out, /VALID — machine-generated/);
  assert.match(out, /RON content credentials/);
});

function firstShippedFile(sh) {
  // any regular file that exists on a fresh disk
  const walk = (n, path) => {
    if (isFile(n)) return path.join('/');
    for (const k of Object.keys(n.d || {})) {
      const r = walk(n.d[k], path.concat(k));
      if (r) return r;
    }
    return null;
  };
  return '/' + walk(makeDisk(), []);
}

test('watermark: an edited file loses the mark', () => {
  const sh = newShell();
  const p = firstShippedFile(sh).slice(1).split('/');
  lookup(sh.root, p).f += '\nthe player was here';
  const out = runUnix('watermark /' + p.join('/'), sh, {}).text;
  assert.match(out, /NONE — human-made, or scrubbed/);
  assert.match(out, /does not match/);
});

test('watermark: a file the player invented was never pressed at all', () => {
  const sh = newShell();
  lookup(sh.root, ['home']).d['mine.ml'] = file('fun reply s = s');
  const out = runUnix('watermark /home/mine.ml', sh, {}).text;
  assert.match(out, /NONE — human-made/);
  assert.match(out, /nothing in the estate ever wrote this file/);
});

test('watermark reports to KLEOS so the explainability track can count it', () => {
  const sh = newShell();
  const seen = [];
  sh.onAchieve = (n) => seen.push(n);
  runUnix('watermark ' + firstShippedFile(sh), sh, {});
  assert.deepEqual(seen, ['watermarkRead']);
});
