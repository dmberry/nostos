// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #145 V1a — the Workspace Manager. Design in docs/workspace-plan.md.
//
// Her machine is a NeXT running Mach, and until now the only way into it has
// been a typed console, which is the estate's idiom rather than hers. This
// module is the state behind a desktop: windows with a z-order, a vertical menu
// whose submenus tear off, a shelf, and a column browser over her own source.
//
// It is pure. Nothing here touches a canvas or the DOM, so the window
// arithmetic, the menu tree and the browser paths are all testable in node.
// The renderer reads this state and draws it; main.js turns clicks into calls.

/** The desktop's own furniture, in pixels. The renderer draws to these. */
export const MENU_W = 148;
export const MENU_EDGE = MENU_W + 28;   // where a window can start without hiding the menu
export const DOCK_W = 60;

/**
 * Keep every window on the desktop: no wider than the space between the menu's
 * column and the dock, and no further right than its own close box. A canvas
 * that changes size under a window must not take its controls away.
 */
export function fitWindows(ws, W, H) {
  const maxW = Math.max(200, W - DOCK_W - 12);
  const maxH = Math.max(140, H - 12);
  for (const w of ws.windows) {
    w.w = Math.min(w.w, maxW);
    w.h = Math.min(w.h, maxH);
    w.x = Math.max(4, Math.min(W - DOCK_W - w.w - 4, w.x));
    w.y = Math.max(4, Math.min(H - w.h - 4, w.y));
  }
  return ws;
}

/** The two fixed dock positions. Everything between them is the user's. */
export const DOCK_TOP = 'workspace';
export const DOCK_FOOT = 'recycler';

/**
 * The dock. The cube is fixed at the top and the recycler at the foot; the
 * middle is the user's. Two tiles are live rather than launchers: the clock and
 * the calendar read the island's own time, so day and night are visible from
 * inside the Workspace without opening a window.
 *
 * Draughts is here because her board is an APPLICATION on her machine, launched
 * like any other, rather than a thing the console conjures.
 */
export const DOCK_APPS = [
  { id: 'workspace', label: 'Workspace', kind: 'app', fixed: 'top' },
  { id: 'clock', label: '', kind: 'clock' },
  { id: 'calendar', label: '', kind: 'calendar' },
  { id: 'fileviewer', label: 'Files', kind: 'app' },
  { id: 'edit', label: 'Edit', kind: 'app' },
  { id: 'terminal', label: 'Terminal', kind: 'app' },
  { id: 'mail', label: 'Mail', kind: 'app' },
  { id: 'draughts', label: 'Draughts', kind: 'app' },
  { id: 'recycler', label: 'Recycler', kind: 'recycler', fixed: 'foot' },
];

/**
 * The dock as drawn: the same tiles, with the live ones carrying their reading
 * and each app knowing whether it is running (no dots) or not (three dots).
 */
export function dockTiles(ws) {
  return DOCK_APPS.map((t) => {
    if (t.kind === 'clock') return { ...t, label: ws.clock || '--:--' };
    if (t.kind === 'calendar') return { ...t, label: ws.date || '--' };
    return { ...t, running: appRunning(ws, t.id) };
  });
}

/** Three dots under a dock icon means the app is not running. */
export function appRunning(ws, id) {
  if (id === 'workspace' || id === 'recycler') return true;
  if (id === 'terminal') return !!ws.terminalUp;
  if (id === 'draughts') return !!ws.draughtsUp;
  const kind = id === 'fileviewer' ? 'viewer' : id;
  return ws.windows.some((w) => w.kind === kind);
}

import { BOOKSHELVES, APPS } from './workspace-library.js';

// ---- the filesystem ---------------------------------------------------------
//
// Her flat file map becomes a tree, because a column browser over five names in
// one column is not a browser. The shape is NeXTSTEP's: an app directory, a
// library with the bookshelves in it, and a home whose icon is a house.

/** A directory node. `d` holds children; a file node holds `f` (its text). */
const dir = (d) => ({ d });
const file = (f) => ({ f });

/**
 * Build the tree her Workspace browses.
 * `files` is the flat {name: text} map from calypsoFiles().
 */
