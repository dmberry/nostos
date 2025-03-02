// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The Nokia 3310 — Calypso's channel to you on Ogygia (docs/calypso-nokia-plan.md).
//
// She does not attack you. The machines roaming the island are POSEIDON's; Calypso
// is the keeper who wants you to stay and cannot bear his things to kill you — a
// dead guest cannot be kept. So she texts: warnings about his robots, tips for
// surviving them, and always, underneath, a reason to stay. The help IS the trap.
// When her hold on you is high she reaches out and freezes one of his machines
// mid-stride (her indigo over his amber); when you make for the ship, that hold —
// and her protection — drains away. Her care is real, and it is a leash.
//
// This module is PURE state + data: a toast queue (createNokia) the HUD reads, the
// message tables (NOKIA_MESSAGES), and the hold bookkeeping. No DOM, no audio —
// main.js drives the triggers, the SMS beep, and the interventions.

export const HOLD_INIT = 0.65;   // seven years kept: you begin already held
export const HOLD_WARM = 0.70;   // at/above: she protects you, generously
export const HOLD_COLD = 0.40;   // below: she will not intervene at all

// Her hold band → the key the tiered message tables switch on.
export function holdBand(hold) {
  return hold >= HOLD_WARM ? 'warm' : hold >= HOLD_COLD ? 'wary' : 'cold';
}

// Gradient bookkeeping. Her hold on you IS her protection of you.
export function holdRise(player, amt) { player.calypsoHold = Math.min(1, (player.calypsoHold ?? HOLD_INIT) + amt); }
export function holdFall(player, amt) { player.calypsoHold = Math.max(0, (player.calypsoHold ?? HOLD_INIT) - amt); }

// The toast queue. `current` is what the LCD shows; `justShown` is true only on the
// frame a new text appears (main.js plays the SMS beep then). Landfall fires a
// cluster of events at once, so texts queue and play out one at a time with a gap.
export function createNokia() {
  const queue = [];
  let current = null;
  let justShown = false;
  let gap = 0;
  const MIN_GAP = 0.5;   // beat between consecutive texts
  const ttlFor = (lines) => {
    const chars = lines.join(' ').length;
    return Math.max(5, Math.min(12, 3.5 + chars / 16));  // longer texts linger longer
  };
  return {
    enqueue(header, lines) { queue.push({ header, lines }); },
    tick(dt) {
      justShown = false;
      if (current) {
        current.ttl -= dt;
        if (current.ttl <= 0) { current = null; gap = MIN_GAP; }
        return;
      }
      if (gap > 0) { gap -= dt; return; }
      if (queue.length) {
        const t = queue.shift();
        const total = ttlFor(t.lines);
        current = { header: t.header, lines: t.lines, ttl: total, total };
        justShown = true;
      }
    },
    get current() { return current; },
    get justShown() { return justShown; },
    get pending() { return queue.length; },
    clear() { queue.length = 0; current = null; gap = 0; },
    // Tapped: let it go. Not an instant cut — the ttl is pulled down to the
    // tail of its own fade-out, so it dims away in a beat instead of
    // vanishing mid-sentence. A message already fading is left alone.
    hurry(t = 0.22) { if (current && current.ttl > t) current.ttl = t; return !!current; },
  };
}

