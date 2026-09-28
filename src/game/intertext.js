// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// Files and small programs for the NostBook that come from somewhere else:
// an SCCS history, three copies of one program, a diskette image, a page of
// the sixth edition, and the generators behind travesty, gorge, cent, nim and
// ttt. Pure data and pure functions, so unix.js can serve them and the tests
// can run them without a world.

// ---- SCCS ----------------------------------------------------------------
// The T-1's program, as the works kept it: every delta, who made it and why.
// Stored on the disk in a small s-file format (control lines start with ^A), so
// `cat` shows the raw file and `sccs` reads it. The dates are the machine's
// clock, which nothing ever set.

const SOH = '\u0001';

// Version 1.4 is the program the machines run (T1_PROGRAM in robots.js). A test
// holds the two equal.
const PURSUIT = [
  {
    sid: '1.1', user: 'fdy', mr: '',
    comment: 'initial issue. TIRESIAS-pursuit.',
    text: [
      '(* T-1 pursuit. TIRESIAS-pursuit 1.1.                     *)',
      'if threat then hunt',
      'else patrol',
    ],
  },
  {
    sid: '1.2', user: 'tmoss', mr: '0388',
    comment: 'units flattening in the field. home under 15.',
    text: [
      '(* T-1 pursuit. TIRESIAS-pursuit 1.2.                     *)',
      'if charge < 15 then home',
      'else if threat then hunt',
      'else patrol',
    ],
  },
  {
    sid: '1.3', user: 'e.marsh', mr: '0419',
    comment: 'keep the chassis. a unit badly hit comes off the line and walks away.',
    text: [
      '(* T-1 pursuit. TIRESIAS-pursuit 1.3.                     *)',
      'if charge < 15 then home',
      'else if hurt then flee',
      'else if threat then hunt',
      'else patrol',
    ],
  },
  {
    sid: '1.4', user: 'fdy', mr: '0419',
    comment: 'flee removed per foundry. MR 0419 closed.',
    text: [
      '(* T-1 pursuit. TIRESIAS-pursuit 1.4.                     *)',
      '(* No flee behaviour: a T-1 that runs is a T-1 that has   *)',
      '(* to be recovered. Faults are reported to the foundry.   *)',
      '(*                                                        *)',
      '(* SERVICE AIDS, disabled in the shipped unit:            *)',
      '(*   eye "blue"    lamp: red amber green blue white off   *)',
      '(*   flash 2       flashes per second; 0 is steady        *)',
      '(*   beep          one buzz, rate-limited by the chassis  *)',
      '(* Uncomment the marked line below to fit them.           *)',
      '',
      '(* eye "blue" ; flash 2 ; beep ;                          *)',
      'if charge < 15 then home',
      'else if threat then hunt',
      '(* else if threat then (beep ; eye "white" ; flash 6 ; hunt) *)',
      'else patrol',
    ],
  },
];

export const PURSUIT_TEXT_14 = PURSUIT[3].text.join('\n');

// Render a delta list as an s-file. Newest delta first in the header, as SCCS
// kept it; each version's text follows in its own ^AI / ^AE block.
export function sfileText(name, deltas) {
  const out = [`${SOH}h00000`, `${SOH}s ${name}`];
  for (let i = deltas.length - 1; i >= 0; i--) {
    const d = deltas[i];
    const prev = i > 0 ? deltas[i - 1].text.length : 0;
    out.push(`${SOH}d D ${d.sid} 00/00/00 00:00:00 ${d.user} ${i + 1} ${i}`);
    if (d.mr) out.push(`${SOH}m ${d.mr}`);
    out.push(`${SOH}c ${d.comment}`, `${SOH}e`);
    void prev;
  }
  out.push(`${SOH}u`, `${SOH}U`, `${SOH}t`, `${SOH}T`);
  for (const d of deltas) out.push(`${SOH}I ${d.sid}`, ...d.text, `${SOH}E ${d.sid}`);
  return out.join('\n');
}

export const S_PURSUIT = sfileText('s.pursuit.ml', PURSUIT);

