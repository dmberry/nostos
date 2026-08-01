// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #145 V1a — the Workspace Manager. Design in docs/PLAN.md.
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
  { id: 'grove', label: 'Grove', kind: 'app' },
  { id: 'www', label: 'WorldWideWeb', kind: 'app' },
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
  if (id === 'grove') return ws.windows.some((w) => w.kind === 'grove');
  if (id === 'www') return ws.windows.some((w) => w.kind === 'www');
  const kind = id === 'fileviewer' ? 'viewer' : id;
  return ws.windows.some((w) => w.kind === kind);
}

import { BOOKSHELVES, APPS } from './workspace-library.js';
import { makeLife } from './grove-life.js';

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
export function buildTree(files = {}, rosters = null, track = null, sightings = null) {
  // Her SOURCE lives in a braincode/ folder — it is her braincode, the same
  // name the towers and the factory wear for theirs (David, 2026-08-13). The
  // memos and the guest log are not code and stay at home.
  const home = {};
  const brain = {};
  for (const [name, text] of Object.entries(files)) {
    (/\.ml$/i.test(name) ? brain : home)[name] = file(String(text));
  }
  if (Object.keys(brain).length) home.braincode = dir(brain);
  // #162 — HER COPY OF THE NETWORK'S BOOKKEEPING. Every tower writes a garrison
  // roster; she is the island's mind and the towers are her network, so the
  // rosters are already on her machine before you ever jack into one (David,
  // 2026-08-14: "after all she is monitoring everything").
  //
  // It is the same bytes the tower serves, so a player who reads a roster at an
  // obelisk and then finds the identical file sitting in a folder on her desktop
  // learns something the game never says out loud. Nothing here is a summary or
  // a redaction: she has it exactly as written.
  const net = {};
  for (const [code, text] of Object.entries(rosters || {})) {
    if (text) net[`${code}.garrison`] = file(String(text));
  }
  // #164 — and the correlated track of YOU, filed beside her inventory of the
  // machines, in the same folder and the same format. She did not watch you: a
  // dozen towers each saw a sliver and she put the slivers in order. The file
  // is the collation, which is the only place the route exists.
  for (const [code, text] of Object.entries(sightings || {})) {
    if (text) net[`${code}.sightings`] = file(String(text));
  }
  if (track) net['sightings.track'] = file(String(track));
  return dir({
    me: dir(home),
    ...(Object.keys(net).length ? { net: dir(net) } : {}),
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
  const tree = buildTree(files, opts.rosters, opts.track, opts.sightings);
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
  // NOTHING OPENS UNDER THE MENU. The menu is a vertical strip down the left,
  // so a window placed at x=120 comes up beneath it and the player has to drag
  // it out before they can read it (David, 2026-08-14). Preferences and Mail
  // had this too, so the clamp lives here rather than at each call site — the
  // constraint belongs to the desktop, not to whoever is opening a window.
  //
  // A window may still be DRAGGED under the menu afterwards; that is the
  // player's business. This only governs where one arrives.
  if (win.x < MENU_EDGE) win.x = MENU_EDGE;
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
    // Nothing marked, nothing to link: the row is there and greyed, so the pair
    // reads as a pair before you have used either half.
    case 'mark': return !!ws.wwwMark;
    default: return true;
  }
}

/**
 * The rows of a submenu, with `Windows` filled in from the live window list.
 * `path` is the chain of labels already open; `[]` gives the top menu.
 */
// WorldWideWeb's own menus, with the names they had. On NeXTSTEP the main menu
// belonged to the ACTIVE APPLICATION, so this is not an extra menu bolted to the
// workspace — it is the workspace menu doing what it did when another app came
// to the front. It appears only while a WorldWideWeb window is frontmost.
export const WWW_MENU = { label: 'WorldWideWeb', sub: [
  { label: 'Info Panel…' },
  { label: 'Open from full document reference', key: 'o' },
  { label: 'Mark all', key: 'A' },
  { label: 'Link to marked', key: 'l', need: 'mark' },
  { label: 'Home' },
  { label: 'Close', key: 'w' },
] };

export function menuRows(ws, path = []) {
  let rows = frontWWW(ws) ? [WWW_MENU, ...WORKSPACE_MENU] : WORKSPACE_MENU;
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

// ---- Grab ------------------------------------------------------------------
//
// The real NeXTSTEP Grab (Keith Bernstein, art by Keith Ohlfs) put a camera on
// the dock with an eye where the flash should be, and the eye moved. On her
// machine it is not a screenshot tool. The UNIX Manual bookshelf already says
// what it is, in her own annotation: "Note the absence of a page for anything
// that reports. There was no daemon in this system that told anyone where you
// were. That had to be added later, by somebody, on purpose." This is that.
//
// The roll is hourly and unbroken across the seven years, which is the same
// span the Ogygia shelf claims for the weather records. The run's own frames
// are the tail of it.

const GRAB_BASE = 2556 * 24;   // seven years, one frame an hour, no gaps

// Stable per-frame variation without Math.random (banned in this tree anyway).
function grabHash(s) {
  let h = 11;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  return h;
}

// What the camera wrote down, as against what she then said about it. Mail is
// her words; this is the frame behind them.
const GRAB_SUBJECTS = [
  'SUBJECT standing. Facing the water.',
  'SUBJECT walking, east to west. Unhurried.',
  'SUBJECT seated. Head down.',
  'SUBJECT asleep. Breathing regular.',
  'SUBJECT at the treeline. Stopped.',
  'SUBJECT looking up. Toward this window.',
  'SUBJECT still. Four minutes, same posture.',
  'SUBJECT out of frame. Recaptured 40s later.',
];

/**
 * The roll: her frames, one behind every message the handset carried, plus the
 * ones taken from this machine during the run. `log` is player.nokiaLog.
 */
export function grabRoll(ws) {
  const log = ws.mail || [];
  const hers = log.map((m, i) => ({
    n: GRAB_BASE + i + 1,
    at: m.at || '',
    day: ws.date || '?',
    by: m.th || 'CALYPSO',
    mine: false,
    subject: GRAB_SUBJECTS[grabHash(String(m.text || '') + i) % GRAB_SUBJECTS.length],
  }));
  return hers.concat(ws.grabMine || []);
}

export function openGrab(ws) {
  const had = ws.windows.find((w) => w.kind === 'grab');
  if (had) { restore(ws, had.id); raise(ws, had.id); return had; }
  return openWindow(ws, newWindow('grab', 'Grab', 150, 120, 470, 340, { sel: -1, top: 0 }));
}

/**
 * A capture taken from this machine, by you. It only ever points one way: the
 * subject of every frame this app has ever held is the person reading it.
 */
export function grabCapture(ws, at, day, where, timed = false) {
  ws.grabMine = ws.grabMine || [];
  const roll = grabRoll(ws);
  ws.grabMine.push({
    n: (roll.length ? roll[roll.length - 1].n : GRAB_BASE) + 1,
    at: at || '', day: String(day || '?'), by: 'this console', mine: true, timed,
    subject: where ? `SUBJECT at the machine. ${where}` : 'SUBJECT at the machine.',
  });
  return ws.grabMine[ws.grabMine.length - 1];
}

/**
 * Grab's Info panel, which is a real credit rather than a piece of the fiction.
 * The camera with an eye where the flash should be is Keith Ohlfs' drawing, and
 * the application under it was Keith Bernstein's. The same art was still being
 * shipped by Apple two decades later, in Grab.app on Mac OS X, which is how most
 * people who have seen it have seen it. Ohlfs died in 2016.
 *
 * Precedent for a real credit inside her machine: Project Gutenberg is credited
 * in the game's own About panel already. Kept to a name, an author and the
 * systems it ran on, which is what a NeXT Info panel held (David, 2026-08-14).
 */
export const GRAB_INFO = [
  'Grab 0.8',
  '',
  'Keith Bernstein',
  'Icon by Keith Ohlfs',
  '',
  'NeXTSTEP \u00b7 OPENSTEP',
];

export function openGrabInfo(ws) {
  const had = ws.windows.find((w) => w.kind === 'grabinfo');
  if (had) { restore(ws, had.id); raise(ws, had.id); return had; }
  return openWindow(ws, newWindow('grabinfo', 'Grab Info', 250, 150, 330, 160));
}

/**
 * Run the flash down. It lives here rather than in the hub so a test can reach
 * it: `if (ws.grabFlash > 0) ws.grabFlash -= dt` overshot to a small negative
 * on the frame it crossed zero, the guard then stopped decrementing it, and
 * `!!ws.grabFlash` is true for a negative. One capture and the icon was stuck
 * on the flash frame for the rest of the run, which is the centre-pupil
 * drawing, so the eye stopped following the pointer (David, 2026-08-14).
 */
export function grabFlashTick(ws, dt) {
  ws.grabFlash = Math.max(0, (ws.grabFlash || 0) - dt);
  return ws.grabFlash;
}

/** Is the bulb lit this frame? A predicate, not a truthiness test. */
export function grabFlashing(ws) {
  return (ws.grabFlash || 0) > 0;
}

/** Where the pupil looks: a unit-ish offset from an eye centre toward the pointer. */
export function grabAim(ws, cx, cy, reach = 1) {
  const m = ws.mouse;
  if (!m) return { x: 0, y: 0 };
  const dx = m.x - cx, dy = m.y - cy;
  const d = Math.hypot(dx, dy);
  if (d < 0.001) return { x: 0, y: 0 };
  // Saturates: past a short distance the eye is simply looking that way.
  const k = Math.min(1, d / 60) * reach;
  return { x: (dx / d) * k, y: (dy / d) * k };
}

export function openMail(ws) {
  const had = ws.windows.find((w) => w.kind === 'mail');
  if (had) { restore(ws, had.id); raise(ws, had.id); return had; }
  return openWindow(ws, newWindow('mail', 'Active.mbox', 120, 100, 480, 330, { sel: 0 }));
}

// ---- WHAT THE THING IN THE WINDOW ACTUALLY IS -------------------------------
//
// David, 2026-08-16: "give it an info box for people to read about what it is -
// e.g. conways game of life", and the same for the draughts cabinet, "citing
// earlier versions".
//
// Both of these windows run a real piece of computing history and neither of
// them says so. A player watching cells blink on a green grid has no way to
// know they are looking at Conway, and a player losing at draughts to a machine
// has no way to know that this particular machine is the oldest argument in the
// field. The panels are the citation, in the register the rest of this desktop
// uses: what it is, who made it, when, and what happened.
//
// EVERYTHING IN THEM IS TRUE. No page invents a date or a result.

export const APP_INFO = {
  grove: [
    "Conway's Game of Life",
    'John Horton Conway, 1970',
    '',
    'A cellular automaton on a square grid. Every cell is',
    'alive or dead, and each step it looks at its eight',
    'neighbours: a live cell with two or three of them lives',
    'on, any other live cell dies, and a dead cell with',
    'exactly three comes alive. That is the whole rule.',
    '',
    'It has no player and no goal. Conway designed it to',
    'settle a question of von Neumann’s — whether a very',
    'simple set of local rules could support patterns that',
    'copy themselves — and the answer turned out to be yes.',
    'Life is Turing complete: anything a computer can be made',
    'to do, some arrangement of these cells will do.',
    '',
    'It reached the public through Martin Gardner’s column in',
    'Scientific American in October 1970, and a very large',
    'number of people learnt what a computer was by typing it',
    'in. Conway said afterwards that he had come to dislike',
    'how completely it overshadowed his other work.',
    '',
    'The board here is seeded from the word written in her',
    'floor. It is a MODEL of the grove and not a view of it:',
    'nothing in this window samples the real clearing.',
  ],
  draughts: [
    'Draughts, and the machines that play it',
    '',
    'Checkers is where machine learning starts. Arthur Samuel',
    'at IBM wrote a program for the 701 in 1952 that improved',
    'by playing against itself and keeping what worked, and in',
    'the 1959 paper describing it he used the phrase "machine',
    'learning" for what it did. It beat a strong amateur on',
    'television in 1956 and made the field look possible.',
    '',
    'Christopher Strachey had got there first with a draughts',
    'program on the Ferranti Mark I in 1951, which is one of',
    'the earliest games ever written for a computer, and Alan',
    'Turing’s chess work of the same period was played out by',
    'hand because no machine would run it.',
    '',
    'The end of the story is Chinook, at the University of',
    'Alberta under Jonathan Schaeffer. It played Marion',
    'Tinsley — who lost a handful of games in forty years —',
    'through the 1990s, and in 2007 the team announced that',
    'checkers was SOLVED: with perfect play by both sides the',
    'game is a draw, proved by search rather than argued.',
    '',
    'The cabinet in this window is none of those. It is a few',
    'hundred lines with a shallow search, and it will lose to',
    'anyone who has read a book about the game.',
  ],
};

/**
 * A panel about the program in the window: what it is and where it came from.
 *
 * One window kind for every app, keyed by `topic` into APP_INFO, so a new
 * panel is a new entry in that table and nothing else.
 */
export function openAppInfo(ws, topic, title) {
  const had = ws.windows.find((w) => w.kind === 'appinfo' && w.topic === topic);
  if (had) { restore(ws, had.id); raise(ws, had.id); return had; }
  const lines = APP_INFO[topic] || ['No information.'];
  const h = Math.min(420, 40 + lines.length * 14 + 24);
  const win = newWindow('appinfo', title || 'Info', MENU_EDGE + 70, 90, 380, h, { topic, scroll: 0 });
  win.topic = topic;
  return openWindow(ws, win);
}

// ---- the desk accessories (#203) --------------------------------------------
//
// Two applications that do nothing the game needs. A desktop carrying only the
// tools a puzzle requires is a set dressed for a scene; a machine somebody used
// has a clock on it and a calculator with a number left in the memory.
//
// The clock reads the island's hour, so it agrees with the sky outside the
// window the laptop is sitting under. The calculator is four functions and a
// display, and its state lives on the window like the grove's board does.

export function openClock(ws) {
  const had = ws.windows.find((w) => w.kind === 'clock');
  if (had) { restore(ws, had.id); raise(ws, had.id); return had; }
  return openWindow(ws, newWindow('clock', 'Clock', MENU_EDGE + 40, 300, 150, 176));
}

export function openCalc(ws) {
  const had = ws.windows.find((w) => w.kind === 'calc');
  if (had) { restore(ws, had.id); raise(ws, had.id); return had; }
  return openWindow(ws, newWindow('calc', 'Calculator', MENU_EDGE + 210, 300, 176, 232, {
    // `shown` is what the display reads; `acc` and `op` are the pending sum.
    shown: '0', acc: null, op: null, fresh: true, mem: 0,
  }));
}

/**
 * One key on the calculator. Pure in the window's own state: digits and a dot
 * build `shown`, an operator banks it, `=` finishes, and C clears.
 *
 * FOURTEEN DIGITS AND THEN IT SAYS SO. A display that silently rounds hands you
 * a wrong number that looks right, which is the one thing a calculator must not
 * do; this one prints `-- too long --` and keeps the accumulator.
 */
export function calcKey(w, key) {
  if (!w) return;
  const D = 14;
  const val = () => Number(w.shown) || 0;
  const put = (n) => {
    const s = String(n);
    w.shown = s.length > D ? '-- too long --' : s;
    w.fresh = true;
  };
  if (/^[0-9]$/.test(key)) {
    w.shown = (w.fresh || w.shown === '0') ? key : (w.shown + key).slice(0, D);
    w.fresh = false;
    return;
  }
  if (key === '.') {
    if (w.fresh) { w.shown = '0.'; w.fresh = false; return; }
    if (!w.shown.includes('.')) w.shown += '.';
    return;
  }
  if (key === 'C') { w.shown = '0'; w.acc = null; w.op = null; w.fresh = true; return; }
  if (key === '±') { w.shown = String(-val()); w.fresh = false; return; }
  if (key === 'M+') { w.mem = (w.mem || 0) + val(); w.fresh = true; return; }
  if (key === 'MR') { put(w.mem || 0); return; }
  if (['+', '-', '×', '÷', '='].includes(key)) {
    const rhs = val();
    let out = rhs;
    if (w.op != null && w.acc != null) {
      if (w.op === '+') out = w.acc + rhs;
      else if (w.op === '-') out = w.acc - rhs;
      else if (w.op === '×') out = w.acc * rhs;
      else if (w.op === '÷') out = rhs === 0 ? NaN : w.acc / rhs;
    }
    if (Number.isNaN(out)) { w.shown = 'cannot divide by 0'; w.acc = null; w.op = null; w.fresh = true; return; }
    // Trim float noise before it reaches the display: 0.1 + 0.2 is 0.3 on a
    // desk calculator and always was.
    out = Math.round(out * 1e10) / 1e10;
    put(out);
    w.acc = key === '=' ? null : out;
    w.op = key === '=' ? null : key;
    return;
  }
}

/** The clock's hands, as angles. Pure: an hour in, three angles out. */
export function clockHands(hour24, minute = 0) {
  const h = ((Number(hour24) || 0) % 12) + (Number(minute) || 0) / 60;
  const m = Number(minute) || 0;
  return {
    hour: (h / 12) * Math.PI * 2 - Math.PI / 2,
    minute: (m / 60) * Math.PI * 2 - Math.PI / 2,
    // Which half of the day, for the little window under the face.
    pm: ((Number(hour24) || 0) % 24) >= 12,
  };
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
/**
 * #165 — Grove.app. An emulation of her floor, not a view of it: nothing here
 * samples the grove, and the window says so on its own status line.
 *
 * The board is built on open and lives on the window, so closing it and opening
 * it again starts the model over from the word — which is right, because it was
 * never a recording of anything.
 */
export function openGrove(ws, word = 'STAY') {
  const had = ws.windows.find((w) => w.kind === 'grove');
  if (had) { restore(ws, had.id); raise(ws, had.id); return had; }
  const win = newWindow('grove', 'Grove', MENU_EDGE + 30, 120, 400, 250, {
    life: makeLife(word), t: 0,
  });
  return openWindow(ws, win);
}

/**
 * WorldWideWeb. EVERY DOCUMENT GETS ITS OWN WINDOW — that is not a flourish,
 * it is how the application worked, and it is why it has no Back button: you
 * close a window rather than going back through one.
 *
 * So this does NOT reuse an existing window the way the other apps do. Opening
 * a link opens a window; opening ten links leaves ten windows on her desktop,
 * cascaded so the titles stay readable.
 */
export function openWWW(ws, title, html, addr) {
  const n = ws.windows.filter((w) => w.kind === 'www').length;
  const off = Math.min(n, 8) * 18;      // cascade, then stop walking off the screen
  // MENU_EDGE, not an arbitrary margin: the menu is a vertical strip down the
  // left, and a window opened at x=90 came up underneath it (David, 2026-08-14
  // — "don't open windows UNDER the menubar").
  return openWindow(ws, newWindow('www', title || 'WorldWideWeb', MENU_EDGE + off, 40 + off, 560, 400, {
    doc: html, addr: addr || '', laid: null, top: 0, lastClick: 0,
  }));
}

/**
 * The Open panel. A window rather than a modal, because on NeXTSTEP it was one:
 * you could leave it open beside the document while you typed the next
 * reference, and it did not stop the rest of the machine.
 */
export function openWWWOpen(ws) {
  const had = ws.windows.find((w) => w.kind === 'wwwopen');
  if (had) { restore(ws, had.id); raise(ws, had.id); return had; }
  return openWindow(ws, newWindow('wwwopen', 'Open Document', MENU_EDGE + 40, 150, 380, 120, {
    ref: '', caret: true, err: '',
  }));
}

/** The Info panel — where the application says what it is. */
export function openWWWInfo(ws) {
  const had = ws.windows.find((w) => w.kind === 'wwwinfo');
  if (had) { restore(ws, had.id); raise(ws, had.id); return had; }
  return openWindow(ws, newWindow('wwwinfo', 'Info', MENU_EDGE + 60, 90, 430, 300));
}

/** The frontmost WorldWideWeb document window, or null. */
export function frontWWW(ws) {
  for (let i = ws.order.length - 1; i >= 0; i--) {
    const w = windowById(ws, ws.order[i]);
    if (w && w.kind === 'www' && !w.mini) return w;
  }
  return null;
}

/**
 * Mark all — the editor's clipboard for HYPERTEXT rather than for text. It
 * holds one document, and it holds it until you make a link out of it or mark
 * something else.
 */
export function wwwMarkAll(ws) {
  const w = frontWWW(ws);
  if (!w) return null;
  ws.wwwMark = { title: w.title, addr: w.addr };
  return ws.wwwMark;
}

/**
 * Link to marked — writes the marked document into the one in front of you.
 *
 * The edit is kept on the workspace under the document's own address, so the
 * link is still there when the window is closed and the document opened again.
 * A link you made that vanished when you closed the window would be a note, not
 * a link.
 */
export function wwwLinkToMarked(ws, linkInto) {
  const w = frontWWW(ws);
  if (!w || !ws.wwwMark) return null;
  if (ws.wwwMark.addr && w.addr && ws.wwwMark.addr === w.addr) return { self: true };
  const next = linkInto(w.doc, ws.wwwMark);
  if (next === w.doc) return { already: true };
  w.doc = next;
  w.laid = null;                       // the layout is stale; _wsWWW rebuilds it
  ws.wwwEdits = ws.wwwEdits || {};
  if (w.addr) ws.wwwEdits[w.addr] = next;
  return { linked: ws.wwwMark, into: w.addr };
}

/** A document with the player's own links in it, if they have made any here. */
export function wwwDocFor(ws, addr, fresh) {
  const kept = ws.wwwEdits && addr ? ws.wwwEdits[addr] : null;
  return kept || fresh;
}

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
