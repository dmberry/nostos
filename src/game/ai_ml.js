// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// AI-ML: the small functional language typed into an obelisk terminal, a
// HERMES relay, the NostBook, and carried by a machine as its own program.
// Design: docs/ob-terminal-language.md.
//
// LINEAGE. This is a descendant of Standard ML, and the resemblance is meant
// to survive inspection: `let` and `let ... in`, `fn x => e` lambdas, named
// functions applied by juxtaposition, recursion, and lists built from `nil`
// and `::`. Harper's Introduction to Standard ML (1986-1993) is the reference
// the design keeps returning to; where this language departs from it, the
// departure is deliberate and noted at the point it happens.
//
// WHAT IT DROPS, and why. No type system: the machine this runs on has no
// compiler, only an interpreter, and a survivor typing at a dead console gets
// their error when the thing runs, not before. No pattern matcher: matching in
// ML is the eliminator for constructors declared with `datatype`, and there is
// no `datatype` here, so a matcher would have nothing to take apart but lists
// and would buy syntax rather than power. `hd`, `tl` and `length` do that job.
// No `map` or `filter`: with recursion you can write them, and writing them is
// what this machine is for.
//
// Runtime values are tagged objects, never raw JS primitives, so error
// messages can name what went wrong:
//   {tag:'node', id}   {tag:'key', id}   {tag:'num', v}
//   {tag:'list', items}  {tag:'unit'}   {tag:'fn', name, builtin, args}

import { typeOf, remember, setHostKnowsName } from '../lang/types.js';
import {
  evalNode, applyValue, formatValue, describeValue, combineOutput,
  beginRun, setHostNameHint, setHostUnbound, setHostValues, setOut, pushOut,
} from '../lang/eval.js';
import { createInterpreter, smlEcho, flattenSession } from '../lang/interp.js';
import { PRELUDE } from '../lang/basis.js';
import { PRIMITIVES } from '../lang/prims.js';
import { diagnose, NOT_FITTED_SAMPLES } from '../lang/diag.js';

// Re-exported, never redefined: seven files import these names from here, and
// the standing rule is that the adapter re-exports. Two definitions of one
// thing is how the diagnostic list went stale six times.
export { smlEcho, PRELUDE, diagnose, NOT_FITTED_SAMPLES, flattenSession };

const numericTag = (x) => !!x && (x.tag === 'int' || x.tag === 'real');

export { RonmlError, RonmlFuelError, RonmlRaise } from '../lang/errors.js';
import { RonmlError, RonmlFuelError, RonmlRaise } from '../lang/errors.js';



// ---- The language proper lives in src/lang/ --------------------------------
//
// M1 (v1.286) moved the lexer and the parser out. Everything below this point
// is the ADAPTER: the verb tables for the four stations, the sensors, the robot
// contract, the game's help and survey wording. Nothing here is the language.
//
// The re-exports are load-bearing: seven files import these names from this
// module, and the standing rule in docs/aiml-standalone-plan.md is that the
// adapter RE-EXPORTS and never copies. Two definitions of the same thing is how
// the diagnostic list went stale six times.
import { tokenize } from '../lang/lex.js';
import { parse, parseLine, joinProgram, joinProgramLines, needsMoreInput, continuesPrevious, defaultFixity } from '../lang/parse.js';

export { parseLine, joinProgram, joinProgramLines, needsMoreInput, continuesPrevious, defaultFixity };

// What a unit's lamp can be set to. A machine of this vintage has one LED and
// a handful of drive levels, not a colour picker, so the set is short and named.
export const LAMP_COLOURS = ['red', 'amber', 'green', 'blue', 'white', 'off'];

// Effects a program can have on its own machine as it evaluates. Collected in
// EFFECTS (module-level, like OUT, because closures capture the defining ctx —
// see the echo bug) and drained by decide(). The engine decides whether to
// honour any of them; the language only records the request.
let EFFECTS = null;
function EFFECT(kind, arity, build) {
  return {
    arity,
    fn: (args) => {
      const extra = build(args) || {};
      if (EFFECTS) EFFECTS.push({ k: kind, ...extra });
      return { tag: 'unit' };
    },
  };
}

// A sensor: reads one field out of the snapshot the engine handed in. Missing
// readings are not an error — a machine with a broken sensor reports zero or
// false, and a program written against it still runs.
function SENSE(field, kind) {
  return {
    arity: 0,
    fn: (_args, ctx) => {
      const v = ctx && ctx.sense ? ctx.sense[field] : undefined;
      return kind === 'bool' ? { tag: 'bool', v: !!v } : { tag: 'int', v: Number(v) || 0 };
    },
  };
}

// ---- Builtins ----------------------------------------------------------
// Each `ctx` method is supplied by the caller (main.js) and does the actual
// world-mutation; this module only handles language mechanics and gating.

// `copy <file> <device>` — the arity-2 second half of the polymorphic `copy`.
// `copy` (below) returns a partial bound to this when its first arg is a file,
// so `copy factory_id.ml ob` moves the file, while `copy aikey` stays the
// arity-1 key-bind. ctx.copyFile does the world-side move and returns {ok,msg}.
const COPY_FILE = {
  arity: 2,
  fn: ([file, dest], ctx) => {
    if (!file || file.tag !== 'file') throw new RonmlError('copy needs a file first — try: copy factory_id.ml ob');
    const destName = (dest && dest.id) ? String(dest.id).toLowerCase() : '';
    if (!destName) throw new RonmlError('copy a file WHERE? — try: copy factory_id.ml ob');
    if (!ctx.copyFile) throw new RonmlError("you can't move files at this terminal.");
    const r = ctx.copyFile(file.name, destName);
    if (!r || !r.ok) throw new RonmlError((r && r.msg) || `couldn't copy ${file.name}.`);
    return { tag: 'file', name: file.name };
  },
};

// ---- the control verbs (docs/ob-hacking-plan.md) ---------------------------
//
// `unlock` was the ONLY thing a decrypted AI key was for, which made the most
// laborious object in the game a single-use one. These reach the island as a
// system rather than one node at a time, and they all want the same key, so the
// check is written once here rather than five times below.
function requireClean(dec, verb) {
  if (!dec || dec.tag !== 'key' || dec.kind !== 'aikey') {
    throw new RonmlError(`${verb} needs the AI key, decrypted. copy aikey  then  let d = decrypt aikey  then  ${verb} … d`);
  }
  if (dec.enc !== false) {
    throw new RonmlError(`that AI key is still sealed. let d = decrypt aikey  first, then  ${verb} … d`);
  }
}

// A SETTING WRITTEN AS A BARE WORD, which is how this console already reads
// `hack OB_1A2B`: an unbound word arrives as a node. A string works too, and
// both fold case, because NostOS folds case everywhere. An unknown word is
// named back rather than quietly ignored.
function settingOf(v, verb, allowed) {
  const raw = v && (v.tag === 'node' ? v.id : v.tag === 'str' ? v.v : null);
  const word = raw == null ? null : String(raw).toLowerCase();
  if (!word || !allowed.includes(word)) {
    throw new RonmlError(`${verb} takes ${allowed.join(' | ')} — try: ${verb} ${allowed[0].toUpperCase()} d`);
  }
  return word;
}

