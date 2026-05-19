// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE SETTINGS PANEL, WIRED FROM ONE PLACE.
//
// The panel's markup lives in index.html and is shown by two different screens:
// the title screen (mobile-gate.js) and the running game (main.js). Its controls
// were wired ONLY by main.js, which does not exist until a run starts — so the
// Settings panel on the title screen was decorative. The sliders moved and
// nothing happened, not even their own labels, because the handler that updates
// the label is the same handler that sets the volume (David, 2026-08-15: "check
// that volumes etc. work in their new location on the title page").
//
// So the wiring moved here, and both screens mount the same thing. `sfx` already
// persists its own levels to localStorage, so audio set at the title survives
// into the run without anything being handed across.
//
// THE MODE IS THE SAME STORY. It is chosen before a run begins, which means it
// has to be settable when there is no player object to put it on. It goes to
// localStorage under its own key; main.js reads that at boot for a NEW run, and
// a run in progress carries its own mode in the save instead.

import { MODES, DEFAULT_MODE, modeOf, isMode } from './modes.js';
import {
  buildSaveFile, describeSaveFile, validateSaveFile, applySaveFile, saveFileName,
} from './savefile.js';
import { VERSION } from '../version.js';

export const MODE_KEY = 'postai-mode';

/** The mode a new run should start in: whatever was last chosen, or Medium. */
export function storedMode() {
  try {
    const v = localStorage.getItem(MODE_KEY);
    return isMode(v) ? v : DEFAULT_MODE;
  } catch { return DEFAULT_MODE; }
}

/** Remember the chosen mode for the next run. Storage being blocked is not fatal. */
export function storeMode(key) {
  try { localStorage.setItem(MODE_KEY, isMode(key) ? key : DEFAULT_MODE); } catch { /* private mode */ }
}

/**
 * Paint a slider's filled portion.
 *
 * `--v` is the variable index.html's stylesheet reads, and the fill AND the
 * drawn thumb both read it, so they cannot disagree. It is the plain
 * percentage: the visible thumb is a gradient in the input's own background,
 * not the browser's, so it is free to reach the ends of the track instead of
 * stopping half its width short of them.
 */
export function setFill(slider) {
  if (!slider) return;
  slider.style.setProperty('--v', `${slider.value}%`);
}

const lsRead = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsWrite = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } };
const lsRemove = (k) => { try { localStorage.removeItem(k); } catch { /* storage blocked */ } };

/**
 * SAVE TO DISC, on both screens.
 *
 * These two buttons were wired in main.js with everything else in the panel, so
 * at the title screen they did nothing at all (David, 2026-08-15). IMPORT is the
 * one you most want there: bringing a run to a new machine is a thing you do
 * BEFORE starting anything, and the title screen is where you are standing when
 * you want it.
 *
 * Nothing here needs the game. The file is built from localStorage, which is
 * where the run lives either way; the only game-shaped parts are handed in:
 * `beforeExport` (write the live run down first, so the file is the run as it
 * is now rather than as it was at the last autosave) and `beforeApply` (cut the
 * autosave hooks, so nothing overwrites the imported blob before the reload).
 * At the title there is no live run and no autosave, so both are absent and
 * correctly do nothing.
 */
function mountSaveToDisc(root, { beforeExport, beforeApply } = {}) {
  const exportBtn = root.querySelector('#saveExportBtn');
  const importBtn = root.querySelector('#saveImportBtn');
  const fileInput = root.querySelector('#saveImportFile');
  const msgEl = root.querySelector('#saveDiscMsg');
  if (msgEl && msgEl._nostosHelp === undefined) msgEl._nostosHelp = msgEl.textContent;
  const msg = (text, kind) => {
    if (!msgEl) return;
    msgEl.textContent = text || msgEl._nostosHelp;
    msgEl.className = text ? (kind || '') : '';
  };

  if (exportBtn && !exportBtn._nostosBound) {
    exportBtn._nostosBound = true;
    exportBtn.addEventListener('click', () => {
      if (beforeExport) { try { beforeExport(); } catch { /* a failed persist still exports what is stored */ } }
      const doc = buildSaveFile(lsRead, { version: VERSION, at: new Date().toISOString() });
      // NOTHING TO EXPORT is a real answer, not an error. At the title with no
      // save, a file full of nulls would be worse than being told.
      if (!doc || !describeSaveFile(doc) || !lsRead('postai-character')) {
        msg('There is no run in this browser to export yet.', 'bad');
        return;
      }
      const name = saveFileName(doc, new Date().toISOString().slice(0, 10));
      const url = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 1)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      msg(`Exported ${name} — ${describeSaveFile(doc)}`, 'ok');
    });
  }

  if (importBtn && fileInput && !importBtn._nostosBound) {
    importBtn._nostosBound = true;
    importBtn.addEventListener('click', () => { fileInput.value = ''; fileInput.click(); });
    fileInput.addEventListener('change', async () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      let doc = null;
      try { doc = JSON.parse(await f.text()); }
      catch { msg('That file is not readable JSON.', 'bad'); return; }
      const v = validateSaveFile(doc);
      if (!v.ok) { msg(`Not imported: ${v.error}.`, 'bad'); return; }
      // The confirm is the whole safety story: this overwrites the run in this
      // browser, and there is no undo once it is written.
      const ok = window.confirm(
        `Import ${describeSaveFile(doc)}?\n\n`
        + 'This REPLACES the run in this browser and reloads the page. '
        + 'Anything not already exported is lost.');
      if (!ok) { msg('Import cancelled — nothing was written.'); return; }
      if (beforeApply) beforeApply();
      const r = applySaveFile(doc, lsWrite, lsRemove);
      if (!r.ok) { msg(`Not imported: ${r.error}.`, 'bad'); return; }
      msg('Imported. Reloading...', 'ok');
      location.reload();
    });
  }
  return msg;
}