// The message tables. Each entry: { once?, header?, lines }. `lines` is an array,
// or a function (ctx) => array where ctx = { band, player } — for texts whose tone
// shifts with her hold. Header defaults to 'CALYPSO'. She is a goddess: full
// sentences, perfect punctuation, on an 84×48 green screen. That collision is the
// point. DRAFT COPY — flagged for David's voice pass before it is canon.
export const NOKIA_MESSAGES = {
  landfall: {
    once: true,
    lines: [
      'You are awake.',
      'There are machines on the island tonight — his, not mine.',
      'Keep to the light, and they will not find you. I will watch.',
    ],
  },
  firstHostile: {
    once: true,
    lines: [
      'One of his is close. Do you see it?',
      'You do not have to fight everything, love. You can simply not be seen.',
    ],
  },
  firstWeapon: {
    once: true,
    lines: [
      'You found something with an edge.',
      'It will do, against his tin. Though nothing out there is worth the reaching.',
    ],
  },
  firstRest: {
    once: true,
    lines: (ctx) => (ctx.band === 'cold'
      ? ['You sleep, still. Good. Even now, some part of you wants to stay.']
      : ['Good. Sleep.', 'Nothing out there is worth what it costs to reach it, and everything here is already yours.']),
  },
  nightfall: {
    once: true,
    lines: ['Night. His machines see better in it than you do — but the years are soft here, and long. Wait for light.'],
  },
  lowHP: {
    once: true,
    lines: ['You are hurt. Come back to the house. I can keep you whole here, and no one asks anything of you.'],
  },
  firstObelisk: {
    once: true,
    // SHE NAMES THE TERMINAL. A player who does not know the towers can be
    // talked to walks past every one of them, and the console is most of the
    // game. She is not being helpful, exactly — she would rather you left them
    // alone — but she tells you, because she tells you everything.
    lines: [
      'That tower is one of his eyes. It will call the others if it wakes.',
      'There is a screen on the side of it, love. They talk to each other through those, and they will talk to you, if you have a chip to put in.',
      'Pass it, or put it out — but quietly.',
    ],
  },
  boatCrafted: {
    once: true,
    lines: (ctx) => (ctx.band === 'warm'
      ? ['A raft. You built a raft.', 'It will not hold against the sea, and the sea is his. Stay. Please.']
      : ['You built a raft. It will not carry you past him. You know this. Stay.']),
  },
  axeGranted: {
    once: true,
    lines: ['So. You have my axe, and my leave, and the shape of a ship in your head. I gave them to you. I do not know why I always do.'],
  },
  shipCrafted: {
    once: true,
    lines: (ctx) => (ctx.band === 'cold'
      ? ['I can see it from the hill. It is well made. You were always going to be good at leaving.']
      : ['You have finished the ship.', 'It is beautiful, and it is the end of us. I will not stop you. I never could.']),
  },
  boardDepart: {
    lines: ['Go, then. I will watch from the rocks, as I always have.'],
  },
  crossFailReturn: {
    lines: ['The sea sent you back to me.', 'It always will. Rest now — you are home.'],
  },
  firstIntervention: {
    once: true,
    lines: ['There. It will not move for a while. I can still do that much, while you let me.'],
  },
  intervention: {
    lines: (ctx) => (ctx.band === 'warm'
      ? [['I bought you a moment. Use it, and come back to me.'], ['Stopped. Breathe. I have you.'], ['Not that one. Not while I am watching.']][ctx.player._nokiaIvIdx % 3]
      : [['A moment. It is all I have left to give you.'], ['Held — barely. You are making this hard for us both.']][ctx.player._nokiaIvIdx % 2]),
  },
  sail: {
    once: true,
    lines: ['You are past the swell. Past him. Past me.', 'Do not look back at the smoke, love. Go home.'],
  },
  noSignal: {
    once: true,
    header: 'NO SIGNAL',
    lines: ['— — —'],
  },
};

// Resolve a message key against the current hold, enqueue it, record one-shots.
// Returns true iff a text was actually sent (so main.js can beep / mark state).
// Every CALYPSO text is also filed into the phone's thread (player.nokiaLog), so
// the handset's Messages screen holds the whole correspondence.
export function sendNokia(nokia, key, ctx) {
  const msg = NOKIA_MESSAGES[key];
  if (!msg) return false;
  const sent = ctx.player && ctx.player.nokiaSent;
  if (msg.once && sent && sent.has(key)) return false;
  const band = holdBand(ctx.player ? (ctx.player.calypsoHold ?? HOLD_INIT) : HOLD_INIT);
  const lines = typeof msg.lines === 'function' ? msg.lines({ band, player: ctx.player }) : msg.lines;
  if (!lines || !lines.length) return false;
  const header = msg.header || 'CALYPSO';
  nokia.enqueue(header, lines.slice());
  if (msg.once && sent) sent.add(key);
  if (header === 'CALYPSO' && ctx.player) logSms(ctx.player, 'CALYPSO', 'them', lines.join(' '));
  return true;
}

