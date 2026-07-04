// Item definitions. Tools live in the hands slot; resources stack in pockets.

export const ITEMS = {
  penknife: {
    name: 'Penknife',
    kind: 'tool',
    treeDamage: 1,     // hits per swing against a tree
    animalDamage: 3,
    swingCooldown: 0.5,
    staminaCost: 4,
    color: '#b8412f',
  },
  wood: {
    name: 'Wood',
    kind: 'resource',
    stack: 10,
    color: '#8a6437',
  },
  meat: {
    name: 'Meat',
    kind: 'resource',
    stack: 5,
    color: '#a34545',
    food: 25, // raw; cooking comes later
  },
  tin: {
    name: 'Tinned food',
    kind: 'resource',
    stack: 4,
    color: '#9fa8b0',
    food: 40,
  },
  berries: {
    name: 'Berries',
    kind: 'resource',
    stack: 8,
    color: '#7a3a8a',
    food: 15,
  },
  torch: {
    name: 'Torch',
    kind: 'resource',
    stack: 3,
    color: '#e0a030',
  },
  // Books: read (R) to gain a permanent skill. Knowledge survives death.
  book_wood: {
    name: 'Whittling & Woodcraft',
    kind: 'book',
    stack: 1,
    color: '#7d5a3c',
    skill: 'woodcraft',
    skillText: 'Woodcraft: your blade fells trees in half the swings.',
  },
  book_herbs: {
    name: 'Hedgerow Remedies',
    kind: 'book',
    stack: 1,
    color: '#5d7a3c',
    skill: 'herbalism',
    skillText: 'Herbalism: berries now purge venom and mend you a little.',
  },
  book_track: {
    name: 'Reading the Wild',
    kind: 'book',
    stack: 1,
    color: '#8a4a3a',
    skill: 'tracking',
    skillText: 'Tracking: nearby animals show on your minimap.',
  },
  book_run: {
    name: 'The Long Road',
    kind: 'book',
    stack: 1,
    color: '#4a5a7a',
    skill: 'fleetfoot',
    skillText: 'Fleet foot: sprinting drains far less stamina.',
  },
};
