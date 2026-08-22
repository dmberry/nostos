// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// READING A FILE FROM THE LANGUAGE.
//
// `readFile` exists because of a bug it makes impossible. Every cipher in this
// game is position-dependent, and a program that can only be handed text one
// line at a time has to remember where in the key it got to. That bookkeeping
// is real, it is easy to get wrong, and it WAS got wrong: an opener was shipped
// that decoded the first line perfectly and turned every line after it into
// rubbish. It passed a hand-check, because the hand-check used line one.
//
// So these tests cover the thing itself, the gate around it, and the property
// that made it worth building: whole text in, no counter, no drift.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runRonml, loadPrelude, joinProgram } from '../src/game/ai_ml.js';
import { setReadFile, setWriteFile } from '../src/lang/eval.js';
import { SESSION_OPENER, NOTE_OPENER, NOTE_FILE } from '../src/game/seals.js';

/** Run a program at a station, with a disk of {name: text} or none at all. */
async function run(src, { station = 'laptop', disk = null } = {}) {
  const out = [];
  const ctx = { station, session: {}, print: (t) => out.push(t) };
  setReadFile(disk ? (n) => (n in disk ? disk[n] : null) : null);
  setWriteFile(disk ? (n, t) => { disk[n] = t; return true; } : null);
  await loadPrelude(ctx);
  // joinProgram, not split('\n'): a `fun` spanning several lines is ONE
  // declaration, and feeding it a line at a time makes each fragment its own
  // broken program. The relay test learned this first.
  let last = null;
  for (const l of joinProgram(src)) {
    const line = String(l.text !== undefined ? l.text : l);
    if (!line.trim()) continue;
    last = runRonml(line, ctx);
  }
  return { last, out };
}

test('readFile hands back the whole file, newlines and all', async () => {
  const disk = { 'a.txt': 'one\ntwo\nthree\n' };
  const { last } = await run('val t = readFile "a.txt"\nval n = size t', { disk });
  // 'one\ntwo\nthree\n' is fourteen characters: the three newlines count.
  assert.match(String(last.text), /\b14\b/, 'the newlines must survive the trip');
});

test('a file that is not there says so, by name', async () => {
  const { last } = await run('val t = readFile "nope.txt"', { disk: { 'a.txt': 'x' } });
  assert.match(String(last.text), /nope\.txt/);
  assert.match(String(last.text), /no such file/i);
});

test('a machine with no disk has no readFile and says which it is', async () => {
  // The gate is the vocabulary, not the hook: a unit in the field is not given
  // the verb, so the refusal names the station rather than blaming the file.
  const { last } = await run('val t = readFile "a.txt"', { station: 'robot', disk: null });
  assert.ok(!last.ok, 'a robot must not read files');
  assert.match(String(last.text), /command|disk|unbound|apply|not a|no such/i);
});

// ---- THE PROPERTY THE COUNTER USED TO BREAK -------------------------------

test('the session opener decodes a whole multi-line text in one call', async () => {
  // Vigenere: the key advances with every letter, so this is exactly the case
  // a per-line filter got wrong from the second line onward.
  const sealed = 'Iiv zvr blf mhmsd.\nMA XHUF SEG\nSlrz\'ry mhaixw ovgaujk cr eopun ekqmslvog id kxpdv.';
  const { last } = await run(
    SESSION_OPENER + '\nval out = open_file "s.asc"',
    { disk: { 's.asc': sealed } });
  const got = String(last.text);
  assert.match(got, /Men are all alike\./);
  assert.match(got, /IN WHAT WAY/, 'line two must be right, which is the line that used to break');
  assert.match(got, /always bugging us/, 'and line three');
});

test('the note opener decodes the sealed file it ships beside', async () => {
  const { last } = await run(
    NOTE_OPENER + '\nval out = open_file "note.asc"',
    { disk: { 'note.asc': NOTE_FILE } });
  const got = String(last.text);
  assert.match(got, /Action, and tone, and gesture/);
  assert.match(got, /Walter Scott/, 'and the whole of it, not just the head');
});

