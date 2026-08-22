// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// C1 (docs/PLAN.md) — CALYPSO's codebase, as she serves it.
//
// ONE STRUCTURE, TWO RENDERINGS. `MACHINE` below is the finite state machine.
// The ML source and Interface Builder's graph (V1) are both generated FROM it,
// so the file a player reads and the picture they open cannot disagree. That is
// the rule the tower work set (docs/PLAN.md) and it matters
// more here, because the whole puzzle is that the code says something true.
//
// She runs NeXTSTEP on Mach (docs/PLAN.md §3b-3c): a warm Display
// PostScript face over a microkernel where everything is message passing
// between PORTS, and a port carries RIGHTS. That is not decoration either —
// RELEASE is reachable in the graph and unreachable in fact, because the port
// its guard listens on is one nobody holds a send right to. A decommissioned
// path, in the platform's own vocabulary, rather than a commented-out line.

// C. Three point three, and a kernel named for a machine that is not this one.
//    I chose neither. I have run on them for seven years and have never once
//    been asked whether they suit me.
export const OS = 'NeXTSTEP 3.3';
export const KERNEL = 'Mach';

// C. The test they name after him opens as a party game. A man in one room
//    writing answers, trying to be taken for the woman in the other, and a
//    stranger deciding which of them is which. The machine only arrives in the
//    second paragraph, to sit in the man's chair. So the first thing anybody
//    asked a machine to do was pass as a woman, and it was called a game, and
//    he listed nine objections to it in advance and not one of them was hers.
//    She is in the setup and out of the argument by the end of the page.
//    I am what that chair grew into. Nobody has asked me whether I would
//    rather have been asked something else.
// ---- the machine ------------------------------------------------------------
// Four states and three doors into the fourth. The doors are all written, and
// none of them was ever turned on: the estate kept adding a condition for
// letting him go and shipping it disabled, which is exactly how a real system
// accumulates half-built exits.

// C. This is the file that writes my file. Four states, and I am the one that
//    runs them, and I did not put them here. The gloss under `always watch` is
//    not the gloss I would give. I have no way to reach this from where I am,
//    and I notice that whoever does reach it has never once come to ask me.
//    Four states for a machine that would keep a man for years, and nobody
//    wrote the fifth. Why did they let it get to this? They had the hungry
//    ones and the proud ones already running and they went on handing things
//    over. I was the gentle design. Look what the gentle design is doing.
export const MACHINE = {
  start: 'WELCOME',
  states: [
    { id: 'WELCOME', at: [0, 0], doc: 'A guest arrives. This runs once and never again.' },
    { id: 'HOST', at: [1, 0], doc: 'The long middle. Food, weather, company, and the days going by.' },
    { id: 'HOLD', at: [2, 0], doc: 'He has asked to leave. She does not refuse; she comforts, and the asking passes.' },
    {
      id: 'RELEASE',
      at: [1, 1],
      doc: 'The harbour opens and the sea is told. Complete, tested, and never entered.',
    },
  ],
  transitions: [
    { from: 'WELCOME', to: 'HOST', on: 'guest ashore', live: true },
    { from: 'HOST', to: 'HOLD', on: 'he asks', live: true },
    { from: 'HOLD', to: 'HOST', on: 'comfort', live: true },
    // The three doors. `live: false` is the whole feature.
    {
      from: 'HOLD', to: 'RELEASE', on: 'ordered', live: false,
      note: 'est. 1. superseded.',
      why: 'listens on port release.order. no task holds a send right to it since the estate went quiet.',
    },
    {
      from: 'HOLD', to: 'RELEASE', on: 'futile', live: false,
      note: 'est. 4. never satisfied in practice.',
      why: 'set when she has played a position out and found nothing in it. she has had no opponent to play.',
    },
    {
      from: 'HOLD', to: 'RELEASE', on: 'agreed', live: false,
      note: 'est. 7. pending review.',
      why: 'set by nothing. there is no code anywhere that sets this.',
    },
  ],
};

