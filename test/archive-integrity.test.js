// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE CACHE HOLDS ITS SHAPE.
//
// Some pages in the cache are quoted by things outside themselves, and a hit
// counter that reads as decoration on one of them is not decoration. Editing
// such a page does not break a render and does not break a link, so nothing
// else in this suite would notice; it breaks something that only shows up when
// a player is a long way in and cannot get back out again.
//
// So this walks the whole path end to end, from the pages to the thing the
// pages are for, and asserts it arrives. If it fails, the last edit to a
// cached page changed a number that something depends on. Put the number back.
//
// The path is packed rather than written out, for the same reason the relay
// packs what it carries: a file that names every step of a puzzle in plain
// text is a file that answers it.

import { test } from 'node:test';
import assert from 'node:assert';
import { ARCHIVED_SITES } from '../src/game/archive.js';
import { FOURTH_SEALED } from '../src/game/seals.js';
import { openSigned, fromBase64, sha256 } from '../src/game/digest.js';
import { LEDGER_ML } from '../src/game/relay-store.js';
import { runRonml, joinProgram, loadPrelude } from '../src/game/ai_ml.js';

const KEY = 'HERMES-RELAY-STORE';
const unpack = (b64) => {
  const bin = Buffer.from(b64.replace(/[^A-Za-z0-9+/=]/g, ''), 'base64').toString('binary');
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length);
  return new TextDecoder().decode(out);
};

const P =
  'KiknKGg9QiYgYTM8TjwmKyFrLyA9LiwnRDc2YjYqJz41KDwwJWgiJSonQiFrKyQ2TjogJjc2ZjIhRyM/TCcnKTMtAzQxIDEsPCw3PmskXlgxJCR0Qj0xYiYsJSB/PSQ3AzUgIyIwWToxPHwyO08mJSB+XTc3JS49RDB5OzMnJCB8KiA8TjsxJSQqAyQnRSYtLWgxPzwgWTMpYTE4QTI3KnwiLSoxJDE6SCFrOzI=';

// The numbers are read off the pages and handed to the program RON serves,
// running on the interpreter the player runs it on. Nothing about how it
// works is restated here: this file knows which pages to look at and nothing
// else, so it can guard the path without also publishing it.
async function walk(vals) {
  const out = [];
  const ctx = { station: 'laptop', session: {}, print: (t) => out.push(t) };
  await loadPrelude(ctx);
  for (const l of joinProgram(LEDGER_ML)) {
    const line = String(l.text !== undefined ? l.text : l);
    const r = runRonml(line, ctx);
    assert.ok(r.ok, `the ledger no longer runs: ${r.text}`);
  }
  const call = `ledger [${vals.join(', ')}]`;
  const r = runRonml(call, ctx);
  assert.ok(r.ok, `the ledger refused the counters: ${r.text}`);
  return String(r.text).trim();
}

function counters() {
  const vals = unpack(P).split('\n').map((dom) => {
    const site = ARCHIVED_SITES.find((s) => s.domain === dom);
    assert.ok(site, `a page the path runs through is gone: ${dom}`);
    const hit = site.body.join('\n').match(/visitors: (\d+)/);
    assert.ok(hit, `a page the path runs through lost its counter: ${dom}`);
    return Number(hit[1]);
  });
  assert.equal(vals.length, 6);
  return vals;
}

test('the cache still holds the numbers the courier wrote down', async () => {
  const phrase = await walk(counters());
  assert.equal(phrase.split(' ').length, 6, 'the ledger stopped answering with six words');

  const text = openSigned(phrase, fromBase64(FOURTH_SEALED));
  assert.ok(text, 'the path no longer arrives: a counter, the ledger, or the '
    + 'sealed block has been edited. Put back whatever changed, or reseal.');
  // Pinned as a digest, not as a quotation. This file already knows which
  // pages to look at; it does not also need to carry the thing they lead to.
  const seen = Buffer.from(sha256(new TextEncoder().encode(text))).toString('hex');
  assert.equal(seen, '01eacc37b69102ae8fc71e6da7a23e9c894a544801a5cc46576d3a398028abe6',
    'the block opened, but not onto what it used to open onto');
});

test('a counter one digit out opens nothing at all', async () => {
  const vals = counters();
  const bent = [...vals];
  bent[3] += 1;
  const phrase = await walk(bent);
  assert.equal(openSigned(phrase, fromBase64(FOURTH_SEALED)), null);
  assert.equal(openSigned('', fromBase64(FOURTH_SEALED)), null);
});
