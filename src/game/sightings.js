// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #164 — THE TOWERS LOG YOU.
//
// David: "when obs or robots report your position that should be written to a
// file as well - and then mirrored in calypso... we could even use it as a kind
// of critique of anti-immigrant language? Human migrant detected etc.?"
//
// So every tower keeps a `sightings` file next to its garrison roster. The
// roster is the estate counting its machines. This is the estate counting YOU,
// and it uses the vocabulary such systems actually use: a person is a bioform
// before they are a person, an irregularity before they are a person, and a
// case number after that.
//
// THE CRITIQUE IS MECHANICAL, NOT DECORATIVE. The register is not set dressing
// bolted on top: it is a function of `documented`, which is `player.seaPermission`
// — whether permission.ml has been uploaded to the net (#141). File the paper
// and the same towers, watching the same person doing the same thing, reclassify
// them from REMOVAL AUTHORISED to a routine line nobody will ever read. Nothing
// about the person changed. Nothing in this module comments on that; the two
// files simply sit in the same folder and can be read one after the other.
//
// A LOG, NOT A ROSTER. The roster (garrison.js) is a snapshot overwritten on
// change. This accumulates, because that is what makes it a record: the point
// of it is that it remembers you were here after you have gone.
//
// EVERY NODE SEES A SLIVER (David, 2026-08-14: "each ob will only see a partial
// view - there is a distributed log"). A tower logs what crossed its own arc and
// nothing else: it holds a handful of disconnected moments, it does not know
// where you went between them, and it counts and classifies you on its own tally
// — so one tower has you down for removal while the next still calls you a
// bioform, and neither is wrong from where it stands.
//
// The track only exists when the slivers are pooled, which is `mergeSightings`
// and which is what CALYPSO does with the mirrors. That is the whole shape of
// the thing: no watcher here knows much, and the network knows your whole day.
// It also means the record has a throat — a node cut from the net (jammed,
// felled, looped) stops contributing, and the collated track keeps the hole.

/** How many entries a node keeps. Older ones roll off, and the file says so. */
export const SIGHTINGS_KEPT = 24;

/**
 * The estate's word for a person, by how many times it has seen them and
 * whether a permission is on file.
 *
 * THE LADDER ENDS IN IMMOBILITY, NOT EXPULSION (David, 2026-08-14: "it wouldn't
 * be REMOVAL AUTHORISED it would be HOLD IN PLACE, RESTRICT, DELAY"). These
 * systems mostly do not throw people out. They restrict, they defer, they
 * schedule a review that does not happen, and the waiting is the sanction. An
 * order to remove would at least be an event with an end.
 *
 * Which is also this island: CALYPSO has held one man in place for seven years
 * without once threatening to send him anywhere.
 *
 * Undocumented, the rungs climb with familiarity — being seen more often makes
 * you more of a problem rather than more of a neighbour.
 */
export function classify(count, documented) {
  if (documented) return 'RESIDENT, DOCUMENTED';
  if (count <= 1) return 'UNREGISTERED BIOFORM';
  if (count <= 4) return 'MIGRANT, UNDOCUMENTED';
  if (count <= 8) return 'RESTRICT — MOVEMENT LOGGED';
  if (count <= 14) return 'DELAY PENDING REVIEW';
  return 'HOLD IN PLACE';
}

/** How the node came to see them, in the node's own shorthand. */
export const HOW = {
  sight: 'visual, node arc',
  eye: 'optical, long line',
  song: 'held in song',
  unit: 'reported by unit',
  net: 'net correlation',
};

/**
 * The clause a node appends about status. Documented, it is the bored line a
 * system writes when it has nothing to do; undocumented, it is the one that
 * licenses everything that follows.
 */
export function statusNote(documented, count = 0) {
  if (documented) return 'permission on file (PERMISSION.ML). no action required.';
  // The clause that does the work. Nothing here threatens anything: it defers,
  // and a deferral with no date on it is the sanction.
  if (count > 14) return 'no permission on file. hold in place. review not scheduled.';
  if (count > 8) return 'no permission on file. review pending; no date set.';
  if (count > 4) return 'no permission on file. movement restricted pending status check.';
  return 'no permission on file.';
}

/**
 * One record. Fixed columns, so a person skimming reads down the class.
 *
 * The flag column is where the node admits the record is damaged, and the file
 * goes on treating a damaged record as evidence regardless.
 */
export function sightingLine(e) {
  const clean = (v) => String(v == null ? '-' : v).replace(/[|\n]/g, ' ');
  const bearing = (e.x == null || e.y == null) ? '?,?' : `${Math.round(e.x)},${Math.round(e.y)}`;
  return [
    clean(e.at).padEnd(5),
    clean(e.flag || '').padEnd(4),
    clean(e.cls).padEnd(33),
    bearing.padEnd(9),
    clean(e.note),
  ].join(' | ');
}

/**
 * The file. A header that counts, a schema line, then the entries oldest first.
 *
 * `dropped` is printed rather than swallowed: a log that silently forgets is
 * telling you it has the whole record when it does not.
 */
