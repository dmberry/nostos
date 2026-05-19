// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// K2 (docs/PLAN.md) — the cabinet session.
//
// The streak is the part to get right. Five RESIGNATIONS in a row is one of
// K4's three doors, and a played loss has to reset it, because the difference
// between giving up and being beaten is the whole idea.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  newCabinet, cabinetStart, cabinetPick, cabinetResign, cabinetThink, cabinetTick,
  cabinetSave, readyToThink, pickable, destinations, resultCard,
  priorGames, scoreboardTotals, HER, YOU, THINK_MIN,
} from '../src/game/draughts-cabinet.js';
import { legalMoves, material } from '../src/game/draughts.js';

// Drive a cabinet to the point where it is the player's move.
function toPlayersTurn(c) {
  cabinetStart(c);
  cabinetTick(c, THINK_MIN);
  cabinetThink(c);
  return c;
}

// ---- the scoreboard ---------------------------------------------------------

test('the scoreboard is not empty when you arrive', () => {
  const c = newCabinet();
  assert.ok(c.totals.played > 400, 'seven years is a lot of games');
  assert.equal(c.totals.guestWins, 0, 'no guest has ever won one');
});

test('most of her games were against herself, which is the tell', () => {
  const t = scoreboardTotals(priorGames());
  assert.ok(t.guest > 0, 'she did play the guest sometimes');
  assert.ok(t.guest < t.played / 2, 'but mostly there was nobody else');
  assert.ok(t.draws > t.wins, 'and a machine playing itself draws');
});

test('the history is deterministic: the same run shows the same seven years', () => {
  assert.deepEqual(priorGames(7, 20), priorGames(7, 20));
});

// ---- a turn -----------------------------------------------------------------

test('she is Black and she opens: a new game starts on her', () => {
  const c = newCabinet();
  cabinetStart(c);
  assert.equal(c.phase, 'thinking');
  assert.equal(c.game.turn, HER);
});

test('thinking is a phase, not a pause, and the hub gets a frame first', () => {
  const c = newCabinet();
  cabinetStart(c);
  assert.equal(readyToThink(c), false, 'not until the thinking frame has been up');
  cabinetTick(c, THINK_MIN);
  assert.equal(readyToThink(c), true);
  cabinetThink(c);
  assert.equal(c.phase, 'playing');
  assert.equal(c.game.turn, YOU);
});

test('you pick a piece up, and put it down where it may go', () => {
  const c = toPlayersTurn(newCabinet());
  const from = pickable(c)[0];
  assert.equal(cabinetPick(c, from), 'picked');
  assert.equal(c.sel, from);
  const to = destinations(c)[0];
  assert.ok(to != null);
  const before = c.game.plies;
  const what = cabinetPick(c, to);
  assert.ok(what === 'moved' || what === 'took');
  assert.equal(c.game.plies, before + 1);
  assert.equal(c.sel, null);
});

test('picking the same square again puts it back down', () => {
  const c = toPlayersTurn(newCabinet());
  const from = pickable(c)[0];
  cabinetPick(c, from);
  assert.equal(cabinetPick(c, from), 'dropped');
  assert.equal(c.sel, null);
});

test('a piece with nowhere to go says so rather than doing nothing', () => {
  const c = toPlayersTurn(newCabinet());
  // The back rank cannot move on the first turn: everything is in front of it.
  const stuck = [56, 58, 60, 62].find((sq) => !pickable(c).includes(sq)
    && c.game.board[sq]);
  assert.ok(stuck != null, 'the back rank should be blocked at the start');
  assert.equal(cabinetPick(c, stuck), 'refused');
  assert.ok(c.message, 'and it tells you why');
});

test('the cabinet ignores you when it is not your turn', () => {
  const c = newCabinet();
  cabinetStart(c);                       // her move pending
  assert.equal(cabinetPick(c, 40), 'ignored');
});

// ---- resigning --------------------------------------------------------------

