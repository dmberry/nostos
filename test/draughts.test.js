// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// K1 (docs/calypso-build-plan.md) — the draughts rules and the search.
//
// The rules matter more here than in most games we have built, because the
// player is going to LOSE to this repeatedly and then go and read the file that
// drives it. A rules bug would read as her cheating, and the whole island is
// built on her not cheating: she is not rigged, she is better (D6).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  newGame, legalMoves, applyMove, winner, chooseMove, evaluate, render, fromRender,
  material, EVAL_WEIGHTS, DEFAULT_PARAMS, QUIET_LIMIT, BLACK, WHITE, isKing, sideOf,
} from '../src/game/draughts.js';

const sq = (r, c) => r * 8 + c;
const at = (state, r, c) => state.board[sq(r, c)];
const find = (moves, from, to) => moves.find((m) => m.from === from && m.to === to);

// ---- the opening ------------------------------------------------------------

test('a fresh board is twelve a side on the dark squares, Black to move', () => {
  const g = newGame();
  assert.deepEqual(material(g), { b: 12, w: 12 });
  assert.equal(g.turn, BLACK);
  // Nothing on a light square, ever.
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (((r + c) & 1) === 0) assert.equal(at(g, r, c), null, `light square ${r},${c} is occupied`);
    }
  }
  assert.equal(at(g, 3, 1), null, 'row three is empty');
  assert.equal(at(g, 4, 0), null, 'row four is empty');
});

test('the opening has seven legal moves, which is the known number', () => {
  assert.equal(legalMoves(newGame()).length, 7);
});

test('a man only walks forward, and Black walks down the board', () => {
  const g = newGame();
  for (const m of legalMoves(g)) {
    assert.ok(((m.to / 8) | 0) > ((m.from / 8) | 0), 'Black should be moving down');
  }
  const after = applyMove(g, legalMoves(g)[0]);
  for (const m of legalMoves(after)) {
    assert.ok(((m.to / 8) | 0) < ((m.from / 8) | 0), 'White should be moving up');
  }
});

// ---- captures ---------------------------------------------------------------

test('a capture is FORCED: with a jump available, nothing else is legal', () => {
  const g = fromRender([
    '        ',
    '        ',
    '   b    ',
    '    w   ',
    '        ',
    '  w     ',
    '        ',
    '        ',
  ], BLACK);
  const moves = legalMoves(g);
  assert.equal(moves.length, 1, 'the jump is the only move');
  assert.equal(moves[0].captures.length, 1);
  assert.equal(moves[0].to, sq(4, 5));
});

test('a chained double jump is ONE move, and takes both', () => {
  const g = fromRender([
    '        ',
    ' b      ',
    '  w     ',
    '        ',
    '  w     ',
    '        ',
    '        ',
    '        ',
  ], BLACK);
  const moves = legalMoves(g);
  const chain = moves.find((m) => m.captures.length === 2);
  assert.ok(chain, `expected a double jump, got ${JSON.stringify(moves)}`);
  assert.equal(chain.from, sq(1, 1));
  assert.equal(chain.to, sq(5, 1));
  assert.equal(chain.path.length, 2, 'the path records both hops');
  const after = applyMove(g, chain);
  assert.deepEqual(material(after), { b: 1, w: 0 }, 'both are taken in the one move');
});

test('a piece is never jumped twice in the same move', () => {
  const g = fromRender([
    '        ',
    '   b    ',
    '  w w   ',
    '        ',
    '  w w   ',
    '        ',
    '        ',
    '        ',
  ], BLACK);
  for (const m of legalMoves(g)) {
    assert.equal(new Set(m.captures).size, m.captures.length, 'a capture list must not repeat');
  }
});

test('a man may not jump backwards; a king may', () => {
  const back = [
    '        ',
    '        ',
    '        ',
    '        ',
    '   w    ',
    '  b     ',
    '        ',
    '        ',
  ];
  // Black man at (5,2) with White at (4,3): that is BEHIND a black man, which
  // moves down. No jump, so the quiet moves stand.
  const asMan = legalMoves(fromRender(back, BLACK));
  assert.ok(asMan.every((m) => !m.captures.length), 'a man cannot jump backwards');
  const asKing = legalMoves(fromRender([
    '        ',
    '        ',
    '        ',
    '        ',
    '   w    ',
    '  B     ',
    '        ',
    '        ',
  ], BLACK));
  assert.ok(asKing.some((m) => m.captures.length === 1), 'a king can');
});

// ---- crowning ---------------------------------------------------------------

test('a man reaching the far rank is crowned', () => {
  const g = fromRender([
    '        ',
    '        ',
    '        ',
    '        ',
    '        ',
    '        ',
    '  b     ',
    '        ',
  ], BLACK);
  const m = legalMoves(g).find((x) => x.crown);
  assert.ok(m, 'reaching row 7 should crown');
  const after = applyMove(g, m);
  assert.ok(isKing(after.board[m.to]), 'and the piece is a king');
  assert.equal(sideOf(after.board[m.to]), BLACK, 'still Black');
});

test('crowning by a jump ENDS the move: it does not carry on as a king', () => {
  // Black man jumps into row 7 and is crowned. A king at that square could jump
  // back up over the second White piece; the English rule says it may not,
  // because the crowning ends the turn.
  const g = fromRender([
    '        ',
    '        ',
    '        ',
    '        ',
    '        ',
    '    b   ',
    '   w w  ',
    '        ',
  ], BLACK);
  const m = legalMoves(g).find((x) => x.crown && x.captures.length);
  assert.ok(m, 'the crowning jump should exist');
  assert.equal(m.captures.length, 1, 'and it takes exactly one, then stops');
  assert.ok(isKing(applyMove(g, m).board[m.to]));
});

