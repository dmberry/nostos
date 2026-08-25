// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// CONTENT CREDENTIALS.
//
// The estate signed everything it pressed, so the machines can tell their own
// output from a person's. This is the arithmetic that check runs on: a digest,
// a keyed digest, a stretch, and a block cipher in counter mode. All of it is
// the published construction, none of it is ours, and it is here in full rather
// than called out to a library because a box that has to phone somebody to find
// out whether a file is genuine is not a box you can trust on an island.
//
// Verified against the reference vectors: SHA-256 over every message length to
// 400 bytes, PBKDF2-HMAC-SHA256, and AES-256-CTR against SP 800-38A F.5.5.
//
// Pure and synchronous. No world, no DOM, no clock.

const K = [];
const H0 = [];
(function init() {
  let n = 2, i = 0, j = 0;
  const isP = (x) => { for (let d = 2; d * d <= x; d++) if (x % d === 0) return false; return true; };
  for (n = 2; i < 64; n++) {
    if (!isP(n)) continue;
    const c = Math.pow(n, 1 / 3) % 1;
    K[i] = Math.floor(c * 4294967296) >>> 0;
    if (j < 8) { H0[j] = Math.floor((Math.sqrt(n) % 1) * 4294967296) >>> 0; j++; }
    i++;
  }
})();

const rr = (x, n) => ((x >>> n) | (x << (32 - n))) >>> 0;

