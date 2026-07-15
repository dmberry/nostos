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
    lines: ['That tower is one of his eyes. It will call the others if it wakes. Pass it, or put it out — but quietly.'],
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
export function sendNokia(nokia, key, ctx) {
  const msg = NOKIA_MESSAGES[key];
  if (!msg) return false;
  const sent = ctx.player && ctx.player.nokiaSent;
  if (msg.once && sent && sent.has(key)) return false;
  const band = holdBand(ctx.player ? (ctx.player.calypsoHold ?? HOLD_INIT) : HOLD_INIT);
  const lines = typeof msg.lines === 'function' ? msg.lines({ band, player: ctx.player }) : msg.lines;
  if (!lines || !lines.length) return false;
  nokia.enqueue(msg.header || 'CALYPSO', lines.slice());
  if (msg.once && sent) sent.add(key);
  return true;
}
