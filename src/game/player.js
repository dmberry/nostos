import { screenDirToWorld } from '../engine/iso.js';
import { ITEMS } from './items.js';

const WALK_SPEED = 3.2;   // tiles per second
const SPRINT_SPEED = 5.4;
const RADIUS = 0.28;      // collision radius in tiles
const REACH = 0.9;        // how far ahead the player can use a tool
const TREE_HP = 4;        // penknife swings to fell a tree
const WOOD_PER_TREE = 2;

const STAMINA_MAX = 100;
const SPRINT_DRAIN = 9;   // stamina per second while sprinting
const STAMINA_REGEN = 12; // per second when not sprinting

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.facing = { x: 0, y: 1 };
    this.moving = false;
    this.sprinting = false;

    this.health = 100;
    this.maxHealth = 100;
    this.stamina = STAMINA_MAX;
    this.maxStamina = STAMINA_MAX;

    this.hands = 'penknife';                 // starting tool
    this.pockets = [null, null, null, null]; // {item, qty} or null
    this.swingTimer = 0;
    this.message = null;                     // {text, ttl} transient HUD line
  }

  update(dt, input, map) {
    this.swingTimer = Math.max(0, this.swingTimer - dt);
    if (this.message) {
      this.message.ttl -= dt;
      if (this.message.ttl <= 0) this.message = null;
    }

    const intent = input.moveIntent();
    this.moving = intent.dx !== 0 || intent.dy !== 0;
    const wantSprint = input.sprinting() && this.moving;
    this.sprinting = wantSprint && this.stamina > 0;

    if (this.sprinting) {
      this.stamina = Math.max(0, this.stamina - SPRINT_DRAIN * dt);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + STAMINA_REGEN * dt);
    }

    if (this.moving) {
      const dir = screenDirToWorld(intent.dx, intent.dy);
      this.facing = dir;
      const speed = this.sprinting ? SPRINT_SPEED : WALK_SPEED;
      this.moveAxis(dir.x * speed * dt, 0, map);
      this.moveAxis(0, dir.y * speed * dt, map);
    }

    if (input.usePressed()) this.useHands(map);
  }

  // Swing the held tool at whatever is on the tile the player faces.
  useHands(map) {
    const tool = ITEMS[this.hands];
    if (!tool || tool.kind !== 'tool' || this.swingTimer > 0) return;

    const tx = Math.floor(this.x + this.facing.x * REACH);
    const ty = Math.floor(this.y + this.facing.y * REACH);
    const obj = map.objectAt(tx, ty);
    if (!obj || obj.type !== 'tree') return;
    if (this.stamina < tool.staminaCost) {
      this.say('Too exhausted to swing.');
      return;
    }

    this.swingTimer = tool.swingCooldown;
    this.stamina -= tool.staminaCost;
    obj.hp = (obj.hp ?? TREE_HP) - tool.treeDamage;
    obj.shake = 0.3;
    map.shaking.add(obj);

    if (obj.hp <= 0) {
      map.removeObject(obj);
      const stored = this.stow('wood', WOOD_PER_TREE);
      this.say(stored > 0
        ? `The tree comes down. +${stored} wood`
        : 'The tree comes down, but your pockets are full.');
    } else {
      this.say('You hack at the tree with the penknife.');
    }
  }

  // Add qty of an item to pockets, stacking first. Returns how many fitted.
  stow(itemKey, qty) {
    const def = ITEMS[itemKey];
    let left = qty;
    for (let i = 0; i < this.pockets.length && left > 0; i++) {
      const slot = this.pockets[i];
      if (slot && slot.item === itemKey && slot.qty < def.stack) {
        const take = Math.min(left, def.stack - slot.qty);
        slot.qty += take;
        left -= take;
      }
    }
    for (let i = 0; i < this.pockets.length && left > 0; i++) {
      if (!this.pockets[i]) {
        const take = Math.min(left, def.stack);
        this.pockets[i] = { item: itemKey, qty: take };
        left -= take;
      }
    }
    return qty - left;
  }

  say(text) {
    this.message = { text, ttl: 3 };
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