// Read an s-file back. Returns { deltas: [{sid,user,mr,comment,text}] } oldest
// first, or null when the text is not an s-file.
export function parseSfile(text) {
  const lines = String(text || '').split('\n');
  if (!lines[0] || !lines[0].startsWith(`${SOH}h`)) return null;
  const heads = {};
  const bodies = {};
  let cur = null, open = null;
  for (const ln of lines) {
    if (open) {
      if (ln === `${SOH}E ${open}`) { open = null; continue; }
      bodies[open].push(ln);
      continue;
    }
    if (ln.startsWith(`${SOH}d D `)) {
      const p = ln.slice(5).split(' ');
      cur = { sid: p[0], date: p[1], time: p[2], user: p[3], mr: '', comment: '' };
      heads[cur.sid] = cur;
    } else if (ln.startsWith(`${SOH}m `) && cur) cur.mr = ln.slice(3);
    else if (ln.startsWith(`${SOH}c `) && cur) cur.comment = ln.slice(3);
    else if (ln.startsWith(`${SOH}I `)) { open = ln.slice(3); bodies[open] = []; }
  }
  const sids = Object.keys(heads).sort((a, b) => {
    const [a1, a2] = a.split('.').map(Number), [b1, b2] = b.split('.').map(Number);
    return a1 - b1 || a2 - b2;
  });
  return { deltas: sids.map((s) => ({ ...heads[s], text: bodies[s] || [] })) };
}

// prs(1): the delta table, newest first, with the counts SCCS printed
// (lines inserted / deleted / unchanged against the delta before).
export function sccsPrs(name, parsed) {
  const out = [`${name}:`, ''];
  const ds = parsed.deltas;
  for (let i = ds.length - 1; i >= 0; i--) {
    const d = ds[i];
    const before = i > 0 ? ds[i - 1].text : [];
    const keep = d.text.filter((l) => before.includes(l)).length;
    const ins = d.text.length - keep;
    const del = before.length - before.filter((l) => d.text.includes(l)).length;
    const n = (x) => String(x).padStart(5, '0');
    out.push(`D ${d.sid} ${d.date} ${d.time} ${d.user} ${i + 1} ${i}\t${n(ins)}/${n(del)}/${n(keep)}`);
    out.push('MRs:');
    if (d.mr) out.push(d.mr);
    out.push('COMMENTS:', d.comment, '');
  }
  return out.join('\n').replace(/\n+$/, '');
}

// ---- Three witnesses -----------------------------------------------------
// One program, three surviving copies. A is what a unit serves; B was printed
// from the works terminal before a change; C came off a RON field disk.
export const WITNESS_A = [
  'if charge < 15 then home',
  'else if threat then hunt',
  'else patrol',
].join('\n');
export const WITNESS_B = [
  'if charge < 25 then home',
  'else if threat then hunt',
  'else patrol',
].join('\n');
export const WITNESS_C = [
  'if charge < 15 then home',
  'else if threat then (beep ; hunt)',
  'else patrol',
].join('\n');
export const WITNESS_README = [
  'Three copies of the same three lines.',
  '',
  '  a.ml   read off T1_02 over the air',
  '  b.ml   a works printout, fan-fold, found in a drawer',
  '  c.ml   a RON field disk, second copy',
  '',
  'diff a.ml b.ml',
].join('\n');

// ---- The diskette --------------------------------------------------------
// A 3.5 inch image. Mostly nothing. strings finds a block that crypt(1) turns
// back into what somebody typed from memory. The key is the maker's name on
// the album in the poem.

export const AGRIPPA_KEY = 'kodak';
export const AGRIPPA_NOTE = [
  'I saw it run once. Somebody had taped the screen',
  'and we watched the tape in a kitchen, twice, which',
  'the disk itself would never have allowed. What I have:',
  'an album, a camera, a man writing prices in pencil,',
  'a gun in a drawer, a town with a railway. I typed',
  'this the same night from the tape, so there would',
  'be a copy of the copy.',
].join('\n');

