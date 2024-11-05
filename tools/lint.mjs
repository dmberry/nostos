// Stage 0 of docs/refactor-plan.md: the check that would have caught the bugs.
//
// `node --check` parses. It cannot see an undefined identifier, and it cannot
// see the same name declared twice. Those two are the largest single category of
// real defect in this repo's history:
//
//   v1.203  `worldSeed` for WORLD_SEED, and searchResults/bookmarksPage used
//           without importing them. Both threw at runtime, inside the rAF loop,
//           so the game did not fail to open the laptop — it stopped.
//   (v1.19x) `phonePressed` defined TWICE in one class. The second definition
//           silently replaced the first, so the O key stopped opening the phone
//           and the README documented a key that did nothing.
//   v1.222  `findHost` resolving a shared IP to the wrong host: not this class,
//           but found the same way, by checking rather than assuming.
//
// ESLint would do this. It would also mean node_modules in a repo that has
// deliberately never had one, so this is the same two rules, hand-rolled, with
// no dependencies: `no-undef` and `no-redeclare`.
//
// It is a HEURISTIC, not a parser. It works at file scope: a name counts as
// known if it is declared anywhere in the file, imported, or a known global.
// That is coarser than real scope analysis and will not catch a name used
// outside the block it was declared in — but it catches typos and missing
// imports, which is the whole point, and it produces no false positives on this
// codebase, which is what makes it worth running.
//
//   node tools/lint.mjs            check src/ and tools/
//   node tools/lint.mjs --verbose  list what was scanned

import fs from 'fs';
import path from 'path';

const ROOTS = ['src', 'tools'];
const verbose = process.argv.includes('--verbose');

// After these, a `/` opens a regex literal rather than dividing.
const REGEX_OK_AFTER = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new',
  'delete', 'void', 'do', 'else', 'case', 'yield', 'await']);

// Everything a browser+node module may reach without declaring it.
const GLOBALS = new Set(`
Math JSON Object Array String Number Boolean Symbol BigInt Function RegExp Date Error TypeError
RangeError SyntaxError Promise Set Map WeakMap WeakSet Proxy Reflect Intl
parseInt parseFloat isNaN isFinite encodeURIComponent decodeURIComponent encodeURI decodeURI
setTimeout clearTimeout setInterval clearInterval queueMicrotask structuredClone
requestAnimationFrame cancelAnimationFrame performance console globalThis
window document navigator location history localStorage sessionStorage
Image Audio AudioContext webkitAudioContext OffscreenCanvas ImageData Path2D
devicePixelRatio DOMPoint DOMMatrix DOMRect getComputedStyle
CanvasRenderingContext2D HTMLCanvasElement HTMLElement Element Node Event
KeyboardEvent MouseEvent TouchEvent PointerEvent CustomEvent EventTarget
fetch Request Response Headers Blob File FileReader URL URLSearchParams
TextEncoder TextDecoder AbortController MutationObserver ResizeObserver
Uint8Array Uint16Array Uint32Array Int8Array Int16Array Int32Array
Float32Array Float64Array ArrayBuffer DataView Uint8ClampedArray
process Buffer __dirname __filename module exports require global
undefined NaN Infinity arguments this super import export
`.trim().split(/\s+/));

// Reserved words that the identifier regex will pick up and that are never names.
const KEYWORDS = new Set(`
if else for while do switch case default break continue return function class extends
const let var new delete typeof instanceof in of void yield await async try catch finally
throw with debugger get set static true false null this super import export from as
`.trim().split(/\s+/));