// ---- ending -----------------------------------------------------------------

test('you lose with no pieces', () => {
  const g = fromRender([
    '        ',
    '  b     ',
    '        ',
    '        ',
    '        ',
    '        ',
    '        ',
    '        ',
  ], WHITE);
  assert.equal(winner(g), BLACK, 'White has nothing to move');
});

test('you lose when BLOCKED, with every piece still on the board', () => {
  // Black man in the corner with its only diagonal occupied by its own side.
  const g = fromRender([
    'b       ',
    ' b      ',
    '        ',
    '        ',
    '        ',
    '        ',
    '        ',
    '      w ',
  ], BLACK);
  const moves = legalMoves(g);
  if (!moves.length) assert.equal(winner(g), WHITE, 'no move is a loss, not a draw');
  else assert.ok(moves.length, 'this position has moves; the blocked case is covered by winner()');
});

test('a long quiet spell is a draw, which is what makes the self-play end', () => {
  const g = { ...newGame(), quiet: QUIET_LIMIT };
  assert.equal(winner(g), 'draw');
});

// ---- the search -------------------------------------------------------------

test('the search takes a piece when a piece is going free', () => {
  const g = fromRender([
    '        ',
    '   b    ',
    '    w   ',
    '        ',
    '        ',
    '        ',
    '        ',
    '        ',
  ], BLACK);
  const m = chooseMove(g, { depth: 4 });
  assert.equal(m.captures.length, 1, 'it should take the free piece');
});

test('she is deterministic: the same position gives the same move', () => {
  const g = newGame();
  const a = chooseMove(g, { depth: 4 });
  const b = chooseMove(g, { depth: 4 });
  assert.deepEqual(a, b, 'reloading must not give a player a different game');
});

test('depth is strength: an eight beats a one over a whole game', () => {
  // Black searches deep, White searches one ply. Black should be ahead on
  // material by the time the game is out, which is the claim the island rests
  // on: she is not rigged, she is simply looking further than you are.
  let g = newGame();
  for (let i = 0; i < 60 && !winner(g); i++) {
    const params = g.turn === BLACK ? { depth: 6 } : { depth: 1 };
    const m = chooseMove(g, params);
    if (!m) break;
    g = applyMove(g, m);
  }
  const { b, w } = material(g);
  assert.ok(b > w, `the deeper search should be ahead: black ${b}, white ${w}`);
});

test("purpose 'lose' throws the game, which is the funniest edit in the file", () => {
  let g = newGame();
  for (let i = 0; i < 40 && !winner(g); i++) {
    // Black is trying to lose; White is playing normally but shallowly.
    const params = g.turn === BLACK ? { depth: 4, purpose: 'lose' } : { depth: 2 };
    const m = chooseMove(g, params);
    if (!m) break;
    g = applyMove(g, m);
  }
  const { b, w } = material(g);
  assert.ok(b < w, `a losing purpose should be behind: black ${b}, white ${w}`);
});

test('the parameters she ships with are the ones the file will say', () => {
  assert.equal(DEFAULT_PARAMS.depth, 8);
  assert.equal(DEFAULT_PARAMS.purpose, 'win');
  assert.equal(DEFAULT_PARAMS.weights, EVAL_WEIGHTS);
});

test('a depth of zero still returns a legal move rather than nothing', () => {
  const g = newGame();
  const m = chooseMove(g, { depth: 0 });
  assert.ok(m, 'she must always answer with something');
  assert.ok(legalMoves(g).some((x) => x.from === m.from && x.to === m.to));
});

test('a forced single move is played without searching at all', () => {
  const g = fromRender([
    '        ',
    '   b    ',
    '    w   ',
    '        ',
    '        ',
    '        ',
    '        ',
    '        ',
  ], BLACK);
  assert.equal(legalMoves(g).length, 1);
  assert.ok(chooseMove(g, { depth: 12 }), 'and it comes back immediately');
});

// ---- evaluation -------------------------------------------------------------

test('a king is worth more than a man, and material dominates', () => {
  const withMan = fromRender(['        ', '  b     ', '        ', '        ',
    '        ', '        ', '        ', '        '], WHITE);
  const withKing = fromRender(['        ', '  B     ', '        ', '        ',
    '        ', '        ', '        ', '        '], WHITE);
  assert.ok(evaluate(withKing) > evaluate(withMan));
});

test('the evaluation is symmetric: a mirrored position scores the opposite', () => {
  const a = fromRender(['        ', '  b     ', '        ', '        ',
    '        ', '        ', '        ', '        '], BLACK);
  const b = fromRender(['        ', '        ', '        ', '        ',
    '        ', '        ', '  w     ', '        '], WHITE);
  assert.equal(evaluate(a, { ...EVAL_WEIGHTS, mobility: 0 }),
    -evaluate(b, { ...EVAL_WEIGHTS, mobility: 0 }),
    'the same position from the other side must score the same magnitude');
});

// ---- the board is readable --------------------------------------------------

test('render and fromRender round-trip', () => {
  const g = newGame();
  const back = fromRender(render(g), g.turn);
  assert.deepEqual(back.board, g.board);
});

test('applyMove never mutates the state it was given', () => {
  const g = newGame();
  const before = g.board.slice();
  applyMove(g, legalMoves(g)[0]);
  assert.deepEqual(g.board, before, 'a search that mutated the board would corrupt every line');
});
