import { worldToScreen, screenToWorld } from './iso.js';

// Camera focuses on a world position and eases toward its target.
export class Camera {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  follow(tx, ty, dt) {
    const t = Math.min(1, dt * 6);
    this.x += (tx - this.x) * t;
    this.y += (ty - this.y) * t;
  }

  snap(tx, ty) {
    this.x = tx;
    this.y = ty;
  }

  // Translate the canvas so the camera's world position sits at screen centre.
  applyTransform(ctx, viewW, viewH) {
    const c = worldToScreen(this.x, this.y);
    ctx.translate(Math.round(viewW / 2 - c.x), Math.round(viewH / 2 - c.y));
  }

  // Inverse of applyTransform: a canvas-space point (CSS pixels, viewport
  // top-left origin) back to world coordinates. Used for cursor aiming.
  toWorld(px, py, viewW, viewH) {
    const c = worldToScreen(this.x, this.y);
    const sx = px - (viewW / 2 - c.x);
    const sy = py - (viewH / 2 - c.y);
    return screenToWorld(sx, sy);
  }
}
