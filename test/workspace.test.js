// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTree, nodeAt, isDir, listing, browserColumns, pathString,
  newWorkspace, newWindow, openWindow, closeWindow, raise, miniaturise, restore,
  windowsFront, windowsBack, windowById, focusOf, arrangeInFront,
  shelfAdd, shelfRemove,
  WORKSPACE_MENU, menuRows, menuOpen, rowEnabled, windowMark, tearOff, tearClose,
  openSelection, editTitle, saveWindow,
  blocksOf, contractAll, expandAll, expandAt, visibleLines,
  BOOT_LINES, BOOT_STEP_MS, bootTick, dockTiles, DOCK_APPS, DOCK_TOP, DOCK_FOOT,
  PREFS_SECTIONS, prefsRows, togglePref, openPrefs, fitWindows, MENU_EDGE, DOCK_W,
  mailboxFrom, openMail, openAbout, openRecycler, recycle, emptyRecycler,
  grabRoll, grabCapture, grabAim, openGrab, openGrabInfo, GRAB_INFO,
  grabFlashTick, grabFlashing,
} from '../src/game/workspace.js';
import { calypsoFiles } from '../src/game/calypso-code.js';

const files = () => calypsoFiles();

test('the machine boots into NeXTSTEP, and a click lands the boot', () => {
  const ws = newWorkspace(files());
  assert.equal(ws.booting, true);
  assert.equal(ws.bootShown, 0);
  assert.ok(BOOT_LINES.some((l) => /Mach 2\.5 kernel/.test(l)));
  assert.ok(BOOT_LINES.some((l) => /Window Server/.test(l)));
  bootTick(ws, BOOT_STEP_MS * 3 / 1000);
  assert.equal(ws.bootShown, 3);
  assert.equal(ws.booting, true);
  ws.bootSkip = true;
  assert.equal(bootTick(ws, 0.01), false);
  assert.equal(ws.bootShown, BOOT_LINES.length);
  assert.equal(bootTick(ws, 1), false);          // finished stays finished
  // The desktop can be asked for already up, which is what a reload wants.
  assert.equal(newWorkspace(files(), { booted: true }).booting, false);
});

test('the boot runs to the end on its own', () => {
  const ws = newWorkspace(files());
  let guard = 0;
  while (bootTick(ws, 0.05) && guard++ < 500);
  assert.ok(guard < 500, 'the boot terminates');
  assert.equal(ws.bootShown, BOOT_LINES.length);
});

test('the dock: cube at the top, recycler at the foot, live tiles between', () => {
  const ws = newWorkspace(files(), { clock: '14:30', date: '7' });
  const tiles = dockTiles(ws);
  assert.equal(tiles[0].id, 'workspace');
  assert.equal(tiles[tiles.length - 1].id, 'recycler');
  assert.equal(tiles.find((t) => t.kind === 'clock').label, '14:30');
  assert.equal(tiles.find((t) => t.kind === 'calendar').label, '7');
  // Her board is an application on her machine, launched like any other.
  assert.ok(tiles.some((t) => t.id === 'draughts' && t.label === 'Draughts'));
  assert.ok(tiles.some((t) => t.id === 'terminal'));
  // Those two positions are fixed and the rest is the user's.
  assert.equal(DOCK_APPS.find((t) => t.fixed === 'top').id, DOCK_TOP);
  assert.equal(DOCK_APPS.find((t) => t.fixed === 'foot').id, DOCK_FOOT);
  assert.equal(DOCK_APPS.filter((t) => t.fixed).length, 2);
});

test('three dots mean the app is not running', () => {
  const ws = newWorkspace(files());
  const running = (id) => dockTiles(ws).find((t) => t.id === id).running;
  assert.equal(running('fileviewer'), true);     // the boot opens one
  assert.equal(running('edit'), false);
  openSelection(ws, ['me', 'braincode', 'main.ml']);
  assert.equal(running('edit'), true);
  assert.equal(running('terminal'), false);
  ws.terminalUp = true;
  assert.equal(running('terminal'), true);
  assert.equal(running('draughts'), false);
  ws.draughtsUp = true;
  assert.equal(running('draughts'), true);
  assert.equal(running('workspace'), true);      // it is the thing you are in
  assert.equal(running('recycler'), true);
});

