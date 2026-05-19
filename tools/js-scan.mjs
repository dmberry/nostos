// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// A SMALL SCANNER OVER JAVASCRIPT SOURCE, shared by the checks that have to
// read main.js without running it.
//
// It lives here rather than inside one test because there are now two tests
// that need it — the name-resolution check (v1.333's missing import) and the
// boot check (v1.549's temporal-dead-zone read) — and a second copy would drift
// from the first exactly when it mattered.

/**
 * Comments, strings and regex literals replaced by spaces of equal length, so
 * every offset in the result still matches the original. One pass, tracking
 * what it is inside, which is the part a chain of regexes cannot do.
 */
export function blankNonCode(src) {
  const out = src.split('');
  const blank = (from, to) => { for (let i = from; i < to && i < out.length; i++) if (out[i] !== '\n') out[i] = ' '; };
  let i = 0;
  // A `/` starts a regex literal rather than division when the last meaningful
  // character cannot end an expression.
  let prev = '';
  while (i < src.length) {
    const c = src[i];
    const d = src[i + 1];
    if (c === '/' && d === '/') { const j = src.indexOf('\n', i); const end = j < 0 ? src.length : j; blank(i, end); i = end; continue; }
    if (c === '/' && d === '*') { const j = src.indexOf('*/', i + 2); const end = j < 0 ? src.length : j + 2; blank(i, end); i = end; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < src.length) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === c) break;
        j++;
      }
      blank(i, j + 1); i = j + 1; prev = 'x'; continue;
    }
    // A TEMPLATE NESTS. `${`inner`}` is one string, and stopping at the first
    // backtick inside left the rest of it looking like code — which is where
    // FAULTED and running$ came from when this was first written.
    if (c === '`') {
      let j = i + 1; let depth = 0;
      while (j < src.length) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '$' && src[j + 1] === '{') { depth++; j += 2; continue; }
        if (src[j] === '}' && depth) { depth--; j++; continue; }
        if (src[j] === '`' && !depth) break;
        if (src[j] === '`' && depth) { j++; continue; }
        j++;
      }
      blank(i, j + 1); i = j + 1; prev = 'x'; continue;
    }
    if (c === '/' && prev && !/[\w$)\]]/.test(prev)) {
      let j = i + 1; let cls = false;
      while (j < src.length && src[j] !== '\n') {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '[') cls = true;
        else if (src[j] === ']') cls = false;
        else if (src[j] === '/' && !cls) break;
        j++;
      }
      if (src[j] === '/') { blank(i, j + 1); i = j + 1; prev = 'x'; continue; }
    }
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  return out.join('');
}
