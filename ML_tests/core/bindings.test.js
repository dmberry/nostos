// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// Binding conformance: val, fun, let, local, scope and shadowing.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evals, evalsSeq, refuses, session, types } from '../harness/expect.mjs';

test('val binds a name and echoes it', () => {
  evals('val x = 5', 'val x = 5');
  evalsSeq(['val x = 5', 'x + 1'], '6');
});

test('fun binds a function', () => {
  evalsSeq(['fun double n = n * 2', 'double 21'], '42');
});

test('a val binding takes a pattern, not only a name', () => {
  evalsSeq(['val (p, q) = (1, 2)', 'p + q'], '3');
  evalsSeq(['val {a, b} = {a = 1, b = 2}', 'a + b'], '3');
  evalsSeq(['val (h :: t) = [1, 2, 3]', 'h'], '1');
});

test('let scopes its bindings to the body', () => {
  evals('let val a = 1 val b = 2 in a + b end', '3');
  evals('let fun sq x = x * x in sq 4 end', '16');
  const s = session();
  s.run('let val gone = 1 in gone end');
  assert.equal(s.run('gone').ok, false, 'a let binding does not escape');
});

test('local exports the second group and hides the first', () => {
  const s = session();
  s.run('local val secret = 9 in val vis = secret + 1 end');
  assert.equal(s.run('vis').text, '10', 'the exported name is visible');
  assert.equal(s.run('secret').ok, false, 'the hidden name is not');
});

test('an inner binding shadows an outer one without altering it', () => {
  const s = session();
  s.run('val sh = 1');
  assert.equal(s.run('let val sh = 2 in sh end').text, '2');
  assert.equal(s.run('sh').text, '1', 'the outer binding is unchanged');
});

test('a function closes over the scope it was written in', () => {
  evalsSeq([
    'fun outer n = let fun inner m = m + n in inner 1 end',
    'outer 5',
  ], '6');
});

test('and binds simultaneously, and both names survive', () => {
  // The echo drops all but the last (register D-08); the bindings themselves
  // are correct, which is what this asserts.
  const s = session();
  s.run('val a1 = 1 and b1 = 2');
  assert.equal(s.run('a1').text, '1');
  assert.equal(s.run('b1').text, '2');
  s.run('fun f1 x = x and g1 x = x + 1');
  assert.equal(s.run('f1 7').text, '7');
  assert.equal(s.run('g1 7').text, '8');
});

// `and` is not simultaneous here — see D-53 in the departure register.

test('mutual recursion through and, at top level', () => {
  evalsSeq([
    'fun ev n = if n = 0 then true else od (n - 1) and od n = if n = 0 then false else ev (n - 1)',
    'ev 4',
  ], 'true');
});

test('a top-level function may call itself by name', () => {
  evalsSeq([
    'fun fact n = if n = 0 then 1 else n * fact (n - 1)',
    'fact 5',
  ], '120');
});

test('a binding persists across lines, the way a top level works', () => {
  const s = session();
  s.run('val kept = 11');
  s.run('val other = 1');
  assert.equal(s.run('kept').text, '11');
});

test('the value restriction: only a syntactic value generalises', () => {
  // fun id x = x serves both types from one definition...
  const s = session();
  s.run('fun id x = x');
  assert.equal(s.run('id 1').text, '1');
  assert.equal(s.run('id "a"').text, '"a"');
  // ...while a ref cell may not claim a polymorphism it does not have.
  assert.equal(s.type('val q = ref nil'), "'a list ref");
});

test('a type annotation on a binding is accepted and checked', () => {
  types('val f2 : int -> int = fn x => x', 'int -> int');
  evalsSeq(['val n : int = 1', 'n'], '1');
  evals('(1 : int)', '1');
  types('fn (x : int) => x', 'int -> int');
});