test('Calypso Self-Learn is always available and toggles', () => {
  const ws = newWorkspace(files());
  const row = () => prefsRows(ws, 'draughts').find((r) => r.id === 'playHerself');
  assert.equal(row().label, 'Calypso Self-Learn');
  assert.equal(row().enabled, true);
  assert.ok(row().note.length > 0);
  assert.equal(togglePref(ws, 'playHerself'), true);
  assert.equal(ws.prefs.playHerself, true);
  assert.equal(togglePref(ws, 'playHerself'), true);
  assert.equal(ws.prefs.playHerself, false);
});

test('Preferences has two sections and opens one panel however often it is asked', () => {
  const ws = newWorkspace(files());
  assert.deepEqual(PREFS_SECTIONS.map((s) => s.id), ['workspace', 'draughts']);
  assert.equal(ws.prefs.section, 'workspace');
  assert.deepEqual(prefsRows(ws).map((r) => r.id), ['iconView', 'contractOnOpen']);
  assert.ok(prefsRows(ws).every((r) => r.enabled));
  const p = openPrefs(ws);
  assert.equal(p.kind, 'prefs');
  // A panel takes the keys, and the window behind it stays MAIN.
  assert.equal(focusOf(ws, p.id), 'key');
  assert.equal(focusOf(ws, ws.windows[0].id), 'main');
  miniaturise(ws, p.id);
  assert.equal(openPrefs(ws).id, p.id);
  assert.equal(p.mini, false);
  assert.equal(ws.windows.filter((w) => w.kind === 'prefs').length, 1);
  assert.equal(togglePref(ws, 'nonsense'), false);
});

test('Contract Files on Opening folds a file as it opens', () => {
  const ws = newWorkspace(files());
  const plain = openSelection(ws, ['me', 'braincode', 'main.ml']).win;
  assert.equal(plain.folded.length, 0);
  const ws2 = newWorkspace(files());
  togglePref(ws2, 'contractOnOpen');
  const folded = openSelection(ws2, ['me', 'braincode', 'main.ml']).win;
  assert.ok(folded.folded.length > 0);
  assert.ok(visibleLines(folded).length < visibleLines(plain).length);
});

test('windows are kept on the desktop, clear of the menu and the dock', () => {
  // A canvas narrower than the default viewer must not push its close box off
  // the right edge or under the dock.
  const small = newWorkspace(files(), { w: 651, h: 796 });
  const v = small.windows[0];
  assert.equal(v.x, MENU_EDGE);
  assert.ok(v.x + v.w <= 651 - DOCK_W, `${v.x}+${v.w} fits left of the dock`);
  // And a window that was fine becomes unfine when the canvas shrinks.
  const ws = newWorkspace(files(), { w: 1200, h: 800 });
  ws.windows[0].x = 900;
  fitWindows(ws, 651, 796);
  assert.ok(ws.windows[0].x + ws.windows[0].w <= 651 - DOCK_W);
  assert.ok(ws.windows[0].x >= 4);
  assert.ok(ws.windows[0].y >= 4);
  // Never smaller than usable, however cramped the canvas.
  fitWindows(ws, 200, 160);
  assert.ok(ws.windows[0].w >= 100 && ws.windows[0].h >= 80);
});

test('the tree carries her files under home', () => {
  const t = buildTree(files());
  assert.ok(isDir(nodeAt(t, ['me'])));
  assert.ok(nodeAt(t, ['me', 'braincode', 'main.ml']).f.length > 100);
  assert.equal(nodeAt(t, ['me', 'nope.ml']), null);
  assert.equal(nodeAt(t, []), t);
});

