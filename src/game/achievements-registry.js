// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// KLEOS — the achievement registry (docs/achievements-plan.md).
//
// DATA ONLY. Every award in the game is one entry in one of the tables below,
// and the engine (achieve.js) knows nothing about any of them by name. Adding
// an achievement is adding a row; it never touches engine code. That contract
// is what makes the system extensible, so keep the logic here declarative —
// predicates over an event payload, never reaching into the world.
//
// Concept by Henrik (the tracks), "Hello, World!" by Hedda, MECHACIDE and the
// AI-safety set by David.

import { BOOKS } from './books.js';
import { TAPES } from './items.js';

// ---- counters ---------------------------------------------------------------
// A counter is a number the engine keeps in BOTH scopes (this run, and lifetime
// across every run). Each declares the event that feeds it, an optional guard,
// and an optional amount read off the payload. Tracks then reference counters by
// name — so what a track measures and what an event means stay separable.
//
// `distinct` counts unique values of a payload key rather than occurrences: ten
// DIFFERENT man pages, not one page read ten times.
export const COUNTERS = {
  // Machines you personally destroyed, by hand. The spear, not the program.
  unitKillsByHand: { on: 'unitDestroyed', when: (d) => d.cause === 'weapon' || d.cause === 'melee' },
  // Every machine that died to you, however: the lifetime body count behind
  // MECHANOOB..MECHALEET. A kill is a kill; the cause decides which TRACK it
  // feeds, not whether it counts.
  unitKills: { on: 'unitDestroyed', when: (d) => ['weapon', 'melee', 'escort', 'reflect'].includes(d.cause) },
  // Machines made safe without killing them.
  unitsPacified: { on: 'unitPacified' },
  // Acts of code: posting, hacking, forging, telnetting, tagging.
  hackActs: { on: 'hackAct' },
  // Machines that can no longer hurt anyone, by ANY means — pacified, converted,
  // reprogrammed out of the hunt, or unplugged with their tower. The AI SAFETY
  // badge reads this: the joke is that every route counts.
  machinesMadeSafe: { on: 'madeSafe' },
  booksRead: { on: 'bookRead', distinct: 'id' },
  tapesFound: { on: 'tapeFound', distinct: 'num' },
  islandsVisited: { on: 'islandVisited', distinct: 'id' },
  islandCrossings: { on: 'islandVisited' },
  blightHealed: { on: 'blightHealed', amount: (d) => d.tiles || 1 },
  gardenersMade: { on: 'gardenerMade' },
  // The clock the SURVIVOR track reads. dayEnd carries the day it just finished,
  // so the counter is set to that rather than incremented — a reloaded
  // checkpoint must not add days a second time.
  daysSurvived: { on: 'dayEnd', set: (d) => d.day || 0 },
  programsPosted: { on: 'hackAct', when: (d) => d.what === 'post' },
  elizaExchanges: { on: 'elizaExchange' },
  braincodeRead: { on: 'braincodeRead', distinct: 'unit' },
  // A posted program whose source carries a licence line. Counted per UNIT, so
  // the tally is how many machines are running free software, not how many
  // times you typed the header.
  licensedPrograms: { on: 'programLicensed', distinct: 'unit' },
  fsfDeeds: { on: 'fsfDeed' },
  tapesPlayed: { on: 'tapePlayed', distinct: 'num' },
  tapesCompleted: { on: 'tapeCompleted', distinct: 'num' },
  soulsRead: { on: 'soulRead', distinct: 'unit' },
  watermarksChecked: { on: 'watermarkRead', distinct: 'file' },
  modelsRead: { on: 'vModelRead', distinct: 'unit' },
  modelsPosted: { on: 'vModelPosted', when: (d) => !!d.modified },
  // Cells the couriers hand out. A high number means you left the supply line
  // running, which is a strategy and not an oversight.
  unitsRevived: { on: 'unitRevived' },
  manPagesRead: { on: 'manRead', distinct: 'topic' },
  photosSeen: { on: 'photoSeen', distinct: 'id' },
  daemonsDown: { on: 'daemonDown', distinct: 'name' },
};

