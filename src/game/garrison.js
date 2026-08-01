// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

import { awolText } from './awol.js';   // #192: the circulated defaulters' list

// #162 — THE GARRISON ROSTER.
//
// David: "all the robots at a garrison report their position to their OB which
// saves them as a file on their terminal which you can GET or cat or manipulate
// in pico on the laptop later."
//
// So every tower keeps a file of the units homed to it — what they are, where
// they were, how much charge they had, what they were doing. It is the tower's
// own bookkeeping, and the player can read it at the console, pull it to the
// NostBook, and edit it there.
//
// THE FILE IS A REPORT, NOT THE WORLD (David, 2026-08-14: "I am not sure the
// tower cares"). Editing your copy does not move the machines and does not lie
// to the tower: rewriting a unit's position to send a dispatch at empty ground
// would be a fine trick, and it is not this trick. The record is downstream of
// the world. That is the point of it being a record — and the next time the
// garrison changes, the tower overwrites what you wrote without noticing.
//
// WRITE ON CHANGE, not on a clock (David's call). A unit arriving, leaving,
// going flat or picking up a tag rewrites the file; nothing runs on a timer. A
// handful of writes an hour per tower instead of every tower walking its
// garrison forever for a file almost nobody reads — and what comes out has real
// history in it rather than being a sample taken every fifteen minutes.
//
// The FORMAT is /etc/passwd's, because that is what this machine's Unix would
// actually use in 1995: colon-separated, one record per line, with a commented
// header that doubles as the schema. It is greppable and cuttable with the
// tools the laptop already has, and it survives hand-editing in `ed` without a
// stray character being fatal.

/** The columns, in order. The header comment prints this, so it IS the schema. */
export const ROSTER_FIELDS = ['unit', 'class', 'x', 'y', 'charge', 'state', 'tag'];

/**
 * What a unit is doing, in one word, from the flags the robot carries. Ordered
 * by how much it matters to somebody reading the sheet: a flat machine is the
 * fact you act on, so it wins over what it was doing when it went flat.
 */
export function unitState(r) {
  if (!r || r.dead) return 'lost';
  if (r.fused) return 'wreck';
  if (r.drained) return 'flat';
  // WRITTEN UP. The tower has not heard from it for AWOL_AFTER seconds and has
  // filed it. This is the estate's belief about the unit, not a fact about it,
  // and it is what the M-class acts on — so the sheet is the mechanism and not
  // just a readout. Above `turned` because a unit can be both, and the one that
  // matters operationally is the one the guards are working from.
  if (r.awol) return 'awol';
  if (r.friendly) return 'turned';       // it is not theirs any more, and the sheet says so
  if (r.recharging) return 'docked';
  if (r.disabledT > 0) return 'stunned';
  if (r.aggro) return 'hunting';
  if (r.returning) return 'homing';
  return r.intent || 'patrol';
}

/** One record. Colons are the separator, so nothing in a field may contain one. */
export function rosterLine(r, netId) {
  const clean = (v) => String(v == null ? '-' : v).replace(/[:\n]/g, '_') || '-';
  return [
    clean(netId || r._netId || r.type),
    clean(r.type),
    Math.round(r.x),
    Math.round(r.y),
    Math.round(Math.max(0, Math.min(100, r.battery ?? 0))),
    clean(unitState(r)),
    clean(r._netTag || '-'),
  ].join(':');
}

/**
 * The whole file: a header carrying the tower, a revision and the time it was
 * written, the schema line, and a record per unit.
 *
 * `rev` counts writes rather than being a timestamp, so a player who pulls the
 * file twice can tell whether anything actually happened between the two — a
 * clock alone cannot say that, because the tower writes only on change.
 */
export function rosterText(tower, units, opts = {}) {
  const code = (tower && (tower.code || tower.name)) || 'OB_????';
  const rev = opts.rev || 1;
  const at = opts.clock || '--:--';
  const lines = [
    `# ${code} garrison  rev ${rev}  written ${at}`,
    `# ${ROSTER_FIELDS.join(':')}`,
  ];
  for (const u of units) lines.push(rosterLine(u.r || u, u.netId));
  if (!units.length) lines.push('# (no units homed to this node)');
  return lines.join('\n') + '\n';
}

