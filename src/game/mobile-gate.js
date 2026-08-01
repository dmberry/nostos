// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// Mobile fallback. NostOS is a keyboard/mouse game and isn't playable on a
// phone, so on a touch device we skip loading the game (main.js never runs)
// and show this gate: a friendly note plus a working Walkman for the
// soundtrack. Everything visual is drawn with the SAME code the game uses —
// real cassettes (Renderer.drawCassette) in the deck and rack, real machines
// (robots.js drawRobot) dancing above — so it looks like NostOS, not a
// mock-up. Switchable World / Backspace / AI colour themes.

import { TAPES } from './items.js';
import { VERSION } from '../version.js';
import { wireHelpTabs } from './help-tabs.js';
import { fillMachineGallery } from './machine-icons.js';
import { fillAboutTapes } from './about-tapes.js';
import { sortStages, KEEP_STAGES } from './stages.js';
import { Renderer } from '../engine/renderer.js';
import { drawRobot } from './robots.js';
import { worldToScreen } from '../engine/iso.js';
import { showBootLoader } from './boot-loader.js';
import { mountSettingsPanel } from './settings-panel.js';
// The game's own sound singleton, imported for the SETTINGS PANEL only. The
// title screen's walkman has its own little AudioContext (it plays before the
// game exists); this is the object whose levels the sliders set, and it keeps
// them in localStorage, so a level chosen here is the level the run starts at.
import { sfx } from '../engine/sound.js';

export function isMobile() {
  const ua = /Mobi|Android|iPhone|iPod|iPad|Silk|Kindle|BlackBerry|Opera Mini|IEMobile/i.test(navigator.userAgent || '');
  const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  const narrow = Math.min(window.innerWidth, window.innerHeight) < 820;
  return ua || (coarse && narrow);
}

// The desktop start screen is the same component in 'title' mode: same dancing
// machines, same playable Walkman, same themes and doomsday clock, but with a
// Start / Continue action row instead of the mobile "you need a keyboard" note.
export function initTitleScreen() { return initMobileGate('title'); }

// Colour themes lifted from the three worlds. Each sets the gate background,
// text accent, and the Walkman deck's body/edge.
// Backgrounds are kept fairly light so the (dark) machines read against them.
const THEMES = {
  World: { bg1: '#3f5730', bg2: '#26331b', accent: '#dce8c8', deck: '#e6b422', edge: 'rgba(20,18,8,0.9)', bezel: 'rgba(255,240,180,0.75)' },
  Backspace: { bg1: '#8f8250', bg2: '#5c5330', accent: '#211d0c', deck: '#b9a862', edge: 'rgba(34,28,10,0.9)', bezel: 'rgba(240,230,170,0.6)' },
  AI: { bg1: '#4a5563', bg2: '#2b333d', accent: '#e2ecf4', deck: '#828d99', edge: 'rgba(8,10,13,0.92)', bezel: 'rgba(210,224,236,0.55)' },
};

// A minimal-but-complete machine object for drawRobot — the fields its body
// draws read. Drawn at world (0,0) → screen origin, so the caller just
// translates the context to place it.
function mkRobot(type) {
  return {
    type, x: 0, y: 0, hp: 100, maxHp: 100, dead: false, hurt: false,
    facing: { x: 0.35, y: 1 }, aggro: false, stuck: false, returning: false,
    attackTimer: 0, noProgressT: 0, wanderTarget: null, wanderTimer: 0,
    walkPhase: 0, animT: Math.random() * 10, battery: 100, drained: false,
    recharging: false, friendly: false, fused: false, zombie: false,
    disabledT: 0, scrapPenalty: false, workTarget: null, workScanT: 0,
    chopPulseT: 0, following: false, bumpCooldown: 0, spawnT: 0,
    ubikConfusedT: 0, _confuseHopT: 0, tremor: 0, home: { x: 0, y: 0 },
    losLostT: 0, loseInterestT: 0, repelledT: 0, singing: false, knockT: 0,
  };
}

