// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// WORLDWIDEWEB — the first browser, on the machine it was written for.
//
// Tim Berners-Lee wrote WorldWideWeb on a NeXT cube in 1990. CALYPSO IS a NeXT
// cube (#150), so the application belongs on her desktop in a way nothing else
// in the game does: this is not a period reference, it is the right software on
// the right hardware.
//
// It is also the second browser in the game, and the interesting half is how
// little it agrees with the first. Netscape on the NostBook has an address bar,
// a Back button and one window. This has none of those, because none of them
// had been invented:
//
//   - NO ADDRESS BAR. You reach a document through Document → Open from full
//     document reference, type the URL into a panel, and press Open.
//   - DOUBLE-CLICK TO FOLLOW. A single click put the caret in the text, because
//     the thing was a browser AND an editor and editing was the default.
//   - EVERY LINK OPENS A NEW WINDOW. There is no Back because there is nothing
//     to go back from; you close windows instead.
//
// Both browsers read the same archive. A page the NostBook shows in Netscape is
// the same document this opens, thirty years earlier in interface terms, and
// the player can hold the two up against each other.
//
// AND THE GAME ALREADY HAD THE OTHER ONE. Almost nobody owned a NeXT, so CERN
// built a second browser in 1991 — the Line Mode browser — which printed a page
// as text with its links NUMBERED, and you typed a number to follow one. That
// is exactly `renderPage` in net.js, which is what the obelisk consoles browse
// with. The estate's terminals have been running a Line Mode browser this whole
// time; this file only adds the machine that came first.
//
// (The application was renamed Nexus later, to stop it being confused with the
// project. The server half Berners-Lee wrote alongside it was httpd, which the
// game also already has — it is the thing you break through on the way in.)
//
// Fidelity references: CERN's 2019 rebuild (worldwideweb.cern.ch) for the
// interface, and the original Objective-C source at github.com/cynthia/
// WorldWideWeb for what the menus and panels were actually called. Neither is
// copied here — this is the same interface reasoned about, in this game's
// renderer, over this game's archive.
//
// TYPE. NeXTSTEP shipped Helvetica, Courier and Ohlfs, a monospace face by
// Keith Ohlfs that never left the platform. WorldWideWeb's defaults were
// Helvetica and Ohlfs. They were BITMAP fonts: drawn per size, so a document
// had a handful of sizes available and nothing in between, and no smoothing.
// We cannot ship the faces, so the discipline is what is honoured — integer
// sizes off a fixed ladder, never an arbitrary one, and antialiasing off where
// the canvas will allow it. Sizing text at 13.5px here would be a bigger
// anachronism than the wrong typeface.

/** The sizes NeXTSTEP actually had a bitmap for. Nothing between them existed. */
export const NEXT_SIZES = [10, 12, 14, 18, 24];

/** Snap to the ladder. A size off it is a size the machine could not draw. */
export function nextSize(px) {
  return NEXT_SIZES.reduce((best, s) => (Math.abs(s - px) < Math.abs(best - px) ? s : best), NEXT_SIZES[0]);
}

/**
 * The default style sheet, in the shape WorldWideWeb's Style Editor showed it:
 * a tag, a face, a size, and an indent.
 */
export const WWW_STYLES = {
  h1: { size: 24, bold: false, face: 'helv', above: 14, below: 6 },
  h2: { size: 18, bold: false, face: 'helv', above: 12, below: 4 },
  h3: { size: 14, bold: true, face: 'helv', above: 10, below: 3 },
  p: { size: 14, bold: false, face: 'helv', above: 0, below: 8 },
  pre: { size: 12, bold: false, face: 'ohlfs', above: 6, below: 8 },
  address: { size: 12, bold: false, face: 'helv', above: 10, below: 4 },
};

/** Face stacks. Ohlfs is gone, so a monospace stand-in carries the role. */
export const WWW_FACES = {
  helv: 'Helvetica, Helvetica Neue, Arial, sans-serif',
  ohlfs: 'Ohlfs, Courier, Courier New, monospace',
};