// Strip comments, strings, template literals and regex literals, so that prose
// inside them is never mistaken for code. Replaced with same-length blanks
// where practical so reported line numbers stay honest.
function strip(src) {
  // A stack-based scanner. The subtle case is `${...}` inside a template: the
  // interpolation holds REAL CODE, which may itself contain strings, and the
  // first cut copied that region out verbatim — so every quoted word inside a
  // template leaked into the identifier scan and produced 396 false positives
  // ("Stripped", "gutted", "worth", "breaking"). The stack fixes it: entering
  // an interpolation just pushes state and carries on scanning normally.
  let out = '';
  let i = 0;
  const n = src.length;
  let prev = '';
  const stack = [];              // 'tpl' frames we return to on a matching }
  let braces = 0;                // brace depth inside the current interpolation
  const blank = (ch) => (ch === '\n' ? '\n' : ' ');
  let lastWord = '';             // the identifier/keyword most recently passed

  while (i < n) {
    const c = src[i];
    const two = src.slice(i, i + 2);

    if (two === '//') { while (i < n && src[i] !== '\n') { out += ' '; i++; } continue; }
    if (two === '/*') {
      while (i < n && src.slice(i, i + 2) !== '*/') { out += blank(src[i]); i++; }
      out += '  '; i += 2; continue;
    }

    // Closing an interpolation returns us to the template it sat in.
    if (c === '}' && stack.length && braces === 0) {
      stack.pop(); out += ' '; i++;
      // resume template scanning
      const q = '`';
      while (i < n) {
        if (src[i] === '\\') { out += '  '; i += 2; continue; }
        if (src[i] === q) { out += ' '; i++; break; }
        if (src.slice(i, i + 2) === '${') { stack.push('tpl'); braces = 0; out += '  '; i += 2; break; }
        out += blank(src[i]); i++;
      }
      prev = 'x';
      continue;
    }
    if (stack.length) { if (c === '{') braces++; else if (c === '}') braces--; }

    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      out += ' '; i++;
      while (i < n) {
        if (src[i] === '\\') { out += '  '; i += 2; continue; }
        if (src[i] === q) { out += ' '; i++; break; }
        if (q === '`' && src.slice(i, i + 2) === '${') { stack.push('tpl'); braces = 0; out += '  '; i += 2; break; }
        out += blank(src[i]); i++;
      }
      prev = 'x';
      continue;
    }

    // Is the last thing we saw a keyword? Tracked incrementally: running a
    // /\w+$/ against the whole output on every character is O(n^2) and hung the
    // linter outright on a 300KB file.
    const afterKeyword = REGEX_OK_AFTER.has(lastWord);
    if (c === '/' && (afterKeyword || !/[\w$)\]]/.test(prev))) {
      let j = i + 1, ok = false, inClass = false;
      while (j < n && src[j] !== '\n') {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '[') inClass = true;
        else if (src[j] === ']') inClass = false;
        else if (src[j] === '/' && !inClass) { ok = true; break; }
        j++;
      }
      if (ok) {
        while (i <= j) { out += ' '; i++; }
        while (i < n && /[a-z]/.test(src[i])) { out += ' '; i++; }
        prev = 'x';
        continue;
      }
    }

    if (!/\s/.test(c)) prev = c;
    if (/[A-Za-z_$\w]/.test(c)) lastWord += c;
    else if (!/\s/.test(c)) lastWord = '';
    else if (lastWord && /\s/.test(c)) { /* keep the word across the space */ }
    out += c;
    i++;
  }
  return out;
}

