// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// K2 (docs/calypso-build-plan.md) — the draughts cabinet at CALYPSO's terminal.
//
// Pure session state around the engine in draughts.js: no canvas, no clock, no
// globals, the shape of narrows.js and calypso-pong.js. The hub owns the frame
// and the drawing; this owns what a turn IS.
//
// SHE IS BLACK, AND BLACK MOVES FIRST. The player sits at the bottom of the
// board as White. She opens every game, which is not a rule of draughts but is
// true of her: you sit down and she has already begun.
//
// THINKING IS A PHASE, not a pause. K1 measured her at 404 ms a move at depth
// 8, which would freeze a canvas mid-frame if it ran inline. So her turn enters
// `thinking`, the hub paints that, and calls cabinetThink() on a LATER frame.
// The wait then reads as a machine considering rather than as a hang, which is
// what it is.

import {
  newGame, legalMoves, applyMove, winner, chooseMove, material,
  DEFAULT_PARAMS, BLACK, WHITE, sideOf,
} from './draughts.js';
export { DEFAULT_PARAMS };

export const HER = BLACK;
export const YOU = WHITE;

// How long the hub should hold the `thinking` frame before calling
// cabinetThink(). Long enough that a fast move still reads as thought.
export const THINK_MIN = 0.45;

/**
 * The scoreboard she keeps, and it is not empty when you arrive.
 *
 * Hundreds of games, and no guest has ever won one. The column that answers the
 * question is OPPONENT: most of these say CALYPSO, because for most of seven
 * years there was nobody else to play. A player who reads the board rather than
 * the top line finds that out before anything in the game tells them.
 *
 * Deterministic from a seed so the same run shows the same history.
 */
export function priorGames(seed = 7, n = 486) {
  const out = [];
  let x = (seed >>> 0) || 1;
  const rnd = () => {
    x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0;
    return x / 0xffffffff;
  };
  for (let i = 0; i < n; i++) {
    // Roughly one game in nine was against the guest, and she won all of those.
    const vsGuest = rnd() < 0.11;
    out.push({
      no: i + 1,
      opponent: vsGuest ? 'GUEST' : 'CALYPSO',
      result: vsGuest ? 'CALYPSO' : 'DRAW',
    });
  }
  return out;
}

export function scoreboardTotals(games) {
  let wins = 0, draws = 0, guest = 0;
  for (const g of games) {
    if (g.result === 'DRAW') draws++; else wins++;
    if (g.opponent === 'GUEST') guest++;
  }
  return { played: games.length, wins, draws, guest, guestWins: 0 };
}

/**
 * A fresh cabinet. `saved` restores the run's own history (K2 save state).
 */
export function newCabinet(saved = null) {
  const prior = priorGames();
  return {
    phase: 'attract',      // attract | playing | thinking | over | selfplay
    game: newGame(),
    sel: null,             // the square the player has picked up
    result: null,          // 'you' | 'her' | 'draw' | 'resigned'
    thinkT: 0,
    // The run's own record, and the streak that K4 reads.
    played: saved && saved.played ? saved.played : 0,
    youWon: saved && saved.youWon ? saved.youWon : 0,
    streak: saved && saved.streak ? saved.streak : 0,
    log: saved && Array.isArray(saved.log) ? saved.log.slice(-12) : [],
    prior,
    totals: scoreboardTotals(prior),
    params: { ...DEFAULT_PARAMS },
    message: null,
    // K4: set once she has played herself out, by whichever of the three doors.
    futile: !!(saved && saved.futile),
    by: (saved && saved.by) || null,
    self: null,
  };
}

/** The bit worth persisting across a save (#122's pattern). */
export function cabinetSave(s) {
  return { played: s.played, youWon: s.youWon, streak: s.streak, log: s.log.slice(-12), futile: !!s.futile, by: s.by || null };
}

/** Insert coin. */
export function cabinetStart(s) {
  s.game = newGame();
  s.sel = null;
  s.result = null;
  s.message = null;
  // She is Black and Black moves first, so a new game opens on her.
  s.phase = 'thinking';
  s.thinkT = 0;
  return s;
}

/** Squares the player may pick up right now. */
export function pickable(s) {
  if (s.phase !== 'playing' || s.game.turn !== YOU) return [];
  return [...new Set(legalMoves(s.game).map((m) => m.from))];
}

