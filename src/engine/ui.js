// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// Screen-space UI drawing (HUD overlays, modals), split out of renderer.js to
// keep that file navigable — part of the systems-registry refactor's file-size
// split; see docs/refactor-registry.md. This is NOT registry work: the HUD is
// drawn inside the renderer's draw pass, not as a per-frame system.
//
// These are Renderer methods, moved verbatim and mixed onto Renderer.prototype
// (renderer.js does `Object.assign(Renderer.prototype, uiMethods)`), so `this`
// is still the renderer: they keep using this.ctx / this.w / this.h and every
// call site in renderer.js is unchanged. The file split is physical, for
// readability; the methods stay renderer behaviour.
//
// DASH_H (the dashboard panel height) lives here because it is a UI dimension;
// renderer.js imports it back for the world-draw clip (this.h - DASH_H). ui.js
// imports nothing from renderer.js, so there is no import cycle.

import { ITEMS, WEAPON_ORDER } from '../game/items.js'; // weapon-chart data
import { ARMOUR_SLOTS, armourPoints, armourReduction, durFraction } from '../game/armour.js';
import { PAPER_TEXTURE, NOKIA_SPRITE } from './textures.js'; // death-cert paper; the 3310 in the PHONE box
import {
  NARROWS_W, VIEW_ROWS, MONSTERS, HULL_MAX, RAM_MAX, CHARYBDIS_ROWS,
  narrowsProgress, narrowsCalm, narrowsRunOut, narrowsRunOutT,
} from '../game/narrows.js'; // the Scylla/Charybdis arcade run
import { PADDLE_H, calypsoVoice } from '../game/calypso-pong.js'; // Calypso's un-winnable pong

// What an empty armour slot says it is for, so the column teaches itself.
const ARMOUR_SLOT_LABEL = { head: 'HEAD', chest: 'BODY', legs: 'LEGS', feet: 'FEET' };
export const DASH_H = 78; // dashboard panel height

// The rank for the certificate, banded purely by score.
export function deathRank(score) {
  const s = score || 0;
  let title, blurb;
  // The ladder is the Odyssey in miniature: from washed-up nobody to the homecoming
  // (nostos) that is the game's whole win-condition. Most rungs are real epithets of
  // Odysseus — polytropos (man of twists), polytlas (long-enduring), ptoliporthos
  // (sacker of cities) — and NOBODY is the Cyclops gambit (Outis / No-one).
  if (s <= 0) { title = 'FLOTSAM'; blurb = 'The sea spat you back. Even it did not want you.'; }
  else if (s < 100) { title = 'LOTUS-EATER'; blurb = 'You forgot why you came, and were content. Briefly.'; }
  else if (s < 200) { title = 'CASTAWAY'; blurb = 'Ashore, alive, and clueless. Two out of three.'; }
  else if (s < 300) { title = 'OARSMAN'; blurb = 'You pulled your weight. The oar broke anyway.'; }
  else if (s < 400) { title = 'WANDERER'; blurb = 'Gloriously lost. A credit to the current.'; }
  else if (s < 600) { title = 'MARINER'; blurb = 'Salt in the beard, and a healthy fear of rivers.'; }
  else if (s < 800) { title = 'HELMSMAN'; blurb = 'You read the water now. It still lies to you.'; }
  else if (s < 1200) { title = 'RAIDER'; blurb = 'Nobody laughed at your spear. Nobody.'; }
  else if (s < 1500) { title = 'TROJAN'; blurb = 'You left a gift. It was not a gift.'; }
  else if (s < 2000) { title = 'NOBODY'; blurb = 'You told the giant your name was No-one. It worked.'; }
  else if (s < 3000) { title = 'MAN OF TWISTS'; blurb = 'You hunt the things that hunt you, sideways.'; }
  else if (s < 4000) { title = 'GOD-BELOVED'; blurb = 'The towers whisper your name, and something answers.'; }
  else if (s < 5000) { title = 'LONG-ENDURING'; blurb = 'You outlasted the sea, the gods, and your own crew.'; }
  else if (s < 10000) { title = 'SACKER OF CITIES'; blurb = 'Small children draw you pulling down obelisks.'; }
  else { title = 'HOMECOMER'; blurb = 'You reached Ithaca. POSEIDON has a folder named after you. It is afraid.'; }
  const colors = { FLOTSAM: '#9a7a5a', 'LOTUS-EATER': '#c9905a', CASTAWAY: '#c9a05a', OARSMAN: '#c9b05a', WANDERER: '#b9c95a', MARINER: '#9fd058', HELMSMAN: '#6fbf4a', RAIDER: '#4abf7a', TROJAN: '#4ac0b0', NOBODY: '#4aa8d8', 'MAN OF TWISTS': '#6f8fe0', 'GOD-BELOVED': '#e8d27a', 'LONG-ENDURING': '#f0c040', 'SACKER OF CITIES': '#f09040', HOMECOMER: '#ff5040' };
  return { title, blurb, color: colors[title] || '#e8d27a' };
}