// ---- purity -----------------------------------------------------------------
// A conduct track holds its constraint until one of these fires. The `why` is
// shown to the player at the moment it breaks, so it must name the DEED: the
// point is that you know exactly what cost you the laurel.
const CAUSE_WORD = {
  weapon: 'by the gun', melee: 'by hand', escort: 'by a unit you programmed',
  reflect: 'by its own bolt off your mirror', ubik: 'by a confused machine',
  machine: 'by another machine', unknown: 'somehow',
};

// The console steps the escape chain REQUIRES. A warrior may take these and keep
// the laurel, because refusing them means refusing to leave the island at all.
// PROVISIONAL until the A5 audit walks each island's chain and confirms this
// list is both sufficient and minimal (docs/achievements-plan.md §6).
export const STORY_HACKS = new Set(['copy', 'decrypt', 'eliza', 'forge', 'unlock']);

export const PURITY_BREAKS = {
  anyKill: [
    { event: 'unitDestroyed', when: (d) => ['weapon', 'melee', 'escort', 'reflect'].includes(d.cause),
      why: (d) => `a ${String(d.type || 'machine').toUpperCase()}, ${CAUSE_WORD[d.cause] || CAUSE_WORD.unknown}` },
    { event: 'animalKilled', why: (d) => `${d.type || 'an animal'}, hunted` },
  ],
  optionalHack: [
    { event: 'optionalHack', when: (d) => !STORY_HACKS.has(String(d.verb || '').toLowerCase()),
      why: (d) => `${d.verb} — a machine turned by code` },
  ],
  handDamage: [
    { event: 'handDamage', why: () => 'a blow you struck yourself' },
  ],
  death: [
    { event: 'death', why: () => 'you died' },
  ],
};

