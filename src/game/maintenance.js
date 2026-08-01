// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// CIRCUITS AS THE CURRENCY OF MAINTENANCE MODE (#191).
//
// The last piece of the POSEIDON design, and the one that made it a system
// rather than three features standing next to each other: the fog, the blight
// and the shared sight all turn on whether a tower is up, and there was exactly
// one way to put one down — fell it, which brings the foundry out after you.
// Meanwhile a circuit board was inventory you carried until you had eight and
// could make a wave gun.
//
// So: EVERY TOWER YOU TAKE DROPS THE BOARDS THAT SILENCE THE ONES YOU CANNOT
// REACH. A maintenance window costs one board, holds the tower off the net for
// a while, and then the work order closes and the tower comes back.
//
// NOT "JAM" (David, 2026-08-17: "instead of JAM - which would be a strange verb
// use MAINTENANCE MODE"). The daemons grew out of ordinary institutional
// systems that kept running after there was nobody left to run them for, and
// their vocabulary never changed — Calypso still calls you a resident,
// Polyphemus still calls you stock. A tower does not understand being attacked
// by a person. It understands a scheduled service: you file a work order
// against the node, you book the part, and the node takes itself off the
// network for the window because that is the procedure. The estate is not
// fooled, exactly; it is following its own rules, which is worse.
//
// That is also why nothing answers it. Felling a tower is an incident and the
// foundry responds; putting one in maintenance is paperwork, and paperwork is
// the one thing on this island nobody checks.
//
// WHAT IT BUYS THE PLAYER is a question they did not have before: which towers
// do I fell and which do I only book out? Felling is permanent, loud, and costs
// a fight. A maintenance window is quiet, temporary, and costs a board you can
// only get by felling something. The two pull against each other, which is the
// whole of it.
//
// AND IT IS NOT `loop`. That verb pins a node and its garrison until a repair
// drone talks it down: a hack, typed at a terminal, free, and answered. This is
// a booked service on a tower you are standing at, paid for in salvage.
//
// PURE, like build.js and lights.js: a tower and a number of boards go in, a
// decision comes out. Nothing here knows about a terminal, a player or a world.

/** What one window costs. One board — the part the work order books out. */
export const PART_COST = 1;

/**
 * How long a maintenance window runs, in seconds.
 *
 * Long enough to cross the ground the tower was watching and do something at
 * the other end of it, short enough to be a window rather than a kill. The work
 * order closes on its own; nothing has to come and fix it.
 */
export const WINDOW = 100;

/**
 * How many boards a felled tower gives up.
 *
 * The economy has to close: a window has to be payable out of what taking a
 * tower yields, or the currency is decoration. Three is three windows off one
 * fight, which is a decision rather than a shopping trip.
 */
export const BOARDS_PER_TOWER = 3;

/**
 * Can this node be booked out, with this many boards in the pack?
 *
 * `{ok: false, why}` answers in the estate's own voice, because a refusal is
 * where a player learns the rule.
 */
export function canSchedule(ob, boards = 0) {
  if (!ob) return { ok: false, why: 'no such node' };
  if (ob.destroyed || ob.needsRebuild) return { ok: false, why: 'that node is already out of service' };
  if (ob.jammed) return { ok: false, why: 'that node is already in maintenance' };
  if ((boards || 0) < PART_COST) {
    return { ok: false, why: `a work order books ${PART_COST} circuit board — fell a tower for more` };
  }
  return { ok: true };
}

/**
 * File the work order. Sets the flag every other system already reads.
 *
 * `jammed` is the same field the blight, the fog, the shared sight, the unit
 * check-in and the light pools consult, so a booked window does to the network
 * everything felling does — without taking the tower off the island, which is
 * exactly the trade.
 */
export function schedule(ob, window = WINDOW) {
  if (!ob) return false;
  ob.jammed = true;
  ob.maintT = window;
  return true;
}

/**
 * Advance every open window by `dt`, returning the nodes that came back.
 *
 * The caller says so out loud: a window closing without a word is a player
 * walking into a garrison that woke up while they were not looking.
 */
export function tickWindows(obs, dt) {
  const back = [];
  for (const ob of obs || []) {
    if (!ob.jammed || ob.maintT == null) continue;
    ob.maintT -= dt;
    if (ob.maintT > 0) continue;
    ob.jammed = false;
    ob.maintT = null;
    back.push(ob);
  }
  return back;
}