/**
 * Read one back. Tolerant on purpose: this file is meant to be edited by hand
 * in `ed` on a laptop with no syntax checker, so a short line, a blank line or
 * a stray comment is skipped rather than thrown. Returns the records it could
 * make sense of and says how many it could not.
 */
export function parseRoster(text) {
  const out = [];
  let skipped = 0;
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split(':');
    if (parts.length < ROSTER_FIELDS.length) { skipped++; continue; }
    const rec = {};
    ROSTER_FIELDS.forEach((f, i) => { rec[f] = parts[i]; });
    rec.x = Number(rec.x); rec.y = Number(rec.y); rec.charge = Number(rec.charge);
    if (!Number.isFinite(rec.x) || !Number.isFinite(rec.y)) { skipped++; continue; }
    out.push(rec);
  }
  return { units: out, skipped };
}

/**
 * A cheap fingerprint of what the sheet WOULD say, for deciding whether to
 * write at all. Position is rounded to the tile, so a machine shuffling on the
 * spot does not rewrite the file sixty times a minute — the roster records
 * where a unit is, not every step it took getting there.
 */
export function rosterDigest(units) {
  let s = '';
  for (const u of units) {
    const r = u.r || u;
    s += `${u.netId || r._netId || r.type}|${Math.round(r.x)},${Math.round(r.y)}|`
      + `${Math.round((r.battery ?? 0) / 5)}|${unitState(r)}|${r._netTag || ''};`;
  }
  return s;
}

// ---- The logs folder ----------------------------------------------------
// #162 follow-up. One file on the bench was not findable: you had to know the
// word `garrison` before `ls` would mean anything, and a player who did not
// know it saw an empty-looking node (David, 2026-08-14: "the files of logs from
// robots should be in a folder in the ob file structure - much more findable").
//
// So the tower keeps a `logs/` folder: the roster, and one file per unit. The
// roster is the tower's summary; a unit's own log is what that machine has
// filed about itself, which is the level a player actually wants when they are
// deciding whether to reprogram it.

/** The folder the tower keeps its reports in, as it appears in `ls`. */
export const LOGS_DIR = 'logs';

/** A unit's log file name. The id already carries the tower, so it reads whole. */
export function logName(netId) {
  return `${String(netId).replace(/[^\w.\-]/g, '_')}.log`;
}

/**
 * One machine's own report. The same facts as its roster row, opened out, plus
 * the two things the row has no column for: what its program last decided, and
 * whether that program faulted. A faulted unit is the one you came to find.
 */
// THE M-CLASS FILES DIFFERENTLY.
//
// Every unit's log was written in the same flat estate register — `unit`,
// `class`, `home`, `station`, a charge bar. That is right for a T-1 reporting
// its wheels and wrong for the guard: the M-class is the estate's police, and
// police write in a hand of their own (David, 2026-08-15: "can the reports from
// M class to the Obs be more military in prose form. Staccato and clipped?").
//
// So the same facts, in signal form. No sentences where a fragment will do, no
// articles, times and grids first, and everything a rank rather than a value.
// It reads as something transmitted rather than something stored, which is what
// a report from a machine in the field is.
const MIL_CLASS = new Set(['m4', 'm5', 'm6']);
const MIL_RANK = { m4: 'SCOUT', m5: 'MARKSMAN', m6: 'GUARD' };
const MIL_STATE = {
  hunting: 'CONTACT. PURSUING.',
  homing: 'WITHDRAWING TO POST.',
  patrol: 'ON BEAT. NOTHING TO REPORT.',
  docked: 'AT POST. CHARGING.',
  flat: 'CELL FLAT. IMMOBILE.',
  stunned: 'STUNNED. OFF NET.',
  awol: 'NO CHECK-IN. STANDING: AWOL.',
  turned: 'UNIT NOT OURS. DISREGARD ORDERS FROM IT.',
  lost: 'UNIT LOST.',
  wreck: 'UNIT WRECKED. FIELD IRRECOVERABLE.',
};

