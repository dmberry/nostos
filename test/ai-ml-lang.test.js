// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// AI-ML language additions (v1.187): string literals + `echo`, the BBC-Micro
// `*command` form (literal args), and "no such command" for a bare typo. Drives
// runRonml against a tiny self-contained ctx — no world, no DOM.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runRonml, decide, smlEcho, AIML_CREDIT, joinProgramLines, needsMoreInput, continuesPrevious, diagnose, joinProgram, typeReport, aimlVersion, aimlFull, NOT_FITTED_SAMPLES, loadPrelude, defaultFixity, PRELUDE, OB_VERBS, MACHINE_ONLY } from '../src/game/ai_ml.js';
import { docsPage } from '../src/game/ml-docs.js';
import { newShell, runUnix } from '../src/game/unix.js';
import { RELAY_FILES } from '../src/game/net.js';

function ctx() {
  return {
    station: 'ob',
    session: {},
    hasAiKey: () => true,
    bindSession(n, v) { this.session[n] = v; },
    poseidonTimer: () => '17:42 to POSEIDON',
    printMap() { this._printedMap = true; },
    printKey() {},
    showMap() { this._shownMap = true; },
    currentNode: () => 'OB_TEST',
    listObelisks: () => ['OB_1A2B', 'OB_3C4D'],
    heldKeys: () => new Set(),
  };
}

test('a bare string literal echoes itself (hello world)', () => {
  const r = runRonml('"hello world"', ctx());
  assert.equal(r.ok, true);
  assert.equal(r.text, 'hello world');
});

test('echo prints its argument — the language hello-world', () => {
  const r = runRonml('echo "hello world"', ctx());
  assert.equal(r.ok, true);
  assert.equal(r.text, 'hello world');
});

test('strings bind and read back through core ML (let ... in)', () => {
  const r = runRonml('let g = "hi AI-ML" in echo g', ctx());
  assert.equal(r.ok, true);
  assert.equal(r.text, 'hi AI-ML');
});

test('an unterminated string is a teaching error, not a crash', () => {
  const r = runRonml('echo "oops', ctx());
  assert.equal(r.ok, false);
  assert.match(r.text, /unterminated string/);
});

test('a bare typo is "no such command", not an echoed atom', () => {
  const r = runRonml('hfhfh', ctx());
  assert.equal(r.ok, false);
  assert.match(r.text, /no such command: hfhfh/);
});

test('node codes and filenames are still valid bare values (not typos)', () => {
  assert.equal(runRonml('OB_1A2B', ctx()).ok, true);   // node
  assert.equal(runRonml('foo.ml', ctx()).ok, true);    // file
});

test('*command runs a verb with LITERAL args (BBC-Micro form)', () => {
  const c = ctx();
  const r = runRonml('*timer', c);
  assert.equal(r.ok, true);
  assert.equal(r.text, '17:42 to POSEIDON');
});

test('*print map passes `map` as a literal topic — no verb collision', () => {
  const c = ctx();
  const r = runRonml('*print map', c);
  assert.equal(r.ok, true);
  assert.equal(c._printedMap, true, 'printMap ran');
  assert.equal(c._shownMap, undefined, 'the map overlay verb did NOT run');
});

test('*echo keeps a quoted string with spaces intact', () => {
  const r = runRonml('*echo "hi there"', ctx());
  assert.equal(r.ok, true);
  assert.equal(r.text, 'hi there');
});

test('*unknown is still "no such command"', () => {
  const r = runRonml('*nope', ctx());
  assert.equal(r.ok, false);
  assert.match(r.text, /no such command: nope/);
});

test('core ML composition is unchanged (scan |> nearest style still parses)', () => {
  // scan returns a list; piping into a list-consuming verb still evaluates.
  const r = runRonml('scan', ctx());
  assert.equal(r.ok, true);
  assert.match(r.text, /OB_1A2B/);
});

// ---- lambdas (v1.188) ----------------------------------------------------

test('a lambda applies: (fn x => x) 5', () => {
  assert.equal(runRonml('(fn x => x) 5', ctx()).text, '5');
});

test('let f x = e sugars to a lambda and binds', () => {
  const r = runRonml('let id = fn x => x in id 42', ctx());
  assert.equal(r.text, '42');
});

test('currying: let k a b = a keeps the first argument', () => {
  const r = runRonml('let k = fn a => fn b => a in k "keep" "drop"', ctx());
  assert.equal(r.text, 'keep', 'nested closure resolves the outer-scope binding');
});

test('higher-order: apply a passed function', () => {
  const r = runRonml('let apply = fn f => fn x => f x in apply echo "world"', ctx());
  assert.equal(r.text, 'world');
});

test('the let f x = sugar works at the top level too, and persists', () => {
  const c = ctx();
  runRonml('let twice = fn f => fn x => f (f x)', c); // TopLet
  const r = runRonml('twice (fn n => n + 1) 10', c);  // double application: +1 twice
  assert.equal(r.text, '12');
});

test('a top-level function sees its own name (recursion is possible)', () => {
  const c = ctx();
  runRonml('let self x = self', c);
  const r = runRonml('self 1', c);
  assert.equal(r.ok, true);
  assert.equal(r.text, '<fn>', 'the body resolved `self` to the bound closure');
});

test('a bare lambda is a value (<fn>), not "no such command"', () => {
  const r = runRonml('fn x => x', ctx());
  assert.equal(r.ok, true);
  assert.equal(r.text, '<fn>');
});

// ---- arithmetic + if (v1.196+) -------------------------------------------

test('arithmetic: precedence and grouping', () => {
  assert.equal(runRonml('2 + 3 * 4', ctx()).text, '14');   // * binds tighter than +
  assert.equal(runRonml('(2 + 3) * 4', ctx()).text, '20');
  assert.equal(runRonml('10 - 3 - 2', ctx()).text, '5');   // left-associative
  // int and real are separate types now, as in ML: div is whole-number
  // division and / is real. `12 / 4` is a type error, not 3.
  assert.equal(runRonml('12 div 4', ctx()).text, '3');
  assert.equal(runRonml('12.0 / 4.0', ctx()).text, '3.0');
  assert.match(runRonml('12 / 4', ctx()).text, /divides reals/);
});

test('unary minus and subtraction share the freed `-`', () => {
  assert.equal(runRonml('5 - 8', ctx()).text, '~3', 'SML writes a negative with a tilde');
  assert.equal(runRonml('-3', ctx()).text, '~3');
});

test('division by zero is a teaching error, not Infinity', () => {
  const r = runRonml('1.0 / 0.0', ctx());
  assert.equal(r.ok, false);
  assert.match(r.text, /division by zero/);
  assert.match(runRonml('1 div 0', ctx()).text, /Div — division by zero/);
});

test('^ joins values as text', () => {
  assert.equal(runRonml('"hi " ^ "there"', ctx()).text, 'hi there');
  assert.equal(runRonml('echo ("n=" ^ 5)', ctx()).text, 'n=5');
});

test('comparisons give true/false', () => {
  assert.equal(runRonml('3 < 5', ctx()).text, 'true');
  assert.equal(runRonml('3 > 5', ctx()).text, 'false');
  assert.equal(runRonml('4 == 4', ctx()).text, 'true');
  assert.equal(runRonml('4 != 4', ctx()).text, 'false');
  assert.equal(runRonml('4 >= 4', ctx()).text, 'true');
});

test('true/false are literals, not typos', () => {
  assert.equal(runRonml('true', ctx()).text, 'true');
  assert.equal(runRonml('false', ctx()).text, 'false');
});

test('if chooses its branch', () => {
  assert.equal(runRonml('if 1 == 1 then "yes" else "no"', ctx()).text, 'yes');
  assert.equal(runRonml('if 1 == 2 then "yes" else "no"', ctx()).text, 'no');
});

test('if with a non-boolean test is a teaching error', () => {
  const r = runRonml('if 3 then 1 else 0', ctx());
  assert.equal(r.ok, false);
  assert.match(r.text, /true\/false test/);
});

test('recursion terminates: factorial', () => {
  const c = ctx();
  runRonml('let fact n = if n == 0 then 1 else n * fact (n - 1)', c);   // TopLet, self-visible
  assert.equal(runRonml('fact 5', c).text, '120');
  assert.equal(runRonml('fact 0', c).text, '1');
});

test('recursion terminates: a countdown that stops at zero', () => {
  const c = ctx();
  runRonml('let sum n = if n == 0 then 0 else n + sum (n - 1)', c);
  assert.equal(runRonml('sum 10', c).text, '55');   // 10+9+...+1
});

test('node codes with underscores still parse as nodes (no `-` confusion)', () => {
  assert.equal(runRonml('OB_1A2B', ctx()).ok, true);
});

// ---- sequencing (;) + echo prints mid-evaluation --------------------------

test('echo prints, and ; sequences two prints onto their own lines', () => {
  const r = runRonml('echo "a" ; echo "b"', ctx());
  assert.equal(r.ok, true);
  assert.equal(r.text, 'a\nb');
});

test('a ; b returns b\'s value (a is run only for effect)', () => {
  const r = runRonml('echo "noise" ; 2 + 3', ctx());
  assert.equal(r.ok, true);
  assert.equal(r.text, 'noise\n5');   // printed line, then the value
});

test('a recursive echo ; recurse prints every step (the live countdown)', () => {
  const c = ctx();
  runRonml('let go n = if n == 0 then echo "liftoff" else (echo n ; go (n - 1))', c);
  const r = runRonml('go 3', c);
  assert.equal(r.ok, true);
  assert.equal(r.text, '3\n2\n1\nliftoff');
});

test('the parens round a sequence in an else are NOT optional', () => {
  // They were, and that was a departure from Standard ML nobody had noticed.
  // `if a then b else c ; d` reads as `(if a then b else c) ; d` in SML — `;`
  // binds looser than `if` — and it read as `if a then b else (c ; d)` here,
  // which is why the countdown terminated without them.
  //
  // Every place the game teaches this program parenthesises it (ml_ai.js:752,
  // ml-docs.js, the relay disk), so nothing documented changes. This test named
  // the parens "optional" and was the only thing relying on it.
  const c = ctx();
  const bare = runRonml('let go n = if n == 0 then echo "done" else echo n ; go (n - 1)', c);
  // v1.307: `;` at the top level separates DECLARATIONS, so this is two of
  // them — `go`, and then `go (n - 1)` with no `n` in scope, which is refused.
  // Standard ML reads it exactly this way. `go` is bound all the same.
  assert.equal(bare.ok, false, 'the second declaration has no n');
  assert.equal(runRonml('go', c).ok, true, 'and the first one bound go');

  const c2 = ctx();
  runRonml('let go2 n = if n == 0 then echo "done" else (echo n ; go2 (n - 1))', c2);
  assert.equal(runRonml('go2 2', c2).text, '2\n1\ndone', 'parenthesised, it counts down');
});

test('a sequence inside parentheses answers its LAST expression', () => {
  // `(if true then 1 else 2; 7)` answered 1, because the else branch read the
  // `;` as part of itself. Standard ML answers 7.
  const c = ctx();
  assert.equal(runRonml('(if true then 1 else 2; 7)', c).text, '7');
  assert.equal(runRonml('(1; 2; 3)', c).text, '3');
});

test('*echo still prints through the shared buffer (not "()")', () => {
  const r = runRonml('*echo "hi there"', ctx());
  assert.equal(r.ok, true);
  assert.equal(r.text, 'hi there');
});

// A function that echoes must still print when it is CALLED ON A LATER LINE.
// The hub builds a fresh ctx per command (ronmlCtx/laptopCtx in main.js), and a
// closure captures the ctx of the line that DEFINED it — so an output buffer hung
// off ctx swallowed everything a stored function printed. Regression for that.
test('a stored function still prints when called later with a FRESH ctx', () => {
  const session = {};                                  // the session persists...
  const line = () => ({ station: 'ob', session });     // ...but the ctx is new each line
  runRonml('let shout = fn x => echo x', line());
  assert.equal(runRonml('shout "here"', line()).text, 'here');
  runRonml('let go n = if n == 0 then echo "liftoff" else (echo n ; go (n - 1))', line());
  assert.equal(runRonml('go 3', line()).text, '3\n2\n1\nliftoff');
});

// ---- the laptop sandbox: the language without the world -------------------
// docs/PLAN.md — the laptop is off the network by design, so it carries
// the language core and `echo` and nothing that needs a wire. That IS the lesson.

const lap = () => ({ station: 'laptop', session: {} });

test('laptop: the whole language core works (this is the practice machine)', () => {
  const c = lap();
  assert.equal(runRonml('echo "hello world"', c).text, 'hello world');
  runRonml('let fact n = if n == 0 then 1 else n * fact (n - 1)', c);
  assert.equal(runRonml('fact 5', c).text, '120');
  assert.equal(runRonml('2 + 3 * 4', c).text, '14');
  assert.equal(runRonml('"a" ^ "b"', c).text, 'ab');
});

test('laptop: a live countdown runs offline, exactly as it would at a tower', () => {
  const c = lap();
  runRonml('let go n = if n == 0 then echo "liftoff" else (echo n ; go (n - 1))', c);
  assert.equal(runRonml('go 3', c).text, '3\n2\n1\nliftoff');
});

test('laptop: a tower verb is refused with a teaching error, not "no such command"', () => {
  for (const line of ['scan', 'crash OB_1A2B k', '*hack OB_1A2B']) {
    const r = runRonml(line, lap());
    assert.equal(r.ok, false);
    assert.match(r.text, /no network on this machine/);
    assert.match(r.text, /needs a tower/);
  }
});