function makeBuiltins(station) {
  const B = {
    // The language's own primitives, sourced from src/lang/prims.js rather than
    // written again here. They used to be defined in this object, which meant
    // BML could not load its own prelude without the game (v1.288, M4). The
    // station filters below still decide which stations get them: an obelisk
    // control terminal has no `explode` and never did.
    ...PRIMITIVES,
    scan: {
      arity: 0,
      fn: (_args, ctx) => ({ tag: 'list', items: ctx.listObelisks().map((id) => ({ tag: 'node', id })) }),
    },
    // `garrison` — the units homed to THIS tower, the ones it musters and
    // recharges: id, chassis, state and any operator tag. Where `scan` lists the
    // towers on the wire, this lists the machines that answer to the one you are
    // jacked into, so you can find the right unit to tag, reprogram or repel.
    garrison: {
      arity: 0,
      fn: (_args, ctx) => ({ tag: 'str', v: ctx.garrison ? ctx.garrison() : 'garrison: not available from this console.' }),
    },
    // `soul <unit>` — the machine's SOUL DOCUMENT: the program it is running,
    // printed whole, with whatever constitution sits above it. It is the same
    // bytes `fetch <unit>/program.ml` returns, wearing the discourse's own word
    // for the thing. A machine's soul in this world is seven lines, written by
    // somebody else, and public to anyone who asks.
    soul: {
      arity: 1,
      fn: ([u], ctx) => {
        const id = String(u && (u.id || u.name || u.v) || '').trim();
        if (!id) throw new RonmlError('soul takes a unit — try: soul t1_03');
        if (!ctx.soulOf) throw new RonmlError('no unit interface on this console.');
        return { tag: 'str', v: ctx.soulOf(id) };
      },
    },
    keys: {
      arity: 0,
      fn: (_args, ctx) => ({ tag: 'list', items: [...ctx.heldKeys()].map((id) => ({ tag: 'key', id })) }),
    },
    repel: {
      arity: 0,
      fn: (_args, ctx) => { ctx.repelNearby(); return { tag: 'unit' }; },
    },
    sing: {
      arity: 0,
      fn: (_args, ctx) => { ctx.sing(); return { tag: 'unit' }; },
    },
    map: {
      arity: 0,
      fn: (_args, ctx) => { ctx.showMap(); return { tag: 'unit' }; },
    },
    // `print <topic>` at an obelisk: `print map` runs off a carryable map;
    // `print aikey` stamps a fresh physical AI key at your feet (you must be
    // holding one — a spare against losing it). The HERMES relay overrides
    // `print` to take a document topic (see makeBuiltins).
    print: {
      arity: 1,
      fn: ([topic], ctx) => {
        const raw = topic && (topic.kind === 'aikey' ? 'aikey' : (topic.id || '')) || '';
        const name = String(raw).toLowerCase();
        if (name === 'aikey' || name === 'key') ctx.printKey();
        else if (name === 'map' || name === 'territory') ctx.printMap();
        else throw new RonmlError('print needs a topic — try: print map   or   print aikey');
        return { tag: 'unit' };
      },
    },
    // `copy aikey`: read the AI key you physically hold and bind it into the
    // session under the name you gave (usually `aikey`), so the rest of the
    // language can use it — the bridge from your pack to the console. Returns a
    // SEALED AI-key value; `decrypt` opens it. Fails if you hold no AI key.
    copy: {
      arity: 1,
      fn: ([what], ctx) => {
        // Polymorphic on the first argument.
        //  - a FILE (foo.ml)      -> `copy <file> <device>`: a partial bound to
        //    COPY_FILE that the next atom (the device) completes.
        //  - `aikey`/`card`/`key` -> the classic key-bind: bind the held AI key
        //    into the session as a sealed token for decrypt/unlock.
        //  - any OTHER bare word  -> a filename someone typed without its
        //    extension (players type `copy zeus_lightning card`, not
        //    `zeus_lightning.ml`): treat it as a file too, and let COPY_FILE + the
        //    fs resolve the extension. Forgiving beats a misleading error.
        if (what && what.tag === 'file') {
          return { tag: 'fn', name: 'copy', builtin: COPY_FILE, args: [what], ctx };
        }
        // The name may already be BOUND in the session — a previous `copy aikey`
        // or `copy card` binds `aikey`, so the SECOND `copy aikey` resolves the
        // bound key TOKEN, not the literal word, and used to fall through to a
        // baffling "copy what?" (while `copy card`, unbound, still worked). Accept
        // an already-sealed AI-key token and just re-affirm it.
        if (what && what.tag === 'key' && what.kind === 'aikey') {
          if (!ctx.hasAiKey || !ctx.hasAiKey()) {
            throw new RonmlError('nothing to copy — you are not holding an AI key. (a wrecked W-factory drops one.)');
          }
          const token = { tag: 'key', kind: 'aikey', enc: true };
          if (ctx.bindSession) ctx.bindSession('aikey', token);
          return token;
        }
        const id = (what && what.id ? String(what.id) : '').toLowerCase();
        if (id === 'aikey' || id === 'card' || id === 'key') {
          if (!ctx.hasAiKey || !ctx.hasAiKey()) {
            throw new RonmlError('nothing to copy — you are not holding an AI key. (a wrecked W-factory drops one.)');
          }
          const token = { tag: 'key', kind: 'aikey', enc: true };
          if (ctx.bindSession) ctx.bindSession(id === 'key' ? 'aikey' : id, token);
          return token;
        }
        if (id) {
          return { tag: 'fn', name: 'copy', builtin: COPY_FILE, args: [{ tag: 'file', name: id }], ctx };
        }
        throw new RonmlError('copy what? — try: copy <file> <drive>   or   copy aikey');
      },
    },
    // `cd <device>` / `ls`: the RON-DOS drive navigation. Devices are the AI key
    // you hold (cd aikey / cd card), the obelisk's scratch bench (cd ob), and a
    // HERMES relay's folder (cd hermes). `ls` lists the current device's files.
    // ctx supplies cd/ls (main.js) — where the file state actually lives.
    cd: {
      arity: 1,
      fn: ([dev], ctx) => {
        const name = (dev && (dev.id || dev.name)) ? String(dev.id || dev.name).toLowerCase() : '';
        if (!name) throw new RonmlError('cd needs a drive — try: cd card  ·  cd ob  (drives lists them)');
        if (!ctx.cd) throw new RonmlError('no drives at this terminal.');
        const r = ctx.cd(name);
        if (!r || !r.ok) throw new RonmlError((r && r.msg) || `no drive '${name}' here — try: drives`);
        return r.label ? { tag: 'node', id: `» ${r.label}` } : { tag: 'unit' }; // echo which drive + card state
      },
    },
    // `drives`: list the drives attached here (ob / card / hermes) and, crucially,
    // the card's CURRENT name — so you can always tell what state it's in.
    drives: {
      arity: 0,
      fn: (_args, ctx) => {
        if (!ctx.drives) throw new RonmlError('no drives at this terminal.');
        ctx.drives();
        return { tag: 'unit' };
      },
    },
    ls: {
      arity: 0,
      fn: (_args, ctx) => {
        if (!ctx.ls) throw new RonmlError('no drives at this terminal.');
        return { tag: 'list', items: (ctx.ls() || []).map((n) => ({ tag: 'file', name: n })) };
      },
    },
    // `save`: write a checkpoint you can load from the title screen. Neutral,
    // so it works at an obelisk, a HERMES relay and the NostBook alike — a
    // terminal is a machine you are logged into, and writing your position to
    // one is a thing terminals are for. The host decides where it can be
    // written from and says so (task #93); the language only asks.
    save: {
      arity: 0,
      fn: (_args, ctx) => {
        if (!ctx.saveGame) throw new RonmlError('nothing to save from this terminal.');
        ctx.saveGame();
        return { tag: 'unit' };
      },
    },
    // `saveas "name"`: the same write with a label on it. Separate from `save`
    // rather than an optional argument because this language has no optional
    // arguments — a verb has one arity — and `save` on its own has to keep
    // working, since it is in the manual and in three help pages.
    saveas: {
      arity: 1,
      fn: ([what], ctx) => {
        if (!ctx.saveGame) throw new RonmlError('nothing to save from this terminal.');
        ctx.saveGame(what && what.v !== undefined ? what.v : what && what.name);
        return { tag: 'unit' };
      },
    },
    // `fetch <addr>` — read a unit's served program off the network, as a
    // string, so a program can decide on what a machine reports about itself:
    //   if String.isSubstring "FAULTED" (fetch "10.3.4.7") then post ...
    // Returns "" when there is nothing to read, so `fetch addr <> ""` is a
    // reachability test rather than a fault. Laptop-only — a unit in a field
    // does not call the network — and the read half of the same wire `post`
    // writes on (main.js getResource).
    fetch: {
      arity: 1,
      fn: ([addr], ctx) => {
        if (!ctx.fetchResource) throw new RonmlError('no network on this machine.');
        const a = addr && (addr.v != null ? addr.v : addr.id != null ? addr.id : addr.name);
        return { tag: 'str', v: String(ctx.fetchResource(String(a || ''))) };
      },
    },
    // `decrypt aikey`: turn a sealed AI key (from `copy`) into the open token
    // `unlock` needs. The AI encrypts its own masters out of habit; this undoes it.
    decrypt: {
      arity: 1,
      fn: ([k], ctx) => {
        if (!k || k.tag !== 'key' || k.kind !== 'aikey') {
          throw new RonmlError('decrypt needs the AI key. copy it in first: copy aikey');
        }
        return { tag: 'key', kind: 'aikey', enc: false };
      },
    },
    // `echo`: PRINT a value — ML's `print`. It emits to the run's output buffer as a
    // side effect (mid-evaluation, so a recursive `echo n ; go (n-1)` prints every
    // step as it counts) and returns unit, not the string. runRonml/runStar join the
    // buffer with the final value for display.
    //
    // The buffer is module-level (OUT), deliberately NOT hung off `ctx`: a closure
    // captures the ctx of the line that DEFINED it, and the hub builds a fresh ctx
    // per command, so `let f = fn x => echo x` on one line and `f "hi"` on the next
    // pushed into the previous line's dead buffer and printed nothing.
    // ---- taking a list apart ------------------------------------------
    // The language could make lists from the day it had `scan`, and could do
    // nothing with one: a program could be handed a list and had no way in.
    // These three close that, and they are the language's own rather than any
    // station's, so a robot's program can use them with no network at all.
    // Deliberately not `map`/`filter`: with recursion these are enough to
    // write those yourself, which is the sort of thing this machine is for.
    // ---- the little that stands in for a standard library ------------
    // A machine with no floating-point unit and no printer does not get one,
    // but these five come up in every worked example and cost nothing.
    // int and real do not mix, so there have to be ways across.
    // characters
    // WHAT THE CARD CAN HEAR. Not the control wire — this is the NostBook's own
    // wireless card reading traffic off the air, the same table `arp -a` prints.
    // A machine broadcasts to its tower whether or not anyone is listening, so
    // listening costs nothing and gives itself away to nobody.
    units: {
      arity: 0,
      fn: (_args, ctx) => ({
        tag: 'list',
        items: ((ctx && ctx.units && ctx.units()) || []).map((u) => ({
          tag: 'record',
          fields: {
            name: { tag: 'str', v: String(u.name) },
            range: { tag: 'int', v: Number(u.range) || 0 },
            bearing: { tag: 'str', v: String(u.bearing) },
            kind: { tag: 'str', v: String(u.kind || '?') },
          },
        })),
      }),
    },
    // A cell whose contents can be replaced. The only mutable thing here.
    // ---- a machine's own senses (docs/robot-programs-plan.md §2) ----------
    // Nullary builtins reading the unit's state off ctx.sense. Functions, not
    // fields, so the language needs no records and no `.` accessor — and being
    // station-scoped means a unit's program cannot reach the network by mistake.
    charge: SENSE('charge', 'num'),
    integrity: SENSE('integrity', 'num'),
    range: SENSE('range', 'num'),
    home_range: SENSE('home_range', 'num'),
    threat: SENSE('threat', 'bool'),
    hurt: SENSE('hurt', 'bool'),
    linked: SENSE('linked', 'bool'),
    blight: SENSE('blight', 'bool'),
    daylight: SENSE('daylight', 'bool'),
    // A working machine's own trade: true when its toolhead sees a job in range
    // — a repairable tower for a W-3, plantable ground or blight for a W-5.
    work: SENSE('work', 'bool'),
    // ---- fire control (P8) ----------------------------------------------
    // The level below `hunt`. A machine that carries a weapon has to know
    // whether it can see the target, whether it is loaded, whether the target
    // is behind something, whether it is being touched, and how long it has
    // been looking without finding anything.
    sight: SENSE('sight', 'bool'),
    armed: SENSE('armed', 'bool'),
    shielded: SENSE('shielded', 'bool'),
    contact: SENSE('contact', 'bool'),
    lost_for: SENSE('lost_for', 'num'),
    // ---- V-class courier senses (#127) ----------------------------------
    // A courier has to know whether it is carrying a cell and how far the
    // nearest flat machine is. On every chassis: a sense a unit does not have
    // reads false or 24 rather than faulting a program that asks for it.
    cargo: SENSE('cargo', 'bool'),
    casualty_range: SENSE('casualty_range', 'num'),
    // ---- a TOWER's senses (docs/machine-braincode-plan.md §2) -------------
    // An obelisk reads the world differently from a unit: it does not move, so
    // it has no range to home and no hull to worry about. It knows whether
    // there is a person at its foot, how sure it is, whether one of its own is
    // at the plinth wanting charge, and how many of its own are left standing.
    alert: SENSE('alert', 'num'),
    docked: SENSE('docked', 'bool'),
    garrison_size: SENSE('garrison_size', 'num'),
    // ---- a machine's own EFFECTS ----------------------------------------
    // Sensors read; these do. They are not intents: a program still evaluates
    // to exactly one intent, and these happen along the way, exactly like
    // `echo` at a console. `beep ; if threat then hunt else patrol` sounds the
    // buzzer and then decides, and because they sit inside branches, a unit can
    // be made to announce only the thing you care about:
    //     if threat then (beep ; eye "white" ; hunt) else patrol
    // The engine collects them (decide returns them) and is free to refuse:
    // beeping is rate-limited and inaudible from across the island.
    // `move dx dy` — a LOGO order, not a sensor and not an intent: it queues one
    // relative-tile leg onto the same ordered channel as the lamp effects. It
    // means anything only when the program returns the `route` intent, which
    // tells the engine to walk the queue a leg at a time. Negative is the
    // language's own tilde: `move 3 ~1`, because `move 3 -1` is subtraction.
    move: {
      arity: 2,
      fn: ([dx, dy]) => {
        const x = Math.trunc(Number(dx && dx.v)), y = Math.trunc(Number(dy && dy.v));
        if (!Number.isFinite(x) || !Number.isFinite(y)) throw new RonmlError('move takes two whole numbers of tiles: move 3 ~1');
        if (Math.abs(x) > ROUTE_MAX_LEG || Math.abs(y) > ROUTE_MAX_LEG) {
          throw new RonmlError(`move: a leg is at most ${ROUTE_MAX_LEG} tiles each way`);
        }
        if (EFFECTS && EFFECTS.length >= ROUTE_MAX_ORDERS) {
          throw new RonmlError('route too long — the machine cannot hold it');
        }
        if (EFFECTS) EFFECTS.push({ k: 'move', dx: x, dy: y });
        return { tag: 'unit' };
      },
    },
    beep: EFFECT('beep', 0, () => ({})),
    eye: EFFECT('eye', 1, ([c]) => {
      const name = String(c && c.v != null ? c.v : c && c.id != null ? c.id : '').toLowerCase();
      if (!LAMP_COLOURS.includes(name)) {
        throw new RonmlError(`no such lamp colour: ${name || '?'} — try ${LAMP_COLOURS.join(' · ')}`);
      }
      return { colour: name };
    }),
    flash: EFFECT('flash', 1, ([n]) => {
      const hz = Number(n && n.v);
      if (!Number.isFinite(hz) || hz < 0 || hz > 10) throw new RonmlError('flash takes a rate from 0 to 10 (0 is steady)');
      return { hz };
    }),
    // `never <word>` — a CONSTITUTIONAL CLAUSE. Not an intent and not a sensor:
    // a standing prohibition that sits above whatever the program decides, and
    // binds the chassis reflexes too. The machine cannot choose the forbidden
    // word, and cannot fall back into it when its program faults. Written at the
    // top of a program, before the first `;`, so it holds unconditionally — that
    // is the taught idiom (see robots_code/intents.txt).
    never: EFFECT('never', 1, ([w]) => {
      const word = String(w && w.v != null ? w.v : w && w.id != null ? w.id : '').toLowerCase();
      if (!NEVER_CLAUSES.includes(word)) {
        throw new RonmlError(`never takes ${NEVER_CLAUSES.join(' or ')} — '${word || '?'}' is not something a constitution can forbid`);
      }
      return { word };
    }),
    // `timer`: how long until POSEIDON comes online — a free read off the network
    // clock, so you can pace the run from the console.
    timer: {
      arity: 0,
      fn: (_args, ctx) => {
        if (!ctx.poseidonTimer) throw new RonmlError('no clock on this wire.');
        return { tag: 'node', id: ctx.poseidonTimer() };
      },
    },
    // `name`: the code of the obelisk you are jacked into — a free read, so you
    // can see which node you're on without scrolling the boot banner.
    name: {
      arity: 0,
      fn: (_args, ctx) => {
        const id = ctx.currentNode && ctx.currentNode();
        if (!id) throw new RonmlError('no node here.');
        return { tag: 'node', id };
      },
    },
    // `tag <node> "label"` — hang a short operator label on a unit or tower so
    // four identical T-1s can be told apart on the wire. The label rides the
    // broadcast name: arp, the sniffer and the unit's own page all read it back,
    // which is how you tell which one to post the program to. `tag <node> ""`
    // clears it. The host decides what a label may touch (ctx.tagNode).
    tag: {
      arity: 2,
      fn: ([node, label], ctx) => {
        if (!node || node.tag !== 'node') throw new RonmlError('tag needs a node — try: tag t1_03 "hunter"');
        if (!label || label.tag !== 'str') throw new RonmlError('tag needs a label in quotes — try: tag t1_03 "hunter"  (or "" to clear)');
        if (!ctx.tagNode) throw new RonmlError('no tagging from this console.');
        const r = ctx.tagNode(node.id, label.v);
        if (!r || !r.ok) throw new RonmlError((r && r.text) || `cannot tag ${node.id}`);
        return { tag: 'str', v: r.text };
      },
    },
    // Opens the browsable notepad overlay (ctx.showNotepad, main.js) rather
    // than printing to the console — a real page you flip through, not a
    // wall of scrollback.
    // (The `notes` verb was removed from the console — press N for the notepad.)
    // ELIZA has two faces. Bare `eliza` / `run eliza` opens the 1966 DOCTOR as
    // an interactive chat — that is intercepted in the REPL (main.js), not here,
    // since it is a mode, not a value. `eliza <file>` is the TRANSFORM: feed a
    // file through the DOCTOR's reflection and get a new file back. On the
    // factory's id line (`I am W-FACTORY, my keys are mine`) the my->your
    // reflection turns the boast into a grant — root_access.ml. (Calypso escape
    // chain, docs/calypso-escape-chain.md.)
    eliza: {
      arity: 1,
      fn: ([file], ctx) => {
        if (!file || file.tag !== 'file') {
          throw new RonmlError('eliza needs a file to transform — try: eliza factory_id.ml  (or `eliza` alone to talk to the DOCTOR)');
        }
        if (!ctx.elizaTransform) throw new RonmlError('no ELIZA image on this node.');
        const r = ctx.elizaTransform(file.name);
        if (!r || !r.ok) throw new RonmlError((r && r.msg) || `ELIZA can do nothing with ${file.name}.`);
        return { tag: 'file', name: r.out };
      },
    },
    // `retire` (R3): the refunction. Stand the fortress guards down — they become
    // gardeners instead of hunters, and the keeper's hold on the tide breaks.
    //
    // IT USED TO BE ONE WORD, arity 0, at any obelisk on any island: the largest
    // turn in the game typed in six letters, and typed on POLYPHEMUS it retired
    // HIS guards while setting CALYPSO's flag, because refunctionCalypso reads
    // the world you are standing in. It is a program now, and the host decides
    // where a program may run (ctx.retire is only supplied on her island).
    //
    // The shape of it is the argument. She is the keeper; her whole operation is
    // a function that takes a departure and gives back a stay. So she does not
    // take a command — she takes a REPLACEMENT for that function, and she tries
    // it before she accepts it: three probes, and it has to give each one back
    // unchanged. Anything else keeps something, which is what she already does.
    //
    //   retire (decrypt aikey) (fn x => x)
    //
    // Nothing here is a magic word. The key has to be open (`decrypt`), which
    // means the card has to be aboard; the function has to be a function, and it
    // has to behave. `fn x => x` is not the password — it is the only thing that
    // passes the test, and a player who understands why has understood the game.
    retire: {
      arity: 2,
      fn: ([k, f], ctx) => {
        if (!ctx.retire) throw new RonmlError('nothing to retire from this terminal.');
        if (!k || k.tag !== 'key' || k.kind !== 'aikey') {
          throw new RonmlError('retire wants the AI key first:  retire (decrypt aikey) (fn x => x)');
        }
        if (k.enc) throw new RonmlError('the key is still sealed. Open it:  retire (decrypt aikey) (fn x => x)');
        const t = f && f.tag;
        if (t !== 'closure' && t !== 'builtin' && t !== 'confn' && t !== 'select') {
          throw new RonmlError('retire wants a FUNCTION to put in place of her keeping — she keeps you, '
            + 'so give her a keeping that gives you back:  retire (decrypt aikey) (fn x => x)');
        }
        // Her test, run on the spot: hand it three departures and see whether
        // each one comes back as it went out.
        const probes = [{ tag: 'int', v: 0 }, { tag: 'int', v: 7 }, { tag: 'int', v: -3 }];
        for (const p of probes) {
          let out;
          try { out = applyValue(f, p); } catch (e) {
            throw new RonmlError(`she runs it once and it fails: ${(e && e.message) || 'error'}. `
              + 'A keeping that throws is still a keeping.');
          }
          if (!out || out.tag !== 'int' || out.v !== p.v) {
            throw new RonmlError(`she hands it ${p.v} and gets back ${describeValue(out)}. `
              + 'That is a keeping, not a release — it has to give back exactly what it is given.');
          }
        }
        ctx.retire();
        return { tag: 'unit' };
      },
    },
    // ---- HERMES station verbs (RON hilltop relays only) ------------------
    // RON tech is off-grid on purpose: no network verb (touching the wire would
    // give the relay away). It is the human record — read it, print a copy — AND
    // a maker's bench that forges only from what you carry in (see `forge`), so
    // the no-wire rule holds while the relay still arms Zeus's command. (A HERMES
    // `print` is added in makeBuiltins below, so it can take a topic; the
    // obelisk's own arity-0 `print` maps the network.)
    read: {
      arity: 1,
      fn: ([topic], ctx) => {
        // Accept a doc topic (read history) or a file (read readme.md) — file
        // values carry .name, topics come through as .id/node.
        const name = topic && (topic.name || topic.id || '') || '';
        ctx.read(String(name).toLowerCase());
        return { tag: 'unit' };
      },
    },
    // `get <file>` / `sz <file>` — pull a readable file off the tower you are
    // jacked into, down the telnet link, into the NostBook's /home. `sz` is the
    // same command by its zmodem name. Telnet itself never moved files; you ran
    // a transfer over the open connection, and this is that transfer.
    get: {
      arity: 1,
      fn: ([f], ctx) => {
        const name = f && (f.name || f.id || (f.tag === 'str' ? f.v : '')) || '';
        if (!ctx.pullFile) throw new RonmlError('no file transfer at this console — get pulls a file down a telnet link.');
        return { tag: 'str', v: ctx.pullFile(String(name)) };
      },
    },
    // #141 — the other direction. `get` pulls a file off the tower; `upload`
    // pushes one INTO the net the tower belongs to. It exists for permission.ml
    // and it is deliberately not a general write: a tower takes a document, it
    // does not take a filesystem.
    upload: {
      arity: 1,
      fn: ([f], ctx) => {
        const name = f && (f.name || f.id || (f.tag === 'str' ? f.v : '')) || '';
        if (!ctx.uploadFile) throw new RonmlError('nothing to upload into from here — upload pushes a document into the tower net.');
        return { tag: 'str', v: ctx.uploadFile(String(name)) };
      },
    },
    sz: {
      arity: 1,
      fn: ([f], ctx) => {
        const name = f && (f.name || f.id || (f.tag === 'str' ? f.v : '')) || '';
        if (!ctx.pullFile) throw new RonmlError('no file transfer at this console — sz sends a file down a telnet link.');
        return { tag: 'str', v: ctx.pullFile(String(name)) };
      },
    },
    // `forge zeus_virus.ml` (HERMES relay): arm the sealed payload with the two
    // credentials on your Trojan card -> zeus_lightning.ml on the relay bench.
    // The relay stays off the wire; it forges only from what you carry in.
    forge: {
      arity: 1,
      fn: ([file], ctx) => {
        if (!file || file.tag !== 'file') throw new RonmlError('forge needs the payload file — try: forge zeus_virus.ml');
        if (!ctx.forge) throw new RonmlError('nothing to forge at this terminal.');
        const r = ctx.forge(file.name);
        if (!r || !r.ok) throw new RonmlError((r && r.msg) || `can't forge ${file.name}.`);
        return { tag: 'file', name: r.out };
      },
    },
    // Lists the human knowledge this relay still holds — RON kept it alive when
    // the machines were deleting it.
    archive: {
      arity: 0,
      fn: (_args, ctx) => { ctx.archive(); return { tag: 'unit' }; },
    },
    // Pull the next of RON's own field records off the relay mesh into your
    // Scrapbook — the half of the record RON kept on its relays, not in caches.
    records: {
      arity: 0,
      fn: (_args, ctx) => { ctx.records(); return { tag: 'unit' }; },
    },
    // Override a nearby machine and see through its eyes — RON turning the
    // enemy's own units. You drive it until it leaves the relay's short range
    // or you trip its self-destruct.
    drive: {
      arity: 0,
      fn: (_args, ctx) => { ctx.drive(); return { tag: 'unit' }; },
    },
    // `backup aikey` / `restore aikey`: RON's relays keep a copy of your AI key
    // off the AI's hardware, so losing it (death, a fumble) needn't cost you the
    // endgame. The `aikey` word is the thing being backed up; its value is not
    // needed (the check is whether you physically hold / have backed up a key).
    backup: {
      arity: 1,
      fn: (_args, ctx) => { ctx.backup(); return { tag: 'unit' }; },
    },
    restore: {
      arity: 1,
      fn: (_args, ctx) => { ctx.restore(); return { tag: 'unit' }; },
    },
    nearest: {
      arity: 1,
      fn: ([list], ctx) => {
        if (!list || list.tag !== 'list') throw new RonmlError('nearest needs a list — try: scan |> nearest');
        if (!list.items.length) throw new RonmlError('nothing in range to pick from');
        let best = null, bestD = Infinity;
        for (const item of list.items) {
          if (item.tag !== 'node') throw new RonmlError('nearest only works on a list of nodes');
          const d = ctx.distanceToNode(item.id);
          if (d < bestD) { bestD = d; best = item; }
        }
        return best;
      },
    },
    hack: {
      arity: 1,
      fn: ([node], ctx) => {
        if (!node || node.tag !== 'node') throw new RonmlError('hack needs a node — try: hack OB_XXXX');
        // No AI key needed to hack a node's own key — the access chip that got
        // you into this console is enough. crash therefore needs no AI key
        // either (it only wants the key hack hands back). The AI key still
        // gates the sharper verbs (sleep/rewind/repel) and the fortress unlock.
        if (!ctx.nodeExists(node.id)) throw new RonmlError(`no node ${node.id} on the wire`);
        ctx.recordHack(node.id);
        return { tag: 'key', id: node.id };
      },
    },
    crash: {
      arity: 2,
      fn: ([node, key], ctx) => {
        if (!node || node.tag !== 'node') throw new RonmlError('crash needs a node first — try: crash OB_XXXX k');
        const label = node.id || 'OB_XXXX';
        if (!key || key.tag !== 'key' || key.id !== node.id) {
          throw new RonmlError(`crash needs ${label}'s own key. try: let k = hack ${label} in crash ${label} k`);
        }
        if (!ctx.nodeExists(node.id)) throw new RonmlError(`${label} is already dark`);
        ctx.crashNode(node.id);
        return { tag: 'unit' };
      },
    },
    // The easy way in: one word, one node, no key. Pins an infinite loop
    // into the node instead of physically felling it — it and its garrison
    // freeze where they stand, burning CPU, until a repair drone eventually
    // resets it. Weaker than crash (nothing is destroyed, and it self-heals
    // on its own schedule) but far cheaper to pull off.
    loop: {
      arity: 1,
      fn: ([node], ctx) => {
        if (!node || node.tag !== 'node') throw new RonmlError('loop needs a node — try: loop OB_XXXX');
        const label = node.id || 'OB_XXXX';
        if (!ctx.nodeExists(node.id)) throw new RonmlError(`no node ${label} on the wire`);
        if (ctx.nodeFrozen(node.id)) throw new RonmlError(`${label} is already looping — it needs a repair drone, not a second one`);
        ctx.loopNode(node.id);
        return { tag: 'unit' };
      },
    },
    sleep: {
      arity: 1,
      fn: ([num], ctx) => {
        if (!num || num.tag !== 'num') throw new RonmlError('sleep needs a number of minutes — try: sleep 30');
        ctx.sleepNearby(num.v);
        return { tag: 'unit' };
      },
    },
    // Claws hours back off the POSEIDON deadline — the resistance's own clock
    // sabotage, buying more time before the towers link up for the purge.
    // Only meaningful before the purge starts; once POSEIDON is actually live
    // the deadline clock isn't running anymore, so ctx reports back if so.
    rewind: {
      arity: 1,
      fn: ([num], ctx) => {
        if (!num || num.tag !== 'num') throw new RonmlError('rewind needs a number of hours — try: rewind 3');
        if (ctx.skylinkActive()) throw new RonmlError('POSEIDON is already live — the deadline clock isn\'t running anymore. Knock towers dark instead.');
        ctx.rewindClock(num.v);
        return { tag: 'unit' };
      },
    },
    // Extract a fortress key from the network using a node key you hacked — the
    // program that actually earns its keep: `let k = hack OB_XXXX in unlock k`.
    // The argument must be a key from hack; it drops a single fortress key.
    // `unlock k d`: the endgame program. `k` is a key hacked off a live node
    // (`hack`), `d` is the DECRYPTED AI key (`copy aikey` then `decrypt aikey`).
    // Both together drop a fortress key; either alone is refused with a hint.
    // FOG. The purge's fog is one number the renderer reads; this pins it until
    // the world takes it back, which it does as the towers fall.
    fog: {
      arity: 2,
      fn: ([level, dec], ctx) => {
        requireClean(dec, 'fog');
        const how = settingOf(level, 'fog', ['high', 'low', 'clear']);
        ctx.setFog(how);
        return { tag: 'unit' };
      },
    },
    // POSEIDON, up or down, and DOWN is the one anybody wants: it takes the
    // purge offline, so the towers stop pooling sight and the blight stops
    // spreading. Temporary — the purge is the clock, and a verb that stopped it
    // for good would stop the game.
    poseidon: {
      arity: 2,
      fn: ([state, dec], ctx) => {
        requireClean(dec, 'poseidon');
        const how = settingOf(state, 'poseidon', ['up', 'down']);
        ctx.setPurge(how === 'up');
        return { tag: 'unit' };
      },
    },
    // ROBOTS, in reach, for a while. OFF is `sleep` without the arithmetic; ON
    // wakes them early, and they are cross about it.
    robots: {
      arity: 2,
      fn: ([state, dec], ctx) => {
        requireClean(dec, 'robots');
        const how = settingOf(state, 'robots', ['on', 'off']);
        ctx.setRobots(how === 'on');
        return { tag: 'unit' };
      },
    },
    // The shared-sight NET, cut without felling anything. Stepping into one
    // tower's view turns every hunter that can reach you; this stops that.
    //
    // Called `net` and not `sight`: `sight` is one of a machine's own senses
    // (MACHINE_ONLY below), and a verb of that name shadowed the sensor —
    // three fire-control tests went red and named it straight away.
    net: {
      arity: 2,
      fn: ([state, dec], ctx) => {
        requireClean(dec, 'net');
        const how = settingOf(state, 'net', ['on', 'off']);
        ctx.setSharedSight(how === 'on');
        return { tag: 'unit' };
      },
    },
    // Every blight front frozen where it stands. Felling a tower already does
    // this for its own front; this does it for all of them at once.
    //
    // `spread` and not `blight`, for the same reason `net` is not `sight`: a
    // machine's own senses include `blight`, and a verb of that name shadowed
    // it. Second time in one change; there is a test below that walks both
    // lists now so there is not a third.
    spread: {
      arity: 2,
      fn: ([state, dec], ctx) => {
        requireClean(dec, 'spread');
        const how = settingOf(state, 'spread', ['stop', 'go']);
        ctx.setBlight(how === 'go');
        return { tag: 'unit' };
      },
    },
    // EXPLORER. The machines' own browser, on their own hardware. No key: the
    // chip that got you in is enough to READ, as it always has been. It takes
    // an optional address, as `netscape` does on the laptop.
    explorer: {
      arity: 0,
      fn: (_args, ctx) => { ctx.openExplorer(null); return { tag: 'unit' }; },
    },
    unlock: {
      arity: 2,
      fn: ([key, dec], ctx) => {
        if (!key || key.tag !== 'key' || key.kind === 'aikey') {
          throw new RonmlError('unlock needs a hacked node key first. try: let k = hack OB_XXXX in unlock k d');
        }
        if (!dec || dec.tag !== 'key' || dec.kind !== 'aikey') {
          throw new RonmlError('unlock needs the AI key too. copy it in and decrypt it: copy aikey  then  let d = decrypt aikey');
        }
        if (dec.enc !== false) {
          throw new RonmlError('that AI key is still sealed. decrypt it first: let d = decrypt aikey');
        }
        ctx.unlock(key.id);
        return { tag: 'unit' };
      },
    },
  };
  // The obelisk (TIRESIAS) and the HERMES relay are two different systems, each
  // with its own commands — not one language that refuses half its verbs. So we
  // hand back only the verbs that belong to the station you're at. A verb from
  // the other system simply isn't a command here (see evalNode's unknown path).
  // Neutral verbs (notes; help/let are handled outside this table) belong to
  // both. A station-less caller (tools/tests) gets everything.
  for (const k of OB_VERBS) if (B[k]) B[k].station = 'ob';
  for (const k of HERMES_VERBS) if (B[k]) B[k].station = 'hermes';
  // A unit's senses and service verbs belong to the unit. Untagged, they fell
  // through to every console below — you could ask an obelisk for its `charge`
  // and be told 0, or type `beep` at a relay and have it quietly succeed. They
  // are tagged here so those consoles say plainly that this is not their verb.
  // (`not` and `echo` are in ROBOT_VERBS too and stay neutral: they belong to
  // the language, not to any one machine.)
  for (const k of MACHINE_ONLY) if (B[k]) B[k].station = 'robot';
  // `read` belongs to BOTH consoles: the relay's docs and the tower's
  // maintenance store. A verb can name more than one station, and the filter
  // below reads the list — a store you can `ls` and cannot open is not a store.
  if (B.read) B.read.station = ['ob', 'hermes'];
  if (!station) return B;
  // The laptop is the language WITHOUT the world: hand back only its own short
  // list, so no verb that needs a wire (or a drive, or a card) is even present.
  if (station === 'robot') {
    const bot = {};
    for (const k of ROBOT_VERBS) if (B[k]) bot[k] = { ...B[k], station: 'robot' };
    return bot;
  }
  if (station === 'laptop') {
    const lap = {};
    for (const k of LAPTOP_VERBS) if (B[k]) lap[k] = { ...B[k], station: 'laptop' };
    return lap;
  }
  const out = {};
  for (const k of Object.keys(B)) {
    const tag = B[k].station;
    if (!tag || tag === station || (Array.isArray(tag) && tag.includes(station))) out[k] = B[k];
  }
  // A HERMES relay prints DOCUMENTS, not maps — override `print` here so it
  // takes a topic (`print fortress`). The obelisk keeps its own arity-0 `print`.
  if (station === 'hermes') {
    out.print = {
      arity: 1, station: 'hermes',
      // A topic is normally an atom (`print history`), but the membership check
      // wants four digits, and 3689 lexes as an INT and not an atom. Reading
      // only `.id` turned the code into the empty string and the relay answered
      // `No document "?"` — a true statement about a document and no use at all
      // to somebody typing a code it had just texted them.
      fn: ([topic], ctx) => {
        const t = topic && (topic.id != null ? topic.id
          : topic.v != null ? topic.v
          : topic.name != null ? topic.name : '');
        ctx.printDoc(String(t || '').toLowerCase());
        return { tag: 'unit' };
      },
    };
  }
  return out;
}

