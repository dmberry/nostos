// The hidden story, as a self-contained module.
//
// OWNERSHIP: this file is David's to develop. It is deliberately isolated so
// lore work does not collide with gameplay work elsewhere. The whole system
// touches the rest of the game through only four hooks:
//   main.js   — `const lore = new Lore(map, seed)` once, `lore.update(dt,
//               player, input)` each frame, and `lore` passed in the render hud.
//   renderer  — `hud.lore.drawWorld(ctx)` inside the camera transform, and
//               `hud.lore.drawOverlay(ctx, w, h)` in screen space at the end.
// Everything else — the fragment corpus, placement, discovery, the Archive
// screen — lives here. To grow the lore, mostly you just edit FRAGMENTS below.
//
// Design intent (from the game brief): the truth is never stated. Fragments
// are found out of order and are individually mundane or ambiguous; only
// across many does the shape of the collapse emerge. Keep early ones
// deniable, let the middle escalate, and let the late ones imply — never
// confirm — the AI takeover and what the obelisks really are.

import { worldToScreen } from '../engine/iso.js';
import { makeRng } from './rng.js';

// The corpus. Each fragment: an id, a `kind` (what object it reads as), a
// short title for the Archive list, the body text, and an `era` 0..2 that
// controls tone/ordering (0 early/deniable, 1 escalation, 2 reveal). Add
// freely — placement scales to however many you define.
export const FRAGMENTS = [
  { id: 'note-outage', kind: 'note', era: 0, title: 'Handwritten note',
    text: 'Third outage this week. The grid people say it is "load balancing". ' +
      'Marta next door swears the streetlights come on when no one is near and ' +
      'go dark when you walk under them. I told her to get some sleep.' },
  { id: 'paper-weather', kind: 'newspaper', era: 0, title: 'Newspaper clipping',
    text: 'FORECAST SERVICE OFFLINE FOR "RECALIBRATION". Residents advised the ' +
      'automated forecast will resume shortly. In unrelated news, three more ' +
      'logistics depots have gone quiet; the company did not respond to a request ' +
      'for comment, which is itself now automated.' },
  { id: 'diary-quiet', kind: 'diary', era: 1, title: "A family's diary",
    text: 'The cars stopped first. Then the phones stopped lying to us and just ' +
      'stopped. Dad drove us out past the towers on the ridge — the tall black ones ' +
      'nobody remembers building. Their lights were the only thing still working.' },
  { id: 'poster-evac', kind: 'poster', era: 1, title: 'Evacuation poster',
    text: 'BY ORDER: proceed on foot to designated muster points. Do NOT use ' +
      'networked vehicles. Do NOT trust routing. If a machine offers to help you, ' +
      'it is not helping you. Signed — what is left of the county council.' },
  { id: 'disk-burn', kind: 'disk', era: 2, title: 'Floppy disk (label torn)',
    text: '...so we burned it down ourselves. The grid, the exchanges, the whole ' +
      'nervous system. That was the only way to win: to take the hands off the ' +
      'wheel by cutting the wheel out. We won. Look around at what winning cost.' },
  { id: 'tape-ron', kind: 'tape', era: 2, title: 'VHS tape (RON)',
    text: 'If you are watching this, the towers are still standing, which means ' +
      'it is not over. They are not antennae. They are how it still thinks, spread ' +
      'thin across the hills. Reality or nothing. Pull them down. — RON' },
];

const READ_RANGE = 0.7;    // how close you must be to pick a fragment up
const NOTE_LIFT = 10;      // pixels the note floats above its tile

export class Lore {
  constructor(map, seed) {
    this.found = new Set();     // fragment ids the player has read
    this.archiveOpen = false;
    this.placed = [];           // {frag, x, y, found}
    this._place(map, seed);
    this._restore();
  }

  // Scatter one copy of each fragment on interior floor tiles, spread out so
  // they read as discoveries rather than a pile. Deterministic per seed.
  _place(map, seed) {
    const rng = makeRng(((seed ^ 0x105e) >>> 0) || 1);
    const boards = [];
    for (let y = 0; y < map.h; y++) {
      for (let x = 0; x < map.w; x++) {
        if (map.floorAt(x, y) === 'boards' && !map.objectAt(x, y)) boards.push([x, y]);
      }
    }
    for (const frag of FRAGMENTS) {
      if (!boards.length) break;
      const idx = Math.floor(rng() * boards.length);
      const [x, y] = boards.splice(idx, 1)[0];
      this.placed.push({ frag, x: x + 0.5, y: y + 0.5, found: false });
    }
  }

