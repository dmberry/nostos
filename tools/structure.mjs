// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// Structural measurement of src/: file sizes, function lengths, module-level
// mutable state, section cohesion in main.js, and repeated code.
//
//   node tools/structure.mjs
//
// Read-only. Run it rather than reading a number out of a dated audit; the
// figures in docs/structure-audit-2026-08-14.md were true on the day.
//
// This tool reports when it cannot measure. tools/sweep.mjs stripped comments
// and strings with a chain of regexes, one of which swallowed the file, and it
// spent months reporting `clean` over an empty region until v1.332 shipped two
// undefined names. So: the stripper here is a scanner, it handles regex
// literals (a `'` inside /[A-Za-z']+/ otherwise reads as a quote and eats the
// rest of the file), and it asserts that the stripped copy still has the same
// number of lines as the original before any line number is printed.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'src');
const MAIN = join(ROOT, 'main.js');

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.js')) out.push(p);
  }
  return out;
}

const rel = (f) => f.slice(ROOT.length + 1);

/**
 * Blank out comments and string bodies, keeping every newline so line numbers
 * survive. `prev` tracks the last significant code character, which is what
 * separates a regex literal from division.
 */
function scan(src) {
  let code = '', comment = 0, i = 0, prev = '';
  const n = src.length;
  const REGEX_OK = new Set(['', '(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^']);
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; comment++; continue; }
    if (c === '/' && d === '*') {
      i += 2; comment++;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] === '\n') { comment++; code += '\n'; }
        i++;
      }
      i += 2; continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const q = c; code += c; i++;
      while (i < n && src[i] !== q) {
        if (src[i] === '\\') { code += ' '; i++; }
        code += src[i] === '\n' ? '\n' : ' ';
        i++;
      }
      code += q; i++; prev = q; continue;
    }
    if (c === '/' && REGEX_OK.has(prev)) {
      code += ' '; i++;
      let cls = false, bad = false;
      while (i < n && (cls || src[i] !== '/')) {
        if (src[i] === '\\') i++;
        else if (src[i] === '[') cls = true;
        else if (src[i] === ']') cls = false;
        else if (src[i] === '\n') { bad = true; break; }
        i++;
      }
      if (!bad) i++;
      prev = 'x'; continue;
    }
    code += c;
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  return { code, commentLines: comment };
}

function strip(file) {
  const raw = readFileSync(file, 'utf8');
  const { code, commentLines } = scan(raw);
  if (code.split('\n').length !== raw.split('\n').length) {
    throw new Error(`${rel(file)}: the stripped copy lost lines, so every number below it would be fiction`);
  }
  return { raw, code, commentLines };
}

/** Function extents by brace depth over stripped code. */
function functions(code) {
  const lines = code.split('\n');
  const out = [];
  const re = /^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)|^\s*(?:export\s+)?const\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\(|^\s{2}([A-Za-z0-9_$]+)\s*\([^)]*\)\s*\{\s*$/;
  for (let i = 0; i < lines.length; i++) {
    const m = re.exec(lines[i]);
    if (!m) continue;
    let depth = 0, started = false, j = i;
    for (; j < lines.length; j++) {
      for (const ch of lines[j]) { if (ch === '{') { depth++; started = true; } else if (ch === '}') depth--; }
      if (started && depth <= 0) break;
    }
    if (started && j > i) out.push({ name: m[1] || m[2] || m[3], start: i + 1, len: j - i + 1 });
  }
  return out;
}

// ---- 1: the files ----------------------------------------------------------

const files = walk(ROOT).sort();
const rows = [];
const allFns = [];
for (const f of files) {
  const { raw, code, commentLines } = strip(f);
  const total = raw.split('\n').length;
  const blank = raw.split('\n').filter((l) => !l.trim()).length;
  const fns = functions(code);
  for (const fn of fns) allFns.push({ ...fn, file: rel(f) });
  rows.push({
    file: rel(f), total, comment: commentLines, blank,
    codeLines: total - commentLines - blank,
    fns: fns.length,
    state: (code.match(/^(?:let|var)\s/gm) || []).length,
  });
}
rows.sort((a, b) => b.codeLines - a.codeLines);