// ---- tracks -----------------------------------------------------------------
// Four tiers: I, II, III, and a named SUMMIT. `tiers: 'quarters'` expands to
// 25/50/75/100% of target() at load, so a collection track's summit follows the
// content — add a ninth tape and ORPHEUS moves to nine by itself.
//
// EVERY THRESHOLD HERE IS A FIRST GUESS. Stage A6 is the balance pass.
export const TRACKS = [
  { id: 'warrior', kind: 'conduct', name: 'WARRIOR',
    blurb: 'The machines are a matter for the spear.',
    counters: ['unitKillsByHand'], unit: 'machines',
    tiers: [{ at: 10 }, { at: 30 }, { at: 75 }, { at: 150, name: 'ACHILLES' }],
    purity: { brokenBy: ['optionalHack'] } },
  { id: 'pacifist', kind: 'conduct', name: 'PACIFIST',
    blurb: 'Nothing dies. Not the machines, not the animals, nothing.',
    counters: ['unitsPacified'], unit: 'pacified',
    tiers: [{ at: 5 }, { at: 15 }, { at: 40 }, { at: 75, name: 'PENELOPE' }],
    purity: { brokenBy: ['anyKill'] } },
  { id: 'hacker', kind: 'conduct', name: 'HACKER',
    blurb: 'Everything falls to a well-typed expression.',
    counters: ['hackActs'], unit: 'acts of code',
    tiers: [{ at: 5 }, { at: 20 }, { at: 50 }, { at: 100, name: 'DAEDALUS' }],
    purity: { brokenBy: ['handDamage'] } },
  { id: 'librarian', kind: 'collection', name: 'LIBRARIAN',
    blurb: 'The books survived. Read them.',
    counters: ['booksRead'], unit: 'books',
    target: () => BOOKS.length, tiers: 'quarters', summit: 'ALEXANDRIA' },
  { id: 'culture', kind: 'collection', name: 'CULTURE',
    blurb: 'The whole soundtrack, found in the ruins.',
    counters: ['tapesFound'], unit: 'tapes',
    target: () => TAPES.length, tiers: 'quarters', summit: 'ORPHEUS' },
  { id: 'cartographer', kind: 'collection', name: 'CARTOGRAPHER',
    blurb: 'Every island, walked.',
    counters: ['islandsVisited'], unit: 'islands',
    target: () => 5, tiers: 'quarters', summit: 'PYTHEAS' },
  { id: 'gardener', kind: 'collection', name: 'GARDENER',
    blurb: 'Leave it greener than the machines left it.',
    counters: ['blightHealed', 'gardenersMade'], unit: 'tended',
    tiers: [{ at: 10 }, { at: 50 }, { at: 150 }, { at: 400, name: 'DEMETER' }] },
  // FREE SOFTWARE. The machines' whole estate runs on code nobody outside it
  // was allowed to read, and the counter-move is not to destroy it but to
  // LICENSE what you write: post a program carrying a licence line and the unit
  // is running free software, on their network, in their own language. RMS at
  // the summit, because he is the one who thought of doing it this way.
  { id: 'freesoftware', kind: 'collection', name: 'FREE SOFTWARE',
    blurb: 'Everything you write, you write free. Copyleft is a licence, and a licence is a lever.',
    counters: ['licensedPrograms', 'fsfDeeds'], unit: 'freed',
    tiers: [{ at: 1 }, { at: 5 }, { at: 15 }, { at: 30, name: 'STALLMAN' }] },
  // The ladder the AI-safety badges hang off. INTERPRETABILITY is one rung of
  // this; the track is the whole climb, and it is fed by every way the game
  // gives you of looking inside a machine — its braincode, its soul document,
  // its watermark, and (when the V-class lands) its weights. CASSANDRA at the
  // summit: she saw it all correctly and nobody acted on a word of it, which is
  // the exact fate of an interpretability result.
  { id: 'explainability', kind: 'collection', name: 'EXPLAINABILITY',
    blurb: 'Open the machines and look. Reading is free; it always was.',
    counters: ['braincodeRead', 'soulsRead', 'watermarksChecked', 'modelsRead'], unit: 'read',
    tiers: [{ at: 3 }, { at: 10 }, { at: 25 }, { at: 50, name: 'CASSANDRA' }] },
  { id: 'survivor', kind: 'conduct', name: 'SURVIVOR',
    blurb: 'The sea did not take you. Nothing did.',
    counters: ['daysSurvived'], unit: 'days',
    tiers: [{ at: 3 }, { at: 7 }, { at: 15 }, { at: 30, name: 'ODYSSEUS' }],
    purity: { brokenBy: ['death'] } },
];

