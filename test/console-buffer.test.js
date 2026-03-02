// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newConsole, print, clearScreen, setPrompt,
  typeChar, backspace, del, moveCursor, setInput,
  submit, recall, scrollBy, wrap, wrapAll, view, caretCol,
} from '../src/game/console-buffer.js';

test('a fresh console has an empty screen and empty input', () => {
  const cx = newConsole();
  assert.deepEqual(cx.lines, []);
  assert.equal(cx.input, '');
  assert.equal(cx.cursor, 0);
  assert.equal(cx.prompt, '>');
  assert.equal(cx.cols, 64);
});

test('print appends lines and splits on newline', () => {
  const cx = newConsole();
  print(cx, 'a', 'b\nc');
  assert.deepEqual(cx.lines, ['a', 'b', 'c']);
  clearScreen(cx);
  assert.deepEqual(cx.lines, []);
});

test('scrollback is capped at max, oldest dropped', () => {
  const cx = newConsole({ max: 32 });
  for (let i = 0; i < 50; i++) print(cx, `line ${i}`);
  assert.equal(cx.lines.length, 32);
  assert.equal(cx.lines[0], 'line 18');
  assert.equal(cx.lines[31], 'line 49');
});

test('typing inserts at the caret and the caret tracks it', () => {
  const cx = newConsole();
  for (const ch of 'helo') typeChar(cx, ch);
  assert.equal(cx.input, 'helo');
  assert.equal(cx.cursor, 4);
  moveCursor(cx, 'left');            // between l and o
  typeChar(cx, 'l');                 // hel[l]o
  assert.equal(cx.input, 'hello');
  assert.equal(cx.cursor, 4);
});

test('backspace, delete, and caret moves', () => {
  const cx = newConsole();
  setInput(cx, 'abcd');
  assert.equal(cx.cursor, 4);
  backspace(cx);
  assert.equal(cx.input, 'abc');
  moveCursor(cx, 'home');
  del(cx);
  assert.equal(cx.input, 'bc');
  moveCursor(cx, 'end');
  assert.equal(cx.cursor, 2);
  // edges do nothing
  moveCursor(cx, 'home'); backspace(cx);
  assert.equal(cx.input, 'bc');
  moveCursor(cx, 'end'); del(cx);
  assert.equal(cx.input, 'bc');
});

test('submit echoes the line with the prompt, clears input, records history', () => {
  const cx = newConsole();
  setInput(cx, 'ls');
  const line = submit(cx);
  assert.equal(line, 'ls');
  assert.deepEqual(cx.lines, ['> ls']);
  assert.equal(cx.input, '');
  assert.equal(cx.cursor, 0);
  assert.deepEqual(cx.history, ['ls']);
  // an empty line echoes the bare prompt but is not recorded
  submit(cx);
  assert.deepEqual(cx.lines, ['> ls', '> ']);
  assert.deepEqual(cx.history, ['ls']);
  // consecutive duplicates collapse; the blank between did not reset that
  setInput(cx, 'ls'); submit(cx);
  setInput(cx, 'ls'); submit(cx);
  assert.deepEqual(cx.history, ['ls']);
  setInput(cx, 'cd'); submit(cx);
  assert.deepEqual(cx.history, ['ls', 'cd']);
});

test('history recall walks up and down and restores the stashed line', () => {
  const cx = newConsole();
  for (const c of ['one', 'two', 'three']) { setInput(cx, c); submit(cx); }
  setInput(cx, 'draf');                // an in-progress line
  recall(cx, 'up');
  assert.equal(cx.input, 'three');
  recall(cx, 'up');
  assert.equal(cx.input, 'two');
  recall(cx, 'up');
  assert.equal(cx.input, 'one');
  recall(cx, 'up');                    // clamps at oldest
  assert.equal(cx.input, 'one');
  recall(cx, 'down');
  assert.equal(cx.input, 'two');
  recall(cx, 'down'); recall(cx, 'down');
  assert.equal(cx.input, 'draf');      // back to the stashed line
  assert.equal(cx.histIdx, -1);
  recall(cx, 'down');                  // nothing below the fresh line
  assert.equal(cx.input, 'draf');
});

test('typing after a recall drops out of history', () => {
  const cx = newConsole();
  setInput(cx, 'aaa'); submit(cx);
  recall(cx, 'up');
  assert.equal(cx.histIdx >= 0, true);
  typeChar(cx, 'x');
  assert.equal(cx.histIdx, -1);
});

test('wrap breaks a long line into column-width rows, never fewer than one', () => {
  assert.deepEqual(wrap('', 4), ['']);
  assert.deepEqual(wrap('abcd', 4), ['abcd']);
  assert.deepEqual(wrap('abcdef', 4), ['abcd', 'ef']);
  assert.deepEqual(wrapAll(['ab', 'cdef'], 3), ['ab', 'cde', 'f']);
});

test('view returns the last N rows with the input line at the foot', () => {
  const cx = newConsole({ cols: 8 });
  print(cx, 'one', 'two', 'three');
  setInput(cx, 'go');
  const rows = view(cx, 3);
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map((r) => r.text), ['two', 'three', '> go']);
  assert.equal(rows[2].input, true);
  assert.equal(rows[0].input, false);
});

test('scrolling up shows older lines and pins back to the bottom on new output', () => {
  const cx = newConsole({ cols: 40 });
  for (let i = 0; i < 10; i++) print(cx, `L${i}`);
  scrollBy(cx, 5, 4);
  assert.ok(cx.scroll > 0);
  const top = view(cx, 4)[0].text;
  assert.notEqual(top, '> ');          // input not at the foot while scrolled
  print(cx, 'new');                     // new output pins to bottom
  assert.equal(cx.scroll, 0);
  assert.equal(view(cx, 2)[1].input, true);
});

test('caretCol accounts for the prompt and a space', () => {
  const cx = newConsole({ prompt: 'ml' });
  setInput(cx, 'abc');
  moveCursor(cx, 'home');
  assert.equal(caretCol(cx), 3);       // 'ml' + space + 0
  moveCursor(cx, 'end');
  assert.equal(caretCol(cx), 6);       // + 3
  setPrompt(cx, '>');
  assert.equal(caretCol(cx), 5);       // '>' + space + 3
});
