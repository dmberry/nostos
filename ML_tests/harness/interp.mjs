// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The seam.
//
// Every test under ML_tests/ reaches the language through this file and through
// nothing else. That is the point of it: `docs/aiml-standalone-plan.md` moves the
// language out of `src/game/ai_ml.js` into `src/lang/` behind a single
// `createInterpreter` entry point (stages M1-M6), and a suite that imported the
// game module directly would have to be rewritten on the day of the cut.
//
// So this file probes for the new home first and falls back to the old one. When
// `src/lang/index.js` appears and exports `createInterpreter`, the suite starts
// using it with no edit anywhere else, and `backend` says which one answered.
//
// If both are present the new one wins, which is what you want during the cut:
// the tests measure the thing being extracted, not the thing being left behind.

const GAME_ADAPTER = '../../src/game/ai_ml.js';
// Two homes for the language: inside the game repo it is src/lang/; in the
// published BML repo the split renames that prefix to src/, so index.js sits one
// level up. Trying both is what lets this folder be copied into either.
const STANDALONE = ['../../src/lang/index.js', '../../src/index.js'];

async function loadBackend() {
  for (const path of STANDALONE) {
    try {
      const lang = await import(path);
      if (typeof lang.createInterpreter === 'function') return { kind: 'lang', mod: lang };
    } catch {
      // Not there. Before M3 neither is; in BML only the second is.
    }
  }
  const game = await import(GAME_ADAPTER);
  return { kind: 'game-adapter', mod: game };
}

const BACKEND = await loadBackend();

/** Which module answered: 'lang' after the extraction, 'game-adapter' before it. */
export const backend = BACKEND.kind;

/** The raw module that answered: the language after the cut, the adapter before. */
export const raw = BACKEND.mod;

/**
 * The GAME adapter, always, whichever side of the cut we are on, and **null in
 * a repo that has no game**.
 *
 * `raw` follows the seam and becomes the pure language once `src/lang/` exists,
 * at which point it stops exporting `decide`, `INTENTS`, `LAMP_COLOURS` and the
 * rest. Those are the game's, not the language's, and that is the whole point of
 * the extraction. Tests of the wrapper therefore ask for the wrapper by name.
 *
 * It is loaded in a try so that this folder can be copied into the published BML
 * repo, where `src/game/` does not exist. Importing it eagerly there threw at
 * module load and took every core test down with it, including the ones that
 * have nothing to do with the game. Tests that need it skip on null.
 */
export const gameRaw = await (async () => {
  try {
    return await import(GAME_ADAPTER);
  } catch {
    return null;
  }
})();

/** True in the game repo, false in the published language repo. */
export const hasGame = gameRaw !== null;

/**
 * A REPL session: a sequence of lines sharing one environment, the way a top
 * level works. Every test that needs more than one line uses one of these
 * rather than threading a context by hand.
 *
 * opts.types   'report' (default) runs the checker and names a clash while still
 *              running the line, as the NostBook does; 'strict' refuses a line
 *              that does not typecheck, which is the standalone REPL's default
 *              and the property that makes it an ML; 'off' runs the evaluator
 *              alone, as the obelisk consoles and the machines do.
 * opts.station only meaningful on the game adapter: which console this is.
 *              The standalone language has no stations and ignores it.
 * opts.prelude load the standard library written in AI-ML (default true).
 */
export function session(opts = {}) {
  const types = opts.types === undefined ? 'report' : opts.types;
  const station = opts.station || 'laptop';
  const wantPrelude = opts.prelude !== false;

  if (BACKEND.kind === 'lang') {
    const interp = BACKEND.mod.createInterpreter({
      typecheck: types,
      builtins: opts.builtins || {},
    });
    if (wantPrelude && typeof interp.loadPrelude === 'function') interp.loadPrelude();
    return {
      backend: 'lang',
      // Same order as the adapter and as bin/bml.js: the checker sees every
      // line, so it keeps its own record of what has been declared.
      run: (src) => {
        const line = String(src);
        const ty = types !== 'off' ? interp.typeReport(line) : null;
        const r = interp.run(line);
        return ty === null ? r : { ...r, type: ty };
      },
      type: (src) => interp.typeReport(String(src)),
      echo: (src) => {
        const line = String(src);
        const ty = interp.typeReport(line);
        const r = interp.run(line);
        if (!r.ok) return [r.text];
        return interp.smlEcho ? interp.smlEcho(r.text, ty) : [r.text];
      },
      get session() { return interp.session; },
    };
  }

  const { runRonml, typeReport, loadPrelude, smlEcho } = BACKEND.mod;
  const ctx = {
    station,
    session: {},
    types: types !== 'off',
    // The game never sets this; the standalone REPL defaults to it. Passing it
    // through here is what lets one suite test both modes.
    typecheck: types,
    hasManual: true,
    // The game hooks a live world onto the context. A language test has no
    // world, so these answer emptily rather than being absent: an absent hook
    // reads as a crash, an empty one reads as "nothing out there", which is the
    // honest state of a test bench.
    units: () => [],
    hasAiKey: () => false,
    currentNode: () => 'OB_TEST',
    listObelisks: () => [],
    heldKeys: () => new Set(),
    bindSession(n, v) { this.session[n] = v; },
    ...(opts.ctx || {}),
  };
  if (wantPrelude) loadPrelude(ctx);
  return {
    backend: 'game-adapter',
    // The checker runs BEFORE the evaluator, and on every line, because that is
    // what bin/bml.js and the NostBook's `ml` both do. It matters: the checker
    // keeps its own view of what has been declared, so a session that evaluates
    // a datatype without checking it leaves the checker not knowing the
    // constructors, and the exhaustiveness warning then never fires. A harness
    // that skipped this would have reported a working feature as broken.
    run: (src) => {
      const line = String(src);
      const ty = types !== 'off' ? typeReport(line, ctx) : null;
      const r = runRonml(line, ctx);
      return ty === null ? r : { ...r, type: ty };
    },
    type: (src) => typeReport(String(src), ctx),
    // What a top level would print: `val it = 7 : int` rather than `7`.
    echo: (src) => {
      const r = runRonml(String(src), ctx);
      if (!r.ok) return [r.text];
      return smlEcho ? smlEcho(r.text, typeReport(String(src), ctx)) : [r.text];
    },
    ctx,
    get session() { return ctx.session; },
  };
}

/** One line, one throwaway session. For the many tests that need no history. */
export function once(src, opts) {
  return session(opts).run(src);
}

/** The type of one line, in a throwaway session. */
export function typeOnce(src, opts) {
  return session(opts).type(src);
}
