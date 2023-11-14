import { FLOORS } from './tiles.js';

// Corner minimap. An offscreen canvas holds the map at 1px per tile,
// rebuilt only when the map mutates (refresh); each frame draw() just
// blits it scaled into a corner square with the player as a white dot.

const WALL_COLOR = '#33302b';   // wall/rubble pixels
const TREE_COLOR = '#1f3d1c';   // darker than the grass floor
const FALLBACK_FLOOR = '#111';  // unknown/absent floor types
const BACKING = 'rgba(11,14,10,0.6)';
const BORDER = 'rgba(207,216,195,0.6)';
const DOT = 3; // player dot size in screen pixels

export class Minimap {
  constructor(map) {
    this.canvas = document.createElement('canvas');
    this.refresh(map);
  }

  // Rebuild the offscreen canvas. Cheap enough to call after any map
  // mutation, but not intended to run per frame.
  refresh(map) {
    this.canvas.width = map.w;
    this.canvas.height = map.h;
    const ctx = this.canvas.getContext('2d');
    for (let y = 0; y < map.h; y++) {
      for (let x = 0; x < map.w; x++) {
        const def = FLOORS[map.floorAt(x, y)];
        ctx.fillStyle = def ? def.color : FALLBACK_FLOOR;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    for (const obj of map.objects) {
      if (obj.type === 'tree') ctx.fillStyle = TREE_COLOR;
      else if (obj.type === 'wall' || obj.type === 'rubble') ctx.fillStyle = WALL_COLOR;
      else continue;
      ctx.fillRect(obj.x, obj.y, 1, 1);
    }
  }

  // Blit the map scaled to size x size at (x, y), with a backing panel,
  // 1px light border, and the player as a white dot. Everything stays
  // inside the given square.
  draw(ctx, map, player, x, y, size) {
    ctx.save();
    ctx.fillStyle = BACKING;
    ctx.fillRect(x, y, size, size);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.canvas, x, y, size, size);
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

    // Player dot, clamped so it never spills over the border.
    const half = DOT / 2;
    const px = Math.max(x + half, Math.min(x + size - half, x + (player.x / map.w) * size));
    const py = Math.max(y + half, Math.min(y + size - half, y + (player.y / map.h) * size));
    ctx.fillStyle = '#fff';
    ctx.fillRect(px - half, py - half, DOT, DOT);
    ctx.restore();
  }
}
