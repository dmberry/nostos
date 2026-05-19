// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// DOES IT START?
//
// v1.548 shipped a game that did not boot: `ReferenceError: Cannot access
// 'dayNight' before initialization`, thrown at the top of main.js, on the live
// site. **1448 tests passed against it.** So did `node --check`, so did the
// lint sweep. All three were telling the truth and none of them was answering
// the question:
//
//   - no test imported main.js — it touches the DOM and the audio context on
//     the way up, so importing it in node "obviously" could not work;
//   - `node --input-type=module --check` PARSES a file without resolving a
//     single name;
//   - the linter checks that names are declared, and `dayNight` was declared
//     perfectly well — sixty lines further down.
//
// David, 2026-08-15: "can we have a test that the game actually BOOTS before
// shipping any more versions".
//
// THE ASSUMPTION THAT MADE THE GAP was that main.js cannot run outside a
// browser. It can: everything it touches on the way up is reachable through a
// stub, and one Proxy answers the whole DOM surface. That is all this file is —
// a fake window, then `import`, and then the question of whether the game got
// to the end.
//
// AND THE SIGNAL IS CALYPSO'S FIRST MESSAGE (David's idea, and a better one
// than mine). "The import did not throw" is also true of a module that fell
// over halfway through a try block. The carrier's roaming welcome is the last
// thing main.js does on the way up and it can only happen if everything before
// it worked — the save read, the world built, the player placed, the phone
// wired. `islandWelcome` sets `__nostosBooted`, and that flag is the test.
//
// WHAT THIS STILL CANNOT SEE, said plainly so a pass is not mistaken for more
// than it is: anything that only happens once frames are running — a draw call
// against a real canvas, an input handler, a missing element that is only
// looked up on a click. Those need the game open in a browser, which is why
// docs/PLAN.md carries "open it and look" as the step before a release.

import { test } from 'node:test';
import assert from 'node:assert/strict';

/**
 * A stand-in for everything the browser gives a page.
 *
 * One Proxy, answering any property with itself and any call with itself, so a
 * chain like `document.getElementById('x').style.setProperty(...)` works to any
 * depth without anybody having to predict it. The handful of properties that
 * must be a NUMBER or a STRING are named, because arithmetic on a Proxy is
 * where this trick usually falls over.
 */
function domStub() {
  const stub = new Proxy(function () {}, {
    get(_t, k) {
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === 'then') return undefined;          // must not look like a promise
      if (k === 'length' || k === 'width' || k === 'height'
        || k === 'clientWidth' || k === 'clientHeight'
        || k === 'offsetWidth' || k === 'offsetHeight'
        || k === 'devicePixelRatio') return 100;
      if (k === 'value' || k === 'textContent' || k === 'innerHTML'
        || k === 'id' || k === 'className') return '';
      return stub;
    },
    set() { return true; },
    apply() { return stub; },
    construct() { return stub; },
    has() { return true; },
  });
  return stub;
}

/** Install the stub globals. Returns a function that puts the world back. */
function installBrowser() {
  const stub = domStub();
  const saved = new Map();
  const set = (k, v) => {
    saved.set(k, Object.getOwnPropertyDescriptor(globalThis, k));
    Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });
  };
  set('window', globalThis);
  set('document', stub);
  set('navigator', { userAgent: 'node', maxTouchPoints: 0, language: 'en' });
  set('localStorage', {
    getItem: () => null, setItem() {}, removeItem() {}, clear() {}, key: () => null, length: 0,
  });
  set('sessionStorage', globalThis.localStorage);
  set('AudioContext', function AudioContextStub() { return stub; });
  set('webkitAudioContext', globalThis.AudioContext);
  set('requestAnimationFrame', () => 0);
  set('cancelAnimationFrame', () => {});
  set('Image', function ImageStub() { return stub; });
  set('fetch', () => Promise.resolve(stub));
  set('matchMedia', () => ({ matches: false, addEventListener() {}, addListener() {} }));
  set('addEventListener', () => {});
  set('removeEventListener', () => {});
  set('HTMLCanvasElement', function HTMLCanvasElementStub() {});
  set('HTMLElement', function HTMLElementStub() {});
  set('__nostosBooted', undefined);
  return () => {
    for (const [k, d] of saved) {
      if (d) Object.defineProperty(globalThis, k, d);
      else delete globalThis[k];
    }
  };
}

test('the game boots, and Calypso greets you', async () => {
  const restore = installBrowser();
  try {
    // If main.js throws on the way up, this rejects and the test says so with
    // the real error — which is the whole point.
    await import('../src/main.js');
  } catch (err) {
    restore();
    assert.fail(`main.js threw on the way up — the game would not start:\n  ${err.constructor.name}: ${err.message}`);
  }
  const greeted = globalThis.__nostosBooted === true;
  restore();
  assert.equal(greeted, true,
    'main.js imported without throwing, but never reached the carrier\'s roaming welcome — '
    + 'so it fell over somewhere on the way up (probably inside a try that swallowed it).');
});

test('the check can fail: it is not a rubber stamp', async () => {
  // An instrument that cannot report a fault is the one that says `clean` for
  // months (see tools/sweep.mjs, and the comment at the top of imports.test.js).
  // So: a module with v1.548's exact shape, and this asserts it is caught.
  const fs = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nostos-boot-'));
  const file = path.join(dir, 'tdz.mjs');
  fs.writeFileSync(file, [
    'const player = { name: "Nobody" };',
    'dayNight.rate = 2;                 // the v1.548 line, in shape',
    'const dayNight = { rate: 1 };',
    'globalThis.__nostosBooted = true;',
  ].join('\n'));

  let threw = null;
  try { await import(`file://${file}`); } catch (e) { threw = e; }
  fs.rmSync(dir, { recursive: true, force: true });

  assert.ok(threw, 'a temporal-dead-zone read must throw on import');
  assert.match(threw.message, /before initialization/,
    'and it must be the ReferenceError the live site showed');
  assert.notEqual(globalThis.__nostosBooted, true, 'and the flag must not be set');
});
