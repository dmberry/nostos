// Isometric projection maths. World units are tiles: (x, y) with integer
// values at tile corners. Screen space uses classic 2:1 diamonds.

export const TILE_W = 64;
export const TILE_H = 32;

const HW = TILE_W / 2;
const HH = TILE_H / 2;

export function worldToScreen(x, y) {
  return { x: (x - y) * HW, y: (x + y) * HH };
}

export function screenToWorld(sx, sy) {
  return { x: (sx / HW + sy / HH) / 2, y: (sy / HH - sx / HW) / 2 };
}

// Screen-space movement intent -> world-space direction, so that pressing
// "up" moves the character up the screen rather than along a world axis.
// Screen right = world (+x, -y), screen down = world (+x, +y).
export function screenDirToWorld(dx, dy) {
  const wx = dx + dy;
  const wy = dy - dx;
  const len = Math.hypot(wx, wy);
  if (len === 0) return { x: 0, y: 0 };
  return { x: wx / len, y: wy / len };
}
