// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The keyboard tracker must let a BROWSER chord (Ctrl/Cmd/Alt + key) through to
// the browser. C, V, X and A are all tracked game keys, so a chord over them was
// being preventDefaulted — which is why you could select a terminal screen and
// then fail to copy it. These tests drive the real Input class through a fake
// event target, so the rule is checked rather than clicked at.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Input } from '../src/engine/input.js';

function fakeTarget() {
  const handlers = {};
  return {
    addEventListener(type, fn) { (handlers[type] ||= []).push(fn); },
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; },
    fire(type, ev) { for (const fn of (handlers[type] || [])) fn(ev); },
  };
}

function kd(code, mods = {}) {
  const ev = { code, target: {}, repeat: false, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...mods };
  ev.prevented = false;
  ev.preventDefault = () => { ev.prevented = true; };
  return ev;
}

test('Cmd/Ctrl+C, +V, +X, +A reach the browser and register no game keypress', () => {
  for (const code of ['KeyC', 'KeyV', 'KeyX', 'KeyA']) {
    for (const mod of ['metaKey', 'ctrlKey', 'altKey']) {
      const t = fakeTarget();
      const input = new Input(t, t);
      const e = kd(code, { [mod]: true });
      t.fire('keydown', e);
      assert.equal(e.prevented, false, `${mod}+${code} must not be preventDefaulted`);
      assert.equal(input.isDown(code), false, `${code} must not be held from a chord`);
      assert.equal(input.consumePress(code), false, `${code} must not be pressed from a chord`);
    }
  }
});

test('an unmodified tracked key is still captured and its default prevented', () => {
  const t = fakeTarget();
  const input = new Input(t, t);
  const e = kd('KeyC');           // craft, on its own
  t.fire('keydown', e);
  assert.equal(e.prevented, true);
  assert.equal(input.consumePress('KeyC'), true);
});

test('movement still works: unmodified WASD drives moveIntent', () => {
  const t = fakeTarget();
  const input = new Input(t, t);
  t.fire('keydown', kd('KeyW'));
  t.fire('keydown', kd('KeyD'));
  assert.deepEqual(input.moveIntent(), { dx: 1, dy: -1 });
});

test('typing into an INPUT is never treated as a game key', () => {
  const t = fakeTarget();
  const input = new Input(t, t);
  const e = kd('KeyC', { target: { tagName: 'INPUT' } });
  t.fire('keydown', e);
  assert.equal(e.prevented, false);
  assert.equal(input.consumePress('KeyC'), false);
});

test('Shift stays the game\'s: Shift+N is the Library, a bare N the notepad', () => {
  const t = fakeTarget();
  const input = new Input(t, t);
  const shiftN = kd('KeyN', { shiftKey: true });
  t.fire('keydown', shiftN);
  assert.equal(shiftN.prevented, true, 'Shift is not a browser chord — still ours');
  assert.equal(input.libraryPressed(), true);
  assert.equal(input.notesPressed(), false);

  t.fire('keyup', { code: 'KeyN' });
  t.fire('keydown', kd('KeyN'));   // bare N
  assert.equal(input.notesPressed(), true);
  assert.equal(input.libraryPressed(), false);
});