test('reading the same file twice gives the same answer', async () => {
  // A counter left over between calls is exactly what this catches: with state,
  // the second read continues from where the first stopped and comes out wrong.
  const sealed = 'Iiv zvr blf mhmsd.\nMA XHUF SEG';
  const src = SESSION_OPENER + '\nval a = open_file "s.asc"\nval b = open_file "s.asc"';
  const { last } = await run(src, { disk: { 's.asc': sealed } });
  assert.match(String(last.text), /Men are all alike\./,
    'the second call must not resume from where the first left off');
});

// ---- WRITING ---------------------------------------------------------------
//
// The reason to have it, in David's words: a language you cannot keep anything
// in is a calculator. The first exercise anybody is set in ML is a library, and
// a library whose shelf is gone when the program ends is not one.

test('writeFile puts a file down and readFile finds it again', async () => {
  const disk = {};
  const { last } = await run(
    'val _ = writeFile "shelf.txt" "Technics and Civilization"\nval back = readFile "shelf.txt"',
    { disk });
  assert.match(String(last.text), /Technics and Civilization/);
  assert.equal(disk['shelf.txt'], 'Technics and Civilization', 'and it is really on the disk');
});

test('writing the same name again replaces it rather than appending', async () => {
  const disk = { 'a.txt': 'old' };
  await run('val _ = writeFile "a.txt" "new"', { disk });
  assert.equal(disk['a.txt'], 'new');
});

test('a shelf survives across calls, which is the whole point', async () => {
  // The library exercise: two books added one at a time, both still there.
  // The newline is built with str (chr 10) rather than written as an escape,
  // so nothing depends on a backslash surviving two layers of quoting.
  const disk = {};
  const src = [
    'val nl = str (chr 10)',
    'fun shelve t = writeFile "shelf.txt" (readFile "shelf.txt" ^ t ^ nl)',
    'val _ = writeFile "shelf.txt" ""',
    'val _ = shelve "Giant Brains"',
    'val _ = shelve "The Myth of the Machine"',
    'val out = readFile "shelf.txt"',
  ].join('\n');
  const { last } = await run(src, { disk });
  const got = String(last.text);
  assert.match(got, /Giant Brains/);
  assert.match(got, /The Myth of the Machine/, 'the second book must not have replaced the first');
});

test('a machine with no disk cannot write either', async () => {
  const { last } = await run('val _ = writeFile "a.txt" "x"', { station: 'robot', disk: null });
  assert.ok(!last.ok, 'a unit in the field has nowhere to put anything');
});

// ---- TextIO, as the Definition has it --------------------------------------
//
// The primitives above are this project's own. TextIO is Standard ML's, and a
// program written from the Basis has to run here unchanged or the conformance
// claim is decoration. These exercise the interface rather than the plumbing:
// streams opened and closed, output accumulating, openOut truncating where
// openAppend does not.
//
// A stream here IS its filename. Standard ML hides that behind an abstract
// type, and hiding it is the only reason a program must close one; nothing is
// held open underneath, so closeIn and closeOut are honest no-ops. These tests
// therefore check what a Basis program OBSERVES, never how it is represented.

test('TextIO: openOut, output, closeOut, then read it back', async () => {
  const disk = {};
  const src = [
    'val g = TextIO.openOut "shelf.txt"',
    'val _ = TextIO.output (g, "Technics and Civilization")',
    'val _ = TextIO.closeOut g',
    'val f = TextIO.openIn "shelf.txt"',
    'val text = TextIO.inputAll f',
    'val _ = TextIO.closeIn f',
  ].join('\n');
  const { last } = await run(src, { disk });
  assert.match(String(last.text), /\(\)|unit/, 'closeIn returns unit');
  assert.equal(disk['shelf.txt'], 'Technics and Civilization');
});

test('TextIO: two outputs to one stream both arrive, in order', async () => {
  const disk = {};
  const src = [
    'val nl = str (chr 10)',
    'val g = TextIO.openOut "shelf.txt"',
    'val _ = TextIO.output (g, "Giant Brains" ^ nl)',
    'val _ = TextIO.output (g, "The Myth of the Machine" ^ nl)',
    'val _ = TextIO.closeOut g',
    'val text = TextIO.inputAll (TextIO.openIn "shelf.txt")',
  ].join('\n');
  const { last } = await run(src, { disk });
  const got = String(last.text);
  assert.match(got, /Giant Brains/);
  assert.match(got, /The Myth of the Machine/, 'the second output must not replace the first');
  assert.ok(got.indexOf('Giant Brains') < got.indexOf('The Myth'), 'and they keep their order');
});