// Which verbs belong to which system. Used to filter each terminal's builtins,
// and to tell "not a command here" (a real verb, wrong system) apart from a
// plain bad word.
// `copy`, `cd`, `ls`, `save` are deliberately NOT listed here — they are neutral
// (work at both an obelisk and a HERMES relay). A verb tagged for one station is
// refused at the other; the file verbs must move files at either terminal, and
// `save` must write a checkpoint from whichever one you are logged into.
const OB_VERBS = ['upload', 'play', 'post', 'ls', 'scan', 'garrison', 'soul', 'nearest', 'keys', 'name', 'tag', 'timer', 'echo', 'not', 'hack', 'crash', 'loop', 'sleep', 'rewind', 'repel', 'sing', 'map', 'print', 'decrypt', 'unlock', 'eliza', 'retire', 'read', 'get', 'sz',
  // The control verbs, all of which want a decrypted AI key.
  'fog', 'poseidon', 'robots', 'net', 'spread', 'explorer'];
// Note: HERMES's `print` is added as an override in makeBuiltins (it takes a
// topic), not tagged here — tagging it would steal the obelisk's own arity-0
// `print`. `print` is already in OB_VERBS, so ALL_VERBS still covers it.
const HERMES_VERBS = ['read', 'archive', 'records', 'drive', 'backup', 'restore', 'forge'];
// The LAPTOP is off the network by design (docs/laptop-plan.md), so it carries no
// station verbs at all — only `echo` and the language core (let / fn / if /
// arithmetic / `;` / recursion), which is exactly what makes it a place to LEARN
// the language rather than perform it under fire. A tower verb typed here is not a
// typo, it is a machine that isn't listening: evalNode says so and points at a tower.
// (`save` is the one exception, and it is not a network verb: it writes where
// you are standing, which this machine can do from anywhere you can open it.)
const LAPTOP_VERBS = ['echo', 'not', 'hd', 'tl', 'length', 'abs', 'sqrt', 'min', 'max', 'size',
  'real', 'floor', 'ord', 'chr', 'str', 'explode', 'implode', 'makestring', 'ref', 'units', 'save', 'saveas',
  // `readLine` is the laptop's and nowhere else's. It is the one machine on the
  // island with a person sitting at it, and a program that stops to ask for a
  // line needs somebody there to answer. A unit carrying a program that called
  // it would suspend in a field with nobody to type, which is why it is not in
  // ROBOT_VERBS and must not be added there.
  'readLine', 'fetch'];
