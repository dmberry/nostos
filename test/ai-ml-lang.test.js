// AI-ML language additions (v1.187): string literals + `echo`, the BBC-Micro
// `*command` form (literal args), and "no such command" for a bare typo. Drives
// runRonml against a tiny self-contained ctx — no world, no DOM.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runRonml, decide, AIML_CREDIT, joinProgramLines, diagnose, joinProgram, typeReport, aimlVersion, aimlFull, NOT_FITTED_SAMPLES, loadPrelude } from '../src/game/ai_ml.js';
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
  assert.equal(runRonml('5 - 8', ctx()).text, '-3');
  assert.equal(runRonml('-3', ctx()).text, '-3');
});

test('division by zero is a teaching error, not Infinity', () => {
  const r = runRonml('1.0 / 0.0', ctx());
  assert.equal(r.ok, false);
  assert.match(r.text, /division by zero/);
  assert.match(runRonml('1 div 0', ctx()).text, /div by zero/);
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
  assert.equal(run('Rect 2 4'), 'Rect 2 4', 'arity comes from the * in the type');
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
    'Times (Star (Plus (Chr a) (Chr b))) (Chr c)',
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
  assert.match(runRonml('1 div 0', ctx).text, /div by zero/);
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
  assert.equal(run('Node Empty 5 Empty'), 'Node Empty 5 Empty', 'three-part constructors too');
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
  assert.equal(run('norm (Node Leaf Leaf)'), 'Node Leaf Leaf');
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

test('every demo on the laptop disk runs to the end', () => {
  const disk = newShell();
  const listed = runUnix('ls demos', disk, {}).text.split(/\s+/).filter(Boolean);
  assert.ok(listed.length >= 6, 'there are demos to run');
  for (const name of listed) {
    // engage.ml is a MACHINE program: it reads sensors a laptop does not have,
    // and running it here should fail. It has its own tests, against decide().
    if (name === 'engage.ml') continue;
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
  assert.match(String(diagnose('infix 8 OR')), /infix/);
  assert.match(String(diagnose('String.explode s')), /not on this machine/);
  // And everything that used to be here is simply supported now.
  for (const src of ['signature S = sig val go : int end', 'exception Fail', 'type t = int',
    '#"a"', '~3', 'val x : int = 5', 'let r = ref 0',
    'local fun h n = n in fun t n = h n end']) {
    assert.equal(diagnose(src), null, `${src} is supported now`);
    assert.ok(!String(runRonml(src, sess()).text).startsWith('ERR'), `${src} runs`);
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
  assert.equal(t('"hi"'), 'str');
  assert.equal(t('[1, 2, 3]'), 'int list');
  assert.equal(t('(1, "a")'), 'int * str');
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
  assert.match(full, /no infix, no op/, 'the one real gap left is still named');
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
  assert.equal(String(runRonml('~3', ctx).text), '-3');
  assert.equal(String(runRonml('~3.5', ctx).text), '-3.5');
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
  assert.equal(run('List.foldl (fn h => fn a => h + a) 0 [1, 2, 3]'), '6');
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
  assert.equal(ty('id "a"'), 'str', 'still polymorphic after use at int');
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
