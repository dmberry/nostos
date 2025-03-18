// The standalone REPL, driven the way a person drives it: through stdin and
// argv, in a real process.
//
// The plan says the suite is blind to reach, and that every serious defect this
// month was correct in the module and wrong in the hand. `bin/bml.js` is the
// hand for the standalone language: a REPL that answers correctly when called
// as a function and wrongly when typed at is still wrong. So these tests spawn
// the binary rather than importing it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const BML = path.join(REPO, 'bin', 'bml.js');
const FIXTURES = path.join(HERE, 'fixtures');

const HAVE_BML = fs.existsSync(BML);

/** Run the REPL with argv and stdin, and hand back everything it said. */
function bml(args = [], stdin = '') {
  const r = spawnSync(process.execPath, [BML, ...args], {
    input: stdin, encoding: 'utf8', cwd: REPO, timeout: 20000,
  });
  return { out: `${r.stdout || ''}${r.stderr || ''}`, code: r.status, signal: r.signal };
}

const JS_LEAK = /Maximum call stack|is not a function|Cannot read propert|\bTypeError\b|\bReferenceError\b|at [A-Za-z_$][\w$]*\s+\(/;

test('the REPL exists at bin/bml.js', { skip: !HAVE_BML && 'bin/bml.js not built yet' }, () => {
  assert.ok(fs.existsSync(BML));
});

test('--help says what it is without running anything', { skip: !HAVE_BML }, () => {
  const { out, code } = bml(['--help']);
  assert.equal(code, 0);
  assert.match(out, /Standard ML/i);
  assert.match(out, /strict/, 'the help names the default mode');
});

test('a line is read, evaluated and echoed the way a top level echoes', { skip: !HAVE_BML }, () => {
  const { out } = bml([], 'val x = 7\nx + 1\n:quit\n');
  assert.match(out, /val x = 7 : int/, 'a declaration echoes its name and type');
  assert.match(out, /val it = 8 : int/, 'a bare expression binds to it');
});

test(':t reports a type without evaluating', { skip: !HAVE_BML }, () => {
  const { out } = bml([], ':t fn y => y\n:quit\n');
  assert.match(out, /'a -> 'a/);
});

test('the credit is carried by the standalone binary', { skip: !HAVE_BML }, () => {
  const { out } = bml(['--help']);
  const banner = bml([], ':quit\n').out;
  assert.ok(/AI-ML|BML/.test(out + banner), 'the language names itself at the prompt');
});

// ---- the property that makes it an ML ------------------------------------

test('strict is the default: an ill-typed line is refused, not run', { skip: !HAVE_BML }, () => {
  const { out } = bml([], 'if true then 1 else "a"\n:quit\n');
  assert.match(out, /not the same type/, 'the type error is reported');
  assert.ok(!/val it = 1/.test(out), 'and the line did NOT run');
});

test('--sloppy runs the same line and names the clash', { skip: !HAVE_BML }, () => {
  const { out } = bml(['--sloppy'], 'if true then 1 else "a"\n:quit\n');
  assert.match(out, /advisory/, 'the banner says which mode this is');
  assert.match(out, /\b1\b/, 'the line ran');
});

test('strict does not refuse a merely non-exhaustive case', { skip: !HAVE_BML }, () => {
  const { out } = bml([], [
    'datatype colour = Red | Green | Blue',
    'case Red of Red => 1 | Green => 2',
    ':quit',
  ].join('\n'));
  assert.match(out, /val it = 1 : int/, 'a warning is advice, not an ill-typed program');
  assert.match(out, /WARNING/);
});

// ---- files ---------------------------------------------------------------

test('a file is read as declarations, not one physical line at a time', { skip: !HAVE_BML }, () => {
  // `ml file.ml` once fed the interpreter one line at a time, so a program file
  // could hold nothing but one-liners and every multi-line function failed on
  // its second line. The fixture is deliberately laid out across lines.
  const { out, code } = bml([path.join(FIXTURES, 'ok.ml')]);
  assert.equal(code, 0, `the file should run clean:\n${out}`);
  assert.match(out, /fixture ran/);
  assert.ok(!JS_LEAK.test(out), `a JavaScript error reached the operator:\n${out}`);
});

test('a file stops where it goes wrong and says so', { skip: !HAVE_BML }, () => {
  const { out, code } = bml([path.join(FIXTURES, 'broken.ml')]);
  assert.notEqual(code, 0, 'a file that fails must exit non-zero');
  assert.match(out, /stopped in/, 'it names the file it stopped in');
  assert.ok(!/val never/.test(out), 'nothing after the error was loaded');
});

test('-i runs the file and then stays at the prompt', { skip: !HAVE_BML }, () => {
  const { out } = bml(['-i', path.join(FIXTURES, 'ok.ml')], 'answer\n:quit\n');
  assert.match(out, /fixture ran/);
  assert.match(out, /val it = 126 : int/, 'the file’s bindings are there at the prompt');
});

test('use "file.ml" loads a file from the prompt, as SML does', { skip: !HAVE_BML }, () => {
  const f = path.join(FIXTURES, 'ok.ml').replace(/\\/g, '/');
  const { out } = bml([], `use "${f}";\nanswer\n:quit\n`);
  assert.match(out, /val it = 126 : int/);
});

// ---- the contract that holds however it is driven ------------------------

test('nothing typed at the prompt can make the REPL leak a JavaScript error', { skip: !HAVE_BML }, () => {
  const nonsense = [
    '(', '[1,', 'let val', 'fun f x =', 'case 1 of', '"unterminated',
    '(*', '1 + + 2', 'hd hd', 'op op', 'val rec', '#', '~',
    'let f x = f x in f 1',
    'use "no-such-file.ml";',
    ':t (',
  ].join('\n');
  const { out, signal } = bml([], `${nonsense}\n:quit\n`);
  assert.ok(!JS_LEAK.test(out), `a JavaScript error reached the operator:\n${out}`);
  assert.ok(!signal, `the REPL died on a signal: ${signal}`);
});

test('the REPL survives every one of those and still evaluates', { skip: !HAVE_BML }, () => {
  const { out } = bml([], '(\nval kept = 3\n[1,\nkept + 1\n:quit\n');
  assert.match(out, /val it = 4 : int/, 'a binding made between two errors is still there');
});

test('a runaway program at the prompt faults instead of hanging', { skip: !HAVE_BML }, () => {
  const { out, signal } = bml([], 'let f x = f x in f 1\n1 + 1\n:quit\n');
  assert.ok(!signal, 'it did not have to be killed');
  assert.match(out, /step budget|recursion/, 'it faulted for a reason it can name');
  assert.match(out, /val it = 2 : int/, 'and the prompt came back');
});
