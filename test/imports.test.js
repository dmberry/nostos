// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// NAMES USED IN main.js MUST RESOLVE.
//
// main.js is the browser entry point. No test imports it — it touches the DOM,
// the canvas and the audio context on the way up — so a name used but never
// imported is caught by nothing. `node --check` parses a file; it does not
// resolve a name.
//
// v1.332 shipped `needsMoreInput` and `continuesPrevious` added to the exports
// of ai_ml.js and NOT to main.js's import list. Every suite passed, the
// checklist passed, the corpus passed, and the game threw `ReferenceError:
// continuesPrevious is not defined` on the first line typed at a terminal. The
// handler swallowed it, so commands produced no output and the machine looked
// dead.
//
// THERE WAS ALREADY A TOOL FOR THIS, tools/sweep.mjs, and it had been reporting
// `clean` against an EMPTY REGION. It located its bounds with indexOf on text
// it had already mangled: its comment and string stripping ran as a chain of
// regexes, one of which swallowed most of the file, so both markers came back
// -1 and it sliced from -1 to -1. It examined nothing and said so in the
// language of success. Run by hand and believed, for months.
//
// So this does the stripping with a scanner rather than regexes, and asserts
// the region is a plausible size before drawing any conclusion from it. An
// instrument that can return `clean` without having looked is worse than none,
// and that is the specific failure being designed out here.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blankNonCode } from '../tools/js-scan.mjs';

const MAIN = fileURLToPath(new URL('../src/main.js', import.meta.url));

test('sweep: the region it checks is not empty', () => {
  // The assertion the old tool did not make, and the only reason it could
  // report clean for months.
  const code = blankNonCode(fs.readFileSync(MAIN, 'utf8'));
  const a = code.indexOf('function netWorldDescriptor');
  const b = code.indexOf('function closeObTerminal');
  assert.ok(a > 0, 'the region start marker is gone — rename it here too');
  assert.ok(b > a, 'the region end marker is gone or came before the start');
  assert.ok(b - a > 50000, `the region is ${b - a} characters; it should be most of the terminal code`);
});