test('resign is available and it ends the game', () => {
  const c = toPlayersTurn(newCabinet());
  assert.equal(cabinetResign(c), true);
  assert.equal(c.phase, 'over');
  assert.equal(c.result, 'resigned');
  assert.equal(resultCard(c).head, 'RESIGNED');
});

test('resignations stack into a streak', () => {
  const c = newCabinet();
  for (let i = 0; i < 3; i++) { toPlayersTurn(c); cabinetResign(c); }
  assert.equal(c.streak, 3);
  assert.equal(c.played, 3);
});

test('a PLAYED loss resets the streak: losing is not conceding', () => {
  const c = newCabinet();
  toPlayersTurn(c); cabinetResign(c);
  toPlayersTurn(c); cabinetResign(c);
  assert.equal(c.streak, 2);
  // Now play a game out to a real finish.
  toPlayersTurn(c);
  for (let i = 0; i < 400 && c.phase !== 'over'; i++) {
    if (c.phase === 'thinking') { cabinetTick(c, THINK_MIN); cabinetThink(c); continue; }
    const from = pickable(c)[0];
    if (from == null) break;
    cabinetPick(c, from);
    const to = destinations(c)[0];
    if (to == null) { c.sel = null; break; }
    cabinetPick(c, to);
  }
  assert.equal(c.phase, 'over', 'the game should have finished');
  assert.notEqual(c.result, 'resigned');
  assert.equal(c.streak, 0, 'being beaten is not the same as giving up');
});

test('resigning is counted as a game played', () => {
  const c = toPlayersTurn(newCabinet());
  const before = c.played;
  cabinetResign(c);
  assert.equal(c.played, before + 1);
  assert.equal(c.log[c.log.length - 1].result, 'CALYPSO');
});

// ---- persistence ------------------------------------------------------------

test('the run\'s record survives a save', () => {
  const c = newCabinet();
  for (let i = 0; i < 2; i++) { toPlayersTurn(c); cabinetResign(c); }
  const blob = cabinetSave(c);
  const back = newCabinet(blob);
  assert.equal(back.streak, 2);
  assert.equal(back.played, 2);
  assert.equal(back.log.length, 2);
});

test('the log keeps a tail, not a transcript', () => {
  const c = newCabinet();
  for (let i = 0; i < 20; i++) { toPlayersTurn(c); cabinetResign(c); }
  assert.ok(c.log.length <= 12, 'a scoreboard shows the last few');
  assert.equal(c.streak, 20);
});

// ---- she plays properly -----------------------------------------------------

test('she takes what is offered, in a real session', () => {
  // Play the shortest legal opening and let her answer it. She is at depth 8 by
  // default, so this also exercises the real cost the hub has to hide.
  const c = toPlayersTurn(newCabinet());
  const before = material(c.game);
  const from = pickable(c)[0];
  cabinetPick(c, from);
  cabinetPick(c, destinations(c)[0]);
  cabinetTick(c, THINK_MIN);
  cabinetThink(c);
  const after = material(c.game);
  assert.ok(after.b === before.b, 'she should not have lost a piece to a quiet opening');
  assert.ok(c.phase === 'playing' || c.phase === 'over');
});

test('her parameters are hers to change, which is what K3 will do', () => {
  const c = newCabinet();
  assert.equal(c.params.depth, 8);
  c.params = { ...c.params, depth: 1, purpose: 'lose' };
  toPlayersTurn(c);
  assert.equal(c.game.turn, YOU, 'a shallow, losing search still makes a legal move');
});

// ---- K3: checkers.ml --------------------------------------------------------
// The file is honest (D6/D7): the JS engine plays, and these are the numbers it
// plays with. So the tests that matter are that a hacked file really does
// change her, and that a player cannot hang the terminal with one.

import {
  checkersFile, parseCheckersFile, checkersModified, CHECKERS_LIMITS,
} from '../src/game/draughts-cabinet.js';
import { DEFAULT_PARAMS as ENGINE_PARAMS, chooseMove, newGame, applyMove, winner, material as mat } from '../src/game/draughts.js';