console.log('THE FILES, by code lines');
console.log('file                                   total   code    cmt  fns  module state');
for (const r of rows.slice(0, 15)) {
  console.log([
    r.file.padEnd(36), String(r.total).padStart(6), String(r.codeLines).padStart(6),
    (String(Math.round(100 * r.comment / r.total)) + '%').padStart(6),
    String(r.fns).padStart(4), String(r.state).padStart(8),
  ].join(' '));
}
const t = (k) => rows.reduce((a, r) => a + r[k], 0);
console.log(`\n${rows.length} files, ${t('total')} lines: ${t('codeLines')} code, ${t('comment')} comment (${Math.round(100 * t('comment') / t('total'))}%)`);

// ---- 2: the long functions -------------------------------------------------

allFns.sort((a, b) => b.len - a.len);
console.log('\nLONGEST FUNCTIONS');
for (const a of allFns.slice(0, 12)) console.log(`${String(a.len).padStart(5)}  ${a.file}:${a.start}  ${a.name}`);

// ---- 3: main.js, section by section ----------------------------------------
//
// Cohesion: of the names a section declares, how many are used outside it. A
// section that leaks little can leave the file on its own; one that leaks a lot
// would drag the rest behind it.

const { raw: mraw, code: mcode } = strip(MAIN);
const mlines = mraw.split('\n');
const sections = [];
mlines.forEach((l, i) => {
  const m = /^\/\/ ----+ (.+?) -+$/.exec(l.trim());
  if (m) sections.push({ line: i + 1, title: m[1] });
});
sections.forEach((s, i) => { s.end = i + 1 < sections.length ? sections[i + 1].line - 1 : mlines.length; });

const decls = [];
mlines.forEach((l, i) => {
  const m = /^(?:let|var|const|async function|function)\s+([A-Za-z0-9_$]+)/.exec(l);
  if (m) decls.push({ name: m[1], line: i + 1 });
});

const secRows = [];
for (const s of sections) {
  const mine = decls.filter((d) => d.line >= s.line && d.line <= s.end);
  if (mine.length < 3) continue;
  let leaked = 0;
  const names = [];
  for (const d of mine) {
    const re = new RegExp(`(?:^|[^.\\w])${d.name}\\b`, 'g');
    let m, outside = 0;
    while ((m = re.exec(mcode))) {
      const ln = mcode.slice(0, m.index).split('\n').length;
      if (ln < s.line || ln > s.end) outside++;
    }
    if (outside) { leaked++; names.push(`${d.name}(${outside})`); }
  }
  secRows.push({ ...s, size: s.end - s.line + 1, decls: mine.length, pct: Math.round(100 * leaked / mine.length), names });
}
secRows.sort((a, b) => a.pct - b.pct || b.size - a.size);
console.log('\nmain.js SECTIONS, most self-contained first (leak% = declared names used elsewhere)');
console.log('size  decls  leak  section');
for (const r of secRows.slice(0, 14)) {
  console.log(`${String(r.size).padStart(4)}  ${String(r.decls).padStart(5)}  ${(r.pct + '%').padStart(4)}  L${r.line}  ${r.title}`);
}

// ---- 4: repeated code ------------------------------------------------------

const N = 8;
const seen = new Map();
for (const f of files) {
  const { code } = strip(f);
  const ls = code.split('\n')
    .map((l, i) => ({ l: l.trim(), i: i + 1 }))
    // String bodies come back blank, so a file holding a listing as data
    // (eliza-src.js) otherwise shows hundreds of identical empty-quote lines.
    .filter((x) => x.l.length > 12 && (x.l.match(/[A-Za-z_$][A-Za-z0-9_$]{2,}/g) || []).length >= 2);
  for (let i = 0; i + N <= ls.length; i++) {
    const key = ls.slice(i, i + N).map((x) => x.l).join(' | ');
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push(`${rel(f)}:${ls[i].i}`);
  }
}
const sites = new Set();
for (const [, where] of seen) {
  if (where.length > 1) sites.add(where.map((w) => w.replace(/:\d+$/, '')).join(' + '));
}
console.log(`\nREPEATED CODE: ${sites.size} distinct clone sites at ${N}+ identical lines`);
for (const s of [...sites].slice(0, 8)) console.log(`  ${s}`);
