// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// WorldWideWeb — the first browser, on the machine it was written for.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDoc, layout, linkAt, homeDoc, nextSize, fontFor,
  NEXT_SIZES, WWW_STYLES, WWW_MENUS, WWW_FACES, WWW_INFO,
} from '../src/game/worldwideweb.js';

// A ruler, so layout can be tested without a canvas.
const ruler = (t, st) => t.length * (WWW_STYLES[st] || WWW_STYLES.p).size * 0.5;

test('TYPE SITS ON THE BITMAP LADDER, never between its rungs', () => {
  // NeXTSTEP drew each size by hand. A font at 13.5px is a size the machine
  // could not produce, and would read as smoother than 1990 ever was.
  for (const px of [8, 11, 13, 16, 20, 30]) {
    assert.ok(NEXT_SIZES.includes(nextSize(px)), `${px} snapped off the ladder`);
  }
  for (const style of Object.keys(WWW_STYLES)) {
    const size = Number(/(\d+)px/.exec(fontFor(style))[1]);
    assert.ok(NEXT_SIZES.includes(size), `${style} is set at ${size}px`);
  }
});

test('the two faces are the two the browser defaulted to', () => {
  assert.match(WWW_FACES.helv, /Helvetica/);
  assert.match(WWW_FACES.ohlfs, /Ohlfs/, 'Ohlfs is named even though it is gone');
  assert.match(WWW_FACES.ohlfs, /monospace/, 'with a monospace stand-in behind it');
});

test('A LINK IS A RUN INSIDE A PARAGRAPH, not a line of its own', () => {
  // The reason this does not reuse renderPage: a line-mode browser can number
  // links at the end, a pointing browser has to know where the words are.
  const [b] = parseDoc('<p>see <a href="cache.calypso.com">this</a> now</p>');
  assert.equal(b.style, 'p');
  assert.deepEqual(b.runs.map((r) => r.text), ['see ', 'this', ' now']);
  assert.equal(b.runs[1].href, 'cache.calypso.com');
  assert.equal(b.runs[0].href, undefined);
});

test('headings, rules and addresses keep their style', () => {
  const blocks = parseDoc('<h1>Home</h1>\n<h2>How to proceed</h2>\n<hr>\n<address>v1.0</address>');
  assert.deepEqual(blocks.map((b) => b.style), ['h1', 'h2', 'rule', 'address']);
});

test('entities are decoded, and stray tags do not reach the screen', () => {
  const [b] = parseDoc('<p>a &amp; b <b>bold</b> &mdash; end</p>');
  const text = b.runs.map((r) => r.text).join('');
  assert.match(text, /a & b bold — end/);
  assert.ok(!text.includes('<'), 'no markup survives into the text');
});

test('the home document is one block per line', () => {
  // A paragraph broken across source lines would render as several paragraphs
  // with several gaps, which is how the first draft of this looked.
  const blocks = parseDoc(homeDoc('CALYPSO'));
  const paras = blocks.filter((b) => b.style === 'p');
  for (const p of paras) {
    assert.ok(p.runs.length >= 1);
  }
  assert.ok(blocks.some((b) => b.style === 'h1'), 'it has a Home heading');
  assert.match(blocks[0].runs.map((r) => r.text).join(''), /Home/);
});

test('IT NAMES THE ESTATE, NOT CERN', () => {
  // Copying CERN's welcome page in would put a document in the game whose every
  // link is dead. This is the same page shape over the archive that exists.
  const text = homeDoc('POSEIDON');
  assert.match(text, /POSEIDON estate network/);
  assert.ok(!/CERN/.test(text), 'no link here points at a machine the game has not got');
});

test('every link on the home page addresses a host the game serves', () => {
  const blocks = parseDoc(homeDoc());
  const hrefs = blocks.flatMap((b) => b.runs.filter((r) => r.href).map((r) => r.href));
  assert.ok(hrefs.length >= 5, 'it is an index, so it has indexes on it');
  for (const h of hrefs) {
    assert.ok(/^[\w.]+$|^\d+\.\d+\.\d+\.\d+$/.test(h), `${h} is not an address this game resolves`);
  }
});

test('DOUBLE-CLICK LANDS ON THE WORD, and misses the space beside it', () => {
  const laid = layout(parseDoc('<p>see <a href="target.com">this</a> now</p>'), 400, ruler);
  const run = laid.lines.flatMap((l) => l.runs).find((r) => r.href);
  const line = laid.lines.find((l) => l.runs.includes(run));
  assert.equal(linkAt(laid, run.x + 1, line.y - 4), 'target.com');
  assert.equal(linkAt(laid, run.x + run.w - 1, line.y - 4), 'target.com');
  assert.equal(linkAt(laid, run.x - 5, line.y - 4), null, 'the text before it is not a link');
  assert.equal(linkAt(laid, run.x + run.w + 20, line.y - 4), null, 'nor the text after');
});