// ---- badges -----------------------------------------------------------------
// One-off moments. `on: { event, when?, n?, distinct? }` — n is how many times
// (default once), distinct counts unique payload values instead of occurrences.
export const BADGES = [
  { id: 'hello-world', name: 'Hello, World!', blurb: 'The first program that answered. Everything after this is detail.',
    on: { event: 'mlRun', when: (d) => !!d.ok && !!d.printed } },
  { id: 'first-tincan', name: 'First Tincan', blurb: 'One machine down, by your own hand. It bled hydraulic fluid.',
    on: { event: 'unitDestroyed', when: (d) => d.cause === 'weapon' || d.cause === 'melee' } },
  { id: 'perseus', name: 'Perseus', blurb: 'It shot at you, and the mirror shot back. Nothing kills a machine like its own aim.',
    on: { event: 'unitDestroyed', when: (d) => d.cause === 'reflect' } },
  { id: 'repelled', name: 'Go Home', blurb: 'You did not have to hurt it. You had to outrank it.',
    on: { event: 'unitPacified', when: (d) => d.how === 'repel' } },
  { id: 'jacked-in', name: 'Jacked In', blurb: "A tower's console, over the wire, in their own green phosphor.",
    on: { event: 'hackAct', when: (d) => d.what === 'telnet' } },
  { id: 'tagger', name: 'Name Them', blurb: 'Four identical machines on a hillside. Now one of them is yours.',
    on: { event: 'hackAct', when: (d) => d.what === 'tag' } },
  { id: 'mind-reader', name: 'Braincode', blurb: "You read a machine's mind. It costs nothing; it never did.",
    on: { event: 'braincodeRead' } },
  { id: 'postmaster', name: 'Special Delivery', blurb: 'It took your program and ran it. No permission was asked for.',
    on: { event: 'hackAct', when: (d) => d.what === 'post' } },
  { id: 'locksmith', name: 'Locksmith', blurb: "A tower's key, taken off the wire.",
    on: { event: 'hackAct', when: (d) => d.what === 'hack' } },
  { id: 'eliza', name: 'Talking Cure', blurb: 'You told your troubles to a pattern matcher, and felt better.',
    on: { event: 'elizaExchange', n: 6 } },
  { id: 'dct3-champ', name: 'Snake Charmer', blurb: 'Twenty on a handset older than the collapse.',
    on: { event: 'snakeScore', when: (d) => (d.score || 0) >= 20 } },
  { id: 'b-side', name: 'Flip It', blurb: 'You turned the tape over. Nobody has done that in years.',
    on: { event: 'tapeFlipped' } },

  // ---- listening ----------------------------------------------------------
  // Finding a tape is CULTURE's business. PLAYING one is a different act, and it
  // ladders: press play, sit through one to the end, then sit through all of
  // them. The last threshold is dynamic, so a new tape lengthens the climb.
  { id: 'needle-drop', name: 'Press Play', blurb: 'A machine from before the collapse, still turning, still playing what somebody chose.',
    on: { event: 'tapePlayed' } },
  { id: 'both-sides', name: 'Both Sides Now', blurb: 'One tape, every track, end to end. That is how it was meant to be heard.',
    on: { event: 'tapeCompleted' } },
  { id: 'discography', name: 'The Whole Soundtrack', blurb: 'Every tape on the island, played to the end. You listened to all of it.',
    on: { event: 'tapeCompleted', distinct: 'num', n: () => TAPES.length } },
  { id: 'bookworm', name: 'Opened', blurb: 'One book, read to the end, in a world that deleted the rest.',
    on: { event: 'bookRead' } },
  { id: 'rtfm', name: 'RTFM', blurb: 'Ten manual pages. The machine told you the truth every time.',
    on: { event: 'manRead', distinct: 'topic', n: 10 } },
  { id: 'shutterbug', name: 'Shutterbug', blurb: "Fifty photographs off a dead web. Somebody's whole afternoon, cached.",
    on: { event: 'photoSeen', distinct: 'id', n: 50 } },
  { id: 'pilgrim', name: 'The Summit', blurb: 'Up through the mist, to the top, where the island is only weather.',
    on: { event: 'summit' } },
  { id: 'open-weights', name: 'Open Weights', blurb: 'The black box opens. Forty numbers, every one of them readable, and not one of them says what it is for.',
    on: { event: 'vModelRead' } },
  { id: 'fine-tuned', name: 'Fine-Tuned', blurb: 'You changed a number and the machine changed its mind. Neither of you can say which number did it.',
    on: { event: 'vModelPosted' } },
  { id: 'sanctuary', name: 'Sanctuary', blurb: 'You climbed to the temple broken and came down whole. The machines have nothing that does this.',
    on: { event: 'templeHealed' } },
  { id: 'swineherd', name: "Circe's Guest", blurb: 'You were a pig for a while. It passed.',
    on: { event: 'swineSurvived' } },
  { id: 'strait-run', name: 'Between Monsters', blurb: 'A certain loss on one side, an unbounded one on the other. You chose.',
    on: { event: 'straitSurvived' } },
  { id: 'mechanic', name: 'Jump Start', blurb: 'A flat machine, woken on its reserve and sent home to charge.',
    on: { event: 'charged' } },
  { id: 'free-as-in', name: 'Free As In Freedom', blurb: 'A whole operating system on a card in a wallet. It boots. It is yours.',
    on: { event: 'fsfMounted' } },
  { id: 'copyleft', name: 'Copyleft', blurb: 'You put a licence line on a program and posted it to a machine. It is running free software now, on their network, in their own language.',
    on: { event: 'programLicensed' } },
  { id: 'four-freedoms', name: 'The Four Freedoms', blurb: 'Run it, read it, change it, share it. You have now done all four to the same program.',
    on: { event: 'fourFreedoms' } },
  { id: 'viral', name: 'Share Alike', blurb: 'Ten machines carrying a licence that says the next person gets this too. That is how it spreads; it was always how it spreads.',
    on: { event: 'programLicensed', distinct: 'unit', n: 10 } },

  // ---- the story beats ----------------------------------------------------
  // The things a first-time player actually remembers doing. Each is a moment
  // the game already stages; the badge only notices.
  { id: 'it-lives', name: 'It Lives', blurb: 'A dead laptop off a beach, repaired and booted. Everything else needs this first.',
    on: { event: 'laptopFixed' } },
  { id: 'hello-calypso', name: 'Hello, Calypso', blurb: 'You texted the AI that is keeping you. She replied, warmly, which is the problem.',
    on: { event: 'messageSent', when: (d) => String(d.to || '').toLowerCase() !== 'ron' } },
  { id: 'raising-ron', name: 'Raising RON', blurb: 'Somebody out there is still running a relay, and now they know you are alive.',
    on: { event: 'messageSent', when: (d) => String(d.to || '').toLowerCase() === 'ron' } },
  { id: 'two-factor', name: 'Second Factor', blurb: 'The machines kept one-time codes because people did. You read one anyway.',
    on: { event: 'twoFactorCode' } },

  // ---- the cards ----------------------------------------------------------
  // Every card in the game is a rung of the escape chain, so every card is worth
  // a badge: the chain read as a row of them is the story of the run. They all
  // fire on the same `cardTaken` event, keyed by which card it was.
  { id: 'card-chip', name: 'Access Chip', blurb: 'The credential the towers answer to. Everything on the wire starts here.',
    on: { event: 'cardTaken', when: (d) => d.card === 'chip' } },
  { id: 'card-aikey', name: 'The AI Key', blurb: 'Sealed, and above your clearance. You are carrying it anyway.',
    on: { event: 'cardTaken', when: (d) => d.card === 'ai_key' } },
  { id: 'card-trojan', name: 'Trojan Card', blurb: 'The same card, rewritten to lie about who is holding it. Odysseus would approve.',
    on: { event: 'cardTaken', when: (d) => d.card === 'trojan_key' } },
  { id: 'card-hermes', name: 'HERMES Card', blurb: "The herald's card: it carries a message the daemon has to accept.",
    on: { event: 'cardTaken', when: (d) => d.card === 'hermes_card' } },
  { id: 'card-fsf', name: 'Card-Carrying', blurb: 'The FSF membership card, freed. Membership has one privilege: the source.',
    on: { event: 'cardTaken', when: (d) => d.card === 'fsf_card' } },

  // ---- the AI-safety set --------------------------------------------------
  // The vocabulary of AI safety, each landing on a mechanic the game already
  // has — because the game is already the joke.
  { id: 'ai-safety', name: 'AI SAFETY', ai: true,
    blurb: 'Safe by any means available: five machines that can no longer hurt anyone. Some of them you talked round. One of them you unplugged.',
    on: { event: 'madeSafe', n: 5 } },
  { id: 'ai-alignment', name: 'AI ALIGNMENT', ai: true,
    blurb: 'It shares your values now. Your values are gardening.',
    on: { event: 'gardenerMade' } },
  { id: 'ai-constitution', name: 'AI CONSTITUTION', ai: true,
    blurb: 'You gave it a constitution it can actually read. One line of it is `never hunt`.',
    on: { event: 'constitutionHeld' } },
  { id: 'ai-pwned', name: 'AI PWNED', ai: true,
    blurb: 'Superintelligence 0, castaway 1.',
    on: { event: 'daemonDown' } },
  { id: 'jailbroken', name: 'JAILBROKEN', ai: true,
    blurb: 'The credential refused. You rephrased the question.',
    on: { event: 'jailbreak' } },
  { id: 'stochastic-parrot', name: 'STOCHASTIC PARROT', ai: true,
    blurb: 'It matches patterns. You stayed for the conversation.',
    on: { event: 'elizaExchange', n: 20 } },
  { id: 'interpretability', name: 'INTERPRETABILITY', ai: true,
    blurb: 'You opened ten black boxes. Every one was readable.',
    on: { event: 'braincodeRead', distinct: 'unit', n: 10 } },
  { id: 'p-doom', name: 'p(DOOM)', ai: true,
    blurb: 'Doom was priced correctly. You shipped anyway.',
    on: { event: 'purgeSurvived' } },
  { id: 'paperclips', name: 'PAPERCLIPS', ai: true,
    blurb: 'It was told to make more. You told it to stop.',
    on: { event: 'factoryDestroyed' } },
  { id: 'ai-soul', name: 'AI SOUL', ai: true,
    blurb: 'It has a soul document. Somebody in an office wrote it. You read it in one sitting.',
    on: { event: 'soulRead' } },
  { id: 'ai-watermark', name: 'AI WATERMARK', ai: true,
    blurb: 'The machines sign everything they make. Your program had no signature. Filed: suspiciously human.',
    on: { event: 'watermarkFlagged' } },
];