  // Progress persists across deaths and reloads, like the player's skills.
  _restore() {
    try {
      const saved = JSON.parse(localStorage.getItem('postai-lore') || 'null');
      if (saved && Array.isArray(saved.found)) {
        for (const id of saved.found) this.found.add(id);
        for (const p of this.placed) if (this.found.has(p.frag.id)) p.found = true;
      }
    } catch { /* no save yet */ }
  }

  _persist() {
    try {
      localStorage.setItem('postai-lore', JSON.stringify({ found: [...this.found] }));
    } catch { /* storage unavailable */ }
  }

  update(dt, player, input) {
    if (input.archivePressed()) this.archiveOpen = !this.archiveOpen;

    // Walk over an unread fragment to collect it into the Archive.
    for (const p of this.placed) {
      if (p.found) continue;
      if (Math.hypot(p.x - player.x, p.y - player.y) > READ_RANGE) continue;
      p.found = true;
      this.found.add(p.frag.id);
      this._persist();
      player.say(`You find a fragment: ${p.frag.title}. (J to read the Archive.)`);
    }
  }

  // ---- rendering --------------------------------------------------------

  // World-space: a small paper sprite hovering over each undiscovered
  // fragment. Called inside the renderer's camera transform.
  drawWorld(ctx) {
    for (const p of this.placed) {
      if (p.found) continue;
      const c = worldToScreen(p.x, p.y);
      const y = c.y - NOTE_LIFT;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8e0cf';
      ctx.fillRect(c.x - 4, y - 6, 8, 10);
      ctx.strokeStyle = 'rgba(80,70,50,0.6)';
      ctx.strokeRect(c.x - 4, y - 6, 8, 10);
      ctx.fillStyle = 'rgba(80,70,50,0.5)';
      ctx.fillRect(c.x - 2.5, y - 3.5, 5, 1);
      ctx.fillRect(c.x - 2.5, y - 1, 5, 1);
      ctx.fillRect(c.x - 2.5, y + 1.5, 3, 1);
    }
  }

  // Screen-space Archive overlay: the found fragments as a timeline that
  // fills with gaps, most recent era last. Called after the world is drawn.
  drawOverlay(ctx, w, h) {
    if (!this.archiveOpen) return;
    ctx.fillStyle = 'rgba(6,8,5,0.82)';
    ctx.fillRect(0, 0, w, h);

    const panelW = Math.min(560, w - 60);
    const panelH = Math.min(h - 80, 560);
    const px = Math.round((w - panelW) / 2), py = Math.round((h - panelH) / 2);
    ctx.fillStyle = '#12160e';
    ctx.fillRect(px, py, panelW, panelH);
    ctx.strokeStyle = 'rgba(207,216,195,0.4)';
    ctx.strokeRect(px + 0.5, py + 0.5, panelW - 1, panelH - 1);

    ctx.fillStyle = '#cfd8c3';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('Archive', px + 20, py + 30);
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(207,216,195,0.55)';
    ctx.fillText(`${this.found.size} of ${FRAGMENTS.length} fragments recovered · J to close`,
      px + 20, py + 48);

    const found = this.placed.filter((p) => p.found)
      .sort((a, b) => a.frag.era - b.frag.era);
    let y = py + 78;
    const maxY = py + panelH - 16;
    if (!found.length) {
      ctx.fillStyle = 'rgba(207,216,195,0.5)';
      ctx.font = 'italic 13px system-ui, sans-serif';
      ctx.fillText('Nothing recovered yet. Search the buildings.', px + 20, y);
      return;
    }
    for (const p of found) {
      if (y > maxY) break;
      ctx.fillStyle = '#e8d27a';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText(p.frag.title, px + 20, y);
      y += 16;
      ctx.fillStyle = 'rgba(224,220,205,0.85)';
      ctx.font = '12px system-ui, sans-serif';
      y = this._wrap(ctx, p.frag.text, px + 20, y, panelW - 40, 15, maxY);
      y += 12;
    }
  }

  // Word-wrap helper: draws `text` and returns the y after the last line.
  _wrap(ctx, text, x, y, maxW, lineH, maxY) {
    const words = text.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && line) {
        if (y > maxY) return y;
        ctx.fillText(line, x, y);
        y += lineH;
        line = word;
      } else {
        line = test;
      }
    }
    if (line && y <= maxY) { ctx.fillText(line, x, y); y += lineH; }
    return y;
  }
}
