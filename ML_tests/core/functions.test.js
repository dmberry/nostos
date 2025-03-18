// Functions and pattern matching: currying, closures, clausal definitions,
// the shapes a pattern can take, and exhaustiveness.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evals, evalsSeq, refuses, session, types, warnsMissing } from '../harness/expect.mjs';

// ---- functions ------------------------------------------------------------

test('fn is a value and applies', () => {
  evals('(fn x => x + 1) 4', '5');
  evals('(fn x => fn y => x) "keep" "drop"', '"keep"');
});

test('every function of several arguments is curried', () => {
  evalsSeq(['fun add a b = a + b', 'add 1 2'], '3');
  // Supplying too few arguments gives a function, not an error.
  evalsSeq(['fun add a b = a + b', 'val inc = add 1', 'inc 10'], '11');
  types('fn a => fn b => a + b', 'int -> int -> int');
});

test('a tuple argument is one argument, and types differently from currying', () => {
  evalsSeq(['fun swap (a, b) = (b, a)', 'swap (1, 2)'], '(2, 1)');
  types('fn (a, b) => a', "('a * 'b) -> 'a");
  types('fn a => fn b => a', "'a -> 'b -> 'a");
});

test('a closure over a let-bound name captures it', () => {
  evalsSeq([
    'val z = 10',
    'val f = let val z2 = z in fn m => m + z2 end',
    'val z = 99',
    'f 1',
  ], '11');
});

// Retired from the departure register at v1.291 (was D-54): the top level is
// lexically scoped. A later `val n = ...` SHADOWS, adding a binding and leaving
// the old one in place for everything already elaborated against it. Until
// v1.291 the session was one mutable environment, so this answered 100, and a
// function could change meaning because a name it used was later reused.
test('a top-level rebinding shadows and does not reach back into what was defined', () => {
  evalsSeq([
    'val n = 10',
    'fun addn m = m + n',
    'val n = 99',
    'addn 1',
  ], '11');
  evalsSeq([
    'val k = 1',
    'val addk = fn m => m + k',
    'val k = 50',
    'addk 1',
  ], '2');
});

test('a function is polymorphic where nothing constrains it', () => {
  types('fn x => x', "'a -> 'a");
  const s = session();
  s.run('fun id x = x');
  assert.equal(s.run('id 1').text, '1');
  assert.equal(s.run('id "a"').text, '"a"');
  assert.equal(s.run('id [1]').text, '[1]');
});

// ---- clausal definitions --------------------------------------------------

test('a function may be defined by clauses, which is how ML is written', () => {
  evalsSeq(['fun len nil = 0 | len (_ :: t) = 1 + len t', 'len [1,2,3]'], '3');
  evalsSeq(['fun g 0 = "zero" | g _ = "other"', 'g 0'], '"zero"');
  evalsSeq(['fun g 0 = "zero" | g _ = "other"', 'g 7'], '"other"');
});

test('clauses are tried in order', () => {
  evalsSeq([
    'fun f 0 = "first" | f 1 = "second" | f _ = "rest"',
    'f 1',
  ], '"second"');
});

test('nil in a parameter is the empty list, not a fresh variable', () => {
  // This was wrong once, and silently: `fun length nil = 0 | ...` bound a
  // variable called nil, matched every list and answered 0 for all of them.
  evalsSeq(['fun len nil = 0 | len (_ :: t) = 1 + len t', 'len [1,2,3]'], '3');
  evalsSeq(['fun len nil = 0 | len (_ :: t) = 1 + len t', 'len nil'], '0');
});

test('fn takes alternatives too', () => {
  evals('(fn 0 => "z" | _ => "nz") 0', '"z"');
  evals('(fn 0 => "z" | _ => "nz") 5', '"nz"');
});

// ---- patterns -------------------------------------------------------------

test('constant, variable and wildcard patterns', () => {
  evals('case 1 of 1 => "one" | _ => "other"', '"one"');
  evals('case 5 of 1 => "one" | n => "got"', '"got"');
  evals('case "s" of "s" => "yes" | _ => "no"', '"yes"');
});

test('tuple and record patterns take their pieces apart', () => {
  evals('case (1, 2) of (a, b) => a + b', '3');
  evals('case {a = 1, b = 2} of {a, b} => a + b', '3');
  evalsSeq(['fun proj {a = x, ...} = x', 'proj {a = 7, b = 8}'], '7');
});

test('list patterns separate the two cases a list has', () => {
  evals('case [1,2] of nil => "empty" | h :: t => "cons"', '"cons"');
  evals('case [] of nil => "empty" | h :: t => "cons"', '"empty"');
  evals('case [1,2,3] of a :: b :: rest => a + b | _ => 0', '3');
});

test('an as-pattern names the whole and the parts at once', () => {
  evalsSeq(['fun whole (all as (a, b)) = all', 'whole (1, 2)'], '(1, 2)');
  evals('case [1,2] of (whole as h :: _) => h | _ => 0', '1');
});

test('a pattern that matches nothing is a runtime error, not a wrong answer', () => {
  refuses('case 3 of 1 => "a" | 2 => "b"', /no case matches|Match/);
});

// ---- exhaustiveness -------------------------------------------------------

test('a case missing a constructor is warned about, by name', () => {
  const s = session();
  s.run('datatype colour = Red | Green | Blue');
  assert.match(String(s.type('case Red of Red => 1 | Green => 2')),
    /WARNING: this case does not cover Blue/,
    'the missing constructor is named, not merely counted');
  // The warning rides alongside the type; the line still runs.
  assert.equal(s.run('case Red of Red => 1 | Green => 2').text, '1');
});

test('a case missing a list case is warned about', () => {
  const s = session({ types: 'report' });
  assert.match(String(s.type('fun first (x :: _) = x')), /does not cover nil/);
});

test('a wildcard or variable arm ends the check', () => {
  const s = session();
  s.run('datatype colour = Red | Green | Blue');
  const t = String(s.type('case Red of Red => 1 | _ => 2'));
  assert.ok(!/does not cover/.test(t), `a wildcard covers the rest, got ${t}`);
});
