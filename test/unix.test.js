// The laptop's UNIX (docs/laptop-plan.md): path filesystem, the shell commands,
// real pipes and `>` redirect. Pure module — no world, no DOM, no canvas.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeDisk, newShell, runUnix, resolvePath, lookup, isDir, isFile, edOpen, edRun, SALVAGE_DISKS, graftSalvage } from '../src/game/unix.js';
import { PDFS } from '../src/game/pdfs.js';

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

test('no card fitted: ifconfig says so and netscape refuses', () => {
  const env = sh();
  assert.match(run('ifconfig', env).text, /No wireless card is fitted/);
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
  assert.match(run('help', withCard(true)).text, /card is UP/);
});

test('uname names the system', () => {
  assert.equal(run('uname', sh()).text, 'UNIX');
  assert.match(run('uname -a', sh()).text, /unnetworked, yours/);
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
  const { ed } = edOpen(env, 'count.ml');
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
  assert.match(runUnix('ls', env, {}).text, /pdf/, 'the folder is in home');
  const listed = runUnix('ls pdf', env, {}).text;
  for (const d of PDFS) assert.match(listed, new RegExp(d.name.replace('.', '\\.')), `${d.name} is on the disk`);
  const shown = runUnix(`cat pdf/${PDFS[0].name}`, env, {}).text;
  assert.match(shown, /%PDF/, 'it looks like what it is');
  assert.match(shown, new RegExp(`pdf ${PDFS[0].name.replace('.', '\\.')}`), 'and says how to open it');
});

test('pdf is handed to the hub, and refuses politely with no reader', () => {
  const env = newShell();
  let got = null;
  const r = runUnix(`pdf ${PDFS[0].name}`, env, { pdf: (args) => { got = String(args[0].name || args[0]); return { ok: true, mode: 'pdf', text: '' }; } });
  assert.equal(r.mode, 'pdf');
  assert.equal(got, PDFS[0].name);
  assert.match(runUnix('pdf x.pdf', env, {}).text, /no document reader/);
});
