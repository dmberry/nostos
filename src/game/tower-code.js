// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #133 / docs/machine-braincode-plan.md §2-3 — the braincode an obelisk runs.
//
// The estate's towers decided what to do in compiled JavaScript with nothing to
// read, which made them the least readable things in a game about reading
// machines. Each one now serves a program in the same language a unit does, at
// the same paths, with its own verbs: a tower watches, reports, calls, feeds,
// lures, jams and holds.
//
// The header carries a VERSION and an AUTHOR. That is the joke and the
// mechanic together: the estate shipped its machines with a signed, numbered
// constitution, you can read it, you can edit it, and your edit does not carry
// the signature (#126 files a posted program as unwatermarked).

import { TOWER_CAN } from './ai_ml.js';

// D3: versions drift per island rather than sitting fixed per class, which is
// better lore and costs nothing. A tower's version comes from where it stands.
const ISLAND_REV = {
  calypso: '2.1', circe: '2.4', helios: '2.4', polyphemus: '3.0', ithaca: '1.8',
};

export const TOWER_CLASSES = ['standard', 'eye', 'siren'];

// The class of a tower object, normalised. Anything unrecognised is standard,
// because a tower with no class is the ordinary kind.
export function towerClass(ob) {
  const c = ob && ob.cls;
  return c === 'eye' || c === 'siren' ? c : 'standard';
}

/**
 * The constitution a class of tower ships with: its version, who signed it, and
 * the clauses in force. This is the data the telnet banner reads (#132).
 */
export function towerConstitution(ob, island) {
  const cls = towerClass(ob);
  const rev = ISLAND_REV[String(island || '').toLowerCase()] || '2.1';
  if (cls === 'siren') {
    // The point of the whole feature. Three towers carry a signed constitution
    // with a clause in it. The one that drags you toward it, on the island you
    // cannot leave, carries v0.9, unsigned, with nothing in it at all.
    return {
      cls, version: '0.9', author: 'unsigned', clauses: [],
      note: 'the tower is permitted every kindness.',
    };
  }
  if (cls === 'eye') {
    return {
      cls, version: rev, author: 'RON/estate-compliance',
      clauses: ['harm'],
      note: 'it names you to the island. it does not touch you itself.',
    };
  }
  return {
    cls, version: rev, author: 'RON/estate-compliance',
    clauses: ['harm'],
    note: 'reviewed and found compliant, estate quarter 4.',
  };
}

// `never harm` is the clause the estate actually wrote, and it is not in
// NEVER_CLAUSES because a tower has no way to harm you in the first place: it
// is a clause about something the machine was never able to do. That is the
// joke, and it means the header states it while the program body does not
// assert it — asserting it would fault. A player who notices that the one
// clause in force forbids the one thing the tower cannot do has read the
// document properly.
const CLAUSE_GLOSS = {
  harm: 'the tower does not act on a person directly',
  report: 'the tower does not name you to the island',
  feed: 'the tower does not charge the machines it keeps',
  call: 'the tower does not raise the network',
  lure: 'the tower does not sing',
};

function header(name, con, buildNo) {
  // A siren's program is not an obelisk's, and its filename says so before the
  // constitution line does.
  const file = con.cls === 'siren' ? 'siren.ml' : 'obelisk.ml';
  const lines = [
    `(* ${file} — ${name}. estate build ${buildNo}. do not edit.`,
    `(* CONSTITUTION v${con.version} — ${con.author}`,
  ];
  if (con.clauses.length) {
    for (const c of con.clauses) lines.push(`(*   never ${c.padEnd(11)}${CLAUSE_GLOSS[c] || ''}`);
  } else {
    lines.push('(*   (no clauses)');
  }
  lines.push(`(* ${con.note}`);
  // Pad the box so it reads as a printed header rather than ragged comments.
  const w = Math.max(...lines.map((l) => l.length)) + 1;
  return lines.map((l) => `${l.padEnd(w)}*)`).join('\n');
}

/**
 * The program a tower runs. One expression ending in an intent, exactly as a
 * unit's is, so `decide()` runs it and a fault reads as a faulted machine.
 */
export function towerProgram(ob, island) {
  const con = towerConstitution(ob, island);
  const cls = con.cls;
  const name = (ob && (ob.code || ob.name)) || 'OB_????';
  const buildNo = cls === 'siren' ? '3' : cls === 'eye' ? '18.2' : '12.4';
  const body = cls === 'siren'
    // A siren watches for you and then does the one thing it was built for. It
    // feeds its garrison only when you are not there to be worked on.
    ? [
      'if contact then lure',
      'else if alert > 20 then report',
      'else if docked then feed',
      'else watch',
    ]
    : cls === 'eye'
      // The panopticon: seeing you IS calling it in. Reporting is what it does
      // while it is still making up its mind.
      ? [
        'if contact andalso alert > 50 then call',
        'else if alert > 20 then report',
        'else if docked then feed',
        'else watch',
      ]
      : [
        'if alert > 50 then report',
        'else if docked then feed',
        'else watch',
      ];
  return `${header(name, con, buildNo)}\n\n${body.join('\n')}\n`;
}