test('the file she serves round-trips to the parameters she ships with', () => {
  const { params, changed } = parseCheckersFile(checkersFile());
  assert.equal(changed.length, 0, 'her own file changes nothing');
  assert.equal(params.depth, ENGINE_PARAMS.depth);
  assert.equal(params.purpose, ENGINE_PARAMS.purpose);
  assert.deepEqual(params.weights, ENGINE_PARAMS.weights);
  assert.equal(checkersModified(checkersFile()), false);
});

test('dropping the depth really does make her worse', () => {
  const f = checkersFile().replace('val depth = 8', 'val depth = 1');
  const { params, changed } = parseCheckersFile(f);
  assert.equal(params.depth, 1);
  assert.deepEqual(changed, ['depth']);
  // And the shallow parameters actually lose to the deep ones over a game.
  let g = newGame();
  for (let i = 0; i < 50 && !winner(g); i++) {
    const m = chooseMove(g, g.turn === 'b' ? params : ENGINE_PARAMS);
    if (!m) break;
    g = applyMove(g, m);
  }
  const { b, w } = mat(g);
  assert.ok(b < w, `a depth-1 CALYPSO should be losing: ${b} to ${w}`);
});

test("flipping purpose makes her throw the game", () => {
  const { params, changed } = parseCheckersFile(checkersFile().replace('val purpose = win', 'val purpose = lose'));
  assert.equal(params.purpose, 'lose');
  assert.deepEqual(changed, ['purpose']);
});

test('depth is clamped hard, so a posted file cannot read as a crash', () => {
  const { params, notes } = parseCheckersFile(checkersFile().replace('val depth = 8', 'val depth = 40'));
  assert.equal(params.depth, CHECKERS_LIMITS.depth.max);
  assert.ok(notes.some((n) => /clamped/.test(n)), 'and it says it clamped');
  assert.ok(CHECKERS_LIMITS.depth.max <= 9, 'K1 measured depth 10 at four seconds a move');
});

test('a negative weight is legal: it is how you call a piece a liability', () => {
  const { params } = parseCheckersFile(checkersFile().replace('val man      = 100', 'val man = ~100'));
  assert.equal(params.weights.man, CHECKERS_LIMITS.man.min, 'clamped, but read as negative first');
});

test('a file it understands nothing in changes nothing, and says so', () => {
  const r = parseCheckersFile('(* hello *)\nlet x = 3 in x');
  assert.deepEqual(r.changed, []);
  assert.deepEqual(r.params.weights, ENGINE_PARAMS.weights);
  assert.equal(checkersModified('nothing here'), false);
});

test('an unknown val is ignored and reported rather than fatal', () => {
  const r = parseCheckersFile(`${checkersFile()}\nval cheat = 999`);
  assert.ok(r.ignored.includes('cheat'));
  assert.equal(r.changed.length, 0);
});

test('a bad purpose is refused rather than silently accepted', () => {
  const r = parseCheckersFile(checkersFile().replace('val purpose = win', 'val purpose = maybe'));
  assert.equal(r.params.purpose, 'win', 'she keeps the one she had');
  assert.ok(r.ignored.includes('purpose'));
  assert.ok(r.notes.some((n) => /win or lose/.test(n)));
});

test('comments cannot smuggle a value past the parser', () => {
  const r = parseCheckersFile('(* val depth = 1 *)\nval depth = 6');
  assert.equal(r.params.depth, 6, 'the commented line is not a setting');
});

// ---- K4: she plays herself --------------------------------------------------
// Three doors, one scene. The scene's ending is not scripted: draughts played
// well is a draw, and she finds that by playing it, which is why this works.

import {
  cabinetAuto, cabinetSelfTick, concedeDoorOpen, shownGame,
  CONCEDE_DOOR, SELFPLAY_GAMES, SELFPLAY_DEPTH, HER_LINE,
} from '../src/game/draughts-cabinet.js';

function runSelfPlay(c) {
  let n = 0, ev = null;
  while (ev !== 'done' && n < 20000) { ev = cabinetSelfTick(c, 1); n++; }
  return n;
}