// crypt(1) as unix.js has it: a Beaufort step over printable ASCII, its own
// inverse. Duplicated rather than imported so this file stays a leaf.
export function beaufort(key, text) {
  const LO = 32, SPAN = 95;
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c === 10) { out += '\n'; continue; }
    if (c < LO || c >= LO + SPAN) { out += text[i]; continue; }
    const k = key.charCodeAt(i % key.length) % SPAN;
    out += String.fromCharCode(LO + (((k - (c - LO)) % SPAN) + SPAN) % SPAN);
  }
  return out;
}

const NUL = (n) => '\u0000'.repeat(n);
export const AGRIPPA_IMG = NUL(62) + 'ë<\u0090' + NUL(11) + 'DNR'
  + NUL(173) + beaufort(AGRIPPA_KEY, AGRIPPA_NOTE) + NUL(209);

// ---- The sixth edition ---------------------------------------------------
// swtch() from slp.c, as the Lions commentary printed it. Unix V6 source,
// distributed under the Caldera licence for ancient UNIX.
export const SLP_C = [
  '/* slp.c -- sixth edition, lines 2178-2245, abridged */',
  '',
  'swtch()',
  '{',
  '\tstatic struct proc *p;',
  '\tregister i, n;',
  '\tregister struct proc *rp;',
  '',
  '\tif(p == NULL)',
  '\t\tp = &proc[0];',
  '\t/*',
  '\t * Remember stack of caller',
  '\t */',
  '\tsavu(u.u_rsav);',
  '\t/*',
  '\t * Switch to scheduler\'s stack',
  '\t */',
  '\tretu(proc[0].p_addr);',
  '',
  'loop:',
  '\t/* ... the search for the next process ... */',
  '',
  '\t/*',
  '\t * If the new process paused because it was',
  '\t * swapped out, set the stack level to the last call',
  '\t * to savu(u_ssav).  This means that the return',
  '\t * which is executed immediately after the call to aretu',
  '\t * actually returns from the last routine which did',
  '\t * the savu.',
  '\t *',
  '\t * You are not expected to understand this.',
  '\t */',
  '\tif(rp->p_flag&SSWAP) {',
  '\t\trp->p_flag =& ~SSWAP;',
  '\t\taretu(u.u_ssav);',
  '\t}',
  '\t/*',
  '\t * The value returned here has many subtle implications.',
  '\t * See the newproc comments.',
  '\t */',
  '\treturn(1);',
  '}',
].join('\n');

export const SYS_README = [
  'Pages of the sixth edition kernel, typed back in from a photocopy.',
  'Distributed under the Caldera licence for ancient UNIX.',
  '',
  '  slp.c    the scheduler: sleep, wakeup, swtch',
].join('\n');

// ---- travesty ------------------------------------------------------------
// Character n-grams. Take the last (order - 1) characters written, find every
// place they occur in the source, and copy the character that follows one of
// them at random. Order 2 is babble; by 5 or 6 the source's own words come back
// and are joined wrong.
export function travesty(src, { order = 4, length = 600, rng = Math.random } = {}) {
  const text = String(src || '').replace(/\s+/g, ' ').trim();
  const k = Math.max(1, Math.min(9, Math.floor(order) || 4) - 1);
  if (text.length <= k + 1) return text;
  const table = new Map();
  const wrap = text + ' ' + text.slice(0, k);
  for (let i = 0; i + k < wrap.length; i++) {
    const key = wrap.slice(i, i + k);
    let a = table.get(key);
    if (!a) { a = []; table.set(key, a); }
    a.push(wrap[i + k]);
  }
  const start = Math.floor(rng() * (text.length - k));
  let key = text.slice(start, start + k);
  let out = key;
  for (let n = 0; out.length < length && n < length * 4; n++) {
    const next = table.get(key);
    if (!next) break;
    const c = next[Math.floor(rng() * next.length)];
    out += c;
    key = (key + c).slice(-k || undefined);
    if (k === 0) key = '';
  }
  // Fold at 64 on a space, as the listing did.
  const words = out.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > 64) { lines.push(line.trim()); line = w; } else line += ' ' + w;
  }
  if (line.trim()) lines.push(line.trim());
  return lines.join('\n');
}