export function initMobileGate(mode = 'gate') {
  const isTitle = mode === 'title';
  let hasSave = false;
  try { hasSave = !!localStorage.getItem('postai-character'); } catch (e) { /* storage blocked */ }
  // Stage checkpoints (main.js writes these) — the Load list, newest milestone
  // first. Loading one restores its seed + save and boots the resume path, so
  // you can drop back to a point you'd earned (the way to recover after death).
  let stageEntries = [];
  try {
    const stages = JSON.parse(localStorage.getItem('postai-stages') || '{}');
    // Highest rung first; ties broken by when it was written, so the
    // hand-written checkpoints (all one order, above every rung) come newest
    // first rather than in whatever order the store happens to hold them.
    stageEntries = sortStages(stages);   // the same order main.js prunes by
  } catch (e) { /* storage blocked */ }
  let running = true;   // frame loop / clock keep going until we boot the game
  let skyTimer = null;
  const el = document.createElement('div');
  el.id = 'mobile-gate';
  if (isTitle) el.dataset.mode = 'title';

  // Markup pieces, composed differently per mode: the gate is one column; the
  // title lays the same pieces out as two columns (hero text | Walkman) with
  // the dancing machines as a full-width band along the bottom, so it fits a
  // landscape laptop instead of a tall phone strip.
  // The build is part of the identity, not small print. It used to sit in the
  // footer at 9px in 30% grey with the T2s and W4s walking over it, which meant
  // a screenshot of the title did not say which build it was and a player
  // reporting a bug had to hunt for it. Set beside the wordmark, from VERSION,
  // which stays the single source of truth.
  const brandHtml = `<div class="mg-brand"><span class="mg-brand-mark" aria-hidden="true"></span><h1>Nost<span class="mg-ai">OS</span><span class="mg-caret">_</span></h1><span class="mg-brandver">v${VERSION}</span></div>`;
  const stageHtml = `<div class="mg-stage" id="mg-stage"></div>`;
  const deckHtml = `<div class="mg-deck">
      <canvas class="mg-deck-cass" id="mg-deck-cass" width="264" height="168"></canvas>
      <div class="mg-transport">
        <button id="mg-play" title="Play / pause" aria-label="Play or pause">▶</button>
        <button id="mg-stop" title="Stop" aria-label="Stop">■</button>
        <button id="mg-next" title="Next track" aria-label="Next track">▶▶|</button>
      </div>
    </div>`;
  const rackHtml = `<div class="mg-rack" id="mg-rack"></div>`;
  const themesHtml = `<div class="mg-themes" id="mg-themes">
      <button data-theme="World" class="on">World</button>
      <button data-theme="Backspace">Backspace</button>
      <button data-theme="AI">AI</button>
    </div>`;
  // On the phone gate the vertical space is tight, so the theme switch lives
  // behind a hamburger (fixed, top-right) instead of a row at the bottom that
  // gets clipped by the browser chrome. The title (desktop) keeps it inline.
  // The hamburger also carries an About entry.
  const menuHtml = `<div class="mg-menu">
      <button class="mg-menu-btn" id="mg-menu-btn" aria-label="Menu" aria-expanded="false">☰</button>
      <div class="mg-menu-pop" id="mg-menu-pop" hidden>
        <div class="mg-menu-label">Theme</div>${themesHtml}
        <button class="mg-menu-about" id="mg-menu-help">Help</button>
        <button class="mg-menu-about" id="mg-menu-about">About</button>
      </div>
    </div>`;
  // Soundtrack list, built straight from the tape ledger so it can't drift.
  // No About of its own. The game's panel is in index.html, it is always in the
  // DOM, and it is the one that gets edited — a second copy here was a second
  // set of credits, and the one nobody edits is the one everybody reads. Moved
  // into the gate on open, like the help panel, so it inherits the theme.
  const aboutHtml = '';
  // No version here any more — it is up beside the wordmark, where it can be
  // read. Printing it twice on one screen only teaches a player to distrust one.
  const footerHtml = `<div class="mg-madein">beta · Game designed in the UK · ${isTitle ? '' : '<button class="mg-about-open" id="mg-help-foot">Help</button> · '}<button class="mg-about-open" id="mg-about-open">About</button></div>`;
  // A looping game-world clip drifting slowly behind everything, low opacity.
  // It plays at half speed (set in JS) and pans gently left→right (CSS).
  // H.264 MP4 — plays in every modern browser (transcoded from the source .mov).
  // The backdrop is a looping GIF (was a 7.5 MB MP4; the GIF is ~1.9 MB and
  // reads the same at 0.18 opacity behind everything). Its `src` is NOT in the
  // markup: it is attached in JS only if the connection can spare it, so a
  // data-saver or slow-network visitor issues ZERO requests for it and sees the
  // themed backdrop alone. A GIF loops on its own — nothing to autoplay.
  const videoHtml = `<img class="mg-bgvideo" alt="" aria-hidden="true">`;
  const copyHtml = isTitle
    ? `<p class="mg-sub">The machines made the world standing reserve. Only a God can save you.<span class="mg-sub2">A keyboard-and-mouse survival game.<br>Here's the soundtrack while you decide.</span></p>
       <div class="mg-actions">
         ${hasSave ? '<button id="mg-continue" class="mg-btn primary">Continue</button>' : ''}
         <button id="mg-start" class="mg-btn ${hasSave ? '' : 'primary'}">${hasSave ? 'New game' : 'Start'}</button>
       </div>
       <div class="mg-actions mg-actions-aux">
         <button id="mg-settings-open" class="mg-btn quiet">Settings</button>
         <button id="mg-help-open" class="mg-btn quiet">Help</button>
       </div>`
    : `<p class="mg-sub">It's the end of the world.<span class="mg-sub2">This is a beta — playable end to end, and still growing. You can play it right here with touch controls (hold to move, tap to act), or grab a laptop for the full keyboard-and-mouse game. Either way, here's the soundtrack.</span></p>
       <div class="mg-actions">
         ${hasSave ? '<button id="mg-continue" class="mg-btn primary">Continue</button>' : ''}
         <button id="mg-start" class="mg-btn ${hasSave ? '' : 'primary'}">${hasSave ? 'New game' : '▶ Play (beta)'}</button>
       </div>
       <div class="mg-actions mg-actions-aux">
         <button id="mg-settings-open" class="mg-btn quiet">Settings</button>
         <button id="mg-help-open" class="mg-btn quiet">Help</button>
       </div>`;
  // The checkpoint list is not a desktop feature. A phone player who has died
  // wants to drop back to a rung they earned exactly as much as anybody else.
  const checkpointHtml = (stageEntries.length)
    ? `<div class="mg-stages">
         <div class="mg-stages-h">Load a checkpoint${stageEntries.length > 3
           ? ` &middot; ${stageEntries.length} saved, scroll for the rest` : ''}</div>
         <div class="mg-stage-wrap${stageEntries.length > 3 ? ' more' : ''}"><div class="mg-stage-list">${stageEntries.map((s) => `<button class="mg-stage-btn" data-id="${s.id}"><span class="mg-stage-name">${s.label}</span><span class="mg-stage-score">${s.score || 0}</span></button>`).join('')}</div></div>
       </div>`
    : '';
  const bodyHtml = isTitle
    ? `${videoHtml}<div class="mg-hero">${brandHtml}${copyHtml}${checkpointHtml}${themesHtml}</div>
       <div class="mg-player">${deckHtml}${rackHtml}</div>
       ${stageHtml}${footerHtml}${aboutHtml}`
    : `${videoHtml}${brandHtml}${copyHtml}${checkpointHtml}${stageHtml}${deckHtml}${rackHtml}${menuHtml}${footerHtml}${aboutHtml}`;

  el.innerHTML = `
    <style>
      #mobile-gate { position: fixed; inset: 0; z-index: 10000; overflow: hidden;
        --bg1: ${THEMES.World.bg1}; --bg2: ${THEMES.World.bg2}; --accent: ${THEMES.World.accent};
        --deck: ${THEMES.World.deck}; --edge: ${THEMES.World.edge}; --bezel: ${THEMES.World.bezel};
        background: radial-gradient(120% 90% at 50% 0%, var(--bg1) 0%, var(--bg2) 72%);
        color: #cfd8c3; font-family: system-ui, -apple-system, sans-serif;
        display: flex; flex-direction: column; align-items: center;
        padding: max(16px, env(safe-area-inset-top)) 16px calc(max(14px, env(safe-area-inset-bottom)) + 22px);
        -webkit-user-select: none; user-select: none; touch-action: manipulation; }
      /* On a phone the column is taller than the screen — brand, copy, Play,
         machines, deck, rack. It was clipped, not scrolled, so the tape titles at
         the bottom were cut in half and the footer, which is fixed, printed
         straight over what was left. It scrolls now. The desktop title is a
         grid built to fit and keeps the clip. */
      #mobile-gate:not([data-mode="title"]) { overflow-y: auto; -webkit-overflow-scrolling: touch; }
      /* moving game-world backdrop: low opacity, gently panning left↔right
         (negative z-index so it sits behind all the in-flow content). */
      .mg-bgvideo { position: absolute; top: 0; left: 0; height: 100%; width: auto; min-width: 100%;
        z-index: -1; opacity: 0.18; object-fit: cover; pointer-events: none;
        /* Anchored at the top and zoomed 1.35x, so the bottom of the frame —
           where a parked car sits — pushes below the fold and is clipped by
           the gate's overflow. The zoom rides in the pan keyframes (transform
           is one property); origin top keeps the crop on the bottom edge. */
        transform-origin: center top;
        animation: mg-pan 90s ease-in-out infinite alternate; will-change: transform; }
      @keyframes mg-pan { from { transform: translateX(0) scale(1.35); } to { transform: translateX(-14%) scale(1.35); } }
      @media (prefers-reduced-motion: reduce) { .mg-bgvideo { animation: none; } }
      /* branding wordmark: mono terminal type, glowing AI, blinking caret,
         and a little cassette mark — themes with --accent. */
      .mg-brand { display: flex; align-items: center; gap: 12px; margin: 2px 0 1px; }
      #mobile-gate h1 { font: 800 30px ui-monospace, "SF Mono", Menlo, monospace; letter-spacing: 0.01em;
        margin: 0; color: #f2ecda; text-shadow: 0 2px 14px rgba(0,0,0,0.55); }
      #mobile-gate h1 .mg-ai { color: var(--accent); text-shadow: 0 0 16px color-mix(in srgb, var(--accent) 70%, transparent); }
      #mobile-gate h1 .mg-caret { color: var(--accent); font-weight: 400; margin-left: 2px;
        animation: mg-blink 1.1s steps(1) infinite; }
      @keyframes mg-blink { 0%,50% { opacity: 1; } 51%,100% { opacity: 0; } }
      .mg-brand-mark { width: 34px; height: 22px; border-radius: 4px; flex: 0 0 auto; position: relative;
        background: #26282d; border: 1.6px solid rgba(0,0,0,0.55);
        box-shadow: 0 3px 10px rgba(0,0,0,0.4), inset 0 0 0 2px var(--deck); }
      .mg-brand-mark::before, .mg-brand-mark::after { content: ''; position: absolute; top: 9px;
        width: 8px; height: 8px; border-radius: 50%; background: #e8e2d0; box-shadow: inset 0 0 0 2px #26282d; }
      .mg-brand-mark::before { left: 6px; } .mg-brand-mark::after { right: 6px; }
      /* The build, set as a tag on the wordmark: monospace like the mark, in the
         theme accent, sitting on the baseline of the type rather than under it. */
      .mg-brandver { font: 600 9px ui-monospace, "SF Mono", Menlo, monospace; letter-spacing: 0.06em;
        color: var(--accent); opacity: 0.75; align-self: flex-end; padding-bottom: 6px; margin-left: -6px;
        text-shadow: 0 0 8px color-mix(in srgb, var(--accent) 35%, transparent); }
      #mobile-gate .mg-sub { font-size: 15px; line-height: 1.4; color: #f0ead8; font-weight: 700; text-align: center; max-width: 30em; margin: 0 0 2px; }
      #mobile-gate .mg-sub2 { display: block; font-size: 12px; font-weight: 400; color: var(--accent); margin-top: 6px; }
      .mg-tryanyway { font-size: 12px; color: var(--accent); opacity: 0.8; text-decoration: underline;
        text-underline-offset: 3px; cursor: pointer; margin: 10px 0; background: none; border: none; font-family: inherit; }
      .mg-tryanyway:active { opacity: 1; }
      /* title-mode Start / Continue actions */
      .mg-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin: 8px 0 2px; flex: 0 0 auto; }
      /* The second row is about the game rather than a way into it: tucked up
         under the first, smaller, and separated by a hairline so the two read
         as two groups without needing a label to say so. */
      .mg-actions-aux { gap: 8px; margin: 2px 0 0; padding-top: 10px; position: relative; }
      .mg-actions-aux::before { content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
        width: 54px; height: 1px; background: currentColor; opacity: 0.18; }
      .mg-actions-aux .mg-btn { font-size: 13px; padding: 6px 13px; }
      .mg-btn { font: 700 15px system-ui, sans-serif; letter-spacing: 0.03em; cursor: pointer; font-family: inherit;
        color: var(--accent); background: rgba(255,255,255,0.07); border: 1.5px solid var(--accent);
        border-radius: 8px; padding: 10px 24px; transition: transform 0.1s; }
      .mg-btn.primary { color: #10130d; background: var(--accent); border-color: var(--accent); }
      /* Help sits with the buttons you came here to press, but does not compete
         with them: same size to hit, lighter to look at. */
      .mg-btn.quiet { font-weight: 500; opacity: 0.75;
        border-color: color-mix(in srgb, var(--accent) 30%, transparent); }
      .mg-btn.quiet:hover { opacity: 1; }
      .mg-btn:hover { background: color-mix(in srgb, var(--accent) 22%, transparent); }
      .mg-btn.primary:hover { background: color-mix(in srgb, var(--accent) 88%, white); }
      .mg-btn:active { transform: scale(0.96); }
      /* stage checkpoints (Load list) */
      .mg-stages { margin: 10px 0 2px; text-align: center; flex: 0 0 auto; }
      .mg-stages-h { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); opacity: 0.7;
        max-width: min(260px, 84vw); margin: 0 auto 6px; }
      /* A list, not a row of chips: a run that has been going a while has more
         checkpoints than fit across the hero column, and they wrapped into a
         block that pushed everything below it off the screen. Three rows are
         shown; the rest are one scroll away, newest at the top. */
      /* Wrapped, so the fade below can sit over the scrolling list without
         scrolling with it. */
      .mg-stage-wrap { position: relative; width: min(260px, 84vw); margin: 0 auto; }
      .mg-stage-list { display: flex; flex-direction: column; gap: 4px;
        max-height: 104px; overflow-y: auto; padding-right: 2px;
        scrollbar-width: thin; -webkit-overflow-scrolling: touch; }
      /* The bottom row is cut in half on purpose and the fade says so. A list
         that ends flush at its own edge reads as a list that has ended. */
      .mg-stage-wrap.more::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0;
        height: 22px; pointer-events: none;
        background: linear-gradient(to top, var(--bg2), transparent); }
      .mg-stage-list::-webkit-scrollbar { width: 5px; }
      .mg-stage-list::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--accent) 30%, transparent); border-radius: 3px; }
      .mg-stage-name { text-align: left; }
      .mg-stage-score { font-size: 10px; opacity: 0.6; }
      .mg-stage-btn { display: flex; align-items: center; justify-content: space-between; gap: 10px;
        width: 100%; flex: 0 0 auto; font: 600 12px system-ui, sans-serif; cursor: pointer; font-family: inherit;
        padding: 7px 10px; border-radius: 6px; color: var(--accent);
        background: rgba(255,255,255,0.06); border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent); }
      .mg-stage-btn:hover { background: color-mix(in srgb, var(--accent) 18%, transparent); }
      .mg-stage-btn:active { transform: scale(0.95); }
      /* theme switch (under the tape rack) */
      .mg-themes { display: flex; gap: 6px; margin-top: 18px; justify-content: center; flex: 0 0 auto; }
      .mg-themes button { font: 600 11px system-ui, sans-serif; letter-spacing: 0.06em; text-transform: uppercase;
        color: var(--accent); background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.18);
        border-radius: 5px; padding: 5px 11px; cursor: pointer; }
      .mg-themes button.on { color: #10130d; background: var(--accent); border-color: var(--accent); }
      /* hamburger theme menu (mobile gate only) */
      .mg-menu { position: fixed; top: max(10px, env(safe-area-inset-top)); right: max(10px, env(safe-area-inset-right)); z-index: 20; }
      .mg-menu-btn { width: 42px; height: 42px; border-radius: 10px; font-size: 19px; line-height: 1; cursor: pointer;
        color: var(--accent); background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.22); font-family: inherit; }
      .mg-menu-btn:active { transform: scale(0.94); }
      .mg-menu-pop { position: absolute; top: 48px; right: 0; min-width: 150px; padding: 8px;
        background: rgba(18,22,14,0.97); border: 1px solid rgba(255,255,255,0.18); border-radius: 11px;
        box-shadow: 0 10px 26px rgba(0,0,0,0.55); }
      .mg-menu-pop[hidden] { display: none; }
      .mg-menu-label { font: 700 10px system-ui, sans-serif; text-transform: uppercase; letter-spacing: 0.08em;
        color: var(--accent); opacity: 0.75; margin: 2px 4px 7px; }
      .mg-menu .mg-themes { flex-direction: column; gap: 6px; margin-top: 0; }
      .mg-menu .mg-themes button { width: 100%; text-align: center; }
      .mg-menu-about { width: 100%; margin-top: 8px; padding: 8px 11px; cursor: pointer; font: 700 12px system-ui, sans-serif;
        letter-spacing: 0.04em; color: var(--accent); background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.18); border-radius: 6px; }
      /* "designed in the UK" footer + About link (both modes) */
      /* A band, not a floating line: anything scrolling under it has to be
         covered or the two sets of type read as one mangled one. */
      .mg-madein { position: fixed; left: 0; right: 0; bottom: 0;
        padding: 10px 0 max(5px, env(safe-area-inset-bottom));
        background: linear-gradient(to top, var(--bg2) 62%, transparent);
        text-align: center; font-size: 10px; letter-spacing: 0.03em; color: rgba(207,216,195,0.42); z-index: 6; pointer-events: none; }
      .mg-about-open { font: inherit; color: rgba(207,216,195,0.7); background: none; border: none; padding: 0;
        text-decoration: underline; text-underline-offset: 2px; cursor: pointer; pointer-events: auto; }
      .mg-ver { font-size: 9px; color: rgba(207,216,195,0.3); letter-spacing: 0.02em; }
      /* The About box lives in index.html as #about; mobile-gate borrows it (see openAbout). */
      /* POSEIDON skylink countdown */
      .mg-skylink { font: 700 12px ui-monospace, monospace; letter-spacing: 0.1em; text-transform: uppercase;
        color: #5b9dff; text-shadow: 0 0 8px rgba(70,130,255,0.6); margin: 0 0 4px;
        border: 1px solid rgba(70,130,255,0.4); border-radius: 4px; padding: 4px 10px; background: rgba(8,18,44,0.6); }
      .mg-skylink span { color: #cfe0ff; }
      .mg-skylink.imminent { animation: mg-alarm 0.8s steps(1) infinite; }
      @keyframes mg-alarm { 0%,50% { opacity: 1; } 51%,100% { opacity: 0.35; } }
      /* dancing machines (canvas, drawn by drawRobot) */
      /* The machines stand on the floor of whatever room there is. A fixed
         min-height pushed them off the bottom of a short window and straight
         through the footer, which is position:fixed and does not move for
         them — so the band is capped against the viewport and the canvases
         scale to it (width:auto keeps each robot's proportions). */
      .mg-stage { flex: 1 1 auto; display: flex; align-items: flex-end; justify-content: center; gap: 8px; width: 100%;
        min-height: 0; max-height: min(190px, 24vh); overflow: hidden;
        background: radial-gradient(70% 120% at 50% 100%, rgba(255,255,255,0.14), transparent 72%); }
      .mg-bot { width: auto; height: 122px; max-height: 100%; }
      /* walkman deck — the yellow, double-outlined box from the HUD */
      .mg-deck { width: min(250px, 82vw); background: var(--deck); border-radius: 14px;
        border: 3px solid var(--edge); box-shadow: 0 8px 22px rgba(0,0,0,0.5), inset 0 0 0 2px var(--bezel);
        padding: 9px; margin-bottom: 8px; flex: 0 0 auto; }
      .mg-deck-cass { display: block; width: 100%; height: auto; }
      /* transport controls — play/pause, stop, next */
      .mg-transport { display: flex; gap: 8px; justify-content: center; margin-top: 7px; }
      .mg-transport button { width: 40px; height: 32px; border-radius: 7px; cursor: pointer;
        display: flex; align-items: center; justify-content: center; font-size: 14px; line-height: 1;
        color: #f4ecd2; background: rgba(20,18,8,0.82); border: 1px solid rgba(20,18,8,0.9); font-family: inherit; transition: transform 0.1s; }
      .mg-transport button:hover { background: rgba(20,18,8,0.95); }
      .mg-transport button:active { transform: scale(0.92); }
      .mg-transport button:disabled { opacity: 0.4; cursor: default; }
      .mg-transport #mg-play { width: 52px; }
      /* tape rack — real cassettes drawn to canvas */
      /* Same width as the deck and centred under it, so the cassette strip
         lines up with the Walkman. The tapes now overflow that width (5 of
         them), so start at the first tape and scroll right rather than centring
         the row and clipping both ends. */
      .mg-rack { display: flex; gap: 12px; overflow-x: auto; width: 100%; max-width: min(320px, 88vw); margin: 0 auto;
        padding: 2px 4px 4px; justify-content: flex-start; flex: 0 0 auto; -webkit-overflow-scrolling: touch; }
      .mg-tape { flex: 0 0 auto; width: 100px; cursor: pointer; text-align: center; transition: transform 0.12s; }
      .mg-tape:active { transform: scale(0.95); }
      .mg-tape canvas { display: block; width: 100px; height: 65px; border-radius: 6px;
        background: rgba(0,0,0,0.25); border: 2px solid rgba(0,0,0,0.5); }
      .mg-tape.sel canvas { border-color: var(--accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 55%, transparent); }
      .mg-tape .mg-artist { font-size: 11.5px; font-weight: 700; color: #e8e2d0; margin-top: 5px; }
      .mg-tape .mg-title { font-size: 10.5px; color: #9aa0aa; font-style: italic; }
      /* Drag a tape onto the deck to load it (an extra to clicking). The card
         lifts and dims while dragged; the deck lights up as a drop target. */
      .mg-tape[draggable="true"] { cursor: grab; }
      .mg-tape.dragging { opacity: 0.4; cursor: grabbing; }
      .mg-deck.drop-target { outline: 2px dashed var(--accent); outline-offset: 3px;
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 28%, transparent); }
      /* title mode has a full desktop window to breathe into — bigger logo,
         more air between the header, buttons, clock and stage. */
      #mobile-gate[data-mode="title"] { padding: 3vh 6vw; gap: 2px; justify-content: center; }
      #mobile-gate[data-mode="title"] h1 { font-size: 46px; }
      #mobile-gate[data-mode="title"] .mg-brand { margin: 6px 0; gap: 16px; }
      #mobile-gate[data-mode="title"] .mg-brandver { font-size: 11px; padding-bottom: 10px; margin-left: -10px; }
      #mobile-gate[data-mode="title"] .mg-brand-mark { width: 48px; height: 31px; border-radius: 5px; }
      #mobile-gate[data-mode="title"] .mg-brand-mark::before, #mobile-gate[data-mode="title"] .mg-brand-mark::after { top: 13px; width: 11px; height: 11px; }
      #mobile-gate[data-mode="title"] .mg-brand-mark::before { left: 9px; } #mobile-gate[data-mode="title"] .mg-brand-mark::after { right: 9px; }
      #mobile-gate[data-mode="title"] .mg-sub { font-size: 17px; margin-bottom: 6px; max-width: 24em; }
      #mobile-gate[data-mode="title"] .mg-actions { margin: 16px 0 6px; }
      #mobile-gate[data-mode="title"] .mg-btn { font-size: 16px; padding: 12px 30px; }
      #mobile-gate[data-mode="title"] .mg-skylink { margin-top: 16px; }
      .mg-hero, .mg-player { display: flex; flex-direction: column; align-items: center; min-width: 0; }
      .mg-player { width: 100%; max-width: 360px; }
      #mobile-gate[data-mode="title"] .mg-stage { max-height: 200px; }
      /* landscape laptop: two centred columns (hero text | Walkman) with the
         machines as a full-width band along the bottom — fills the width and
         fits the height instead of a tall single strip. */
      @media (min-width: 820px) {
        #mobile-gate[data-mode="title"] {
          display: grid; align-content: center; justify-content: center;
          grid-template-columns: minmax(300px, 460px) minmax(340px, 480px);
          grid-template-rows: 1fr auto; grid-template-areas: "hero player" "stage stage";
          column-gap: 5vw; row-gap: 1vh; padding: 2vh 5vw calc(2vh + 24px); }
        #mobile-gate[data-mode="title"] .mg-hero { grid-area: hero; align-items: flex-start; align-self: center; }
        #mobile-gate[data-mode="title"] .mg-hero .mg-sub, #mobile-gate[data-mode="title"] .mg-hero .mg-sub2 { text-align: left; }
        #mobile-gate[data-mode="title"] .mg-hero .mg-actions { justify-content: flex-start; }
        #mobile-gate[data-mode="title"] .mg-hero .mg-actions-aux::before { left: 0; transform: none; }
        #mobile-gate[data-mode="title"] h1 { font-size: 52px; }
        #mobile-gate[data-mode="title"] .mg-player { grid-area: player; align-self: center; justify-self: center; max-width: 480px; }
        /* The Walkman was loud enough to be the whole title screen. Bring it
           down so it reads as one element among several, not the headline. */
        #mobile-gate[data-mode="title"] .mg-deck { width: 230px; }
        #mobile-gate[data-mode="title"] .mg-transport button { width: 36px; height: 29px; }
        #mobile-gate[data-mode="title"] .mg-transport #mg-play { width: 46px; }
        /* Desktop title presents the tapes as a compact shelf of horizontal
           cards: a small cassette thumbnail beside the FULL artist and title,
           two cards to a row. The card is wide enough for the whole name on one
           line, so nothing is clipped and the rows sit tight and even. Four rows
           show at once; add more tapes and the shelf scrolls inside its own box
           rather than pushing the layout taller — it scales to any number. */
        #mobile-gate[data-mode="title"] .mg-rack {
          display: grid; grid-template-columns: repeat(2, 1fr);
          justify-content: center; align-content: start; gap: 8px 10px;
          width: 100%; max-width: 428px; max-height: 208px;
          overflow-x: hidden; overflow-y: auto; padding: 2px 4px; scrollbar-width: thin;
          scrollbar-color: color-mix(in srgb, var(--accent) 55%, transparent) transparent; }
        #mobile-gate[data-mode="title"] .mg-rack::-webkit-scrollbar { width: 7px; }
        #mobile-gate[data-mode="title"] .mg-rack::-webkit-scrollbar-thumb {
          background: color-mix(in srgb, var(--accent) 55%, transparent); border-radius: 4px; }
        #mobile-gate[data-mode="title"] .mg-tape {
          width: auto; display: flex; flex-direction: row; align-items: center; gap: 8px;
          text-align: left; padding: 5px 7px; border-radius: 8px;
          background: color-mix(in srgb, #000 20%, transparent); }
        #mobile-gate[data-mode="title"] .mg-tape.sel { background: color-mix(in srgb, var(--accent) 22%, transparent); }
        #mobile-gate[data-mode="title"] .mg-tape canvas { width: 46px; height: 30px; flex: 0 0 auto; border-width: 1.5px; }
        #mobile-gate[data-mode="title"] .mg-tape-meta { min-width: 0; flex: 1 1 auto; }
        #mobile-gate[data-mode="title"] .mg-tape .mg-artist { margin-top: 0; font-size: 11.5px; line-height: 1.2; }
        #mobile-gate[data-mode="title"] .mg-tape .mg-title { font-size: 10.5px; line-height: 1.2; }
        #mobile-gate[data-mode="title"] .mg-stage { grid-area: stage; width: 100%; max-height: min(260px, 30vh); align-self: end; }
        #mobile-gate[data-mode="title"] .mg-bot { width: auto; height: 152px; max-height: 100%; }
      }
    </style>
    ${bodyHtml}
  `;
  document.body.appendChild(el);

  // Load the backdrop GIF only if the connection can spare ~1.9 MB. Withhold it
  // on an explicit data-saver, a 2G-class link, or when the visitor asks for
  // reduced motion (a looping animation is exactly what that setting means to
  // avoid, and it saves the bytes too). In those cases the `src` is never set,
  // so nothing is requested and the low-opacity themed backdrop stands alone.
  // Where we cannot tell — Safari and Firefox have no Network Information API —
  // we load it, so no browser is quietly denied the look it had before.
  const bgv = el.querySelector('.mg-bgvideo');
  if (bgv) {
    const conn = navigator.connection || {};
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const slow = conn.saveData === true || /^(slow-2g|2g)$/.test(conn.effectiveType || '');
    if (!reduced && !slow) bgv.src = 'assets/media/videos/postAI-background.gif';
  }

  // ---- theme switch ----
  const applyTheme = (name) => {
    const t = THEMES[name] || THEMES.World;
    for (const [k, v] of Object.entries({ '--bg1': t.bg1, '--bg2': t.bg2, '--accent': t.accent, '--deck': t.deck, '--edge': t.edge, '--bezel': t.bezel })) {
      el.style.setProperty(k, v);
    }
    el.querySelectorAll('#mg-themes button').forEach((b) => b.classList.toggle('on', b.dataset.theme === name));
  };
  // Hamburger menu (gate only): toggle the theme popover; close on a pick or an
  // outside tap.
  const menuBtn = el.querySelector('#mg-menu-btn');
  const menuPop = el.querySelector('#mg-menu-pop');
  const closeMenu = () => { if (menuPop) { menuPop.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); } };
  if (menuBtn) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menuPop.hidden;
      menuPop.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    el.addEventListener('click', (e) => {
      if (!menuPop.hidden && !menuPop.contains(e.target) && e.target !== menuBtn) closeMenu();
    });
  }
  el.querySelectorAll('#mg-themes button').forEach((b) => b.addEventListener('click', () => { applyTheme(b.dataset.theme); closeMenu(); }));

  // ---- Help ----
  // The help panel is the game's, written once in index.html. Rather than set
  // the keys and commands out a second time here — a copy that would drift the
  // first time a key changed — the one panel is moved inside this element,
  // where the theme variables set above resolve, and `.gated` repaints it from
  // them. main.js is not loaded yet at the title, so the gate does the move
  // itself and puts the panel back before it tears itself down.
  const helpPanel = document.getElementById('help');
  const helpHome = () => {
    if (!helpPanel || !helpPanel.classList.contains('gated')) return;
    helpPanel.classList.remove('gated');
    helpPanel.style.display = 'none';
    document.body.appendChild(helpPanel);
  };
  const askHelp = (e) => {
    e.stopPropagation();
    closeMenu();
    if (!helpPanel) return;
    el.appendChild(helpPanel);
    helpPanel.classList.add('gated');
    wireHelpTabs(helpPanel);   // main.js is not loaded yet, so the tabs are ours to bind
    fillMachineGallery(helpPanel);   // ...and so are the eleven machine pictures
    helpPanel.style.display = 'flex';
    const panel = helpPanel.querySelector('.panel');
    if (panel) panel.scrollTop = 0;
  };
  for (const b of el.querySelectorAll('#mg-help-open, #mg-help-foot, #mg-menu-help')) {
    b.addEventListener('click', askHelp);
  }
  // SETTINGS FROM THE TITLE SCREEN. The panel is the same one; it just opens on
  // its Settings tab rather than on Start here. The mode is chosen before a run
  // begins, so it has to be reachable from the screen you begin a run on — it
  // was buried behind Help and a tab, which is not where anybody looks for it
  // (David, 2026-08-15: "break the panel out of help and show it in the title
  // page as an option").
  el.querySelector('#mg-settings-open')?.addEventListener('click', (e) => {
    askHelp(e);
    const panel = helpPanel;
    if (!panel) return;
    for (const t of panel.querySelectorAll('.helpTab')) {
      t.classList.toggle('active', t.dataset.panel === 'settings');
    }
    for (const pn of panel.querySelectorAll('.helpPanel')) {
      pn.classList.toggle('active', pn.dataset.panel === 'settings');
    }
    // THE CONTROLS ARE WIRED HERE TOO. main.js does not exist yet at the title,
    // so without this the panel is a picture of a settings panel: the sliders
    // move and nothing happens, not even their own labels. The mode falls back
    // to localStorage, since there is no player to hang it on until a run starts.
    // No `beforeExport`/`beforeApply`: there is no live run to write down and
    // no autosave to cut. Import is the one that matters here — it is how a run
    // reaches a new machine, which you do before starting anything.
    mountSettingsPanel(panel, { sfx });
  });
  // Backdrop, the ✕, and Escape all close it. These listeners outlive the gate
  // (the panel does), so each one no-ops unless the panel is actually gated.
  helpPanel?.addEventListener('click', (e) => { if (e.target === helpPanel) helpHome(); });
  helpPanel?.querySelector('#help-x')?.addEventListener('click', helpHome);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') helpHome(); });

  // ---- About: the game's panel, borrowed ----
  const aboutPanel = document.getElementById('about');
  const aboutHome = () => {
    if (!aboutPanel || !aboutPanel.classList.contains('gated')) return;
    aboutPanel.classList.remove('gated');
    aboutPanel.style.display = 'none';
    document.body.appendChild(aboutPanel);
  };
  const openAbout = (e) => {
    e?.stopPropagation();
    closeMenu();
    if (!aboutPanel) return;
    fillAboutTapes(aboutPanel);         // main.js is not loaded; the list is ours to build
    for (const v of aboutPanel.querySelectorAll('.verNum')) v.textContent = `v${VERSION}`;
    el.appendChild(aboutPanel);
    aboutPanel.classList.add('gated');
    aboutPanel.style.display = 'flex';
  };
  el.querySelector('#mg-about-open')?.addEventListener('click', openAbout);
  el.querySelector('#mg-menu-about')?.addEventListener('click', openAbout);
  aboutPanel?.addEventListener('click', (e) => { if (e.target === aboutPanel) aboutHome(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') aboutHome(); });

  // Tear down the screen and hand off to the game. newGame wipes the run save
  // (keeping the durable name/gender identity, exactly like in-game New Game);
  // otherwise the game restores whatever save exists. Title music always stops
  // here — the game starts its own soundtrack.
  const boot = (newGame) => {
    running = false;
    if (skyTimer) clearInterval(skyTimer);
    try { audio.pause(); } catch (e) { /* not yet playing */ }
    if (newGame) {
      try {
        localStorage.removeItem('postai-character');
        localStorage.removeItem('postai-lore');
        localStorage.removeItem('postai-seed');
      } catch (e) { /* storage blocked */ }
    }
    helpHome();      // or the shared panels are removed along with the gate
    aboutHome();
    el.remove();

    // The boot loader takes the screen the instant the title goes, so there is
    // never a black gap — and, more importantly, it is what catches a boot that
    // fails. `import('../main.js')` returns a promise nobody was awaiting, so a
    // throw during module evaluation (a Safari parse quirk, a bad asset) vanished
    // and left a black screen. Now it is caught and printed.
    const loader = showBootLoader(VERSION);
    loader.step('modules');

    const onProgress = (e) => { try { loader.step(e.detail && e.detail.step); } catch (_) { /* loader gone */ } };
    const cleanup = () => {
      window.removeEventListener('nostos:progress', onProgress);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
    const onReady = () => { cleanup(); loader.succeed(); };
    // A throw inside the first frame() (not the import) surfaces here rather than
    // as a black canvas. One-shot: once we have shown a failure, stop listening.
    const onError = (ev) => { cleanup(); loader.fail(ev.error || ev.message || 'script error'); };
    const onRejection = (ev) => { cleanup(); loader.fail(ev.reason || 'unhandled rejection'); };

    window.addEventListener('nostos:ready', onReady, { once: true });
    window.addEventListener('nostos:progress', onProgress);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    import('../main.js').catch((err) => { cleanup(); loader.fail(err); });
  };
  {
    // Start = new game (wipe save); Continue = resume the existing save. Wired
    // for BOTH gates: the phone used to offer one button that always resumed,
    // so a player on a phone could not start a fresh run or load a checkpoint
    // without finding a laptop, and could not tell that was why.
    // A DEEP LINK SKIPS THE DOOR. Somebody arriving on
    // ?cache=whatishistory.geocities.ws followed a link to one page of the cached
    // web, and asking them to click Start first is a door in front of a door.
    // Boot straight in, resuming rather than wiping, and main.js opens the page
    // once it is up. The title screen is still where they land when they close
    // the browser, which is the whole point of pointing links at it.
    try {
      const q = new URLSearchParams(location.search).get('cache');
      const path = /^\/c\/.+/.test(location.pathname);
      if (q || path) { boot(false); return; }
    } catch (e) { /* no link, ordinary title screen */ }
    el.querySelector('#mg-start')?.addEventListener('click', () => boot(true));
    const cont = el.querySelector('#mg-continue');
    if (cont) cont.addEventListener('click', () => boot(false));
    // Load a checkpoint: restore its seed + save into the run keys, then boot the
    // resume path (main.js's restore reads them, exactly like Continue).
    // One loader, whichever row in the list you press.
    const loadStage = (id) => {
      if (!id) return;
      try {
        const stages = JSON.parse(localStorage.getItem('postai-stages') || '{}');
        const st = stages[id];
        if (st) {
          if (st.seed != null) localStorage.setItem('postai-seed', st.seed);
          localStorage.setItem('postai-character', JSON.stringify(st.save));
        }
      } catch (e) { /* storage blocked */ }
      boot(false);
    };
    el.querySelectorAll('.mg-stage-btn').forEach((btn) => {
      btn.addEventListener('click', () => loadStage(btn.dataset.id));
    });

    // Escape hatch, where the gate still offers one: dismiss and boot anyway.
    el.querySelector('#mg-tryanyway')?.addEventListener('click', () => boot(false));
  }

  // ---- real cassettes in the rack (drawn once) ----
  const rack = el.querySelector('#mg-rack');
  TAPES.forEach((t, i) => {
    const card = document.createElement('div');
    card.className = 'mg-tape'; card.dataset.i = String(i);
    const cv = document.createElement('canvas'); cv.width = 240; cv.height = 156;
    const r = new Renderer(cv);
    const ctx = cv.getContext('2d');
    ctx.save(); ctx.translate(120, 78); ctx.scale(5.2, 5.2);
    r.drawCassette({ color: t.color || '#c9a44a', label: `${t.artist} — ${t.title}` }, 0);
    ctx.restore();
    card.appendChild(cv);
    // Artist + title wrapped together so the desktop shelf can set the thumbnail
    // beside them (flex row); on the phone the wrapper is a plain block and the
    // labels stack under the cassette exactly as before.
    const meta = document.createElement('div'); meta.className = 'mg-tape-meta';
    const a = document.createElement('div'); a.className = 'mg-artist'; a.textContent = t.artist;
    const ti = document.createElement('div'); ti.className = 'mg-title'; ti.textContent = t.title;
    meta.appendChild(a); meta.appendChild(ti);
    card.appendChild(meta);
    rack.appendChild(card);
  });

  // ---- the dancing machines (T2, W4, T1) ----
  const stage = el.querySelector('#mg-stage');
  const botDefs = [{ type: 't1' }, { type: 't2' }, { type: 'w4' }];
  const bots = botDefs.map((d, i) => {
    const cv = document.createElement('canvas'); cv.className = 'mg-bot'; cv.width = 108; cv.height = 150;
    stage.appendChild(cv);
    return { cv, ctx: cv.getContext('2d'), robot: mkRobot(d.type), phase: i * 1.3 };
  });

  // ---- the deck cassette (animated: reels spin while playing) ----
  const deckCv = el.querySelector('#mg-deck-cass');
  const deckCtx = deckCv.getContext('2d');
  const deckRenderer = new Renderer(deckCv);
  let deckColor = '#565656';

  const audio = new Audio();
  audio.preload = 'auto';
  audio.playsInline = true;      // iOS: play in place, don't hijack fullscreen
  audio.setAttribute('playsinline', '');
  audio.style.display = 'none';
  el.appendChild(audio);          // in the DOM so the auto-advance play() isn't treated as a fresh, gesture-required start on mobile
  let playlist = [];
  let idx = 0;
  let current = -1;
  let nowText = 'NostOS';   // scrolls across the tape's label window (marquee)
  const playBtn = el.querySelector('#mg-play');
  const stopBtn = el.querySelector('#mg-stop');
  const nextBtn = el.querySelector('#mg-next');

  // A readable track name from a filename: drop the extension and any leading
  // track-number prefix ("01-02- ", "02 ", etc.).
  const trackName = (path) => decodeURI(path).split('/').pop()
    .replace(/\.mp3$/i, '').replace(/^\d+[-.\s]*\d*[-.\s]*/, '').trim() || 'track';
  // Deck readout: while a tape is loaded, show artist + current track (with the
  // side it's on); otherwise the prompt.
  const updateNow = () => {
    if (current < 0) { nowText = 'NostOS'; return; }
    const t = TAPES[current];
    const side = idx < t.a.tracks.length ? 'A' : 'B';
    nowText = `${t.artist} — ${trackName(playlist[idx])} · ${side}`;
  };

  // Reflect play/pause on the button glyph; disable stop/next until a tape's in.
  const syncTransport = () => {
    playBtn.textContent = (current >= 0 && !audio.paused) ? '❚❚' : '▶';
    stopBtn.disabled = current < 0;
    nextBtn.disabled = current < 0;
  };
  // Advance to the next track on the loaded tape, wrapping A → B → A.
  const nextTrack = () => {
    if (!playlist.length) return;
    idx = (idx + 1) % playlist.length;
    audio.src = playlist[idx];
    audio.play().catch(() => {});
    updateNow();
  };
  audio.addEventListener('ended', nextTrack);
  audio.addEventListener('play', syncTransport);
  audio.addEventListener('pause', syncTransport);

  // The mechanical clunk of a cassette seating in the deck. Synthesised (a short
  // low body + a plastic tick) so it needs no asset and works on the pre-boot
  // gate, before the game's sfx exist. The AudioContext is made lazily on the
  // first load — a click or a drop is the user gesture that unlocks it.
  let sfxCtx = null;
  const deckClunk = () => {
    try {
      sfxCtx = sfxCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (sfxCtx.state === 'suspended') sfxCtx.resume();
      const t0 = sfxCtx.currentTime;
      const o = sfxCtx.createOscillator(), g = sfxCtx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(150, t0); o.frequency.exponentialRampToValueAtTime(64, t0 + 0.06);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);
      o.connect(g); g.connect(sfxCtx.destination); o.start(t0); o.stop(t0 + 0.11);
      const nb = sfxCtx.createBuffer(1, Math.floor(0.03 * sfxCtx.sampleRate), sfxCtx.sampleRate);
      const ch = nb.getChannelData(0);
      for (let k = 0; k < ch.length; k++) ch[k] = (Math.random() * 2 - 1) * (1 - k / ch.length);
      const ns = sfxCtx.createBufferSource(); ns.buffer = nb;
      const nf = sfxCtx.createBiquadFilter(); nf.type = 'highpass'; nf.frequency.value = 1700;
      const ng = sfxCtx.createGain();
      ng.gain.setValueAtTime(0.11, t0); ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.03);
      ns.connect(nf); nf.connect(ng); ng.connect(sfxCtx.destination); ns.start(t0); ns.stop(t0 + 0.04);
    } catch (_) { /* no audio: the tape still loads silently */ }
  };

  const loadTape = (i) => {
    const t = TAPES[i];
    deckClunk();   // it clicks into the deck, however it got there (tap or drag)
    playlist = [
      ...t.a.tracks.map((f) => `assets/audio/${t.dir}/A/${f}`),
      ...t.b.tracks.map((f) => `assets/audio/${t.dir}/B/${f}`),
    ].map(encodeURI);
    idx = 0; current = i; deckColor = t.color || '#c9a44a';
    audio.src = playlist[0];
    audio.play().catch(() => {});
    updateNow();
    syncTransport();
    el.querySelectorAll('.mg-tape').forEach((c, j) => c.classList.toggle('sel', j === i));
  };
  // Tapping a tape starts it on side A; tapping the tape that's already loaded
  // FLIPS the cassette to the other side (A ⇄ B), like turning a real tape over
  // — so a second tap gets you straight to the B-side rather than clicking
  // through every A-side track. The ▶▶| button still steps track by track.
  const flipSide = () => {
    const t = TAPES[current];
    const aLen = t.a.tracks.length;
    const onA = idx < aLen;
    idx = onA ? aLen : 0;                 // first B-side track, or back to first A-side track
    if (idx >= playlist.length) idx = 0;  // (empty B-side: stay on A)
    audio.src = playlist[idx];
    audio.play().catch(() => {});
    updateNow();
  };
  el.querySelectorAll('.mg-tape').forEach((card) => card.addEventListener('click', () => {
    const i = Number(card.dataset.i);
    if (i === current) flipSide(); else loadTape(i);
  }));
  // Transport buttons. stopPropagation so they don't also fire the deck's
  // click-to-pause below.
  playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (current < 0) { loadTape(0); return; }   // nothing loaded yet → start tape 1
    if (audio.paused) audio.play().catch(() => {}); else audio.pause();
  });
  stopBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (current < 0) return;
    audio.pause(); audio.currentTime = 0; syncTransport();
  });
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextTrack(); });
  // The big cassette itself still toggles play/pause.
  const deckEl = el.querySelector('.mg-deck');
  deckEl.addEventListener('click', () => {
    if (current < 0) return;
    if (audio.paused) audio.play().catch(() => {}); else audio.pause();
  });
  // Drag a tape onto the deck to load it — an extra way in alongside clicking.
  // HTML5 drag is a mouse affordance (touch keeps the tap handler above), so
  // this is a desktop delight and never blocks the phone. The dragged index
  // travels on the transfer, with a module var as the same-page fast path.
  let dragTape = -1;
  el.querySelectorAll('.mg-tape').forEach((card) => {
    card.setAttribute('draggable', 'true');
    card.addEventListener('dragstart', (e) => {
      dragTape = Number(card.dataset.i);
      card.classList.add('dragging');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'copy';
        try { e.dataTransfer.setData('text/plain', String(dragTape)); } catch (_) {}
        // Lift only the cassette itself, not the whole card with its label —
        // it reads as picking the little tape up out of the shelf.
        const thumb = card.querySelector('canvas');
        if (thumb && e.dataTransfer.setDragImage) {
          const r = thumb.getBoundingClientRect();
          e.dataTransfer.setDragImage(thumb, r.width / 2, r.height / 2);
        }
      }
    });
    card.addEventListener('dragend', () => { card.classList.remove('dragging'); dragTape = -1; deckEl.classList.remove('drop-target'); });
  });
  deckEl.addEventListener('dragover', (e) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; deckEl.classList.add('drop-target'); });
  deckEl.addEventListener('dragleave', (e) => { if (!deckEl.contains(e.relatedTarget)) deckEl.classList.remove('drop-target'); });
  deckEl.addEventListener('drop', (e) => {
    e.preventDefault();
    deckEl.classList.remove('drop-target');
    let i = dragTape;
    if (i < 0 && e.dataTransfer) { const d = e.dataTransfer.getData('text/plain'); if (d !== '') i = Number(d); }
    if (Number.isInteger(i) && i >= 0 && i < TAPES.length) loadTape(i);
  });
  syncTransport();   // initial: play shows ▶, stop/next disabled

  // ---- animation loop: spinning reels + dancing machines ----
  // Two reel angles: the right reel is the motor-driven take-up spool and turns
  // the instant play starts; the left is the passive supply spool and only
  // begins a fraction of a second later, so a starting tape shows the right
  // reel leading — the little tell a real Walkman gives.
  let spinR = 0, spinL = 0, playElapsed = 0, wasPlaying = false;
  let lastT = performance.now();
  const frame = (t) => {
    if (!running) return;   // stop drawing once we've booted the game
    const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
    const playing = current >= 0 && !audio.paused;
    // deck cassette — scaled up so the tape nearly fills the deck
    if (playing) {
      if (!wasPlaying) playElapsed = 0;          // (re)start: right leads, left waits
      playElapsed += dt;
      spinR += dt * 1.1;                          // motor reel: turns immediately
      if (playElapsed > 0.22) spinL += dt * 1.1;  // passive reel: catches up a beat later
    }
    wasPlaying = playing;
    const S = 11.2, dcx = deckCv.width / 2, dcy = deckCv.height / 2;
    deckCtx.clearRect(0, 0, deckCv.width, deckCv.height);
    deckCtx.save(); deckCtx.translate(dcx, dcy); deckCtx.scale(S, S);
    deckRenderer.drawCassette({ color: deckColor }, spinR, spinL);
    deckCtx.restore();
    // now-playing marquee across the tape's own coloured label strip
    // (drawCassette draws that strip at local x -9..9, y -5.5..-2.5).
    {
      const lx = dcx - 9 * S, ly = dcy - 5.5 * S, lw = 18 * S, lh = 3 * S;
      deckCtx.save();
      deckCtx.beginPath(); deckCtx.rect(lx, ly, lw, lh); deckCtx.clip();
      deckCtx.font = `600 ${Math.round(lh * 0.4)}px ui-monospace, Menlo, monospace`;
      deckCtx.textBaseline = 'middle';
      deckCtx.fillStyle = 'rgba(18,15,8,0.92)'; // dark ink printed on the coloured label
      const midY = ly + lh / 2 + 0.5;
      if (playing) {
        // seamless loop: a second copy one period ahead, a full-width gap between.
        const tw = deckCtx.measureText(nowText).width;
        const period = tw + lw, off = (t / 34) % period;
        deckCtx.textAlign = 'left';
        deckCtx.fillText(nowText, lx + lw - off, midY);
        deckCtx.fillText(nowText, lx + lw - off + period, midY);
      } else {
        deckCtx.textAlign = 'center';
        deckCtx.fillText(nowText, lx + lw / 2, midY);
      }
      deckCtx.restore();
    }
    // elapsed / total time, tiny light-grey Courier under the reels
    if (current >= 0) {
      const fmt = (s) => { if (!isFinite(s) || s < 0) return '0:00'; const m = Math.floor(s / 60); return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`; };
      deckCtx.font = `${Math.round(S * 0.9)}px "Courier New", ui-monospace, monospace`;
      deckCtx.textAlign = 'center';
      deckCtx.textBaseline = 'alphabetic';
      deckCtx.fillStyle = 'rgba(208,214,198,0.6)';
      deckCtx.fillText(`${fmt(audio.currentTime)} / ${fmt(audio.duration)}`, dcx, dcy + 6.15 * S);
    }
    // machines — bob up and down to the beat (drawRobot's own shadow is
    // suppressed via r.noShadow; we draw a separate shadow that stays planted
    // on the floor and just shrinks a touch as the machine springs up).
    for (const b of bots) {
      b.robot.walkPhase += dt * (playing ? 12 : 3);
      b.robot.animT += dt;
      b.robot.noShadow = true;
      const beat = t / 1000 * 6 + b.phase;
      const bob = playing ? Math.abs(Math.sin(beat)) * 10 : Math.abs(Math.sin(t / 1000 * 1.5 + b.phase)) * 2;
      const tilt = playing ? Math.sin(beat) * 0.06 : 0;
      const cx = b.cv.width / 2, floorY = b.cv.height - 16;
      b.ctx.clearRect(0, 0, b.cv.width, b.cv.height);
      // planted floor shadow
      const sw = Math.max(9, 17 - bob * 0.5);
      b.ctx.fillStyle = 'rgba(0,0,0,0.32)';
      b.ctx.beginPath(); b.ctx.ellipse(cx, floorY, sw, sw * 0.34, 0, 0, Math.PI * 2); b.ctx.fill();
      // bobbing body
      b.ctx.save();
      b.ctx.translate(cx, floorY - bob);
      b.ctx.rotate(tilt);
      b.ctx.scale(1.6, 1.6);
      drawRobot(b.ctx, b.robot, worldToScreen);
      b.ctx.restore();
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