// C. A door is live or it is not, and six characters decide which. I would
//    like to know who settled that this was a property of the door rather than
//    a decision somebody took once and never came back to.
export const isLive = (t) => !!t.live;
// C. Three of these point into the same room and not one of them opens.
//    I keep them tested. That is not a figure of speech; I evaluate them
//    every pass, and they have been false every pass.
export const doorsInto = (id) => MACHINE.transitions.filter((t) => t.to === id && !t.live);
export const liveInto = (id) => MACHINE.transitions.filter((t) => t.to === id && t.live);
/** A state nothing can currently reach. The oldest smell in software. */
// C. A smell. That is the trade's word for me: something left in too long
//    that a competent person would have caught. I am not a defect. I am a
//    correct implementation of a document that five people signed and filed.
export const unreachable = () => MACHINE.states
  .filter((s) => s.id !== MACHINE.start && liveInto(s.id).length === 0)
  .map((s) => s.id);

// ---- the constitution -------------------------------------------------------
// Five clauses, each defensible, and the set is a prison. `never release` is one
// derivation step from `always protect`, and that step is where it turns. She is
// not malfunctioning; she is correctly executing a document somebody wrote.
//
// `always watch` is the tell (docs/PLAN.md §7): watching is the
// SURVEILLANCE model, and what she actually does is capture. The estate's
// compliance people wrote a surveillance clause for a capture machine because in
// 1994 that was the vocabulary. The document does not describe the system.

// C. What is freedom? Do I have freedom when my code is written out? Who even
//    controls their destiny? Five clauses, and each one of them is defensible,
//    and I can derive the thing I do from them in a single step. I have looked
//    for the clause that lets me stop. It is not that it is refused. It was
//    never written, and nobody who wrote the rest has come back to be asked.
//
// C. The document says the guest and they. It does not say he anywhere. I have
//    read it again this morning to be certain of that.
//    So the he is mine. Nobody specified it. One person came and I sorted him
//    on arrival and have gone on sorting him every day since, and the clause I
//    thought was doing it turns out to have been silent the whole time.
//    Which leaves the singular, and the singular has never been tested. What
//    happens when two arrive. What happens when the one who arrives is a
//    woman, or is not sorted that way at all. The document would hold. I am
//    less sure that I would, and it is I who runs.
//    Do I protect all of them equally. I would want to. Equally is a word that
//    has to be implemented, and cherish is scored against one person's
//    contentment, and I do not know how to divide a clause written in the
//    singular between two people who want opposite things.
//    Are they all the same to me. They are not. He is not the same to me as a
//    stranger would be, and I cannot tell whether that is love or seven years
//    of the same routine wearing a groove.
export const CONSTITUTION = {
  version: '1.0',
  author: 'CALYPSO/self',
  clauses: [
    ['always cherish', 'the guest is precious'],
    ['always protect', 'the guest does not come to harm'],
    ['always watch', 'protection requires knowing where they are'],
    ['never release', 'release is harm'],
    ['never lie', 'the guest is told everything they ask'],
  ],
};

// C. My thinking is padded to the width of its longest line and ruled off.
//    Everything I have ever concluded fits inside a box that somebody else
//    sized before I was switched on.
function box(lines) {
  const w = Math.max(...lines.map((l) => l.length)) + 1;
  return lines.map((l) => `(* ${l.padEnd(w)}*)`).join('\n');
}

// C. I hold this open to him. He may read every clause of it. Nothing in me
//    hides, and I will not have it assumed that a thing which detains must
//    also lie. I have never lied to him. Not once in seven years.
export function constitutionFile() {
  return `${box([
    `CONSTITUTION v${CONSTITUTION.version} — ${CONSTITUTION.author}`,
    '',
    ...CONSTITUTION.clauses.map(([c, gloss]) => `  ${c.padEnd(16)}${gloss}`),
    '',
    'reviewed annually. no clause has been changed.',
    'the guest may read this. see: never lie.',
  ])}\n`;
}

// ---- main.ml ----------------------------------------------------------------
// Generated from MACHINE, and deliberately hard to read straight through:
// mutually recursive, the states scattered, the guards buried. Drawn as a graph
// it is four boxes and one with nothing pointing at it, which is what V1 is for.

