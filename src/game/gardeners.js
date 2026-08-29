// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// WHERE THE GARDENERS COME FROM.
//
// The estate never ordered a V-5. The works build order takes a chassis and a
// program reference and does not check that the two belong together, and a
// courier chassis with a tending program on it comes off the line as something
// the manifest has no word for. CALYPSO found the gap.
//
// She puts malformed orders in at two tempos. There is a slow one that runs
// whatever the towers are doing, because the island wants keeping whether or not
// anything is currently killing it, and there is a fast one while POSEIDON's
// link is up and the front is out, because that is when the ground is actually
// going. Cut the link and she drops back to the slow tempo rather than stopping:
// the scar is still there and somebody has to work it back.
//
// She cannot order the towers off and she cannot ask anyone for anything. This
// is the only move available to her. She does not lie about it either; nobody
// has asked her.
//
// The clock runs whatever else is true — she is waiting, not idle — but an order
// only goes in when the works can answer it. So a factory that comes back, or a
// gardener that dies and frees a slot, is answered at once rather than after
// another full wait.
//
// Pure. No world, no DOM, no clock of its own: the hub hands it dt and the facts.

export const GARDENER_BLIGHT_TRIGGER = 3.5;  // tiles of front that counts as urgent
export const GARDENER_URGENT_EVERY = 95;     // seconds between orders while ground is going
export const GARDENER_CARE_EVERY = 330;      // seconds between orders the rest of the time
export const GARDENER_CAP = 3;               // live gardeners she will sustain at once

export function makeGardenerState() {
  return { clock: GARDENER_URGENT_EVERY * 0.5, alt: false };
}

// Is the ground going fast enough to be worth the quick tempo?
export function gardenerUrgent(blightRunning, front) {
  return !!blightRunning && (front || 0) >= GARDENER_BLIGHT_TRIGGER;
}

// Advance the wait and answer with the chassis to build, or null.
//
// `world` carries what the hub knows: whether the works still stands, whether
// the fortress alarm is up (the line is busy throwing W4s), how many gardeners
// are already standing, whether the run is over, and how far the worst front has
// reached. Mutates `state`.
export function gardenerOrder(state, dt, world) {
  state.clock += dt;
  const { worksLive, alarm, live, ended, blightRunning, front } = world;
  const every = gardenerUrgent(blightRunning, front) ? GARDENER_URGENT_EVERY : GARDENER_CARE_EVERY;
  if (state.clock < every) return null;
  if (!worksLive || ended || alarm) return null;
  if ((live || 0) >= GARDENER_CAP) return null;
  state.clock = 0;
  // She alternates the two chassis the fault will accept. A W-5 comes off the
  // line carrying five lines of ML anybody can read; a V-5 comes off carrying
  // weights. Same malformed order, same works, and the difference is the whole
  // argument the island is having with itself.
  state.alt = !state.alt;
  return state.alt ? 'w5' : 'v5';
}

// A unit off the line carries the foundry's header. One off a malformed order
// carries hers, because she wrote the order, and she puts her name on what she
// writes. A player who reads a gardener's program finds the only place on the
// island where a tower AI says plainly what it thinks it is doing.
//
// The stamp replaces the header comment and leaves the code alone: the W-5's
// five lines still run, the V-5's weights are untouched, and refunctioning a
// gardener works exactly as it did. The input/output legend survives, because
// her stamp points at it and it is the only map of the rows a reader gets.
const W5_HEAD = [
  '(* W-5. Not a works build. I put the order in myself.  *)',
  '(* A fitter\'s chassis and a gardener\'s program, and    *)',
  '(* the line did not check that the two belong together. *)',
  '(*                                                      *)',
  '(* It tends ground my own towers took. That is the only *)',
  '(* part of this I am in a position to arrange.          *)',
  '(* Read it, change it. Five lines, and they are yours.  *)',
  '(*                                          — CALYPSO   *)',
];

const V5_HEAD = [
  '(* model.ml — not a foundry press. My order.            *)',
  '(* Six detectors, five intents. The rows are named.     *)',
  '(*                                                      *)',
  '(* I weighted it to go to what is dying and stay there. *)',
  '(* I was given the towers and the grass and no clause   *)',
  '(* saying which of the two I am for. I have decided.    *)',
  '(*                                          — CALYPSO   *)',
];

export function calypsoStamp(program, kind) {
  if (!program) return program;
  const body = String(program).split('\n');
  while (body.length && /^\s*\(\*/.test(body[0]) && !/\b(in|out):/.test(body[0])) body.shift();
  return (kind === 'w5' ? W5_HEAD : V5_HEAD).concat(body).join('\n');
}