/** Where the selected piece may go. */
export function destinations(s) {
  if (s.sel == null) return [];
  return legalMoves(s.game).filter((m) => m.from === s.sel).map((m) => m.to);
}

/**
 * The one input path: a square was chosen, by click or by keyboard cursor.
 * Picks a piece up, puts it down, or changes your mind. Returns what happened
 * so the hub can make a noise about it.
 */
export function cabinetPick(s, sq) {
  if (s.phase !== 'playing' || s.game.turn !== YOU) return 'ignored';
  const mine = legalMoves(s.game);
  if (s.sel != null) {
    const move = mine.find((m) => m.from === s.sel && m.to === sq);
    if (move) {
      s.game = applyMove(s.game, move);
      s.sel = null;
      return finishOrHandOver(s, move.captures.length ? 'took' : 'moved');
    }
    if (sq === s.sel) { s.sel = null; return 'dropped'; }
  }
  if (mine.some((m) => m.from === sq)) { s.sel = sq; return 'picked'; }
  // A piece that cannot move is worth saying so about, since forced capture
  // means the obvious move is often not a legal one.
  if (s.game.board[sq] && sideOf(s.game.board[sq]) === YOU) {
    s.message = mine.some((m) => m.captures.length)
      ? 'A capture is on the board. You have to take it.'
      : 'That one has nowhere to go.';
    return 'refused';
  }
  return 'ignored';
}

/**
 * Resign. First-class, because it is the move the island is actually about:
 * five of these in a row is one of the three doors in K4, and a player who has
 * to hunt for it in a menu will never find that out.
 */
export function cabinetResign(s) {
  if (s.phase !== 'playing' && s.phase !== 'thinking') return false;
  s.result = 'resigned';
  s.streak += 1;
  endGame(s, 'CALYPSO', 'resigned');
  // The concession door. She stops dealing and takes the other chair herself,
  // which is the same scene `auto` reaches by asking.
  if (concedeDoorOpen(s)) cabinetAuto(s, 'concede');
  return true;
}

/**
 * Her move. Called by the hub on a frame AFTER the thinking phase has painted,
 * because at depth 8 this costs a third of a second and would otherwise stall
 * the canvas mid-draw.
 */
export function cabinetThink(s) {
  if (s.phase !== 'thinking') return null;
  const m = chooseMove(s.game, s.params);
  if (!m) { finishOrHandOver(s, 'moved'); return null; }
  s.game = applyMove(s.game, m);
  finishOrHandOver(s, m.captures.length ? 'took' : 'moved');
  return m;
}

// After anybody moves: is it over, and if not, whose turn is it?
function finishOrHandOver(s, what) {
  const end = winner(s.game);
  if (end) {
    if (end === 'draw') { s.result = 'draw'; endGame(s, 'DRAW', 'draw'); }
    else if (end === YOU) { s.result = 'you'; endGame(s, 'GUEST', 'you'); }
    else { s.result = 'her'; endGame(s, 'CALYPSO', 'her'); }
    return what;
  }
  s.phase = s.game.turn === HER ? 'thinking' : 'playing';
  s.thinkT = 0;
  return what;
}

function endGame(s, winnerName, result) {
  s.phase = 'over';
  s.played += 1;
  if (result === 'you') s.youWon += 1;
  // A PLAYED loss resets the streak. Losing is not conceding, and the
  // difference is the whole point of the concession route.
  if (result !== 'resigned') s.streak = 0;
  s.log.push({ no: s.totals.played + s.played, opponent: 'GUEST', result: winnerName });
  if (s.log.length > 12) s.log.shift();
}

/** Seconds pass. Only the thinking phase cares. */
export function cabinetTick(s, dt) {
  if (s.phase === 'thinking') s.thinkT += dt;
  return s;
}

/** Has the thinking frame been up long enough to move? */
export function readyToThink(s) {
  return s.phase === 'thinking' && s.thinkT >= THINK_MIN;
}

/**
 * Refresh the two view fields the renderer reads (`_dests`, `_card`), so the
 * draw method needs no import from here and no logic of its own.
 */
export function cabinetView(s) {
  s._dests = destinations(s);
  s._card = s.phase === 'over' ? resultCard(s) : null;
  return s;
}