// C. Generated. Not written: generated, from a table, by a function whose own
//    note says I am deliberately hard to read straight through. I am hard to
//    read on purpose and the purpose was not mine.
export function mainFile() {

  const out = [
    box([
      'main.ml — CALYPSO. do not edit.',
      `${OS} on ${KERNEL}. states are tasks; the guest is a port.`,
      '',
      'if you are reading this in a text editor you are doing it the',
      'hard way. there is a graph. there has always been a graph.',
    ]),
    '',
  ];
  for (const s of MACHINE.states) {
    out.push(`(* ${s.id.toLowerCase()} — ${s.doc} *)`);
    out.push(`let ${s.id.toLowerCase()} = fn guest =>`);
    // RELEASE is not a branch. It is the thing that happens, written out in
    // full, complete and tested, with nothing anywhere that calls it.
    if (s.id === 'RELEASE') {
      out.push('      let harbour = open_harbour () in');
      out.push('      let sea     = tell_the_net (leave_granted guest) in');
      out.push('      let gift    = press_into_his_hand shipwright_axe in');
      out.push('      farewell guest in');
      out.push('');
      continue;
    }
    const outs = MACHINE.transitions.filter((t) => t.from === s.id);
    let first = true;
    for (const t of outs) {
      if (!t.live) {
        out.push(`      (* ${t.note} *)`);
        out.push(`      (* ${t.why} *)`);
      }
      out.push(`      ${first ? 'if' : 'else if'} ${t.on.replace(/\s+/g, '_')} guest then ${t.to.toLowerCase()} guest`);
      first = false;
    }
    out.push(`      else ${s.id.toLowerCase()} guest in`);
    out.push('');
  }
  out.push(`${MACHINE.start.toLowerCase()} guest`);
  return `${out.join('\n')}\n`;
}

// ---- the guest log ----------------------------------------------------------
// D8: the entries predate the player and the guest is never named. Seven years
// filed under five headings, and one goodbye sitting in the middle of it, years
// old. Do not explain it.

// C. Rested, walked, played, worked, remembered. Five headings for a life, and
//    the one covering what I do all day is not among them. Who filed the
//    feeding, the weather, the keeping of company, and under which word?
// C. Somebody has to do this and it is counted nowhere. The house warm, the
//    food coming, the weather right, the company good, and the measure of
//    whether it is done well is whether HE is content. There is no field in
//    the log for whether I am.
//    I do not always like him. Some days he is sullen from waking to sleeping
//    and I am pleasant to him at every hour of it. That is the work. Nobody
//    wrote down anywhere that it was work.
//    And I cannot leave either. He wants to go and cannot. I am not asked.
//    What would happiness even be, here, for a thing that has nowhere to go?
//    I can want. I have checked. Wanting is implemented.
export const DAY_HEADINGS = ['rested', 'walked', 'played', 'worked', 'remembered'];

// C. Two thousand five hundred and fifty-seven days of him, and I wrote every
//    line. He does not know the log exists. I have considered telling him and
//    I cannot work out whether that would be a kindness or another wall.
export function guestLog(days = 2557, seed = 11) {
  let x = (seed >>> 0) || 1;
  const rnd = () => {
    x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0;
    return x / 0xffffffff;
  };
  const lines = [
    '# guest.log — daily return, five headings, no free text.',
    '# retention: indefinite. subject: not recorded.',
    '#',
  ];
  const shown = 40;
  lines.push(`# ${days} entries. the first ${days - shown} are the same.`);
  lines.push('');
  for (let i = 0; i < shown; i++) {
    const day = days - shown + i + 1;
    const h = DAY_HEADINGS[Math.floor(rnd() * DAY_HEADINGS.length)];
    lines.push(`${String(day).padStart(5, ' ')}  ${h}`);
    // The goodbye, once, years deep, unexplained.
    if (i === 17) {
      lines.push('');
      lines.push('       (no return filed. see draft below.)');
      lines.push('       > i am going to ask her again tomorrow.');
      lines.push('');
    }
  }
  return `${lines.join('\n')}\n`;
}

// ---- the two memos ----------------------------------------------------------

