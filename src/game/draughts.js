// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// K1 (docs/calypso-build-plan.md) — English draughts, pure rules and a search.
//
// Draughts is not an arbitrary choice of game. Strachey wrote a draughts
// programme for the Ferranti Mark I in 1951-52, and Samuel spent the fifties on
// a checkers player that improved by PLAYING ITSELF, which is where machine
// learning starts as a working practice rather than a hope. So the game at
// CALYPSO's terminal is the first game a machine ever played, and the way she
// practises is Samuel's way. See docs/ai-codebase-plan.md §4.4.
//
// No canvas, no world, no clock, in the shape of narrows.js: rules and a search
// that a test can drive. The cabinet (K2) draws it and the ML file (K3) sets
// its parameters.
//
// SHE IS NOT RIGGED, SHE IS BETTER (decision D6). There is no hidden
// information here and no cheating opponent, because in a turn-based game with
// a shared board there is nowhere to hide one. She searches deeper than you
// can. The file served at her terminal says `val depth = 8` and means it, and
// the hack is to reach in and change that number.

// ---- the board --------------------------------------------------------------
// 64 squares, row-major, row 0 at the top. Only DARK squares are played, which
// is every square where (row + col) is odd. Black sits on rows 0-2 and moves
// DOWN the board; White sits on rows 5-7 and moves UP. Black moves first, as it
// does in the English game.

export const BLACK = 'b';
export const WHITE = 'w';

const MAN = { b: 'b', w: 'w' };
const KING = { b: 'B', w: 'W' };

export const isDark = (r, c) => ((r + c) & 1) === 1;
export const sideOf = (p) => (p === 'b' || p === 'B' ? BLACK : p === 'w' || p === 'W' ? WHITE : null);
export const isKing = (p) => p === 'B' || p === 'W';
const other = (s) => (s === BLACK ? WHITE : BLACK);
const inBoard = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

// A man's forward directions, as [dr, dc]. A king takes all four.
const FORWARD = { b: [[1, -1], [1, 1]], w: [[-1, -1], [-1, 1]] };
const ALL_DIRS = [[1, -1], [1, 1], [-1, -1], [-1, 1]];
const dirsFor = (p) => (isKing(p) ? ALL_DIRS : FORWARD[sideOf(p)]);

// The back rank a man must reach to be crowned.
const CROWN_ROW = { b: 7, w: 0 };

/** A fresh game: twelve a side, Black to move. */
export function newGame() {
  const board = new Array(64).fill(null);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (!isDark(r, c)) continue;
      if (r <= 2) board[r * 8 + c] = MAN.b;
      else if (r >= 5) board[r * 8 + c] = MAN.w;
    }
  }
  // `quiet` counts plies since the last capture or man move. Draughts played
  // well is a draw, and without this the self-play in K4 would never end — two
  // kings can shuffle forever. Forty is the usual tournament figure.
  return { board, turn: BLACK, quiet: 0, plies: 0 };
}

export const QUIET_LIMIT = 40;

// ---- moves ------------------------------------------------------------------
// A move is the WHOLE thing a player does in a turn, chained jumps included:
//   { from, to, path: [squares stepped to], captures: [squares removed], crown }
// A multi-jump is one move with several entries in path and captures, because a
// player who has begun a jump has no choice about finishing it.

function jumpsFrom(board, sq, piece, taken) {
  const out = [];
  const r = (sq / 8) | 0, c = sq % 8;
  for (const [dr, dc] of dirsFor(piece)) {
    const mr = r + dr, mc = c + dc;          // the square jumped over
    const lr = r + dr * 2, lc = c + dc * 2;  // where we land
    if (!inBoard(lr, lc)) continue;
    const mid = mr * 8 + mc, land = lr * 8 + lc;
    const over = board[mid];
    if (!over || sideOf(over) === sideOf(piece)) continue;
    if (taken.includes(mid)) continue;       // a piece is jumped once per move
    if (board[land] && land !== sq) continue;
    out.push({ mid, land });
  }
  return out;
}

