// Assertion helpers shared by the conformance tests.
//
// They exist so a test reads as a claim about Standard ML rather than as a
// claim about this implementation's plumbing. `evals('2 + 3 * 4', '14')` says
// what SML says; where the two disagree the disagreement goes in the departure
// register with its reason, not into a softened assertion here.

import assert from 'node:assert/strict';
import { session } from './interp.mjs';

// Re-exported so a test file has one import line rather than two.
export { session, once, typeOnce, backend, raw, gameRaw, hasGame } from './interp.mjs';

/** Error text that means the JavaScript underneath surfaced instead of the language. */
const JS_LEAKS = [
  /Maximum call stack size exceeded/i,
  /is not a function/i,
  /Cannot read propert/i,
  /undefined is not/i,
  /\bat [A-Za-z_$][\w$]*\s+\(/,      // a stack frame
  /\bTypeError\b/, /\bRangeError\b/, /\bReferenceError\b/,
];

/** Strip the console's ERR: prefix so a test can match the message itself. */
export function message(r) {
  return String(r && r.text === undefined ? r : r.text).replace(/^ERR:\s*/, '');
}

/** Run one line in a fresh session and return the printed text. */
export function out(src, opts) {
  return session(opts).run(src).text;
}

/** The line runs, and prints exactly `expected`. */
export function evals(src, expected, opts) {
  const r = session(opts).run(src);
  assert.equal(r.ok, true, `${src}\n  expected it to run, got: ${r.text}`);
  assert.equal(r.text, expected, `${src}\n  SML prints ${JSON.stringify(expected)}`);
}

/** A sequence of lines in one session; the LAST line must print `expected`. */
export function evalsSeq(lines, expected, opts) {
  const s = session(opts);
  let last;
  for (const line of lines) {
    last = s.run(line);
    assert.ok(last.ok !== false || line === lines[lines.length - 1],
      `${line}\n  failed part-way through the sequence: ${last.text}`);
  }
  assert.equal(last.ok, true, `${lines[lines.length - 1]}\n  expected it to run, got: ${last.text}`);
  assert.equal(last.text, expected, `${lines.join(' ; ')}\n  SML prints ${JSON.stringify(expected)}`);
  return s;
}

/** The line is refused, with a message that teaches rather than leaking JS. */
export function refuses(src, re, opts) {
  const r = session(opts).run(src);
  assert.equal(r.ok, false, `${src}\n  expected a refusal, but it ran and printed ${JSON.stringify(r.text)}`);
  noJsLeak(r.text, src);
  if (re) assert.match(message(r), re, `${src}\n  refused, but not for the stated reason`);
  return message(r);
}

/**
 * Whatever happens, the operator must not be shown a JavaScript error. The
 * design has said since the first console that every message is a teaching
 * error and never a raw stack trace; this is the assertion of that claim.
 */
export function noJsLeak(text, src = '') {
  for (const re of JS_LEAKS) {
    assert.ok(!re.test(String(text)),
      `${src}\n  a JavaScript error reached the operator: ${JSON.stringify(String(text))}`);
  }
}

/** The inferred type of one line, as the checker reports it. */
export function typeOf(src, opts) {
  return session(opts).type(src);
}

/** The line infers exactly this type. */
export function types(src, expected, opts) {
  const t = typeOf(src, opts);
  assert.equal(t, expected, `${src}\n  expected the type ${JSON.stringify(expected)}, got ${JSON.stringify(t)}`);
}

/** The type report names a clash. The build reports rather than refusing, so the line may still run. */
export function typeClash(src, re, opts) {
  const t = String(typeOf(src, opts));
  assert.match(t, /^TYPE:/, `${src}\n  expected a reported type clash, got ${JSON.stringify(t)}`);
  if (re) assert.match(t, re, `${src}\n  clash reported for a different reason`);
}

/** The type report carries an exhaustiveness warning naming `what`. */
export function warnsMissing(src, what, opts) {
  const t = String(typeOf(src, opts));
  assert.match(t, /WARNING: this case does not cover/, `${src}\n  expected an exhaustiveness warning, got ${JSON.stringify(t)}`);
  assert.match(t, new RegExp(what), `${src}\n  warned, but did not name ${what}`);
}

/** Build a session, run setup lines, hand it back. */
export function withLines(lines, opts) {
  const s = session(opts);
  for (const line of lines) s.run(line);
  return s;
}