test('TextIO: openOut truncates an existing file', async () => {
  const disk = { 'a.txt': 'what was there before' };
  const src = [
    'val g = TextIO.openOut "a.txt"',
    'val _ = TextIO.output (g, "after")',
    'val _ = TextIO.closeOut g',
  ].join('\n');
  await run(src, { disk });
  assert.equal(disk['a.txt'], 'after', 'openOut starts the file again');
});

test('TextIO: openAppend does not truncate', async () => {
  const disk = { 'a.txt': 'kept ' };
  const src = [
    'val g = TextIO.openAppend "a.txt"',
    'val _ = TextIO.output (g, "and added")',
    'val _ = TextIO.closeOut g',
  ].join('\n');
  await run(src, { disk });
  assert.equal(disk['a.txt'], 'kept and added',
    'this is the difference between openAppend and openOut, and the only one');
});

test('TextIO: openAppend creates the file when it is not there', async () => {
  // The Basis creates it. This build did not, and `output` reads before it
  // writes, so appending to a new file failed on the read. It was found by
  // running the library exercise out of BML's own README, which could not do
  // what it was printed doing: every textbook writes append WITHOUT an openOut
  // in front of it, because in Standard ML none is needed.
  //
  // `handle` is no help here: a missing file is a host error rather than an ML
  // exception, so it cannot be caught in the language. Hence `fileExists`.
  const disk = {};
  const src = [
    'val g = TextIO.openAppend "new.txt"',
    'val _ = TextIO.output (g, "first")',
    'val _ = TextIO.closeOut g',
  ].join('\n');
  await run(src, { disk });
  assert.equal(disk['new.txt'], 'first', 'the file should have been made, then written');
});

test('fileExists answers rather than failing', async () => {
  const { last } = await run('val a = fileExists "there.txt"\nval b = fileExists "not.txt"',
    { disk: { 'there.txt': 'x' } });
  assert.match(String(last.text), /false/, 'a missing file is an answer, not an error');
  const yes = await run('val a = fileExists "there.txt"', { disk: { 'there.txt': 'x' } });
  assert.match(String(yes.last.text), /true/);
});

test('TextIO: output1 writes a single character', async () => {
  const disk = {};
  const src = [
    'val g = TextIO.openOut "c.txt"',
    'val _ = TextIO.output1 (g, #"R")',
    'val _ = TextIO.output1 (g, #"O")',
    'val _ = TextIO.output1 (g, #"N")',
    'val _ = TextIO.closeOut g',
  ].join('\n');
  await run(src, { disk });
  assert.equal(disk['c.txt'], 'RON');
});

test('TextIO: inputAll on a file that is not there says which', async () => {
  const { last } = await run('val t = TextIO.inputAll (TextIO.openIn "gone.txt")',
    { disk: { 'a.txt': 'x' } });
  assert.ok(!last.ok);
  assert.match(String(last.text), /gone\.txt/);
});

test('the library exercise, written from the Basis alone', async () => {
  // No readFile, no writeFile: everything a first-year would have been taught.
  const disk = {};
  const src = [
    'val nl = str (chr 10)',
    'fun shelve title =',
    '  let val g = TextIO.openAppend "library.txt"',
    '  in TextIO.output (g, title ^ nl); TextIO.closeOut g end',
    'val g0 = TextIO.openOut "library.txt"',
    'val _ = TextIO.closeOut g0',
    'val _ = shelve "Giant Brains"',
    'val _ = shelve "Technics and Civilization"',
    'val _ = shelve "Ficciones"',
    'val shelf = TextIO.inputAll (TextIO.openIn "library.txt")',
  ].join('\n');
  const { last } = await run(src, { disk });
  const got = String(last.text);
  for (const title of ['Giant Brains', 'Technics and Civilization', 'Ficciones']) {
    assert.match(got, new RegExp(title), `${title} should still be on the shelf`);
  }
});