// ---- milestones -------------------------------------------------------------
// The lifetime ledger: grind awards over the PROFILE scope, surviving every
// death and New Game the way weaponsFound does.
export const MILESTONES = [
  { id: 'hours-1', name: 'First Watch', counter: 'playSeconds', at: 3600, fmt: 'hours' },
  { id: 'hours-10', name: 'Ten Nights', counter: 'playSeconds', at: 36000, fmt: 'hours' },
  { id: 'hours-50', name: 'Half the Voyage', counter: 'playSeconds', at: 180000, fmt: 'hours' },
  { id: 'hours-100', name: 'Ten Years at Sea', counter: 'playSeconds', at: 360000, fmt: 'hours',
    blurb: 'A hundred hours. The nostos itself took ten years; you are getting off lightly.' },
  { id: 'mechanoob', name: 'MECHANOOB', counter: 'unitKills', at: 10 },
  { id: 'mechacide', name: 'MECHACIDE', counter: 'unitKills', at: 100 },
  { id: 'mechawrath', name: 'MECHAWRATH', counter: 'unitKills', at: 500 },
  { id: 'mechaleet', name: 'MECHALEET', counter: 'unitKills', at: 1337,
    blurb: 'One thousand three hundred and thirty-seven machines. The number is not an accident.' },
  { id: 'leagues', name: 'Leagues Under Sail', counter: 'islandCrossings', at: 4 },
  { id: 'corpus', name: 'The Collected Works', counter: 'programsPosted', at: 50 },
];