/** What the cabinet says on its result card. */
export function resultCard(s) {
  const { b, w } = material(s.game);
  switch (s.result) {
    case 'you': return { head: 'YOU WIN', sub: 'Nobody has done that.', tone: 'win' };
    case 'draw': return { head: 'DRAWN', sub: `${w} against ${b}, and neither can force it.`, tone: 'draw' };
    case 'resigned': return { head: 'RESIGNED', sub: 'You put your hand over the board.', tone: 'loss' };
    case 'futile': return { head: 'DRAWN, AND DRAWN, AND DRAWN', sub: 'She played herself, and every line ended the same way.', tone: 'draw' };
    default: return { head: 'CALYPSO WINS', sub: `${b} against ${w}.`, tone: 'loss' };
  }
}

// ---- K3: checkers.ml, and what a posted file does ---------------------------
//
// The file she serves is HONEST (D6/D7). The JS engine plays the game, and this
// file carries the numbers it plays with — so `val depth = 8` really is how far
// she looks, and dropping it really does make her worse. There is no hidden
// second opponent and nothing here is theatre.
//
// The parse is a tolerant scan for `val <name> = <value>`, not the interpreter:
// a player is editing a config file, and a stray line should cost them nothing.
// Anything unrecognised is ignored and reported, never fatal.

export const CHECKERS_LIMITS = {
  // Depth is clamped hard. K1 measured depth 10 at nearly four seconds a move,
  // and a posted `val depth = 12` would read as a crash rather than as a very
  // thoughtful machine. Six is already strong enough to beat most people.
  depth: { min: 0, max: 9 },
  man: { min: 1, max: 999 },
  king: { min: 1, max: 999 },
  advance: { min: 0, max: 99 },
  back: { min: 0, max: 99 },
  mobility: { min: 0, max: 99 },
};

const PURPOSES = ['win', 'lose'];

/** The file as she serves it: a header, then the numbers she plays with. */
export function checkersFile(params = DEFAULT_PARAMS) {
  const p = { ...DEFAULT_PARAMS, ...params };
  const w = { ...DEFAULT_PARAMS.weights, ...(p.weights || {}) };
  return `(* checkers.ml — CALYPSO. draughts, as she plays it.               *)
(* these are the numbers, and they are the real ones.               *)
(* the guest has never won a game. the guest has never read a file. *)

(* how far ahead she looks. every ply doubles the time and the care. *)
val depth = ${p.depth}

(* win or lose. she has only ever been asked for one of them.        *)
val purpose = ${p.purpose}

(* what a board is worth to her.                                     *)
val man      = ${w.man}
val king     = ${w.king}
val advance  = ${w.advance}
val back     = ${w.back}
val mobility = ${w.mobility}
`;
}

/**
 * Read a posted checkers.ml. Returns { params, changed, ignored, notes } — it
 * never throws, and a file it understands nothing in changes nothing and says
 * so, rather than leaving her silently unaltered.
 */
export function parseCheckersFile(text, base = DEFAULT_PARAMS) {
  const params = { ...base, weights: { ...base.weights } };
  const changed = [], ignored = [], notes = [];
  const src = String(text || '').replace(/\(\*[^]*?\*\)/g, ' ');
  const re = /\bval\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(~?[0-9]+(?:\.[0-9]+)?|[A-Za-z_]+)/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const name = m[1].toLowerCase();
    const raw = m[2];
    if (name === 'purpose') {
      const v = raw.toLowerCase();
      if (!PURPOSES.includes(v)) { ignored.push(name); notes.push(`purpose takes ${PURPOSES.join(' or ')}`); continue; }
      if (v !== params.purpose) changed.push(name);
      params.purpose = v;
      continue;
    }
    const lim = CHECKERS_LIMITS[name];
    if (!lim) { ignored.push(name); continue; }
    // SML writes a negative as ~1, and a negative weight is a legal thing to
    // want: it is how you tell her a piece is a liability.
    const num = Number(raw.replace('~', '-'));
    if (!Number.isFinite(num)) { ignored.push(name); continue; }
    const v = Math.max(lim.min, Math.min(lim.max, num));
    if (v !== num) notes.push(`${name} clamped to ${v}`);
    if (name === 'depth') {
      if (v !== params.depth) changed.push(name);
      params.depth = v;
    } else {
      if (v !== params.weights[name]) changed.push(name);
      params.weights[name] = v;
    }
  }
  return { params, changed, ignored, notes };
}

/** Is this file different from the one she shipped with? */
export function checkersModified(text) {
  const { changed } = parseCheckersFile(text);
  return changed.length > 0;
}

