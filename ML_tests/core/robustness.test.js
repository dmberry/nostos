// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// Robustness: what happens when a program is wrong, enormous, or never comes
// back. The contract the design has stated since the first console is that the
// operator is shown a teaching error and never a raw engine message.
//
// That contract is the one most likely to be broken by a refactor, because it
// governs the paths that only run when something has already gone wrong, and
// those are the paths nobody exercises by hand.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { session, gameRaw, hasGame, noJsLeak } from '../harness/expect.mjs';

// A spread of ways to be wrong: unterminated forms, truncated forms, wrong
// arities, empty input, and the sort of thing a player types by accident.
const MALFORMED = [
  '', ' ', '\n', '(', ')', '()(', '[', ']', '[1,', '{', '{a', '{a =',
  'let', 'let val', 'let val x', 'let val x =', 'let val x = 1',
  'let val x = 1 in', 'if', 'if true', 'if true then', 'if true then 1 else',
  'fn', 'fn x', 'fn x =>', 'case', 'case 1', 'case 1 of', 'case 1 of 1 =>',
  'fun', 'fun f', 'fun f x', 'fun f x =', 'val', 'val =', '= 1',
  'datatype', 'datatype t', 'datatype t =', 'datatype t = |',
  'structure', 'structure S =', 'structure S = struct', 'sig', 'end', 'in',
  'exception', 'raise', 'handle', '1 handle', 'raise 1',
  '"unterminated', '#"', '(*', '(* unterminated', '~', '::', '@', '|',
  '1 +', '+ 1', '1 + + 2', 'hd', 'hd hd', '1 1', '"a" "b"',
  'f', 'f f', 'x.y', '.', '..', '...', '#', '#0 (1,2)', '#9 (1,2)',
  'infix', 'infix 9', 'infix abc', 'nonfix', 'op', 'op op',
  'val rec', 'and', 'val x = 1 and', 'local', 'local in', 'local in end',
];

test('no malformed input reaches the operator as a JavaScript error', () => {
  const s = session();
  for (const src of MALFORMED) {
    let r;
    try {
      r = s.run(src);
    } catch (e) {
      assert.fail(`${JSON.stringify(src)} threw out of the interpreter: ${e && e.message}`);
    }
    assert.ok(r && typeof r.text === 'string',
      `${JSON.stringify(src)} returned no text: ${JSON.stringify(r)}`);
    noJsLeak(r.text, src);
  }
});

test('a malformed line does not poison the session', () => {
  const s = session();
  s.run('val good = 1');
  for (const src of MALFORMED) s.run(src);
  assert.equal(s.run('good').text, '1', 'the earlier binding survived');
  assert.equal(s.run('1 + 1').text, '2', 'the session still evaluates');
});

// Truncating a valid program is how most real syntax errors are made: the
// player is half way through typing. Every prefix must be refused politely.
const WHOLE = [
  'fun fact n = if n = 0 then 1 else n * fact (n - 1)',
  'case [1,2] of nil => 0 | h :: t => h',
  'structure S = struct val v = 1 fun f x = x end',
  'datatype tree = Leaf | Node of tree * int * tree',
  'let val a = 1 val b = 2 in a + b end',
  'val {a, b} = {a = 1, b = 2}',
  '(raise Boom) handle Boom => "caught"',
];

test('every prefix of a valid program is refused without leaking', () => {
  const s = session();
  for (const whole of WHOLE) {
    for (let i = 1; i < whole.length; i++) {
      const src = whole.slice(0, i);
      let r;
      try {
        r = s.run(src);
      } catch (e) {
        assert.fail(`prefix ${JSON.stringify(src)} threw: ${e && e.message}`);
      }
      noJsLeak(r.text, src);
    }
  }
});

// ---- programs that never come back ---------------------------------------

// decide() is the game's machine contract; the language equivalent is covered
// by the deep-recursion test below, which runs everywhere.
test('a runaway program faults on the step budget rather than hanging', { skip: !hasGame && 'no game in this repo' }, () => {
  const { decide } = gameRaw;
  const r = decide('let f x = f x in f 1', {});
  assert.equal(r.ok, false);
  assert.match(String(r.fault), /step budget/,
    'a machine whose program never returns must FAULT, not throw');
  noJsLeak(r.fault, 'runaway program');
});

test('a runaway program still faults cleanly when the host stack is already deep', { skip: !hasGame && 'no game in this repo' }, () => {
  // Since v1.303 `f x = f x` is a tail call and uses no stack at all, so this
  // now proves something narrower than it once did: whatever the host stack has
  // left, the fault is the step budget and the words are the language's. The
  // depths are kept because non-tail recursion still lives on the host stack,
  // and a future change could put this path back on it.
  const { decide } = gameRaw;
  const atDepth = (n, fn) => (n <= 0 ? fn() : atDepth(n - 1, fn));
  for (const depth of [0, 250, 750, 1500, 2500]) {
    let r;
    try {
      r = atDepth(depth, () => decide('let f x = f x in f 1', {}));
    } catch (e) {
      assert.fail(`at host depth ${depth} the interpreter threw ${e && e.constructor.name}: ${e && e.message}`);
    }
    assert.equal(r.ok, false, `at host depth ${depth} the runaway program should fault`);
    noJsLeak(r.fault, `runaway at host depth ${depth}`);
    assert.match(String(r.fault), /step budget/,
      `at host depth ${depth} the fault was ${JSON.stringify(r.fault)}`);
  }
});

test('deep tail recursion finishes, at any depth the budget allows', () => {
  // Written when it could not, and `count 2000` was a coin toss on how deep the
  // test runner already was. Standard ML requires proper tail calls, so from
  // v1.303 every one of these must ANSWER, not merely fail politely.
  const s = session({ types: 'off' });
  s.run('fun count n = if n = 0 then 0 else count (n - 1)');
  for (const n of [10, 100, 400, 2000, 20000]) {
    let r;
    try {
      r = s.run(`count ${n}`);
    } catch (e) {
      assert.fail(`count ${n} threw ${e && e.constructor.name}: ${e && e.message}`);
    }
    noJsLeak(r.text, `count ${n}`);
    assert.equal(r.ok, true, `count ${n} must finish: it is a tail call`);
    assert.equal(r.text, '0', `count ${n} should be 0`);
  }
  // 20000 is not a stack ceiling, it is the console's 200000-step budget at
  // about eight steps an iteration. Past it the answer is the budget's, and it
  // says which one it is. `count 200000` under raised fuel is in
  // test/lang-interp.test.js.
  const over = s.run('count 25000');
  assert.equal(over.ok, false);
  assert.match(String(over.text), /step budget/);
  noJsLeak(over.text, 'count past the budget');
});

test('the console survives a fault and keeps its bindings', () => {
  const s = session();
  s.run('val kept = 5');
  s.run('let f x = f x in f 1');
  assert.equal(s.run('kept').text, '5');
});

// ---- one line, one answer -------------------------------------------------

test('every run returns the same shape whatever happens', () => {
  const s = session();
  for (const src of ['1 + 1', 'nonsense', '(', 'val x = 1', 'raise Nope']) {
    const r = s.run(src);
    assert.equal(typeof r.ok, 'boolean', `${src}: ok must be a boolean`);
    assert.equal(typeof r.text, 'string', `${src}: text must be a string`);
  }
});
