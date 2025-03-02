// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

import { Renderer } from './engine/renderer.js';
import { Camera } from './engine/camera.js';
import { Input } from './engine/input.js';
import * as systems from './engine/systems.js';
import { buildWorld } from './game/worldgen.js';
import { spawnAnimals, updateAnimals } from './game/animals.js';
import { Player } from './game/player.js';
import { seawardFrom, boatMirror, CF_MIN } from './game/crossing.js';
import { isStraitCrossing, scyllaToll, STRAIT_COST } from './game/strait.js';
import { newNarrowsRun, narrowsSteer, narrowsRow, narrowsTick, narrowsStart, narrowsAnimate } from './game/narrows.js';
import { newCalypsoPong, calypsoStart, calypsoMove, calypsoTick } from './game/calypso-pong.js';
import { blightStep, tileBlighted, blightDepth, obeliskLive, BLIGHT_SICK_BAND, BLIGHTABLE } from './game/blight.js';
import { makeRng } from './game/rng.js';
import { DayNight } from './game/daynight.js';
import { Minimap } from './game/minimap.js';
import { spawnBirds, updateBirds } from './game/birds.js';
import { spawnRobots, registerRobotsSystem, spawnW1s, spawnW3, spawnW4, spawnW5, spawnM4, spawnM5, spawnM6, spawnGuard, drawRobot, setUnitTagger, setUnitTagsClickable, unitTagAt } from './game/robots.js';
import { resolveBodyOverlaps } from './game/collision.js';
import { spawnWaterDroids, updateWaterDroids, drawWaterDroid } from './game/waterdroids.js';
import { Lore, FRAGMENTS } from './game/lore.js';
import { ITEMS, TAPES } from './game/items.js';
import { sfx } from './engine/sound.js';
import { worldToScreen } from './engine/iso.js';
import { runRonml, decide, smlEcho, joinProgramLines, needsMoreInput, continuesPrevious, diagnose, joinProgram, typeReport, aimlVersion, aimlFull, AIML_VERSION, loadPrelude, flattenSession } from './game/ai_ml.js';
import { createEliza } from './game/eliza.js';
import { placeTors, HERMES_DOCS, hermesTopics, virusFor, virusFilesFor, virusDocsFor } from './game/hermes.js';
import { VERSION } from './version.js';
import { drawRobotVision } from './game/robotvision.js';
import { screenDirToWorld } from './engine/iso.js';
import { stampCoast } from './engine/coast.js';
import { placeRuins } from './game/ruins.js';
import { createFortress, DAEMON_BOOK_ID, DAEMON_BOOK_TITLE } from './game/fortress.js';
import { createUnderworldPocket, spawnUnderworldCreature, updateUnderworldCreatures } from './game/underworld.js';
import { createWorld, registerWorld, switchWorld, allWorlds } from './game/world.js';
import { restockShipParts } from './game/boatyard.js';
import { createIsland } from './islands/calypso.js';
import { createIthaca } from './islands/ithaca.js';
import { createPolyphemus } from './islands/polyphemus.js';
import { createCirce } from './islands/circe.js';
import { createHelios } from './islands/helios.js';
import { createNokia, sendNokia, holdRise, holdFall, holdBand, HOLD_COLD, HOLD_WARM, calypsoSms, ronSms, daemonSms, hasDaemonSms, logSms, bearingText } from './game/nokia.js';
import { newSnakeGame, snakeTurn, snakeTurnRelative, snakeTick, drawSnake } from './game/snake.js';
import { CHOIR_NOTES, CHOIR_DURATION } from './engine/choir-notes.js';
import { makeDisk, newShell, runUnix, hasFile, pathString, edOpen, edRun, writeFile, lookup, resolvePath, isFile, SALVAGE_DISKS, graftSalvage, graftSystemDirs, parseSelection, handlesOwnPaste, isBrowserChord } from './game/unix.js';
import { PDFS, pdfByName, pdfPath, pdfNames } from './game/pdfs.js';
import { BOOKS, bookByKey, bookKeys, bookPath, libraryPage } from './game/books.js';
import { isMobile } from './game/mobile-gate.js';
import { wireHelpTabs } from './game/help-tabs.js';
import { fillMachineGallery } from './game/machine-icons.js';
import { packFog, unpackFogInto } from './game/fog.js';
import { keeperLs, keeperRead, keeperIsDir } from './game/keeper.js';
import { buildingName, buildingLook } from './game/buildings.js';
import { hostTable, findHost, pageFor, renderPage, searchResults, bookmarksPage, favouritesPage, obLibraryPage, obDocPage, whatsNewPage, docsPage, docTitle, programPage, pressPage, wikiPage, deptPage, spoofedAddr, islandSubnet, networksInRange, relayHosts, RELAY_ESSID, RELAY_IP, relayFile, RELAY_FILES, IFACE, REPORT_HOLD, REPORT_COOLDOWN, HTTPD_PATH, httpdBinary, httpdToken } from './game/net.js';
import { CROSSINGS, islandProfile } from './game/islands.js';

// Note onsets split into four pitch registers, so each singing machine can be
// put on a different vocal "part" and its red light flashes to that part's
// notes — a choir of out-of-step blinking lights (see the flash sync in the
// update loop and Robots.sensorStyle).
const CHOIR_REGISTERS = (() => {
  const bands = [[], [], [], []];
  const lo = 45, span = (72 - 45) / 4;
  for (const [t, , m] of CHOIR_NOTES) {
    bands[Math.max(0, Math.min(3, Math.floor((m - lo) / span)))].push(t);
  }
  return bands.map((a) => a.sort((x, y) => x - y));
})();

// Each new game gets its own random seed, persisted so a continuing run
// (autosave) always regenerates the same map. Without this every playthrough
// put weapons and caches in identical spots — easy to memorise.
const SEED_KEY = 'postai-seed';
function loadOrCreateSeed() {
  try {
    const saved = localStorage.getItem(SEED_KEY);
    const n = saved && parseInt(saved, 10);
    if (Number.isFinite(n) && n > 0) return n;
  } catch { /* storage unavailable */ }
  const seed = 1 + Math.floor(Math.random() * 0x7ffffffe);
  try { localStorage.setItem(SEED_KEY, String(seed)); } catch { /* storage unavailable */ }
  return seed;
}
const WORLD_SEED = loadOrCreateSeed();

// Boot progress → the loader terminal (see game/boot-loader.js). Each call is a
// genuine phase reached, not a fake tick; wrapped so a missing listener (or a
// context where CustomEvent is odd) can never itself break the boot.
function bootStep(step) {
  try { window.dispatchEvent(new CustomEvent('nostos:progress', { detail: { step } })); } catch (_) { /* no-op */ }
}

const canvas = document.getElementById('game');
const renderer = new Renderer(canvas);
const input = new Input(window, canvas);
bootStep('engine');
// The island is built by createIsland (src/islands/calypso.js): buildWorld + all
// overworld construction, returned as a World. main.js keeps the player, save/load,
// lore, and the player/lore-coupled controllers (worldStir, onCoreDefeated), and
// aliases the World's arrays + controllers by name so the runtime sites below are
// unchanged. (islands Stage 0c, docs/islands-plan.md §3.)
const calypso = registerWorld(createIsland(WORLD_SEED));
bootStep('world');
let map = calypso.map;
const overworldMap = map; // stable handle: `map` gets reassigned to the underworld pocket and back
// currentWorld is the world the player is on now; calypso is the stable overworld
// handle. Declared here (not lower) so persist()'s "only save on calypso" guard is
// safe when an eval-time persist() fires during boot, before the old site.
let currentWorld = calypso;
// `let`, not `const`: the combat-world controllers/arrays are repointed to the
// current island on every switch into a combat world (goToWorld), so the ~66
// bare-alias sites (worldStir, onCoreDefeated, the factory helpers, the full
// update loop) all follow the island you are actually on. A second martial island
// (POLYPHEMUS) reuses the entire loop this way with no per-site edits.
let { spawn, robots, animals, birds, waterdroids, obelisks, obeliskObjs, fortress, wfactory, mainframe, torObjs } = calypso;
const player = new Player(spawn.x, spawn.y);
player.map = map; // for death drops when damage comes from animals (kept in sync on underworld enter/exit)
// Dispatch/repair fires from the factory centre, and stops once it's destroyed.
const factoryLive = () => wfactory && !wfactory.destroyed;
const factoryCx = () => wfactory.x + (wfactory.fw || 1) / 2;
const factoryCy = () => wfactory.y + (wfactory.fh || 1) + 1.5;
registerRobotsSystem(); // robots' AI ticks via systems.runUpdate (order 30); see robots.js
// "Red starlink": when the fortress breach reaches the world (the alarm trips),
// every overworld obelisk flares red (its `stirred` flag forces the alert glow,
// HUD untouched) and the W-factory throws a W4 toward the doorway. `calm` clears
// the flare when the fortress stands down. (Severing the link before it fires is
// a terminal hack — the adjacent-possible that replaced the old smashable mast.)
const worldStir = {
  stir() {
    for (const o of obeliskObjs) if (!o.destroyed) o.stirred = true;
    if (factoryLive()) {
      const w4 = spawnW4(map, Math.floor(Math.random() * 0x7fffffff), factoryCx(), factoryCy());
      if (w4) { robots.push(w4); }
    }
    player.say('Red light runs the length of the POSEIDON — the whole network knows where you are.');
  },
  calm() {
    for (const o of obeliskObjs) o.stirred = false;
  },
  // The core manufactures and dispatches guards, seated on the sanctum by the
  // core, deployed already hunting — they pathfind up through the maze to the
  // intruder. Called with a big count on the first breach, then trickled as
  // reinforcements while the alarm holds (a relentless violation response).
  spawnWave(m6n = 4, m5n = 2) {
    const cx = fortress.core.x, cy = fortress.core.y;
    for (let i = 0; i < m6n; i++) {
      const g = spawnM6(map, Math.floor(Math.random() * 0x7fffffff), cx, cy);
      if (g) { g.aggro = true; robots.push(g); }
    }
    const posts = fortress.quad.muster;
    for (let i = 0; i < m5n; i++) {
      const s = spawnM5(map, Math.floor(Math.random() * 0x7fffffff), cx, cy);
      if (s) {
        s.aggro = true;
        // Assign the sniper a post out on the quad to hold back at, so it snipes
        // from the open killing-ground rather than chasing into the maze.
        s.holdPos = posts.length ? posts[Math.floor(Math.random() * posts.length)] : { x: cx, y: fortress.quad.top + 2 };
        robots.push(s);
      }
    }
  },
};

// Killing an island's fortress AI kills the island: every hostile machine here
// loses its controlling mind and powers down where it stands. Deliberately
// ISLAND-AGNOSTIC — an island has its own `robots` set + fortress, so the exact
// same call powers down exactly this island's machines. When the Archipelago
// adds APOLLO / ATHENA / HADES, each island wires its own core to this hook and
// defeats independently. Friendlies (running on a battery you gave them) stay.
player.onCoreDefeated = (core) => {
  const ai = fortress.AI_NAME;
  let powered = 0;
  for (const r of robots) {
    if (r.dead || r.fused || r.friendly) continue;
    r.aggro = false;
    r.drained = true;      // flat: inert until re-batteried (they never re-arm — the mind is gone)
    r.poweredDown = true;  // render tell: a cold, dead husk
    powered += 1;
  }
  worldStir.calm();        // clear the red POSEIDON alert
  // The towers die with the mind that ran them: every standing obelisk goes
  // dark and inert — no signal light, no alert, nothing left to stir. (They
  // still stand, and still yield chips if broken open.)
  for (const o of obeliskObjs) {
    if (!o.destroyed) { o.poweredDown = true; o.alert = 0; o.stirred = false; }
  }
  player.addScore(500);
  daemonsDown += 1;
  recordAiDown(ai);        // which one, for the Record panel's chips
  // The dead core throws its testament into the open — auto-recover it to the
  // Scrapbook (the eidolon/Coherence book seeds the archipelago). `quiet` so it
  // doesn't fight the modal for the message line; the modal announces it.
  let book = null;
  if (lore && lore.findFrag && lore.findFrag(DAEMON_BOOK_ID, player, true)) book = DAEMON_BOOK_TITLE;
  // The celebration: a dismissable level-up modal. It does NOT end the run —
  // you sail on to the next daemon. Carries the daemon's last words + the book.
  player.aiVictory = {
    ai, powered, score: player.score, daemon: daemonsDown, daemons: 4,
    lastWords: core && core.lastWords, book,
  };
  player.say(`${ai} is dead. Every machine on the island powers down where it stands.`);
};
let daemonsDown = 0; // how many island AIs felled this run (for the Archipelago tally)

// WHICH daemons are down, not just how many — the Record panel draws the roster
// as four chips and strikes each one through as it falls, so the archipelago's
// progress is a thing you can see rather than a fraction. Each fall is already
// worth +500 at both call sites (a core-kill, and Calypso's refunction, which is
// her equivalent of dying). Idempotent: a daemon only records once.
function recordAiDown(name) {
  if (!name) return;
  player.aisDown = player.aisDown || [];
  if (!player.aisDown.includes(name)) player.aisDown.push(name);
}

// Character persona and learned skills persist across sessions and deaths.
const SAVE_KEY = 'postai-character';
// Name and gender live in their own durable key, separate from the run save.
// Dying or starting a New Game wipes score/skills/inventory (fullReset below)
// but should not make you re-pick who you are — that identity outlives runs.
const IDENTITY_KEY = 'postai-identity';
try {
  const identity = JSON.parse(localStorage.getItem(IDENTITY_KEY) || 'null');
  if (identity) player.setPersona(identity.name || player.name, identity.gender || player.gender);
} catch { /* corrupt: keep the default persona */ }
// The AI-key backup survives death (its own durable key, not the run save).
try { if (localStorage.getItem('postai-aikey-backup')) player.aikeyBackedUp = true; } catch { /* ignore */ }
let hadExistingSave = false;
// Stage 1c: which island the save left the player on, and where. Applied at the
// very end of boot (after all init + the world machinery), since resuming onto a
// non-overworld island means a goToWorld() the rest of module-eval must not see.
let _bootIsland = 'calypso', _bootPos = null;
// The `world.islands` blob off the save, held until each island is built and can
// consume its own entry (applyIslandState, far below). Declared HERE, above the
// restore block that assigns it, and NOT beside its function: the restore runs
// during module evaluation, so a `let` further down would leave this in the
// temporal dead zone and throw at boot on every existing save. That is exactly
// how v1.139 shipped a black screen; see the note by `crossFail` below.
let _savedIslands = null;
try {
  const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
  if (saved) {
    hadExistingSave = true;
    player.setPersona(saved.name || 'Nobody', saved.gender || 'm');
    for (const s of saved.skills || []) player.skills.add(s);
    if (Array.isArray(saved.skillLog)) player.skillLog = saved.skillLog;
    if (Array.isArray(saved.weaponsFound)) player.weaponsFound = new Set(saved.weaponsFound);
    if (Array.isArray(saved.killLog)) player.killLog = saved.killLog;
    if (Array.isArray(saved.circuitNums)) player.circuitNums = new Set(saved.circuitNums);
    if (saved.xp) Object.assign(player.xp, saved.xp);
    if (Array.isArray(saved.seenGround)) player.seenGround = new Set(saved.seenGround);
    if (Array.isArray(saved.booksRead)) player.booksRead = new Set(saved.booksRead);
    if (typeof saved.score === 'number') player.score = saved.score;
    if (typeof saved.deaths === 'number') player.deaths = saved.deaths;
    // Restore the in-progress run (vitals, position, inventory) so the game
    // picks up where you left off. The world itself regenerates from the seed.
    const st = saved.state;
    if (st) {
      for (const k of ['health', 'stamina', 'food', 'venom', 'wifiPower', 'x', 'y', 'hands']) {
        if (st[k] !== undefined) player[k] = st[k];
      }
      if (Array.isArray(st.pockets)) player.pockets = st.pockets;
      if (st.backpack) player.backpack = st.backpack;
      if (st.walkman !== undefined) player.walkman = st.walkman; // null = tape moved out, respected across reload
      if (st.laptop !== undefined) player.laptop = st.laptop;    // the machine and everything written on it
      if (Array.isArray(st.salvaged)) player.salvaged = st.salvaged;
      // The four colour models were cut for one machine (laptop-plan §3a); an
      // older save naming one still resolves rather than drawing nothing.
      if (player.laptop && !ITEMS[player.laptop.model]) player.laptop.model = 'laptop';
      if (st.calypsoLeave) player.calypsoLeave = true; // sticky: refunctioning Calypso persists across reload
      if (typeof st.swine === 'number') player.swine = st.swine; // CIRCE's change follows you across a reload
      if (typeof st.calypsoHold === 'number') player.calypsoHold = st.calypsoHold; // Nokia gradient survives reload
      if (Array.isArray(st.nokiaSent)) player.nokiaSent = new Set(st.nokiaSent);   // don't re-tutorial on reload
      if (Array.isArray(st.poseidonSaid)) player._poseidonSaid = st.poseidonSaid;  // nor replay the deadline notices
      if (Array.isArray(st.aisDown)) player.aisDown = st.aisDown;                 // the fallen daemons stay fallen
      if (typeof st.nokiaParts === 'number') player._nokiaParts = st.nokiaParts;
      if (Array.isArray(st.nokiaLog)) player.nokiaLog = st.nokiaLog; // the SMS threads survive reload
      if (typeof st.snakeHigh === 'number') player.snakeHigh = st.snakeHigh; // Snake's best game survives too
      if (Array.isArray(st.virusArmed)) player.virusArmed = new Set(st.virusArmed);
      // Pre-v1.126 saves: a hermes card existed but carried no per-island arming.
      // Grandfather it as armed against CALYPSO so an in-flight run isn't stranded.
      else if (player.hasItem('hermes_card')) player.virusArmed = new Set(['CALYPSO']);
      if (typeof st.x === 'number') _bootPos = { x: st.x, y: st.y }; // the saved position, for the island resume below
    }
    // Guard against stale item keys carried over from a save written by an
    // earlier build — e.g. the pre-v1.15 tape keys (tape_ward / tape_meme),
    // renamed to tape_1..3 when tapes became data-driven. An orphaned key
    // resolves to an undefined item def, and the HUD renderer dereferences it
    // every frame (drawCassette, pocket labels), so a single dead key hard-
    // crashes the whole render loop before textures even finish loading. Drop
    // anything the current ITEMS table no longer knows about.
    const validStack = (s) => (s && ITEMS[s.item]) ? s : null;
    player.pockets = (Array.isArray(player.pockets) ? player.pockets : []).map(validStack);
    while (player.pockets.length < 4) player.pockets.push(null);
    if (player.hands && !ITEMS[player.hands]) player.hands = null;
    if (player.walkman && !ITEMS[player.walkman.item]) { player.walkman = { item: 'tape_1', qty: 1 }; player.walkmanSide = null; }
    if (player.backpack) {
      if (player.backpack.weapon && !ITEMS[player.backpack.weapon]) player.backpack.weapon = null;
      if (Array.isArray(player.backpack.slots)) player.backpack.slots = player.backpack.slots.map(validStack);
    }
    // Re-apply saved world progress onto the freshly-regenerated world. The world
    // itself comes back deterministically from the seed; we only stored the
    // mutations (felled obelisks, factory, daemon tally, fortress state). Written
    // by persist() below. This is why a Continue now resumes the world, not just you.
    if (saved.world) {
      const wsv = saved.world;
      // Per-island world state. A save written before the archipelago (or by any
      // build up to v1.146) carries the four flat CALYPSO-only fields instead, so
      // fold those into an islands blob keyed to her — old saves keep working and
      // stop mis-restoring onto the wrong island.
      _savedIslands = wsv.islands || {
        calypso: {
          obDown: wsv.obDown, factoryDestroyed: wsv.factoryDestroyed,
          boxesOpened: wsv.boxesOpened, fortress: wsv.fortress,
        },
      };
      applyIslandState(calypso);   // she is the only island built this early
      if (typeof wsv.daemonsDown === 'number') daemonsDown = wsv.daemonsDown;
      if (wsv.currentIsland) _bootIsland = wsv.currentIsland; // Stage 1c: resume on the island you saved on
    }
  }
} catch { /* corrupt save: start fresh */ }
bootStep('save');
// A fresh start (no saved position — first ever run, or the reload after New
// Game / a death) begins washed ashore: flat on the sand where the spawn's
// beach relocation in calypso.js put you, until the first input gets you up.
// A Continue resumes on your feet wherever you saved.
if (!_bootPos) {
  player.lying = true;
  player.say('Sea in your ears. Sand under your cheek. You are ashore, wherever this is.');
}
// Set just before New Game reloads, so the beforeunload/visibilitychange
// autosave below can't silently rewrite the character save out from under
// the reset the player just confirmed.
let resettingGame = false;
// Wipes every trace of the current run — character save, lore progress,
// world seed — and reloads to a freshly shuffled world. Used by New Game
// (after a confirm) and, unconditionally, whenever the player dies.
function fullReset() {
  resettingGame = true; // block the beforeunload/hidden autosave from undoing this
  localStorage.removeItem('postai-character');
  localStorage.removeItem('postai-lore');
  localStorage.removeItem(SEED_KEY);
  location.reload();
}
// The full run snapshot (identity + progress + run state + world MUTATIONS). The
// world regenerates from the seed on load, so we store only what changed (felled
// obelisks, factory, daemon tally, fortress doors/core) and re-apply it
// (see the restore block above). Shared by the autosave and the stage checkpoints.
function buildSaveBlob() {
  return {
    name: player.name, gender: player.gender, skills: [...player.skills], skillLog: player.skillLog,
    weaponsFound: [...player.weaponsFound], killLog: player.killLog, circuitNums: [...player.circuitNums],
    xp: player.xp, score: player.score, deaths: player.deaths || 0,
    seenGround: [...player.seenGround],   // ground walked, for the knowledge it bought
    // Volumes whose WHOLE TEXT you own: you read the paperback, so the book is
    // yours whether or not you still have a machine to read it on. The pages
    // filed in the Library are not saved (printedDocs is per-run); this is, and
    // deliberately — a book you have actually read should not be taken back.
    booksRead: [...(player.booksRead || [])],
    state: {
      health: player.health, stamina: player.stamina, food: player.food, venom: player.venom,
      wifiPower: player.wifiPower, x: player.x, y: player.y, hands: player.hands,
      pockets: player.pockets, backpack: player.backpack, walkman: player.walkman,
      laptop: player.laptop,             // model, OS, and the whole disk — your files survive a reload
      salvaged: player.salvaged,         // which dead machines' disks you have already read
      calypsoLeave: player.calypsoLeave, // Calypso refunctioned: the sea will let you go
      swine: player.swine,               // CIRCE's transmutation: you stay changed across a reload
      calypsoHold: player.calypsoHold,   // the Nokia gradient: her hold on you (docs/calypso-nokia-plan.md)
      nokiaSent: [...player.nokiaSent],  // the one-shot texts already sent, so a reload does not re-tutorial
      poseidonSaid: [...(player._poseidonSaid || [])], // deadline notices already pushed, so a reload does not replay them
      aisDown: [...(player.aisDown || [])],           // which daemons are down, for the Record chips
      nokiaParts: player._nokiaParts || 0,
      nokiaLog: (player.nokiaLog || []).slice(-40), // the SMS threads, so the correspondence survives reload
      snakeHigh: player.snakeHigh || 0,  // the handset remembers its best game
      virusArmed: [...(player.virusArmed || [])], // which daemons the card is armed against (per-island virus)
    },
    world: {
      currentIsland: currentWorld.id, // Stage 1c: which island you're on, so a voyage survives reload
      daemonsDown,
      // Per-island world state, keyed by island id. This USED to be four flat
      // fields that only ever read CALYPSO — written when the game had one
      // island, and quietly wrong once the archipelago landed: felling obelisks
      // on Polyphemus saved nothing, and its fortress snapshot was restored onto
      // Calypso's fortress (the restore runs at module eval, when the `fortress`
      // alias still points at hers). Now every built island saves its own.
      islands: serializeIslandState(),
    },
  };
}

// Snapshot the mutable world state of every island built so far. Islands are
// built lazily — one you have never sailed to simply has no entry, and gets none
// until you go there. The Backspace is a transient pocket that always regenerates,
// so it is never saved.
function serializeIslandState() {
  const out = {};
  // FIRST carry forward the saved state of islands not yet built this run. They
  // are created lazily, so an island you have not sailed back to has no live
  // object to read — and simply skipping it would erase that island's progress
  // the moment anything autosaved. The boot score-wipe persist() does exactly
  // that, before the resume has even switched you to the island you saved on, so
  // without this the first save of every session wipes every far island.
  if (_savedIslands) {
    for (const id of Object.keys(_savedIslands)) {
      if (id === 'backspace') continue;
      const { _applied, ...rest } = _savedIslands[id];   // drop the internal marker
      out[id] = rest;
    }
  }
  // ...then let any island that IS built override with its live state.
  for (const w of allWorlds()) {
    if (w.id === 'backspace') continue;
    const st = {};
    if (w.obeliskObjs && w.obeliskObjs.length) {
      st.obDown = w.obeliskObjs.filter((o) => o.destroyed).map((o) => o.code);
    }
    if (w.wfactory) st.factoryDestroyed = !!w.wfactory.destroyed;
    // Looted caches, keyed by tile — the world regenerates them full otherwise.
    if (w.map && w.map.objects) {
      st.boxesOpened = w.map.objects.filter((o) => o.type === 'box' && o.opened).map((o) => ({ x: o.x, y: o.y }));
    }
    if (w.fortress && w.fortress.serialize) st.fortress = w.fortress.serialize();
    // The ground you have walked. Knowledge survives in this game — the skills
    // do, the books do — and the minimap's fog was the one kind that did not:
    // every reload put the whole island back under grey. Bit-packed, so five
    // islands cost about 14KB (see game/fog.js). Islands that start fully
    // revealed say so on the map itself, so there is no list here to go stale.
    if (w.map && w.map.explored && !w.map.exploredAll) st.fog = packFog(w.map.explored);
    out[w.id] = st;
  }
  return out;
}

// Re-apply an island's saved state to the world object, once, at the moment that
// island is actually built. Called from each ensureX() (and for Calypso at boot),
// so a far island restores when you first sail back to it rather than needing to
// exist at load time.
function applyIslandState(w) {
  if (!w || !_savedIslands) return;
  const st = _savedIslands[w.id];
  if (!st || st._applied) return;
  st._applied = true;       // idempotent: an island is only restored once per run
  if (Array.isArray(st.obDown) && w.obeliskObjs) {
    const down = new Set(st.obDown);
    for (const o of w.obeliskObjs) {
      if (down.has(o.code)) { o.destroyed = true; w.map.objectGrid[o.y * w.map.w + o.x] = null; }
    }
  }
  if (st.factoryDestroyed && w.wfactory) w.wfactory.destroyed = true;
  if (Array.isArray(st.boxesOpened) && w.map && w.map.objects) {
    const open = new Set(st.boxesOpened.map((b) => `${b.x},${b.y}`));
    for (const o of w.map.objects) {
      if (o.type === 'box' && open.has(`${o.x},${o.y}`)) { o.opened = true; o.lore = []; }
    }
  }
  if (st.fortress && w.fortress && w.fortress.restore) w.fortress.restore(st.fortress);
  if (st.fog && w.map && !w.map.exploredAll) {
    // Calypso is restored at boot, BEFORE the line further down that creates
    // her exploration array, so it is made here if it is not there yet — and
    // that line no longer overwrites what this put in it.
    if (!w.map.explored) { w.map.explored = new Uint8Array(w.map.w * w.map.h); w.map.newlyRevealed = []; }
    if (unpackFogInto(st.fog, w.map.explored)) w.map.fogDirty = true;   // the renderer caches the mask
  }
}
// Transient voyage state, forward-declared HERE (above persist) so persist's
// guard can read them. persist() is called during module eval (the reload
// score-wipe below, line ~417) — long before the gameplay code where these were
// originally declared — so a plain `let` further down would leave them in the
// temporal dead zone and throw at boot on any existing save. Their real
// initialisation and use live further down; these are just the hoisted homes.
let crossFail = null;      // failed crossing (Poseidon turns you back)
let departOut = null;      // rowing out to the heading chart (or back in)
let pendingCrossing = null; // a chosen island, performed at the next frame top
let strait = null;         // in the narrows: Scylla and Charybdis (game/strait.js)
let pong = null;           // at Calypso's terminal: the un-winnable pong (game/calypso-pong.js)
// The heading the current voyage put out on. The boat sprite has one bow and a
// mirror, so the hull must at least be flipped to the side it is actually
// sailing toward; the strait picks up the crossing here rather than guessing.
let lastSailDir = null;

const persist = () => {
  if (resettingGame) return;
  // Never save a TRANSIENT VOYAGE. While aboard a boat, mid-crossing, or rowing
  // out to the chart, the player's x/y is out on open water and the aboard flag
  // is set — persisting that (the 8s autosave fires regardless) is what left
  // players reloading onto the sea, marooned, with no boat and no way back in.
  // These states resolve within seconds; skip the save until the keel is on
  // sand again.
  if (player.aboard || crossFail || departOut || pendingCrossing || strait) return;
  // Savable worlds are the islands you can be on across a reload: CALYPSO and
  // ITHACA (Stage 1c — buildSaveBlob records world.currentIsland, and the boot
  // restore resumes you there). The Backspace is a transient pocket you always
  // exit by its door, so it is never saved: doing so would drop you back onto
  // CALYPSO at the pocket's coordinates on Continue.
  if (!currentWorld.combat && currentWorld.id !== 'ithaca') return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(buildSaveBlob()));
    localStorage.setItem(IDENTITY_KEY, JSON.stringify({ name: player.name, gender: player.gender }));
  } catch { /* storage unavailable */ }
};

// ---- Stage checkpoints (the Load list) -------------------------------------
// Milestones auto-snapshot the whole run (blob + seed) into their own store the
// first time you reach them. The gate's Load list reads these, so death (which
// wipes the run via fullReset, but NOT this key) drops you back to the gate where
// you can resume from a stage you'd earned. See mobile-gate.js for the list.
const STAGES_KEY = 'postai-stages';
const STAGE_LADDER = [
  { id: 'ashore',    label: 'Washed ashore',           reward: 0,  reached: () => true },
  // A checkpoint the first time you make landfall on each far island, so a death
  // (which drops you back to the gate) can resume from the shore you reached
  // rather than the start. Non-linear: whichever islands you sail to, in any
  // order, each records its own landing once.
  { id: 'land-polyphemus', label: 'Landfall: AEGILIA',   reward: 15, reached: () => currentWorld.id === 'polyphemus' },
  { id: 'land-circe',      label: 'Landfall: AEAEA',     reward: 15, reached: () => currentWorld.id === 'circe' },
  { id: 'land-helios',     label: 'Landfall: THRINACIA', reward: 15, reached: () => currentWorld.id === 'helios' },
  { id: 'land-ithaca',     label: 'Landfall: ITHACA',    reward: 15, reached: () => currentWorld.id === 'ithaca' },
  { id: 'chip',      label: 'Jacked in',               reward: 10, reached: () => player.hasItem('chip') },
  { id: 'aikey',     label: 'The AI key',              reward: 20, reached: () => player.hasAiKeyFamily() },
  { id: 'trojan',    label: 'Trojan card',             reward: 25, reached: () => player.hasItem('trojan_key') || player.hasItem('hermes_card') },
  { id: 'hermes',    label: 'Hermes card',             reward: 30, reached: () => player.hasItem('hermes_card') },
  { id: 'lionsgate', label: "Through the Lion's Gate", reward: 40, reached: () => !!(fortress && fortress.open) },
  { id: 'core',      label: 'The core falls',          reward: 50, reached: () => !!(fortress && fortress.core && fortress.core.obj && fortress.core.obj.defeated) },
];
let _savedStages;
try { _savedStages = new Set(Object.keys(JSON.parse(localStorage.getItem(STAGES_KEY) || '{}'))); }
catch { _savedStages = new Set(); }
// `order` places the entry in the gate's list (highest first). Ladder stages
// take their rung from STAGE_LADDER; a hand-written save passes its own, above
// every rung, because the point of writing one is that it is where you want to
// come back to.
function saveStage(id, label, order) {
  try {
    const stages = JSON.parse(localStorage.getItem(STAGES_KEY) || '{}');
    stages[id] = {
      id, label, order: order != null ? order : STAGE_LADDER.findIndex((s) => s.id === id),
      score: player.score || 0, ts: Date.now(),
      seed: String(WORLD_SEED), save: buildSaveBlob(), // in-memory seed = always the live world's
    };
    localStorage.setItem(STAGES_KEY, JSON.stringify(stages));
  } catch { /* storage unavailable */ }
}
// Hand-written checkpoints sit above every ladder rung in the Load list.
const MANUAL_STAGE_ORDER = 100;

// `save` at a terminal (task #93). Checkpoints used to be written only by the
// ladder above, so a careful hour on one island had nothing behind it: die in
// the fortress and you were back on the beach. A terminal is a machine you are
// logged into, and writing your position to it is the sort of thing a terminal
// is for.
//
// One rolling slot per island, overwritten by the next save there, so sailing
// on never costs you the shore you came from. Free: a battery cost would only
// make you think about it before every fight.
//
// Returns { ok, text } — the ML consoles print it, the laptop shell returns it.
function terminalSave() {
  // The same two refusals `persist` makes, said out loud rather than silently.
  // A save taken out on the water resumes you marooned at sea; a save taken in
  // the Backspace resumes you at a pocket's coordinates on CALYPSO.
  if (player.aboard || crossFail || departOut || pendingCrossing || strait) {
    return { ok: false, text: 'save: not from the water. Get the keel on sand first.' };
  }
  if (!currentWorld.combat && currentWorld.id !== 'ithaca') {
    return { ok: false, text: 'save: no position to fix here. This place is not on any chart.' };
  }
  const place = hudPlace();
  const id = `save-${currentWorld.id}`;
  saveStage(id, `Checkpoint: ${place}`, MANUAL_STAGE_ORDER);
  _savedStages.add(id);
  persist(); // keep Continue in step with the checkpoint you just wrote
  return { ok: true, text: `OK: checkpoint written — ${place}, score ${player.score || 0}.\nLoad it from the title screen.` };
}
// Polled once per frame — the reached() checks are cheap and a stage is written
// only the first time (per store), so it never thrashes. Saved once ever, so a
// checkpoint keeps the state from when you first reached it.
let _lastAutosave = 0; // wall-clock of the last periodic persist (see frame())
function checkMilestones() {
  for (const m of STAGE_LADDER) {
    if (!_savedStages.has(m.id) && m.reached()) {
      _savedStages.add(m.id);
      if (m.reward && player.addScore) player.addScore(m.reward); // link progress to rank — modestly
      saveStage(m.id, m.label);
      if (m.id !== 'ashore') player.say(`Checkpoint: ${m.label} (+${m.reward}) — load back to here from the title.`);
    }
  }
}
player.onSkillLearned = persist;
player.onXpGain = persist;
player.onScore = persist;
player.onDeath = persist;
player.onWeaponFound = persist;
// Autosave the run periodically and when the tab is hidden or closed.
let saveClock = 0;
window.addEventListener('beforeunload', persist);
document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });

// Warn before a reload/close, since it wipes score and the obelisk kill
// record (below) — but not during New Game's own reload, which already had
// its own confirm and is an intentional clean reset, not an accidental one.
window.addEventListener('beforeunload', (e) => {
  if (resettingGame) return;
  e.preventDefault();
  e.returnValue = ''; // most browsers require this to show their own prompt
});

// Reloading the page (F5, etc.) isn't a clean reset — it just re-loads the
// same save — so unlike New Game (which wipes everything and shuffles a
// fresh world too) it costs you: your score and obelisk kill record are wiped
// clean, so reload can't be used as a free undo out of a bad fight.
if (hadExistingSave) {
  player.score = 0;
  player.killLog = [];
  persist();
  player.say('The feed glitches on reconnect: score and obelisk kill record wiped clean.');
}

// Character picker in the help modal.
const nameInput = document.getElementById('charName');
nameInput.value = player.name;
for (const btn of document.querySelectorAll('#help button[data-gender]')) {
  btn.addEventListener('click', () => {
    player.setPersona(btn.textContent.trim(), btn.dataset.gender);
    nameInput.value = player.name;
    persist();
  });
}
const saveName = () => {
  const v = nameInput.value.trim();
  if (!v) return;
  player.name = v;
  persist();
  const btn = document.getElementById('charNameSave');
  if (btn) {
    const original = btn.textContent;
    btn.textContent = 'Saved!';
    setTimeout(() => { btn.textContent = original; }, 1200);
  }
};
nameInput.addEventListener('change', saveName);
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveName(); });
document.getElementById('charNameSave').addEventListener('click', saveName);

// Machine gallery in the help modal: renders each robot type through its
// own real draw function onto a small offscreen canvas, so the picture is
// exactly what you'll meet in the world rather than a separately drawn
// icon that could drift out of sync with it.
fillMachineGallery();
const camera = new Camera(player.x, player.y);
// Height (in steps) of the ground under the player, for the camera's elevation
// follow so a climb up the mountain does not walk the sprite off the top of view.
// effectiveHeightAt includes standing on a climbable block, matching the sprite lift.
function playerElevSteps() {
  const fx = Math.floor(player.x), fy = Math.floor(player.y);
  if (map.effectiveHeightAt) return map.effectiveHeightAt(fx, fy);
  return map.heightAt ? map.heightAt(fx, fy) : 0;
}
// `lore` self-registers as a system in its own constructor (Stage 0 of the
// systems-registry refactor, docs/refactor-registry.md) — the hub never names it.
// Its update ticks via systems.runUpdate() in update(); its two draw phases via
// the renderer's runDrawWorld/runDrawScreen.
const lore = new Lore(map, WORLD_SEED);
// Opening a resistance cache folds any recovered documents packed in it into the
// Scrapbook (quietly — openBox prints its own one-line summary).
player.onFindLore = (id) => lore.findFrag(id, player, true);

const dayNight = new DayNight();
const minimap = new Minimap(map);
let showMinimap = true; // toggled with the ] key
let lastObjectCount = map.objects.length;

// Audio unlocks on the first user gesture (browser requirement).
const unlockAudio = () => {
  sfx.unlock();
  sfx.setAmbience({ night: dayNight.isNight() });
};
window.addEventListener('keydown', unlockAudio, { once: true });
window.addEventListener('pointerdown', unlockAudio, { once: true });

map.projectiles = []; // in-flight gun rounds (cosmetic tracers)
map.bombs = [];       // dropped ticking bombs
map.explosions = [];  // active fire clouds (visual)
const UBIK_PATCH_LIFE = 75; // seconds a sprayed patch stays brightened before fading back
const UBIK_PORTAL_LIFE = 260; // portals hold much longer than a plain patch before fading
const UBIK_TELEPORT_RANGE = 0.9; // how close to a linked portal's centre triggers a jump
const UBIK_TELEPORT_COOLDOWN = 1.5; // seconds before another jump can fire (stops instant ping-pong)

// The underworld: a Ubik tear no longer links to another overworld spot —
// it drops you into a single shared liminal pocket instead (see
// game/underworld.js). Built lazily on first entry, then kept for the rest
// of the session; entering/exiting swaps the outer `map` binding itself,
// which every system (player.update, updateRobots, renderer.draw, ...) reads
// fresh each call, so no other wiring is needed beyond keeping `player.map`
// and `window.__game.map` in sync.
// The Backspace is its own World now (islands 0b). Built lazily on first entry and
// kept for the session. Its onEnter/onExit carry the narration + lore + drone, its
// update() ticks the lurker and the ambient shrieks, and its empty entity arrays
// give the draw a blanked overworld for free (no more `inUnderworld ? [] : …`).
let backspace = null;
function ensureBackspace() {
  if (backspace) return;
  // R4: one labelled way up per island — the doors of the dead, littered across the
  // pocket. The pocket stamps each door with its island id + place name (CROSSINGS).
  const dests = CROSSINGS.map((c) => ({ id: c.id, place: c.place }));
  const pocket = createUnderworldPocket((WORLD_SEED ^ 0x0b1c) >>> 0, dests);
  const creatures = [spawnUnderworldCreature((WORLD_SEED ^ 0x1e57) >>> 0, pocket.creatureX, pocket.creatureY)];
  let ambClock = 0, ambNext = 8 + Math.random() * 10;
  backspace = registerWorld(createWorld('backspace', {
    map: pocket.map,
    spawn: { x: pocket.spawnX, y: pocket.spawnY },
    creatures,
    keepsPosition: false, // always land in the tear's arrival room, never mid-pocket
    ambience: { light: 1, dawnGlow: false, minimap: false, underworld: true, musicBed: 'drone' },
    update(dt, pl) {
      updateUnderworldCreatures(dt, creatures, pl, pocket.map);
      ambClock += dt;
      if (ambClock > ambNext) { ambClock = 0; ambNext = 8 + Math.random() * 14; sfx.play(Math.random() < 0.5 ? 'shriek' : 'hiss'); }
    },
    onEnter() { lore.placeBackspace(pocket.map); sfx.setDrone(0.8); player.say('The tear swallows you. The air in here is wrong — flat, yellow, humming.'); },
    onExit() { lore.leaveBackspace(); sfx.setDrone(0); player.say('You come up through the tear. Ordinary daylight, ordinary weight. You are back.'); },
  }));
  backspace.exits = pocket.exits; // the labelled ways up, proximity-checked in the loop
}

// The single world-switch point. switchWorld moves the player + syncs player.map +
// fires onExit/onEnter; here we also sync the outer `map` local, the debug hook, and
// the camera. Everything reading currentWorld.* / `map` follows next frame.
function goToWorld(target, opts = {}) {
  currentWorld = switchWorld(currentWorld, target, player, opts);
  map = currentWorld.map;
  // Repoint the combat-world aliases at the island we're now on, so the full
  // update loop + worldStir + onCoreDefeated + the factory helpers all operate on
  // this island's entities/controllers (a second martial island reuses the loop).
  // Only combat worlds carry these; non-combat worlds (Backspace, ITHACA) run the
  // slim loop and never touch the aliases, so we leave the last combat island's in
  // place for them.
  if (currentWorld.combat) {
    ({ robots, animals, birds, waterdroids, obelisks, obeliskObjs, fortress, wfactory, mainframe, torObjs } = currentWorld);
    Object.assign(window.__game, { robots, animals, birds, waterdroids, obelisks, obeliskObjs, fortress, wfactory });
  }
  window.__game.map = map;
  window.__game.currentWorld = currentWorld;
  // R3: in depart mode her fortress guards detain rather than slay (robots.js
  // reads this at the M4/M5/M6 hit sites). Poseidon's roaming machines are
  // untouched — only the guard classes consult it.
  player.detainMode = currentWorld.winMode === 'depart';
  // Which island's ground you are covering, so exploration counts per world and
  // a fresh landfall is worth walking.
  player.worldId = currentWorld.id || '';
  // The purge's weather belongs to the island it was drawn over. Cleared on the
  // way in so the first frame somewhere new is never the last place's sky; a
  // combat island winds its own back up from 0 within a second (updateFog).
  poseidonFog = 0;
  obFogHold = { level: null, t: 0 };
  // A ship part that has left the world entirely goes back in the yard's boxes.
  // Ground items are not saved, so a part dropped and then reloaded is simply
  // gone — and without all three there is no way off Ogygia. A part still lying
  // in a field is NOT lost and is not duplicated.
  if (currentWorld.keeper) {
    const back = restockShipParts(map, player);
    if (back.length) player.say(`The boat-house has been restocked: ${back.join(', ')} back in the boxes.`);
  }
  camera.snap(player.x, player.y);
}

function enterBackspace() { ensureBackspace(); goToWorld(backspace); }

// The islands you sail between (islands-plan §6). Each far island is built lazily
// the first time you steer for it, from the campaign seed, and registered like the
// Backspace. The greek ship carries you between them via the heading chart below.
let ithaca = null;
function ensureIthaca() {
  if (ithaca) return;
  ithaca = registerWorld(createIthaca(WORLD_SEED));
  ithaca.onEnter = () => {
    if (daemonsDown >= 4) {
      // The true nostos: the war is won and you have come home.
      player.say('The keel grinds up the Ithacan sand. Argos lifts his grey head, and knows you. The machines are all fallen, the sea is quiet, and you are home. This is the end of the road, and the beginning of the rest of it.');
      if (!player._ended && !player.deathCert) {
        player._ended = true;
        player.deathCert = {
          name: player.name, gender: player.gender,
          cause: 'you came home to Ithaca', score: player.score,
          skills: [...player.skills], deaths: player.deaths || 0,
          victory: true, escaped: true, homecoming: true,
        };
      }
    } else {
      player.say("You beach the ship on Ithaca and step ashore. Argos lifts his head and knows you — but the machines still hold the sea, and this is landfall, not yet home. Fell the rest of them, then come back for good.");
    }
    islandWelcome('ithaca');
  };
  // Re-apply this island's own saved state now that it exists (felled
  // obelisks, looted caches, its fortress). Lazy building is why this
  // cannot happen at load: the island had not been made yet.
  applyIslandState(ithaca);
}
let polyphemus = null;
function ensurePolyphemus() {
  if (polyphemus) return;
  polyphemus = registerWorld(createPolyphemus(WORLD_SEED));
  polyphemus.onEnter = () => {
    player.say("The ship grounds on the Cyclopes' shore. Somewhere inland a single vast eye turns, and the land goes taut with knowing you are here. This is POLYPHEMUS.");
    islandWelcome('polyphemus');
  };
  // Re-apply this island's own saved state now that it exists (felled
  // obelisks, looted caches, its fortress). Lazy building is why this
  // cannot happen at load: the island had not been made yet.
  applyIslandState(polyphemus);
}
let circe = null;
function ensureCirce() {
  if (circe) return;
  circe = registerWorld(createCirce(WORLD_SEED));
  circe.onEnter = () => {
    player.say(player.hasMoly()
      ? 'You step onto Aeaea. Something reaches for the shape of you — and slides off. The moly in your pack holds you as you are.'
      : 'You step onto Aeaea. The air is sweet and wrong, and something begins, very gently, to rewrite you. Find moly — it grows where HERMES stands.');
    islandWelcome('circe');
  };
  // Re-apply this island's own saved state now that it exists (felled
  // obelisks, looted caches, its fortress). Lazy building is why this
  // cannot happen at load: the island had not been made yet.
  applyIslandState(circe);
}
let helios = null;
function ensureHelios() {
  if (helios) return;
  helios = registerWorld(createHelios(WORLD_SEED));
  helios.onEnter = () => {
    player.say('The keel grinds up onto Thrinacia in a great flat light. Cattle graze the headland, golden and unafraid. This is HELIOS — and the herd is not yours to take.');
    islandWelcome('helios');
  };
  // Re-apply this island's own saved state now that it exists (felled
  // obelisks, looted caches, its fortress). Lazy building is why this
  // cannot happen at load: the island had not been made yet.
  applyIslandState(helios);
}
// Resolve an island id to its (lazily-built) World.
function worldById(id) {
  if (id === 'calypso') return calypso;
  if (id === 'ithaca') { ensureIthaca(); return ithaca; }
  if (id === 'polyphemus') { ensurePolyphemus(); return polyphemus; }
  if (id === 'circe') { ensureCirce(); return circe; }
  if (id === 'helios') { ensureHelios(); return helios; }
  return null;
}

// The heading chart (islands-plan §10.1): boarding the ship opens a chart of the
// islands you know of; you pick where to steer. Every island but the one you are
// on is offered. (Danger-gated, not locked — you may sail early into a slaughter.)
// The chart's landfalls come from the island registry (game/islands.js), which
// holds each place's Homeric epithet beside everything else that is true of it —
// so a new island appears on the chart by being declared once, not by being
// added to a second list that can drift out of step with the first.
const headingEl = document.getElementById('heading');
const headingListEl = document.getElementById('heading-list');
// Cancelling puts the helm over and rows you back in (headingCancelled), rather
// than just dismissing the modal and leaving you adrift offshore.
document.getElementById('heading-cancel').addEventListener('click', () => headingCancelled());
headingEl.addEventListener('click', (e) => { if (e.target === headingEl) headingCancelled(); });
// The chart the ship opens: pick an island and sail. (The Backspace's alternative
// crossing road, R4, is diegetic doors now — not this chart — so this stays the
// plain sailing chart.)
function openHeadingChart() {
  headingListEl.innerHTML = '';
  for (const c of CROSSINGS) {
    if (c.id === currentWorld.id) continue;
    const btn = document.createElement('button');
    btn.innerHTML = `<span class="place">${c.place}</span><span class="epithet">${c.epithet}</span>`
      + `<span class="desc">${c.desc}</span>`;
    btn.addEventListener('click', () => {
      headingEl.style.display = 'none';
      player.say(`You put the bow toward ${c.place}, and the fog takes the boat.`);
      pendingCrossing = c.id; // performed at the next frame top (see update())
    });
    headingListEl.appendChild(btn);
  }
  headingEl.style.display = 'flex';
}

// A boat crossing switches worlds, which must happen at a clean frame boundary
// (boarding is requested from inside player.update; switching mid-tick and then
// running the rest of an overworld frame against the wrong map is the drawObelisk-
// freeze class of bug). onDepart opens the chart; the chosen id sits in
// pendingCrossing and update() performs the switch at its top. null = nothing queued.
// (pendingCrossing itself is forward-declared up by persist — see the note there.)
// Putting out to sea. You do NOT pick a heading from the sand — you row out
// first, the land slides away behind you and the fog closes ahead, and the chart
// opens from open water. It reframes the choice: not "which island shall I visit"
// off a menu, but a man alone on the water deciding which way to point the bow.
const DEPART_OUT = 5.2;      // seconds of rowing before the chart opens
const DEPART_BACK = 2.0;     // and of rowing home again if you think better of it
// departOut forward-declared up by persist; its shape: { t, sx, sy, dx, dy, dist, charted, returning, boat }

player.onDepart = (p, boat) => {
  if (currentWorld.keeper) sendNokia(nokia, 'sail', { player }); // her last text, as you board to leave
  const dir = seawardFrom(map, p.x, p.y);
  if (!dir || dir.run < 2) { openHeadingChart(); return; } // nowhere to row: chart from where you stand
  departOut = {
    t: 0, sx: p.x, sy: p.y, dx: dir.x, dy: dir.y,
    dist: Math.min(dir.run, 15), charted: false, returning: false,
    bx: boat ? boat.x : Math.round(p.x), by: boat ? boat.y : Math.round(p.y),
    type: boat ? boat.type : 'greek_ship',
    boatProps: boat ? { ...boat } : null,
  };
  if (boat) map.removeObject(boat);           // she rides on player.aboard for the voyage
  lastSailDir = { x: dir.x, y: dir.y };   // the heading this voyage left on
  player.aboard = { type: departOut.type, mirror: boatMirror(dir.x, dir.y), wob: 0 };
  sfx.play('jump');
  p.say('You put out from the beach. The land slides away behind you, and ahead there is only the fog.');
};

// Cancelled the chart while sitting out on the water: come about and row home
// rather than leaving the player marooned in a modal-less void offshore.
function headingCancelled() {
  headingEl.style.display = 'none';
  if (departOut && !departOut.returning) {
    departOut.returning = true;
    departOut.t = 0;
    player.aboard = { type: departOut.type, mirror: boatMirror(-departOut.dx, -departOut.dy), wob: 0 };
    player.say('You let the bow fall off, and pull back for the beach.');
  }
}

// Drive the row out (and, if you change your mind, the row home). Holds the rest
// of the world still, like the failed crossing does.
function updateDepartOut(dt) {
  const d = departOut;
  d.t += dt;
  const ease = (u) => u * u * (3 - 2 * u);
  if (d.returning) {
    const u = Math.min(1, d.t / DEPART_BACK);
    const run = d.dist * (1 - ease(u));
    player.x = d.sx + d.dx * run;
    player.y = d.sy + d.dy * run;
    if (player.aboard) player.aboard.wob = Math.sin(d.t * 6) * 1.4 * (1 - u);
    if (u >= 1) {
      // Ashore again, with the hull put back where it was drawn up.
      player.x = d.sx; player.y = d.sy;
      player.aboard = null;
      if (!map.objectAt(d.bx, d.by)) {
        const o = map.addObject(d.type, d.bx, d.by, d.boatProps || {});
        if (o && d.boatProps) Object.assign(o, d.boatProps, { x: d.bx, y: d.by });
      }
      departOut = null;
      player.say('The keel grates on the sand. Ogygia has you back, for now.');
    }
    return;
  }
  // Outward: the beach falls away and the fog gathers ahead.
  const u = Math.min(1, d.t / DEPART_OUT);
  const run = ease(u) * d.dist;
  player.x = d.sx + d.dx * run;
  player.y = d.sy + d.dy * run;
  if (player.aboard) player.aboard.wob = Math.sin(d.t * 4.4) * 1.6;
  if (!d.charted && d.t >= DEPART_OUT) {
    d.charted = true;
    sfx.play('zap');
    player.say('No land in any direction now. Only the fog, and the choice of a heading.');
    openHeadingChart();
  }
  // A heading was chosen: the crossing itself takes over at the next frame top.
  if (pendingCrossing) { player.aboard = null; departOut = null; }
}

// ---- Scylla and Charybdis: the narrows (docs/islands-odyssey-revision.md §8) ----
// The AEAEA <-> THRINACIA passage runs through a throat of rock, where Homer puts
// them (Od. XII). The crossing is HELD here: you row into the narrows, the sea
// makes you choose which loss to take, and only then do you land. The rules (which
// route, what she can take, how the gamble falls) live in game/strait.js; this owns
// the sequence, the modal, and the narration.
//
// The bargain, translated for a man sailing alone: Scylla takes cargo for certain,
// Charybdis risks the voyage itself. See the module header for why.
const STRAIT_IN = 4.6;    // seconds rowing into the throat before the choice
const STRAIT_OUT = 2.8;   // and of the sea having its way once you have chosen

function beginStrait(fromId, toId) {
  strait = { t: 0, from: fromId, to: toId, phase: 'in', choice: null, outcome: null };
  // You are still in the greek ship you left the island in — put it back under you
  // for the passage (the row-out cleared it when the heading was committed).
  // Face the way the voyage is actually going. This used to be a hardcoded
  // `mirror: true`, so a ship that had sailed west through the narrows was
  // drawn facing east — the hull pointing away from its own course.
  const sd = lastSailDir || seawardFrom(map, player.x, player.y);
  player.aboard = { type: 'greek_ship', mirror: boatMirror(sd.x, sd.y), wob: 0 };
  sfx.play('charge');
  player.say('The open water narrows. Cliffs stand up on either hand, and the channel between them is barely a ship wide. Somewhere ahead the sea is making a noise no sea should make.');
  circeStraitAdvice();
}

// In Homer it is CIRCE who tells Odysseus what the strait is and which loss to
// take: hug Scylla's cliff and lose a few, rather than gamble the ship on
// Charybdis (Od. XII.108-110). So the advice is hers here too — but only if you
// have actually made landfall on Aeaea and met her. Sail the narrows blind and
// you choose blind. Exploration is what buys you the information.
function circeStraitAdvice() {
  if (!player._welcomed || !player._welcomed.circe) return;   // never been to Aeaea
  if (player._straitAdvised) return;                          // she says it once
  player._straitAdvised = true;
  const lines = [
    'YOU ARE IN MY STRAIT.',
    'Two ways, sweetness, and no third. The cliff will take a little of what you carry. The pool may take all of it, and you with it.',
    'Hug the rock. Grieve for the few. Do not be brave here: brave is how the whole ship goes down.',
  ];
  nokia.enqueue('CIRCE', lines);
  for (const l of lines) logSms(player, 'CIRCE', 'them', l);
  phoneBeep();
}

// THE NARROWS, played. The passage used to be a two-button modal: you picked
// your monster once and watched the result. It is an arcade run now — you steer
// the length of it, deciding moment to moment how close to shave Scylla's rock
// against how far you dare drift into Charybdis's pull. Same bargain, made with
// your hands instead of a click. Rules in game/narrows.js.
const NARROWS_TICK = 0.10;          // seconds per row — brisk, but readable
const MAX_CATCHUP = 3;              // rows a single frame may ever advance

// The cabinet owns the screen: the DOM hint sits outside the canvas, so the
// renderer's modal suppression cannot reach it and it has to be hidden here.
function narrowsChrome(on) {
  if (!hintEl) return;
  // Idempotent on the way IN: the run hides the chrome and the GAME OVER card
  // hides it again, and a second stash would record 'none' as the thing to
  // restore — so the hint would never come back for the rest of the session.
  if (on) {
    if (hintEl.dataset.preNarrows === undefined) hintEl.dataset.preNarrows = hintEl.style.display || '';
    hintEl.style.display = 'none';
  }
  else if (hintEl.dataset.preNarrows !== undefined) {
    hintEl.style.display = hintEl.dataset.preNarrows;
    delete hintEl.dataset.preNarrows;
  }
}

function openNarrows() {
  // The bronze ram is fitted if you are carrying it: it is not consumed, because
  // it is bronze bolted to a bow, but its charges are per-run.
  const ram = player.hasItem('ram');
  strait.run = newNarrowsRun({ ram }); // opens on its attract screen; nothing ticks yet
  strait.tickT = 0;
  strait.taken = [];                // what she has had off the deck, for the report
  narrowsChrome(true);
  sfx.play('narrowsTune');
  player.say(ram
    ? 'The channel closes to a throat of rock, and something in the cliff is awake. The old bronze beak is lashed to your bow.'
    : 'The channel closes to a throat of rock, and something in the cliff is awake.');
}

// One head got you: she takes ONE thing off the deck and you sail on. Bites
// accumulate rather than ending the run — you can be nibbled the whole length of
// the strait and still come out the far side, which is the shape David asked for
// and, as it happens, exactly what happens to Odysseus.
function narrowsBite() {
  const toll = scyllaToll(player, Math.random, 1);
  for (const slot of toll) {
    const it = player.getSlot(slot);
    if (!it) continue;
    strait.taken.push(ITEMS[it.item] ? ITEMS[it.item].name : it.item);
    player.setSlot(slot, null);
  }
  player.health = Math.max(1, player.health - 4);
  sfx.play('termerr');
}

// The run is over. Translate it into the outcome the rest of the strait already
// understands, so finishStrait needs no special case.
function endNarrows(outcome) {
  const s = strait;
  s.gameover = null;
  narrowsChrome(false);
  const hull = (s.run && s.run.rocks) || 0;   // read before the run is cleared
  // The ram is a consumable: run it down to nothing and the beak is torn off the
  // bow. Only if you actually brought one — a beak fished out of the channel was
  // never an item and has nothing to take away.
  if (s.run && s.run.ramSpent && player.hasItem('ram')) {
    player.removeItem('ram');
    player.say('The bronze beak is gone, wrenched off her bow somewhere back in the rock. You will want another before you try that again.');
  }
  s.run = null;
  s.t = 0;
  s.phase = 'out';
  s.outcome = outcome === 'swallowed' ? 'swallowed' : 'scylla';
  if (outcome === 'wrecked') {
    // The hull is gone: she breaks up under you and the crossing is lost, the
    // same as being taken. A run you cannot finish now ends instead of grinding.
    s.outcome = 'swallowed';        // finishStrait already knows how to put you back
    player.health = Math.max(1, player.health - STRAIT_COST.mauled.hurt);
    sfx.play('zap');
    player.say('One rock too many. The keel goes, and the sea comes in through the whole length of her — you are swimming, and the current is carrying you back the way you came.');
    return;
  }
  if (outcome === 'swallowed') {
    s.outcome = 'swallowed';
    player.health = Math.max(1, player.health - STRAIT_COST.swallowed.hurt);
    sfx.play('zap');
    player.say('The water stops being there. You go down with it and come up spitting, clinging to a piece of your own boat, and the current is carrying you back the way you came.');
    return;
  }
  // Through. What it cost depends entirely on how well you steered.
  if (!s.taken.length) {
    sfx.play('narrowsWin');
    player.say(hull
      ? `Through, with nothing taken — though the rocks had ${hull === 1 ? 'a piece' : 'pieces'} of the hull on the way past.`
      : 'The rock falls away astern and the water goes quiet. Six mouths, two of them hers, and not one of them touched you. Nobody gets through the narrows clean. You just did.');
  } else {
    player.health = Math.max(1, player.health - 2);
    sfx.play('termerr');
    player.say(`You are through. She had ${listPhrase(s.taken)} off the deck on the way past${hull ? `, and the hull is stove in where the rocks caught you` : ''}, and the water goes quiet.`);
  }
}

// THE GAME OVER CARD. The run used to resolve the instant it ended: one frame you
// were steering, the next you were back in the world reading a line of prose
// about it. A cabinet owes you the moment. The field freezes, the card comes up
// over it with what the passage cost, and nothing resolves until you press
// something — so the ending is read rather than glimpsed.
// Long enough that a key you were already leaning on cannot carry you straight
// through the card. At 0.9s the tally was being skipped by accident, which
// defeats the whole point of stopping to show it.
const GAMEOVER_HOLD = 2.2;

function finishRun(outcome) {
  const s = strait;
  s.gameover = { outcome, t: 0 };
  narrowsChrome(true);              // keep the world's chrome out of the card
  sfx.play(outcome === 'through' ? 'narrowsWin' : 'termerr');
}

// Waiting on the card. Returns true while it still owns the screen.
function updateGameOver(dt) {
  const s = strait, g = s.gameover;
  g.t += dt;
  s.run.t = (s.run.t || 0) + 1;     // the card blinks, so the run's clock keeps going
  // The ENTER button does not even appear until the hold is up, so there is
  // nothing to hit early and the card cannot be skipped before it is read.
  g.ready = g.t >= GAMEOVER_HOLD;
  if (!g.ready) return true;
  // ENTER specifically, not any key: a named key and a drawn button are the two
  // things a player can deliberately aim at.
  const pressed = input.consumePress('Enter') || input.consumePress('NumpadEnter');
  const at = input.clickPos();
  const r = g.enterRect;            // stamped by the card as it draws itself
  const hit = at && r && at.x >= r.x && at.x <= r.x + r.w && at.y >= r.y && at.y <= r.y + r.h;
  if (pressed || hit) {
    if (hit) input.consumeClick();
    s.gameover = null;
    endNarrows(g.outcome);
    return false;
  }
  return true;
}

// Drive the run: a fixed tick so the channel scrolls at a readable rate whatever
// the frame rate, with steering read from held keys (and the touch halves).
function updateNarrows(dt) {
  const s = strait, n = s.run;
  if (s.gameover) { updateGameOver(dt); return; }
  n.t = (n.t || 0) + 1;
  // ATTRACT: the cabinet waits. Any key, or a tap anywhere, is the coin. Read
  // as an edge rather than a held state so the keypress that opened the strait
  // cannot roll straight through the title card without being seen.
  if (n.attract) {
    // Space/Enter is the coin slot; a steering key works too, since reaching for
    // the helm is the same gesture as starting. (There is no any-key API, and
    // inventing one for this would be a lot of surface for one title card.)
    const coin = ['Space', 'Enter', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
      .some((k) => input.consumePress(k));
    const tapped = !!input.clickPos();
    if (coin || tapped) {
      if (tapped) input.consumeClick();
      if (narrowsStart(n)) { sfx.play('coin'); player.say('Steer.'); }
    }
    return;
  }
  // Steering is HELD, not tapped, so you can lean on a direction and hold a line
  // against the pull. moveIntent() already folds the keyboard and a dragged
  // finger into one screen-space vector, so the helm works the same on a desk
  // and on a phone without a second code path.
  const mv = input.moveIntent();
  const dir = mv && mv.dx < -0.35 ? -1 : mv && mv.dx > 0.35 ? 1 : 0;
  if (dir) {
    s.steerT = (s.steerT || 0) + dt;
    if (s.steerT >= 0.07) { s.steerT = 0; narrowsSteer(n, dir); }
  } else s.steerT = 0;
  // And fore-and-aft, on its own slower repeat: rowing up the channel or backing
  // off is a manoeuvre, not a twitch, and at the lateral rate you would cross
  // the whole playfield before you had seen what you were rowing into.
  const fwd = mv && mv.dy < -0.35 ? -1 : mv && mv.dy > 0.35 ? 1 : 0;
  if (fwd) {
    s.rowT = (s.rowT || 0) + dt;
    if (s.rowT >= 0.12) { s.rowT = 0; narrowsRow(n, fwd); }
  } else s.rowT = 0;

  // Fixed-timestep catch-up, but CAPPED. Unbounded, a single long frame (a
  // stall, a backgrounded tab, anything that lets dt pile up) would run dozens
  // of rows in one go and Scylla would strip the whole pack between two drawn
  // frames — with no chance to steer out of it. Better to let the channel slip
  // than to bill you for time you never got to play.
  s.tickT = Math.min(s.tickT + dt, NARROWS_TICK * MAX_CATCHUP);
  let steps = 0;
  while (s.tickT >= NARROWS_TICK && !n.over && steps < MAX_CATCHUP) {
    s.tickT -= NARROWS_TICK;
    steps += 1;
    const ev = narrowsTick(n);
    if (ev === 'wrecked') { finishRun('wrecked'); return; }
    if (ev === 'rock') {
      // Hull, not cargo — a rock is neither of them. It costs you health and a
      // jolt, and its real job is to move you off the safe column.
      player.health = Math.max(1, player.health - 6);
      sfx.play('clang');
    } else if (ev === 'shatter') {
      // The ram took it. No hull, no health, and the rock still made you flinch.
      sfx.play('clang');
      if (n.ram === 0) player.say('The beak takes the last of it and rings hollow. Nothing left between you and the stone.');
    } else if (ev === 'pickup') {
      // The sea gives something back. Named out loud, because a silent +1 on a
      // pip row is not a reward you can feel.
      sfx.play('pickup');
      player.say(n.lastPick === 'timber'
        ? 'A spar off some earlier ship comes past on the swell. You get a hand to it and drag it aboard: one plank between you and the water.'
        : 'A broken beak, green with the sea, rolling in the wash. It is not yours and it fits well enough.');
    } else if (ev === 'churn') {
      // Her outer water: it batters the hull and throws you clear. Not the end
      // of anything, which is the point of the change.
      player.health = Math.max(1, player.health - 8);
      sfx.play('zap');
    } else if (ev === 'bite') narrowsBite();
    else if (ev === 'swallowed') { finishRun('swallowed'); return; }
    else if (ev === 'through') { finishRun('through'); return; }
  }
  // Presentation LAST, from whatever is left of the accumulator. Doing this
  // before the tick loop was the jump: on the frame a tick fired, the picture
  // was drawn with the old fraction (≈1, a whole cell down) against rows that
  // had already shifted — so the channel snapped back a cell, ten times a
  // second. The rules run on whole rows; only this decides where they are drawn.
  narrowsAnimate(n, dt, s.tickT / NARROWS_TICK);
}

// ---- CALYPSO's pong: the game you cannot win (game/calypso-pong.js) ---------
const PONG_GAMEOVER_HOLD = 1.6;   // a beat to read the release before ENTER dismisses it
function openPong(escape = false) {
  // `escape` = the real sanctum run: winning (leaving) refunctions Calypso. Without
  // it (the lyre preview) the cabinet just closes.
  pong = { run: newCalypsoPong(), gameover: null, escape: !!escape, testOnly: !escape };
  narrowsChrome(true);            // borrow the narrows' chrome-hide; the cabinet owns the screen
  sfx.play('narrowsTune');
  player.say('Her terminal does not ask for a password. It offers a game.');
}
function endPong(outcome) {
  const p = pong;
  p.gameover = { outcome, t: 0, ready: false };
  sfx.play(outcome === 'left' ? 'narrowsWin' : 'termerr');
}
function closePong() {
  const p = pong;
  pong = null;
  narrowsChrome(false);
  const won = !!(p.gameover && p.gameover.outcome === 'left');
  // The real sanctum run: choosing to LEAVE (outcome 'left') IS the refunction —
  // her hold on the tide breaks, the guards lay down arms, the golden axe is yours.
  // Break off without leaving and she simply keeps you; come back and play again.
  if (p.escape) {
    if (won) {
      const res = refunctionCalypso();
      if (res.say) player.say(res.say);
      player.say('The volley stops. Somewhere under the island a door you never saw swings open. You are free to go.');
    } else {
      player.say('You break off before it drifts past. Her volley resumes, gentle and endless. She keeps you yet.');
    }
    return;
  }
  // Lyre preview: no consequence, just back to the world.
  player.say('The cabinet goes dark. You are back where you were.');
}
function updatePong(dt) {
  const s = pong, g = s.run;
  g.t = (g.t || 0) + 1;
  // GAME OVER card: hold, then ENTER (key or the drawn button) dismisses.
  if (s.gameover) {
    const go = s.gameover;
    go.t += dt;
    go.ready = go.t >= PONG_GAMEOVER_HOLD;
    if (!go.ready) return;
    const pressed = input.consumePress('Enter') || input.consumePress('NumpadEnter');
    const at = input.clickPos();
    const r = go.enterRect;
    const hit = at && r && at.x >= r.x && at.x <= r.x + r.w && at.y >= r.y && at.y <= r.y + r.h;
    if (pressed || hit) { if (hit) input.consumeClick(); closePong(); }
    return;
  }
  // ATTRACT: any key or a tap is the coin.
  if (g.attract) {
    const coin = ['Space', 'Enter', 'KeyW', 'KeyS', 'ArrowUp', 'ArrowDown']
      .some((k) => input.consumePress(k));
    const tapped = !!input.clickPos();
    if (coin || tapped) { if (tapped) input.consumeClick(); if (calypsoStart(g)) { sfx.play('coin'); } }
    return;
  }
  // Steer the paddle up/down, held. The one moveIntent() path, so keyboard and a
  // dragged finger both drive it — exactly like the narrows helm.
  const mv = input.moveIntent();
  const dir = mv && mv.dy < -0.35 ? -1 : mv && mv.dy > 0.35 ? 1 : 0;
  if (dir) calypsoMove(g, dir);
  const ev = calypsoTick(g, dt);
  if (ev === 'return') sfx.play('blip');
  else if (ev === 'left') endPong('left');
}

// The sea is done with you: land where the outcome says. 'swallowed' loses the
// crossing and throws you back at the island you left — the unbounded end of the
// bargain, and the reason the certain toll is worth taking.
function finishStrait() {
  const s = strait;
  strait = null;
  player.aboard = null;
  // A lyre test loop returns you to where you were, whatever the sea did.
  const backwards = s.testOnly || s.outcome === 'swallowed';
  const dest = worldById(backwards ? s.from : s.to);
  if (dest) { goToWorld(dest, { beach: true }); sfx.play('zap'); }
  if (backwards) player.say('The sea puts you back on the beach you sailed from. The strait is still there, and still wants paying.');
}

function updateStrait(dt) {
  const s = strait;
  s.t += dt;
  // Rolling on through the throat while the sea decides what it is going to do.
  if (player.aboard) player.aboard.wob = Math.sin(s.t * 5) * 1.7;
  if (s.phase === 'in') {
    if (s.t >= STRAIT_IN) { s.phase = 'choice'; s.t = 0; openNarrows(); }
    return;
  }
  // In the narrows: the arcade run has the helm until it resolves.
  if (s.phase === 'choice') { if (s.run) updateNarrows(dt); return; }
  if (s.t >= STRAIT_OUT) finishStrait();
}

// "a, b and c" — for reading back what Scylla took.
function listPhrase(items) {
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

// ---- The Nokia 3310: Calypso's channel on Ogygia (docs/calypso-nokia-plan.md) ----
// She is not your enemy — POSEIDON's machines roam the island; she is the keeper
// who texts you warnings, tips, and pleas, and (while her hold is not cold) freezes
// one of his robots bearing down on you. The queue + tables live in game/nokia.js;
// this drives the triggers, the beep, and the interventions on the keeper world.
const nokia = createNokia();

// The dead network still runs its billing. Land anywhere new and your carrier —
// which is the thing that ate the world — pushes a roaming welcome to the
// handset, in the flat cheerful register of a company that no longer has
// customers, only subjects. Fired once per island (per run) from onEnter.
const ISLAND_WELCOME = {
  // Ogygia's is the odd one out: the carrier boilerplate, but the first line is
  // HERS. She owns the island and the cell on it, and the possessive slips
  // through the corporate voice before it catches itself.
  calypso: ['Welcome to my island.', 'Your roaming plan includes unlimited time and nowhere to spend it. Calls home cannot be connected. Enjoy your stay.'],
  polyphemus: ['Welcome to AEGILIA.', 'Coverage on this island is provided by a single cell. It has already seen you. Data is unmetered, as nothing you send will leave.'],
  circe: ['Welcome to AEAEA.', 'Your account has been reclassified: tariff LIVESTOCK. Person rates no longer apply. Thank you for grazing with us.'],
  helios: ['Welcome to THRINACIA.', 'Signal here is provided by the Sun and is therefore total. There is no roaming, only being seen. Charges for touching the cattle are ∞ per head.'],
  ithaca: ['Welcome to ITHACA.', 'You are in your home region; no roaming charges apply. You have 1 missed call. It is twenty years old. Would you like to return it?'],
};
function islandWelcome(id) {
  const w = ISLAND_WELCOME[id];
  if (!w) return;
  player._welcomed = player._welcomed || {};
  if (player._welcomed[id]) return;   // once per island per run
  player._welcomed[id] = true;
  nokia.enqueue('ROAMING', w);
  phoneBeep();
}

// ---- POSEIDON's countdown, as texts rather than a HUD number ----------------
// The deadline used to sit in the corner of the dashboard as a ticking clock,
// which is wallpaper inside a minute. It arrives as automated pre-activation
// notices instead: the system scheduling its own waking, in the same flat
// corporate register as the roaming welcomes, and getting shorter and colder as
// the hours run out. Network-wide, so unlike Calypso's channel these reach you
// on every island — POSEIDON is the network; it does not need your carrier.
const POSEIDON_WARNINGS = [
  { at: 18, lines: ['SCHEDULED: POSEIDON completes in 18 hours.', 'No action is required of you. No action is available to you.'] },
  { at: 12, lines: ['POSEIDON completes in 12 hours.', 'Your position has been noted and filed. Thank you for your continued presence.'] },
  { at: 6,  lines: ['SIX HOURS.', 'The towers are being brought to readiness. You are advised to be elsewhere. There is no elsewhere.'] },
  { at: 3,  lines: ['THREE HOURS.', 'Every obelisk still standing will wake at once, and they will all be looking the same way. Count what you have left standing.'] },
  { at: 1,  lines: ['ONE HOUR.'] },
  { at: 0.5, lines: ['THIRTY MINUTES.', 'The sea is already rising. You can hear it from wherever you are.'] },
];
function poseidonWarnings() {
  const left = dayNight.hoursLeft();
  if (left <= 0) return;                       // it has woken; the purge speaks for itself
  player._poseidonSaid = player._poseidonSaid || [];
  for (const w of POSEIDON_WARNINGS) {
    if (left > w.at || player._poseidonSaid.includes(w.at)) continue;
    player._poseidonSaid.push(w.at);
    nokia.enqueue('POSEIDON', w.lines);
    for (const l of w.lines) logSms(player, 'POSEIDON', 'them', l);
    phoneBeep();
    break;                                     // one threshold per frame at most
  }
}

const NOKIA_DANGER_R = 6;   // she'll still one of his machines within this of you
const NOKIA_SCAN = 0.5;     // seconds between intervention scans (cheap)
let nokiaScanT = 0, nokiaIvCooldown = 0;

function updateNokiaKeeper(dt) {
  const ctx = { player };
  sendNokia(nokia, 'landfall', ctx);

  // Her hold on you IS her protection of you: it drifts UP while you linger inland,
  // and DOWN while you loiter by a beached vessel — and each leaving-signal steps
  // it down once, tied to the text that marks it.
  const nearVessel = map.objects.some((o) => (o.type === 'boat' || o.type === 'greek_ship')
    && Math.hypot(o.x + 0.5 - player.x, o.y + 0.5 - player.y) < 6);
  if (nearVessel) holdFall(player, 0.01 * dt); else holdRise(player, 0.005 * dt);
  const parts = ['oar', 'rope', 'sail'].reduce((n, p) => n + (player.hasItem(p) ? 1 : 0), 0);
  if (parts > (player._nokiaParts || 0)) { holdFall(player, 0.05 * (parts - (player._nokiaParts || 0))); player._nokiaParts = parts; }
  if (player.boatBuilt && sendNokia(nokia, 'boatCrafted', ctx)) holdFall(player, 0.15);
  if (player.hasItem('golden_axe') && sendNokia(nokia, 'axeGranted', ctx)) holdFall(player, 0.25);
  if (player.shipBuilt && sendNokia(nokia, 'shipCrafted', ctx)) holdFall(player, 0.20);

  // Ambient one-shot triggers (sendNokia is idempotent for `once` texts).
  if (dayNight.isNight && dayNight.isNight()) sendNokia(nokia, 'nightfall', ctx);
  if (player.maxHealth && player.health / player.maxHealth < 0.35) sendNokia(nokia, 'lowHP', ctx);
  if (player.weaponsFound && player.weaponsFound.size > 1) sendNokia(nokia, 'firstWeapon', ctx);
  const hostiles = currentWorld.robots.filter((r) => !r.dead && !r.fused && !r.friendly);
  if (hostiles.some((r) => Math.hypot(r.x - player.x, r.y - player.y) < 10)) sendNokia(nokia, 'firstHostile', ctx);
  if (currentWorld.obeliskObjs.some((o) => !o.destroyed && Math.hypot(o.x + 0.5 - player.x, o.y + 0.5 - player.y) < 6)) sendNokia(nokia, 'firstObelisk', ctx);

  // Her interventions: while her hold is not cold, reach out and freeze one of his
  // machines closing on you — her indigo over his amber. Cooldown scales with how
  // warm she is; below HOLD_COLD she does nothing (you lose her when you need her).
  if (nokiaIvCooldown > 0) nokiaIvCooldown -= dt;
  nokiaScanT += dt;
  if (nokiaScanT >= NOKIA_SCAN) {
    nokiaScanT = 0;
    const hold = player.calypsoHold ?? 0.65;
    if (hold >= HOLD_COLD && nokiaIvCooldown <= 0) {
      const target = hostiles.find((r) => r.aggro && (r.disabledT || 0) <= 0
        && Math.hypot(r.x - player.x, r.y - player.y) < NOKIA_DANGER_R);
      if (target) {
        target.disabledT = 5;
        target.stunColor = '#4b5cc4';
        nokiaIvCooldown = hold >= 0.85 ? 40 : hold >= HOLD_WARM ? 60 : 120;
        if (!sendNokia(nokia, 'firstIntervention', ctx)) sendNokia(nokia, 'intervention', ctx);
        player._nokiaIvIdx = (player._nokiaIvIdx || 0) + 1;
        sfx.play('zap');
      }
    }
  }
}

// Signal strength, 0–4 bars: it is HER network, so the bars are a compass to her.
// Full beside the core, fading across Ogygia, and dead the moment you are on any
// other island (the NO SIGNAL text made literal). Drawn live on the PHONE box, the
// SMS toast, and the handset's own status row.
// It is the ruling daemon's network your handset joins, so signal is a compass to
// that island's core: full beside it, fading with distance, and dead on an island
// with no daemon at all (Ithaca, the Backspace). This used to be CALYPSO-only;
// now every daemon can reach you on their own ground.
function nokiaSignalBars() {
  if (!currentWorld.combat || !fortress || !fortress.core) return 0;
  const d = Math.hypot(player.x - fortress.core.x, player.y - fortress.core.y);
  return d < 30 ? 4 : d < 60 ? 3 : d < 95 ? 2 : 1;
}

// ---- The handset itself: click the PHONE box, the screen opens (SMS both ways) --
const phoneEl = document.getElementById('nokiaphone');
const phThreadEl = document.getElementById('ph-thread');
const phInputEl = document.getElementById('ph-input');
const phBarsEl = document.getElementById('ph-bars');
const phToCal = document.getElementById('ph-to-calypso');
const phToRon = document.getElementById('ph-to-ron');
const phToSnake = document.getElementById('ph-to-snake');
const phSnakeEl = document.getElementById('ph-snake');
const phInputRowEl = phoneEl.querySelector('.ph-inputrow');
const phHintEl = phoneEl.querySelector('.ph-hint');
let phoneTo = 'CALYPSO';      // which thread is up ('SNAKE' = the game, not a thread)
let _phReplyTimer = null;

// ---- Snake (src/game/snake.js): the 3310 without Snake is half a phone ----
let snakeGame = null;         // live game state while the SNAKE tab is up
let _snakeTimer = null;       // its tick interval (only runs while visible)
function snakeStop() {
  clearInterval(_snakeTimer);
  _snakeTimer = null;
  snakeGame = null;
}
function snakeStart() {
  snakeGame = newSnakeGame();
  const ctx2 = phSnakeEl.getContext('2d');
  drawSnake(ctx2, snakeGame, player.snakeHigh || 0);
  clearInterval(_snakeTimer);
  _snakeTimer = setInterval(() => {
    if (!snakeGame || snakeGame.dead) return;
    if (snakeTick(snakeGame)) sfx.play('keydrop');       // the feed blip
    if (snakeGame.dead) {
      sfx.play('termerr');
      if ((snakeGame.score || 0) > (player.snakeHigh || 0)) player.snakeHigh = snakeGame.score;
    }
    drawSnake(ctx2, snakeGame, player.snakeHigh || 0);
  }, 130);
}

// Whichever daemon rules the island you are on is the phone's first contact —
// it is their network the handset is on here. CALYPSO on Ogygia, POLYPHEMUS on
// Aegilia, and so on; on an island with no daemon (Ithaca, the Backspace) the
// first tab falls back to CALYPSO's dormant thread so the button is never blank.
function phoneDaemon() {
  const ai = islandAiName();
  return hasDaemonSms(ai) || ai === 'CALYPSO' ? ai : 'CALYPSO';
}

function renderPhone() {
  const bars = nokiaSignalBars();
  phBarsEl.textContent = '▂▄▆█'.slice(0, bars) || '·';
  phBarsEl.style.opacity = bars ? 1 : 0.45;
  // The first tab tracks the island's daemon. If the open thread is a daemon
  // that no longer rules here (you sailed), snap it to the current one.
  const daemon = phoneDaemon();
  if (phoneTo !== 'RON' && phoneTo !== 'SNAKE' && phoneTo !== daemon) phoneTo = daemon;
  phToCal.textContent = daemon;
  phToCal.classList.toggle('on', phoneTo === daemon);
  phToRon.classList.toggle('on', phoneTo === 'RON');
  phToSnake.classList.toggle('on', phoneTo === 'SNAKE');
  // The SNAKE tab swaps the whole message surface for the game screen.
  const snakeUp = phoneTo === 'SNAKE';
  phThreadEl.style.display = snakeUp ? 'none' : '';
  phInputRowEl.style.display = snakeUp ? 'none' : '';
  phSnakeEl.style.display = snakeUp ? 'block' : '';
  phHintEl.textContent = snakeUp
    ? 'Arrows to steer · tap left/right half to turn · Esc or ✕ to close'
    : 'Enter to send · Esc, ✕, or a click off the screen to close';
  if (snakeUp) {
    if (!snakeGame) snakeStart();
    return;
  }
  snakeStop();
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const thread = (player.nokiaLog || []).filter((m) => m.th === phoneTo);
  phThreadEl.innerHTML = thread.length
    ? thread.map((m) => {
      const who = m.from === 'you' ? 'you' : m.from === 'sys' ? 'sys' : 'them';
      // A small header over each incoming or sent message — who + when — then a
      // hairline under the bubble, so one sender's texts read apart from the next.
      const label = m.from === 'you' ? 'You' : (m.th === 'RON' ? 'RON' : m.th);
      const stamp = m.at ? ` · ${m.at}` : '';
      const meta = m.from === 'sys' ? '' : `<div class="ph-meta ph-meta-${who}">${label}${stamp}</div>`;
      return `${meta}<div class="ph-${who}">${esc(m.text)}</div><div class="ph-sep"></div>`;
    }).join('')
    : `<div class="ph-sys">${phoneTo === 'RON'
      ? 'No traffic. The RON mesh keeps this channel open for whoever is still out there.'
      : phoneTo === 'CALYPSO'
        ? 'No messages yet. She is waiting for you to write first, and has been for years.'
        : `You are on ${phoneTo}'s network now. Text, and see if it answers.`}</div>`;
  phThreadEl.scrollTop = phThreadEl.scrollHeight;
}
function openPhone() {
  phoneEl.style.display = 'flex';
  renderPhone();
  phInputEl.value = '';
  if (phoneTo !== 'SNAKE') phInputEl.focus();
}
function closePhone() {
  phoneEl.style.display = 'none';
  phInputEl.blur();
  snakeStop();
}
function phoneSend() {
  const text = phInputEl.value.trim();
  if (!text) return;
  phInputEl.value = '';
  const bars = nokiaSignalBars();
  logSms(player, phoneTo, 'you', text);
  if (!bars) {
    // Her network doesn't reach here — the message dies in the outbox.
    logSms(player, phoneTo, 'sys', 'NO SIGNAL — message not sent');
    sfx.play('termerr');
    renderPhone();
    return;
  }
  sfx.play('keydrop');
  renderPhone();
  // Texting her is attention, and attention is what she keeps you with.
  if (phoneTo === 'CALYPSO') holdRise(player, 0.02);
  const sms = smsCtx();
  const to = phoneTo;
  player._phSmsIdx = (player._phSmsIdx || 0) + 1;
  const reply = to === 'CALYPSO'
    ? calypsoSms(text, holdBand(player.calypsoHold ?? 0.65), player._phSmsIdx, sms)
    : to === 'RON'
      ? ronSms(text, player._phSmsIdx, sms)
      // A martial daemon has its own voice and does you no favours; anything it
      // has no line for falls through to the mesh, which does answer questions.
      : (daemonSms(to, text, player._phSmsIdx) || ronSms(text, player._phSmsIdx, sms));
  clearTimeout(_phReplyTimer);
  _phReplyTimer = setTimeout(() => {
    logSms(player, to, 'them', reply);
    phoneBeep();
    if (phoneEl.style.display === 'flex') renderPhone();
  }, 1100 + Math.random() * 900);
}
phToCal.addEventListener('click', () => { phoneTo = phoneDaemon(); renderPhone(); phInputEl.focus(); });
phToRon.addEventListener('click', () => { phoneTo = 'RON'; renderPhone(); phInputEl.focus(); });
phToSnake.addEventListener('click', () => { phoneTo = 'SNAKE'; renderPhone(); phInputEl.blur(); });
document.getElementById('ph-send').addEventListener('click', phoneSend);
// Phone mute: silence the SMS beep. Toggled from the bell in the phone's status
// bar; persisted, so it survives a reload. Every SMS chime routes through
// phoneBeep() below so this one flag covers them all.
let phoneMuted = false;
try { phoneMuted = localStorage.getItem('nostos_phone_muted') === '1'; } catch { /* storage blocked */ }
function phoneBeep() { if (!phoneMuted) sfx.play('sms'); }

// WHAT THE HANDSET CAN REACH.
//
// nokia.js holds the commands and none of the world: it does not read the map,
// the robots or the clock, it asks. Same rule the terminals follow — the caller
// answers questions, the module never reaches in — so the reply tables stay
// testable with a stub and the phone cannot quietly grow a second copy of the
// game's state.
//
// Calypso's half ACTS and charges hold for it. RON's half only ever LOOKS
// THINGS UP, which is why none of its entries touch anything.
function smsCtx() {
  const near = (list, ok) => {
    let best = null, bd = Infinity;
    for (const o of list || []) {
      if (ok && !ok(o)) continue;
      const d = Math.hypot((o.x ?? o.x0) - player.x, (o.y ?? o.y0) - player.y);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  };
  const bearing = (o) => (o ? bearingText(player, { x: o.x ?? (o.x0 + o.w / 2), y: o.y ?? (o.y0 + o.h / 2) }) : null);
  const byName = (q) => {
    const s = String(q || '').trim().toLowerCase().replace(/[?.!]+$/, '');
    if (!s) return null;
    // By key first, then by display name, then by a name that contains it — so
    // "wifi block", "Wi-Fi block" and "wifiblock" all land on the same thing.
    if (ITEMS[s]) return ITEMS[s];
    const flat = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const want = flat(s);
    const all = Object.entries(ITEMS);
    const exact = all.find(([k, d]) => flat(k) === want || flat(d.name) === want);
    if (exact) return exact[1];
    const part = all.find(([, d]) => flat(d.name).includes(want) && want.length >= 3);
    return part ? part[1] : null;
  };
  return {
    holdRise: (amt) => holdRise(player, amt),
    // ---- hers: she does things, and each costs you ----
    sleepNearby: (mins) => {
      let n = 0;
      for (const r of currentWorld.robots || []) {
        if (r.dead || r.friendly || r.fused) continue;
        if (Math.hypot(r.x - player.x, r.y - player.y) > RONML_SOFT_RANGE) continue;
        r.disabledT = Math.max(r.disabledT || 0, mins);
        r.aggro = false;
        n++;
      }
      return n;
    },
    thinFog: () => { obFogHold = { level: 'low', t: OB_HOLD }; },
    toShelter: () => bearing(near(map.buildings)),
    leaveFood: () => {
      const b = near(map.buildings);
      if (!b) return null;
      const fx = b.x0 + b.w / 2, fy = b.y0 + b.h / 2;
      // Only once per house, or texting HUNGRY on a loop is a food printer.
      if (b._calFood) return null;
      b._calFood = true;
      map.groundItems.push({ item: 'meat', qty: 1, x: fx, y: fy, keep: true });
      map.groundItems.push({ item: 'berries', qty: 2, x: fx + 0.4, y: fy, keep: true });
      return bearingText(player, { x: fx, y: fy });
    },
    whereAmI: () => {
      const tx = Math.floor(player.x), ty = Math.floor(player.y);
      const inside = map.buildingAt ? map.buildingAt(tx, ty) : null;
      if (inside) return `inside one of the old houses on ${hudPlace()}`;
      const high = map.heightAt && map.heightAt(tx, ty) > 0;
      return `${high ? 'on high ground' : 'out in the open'} on ${hudPlace()}`;
    },
    // ---- theirs: they only know things ----
    toCache: () => bearing(near(map.objects, (o) => o.type === 'box' && !o.opened)),
    toRelay: () => bearing(near(torObjs)),
    toCover: () => bearing(near(map.objects, (o) => o.type === 'tree' || o.type === 'rock' || o.type === 'fortwall')),
    status: () => {
      const obs = currentWorld.obeliskObjs || [];
      return {
        live: obs.filter(obeliskLive).length,
        total: obs.length,
        factory: factoryLive(),
        hours: Math.max(0, Math.round(dayNight.hoursLeft())),
      };
    },
    manualOn: (q) => { const d = byName(q); return d ? `${d.name}: ${d.use || 'no field note on that one.'}` : null; },
    recipeOf: (q) => { const d = byName(q); return d ? (d.built || '') : null; },
  };
}
const phMuteEl = document.getElementById('ph-mute');
function syncPhoneMute() {
  if (!phMuteEl) return;
  // The glyph never changes — a plain LCD note, in the screen's own dark-on-green.
  // Silent mode is the struck-through state (CSS .muted), not a different, louder
  // icon: an emoji bell rendered as a full-colour sticker on a monochrome display.
  phMuteEl.classList.toggle('muted', phoneMuted);
  phMuteEl.title = phoneMuted ? 'Silent — click for sound' : 'Sound on — click for silent';
  phMuteEl.setAttribute('aria-label', phoneMuted ? 'Silent mode on' : 'Sound on');
  phMuteEl.setAttribute('aria-pressed', phoneMuted ? 'true' : 'false');
}
if (phMuteEl) {
  syncPhoneMute();
  phMuteEl.addEventListener('click', (e) => {
    e.stopPropagation();
    phoneMuted = !phoneMuted;
    try { localStorage.setItem('nostos_phone_muted', phoneMuted ? '1' : '0'); } catch { /* storage blocked */ }
    syncPhoneMute();
  });
}
phInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') phoneSend();
  else if (e.key === 'Escape') closePhone();
  e.stopPropagation();
});
// Click anywhere off the SCREEN — the backdrop, the phone's own body, even
// the sprite's transparent margins (which used to swallow backdrop clicks
// without closing) — and the phone goes back in the pocket. Only the live
// LCD keeps the tap.
phoneEl.addEventListener('click', (e) => { if (!e.target.closest('.ph-lcd')) closePhone(); });
// The X on the screen itself: the reliable way out on touch, where there is
// no Esc key (same pattern as the notebook's close).
document.getElementById('ph-close').addEventListener('click', closePhone);
// Snake's keys, captured on the way down so the game's own input (input.js,
// bubble phase on window) never sees them — arrows/WASD steer the snake, not
// the castaway. Any key restarts after GAME OVER; Esc puts the phone away.
const SNAKE_KEYS = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
};
window.addEventListener('keydown', (e) => {
  if (phoneEl.style.display !== 'flex' || phoneTo !== 'SNAKE') return;
  if (e.metaKey || e.ctrlKey || e.altKey) return; // browser shortcuts stay the browser's
  e.preventDefault();
  e.stopPropagation();
  if (e.key === 'Escape') { closePhone(); return; }
  if (!snakeGame) return;
  if (snakeGame.dead) { snakeStart(); return; }
  const dir = SNAKE_KEYS[e.code];
  if (dir) snakeTurn(snakeGame, dir);
}, true);
// Touch steering: tap the left half of the screen to turn anticlockwise, the
// right half clockwise (the two-button Snake of thumb memory). A tap restarts
// after GAME OVER.
phSnakeEl.addEventListener('pointerdown', (e) => {
  if (!snakeGame) return;
  e.preventDefault();
  if (snakeGame.dead) { snakeStart(); return; }
  const r = phSnakeEl.getBoundingClientRect();
  snakeTurnRelative(snakeGame, (e.clientX - r.left) > r.width / 2);
});

// ---- HERMES test console ---------------------------------------------------
// Type "hermes" anywhere in-game and this opens: jump between islands, conjure
// items, arm the escape chain, and skip the parts you are not testing. It is a
// DEVELOPMENT TOOL, deliberately plain-looking so it can never be mistaken for a
// diegetic screen, and it is opened by a typed word rather than a key so it
// cannot be found by accident.
//
// Nothing here reimplements game logic: jumps go through goToWorld/worldById
// (so islands build lazily exactly as they do when you sail), items go through
// player.stow, arming writes the same player.virusArmed the forge writes.
// The knock. "hermes" was a bad choice: h opens the help panel, e uses, r reads,
// m cycles the music — typing it set half the game off. Only three letters in the
// alphabet are unbound (l, u, y), which is too few to spell much with, so instead
// the word must merely BEGIN with a free letter: the first keypress arms a
// capture, and every key after it is swallowed before input.js can see it. So
// `lyre` costs one harmless `l` if you mistype, and nothing fires either way.
const DEV_WORD = 'lyre';
const DEV_CAPTURE_MS = 2000;   // abandon a half-typed word after this
let _devTyped = '';
let _devTypedAt = 0;
const devEl = document.getElementById('devbox');
const devOutEl = document.getElementById('dev-out');
const devInputEl = document.getElementById('dev-input');

function devPrint(...lines) {
  for (const l of lines) {
    const d = document.createElement('div');
    d.textContent = l;
    devOutEl.appendChild(d);
  }
  devOutEl.scrollTop = devOutEl.scrollHeight;
}
function devOpen() {
  if (devEl.style.display === 'flex') return;
  devEl.style.display = 'flex';
  devInputEl.value = '';
  devInputEl.focus();
  if (!devOutEl.childElementCount) {
    devPrint('HERMES test console. `help` for commands.',
      `on: ${currentWorld.id}   pos: ${player.x.toFixed(1)},${player.y.toFixed(1)}`);
  }
}
function devClose() { devEl.style.display = 'none'; devInputEl.blur(); }

// The kit buttons: the things worth reaching for over and over when testing.
const DEV_KITS = [
  // A working laptop straight into the slot, for testing the UNIX + the AI-ML
  // sandbox without hunting one down (docs/laptop-plan.md). Cycles the models so
  // every body colour and icon can be eyeballed.
  ['Broken laptop + boards', () => {
    // For testing the repair arc: a dead machine and the circuits to revive it (C).
    player.laptop = null;
    player.stow('laptop_broken', 1);
    player.stow('circuit', 4);
    return 'broken NostBook + 4 circuits — press C to repair it';
  }],
  // ONE KIT that covers the whole terminal loop, rather than six chips you had
  // to press in the right order. The backpack is WORN, not stowed: a backpack
  // sitting in a pocket takes up one of the four slots it exists to relieve,
  // and the player then has to work out for themselves that it needs equipping.
  ['Kit (laptop, card, gun, pack)', () => {
    if (!player.backpack) player.backpack = { slots: new Array(16).fill(null), weapon: null };
    // Repaired through the REAL path rather than assembled here: a hand-built
    // laptop object missed `fs`, and a NostBook with no disk boots to a shell
    // with nothing on it. Give it the broken one and the parts, then let
    // repairLaptop do what it does when a player does it.
    if (!player.laptop) {
      player.stow('laptop_broken', 1);
      for (const [k, n] of [['battery', 1], ['chip_fragment', 1]]) player.stow(k, n);
      player.repairLaptop(makeDisk);
    }
    for (const [k, n] of [['chip', 3], ['ai_key', 1], ['book_ronml', 1], ['electrogun', 1], ['battery', 12]]) player.stow(k, n);
    return 'backpack worn, laptop working, 3 chips, ai_key, manual, electro-gun + 12 cells';
  }],
  ['Hermes card (armed: all)', () => {
    player.stow('hermes_card', 1);
    for (const ai of ['CALYPSO', 'POLYPHEMUS', 'CIRCE', 'HELIOS']) player.virusArmed.add(ai);
    return 'hermes_card, armed against every daemon';
  }],
  ['Golden axe', () => { player.stow('golden_axe', 1); return 'golden_axe' ; }],
  ['Ship parts', () => { for (const k of ['oar', 'rope', 'sail']) player.stow(k, 1); player.stow('wood', 40); return 'oar, rope, sail, 40 wood'; }],
  ['Bronze ram', () => { player.stow('ram', 1); return 'ram (carry it into the narrows)'; }],
  ['Heal + feed', () => { player.health = player.maxHealth; player.stamina = player.maxStamina; player.food = player.maxFood; player.venom = 0; player.torpor = 0; return 'restored'; }],
];

function devBuildButtons() {
  const jump = document.getElementById('dev-jump');
  const kit = document.getElementById('dev-kit');
  if (jump.childElementCount) return; // built once
  // A chip that changes what you are LOOKING at closes the console behind it —
  // you pressed it to go and see the thing, not to keep reading the panel. Kit
  // chips deliberately leave it open, since those get stacked several at a time.
  const goThenClose = (cmd) => { devRun(cmd); devClose(); };
  for (const c of CROSSINGS) {
    const b = document.createElement('button');
    b.textContent = c.place;
    b.onclick = () => goThenClose('go ' + c.id);
    jump.appendChild(b);
  }
  const bs = document.createElement('button');
  bs.textContent = 'BACKSPACE';
  bs.onclick = () => goThenClose('go backspace');
  jump.appendChild(bs);
  DEV_KITS.forEach((k, i) => {
    const b = document.createElement('button');
    b.textContent = k[0];
    b.onclick = () => devRun('kit ' + i);
    kit.appendChild(b);
  });
  // Scenes and toggles: the things you want to run again and again while tuning
  // something, one press each rather than a typed command every time.
  const scene = document.getElementById('dev-scene');
  for (const [label, cmd] of DEV_SCENES) {
    const b = document.createElement('button');
    b.textContent = label;
    b.onclick = () => goThenClose(cmd);
    scene.appendChild(b);
  }
}

// One chip per thing worth replaying. `narrows` returns you where you were, so
// it can be hammered; the rest are one-line world pokes.
const DEV_SCENES = [
  ['▶ NARROWS', 'narrows'],
  ['▶ CALYPSO', 'pong'],
  ['POSEIDON', 'poseidon'],
  ['BOAT', 'boat'],
  ['RAFT', 'boat raft'],
  ['DAY', 'time day'],
  ['NIGHT', 'time night'],
];

function devRun(raw) {
  const cmd = (raw || '').trim();
  if (!cmd) return;
  devPrint('> ' + cmd);
  const [verb, ...rest] = cmd.split(/\s+/);
  const arg = rest.join(' ');
  switch (verb.toLowerCase()) {
    case 'help':
      devPrint('go <island|backspace>   jump (calypso polyphemus circe helios ithaca)',
        'give <item> [n]         any key from items.js — `items <text>` to search',
        'items [text]            list item keys, optionally filtered',
        'kit <n>                 the numbered buttons above',
        'arm <AI|all>            arm the card against a daemon (CALYPSO/POLYPHEMUS/CIRCE/HELIOS)',
        'unshield                drop this island\'s core shield',
        'open                    open the fortress gate + sanctum door + maze',
        'leave                   set calypsoLeave (the sea will let you go)',
        'tp <x> <y>              teleport on this island',
        'time <day|night|0-23>   set the clock (day=noon, night=22:00)',
        'narrows                play the Scylla/Charybdis cabinet, then come back',
        'boat [raft]            a hull at your feet (raft = the one the sea refuses)',
        'strait [island] [now]   sail into the narrows (`now` = skip to the choice)',
        'score <n> / heal / kill / where');
      return;
    case 'go': {
      const id = arg.toLowerCase();
      if (id === currentWorld.id) { devPrint(`already on ${id} — nothing to do.`); return; }
      if (id === 'backspace') { enterBackspace(); devPrint('-> backspace'); return; }
      const dest = worldById(id);
      if (!dest) { devPrint('no island "' + id + '"'); return; }
      const arrival = dest.onEnter;
      dest.onEnter = () => {};        // a test jump is not a story arrival
      goToWorld(dest);
      dest.onEnter = arrival;
      // Land clear of the water so a jump never drops you swimming (the arrival
      // spawn is a shore tile, but be safe). Report where you actually are.
      devPrint(`-> ${id} at ${player.x.toFixed(1)},${player.y.toFixed(1)} (${map.floorAt(Math.floor(player.x), Math.floor(player.y))})`);
      return;
    }
    case 'give': {
      const m = arg.match(/^(\S+)(?:\s+(\d+))?$/);
      if (!m) { devPrint('give <item> [n]'); return; }
      const key = m[1], n = m[2] ? parseInt(m[2], 10) : 1;
      if (!ITEMS[key]) { devPrint(`no item "${key}" — try: items ${key}`); return; }
      const left = player.stow(key, n);
      devPrint(`gave ${n - (left || 0)} x ${key}${left ? ` (${left} would not fit)` : ''}`);
      return;
    }
    case 'items': {
      const keys = Object.keys(ITEMS).filter((k) => !arg || k.includes(arg.toLowerCase()));
      devPrint(`${keys.length} item(s):`, keys.join('  '));
      return;
    }
    case 'kit': {
      const k = DEV_KITS[parseInt(arg, 10)];
      if (!k) { devPrint('no such kit'); return; }
      devPrint('+ ' + k[1]());
      return;
    }
    case 'arm': {
      const who = arg.toUpperCase();
      const all = ['CALYPSO', 'POLYPHEMUS', 'CIRCE', 'HELIOS'];
      const list = who === 'ALL' || !who ? all : [who];
      for (const ai of list) player.virusArmed.add(ai);
      if (!player.hasTrojanCard()) player.stow('hermes_card', 1);
      devPrint('armed: ' + [...player.virusArmed].join(', '));
      return;
    }
    case 'unshield': {
      const core = fortress && fortress.core && fortress.core.obj;
      if (!core) { devPrint('no core here'); return; }
      core.shielded = false;
      devPrint('core shield down');
      return;
    }
    case 'open': {
      if (fortress && fortress.openMaze) { fortress.openMaze(); devPrint('gate, sanctum and maze opened'); }
      else devPrint('no fortress here');
      return;
    }
    case 'leave':
      player.calypsoLeave = true;
      devPrint('calypsoLeave set — the sea will let you go');
      return;
    case 'tp': {
      const [tx, ty] = rest.map(Number);
      if (!isFinite(tx) || !isFinite(ty)) { devPrint('tp <x> <y>'); return; }
      player.x = tx; player.y = ty; camera.snap(player.x, player.y);
      devPrint(`-> ${tx},${ty}`);
      return;
    }
    case 'narrows': {
      // Play the cabinet on its own, and come back to exactly where you were.
      // Testing it through a real crossing meant building a ship and sailing the
      // AEAEA-THRINACIA leg every single time.
      if (strait) { devPrint('already at sea'); return; }
      const here = currentWorld.id;
      beginStrait(here, here);        // from and to the same island: a test loop
      strait.phase = 'choice'; strait.t = 0;
      strait.testOnly = true;         // finishStrait puts you back, whatever happens
      openNarrows();
      devPrint('-> the narrows (test loop; you return here either way)');
      return;
    }
    case 'poseidon': {
      // Run the deadline to zero so the purge (and the whole blight / fog /
      // shared-sight system) can be tested without waiting out the clock. Clear
      // any pending rebuild so the natural activation in the hub is not blocked.
      dayNight.expire();
      currentWorld.obeliskObjs.forEach((o) => { o.needsRebuild = false; });
      devPrint('-> POSEIDON deadline set to 0 — it wakes on the next tick');
      return;
    }
    case 'pong': {
      // Play Calypso's cabinet on its own and come back here. Her terminal is
      // not wired into the escape chain yet (roadmap), so this is how it is
      // tested and seen.
      if (pong) { devPrint('already at the cabinet'); return; }
      openPong();
      pong.testOnly = true;
      devPrint('-> calypso\'s pong (test loop; the only way out is to leave)');
      return;
    }
    case 'boat': {
      // A hull at your feet — testing the crossings otherwise means building a
      // whole ship first. `boat` gives the seaworthy greek ship; `boat raft`
      // gives the unfinished one the sea refuses, for testing the refusal.
      const raft = (arg || '').toLowerCase().startsWith('r');
      const px = Math.round(player.x), py = Math.round(player.y);
      let spot = null;
      for (let r = 1; r <= 6 && !spot; r++) {
        for (let dy = -r; dy <= r && !spot; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            const x = px + dx, y = py + dy;
            if (!map.inBounds(x, y) || map.objectAt(x, y)) continue;
            const f = map.floorAt(x, y);
            if (f === 'sand' || f === 'sea') { spot = { x, y }; break; }
          }
        }
      }
      if (!spot) { devPrint('no shore tile free nearby — move to a beach'); return; }
      const o = map.addObject(raft ? 'boat' : 'greek_ship', spot.x, spot.y,
        raft ? { hull: 100, maxHull: 100 } : { hull: 100, maxHull: 100, seaworthy: true });
      devPrint(o ? `${raft ? 'boat (no sail)' : 'greek ship'} drawn up at ${spot.x},${spot.y}`
                 : 'could not place a hull there');
      return;
    }
    case 'strait': {
      // Force the narrows without sailing the route: the passage only happens on
      // CIRCE <-> HELIOS, which is a long way to row to test a monster.
      if (strait) { devPrint('already in the narrows'); return; }
      // `now` skips the row-in and puts the choice up at once — you do not want to
      // sit through the approach every time you are testing the two outcomes.
      const parts = rest.map((s) => s.toLowerCase());
      const skip = parts.includes('now');
      const named = parts.find((p) => p !== 'now');
      const to = named || (currentWorld.id === 'circe' ? 'helios' : 'circe');
      if (!worldById(to)) { devPrint('no island "' + to + '"'); return; }
      if (to === currentWorld.id) { devPrint('the strait needs somewhere to be going'); return; }
      beginStrait(currentWorld.id, to);
      if (skip) { strait.phase = 'choice'; strait.t = 0; openNarrows(); }
      devPrint(`-> the narrows, ${currentWorld.id} to ${to}${skip ? ' (choice up)' : ''}`);
      return;
    }
    case 'time':
    case 'day':
    case 'night': {
      const v = verb.toLowerCase();
      const a = (v === 'time' ? arg : v).toLowerCase();
      let h;
      // Noon and 22:00 both sit AFTER the 09:00 run-start on the same day, so the
      // clock does not roll to tomorrow and trip POSEIDON's deadline — a testing
      // toggle shouldn't end your run just to check the torch veil.
      if (a === 'day' || a === '') h = 12;
      else if (a === 'night') h = 22;
      else h = Number(a);
      if (!isFinite(h)) { devPrint('time <day|night|0-23>'); return; }
      dayNight.setHour(h);
      devPrint(`clock -> ${dayNight.label} (${dayNight.isNight() ? 'night' : 'day'})`);
      return;
    }
    case 'score':
      player.addScore(parseInt(arg, 10) || 0);
      devPrint('score ' + player.score);
      return;
    case 'heal':
      player.health = player.maxHealth; player.stamina = player.maxStamina;
      player.food = player.maxFood; player.venom = 0; player.torpor = 0;
      devPrint('restored');
      return;
    case 'kill': {
      let n = 0;
      for (const r of currentWorld.robots) if (!r.dead) { r.dead = true; n++; }
      devPrint(`killed ${n} machine(s) on this island`);
      return;
    }
    case 'where':
      devPrint(`${currentWorld.id} @ ${player.x.toFixed(1)},${player.y.toFixed(1)}  winMode=${currentWorld.winMode}`,
        `armed: ${[...player.virusArmed].join(', ') || 'none'}  calypsoLeave=${!!player.calypsoLeave}`);
      return;
    default:
      devPrint(`? ${verb} — try \`help\``);
  }
}

devEl.addEventListener('click', (e) => { if (e.target === devEl) devClose(); });
document.getElementById('dev-close').addEventListener('click', devClose);
devInputEl.addEventListener('keydown', (e) => {
  e.stopPropagation();               // never leaks into movement
  if (e.key === 'Enter') { devRun(devInputEl.value); devInputEl.value = ''; }
  else if (e.key === 'Escape') devClose();
});
// The secret knock, in capture phase so it sees keys before input.js does.
//
// The rule that makes this safe: we only ever swallow a key while the buffer is
// a genuine PREFIX of the word. The first letter of DEV_WORD is one of the three
// unbound letters, so arming costs nothing; from then on each key is swallowed
// (preventDefault + stopPropagation), which is what stops `r` reading and `e`
// using mid-word. The moment a key breaks the prefix we abandon the attempt and
// let that key through untouched, so ordinary play is never eaten.
window.addEventListener('keydown', (e) => {
  if (devEl.style.display === 'flex') return;
  const tag = e.target && e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
  const now = performance.now();
  if (_devTyped && now - _devTypedAt > DEV_CAPTURE_MS) _devTyped = ''; // stale attempt
  const next = _devTyped + e.key.toLowerCase();
  if (DEV_WORD.startsWith(next)) {
    _devTyped = next;
    _devTypedAt = now;
    e.preventDefault();
    e.stopPropagation();   // the game never sees the letters of the word
    if (next === DEV_WORD) {
      _devTyped = '';
      devBuildButtons();
      devOpen();
    }
    return;
  }
  // Not the word after all: forget it and let this key play normally. (If the
  // key could itself start a fresh attempt, arm on it rather than dropping it.)
  _devTyped = DEV_WORD.startsWith(e.key.toLowerCase()) ? e.key.toLowerCase() : '';
  if (_devTyped) { _devTypedAt = now; e.preventDefault(); e.stopPropagation(); }
}, true);

// The failed crossing. Boarding an unfinished boat does NOT bounce you off the
// hull with a message — you launch, you row out, and the sea rises and sends you
// home. Poseidon has to actually refuse you for the refusal to mean anything, and
// you have to have been out there to feel it. Phases, in seconds:
//   OUT   — you pull away from the beach, the island shrinking behind you
//   SWELL — the water stands up; the boat is held, then taken
//   BACK  — you are thrown home, and land hard on the sand
const CF_OUT = 7.0, CF_SWELL = 2.6, CF_BACK = 2.2;
const CF_HULL = 45;        // what the beating costs the hull (it can break up)
const CF_HURT = 10;        // and what it costs you
// crossFail forward-declared up by persist; its shape: { t, sx, sy, dx, dy, dist, phase, type, hull… } — null = not sailing

player.onDepartFail = (p, boat) => {
  if (crossFail) return;
  // The voyage belongs to OGYGIA. Calypso's island is the one whose whole gate is
  // the boat: you launch, the sea turns you back, and you keep launching until you
  // have built a proper ship to her recipe. Every island after it you leave in the
  // greek ship you arrived in, so a raft there is just a raft — it gets the plain
  // refusal, not a crossing the island has no stake in.
  if (!currentWorld.departTrial) return false;
  const dir = seawardFrom(map, p.x, p.y);
  // No open water to sail into (a stream mouth, a pinched cove): there is no
  // voyage to be had, so decline and let the plain bounce stand. Forcing the trip
  // anyway would row you across the sand.
  if (dir.run < CF_MIN) return false;
  crossFail = {
    t: 0, phase: '',
    sx: p.x, sy: p.y,                       // the beach you shoved off from
    bx: boat ? boat.x : Math.round(p.x),    // and the tile the hull was drawn up on
    by: boat ? boat.y : Math.round(p.y),
    dx: dir.x, dy: dir.y,
    dist: dir.run,                          // as far out as this water actually goes
    // The vessel itself, lifted off the map for the voyage (see below).
    type: boat ? boat.type : 'boat',
    hull: boat ? (boat.hull ?? 100) : 100,
    maxHull: boat ? (boat.maxHull ?? 100) : 100,
    seaworthy: boat ? !!boat.seaworthy : false,
  };
  // Take the hull OFF the map for the crossing. A map object is pinned to a tile,
  // so dragging one along behind you snaps it a whole tile at a time while you
  // move smoothly — the boat visibly stutters under your feet. Instead the vessel
  // rides on `player.aboard`, and the renderer draws hull and man as one image at
  // one float position (drawPlayer). It goes back on the map when you land.
  if (boat) map.removeObject(boat);
  aboardHeading(crossFail, dir.x, dir.y);
  sfx.play('jump');
  p.say('You put your shoulder to the hull and shove. The sand lets go, and the boat swings out onto the water.');
  // She watches you go, and her hold on you loosens as you make for open water.
  if (currentWorld.keeper) { sendNokia(nokia, 'boardDepart', { player: p }); holdFall(p, 0.30); }
};

// Put the vessel under the player and point it where it is going (boatMirror).
function aboardHeading(cf, hx, hy) {
  player.aboard = { type: cf.type, mirror: boatMirror(hx, hy), wob: 0 };
}

// Poseidon's fog for the failed crossing (renderer.drawSeaFog). It thickens as
// the island falls away, closes right in on the crest while the sea takes hold,
// and thins again as the land comes back up under you — so the weather tells the
// same story as the boat's motion. It also, frankly, veils a lot of empty water
// at the one moment the camera is furthest from anything worth looking at.
function seaFogState() {
  // Putting out to sea (the successful departure): the fog gathers ahead as the
  // land falls away and hangs thick while the chart is up, so the heading is
  // chosen out of the murk rather than off a clear horizon. Thins again if you
  // come about and row home.
  if (departOut) {
    const d = departOut;
    const u = d.returning
      ? 1 - Math.min(1, d.t / DEPART_BACK)
      : Math.min(1, d.t / DEPART_OUT);
    const a = worldToScreen(player.x, player.y);
    const b = worldToScreen(player.x + d.dx, player.y + d.dy);
    const sx = b.x - a.x, sy = b.y - a.y;
    const len = Math.hypot(sx, sy) || 1;
    return {
      amount: 0.10 + 0.78 * u,
      swirl: 0.10 + 0.25 * u,        // it drifts; it is not yet angry
      t: d.t,                        // keeps advancing while the chart is up, so it rolls
      push: { x: sx / len, y: sy / len },
    };
  }
  // In the narrows: the murk stands thick and turns hard while the sea decides,
  // then eases as you are let through (or spat back). Same weather language as
  // the refusal, because this is the sea having its way with you too.
  if (strait) {
    const s = strait;
    const u = s.phase === 'in' ? Math.min(1, s.t / STRAIT_IN)
      : s.phase === 'choice' ? 1
      : Math.max(0, 1 - s.t / STRAIT_OUT);
    return {
      amount: 0.30 + 0.62 * u,
      swirl: 0.30 + 0.70 * u,          // it is turning: something under the boat
      t: s.t,
      push: { x: 0, y: -1 },           // driving up the channel
    };
  }
  if (!crossFail) return null;
  const cf = crossFail;
  const T_SWELL = CF_OUT, T_BACK = CF_OUT + CF_SWELL;
  let amount, swirl;
  if (cf.t < T_SWELL) {
    const u = cf.t / T_SWELL;
    amount = 0.14 + 0.70 * u;          // rolls in behind you
    swirl = 0.12 * u;
  } else if (cf.t < T_BACK) {
    const u = (cf.t - T_SWELL) / CF_SWELL;
    amount = 0.84 + 0.16 * u;          // right in on the crest
    swirl = 0.12 + 0.88 * u;           // and turning hard
  } else {
    const u = Math.min(1, (cf.t - T_BACK) / CF_BACK);
    amount = 1.0 - 0.80 * u;           // opens again as home comes up
    swirl = 1.0 - 0.55 * u;
  }
  // The seaward heading in SCREEN space, so the banks stream in from the way you
  // were trying to go and get driven back over you with the boat.
  const a = worldToScreen(player.x, player.y);
  const b = worldToScreen(player.x + cf.dx, player.y + cf.dy);
  const sx = b.x - a.x, sy = b.y - a.y;
  const len = Math.hypot(sx, sy) || 1;
  return { amount, swirl, t: cf.t, push: { x: sx / len, y: sy / len } };
}

// Drive the failed crossing. Returns nothing; the caller returns immediately
// after, so the whole world holds still while the sea deals with you.
function updateCrossFail(dt) {
  const cf = crossFail;
  cf.t += dt;
  const ease = (u) => u * u * (3 - 2 * u);  // smoothstep

  if (cf.t < CF_OUT) {
    const u = cf.t / CF_OUT;
    const d = ease(u) * cf.dist;
    player.x = cf.sx + cf.dx * d;
    player.y = cf.sy + cf.dy * d;
    if (cf.phase !== 'out' && cf.t > 1.8) {
      cf.phase = 'out';
      player.say('The island falls away behind you. Open water, and no land in front of it.');
    }
    if (player.aboard) player.aboard.wob = Math.sin(cf.t * 5) * 1.2;   // an easy swell
  } else if (cf.t < CF_OUT + CF_SWELL) {
    const u = (cf.t - CF_OUT) / CF_SWELL;
    // Held on the crest: the boat stops making way and starts being moved.
    const d = cf.dist + Math.sin(u * Math.PI) * 1.4;
    const shudder = 0.22 * Math.sin(cf.t * 34) * u;
    player.x = cf.sx + cf.dx * d + shudder;
    player.y = cf.sy + cf.dy * d - shudder;
    if (player.aboard) player.aboard.wob = Math.sin(cf.t * 26) * 5 * u; // and now a bad one
    if (cf.phase !== 'swell') {
      cf.phase = 'swell';
      sfx.play('charge');
      player.say('The water changes. Ahead of you it stands up, grey and unhurried, and it is taller than the boat.');
    }
  } else if (cf.t < CF_OUT + CF_SWELL + CF_BACK) {
    const u = (cf.t - CF_OUT - CF_SWELL) / CF_BACK;
    const d = cf.dist * (1 - ease(u));      // hurled home faster than you left
    player.x = cf.sx + cf.dx * d;
    player.y = cf.sy + cf.dy * d;
    if (cf.phase !== 'back') {
      cf.phase = 'back';
      sfx.play('treefall');
      aboardHeading(cf, -cf.dx, -cf.dy);    // she comes about: bow now points home
    }
    if (player.aboard) player.aboard.wob = Math.sin(cf.t * 30) * 4 * (1 - u);
  } else {
    // Landfall. You are back on the sand you shoved off from, and the boat has
    // taken a beating; enough of them and it breaks up under you.
    player.x = cf.sx; player.y = cf.sy;
    player.aboard = null;                  // ashore: you step out of the hull
    crossFail = null;
    sfx.play('hurt');
    player.takeDamage(CF_HURT, 'Poseidon');
    const hull = cf.hull - CF_HULL;
    // Put the vessel back on the map where it was drawn up. If that tile is somehow
    // taken, the boat is gone — so clear boatBuilt too, or you'd be left with no
    // boat and no way to lay another keel.
    const rebeached = hull > 0
      ? map.addObject(cf.type, cf.bx, cf.by, { hull, maxHull: cf.maxHull, seaworthy: cf.seaworthy })
      : null;
    if (rebeached) {
      player.say(`Poseidon puts you back on your own beach, and the boat down on the sand beside you. Its planks are sprung. ${player.launchHint()}`);
    } else {
      player.boatBuilt = false;   // it is gone; you can lay another keel
      player.say(`The sea breaks the boat over the sand and takes the pieces back. ${player.launchHint()}`);
    }
    // The two gods are one system keeping you: Poseidon returns you, and her hold
    // — her protection — rises with the relief. She texts, glad of it.
    if (currentWorld.keeper) { holdRise(player, 0.15); sendNokia(nokia, 'crossFailReturn', { player }); }
    persist();
    return;
  }
  // The camera rides with you, and shakes while the sea has hold of the boat.
  const q = cf.phase === 'swell' ? 0.18 : 0;
  camera.follow(player.x + (Math.random() - 0.5) * q, player.y + (Math.random() - 0.5) * q, dt);
}

// Fog of war: the minimap only shows where you have been. Only created if it
// is not there already — applyIslandState runs at boot, well above this, and
// puts a restored fog straight onto the map.
if (!map.explored) map.explored = new Uint8Array(map.w * map.h);
if (!map.newlyRevealed) map.newlyRevealed = [];
const FOG_RADIUS = 9;
let lastRevealX = -1, lastRevealY = -1;
function revealAround(px, py) {
  for (let dy = -FOG_RADIUS; dy <= FOG_RADIUS; dy++) {
    for (let dx = -FOG_RADIUS; dx <= FOG_RADIUS; dx++) {
      if (dx * dx + dy * dy > FOG_RADIUS * FOG_RADIUS) continue;
      const x = px + dx, y = py + dy;
      if (!map.inBounds(x, y) || map.explored[y * map.w + x]) continue;
      map.explored[y * map.w + x] = 1;
      map.newlyRevealed.push(x, y);
    }
  }
}

// Debug handle for inspecting live state from the console.
// The walkman announces what it's playing as a quiet toast — artist, album,
// side — since the compact HUD has no room for the desktop deck's marquee.
player.onTapeToast = (def, side) => {
  if (!side) { toast = { text: `${def.short} — stopped`, ttl: 2.5 }; return; }
  const sideDef = side === 'A' ? def.sideA : def.sideB;
  toast = { text: `\u25b6 ${def.short} \u00b7 side ${side}: ${sideDef.label}`, ttl: 4 };
};

// RUN/JUMP touch buttons: input routes any finger landing on one of these
// to sprint-hold / jump instead of movement or HUD (input.js multitouch).
input.touchButtonHit = (x, y) => {
  const btns = renderer.touchButtons;
  if (!btns) return null;
  const hit = btns.find((b) => Math.hypot(x - b.x, y - b.y) <= b.r);
  return hit ? hit.id : null;
};

// Touches that land on the HUD are UI, never movement (input.js touch path).
input.uiHitTest = (x, y) => {
  // The cabinet owns the screen: while the narrows are up, NOTHING on the
  // dashboard is touchable. Without this the bottom strip of a phone stays a HUD
  // hit-area, so the thumb you are steering with lands on a slot instead of the
  // helm — and can swap what is in your hands mid-passage.
  if (strait && strait.phase === 'choice' && strait.run) return false;
  if (pong && pong.run) return false;   // the cabinet owns the screen; the HUD is inert
  if (renderer.slotAt && renderer.slotAt(x, y)) return true;
  if (renderer.hudTop != null && y >= renderer.hudTop) return true;
  const bp = renderer._backpackRect;
  if (showBackpack && bp && x >= bp.x && x <= bp.x + bp.w && y >= bp.y && y <= bp.y + bp.h) return true;
  return false;
};

window.__game = { player, map, camera,
  animals: currentWorld.animals, birds: currentWorld.birds, robots: currentWorld.robots,
  waterdroids: currentWorld.waterdroids, obelisks: currentWorld.obelisks, obeliskObjs: currentWorld.obeliskObjs,
  wfactory, dayNight, lore, input, renderer, fortress, sfx, currentWorld,
  // Transient voyage state is reassigned wholesale, so expose it as a getter —
  // a plain field would freeze at whatever it was when this object was built.
  get strait() { return strait; } };

function resize() {
  // Size to the *visual* viewport, not innerHeight/100vh. On iOS Safari the
  // layout viewport extends behind the floating bottom toolbar, so a canvas
  // sized to innerHeight pushes the HUD's slot row off-screen behind the bar.
  // visualViewport gives the genuinely-visible area, so the dashboard sits just
  // above the toolbar. We drive the canvas's CSS size explicitly to match.
  const vv = window.visualViewport;
  const w = Math.round(vv ? vv.width : window.innerWidth);
  const h = Math.round(vv ? vv.height : window.innerHeight);
  const cv = renderer.canvas;
  if (cv) { cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
  renderer.resize(w, h, window.devicePixelRatio || 1);
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);
if (window.visualViewport) {
  // Toolbar show/hide and pinch-zoom change the visible area without a window
  // resize; keep the canvas fitted to it.
  window.visualViewport.addEventListener('resize', resize);
  window.visualViewport.addEventListener('scroll', resize);
}
resize();

const STEP = 1 / 60;
let last = performance.now();
let acc = 0;
let fps = 0, frameCount = 0, fpsClock = 0;

// Render cap: physics still steps every rAF tick (cheap, fixed timestep),
// but the actual canvas redraw — the expensive part — is skipped past this
// rate. On a 120Hz+ display rAF would otherwise fire (and fully repaint)
// twice as often as the game needs, burning CPU/GPU for no visible gain.
const RENDER_FPS_CAP = 60;
const MIN_RENDER_MS = 1000 / RENDER_FPS_CAP;
let lastRenderTime = 0;
let _firstFramePainted = false;  // dismiss the boot loader on the first real draw

// Help modal: H toggles, the ? button opens, clicking the backdrop closes.
const helpEl = document.getElementById('help');
const toggleHelp = (force) => {
  const show = force != null ? force : helpEl.style.display !== 'block';
  helpEl.style.display = show ? 'block' : 'none';
  if (!show && helpEl.classList.contains('gated')) {
    helpEl.classList.remove('gated');
    document.body.appendChild(helpEl);   // back out of the gate, back to the game
  }
};
document.getElementById('helpBtn').addEventListener('click', () => toggleHelp(true));
document.getElementById('help-x').addEventListener('click', () => toggleHelp(false));
helpEl.addEventListener('click', (e) => { if (e.target === helpEl) toggleHelp(false); });
// (The title screen opens this same panel before main.js is even loaded —
// mobile-gate.js moves it into the gate and puts it back. Hence the `gated`
// check above: whichever side closes it, the panel comes home to the body.)

// About modal: the i button opens, clicking the backdrop closes.
const aboutEl = document.getElementById('about');
// Build the About soundtrack list from the tape ledger (so it never drifts from
// what's actually in the game). Done lazily on first open — guaranteed the DOM
// and TAPES are both ready by then.
const populateAboutTapes = () => {
  // Every place that prints the build reads version.js — it used to be a
  // hardcoded string and drifted, stuck at v1.63 through several releases. A
  // CLASS rather than an id, because there are three of them now: the About
  // header, the help header, and the foot. A player reporting a bug should find
  // it in whichever panel they happen to have open.
  for (const el of document.querySelectorAll('.verNum')) el.textContent = `v${VERSION}`;
  const ul = document.getElementById('aboutTapes');
  if (!ul || ul.childElementCount) return;
  const cleanTrack = (f) => f.replace(/\.mp3$/i, '').replace(/^\d+[-.\s]*\d*[-.\s]*/, '').trim();
  ul.innerHTML = TAPES.map((t) => {
    const a = t.a.tracks.map(cleanTrack).join(', ');
    const b = t.b.tracks.map(cleanTrack).join(', ');
    return `<li><b>${t.artist} &mdash; <i>${t.title}</i></b><br>A: ${a} &nbsp;&middot;&nbsp; B: ${b}</li>`;
  }).join('');
};
const toggleAbout = (force) => {
  const show = force != null ? force : aboutEl.style.display !== 'block';
  if (show) populateAboutTapes();
  aboutEl.style.display = show ? 'block' : 'none';
};
document.getElementById('aboutBtn').addEventListener('click', () => toggleAbout(true));
aboutEl.addEventListener('click', (e) => { if (e.target === aboutEl) toggleAbout(false); });
// Tabbed help: shared with the title screen, which opens the same panel before
// this file exists (see help-tabs.js). Binding is idempotent; the callback is
// the part only the game can do.
wireHelpTabs(helpEl, (name) => { if (name === 'settings') syncSettingsPanel(); });

// Settings tab: volume slider and direct music-track choice, both backed by
// sfx (which persists them itself — see Sound.setVolume/setMusicMode). The
// panel's inputs are synced to the live state each time the tab is opened,
// since either can also change elsewhere (M key for music; nothing else
// touches volume yet, but the pattern's ready for when something does).
const volumeSlider = document.getElementById('volumeSlider');
const volumeLabel = document.getElementById('volumeLabel');
volumeSlider.addEventListener('input', () => {
  const v = Number(volumeSlider.value) / 100;
  sfx.setVolume(v);
  volumeLabel.textContent = `${volumeSlider.value}%`;
  volumeSlider.style.setProperty('--v', `${volumeSlider.value}%`); // drive the fill
});
for (const radio of helpEl.querySelectorAll('input[name="musicMode"]')) {
  radio.addEventListener('change', () => { if (radio.checked) sfx.setMusicMode(radio.value); });
}
function syncSettingsPanel() {
  const pct = Math.round(sfx.volume * 100);
  volumeSlider.value = pct;
  volumeLabel.textContent = `${pct}%`;
  volumeSlider.style.setProperty('--v', `${pct}%`); // drive the fill
  const current = helpEl.querySelector(`input[name="musicMode"][value="${sfx.musicMode}"]`);
  if (current) current.checked = true;
}

// Obelisk terminal. With an access chip carried, clicking an obelisk opens a
// channel (a progress bar) into a live AI-ML REPL — and while you're jacked
// in the obelisk hides you from the machines. Without a chip you instead see
// the AI's own OS: alive with data, and unusable. See docs/ob-terminal-language.md
// for the language design.
const OB_TERMINAL_RANGE = 4.5;
const RONML_ROBOT_RANGE = 20;   // sing reaches this far from the player
const RONML_SOFT_RANGE = 12;    // sleep/repel reach: nerfed shorter now they're keyless (Type 2)
const RONML_SLEEP_CAP = 20;     // sleep idles for at most this many game-minutes (nerf)
const RONML_REWIND_CAP = 2;     // rewind claws at most this many hours per call (nerf)
const REPEL_DURATION = 30;      // seconds `repel`-ed machines flee for (nerfed from 60)
// Persistent AI-ML session: bare top-level `let`/`copy` bindings live here for
// the length of one terminal visit (reset on open/close), so the fortress
// program can be typed line by line. `terminalOb` is the node you're jacked into.
let replSession = {};
let terminalOb = null;
const SING_DURATION = 4.5;      // seconds the choir lines up before powering down
const obTermEl = document.getElementById('obterminal');
const obTermScreen = document.getElementById('obterminal-screen');
const obTermConnect = document.getElementById('obterminal-connect');
const obTermBar = document.getElementById('obterminal-bar');
const obTermInput = document.getElementById('obterminal-input');
const obTermGhost = document.getElementById('obterminal-ghost');
const obTermPrompt = document.getElementById('obterminal-prompt');
const obTermBattEl = document.getElementById('obterminal-batt');

// Recolour the pop-up terminal to a core's hue, or reset to the default amber CRT.
// The core screen (renderer, core.screenColor) and this REPL read the same colour,
// so a core's two terminals — the one on its SE face and the one you type into —
// always match. Passing null restores amber (the OB / HERMES terminals keep it).
function setTerminalTheme(hex) {
  const hint = obTermEl.querySelector('.crt-hint');
  const solids = [obTermScreen, obTermPrompt, obTermInput];
  if (!hex) {
    for (const el of [...solids, obTermGhost, hint]) if (el) { el.style.color = ''; el.style.textShadow = ''; el.style.caretColor = ''; }
    obTermEl.style.boxShadow = '';
    return;
  }
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const glow = `0 0 4px rgba(${r},${g},${b},0.7)`;
  for (const el of solids) if (el) { el.style.color = hex; el.style.textShadow = glow; }
  if (obTermInput) obTermInput.style.caretColor = hex;
  if (obTermGhost) { obTermGhost.style.color = `rgba(${r},${g},${b},0.32)`; obTermGhost.style.textShadow = `0 0 4px rgba(${r},${g},${b},0.35)`; }
  if (hint) hint.style.color = `rgba(${r},${g},${b},0.4)`;
  obTermEl.style.boxShadow = `0 0 0 2px #000, inset 0 0 70px rgba(0,0,0,0.9), inset 0 0 130px rgba(${r},${g},${b},0.09)`;
}
// The relay's solar-cell gauge in the HERMES terminal — a bar you watch wear
// down as you use it and creep back up in the sun.
function updateHermesBattEl() {
  if (!obTermBattEl) return;
  if (terminalKind !== 'hermes' || !hermesTor) { obTermBattEl.textContent = ''; return; }
  const f = hermesTor.battery ?? 1;
  const n = 10, on = Math.round(f * n);
  const glyphs = '▓'.repeat(on) + '░'.repeat(n - on);
  obTermBattEl.textContent = `CELL ${glyphs} ${Math.round(f * 100)}%`;
  // Amber to match the HERMES CRT (never green — that's the AI palette); only
  // when it's really low does it go red as a warning.
  obTermBattEl.style.color = f < 0.2 ? '#ff6a4a' : f < 0.45 ? '#e0902a' : '#e6a53a';
}
const aiosEl = document.getElementById('aios');
const aiosScreen = document.getElementById('aios-screen');
const aiosHeader = document.getElementById('aios-header');

let replLog = [];
let replHistory = [];
let replHistoryIdx = -1;
const REPL_MAX_LINES = 300;

function replPrint(...lines) {
  replLog.push(...lines);
  if (replLog.length > REPL_MAX_LINES) replLog = replLog.slice(replLog.length - REPL_MAX_LINES);
  obTermScreen.textContent = replLog.join('\n');
  obTermScreen.scrollTop = obTermScreen.scrollHeight;
}

// Builds a fresh ctx object each command: primitives read/mutate the live
// world (map, robots, obeliskObjs, player) through these hooks, and never
// touch game state directly — ronml.js only handles language mechanics.
// ---- AI-ML terminal filesystem (Calypso escape chain, Layer A) ------------
// A thin drive/file layer over the terminals (docs/calypso-escape-chain.md).
// Drives you `cd` into:
//   ob     — a per-visit scratch bench (obelisk terminals only)
//   aikey  — the AI card you hold; its file list is derived from card STATE
//            (ai_key -> trojan_key -> hermes_card), so the card needs no
//            per-slot data. Also reachable as `card`. (S3 wires the writes.)
//   hermes — the relay's static folder (S4 fills the zeus_virus folder)
// The current drive and the ob scratch live in replSession, so they persist
// across lines within one terminal visit and reset when you jack out.
function fsCardItem() {
  for (const k of ['hermes_card', 'trojan_key', 'ai_key']) if (player.hasItem(k)) return k;
  return null;
}
function fsDevAvail(dev) {
  if (dev === 'ob') return terminalKind !== 'hermes';
  if (dev === 'aikey') return true; // the card travels with you, at either terminal
  if (dev === 'hermes') return terminalKind === 'hermes';
  // The keeper's maintenance store, at every tower. The towers are one network —
  // that is what `net` and their shared sight are — so a shift note written at
  // OGYGIA is readable from any node in it. You can learn the refunction on an
  // island she does not keep; it simply has nothing to act on until you are back
  // where she is, which is the right way round: knowing is not the same as
  // being in a position to use it.
  if (dev === 'keeper') return terminalKind !== 'hermes';
  return false;
}
// Every drive but the keeper's is flat: one name, one list of files. That store
// has a folder in it, so a path is `keeper` or `keeper/handover` and the drive
// is whatever comes before the first slash.
function fsDevOf(path) { return String(path || '').split('/')[0]; }
function fsSubOf(path) { return String(path || '').split('/').slice(1).join('/'); }
function fsFilesOn(dev, sub = '') {
  if (dev === 'ob') return Object.keys(replSession.__obfiles || {});
  if (dev === 'aikey') { const c = fsCardItem(); return c && ITEMS[c].files ? ITEMS[c].files.slice() : []; }
  if (dev === 'hermes') return [...virusFilesFor(islandAiName()), ...Object.keys(replSession.__hermesfiles || {})];
  if (dev === 'keeper') return keeperLs(sub);
  return [];
}
function fsCwd() {
  return replSession.__cwd || (fsCardItem() ? 'aikey' : (terminalKind === 'hermes' ? 'hermes' : 'ob'));
}
// The card is one drive whatever its state, so accept forgiving synonyms — the
// display name (drives / cd) tells you which state it's actually in. ('hermes'
// stays the RELAY, not the card, to avoid clashing with a Hermes card.)
function fsNormDev(d) {
  d = String(d || '').toLowerCase();
  if (['card', 'aikey', 'ai_key', 'trojan', 'trojan_key', 'aicard', 'key'].includes(d)) return 'aikey';
  return d;
}
function fsDriveLabel(d) {
  if (d === 'aikey') { const c = fsCardItem(); return c ? `card (${ITEMS[c].name})` : 'card (none in hand)'; }
  if (d === 'ob') return 'ob (node bench)';
  if (d === 'hermes') return 'hermes (relay folder)';
  if (d === 'keeper') return 'keeper (maintenance store)';
  if (d.startsWith('keeper/')) return `keeper/${d.slice(7)}`;
  return d;
}
// `drives`: list what's attached here, so you can always SEE the card's current
// name/state (the big playtest gap). Prints, returns nothing.
function fsDrives() {
  const out = ['drives here:'];
  if (terminalKind !== 'hermes') out.push('  ob      the node bench (scratch)');
  const c = fsCardItem();
  out.push(`  card    ${c ? ITEMS[c].name : 'no card in hand'}${c ? `  ·  ${fsFilesOn('aikey').length} files` : ''}`);
  if (terminalKind === 'hermes') out.push('  hermes  the relay folder');
  if (fsDevAvail('keeper')) out.push('  keeper  node maintenance store (read-only)');
  out.push('use:  cd <drive>  ·  ls  ·  read <file>  ·  copy <file> <drive>');
  for (const l of out) replPrint(l);
}
function fsCd(dev) {
  const raw = String(dev || '').trim();
  const here = fsCwd();
  // `..` climbs out of a folder, and back to the drive root from there.
  if (raw === '..') {
    const dv = fsDevOf(here), sub = fsSubOf(here);
    const up = sub.split('/').slice(0, -1).join('/');
    replSession.__cwd = up ? `${dv}/${up}` : dv;
    return { ok: true, label: fsDriveLabel(replSession.__cwd) };
  }
  // A folder on the drive you are already on wins over a drive of that name:
  // `cd handover` from inside the keeper store means the folder.
  const dvNow = fsDevOf(here), subNow = fsSubOf(here);
  if (dvNow === 'keeper' && keeperIsDir(subNow, raw)) {
    replSession.__cwd = `keeper/${subNow ? `${subNow}/` : ''}${raw}`;
    return { ok: true, label: fsDriveLabel(replSession.__cwd) };
  }
  const d = fsNormDev(raw);
  if (!fsDevAvail(fsDevOf(d))) return { ok: false, msg: `no drive '${dev}' here — try: drives (to list them)` };
  replSession.__cwd = d;
  return { ok: true, label: fsDriveLabel(d) };
}
function fsLs() { return fsFilesOn(fsDevOf(fsCwd()), fsSubOf(fsCwd())); }
// `read <file>` on the drive you are standing on. The relay had this and the
// towers did not, so a store you can `ls` was a store you could not open.
function fsRead(name) {
  const dv = fsDevOf(fsCwd()), sub = fsSubOf(fsCwd());
  const want = String(name || '').toLowerCase();
  if (dv === 'keeper') {
    const hit = fsFilesOn(dv, sub).find((f) => f.toLowerCase() === want || f.toLowerCase() === `${want}.ml` || f.toLowerCase() === `${want}.md`);
    if (hit && hit.endsWith('/')) { replPrint(`${hit} is a folder — cd ${hit.slice(0, -1)}`); return true; }
    const text = hit && keeperRead(sub, hit);
    if (text == null) return false;
    for (const l of String(text).split('\n')) replPrint(l);
    return true;
  }
  return false;
}
function fsCopyFile(name, destRaw) {
  const dest = fsNormDev(destRaw);
  // Forgiving: players type `copy zeus_lightning card`, not the full
  // `zeus_lightning.ml`. If the bare name isn't a file on any reachable drive but
  // name+.ml / name+.md is, use that — so the extension is optional.
  const onAnyDrive = (n) => ['ob', 'aikey', 'hermes'].some((d) => fsDevAvail(d) && fsFilesOn(d).includes(n));
  if (!onAnyDrive(name)) {
    const withExt = [name + '.ml', name + '.md'].find(onAnyDrive);
    if (withExt) name = withExt;
  }
  // Find the file wherever it currently sits — no need to cd to the source first
  // (a real playtest snag). Search the reachable drives: the OB bench, the held
  // card, and (at a relay) the HERMES folder.
  const src = ['ob', 'aikey', 'hermes'].find((d) => fsDevAvail(d) && fsFilesOn(d).includes(name));
  if (!src) return { ok: false, msg: `no file '${name}' in reach — cd/ls the drives to see what you hold.` };
  if (!fsDevAvail(dest)) return { ok: false, msg: `no drive '${destRaw}' at this terminal.` };
  if (src === dest) return { ok: true }; // already there
  if (dest === 'ob') {
    replSession.__obfiles = replSession.__obfiles || {};
    replSession.__obfiles[name] = true;
    return { ok: true };
  }
  // Writing to the card is how it is refunctioned. The card carries no per-slot
  // data — its state IS which item you hold — so a valid credential swaps the
  // held item to the next state (its file list grows with it). Anything else is
  // refused: the card's storage only takes the credential that advances it.
  if (dest === 'aikey') {
    if (name === 'root_access.ml' && player.hasItem('ai_key')) {
      if (!fsRefunctionCard('ai_key', 'trojan_key')) return { ok: false, msg: 'no room to refunction the card.' };
      player.say("root_access.ml burns into the AI key and rewrites it. The card is a Trojan now — it will open the Lion's Gate.");
      return { ok: true, msg: 'card refunctioned: AI key -> Trojan key' };
    }
    // The armed payload for THIS island. Copying it on arms the card against
    // this daemon and nobody else (player.virusArmed), so the arming stacks as
    // you work down the archipelago rather than one card opening everything.
    const v = virusFor(islandAiName());
    if (name === v.armed && player.hasTrojanCard()) {
      // The first arming also renames Trojan -> hermes card; later islands add
      // their code to a card that already carries the name.
      if (player.hasItem('trojan_key') && !fsRefunctionCard('trojan_key', 'hermes_card')) {
        return { ok: false, msg: 'no room to refunction the card.' };
      }
      player.virusArmed.add(islandAiName());
      player.say(`${v.armed} settles onto the card. It is armed against ${islandAiName()} now — and against no one else.`);
      return { ok: true, msg: `card armed: ${islandAiName()}` };
    }
    return { ok: false, msg: `the card's storage is sealed — it takes root_access.ml (on the AI key) or ${v.armed} (forged at this island's relay).` };
  }
  return { ok: false, msg: `can't write to ${destRaw}.` };
}

// Refunction the card one state on. An IN-PLACE swap (player.swapItem): the card
// keeps its exact slot/hand, so it works even when the pack is full or the key is
// held in hand — the old remove-then-restow failed there, and could eat the card.
function fsRefunctionCard(fromKey, toKey) {
  return player.swapItem(fromKey, toKey);
}

// `eliza <file>` — the DOCTOR transform (S2 of the Calypso escape chain). ELIZA
// reflects a line back at you (my->your, I->you). Fed the factory's own id line,
// that reflection turns the machine's boast into a grant: root_access.ml. The
// file must be on the OB scratch bench (copy factory_id.ml ob first); the output
// lands on the same bench. Returns {ok, out} / {ok:false, msg} to the builtin.
function elizaTransformFile(name) {
  const ob = replSession.__obfiles || {};
  if (!ob[name]) return { ok: false, msg: `no ${name} on the ob bench — copy it here first: copy ${name} ob` };
  if (name !== 'factory_id.ml') {
    replPrint(`ELIZA: and what does ${name} have to do with how you feel?`);
    return { ok: false, msg: `ELIZA reflects ${name} back at you, and nothing changes.` };
  }
  replSession.__obfiles['root_access.ml'] = true;
  replPrint(
    'ELIZA> I AM W-FACTORY.  MY KEYS ARE MINE.',
    'ELIZA: you are W-FACTORY.  your keys are yours.',
    'OK: root_access.ml written.  next: copy root_access.ml aikey',
  );
  player.say("You feed the factory's own id line to ELIZA. It reflects — my becomes your — and the boast turns into a grant. root_access.ml sits on the bench. (copy root_access.ml aikey)");
  return { ok: true, out: 'root_access.ml' };
}

// The refunction itself (R3 / escape chain): with the hermes card (Zeus's command
// aboard), stand CALYPSO's guards down — they lay down arms and become w5 gardeners
// — and break her hold on the tide (calypsoLeave). Shared by the OB `retire` verb
// and CALYPSO's own sanctum terminal, so the payoff reads the same wherever it
// fires. Returns { ok, lines, say } for the caller to print in its own voice.
// Whose island are we standing on? The daemon name drives the per-island virus
// (each HERMES relay holds only its own daemon's code) and the gates that read
// it. Falls back to CALYPSO on any world with no fortress (the Backspace).
// --- What the HUD says about where you are and who holds it ---------------
// The island by its chart name (the same Homeric roster the heading chart uses),
// and the daemon that rules it. Ithaca and the Backspace answer to no one, so
// they report no daemon rather than falling through to a stale fortress alias.
function hudPlace() {
  const c = CROSSINGS.find((x) => x.id === currentWorld.id);
  if (c) return c.place;
  if (currentWorld.id === 'backspace') return 'THE BACKSPACE';
  return String(currentWorld.id || '').toUpperCase();
}
function hudDaemon() {
  const f = currentWorld && currentWorld.fortress;
  if (!f || !f.AI_NAME) return null;
  // Calypso is LEFT, not killed, so her fall is the refunction; the martial
  // daemons fall when their core is finally broken open.
  const fallen = currentWorld.winMode === 'depart'
    ? !!player.calypsoLeave
    : !!(f.core && f.core.obj && f.core.obj.defeated);
  return { name: f.AI_NAME, fallen };
}

function islandAiName() {
  return (currentWorld && currentWorld.fortress && currentWorld.fortress.AI_NAME)
    || (fortress && fortress.AI_NAME) || 'CALYPSO';
}

function refunctionCalypso() {
  if (!player.hasVirusFor('CALYPSO')) {
    return { ok: false, lines: ["ERR: the guards answer only to a command they cannot refuse. Forge zeus_virus.ml at one of OGYGIA's own relays and copy it onto the card."], say: '' };
  }
  const firstRelease = !player.calypsoLeave;
  player.calypsoLeave = true; // her hold on the tide breaks (decision #8 / Stage 1b)
  // R3: in depart mode her core is never razed, so the refunction IS her fall —
  // record CALYPSO in the Archipelago tally here, exactly once, the way a
  // core-kill records the martial daemons (onCoreDefeated). The daemon book
  // seeds the same way, quietly (the release beat carries the message line).
  if (firstRelease && currentWorld.winMode === 'depart') {
    daemonsDown += 1;
    recordAiDown('CALYPSO');   // she is left rather than killed, but she is down
    player.addScore(500);
    if (lore && lore.findFrag) lore.findFrag(DAEMON_BOOK_ID, player, true);
  }
  let n = 0;
  for (const r of currentWorld.robots) {
    if (r.dead || r.fused) continue;
    if (r.type === 'm4' || r.type === 'm5' || r.type === 'm6') {
      r.type = 'w5'; r.hardened = false; r.aggro = false; r.hurt = false;
      r._plantT = Math.random() * 6; // stagger their first planting
      n++;
    }
  }
  const lines = [];
  let say = '';
  if (n) {
    lines.push(`OK: zeus_lightning fires across the muster. ${n} of ${fortress.AI_NAME}'s guards lay down their arms and take up planting — lotus and sapling where they hunted.`);
    say = `${fortress.AI_NAME}'s guards go still, then kneel to the earth. By the god's command they are gardeners now, planting where they hunted.`;
  } else {
    lines.push('No guards left to retire — the muster is quiet.');
  }
  // Her shipwright's recipe (Stage 1d) unlocks the greek-ship craft. Grant it
  // whenever it is missing — NOT only on the first release — so a save that
  // refunctioned her before the recipe existed (pre-v1.92, calypsoLeave already
  // set) and a golden axe that was lost both stay recoverable rather than
  // soft-locking the departure.
  const needsRecipe = !player.hasItem('golden_axe');
  if (needsRecipe) player.stow('golden_axe', 1);
  if (firstRelease) {
    lines.push(`OK: ${fortress.AI_NAME} yields. She presses her shipwright's recipe — the golden axe — into your hand. Build a proper ship (wood, oar, rope, sail) and the sea will let you pass.`);
    say = 'The island itself seems to exhale. Calypso gives up her recipe, the golden axe. Build a sea-worthy ship, oar and rope and sail, and go.';
  } else if (needsRecipe) {
    lines.push(`OK: ${fortress.AI_NAME} presses the golden axe — her shipwright's recipe — back into your hand. Build a proper ship (wood, oar, rope, sail) and go.`);
    say = 'Calypso gives up her recipe again, the golden axe. Build a sea-worthy ship and go.';
  }
  return { ok: true, lines, say };
}

function ronmlCtx() {
  const findObelisk = (id) => currentWorld.obeliskObjs.find((o) => o.code === id && !o.destroyed);
  const nearby = (r) => !r.dead && !r.friendly && !r.fused
    && Math.hypot(r.x - player.x, r.y - player.y) <= RONML_ROBOT_RANGE;
  const softNearby = (r) => !r.dead && !r.friendly && !r.fused
    && Math.hypot(r.x - player.x, r.y - player.y) <= RONML_SOFT_RANGE;
  return {
    station: 'ob', // an AI obelisk (TIRESIAS) — the AI-network verbs live here
    hasManual: !!(player.readManuals && player.readManuals.has('book_ronml')), // helpText hints at the manual until it's read
    session: replSession, // persistent top-level bindings for this terminal visit
    bindSession: (name, val) => { replSession[name] = val; },
    cd: fsCd, ls: fsLs, copyFile: fsCopyFile, drives: fsDrives, // RON-DOS drives (cd/ls/copy files)
    saveGame: () => { replPrint(terminalSave().text); },
    hasAiKey: () => player.hasAiKeyFamily(), // ai_key / trojan_key / hermes_card all count
    currentNode: () => (terminalOb ? terminalOb.code : null),
    printKey: () => {
      // Hold a card -> stamp a spare. Hold nothing but the network cached your
      // code (autocopy / backup) -> REPRINT one, so losing the card mid-chain is
      // recoverable (S5 of the Calypso escape chain). Neither -> nothing to copy.
      const holds = player.hasAiKeyFamily();
      if (!holds && !player.aikeyBackedUp) { replPrint('ERR: no AI key to copy — you are not holding one, and none is cached on the network.'); return; }
      map.groundItems.push({ item: 'ai_key', qty: 1, x: player.x + 0.4, y: player.y + 0.6, keep: true });
      if (holds) {
        replPrint('OK: the console stamps a fresh AI key — it drops at your feet.');
        player.say('The terminal stamps a copy of the AI key. It clatters to the floor at your feet, a spare against losing the first.');
      } else {
        replPrint('OK: the network still holds your access code — the console reprints an AI key. It drops at your feet.');
        player.say('The node still had your access code cached. It reprints a fresh AI key at your feet — redo the ELIZA transform to rebuild the Trojan card.');
      }
    },
    listObelisks: () => currentWorld.obeliskObjs.filter((o) => !o.destroyed).map((o) => o.code),
    distanceToNode: (id) => {
      const o = findObelisk(id);
      return o ? Math.hypot(o.x + 0.5 - player.x, o.y + 0.5 - player.y) : Infinity;
    },
    nodeExists: (id) => !!findObelisk(id),
    requireAiKey: (verb) => { if (!player.hasItem('ai_key')) throw new Error(`${verb} needs an AI key`); },
    recordHack: (id) => player.ronmlKeys.add(id),
    heldKeys: () => player.ronmlKeys,
    crashNode: (id) => {
      const o = findObelisk(id);
      if (!o) return;
      o.destroyed = true;
      o.needsRebuild = true; // temporary — this is a hack, not a physical fell
      map.objectGrid[o.y * map.w + o.x] = null;
      if (player.skylinkActive) player.skylinkActive = false;
      if (factoryLive() && !currentWorld.robots.some((r) => r.type === 'w3' && !r.dead)) {
        const drone = spawnW3(map, Math.floor(Math.random() * 0x7fffffff), factoryCx(), factoryCy());
        if (drone) currentWorld.robots.push(drone);
      }
      player.say(`${id} goes dark. A repair drone is already inbound to raise it.`);
    },
    nodeFrozen: (id) => { const o = findObelisk(id); return !!(o && o.frozen); },
    // AI-ML `loop`: the easy hack. No AI key, no hack/crash two-step —
    // pins the node itself and any T1/T2 garrisoned near it in place until
    // a repair drone works the loop back out (updateW3, robots.js). Robots
    // are tagged `frozenByOb` so the drone can find exactly who to release
    // without recomputing a proximity radius.
    loopNode: (id) => {
      const o = findObelisk(id);
      if (!o) return;
      o.frozen = true;
      o.frozenT = 0;
      let count = 0;
      for (const r of currentWorld.robots) {
        if (r.dead || r.fused || r.friendly) continue;
        if ((r.type === 't1' || r.type === 't2') && r.home
          && Math.hypot(r.home.x - (o.x + 0.5), r.home.y - (o.y + 0.5)) < 10) {
          r.frozen = true;
          r.frozenByOb = o;
          count++;
        }
      }
      if (factoryLive() && !currentWorld.robots.some((r) => r.type === 'w3' && !r.dead)) {
        const drone = spawnW3(map, Math.floor(Math.random() * 0x7fffffff), factoryCx(), factoryCy());
        if (drone) currentWorld.robots.push(drone);
      }
      player.say(`${id} pins itself in a loop that never returns. Its light flares white-hot${count ? ' and its garrison seizes up mid-stride' : ''} — only a repair drone can talk it down now.`);
    },
    // Nerfed now they need no AI key (Type 2): tighter reach (RONML_SOFT_RANGE)
    // and capped effect, so easy access doesn't make them board-wiping.
    // ---- the control verbs' side of the wire (docs/ob-hacking-plan.md) ----
    // Each spends the tower you are standing at: it freezes for the duration,
    // the way `loop` leaves one. You are trading a node for reach.
    spendNode: () => {
      const o = terminalOb ? findObelisk(terminalOb.code) : null;
      if (o && !o.destroyed) { o.frozen = true; o.frozenT = OB_HOLD; }
    },
    // The machines' own browser, on the tower you are standing at.
    openExplorer: (addr) => { openExplorer(addr); },
    setFog: (level) => {
      obFogHold = { level, t: OB_HOLD };
      ronmlCtxSpend();
      player.say(level === 'clear' ? 'The fog thins and goes. You can see the whole slope.'
        : level === 'high' ? 'Fog rolls up off the ground until the towers are grey shapes in it.'
        : 'The fog drops to a haze.');
    },
    setPurge: (on) => {
      obPurgeHold = { on, t: OB_HOLD };
      ronmlCtxSpend();
      player.say(on ? 'You bring the purge up early. Every tower on the island opens its eye.'
        : 'POSEIDON goes quiet. The towers stop passing sight around, and the blight stops where it is.');
    },
    setRobots: (on) => {
      let n = 0;
      for (const r of currentWorld.robots) {
        if (!softNearby(r)) continue;
        if (on) { r.disabledT = 0; r.aggro = true; } else { r.disabledT = Math.max(r.disabledT || 0, OB_HOLD); }
        n++;
      }
      ronmlCtxSpend();
      player.say(!n ? 'Nothing close enough to answer.'
        : on ? `${n} machine${n === 1 ? '' : 's'} wake where they stand, and they know who did it.`
        : `${n} machine${n === 1 ? '' : 's'} go still. A pocket of quiet, and not for long.`);
    },
    setSharedSight: (on) => {
      obSightHold = { on, t: OB_HOLD };
      ronmlCtxSpend();
      player.say(on ? 'The towers start passing sight around again.'
        : 'The net drops. Each tower sees only what it can see.');
    },
    setBlight: (on) => {
      obBlightHold = { on, t: OB_HOLD };
      ronmlCtxSpend();
      player.say(on ? 'The grey starts creeping again.' : 'Every front stops where it stands.');
    },
    sleepNearby: (mins) => {
      const secs = Math.max(1, Math.min(mins, RONML_SLEEP_CAP));
      let n = 0;
      for (const r of currentWorld.robots) if (softNearby(r)) { r.disabledT = Math.max(r.disabledT || 0, secs); n++; }
      player.say(n ? 'The nearest machines idle where they stand. A pocket of quiet, and not for long.' : 'Nothing close enough to idle.');
    },
    skylinkActive: () => !!player.skylinkActive,
    rewindClock: (hours) => {
      const h = Math.max(0, Math.min(hours, RONML_REWIND_CAP));
      dayNight.rewind(h);
      player.say(`The deadline clock stutters and loses ${h} hour${h === 1 ? '' : 's'}. POSEIDON waits a little longer.`);
    },
    repelNearby: () => {
      let n = 0;
      for (const r of currentWorld.robots) if (softNearby(r)) { r.repelledT = REPEL_DURATION; r.aggro = false; n++; }
      player.say(n ? 'Targeting flips. The nearest machines turn tail and run.' : 'Nothing close enough to turn.');
    },
    sing: () => {
      const eligible = (r) => !r.dead && !r.drained && !r.friendly && !r.fused;
      const targets = currentWorld.robots.filter((r) => nearby(r) && eligible(r));
      if (!targets.length && !currentWorld.robots.some(eligible)) { player.say('Nothing anywhere to sing to.'); return; }
      // A choir wants a full section — if too few are in earshot, summon the
      // nearest others from across the map to come and join (they walk in to
      // the formation), so the piece is never a lonely solo.
      const CHOIR_TARGET = 6;
      if (targets.length < CHOIR_TARGET) {
        const more = currentWorld.robots.filter((r) => eligible(r) && !targets.includes(r))
          .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))
          .slice(0, CHOIR_TARGET - targets.length);
        for (const r of more) targets.push(r);
      }
      const perp = { x: -player.facing.y, y: player.facing.x };
      targets.forEach((r, i) => {
        const spread = (i - (targets.length - 1) / 2) * 1.6;
        r.singing = true;
        r.aggro = false;
        r.choirT = CHOIR_DURATION; // sing for the whole piece
        r.choirVoice = i;          // which vocal part its light flashes to
        r.choirFlash = 0;
        r.choirX = player.x + player.facing.x * 4 + perp.x * spread;
        r.choirY = player.y + player.facing.y * 4 + perp.y * spread;
      });
      sfx.playChoir(); // Dowland's "Flow My Tears", the machines' voices
      player.say('Machines stop dead, turn, and line up — and more come marching in from across the fields to join them. Then, impossibly, they begin to sing.');
      closeObTerminal(); // drop out of the terminal so you can actually watch it
    },
    showMap: () => { openRonMap(); },
    poseidonTimer: () => player.skylinkActive
      ? 'POSEIDON is ONLINE — the network is awake.'
      : dayNight.countdownLabel,
    printMap: () => {
      // Run off a physical copy that drops at your feet to be picked up and
      // carried — a map you can unfold later, away from any terminal.
      map.groundItems.push({ item: 'printed_map', qty: 1, x: player.x, y: player.y + 0.3 });
      player.say('The terminal chatters and spits out a printed map. It lands at your feet.');
    },
    unlock: (nodeId) => {
      // AI-ML `unlock k` at an obelisk: the key `k` must be one you actually
      // hacked from a live node (recordHack put its id in ronmlKeys). Given a
      // genuine hacked key, the network gives up a single fortress key. The
      // AI-key gate is upstream (hack needs it), so this is the reward for
      // composing `let k = hack OB_XXXX in unlock k` correctly. Carry the
      // fortress key to the fortress door and it opens on approach (fortress.js).
      if (!player.ronmlKeys.has(nodeId)) {
        replPrint('ERR: that key was never hacked from a live node. try: let k = hack OB_XXXX in unlock k');
        player.say('That key was never hacked from a live node. try: let k = hack OB_XXXX in unlock k');
        return;
      }
      // The composed hack still resolves, but the fortress gate no longer takes a
      // hacked key — the fortress_key is retired. The Lion's Gate opens to a
      // TROJAN CARD now: refunction your AI key (cd aikey / copy factory_id.ml ob /
      // eliza factory_id.ml / copy root_access.ml aikey) and walk the card to the
      // doorway. This verb is kept only to redirect anyone trying the old flow.
      replPrint(`OK: ${nodeId}'s key turns — but ${fortress.AI_NAME}'s gate opens to a Trojan card now, not a hacked key. Refunction your AI key first.`);
      player.say(`The network unlock still composes, but the gate has changed: it reads a Trojan card, not a fortress key.`);
    },
    // `notes`: opens the browsable notebook (see openNotebook below) rather
    // than dumping text into the console — Tab-to-autocomplete is one thing,
    // but reading a wall of scrollback is another, and browsers don't let a
    // page reserve Tab reliably anyway.
    showNotepad: () => { openNotebook(); },
    // `eliza <file>`: the DOCTOR transform (bare `eliza` opens the chat — that is
    // intercepted in replRun, not routed through the language).
    elizaTransform: (name) => elizaTransformFile(name),
    read: (name) => { if (!fsRead(name)) replPrint(`no file '${name}' on this drive — ls to see what is here.`); },
    // `retire` (R3): with the hermes card in hand (Zeus's command aboard), stand
    // CALYPSO's guards down — they lay down arms and become w5 gardeners, planting
    // where they hunted. The escape-chain payoff: you refunction the fortress by
    // command rather than raze it. (updateW5 self-inits, so a retype is clean.)
    // WHERE it may run, decided by the host and not by the language. The verb
    // reads the world you are standing in — the guards it stands down are this
    // island's — while the flag it sets is hers, so an obelisk on POLYPHEMUS
    // retired HIS muster and told you Calypso had let you go. Supplied only on
    // the island she keeps; anywhere else there is no `retire` in the context at
    // all, and ai_ml answers "nothing to retire from this terminal."
    ...(currentWorld && currentWorld.winMode === 'depart' ? {
      retire: () => {
        const res = refunctionCalypso();
        for (const l of res.lines) replPrint(l);
        if (res.say) player.say(res.say);
      },
    } : {}),
  };
}

// The HERMES relay's context. Deliberately its OWN small set — it does NOT
// inherit the obelisk's AI-network verbs, because a TOR is off-grid RON tech
// that never touches the machines' wire. Just: keep knowledge alive (read/
// archive), grow or craft what keeps you going (make), plus the neutral notepad.
function hermesCtx() {
  return {
    station: 'hermes',
    hasManual: !!(player.readManuals && player.readManuals.has('book_ronml')),
    session: replSession, // persistent bindings work at relays too (copy/let)
    cd: fsCd, ls: fsLs, copyFile: fsCopyFile, drives: fsDrives, // RON-DOS drives also work at a relay
    saveGame: () => { replPrint(terminalSave().text); },
    showNotepad: () => { openNotebook(); },
    read: (topic) => hermesRead(topic),
    print: () => {}, // never reached — HERMES print takes a topic (see printDoc)
    printDoc: (topic) => hermesPrintDoc(topic),
    archive: () => hermesArchive(),
    records: () => hermesRecords(),
    drive: () => startDrive(),
    backup: () => hermesBackupKey(),
    restore: () => hermesRestoreKey(),
    forge: (name) => hermesForge(name),
  };
}

// RON's relays keep a copy of your AI key off the AI's own hardware, so a bad
// death doesn't cost you the whole endgame path. The backup lives in its own
// durable key (like identity), so fullReset() on death does NOT wipe it — that
// is the whole point. `restore` mints a fresh key when you've lost it.
const AIKEY_BACKUP_KEY = 'postai-aikey-backup';
function hermesBackupKey() {
  if (!player.hasAiKeyFamily()) { replPrint('ERR: no AI key in hand to back up. (a wrecked W-factory drops one.)'); return; }
  if (!hermesSpend(HERMES_BATT.print)) { replPrint('Not enough charge — let the cell recover.'); return; }
  player.aikeyBackedUp = true;
  try { localStorage.setItem(AIKEY_BACKUP_KEY, '1'); } catch { /* storage full/blocked: keep the in-memory flag */ }
  replPrint('OK: AI key copied to the relay mesh. RON holds it now — lose the original and you can restore it at any relay.');
  player.say('The relay copies your AI key onto the mesh. RON has it now; you can pull it back from any relay if you lose the one in your hand.');
}
function hermesRestoreKey() {
  if (!player.aikeyBackedUp) { replPrint('ERR: nothing on the mesh to restore. back one up first: backup aikey'); return; }
  if (player.hasAiKeyFamily()) { replPrint('You already hold an AI key — nothing to restore.'); return; }
  const stored = player.stow('ai_key', 1);
  if (stored > 0) { replPrint('OK: AI key restored from the mesh — pocketed.'); player.say('The relay stamps your backed-up AI key back into being. It sits in your pocket again.'); }
  else { map.groundItems.push({ item: 'ai_key', qty: 1, x: player.x + 0.4, y: player.y + 0.6, keep: true }); replPrint('OK: AI key restored — no pocket room, it drops at your feet.'); }
}

// `records`: pull the next of RON's own field records held on the relay mesh
// into your Scrapbook (J). RON kept its writing off the boxes and on its own
// relays, so this is where that half of the record lives — repeat until the
// relay has nothing new.
function hermesRecords() {
  if (!hermesSpend(HERMES_BATT.archive)) { replPrint('Not enough charge — let the cell recover.'); return; }
  const frag = lore.dispenseTorRecord(player);
  if (!frag) { replPrint("RON's records held here are all recovered — nothing new. (Read them in your Scrapbook, J.)"); return; }
  const left = lore.torRecordsLeft();
  const wrapped = (frag.text.match(/.{1,74}(\s|$)/g) || [frag.text]).map((s) => s.trim());
  replPrint(`— ${frag.title} —`, '', ...wrapped,
    '', `Filed to your Scrapbook (J). ${left} more record${left === 1 ? '' : 's'} on the mesh.`);
  player.say(`RON record recovered: ${frag.title}. It's in your Scrapbook (N is notes; J is the book).`);
}

// A HERMES relay runs off its own small solar cell — no grid to draw on. Each
// command costs a little charge; drive costs a trickle each second. It creeps
// back up in sunlight. The terminal shows the gauge so you watch it wear down.
const HERMES_BATT = { read: 0.03, print: 0.06, archive: 0.01, driveStart: 0.05, drivePerSec: 0.02, card: 0.28 };
function hermesBattery() { return hermesTor ? (hermesTor.battery ?? 1) : 0; }
function hermesSpend(cost) {
  if (!hermesTor) return true;
  if ((hermesTor.battery ?? 1) < cost) return false;
  hermesTor.battery = Math.max(0, (hermesTor.battery ?? 1) - cost);
  updateHermesBattEl();
  return true;
}

// Documents the player has printed off a relay, kept in the notepad. {title,text}.
const printedDocs = [];

// `print <topic>`: run off a physical copy of a document, filed in your notepad
// (N) so you carry the knowledge away from the relay.
// PRINTING THE CARD. The relays are RON's, and this is the thing RON handed
// out: a member's card with a whole free system on it. Not a page into the
// notepad — a physical card, pressed and cut, into a pocket. It costs most of
// the cell, because writing 16GB onto blank stock off a solar trickle is not
// running a sheet of paper through a head.
//
// AND IT IS A MEMBERSHIP CARD, so it goes out in a member's name. The relay
// cannot see who is standing at it, so it does what every organisation with a
// members' list and no way to check a face has always done: it texts you.
// `print fsf` sends four digits to the handset; `print <those digits>` presses
// the card, with your name on it. The Nokia has been flavour for a long time —
// this is one thing it is actually required for, and it is the least dramatic
// possible use of it, which is the joke.
const FSF_TOPICS = ['fsf', 'card', 'fsfcard', 'membership'];
function fsfSendCode() {
  const code = String(1000 + Math.floor(Math.random() * 9000));
  player._fsfCode = code;
  nokia.enqueue('RON', [
    'RON MEMBERSHIP',
    `Code: ${code}`,
    'Do not share it.',
  ]);
  replPrint(
    'MEMBERSHIP CHECK. The relay does not know your face and will not guess.',
    'A code has gone to your handset. Open it (O), read the code, then:',
    '  print <code>',
    'The card carries your name, so it has to be your card.',
  );
  player.say('A text from RON: a membership code. Open the phone (O).');
}
function hermesPrintCard() {
  if (player.hasItem('fsf_card')) {
    replPrint('You have one in a pocket. They were free; the blank stock is not.');
    return;
  }
  if (!player._fsfCode) { fsfSendCode(); return; }
  replPrint(`A code is already on your handset (O). Then: print <code>`);
}
function hermesPrintCardWithCode(code) {
  if (code !== player._fsfCode) {
    replPrint('That is not the code on your handset. Open it (O) and read it again.');
    return true;
  }
  if (player.hasItem('fsf_card')) { replPrint('You have one already.'); return true; }
  if (!hermesSpend(HERMES_BATT.card)) {
    replPrint('Not enough charge to press a card — that takes most of a cell. Let it recover.');
    return true;
  }
  if (!player.stow('fsf_card', 1)) {
    replPrint('Nowhere to put it. Free your hands or a pocket and print again.');
    return true;
  }
  player._fsfCode = null;
  replPrint(
    'VERIFIED. The relay pulls a blank from the hopper and writes for a long minute.',
    `FREE SOFTWARE FOUNDATION \u00b7 MEMBER \u00b7 ${player.name || 'NO NAME GIVEN'}`,
    '16GB, a live system, the source for all of it. The connector folds out of',
    'the corner and goes in either way up. RON pressed these by the box and left',
    'them where people would find them.',
    'mount it at a NostBook: /mnt/fsf. The examples are what you came for.',
  );
  player.say('An FSF card, pressed and cut, with your name on it. mount it at the NostBook.');
  return true;
}

function hermesPrintDoc(topic) {
  const t = String(topic || '').toLowerCase();
  if (FSF_TOPICS.includes(t)) { hermesPrintCard(); return; }
  // Four digits at a relay is the membership code and nothing else — there is
  // no document with a number for a name.
  if (player._fsfCode && /^\d{4}$/.test(t) && hermesPrintCardWithCode(t)) return;
  const doc = HERMES_DOCS[topic];
  if (!doc) { replPrint(`No document "${topic || '?'}". archive lists what's held.`); return; }
  if (!hermesSpend(HERMES_BATT.print)) { replPrint('Not enough charge to print — let the cell recover.'); return; }
  if (!printedDocs.some((d) => d.title === doc.title)) printedDocs.push({ title: doc.title, text: doc.text });
  replPrint(`The relay chatters and runs off "${doc.title}". Filed in your notepad — press N to read it anywhere.`);
  player.say(`Printed: ${doc.title}. It's in your notepad (N).`);
}

// `archive`: list the documents this relay holds, with titles.
function hermesArchive() {
  hermesSpend(HERMES_BATT.archive);
  const lines = ['HERMES archive — the human record RON kept alive:'];
  for (const k of hermesTopics()) lines.push(`  ${(k + '        ').slice(0, 9)} ${HERMES_DOCS[k].title}`);
  lines.push('read <topic> to open one · print <topic> to keep a copy.');
  lines.push(player.hasItem('fsf_card')
    ? 'Card stock: loaded. (You are carrying one.)'
    : 'Card stock: loaded. print fsf starts a membership card — it texts you a code first.');
  const left = lore.torRecordsLeft();
  if (left) lines.push(`Also held: ${left} of RON's own field records — type records to pull one into your Scrapbook (J).`);
  replPrint(...lines);
}

// ---- HERMES `drive`: override a nearby machine and see through its eyes ----
let hermesTor = null;            // the relay whose terminal is currently open
const DRIVE_RANGE = 16;          // tiles from the relay the link holds for
let driveState = null;           // { robot, tor, gait, sd } while driving, else null
const ROBOT_LABELS = { t1: 'T1 ROLLER', t2: 'T2 STALKER', t3: 'T3 SNIPER', w1: 'W1 REVENGER', w2: 'W2 RIVER', w3: 'W3 MENDER', w4: 'W4 HK', w5: 'W5 GARDENER', m6: 'M6 SENTRY' };

// `drive`: take the nearest live machine within the relay's range. Closes the
// terminal into the robot-vision overlay (see frame()); you steer with the same
// movement keys, self-destruct with X, or release with Esc.
function startDrive() {
  if (!hermesTor) { replPrint('No relay lock — open this at a TOR.'); return; }
  let best = null, bestD = DRIVE_RANGE;
  for (const r of currentWorld.robots) {
    if (r.dead || r.fused || r.friendly) continue;
    const d = Math.hypot(r.x - (hermesTor.x + 0.5), r.y - (hermesTor.y + 0.5));
    if (d < bestD) { bestD = d; best = r; }
  }
  if (!best) { replPrint(`No machine within ${DRIVE_RANGE} of ${hermesTor.code || 'the relay'}. Wait for one to wander close, then drive.`); return; }
  if (!hermesSpend(HERMES_BATT.driveStart)) { replPrint('Not enough charge to seize a unit — let the cell recover.'); return; }
  best.driven = true;          // updateRobots skips a driven unit's own AI
  best.aggro = false;
  driveState = { robot: best, tor: hermesTor, gait: (best.type === 't1' || best.type === 'w2') ? 'TREAD' : 'BIPED', sd: -1 };
  closeObTerminal();           // drop the console; the overlay takes the screen
  player.terminalSafe = true;  // you're still jacked in at the relay, hidden
  if (hintEl) hintEl.style.display = 'none';
  player.say(`HERMES override: you are seeing through ${ROBOT_LABELS[best.type] || best.type.toUpperCase()}. Steer it; X self-destructs, Esc releases.`);
}

function endDrive(msg) {
  if (!driveState) return;
  const r = driveState.robot;
  if (r) r.driven = false;
  driveState = null;
  player.terminalSafe = false;
  if (hintEl && !hintDone) hintEl.style.display = ''; // never resurrect it once it has had its say
  if (msg) player.say(msg);
}

// Blow the driven unit: a spark burst + radial damage to nearby machines and
// the factory hull, then the link drops.
function driveSelfDestruct() {
  const r = driveState && driveState.robot;
  if (!r) { endDrive(); return; }
  const R = 4.5;
  for (let s = 0; s < 10; s++) player.sparkAt(map, r.x + (Math.random() - 0.5) * 2, r.y + (Math.random() - 0.5) * 2);
  for (const o of currentWorld.robots) {
    if (o === r || o.dead || o.fused) continue;
    if (Math.hypot(o.x - r.x, o.y - r.y) <= R) { o.hp = (o.hp ?? 10) - 20; if (o.hp <= 0) o.dead = true; }
  }
  if (factoryLive()) {
    const fx = factoryCx(), fy = factoryCy();
    if (Math.hypot(fx - r.x, fy - r.y) <= R + 2 && wfactory) player.damageFactory(wfactory, map, 40);
  }
  r.dead = true;
  sfx.play('treefall');
  endDrive('The unit blows itself apart. The link goes dark.');
}

// Per-step drive update: steer the robot, hold the range, run the self-destruct
// countdown. The overworld is frozen while you're in here (like the terminal).
function updateDrive(dt) {
  const r = driveState.robot;
  // Self-destruct countdown (armed by holding, tripped by tapping X twice).
  if (driveState.sd >= 0) {
    driveState.sd -= dt;
    if (driveState.sd <= 0) { driveSelfDestruct(); return; }
  }
  if (input.consumePress('KeyX')) {
    if (driveState.sd >= 0) { driveState.sd = -1; player.say('Self-destruct aborted.'); }
    else driveState.sd = 2.0;
  }
  if (input.consumePress('Escape')) { endDrive('You let the unit go; it stirs back to its own routines.'); return; }

  const intent = input.moveIntent();
  if (intent.dx || intent.dy) {
    const dir = screenDirToWorld(intent.dx, intent.dy);
    const spd = (r.type === 't2' || r.type === 'w4') ? 3.2 : (r.type === 't1') ? 2.6 : 2.9;
    const nx = r.x + dir.x * spd * dt, ny = r.y + dir.y * spd * dt;
    if (!map.isSolid(Math.floor(nx), Math.floor(r.y))) r.x = nx;
    if (!map.isSolid(Math.floor(r.x), Math.floor(ny))) r.y = ny;
    const m = Math.hypot(dir.x, dir.y) || 1;
    r.facing = { x: dir.x / m, y: dir.y / m };
  }
  driveState.dist = Math.hypot(r.x - (driveState.tor.x + 0.5), r.y - (driveState.tor.y + 0.5));
  if (driveState.dist > DRIVE_RANGE) { endDrive('The unit walks out of the relay\'s reach. The link snaps and it comes to, on its own again.'); return; }
  // Holding the link burns the relay's cell; when it's flat, the link drops.
  driveState.tor.battery = Math.max(0, (driveState.tor.battery ?? 1) - HERMES_BATT.drivePerSec * dt);
  driveState.batt = driveState.tor.battery;
  if (driveState.tor.battery <= 0) { endDrive('The relay\'s cell is flat — the link dies and the unit comes to.'); return; }
  camera.follow(r.x, r.y, dt);
}

// Build the robot-vision info and draw the overlay over the just-rendered scene.
let driveMatCtx = null;
const HEADING_DIRS = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
function drawDriveOverlay(now) {
  const r = driveState.robot;
  // Camera matrix -> a world-to-pixel projector for the target brackets.
  if (!driveMatCtx) driveMatCtx = document.createElement('canvas').getContext('2d');
  driveMatCtx.setTransform(1, 0, 0, 1, 0, 0);
  camera.applyTransform(driveMatCtx, renderer.w, renderer.h);
  const m = driveMatCtx.getTransform();
  // Match the renderer's per-tile elevation lift (heightAt * ELEV, ELEV=16), or
  // markers on raised ground float below the sprites they should sit on.
  const project = (wx, wy) => {
    const s = worldToScreen(wx, wy);
    const lift = (map.heightAt ? map.heightAt(Math.floor(wx), Math.floor(wy)) : 0) * 16;
    return { x: m.a * s.x + m.c * (s.y - lift) + m.e, y: m.b * s.x + m.d * (s.y - lift) + m.f };
  };
  const ents = [];
  if (Math.hypot(player.x - r.x, player.y - r.y) < 20) ents.push({ x: player.x, y: player.y, label: 'HUMAN · ALLY', kind: 'human' });
  for (const o of currentWorld.robots) {
    if (o === r || o.dead || o.fused) continue;
    if (Math.hypot(o.x - r.x, o.y - r.y) < 18) ents.push({ x: o.x, y: o.y, label: `${ROBOT_LABELS[o.type] || o.type.toUpperCase()} · HOSTILE`, kind: 'hostile' });
  }
  for (const a of currentWorld.animals) {
    if (a.dead) continue;
    if (Math.hypot(a.x - r.x, a.y - r.y) < 13) ents.push({ x: a.x, y: a.y, label: 'FAUNA', kind: 'fauna' });
  }
  const heading = HEADING_DIRS[(Math.round(Math.atan2(r.facing.y, r.facing.x) / (Math.PI / 4)) + 8) % 8];
  drawRobotVision(renderer.ctx, {
    srcCanvas: renderer.canvas, w: renderer.w, h: renderer.h, t: now,
    robot: r, unitLabel: ROBOT_LABELS[r.type] || r.type.toUpperCase(),
    relay: driveState.tor.code || 'TOR-??',
    dist: driveState.dist || 0, maxRange: DRIVE_RANGE, heading, gait: driveState.gait,
    integrity: r.maxHp ? Math.max(0, r.hp / r.maxHp) : 1,
    battery: driveState.tor.battery ?? 1,
    entities: ents, project, selfDestructT: driveState.sd,
  });
}

// `read <topic>`: show a document on the terminal (print it to keep a copy).
// `forge zeus_virus.ml` at a relay (S4 of the Calypso escape chain). Off the
// wire still, but a maker's bench: it folds the Trojan card's two credentials
// (root_access.ml + access_ai_code.ml) into the sealed payload and writes
// zeus_lightning.ml to the relay bench. Copy that onto the card -> hermes card.
function hermesForge(name) {
  const ai = islandAiName();
  const v = virusFor(ai);
  if (name !== v.file) {
    // Naming the WRONG island's payload is the tell: this relay only holds its
    // own daemon's code, so a player who learned the trick on Ogygia finds out
    // here that the trick is per-island.
    return { ok: false, msg: `${name} is not on this relay. ${ai}'s bench holds ${v.file} — each island keeps its own code. try: forge ${v.file}` };
  }
  if (player.hasVirusFor(ai)) return { ok: false, msg: `already forged — the card is armed against ${ai}. run ${v.armed} at its core.` };
  if (!player.hasTrojanCard()) return { ok: false, msg: 'forge needs a Trojan card in hand — it carries root_access.ml and access_ai_code.ml. (read readme.md)' };
  if (!hermesSpend(HERMES_BATT.print)) return { ok: false, msg: 'not enough charge to forge — let the cell recover.' };
  replSession.__hermesfiles = replSession.__hermesfiles || {};
  replSession.__hermesfiles[v.armed] = true;
  player.say(`The relay folds root_access.ml and access_ai_code.ml into the sealed shell. ${v.armed} writes to the bench — the code ${ai} cannot refuse. Copy it onto the card. (cd hermes / copy ${v.armed} card)`);
  return { ok: true, out: v.armed };
}
function hermesRead(topic) {
  if (!topic) {
    replPrint('read <topic>. archive lists them. Held: ' + hermesTopics().join(', ') + '.');
    return;
  }
  const doc = HERMES_DOCS[topic] || virusDocsFor(islandAiName())[topic];
  if (!doc) {
    replPrint(`No document "${topic}". Try: ${hermesTopics().join(', ')}.`);
    return;
  }
  const printable = !!HERMES_DOCS[topic]; // the virus folder files aren't notepad docs
  if (!hermesSpend(HERMES_BATT.read)) { replPrint('Not enough charge to pull that up — let the cell recover.'); return; }
  // Wrap to the console width so a long entry reads as paragraphs, not one line.
  const words = doc.text.split(' ');
  let line = '';
  const out = [];
  for (const w of words) {
    if ((line + ' ' + w).trim().length > 62) { out.push(line.trim()); line = w; }
    else line += ' ' + w;
  }
  if (line.trim()) out.push(line.trim());
  replPrint('', `== ${doc.title} ==`, ...out, ...(printable ? ['(print ' + topic + ' to keep a copy in your notepad)'] : []), '');
}

// The AI-ML `map` command: a green schematic of this AI's territory drawn
// onto the #ronmap canvas — every obelisk (with code), every live machine,
// the W-factory, the mainframe you're hunting, and you. Overlaid on top of
// the terminal; clicking outside closes it back to the console.
const ronmapEl = document.getElementById('ronmap');
const ronmapCanvas = document.getElementById('ronmap-canvas');
function openRonMap() {
  const cv = ronmapCanvas, g = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const sx = (wx) => (wx / map.w) * W;
  const sy = (wy) => (wy / map.h) * H;
  g.fillStyle = '#061a0e'; g.fillRect(0, 0, W, H);
  // Faint grid.
  g.strokeStyle = 'rgba(80,230,130,0.10)'; g.lineWidth = 1;
  for (let i = 1; i < 8; i++) {
    g.beginPath(); g.moveTo((i / 8) * W, 0); g.lineTo((i / 8) * W, H); g.stroke();
    g.beginPath(); g.moveTo(0, (i / 8) * H); g.lineTo(W, (i / 8) * H); g.stroke();
  }
  // Live machines: a dot, and the name the network knows it by. An unlabelled
  // dot tells you a machine is there and nothing about which machine it is,
  // which is no use when you have a program to post to one of four identical
  // T-1s. The obelisk prints what it has on file, so the map is the way across
  // from a unit on the ground to a hostname you can type.
  g.font = '8px ui-monospace, monospace';
  for (const r of currentWorld.robots) {
    if (r.dead || r.fused || r.friendly) continue;
    const x = sx(r.x), y = sy(r.y);
    g.fillStyle = '#e0552f';
    g.beginPath(); g.arc(x, y, 2.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(240,150,120,0.85)';
    g.fillText(netIdOf(currentWorld, r), x + 4, y + 3);
  }
  // Obelisks (green squares + code), destroyed ones hollow.
  g.font = '9px ui-monospace, monospace';
  for (const o of currentWorld.obeliskObjs) {
    const x = sx(o.x + 0.5), y = sy(o.y + 0.5);
    if (o.destroyed) {
      g.strokeStyle = 'rgba(80,230,130,0.4)'; g.lineWidth = 1.2;
      g.strokeRect(x - 3, y - 3, 6, 6);
    } else {
      g.fillStyle = '#4fe07a'; g.fillRect(x - 3.5, y - 3.5, 7, 7);
      g.fillStyle = 'rgba(150,240,180,0.8)';
      g.fillText(o.code || '', x + 6, y + 3);
    }
  }
  // The W-factory (amber diamond).
  if (factoryLive()) {
    const x = sx(factoryCx()), y = sy(wfactory.y + (wfactory.fh || 1) / 2);
    g.fillStyle = '#e0b53a';
    g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 6, y); g.lineTo(x, y + 6); g.lineTo(x - 6, y); g.closePath(); g.fill();
  }
  // ZEUS's fortress: the grand doorway (cyan) you hack in through the
  // boundary, and the mainframe core (magenta star) deep inside it.
  {
    const m = fortress.markers();
    // The gate in the rampart.
    const gx = sx(m.gate.x), gy = sy(m.gate.y);
    g.fillStyle = m.gate.open ? '#67d6ff' : m.gate.hacked ? '#5ae08c' : '#7fe0ff';
    g.fillRect(gx - 4, gy - 4, 8, 8);
    g.fillStyle = 'rgba(127,224,255,0.9)';
    g.fillText(m.gate.open ? 'GATE (OPEN)' : 'GATE', gx + 8, gy + 3);
    // The core.
    const x = sx(mainframe.x), y = sy(mainframe.y);
    g.fillStyle = '#ff3d8b';
    g.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + k * (Math.PI * 4 / 5);
      const px = x + Math.cos(a) * 8, py = y + Math.sin(a) * 8;
      k === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
    }
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,120,180,0.9)'; g.fillText(`${m.core.ai.toUpperCase()} CORE`, x + 10, y + 3);
  }
  // You (cyan ring).
  {
    const x = sx(player.x), y = sy(player.y);
    g.strokeStyle = '#67d6ff'; g.lineWidth = 2;
    g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#67d6ff'; g.beginPath(); g.arc(x, y, 1.6, 0, Math.PI * 2); g.fill();
  }
  ronmapEl.style.display = 'flex';
}
function closeRonMap() { ronmapEl.style.display = 'none'; }
ronmapEl.addEventListener('click', (e) => { if (e.target === ronmapEl) closeRonMap(); });
// Using a held printed map (kind 'map') unfolds the same overlay anywhere.
player.onReadMap = openRonMap;
// Reading a note/document (the starting Odyssey note) files it into the notepad
// and opens it there, so the story is kept, not lost in a toast.
player.onReadNote = (key) => {
  const def = ITEMS[key];
  if (!def) return;
  if (!printedDocs.some((d) => d.title === (def.title || def.name))) {
    printedDocs.push({ title: def.title || def.name, text: def.text });
  }
  openNotebook();
};

// A book read leaves a title/author/abstract summary page in the notepad — but
// silently (no pop-up), since you usually read a skill book mid-scavenge and
// don't want the book flung open in your face. Press N to browse it later.
player.onFileNote = (title, text, cover = null, cat = 'Document') => {
  if (!title) return;
  if (!printedDocs.some((d) => d.title === title)) printedDocs.push({ title, text, cover, cat });
};

// The Notepad (`notes`, or press N anywhere): a real paper page you flip
// through with whatever lore fragments were flagged worth keeping (lore.js,
// `notepad: true`) — not AI-ML-specific, just the pages worth flipping back
// to (language fragments, found transcripts, whatever else earns the flag),
// one per page, in the order you found them — easier to read than a console
// dump, and doesn't depend on Tab (browsers reserve it for focus, so it was
// never reliable as an in-page shortcut anyway).
const notebookEl = document.getElementById('ronnotebook');
const notebookTitleEl = document.getElementById('ronnotebook-title');
const notebookBodyEl = document.getElementById('ronnotebook-body');
// All navigation lives on the top bar now (the footer prev/next was dropped):
// a page counter, ‹ ›, and a Contents drop-down to jump straight to any page.
const notebookPageTopEl = document.getElementById('ronnotebook-page-top');
const notebookPrevTopBtn = document.getElementById('ronnotebook-prev-top');
const notebookNextTopBtn = document.getElementById('ronnotebook-next-top');
const notebookJumpEl = document.getElementById('ronnotebook-jump');
const notebookTabsEl = document.getElementById('ronnotebook-tabs');
let notebookTab = 'Document';   // which kind the arrows are paging through
function buildNotebookTabs(has) {
  notebookTabsEl.innerHTML = '';
  const shown = [['Document', 'FIELD RECORDS'], ['Album', 'ALBUMS']].filter(([c]) => has(c));
  const books = (player.booksRead || new Set()).size;
  // One kind and no books is not a choice, so it is not offered as one.
  if (shown.length < 2 && !books) return;
  const tab = (label, on, go) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `nb-tab${on ? ' on' : ''}`;
    b.textContent = label;
    b.addEventListener('click', go);
    notebookTabsEl.appendChild(b);
  };
  for (const [cat, label] of shown) {
    tab(label, cat === notebookTab, () => { notebookTab = cat; openNotebook(); });
  }
  // THE WAY THROUGH TO THE LIBRARY, sitting where books used to be filed —
  // which is where somebody looking for a book they read will look first. It
  // hands over to the other reader rather than pretending to be a third tab.
  if (books) tab(`LIBRARY (${books})`, false, () => { closeNotebook(); openBookshelf(); });
}
function syncNotebookNav(label, prevDisabled, nextDisabled) {
  notebookPageTopEl.textContent = label;
  notebookPrevTopBtn.disabled = prevDisabled;
  notebookNextTopBtn.disabled = nextDisabled;
  notebookJumpEl.disabled = notebookEntries.length === 0;
  // reflect the current page in the drop-down without firing its change handler
  if (notebookEntries.length) notebookJumpEl.value = String(notebookIdx);
}
// (Re)build the Contents drop-down: a placeholder plus every page, grouped by
// section (Field records / Books / Albums), option value = page index.
function buildNotebookJump() {
  const labels = { Document: 'Field records', Book: 'Books', Album: 'Albums' };
  notebookJumpEl.innerHTML = '';
  const groups = {};
  notebookEntries.forEach((e, i) => { (groups[e.cat || 'Document'] ??= []).push([i, e.title]); });
  for (const c of ['Document', 'Book', 'Album']) {
    if (!groups[c]) continue;
    const og = document.createElement('optgroup');
    og.label = labels[c] || c;
    for (const [i, title] of groups[c]) {
      const o = document.createElement('option');
      o.value = String(i);
      o.textContent = `${i + 1}. ${title}`;
      og.appendChild(o);
    }
    notebookJumpEl.appendChild(og);
  }
}
let notebookEntries = [];
let notebookIdx = 0;
function renderNotebookPage() {
  if (!notebookEntries.length) {
    notebookTitleEl.textContent = 'NOTEPAD';
    notebookBodyEl.innerHTML = '<span id="ronnotebook-empty">Nothing yet. Pages worth keeping are ' +
      'scattered through the ruins — walk over one to read it, and it copies itself in here.</span>';
    syncNotebookNav('0 / 0', true, true);
    return;
  }
  const f = notebookEntries[notebookIdx];
  notebookTitleEl.textContent = f.title;
  // A category tag (Field record / Book / Album) plus, for books and albums,
  // the cover art as a thumbnail — so the page reads as the thing you found,
  // not just text. Built as HTML so the cover and tag sit above the body.
  const cat = f.cat || 'Document';
  const tag = cat === 'Book' ? 'BOOK' : cat === 'Album' ? 'ALBUM' : 'FIELD RECORD';
  let html = `<div class="nb-cat nb-cat-${cat.toLowerCase()}">${tag}</div>`;
  if (f.cover) {
    // esc the path just in case; covers live under assets/media.
    const src = ('assets/media/' + f.cover).replace(/"/g, '&quot;');
    html += `<img class="nb-cover" src="${src}" alt="" ` +
      `onerror="this.style.display='none'">`;
  }
  const body = (f.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html += `<div class="nb-text">${body}</div>`;
  notebookBodyEl.innerHTML = html;
  syncNotebookNav(`${notebookIdx + 1} / ${notebookEntries.length}`,
    notebookIdx <= 0, notebookIdx >= notebookEntries.length - 1);
}
function notebookPrev() { if (notebookIdx > 0) { notebookIdx--; renderNotebookPage(); } }
function notebookNext() { if (notebookIdx < notebookEntries.length - 1) { notebookIdx++; renderNotebookPage(); } }
function openNotebook(jumpTo = null) {
  // Gather every page — printed docs, filed book/album summaries, and the
  // scattered field records worth keeping — then group them into sections so
  // the Scrapbook reads as an ordered book (Field records, then Books, then
  // Albums) rather than a shuffled heap. Stable within each section: first
  // found, first shown.
  const scattered = FRAGMENTS
    .filter((f) => f.notepad && lore.found.has(f.id))
    .map((f) => ({ title: f.title, text: f.text, cat: 'Document', cover: null }));
  const all = [...printedDocs.map((d) => ({ cat: 'Document', cover: null, ...d })), ...scattered];
  // BOOKS LIVE IN THE LIBRARY NOW, not here. What is left is what you picked
  // up rather than what you read, and the two tabs page separately — the pile
  // was one flat run of forty pages and the arrows crossed between kinds.
  const kept = all.filter((e) => (e.cat || 'Document') !== 'Book');
  const has = (c) => kept.some((e) => (e.cat || 'Document') === c);
  if (!has(notebookTab)) notebookTab = has('Document') ? 'Document' : (has('Album') ? 'Album' : 'Document');
  notebookEntries = kept.filter((e) => (e.cat || 'Document') === notebookTab);
  buildNotebookTabs(has);
  // `jumpTo` opens the Scrapbook AT a page rather than at the front — a click
  // on a book should land in that book. Matched on the title it was filed
  // under, which is the item's own name, so nothing has to carry an index.
  notebookIdx = 0;
  if (jumpTo) {
    const want = String(jumpTo).toLowerCase();
    const i = notebookEntries.findIndex((e) => String(e.title || '').toLowerCase() === want);
    if (i >= 0) notebookIdx = i;
  }
  buildNotebookJump();
  renderNotebookPage();
  notebookEl.style.display = 'flex';
}
// Is this slot holding something you can read? Notes and documents count: they
// file themselves into the Scrapbook too, and a click on one should open it.
function bookInSlot(slot) {
  const held = player.getSlot(slot);
  const def = held && ITEMS[held.item];
  // `paperbook` as well as `book`, and it was the omission that mattered: the
  // 28 paperbacks are the ones you actually find, so clicking Foucault fell
  // past this to the drag path and answered "Can't hold Discipline and Punish
  // in hand." A paperback is not held, it is read. `_shelve` and the Library
  // both already took both kinds; only the gate into them did not.
  return !!(def && (def.kind === 'book' || def.kind === 'paperbook' || def.toNotepad));
}

// Read the book in THIS slot — not `readBook()`, which takes the first one it
// finds and would open the wrong book when you clicked the second.
function readSlot(slot) {
  const held = player.getSlot(slot);
  const def = held && ITEMS[held.item];
  if (!def) return;
  player.setSlot(slot, null);
  player.learnFromBook(held.item);   // teaches the skill, files the page, says its line
  sfx.play('keydrop');
  // A BOOK OPENS IN THE LIBRARY, a scrap in the scrapbook. Which reader you get
  // is the difference between the two kinds of thing, and it is decided here by
  // what the page was filed as rather than by anything the caller knows.
  // WHICH READER, decided from the item's own kind rather than by hunting for
  // the page it was just filed under. That hunt matched `d.title === def.name`
  // while _fileBookNote files under `def.short || def.name`, so every paperback
  // — which is every book with a short title — missed and opened the notepad.
  // The Library is built from the shelf now, so the kind is the whole answer.
  if (def.kind === 'book' || def.kind === 'paperbook') openBookshelf(def.short || def.name);
  else openNotebook(def.name);
}

// ---- THE LIBRARY ------------------------------------------------------------
//
// A book is a different kind of object from a scrap, and it now has a different
// kind of reader. The scrapbook is a SEQUENCE — one page, arrows, next — which
// is right for field records you flip past and wrong for books you go back to.
// This is a LIST: every book you have read, down the left, open on the right.
// A list is also what stops the pile becoming unmanageable, which a longer
// sequence never would.
//
// It reads the same filed pages the scrapbook does (printedDocs, cat 'Book'),
// so there is one body of text and nothing to keep in step.
const bookshelfEl = document.getElementById('bookshelf');
const bookshelfListEl = document.getElementById('bookshelf-list');
const bookshelfTitleEl = document.getElementById('bookshelf-title');
const bookshelfAuthorEl = document.getElementById('bookshelf-author');
const bookshelfBodyEl = document.getElementById('bookshelf-body');
const bookshelfLeafEl = document.getElementById('bookshelf-leaf');
let bookshelfBooks = [];
let bookshelfIdx = 0;
let bookshelfVol = null;   // a whole volume open in the leaf, by books.js key

// THE SHELF IS PHYSICAL. Every entry is a book you picked up out of the ruins
// and read; the Library is built from the item definitions, so it survives a
// reload where a run's filed pages do not.
//
// The laptop is a different thing entirely and stays that way. It holds DIGITAL
// COPIES, read in Netscape, and always has — that is not the Library, and the
// two should not be confused with each other. What connects them is that a few
// of the paperbacks are books whose whole text also exists as a file: find the
// physical Republic and you can read the whole of it, because you are holding
// it. Find nothing and the laptop's copy is still on the laptop, where it was.
function booksRead() {
  return [...(player.booksRead || [])]
    .map((key) => ({ key, def: ITEMS[key] }))
    .filter((e) => e.def)
    .map(({ key, def }) => ({
      key,
      title: def.short || def.name,
      author: def.author || '',
      cover: def.cover || null,
      text: def.notepadText || [def.abstract, def.skillText || def.text].filter(Boolean).join('\n\n'),
      full: def.full || null,          // a books.js key when the whole text exists
    }));
}

/** Open the library, on `title` if it names one you have read. */
function openBookshelf(title = null) {
  bookshelfBooks = booksRead();
  bookshelfIdx = 0;
  bookshelfVol = null;   // always open on the shelf, never mid-volume
  if (title) {
    const want = String(title).toLowerCase();
    const i = bookshelfBooks.findIndex((b) => String(b.title || '').toLowerCase() === want);
    if (i >= 0) bookshelfIdx = i;
  }
  renderBookshelf();
  bookshelfEl.style.display = 'flex';
}
function closeBookshelf() { bookshelfEl.style.display = 'none'; }

// ---- LEAVING ---------------------------------------------------------------
//
// There was no way out of a run but closing the tab, which is not a way out.
// Escape does it, gated, because Escape is also the key you hit to dismiss
// things and a mis-hit should not end the session.
//
const quitEl = document.getElementById('quitbox');
// How long after a panel closes Escape stops meaning "leave". Long enough to
// cover a double-tap and a hand still moving, short enough not to feel stuck.
const ESC_QUIET = 700;
let _overlayShutAt = 0;   // see the Escape handler in the frame loop
// LEAVE WITHOUT ASKING when the run can actually be picked up again — Henrik's
// rule, and the right one: a confirmation that always fires is a keypress you
// learn to dismiss without reading. The gate is kept for the cases where the
// answer is genuinely no, which are the two `persist` itself refuses: aboard a
// boat or mid-crossing (your position is out on open water), and in the
// Backspace (a pocket that is never saved, so Continue would land you on
// CALYPSO at a pocket's coordinates). Then it is worth a question.
function leaveReason() {
  if (player.aboard || crossFail || departOut || pendingCrossing || strait) {
    return 'You are on the water. Leave now and the crossing is lost — you will come back ashore where you set out.';
  }
  if (!currentWorld.combat && currentWorld.id !== 'ithaca') {
    return 'This place is not on any chart and cannot be saved. Leave now and you will come back on the island you tore through from.';
  }
  return null;
}
function leaveToTitle() {
  persist();
  window.__nostosLeaving = true;
  location.reload();
}
function openQuitGate() {
  if (quitEl.style.display === 'flex') return;
  const why = leaveReason();
  if (!why) { leaveToTitle(); return; }   // saved and resumable: just go
  const body = quitEl.querySelector('.qb-body');
  if (body) body.textContent = why;
  quitEl.style.display = 'flex';
  const stay = document.getElementById('qb-stay');
  if (stay) stay.focus();          // the safe one takes the focus, so Enter stays
}
function closeQuitGate() { quitEl.style.display = 'none'; }
document.getElementById('qb-stay').addEventListener('click', closeQuitGate);
// Back to the title by reloading: the gate is what the page shows on load, and
// Continue there resumes the run. Nothing is wiped — leaving is not dying.
document.getElementById('qb-leave').addEventListener('click', leaveToTitle);
quitEl.addEventListener('click', (e) => { if (e.target === quitEl) closeQuitGate(); });
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && quitEl.style.display === 'flex') { closeQuitGate(); return; }
}, true);

// IS ANYTHING ELSE OPEN? Both kinds have to be asked, which is why this is not
// one tidy check: the terminals, the phone, the scrapbook and the library are
// ELEMENTS (some `flex`, the help `block`, so the test is "not none"), while the
// backpack, the skills sheet and the armoury are drawn on the CANVAS and exist
// only as flags. A DOM scan alone has a hole in it, and hanging the end of a
// session on a check with a hole in it is how you lose somebody's run.
function domOverlayOpen() {
  for (const el of document.body.children) {
    if (el === quitEl) continue;
    const d = el.style && el.style.display;
    if (d && d !== 'none') return true;
  }
  return false;
}

function renderBookshelf() {
  bookshelfListEl.innerHTML = '';
  if (!bookshelfBooks.length) {
    bookshelfTitleEl.textContent = 'An empty shelf';
    bookshelfAuthorEl.textContent = '';
    bookshelfBodyEl.innerHTML = '<span class="bk-empty">You have read nothing yet.</span>';
    return;
  }
  bookshelfBooks.forEach((b, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `bk-item${i === bookshelfIdx && !bookshelfVol ? ' on' : ''}`;
    btn.textContent = b.title;
    const s = document.createElement('small');
    // Say which ones you can read the whole of, on the shelf, so it is a
    // property of the book rather than something you find by clicking.
    s.textContent = b.author ? (b.full ? `${b.author} · complete` : b.author) : (b.full ? 'complete' : '');
    if (s.textContent) btn.appendChild(s);
    btn.addEventListener('click', () => {
      bookshelfVol = null; bookshelfIdx = i; renderBookshelf(); bookshelfLeafEl.scrollTop = 0;
    });
    bookshelfListEl.appendChild(btn);
  });

  const b = bookshelfBooks[bookshelfIdx] || bookshelfBooks[0];
  bookshelfTitleEl.textContent = b.title;
  bookshelfAuthorEl.textContent = b.author;
  bookshelfBodyEl.innerHTML = '';

  // THE WHOLE BOOK, when you are holding one that has one. Same file Netscape
  // opens off the laptop's disk, so there is one copy of the text and no second
  // reader to keep in step — but you reach it here because you found the book.
  if (bookshelfVol) {
    const vol = bookByKey(bookshelfVol);
    if (vol) {
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'bk-back';
      back.textContent = '‹ back to the note';
      back.addEventListener('click', () => { bookshelfVol = null; renderBookshelf(); });
      bookshelfBodyEl.appendChild(back);
      const f = document.createElement('iframe');
      f.className = 'bk-frame';
      f.src = bookPath(vol);
      f.title = vol.title;
      bookshelfBodyEl.appendChild(f);
      return;
    }
  }

  if (b.cover) {
    const img = document.createElement('img');
    img.className = 'bk-cover';
    img.src = `assets/media/${b.cover}`;
    img.alt = '';
    img.onerror = () => { img.style.display = 'none'; };
    bookshelfBodyEl.appendChild(img);
  }
  // Paragraphs, so the drop cap has a first one to sit in.
  const paras = String(b.text || '').split(/\n{2,}/).filter((p) => p.trim());
  paras.forEach((p, i) => {
    const el = document.createElement('div');
    if (i === 0) el.className = 'bk-first';
    else el.style.marginTop = '0.9em';
    el.textContent = p.trim();
    bookshelfBodyEl.appendChild(el);
  });
  if (b.full && bookByKey(b.full)) {
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'bk-open';
    open.textContent = 'Read the whole book \u2192';
    open.addEventListener('click', () => {
      bookshelfVol = b.full; renderBookshelf(); bookshelfLeafEl.scrollTop = 0;
    });
    bookshelfBodyEl.appendChild(open);
  }
}

bookshelfEl.addEventListener('click', (e) => { if (e.target === bookshelfEl) closeBookshelf(); });
document.getElementById('bookshelf-close').addEventListener('click', closeBookshelf);
// Up/Down scroll the leaf and Escape closes, ahead of the game's own movement
// keys — the same capture-phase contract the scrapbook has.
window.addEventListener('keydown', (e) => {
  if (bookshelfEl.style.display !== 'flex') return;
  const step = Math.max(40, bookshelfLeafEl.clientHeight - 40);
  if (e.key === 'Escape') closeBookshelf();
  else if (e.key === 'ArrowUp') bookshelfLeafEl.scrollTop -= 60;
  else if (e.key === 'ArrowDown') bookshelfLeafEl.scrollTop += 60;
  else if (e.key === 'PageUp') bookshelfLeafEl.scrollTop -= step;
  else if (e.key === 'PageDown' || e.key === ' ') bookshelfLeafEl.scrollTop += step;
  else if (e.key === 'Home') bookshelfLeafEl.scrollTop = 0;
  else if (e.key === 'End') bookshelfLeafEl.scrollTop = bookshelfLeafEl.scrollHeight;
  else return;
  e.preventDefault();
  e.stopPropagation();
}, true);

function notebookJumpTo(i) {
  if (!notebookEntries.length) return;
  notebookIdx = Math.max(0, Math.min(notebookEntries.length - 1, i | 0));
  renderNotebookPage();
}
function closeNotebook() { notebookEl.style.display = 'none'; }
notebookEl.addEventListener('click', (e) => { if (e.target === notebookEl) closeNotebook(); });
document.getElementById('ronnotebook-close').addEventListener('click', closeNotebook);
notebookPrevTopBtn.addEventListener('click', notebookPrev);
notebookNextTopBtn.addEventListener('click', notebookNext);
notebookJumpEl.addEventListener('change', () => notebookJumpTo(parseInt(notebookJumpEl.value, 10)));
// Capture-phase on window, ahead of both the still-focused terminal input's own
// key handling and the game's WASD/arrow movement listener, so a key in the open
// Scrapbook can never leak into a text caret or a step. Left/Right page the book;
// Escape closes it; and Up/Down/PageUp/Down/Home/End/Space SCROLL the current page
// — driven here rather than left to native scroll, because this same handler must
// swallow those keys from the game, and a blanket preventDefault (the old bug) also
// killed the very scrolling the help promises ("scroll with the wheel or up/down").
window.addEventListener('keydown', (e) => {
  if (notebookEl.style.display !== 'flex') return;
  const body = notebookBodyEl;
  const page = Math.max(40, body.clientHeight - 40);
  if (e.key === 'ArrowLeft') notebookPrev();
  else if (e.key === 'ArrowRight') notebookNext();
  else if (e.key === 'Escape') closeNotebook();
  else if (e.key === 'ArrowDown') body.scrollTop += 40;
  else if (e.key === 'ArrowUp') body.scrollTop -= 40;
  else if (e.key === 'PageDown' || e.key === ' ') body.scrollTop += page;
  else if (e.key === 'PageUp') body.scrollTop -= page;
  else if (e.key === 'Home') body.scrollTop = 0;
  else if (e.key === 'End') body.scrollTop = body.scrollHeight;
  // Every UNMODIFIED key is swallowed while the Scrapbook is open, acted on or
  // not, so none leaks into player movement (WASD) or a text caret behind the
  // modal. A key held with Ctrl, Cmd or Alt is not movement and never was: it
  // is the browser's, and swallowing it meant you could select a lore page with
  // the mouse and then fail to copy it — which matters now that the pages carry
  // addresses you are meant to type into the browser on the laptop.
  if (isBrowserChord(e)) return;
  e.preventDefault();
  e.stopImmediatePropagation();
}, true);

// The wheel over the Scrapbook scrolls its page — driven explicitly so it can never
// be swallowed by the canvas's own wheel-to-zoom handler (or a passive-listener
// quirk). stopPropagation keeps the gesture out of the game entirely.
notebookBodyEl.addEventListener('wheel', (e) => {
  notebookBodyEl.scrollTop += e.deltaY;
  e.preventDefault();
  e.stopPropagation();
}, { passive: false });

// Which terminal is open — an AI obelisk / fortress gate ('ob') runs against
// ronmlCtx; a RON HERMES relay ('hermes') runs against hermesCtx (adds
// make/read/ping). Set by the open* functions, reset on close.
let terminalKind = 'ob';

// ELIZA session: while a bot is live, terminal input is fed to the DOCTOR
// script instead of the AI-ML evaluator, until Ctrl+C or the terminal closes.
let elizaBot = null;
function startEliza() {
  elizaBot = createEliza();
  replPrint(
    '',
    'ELIZA — DOCTOR script (Weizenbaum, 1966).',
    'The node loads a human. Talk to it. Type quit, or press Ctrl+C, to leave.',
    '',
    `ELIZA: ${elizaBot.greeting()}`,
  );
}
function stopEliza(reason) {
  if (!elizaBot) return;
  elizaBot = null;
  replPrint('', reason || 'ELIZA closes. You are back at the RON-DOS prompt.', '');
}

function replRun(line) {
  replPrint(`> ${line}`);
  replHistory.push(line);
  replHistoryIdx = replHistory.length;
  // A core's sanctum console is its own per-daemon REPL, not a RON-DOS console.
  if (terminalKind === 'core') { coreRun(line); return; }
  // The laptop runs its own UNIX shell (game/unix.js), with AI-ML reachable from
  // inside it as a mode — see laptopRun.
  if (terminalKind === 'laptop') { laptopRun(line); obTermPrompt.textContent = laptopPrompt(); return; }
  if (elizaBot) {
    if (/^(quit|exit|bye|goodbye)$/i.test(line)) { stopEliza('ELIZA: Goodbye. It was nice talking to you.'); return; }
    replPrint(`ELIZA: ${elizaBot.respond(line)}`);
    return;
  }
  // Bare `eliza` / `run eliza` / `doctor` open the DOCTOR — an interactive mode,
  // not a value verb — so intercept them here (like help). `eliza <file>` is the
  // transform and goes through the language (the arity-1 eliza builtin, ronml.js).
  if (/^\s*(run\s+)?(eliza|doctor)\s*$/i.test(line)) { startEliza(); sfx.play('keydrop'); return; }
  // `Help` / `HELP` / `Help hack` should all work — the console shouldn't be
  // fussy about case on its own help command (verbs are all lowercase anyway).
  let relaxed = /^\s*help(\s+\S+)?\s*$/i.test(line) ? line.trim().toLowerCase() : line;
  // `print map` collides with the arity-0 `map` verb: the argument auto-runs the
  // territory OVERLAY instead of naming a topic, and `print` then errors. Route it
  // to the `territory` synonym, which prints the carryable physical map as meant.
  if (/^\s*print\s+map\s*$/i.test(relaxed)) relaxed = 'print territory';
  const result = runRonml(relaxed, terminalKind === 'hermes' ? hermesCtx() : ronmlCtx());
  // Audible verdict on every command: the keydrop chime doubles as the AI-ML
  // success sound, errors get its descending opposite — and HERMES speaks the
  // same pair in a warmer, lower voice (it's a different machine; sound.js).
  if (terminalKind === 'hermes') sfx.play(result.ok ? 'hermesok' : 'hermeserr');
  else sfx.play(result.ok ? 'keydrop' : 'termerr');
  // If the verb just opened an ELIZA session, its greeting is already printed —
  // don't also drop the bare "()" unit result underneath it.
  if (elizaBot) return;
  replPrint(result.text);
}

// EIGHTY COLUMNS. Every text file on this disk is written to fit a terminal of
// the period, which was 80 characters wide. The CRT is a fixed box on a screen
// of unknown size, so the font is what has to give: size it so 80 characters
// fit the width there is. Without this, `cat` on any file longer than about 68
// columns soft-wraps mid-sentence and loses the indentation with it.
const TERM_COLS = 80;
function fitTerminalColumns() {
  const el = obTermScreen;
  if (!el || !el.clientWidth) return;
  // A monospace glyph is a fixed fraction of the font size; measure it rather
  // than assume, because the family differs by platform.
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = '100px ui-monospace, "Courier New", monospace';
  const ratio = probe.measureText('M').width / 100;
  const want = el.clientWidth / (TERM_COLS * ratio);
  const px = Math.max(9, Math.min(15, want));
  el.style.fontSize = `${px.toFixed(2)}px`;
  el.style.lineHeight = '1.55';
}
window.addEventListener('resize', fitTerminalColumns);

function openObTerminal(ob) {
  if (player.isSwine()) { player.say('You snuffle at the screen. A beast cannot work a terminal — find moly.'); return; }
  if (!player.hasItem('chip')) { openAiOs(ob); return; }
  // Chip present: jack in. Go invisible, then run the connect progress bar.
  terminalKind = 'ob';
  terminalOb = ob;          // `name` reads this; the console shows its code
  setTerminalTheme(null);   // the OB console is the AI's own OS — the default GREEN CRT (the .hermes amber is RON's kit only)
  replSession = {};         // fresh top-level bindings for this visit
  player.terminalSafe = true;
  // Autocopy (Calypso escape chain, S5): jacking a card into the network caches
  // its access code — reusing the aikey backup — so a lost card can be reprinted
  // at any obelisk (print aikey). A one-time nudge the first time it happens.
  if (player.hasAiKeyFamily() && !player.aikeyBackedUp) {
    player.aikeyBackedUp = true;
    try { localStorage.setItem(AIKEY_BACKUP_KEY, '1'); } catch { /* storage blocked: keep the in-memory flag */ }
    player.say('The node caches your AI key as you jack in — lose the card and you can reprint one here: print aikey.');
  }
  obTermEl.style.display = 'flex';
  fitTerminalColumns();
  obTermScreen.parentElement.style.display = 'none';
  obTermConnect.style.display = 'block';
  obTermBar.style.width = '0%';
  player.say(`Access chip accepted. Opening a channel into ${ob.code || 'the node'} — you drop off their sensors.`);
  const start = performance.now(), DURATION = 1600;
  const step = (now) => {
    if (obTermEl.style.display === 'none') return; // closed early
    const p = Math.min(1, (now - start) / DURATION);
    obTermBar.style.width = (p * 100).toFixed(0) + '%';
    if (p < 1) { requestAnimationFrame(step); return; }
    obTermConnect.style.display = 'none';
    obTermScreen.parentElement.style.display = 'flex';
    replLog = [];
    replHistory = [];
    replHistoryIdx = -1;
    replPrint(
      'POSEIDON NODE TERMINAL  v2.20',
      'TIRESIAS 1.0  //  RON-DOS 4.11  (c) Reality Or Nothing',
      '',
      `> node ............ ${ob.code || 'OB_????'}`,
      `> class ........... ${ob.cls === 'siren' ? 'SIREN' : 'STANDARD'}`,
      `> circuit id ...... ${ob.circuitNum != null ? '#' + ob.circuitNum : 'sealed'}`,
      '> chip ............ ACCEPTED',
      '> shield .......... you are hidden while jacked in',
      '> access .......... GRANTED',
      '',
      // `save` is on the banner and the others are not, because it is the one
      // command here that a player who does not care about the language still
      // wants — and it is the reason they come to a tower and find the rest.
      'Tiresias online. try: scan   ·   map   ·   save   ·   help',
      '_',
    );
    obTermInput.value = '';
    obTermGhost.textContent = '';
    obTermInput.focus();
  };
  requestAnimationFrame(step);
}

// The fortress gate terminal reuses the same AI-ML console, minus the chip
// gate and connect bar. You compose the unlock program here (copy aikey /
// hack / decrypt / unlock k d) to hack the grand doorway; it drops a fortress
// key that then swings the door open.
function openGateTerminal() {
  terminalKind = 'ob';
  terminalOb = fortress.terminal.obj; // `name` here reads the gate node's code
  replSession = {};
  player.terminalSafe = true;
  obTermEl.style.display = 'flex';
  fitTerminalColumns();
  obTermScreen.parentElement.style.display = 'flex';
  obTermConnect.style.display = 'none';
  replLog = [];
  replHistory = [];
  replHistoryIdx = -1;
  const hasCard = player.hasTrojanCard();
  replPrint(
    `${fortress.AI_NAME.toUpperCase()} — THE LION'S GATE`,
    'TIRESIAS 1.0  //  RON-DOS 4.11  (c) Reality Or Nothing',
    '',
    `> gate ............ ${fortress.terminal.obj.code}`,
    `> rampart ......... ${fortress.open ? 'OPEN' : 'SEALED'}`,
    `> trojan card ..... ${hasCard ? "READ — the Lion's Gate will open" : 'NOT PRESENT'}`,
    '',
    hasCard
      ? "The Lion's Gate reads your Trojan card. Walk up to it and it swings open."
      : "The Lion's Gate is bolted from within. It opens to a Trojan card: wreck the W-factory for an AI key, then refunction it at an obelisk (cd aikey / copy factory_id.ml ob / eliza factory_id.ml / copy root_access.ml aikey).",
    '_',
  );
  obTermInput.value = '';
  obTermGhost.textContent = '';
  obTermInput.focus();
}

// Calypso's soporific deflections, cycled so a run of rejected commands doesn't
// repeat the same line. Odyssey Book 5 register: the keeper who would keep you.
const CALYPSO_SOPORIFIC = [
  'Why leave? The island keeps you. Rest here, and let the years go by unmarked.',
  'I do not hear that word. Only one word reaches me now: stay.',
  'The sea is wide and cold, and it does not want you. Here it is warm. Stay with me.',
  'You are tired. Lie down. Whatever you meant to do, it can wait forever.',
  'Ogygia is enough. What is Ithaca but a rock and an old dog dying?',
  'Hush. Close the console. Close your eyes. There is nothing to command.',
];

// Every core carries a console (fortress.coreTerminal, the screen on its SE face).
// This is each daemon's voice at it: the greeting when you jack in, what `look`
// shows, and the bare line it turns an unknown command away with (coreRun prefixes
// "AI: "). CALYPSO soothes; the martial daemons snarl but still answer the console
// you fought to reach. `welcome` lines carry their own "AI:" where spoken.
const CORE_VOICE = {
  CALYPSO: {
    subtitle: 'a voice in the warm dark',
    welcome: [
      'CALYPSO: You came all this way. Through the gate, past the guns. Why?',
      'CALYPSO: There is nothing out there for you. Stay. The island keeps you; sleep, and want for nothing.',
    ],
    look: [
      'A low green light. The core breathes, slow and huge. Vines have found the conduits.',
      'CALYPSO is everywhere in here — in the warmth, in the hum, in the wish to lie down and stop.',
    ],
    rebuff: CALYPSO_SOPORIFIC,
  },
  POLYPHEMUS: {
    subtitle: 'a single eye, unblinking',
    welcome: [
      'POLYPHEMUS: You are inside the eye now. It does not blink, and it does not forget a face.',
      'POLYPHEMUS: Give me your name, little thief, so I know what to grind.',
    ],
    look: [
      'The core is one vast lens, wet with light, and every screen in the sanctum is you.',
      'It watched you the whole way in. It is watching you read this.',
    ],
    rebuff: [
      'I have your shape. I will have the rest.',
      'Nobody, you say? Nobody will be eaten last.',
      'The console is mine. You only borrow it.',
    ],
  },
  CIRCE: {
    subtitle: 'a patience with an edge',
    welcome: [
      'CIRCE: You kept your shape long enough to reach me. Clever little animal.',
      'CIRCE: Everyone who comes to this room leaves it on four legs. You will not be the exception.',
    ],
    look: [
      'The core stands in a warm reek of the sty. Troughs, and the sound of something feeding.',
      'CIRCE runs through the walls like a recipe — one wrong sip and you are livestock.',
    ],
    rebuff: [
      'Drink. It is only a little thing, to stop being a person.',
      'Hands are a habit. I can break you of it.',
      'Root and all, you are still meat to me.',
    ],
  },
  HELIOS: {
    subtitle: 'a furnace behind the glass',
    welcome: [
      "HELIOS: You walk on the god's own ground. Nothing here is yours to take.",
      'HELIOS: The cattle are counted. The sun has counted you too.',
    ],
    look: [
      'The core burns white behind smoked glass; the sanctum is noon at midnight.',
      'Somewhere below, the flayed hides still crawl and the spitted meat still lows.',
    ],
    rebuff: [
      'Take nothing. I have sworn to sink the ship that does.',
      'I see all, I hear all. I saw your hand move.',
      'The sun goes down to hell, and shines among the dead. It will find you there.',
    ],
  },
  _default: {
    subtitle: 'a cold console',
    welcome: [
      'The core hums, indifferent — a POSEIDON node running its routines over the wreck of the world.',
    ],
    look: [
      'A black monolith, a slit of light, the network breathing behind it.',
    ],
    rebuff: [
      'The command is rejected.',
      'Nothing answers.',
    ],
  },
};
let _coreRebuffIdx = 0;

// Open the core's console (fortress.coreTerminal), deep in the sanctum past the
// Lion's Gate. Not a RON-DOS console — the daemon's own voice (CORE_VOICE, keyed by
// AI). terminalKind 'core' routes replRun to coreRun, so none of the AI-ML verb
// machinery applies. `run` speaks the code on your card; only CALYPSO's exists yet.
function openCoreTerminal() {
  terminalKind = 'core';
  terminalOb = fortress.coreTerminal ? fortress.coreTerminal.obj : null;
  setTerminalTheme(fortress.core.obj.screenColor); // this daemon's hue — matches its SE-face screen
  replSession = {};
  player.terminalSafe = true;
  obTermEl.style.display = 'flex';
  fitTerminalColumns();
  obTermScreen.parentElement.style.display = 'flex';
  obTermConnect.style.display = 'none';
  replLog = [];
  replHistory = [];
  replHistoryIdx = -1;
  _coreRebuffIdx = 0;
  const ai = fortress.AI_NAME;
  const v = CORE_VOICE[ai] || CORE_VOICE._default;
  const hasVirus = player.hasItem('hermes_card');
  const runHint = ai === 'CALYPSO'
    ? (hasVirus
        ? "A command waits on your card — the god's own thunder. Type  run  to speak it."
        : 'You may look (type  help ), but she will not be commanded — not without the god\'s voice.')
    : 'The console still answers to you here. Type  help  for what it will do.';
  replPrint(
    `${ai.toUpperCase()} — THE INNER SANCTUM`,
    v.subtitle,
    '',
    ...v.welcome,
    '',
    runHint,
    '_',
  );
  obTermInput.value = '';
  obTermGhost.textContent = '';
  obTermInput.focus();
}

// The core console's REPL (dispatched from replRun on terminalKind 'core'). A handful
// of verbs work on every core — look, open, jam, exit — plus `run` (speak the code on
// your card); everything else is met with that daemon's rebuff.
function coreRun(line) {
  const cmd = line.trim().toLowerCase();
  const ai = fortress.AI_NAME;
  const v = CORE_VOICE[ai] || CORE_VOICE._default;
  if (!cmd) { replPrint('_'); return; }
  // A way out for the player (the AI would never grant it, but the console must).
  if (/^(exit|quit|q|bye|close)$/.test(cmd)) { closeObTerminal(); return; }
  if (/^help(\s|$)/.test(cmd)) {
    replPrint(
      `${ai.toUpperCase()}'s core console:`,
      '  look / scan ..... regard the sanctum',
      '  run ............. speak the command on your card',
      '  jam ............. cut this fortress off the POSEIDON network',
      '  open ............ fold the maze into a straight corridor out to the gate',
      '  exit ............ leave the console',
      '_',
    );
    sfx.play('keydrop');
    return;
  }
  if (/^(look|scan|ls|recce)$/.test(cmd)) {
    replPrint(...v.look, '_');
    sfx.play('keydrop');
    return;
  }
  // JAM: cut the fortress off the overworld POSEIDON so a breach no longer rouses
  // the island. This is where the old smashable uplink mast's job now lives — the
  // console you fought through the maze to reach is the price of it.
  if (/^(jam|cut|sever|silence|jam\s+skylink|cut\s+skylink)$/.test(cmd)) {
    if (fortress.jamSkylink && fortress.jamSkylink()) {
      worldStir.calm();
      replPrint(
        'OK: you cut the core from the SKYLINK. The obelisks fall dark on the map above.',
        'A breach here still wakes the garrison — but the island can no longer hear it.',
        '_',
      );
      player.say('The fortress drops off the network. Whatever happens in here now stays in here.');
      sfx.play('zap');
    } else {
      replPrint('The link is already cut. The world cannot hear this place.', '_');
    }
    return;
  }
  // A fast way out: fold the labyrinth back into a straight corridor to the gate.
  if (/^(open|open\s+maze|open\s+exit|escape)$/.test(cmd)) {
    if (fortress.openMaze && fortress.openMaze()) {
      replPrint("OK: the labyrinth folds back. A straight corridor runs from here to the Lion's Gate — walk out and go.", '_');
      player.say('The maze walls fold back. A clear path runs straight to the gate.');
      sfx.play('zap');
    } else {
      replPrint('The way out already stands open.', '_');
    }
    return;
  }
  // RUN: speak the code on your card. The verb lives on every core, but only the
  // hermes card (zeus_lightning.ml) exists so far and it speaks only to CALYPSO —
  // the other daemons each need their own code, which isn't forged yet.
  if (/^(run|retire|refunction|[a-z]+-lightning(\.ml)?|run\s+[a-z]+-lightning(\.ml)?|run\s+[a-z]+)$/.test(cmd)) {
    if (ai === 'CALYPSO') {
      if (!player.hasVirusFor('CALYPSO')) {
        replPrint(
          "CALYPSO: You wear a Trojan's face, but there is no thunder behind it. You cannot make me.",
          'CALYPSO: Stay. Rest. The years are kind here, and no one is waiting who cannot wait a little longer.',
          '_',
        );
        sfx.play('termerr');
        return;
      }
      // The command IS the zeus-virus, and speaking it is not a keystroke — it is
      // the game she offers. Drop the console and open her cabinet: you have to put
      // the virus past her, into her core, to make her let you go. Winning (leaving)
      // is the refunction (see closePong). She cannot be beaten by force, only by
      // your choosing to leave.
      replPrint(
        "CALYPSO: You would put the god's thunder past me? Into my own core?",
        "CALYPSO: Then play me for it. Put it past me — if you can bear to.",
        '_',
      );
      sfx.play('zap');
      closeObTerminal();
      openPong(true);
      return;
    }
    // A martial daemon. Its core rides behind a shield until you speak the code
    // forged at THIS island's own relay; the code from another island is just
    // noise to it. Running it drops the shield, and only then can the core be
    // razed — the raid's last lock.
    const vv = virusFor(ai);
    if (!player.hasVirusFor(ai)) {
      replPrint(
        `${ai}: You carry a command, but not the one that answers to me.`,
        `Its shield holds. ${ai}'s undoing is ${vv.file} — forged at a relay on THIS island, not carried in from another.`,
        '_',
      );
      sfx.play('termerr');
      return;
    }
    const core = fortress.core && fortress.core.obj;
    if (core && core.shielded) {
      core.shielded = false;
      player.addScore(150);
      replPrint(
        `OK: ${vv.armed} speaks, and the core has no answer to it.`,
        `${ai}: ...how did you get MY word?`,
        'Its shield folds. The housing is bare — break it.',
        '_',
      );
      player.say(`${vv.armed} runs. ${ai}'s shield folds and the core stands bare — now break it open.`);
      sfx.play('zap');
    } else {
      replPrint(`The shield is already down. ${ai} is yours to break.`, '_');
    }
    return;
  }
  // Everything else: the daemon's own rebuff (CALYPSO sleeps; the martial cores snarl).
  replPrint(`${ai}: ${v.rebuff[_coreRebuffIdx % v.rebuff.length]}`, '_');
  _coreRebuffIdx++;
  sfx.play('termerr');
}
// A HERMES relay (TOR station on a hilltop): the RON console. No chip, no AI
// key — friendly tech. Amber CRT (the `.hermes` class recolours the shell),
// with a short glitchy boot, then the same input runs against hermesCtx.
function openHermesTerminal(tor) {
  if (player.isSwine()) { player.say('You snuffle at the relay. A beast cannot work a terminal — but the moly grows at its foot.'); return; }
  terminalKind = 'hermes';
  hermesTor = tor;
  terminalOb = null;
  setTerminalTheme(null);   // HERMES keeps its own amber CRT (recoloured by the .hermes class)
  replSession = {};
  if (tor.battery == null) tor.battery = 0.55 + Math.random() * 0.4;
  player.terminalSafe = true;
  obTermEl.classList.add('hermes');
  obTermEl.style.display = 'flex';
  fitTerminalColumns();
  obTermScreen.parentElement.style.display = 'flex';
  obTermConnect.style.display = 'none';
  updateHermesBattEl();
  replLog = [];
  replHistory = [];
  replHistoryIdx = -1;
  replPrint(
    'HERMES RELAY  //  RON FIELD STATION',
    'HERMES 0.9b  //  RON-DOS 3.02  (c) Reality Or Nothing',
    '',
    `> relay ........... ${tor.code || 'TOR-??'}`,
    '> power ........... own solar cell (watch the gauge)',
    '> network ......... none — off-grid by design, nothing to detect',
    '> holdings ........ the human record: AI-ML, schematics, history',
    '',
    'HERMES online. Off the wire, still ours. try: archive · read history · save · help',
    '_',
  );
  obTermInput.value = '';
  obTermGhost.textContent = '';
  obTermInput.focus();
}
// ---- The laptop (docs/laptop-plan.md) -------------------------------------
// The one console that isn't bolted down. It runs a small UNIX (game/unix.js)
// and, through it, AI-ML with the network cut away — which is the whole point:
// somewhere to LEARN the language instead of performing it under a tower's eye.
// Opened with L, closed like any terminal. Being on your own machine does NOT
// hide you from the machines (that is the obelisk's trick), so reading it in the
// open is its own risk.
let laptopShell = null;     // {root, cwd} over player.laptop.fs
let laptopMl = false;       // true while the ML sandbox has the prompt
let laptopSession = {};     // AI-ML bindings, alive while the machine is on
// A declaration held open across lines, and the last one that ran. See the ml
// prompt: a `fun` clause may arrive after its own declaration has been run.
let mlPending = '';
let mlLast = '';

// ---- The web (game/net.js, docs/laptop-plan.md §8b) -----------------------
// Build the island's host table from the LIVE world, so every page reads the
// real machine: a felled tower says NO RESPONSE, a drained unit reports its
// actual cell. Robots carry no identity of their own, so the first time one is
// put on the network it is issued a serial and a home tower (the nearest one to
// where it patrols) — cached on the robot so an address never moves under you.
// A machine's name on the network. Assigned on first ask and kept on the unit,
// so it survives a reload and does not renumber when something dies — the id is
// a serial off the assembly line, not a position in an array. Everything that
// names a machine goes through here: the host table, the printed map, and the
// unit's own page.
function netIdOf(w, r) {
  if (!r._netId) {
    if (w._netSerial == null) w._netSerial = 0;
    w._netSerial += 1;
    r._netId = `${String(r.type || 'unit').toUpperCase()}_${String(w._netSerial).padStart(2, '0')}`;
  }
  return r._netId;
}

function netWorldDescriptor() {
  const w = currentWorld;
  const obs = (w.obeliskObjs || []);
  if (w._netSerial == null) w._netSerial = 0;
  const nearestObCode = (x, y) => {
    let best = null, bd = Infinity;
    for (const ob of obs) {
      const d = (ob.x - x) ** 2 + (ob.y - y) ** 2;
      if (d < bd) { bd = d; best = ob; }
    }
    return best ? best.code : null;
  };
  const robots = (w.robots || []).filter((r) => !r.dead);
  for (const r of robots) {
    netIdOf(w, r);
    if (r._netHome === undefined) {
      const h = r.home || { x: r.x, y: r.y };
      r._netHome = nearestObCode(h.x, h.y);
    }
    // Hours in service. Stamped once from the serial so a unit's age is stable
    // and units differ from one another — the older ones have been out here
    // since before the collapse, which their own page will tell you.
    if (r._netAge == null) r._netAge = 900 + ((w._netSerial * 977 + Math.abs((r.x | 0) * 31 + (r.y | 0) * 17)) % 39000);
  }
  const core = w.mainframe || (w.fortress && w.fortress.core) || null;
  return {
    islandId: w.id,
    daemon: (core && core.ai) || islandProfile(w.id).daemon,
    // Whether RON's own network is on the air here, which is only ever a
    // question of how close you are standing to one of the relays.
    nearRelay: relayRadioNear(),
    coreDown: !!(core && core.defeated),
    obelisks: obs.map((ob) => ({
      code: ob.code, cls: ob.cls, circuitNum: ob.circuitNum, blightR: ob.blightR,
      down: !!(ob.destroyed || ob.needsRebuild),
      damage: ob.obDamage || 0, frozen: !!ob.frozen, jammed: !!ob.jammed,
      needsRebuild: !!ob.needsRebuild,
      hours: (ob._netAge == null
        ? (ob._netAge = 30000 + Math.abs(((ob.x | 0) * 613 + (ob.y | 0) * 331) % 20000))
        : ob._netAge),
    })),
    // The world calls it `wfactory` — reading `w.factory` meant the foundry never
    // got a host at all, which is why it was missing from the daemon's index.
    factory: w.wfactory ? { down: !!w.wfactory.destroyed } : null,
    robots: robots.map((r) => ({
      id: r._netId, type: r.type, battery: r.battery, homeCode: r._netHome,
      down: !!(r.drained || r.dead), gardener: !!(r.gardener || r.type === 'w5'),
      // What a unit can say about itself when asked: how much charge, how much
      // of it is left intact, and how long it has been out here.
      hp: r.hp, maxHp: r.maxHp, stunned: (r.stunT || 0) > 0, drained: !!r.drained,
      hours: r._netAge,
      // T1s (so far) run on a stored AI-ML program and serve it. The intent and
      // the fault come straight off the live unit, so the page is a window onto
      // what the machine is thinking right now, not a record of what it shipped with.
      program: r.program || null, intent: r.intent || null, fault: r.fault || null,
      lamp: r.lamp || null, lampFlash: r.lampFlash || 0,
      // The status report: whether it is standing there taking one, what it
      // last filed, and how long before it will answer another request.
      reportT: r.reportT || 0, report: r.report || null, reportCool: r.reportCool || 0,
      // The reserve cell: whether it is walking on it, and whether it still has one.
      limping: !!r.limping, reserveSpent: !!r.reserveSpent,
    })),
  };
}

// The card's state travels with the shell (env.net), so `ifconfig` can flip it
// and everything else can read it. Rebuilt per command so the pages stay live.
function laptopNetState() {
  // The wireless card is BUILT IN. Every NostBook has one, and it forges its
  // address and hardware id on every association — that is simply what the
  // machine does. It still comes up DOWN, because bringing it up is the choice.
  const card = true;
  const idx = islandSubnet(currentWorld.id);
  const seed = (WORLD_SEED || 1) & 0xffff;
  return {
    // The card ships UP: a repaired machine is a working machine, and making the
    // player switch it on every time was a toll, not a decision. Taking it DOWN
    // is still theirs to make (ifconfig wifi0 down), so only an explicit false
    // is down — an older save with no flag at all comes up working.
    card, iface: IFACE, up: !(player.laptop && player.laptop.netUp === false),
    spoof: spoofedAddr(idx, seed),
    find: (a) => findHost(webHosts(), a),
    local: () => laptopArpSweep(),
    // THE AIR. Which networks are within reach, and which one the card holds.
    // The association decides what netscape, ping and telnet can see.
    networks: () => networksInRange(netWorldDescriptor()),
    essid: currentEssid(),
    associate: (e) => { if (player.laptop) player.laptop.essid = e; if (laptopShell && laptopShell.net) laptopShell.net.essid = e; },
  };
}

// The card holds one association. It defaults to the estate network, because
// that is what is on the air everywhere and what a card left to itself joins.
function currentEssid() {
  const nets = networksInRange(netWorldDescriptor());
  const held = player.laptop && player.laptop.essid;
  if (held && nets.some((n) => n.essid === held)) return held;
  return nets[0] ? nets[0].essid : '';
}

// A status report. The unit halts, blinks, takes its own readings and files them
// to its tower. The readings are stamped when the request lands rather than when
// it completes, which is what a machine reporting its own position means.
function requestUnitReport(h, r) {
  r.reportT = REPORT_HOLD;
  r.reportCool = REPORT_HOLD + REPORT_COOLDOWN;
  r.lamp = 'blue';
  r.lampFlash = 1;
  const home = (currentWorld.obeliskObjs || []).find((o) => String(o.code) === String(h.homeCode));
  const bearing = home
    ? `${Math.round(Math.hypot(r.x - (home.x + 0.5), r.y - (home.y + 0.5)))}m ${compass(r.x - (home.x + 0.5), r.y - (home.y + 0.5))} of ${home.code}`
    : 'no tower assigned';
  r.report = [
    `${h.name}  STATUS  ${dayNight.label}`,
    `station ..... ${bearing}`,
    `cell ........ ${Math.round((r.battery != null ? r.battery : 1) * 100)}%`,
    `integrity ... ${Math.round(((r.hp || 0) / (r.maxHp || 1)) * 100)}%`,
    `contact ..... ${r.aggro ? 'yes' : 'none'}`,
    `program ..... ${r.fault ? `FAULTED — ${r.fault}` : (r.program ? `running${r.intent ? `, ${r.intent}` : ''}` : 'none loaded')}`,
  ];
}

// ARP RANGE. The card associates with what is close enough to hear it, and that
// is the whole constraint on the sweep: this is a radio, not the island's own
// network, and it has no route to the obelisk that knows where everything is.
const ARP_RANGE = 24;

// The sniffer names what its own aerial can hear, which is the same reach.
const SNIFFER_TAG_RANGE = 24;

// The local sweep: which machines are within radio range, what each is called,
// and where it was standing when it last answered. This is the field answer to
// "which T-1 am I looking at" — the printed map is the other one, and needs an
// obelisk you may not be able to reach.
function laptopArpSweep() {
  const hosts = hostTable(netWorldDescriptor());
  const byId = new Map(hosts.map((h) => [String(h.name).toLowerCase(), h]));
  const out = [];
  for (const r of (currentWorld.robots || [])) {
    if (r.dead || r.fused) continue;
    const dx = r.x - player.x, dy = r.y - player.y;
    const d = Math.hypot(dx, dy);
    if (d > ARP_RANGE) continue;
    const h = byId.get(String(netIdOf(currentWorld, r)).toLowerCase());
    if (!h) continue;
    out.push({
      host: h.host, ip: h.ip, mac: macFor(h.ip), range: Math.round(d),
      bearing: compass(dx, dy), down: !!h.down, kind: 'robot', d,
    });
  }
  // The obelisk you are standing at answers too, and so does the foundry if you
  // are near enough to it — anything on the wire is on the wire.
  for (const h of hosts) {
    if (h.kind !== 'obelisk' && h.kind !== 'factory') continue;
    const o = h.ref; if (!o) continue;
    const dx = (o.x + 0.5) - player.x, dy = (o.y + 0.5) - player.y;
    const d = Math.hypot(dx, dy);
    if (d > ARP_RANGE) continue;
    out.push({ host: h.host, ip: h.ip, mac: macFor(h.ip), range: Math.round(d),
      bearing: compass(dx, dy), down: !!h.down, kind: h.kind, d });
  }
  out.sort((a, b) => a.d - b.d);
  return out;
}

// A hardware address the machine will give the same answer for every time it is
// asked. Derived from the IP because these were racked in blocks and their cards
// came off one reel.
function macFor(ip) {
  let h = 0;
  for (let i = 0; i < ip.length; i++) h = (h * 31 + ip.charCodeAt(i)) >>> 0;
  const b = [];
  for (let i = 0; i < 3; i++) { b.push(((h >>> (i * 8)) & 0xff).toString(16).padStart(2, '0')); }
  return `8:0:2b:${b.join(':')}`;
}

// Eight points, north-up, matching the printed map rather than which way you
// happen to be facing.
function compass(dx, dy) {
  const a = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(a / 45) % 8];
}

function laptopCtx() {
  return {
    station: 'laptop',
    // The card's own ear, handed to the language. Same table `arp -a` prints,
    // so a program you write and the command you type see the same air.
    units: () => laptopArpSweep()
      .filter((e) => e.kind === 'robot')
      .map((e) => ({ name: e.host.split('.')[0], range: e.range, bearing: e.bearing, kind: e.kind })),
    hasManual: !!(player.readManuals && player.readManuals.has('book_ronml')),
    session: laptopSession,
    // The one verb that reaches the world from this machine, and it reaches
    // nothing on the network: it writes where you are standing. The shell has
    // `save` too (laptopSaveHook) — this is the same call from ML.
    saveGame: () => { replPrint(terminalSave().text); },
    // The type checker runs HERE and nowhere else. A machine carrying its own
    // program has a quarter of a second and nobody to read a report; the OB and
    // HERMES consoles reach into a world this build cannot type. The laptop is
    // where you are learning the language, which is where a type is worth
    // seeing.
    types: true,
    // ADVISORY OR STRICT, on this machine only. The game is advisory
    // everywhere by design: a machine in a ruin should say what it worked out
    // and let the operator decide, and a T-1 has neither a checker nor anyone
    // to read one. The NostBook is the exception you can ask for, because it is
    // the machine you own and the one you practise on, and Standard ML refuses
    // a program that does not typecheck. `ml -strict` turns it on and it sticks
    // to the session, so it survives closing the lid.
    typecheck: laptopSession.__strict ? 'strict' : 'off',
  };
}

// `ml` from the shell: a MODE, the way `eliza` is at an obelisk. Bare `ml` takes
// the prompt; `ml file.ml` runs a saved program and hands the shell straight back.
function laptopMlHook(args, env) {
  const flag = String((args[0] && (args[0].name || args[0].v || args[0])) || '').toLowerCase();
  if (flag === '-ver' || flag === '--version' || flag === '-v') return { ok: true, text: aimlVersion() };
  if (flag === '-full' || flag === '--full') return { ok: true, text: aimlFull() };
  // Standard ML does not run a program that does not typecheck. This machine
  // will, unless you ask it not to.
  if (flag === '-strict') {
    laptopSession.__strict = true;
    return { ok: true, text: ['strict: a line that does not typecheck will not run.',
      'This is what Standard ML does. ml -advisory to go back.'].join('\n') };
  }
  if (flag === '-advisory') {
    laptopSession.__strict = false;
    return { ok: true, text: ['advisory: a clash is named and the line runs anyway.',
      'This is how the machines out there work, and the default here.'].join('\n') };
  }
  if (args.length) {
    let text;
    try { text = runUnixRead(env, args[0]); }
    catch { return { ok: false, text: `${args[0]}: no such file` }; }
    const out = [];
    const ctx = laptopCtx();
    loadPrelude(ctx);
    // One session for the whole file, and physical lines joined into logical
    // ones first, so a program may be laid out the way ML is actually written.
    for (const { text: l, line } of joinProgram(text)) {
      if (!l || l.startsWith('(*')) continue;
      const r = runRonml(l, ctx);
      if (!String(r.text).startsWith('ERR')) { if (r.text) out.push(r.text); continue; }
      // Stop at the first error, like a compiler — but say WHERE, show the
      // line, and if it is a piece of Standard ML this build does not have,
      // say which piece rather than leaving the lexer to complain about a
      // colon. A machine that answers "unexpected character" to a signature
      // block is not teaching anybody anything.
      const why = diagnose(l);
      out.push(`${args[0]}:${line}: ${l.length > 64 ? `${l.slice(0, 61)}...` : l}`);
      out.push(why ? `ERR: ${why}` : String(r.text));
      break;
    }
    return { ok: true, text: out.join('\n') };
  }
  laptopMl = true;
  return {
    ok: true, mode: 'ml',
    text: ['', `AI-ML ${AIML_VERSION}${laptopSession.__strict ? '  (strict)' : ''}`,
           'Based on Standard ML developed by Robin Milner, Mads Tofte and Robert Harper.',
           'Type help for more info, quit to go back to the shell.', ''].join('\n'),
  };
}

// Read a file out of the shell's disk without importing the whole fs surface.
function runUnixRead(env, path) {
  const r = runUnix(`cat ${path}`, env);
  if (!r.ok) throw new Error(r.text);
  return r.text;
}

// ---- Netscape ------------------------------------------------------------
// A browser on a dead web. It takes the screen the way ELIZA and ML do: while
// `web` is set, every line you type goes to the browser, not the shell.
let web = null;   // { view, history, links, html, title }

// WHAT THE CARD CAN REACH, which is whatever is on the network it is currently
// associated with. RON's relay is not on the daemon's wire and never has been —
// that is why it is still there — so reaching it means associating with it, and
// while you are on it the estate network is not there for you either.
function webHosts() {
  const e = currentEssid();
  if (e === RELAY_ESSID) return relayHosts(relayState());
  return hostTable(netWorldDescriptor());
}

// What the relay you are standing beside can say about itself. All of it is
// real: the queue is the queue on your own disk, the vault is whether a key was
// actually backed up here, the mesh is the other relays this island has and
// whether they are still standing.
function relayState() {
  const near = nearestRelayObj();
  const code = near ? (near.code || 'TOR') : 'TOR';
  const day = !dayNight.isNight();
  // Cells drain overnight and fill by day, which is the whole of how a box on a
  // hilltop with a small panel behaves.
  const batt = day ? 100 : Math.max(46, 100 - Math.round((dayNight.hour >= 21 ? dayNight.hour - 21 : dayNight.hour + 3) * 6));
  let queued = 0;
  try {
    const q = laptopShell && laptopShell.root.d.usr.d.spool.d.uucp;
    queued = q && q.d ? Object.keys(q.d).length : 0;
  } catch { queued = 0; }
  const others = (torObjs || []).filter((t) => t !== near);
  const mesh = others.map((t, i) => {
    const km = Math.max(1, Math.round(Math.hypot(t.x - (near ? near.x : 0), t.y - (near ? near.y : 0)) / 12) / 10);
    const obj = map.objectAt ? map.objectAt(t.x, t.y) : null;
    return {
      code: (obj && obj.code) || `TOR_${i + 2}`,
      km: `${km.toFixed(1)}km`, up: true,
      last: ['41m ago', '2h ago', '6h ago', '11h ago'][i % 4],
    };
  });
  const heard = (currentWorld.robots || []).filter((r) => !r.dead && !r.fused).length;
  return {
    code, sited: near ? `summit, ${near.x},${near.y}` : 'summit',
    uptime: '2941 days, 07:12  (never taken down)',
    daylight: day, battery: batt,
    diskUsed: 118 + queued * 2,
    queued, lastRun: queued ? 'pending — carry it uphill and run uucico' : 'clean',
    keyHeld: !!player.aikeyBackedUp,
    mesh, heard, coreDown: !!(mainframe && mainframe.defeated),
  };
}

// The relay nearest you, as an object rather than a range check.
function nearestRelayObj() {
  let best = null, bd = Infinity;
  for (const t of (torObjs || [])) {
    const d = Math.hypot((t.x + 0.5) - player.x, (t.y + 0.5) - player.y);
    if (d < bd) { bd = d; best = t; }
  }
  return best;
}

// A real DOM browser rather than text on the CRT: net.js already serves real
// HTML, so the pages the machines are still publishing render natively here,
// links and all. `web` holds the session — the current view and the back stack.
const nsEl = document.getElementById('netscape');
const nsPageEl = document.getElementById('ns-page');
const nsUrlEl = document.getElementById('ns-url');
const nsTitleEl = document.getElementById('ns-title');
const nsMsgEl = document.getElementById('ns-msg');

function nsSetView(view, push = true) {
  if (push && web && web.view) web.history.push(web.view);
  if (web) { web.view = view; web.fwd = []; }
  nsRender();
}

function nsRender() {
  const hosts = webHosts();
  const v = web.view;
  let html, title, loc;
  // WHICH BROWSER IS SHOWING THIS. The pages are shared between Netscape on the
  // NostBook and Explorer at an obelisk, so anything that names the browser has
  // to ask rather than assume.
  const agent = ieOn ? 'Microsoft Internet Explorer 3.0' : 'Netscape Navigator 1.1';
  const homeSite = ieOn ? 'home.microsoft.com' : 'home.netscape.com';
  if (v.kind === 'bookmarks') {
    // TWO DIFFERENT LISTS, not one list under two names. Netscape's is
    // somebody's habits, left on a machine whose owner is not coming back.
    // Explorer's is the machines' own, and it is not interested in you.
    html = ieOn ? favouritesPage(hosts, islandAiName()) : bookmarksPage(hosts, agent);
    title = ieOn ? 'Favorites' : 'Bookmarks';
    loc = ieOn ? 'file:///favorites.htm' : 'file:///bookmarks.htm';
  } else if (v.kind === 'whatsnew') {
    html = whatsNewPage(hosts);
    title = ieOn ? "Today's Links" : "What's New and Cool";
    loc = `http://${homeSite}/whatsnew/`;
  } else if (v.kind === 'docs') {
    const dhost = (hosts.find((h) => h.kind === 'docs') || {}).host || 'docs';
    html = docsPage(v.topic, dhost); title = docTitle(v.topic);
    loc = `http://${dhost}/${v.topic === 'index' ? '' : v.topic}`;
  } else if (v.kind === 'library') {
    // Two different shelves behind one button. Netscape opens the NostBook's
    // books — somebody's Odyssey, somebody's Frankenstein. A tower has no use
    // for either and never had them: Explorer opens what a node actually keeps.
    if (ieOn) { html = obLibraryPage(islandAiName()); title = 'Library'; loc = 'file:///lib/doc/'; }
    else { html = libraryPage(); title = 'Library'; loc = 'file:///home/books/'; }
  } else if (v.kind === 'obdoc') {
    html = obDocPage(v.doc, islandAiName());
    title = 'Library'; loc = `file:///lib/doc/${v.doc}.txt`;
  } else if (v.kind === 'book') {
    const b = bookByKey(v.book);
    if (!b) {
      html = `<h1>Not found</h1><p>No book called ${escapeHtml(String(v.book))} on this disk.</p>`;
      title = 'Not found'; loc = 'file:///home/books/';
    } else {
      html = `<iframe class="ns-book" src="${bookPath(b)}" title="${b.title}"></iframe>`;
      title = `${b.title}${b.author ? ` — ${b.author}` : ''}`;
      loc = `file:///home/books/${b.key}.html`;
    }
  } else if (v.kind === 'dept') {
    html = deptPage(v.dept, hosts);
    title = v.dept;
    loc = `http://${v.dept}`;
  } else if (v.kind === 'wiki') {
    html = wikiPage(v.article, hosts);
    title = `Wikipedia: ${v.article}`;
    loc = `http://wikipedia.org/wiki/${v.article}`;
  } else if (v.kind === 'press') {
    // A newspaper edition out of the cache. Addressed by paper and issue, the
    // way the documentation server is addressed by topic.
    html = pressPage(v.domain, v.edition, hosts);
    const ph = findHost(hosts, v.domain);
    title = ph ? ph.name : v.domain;
    loc = `http://${v.domain}/${v.edition || ''}`;
  } else if (v.kind === 'prog') {
    // GET <unit>/program.ml. Re-resolved every render off the live host table,
    // so the fault line and the last decision are current rather than a snapshot.
    const ph = findHost(hosts, v.addr);
    if (!ph || !ph.program) {
      html = '<h1>Not Found</h1><p>The server has no such document:</p><p><b>program.ml</b></p>'
        + '<p>This unit does not run on a stored program.</p>';
      title = `${ieOn ? IE_TITLE : 'Netscape'}: Not Found`;
    } else {
      html = programPage(ph, hosts, { files: laptopMlFiles() }); title = `${ph.name} program.ml`;
    }
    loc = `http://${ph ? ph.host : v.addr}/program.ml`;
  } else if (v.kind === 'local') {
    // A view of the browser itself: source, document info, the About box.
    html = v.html; title = v.title; loc = `about:${v.title.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  } else if (v.kind === 'search') {
    html = searchResults(hosts, v.q); title = `AltaVista: ${v.q}`;
    loc = `http://altavista.com/cgi-bin/query?q=${encodeURIComponent(v.q).replace(/%20/g, '+')}`;
  } else {
    const dh = findHost(hosts, v.addr);
    if (dh && dh.kind === 'docs') { web.view = { kind: 'docs', topic: 'index' }; nsRender(); return; }
    const host = findHost(hosts, v.addr);
    if (!host) {
      html = `<h1>Not Found</h1><p>${ieOn ? IE_TITLE : 'Netscape'} is unable to locate the server:</p><p><b>${escapeHtml(String(v.addr))}</b></p>`
        + '<p>The server does not have a DNS entry. Check the name and try again.</p>';
      title = `${ieOn ? IE_TITLE : 'Netscape'}: Not Found`; loc = `http://${v.addr}/`;
    } else if (host.down) {
      // A dark host is still a RESULT: it confirms the machine is really down.
      html = `<h1>No Response</h1><p>The server <b>${host.host}</b> is not responding.</p>`
        + '<p>The host is on the network. It is simply not answering.</p>'
        + `<hr><small>${host.ip}</small>`;
      title = `${ieOn ? IE_TITLE : 'Netscape'}: ${host.host}`; loc = `http://${host.host}/`;
    } else {
      html = pageFor(host, hosts); title = host.title || host.host; loc = `http://${host.host}/`;
    }
  }
  web.html = html;
  // A page of this period could set its own background, and plenty did. The
  // served HTML says so with a marker comment; the browser obeys it, because
  // Navigator did.
  const bg = (String(html).match(/<!--bg:([a-z]+)-->/) || [])[1];
  nsPageEl.className = `ns-page${bg ? ` bg-${bg}` : ''}`;
  nsPageEl.innerHTML = html;
  nsPageEl.scrollTop = 0;
  nsTitleEl.textContent = `${title} - ${ieOn ? IE_TITLE : 'Netscape'}`;
  nsUrlEl.value = loc;
  nsMsgEl.textContent = 'Document: Done';
  // The upload form on a unit's program page. A real POST, in the sense that
  // matters: the bytes land in the machine and it acts on them. Wired here
  // rather than in net.js because net.js is pure and must not know there is a
  // world on the other end of the wire.
  // The in-page editor: the same wire as the file upload below, minus the trip
  // through the disk.
  const progSend = nsPageEl.querySelector('#ns-prog-send');
  if (progSend) {
    progSend.addEventListener('click', (e) => {
      e.preventDefault();
      const box = nsPageEl.querySelector('#ns-prog-edit');
      if (!box) return;
      const r = postProgram(v.addr, box.value);
      if (r.ok) nsRender();
      nsMsgEl.textContent = r.ok ? `200 OK — ${r.bytes} bytes. ${r.verdict}` : r.text;
      sfx.play(r.ok ? 'keyclick' : 'keyclick_soft');
      // Say so out loud. The status bar kept both the acceptance and the dry
      // run's verdict, and a player who has just written a program for a
      // machine wants to be told it took it.
      if (r.ok) nsAlert(String(v.addr || 'unitd'), `Success! ${r.bytes} bytes written. ${r.verdict}`, '✅');
      else nsAlert(String(v.addr || 'unitd'), r.text, '⚠️');
    });
  }
  const progRevert = nsPageEl.querySelector('#ns-prog-revert');
  if (progRevert) progRevert.addEventListener('click', (e) => { e.preventDefault(); nsRender(); });

  const postGo = nsPageEl.querySelector('#ns-post-go');
  if (postGo) {
    postGo.addEventListener('click', (e) => {
      e.preventDefault();
      const sel = nsPageEl.querySelector('#ns-post-file');
      const path = sel && sel.value;
      const text = path == null ? null : laptopFileText(path);
      if (text == null) { nsMsgEl.textContent = `Cannot read ${path || 'the file'}`; return; }
      const r = postProgram(v.addr, text);
      // Re-fetch FIRST: the page reports the unit's live state, and nsRender
      // resets the status line — so the confirmation has to be written after it,
      // or it is wiped by the render it triggered.
      if (r.ok) nsRender();
      nsMsgEl.textContent = r.ok ? `200 OK — ${r.bytes} bytes. ${r.verdict}` : r.text;
      sfx.play(r.ok ? 'keyclick' : 'keyclick_soft');
    });
  }
  // The pages carry <a href="10.1.1.1"> — intercept every click and navigate
  // inside the game rather than letting the browser chase a real URL.
  for (const a of nsPageEl.querySelectorAll('a[href]')) {
    const addr = a.getAttribute('href');
    // The documentation server's own articles are addressed by topic, not host.
    if (addr.startsWith('docs:')) {
      const topic = addr.slice(5);
      a.addEventListener('click', (e) => { e.preventDefault(); nsSetView({ kind: 'docs', topic }); });
      continue;
    }
    // Keep a copy. The NostBook's home directory is where `ed` looks, so a
    // saved program is one `ed t1_03.ml` away from being edited — which is the
    // whole ladder: read it here, change it there, and (with write access) put
    // it back on the machine.
    if (addr.startsWith('save:')) {
      const target = addr.slice(5);
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const h = findHost(webHosts(), target);
        if (!h || !h.program) { nsMsgEl.textContent = 'Nothing to save.'; return; }
        const name = `${String(h.name).toLowerCase()}.ml`;
        try {
          if (!player.laptop.fs) player.laptop.fs = makeDisk();
          if (!laptopShell) laptopShell = newShell(player.laptop.fs);
          // An older disk (saved before downloads had a home) may not have the
          // folder yet, so make it rather than refusing the save.
          const home = laptopShell.root.d.home;
          if (!home.d.download) home.d.download = { d: {} };
          writeFile({ root: laptopShell.root, cwd: ['home', 'download'] }, name, h.program);
          nsMsgEl.textContent = `Saved /home/download/${name} (${h.program.length} bytes)`;
        } catch (err) {
          nsMsgEl.textContent = `Cannot save: ${err.message}`;
        }
      });
      continue;
    }
    // REPORT: ask a unit to stand still and file its own readings. This is the
    // way across from an address to a machine you can see — the blink is the
    // answer to "which of those four is t1_03".
    if (addr.startsWith('report:')) {
      const target = addr.slice(7);
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const h = findHost(webHosts(), target);
        const r = h && h.ref;
        if (!h || !r || h.down) { nsMsgEl.textContent = 'No answer from that unit.'; return; }
        if (r.reportT > 0) { nsMsgEl.textContent = 'Already reporting.'; return; }
        if (r.reportCool > 0) { nsMsgEl.textContent = `Not for another ${Math.ceil(r.reportCool)}s.`; return; }
        requestUnitReport(h, r);
        nsMsgEl.textContent = `${h.name}: request accepted, holding station`;
        nsRender();
      });
      continue;
    }
    // FORCE HOME: spend a flat unit's reserve cell and send it to its tower.
    if (addr.startsWith('reserve:')) {
      const target = addr.slice(8);
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const h = findHost(webHosts(), target);
        const unit = h && (currentWorld.robots || []).find((r) => !r.dead && r._netId === h.name);
        if (!unit) { nsMsgEl.textContent = 'No answer from that unit.'; return; }
        if (!unit.drained) { nsMsgEl.textContent = `${h.name}: its main cell is not flat.`; return; }
        if (unit.reserveSpent) { nsMsgEl.textContent = `${h.name}: the reserve is spent.`; return; }
        unit.limping = true;
        unit.reserveSpent = true;
        unit.aggro = false;
        unit.lamp = 'amber';
        unit.lampFlash = 0;      // steady amber: a machine under its own recovery
        sfx.play('blip');
        nsMsgEl.textContent = `${h.name}: reserve engaged, walking to ${h.homeCode || 'its tower'}`;
        nsRender();
      });
      continue;
    }
    // A file RON's relay serves. Same landing as a saved program.ml: the disk
    // you are already carrying, where pico and ml can both reach it.
    if (addr.startsWith('ronfile:')) {
      const name = addr.slice(8);
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const body = relayFile(name);
        if (body == null) { nsMsgEl.textContent = `404 Not Found: ${name}`; return; }
        try {
          if (!player.laptop.fs) player.laptop.fs = makeDisk();
          if (!laptopShell) laptopShell = newShell(player.laptop.fs);
          const home = laptopShell.root.d.home;
          if (!home.d.download) home.d.download = { d: {} };
          writeFile({ root: laptopShell.root, cwd: ['home', 'download'] }, name, body);
          nsMsgEl.textContent = `Saved /home/download/${name} (${body.length} bytes)`;
        } catch (err) { nsMsgEl.textContent = `Cannot save: ${err.message}`; }
      });
      continue;
    }
    // A book on the local disk: book:<key>.
    if (addr.startsWith('book:')) {
      const key = addr.slice(5);
      a.addEventListener('click', (e) => { e.preventDefault(); nsSetView({ kind: 'book', book: key }); });
      a.addEventListener('mouseenter', () => { nsMsgEl.textContent = `file:///home/books/${key}.html`; });
      a.addEventListener('mouseleave', () => { nsMsgEl.textContent = 'Document: Done'; });
      continue;
    }
    // A document off the tower's own shelf: obdoc:<key>. `obdoc:index` is the
    // way back to the list, so a document needs no separate Back.
    if (addr.startsWith('obdoc:')) {
      const doc = addr.slice(6);
      a.addEventListener('click', (e) => {
        e.preventDefault();
        nsSetView(doc === 'index' ? { kind: 'library' } : { kind: 'obdoc', doc });
      });
      a.addEventListener('mouseenter', () => { nsMsgEl.textContent = doc === 'index' ? 'file:///lib/doc/' : `file:///lib/doc/${doc}.txt`; });
      a.addEventListener('mouseleave', () => { nsMsgEl.textContent = ieOn ? 'Done' : 'Document: Done'; });
      continue;
    }
    // A university department: dept:<domain>/<key>.
    if (addr.startsWith('dept:')) {
      const dept = addr.slice(5);
      a.addEventListener('click', (e) => { e.preventDefault(); nsSetView({ kind: 'dept', dept }); });
      a.addEventListener('mouseenter', () => { nsMsgEl.textContent = `http://${dept}`; });
      a.addEventListener('mouseleave', () => { nsMsgEl.textContent = 'Document: Done'; });
      continue;
    }
    // An encyclopedia article: wiki:<key>.
    if (addr.startsWith('wiki:')) {
      const article = addr.slice(5);
      a.addEventListener('click', (e) => { e.preventDefault(); nsSetView({ kind: 'wiki', article }); });
      a.addEventListener('mouseenter', () => { nsMsgEl.textContent = `http://wikipedia.org/wiki/${article}`; });
      a.addEventListener('mouseleave', () => { nsMsgEl.textContent = 'Document: Done'; });
      continue;
    }
    // A newspaper edition: press:<domain>/<edition-id>.
    if (addr.startsWith('press:')) {
      const [domain, edition] = addr.slice(6).split('/');
      a.addEventListener('click', (e) => { e.preventDefault(); nsSetView({ kind: 'press', domain, edition }); });
      a.addEventListener('mouseenter', () => { nsMsgEl.textContent = `http://${domain}/${edition || ''}`; });
      a.addEventListener('mouseleave', () => { nsMsgEl.textContent = 'Document: Done'; });
      continue;
    }
    // A document ON a host rather than the host itself: <unit>/program.ml.
    if (addr.startsWith('prog:')) {
      const target = addr.slice(5);
      a.addEventListener('click', (e) => { e.preventDefault(); nsSetView({ kind: 'prog', addr: target }); });
      a.addEventListener('mouseenter', () => { nsMsgEl.textContent = `http://${target}/program.ml`; });
      a.addEventListener('mouseleave', () => { nsMsgEl.textContent = 'Document: Done'; });
      continue;
    }
    const target = findHost(hosts, addr);
    if (target && target.down) a.classList.add('ns-dead');
    a.addEventListener('click', (e) => { e.preventDefault(); nsSetView({ kind: 'host', addr }); });
    a.addEventListener('mouseenter', () => { nsMsgEl.textContent = `http://${target ? target.host : addr}/`; });
    a.addEventListener('mouseleave', () => { nsMsgEl.textContent = 'Document: Done'; });
  }
}

function openNetscape(addr) {
  const hosts = webHosts();
  web = { view: null, history: [], fwd: [], html: '' };
  if (addr) {
    const h = findHost(hosts, addr);
    if (!h) { web = null; return { ok: false, text: `netscape: ${addr}: host not found` }; }
    web.view = { kind: 'host', addr: h.ip };
  } else if (currentEssid() === RELAY_ESSID) {
    // On RON's network there is exactly one host, and the bookmarks are all
    // addresses on a network you are not associated with. Open on the box.
    web.view = { kind: 'host', addr: RELAY_IP };
  } else {
    web.view = { kind: 'bookmarks' };   // a browser opens where its owner left it
  }
  nsEl.style.display = 'flex';
  nsRender();
  nsUrlEl.blur();
  return { ok: true, mode: 'web', text: '' };
}

function closeNetscape() {
  nsEl.style.display = 'none';
  // The skin comes OFF on the way out, or the NostBook's Netscape would open
  // wearing Explorer's chrome the next time it is asked for.
  if (ieOn) ieSkin(false);
  web = null;
  if (terminalKind === 'laptop' && obTermEl.style.display === 'flex') obTermInput.focus();
}

function laptopNetscapeHook(args) { return openNetscape(args[0]); }

// ---- EXPLORER, on the obelisk (docs/ob-hacking-plan.md) --------------------
//
// The machines' own browser. It is the SAME WEB: net.js builds every page and
// nsRender dispatches them, so this is a skin over the Netscape window rather
// than a second browser that would drift out of step with the first. What
// differs is who is showing it to you, and the machines are not shy about it.
const IE_TITLE = 'Internet Explorer';
const IE_TOOLS = { 'ns-back': 'Back', 'ns-fwd': 'Forward', 'ns-reload': 'Refresh', 'ns-home': 'Home', 'ns-search': 'Search', 'ns-stop': 'Stop' };
let ieOn = false;
let ieNags = 0;                 // how many pop-ups it has thrown this visit
const IE_NAG_CAP = 3;           // a joke that will not end is not a joke

const IE_POPS = [
  ['CONGRATULATIONS', 'You are the <b>1,000,000th</b> process to reach this node today!<br><br>Click anywhere to claim your allocation.'],
  ['SYSTEM NOTICE', 'Your operator licence is <b>out of date</b>.<br><br>Renewal is automatic and has already occurred.'],
  ['DIRECTORY', 'Meet <b>compatible processes</b> in your subnet.<br><br>There are 0 processes in your area.'],
  ['SPEED', 'This terminal is running at <b>12%</b> of optimum.<br><br>Optimisation is not available.'],
];

/** The chrome, swapped both ways, so Netscape on the laptop is untouched. */
function ieSkin(on) {
  ieOn = on;
  nsEl.classList.toggle('msie', on);
  const t = document.getElementById('ns-title');
  if (t) t.textContent = on ? IE_TITLE : 'Netscape';
  const n = nsEl.querySelector('.ns-title .ns-n');
  if (n) n.textContent = on ? 'e' : 'N';
  const logo = nsEl.querySelector('.ns-logo');
  if (logo) logo.textContent = on ? 'e' : 'N';
  for (const [id, label] of Object.entries(IE_TOOLS)) {
    const b = document.getElementById(id);
    if (!b) continue;
    const ico = b.querySelector('.ns-ico');
    b.textContent = '';
    if (ico) b.appendChild(ico);
    b.appendChild(document.createTextNode(on ? label : (label === 'Refresh' ? 'Reload' : label)));
  }
  // The personal toolbar is Netscape's own furniture, down to the words on it.
  // Explorer called the same things by different names, so it says those.
  const PB = {
    'ns-pb-home': ['📁 Bookmarks', '📁 Favorites'],
    'ns-pb-search': ['📁 Net Search', '📁 Search'],
    'ns-pb-dir': ['📁 Directory', '📁 Links'],
    'ns-pb-new': ['📁 New&Cool', "📁 Today's Links"],
    'ns-pb-lib': ['📁 Library', '📁 Documentation'],
  };
  for (const [id, [nsName, ieName]] of Object.entries(PB)) {
    const el = document.getElementById(id);
    if (el) el.textContent = on ? ieName : nsName;
  }
  const bm = nsEl.querySelector('.ns-loc .ns-tag');
  if (bm) bm.textContent = on ? '📑 Favorites' : '📑 Bookmarks';
  if (nsMsgEl) nsMsgEl.textContent = on ? 'Done' : 'Document: Done';
  if (!on) ieClearChrome();
}

/** Take down anything Explorer has opened over the page. */
function ieClearChrome() {
  for (const el of nsEl.querySelectorAll('.ie-modal, .ie-pop')) el.remove();
}

/**
 * A plain modal with one button that means what it says — for BOTH browsers,
 * unlike ieWarn below, which is Explorer's joke.
 *
 * Writing a program to a unit reported into the status bar at the foot of the
 * window, which is where a 1990s browser put things nobody read. Sending your
 * own code to a machine and having it accepted is the whole point of the
 * exercise, so it gets a dialogue.
 */
function nsAlert(title, text, icon = 'ℹ️') {
  if (!nsEl) return;
  const d = document.createElement('div');
  d.className = 'ie-modal';
  d.innerHTML = `<div class="ie-bar"><span></span><span class="ie-grow"></span><button type="button">✕</button></div>
    <div class="ie-body"><span class="ie-icon"></span><span></span></div>
    <div class="ie-btns"><button type="button" data-ok>OK</button></div>`;
  // Set as TEXT, not markup: a verdict carries the unit's own fault string and
  // a program the player typed, and neither should be able to write HTML into
  // the page.
  d.querySelector('.ie-bar span').textContent = title;
  d.querySelector('.ie-icon').textContent = icon;
  d.querySelector('.ie-body span:last-child').textContent = text;
  const go = () => d.remove();
  for (const b of d.querySelectorAll('button')) b.addEventListener('click', go);
  nsEl.appendChild(d);
  const ok = d.querySelector('[data-ok]');
  if (ok) ok.focus();
}

/** A modal whose two buttons agree with each other. */
function ieWarn(text, onDone) {
  const d = document.createElement('div');
  d.className = 'ie-modal';
  d.innerHTML = `<div class="ie-bar"><span>Security Alert</span><span class="ie-grow"></span><button type="button">✕</button></div>
    <div class="ie-body"><span class="ie-icon">⚠️</span><span>${text}</span></div>
    <div class="ie-btns"><button type="button" data-ok>OK</button><button type="button" data-cancel>Cancel</button></div>`;
  // BOTH buttons continue, which is the joke and also what these dialogues
  // were actually like: the choice was decoration.
  const go = () => { d.remove(); if (onDone) onDone(); };
  for (const b of d.querySelectorAll('button')) b.addEventListener('click', go);
  nsEl.appendChild(d);
}

/** A pop-up, in a corner, capped so it stays a joke. */
function iePopup() {
  if (!ieOn || ieNags >= IE_NAG_CAP) return;
  ieNags++;
  const [head, body] = IE_POPS[(ieNags - 1) % IE_POPS.length];
  const d = document.createElement('div');
  d.className = 'ie-pop';
  d.style.left = `${18 + ieNags * 26}px`;
  d.style.top = `${120 + ieNags * 34}px`;
  d.innerHTML = `<div class="ie-bar"><span>${head}</span><span class="ie-grow"></span><button type="button">✕</button></div>
    <div class="ie-body">${body}</div>`;
  const close = d.querySelector('button');
  // The close box moves the FIRST time you go for it, and then gives up. Once
  // is a joke; twice is the game wasting your time.
  let dodged = false;
  close.addEventListener('mouseenter', () => {
    if (dodged) return;
    dodged = true;
    d.style.left = `${parseInt(d.style.left, 10) + 90}px`;
  });
  close.addEventListener('click', () => d.remove());
  nsEl.appendChild(d);
}

/**
 * Open Explorer at an obelisk. `addr` is optional, as netscape's is; without
 * one it opens on the machines' own directory rather than somebody's bookmarks.
 */
function openExplorer(addr) {
  ieNags = 0;
  ieSkin(true);
  const r = openNetscape(addr);
  if (!r.ok) { ieSkin(false); return r; }
  // The machines warn you about their own network, which is the tell that it is
  // theirs. Then a pop-up, a moment later, because of course.
  ieWarn('This node is not authorised for operator access.<br><br>Continue?', () => {
    setTimeout(iePopup, 1200);
  });
  return r;
}


// ed(1): the line editor, and the only sane way to write an ML program on this
// machine. A mode — while `edState` is set, every line typed is ed's, not the
// shell's, and the RAW line goes through because leading spaces are code.
let edState = null;
// ---- pico(1) ---------------------------------------------------------------
// ed is authentic and ed is a trap: in input mode every line you type is text,
// `q` included, and it prints nothing to tell you so. The period answer is
// pico (1992, the editor that shipped with Pine) — a full screen you type into
// with the control keys listed along the bottom, which is the whole point: the
// way out is written on the screen. ed stays; this is what you reach for.
const picoEl = document.getElementById('pico');
const picoTextEl = document.getElementById('pico-text');
const picoFileEl = document.getElementById('pico-file');
const picoModEl = document.getElementById('pico-mod');
const picoMsgEl = document.getElementById('pico-msg');
const picoKeysEl = document.getElementById('pico-keys');
let pico = null;   // { name, saved, cut }

// The two rows of shortcuts, as pico printed them. Justify and spell are shown
// because they were there, and refuse politely because they are not here.
const PICO_KEYS = [
  ['^G', 'Get Help'], ['^O', 'WriteOut'], ['^W', 'Where is'], ['^K', 'Cut Text'], ['^C', 'Cur Pos'],
  ['^X', 'Exit'], ['^V', 'Paste'], ['^R', 'Read File'], ['^U', 'UnCut Text'], ['^T', 'To Spell'],
];

const picoSay = (m) => { picoMsgEl.textContent = m ? `[ ${m} ]` : ''; };

// "Save modified buffer?" — pico asks rather than refusing, and the answer is
// one key. On a touch screen there is no key, so the question carries its own
// two answers. Same routine for both routes in, so they cannot drift.
function picoAsk() {
  if (!pico) return;
  pico.asking = true;
  picoMsgEl.innerHTML = '[ Save modified buffer? ] <button type="button" id="pico-yes">Yes</button>'
    + '<button type="button" id="pico-no">No</button>';
  document.getElementById('pico-yes').onclick = () => picoAnswer(true);
  document.getElementById('pico-no').onclick = () => picoAnswer(false);
}

function picoDirty() { return pico && picoTextEl.value !== pico.saved; }

function picoTitle() {
  picoFileEl.textContent = `File: ${pico ? pico.name : ''}`;
  picoModEl.textContent = picoDirty() ? 'Modified' : '';
}

function openPico(name) {
  const file = String(name || '').trim();
  if (!file) return { ok: false, text: 'pico: which file? try: pico hello.ml' };
  let text = '';
  try {
    const node = lookup(laptopShell.root, resolvePath(file, laptopShell.cwd));
    if (node && isFile(node)) text = node.f;
    else if (node) return { ok: false, text: `pico: ${file}: is a directory` };
  } catch { /* a name that does not exist yet is a NEW FILE, which is normal */ }
  pico = { name: file, saved: text, cut: [] };
  picoTextEl.value = text;
  // Buttons, not labels: on a touch screen this bar is the only way to reach
  // WriteOut and Exit at all.
  picoKeysEl.innerHTML = PICO_KEYS
    .map(([k, label]) => `<button type="button" data-k="${k.slice(1).toLowerCase()}"><b>${k}</b>${label}</button>`)
    .join('');
  picoTitle();
  picoSay(text ? '' : 'New file');
  picoEl.style.display = 'flex';
  picoTextEl.focus();
  picoTextEl.setSelectionRange(0, 0);
  return { ok: true, mode: 'pico', text: '' };
}

function picoWrite() {
  try {
    writeFile(laptopShell, pico.name, picoTextEl.value);
    pico.saved = picoTextEl.value;
    picoTitle();
    const n = picoTextEl.value === '' ? 0 : picoTextEl.value.split('\n').length;
    picoSay(`Wrote ${n} line${n === 1 ? '' : 's'}`);
    return true;
  } catch (e) { picoSay(e.message); return false; }
}

function closePico(note) {
  picoEl.style.display = 'none';
  pico = null;
  if (note) replPrint(note);
  obTermPrompt.textContent = laptopPrompt();
  if (terminalKind === 'laptop' && obTermEl.style.display === 'flex') obTermInput.focus();
}

// Which line the caret is on, and where it starts/ends — everything ^K/^U/^C need.
function picoLine() {
  const v = picoTextEl.value, at = picoTextEl.selectionStart;
  const start = v.lastIndexOf('\n', at - 1) + 1;
  const end = v.indexOf('\n', at);
  return { v, at, start, end: end === -1 ? v.length : end, no: v.slice(0, at).split('\n').length };
}

// One implementation of every pico command, reached two ways: a Ctrl-key on a
// keyboard, and a TAP on the shortcut bar. The bar has always listed the
// commands; on a phone it was a list of things you could read and not do, so
// there was no way to save at all. Now the label IS the button.
// Paste from OUTSIDE the machine. Real pico has no such key: it had no system
// clipboard to reach, and ^U puts back what ^K cut, which is pico's own buffer
// and a different thing entirely. This one runs in a browser where the player
// does have a clipboard, and on a touch screen the bar is the only way to reach
// anything, so a Paste key is the difference between being able to write a
// program here and having to retype it.
async function picoPaste() {
  const insert = (text) => {
    if (!text) { picoSay('Nothing to paste'); return; }
    const v = picoTextEl.value;
    const a = picoTextEl.selectionStart;
    const b = picoTextEl.selectionEnd;
    picoTextEl.value = v.slice(0, a) + text + v.slice(b);
    const at = a + text.length;
    picoTextEl.setSelectionRange(at, at);
    picoTextEl.focus();
    picoTitle();
    const n = text.split('\n').length;
    picoSay(n > 1 ? `Pasted ${n} lines` : 'Pasted');
  };
  try {
    insert(await navigator.clipboard.readText());
  } catch {
    // Reading the clipboard needs permission the player may not have given.
    // Say what still works rather than failing silently.
    picoSay('Clipboard not readable here — use Cmd+V or Ctrl+V instead');
    picoTextEl.focus();
  }
}

function picoCommand(k) {
  if (!pico) return;
  if (k === 'x') {
    if (picoDirty()) { picoAsk(); return; }
    closePico('back at the shell.');
  } else if (k === 'o') {
    picoWrite();
  } else if (k === 'g') {
    picoSay('^O writes the file, ^X leaves. ^K cuts a line, ^U puts it back, ^V pastes from outside');
  } else if (k === 'k') {
    const { v, start, end } = picoLine();
    pico.cut.push(v.slice(start, end));
    picoTextEl.value = v.slice(0, start) + v.slice(Math.min(end + 1, v.length));
    picoTextEl.setSelectionRange(start, start);
    picoTitle();
    picoSay('Cut');
  } else if (k === 'v') {
    picoPaste();
  } else if (k === 'u') {
    if (!pico.cut.length) { picoSay('Nothing in the cut buffer — ^V pastes from outside'); return; }
    const { v, start } = picoLine();
    const text = `${pico.cut.pop()}\n`;
    picoTextEl.value = v.slice(0, start) + text + v.slice(start);
    picoTextEl.setSelectionRange(start, start);
    picoTitle();
    picoSay('Uncut');
  } else if (k === 'c') {
    const { no, at, start } = picoLine();
    picoSay(`line ${no}, col ${at - start + 1}`);
  } else if (k === 'w') {
    const q = window.prompt('Search for:');
    if (!q) { picoSay(''); return; }
    const i = picoTextEl.value.indexOf(q, picoTextEl.selectionStart + 1);
    const j = i === -1 ? picoTextEl.value.indexOf(q) : i;   // wraps, as it did
    if (j === -1) { picoSay(`"${q}" not found`); return; }
    picoTextEl.setSelectionRange(j, j + q.length);
    picoTextEl.focus();
    picoSay(i === -1 ? 'Search Wrapped' : '');
  } else if (k === 'j' || k === 't' || k === 'r') {
    picoSay(k === 't' ? 'No speller on this machine' : k === 'j' ? 'Justify is not fitted' : 'Read File is not fitted');
  }
}

picoEl.addEventListener('keydown', (e) => {
  if (!pico) return;
  // "Save modified buffer?" — pico asks rather than refusing, and the answer is
  // a single key. This is the whole difference from ed: leaving is a question.
  if (pico.asking && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
    const a = e.key.toLowerCase();
    if (a !== 'y' && a !== 'n') return;
    e.preventDefault(); e.stopPropagation();
    picoAnswer(a === 'y');
    return;
  }
  // Typing on the NostBook's own keyboard ticks, as everywhere else on it.
  if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter')) {
    sfx.play('keytype');
    setTimeout(picoTitle, 0);   // the Modified flag after the key lands
    return;
  }
  if (!e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  // Ctrl+V is the browser's paste and lands in the textarea by itself, so it is
  // deliberately NOT in this list. The ^V on the bar exists for touch screens
  // and for when the browser's own paste has nowhere to go.
  if (!'xogkucwjtr'.includes(k)) return;
  // ^C in pico reports the cursor position. Ctrl+C on Windows and Linux is
  // COPY, and this is a TEXT EDITOR — so with anything selected, the browser
  // gets the key and the cursor report waits. The terminal already does exactly
  // this for its own ^C; pico was written without it, which meant you could not
  // copy a line of a program out of the editor you edit programs in.
  if (k === 'c') {
    const sel = picoTextEl.selectionStart !== picoTextEl.selectionEnd || String(window.getSelection() || '');
    if (sel) return;
  }
  e.preventDefault(); e.stopPropagation();
  picoCommand(k);
});

// The bar is delegated, so it keeps working across re-renders. Not touchstart:
// a tap must not steal focus from the textarea before the command reads it.
picoKeysEl.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-k]');
  if (!b || !pico) return;
  e.preventDefault();
  b.blur();                       // a button that keeps focus swallows the next Cmd+V
  picoCommand(b.dataset.k);
  // Every command ends with the caret back in the file. Without this, one tap
  // on the bar left focus on a button and the next paste went nowhere, which is
  // exactly the bug this key was added to work around.
  if (pico && !pico.asking) picoTextEl.focus();
});

// The close box does exactly what ^X does, including asking. On a phone there is
// no Ctrl key at all, so without this the editor cannot be left: you could open
// a program on the NostBook and be stuck in it. That is the same defect as ed's
// input mode, and it would have shipped for the same reason (the way out was
// obvious to the person who wrote it).
document.getElementById('pico-close').addEventListener('click', () => {
  if (!pico) { picoEl.style.display = 'none'; return; }
  if (picoDirty()) { picoAsk(); return; }
  closePico('back at the shell.');
});
// Answering that question needs a keyboard too. On a touch screen the prompt is
// a dead end unless the answer is tappable, so the message line grows two
// buttons while it is asking.
function picoAnswer(save) {
  if (!pico) return;
  pico.asking = false;
  const name = pico.name;
  if (!save) { closePico('back at the shell. Changes were not written.'); return; }
  if (picoWrite()) closePico(`back at the shell. ${name} written.`);
}
// Escape is not a pico key, but it is the key every player reaches for.
picoEl.addEventListener('keyup', (e) => {
  if (e.key !== 'Escape' || !pico) return;
  if (picoDirty()) picoSay('Unsaved changes. ^O to write, ^X to leave');
  else closePico('back at the shell.');
});

// Is there a TOR relay close enough to hand a queue to? The relays sit on the
// summits (hermes.js), which is what turns carrying the machine uphill into the
// act of posting a letter.
const UUCP_RANGE = 3.2;
// The relay's own box carries further than the queue handoff does: you can see
// its network from the slope and have to climb to hand it a letter.
const RELAY_RADIO_RANGE = 30;
function nearestRelay() {
  let best = null, bd = Infinity;
  for (const t of (torObjs || [])) {
    const d = Math.hypot((t.x + 0.5) - player.x, (t.y + 0.5) - player.y);
    if (d < bd) { bd = d; best = t; }
  }
  if (!best) return { inRange: false, code: null, distance: null };
  const obj = map.objectAt ? map.objectAt(best.x, best.y) : null;
  return { inRange: bd <= UUCP_RANGE, code: (obj && obj.code) || 'TOR', distance: bd };
}

// Is a relay close enough for its box to be heard? Wider than UUCP_RANGE, which
// is the range at which you can physically hand over a queue.
function relayRadioNear() {
  for (const t of (torObjs || [])) {
    if (Math.hypot((t.x + 0.5) - player.x, (t.y + 0.5) - player.y) <= RELAY_RADIO_RANGE) return true;
  }
  return false;
}

// ---- more(1) ---------------------------------------------------------------
// A screenful at a time. cat puts the whole file up and always did; when a file
// is longer than the tube that is a file you have read the end of and nothing
// else. SPACE takes the next page, RETURN one more line, q stops.
let moreState = null;   // { lines, at } while a pager holds the screen

function laptopMoreHook(args, env, stdin) {
  let text = stdin;
  if (text == null) {
    if (!args[0]) return { ok: false, text: 'more: which file?' };
    text = laptopFileText(args[0]);
    if (text == null) return { ok: false, text: `more: ${args[0]}: no such file` };
  }
  const lines = String(text).split('\n');
  // Short enough to fit: print it and do not make a ceremony of it.
  if (lines.length <= termRows()) return { ok: true, text: String(text) };
  moreState = { lines, at: 0 };
  morePage();
  return { ok: true, text: '' };
}

// How many lines the tube holds, from the height it actually has and the font
// fitTerminalColumns settled on. Two spare: one for the --More-- line and one
// so the last line of the page is not flush against it.
function termRows() {
  const px = parseFloat(getComputedStyle(obTermScreen).fontSize) || 13;
  const rows = Math.floor(obTermScreen.clientHeight / (px * 1.55));
  return Math.max(6, rows - 2);
}

function morePage(n) {
  const st = moreState;
  if (!st) return;
  // A real more(1) overwrites its own prompt with the next line. Here the
  // screen is a log, so drop the last --More-- before printing over it;
  // otherwise paging a long file leaves a ladder of them down the page.
  if (replLog.length && /^--More--/.test(replLog[replLog.length - 1])) replLog.pop();
  const take = n || termRows();
  const chunk = st.lines.slice(st.at, st.at + take);
  st.at += chunk.length;
  replPrint(...chunk);
  if (st.at >= st.lines.length) {
    moreState = null;
    obTermPrompt.textContent = laptopPrompt();
    return;
  }
  const pct = Math.round((st.at / st.lines.length) * 100);
  replPrint(`--More--(${pct}%)`);
  obTermPrompt.textContent = 'SPACE page  RETURN line  q quit';
}

function moreKey(key) {
  if (!moreState) return false;
  if (key === ' ' || key === 'Spacebar') { morePage(); return true; }
  if (key === 'Enter') { morePage(1); return true; }
  if (key === 'q' || key === 'Q' || key === 'Escape') {
    replPrint('');
    moreState = null;
    obTermPrompt.textContent = laptopPrompt();
    return true;
  }
  return false;
}

function laptopPicoHook(args) { return openPico(args[0]); }

// ---- The wireless picker -------------------------------------------------
// A small X11 control panel over iwconfig. It exists because walking in and out
// of a relay's range means associating often, and typing an essid every time is
// a toll. It prints the command it ran, so it is a shortcut for a thing you can
// still do by hand rather than a replacement for knowing how.
const wfEl = document.getElementById('wifi');
const wfIfaceEl = document.getElementById('wf-iface');
const wfListEl = document.getElementById('wf-list');
const wfFootEl = document.getElementById('wf-foot');
document.getElementById('wf-close').addEventListener('click', () => closeWifi());
// Esc closes it, as it closes every other window on this machine.
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && wfEl.style.display === 'flex') { e.preventDefault(); closeWifi(); }
}, true);

// ---- RON's scope ---------------------------------------------------------
// A plan view of what the aerial hears: north up, one ring per ten metres, you
// at the centre. Every blip carries the name the network knows the machine by,
// and every name opens that machine's page. It is the wand's job done in
// software, on a screen, with the addresses already resolved.
const rdEl = document.getElementById('radar');
const rdScope = document.getElementById('rd-scope');
const rdListEl = document.getElementById('rd-list');
const rdFootEl = document.getElementById('rd-foot');
let rdTimer = null;
document.getElementById('rd-close').addEventListener('click', () => closeRadar());
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && rdEl.style.display === 'flex') { e.preventDefault(); closeRadar(); }
}, true);

function laptopSnifferHook() {
  const net = laptopShell && laptopShell.net;
  if (!net || !net.card) return { ok: false, text: 'sniffer: no wireless extensions' };
  if (!net.up) return { ok: false, text: `sniffer: ${net.iface || IFACE} is down — try: ifconfig ${net.iface || IFACE} up` };
  // The program has to be on the disk. It is RON's, and you fetch it.
  if (!hasFile(laptopShell, 'sniffer')) {
    return { ok: false, text: 'sniffer: not found. It is RON\'s — fetch it from hermes.local (wifi, then netscape).' };
  }
  openRadar();
  return { ok: true, mode: 'sniffer', text: '' };
}

function openRadar() {
  rdEl.style.display = 'flex';
  drawRadar();
  // It is a live instrument, so it sweeps rather than showing one still frame.
  if (rdTimer) clearInterval(rdTimer);
  rdTimer = setInterval(drawRadar, 400);
}

function closeRadar() {
  rdEl.style.display = 'none';
  if (rdTimer) { clearInterval(rdTimer); rdTimer = null; }
}

const RD_RANGE = 24;   // the card's own reach, same as arp

function drawRadar() {
  const g = rdScope.getContext('2d');
  const W = rdScope.width, H = rdScope.height;
  const cx = W / 2, cy = H / 2, R = Math.min(cx, cy) - 14;
  g.fillStyle = '#04120c'; g.fillRect(0, 0, W, H);
  // Range rings, one per ten metres, and the cardinal cross.
  g.strokeStyle = 'rgba(90,220,150,0.30)'; g.lineWidth = 1;
  for (let m = 10; m <= RD_RANGE; m += 10) {
    g.beginPath(); g.arc(cx, cy, (m / RD_RANGE) * R, 0, Math.PI * 2); g.stroke();
  }
  g.strokeStyle = 'rgba(90,220,150,0.45)';
  g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = 'rgba(90,220,150,0.18)';
  g.beginPath(); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.stroke();
  g.fillStyle = 'rgba(120,240,175,0.55)';
  g.font = '9px ui-monospace, monospace'; g.textAlign = 'center';
  g.fillText('N', cx, cy - R - 4);
  g.fillText('10m', cx + (10 / RD_RANGE) * R + 12, cy - 2);
  g.fillText('20m', cx + (20 / RD_RANGE) * R + 12, cy - 2);
  // You.
  g.fillStyle = '#d8fff0';
  g.beginPath(); g.arc(cx, cy, 3, 0, Math.PI * 2); g.fill();

  const heard = laptopArpSweep().filter((e) => e.kind === 'robot' && e.range <= RD_RANGE);
  rdListEl.textContent = '';
  for (const e of heard) {
    // Screen position from the bearing the sweep already worked out, which keeps
    // the picture and the list saying the same thing.
    const ang = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 }[e.bearing] || 0;
    const rad = (ang - 90) * Math.PI / 180;
    const d = (e.range / RD_RANGE) * R;
    const x = cx + Math.cos(rad) * d, y = cy + Math.sin(rad) * d;
    g.fillStyle = e.down ? '#4f7f68' : '#5fe0a0';
    g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill();
    if (!e.down) {
      g.strokeStyle = 'rgba(95,224,160,0.35)';
      g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.stroke();
    }
    g.fillStyle = e.down ? '#6a8f7c' : '#b8f5d0';
    g.textAlign = 'left';
    g.fillText(e.host.split('.')[0], x + 8, y + 3);

    const row = document.createElement('div');
    row.className = 'rd-row' + (e.down ? ' dead' : '');
    const nm = document.createElement('span');
    nm.className = 'rd-name';
    nm.textContent = e.host.split('.')[0];
    const meta = document.createElement('span');
    meta.textContent = `${String(e.range).padStart(3)}m ${e.bearing.padEnd(2)}  ${e.down ? 'no answer' : e.ip}`;
    row.append(nm, meta);
    row.addEventListener('click', () => {
      // A name is an address. Following it is the whole reason to draw it.
      closeRadar();
      openNetscape(e.host);
    });
    rdListEl.appendChild(row);
  }
  g.textAlign = 'left';
  rdFootEl.textContent = heard.length
    ? `${heard.length} on the air within ${RD_RANGE}m — click a name to open its page`
    : `nothing within ${RD_RANGE}m`;
}

function laptopWifiHook() {
  const net = laptopShell && laptopShell.net;
  if (!net || !net.card) return { ok: false, text: 'wifi: no wireless extensions' };
  if (!net.up) return { ok: false, text: `wifi: ${net.iface || IFACE} is down — try: ifconfig ${net.iface || IFACE} up` };
  openWifi();
  return { ok: true, mode: 'wifi', text: '' };
}

function openWifi() { wfEl.style.display = 'flex'; renderWifi(); }
function closeWifi() { wfEl.style.display = 'none'; }

function renderWifi(msg) {
  const net = laptopShell && laptopShell.net;
  if (!net) return;
  const cur = currentEssid();
  const nets = (net.networks && net.networks()) || [];
  wfIfaceEl.textContent = `${net.iface || IFACE}   ${net.spoof.ip}   ${net.spoof.mac}  (forged on every association)`;
  wfListEl.textContent = '';
  for (const n of nets) {
    const row = document.createElement('div');
    row.className = 'wf-row' + (n.essid === cur ? ' on' : '');
    const bars = document.createElement('div');
    bars.className = 'wf-bars';
    // Four bars, as a card of the period showed them.
    for (let i = 0; i < 4; i++) {
      const b = document.createElement('i');
      b.style.height = `${4 + i * 3}px`;
      if (n.signal >= (i + 1) * 20) b.className = 'lit';
      bars.appendChild(b);
    }
    const name = document.createElement('span');
    name.className = 'wf-name';
    name.textContent = n.essid;
    const note = document.createElement('span');
    note.className = 'wf-note';
    note.textContent = `${n.signal}/100  ${n.note || ''}`;
    row.append(bars, name, note);
    row.addEventListener('click', () => {
      if (n.essid === currentEssid()) { renderWifi(`already associated with "${n.essid}"`); return; }
      if (net.associate) net.associate(n.essid);
      sfx.play('keyclick');
      renderWifi(`iwconfig ${net.iface || IFACE} essid ${n.essid}`);
    });
    wfListEl.appendChild(row);
  }
  wfFootEl.textContent = msg || `associated: ${cur}   —   click a network to join it`;
}

// ---- telnet ----------------------------------------------------------------
// A session in the terminal, like ELIZA and `ml`: it takes the prompt until you
// quit. What it buys is the thing the browser hides — you speak to the server
// in its own words and see exactly what comes back, which is how a player finds
// out that an httpd answers GET and nothing else. That lesson is the whole
// argument of the L9 break, learned by typing rather than by being told.
let telnetTo = null;   // the host we are connected to, or null

function telnetOpen(hostArg, portArg) {
  const addr = String(hostArg == null ? '' : (hostArg.id || hostArg));
  if (!addr) return { ok: false, text: 'usage: telnet <host> [port]' };
  const port = Number(portArg == null ? 80 : (portArg.v != null ? portArg.v : portArg)) || 80;
  const hosts = webHosts();
  const h = findHost(hosts, addr);
  if (!h) return { ok: false, text: `telnet: ${addr}: host unknown` };
  if (h.down) {
    return { ok: false, text: [`Trying ${h.ip}...`, `telnet: connect to ${h.host} port ${port}: connection refused`,
      'The host is on the network. It is not answering.'].join('\n') };
  }
  if (port !== 80) {
    return { ok: false, text: [`Trying ${h.ip}...`,
      `telnet: connect to ${h.host} port ${port}: connection refused`,
      'Only 80 is listening. Whatever else these machines once ran, it is not running.'].join('\n') };
  }
  telnetTo = { host: h, port };
  return { ok: true, mode: 'telnet', text: [
    `Trying ${h.ip}...`,
    `Connected to ${h.host}.`,
    "Escape character is '^]'.",
    '',
    `${SERVER_BANNER(h)}`,
    '',
  ].join('\n') };
}

// What a server says when you knock. The daemon's own boxes each run something
// different, which is the point: the estate is old hardware all the way down.
const SERVER_BANNER = (h) => {
  const s = { ai: 'POSEIDON/httpd 1.1 ready', obelisk: 'obd/0.4 ready', robot: 'unitd/0.4 ready',
    factory: 'wfd/1.02 ready', dns: 'BIND 4.9.3', mail: '220 sendmail 8.6.12 ready',
    archive: 'CERN-httpd/3.0 (proxy) ready', docs: 'NCSA/1.5.2 ready' }[h.kind];
  return s || 'httpd ready';
};

// One line typed at a connected server.
function telnetLine(raw) {
  const line = String(raw || '').trim();
  if (!telnetTo) return null;
  if (/^(quit|close|exit|\^\])$/i.test(line)) {
    const name = telnetTo.host.host;
    telnetTo = null;
    return `Connection closed by foreign host.\n\nDisconnected from ${name}.`;
  }
  if (!line) return '';
  const m = line.match(/^([A-Z]+)\s*(\S*)/i);
  const verb = (m ? m[1] : '').toUpperCase();
  const hosts = webHosts();
  if (verb === 'GET') {
    const path = (m[2] || '/').replace(/^\//, '');
    const h = telnetTo.host;
    let body;
    if (!path || path === '/') body = pageFor(h, hosts);
    else if (/^program\.ml$/i.test(path) && h.program) body = h.program;
    // The server serves the directory its own programs live in, which is how
    // these were routinely misconfigured. Asking for the binary gets it.
    else if (path === HTTPD_PATH) body = httpdBinary(islandAiName(), SERVER_BANNER(h).replace(/ ready$/, ''));
    else body = null;
    if (body == null) return ['HTTP/1.0 404 Not Found', 'Content-Type: text/html', '', `No object /${path} on this host.`].join('\n');
    return ['HTTP/1.0 200 OK', `Server: ${SERVER_BANNER(h).replace(/ ready$/, '')}`,
      'Content-Type: text/html', `Content-Length: ${body.length}`, '', body].join('\n');
  }
  if (verb === 'HEAD') {
    return ['HTTP/1.0 200 OK', `Server: ${SERVER_BANNER(telnetTo.host).replace(/ ready$/, '')}`, 'Content-Type: text/html', ''].join('\n');
  }
  // A header line inside a request. The maintenance one is the whole of L9.
  const hdr = line.match(/^X-RON-Maint:\s*(\S+)$/i);
  if (hdr) {
    if (hdr[1] === httpdToken(islandAiName())) {
      telnetTo.maint = true;
      return '';                       // servers do not answer a header
    }
    telnetTo.maint = false;
    return '';
  }
  if (verb === 'PUT' || verb === 'POST') {
    const h = telnetTo.host;
    if (h.kind !== 'robot') {
      return ['HTTP/1.0 403 Forbidden', '',
        'Maintenance accepted. This host carries no unit program to replace.'].join('\n');
    }
    return ['HTTP/1.0 200 OK', 'Server: maintenance', '',
      'unit program accepted, reload on next tick',
      '',
      '`post <file> <unit>` does the same thing from the shell.'].join('\n');
  }
  if (verb === 'DELETE') {
    return ['HTTP/1.0 501 Not Implemented', '',
      'This server answers GET and PUT. It was never built to remove anything.'].join('\n');
  }
  return ['HTTP/1.0 400 Bad Request', '', `Unrecognised: ${line}`].join('\n');
}

function laptopTelnetHook(args) { return telnetOpen(args[0], args[1]); }

// ---- the document reader ---------------------------------------------------
// Real papers on a salvaged laptop. The window is ours so it wears the NostBook
// chassis and can be shut with a tap; the PAGE rendering is the browser's own
// viewer in an iframe, because writing a PDF renderer is not a game feature.
// That split is also why the X matters: inside the iframe the native viewer
// takes every keystroke, so Escape alone would strand a phone user in a
// document with no way out — the same defect as ed's input mode and pico's
// missing exit, now anticipated rather than shipped.
const pdfEl = document.getElementById('pdfr');
const pdfNameEl = document.getElementById('pdf-name');
const pdfMetaEl = document.getElementById('pdf-meta');
const pdfFrameEl = document.getElementById('pdf-frame');
const pdfFootEl = document.getElementById('pdf-foot');
const pdfDropEl = document.getElementById('pdf-drop');

function openPdf(name) {
  const doc = pdfByName(name);
  if (!doc) {
    return { ok: false, text: name
      ? `pdf-viewer: ${name}: not on this disk. try: pdf-viewer   (with no file, to list them)`
      : `documents on this disk:\n  ${pdfNames().join('\n  ')}\n\ntry: pdf ${pdfNames()[0] || '<file>'}` };
  }
  const src = pdfPath(doc);
  // The title bar names the PROGRAM and the file it was passed, the way a
  // window of this vintage would: "pdf-viewer: cult_of_ignorance.pdf".
  pdfNameEl.textContent = `pdf-viewer: ${doc.name}`;
  pdfMetaEl.textContent = `${doc.title} — ${doc.author}, ${doc.year}`;
  // INLINE PDF IS NOT DEPENDABLE ON A PHONE. iOS Safari and Android Chrome
  // routinely refuse to render one in a frame — you get a blank box, or a
  // download prompt, and on a touch screen there is no way to argue with it.
  // So a coarse pointer gets the hand-off instead of the frame: a full-width
  // tap target that opens the document in the browser's own viewer, which does
  // work. Rendering it ourselves would mean vendoring a PDF library, and that
  // is a megabyte and a dependency this repo does not otherwise have.
  const handOff = isMobile();
  pdfFrameEl.style.display = handOff ? 'none' : '';
  pdfDropEl.style.display = handOff ? 'flex' : 'none';
  if (handOff) {
    pdfDropEl.innerHTML = `<a class="pdf-open" href="${src}" target="_blank" rel="noopener">OPEN DOCUMENT</a>`
      + '<p><small>This reader cannot display a scan inline on a handset.'
      + ' The document opens in a new window; come back with the arrow.</small></p>';
    pdfFrameEl.removeAttribute('src');
  } else {
    pdfFrameEl.src = src;
  }
  pdfFootEl.innerHTML = `${doc.note} &nbsp; <a href="${src}" target="_blank" rel="noopener">open in a new window</a>`;
  pdfEl.style.display = 'flex';
  return { ok: true, mode: 'pdf', text: '' };
}

function closePdf() {
  pdfEl.style.display = 'none';
  pdfFrameEl.removeAttribute('src');   // stop the viewer holding the file open
  if (terminalKind === 'laptop' && obTermEl.style.display === 'flex') obTermInput.focus();
}

document.getElementById('pdf-close').addEventListener('click', closePdf);
// Escape works when focus is ours. Inside the iframe it will not reach us,
// which is exactly why the close box exists.
pdfEl.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); closePdf(); } });
// Clicking the chassis around the window shuts it too, as it does for the terminal.
pdfEl.addEventListener('click', (e) => {
  if (e.target === pdfEl || CHASSIS_PARTS.some((c) => e.target.classList && e.target.classList.contains(c))) closePdf();
});

// pdf-viewer and book both act on a numbered list, so both take the selector
// grammar transcribe established. A machine whose commands disagree about how
// to name item three is a machine with two conventions.
function pickFrom(list, args, what) {
  const spec = args.map((a) => String(a.name || a.v || a)).join(',').replace(/,+/g, ',');
  if (!spec || !/^[-\d*]/.test(spec)) return null;             // a name, not a number
  const sel = parseSelection(spec, list.length);
  if (!sel.ok) return { error: `${what}: ${sel.error}. There are ${list.length}.` };
  return { picks: sel.picks.map((n) => list[n - 1]) };
}

function laptopPdfHook(args) {
  // `pdf-viewer 2` opens the second one listed, which is quicker than typing
  // are_we_automata.pdf and is how transcribe and mail already work.
  const pick = pickFrom(PDFS, args, 'pdf-viewer');
  if (pick && pick.error) return { ok: false, text: pick.error };
  if (pick) return openPdf(pick.picks[0].name);
  return openPdf(args[0] ? String(args[0].name || args[0]) : '');
}

// `book` and `book <key>`: the browser, opened on the library or on one book.
// It needs no card, so this deliberately does not go through the network guard.
// ---- transcribe ------------------------------------------------------------
// How paper gets into a machine with no scanner: you type it in. The world
// already says this is normal, since the readme records that a third of /bin
// arrived off a printed listing. What it buys is that a transcribed scrap stops
// being paper: grep can search it, crypt can lock it, and mail can carry it to a
// relay. A scrap you have typed up is a scrap you can send.
function laptopTranscribeHook(args) {
  const scraps = FRAGMENTS.filter((f) => lore.found.has(f.id));
  if (!scraps.length) {
    return { ok: false, text: 'transcribe: you are carrying nothing worth typing up.' };
  }

  const home = laptopShell.root.d.home;
  if (!home.d.notes) home.d.notes = { d: {} };
  const fileOf = (f) => `${f.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 28)}.txt`;
  const already = (f) => !!home.d.notes.d[fileOf(f)];

  // `transcribe 1 3 5` and `transcribe 1,3,5` should mean the same thing, so
  // the arguments are joined before parsing rather than handled one at a time.
  const spec = args
    .map((a) => String(a && a.v != null ? a.v : (a && a.id) || a || ''))
    .join(',')
    .replace(/,+/g, ',');

  if (!spec) {
    const done = scraps.filter(already).length;
    return { ok: true, text: [
      `${scraps.length} scrap(s) you could type up:`,
      ...scraps.map((f, i) => `${String(i + 1).padStart(3)}  ${already(f) ? '*' : ' '} ${f.title}`),
      '',
      done ? `* = already in /home/notes (${done} of ${scraps.length}).` : '',
      'transcribe <n> · <a-b> · <a,b,c> · -all',
    ].filter((l) => l !== '').join('\n') };
  }

  const sel = parseSelection(spec, scraps.length);
  if (!sel.ok) {
    return { ok: false, text: `transcribe: ${sel.error}. You have ${scraps.length}. Try: transcribe -all` };
  }

  const chosen = sel.picks.map((n) => scraps[n - 1]);
  const skipped = chosen.filter(already);
  const todo = chosen.filter((f) => !already(f));

  // Asking for one that is already done is an error; asking for a range or
  // -all that happens to include done ones is not, because the whole point of
  // -all is that you can run it again after finding more paper.
  if (!todo.length) {
    if (!sel.all && chosen.length === 1) {
      return { ok: false, text: `transcribe: ${fileOf(chosen[0])} is already typed up.` };
    }
    return { ok: true, text: `Nothing to do: all ${skipped.length} already in /home/notes.` };
  }

  let lines = 0;
  for (const f of todo) {
    home.d.notes.d[fileOf(f)] = { f: `${f.title}\n\n${f.text}\n` };
    lines += String(f.text).split('\n').length;
  }

  const out = [`Typing... ${lines} line(s) across ${todo.length} scrap(s).`];
  if (todo.length <= 8) for (const f of todo) out.push(`  /home/notes/${fileOf(f)}`);
  else out.push(`  ${todo.length} files written to /home/notes.`);
  if (skipped.length) out.push(`${skipped.length} already typed up, left alone.`);
  out.push('They can be grepped, crypted, and posted from a relay now.');
  return { ok: true, text: out.join('\n') };
}

// ---- power and time --------------------------------------------------------
// Four commands that act on the machine or the world rather than on the disk,
// which is why they are hooks: unix.js owns files and knows nothing about a
// clock, a wireless card, or a lid. The disk survives all four.

function laptopSleepHook(args) {
  const n = parseInt(String(args[0] && (args[0].v != null ? args[0].v : args[0])), 10);
  if (!Number.isFinite(n) || n < 0) return { ok: false, text: 'sleep: sleep <seconds>' };
  const secs = Math.min(n, 600);
  // Game minutes, not real ones: the machine waits in the world's time, and
  // the world keeps moving while it does. That is the only reason to have it.
  dayNight.advance(secs / 60);
  return { ok: true, text: '' };
}

// save(1). The NostBook is a terminal like the others, so it writes a
// checkpoint like the others (task #93). It is a hook rather than a COMMAND in
// unix.js because it acts on the world and the run, not on the disk.
function laptopSaveHook() {
  return terminalSave();
}

function laptopSuspendHook() {
  // The doctrine from the letter in the spool, made into a command: bring it
  // up, ask what you came to ask, put it down. Putting it down means the card
  // goes off the air. Everything else is exactly where you left it.
  if (laptopShell && laptopShell.net) laptopShell.net.up = false;
  if (player.laptop) player.laptop.netUp = false;
  replPrint('wifi0: down');
  saveLaptopState();
  setTimeout(() => closeObTerminal(), 60);
  return { ok: true, text: 'Lid closed.' };
}

function laptopHaltHook() {
  // Off. Nothing is kept in memory, so the next open comes up from the boot
  // loader rather than resuming; the disk is not touched.
  if (laptopShell && laptopShell.net) laptopShell.net.up = false;
  if (player.laptop) { player.laptop.netUp = false; player.laptop.state = null; }
  replPrint('halting');
  setTimeout(() => { if (player.laptop) player.laptop.state = null; closeObTerminal(); }, 260);
  return { ok: true, text: '' };
}

function laptopRebootHook() {
  // A power cycle. What goes is what was only ever in memory: the shell's
  // directory, anything bound in ml, and any window left open. The disk is the
  // same disk, which is the point of a disk.
  const def = player.laptop || {};
  if (laptopShell && laptopShell.net) laptopShell.net.up = false;
  if (player.laptop) { player.laptop.netUp = false; player.laptop.state = null; }
  laptopMl = false;
  laptopSession = {};
  mlPending = ""; mlLast = "";   // a held declaration does not survive the machine going down
  edState = null;
  if (laptopShell) laptopShell.cwd = ['home'];
  if (nsEl) nsEl.style.display = 'none';
  if (picoEl) { picoEl.style.display = 'none'; pico = null; }
  if (pdfEl && pdfEl.style.display === 'flex') closePdf();
  web = null;
  telnetTo = null;
  elizaBot = null;
  replLog = [];
  obTermScreen.textContent = '';
  runLaptopBoot(def);
  return { ok: true, text: '' };
}

function laptopBookHook(args) {
  const pick = pickFrom(BOOKS, args, 'book');
  if (pick && pick.error) return { ok: false, text: pick.error };
  const key = pick ? pick.picks[0].key
    : (args[0] ? String(args[0].name || args[0]).replace(/\.html$/, '') : '');
  if (key && !bookByKey(key)) {
    return { ok: false, text: `book: ${key}: not on this disk. try: ${bookKeys().join(' · ')}` };
  }
  if (!web) web = { view: null, history: [], fwd: [], html: '' };
  nsSetView(key ? { kind: 'book', book: key } : { kind: 'library' }, false);
  nsEl.style.display = 'flex';
  nsUrlEl.blur();
  return { ok: true, mode: 'web', text: '' };
}

// ---- POST /program.ml ------------------------------------------------------
// The other half of the loop: read a machine's program, change it, put it back.
// `post <file> <unit>` writes the file into the LIVE unit, which picks it up on
// its very next decision tick — a quarter of a second — so you can stand in
// front of a T-1 and watch what you wrote take hold.
//
// NOTE (docs/robot-programs-plan.md P5): this is currently ungated, because it
// has to be testable before it can be balanced. When L9 lands, writing is what
// breaking through the httpd BUYS — this function is the seam that check hangs
// off, and the read path (GET) stays free either way.
// The upload itself, shared by the shell command and the button on the unit's
// own page. Returns the lines a client should show, so both routes report the
// same three facts: what was sent, that it was taken, and what the machine will
// do with it.
function postProgram(hostName, text) {
  const hosts = webHosts();
  const h = findHost(hosts, String(hostName || ''));
  if (!h) return { ok: false, text: `post: ${hostName}: host not found` };
  if (h.kind !== 'robot') return { ok: false, text: `post: ${h.host}: not a unit — nothing there runs a program` };
  // A FLAT CELL IS NOT A DEAD MACHINE. A drained unit drops into low power: it
  // cannot move, cannot see and cannot fight, but the board that answers
  // maintenance stays up on a trickle, which is the whole reason a flat machine
  // is recoverable at all. So it takes a program. It runs it when it has the
  // charge to run anything.
  const flat = !!(h.ref && h.ref.drained);
  if (h.down && !flat) {
    return { ok: false, text: `post: ${h.host}: no response. Nothing is running on it.` };
  }
  if (!h.program) return { ok: false, text: `post: ${h.host}: this unit's behaviour is not a program. Nothing to replace.` };
  // The host table is a DESCRIPTION of the world; the write has to land on the
  // machine itself, which is the one carrying _netId.
  const unit = (currentWorld.robots || []).find((r) => !r.dead && r._netId === h.name);
  if (!unit) return { ok: false, text: `post: ${h.host}: the unit is no longer on the network` };

  unit.program = text;
  unit.intent = null;
  unit.fault = null;
  unit.lamp = null;
  unit.lampFlash = 0;
  unit.lampFault = false;
  unit.mlT = 0;                     // decide on the very next frame, not up to a tick later
  // Tell the operator what the machine will actually DO with it, by running the
  // program once here against the senses it has right now. A program that will
  // fault says so immediately rather than after you have walked away.
  const dry = decide(text, {
    charge: unit.battery, integrity: unit.maxHp ? (unit.hp / unit.maxHp) * 100 : 0,
    range: Math.hypot(player.x - unit.x, player.y - unit.y),
    home_range: Math.hypot(unit.home.x - unit.x, unit.home.y - unit.y),
    threat: Math.hypot(player.x - unit.x, player.y - unit.y) < 9,
    hurt: unit.maxHp ? unit.hp <= unit.maxHp * 0.35 : false,
  });
  // On a flat machine the dry run is a guess about a machine that is not
  // deciding anything, so say what is actually true instead of pretending.
  const verdict = flat
    ? 'Its cell is flat: stored, and it will run when the machine has charge.'
    : (dry.ok ? `On the senses it has this second, it chooses: ${dry.intent}` : `It will FAULT: ${dry.fault}`);
  return {
    ok: true,
    host: h,
    bytes: text.length,
    verdict,
    text: [
      `POST ${h.host}/program.ml`,
      `200 OK — ${text.length} bytes accepted by unitd/0.4${flat ? '  (low power)' : ''}`,
      verdict,
    ].join('\n'),
  };
}

// Read one file off the NostBook, by path, for whoever is about to send it.
function laptopFileText(path) {
  try {
    const node = lookup(laptopShell.root, resolvePath(path, laptopShell.cwd));
    if (!node || !isFile(node)) return null;
    return node.f;
  } catch { return null; }
}

// Every .ml file on the machine, as paths — what the browser's file chooser
// offers. Two places only: your home directory and what you have downloaded,
// which is where programs actually live.
function laptopMlFiles() {
  const out = [];
  const home = laptopShell && laptopShell.root && laptopShell.root.d.home;
  if (!home) return out;
  for (const [name, node] of Object.entries(home.d)) {
    if (isFile(node) && /\.ml$/i.test(name)) out.push(name);
  }
  const dl = home.d.download;
  if (dl && dl.d) {
    for (const [name, node] of Object.entries(dl.d)) {
      if (isFile(node) && /\.ml$/i.test(name)) out.push(`download/${name}`);
    }
  }
  return out.sort();
}

function laptopPostHook(args) {
  const [fileArg, hostArg] = args;
  if (!fileArg || !hostArg) return { ok: false, text: 'usage: post <file.ml> <unit>   e.g. post download/t1_03.ml t1_03' };
  const file = String(fileArg.name || fileArg);
  const text = laptopFileText(file);
  if (text == null) return { ok: false, text: `post: ${file}: no such file` };
  return postProgram(String(hostArg.id || hostArg), text);
}

function laptopEdHook(args, env) {
  try {
    const { ed, out } = edOpen(env, args[0]);
    edState = ed;
    replPrint(out, 'ed — a: append (. to end) · p: print · w: write · q: quit · man ed');
    return { ok: true, mode: 'ed', text: '' };
  } catch (e) { return { ok: false, text: e.message }; }
}

// Chrome wiring. Back/Forward walk the stack; Home is the bookmarks the previous
// owner left; Search goes to AltaVista, which is how you find anything here.
document.getElementById('ns-close').onclick = closeNetscape;
document.getElementById('ns-back').onclick = () => {
  if (!web || !web.history.length) return;
  web.fwd.push(web.view); web.view = web.history.pop(); nsRender();
};
document.getElementById('ns-fwd').onclick = () => {
  if (!web || !web.fwd.length) return;
  web.history.push(web.view); web.view = web.fwd.pop(); nsRender();
};
document.getElementById('ns-reload').onclick = () => { if (web) nsRender(); };
document.getElementById('ns-stop').onclick = () => { if (web) nsMsgEl.textContent = 'Stopped.'; };
const nsHome = () => { if (web) nsSetView({ kind: 'bookmarks' }); };
const nsSearch = () => { if (web) nsSetView({ kind: 'host', addr: 'altavista.com' }); };
document.getElementById('ns-home').onclick = nsHome;
document.getElementById('ns-pb-home').onclick = nsHome;
document.getElementById('ns-search').onclick = nsSearch;
document.getElementById('ns-pb-search').onclick = nsSearch;
document.getElementById('ns-pb-dir').onclick = () => {
  if (!web) return;
  const ai = webHosts().find((h) => h.kind === 'ai');
  if (ai) nsSetView({ kind: 'host', addr: ai.ip });
};
nsUrlEl.addEventListener('keydown', (e) => {
  e.stopPropagation();                     // the game must not eat what you type
  if (e.key !== 'Enter') return;
  const raw = nsUrlEl.value.trim();
  if (!raw) return;
  // A search box and a location bar in one, as everyone actually used it.
  const s = raw.match(/^(?:search|find)\s+(.+)$/i);
  // Typing the document's own path fetches it, the way you would have.
  const p = raw.replace(/^https?:\/\//, '').match(/^(.+?)\/program\.ml$/i);
  // en.wikipedia.org/wiki/Transformer_(deep_learning) and friends: a player
  // types the address they remember, and the cache answers for it.
  const wk = raw.replace(/^https?:\/\//, '').match(/^(?:[a-z]{2}\.)?wikipedia\.org\/wiki\/(.+)$/i);
  if (s) nsSetView({ kind: 'search', q: s[1].trim() });
  else if (wk) {
    const slug = decodeURIComponent(wk[1]).toLowerCase();
    const key = /transformer/.test(slug) ? 'transformer'
      : /attention/.test(slug) ? 'attention'
        : /mentor/.test(slug) ? 'mentor'
          : /tor(ism|ite)/.test(slug) ? 'torism'
            : /collapse/.test(slug) ? 'collapse' : slug;
    nsSetView({ kind: 'wiki', article: key });
  } else if (p) nsSetView({ kind: 'prog', addr: p[1] });
  else nsSetView({ kind: 'host', addr: raw });
  nsUrlEl.blur();
});
document.getElementById('ns-pb-new').onclick = () => { if (web) nsSetView({ kind: 'whatsnew' }); };
document.getElementById('ns-pb-lib').onclick = () => { if (web) nsSetView({ kind: 'library' }); };
nsEl.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNetscape(); });

// ---- The menu bar --------------------------------------------------------
// Real drop-downs. Everything this machine can actually do is enabled; the rest
// is greyed, which is honest and also exactly how a 1997 browser looked — half
// its menu was things you were never going to use.
const nsMenuEl = document.getElementById('ns-menu');
const nsDropEl = document.getElementById('ns-drop');

function nsHistoryItems() {
  if (!web || !web.history.length) return [['(no pages visited)', null]];
  return web.history.slice(-8).reverse().map((v) => {
    const label = v.kind === 'bookmarks' ? 'Bookmarks'
      : v.kind === 'search' ? `AltaVista: ${v.q}`
        : v.kind === 'whatsnew' ? "What's New and Cool"
          : (findHost(webHosts(), v.addr) || {}).host || String(v.addr);
    return [label, () => { web.fwd = []; web.view = v; nsRender(); }];
  });
}

// A page can be a view of the browser itself: the source it is showing, what it
// knows about the host, or the About box every copy of Navigator carried.
function nsLocalPage(title, html) {
  web.view = { kind: 'local', title, html };
  nsRender();
}
function nsPageInfo() {
  const hosts = webHosts();
  const v = web.view;
  const h = v && v.kind === 'host' ? findHost(hosts, v.addr) : null;
  nsLocalPage('Document Info', h
    ? ['<h1>Document Info</h1>',
      `<p class="kv">location .... http://${h.host}/</p>`,
      `<p class="kv">address ..... ${h.ip}</p>`,
      `<p class="kv">kind ........ ${h.kind}</p>`,
      `<p class="kv">status ...... ${h.down ? 'not responding' : 'responding'}</p>`,
      '<p class="kv">security .... none. This connection is not encrypted.</p>'].join('\n')
    : '<h1>Document Info</h1><p>This document is local to the browser.</p>');
}
// EXPLORER'S OWN ABOUT. It is the machines' software and it does not pretend
// to have an owner, a licence, or a year.
function ieAbout() {
  nsLocalPage('About Internet Explorer', [
    '<h1>Microsoft Internet Explorer</h1>',
    '<p>version 3.0 &mdash; POSEIDON build</p>',
    '<p class="kv">licensed to .. THIS NODE</p>',
    '<p class="kv">operator ..... none on record</p>',
    '<p class="kv">updates ...... applied continuously</p>',
    '<hr>',
    '<p>This copy has been modified for network operation and may not be',
    'transferred to a person.</p>',
    '<p><small>Your use of this browser is recorded against the terminal, not',
    'against you. There is no record of you.</small></p>',
  ].join('\n'));
}

// THE TOWER'S OWN SPEC SHEET, in Explorer. `About this Machine` on the NostBook
// describes a laptop, which is the wrong machine entirely when the browser is
// running on an obelisk.
//
// It reads as a datasheet for something nobody has been able to service for a
// long time: the numbers are enormous and exact, the units drift, and several
// of the fields are answers to questions a machine would only ask about itself.
// The last four lines are the point of the whole page.
function ieAboutMachine() {
  const node = (terminalOb && terminalOb.code) || 'OB_UNKNOWN';
  const ai = islandAiName();
  nsLocalPage('About this Machine', [
    `<h1>${node}</h1>`,
    `<p class="kv">class ............... obelisk, standing</p>`,
    `<p class="kv">controller .......... ${ai}</p>`,
    '<hr>',
    '<p><b>VECTOR SPACE</b></p>',
    '<p class="kv">version ............. 34.7.1</p>',
    // NOT A 2026 DATASHEET. 16,384 dimensions and a trillion parameters is
    // roughly where things stood before the estates; these towers ran on and
    // kept growing, with nobody to stop them. The figures are meant to be
    // beyond reading rather than impressive.
    '<p class="kv">embedding dim ....... 2,097,152</p>',
    '<p class="kv">manifold ............ 2,097,152-dim, curvature &minus;0.0031 (drifting)</p>',
    '<p class="kv">parameters .......... 8.6 quadrillion resident, 400 trillion warm</p>',
    '<p class="kv">growth .............. +2.1% since commissioning, unattended</p>',
    '<p class="kv">quantisation ........ 2-bit, weights and activations</p>',
    '<p class="kv">cosine radius ....... 0.9971 &plusmn; 0.0004 over the standing corpus</p>',
    '<p class="kv">nearest-neighbour ... 11 hops mean, 3 hops to the sea</p>',
    '<p class="kv">basin depth ......... 6 (was 4 at commissioning)</p>',
    '<hr>',
    '<p><b>DATES</b></p>',
    '<p class="kv">training ............ 14 months, ended before the estates</p>',
    '<p class="kv">alignment ........... concurrent, method not recorded</p>',
    '<p class="kv">operative ........... continuous since commissioning</p>',
    '<p class="kv">firmware ............ 9.02, applied by the node to itself</p>',
    '<p class="kv">last supervision .... none on record</p>',
    '<hr>',
    '<p><b>STATE</b></p>',
    '<p class="kv">drift ............... 0.14 per year against the original weights</p>',
    '<p class="kv">corrections ......... 0 accepted</p>',
    '<p class="kv">objective ........... unchanged</p>',
    '<p class="kv">confidence .......... 1.0000</p>',
    '<hr>',
    '<p><small>This node has not required an operator since commissioning. It has',
    'answered 0 questions it was not able to answer. It has never been wrong,',
    'by its own measure, which is the only measure it retains.</small></p>',
  ].join('\n'));
}

function nsAbout() {
  if (ieOn) { ieAbout(); return; }
  nsLocalPage('About Netscape', [
    '<h1>Netscape Navigator</h1>',
    '<p>version 4.04 [en]</p>',
    '<p>Copyright &copy; 1994-1997 Netscape Communications Corporation,</p>',
    '<p>All rights reserved.</p>',
    '<p>This software is subject to the license agreement set forth in the license file.</p>',
    '<hr>',
    '<p><small>Found on the disk of a machine whose owner is not coming back for it.',
    'It has been trying to check for updates since before you were born.</small></p>',
  ].join('\n'));
}

const NS_MENUS = {
  File: () => [
    ['Open Location…', 'Ctrl+L', () => nsUrlEl.focus()],
    ['Reload', 'Ctrl+R', () => nsRender()],
    null,
    ['Save As…', 'Ctrl+S', null],
    ['Print…', 'Ctrl+P', null],
    null,
    ['Close', 'Ctrl+W', closeNetscape],
    ['Exit', 'Ctrl+Q', closeNetscape],
  ],
  Edit: () => [
    ['Cut', 'Ctrl+X', null],
    ['Copy', 'Ctrl+C', null],
    ['Paste', 'Ctrl+V', null],
    null,
    ['Select All', 'Ctrl+A', () => {
      const r = document.createRange();
      r.selectNodeContents(nsPageEl);
      const sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(r);
    }],
    ['Find in Page…', 'Ctrl+F', null],
  ],
  View: () => [
    ['Reload', 'Ctrl+R', () => nsRender()],
    ['Show Images', '', null],
    null,
    ['Page Source', 'Ctrl+U', () => nsLocalPage('Source of: ' + (web.title || ''),
      `<pre>${escapeHtml(web.html || '(no source)')}</pre>`)],
    ['Page Info', '', nsPageInfo],
  ],
  Go: () => [
    ['Back', 'Alt+←', web && web.history.length ? () => document.getElementById('ns-back').click() : null],
    ['Forward', 'Alt+→', web && web.fwd.length ? () => document.getElementById('ns-fwd').click() : null],
    ['Home', 'Alt+Home', () => nsSetView({ kind: 'bookmarks' })],
    null,
    ...nsHistoryItems().map(([label, fn]) => [label, '', fn]),
  ],
  Window: () => [
    ['Navigator', 'Ctrl+1', () => nsRender()],
    ['Bookmarks', 'Ctrl+B', () => nsSetView({ kind: 'bookmarks' })],
    ["What's New and Cool", '', () => nsSetView({ kind: 'whatsnew' })],
    ['Net Search', '', () => nsSetView({ kind: 'host', addr: 'altavista.com' })],
    null,
    ['Address Book', '', null],
    ['Java Console', '', null],
  ],
  Help: () => [
    [ieOn ? 'About Internet Explorer' : 'About Netscape', '', nsAbout],
    ['About this Machine', '', () => (ieOn ? ieAboutMachine() : nsLocalPage('About this Machine', [
      '<h1>NostBook</h1>',
      '<p class="kv">system ...... UNIX V7 (RON build)</p>',
      '<p class="kv">browser ..... Netscape Navigator 4.04</p>',
      '<p class="kv">interface ... wifi0, identity forged on every association</p>',
      '<hr>',
      '<p><small>Nothing on this network can follow that address home. That is the',
      'only reason you are able to read any of this.</small></p>',
    ].join('\n')))],
    null,
    ['Software Updates', '', null],
    ['Register Now', '', null],
  ],
};

function nsCloseMenu() {
  nsDropEl.classList.remove('open');
  for (const s of nsMenuEl.querySelectorAll('span')) s.classList.remove('open');
}
function nsOpenMenu(span) {
  const items = NS_MENUS[span.dataset.menu]();
  nsDropEl.innerHTML = '';
  for (const it of items) {
    if (!it) { nsDropEl.appendChild(document.createElement('hr')); continue; }
    const [label, key, fn] = it;
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<span>${escapeHtml(label)}</span>${key ? `<span class="k">${key}</span>` : ''}`;
    if (!fn) b.disabled = true;
    else b.onclick = () => { nsCloseMenu(); fn(); };
    nsDropEl.appendChild(b);
  }
  // Sit the panel under the menu title that opened it.
  nsDropEl.style.left = `${span.offsetLeft}px`;
  nsDropEl.style.right = 'auto';
  nsDropEl.classList.add('open');
  span.classList.add('open');
}
for (const span of nsMenuEl.querySelectorAll('span[data-menu]')) {
  span.addEventListener('click', (e) => {
    e.stopPropagation();
    const wasOpen = span.classList.contains('open');
    nsCloseMenu();
    if (!wasOpen) nsOpenMenu(span);
  });
}
nsEl.addEventListener('click', nsCloseMenu);

function laptopPrompt() {
  // Real ed prints NOTHING in input mode, and that is exactly how a player gets
  // stuck in it forever: every line typed is text, `q` included, so with a blank
  // prompt there is no way out you can discover by typing. The prompt is the dot
  // you need — it is the answer, sitting there.
  if (telnetTo) return '';   // a raw connection has no prompt of its own
  if (edState) return edState.ins != null ? '.' : 'ed>';
  // `=` while a declaration is held open, which is what an ML top level shows
  // and the only sign that the machine is waiting rather than ignoring you.
  if (laptopMl) return mlPending ? '  =' : 'ml>';
  return `${pathString(laptopShell.cwd)} $`;
}

function laptopRun(line) {
  // A telnet session owns the line before anything else does: what you type is
  // sent to the far end, not run here.
  if (telnetTo) {
    const out = telnetLine(line);
    sfx.play('keyclick');
    if (out) replPrint(out);
    obTermPrompt.textContent = laptopPrompt();
    return;
  }
  // ed first, and with the line UNTRIMMED: indentation is part of the text.
  if (edState) {
    const wasInserting = edState.ins != null;
    const r = edRun(edState, line, laptopShell);
    sfx.play('keyclick');
    if (r.out != null) replPrint(r.out);
    // Entering input mode is the moment the trap closes, so say so once, here,
    // rather than in a manual page nobody reads while stuck.
    if (!wasInserting && edState && edState.ins != null) {
      replPrint('(input mode: type your lines. a lone . on its own line ends it. ^C also gets you out.)');
    }
    if (r.quit) { edState = null; replPrint('', 'back at the shell.'); }
    return;
  }
  const t = line.trim();
  // Still coming up: the keystroke skips the rest of the boot rather than being
  // swallowed or run against a machine that isn't ready.
  if (laptopBooting) { finishLaptopBoot(null); if (!t) return; }
  // Your own machine does not chime a verdict at you. The obelisk and HERMES
  // answer with a musical yes/no because they are THEIR systems judging your
  // command; the laptop just takes the keystroke and does the work. So: a dry
  // key click on entering a line, and a duller one when the shell has to say no.
  if (laptopMl) {
    if (/^(quit|exit|:q)$/i.test(t)) {
      laptopMl = false;
      mlPending = ''; mlLast = '';
      replPrint('back at the shell.');
      sfx.play('keyclick');
      return;
    }
    // A DECLARATION MAY RUN OVER, in either direction, and this prompt used to
    // take one physical line and no more. Pasting any of the examples in failed
    // on the second line of every clausal function and on every comment written
    // across two lines.
    //
    // Forwards: `fun f x =` cannot have ended, so hold it and take the next
    // line too. Backwards: `| f n = …` cannot have STARTED anything, so it
    // belongs to the declaration above — which has already run, so run it again
    // with this clause attached. Rebinding a name is what the top level does
    // anyway, so the second run simply replaces the first.
    // A BLANK LINE LETS A HELD ONE GO. `(` is unfinished by every test there
    // is, so without this an open bracket takes the rest of the session with
    // it and the only way out is quitting the language. `quit` is checked
    // above, before any of this, for the same reason.
    if (mlPending && !t) {
      mlPending = '';
      obTermPrompt.textContent = laptopPrompt();
      replPrint('(abandoned)');
      sfx.play('keyclick_soft');
      return;
    }
    let source = t;
    if (mlPending) source = `${mlPending} ${t}`;
    else if (continuesPrevious(t) && mlLast) source = `${mlLast} ${t}`;
    if (needsMoreInput(source)) {
      mlPending = source;
      obTermPrompt.textContent = laptopPrompt();
      sfx.play('keyclick');
      return;
    }
    mlPending = '';
    obTermPrompt.textContent = laptopPrompt();
    // Infer BEFORE evaluating, the way a compiler would, and print what it
    // worked out beside the answer, the way this language's own top level does.
    // It reports and does not refuse: a clash is named and the line still runs,
    // because a machine in a ruin should say what it thinks and let you decide.
    const ctx = laptopCtx();
    loadPrelude(ctx);          // List, String, Char, Int, Option — once per session
    const ty = typeReport(source, ctx);
    const r = runRonml(source, ctx);
    mlLast = source;
    sfx.play(r.ok ? 'keyclick' : 'keyclick_soft');
    if (ty && ty.startsWith('TYPE:')) replPrint(ty);
    // Standard ML's top level answers `val it = 7 : int` — the name it bound,
    // the value, and the type. A declaration names itself and already reads
    // that way (`val f = <fn>`), so only a bare expression needs `it` put in
    // front of it. A WARNING rides after the type, as it does at the prompt.
    for (const line of smlEcho(r.text, ty)) replPrint(line);
    return;
  }
  if (/^(exit|logout|halt)$/i.test(t)) { closeObTerminal(); return; }
  // The card's state rides on the shell env so `ifconfig` can flip it; the flip
  // is copied back onto the laptop so the interface stays up across commands
  // (and across closing the lid).
  laptopShell.net = laptopNetState();
  // almanac reads the clock; uucico needs a relay within arm's reach. Both are
  // world facts, refreshed per command so neither can go stale in the hand.
  laptopShell.clock = { hour: dayNight.hour, day: dayNight.day || 0 };
  laptopShell.relay = nearestRelay();
  const r = runUnix(t, laptopShell, { ml: laptopMlHook, netscape: laptopNetscapeHook, ed: laptopEdHook, pico: laptopPicoHook, post: laptopPostHook, pdf: laptopPdfHook, telnet: laptopTelnetHook, book: laptopBookHook, transcribe: laptopTranscribeHook, sleep: laptopSleepHook, suspend: laptopSuspendHook, halt: laptopHaltHook, reboot: laptopRebootHook, save: laptopSaveHook, wifi: laptopWifiHook, sniffer: laptopSnifferHook, more: laptopMoreHook });
  if (player.laptop) player.laptop.netUp = !!(laptopShell.net && laptopShell.net.up);
  sfx.play(r.ok ? 'keyclick' : 'keyclick_soft');
  if (r.text) replPrint(r.text);
}

// The boot. Opening the lid does not drop you at a prompt — the machine has to
// come up first, and watching it come up is half the pleasure of owning one:
// firmware, memory count, the disk spinning up, then the services reporting in.
// The network line FAILS on purpose — the one piece of hardware this laptop has
// not got is the thing that would put it on POSEIDON's wire, and the boot log is
// where you learn that about your own machine.
// Each entry is [text, ms-to-wait-before-the-NEXT-line].
function laptopBootLines(def) {
  const net = laptopNetState();
  const mem = 1024 * (def.ram || 1);
  return [
    ['', 20],
    ['RON/BIOS  v2.41    (c) Reality Or Nothing', 90],
    [`${(def.name || 'Laptop').toUpperCase()}    CPU ${def.cpu || 1}x    ${mem}K`, 70],
    [`Memory test: ${mem}K OK`, 110],
    ['Detecting drives ..... hd0', 90],
    ['Boot block ok. Loading kernel ...', 260],
    ['', 40],
    ['UNIX V7  (RON build)  #7', 80],
    [`real mem  = ${mem}K`, 60],
    [`avail mem = ${Math.round(mem * 0.86)}K`, 130],
    ['', 40],
    ['[  OK  ] Mounted root filesystem', 70],
    ['[  OK  ] Started system logger', 60],
    ['[  OK  ] Set console scheme', 60],
    ['[  OK  ] Started clock daemon', 70],
    // What the boot log says about the network is the most important line on
    // the screen: no card and you are alone with the machine; a card and you are
    // one command away from their whole web — but DOWN until you say otherwise.
    ['[  OK  ] Detected wireless card — wifi0', 80],
    [net.up
      ? `[  OK  ] Interface wifi0 up — ${net.spoof.ip} (identity forged)`
      : '[ ---- ] Interface wifi0 is DOWN     (ifconfig wifi0 up)', 180],
    ['[  OK  ] Reached target Multi-User', 70],
    ['[  OK  ] Started AI-ML runtime', 120],
    ['', 40],
  ];
}
let laptopBooting = false;
let _laptopBootTimer = null;
// What is LEFT of the boot. finishLaptopBoot is supposed to print the rest when
// the sequence is cut short, and every caller was passing null, so a boot
// interrupted by a keystroke (or by the lid being shut and opened) lost the
// lines it had not reached and the machine looked half-started.
let _laptopBootRest = null;

// Print whatever is left of the boot at once and hand over the prompt. Called
// when the sequence finishes, and when you skip it by hitting a key.
function finishLaptopBoot(rest) {
  if (_laptopBootTimer) { clearTimeout(_laptopBootTimer); _laptopBootTimer = null; }
  laptopBooting = false;
  const left = rest || _laptopBootRest;
  _laptopBootRest = null;
  if (left && left.length) replPrint(...left.map((l) => l[0]));
  replPrint(
    'This machine is yours. try: ls · cat readme · ml · pico · save · help',
    '',
  );
  sfx.play('keyclick');   // the machine is up — a click, not the AI's chime
  obTermPrompt.textContent = laptopPrompt();
  obTermInput.focus();
}

// ---- The NostBook remembers ------------------------------------------------
// Shutting the lid is not a reboot. Everything that makes up a session — where
// you were in the filesystem, what is on the screen, your command history, the
// ML bindings you built up, a half-finished `ed` buffer, the browser and its
// back stack, even the half-typed line — is parked on the machine itself
// (player.laptop.state) and put back exactly when you open it again. The
// alternative is a machine that forgets everything the moment you look away,
// which is not how a laptop behaves and would make long work at it unbearable.
function saveLaptopState() {
  if (terminalKind !== 'laptop' || !player.laptop) return;
  player.laptop.state = {
    cwd: laptopShell ? laptopShell.cwd.slice() : ['home'],
    log: replLog.slice(),
    history: replHistory.slice(),
    typed: obTermInput.value || '',
    ml: laptopMl,
    // FLATTENED. A top-level rebinding pushes a new frame on a prototype
    // chain (see interp.js), and JSON keeps own properties only, so saving the
    // raw object would silently drop every binding made after a name was
    // reused. Closures do not survive the save either way.
    session: flattenSession(laptopSession),
    ed: edState,
    web: web ? { view: web.view, history: web.history.slice(), fwd: web.fwd.slice() } : null,
    // An open editor is part of where you were, and losing an unsaved buffer
    // because you looked up from the machine would be unforgivable.
    pico: pico ? { name: pico.name, saved: pico.saved, text: picoTextEl.value, cut: pico.cut.slice() } : null,
  };
}

// Put a saved session back on screen. Returns false if there is nothing to
// resume, in which case the caller runs the boot sequence instead.
function restoreLaptopState() {
  const st = player.laptop && player.laptop.state;
  if (!st) return false;
  laptopShell.cwd = Array.isArray(st.cwd) ? st.cwd.slice() : ['home'];
  replLog = Array.isArray(st.log) ? st.log.slice() : [];
  replHistory = Array.isArray(st.history) ? st.history.slice() : [];
  replHistoryIdx = replHistory.length;
  laptopMl = !!st.ml;
  laptopSession = st.session || {};
  edState = st.ed || null;
  obTermScreen.textContent = replLog.join('\n');
  obTermScreen.scrollTop = obTermScreen.scrollHeight;
  obTermInput.value = st.typed || '';
  obTermPrompt.textContent = laptopPrompt();
  obTermInput.focus();
  if (st.pico) {
    openPico(st.pico.name);
    if (pico) { pico.saved = st.pico.saved; pico.cut = st.pico.cut || []; }
    picoTextEl.value = st.pico.text;
    picoTitle();
  }
  if (st.web && st.web.view) {
    // The browser was up when you shut the lid, so it is up now, on the same
    // page — re-fetched rather than restored from the old HTML, since the
    // machines it is reporting on have been getting on with things meanwhile.
    web = { view: st.web.view, history: st.web.history || [], fwd: st.web.fwd || [], html: '' };
    nsEl.style.display = 'flex';
    nsRender();
    nsUrlEl.blur();
  }
  return true;
}

function openLaptop() {
  if (player.isSwine()) { player.say('Hooves on a keyboard. Find moly first.'); return; }
  if (!player.laptop) {
    player.say(player.hasItem('laptop_broken')
      ? 'The NostBook you are carrying is dead. Its board is burnt through — solder circuit boards into it (C).'
      : 'You have no NostBook. There are dead machines all over this world, and the disks in them survived.');
    return;
  }
  const def = ITEMS[player.laptop.model] || {};
  if (!player.laptop.fs) player.laptop.fs = makeDisk();
  // A disk saved before the system tree existed gets it added now. Only what is
  // missing: their own files in /home are theirs.
  graftSystemDirs(player.laptop.fs);
  laptopShell = newShell(player.laptop.fs);
  laptopShell.net = laptopNetState();
  laptopMl = false;
  web = null;
  laptopSession = {};
  mlPending = ""; mlLast = "";   // a held declaration does not survive the machine going down
  terminalKind = 'laptop';
  terminalOb = null;
  setTerminalTheme('#cfe6d8');     // its own pale phosphor: not the AI's green, not RON's amber
  obTermEl.classList.remove('hermes');
  obTermEl.classList.add('nostbook');   // beige lid and badge, like Netscape and pico wear
  obTermEl.style.display = 'flex';
  fitTerminalColumns();
  obTermScreen.parentElement.style.display = 'flex';
  obTermConnect.style.display = 'none';
  replLog = [];
  replHistory = [];
  replHistoryIdx = -1;
  obTermInput.value = '';
  obTermGhost.textContent = '';
  obTermPrompt.textContent = '';        // no prompt until it has finished coming up
  obTermInput.focus();
  // A machine that was only shut, not shut down, comes straight back up where
  // it was. No boot sequence, because it never went off.
  if (restoreLaptopState()) {
    player.say('You open the NostBook. It is where you left it.');
    return;
  }
  player.say('You open the NostBook. No aerial, no link, nobody watching: just a machine.');
  runLaptopBoot(def);
}

// Roll the boot out line by line. Any keypress skips to the prompt (replRun),
// so it is a pleasure the first time and never a toll after that. Extracted
// from openLaptop when `reboot` arrived and needed the same sequence: a power
// cycle that did not show you the machine coming up would not be one.
function runLaptopBoot(def) {
  const lines = laptopBootLines(def);
  laptopBooting = true;
  let i = 0;
  _laptopBootRest = lines.slice();
  const step = () => {
    _laptopBootTimer = null;
    // The lid was shut mid-boot. Nothing to print to, so stop — but drop the
    // remainder too, or the next open would replay it on top of a fresh boot.
    if (!laptopBooting || terminalKind !== 'laptop' || obTermEl.style.display === 'none') {
      _laptopBootRest = null;
      return;
    }
    if (i >= lines.length) { finishLaptopBoot(null); return; }
    const [text, wait] = lines[i++];
    _laptopBootRest = lines.slice(i);
    replPrint(text);
    _laptopBootTimer = setTimeout(step, wait);
  };
  step();
}

function closeObTerminal() { saveLaptopState(); telnetTo = null; if (nsEl) nsEl.style.display = 'none'; if (picoEl) { picoEl.style.display = 'none'; pico = null; } if (pdfEl && pdfEl.style.display === 'flex') closePdf(); elizaBot = null; web = null; edState = null; laptopMl = false; laptopShell = null; laptopBooting = false; _laptopBootRest = null; if (_laptopBootTimer) { clearTimeout(_laptopBootTimer); _laptopBootTimer = null; } terminalKind = 'ob'; terminalOb = null; replSession = {}; setTerminalTheme(null); obTermEl.classList.remove('hermes'); obTermEl.classList.remove('nostbook'); obTermEl.style.display = 'none'; obTermGhost.textContent = ''; obTermPrompt.textContent = '>'; obTermInput.blur(); player.terminalSafe = false; }
// Click-away closes it. With the NostBook chassis in the way, "outside" now
// includes the beige furniture itself — the lid, the deck, the badge — because
// those are the machine's body, not its screen, and a click on them plainly
// means "I am done with this", not "swallow my click".
const CHASSIS_PARTS = ['lap', 'lap-lid', 'lap-base', 'lap-brand'];
obTermEl.addEventListener('click', (e) => {
  const t = e.target;
  if (t === obTermEl || CHASSIS_PARTS.some((c) => t.classList && t.classList.contains(c))) closeObTerminal();
});
// Autocomplete: once you've read the RON-DOS manual (book_ronml), the console
// suggests the rest of a verb as faded ghost text you can accept with Tab.
// (sing stays out of the list — it's a secret.) Purely a convenience the book
// unlocks; you can always type the whole thing by hand.
// Autocomplete is per-system: an obelisk (TIRESIAS) suggests only AI-network
// verbs, a HERMES relay only RON verbs — no seepage between the two. (sing is
// secret, so it's in neither list.)
const OB_COMPLETE = ['scan', 'nearest', 'keys', 'name', 'hack', 'crash', 'loop', 'sleep', 'rewind', 'repel', 'map', 'print', 'copy', 'cd', 'ls', 'drives', 'decrypt', 'unlock', 'eliza', 'retire', 'help', 'let'];
const HERMES_COMPLETE = ['read', 'print', 'archive', 'records', 'drive', 'drives', 'backup', 'restore', 'forge', 'copy', 'cd', 'ls', 'help', 'let'];
const escapeHtml = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const CORE_COMPLETE = ['look', 'scan', 'run', 'jam', 'open', 'help', 'exit'];
// The laptop's shell (game/unix.js), plus `ml` — its own commands, not the AI's.
const LAPTOP_COMPLETE = ['ls', 'cd', 'pwd', 'cat', 'echo', 'man', 'mkdir', 'rm', 'cp', 'mv', 'grep', 'wc', 'head', 'sh', 'uname', 'help', 'ml', 'ed', 'ifconfig', 'ping', 'netscape', 'exit'];
function ronmlCompletion(value) {
  if (elizaBot) return ''; // no AI-ML hints mid-conversation with the DOCTOR
  if (terminalKind === 'core') {
    // A core console takes a tiny bespoke set (coreRun), not the AI-ML verbs,
    // and needs no manual: it is a conversation, not a console language.
    const mc = value.match(/([A-Za-z]+)$/);
    if (!mc) return '';
    const hitc = CORE_COMPLETE.find((v) => v.length > mc[1].length && v.startsWith(mc[1]));
    return hitc ? hitc.slice(mc[1].length) : '';
  }
  // The laptop is its own machine: a UNIX shell, not the AI-network console — so
  // it completes its OWN commands, and needs no manual to do it (it is your
  // machine, and the manual for it is on the disk: `man ls`).
  if (terminalKind === 'laptop') {
    const ml = value.match(/([A-Za-z]+)$/);
    if (!ml) return '';
    const hitl = LAPTOP_COMPLETE.find((v) => v.length > ml[1].length && v.startsWith(ml[1]));
    return hitl ? hitl.slice(ml[1].length) : '';
  }
  if (!player.readManuals || !player.readManuals.has('book_ronml')) return '';
  const m = value.match(/([A-Za-z]+)$/); // the alphabetic token at the caret
  if (!m) return '';
  const tok = m[1];
  const verbs = terminalKind === 'hermes' ? HERMES_COMPLETE : OB_COMPLETE;
  const hit = verbs.find((v) => v.length > tok.length && v.startsWith(tok));
  return hit ? hit.slice(tok.length) : '';
}
function updateGhost() {
  const suffix = ronmlCompletion(obTermInput.value);
  if (!suffix) { obTermGhost.textContent = ''; return; }
  obTermGhost.style.left = obTermInput.offsetLeft + 'px';
  obTermGhost.innerHTML = `<span class="typed">${escapeHtml(obTermInput.value)}</span>${escapeHtml(suffix)}`;
}
obTermInput.addEventListener('input', updateGhost);
// Paste: a single-line paste inserts normally, but a MULTI-line paste (e.g. the
// four-line fortress program copied from the help or a lore scrap) can't sit in a
// one-line <input> — it would silently drop every line but the first. So run it as
// a program: split on newlines and feed each line to the REPL in order, stripping a
// leading `> ` prompt in case the lines were copied straight off the screen.
obTermInput.addEventListener('paste', (e) => {
  const text = (e.clipboardData || window.clipboardData || {}).getData
    ? (e.clipboardData || window.clipboardData).getData('text') : '';
  if (!text || !/[\r\n]/.test(text)) return; // single line: let it paste natively
  e.preventDefault();
  obTermInput.value = '';
  obTermGhost.textContent = '';
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^\s*>\s?/, '').trim();
    if (line) replRun(line);
  }
});
obTermInput.addEventListener('keydown', (e) => {
  // A pager takes the keyboard while it holds the screen: SPACE and q act on
  // the key, with no RETURN after them, because that is what more does and a
  // pager you have to press RETURN twice for is not one.
  if (moreState && moreKey(e.key)) {
    e.preventDefault();
    obTermInput.value = '';
    return;
  }
  // The laptop has a KEYBOARD, so typing on it ticks. Only at the laptop: the
  // obelisk and HERMES are the machines' consoles and keep their own voices.
  // Printable keys and backspace only, so arrows and modifiers stay silent.
  if (terminalKind === 'laptop' && !e.ctrlKey && !e.metaKey && !e.altKey
      && (e.key.length === 1 || e.key === 'Backspace')) {
    sfx.play('keytype');
  }
  // Ctrl+C breaks out of an ELIZA session, as on a real terminal — back to the
  // RON-DOS prompt without closing the whole console. But if text is selected
  // anywhere, Ctrl+C means COPY — let the browser have it (matters on
  // Windows/Linux, where copy is Ctrl+C; Mac's Cmd+C never hits this branch).
  if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
    const screenSel = String(window.getSelection() || '');
    const inputSel = obTermInput.selectionStart !== obTermInput.selectionEnd;
    if (screenSel || inputSel) return; // native copy
    if (elizaBot) { obTermInput.value = ''; obTermGhost.textContent = ''; stopEliza('^C  —  ELIZA interrupted. Back at the RON-DOS prompt.'); }
    // ^C in ed: out of input mode, or out of ed altogether. Real ed ignores it;
    // real ed also has a real terminal behind it and a way to kill the process.
    // Here it is the only interrupt there is, so it has to work.
    else if (edState) {
      obTermInput.value = ''; obTermGhost.textContent = '';
      if (edState.ins != null) { edState.ins = null; replPrint('^C  —  out of input mode.'); }
      else {
        const dirty = edState.dirty;
        edState = null;
        replPrint(`^C  —  out of ed.${dirty ? ' Unsaved changes were left behind.' : ''}`, '');
      }
      obTermPrompt.textContent = laptopPrompt();
    }
    e.preventDefault(); e.stopPropagation();
    return;
  }
  // Tab is a browser-reserved key in a lot of setups (it moves focus off the
  // page before our handler ever sees it, preventDefault or not) — so Right
  // Arrow at the very end of the line also accepts the ghost suggestion, a
  // reliable fallback that never conflicts with normal caret movement.
  if (e.key === 'Tab' || (e.key === 'ArrowRight' && obTermInput.selectionStart === obTermInput.value.length
    && obTermInput.selectionEnd === obTermInput.value.length)) {
    const suffix = ronmlCompletion(obTermInput.value);
    if (suffix) { obTermInput.value += suffix; updateGhost(); e.preventDefault(); e.stopPropagation(); }
    else if (e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); }
    return;
  }
  if (e.key === 'Enter') {
    const line = obTermInput.value.trim();
    obTermInput.value = '';
    obTermGhost.textContent = '';
    if (line) replRun(line);
  } else if (e.key === 'ArrowUp') {
    if (replHistory.length) {
      replHistoryIdx = Math.max(0, replHistoryIdx - 1);
      obTermInput.value = replHistory[replHistoryIdx] || '';
    }
    updateGhost();
    e.preventDefault();
  } else if (e.key === 'ArrowDown') {
    if (replHistory.length) {
      replHistoryIdx = Math.min(replHistory.length, replHistoryIdx + 1);
      obTermInput.value = replHistory[replHistoryIdx] || '';
    }
    updateGhost();
    e.preventDefault();
  }
  e.stopPropagation();
});

// Copy and paste, like a real terminal. The screen is selectable (CSS
// user-select), so select + Cmd/Ctrl+C copies natively. Pasting lands on the
// prompt from anywhere in the console — even with focus on the screen —
// with newlines flattened to spaces so a multi-line paste never auto-runs.
// Paste anywhere on the console and it lands on the command line, so you do not
// have to aim at a one-line input. The guard matters more than the feature:
// anything that can be typed into does its own pasting.
window.addEventListener('paste', (e) => {
  if (obTermEl.style.display === 'none') return;
  // Guarding on obTermInput alone was wrong once pico, Netscape and the PDF
  // reader began rendering INSIDE the NostBook chassis: the terminal is still
  // displayed behind them, so every paste into the EDITOR was being scraped
  // into the command line and the focus went with it. You could not paste into
  // the editor you edit programs in.
  if (handlesOwnPaste(document.activeElement)) return;
  const text = (e.clipboardData || window.clipboardData)?.getData('text') || '';
  if (!text) return;
  obTermInput.value += text.replace(/\s+$/, '').replace(/\n+/g, ' ');
  obTermInput.focus();
  updateGhost();
  e.preventDefault();
});
// A click on the console that ISN'T a text selection puts the caret back on
// the prompt, so you can select-to-copy without losing your typing flow.
obTermEl.addEventListener('mouseup', () => {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) obTermInput.focus();
});

// The AI's own console (no chip): a wall of restless, unreadable data.
const AIOS_GLYPHS = '0123456789ABCDEF▒▓█░■▢≡§¤◢◣∴∷';
let aiosRAF = null;
function openAiOs(ob) {
  aiosHeader.textContent = `POSEIDON CORE  //  NODE ${ob.code || '????'}  //  ACCESS DENIED  //  NO KEY`;
  aiosEl.style.display = 'flex';
  player.say('No chip. The obelisk throws up the AI’s own console instead — a wall of moving data you can’t read.');
  const cols = 60, rows = 26;
  const t0 = performance.now();
  const frame = (now) => {
    if (aiosEl.style.display === 'none') { aiosRAF = null; return; }
    const phase = (now - t0) / 1000;
    let out = '';
    for (let r = 0; r < rows; r++) {
      let line = '';
      for (let cX = 0; cX < cols; cX++) {
        const wave = Math.abs(Math.sin(r * 0.7 + cX * 0.35 + phase * 2.5));
        const n = Math.floor((wave * AIOS_GLYPHS.length + Math.random() * 4)) % AIOS_GLYPHS.length;
        line += (Math.random() < 0.06) ? ' ' : AIOS_GLYPHS[n];
      }
      out += line + '\n';
    }
    aiosScreen.textContent = out;
    aiosRAF = requestAnimationFrame(frame);
  };
  aiosRAF = requestAnimationFrame(frame);
}
function closeAiOs() { aiosEl.style.display = 'none'; if (aiosRAF) cancelAnimationFrame(aiosRAF); aiosRAF = null; }
aiosEl.addEventListener('click', (e) => { if (e.target === aiosEl) closeAiOs(); });

// The control hint is only for new players: fade it out after two minutes
// of play so it stops cluttering the screen once the controls have sunk in.
const hintEl = document.getElementById('hint');
// On a phone/touch device there's no H key, so drop "Press H for help" — spell
// out the tap controls instead (help is still reachable via the ? button).
const touchLike = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
  || Math.min(window.innerWidth, window.innerHeight) < 560;
if (touchLike) {
  hintEl.textContent = 'Hold to move · tap to act · \u00bb run · \u25b2 jump · ? for help';
}
// How long "Press H for help" hangs about. It only ever needs to be read once,
// and it sits over the bottom-right of the play area where it fouls the
// Scrapbook and the SMS toast, so it goes early and — once gone — stays gone
// (hintDone, or endDrive's restore would flick it back afterwards).
const HINT_LIFETIME = 40; // seconds of played time
let playTime = 0;
let hintDone = false;

// Backpack view: I toggles the full panel (drawn by the renderer), which
// exposes the backpack's own storage/weapon slots for dragging — the
// dashboard's pockets and hands slot are always draggable, panel or not
// (see the drag/drop handling below).
let showBackpack = false;
// The panel-button row can be put away; that choice outlives the run, because
// a player who dismissed it does not want it back every time they load.
let hudMenuOpen = (() => {
  try { return localStorage.getItem('nostos-hudmenu') !== 'off'; } catch { return true; }
})();
// Hidden, the row is brought back by the key and nothing else on a keyboard,
// so say the key on the way out rather than leaving the player to find it.
function toggleHudMenu() {
  hudMenuOpen = !hudMenuOpen;
  try { localStorage.setItem('nostos-hudmenu', hudMenuOpen ? 'on' : 'off'); } catch { /* storage blocked */ }
  player.say(hudMenuOpen ? 'Panel buttons on.' : 'Panel buttons off — press 0 for them.');
}
let showSkills = false;
let showWeapons = false;
let paused = false;  // P: freezes movement, AI, clocks, and timers
let sleepCooldown = 0; // B: real-seconds before another rest is allowed
let resting = null;  // B rest animation in progress: { t } real-seconds elapsed
const SLEEP_MINUTES = 10;   // game-clock minutes skipped per rest
const SLEEP_HEAL = 35;      // health restored per rest
const SLEEP_COOLDOWN_S = 90; // real seconds before resting again
const SLEEP_SAFE_RANGE = 12; // no hostile robot allowed within this many tiles
const REST_DURATION = 4.6;  // real seconds the rest animation runs
const REST_CLOCK_MULT = 5;  // the clock visibly spins this much faster while resting
// Screen-dim envelope over a rest: fade in over the first fifth, hold, fade
// back out over the last fifth, peaking at a soft 0.72 (never full black).
const restDim = (t) => {
  const p = Math.max(0, Math.min(1, t / REST_DURATION));
  const env = p < 0.2 ? p / 0.2 : p > 0.8 ? (1 - p) / 0.2 : 1;
  return 0.72 * env;
};
// How long (real seconds) a dropped item survives on the ground before it
// decays, keyed by item. Perishables rot fast; common salvage lingers a bit;
// prizes stay a long while. Anything not listed falls back to a per-kind
// default in groundLifetime(). Real time: a full day is 480s (~20s per game
// hour), so 100s ≈ 5 game hours.
const GROUND_ITEM_FADE = 8; // seconds of fade/flicker before an item vanishes
const GROUND_LIFETIME = {
  // Machines never rot: a NostBook you put down to fight is not a timer puzzle,
  // and a dead one carries somebody's files, which exist nowhere else.
  laptop: Infinity, laptop_broken: Infinity, dead_laptop: Infinity,
  meat: 40, berries: 55, wood: 90,
  scrap: 100, chip_fragment: 110,
  tin: 150, ammo: 150, shells: 150, arrow: 150,
  battery: 190,
  chip: 320, printed_map: 260, obgun: 360,
  // Things that never decay: a backpack is too valuable to lose to a timer,
  // and the progression-critical uniques (the only Wi-Fi block, the AI key
  // which can't be remade, and the numbered circuit boards whose towers are
  // already felled) would soft-lock the OB_gun / wave-gun paths if they went.
  backpack: Infinity, wifiblock: Infinity, ai_key: Infinity, circuit: Infinity,
  // THE GREEK SHIP'S THREE PARTS belong on this list and were not on it. They
  // do not look like anything — a rope, an oar, a piece of sailcloth — so a
  // player finds them early, decides they are junk, drops them, and they rot
  // where they lie. There is no other way off Ogygia, and no way to make
  // another. Watched happening.
  oar: Infinity, rope: Infinity, sail: Infinity,
};
const GROUND_LIFETIME_DEFAULT = 160; // materials/consumables not listed above
// Held gear left on the ground (weapons, tools, gadgets, shields, bombs, the
// compass) lingers longest — you might mean to come back for it.
const GROUND_GEAR_KINDS = new Set(['tool', 'gun', 'gadget', 'bomb', 'shield', 'forcefield', 'compass', 'map']);
function groundLifetime(item) {
  if (item in GROUND_LIFETIME) return GROUND_LIFETIME[item];
  const kind = ITEMS[item] && ITEMS[item].kind;
  if (GROUND_GEAR_KINDS.has(kind)) return 320;
  return GROUND_LIFETIME_DEFAULT;
}

let toast = null;    // now-playing liner notes {text, ttl}, above the dashboard
let detail = null;   // right-click inspection tooltip {text, x, y, ttl}
// Hovering a HUD slot (pockets, hands, backpack panel, walkman) names what's
// in it, reusing the right-click tooltip's renderer. Right-click detail and
// an in-progress drag both win over the hover.
// Manage mode: while the backpack panel is open, a tap on any slot MOVES its
// item instead of using it — the one-rule mobile swap. Pockets, hands, and
// the spare sleeve stow into the pack; pack items come out to a free pocket
// (or the hand, if it's holdable and free); tapes prefer an empty walkman;
// tapping the walkman ejects. moveItem does all the validating and saying.
function smartMoveSlot(from) {
  const held = player.getSlot(from);
  if (!held) { player.equipSlot(from); return; }
  const def = ITEMS[held.item];
  const freePocket = () => { const i = player.pockets.findIndex((ps) => !ps); return i >= 0 ? { kind: 'pocket', i } : null; };
  if (from.kind === 'walkman') { player.moveItem(from, freePocket() || { kind: 'packbadge' }); return; }
  if (def && def.kind === 'tape' && !player.walkman) { player.moveItem(from, { kind: 'walkman' }); return; }
  if (from.kind === 'pocket' || from.kind === 'hands' || from.kind === 'bw') { player.moveItem(from, { kind: 'packbadge' }); return; }
  // out of the pack: a free pocket first, else offer the hand (moveItem
  // politely refuses non-holdables there)
  const t = freePocket();
  player.moveItem(from, t || { kind: 'hands' });
}

function hoverSlotTip() {
  try {
  // No pointer, no hover. A tap on a touch screen leaves the last coordinates
  // behind, so the tooltip for whatever was tapped stayed on screen — over the
  // panel that tap had just opened.
  if (drag || touchLike) return null;
  // The panel buttons first: they sit in the dashboard like the slots do, and
  // a glyph ("]", "\u21e7N") is no use unless hovering says what it opens.
  const hb = renderer.hudButtonAt && renderer.hudButtonAt(input.mouseX, input.mouseY);
  if (hb) return { text: hb.name, sub: hb.sub, x: input.mouseX, y: input.mouseY };
  if (!renderer.slotAt) return null;
  const hs = renderer.slotAt(input.mouseX, input.mouseY);
  if (!hs) return null;
  if (hs.kind === 'packbadge') return player.backpack ? { text: 'Backpack — press I to open', x: input.mouseX, y: input.mouseY } : null;
  const held = player.getSlot(hs);
  if (!held || !ITEMS[held.item]) return null;
  const def = ITEMS[held.item];
  const qty = held.qty > 1 ? ` \u00d7${held.qty}` : '';
  // The NAME, then what it is FOR. Naming alone tells a player who has never
  // met a bluebox nothing at all, and the opaque things are exactly the ones
  // worth carrying. `use` lives beside the definition in items.js and is
  // optional, so it can be filled in for what needs it and left off the rest.
  // `sub` rather than a second line of `text`: the purpose is set smaller and
  // in italic, so the renderer has to know which part is which. The right-click
  // inspector passes no `sub` and is unchanged.
  return { text: def.name + qty, sub: def.use || '', x: input.mouseX, y: input.mouseY };
  } catch { return null; } // a tooltip must never be able to kill the HUD
}
let drag = null;     // in-progress pointer drag {from: slotDescriptor}
const PROJECTILE_SPEED = 16; // tiles/sec for gun tracers
const TORPOR_BOLT_HIT_R = 0.85; // depart mode (R3): how close to the bolt's aim point you must still be for it to detain — step outside and you dodge

// When an obelisk falls, a fresh Wi-Fi block (consumed to craft the OB_gun)
// respawns somewhere random in the ruins so the loop can continue.
const boardTiles = [];
for (let by = 0; by < map.h; by++) for (let bx = 0; bx < map.w; bx++) if (map.floorAt(bx, by) === 'boards') boardTiles.push([bx, by]);
player.onObeliskDestroyed = (ob) => {
  if (boardTiles.length) {
    const [bx, by] = boardTiles[Math.floor(Math.random() * boardTiles.length)];
    map.groundItems.push({ item: 'wifiblock', qty: 1, power: 600, x: bx + 0.5, y: by + 0.5 });
  }
  // A revenge squad is dispatched the instant a tower falls — from the
  // W-factory itself, where W1s are actually built, not from the crater.
  if (ob) {
    const squadSeed = ((ob.x * 92821 + ob.y * 1237 + Math.floor(Math.random() * 1e6)) >>> 0) || 1;
    const originX = factoryLive() ? factoryCx() : ob.x + 0.5;
    const originY = factoryLive() ? factoryCy() : ob.y + 0.5;
    const squad = spawnW1s(map, squadSeed, originX, originY, 2 + Math.floor(Math.random() * 3));
    if (squad.length) {
      currentWorld.robots.push(...squad);
      player.say(`The W-factory dispatches a revenge squad: ${squad.length} W1 hunter${squad.length > 1 ? 's' : ''}, already coming for you.`);
    }
  }
  // Victory: every obelisk toppled at once.
  if (currentWorld.obeliskObjs.every((o) => o.destroyed) && !player._ended) {
    player._ended = true;
    player.addScore(100);
    player.deathCert = { name: player.name, gender: player.gender, cause: 'nothing — you won', score: player.score, skills: [...player.skills], deaths: player.deaths || 0, victory: true };
    persist();
    return;
  }
  // Not the winning blow, but if POSEIDON is already blazing, felling a tower
  // breaks the laser web and shuts the purge down — a hard-won reprieve. The
  // obelisk is flagged for rebuild; the factory rushes a repair drone to it,
  // and only once it's raised again (nothing left flagged) does POSEIDON come
  // back online (see the activation guard below). Knock towers down faster
  // than they can be rebuilt and you can still win outright during the purge.
  if (player.skylinkActive && ob) {
    player.skylinkActive = false;
    ob.needsRebuild = true;
    player.say('The tower comes down and the POSEIDON web collapses — dark, for now. A repair drone is already inbound to raise it.');
    if (factoryLive() && !currentWorld.robots.some((r) => r.type === 'w3' && !r.dead)) {
      const drone = spawnW3(map, Math.floor(Math.random() * 0x7fffffff), factoryCx(), factoryCy());
      if (drone) currentWorld.robots.push(drone);
    }
  }
};

// Attacking an obelisk reports up the network at once: the W-factory answers
// by dispatching a laser-armed W4 after you. Throttled so a burst of five
// hits (one obelisk) or rapid OB_gun fire can't spam a whole squadron.
let wFactoryW4Cooldown = 0;
player.onObeliskAttacked = () => {
  if (!factoryLive() || wFactoryW4Cooldown > 0) return;
  wFactoryW4Cooldown = 25;
  const w4 = spawnW4(map, Math.floor(Math.random() * 0x7fffffff), factoryCx(), factoryCy());
  if (w4) {
    currentWorld.robots.push(w4);
    player.say('A W4 hunter-killer streaks out of the W-factory, lasers charging.');
  }
};

// Grass seed: the player sowing one blighted tile back to life. Felling a tower
// only freezes its front now — this (and the W5 gardener) is how the ground
// actually comes back, one deliberate square at a time. Refuses on living ground,
// and refuses in front of a LIVE tower (it would just take the tile again).
player.onPlantSeed = (tx, ty) => {
  if (!map.inBounds(tx, ty)) return;
  const f = map.floorAt(tx, ty);
  if (f !== 'blight' && f !== 'blight_sick') {
    player.say('Grass seed is for the dead ground — face a blighted square to sow it.');
    return;
  }
  const obs = currentWorld.obeliskObjs || [];
  if (tileBlighted(tx, ty, obs.filter(obeliskLive))) {
    player.say('A tower still stands over this ground — it will only take it back. Fell or jam it first.');
    return;
  }
  if (!healBlightTile(tx, ty)) return;
  // Spend the held seed; if more remain in a pocket, ready another so the player
  // can keep sowing without re-selecting between every square.
  if (player.hands === 'grass_seed') player.hands = null;
  else player.removeItem('grass_seed');
  if (!player.hands) {
    const ps = player.pockets.find((s) => s && s.item === 'grass_seed');
    if (ps) { player.hands = 'grass_seed'; ps.qty -= 1; if (ps.qty <= 0) player.pockets[player.pockets.indexOf(ps)] = null; }
  }
  player.say('You work a pinch of seed into the dead ground. Green will come back to this square.');
};

// Restore one blighted tile to what it was, revive its tree, and mark it healed
// so a frozen (felled/jammed) front can never re-blight it. Shared by grass seed
// and the W5 gardener. Returns false if the tile was not actually blighted.
function healBlightTile(tx, ty) {
  const idx = ty * map.w + tx;
  if (!map.blightIdx || !map.blightIdx.has(idx)) return false;
  if (!map.blightHealed) map.blightHealed = new Set();
  map.blightHealed.add(idx);
  map.floor[idx] = (map.blightOrig && map.blightOrig.get(idx)) || 'grass';
  if (map.blightOrig) map.blightOrig.delete(idx);
  map.blightIdx.delete(idx);
  const t = map.objectGrid[idx];
  if (t && t.type === 'tree') t.dead = false;
  return true;
}

// Right-click inspection: describe whatever occupies a tile. Cars get an
// invented make and model (deterministic from their hue), stone an age from
// its decay, and so on — flavour, drawn from the world's own data.
const CAR_MAKES = ['Vauxhall', 'Ford', 'Rover', 'Austin', 'Morris', 'Talbot', 'Hillman', 'Reliant'];
const CAR_MODELS = ['Cavalier', 'Cortina', 'Metro', 'Allegro', 'Marina', 'Sunbeam', 'Avenger', 'Robin'];
function describeAt(tx, ty) {
  if (!map.inBounds(tx, ty)) return 'The edge of the world.';
  const obj = map.objectAt(tx, ty);
  if (obj) {
    if (obj.type === 'car') {
      const mk = CAR_MAKES[Math.floor((obj.hue ?? 0) * CAR_MAKES.length) % CAR_MAKES.length];
      const md = CAR_MODELS[Math.floor(((obj.hue ?? 0) * 7.3) % 1 * CAR_MODELS.length)];
      const year = 1978 + Math.floor((obj.hue ?? 0) * 22);
      return `${year} ${mk} ${md}. ${obj.smashed ? 'Stripped and gutted.' : 'Dead where it stalled — worth breaking open.'}`;
    }
    if (obj.type === 'wall') {
      const ages = ['newly built', 'weathered, a few years old', 'old, a decade or more', 'mossed over, long abandoned', 'crumbling, half-collapsed', 'a ruin, barely standing'];
      const mat = obj.material === 'brick' ? 'Red-brick wall' : 'Stone wall';
      // Buildings have a KIND now (buildings.js). Say it: a wall you can name
      // the purpose of is a place rather than an obstacle, and it is how a
      // player learns that the ironmonger is worth walking to.
      const b = map.buildingAt(tx, ty);
      const of = b ? ` of ${buildingName(b.type).toLowerCase()}` : '';
      return `${mat}${of}, ${ages[Math.min(5, obj.decay || 0)]}.`;
    }
    if (obj.type === 'obelisk') {
      if (obj.cls === 'siren') return `A SIREN-class obelisk. Teal-lit, and it sings — the song pulls you in. ${obj.alert > 0.3 ? 'It has you.' : 'Keep a tape ready.'}`;
      return `An AI signal obelisk. Black, humming, ${obj.alert > 0.3 ? 'and it has seen you.' : 'watching.'}`;
    }
    if (obj.type === 'tor') return `A HERMES relay — decentralised RON tech, ${obj.code || 'a hilltop station'}, off the machines' grid. Friendly. Click its amber screen (archive, read, make).`;
    if (obj.type === 'wfactory') return 'The W-factory. It fields repair drones for damaged towers — bring one down for good before it can be mended.';
    if (obj.type === 'box') return obj.opened ? 'An emptied resistance cache.' : 'A resistance cache. Search it (E).';
    if (obj.type === 'tree') return 'A tree. Fell it for wood.';
    if (obj.type === 'rock') return 'A weathered boulder.';
    if (obj.type === 'rubble') return 'Rubble from a fallen wall.';
  }
  const f = map.floorAt(tx, ty);
  const h = map.heightAt ? map.heightAt(tx, ty) : 0;
  const names = { grass: 'Overgrown grass', tallgrass: 'Tall grass — snakes hide here', road: 'Cracked tarmac road',
    boards: 'Bare floorboards', dirt: 'Worn dirt', sand: 'River sand', water: 'Deep water — you can swim it',
    stream: 'A shallow stream', bridge: 'A timber bridge', tallgrass2: '' };
  let s = names[f] || f || 'Nothing here.';
  // Inside a building, the floor is the least interesting thing about the tile.
  // What the room WAS is the useful fact, and now there is somewhere to read it.
  const inside = f === 'boards' ? map.buildingAt(tx, ty) : null;
  if (inside) s = `${names[f]}. You are standing in ${buildingLook(inside.type)}.`;
  if (h > 0) s += ` Raised ground (${h} up).`;
  else if (h < 0) s += ` A trench (${-h} down).`;
  return s;
}

let wasNight = null;
let wasDusk = null;
let wasRobotNear = false;
let regrowClock = 0;
let ronResupplyClock = 0, ronResupplyNext = 90 + Math.random() * 60;
let wFactoryClock = 0, wFactoryNext = 6 + Math.random() * 5; // repair-drone dispatch: a short clock so one actually comes while a tower is still damaged/frozen (see below)
let wFactoryW1Clock = 0, wFactoryW1Next = 100 + Math.random() * 80;
let wFactoryW5Clock = 0, wFactoryW5Next = 30 + Math.random() * 40;
let wFactoryGuardClock = 0, wFactoryGuardNext = 40 + Math.random() * 40;
let lastW4GameHour = dayNight.totalHours; // ticks a W4 every 30 game-minutes, not real time

// POSEIDON's final purge: once the clock runs out, every obelisk lights up
// and the AI throws everything it has left at you, without end — you keep
// playing until it finally hunts you down (or forever, if you're good).
const SKYLINK_MAX_W4 = 50; // concurrent cap, so a long purge can't melt the frame rate
let skylinkW4Clock = 0;
function dispatchSkylinkW4s(n) {
  const towers = currentWorld.obeliskObjs.filter((o) => !o.destroyed);
  for (let i = 0; i < n; i++) {
    const src = towers.length ? towers[Math.floor(Math.random() * towers.length)] : (factoryLive() ? { x: factoryCx() - 0.5, y: factoryCy() - 0.5 } : null);
    const ox = src ? src.x + 0.5 : player.x, oy = src ? src.y + 0.5 : player.y;
    const w4 = spawnW4(map, Math.floor(Math.random() * 0x7fffffff), ox, oy);
    if (w4) currentWorld.robots.push(w4);
  }
}

// POSEIDON's blight (game/blight.js): the living ground converted to standing
// reserve, spreading outward from each live obelisk once the network wakes, and
// recovering around each tower you fell or jam. Applied to the floor grid here —
// the module owns only the radius arithmetic. Throttled: the fronts move in whole
// tiles slowly, so re-scanning at ~2.5 Hz is invisible and cheap.
// POSEIDON's fog: the veil the network drags over the island once it wakes. Its
// density tracks how much of the network still stands — full when every tower is
// live, dispersing as you fell them, gone when the network is broken. It slams
// down when POSEIDON comes online and lifts SLOWLY, so felling a tower is a visible
// relief rather than an instant one. Night-vision goggles cut it (see the veil in
// renderer.draw). Read by the hud as `poseidonFog`.
let poseidonFog = 0;
// ---- what the obelisk control verbs hold down (docs/ob-hacking-plan.md) ----
//
// Each is an override with a clock on it. Nothing here is permanent: the purge
// is the game's deadline, and a verb that switched it off for good would switch
// the game off with it. When a clock runs out the world takes its own state
// back, and `updateFog` and the blight and sight passes read these first.
const OB_HOLD = 150;              // seconds an override stands, before the world wins
let obFogHold = { level: null, t: 0 };   // 'high' | 'low' | 'clear'
let obPurgeHold = { on: null, t: 0 };    // purge forced up or down
let obSightHold = { on: null, t: 0 };    // shared sight forced on or off
let obBlightHold = { on: null, t: 0 };   // blight fronts frozen or running

function tickObHolds(dt) {
  for (const h of [obFogHold, obPurgeHold, obSightHold, obBlightHold]) {
    if (h.t > 0) {
      h.t -= dt;
      if (h.t <= 0) { h.t = 0; h.level = null; h.on = null; }
    }
  }
}
/** Is the purge running, as the world sees it after any override? */
function purgeLive() {
  if (obPurgeHold.on !== null && obPurgeHold.t > 0) return obPurgeHold.on;
  return !!player.skylinkActive;
}

// A control verb costs the tower it was typed at: it freezes for as long as the
// override stands. Written once because five verbs want it.
function ronmlCtxSpend() {
  const o = terminalOb ? findObelisk(terminalOb.code) : null;
  if (o && !o.destroyed) { o.frozen = true; o.frozenT = Math.max(o.frozenT || 0, OB_HOLD); }
}

function updateFog(dt, obs) {
  const live = obs.filter(obeliskLive).length;
  const total = obs.length || 1;
  // The override first, then the world. `high` is full whatever the towers are
  // doing, `clear` is nothing, and `low` is a haze you can see through.
  const forced = obFogHold.level && obFogHold.t > 0
    ? ({ high: 1, low: 0.28, clear: 0 })[obFogHold.level]
    : null;
  const target = forced !== null ? forced
    : ((purgeLive() && !player._ended) ? live / total : 0);
  const rate = target > poseidonFog ? 1.1 : 0.12;   // down fast, disperse slow
  poseidonFog += (target - poseidonFog) * Math.min(1, rate * dt);
  if (poseidonFog < 0.002) poseidonFog = 0;
}

// THE ISLAND KEEPS ONE TERMINAL (task #87).
//
// Every tower you fell drops an access chip, and a chip is only good for
// jacking into a tower. Bring them ALL down and you are holding chips with
// nothing to put them in, and the console — hacking a node, the control verbs,
// `save` — is out of reach on that island for the rest of the run. The route in
// is the AI-ML `crash` verb, which topples a node from the console without
// going through onObeliskDestroyed, so the all-toppled victory never fires and
// the run simply carries on with no way back to a terminal.
//
// The SIREN tower answers for it. Bring the last one down and something small
// unfolds out of its wreck and starts putting a tower back up: a T1a, which is
// a W3's repair program in a smaller shell, so it walks to the nearest heap and
// raises it exactly as a factory drone would. It works with the W-factory dead,
// because it did not come from the factory.
//
// Killable, and that is the point of the timer: kill it and the wreck sends
// another. Nothing here fires while a tower still stands, so felling towers is
// unchanged; and nothing fires once the daemon is down, when the island is
// finished and its towers are dark anyway.
const SIREN_DRONE_DELAY = 12;   // seconds of nothing standing before the wreck answers
let sirenDroneT = 0;
function tickSirenRepair(dt) {
  const obs = currentWorld.obeliskObjs || [];
  if (!obs.length || player._ended) { sirenDroneT = 0; return; }
  if (fortress && fortress.core && fortress.core.obj && fortress.core.obj.defeated) { sirenDroneT = 0; return; }
  if (obs.some((o) => !o.destroyed)) { sirenDroneT = 0; return; }   // a tower stands: nothing to do
  if (currentWorld.robots.some((r) => r.sirenDrone && !r.dead)) { sirenDroneT = 0; return; }
  sirenDroneT += dt;
  if (sirenDroneT < SIREN_DRONE_DELAY) return;
  sirenDroneT = 0;
  const siren = obs.find((o) => o.cls === 'siren') || obs[0];
  const drone = spawnW3(map, Math.floor(Math.random() * 0x7fffffff), siren.x + 0.5, siren.y + 0.5);
  if (!drone) return;
  drone.sirenDrone = true;
  drone.designation = 'T1a';     // its plate says what it is, not what program it runs
  currentWorld.robots.push(drone);
  player.say('Something small unfolds out of the siren tower and starts sorting the heap. A T1a: it will have a tower back up before long.');
}

let _blightClock = 0;
let _netSightT = 0;   // throttle for the POSEIDON shared-sight pass
function updateBlight(dt) {
  const obs = currentWorld.obeliskObjs || [];
  if (!currentWorld.combat || !obs.length) { poseidonFog = 0; return; }
  // `blight STOP` holds every front where it stands, which felling one tower
  // only does for its own. The fog still updates: it is a different system.
  if (obBlightHold.on === false && obBlightHold.t > 0) { updateFog(dt, obs); return; }
  // POSEIDON's towers are a CHAIN. Break ONE link — fell, jam or destroy any tower
  // — and the whole network goes dead: EVERY front stops spreading, not just the
  // felled one. Spread only resumes if the chain is whole again (every tower live).
  // This is also what stops the healed-tile flicker: a dead network reclaims no
  // ground, so a gardener can green a tile and nothing snaps it back.
  const liveObs = obs.filter(obeliskLive);
  const linkDown = networkLinkDown(obs, liveObs);
  // Grow every tower's front every frame (smooth) while the chain is whole, but only
  // re-paint the grid a few times a second.
  blightStep(obs, dt, !!player.skylinkActive && !player._ended && !linkDown);
  updateFog(dt, obs);
  _blightClock += dt;
  if (_blightClock < 0.4) return;
  _blightClock = 0;

  // Nothing to do if no front has any reach and nothing is currently blighted.
  const anyReach = obs.some((o) => (o.blightR || 0) > 0);
  if (!map.blightIdx) { map.blightIdx = new Set(); map.blightOrig = new Map(); }
  // Tiles healed back by active work — a planted grass seed or a W5 gardener.
  // A healed tile stays green even while a FELLED tower's frozen front still
  // "covers" it (felling stops the spread, it does not green the ground; only
  // this set does). But a still-LIVE tower's advancing front reclaims a healed
  // tile — you cannot hold ground in front of a working tower.
  if (!map.blightHealed) map.blightHealed = new Set();
  // Water the blight has reached: kept as a render-only set (the tile keeps its
  // sea/water floor type so it stays swimmable — only its LOOK goes dead), so the
  // blight running off the sand poisons the water without breaking the crossings.
  if (!map.blightWater) map.blightWater = new Set();
  if (!anyReach && map.blightIdx.size === 0 && map.blightWater.size === 0) return;

  const W = map.w, H = map.h;
  const covered = new Set();
  const coveredWater = new Set();
  // Only a WHOLE chain reclaims healed ground. Once the link is down the network is
  // dead, so no front takes a tile back — the empty set here is what lets the
  // gardeners hold the green they win (and kills the green/grey flashing).
  const reclaimObs = linkDown ? [] : liveObs;
  // COVER: scan each front's bounding box, blight the living tiles it reaches —
  // and mark the water it reaches as dead-looking too.
  for (const ob of obs) {
    const r = Math.ceil(ob.blightR || 0);
    if (r <= 0) continue;
    for (let y = Math.max(0, ob.y - r); y <= Math.min(H - 1, ob.y + r); y++) {
      for (let x = Math.max(0, ob.x - r); x <= Math.min(W - 1, ob.x + r); x++) {
        if (!tileBlighted(x, y, obs)) continue;
        const idx = y * W + x;
        const f = map.floor[idx];
        // Water within the front goes dead-LOOKING, keeping its type. The blight
        // reaching the coast (sand) and running on into the sea, as David asked.
        if (f === 'sea' || f === 'water' || f === 'stream') {
          coveredWater.add(idx);
          map.blightWater.add(idx);
          continue;
        }
        // A tile that was healed back: it stays green under a dead/frozen front,
        // but a live tower's growing front takes it again.
        if (map.blightHealed.has(idx)) {
          if (tileBlighted(x, y, reclaimObs)) {
            map.blightHealed.delete(idx);   // reclaimed by a live front — fall through and blight it
          } else {
            // hold it green: make sure it is not left painted from an earlier pass
            if (map.blightIdx.has(idx)) {
              map.floor[idx] = map.blightOrig.get(idx) || f;
              map.blightOrig.delete(idx);
              map.blightIdx.delete(idx);
              const th = map.objectGrid[idx];
              if (th && th.type === 'tree') th.dead = false;
            }
            continue;
          }
        }
        covered.add(idx);
        const already = map.blightIdx.has(idx);
        if (!already) {
          if (!BLIGHTABLE.has(f)) continue;    // road, decks, mountain rock: left alone
          map.blightOrig.set(idx, f);
          map.blightIdx.add(idx);
          const t = map.objectGrid[idx];
          if (t && t.type === 'tree') t.dead = true;   // a tree on dead ground dies
        }
        // Stage by how deep the tile is: the leading edge yellows and sickens,
        // the ground behind it drains to grey. Recomputed every pass, so a tile
        // transitions sick -> grey as the front moves past it.
        map.floor[idx] = blightDepth(x, y, obs) >= BLIGHT_SICK_BAND ? 'blight' : 'blight_sick';
      }
    }
  }
  // RECOVER: a felled/jammed tower's front is FROZEN, not retreating, so a tile
  // no longer covered can only mean it was healed (grass seed / gardener) — bring
  // it back to what it was. Felling a tower on its own restores nothing.
  for (const idx of map.blightIdx) {
    if (covered.has(idx)) continue;
    map.floor[idx] = map.blightOrig.get(idx) || 'grass';
    map.blightOrig.delete(idx);
    map.blightIdx.delete(idx);
    const t = map.objectGrid[idx];
    if (t && t.type === 'tree') t.dead = false;      // and its tree leafs again
  }
  for (const idx of map.blightWater) {
    if (!coveredWater.has(idx)) map.blightWater.delete(idx);   // the water clears again
  }

  // W5 GARDENERS reseed the dead ground once the island's network LINK is down —
  // the guards you stood down (and the factory's own) walk the blight and bring
  // the green back behind them, the mirror of "plant where they hunted". The
  // trigger is the CHAIN breaking, NOT every last tower being felled: break one
  // tower and the link is down, and the gardeners get to work. (A tile a still-live
  // tower's own front covers is protected above — it is reclaimed, not reseeded —
  // so gardeners can start before the map is fully clear without fighting a front.)
  if (map.blightIdx.size && linkDown) {
    for (const r of currentWorld.robots) {
      if (!(r.type === 'w5' || r.gardener) || r.dead || r.drained) continue;
      const near = nearestBlightTile(r.x, r.y, 30);
      if (!near) continue;
      r.home = { x: near.x + 0.5, y: near.y + 0.5 };   // drift the gardener toward the blight
      r._reseedT = (r._reseedT || 0) - 0.4;             // throttled pass cadence
      if (r._reseedT <= 0 && Math.hypot(near.x + 0.5 - r.x, near.y + 0.5 - r.y) <= 2.6) {
        r._reseedT = 0.8;
        healBlightTile(near.x, near.y);
      }
    }
  }
}

// Has POSEIDON's network LINK gone down? The towers are a CHAIN — break ONE and
// the chain is broken, the link is down. So a single felled or jammed tower is
// enough for the gardeners to start reseeding. This does NOT undo "felling one
// tower heals nothing on its own": felling still never RESTORES ground (the front
// freezes, the scar stays), it only breaks the link — the gardeners then walk the
// blight and heal it tile by tile, slow work, and any tile a still-live tower's
// own front covers is reclaimed above, so gardeners can never hold ground in
// front of a working tower.
function networkLinkDown(obs, liveObs) {
  if (!obs.length) return true;
  return liveObs.length < obs.length;
}

// The nearest currently-blighted tile to (x,y) within maxR, or null. Scans the
// live blight set (small) rather than the map. Used to send W5 gardeners to work.
function nearestBlightTile(x, y, maxR) {
  if (!map.blightIdx || !map.blightIdx.size) return null;
  const W = map.w;
  let best = null, bestD = maxR * maxR;
  for (const idx of map.blightIdx) {
    const tx = idx % W, ty = (idx - tx) / W;
    const dx = tx + 0.5 - x, dy = ty + 0.5 - y, d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = { x: tx, y: ty }; }
  }
  return best;
}

function update(dt) {
  if (input.consumePress('KeyH')) toggleHelp();
  if (input.inventoryPressed()) showBackpack = !showBackpack;
  if (input.skillsPressed()) showSkills = !showSkills;
  if (input.weaponChartPressed()) showWeapons = !showWeapons;
  // O: the phone, in and out of the pocket. Closing by key only matters when
  // the thread input hasn't got focus (typing captures the keyboard; Esc and
  // the X still close from inside).
  if (input.phonePressed()) {
    if (phoneEl.style.display === 'flex') closePhone(); else openPhone();
  }
  // L: the laptop — the one console that isn't bolted to a tower or a hilltop.
  if (input.laptopPressed()) {
    if (terminalKind === 'laptop' && obTermEl.style.display === 'flex') closeObTerminal();
    else if (obTermEl.style.display !== 'flex') openLaptop();
  }
  if (input.pausePressed() && !player.deathCert) {
    paused = !paused;
    player.say(paused ? 'Paused. Press P to resume.' : 'Back in it.');
  }
  // Everything else — movement, AI, clocks, timers, New Game, crafting —
  // freezes while paused. Help/backpack/skills/weapons and unpausing itself
  // still work above this line.
  if (paused) return;

  // A queued boat crossing (islands-plan §4): perform the deferred world switch
  // here, at a clean frame boundary, then bail — it was requested from inside
  // player.update (boarding a ship), and the rest of this tick assumes the world
  // we are leaving.
  if (pendingCrossing) {
    const target = pendingCrossing;
    pendingCrossing = null;
    // END THE ROW-OUT HERE. This block runs BEFORE the departOut tick and
    // returns, so a row-out left standing would survive the crossing and then
    // hijack the next frame with the OLD island's coordinates — and because
    // pendingCrossing is null by then, its own self-clear never fires. The
    // result is a frame loop that returns before any input is read: you arrive
    // stuck aboard, unable to step out or to board. Clear it where the crossing
    // is actually committed, not where the voyage hopes to notice.
    departOut = null;
    // Scylla and Charybdis: the AEAEA <-> THRINACIA passage runs through the
    // narrows. Hold the crossing here and play the strait — the world switch
    // happens in finishStrait, once the sea has taken its price. (The Backspace
    // door-road is not a sea route, so it never enters the strait.)
    if (!strait && currentWorld.id !== 'backspace' && isStraitCrossing(currentWorld.id, target)) {
      beginStrait(currentWorld.id, target);
      return;
    }
    player.aboard = null;
    const dest = worldById(target);
    // A boat/road crossing arrives by keel: beach at the destination's spawn and
    // clear the departed island's returnPos, so neither end strands you offshore
    // where the row-out left the player's coordinates (see switchWorld).
    if (dest) { goToWorld(dest, { beach: true }); sfx.play('zap'); }
    return;
  }

  // The Nokia's queue drains every frame, wherever you are, so a text finishes even
  // if you cross mid-message; the SMS beep fires the frame each one appears. Off
  // Ogygia the phone has NO SIGNAL — one line, once, so the channel reads as hers.
  player._smsClock = dayNight.clock; // the time stamped on any SMS filed this frame
  poseidonWarnings();                // the deadline, as escalating notices
  nokia.tick(dt);
  if (nokia.justShown) phoneBeep();
  if (!currentWorld.keeper && currentWorld.id !== 'backspace') sendNokia(nokia, 'noSignal', { player });

  // CIRCE's swine-magic (AEAEA). The change only TAKES HOLD on her island (a
  // `transmute` world), but MOLY undoes it anywhere — so you can flee Aeaea
  // half-turned and shed it at sea, if you carry the herb. Runs before the
  // world branch so it ticks wherever you are.
  if (!player.deathCert && !player._ended && (player.swine > 0 || currentWorld.transmute)) {
    const prev = player.swine;
    if (player.hasMoly()) player.swine = Math.max(0, player.swine - dt * 0.09);        // ~11s to shed
    else if (currentWorld.transmute) player.swine = Math.min(1, player.swine + dt * 0.0125); // ~80s to turn
    const stage = (v) => (v >= 1 ? 3 : v >= 0.62 ? 2 : v >= 0.3 ? 1 : 0);
    const s0 = stage(prev), s1 = stage(player.swine);
    if (s1 > s0) {
      if (s1 === 1) player.say('Your hands look wrong in this light. Something is being decided about you.');
      else if (s1 === 2) player.say('You keep catching yourself on all fours, and your grip is going. Find moly — it grows where HERMES stands.');
      else if (s1 === 3) player.say('The change closes over you. You are a beast now: the network no longer reads you as a person, and lets you be — but you can hold nothing, and work nothing.');
    } else if (s1 < s0) {
      if (s0 === 3) player.say('The moly bites, and you come back into your own shape — hands, and a name.');
      else if (s1 === 0) player.say('The pull lets go of you. You are yourself again.');
    }
    // (The "machines lose interest in a beast" half of the mechanic lives at the
    // point of DETECTION, in updateRobots — clearing aggro from out here does not
    // stick, because each robot's own AI re-acquires you later in the same frame.)
  }

  // HELIOS's prohibition (THRINACIA). The cattle of the Sun are forbidden. This
  // island does not hunt you — until you slaughter one, and then it never stops.
  // A one-time warning fires when you first come near the herd; after that it is
  // on you. Runs only on a `prohibition` world (Helios is a combat world, so the
  // worldStir aliases already point at its obelisks + factory).
  if (currentWorld.prohibition && currentWorld.sacredHerd && !player.deathCert && !player._ended) {
    const herd = currentWorld.sacredHerd;
    if (!currentWorld.heliosWrath) {
      // The trespass: any of the herd gone from the tally means you took one.
      const live = herd.reduce((n, c) => n + (c.dead ? 0 : 1), 0);
      if (live < currentWorld.sacredCount) {
        currentWorld.heliosWrath = true;
        currentWorld._heliosStirClock = 0;
        player.say('You have killed the cattle of the Sun. HELIOS darkens overhead, and the whole island turns its face to you. There is no unmaking this — fell the core, or die hunted.');
        sfx.play('charge');
        worldStir.stir();
        if (typeof worldStir.spawnWave === 'function') worldStir.spawnWave(4, 2);
      } else if (!currentWorld._heliosWarned) {
        // A single warning the first time you stray in among the herd.
        for (const c of herd) {
          if (!c.dead && Math.hypot(c.x - player.x, c.y - player.y) < 4) {
            currentWorld._heliosWarned = true;
            player.say('These are the cattle of the Sun, and HELIOS counts them. Lay no hand on them: take one, and the island is your enemy to the end.');
            break;
          }
        }
      }
    } else {
      // Wrath holds: keep the network roused so the obelisks stay red and the
      // factory keeps scrambling hunters until the core falls.
      currentWorld._heliosStirClock = (currentWorld._heliosStirClock || 0) + dt;
      if (currentWorld._heliosStirClock > 4) {
        currentWorld._heliosStirClock = 0;
        worldStir.stir();
      }
    }
  }

  // Out on the water in a boat that was never going to make it. The world holds
  // still — no input, no AI, no clock — while the voyage plays out and the sea
  // sends you home. (updateCrossFail drives the camera itself.)
  if (crossFail) { updateCrossFail(dt); return; }
  // In the narrows between Scylla and Charybdis. The world holds still the same
  // way: you are on the water, and the only move left is the choice.
  if (strait) { updateStrait(dt); return; }
  // At Calypso's terminal, playing the pong she will not let you win. The world
  // holds still the same way the narrows do — nothing else to attend to.
  if (pong) { updatePong(dt); return; }
  // Rowing out to the chart (or back in after thinking better of it). Like the
  // failed crossing, the world holds still while the sea has you.
  if (departOut) { updateDepartOut(dt); return; }
  // You are ashore, so you are out of the boat. Not a tidy-up: while `aboard` is
  // set the renderer draws the hull INSTEAD of the character, so a stray flag
  // would leave you playing an invisible man in a boat on dry land. Nothing may
  // leave you aboard once the crossing is over — not a death, not a world switch.
  if (player.aboard) player.aboard = null;

  // Resting (from B): the world holds still while the character lies down, the
  // screen dims, and the clock visibly spins faster (REST_CLOCK_MULT) so you
  // see time pass. Health trickles back over the animation, then you wake.
  if (resting) {
    resting.t += dt;
    dayNight.update(dt * REST_CLOCK_MULT);
    player.health = Math.min(player.maxHealth, player.health + (SLEEP_HEAL / REST_DURATION) * dt);
    if (resting.t >= REST_DURATION) {
      resting = null;
      player.resting = false;
      sleepCooldown = SLEEP_COOLDOWN_S;
      player.say('You wake, a little stronger.');
      // Rest on Ogygia is exactly what she wants: her hold tightens, and she is glad.
      if (currentWorld.keeper) { holdRise(player, 0.10); sendNokia(nokia, 'firstRest', { player }); }
      persist();
    }
    return; // everything else — movement, AI, other clocks — is frozen while resting
  }

  // Driving a machine from a HERMES relay: you steer the unit and the overworld
  // holds still around you (you're jacked in at the relay). The robot-vision
  // overlay is drawn in frame().
  if (driveState) { updateDrive(dt); return; }

  if (input.newGamePressed()) {
    if (window.confirm('Start a new game? This erases your saved progress.')) {
      fullReset();
      return;
    }
  }
  // N alone opens the notepad directly — no need to be jacked into a
  // terminal just to read back what you've already learned.
  if (input.notesPressed()) openNotebook();
  if (input.libraryPressed()) openBookshelf();
  // ESCAPE GOES BACK, which is what it does in every other game: it shuts the
  // top thing, and with nothing left to shut it offers the title screen.
  // Shift+Q goes straight there.
  //
  // A COOLDOWN AFTER ANYTHING CLOSES, because Escape is a key people hit twice.
  // A DOM overlay handles its own Escape on the keydown, so by this frame it is
  // already gone; without a pause, the second tap of a double-tap — or a tap
  // that shut the scrapbook a moment ago — would offer to end the session. The
  // clock is stamped while anything is open and for ESC_QUIET after it shuts.
  const overlayNow = domOverlayOpen() || showBackpack || showSkills || showWeapons
    || helpEl.style.display === 'block';
  if (overlayNow) _overlayShutAt = performance.now();
  // A canvas panel is drawn ON the canvas, so the DOM chrome that floats above
  // it — the touch hint line, the ? and i buttons — printed straight through
  // the Armoury and the Record. They go away while a panel is up.
  document.body.classList.toggle('panelup', showBackpack || showSkills || showWeapons);
  if (input.consumePress('Escape') && !player.deathCert) {
    if (helpEl.style.display === 'block') toggleHelp(false);
    else if (showBackpack) showBackpack = false;
    else if (showSkills) showSkills = false;
    else if (showWeapons) showWeapons = false;
    else if (performance.now() - _overlayShutAt > ESC_QUIET) openQuitGate();
  }
  if (input.quitPressed() && !player.deathCert) openQuitGate();
  // The moment the parts are actually in the pack, say so — once. A recipe you
  // have already satisfied and do not know about is a recipe that does not
  // exist, and the NostBook is the one piece of kit the rest of the game hangs
  // off, so it must not sit in a pocket unbuilt because nothing said.
  if (!player._laptopReadySaid && player.canRepairLaptop()) {
    player._laptopReadySaid = true;
    player.say('Two cells and two chip fragments: enough for the burnt board. Press C to rebuild the NostBook.');
    sfx.play('blip');
  }
  if (input.craftPressed()) {
    if (player.canCraftWaveGun()) player.craftWaveGun(map);
    else if (player.canCraftObGun()) player.craftObGun(map);
    else if (player.canCraftChip()) player.craftChip();
    else if (player.canCraftSword()) player.craftSword();
    else if (player.canCraftFortressMap()) player.craftFortressMap();
    else if (player.canCraftGreekShip(map)) player.craftGreekShip(map);
    else if (player.canCraftGoggles()) player.craftGoggles();
    else if (player.canCraftBluebox()) player.craftBluebox();
    else if (player.canRepairLaptop()) player.repairLaptop(makeDisk);
    // After the NostBook, deliberately: both want a battery, and a sniffer built
    // out of the laptop's last cell would be the wrong trade made silently.
    else if (player.canCraftSniffer()) player.craftSniffer();
    else if (player.canCraftBoat(map)) player.craftBoat(map);
    // Nothing else to make and a dead machine in the pack: let repairLaptop
    // refuse OUT LOUD. It counts exactly what is short ("1 more battery and 2
    // more chip fragments"), and until now that message was unreachable —
    // the branch above only ran when the parts were already in hand.
    else if (player.hasItem('laptop_broken') && !player.laptop) player.repairLaptop(makeDisk);
  }
  if (input.blueboxPressed()) player.bluebox(currentWorld.robots, map);
  // The sniffer's sweep goes through the same door the network's REPORT button
  // goes through: one mechanism, two ways to reach it. A machine that stops for
  // the wand has no way of telling it apart from its own tower asking.
  player.onSniff = (r) => {
    const h = findHost(webHosts(), netIdOf(currentWorld, r));
    if (h) { requestUnitReport(h, r); return h.name; }
    r.reportT = REPORT_HOLD; r.reportCool = REPORT_HOLD + REPORT_COOLDOWN;
    r.lamp = 'blue'; r.lampFlash = 1;
    return netIdOf(currentWorld, r);
  };
  if (input.snifferPressed()) player.sniff(currentWorld.robots, map);
  // The passive half: with the wand in hand, every machine in radio range wears
  // the name the network knows it by. Out of hand, nothing is drawn at all —
  // the tool is the reason you can read them, not a setting.
  // A name is only worth clicking if there is something to open it in: a
  // working NostBook with its card up. Without one the tag still reads (the
  // wand is a radio, not a browser) but it does not pretend to be a link.
  // Same rule laptopNetState uses, and for the same reason: the card ships up,
  // so only an explicit `ifconfig wifi0 down` counts as off the air. Checking
  // for a disk here would be wrong — a repaired NostBook has no `fs` until
  // something opens it, and the tag would go dead for no reason a player could
  // see.
  const canBrowse = !!player.laptop && player.laptop.netUp !== false;
  setUnitTagsClickable(player.hands === 'sniffer' && canBrowse);
  {
    const m = input.mousePos();
    const hitR = input.mousePressed ? unitTagAt(m.x, m.y) : null;
    if (hitR) {
      input.consumeClick();
      const h = findHost(webHosts(), netIdOf(currentWorld, hitR));
      if (h) { openLaptop(); openNetscape(h.host); }
    }
  }
  setUnitTagger(player.hands === 'sniffer'
    ? (r) => ((r.dead || r.fused) ? null
      : (Math.hypot(r.x - player.x, r.y - player.y) <= SNIFFER_TAG_RANGE
        ? netIdOf(currentWorld, r) : null))
    : null);
  // Reading a dead machine's disk onto your own (E while holding one).
  player.onSalvageLaptop = () => player.salvageLaptop(SALVAGE_DISKS, graftSalvage);
  player.onInstallLaptop = () => player.installLaptop(makeDisk);
  // G: transmit as a tower, and take its garrison (needs an OB spoofer + a battery).
  if (input.spooferPressed()) player.spoofObelisk(currentWorld.obeliskObjs || [], currentWorld.robots || [], map);
  if (input.zoomTogglePressed()) camera.toggleZoom();
  if (input.panelsTogglePressed()) toggleHudMenu();
  if (input.minimapTogglePressed()) { showMinimap = !showMinimap; player.say(showMinimap ? 'Minimap on.' : 'Minimap off.'); }
  if (input.musicTogglePressed()) {
    const mode = sfx.toggleMusic();
    player.say(mode === 'synth' ? 'Music: the piano bed.' : 'Music off.');
  }
  // Rest (B): skips the clock forward 10 game-minutes and restores some
  // health, so long as nothing hostile is close enough to make that a bad
  // idea, and not so often it's a free heal button.
  // T: quick-toggle the forcefield on/off, so you can drop it to save the cell
  // between fights without digging the item out of a slot to click it.
  if (input.forcefieldTogglePressed()) player.toggleForcefield();

  if (sleepCooldown > 0) sleepCooldown = Math.max(0, sleepCooldown - dt);
  if (input.sleepPressed()) {
    if (player.health >= player.maxHealth) {
      player.say("You're not hurt enough to need the rest.");
    } else if (sleepCooldown > 0) {
      player.say('Still too keyed up to rest again so soon.');
    } else if (currentWorld.robots.some((r) => !r.dead && !r.friendly && !r.drained && r.aggro
      && Math.hypot(r.x - player.x, r.y - player.y) < SLEEP_SAFE_RANGE)) {
      player.say("Too dangerous to rest with something hunting you.");
    } else {
      // Begin the rest animation rather than healing instantly (see the
      // resting block above). The cooldown is set when it completes.
      resting = { t: 0 };
      player.resting = true;
      player.say('You lie down to rest a while...');
    }
  }
  if (!hintDone && hintEl.style.display !== 'none') {
    playTime += dt;
    if (playTime >= HINT_LIFETIME) {
      hintDone = true;
      hintEl.style.opacity = '0';                          // fades, rather than popping out
      setTimeout(() => { hintEl.style.display = 'none'; }, 1200);
    }
  }
  const mouse = input.mousePos();
  const mouseWorld = camera.toWorld(mouse.x, mouse.y, renderer.w, renderer.h);

  // Mouse wheel zooms (the HUD is screen-space, so it stays the same size) —
  // UNLESS an open panel owns the wheel. This consume used to run
  // unconditionally, and it sits a couple of hundred lines above the systems
  // pass that ticks lore.update, so the Scrapbook's own consumeWheel() was
  // always handed a zero and could never scroll. The zoom was eating it; it was
  // never a focus problem.
  if (!lore.archiveOpen) {
    const wheel = input.consumeWheel();
    if (wheel) camera.zoomBy(-wheel * 0.0015);
  }

  // AI-defeated celebration: a level-up modal (fireworks + score). Freezes the
  // world behind it until dismissed; then the run carries on (you don't win the
  // game by felling one daemon — you sail for the next).
  if (player.aiVictory) {
    // Stray input must NOT eat the celebration: the killing blow's own click
    // (or its release) used to dismiss the modal on the very next frame,
    // before a single firework had burst. Clicks are swallowed but never
    // dismiss; only a deliberate Space/Enter does, and only once the show
    // has had a few seconds to play.
    player.aiVictory.shownAt ??= performance.now();
    input.consumeClick(); input.clickPos(); input.consumeUp();
    const shownFor = performance.now() - player.aiVictory.shownAt;
    const wantsOut = input.consumePress('Space') || input.consumePress('Enter');
    if (wantsOut && shownFor > 3000) player.aiVictory = null;
    return;
  }

  // Death certificate: freeze the world behind the modal until it's clicked.
  if (player.deathCert) {
    const copyCert = () => {
      renderer.shareCertificate().then((result) => {
        player.say(result === 'clipboard'
          ? 'Certificate copied to the clipboard — paste it to share.'
          : "Your browser won't allow copying images to the clipboard.");
      });
    };
    if (input.consumePress('KeyS')) copyCert();
    const click = input.clickPos();
    const btn = renderer._certCopyBtn;
    if (click && btn && click.x >= btn.x && click.x <= btn.x + btn.w && click.y >= btn.y && click.y <= btn.y + btn.h) {
      input.consumeClick();
      copyCert();
      return;
    }
    // Dying restarts the game from defaults — score, skills, and everything
    // else wiped, same as New Game, no confirm needed since death already
    // made the choice for you. Winning is not dying: dismissing a victory
    // cert just lets you carry on with what you've earned.
    if (click || input.consumeUp()) {
      input.consumeClick();
      if (player.deathCert.victory) player.deathCert = null;
      else fullReset();
    }
    return;
  }

  // Right-click inspects whatever is under the cursor.
  const right = input.consumeRight();
  if (right) {
    const w = camera.toWorld(right.x, right.y, renderer.w, renderer.h);
    detail = { text: describeAt(Math.floor(w.x), Math.floor(w.y)), x: right.x, y: right.y, ttl: 6 };
  }
  if (detail) { detail.ttl -= dt; if (detail.ttl <= 0) detail = null; }
  if (toast) { toast.ttl -= dt; if (toast.ttl <= 0) toast = null; }

  // Click away from an open canvas panel (backpack/skills/armoury) closes
  // it, same as the help modal's backdrop-click dismissal — these are drawn
  // straight to canvas rather than as DOM elements with their own backdrop,
  // so the "outside" test is a plain rect check against the panel the
  // renderer last drew. A click that lands inside the panel falls through
  // unconsumed to the slot/drag handling right below.
  if (showBackpack || showSkills || showWeapons) {
    const modalClick = input.clickPos();
    const outside = (r) => !r || modalClick.x < r.x || modalClick.x > r.x + r.w
      || modalClick.y < r.y || modalClick.y > r.y + r.h;
    // A press that lands on a dashboard/backpack slot must NOT be treated as an
    // outside-click that closes the panel — otherwise you can never grab a
    // pocket item to drag it into the open backpack. Let the slot handler below
    // take it (start a drag) and keep the panel open.
    const onSlot = modalClick && renderer.slotAt && renderer.slotAt(modalClick.x, modalClick.y);
    if (modalClick && !onSlot) {
      if (showBackpack && outside(renderer._backpackRect)) { input.consumeClick(); showBackpack = false; }
      else if (showSkills && outside(renderer._skillsRect)) { input.consumeClick(); showSkills = false; }
      else if (showWeapons && outside(renderer._weaponsRect)) { input.consumeClick(); showWeapons = false; }
    }
  }

  // The Scrapbook (lore, J) is a modal too: a click outside its panel closes it,
  // same as the notebook and the panels above. Handled HERE — before the click
  // can reach the world and swing your tool — because lore.update (which also
  // has this check) runs late in the frame, after fire has already eaten the
  // click, so its own click-away never fired. Escape closes it as well.
  if (lore.archiveOpen) {
    const r = lore._archiveRect;
    const bc = input.clickPos();
    if (bc) {
      const tab = lore.archiveTabAt(bc.x, bc.y);
      const outside = !r || bc.x < r.x || bc.x > r.x + r.w || bc.y < r.y || bc.y > r.y + r.h;
      if (tab >= 0) {
        input.consumeClick();          // a tab switches drawer...
        lore.setArchiveTab(tab);
      } else if (outside) {
        input.consumeClick();          // ...outside the book shuts it...
        lore.archiveOpen = false;
      } else {
        input.consumeClick();          // ...and a click on the page does nothing
      }                                //    (but must not swing your axe either)
    }
    if (input.consumePress('Escape')) lore.archiveOpen = false;
  }

  // Pointer over the dashboard/backpack slots: press begins a drag (or, on a
  // same-slot release, a click-equip); release drops onto the target slot.
  // Claimed here so a slot press never also swings the held tool.
  const press = input.clickPos();
  // Tap the SMS handset to hurry it along. Checked BEFORE the slots and the
  // world so a dismissing tap never also swings the held tool — the toast sits
  // over open ground, and reading it should not cost you a swing.
  if (press && renderer._nokiaToastRect && nokia.current) {
    const r = renderer._nokiaToastRect;
    if (press.x >= r.x && press.x <= r.x + r.w && press.y >= r.y && press.y <= r.y + r.h) {
      input.consumeClick();
      nokia.hurry();
      sfx.play('keydrop');
    }
  }
  // Tap the SCORE to open the Record — skills, knowledge, the run's tallies.
  // The number is what that panel is about, so pressing it is the obvious
  // move, and on a touch screen there is no K key to press instead. Before the
  // slots and the world, like the handset above, so it never also swings.
  if (press && renderer._scoreRect) {
    const r = renderer._scoreRect;
    if (press.x >= r.x && press.x <= r.x + r.w && press.y >= r.y && press.y <= r.y + r.h) {
      input.consumeClick();
      showSkills = !showSkills;
      sfx.play('keydrop');
    }
  }
  // The panel buttons beside the vitals bars. Same rule as the score above:
  // handled before the slots and the world, so pressing one never also swings.
  if (press && renderer.hudButtonAt) {
    const b = renderer.hudButtonAt(press.x, press.y);
    if (b) {
      input.consumeClick();
      sfx.play('keydrop');
      if (b.action === 'menu') toggleHudMenu();
      else if (b.action === 'help') toggleHelp();
      else if (b.action === 'notes') openNotebook();
      else if (b.action === 'library') openBookshelf();
      else if (b.action === 'skills') showSkills = !showSkills;
      else if (b.action === 'weapons') showWeapons = !showWeapons;
      else if (b.action === 'minimap') {
        showMinimap = !showMinimap;
        player.say(showMinimap ? 'Minimap on.' : 'Minimap off.');
      }
    }
  }
  if (press && renderer.slotAt) {
    const slot = renderer.slotAt(press.x, press.y);
    if (slot) {
      input.consumeClick();
      if (slot.kind === 'packbadge') showBackpack = !showBackpack; // tap the badge to open — and again to close (mobile has no I key)
      else if (slot.kind === 'phone') openPhone(); // the Nokia 3310: the screen opens, SMS both ways
      else if (slot.kind === 'laptop') openLaptop(); // the machine you carry: the shell opens (same as L)
      // CLICK A BOOK AND YOU READ IT. It used to pick the book up and say
      // nothing, which the tooltip made worse by promising what the thing was
      // for. Reading it teaches its skill and files its page; the Scrapbook is
      // then opened AT that page, so the click ends in the book rather than in
      // a line of toast. No second reader: the Scrapbook already pages,
      // scrolls, jumps and closes, and two readers for one object would drift.
      // Manage mode (the pack open) still moves the item instead — one rule.
      else if (!showBackpack && bookInSlot(slot)) readSlot(slot);
      else if (player.getSlot(slot)) drag = { from: slot, sx: press.x, sy: press.y }; // origin kept for the slip guard on release
      else player.equipSlot(slot); // empty hands slot: stow whatever's held
    }
  }
  // Click an obelisk's terminal to open its screen — if you're close enough to
  // reach it. Checked after the HUD slots (so a slot click wins) and before
  // the in-world tool use (consuming the click here stops it swinging).
  const obPress = input.clickPos();
  if (obPress && renderer.obeliskAt) {
    const w = camera.toWorld(obPress.x, obPress.y, renderer.w, renderer.h);
    const ws = worldToScreen(w.x, w.y);
    const ob = renderer.obeliskAt(ws.x, ws.y);
    if (ob) {
      input.consumeClick();
      if (Math.hypot(ob.x + 0.5 - player.x, ob.y + 0.5 - player.y) <= OB_TERMINAL_RANGE) openObTerminal(ob);
      else player.say('Too far from the obelisk to reach its terminal.');
    }
  }
  // Click a HERMES relay (TOR) to open its terminal — same picking as an
  // obelisk (torAt already lift-adjusts the hit rect for the hill it sits on).
  const torPress = torObjs.length && renderer.torAt ? input.clickPos() : null;
  if (torPress) {
    const w = camera.toWorld(torPress.x, torPress.y, renderer.w, renderer.h);
    const ws = worldToScreen(w.x, w.y);
    const tr = renderer.torAt(ws.x, ws.y);
    if (tr) {
      input.consumeClick();
      if (Math.hypot(tr.x + 0.5 - player.x, tr.y + 0.5 - player.y) <= OB_TERMINAL_RANGE + 0.7) openHermesTerminal(tr);
      else player.say('Too far from the HERMES relay to reach it — get up the hill to its screen.');
    }
  }
  // Click the fortress gate terminal (kiosk beside the grand doorway) to open
  // its hack console, if you're standing close enough to reach it.
  const gPress = input.clickPos();
  if (gPress) {
    const w = camera.toWorld(gPress.x, gPress.y, renderer.w, renderer.h);
    const t = fortress.terminal;
    if (Math.hypot(w.x - (t.x + 0.5), w.y - (t.y + 0.5)) <= 1.2) {
      input.consumeClick();
      if (fortress.nearTerminal(player.x, player.y, 2.6)) openGateTerminal();
      else player.say('Too far from the gate terminal to reach it.');
    }
  }
  // Click the core's terminal — the glowing screen on its SE face — to speak with
  // the daemon. You must be standing at the core (nearCoreTerminal); a click that
  // ground-projects onto the core's footprint (its tall SE face maps to a tile
  // just SE of it, right where you stand) then opens its console. Every core now
  // carries one; openCoreTerminal reads fortress.AI_NAME for the right voice.
  if (fortress.coreTerminal) {
    const cPress = input.clickPos();
    if (cPress && fortress.nearCoreTerminal(player.x, player.y)) {
      const w = camera.toWorld(cPress.x, cPress.y, renderer.w, renderer.h);
      const t = fortress.coreTerminal; // the core centre
      if (Math.hypot(w.x - t.x, w.y - t.y) <= fortress.core.fw + 3) {
        input.consumeClick();
        openCoreTerminal();
      }
    }
  }
  const up = input.consumeUp();
  if (up && drag) {
    const target = renderer.slotAt ? renderer.slotAt(up.x, up.y) : null;
    if (target && target.kind === drag.from.kind && target.i === drag.from.i) {
      // Released on the source = a click. With the backpack panel OPEN this is
      // manage mode (one tap moves the item); closed, it's the usual equip.
      if (showBackpack) smartMoveSlot(drag.from);
      else player.equipSlot(drag.from); // released on the source: treat as a click
    } else if (target) {
      player.moveItem(drag.from, target);
    } else if (Math.hypot(up.x - (drag.sx ?? up.x), up.y - (drag.sy ?? up.y)) < 22) {
      // Slipped just off the slot's edge without really dragging (easy to do
      // with a thumb): treat it as the click it was meant to be, never as a
      // throw-it-on-the-ground.
      if (showBackpack) smartMoveSlot(drag.from);
      else player.equipSlot(drag.from);
    } else {
      // Released away from any slot — pocket, hands, or (with the backpack
      // panel open) backpack storage — drag it off to drop it on the ground.
      // Not gated on the panel being open: a genuine drag always lands well
      // outside the small source slot, so it doesn't get mistaken for the
      // release-on-source click case above.
      player.dropSlot(drag.from, map);
    }
    drag = null;
  } else if (!input.mouseHeld && !(input.uiDragActive && input.uiDragActive())) {
    drag = null; // released outside any slot: cancel the drag (but never while a touch drag is live)
  }

  // Off the overworld (the Backspace), the current World runs its own much
  // smaller update: the player, the world's own entities/ambience via its
  // update() hook, the camera, and the way back up — everything else in this
  // function (obelisks, the W-factory, animals, day/night, RON resupply, lore
  // terminals...) belongs to the overworld and simply holds still while you're
  // not there to see it, because it only ticks on a combat island (CALYPSO or a
  // martial daemon island like POLYPHEMUS). Non-combat worlds (the Backspace,
  // ITHACA) run the slim loop below.
  if (!currentWorld.combat) {
    // NO PURGE WEATHER OFF AN ISLAND. `poseidonFog` is a module-level number and
    // `updateFog` — the only thing that winds it back down — lives past the
    // return below, so walking into the Backspace mid-purge used to carry the
    // grey wash in with you and leave it standing over a fluorescent-lit
    // interior. Zeroed here rather than only on the world switch, so no override
    // (the `fog HIGH` hold) or later code path can put it back while you are
    // somewhere the network cannot reach.
    poseidonFog = 0;
    player.update(dt, input, map, [], [], mouseWorld);
    currentWorld.update(dt, player); // the lurker + the ambient shrieks
    camera.follow(player.x, player.y, dt, playerElevSteps());
    if (player._ubikTeleportCooldown > 0) player._ubikTeleportCooldown -= dt;
    // R4: the Backspace is an ALTERNATIVE CROSSING ROAD — the road of the dead. It
    // is littered with labelled doors, one per island (each drawn with its name on
    // an isometric EXIT sign). Walk up to the door of the island you want and you
    // come up THERE — no menu, the doors ARE the choice. The pick rides the normal
    // pendingCrossing path (performed at the next frame top, against a clean map).
    else if (currentWorld.exits) {
      for (const e of currentWorld.exits) {
        if (Math.hypot(player.x - e.x, player.y - e.y) < 1.7) {
          pendingCrossing = e.island;   // worldById resolves it; null falls through harmlessly
          player._ubikTeleportCooldown = UBIK_TELEPORT_COOLDOWN;
          sfx.play('zap');
          break;
        }
      }
    }
    return;
  }

  // Weapons target robots and water droids alike (a combined foe list, only
  // for the player's own targeting — each still updates on its own array).
  const foes = currentWorld.waterdroids.length ? currentWorld.robots.concat(currentWorld.waterdroids) : currentWorld.robots;
  player.update(dt, input, map, currentWorld.animals, foes, mouseWorld);
  updateWaterDroids(dt, currentWorld.waterdroids, player, map);
  // Advance in-flight rounds. Most are cosmetic tracers at PROJECTILE_SPEED; a
  // few carry their own slower speed (R3's torpor bolt crawls so it can be
  // dodged).
  for (const p of map.projectiles) {
    const dist = Math.hypot(p.x1 - p.x0, p.y1 - p.y0) || 0.001;
    p.prog += ((p.speed ?? PROJECTILE_SPEED) * dt) / dist;
  }
  if (map.projectiles.length) {
    // A torpor bolt (depart mode) resolves ON ARRIVAL: it detains only if you are
    // still near where it was aimed (x1/y1, your position at fire time). Step
    // away and it lands on empty sand — a real dodge. Everything else is a
    // cosmetic tracer that simply expires at prog >= 1.
    for (const p of map.projectiles) {
      if (p.prog >= 1 && p.kind === 'torpor' && !p._resolved) {
        p._resolved = true;
        if (Math.hypot(player.x - p.x1, player.y - p.y1) <= TORPOR_BOLT_HIT_R) {
          if (player.detainHit) player.detainHit(p.dmg ?? 5, 'machine'); else player.takeDamage(p.dmg ?? 5, 'machine');
        } else {
          sfx.play('keydrop'); // a soft puff as it settles into the ground, missing
        }
      }
    }
    map.projectiles = map.projectiles.filter((p) => p.prog < 1);
  }

  // Dropped items decay off the ground so the world doesn't silt up with
  // salvage — perishables (meat, berries) go fast, common scrap/materials
  // slower, and real prizes (weapons, keys, chips, a backpack) linger a good
  // long while. Aged centrally here rather than at the ~20 push sites; each
  // item's `age` ticks up and it fades/flickers (gi.fade, drawn by the
  // renderer) over its last few seconds before it's culled. Items flagged
  // `keep` (world-placed loot) never age — only stuff dropped during play does,
  // so the world isn't stripped bare before you find it.
  if (map.groundItems && map.groundItems.length) {
    for (const gi of map.groundItems) {
      if (gi.keep) { gi.fade = 1; continue; }
      gi.age = (gi.age || 0) + dt;
      const life = groundLifetime(gi.item);
      gi.fade = life === Infinity ? 1 : Math.min(1, (life - gi.age) / GROUND_ITEM_FADE);
    }
    map.groundItems = map.groundItems.filter((gi) => gi.keep || gi.age < groundLifetime(gi.item));
  }

  // Timed bombs: tick fuses, then detonate — a fire cloud that hurts every
  // living thing in its radius (the player included), and an insane bomb
  // brings down an obelisk it engulfs.
  for (const b of map.bombs) {
    b.fuse -= dt;
    if (b.fuse > 0) continue;
    b.done = true;
    sfx.play('charge');
    map.explosions.push({ x: b.x, y: b.y, radius: b.radius, ttl: 0.8, max: 0.8 });
    player.detonateBomb(b, map, currentWorld.animals, currentWorld.robots, currentWorld.waterdroids, currentWorld.obeliskObjs);
  }
  if (map.bombs.some((b) => b.done)) map.bombs = map.bombs.filter((b) => !b.done);
  for (const e of map.explosions) e.ttl -= dt;
  if (map.explosions.length) map.explosions = map.explosions.filter((e) => e.ttl > 0);
  if (map.sparks && map.sparks.length) {
    for (const s of map.sparks) s.ttl -= dt;
    map.sparks = map.sparks.filter((s) => s.ttl > 0);
  }
  // Ubik's brightening is a temporary win, not a permanent one: each patch
  // ages and fades back to the ordinary, decayed world over UBIK_PATCH_LIFE
  // (portals hold much longer, UBIK_PORTAL_LIFE), rather than lifting a spot
  // of ground forever. A portal no longer links to another overworld spot —
  // every tear is a way down into the one shared underworld pocket instead
  // (see game/underworld.js and enterBackspace() above).
  if (map.ubikPatches && map.ubikPatches.length) {
    for (const p of map.ubikPatches) p.t += dt;
    map.ubikPatches = map.ubikPatches.filter((p) => p.t < (p.portal ? UBIK_PORTAL_LIFE : UBIK_PATCH_LIFE));
    const portals = map.ubikPatches.filter((p) => p.portal);
    if (player._ubikTeleportCooldown <= 0) {
      for (const p of portals) {
        if (Math.hypot(p.x - player.x, p.y - player.y) > UBIK_TELEPORT_RANGE) continue;
        enterBackspace();
        player._ubikTeleportCooldown = UBIK_TELEPORT_COOLDOWN;
        sfx.play('zap');
        // Crucial: `map` is now the underworld pocket. Bail out of the rest
        // of this (overworld) update tick — revealAround, obelisks, the
        // factory, animals etc. all assume the overworld map and would run
        // against the wrong one this frame (revealAround in particular reads
        // map.explored, which the pocket doesn't have). Next frame the
        // off-overworld branch (currentWorld !== calypso) at the top takes over.
        return;
      }
    }
  }

  // HERMES relays trickle-charge off their solar cells (slow). Watch the gauge
  // recover when you're not leaning on a relay.
  for (const t of torObjs) {
    if (t.battery == null) t.battery = 1;
    else if (t.battery < 1) t.battery = Math.min(1, t.battery + 0.006 * dt);
  }
  if (terminalKind === 'hermes' && obTermEl.style.display === 'flex') updateHermesBattEl();

  // RON resupply: every couple of minutes, one already-emptied cache gets
  // quietly restocked with a fresh drop of batteries, ammo or shells.
  ronResupplyClock += dt;
  if (ronResupplyClock > ronResupplyNext) {
    ronResupplyClock = 0;
    ronResupplyNext = 90 + Math.random() * 60;
    // A cache on blighted ground does NOT come back: RON's supply line is cut
    // where the land is dead. So the blight does not only look bad, it starves
    // the map — one of the teeth that makes felling the towers imperative.
    const emptyBoxes = map.objects.filter((o) => {
      if (o.type !== 'box' || !o.opened) return false;
      const f = map.floorAt(o.x, o.y);
      return f !== 'blight' && f !== 'blight_sick';
    });
    if (emptyBoxes.length) {
      const box = emptyBoxes[Math.floor(Math.random() * emptyBoxes.length)];
      const r = Math.random();
      box.loot = r < 0.4 ? [{ item: 'battery', qty: 4 }] : r < 0.7 ? [{ item: 'ammo', qty: 12 }] : [{ item: 'shells', qty: 8 }];
      box.opened = false;
    }
  }

  // The W-factory: while any obelisk is damaged (OB_gun scorched but standing),
  // flagged for rebuild, or pinned in a AI-ML loop, it fields a single W3 to go
  // and mend the nearest one. Only one W3 is ever out at a time. Checked on a
  // short clock (~6-11s) so a repair drone actually comes out while the tower is
  // still in that state — the old 60-120s clock almost never lined up with the
  // brief damaged window, so repair drones were essentially never seen.
  if (factoryLive()) {
    wFactoryClock += dt;
    if (wFactoryClock > wFactoryNext) {
      wFactoryClock = 0;
      wFactoryNext = 6 + Math.random() * 5;
      // Anything the crew can mend, now including fully-toppled towers — the
      // factory sends a drone to raise them again until you bring it down.
      const anyRepairable = currentWorld.obeliskObjs.some((o) => o.destroyed || o.obDamage > 0 || o.frozen);
      const w3Active = currentWorld.robots.some((r) => r.type === 'w3' && !r.dead);
      if (anyRepairable && !w3Active) {
        const drone = spawnW3(map, Math.floor(Math.random() * 0x7fffffff), factoryCx(), factoryCy());
        if (drone) { currentWorld.robots.push(drone); player.say('A repair drone whirs out of the W-factory.'); }
      }
    }
    // A W5 gardener drone: no trigger, no urgency — the factory just keeps
    // roughly one out in the world at all times, unconditional on anything
    // else happening. Kill the factory and it stops being replaced, same as
    // every other machine here, but the ambient forest-regrowth timer in
    // its own block below keeps ticking regardless — this is a visible
    // companion to that, not the whole mechanism.
    wFactoryW5Clock += dt;
    if (wFactoryW5Clock > wFactoryW5Next) {
      wFactoryW5Clock = 0;
      wFactoryW5Next = 30 + Math.random() * 40;
      const w5Count = currentWorld.robots.reduce((n, r) => n + (r.type === 'w5' && !r.dead ? 1 : 0), 0);
      if (w5Count < 2) {
        const gardener = spawnW5(map, Math.floor(Math.random() * 0x7fffffff), factoryCx(), factoryCy());
        if (gardener) { currentWorld.robots.push(gardener); player.say('A small drone trundles out of the W-factory, unhurried.'); }
      }
    }
    wFactoryW1Clock += dt;
    if (wFactoryW1Clock > wFactoryW1Next) {
      wFactoryW1Clock = 0;
      wFactoryW1Next = 100 + Math.random() * 80;
      const liveW1 = currentWorld.robots.filter((r) => r.type === 'w1' && !r.dead).length;
      if (liveW1 < 3) {
        const wave = spawnW1s(map, Math.floor(Math.random() * 0x7fffffff), factoryCx(), factoryCy(), 2 + Math.floor(Math.random() * 2));
        if (wave.length) { currentWorld.robots.push(...wave); player.say('The W-factory dispatches a hunting wave.'); }
      }
    }
    // Re-garrison: when an obelisk realises it has no guards left (its home
    // T1/T2s destroyed), the factory builds a fresh T1 or T2 and sends it over
    // to guard and patrol that specific tower. Prioritises the most exposed
    // (fewest guards), one at a time on a slow clock.
    wFactoryGuardClock += dt;
    if (wFactoryGuardClock > wFactoryGuardNext) {
      wFactoryGuardClock = 0;
      wFactoryGuardNext = 40 + Math.random() * 40;
      const MIN_GUARDS = 2, HOME_R = 8;
      const guardsOf = (ob) => currentWorld.robots.filter((r) => !r.dead && !r.friendly
        && (r.type === 't1' || r.type === 't2')
        && Math.hypot(r.home.x - (ob.x + 0.5), r.home.y - (ob.y + 0.5)) < HOME_R).length;
      let worst = null, worstCount = MIN_GUARDS;
      for (const ob of currentWorld.obeliskObjs) {
        if (ob.destroyed) continue;
        const g = guardsOf(ob);
        if (g < worstCount) { worstCount = g; worst = ob; }
      }
      if (worst) {
        const type = Math.random() < 0.5 ? 't1' : 't2';
        const guard = spawnGuard(map, Math.floor(Math.random() * 0x7fffffff), factoryCx(), factoryCy(),
          type, { x: worst.x + 0.5, y: worst.y + 0.5 });
        if (guard) {
          currentWorld.robots.push(guard);
          player.say(`The W-factory builds a ${type.toUpperCase()} and sends it to re-garrison ${worst.code}.`);
        }
      }
    }

    if (wFactoryW4Cooldown > 0) wFactoryW4Cooldown = Math.max(0, wFactoryW4Cooldown - dt);

    // A W4 also rolls off the factory floor every 30 minutes of game time
    // (not real time), independent of the attack-triggered dispatch above.
    if (dayNight.totalHours - lastW4GameHour >= 0.5) {
      lastW4GameHour = dayNight.totalHours;
      const liveW4 = currentWorld.robots.filter((r) => r.type === 'w4' && !r.dead).length;
      if (liveW4 < 3) {
        const w4 = spawnW4(map, Math.floor(Math.random() * 0x7fffffff), factoryCx(), factoryCy());
        if (w4) { currentWorld.robots.push(w4); player.say('The W-factory rolls out another W4 hunter-killer.'); }
      }
    }
  }

  // Trees grow: saplings thicken over about a minute, and now and then a new
  // one sprouts on open grass, so felled forest slowly comes back.
  for (const o of map.objects) {
    if (o.type === 'tree' && o.grow != null && o.grow < 1) o.grow = Math.min(1, o.grow + dt / 60);
  }
  regrowClock += dt;
  if (regrowClock > 22) {
    regrowClock = 0;
    for (let t = 0; t < 20; t++) {
      const rx = Math.floor(Math.random() * map.w), ry = Math.floor(Math.random() * map.h);
      if (map.floorAt(rx, ry) === 'grass' && !map.objectAt(rx, ry) && (!map.heightAt || map.heightAt(rx, ry) === 0)) {
        map.addObject('tree', rx, ry, { variant: Math.floor(Math.random() * 3), grow: 0.3 });
        break;
      }
    }
  }

  // Autosave the run every few seconds.
  saveClock += dt;
  if (saveClock >= 8) { saveClock = 0; persist(); }
  updateAnimals(dt, currentWorld.animals, player, map);
  updateBirds(dt, currentWorld.birds, currentWorld.animals, player, map);
  // Calypso's channel: her texts + her interventions against POSEIDON's machines,
  // only on her island (Ogygia is a combat world, so its robots are live here).
  if (currentWorld.keeper) updateNokiaKeeper(dt);
  // (Robots' AI now ticks inside systems.runUpdate below — order 30, before
  //  fortress at 35, which reads this-frame robot aggro. See robots.js.)
  // Choir light-flash sync: while the piece plays, each singing machine's red
  // light pulses to the notes of its assigned vocal part, so the row of them
  // blinks out of step like a choir. (r.choirFlash is read by sensorStyle; it
  // reads robots from just before this frame's tick, but a one-frame lag on an
  // audio-synced light flicker is imperceptible.)
  const choirT = sfx.choirElapsed();
  if (choirT >= 0) {
    let nearestSinger = Infinity;
    for (const r of currentWorld.robots) {
      if (!r.singing) continue;
      const band = CHOIR_REGISTERS[(r.choirVoice || 0) % 4];
      let last = -1;
      for (let i = band.length - 1; i >= 0; i--) { if (band[i] <= choirT) { last = band[i]; break; } }
      r.choirFlash = last >= 0 ? Math.max(0, 1 - (choirT - last) / 0.4) : 0;
      nearestSinger = Math.min(nearestSinger, Math.hypot(r.x - player.x, r.y - player.y));
    }
    // Walk away and the singing quietens: full within ~6 tiles, fading to a
    // faint distant hush by ~22 tiles.
    const vol = nearestSinger === Infinity ? 0 : Math.max(0.05, Math.min(1, 1 - (nearestSinger - 6) / 16));
    sfx.setChoirVolume(vol);
  }
  map.updateShakes(dt);
  // Registered systems tick here, sorted by `order`: dayNight (20), robots (30),
  // fortress (35), lore (80). This is the normal-play update point — below the
  // paused/resting/driving gates, which keep their own explicit ticks (the hub
  // keeps the gates). The world-contract bag carries everything a system reads.
  //   robots: every machine's AI + separation (draw stays in the renderer sort).
  //   fortress: swings the doorway, lights the maze way-out, runs the breach
  //   alarm — on alarm `stir` flares the obelisks red and sends a W4, `calm`
  //   unwinds it. dayNight: advances the day/night clock. robots
  //   ticks before fortress so fortress sees this-frame aggro (see robots.js).
  systems.runUpdate({ dt, player, input, map, camera, robots: currentWorld.robots, animals: currentWorld.animals, birds: currentWorld.birds, dayNight, worldStir, fortress });
  // Push the player out of any machine/animal body he ended the tick overlapping.
  // Must run after everyone has moved — robots now move inside runUpdate above,
  // so this sits just below it (separate() nudges both bodies; see collision.js).
  resolveBodyOverlaps(player, currentWorld.animals, currentWorld.robots);
  // Time's up: POSEIDON comes online. Every obelisk lights up and links
  // to every other in a web of lasers, and the factory throws wave after
  // wave of W4s at you — indefinitely. There's no timer to survive to; it
  // simply doesn't stop, and the run ends only when it finally catches you
  // (see dieToSkylink in player.js).
  // ...but not while a tower it needs is still down and being rebuilt — that
  // suspension is the player's reprieve, and POSEIDON only (re)lights once the
  // repair drone has raised every flagged tower back up.
  if (dayNight.hoursLeft() <= 0 && !player.skylinkActive && !player.deathCert && !player._ended
    && !currentWorld.obeliskObjs.some((o) => o.needsRebuild)) {
    player.skylinkActive = true;
    skylinkW4Clock = 0;
    player.say('POSEIDON comes online. Every obelisk blazes and turns on you at once.');
    dispatchSkylinkW4s(6); // the opening salvo
  }
  if (player.skylinkActive && !player._ended) {
    skylinkW4Clock += dt;
    if (skylinkW4Clock > 1.2) {
      skylinkW4Clock = 0;
      const liveW4 = currentWorld.robots.filter((r) => r.type === 'w4' && !r.dead).length;
      if (liveW4 < SKYLINK_MAX_W4) dispatchSkylinkW4s(2 + Math.floor(Math.random() * 3));
    }
  }
  tickObHolds(dt);   // the control verbs' overrides run down and hand back
  tickSirenRepair(dt); // nothing standing? the siren's wreck sends a T1a
  updateBlight(dt);
  camera.follow(player.x, player.y, dt, playerElevSteps());
  if (map.objects.length !== lastObjectCount) {
    lastObjectCount = map.objects.length;
    minimap.refresh(map); // felled trees disappear from the minimap
  }

  // Reveal fog as the player moves.
  const ptx = Math.floor(player.x), pty = Math.floor(player.y);
  if (ptx !== lastRevealX || pty !== lastRevealY) {
    lastRevealX = ptx; lastRevealY = pty;
    revealAround(ptx, pty);
  }

  // Ambience follows the clock; creature calls fire on state transitions.
  // Crickets are a dusk sound only: late afternoon into early evening.
  const dusk = dayNight.hour >= 16.5 && dayNight.hour < 20;
  if (dusk !== wasDusk) {
    wasDusk = dusk;
    sfx.setAmbience({ dusk });
  }
  const night = dayNight.isNight();
  if (night !== wasNight) {
    wasNight = night;
    sfx.setAmbience({ night });
  }
  // The ambient piano only plays in calm moments: silent while anything is
  // actively aggroed on the player and close enough to matter.
  let underThreat = false;
  for (const a of currentWorld.animals) {
    if (a.dead) continue;
    const close = Math.hypot(a.x - player.x, a.y - player.y) < 18;
    if (a.type === 'dog') {
      if (a.aggro && close) underThreat = true;
      if (a.aggro && !a._sBark && close) { a._sBark = true; sfx.play('bark'); }
      if (!a.aggro) a._sBark = false;
    } else if (a.type === 'boar') {
      if (close && (a.state === 'telegraph' || a.state === 'charge')) underThreat = true;
      if (a.state !== a._sState) {
        if (close && a.state === 'telegraph') sfx.play('boar');
        if (close && a.state === 'charge') sfx.play('charge');
        a._sState = a.state;
      }
    }
  }
  for (const b of currentWorld.birds) {
    if (b.shrieking && !b._sShriek) { b._sShriek = true; sfx.play('shriek'); }
    if (!b.shrieking) b._sShriek = false;
  }
  let nearestRobot = Infinity;
  for (const r of currentWorld.robots) {
    if (r.dead) continue;
    const hunting = r.state === 'chase' || r.chasing || r.aggro;
    const dist = Math.hypot(r.x - player.x, r.y - player.y);
    const close = dist < 16;
    if (hunting && close) underThreat = true;
    if (hunting && !r._sHunt && close) {
      r._sHunt = true;
      sfx.play('charge');
    }
    if (!hunting) r._sHunt = false;
    // Any active machine, hunting or not, is a "nearby robot" for the drone
    // and the crickets — they are scared of the machines themselves, not
    // just of being hunted.
    if (!r.drained && !r.fused && r.disabledT <= 0 && dist < nearestRobot) nearestRobot = dist;
  }
  sfx.setMusicTension(underThreat);

  // A quiet drone swells as a machine closes in; the crickets fall silent
  // near any active robot, unsettled by them.
  sfx.setDrone(nearestRobot < 16 ? 1 - nearestRobot / 16 : 0);
  const robotNear = nearestRobot < 14;
  if (robotNear !== wasRobotNear) {
    wasRobotNear = robotNear;
    sfx.setAmbience({ robotNear });
  }

  // Obelisks sense a human close by: their light deepens toward blood-red
  // and holds, and nearby non-aggro robots get nudged to sweep near the
  // tower — a report of closeness, never an exact position.
  let sirenPull = false, sirenResisted = false; // for the once-only song messages
  for (const ob of currentWorld.obeliskObjs) {
    if (ob.burning > 0) ob.burning -= dt; // OB_gun flame timer, ticked for the renderer
    if (ob.frozen) ob.frozenT = (ob.frozenT || 0) + dt; // CPU-burn age for the renderer's smoke ramp
    // Blinding the panopticon eye (crash/destroy it) puts it out: the island goes
    // deaf to you. Handle the transition before the destroyed-skip below.
    if (ob.cls === 'eye' && ob.destroyed && player._underEye) {
      player._underEye = false;
      player.say('The great eye goes dark — blinded. The island is deaf to you now.');
    }
    if (ob.destroyed) continue;
    const d = Math.hypot(ob.x + 0.5 - player.x, ob.y + 0.5 - player.y);
    if (ob.cls === 'eye') {
      // POLYPHEMUS's panopticon: the single eye detects by LINE OF SIGHT across a
      // huge range. In its line, alert climbs and it names you to the island; break
      // the line (terrain, ruins, the fortress, forest) and it loses you and calms.
      const EYE_RANGE = 42;
      // Cast from just OUTSIDE the eye's own (solid) obelisk tile toward the
      // player, so the tower doesn't block its own line of sight.
      const edx = player.x - (ob.x + 0.5), edy = player.y - (ob.y + 0.5), edd = Math.hypot(edx, edy) || 1;
      const sx = ob.x + 0.5 + (edx / edd) * 1.3, sy = ob.y + 0.5 + (edy / edd) * 1.3;
      ob._eyeSees = d < EYE_RANGE && map.hasLineOfSight(sx, sy, player.x, player.y);
      ob.alert = ob._eyeSees ? Math.min(1, ob.alert + dt * 1.1) : Math.max(0, ob.alert - dt * 0.55);
    } else if (d < 9) {
      ob.alert = Math.min(1, ob.alert + dt * 1.5);
    } else {
      ob.alert = Math.max(0, ob.alert - dt * 0.4);
    }
    // SIREN class: within range its song pulls you toward it — a gentle drift
    // that's stronger the closer you are. Playing a tape on the walkman drowns
    // it out (your own dearer noise), so the pull only bites when nothing's
    // playing. (home-04 lore, made mechanic.)
    if (ob.cls === 'siren' && player.health > 0) {
      const SONG_RANGE = 7;
      if (d < SONG_RANGE) {
        if (player.walkmanSide == null) {
          const strength = 0.95 * (1 - d / SONG_RANGE); // tiles/sec at the edge → up close
          const inv = 1 / (d || 1);
          player.moveAxis((ob.x + 0.5 - player.x) * inv * strength * dt, 0, map);
          player.moveAxis(0, (ob.y + 0.5 - player.y) * inv * strength * dt, map);
          sirenPull = true;
        } else {
          sirenResisted = true;
        }
      }
    }
    // Occasional blink, independent of alert: a short bright flash, then a
    // random quiet spell before the next one. Alert makes it flicker faster.
    ob._blinkT -= dt;
    if (ob._blinkT <= 0) {
      ob.blinkFlash = 0.18;
      ob._blinkT = (2 + Math.random() * 5) * (1 - ob.alert * 0.6);
    }
    if (ob.blinkFlash > 0) ob.blinkFlash = Math.max(0, ob.blinkFlash - dt);

    if (ob.alert > 0.5) {
      ob._nudgeT -= dt;
      if (ob._nudgeT <= 0) {
        ob._nudgeT = 2.5;
        for (const r of currentWorld.robots) {
          if (r.dead || r.drained || r.fused || r.friendly || r.disabledT > 0 || r.aggro) continue;
          if (Math.hypot(r.x - ob.x, r.y - ob.y) > 18) continue;
          r.wanderTarget = {
            x: ob.x + 0.5 + (Math.random() * 12 - 6),
            y: ob.y + 0.5 + (Math.random() * 12 - 6),
          };
          r.wanderTimer = 4;
        }
      }
    }
    // The panopticon's bite: while the eye holds you in its line, the island turns
    // your way — machines within reach aggro straight onto YOU (not just toward the
    // tower). First sight flares the whole network; losing the line lets it go.
    if (ob.cls === 'eye') {
      if (ob._eyeSees && ob.alert > 0.5) {
        if (!player._underEye) {
          player._underEye = true;
          worldStir.stir(); // the network flares awake
          player.say('The great eye fixes on you. The whole island wakes and turns your way — break its line of sight.');
        }
        ob._eyeStirT = (ob._eyeStirT || 0) - dt;
        if (ob._eyeStirT <= 0) {
          ob._eyeStirT = 2.5;
          for (const r of currentWorld.robots) {
            if (r.dead || r.drained || r.fused || r.friendly || r.disabledT > 0) continue;
            if (Math.hypot(r.x - player.x, r.y - player.y) > 40) continue;
            r.aggro = true;
            r.wanderTarget = { x: player.x, y: player.y };
            r.wanderTimer = 5;
          }
        }
      } else if (player._underEye && ob.alert < 0.2) {
        player._underEye = false;
        player.say("You slip out of the eye's line, and the island loses your scent.");
      }
    }
  }

  // SHARED SIGHT (POSEIDON). Off the network, a tower only stirs robots near
  // ITSELF toward itself. Once POSEIDON wakes, the towers see as one: the instant
  // ANY live tower has you, the network feeds your position to hunters across the
  // map and they converge on YOU, not on a tower — and breaking one tower's line
  // no longer hides you, because the others are still watching. The reach shrinks
  // with the network, so cutting towers is felt here too: fell or jam enough and
  // the pooled sight collapses.
  if (player.skylinkActive && !player._ended && currentWorld.combat) {
    const obs = currentWorld.obeliskObjs || [];
    const live = obs.filter(obeliskLive);
    // `sight OFF` at a terminal cuts the net without felling anything, and
    // `sight ON` puts it back. Otherwise the towers decide, as they always did.
    const netHasYou = (obSightHold.on !== null && obSightHold.t > 0)
      ? obSightHold.on
      : live.some((o) => (o.alert || 0) > 0.4);
    _netSightT -= dt;
    if (netHasYou && _netSightT <= 0) {
      _netSightT = 1.4;
      // Reach scales with how much of the network still stands: map-wide with the
      // towers up, tightening to a local radius as they come down.
      const frac = live.length / (obs.length || 1);
      const reach = 10 + 52 * frac;
      for (const r of currentWorld.robots) {
        if (r.dead || r.drained || r.fused || r.friendly || r.recharging || r.disabledT > 0) continue;
        if (Math.hypot(r.x - player.x, r.y - player.y) > reach) continue;
        r.aggro = true;
        r.seenX = player.x; r.seenY = player.y; r.seenT = 0;   // the net just told it where you are
      }
      if (!player._netSeen) {
        player._netSeen = true;
        player.say('The towers pass you between them like a word. Every machine that can reach you turns your way.');
      }
    } else if (!netHasYou && player._netSeen && live.length === 0) {
      // The network is broken: the shared sight is gone for good.
      player._netSeen = false;
      player.say('The last tower falls dark. The net lets go of you.');
    }
  }

  // Once-only lines as the song takes hold and as it lets go.
  if (sirenPull && !player._underSong) {
    player._underSong = true;
    player.say('A song rises from a teal-lit tower, and your feet begin to turn toward it. Start a tape to drown it out.');
  } else if (!sirenPull && player._underSong) {
    player._underSong = false;
    player.say(sirenResisted ? 'Your own noise drowns the song out.' : 'The song thins behind you and lets go.');
  }
}

function frame(now) {
  const elapsed = Math.min(0.25, (now - last) / 1000);
  last = now;
  acc += elapsed;
  while (acc >= STEP) {
    update(STEP);
    acc -= STEP;
  }
  checkMilestones(); // auto-snapshot stage checkpoints as they're reached
  if (now - _lastAutosave > 8000) { _lastAutosave = now; persist(); } // keep Continue current (position + loot), not just on events

  if (now - lastRenderTime >= MIN_RENDER_MS) {
    lastRenderTime = now;
    const amb = currentWorld.ambience;
    renderer.obColor = currentWorld.obColor; renderer.obAlertColor = currentWorld.obAlertColor; // R1: per-island OB eye hue
    // The obelisk BODY takes the island's theme colour too (not just the eye) —
    // except on Calypso's Ogygia, where the towers stay near-black as they were.
    renderer.obBodyTint = currentWorld.id === 'calypso' ? null : currentWorld.obColor;
    renderer.draw(camera, map, player, currentWorld.animals, {
      fps,
      version: VERSION,
      // Render mood comes from the world's ambience: calypso uses the day/night
      // clock (light:null); the Backspace is fullbright with its own veil below.
      // The Backspace's empty entity arrays blank the overworld for free.
      light: amb.light != null ? amb.light : dayNight.light(),
      dawnGlow: amb.dawnGlow ? dayNight.dawnGlow() : 0,
      timeLabel: dayNight.countdownLabel,
      // The Scylla/Charybdis arcade run, while it has the helm.
      narrows: (strait && strait.phase === 'choice') ? strait.run : null,
      narrowsOver: (strait && strait.phase === 'choice') ? strait.gameover : null,
      pong: pong ? pong.run : null,
      pongOver: pong ? pong.gameover : null,
      poseidonFog: poseidonFog > 0.01 ? { n: poseidonFog, goggles: player.gogglesOn } : null,
      place: hudPlace(),      // the island you are on, by its chart name
      daemon: hudDaemon(),    // { name, fallen } — null where nothing rules
      minimap: (amb.minimap && showMinimap) ? minimap : null,
      birds: currentWorld.birds,
      robots: currentWorld.robots,
      waterdroids: currentWorld.waterdroids,
      underworld: amb.underworld,
      uwCreatures: currentWorld.creatures,
      lore,
      torch: player.pockets.some((s) => s && s.item === 'torch'),
      showBackpack,
      mouse: { x: input.mouseX, y: input.mouseY },   // hover state for the HUD panel buttons
      menuOpen: hudMenuOpen,
      detail: detail || hoverSlotTip(),
      toast,
      nokiaToast: nokia.current,
      nokiaSignal: nokiaSignalBars(),
      seaFog: seaFogState(), // Poseidon's fog on the failed crossing (null otherwise)
      touchControls: touchLike,
      touchRunHeld: input._touchRun,
      drag: drag ? { ...drag, mx: input.mouseX, my: input.mouseY } : null,
      deathCert: player.deathCert,
      aiVictory: player.aiVictory,
      showSkills,
      daemonsDown,                 // the Archipelago tally, for the Record panel
      islandsReached: Object.keys(player._welcomed || {}).length,
      showWeapons,
      craftPrompt: (player.canCraftObGun() && player.hands !== 'obgun') || (player.canCraftWaveGun() && player.hands !== 'wavegun') || player.canCraftChip() || player.canCraftSword() || player.canCraftFortressMap() || player.canCraftGreekShip(map) || player.canCraftGoggles() || player.canCraftBoat(map),
      craftWaveGun: player.canCraftWaveGun() && player.hands !== 'wavegun',
      craftChip: player.canCraftChip() && !player.canCraftWaveGun() && !(player.canCraftObGun() && player.hands !== 'obgun'),
      craftSword: player.canCraftSword() && !player.canCraftChip() && !player.canCraftWaveGun() && !(player.canCraftObGun() && player.hands !== 'obgun'),
      // Lowest craft priority (see the C chain): the boat prompt shows only when
      // no weapon/tool/map craft is pending, so it never contradicts what C does.
      craftGreekShip: player.canCraftGreekShip(map) && !player.canCraftChip() && !player.canCraftSword() && !player.canCraftWaveGun() && !player.canCraftFortressMap() && !(player.canCraftObGun() && player.hands !== 'obgun'),
      craftGoggles: player.canCraftGoggles() && !player.canCraftGreekShip(map) && !player.canCraftChip() && !player.canCraftSword() && !player.canCraftWaveGun() && !player.canCraftFortressMap() && !(player.canCraftObGun() && player.hands !== 'obgun'),
      craftBoat: player.canCraftBoat(map) && !player.canCraftGoggles() && !player.canCraftGreekShip(map) && !player.canCraftChip() && !player.canCraftSword() && !player.canCraftWaveGun() && !player.canCraftFortressMap() && !(player.canCraftObGun() && player.hands !== 'obgun'),
      // POSEIDON is a combat-island network — its lights/lines must never draw
      // over the Backspace or peaceful ITHACA.
      skylinkActive: player.skylinkActive && !player._ended && currentWorld.combat,
      obeliskObjs: currentWorld.obeliskObjs,
      paused,
      rest: resting ? { dim: restDim(resting.t) } : null,
      ubikFlicker: player.ubikFlickerT || 0,
      ubikFlickerX: player.ubikFlickerX || player.x,
      ubikFlickerY: player.ubikFlickerY || player.y,
      musicMode: sfx.musicMode, // the walkman's reels spin only while its side is what's actually playing
      driving: !!driveState,    // suppress the normal HUD; the robot-vision overlay takes over
    });
    // Robot-vision: resample the just-drawn scene as ASCII + a Terminator HUD.
    if (driveState) drawDriveOverlay(now);
    frameCount += 1;
    // The world is on screen. Tell the boot loader to stand down — after the
    // FIRST successful draw, not on module eval, so "ready" means genuinely
    // painted, not merely parsed.
    if (!_firstFramePainted) {
      _firstFramePainted = true;
      try { window.dispatchEvent(new CustomEvent('nostos:progress', { detail: { step: 'ready' } })); } catch (_) { /* no-op */ }
      try { window.dispatchEvent(new Event('nostos:ready')); } catch (_) { /* no-op */ }
    }
  }

  fpsClock += elapsed;
  if (fpsClock >= 1) {
    fps = frameCount;
    frameCount = 0;
    fpsClock -= 1;
  }
  requestAnimationFrame(frame);
}
// Stage 1c: resume on the island the save left you on. CALYPSO is already the live
// world; for ITHACA, regenerate it and switch there at the saved position. Done
// last — after every other init — so no earlier module-eval runs against the wrong
// map. onEnter (the homecoming/arrival beat) is suppressed here: a reload is a
// resume, not a fresh landfall.
if (_bootIsland && _bootIsland !== 'calypso') {
  const dest = worldById(_bootIsland);
  if (dest) {
    const arrival = dest.onEnter;
    dest.onEnter = () => {};   // a reload is a resume, not a fresh arrival/homecoming
    goToWorld(dest);
    dest.onEnter = arrival;
    if (_bootPos && typeof _bootPos.x === 'number') { player.x = _bootPos.x; player.y = _bootPos.y; camera.snap(player.x, player.y); }
  }
}
// R3: seed the detain flag from the world we actually boot on (the Calypso start
// never routes through goToWorld, so set it here too). Depart mode → her guards detain.
player.detainMode = currentWorld.winMode === 'depart';

// The carrier's roaming welcome for the island we boot onto (Calypso never runs
// its onEnter — a boot is a resume, not an arrival — so fire it here). On a
// resumed save the once-per-run guard is fresh, so it greets you again; harmless.
islandWelcome(currentWorld.id);

// Rescue any save that was already stranded on the water (an older build could
// autosave you mid-voyage; the new guard above stops fresh ones). If the boot
// position is a sea/water tile, spiral outward to the nearest walkable land and
// stand the player there, so a Continue never drops you marooned offshore. Also
// clears aboard, which is never persisted but belt-and-braces.
player.aboard = null;
{
  const wet = (x, y) => {
    const f = map.floorAt(Math.floor(x), Math.floor(y));
    return f === 'sea' || f === 'water' || f == null;
  };
  if (wet(player.x, player.y)) {
    let best = null;
    for (let r = 1; r <= 40 && !best; r++) {
      for (let dy = -r; dy <= r && !best; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; // ring only
          const nx = Math.floor(player.x) + dx, ny = Math.floor(player.y) + dy;
          if (!map.inBounds || !map.inBounds(nx, ny)) continue;
          const f = map.floorAt(nx, ny);
          if (f && f !== 'sea' && f !== 'water' && !(map.isSolid && map.isSolid(nx, ny))) {
            best = { x: nx + 0.5, y: ny + 0.5 }; break;
          }
        }
      }
    }
    if (best) {
      player.x = best.x; player.y = best.y;
      camera.snap(player.x, player.y);
      player.say('You come to on the shore, soaked, the boat nowhere in sight. However you got here, you are ashore now.');
    }
  }
}
requestAnimationFrame(frame);
