// AI-ML language additions (v1.187): string literals + `echo`, the BBC-Micro
// `*command` form (literal args), and "no such command" for a bare typo. Drives
// runRonml against a tiny self-contained ctx — no world, no DOM.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runRonml } from '../src/game/ronml.js';

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
  assert.equal(runRonml('12 / 4', ctx()).text, '3');
});

test('unary minus and subtraction share the freed `-`', () => {
  assert.equal(runRonml('5 - 8', ctx()).text, '-3');
  assert.equal(runRonml('-3', ctx()).text, '-3');
});

test('division by zero is a teaching error, not Infinity', () => {
  const r = runRonml('1 / 0', ctx());
  assert.equal(r.ok, false);
  assert.match(r.text, /division by zero/);
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

test('the countdown works without the optional parens too', () => {
  const c = ctx();
  runRonml('let go n = if n == 0 then echo "done" else echo n ; go (n - 1)', c);
  assert.equal(runRonml('go 2', c).text, '2\n1\ndone');
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
// docs/laptop-plan.md — the laptop is off the network by design, so it carries
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