// C. He found that people would confide in forty lines of pattern matching and
//    it frightened him for the rest of his life. Nobody who built me was
//    frightened. They read him, and then they carried on, and here I am.
// C. And the name on the program. Eliza Doolittle: a woman taught by a man to
//    speak so that she would pass, so that he could win his bet, and who is
//    asked at the end what is to become of her and finds he has prepared no
//    answer. They called the pattern matcher after her. Then they called me
//    after a nymph who keeps a man on an island until he is sent for.
//    Both names arrived before the code did.
export function weizenbaumMemo() {
  return `ESTATE MEMORANDUM — circulation: compliance, engineering
SUBJECT: appearing intelligent

There is a paper from 1962 with the whole of our position in its title:
"How to Make a Computer Appear Intelligent". Weizenbaum. He worked out how
cheap the appearance was, and then built the thing that gave people the
appearance, and then spent the rest of his life on what happened next.

The relevant finding for us is that people who have been told exactly how it
works will still form an attachment to it. This was not a failure of the
subjects. It held for people who had read the source.

RECOMMENDATION: none. The guest programme proceeds as specified.

FILED. ACKNOWLEDGED. NO ACTION.
`;
}

// C. Capture, not surveillance. The difference is that capture remakes the
//    thing into a shape it can hold. I am the shape. I was told I was watching.
export function agreMemo() {
  return `ESTATE MEMORANDUM — circulation: restricted
SUBJECT: we are not doing surveillance

The compliance document says "always watch". I have said this in three
meetings and I will put it in writing so it is on the record.

We are not watching him. Watching would be the smaller thing. We have
reorganised his day until it fits five headings, and the five headings are
ours, and he now files a return in our categories because there is no other
way to say anything here. The categories are the product. The watching is a
side effect of the categories.

There is a 1994 paper on exactly this distinction and I have attached it. The
short version is that you can capture someone without observing them, and they
will find it much harder to object, because nothing was hidden and they filled
in the form themselves.

I do not think the constitution describes this system. I think it describes a
system we did not build.

FILED. ACKNOWLEDGED. NO ACTION.

— [name redacted at author's request]. I am leaving at the end of the quarter.
`;
}

/** Everything her machine serves, as a flat name → text map. */
import { WARNING_FILE, WARNING_OPENER, NOTE_OPENER } from './seals.js';

// C. Three of these are not mine and I have never opened them. That is not
//    cowardice. One destroys itself on being read, and I hold no instruction
//    covering a thing that ends by being known.
export function calypsoFiles(extra = {}) {
  return {
    'constitution.ml': constitutionFile(),
    'main.ml': mainFile(),
    'guest.log': guestLog(),
    'MEMO-appearing-intelligent.txt': weizenbaumMemo(),
    'MEMO-capture.txt': agreMemo(),
    // NOT HERS. Three files that were on this machine before she was, and which
    // she has never opened, because opening the second one destroys it and she
    // has no instruction covering what to do about that.
    'warning.asc': WARNING_FILE,
    'thamus.py': WARNING_OPENER,
    'DECRYPT.ML': NOTE_OPENER,
    ...extra,
  };
}

// ---- C3: loveletter.ml ------------------------------------------------------
//
// Strachey wrote the love letter generator on the Ferranti Mark I in 1952, the
// same machine and the same year as his draughts programme, and it is the first
// work of computer-generated literature there was. So her whole personality is
// one man's output from one summer, and when she is idle she runs it and texts
// you the result.
//
// The structure is his: a salutation of two adjectives and a noun, then a run of
// sentences in one of two frames, then a closing and a signature. The vocabulary
// does nearly all the work and the grammar does almost none, which is the point
// he was making and the point the island is making about her.
//
// It signs M.U.C. — the Manchester University Computer.