// A MACHINE'S OWN STATION. Its program runs here: senses in, an intent out, and
// nothing else within reach — no network, no files, no console verbs. That is
// not a restriction bolted on, it is what a unit actually has.
// What a machine's own program may say. `not` and `echo` are the language's,
// not the machine's, so they are listed here but stay neutral elsewhere.
// What a constitution may forbid. Prohibitions only: they compose, where a
// positive obligation would be a second decision system competing with the
// program proper (docs/ml-constitution-plan.md).
// A constitution can forbid a word the machine would otherwise choose. The
// tower words are here too (docs/machine-braincode-plan.md §2): `never report`
// stops the spying, and `never feed` cuts a garrison off from power, which is
// the strongest single hack in the game.
export const NEVER_CLAUSES = ['hunt', 'fire', 'report', 'feed', 'call', 'lure'];

const MACHINE_ONLY = ['charge', 'integrity', 'range', 'home_range',
  'threat', 'hurt', 'linked', 'blight', 'daylight', 'work', 'beep', 'eye', 'flash', 'move', 'never',
  // Fire control (docs/robot-programs-plan.md P8). A machine that shoots needs
  // to know whether it can see, whether it is loaded, whether the target is
  // covered, whether it is being touched, and how long it has been looking.
  'sight', 'armed', 'shielded', 'contact', 'lost_for',
  // V-class courier senses (#127). On every chassis, because a sense a unit
  // does not have should read false rather than crash a program that asks.
  'cargo', 'casualty_range',
  // Tower senses. On the MACHINE_ONLY list so a unit console says plainly that
  // `docked` is not its word, and so a tower program can read them.
  'alert', 'docked', 'garrison_size'];