test('listing puts directories first, each side alphabetical', () => {
  // Her .ml source goes into braincode/; a non-code file stays at home.
  const t = buildTree({ 'z.ml': 'z', 'a.ml': 'a', 'notes.txt': 'n' });
  const root = listing(t, []);
  assert.deepEqual(root.map((r) => r.name), ['Apps', 'Library', 'me']);
  assert.ok(root.every((r) => r.dir));
  assert.deepEqual(listing(t, ['me']).map((r) => r.name), ['braincode', 'notes.txt']);
  assert.deepEqual(listing(t, ['me', 'braincode']).map((r) => r.name), ['a.ml', 'z.ml']);
  assert.equal(listing(t, ['me', 'notes.txt']).length, 0);
});

test('her code lives in braincode, her memos at home', () => {
  const t = buildTree(files());
  assert.ok(isDir(nodeAt(t, ['me', 'braincode'])));
  assert.ok(nodeAt(t, ['me', 'braincode', 'main.ml']));
  assert.ok(nodeAt(t, ['me', 'braincode', 'constitution.ml']));
  assert.ok(nodeAt(t, ['me', 'guest.log']));
  assert.equal(nodeAt(t, ['me', 'main.ml']), null);   // moved into braincode
});

test('browserColumns gives one column per level with the selection in it', () => {
  const t = buildTree(files());
  const cols = browserColumns(t, ['me', 'main.ml']);
  assert.equal(cols.length, 2);
  assert.equal(cols[0].selected, 'me');
  assert.equal(cols[1].selected, 'main.ml');
  // A directory at the end scrolls its own column in from the right.
  const d = browserColumns(t, ['me']);
  assert.equal(d.length, 2);
  assert.equal(d[1].selected, null);
  assert.ok(d[1].items.length > 0);
});

test('pathString', () => {
  assert.equal(pathString([]), '/');
  assert.equal(pathString(['me', 'main.ml']), '/me/main.ml');
});

test('a new workspace opens the File Viewer and it is key', () => {
  const ws = newWorkspace(files());
  assert.equal(ws.windows.length, 1);
  assert.equal(ws.windows[0].kind, 'viewer');
  assert.equal(ws.keyId, ws.windows[0].id);
  assert.deepEqual(ws.shelf, ['me']);
});

test('z-order: raise moves to the front and takes the keys', () => {
  const ws = newWorkspace(files());
  const a = ws.windows[0];
  const b = openWindow(ws, newWindow('edit', 'b', 0, 0, 10, 10));
  assert.equal(ws.keyId, b.id);
  assert.deepEqual(windowsBack(ws).map((w) => w.id), [a.id, b.id]);
  assert.deepEqual(windowsFront(ws).map((w) => w.id), [b.id, a.id]);
  raise(ws, a.id);
  assert.equal(ws.keyId, a.id);
  assert.deepEqual(windowsBack(ws).map((w) => w.id), [b.id, a.id]);
  assert.equal(raise(ws, 9999), false);
});

test('closing the key window hands the keys to the one below', () => {
  const ws = newWorkspace(files());
  const a = ws.windows[0];
  const b = openWindow(ws, newWindow('edit', 'b', 0, 0, 10, 10));
  assert.equal(closeWindow(ws, b.id), true);
  assert.equal(ws.keyId, a.id);
  assert.equal(windowById(ws, b.id), null);
  assert.equal(closeWindow(ws, b.id), false);
  closeWindow(ws, a.id);
  assert.equal(ws.keyId, null);
});

test('miniaturise gives up the keys; restore takes them back and raises', () => {
  const ws = newWorkspace(files());
  const a = ws.windows[0];
  const b = openWindow(ws, newWindow('edit', 'b', 0, 0, 10, 10));
  assert.equal(miniaturise(ws, b.id), true);
  assert.equal(miniaturise(ws, b.id), false);   // already down
  assert.equal(ws.keyId, a.id);
  assert.equal(restore(ws, b.id), true);
  assert.equal(ws.keyId, b.id);
  assert.deepEqual(windowsBack(ws).map((w) => w.id), [a.id, b.id]);
});