// ---- gorge ----------------------------------------------------------------
// An island in stanzas. Three lines of a thing doing something to a thing,
// then the path, then again.
const G_ABOVE = ['obelisk', 'gull', 'cable', 'ridge', 'lamp', 'mast', 'tower', 'cloud', 'relay', 'kite'];
const G_BELOW = ['tide', 'stone', 'reed', 'cell', 'crab', 'wire', 'rope', 'keel', 'buoy', 'moss'];
const PLURAL = { moss: 'mosses' };
const G_VERB = ['keep', 'cross', 'hum', 'lose', 'carry', 'count', 'wait for', 'forget', 'answer', 'charge'];
const G_IMP = ['listen', 'wait', 'mend', 'go on', 'stop', 'keep low', 'look up'];
const G_ADJ = ['wet', 'dark', 'salt', 'slow', 'flat', 'grey', 'bright', 'broken', 'warm', 'long'];

export function gorge(rng = Math.random, stanzas = 4) {
  const pick = (a) => a[Math.floor(rng() * a.length)];
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const out = [];
  for (let s = 0; s < stanzas; s++) {
    for (let i = 0; i < 3; i++) {
      const up = rng() < 0.5;
      const subj = up ? pick(G_ABOVE) : pick(G_BELOW);
      const obj = up ? pick(G_BELOW) : pick(G_ABOVE);
      out.push(`${cap(PLURAL[subj] || `${subj}s`)} ${pick(G_VERB)} the ${obj}.`);
    }
    out.push('');
    out.push(`  ${pick(G_ADJ)} -- ${pick(G_ADJ)} -- the path ${rng() < 0.5 ? 'down' : 'along'}, ${pick(G_ADJ)}`);
    out.push('');
    out.push(`${cap(pick(G_IMP))}.`);
    out.push('');
  }
  return out.join('\n').replace(/\n+$/, '');
}