test('a click far from any line hits nothing', () => {
  const laid = layout(parseDoc('<p><a href="a.com">a</a></p>'), 400, ruler);
  assert.equal(linkAt(laid, 5, 9999), null);
  assert.equal(linkAt(laid, 5, -50), null);
});

test('long text wraps and the links wrap with it', () => {
  const long = `<p>${'word '.repeat(60)}<a href="z.com">end</a></p>`;
  const laid = layout(parseDoc(long), 300, ruler);
  assert.ok(laid.lines.length > 3, 'it wrapped');
  for (const l of laid.lines) {
    for (const r of l.runs) assert.ok(r.x < 300, 'nothing was laid past the margin');
  }
  const link = laid.lines.flatMap((l) => l.runs).find((r) => r.href);
  assert.equal(link.text, 'end', 'and the link came along');
});

test('the menus carry the names they actually had', () => {
  // Including the four-step errand that stands in for an address bar.
  assert.ok(WWW_MENUS.Document.includes('Open from full document reference'));
  assert.ok(WWW_MENUS.Document.includes('Save a copy offline'));
  assert.ok(WWW_MENUS.Links.includes('Mark all'), 'linking was mark-then-link');
  assert.ok(WWW_MENUS.Links.includes('Link to marked'));
  assert.ok(!JSON.stringify(WWW_MENUS).includes('Address'), 'there was no address bar');
  assert.ok(!JSON.stringify(WWW_MENUS).includes('Reload'), 'and no reload');
});

test('the Info panel says what the application claimed to be', () => {
  const t = WWW_INFO.join('\n');
  assert.match(t, /HyperMedia Browser\/Editor/);
  assert.match(t, /not constrained to be linear/);
});

test('an empty document is empty rather than an error', () => {
  assert.deepEqual(parseDoc(''), []);
  assert.deepEqual(parseDoc(null), []);
  const laid = layout([], 300, ruler);
  assert.deepEqual(laid.lines, []);
  assert.equal(laid.height, 0);
});

// ---- #166: the three panels ----------------------------------------------
// The browser shipped read-only, with no way to reach a document nobody had
// linked you to and no way to make a link yourself. Both of those are what the
// application WAS: no address bar, so navigation is an errand through a menu
// and a panel; and an editor, so a link you make becomes part of the document.

test('a reference resolves whatever scheme you spell it with, and not otherwise', async () => {
  const { resolveRef } = await import('../src/game/worldwideweb.js');
  const hosts = [{ host: 'cache.calypso.com', name: 'The cache' }, { host: '10.1.5.3', name: 'AI-ML' }];
  assert.equal(resolveRef('cache.calypso.com', hosts).name, 'The cache');
  assert.equal(resolveRef('http://cache.calypso.com', hosts).name, 'The cache', 'the scheme is not the point');
  assert.equal(resolveRef('  CACHE.CALYPSO.COM/  ', hosts).name, 'The cache', 'nor is case or a trailing slash');
  assert.equal(resolveRef('10.1.5.3', hosts).name, 'AI-ML', 'a bare address is a full reference too');
  // Forgiving about the scheme and NOTHING else: half a name is not a
  // reference, and gets the silence the real panel gave you.
  assert.equal(resolveRef('cache', hosts), null);
  assert.equal(resolveRef('', hosts), null);
  assert.equal(resolveRef('nowhere.example', hosts), null);
});

test('linking writes the link into the document, once', async () => {
  const { linkInto } = await import('../src/game/worldwideweb.js');
  const doc = '<h1>Home</h1>\n<p>Something.</p>';
  const mark = { title: 'The cache', addr: 'cache.calypso.com' };
  const once = linkInto(doc, mark);
  assert.ok(once.includes('<h2>Links</h2>'), 'the browser adds the heading');
  assert.ok(once.includes('<a href="cache.calypso.com">The cache</a>'));
  assert.equal(linkInto(once, mark), once, 'linking the same document twice changes nothing');
  // A second, different mark goes under the heading that is already there.
  const twice = linkInto(once, { title: 'Wikipedia', addr: 'wikipedia.org' });
  assert.equal((twice.match(/<h2>Links<\/h2>/g) || []).length, 1, 'one heading, not two');
  assert.ok(twice.includes('wikipedia.org'));
});