// Walk one piece's jump tree. In the English game a man that reaches the back
// rank BY A JUMP is crowned and the move ends there: it does not carry on as a
// king. That rule is why this returns rather than recursing when `crowned`.
function chainJumps(board, sq, piece, path, taken, out) {
  const steps = jumpsFrom(board, sq, piece, taken);
  if (!steps.length) {
    if (path.length) {
      out.push({
        from: path[0].from, to: sq, path: path.map((p) => p.to),
        captures: taken.slice(), crown: false,
      });
    }
    return;
  }
  for (const { mid, land } of steps) {
    const lr = (land / 8) | 0;
    const crowned = !isKing(piece) && lr === CROWN_ROW[sideOf(piece)];
    const nextPath = path.concat([{ from: path.length ? path[0].from : sq, to: land }]);
    const nextTaken = taken.concat([mid]);
    if (crowned) {
      out.push({
        from: nextPath[0].from, to: land, path: nextPath.map((p) => p.to),
        captures: nextTaken, crown: true,
      });
      continue;
    }
    // The jumping piece is not on the board while it looks ahead, so it cannot
    // block its own landing square on a round trip.
    const b2 = board.slice();
    b2[sq] = null; b2[mid] = null; b2[land] = piece;
    chainJumps(b2, land, piece, nextPath, nextTaken, out);
  }
}

/**
 * Every legal move for the side to move. FORCED CAPTURE: if any jump exists,
 * the jumps are the only legal moves there are.
 */
export function legalMoves(state) {
  const { board, turn } = state;
  const jumps = [], quiet = [];
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq];
    if (!p || sideOf(p) !== turn) continue;
    chainJumps(board, sq, p, [], [], jumps);
    const r = (sq / 8) | 0, c = sq % 8;
    for (const [dr, dc] of dirsFor(p)) {
      const nr = r + dr, nc = c + dc;
      if (!inBoard(nr, nc)) continue;
      const to = nr * 8 + nc;
      if (board[to]) continue;
      quiet.push({
        from: sq, to, path: [to], captures: [],
        crown: !isKing(p) && nr === CROWN_ROW[turn],
      });
    }
  }
  // Both lists are built before either is chosen from, because a jump found on
  // the last square still has to suppress a quiet move found on the first.
  return jumps.length ? jumps : quiet;
}

/** Apply a move and hand back a NEW state. Never mutates. */
export function applyMove(state, move) {
  const board = state.board.slice();
  const piece = board[move.from];
  board[move.from] = null;
  for (const sq of move.captures) board[sq] = null;
  board[move.to] = move.crown ? KING[sideOf(piece)] : piece;
  const wasMan = !isKing(piece);
  return {
    board,
    turn: other(state.turn),
    quiet: (move.captures.length || wasMan) ? 0 : state.quiet + 1,
    plies: state.plies + 1,
  };
}

/**
 * Who has won: 'b', 'w', 'draw', or null if the game is still going.
 * You lose by having no pieces OR no legal move, which is the same loss in
 * draughts and catches the player who is blocked in with everything intact.
 */
export function winner(state) {
  if (state.quiet >= QUIET_LIMIT) return 'draw';
  if (!legalMoves(state).length) return other(state.turn);
  return null;
}

// ---- the evaluation ---------------------------------------------------------
// One exported table, because K3 serves these numbers as `checkers.ml` and a
// player who edits the file is editing exactly this.

export const EVAL_WEIGHTS = {
  man: 100,        // a plain piece
  king: 175,       // a crowned one, worth rather more than one and a half men
  advance: 4,      // per row a man has walked toward crowning
  back: 6,         // per man still holding its own back rank, which is a real defence
  mobility: 2,     // per legal move available
};

