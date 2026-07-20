// Per-island ground palettes (B2 of the island character pass).
//
// Every island used to render in exactly the same greens, because FLOORS
// (tiles.js) is a shared singleton read straight by the renderer. These tables
// are hung on the map as `map.palette` / `map.treeTint`, and the renderer's
// drawFloor + minimap + drawTree prefer them over the defaults — so an island's
// whole ground character is one entry here, and no other island is touched.
//
// Only the *natural* floors are overridden. The fortress decks (panel/quad/
// sanctum) stay identical everywhere on purpose: the machine architecture is
// the one thing that is the same wherever you land, and it should read as
// imported, not native.
//
// The colours are chosen against each island's Homeric character rather than
// for variety's sake:
//
//   OGYGIA (Calypso)     lush, cool, over-green — a place that keeps you
//   AEGILIA (Polyphemus) hard volcanic rock and coarse scrub; the goat isle
//   AEAEA (Circe)        dark enchanted growth, everything a little too rich
//   THRINACIA (Helios)   sun-bleached, parched, gold — the cattle's meadows
//   ITHACA               home: warm, soft, the most beautiful ground in the game

export const ISLAND_PALETTES = {
  // Ogygia: deep sappy green, pale shell sand. The island is a comfortable
  // prison, so it is the greenest and softest of the martial four.
  calypso: {
    palette: {
      grass: '#4f8f52',
      tallgrass: '#5f9243',
      dirt: '#7d6a4c',
      sand: '#d8cba6',
      stream: '#4f83b5',
    },
    treeTint: { color: '#63b06a', strength: 0.30 },
  },

  // Aegilia, the goat isle: burnt volcanic ground. Pushed hard toward grey-brown
  // and DESATURATED — the least green island, so it reads as rock the moment you
  // land. (The whole point of the saturation pass: each island's chroma is its
  // signature as much as its hue.)
  polyphemus: {
    palette: {
      grass: '#77714f',    // olive-grey, barely green
      tallgrass: '#8a7f48',
      dirt: '#5f4a38',
      sand: '#9c917d',     // ash
      stream: '#5b7d92',
    },
    treeTint: { color: '#8a7f4e', strength: 0.6 },  // dusty, greyed foliage
  },

  // Aeaea: Circe's garden. Everything grows too well — the DARKEST, most
  // saturated green of the five, dropped low in value with a violet cast in the
  // shadows, so it feels wet, over-fed, and faintly wrong.
  circe: {
    palette: {
      grass: '#2f6b3c',    // deep bottle green
      tallgrass: '#3a7233',
      dirt: '#57433f',
      sand: '#a99a86',
      stream: '#3f7683',
    },
    treeTint: { color: '#245a3c', strength: 0.62 },
  },

  // Thrinacia: the sun's own island. Pushed further into BLEACHED gold — the
  // grass is barely grass, more scorched hay, so it reads as heat and exposure.
  helios: {
    palette: {
      grass: '#a89f4a',    // dry gold
      tallgrass: '#c0ac42',
      dirt: '#9c7c46',
      sand: '#e6d290',     // pale hot sand
      stream: '#7ba1b0',
    },
    treeTint: { color: '#bda44e', strength: 0.58 },
  },

  // Ithaca: home. The warmest, MOST saturated and vivid ground in the game —
  // olive and living meadow-green, rich golden sand, a bright kind sea. It is the
  // one island whose colour is a relief, and it should look it against the muted
  // and bleached and over-dark others.
  ithaca: {
    palette: {
      grass: '#5aa64d',    // bright living green
      tallgrass: '#7fb548',
      dirt: '#8f7250',
      sand: '#ecd9a6',
      stream: '#4f9ac9',
      water: '#3f86c4',
    },
    treeTint: { color: '#79c85f', strength: 0.3 },
  },
};

