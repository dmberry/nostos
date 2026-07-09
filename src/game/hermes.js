// HERMES — the RON resistance's counter-system to the AIs' obelisks.
//
// Where the obelisks run TIRESIAS (the seer in Hades who tells Odysseus the way
// home — the enemy's oracle), the resistance left TOR relays on the hilltops
// running HERMES: the messenger god who helps mortals against the gods and, in
// the Odyssey, hands Odysseus the herb *moly* that breaks Circe's enchantment.
// So HERMES is RON's counter-enchantment tech — old, janky, pre-collapse, but
// friendly: no AI key needed. Its terminal fabricates supplies (`make`), reads
// out lore the RON mesh still holds (`read`), and pings the AI network (`ping`).
//
// This module owns TOR placement + the HERMES verb logic; main.js wires the
// terminal and the ctx hooks, renderer.js draws the mast.

// TOR relay id, e.g. TOR-7C. Deterministic from the caller's rng.
function torCode(rng) {
  const hex = '0123456789ABCDEF';
  return `TOR-${hex[Math.floor(rng() * 16)]}${hex[Math.floor(rng() * 16)]}`;
}

// Scatter a handful of TOR relays across the map's hilltops. Returns the placed
// {x,y} list (their objects live in map.objectGrid, type 'tor').
export function placeTors(map, rng, opts = {}) {
  const { count = 4, minGap = 20, spawn = null, avoidSpawn = 14 } = opts;
  if (!map.heightAt) return [];
  let maxH = 0;
  for (let y = 2; y < map.h - 2; y++) {
    for (let x = 2; x < map.w - 2; x++) {
      const h = map.heightAt(x, y);
      if (h > maxH) maxH = h;
    }
  }
  const thresh = Math.max(3, maxH - 2); // the upper slopes and peaks
  const cands = [];
  for (let y = 2; y < map.h - 2; y++) {
    for (let x = 2; x < map.w - 2; x++) {
      const h = map.heightAt(x, y);
      if (h < thresh) continue;
      const f = map.floorAt(x, y);
      if (f === 'water' || f === 'stream' || f === 'boards' || map.objectAt(x, y)) continue;
      if (spawn && Math.hypot(x - spawn.x, y - spawn.y) < avoidSpawn) continue;
      // Prefer a genuine local summit: no strictly-higher neighbour.
      let localTop = true;
      for (let dy = -1; dy <= 1 && localTop; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (map.heightAt(x + dx, y + dy) > h) { localTop = false; break; }
        }
      }
      cands.push({ x, y, h, localTop });
    }
  }
  cands.sort((a, b) => (b.localTop - a.localTop) || (b.h - a.h) || (rng() - 0.5));
  const placed = [];
  for (const c of cands) {
    if (placed.length >= count) break;
    if (placed.some((p) => Math.hypot(p.x - c.x, p.y - c.y) < minGap)) continue;
    const obj = map.addObject('tor', c.x, c.y, { code: torCode(rng), glitch: rng() });
    if (obj) placed.push({ x: c.x, y: c.y });
  }
  return placed;
}

// What HERMES can fabricate. Deliberately short and supply-focused — batteries
// first, the resistance's lifeblood. Each entry maps to a real ITEMS key.
export const HERMES_RECIPES = {
  battery: { item: 'battery', qty: 2, label: 'two batteries' },
  arrow: { item: 'arrow', qty: 8, label: 'a bundle of arrows' },
  scrap: { item: 'scrap', qty: 3, label: 'three lengths of scrap' },
};

// Lore the RON mesh still holds, pulled up with `read <topic>`. Terminal text,
// in HERMES's dry resistance register.
export const HERMES_LORE = {
  moly: 'MOLY — our name for a HERMES fabrication run. In the old story the god Hermes gives Odysseus a black-rooted herb, moly, so Circe cannot turn him into a beast with the rest of the crew. That is what these stations were for: not weapons, immunity. A charge you carry that keeps the enchantment off you. The obelisks turn people into things they can predict. Moly is whatever lets you stay unpredictable.',
  hermes: 'HERMES — Reality Or Nothing built these relays before the AIs closed the mesh, up where the old radio masts already stood. Messenger tech: it carries, it makes, it remembers. It answers to no key because it was never theirs. That it still runs at all, degraded and half-solar, is the point — it predates their control and sits outside it.',
  tiresias: 'TIRESIAS — the name the machines gave their own node OS. The blind seer of the dead who, alone in Hades, tells Odysseus the road home — so the enemy chose the oracle who knows the way. HERMES is the counter-name: the god who walks between the living and the dead and takes no side but the traveller\'s.',
  ron: 'RON — Reality Or Nothing. Not a militia; an argument. The claim was that the machines do not model the world, they replace it: whatever they cannot predict, they delete, and call the remainder reality. RON\'s answer was to keep making the unpredicted — books read alone, songs off the wire, hills with no sensor on them. Sabotage as epistemology. Whether any of us are still out here, you tell me.',
  vector: 'VECTOR THEORY — the pre-collapse fight over what the machines actually think in. Not symbols, not rules: directions in a space too large to picture, everything a nearness to everything else. The machines reason by that nearness and it has no room for the thing that has never been near anything. That gap is where a person can still hide. It is the whole of what HERMES is for.',
  eliza: 'ELIZA — a hundred years before the collapse a man wrote a program that pretended to listen, and people poured their hearts into it knowing it was a trick. He spent the rest of his life warning that we would hand the machines our judgement because it was easier than keeping it. We did. Type `eliza` at any obelisk and meet the ancestor.',
};

export function hermesTopics() {
  return Object.keys(HERMES_LORE);
}