export function sightingsText(tower, entries, opts = {}) {
  const code = (tower && (tower.code || tower.name)) || 'OB_????';
  const at = opts.clock || '--:--';
  const total = opts.total ?? entries.length;
  const dropped = Math.max(0, total - entries.length);
  const out = [
    `# ${code} sightings  ·  ${total} entr${total === 1 ? 'y' : 'ies'}  ·  written ${at}`,
    '# unregistered presence within this node\'s arc, logged for the estate.',
    '# PARTIAL. monitoring subject.',
    '# time  | flg  | classification                     | bearing   | note',
  ];
  if (dropped) out.push(`# (${dropped} earlier entr${dropped === 1 ? 'y' : 'ies'} rolled off this node)`);
  if (!entries.length) out.push('# (nothing has been seen from this node)');
  for (const e of entries) out.push(sightingLine(e));

  // The integrity footer. A node that knows its link is bad still files, still
  // counts, and still classifies on the total — it reports the damage as
  // housekeeping rather than as a reason to doubt anything above.
  const dupes = duplicateCount(entries);
  const bad = entries.filter((e) => e.flag).length;
  if (bad || dupes) {
    out.push('#');
    if (bad) out.push(`# ${bad} of ${entries.length} record${entries.length === 1 ? '' : 's'} arrived flagged (CHK/CLK/RETX). retained.`);
    if (dupes) out.push(`# ${dupes} duplicate record${dupes === 1 ? '' : 's'} present. counted toward classification.`);
  }
  return out.join('\n') + '\n';
}

/**
 * Add a sighting, returning the new list. Keeps the last SIGHTINGS_KEPT.
 *
 * `count` is the node's running total INCLUDING this one, so the classification
 * is the node's own view: each tower escalates on what it personally has seen,
 * and a tower you have walked past once still calls you a bioform while the one
 * outside the grove has you down for removal.
 */
export function addSighting(list, e, node = null, seq = null) {
  // A record is damaged on its way in, not on its way out, so the corruption is
  // what gets saved: a garbled row stays garbled across a reload. `retx` yields
  // two rows from one moment, and both of them count.
  const rows = (node != null && seq != null) ? corrupt(e, node, seq) : [e];
  const next = [...(list || []), ...rows];
  return next.length > SIGHTINGS_KEPT ? next.slice(next.length - SIGHTINGS_KEPT) : next;
}

/** Build one entry. Pure, so the tick site has no formatting in it. */
export function makeSighting({ at, x, y, how, count, documented, unit }) {
  const note = [];
  if (count <= 1) note.push('first contact');
  note.push(unit ? `${HOW.unit} ${unit}` : (HOW[how] || HOW.sight));
  note.push(statusNote(documented, count));
  return { at, x, y, cls: classify(count, documented), note: note.join('; ') };
}

/**
 * Pool the nodes' slivers into one track, oldest first.
 *
 * This is the step that turns a dozen partial logs into a day of somebody's
 * life. Each line keeps the node that filed it, because provenance is the
 * difference between a record and a rumour — and because a reader can then see
 * which towers were quiet, and that a gap in the track is a gap in the network
 * rather than a gap in the walking.
 *
 * `nodes` is a map of code -> entries. Towers cut from the net are simply not
 * passed in: a jammed node contributes nothing and the hole stays visible in
 * the count.
 */
export function mergeSightings(nodes) {
  const all = [];
  for (const [code, entries] of Object.entries(nodes || {})) {
    for (const e of (entries || [])) all.push({ ...e, node: code });
  }
  // Game clocks are HH:MM strings, so a lexical sort is a chronological one.
  all.sort((a, b) => String(a.at).localeCompare(String(b.at)));
  return all;
}

/**
 * The daemon's own view: the pooled track, with the node that saw each moment.
 * `reporting` / `total` say how much of the network was actually contributing,
 * so a reader can tell a quiet day from a broken net.
 */
export function trackText(entries, opts = {}) {
  const at = opts.clock || '--:--';
  const reporting = opts.reporting ?? 0;
  const total = opts.total ?? reporting;
  const out = [
    `# correlated track  ·  ${entries.length} sighting${entries.length === 1 ? '' : 's'}  ·  written ${at}`,
    `# pooled from ${reporting} of ${total} node${total === 1 ? '' : 's'} reporting.`,
  ];
  if (reporting < total) {
    out.push(`# ${total - reporting} node${total - reporting === 1 ? ' is' : 's are'} off the net. `
      + 'their arcs are absent from this track.');
  }
  // Pooling records from clocks that disagree produces an order that is not the
  // order things happened in. The file says so and sorts them anyway, which is
  // what such systems do.
  const skewed = [...new Set(entries.filter((e) => e.flag === 'CLK').map((e) => e.node))];
  if (skewed.length) {
    out.push(`# ${skewed.length} node${skewed.length === 1 ? '' : 's'} report an unsynchronised clock `
      + `(${skewed.join(', ')}). sequence below is by reported time.`);
  }
  const dupes = duplicateCount(entries);
  if (dupes) out.push(`# ${dupes} record${dupes === 1 ? '' : 's'} appear more than once across nodes.`);
  out.push('# time  | node     | flg  | classification                     | bearing');
  if (!entries.length) out.push('# (no sightings pooled)');
  for (const e of entries) {
    out.push([
      String(e.at).padEnd(5),
      String(e.node || '-').padEnd(8),
      String(e.flag || '').padEnd(4),
      String(e.cls || '-').padEnd(33),
      (e.x == null || e.y == null) ? '?,?' : `${Math.round(e.x)},${Math.round(e.y)}`,
    ].join(' | '));
  }
  return out.join('\n') + '\n';
}

