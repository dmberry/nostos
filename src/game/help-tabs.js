// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE HELP PANEL'S TABS, wired from one place.
//
// Two things open that panel and they run at different times: the title screen,
// which is up before main.js has been fetched, and the game, which binds the
// rest of the panel's behaviour. The wiring used to live in main.js alone, so
// every tab in the panel opened from the title was dead — it looked like a
// button and did nothing.
//
// Called twice (gate first, then main) it binds once: the flag is on the
// element, so a second call over the same DOM is a no-op.

export function wireHelpTabs(helpEl, onPanel) {
  if (!helpEl) return;
  if (onPanel) helpEl._helpOnPanel = onPanel;   // main.js adds what it alone can do
  if (helpEl._helpTabsWired) return;
  helpEl._helpTabsWired = true;
  // Several panels can share a data-panel name (Survival is split around the
  // machine section), so all matching panels toggle together.
  for (const btn of helpEl.querySelectorAll('.helpTab')) {
    btn.addEventListener('click', () => {
      const name = btn.dataset.panel;
      for (const b of helpEl.querySelectorAll('.helpTab')) b.classList.toggle('active', b === btn);
      for (const p of helpEl.querySelectorAll('.helpPanel')) p.classList.toggle('active', p.dataset.panel === name);
      const panel = helpEl.querySelector('.panel');
      if (panel) panel.scrollTop = 0;
      if (helpEl._helpOnPanel) helpEl._helpOnPanel(name);
    });
  }
}
