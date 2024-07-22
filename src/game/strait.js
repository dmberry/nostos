// Scylla and Charybdis — the forced-choice strait (docs/islands-odyssey-revision.md §8).
//
// The narrows lie on the AEAEA -> THRINACIA crossing, where Homer puts them: Circe
// sends Odysseus through the strait, and he makes landfall on Helios's island after
// (Od. XII). Sail that route in either direction and the sea makes you choose.
//
// THE BARGAIN. Homer's choice only works because Odysseus has a crew: Scylla eats
// six men for certain, Charybdis risks the whole ship. You sail alone here, so the
// translation keeps the SHAPE of the bargain rather than its cargo — a certain,
// bounded loss against an unbounded gamble:
//
//   Scylla    — the heads come down and take what is stowed on deck. A fixed number
//               of item stacks, no roll, no escape. It always costs, and the crossing
//               always completes.
//   Charybdis — the whirlpool risks the vessel. Usually she mauls you and lets you
//               through; sometimes she swallows the boat and spits you back at the
//               island you left, and the voyage is lost.
//
// Kept pure — no canvas, no map, no globals — so the rules can be unit-tested and
// main.js owns only the sequence, the modal, and the narration.

// The two islands the narrows sit between. Either direction passes through.
export const STRAIT_ROUTE = ['circe', 'helios'];

// How many stacks the six heads take. Six would strip a pack bare; three reads as
// "she took a few of you" without gutting a careful loadout.
export const SCYLLA_TAKE = 3;

// The card is the escape chain in one object (ai_key -> trojan_key -> hermes_card).
// Scylla must NEVER take it: losing the hermes card would mean re-running the whole
// forge, and there is no reprint for it — a monster in the sea would silently
// soft-lock the game's only exit. She takes cargo, not the key to the door.
export const UNSNATCHABLE = new Set(['ai_key', 'trojan_key', 'hermes_card']);

// Does this crossing pass the narrows? Order-independent: the strait is a place,
// not a direction.
export function isStraitCrossing(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return false;
  return STRAIT_ROUTE.includes(fromId) && STRAIT_ROUTE.includes(toId);
}

// What Scylla can reach: the stowed cargo — pockets and the backpack's storage
// slots. NOT the hands (what you have hold of, she cannot prise loose) and not the
// card. Returns a list of {kind, i} slot references, in pack order.
//
// `pack` is a plain shape: { pockets: [slot|null], backpack: { slots: [slot|null] } | null }
// where a slot is { item, qty }. That is exactly the Player's own layout, so main.js
// can hand the player straight in, and a test can hand in a literal.
export function snatchable(pack) {
  const out = [];
  const pockets = (pack && pack.pockets) || [];
  for (let i = 0; i < pockets.length; i++) {
    const s = pockets[i];
    if (s && s.item && !UNSNATCHABLE.has(s.item)) out.push({ kind: 'pocket', i });
  }
  const slots = (pack && pack.backpack && pack.backpack.slots) || [];
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    if (s && s.item && !UNSNATCHABLE.has(s.item)) out.push({ kind: 'bpstore', i });
  }
  return out;
}

// Choose which stacks she takes: up to SCYLLA_TAKE of them, picked at random from
// what she can reach. `rng` is injected so a test can pin it. Returns the chosen
// slot refs (fewer than `take` if the pack is nearly empty, none if it is bare —
// sailing through with nothing to lose is its own kind of luck).
export function scyllaToll(pack, rng = Math.random, take = SCYLLA_TAKE) {
  const pool = snatchable(pack);
  const n = Math.min(take, pool.length);
  const chosen = [];
  for (let k = 0; k < n; k++) {
    const i = Math.floor(rng() * pool.length) % pool.length;
    chosen.push(pool.splice(i, 1)[0]);
  }
  return chosen;
}

// Charybdis's roll. The gamble has to be a real one — a risk you can take and
// mostly get away with, which is exactly why it tempts you past the certain toll.
//   'mauled'   — through, but the hull is half gone and so are you (the usual)
//   'swallowed'— she takes the boat down and throws you back where you came from;
//                the crossing is LOST (the unbounded end of the bargain)
export const CHARYBDIS_SWALLOW_CHANCE = 0.3;

export function charybdisRoll(rng = Math.random) {
  return rng() < CHARYBDIS_SWALLOW_CHANCE ? 'swallowed' : 'mauled';
}

// What each outcome costs. Hull is the boat's, hurt is the player's; both are
// applied by main.js against whatever vessel and health it is holding.
export const STRAIT_COST = {
  scylla: { hull: 10, hurt: 4 },        // she wants the cargo, not the boat
  mauled: { hull: 55, hurt: 18 },       // through, and badly used
  swallowed: { hull: 90, hurt: 30 },    // and thrown home with it
};
