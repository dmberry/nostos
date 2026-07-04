import { worldToScreen, screenToWorld } from './iso.js';
import { FLOORS } from '../game/tiles.js';
import { ITEMS } from '../game/items.js';

// Canvas renderer. Two passes per frame: floor diamonds first, then all
// "drawables" (objects + player) painter-sorted by world depth (x + y).
// Everything is placeholder art drawn in code; swapping in sprites later
// means replacing the draw* methods only.

const WALL_H = 40;
const DASH_H = 78; // dashboard panel height

const WALL_BASE = [122, 113, 102];
const TREE_TRUNK = '#5d4630';
const TREE_CANOPY = '#2f5d2b';
const ROCK_COLOR = '#8b8b84';

function shadeHex(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) * (1 + amount)));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) * (1 + amount)));
  const b = Math.max(0, Math.min(255, (n & 255) * (1 + amount)));
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function rgbScale([r, g, b], f) {
  return `rgb(${(r * f) | 0},${(g * f) | 0},${(b * f) | 0})`;
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.w = 0;
    this.h = 0;
    this.dpr = 1;
  }

  resize(w, h, dpr) {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
  }

  draw(camera, map, player, hud = {}) {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#0b0e0a';
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.save();
    camera.applyTransform(ctx, this.w, this.h);

    const range = this.visibleRange(camera, map);

    // Pass 1: floors. Non-overlapping, so order within the pass is free.
    for (let y = range.minY; y <= range.maxY; y++) {
      for (let x = range.minX; x <= range.maxX; x++) {
        const type = map.floorAt(x, y);
        if (type) this.drawFloor(x, y, type, map.shadeAt(x, y));
      }
    }

    // Pass 2: depth-sorted drawables. Objects use their tile centre for
    // depth; the player uses its continuous position.
    const drawables = [];
    for (const obj of map.objects) {
      if (obj.x < range.minX || obj.x > range.maxX || obj.y < range.minY || obj.y > range.maxY) continue;
      drawables.push({ depth: obj.x + obj.y + 1, obj });
    }
    drawables.push({ depth: player.x + player.y, player });
    drawables.sort((a, b) => a.depth - b.depth);

    for (const d of drawables) {
      if (d.player) this.drawPlayer(d.player);
      else this.drawObject(d.obj);
    }

    ctx.restore();
    this.drawDashboard(player, hud);
  }

  // Inverse-project the screen corners to get the visible tile bounding box.
  // Generous padding on the far side so tall objects just off-screen south
  // still draw their upper parts.
  visibleRange(camera, map) {
    const c = worldToScreen(camera.x, camera.y);
    const corners = [
      screenToWorld(c.x - this.w / 2, c.y - this.h / 2),
      screenToWorld(c.x + this.w / 2, c.y - this.h / 2),
      screenToWorld(c.x - this.w / 2, c.y + this.h / 2),
      screenToWorld(c.x + this.w / 2, c.y + this.h / 2),
    ];
    const xs = corners.map((p) => p.x);
    const ys = corners.map((p) => p.y);
    return {
      minX: Math.max(0, Math.floor(Math.min(...xs)) - 2),
      maxX: Math.min(map.w - 1, Math.ceil(Math.max(...xs)) + 4),
      minY: Math.max(0, Math.floor(Math.min(...ys)) - 2),
      maxY: Math.min(map.h - 1, Math.ceil(Math.max(...ys)) + 4),
    };
  }

  tileCorners(tx, ty, lift = 0) {
    const top = worldToScreen(tx, ty);
    const right = worldToScreen(tx + 1, ty);
    const bottom = worldToScreen(tx + 1, ty + 1);
    const left = worldToScreen(tx, ty + 1);
    if (lift) {
      top.y -= lift; right.y -= lift; bottom.y -= lift; left.y -= lift;
    }
    return [top, right, bottom, left];
  }

  diamondPath(corners) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    ctx.lineTo(corners[1].x, corners[1].y);
    ctx.lineTo(corners[2].x, corners[2].y);
    ctx.lineTo(corners[3].x, corners[3].y);
    ctx.closePath();
  }

  drawFloor(tx, ty, type, shade) {
    const ctx = this.ctx;
    const def = FLOORS[type];
    this.diamondPath(this.tileCorners(tx, ty));
    ctx.fillStyle = shadeHex(def.color, shade);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.07)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawObject(obj) {
    switch (obj.type) {
      case 'wall': this.drawWall(obj.x, obj.y); break;
      case 'tree': this.drawTree(obj); break;
      case 'rock': this.drawRock(obj.x, obj.y); break;
      case 'rubble': this.drawRubble(obj.x, obj.y); break;
    }
  }

  // A wall is an extruded diamond prism: two visible faces plus a top.
  drawWall(tx, ty) {
    const ctx = this.ctx;
    const [b0, b1, b2, b3] = this.tileCorners(tx, ty);
    const [t0, t1, t2, t3] = this.tileCorners(tx, ty, WALL_H);

    ctx.beginPath(); // south-west face
    ctx.moveTo(b3.x, b3.y); ctx.lineTo(b2.x, b2.y);
    ctx.lineTo(t2.x, t2.y); ctx.lineTo(t3.x, t3.y);
    ctx.closePath();
    ctx.fillStyle = rgbScale(WALL_BASE, 0.72);
    ctx.fill();

    ctx.beginPath(); // south-east face
    ctx.moveTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y);
    ctx.lineTo(t2.x, t2.y); ctx.lineTo(t1.x, t1.y);
    ctx.closePath();
    ctx.fillStyle = rgbScale(WALL_BASE, 0.55);
    ctx.fill();

    this.diamondPath([t0, t1, t2, t3]); // top
    ctx.fillStyle = rgbScale(WALL_BASE, 1);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawTree(obj) {
    const ctx = this.ctx;
    const c = worldToScreen(obj.x + 0.5, obj.y + 0.5);
    // Hit wobble: canopy and trunk-top sway while obj.shake ticks down.
    const wob = obj.shake ? Math.sin(obj.shake * 45) * obj.shake * 14 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = TREE_TRUNK;
    ctx.beginPath();
    ctx.moveTo(c.x - 3, c.y);
    ctx.lineTo(c.x + 3, c.y);
    ctx.lineTo(c.x + 3 + wob * 0.4, c.y - 26);
    ctx.lineTo(c.x - 3 + wob * 0.4, c.y - 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = TREE_CANOPY;
    ctx.beginPath();
    ctx.arc(c.x + wob, c.y - 38, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.arc(c.x + wob - 5, c.y - 43, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  drawRock(tx, ty) {
    const ctx = this.ctx;
    const c = worldToScreen(tx + 0.5, ty + 0.5);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + 1, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ROCK_COLOR;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y - 5, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.ellipse(c.x - 4, c.y - 8, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawRubble(tx, ty) {
    const ctx = this.ctx;
    const c = worldToScreen(tx + 0.5, ty + 0.5);
    const chunks = [
      [-8, -2, 7, 5], [2, -6, 8, 6], [-2, 2, 6, 4], [8, 0, 5, 4],
    ];
    for (const [ox, oy, rx, ry] of chunks) {
      ctx.fillStyle = rgbScale(WALL_BASE, 0.6 + (ox + 8) * 0.02);
      ctx.beginPath();
      ctx.ellipse(c.x + ox, c.y + oy - 3, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPlayer(player) {
    const ctx = this.ctx;
    const c = worldToScreen(player.x, player.y);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Torso
    ctx.fillStyle = player.sprinting ? '#c97f3e' : '#b0703c';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y - 14, 7, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.fillStyle = '#d9b48c';
    ctx.beginPath();
    ctx.arc(c.x, c.y - 29, 6, 0, Math.PI * 2);
    ctx.fill();
    // Swing feedback: the held tool flashes out ahead while swinging.
    if (player.swingTimer > 0) {
      const t = worldToScreen(player.x + player.facing.x * 0.6, player.y + player.facing.y * 0.6);
      ctx.strokeStyle = '#e8e0d0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y - 14);
      ctx.lineTo(t.x, t.y - 16);
      ctx.stroke();
    }
    // Facing indicator: a small dot ahead of the feet.
    const f = worldToScreen(player.x + player.facing.x * 0.45, player.y + player.facing.y * 0.45);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(f.x, f.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Dashboard ----------------------------------------------------------

  drawDashboard(player, hud) {
    const ctx = this.ctx;
    const top = this.h - DASH_H;

    ctx.fillStyle = 'rgba(12,15,10,0.88)';
    ctx.fillRect(0, top, this.w, DASH_H);
    ctx.fillStyle = 'rgba(207,216,195,0.25)';
    ctx.fillRect(0, top, this.w, 1);

    // Vitals
    this.drawBar(16, top + 18, 150, 9, player.health / player.maxHealth, '#b0392f', 'HEALTH');
    this.drawBar(16, top + 48, 150, 9, player.stamina / player.maxStamina, '#5f8f3e', 'STAMINA');

    // Hands slot
    const handsX = 210;
    this.drawLabel('HANDS', handsX, top + 14);
    this.drawSlot(handsX, top + 20, 44, ITEMS[player.hands], 0);
    if (player.hands) {
      ctx.fillStyle = 'rgba(207,216,195,0.7)';
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillText(ITEMS[player.hands].name, handsX, top + 74);
    }

    // Pockets
    const pocketsX = 286;
    this.drawLabel('POCKETS', pocketsX, top + 14);
    for (let i = 0; i < player.pockets.length; i++) {
      const slot = player.pockets[i];
      this.drawSlot(pocketsX + i * 42, top + 20, 36, slot ? ITEMS[slot.item] : null, slot ? slot.qty : 0);
    }

    // Stats block, right-aligned
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(207,216,195,0.85)';
    const state = player.sprinting ? 'Sprinting' : player.moving ? 'Walking' : 'Idle';
    ctx.fillText(state, this.w - 16, top + 22);
    ctx.fillText(`tile ${player.x.toFixed(1)}, ${player.y.toFixed(1)}`, this.w - 16, top + 40);
    ctx.fillText(`${hud.fps ?? 0} fps`, this.w - 16, top + 58);
    ctx.textAlign = 'left';

    // Transient message line above the panel
    if (player.message) {
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillStyle = `rgba(232,224,208,${Math.min(1, player.message.ttl)})`;
      ctx.fillText(player.message.text, 16, top - 12);
    }

    // Title chip, top-left of screen
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(207,216,195,0.6)';
    ctx.fillText('postAI', 12, 20);
  }

  drawLabel(text, x, y) {
    const ctx = this.ctx;
    ctx.font = '9px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(207,216,195,0.55)';
    ctx.fillText(text, x, y);
  }

  drawBar(x, y, w, h, frac, color, label) {
    const ctx = this.ctx;
    this.drawLabel(label, x, y - 5);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.max(0, Math.min(1, frac)) * w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  drawSlot(x, y, size, itemDef, qty) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = 'rgba(207,216,195,0.35)';
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    if (!itemDef) return;

    if (itemDef.name === 'Penknife') {
      // Tiny penknife icon: red handle, steel blade.
      const cx = x + size / 2, cy = y + size / 2;
      ctx.fillStyle = itemDef.color;
      ctx.fillRect(cx - 9, cy + 1, 12, 5);
      ctx.fillStyle = '#c9cdd1';
      ctx.beginPath();
      ctx.moveTo(cx + 3, cy + 1);
      ctx.lineTo(cx + 11, cy - 5);
      ctx.lineTo(cx + 3, cy + 4);
      ctx.closePath();
      ctx.fill();
    } else {
      // Generic resource: coloured square.
      ctx.fillStyle = itemDef.color;
      ctx.fillRect(x + 8, y + 8, size - 16, size - 16);
    }
    if (qty > 1) {
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillStyle = '#e8e0d0';
      ctx.textAlign = 'right';
      ctx.fillText(String(qty), x + size - 3, y + size - 4);
      ctx.textAlign = 'left';
    }
  }
}