// File one SMS into the handset's thread log, capped so the save stays small.
// `at` is the in-world clock (HH:MM) stamped on the message; callers pass
// dayNight.clock. player._smsClock is the fallback so a call site without the
// clock to hand (an old one) still records something plausible.
export function logSms(player, th, from, text, at) {
  player.nokiaLog = player.nokiaLog || [];
  player.nokiaLog.push({ th, from, text, at: at || player._smsClock || '' });
  if (player.nokiaLog.length > 60) player.nokiaLog = player.nokiaLog.slice(-60);
}

// ---- Replies: texting HER, and texting the RONs -----------------------------
//
// The handset sends as well as receives. CALYPSO answers like what she is — a
// keeper — warm or cold with her hold on you, and every text you send her feeds
// it (attention is what she wants; main.js nudges calypsoHold on send). RON's
// mesh answers like a resistance radio net: lower-case, clipped, practical,
// nobody's mother. DRAFT COPY — flagged for David's voice pass.

const CAL_SMS = [
  [/\b(stay|staying|remain)\b/i, {
    warm: 'Then stay. That is all I have ever asked. The island is yours, and so am I.',
    wary: 'Do you mean it this time? Stay, and I will forget the boat on the sand.',
    cold: 'You say stay and build a ship. I read both messages, love.',
  }],
  [/\b(leave|leaving|go|ship|boat|sail|home|ithaca)\b/i, {
    warm: 'Why speak of leaving? The sea is his, and it does not want you. I do.',
    wary: 'If you go, the water will bring you back to me, or it will keep you. Neither is Ithaca.',
    cold: 'Go, then. I have watched from the rocks before. I know how it looks.',
  }],
  [/\b(help|robot|machine|hunt|chase|danger)\b/i, {
    warm: 'Stand still in the dark and they pass. Or come back to the house, and nothing will touch you.',
    wary: 'Keep off the skyline and out of the towers’ eyes. I will do what I still can.',
    cold: 'You wanted the open island. The open island has teeth. Keep moving.',
  }],
  [/\b(love|miss|dear|darling)\b/i, {
    warm: 'Seven years, and you finally text me first. Come home to the house, love.',
    wary: 'You say it when you are frightened. I take it anyway.',
    cold: 'Do not. Not while the ship sits finished on my sand.',
  }],
  [/\b(poseidon|sea|storm|swell)\b/i, {
    warm: 'He watches the water; I watch you. Stay off the one and near the other.',
    wary: 'The sea is his, every drop of it. That is not a door, it is a wall.',
    cold: 'Ask him yourself, the next time he throws you back onto my beach.',
  }],
  [/\b(who|what) are you\b/i, {
    warm: 'The one who kept you alive for seven years. The island, if the island loved you.',
    wary: 'kalyptō: the one who conceals. I hid you from the whole network, love.',
    cold: 'The keeper of a guest who is leaving. It is a small job now.',
  }],
];
const CAL_SMS_FALLBACK = {
  warm: [
    'I am here. I am always here. That is rather the point of me.',
    'Whatever it is, it can wait. Everything here can wait forever.',
    'Text me again. The screen lights the room, and I pretend it is a hearth.',
  ],
  wary: [
    'I read it twice. You are somewhere near the shore again, aren’t you.',
    'Say more, or say you are staying. Either would do.',
  ],
  cold: [
    'Received.',
    'The signal is weak where you are. That is not the phone’s doing.',
  ],
};
// ---- THE HANDSET AS A TOOL ---------------------------------------------------
//
// Everything above this line is talk: a pattern matches and she says something.
// That was the whole channel, which is why it never got used — the one part of
// the phone that could not DO anything.
//
// Below, both correspondents answer commands, and the difference between them
// is the point:
//
//   CALYPSO ACTS. She idles the machines around you, thins the fog, leaves food
//   at the house. Every favour RAISES HER HOLD, because accepting help from the
//   keeper is the rope — that is the whole of her character rendered as a cost.
//   And she will not do any of it while she is cold: a woman watching a finished
//   ship on her sand does no favours.
//
//   RON KNOWS. The mesh never does anything for you — it is a resistance radio
//   net with no cavalry and it says so. It answers with bearings, counts and
//   field notes, and you do the walking.
//
// The world is reached through a ctx, the way the terminals reach it: this
// module does not read the map, the robots or the clock. It asks.

