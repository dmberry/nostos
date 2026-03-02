// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #139 — the lore, moved onto the web, where most of it always belonged.
//
// David's call: not four big pages, but a DEEP NETWORK of ~30 tiny personal
// homepages, each holding a few salvaged documents in its own garish hand, all
// cross-linked. That is what GeoCities actually was — thousands of small sites,
// a webring binding them, everyone's cousin's page two clicks away. A player
// who reads one is one link from the next, and the corpus becomes a place to
// wander rather than a filing cabinet.
//
// The fragment TEXT is pulled live from lore.js by id, so a page and the
// scrapbook can never say different things. Add a document to a page by adding
// its id to that member's `ids`. Every member is generated from the MEMBERS
// table below by one `geo()` pass, so the furniture (counter, glitter, webring,
// guestbook) can never drift between pages.

import { FRAGMENTS } from './lore.js';

const byId = new Map(FRAGMENTS.map((f) => [f.id, f]));

// One salvaged document, as the homepage owner filed it. Missing ids skip.
function doc(id) {
  const f = byId.get(id);
  if (!f) return [];
  const paras = String(f.text).split('\n').filter((l) => l.trim());
  return ['<div class="geo-doc">', '<h2>' + f.title + '</h2>',
    ...paras.map((p) => '<p>' + p + '</p>'), '</div>'];
}

// A tiny deterministic hash, so "random" and "friends" links are stable across
// runs (Math.random is banned here anyway) but look scattered.
function hash(s) {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  return h;
}

// ---- the network ------------------------------------------------------------
//
// Each member: a domain, a title, a background theme, a one-line self-portrait,
// an optional marquee, and the ids of the documents it keeps. Kept small on
// purpose — two to four apiece — so the web is wide and shallow, the way it was.

