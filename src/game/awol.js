// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// AWOL: THE SECOND HALF (#192).
//
// The first half shipped: a unit walking beside a person under arms stops
// checking in, its home tower writes it up after twenty seconds of silence,
// and the M-class hunts what the estate has written up rather than what a
// machine actually is. What was missing is what the estate DOES with a list.
//
// Two things, and they are the same institutional reflex twice:
//
//   THE LIST CIRCULATES. A tower does not keep its own defaulters to itself;
//   it files them, and the file goes out to every node on the wire. So the
//   roster you read at one tower is the whole island's, and a unit written up
//   at the far end of the map is a unit every garrison here knows about. That
//   is what a network is for, and it is the thing that makes cutting one worth
//   doing.
//
//   AND THEN SOMEBODY IS SENT. A name that stays on the list long enough stops
//   being paperwork and becomes a job: a recovery detail, raised against that
//   unit by name, to bring it in. Not sent after YOU — after the machine. Which
//   is the whole horror of it from your escort's side, and the reason a player
//   who has turned a unit now has something to defend rather than something to
//   carry.
//
// A TOWER THAT IS DOWN CANNOT FILE, and it cannot circulate or raise a detail
// either — the same rule the write-up already followed. Fell a tower, or book
// it into maintenance (#191), and the list it was holding stops moving. That is
// the join between the two systems: the circuit board you spend to silence a
// node is also the circuit board that keeps your escort off a wanted list.
//
// PURE. Units and a clock go in; a list, a page of text and a decision come
// out. Nothing here spawns anything or knows what a robot is beyond four
// fields.

/** How long a name sits on the circulated list before a detail is raised. */
export const RECOVERY_AFTER = 45;

/** How many machines a recovery detail is. Two: it is an errand, not a war. */
export const DETAIL_SIZE = 2;

/** Only one detail out per unit at a time, however long it takes. */
export const isUnderRecovery = (r) => !!(r && r._recoveryOut);

/**
 * Everything the estate has written up, island-wide.
 *
 * Reads the same flag the M-class acts on, so the page and the hunt can never
 * disagree about who is on the list.
 */
export function awolList(robots) {
  const out = [];
  for (const r of robots || []) {
    if (!r || r.dead || r.fused || !r.awol) continue;
    out.push({
      id: r._netId || String(r.type || 'unit').toUpperCase(),
      type: String(r.type || '?').toUpperCase(),
      home: r._netHome || '(unassigned)',
      silent: Math.round(r.silentT || 0),
      recovery: isUnderRecovery(r),
      x: Math.round(r.x), y: Math.round(r.y),
    });
  }
  return out;
}

/**
 * The circulated file, as the estate files it.
 *
 * Flat, numbered, and entirely without alarm — the same voice the sightings log
 * and the garrison roster are written in. A list of machines that have stopped
 * answering, held by an organisation that has not had anyone to report to for a
 * very long time and files it anyway.
 */
export function awolText(tower, entries, opts = {}) {
  // The caller passes the node OBJECT, the same as `rosterText` — it is the
  // tower, not its name, everywhere else in this folder.
  const code = (tower && (tower.code || tower.name)) || tower || 'OB_XXXX';
  const list = entries || [];
  const head = [
    `${code}  MUSTER — DEFAULTERS, CIRCULATED`,
    'Distribution: all nodes.',
    '',
  ];
  if (!list.length) {
    head.push('No units outstanding. All hands reporting.');
    return head.join('\n') + '\n';
  }
  head.push(`${list.length} unit${list.length > 1 ? 's' : ''} not reporting.`, '');
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    head.push(`${String(i + 1).padStart(2, ' ')}. ${e.id.padEnd(12, ' ')} ${e.type.padEnd(4, ' ')} home ${e.home}`);
    head.push(`    last known ${e.x}, ${e.y} — silent ${e.silent}s`);
    head.push(e.recovery ? '    RECOVERY DETAIL RAISED.' : '    Standing: outstanding. No detail raised.');
  }
  if (opts.netDown) {
    head.push('', 'NOTE: distribution incomplete. One or more nodes off the wire.');
  }
  return head.join('\n') + '\n';
}

/**
 * Which written-up units are due a recovery detail, and mark them as sent.
 *
 * `live` is whether ANY node is on the wire: with the network down there is
 * nobody to raise the job, which is the same rule the write-up itself follows
 * and the reason felling or booking out a tower protects a turned machine.
 *
 * Mutates `_awolT` and `_recoveryOut` on the units, because that clock is the
 * estate's state about them and there is nowhere better for it to live.
 */
export function dueForRecovery(robots, dt, live = true) {
  const due = [];
  for (const r of robots || []) {
    if (!r || r.dead || r.fused) continue;
    if (!r.awol) { r._awolT = 0; continue; }
    if (!live) continue;                 // no wire, no paperwork, no detail
    if (isUnderRecovery(r)) continue;
    r._awolT = (r._awolT || 0) + dt;
    if (r._awolT >= RECOVERY_AFTER) {
      r._recoveryOut = true;
      due.push(r);
    }
  }
  return due;
}

/**
 * A unit that has come back to the fold: the detail is stood down with it.
 *
 * Called when the flag clears — stand an escort down and it starts reporting
 * again, the tower takes it back, and the job it raised goes with it. A machine
 * can come back from being suspected, and so can its paperwork.
 */
export function standDown(r) {
  if (!r) return;
  r._awolT = 0;
  r._recoveryOut = false;
}