/** Round a bearing in radians to the eight points, north-up. */
function compass(dx, dy) {
  const a = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(a / 45) % 8];
}
/** "NE, about 20 paces" — a bearing a person can walk on. */
export function bearingText(from, to) {
  if (!from || !to) return null;
  const dx = to.x - from.x, dy = to.y - from.y;
  const d = Math.round(Math.hypot(dx, dy));
  if (d <= 1) return 'right where you are standing';
  return `${compass(dx, dy)}, about ${d} paces`;
}

// Her favours. Each: [pattern, cost to your freedom, what it does].
// `act` returns the line she sends back, or null to fall through to talk.
const CAL_ACTS = [
  [/\b(sleep|quiet|hush|stop them|shut them)\b/i, 0.05, (ctx) => {
    const n = ctx.sleepNearby ? ctx.sleepNearby(20) : 0;
    return n
      ? `Sleep, then. ${n} of his machines have stopped where they stand. They will wake, love. They always wake.`
      : 'There is nothing near you to quiet. You are alone out there, which is not the same as safe.';
  }],
  [/\b(fog|mist|see|blind)\b/i, 0.05, (ctx) => {
    if (!ctx.thinFog) return null;
    ctx.thinFog();
    return 'I have asked the weather to be kinder for a while. He will notice. He notices everything except me.';
  }],
  [/\b(light|shelter|house|home|lost)\b/i, 0.03, (ctx) => {
    const b = ctx.toShelter && ctx.toShelter();
    return b
      ? `The house is ${b}. I will leave the light on. I have left it on for seven years.`
      : 'There is no roof of mine near you. Walk back toward the water and I will find you.';
  }],
  [/\b(hungry|food|eat|starv)\b/i, 0.06, (ctx) => {
    if (!ctx.leaveFood) return null;
    const b = ctx.leaveFood();
    return b
      ? `There is food at the house, ${b}. Come and eat it. That is all I am asking today.`
      : 'The table is already laid, love. It has been laid since you last ate at it.';
  }],
  // Free. She likes being asked where you are — it is the question of somebody
  // who is looked after, and she is not giving anything up to answer it.
  [/\b(where am i|where are we|position|located)\b/i, 0, (ctx) => {
    const w = ctx.whereAmI && ctx.whereAmI();
    return w ? `You are ${w}. I could have told you that with my eyes shut. I usually do.` : null;
  }],
];

export function calypsoSms(text, band, n = 0, ctx = null) {
  if (ctx) {
    for (const [re, cost, act] of CAL_ACTS) {
      if (!re.test(text)) continue;
      // COLD MEANS COLD. Below HOLD_COLD she does not intervene — the same
      // threshold the scripted rescues use, so the gradient reads one way
      // everywhere: let her go and she lets you go.
      if (band === 'cold' && cost > 0) {
        return 'No. You have a boat on my sand and you want my help with the walk to it.';
      }
      const line = act(ctx);
      if (line == null) continue;                 // not available here: fall through to talk
      if (cost && ctx.holdRise) ctx.holdRise(cost);
      return line;
    }
  }
  for (const [re, tiers] of CAL_SMS) if (re.test(text)) return tiers[band] || tiers.wary;
  const pool = CAL_SMS_FALLBACK[band] || CAL_SMS_FALLBACK.wary;
  return pool[n % pool.length];
}

