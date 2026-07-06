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

// Floor/wall textures are re-warped from scratch onto a tiny (~64x32)
// diamond every tile, every frame, via a transform tied to the camera's
// continuous, sub-pixel position — so each frame samples a very slightly
// different window of the full-resolution source. At the ~500px source vs
// ~50px destination minification ratio involved, that shift reads as a
// visible shimmer/moiré as soon as anything moves (the camera follows the
// player, so this hit constantly) and stops the instant it's still.
// Pre-shrinking the source once, in the background, to roughly the size it
// actually renders at removes almost all of that fine detail up front, so
// there's nothing left for the per-frame sub-pixel jitter to alias against.
function loadDownscaled(path, size = 64) {
  const raw = new Image();
  const out = new Image();
  raw.onload = () => {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    c.getContext('2d').drawImage(raw, 0, 0, size, size);
    out.src = c.toDataURL('image/jpeg', 0.85);
  };
  raw.src = path;
  return out;
}

const T = 'assets/textures/';

// Keyed by FLOORS type (tiles.js). Types not listed here keep their flat
// colour fill (sand, tallgrass2) — no matching photo texture was worth
// forcing.
export const FLOOR_TEXTURES = {
  grass: loadDownscaled(T + 'floor-grass.jpg'),
  tallgrass: loadDownscaled(T + 'floor-grass.jpg'),
  water: loadDownscaled(T + 'floor-water.jpg'),
  stream: loadDownscaled(T + 'floor-water.jpg'),
  dirt: loadDownscaled(T + 'floor-dirt.jpg'),
  road: loadDownscaled(T + 'floor-road.jpg'),
  boards: loadDownscaled(T + 'floor-boards.png'),
  bridge: loadDownscaled(T + 'floor-boards.png'),
};

// A sparse dirt-patch variant scattered thinly through grass tiles for
// ground variety — see Renderer.drawFloor, which rolls a low, per-tile
// deterministic chance to use this instead of the usual grass texture.
export const GRASS_PATCH_TEXTURE = loadDownscaled(T + 'floor-secret.jpg');

// Keyed by the wall object's `material` field (tiles.js/worldgen.js).
export const WALL_TEXTURES = {
  stone: loadDownscaled(T + 'wall-stone.jpg'),
  brick: loadDownscaled(T + 'wall-brick.jpg'),
};

// Keyed by player gender (m/f/u): a small top-down pixel-art body (Kenney's
// CC0 "Topdown Shooter" pack — assets/textures/kenney_top-down-shooter/),
// drawn from directly above and designed to be freely rotated in code to
// face any direction, which is exactly how the player already orients
// (always facing the cursor) — see Renderer.drawPlayer. Loaded at native
// resolution, not downscaled: these are small (~35x43) crisp pixel-art
// sprites already, and JPEG re-encoding would blur their clean edges.
// Robot 1 stands in for Neve — a fittingly uncanny "other".
export const CHARACTER_SPRITES = {
  m: load(T + 'player-male.png'),
  f: load(T + 'player-female.png'),
  u: load(T + 'player-other.png'),
};
