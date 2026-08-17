// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE SEALED MESSAGES STILL OPEN.
//
// Three texts sit in `www/index.html` under three ciphers, and a fourth rides
// in `seals.js` for the terminal. They are the one kind of content in this
// repository that CANNOT be checked by reading it: a seal that has been damaged
// looks exactly like a seal that has not, and the damage only shows when
// somebody tries to open it, which by then is a player rather than a test.
//
// It has already happened once. The Vigenere ciphertext carries the transcript's
// own line breaks, because anything that is not a letter passes through the
// cipher untouched, and the first attempt wrapped it at a fixed width on top of
// those. Twenty-three characters of structure went, the file looked perfectly
// well-formed, and the text was unrecoverable.
//
// The plaintexts are deliberately NOT here. Each is checked against a SHA-256 of
// what it should be, so this file proves the seals open without publishing what
// is behind them.
//
// AND THE PAGE NO LONGER SAYS HOW ANY OF THEM CLOSE. The first version labelled
// each block with its cipher, printed the RC4 key beside its own ciphertext and
// gave the RSA modulus outright, which left nothing to solve. So the blocks are
// found here by their BEGIN/END armour, and every key and parameter comes from the GAME
// — the same places a player has to go. If a seal is ever separated from the
// thing that opens it, this fails, which is the point.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { NOTE_SEALED, NOTE_OPENER, SESSION_OPENER, LETTER_KEY, WARNING_N, WARNING_E }
  from '../src/game/seals.js';

const HTML = readFileSync(new URL('../www/index.html', import.meta.url), 'utf8');
const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

const WANT = {
  letter: 'fe3ecbb853e66cee619a8e33e5e1aab4fc39c8fe2b811a9d99af8fef61fdde9b',
  warning: 'fae82e55806bd7a31ce46721c67d1a8e61f249315b51e353a7c49f1a15c2394b',
  session: '3e5b3e8c9850407dad060ed50618d446478d0b1c66d5a72fc8b2961098c6c3d9',
  note: 'a6a97e236eba9848ff23baf38f46e23d26c2173c5af0a5c54edd97e40c5388e2',
};

const bytes = (hex) => Uint8Array.from(hex.match(/../g).map((b) => parseInt(b, 16)));
const text = (arr) => new TextDecoder().decode(Uint8Array.from(arr));

function rc4(key, data) {
  const S = [...Array(256).keys()];
  for (let i = 0, j = 0; i < 256; i++) {
    j = (j + S[i] + key[i % key.length]) & 0xFF;
    [S[i], S[j]] = [S[j], S[i]];
  }
  const out = [];
  for (let n = 0, i = 0, j = 0; n < data.length; n++) {
    i = (i + 1) & 0xFF; j = (j + S[i]) & 0xFF;
    [S[i], S[j]] = [S[j], S[i]];
    out.push(data[n] ^ S[(S[i] + S[j]) & 0xFF]);
  }
  return out;
}

function vigenere(s, key) {
  let k = 0;
  return [...s].map((c) => {
    if (!/[a-z]/i.test(c)) return c;
    const base = c === c.toUpperCase() ? 65 : 97;
    const shift = key.charCodeAt(k++ % key.length) - 65;
    return String.fromCharCode(((c.charCodeAt(0) - base - shift + 26 * 2) % 26) + base);
  }).join('');
}

test('seal 1 (rc4) still opens to the letter', () => {
  const m = HTML.match(/-----BEGIN FILE1-----\n([\s\S]*?)\n  -----END/);
  assert.ok(m, 'the first sealed block is not in www/index.html');
  const key = bytes(LETTER_KEY);          // from the game, not from the page
  const ct = bytes(m[1].replace(/\s+/g, ''));
  assert.equal(sha(text(rc4([...key], ct))), WANT.letter);
});

test('seal 2 (rsa) still opens to the warning', () => {
  const m = HTML.match(/-----BEGIN FILE2-----\n([\s\S]*?)\n  -----END/);
  assert.ok(m, 'the second sealed block is not in www/index.html');
  const n = BigInt(WARNING_N), e = BigInt(WARNING_E);   // from the game
  const blocks = m[1].trim().split(/\s+/).map(BigInt);
  // Factored rather than given a key, which is the route the page intends.
  let p = 3n;
  while (p * p <= n && n % p !== 0n) p += 2n;
  const q = n / p;
  const phi = (p - 1n) * (q - 1n);
  // Modular inverse of e, by the extended Euclidean algorithm.
  let [old_r, r, old_s, s] = [e, phi, 1n, 0n];
  while (r !== 0n) {
    const quot = old_r / r;
    [old_r, r] = [r, old_r - quot * r];
    [old_s, s] = [s, old_s - quot * s];
  }
  const d = ((old_s % phi) + phi) % phi;
  const pow = (b, ex, mod) => {
    let acc = 1n; b %= mod;
    while (ex > 0n) { if (ex & 1n) acc = acc * b % mod; b = b * b % mod; ex >>= 1n; }
    return acc;
  };
  assert.equal(sha(text(blocks.map((c) => Number(pow(c, d, n))))), WANT.warning);
});

test('seal 3 (vigenere) still opens to the session', () => {
  const m = HTML.match(/-----BEGIN FILE3-----\n([\s\S]*?)\n  -----END/);
  assert.ok(m, 'the third sealed block is not in www/index.html');
  // Two leading spaces of comment indent, and NOT a trim: the transcript's own
  // line breaks are inside the ciphertext and must survive being read back.
  const ct = m[1].split('\n').map((l) => l.slice(2)).join('\n');
  // Read out of the program that opens it in the game, rather than restated
  // here. If somebody changes the opener's key, this stops passing instead of
  // quietly testing a cipher nothing in the game can undo.
  const key = SESSION_OPENER.match(/val key = "([A-Z]+)"/)[1];
  assert.equal(sha(vigenere(ct, key)), WANT.session);
});

test('seal 4 (xor) still opens to the note', () => {
  // Likewise: the key comes off the ML opener that ships with the file.
  const key = NOTE_OPENER.match(/val key = \[([\d, ]+)\]/)[1].split(',').map(Number);
  const ct = bytes(NOTE_SEALED);
  assert.equal(sha(text([...ct].map((b, i) => b ^ key[i % key.length]))), WANT.note);
});
