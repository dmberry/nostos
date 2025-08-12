// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// Every file the browser loads must parse as an ES module.
//
// This exists because v1.418 shipped a build that would not start. An import
// was added to main.js under a name that file already used for something else,
// which is a duplicate lexical declaration and takes the whole module graph
// down: HALT on the boot screen, on every platform, with no way past it.
//
// It got through because `node --check src/main.js` PASSES on that file. There
// is no "type": "module" in package.json, so node parses a bare .js as
// CommonJS and never looks for the clash. The check that catches it is
// `--input-type=module`, and that is what this runs.
//
// main.js in particular has no other guard: it touches the DOM at import time,
// so no test can import it, and it is the largest file in the project. Parsing
// is the only check available and it is worth having.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../', import.meta.url).pathname;

function jsUnder(dir, out = []) {
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${name}`;
    if (statSync(join(ROOT, rel)).isDirectory()) jsUnder(rel, out);
    else if (name.endsWith('.js')) out.push(rel);
  }
  return out;
}

const files = [...jsUnder('src'), ...jsUnder('bin')];

test('the source tree is not empty (the walk itself works)', () => {
  assert.ok(files.length > 20, `only found ${files.length} files to check`);
  assert.ok(files.includes('src/main.js'), 'main.js must be in the set — it is the one with no other cover');
});

test('every shipped module parses as an ES module', () => {
  const broken = [];
  for (const rel of files) {
    try {
      execFileSync(process.execPath, ['--input-type=module', '--check'],
        { input: readFileSync(join(ROOT, rel)), stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (e) {
      const why = String(e.stderr || e.message).split('\n').filter(Boolean).slice(0, 4).join(' / ');
      broken.push(`${rel}: ${why}`);
    }
  }
  assert.deepEqual(broken, []);
});

test('a name imported into a file is not also declared in it', () => {
  // The specific shape that took the build down, checked directly as well as
  // through the parser: the parser catches it, and this says which name it was
  // without making anybody read a stack trace.
  const clashes = [];
  for (const rel of files) {
    const src = readFileSync(join(ROOT, rel), 'utf8');
    const imported = new Set();
    for (const m of src.matchAll(/^import\s*\{([^}]*)\}\s*from/gm)) {
      for (const part of m[1].split(',')) {
        const name = part.trim().split(/\s+as\s+/).pop().trim();
        if (name) imported.add(name);
      }
    }
    for (const name of imported) {
      const decl = new RegExp(`^(?:const|let|var|function|class)\\s+${name}\\b`, 'm');
      if (decl.test(src)) clashes.push(`${rel}: '${name}' is imported and also declared`);
    }
  }
  assert.deepEqual(clashes, []);
});