// Every name this file declares, by any means.
function declaredNames(code) {
  const d = new Set();
  const add = (name) => { if (name && /^[A-Za-z_$][\w$]*$/.test(name)) d.add(name); };
  // Destructuring patterns: pull every identifier out of the binding side.
  const addPattern = (pat) => {
    for (const m of pat.matchAll(/([A-Za-z_$][\w$]*)\s*(?:=[^,]*)?(?=[,}\]]|$)/g)) add(m[1]);
    for (const m of pat.matchAll(/:\s*([A-Za-z_$][\w$]*)/g)) add(m[1]);
    for (const m of pat.matchAll(/\.\.\.\s*([A-Za-z_$][\w$]*)/g)) add(m[1]);
  };

  // A declaration may bind SEVERAL names: `let a = 0, b = 0;`. Reading only the
  // first was the second-biggest source of false positives — and this file
  // tripped it, which is the sort of thing that makes a checker worth writing.
  //
  // Scanned PER LINE rather than by one regex over the whole file: a pattern
  // like /const\s+([\s\S]*?);/ runs past `for (const raw of parts) {` and
  // swallows the next real declaration, so the name inside the loop is never
  // recorded. That was the third round of false positives.
  for (const line of code.split('\n')) {
    // EVERY declaration on the line, not just the first: a shuffle idiom puts
    // `for (let i = ...; ...) { const j = ...; }` on one line, and reading only
    // the first keyword loses `j`.
    for (const kw of [...line.matchAll(/\b(?:const|let|var)\s+/g)]) {
      const list = line.slice(kw.index + kw[0].length).split(';')[0];
      let depth = 0, part = '';
      const parts = [];
      for (const ch of list) {
        if ('([{'.includes(ch)) depth++;
        else if (')]}'.includes(ch)) depth--;
        if (ch === ',' && depth === 0) { parts.push(part); part = ''; continue; }
        part += ch;
      }
      parts.push(part);
      for (const raw of parts) {
        const t = raw.trim();
        if (!t) continue;
        if (t.startsWith('{') || t.startsWith('[')) {
          // Destructuring: take the WHOLE pattern up to its matching close
          // brace. Splitting at the first `=` breaks on defaults —
          // `const { amp = 9, axis = 'ns' } = cfg` would yield `{ amp ` and
          // lose every name after the first default.
          let d2 = 0, endAt = t.length;
          for (let k = 0; k < t.length; k++) {
            if ('([{'.includes(t[k])) d2++;
            else if (')]}'.includes(t[k])) { d2--; if (d2 === 0) { endAt = k + 1; break; } }
          }
          addPattern(t.slice(0, endAt));
        } else {
          add(t.split('=')[0].trim().split(/[\s)]/)[0]);
        }
      }
    }
  }
  // Multi-line destructuring, which the per-line pass cannot see.
  for (const m of code.matchAll(/\b(?:const|let|var)\s*([[{][^;=]*[}\]])\s*=/g)) addPattern(m[1]);
  for (const m of code.matchAll(/\bfunction\s*\*?\s*([A-Za-z_$][\w$]*)/g)) add(m[1]);
  for (const m of code.matchAll(/\bclass\s+([A-Za-z_$][\w$]*)/g)) add(m[1]);
  // Class fields, static or not: `static CORE_SCREENS = {`, `count = 0`.
  for (const m of code.matchAll(/^\s*(?:static\s+)?([A-Za-z_$][\w$]*)\s*=[^=]/gm)) add(m[1]);
  for (const m of code.matchAll(/\bcatch\s*\(\s*([A-Za-z_$][\w$]*)/g)) add(m[1]);
  for (const m of code.matchAll(/\bfor\s*\(\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) add(m[1]);
  for (const m of code.matchAll(/\bfor\s*\(\s*(?:const|let|var)\s*([[{][^)]*?[}\]])\s+of\b/g)) addPattern(m[1]);
  // Function parameters, of every shape.
  for (const m of code.matchAll(/\bfunction\s*\*?\s*[A-Za-z_$][\w$]*\s*\(([^)]*)\)/g)) addPattern(m[1]);
  for (const m of code.matchAll(/\bfunction\s*\*?\s*\(([^)]*)\)/g)) addPattern(m[1]);
  for (const m of code.matchAll(/\(([^()]*)\)\s*=>/g)) addPattern(m[1]);
  for (const m of code.matchAll(/(?:^|[^\w$.])([A-Za-z_$][\w$]*)\s*=>/gm)) add(m[1]);
  // Class methods and object-literal shorthand methods: `name(a, b) {`
  for (const m of code.matchAll(/^\s*(?:static\s+|async\s+|get\s+|set\s+|\*)*([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{/gm)) {
    add(m[1]); addPattern(m[2]);
  }
  // Imports.
  for (const m of code.matchAll(/import\s*\{([^}]+)\}/g)) {
    for (const part of m[1].split(',')) add(part.trim().split(/\s+as\s+/).pop().trim());
  }
  for (const m of code.matchAll(/import\s+([A-Za-z_$][\w$]*)\s*(?:,|from)/g)) add(m[1]);
  for (const m of code.matchAll(/import\s*\*\s*as\s+([A-Za-z_$][\w$]*)/g)) add(m[1]);
  return d;
}

// Names USED as free identifiers: not after a dot, not an object key.
function usedNames(code) {
  const used = new Map();     // name -> first line
  const lines = code.split('\n');
  lines.forEach((line, idx) => {
    // Drop object keys (`name:`) and anything after a dot.
    const cleaned = line.replace(/\.\s*[A-Za-z_$][\w$]*/g, '.').replace(/([A-Za-z_$][\w$]*)\s*:/g, ':');
    for (const m of cleaned.matchAll(/(?:^|[^\w$.])([A-Za-z_$][\w$]*)/g)) {
      const name = m[1];
      if (KEYWORDS.has(name) || GLOBALS.has(name)) continue;
      if (!used.has(name)) used.set(name, idx + 1);
    }
  });
  return used;
}

// no-redeclare, in the two shapes that have actually bitten: a class with the
// same method twice, and an object literal with the same key twice.
function duplicateMembers(code, file) {
  const found = [];
  const reBlock = /\b(class\s+[A-Za-z_$][\w$]*[^{]*)\{/g;
  let m;
  while ((m = reBlock.exec(code))) {
    let depth = 1;
    let i = m.index + m[0].length;
    const start = i;
    while (i < code.length && depth > 0) {
      if (code[i] === '{') depth++;
      else if (code[i] === '}') depth--;
      i++;
    }
    const body = code.slice(start, i - 1);
    const seen = new Map();
    // Methods at the top level of the class body only.
    let d = 0;
    for (const line of body.split('\n')) {
      const mm = d === 0 ? line.match(/^\s*(?:static\s+|async\s+|get\s+|set\s+|\*)*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/) : null;
      if (mm) {
        const name = mm[1];
        if (seen.has(name)) found.push({ file, name, kind: 'class method', first: seen.get(name) });
        else seen.set(name, name);
      }
      for (const ch of line) { if (ch === '{') d++; else if (ch === '}') d--; }
    }
  }
  return found;
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) out.push(full);
  }
  return out;
}

let undef = 0;
let dupes = 0;
let scanned = 0;
const files = ROOTS.filter((r) => fs.existsSync(r)).flatMap((r) => walk(r));

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const code = strip(src);
  const declared = declaredNames(code);
  const used = usedNames(code);
  scanned++;

  const missing = [...used].filter(([name]) => !declared.has(name));
  for (const [name, line] of missing) {
    console.log(`${file}:${line}  no-undef: '${name}' is not declared, imported, or a known global`);
    undef++;
  }
  for (const d of duplicateMembers(code, file)) {
    console.log(`${d.file}  no-redeclare: ${d.kind} '${d.name}' is defined more than once — the later one silently wins`);
    dupes++;
  }
  if (verbose) console.log(`  scanned ${file} (${declared.size} names declared)`);
}

const bad = undef + dupes;
console.log(bad
  ? `\n${bad} problem(s) in ${scanned} files: ${undef} undefined, ${dupes} redeclared`
  : `clean: ${scanned} files, no undefined identifiers, no redeclared members`);
process.exit(bad ? 1 : 0);