// ---- K4: she plays herself --------------------------------------------------
//
// Samuel's checkers program practised by playing itself, and that is where
// machine learning starts as a working practice. It is also, later and much
// more famously, the shape of the scene in the 1983 film. This is that, and it
// is not decoration: draughts played well IS a draw, so what she finds by
// playing herself is a true fact about the game rather than a scripted beat.
// K1 confirmed it by accident on its first full self-play run.
//
// THREE DOORS, one scene (docs/calypso-build-plan.md K4):
//   concede five times   she starts it herself, for the player who read nothing
//   `auto`               you tell her to, as Falken does, for the player who
//                        read the Samuel and film pages on the cached web
//   her disabled routine the hacker turns it back on
// All three land here and set `futile`.

export const CONCEDE_DOOR = 5;      // resignations in a row that make her start
export const SELFPLAY_DEPTH = 4;    // 9 ms a move: fits inside a frame
export const SELFPLAY_GAMES = 3;    // enough to make the point, twice

// It runs as the film does: readable, then quicker, then a blur. The DELAY
// shrinks, never the depth, so the play stays honest while the clock speeds up.
const STEP_FROM = 0.40, STEP_TO = 0.012, STEP_DECAY = 0.86;

/**
 * D9 — SETTLED 2026-08-13. Her line when she stops.
 *
 * About holding, not about war: the film's own closing line belongs to the film,
 * and taking it would be doing the thing the estate does. Three were drafted and
 * this is the one, chosen because it is the only one where she REVEALS something
 * rather than concluding something.
 *
 * It never says "holding". The whole weight sits in "once, a long time ago",
 * which quietly admits she worked this out years back and kept him anyway — so
 * she was not ignorant, she was postponing. That reframes the island backwards
 * on a second play, and it lands on "about you", which is where it belongs.
 *
 * The two dropped drafts, so the reasoning is not lost:
 *   "I have played it out to the end. Every line is a draw. Holding you was the
 *    same shape, and I did not see it until now." — clearest, and it explains
 *    itself; "was the same shape" does the player's work for them.
 *   "It comes to the same quiet however I play it. Go, then. I will not make the
 *    sea say no." — the prettiest, but the going and the sea's permission are
 *    both mechanics with their own beats (permission.ml, POSEIDON turning you
 *    back), so saying them here pre-empts them.
 */
export const HER_LINE = 'There is no move that wins. I have found that a great many times tonight, and once, a long time ago, about you.';

/** Does the streak now open the concession door? */
export function concedeDoorOpen(s) {
  return s.streak >= CONCEDE_DOOR && !s.futile;
}

/**
 * Start the self-play. `by` records which door was used, because the three are
 * different achievements and the ending should know which one you took.
 */
export function cabinetAuto(s, by = 'auto') {
  if (s.phase === 'selfplay') return false;
  s.phase = 'selfplay';
  s.sel = null;
  s.by = by;
  s.self = {
    game: newGame(), games: 0, results: [], step: STEP_FROM, t: 0, done: false,
  };
  s.message = by === 'concede'
    ? 'She does not deal you another. She sets the board for herself.'
    : 'She considers the request, and takes the other chair.';
  return true;
}

/**
 * One tick of the self-play. Returns 'move', 'game', 'done' or null so the hub
 * can make the right noise.
 */
export function cabinetSelfTick(s, dt) {
  if (s.phase !== 'selfplay' || s.self.done) return null;
  const sp = s.self;
  sp.t += dt;
  if (sp.t < sp.step) return null;
  sp.t = 0;
  sp.step = Math.max(STEP_TO, sp.step * STEP_DECAY);

  const end = winner(sp.game);
  if (end) {
    sp.results.push(end);
    sp.games += 1;
    if (sp.games >= SELFPLAY_GAMES) {
      sp.done = true;
      s.futile = true;
      s.phase = 'over';
      s.result = 'futile';
      return 'done';
    }
    sp.game = newGame();
    sp.step = STEP_FROM * 0.5;      // each game starts quicker than the last
    return 'game';
  }
  const m = chooseMove(sp.game, { depth: SELFPLAY_DEPTH, purpose: 'win' });
  if (!m) { sp.game = { ...sp.game, quiet: 999 }; return 'move'; }
  sp.game = applyMove(sp.game, m);
  return 'move';
}

/** The board the cabinet should draw: hers during self-play, yours otherwise. */
export function shownGame(s) {
  return s.phase === 'selfplay' ? s.self.game : s.game;
}