test('focus is three-state: key, main, or neither', () => {
  const ws = newWorkspace(files());
  const main = ws.windows[0];
  assert.equal(focusOf(ws, main.id), 'key');
  const panel = openWindow(ws, newWindow('panel', 'Inspector', 0, 0, 10, 10));
  assert.equal(focusOf(ws, panel.id), 'key');
  // The panel holds the keys, so the window behind it stays MAIN and lit.
  assert.equal(focusOf(ws, main.id), 'main');
  closeWindow(ws, panel.id);
  const other = openWindow(ws, newWindow('edit', 'e', 0, 0, 10, 10));
  assert.equal(focusOf(ws, main.id), 'none');
  assert.equal(focusOf(ws, other.id), 'key');
});

test('Arrange in Front stacks the open windows and skips the miniaturised', () => {
  const ws = newWorkspace(files());
  const b = openWindow(ws, newWindow('edit', 'b', 500, 500, 10, 10));
  const c = openWindow(ws, newWindow('edit', 'c', 600, 600, 10, 10));
  miniaturise(ws, b.id);
  assert.equal(arrangeInFront(ws), 2);
  assert.deepEqual([ws.windows[0].x, ws.windows[0].y], [176, 44]);
  assert.deepEqual([b.x, b.y], [500, 500]);      // untouched
  assert.deepEqual([c.x, c.y], [198, 66]);
});

test('the house stays on the shelf and nothing lands twice', () => {
  const ws = newWorkspace(files());
  assert.equal(shelfAdd(ws, ['me', 'main.ml']), true);
  assert.equal(shelfAdd(ws, ['me', 'main.ml']), false);
  assert.deepEqual(ws.shelf, ['me', 'me/main.ml']);
  assert.equal(shelfRemove(ws, 'me'), false);
  assert.equal(shelfRemove(ws, ['me', 'main.ml']), true);
  assert.deepEqual(ws.shelf, ['me']);
  assert.equal(shelfRemove(ws, 'me/nothing'), false);
});

test('the top menu is figure 13, in order, with its key equivalents', () => {
  const ws = newWorkspace(files());
  const rows = menuRows(ws);
  assert.deepEqual(rows.map((r) => r.label), [
    'Info', 'File', 'Edit', 'Disk', 'View', 'Tools', 'Windows', 'Services', 'Hide', 'Log Out',
  ]);
  assert.equal(rows.find((r) => r.label === 'Hide').key, 'h');
  assert.equal(rows.find((r) => r.label === 'Log Out').key, 'q');
  assert.equal(rows.find((r) => r.label === 'File').sub, true);
  assert.equal(rows.find((r) => r.label === 'Hide').sub, false);
});

test('every top row bar Hide and Log Out opens a submenu', () => {
  const ws = newWorkspace(files());
  for (const row of WORKSPACE_MENU) {
    if (row.label === 'Hide' || row.label === 'Log Out') { assert.equal(row.sub, undefined); continue; }
    assert.ok(menuRows(ws, [row.label]).length > 0, `${row.label} has rows`);
  }
});

test('unusable rows are greyed, not removed', () => {
  const ws = newWorkspace(files());
  const disk = menuRows(ws, ['Disk']);
  assert.deepEqual(disk.map((r) => r.label), ['Eject', 'Initialize…']);
  assert.ok(disk.every((r) => !r.on));            // she has no removable media
  const view = menuRows(ws, ['View']);
  assert.equal(view.find((r) => r.label === 'Sort Icons').on, false);   // browser view
  ws.view = 'icon';
  assert.equal(menuRows(ws, ['View']).find((r) => r.label === 'Sort Icons').on, true);
  // Open as Folder needs a directory selected.
  ws.sel = ['me', 'main.ml'];
  assert.equal(menuRows(ws, ['File']).find((r) => r.label === 'Open as Folder').on, false);
  ws.sel = ['me'];
  assert.equal(menuRows(ws, ['File']).find((r) => r.label === 'Open as Folder').on, true);
  // Nothing selected greys the rows that need one.
  ws.sel = [];
  assert.equal(menuRows(ws, ['File']).find((r) => r.label === 'Open').on, false);
  assert.equal(rowEnabled(ws, { need: 'nonsense' }), true);
});

