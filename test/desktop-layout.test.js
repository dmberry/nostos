// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// Two desktop bugs that hid features rather than breaking them, which is why
// neither showed up as an error.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DOCK_APPS, dockTiles, newWorkspace, openWindow, newWindow,
  openWWW, openGrove, openPrefs, openMail, MENU_EDGE, MENU_W,
} from '../src/game/workspace.js';

const ws = () => newWorkspace({ 'calypso.ml': 'x' }, {});

// The dock layout, as the renderer computes it. Kept in step with ui.js by the
// numbers below being the same numbers.
function dockLayout(tiles, H) {
  const footN = tiles.filter((t) => t.fixed === 'foot').length;
  const room = H - 8 - footN * 62;
  const pitch = Math.min(62, room / Math.max(1, tiles.length - footN));
  const TILE = Math.max(30, Math.min(56, Math.round(pitch - 2)));
  const ys = tiles.map((t, i) => (t.fixed === 'foot' ? H - 4 - TILE : Math.round(4 + i * pitch)));
  return { ys, TILE };
}

test('EVERY APP IN THE DOCK IS ON THE SCREEN, at every height', () => {
  // The dock used to `return` on a tile that did not fit, which silently
  // dropped the tail of the list. Adding two apps pushed both off the bottom,
  // so Grove read as unwired when it was only invisible.
  const tiles = dockTiles(ws());
  for (const H of [560, 600, 720, 900, 1080, 1440]) {
    const { ys, TILE } = dockLayout(tiles, H);
    ys.forEach((y, i) => {
      assert.ok(y >= 0, `${tiles[i].id} sits above the screen at h=${H}`);
      assert.ok(y + TILE <= H, `${tiles[i].id} falls off the bottom at h=${H}`);
    });
    assert.equal(ys.length, tiles.length, 'no tile was dropped');
  }
});

test('the recycler stays pinned at the foot, as a dock does', () => {
  const tiles = dockTiles(ws());
  const i = tiles.findIndex((t) => t.id === 'recycler');
  assert.ok(i >= 0);
  assert.equal(tiles[i].fixed, 'foot');
  for (const H of [600, 900]) {
    const { ys, TILE } = dockLayout(tiles, H);
    assert.equal(ys[i], H - 4 - TILE, `not pinned at h=${H}`);
    assert.ok(ys[i] >= Math.max(...ys.filter((_, j) => j !== i)), 'and it is the lowest tile');
  }
});

test('the new apps are in the dock at all', () => {
  const ids = DOCK_APPS.map((d) => d.id);
  assert.ok(ids.includes('grove'), 'Grove has no tile to click');
  assert.ok(ids.includes('www'), 'WorldWideWeb has no tile to click');
});

test('NOTHING OPENS UNDER THE MENU', () => {
  // The menu is a vertical strip down the left. Preferences and Mail were
  // placed at x=150 and x=120 against a MENU_EDGE of 176, so both arrived
  // beneath it and had to be dragged out before they could be read.
  const w = ws();
  const wins = [
    openWWW(w, 'Home', '<h1>x</h1>', 'a'),
    openGrove(w),
    openPrefs(w),
    openMail(w),
    openWindow(w, newWindow('edit', 'x', 10, 10, 200, 120)),
  ];
  for (const win of wins) {
    assert.ok(win.x >= MENU_EDGE, `${win.kind} opened at x=${win.x}, under the menu (edge ${MENU_EDGE})`);
  }
  assert.ok(MENU_EDGE > MENU_W, 'the edge clears the strip itself');
});

test('a cascade of documents still clears the menu', () => {
  // WorldWideWeb opens a window per link, offset each time. The offset must
  // never walk a window back under the menu.
  const w = ws();
  for (let i = 0; i < 12; i++) {
    const win = openWWW(w, `doc ${i}`, '<p>x</p>', `a${i}`);
    assert.ok(win.x >= MENU_EDGE, `cascade step ${i} landed at x=${win.x}`);
  }
});