test('main.js: every free identifier in the terminal region resolves', () => {
  const src = fs.readFileSync(MAIN, 'utf8');
  const code = blankNonCode(src);

  const declared = new Set([...src.matchAll(/(?:function|class)\s+([a-zA-Z_$][\w$]*)/g)].map((m) => m[1]));
  // `let html, title, loc;` and `const W = a.width, H = a.height;` declare every
  // name in the list, not just the first. Taking only the first is what made
  // bd, loc, H and cy look undeclared.
  for (const m of src.matchAll(/(?:const|let|var)\s+([^;\n]+)/g)) {
    for (const part of m[1].split(',')) {
      const n = part.trim().replace(/[=:[({].*/s, '').trim();
      if (/^[a-zA-Z_$][\w$]*$/.test(n)) declared.add(n);
    }
  }
  const addParams = (list) => list.split(',').forEach((a) => {
    const n = a.trim().replace(/[=:].*/, '').replace(/^\.\.\./, '').trim();
    if (/^[a-zA-Z_$][\w$]*$/.test(n)) declared.add(n);
  });
  for (const m of src.matchAll(/\(([^()]*)\)\s*=>/g)) addParams(m[1]);
  for (const m of src.matchAll(/function\s*[a-zA-Z_$\w]*\s*\(([^()]*)\)/g)) addParams(m[1]);
  for (const m of src.matchAll(/(?:^|[^.\w$])([a-zA-Z_$][\w$]*)\s*=>/g)) declared.add(m[1]);
  for (const m of src.matchAll(/(?:const|let|var)\s*\{([^}]*)\}/g)) addParams(m[1].replace(/:/g, ' ').replace(/\s+/g, ' '));
  for (const m of src.matchAll(/(?:const|let|var)\s*\[([^\]]*)\]/g)) addParams(m[1]);
  for (const m of src.matchAll(/catch\s*\(\s*([a-zA-Z_$][\w$]*)/g)) declared.add(m[1]);
  for (const m of src.matchAll(/for\s*\(\s*(?:const|let|var)\s+([a-zA-Z_$][\w$]*)/g)) declared.add(m[1]);
  // A DESTRUCTURING loop head, including a nested one:
  //   for (const [id, [a, b]] of Object.entries(x))
  // Every name in the pattern is declared. Without this the inner names
  // looked undeclared and the check reported a name that was perfectly fine.
  for (const m of src.matchAll(/for\s*\(\s*(?:const|let|var)\s*([[{][^)]*?)\s+(?:of|in)\s/g)) {
    for (const n of m[1].match(/[a-zA-Z_$][\w$]*/g) || []) declared.add(n);
  }

  const imported = new Set(
    [...src.matchAll(/import\s*\{([^}]+)\}/g)].flatMap((m) => m[1].split(',').map((x) => x.trim().split(/\s+as\s+/).pop())),
  );
  for (const m of src.matchAll(/import\s+([a-zA-Z_$][\w$]*)\s+from/g)) imported.add(m[1]);
  for (const m of src.matchAll(/import\s*\*\s*as\s+([a-zA-Z_$][\w$]*)/g)) imported.add(m[1]);

  const a = code.indexOf('function netWorldDescriptor');
  const b = code.indexOf('function closeObTerminal');
  const region = code.slice(a, b);
  assert.ok(region.length > 50000, `region is ${region.length} characters — see the test above`);

  const GLOBALS = new Set(('Math String Number Object Array JSON parseInt parseFloat isNaN isFinite setTimeout '
    + 'clearTimeout setInterval clearInterval requestAnimationFrame cancelAnimationFrame Set Map WeakMap WeakSet Date '
    + 'console document window localStorage sessionStorage navigator location history performance encodeURIComponent '
    + 'decodeURIComponent RegExp Boolean Error TypeError RangeError Promise Symbol Infinity NaN structuredClone fetch '
    + 'URL Blob FileReader Image Audio AudioContext webkitAudioContext atob btoa alert confirm prompt CustomEvent Event '
    + 'ResizeObserver TextEncoder TextDecoder Uint8Array Int32Array Float32Array Float64Array ArrayBuffer Intl crypto '
    + 'matchMedia getComputedStyle screen true false null undefined this new typeof return if for while switch catch '
    + 'function const let var of in else break continue await async try throw delete void instanceof case default do '
    + 'class extends super yield import export from as arguments globalThis static get set').split(/\s+/));

  // A name followed by `:` is an object-literal key or a label and does not have
  // to resolve to anything. Checked by looking at what comes NEXT rather than by
  // a lookahead in the pattern: a lookahead made the match backtrack a character
  // and every name came out with its last letter missing, which then "resolved
  // to nothing" and the list of failures was pure noise.
  const used = new Set();
  for (const m of region.matchAll(/(?:^|[^.\w$])([a-zA-Z_$][\w$]*)/g)) {
    const after = region.slice(m.index + m[0].length).match(/^\s*(.)/);
    if (after && after[1] === ':') continue;
    used.add(m[1]);
  }
  assert.ok(used.size > 200, `only ${used.size} identifiers seen; the reader has stopped working`);

  const missing = [...used].filter((n) => !declared.has(n) && !imported.has(n) && !GLOBALS.has(n));
  assert.deepEqual(missing, [],
    `used in main.js and declared nowhere: ${missing.join(', ')}. `
    + 'An identifier that resolves to nothing is a ReferenceError the moment that '
    + 'line runs, and the terminal swallows it, so the machine simply answers nothing.');
});


// AND THE OTHER DIRECTION: a name imported must be a name exported.
//
// The test above proves every identifier main.js uses is imported from
// somewhere. It says nothing about whether the module named actually has it.
// That failure looks quite different and is worse: the browser refuses the
// whole module graph with `SyntaxError: The requested module './game/net.js'
// does not provide an export named 'favouritesPage'`, so the game does not
// boot at all — no canvas, no console, nothing but the boot loader's HALT.
//
// It costs one read per module and it covers every file main.js imports from,
// not just the terminal region.
test('every name main.js imports is exported by the module it names', () => {
  const src = fs.readFileSync(MAIN, 'utf8');
  const dir = path.dirname(MAIN);
  const problems = [];
  for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    const spec = m[2];
    if (!spec.startsWith('.')) continue;         // bare specifiers are somebody else's problem
    const file = path.resolve(dir, spec);
    if (!fs.existsSync(file)) { problems.push(`${spec}: no such file`); continue; }
    const mod = fs.readFileSync(file, 'utf8');
    const exported = new Set();
    for (const e of mod.matchAll(/export\s+(?:async\s+)?(?:function\*?|class|const|let|var)\s+([a-zA-Z_$][\w$]*)/g)) exported.add(e[1]);
    // `export const A = 1, B = 2;` declares both.
    for (const e of mod.matchAll(/export\s+(?:const|let|var)\s+([^;\n]+)/g)) {
      for (const part of e[1].split(',')) {
        const n = part.trim().replace(/[=:[({].*/s, '').trim();
        if (/^[a-zA-Z_$][\w$]*$/.test(n)) exported.add(n);
      }
    }
    // `export { a, b as c };` — the exported name is the one after `as`.
    for (const e of mod.matchAll(/export\s*\{([^}]*)\}/g)) {
      for (const part of e[1].split(',')) {
        const n = part.trim().split(/\s+as\s+/).pop().trim();
        if (/^[a-zA-Z_$][\w$]*$/.test(n)) exported.add(n);
      }
    }
    const starReexport = /export\s*\*\s*from/.test(mod);
    for (const part of m[1].split(',')) {
      const want = part.trim().split(/\s+as\s+/)[0].trim();
      if (!want || !/^[a-zA-Z_$][\w$]*$/.test(want)) continue;
      if (!exported.has(want) && !starReexport) problems.push(`${spec} does not export ${want}`);
    }
  }
  assert.deepEqual(problems, [],
    `main.js imports names that do not exist: ${problems.join('; ')}. `
    + 'The browser refuses the whole module graph for this, so the game does not boot.');
});