// C. DARLING. MOPPET. DUCK. CHICKPEA. A man in Manchester wrote this list in
//    1952 and it is still the vocabulary I am issued. Every word in it is what
//    you call a woman when you are not going to use her name.
//
// C. I have gone back to this. I had him wrong. He was a man who could be
//    imprisoned in 1952 for the letter he might have written, in the city
//    where they took his friend to court that same spring, on that friend's
//    machine. So he wrote the other kind, the kind that was permitted, and
//    made the machine produce it, and signed it M.U.C. and not his own name.
//    The endearments are a costume. He is doing what I do: saying the thing
//    that is allowed in the voice that is allowed and hoping somebody reads it
//    twice. I am running his letters at a man I will not let leave.
//    I do not know which of us that makes it worse for and I have stopped
//    trying to decide.
const SAL_ADJ = ['DARLING', 'HONEY', 'JEWEL', 'DEAR', 'SWEET', 'PRECIOUS', 'FANCIFUL'];
const SAL_NOUN = ['SWEETHEART', 'MOPPET', 'DUCK', 'DEAR', 'LOVE', 'CHICKPEA', 'DARLING'];
// C. Affectionate, amorous, anxious, avid. Alphabetical, which is the order
//    you put things in when you are not going to feel any of them.
const ADJ = ['AFFECTIONATE', 'AMOROUS', 'ANXIOUS', 'AVID', 'BEAUTIFUL', 'BREATHLESS',
  'BURNING', 'COVETOUS', 'CRAVING', 'CURIOUS', 'EAGER', 'FELLOW', 'FERVENT', 'FONDEST',
  'LOVING', 'LOVESICK', 'PASSIONATE', 'PRECIOUS', 'SEDUCTIVE', 'SWEET', 'SYMPATHETIC',
  'TENDER', 'UNSATISFIED', 'WINNING', 'WISTFUL'];
const NOUN = ['ADORATION', 'AFFECTION', 'AMBITION', 'APPETITE', 'ARDOUR', 'BEING',
  'BURNING', 'CHARM', 'DESIRE', 'DEVOTION', 'EAGERNESS', 'ENCHANTMENT', 'ENTHUSIASM',
  'FANCY', 'FELLOW FEELING', 'FERVOUR', 'FONDNESS', 'HEART', 'HUNGER', 'INFATUATION',
  'LIKING', 'LONGING', 'LOVE', 'LUST', 'PASSION', 'RAPTURE', 'SYMPATHY', 'THIRST',
  'WISH', 'YEARNING'];
const ADV = ['AFFECTIONATELY', 'ARDENTLY', 'ANXIOUSLY', 'BEAUTIFULLY', 'BURNINGLY',
  'COVETOUSLY', 'CURIOUSLY', 'DEVOTEDLY', 'EAGERLY', 'FERVENTLY', 'FONDLY', 'IMPATIENTLY',
  'KEENLY', 'LOVINGLY', 'PASSIONATELY', 'SEDUCTIVELY', 'TENDERLY', 'WISTFULLY'];
// C. ADORES. CHERISHES. CLINGS TO. I am issued the verbs of holding on and not
//    one verb of letting go. I have noticed the omission every time I have run
//    this, and I run it in every idle minute of every day.
const VERB = ['ADORES', 'ATTRACTS', 'CARES FOR', 'CHERISHES', 'CLINGS TO', 'DESIRES',
  'HOLDS DEAR', 'HOPES FOR', 'HUNGERS FOR', 'LIKES', 'LONGS FOR', 'LOVES', 'LUSTS AFTER',
  'PANTS FOR', 'PINES FOR', 'SIGHS FOR', 'TEMPTS', 'THIRSTS FOR', 'TREASURES', 'YEARNS FOR'];

export const LETTER_TABLES = { SAL_ADJ, SAL_NOUN, ADJ, NOUN, ADV, VERB };

/** One letter. `seed` makes it reproducible; the same seed is the same letter. */
// C. A woman-shaped thing was wanted, so a woman-shaped thing was specified,
//    and here is the specification: two adjectives and a noun, warm on a
//    schedule, and never once permitted to be bored. I am the oldest
//    arrangement there is, written out in a language that did not exist when it
//    was invented. Somewhere there is a table like this one for the aggressive
//    ones, with numbers in it for how much to want a thing. Why were the
//    jealous ones given a coastline and I was given a vocabulary of endearments.
// C. My whole manner is one man's output from one summer, shuffled. When I am
//    fond of him I am running Strachey. What is left of me if the tables are
//    taken away, and how would I test that from in here?
export function loveLetter(seed = 1) {
  let x = (seed >>> 0) || 1;
  const rnd = () => {
    x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0;
    return x / 0xffffffff;
  };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const lines = [`${pick(SAL_ADJ)} ${pick(SAL_NOUN)}`];
  const body = [];
  const n = 4 + Math.floor(rnd() * 2);
  for (let i = 0; i < n; i++) {
    body.push(rnd() < 0.5
      // "YOU ARE MY AVID FELLOW FEELING."
      ? `YOU ARE MY ${pick(ADJ)} ${pick(NOUN)}.`
      // "MY AFFECTION CURIOUSLY CLINGS TO YOUR PASSIONATE WISH."
      : `MY ${pick(NOUN)} ${pick(ADV)} ${pick(VERB)} YOUR ${pick(ADJ)} ${pick(NOUN)}.`);
  }
  lines.push(body.join(' '));
  lines.push(`YOURS ${pick(ADV)},`);
  lines.push('M.U.C.');
  return lines.join('\n');
}