/** Seconds left on the window, for the console and the node's own page. */
export function windowLeft(ob) {
  return ob && ob.jammed && ob.maintT > 0 ? Math.ceil(ob.maintT) : 0;
}

/**
 * A NODE IN MAINTENANCE IS A NODE WITH ITS COVERS OFF (David, 2026-08-17:
 * "which puts it down for repairs but which we can hack").
 *
 * This is what the board actually buys, and it is worth more than the silence.
 * A machine withdrawn from the network for service is not guarding anything: it
 * has stood its own credential check down, because the engineer who was going
 * to come and work on it needs to get in. There is no engineer. There has not
 * been an engineer for a very long time. The procedure is still there.
 *
 * So the window is both a hole in the estate's sight AND a way into the console
 * that would otherwise want an access chip. One board, two doors.
 */
export function isOpenToHack(ob) {
  return !!(ob && ob.jammed && ob.maintT > 0);
}

/** How the node's own page reports it, in the register it files everything in. */
export function statusLine(ob) {
  const left = windowLeft(ob);
  if (!left) return null;
  return `SCHEDULED MAINTENANCE — service window closes in ${left}s. Node withdrawn from the network.`;
}

// ---- what is still in the cabinet -------------------------------------------
//
// David, 2026-08-17: "you could even give it artefacts from its original human
// use years ago."
//
// The best thing about the procedure being still there is that the PEOPLE who
// wrote it were too. A node opened for service is the one place on the island
// where the estate's paperwork and somebody's actual life are in the same
// drawer: the job card is printed, and the handwriting on it is not.
//
// Kept as lines rather than objects because none of it is a mechanic. It is
// what you find when you get in, and the whole of what it does is tell you that
// a person stood exactly here, on a specific Tuesday, and was bored.

const CARDS = [
  ['WORK ORDER 4471/B — 12-month service, signal mast',
   'parts booked ........ 1x driver board (green), 1x desiccant sachet',
   'engineer ............ M. ADEYEMI',
   'notes ............... "cover screw stripped again. brought my own."'],
  ['WORK ORDER 0918/C — fault call, intermittent carrier',
   'parts booked ........ 1x driver board (green)',
   'engineer ............ R. LINDQVIST',
   'notes ............... "no fault found. sat with it two hours. it behaved."'],
  ['WORK ORDER 2230/A — annual, mast + cabinet',
   'parts booked ........ 1x driver board (green), sealant',
   'engineer ............ M. ADEYEMI',
   'notes ............... "third visit this year. someone please look at the drainage."'],
  ['WORK ORDER 6612/D — decommission survey',
   'parts booked ........ none',
   'engineer ............ (unassigned)',
   'notes ............... "survey not carried out. no engineer available. rescheduled."'],
];

const LEAVINGS = [
  'A mug ring on the shelf inside the cabinet door, gone brown, perfectly round.',
  'A strip of masking tape across the panel with A DEYEMI in biro, half peeled.',
  'A paperback wedged behind the loom to stop it rattling. Spine broken at page 90.',
  'Somebody has scratched a tally into the paint by the terminal. Eleven marks.',
  'A photo taped inside the door: two people on a beach, squinting. No names.',
  'A radio, dead, tuned to something. The dial has been left where it was.',
  'A cigarette burn on the shelf, and beside it a saucer used as an ashtray.',
  'Written small under the part number: "ask about the transfer".',
];

/** A stable number from a node's code, so a tower's drawer is always its own. */
function hash(s) {
  let h = 2166136261;
  const t = String(s || 'node');
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/**
 * What is in this node's cabinet: the job card the estate printed, and the one
 * thing the person who last opened it left behind.
 *
 * Deterministic per node, so the tower you booked out last week has the same
 * engineer's handwriting on it this week — which is the point. These are people
 * who came back.
 */
export function serviceLog(ob) {
  const h = hash(ob && (ob.code || `${ob.x},${ob.y}`));
  const card = CARDS[h % CARDS.length];
  const leaving = LEAVINGS[(h >>> 8) % LEAVINGS.length];
  return [...card, '', leaving];
}
