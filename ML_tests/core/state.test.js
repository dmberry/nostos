// References, equality, and exceptions: the three places where a value's
// identity, rather than its shape, decides what happens.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evals, evalsSeq, refuses, session, types } from '../harness/expect.mjs';

// ---- references -----------------------------------------------------------

test('a ref cell holds, reads back and assigns', () => {
  evalsSeq(['val r = ref 0', '!r'], '0');
  evalsSeq(['val r = ref 0', 'r := 5', '!r'], '5');
  types('ref 1', 'int ref');
  types('!(ref 1)', 'int');
  types('(ref 1) := 2', 'unit');
});

test('assignment yields unit, not the value assigned', () => {
  evalsSeq(['val r = ref 0', 'r := 5'], '()');
});

test('two names for one cell see one another’s writes', () => {
  evalsSeq(['val r = ref 1', 'val alias = r', 'alias := 9', '!r'], '9');
});

test('a cell is equal to itself and to no other cell', () => {
  // Equality on refs is identity: two cells holding 1 are two cells.
  evalsSeq(['val r = ref 1', 'r = r'], 'true');
  evals('ref 1 = ref 1', 'false');
});

test('the value restriction stops a ref claiming a polymorphism it lacks', () => {
  types('val q = ref nil', "'a list ref");
  const s = session();
  s.run('val q = ref nil');
  s.run('q := [1]');
  assert.equal(s.run('!q').text, '[1]');
});

// ---- equality -------------------------------------------------------------

test('equality is structural on everything that has structure', () => {
  evals('1 = 1', 'true');
  evals('"a" = "a"', 'true');
  evals('1.0 = 1.0', 'true');
  evals('true = true', 'true');
  evals('(1, 2) = (1, 2)', 'true');
  evals('[1, 2] = [1, 2]', 'true');
  evals('{x = 1} = {x = 1}', 'true');
  evals('nil = nil', 'true');
});

test('<> is the negation of =', () => {
  evals('1 <> 2', 'true');
  evals('1 <> 1', 'false');
  evals('[1] <> [2]', 'true');
});

test('functions cannot be compared, and the refusal says why', () => {
  // SML makes this a type error through equality types. This build cannot
  // refuse at the type level, so it refuses at the comparison instead, which
  // is the documented departure rather than a silently wrong `false`.
  refuses('(fn x => x) = (fn x => x)', /function|equality/);
});

// ---- exceptions -----------------------------------------------------------

test('an exception is declared, raised and handled', () => {
  evalsSeq(['exception Boom', '(raise Boom) handle Boom => "caught"'], '"caught"');
});

test('an exception may carry a value', () => {
  evalsSeq(['exception Named of int', '(raise Named 3) handle Named n => n'], '3');
});

test('a handler that does not match lets the exception through', () => {
  const s = session();
  s.run('exception A');
  s.run('exception B');
  const r = s.run('(raise A) handle B => "wrong"');
  assert.equal(r.ok, false, 'A is not caught by a handler for B');
});

test('a wildcard handler catches anything', () => {
  evalsSeq(['exception Boom', '(raise Boom) handle _ => "any"'], '"any"');
});

test('a handler on an expression that does not raise is not taken', () => {
  evalsSeq(['exception Boom', '1 handle Boom => 2'], '1');
});

test('an uncaught exception is reported and does not crash the console', () => {
  const s = session();
  s.run('exception Boom');
  const r = s.run('raise Boom');
  assert.equal(r.ok, false);
  assert.match(String(r.text), /Boom/, 'the exception is named');
  // The session survives it.
  assert.equal(s.run('1 + 1').text, '2');
});

test('handle composes with the rest of an expression', () => {
  evalsSeq([
    'exception Fail2',
    'fun risky n = if n < 0 then raise Fail2 else n',
    '(risky ~1 handle Fail2 => 0) + 10',
  ], '10');
});