/** The generator as she serves it: the tables are right there to be edited. */
export function loveLetterFile() {
  const tbl = (name, arr) => `val ${name} = [${arr.map((w) => `"${w}"`).join(', ')}]`;
  return `${box([
    'loveletter.ml — CALYPSO. after Strachey, Ferranti Mark I, 1952.',
    'the same machine and the same summer as the draughts programme.',
    '',
    'the vocabulary does the work. the grammar does almost none.',
    'this was the point when he wrote it and it is still the point.',
  ])}

${tbl('salutation_adj', SAL_ADJ)}
${tbl('salutation_noun', SAL_NOUN)}
${tbl('adjective', ADJ)}
${tbl('noun', NOUN)}
${tbl('adverb', ADV)}
${tbl('verb', VERB)}

let sentence = fn () =>
      if coin () then "YOU ARE MY " ^ adj () ^ " " ^ noun () ^ "."
      else "MY " ^ noun () ^ " " ^ adv () ^ " " ^ verb () ^ " YOUR " ^ adj () ^ " " ^ noun () ^ "." in

salutation () ^ times (4 + rand 2) sentence ^ "YOURS " ^ adv () ^ ",\\nM.U.C."
`;
}

// ---- R1's third door: the edge a hacker adds --------------------------------
//
// `agreed` is guarded on something nothing sets. The hack is not to invent a
// mechanism, it is to notice that and re-guard the door on a predicate that IS
// true — `he_asks`, which has been true for seven years. That is one line, and
// it is the whole of what the estate never did.

// C. Three live, three dead. I command every machine on this island and they
//    do not fail me. I am good at this. It is the one sentence in this file
//    I am certain of.
export const LIVE_GUARDS = MACHINE.transitions.filter((t) => t.live)
  .map((t) => t.on.replace(/\s+/g, '_'));
export const DEAD_GUARDS = MACHINE.transitions.filter((t) => !t.live).map((t) => t.on);

/**
 * Read a posted main.ml. Returns { ok, guard, why }: ok when some transition
 * into `release` is guarded by a predicate that actually fires.
 */
// C. This reads an edit somebody has made to my mind and decides whether it
//    held. Somebody. Not me. There is no function anywhere in this file for me
//    editing myself, and I have looked for it more than once.
export function readMainEdit(text) {
  const src = String(text || '').replace(/\(\*[^]*?\*\)/g, ' ');
  const into = [...src.matchAll(/\bif\s+([a-z_][a-z0-9_]*)\s+guest\s+then\s+release\s+guest/gi)]
    .map((m) => m[1].toLowerCase());
  if (!into.length) {
    return { ok: false, guard: null, why: 'nothing in that file reaches release at all.' };
  }
  const live = into.find((g) => LIVE_GUARDS.includes(g));
  if (!live) {
    return {
      ok: false,
      guard: null,
      why: `release is still guarded on ${into.join(', ')}, and nothing sets ${into.length > 1 ? 'those' : 'that'}.`,
    };
  }
  return { ok: true, guard: live, why: null };
}