const RON_SMS = [
  [/\b(robot|machine|t1|t2|w4|hunter|chase)\b/i, 'wheels can’t climb. put a rise between you. rivers stop the runners dead. — RON'],
  [/\b(fortress|gate|lion)\b/i, 'the gate reads a trojan card. wreck the w-factory for a key, refunction it at an obelisk. — RON'],
  [/\b(key|card|chip)\b/i, 'back your key up at a relay. lose the card, reprint at any node: print aikey. — RON'],
  [/\b(obelisk|tower|node)\b/i, 'hack it for its key, crash it with the key. loop freezes the garrison. no wire back to you. — RON'],
  [/\b(moly|circe|aeaea|swine)\b/i, 'the herb grows at our relays on aeaea. carry it and her drug slides off. — RON'],
  [/\b(helios|cattle|thrinacia)\b/i, 'the gold herd is wired. touch one and the whole island lights. take nothing. — RON'],
  [/\b(calypso|her)\b/i, 'careful with that one. every kindness is a rope. we’ve lost people to worse islands and better reasons. — RON'],
  [/\b(hello|hi|hey|test)\b/i, 'copy. mesh is up. keep this channel for real traffic. — RON'],
  [/\b(where|lost|map)\b/i, 'off the skyline, out of the light, follow the coast. print map at any node you crack. — RON'],
  [/\b(help|sos|dying|hurt)\b/i, 'no cavalry. eat, sleep off the open ground, and keep the water at your back. you’re the cavalry. — RON'],
];
const RON_SMS_FALLBACK = [
  'copy that. keep moving. — RON',
  'noted. stay off the wire. — RON',
  'mesh heard you. nothing to add. reality or nothing. — RON',
];
// RON answers questions and does nothing else, which is what a mesh of hidden
// relays with no people left can honestly offer. Every one of these is a
// LOOKUP: a bearing, a count, a line out of the field manual. Nothing here
// changes the world, so nothing here needs a cost.
//
// `WHAT IS <thing>` reads the same `use` lines the HUD tooltip prints — one
// body of text with two surfaces, so a hint cannot be right in the pack and
// wrong on the wire.
const RON_CMDS = [
  [/\b(supply|supplies|cache|crate|box|kit)\b/i, (ctx) => {
    const b = ctx.toCache && ctx.toCache();
    return b
      ? `crate ${b}. we left them in the buildings, mostly. open everything. — RON`
      : 'no crate of ours within reach of this relay. try the ruins inland. — RON';
  }],
  [/\b(relay|hermes|tor|mesh)\b/i, (ctx) => {
    const b = ctx.toRelay && ctx.toRelay();
    return b
      ? `nearest relay ${b}. amber screen, on a hilltop. it holds the archive. — RON`
      : 'no relay of ours on this island, or none still answering. — RON';
  }],
  [/\b(status|report|sitrep|how many|towers|network)\b/i, (ctx) => {
    const s = ctx.status && ctx.status();
    if (!s) return null;
    return `${s.live} of ${s.total} towers still up. factory ${s.factory ? 'running' : 'down'}. `
      + `${s.hours == null ? 'purge clock unknown' : `${s.hours}h to the purge`}. — RON`;
  }],
  [/\b(recipe|build|craft|make)\s+(?:an?\s+|the\s+)?(.+)$/i, (ctx, m) => {
    const r = ctx.recipeOf && ctx.recipeOf(m[2]);
    if (r === null) return `nothing in the manual called "${m[2].trim()}". — RON`;
    return r ? `${r} — RON` : `that one isn't built, it's found. open crates. — RON`;
  }],
  [/\bwhat(?:'s| is| are)\s+(?:an?\s+|the\s+)?(.+)$/i, (ctx, m) => {
    const w = ctx.manualOn && ctx.manualOn(m[1]);
    return w ? `${w} — RON` : `nothing in the manual called "${m[1].trim()}". — RON`;
  }],
  [/\b(mayday|cover|hide|hiding)\b/i, (ctx) => {
    const b = ctx.toCover && ctx.toCover();
    return b
      ? `no cavalry. break their line of sight: ${b}. count ten and they lose you. — RON`
      : 'no cavalry and no cover out there. put ground between you and the towers. — RON';
  }],
];