export function buildTree(files = {}) {
  // Her SOURCE lives in a braincode/ folder — it is her braincode, the same
  // name the towers and the factory wear for theirs (David, 2026-08-13). The
  // memos and the guest log are not code and stay at home.
  const home = {};
  const brain = {};
  for (const [name, text] of Object.entries(files)) {
    (/\.ml$/i.test(name) ? brain : home)[name] = file(String(text));
  }
  if (Object.keys(brain).length) home.braincode = dir(brain);
  return dir({
    me: dir(home),
    // Both of these were `file('')` and opened onto white. The contents are in
    // workspace-library.js, which keeps the writing out of the model.
    Apps: dir(Object.fromEntries(Object.entries(APPS).map(([n, f]) => [n, file(f)]))),
    Library: dir({
      Bookshelves: dir(Object.fromEntries(
        Object.entries(BOOKSHELVES).map(([n, f]) => [n, file(f)]),
      )),
    }),
  });
}

/** Walk a path array to its node, or null. `[]` is the root. */
export function nodeAt(tree, path = []) {
  let n = tree;
  for (const step of path) {
    if (!n || !n.d || !Object.prototype.hasOwnProperty.call(n.d, step)) return null;
    n = n.d[step];
  }
  return n;
}

export const isDir = (n) => !!(n && n.d);

/** The names in a directory, directories first then files, each alphabetical. */
export function listing(tree, path = []) {
  const n = nodeAt(tree, path);
  if (!isDir(n)) return [];
  const names = Object.keys(n.d);
  const dirs = names.filter((k) => isDir(n.d[k])).sort();
  const rest = names.filter((k) => !isDir(n.d[k])).sort();
  return [...dirs, ...rest].map((name) => ({ name, dir: isDir(n.d[name]) }));
}

/**
 * The browser's columns for a selected path: one column per level, each with
 * the name selected in it. A directory at the end contributes its own column,
 * so selecting a folder scrolls an empty-selection column in from the right.
 */
export function browserColumns(tree, path = []) {
  const cols = [];
  for (let i = 0; i <= path.length; i++) {
    const at = path.slice(0, i);
    const items = listing(tree, at);
    if (!items.length && i > 0) break;
    cols.push({ path: at, items, selected: path[i] ?? null });
  }
  return cols;
}

/** `/me/main.ml` from `['me','main.ml']`. The root is `/`. */
export const pathString = (path = []) => (path.length ? `/${path.join('/')}` : '/');

// ---- windows ----------------------------------------------------------------

let _nextId = 1;

/**
 * A window. Miniaturise box LEFT, close box RIGHT — the reference is emphatic
 * about that and getting it backwards is the one mistake a player would feel
 * without being able to name.
 */
export function newWindow(kind, title, x, y, w, h, extra = {}) {
  return {
    id: _nextId++, kind, title, x, y, w, h,
    mini: false, dirty: false, ...extra,
  };
}

// ---- the boot ---------------------------------------------------------------
//
// Her machine BOOTS into NeXTSTEP rather than presenting a desktop that was
// always there. Mach counts its pages, mounts the disk, starts the window
// server, and then the Workspace comes up. The console the estate's obelisks
// wear is one of the things running on it, not the machine itself.

export const BOOT_LINES = [
  'NeXT ROM Monitor 1.2',
  'Testing memory...  32MB OK',
  'SCSI: sd0 at target 0 — NeXT Optical Disk',
  '',
  'Mach 2.5 kernel  (CALYPSO)',
  'Copyright (c) 1988-1993 NeXT Computer, Inc.',
  'physical memory = 32.00 megabytes',
  'available memory = 28.61 megabytes',
  '/dev/sd0a on / (local, noquota)',
  'starting network daemons: portmap nmserver',
  'starting Window Server',
  'NeXTSTEP 3.3 — logging in as me',
];

/** Milliseconds a boot line stays before the next one prints. */
export const BOOT_STEP_MS = 170;

/**
 * Advance the boot. Returns true while it is still booting, so the caller can
 * skip everything else. A click or a key sets `skip` and it lands at once.
 */
export function bootTick(ws, dt) {
  if (!ws.booting) return false;
  ws.bootT = (ws.bootT || 0) + dt * 1000;
  const want = ws.bootSkip ? BOOT_LINES.length : Math.floor(ws.bootT / BOOT_STEP_MS);
  ws.bootShown = Math.min(BOOT_LINES.length, want);
  if (ws.bootShown >= BOOT_LINES.length && (ws.bootT > BOOT_LINES.length * BOOT_STEP_MS + 400 || ws.bootSkip)) {
    ws.booting = false;
  }
  return ws.booting;
}