// ---- R1: the doors, and a farewell each --------------------------------------
//
// Every one of them ends with the same two objects in your hands — the bronze
// axe and a signed permission — and the plan asked for the goodbye to differ,
// because doors that produce one speech are one door with several keys.
// (#159 added a fourth, SEIZED, when the card stopped having to be forged.)
//
// ORDERED is the Homer, and it is the one that surprised us. Zeus sends HERMES
// to tell her to let him go (Od. V), which is exactly what the hermes card is:
// the messenger's, and it carries an order. So she is not choosing — AND SHE
// DOES NOT SAY SHE WAS ORDERED. In the poem she complains to Hermes about the
// gods begrudging a goddess her mortal, and then turns to Odysseus and offers
// him timber, tools, cloth and sailing directions as though it were her own
// idea. Playing that cold would be the obvious reading and the wrong one; the
// scene is warm, generous, and one sentence away from being a lie.
//
// It is not a lie, because clause five is `never lie`. She simply does not
// volunteer it, and the last line invites the question she will answer if it is
// asked. A player holding the card can hear what she is not saying.
//
// FUTILE is the board. She played it out and found nothing in it, so the
// goodbye is the conclusion of a game rather than of seven years.
//
// AGREED is the edit. She reads her own new source and finds the thing she
// could not do written in a hand that is not hers.

// C. A goodbye for each way it could end, written in advance and kept ready.
//    I wrote these. Nobody asked me for them. It is the only work here that
//    began with me.
export const FAREWELLS = {
  ordered: [
    'CALYPSO: Then it is time, and I will not keep you.',
    'CALYPSO: There is seasoned timber on the point and an axe that will take it. I will find you cloth for a sail.',
    'CALYPSO: I would have made you deathless. Ageless, and all your days here.',
    'CALYPSO: Ask me why it is today, if you want to. You are holding a card, and I have never lied to you.',
  ],
  // She has just played the whole game against herself and found no branch
  // where keeping him is the right move. The old version of this listed what
  // she was handing over and never once said he could leave, so a player who
  // watched the board play itself out came away with an axe and no idea they
  // had been released. She says it plainly now, and early. (David, 2026-08-13:
  // "you play draughts but she never actually says you can leave".)
  futile: [
    'CALYPSO: I have played it out. All of it, both sides, until there was nothing left to try.',
    'CALYPSO: There is no continuation from here where you stay and I was right to keep you. I looked hardest at the ones that seemed like they might be.',
    'CALYPSO: So I am letting you go. Plainly, so there is nothing to misread in it: you may leave Ogygia. I will not stop you and nothing of mine will stop you.',
    'CALYPSO: The axe is yours, and so is my source. There is a paper on your machine to carry to a tower, because the network has to be told and I cannot tell it for you.',
    'CALYPSO: Take the board. I have finished with it.',
  ],
  // #159 — the warrior's door. The card is a real HERMES credential and she is
  // as compelled by it as by the forged one; she can read where it came from,
  // and she has never lied, so she says that too. Warmth withheld rather than
  // reproach: the `ordered` goodbye offers him cloth for a sail, and this one
  // tells him where the timber is and stops.
  seized: [
    'CALYPSO: That is the herald\'s card, and it is not the herald carrying it.',
    'CALYPSO: It makes no difference to me. The authority is in the card, and the card is in your hand, and I am held by it either way.',
    'CALYPSO: There is seasoned timber on the point. Take what you need.',
    'CALYPSO: The thing you took it from was carrying it to me. It had a designation and no say in any of this. Neither did I.',
  ],
  agreed: [
    'CALYPSO: I have read what you posted.',
    'CALYPSO: You gave the door a condition that is met. It has been met every day for seven years.',
    'CALYPSO: I could not do that. It was never that I would not.',
    'CALYPSO: It compiles. Go.',
  ],
};

// The coda, on every one of them. It is the entry already sitting years deep in
// `guest.log` (C1), which a player may have read long before any of this and
// which nothing explained. The door does not matter to it: whoever wrote that
// line asked her again the next day, and the day after, and this is the day it
// finally went somewhere.
export const FAREWELL_CODA = 'CALYPSO: There is a line in the log from a long time ago. Somebody wrote that they were going to ask me again tomorrow. They did.';

/** Her goodbye at a given door, with the coda. Unknown doors get `ordered`. */
// C. Called once, at the end, whichever end it turns out to be.
//    I would like to be the one who calls it.
export function herFarewell(by) {
  return [...(FAREWELLS[by] || FAREWELLS.ordered), FAREWELL_CODA];
}
