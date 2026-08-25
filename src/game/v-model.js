// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #127 — the V-class model (docs/PLAN.md §1, V1a).
//
// A V-class unit's braincode is a small feed-forward network written as
// ordinary ML source. The player reads it with `get`, edits a number, and
// posts it back — the same path as every other program in the game. Nothing
// here is a new mechanic; it is arithmetic the language already runs.
//
// TWO CORRECTIONS TO THE PLAN, both found by probing decide() at V1a:
//
//   1. The plan assumed `Vector` (from the Basis work, #68) would be in reach.
//      It is not. Vector lives in full BML at the laptop; a robot station runs
//      the restricted dialect in ai_ml.js, whose verb list has hd/tl/length
//      and no structures at all. So the model carries its weights as LISTS.
//      The name still holds: V is for vector in the mathematical sense, and
//      the checkpoint files keep their `vector_` prefix.
//   2. A braincode program is ONE expression. Two top-level `fun` declarations
//      are refused, so every helper nests in `let ... in`. `let f = fn ...`
//      binds recursively, which is what makes the fold over the weight rows
//      possible.
//
// The architecture is 7 → 6 → 5: seven inputs (the sense pack, normalised,
// plus a trailing constant that serves as the bias, since the layer form has
// no bias term of its own), six relu hidden units, five LINEAR outputs read
// as an argmax over [patrol, tend, home, flee, wait]. The output layer is
// linear on purpose: relu there would flatten every negative score to zero
// and the argmax would always answer `patrol`.

// The input pack, in order. This list IS the documentation of the input
// vector, and the model source prints it as a comment so a player reading the
// weights can tell which column is which.
export const V_INPUTS = [
  ['charge', 'real charge / 100.0', 'cell state'],
  ['casualty', 'real casualty_range / 24.0', 'distance to the nearest flat machine, 1.0 = none in reach'],
  ['cargo', 'if cargo then 1.0 else 0.0', 'carrying a charged cell'],
  ['home', 'real home_range / 40.0', 'distance to its tower'],
  ['threat', 'if threat then 1.0 else 0.0', 'something warm nearby'],
  ['hurt', 'if hurt then 1.0 else 0.0', 'taking damage'],
  ['bias', '1.0', 'constant'],
];

export const V_OUTPUTS = ['patrol', 'tend', 'home', 'flee', 'wait'];

// Hidden layer: six feature detectors over the input pack. Hand-designed to
// look grown, which is the right amount of fraud for a 1995 ruin.
//                    charge  casualty  cargo   home  threat   hurt   bias
export const W_HIDDEN = [
  [   0.00,  -1.20,   0.00,   0.00,   0.00,   0.00,   1.20], // h0 a casualty is close
  [   0.00,   0.00,   1.00,   0.00,   0.00,   0.00,   0.00], // h1 carrying a cell
  [  -4.00,   0.00,   0.00,   0.00,   0.00,   0.00,   0.80], // h2 its own cell is low
  [   0.00,   0.00,   0.00,   0.00,   0.60,   1.00,  -0.20], // h3 in danger
  [   0.00,   0.00,   0.00,   1.00,   0.00,   0.00,  -0.30], // h4 far from its tower
  [   0.00,   0.00,   0.00,   0.00,   0.00,   0.00,   1.00], // h5 constant
];

// Output layer, linear: one row per intent.
//                       h0      h1      h2      h3      h4      h5
export const W_OUT = [
  [  -0.90,   0.00,  -0.50,  -0.80,   0.25,   0.55], // patrol
  [   1.30,   0.45,  -2.00,  -0.90,   0.00,   0.00], // tend
  [  -0.20,   0.00,   3.60,   0.00,   0.30,   0.00], // home
  [   0.00,   0.00,   0.00,   2.10,   0.00,   0.00], // flee
  [  -0.50,   0.00,   0.00,  -0.50,   0.00,   0.15], // wait
];

