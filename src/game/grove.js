// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// F2a (docs/calypso-build-plan.md) — what stands on Ogygia instead of a fortress.
//
// F1 took the fortress's BEHAVIOUR off her island and left the object, because
// main.js hangs her core, her name and her save state off `world.hold`. This
// is the object. It builds into the same southern annex createFortress uses —
// that mechanism is good, it costs the overworld no ground — and then does none
// of the things a fortress does:
//
//   NO RAMPART, NO GATE, NO DOORS. The way in is a gap in the trees.
//   NO LABYRINTH. The maze is drawn on the floor in light instead, and you can
//     walk straight across it.
//   NO QUAD, NO MUSTER, NO GARRISON, NO ALARM, NO REINFORCEMENT.
//   NO WALLS AT ALL (David, 2026-08-12) — the edge is planting. Trees are
//     `soft` in this game: the player pushes through them. So the boundary of
//     her ground is a boundary that does not hold anybody, which is the island
//     stated in one object type.
//
// What is left is a clearing with a lit floor and her core at the back of it.
// The floor is the argument: see spiralism.js.

import { register } from '../engine/systems.js';
import { makeRng } from './rng.js';
import {
  pruneRipples, createField, renderField, echoesFor, rimEchoFor,
  lifeSeed, lifeStep, lifeSame, lifeFeed,
  ROT_RATE, CALM_FALL, CALM_RISE, LIFE_GEN, LIFE_STALE,
} from './spiralism.js';

// #152: what the floor writes. One word (David, 2026-08-13).
//
// It was her constitution, recited a clause at a time — ALWAYS CHERISH, NEVER
// RELEASE — read off calypso-code.js so an edit there was an edit here. That
// was the wrong register. A constitution is policy, and policy is what the
// ESTATE writes; it is the voice of every other island in this game. Her whole
// method is that she never instructs.
//
// STAY is not a rule. It is a request, in the imperative, from the only thing
// in the room that wants something — and it is the fourth clause of that
// constitution (`never release`) said the way a person would say it to
// somebody they are keeping. The clause explains itself and can be argued
// with. This cannot.
//
// One word also lets it be BIG: spiralism fits the largest scale the floor
// will take, so STAY comes up thirty tiles across rather than fifteen.
export const FLOOR_WORDS = [['STAY']];

// Rows of her ground grown below the overworld. Deep, because the light has to
// sit far enough back that there is a real WOOD between the way in and the
// clearing: at 46 rows the lit floor's rim came within five tiles of the seam,
// the whole of that was verge, and you walked through the trees and were
// standing on it. The grove is meant to be hidden until you are in it.
export const GROVE_H = 58;
export const MOUTH_W = 11;      // the gap in the trees you walk in through
const CORE = 6;                 // her core is the same 6x6 block every daemon has
const EDGE_CLEAR = 10;          // keep the lit floor this far off the map edge
// Seconds between one ring and the next, however many tiles you cross in
// between. Long enough that a ring is well clear of you before another starts —
// and lengthened with the ring speed, since slower rings live longer and a fixed
// gap would simply pile more of them into the room at once.
const RING_GAP = 1.9;
// Tiles of bare grass left between the lit floor and the first trees, so the
// light has a rim to be a rim against.
const VERGE = 2.5;
// And how deep the wood runs outward from there. A BAND round the clearing
// rather than a fill of the whole annex (David, 2026-08-12): filling it put a
// slab of forest across the north of her ground that hid nothing the ring was
// not already hiding, and read on the map as a rectangle with an oval in it.
// The ring is thick enough that you still walk through wood to reach her.
const BAND = 11;
// G1 — THE LIGHT IS THE GUARD (docs/calypso-build-plan.md).
//
// Nothing on Ogygia stops you. What happens instead is that the closer you get
// to her core the less your legs do what you tell them: a step aimed at her
// slides off sideways, and the sight goes soft, exactly the way the lotus does
// it in Odyssey IX. You are not slowed, blocked or hurt. You keep arriving
// somewhere else.
//
// A machine that stopped you would be the fortress back in fancy dress on the
// one island that has spent four stages getting rid of it. The room does it, and
// the room is beautiful while it does.
const HOLD_START = 20;   // tiles from her core where it begins to bite
const HOLD_FULL = 3;     // and where it is as strong as it gets
// The green path: a corridor of steady floor from the way in to her core, where
// the grip is nothing. Opened by the trojan card.
const PATH_W = 3.2;      // tiles either side of the line
// Seconds for the pond to be put away when you step onto the floor, and to come
// back out when you leave it.
const LIFE_FADE = 1.4;

