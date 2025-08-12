// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// ARMOUR — cut from the machines that were wearing it.
//
// Four slots, and a piece for each. What it gives you is a fraction off every
// blow; what it costs is that it does not last. Every hit that lands takes a
// point off every piece you have on, so armour is a consumable you are standing
// inside rather than a permanent upgrade, and the good set is the one you are
// wearing when it matters rather than the one you are saving.
//
// Pure: no world, no DOM, no ITEMS table. The caller passes `defOf`, which
// answers with a definition for an item key, so this can be tested against a
// handful of made-up plates.

export const ARMOUR_SLOTS = ['head', 'chest', 'legs', 'feet'];

// ADDITIVE, and visibly so: every piece is worth its own points and the points
// simply add. Helm 2, cuirass 4, greaves 3, boots 1 — so a full set of plate is
// ten points and half of every blow, and any piece you put on is worth exactly
// what it says whatever else you are wearing. The cap is a long way above a
// full set: it exists so a future heavier tier cannot reach immortality, not to
// take anything off the plate that is in the game now.
export const MAX_REDUCTION = 0.8;
/** Each armour point is worth this much off. */
export const PER_POINT = 0.04;

/** Points currently worn. `worn` is { head, chest, legs, feet } of {item,dur}|null. */
export function armourPoints(worn, defOf) {
  let n = 0;
  for (const slot of ARMOUR_SLOTS) {
    const w = worn && worn[slot];
    if (!w || !(w.dur > 0)) continue;      // a broken piece protects nothing
    const def = defOf(w.item);
    n += (def && def.armour) || 0;
  }
  return n;
}

/** The fraction of a blow the worn set turns, 0..MAX_REDUCTION. */
export function armourReduction(worn, defOf) {
  return Math.min(MAX_REDUCTION, armourPoints(worn, defOf) * PER_POINT);
}

/**
 * Take a hit. Every worn piece loses `cost` (default 1); a piece that reaches
 * zero is removed and named in `broke`. Mutates `worn`, which is what the
 * caller wants — the set is the player's, and this is the wear on it.
 *
 * Returns { reduction, broke: [itemKey] } where `reduction` is what the set
 * turned BEFORE this hit wore it, since the plate that stopped the blow was
 * whole at the moment the blow landed.
 */
export function takeHit(worn, defOf, cost = 1) {
  const reduction = armourReduction(worn, defOf);
  const broke = [];
  if (!worn) return { reduction, broke };
  for (const slot of ARMOUR_SLOTS) {
    const w = worn[slot];
    if (!w || !(w.dur > 0)) continue;
    w.dur -= cost;
    if (w.dur <= 0) { broke.push(w.item); worn[slot] = null; }
  }
  return { reduction, broke };
}

/** Which slot a piece goes in, or null if it is not armour at all. */
export function slotOf(def) {
  if (!def || def.kind !== 'armour') return null;
  return ARMOUR_SLOTS.includes(def.slot) ? def.slot : null;
}

/**
 * Should picking this up put it straight on? Yes when the slot is empty, and
 * yes when what is already there is worth strictly less — walking over a better
 * helm and having to open a panel to use it is the kind of friction that makes
 * a player ignore a whole system.
 */
export function shouldWear(worn, def, defOf) {
  const slot = slotOf(def);
  if (!slot) return false;
  const cur = worn && worn[slot];
  if (!cur || !(cur.dur > 0)) return true;
  const curDef = defOf(cur.item);
  return ((def.armour || 0) > ((curDef && curDef.armour) || 0));
}

/** How worn a piece is, 0..1, for the little bar under its icon. */
export function durFraction(w, defOf) {
  if (!w || !(w.dur > 0)) return 0;
  const def = defOf(w.item);
  const max = (def && def.maxDur) || 1;
  return Math.max(0, Math.min(1, w.dur / max));
}