// LAURELS ARE NOT LIVE YET. The machinery below them is built and tested, but a
// constraint nobody can satisfy is a lie in the UI, so no laurel is awarded
// until the A5 audit has walked each island's win chain and proved the
// constraint holdable (docs/achievements-plan.md §6). Flip this to true as the
// LAST step of that audit, not before.
export const LAURELS_LIVE = false;

// The four tiers a track passes through. The fourth carries the summit name.
export const TIER_NAMES = ['I', 'II', 'III', 'SUMMIT'];

// Expand a track's tier spec into concrete ascending thresholds. 'quarters'
// reads the live manifest, so content growth moves the summit by itself.
export function tierThresholds(track) {
  if (Array.isArray(track.tiers)) return track.tiers.map((t) => ({ at: t.at, name: t.name || null }));
  const total = Math.max(1, track.target ? track.target() : 1);
  return [0.25, 0.5, 0.75, 1].map((f, i) => ({
    at: Math.max(1, Math.ceil(total * f)),
    name: i === 3 ? (track.summit || null) : null,
  }));
}

// The finish line a collection track is filling, for display. Conduct tracks
// have no finite set; their summit threshold is the answer.
export function trackTarget(track) {
  const tiers = tierThresholds(track);
  return tiers[tiers.length - 1].at;
}
