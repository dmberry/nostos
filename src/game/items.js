// Item definitions. Tools live in the hands slot; resources stack in pockets.

export const ITEMS = {
  penknife: {
    name: 'Penknife',
    kind: 'tool',
    treeDamage: 1,     // hits per swing against a tree
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
};