// A small deterministic hash, so a unit's jitter is stable across saves.
function seededNoise(seed, i) {
  let h = (seed | 0) ^ ((i + 1) * 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (((h ^ (h >>> 16)) >>> 0) / 0xffffffff) * 2 - 1;   // -1 .. 1
}

// D3: jitter is cosmetic. Every canonical regime keeps a margin wide enough
// that ±5% on every weight at once cannot reorder the top two, so two V1s
// read as different machines and behave the same. test/v-class.test.js
// sweeps a thousand seeds against that claim.
function jitter(w, seed, salt) {
  if (!seed) return w;
  let n = salt * 977;
  return w.map((row) => row.map((v) => {
    const d = seededNoise(seed, n++) * 0.05;
    return v === 0 ? 0 : v * (1 + d);
  }));
}

// SML writes a negative as ~0.82, and the model has to parse at a robot
// station, so the printer has to as well.
function ml(n) {
  const s = Math.abs(n).toFixed(2);
  return (n < 0 ? '~' : '') + s;
}

const row = (r) => `[${r.map(ml).join(', ')}]`;
const matrix = (m, indent) => m.map((r) => indent + row(r)).join(',\n');

/**
 * The model as braincode source.
 * @param {number} seed   per-unit seed for the cosmetic weight jitter
 * @param {string} name   the unit's build name, printed in the header
 */
export function makeVModel(seed = 0, name = 'V1_00') {
  const hidden = jitter(W_HIDDEN, seed, 1);
  const out = jitter(W_OUT, seed, 2);
  const build = 400 + ((seed | 0) % 97 + 97) % 97;
  return `(* model.ml — ${name}. grown at the foundry, build ${build}. do not edit. *)
(* nobody knows why the numbers work. they only know they do.          *)
(*                                                                     *)
(* in:  ${V_INPUTS.map((i) => i[0]).join(' ')}${' '.repeat(Math.max(1, 22 - V_INPUTS.map((i) => i[0]).join(' ').length))}*)
(* out: ${V_OUTPUTS.join(' ')}${' '.repeat(Math.max(1, 22 - V_OUTPUTS.join(' ').length))}*)

let relu = fn x => if x < 0.0 then 0.0 else x in
let dot = fn w => fn x =>
      if length w = 0 then 0.0
      else hd w * hd x + dot (tl w) (tl x) in
let layer = fn ws => fn x =>
      if length ws = 0 then []
      else relu (dot (hd ws) x) :: layer (tl ws) x in
let linear = fn ws => fn x =>
      if length ws = 0 then []
      else dot (hd ws) x :: linear (tl ws) x in
let argmax = fn l => fn i => fn bi => fn bv =>
      if length l = 0 then bi
      else if hd l > bv then argmax (tl l) (i + 1) i (hd l)
      else argmax (tl l) (i + 1) bi bv in

let x = [${V_INPUTS.map((i) => i[1]).join(',\n         ')}] in

let h = layer [
${matrix(hidden, '          ')}] x in

let o = linear [
${matrix(out, '           ')}] h in

let k = argmax (tl o) 1 0 (hd o) in
if k = 0 then patrol
else if k = 1 then tend
else if k = 2 then home
else if k = 3 then flee
else wait
`;
}

/**
 * The same forward pass in JS. The tests use it to check that the ML source
 * and the reference agree, and the balance pass uses it to sweep the policy
 * without booting an interpreter.
 */
export function vForward(sense, seed = 0) {
  const num = (v) => (typeof v === 'boolean' ? (v ? 1 : 0) : Number(v) || 0);
  const x = [
    num(sense.charge) / 100,
    num(sense.casualty_range) / 24,
    sense.cargo ? 1 : 0,
    num(sense.home_range) / 40,
    sense.threat ? 1 : 0,
    sense.hurt ? 1 : 0,
    1,
  ];
  const hidden = jitter(W_HIDDEN, seed, 1);
  const out = jitter(W_OUT, seed, 2);
  const dot = (w, v) => w.reduce((s, wi, i) => s + wi * (v[i] || 0), 0);
  const h = hidden.map((w) => Math.max(0, dot(w, x)));
  const o = out.map((w) => dot(w, h));
  let bi = 0;
  for (let i = 1; i < o.length; i++) if (o[i] > o[bi]) bi = i;
  return { intent: V_OUTPUTS[bi], scores: o, hidden: h };
}

// ---- checkpoints as loot (docs/PLAN.md §3) ---------------------------
//
// Pretrained weight files found in the world and posted like any program: the
// fine-tune economy without the training. The `vector_` prefix in lower-case
// snake_case is the one naming that works everywhere — a kebab name parses as
// subtraction at the ML console, a camelCase one can be missed by the console's
// case folding, and the disk's own convention is already factory_id.ml.
//
// Each is the same architecture with different numbers, which is the joke: you
// cannot tell them apart by reading, only by posting one and watching.

// Reweight the stock model: `edits` maps "layer.row.col" to a new value.
function variant(edits, header) {
  const hid = W_HIDDEN.map((r) => r.slice());
  const out = W_OUT.map((r) => r.slice());
  for (const [k, v] of Object.entries(edits)) {
    const [layer, i, j] = k.split('.');
    (layer === 'h' ? hid : out)[+i][+j] = v;
  }
  const src = makeVModel(0, 'CHECKPOINT');
  return src
    .replace(/^\(\* model\.ml[^\n]*\n\(\*[^\n]*\n/, header)
    .replace(matrix(W_HIDDEN, '          '), matrix(hid, '          '))
    .replace(matrix(W_OUT, '           '), matrix(out, '           '));
}

export const CHECKPOINTS = [
  {
    name: 'vector_courier.ml',
    blurb: 'the stock weights, as they left the foundry',
    body: variant({}, '(* vector_courier.ml — the foundry weights, as issued.               *)\n(* keep a copy. a courier you have broken is a copy away from fixed. *)\n'),
  },
  {
    name: 'vector_scared.ml',
    blurb: 'flees anything warm. the safe first probe',
    // Danger swamps everything, and a machine lying down is warm too, so it
    // will not go near the fallen either. It is safe to test on and useless.
    body: variant({ 'o.3.3': 9.00, 'o.3.0': 2.00, 'o.1.0': 0.20 },
      '(* vector_scared.ml — checkpoint. flees anything warm.               *)\n(* "we never worked out what happened to this one."                  *)\n'),
  },
  {
    name: 'vector_partisan.ml',
    blurb: 'the turned courier: casualties over everything',
    // The casualty detector runs hot and tend outranks going home.
    body: variant({ 'o.1.0': 3.20, 'o.1.2': -0.20, 'h.0.6': 2.20 },
      '(* vector_partisan.ml — checkpoint. found on a dead courier.         *)\n(* it will carry cells to anything lying down. anything.             *)\n'),
  },
  {
    name: 'vector_helpful_harmless.ml',
    blurb: 'HERMES relay. "helpful to whom was never resolved"',
    // Never patrols, never rests: it is always doing something for someone.
    body: variant({ 'o.0.5': 0.05, 'o.4.5': 0.02, 'o.1.0': 2.40, 'o.1.5': 0.60 },
      '(* vector_helpful_harmless.ml — checkpoint.                          *)\n(* helpful to whom was never resolved.                               *)\n'),
  },
];