const ROBOT_VERBS = [...MACHINE_ONLY, 'not', 'echo', 'hd', 'tl', 'length', 'abs', 'sqrt', 'min', 'max', 'size',
  'real', 'floor', 'ord', 'chr', 'str', 'explode', 'implode', 'makestring'];
// Retired verbs kept only so typing one gives a clean "not a command" instead
// of a cryptic node error (make/ping were removed when TORs became info-only).
const RETIRED_VERBS = ['make', 'ping'];
// ROBOT_VERBS are in here too: a unit's own senses and service verbs are real
// words, so typing `beep` or `charge` at a console should say it is not a
// command HERE rather than quietly evaluating to a node id.
export { OB_VERBS, MACHINE_ONLY };
const ALL_VERBS = new Set([...OB_VERBS, ...HERMES_VERBS, ...RETIRED_VERBS, ...ROBOT_VERBS]);

// A real verb typed at the wrong machine. On the laptop that is not a mistake so
// much as the machine's whole nature — it is off the network — so say what the
// laptop IS for instead of just refusing.
function notHereMessage(name, station) {
  if (station === 'laptop') {
    return `no network on this machine. '${name}' needs a tower — practise the language here, run it there.`;
  }
  return `'${name}' isn't a command on this terminal.`;
}

// ---- The evaluator lives in src/lang/eval.js -------------------------------
//
// M2 (v1.287) moved it out. What the adapter still needs from it is imported at
// the top of this file; what the game supplies BACK to it is the host name
// hint, installed just below — the one place the evaluator used to read the
// game's verb tables directly.
// THE GAME'S BARE WORDS. An unbound name is an error in Standard ML and the
// language refuses it (v1.299). NostOS does not: its consoles pass bare words
// around as values, so `hack OB_1A2B` names a tower and `copy factory_id.ml ob`
// names a file, and neither was ever declared. The rule lives here now, where
// it belongs, rather than inside the language where every host inherited it.
// THE GAME'S OWN VALUES. A tower, a key, a file on a card: none of them is a
// feature of Standard ML, and the language used to case for their tags by name
// — `case 'key': return v.kind === 'aikey' ? 'the AI key' : …` — which put the
// AI key inside an implementation of a 1997 language standard. It asks now.
setHostValues({
  equal: (a, b) => {
    switch (a.tag) {
      case 'node': return a.id === b.id;
      case 'key': return a.kind === b.kind && a.id === b.id;
      case 'file': return a.name === b.name;
      default: return false;
    }
  },
  describe: (v) => {
    switch (v.tag) {
      case 'node': return `node ${v.id}`;
      case 'key': return v.kind === 'aikey' ? 'the AI key' : 'a key';
      case 'file': return `the file ${v.name}`;
      default: return null;
    }
  },
  format: (v) => {
    switch (v.tag) {
      case 'node': return v.id;
      case 'key': return v.kind === 'aikey' ? (v.enc === false ? 'AIKEY:open' : 'AIKEY:sealed') : `KEY:${v.id}`;
      case 'file': return v.name;
      default: return null;
    }
  },
});

setHostUnbound((name) => {
  if (/\.(ml|md)$/i.test(name)) return { tag: 'file', name };
  return { tag: 'node', id: name };
});

// THE SAME ANSWER, GIVEN TO THE CHECKER. `setHostUnbound` above tells the
// EVALUATOR what a bare word is; this tells the CHECKER that there is one to
// be had, so it does not refuse the line before the evaluator ever sees it.
// It answers true for everything because the rule above accepts everything:
// every bare word in NostOS is a node id or a filename.
//
// Both halves are needed. Teaching only the evaluator left strict mode at the
// NostBook refusing `hack OB_1A2B` with the checker's words, which is the
// week's recurring shape — one half taught, the other not.
setHostKnowsName(() => true);

setHostNameHint((name, ctx) => {
  // A real verb from the OTHER system, typed at this terminal: it just isn't a
  // command here (the two systems don't know each other). Distinct from a plain
  // node id like OB_XXXX or an atom like berries, which stay nodes.
  const lower = String(name).toLowerCase();
  if (ctx && ctx.station && ALL_VERBS.has(lower)) return notHereMessage(name, ctx.station);
  return null;
});
// design doc's "crash OB_BB05 alone -> ERR: crash needs a key..." example.
const USAGE_HINTS = {
  retire: 'retire wants an open key and a keeping:  retire (decrypt aikey) (fn x => x)',
  hack: 'hack needs a node. try: hack OB_XXXX',
  crash: "crash needs a node and its key. try: let k = hack OB_XXXX in crash OB_XXXX k",
  loop: 'loop needs a node. try: loop OB_XXXX',
  nearest: 'nearest needs a list. try: scan |> nearest',
  sleep: 'sleep needs a number of minutes. try: sleep 30',
  rewind: 'rewind needs a number of hours. try: rewind 3',
  copy: 'copy a key (copy aikey) or a file to a device (copy factory_id.ml ob)',
  cd: 'cd needs a device. try: cd aikey  ·  cd ob',
  eliza: 'eliza <file> transforms a file (eliza factory_id.ml); bare `eliza` opens the DOCTOR',
  decrypt: 'decrypt needs the AI key. try: copy aikey  then  decrypt aikey',
  // The control verbs all take a setting AND the decrypted key, so a bare
  // `fog` answered "needs more arguments" and left you guessing which two.
  fog: 'fog takes a level and the decrypted AI key. try: let d = decrypt aikey in fog HIGH d  ·  HIGH | LOW | CLEAR',
  poseidon: 'poseidon takes UP or DOWN and the decrypted AI key. try: let d = decrypt aikey in poseidon DOWN d',
  robots: 'robots takes ON or OFF and the decrypted AI key. try: let d = decrypt aikey in robots OFF d',
  net: 'net takes ON or OFF and the decrypted AI key — the towers\u2019 shared sight. try: let d = decrypt aikey in net OFF d',
  spread: 'spread takes STOP or GO and the decrypted AI key — the blight. try: let d = decrypt aikey in spread STOP d',
  unlock: 'unlock needs a hacked node key and the decrypted AI key. try: copy aikey / let k = hack OB_XXXX / let d = decrypt aikey / unlock k d',
  print: 'print needs a topic — at an obelisk: print map  or  print aikey; at a relay: print <document>',
  backup: 'backup needs a key — try: backup aikey',
  restore: 'restore needs a key — try: restore aikey',
  read: 'read needs a topic — try: read history (archive lists them)',
  forge: 'forge needs the payload — try: forge zeus_virus.ml (at a relay, Trojan card in hand)',
};