/** The M-class report: clipped, ranked, and transmitted rather than filed. */
function militaryLogText(tower, entry, opts, r, id, code, at, pct) {
  const state = unitState(r);
  const out = [
    `${code} // FIELD REPORT // ${at}`,
    '',
    `FROM   ${id}`,
    `ROLE   ${MIL_RANK[r.type] || 'GUARD'}, ${String(r.type).toUpperCase()}`,
    `GRID   ${Math.round(r.x)} ${Math.round(r.y)}`,
    `PWR    ${pct}%`,
    `STATE  ${MIL_STATE[state] || String(state).toUpperCase() + '.'}`,
  ];
  if (r.type === 'm6') {
    const left = r.bombs === undefined ? 3 : r.bombs;
    out.push(`ORD    ${left} STOWED.${left === 0 ? ' REQUEST RESUPPLY.' : ''}`);
  }
  if (r._netTag) out.push(`MARK   ${r._netTag}`);
  out.push(`ORDERS ${r.program ? 'POSTED. NOT OURS.' : 'STANDING.'}`);
  if (r.intent) out.push(`ACTING ${String(r.intent).toUpperCase()}.`);
  if (r.fault) out.push('', `FAULT  ${r.fault}`, 'UNIT NOT ANSWERING ITS OWN ORDERS.');
  if (r._forged) out.push('', `CHECK-IN ACCEPTED x${r._forged}. SOURCE NOT ON MUSTER.`, 'REPORT RETAINED.');
  if (r.friendly) out.push('', 'UNIT HAS CHANGED HANDS. TREAT AS HOSTILE.');
  out.push('', 'ENDS.');
  return out.join('\n');
}

export function unitLogText(tower, entry, opts = {}) {
  const r = entry.r || entry;
  const id = entry.netId || r._netId || r.type;
  const code = (tower && (tower.code || tower.name)) || 'OB_????';
  const at = opts.clock || '--:--';
  const pct = Math.round(Math.max(0, Math.min(100, r.battery ?? 0)));
  if (MIL_CLASS.has(r.type)) return militaryLogText(tower, entry, opts, r, id, code, at, pct);
  const bar = '#'.repeat(Math.round(pct / 10)).padEnd(10, '.');
  const out = [
    `# ${id} — unit log`,
    `# filed to ${code} at ${at}. The tower writes this; the unit does not read it.`,
    '',
    `unit      ${id}`,
    `class     ${String(r.type).toUpperCase()}${r.designation ? ` (${r.designation})` : ''}`,
    `home      ${code}`,
    `station   ${Math.round(r.x)}, ${Math.round(r.y)}`,
    `charge    ${bar} ${pct}%`,
    `state     ${unitState(r)}`,
    `tag       ${r._netTag || '(none)'}`,
  ];
  // What it is running. A machine on stock behaviour has no program to name,
  // and saying so is more use than an empty field.
  out.push(`program   ${r.program ? 'posted' : 'stock'}`);
  if (r.intent) out.push(`decided   ${r.intent}`);
  if (r.fault) out.push(`FAULT     ${r.fault}`);
  if (r.drained) out.push('', 'The cell is flat. It will not move again until it is fed or carried home.');
  if (r.awol) {
    out.push('', 'NO CHECK-IN ON RECORD. Unit has not reported to this node.',
      'Standing: AWOL. Referred to the guard.');
  }
  // #167 — the forgery leaves a mark. The node does not doubt the report; it
  // records where it came in from, in the same flat voice it records everything,
  // and the player can read their own tracks in it.
  if (r._forged) {
    out.push('', `CHECK-IN ACCEPTED x${r._forged} FROM UNREGISTERED PROCESS.`,
      'Source not on the muster. Report retained.');
  }
  if (r.friendly) out.push('', 'This unit no longer answers to the estate.');
  return out.join('\n') + '\n';
}

/**
 * The whole `logs/` folder for a tower: the roster first, then a file per unit.
 * Returns a name -> text map, which is what the terminal reads from.
 */
export function logsFolder(tower, units, opts = {}) {
  const files = { garrison: rosterText(tower, units, opts) };
  // #192 — the defaulters' list, circulated. It is the ISLAND'S, not this
  // tower's: a unit written up at the far end of the map is on the sheet here,
  // because a tower does not keep its defaulters to itself, it files them. The
  // caller passes the island-wide list; this only lays it out.
  if (opts.awol) files.muster = awolText(tower, opts.awol, opts);
  for (const u of units) files[logName(u.netId || (u.r || u)._netId || (u.r || u).type)] = unitLogText(tower, u, opts);
  return files;
}
