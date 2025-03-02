// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// Lexical conformance: literals, escapes, comments.
//
// Everything asserted here is what Standard ML does. Where this build differs,
// the case lives in ML_tests/harness/departures.mjs instead, so that this file
// stays a statement about the language rather than about the implementation.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evals, refuses, types, session } from '../harness/expect.mjs';

// ---- integer and real literals -------------------------------------------

test('integers, and ~ is negation rather than a minus sign', () => {
  evals('42', '42');
  evals('0', '0');
  // SML both reads and PRINTS negatives with a tilde: - is binary only.
  evals('~3', '~3');
  evals('~0', '0');
  evals('0 - 5', '~5');
  evals('7 - ~2', '9');
});

test('reals are distinct from integers, and print with a point', () => {
  evals('3.14', '3.14');
  evals('~1.5', '~1.5');
  evals('2.0', '2.0');
  evals('2.0 - 3.0', '~1.0');
  types('2.0', 'real');
  types('2', 'int');
});

test('int and real do not mix, which is the whole reason they are separate', () => {
  // SML has no implicit coercion: 1 + 1.0 is a type error, not 2.0.
  refuses('1 + 1.0', /not the same kind of number|int and real/);
});

test('division truncates toward negative infinity, with mod following the divisor', () => {
  // SML's div/mod are floor-based, not JavaScript's truncation. ~7 div 2 is ~4
  // in SML and would be ~3 if this were JavaScript's trunc. mod takes the sign
  // of the divisor, so ~7 mod 2 is 1 and 7 mod ~2 is ~1.
  evals('7 div 2', '3');
  evals('~7 div 2', '~4');
  evals('7 div ~2', '~4');
  evals('7 mod 2', '1');
  evals('~7 mod 2', '1');
  evals('7 mod ~2', '~1');
});

// ---- strings and characters ----------------------------------------------

test('string escapes are the Standard ML set, not the characters after a backslash', () => {
  // Until v1.275 "a\nb" was the three letters a, n, b: the tokenizer copied
  // whatever followed the backslash. Nothing reported it, which is why the
  // round trip is asserted through size rather than by eye.
  evals('size "a\\nb"', '3');
  evals('size "a\\tb"', '3');
  evals('size "a\\\\b"', '3');
  evals('size "q\\"q"', '3');
  const s = session();
  assert.equal(s.run('"a\\nb"').text, '"a\\nb"', 'the escape survives the round trip');
  assert.equal(s.run('"a\\tb"').text, '"a\\tb"');
});

test('the numeric escape is exactly three decimal digits', () => {
  evals('size "\\065"', '1');
  const s = session();
  assert.equal(s.run('"\\065"').text, '"A"');
});

test('an unknown escape is reported rather than swallowed', () => {
  refuses('"bad\\q"', /escape/);
});

test('characters are their own type', () => {
  evals('#"a"', '#"a"');
  types('#"a"', 'char');
  evals('#"\\n"', '#"\\n"');
  refuses('#"ab"', /one letter|character/);
});

test('a string is not a character and the types say so', () => {
  types('"a"', 'string');
  types('#"a"', 'char');
});

// ---- comments -------------------------------------------------------------

test('comments are stripped and do not change the value', () => {
  evals('(* a comment *) 1', '1');
  evals('1 (* after *)', '1');
  evals('1 + (* between *) 2', '3');
});

// ---- unit -----------------------------------------------------------------

test('unit is a value and prints as ()', () => {
  evals('()', '()');
});

// ---- identifiers ----------------------------------------------------------

test('alphanumeric identifiers take primes and underscores', () => {
  evals("let val x' = 1 in x' end", '1');
  evals('let val x_1 = 2 in x_1 end', '2');
});

test('an unbound name is refused rather than echoed back as a value', () => {
  // SML has no bare atoms: a name that was never bound is an error. The game's
  // consoles phrase it as a mistyped command, because a verb that echoed itself
  // back with a success chime would look like it had worked; that wording is a
  // wrapper concern and is tested in wrapper/machine-contract.test.js.
  refuses('hfhfh', /unbound|no such command/);
});