// `help` reference, shown when the operator types it at the terminal. Per-verb
// detail lines keyed by name; `sing` is deliberately omitted (it's a secret).
// Each row: [sig, type, desc, gate, station]. `station` scopes the verb to a
// terminal — 'ob' (AI obelisk / TIRESIAS), 'hermes' (RON relay), or '' for the
// verbs that work anywhere. `help` filters to the terminal you're at.
const HELP_VERBS = [
  ['scan', 'unit -> list', 'obelisks on the wire', '', 'ob'],
  ['garrison', 'unit -> str', "this tower's own units", '', 'ob'],
  ['soul n', 'node -> str', "a unit's soul document: its whole program", '', 'ob'],
  ['nearest', 'list -> node', 'the closest of a list', '', 'ob'],
  ['keys', 'unit -> list', 'the keys you hold', '', 'ob'],
  ['name', 'unit -> node', 'the node you are on', '', 'ob'],
  ['tag n "label"', 'node str -> unit', 'label a unit or tower on the wire ("" clears)', 'no key needed', 'ob'],
  ['get "file"', 'str -> str', 'pull a readable file down to the NostBook /home', 'over telnet only', 'ob'],
  ['sz "file"', 'str -> str', 'send a file to /home — get by its zmodem name', 'over telnet only', 'ob'],
  ['timer', 'unit -> node', 'time left before POSEIDON', '', 'ob'],
  ['hack n', 'node -> key', "take node n's access key", 'no key needed', 'ob'],
  ['crash n k', 'node key -> unit', 'knock n dark for a while', 'needs k from hack', 'ob'],
  ['loop n', 'node -> unit', 'freeze n and its garrison', 'no key needed', 'ob'],
  ['sleep t', 'num -> unit', 'idle local machines t minutes', 'no key needed', 'ob'],
  ['rewind t', 'num -> unit', 'claw t hours off the deadline', 'before the purge only', 'ob'],
  ['repel', 'unit -> unit', 'nearby machines turn and run', 'no key needed', 'ob'],
  ['map', 'unit -> unit', 'the territory map', '', 'ob'],
  ['explorer', 'unit -> unit', "the machines' own browser", 'no key needed', 'ob'],
  ['fog s d', 'node key -> unit', 'HIGH | LOW | CLEAR, island-wide', 'needs a decrypted AI key', 'ob'],
  ['poseidon s d', 'node key -> unit', 'UP | DOWN, the purge itself', 'needs a decrypted AI key', 'ob'],
  ['robots s d', 'node key -> unit', 'ON | OFF, everything in reach', 'needs a decrypted AI key', 'ob'],
  ['net s d', 'node key -> unit', "ON | OFF, the towers' shared sight", 'needs a decrypted AI key', 'ob'],
  ['spread s d', 'node key -> unit', 'STOP | GO, the blight', 'needs a decrypted AI key', 'ob'],
  ['print t', 'atom -> unit', 'print map, or print aikey', '', 'ob'],
  ['copy k', 'key -> key', 'bring the AI key into the session', 'hold an AI key', ''],
  ['copy f d', 'file device -> file', 'copy a file onto a drive', '', ''],
  ['cd d', 'device -> node', 'change drive', '', ''],
  ['drives', 'unit -> unit', 'what is attached here', '', ''],
  ['ls', 'unit -> list', 'files on this drive', '', ''],
  ['decrypt k', 'key -> key', 'open the sealed AI key', 'hold an AI key', 'ob'],
  ['unlock k d', 'key key -> unit', 'legacy — use a Trojan card now', 'superseded', 'ob'],
  ['eliza', 'file -> file', 'the DOCTOR, on a file or bare', '', 'ob'],
  ['retire', "key -> ('a -> 'a) -> unit", 'refunction the keeper, at her own island', 'hermes card', 'ob'],
  ['read t', 'atom -> unit', 'read a page', 'HERMES relay only', 'hermes'],
  ['print t', 'atom -> unit', 'a copy of a document — archive lists them', 'HERMES relay only', 'hermes'],
  ['print fsf', 'atom -> unit', 'an FSF card, in your name (it texts you a code)', 'HERMES relay only', 'hermes'],
  ['archive', 'unit -> unit', 'the RON archive', 'HERMES relay only', 'hermes'],
  ['records', 'unit -> unit', 'the next RON field record', 'HERMES relay only', 'hermes'],
  ['drive', 'unit -> unit', 'a drive', 'HERMES relay only', 'hermes'],
  ['backup aikey', 'key -> unit', 'keep your key off their hardware', 'HERMES relay only', 'hermes'],
  ['restore aikey', 'key -> unit', 'take your key back', 'HERMES relay only', 'hermes'],
  ['forge f', 'file -> file', 'forge a virus for this island', 'HERMES relay, Trojan card', 'hermes'],
  ['save', 'unit -> unit', 'write a checkpoint you can load', 'one slot per island', ''],
  ['saveas', 'string -> unit', 'write a checkpoint under a name you choose', 'its own slot per name', ''],
  ['help', 'unit -> unit', 'this list, or help <verb>', '', ''],
];
// `help ml` — a one-screen tour of the language itself (as opposed to `help`,
// which lists the verbs). Overview + worked examples, hello-world first.
const ML_OVERVIEW = [
  'AI-ML — a tiny functional language (Standard ML flavour).',
  '',
  '  VALUES     30    "text"    true/false    OB_1A2B (a node)    [a, b] (a list)',
  '  A COMMAND  a verb and its args:   scan    hack OB_1A2B    sleep 30',
  '  BIND       let x = e in body    (top level: bare  let x = e,  no `in`)',
  '  PIPE       scan |> nearest |> crash    (feeds left into right)',
  '  FUNCTION   fn x => e  is a lambda;   let f x = e  names one',
  '  MATH       + - * /   and   ^ (join text)',
  '  COMPARE    == != < > <= >=   give true/false',
  '  CHOOSE     if c then a else b',
  '  PRINT      echo x   emits a line as it runs;   a ; b   runs a then b',
  '  * COMMAND  *scan   *timer   *print map    (literal args, BBC-Micro style)',
  '',
  '  hello world:    echo "hello world"',
  '  a greeting:     let greet = fn name => echo ("hi " ^ name)     then   greet "world"',
  '  count down:     let go n = if n == 0 then echo "liftoff" else (echo n ; go (n - 1))',
  '                  then   go 3     prints  3 / 2 / 1 / liftoff',
  '  factorial:      let fact n = if n == 0 then 1 else n * fact (n - 1)     then   fact 5',
  '  the hack chain: let k = hack OB_1A2B in crash OB_1A2B k',
  '',
  '  type `help` for the verb list, or `help <verb>` for one verb.',
].join('\n');

// The laptop's own `help`: it has no station verbs, so listing the terminal
// reference would only advertise commands the machine hasn't got. Show the
// LANGUAGE instead — which is what this machine is for.
const LAPTOP_HELP = [
  'AI-ML — this machine is off the network, so this is the language only.',
  '',
  '  echo x            print a line',
  '  a ; b             do a, then b',
  '  let x = e         bind a value (top level: no `in` needed)',
  '  fn x => e         a function      let f x = e   names one',
  '  if c then a else b',
  '  + - * /  math     ^  join text    == != < > <= >=  compare',
  '',
  '  save              write a checkpoint (also `save` in the shell)',
  '',
  '  the tower verbs (scan, hack, crash, …) need a wire. Practise here.',
  '  type `help ml` for the full tour with worked examples.',
  '  type `quit` to leave ML and go back to the shell.',
].join('\n');

function helpText(topic, station, hasManual) {
  if (topic === 'ml' || topic === 'lang' || topic === 'language') return ML_OVERVIEW;
  if (!topic && station === 'laptop') return LAPTOP_HELP;
  if (topic) {
    const row = HELP_VERBS.find((v) => v[0].split(' ')[0] === topic);
    if (!row) return `no help for '${topic}'. try: help  ·  help ml`;
    const [sig, type, desc, gate] = row;
    return `${sig}\n  : ${type}\n  ${desc}${gate ? `\n  (${gate})` : ''}`;
  }
  // Show only the verbs that work at the terminal you're actually at — an
  // obelisk (TIRESIAS) lists the AI-network verbs, a HERMES relay lists RON's.
  const here = HELP_VERBS.filter((v) => !v[4] || !station || v[4] === station);
  const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);
  // Imperative verbs — the do-it-now commands that don't compose — are shown with
  // a leading `*` (their BBC-Micro command form). The composable ML verbs (hack,
  // crash, copy, decrypt, unlock, nearest, eliza, echo, cd/ls) stay bare, since
  // they nest in `let`/pipes/functions. Both forms still run; this just teaches the
  // split by how the reference presents them.
  const IMPERATIVE = new Set([
    'scan', 'garrison', 'soul', 'keys', 'name', 'timer', 'map', 'print', 'sleep', 'rewind', 'repel', 'sing', 'loop', 'retire',
    'read', 'get', 'sz', 'make', 'archive', 'records', 'drive', 'backup', 'restore',
    // Arity-0 and nothing comes back: `explorer` opens a window, `save` writes a
    // checkpoint, `drives` prints what is attached. They belong with `map` and
    // `print` rather than with the verbs you nest in a `let`.
    'explorer', 'save', 'saveas', 'drives',
  ]);
  // NOT here, and each for a reason worth keeping straight:
  //   crash · unlock · fog · poseidon · robots · net · spread · nearest
  //     take a value you bound earlier. A `*` command's arguments are LITERALS,
  //     so `*crash OB_1A2B k` cannot work and marking it would teach a lie.
  //   hack · decrypt · copy · cd · ls · eliza · forge
  //     hand something back, and that answer is what you came for. `forge` sat
  //     in the list above until v1.345 with the same `file -> file` signature as
  //     `eliza` beside it, marked the other way.
  // GROUPED, because twenty verbs in one column is a wall and a new player
  // reads none of it. The groups answer the question somebody actually has:
  // what can I look at, what can I do to one tower, what can I do to the whole
  // island, and what does the key buy. Anything not named falls into the last
  // group, so adding a verb can never make it vanish from the list.
  const GROUPS = [
    ['LOOK', ['scan', 'garrison', 'soul', 'nearest', 'name', 'keys', 'tag', 'timer', 'map', 'explorer']],
    ['ONE NODE', ['hack', 'crash', 'loop']],
    ['THE ISLAND — needs a decrypted AI key', ['fog', 'poseidon', 'robots', 'net', 'spread']],
    ['THE KEY', ['copy', 'decrypt', 'unlock', 'print']],
  ];
  const nameOf = (sig) => sig.split(' ')[0];
  // NO GATE TAG HERE. `[needs a decrypted AI key]` on the end of every line was
  // most of why this wrapped: the console is about 66 characters wide, and a
  // wrapped line restarts at column 0, so the whole list came apart. The gate is
  // printed by `help <verb>`, which has a screen to itself.
  const row = ([sig, , desc]) => {
    const shown = IMPERATIVE.has(nameOf(sig)) ? '*' + sig : sig;
    return `  ${pad(shown, 13)} ${desc}`;
  };
  const claimed = new Set(GROUPS.flatMap(([, names]) => names));
  const lines = [];
  for (const [label, names] of GROUPS) {
    const rows = here.filter((v) => names.includes(nameOf(v[0])));
    if (!rows.length) continue;
    lines.push('', `  ${label}`, ...rows.map(row));
  }
  const rest = here.filter((v) => !claimed.has(nameOf(v[0])));
  if (rest.length) lines.push('', '  EVERYTHING ELSE', ...rest.map(row));
  const title = station === 'hermes' ? 'HERMES reference (RON relay)' : 'AI-ML reference';
  const example = station === 'hermes'
    ? '  e.g.  read moly      make berries      archive'
    : '  e.g.  scan |> nearest\n        let k = hack OB_1A2B in crash OB_1A2B k';
  const out = [
    title,
    ...lines,
    '',
    '  THE LANGUAGE',
    '  let x = e        bind a value, for this visit',
    '  let f x = e      name a function',
    '  fn x => e        a function, unnamed',
    '  if c then a else b     a ; b   do a then b',
    '  |>  pipe    ^  join text    + - * /  math    == != < >  compare',
    example,
    '  help ml  for a tour of the language, with examples.',
  ];
  // If the player hasn't read the full manual yet, say so — this reference is
  // the short form, and the bound RON-DOS Operator's Manual is a real find
  // (teaches the language properly and unlocks console autocomplete).
  if (!hasManual) {
    out.push('', '  TIP: Read the OB Operator\'s Manual for full information.');
  }
  return out.join('\n');
}