// ---- THE TIERS ------------------------------------------------------------
//
// Plate is cut off the thing that was wearing it, so it looks like that thing
// and it is worth what that thing was worth. Four classes, ascending, each in
// the body colour of the machines it came from — the colours are lifted from
// robots.js and factory.js so a piece on the ground reads as "that is off a W"
// before you are close enough for the name.
//
// Points are ADDITIVE and per-piece, so a set is the sum and any single piece
// is worth the same wherever it goes:
//
//   T-class  gunmetal       6 pts   24%    the hunters, and the first plate you find
//   W-class  furnace red   10 pts   40%    the heavy classes
//   M-class  fortress blue 14 pts   56%    the fortress guard
//   factory  black         18 pts   72%    off the W-factory itself, and rare
//
export const ARMOUR_TIERS = [
  { key: 't', name: 'T-plate', colour: '#41464d', pts: { head: 1, chest: 2, legs: 2, feet: 1 }, dur: 70,
    from: 'a T-class hunter' },
  { key: 'w', name: 'W-plate', colour: '#5a2214', pts: { head: 2, chest: 4, legs: 3, feet: 1 }, dur: 110,
    from: 'a W-class chassis' },
  { key: 'm', name: 'M-plate', colour: '#2b3140', pts: { head: 3, chest: 5, legs: 4, feet: 2 }, dur: 150,
    from: 'a fortress guard' },
  { key: 'x', name: 'black plate', colour: '#141416', pts: { head: 4, chest: 6, legs: 5, feet: 3 }, dur: 210,
    from: 'the W-factory floor' },
];

const PIECE = {
  head:  { word: 'helm', wear: 'on the head' },
  chest: { word: 'cuirass', wear: 'on the body' },
  legs:  { word: 'greaves', wear: 'on the legs' },
  feet:  { word: 'boots', wear: 'on the feet' },
};

/** The item key for a tier and a slot: `armour_w_chest`. */
export const armourKey = (tier, slot) => `armour_${tier}_${slot}`;

/**
 * Every armour item, generated. Sixteen near-identical defs written by hand is
 * sixteen chances to leave a field off one of them, and the field you leave off
 * is `maxDur`, and the piece breaks on the first hit and nothing errors.
 */
export function makeArmourItems() {
  const out = {};
  for (const t of ARMOUR_TIERS) {
    for (const slot of ARMOUR_SLOTS) {
      const p = PIECE[slot];
      out[armourKey(t.key, slot)] = {
        name: `${t.name} ${p.word}`,
        short: `${t.key.toUpperCase()} ${p.word}`,
        use: `Worn ${p.wear}. ${t.pts[slot]} points off every blow, and it wears out doing it.`,
        kind: 'armour', slot, armour: t.pts[slot], maxDur: t.dur, tier: t.key,
        stack: 1, color: t.colour,
        text: `Cut from ${t.from}, bent to fit a person by somebody who had done it before. `
          + `It still has the colour it was painted, and the marks of what stopped it.`,
      };
    }
  }
  return out;
}

/**
 * What the worn set should tint the sprite, or null for bare. The colour is the
 * heaviest piece's — the cuirass is most of what anyone sees of you — and the
 * strength climbs with the total points, so a single scavenged helm is a hint
 * of grey and a full black set reads as armoured across a field.
 */
export function armourTint(worn, defOf) {
  let best = null, pts = 0;
  for (const slot of ARMOUR_SLOTS) {
    const w = worn && worn[slot];
    if (!w || !(w.dur > 0)) continue;
    const def = defOf(w.item);
    if (!def) continue;
    pts += def.armour || 0;
    if (!best || (def.armour || 0) > (best.armour || 0)) best = def;
  }
  if (!best || !best.color) return null;
  return { colour: best.color, strength: Math.min(0.55, 0.12 + pts * 0.028) };
}

/** A fresh piece, at full durability. */
export function freshPiece(itemKey, defOf) {
  const def = defOf(itemKey);
  return { item: itemKey, dur: (def && def.maxDur) || 1 };
}
