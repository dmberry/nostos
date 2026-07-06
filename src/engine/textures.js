// Bitmap textures for floors, walls, and player faces, sourced from
// assets/textures/. Images load asynchronously; canvas silently no-ops
// drawImage on an incomplete image, so the renderer just falls back to the
// existing flat-colour fill until each one finishes loading — no
// promises/await needed in the render loop.
function load(path) {
  const img = new Image();
  img.src = path;
  return img;
}

const T = 'assets/textures/';

// Keyed by FLOORS type (tiles.js). Types not listed here keep their flat
// colour fill (sand, tallgrass2) — no matching photo texture was worth
// forcing.
export const FLOOR_TEXTURES = {
  grass: load(T + 'floor-grass.jpg'),
  tallgrass: load(T + 'floor-grass.jpg'),
  water: load(T + 'floor-water.jpg'),
  stream: load(T + 'floor-water.jpg'),
  dirt: load(T + 'floor-dirt.jpg'),
  road: load(T + 'floor-road.jpg'),
  boards: load(T + 'floor-boards.png'),
  bridge: load(T + 'floor-boards.png'),
};

// Keyed by the wall object's `material` field (tiles.js/worldgen.js).
export const WALL_TEXTURES = {
  stone: load(T + 'wall-stone.jpg'),
  brick: load(T + 'wall-brick.jpg'),
};

// Keyed by player gender (m/f/u). face-sheet-male-alien.png is a 128x64
// sheet: the human face on the left (m), a green alien-ish head on the
// right (u) — a fitting, slightly uncanny "other" for Neve.
const headSheet = load(T + 'face-sheet-male-alien.png'); // 128x64 sheet
const faceFemale = load(T + 'face-female.png'); // 512x512
export const FACE_TEXTURES = {
  m: { img: headSheet, sx: 0, sy: 0, sw: 64, sh: 64 },
  f: { img: faceFemale, sx: 0, sy: 0, sw: 512, sh: 512 },
  u: { img: headSheet, sx: 64, sy: 0, sw: 64, sh: 64 },
};