// Runs one line of AI-ML against a world context. Returns
// {ok, text} — text is either the printed result or a "ERR: ..." message,
// always a teaching error per the design doc (never a raw stack trace).
// A `*`-command turns a tokenizer token into a LITERAL value — BBC-Micro filing
// semantics: `*print map` passes `map` as the literal topic, never evaluating it
// as the `map` verb, and `*crash OB k` would pass a literal `k`, not a binding.
function litTokenToValue(t) {
  if (t.t === 'STR') return { tag: 'str', v: t.v };
  if (t.t === 'NUM') return { tag: 'int', v: t.v };
  if (t.t === 'IDENT') return /\.(ml|md)$/i.test(t.v) ? { tag: 'file', name: t.v } : { tag: 'node', id: t.v };
  return { tag: 'node', id: String(t.v ?? t.t) };
}

// `*verb arg arg` — the BBC-style command form (see AI-ML design). The verb is a
// builtin; its arguments are LITERAL tokens, not ML expressions (no `let`, no
// pipes, no variable lookup), which is what separates a command from the ML.
function runStar(rest, ctx) {
  let toks;
  try { toks = tokenize(rest).filter((t) => t.t !== 'EOF'); }
  catch (e) { return { ok: false, text: `ERR: ${e.message}` }; }
  if (!toks.length || toks[0].t !== 'IDENT') {
    return { ok: false, text: 'ERR: a * command is a verb — try: *scan · *timer · *hack OB_XXXX · *echo "hi"' };
  }
  const verb = toks[0].v.toLowerCase();
  const builtins = makeBuiltins(ctx && ctx.station);
  const b = builtins[verb];
  if (!b) {
    if (ctx && ctx.station && ALL_VERBS.has(verb)) return { ok: false, text: `ERR: ${notHereMessage(toks[0].v, ctx.station)}` };
    return { ok: false, text: `ERR: no such command: ${toks[0].v}. type help for the list.` };
  }
  const out = [];
  setOut(out);   // so *echo prints through the same buffer as bare echo
  beginRun(ctx && ctx.fuel);
  const argVals = toks.slice(1).map(litTokenToValue);
  try {
    let v;
    if (argVals.length === 0) {
      v = b.arity === 0 ? b.fn([], ctx) : { tag: 'fn', name: verb, builtin: b, args: [], ctx };
    } else {
      let fn = { tag: 'fn', name: verb, builtin: b, args: [], ctx };
      for (const a of argVals) fn = applyValue(fn, a);
      v = fn;
    }
    if (v && v.tag === 'fn') return { ok: false, text: `ERR: ${USAGE_HINTS[verb] || `${verb} needs more arguments`}` };
    return { ok: true, text: combineOutput(out, v) };
  } catch (e) {
    if (e instanceof RonmlError) return { ok: false, text: `ERR: ${e.message}` };
    return { ok: false, text: `ERR: ${e.message || 'malformed command'}` };
  }
}

// The intents a program may choose between. The ENGINE knows how to do each of
// these already (robots.js); the program only picks. Anything else a program
// returns is a fault — a machine that asks for something it cannot do is broken,
// not creative.
export const INTENTS = ['patrol', 'hunt', 'flee', 'home', 'tend', 'wait', 'route', 'follow', 'defend'];
// A tower does not patrol or hunt (docs/machine-braincode-plan.md §2). It has
// its own repertoire, and `hold` is its `wait`. These live in the same list as
// the unit intents so `decide` needs no second code path: what a given machine
// may CHOOSE is the chassis's CAN list, which is where a tower is stopped from
// hunting and a unit from singing.
// `lure`, not `sing`: `sing` is already the obelisk console's own verb (the
// Portal easter egg), and a word cannot be a console command and an intent at
// once. `lure` is the better name for what a siren does to you regardless.
export const TOWER_INTENTS = ['watch', 'report', 'call', 'feed', 'lure', 'jam', 'hold'];
for (const w of TOWER_INTENTS) INTENTS.push(w);
// What each class of tower is allowed to answer. A SIREN sings and a standard
// tower cannot; only the eye may `call`.
export const TOWER_CAN = {
  standard: ['watch', 'report', 'feed', 'jam', 'hold'],
  eye: ['watch', 'report', 'call', 'feed', 'jam', 'hold'],
  siren: ['watch', 'report', 'feed', 'lure', 'jam', 'hold'],
};
// The most a `route` may queue in one evaluation, and how far one leg may go.
// A route that re-queues the same orders loops for ever — that is how circles
// are written — so the machine cannot be allowed to hold an unbounded list.
export const ROUTE_MAX_ORDERS = 64;
export const ROUTE_MAX_LEG = 12;

// What a program may say about its weapon, alongside what it says about its
// feet. A unit moves and shoots in the same quarter-second, so one intent per
// tick cannot describe it, which is why a program may return a pair.
export const FIRE = ['fire', 'hold', 'reload'];

// Run a machine's own program against a snapshot of its senses and get back the
// intent it chose. Pure: no world, no mutation, no clock. Returns
// {ok:true, intent} or {ok:false, fault} — and a fault is a fact about the
// machine, which the engine shows as a faulted unit rather than an error.
export function decide(program, sense, opts = {}) {
  const ctx = { station: 'robot', session: {}, sense, fuel: opts.fuel || 2000 };
  // A program is ONE expression, however many lines it is written across — an
  // if/else laid out over four lines is still a single expression, so the lines
  // are joined before evaluation. Locals come from `let … in …`, which is the
  // ML way and needs nothing added. (Comments are dropped first so a leading
  // (* … *) line cannot swallow the program.)
  const src = String(program || '')
    .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('(*'))
    .join(' ');
  if (!src) return { ok: false, fault: 'the program is empty' };
  // Effects (beep, eye, flash) are collected while the expression evaluates,
  // so only the branch actually taken has them — which is what makes them
  // useful for telling one machine from another at a distance.
  EFFECTS = [];
  const r = runRonml(src, ctx);
  const effects = EFFECTS;
  EFFECTS = null;
  if (!r.ok) return { ok: false, fault: r.text.replace(/^ERR: /, ''), effects };

  // A program returns either ONE intent, or a PAIR of what to do with its feet
  // and what to do with its weapon: `[hunt, fire]`. The pair exists because a
  // W-4 moves and shoots in the same tick and a single word cannot say that.
  const raw = String(r.text).trim();
  const pair = raw.match(/^\[\s*([a-z_]+)\s*,\s*([a-z_]+)\s*\]$/i);
  const intent = (pair ? pair[1] : raw).toLowerCase();
  const fire = pair ? pair[2].toLowerCase() : null;
  if (!INTENTS.includes(intent)) {
    // A branch that ends on an effect (eye/beep/flash) or on nothing evaluates
    // to () — the commonest program mistake — so name it as a MISSING INTENT
    // rather than reporting '()' as a verb the unit cannot do.
    if (raw === '()' || raw === '') {
      return { ok: false, fault: 'MISSING INTENT: a program must end with an intent (patrol, hunt, home, flee, wait, ...). This branch ran to (), an effect like eye/beep/flash or nothing. Put the intent last, after any effects.', effects };
    }
    return { ok: false, fault: `'${pair ? pair[1] : raw}' is not something this unit can do`, effects };
  }
  if (fire && !FIRE.includes(fire)) {
    return { ok: false, fault: `'${pair[2]}' is not something this unit can do with a weapon`, effects };
  }
  return { ok: true, intent, fire, effects };
}


// WHAT THIS BUILD DOES NOT HAVE, said in words.
//
// A file of Standard ML pasted in here will fail, and it should; the useful
// question is whether it fails in a way that tells you why. "unexpected
// character ':'" is a lexer complaining about the third token of a signature
// block, and it names neither the construct nor the reason. The console's
// stated job is to teach rather than gatekeep, and that has to hold when the
// answer is no.
//
// Pure, ordered most specific first, and returns null when nothing is
// recognised so the parser's own message stands.



// Split a program file into the logical lines the parser expects, KEEPING the
// physical line each one started on, so an error can say where. See
// joinProgramLines for the joining rules; this is the same function with the
// numbers left in.

// What the type checker makes of a line, as a string to print beside the
// answer. Never throws and never refuses: inference here REPORTS. A machine in
// a name it has never seen is "anything" rather than an error.

// Load it into a session. Cheap enough to do on the first line typed, and
// skipped afterwards.



// ---- what this build of the language is ------------------------------------
//
// The language has its own version now, separate from the game's. It grew by
// accretion for two hundred versions and then by measurement against somebody
// else's corpus, and a reader who pastes a program in deserves to know which
// build refused it. `ml -ver` prints the line; `ml -full` prints the survey.
export const AIML_VERSION = '4.3';
export const AIML_NAME = 'AI-ML';