test('mark and link: the pair, through the workspace', async () => {
  const WS = await import('../src/game/workspace.js');
  const { linkInto } = await import('../src/game/worldwideweb.js');
  const ws = WS.newWorkspace();
  assert.equal(WS.wwwMarkAll(ws), null, 'nothing to mark with no browser open');

  WS.openWWW(ws, 'The cache', '<h1>The cache</h1>', 'cache.calypso.com');
  const mark = WS.wwwMarkAll(ws);
  assert.equal(mark.addr, 'cache.calypso.com');
  // Linking a document to itself is the one move the pair refuses.
  assert.deepEqual(WS.wwwLinkToMarked(ws, linkInto), { self: true });

  const home = WS.openWWW(ws, 'Home', '<h1>Home</h1>', 'file://localhost/home.html');
  const r = WS.wwwLinkToMarked(ws, linkInto);
  assert.equal(r.into, 'file://localhost/home.html');
  assert.ok(home.doc.includes('cache.calypso.com'), 'the link is in the text');
  assert.equal(home.laid, null, 'and the layout is invalidated so it redraws');
});

test('a link you made is still there when the document is opened again', async () => {
  const WS = await import('../src/game/workspace.js');
  const { linkInto } = await import('../src/game/worldwideweb.js');
  const ws = WS.newWorkspace();
  WS.openWWW(ws, 'The cache', '<h1>The cache</h1>', 'cache.calypso.com');
  WS.wwwMarkAll(ws);
  WS.openWWW(ws, 'Home', '<h1>Home</h1>', 'file://localhost/home.html');
  WS.wwwLinkToMarked(ws, linkInto);
  // Close every window; the edit belongs to the document, not to the window.
  for (const w of ws.windows.slice()) WS.closeWindow(ws, w.id);
  const again = WS.wwwDocFor(ws, 'file://localhost/home.html', '<h1>Home</h1>');
  assert.ok(again.includes('cache.calypso.com'), 'a link that vanished would be a note, not a link');
  assert.equal(WS.wwwDocFor(ws, 'somewhere.else', '<h1>Fresh</h1>'), '<h1>Fresh</h1>',
    'an unedited document is served as it comes');
});

test("the application's menu is in the bar only while its window is in front", async () => {
  const WS = await import('../src/game/workspace.js');
  const ws = WS.newWorkspace();
  const top = () => WS.menuRows(ws).map((r) => r.label);
  assert.equal(top().includes('WorldWideWeb'), false, 'no browser open, no browser menu');
  WS.openWWW(ws, 'Home', '<h1>Home</h1>', 'file://localhost/home.html');
  assert.equal(top()[0], 'WorldWideWeb', 'NeXTSTEP menus belong to the active application');
  const rows = WS.menuRows(ws, ['WorldWideWeb']).map((r) => r.label);
  assert.ok(rows.includes('Open from full document reference'), 'the whole navigation story');
  assert.ok(rows.includes('Mark all') && rows.includes('Link to marked'));
  // Link to marked is greyed until something is marked, so the pair reads as a
  // pair before you have used either half.
  const linkRow = WS.menuRows(ws, ['WorldWideWeb']).find((r) => r.label === 'Link to marked');
  assert.equal(linkRow.on, false);
  WS.wwwMarkAll(ws);
  assert.equal(WS.menuRows(ws, ['WorldWideWeb']).find((r) => r.label === 'Link to marked').on, true);
});

test('the panels open once each, and Info is the browser’s own', async () => {
  const WS = await import('../src/game/workspace.js');
  const ws = WS.newWorkspace();
  const a = WS.openWWWOpen(ws);
  const b = WS.openWWWOpen(ws);
  assert.equal(a.id, b.id, 'one Open panel, raised rather than stacked');
  assert.equal(a.ref, '', 'and it opens empty: there is no history');
  const i = WS.openWWWInfo(ws);
  assert.equal(WS.openWWWInfo(ws).id, i.id);
});

// ---- #194: every bundle in /Apps opens as an application --------------------

test('EVERY .app IN THE LIBRARY HAS A LAUNCHER', async () => {
  // Three were missing — Grove, Mail and WorldWideWeb — so double-clicking them
  // in the file manager fell through to the text viewer and showed the bundle's
  // own manifest, which is a true thing to show and not what a double-click
  // means (David, 2026-08-18). The table is data, so a test can hold it to the
  // library rather than trusting whoever adds the next app to remember.
  const { APPS } = await import('../src/game/workspace-library.js');
  const src = await (await import('node:fs/promises')).readFile(
    new URL('../src/main.js', import.meta.url), 'utf8');
  const table = /const WS_APP_LAUNCH = \{([\s\S]*?)\};/.exec(src);
  assert.ok(table, 'the launcher table is still called WS_APP_LAUNCH');
  const wired = new Set([...table[1].matchAll(/'([^']+\.app)'\s*:/g)].map((m) => m[1]));
  const missing = Object.keys(APPS).filter((n) => !wired.has(n));
  assert.deepEqual(missing, [], `bundles in /Apps with no launcher: ${missing.join(', ')}`);
});