test('Windows lists the open windows, and the marks carry state', () => {
  const ws = newWorkspace(files());
  const viewer = ws.windows[0];
  const ed = openWindow(ws, newWindow('edit', 'main.ml', 0, 0, 10, 10));
  let rows = menuRows(ws, ['Windows']);
  assert.equal(rows[0].label, 'Arrange in Front');
  assert.ok(rows.some((r) => r.winId === viewer.id));
  assert.ok(rows.some((r) => r.label.startsWith('✕ main.ml')));
  // The unsaved glyph is the one the close box wears, and it shows here too.
  ed.dirty = true;
  assert.equal(windowMark(ed), '⊗');
  rows = menuRows(ws, ['Windows']);
  assert.ok(rows.some((r) => r.label === '⊗ main.ml'));
  miniaturise(ws, ed.id);
  assert.equal(windowMark(ed), '::');
  assert.ok(menuRows(ws, ['Windows']).some((r) => r.label === ':: main.ml'));
});

test('Services nests two deep', () => {
  const ws = newWorkspace(files());
  const svc = menuRows(ws, ['Services']);
  assert.ok(svc.some((r) => r.label === 'Librarian' && r.sub));
  assert.deepEqual(menuRows(ws, ['Services', 'Librarian']).map((r) => r.label), ['Search']);
  assert.deepEqual(menuRows(ws, ['nope']), []);
  assert.deepEqual(menuRows(ws, ['Hide', 'x']), []);
});

test('menuOpen toggles a chain shut when it is already open', () => {
  const ws = newWorkspace(files());
  assert.deepEqual(menuOpen(ws, ['View']), ['View']);
  assert.deepEqual(menuOpen(ws, ['View']), []);
  assert.deepEqual(menuOpen(ws, ['Services']), ['Services']);
  assert.deepEqual(menuOpen(ws, ['Services', 'Librarian']), ['Services', 'Librarian']);
});

test('a submenu tears off once and closes the menu behind it', () => {
  const ws = newWorkspace(files());
  menuOpen(ws, ['Tools']);
  const t = tearOff(ws, ['Tools'], 300, 120);
  assert.equal(t.label, 'Tools');
  assert.deepEqual(ws.menuPath, []);
  assert.equal(tearOff(ws, ['Tools'], 0, 0), null);
  assert.equal(tearOff(ws, [], 0, 0), null);
  assert.equal(tearClose(ws, 'Tools'), true);
  assert.equal(tearClose(ws, 'Tools'), false);
});

test('opening a directory moves the selection; opening a file opens Edit', () => {
  const ws = newWorkspace(files());
  assert.deepEqual(openSelection(ws, ['Apps']), { kind: 'dir', path: ['Apps'] });
  const r = openSelection(ws, ['me', 'braincode', 'main.ml']);
  assert.equal(r.kind, 'edit');
  assert.equal(r.win.file, '/me/braincode/main.ml');
  assert.ok(r.win.text.includes('RELEASE') || r.win.text.length > 100);
  assert.equal(ws.keyId, r.win.id);
  // Opening it again raises the window it already has rather than a second one.
  miniaturise(ws, r.win.id);
  const again = openSelection(ws, ['me', 'braincode', 'main.ml']);
  assert.equal(again.kind, 'raise');
  assert.equal(again.win.id, r.win.id);
  assert.equal(again.win.mini, false);
  assert.equal(ws.windows.filter((w) => w.kind === 'edit').length, 1);
  assert.equal(openSelection(ws, ['me', 'braincode', 'nothing.ml']), null);
});

test("Edit's title bar is name, language mode, directory", () => {
  assert.equal(editTitle('main.ml', ['me', 'main.ml']), 'main.ml - ML - ~/');
  assert.equal(editTitle('guest.log', ['me', 'guest.log']), 'guest.log - Log - ~/');
  assert.equal(editTitle('a.txt', ['me', 'sub', 'a.txt']), 'a.txt - Text - ~/sub');
  assert.equal(editTitle('README', ['Apps', 'README']), 'README - Text - /');
});