export function sha256(bytes) {
  const l = bytes.length;
  const withPad = new Uint8Array(Math.ceil((l + 9) / 64) * 64);
  withPad.set(bytes);
  withPad[l] = 0x80;
  const bits = l * 8;
  const dv = new DataView(withPad.buffer);
  dv.setUint32(withPad.length - 4, bits >>> 0, false);
  dv.setUint32(withPad.length - 8, Math.floor(bits / 4294967296), false);
  const H = H0.slice();
  const w = new Uint32Array(64);
  for (let off = 0; off < withPad.length; off += 64) {
    for (let t = 0; t < 16; t++) w[t] = dv.getUint32(off + t * 4, false);
    for (let t = 16; t < 64; t++) {
      const s0 = (rr(w[t - 15], 7) ^ rr(w[t - 15], 18) ^ (w[t - 15] >>> 3)) >>> 0;
      const s1 = (rr(w[t - 2], 17) ^ rr(w[t - 2], 19) ^ (w[t - 2] >>> 10)) >>> 0;
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      const S1 = (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const t1 = (h + S1 + ch + K[t] + w[t]) >>> 0;
      const S0 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) >>> 0;
      const mj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const t2 = (S0 + mj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    const v = [a, b, c, d, e, f, g, h];
    for (let t = 0; t < 8; t++) H[t] = (H[t] + v[t]) >>> 0;
  }
  const out = new Uint8Array(32);
  const ov = new DataView(out.buffer);
  for (let t = 0; t < 8; t++) ov.setUint32(t * 4, H[t], false);
  return out;
}

export function hmac(key, msg) {
  let k = key.length > 64 ? sha256(key) : key;
  const pad = new Uint8Array(64); pad.set(k);
  const ip = new Uint8Array(64), op = new Uint8Array(64);
  for (let i = 0; i < 64; i++) { ip[i] = pad[i] ^ 0x36; op[i] = pad[i] ^ 0x5c; }
  const a = new Uint8Array(64 + msg.length); a.set(ip); a.set(msg, 64);
  const inner = sha256(a);
  const b = new Uint8Array(96); b.set(op); b.set(inner, 64);
  return sha256(b);
}

export function pbkdf2(pass, salt, iters, dkLen) {
  const out = new Uint8Array(dkLen);
  let done = 0, block = 1;
  while (done < dkLen) {
    const si = new Uint8Array(salt.length + 4);
    si.set(salt);
    new DataView(si.buffer).setUint32(salt.length, block, false);
    let u = hmac(pass, si);
    const acc = u.slice();
    for (let i = 1; i < iters; i++) {
      u = hmac(pass, u);
      for (let j = 0; j < 32; j++) acc[j] ^= u[j];
    }
    const take = Math.min(32, dkLen - done);
    out.set(acc.subarray(0, take), done);
    done += take; block++;
  }
  return out;
}

// AES-256, forward direction only: CTR never needs the inverse cipher.
const SB = new Uint8Array(256);
const XT = new Uint8Array(256);
(function aesInit() {
  const p = new Uint8Array(256), l = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) { p[i] = x; l[x] = i; x ^= (x << 1) ^ ((x & 0x80) ? 0x11b : 0); x &= 0xff; }
  p[255] = p[0];
  const inv = (a) => (a === 0 ? 0 : p[255 - l[a]]);
  for (let i = 0; i < 256; i++) {
    let s = inv(i), y = s;
    for (let k = 0; k < 4; k++) { y = ((y << 1) | (y >>> 7)) & 0xff; s ^= y; }
    SB[i] = s ^ 0x63;
    XT[i] = ((i << 1) ^ ((i & 0x80) ? 0x1b : 0)) & 0xff;
  }
})();

function expandKey(key) {
  const Nk = 8, Nr = 14, w = new Uint8Array(16 * (Nr + 1));
  w.set(key);
  let rcon = 1;
  for (let i = Nk; i < 4 * (Nr + 1); i++) {
    const o = (i - 1) * 4;
    let t = [w[o], w[o + 1], w[o + 2], w[o + 3]];
    if (i % Nk === 0) {
      t = [SB[t[1]] ^ rcon, SB[t[2]], SB[t[3]], SB[t[0]]];
      rcon = XT[rcon];
    } else if (i % Nk === 4) {
      t = [SB[t[0]], SB[t[1]], SB[t[2]], SB[t[3]]];
    }
    const q = (i - Nk) * 4, d = i * 4;
    for (let j = 0; j < 4; j++) w[d + j] = w[q + j] ^ t[j];
  }
  return w;
}

function encryptBlock(w, inp, out) {
  const s = new Uint8Array(16);
  for (let i = 0; i < 16; i++) s[i] = inp[i] ^ w[i];
  for (let r = 1; r <= 14; r++) {
    const t = new Uint8Array(16);
    for (let c = 0; c < 4; c++) for (let j = 0; j < 4; j++) t[c * 4 + j] = SB[s[((c + j) % 4) * 4 + j]];
    if (r < 14) {
      for (let c = 0; c < 4; c++) {
        const o = c * 4, a = t[o], b = t[o + 1], cc = t[o + 2], d = t[o + 3];
        const all = a ^ b ^ cc ^ d;
        s[o]     = a  ^ all ^ XT[a ^ b];
        s[o + 1] = b  ^ all ^ XT[b ^ cc];
        s[o + 2] = cc ^ all ^ XT[cc ^ d];
        s[o + 3] = d  ^ all ^ XT[d ^ a];
      }
    } else s.set(t);
    for (let i = 0; i < 16; i++) s[i] ^= w[r * 16 + i];
  }
  out.set(s);
}

export function aesCtr(key, iv, data) {
  const w = expandKey(key);
  const ctr = new Uint8Array(iv), ks = new Uint8Array(16);
  const out = new Uint8Array(data.length);
  for (let off = 0; off < data.length; off += 16) {
    encryptBlock(w, ctr, ks);
    const n = Math.min(16, data.length - off);
    for (let i = 0; i < n; i++) out[off + i] = data[off + i] ^ ks[i];
    for (let i = 15; i >= 0; i--) { ctr[i] = (ctr[i] + 1) & 0xff; if (ctr[i]) break; }
  }
  return out;
}

// Reading a signed block back. The stretch is deliberate and it is the whole
// of the cost: a wrong phrase costs the same second a right one does, and the
// keyed digest is checked before a single byte is turned back, so a near miss
// returns nothing at all rather than nearly the text.
const ITERS = 200000;
const B = (s) => new TextEncoder().encode(s);

export function openSigned(phrase, blob) {
  if (!blob || blob.length < 33) return null;
  const iv = blob.subarray(0, 16);
  const tag = blob.subarray(16, 32);
  const ct = blob.subarray(32);
  const dk = pbkdf2(B(String(phrase)), iv, ITERS, 32);
  const kEnc = hmac(dk, B('enc'));
  const kMac = hmac(dk, B('mac'));
  const m = new Uint8Array(iv.length + ct.length);
  m.set(iv); m.set(ct, iv.length);
  const want = hmac(kMac, m).subarray(0, 16);
  let diff = 0;
  for (let i = 0; i < 16; i++) diff |= want[i] ^ tag[i];
  if (diff !== 0) return null;
  return new TextDecoder().decode(aesCtr(kEnc, iv, ct));
}

export function fromBase64(s) {
  const clean = String(s || '').replace(/[^A-Za-z0-9+/=]/g, '');
  if (typeof atob === 'function') {
    const bin = atob(clean);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(clean, 'base64'));
}

// A short fingerprint, the form the credential line prints.
export function fingerprint(s) {
  const h = sha256(B(String(s)));
  let out = '';
  for (let i = 0; i < 4; i++) out += h[i].toString(16).padStart(2, '0');
  return out;
}