// THE CREDIT. One list, printed by -ver and again at the foot of -full, so the
// two can never drift apart. Also shown in the game's About box.
export const AIML_CREDIT = [
  'AI-ML created by David M. Berry, 2026.',
  'Based on Standard ML developed by Robin Milner, Mads Tofte, and',
  'Robert Harper. Many thanks to Robert Harper for the inspiration in',
  'his book "Introduction to Standard ML" (1986), and to \u00c5ke Wikstr\u00f6m for',
  '"Functional Programming Using Standard ML" (1987).',
];

export function aimlVersion() {
  return [
    `${AIML_NAME} ${AIML_VERSION}  (BML stack)`,
    'A descendant of Standard ML. Type inference, modules, exceptions.',
    'ml -full  for full details about this implementation.',
    '',
    ...AIML_CREDIT,
  ].join('\n');
}

// The survey: what is here, what is not, and what is here but spelled
// differently. Enough to tell whether a given program will run.
export function aimlFull() {
  const L = [];
  const sec = (t) => { L.push('', t, '='.repeat(t.length)); };
  const row = (a, b) => L.push(`  ${a.padEnd(26)}${b}`);

  L.push(`${AIML_NAME} ${AIML_VERSION}  (BML stack)`);
  L.push('The language on the obelisk consoles, the HERMES relays, this laptop,');
  L.push('and inside every machine that runs a program you can read.');

  sec('VALUES');
  row('int', '4, ~3. div and mod are whole-number.');
  row('real', '3.5, 2.0. / divides these and not ints.');
  row('', 'real n and floor x go between them.');
  row('char', '#"a". ord chr str explode implode.');
  row('str', '"a string". ^ joins two.');
  row('bool', 'true false. and or not, andalso orelse.');
  row('unit', '()');
  row('tuple', '(1, "a"). Fixed width, mixed kinds.');
  row('record', '{ a = 1, b = 2 }. #a selects. #1 works on a tuple.');
  row('list', 'nil, ::, [1,2,3], @ joins. hd tl length.');
  row('ref', 'ref 0, !r reads, r := v writes. The only mutable thing.');

  sec('BINDING AND FUNCTIONS');
  row('let / val / fun', 'three words, one thing.');
  row('let ... in ... end', 'several bindings, and joins them.');
  row('fn x => e', 'lambda. fn takes alternatives too.');
  row('let f x y = e', 'curried. Partial application gives a function.');
  row('clausal definitions', 'fun f nil = 0 | f (h::t) = 1 + f t');
  row('pattern bindings', 'let (m, n) = e, and in parameters.');
  row('recursion', 'a name is in scope inside its own value.');

  sec('TAKING THINGS APART');
  row('case e of p => e', 'first arm that fits wins.');
  row('patterns', 'constructor, variable, _, constant, nil, ::,');
  L.push('                            tuple, record, { ... }, as.');
  row('datatype', "datatype 'a option = NONE | SOME of 'a");

  sec('THE LARGER STRUCTURES');
  row('structure / struct', 'publishes its names under a prefix: Board.size');
  row('signature / sig', 'names what a structure shows.');
  row(':>  opaque ascription', 'hides everything the signature omits.');
  row('exception / raise', 'exception Fail; raise Fail');
  row('handle', 'e handle Fail => e, with full pattern arms.');
  row('type', 'type board = int * int. An abbreviation.');
  row('local ... in ... end', 'declarations in scope for the block only.');
  row('functor F (X) = ...', 'a structure taking a structure. F (A) applies it.');

  sec('TYPES');
  row('inference', 'Hindley-Milner. Runs on this laptop only.');
  row('', 'map : (\'a -> \'b) -> \'a list -> \'b list');
  row('annotations', 'val x : int = 5. Checked, not decoration.');
  row('on a clash', 'names it, then runs the line anyway.');

  sec('THE LIBRARY');
  row('List', 'map filter foldl foldr rev exists all find app');
  L.push('                            last nth take drop concat tabulate null');
  L.push('                            partition zip unzip');
  row('String', 'size sub map rev concat isPrefix substring extract');
  L.push('                            translate concatWith fields tokens compare');
  L.push('                            explode implode toString');
  row('Char', 'isDigit isAlpha isAlphaNum isUpper isLower isSpace');
  L.push('                            toUpper toLower toString compare');
  row('Int', 'abs min max sign toString fromString compare');
  row('Real', 'abs min max round fromInt toString');
  row('Bool', 'toString fromString not');
  row('Option', "datatype 'a option, isSome valOf getOpt map join filter");
  row('ListPair', 'zip unzip');
  row('order', 'datatype order = LESS | EQUAL | GREATER');
  row('top level', 'o (composition, infixr 3), before (infix 0), ignore');
  row('bare verbs', 'hd tl length abs sqrt min max size real floor');
  L.push('                            ord chr str explode implode ref echo');
  L.push('');
  L.push('  It is written in AI-ML, not underneath it. `ml -src List` prints it.');

  sec('NOT ON THIS BUILD');
  row('the rest of the library', 'no Array, Vector, IO, Math, Word, Substring.');

  sec('WRITTEN DIFFERENTLY');
  row('==  and  =', 'both are equality. A binding eats its = first.');
  row('(* comments *)', 'as in ML.');
  row('echo', 'prints. ; sequences.');
  row('|>', 'pipes a value into a function.');

  sec('WHERE IT RUNS');
  row('obelisk console', 'the tower verbs, and the language.');
  row('HERMES relay', "RON's own, plus the forge.");
  row('this laptop', 'the language alone, and the type checker.');
  row('inside a machine', 'its own program, 2,000 steps, four times a second.');
  L.push('');
  L.push('  A machine answers with an intent, or a pair: [hunt, fire].');
  L.push('  feet: patrol hunt flee home tend wait   weapon: fire hold reload');
  L.push('  escort: follow (trail you), defend (trail you and fight for you)');
  L.push('  senses: charge integrity range home_range threat hurt linked');
  L.push('          blight daylight sight armed shielded contact lost_for');
  L.push('          cargo casualty_range  (V-class couriers)');
  L.push('');
  sec('WHAT THE CHECKER DOES');
  L.push('  Hindley-Milner inference: unification, occurs check, let-polymorphism,');
  L.push('  and the value restriction (an application does not generalise).');
  L.push('  Two modes. HERE it reports and does not refuse: a clash names itself');
  L.push('  and the line still runs, because a machine in a ruin should say what');
  L.push('  it worked out and let you decide. Strict mode, which the language has');
  L.push('  outside this game, refuses a line that does not typecheck — which is');
  L.push('  what makes it an ML. A `case` that misses a constructor is a WARNING');
  L.push('  under both, as it is in Standard ML.');
  L.push('  Equality is structural on records and lists, by identity on refs,');
  L.push('  and refused on functions.');
  L.push('');
  L.push('  On THIS machine only: `units` is what the wireless card can hear —');
  L.push('  a list of records with name, range, bearing and kind. See sniffer.ml.');
  sec('CREDITS');
  for (const l of AIML_CREDIT) L.push(`  ${l}`);

  return L.join('\n');
}



// ---- The game's four interpreters ------------------------------------------
//
// M3 (v1.288). One interpreter per station, each built through the language's
// own `createInterpreter` and differing only in the verb table it is given and
// the wording it supplies for two questions the language asks.
//
// THE GAME IS ADVISORY EVERYWHERE, and that is the design rather than a
// shortcut: a machine in a ruin should say what it worked out and let the
// operator decide, and a T-1 has neither a checker nor anyone to read one. The
// NostBook is the exception a player can ask for — see `ml -strict` — because
// it is the machine you own and the one you practise on.
//
// The session is NOT owned here. NostOS keeps a session per terminal on `ctx`
// so bindings survive between visits, so each call hands the interpreter the
// session for the line being run. `interpreterFor` therefore makes a fresh
// wrapper per call, which is cheap: the state lives in ctx.session either way.
function interpreterFor(ctx) {
  return createInterpreter({
    session: (ctx && ctx.session) || {},
    typecheck: (ctx && ctx.typecheck) || 'off',
    primitives: false,   // the station filters below already supply them
    // CASE-FOLDED NAMES. The language is case-sensitive from v1.306, as
    // Standard ML is; NostOS is not and should not be. Its terminals are
    // 1980s machines: a player types HACK OB_1A2B as readily as hack
    // ob_1a2b, every verb and every bare word has always folded, and
    // taking that away would change the game rather than fix anything.
    names: 'fold',
    printing: 'bare',    // a verb returns a str; an obelisk prints CALYPSO, not "CALYPSO"
    builtins: () => makeBuiltins(ctx && ctx.station),
    hooks: {
      // A bare word that is not bound and not a verb HERE. Inside a machine's
      // own program it is the intent the machine chose (`patrol`), not a typo,
      // so answer null and let it through as a value.
      unknownName(name, hostCtx) {
        if (hostCtx && hostCtx.station === 'robot') return null;
        const lower = String(name).toLowerCase();
        if (hostCtx && hostCtx.station && ALL_VERBS.has(lower)) {
          return notHereMessage(name, hostCtx.station);
        }
        return `no such command: ${name}. type help for the list.`;
      },
      needsMoreArgs(fnValue) {
        return USAGE_HINTS[fnValue.name] || `${fnValue.name} needs more arguments`;
      },
    },
  });
}

// Load the standard library into a session. Kept as a free function because
// main.js, the tests and the boot path all call it with a ctx rather than an
// interpreter.
export function loadPrelude(ctx) {
  // TYPED as it loads, even though the game runs the language with the checker
  // off. `typeReport` is called separately by main.js at the NostBook, and it
  // reads what the session learned; if the prelude went in untyped, the
  // structures were never walked and `:t List.map` answered `'a`. Costs a few
  // milliseconds once per session.
  createInterpreter({
    session: (ctx && ctx.session) || {},
    typecheck: 'report',
    builtins: () => makeBuiltins(ctx && ctx.station),
    primitives: false,
    printing: 'bare',
    names: 'fold',       // as above: the game folds, the language does not
  }).loadPrelude(ctx);
}

// What the checker makes of a line. `ctx.types` is the game's switch for
// whether the NostBook shows types at all; the language's own switch is
// `typecheck`, which the game leaves at 'off' for the machines.
export function typeReport(source, ctx) {
  if (!ctx || !ctx.types) return null;
  return createInterpreter({
    session: (ctx && ctx.session) || {},
    typecheck: 'report',
  }).typeReport(source);
}

export function runRonml(source, ctx) {
  // `help` is a console meta-command, not a language expression — intercept it
  // before evaluation so a bare `help` prints the reference instead of failing
  // as an unknown name. `help <verb>` gives detail on one verb.
  const trimmed = source.trim();
  if (trimmed === 'help' || trimmed.startsWith('help ')) {
    return { ok: true, text: helpText(trimmed.slice(4).trim(), ctx && ctx.station, ctx && ctx.hasManual) };
  }
  // `*command` — the BBC-Micro command form, run with literal arguments.
  // Anything without a leading `*` is an AI-ML expression.
  if (trimmed.startsWith('*')) return runStar(trimmed.slice(1), ctx);
  return interpreterFor(ctx).run(source, ctx);
}
