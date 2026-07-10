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

export const DASH_H = 78; // dashboard panel height

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
};