// ---- cent -----------------------------------------------------------------
// Ten programs of fourteen lines, cut into strips. Line 1 is always the service
// aids, line 2 always opens with `if`, lines 3-13 with `else if`, line 14 with
// `else`, so any choice of one line per position parses. Fourteen places, ten
// choices each: 10^14 programs. Whether a chassis can do what a combination asks
// is a separate question, and the machine answers it.
const CENT = [
  [ // the sentry
    'eye "red" ; flash 0 ;',
    'if charge < 12 then home',
    'else if hurt then wait',
    'else if threat then hunt',
    'else if range < 3 then hunt',
    'else if lost_for > 20 then patrol',
    'else if home_range > 30 then home',
    'else if integrity < 20 then home',
    'else if linked = false then wait',
    'else if charge < 30 then wait',
    'else if range < 8 then wait',
    'else if home_range > 20 then patrol',
    'else if lost_for > 5 then wait',
    'else patrol',
  ],
  [ // the coward
    'eye "blue" ; flash 1 ;',
    'if threat then flee',
    'else if hurt then flee',
    'else if range < 6 then flee',
    'else if charge < 40 then home',
    'else if integrity < 60 then home',
    'else if lost_for > 2 then wait',
    'else if linked = false then flee',
    'else if home_range > 8 then home',
    'else if range < 12 then wait',
    'else if charge < 60 then wait',
    'else if home_range > 4 then home',
    'else if lost_for > 30 then patrol',
    'else wait',
  ],
  [ // the dog
    'eye "white" ; flash 0 ;',
    'if charge < 15 then home',
    'else if range > 14 then home',
    'else if range > 3 then follow',
    'else if hurt then follow',
    'else if threat then defend',
    'else if lost_for > 10 then home',
    'else if integrity < 30 then follow',
    'else if home_range > 40 then home',
    'else if linked = false then follow',
    'else if charge < 25 then follow',
    'else if range < 2 then wait',
    'else if lost_for > 3 then follow',
    'else follow',
  ],
  [ // the lighthouse
    'eye "amber" ; flash 1 ;',
    'if charge < 5 then home',
    'else if threat then wait',
    'else if hurt then wait',
    'else if range < 4 then wait',
    'else if linked = false then wait',
    'else if lost_for > 60 then wait',
    'else if integrity < 50 then wait',
    'else if home_range > 2 then home',
    'else if charge < 20 then wait',
    'else if range > 20 then wait',
    'else if home_range > 1 then home',
    'else if lost_for > 1 then wait',
    'else wait',
  ],
  [ // the escort
    'eye "white" ; flash 2 ;',
    'if charge < 15 then home',
    'else if threat then defend',
    'else if hurt then defend',
    'else if range > 10 then follow',
    'else if integrity < 25 then home',
    'else if linked = false then defend',
    'else if lost_for > 15 then follow',
    'else if home_range > 50 then home',
    'else if range < 3 then defend',
    'else if charge < 35 then defend',
    'else if range > 5 then follow',
    'else if lost_for > 4 then defend',
    'else defend',
  ],
  [ // the hunter
    'eye "red" ; flash 4 ;',
    'if charge < 20 then home',
    'else if threat then hunt',
    'else if lost_for < 8 then hunt',
    'else if range < 10 then hunt',
    'else if hurt then home',
    'else if integrity < 40 then home',
    'else if home_range > 25 then home',
    'else if linked = false then hunt',
    'else if charge < 40 then patrol',
    'else if range < 16 then hunt',
    'else if home_range > 15 then patrol',
    'else if lost_for < 20 then patrol',
    'else patrol',
  ],
  [ // the homebody
    'eye "green" ; flash 0 ;',
    'if home_range > 6 then home',
    'else if charge < 90 then home',
    'else if threat then home',
    'else if hurt then home',
    'else if range < 5 then home',
    'else if integrity < 90 then home',
    'else if linked = false then wait',
    'else if lost_for > 1 then home',
    'else if home_range > 3 then home',
    'else if range < 9 then wait',
    'else if charge < 95 then wait',
    'else if home_range > 1 then home',
    'else wait',
  ],
  [ // the wanderer
    'eye "green" ; flash 1 ;',
    'if charge < 10 then home',
    'else if threat then patrol',
    'else if hurt then patrol',
    'else if range < 2 then flee',
    'else if home_range < 10 then patrol',
    'else if linked = false then patrol',
    'else if lost_for > 0 then patrol',
    'else if integrity < 15 then home',
    'else if range > 30 then patrol',
    'else if charge < 20 then patrol',
    'else if home_range > 60 then home',
    'else if range < 6 then patrol',
    'else patrol',
  ],
  [ // the watcher
    'eye "amber" ; flash 0 ;',
    'if charge < 15 then home',
    'else if threat then wait',
    'else if range < 12 then wait',
    'else if lost_for < 30 then wait',
    'else if hurt then home',
    'else if integrity < 35 then home',
    'else if linked = false then home',
    'else if home_range > 12 then home',
    'else if range < 20 then wait',
    'else if charge < 50 then wait',
    'else if home_range > 6 then patrol',
    'else if lost_for < 60 then wait',
    'else patrol',
  ],
  [ // the stray
    'eye "off" ; flash 0 ;',
    'if hurt then home',
    'else if charge < 30 then home',
    'else if threat then follow',
    'else if range < 5 then follow',
    'else if lost_for > 8 then patrol',
    'else if integrity < 70 then home',
    'else if linked = false then follow',
    'else if home_range > 35 then home',
    'else if range > 16 then patrol',
    'else if charge < 45 then follow',
    'else if range > 8 then follow',
    'else if lost_for > 2 then wait',
    'else follow',
  ],
];
export const CENT_SOURCES = CENT;