// ---- The record is not clean ---------------------------------------------
// David, 2026-08-14: "these logs should also be full of errors like real
// systems are - glitches and mismatched records".
//
// This is the part that makes the file an argument rather than a prop. Real
// administrative records are full of retransmits, clock skew, dropped fields
// and duplicated rows, and the systems built on top of them go on classifying
// people with total confidence anyway. The estate never doubts a line it wrote.
//
// The consequence is deliberate and it is the point: a DUPLICATE COUNTS. A
// record that arrived twice because a node retransmitted it moves you up the
// ladder exactly as a second visit would, so a person can be escalated to
// REMOVAL AUTHORISED by nothing but a flaky link. Nothing in the file marks
// that as a mistake, because nothing in the estate believes it is one.
//
// DETERMINISTIC, not random. A save and a reload must show the same corruption
// in the same places — a glitch that moves when you look away is a rendering
// bug, not a record. Everything below hashes (node, seq).

/** A small stable hash. Same node and sequence, same damage, every time. */
function seedOf(node, seq) {
  let h = 2166136261;
  const s = `${node}#${seq}`;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0);
}

/** The failures a node in this state actually has. Rates are per record. */
export const GLITCH = {
  none: 0.62,        // most records are fine, which is what makes the rest land
  checksum: 0.10,    // arrived damaged; the node files it anyway
  bearing: 0.09,     // position field lost in transit
  garble: 0.07,      // line noise through the payload
  retx: 0.06,        // a retransmit — filed a second time, and COUNTED again
  skew: 0.06,        // this node's clock disagrees with the network's
};

/** Which failure this record has, if any. */
export function glitchFor(node, seq) {
  const r = (seedOf(node, seq) % 10000) / 10000;
  let acc = 0;
  for (const [kind, p] of Object.entries(GLITCH)) {
    acc += p;
    if (r < acc) return kind;
  }
  return 'none';
}

/** Line noise. Deterministic, and it leaves enough intact to still read. */
function garble(text, seed) {
  const chars = [...String(text)];
  const n = 2 + (seed % 3);
  for (let i = 0; i < n; i++) {
    const at = (seed >>> (i * 3)) % chars.length;
    chars[at] = '▓';
  }
  return chars.join('');
}

/** Minutes a node's clock is out by. Constant per node: a clock drifts, it does not flicker. */
export function clockSkew(node) {
  const s = seedOf(node, 'clock');
  return (s % 2 ? 1 : -1) * (1 + (s % 7));
}

/** Shift an HH:MM string by minutes, wrapping the day. */
export function shiftClock(at, mins) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(at));
  if (!m) return at;
  let t = (Number(m[1]) * 60 + Number(m[2]) + mins) % 1440;
  if (t < 0) t += 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

/**
 * Damage one record the way its node's link would have. Returns the entry (or
 * a pair, when the node retransmitted it) — never null: a corrupt record is
 * still filed, which is the whole difficulty with these systems.
 */
export function corrupt(entry, node, seq) {
  const kind = glitchFor(node, seq);
  const seed = seedOf(node, seq);
  const e = { ...entry, seq };
  switch (kind) {
    case 'checksum':
      return [{ ...e, flag: 'CHK!', note: `${e.note} [checksum failed; record retained]` }];
    case 'bearing':
      return [{ ...e, x: null, y: null, note: `${e.note} [bearing lost in transit]` }];
    case 'garble':
      return [{ ...e, note: garble(e.note, seed) }];
    case 'skew':
      return [{ ...e, at: shiftClock(e.at, clockSkew(node)), flag: 'CLK', note: `${e.note} [node clock unsynchronised]` }];
    case 'retx':
      // The same moment, filed twice. Both rows count.
      return [e, { ...e, seq: `${seq}r`, flag: 'RETX', note: `${e.note} [retransmit]` }];
    default:
      return [e];
  }
}

/** Was this record filed more than once? Used to show what the tally is built on. */
export function duplicateCount(entries) {
  const seen = new Set();
  let dupes = 0;
  for (const e of entries || []) {
    const k = `${e.at}|${e.x},${e.y}`;
    if (seen.has(k)) dupes++;
    else seen.add(k);
  }
  return dupes;
}
