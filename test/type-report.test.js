// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// WHAT THE NOSTBOOK SAYS A THING IS.
//
// The game folds case and the language does not, so the prelude is loaded by an
// interpreter built with names:'fold' and every structure member is filed under
// a folded key (`string.size`). `typeReport` was built without that setting. It
// looked up `String.size`, missed, and took the unbound-name fallback, which is
// a fresh variable — so EVERY qualified name reported `'a` at the laptop, and
// a value whose type was unknown printed unquoted, which made a string list
// look like a list of ints.
//
// Nothing caught it, because the CLI does not fold and was right throughout:
// `bml prog.ml` printed `: string` for the same program that printed `: 'a` in
// the browser. A test that only ever runs the CLI path cannot see this class of
// bug at all, so these go through the game's own loadPrelude and typeReport.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPrelude, typeReport } from '../src/game/ai_ml.js';
import { setReadFile } from '../src/lang/eval.js';

/** A laptop session with the prelude loaded and types switched on. */
async function laptop() {
  const ctx = { station: 'laptop', session: {}, types: true, print: () => {} };
  await loadPrelude(ctx);
  return ctx;
}

test('a qualified name reports its real type, not a fresh variable', async () => {
  const ctx = await laptop();
  for (const [src, want] of [
    ['val a = String.size "x"', 'int'],
    ['val b = List.length [1]', 'int'],
    ['val c = Int.toString 3', 'string'],
    ['val d = String.tokens', '(char -> bool) -> string -> string list'],
  ]) {
    assert.equal(typeReport(src, ctx), want, `${src} must not report 'a`);
  }
});

test('the file-reading program reports the types it really has', async () => {
  // The program as it was typed at the NostBook, which reported 'a on the first
  // three lines and printed the string with its newlines expanded and no quotes.
  setReadFile(() => '1\n2\n3\n');
  const ctx = await laptop();
  assert.equal(typeReport('val text = TextIO.inputAll (TextIO.openIn "test.txt")', ctx), 'string');
  assert.equal(typeReport('val lines = String.tokens (fn c => c = #"\\n") "a\\nb"', ctx), 'string list');
  assert.equal(typeReport('val nums = List.mapPartial Int.fromString ["1","2"]', ctx), 'int list');
});

test('TextIO reports the Basis signature, not what its body happens to be', async () => {
  // A stream here IS its filename, so openIn is the identity and infers
  // 'a -> 'a unless it is annotated. An instream that unifies with anything
  // takes inputAll's result with it.
  const ctx = await laptop();
  assert.equal(typeReport('val f = TextIO.openIn "x"', ctx), 'string');
  assert.equal(typeReport('val g = TextIO.openOut "x"', ctx), 'string');
});

test('the prelude files its names folded, which is what typeReport must match', async () => {
  // The mechanism itself, so a change to either side fails here rather than
  // showing up as 'a in the browser months later.
  const ctx = await laptop();
  const keys = Object.keys(ctx.session.__types || {});
  assert.ok(keys.length > 100, 'the prelude should have registered its types');
  assert.ok(keys.includes('string.size'), 'members are filed folded');
  assert.ok(!keys.includes('String.size'), 'and not under their written case');
});