/** Build a canvas font string on the ladder, never off it. */
export function fontFor(style) {
  const s = WWW_STYLES[style] || WWW_STYLES.p;
  return `${s.bold ? 'bold ' : ''}${nextSize(s.size)}px ${WWW_FACES[s.face]}`;
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', nbsp: ' ', mdash: '—', rsquo: '’', ldquo: '“', rdquo: '”' };
const decode = (s) => String(s).replace(/&(\w+);/g, (m, n) => (ENT[n] != null ? ENT[n] : m));

/**
 * Parse a document into blocks of styled runs.
 *
 * Runs rather than lines, because a link is a stretch of text INSIDE a
 * paragraph and the browser has to know exactly where it sits to answer a
 * double-click on it. renderPage (net.js) flattens to text and a link list,
 * which is right for a line-mode browser and useless here.
 */
export function parseDoc(html) {
  const blocks = [];
  for (const raw of String(html || '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (/^<hr\s*\/?>$/i.test(line)) { blocks.push({ style: 'rule', runs: [] }); continue; }
    let style = 'p';
    const tag = /^<(h1|h2|h3|pre|address|p|div|small)\b/i.exec(line);
    if (tag) {
      const t = tag[1].toLowerCase();
      style = (t === 'div' || t === 'small') ? 'p' : t;
    }
    // Pull the anchors out in place; everything between them is plain text.
    const runs = [];
    const inner = line.replace(/^<[^>]+>/, '').replace(/<\/[a-z0-9]+>\s*$/i, '');
    let last = 0;
    const re = /<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = re.exec(inner))) {
      const before = inner.slice(last, m.index);
      if (before) runs.push({ text: decode(before.replace(/<[^>]+>/g, '')) });
      const label = decode(m[2].replace(/<[^>]+>/g, ''));
      if (label) runs.push({ text: label, href: m[1] });
      last = m.index + m[0].length;
    }
    const tail = inner.slice(last);
    if (tail) runs.push({ text: decode(tail.replace(/<[^>]+>/g, '')) });
    if (runs.length || style === 'rule') blocks.push({ style, runs });
  }
  return blocks;
}

/**
 * Lay a document out to a width, returning lines of positioned runs.
 *
 * `measure(text, style)` is passed in so the module stays testable without a
 * canvas: the caller supplies ctx.measureText, a test supplies a ruler.
 */
export function layout(blocks, width, measure) {
  const lines = [];
  let y = 0;
  for (const b of blocks) {
    const st = WWW_STYLES[b.style] || WWW_STYLES.p;
    if (b.style === 'rule') { y += 10; lines.push({ y, style: 'rule', runs: [] }); y += 10; continue; }
    y += st.above;
    const lh = nextSize(st.size) + 5;
    let cur = { y: y + lh, style: b.style, runs: [] };
    let x = 0;
    for (const run of b.runs) {
      // Wrap on words, keeping a link's own pieces linked.
      for (const word of run.text.split(/(\s+)/)) {
        if (!word) continue;
        const w = measure(word, b.style);
        if (x + w > width && x > 0 && word.trim()) {
          lines.push(cur);
          y += lh;
          cur = { y: y + lh, style: b.style, runs: [] };
          x = 0;
          if (!word.trim()) continue;   // a space that fell at a break is dropped
        }
        cur.runs.push({ text: word, href: run.href, x, w });
        x += w;
      }
    }
    if (cur.runs.length) { lines.push(cur); y += lh; }
    y += st.below;
  }
  return { lines, height: y };
}

/** The link at a point, or null. The browser's whole hit test. */
export function linkAt(laid, px, py, lineH = 19) {
  for (const line of laid.lines) {
    if (py < line.y - lineH || py > line.y + 4) continue;
    for (const r of line.runs) {
      if (!r.href) continue;
      if (px >= r.x && px <= r.x + r.w) return r.href;
    }
  }
  return null;
}

// ---- The root document ---------------------------------------------------
// Shaped like the page WorldWideWeb opened on — a welcome, a note on how to
// follow a link, then the indexes — but it is this estate's root, not CERN's.
// Copying CERN's page in would put a document in the game that the game's own
// network does not serve, and every link on it would be dead.

export const WWW_HOME_ADDR = 'file://localhost/Net/hypertext/WWW/TheProject.html';

export function homeDoc(aiName = 'CALYPSO') {
  // ONE BLOCK PER LINE. parseDoc splits on newlines, so a paragraph broken
  // across source lines would come out as three paragraphs with three gaps.
  return [
    '<h1>Home</h1>',
    `<p>Access to this information is provided as part of the ${aiName} estate network. The estate does not take responsibility for the accuracy of information provided by others.</p>`,
    '<h2>How to proceed</h2>',
    '<p>References to other information are represented like <a href="cache.calypso.com">this</a>. Double-click on it to jump to related information.</p>',
    '<h2>General information sources</h2>',
    '<p>Now choose an area in which you would like to start browsing. With the indexes, you should use the keyword search option on your browser.</p>',
    '<p><a href="cache.calypso.com">The cache</a></p>',
    '<p>A general keyword index of what was crawled before the upstream link went down. Everything below resolves to this host.</p>',
    '<p><a href="wikipedia.org">Wikipedia</a></p>',
    '<p>A keyword index to the encyclopaedia anyone could edit.</p>',
    '<p><a href="geocities.com">GeoCities</a></p>',
    '<p>Personal pages, by neighbourhood. Held as crawled.</p>',
    '<h2>Estate-related</h2>',
    '<p>If you are on the estate network, see also the following topics:</p>',
    '<p><a href="10.1.5.3">AI-ML</a></p>',
    '<p>Engineering documentation for the language the nodes run.</p>',
    '<p><a href="198.51.100.200">Search</a></p>',
    '<p>A keyword index of everything still answering.</p>',
    '<hr>',
    '<address>HyperMedia Browser/Editor, an exercise in global information availability. Version 1.0 alpha. Distribution restricted.</address>',
  ].join('\n');
}