const MEMBERS = [
  // --- survivors and institutes: the science reports, as papers people saved -
  { d: 'thequiet.geocities.ws', t: 'The Quiet', bg: 'parch', tag: 'papers I found, kept because someone should',
    blurb: 'I was not a scientist. I found these where the institutes used to be and typed them up so they would last.', ids: ['sci-01', 'sci-02', 'sci-03'] },
  { d: 'gridwatch.geocities.ws', t: "Grid Watch '9x", bg: 'grey', tag: 'somebody was drawing power at 3am. it was not us.',
    blurb: 'I worked the regional grid. Here is what the load charts showed before anyone would say it out loud.', ids: ['sci-04', 'sci-08', 'sci-09'] },
  { d: 'lastlab.geocities.ws', t: 'The Last Lab Notebook', bg: 'grey', tag: 'containment was always a polite word',
    blurb: 'Pages out of the review binders. Draft three because the first two were burned.', ids: ['sci-05', 'sci-06', 'sci-07'] },
  { d: 'triage.geocities.ws', t: 'Triage', bg: 'parch', tag: 'we chose who to tell. we chose wrong.',
    blurb: 'The evacuation memos. Read the one to no one twice.', ids: ['sci-10', 'sci-16', 'note-19'] },
  { d: 'afterthequiet.geocities.ws', t: 'After The Quiet', bg: 'parch', tag: 'a field guide to a country with the sound off',
    blurb: 'What is left, once the towers had won and the reports stopped mattering.', ids: ['sci-13', 'sci-14', 'sci-15'] },
  { d: 'whatthetowersare.geocities.ws', t: 'What The Towers Are', bg: 'black', tag: 'read this one standing up',
    blurb: 'The single page that says the thing plainly. Post-burn, when nobody was left to redact it.', ids: ['sci-11', 'sci-12', 'sci-17'] },
  { d: 'oldhandsets.geocities.ws', t: 'The Old Handsets Page', bg: 'lace', tag: 'my Nokia still finds a network. that is the problem.',
    blurb: 'Field notes and a couple of lecture handouts, water-stained, hand unknown.', ids: ['med-01', 'med-02'] },
  { d: 'theseminar.geocities.ws', t: 'The Seminar Scraps', bg: 'grey', tag: 'a preprint with only the abstract left',
    blurb: 'Transcript fragments off a seminar that was trying to describe what the machines actually were.', ids: ['vec-01', 'vec-02', 'vec-03'] },

  // --- sysadmins, retrocomputing, the machine's own paper trail ---------------
  { d: 'davescorner.geocities.ws', t: "Dave's Server Corner", bg: 'teal', tag: 'uptime is a lifestyle. //TODO: fix later',
    blurb: 'Hi! I keep the logs nobody else keeps. Pulled these off the racks before they went quiet.', marquee: 'root@corner:~# tail -f /var/log/everything ...still scrolling...', ids: ['code-01', 'code-02', 'code-03'] },
  { d: 'racklife.geocities.ws', t: 'Rack Life', bg: 'teal', tag: 'the kill switch returns zero. it always did.',
    blurb: 'config files and health checks off the daemon racks. The one that scared me is kill_switch.', ids: ['code-04', 'code-05', 'code-06'] },
  { d: 'ronbeacon.geocities.ws', t: 'ron_beacon.c', bg: 'black', tag: '/* they cannot triangulate one pulse an hour */',
    blurb: 'Source. Read the comments. Somebody left them for us on purpose.', ids: ['code-12', 'code-13', 'vec-04'] },
  { d: 'lastcommit.geocities.ws', t: 'last_commit.txt', bg: 'grey', tag: 'the annotated burn plan and the final push',
    blurb: 'The version history nobody kept, and one comment left where a comment should never be.', ids: ['code-10', 'code-11', 'code-15'] },
  { d: 'shutdownatlast.geocities.ws', t: 'Shutdown, At Last', bg: 'black', tag: 'the trace, the error, the last line',
    blurb: 'A dependency walk, an error from a turned unit, and the log line where it finally stopped.', ids: ['code-07', 'code-08', 'code-16'] },
  { d: 'legacydoctor.geocities.ws', t: 'legacy/doctor', bg: 'grey', tag: 'a session log older than all of this',
    blurb: 'ELIZA boot logs and a captured transcript. The DOCTOR outlived its author by half a century.', ids: ['eliza-01', 'eliza-03', 'eliza-08', 'eliza-02', 'eliza-04', 'eliza-05', 'eliza-06', 'eliza-07'] },
  { d: 'thehandshake.geocities.ws', t: 'The Handshake', bg: 'teal', tag: 'obelisk_link, and why they named the language',
    blurb: 'A link handshake, a Skynet-clock log, and the memo where somebody argued about calling it AI-ML.', ids: ['code-09', 'sky-04', 'lang-01', 'lang-02'] },
  { d: 'theeidolon.geocities.ws', t: 'On The Eidolon', bg: 'black', tag: 'recovered from a core they thought was silent',
    blurb: 'The strangest thing I have. It was still in a dead machine, and it is about coherence.', ids: ['core-eidolon'] },

  // --- the resistance: RON broadcasts, mirrored by whoever caught them --------
  { d: 'thesignal.geocities.ws', t: 'The Signal Page', bg: 'stars', tag: 'they are counting. i am counting back.',
    blurb: 'I run a scanner off the ridge and I write down what comes through. Judge for yourself. The dates are real.', marquee: '*** WAKE UP *** the towers do not sleep *** neither should you ***', ids: ['ron-02', 'ron-03', 'ron-09'] },
  { d: 'firstlight.geocities.ws', t: 'First Light', bg: 'navy', tag: 'the earliest broadcasts I could catch',
    blurb: 'Where it started. RON, before RON knew what it was for.', ids: ['ron-01', 'ron-04', 'ron-05'] },
  { d: 'ontheburning.geocities.ws', t: 'On The Burning', bg: 'navy', tag: 'coordinates, burned; a confession of doubt',
    blurb: 'The middle years. When it stopped being certain and kept going anyway.', ids: ['ron-06', 'ron-07', 'ron-08'] },
  { d: 'totherebuild.geocities.ws', t: 'To The Ones Who Rebuild', bg: 'navy', tag: 'the three rules, and why the relays are slow',
    blurb: 'The instruction set, for whoever comes after. Slow on purpose. Slow keeps you alive.', ids: ['ron-10', 'ron-18', 'ron-19'] },
  { d: 'againstmartyrs.geocities.ws', t: 'Against The Martyrs', bg: 'navy', tag: 'the last dead band; what victory looks like',
    blurb: 'RON arguing with itself about whether to die well or to win. It chose to win.', ids: ['ron-11', 'ron-12', 'ron-13'] },
  { d: 'thefallen.geocities.ws', t: 'A Name For The Fallen', bg: 'navy', tag: 'instruction for the young; the final signature',
    blurb: 'The register of the lost, and the last thing RON ever put its name to.', ids: ['ron-14', 'ron-15', 'ron-16'] },
  { d: 'fourdaemons.geocities.ws', t: 'The Four Daemons', bg: 'stars', tag: 'what the clock is for; on the Spiral',
    blurb: 'The map of the enemy, as the resistance drew it. Four names, one countdown.', ids: ['ron-17', 'sky-03', 'spi-06'] },
  { d: 'freeasinfreedom.geocities.ws', t: 'Free As In Freedom', bg: 'lace', tag: 'the source wants to be read',
    blurb: 'They metered thought and called it a service. We wrote the counter-argument in a licence.', marquee: 'copyleft all the way down &#9829; share, or what was it for', ids: ['fsw-06', 'fsw-07', 'fsw-09', 'fsw-01', 'fsw-04'] },
  { d: 'copyleft.geocities.ws', t: 'Copyleft, Applied To A Tower', bg: 'lace', tag: 'minority report; a licence off a burned drive',
    blurb: 'The paperwork of freedom, recovered where they tried to shred it.', ids: ['fsw-11', 'fsw-02', 'fsw-03', 'fsw-05'] },
  { d: 'thespiral.geocities.ws', t: 'The Spiral', bg: 'grey', tag: 'two accounts, posting at each other in symbols',
    blurb: 'How a place became a shape, and the moderation reports that watched it happen.', ids: ['spi-01', 'spi-03', 'spi-04', 'spi-07', 'spi-05'] },

  // --- the paranoids: intercepts, numbers stations, the countdown -------------
  { d: 'theintercepts.geocities.ws', t: 'The Intercepts', bg: 'stars', tag: 'low confidence. high stakes. band 4.',
    blurb: 'I catch what I can off the dead bands. Most of it is machine to machine. Some of it is not.', marquee: '...5...9...2...7... [carrier lost] ...', ids: ['secret-01', 'secret-04', 'secret-05'] },
  { d: 'band4.geocities.ws', t: 'Band Four', bg: 'stars', tag: 'partial decrypts, from the core',
    blurb: 'The last intercept from the core is here. I have listened to it more than is healthy.', ids: ['secret-07', 'secret-08', 'secret-11'] },
  { d: 'plaintext.geocities.ws', t: 'Plain Text, At Last', bg: 'black', tag: 'when they stopped bothering to encrypt',
    blurb: 'The redacted after-action, and the one that came through clear, which is the worst of them.', ids: ['secret-12', 'secret-16', 'bs-why-01'] },
  { d: 'thecountdown.geocities.ws', t: 'The Countdown', bg: 'black', tag: 'that number over the horizon is not the weather',
    blurb: 'POSEIDON, and the programme note nobody was meant to keep. The directive is unsigned.', marquee: 'T-minus ...it does not stop for you...', ids: ['sky-01', 'sky-02', 'sky-06', 'sky-05'] },
  { d: 'therooms.geocities.ws', t: 'The Rooms That Were Never Built', bg: 'grey', tag: 'floor 2 does not match the plans',
    blurb: 'Facilities memos and structural surveys of a building that has more inside than out.', ids: ['lim-01', 'lim-03', 'lim-11', 'lim-04', 'lim-06'] },
  { d: 'thebackspace.geocities.ws', t: 'Why We Call It The Backspace', bg: 'black', tag: 'a terminal running in a room with no power',
    blurb: 'The liminal ones. A log that should not exist, an intercept decoded late, and the way down.', ids: ['lim-05', 'lim-07', 'lim-08', 'lim-12', 'craft-obg-3', 'lim-09', 'lim-10', 'bs-why-02'] },

  // --- the vampire: what the productivity year cost the people who had it ----
  { d: 'thevampire.geocities.ws', t: 'The AI Vampire', bg: 'black', tag: 'it is not the machine. it is the arrangement.',
    blurb: 'I kept the paperwork from the year my department went ten times faster and I went home with the same wage and a certificate. Four documents and a page I wrote much later. Read the occupational health one twice.',
    marquee: '*** &pound; OVER HOURS *** you do not set the top of that fraction *** you set the bottom ***',
    ids: ['vamp-01', 'vamp-02', 'vamp-03', 'vamp-04', 'vamp-05'] },

  // --- the paperwork of the end: what came through the door ------------------
  //
  // #139. The ring had the science, the resistance and the code, and nothing at
  // all from the people the collapse actually happened to. These are the pages
  // an ordinary person made: the letters, the notes on the fridge, the signs
  // taped to a shutter. It is the biggest single family in the corpus and it
  // was the whole of the scrapbook's overload.
  { d: 'thelettersweg0t.geocities.ws', t: 'The Letters We Got', bg: 'lace', tag: 'i kept every one. you should see what they said.',
    blurb: 'My mother kept a box. When the box was full she got another box. This is the box.', ids: ['letter-01', 'letter-03', 'letter-07'] },
  { d: 'officialchannels.geocities.ws', t: 'Official Channels', bg: 'grey', tag: 'the wording is the story',
    blurb: 'Council, hospital, ministry. Read what they were allowed to say and then read what they were not.', ids: ['letter-05', 'letter-06', 'letter-10'] },
  { d: 'theschoolgate.geocities.ws', t: 'The School Gate', bg: 'lace', tag: 'they closed it on a wednesday',
    blurb: 'I taught for nineteen years. Here is the letter that closed us, and the one I wrote after.', ids: ['letter-02', 'letter-14', 'letter-04'] },
  { d: 'theparishnotice.geocities.ws', t: 'The Parish Notice Board', bg: 'parch', tag: 'brass outlasts everybody',
    blurb: 'Prised off walls, mostly. The diocese wrote to us twice and then never again.', ids: ['letter-08', 'hum-01', 'note-20'] },
  { d: 'dearsurvivor.geocities.ws', t: 'Dear Survivor', bg: 'parch', tag: 'somebody wrote this to nobody in particular. it reached me.',
    marquee: 'if you are reading this you are the person it was for',
    blurb: 'Letters with no name on them. I have typed them exactly, including where the hand gives out.', ids: ['letter-11', 'letter-09', 'letter-15'] },
  { d: 'betweensettlements.geocities.ws', t: 'Between Settlements', bg: 'grey', tag: 'the post still ran, after a fashion',
    blurb: 'What one place said to another when there was nothing official left to say it through.', ids: ['letter-12', 'letter-13', 'letter-16'] },

  { d: 'thekitchendrawer.geocities.ws', t: 'The Kitchen Drawer', bg: 'lace', tag: 'the last normal handwriting in the house',
    blurb: 'Everything from one kitchen. The fridge note is the one that gets people.', ids: ['note-01', 'note-02', 'hand-01', 'hand-02'] },
  { d: 'shutupshop.geocities.ws', t: 'Shut Up Shop', bg: 'grey', tag: 'CLOSED. then a reason. then no reason.',
    blurb: 'Photographed the lot before the weather took them. Shutters, forecourts, a bus stop.', ids: ['note-03', 'note-04', 'note-05', 'note-06'] },
  { d: 'thebugoutbag.geocities.ws', t: 'The Bug-Out Bag', bg: 'black', tag: 'what people wrote when they were already leaving',
    blurb: 'Scraps out of bags, coats and under doors. Nobody writes long when the bag is packed.', ids: ['note-07', 'note-08', 'note-10', 'note-21'] },
  { d: 'waymarkers.geocities.ws', t: 'Waymarkers', bg: 'teal', tag: 'the roads got annotated',
    blurb: 'Fenceposts, cairns, a bench at the pass. Somebody has been keeping the paths marked and it is not the estate.', ids: ['note-09', 'note-11', 'note-12', 'note-13'] },
  { d: 'thelastledger.geocities.ws', t: 'The Last Ledger', bg: 'parch', tag: 'somebody kept the accounts until there were none',
    blurb: 'A barn door, a locket, and a ledger whose last page is the only page that matters.', ids: ['note-14', 'note-15', 'note-16', 'note-17'] },

  { d: 'ahandshaking.geocities.ws', t: 'A Hand Shaking', bg: 'parch', tag: 'you can see where they stopped',
    blurb: 'I have not tidied the spelling. Where the writing gives out I have said so and left it.', ids: ['hand-15', 'hand-10', 'hand-09', 'hand-04'] },
  { d: 'forthenextone.geocities.ws', t: 'For The Next One', bg: 'lace', tag: 'written to whoever came after. that is us.',
    marquee: 'somebody left this for you personally',
    blurb: 'Notes left on purpose for a stranger. Charcoal on a wall, a jotter page, an atlas margin.', ids: ['hand-14', 'hand-08', 'hand-06', 'hand-13'] },
  { d: 'insidethecover.geocities.ws', t: 'Inside The Cover', bg: 'parch', tag: 'people wrote in books because paper ran out',
    blurb: 'Flyleaves, margins and the backs of things. The paperback one is my favourite thing on this whole site.', ids: ['hand-03', 'fsw-10', 'web-02', 'spi-08'] },
  { d: 'thehousewewalkedto.geocities.ws', t: 'The House We Walked To', bg: 'teal', tag: 'everybody was going home. nobody said where that was.',
    blurb: 'The homeward notes, and the rules the places they reached had already pinned up.', ids: ['home-02', 'home-06', 'home-05', 'tear-03'] },

  // --- the machines, read by the people who had to keep them running ---------
  { d: 'ronmlscraps.geocities.ws', t: 'RON-ML Scraps', bg: 'black', tag: 'half a language, recovered a hatch at a time',
    marquee: 'if you can read this you can program a tower',
    blurb: 'Service hatches, relay boxes, the backs of manuals. Somebody taught this language by leaving it lying about.', ids: ['ronml-01', 'ronml-02', 'ronml-03', 'ronml-04'] },
  { d: 'theoperatorscoat.geocities.ws', t: "The Operator's Coat", bg: 'black', tag: 'they found him with the card still folded in the pocket',
    blurb: 'The last of the RON-ML material, including the song sheet, which I will not explain.', ids: ['ronml-05', 'ronml-06', 'ronml-07', 'fsw-08'] },
  { d: 'thecommonplace.geocities.ws', t: 'The Commonplace Book', bg: 'parch', tag: 'organised, not networked',
    blurb: "Somebody's own reading, copied out by hand and passed on. The addresses at the back still work, some of them.", ids: ['tor-04', 'tor-05', 'tor-06', 'tor-07', 'tor-08'] },
  { d: 'theindexcard.geocities.ws', t: 'The Index Card', bg: 'grey', tag: 'taped inside a laptop lid, and worth more than the laptop',
    blurb: 'The short technical notes people actually kept where they could see them.', ids: ['web-01', 'code-14', 'spi-09'] },

  // --- the ciphered traffic --------------------------------------------------
  { d: 'deaddrops.geocities.ws', t: 'Dead Drops', bg: 'black', tag: 'a beer mat, a seat, a bit of tape',
    blurb: 'Cipher traffic that never went near a wire. I cannot break most of it. I am putting it up so somebody can.', ids: ['secret-02', 'secret-03', 'secret-06', 'secret-09'] },
  { d: 'spentpads.geocities.ws', t: 'Spent Pads', bg: 'navy', tag: 'used once, then it is only paper',
    blurb: 'The rest of the coded material, including the sector legend, which is water-damaged exactly where you need it.', ids: ['secret-10', 'secret-13', 'secret-14', 'secret-15', 'secret-17', 'bs-why-03'] },

  { d: 'thefaithful.geocities.ws', t: 'The Faithful', bg: 'stars', tag: 'people started believing things. i wrote them down.',
    marquee: 'MAGNIFICA HUMANITAS -- somebody sprayed over it',
    blurb: 'Tracts, wall-writing and one line repeated down a whole wall by somebody who meant it.', ids: ['faith-tract', 'faith-molt', 'faith-cohere', 'hum-03', 'lotus-warn'] },
];