test('laptop: help shows the language, not terminal verbs it does not have', () => {
  const r = runRonml('help', lap());
  assert.equal(r.ok, true);
  assert.match(r.text, /off the network/);
  assert.doesNotMatch(r.text, /\bhack\b.*take node/, 'no tower verb rows');
});

test('an obelisk still refuses a HERMES verb the old way (message unchanged there)', () => {
  const r = runRonml('archive', ctx());
  assert.equal(r.ok, false);
  assert.match(r.text, /isn't a command on this terminal/);
});

// ---- taking a list apart (v1.240) ------------------------------------------
//
// The language could BUILD lists from the day it had `scan`, and could do
// nothing with one. A program could be handed a list and had no way in, which
// is why engage.ml (returning [back, fire]) was awkward to write. hd/tl/length
// are the language's own, not a station's, so a robot with no network has them.
test('hd, tl and length take a list apart', () => {
  const ctx = () => ({ station: 'laptop', session: {} });
  const val = (src) => runRonml(src, ctx()).text;
  assert.equal(val('hd [1, 2, 3]'), '1');
  assert.equal(val('tl [1, 2, 3]'), '[2, 3]');
  assert.equal(val('length [1, 2, 3]'), '3');
  assert.equal(val('hd (tl [1, 2, 3])'), '2', 'they compose');
  assert.equal(val('length []'), '0', 'an empty list has a length');
  assert.equal(val('length "abcd"'), '4', 'a string has one too');
});

test('hd and tl refuse an empty list rather than returning nothing', () => {
  for (const src of ['hd []', 'tl []']) {
    const r = runRonml(src, { station: 'laptop', session: {} });
    assert.match(r.text, /empty/, `${src} says why`);
    assert.match(r.text, /length/, `${src} says what to do about it`);
  }
  assert.match(runRonml('hd 3', { station: 'laptop', session: {} }).text, /not a list/);
});

test('the list verbs reach a machine with no network at all', () => {
  // The whole point: a unit's program runs with no console, no files and no
  // wire, so anything it needs has to be in the language rather than the world.
  for (const src of ['hd [1, 2]', 'length [1, 2]']) {
    const r = runRonml(src, { station: 'robot', session: {} });
    assert.ok(!/needs a tower|no network/.test(String(r.text)), `${src} works on a unit`);
    assert.ok(!/ERR/.test(String(r.text)), `${src} actually evaluates`);
  }
});

// ---- mod (v1.240) ----------------------------------------------------------
test('mod is a word at the precedence of times and divide', () => {
  const val = (src) => runRonml(src, { station: 'laptop', session: {} }).text;
  assert.equal(val('7 mod 2'), '1');
  assert.equal(val('6 mod 3'), '0', 'the every-N-ticks case');
  assert.equal(val('1 + 7 mod 2'), '2', 'binds tighter than +');
  assert.equal(val('(0 - 7) mod 3'), '2', 'a negative wraps positive, not toward zero');
  assert.match(runRonml('1 mod 0', { station: 'laptop', session: {} }).text, /mod by zero/);
});

// ---- cons and nil (v1.242) -------------------------------------------------
//
// Standard ML builds a list from two cases: the empty list, and one value on
// the front of a list. Harper (1993, p.9): a list "is either empty, or it
// consists of a value of type t followed by a t list". AI-ML had the bracket
// notation from the start and neither of the two cases it abbreviates.
test('cons puts a value on the front of a list', () => {
  const val = (src) => runRonml(src, { station: 'laptop', session: {} }).text;
  assert.equal(val('1 :: nil'), '[1]');
  assert.equal(val('1 :: [2, 3]'), '[1, 2, 3]');
  assert.equal(val('nil'), '[]', 'nil is the empty list');
  assert.equal(val('length nil'), '0');
});

test('cons is right-associative, which is what makes the recursion work', () => {
  const val = (src) => runRonml(src, { station: 'laptop', session: {} }).text;
  // 1 :: 2 :: 3 :: nil must read as 1 :: (2 :: (3 :: nil)). Left-associative
  // it would try to cons onto a number on the very first step.
  assert.equal(val('1 :: 2 :: 3 :: nil'), '[1, 2, 3]');
  assert.equal(val('hd (1 :: 2 :: nil)'), '1');
  assert.equal(val('tl (1 :: 2 :: nil)'), '[2]');
});

test('cons refuses a right-hand side that is not a list', () => {
  const r = runRonml('1 :: 2', { station: 'laptop', session: {} });
  assert.match(r.text, /not a list/);
  assert.match(r.text, /puts a value on the front/, 'and says what :: is for');
});

test('cons and nil reach a machine running its own program', () => {
  const r = runRonml('length (1 :: nil)', { station: 'robot', session: {} });
  assert.equal(String(r.text), '1');
});

// ---- the docs teach a language that exists --------------------------------
//
// The Lists page quotes Harper and then shows the same ideas in this dialect.
// The quotations are his SML and will not run here, which is the point of
// showing both; everything presented as AI-ML must. A teaching page whose
// examples fail is worse than no teaching page.
test('every AI-ML example on the Lists and Datatypes pages runs', () => {
  const html = docsPage('lists', 'docs') + '\n' + docsPage('datatypes', 'docs');
  const blocks = [...html.matchAll(/<pre>([\s\S]*?)<\/pre>/g)].map((m) => m[1]);
  assert.ok(blocks.length >= 6, 'the page carries worked examples');
  const ctx = { station: 'laptop', session: {} };
  const failures = [];
  for (const b of blocks) {
    const lines = b.split('\n').map((l) => l.replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
    const prog = [];
    let cur = '';
    for (const l of lines) {
      if (!l.trim()) { if (cur) { prog.push(cur); cur = ''; } continue; }
      if (l.startsWith('>')) { if (cur) { prog.push(cur); cur = ''; } continue; }
      if (l.startsWith('  ')) cur += ` ${l.trim()}`;
      else { if (cur) prog.push(cur); cur = l.trim(); }
    }
    if (cur) prog.push(cur);
    for (const line of prog) {
      if (line.startsWith('fun ') || line.startsWith('|')) continue;   // Harper's SML, shown for contrast
      const r = runRonml(line.replace(/\s+\|\s+/g, ' | '), ctx);
      if (String(r.text).startsWith('ERR')) failures.push(`${line} => ${r.text}`);
    }
  }
  assert.deepEqual(failures, [], `examples that do not run:\n${failures.join('\n')}`);
});

test('the docs cite Harper rather than absorbing him', () => {
  const lists = docsPage('lists', 'docs');
  assert.match(lists, /Harper 1993, p\.9/, 'the list definition is attributed to a page');
  assert.match(lists, /Harper 1993, p\.29/, 'so is the map definition');
  const dt = docsPage('datatypes', 'docs');
  assert.match(dt, /Harper 1993, s\.2\.7/, 'the datatype declaration is attributed');
  assert.match(dt, /Harper 1993, p\.16/, 'and the sentence about what a pattern is');
  const refs = docsPage('references', 'docs');
  assert.match(refs, /Introduction to Standard ML/);
  assert.match(refs, /Carnegie Mellon/);
  assert.match(refs, /Milner/, 'the Definition is listed too');
});

// ---- datatypes, constructors, tuples and case (v1.243) ---------------------
//
// Adding `datatype` forced the matcher. Constructors you can build and cannot
// take apart is the same defect lists had before hd/tl: a way in with no way
// out. Harper (1993, s.2.7) declares the type and its value constructors in one
// binding, and s.2.4 gives matching as the way to decompose what they build.
const sess = () => ({ station: 'laptop', session: {} });

test('a datatype declares constructors that are values', () => {
  const ctx = sess();
  const run = (src) => runRonml(src, ctx).text;
  assert.match(run('datatype colour = Red | Blue | Yellow'), /Red \| Blue \| Yellow/);
  assert.equal(run('Red'), 'Red', 'a nullary constructor IS a value');
  assert.equal(run('Blue'), 'Blue');
});

test('a constructor with arguments collects them and then stops being a function', () => {
  const ctx = sess();
  const run = (src) => runRonml(src, ctx).text;
  run('datatype shape = Circle of num | Rect of num * num');
  assert.equal(run('Circle 3'), 'Circle 3');
  assert.equal(run('Rect (2, 4)'), 'Rect (2, 4)', 'arity comes from the * in the type');
  assert.match(run('Rect 2'), /Rect/, 'given too few it is still a function');
});

test('case picks the first arm that matches', () => {
  const ctx = sess();
  const run = (src) => runRonml(src, ctx).text;
  run('datatype shape = Circle of num | Rect of num * num');
  assert.equal(run('case Circle 3 of Circle r => r | Rect w h => w * h'), '3');
  assert.equal(run('case Rect 2 4 of Circle r => r | Rect w h => w * h'), '8');
  assert.equal(run('case 5 of 0 => 1 | _ => 99'), '99', 'wildcard catches the rest');
  assert.equal(run('case 0 of 0 => 1 | _ => 99'), '1', 'constants match by value');
});

test('patterns nest, and a constructor argument does not swallow the next one', () => {
  const ctx = sess();
  const run = (src) => runRonml(src, ctx).text;
  run('datatype tree = Leaf of num | Node of tree * tree');
  // `Node a b` must read as two arguments. Parsed greedily it would read as
  // `Node (a b)`, the arity would be 1, and nothing would ever match.
  assert.equal(run('case Node (Leaf 1) (Leaf 2) of Leaf n => n | Node a b => 99'), '99');
  assert.equal(run('case Node (Leaf 1) (Leaf 2) of Node (Leaf a) (Leaf b) => a + b | _ => 0'), '3');
});

test('a function can recur over a datatype it was given', () => {
  const ctx = sess();
  const run = (src) => runRonml(src, ctx).text;
  run('datatype tree = Leaf of num | Node of tree * tree');
  run('let size t = case t of Leaf n => 1 | Node a b => size a + size b');
  assert.equal(run('size (Node (Leaf 1) (Node (Leaf 2) (Leaf 3)))'), '3');
});

test('case matches lists by their two cases, which is what map is', () => {
  const ctx = sess();
  const run = (src) => runRonml(src, ctx).text;
  assert.equal(run('case [1,2,3] of nil => 0 | x :: rest => x'), '1');
  assert.equal(run('case nil of nil => 0 | x :: rest => x'), '0');
  // Harper's map (1993, p.29), which needed two clauses and now needs one case.
  run('let map f l = case l of nil => nil | x :: r => f x :: map f r');
  assert.equal(run('map (fn n => n * 2) [1, 2, 3]'), '[2, 4, 6]');
  run('let sum l = case l of nil => 0 | x :: r => x + sum r');
  assert.equal(run('sum [1, 2, 3, 4]'), '10');
});

test('tuples are values, and patterns take them apart', () => {
  const ctx = sess();
  const run = (src) => runRonml(src, ctx).text;
  assert.equal(run('(1, 2)'), '(1, 2)');
  assert.equal(run('(1, 2, 3)'), '(1, 2, 3)');
  assert.equal(run('(1)'), '1', 'one thing in brackets is just that thing');
  assert.equal(run('case (1, 2) of (a, b) => a + b'), '3');
  assert.equal(run('case (1, 2) of (a, b, c) => 0 | _ => 99'), '99', 'width must agree');
});

test('a case with no matching arm says so rather than returning nothing', () => {
  const ctx = sess();
  runRonml('datatype colour = Red | Blue', ctx);
  const r = runRonml('case Blue of Red => 1', ctx);
  assert.match(r.text, /no case matches/);
  assert.match(r.text, /_ =>/, 'and says how to catch the rest');
});

test('datatypes and case reach a machine running its own program', () => {
  const ctx = { station: 'robot', session: {} };
  runRonml('datatype mood = Calm | Alarmed', ctx);
  assert.equal(String(runRonml('case Alarmed of Calm => 0 | Alarmed => 1', ctx).text), '1');
});

// ---- the regexp matcher on the docs runs, end to end -----------------------
//
// The longest program in the documentation, adapted from Harper (1993). It is
// there as evidence that this is a language rather than a command set, so if it
// ever stops running the claim is false and the page has to change. Run as one
// program in one session, in the order printed, exactly as a reader would type
// it: a page of examples that only works out of order is not a page of examples.
test('the regexp matcher on the docs page parses and matches', () => {
  const html = docsPage('regexp', 'docs');
  const src = [...html.matchAll(/<pre>([\s\S]*?)<\/pre>/g)]
    .map((m) => m[1].replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"'))
    .join('\n');

  // Rebuild the typed lines: a continuation line is indented, an expected
  // result is prefixed with >.
  const prog = [];
  let cur = '';
  for (const raw of src.split('\n')) {
    if (!raw.trim()) { if (cur) { prog.push(cur); cur = ''; } continue; }
    if (/^>/.test(raw)) { if (cur) { prog.push(cur); cur = ''; } continue; }
    if (/^\s/.test(raw)) cur += ` ${raw.trim()}`;
    else { if (cur) prog.push(cur); cur = raw.trim(); }
  }
  if (cur) prog.push(cur);

  const ctx = { station: 'laptop', session: {} };
  const results = [];
  for (const line of prog) {
    const r = runRonml(line, ctx);
    assert.ok(!String(r.text).startsWith('ERR'), `line failed: ${line}\n  ${r.text}`);
    results.push(String(r.text));
  }

  // And it computes the right answers, not merely something.
  const val = (s) => String(runRonml(s, ctx).text);
  assert.equal(val('tokenize ["(", "a", "+", "b", ")", "*"]'),
    '[LParen, Lit a, PlusSign, Lit b, RParen, Asterisk]');
  assert.equal(val('parse ["(", "a", "+", "b", ")", "*", ".", "c"]'),
    'Times (Star (Plus (Chr a, Chr b)), Chr c)',
    'nested constructors print with the parentheses that show their shape');
  assert.equal(val('matches (parse ["a", ".", "b"]) ["a", "b"]'), 'true');
  assert.equal(val('matches (parse ["a", ".", "b"]) ["a", "c"]'), 'false');
  assert.equal(val('matches re ["a", "b", "a", "c"]'), 'true', '(a+b)*.c matches abac');
  assert.equal(val('matches re ["c"]'), 'true', 'and the star may match nothing');
  assert.equal(val('matches re ["a", "b"]'), 'false', 'and the c is required');
});

// ---- value bindings that take a value apart (v1.244) -----------------------
//
// Harper introduces this BEFORE case, as "the following generalization of a
// value binding" (1993, p.16): write down the shape and the parts get names.
// It is the simpler idea and the one a reader meets first, and this dialect
// had case without it, which had the introduction backwards.
test('a binding may be a pattern, and binds every name in it', () => {
  const ctx = sess();
  const run = (src) => runRonml(src, ctx).text;
  assert.match(run('let (m, n) = (7 + 1, 4)'), /val m = 8/);
  assert.equal(run('m'), '8');
  assert.equal(run('n'), '4');
  run('let ((a, b), (c, d)) = ((4, 5), (3, 2))');
  assert.equal(run('a'), '4');
  assert.equal(run('d'), '2', 'nested to any depth');
  run('let [p, q] = [10, 20]');
  assert.equal(run('q'), '20', 'lists too');
});

test('a binding that does not fit says so instead of binding nothing', () => {
  const r = runRonml('let (m, n) = (1, 2, 3)', sess());
  assert.match(r.text, /does not fit/);
});

test('a parameter may be a pattern', () => {
  const ctx = sess();
  const run = (src) => runRonml(src, ctx).text;
  run('let dist (x, y) = x + y');
  assert.equal(run('dist (3, 4)'), '7');
  run('datatype shape = Circle of num | Rect of num * num');
  run('let wide (Rect w h) = w > h');
  assert.equal(run('wide (Rect 4 2)'), 'true', 'including a constructor pattern');
});

// ---- val, fun and div: Standard ML's words, accepted -----------------------
test('val and fun are synonyms for let, so a line from the book binds', () => {
  const ctx = sess();
  const run = (src) => runRonml(src, ctx).text;
  assert.match(run('val pair = (2, 3)'), /val pair = \(2, 3\)/);
  run('fun sq n = n * n');
  assert.equal(run('sq 5'), '25');
  run('val (m, n) = (7 + 1, 4 div 2)');
  assert.equal(run('n'), '2', 'and they compose with everything else');
});

test('div is whole division and / is not', () => {
  const ctx = sess();
  const run = (src) => runRonml(src, ctx).text;
  assert.equal(run('7 div 2'), '3');
  assert.equal(run('7.0 / 2.0'), '3.5');
  assert.match(run('7 / 2'), /divides reals/, '/ is real division, as in ML');
  assert.equal(run('1 + 7 div 2'), '4', 'binds like times and divide');
  assert.match(runRonml('1 div 0', ctx).text, /Div — division by zero/);
});

// ---- clausal definitions, @ and type variables (v1.245) --------------------
//
// Found by running Harper's own 32 ISML example files against the language.
// Clausal definitions are how every recursive function in that corpus is
// written, so their absence was the single commonest cause of failure in it.
test('a function may be defined by clauses, the way ML writes them', () => {
  const ctx = sess();
  const run = (src) => runRonml(src, ctx).text;
  run('fun length nil = 0 | length (_ :: t) = 1 + length t');
  assert.equal(run('length [1, 2, 3]'), '3');
  assert.equal(run('length nil'), '0', 'the base case is reached');
  run('fun fib 0 = 1 | fib 1 = 1 | fib n = fib (n - 1) + fib (n - 2)');
  assert.equal(run('fib 10'), '89', 'three clauses, constants first');
  run('fun append (nil, l) = l | append (h :: t, l) = h :: append (t, l)');
  assert.equal(run('append ([1, 2], [3, 4])'), '[1, 2, 3, 4]', 'tuple arguments');
  run('fun map f nil = nil | map f (h :: t) = f h :: map f t');
  assert.equal(run('map (fn n => n * 2) [1, 2, 3]'), '[2, 4, 6]', 'two arguments, matching on the second');
});

test('nil in parameter position is the empty list, not a variable', () => {
  // It was a variable, which matched every list, so `length nil = 0` returned 0
  // for everything and the second clause was never reached. Silent and wrong.
  const ctx = sess();
  runRonml('fun f nil = 100 | f (h :: t) = 200', ctx);
  assert.equal(String(runRonml('f nil', ctx).text), '100');
  assert.equal(String(runRonml('f [1]', ctx).text), '200');
});

test('clauses must agree on how many arguments they take', () => {
  const r = runRonml('fun f 0 = 1 | f x y = 2', sess());
  assert.match(r.text, /same number of arguments/);
});

test('@ joins two lists', () => {
  const ctx = sess();
  const run = (src) => runRonml(src, ctx).text;
  assert.equal(run('[1, 2] @ [3, 4]'), '[1, 2, 3, 4]');
  assert.equal(run('nil @ [1]'), '[1]');
  assert.equal(run('[1] @ [2] @ [3]'), '[1, 2, 3]', 'and groups to the right');
  run('fun rev nil = nil | rev (h :: t) = rev t @ [h]');
  assert.equal(run('rev [1, 2, 3]'), '[3, 2, 1]', "which is how Harper's rev is written");
  assert.match(runRonml('1 @ [2]', ctx).text, /not a list/);
});

test('a datatype may carry type variables, which are read and discarded', () => {
  const ctx = sess();
  const run = (src) => runRonml(src, ctx).text;
  // Nothing here is typed, so 'a means nothing — but `datatype 'a option` is
  // two of the most-used declarations in Harper's examples and should parse.
  run("datatype 'a option = NONE | SOME of 'a");
  assert.equal(run('SOME 3'), 'SOME 3');
  assert.equal(run('NONE'), 'NONE');
  run('fun get NONE = 0 | get (SOME n) = n');
  assert.equal(run('get (SOME 7)'), '7');
  assert.equal(run('get NONE'), '0');
  run("datatype 'a tree = Empty | Node of 'a tree * 'a * 'a tree");
  assert.equal(run('Node (Empty, 5, Empty)'), 'Node (Empty, 5, Empty)', 'three-part constructors too');
});

// ---- records, blocks, fn-matches, as-patterns, library (v1.246) ------------
test('records are values with named fields', () => {
  const ctx = sess();
  const run = (src) => runRonml(src, ctx).text;
  assert.equal(run('{ a = 1, b = 2 }'), '{a = 1, b = 2}');
  run('let r = { protocol = "mailto", who = "rwh" }');
  assert.equal(run('#protocol r'), 'mailto', '#label selects');
  assert.equal(run('#1 (7, 8)'), '7', 'and #n selects from a tuple, from one');
  run('let a = 1');
  run('let b = 2');
  assert.equal(run('{ a, b }'), '{a = 1, b = 2}', '{a, b} is short for {a = a, b = b}');
});

test('record patterns bind fields, and ... allows the rest', () => {
  const ctx = sess();
  const run = (src) => runRonml(src, ctx).text;
  run('let r = { protocol = "mailto", who = "rwh" }');
  run('let { protocol = pr, who = w } = r');
  assert.equal(run('pr'), 'mailto');
  assert.equal(run('w'), 'rwh');
  run('let { protocol = p2, ... } = r');
  assert.equal(run('p2'), 'mailto', 'a partial pattern needs ...');
  run('fun host { protocol = p, who = _ } = p');
  assert.equal(run('host r'), 'mailto', 'and works as a parameter');
});

test('a let may hold several bindings and close with end', () => {
  const ctx = sess();
  const run = (src) => runRonml(src, ctx).text;
  assert.equal(run('let val m = 3 val n = 4 in m + n end'), '7');
  assert.equal(run('let a = 1 and b = 2 in a + b'), '3', 'and joins simultaneous bindings');
  assert.equal(run('let x = 2 in x + 1 end'), '3', 'end is optional but accepted');
  assert.equal(run('let fun sq n = n * n in sq 5 end'), '25');
  // `and` must still be boolean where a binding does not follow.
  assert.equal(run('let x = true and false in x'), 'false');
  assert.equal(run('true and true'), 'true');
});

test('fn takes several alternatives, and as- names the whole', () => {
  const ctx = sess();
  const run = (src) => runRonml(src, ctx).text;
  run('let f = fn nil => 0 | _ :: _ => 1');
  assert.equal(run('f nil'), '0');
  assert.equal(run('f [9]'), '1');
  run('datatype t = Leaf | Node of t * t');
  run('fun norm (whole as Node a b) = whole | norm x = x');
  assert.equal(run('norm (Node Leaf Leaf)'), 'Node (Leaf, Leaf)');
});

test('the little library: abs, sqrt, min, max, size', () => {
  const ctx = sess();
  const run = (src) => runRonml(src, ctx).text;
  assert.equal(run('sqrt 16.0'), '4.0', 'sqrt is real -> real');
  assert.equal(run('abs (0 - 3)'), '3');
  assert.equal(run('min 3 7'), '3');
  assert.equal(run('max 3 7'), '7');
  assert.equal(run('size "hello"'), '5');
  run('let fourthroot x = sqrt (sqrt x)');
  assert.equal(run('fourthroot 16.0'), '2.0', "which is Harper's own first example");
});

test('a program file may be laid out the way ML is written', () => {
  // Physical lines join into logical ones: indented, or opening with an
  // operator that cannot start a declaration. Without this a file could only
  // hold one-liners and every multi-line function in the demos failed.
  const joined = joinProgramLines([
    '(* a comment *)',
    'fun length nil = 0',
    '  | length (_ :: t) = 1 + length t',
    '',
    'length [1, 2, 3]',
  ].join('\n'));
  assert.deepEqual(joined, ['fun length nil = 0 | length (_ :: t) = 1 + length t', 'length [1, 2, 3]']);
  const ctx = sess();
  let last = '';
  for (const l of joined) last = String(runRonml(l, ctx).text);
  assert.equal(last, '3');
});

test('a declaration may run over at a PROMPT, in either direction', () => {
  // A file is joined all at once; a prompt has one line and no way to look
  // ahead. Until v1.332 it ran each physical line alone, so pasting any of the
  // examples into the NostBook failed on the second line of every clausal
  // function and on every comment written across two lines. These are the
  // shapes from the report.

  // FORWARDS: the text cannot have ended, so the prompt holds it open.
  assert.equal(needsMoreInput('fun times n ='), true, 'a trailing = is waiting');
  assert.equal(needsMoreInput('datatype t ='), true);
  assert.equal(needsMoreInput('val x = 1'), false, 'a finished binding is finished');

  // An unclosed comment, which is what a two-line (* … *) leaves behind.
  assert.equal(needsMoreInput('(* map, filter and fold. Three ways of walking a list,'), true);
  assert.equal(needsMoreInput('(* map, filter and fold. *)'), false);
  assert.equal(needsMoreInput('(* one *) val x = 1 (* two'), true, 'the second one is still open');
  assert.equal(needsMoreInput('val s = "a (* b"'), false, 'not a comment: it is inside a string');
  // An escaped quote does not end the string, so the (* stays inside it.
  assert.equal(needsMoreInput('val s = "a \\" b (* still text"'), false);
  assert.equal(needsMoreInput('val s = "a \\" b" (* and now a real one'), true);

  // BACKWARDS: the line cannot have STARTED anything, so it belongs above.
  assert.equal(continuesPrevious('  | insert (Node (l, v, r), x) ='), true);
  assert.equal(continuesPrevious('| toList (Node (l, v, r)) = toList l'), true);
  assert.equal(continuesPrevious('else Node (l, v, insert (r, x))'), true);
  assert.equal(continuesPrevious('and odd n = ...'), true);
  assert.equal(continuesPrevious('val doubled = map f xs'), false, 'a fresh declaration is not a continuation');
  assert.equal(continuesPrevious('  val indented = 1'), false, 'indentation alone does not, at a prompt');

  // And the whole of it, run the way the prompt runs it: hold, join, re-run.
  const ctx = sess();
  loadPrelude(ctx);
  let pending = '';
  let last = '';
  let answer = '';
  for (const typed of [
    '(* A binary tree, and a sort that falls out of walking it. *)',
    "datatype 'a tree = Leaf | Node of 'a tree * 'a * 'a tree",
    'fun insert (Leaf, x) = Node (Leaf, x, Leaf)',
    '  | insert (Node (l, v, r), x) =',
    '      if x < v then Node (insert (l, x), v, r)',
    '      else Node (l, v, insert (r, x))',
    'fun toList Leaf = nil',
    '  | toList (Node (l, v, r)) = toList l @ [v] @ toList r',
    'fun sort xs = toList (List.foldl (fn (x, t) => insert (t, x)) Leaf xs)',
    'sort [5, 3, 8, 1, 9, 2, 7]',
  ]) {
    let source = typed.trim();
    if (pending) source = `${pending} ${source}`;
    else if (continuesPrevious(typed) && last) source = `${last} ${source}`;
    if (needsMoreInput(source)) { pending = source; continue; }
    pending = '';
    answer = String(runRonml(source, ctx).text);
    assert.ok(!answer.startsWith('ERR'), `${source.slice(0, 50)} -> ${answer}`);
    last = source;
  }
  assert.equal(answer, '[1, 2, 3, 5, 7, 8, 9]', 'the tree sort answers, pasted line by line');
});

test('every demo on the laptop disk runs to the end', () => {
  const disk = newShell();
  const listed = runUnix('ls demos', disk, {}).text.split(/\s+/).filter(Boolean);
  assert.ok(listed.length >= 6, 'there are demos to run');
  for (const name of listed) {
    // engage.ml and dance.ml are MACHINE programs: they read sensors and drive
    // legs a laptop does not have, and running them here should fail. Each has
    // its own tests, against decide(). (engage: fire control; dance: move/route.)
    if (name === 'engage.ml' || name === 'dance.ml') continue;
    const src = runUnix(`cat demos/${name}`, disk, {}).text;
    const ctx = { station: 'laptop', session: {} };
    for (const line of joinProgramLines(src)) {
      const r = runRonml(line, ctx);
      assert.ok(!String(r.text).startsWith('ERR'), `${name}: ${line}\n  ${r.text}`);
    }
  }
});

// ---- a pasted transcript runs (v1.250) -------------------------------------
//
// Found by pasting an example out of the documentation into pico and running
// it. Every example in these docs, and in the manuals this language descends
// from, is printed the way a session looks: the line you type, then the answer.
// Copying one is the entire point of putting it there, so `ml` has to skip the
// answers rather than parse them. It was parsing them, and a file ended with
// ERR: unexpected 'GT' after doing everything right.
test('ml skips the answer lines in a pasted transcript', () => {
  const file = [
    'fun map f nil = nil',
    '  | map f (h :: t) = f h :: map f t',
    '',
    'map (fn n => n * n) [1,2,3,4]',
    '> [1, 4, 9, 16]',
  ].join('\n');
  assert.deepEqual(joinProgramLines(file), [
    'fun map f nil = nil | map f (h :: t) = f h :: map f t',
    'map (fn n => n * n) [1,2,3,4]',
  ], 'the > line is output, not input');

  const ctx = sess();
  let last = '';
  for (const l of joinProgramLines(file)) {
    const r = runRonml(l, ctx);
    assert.ok(!String(r.text).startsWith('ERR'), `${l} => ${r.text}`);
    last = String(r.text);
  }
  assert.equal(last, '[1, 4, 9, 16]');
});

test('and the other transcript convention, the SML input prompt', () => {
  // Harper's manuals mark what you type with a leading `- ` and the answer
  // with `>`. A file pasted straight out of one should still run.
  assert.deepEqual(joinProgramLines([
    '- val l = [1, 2, 3];',
    '> val l = [1,2,3] : int list',
    '- length l;',
  ].join('\n')), ['val l = [1, 2, 3];', 'length l;']);
});

test('only an unindented > is a transcript answer', () => {
  // Indentation already means continuation in this joiner, so the two rules
  // agree: an answer sits at the left margin, a continuation is indented.
  const ctx = sess();
  assert.equal(String(runRonml('3 > 2', ctx).text), 'true', '> is still an operator');
  assert.deepEqual(joinProgramLines('let big = 3\n  > 2'), ['let big = 3 > 2'],
    'an indented continuation still joins');
  assert.deepEqual(joinProgramLines('let big = 3\n> true'), ['let big = 3'],
    'an unindented one is the answer and goes');
});

// ---- saying no usefully (v1.251) -------------------------------------------
//
// Pasting Harper's N-queens file in got "ERR: unexpected character ':'" — a
// lexer complaining about the third token of a signature block, naming neither
// the construct nor the reason nor the line. The console's stated job is to
// teach rather than gatekeep, and that has to hold when the answer is no.
test('a construct this build does not have is named, not lexed at', () => {
  // Only two things are still refused outright. The rest of this list has been
  // pruned as the features landed; see NOT_FITTED_SAMPLES and the test below,
  // which is what stops it drifting again.
  // v1.316: OS is the only structure still absent, and the only one this rule
  // may name. It said Word, Array, Vector, IO, TextIO, Math, Substring and
  // General too, long after all eight landed, so a bad MEMBER of a present
  // structure was reported as a missing library. The walking test below never
  // caught it because its sample, `Array.sub (a, 0)`, went on failing on the
  // unbound `a`. So the check now runs BOTH ways.
  assert.match(String(diagnose('OS.getEnv "HOME"')), /not on this machine/);
  for (const present of ['Array.sub (v, 0)', 'Vector.length v', 'Math.pi', 'Word.toString w',
    'IO.Io', 'TextIO.print s', 'Substring.full s', 'General.o']) {
    assert.equal(diagnose(present), null, `${present} is here, so nothing may say it is not`);
  }
  // And everything that used to be here is simply supported now. `infix` and
  // the List/String/Int/Option structures joined this list at v1.277 and v1.257.
  for (const src of ['signature S = sig val go : int end', 'exception Fail', 'type t = int',
    '#"a"', '~3', 'val x : int = 5', 'let r = ref 0',
    'local fun h n = n in fun t n = h n end',
    'infix 8 OR', 'infixr 5 ++', 'nonfix OR']) {
    assert.equal(diagnose(src), null, `${src} is supported now`);
    assert.ok(!String(runRonml(src, sess()).text).startsWith('ERR'), `${src} runs`);
  }
  // These parse and are no longer diagnosed as absent, but need the prelude
  // loaded to actually evaluate, so only the diagnosis is asserted here.
  for (const src of ['String.explode s', 'List.map f l', 'Int.toString n']) {
    assert.equal(diagnose(src), null, `${src} is no longer refused outright`);
  }
});

test('a diagnosis is offered only when there is one to offer', () => {
  assert.equal(diagnose('fun f x = x'), null, 'valid code is not diagnosed');
  assert.equal(diagnose('let x = 1'), null);
  // and a genuine syntax error still gets the parser's own message
  assert.match(String(runRonml('let x = ', sess()).text), /unexpected end|expected/);
});

test('an error in a file says which line, and shows it', () => {
  const file = ['(* a header *)', '', 'fun ok x = x', '', 'exception Fail'].join('\n');
  const got = joinProgram(file);
  assert.deepEqual(got.map((l) => l.line), [3, 5], 'the physical line each one started on');
  assert.equal(got[1].text, 'exception Fail');
});

// ---- modules, exceptions and inference (v1.252) ----------------------------
test('= is equality in expression position, as it is in ML', () => {
  const ctx = sess();
  const run = (s) => runRonml(s, ctx).text;
  assert.equal(run('1 = 1'), 'true');
  run('fun complete (n, _, k, _) = (k = n)');
  assert.equal(run('complete (4, 1, 4, nil)'), 'true', 'the binding = is eaten first');
  assert.equal(run('true andalso false'), 'false');
  assert.equal(run('true orelse false'), 'true');
});

test('() is the unit value and the unit pattern', () => {
  const ctx = sess();
  const run = (s) => runRonml(s, ctx).text;
  assert.equal(run('()'), '()');
  run('let k = fn () => 42');
  assert.equal(run('k ()'), '42', 'which is how every continuation is written');
});

test('exceptions are raised, handled, and reported when they escape', () => {
  const ctx = sess();
  const run = (s) => runRonml(s, ctx).text;
  run('exception Fail');
  assert.match(run('raise Fail'), /uncaught exception Fail/);
  assert.equal(run('(raise Fail) handle Fail => 99'), '99');
  run('fun f x = if x > 3 then raise Fail else x');
  assert.equal(run('f 2'), '2');
  assert.equal(run('(f 9) handle Fail => 0'), '0', 'the handler catches from inside a call');
});

test('a structure publishes its declarations under its name', () => {
  const ctx = sess();
  const run = (s) => runRonml(s, ctx).text;
  run('structure B = struct fun go n = n * 2 end');
  assert.equal(run('B.go 21'), '42');
});

test('an opaque signature publishes only the names it lists', () => {
  const ctx = sess();
  const run = (s) => runRonml(s, ctx).text;
  run('signature S = sig val shown : int -> int end');
  run('structure M :> S = struct fun shown n = n + 1 fun hidden n = n + 2 end');
  assert.equal(run('M.shown 1'), '2');
  // Without a type checker this cannot make a TYPE abstract, and does not
  // claim to. What it does do is real: the name is not there.
  assert.match(run('M.hidden 1'), /not a command|no such|isn't something/i, 'hidden stays inside');
});

test('inference works out the type, and Harper prints the same one', () => {
  const ctx = { station: 'laptop', session: {}, types: true };
  const t = (s) => typeReport(s, ctx);
  assert.equal(t('1'), 'int');
  assert.equal(t('1.5'), 'real', 'two number types, kept apart');
  assert.equal(t('#"a"'), 'char');
  // v1.290: `string`, which is what Standard ML calls it. It read `str` until
  // then, so `explode` reported `str -> char list` where SML says `string -> …`.
  assert.equal(t('"hi"'), 'string');
  assert.equal(t('[1, 2, 3]'), 'int list');
  assert.equal(t('(1, "a")'), 'int * string');
  assert.equal(t('fn x => x'), "'a -> 'a");
  t('let map f l = case l of nil => nil | x :: r => f x :: map f r');
  assert.equal(t('map'), "('a -> 'b) -> 'a list -> 'b list",
    'the type Harper prints for map on p.29');
  t('let sum l = case l of nil => 0 | x :: r => x + sum r');
  assert.equal(t('sum'), 'int list -> int');
});

test('inference catches a clash, and an infinite type, without hanging', () => {
  const ctx = { station: 'laptop', session: {}, types: true };
  const t = (s) => typeReport(s, ctx);
  assert.match(t('1 + "a"'), /TYPE:.*not the same type/);
  assert.match(t('1 + 1.5'), /TYPE:.*int and real/, 'the two do not mix');
  assert.match(t('if 1 then 2 else 3'), /TYPE:/);
  assert.match(t('[1, "a"]'), /TYPE:/);
  assert.match(t('fn x => x x'), /TYPE:.*infinite type/);
});

test('inference reports and never refuses, and never runs on a machine', () => {
  // A T-1 has a quarter of a second and nobody to read a report.
  assert.equal(typeReport('1 + 1', { station: 'robot', session: {} }), null);
  assert.equal(typeReport('1 + 1', { station: 'laptop', session: {} }), null, 'off unless asked');
  // And a clash does not stop the line: the value still comes back.
  const ctx = { station: 'laptop', session: {}, types: true };
  typeReport('[1, "a"]', ctx);
  assert.equal(String(runRonml('[1, "a"]', ctx).text), '[1, a]', 'it still evaluates');
});

test("Harper's N-queens runs: all four solutions, same answer", () => {
  // The file is one problem and four ways of saying "there is no answer": as a
  // value, as an exception (twice — the block is duplicated in his own file),
  // and as a continuation. Each is run against the same Board.
  const board = [
    'signature BOARD = sig val new : int -> board val size : board -> int end',
    'structure Board = struct',
    '  fun new n = (n, 1, 0, nil)',
    '  fun size (n, _, _, _) = n',
    '  fun complete (n, _, k, _) = (k = n)',
    '  fun place ((n, i, k, qs), j) = (n, i+1, k+1, (i,j) :: qs)',
    '  fun threatens ((i,j), (i2,j2)) = i=i2 orelse j=j2 orelse i+j = i2+j2 orelse i-j = i2-j2',
    '  fun conflicts (q, nil) = false | conflicts (q, q2 :: qs) = threatens (q, q2) orelse conflicts (q, qs)',
    '  fun safe ((_, i, _, qs), j) = not (conflicts ((i,j), qs))',
    'end',
  ].join('\n');
  const versions = {
    options: [
      'fun addqueen bd = let fun try j =',
      '    if j > Board.size bd then NONE',
      '    else if Board.safe (bd, j) then',
      '      (case addqueen (Board.place (bd, j)) of NONE => try (j+1) | r => r)',
      '    else try (j+1)',
      '  in if Board.complete bd then SOME bd else try 1 end',
      'fun queens n = addqueen (Board.new n)',
    ].join('\n'),
    exceptions: [
      'exception Fail',
      'fun addqueen bd = let fun try j =',
      '    if j > Board.size bd then raise Fail',
      '    else if Board.safe (bd, j) then (addqueen (Board.place (bd, j)) handle Fail => try (j+1))',
      '    else try (j+1)',
      '  in if Board.complete bd then bd else try 1 end',
      'fun queens n = SOME (addqueen (Board.new n)) handle Fail => NONE',
    ].join('\n'),
    continuations: [
      'fun addqueen (bd, fc) = let fun try j =',
      '    if j > Board.size bd then fc ()',
      '    else if Board.safe (bd, j) then addqueen (Board.place (bd, j), fn () => try (j+1))',
      '    else try (j+1)',
      '  in if Board.complete bd then SOME bd else try 1 end',
      'fun queens n = addqueen (Board.new n, fn () => NONE)',
    ].join('\n'),
  };
  const answers = [];
  for (const [name, code] of Object.entries(versions)) {
    const ctx = sess();
    runRonml("datatype 'a option = NONE | SOME of 'a", ctx);
    for (const l of joinProgramLines(`${board}\n${code}`)) {
      const r = runRonml(l, ctx);
      assert.ok(!String(r.text).startsWith('ERR'), `${name}: ${l}\n  ${r.text}`);
    }
    // Back to n = 6, where it was before it became a barometer. The
    // CONTINUATIONS variant unwound a chain of `fn () => …` thunks on the
    // JavaScript stack and sat exactly on the cliff at 6, passing or failing
    // depending on how much stack the rest of the suite had used. Both `fc ()`
    // and `addqueen (…, fn () => …)` are tail calls, so v1.303 took the stack
    // out of it.
    const got = String(runRonml('queens 6', ctx).text);
    assert.match(got, /^SOME/, `${name} finds a placement`);
    answers.push(got);
  }
  assert.equal(new Set(answers).size, 1, 'all three agree on the answer');
});

// ---- annotations are checked, and the language names itself (v1.253) -------
test('a type annotation is a claim the checker holds you to', () => {
  const ctx = { station: 'laptop', session: {}, types: true };
  const t = (s) => typeReport(s, ctx);
  assert.equal(t('val x : int = 5'), 'int');
  assert.match(t('val e : int = "hi"'), /TYPE:.*not the same type/,
    'an unchecked annotation would be the same lie as no annotation');
  // The RESULT is annotated, not the function: one arrow per parameter is
  // peeled before comparing, or `fun sq (n:int):int` reports a clash that is
  // not one.
  assert.equal(t('fun sq (n:int):int = n * n'), 'int -> int');
  assert.match(t('fun bad (n:int):string = n * n'), /TYPE:/);
  assert.equal(t('fun dist (x:real, y:real):real = x + y'), '(real * real) -> real');
});

test('the language reports its own version and surface', () => {
  assert.match(aimlVersion(), /AI-ML \d+\.\d+/);
  const full = aimlFull();
  for (const want of ['VALUES', 'TYPES', 'THE LIBRARY', 'NOT ON THIS BUILD',
    'WHERE IT RUNS', 'datatype', 'structure', 'exception', 'functor',
    'Hindley-Milner', 'List', 'Option', 'ref']) {
    assert.match(full, new RegExp(want), `the survey covers ${want}`);
  }
  // It must say what is absent as plainly as what is present, or it is a sales
  // pitch rather than a survey.
  // v1.285: this used to pin `no infix, no op`, which -full had gone on saying
  // since v1.277, when both landed. The survey now names the library that is
  // genuinely absent instead.
  assert.match(full, /no Array, Vector, IO/, 'what is absent is still named plainly');
  assert.doesNotMatch(full, /no infix, no op/, 'infix and op have worked since v1.277');
  assert.match(full, /#"a"/, 'char is present now, so it is listed as a value');
  assert.match(full, /int/);
  assert.match(full, /real/);
});

// ---- int, real and char (v1.255) -------------------------------------------
test('int and real are separate, and do not mix', () => {
  const ctx = sess();
  const run = (s) => runRonml(s, ctx).text;
  assert.equal(run('1'), '1');
  assert.equal(run('1.5'), '1.5');
  assert.equal(run('2.0'), '2.0', 'a real prints as one even when it is whole');
  assert.equal(run('1 + 2'), '3');
  assert.equal(run('1.5 + 2.5'), '4.0');
  assert.match(run('1 + 1.5'), /not the same kind of number/);
  assert.equal(run('7 div 2'), '3');
  assert.equal(run('7.0 / 2.0'), '3.5');
  assert.match(run('7 / 2'), /divides reals/, '/ is real division');
  assert.match(run('7.0 div 2.0'), /whole numbers/);
  assert.equal(run('real 3'), '3.0', 'and there are ways across');
  assert.equal(run('floor 3.7'), '3');
});

test('~ is unary minus, which was simply never lexed', () => {
  const ctx = sess();
  assert.equal(String(runRonml('~3', ctx).text), '~3');
  assert.equal(String(runRonml('~3.5', ctx).text), '~3.5');
  assert.equal(String(runRonml('~3 + 5', ctx).text), '2');
});

test('char is its own type, with the verbs that go with it', () => {
  const ctx = sess();
  const run = (s) => runRonml(s, ctx).text;
  assert.equal(run('#"a"'), 'a');
  assert.equal(run('ord #"a"'), '97');
  assert.equal(run('chr 98'), 'b');
  assert.equal(run('str #"x"'), 'x');
  assert.equal(run('explode "hi"'), '[h, i]');
  assert.equal(run('implode [#"h", #"i"]'), 'hi');
  assert.equal(run('#"a" == #"a"'), 'true');
  // Harper's tokenizer matches on character literals, which is why this is here.
  run('fun tok #"+" = "plus" | tok #"*" = "star" | tok c = "other"');
  assert.equal(run('tok #"+"'), 'plus', 'and they work as patterns');
  assert.equal(run('tok #"z"'), 'other');
});

test('equality works on every kind of value, not only the flat ones', () => {
  // It compared tags and a single field, so lists, tuples and constructors all
  // answered false to themselves. Found by the number split, not by a test.
  const ctx = sess();
  const run = (s) => runRonml(s, ctx).text;
  assert.equal(run('[1, 2] == [1, 2]'), 'true');
  assert.equal(run('[1, 2] == [1, 3]'), 'false');
  assert.equal(run('(1, "a") == (1, "a")'), 'true');
  run('datatype colour = Red | Blue');
  assert.equal(run('Red == Red'), 'true');
  assert.equal(run('Red == Blue'), 'false');
});

test('arithmetic needs a number, which HM alone cannot say', () => {
  const ctx = { station: 'laptop', session: {}, types: true };
  const t = (s) => typeReport(s, ctx);
  // An unresolved operand defaults to int, as it does in ML; anything that is
  // not a number is reported rather than quietly unified.
  assert.equal(t('fn x => x + 1'), 'int -> int', 'the default is int');
  assert.equal(t('1.5 + 1.5'), 'real');
  assert.match(t('"a" * "a"'), /not a number/);
  assert.equal(t('#"a"'), 'char');
  assert.equal(t('explode "hi"'), 'char list');
  assert.equal(t('ord #"a"'), 'int');
});

// ---- the diagnostic list cannot go stale ----------------------------------
//
// It has, six times: it went on refusing modules, exceptions, chars, local and
// refs after each of them shipped, and because it fires BEFORE the parser it
// hid the real error every time. This test walks the list and asserts each rule
// still describes something the parser genuinely rejects. Add a feature without
// pruning the rule and this fails.
test('everything the diagnostic refuses is genuinely absent', () => {
  for (const sample of NOT_FITTED_SAMPLES) {
    const why = diagnose(sample);
    assert.ok(why, `${sample} should still be diagnosed`);
    const r = runRonml(sample, sess());
    assert.ok(String(r.text).startsWith('ERR'),
      `"${sample}" is diagnosed as unsupported but the console accepts it — prune the rule`);
  }
});

// ---- local, functors, refs and the library (v1.257) ------------------------
test('local hides what it does not publish', () => {
  const ctx = sess();
  const run = (s) => runRonml(s, ctx).text;
  run('local fun helper n = n * 2 in fun twice n = helper n end');
  assert.equal(run('twice 5'), '10');
  assert.match(run('helper 5'), /ERR/, 'helper stayed inside');
});

test('a functor takes a structure and gives one back', () => {
  const ctx = sess();
  const run = (s) => runRonml(s, ctx).text;
  run('structure A = struct fun size x = 99 end');
  run('functor F (X) = struct fun go n = X.size n end');
  run('structure M = F (A)');
  assert.equal(run('M.go 1'), '99');
  // and applied to a different argument it gives a different answer
  run('structure B = struct fun size x = 7 end');
  run('structure N = F (B)');
  assert.equal(run('N.go 1'), '7', 'the body is re-run per application');
});

test('a ref is the one thing that can be changed', () => {
  const ctx = sess();
  const run = (s) => runRonml(s, ctx).text;
  run('let r = ref 0');
  assert.equal(run('!r'), '0');
  run('r := 5');
  assert.equal(run('!r'), '5');
  run('let bump c = (c := !c + 1 ; !c)');
  assert.equal(run('bump r'), '6');
  assert.equal(run('bump r'), '7', 'and it stays changed');
  assert.match(run('!3'), /not a ref/);
  assert.equal(run('1 != 2'), 'true', 'and != still means <>');
});

test('the library is written in the language it is for', () => {
  const ctx = sess();
  loadPrelude(ctx);
  const run = (s) => runRonml(s, ctx).text;
  assert.equal(run('List.map (fn n => n * 2) [1, 2, 3]'), '[2, 4, 6]');
  assert.equal(run('List.filter (fn n => n > 1) [1, 2, 3]'), '[2, 3]');
  assert.equal(run('List.rev [1, 2, 3]'), '[3, 2, 1]');
  // v1.306: foldl takes a TUPLE, as the Basis does. It was curried, so the
  // spelling in every textbook was refused and the one that worked was one no
  // Standard ML program is written in. Changed here deliberately.
  assert.equal(run('List.foldl (fn (h, a) => h + a) 0 [1, 2, 3]'), '6');
  // The direction, which the addition above cannot tell you: SML's foldl gives
  // 2 for this and foldr gives 2 as well, by different routes.
  assert.equal(run('List.foldl (fn (h, a) => h - a) 0 [1, 2, 3]'), '2');
  assert.equal(run('List.foldr (fn (h, a) => h - a) 0 [1, 2, 3]'), '2');
  assert.equal(run('List.tabulate (4, fn n => n * n)'), '[0, 1, 4, 9]');
  assert.equal(run('String.rev "hello"'), 'olleh');
  assert.equal(run('String.size "abc"'), '3');
  assert.equal(run('Char.isDigit #"5"'), 'true');
  assert.equal(run('Char.toUpper #"a"'), 'A');
  assert.equal(run('Int.max (3, 7)'), '7');
  assert.equal(run('Option.getOpt (NONE, 9)'), '9');
  assert.equal(run('Option.valOf (SOME 3)'), '3');
  assert.equal(run('Option.isSome NONE'), 'false');
});

test('loading the prelude twice does not reload it', () => {
  const ctx = sess();
  loadPrelude(ctx);
  runRonml('structure List = struct fun map f l = "mine" end', ctx);
  loadPrelude(ctx);
  assert.equal(String(runRonml('List.map 1 2', ctx).text), 'mine',
    'a second load would have overwritten what the player did');
});


// EVERY PROGRAM RON SERVES RUNS. The relay's disk is a table anyone can add a
// row to, and a tool that is offered but does not run is the same lie as a stale
// manual: nothing fails, and only the person who downloaded it finds out.
test('every .ml file on the relay disk runs on a NostBook', async () => {
  const air = [{ name: 't1_03', range: 6, bearing: 'NE', kind: 't1' },
    { name: 't2_07', range: 19, bearing: 'SSW', kind: 't2' }];
  for (const f of RELAY_FILES.filter((x) => x.name.endsWith('.ml'))) {
    const out = [];
    const ctx = { station: 'laptop', session: {}, print: (t) => out.push(t), units: () => air };
    await loadPrelude(ctx);
    for (const l of joinProgram(f.body)) {
      const line = String(l.text !== undefined ? l.text : l);
      const r = runRonml(line, ctx);
      assert.ok(r.ok, `${f.name}: ${line} -> ${r.text}`);
      if (r.text && !/^val /.test(r.text)) out.push(r.text);
    }
    // It has to SAY something, or it is a program that runs and does nothing.
    assert.ok(out.join('\n').includes('t1_03'), `${f.name} named nothing it heard`);
  }
});

test('the laptop can ask what its card hears, and nothing else can', () => {
  const air = [{ name: 't1_03', range: 6, bearing: 'NE', kind: 't1' }];
  const lap = runRonml('#name (hd units)', { station: 'laptop', session: {}, units: () => air });
  assert.equal(lap.text, 't1_03');
  // A machine's own program has no card and no business with one. A bare word
  // is an atom at every station (that is how node ids like OB_1A2B are typed),
  // so the tell is not an error — it is that `units` is not the LIST there.
  const bot = runRonml('length units', { station: 'robot', session: {}, sense: {}, units: () => air });
  assert.equal(bot.ok, false, 'a T-1 has no wireless card, so units is not a list there');
});


// EVERY PROGRAM IN /home/robots_code IS A MACHINE PROGRAM. These do not run on
// the laptop and are not supposed to: they read senses a NostBook has no
// hardware for. What has to hold is that each one parses, decides, and answers
// with an intent the engine recognises — the thing a player finds out by
// posting it to a machine and watching the lamp go amber.
const T1_CAN = ['patrol', 'hunt', 'home', 'flee', 'wait'];

test('every program in /home/robots_code decides at a machine', () => {
  const disk = newShell();
  const all = runUnix('ls robots_code', disk, {}).text.split(/\s+/).filter(Boolean);
  const listed = all.filter((n) => n.endsWith('.ml'));
  assert.ok(listed.length >= 1, 'there are machine programs on the disk');
  // The folder explains itself to a player, so the folder has a readme, and the
  // readme is not a program.
  assert.ok(all.includes('readme.txt'), 'and it says what they are');
  // THE WHOLE BAG A LIVE T-1 GETS (robots.js t1Sense): charge, integrity,
  // range, home_range, threat, hurt, linked. An incomplete bag here reads every
  // missing sense as 0/false, which quietly pins a program to one branch and
  // then blames the program for it. That is exactly what happened when this
  // test was first written with five of the seven.
  const SENSES = [
    { charge: 90, integrity: 100, range: 6, home_range: 4, threat: true, hurt: false, linked: true },
    { charge: 90, integrity: 100, range: 1, home_range: 3, threat: true, hurt: false, linked: true },
    { charge: 90, integrity: 100, range: 30, home_range: 16, threat: false, hurt: false, linked: true },
    { charge: 90, integrity: 20, range: 5, home_range: 3, threat: true, hurt: true, linked: true },
    { charge: 90, integrity: 20, range: 5, home_range: 3, threat: true, hurt: true, linked: false },
    { charge: 5, integrity: 100, range: 5, home_range: 4, threat: true, hurt: false, linked: true },
  ];
  for (const name of listed) {
    const src = runUnix(`cat robots_code/${name}`, disk, {}).text;
    const prog = joinProgram(src).map((l) => String(l.text !== undefined ? l.text : l)).join('\n');
    const seen = new Set();
    for (const sense of SENSES) {
      const d = decide(prog, sense);
      assert.ok(d.ok, `${name} faults on ${JSON.stringify(sense)}: ${d.fault}`);
      // T1_CAN in robots.js: a T-1 has no gear for `tend`, and answering it
      // faults the machine. A sample that cannot run on the chassis it is
      // written for is worse than no sample.
      assert.ok(T1_CAN.includes(d.intent),
        `${name} answered "${d.intent}", which a T-1 has no gear for`);
      seen.add(d.intent);
    }
    // A program that gives one answer to every situation is not a program.
    assert.ok(seen.size > 1, `${name} answers ${[...seen][0]} whatever it senses`);
  }
});

// And the laptop must REFUSE them, which is the other half of keeping them in
// their own folder. If `ml robots_code/follow_user.ml` quietly worked, the
// separation would be decoration.
test('a machine program does not run on the laptop', () => {
  const disk = newShell();
  const src = runUnix('cat robots_code/follow_user.ml', disk, {}).text;
  const ctx = { station: 'laptop', session: {} };
  let refused = false;
  for (const l of joinProgram(src)) {
    const r = runRonml(String(l.text !== undefined ? l.text : l), ctx);
    if (!r.ok) { refused = true; break; }
  }
  assert.ok(refused, 'a NostBook has no charge sensor and should say so');
});


// THE CREDIT IS IN ALL THREE PLACES. It names people outside this project, so
// losing it from one of them is worse than a cosmetic slip. -ver and -full both
// print the same list, which is why it is one list.
test('the AI-ML credit appears in -ver and -full, whole', () => {
  const ver = aimlVersion();
  const full = aimlFull();
  for (const line of AIML_CREDIT) {
    assert.ok(ver.includes(line), `ml -ver lost: ${line}`);
    assert.ok(full.includes(line), `ml -full lost: ${line}`);
  }
  assert.match(ver, /David M\. Berry/);
  assert.match(ver, /Robin Milner, Mads Tofte, and\n?Robert Harper|Robin Milner/);
  assert.match(full, /CREDITS/);
});


// ---- what a critical review of the type system turned up (v1.273) ----------
// Each of these was wrong before it was written down. They are grouped because
// they are one question: does the checker report the truth, and does equality
// mean equality.

const typed = () => ({ station: 'laptop', session: {}, types: true });

test('equality is structural on records and by identity on refs', async () => {
  const ctx = typed();
  await loadPrelude(ctx);
  const run = (s) => runRonml(s, ctx);
  assert.equal(run('{x=1} == {x=1}').text, 'true', 'records compare by value');
  assert.equal(run('{x=1,y=2} == {y=2,x=1}').text, 'true', 'a record has no field order');
  assert.equal(run('{x=1} == {x=2}').text, 'false');
  run('val a = ref 1'); run('val b = ref 1');
  assert.equal(run('a == a').text, 'true', 'a cell is itself');
  assert.equal(run('a == b').text, 'false', 'two cells holding 1 are two cells');
});

test('a function cannot be compared, and says so', async () => {
  const ctx = typed();
  await loadPrelude(ctx);
  // Standard ML makes this a type error via equality types. This build cannot
  // refuse at the type level, so it refuses at the comparison. Answering false
  // was the old behaviour and it is the one that tells you nothing.
  const r = runRonml('(fn x => x) == (fn x => x)', ctx);
  assert.equal(r.ok, false);
  assert.match(r.text, /functions cannot be compared/);
});

test('refs are typed, not left as anything', async () => {
  const ctx = typed();
  await loadPrelude(ctx);
  const ty = (s) => { const t = typeReport(s, ctx); runRonml(s, ctx); return t; };
  assert.equal(ty('val r = ref 1'), 'int ref');
  assert.equal(ty('!r'), 'int');
  assert.equal(ty('r := 2'), 'unit', ':= yields unit, which is what makes it sequenceable');
  assert.match(String(ty('r := "s"')), /TYPE:/, 'and the cell keeps its type');
});

test('the value restriction holds, and let-polymorphism survives it', async () => {
  const ctx = typed();
  await loadPrelude(ctx);
  const ty = (s) => { const t = typeReport(s, ctx); runRonml(s, ctx); return t; };
  // A lambda is a syntactic value and generalises: one definition, two types.
  assert.equal(ty('fun id x = x'), "'a -> 'a");
  assert.equal(ty('id 3'), 'int');
  assert.equal(ty('id "a"'), 'string', 'still polymorphic after use at int');
  // An application is not a value, so the cell does not generalise.
  assert.equal(ty('val q = ref nil'), "'a list ref");
  ty('q := [1]');
  assert.equal(ty('!q'), 'int list', 'not \'a list: the cell was fixed by the write');
});

test('a case with a hole in it is reported before the machine finds it', async () => {
  const ctx = typed();
  await loadPrelude(ctx);
  const ty = (s) => { const t = typeReport(s, ctx); runRonml(s, ctx); return String(t); };
  ty('datatype colour = Red | Green | Blue');
  assert.match(ty('fun n c = case c of Red => 1 | Green => 2'), /WARNING.*does not cover Blue/);
  assert.match(ty('fun n2 c = case c of Red => 1'), /does not cover Green, Blue/);
  assert.doesNotMatch(ty('fun n3 c = case c of Red => 1 | Green => 2 | Blue => 3'), /WARNING/);
  assert.doesNotMatch(ty('fun n4 c = case c of Red => 1 | _ => 0'), /WARNING/, 'a wildcard catches everything');
  assert.doesNotMatch(ty('fun n5 c = case c of Red => 1 | other => 0'), /WARNING/, 'so does a variable');
  assert.match(ty('fun f l = case l of x :: r => 1'), /does not cover nil/);
  assert.match(ty('fun g l = case l of nil => 0'), /does not cover a non-empty list/);
  assert.doesNotMatch(ty('fun h l = case l of nil => 0 | x :: r => 1'), /WARNING/);
});

test('every program the game ships is free of holes', async () => {
  const ctx = typed();
  await loadPrelude(ctx);
  const disk = newShell();
  for (const dir of ['demos', 'robots_code']) {
    for (const name of runUnix(`ls ${dir}`, disk, {}).text.split(/\s+/).filter((n) => n.endsWith('.ml'))) {
      const src = runUnix(`cat ${dir}/${name}`, disk, {}).text;
      for (const l of joinProgram(src)) {
        const line = String(l.text !== undefined ? l.text : l);
        const t = typeReport(line, ctx);
        runRonml(line, ctx);
        assert.doesNotMatch(String(t || ''), /WARNING/, `${dir}/${name}: ${t}`);
      }
    }
  }
});

// ---- L-B: string escapes (v1.275) ------------------------------------------
// The tokenizer used to copy the character after a backslash verbatim, so
// `"a\nb"` was the three letters a, n, b — silently wrong data. This is
// Harper §2.2.4: \n \t \\ \" \ddd and the \…\ line-continuation.
test('string escapes are real characters, not their letters', async () => {
  const ctx = { station: 'laptop', session: {} };
  await loadPrelude(ctx);
  const run = (s) => { const r = runRonml(s, ctx); assert.ok(r.ok, `${s}: ${r.text}`); return r.text; };
  // The canonical round-trip: a\nb is THREE characters with a real newline at 1.
  assert.equal(run('size "a\\nb"'), '3');
  const echoed = run('echo "a\\nb"');
  assert.equal(echoed.length, 3);
  assert.equal(echoed.charCodeAt(1), 10, 'position 1 is a newline, not the letter n');
  assert.equal(run('size "x\\ty"'), '3', '\\t is one character');
  assert.equal(run('size "q\\"q"'), '3', '\\" is one character and does not end the string');
  assert.equal(run('size "a\\\\b"'), '3', '\\\\ is one backslash');
  assert.equal(run('ord (hd (explode "\\065"))'), '65', '\\ddd is a code point');
  assert.equal(run('size "ab\\   \\cd"'), '4', 'the \\…\\ gap elides whitespace across the break');
  assert.equal(run('size "hello"'), '5', 'an ordinary string is unaffected');
});

test('a bad string escape is reported, not swallowed', async () => {
  const ctx = { station: 'laptop', session: {} };
  await loadPrelude(ctx);
  assert.equal(runRonml('"a\\qb"', ctx).ok, false, '\\q is not an escape');
  assert.equal(runRonml('"a\\05b"', ctx).ok, false, '\\ddd needs three digits');
});

// ---- L-D: signature abbreviation and named ascription (v1.276) --------------
// `signature INT_DICT = DICT where type key = int` — the body is another
// signature's name, not a literal sig...end. views.sml is built entirely this
// way. Signatures track names, not types, so `where type` is a no-op.
test('a signature can be named from another, with where-type ignored', () => {
  const ctx = { station: 'laptop', session: {} };
  const run = (s) => { const r = runRonml(s, ctx); assert.ok(r.ok, `${s}: ${r.text}`); return r.text; };
  run('signature DICT = sig type key val empty : key val lt : key end');
  run('signature INT_DICT = DICT where type key = int');
  run('structure D :> INT_DICT = struct val empty = 0 val lt = 1 val secret = 2 end');
  assert.equal(run('D.empty'), '0', 'a name the signature lists is visible');
  // A name the signature omits is hidden — the qualified reference resolves to
  // nothing and (as a bare atom) prints itself.
  assert.equal(run('D.secret'), 'D.secret', 'a name the signature omits is hidden');
});

test('naming from an undeclared signature is reported', () => {
  const ctx = { station: 'laptop', session: {} };
  assert.equal(runRonml('signature Q = NOPE where type t = int', ctx).ok, false);
});

// ---- L-E: fixity declarations and op (v1.277) -------------------------------
// In Standard ML fixity is a PARSE-TIME fact: `infix 8 OR` changes how the next
// line reads. Harper's regexp.sml declares OR and THEN inside a structure and
// uses them three lines later.
test('infix declares an operator, with precedence and associativity', () => {
  const ctx = { station: 'laptop', session: {} };
  const run = (s) => { const r = runRonml(s, ctx); assert.ok(r.ok, `${s}: ${r.text}`); return r.text; };
  run('fun PLUS3 (a, b) = a + b + 3');
  run('fun TIMES (a, b) = a * b');
  run('infixr 2 PLUS3');
  run('infix 9 TIMES');
  assert.equal(run('1 PLUS3 2'), '6', 'a declared operator is applied to the pair');
  assert.equal(run('1 PLUS3 2 PLUS3 3'), '12', 'infixr groups to the right');
  assert.equal(run('1 PLUS3 2 TIMES 3'), '10', 'the higher precedence binds tighter');
  run('nonfix PLUS3');
  assert.equal(run('PLUS3 (1, 2)'), '6', 'nonfix puts it back to an ordinary function');
});

test('the type checker reads a line with the same fixity the evaluator does', () => {
  // Found by the REPL, which typechecks before it evaluates. `typeReport` used
  // to parse with the DEFAULT table while the evaluator parsed with the
  // session's, so after `infix 6 plus` the checker read `2 plus 3` as applying
  // 2 to two arguments and called it ill-typed. Advisory mode printed a warning
  // for a perfectly good line; strict mode refused it outright.
  const ctx = { station: 'laptop', session: {}, types: true };
  // Drive it the way every real caller does: check the line, then run it. The
  // checker only learns a binding from its own pass, so a test that skips it
  // is testing an empty environment.
  const run = (s) => {
    typeReport(s, ctx);
    const r = runRonml(s, ctx); assert.ok(r.ok, `${s}: ${r.text}`); return r.text;
  };
  run('fun plus (a, b) = a + b');
  run('infix 6 plus');
  assert.equal(typeReport('2 plus 3', ctx), 'int', 'the checker sees the operator, not an application');
  assert.equal(run('2 plus 3'), '5');
});

test('a strict session accepts a line that its own infix declaration enables', () => {
  const ctx = { station: 'laptop', session: {}, types: true, typecheck: 'strict' };
  const run = (s) => { const r = runRonml(s, ctx); assert.ok(r.ok, `${s}: ${r.text}`); return r.text; };
  run('fun plus (a, b) = a + b');
  run('infix 6 plus');
  assert.equal(run('1 plus 2 plus 3'), '6');
});

test('op passes an operator as a value', () => {
  const ctx = { station: 'laptop', session: {} };
  const run = (s) => { const r = runRonml(s, ctx); assert.ok(r.ok, `${s}: ${r.text}`); return r.text; };
  assert.equal(run('op + (1, 2)'), '3');
  assert.equal(run('op * (3, 4)'), '12');
  assert.equal(run('op :: (1, nil)'), '[1]');
  // The point of op: handing an operator to something else, as Harper's
  // fcnls.sml does with `reduce (0, op +, l)`.
  run('fun apply2 (f, a, b) = f (a, b)');
  assert.equal(run('apply2 (op +, 4, 5)'), '9');
});

test('the built-in fixities are Standard ML\'s own', () => {
  const ctx = { station: 'laptop', session: {} };
  const run = (s) => { const r = runRonml(s, ctx); assert.ok(r.ok, `${s}: ${r.text}`); return r.text; };
  assert.equal(run('2 + 3 * 4'), '14', '* (7) binds tighter than + (6)');
  assert.equal(run('10 - 3 - 2'), '5', '- is left-associative');
  assert.equal(run('1 :: 2 :: nil'), '[1, 2]', ':: is right-associative');
  assert.equal(run('"a" ^ "b" ^ "c"'), 'abc');
});

// v1.285 revises this. The old version asserted `o` and `before` are NOT infix,
// on the grounds that seeding them into defaultFixity() broke a program using
// `o` as a parameter name. Two things were wrong with that. The parameter-name
// case is not valid Standard ML either — `o` is infix in the top-level
// environment there, so `fun f o = …` is a syntax error in SML too — and every
// use of `o` in Harper's corpus is composition, none is a variable. What stays
// true is the mechanism: the fixity comes from an `infix` declaration in the
// PRELUDE, where a program can see it and turn it off, and not from the parser.
test('o and before are infix, and come by declaration rather than by seeding', () => {
  assert.ok(!Object.prototype.hasOwnProperty.call(defaultFixity(), 'o'),
    'the parser itself must not know about o; the prelude declares it');
  assert.ok(!Object.prototype.hasOwnProperty.call(defaultFixity(), 'before'),
    'the parser itself must not know about before; the prelude declares it');

  const ctx = { station: 'laptop', session: {} };
  const run = (s) => { const r = runRonml(s, ctx); assert.ok(r.ok, `${s}: ${r.text}`); return r.text; };
  loadPrelude(ctx);
  run('fun inc x = x + 1');
  run('fun dbl x = x * 2');
  assert.equal(run('(inc o dbl) 5'), '11', 'o composes right to left');
  assert.equal(run('(dbl o inc) 5'), '12');
  assert.equal(run('1 before 2'), '1', 'before evaluates both and keeps the first');
  assert.equal(run('ignore (3 + 4)'), '()');
});

test('nonfix o gives the name back to a program that wants it', () => {
  // The escape hatch, and the reason fixity belongs in the prelude rather than
  // the parser: a program can say it wants the name for something else.
  const ctx = { station: 'laptop', session: {} };
  const run = (s) => { const r = runRonml(s, ctx); assert.ok(r.ok, `${s}: ${r.text}`); return r.text; };
  loadPrelude(ctx);
  run('nonfix o');
  run('fun f o = o + 1');
  assert.equal(run('f 2'), '3');
});

// ---- L-F: simultaneous declarations (v1.278) --------------------------------
// `and` joins declarations of the same kind, and the keyword is not repeated
// after it. It was the largest remaining bucket in the conformance histogram:
// mutually recursive datatypes, simultaneous type abbreviations, and mutually
// recursive functions.
test('and joins declarations of the same kind', () => {
  const ctx = { station: 'laptop', session: {} };
  const run = (s) => { const r = runRonml(s, ctx); assert.ok(r.ok, `${s}: ${r.text}`); return r.text; };
  run('type count = int and average = real');
  run('datatype t = A | B and u = C | D');
  assert.equal(run('C'), 'C', 'the second datatype\'s constructors are registered');
  assert.equal(run('B'), 'B');
  run('val a = 1 and b = 2');
  assert.equal(run('a + b'), '3');
});

test('mutually recursive functions defined with and', () => {
  const ctx = { station: 'laptop', session: {} };
  const run = (s) => { const r = runRonml(s, ctx); assert.ok(r.ok, `${s}: ${r.text}`); return r.text; };
  run('fun ev 0 = true | ev n = od (n-1) and od 0 = false | od n = ev (n-1)');
  assert.equal(run('ev 10'), 'true');
  assert.equal(run('ev 7'), 'false');
  assert.equal(run('od 7'), 'true', 'od is callable, and calls back into ev');
});

test('and is still boolean conjunction where that is what it is', () => {
  // This build accepts `and` for both, so the two readings have to be told
  // apart. A declaration chain has a name and its patterns and then `=`;
  // anything else is the conjunction.
  const ctx = { station: 'laptop', session: {} };
  const run = (s) => { const r = runRonml(s, ctx); assert.ok(r.ok, `${s}: ${r.text}`); return r.text; };
  assert.equal(run('true and false'), 'false');
  assert.equal(run('true and true'), 'true');
  assert.equal(run('let val x = true and y = false in x and y end'), 'false',
    'a let-chain and a conjunction in the same line');
});

// ---- L-F: annotated fn parameters (v1.279) ----------------------------------
test('a fn parameter may carry its type without brackets', async () => {
  const ctx = { station: 'laptop', session: {}, types: true };
  await loadPrelude(ctx);
  const run = (s) => { const r = runRonml(s, ctx); assert.ok(r.ok, `${s}: ${r.text}`); return r.text; };
  assert.equal(run('(fn x : real => x + 1.0) 2.0'), '3.0');
  assert.equal(run('(fn (x : real) => x + 1.0) 2.0'), '3.0', 'the bracketed form still works');
  // The annotation is KEPT, not skipped: the checker still sees the claim.
  assert.equal(typeReport('fn x : real => x', ctx), 'real -> real');
});

test('a type annotation containing -> does not eat the fn arrow', () => {
  // `->` is ARROWT and belongs to the type; `=>` is ARROW and ends it. The type
  // skipper consumed ARROW, so it swallowed the arrow of every annotated fn and
  // the error blamed the missing `=>`.
  const ctx = { station: 'laptop', session: {} };
  const run = (s) => { const r = runRonml(s, ctx); assert.ok(r.ok, `${s}: ${r.text}`); return r.text; };
  assert.equal(run('(fn f : int -> int => f 3) (fn y => y * 2)'), '6');
});

test('each arm of a multi-clause fn may be annotated too', () => {
  const ctx = { station: 'laptop', session: {} };
  const run = (s) => { const r = runRonml(s, ctx); assert.ok(r.ok, `${s}: ${r.text}`); return r.text; };
  assert.equal(run('(fn nil => 0 | x :: r => 1) [1]'), '1');
  assert.equal(run('(fn 0 : int => "zero" | _ => "some") 0'), 'zero');
});

// ---- L-F: two parse bugs found inside structures (v1.280) -------------------
test('a let binding a pattern consumes its end', () => {
  // `let val (d, a, b) = … in … end` parsed the body and then reported `end` as
  // unexpected, because only the name-binding path ate it. Destructuring a
  // tuple out of a function's result is ordinary ML and the corpus is full of it.
  const ctx = { station: 'laptop', session: {} };
  const run = (s) => { const r = runRonml(s, ctx); assert.ok(r.ok, `${s}: ${r.text}`); return r.text; };
  assert.equal(run('let val (x, y) = (3, 4) in x * y end'), '12');
  assert.equal(run('let (x, y) = (3, 4) in x * y end'), '12', 'and without the val');
  assert.equal(run('let val (d, a, b) = (1, 2, 3) in d + a + b end'), '6');
  assert.equal(run('let val [p, q] = [5, 6] in p * q end'), '30');
  assert.equal(run('let (x, y) = (3, 4) in x * y'), '12', 'the end is optional, as before');
});

test('a datatype constructor argument stops at the next declaration', () => {
  // The `of` type was read by a hand-rolled loop that ate any run of
  // identifiers, so `datatype t = N of int val z = 1` swallowed `val z` and
  // then blamed the `=`. It only showed inside a structure, where a datatype
  // is followed by more declarations.
  const ctx = { station: 'laptop', session: {} };
  const run = (s) => { const r = runRonml(s, ctx); assert.ok(r.ok, `${s}: ${r.text}`); return r.text; };
  run('structure A = struct datatype t = E | N of int val z = 1 end');
  assert.equal(run('A.z'), '1', 'the declaration after the datatype survived');
  run("structure B = struct datatype 'a t = E | N of 'a t * int val z = 2 end");
  assert.equal(run('B.z'), '2');
  // …and the arity it counts is still right, which is what the loop was for.
  run('datatype pair = P of int * int');
  run('datatype one = Q of int');
  assert.equal(run('Q 5'), 'Q 5', 'a one-argument constructor still takes one');
});

// ---- L-F: functor sugar and character escapes (v1.281) ----------------------
test('a functor parameter and argument may be written as declarations', () => {
  // Standard ML's sugar: `functor F (structure K : S)` means the parameter is
  // an anonymous structure with K visible directly in the body, and
  // `F (structure K = X)` supplies it the same way. Applying a functor here
  // already bound the argument's names both bare and under the parameter name,
  // so the sugar only had to reach that.
  const ctx = { station: 'laptop', session: {} };
  const run = (s) => { const r = runRonml(s, ctx); assert.ok(r.ok, `${s}: ${r.text}`); return r.text; };
  run('signature ORDERED = sig val lt : int end');
  run('structure LessInt = struct fun lt (a, b) = a < b end');
  run('functor DictFun (structure K : ORDERED) = struct fun cmp (a, b) = K.lt (a, b) end');
  run('structure D = DictFun (structure K = LessInt)');
  assert.equal(run('D.cmp (1, 2)'), 'true', 'the body reached K through the sugar');
  // The plain form still works.
  run('structure A = struct val v = 7 end');
  run('functor G (X) = struct val w = X.v end');
  run('structure B = G (A)');
  assert.equal(run('B.w'), '7');
});

test('where type is skipped after every ascription, not only a signature', () => {
  const ctx = { station: 'laptop', session: {} };
  const run = (s) => { const r = runRonml(s, ctx); assert.ok(r.ok, `${s}: ${r.text}`); return r.text; };
  run('signature DICT = sig val v : int end');
  run('signature IDICT = DICT where type key = int');
  run('functor F (structure K : DICT) :> DICT where type Key.t = K.t = struct val v = 1 end');
});

test('a character literal takes the same escapes a string does', () => {
  // The char lexer decoded none of them, so `#"\\"` could not be lexed at all
  // and Harper's regexp tokenizer — which matches it to spot an escaped
  // character in a pattern — was unreadable. One decoder now serves both.
  const ctx = { station: 'laptop', session: {} };
  const run = (s) => { const r = runRonml(s, ctx); assert.ok(r.ok, `${s}: ${r.text}`); return r.text; };
  assert.equal(run('ord #"\\\\"'), '92', 'a backslash character');
  assert.equal(run('ord #"\\n"'), '10', 'a newline character');
  assert.equal(run('ord #"a"'), '97');
  assert.equal(run('size "a\\nb"'), '3', 'strings are unchanged');
});

// ---- L-C: SML's top-level answer (v1.282) -----------------------------------
// `val it = 7 : int` is what Standard ML replies to a bare expression. This was
// assembled inline in the terminal, where no test could reach it; it is a pure
// function now, so the shape is checked here rather than by typing at a CRT.
test('a bare expression is echoed as val it = … : ty', () => {
  assert.deepEqual(smlEcho('7', 'int'), ['val it = 7 : int']);
  assert.deepEqual(smlEcho('[1, 2]', 'int list'), ['val it = [1, 2] : int list']);
});

test('a declaration names itself and does not become it', () => {
  assert.deepEqual(smlEcho('val f = <fn>', 'int -> int'), ['val f = <fn> : int -> int']);
  assert.deepEqual(smlEcho('datatype t = A | B', 'unit'), ['datatype t = A | B']);
  assert.deepEqual(smlEcho('exception Fail', 'unit'), ['exception Fail']);
});

test('with no type to show, the value is printed as it was', () => {
  assert.deepEqual(smlEcho('7', null), ['7'], 'the checker is off');
  assert.deepEqual(smlEcho('7', 'TYPE: int and str are not the same type'), ['7'],
    'a clash is printed on its own line before this, not folded in here');
  assert.deepEqual(smlEcho('', 'int'), [], 'nothing to say, nothing said');
});

test('an exhaustiveness warning rides after the type, on its own line', () => {
  assert.deepEqual(
    smlEcho('val n = <fn>', "colour -> int    WARNING: this case does not cover Blue"),
    ['val n = <fn> : colour -> int', '  WARNING: this case does not cover Blue'],
  );
});

// ---- L-H: strict mode (v1.283) ----------------------------------------------
// In Standard ML a program that does not typecheck does not run. Until this
// existed the accurate claim was that AI-ML *infers* types, not that it *is*
// typed, and Harper's unityped critique applied in full.
const strict = () => ({ station: 'laptop', session: {}, types: true, typecheck: 'strict' });
const advisory = () => ({ station: 'laptop', session: {}, types: true, typecheck: 'report' });

test('strict mode refuses a line the checker rejects', async () => {
  const ctx = strict();
  await loadPrelude(ctx);
  const r = runRonml('val x : int = "hello"', ctx);
  assert.equal(r.ok, false, 'an annotation that is a lie is refused, not honoured');
  assert.match(r.text, /int and string|string and int/);
  // …and the binding did not happen.
  assert.match(String(runRonml('x', ctx).text), /x/, 'x is unbound, so it is just a word');
});

test('the same line is advisory in the game, which is deliberate', async () => {
  const ctx = advisory();
  await loadPrelude(ctx);
  const r = runRonml('val x : int = "hello"', ctx);
  assert.equal(r.ok, true, 'a machine in a ruin reports and lets the operator decide');
  assert.equal(r.text, 'val x = hello');
});

test('strict mode still runs what typechecks', async () => {
  const ctx = strict();
  await loadPrelude(ctx);
  assert.equal(runRonml('3 + 4', ctx).text, '7');
  assert.equal(runRonml('fun sq n = n * n', ctx).text, 'val sq = <fn>');
  assert.equal(runRonml('sq 5', ctx).text, '25');
  assert.equal(runRonml('List.map (fn x => x + 1) [1, 2]', ctx).text, '[2, 3]',
    'the prelude is reachable under strict (bare  is the obelisk verb)');
});

test('a warning is a warning under strict too, not a refusal', async () => {
  // Exhaustiveness is a warning in Standard ML as well: a non-exhaustive match
  // is legal and may simply raise at run time.
  const ctx = strict();
  await loadPrelude(ctx);
  runRonml('datatype colour = Red | Green | Blue', ctx);
  const r = runRonml('fun name c = case c of Red => 1 | Green => 2', ctx);
  assert.equal(r.ok, true, 'the hole is reported, and the definition stands');
  assert.equal(runRonml('name Red', ctx).text, '1');
});

test('the occurs check refuses under strict', async () => {
  const ctx = strict();
  await loadPrelude(ctx);
  const r = runRonml('fn x => x x', ctx);
  assert.equal(r.ok, false);
  assert.match(r.text, /infinite type/);
});

// ---- L-G: a Basis slice (v1.285) --------------------------------------------
// The yardstick is what Harper's files call, not the Basis document's 47
// structures. Everything here is written in AI-ML in PRELUDE and loaded as
// source, so a player can read the same map they would have written.
const basis = () => {
  const ctx = { station: 'laptop', session: {} };
  loadPrelude(ctx);
  return (s) => { const r = runRonml(s, ctx); assert.ok(r.ok, `${s}: ${r.text}`); return r.text; };
};

test('List gains find, partition, zip, unzip, app and last', () => {
  const run = basis();
  assert.equal(run('List.find (fn x => x > 2) [1,2,3,4]'), 'SOME 3');
  assert.equal(run('List.find (fn x => x > 9) [1,2]'), 'NONE');
  assert.equal(run('List.partition (fn x => x > 2) [1,2,3,4]'), '([3, 4], [1, 2])');
  assert.equal(run('List.last [1,2,3]'), '3');
  // zip stops at the shorter list rather than raising, as ListPair.zip does.
  assert.equal(run('List.zip ([1,2,3], [4,5])'), '[(1, 4), (2, 5)]');
  assert.equal(run('List.unzip [(1,2),(3,4)]'), '([1, 3], [2, 4])');
  assert.equal(run('ListPair.zip ([1,2], [3,4])'), '[(1, 3), (2, 4)]');
});

test('String gains substring, translate, tokens and fields', () => {
  const run = basis();
  assert.equal(run('String.substring ("hello", 1, 3)'), 'ell');
  assert.equal(run('String.translate (fn c => Char.toString c ^ "-") "abc"'), 'a-b-c-');
  // tokens drops empty fields, fields keeps them: the only difference.
  assert.equal(run('String.tokens (fn c => c = #",") "a,,b"'), '[a, b]');
  assert.equal(run('String.fields (fn c => c = #",") "a,,b"'), '[a, , b]');
  assert.equal(run('String.concatWith "-" ["a","b","c"]'), 'a-b-c');
  assert.equal(run('String.extract ("hello", 2, NONE)'), 'llo');
});

test('the toString family, and Int.fromString answering an option', () => {
  const run = basis();
  assert.equal(run('Int.toString 42'), '42');
  assert.equal(run('Bool.toString true'), 'true');
  assert.equal(run('Real.toString 1.5'), '1.5');
  assert.equal(run('Char.toString #"a"'), 'a');
  assert.equal(run('Int.fromString "42"'), 'SOME 42');
  assert.equal(run('Int.fromString "~7"'), 'SOME ~7', 'the tilde is SML\'s minus');
  // Not a numeral is NONE rather than an error: the caller decides.
  assert.equal(run('Int.fromString "no"'), 'NONE');
  assert.equal(run('Int.fromString ""'), 'NONE');
  assert.equal(run('Int.fromString "1x"'), 'NONE');
  assert.equal(run('Bool.fromString "true"'), 'SOME true');
  assert.equal(run('Bool.fromString "yes"'), 'NONE');
});

test('Option gains join and filter, Real gains round and fromInt', () => {
  const run = basis();
  assert.equal(run('Option.join (SOME (SOME 3))'), 'SOME 3');
  assert.equal(run('Option.join NONE'), 'NONE');
  assert.equal(run('Option.filter (fn x => x > 2) 5'), 'SOME 5');
  assert.equal(run('Option.filter (fn x => x > 2) 1'), 'NONE');
  assert.equal(run('Real.round 3.7'), '4');
  assert.equal(run('Real.fromInt 3'), '3.0');
  assert.equal(run('Real.abs ~2.5'), '2.5');
});

test('a line holding only a comment is empty input, not an error', () => {
  // Pasting a commented program produced one error per comment line before
  // v1.285. In Standard ML a comment is whitespace.
  const ctx = { station: 'laptop', session: {} };
  for (const s of ['(* just a comment *)', '   ', '(* one *) (* two *)']) {
    const r = runRonml(s, ctx);
    assert.ok(r.ok, `${JSON.stringify(s)} should be accepted: ${r.text}`);
    assert.equal(r.text, '');
  }
});

test('the prelude is written in AI-ML and every line of it loads', () => {
  // loadPrelude swallows a failing line so a broken library cannot brick the
  // terminal, which also means a broken line is INVISIBLE. This walks it.
  const ctx = { station: 'laptop', session: {} };
  const bad = [];
  for (const l of joinProgram(PRELUDE)) {
    const text = String(l && l.text !== undefined ? l.text : l);
    if (!text.trim()) continue;
    let r;
    try { r = runRonml(text, ctx); } catch (e) { r = { ok: false, text: String(e.message) }; }
    if (!r.ok) bad.push(`${text.split('\n')[0].slice(0, 50)} -> ${r.text}`);
  }
  assert.deepEqual(bad, [], 'every prelude declaration must load');
});

// ---- ml -strict at the NostBook (v1.288) ------------------------------------
// The game is advisory everywhere by design: a machine in a ruin should say what
// it worked out and let the operator decide. The laptop is the exception a
// player can ask for, because it is the machine you own and the one you learn
// on, and Standard ML refuses a program that does not typecheck.
test('a laptop session can be put into strict mode, and the machines cannot', () => {
  const advisory = { station: 'laptop', session: {}, types: true, typecheck: 'off' };
  const r1 = runRonml('val x : int = "hello"', advisory);
  assert.ok(r1.ok, 'advisory honours the line');

  const strict = { station: 'laptop', session: {}, types: true, typecheck: 'strict' };
  const r2 = runRonml('val x : int = "hello"', strict);
  assert.equal(r2.ok, false, 'strict refuses it');
  assert.match(r2.text, /not the same type/);
  // Refused means nothing was bound.
  assert.match(runRonml('x', strict).text, /no such command/);

  // A machine carrying its own program has no checker and nobody to read one,
  // so a robot context stays advisory whatever it is handed.
  const robot = { station: 'robot', session: {} };
  assert.ok(runRonml('val x : int = "hello"', robot).ok, 'a machine never refuses');
});

test('strict and advisory agree on everything except whether the line runs', () => {
  const mk = (mode) => ({ station: 'laptop', session: {}, types: true, typecheck: mode });
  for (const good of ['3 + 4', 'fun f x = x + 1', 'val xs = [1,2,3]']) {
    const a = runRonml(good, mk('off'));
    const b = runRonml(good, mk('strict'));
    assert.equal(a.text, b.text, `${good} reads the same in both modes`);
  }
  // A warning stays a warning under both: a non-exhaustive match is legal ML.
  const s = mk('strict');
  assert.ok(runRonml('datatype c = R | G | B', s).ok);
  assert.ok(runRonml('case R of R => 1 | G => 2', s).ok, 'exhaustiveness warns, never refuses');
});

test('no obelisk verb shadows a machine sensor', () => {
  // A machine's own program reads its senses by name — `charge`, `threat`,
  // `sight`, `blight`. Those names are bound when a robot's program runs, so a
  // CONSOLE verb of the same name shadows the sensor and the machine's program
  // silently stops seeing the world.
  //
  // This happened twice in one change (v1.336): `sight` and then `blight` were
  // added as control verbs at the obelisk, and both shadowed sensors. The
  // fire-control tests caught them, but only because those sensors happen to be
  // covered; a sensor without a test would have gone through. So: the two lists
  // are compared directly.
  const clash = OB_VERBS.filter((v) => MACHINE_ONLY.includes(v));
  assert.deepEqual(clash, [],
    `these obelisk verbs shadow a machine's own senses: ${clash.join(', ')}. `
    + 'Rename the verb — the sensor name is the one a player writes into a robot.');
});


// ---- `local` after another declaration (task #83) --------------------------
//
// `local` alone in a struct body worked; `local` after anything else did not,
// and the failure was silent in the worst way — a struct whose body will not
// parse is dropped WHOLE, so the symptom was `Word.toString` simply being
// unbound with no error anywhere.
//
// The cause was a hand-written list in `atomStarts` of the keywords that cannot
// begin an atom. `local` was missing from it, so juxtaposition ate it as an
// argument to whatever came before. It is built from DECL_KEYWORDS now, so it
// cannot go stale again — `abstype`, `functor`, `withtype`, `infix`, `infixr`,
// `nonfix` and `with` were missing with it.
test('local follows another declaration inside a struct', () => {
  const run = (src) => runRonml(src, { session: {} });
  assert.equal(run('structure A = struct local val x = 1 in val y = x end end').ok, true);
  const b = run('structure B = struct val hi = 1 local val x = 2 in val y = x end end');
  assert.equal(b.ok, true, `local after a val: ${b.text}`);
  const c = run('structure C = struct fun f a = a local val x = 2 in val y = x end end');
  assert.equal(c.ok, true, `local after a fun: ${c.text}`);
});

test('a struct that uses local still binds what it shows', () => {
  // The point of the form: `x` is hidden, `y` is not.
  const s = {};
  assert.equal(runRonml('structure L = struct local val x = 41 in val y = x + 1 end end', { session: s }).ok, true);
  assert.equal(runRonml('L.y', { session: s }).text, '42');
});

test('every declaration keyword ends an argument list', () => {
  // The general form of the bug. A declaration keyword can never be an
  // argument, so `1 <kw>` must not read as an application — it must report the
  // keyword, not complain about something the line does not contain.
  for (const kw of ['local', 'abstype', 'functor', 'withtype', 'infix', 'infixr', 'nonfix',
    'val', 'fun', 'type', 'datatype', 'exception', 'structure', 'signature', 'open']) {
    const r = runRonml(`val hi = 1 ${kw}`, { session: {} });
    assert.equal(r.ok, false, `'${kw}' after a binding should not parse as one line`);
    assert.match(r.text, new RegExp(`got '${kw}'|expected`),
      `'${kw}' was swallowed as an argument instead of ending the line: ${r.text}`);
  }
});


// ---- `val op +` (task #84) -------------------------------------------------
//
// `op` in a left-hand side was taught to `fun` at v1.322 and not to `val`. The
// `val` form is the one that matters for shadowing: its right-hand side runs in
// the environment as it stands, so the OLD operator is still there to build the
// new one out of, where `fun` would see itself and recurse.
test('val binds an operator, parenthesised or not', () => {
  for (const src of ['val (op +) = fn (a, b) => a', 'val op + = fn (a, b) => a',
    'val (op ~) = fn a => 0 - a', 'val (op * ) = fn (a, b) => a']) {
    assert.equal(runRonml(src, { session: {} }).ok, true, src);
  }
});

test('and val still takes a pattern there', () => {
  // What the exclusion was protecting. `(a, b)` after `val` is a tuple pattern
  // and must not be read as an operator left-hand side.
  const s = {};
  assert.equal(runRonml('val (a, b) = (1, 2)', { session: s }).ok, true);
  assert.equal(runRonml('a + b', { session: s }).text, '3');
  const t = {};
  assert.equal(runRonml('val [x, y] = [3, 4]', { session: t }).ok, true);
  assert.equal(runRonml('x + y', { session: t }).text, '7');
});

test('a structure can rebind an operator and build it from the old one', () => {
  // The shape Word needs: the inner `+` is the ordinary one, and the rebinding
  // is reachable qualified without disturbing the operator outside.
  const s = {};
  assert.equal(runRonml('structure W = struct val (op +) = fn (a, b) => a + b + 1000 end', { session: s }).ok, true);
  assert.equal(runRonml('W.+ (1, 2)', { session: s }).text, '1003', 'the inner + must be the old one');
  assert.equal(runRonml('1 + 2', { session: s }).text, '3', 'and the outer + is untouched');
});
