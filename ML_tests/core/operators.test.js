// Operator conformance: precedence, associativity, short-circuiting, and the
// fixity declarations that let a program change all three.
//
// Precedence is the part of a language most likely to be silently wrong: a
// mis-levelled operator does not fail, it returns a different answer. The
// levels asserted here are Standard ML's own, and each case is chosen so that
// the two possible parses give DIFFERENT results. An expression that comes out
// the same either way proves nothing and is not worth a line.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evals, evalsSeq, refuses, session } from '../harness/expect.mjs';

// ---- arithmetic levels ----------------------------------------------------

test('* / div mod bind tighter than + - ^ (levels 7 and 6)', () => {
  evals('2 + 3 * 4', '14');          // 20 if + bound tighter
  evals('2 * 3 + 4', '10');          // 14 if + bound tighter
  evals('1 + 2 * 3 - 4 div 2', '5'); // 1 + 6 - 2
});

test('arithmetic at one level is left-associative', () => {
  evals('1 - 2 - 3', '~4');          // 2 if right-associative
  evals('12 div 3 div 2', '2');      // 8 if right-associative
  evals('10 - 3 - 2 - 1', '4');
});

test('^ sits with + and - at 6, not with * at 7', () => {
  // The parser used to put ^ at 7. The case that tells them apart needs a
  // string concatenation next to something at level 6.
  evals('"a" ^ "b" ^ "c"', '"abc"');
  const s = session();
  assert.equal(s.run('"n=" ^ "1"').text, '"n=1"');
});

test(':: and @ are right-associative at level 5', () => {
  evals('1 :: 2 :: nil', '[1, 2]');       // left-assoc would be a type error
  evals('[1] @ [2] @ [3]', '[1, 2, 3]');
  evals('1 :: 2 :: 3 :: nil', '[1, 2, 3]');
});

test('comparison sits below arithmetic at level 4', () => {
  evals('1 + 2 = 3', 'true');        // (1+2) = 3, not 1 + (2=3)
  evals('2 * 3 < 7', 'true');
  evals('1 + 1 <> 3', 'true');
});

test('andalso and orelse sit below comparison', () => {
  evals('1 < 2 andalso 2 < 3', 'true');
  evals('2 + 3 = 5 andalso 1 < 2', 'true');
  evals('1 > 2 orelse 3 > 2', 'true');
});

// The one case that separates andalso from orelse is in the departure register
// as D-01: `true orelse true andalso false` answers false here and true in SML.

test('andalso and orelse really do short-circuit', () => {
  // If the right-hand side were evaluated, hd nil would end the line.
  evalsSeq(['fun boom x = hd nil', 'false andalso boom 1 = 1'], 'false');
  evalsSeq(['fun boom x = hd nil', 'true orelse boom 1 = 1'], 'true');
});

test('if is an expression and chooses only one branch', () => {
  evals('if 1 < 2 then "y" else "n"', '"y"');
  evalsSeq(['fun boom x = hd nil', 'if true then 1 else boom 1'], '1');
});

// ---- fixity declarations --------------------------------------------------

test('infix makes a two-argument function usable between its arguments', () => {
  evalsSeq(['infix 6 plus', 'fun plus (a, b) = a + b', '1 plus 2'], '3');
});

test('nonfix puts it back', () => {
  evalsSeq(['infix 6 plus', 'fun plus (a, b) = a + b', 'nonfix plus', 'plus (1, 2)'], '3');
});

test('op strips fixity so a built-in operator can be passed as a value', () => {
  evals('op + (1, 2)', '3');
  evals('op :: (1, [2])', '[1, 2]');
  const s = session();
  assert.equal(s.run('op +').text, '<fn>', 'op + on its own is the function');
});

test('a declared fixity level is respected, not just the default table', () => {
  // times binds tighter than the default 6 of +, so this is 1 + (2 times 3).
  evalsSeq([
    'infix 7 times', 'fun times (a, b) = a * b',
    '1 + 2 times 3',
  ], '7');
  // At level 5 it would bind looser than +, giving (1 + 2) * 3 = 9.
  evalsSeq([
    'infix 5 tighter', 'fun tighter (a, b) = a * b',
    '1 + 2 tighter 3',
  ], '9');
});

test('infixr associates to the right where infix associates to the left', () => {
  // Subtraction is not associative, so the two directions give different answers.
  evalsSeq(['infix 6 subl', 'fun subl (a, b) = a - b', '10 subl 3 subl 2'], '5');
  evalsSeq(['infixr 6 subr', 'fun subr (a, b) = a - b', '10 subr 3 subr 2'], '9');
});

test('a fixity declaration does not leak out of the block that made it', () => {
  // The parser keeps its own copy so an infix inside a structure cannot change
  // how the lines after the structure are read.
  const s = session();
  s.run('structure Q = struct infix 6 loc fun loc (a, b) = a + b val r = 1 loc 2 end');
  const after = s.run('1 loc 2');
  assert.equal(after.ok, false, 'loc should not be infix out here');
});