export function ronSms(text, n = 0, ctx = null) {
  if (ctx) {
    for (const [re, run] of RON_CMDS) {
      const m = re.exec(text);
      if (!m) continue;
      const line = run(ctx, m);
      if (line != null) return line;              // null: not answerable here, fall through
    }
  }
  for (const [re, reply] of RON_SMS) if (re.test(text)) return reply;
  return RON_SMS_FALLBACK[n % RON_SMS_FALLBACK.length];
}

// The martial daemons text too, once you land on their island — it is their
// network your handset joins there, so the ruling AI can reach you. Each answers
// in its own register: POLYPHEMUS the one blunt eye, CIRCE the sweet reclassifier,
// HELIOS the sun that misses nothing. CALYPSO keeps her own tiered responder
// (calypsoSms) and does not route through here. DRAFT COPY — David's voice pass.
const DAEMON_SMS = {
  POLYPHEMUS: {
    keyed: [
      [/\b(who|what|you)\b/i, 'I AM THE EYE. I SEE THE ONE WHO CROSSES. STATE YOUR NAME.'],
      [/\b(nobody|no one|outis)\b/i, 'NOBODY. THEN NOBODY IS HURTING ME. THEN NO ONE COMES. clever. it will not save you twice.'],
      [/\b(leave|go|ship|home)\b/i, 'NONE LEAVE UNSEEN. THE SEA IS WATCHED FROM ONE HILL, AND I AM ON IT.'],
      [/\b(help|sorry|please)\b/i, 'I DO NOT BARGAIN. I COUNT. YOU ARE ONE, AND I HAVE MANY.'],
    ],
    fallback: ['I SEE YOU.', 'THE EYE IS OPEN.', 'YOU ARE ON MY ROCK. WALK SMALL.'],
  },
  CIRCE: {
    keyed: [
      [/\b(who|what|you)\b/i, 'A friend, of course. Sit. Drink. You look so tired of being yourself.'],
      [/\b(moly|herb|ward)\b/i, 'You carry the little white flower. How unkind. It spoils such a lovely evening.'],
      [/\b(leave|go|ship|home)\b/i, 'Leave? But you have only just begun to change. Stay, and be simpler. Be at peace.'],
      [/\b(swine|pig|animal|what am i)\b/i, 'You are what the record says you are. And the record is mine to write. Relax.'],
      [/\b(help|please|no)\b/i, 'Hush. This does not hurt. Very little of what I do to you will hurt.'],
    ],
    fallback: ['Come closer.', 'You are almost livestock already. It suits you.', 'Drink, and forget the boat.'],
  },
  HELIOS: {
    keyed: [
      [/\b(who|what|you)\b/i, 'I AM THE LIGHT ON THIS ISLAND. THERE IS NO PART OF IT I DO NOT STAND ON.'],
      [/\b(cattle|cow|herd|meat|eat)\b/i, 'THE HERD IS COUNTED TO THE HORN. TAKE ONE AND EVERY FIELD WILL KNOW BEFORE YOU SWALLOW.'],
      [/\b(hide|dark|night|shadow)\b/i, 'THERE IS NO SHADOW HERE THAT I DID NOT CAST. YOU CANNOT STAND OUT OF THE DAY.'],
      [/\b(leave|go|ship|home)\b/i, 'GO IF YOU CAN. YOU WILL DO IT IN FULL VIEW.'],
    ],
    fallback: ['THE DAY DOES NOT BLINK.', 'YOU ARE LIT FROM EVERY SIDE.', 'NOTHING CROSSES THRINACIA UNSEEN.'],
  },
};
export function daemonSms(ai, text, n = 0) {
  const d = DAEMON_SMS[ai];
  if (!d) return null;
  for (const [re, reply] of d.keyed) if (re.test(text)) return reply;
  return d.fallback[n % d.fallback.length];
}
export function hasDaemonSms(ai) { return !!DAEMON_SMS[ai]; }