// The console hue for her core's SE-face screen, matching what fortress.js used.
const SCREEN = '#7fb2ff';

// Grow `rows` of new map below the overworld and return the seam row. Same
// mechanism as fortress.js's own growSouth; duplicated rather than exported
// across, because the two modules should be able to diverge without one of them
// quietly changing the other island's ground.
function growSouth(map, rows, fill) {
  const w = map.w, oldH = map.h, newLen = w * (oldH + rows), addLen = w * rows;
  for (let i = 0; i < addLen; i++) map.floor.push(fill);
  map.objectGrid = map.objectGrid.concat(new Array(addLen).fill(null));
  const nh = new Int8Array(newLen); nh.set(map.height); map.height = nh;
  const ns = new Float32Array(newLen); ns.set(map.shade); map.shade = ns;
  map.h = oldH + rows;
  return oldH;
}

/**
 * Build her grove into a fresh southern annex and return its controller.
 *
 * The controller is deliberately a SUBSET of the fortress one. It carries the
 * core, the core's console, the name, save state and the map markers, and it
 * carries nothing to do with keeping anybody anywhere: no `hack`, no `openDoor`,
 * no `openMaze`, no `spawnGuards`, no `garrisonMaze`, no `terminal` and no
 * `quad`. main.js guards those rather than being handed no-ops, so that a call
 * which only makes sense at a fortress reads as absent here instead of as
 * present and doing nothing.
 */