export function newWorkspace(files = {}, opts = {}) {
  const tree = buildTree(files);
  const ws = {
    tree,
    windows: [],
    order: [],          // back to front; the last id is the front window
    keyId: null,        // the window taking keystrokes
    menuPath: [],       // which submenu chain is open, e.g. ['View']
    torn: [],           // torn-off submenus: {title, path, x, y}
    shelf: ['me'],      // the house is always first and cannot be removed
    sel: ['me'],        // the browser's selected path
    view: 'browser',    // browser | icon | listing
    clock: opts.clock || '--:--',
    date: opts.date || '--',
    // K4's secret, moved into the menu system: the switch is always visible and
    // greyed until this is true. See prefsRows.
    knowsAuto: !!opts.knowsAuto,
    prefs: {
      section: 'workspace',
      iconView: false, contractOnOpen: false,
      playHerself: false, boardSound: true,
    },
    booting: opts.booted !== true,
    bootT: 0, bootShown: 0, bootSkip: false,
    terminalUp: false,
    draughtsUp: false,
  };
  // Clear of the menu, which lives in the top-left corner and is 148 wide, and
  // clear of the dock down the right edge. The canvas is whatever size the
  // player's window is, so this is measured rather than assumed.
  const W = opts.w || 900, H = opts.h || 620;
  openWindow(ws, newWindow('viewer', 'File Viewer — /me', MENU_EDGE, 44,
    Math.max(280, Math.min(520, W - DOCK_W - MENU_EDGE - 8)),
    Math.max(200, Math.min(340, H - 60))));
  return ws;
}

export function openWindow(ws, win) {
  ws.windows.push(win);
  ws.order.push(win.id);
  ws.keyId = win.id;
  return win;
}

export const windowById = (ws, id) => ws.windows.find((w) => w.id === id) || null;

/** Front-to-back, which is the order a click should be tested in. */
export function windowsFront(ws) {
  return ws.order.slice().reverse().map((id) => windowById(ws, id)).filter(Boolean);
}

/** Back-to-front, which is the order they should be drawn in. */
export function windowsBack(ws) {
  return ws.order.map((id) => windowById(ws, id)).filter(Boolean);
}

export function raise(ws, id) {
  const i = ws.order.indexOf(id);
  if (i < 0) return false;
  ws.order.splice(i, 1);
  ws.order.push(id);
  ws.keyId = id;
  return true;
}

export function closeWindow(ws, id) {
  const i = ws.windows.findIndex((w) => w.id === id);
  if (i < 0) return false;
  ws.windows.splice(i, 1);
  ws.order = ws.order.filter((x) => x !== id);
  if (ws.keyId === id) ws.keyId = ws.order[ws.order.length - 1] ?? null;
  return true;
}

export function miniaturise(ws, id) {
  const w = windowById(ws, id);
  if (!w || w.mini) return false;
  w.mini = true;
  // A miniaturised window is not the key window; the one under it becomes key.
  if (ws.keyId === id) {
    const up = windowsFront(ws).find((x) => !x.mini);
    ws.keyId = up ? up.id : null;
  }
  return true;
}

export function restore(ws, id) {
  const w = windowById(ws, id);
  if (!w || !w.mini) return false;
  w.mini = false;
  raise(ws, id);
  return true;
}

/**
 * Three-state focus, from the guidelines: a window is KEY (it takes the
 * keystrokes), MAIN (it is the app's principal window and keeps a lit title
 * bar while a panel holds the keys), or neither.
 */
/** Panels are the windows that take the keys without taking the title bar. */
export const PANEL_KINDS = ['panel', 'prefs', 'inspector'];
export const isPanel = (w) => !!w && PANEL_KINDS.includes(w.kind);

export function focusOf(ws, id) {
  if (ws.keyId === id) return 'key';
  const key = windowById(ws, ws.keyId);
  const w = windowById(ws, id);
  // Exactly ONE window is main: the frontmost that is not a panel. Lighting
  // every window behind a panel would say they all still take the keys.
  if (isPanel(key) && !isPanel(w)) {
    const front = windowsFront(ws).find((x) => !isPanel(x) && !x.mini);
    return front && front.id === id ? 'main' : 'none';
  }
  return 'none';
}