// The four island daemons, in the order their chips are drawn on the Record
// panel. CALYPSO is in the roster even though she is left rather than killed:
// her refunction is her fall, and it counts toward the same four.
// AEGILIA -> Aegilia. The roster and the terminals speak in caps; the HUD
// says the names the way a person would.
function sentenceCase(s) {
  return String(s || '').replace(/[A-Za-z\u00C0-\u024F']+/g,
    (wd) => wd.charAt(0).toUpperCase() + wd.slice(1).toLowerCase());
}

const AI_ROSTER = ['CALYPSO', 'POLYPHEMUS', 'CIRCE', 'HELIOS'];
const CHIPS_H = 58;   // the bottom band the chip row reserves in the panel

export const uiMethods = {
  // A soft dim over the play area while the player rests (the dashboard, and
  // so the spinning clock, stays bright so you can watch time pass).
  drawRestOverlay(dim) {
    const ctx = this.ctx;
    const playH = this.h - DASH_H;
    ctx.fillStyle = `rgba(4,6,10,${dim.toFixed(3)})`;
    ctx.fillRect(0, 0, this.w, playH);
    ctx.save();
    ctx.globalAlpha = Math.min(1, dim / 0.72);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(222,227,236,0.92)';
    ctx.font = '600 20px system-ui, sans-serif';
    ctx.fillText('Resting…', this.w / 2, playH / 2);
    ctx.fillStyle = 'rgba(200,205,215,0.7)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('time is passing', this.w / 2, playH / 2 + 22);
    ctx.restore();
  },

  // Lotus torpor: a warm golden wash and a soft vignette closing in — the
  // dreamy tunnel-vision of the lotus-eaters. Eases off in the last few seconds
  // as the daze lets go. Play-area only; the dashboard stays clear.
  drawTorporHaze(t) {
    const ctx = this.ctx;
    const playH = this.h - DASH_H;
    const amt = Math.min(1, t / 3);
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 900);
    ctx.fillStyle = `rgba(196,150,70,${(0.13 * amt + 0.05 * amt * pulse).toFixed(3)})`;
    ctx.fillRect(0, 0, this.w, playH);
    const g = ctx.createRadialGradient(this.w / 2, playH / 2, playH * 0.25, this.w / 2, playH / 2, playH * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(20,14,6,${(0.5 * amt).toFixed(3)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, playH);
  },

  // A flat sepia-yellow wash plus an uneven fluorescent flicker (two
  // overlapping slow sine phases rather than one clean pulse, so it never
  // reads as a deliberate light show) — cheap, screen-space, and enough on
  // its own to make the underworld read as somewhere else without needing
  // per-tile texture work.
  drawUnderworldVeil() {
    const ctx = this.ctx;
    const playH = this.h - DASH_H;
    const flicker = 0.5 + 0.5 * Math.sin(performance.now() / 340) * 0.6 + 0.4 * Math.sin(performance.now() / 970 + 1.7);
    ctx.fillStyle = `rgba(150,132,60,${(0.16 + 0.05 * flicker).toFixed(3)})`;
    ctx.fillRect(0, 0, this.w, playH);
    ctx.fillStyle = `rgba(30,26,10,${(0.12 - 0.04 * flicker).toFixed(3)})`;
    ctx.fillRect(0, 0, this.w, playH);
  },

  // A simple dimming overlay + centred label while paused (P).
  drawPausedOverlay() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(4,6,3,0.55)';
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8e0d0';
    ctx.font = 'bold 28px Georgia, serif';
    ctx.fillText('PAUSED', this.w / 2, this.h / 2 - 8);
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(207,216,195,0.75)';
    ctx.fillText('Press P to resume', this.w / 2, this.h / 2 + 18);
    ctx.textAlign = 'left';
  },

  // The daemon's death-aria caption. Screen-space band, upper third, on a soft
  // scrim so it reads over any terrain. Tier colour telegraphs the register.
  drawDaemonVoice(voice) {
    const ctx = this.ctx, W = this.w, H = this.h;
    const toneMap = { wrath: [255, 210, 59], mercy: [255, 176, 102], dying: [143, 230, 255] };
    const rgb = toneMap[voice.tier] || [232, 224, 208];
    const tone = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    const a = Math.max(0, Math.min(1, voice.ttl / 0.8));   // fade out over the last 0.8s
    // Wrap the line to a comfortable measure.
    ctx.font = 'italic 18px Georgia, "Times New Roman", serif';
    const maxW = Math.min(560, W - 80);
    const words = voice.text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    }
    if (cur) lines.push(cur);
    const lineH = 25, padX = 22, padY = 16, tagH = 20;
    const boxW = maxW + padX * 2;
    const boxH = padY * 2 + tagH + lines.length * lineH;
    const bx = (W - boxW) / 2, by = H * 0.14;
    ctx.save();
    ctx.globalAlpha = a;
    // Scrim.
    ctx.fillStyle = 'rgba(6,8,14,0.72)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx, by, boxW, boxH, 8); else ctx.rect(bx, by, boxW, boxH);
    ctx.fill();
    ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.5)`;
    ctx.lineWidth = 1.5; ctx.stroke();
    // Speaker tag.
    ctx.textAlign = 'left';
    ctx.font = '700 12px ui-monospace, "SF Mono", Menlo, monospace';
    ctx.fillStyle = tone;
    ctx.fillText(`${(voice.ai || 'ZEUS')} ▸`, bx + padX, by + padY + 12);
    // Lines.
    ctx.font = 'italic 18px Georgia, "Times New Roman", serif';
    ctx.fillStyle = '#eef2f6';
    let y = by + padY + tagH + 16;
    for (const ln of lines) { ctx.fillText(ln, bx + padX, y); y += lineH; }
    ctx.restore();
    ctx.textAlign = 'left';
  },

  // The AI-defeated celebration: a fireworks level-up modal. Time-based particle
  // bursts over a dimmed backdrop, with the daemon tally and score.
  drawAiVictory(v) {
    const ctx = this.ctx, W = this.w, H = this.h;
    ctx.fillStyle = 'rgba(6,8,14,0.82)';
    ctx.fillRect(0, 0, W, H);

    // Fireworks particle system (kept on the renderer between frames).
    this._fw ??= [];
    const now = performance.now();
    const dt = this._fwLast ? Math.min(0.05, (now - this._fwLast) / 1000) : 0.016;
    this._fwLast = now;
    this._fwSpawnT = (this._fwSpawnT ?? 0) - dt;
    if (this._fwSpawnT <= 0) {
      this._fwSpawnT = 0.3 + Math.random() * 0.45;
      const bx = W * (0.18 + Math.random() * 0.64), by = H * (0.12 + Math.random() * 0.4);
      const hue = Math.floor(Math.random() * 360), n = 26 + Math.floor(Math.random() * 22);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, sp = 70 + Math.random() * 110;
        this._fw.push({ x: bx, y: by, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, ttl: 1.1 + Math.random() * 0.7, max: 1.8, hue });
      }
    }
    for (const p of this._fw) { p.ttl -= dt; p.vy += 100 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.99; }
    this._fw = this._fw.filter((p) => p.ttl > 0);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this._fw) {
      const a = Math.max(0, p.ttl / p.max);
      ctx.fillStyle = `hsla(${p.hue},95%,62%,${a.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // Text.
    const cx = W / 2, y0 = H * 0.33;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23b'; ctx.font = 'bold 46px system-ui, sans-serif';
    ctx.fillText(`${(v.ai || 'AI').toUpperCase()} SILENCED`, cx, y0);
    ctx.fillStyle = '#e6eaf0'; ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(`Daemon ${v.daemon} of ${v.daemons} felled`, cx, y0 + 42);
    ctx.fillStyle = '#9fb0c0'; ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(`${v.powered} machines powered down across the island`, cx, y0 + 74);
    // The daemon's last words, cut off by its own death.
    if (v.lastWords) {
      ctx.fillStyle = '#8fe6ff'; ctx.font = 'italic 17px Georgia, "Times New Roman", serif';
      ctx.fillText(`“…${v.lastWords}—”`, cx, y0 + 108);
    }
    ctx.fillStyle = '#7fe0a0'; ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(`Score  ${v.score}`, cx, y0 + 154);
    // The testament recovered from the dead core.
    if (v.book) {
      ctx.fillStyle = '#c9b98f'; ctx.font = '14px Georgia, "Times New Roman", serif';
      ctx.fillText(`A machine testament falls from the dark core: “${v.book}” — added to your scrapbook`, cx, y0 + 186);
    }
    // The dismiss hint appears only once the modal will actually honour it
    // (main.js ignores Space/Enter for the first seconds so the fireworks play).
    const shownFor = v.shownAt ? (performance.now() - v.shownAt) : 0;
    if (shownFor > 3000) {
      ctx.fillStyle = '#8894a4'; ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('SPACE to sail on', cx, y0 + 220);
    }
    ctx.textAlign = 'left';
  },

  // Crops the certificate panel out of the live canvas and copies it to the
  // clipboard as a PNG, so it can be pasted to share outside the game.
  // Returns 'clipboard', or null if there was nothing to capture or the
  // browser won't allow copying images.
  async shareCertificate() {
    const b = this._certBounds;
    if (!b) return null;
    const dpr = this.dpr || 1;
    const off = document.createElement('canvas');
    off.width = Math.round(b.w * dpr);
    off.height = Math.round(b.h * dpr);
    off.getContext('2d').drawImage(
      this.canvas,
      Math.round(b.x * dpr), Math.round(b.y * dpr), Math.round(b.w * dpr), Math.round(b.h * dpr),
      0, 0, off.width, off.height,
    );
    const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
    if (!blob) return null;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        return 'clipboard';
      }
    } catch { /* denied or unsupported */ }
    return null;
  },

  // THE ARMOURY (V): every weapon in the game, what it does, and what it costs
  // to swing. Found ones are named and rated; ones still to find are faded and
  // unnamed, and their numbers are withheld too — a blank row that still showed
  // the rating told you what was coming.
  //
  // The rating is DERIVED, not declared. It used to read `def.power`, a field
  // no weapon in items.js has, so every bar drew at 1/10 and every row said the
  // same thing. It is damage against machines now, scaled against the best
  // weapon in the list, which is the comparison the panel is for.
  drawWeaponChart(player) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(6,8,5,0.82)';
    ctx.fillRect(0, 0, this.w, this.h);
    const pw = Math.min(520, this.w - 50);
    const n = WEAPON_ORDER.length;
    const ph = Math.min(this.h - 60, 92 + n * 34);
    const px = Math.round((this.w - pw) / 2), py = Math.round((this.h - ph) / 2);
    // Rows shrink to the room there is rather than running off the bottom.
    const rowH = Math.max(22, Math.min(34, Math.floor((ph - 92) / n)));
    const twoLine = rowH >= 28;
    this._weaponsRect = { x: px, y: py, w: pw, h: ph }; // click-away-to-close hit test (main.js)
    ctx.fillStyle = '#12160e';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = 'rgba(207,216,195,0.4)';
    ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);

    const padR = 20, lblW = 26, barW = 84;
    const barX = px + pw - padR - lblW - barW;
    const rate = (d) => d.robotDamage || d.animalDamage || 1;
    const best = Math.max(...WEAPON_ORDER.map((k) => (ITEMS[k] ? rate(ITEMS[k]) : 1)));

    ctx.fillStyle = '#cfd8c3';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('Armoury', px + 20, py + 30);
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(207,216,195,0.55)';
    const found = WEAPON_ORDER.filter((k) => player.weaponsFound && player.weaponsFound.has(k)).length;
    ctx.fillText(`${found} of ${n} found \u00b7 V to close`, px + 20, py + 48);
    // A column head, so the number at the end of each row does not have to
    // carry its own label eighteen times over.
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(207,216,195,0.4)';
    ctx.fillText('VS MACHINES', barX, py + 48);

    let y = py + 68;
    for (const key of WEAPON_ORDER) {
      const def = ITEMS[key];
      if (!def) continue;
      const has = player.weaponsFound && player.weaponsFound.has(key);
      ctx.globalAlpha = has ? 1 : 0.32;
      this.drawItemIcon(def, px + 34, y + (twoLine ? 13 : 9), 0.7);
      ctx.fillStyle = '#e8e0d0';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText(has ? def.name : '??? undiscovered', px + 58, y + (twoLine ? 11 : 13));
      // The small print: reach, what it does to animals, what a swing costs.
      // Withheld until found, like the name.
      if (twoLine) {
        ctx.font = '9.5px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(207,216,195,0.55)';
        ctx.fillText(has ? this.weaponStatLine(def) : '', px + 58, y + 23);
      }
      const pwr = rate(def);
      const by = y + (twoLine ? 4 : 5);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(barX, by, barW, 8);
      if (has) {
        ctx.fillStyle = '#e8d27a';
        ctx.fillRect(barX, by, Math.max(3, barW * (pwr / best)), 8);
      }
      ctx.fillStyle = 'rgba(207,216,195,0.7)';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(has ? String(pwr) : '?', px + pw - padR, by + 8);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
      y += rowH;
    }
  },

  // One line of small print for a weapon: how far it reaches and on what, what
  // it does to an animal, and what the swing costs you.
  weaponStatLine(def) {
    const bits = [];
    if (def.range) bits.push(`reach ${def.range}${def.ammoType ? ` \u00b7 ${(ITEMS[def.ammoType] || {}).name || def.ammoType}` : ''}`);
    else bits.push('in hand');
    if (def.animalDamage) bits.push(`${def.animalDamage} vs animals`);
    if (def.treeDamage) bits.push(`fells at ${def.treeDamage}`);
    if (def.staminaCost) bits.push(`${def.staminaCost} stamina`);
    return bits.join(' \u00b7 ');
  },

  // The skills screen (K): learned book-skills in the order gained, plus the
  // three practice tracks and their levels — the history the dashboard used
  // to cram into one line.
  drawSkillModal(player, hud = {}) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(6,8,5,0.8)';
    ctx.fillRect(0, 0, this.w, this.h);
    // RESPONSIVE. On a narrow phone the panel used to keep desktop metrics and
    // simply overflow: 420 wide against a 330-wide viewport, 13px stats, 20px
    // rows. Everything below scales off `k`, so the same panel shrinks to fit a
    // handset and still reads.
    const pw = Math.min(420, this.w - 28);
    const k = Math.max(0.78, Math.min(1, pw / 420));      // 1 on desktop, ~0.8 on a phone
    const fs = (n) => `${Math.round(n * k)}px system-ui, sans-serif`;
    const fsb = (n) => `bold ${Math.round(n * k)}px system-ui, sans-serif`;
    const row = Math.round(19 * k), pad = Math.round(20 * k);

    // The panel is sized to its CONTENT rather than to a fixed height. It used
    // to be a fixed 486 with the chip row pinned to the floor, which left a hole
    // in the middle of an early run (no books, three obelisks) and clipped a late
    // one. Measure first, then draw: every block reports its height, the OB list
    // is wrapped against the real font, and the panel is whatever the sum comes
    // to — clamped so it can never outgrow the viewport.
    const bookLog = player.skillLog && player.skillLog.length ? player.skillLog
      : [...(player.skills || [])].map((s) => ({ skill: s }));
    ctx.font = `${Math.round(12 * k)}px ui-monospace, monospace`;
    // The roll of downed obelisks moved to KLEOS (#130); the Record keeps the
    // count on its OBs stat and no longer reserves height for the list.
    const H_HEAD = Math.round(68 * k);                                    // title + subtitle
    const H_RECORD = pad + 3 * row + Math.round(12 * k);                    // heading + 3 rows
    const H_PRACTICE = pad + Math.round(26 * k);                           // heading + one inline row
    const H_BOOKS = pad + (bookLog.length ? bookLog.length * pad : pad) + Math.round(12 * k);
    const H_OBS = 0;
    const H_CHIPS = Math.round((18 + 34 + 14) * k);                         // heading + chip + pad
    const ph = Math.min(this.h - 40,
      H_HEAD + H_RECORD + H_PRACTICE + H_BOOKS + H_OBS + H_CHIPS + 14);
    const px = Math.round((this.w - pw) / 2), py = Math.round((this.h - ph) / 2);
    this._skillsRect = { x: px, y: py, w: pw, h: ph }; // click-away-to-close hit test (main.js)
    ctx.fillStyle = '#12160e';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = 'rgba(207,216,195,0.4)';
    ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);

    ctx.fillStyle = '#cfd8c3';
    ctx.font = fsb(16);
    ctx.fillText('Skills & Knowledge', px + pad, py + Math.round(30 * k));
    ctx.font = fs(11);
    ctx.fillStyle = 'rgba(207,216,195,0.55)';
    ctx.fillText('K to close · all of it survives death', px + pad, py + Math.round(48 * k));

    // THE RECORD — score, the rank it has earned, and the run's tallies. This
    // lives here rather than on the HUD: the dashboard should carry only what
    // you need mid-fight, and a rank is something you look up, not something you
    // steer by. Two columns so six figures cost three rows.
    let y = py + Math.round(76 * k);
    ctx.font = fsb(12);
    ctx.fillStyle = 'rgba(207,216,195,0.6)';
    ctx.fillText('RECORD', px + pad, y); y += pad;

    const rank = deathRank(player.score ?? 0);
    const colL = px + Math.round(30 * k), colR = px + Math.round(pw / 2) + Math.round(10 * k);
    const valDx = Math.round(84 * k);
    const stat = (label, value, cx, cy, valueColor) => {
      ctx.font = fs(11);
      ctx.fillStyle = 'rgba(207,216,195,0.5)';
      ctx.fillText(label, cx, cy);
      ctx.font = fsb(13);
      ctx.fillStyle = valueColor || '#e8e0d0';
      ctx.fillText(String(value), cx + valDx, cy);
    };
    const kills = (player.killLog || []).length;
    stat('Score',       player.score ?? 0,                    colL, y, '#e8d27a');
    stat('Islands',     `${hud.islandsReached ?? 0} / 5`,     colR, y);
    y += row;
    stat('Rank',        rank.title,                           colL, y, rank.color);
    stat('OBs',         kills,                                colR, y);
    y += row;
    // The POSEIDON deadline lives here now rather than on the dashboard, where a
    // ticking number became wallpaper. In play you feel it through his notices;
    // this is where you come to check the actual figure.
    stat('Deaths',      player.deaths || 0,                   colL, y);
    // Bare clock: the label already says what it is counting down to, and the
    // full "to POSEIDON" ran off the panel edge.
    const deadline = (hud.timeLabel || '').replace(/\s*to\s+POSEIDON\s*$/i, '') || '—';
    stat('Deadline',    deadline,                             colR, y, '#d88a6a');
    y += Math.round(26 * k);

    // PRACTICE, on ONE line. Three tracks at level 0 do not deserve three rows
    // of a panel that was already running out of room.
    ctx.font = fsb(12);
    ctx.fillStyle = 'rgba(207,216,195,0.6)';
    ctx.fillText('PRACTICE', px + pad, y); y += pad;
    const tracks = [['Swordarm', 'melee'], ['Aim', 'guns'], ['Mind', 'knowledge']];
    const tw3 = Math.floor((pw - pad * 2) / 3);
    tracks.forEach(([label, key], i) => {
      const tx = px + Math.round(30 * k) + i * tw3;
      const lvl = player.xpLevel ? player.xpLevel(key) : 0;
      ctx.font = fs(11);
      ctx.fillStyle = 'rgba(207,216,195,0.5)';
      ctx.fillText(label, tx, y);
      const lw = ctx.measureText(label).width;
      ctx.font = fsb(13);
      ctx.fillStyle = '#e8d27a';
      ctx.fillText(String(lvl), tx + lw + Math.round(6 * k), y);
    });
    y += Math.round(26 * k);   // the values sit ON y, so this is the gap to the next heading

    ctx.font = fsb(12);
    ctx.fillStyle = 'rgba(207,216,195,0.6)';
    ctx.fillText('BOOKS READ', px + pad, y); y += pad;
    if (!bookLog.length) {
      ctx.fillStyle = 'rgba(207,216,195,0.5)';
      ctx.font = `italic ${Math.round(12 * k)}px system-ui, sans-serif`;
      ctx.fillText('No books read yet. Find them in the ruins.', px + Math.round(30 * k), y);
      y += pad;
    } else {
      const NAMES = { woodcraft: 'Woodcraft', herbalism: 'Herbalism', tracking: 'Tracking', fleetfoot: 'Fleet foot' };
      ctx.font = fs(12);
      let n = 1;
      for (const e of bookLog) {
        ctx.fillStyle = '#e8e0d0';
        ctx.fillText(`${n}. ${NAMES[e.skill] || e.skill}`, px + Math.round(30 * k), y);
        if (e.day) {
          ctx.fillStyle = 'rgba(207,216,195,0.5)';
          ctx.textAlign = 'right';
          ctx.fillText(`day ${e.day}`, px + pw - pad, y);
          ctx.textAlign = 'left';
        }
        y += pad; n += 1;
      }
    }

    // AIs DEFEATED — the four daemons drawn as actual silicon, a row of DIP
    // packages with their legs and their pin-1 notch, each one named on its
    // back the way a real chip is. A defeated daemon's part is dead: struck
    // through, its legs dulled, the body gone cold.
    y += Math.round(16 * k);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = fsb(12);
    ctx.fillStyle = 'rgba(207,216,195,0.6)';
    ctx.fillText('AIs DEFEATED', px + pad, y);
    y += Math.round(10 * k);

    const down = new Set(player.aisDown || []);
    const gap = Math.round(8 * k);
    const cw = Math.floor((pw - pad * 2 - gap * (AI_ROSTER.length - 1)) / AI_ROSTER.length);
    AI_ROSTER.forEach((name, i) => {
      this.drawSiliconChip(px + pad + i * (cw + gap), y, cw, Math.round(30 * k), name, down.has(name));
    });
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  },

  // One AI as a DIP-package chip: a dark body with silver legs down both long
  // edges, a pin-1 notch bitten out of the left end, and the daemon's name
  // silkscreened across the back. `dead` kills it — the body goes cold and
  // green-black, the legs dull, and the name is struck through.
  drawSiliconChip(x, y, w, h, label, dead) {
    const ctx = this.ctx;
    const legH = 4;                       // the legs stick out top and bottom
    const by = y + legH, bh = h - legH * 2;

    // Legs first, so the body sits over their roots.
    const nLegs = Math.max(3, Math.floor((w - 10) / 11));
    const step = (w - 12) / nLegs;
    ctx.fillStyle = dead ? 'rgba(120,132,116,0.45)' : 'rgba(198,206,190,0.75)';
    for (let i = 0; i < nLegs; i++) {
      const lx = x + 6 + i * step + step * 0.5 - 2.5;
      ctx.fillRect(Math.round(lx), y, 5, legH + 1);                 // top row
      ctx.fillRect(Math.round(lx), by + bh - 1, 5, legH + 1);       // bottom row
    }

    // Body.
    ctx.fillStyle = dead ? '#141a12' : '#22261d';
    this.roundRect(x, by, w, bh, 3); ctx.fill();
    ctx.strokeStyle = dead ? 'rgba(140,190,120,0.5)' : 'rgba(207,216,195,0.28)';
    ctx.lineWidth = 1;
    this.roundRect(x + 0.5, by + 0.5, w - 1, bh - 1, 3); ctx.stroke();

    // Pin-1 notch, bitten out of the left end — the tell that says "chip".
    ctx.fillStyle = 'rgba(6,8,5,0.95)';
    ctx.beginPath();
    ctx.arc(x, by + bh / 2, 3.5, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    // The name, silkscreened.
    ctx.font = 'bold 8px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = dead ? 'rgba(150,200,130,0.9)' : 'rgba(207,216,195,0.7)';
    const midY = by + bh / 2;
    ctx.fillText(label, x + w / 2 + 1, midY);
    if (dead) {
      const tw = Math.min(ctx.measureText(label).width + 6, w - 10);
      ctx.strokeStyle = 'rgba(150,200,130,0.9)';
      ctx.beginPath();
      ctx.moveTo(x + (w - tw) / 2 + 1, midY + 0.5);
      ctx.lineTo(x + (w + tw) / 2 + 1, midY + 0.5);
      ctx.stroke();
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  },

  // A quiet now-playing toast, centred just above the dashboard: artist,
  // album, side label. Fades out over its last second. Subtle by design —
  // it's liner notes, not an announcement.
  drawToast(t) {
    const ctx = this.ctx;
    const alpha = Math.min(1, t.ttl) * 0.85;
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    // Sit well above the HUD panel so it clears the touch/help hint DOM line
    // (bottom-anchored just over the panel) — on a narrow phone screen the two
    // used to land on the same row and overlap into garbled text.
    const y = (this.hudTop != null ? this.hudTop : this.h - 100) - 46;
    ctx.fillStyle = `rgba(10,12,9,${(alpha * 0.6).toFixed(3)})`;
    const w = ctx.measureText(t.text).width + 16;
    ctx.fillRect(this.w / 2 - w / 2, y - 13, w, 18);
    ctx.fillStyle = `rgba(222,214,192,${alpha.toFixed(3)})`;
    ctx.fillText(t.text, this.w / 2, y);
    ctx.textAlign = 'left';
  },

  // The Nokia 3310 SMS toast — Calypso's texts (docs/calypso-nokia-plan.md). An
  // 84x48-feel pea-green backlit LCD in a dark plastic bezel, lower-right where a
  // phone sits (clear of the say() narration, lower-left), above the help hint.
  // On touch screens it slides left so it never covers the RUN/JUMP buttons,
  // which own that same lower-right corner. t = { header, lines, ttl, total }.
  drawNokiaToast(t, bars = 4, touch = false) {
    const ctx = this.ctx;
    const a = Math.min(Math.min(1, (t.total - t.ttl) / 0.22), Math.min(1, t.ttl / 0.8));
    if (a <= 0) { this._nokiaToastRect = null; return; }
    const W = 214, padX = 12, headH = 20, lineH = 15;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = '12px ui-monospace, "Courier New", monospace';
    const lines = [];
    for (const ln of t.lines) lines.push(...this._wrapText(ctx, ln, W - padX * 2));
    const H = headH + lines.length * lineH + 12;
    // Touch: the RUN/JUMP column occupies roughly the last 90px of the right
    // edge above the dashboard — step the toast left of it.
    const x = this.w - W - 14 - (touch ? 90 : 0);
    const y = (this.hudTop != null ? this.hudTop : this.h - 100) - H - 40;
    // Remembered so a tap on the handset can hurry it along (main.js).
    this._nokiaToastRect = { x: x - 6, y: y - 6, w: W + 12, h: H + 12 };
    // Dark plastic bezel.
    ctx.fillStyle = '#191c14';
    ctx.fillRect(x - 6, y - 6, W + 12, H + 12);
    // The backlit pea-green LCD.
    ctx.fillStyle = '#9fb98a';
    ctx.fillRect(x, y, W, H);
    ctx.fillStyle = 'rgba(60,74,44,0.10)';   // faint horizontal pixel grid
    for (let sy = y + 2; sy < y + H; sy += 3) ctx.fillRect(x, sy, W, 1);
    const INK = '#2b3420';
    // Status row: LIVE signal bars (left — stronger the nearer you are to Calypso),
    // sender header, battery (right).
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i < bars ? INK : 'rgba(43,52,32,0.25)';
      ctx.fillRect(x + padX + i * 4, y + 12 - i * 2 - 2, 3, i * 2 + 3);
    }
    ctx.fillStyle = INK;
    ctx.font = 'bold 11px ui-monospace, "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(t.header, x + W / 2, y + 12);
    ctx.strokeStyle = INK; ctx.lineWidth = 1;
    ctx.strokeRect(x + W - padX - 15, y + 4, 12, 7); ctx.fillRect(x + W - padX - 3, y + 6, 2, 3); // battery
    ctx.fillRect(x + W - padX - 14, y + 5, 10, 5);
    // A thin divider under the status row.
    ctx.fillRect(x + padX, y + headH - 4, W - padX * 2, 1);
    // The message body.
    ctx.textAlign = 'left';
    ctx.font = '12px ui-monospace, "Courier New", monospace';
    let ly = y + headH + 10;
    for (const ln of lines) { ctx.fillText(ln, x + padX, ly); ly += lineH; }
    ctx.restore();
    ctx.textAlign = 'left';
  },

  // Right-click inspection tooltip, near the cursor.
  // A tooltip in two registers. `text` is what the thing is called, set as it
  // always was. `sub` is what it is FOR (items.js `use`), set smaller, italic
  // and a shade dimmer, so the name still reads at a glance and the sentence
  // under it does not shout. The right-click inspector passes no `sub` and is
  // drawn exactly as before.
  drawDetail(d) {
    const ctx = this.ctx;
    const HEAD = '12px system-ui, sans-serif';
    const SUB = 'italic 10.5px system-ui, sans-serif';
    const maxW = 260;
    // Split on newlines FIRST, then wrap each: _wrapText on its own treats \n
    // as an ordinary space, and a break that was written is a break that was
    // meant.
    const wrap = (s, font) => {
      ctx.font = font;
      return String(s).split('\n').flatMap((ln) => (ln ? this._wrapText(ctx, ln, maxW) : ['']));
    };
    const lines = wrap(d.text, HEAD);
    const subs = d.sub ? wrap(d.sub, SUB) : [];
    // Measure each block in its own font, or the box is cut to the wrong width.
    ctx.font = HEAD;
    let widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    ctx.font = SUB;
    for (const l of subs) widest = Math.max(widest, ctx.measureText(l).width);

    const boxW = Math.min(maxW, widest) + 20;
    const boxH = 12 + lines.length * 15 + (subs.length ? 4 + subs.length * 13 : 0);
    let x = d.x + 14, y = d.y + 14;
    if (x + boxW > this.w) x = d.x - boxW - 14;
    if (y + boxH > this.h) y = d.y - boxH - 14;
    ctx.globalAlpha = Math.min(1, d.ttl);
    ctx.fillStyle = 'rgba(10,14,8,0.92)';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = 'rgba(207,216,195,0.45)';
    ctx.strokeRect(x + 0.5, y + 0.5, boxW - 1, boxH - 1);
    ctx.font = HEAD;
    ctx.fillStyle = '#dfe6d4';
    let ly = y + 16;
    for (const l of lines) { ctx.fillText(l, x + 10, ly); ly += 15; }
    if (subs.length) {
      ctx.font = SUB;
      ctx.fillStyle = 'rgba(207,216,195,0.72)';
      ly += 2;
      for (const l of subs) { ctx.fillText(l, x + 10, ly); ly += 13; }
    }
    ctx.globalAlpha = 1;
  },

  // A certificate of death: a modal listing the run's achievements and an
  // amusing rank. Click anywhere to dismiss (handled in main).
  // A running Greek-key (meander) band — the Homeric border motif, echoing the
  // marble columns. A bottom rail with a repeated fret hooked above it.
  meanderBand(x0, yTop, w, color) {
    const ctx = this.ctx;
    const a = 4, unit = 4 * a;         // fret cell / repeat width
    const yb = yTop + 3 * a;
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(x0, yb); ctx.lineTo(x0 + w, yb);   // bottom rail
    for (let x = x0; x + unit <= x0 + w; x += unit) {
      ctx.moveTo(x, yb);
      ctx.lineTo(x, yTop);
      ctx.lineTo(x + 3 * a, yTop);
      ctx.lineTo(x + 3 * a, yTop + 2 * a);
      ctx.lineTo(x + a, yTop + 2 * a);
      ctx.lineTo(x + a, yTop + a);
    }
    ctx.stroke();
    ctx.restore();
  },

  drawDeathCert(cert) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(4,6,3,0.85)';
    ctx.fillRect(0, 0, this.w, this.h);
    const pw = Math.min(496, this.w - 48), ph = 390;
    const px = Math.round((this.w - pw) / 2), py = Math.round((this.h - ph) / 2);
    this._certBounds = { x: px, y: py, w: pw, h: ph }; // for the S-to-share capture
    const cx = px + pw / 2;
    const isVictory = !!cert.victory;

    // The certificate is printed on a sheet of aged paper — a death notice for a
    // wanderer who did not make it home. A running Greek-key border under the
    // title keeps the Odyssey note (the columns' motif) without pretending the
    // paper is stone.
    ctx.fillStyle = '#ece2cc';
    ctx.fillRect(px, py, pw, ph);
    if (PAPER_TEXTURE.complete && PAPER_TEXTURE.naturalWidth) {
      ctx.save();
      ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
      ctx.drawImage(PAPER_TEXTURE, px, py, pw, ph);
      ctx.restore();
    }
    // Bleach the sheet toward white (a paler, cleaner paper) while keeping the
    // grain, then only a soft vignette so the edges still fox a little.
    ctx.fillStyle = 'rgba(252,251,247,0.52)'; ctx.fillRect(px, py, pw, ph);
    const vg = ctx.createRadialGradient(cx, py + ph * 0.45, ph * 0.28, cx, py + ph * 0.5, ph * 0.85);
    vg.addColorStop(0, 'rgba(255,255,253,0)');
    vg.addColorStop(1, 'rgba(150,132,98,0.15)');
    ctx.fillStyle = vg; ctx.fillRect(px, py, pw, ph);
    // A printed certificate border: a dark rule with a finer inner rule.
    ctx.strokeStyle = 'rgba(90,68,40,0.85)'; ctx.lineWidth = 2.5;
    ctx.strokeRect(px + 6, py + 6, pw - 12, ph - 12);
    ctx.strokeStyle = 'rgba(150,120,74,0.7)'; ctx.lineWidth = 1;
    ctx.strokeRect(px + 10, py + 10, pw - 20, ph - 20);

    // Sepia ink that reads on paper.
    const INK = '#3a2e1f', FAINT = 'rgba(58,46,31,0.62)', VAL = '#4a3a22';
    const carved = 'rgba(120,90,42,0.7)';

    // Title, engraved.
    ctx.textAlign = 'center';
    ctx.font = 'bold 27px Georgia, serif';
    ctx.fillStyle = isVictory ? '#2f5d2a' : '#7d241a';
    ctx.fillText(isVictory ? 'THE TOWERS ARE DOWN' : 'CERTIFICATE OF DEATH', cx, py + 50);
    // Greek-key meander under the title.
    this.meanderBand(px + 40, py + 64, pw - 80, carved);

    // Epitaph, in the language of a grave stele.
    ctx.fillStyle = INK; ctx.font = '18px Georgia, serif';
    if (isVictory) {
      ctx.fillText(`${cert.name || 'A wanderer'} pulled down every tower and turned for home.`, cx, py + 112);
      ctx.font = 'italic 17px Georgia, serif'; ctx.fillStyle = FAINT;
      ctx.fillText('The machines forget. POSEIDON never wakes.', cx, py + 140);
    } else if (cert.skylink) {
      ctx.fillText(`Here lies ${cert.name || 'a wanderer'},`, cx, py + 112);
      ctx.fillText('lost the day POSEIDON woke and the sea rose.', cx, py + 140);
    } else {
      ctx.fillText(`Here lies ${cert.name || 'a wanderer'},`, cx, py + 112);
      ctx.fillText(`taken by ${cert.cause}, far from home.`, cx, py + 140);
    }

    // Ledger rows.
    const rank = deathRank(cert.score);
    ctx.textAlign = 'left';
    ctx.font = '16px Georgia, serif';
    const lx = px + 58;
    const valX = lx + 172;
    const valMaxW = px + pw - 48 - valX;
    let y = py + 190;
    const row = (label, val) => {
      ctx.font = '16px Georgia, serif';
      ctx.fillStyle = FAINT; ctx.fillText(label, lx, y);
      ctx.fillStyle = VAL;
      const lines = this._wrapText(ctx, String(val), valMaxW);
      for (const l of lines) { ctx.fillText(l, valX, y); y += 22; }
      y += 10;
    };
    row('Final score', cert.score);
    row('Skills mastered', cert.skills.length ? cert.skills.join(', ') : 'none');
    row('Deaths so far', cert.deaths);

    // Rank, carved, with a small "rank:" label so it reads as a grade. The
    // label + engraved title are centred together as one group.
    const ry = py + ph - 92;
    ctx.textAlign = 'left';
    const pfx = 'rank:  ';
    ctx.font = 'italic 18px Georgia, serif';
    const pfxW = ctx.measureText(pfx).width;
    ctx.font = 'bold 36px Georgia, serif';
    const rankW = ctx.measureText(rank.title).width;
    const startX = cx - (pfxW + rankW) / 2;
    ctx.font = 'italic 18px Georgia, serif'; ctx.fillStyle = FAINT;
    ctx.fillText(pfx, startX, ry - 2);
    ctx.font = 'bold 36px Georgia, serif';
    ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(38,32,20,0.55)';
    ctx.strokeText(rank.title, startX + pfxW, ry);
    ctx.fillStyle = rank.color;
    ctx.fillText(rank.title, startX + pfxW, ry);
    ctx.textAlign = 'center';
    ctx.font = 'italic 15px Georgia, serif';
    ctx.fillStyle = FAINT;
    ctx.fillText(rank.blurb, cx, py + ph - 52);
    ctx.font = '11.5px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(44,39,31,0.5)';
    ctx.fillText('S or Copy to copy as an image · click elsewhere to carry on', cx, py + ph - 26);
    ctx.textAlign = 'left';

    // Copy-to-clipboard button, drawn ABOVE the sheet (outside _certBounds) so
    // it is never captured into the copied image.
    const btnW = 74, btnH = 24;
    const btnX = px + pw - btnW, btnY = py - btnH - 8;
    this._certCopyBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
    ctx.fillStyle = 'rgba(226,220,204,0.92)';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = 'rgba(30,26,18,0.6)'; ctx.lineWidth = 1;
    ctx.strokeRect(btnX + 0.5, btnY + 0.5, btnW - 1, btnH - 1);
    ctx.fillStyle = '#2e2617';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Copy', btnX + btnW / 2, btnY + 16);
    ctx.textAlign = 'left';
  },
  // Where you are and who holds it — two plain labelled lines, no panel around
  // them. (`rx, ry` is the block's top-RIGHT corner; `w` sets its left edge.)
  //
  // In a five-island game the HUD never said which island you were standing on
  // or whose machines you were fighting, which is exactly what you need when you
  // have just made landfall. It is drawn unboxed and grey because it is
  // reference, not instrumentation: there to be glanced at, not watched.
  // THE NARROWS — the Scylla/Charybdis run, drawn in a 16-bit register rather
  // than a blocky 8-bit one: gradients on the water, shaded and outlined
  // sprites, highlights and drop shadows. Still a hard cell grid underneath, so
  // it reads as a SNES cabinet rather than an Atari one.
  drawNarrows(n, touch = false) {
    const ctx = this.ctx;
    const W = NARROWS_W, ROWS = VIEW_ROWS;
    const cell = Math.max(10, Math.floor(Math.min((this.w - 40) / W, (this.h - 190) / ROWS)));
    const gw = W * cell, gh = ROWS * cell;
    const ox = Math.round((this.w - gw) / 2), oy = Math.round((this.h - gh) / 2) - 10;
    const calm = narrowsCalm(n);

    ctx.save();
    ctx.fillStyle = 'rgba(3,5,9,0.90)';
    ctx.fillRect(0, 0, this.w, this.h);

    // --- the sea: a vertical gradient with a slow swell rolling down it ------
    const sea = ctx.createLinearGradient(0, oy, 0, oy + gh);
    sea.addColorStop(0, '#0a1830');
    sea.addColorStop(0.5, '#123156');
    sea.addColorStop(1, '#0b1e3a');
    ctx.fillStyle = sea;
    ctx.fillRect(ox, oy, gw, gh);
    for (let r = 0; r < ROWS; r++) {
      const swell = Math.sin((r + (n.frac || 0) + n.t * 0.06) * 0.7);
      ctx.fillStyle = `rgba(120,190,235,${(0.05 + 0.045 * swell).toFixed(3)})`;
      ctx.fillRect(ox, oy + r * cell + cell * 0.62 + (n.frac || 0) * cell, gw, Math.max(1, cell * 0.16));
    }
    // Foam crests, scrolling, so the channel obviously moves.
    ctx.fillStyle = 'rgba(210,235,255,0.16)';
    for (let r = 0; r < ROWS; r++) {
      const k = (r * 5 + Math.floor(n.t * 0.5)) % W;
      ctx.fillRect(ox + k * cell + cell * 0.2, oy + r * cell + cell * 0.3 + (n.frac || 0) * cell, cell * 0.5, 2);
    }

    // --- rocky crags framing the channel -------------------------------------
    // Not playfield: the walls of the strait, outside the water on both hands.
    // They scroll with the current so the whole picture moves as one thing, and
    // they are what makes the channel read as a channel rather than a corridor.
    const cragW = Math.max(10, Math.round(cell * 0.9));
    const drawCrags = (edgeX, dir) => {
      const g3 = ctx.createLinearGradient(edgeX, 0, edgeX + cragW * dir, 0);
      g3.addColorStop(0, '#3a3a42'); g3.addColorStop(1, '#14161c');
      ctx.fillStyle = g3;
      ctx.fillRect(Math.min(edgeX, edgeX + cragW * dir), oy, cragW, gh);
      // Jagged teeth along the water's edge, on a long scroll so they repeat
      // slower than the swell.
      const step = cell * 1.1;
      const off = ((n.t * 0.9 + (n.frac || 0) * 6) % step);
      ctx.fillStyle = '#4a4b55';
      for (let y2 = oy - step + off; y2 < oy + gh + step; y2 += step) {
        const h2 = cell * (0.5 + 0.35 * Math.abs(Math.sin(y2 * 0.07)));
        ctx.beginPath();
        ctx.moveTo(edgeX, y2);
        ctx.lineTo(edgeX + cragW * 0.75 * dir, y2 + h2 * 0.45);
        ctx.lineTo(edgeX, y2 + h2);
        ctx.closePath();
        ctx.fill();
      }
      // A pale line where rock meets water.
      ctx.fillStyle = 'rgba(200,225,245,0.18)';
      ctx.fillRect(edgeX - (dir < 0 ? 0 : 1), oy, 1.5, gh);
    };
    // On the way OUT the walls fall away astern: they slide off their own sides
    // and fade, so the channel opens into sea before the run is counted up. You
    // can see that you are through, which is the whole point of the run-out.
    const outT = narrowsRunOutT(n);
    ctx.save();
    // Clipped to the cabinet, not to where the crags are going: as they slide
    // outward they are cut off by the frame rather than floating out over the
    // world behind it.
    ctx.beginPath(); ctx.rect(ox - cragW, oy, gw + cragW * 2, gh); ctx.clip();
    if (outT > 0) { ctx.globalAlpha = Math.max(0, 1 - outT * 1.25); }
    const open = outT * cragW * 2.4;
    drawCrags(ox - open, -1);       // port crag, falling away to port
    drawCrags(ox + gw + open, 1);   // starboard crag, likewise
    ctx.restore();

    // --- the two of them, surfacing from their own sides ---------------------
    // Both are IN THE WATER now: Scylla's necks break the surface on the left,
    // Charybdis's maw on the right. Each is drawn with an outline, a lit top and
    // a shaded underside, which is what separates a SNES sprite from a blob.
    // A head that is actually alive: it blinks, its pupil tracks the ship, and
    // its jaw works. Placid heads with a fixed dot for an eye read as furniture;
    // the whole point of these two is that they are watching you.
    const shipScreenX = ox + (n.xDraw != null ? n.xDraw : n.x) * cell + cell * 0.5;
    const shipScreenY = oy + (n.yDraw != null ? n.yDraw : n.y) * cell + cell * 0.5;
    const head = (cx, cy, rad, base, lit, dark, facing, seed) => {
      const beat = n.t * 0.14 + seed * 2.3;
      // Blink: shut for a few frames on an irregular cycle, so they do not all
      // blink together like a row of lights.
      const cyc = (n.t + seed * 37) % 150;
      const blinkAmt = cyc < 7 ? 1 - Math.abs(cyc - 3.5) / 3.5 : 0;
      const jaw = (Math.sin(beat) * 0.5 + 0.5) ** 2;              // 0..1, snappy

      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(cx, cy + rad * 0.55, rad * 1.15, rad * 0.42, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = base;
      ctx.beginPath(); ctx.ellipse(cx, cy, rad, rad * 0.92, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(cx, cy + rad * 0.25, rad * 0.92, rad * 0.55, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = lit;
      ctx.beginPath(); ctx.ellipse(cx - rad * 0.2 * facing, cy - rad * 0.35, rad * 0.55, rad * 0.3, 0, 0, Math.PI * 2); ctx.fill();

      // the jaw, hinged at the front of the head and opening toward the channel
      const gape = rad * (0.18 + 0.5 * jaw);
      ctx.fillStyle = '#2a0912';
      ctx.beginPath();
      ctx.moveTo(cx + rad * 0.20 * facing, cy - gape * 0.5);
      ctx.quadraticCurveTo(cx + rad * 1.15 * facing, cy, cx + rad * 0.20 * facing, cy + gape * 0.5);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fdf6e0';                                   // teeth
      for (let ti = 0; ti < 3; ti++) {
        const tx = cx + (rad * 0.35 + ti * rad * 0.24) * facing;
        const th = gape * (0.30 - ti * 0.06);
        ctx.beginPath();
        ctx.moveTo(tx, cy - gape * 0.42);
        ctx.lineTo(tx + rad * 0.10 * facing, cy - gape * 0.42 + th);
        ctx.lineTo(tx - rad * 0.06 * facing, cy - gape * 0.42 + th);
        ctx.closePath(); ctx.fill();
      }

      ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = Math.max(1, cell * 0.08);
      ctx.beginPath(); ctx.ellipse(cx, cy, rad, rad * 0.92, 0, 0, Math.PI * 2); ctx.stroke();

      // eye: white shrinks to a slit on the blink, pupil leans toward the ship
      const eyeX = cx + rad * 0.35 * facing, eyeY = cy - rad * 0.12;
      const open = 1 - blinkAmt;
      ctx.fillStyle = '#fdf6e0';
      ctx.beginPath(); ctx.ellipse(eyeX, eyeY, rad * 0.26, rad * 0.26 * Math.max(0.06, open), 0, 0, Math.PI * 2); ctx.fill();
      if (open > 0.3) {
        const look = Math.max(-1, Math.min(1, (shipScreenX - cx) / (cell * 4)));
        ctx.fillStyle = '#150a10';
        ctx.beginPath();
        ctx.arc(eyeX + look * rad * 0.1, eyeY, rad * 0.12 * (0.85 + 0.3 * jaw), 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Everything from here is inside the frame: with the sub-row slide a row can
    // sit a whole cell past the edge, and a rock hanging below the cabinet looks
    // like a rendering fault.
    ctx.save();
    ctx.beginPath(); ctx.rect(ox, oy, gw, gh); ctx.clip();

    // Rows are drawn at a sub-row offset so the channel FLOWS instead of jumping
    // a whole cell per logic tick. The rules still run on whole rows; this only
    // moves the picture between them.
    const slide = (n.frac || 0) * cell;
    for (let r = 0; r < ROWS; r++) {
      const row = n.rows[r];
      const y = oy + r * cell + cell * 0.5 + slide;
      if (y < oy - cell || y > oy + gh + cell) continue;
      if (row.rock >= 0) {
        // A rock in the seam: wet granite with a lit crown and a wash of foam
        // round its base. The thing that stops the middle of the channel being
        // a free ride.
        const rx = ox + row.rock * cell + cell * 0.5;
        ctx.fillStyle = 'rgba(210,235,255,0.22)';
        ctx.beginPath(); ctx.ellipse(rx, y + cell * 0.28, cell * 0.46, cell * 0.16, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3b4048';
        ctx.beginPath();
        ctx.moveTo(rx - cell * 0.38, y + cell * 0.3);
        ctx.lineTo(rx - cell * 0.16, y - cell * 0.34);
        ctx.lineTo(rx + cell * 0.12, y - cell * 0.22);
        ctx.lineTo(rx + cell * 0.38, y + cell * 0.3);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5c636d';                          // lit face
        ctx.beginPath();
        ctx.moveTo(rx - cell * 0.16, y - cell * 0.34);
        ctx.lineTo(rx + cell * 0.12, y - cell * 0.22);
        ctx.lineTo(rx + cell * 0.02, y + cell * 0.3);
        ctx.lineTo(rx - cell * 0.1, y + cell * 0.3);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = Math.max(1, cell * 0.07);
        ctx.beginPath();
        ctx.moveTo(rx - cell * 0.38, y + cell * 0.3);
        ctx.lineTo(rx - cell * 0.16, y - cell * 0.34);
        ctx.lineTo(rx + cell * 0.12, y - cell * 0.22);
        ctx.lineTo(rx + cell * 0.38, y + cell * 0.3);
        ctx.stroke();
      }
      if (row.pick >= 0) {
        // FLOTSAM: worth steering for, so it is drawn with a halo the hazards
        // never get. Nothing else in this channel glows.
        const px = ox + row.pick * cell + cell * 0.5;
        const pulse = 0.55 + 0.45 * Math.sin(n.t * 0.16 + r);
        const halo = ctx.createRadialGradient(px, y, cell * 0.1, px, y, cell * 0.7);
        // Timber's halo is pushed harder than bronze's: a brown plank on dark
        // blue water simply does not carry at a glance the way a lit bronze
        // wedge does, and both have to read as "steer for this".
        const beak = row.kind === 'beak';
        const tint = beak ? '176,125,58' : '170,225,190';
        halo.addColorStop(0, `rgba(${tint},${((beak ? 0.42 : 0.60) * pulse).toFixed(2)})`);
        halo.addColorStop(1, `rgba(${tint},0)`);
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(px, y, cell * 0.7, 0, Math.PI * 2); ctx.fill();
        ctx.save();
        ctx.translate(px, y);
        ctx.rotate(Math.sin(n.t * 0.05 + r) * 0.25);      // rolling in the swell
        if (row.kind === 'beak') {
          ctx.fillStyle = '#8a5f28';
          ctx.beginPath();
          ctx.moveTo(-cell * 0.30, -cell * 0.14); ctx.lineTo(cell * 0.18, -cell * 0.10);
          ctx.lineTo(cell * 0.34, 0); ctx.lineTo(cell * 0.18, cell * 0.10);
          ctx.lineTo(-cell * 0.30, cell * 0.14);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#c08a3e';
          ctx.beginPath();
          ctx.moveTo(-cell * 0.30, -cell * 0.14); ctx.lineTo(cell * 0.18, -cell * 0.10);
          ctx.lineTo(cell * 0.34, 0); ctx.lineTo(-cell * 0.30, -cell * 0.03);
          ctx.closePath(); ctx.fill();
        } else {
          ctx.fillStyle = '#8a6437';                        // a spar, banded
          ctx.fillRect(-cell * 0.34, -cell * 0.11, cell * 0.68, cell * 0.22);
          ctx.fillStyle = '#b08a52';
          ctx.fillRect(-cell * 0.34, -cell * 0.11, cell * 0.68, cell * 0.08);
          ctx.strokeStyle = 'rgba(60,40,20,0.6)'; ctx.lineWidth = 1;
          ctx.strokeRect(-cell * 0.34, -cell * 0.11, cell * 0.68, cell * 0.22);
        }
        ctx.restore();
      }
    }

    // --- CHARYBDIS: one enormous whirlpool, coming down the channel ----------
    // She is the water on the starboard hand, not a row property: a single maw
    // spanning a band of rows, widening as she comes and shutting as she passes.
    // Drawn before Scylla so a lunge crossing her rim reads as being in front.
    const c = n.charybdis;
    const cReach = c ? (c.reachDraw != null ? c.reachDraw : c.reach) : 0;
    if (c && cReach > 0.05) {
      // She DOES travel with the current, so she takes the channel's sub-row
      // offset — that is what keeps her sliding rather than stepping.
      const cyc = oy + (c.row + CHARYBDIS_ROWS / 2) * cell + slide;
      const rad = cReach * cell;
      const cxw = ox + gw;                        // her eye sits ON the far wall
      const spin = n.t * 0.10;
      // the drag: water bending into her for a good way outside the mouth
      const drag = ctx.createRadialGradient(cxw, cyc, rad * 0.2, cxw, cyc, rad * 1.5);
      drag.addColorStop(0, 'rgba(60,20,90,0.85)');
      drag.addColorStop(0.6, 'rgba(70,40,120,0.35)');
      drag.addColorStop(1, 'rgba(70,40,120,0)');
      ctx.fillStyle = drag;
      ctx.beginPath(); ctx.ellipse(cxw, cyc, rad * 1.5, rad * 1.25, 0, 0, Math.PI * 2); ctx.fill();
      // three turns of the spiral, each running a little faster than the last
      ctx.lineCap = 'round';
      for (let a = 0; a < 3; a++) {
        ctx.strokeStyle = `rgba(170,120,215,${0.55 - a * 0.13})`;
        ctx.lineWidth = cell * (0.20 - a * 0.04);
        ctx.beginPath();
        ctx.ellipse(cxw, cyc, rad * (0.95 - a * 0.26), rad * (0.80 - a * 0.22), 0,
          spin * (1 + a * 0.5), spin * (1 + a * 0.5) + Math.PI * 1.5);
        ctx.stroke();
      }
      // the throat, and her one eye down in it
      ctx.fillStyle = '#1a0726';
      ctx.beginPath(); ctx.ellipse(cxw, cyc, rad * 0.5, rad * 0.42, 0, 0, Math.PI * 2); ctx.fill();
      head(cxw - rad * 0.18, cyc, Math.min(cell * 0.9, rad * 0.42),
        '#7b3fa8', '#c07fe0', '#3f1a5c', -1, 5);
      // a bright lip where the pull begins, so the edge of her reach is visible
      ctx.strokeStyle = 'rgba(220,190,255,0.35)';
      ctx.lineWidth = Math.max(1.5, cell * 0.08);
      ctx.beginPath(); ctx.ellipse(cxw, cyc, rad, rad * 0.86, 0, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();
    }

    // --- SCYLLA: one creature on the port wall, keeping station on you --------
    // She lurks half-submerged at your row, rears when you come inside her
    // reach, and lunges. The three poses are the whole tell, so they are drawn
    // as three distinct silhouettes rather than one neck of varying length.
    const k = n.scylla;
    const kReach = k ? Math.max(0.55, k.reachDraw != null ? k.reachDraw : k.reach) : 0;
    const kVis = k ? (k.visDraw != null ? k.visDraw : (k.vis || 0)) : 0;
    if (k && kVis > 0.03) {
      // NO `slide`: she holds her station against the current while the channel
      // runs past her, so borrowing the water's sub-row offset made her snap back
      // a whole cell every tick. Her row is eased instead.
      const ky = oy + (k.rowDraw != null ? k.rowDraw : k.row) * cell + cell * 0.5;
      const striking = k.state === 'strike';
      const reach = kReach * cell;
      const tip = ox + reach;
      const bob = Math.sin(n.t * 0.09) * cell * 0.10;
      // She rises OUT of the water and sinks back into it: the fade is driven by
      // the same eased reach, so there is no frame where she simply exists.
      ctx.save();
      ctx.globalAlpha = Math.min(1, kVis);
      // wake round her shoulders: she is a big thing coming up through moving water
      ctx.fillStyle = 'rgba(210,235,255,0.13)';
      ctx.beginPath(); ctx.ellipse(ox + cell * 0.2, ky + bob, cell * 1.1, cell * 0.55, 0, 0, Math.PI * 2); ctx.fill();
      // the neck, out of the rock on the port hand
      ctx.strokeStyle = striking ? '#8c2440' : '#5e1a2c';
      ctx.lineWidth = cell * (striking ? 0.50 : 0.40);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ox - cell * 0.4, ky + bob + cell * 0.3);
      ctx.quadraticCurveTo(tip - cell * 0.9, ky - cell * (striking ? 0.65 : 0.25), tip, ky + bob);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(200,100,130,0.42)';
      ctx.lineWidth = cell * 0.11;
      ctx.beginPath();
      ctx.moveTo(ox - cell * 0.4, ky + bob + cell * 0.16);
      ctx.quadraticCurveTo(tip - cell * 0.9, ky - cell * (striking ? 0.82 : 0.42), tip, ky + bob - cell * 0.14);
      ctx.stroke();
      // The tell is HER — rising out of the water where she was not a moment ago.
      // A lit rectangle over the water she is about to take said the same thing
      // and said it as a debug overlay: a hitbox drawn on the sea.
      head(tip, ky + bob, cell * (striking ? 0.52 : 0.44), '#a8304c', '#d9668a', '#6d1730', 1, 0);
      ctx.restore();
    }

    // --- gulls ---------------------------------------------------------------
    // Every so often a few birds cross the channel. Nothing to do with the
    // rules; they exist because a strait with two monsters and no birds reads as
    // a test harness, and because something ordinary passing overhead makes the
    // rest of it worse. Derived from n.t, so they need no state of their own.
    const CYCLE = 520;                       // frames between flights
    const phase = n.t % CYCLE;
    if (phase < 190) {
      const flight = Math.floor(n.t / CYCLE);
      const dir = (flight % 2) ? -1 : 1;                       // alternate the crossing
      const baseY = oy + gh * (0.15 + ((flight * 37) % 60) / 100);
      const u = phase / 190;
      const headX = dir > 0 ? ox - cell + u * (gw + cell * 2) : ox + gw + cell - u * (gw + cell * 2);
      ctx.strokeStyle = 'rgba(232,238,245,0.75)';
      ctx.lineWidth = Math.max(1.2, cell * 0.09);
      ctx.lineCap = 'round';
      for (let g4 = 0; g4 < 3; g4++) {
        const gx = headX - dir * g4 * cell * 1.5;
        const gy = baseY + Math.sin(n.t * 0.12 + g4 * 1.3) * cell * 0.35 + g4 * cell * 0.5;
        if (gx < ox - cell * 2 || gx > ox + gw + cell * 2) continue;
        const flap = Math.sin(n.t * 0.35 + g4 * 0.9) * 0.5 + 0.5;   // 0..1 wingbeat
        const span = cell * (0.30 + 0.16 * flap);
        const lift = cell * (0.16 * flap);
        ctx.beginPath();
        ctx.moveTo(gx - span, gy + lift);
        ctx.quadraticCurveTo(gx - span * 0.4, gy - lift * 1.4, gx, gy);
        ctx.quadraticCurveTo(gx + span * 0.4, gy - lift * 1.4, gx + span, gy + lift);
        ctx.stroke();
      }
    }

    ctx.restore();   // end playfield clip

    // --- the ship ------------------------------------------------------------
    const sx = shipScreenX;
    const sy = shipScreenY;
    // The grace flash must NOT keep running once the run is over: the card's
    // clock still ticks so PRESS ANY KEY can blink, and the ship was flickering
    // in and out underneath it.
    const blink = !n.over && n.grace > 0 && (n.t & 1);
    if (!blink) {
      // A BOAT, not an insect. Two things were doing that: oars radiating at
      // their own phases like legs, and a hull too narrow for its length. The
      // oars now stroke in unison — one bank, one beat, the way a crew actually
      // rows — and the beam is wide enough to read as a hull. Red outside,
      // planked deck inside, matching the greek ship you sail in the world.
      const L = cell * 0.92;                 // half-length, bow to midships
      const B = cell * 0.40;                 // half-beam
      // ONE phase for the whole crew, and a long slow one: a bank of oars at a
      // twitchy rate was half of what made this read as an insect.
      const stroke = Math.sin(n.t * 0.10);

      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.beginPath(); ctx.ellipse(sx, sy + cell * 0.34, B * 1.1, L * 0.62, 0, 0, Math.PI * 2); ctx.fill();

      // oars first, so they sit under the hull like real looms through ports
      ctx.strokeStyle = 'rgba(196,158,96,0.9)';
      ctx.lineWidth = Math.max(1.1, cell * 0.06);
      ctx.lineCap = 'round';
      for (let o = 0; o < 3; o++) {
        const oy2 = sy - L * 0.28 + o * cell * 0.30;
        const reach = cell * (0.30 + 0.13 * stroke);      // all together
        const dropY = cell * (0.16 + 0.07 * stroke);
        ctx.beginPath();
        ctx.moveTo(sx - B * 0.85, oy2); ctx.lineTo(sx - B * 0.85 - reach, oy2 + dropY);
        ctx.moveTo(sx + B * 0.85, oy2); ctx.lineTo(sx + B * 0.85 + reach, oy2 + dropY);
        ctx.stroke();
      }

      // hull: red outside
      const hull = new Path2D();
      hull.moveTo(sx, sy - L);                                        // stem
      hull.quadraticCurveTo(sx + B, sy - L * 0.35, sx + B * 0.92, sy + L * 0.35);
      hull.quadraticCurveTo(sx + B * 0.7, sy + L * 0.80, sx, sy + L * 0.86);
      hull.quadraticCurveTo(sx - B * 0.7, sy + L * 0.80, sx - B * 0.92, sy + L * 0.35);
      hull.quadraticCurveTo(sx - B, sy - L * 0.35, sx, sy - L);
      hull.closePath();
      ctx.fillStyle = '#a3302c';
      ctx.fill(hull);
      ctx.fillStyle = '#7d1f1e';                                      // shaded starboard side
      ctx.save(); ctx.clip(hull);
      ctx.fillRect(sx + B * 0.25, sy - L, B, L * 2);
      ctx.restore();
      ctx.strokeStyle = '#2a1a2e'; ctx.lineWidth = Math.max(1.2, cell * 0.07);
      ctx.stroke(hull);

      // the deck inside it, planked
      const deck = new Path2D();
      deck.moveTo(sx, sy - L * 0.74);
      deck.quadraticCurveTo(sx + B * 0.60, sy - L * 0.25, sx + B * 0.55, sy + L * 0.32);
      deck.quadraticCurveTo(sx + B * 0.4, sy + L * 0.62, sx, sy + L * 0.66);
      deck.quadraticCurveTo(sx - B * 0.4, sy + L * 0.62, sx - B * 0.55, sy + L * 0.32);
      deck.quadraticCurveTo(sx - B * 0.60, sy - L * 0.25, sx, sy - L * 0.74);
      deck.closePath();
      ctx.fillStyle = '#c69a54'; ctx.fill(deck);
      ctx.save(); ctx.clip(deck);
      ctx.strokeStyle = 'rgba(120,84,40,0.55)'; ctx.lineWidth = 1;
      for (let d2 = -3; d2 <= 3; d2++) {
        ctx.beginPath(); ctx.moveTo(sx - B, sy + d2 * cell * 0.16); ctx.lineTo(sx + B, sy + d2 * cell * 0.16); ctx.stroke();
      }
      ctx.restore();

      // stern post curling back over the steering oar
      ctx.strokeStyle = '#a3302c'; ctx.lineWidth = Math.max(1.4, cell * 0.09);
      ctx.beginPath();
      ctx.moveTo(sx, sy + L * 0.84);
      ctx.quadraticCurveTo(sx + B * 0.5, sy + L * 1.06, sx + B * 0.05, sy + L * 1.16);
      ctx.stroke();

      // mast and square sail, her eye on it
      ctx.strokeStyle = '#6d4718'; ctx.lineWidth = Math.max(1.2, cell * 0.07);
      ctx.beginPath(); ctx.moveTo(sx, sy + L * 0.2); ctx.lineTo(sx, sy - L * 0.6); ctx.stroke();
      ctx.fillStyle = '#f2ead6';
      ctx.beginPath();
      ctx.moveTo(sx - B * 0.86, sy - L * 0.54);
      ctx.lineTo(sx + B * 0.86, sy - L * 0.54);
      ctx.lineTo(sx + B * 0.70, sy + L * 0.02);
      ctx.lineTo(sx - B * 0.70, sy + L * 0.02);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(42,26,46,0.55)'; ctx.lineWidth = Math.max(1, cell * 0.05);
      ctx.stroke();
      ctx.fillStyle = '#2f4d8a';
      ctx.beginPath(); ctx.ellipse(sx, sy - L * 0.26, B * 0.30, B * 0.21, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f2ead6';
      ctx.beginPath(); ctx.arc(sx, sy - L * 0.26, B * 0.09, 0, Math.PI * 2); ctx.fill();
    }

    // --- frame + HUD ---------------------------------------------------------
    ctx.strokeStyle = 'rgba(180,200,220,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox - 1, oy - 1, gw + 2, gh + 2);

    // Their names, on their own sides, so you never have to guess which is which.
    ctx.font = `bold ${Math.max(10, Math.round(cell * 0.62))}px ui-monospace, monospace`;
    ctx.textAlign = 'left';
    ctx.fillStyle = calm ? 'rgba(200,120,150,0.35)' : 'rgba(230,140,170,0.9)';
    ctx.fillText(MONSTERS.scylla.name, ox + 4, oy - 8);
    ctx.textAlign = 'right';
    ctx.fillStyle = calm ? 'rgba(170,120,210,0.35)' : 'rgba(200,150,240,0.9)';
    ctx.fillText(MONSTERS.charybdis.name, ox + gw - 4, oy - 8);

    const by = oy + gh + 14;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(232,224,208,0.9)';
    ctx.font = `bold ${Math.max(10, Math.round(cell * 0.6))}px ui-monospace, monospace`;
    ctx.fillText('THE NARROWS', ox, by);
    ctx.textAlign = 'right';
    const leaving = narrowsRunOut(n);
    ctx.fillStyle = calm ? 'rgba(106,208,160,0.9)' : n.bites ? '#e0864a' : 'rgba(232,224,208,0.5)';
    ctx.fillText(leaving ? 'SUCCESS!' : calm ? 'OPEN WATER' : n.bites ? `TAKEN ${n.bites}` : 'BEWARE!', ox + gw, by);
    // Hull, as pips that go out — a number counting up never felt like damage.
    const pip = Math.max(5, Math.round(cell * 0.34));
    const hull = n.hull != null ? n.hull : HULL_MAX;
    for (let i = 0; i < HULL_MAX; i++) {
      const lit = i < hull;
      ctx.fillStyle = lit ? (hull <= 2 ? '#e05548' : '#c9932f') : 'rgba(255,255,255,0.10)';
      ctx.fillRect(ox + i * (pip + 3), by + 20, pip, pip);
    }
    // HULL and the controls share the strip, divided by a rule — without it the
    // label ran straight into the first key and read as one word.
    ctx.textAlign = 'left';
    const labY = by + 20 + pip - 1;
    let lx = ox + HULL_MAX * (pip + 3) + 6;
    ctx.fillStyle = 'rgba(207,216,195,0.45)';
    ctx.font = `${Math.max(8, Math.round(cell * 0.42))}px ui-monospace, monospace`;
    ctx.fillText('HULL', lx, labY);
    lx += ctx.measureText('HULL').width + Math.max(7, cell * 0.5);
    // The bronze ram, if one is fitted: its own pips in bronze, and its own
    // label, because it is not more hull — it is the thing that spends itself
    // first so the hull does not have to.
    if (n.ram != null && (n.ram > 0 || n.ramFitted)) {
      ctx.fillStyle = 'rgba(207,216,195,0.22)';
      ctx.fillRect(Math.round(lx), labY - pip + 1, 1, pip + 1);
      lx += Math.max(7, cell * 0.5);
      for (let i = 0; i < RAM_MAX; i++) {
        ctx.fillStyle = i < n.ram ? '#b07d3a' : 'rgba(176,125,58,0.16)';
        ctx.beginPath();
        ctx.moveTo(lx + i * (pip + 3), labY);
        ctx.lineTo(lx + i * (pip + 3) + pip, labY - pip * 0.5);
        ctx.lineTo(lx + i * (pip + 3), labY - pip);
        ctx.closePath(); ctx.fill();
      }
      lx += RAM_MAX * (pip + 3) + 4;
      ctx.fillStyle = 'rgba(207,216,195,0.45)';
      ctx.font = `${Math.max(8, Math.round(cell * 0.42))}px ui-monospace, monospace`;
      ctx.fillText('RAM', lx, labY);
      lx += ctx.measureText('RAM').width + Math.max(7, cell * 0.5);
    }
    ctx.fillStyle = 'rgba(207,216,195,0.22)';
    ctx.fillRect(Math.round(lx), labY - pip + 1, 1, pip + 1);      // the divider
    lx += Math.max(7, cell * 0.5);
    // The controls line has to FIT: on a phone the strip is a third of the width
    // it has on a desk, and the key list was being cut off mid-glyph at the
    // frame's edge. On touch it is not a key list at all.
    const ctrl = touch ? 'drag anywhere to steer' : 'WASD  or  ← → ↑ ↓  ·  or drag';
    const room = Math.max(20, ox + gw - lx);
    let cpx = Math.max(9, Math.round(cell * 0.46));
    do {
      ctx.font = `${cpx}px system-ui, sans-serif`;
      if (ctx.measureText(ctrl).width <= room) break;
      cpx -= 1;
    } while (cpx > 7);
    ctx.fillStyle = 'rgba(207,216,195,0.5)';
    ctx.fillText(ctrl, lx, labY);
    ctx.textAlign = 'right';
    const pw2 = Math.round(narrowsProgress(n) * gw);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(ox, by + 8, gw, 6);
    const grad = ctx.createLinearGradient(ox, 0, ox + gw, 0);
    grad.addColorStop(0, '#6ad0a0'); grad.addColorStop(1, '#e8d27a');
    ctx.fillStyle = grad;
    ctx.fillRect(ox, by + 8, pw2, 6);
    ctx.textAlign = 'left';
    ctx.restore();
  },

  // GAME OVER, over the frozen channel. The run used to resolve the instant it
  // ended: one frame you were steering, the next you were back in the world
  // reading a line of prose about what had happened. A cabinet owes you the
  // moment, and it owes you the numbers.
  drawNarrowsGameOver(n, over) {
    const ctx = this.ctx;
    const W = NARROWS_W, ROWS = VIEW_ROWS;
    const cell = Math.max(10, Math.floor(Math.min((this.w - 40) / W, (this.h - 190) / ROWS)));
    const gw = W * cell, gh = ROWS * cell;
    const ox = Math.round((this.w - gw) / 2), oy = Math.round((this.h - gh) / 2) - 10;
    const cx = ox + gw / 2;
    const won = over.outcome === 'through';

    ctx.save();
    // The field dims but stays visible: you want to see the water that got you.
    ctx.fillStyle = 'rgba(3,5,9,0.72)';
    ctx.fillRect(ox, oy, gw, gh);

    const fitW = gw - cell * 1.4;
    const fit = (text, startPx, weight = '') => {
      let px = startPx;
      do {
        ctx.font = `${weight}${px}px ui-monospace, monospace`;
        if (ctx.measureText(text).width <= fitW) break;
        px -= 1;
      } while (px > 7);
      return px;
    };
    ctx.textAlign = 'center';

    const title = won ? 'THROUGH' : 'GAME OVER';
    const big = fit(title, Math.round(cell * 1.5), 'bold ');
    const ty = oy + gh * 0.30;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillText(title, cx + 3, ty + 3);
    ctx.fillStyle = won ? '#6ad0a0' : '#e05548';
    ctx.fillText(title, cx, ty);

    const why = {
      swallowed: 'CHARYBDIS TOOK THE SHIP',
      wrecked: 'THE HULL CAME APART',
      through: 'THE ROCK FALLS AWAY ASTERN',
    }[over.outcome] || '';
    fit(why, Math.round(cell * 0.62), 'bold ');
    ctx.fillStyle = 'rgba(207,216,195,0.75)';
    ctx.fillText(why, cx, ty + big * 0.95);

    // The tally. An arcade cabinet always tells you what the run came to.
    const lh = Math.max(15, Math.round(cell * 0.82));
    let ly = ty + big * 0.95 + lh * 1.5;
    const stat = (label, value, tone) => {
      const px = Math.max(9, Math.round(cell * 0.52));
      ctx.font = `${px}px ui-monospace, monospace`;
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(207,216,195,0.45)';
      ctx.fillText(label, ox + cell * 1.6, ly);
      ctx.textAlign = 'right';
      ctx.fillStyle = tone || 'rgba(232,224,208,0.92)';
      ctx.fillText(String(value), ox + gw - cell * 1.6, ly);
      ctx.textAlign = 'center';
      ly += lh;
    };
    stat('DISTANCE', `${Math.round(narrowsProgress(n) * 100)}%`);
    stat('TAKEN BY SCYLLA', n.bites || 0, n.bites ? '#e0864a' : null);
    stat('ROCKS STRUCK', n.rocks || 0, n.rocks ? '#e0864a' : null);
    if (n.picks) stat('TAKEN FROM THE SEA', n.picks, '#6ad0a0');
    if (n.ramFitted) stat('RAM REMAINING', `${n.ram} / ${RAM_MAX}`, '#b07d3a');
    stat('HULL', `${Math.max(0, n.hull)} / ${HULL_MAX}`,
      n.hull <= 0 ? '#e05548' : n.hull <= 2 ? '#e0864a' : null);

    // The ENTER key, drawn as a key. It does not appear until the hold is up, so
    // there is nothing to hit early — the card cannot be skipped before it has
    // been read, which is the whole reason it stops the game at all. The rect is
    // stamped back onto the state so the hub can hit-test a tap against it
    // without either side guessing at the other's layout.
    over.enterRect = null;
    if (over.ready) {
      const bh = Math.max(26, Math.round(cell * 1.15));
      const label = 'ENTER';
      ctx.font = `bold ${Math.max(11, Math.round(cell * 0.6))}px ui-monospace, monospace`;
      const bw = Math.max(cell * 4.2, ctx.measureText(label).width + cell * 2.2);
      const bx = Math.round(cx - bw / 2), byy = Math.round(oy + gh * 0.84 - bh / 2);
      const pulse = 0.55 + 0.45 * Math.sin(n.t * 0.12);

      ctx.fillStyle = 'rgba(0,0,0,0.55)';                 // the key's shadow: it stands up
      this.roundRect(bx + 2, byy + 4, bw, bh, 5);
      ctx.fill();
      const kg = ctx.createLinearGradient(0, byy, 0, byy + bh);
      kg.addColorStop(0, '#3a4050'); kg.addColorStop(1, '#232838');
      ctx.fillStyle = kg;
      this.roundRect(bx, byy, bw, bh, 5);
      ctx.fill();
      ctx.strokeStyle = `rgba(232,210,122,${(0.45 + 0.5 * pulse).toFixed(2)})`;
      ctx.lineWidth = 2;
      this.roundRect(bx, byy, bw, bh, 5);
      ctx.stroke();
      ctx.fillStyle = `rgba(232,210,122,${(0.7 + 0.3 * pulse).toFixed(2)})`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, bx + bw / 2, byy + bh / 2 + 1);
      ctx.textBaseline = 'alphabetic';

      over.enterRect = { x: bx, y: byy, w: bw, h: bh };
      ctx.fillStyle = 'rgba(207,216,195,0.4)';
      ctx.font = `${Math.max(9, Math.round(cell * 0.44))}px system-ui, sans-serif`;
      ctx.fillText('press enter, or tap', cx, byy + bh + Math.max(14, cell * 0.62));
    }

    ctx.strokeStyle = won ? 'rgba(106,208,160,0.5)' : 'rgba(224,85,72,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox - 1, oy - 1, gw + 2, gh + 2);
    ctx.textAlign = 'left';
    ctx.restore();
  },

  // The cabinet's attract screen — see drawNarrows for why it exists.
  drawNarrowsAttract(n, touch = false) {
    const ctx = this.ctx;
    const W = NARROWS_W, ROWS = VIEW_ROWS;
    const cell = Math.max(10, Math.floor(Math.min((this.w - 40) / W, (this.h - 190) / ROWS)));
    const gw = W * cell, gh = ROWS * cell;
    const ox = Math.round((this.w - gw) / 2), oy = Math.round((this.h - gh) / 2) - 10;
    const cx = ox + gw / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(3,5,9,0.92)';
    ctx.fillRect(0, 0, this.w, this.h);
    const g2 = ctx.createLinearGradient(0, oy, 0, oy + gh);
    g2.addColorStop(0, '#0a1830'); g2.addColorStop(1, '#07101f');
    ctx.fillStyle = g2; ctx.fillRect(ox, oy, gw, gh);
    ctx.strokeStyle = 'rgba(180,200,220,0.35)'; ctx.lineWidth = 2;
    ctx.strokeRect(ox - 1, oy - 1, gw + 2, gh + 2);
    ctx.textAlign = 'center';

    const fitW = gw - cell * 1.2;
    const fit = (text, startPx, weight = '') => {
      let px = startPx;
      do {
        ctx.font = `${weight}${px}px ui-monospace, monospace`;
        if (ctx.measureText(text).width <= fitW) break;
        px -= 1;
      } while (px > 7);
      return px;
    };

    const big = fit('THE NARROWS', Math.round(cell * 1.3), 'bold ');
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText('THE NARROWS', cx + 2, oy + gh * 0.15 + 2);
    ctx.fillStyle = '#e8d27a';
    ctx.fillText('THE NARROWS', cx, oy + gh * 0.15);
    ctx.fillStyle = 'rgba(207,216,195,0.55)';
    fit('AN ODYSSEY, IN ONE CHANNEL', Math.round(cell * 0.6));
    ctx.fillText('AN ODYSSEY, IN ONE CHANNEL', cx, oy + gh * 0.15 + big * 0.95);

    const lh = Math.max(14, Math.round(cell * 0.95));
    let ly = oy + gh * 0.40;
    const rule = (swatch, name, text) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = swatch;
      ctx.beginPath(); ctx.arc(ox + cell * 1.2, ly - lh * 0.2, cell * 0.28, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8e0d0';
      fit(name, Math.round(cell * 0.66), 'bold ');
      ctx.fillText(name, ox + cell * 1.9, ly);
      ctx.fillStyle = 'rgba(207,216,195,0.72)';
      fit(text, Math.round(cell * 0.52));
      ctx.fillText(text, ox + cell * 1.9, ly + lh * 0.62);
      ctx.textAlign = 'center';
      ly += lh * 1.6;
    };
    rule('#a8304c', MONSTERS.scylla.name, 'lurks to port. come near and she lunges.');
    rule('#7b3fa8', MONSTERS.charybdis.name, 'opens to starboard. takes the ship whole.');
    rule('#5c636d', 'ROCKS', 'mid-channel, and late on they walk.');
    rule('#6ad0a0', 'FLOTSAM', 'timber and bronze. steer FOR these.');
    if (n.ram > 0) rule('#b07d3a', 'BRONZE RAM', `fitted. shoulders ${RAM_MAX} rocks aside.`);

    ctx.fillStyle = 'rgba(207,216,195,0.6)';
    const c1 = touch ? 'drag anywhere to steer her' : 'row her anywhere: WASD  or  ← → ↑ ↓';
    const c2 = 'through clean costs you nothing';
    fit(c1, Math.round(cell * 0.52)); ctx.fillText(c1, cx, ly);
    fit(c2, Math.round(cell * 0.52)); ctx.fillText(c2, cx, ly + lh * 0.66);

    if ((n.t >> 4) & 1) {
      ctx.fillStyle = '#6ad0a0';
      fit('INSERT COINS TO PLAY', Math.round(cell * 0.8), 'bold ');
      ctx.fillText('INSERT COINS TO PLAY', cx, oy + gh * 0.88);
    }
    ctx.textAlign = 'left';
    ctx.restore();
  },

  // CALYPSO's pong. The ball is the zeus_virus; she is the defence that never
  // misses; the warmth (and the whole palette) rises with the rally. See
  // game/calypso-pong.js for why you cannot win it.
  drawCalypsoPong(g, touch = false) {
    const ctx = this.ctx;
    // Court: a wide rectangle, paddles left (you) and right (her).
    const cw = Math.min(this.w - 80, 720);
    const ch = Math.min(this.h - 220, cw * 0.62);
    const ox = Math.round((this.w - cw) / 2);
    const oy = Math.round((this.h - ch) / 2) - 6;
    const w = g.warmth || 0;

    // The palette warms with the rally: from a cool, lonely indigo dusk to a
    // gold-and-rose hearth. That warming IS the seduction — the longer you stay,
    // the nicer it gets to be here.
    const lerp = (a, b, t) => Math.round(a + (b - a) * t);
    const bg1 = `rgb(${lerp(14, 46, w)},${lerp(13, 26, w)},${lerp(30, 24, w)})`;
    const bg2 = `rgb(${lerp(8, 30, w)},${lerp(9, 14, w)},${lerp(22, 16, w)})`;
    const glow = `rgba(${lerp(150, 240, w)},${lerp(157, 180, w)},${lerp(255, 150, w)},`;
    const paddleC = `rgb(${lerp(160, 245, w)},${lerp(170, 200, w)},${lerp(255, 170, w)})`;

    ctx.save();
    ctx.fillStyle = 'rgba(3,4,9,0.92)';
    ctx.fillRect(0, 0, this.w, this.h);

    // the court
    const sea = ctx.createLinearGradient(0, oy, 0, oy + ch);
    sea.addColorStop(0, bg1); sea.addColorStop(1, bg2);
    ctx.fillStyle = sea;
    ctx.fillRect(ox, oy, cw, ch);
    // a soft radial hearth-glow from the centre, stronger as it warms
    const hearth = ctx.createRadialGradient(ox + cw / 2, oy + ch / 2, 10, ox + cw / 2, oy + ch / 2, cw * 0.6);
    hearth.addColorStop(0, glow + (0.04 + 0.16 * w).toFixed(3) + ')');
    hearth.addColorStop(1, glow + '0)');
    ctx.fillStyle = hearth;
    ctx.fillRect(ox, oy, cw, ch);

    // centre net, dashed
    ctx.strokeStyle = glow + '0.25)';
    ctx.lineWidth = 2; ctx.setLineDash([6, 10]);
    ctx.beginPath(); ctx.moveTo(ox + cw / 2, oy + 6); ctx.lineTo(ox + cw / 2, oy + ch - 6); ctx.stroke();
    ctx.setLineDash([]);

    const px = ox + 22;                 // your paddle x
    const hx = ox + cw - 22;            // her paddle x
    const ph = PADDLE_H * ch;           // paddle half-height in px
    const paddle = (x, cy, lit) => {
      ctx.fillStyle = lit;
      ctx.shadowColor = glow + '0.7)'; ctx.shadowBlur = 12 + 20 * w;
      this.roundRect(x - 4, cy - ph, 8, ph * 2, 4); ctx.fill();
      ctx.shadowBlur = 0;
    };
    paddle(px, oy + g.py * ch, paddleC);
    paddle(hx, oy + (g.ay != null ? g.ay : 0.5) * ch, paddleC);

    // the ball — the zeus_virus: a bright mote with a spark-tail.
    if (g.served && !g.over) {
      const bx = ox + g.ball.x * cw, by = oy + g.ball.y * ch;
      ctx.strokeStyle = 'rgba(255,240,180,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx - g.ball.vx * 22, by - g.ball.vy * 22); ctx.lineTo(bx, by); ctx.stroke();
      ctx.fillStyle = '#fff6d8';
      ctx.shadowColor = '#ffe89a'; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    // frame + labels
    ctx.strokeStyle = glow + '0.4)'; ctx.lineWidth = 2;
    ctx.strokeRect(ox - 1, oy - 1, cw + 2, ch + 2);
    ctx.font = `bold ${Math.max(11, Math.round(ch * 0.05))}px ui-monospace, monospace`;
    ctx.textAlign = 'left'; ctx.fillStyle = glow + '0.85)';
    ctx.fillText('YOU', ox + 4, oy - 8);
    ctx.textAlign = 'right';
    ctx.fillText('CALYPSO', ox + cw - 4, oy - 8);

    // her voice — the exit's only signpost. Fades in and sits under the court.
    const v = calypsoVoice(g);
    if (v && g.served && !g.over) {
      ctx.textAlign = 'center';
      ctx.font = `italic ${Math.max(12, Math.round(ch * 0.055))}px Georgia, serif`;
      ctx.fillStyle = `rgba(${lerp(180,255,w)},${lerp(190,210,w)},${lerp(255,190,w)},0.9)`;
      ctx.fillText(v.line, ox + cw / 2, oy + ch + 26);
    }

    // control hint / the quiet truth that you can leave
    const by2 = oy + ch + 48;
    ctx.textAlign = 'center';
    ctx.font = `${Math.max(10, Math.round(ch * 0.045))}px system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(210,210,225,0.4)';
    const hint = g.hintT > 8
      ? (touch ? 'let it past — drag away and stop tending it — to leave' : 'let it past — stop tending it — to leave')
      : (touch ? 'drag up / down to rally' : 'W / S  or  ↑ ↓  to rally');
    ctx.fillText(hint, ox + cw / 2, by2);

    ctx.textAlign = 'left';
    ctx.restore();
  },

  // Her invitation — the attract screen. Warm from the first, because she has
  // never once thought you might say no.
  drawCalypsoPongAttract(g, touch = false) {
    const ctx = this.ctx;
    const cw = Math.min(this.w - 80, 720);
    const ch = Math.min(this.h - 220, cw * 0.62);
    const ox = Math.round((this.w - cw) / 2);
    const oy = Math.round((this.h - ch) / 2) - 6;
    const cx = ox + cw / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(3,4,9,0.94)'; ctx.fillRect(0, 0, this.w, this.h);
    const gr = ctx.createLinearGradient(0, oy, 0, oy + ch);
    gr.addColorStop(0, '#2a1a2e'); gr.addColorStop(1, '#160f1f');
    ctx.fillStyle = gr; ctx.fillRect(ox, oy, cw, ch);
    ctx.strokeStyle = 'rgba(240,180,150,0.4)'; ctx.lineWidth = 2;
    ctx.strokeRect(ox - 1, oy - 1, cw + 2, ch + 2);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0d0a0';
    ctx.font = `bold ${Math.round(ch * 0.14)}px Georgia, serif`;
    ctx.fillText('STAY A WHILE', cx, oy + ch * 0.34);
    ctx.fillStyle = 'rgba(230,215,235,0.75)';
    ctx.font = `italic ${Math.round(ch * 0.058)}px Georgia, serif`;
    ctx.fillText('Rally with me. There is no clock on this island,', cx, oy + ch * 0.5);
    ctx.fillText('and no war that cannot wait one more evening.', cx, oy + ch * 0.58);

    ctx.fillStyle = 'rgba(210,210,225,0.5)';
    ctx.font = `${Math.round(ch * 0.05)}px system-ui, sans-serif`;
    ctx.fillText(touch ? 'the light is the message you carry. drag to play.'
                       : 'the light is the message you carry. W / S or ↑ ↓ to play.', cx, oy + ch * 0.72);

    if ((g.t >> 4) & 1) {
      ctx.fillStyle = '#ffcf7a';
      ctx.font = `bold ${Math.round(ch * 0.07)}px ui-monospace, monospace`;
      ctx.fillText('PRESS TO BEGIN', cx, oy + ch * 0.88);
    }
    ctx.textAlign = 'left';
    ctx.restore();
  },

  // The release. Not a GAME OVER — you did the one thing that frees you.
  drawCalypsoPongOver(g, over) {
    const ctx = this.ctx;
    const cw = Math.min(this.w - 80, 720);
    const ch = Math.min(this.h - 220, cw * 0.62);
    const ox = Math.round((this.w - cw) / 2);
    const oy = Math.round((this.h - ch) / 2) - 6;
    const cx = ox + cw / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(6,6,12,0.78)'; ctx.fillRect(ox, oy, cw, ch);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9fd6ff';
    ctx.font = `bold ${Math.round(ch * 0.13)}px Georgia, serif`;
    ctx.fillText('YOU LEAVE', cx, oy + ch * 0.34);
    ctx.fillStyle = 'rgba(220,225,235,0.82)';
    ctx.font = `italic ${Math.round(ch * 0.05)}px Georgia, serif`;
    ctx.fillText('You set the paddle down. The light drifts past,', cx, oy + ch * 0.5);
    ctx.fillText('and she does not chase it. Her hold was only ever the game.', cx, oy + ch * 0.58);
    ctx.fillText(`${g.rally} volleys, and the courage to end them.`, cx, oy + ch * 0.68);

    if (over && over.ready) {
      const bw = Math.max(cw * 0.28, 160), bh = Math.max(30, ch * 0.12);
      const bx = cx - bw / 2, byy = oy + ch * 0.8;
      ctx.fillStyle = 'rgba(40,46,64,0.9)';
      this.roundRect(bx, byy, bw, bh, 5); ctx.fill();
      ctx.strokeStyle = 'rgba(159,214,255,0.7)'; ctx.lineWidth = 2;
      this.roundRect(bx, byy, bw, bh, 5); ctx.stroke();
      ctx.fillStyle = '#cfe6ff';
      ctx.font = `bold ${Math.round(ch * 0.06)}px ui-monospace, monospace`;
      ctx.textBaseline = 'middle';
      ctx.fillText('ENTER', cx, byy + bh / 2 + 1);
      ctx.textBaseline = 'alphabetic';
      over.enterRect = { x: bx, y: byy, w: bw, h: bh };
    } else if (over) {
      over.enterRect = null;
    }
    ctx.textAlign = 'left';
    ctx.restore();
  },

  drawStatusCard(player, hud, rx, ry) {
    const ctx = this.ctx;
    ctx.textBaseline = 'alphabetic';

    // Where you are and who holds it, as a labelled pair. ONE font and ONE tone
    // throughout — same family, size, weight and colour for label and value
    // alike, so the whole block sits at a single quiet level. Right-justified,
    // so the values line up flush against the panel edge and the pair reads as a
    // column rather than two loose strings.
    const labelled = (label, value, ly, valueColor, strike) => {
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = valueColor;
      ctx.fillText(value, rx, ly);
      const vw = ctx.measureText(value).width;
      ctx.fillText(label, rx - vw - 6, ly);
      if (strike) {
        ctx.strokeStyle = valueColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rx - vw, ly - 3.5);
        ctx.lineTo(rx, ly - 3.5);
        ctx.stroke();
      }
    };
    // Grey on purpose so the eye is not pulled here. A felled daemon is told by
    // the strikethrough rather than by going green, so the state still reads
    // without spending colour on it — the score is the only coloured thing on
    // the whole dashboard.
    const GREY = 'rgba(207,216,195,0.72)';
    const GREY_DIM = 'rgba(207,216,195,0.42)';
    // Labels shout, names are spoken: ISLAND/AI in caps, the names in Sentence
    // case. The roster is stored in caps (AEGILIA, POLYPHEMUS) because that is
    // how the terminals and the daemons address each other; on the dashboard
    // they read better as places and people than as system identifiers.
    labelled('ISLAND:', sentenceCase(hud.place || '—'), ry + 12, GREY);
    const d = hud.daemon;
    if (d) labelled('AI:', sentenceCase(d.name), ry + 27, d.fallen ? GREY_DIM : GREY, d.fallen);
    else labelled('AI:', 'None', ry + 27, GREY_DIM);
    ctx.textAlign = 'left';
  },

  // The score, pinned hard to the bottom-right corner of the dashboard. It is
  // the one live figure worth watching, so it gets a corner of its own and the
  // only colour on the panel. (The POSEIDON countdown that used to sit up here
  // is gone from the HUD on purpose — a number ticking down in the corner is
  // wallpaper within a minute. It arrives as escalating texts instead, see
  // poseidonWarnings in main.js, and can be looked up in the Record panel.)
  drawScoreCorner(player, rx, baselineY) {
    const ctx = this.ctx;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    // A tiny SCORE over the figure — without it the number is just a number in
    // a corner, and a new player has no idea what it counts.
    // Label and figure share ONE line, the label tucked in to the left of the
    // number. Stacked, the pair was tall enough to sit on top of the PHONE slot
    // on a narrow screen; side by side it fits the strip above the slot row.
    const txt = `${player.score ?? 0}`;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillStyle = '#e8d27a';
    ctx.fillText(txt, rx, baselineY);
    const numW = ctx.measureText(txt).width;
    ctx.font = 'bold 7px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(232,210,122,0.55)';
    const labW = ctx.measureText('SCORE').width;
    ctx.fillText('SCORE', rx - numW - 5, baselineY);
    ctx.textAlign = 'left';
    // Clickable: the number is what the Record panel is ABOUT, so the obvious
    // thing to do with it is press it. Recorded here because only the drawing
    // knows where the pair ended up, and read by main.js on the next frame —
    // the same contract as the backpack and armoury rects. Padded to a target a
    // thumb can find.
    const x0 = rx - numW - 5 - labW - 6;
    this._scoreRect = { x: x0, y: baselineY - 15, w: (rx - x0) + 6, h: 21 };
  },

  // A rounded rectangle path (canvas 2D has roundRect only in newer engines, and
  // this keeps one code path for all of them).
  roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },

  // RUN and JUMP buttons for touch play: two translucent circles above the
  // dashboard on the right, sized for thumbs. RUN is a hold (brightens while
  // held); JUMP fires on the tap. Registered in this.touchButtons each frame
  // for input's touchButtonHit — same rebuild-per-frame pattern as uiSlots.
  drawTouchControls(hud) {
    const ctx = this.ctx;
    const R = 30;
    const bx = this.w - R - 14;
    const baseY = (this.hudTop != null ? this.hudTop : this.h - 120) - R - 12;
    const buttons = [
      { id: 'jump', x: bx, y: baseY - (R * 2 + 14), label: '\u25b2', held: false },
      { id: 'run', x: bx, y: baseY, label: '\u00bb', held: !!hud.touchRunHeld },
    ];
    this.touchButtons = buttons.map((b) => ({ id: b.id, x: b.x, y: b.y, r: R + 6 })); // generous hit radius
    for (const b of buttons) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, R, 0, Math.PI * 2);
      ctx.fillStyle = b.held ? 'rgba(207,216,195,0.30)' : 'rgba(12,15,10,0.42)';
      ctx.fill();
      ctx.strokeStyle = b.held ? 'rgba(232,224,208,0.9)' : 'rgba(207,216,195,0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Glyph and word are a STACKED PAIR, balanced about the centre — the glyph
      // a little above it, the word a little below. Drawing the glyph dead-centre
      // and hanging the word off the rim (as this used to) reads bottom-heavy and
      // makes the label look like it is sliding out of the circle.
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // A soft dark halo so both stay readable over bright sand or wall graffiti.
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 3;
      ctx.fillStyle = b.held ? '#eef2e2' : 'rgba(222,214,192,0.9)';
      ctx.font = 'bold 21px system-ui, sans-serif';
      ctx.fillText(b.label, b.x, b.y - 6);
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.fillText(b.id.toUpperCase(), b.x, b.y + 13);
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
    }
  },

  // The item being dragged, drawn under the cursor.
  drawDragGhost(drag, player) {
    if (!player.getSlot) return;
    const s = player.getSlot(drag.from);
    if (!s) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(drag.mx - 18, drag.my - 18, 36, 36);
    this.drawItemIcon(ITEMS[s.item], drag.mx, drag.my, 0.9);
    ctx.restore();
  },

  // Read-only backpack view (I). Read-only because the split between
  // pockets and backpack is already automatic — there's nothing to drag.
  drawBackpackPanel(player) {
    const ctx = this.ctx;
    const cols = 4, size = 42, gap = 14;
    const gridW = cols * size + (cols - 1) * gap;
    // A column down the left for what you are WEARING, the way every game with
    // armour has done it since Minecraft, because that is where a player looks.
    // Wide enough for the heading line, not just for the slot. It was sized to
    // the slot and the total ran into the rule beside it.
    const armW = size + 56;
    const panelW = Math.min(this.w - 24, gridW + 44 + armW);
    // Tall enough for whichever column is longer and no taller. It was a flat
    // 430 and left a dead band under the grid that read as something missing.
    const wornH = 60 + 4 * (size + 22);
    const gridH = 58 + size + 34 + 4 * (size + 14);
    const panelH = Math.min(this.h - 24, Math.max(wornH, gridH) + 30);
    const px = Math.round((this.w - panelW) / 2);
    const py = Math.round((this.h - panelH) / 2);
    this._backpackRect = { x: px, y: py, w: panelW, h: panelH }; // click-away-to-close hit test (main.js)

    ctx.fillStyle = 'rgba(10,12,8,0.94)';
    ctx.fillRect(px, py, panelW, panelH);
    ctx.strokeStyle = 'rgba(207,216,195,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, panelW - 1, panelH - 1);

    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillStyle = '#e8e0d0';
    ctx.fillText('BACKPACK', px + 20, py + 26);
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(207,216,195,0.6)';
    ctx.textAlign = 'right';
    ctx.fillText('I to close', px + panelW - 20, py + 26);
    ctx.textAlign = 'left';

    // WORN, drawn first and drawn whether or not you have a bag: armour is on
    // you, not in it, and the panel that shows it must not be gated behind
    // finding a backpack.
    // Centred down the panel's body rather than hung from the top: four slots
    // against a four-row grid of a different pitch, so aligning their tops left
    // one column short and the other long.
    const bodyTop = py + 44, bodyBot = py + panelH - 14;
    const colH = ARMOUR_SLOTS.length * (size + 22) - 22;
    const colY = Math.max(bodyTop, Math.round((bodyTop + bodyBot) / 2 - colH / 2));
    this.drawArmourColumn(player, px + 20, colY, size);
    const gx0 = px + 20 + armW;
    // A rule between what you are wearing and what you are carrying. They are
    // two different things and the panel should say so without a heading.
    // Spanning the CONTENT, not the panel. Run to the frame it reads as part of
    // the border and stops separating anything.
    const ruleTop = py + 52, ruleBot = py + panelH - 34;
    ctx.strokeStyle = 'rgba(207,216,195,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(gx0 - 14) + 0.5, ruleTop);
    ctx.lineTo(Math.round(gx0 - 14) + 0.5, ruleBot);
    ctx.stroke();

    if (!player.backpack) {
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(207,216,195,0.7)';
      ctx.fillText("No bag yet — what you are wearing is on the left.", gx0, py + 60);
      return;
    }

    // Spare weapon slot: select with 5, swap with G, same as a pocket.
    const weaponY = py + 42;
    this.drawLabel('SPARE WEAPON \u00b7 5 then G', gx0, weaponY + 10);
    this.drawSlot(gx0, weaponY + 16, size,
      player.backpack.weapon ? ITEMS[player.backpack.weapon] : null, 0, player.selectedPocket === 'bw');
    this.uiSlots.push({ x: gx0, y: weaponY + 16, w: size, h: size, kind: 'bw' });
    if (player.backpack.weapon) {
      ctx.font = '9px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(207,216,195,0.7)';
      ctx.fillText(ITEMS[player.backpack.weapon].name, gx0 + size + 10, weaponY + 16 + size / 2 + 3);
    }

    // 16-slot storage grid: fills automatically; food and ammo are drawn
    // from here on their own once the pockets run out.
    const gridX = gx0, gridY = weaponY + 16 + size + 34;
    this.drawLabel('STORAGE \u00b7 food & ammo used from here', gridX, gridY - 8);
    for (let i = 0; i < 16; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const sx = gridX + col * (size + gap);
      const sy = gridY + row * (size + gap);
      const slot = player.backpack.slots[i];
      this.drawSlot(sx, sy, size, slot ? ITEMS[slot.item] : null, slot ? slot.qty : 0);
      this.uiSlots.push({ x: sx, y: sy, w: size, h: size, kind: 'bpstore', i });
      if (slot) {
        ctx.font = '7px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(207,216,195,0.6)';
        ctx.textAlign = 'center';
        ctx.fillText(ITEMS[slot.item].name, sx + size / 2, sy + size + 9, size + 4);
        ctx.textAlign = 'left';
      }
    }
  },

  // WHAT YOU ARE WEARING. Four slots down the left of the backpack panel, each
  // with a wear bar under it, because armour here is a consumable and a player
  // has to be able to see how much of it is left before the fight rather than
  // during it.
  drawArmourColumn(player, x, y, size) {
    const ctx = this.ctx;
    const worn = player.armourWorn ? player.armourWorn() : {};
    const pts = armourPoints(worn, (k) => ITEMS[k]);
    // The total belongs in the heading. At the foot of the column it sat level
    // with the third row of the storage grid and ran into its labels.
    this.drawLabel('WORN', x, y - 26);
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.fillStyle = pts ? '#c9d3bd' : 'rgba(207,216,195,0.35)';
    // maxWidth as well as room: a number can always surprise you, and a heading
    // that squeezes is a heading that never crosses the rule.
    ctx.fillText(pts ? `${pts} pts \u00b7 ${Math.round(armourReduction(worn, (k) => ITEMS[k]) * 100)}%`
      : 'nothing worn', x, y - 12, size + 40);
    ARMOUR_SLOTS.forEach((slot, i) => {
      const sy = y + i * (size + 22);
      const w = worn[slot];
      const def = w ? ITEMS[w.item] : null;
      this.drawSlot(x, sy, size, def, 0);
      this.uiSlots.push({ x, y: sy, w: size, h: size, kind: 'armour', i: slot });
      // An empty slot says what goes in it, so the column teaches itself.
      if (!def) {
        ctx.font = '8px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(207,216,195,0.3)';
        ctx.textAlign = 'center';
        ctx.fillText(ARMOUR_SLOT_LABEL[slot], x + size / 2, sy + size / 2 + 3);
        ctx.textAlign = 'left';
        return;
      }
      // The wear bar: green while there is plenty, amber past halfway, red at
      // the end, so the colour is the warning and you do not have to read it.
      const f = durFraction(w, (k) => ITEMS[k]);
      const bw = size, bh = 4, by = sy + size + 3;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(x, by, bw, bh);
      ctx.fillStyle = f > 0.5 ? '#5f8f3e' : f > 0.2 ? '#c99a3e' : '#b0392f';
      ctx.fillRect(x, by, Math.max(1, bw * f), bh);
      ctx.font = '7px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(207,216,195,0.65)';
      ctx.textAlign = 'center';
      ctx.fillText(def.short || def.name, x + size / 2, by + bh + 8, size + 12);
      ctx.textAlign = 'left';
    });
  },

  // THE PANELS, as buttons, in the gap between the vitals bars and the hands
  // slot. Each one is stamped with its own keyboard shortcut, so the button
  // both opens the panel and teaches the key; hovering names it in the detail
  // box. Two columns of three, sized to the 40px gap that was already there —
  // no slot moves, and nothing lands under the condition words.
  // Amber under the cursor, the same for every one: these panels are yours, and
  // amber is what the human machines print in. Green belongs to the AIs.
  HUD_BTN_GLOW: '#e8c64f',
  HUD_BTNS: [
    { icon: 'help',    action: 'help',    name: 'Help', sub: 'Keys and commands (H)' },
    { icon: 'notes',   action: 'notes',   name: 'Scrapbook', sub: 'Notes, scraps, maps (N)' },
    { icon: 'books',   action: 'library', name: 'Library', sub: 'Books you have read (Shift+N)' },
    { icon: 'star',    action: 'skills',  name: 'Record', sub: 'Skills and knowledge (K)' },
    { icon: 'map',     action: 'minimap', name: 'Minimap', sub: 'Show or hide the corner map (])' },
    { icon: 'swords',  action: 'weapons', name: 'Armoury', sub: 'What each weapon is for (V)' },
    { icon: 'laurel',  action: 'kleos',   name: 'Kleos', sub: 'Achievements: the song of this run (9)' },
  ],

  // THE PANEL RAIL: one placement, every screen. It stands at the right-hand
  // edge over the world with its foot on the dashboard, and folds down into
  // that foot when you do not want it. Anchored at the BOTTOM rather than the
  // top, so folding and unfolding move the buttons and never the handle — the
  // thing you press stays where you last pressed it.
  drawHudRail(mouse, open, hud) {
    const ctx = this.ctx;
    const mx = mouse ? mouse.x : -1, my = mouse ? mouse.y : -1;
    // Folded, the handle is all there is, so it grows a little to be findable —
    // downward only, so its top edge does not move between the two states.
    const S = 17, gap = 2, HH = open ? 9 : 14;
    const GLOW = this.HUD_BTN_GLOW;
    const x = this.w - S - 8;
    const dashTop = this.hudTop != null ? this.hudTop : this.h;
    // Centred down the world's height (the dashboard is not the world), with
    // the handle hung off the bottom of where the column WOULD be — computed
    // from the open layout whether it is open or not, so folding moves the
    // buttons and never the handle. The thing you press stays where you last
    // pressed it.
    const n = this.HUD_BTNS.length;
    const colH = n * (S + gap) - gap;
    const colTop = Math.round(dashTop / 2 - colH / 2);
    const hy = colTop + colH + 4;

    this.uiButtons = [];
    const hHot = mx >= x && mx <= x + S && my >= hy && my <= hy + HH;
    ctx.save();
    if (hHot) { ctx.globalAlpha = 0.2; ctx.fillStyle = GLOW; } else ctx.fillStyle = 'rgba(12,15,10,0.5)';
    this.roundRect(x, hy, S, HH, 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = hHot ? GLOW : 'rgba(207,216,195,0.28)';
    ctx.lineWidth = 1;
    this.roundRect(x + 0.5, hy + 0.5, S - 1, HH - 1, 2); ctx.stroke();
    // A chevron pointing the way it will go: up to unfold, down to put away.
    ctx.fillStyle = hHot ? GLOW : 'rgba(207,216,195,0.6)';
    ctx.beginPath();
    const cxm = x + S / 2, cym = hy + HH / 2, d = open ? 1 : -1;
    ctx.moveTo(cxm - 3.5, cym - 1.6 * d);
    ctx.lineTo(cxm + 3.5, cym - 1.6 * d);
    ctx.lineTo(cxm, cym + 2 * d);
    ctx.closePath(); ctx.fill();
    this.uiButtons.push({ action: 'menu', x, y: hy, w: S, h: HH,
      name: open ? 'Put away' : 'Panels',
      sub: open ? 'Fold the buttons down' : 'Help, Scrapbook, Library, Record, Minimap, Armoury' });
    if (open) this.drawHudRailButtons(colTop, x, S, gap, mx, my, GLOW);
  },

  // The column itself, drawn the same whether a handle sits under it or not.
  drawHudRailButtons(colTop, x, S, gap, mx, my, GLOW) {
    const ctx = this.ctx;
    this.HUD_BTNS.forEach((b, i) => {
      const y = colTop + i * (S + gap);
      const hot = mx >= x && mx <= x + S && my >= y && my <= y + S;
      ctx.save();
      if (hot) { ctx.globalAlpha = 0.2; ctx.fillStyle = GLOW; } else ctx.fillStyle = 'rgba(12,15,10,0.5)';
      this.roundRect(x, y, S, S, 3); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = hot ? GLOW : 'rgba(207,216,195,0.28)';
      ctx.lineWidth = 1;
      this.roundRect(x + 0.5, y + 0.5, S - 1, S - 1, 3); ctx.stroke();
      this.drawPanelIcon(b.icon, x + 3, y + 3, S - 6,
        hot ? GLOW : 'rgba(223,230,212,0.85)', hot ? GLOW : null);
      this.uiButtons.push({ ...b, x, y, w: S, h: S });
    });
  },

  // The panel icons, drawn rather than set in type: at 11px a letter is just a
  // letter, and these have to read as the thing they open. Each is built inside
  // an s x s box at (x, y) so the caller only picks a corner.
  drawPanelIcon(kind, x, y, s, col, glow) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = col; ctx.fillStyle = col;
    ctx.lineWidth = 1; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 6; }
    const u = s / 11;                       // the icons are drawn on an 11-unit grid
    const P = (a, b) => [x + a * u, y + b * u];
    if (kind === 'help') {
      // a question mark, hooked and dotted
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(...P(5.5, 3.6), 2.3 * u, Math.PI * 0.95, Math.PI * 0.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(...P(5.5, 5.9)); ctx.lineTo(...P(5.5, 7.3));
      ctx.stroke();
      ctx.beginPath(); ctx.arc(...P(5.5, 9.2), 0.85 * u, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'notes') {
      // a page with a folded corner and three ruled lines
      ctx.beginPath();
      ctx.moveTo(...P(2, 1)); ctx.lineTo(...P(7, 1)); ctx.lineTo(...P(9, 3));
      ctx.lineTo(...P(9, 10)); ctx.lineTo(...P(2, 10)); ctx.closePath();
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(...P(7, 1)); ctx.lineTo(...P(7, 3)); ctx.lineTo(...P(9, 3)); ctx.stroke();
      ctx.beginPath();
      for (const ly of [5, 6.8, 8.6]) { ctx.moveTo(...P(3.6, ly)); ctx.lineTo(...P(7.4, ly)); }
      ctx.stroke();
    } else if (kind === 'books') {
      // three spines on a shelf, the last one leaning
      ctx.beginPath();
      ctx.rect(...P(1.6, 2.4), 2 * u, 6.6 * u);
      ctx.rect(...P(4.2, 1.6), 2 * u, 7.4 * u);
      ctx.stroke();
      ctx.save();
      ctx.translate(...P(8.4, 9));
      ctx.rotate(0.28);
      ctx.beginPath(); ctx.rect(-1.9 * u, -6.4 * u, 1.9 * u, 6.4 * u); ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(...P(1, 9.8)); ctx.lineTo(...P(10, 9.8)); ctx.stroke();
    } else if (kind === 'star') {
      // a five-pointed star: the Record, and what you have earned in it
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const r = (k % 2 ? 2.1 : 4.7) * u;
        const a = -Math.PI / 2 + k * Math.PI / 5;
        const px = x + 5.5 * u + Math.cos(a) * r, py = y + 5.6 * u + Math.sin(a) * r;
        k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fill();
    } else if (kind === 'swords') {
      // two crossed blades, each with a crossguard and a stub of grip
      ctx.lineWidth = 1.2;
      for (const dir of [1, -1]) {
        const bx = 5.5 - dir * 3.6, tx = 5.5 + dir * 3.6;
        ctx.beginPath();
        ctx.moveTo(...P(bx, 9.6)); ctx.lineTo(...P(tx, 1.6));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(...P(bx - dir * 1.3, 7.4)); ctx.lineTo(...P(bx + dir * 1.5, 8.6));
        ctx.stroke();
      }
    } else if (kind === 'laurel') {
      // a laurel wreath: two curved sprays meeting at the foot, open at the top
      // where a name would go. Kleos is what the wreath was for.
      ctx.lineWidth = 1.2;
      for (const dir of [1, -1]) {
        ctx.beginPath();
        ctx.moveTo(...P(5.5 + dir * 0.6, 10));
        ctx.quadraticCurveTo(...P(5.5 + dir * 5.2, 7.4), ...P(5.5 + dir * 3.4, 1.6));
        ctx.stroke();
        for (let i = 0; i < 3; i++) {
          const t = 0.3 + i * 0.24;
          const lx = 5.5 + dir * (1.2 + t * 3.4), ly = 9.2 - t * 6.4;
          ctx.beginPath();
          ctx.ellipse(...P(lx, ly), 1.5, 0.85, dir * (0.7 - t * 0.5), 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    } else if (kind === 'map') {
      // a map folded in three, creased up and down
      ctx.beginPath();
      ctx.moveTo(...P(1.2, 2.6)); ctx.lineTo(...P(4.4, 1.4)); ctx.lineTo(...P(7.6, 2.9));
      ctx.lineTo(...P(10.4, 1.6)); ctx.lineTo(...P(10.4, 8.4)); ctx.lineTo(...P(7.6, 9.7));
      ctx.lineTo(...P(4.4, 8.2)); ctx.lineTo(...P(1.2, 9.4)); ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(...P(4.4, 1.4)); ctx.lineTo(...P(4.4, 8.2));
      ctx.moveTo(...P(7.6, 2.9)); ctx.lineTo(...P(7.6, 9.7));
      ctx.stroke();
    }
    ctx.restore();
  },

  /** Which panel button (if any) is under a screen point. */
  hudButtonAt(mx, my) {
    for (const b of this.uiButtons || []) {
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) return b;
    }
    return null;
  },

  // Which dashboard/backpack slot (if any) is under a screen point. Later
  // entries (the backpack panel, drawn on top) win over earlier ones.
  slotAt(mx, my) {
    for (let k = this.uiSlots.length - 1; k >= 0; k--) {
      const s = this.uiSlots[k];
      if (mx >= s.x && mx <= s.x + s.w && my >= s.y && my <= s.y + s.h) return s;
    }
    return null;
  },

  // A small amber-on-black LCD window under the walkman that scrolls the
  // now-playing text across itself (a marquee) so a long "artist — track"
  // fits the narrow slot. Held still, centred, when the tape isn't playing.
  drawWalkmanTicker(text, x, y, w, scrolling) {
    const ctx = this.ctx;
    const h = 11;
    ctx.fillStyle = 'rgba(10,12,8,0.9)'; // LCD backing
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.save();
    ctx.beginPath(); ctx.rect(x + 1, y + 1, w - 2, h - 2); ctx.clip();
    ctx.font = '8px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = scrolling ? 'rgba(180,158,96,0.72)' : 'rgba(207,216,195,0.45)'; // dim amber, not bright
    const tw = ctx.measureText(text).width;
    const midY = y + h / 2 + 0.5;
    if (scrolling) {
      // Always scroll while playing, very slowly, looping continuously around
      // — a wide gap plus a second copy so the wrap is seamless even for a
      // short title. ~/150 is a gentle drift, not a ticker.
      const gap = w;
      const period = tw + gap;
      const off = (performance.now() / 150) % period;
      ctx.textAlign = 'left';
      ctx.fillText(text, x + w - off, midY);
      ctx.fillText(text, x + w - off + period, midY);
    } else {
      ctx.textAlign = 'center';
      ctx.fillText(text, x + w / 2, midY);
    }
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  },

  // Compact dashboard for narrow (phone) screens: short vitals bars on the
  // left, a compact score/countdown block, then a single right-aligned strip of
  // the slots that matter — hands, pockets, backpack, walkman — sized to fit so
  // nothing runs off the edge or collides with the status text (the desktop
  // layout's fixed x-positions overflow a ~375px screen).
  drawDashboardCompact(player, hud) {
    const ctx = this.ctx;
    const W = this.w;
    const MDH = 120;
    const top = this.h - MDH;
    this.hudTop = top; // input.uiHitTest reads this (see desktop variant)
    ctx.fillStyle = 'rgba(12,15,10,0.9)';
    ctx.fillRect(0, top, W, MDH);
    ctx.fillStyle = 'rgba(207,216,195,0.25)';
    ctx.fillRect(0, top, W, 1);

    // --- Top row: vitals (left), score/countdown (right). ---
    // Shorter than they were (150 / 42%): a bar you read as a fraction does not
    // need the width, and the space it gives back is where the panel buttons go.
    const bx = 10, bw = Math.min(112, Math.round(W * 0.32));
    this.drawBar(bx, top + 16, bw, 6, player.health / player.maxHealth, '#b0392f', 'HP', 0.25);
    this.drawBar(bx, top + 34, bw, 6, player.stamina / player.maxStamina, '#5f8f3e', 'STA');
    this.drawBar(bx, top + 52, bw, 6, (player.food ?? 100) / (player.maxFood ?? 100), '#c99a3e', 'FOOD');
    // conditions, small, just right of the bars
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'left';
    const cx = bx + bw + 8;
    if (player.venom > 0) { ctx.fillStyle = '#b07fd8'; ctx.fillText('POISON', cx, top + 21); }
    if (player.isSwine()) { ctx.fillStyle = '#e0a0b0'; ctx.fillText('SWINE', cx, top + 39); }
    else if (player.swine >= 0.3) { ctx.fillStyle = '#e0a0b0'; ctx.fillText('TURNING', cx, top + 39); }
    else if (player.invisibleToRobots) { ctx.fillStyle = '#4fd8c3'; ctx.fillText(`HID ${Math.ceil((player.wifiPower || 0) / 60)}m`, cx, top + 39); }
    if (player.food <= 0) { ctx.fillStyle = '#e05548'; ctx.fillText('STARVING', cx, top + 57); }
    else if (player.food < 25) { ctx.fillStyle = '#d8a04f'; ctx.fillText('HUNGRY', cx, top + 57); }
    // The status card: where you are, who holds it, and how you are doing —
    // boxed and tight so it reads as one panel rather than three loose lines
    // floating over the terrain.
    this.drawStatusCard(player, hud, W - 10, top + 8);

    // Score hard into the bottom-right corner of the dashboard panel.
    this.drawScoreCorner(player, W - 10, top + MDH - 63);   // in the clear band above the slot labels

    // --- Bottom row: the slot strip, full width — hands, pockets, backpack,
    // walkman, all visible and reachable. ---
    const S = 40, P = 34, gap = 6;
    const sy = top + MDH - 46;
    let sx = bx;
    this.drawLabel('HANDS', sx, sy - 5);
    this.drawSlot(sx, sy, S, player.hands ? ITEMS[player.hands] : null, 0);
    this.uiSlots.push({ x: sx, y: sy, w: S, h: S, kind: 'hands' });
    sx += S + gap;
    for (let i = 0; i < player.pockets.length; i++) {
      const slot = player.pockets[i];
      this.drawSlot(sx, sy, P, slot ? ITEMS[slot.item] : null, slot ? slot.qty : 0, player.selectedPocket === i);
      this.uiSlots.push({ x: sx, y: sy, w: P, h: P, kind: 'pocket', i });
      sx += P + gap;
    }
    if (player.backpack) {
      this.drawLabel('PACK', sx, sy - 5);
      this.drawSlot(sx, sy, P, ITEMS.backpack, 0);
      this.uiSlots.push({ x: sx, y: sy, w: P, h: P, kind: 'packbadge' });
      sx += P + gap;
    }
    // The walkman is a deck, not another pocket — give it breathing room from
    // the pack badge, and draw the REAL cassette (reels turning during play)
    // rather than a frozen item icon.
    sx += 12;
    this.drawLabel('WALK', sx, sy - 5);
    this.drawSlot(sx, sy, P, null, 0, player.walkmanSide != null);
    if (player.walkman) {
      const def = ITEMS[player.walkman.item];
      const playing = player.walkmanSide != null;
      const spin = playing ? (performance.now() / 1000) * 5 : 0;
      const ctx2 = this.ctx;
      ctx2.save();
      ctx2.translate(sx + P / 2, sy + P / 2);
      const sc = P / 30;
      ctx2.scale(sc, sc);
      // right (take-up) reel leads the supply reel, as on the title deck
      this.drawCassette(def, spin, playing ? spin - 0.5 : 0);
      ctx2.restore();
    }
    this.uiSlots.push({ x: sx, y: sy, w: P, h: P, kind: 'walkman' });
    // The PHONE box, beside the deck (compact strip). Signal bars live next to
    // the label, clear of the handset sprite.
    sx += P + 10;
    this.drawLabel('PHONE', sx, sy - 5);
    this.drawSignalBars(sx + 34, sy - 5, hud && hud.nokiaSignal || 0);
    this.drawPhoneBox(sx, sy, P, player);
    // The LAPTOP box, next along: the machine you carry (docs/laptop-plan.md).
    // Empty until you find one. Click it to open the shell (slot kind 'laptop').
    sx += P + 10;
    this.drawLabel('LAPTOP', sx, sy - 5);
    this.drawLaptopBox(sx, sy, P, player);
  },

  // The LAPTOP box: the one console that isn't bolted down. Draws the model you
  // carry with its own body colour and OS screen tint (drawItemIcon, kind
  // 'laptop'); an empty cradle when you have none.
  drawLaptopBox(x, y, s, player) {
    this.drawSlot(x, y, s, null, 0);
    const lap = player.laptop;
    if (lap && ITEMS[lap.model]) {
      // Pass the instance's OS/damage through to the icon so the screen tint and
      // any cracking match THIS machine, not just its model.
      const def = { ...ITEMS[lap.model], os: lap.os, damage: lap.damage };
      this.drawItemIcon(def, x + s / 2, y + s / 2, s / 26);
    }
    this.uiSlots.push({ x, y, w: s, h: s, kind: 'laptop' });
  },

  // The PHONE box: the Nokia 3310 in its cradle beside the walkman. Click it to
  // open the SMS screen (main.js, slot kind 'phone').
  drawPhoneBox(x, y, s, player) {
    const ctx = this.ctx;
    this.drawSlot(x, y, s, null, 0);
    if (player.phone && NOKIA_SPRITE && NOKIA_SPRITE.complete && NOKIA_SPRITE.naturalWidth) {
      const ih = s - 6;
      const iw = ih * (NOKIA_SPRITE.naturalWidth / NOKIA_SPRITE.naturalHeight);
      ctx.drawImage(NOKIA_SPRITE, x + (s - iw) / 2, y + 3, iw, ih);
    }
    this.uiSlots.push({ x, y, w: s, h: s, kind: 'phone' });
  },

  // LIVE signal bars, drawn beside the PHONE label (not on the handset itself) —
  // they strengthen as you near Calypso, and die entirely off her island: the
  // handset tells you whose network this is. (x, y) is the label baseline to
  // draw just right of.
  drawSignalBars(x, y, bars) {
    const ctx = this.ctx;
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i < (bars || 0) ? '#9fd058' : 'rgba(207,216,195,0.25)';
      ctx.fillRect(x + i * 3, y - 2 - i * 1.6, 2, 2 + i * 1.6);
    }
  },

  drawDashboard(player, hud) {
    // The full desktop dashboard uses fixed x-positions that only stop colliding
    // once there's room for the whole left slot-strip (bars → hands → pockets →
    // pack → walkman, ending ~600px) AND the right-aligned status block (name +
    // deadline + score + rank, ~180px). Below ~800 the walkman starts running
    // into the status text — so hand anything narrower to the reflowing compact
    // layout, with a little margin so the handover happens before it looks tight.
    if (this.w < 810) { this.drawDashboardCompact(player, hud); return; }
    const ctx = this.ctx;
    const top = this.h - DASH_H;
    this.hudTop = top; // input.uiHitTest: touches below this line are UI, not movement

    ctx.fillStyle = 'rgba(12,15,10,0.88)';
    ctx.fillRect(0, top, this.w, DASH_H);
    ctx.fillStyle = 'rgba(207,216,195,0.25)';
    ctx.fillRect(0, top, this.w, 1);

    // Vitals
    this.drawBar(16, top + 14, 150, 8, player.health / player.maxHealth, '#b0392f', 'HEALTH', 0.25);
    this.drawBar(16, top + 37, 150, 8, player.stamina / player.maxStamina, '#5f8f3e', 'STAMINA');
    this.drawBar(16, top + 60, 150, 8, (player.food ?? 100) / (player.maxFood ?? 100), '#c99a3e', 'FOOD');
    // Live status: terse condition text tucked by the vitals bars.
    this.drawConditionsInline(player, top);

    // Hands slot
    const handsX = 210;
    this.drawLabel('HANDS', handsX, top + 14);
    this.drawSlot(handsX, top + 20, 44, ITEMS[player.hands], 0);
    this.uiSlots.push({ x: handsX, y: top + 20, w: 44, h: 44, kind: 'hands' });
    if (player.hands) {
      ctx.fillStyle = 'rgba(207,216,195,0.7)';
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillText(ITEMS[player.hands].name, handsX, top + 74);

      const heldDef = ITEMS[player.hands];
      if (heldDef.kind === 'gun') {
        const countIn = (slots) => slots.reduce(
          (sum, s) => (s && s.item === heldDef.ammoType ? sum + s.qty : sum), 0);
        const ammoCount = countIn(player.pockets) + (player.backpack ? countIn(player.backpack.slots) : 0);
        ctx.font = 'bold 10px system-ui, sans-serif';
        ctx.fillStyle = ammoCount > 0 ? '#e8e0d0' : '#e05548';
        ctx.textAlign = 'right';
        ctx.fillText(String(ammoCount), handsX + 41, top + 60);
        ctx.textAlign = 'left';
      } else if (heldDef.kind === 'gadget') {
        // Wi-Fi block: a small battery gauge showing remaining charge, and
        // the minutes left. Drains only while held; feed it a battery to refill.
        const frac = Math.max(0, Math.min(1, (player.wifiPower || 0) / (player.wifiMax || 1)));
        const bx = handsX + 30, by = top + 24, bw = 8, bh = 16;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = frac > 0.25 ? '#4fd8c3' : '#e05548';
        ctx.fillRect(bx, by + bh * (1 - frac), bw, bh * frac);
        ctx.strokeStyle = 'rgba(207,216,195,0.6)';
        ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
        ctx.fillStyle = 'rgba(207,216,195,0.6)';
        ctx.fillRect(bx + 2.5, by - 2, 3, 2); // battery nub
        ctx.font = 'bold 9px system-ui, sans-serif';
        ctx.fillStyle = frac > 0 ? '#cfd8c3' : '#e05548';
        ctx.fillText(frac > 0 ? `${Math.ceil((player.wifiPower || 0) / 60)}m` : 'dead', handsX, top + 60);
      }
    }

    // Pockets
    const pocketsX = 286;
    this.drawLabel('POCKETS', pocketsX, top + 14);
    for (let i = 0; i < player.pockets.length; i++) {
      const slot = player.pockets[i];
      const slotX = pocketsX + i * 42;
      this.drawSlot(slotX, top + 20, 36, slot ? ITEMS[slot.item] : null, slot ? slot.qty : 0,
        player.selectedPocket === i);
      this.uiSlots.push({ x: slotX, y: top + 20, w: 36, h: 36, kind: 'pocket', i });
      if (slot) {
        ctx.font = '7px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(207,216,195,0.6)';
        ctx.textAlign = 'center';
        ctx.fillText(ITEMS[slot.item].name, slotX + 18, top + 66, 40);
        ctx.textAlign = 'left';
      }
    }

    // Backpack summary badge, once found: click it (or press I) for the full panel.
    if (player.backpack) {
      const bpX = pocketsX + player.pockets.length * 42 + 10;
      const used = player.backpack.slots.filter(Boolean).length;
      this.drawLabel('PACK (click or I)', bpX, top + 14);
      this.drawSlot(bpX, top + 20, 36, ITEMS.backpack, 0);
      this.uiSlots.push({ x: bpX, y: top + 20, w: 36, h: 36, kind: 'packbadge' });
      ctx.font = '9px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(207,216,195,0.7)';
      ctx.fillText(`${used}/16`, bpX, top + 66);
    }

    // The walkman, on its carry strap: a deck slot that takes cassettes.
    // Clicking the tape cycles side A -> side B -> stop (player.equipSlot);
    // while its current side is actually what the music system is playing,
    // the reels visibly turn, like the real thing through a cracked window.
    {
      const wmX = pocketsX + player.pockets.length * 42 + 10 + (player.backpack ? 92 : 0);
      this.drawLabel('WALKMAN', wmX, top + 14);
      // A little walkman deck rather than a plain slot: rounded corners, a
      // double outline (dark outer, bright inner bezel), and the iconic
      // sports-walkman yellow behind the cassette window.
      const wy = top + 20, ws = 36, rr = 8;
      const roundPath = (x, y, w, h, r) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      };
      roundPath(wmX, wy, ws, ws, rr);
      ctx.fillStyle = '#e6b422'; // walkman yellow
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(20,18,8,0.85)'; // dark outer edge
      ctx.stroke();
      roundPath(wmX + 2.5, wy + 2.5, ws - 5, ws - 5, rr - 2.5);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,240,180,0.7)'; // bright inner bezel
      ctx.stroke();
      this.uiSlots.push({ x: wmX, y: wy, w: ws, h: ws, kind: 'walkman' });
      if (player.walkman && ITEMS[player.walkman.item]) {
        const tapeDef = ITEMS[player.walkman.item];
        const side = player.walkmanSide
          ? (player.walkmanSide === 'A' ? tapeDef.sideA : tapeDef.sideB) : null;
        const spinning = !!player.walkmanSide; // a tape is playing whenever a side is loaded
        ctx.save();
        ctx.translate(wmX + 18, top + 38);
        ctx.scale(1.25, 1.25);
        this.drawCassette(tapeDef, spinning ? performance.now() / 300 : 0);
        ctx.restore();
        // A little LCD "now playing" window under the deck: the artist and
        // track scroll slowly across so a long name fits the narrow slot.
        const label = spinning
          ? `${tapeDef.artist || '?'} — ${side.label}`
          : 'stopped';
        this.drawWalkmanTicker(label, wmX - 2, top + 60, ws + 4, spinning);
      }
      // The PHONE box, right beside the deck: the Nokia 3310 in its cradle.
      // Signal bars sit next to the label, clear of the handset sprite.
      const phX = wmX + ws + 18;
      this.drawLabel('PHONE', phX, top + 14);
      this.drawSignalBars(phX + 34, top + 14, hud.nokiaSignal || 0);
      this.drawPhoneBox(phX, top + 20, ws, player);
      // The LAPTOP box next along, on this layout too — otherwise the machine you
      // are carrying is invisible here and looks as though it was never given.
      const lapX = phX + ws + 14;
      this.drawLabel('LAPTOP', lapX, top + 14);
      this.drawLaptopBox(lapX, top + 20, ws, player);
    }

    // Thin dividers between the kit groups: HANDS | POCKETS | PACK | WALKMAN,
    // so the strip reads as sections rather than one run of slots. Centred in
    // each gap from the slot geometry above.
    {
      const lastPocketEnd = pocketsX + (player.pockets.length - 1) * 42 + 36;
      const seps = [pocketsX - 16, lastPocketEnd + 8]; // hands|pockets, pockets|next
      if (player.backpack) {
        const bpEnd = pocketsX + player.pockets.length * 42 + 10 + 36; // pack slot right edge
        const wmStart = pocketsX + player.pockets.length * 42 + 10 + 92; // walkman left
        seps.push((bpEnd + wmStart) / 2); // pack|walkman
      }
      ctx.strokeStyle = 'rgba(207,216,195,0.16)';
      ctx.lineWidth = 1;
      for (const sx of seps) {
        ctx.beginPath();
        ctx.moveTo(Math.round(sx) + 0.5, top + 12);
        ctx.lineTo(Math.round(sx) + 0.5, top + DASH_H - 12);
        ctx.stroke();
      }
    }

    // Stats block: the same status lines the compact HUD uses, so both
    // dashboards say the same things about where you are and who holds it. They
    // must sit inside DASH_H (78), hence the tight top offset.
    //
    // The player's name is NOT here. You know who you are; it never changed and
    // never will, so it was costing a line of the dashboard to tell you
    // something you cannot act on. It still appears where it earns its place —
    // the title screen, the SMS threads, and the death certificate.
    this.drawStatusCard(player, hud, this.w - 12, top + 6);
    this.drawScoreCorner(player, this.w - 12, top + DASH_H - 10);
  },

  // Terse condition text tucked beside the vitals bars — the narrow-desktop
  // fallback for the fuller chip row (drawStatusChips), so a mid-width window
  // still shows the critical states even without room for the middle chips.
  drawConditionsInline(player, top) {
    const ctx = this.ctx;
    ctx.font = 'bold 9px system-ui, sans-serif';
    if (player.venom > 0) { ctx.fillStyle = '#b07fd8'; ctx.fillText('POISONED', 92, top + 9); }
    if (player.isSwine()) {
      ctx.fillStyle = '#e0a0b0';
      ctx.fillText('SWINE — BENEATH NOTICE', 92, top + 32);
    } else if (player.swine >= 0.3) {
      ctx.fillStyle = '#e0a0b0';
      ctx.fillText(`TURNING ${Math.round(player.swine * 100)}%`, 92, top + 32);
    } else if (player.invisibleToRobots) {
      ctx.fillStyle = '#4fd8c3';
      ctx.fillText(player.terminalSafe ? 'HIDDEN' : `HIDDEN ${Math.ceil((player.wifiPower || 0) / 60)}m`, 92, top + 32);
    }
    if (player.food <= 0) { ctx.fillStyle = '#e05548'; ctx.fillText('STARVING', 92, top + 55); }
    else if (player.food < 25) { ctx.fillStyle = '#d8a04f'; ctx.fillText('HUNGRY', 92, top + 55); }
  },

  // HUD elements that must show whichever dashboard variant is up (desktop or
  // compact): the transient message line, the daemon's dying voice, and the
  // title wordmark + version stamp. These used to live inside drawDashboard
  // AFTER its early-return to the compact layout, so on a narrow window they
  // silently vanished — the "wordmark goes missing when small" bug, and with
  // it every say() message and the whole death-aria. Drawn here, after the
  // dashboard has set this.hudTop, they render at any width.
  drawHudOverlay(player, hud, modalOpen) {
    // Drawn here, after whichever dashboard has set hudTop, so the rail stands
    // on the right edge at either width without being written out twice.
    // Not drawn behind a panel, and not TAPPABLE behind one either — the rects
    // are rebuilt from the draw, so leaving a stale set would take taps meant
    // for whatever is on top.
    if (modalOpen) this.uiButtons = [];
    else this.drawHudRail(hud.mouse, hud.menuOpen !== false, hud);
    const ctx = this.ctx;
    const top = this.hudTop != null ? this.hudTop : this.h - DASH_H;

    // Transient message line, lifted well above the panel so it clears the
    // bottom-anchored touch/help hint DOM line on a narrow phone screen (they
    // used to share a row and overlap into unreadable text). Sits below the
    // toast (which is higher still). say() output — narration, hints.
    if (player.message) {
      ctx.textAlign = 'left';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillStyle = `rgba(232,224,208,${Math.min(1, player.message.ttl)})`;
      ctx.fillText(player.message.text, 16, top - 28);
    }

    // The daemon's voice — the core speaking as you break it. Its own caption
    // band, centred in the upper third (screen-relative, not tied to the
    // dashboard), with a speaker tag and a tier colour (wrath gold, mercy
    // amber, dying cyan) so the register reads before the words do.
    if (player.daemonVoice) this.drawDaemonVoice(player.daemonVoice);

    // Title wordmark, top-left — matches the gate/title branding: mono type,
    // dim "Nost" + bright glowing "OS" (no blinking caret in-game).
    ctx.textAlign = 'left';
    ctx.font = '700 15px ui-monospace, "SF Mono", Menlo, monospace';
    const bx = 12, by = 22;
    ctx.fillStyle = 'rgba(207,216,195,0.55)';
    ctx.fillText('Nost', bx, by);
    const postW = ctx.measureText('Nost').width;
    ctx.save();
    ctx.fillStyle = '#eaf3d6';
    ctx.shadowColor = 'rgba(220,232,200,0.75)';
    ctx.shadowBlur = 7;
    ctx.fillText('OS', bx + postW, by);
    ctx.restore();
    // Version stamp under the wordmark — so you can always read which build
    // you're playing without opening a menu. Kept small and dim.
    if (hud.version) {
      ctx.font = '9px ui-monospace, "SF Mono", Menlo, monospace';
      ctx.fillStyle = 'rgba(207,216,195,0.4)';
      ctx.fillText('v' + hud.version, bx, by + 11);
    }
  },

  drawLabel(text, x, y, color) {
    const ctx = this.ctx;
    ctx.font = '9px system-ui, sans-serif';
    ctx.fillStyle = color || 'rgba(207,216,195,0.55)';
    ctx.fillText(text, x, y);
  },

  drawBar(x, y, w, h, frac, color, label, flashBelow = 0) {
    const ctx = this.ctx;
    const f = Math.max(0, Math.min(1, frac));
    // Danger flash: once the bar drops below flashBelow it blinks bright red and
    // gets a pulsing red outline + red label, so a critical level grabs the eye.
    const danger = flashBelow > 0 && f > 0 && f < flashBelow;
    const pulse = danger ? 0.5 + 0.5 * Math.sin(performance.now() / 130) : 0;
    this.drawLabel(label, x, y - 5, danger ? `rgba(255,${Math.round(70 + 60 * (1 - pulse))},60,${0.7 + 0.3 * pulse})` : undefined);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = danger && pulse > 0.5 ? '#ff5b4a' : color;
    ctx.fillRect(x, y, f * w, h);
    ctx.strokeStyle = danger ? `rgba(255,80,64,${0.45 + 0.45 * pulse})` : 'rgba(0,0,0,0.5)';
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  },

  drawSlot(x, y, size, itemDef, qty, selected = false) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = selected ? '#e0c04f' : 'rgba(207,216,195,0.35)';
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    ctx.lineWidth = 1;
    if (!itemDef) return;
    // Draw the icon large enough to fill the slot, clipped to the box so a
    // bigger weapon icon can't spill over the border or the qty badge.
    ctx.save();
    ctx.beginPath(); ctx.rect(x + 1, y + 1, size - 2, size - 2); ctx.clip();
    this.drawItemIcon(itemDef, x + size / 2, y + size / 2, size / 26);
    ctx.restore();
    if (qty > 1) {
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillStyle = '#e8e0d0';
      ctx.textAlign = 'right';
      ctx.fillText(String(qty), x + size - 3, y + size - 4);
      ctx.textAlign = 'left';
    }
  },

  // ---- KLEOS (docs/achievements-plan.md) ------------------------------------
  // The song of the run: tracks down the left, badges and the lifetime ledger
  // down the right. Everything here renders from achieveModel() — the panel
  // holds no state of its own, so it can never disagree with the engine.

  // A badge is DRAWN, not lettered: a shape you learn to recognise at a glance,
  // lit when earned and a bare outline when not. The shape is inferred from the
  // badge's own id, so a new registry row gets a sensible icon for free (a star)
  // without the renderer having to be told about it.
  _kleosBadgeShape(id, ai) {
    if (ai) return 'chip';
    if (id.startsWith('card-')) return 'card';
    if (['needle-drop', 'both-sides', 'discography', 'b-side'].includes(id)) return 'tape';
    if (['bookworm', 'rtfm', 'hello-world'].includes(id)) return 'book';
    if (['first-tincan', 'perseus'].includes(id)) return 'blade';
    if (['copyleft', 'four-freedoms', 'viral', 'free-as-in'].includes(id)) return 'copyleft';
    return 'star';
  },

  _kleosBadge(x, y, s, badge) {
    const ctx = this.ctx;
    const lit = badge.earned;
    const ink = lit ? (badge.ai ? '#7fd0ff' : '#e8c96a') : 'rgba(207,216,195,0.22)';
    const fill = lit ? (badge.ai ? 'rgba(60,120,160,0.30)' : 'rgba(150,120,40,0.28)') : 'rgba(255,255,255,0.03)';
    const cx = x + s / 2, cy = y + s / 2, r = s * 0.42;
    ctx.save();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = ink;
    ctx.fillStyle = fill;
    const shape = this._kleosBadgeShape(badge.id, badge.ai);
    ctx.beginPath();
    if (shape === 'chip') {
      // A hexagon: the AI-safety set, and the shape of every die ever packaged.
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
    } else if (shape === 'card') {
      ctx.rect(cx - r, cy - r * 0.68, r * 2, r * 1.36);
    } else if (shape === 'tape') {
      ctx.rect(cx - r, cy - r * 0.62, r * 2, r * 1.24);
    } else if (shape === 'book') {
      ctx.rect(cx - r * 0.8, cy - r, r * 1.6, r * 2);
    } else if (shape === 'blade') {
      ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * 0.55, cy + r); ctx.lineTo(cx - r * 0.55, cy + r); ctx.closePath();
    } else if (shape === 'copyleft') {
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    } else {
      // A five-pointed star for everything else.
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const rr = i % 2 ? r * 0.46 : r;
        const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
    }
    ctx.fill(); ctx.stroke();
    // The details that make each shape read as the thing it is.
    if (lit) {
      ctx.fillStyle = ink;
      if (shape === 'tape') {
        ctx.beginPath(); ctx.arc(cx - r * 0.38, cy, r * 0.2, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.38, cy, r * 0.2, 0, Math.PI * 2); ctx.fill();
      } else if (shape === 'card') {
        ctx.fillRect(cx - r * 0.7, cy - r * 0.34, r * 0.7, r * 0.22);
      } else if (shape === 'chip') {
        ctx.fillRect(cx - r * 0.32, cy - r * 0.32, r * 0.64, r * 0.64);
      } else if (shape === 'copyleft') {
        // A reversed C: the copyleft mark, which is the joke drawn.
        ctx.strokeStyle = ink; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, Math.PI * 1.75, Math.PI * 0.75); ctx.stroke();
      } else if (shape === 'book') {
        ctx.fillRect(cx - r * 0.5, cy - r * 0.5, r, 1.2);
        ctx.fillRect(cx - r * 0.5, cy - r * 0.1, r, 1.2);
      }
    }
    ctx.restore();
  },

  // The four tier pips a track climbs. The last is the summit, drawn as a star
  // rather than a diamond, so a finished track is visibly finished.
  _kleosPips(x, y, tier, total = 4) {
    const ctx = this.ctx;
    ctx.save();
    for (let i = 0; i < total; i++) {
      const cx = x + i * 11, cy = y;
      const on = i < tier;
      ctx.fillStyle = on ? '#e8c96a' : 'rgba(207,216,195,0.18)';
      ctx.beginPath();
      if (i === total - 1) {
        for (let k = 0; k < 10; k++) {
          const a = (Math.PI / 5) * k - Math.PI / 2;
          const rr = k % 2 ? 1.9 : 4.2;
          const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
          k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
      } else {
        ctx.moveTo(cx, cy - 3.6); ctx.lineTo(cx + 3.2, cy); ctx.lineTo(cx, cy + 3.6); ctx.lineTo(cx - 3.2, cy);
      }
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  },

  // Cut a line to fit a width, with an ellipsis if it had to be cut.
  _clampText(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
    return t + '…';
  },

  drawKleosModal(model) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(6,8,5,0.86)';
    ctx.fillRect(0, 0, this.w, this.h);
    const wide = this.w >= 700;
    const pw = Math.min(wide ? 760 : 420, this.w - 24);
    const k = Math.max(0.72, Math.min(1, pw / 760));
    const fs = (n) => `${Math.round(n * k)}px system-ui, sans-serif`;
    const fsb = (n) => `bold ${Math.round(n * k)}px system-ui, sans-serif`;
    const pad = Math.round(18 * k);
    const trackRow = Math.round(26 * k);
    const bs = Math.round(26 * k), bgap = Math.round(5 * k);   // badge cell + gap
    const colW = wide ? Math.round((pw - pad * 3) / 2) : pw - pad * 2;
    const perRow = Math.max(6, Math.floor((colW + bgap) / (bs + bgap)));
    const badgeRows = Math.ceil(model.badges.length / perRow);

    const hTracks = Math.round(30 * k) + model.tracks.length * trackRow;
    // The badge column also carries LIFETIME, LAURELS and the roll of downed
    // obelisks, so the panel has to be tall enough for however long that roll is.
    const nKills = (model.killLog || []).length;
    const killRows = nKills ? Math.min(6, Math.ceil(nKills / 8)) + 1 : 0;
    const hBadges = Math.round(30 * k) + badgeRows * (bs + bgap)
      + Math.round(26 * k) + killRows * Math.round(13 * k);
    const body = wide ? Math.max(hTracks, hBadges) : hTracks + hBadges;
    const ph = Math.min(this.h - 24, Math.round(76 * k) + body + pad * 2);
    const px = Math.round((this.w - pw) / 2), py = Math.round((this.h - ph) / 2);
    this._kleosRect = { x: px, y: py, w: pw, h: ph };   // click-away-to-close (main.js)

    ctx.fillStyle = '#12160e';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = 'rgba(232,201,106,0.45)';
    ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);

    // Header
    ctx.fillStyle = '#e8c96a';
    ctx.font = fsb(17);
    ctx.fillText('KLEOS', px + pad, py + Math.round(30 * k));
    ctx.font = fs(11);
    ctx.fillStyle = 'rgba(207,216,195,0.55)';
    ctx.fillText('the song of this run — 9 or Esc to close', px + pad + Math.round(62 * k), py + Math.round(30 * k));
    const hrs = Math.floor((model.playSeconds || 0) / 3600);
    ctx.textAlign = 'right';
    ctx.fillText(`day ${model.day || 0}${hrs ? ` · ${hrs}h played` : ''}`, px + pw - pad, py + Math.round(30 * k));
    ctx.textAlign = 'left';
    ctx.strokeStyle = 'rgba(207,216,195,0.18)';
    ctx.beginPath(); ctx.moveTo(px + pad, py + Math.round(44 * k)); ctx.lineTo(px + pw - pad, py + Math.round(44 * k)); ctx.stroke();

    // ---- tracks
    const lx = px + pad;
    let y = py + Math.round(66 * k);
    ctx.font = fsb(10);
    ctx.fillStyle = 'rgba(207,216,195,0.5)';
    ctx.fillText('TRACKS', lx, y); y += Math.round(16 * k);
    this._kleosTrackCells = [];
    for (const t of model.tracks) {
      // The whole row is the hover target, so the blurb explaining what a track
      // MEANS is one hover away — the names alone (CASSANDRA, DAEDALUS) do not
      // tell you what you are being asked to do.
      this._kleosTrackCells.push({
        x: lx, y: y - Math.round(11 * k), w: colW, h: trackRow, track: t,
      });
      const broken = t.purity && !t.purity.intact;
      ctx.font = fsb(11);
      ctx.fillStyle = t.summited ? '#e8c96a' : broken ? 'rgba(207,216,195,0.42)' : '#cfd8c3';
      ctx.fillText(t.name, lx, y);
      this._kleosPips(lx + Math.round(124 * k), y - Math.round(4 * k), t.tier);
      ctx.font = fs(10);
      ctx.fillStyle = 'rgba(207,216,195,0.6)';
      const right = lx + Math.round(178 * k);
      if (broken) {
        ctx.fillStyle = '#d98a6a';
        ctx.fillText(`✕ ${t.purity.why} (day ${t.purity.day})`, right, y);
      } else if (t.summited) {
        ctx.fillStyle = '#e8c96a';
        ctx.fillText(`${t.tierLabel} — all of it`, right, y);
      } else {
        // A holding conduct track flies its flag at the right edge, so the
        // detail has to stop short of it: DAEDALUS on a narrow panel ran
        // straight through the word.
        const room = colW - Math.round(178 * k) - (t.purity && t.purity.intact ? Math.round(40 * k) : 0);
        ctx.fillText(this._clampText(ctx, `${t.have}/${t.next} ${t.unit || ''}${t.summitName ? ` → ${t.summitName}` : ''}`, room), right, y);
      }
      // A conduct track still holding says so: it is the thing you are spending
      // the run to keep.
      if (t.purity && t.purity.intact) {
        ctx.fillStyle = 'rgba(140,200,140,0.75)';
        ctx.textAlign = 'right';
        ctx.fillText('holds', lx + colW, y);
        ctx.textAlign = 'left';
      }
      y += trackRow;
    }

    // ---- badges + the ledger
    const rx = wide ? px + pad * 2 + colW : lx;
    let ry = wide ? py + Math.round(66 * k) : y + Math.round(10 * k);
    ctx.font = fsb(10);
    ctx.fillStyle = 'rgba(207,216,195,0.5)';
    ctx.fillText(`BADGES  ${model.badgesEarned}/${model.badges.length}`, rx, ry);
    ry += Math.round(16 * k);
    this._kleosBadgeCells = [];
    model.badges.forEach((b, i) => {
      const bx = rx + (i % perRow) * (bs + bgap);
      const by = ry + Math.floor(i / perRow) * (bs + bgap);
      this._kleosBadge(bx, by, bs, b);
      this._kleosBadgeCells.push({ x: bx, y: by, w: bs, h: bs, badge: b });
    });
    ry += badgeRows * (bs + bgap) + Math.round(10 * k);

    // The lifetime ledger, in one line: what survives every death.
    const earnedM = model.milestones.filter((m) => m.earned);
    ctx.font = fs(10);
    ctx.fillStyle = 'rgba(207,216,195,0.55)';
    ctx.fillText(earnedM.length ? `LIFETIME  ${earnedM.map((m) => m.name).join(' · ')}`
      : 'LIFETIME  nothing yet — it accrues across every run', rx, ry);
    ry += Math.round(15 * k);
    if (model.laurels.length) {
      ctx.fillStyle = '#e8c96a';
      ctx.fillText(`LAURELS  ${model.laurels.map((l) => `${l.name}·${String(l.island).toUpperCase()}`).join('  ')}`, rx, ry);
      ry += Math.round(15 * k);
    }

    // The roll of downed obelisks, by their hex code names. Bracketed, so a run
    // of hex reads as separate names rather than one long string of characters.
    const killLog = model.killLog || [];
    if (killLog.length) {
      ry += Math.round(6 * k);
      ctx.font = fsb(10);
      ctx.fillStyle = 'rgba(207,216,195,0.5)';
      ctx.fillText(`OBs DOWNED  ${killLog.length}`, rx, ry);
      ry += Math.round(15 * k);
      ctx.font = `${Math.round(10 * k)}px ui-monospace, monospace`;
      ctx.fillStyle = '#e0503a';
      const wrapped = this._wrapText(ctx, killLog.map((c) => `[${c}]`).join(' '), colW);
      // Whatever room is left below the badge grid; the panel is already sized.
      const room = Math.max(0, (py + ph - pad) - ry);
      const fit = Math.floor(room / Math.round(13 * k));
      for (const line of wrapped.slice(0, fit)) { ctx.fillText(line, rx, ry); ry += Math.round(13 * k); }
      if (wrapped.length > fit) {
        ctx.fillStyle = 'rgba(207,216,195,0.45)';
        ctx.fillText(`… and ${killLog.length - fit * 4} more`, rx, ry);
      }
    }
  },

  // The hovered badge's name and blurb, drawn last so it sits over the grid.
  drawKleosTip(mx, my) {
    const inside = (c) => mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h;
    const hitT = (this._kleosTrackCells || []).find(inside);
    if (hitT) return this._kleosTip(mx, my, hitT.track.name, this._kleosTrackTip(hitT.track), true);
    const hit = (this._kleosBadgeCells || []).find(inside);
    if (!hit) return;
    const b = hit.badge;
    return this._kleosTip(mx, my, b.name, b.earned ? b.blurb : 'Not yet earned.', b.earned);
  },

  // What a track is asking of you, in the words the panel cannot fit inline:
  // its blurb, then how it is measured and (for a conduct track) what breaks it.
  _kleosTrackTip(t) {
    const how = t.summited
      ? `Complete: ${t.tierLabel}.`
      : `${t.have} of ${t.next} ${t.unit || ''} to the next tier${t.summitName ? `; ${t.summitName} at the summit` : ''}.`;
    const purity = !t.purity ? ''
      : t.purity.intact
        ? ' The constraint still holds this run — win an island without breaking it and the laurel is yours.'
        : ` Broken on day ${t.purity.day}: ${t.purity.why}.`;
    return `${t.blurb} ${how}${purity}`;
  },

  _kleosTip(mx, my, title, body, lit) {
    const ctx = this.ctx;
    ctx.font = '11px system-ui, sans-serif';
    const lines = this._wrapText(ctx, body, 250);
    const w = 266, h = 30 + lines.length * 14;
    const x = Math.min(Math.max(8, mx - w / 2), this.w - w - 8);
    const y = my > this.h / 2 ? my - h - 14 : my + 18;
    ctx.fillStyle = 'rgba(10,14,10,0.96)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = lit ? 'rgba(232,201,106,0.6)' : 'rgba(207,216,195,0.3)';
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.fillStyle = lit ? '#e8c96a' : 'rgba(207,216,195,0.6)';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(title, x + 10, y + 18);
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(207,216,195,0.75)';
    lines.forEach((l, i) => ctx.fillText(l, x + 10, y + 34 + i * 14));
  },
};
