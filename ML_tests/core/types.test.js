// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The type system: inference, polymorphism, the value restriction, the two
// modes (advisory and strict), and the shape of what a top level prints.
//
// Strict mode is the property that makes this an ML rather than a language that
// happens to infer types. Until it existed the accurate claim was "infers
// types", and Harper's unityped critique applied in full.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evals, refuses, session, types, typeClash } from '../harness/expect.mjs';

// ---- inference ------------------------------------------------------------

test('literals infer their own types', () => {
  types('1', 'int');
  types('1.5', 'real');
  types('true', 'bool');
  types('#"a"', 'char');
  types('[1]', 'int list');
  types('(1, true)', 'int * bool');
  types('{x = 1}', '{x : int}');
});

test('a function infers an arrow, argument first', () => {
  types('fn x => x + 1', 'int -> int');
  types('fn x => x', "'a -> 'a");
  types('fn a => fn b => a', "'a -> 'b -> 'a");
});

test('let-polymorphism: one definition serves several types', () => {
  types('fun id x = x', "'a -> 'a");
  const s = session();
  s.run('fun id x = x');
  assert.equal(s.run('id 1').text, '1');
  assert.equal(s.run('id "a"').text, '"a"');
  assert.equal(s.run('id true').text, 'true');
});

test('map infers the type Harper writes on the board', () => {
  types('fun mp f nil = nil | mp f (h :: t) = f h :: mp f t',
    "('a -> 'b) -> 'a list -> 'b list");
});

test('the occurs check stops an infinite type', () => {
  // A function that returns itself applied cannot be typed; it must be reported
  // rather than looping in the unifier.
  const t = String(session().type('fn x => x x'));
  assert.match(t, /^TYPE:/, `expected a reported clash, got ${t}`);
});

test('a recursive function infers without an annotation', () => {
  types('fun fact n = if n = 0 then 1 else n * fact (n - 1)', 'int -> int');
  types('fun len nil = 0 | len (_ :: t) = 1 + len t', "'a list -> int");
});

test('refs are typed, not left as a variable', () => {
  // ref, := and ! each reported 'a until v1.273: three wrong answers in a row
  // from the feature whose selling point is that it reports.
  types('ref 1', 'int ref');
  types('ref nil', "'a list ref");
  types('!(ref "a")', 'string');
  types('(ref 1) := 2', 'unit');
});

test('the value restriction: an application does not generalise', () => {
  types('val q = ref nil', "'a list ref");
  types('fun id2 x = x', "'a -> 'a");
});

// ---- advisory mode --------------------------------------------------------

test('advisory mode names a clash and runs the line anyway', () => {
  // This is what the game wants everywhere: a machine in a ruin says what it
  // worked out and lets the operator decide.
  const s = session({ types: 'report' });
  assert.equal(s.run('if true then 1 else "a"').text, '1');
  typeClash('if true then 1 else "a"', /int and str/, { types: 'report' });
});

test('advisory mode will build a list of mixed types, and say so', () => {
  const s = session({ types: 'report' });
  assert.equal(s.run('[1, "a"]').ok, true, 'the line still runs');
  typeClash('[1, "a"]', /not the same type/, { types: 'report' });
});

// ---- strict mode ----------------------------------------------------------

test('strict mode refuses a line that does not typecheck', () => {
  const s = session({ types: 'strict' });
  for (const src of [
    'if true then 1 else "a"',
    '[1, "a"]',
    'hd ["a", 1]',
    'if 1 then 2 else 3',
    'let val g = fn x => x ^ "!" in g 1 end',
  ]) {
    const r = s.run(src);
    assert.equal(r.ok, false, `strict mode should refuse: ${src}`);
    assert.match(String(r.text), /not the same type|TYPE/, src);
  }
});

test('strict mode refuses BEFORE evaluating, so nothing happens first', () => {
  // In advisory mode this line concatenates a number onto a string and answers
  // 1!. Strict refuses it, which is the difference the mode exists for.
  const advisory = session({ types: 'report' });
  assert.equal(advisory.run('let val g = fn x => x ^ "!" in g 1 end').text, '"1!"');
  const strict = session({ types: 'strict' });
  assert.equal(strict.run('let val g = fn x => x ^ "!" in g 1 end').ok, false);
});

test('strict mode passes everything well-typed', () => {
  const s = session({ types: 'strict' });
  assert.equal(s.run('1 + 1').text, '2');
  assert.equal(s.run('fun f x = x + 1').ok, true);
  assert.equal(s.run('f 41').text, '42');
  assert.equal(s.run('List.rev [1, 2]').text, '[2, 1]');
});

test('a warning stays a warning in strict mode', () => {
  // Exhaustiveness is advice, not an ill-typed program: strict refuses type
  // errors and must not refuse a case with a hole in it.
  const s = session({ types: 'strict' });
  s.run('datatype colour = Red | Green | Blue');
  const r = s.run('case Red of Red => 1 | Green => 2');
  assert.equal(r.ok, true, 'a non-exhaustive case still runs under strict');
  assert.match(String(s.type('case Red of Red => 1 | Green => 2')), /WARNING/);
});

// ---- what a top level prints ---------------------------------------------

test('the echo is SML-shaped: a value binds to it, with its type', () => {
  const s = session();
  assert.deepEqual(s.echo('7'), ['val it = 7 : int']);
  assert.deepEqual(s.echo('1 + 1'), ['val it = 2 : int']);
});

test('a declaration echoes the name it bound, with its type', () => {
  const s = session();
  assert.deepEqual(s.echo('val x = 7'), ['val x = 7 : int']);
  assert.deepEqual(s.echo('fun f x = x + 1'), ['val f = <fn> : int -> int']);
});

test('an exhaustiveness warning is printed under the line it belongs to', () => {
  const s = session();
  s.run('datatype colour = Red | Green | Blue');
  const lines = s.echo('case Red of Red => 1 | Green => 2');
  assert.equal(lines.length, 2, `expected a value line and a warning, got ${JSON.stringify(lines)}`);
  assert.match(lines[0], /^val it = 1 : int$/);
  assert.match(lines[1], /WARNING: this case does not cover Blue/);
});