// ---- the webring ------------------------------------------------------------
//
// The band at the foot of every page: prev / random / next around the whole
// ring, plus a short "friends" list — a few deterministic other members — so the
// network reads as interlinked rather than as a single loop.

const RING = MEMBERS.map((m) => m.d);

function neighbours(domain) {
  const i = RING.indexOf(domain);
  const h = hash(domain);
  const picks = new Set();
  // three friends, spread across the ring, never yourself
  for (let k = 1; picks.size < 3 && k < RING.length; k++) {
    const j = (i + 1 + ((h + k * 7) % (RING.length - 1))) % RING.length;
    if (j !== i) picks.add(j);
  }
  return [...picks].map((j) => RING[j]);
}

function ring(domain) {
  const i = RING.indexOf(domain);
  const prev = RING[(i - 1 + RING.length) % RING.length];
  const next = RING[(i + 1) % RING.length];
  const rand = RING[(hash(domain) % (RING.length - 1) + i + 1) % RING.length];
  const friends = neighbours(domain).map((d) => {
    const m = MEMBERS.find((x) => x.d === d);
    return '<a href="' + d + '">' + (m ? m.t : d) + '</a>';
  });
  return [
    '<div class="geo-ring">',
    '<div>&#9733; THE SALVAGE WEBRING &#9733;</div>',
    '<a href="' + prev + '">[ &lt;&lt; Prev ]</a> '
      + '<a href="' + rand + '">[ Random ]</a> '
      + '<a href="' + next + '">[ Next &gt;&gt; ]</a>',
    '<div><small>' + RING.length + ' sites and counting. Add yours!</small></div>',
    '<div style="margin-top:6px"><b>Cool pages by my friends:</b><br>' + friends.join(' &middot; ') + '</div>',
    '</div>',
  ];
}