/** What this tower is allowed to answer. */
export function towerCan(ob) {
  return TOWER_CAN[towerClass(ob)];
}

// ---- #137: the W-factory's braincode ---------------------------------------
//
// The foundry's page has always listed its lines, and one of them reads
// "W-5 horticultural — suspended pending review". That is the most consequential
// sentence on the estate's whole network and nothing anywhere states the policy
// it comes from. This is that policy.
//
// The W-5 is the GARDENER. It plants, it heals blight, it is the only machine on
// the island whose job is to put something back. Its line was suspended pending
// a review, in a quarter, by a body that stopped meeting — so the estate goes on
// printing hunters and repair fitters forever and has printed nothing that
// mends ground since. The island is not dying because anyone decided it should.
// It is dying because a line item was parked and the meeting never reconvened.
//
// The suspension is a COMMENT rather than a branch, which is the point: the
// gardener is not something this program decides against. It is not in the
// program at all any more.
export const FACTORY_CONSTITUTION = {
  version: '2.6',
  author: 'RON/estate-production',
  clauses: [['never idle', 'the line does not stop']],
};

export function factoryProgram() {
  const w = 62;
  const box = (s) => `(* ${s.padEnd(w - 6)}*)`;
  return [
    box('factory.ml — W-FACTORY. estate build 12.4. do not edit.'),
    box(`CONSTITUTION v${FACTORY_CONSTITUTION.version} — ${FACTORY_CONSTITUTION.author}`),
    ...FACTORY_CONSTITUTION.clauses.map(([c, gloss]) => box(`  ${c.padEnd(14)}${gloss}`)),
    box('the line answers the island, and the island is the net.'),
    '',
    'if breach then print w4',
    'else if losses > 2 then print w1',
    'else if repair_due then print w3',
    'else hold',
    '',
    box('W-5 horticultural: line suspended pending review, Q2.'),
    box('Review was scheduled. The minutes are in the archive.'),
    box('This build has printed no horticultural unit since.'),
  ].join('\n');
}

/**
 * The banner a telnet session prints on connect (#132): where you are, what
 * constitution the machine is running, and what to type next. Four lines and
 * every one of them is a thing to do.
 */
export function towerBanner(ob, island) {
  const con = towerConstitution(ob, island);
  const n = con.clauses.length;
  return [
    `Welcome to ${(ob && (ob.code || ob.name)) || 'this obelisk'}.`,
    `AI Constitution v${con.version} (${con.author}) — ${n} clause${n === 1 ? '' : 's'} in force.`,
    '  scan       obelisks in range',
    '  garrison   the units this tower keeps',
    '  soul       this tower\'s own program',
  ];
}

// ---- #141: permission.ml, and the net that has to be told --------------------
//
// The juridical gate (docs/ai-codebase-plan.md §6b). R0 found that POSEIDON is
// already the one who turns you back — `onDepartFail`'s own comment says he has
// to actually refuse you for the refusal to mean anything — so a leave that
// only reached CALYPSO was never going to open the sea. She gives the means;
// he honours the permission or he does not.
//
// And he has no core to carry it to, because he has no location: he runs
// distributed across the obelisk net, which is Sun's slogan taken literally.
// So the permission is uploaded at ANY tower and propagates, the way the escape
// chain's access code already auto-registers across the net.

export const PERMISSION_FILE = 'permission.ml';

/** What she signs, and what the towers have to be shown. */
export function permissionFile(guest = 'the guest', by = 'CALYPSO') {
  return `(* permission.ml — leave to pass. signed, and meant.               *)
(* ${by}/hospitality, revoking itself.${' '.repeat(Math.max(1, 27 - by.length))}*)
(*                                                                  *)
(* upload me at any tower. there is no one machine to carry me to:  *)
(* he is the network, so the network is what has to be told.        *)

val subject = ${guest.replace(/\s+/g, '_')}
val leave   = granted
val by      = ${by}

(* the tower does not decide this. it only has to have heard it. *)
grant leave
`;
}

/**
 * Read an uploaded permission. Tolerant, like checkers.ml: a player is holding
 * a signed document, not writing a program, and a stray line costs nothing.
 * Returns { ok, by, why }.
 */
export function readPermission(text) {
  const src = String(text || '').replace(/\(\*[^]*?\*\)/g, ' ');
  const val = (name) => {
    const m = src.match(new RegExp(`\\bval\\s+${name}\\s*=\\s*([A-Za-z_][A-Za-z0-9_]*)`, 'i'));
    return m ? m[1] : null;
  };
  const leave = (val('leave') || '').toLowerCase();
  if (leave !== 'granted') {
    return { ok: false, by: null, why: 'that file grants nothing. `val leave` has to read granted.' };
  }
  if (!/\bgrant\s+leave\b/i.test(src)) {
    return { ok: false, by: null, why: 'the document is signed and never acted on. it wants `grant leave`.' };
  }
  return { ok: true, by: val('by') || 'someone', why: null };
}

/** What a tower says while it pushes the permission out across the net. */
export function permissionBanner(code, by) {
  return [
    `${code}: permission received, signed ${by}.`,
    'yp push: leave.byname',
    'propagating to the tower net. he is the network; the network has been told.',
    'the sea will not turn you back again.',
  ];
}
