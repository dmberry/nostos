// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// Data: datatypes and constructors, tuples, records, lists, strings.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evals, evalsSeq, refuses, session, types } from '../harness/expect.mjs';

// ---- datatypes ------------------------------------------------------------

test('a datatype declares constructors you can build and take apart', () => {
  const s = session();
  s.run('datatype colour = Red | Green | Blue');
  assert.equal(s.run('Red').text, 'Red');
  assert.equal(s.run('case Green of Red => 1 | Green => 2 | Blue => 3').text, '2');
});

test('constructors carry a payload, and a case gets it back', () => {
  const s = session();
  s.run('datatype shape = Circ of int | Rect of int * int');
  assert.equal(s.run('Circ 3').text, 'Circ 3');
  assert.equal(s.run('case Rect (2, 3) of Circ r => r | Rect (w, h) => w * h').text, '6');
  assert.equal(s.run('case Circ 3 of Circ r => r | Rect (w, h) => w * h').text, '3');
});

test('a multi-argument constructor keeps its payload', () => {
  // Constructor arguments once parsed greedily, so `Node a b` read as
  // `Node (a b)` and no pattern ever matched.
  const s = session();
  s.run('datatype d = A of int | B of int * int');
  assert.equal(s.run('B (1, 2)').text, 'B (1, 2)');
  assert.equal(s.run('B (1, 2) = B (1, 2)').text, 'true');
  assert.equal(s.run('B (1, 2) = B (1, 3)').text, 'false');
});

test('a datatype may take type variables', () => {
  const s = session();
  s.run("datatype 'a opt = Non | Som of 'a");
  assert.equal(s.run('Som 5').text, 'Som 5');
  assert.equal(s.run('Som "a"').text, 'Som "a"');
  assert.equal(s.run('case Som 5 of Non => 0 | Som n => n').text, '5');
});

test('a recursive datatype builds a tree', () => {
  evalsSeq([
    'datatype tree = Leaf | Node of tree * int * tree',
    'fun total Leaf = 0 | total (Node (l, v, r)) = total l + v + total r',
    'total (Node (Node (Leaf, 1, Leaf), 2, Node (Leaf, 3, Leaf)))',
  ], '6');
});

test('constructors compare structurally', () => {
  const s = session();
  s.run('datatype colour = Red | Green');
  assert.equal(s.run('Red = Red').text, 'true');
  assert.equal(s.run('Red = Green').text, 'false');
});

// ---- tuples ---------------------------------------------------------------

test('tuples hold values of different types', () => {
  evals('(1, "a", true)', '(1, "a", true)');
  types('(1, "a")', 'int * string');
  evals('#1 (1, 2)', '1');
  evals('#2 (1, 2)', '2');
});

test('a tuple compares by its parts', () => {
  evals('(1, 2) = (1, 2)', 'true');
  evals('(1, 2) = (1, 3)', 'false');
});

// ---- records --------------------------------------------------------------

test('a record is addressed by label, in any order', () => {
  evals('{a = 1, b = 2}', '{a = 1, b = 2}');
  evals('#a {a = 1, b = 2}', '1');
  // Field order is not part of a record's identity.
  evals('{a = 1, b = 2} = {b = 2, a = 1}', 'true');
  types('{a = 1, b = 2}', '{a : int, b : int}');
});

test('a record pattern may name some fields and ignore the rest', () => {
  evalsSeq(['fun proj {a = x, ...} = x', 'proj {a = 7, b = 8}'], '7');
  evalsSeq(['val {a, b} = {a = 1, b = 2}', 'b'], '2');
});

// ---- lists ----------------------------------------------------------------

test('the two cases a list has, and the two ways to write the empty one', () => {
  evals('[1, 2, 3]', '[1, 2, 3]');
  evals('nil', '[]');
  evals('[]', '[]');
  evals('1 :: [2]', '[1, 2]');
  evals('nil = []', 'true');
});

test('lists are homogeneous and nest', () => {
  evals('[[1], [2]]', '[[1], [2]]');
  evals('[(1, 2)]', '[(1, 2)]');
  types('[1, 2]', 'int list');
  types('[[1]]', 'int list list');
  types('nil', "'a list");
});

test('hd, tl, length and @', () => {
  evals('hd [1, 2]', '1');
  evals('tl [1, 2]', '[2]');
  evals('length [1, 2, 3]', '3');
  evals('[1] @ [2, 3]', '[1, 2, 3]');
  evals('[] @ [1]', '[1]');
});

test('lists compare element by element', () => {
  // This was false for every list until v1.255: valuesEqual compared a tag and
  // one field, and no test had asked.
  evals('[1, 2] = [1, 2]', 'true');
  evals('[1, 2] = [1, 3]', 'false');
  evals('[1] = [1, 2]', 'false');
});

test('the List structure covers the working set', () => {
  evals('List.rev [1, 2, 3]', '[3, 2, 1]');
  evals('List.map (fn x => x + 1) [1, 2]', '[2, 3]');
  evals('List.filter (fn x => x > 1) [1, 2, 3]', '[2, 3]');
  evals('List.exists (fn x => x > 2) [1, 2]', 'false');
  evals('List.nth ([1, 2, 3], 1)', '2');
  evals('List.take ([1, 2, 3], 2)', '[1, 2]');
});

// ---- strings --------------------------------------------------------------

test('strings concatenate, measure and take apart', () => {
  evals('"a" ^ "b"', '"ab"');
  evals('size "abc"', '3');
  evals('explode "ab"', '[#"a", #"b"]');
  evals('implode [#"a", #"b"]', '"ab"');
  evals('String.size "abc"', '3');
  evals('String.sub ("abc", 1)', '#"b"');
});

test('explode and implode round-trip', () => {
  evals('implode (explode "hello")', '"hello"');
  evals('implode (List.rev (explode "abc"))', '"cba"');
});

test('strings compare for equality even where they do not compare for order', () => {
  // Ordering is D-30; equality has always worked.
  evals('"a" = "a"', 'true');
  evals('"a" = "b"', 'false');
});