/** `Arrange in Front`: un-miniaturise nothing, just stack them tidily. */
export function arrangeInFront(ws, step = 22) {
  let n = 0;
  for (const w of windowsBack(ws)) {
    if (w.mini) continue;
    w.x = 176 + n * step;
    w.y = 44 + n * step;
    n++;
  }
  return n;
}

// ---- the shelf --------------------------------------------------------------
//
// The upper-left icon is always home, and there is no way to drag it off. The
// rest is whatever the player put there, which on this island means the files
// they intend to change.

export function shelfAdd(ws, path) {
  const p = Array.isArray(path) ? path.join('/') : String(path);
  if (!p || ws.shelf.includes(p)) return false;
  ws.shelf.push(p);
  return true;
}

export function shelfRemove(ws, path) {
  const p = Array.isArray(path) ? path.join('/') : String(path);
  if (p === 'me') return false;          // the house stays
  const i = ws.shelf.indexOf(p);
  if (i < 0) return false;
  ws.shelf.splice(i, 1);
  return true;
}

// ---- the menu ---------------------------------------------------------------
//
// Figure 13, copied. The key equivalents are part of the artefact rather than
// decoration, so they are in the data and the renderer right-aligns them.
//
// `need` names what a row requires to be usable. A row that cannot be used is
// GREYED, never removed: the menu is a map of the system, not of this instant.

export const WORKSPACE_MENU = [
  { label: 'Info', sub: [
    { label: 'Info Panel…' }, { label: 'Legal…' },
    { label: 'Preferences…' }, { label: 'Help…', key: '?' },
  ] },
  { label: 'File', sub: [
    { label: 'Open', key: 'o', need: 'sel' },
    { label: 'Open as Folder', key: 'O', need: 'seldir' },
    { label: 'New Folder', key: 'n' },
    { label: 'Duplicate', key: 'd', need: 'sel' },
    { label: 'Compress', need: 'sel' },
    { label: 'Destroy', key: 'r', need: 'sel' },
    { label: 'Empty Recycler' },
  ] },
  { label: 'Edit', sub: [
    { label: 'Cut', key: 'x', need: 'sel' }, { label: 'Copy', key: 'c', need: 'sel' },
    { label: 'Paste', key: 'v' }, { label: 'Delete', need: 'sel' },
    { label: 'Select All', key: 'a' },
  ] },
  { label: 'Disk', sub: [
    { label: 'Eject', key: 'e', need: 'disk' }, { label: 'Initialize…', need: 'disk' },
  ] },
  { label: 'View', sub: [
    { label: 'Browser', key: 'B' }, { label: 'Icon', key: 'I' }, { label: 'Listing', key: 'L' },
    { label: 'Sort Icons', need: 'icons' }, { label: 'Clean Up Icons', need: 'icons' },
    { label: 'New Viewer', key: 'N' }, { label: 'Update Viewers', key: 'u' },
  ] },
  { label: 'Tools', sub: [
    { label: 'Inspector…' }, { label: 'Finder', key: 'f' },
    { label: 'Processes…', key: 'P' }, { label: 'Console', key: 'C' },
  ] },
  { label: 'Windows', sub: 'windows' },      // built at open time; see menuRows
  { label: 'Services', sub: [
    { label: 'Define in Webster', key: '=' }, { label: 'Edit', sub: [{ label: 'Open Selection' }] },
    { label: 'Librarian', sub: [{ label: 'Search' }] },
    { label: 'Mail', sub: [{ label: 'Mail Selection' }] },
    { label: 'Project', sub: [{ label: 'Add to Project' }] },
    { label: 'Terminal', sub: [{ label: 'Open Terminal Here' }] },
  ] },
  { label: 'Hide', key: 'h' },
  { label: 'Log Out', key: 'q' },
];

/**
 * The mark beside a window in the Windows menu. The dirty glyph is the SAME
 * one the title bar's close box wears, so the unsaved flag reads identically in
 * both places.
 */
export function windowMark(w) {
  if (w.mini) return '::';
  return w.dirty ? '⊗' : '✕';
}