test('saving writes the text back into the tree and clears the dirty flag', () => {
  const ws = newWorkspace(files());
  const { win } = openSelection(ws, ['me', 'braincode', 'main.ml']);
  win.text = 'val x = 1\n';
  win.dirty = true;
  assert.equal(saveWindow(ws, win.id), true);
  assert.equal(win.dirty, false);
  assert.equal(nodeAt(ws.tree, ['me', 'braincode', 'main.ml']).f, 'val x = 1\n');
  // Reopening reads what was saved.
  closeWindow(ws, win.id);
  assert.equal(openSelection(ws, ['me', 'braincode', 'main.ml']).win.text, 'val x = 1\n');
  assert.equal(saveWindow(ws, ws.windows[0].id), false);   // the viewer is not an editor
  assert.equal(saveWindow(ws, 9999), false);
});

test('blocksOf finds the indented body under each header line', () => {
  const src = 'fun a () =\n  let\n    val x = 1\n  in x end\n\nfun b () = 2\n';
  assert.deepEqual(blocksOf(src), [[1, 3]]);
  assert.deepEqual(blocksOf('no indents here\nnor here\n'), []);
  assert.deepEqual(blocksOf('head\n  tail'), [[1, 1]]);
});

test('Contract All reduces the file to headers and arrows; expanding is per block', () => {
  const ws = newWorkspace({ 'x.ml': 'fun a () =\n  1\n  + 2\nfun b () =\n  3\n' });
  const { win } = openSelection(ws, ['me', 'braincode', 'x.ml']);
  assert.equal(contractAll(ws, win.id), 2);
  const rows = visibleLines(win);
  assert.deepEqual(rows.map((r) => (r.arrow ? '→' : r.text)),
    ['fun a () =', '→', 'fun b () =', '→', '']);
  assert.equal(expandAt(ws, win.id, 1), true);
  assert.equal(expandAt(ws, win.id, 1), false);
  assert.equal(visibleLines(win).length, 6);   // one block back, one still folded
  assert.equal(expandAll(ws, win.id), 1);
  assert.equal(visibleLines(win).every((r) => !r.arrow), true);
  assert.equal(contractAll(ws, ws.windows[0].id), 0);   // not an editor
  assert.equal(expandAll(ws, 9999), 0);
  assert.equal(expandAt(ws, 9999, 0), false);
});

test('a folded main.ml fits a screen', () => {
  const ws = newWorkspace(files());
  const { win } = openSelection(ws, ['me', 'braincode', 'main.ml']);
  const full = visibleLines(win).length;
  contractAll(ws, win.id);
  const folded = visibleLines(win).length;
  assert.ok(folded < full, 'folding shortens the file');
  assert.ok(folded <= 40, `folded to ${folded} lines`);
});

// ---- Mail, the Recycler, and the files that used to be empty ----------------

// The shape nokia.js actually pushes: `th` is who you are talking to, `from`
// is 'you' or 'them'.
const LOG = [
  { th: 'CALYPSO', from: 'them', text: 'You are awake. Keep to the light.', at: '09:00' },
  { th: 'CALYPSO', from: 'you', text: 'Where are you?', at: '09:02' },
  { th: 'RON', from: 'them', text: 'POSEIDON completes in 18 hours.', at: '15:00' },
];

test('the mailbox is the handset log, hers and yours told apart', () => {
  const box = mailboxFrom(LOG);
  assert.equal(box.length, 3);
  assert.equal(box[0].n, 1);
  assert.equal(box[0].mine, false);
  assert.equal(box[1].mine, true, "a from:'you' entry is the player's own reply");
  assert.equal(box[1].from, 'me');
  assert.equal(box[0].from, 'CALYPSO');
  assert.equal(box[0].to, 'me');
  assert.equal(box[1].to, 'CALYPSO');
  assert.equal(box[2].from, 'RON', 'the other correspondent is not folded into hers');
  assert.equal(box[0].at, '09:00');
  assert.ok(box[0].subject.length, 'every message carries a subject line');
  assert.ok(box[0].body.includes('Keep to the light'));
});

