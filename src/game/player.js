import { screenDirToWorld } from '../engine/iso.js';

const WALK_SPEED = 3.2;   // tiles per second
const SPRINT_SPEED = 5.4;
const RADIUS = 0.28;      // collision radius in tiles

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.facing = { x: 0, y: 1 };
    this.moving = false;
    this.sprinting = false;
  }

  update(dt, input, map) {
    const intent = input.moveIntent();
    this.sprinting = input.sprinting();
    this.moving = intent.dx !== 0 || intent.dy !== 0;
    if (!this.moving) return;

    const dir = screenDirToWorld(intent.dx, intent.dy);
    this.facing = dir;
    const speed = this.sprinting ? SPRINT_SPEED : WALK_SPEED;

    // Axis-separated movement so the player slides along walls.
    this.moveAxis(dir.x * speed * dt, 0, map);
    this.moveAxis(0, dir.y * speed * dt, map);
  }

  moveAxis(dx, dy, map) {
    const nx = this.x + dx;
    const ny = this.y + dy;
    if (!this.collides(nx, ny, map)) {
      this.x = nx;
      this.y = ny;
    }
  }

  // Sample the four corners of the player's bounding square.
  collides(x, y, map) {
    return (
      map.isSolid(Math.floor(x - RADIUS), Math.floor(y - RADIUS)) ||
      map.isSolid(Math.floor(x + RADIUS), Math.floor(y - RADIUS)) ||
      map.isSolid(Math.floor(x - RADIUS), Math.floor(y + RADIUS)) ||
      map.isSolid(Math.floor(x + RADIUS), Math.floor(y + RADIUS))
    );
  }
}