// `digits` is fourteen digits, one per line: which of the ten programs that
// line is cut from.
export function cent(digits) {
  const d = String(digits || '');
  if (!/^\d{14}$/.test(d)) return null;
  const lines = [...d].map((c, i) => CENT[Number(c)][i]);
  return [`(* cent ${d} *)`, ...lines].join('\n');
}
export function centDigits(rng = Math.random) {
  let s = '';
  for (let i = 0; i < 14; i++) s += Math.floor(rng() * 10);
  return s;
}

// ---- nim -----------------------------------------------------------------
// Four rows, one three five seven. Whoever takes the last match loses. The
// machine plays second and has worked the whole game out in advance: 384
// positions, each marked won or lost for the side to move.
export const NIM_START = [1, 3, 5, 7];
const nimMemo = new Map();
// True when the side to move can force the other side to take the last match.
export function nimWins(rows) {
  const total = rows.reduce((a, b) => a + b, 0);
  if (total === 0) return true;          // the other side just took the last one
  const key = rows.join(',');
  if (nimMemo.has(key)) return nimMemo.get(key);
  let win = false;
  for (let r = 0; r < rows.length && !win; r++) {
    for (let n = 1; n <= rows[r] && !win; n++) {
      const next = rows.slice(); next[r] -= n;
      if (!nimWins(next)) win = true;
    }
  }
  nimMemo.set(key, win);
  return win;
}
// The machine's reply: [row index, count]. Takes the move that leaves the
// other side lost; if there is none, takes one from the biggest row.
export function nimReply(rows) {
  for (let r = 0; r < rows.length; r++) {
    for (let n = 1; n <= rows[r]; n++) {
      const next = rows.slice(); next[r] -= n;
      if (!nimWins(next)) return [r, n];
    }
  }
  let big = 0;
  for (let r = 1; r < rows.length; r++) if (rows[r] > rows[big]) big = r;
  return [big, 1];
}
export function nimBoard(rows) {
  const w = 13;
  return rows.map((n, i) => {
    const s = n ? Array(n).fill('|').join(' ') : '';
    return `${i + 1}  ${s.padStart(Math.floor((w + s.length) / 2)).padEnd(w)}  ${n}`;
  }).join('\n');
}

// ---- ttt -----------------------------------------------------------------
// Noughts and crosses, both sides played perfectly by the same search.
const LINES3 = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
function tttWinner(b) {
  for (const [a, c, d] of LINES3) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return b.includes(null) ? null : 'draw';
}
const tttMemo = new Map();
function tttScore(b, me) {
  const w = tttWinner(b);
  if (w === 'draw') return 0;
  if (w) return w === me ? 1 : -1;
  const key = b.map((c) => c || '.').join('') + me;
  if (tttMemo.has(key)) return tttMemo.get(key);
  const other = me === 'X' ? 'O' : 'X';
  let best = -2;
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = me;
    const s = -tttScore(b, other);
    b[i] = null;
    if (s > best) best = s;
  }
  tttMemo.set(key, best);
  return best;
}
export function tttGame(rng = Math.random) {
  const b = Array(9).fill(null);
  let me = 'X';
  // The opening square is chosen at random so the games differ; every move
  // after it is the best one available.
  b[Math.floor(rng() * 9)] = me;
  me = 'O';
  while (!tttWinner(b)) {
    const other = me === 'X' ? 'O' : 'X';
    let best = -2, moves = [];
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = me;
      const s = -tttScore(b, other);
      b[i] = null;
      if (s > best) { best = s; moves = [i]; } else if (s === best) moves.push(i);
    }
    b[moves[Math.floor(rng() * moves.length)]] = me;
    me = other;
  }
  return { board: b.map((c) => c || '.').join(''), result: tttWinner(b) };
}

// ---- Machines ----------------------------------------------------------------

// One unit per island runs a program made of other machines' lines.
export const PATCH_PROGRAM = [
  '(* PATCH. no single build. -- v.f.                         *)',
  'eye "amber" ;                  (* w4_07, its lamp          *)',
  'if charge < 15 then home       (* t1_02, pursuit 1.4       *)',
  'else if hurt then flee         (* a t1 at 1.3, before 1.4  *)',
  'else if threat then wait       (* doorbell.ml, no bell     *)',
  'else if range > 14 then home   (* leash.ml                 *)',
  'else patrol                    (* all of them              *)',
].join('\n');

