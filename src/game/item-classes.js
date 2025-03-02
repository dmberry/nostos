// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// What an item IS FOR, as a second axis over items.js.
//
// `kind` in items.js has been doing three jobs at once and cannot be untangled
// without breaking things that read it: it says what an item is made of
// (`resource`, `material`, `part`), what you do with it (`tool`, `gun`, `bomb`),
// and what it literally is (`phone`, `compass`, `laptop`). Twenty-six values,
// and `resource` alone holds food, ammunition, timber and torches. So `kind`
// stays exactly as it is — the renderer, HOLDABLE and half of player.js read it
// — and this module adds the axis that was missing rather than renaming the one
// that exists.
//
// A CLASS answers one question: how does this behave in your hands? Nine
// answers, and every item has exactly one, which is what makes it useful to
// group by. The classes are for the things that come later — inventory
// filtering, what a building type stocks, what a machine will trade, what
// survives a swim — so the rules live here and those features read them.
//
// Pure: data and derivation, no world, no DOM. items.js stays the only registry
// of items; this is a lens over it.

export const ITEM_CLASSES = {
  consumable: 'Spent on use, and then gone: food, ammunition, cells, bombs.',
  tool: 'Held and used, and it stays yours. Most double as a weapon.',
  weapon: 'Made to be fired. A tool that has no other purpose.',
  device: 'A machine of your own: it has state, and it does something when run.',
  material: 'Stock. It becomes something else when you build with it.',
  wearable: 'Worn or carried on the body rather than in the hand.',
  media: 'Something to read, watch or listen to. Knowledge is the progression.',
  key: 'Access. It opens a thing that is otherwise shut.',
  vehicle: 'It carries you.',
};

// The default reading of each `kind`. Where a kind maps cleanly, it maps here
// and no item needs naming individually.
const CLASS_BY_KIND = {
  bomb: 'consumable',
  spray: 'consumable',
  seed: 'consumable',
  tool: 'tool',
  gun: 'weapon',
  gadget: 'device',
  device: 'device',
  laptop: 'device',
  phone: 'device',
  compass: 'device',
  forcefield: 'device',
  chip: 'key',
  key: 'key',
  material: 'material',
  part: 'material',
  resource: 'material',      // the default for `resource`; the food and the
                             // ammunition inside it are named below
  book: 'media',
  paperbook: 'media',
  record: 'media',
  tape: 'media',
  map: 'media',
  recipe: 'media',           // a recipe is a thing you read, even a golden one
  shield: 'wearable',
  wearable: 'wearable',
  backpack: 'wearable',
  vehicle: 'vehicle',
};

// The awkward ones, named one at a time, because `kind` groups them wrongly.
// Every entry here is a place where the old axis and the new one disagree, and
// the comment says why.
const OVERRIDE = {
  // `resource` holds four different classes of thing. Food and cells and
  // ammunition are all SPENT; timber and scrap are STOCK.
  meat: 'consumable',
  tin: 'consumable',
  berries: 'consumable',
  lotus_fruit: 'consumable',
  moly: 'consumable',
  ammo: 'consumable',
  shells: 'consumable',
  arrow: 'consumable',
  battery: 'consumable',
  torch: 'consumable',       // it burns, and five of them become goggles
  // A map you print is a document; the fortress survey is one too, however it is
  // filed. `fortress_key` stays a key because it opens a door.
  fortress_map: 'media',
  fortress_map_fragment: 'media',
  // Reprogrammers and jammers are machines you operate, not parts.
  bluebox: 'device',
  wifiblock: 'device',
  ob_spoofer: 'device',
  goggles: 'device',         // powered optics: worn, but it is a machine
  // The bow is drawn by hand and takes arrows; it is still a weapon.
  bow: 'weapon',
};

// Items that are consumed BY A RECIPE — the "allow other objects to be crafted"
// question. Only the inputs are listed, never the amounts: the amounts belong
// with the recipes (today they are constants in player.js; when crafting.js
// lands, docs/refactor-plan.md §3.3, they move there and this list is what it
// will be checked against). Two sources of truth for a number is how numbers
// drift; a source of truth for a FACT is fine.
export const CRAFT_INPUTS = new Set([
  'circuit',          // bluebox, goggles, the laptop's board
  'chip_fragment',    // an access chip, and the NostBook repair
  'battery',          // the NostBook repair, and every device that runs
  'torch',            // five of them, stripped for phosphor, become goggles
  'wood',             // a boat, and then a ship
  'scrap',            // blades and plate
  'oar', 'rope', 'sail',  // the greek ship, one each and scarce on purpose
  'anvil', 'large_stone', // the golden axe
]);

// ONE entry point, taking an item DEFINITION (items.js stamps `key` onto every
// def, so a def knows its own name and a caller never has to pass both).
// Everything else in this file is built from it. An unknown or missing def is
// `material`, the harmless default: stock that does nothing on its own.
export function itemClass(def) {
  if (!def) return 'material';
  if (OVERRIDE[def.key]) return OVERRIDE[def.key];
  // Food is food however it is filed: anything with a food value feeds you, and
  // feeding you uses it up.
  if (def.food != null) return 'consumable';
  return CLASS_BY_KIND[def.kind] || 'material';
}

export function itemsOfClass(ITEMS, cls) {
  return Object.keys(ITEMS).filter((k) => itemClass(ITEMS[k]) === cls).sort();
}

export const isConsumable = (def) => itemClass(def) === 'consumable';
export const isDevice = (def) => itemClass(def) === 'device';
export const isMaterial = (def) => itemClass(def) === 'material';
export const isCraftInput = (key) => CRAFT_INPUTS.has(key);