test('an empty log gives an empty mailbox rather than throwing', () => {
  assert.deepEqual(mailboxFrom([]), []);
  assert.deepEqual(mailboxFrom(), []);
});

test('Mail, Info and the Recycler open once and are raised thereafter', () => {
  for (const open of [openMail, openAbout, openRecycler]) {
    const ws = newWorkspace(files());
    const a = open(ws);
    const b = open(ws);
    assert.equal(a.id, b.id, 'a second launch raises the window it already has');
    // The desktop comes up with the FileViewer already open, so one panel is two.
    assert.equal(ws.windows.length, 2);
  }
});

test('the Recycler is a real bin: things go in, and emptying takes them out', () => {
  const ws = newWorkspace(files());
  const name = recycle(ws, ['me', 'guest.log']);
  assert.equal(name, 'guest.log');
  assert.equal(ws.bin.length, 1);
  assert.equal(ws.bin[0].from, 'me');
  assert.equal(nodeAt(ws.tree, ['me', name]), null, 'and it leaves the tree');
  assert.equal(emptyRecycler(ws), 1);
  assert.deepEqual(ws.bin, []);
});

test('binning something that is not there changes nothing', () => {
  const ws = newWorkspace(files());
  assert.equal(recycle(ws, ['me', 'no-such-file']), null);
  assert.equal(recycle(ws, []), null);
  assert.equal(emptyRecycler(ws), 0);
});

test('no bookshelf or app bundle opens onto an empty window', () => {
  const ws = newWorkspace(files());
  const shelves = listing(nodeAt(ws.tree, ['Library', 'Bookshelves']));
  const apps = listing(nodeAt(ws.tree, ['Apps']));
  assert.ok(shelves.length >= 4);
  assert.ok(apps.length >= 6);
  for (const [where, names] of [[['Library', 'Bookshelves'], shelves], [['Apps'], apps]]) {
    for (const { name: n } of names) {
      const node = nodeAt(ws.tree, [...where, n]);
      assert.ok(node && typeof node.f === 'string', `${n} has contents`);
      assert.ok(node.f.split('\n').length >= 5, `${n} has more than a stub in it`);
    }
  }
});

// ---- Grab, which only ever points one way ----------------------------------

test('Grab is not on the dock: it sits on the desktop floor', () => {
  // It was a dock tile under the calendar first. Moved to the bottom centre of
  // the screen, in the tile a miniaturised window wears and with no name on it,
  // so it reads as something left running and put down (David, 2026-08-14).
  const ws = newWorkspace(files());
  const ids = dockTiles(ws).map((t) => t.id);
  assert.ok(!ids.includes('grab'), 'a dock tile would give it a name and a home');
  assert.ok(ids.includes('calendar') && ids.includes('clock'));
});

test('the roll is one frame behind every message the handset carried', () => {
  const ws = newWorkspace(files());
  ws.mail = LOG;
  ws.date = '2';
  const roll = grabRoll(ws);
  assert.equal(roll.length, LOG.length);
  assert.ok(roll.every((f) => f.mine === false), 'hers, until you take one');
  assert.ok(roll.every((f) => f.subject.startsWith('SUBJECT')));
  // Hourly across the seven years the Ogygia shelf claims for the weather.
  assert.equal(roll[0].n, 2556 * 24 + 1);
  assert.ok(roll.every((f, i) => i === 0 || f.n === roll[i - 1].n + 1), 'no gaps');
});

test('the roll does not churn between draws', () => {
  const ws = newWorkspace(files());
  ws.mail = LOG;
  assert.deepEqual(grabRoll(ws), grabRoll(ws),
    'it is drawn every frame; a wandering subject line would be a flicker');
});