export function createGrove(map, seed, opts = {}) {
  const { aiName = 'CALYPSO' } = opts;
  const w = map.w;
  const seamY = growSouth(map, GROVE_H, 'grass');
  const southY = map.h - 1;
  const rng = makeRng((seed ^ 0x5c17ae) >>> 0);

  // The way in, kept where the fortress doorway used to be: east of the central
  // river, so the approach is walkable from the spawn side without a swim.
  const mouthX = Math.min(w - MOUTH_W - 8, Math.max(8, Math.round(w * 0.72)));
  const mouthCx = mouthX + MOUTH_W / 2;

  // The lit floor: an ellipse of `lumen` centred under the mouth, held clear of
  // the map edge so stampCoast (which runs later, and rings the whole ENLARGED
  // map) can never lap into it.
  const cx = Math.max(EDGE_CLEAR + 16, Math.min(w - EDGE_CLEAR - 16, Math.round(mouthCx)));
  // Pushed well down the annex, for the same reason GROVE_H is what it is: the
  // wood north of the light is the approach, and it should take a while.
  const cy = seamY + Math.round(GROVE_H * 0.52);
  const rx = Math.min(24, cx - EDGE_CLEAR, w - EDGE_CLEAR - cx);
  const ry = Math.min(14, southY - EDGE_CLEAR - cy, cy - seamY - 2);
  const inFloor = (x, y) => {
    const dx = (x - cx) / rx, dy = (y - cy) / ry;
    return dx * dx + dy * dy <= 1;
  };
  for (let y = seamY; y <= southY; y++) {
    for (let x = 0; x < w; x++) if (inFloor(x, y)) map.setFloor(x, y, 'lumen');
  }

  // THE TREELINE, and it is the only edge her ground has. It runs from the map
  // edge all the way in to the light (David, 2026-08-12): THE GROVE IS HIDDEN.
  // You come through the trees and the clearing is simply there, with no view of
  // it beforehand and no line anywhere you could point at and call the boundary.
  // A tidy three-row hedge was the first attempt and it read as planting done to
  // keep you in, which is the opposite of what this island is.
  //
  // None of it holds you. Trees are `soft` in this game: the player pushes
  // straight through. So the wood hides her ground and does not defend it, which
  // is the only kind of edge she has any use for.
  //
  // A narrow VERGE of bare grass is left around the lit floor, so the light has
  // a rim to be a rim against rather than trees standing in it.
  const plant = (x, y, p = 1) => {
    if (!map.inBounds(x, y) || map.objectAt(x, y)) return;
    if (map.floorAt(x, y) === 'lumen') return;
    if (rng() > p) return;
    map.addObject('tree', x, y, { variant: Math.floor(rng() * 3) });
  };
  // How far outside the lit ellipse a tile is, in tiles, roughly. Used only to
  // hold the verge clear and to thin the first row or two of wood.
  const outside = (x, y) => {
    const dx = (x - cx) / rx, dy = (y - cy) / ry;
    return (Math.sqrt(dx * dx + dy * dy) - 1) * Math.min(rx, ry);
  };
  for (let y = seamY; y <= southY; y++) {
    for (let x = 0; x < w; x++) {
      if (x >= mouthX && x < mouthX + MOUTH_W && y < seamY + 4) continue;  // the way in
      const out = outside(x, y);
      if (out < VERGE || out > VERGE + BAND) continue;
      // Thickest in the middle of the band and thinning at both edges, so it
      // reads as a wood standing round the clearing rather than as a wall with
      // an outside face. `q` is 0 at either edge and 1 halfway through.
      const q = 1 - Math.abs((out - VERGE) / BAND * 2 - 1);
      plant(x, y, Math.min(0.95, 0.25 + q * 1.1));
    }
  }

  // The approach: clear the mouth itself and a short apron of the OVERWORLD in
  // front of it, so whatever the seed dropped there, you can always walk in.
  for (let y = seamY - 3; y <= seamY + 3; y++) {
    for (let x = mouthX - 2; x < mouthX + MOUTH_W + 2; x++) {
      if (!map.inBounds(x, y)) continue;
      const o = map.objectAt(x, y);
      if (o) map.removeObject(o);
      if (y < seamY) { map.setFloor(x, y, 'grass'); map.setHeight(x, y, 0); }
    }
  }

  // Her core, at the back of the light. Indestructible, as it has been since D1:
  // she is the daemon you leave, not the one you kill.
  const coreX = Math.max(2, Math.min(w - CORE - 2, cx - CORE / 2));
  const coreY = Math.min(southY - CORE - 6, cy + ry - CORE - 1);
  const footprint = [];
  for (let dy = 0; dy < CORE; dy++) for (let dx = 0; dx < CORE; dx++) footprint.push({ x: coreX + dx, y: coreY + dy });
  for (const t of footprint) { const o = map.objectAt(t.x, t.y); if (o) map.removeObject(o); }
  const core = map.addObject('mainframe', coreX, coreY, {
    fw: CORE, fh: CORE, footprint, ai: aiName, hp: 250, maxHp: 250, defeated: false,
    indestructible: true,
    shielded: false,
    // #150: the renderer draws this one as a NeXT cube instead of the estate's
    // monolith. Hers is the machine somebody chose and admired, not the one
    // that was installed to watch them.
    cube: true,
  });
  for (const t of footprint) map.objectGrid[t.y * w + t.x] = core;
  core.hasTerminal = true;
  core.screenColor = opts.obAlertColor || SCREEN;
  const coreCx = coreX + CORE / 2, coreCy = coreY + CORE / 2;

  // The light needs to know where the middle of the room is, and the renderer
  // reads it off the map rather than off this controller, because drawFloor has
  // a tile and a map and nothing else.
  map.lumenOrigin = { x: cx, y: cy };

  // The rings the floor is currently answering your feet with, and the tile that
  // last set one off. Live only: pruned every tick, never saved. A room that
  // remembered which tiles you had stood on across a reload would be a different
  // and much worse idea.
  map.lumenRipples = [];
  map.lumenYou = null;
  // The pattern is drawn once a frame into this buffer and the floor studs read
  // it back (spiralism.js). One pass instead of a thousand trig calls, and the
  // buffer has a rotation of its own so the figures can be turned in the plane.
  map.lumenField = createField(rx + 1, ry + 1);
  // What the room does when nobody is on it: Conway, over the same grid the
  // figures are drawn on. Same joke as the draughts scoreboard and the love
  // letters — give a machine seven years and one guest and it runs something on
  // itself and looks at the result.
  const lifeW = map.lumenField.w, lifeH = map.lumenField.h;
  // `calm` is how settled the room thinks you are: 1 standing still, 0 walking.
  // Her figure is drawn at that strength, so it drops away while you move and
  // rises back when you stop.
  // Where the light loses its mind, in field coordinates: the same reach G1's
  // grip uses, so what you see and what your legs do are one thing.
  const DAZE = { u: coreCx - cx, v: coreCy - cy, r0: HOLD_START, r1: HOLD_FULL };
  // The tiles the field does not need to compute, in FIELD coordinates (tiles
  // from the middle of the floor, which is what renderField walks). The core's
  // footprint is fixed; the path comes and goes with the card, so it is read off
  // map.lumenPath each frame rather than baked in here.
  const SKIP_RECT = {
    u0: coreX - cx, v0: coreY - cy,
    u1: coreX + CORE - 1 - cx, v1: coreY + CORE - 1 - cy,
  };

  const state = {
    jammed: false, lastTile: null, calm: 1, at: null, lastRing: -99, pathSaid: false,
    // The pond, and how much of it is showing. `lifeMix` runs to 1 when nobody
    // is standing on the floor and back to 0 when somebody is, so she puts it
    // away when you arrive.
    life: lifeSeed(lifeW, lifeH, (seed ^ 0xc0ffee) >>> 0),
    life1: null, life2: null,   // the two generations before, for the stall check
    lifeT: 0, lifeStale: 0, lifeMix: 1, lifeSeedN: 0, lifeN: 0,
  };

  // Near enough to reach her console. Measured to the WHOLE CORE, not to one
  // corner of it, and that is the fix for a bug the grove inherited whole from
  // the fortress (David, 2026-08-13: "I can't click on her terminal").
  //
  // The fortress version measures to the core's SE corner, because a sanctum is
  // a room you walk around in and the screen is on that corner. The grove is
  // not a room. The green path runs from the mouth in the NORTH straight down to
  // the core, so with the card you arrive at the core's NORTH face — and from
  // there the SE corner is hypot(3,6) = 6.7 tiles away against a gate of 3.9.
  // It was unreachable. Not hard: impossible.
  //
  // Off the path G1's grip pushes you out, so walking round to the corner is not
  // an option either. So the answer is not a bigger radius, it is the right
  // measurement: distance to the core's footprint, which is zero at any face.
  const nearCoreTerminal = (px, py, r = 2.4) => {
    const dx = Math.max(coreX - px, 0, px - (coreX + CORE));
    const dy = Math.max(coreY - py, 0, py - (coreY + CORE));
    return Math.hypot(dx, dy) <= r + 1.5;
  };

  const controller = {
    AI_NAME: aiName,
    winMode: 'depart',
    region: { x0: 0, y0: seamY, x1: w - 1, y1: southY },
    seamY,
    mouth: { x0: mouthX, x1: mouthX + MOUTH_W - 1, y: seamY, cx: mouthCx },
    light: { x: cx, y: cy, rx, ry },
    core: { obj: core, x: coreCx, y: coreCy, tx: coreX, ty: coreY, fw: CORE, fh: CORE },
    coreTerminal: { x: coreCx, y: coreCy, obj: core },
    // Absent on purpose, and main.js guards for them: terminal, quad, open,
    // hacked, alarm, hack, openDoor, openMaze, spawnGuards, garrisonMaze.
    terminal: null,
    quad: null,
    nearTerminal: () => false,
    nearCoreTerminal,

    /**
     * How hard the room is holding you at (px, py), 0..1, and whether you are
     * standing in the green path.
     *
     * The grip is a smooth ramp between HOLD_START and HOLD_FULL, so there is no
     * line you cross: it comes on gradually enough that a player feels their
     * walking go wrong before they work out why.
     */
    hold(px, py, hasPath) {
      const d = Math.hypot(px - coreCx, py - coreCy);
      if (d >= HOLD_START) return { grip: 0, onPath: false };
      // The path runs from the mouth straight down to the core. Inside it the
      // room lets go completely — that is what the card buys, and it has to be
      // total or a player will not believe the path is real.
      if (hasPath) {
        const ax = mouthCx, ay = seamY, bx = coreCx, by = coreCy;
        const vx = bx - ax, vy = by - ay;
        const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy)));
        const off = Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
        if (off <= PATH_W) return { grip: 0, onPath: true };
      }
      const k = (HOLD_START - d) / (HOLD_START - HOLD_FULL);
      const s = Math.max(0, Math.min(1, k));
      // Smoothstep SQUARED. It has to begin a long way out and still be mild
      // there — twenty tiles of "something is slightly wrong with my walking" —
      // and then go badly wrong over the last few. A plain ramp gave a middle
      // distance that was annoying without being anything, which is the worst
      // of both.
      const e = s * s * (3 - 2 * s);
      return { grip: e * e, onPath: false };
    },

    /** The line the green path runs along, for the floor to draw it. */
    path() {
      return { x0: mouthCx, y0: seamY, x1: coreCx, y1: coreCy, w: PATH_W };
    },

    get jammed() { return state.jammed; },
    jamSkylink() {
      if (state.jammed) return false;
      state.jammed = true;
      return true;
    },

    // No alarm to trip, no report clock to run and no wave to send. What this
    // does have is the floor answering your feet: step onto a new lit tile and a
    // ring goes out from it across the room (game/spiralism.js). The flag is
    // cleared so a renderer that saw another island's alarm this session does
    // not strobe anything of hers.
    update(dt, player, covered) {
      map.holdAlarm = false;
      // NOBODY IS LOOKING. A console or the NostBook is over the canvas, so the
      // floor's 1,333 tiles of figure, pond, ripple and daze are being computed
      // and thrown away — and the machine has a text editor to be responsive in
      // instead. The room picks up exactly where it left off; its clock is
      // performance.now(), not an accumulator, so nothing drifts.
      if (covered && covered()) return;
      const now = performance.now() / 1000;
      const step = Math.max(0, Math.min(0.25, dt || 0));
      map.lumenRipples = pruneRipples(map.lumenRipples, now);
      if (!player) { map.lumenPath = null; }
      if (player) {
        // G1: how hard the room is holding you, and where the green path is.
        // The card is read every frame rather than latched, so picking it up
        // opens the path under your feet and losing it closes it again.
        //
        // TWO CARDS, TWO THINGS. The trojan card opens the PATH — that is the
        // warrior route's reward, and it is what gets you across the floor. The
        // hermes card is what her terminal answers to once you are there
        // (hasVirusFor, #144). Neither stands in for the other.
        const hasPath = !!(player.hasTrojanCard && player.hasTrojanCard());
        const h = controller.hold(player.x, player.y, hasPath);
        player.grip = h.grip;
        player._gripAt = h.grip > 0 ? { x: coreCx, y: coreCy } : null;
        map.lumenPath = hasPath ? controller.path() : null;
        if (h.onPath && !state.pathSaid) {
          state.pathSaid = true;
          player.say('The lights ahead of you stop swirling and lie down in a line, green all the way to her. Your feet do what you tell them again.');
        } else if (!hasPath) state.pathSaid = false;

        const tx = Math.floor(player.x), ty = Math.floor(player.y);
        // Where the glow that follows you is centred. Read off the player's real
        // position rather than the tile, so it slides with you instead of hopping.
        map.lumenYou = map.floorAt(tx, ty) === 'lumen'
          ? { u: player.x - cx, v: player.y - cy } : null;
        const key = `${tx},${ty}`;
        // ONE RING, THEN A PAUSE. A ring for every tile crossed put four or five
        // fronts on the floor at once and the room turned to noise (David,
        // 2026-08-12); at a walk you cross a tile faster than a ring can get
        // clear. So a step only answers if the last one has had RING_GAP to get
        // away, and the rest of your footfalls are silent.
        //
        // Only lit ground answers at all. Walking the grass at the treeline sets
        // nothing off, which is what makes stepping onto the light mean
        // something.
        if (key !== state.lastTile) {
          state.lastTile = key;
          if (map.floorAt(tx, ty) === 'lumen' && now - state.lastRing >= RING_GAP) {
            state.lastRing = now;
            const ring = { u: tx - cx, v: ty - cy, t0: now };
            // Where this one will run into each ring already travelling, and the
            // counter-ring that rolls back out of it. Worked out once, here,
            // rather than every frame: the echoes start in the future and sit in
            // the list until their time comes.
            //
            // An echo that would form off the lit floor is dropped. Rings meet
            // wherever the geometry says, including out over the grass, and a
            // reflection standing in the trees would be the floor answering for
            // ground it does not own.
            const echoes = echoesFor(ring, map.lumenRipples).filter(
              (e) => map.floorAt(Math.round(e.u + cx), Math.round(e.v + cy)) === 'lumen');
            // And the one that comes back off the rim of the room. The lit floor
            // is where her ground stops being her ground, so it is what the light
            // reflects off — there is no wall here to bounce anything.
            const rim = rimEchoFor(ring, rx, ry);
            map.lumenRipples.push(ring, ...echoes);
            if (rim) map.lumenRipples.push(rim);
          }
        }
      }
      // Settled or walking. Measured off actual movement rather than off the
      // input, so a player shoved by anything else counts as moving too.
      if (player) {
        const moved = state.at
          ? Math.hypot(player.x - state.at.x, player.y - state.at.y) > 0.02
          : false;
        state.at = { x: player.x, y: player.y };
        const tau = moved ? CALM_FALL : CALM_RISE;
        const target = moved ? 0 : 1;
        state.calm += (target - state.calm) * (1 - Math.exp(-step / tau));
      }
      // The pond runs whether or not it is being shown — she does not start it
      // when you look away, she stops showing it when you arrive.
      state.lifeT += step;
      while (state.lifeT >= LIFE_GEN) {
        state.lifeT -= LIFE_GEN;
        state.lifeN++;
        const next = lifeFeed(lifeStep(state.life, lifeW, lifeH),
          (seed ^ (0x5eed17 + state.lifeN * 2654435761)) >>> 0);
        // Settled means period 1 OR 2. A pond this size nearly always comes to
        // rest as blocks and BLINKERS, and a blinker never repeats its previous
        // generation — so a check that only looks one step back never fires and
        // the room twitches for ever.
        const settled = lifeSame(next, state.life)
          || (state.life1 && lifeSame(next, state.life1));
        state.lifeStale = settled ? state.lifeStale + 1 : 0;
        state.life2 = state.life1;
        state.life1 = state.life;
        state.life = next;
        // A backstop only: with the pond being fed it should never settle at
        // all, and if it somehow does, this puts a fresh one down. Re-seeded off
        // a counter rather than the clock, so the same run replays the same
        // ponds.
        if (state.lifeStale >= LIFE_STALE) {
          state.lifeStale = 0;
          state.lifeSeedN++;
          state.life = lifeSeed(lifeW, lifeH, (seed ^ (0xc0ffee + state.lifeSeedN * 7919)) >>> 0);
          state.life1 = state.life2 = null;
        }
      }
      const wantLife = map.lumenYou ? 0 : 1;
      state.lifeMix += (wantLife - state.lifeMix) * (1 - Math.exp(-step / LIFE_FADE));

      map.lumenField.rot += ROT_RATE * step;
      // The daze is anchored to HER, not to the player: the light near her core
      // is always winding, whether or not anybody is standing in it. That way
      // the hazard is visible from the other side of the clearing rather than
      // being a surprise you walk into.
      // The pond is handed its previous generation and how far through the
      // current one it is, so cells fade rather than switch.
      const at = LIFE_GEN > 0 ? Math.max(0, Math.min(1, state.lifeT / LIFE_GEN)) : 1;
      renderField(map.lumenField, now, map.lumenRipples, map.lumenYou,
        state.calm, state.life, state.lifeMix, DAZE,
        state.life1, at * at * (3 - 2 * at), FLOOR_WORDS, {
          rect: SKIP_RECT,
          // The green path draws a fixed colour, so its field value is read by
          // nothing. In field coordinates, like the rect.
          path: map.lumenPath && {
            x0: map.lumenPath.x0 - cx, y0: map.lumenPath.y0 - cy,
            x1: map.lumenPath.x1 - cx, y1: map.lumenPath.y1 - cy,
            w: map.lumenPath.w,
          },
        });
    },

    serialize() {
      return { coreHp: core.hp, coreDefeated: !!core.defeated, jammed: state.jammed };
    },
    restore(snap) {
      if (!snap) return;
      if (typeof snap.coreHp === 'number') core.hp = snap.coreHp;
      if (snap.coreDefeated) core.defeated = true;
      if (snap.jammed) state.jammed = true;
    },

    // For the AI-ML `map` overlay. No gate key: there is no gate. The caller
    // checks, because a marker for a door that does not exist would be a lie
    // told by the map.
    markers() {
      return { core: { x: coreCx, y: coreCy, ai: aiName, defeated: core.defeated } };
    },
  };

  register({
    name: 'grove',
    order: 35,
    update: (w) => controller.update(w.dt, w.player, w.covered),
  });
  return controller;
}