/** Is a row usable right now? Everything unusable is drawn greyed. */
export function rowEnabled(ws, row) {
  switch (row.need) {
    case 'sel': return ws.sel.length > 0;
    case 'seldir': return isDir(nodeAt(ws.tree, ws.sel));
    case 'icons': return ws.view === 'icon';
    case 'disk': return false;            // she has no removable media
    case 'window': return ws.order.some((id) => !!windowById(ws, id));
    default: return true;
  }
}

/**
 * The rows of a submenu, with `Windows` filled in from the live window list.
 * `path` is the chain of labels already open; `[]` gives the top menu.
 */
export function menuRows(ws, path = []) {
  let rows = WORKSPACE_MENU;
  for (const label of path) {
    const row = rows.find((r) => r.label === label);
    if (!row) return [];
    if (row.sub === 'windows') {
      rows = [
        { label: 'Arrange in Front' },
        ...windowsBack(ws).map((w) => ({ label: `${windowMark(w)} ${w.title}`, winId: w.id })),
        { label: 'Miniaturize Window', key: 'm', need: 'window' },
        { label: 'Close Window', key: 'w', need: 'window' },
      ];
      continue;
    }
    if (!Array.isArray(row.sub)) return [];
    rows = row.sub;
  }
  return rows.map((r) => ({
    label: r.label,
    key: r.key || '',
    sub: r.sub === 'windows' || Array.isArray(r.sub),
    winId: r.winId,
    on: rowEnabled(ws, r),
  }));
}

/** Open a submenu chain. Clicking a top row when it is open closes it again. */
export function menuOpen(ws, path) {
  const same = path.length === ws.menuPath.length && path.every((p, i) => ws.menuPath[i] === p);
  ws.menuPath = same ? path.slice(0, -1) : path.slice();
  return ws.menuPath;
}

/**
 * Tear a submenu off into a floating panel. The reference shows `Tools` torn
 * away, and it is the interaction nothing else has: a menu you can keep.
 */
export function tearOff(ws, path, x, y) {
  const label = path[path.length - 1];
  if (!label || ws.torn.some((t) => t.label === label)) return null;
  const t = { label, path: path.slice(), x, y };
  ws.torn.push(t);
  ws.menuPath = [];
  return t;
}

export function tearClose(ws, label) {
  const i = ws.torn.findIndex((t) => t.label === label);
  if (i < 0) return false;
  ws.torn.splice(i, 1);
  return true;
}

// ---- attention panel --------------------------------------------------------
//
// The desktop's own way of saying something, because a world toast is drawn
// behind the Workspace and nobody would see it. Every menu item resolves to
// SOMETHING — an action, or this panel saying it does nothing yet — so nothing
// a player clicks is silent (David, 2026-08-13).

export function notice(ws, title, body = '') {
  ws.notice = { title: String(title), body: String(body) };
  return ws.notice;
}
export function clearNotice(ws) { ws.notice = null; }

// ---- Preferences ------------------------------------------------------------
//
// K4's `auto` used to be a word you typed at the board and nothing on screen
// admitted it existed. On a machine with menus that is the wrong shape: NeXTSTEP
// puts every app's switches behind `Info ▷ Preferences…`, in a panel with an
// icon strip across the top, and the board is an application on this machine
// now. (David, 2026-08-13: "can it be in a preferences menu item?")
//
// The secret survives the move because the menu's own rule carries it: a row
// that cannot be used STAYS, greyed, saying nothing about why. So `Play Herself`
// is visible from the first minute and refuses to explain itself, which is a
// better secret than an invisible one. Conceding twice un-greys it, and so does
// reading what Samuel's 1959 program did — the same two doors as before.

export const PREFS_SECTIONS = [
  { id: 'workspace', label: 'Workspace' },
  { id: 'draughts', label: 'Draughts' },
];

/**
 * The switches in a section. `on` is the current setting, `enabled` says
 * whether it can be touched, and `note` is the line under it.
 */