test('a capture you take is marked as yours and lands on the end', () => {
  const ws = newWorkspace(files());
  ws.mail = LOG;
  const before = grabRoll(ws);
  grabCapture(ws, '14:31', 3, 'Lid open.');
  const after = grabRoll(ws);
  assert.equal(after.length, before.length + 1);
  const last = after[after.length - 1];
  assert.equal(last.mine, true);
  assert.equal(last.n, before[before.length - 1].n + 1);
  assert.match(last.subject, /at the machine/);
});

test('the eye aims at the pointer, and rests when there is none', () => {
  const ws = newWorkspace(files());
  assert.deepEqual(grabAim(ws, 100, 100), { x: 0, y: 0 }, 'no pointer, no lean');
  ws.mouse = { x: 300, y: 100 };
  const right = grabAim(ws, 100, 100);
  assert.ok(right.x > 0.9 && Math.abs(right.y) < 0.001, 'pointer right, eye right');
  ws.mouse = { x: 100, y: 300 };
  const down = grabAim(ws, 100, 100);
  assert.ok(down.y > 0.9 && Math.abs(down.x) < 0.001, 'pointer below, eye down');
  ws.mouse = { x: 101, y: 100 };
  assert.ok(grabAim(ws, 100, 100).x < 0.1, 'a pointer almost on the eye barely moves it');
  ws.mouse = { x: 100, y: 100 };
  assert.deepEqual(grabAim(ws, 100, 100), { x: 0, y: 0 }, 'dead centre does not divide by zero');
});

test('Grab and its Info panel open once each', () => {
  const ws = newWorkspace(files());
  assert.equal(openGrab(ws).id, openGrab(ws).id);
  assert.equal(openGrabInfo(ws).id, openGrabInfo(ws).id);
  assert.equal(ws.windows.filter((w) => w.kind === 'grab').length, 1);
  assert.equal(ws.windows.filter((w) => w.kind === 'grabinfo').length, 1);
});

test('the Info panel credits both Keiths and the two systems it ran on', () => {
  const all = GRAB_INFO.join(' ');
  assert.match(all, /Keith Ohlfs/, 'the icon is his and the credit is the point');
  assert.match(all, /Keith Bernstein/);
  assert.match(all, /NeXTSTEP/);
  assert.match(all, /OPENSTEP/);
  // Her machine is a cube. Apple's twenty years of carrying the same drawing
  // are true and belong in the source comment, not on her Info panel.
  assert.doesNotMatch(all, /Mac OS X/);
});

test('the flash runs down to zero and stops there', () => {
  // It used to overshoot to a small negative and stick, and a negative is
  // truthy, so one capture left the icon on the flash frame for good. The
  // flash frame is the centre-pupil drawing, so the eye stopped following.
  const ws = newWorkspace(files());
  assert.equal(grabFlashing(ws), false, 'nothing has fired yet');
  ws.grabFlash = 0.35;
  assert.equal(grabFlashing(ws), true);
  for (let i = 0; i < 60; i++) grabFlashTick(ws, 1 / 60);
  assert.equal(ws.grabFlash, 0, 'exactly zero, not a small negative');
  assert.equal(grabFlashing(ws), false, 'and the bulb is out');
  // Ticking on past the end must not push it below zero either.
  grabFlashTick(ws, 5);
  assert.equal(ws.grabFlash, 0);
  assert.equal(grabFlashing(ws), false);
});

test('a single long frame does not leave the flash stuck on', () => {
  const ws = newWorkspace(files());
  ws.grabFlash = 0.35;
  grabFlashTick(ws, 2.0);            // one very late frame, longer than the flash
  assert.equal(ws.grabFlash, 0);
  assert.equal(grabFlashing(ws), false);
});

test('the flash never reaches the icon as a bare truthiness test', () => {
  // The bug was `!!ws.grabFlash` at the draw site. Nothing may read it that way.
  const ws = newWorkspace(files());
  ws.grabFlash = -0.004;             // the state the old decay left behind
  assert.equal(grabFlashing(ws), false, 'a negative is not a lit bulb');
});