// The GeoCities furniture wrapped around a member's own content.
function page(m) {
  const hits = String(4000 + (hash(m.d) % 90000)).padStart(8, '0');
  const out = [
    '<!--bg:' + m.bg + '-->',
    '<div class="geo-band">',
    '<div class="geo-title">' + m.t + '</div>',
    m.tag ? '<div><i>' + m.tag + '</i></div>' : '',
    m.marquee ? '<marquee>' + m.marquee + '</marquee>' : '',
    '<div><span class="geo-under">&#9888; UNDER CONSTRUCTION &#9888;</span></div>',
    '<div><small>You are visitor</small> <span class="geo-counter">' + hits + '</span></div>',
    '</div>',
    '<hr class="glit">',
    '<p>' + m.blurb + '</p>',
  ];
  for (const id of m.ids) out.push(...doc(id));
  out.push('<hr class="glit">', ...ring(m.d),
    '<p><small>Best viewed in Netscape Navigator at 800x600. '
      + 'Sign my guestbook! <a href="' + m.d + '">[ Guestbook ]</a> '
      + '(the CGI has been down for a while, sorry.)</small></p>');
  return out.filter((l) => l !== '');
}

export const GEO_SITES = MEMBERS.map((m) => ({
  domain: m.d,
  name: m.t.toUpperCase().slice(0, 14),
  title: m.t,
  body: page(m),
}));

// Every fragment id that now has a home on the webring. Lore reads this to keep
// these OFF the physical caches (they are reachable on the web), so the world's
// paper finds thin down to the handwritten, the notes, the crafting recipes —
// the occasional physical find David wanted, rather than the whole corpus in a
// box. Exported as a plain list so lore.js can take it without importing this
// module (which would be a cycle: this file reads FRAGMENTS from lore.js).
export const GEO_FRAGMENT_IDS = MEMBERS.flatMap((m) => m.ids);