/** The score of a position from BLACK's point of view. */
export function evaluate(state, weights = EVAL_WEIGHTS) {
  let score = 0;
  for (let sq = 0; sq < 64; sq++) {
    const p = state.board[sq];
    if (!p) continue;
    const side = sideOf(p);
    const sign = side === BLACK ? 1 : -1;
    const r = (sq / 8) | 0;
    if (isKing(p)) {
      score += sign * weights.king;
    } else {
      score += sign * weights.man;
      score += sign * weights.advance * (side === BLACK ? r : 7 - r);
      if (r === (side === BLACK ? 0 : 7)) score += sign * weights.back;
    }
  }
  if (weights.mobility) {
    const mine = legalMoves(state).length;
    const theirs = legalMoves({ ...state, turn: other(state.turn) }).length;
    const sign = state.turn === BLACK ? 1 : -1;
    score += sign * weights.mobility * (mine - theirs);
  }
  return score;
}

// ---- the search -------------------------------------------------------------

export const DEFAULT_PARAMS = {
  depth: 8,          // how far she looks. This is the number worth changing
  purpose: 'win',    // 'win' or 'lose'; 'lose' inverts the sign of the score
  weights: EVAL_WEIGHTS,
};

const WIN = 1e6;

// Alpha-beta over the negamax convention, scored from the side to move.
function search(state, depth, alpha, beta, weights) {
  const end = winner(state);
  if (end === 'draw') return 0;
  if (end) return end === state.turn ? WIN + depth : -(WIN + depth);
  if (depth <= 0) {
    const s = evaluate(state, weights);
    return state.turn === BLACK ? s : -s;
  }
  const moves = orderMoves(legalMoves(state));
  let best = -Infinity;
  for (const m of moves) {
    const v = -search(applyMove(state, m), depth - 1, -beta, -alpha, weights);
    if (v > best) best = v;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;                // this line is refuted; stop looking
  }
  return best;
}

// Captures first, and longer captures before shorter ones. Alpha-beta is only
// as good as its move ordering, and a forced-capture game hands you the
// ordering for nothing.
function orderMoves(moves) {
  return moves.slice().sort((a, b) => (b.captures.length - a.captures.length)
    || (a.from - b.from) || (a.to - b.to));
}

/**
 * The move she plays. Deterministic: the same position and the same parameters
 * give the same move every time, so a test can reproduce a game and a player
 * cannot win by reloading.
 *
 * `purpose: 'lose'` inverts the score, so she plays the worst line she can find
 * and throws pieces at you. That is what the served file's `val purpose` does,
 * and it is the funniest single edit available in the game.
 */
export function chooseMove(state, params = DEFAULT_PARAMS) {
  const p = { ...DEFAULT_PARAMS, ...params };
  const moves = orderMoves(legalMoves(state));
  if (!moves.length) return null;
  if (moves.length === 1) return moves[0];
  const depth = Math.max(0, Math.min(12, p.depth | 0));
  const flip = p.purpose === 'lose' ? -1 : 1;
  let best = null, bestScore = -Infinity;
  for (const m of moves) {
    const raw = -search(applyMove(state, m), depth - 1, -Infinity, Infinity, p.weights);
    const score = raw * flip;
    if (score > bestScore) { bestScore = score; best = m; }
  }
  return best;
}

// ---- reading a board --------------------------------------------------------

/** The board as eight lines, for a test failure or a terminal that wants text. */
export function render(state) {
  const out = [];
  for (let r = 0; r < 8; r++) {
    let line = '';
    for (let c = 0; c < 8; c++) {
      const p = state.board[r * 8 + c];
      line += p || (isDark(r, c) ? '.' : ' ');
    }
    out.push(line);
  }
  return out.join('\n');
}

/** Build a position from render()'s own format, for tests. */
export function fromRender(lines, turn = BLACK) {
  const rows = Array.isArray(lines) ? lines : String(lines).split('\n');
  const board = new Array(64).fill(null);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const ch = (rows[r] || '')[c];
      if (ch && ch !== '.' && ch !== ' ') board[r * 8 + c] = ch;
    }
  }
  return { board, turn, quiet: 0, plies: 0 };
}

/** How many pieces each side has left. */
export function material(state) {
  let b = 0, w = 0;
  for (const p of state.board) {
    if (!p) continue;
    if (sideOf(p) === BLACK) b++; else w++;
  }
  return { b, w };
}