export function prefsRows(ws, section = ws.prefs.section) {
  const p = ws.prefs;
  if (section === 'draughts') {
    return [
      { id: 'playHerself', label: 'Calypso Self-Learn', on: !!p.playHerself, enabled: true,
        note: 'She takes both chairs and learns from herself, the way Samuel’s 1959 program did.' },
      { id: 'boardSound', label: 'Sound on Capture', on: !!p.boardSound, enabled: true,
        note: 'A tone when a piece comes off the board.' },
    ];
  }
  return [
    { id: 'iconView', label: 'Open New Viewers in Icon View', on: !!p.iconView, enabled: true,
      note: 'Icons rather than a browser.' },
    { id: 'contractOnOpen', label: 'Contract Files on Opening', on: !!p.contractOnOpen, enabled: true,
      note: 'Every block folded, so a long file arrives as its headers.' },
  ];
}

export function togglePref(ws, id) {
  const row = [...prefsRows(ws, 'workspace'), ...prefsRows(ws, 'draughts')].find((r) => r.id === id);
  if (!row || !row.enabled) return false;
  ws.prefs[id] = !ws.prefs[id];
  return true;
}

/** Open (or raise) the Preferences panel. A panel takes the keys; see focusOf. */
export function openPrefs(ws) {
  const had = ws.windows.find((w) => w.kind === 'prefs');
  if (had) { restore(ws, had.id); raise(ws, had.id); return had; }
  return openWindow(ws, newWindow('prefs', 'Preferences', 150, 130, 340, 220));
}

/**
 * Mail.app. Her texts are already kept: every SMS the handset has carried is in
 * `player.nokiaLog` as {th, from, text, at}. A mailbox is the same list read a
 * different way, which is why this takes the log rather than a store of its own.
 * Nothing is duplicated, so the phone and the mailbox cannot disagree.
 *
 * `from: 'them'` is hers, anything else is yours. On her machine, mail she sent
 * is mail you received.
 */
export function mailboxFrom(log = []) {
  return log.map((m, i) => {
    const mine = m.from !== 'them';
    const text = String(m.text || '');
    // The subject line is what a mailer would show: the opening of the message,
    // cut at a sentence if there is one within reach.
    const cut = text.search(/[.?!]\s|$/);
    const subject = text.slice(0, cut > 0 && cut < 46 ? cut + 1 : 46).trim() || '(no subject)';
    return {
      n: i + 1,
      at: m.at || '',
      thread: m.th || 'CALYPSO',
      from: mine ? 'me' : (m.th || 'CALYPSO'),
      to: mine ? (m.th || 'CALYPSO') : 'me',
      mine,
      subject,
      body: text,
    };
  });
}

export function openMail(ws) {
  const had = ws.windows.find((w) => w.kind === 'mail');
  if (had) { restore(ws, had.id); raise(ws, had.id); return had; }
  return openWindow(ws, newWindow('mail', 'Active.mbox', 120, 100, 480, 330, { sel: 0 }));
}

/** The Info panel: what the machine says about itself. */
export function openAbout(ws) {
  const had = ws.windows.find((w) => w.kind === 'about');
  if (had) { restore(ws, had.id); raise(ws, had.id); return had; }
  return openWindow(ws, newWindow('about', 'Info', 210, 170, 330, 190));
}

/**
 * The Recycler, which is a real bin: Destroy and Delete put things in it and
 * Empty Recycler takes them out again. It was a notice saying it was empty,
 * which was true and also all it could ever be.
 */
export function openRecycler(ws) {
  const had = ws.windows.find((w) => w.kind === 'recycler');
  if (had) { restore(ws, had.id); raise(ws, had.id); return had; }
  return openWindow(ws, newWindow('recycler', 'Recycler', 240, 210, 300, 200));
}

/** Move the selected node into the bin. Returns its name, or null. */
export function recycle(ws, path = ws.sel) {
  if (!path || !path.length) return null;
  const parent = nodeAt(ws.tree, path.slice(0, -1));
  const name = path[path.length - 1];
  if (!parent || !parent.d || !parent.d[name]) return null;
  ws.bin = ws.bin || [];
  ws.bin.push({ name, node: parent.d[name], from: path.slice(0, -1).join('/') });
  delete parent.d[name];
  ws.sel = path.slice(0, -1);
  return name;
}

/** Empty it. Returns how many went. */
export function emptyRecycler(ws) {
  const n = (ws.bin || []).length;
  ws.bin = [];
  return n;
}

// ---- opening things ---------------------------------------------------------

/**
 * Double-clicking in the browser. A directory moves the selection; a file opens
 * in Edit, in its own window, with the title Edit wears in the reference:
 * name, language mode, directory.
 */