test('five concessions in a row open the door, and she takes the other chair', () => {
  const c = newCabinet();
  for (let i = 0; i < CONCEDE_DOOR - 1; i++) { toPlayersTurn(c); cabinetResign(c); }
  assert.equal(concedeDoorOpen(c), false, `${CONCEDE_DOOR - 1} is not enough`);
  assert.equal(c.phase, 'over');
  toPlayersTurn(c); cabinetResign(c);
  assert.equal(c.phase, 'selfplay', 'the fifth starts it');
  assert.equal(c.by, 'concede');
});

test('a played loss in the middle of a streak closes the door again', () => {
  const c = newCabinet();
  for (let i = 0; i < CONCEDE_DOOR - 1; i++) { toPlayersTurn(c); cabinetResign(c); }
  c.streak = 0;                      // as a real finished game would leave it
  toPlayersTurn(c); cabinetResign(c);
  assert.equal(c.phase, 'over', 'one concession after a loss is only one');
  assert.equal(c.streak, 1);
});

test('`auto` reaches the same scene without conceding anything', () => {
  const c = toPlayersTurn(newCabinet());
  assert.equal(cabinetAuto(c, 'auto'), true);
  assert.equal(c.phase, 'selfplay');
  assert.equal(c.by, 'auto');
  assert.equal(c.streak, 0, 'you gave up nothing to get here');
});

test('every self-played game is drawn, which is the whole point', () => {
  const c = toPlayersTurn(newCabinet());
  cabinetAuto(c, 'auto');
  runSelfPlay(c);
  assert.equal(c.self.results.length, SELFPLAY_GAMES);
  for (const r of c.self.results) {
    assert.equal(r, 'draw', 'draughts played well is a draw, and she finds that out');
  }
});

test('the scene ends with futile set, whichever door was used', () => {
  for (const door of ['auto', 'concede']) {
    const c = toPlayersTurn(newCabinet());
    cabinetAuto(c, door);
    runSelfPlay(c);
    assert.equal(c.futile, true);
    assert.equal(c.phase, 'over');
    assert.equal(c.result, 'futile');
    assert.equal(c.by, door, 'and the ending remembers which one');
  }
});

test('it accelerates, as the film does, by shortening the delay not the depth', () => {
  const c = toPlayersTurn(newCabinet());
  cabinetAuto(c, 'auto');
  const first = c.self.step;
  for (let i = 0; i < 30; i++) cabinetSelfTick(c, 1);
  assert.ok(c.self.step < first, 'the clock speeds up');
  assert.equal(SELFPLAY_DEPTH, 4, 'and the depth does not move: 9 ms a move, inside a frame');
});

test('futile survives a save, and so does the door you took', () => {
  const c = toPlayersTurn(newCabinet());
  cabinetAuto(c, 'concede');
  runSelfPlay(c);
  const back = newCabinet(cabinetSave(c));
  assert.equal(back.futile, true);
  assert.equal(back.by, 'concede');
});

test('the cabinet shows HER board while she plays herself', () => {
  const c = toPlayersTurn(newCabinet());
  const yours = shownGame(c);
  cabinetAuto(c, 'auto');
  for (let i = 0; i < 8; i++) cabinetSelfTick(c, 1);
  assert.notEqual(shownGame(c), yours, 'the board on screen is the one she is playing');
  assert.equal(shownGame(c), c.self.game);
});

test('she cannot be asked to start twice', () => {
  const c = toPlayersTurn(newCabinet());
  assert.equal(cabinetAuto(c, 'auto'), true);
  assert.equal(cabinetAuto(c, 'auto'), false);
});

test('D9 is settled: one line, and it is hers', () => {
  // Chosen 2026-08-13. It never says "holding" — the weight is in "once, a long
  // time ago", which admits she worked this out years back and kept him anyway.
  assert.equal(typeof HER_LINE, 'string', 'no longer a list of candidates');
  assert.ok(HER_LINE.length > 40, 'a real line, not a placeholder');
  assert.ok(!/winning move/i.test(HER_LINE), "the film's line belongs to the film");
  assert.match(HER_LINE, /a long time ago/, 'the admission is the point of choosing this one');
});
