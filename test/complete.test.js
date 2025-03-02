// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// TAB COMPLETION (task #85).
//
// The rule lives in the language rather than in either prompt, because there
// are two prompts — the CLI's readline and the page's input — and a rule
// written twice drifts. That also makes it testable without a terminal, which
// is the whole of this file: readline only completes on a TTY, so a piped Tab
// proves nothing.
//
// The two lookups it needs were already there, built for the "did you mean
// `Date`?" diagnostics and never handed out. They are on the interpreter now.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInterpreter, complete, readlineCompleter, commonPrefix, COMPLETION_KEYWORDS } from '../src/lang/index.js';

function loaded() {
  const bml = createInterpreter({ typecheck: 'off' });
  bml.loadPrelude();
  return bml;
}
const at = (bml, line, opts) => complete(line, line.length, bml, opts).candidates;

test('the interpreter hands out what completion needs', () => {
  const bml = loaded();
  assert.equal(typeof bml.knownNames, 'function');
  assert.equal(typeof bml.membersOf, 'function');
  assert.ok(bml.knownNames().includes('List'), 'a structure name is recovered from its members');
  // membersOf keeps its default of 3 for the diagnostics, and gives everything
  // when asked. Completion would be useless with three.
  assert.equal(bml.membersOf('List').length, 3);
  assert.ok(bml.membersOf('List', Infinity).length > 10);
});

test('a bare prefix offers names and keywords', () => {
  const bml = loaded();
  assert.deepEqual(at(bml, 'Lis'), ['List', 'ListPair']);
  assert.ok(at(bml, 'dataty').includes('datatype'), 'keywords are in no session and are what a learner wants');
  assert.ok(at(bml, 'datatype', { keywords: false }).length === 0, 'and can be turned off');
});

test('a dot completes the members of that structure', () => {
  const bml = loaded();
  assert.deepEqual(at(bml, 'List.f'), ['List.filter', 'List.find', 'List.foldl', 'List.foldr']);
  assert.deepEqual(at(bml, 'Real.fro'), ['Real.fromInt', 'Real.fromString']);
  assert.ok(at(bml, 'Word.').length > 10, 'an empty tail offers the whole structure');
});

test('an unknown head offers nothing rather than falling back', () => {
  // Falling back to the global list would offer `Nope.datatype`, which is not a
  // thing anybody can type.
  const bml = loaded();
  assert.deepEqual(at(bml, 'Nope.x'), []);
  assert.deepEqual(at(bml, 'Nope.'), []);
});

test('a host that folds case still gets the real spelling back', () => {
  // NostOS runs the language with `names: 'fold'` — its terminals are 1980s
  // machines and always have folded. The candidate carries the name as the
  // session actually spells it, which a case-sensitive host needs and a folding
  // one does not mind.
  const bml = loaded();
  assert.deepEqual(at(bml, 'lis'), ['List', 'ListPair']);
  assert.deepEqual(at(bml, 'list.m'), ['List.map', 'List.mapPartial']);
  assert.ok(at(bml, 'LIST.f').includes('List.filter'), 'the head resolves case-insensitively too');
});

test('a prefix that matches nothing answers nothing, and says where it was', () => {
  const bml = loaded();
  const r = complete('let xyzzy', 9, bml);
  assert.deepEqual(r.candidates, []);
  assert.equal(r.word, 'xyzzy');
  assert.equal(r.from, 4, 'the span to replace starts at the word, not the line');
  assert.equal(r.to, 9);
});

test('the caret is where the word ends, not the line', () => {
  // `List.f|oldr` — completing mid-line replaces the word up to the caret.
  const bml = loaded();
  const r = complete('List.foldr xs', 6, bml);
  assert.equal(r.word, 'List.f');
  assert.equal(r.to, 6);
  assert.ok(r.candidates.includes('List.filter'));
});

test('an empty line offers everything', () => {
  const bml = loaded();
  const all = at(bml, '');
  assert.ok(all.length > 100, `only ${all.length} names on an empty prefix`);
  assert.ok(all.includes('List'));
  assert.ok(all.includes('val'));
});

test('readlineCompleter hands back the whole word, including the head', () => {
  // readline replaces the trailing substring equal to the second element. Give
  // it just the tail and it replaces `fo` inside `List.fo`, leaving `List.` in
  // front of a completion that already carries it: `List.List.foldl`.
  const bml = loaded();
  const [matches, word] = readlineCompleter('List.fo', bml);
  assert.equal(word, 'List.fo');
  assert.deepEqual(matches, ['List.foldl', 'List.foldr']);
  for (const m of matches) assert.ok(m.startsWith(word), `${m} does not extend ${word}`);
});

test('commonPrefix is what a prompt can fill in before it has to ask', () => {
  assert.equal(commonPrefix(['List.foldl', 'List.foldr']), 'List.fold');
  assert.equal(commonPrefix(['List.map']), 'List.map');
  assert.equal(commonPrefix(['abs', 'map']), '', 'nothing shared, so nothing to add');
  assert.equal(commonPrefix([]), '');
  // It compares the way the search does, without regard to case, and answers in
  // the first candidate's spelling. `abs` and `Array` share their first letter
  // and a prompt filling in `a` there is doing the right thing.
  assert.equal(commonPrefix(['abs', 'Array']), 'a');
});

test("a session's own bindings complete too", () => {
  const bml = loaded();
  bml.run('val myLittleValue = 1');
  bml.run('fun myOtherThing x = x');
  assert.deepEqual(at(bml, 'myL'), ['myLittleValue']);
  assert.deepEqual(at(bml, 'myO'), ['myOtherThing']);
});

test('the keyword list has no duplicates and no stray spellings', () => {
  assert.equal(new Set(COMPLETION_KEYWORDS).size, COMPLETION_KEYWORDS.length);
  for (const k of COMPLETION_KEYWORDS) assert.match(k, /^[a-z]+$/, `${k} is not a keyword spelling`);
});