/**
 * Wire the settings panel inside `root`.
 *
 * `getMode`/`setMode` are supplied by the caller because the two screens store
 * the mode in different places: the title screen has only localStorage, and a
 * running game has a player whose save carries it. Everything else is the same
 * on both, which is the point of the module.
 *
 * Safe to call more than once on the same root: it tracks what it has wired, so
 * re-opening the panel re-syncs the displayed values without stacking listeners.
 */
export function mountSettingsPanel(root, { sfx, getMode, setMode, beforeExport, beforeApply } = {}) {
  if (!root) return null;
  const $ = (id) => root.querySelector(`#${id}`);
  const volume = $('volumeSlider'), volumeLabel = $('volumeLabel');
  const fx = $('fxSlider'), fxLabel = $('fxLabel');
  const music = $('musicSlider'), musicLabel = $('musicLabel');

  const bind = (slider, label, set) => {
    if (!slider || slider._nostosBound) return;
    slider._nostosBound = true;
    slider.addEventListener('input', () => {
      if (set) set(Number(slider.value) / 100);
      if (label) label.textContent = `${slider.value}%`;
      setFill(slider);
    });
  };
  bind(volume, volumeLabel, (v) => sfx && sfx.setVolume && sfx.setVolume(v));
  bind(fx, fxLabel, (v) => sfx && sfx.setFxVolume && sfx.setFxVolume(v));
  bind(music, musicLabel, (v) => sfx && sfx.setMusicVolume && sfx.setMusicVolume(v));

  for (const radio of root.querySelectorAll('input[name="musicMode"]')) {
    if (radio._nostosBound) continue;
    radio._nostosBound = true;
    radio.addEventListener('change', () => {
      if (radio.checked && sfx && sfx.setMusicMode) sfx.setMusicMode(radio.value);
    });
  }

  // ---- the mode picker, built from the table -------------------------------
  const choice = $('modeChoice'), blurb = $('modeBlurb');
  const readMode = () => (getMode ? getMode() : storedMode());
  const paint = () => {
    if (choice) {
      for (const b of choice.querySelectorAll('button')) {
        b.setAttribute('aria-pressed', String(b.dataset.mode === readMode()));
      }
    }
    if (blurb) {
      const m = modeOf(readMode());
      blurb.innerHTML = `<b>${m.name}.</b> ${m.blurb} ${m.detail}`;
    }
  };
  if (choice && !choice._nostosBound) {
    choice._nostosBound = true;
    choice.innerHTML = MODES
      .map((m) => `<button type="button" data-mode="${m.key}" aria-pressed="false">${m.name}</button>`)
      .join('');
    choice.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-mode]');
      if (!b) return;
      storeMode(b.dataset.mode);
      if (setMode) setMode(b.dataset.mode);
      paint();
      if (sfx && sfx.play) sfx.play('blip');
    });
  }

  const discMsg = mountSaveToDisc(root, { beforeExport, beforeApply });

  /** Show the current values. Called on every open, since the panel may be stale. */
  const sync = () => {
    const show = (slider, label, v) => {
      if (!slider) return;
      const pct = Math.round((v ?? 1) * 100);
      slider.value = pct;
      if (label) label.textContent = `${pct}%`;
      setFill(slider);
    };
    show(volume, volumeLabel, sfx ? sfx.volume : 1);
    show(fx, fxLabel, sfx ? sfx.fxVolume : 1);
    show(music, musicLabel, sfx ? sfx.musicVolume : 0.7);
    const cur = root.querySelector(`input[name="musicMode"][value="${sfx ? sfx.musicMode : 'synth'}"]`);
    if (cur) cur.checked = true;
    paint();
    discMsg(null);   // a message from a previous visit is stale by now
  };
  sync();
  return { sync, paint };
}
