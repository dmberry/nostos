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

  // Aegilia, the goat isle: burnt volcanic ground, ash-grey sand, scrub
  // clinging on. Polyphemus's rock, and it should feel like rock.
  polyphemus: {
    palette: {
      grass: '#6b7042',
      tallgrass: '#79763f',
      dirt: '#6b5340',
      sand: '#a89b84',
      stream: '#5b7d92',
    },
    treeTint: { color: '#7d7a4a', strength: 0.45 },
  },

  // Aeaea: Circe's garden. Everything grows too well here — a dark, wet,
  // over-fed green with the faintest violet in the shadows.
  circe: {
    palette: {
      grass: '#3f7a45',
      tallgrass: '#4a7c3a',
      dirt: '#5f4a44',
      sand: '#b3a48f',
      stream: '#4a7f8c',
    },
    treeTint: { color: '#2f6b46', strength: 0.5 },
  },

  // Thrinacia: the sun's own island, where the light is the sensor. Parched
  // gold, bleached ground, the grass burnt pale by a sun that never looks away.
  helios: {
    palette: {
      grass: '#94914a',
      tallgrass: '#a89b46',
      dirt: '#93764a',
      sand: '#dcc98d',
      stream: '#6f96a8',
    },
    treeTint: { color: '#b09a4e', strength: 0.5 },
  },

  // Ithaca: home. The warmest, kindest ground in the archipelago — olive and
  // meadow green, soft golden sand. Nothing here is bleached or burnt; it is
  // the one island whose colour is meant to be a relief after the others.
  ithaca: {
    palette: {
      grass: '#5d9a4e',
      tallgrass: '#7aa54a',
      dirt: '#8a7050',
      sand: '#e2d2a4',
      stream: '#5a93bd',
      water: '#3f7cb4',
    },
    treeTint: { color: '#7cbf63', strength: 0.32 },
  },
};

// Hang an island's palette on its map. Safe to call with an unknown id (the
// island simply keeps the shared defaults).
export function applyIslandPalette(map, islandId) {
  const p = ISLAND_PALETTES[islandId];
  if (!p) return map;
  map.palette = p.palette;
  map.treeTint = p.treeTint;
  return map;
}
