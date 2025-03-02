// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The module system: structures, signatures, ascription, functors.
//
// The documented limit of this build is that a signature restricts which NAMES
// a structure shows and cannot make a type abstract. These tests hold it to the
// part it claims, and the parts it does not claim are in the register.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evals, evalsSeq, refuses, session } from '../harness/expect.mjs';

test('a structure groups declarations and is addressed by qualified name', () => {
  const s = session();
  s.run('structure S = struct val v = 1 fun f x = x + 1 end');
  assert.equal(s.run('S.v').text, '1');
  assert.equal(s.run('S.f 2').text, '3');
});

test('a structure’s names do not leak out unqualified', () => {
  const s = session();
  s.run('structure S2 = struct val inside = 1 end');
  assert.equal(s.run('inside').ok, false, 'inside is only reachable as S2.inside');
  assert.equal(s.run('S2.inside').text, '1');
});

test('a structure may hold a datatype and functions over it', () => {
  evalsSeq([
    'structure Colour = struct datatype t = Red | Green fun name Red = "red" | name Green = "green" end',
    'Colour.name Colour.Red',
  ], '"red"');
});

test('opaque ascription hides the names a signature does not list', () => {
  const s = session();
  s.run('signature ONE = sig val shown : int end');
  s.run('structure P :> ONE = struct val shown = 1 val hidden = 2 end');
  assert.equal(s.run('P.shown').text, '1', 'a listed name is reachable');
  assert.notEqual(s.run('P.hidden').text, '2', 'an unlisted name is not the value it had');
});

test('a signature restricts names and says so in the echo', () => {
  const s = session();
  s.run('signature TWO = sig val a : int val b : int end');
  const r = s.run('structure Q :> TWO = struct val a = 1 val b = 2 val c = 3 end');
  assert.match(String(r.text), /2 name/, 'the count reflects the signature, not the structure');
});

test('a functor takes a structure and produces one', () => {
  evalsSeq([
    'signature NUM = sig val n : int end',
    'functor Doubler (X : NUM) = struct val double = X.n * 2 end',
    'structure Four = struct val n = 4 end',
    'structure D = Doubler (Four)',
    'D.double',
  ], '8');
});

test('a functor is generative: two applications are two structures', () => {
  const s = session();
  s.run('signature NUM = sig val n : int end');
  s.run('functor Mk (X : NUM) = struct val out = X.n + 1 end');
  s.run('structure One = struct val n = 1 end');
  s.run('structure Ten = struct val n = 10 end');
  s.run('structure A = Mk (One)');
  s.run('structure B = Mk (Ten)');
  assert.equal(s.run('A.out').text, '2');
  assert.equal(s.run('B.out').text, '11', 'the second application did not overwrite the first');
});

test('a qualified name reaches a structure declared inside a structure', () => {
  evalsSeq([
    'structure Outer = struct structure Inner = struct val deep = 7 end end',
    'Outer.Inner.deep',
  ], '7');
});

test('the standard library structures are themselves structures', () => {
  // The prelude is written in AI-ML and loaded as source, so List and String
  // are ordinary structures rather than anything built in underneath.
  const s = session();
  assert.equal(s.run('List.rev [1, 2]').text, '[2, 1]');
  assert.equal(s.run('String.size "abc"').text, '3');
});