// Two units by a tree.
export const GODOT_PROGRAM = [
  '(* nothing to be done *)',
  'if charge < 5 then home',
  'else wait',
].join('\n');
export const GODOT_TAGS = ['didi', 'gogo'];

// The W-1's loader counts courtesy. Saying please is optional; saying it more
// than once for every two lines of code is refused.
// Returns null when the program may be loaded, else the loader's message.
export function politeness(text) {
  const src = String(text || '');
  const comments = src.match(/\(\*[^]*?\*\)/g) || [];
  const please = comments.reduce((n, c) => n + (c.match(/\bplease\b/gi) || []).length, 0);
  const code = src.replace(/\(\*[^]*?\*\)/g, '').split('\n').filter((l) => l.trim()).length;
  if (!code) return null;
  if (please / code > 1 / 2) return 'E099 PROGRAMMER IS OVERLY POLITE';
  return null;
}

// What the machine did, told as a story, one sentence for what it knew and
// one for what it did. Built from the same reading the Codescope shows.
export function taleSpin(id, sense, decision, state = {}) {
  const who = String(id || 'IT').toUpperCase();
  if (state.powerDown) return `${who} WAS SHUT DOWN. ${who} STOOD THERE.`;
  if (state.drained) return `${who} HAD NO CHARGE LEFT. ${who} STOPPED.`;
  if (!decision) return `${who} HAD NOT THOUGHT YET.`;
  if (!decision.ok) return `${who} TRIED TO THINK. ${who} COULD NOT.`;
  const s = sense || {};
  let knew;
  if (Number.isFinite(s.charge) && s.charge < 20) knew = `${who} WAS LOW ON CHARGE.`;
  else if (s.hurt) knew = `${who} WAS BADLY HURT.`;
  else if (s.threat) knew = `${who} SAW AN ENEMY.`;
  else if (s.linked === false) knew = `${who} COULD NOT HEAR ITS TOWER.`;
  else if (Number.isFinite(s.range) && s.range < 6) knew = `${who} WAS NEAR SOMEBODY.`;
  else knew = `${who} SAW NOBODY.`;
  const DID = {
    home: 'WENT HOME', hunt: 'HUNTED', patrol: 'WALKED ITS BEAT', wait: 'WAITED',
    flee: 'RAN AWAY', follow: 'FOLLOWED', defend: 'STOOD GUARD', route: 'WALKED A SET PATH',
    tend: 'TENDED THE GROUND', usher: 'SHOWED SOMEBODY THE WAY', stand: 'STOOD',
  };
  const did = DID[decision.intent] || String(decision.intent || 'DID NOTHING').toUpperCase();
  return `${knew} ${who} ${did}.`;
}

// Notes left on lines of the stock programs by earlier readers. Keyed by the
// line as written, so a note follows the line to any machine that runs it.
export const SCOPE_NOTES = {
  'if charge < 15 then home': [
    ['v.botkin', 'fifteen is the distance from the far end of the south beat to the tower.'],
    ['e.marsh', '25 in the old printout. see sccs prs, 1.2.'],
  ],
  'else if threat then hunt': [
    ['e.marsh', 'there was a flee above this line in 1.3. it came out in 1.4.'],
    ['ronnie', 'change hunt to defend and it is on your side. try it on a dog first.'],
  ],
  'else patrol': [
    ['v.botkin', 'the beat. for the south estate, past the reservoir.'],
  ],
  'if charge < 12 then home': [
    ['ronnie', 'a W-1 refuses a program that says please too often. once in a comment is fine.'],
  ],
  'else defend': [
    ['tidewrack', 'imp.ml is only this line. it fights until it drops.'],
  ],
  'else wait': [
    ['n[o]de', 'the tw[o] by the tree are still th[ere].'],
  ],
};
