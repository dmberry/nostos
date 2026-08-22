// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// WHERE ONE DECLARATION ENDS.
//
// A file has to be cut into declarations before any of them can run, and there
// are two ways to decide where the cuts go.
//
// `joinProgram` reads the LAYOUT: a line continues the previous one when it is
// indented. That is how ML is written, and it is a guess, because Standard ML
// has no layout rule at all. The guess fails on a file that is indented from
// top to bottom — nothing is flush left, so nothing is top level, and the
// whole file reads as one line. An opener copied out of a page's source
// comment arrives exactly like that. It parsed as one line beginning with a
// comment, the loader skipped it, and `ml prog.ml` printed nothing, bound
// nothing and reported no error.
//
// `splitProgram` asks the PARSER, which is the only thing that knows. That is
// the one used for files now. These tests hold both to their jobs: the parser
// for files, and the layout reading for the prompt and for reporting on a file
// too broken to parse.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { joinProgram, splitProgram } from '../src/lang/parse.js';

const texts = (src) => splitProgram(src).map((p) => p.text);
const joined = (src) => joinProgram(src).map((p) => p.text);

// ---- the parser's answer, which is the one files get ----------------------

test('a file indented from top to bottom still has its declarations', () => {
  assert.deepEqual(texts('  val a = 1\n  val b = 2\n  val c = 3'),
    ['val a = 1', 'val b = 2', 'val c = 3']);
});

test('indentation changes nothing at all, which is the point', () => {
  const flush = 'fun f x =\n  x + 1\nval y = f 2';
  const indented = '      fun f x =\n        x + 1\n      val y = f 2';
  assert.equal(texts(flush).length, texts(indented).length);
  assert.equal(texts(flush).length, 2, 'the body belongs to its header, not to itself');
});

test('a comment written down the page is the lexer’s business', () => {
  // No comment handling here at all: the tokenizer has skipped them, nested
  // correctly, since before any of this.
  const src = ['(* a header comment',
    '   that runs over several lines',
    '   as headers do *)',
    '  val a = 1'].join('\n');
  assert.deepEqual(texts(src), ['val a = 1']);
});

test('a comment marker inside a string is not a comment', () => {
  assert.deepEqual(texts('val a = "(*"\nval b = 2\nval c = 3'),
    ['val a = "(*"', 'val b = 2', 'val c = 3']);
});

test('semicolons separate and terminate', () => {
  assert.deepEqual(texts('val a = 1; val b = 2;'), ['val a = 1', 'val b = 2']);
});

test('the line reported is the line in the file', () => {
  // joinProgram counted its own lines after dropping blanks and comments, so an
  // error pointed somewhere the author would have to hunt for.
  const src = '(* two\n   lines *)\n\nval a = 1\n\nval b = 2';
  assert.deepEqual(splitProgram(src).map((d) => d.line), [4, 6]);
});

test('the opener as published reads the same indented or not', () => {
  // The end to end case: the file a player actually makes.
  const src = '(* a note *)\nval key = [1, 2]\nfun f x = x\nfun g y = f y';
  const indented = src.split('\n').map((l) => (l.trim() ? `  ${l}` : l)).join('\n');
  assert.deepEqual(texts(indented), texts(src));
  assert.equal(texts(indented).length, 3);
});

test('a file that does not parse throws rather than guessing', () => {
  // The caller falls back to the layout reading to REPORT on it, which can name
  // one line and diagnose it. Splitting must not invent declarations.
  assert.throws(() => splitProgram('val a = '));
});

// ---- the layout reading, still used at the prompt and for broken files -----

test('joinProgram still joins a body to its header', () => {
  assert.deepEqual(joined('fun f x =\n  x + 1\nval y = f 2'),
    ['fun f x = x + 1', 'val y = f 2']);
});

test('joinProgram drops a comment written down the page', () => {
  // Its own comment handling was single-line, so the first line of a block
  // comment stood as a logical line and everything indented below was glued
  // onto it. Counted now, and nested, as the Definition says.
  assert.deepEqual(joined('(* a note\n   over lines *)\nval a = 1'), ['val a = 1']);
  assert.deepEqual(joined('(* outer (* inner *) still outer *)\nval a = 1'), ['val a = 1']);
});

test('joinProgram does not read a string as a comment', () => {
  // Counting the marker inside a string opens a comment with no closer, which
  // silently loses the rest of the file. The single-line strip this replaced
  // was accidentally safe there; the counter has to earn it back.
  assert.deepEqual(joined('val a = "(*"\nval b = 2\nval c = 3'),
    ['val a = "(*"', 'val b = 2', 'val c = 3']);
  assert.equal(joined('val a = "he said \\"(*\\" and stopped"\nval b = 2').length, 2);
});

// THE PRELUDE IS CUT THE SAME WAY A FILE IS.
//
// The standard library loads through `splitProgram` now, the same path a file
// at a terminal takes, so the layout heuristic has no production caller left
// and is exercised only at the prompt where it belongs. The library is written
// flush left, so the two ways of cutting it agree today; this holds them to
// agreeing, so a prelude edit that the parser and the line reading would split
// differently fails here rather than at boot.
test('the prelude splits identically by parser and by layout', async () => {
  const { PRELUDE, PRELUDE_EXACT } = await import('../src/lang/basis.js');
  const src = `${PRELUDE}\n${PRELUDE_EXACT}`;
  const byParser = splitProgram(src).map((d) => d.text);
  const byLayout = joinProgram(src).map((d) => d.text);
  assert.equal(byParser.length, byLayout.length,
    'the two cuts must yield the same number of declarations');
});