/**
 * The menus, with the names they had. `Open from full document reference` is
 * the whole navigation story: there is no address bar, so reaching a document
 * you have not been linked to is a four-step errand through a menu and a panel,
 * and that is not a UX failure to be smoothed over — it is what using this was.
 */
export const WWW_MENUS = {
  WorldWideWeb: ['Info', 'Document', 'Links', 'Navigate', 'Print', 'Page layout...'],
  Document: ['Open from full document reference', 'New File...', 'Save a copy offline', 'Close'],
  Links: ['Mark all', 'Link to marked'],
  Navigate: ['< Back', 'Back up', 'Next >', 'Home', 'Help'],
};

/** The Info panel, which is where the application says what it is. */
export const WWW_INFO = [
  'HyperMedia Browser/Editor',
  'An exercise in global information availability',
  'Version 1.0 — Alpha only',
  '',
  'HyperText:  text which is not constrained to be linear.',
  'HyperMedia: information which is not constrained to be linear,',
  '            or to be text.',
  '',
  'It can pick up hypertext information from files in a number of',
  'formats, from local files, from remote files, from hypertext',
  'servers by name or keyword search, and from internet news.',
  '',
  'Hypertext files may be edited, and links made from hypertext',
  'files to other files or any other information.',
];

// ---- The three panels ----------------------------------------------------
//
// These are the parts of the application that were left out when the browser
// was first built, and they are the parts that make it that browser rather than
// a read-only viewer with period styling.
//
// OPEN FROM FULL DOCUMENT REFERENCE is the whole navigation story. There is no
// address bar, so reaching a document nobody has linked you to is a four-step
// errand: menu, submenu, panel, type the whole reference, Open. That is not a
// usability defect to be smoothed over — it is what using this was, and the
// smoothing-over is the thirty years of interface history the game is about.
//
// MARK ALL / LINK TO MARKED is the half everybody forgets: this was an EDITOR.
// A single click put the caret in the text, which is why following a link needs
// a double one. You marked a document, went to another, and made a link between
// them, and the link became part of the document you were reading.

/** Strip the scheme and any trailing slash, so two spellings of one host match. */
export function normaliseRef(ref) {
  return String(ref || '').trim()
    .replace(/^(https?|file|ftp|news|telnet):\/\//i, '')
    .replace(/^localhost\//i, '')
    .replace(/\/+$/, '')
    .toLowerCase();
}

/**
 * A reference typed into the Open panel, resolved against a list of hosts.
 *
 * Deliberately forgiving about the SCHEME and nothing else. A player who types
 * `http://cache.calypso.com` and a player who types `cache.calypso.com` are
 * both doing the thing the panel asks for; a player who types half a name is
 * not, and gets the same silence the real thing gave them.
 */
export function resolveRef(ref, hosts) {
  const want = normaliseRef(ref);
  if (!want) return null;
  for (const h of hosts || []) {
    for (const cand of [h.host, h.name, h.addr, h.ip]) {
      if (cand && normaliseRef(cand) === want) return h;
    }
  }
  return null;
}

/** The link a mark makes, as the document will carry it. */
export function markLink(mark) {
  if (!mark || !mark.addr) return '';
  const label = String(mark.title || mark.addr).replace(/[<>]/g, '');
  return `<p><a href="${mark.addr}">${label}</a></p>`;
}

/**
 * Add a link to a document, under a Links heading the browser adds once.
 *
 * The edit is to the TEXT, not to a side table of annotations, because that is
 * what making a link did: the document you were reading came to contain it.
 * Returns the new document, unchanged if the link is already in it.
 */
export function linkInto(doc, mark) {
  const line = markLink(mark);
  if (!line) return doc;
  const body = String(doc || '');
  if (body.includes(`href="${mark.addr}"`)) return body;
  const head = body.includes('<h2>Links</h2>') ? '' : '\n<h2>Links</h2>';
  return `${body}${head}\n${line}`;
}
