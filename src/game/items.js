// Item definitions. Tools live in the hands slot; resources stack in pockets.

export const ITEMS = {
  penknife: {
    name: 'Penknife',
    kind: 'tool',
    tier: 1,
    treeDamage: 1,     // hits per swing against a tree
    animalDamage: 3,
    robotDamage: 1,    // barely scratches the machines
    swingCooldown: 0.5,
    staminaCost: 4,
    color: '#b8412f',
  },
  bat: {
    name: 'Baseball bat',
    kind: 'tool',
    tier: 2,
    treeDamage: 1,
    animalDamage: 5,
    robotDamage: 3,
    swingCooldown: 0.55,
    staminaCost: 5,
    color: '#9a7b4f',
  },
  machete: {
    name: 'Machete',
    kind: 'tool',
    tier: 3,
    treeDamage: 2,
    animalDamage: 7,
    robotDamage: 2,    // blades glance off armour
    swingCooldown: 0.5,
    staminaCost: 4,
    color: '#aab2b8',
  },
  crowbar: {
    name: 'Crowbar',
    kind: 'tool',
    tier: 3,
    treeDamage: 1,
    animalDamage: 4,
    robotDamage: 5,    // the resistance's anti-machine weapon of choice
    swingCooldown: 0.6,
    staminaCost: 5,
    color: '#6a6f7a',
  },
  scrap: {
    name: 'Scrap',
    kind: 'resource',
    stack: 10,
    color: '#7a7f88',
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