export function openSelection(ws, path = ws.sel) {
  const n = nodeAt(ws.tree, path);
  if (!n) return null;
  if (isDir(n)) { ws.sel = path.slice(); return { kind: 'dir', path: ws.sel }; }
  const name = path[path.length - 1];
  const already = ws.windows.find((w) => w.kind === 'edit' && w.file === pathString(path));
  if (already) { restore(ws, already.id); raise(ws, already.id); return { kind: 'raise', win: already }; }
  const win = newWindow('edit', editTitle(name, path), 90, 100, 460, 280, {
    file: pathString(path),
    text: String(n.f || ''),
    folded: [],
  });
  openWindow(ws, win);
  // Preferences → Workspace → Contract Files on Opening. A 1704-byte main.ml
  // arrives as its headers, which is the only way to see its shape at once.
  if (ws.prefs && ws.prefs.contractOnOpen) win.folded = blocksOf(win.text);
  return { kind: 'edit', win };
}

/** `main.ml - ML - ~/` — filename, language mode, directory. */
export function editTitle(name, path = []) {
  const ext = /\.([a-z]+)$/i.exec(name);
  const mode = { ml: 'ML', log: 'Log', txt: 'Text', ck: 'Data' }[(ext && ext[1].toLowerCase())] || 'Text';
  const home = path[0] === 'me' ? '~' : '';
  const where = path.length > 2 ? `${home}/${path.slice(1, -1).join('/')}` : `${home}/`;
  return `${name} - ${mode} - ${where}`;
}

/** Save an Edit window back into the tree, which is what clears its dirty flag. */
export function saveWindow(ws, id) {
  const w = windowById(ws, id);
  if (!w || w.kind !== 'edit') return false;
  const path = w.file.replace(/^\//, '').split('/');
  const parent = nodeAt(ws.tree, path.slice(0, -1));
  if (!isDir(parent)) return false;
  parent.d[path[path.length - 1]] = file(w.text);
  w.dirty = false;
  return true;
}

// ---- Edit's structure folding ----------------------------------------------
//
// Contract All reduces every top-level block to its header and a white arrow,
// which is how a player gets the shape of a 1704-byte main.ml onto one screen.
// A fold is recorded as [firstHiddenLine, lastHiddenLine] over the ORIGINAL
// line numbering, so expanding one never disturbs the others.

/**
 * The top-level blocks of an ML file: a line that opens more braces or `let`s
 * than it closes starts one, and the fold runs to the line that balances it.
 * Blank-line-separated paragraphs are the fallback, because her source uses
 * indentation more than it uses braces.
 */
export function blocksOf(text) {
  const lines = String(text).split('\n');
  const out = [];
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const indented = /^\s+\S/.test(lines[i]);
    if (indented && start < 0) start = i;
    if (!indented && start >= 0) { out.push([start, i - 1]); start = -1; }
  }
  if (start >= 0) out.push([start, lines.length - 1]);
  return out.filter(([a, b]) => b >= a);
}

export function contractAll(ws, id) {
  const w = windowById(ws, id);
  if (!w || w.kind !== 'edit') return 0;
  w.folded = blocksOf(w.text);
  return w.folded.length;
}

export function expandAll(ws, id) {
  const w = windowById(ws, id);
  if (!w || w.kind !== 'edit') return 0;
  const n = w.folded.length;
  w.folded = [];
  return n;
}

/** Clicking a white arrow: drop the fold that starts at this line. */
export function expandAt(ws, id, line) {
  const w = windowById(ws, id);
  if (!w || w.kind !== 'edit') return false;
  const i = w.folded.findIndex(([a]) => a === line);
  if (i < 0) return false;
  w.folded.splice(i, 1);
  return true;
}

/**
 * What the editor actually shows: each line, or an arrow standing for a folded
 * block. `arrow` rows carry the original line number so a click can expand them.
 */
export function visibleLines(w) {
  const lines = String(w.text || '').split('\n');
  const folds = (w.folded || []).slice().sort((a, b) => a[0] - b[0]);
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const f = folds.find(([a]) => a === i);
    if (f) { out.push({ arrow: true, line: i }); i = f[1] + 1; continue; }
    out.push({ arrow: false, line: i, text: lines[i] });
    i++;
  }
  return out;
}