// Per-island TERRAIN profiles (B1) — passed to buildWorld(seed, cfg). These are
// what stop the five islands being the same map with a different RNG stream:
// where the water runs (or whether there is any), how mountainous, how built-up,
// how wooded. Omitting an island here gives it the original Ogygia layout.
export const ISLAND_TERRAIN = {
  // Ogygia: the reference layout, unchanged — north-south river, the full town,
  // moderate hills. It is the island everyone has already played, and the one
  // the tutorial's landmarks are tuned against. The lotus grove is HERS ALONE
  // (it used to be generated on every island, at the identical spot).
  calypso: {
    lotus: true,
  },

  // Aegilia: the goat isle. Cyclopes keep no towns — a thin scatter of huts, no
  // proper road grid, and the most mountainous ground in the archipelago (goats
  // and caves). The river is a narrow torrent cutting the east.
  polyphemus: {
    feature: 'burn',   // a fire scar: dead trunks on scorched dirt
    river: { cx: 88, amp: 5, freq: 0.07, halfMin: 0.6, halfMax: 1.2 },
    roads: 'spur',
    lots: 5,
    hills: { count: 9 },
    hollows: { count: 5 },
    forests: { density: 0.55 },
    meadows: { count: 3 },
    flowers: { density: 0.35 },  // bare volcanic rock: almost nothing in bloom
    mountain: { x: 40, y: 44, peak: 15 }, // the great peak of the goat isle — rock and snow above the tree line
  },

  // Aeaea: Circe's wooded island. Homer's men see smoke through dense oak and
  // thicket — so the heaviest forest cover of the five, a broad slow river
  // running EAST-WEST across the middle, and only the hall and its outbuildings.
  circe: {
    feature: 'marsh',  // a reed fen in the low ground — pools, cover, slow going
    river: { cx: 58, amp: 12, freq: 0.03, halfMin: 1.6, halfMax: 3.0, axis: 'ew' },
    roads: 'none',
    lots: 4,
    hills: { count: 4 },
    hollows: { count: 2 },
    forests: { density: 1.9 },
    meadows: { count: 5 },
    flowers: { density: 0.6 },   // too dark under that canopy for much to flower
  },

  // Thrinacia: the sun's meadows, where the cattle graze. Wide open pasture —
  // barely any forest, no river at all (a parched island), gentle ground, and a
  // single coastal road. The emptiness is the point: nowhere to hide from a sun
  // that is also the sensor.
  helios: {
    feature: 'sandpit', // the dust-bowl: a great dished crater of sand
    river: null,
    roads: 'coastal',
    lots: 6,
    hills: { count: 3 },
    hollows: { count: 1 },
    forests: { density: 0.3 },
    meadows: { count: 7 },
    flowers: { density: 0.45 },  // scorched pasture; the sun burns it off
  },

  // Ithaca: home, and the most beautiful ground in the game. A generous river,
  // rolling hills, deep woods AND open meadows, the full town intact — every
  // landscape feature the archipelago has, at its kindest. Nothing here is
  // stripped back; the abundance is the reward.
  ithaca: {
    feature: 'olives', // an olive grove in tended rows — the one planting in the game
    river: { cx: 46, amp: 14, freq: 0.038, halfMin: 1.2, halfMax: 2.4 },
    roads: 'grid',
    lots: null,
    hills: { count: 7 },
    hollows: { count: 4 },
    forests: { density: 1.4 },
    meadows: { count: 7 },
    flowers: { density: 2.6 },  // home is in bloom — the clearest signal it is loved
  },
};

export function islandTerrain(islandId) {
  return ISLAND_TERRAIN[islandId] || {};
}

// Hang an island's palette on its map. Safe to call with an unknown id (the
// island simply keeps the shared defaults).
export function applyIslandPalette(map, islandId) {
  const p = ISLAND_PALETTES[islandId];
  if (!p) return map;
  map.palette = p.palette;
  map.treeTint = p.treeTint;
  return map;
}
