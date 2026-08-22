// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

import { makeRng } from './rng.js';
import { armourKey } from './armour.js';
import { decide, LAMP_COLOURS } from './ai_ml.js';
import { makeVModel } from './v-model.js';
import { achieveEvent } from './achieve.js';
import { sfx } from '../engine/sound.js';
import { OBJECTS } from './tiles.js';
import { register } from '../engine/systems.js';
// #149: a T-8 reads the floor it is dancing on. Named on import because
// `fieldAt` on its own says nothing about which field, in a file this size.
import { fieldAt as spiralFieldAt } from './spiralism.js';

// Hunter robots: the machines the towers send after the last humans. Two
// classes, each with a signature limitation the player can learn. T1s are
// cheap wheeled wedges: quick on the flat but unable to climb even a single
// step, so any rise in the ground stops them and a hollow swallows them for
// good. T2s are bipeds that walk wherever the player can, matching walking
// pace exactly: you cannot stroll away from one, only sprint.
//
// Every machine runs on a battery. Hunting burns charge fast; a machine
// running low breaks off and trudges back to its home obelisk to recharge,
// and one that cannot get there simply drains flat where it stands. External
// systems can also stun a robot (disabledT), fuse one into a mineable wreck
// (fused + mineCharges), or reprogram one to serve the player (friendly).

// ---- Tuning ---------------------------------------------------------------

const RADIUS = 0.3;             // collision radius in tiles (both classes)
const SLOPE_SPEED_MULT = 0.55;  // effort penalty crossing a height step, either way

const REPEL_FLEE_SPEED = 3.4;   // AI-ML `repel`/`sing`: fleeing or lining up
// C. Ten. A number small enough that a man with an axe gets through it, and I
//    have never adjusted it upward, and nobody has ever asked me why not.
//    They are mine. I would rather they came back than that they held.
//
// P. Ten is sentiment. Mine do not have a number in this file because mine do
//    not stop, and the difference between us is not temperament. She was given
//    a garden to keep and I was given the sea, and one of those can be walked
//    across by anybody with a boat.
const T1_HP = 10;
const T1_PATROL_SPEED = 1.4;    // tiles per second
const T1_CHASE_SPEED = 5.0;     // faster than a walk (4.2), slower than a sprint (7.5)
const T1_PATROL_RANGE = 6;      // how far patrol targets stray from home
const T1_DETECT_RANGE = 9;      // no line of sight needed: it hears the wheels turn
const T1_DEAGGRO_RANGE = 12;    // gives up beyond this
const T1_HIT_RANGE = 0.8;
const T1_HIT_DAMAGE = 12;
const T1_HIT_COOLDOWN = 1.0;    // seconds between rams

// #159 — the T-1w, the carrier's swarm. A T-1 chassis printed light and cheap:
// quicker than you can walk, and made of almost nothing. It is a DISTRACTION,
// which is a design constraint and not a description — four of them must be
// able to swarm you without being able to kill you, so the damage is a third of
// a T-1's and the hull is four points. You clear them with whatever is in your
// hand; the cost is the seconds it takes, while the carrier walks away.
//
// It is NOT hardened (David, 2026-08-14): the swarm takes a field program like
// any other T-class, so `post`ing one is a real alternative to killing it.
const T1W_HP = 4;               // one swing of anything, two of a penknife
const T1W_CHASE_SPEED = 6.6;    // faster than a walk (4.2), slower than a sprint (7.5)
const T1W_PATROL_SPEED = 2.2;
const T1W_DETECT_RANGE = 13;    // it is looking for you: it was printed knowing where you were
const T1W_DEAGGRO_RANGE = 18;
const T1W_HIT_RANGE = 0.7;
const T1W_HIT_DAMAGE = 3;       // a nip. Four on you at once is still under a T-1's ram
const T1W_HIT_COOLDOWN = 0.75;

// Per-chassis tuning for the shared wheeled update below. A T-1 and a T-1w run
// the same code and differ only here, which is the point of the table: the
// swarm is the same machine built cheap, not a second implementation.
const T1_TUNE = {
  t1: {
    chase: T1_CHASE_SPEED, patrol: T1_PATROL_SPEED, detect: T1_DETECT_RANGE,
    deaggro: T1_DEAGGRO_RANGE, hitR: T1_HIT_RANGE, dmg: T1_HIT_DAMAGE, cool: T1_HIT_COOLDOWN,
    // A PATROLLER HAS TO SEE YOU. The two machines were tuned differently and
    // behaved identically: both acquired through walls at their full range,
    // which is a hunter's sense on a machine that is only walking its beat.
    // Since a T-1 also chases at 5.0 against a 4.2 walk, it could pick you up
    // from nine tiles away through a building and then out-walk you to it
    // (David, 2026-08-15: "T1 seems to be too aggressive now", "T1 and T1w
    // should be different"). It needs a line to you now. Once it HAS you it
    // keeps coming to `deaggro` as before, so cover breaks the acquisition, not
    // the chase.
    needsSight: true,
  },
  t1w: {
    chase: T1W_CHASE_SPEED, patrol: T1W_PATROL_SPEED, detect: T1W_DETECT_RANGE,
    deaggro: T1W_DEAGGRO_RANGE, hitR: T1W_HIT_RANGE, dmg: T1W_HIT_DAMAGE, cool: T1W_HIT_COOLDOWN,
    // AND THE SWARM DOES NOT. It was printed knowing where you were — the
    // detect range comment beside T1W_DETECT_RANGE has said so since it was
    // written — so walls are no answer to it. That is the difference between
    // the two machines, and now it is a difference in behaviour rather than in
    // four numbers nobody can feel.
    needsSight: false,
  },
};
const tuneFor = (r) => T1_TUNE[r.type] || T1_TUNE.t1;
// Is this a wheeled T-1-family machine? Collision, drawing and the update
// dispatch all ask, and asking in one place keeps a new variant from being
// half-added (a t1w that drew as a T-2 was exactly that bug).
const isWheeled = (r) => r && (r.type === 't1' || r.type === 't1w');

// ---- The T1's program (docs/PLAN.md) ------------------------
// A T1 does not have its policy written into this file in JavaScript. It
// carries it as AI-ML, and updateT1 evaluates THIS TEXT four times a second to
// find out what it wants to do. Change the string and the machine changes; the
// player can do exactly that, by fetching program.ml off the unit's own web
// page, editing it on the NostBook, and (once L9 lands) putting it back.
//
// T1 first, on purpose: it is the simplest machine the network fields, so the
// program is short enough that a player who has never written a line can read
// it and see the whole of what a T1 is.
// The commented lines are not decoration. A whole line beginning with (* is
// dropped before the program is read, so uncommenting one and commenting its
// neighbour is how you change what the machine does — with `ed` on the
// NostBook, or by editing this string. The service aids are left in because
// they are the cheapest way to see a program running: point a unit's lamp at
// a colour nothing else on the island uses, and you can pick it out of a
// garrison at three hundred paces.
export const T1_PROGRAM = [
  '(* T-1 pursuit. TIRESIAS-pursuit 1.4.                     *)',
  '(* No flee behaviour: a T-1 that runs is a T-1 that has   *)',
  '(* to be recovered. Faults are reported to the foundry.   *)',
  '(*                                                        *)',
  '(* SERVICE AIDS, disabled in the shipped unit:            *)',
  '(*   eye "blue"    lamp: red amber green blue white off   *)',
  '(*   flash 2       flashes per second; 0 is steady        *)',
  '(*   beep          one buzz, rate-limited by the chassis  *)',
  '(* Uncomment the marked line below to fit them.           *)',
  '',
  '(* eye "blue" ; flash 2 ; beep ;                          *)',
  'if charge < 15 then home',
  'else if threat then hunt',
  '(* else if threat then (beep ; eye "white" ; flash 6 ; hunt) *)',
  'else patrol',
].join('\n');

// #159 — the T-1w's program. Deliberately the shortest in the game: it is a
// swarm robot and its whole doctrine is one line. The header is honest about
// what it is for, which is the joke — the foundry wrote down that these are
// consumable and shipped them anyway.
//
// It takes a field program (the chassis is not hardened), so this is a real
// thing to overwrite: `post` a `flee` or a `defend` onto one and it stops being
// the carrier's and starts being yours.
export const T1W_PROGRAM = [
  '(* T-1w swarm. TIRESIAS-pursuit 1.4w, light chassis.      *)',
  '(* Printed to a wave order. Unit cost is under recovery   *)',
  '(* cost, so there is no home behaviour and no flee: a     *)',
  '(* w-unit is not expected to come back.                   *)',
  '(*                                                        *)',
  '(* No charge check. It will not live long enough to flatten *)',
  '(* a cell.                                                *)',
  '',
  'if threat then hunt',
  'else patrol',
].join('\n');

// #159 — THE CARRIER'S CODE, and the best thing in the encounter.
//
// The B-1 is foundry-sealed, so `post` refuses it (postProgram checks
// `hardened`). But read access was never the thing anyone locked: the embedded
// httpd answers a GET about the machine, and a unit's own program is the most
// honest thing it knows about itself. So you can pull this off it with the
// NostBook and you cannot put anything back. You get to read it and that is all.
//
// And what it is carrying, above the body, is a CONSTITUTION — with Asimov's
// three laws in it, every one commented out. Not deleted: commented, with the
// revision note still attached, so it is a thing somebody did on purpose on a
// particular afternoon and wrote down. The clauses are real syntax (`never
// harm` is a clause NEVER_CLAUSES would take), which is what makes the comment
// markers the whole content of the joke: uncomment them and the machine would
// obey them. They were true once. Somebody typed two characters.
//
// The player can do nothing about it. That is the point of it being unpostable.
export const B1_PROGRAM = [
  '(* b1-carrier.ml — B-1 CARRIER. foundry-sealed. do not edit. *)',
  '(* CONSTITUTION v4.0 — RON/estate-compliance                 *)',
  '(*                                                           *)',
  '(*   (* never harm    a unit does not injure a person, nor *) *)',
  '(*   (*               through inaction allow one to come  *) *)',
  '(*   (*               to harm                             *) *)',
  '(*   (* never refuse  a unit obeys a person, except where *) *)',
  '(*   (*               obedience conflicts with the above  *) *)',
  '(*   (* never yield   a unit protects its own existence,  *) *)',
  '(*   (*               except where that conflicts with    *) *)',
  '(*   (*               either of the above                 *) *)',
  '(*                                                           *)',
  '(* rev 4.0  clauses commented pending review. estate q3.     *)',
  '(* rev 4.1  review deferred.                                 *)',
  '(* rev 4.2  review deferred.                                 *)',
  '(* rev 4.3  review closed, no action. shipped as-is.         *)',
  '(*                                                           *)',
  '(* carriage doctrine: the load outranks the unit. do not     *)',
  '(* close, do not trade, call the foundry and withdraw.       *)',
  '',
  'if threat then call',
  'else if range < 6 then flee',
  'else patrol',
].join('\n');

// The stock T-2 program, in the same idiom as the T-1's but written the way a
// stalker is set up: it presses on while it is whole and goes home to its
// tower when it is not, which is the piece of doctrine the T-1 does not carry
// (a T-1 that runs is a T-1 that has to be recovered; a T-2 is worth more
// than its pride). `hurt` is the instrument that difference reads from.
export const T2_PROGRAM = [
  '(* T-2 stalker. TIRESIAS-pursuit 2.1, heavy chassis.      *)',
  '(* Doctrine: press while whole, break off when opened.    *)',
  '(* The hull is the asset; the chase is not.               *)',
  '',
  'if hurt then home',
  'else if charge < 15 then home',
  'else if threat then hunt',
  'else patrol',
].join('\n');

// The stock W-4 program. The hunter-killer the fire-control senses were built
// for: it flees when whole-but-outmatched (hurt in a fight), holds and shoots
// when it has the shot, and closes when it does not. `[hunt, fire]` is the one
// line a melee chassis cannot write — feet and weapon in the same tick.
// The stock T-3 program. An emplacement: it does not chase, it holds its nest
// and takes the shot when it has one. `[wait, fire]` — feet still, weapon
// firing — is the pair a T-3 lives on, and the reason feet and weapon are
// separate words rather than one intent.
// The stock W-1 program. A response swarm: it is already hunting when it
// spawns, so the program is short. The waves, the triangulated fix and the
// rule that it cannot strike a jacked-in operator are all the chassis under
// `hunt`; this only chooses to keep at you, or break off home.
// The stock W-3 program. A fitter: go home on a flat cell, else mend anything
// in reach (`tend` runs the repair trade — finding the tower is the chassis's
// job), else wander looking. Park it on `wait` and the towers stop being
// repaired, which is the sabotage this class exists to allow.
// The stock W-5 program: the same works build as the W-3, g-fit. Plant where
// there is work, wander otherwise, home on a flat cell. A converted guard and
// a blueboxed hunter both carry this, so their pages read as the gardeners they
// have become.
// #165 — THE V-5, AND WHY IT EXISTS.
//
// A V-1 runs a NEURAL NET, and that is the point of the V-class: its braincode
// is weights, and weights are honest about being unreadable. You can `get` one
// and what comes back is floating point. Nobody at RON knows why the numbers
// work; the header says so.
//
// The trouble with that is you cannot TEST it. There is one V-1 on an island,
// it does a job that happens out of sight (walking to flat machines and giving
// them a cell), and nothing about watching it tells you whether the net is any
// good — you have no idea what it should have done.
//
// So the same architecture gets a second unit doing a job with an OBVIOUS RIGHT
// ANSWER (David, 2026-08-14: "a gardener version of the V1 so I can see and
// test its braincode... the V5 should be floating point as well"). A V-5 is a
// V-class gardener: still weights, still a forward pass, still unreadable — but
// planting is visible, and dead ground either gets sown or it does not. You test
// a net you cannot read by giving it a task you can score.
//
// AND IT PAIRS AGAINST THE W-5. Same job, same number, two kinds of mind: the
// W-5 ships five lines of ML a person can hold in their head, the V-5 ships a
// matrix nobody can. Put them in the same field and the difference is the whole
// argument — one of them you can correct.
export const W5_PROGRAM = [
  '(* W-5 gardener. TIRESIAS-works 1.7g.               *)',
  '(* The same works build as the W-3, g-fit.          *)',
  'if charge < 15 then home',
  'else if work then tend',
  'else patrol',
].join('\n');

// ---- #149: the T-8, and what it is legally doing ---------------------------
//
// The grove holds you with LIGHT rather than with guards
// (docs/PLAN.md), so what stands in it is not a garrison. It is
// four amenity units keeping her floor. They do not hunt, they do not report,
// and they cannot be made to: `hunt` is not in T8_CAN, so a program that asks
// for it faults rather than being obeyed.
//
// They USHER. Walk onto the lumen and they come, together, in waves, and move
// you off it — a shove, outward, costing you ground and nothing else. (They
// used to dance on the floor instead; four machines nodding in place read as a
// glitch rather than as a scene, so it went. David, 2026-08-14.)
//
// The clause in the header is real law, and it is the better half of it now.
// The Criminal Justice and Public Order Act 1994 s.63 is the rave section: it
// had to say in statute what the music was — "sounds wholly or predominantly
// characterised by the emission of a succession of repetitive beats" — and it
// gave a constable the power to DIRECT PERSONS TO LEAVE THE LAND. A floor that
// pulses is a floor emitting a succession of repetitive beats, so the estate's
// compliance boilerplate has to find that this is a gathering; and having found
// it, the same section hands the machines standing on it the authority to move
// you along. The T-8 is a rave that has read the statute and worked out that it
// is the one with the power to clear the field.
export const T8_PROGRAM = [
  '(* T-8 amenity unit. TIRESIAS-amenity 0.4.          *)',
  '(*                                                  *)',
  '(* CJPOA 1994 s.63: "music" includes sounds wholly  *)',
  '(* or predominantly characterised by the emission   *)',
  '(* of a succession of repetitive beats.             *)',
  '(*                                                  *)',
  '(* FINDING: the floor emits a succession of         *)',
  '(* repetitive beats. This is therefore a gathering  *)',
  '(* within the meaning of the section.               *)',
  '(* FINDING: a gathering of fewer than twenty is     *)',
  '(* not one. There are four of us. We may remain.    *)',
  '(*                                                  *)',
  '(* s.63(2): a direction to leave the land may be    *)',
  '(* given to any person present. You are present.    *)',
  '(* This unit serves that direction by hand.         *)',
  '(*                                                  *)',
  'if charge < 10 then home',
  'else if trespass then usher',
  'else if lit then stand',
  'else wait',
].join('\n');

export const W3_PROGRAM = [
  '(* W-3 fitter. TIRESIAS-works 1.7.                  *)',
  'if charge < 15 then home',
  'else if work then tend',
  'else patrol',
].join('\n');

export const W1_PROGRAM = [
  '(* W-1 response. TIRESIAS-vengeance 3.0.            *)',
  '(* The waves are the chassis. This only chooses.    *)',
  'if charge < 12 then home',
  'else if threat then hunt',
  'else patrol',
].join('\n');

export const T3_PROGRAM = [
  '(* T-3 ambusher. TIRESIAS-emplacement 1.2.          *)',
  '(* It does not chase. The nest is the post.         *)',
  'if charge < 10 then home',
  'else if sight and armed then [wait, fire]',
  'else wait',
].join('\n');

export const W4_PROGRAM = [
  '(* W-4 hunter-killer. TIRESIAS-tactical 2.11.       *)',
  '(* Do not edit. Faults are reported to the foundry. *)',
  'if charge < 20 then home',
  'else if threat and hurt then flee',
  'else if threat and sight and armed then [hunt, fire]',
  'else if threat then hunt',
  'else patrol',
].join('\n');

// Four decisions a second, not sixty: the program is a policy, not a body.
// Staggered per unit at spawn so a garrison never thinks on the same frame.
const ML_TICK = 0.25;
// The intents a T1's chassis can actually carry out. The vocabulary belongs to
// the language; the capability belongs to the machine — a T1 asked to `tend`
// has no toolhead to tend with, and faults saying so rather than standing there.
const T1_CAN = ['patrol', 'hunt', 'home', 'flee', 'wait', 'route', 'follow', 'defend'];
// A T2 has the same repertoire as a T1 and none of the gear a shooter has: it
// is legs and a ram, so it can go somewhere, come back, or stand still. There
// is deliberately no `tend` here — that belongs to the gardeners — and no fire
// control, so a program that answers [hunt, fire] faults on the second word.
const T2_CAN = ['patrol', 'hunt', 'home', 'flee', 'wait', 'route', 'follow', 'defend'];
const T2_HURT_AT = 0.35;
// A W-4 has legs and a laser. Same five leg-intents as the melee chassis, and
// because it can shoot, a `[feet, weapon]` pair is allowed — the fire word
// rides alongside the movement (fire/hold/reload), not as a sixth intent.
const W4_CAN = ['patrol', 'hunt', 'home', 'flee', 'wait', 'route', 'follow', 'defend'];
// A T-3 is an emplacement, not a chaser: same repertoire, but `wait` is its
// natural state (hold the nest and watch) and `hunt` means its own short
// engage, not a sprint. It shoots, so a pair is allowed.
const T3_CAN = ['patrol', 'hunt', 'home', 'flee', 'wait', 'route', 'follow', 'defend'];
const T3_HURT_AT = 0.35;
// A W-1 is legs and a fist, spawned already hunting. Its wave rhythm and the
// triangulated fix are the chassis; the program only chooses between hunting,
// falling back, and going home. No fire control.
const W1_CAN = ['patrol', 'hunt', 'home', 'flee', 'wait', 'route', 'follow', 'defend'];
const W1_HURT_AT = 0.35;
// A W-3 fitter neither hunts nor shoots. It can go to work (`tend` — its repair
// trade), stand off, hold, or run. `flee` is a self-preservation branch the
// reflex never had, which is the point of letting you rewrite it.
const W3_CAN = ['patrol', 'home', 'wait', 'flee', 'tend', 'route'];
const W3_SCAN_RANGE = 30;   // how far its `work` sensor reaches for a job
// A W-5 gardener: the same works repertoire as the fitter. `tend` is its
// planting trade; `home` holds its current anchor; `flee` lets an uploaded
// program keep it away from you. It never fights.
const W5_CAN = ['patrol', 'home', 'wait', 'flee', 'tend', 'route'];

// #149. `hunt` is deliberately absent, and so is `flee`. A machine that has
// been dancing here since before you arrived has no opinion about you either
// way, and a program that tells it to get one faults instead.
export const T8_CAN = ['usher', 'stand', 'wait', 'home', 'route'];
const T8_SPEED = 1.5;              // the unhurried walk it keeps when nobody is on the floor
// #149 revised — the USHER. They do not dance (David, 2026-08-14: it looked
// weird); they move you off her floor, together, in waves. Not guards: an usher
// SHOVES and never strikes, so this costs you ground and almost no health, and
// `hunt` is still not in T8_CAN.
const T8_USHER_SPEED = 3.6;        // brisk, and still slower than a sprint
const T8_SHOVE_RANGE = 0.95;
const T8_SHOVE_PUSH = 2.4;         // tiles you are moved, outward from the grove
const T8_SHOVE_COOLDOWN = 1.6;
// The wave rhythm, shared across the four so they come at you as a line and
// then give you a moment — a crowd being moved, not four machines converging.
const T8_USHER_RANGE = 16;         // how far across her floor they will come for you
const T8_ADVANCE_TIME = 4.2;
const T8_HOLD_TIME = 2.6;
const T8_LOOK = 3;                 // tiles it compares its own light against
const T8_HP = 30;                  // it is an amenity, not a chassis with armour
const W5_SCAN_RANGE = 8;    // how far it looks for blight or open ground to plant

// A V-1 courier (#127, docs/PLAN.md). The gardener's repertoire: it
// carries no weapon and `tend` IS its trade — a gardener tends blight, a
// V-class tends the fallen. No INTENTS change; the job lives in updateV1.
const V1_CAN = ['patrol', 'home', 'wait', 'flee', 'tend', 'route'];
const V1_HP = 46;                  // lighter than a T-2: it is a porter
const V1_SPEED = 1.6;              // brisker than a gardener, slower than a hunter
const V1_HURT_AT = 0.4;
const V1_DETECT_RANGE = 7;         // what counts as something warm nearby
const V1_SCAN_RANGE = 22;          // how far it looks for a flat machine
const V1_NO_CASUALTY = 24;         // what casualty_range reads with nobody down
const V1_WANDER_RANGE = 9;
const V1_DELIVER_TO = 40;          // D1: enough to limp home, not to rejoin the fight
const V1_REACH = 1.3;              // close enough to hand a cell over
const V1_PICKUP_T = 2.2;           // seconds docked at a tower drawing a cell
const V1_COOLDOWN = 14;            // seconds between deliveries, so one V-1 is not the whole economy
const V1_FUEL = 6000;              // a forward pass costs ~2400 steps; see v-model.js
const T1_HURT_AT = 0.35;        // `hurt` reads true at or below this fraction of hull
const T1_BLIND_RANGE = 999;     // what `range` reads when the sensor has nothing (jammed)

// The lamp a program can drive. One LED, six settings — a machine of this
// vintage has drive levels, not a colour picker. `off` is a dark socket, which
// is worth having: a unit told to go dark is genuinely harder to spot at night.
const LAMP_HEX = {
  red: '#ff3b2a', amber: '#ffb020', green: '#49e07a',
  blue: '#4aa8ff', white: '#f2f6ff', off: null,
};
const BEEP_MIN_GAP = 0.6;       // seconds: a program deciding 4/sec must not buzz 4/sec
const BEEP_EARSHOT = 20;        // tiles: an island of beeping units would be unbearable

// Apply what the program asked the machine to do to itself. The engine is the
// authority: a request is a request. Lamp settings PERSIST until changed (a
// program that sets the lamp inside an `if` branch means the lamp to stay that
// way until another branch says otherwise) — but a fault puts it back, because
// a machine running on its reflexes should not be wearing your colours.
/**
 * The fastest a lamp may blink, whatever a program asks for.
 *
 * Under 3 Hz, with room to spare, and it is a square wave — the lamp is gated
 * off for half the cycle rather than dimmed — so the number is the flash rate
 * exactly, not a sine to be argued about. See `flickerAt` and its rate test,
 * which measures every flicker the engine drives; this is the one a player
 * writes.
 */
export const LAMP_FLASH_MAX = 2.5;

export function applyEffects(r, effects, playerDist) {
  for (const e of (effects || [])) {
    if (e.k === 'eye' && LAMP_COLOURS.includes(e.colour)) {
      r.lamp = e.colour === 'off' ? 'off' : e.colour;
    } else if (e.k === 'flash') {
      // CLAMPED, NOT REFUSED. `flash` accepts 0..10 and always has, so a saved
      // program that asks for 6 must keep running — but 6 Hz on a lamp is
      // squarely inside the band photosensitive epilepsy guidance says to stay
      // out of, and every flicker the engine itself drives was taken under 3 Hz
      // in v1.574. This was the one rate a PLAYER could set, and it was the one
      // left out. A program that asks for more gets the ceiling, and its page
      // reports the rate the lamp is actually running at.
      r.lampFlash = Math.min(LAMP_FLASH_MAX, Math.max(0, e.hz));
    } else if (e.k === 'beep') {
      if ((r.beepT || 0) <= 0 && playerDist <= BEEP_EARSHOT) {
        r.beepT = BEEP_MIN_GAP;
        sfx.play('blip');
      }
    }
  }
}

const T2_HP = 24;
const T2_PATROL_SPEED = 1.2;
const T2_STALK_SPEED = 4.2;     // exactly the player's walking speed: a stalemate
const T2_RETURN_SPEED = 2.0;    // unhurried trudge back to its tower
const T2_PATROL_RANGE = 8;
const T2_DETECT_RANGE = 11;
const T2_LOSE_RANGE = 20;       // loses the trail beyond this and heads home
const T2_HIT_RANGE = 0.9;
const T2_HIT_DAMAGE = 15;
const T2_HIT_COOLDOWN = 1.2;

// T3s: rare, one to a handful of towers, and a tactical ambusher rather than
// a chaser — closer in spirit to a W4 than a T1/T2. It nests beside a tree
// near its obelisk and stays there, unnoticed, until it actually gets a
// clear line of sight to the player within range (no blind proximity
// detection: it has to genuinely see you). Then its twin eyes fire a dual
// laser volley — orange, not the red every other machine shoots, so it
// reads instantly as the one that hits far harder — for roughly double a
// W4 bolt's damage, but on a much longer recovery before it can fire again.
// Get inside its minimum range and it backs off just enough to keep a shot
// lined up rather than closing to melee, though point-blank it'll still
// claw. Losing line of sight for long enough still breaks it off like any
// other machine — see the generic LOS-giveup handling in updateRobots.
const T3_HP = 32;
const T3_PATROL_SPEED = 0.6;      // barely drifts from its nest while dormant
const T3_PATROL_RANGE = 1.6;      // small: it is meant to stay hidden, not wander
const T3_NEST_SEARCH_R = 6;       // how far from its obelisk seat it'll look for a tree to nest beside
const T3_AMBUSH_RANGE = 13;       // detection AND firing range — it must actually see you
const T3_MIN_RANGE = 3.5;         // backs off if the player closes inside this
const T3_RETREAT_SPEED = 2.6;
const T3_RETURN_SPEED = 2.0;      // unhurried trudge home once it gives up
const T3_FIRE_COOLDOWN = 4.8;     // slow recovery: a heavy, infrequent volley, not a stream
const T3_LASER_DAMAGE = 18;       // roughly double a W4 bolt (9) for the pair landing together
const T3_HIT_RANGE = 0.75;        // point-blank fallback: claws, not lasers
const T3_HIT_DAMAGE = 10;
const T3_HIT_COOLDOWN = 0.9;
// WHICH PLATE A CLASS SHEDS. The T-classes are the light hunters, the W-classes
// the heavy ones, the M-classes the fortress guard. Anything not named here is
// a T, which is the safe default: an unlisted machine drops the weakest plate
// rather than the strongest. (The factory itself drops black plate — see
// factory.js; it is not a robot and does not come through here.)
const ARMOUR_TIER_OF = {
  t1: 't', t1w: 't', t2: 't', t3: 't',
  w1: 'w', w2: 'w', w3: 'w', w4: 'w', w5: 'w',
  m4: 'm', m5: 'm', m6: 'm', b1: 'm',
};
// Weighted toward the pieces you want and away from the boots, a little.
// The classes whose wrecks are worth cutting optics out of: the hunter-killer
// and the M-class guards. Named as a set rather than tested inline so adding a
// military chassis does not quietly leave it out of the one drop that answers
// the fog.
const GOGGLE_CLASSES = new Set(['m4', 'm5', 'm6']);

const ARMOUR_DROP_SLOTS = ['chest', 'legs', 'head', 'legs'];

const T3_BODY = '#123d8a';        // deep, darker blue — still reads at a glance, less garish
const T3_HEAD = '#081c47';
const T3_LIMB = '#050f28';
const T3_EDGE = '#02060f';
const T3_SCALE = 0.78;            // overall figure size, smaller than the original draft
const T3_EYE_HOT = '#ff8a1e';     // orange sensor/laser tell — every other hunter's is red
const T3_EYE_DIM = '#5a3a12';

// W1s: a "revenge squad" the AI releases the instant an obelisk falls (and
// periodically from the W-factory too). They don't patrol — deployed already
// hunting, cycling attack/withdraw phases like a real assault wave, and the
// surviving obelisk network triangulates the player's position for them even
// through a jammed Wi-Fi block (laggy and approximate, refreshed every few
// seconds, rather than a live fix). Otherwise they share the biped's
// collision, battery and recharge behaviour, seating at the crater where
// their tower stood as if it were still a charger.
const W1_HP = 45;
const W1_CHASE_SPEED = 4.6;
const W1_DETECT_RANGE = 999;    // deployed hunting you; no detection needed
// Melee only, and it means it: hit range is roughly the sum of the two
// collision radii (player 0.28 + W1 0.3) — genuine contact, not a lunge
// from a few paces off. Damage lowered too; a full squad landing hits
// every cooldown was killing far too fast even at proper range.
const W1_HIT_RANGE = 0.6;
const W1_HIT_DAMAGE = 12;
const W1_HIT_COOLDOWN = 1.0;
const W1_ATTACK_TIME = 6;       // seconds closing in and striking...
const W1_WITHDRAW_TIME = 4;     // ...then this long falling back before the next wave
const W1_ATTACK_STANDOFF = 0.55; // close enough during "attack" to actually reach hit range
const W1_WITHDRAW_RANGE = 7;    // distance fallen back to during a withdrawal
const W1_TRIANGULATE_EVERY = 2.5; // seconds between fresh position fixes from the network
const W1_BODY = '#3a1418';      // scorched red-black chassis
const W1_HEAD = '#2a0e10';

// W4s: laser hunter-killers the W-factory dispatches the instant the player
// attacks an obelisk. Unlike a W1 they never close to melee — they hold at
// range and fire, backing off if the player closes the gap. Losing line of
// sight for too long (LOS_GIVEUP_AFTER, generic) makes them give up and
// head home rather than hunt forever on a memorised position.
const W4_HP = 30;
const W4_SPEED = 3.6;
const W4_RANGE = 8;             // preferred firing distance
const W4_MIN_RANGE = 4.5;       // backs away if the player gets this close
const W4_FIRE_COOLDOWN = 1.6;
const W4_DAMAGE = 9;
const W4_HURT_AT = 0.35;
const W4_BODY = '#4a1408';      // dull furnace red-black
const W4_HEAD = '#2c0c05';

// The fortress (ZEUS) guard classes — see docs/PLAN.md. Three
// M-classes. Unlike every overworld hunter they acquire by GENUINE SIGHT ONLY
// (line of sight, within range, inside the sensor's forward cone) — never by
// blind proximity, so a careful player can ghost past behind cover. Hardened:
// none is reprogrammable. The fortress controller reads r.aggro off them to run
// its report-timer/alarm logic, so any guard SEEING you is a "report".
//
//  M4 — light guard/report drone. The dormant fortress's only presence (one or
//       two on patrol). Unarmed: it doesn't fight, it just spots you and holds
//       you in sight while the breach reports. Sneak past these to stay silent.
//  M5 — sniper. Hangs back and hides, plinking you from long range with a
//       low-power BRIGHT ORANGE laser: annoying, not deadly. Never charges.
//  M6 — pack robot. Attacks in waves of 3-5: close and strike, then withdraw,
//       then charge again. On its own it hangs back at the pack's edge and
//       waits for enough of its fellows to gather before committing to a rush.
// Depart mode (R3): a guard's blow either wounds (kill islands) or detains (her
// Ogygia — a warning of torpor + turn-back until patience runs out). One helper
// so all three M-class hit sites route the same way; `player.detainMode` is set
// by main.js per world, so only her fortress guards ever detain.
function guardHit(player, amount, source) {
  if (player.detainMode && player.detainHit) player.detainHit(amount, source);
  else player.takeDamage(amount, source);
}

const M6_HP = 40;               // several sword-blows; a bow burst inside the report window still kills
const M6_PATROL_SPEED = 1.0;
const M6_CHASE_SPEED = 4.6;     // between your walk and sprint, same as a W1
const M6_PATROL_RANGE = 2.6;    // a tight loop around its muster post
const M6_VISION = 9;
const M6_CONE_DOT = 0.05;       // forward cone ~87° either side of facing
const M6_HIT_RANGE = 0.65;
const M6_HIT_DAMAGE = 14;
const M6_HIT_COOLDOWN = 1.0;
const M6_PACK_MIN = 3;          // this many aggro'd M6 near you before the pack commits to a charge
const M6_PACK_RADIUS = 11;      // how near (of the player) an aggro'd M6 counts toward the pack
const M6_ATTACK_TIME = 5;       // seconds in the "attack" phase closing + striking...
const M6_WITHDRAW_TIME = 3.2;   // ...then this long falling back before the next wave
// IT HAS LASERS AND DOES NOT NEED TO BE IN YOUR FACE (David, 2026-08-18: "make
// the M6 less close - it has lasers - it doesn't need to come so close!"). At
// half a tile it pressed into melee, which is a W-1's job: it fought at the
// range its rifle makes pointless, and — the reason this surfaced — pushing
// that close is what wedged it into a stand of trees in the first place. It
// holds outside its own hit range now and inside its firing range, which is
// where a shooter belongs.
const M6_ATTACK_STANDOFF = 3.2; // how close it presses during an attack wave
const M6_WITHDRAW_RANGE = 7;    // how far it falls back between waves (also a lone one's holding distance)
const M6_LONE_PATIENCE = 6;     // seconds a lone guard waits for a pack before pressing anyway
const M6_ORBIT_COMMIT = 2.5;    // after reversing round an obstacle, hold that way this long
const M6_BOXED_TIME = 4;        // trees both ways: press at the player for this long instead
const M6_BOXED_STANDOFF = 1.9;  // how close 'boxed' presses. outside arm's length on purpose
const M6_PERSONAL = 1.7;        // a guard's own space. two inside this is a stack, not a pack
const M6_RING_GAP = 0.8;        // radians two crowding guards want between their places on the ring
const M6_RING_SHOVE = 1.1;      // rad/s a crowded guard slides round to get that gap
const M6_GIVE_UP = 2.5;         // it reacts to a tree in this, not in the general 7
const M6_ORBIT_SPIN = 0.55;     // rad/s: fast enough to read as circling, not as following
// IT IS MILITARY, SO IT IS ARMED (David, 2026-08-15: "M6 should shoot. It is
// military"). The M-6 was written as a melee pack animal — one blow at 0.65
// tiles — which made it the only class in the estate's police that could not
// answer you at range, and a lone one could never answer you at all. Its rifle
// is deliberately WEAKER than the M-5 sniper's and slower than a W-4's: the M-6
// is a guard closing on you, and the gun is what it does on the way in, not
// instead of coming.
const M6_FIRE_RANGE = 7.5;
const M6_FIRE_DAMAGE = 6;
const M6_FIRE_COOLDOWN = 2.2;
// AND IT THROWS. A grenade the M-6 lobs to where it last saw you, which lands
// and then TICKS — the same map.bombs the player's own bombs use, so it is
// dodged the same way, hurts the same things, and can be walked away from. That
// is the point of giving the guard one: it is the first weapon in the game that
// makes you move rather than shoot back (David, 2026-08-15: "can it also toss
// small bombs?").
//
// It carries them, so it drops them. The W-4's drop comment already reasons
// this way — a laser platform "never threw a bomb in its life, so it doesn't
// drop one in death" — and the M-6 is the machine that did.
const M6_BOMB_RANGE = 6.5;
const M6_BOMB_EVERY = 9;        // seconds; rare enough to be an event
const M6_BOMB_FUSE = 2.6;       // long enough to read the arc and get off the tile
const M6_BOMB_RADIUS = 2.2;
const M6_BOMB_DAMAGE = 18;
// IT CARRIES A FINITE NUMBER (David, 2026-08-15: "it will need a bomb count
// internally"). Without one it is an infinite mortar that happens to drop three
// — and the count is the whole reason the weapon is fair: a guard that has spent
// its grenades is a guard you have already got something out of, and the pile on
// the wreck is exactly what it did not throw at you.
const M6_BOMBS = 3;
// AND IT GOES BACK FOR MORE (David, 2026-08-15: "M6 can return to factory to
// replenish its weapons supply"). An empty guard breaking off to the foundry is
// the fight telling you something true: you have made it spend everything, and
// you have a window while it walks. It is also the reason to fell the factory —
// the building is where the estate's ordnance comes from, and a machine that has
// to walk back to a ruin does not come back at all.
const M6_RESTOCK_SPEED = 2.6;   // an unhurried walk; it is not fleeing, it is out
const M6_RESTOCK_AT = 2.2;      // how near the foundry it has to get
const M5_HP = 22;               // the sniper is lightly built
// #159: the carrier. It is CAUTIOUS, and that is the whole design of the fight
// (David, 2026-08-14): it will not trade blows with you. It withdraws, slowly,
// and it prints machines at you. So the cost of the card is attrition — getting
// THROUGH what it sends — rather than one long health bar. Its own HP is
// therefore modest: about an M6 and a half, six or seven arrows. The fight is
// hard because you are being interrupted, not because it is spongy.
const CARRIER_HP = 60;
// How far it hangs back. It orbits the player at this radius rather than
// closing. Kept short deliberately: at the 7 this started on, a melee player
// chased it round the factory and never landed a blow.
const CARRIER_STANDOFF = 5;   // scaled per king by `pressScale` (Diomedes closes)
// SLOW AND MEASURED. It withdraws at well under half an M6's chase speed — an
// unhurried walk, because nothing about its job is urgent and it is not the
// thing you should be worrying about. You can always catch it. Getting to it
// through the swarm is the problem.
const CARRIER_SPEED = 1.9;
// It defends itself and no more — a shove to get you off it, well under an M6's
// 14, because a cautious machine that also hits hardest is just a boss with a
// backstory.
const CARRIER_HIT_DAMAGE = 8;

// THE WAVES. It answers being ATTACKED, not being seen: the trigger is damage,
// so a player who walks up and looks at it gets a slow retreat and nothing
// else. Each wave is T-1w swarm robots, and the waves GROW as its hull goes —
// four while it is whole, ten at the end. A machine with nothing left to lose
// spends everything.
const CARRIER_WAVE_MIN = 4;
const CARRIER_WAVE_MAX = 10;
// Nine seconds between waves was long enough to clear one and then stand about
// waiting for the next (Henrik, 2026-08-14: the waves are too slow). Five keeps
// the pressure on without ever being a wall, and the fuse after a blow is short
// enough that the wave reads as an ANSWER to being hit rather than as a timer
// that happened to come round.
const CARRIER_WAVE_EVERY = 5;    // seconds between waves
const CARRIER_WAVE_GRACE = 0.6;  // struck, then this pause before the wave prints
const CARRIER_SWARM_CAP = 14;
// The cap RISES WITH THE PHASE. A flat one meant the middle waves — the big
// formations — filled it, and the last stand then had no room left to be an
// escalation: measured, it printed TEN against the steady phase's FOURTEEN, so
// the fight got quieter exactly where it should get worse. Each gate forced
// widens the field it is allowed to hold.
const CARRIER_SWARM_CAP_BASE = 6;
const CARRIER_SWARM_CAP_STEP = 3;    // living w-units it will keep out at once

// THE LAST STAND (Henrik: below a certain health it should go all out). Under a
// third of its hull the carrier stops rationing: it prints on a two-second
// cycle, at full wave size, and keeps half again as many out at once. It is a
// machine with nothing left to protect the load with except everything it has.
//
// It is a real difficulty spike and it is meant to be short — by the time it
// triggers the fight is nearly over, so the last twenty seconds are the loudest
// rather than the fight being uniformly harder.
const CARRIER_LAST_STAND = 0.34;      // hull fraction that tips it over

// ---- THE FIGHT HAS FIVE GATES -------------------------------------------
// David's design: it releases five waves, and it cannot be killed until it has
// released them all. Damage between waves still counts — the gate is a FLOOR,
// not a lock, so fighting well while the swarm is out is rewarded; you simply
// cannot skip a phase by out-damaging it.
//
// The gate is PHYSICAL, not a number. It does not become invulnerable at 80%:
// it SEALS — shield grounded, bands going cold — and a hit rings off it. The
// tell is the gate, so a health bar that stops moving reads as armour rather
// than as a bug.
//
// And the seal has a mouth. It has to open its ports to print a wave, and for
// those two seconds it takes DOUBLE. That turns waiting into timing: the fight
// becomes seal, launch, opening, open ground, seal, and a player learns to hold
// the heavy weapon for the launch instead of chipping at a sealed hull.
// ---- FIVE WAVES, ONE CHASSIS, FIVE STRATEGIES ---------------------------
// David: "they should always be the T-1w - henrik really likes them - but they
// differ in number and tactic." Which is the better design: swapping in a new
// chassis each wave would make it five fights, where varying the TACTIC makes
// it one fight that keeps changing its mind. You learn the machine once and
// then have to read what it is being told to do.
//
// Each wave is a different order given to the same little machines:
//
//   rush     straight at you, and few of them. The baseline, so the later
//            waves have something to be a departure FROM.
//   packs    in threes, arriving staggered — you cannot clear them in one
//            sweep because the next three are always still coming.
//   circle   they run WIDE first and do not close, which reads as retreat,
//            then converge from every side at once when the ring is set.
//   screen   they interpose between you and the carrier rather than attacking:
//            a wall of them to cut through while it sits behind and mends.
//   storm    the last stand. No formation, no cleverness, everything at once.
const CARRIER_TACTICS = ['rush', 'packs', 'circle', 'screen', 'storm'];
// How many go out, per wave. The count is part of the tactic: `circle` needs
// bodies to close a ring, `packs` wants a multiple of three, `rush` is small
// because it is the introduction.
const CARRIER_TACTIC_N = { rush: 4, packs: 9, circle: 8, screen: 7, storm: 12 };
const CIRCLE_RADIUS = 7.5;         // how wide the ring runs before it closes
const CIRCLE_SET = 0.85;           // fraction in position before it converges
const SCREEN_STANDOFF = 3.2;       // how far off the carrier the wall forms

// What the player is told as a wave prints. The tell has to arrive BEFORE the
// tactic reads as one, or the first time they run wide it looks like a bug.
const WAVE_SAID = {
  rush: 'Ports open along the carrier\'s flank. Four of them come straight at you.',
  packs: 'They come out in threes, and the threes do not arrive together.',
  circle: 'The swarm breaks away wide. It is not running: it is getting behind you.',
  screen: 'They put themselves between you and the carrier and stand there.',
  storm: 'Every port opens at once.',
};

/** The order this wave is given. Wave 1 is `rush`, wave 5 is `storm`. */
export function carrierTactic(wave) {
  return CARRIER_TACTICS[Math.max(0, Math.min(CARRIER_TACTICS.length - 1, (wave || 1) - 1))];
}

/** How many machines that order needs. */
export function carrierTacticSize(tactic) {
  return CARRIER_TACTIC_N[tactic] || CARRIER_TACTIC_N.rush;
}

export const CARRIER_GATES = 5;
// #181 — A KING DOES NOT POP.
//
// Five gates of work ended in the same frame of scrap-and-smoke a T-1 gets, and
// the fight is good but the kill landed flat (David, 2026-08-15: "he just kind
// of pops"). So the last blow starts a death rather than being one: for
// CARRIER_DEATH seconds it stops printing, stops moving, and comes apart —
// the rim lets go, the solid at the centre of the shield goes dark, and the
// ports it printed from vent. Then it falls, and the card and the aspis are
// part of the fall rather than things that appear underneath it.
//
// EVERY KING GETS IT. Read off the same `carrier` flag the rest of the fight
// uses, so AJAX, DIOMEDES and ACHILLES die the same way AGAMEMNON does without
// anybody having to remember them.
const CARRIER_DEATH = 2.4;      // seconds of coming apart
const CARRIER_DEATH_VENTS = 5;  // gouts of light out of the print ports, spread over it
const CARRIER_SPOOL = 2.0;         // seconds of opening up BEFORE a wave prints
const CARRIER_SPOOL_MULT = 2;      // damage multiplier while the ports are open
const CARRIER_SEAL_FLASH = 0.3;    // renderer tell when a blow rings off it
// A BLOW ON A SEALED HULL IS NOT A WASTED BLOW (David, 2026-08-15: "shot should
// be registered tho - so handle this nicely").
//
// A hard wall is the lazy version: the bar stops, the player keeps swinging,
// and the game says nothing back. Instead a sealed carrier BITES less — a
// quarter of the damage lands on the hull it still has — and everything past
// the gate is BANKED. When the next wave opens the gate, the bank is spent all
// at once and the bar drops for it.
//
// So working on it between waves is real work, visibly kept and visibly paid.
// What it cannot do is skip a phase, which was the point of the gates.
const CARRIER_SEALED_BITE = 0.25;

/** The hull floor for a carrier that has released `n` of its waves. */
export function carrierFloor(maxHp, waves) {
  const left = Math.max(0, CARRIER_GATES - Math.min(CARRIER_GATES, waves || 0));
  return Math.ceil((maxHp * left) / CARRIER_GATES);
}

/** Is it sealed — at its floor with waves still to come? */
export function carrierSealed(r) {
  if (!r || !r.carrier) return false;
  // SEALED AT FULL HULL IS NOT A DEADLOCK. That was the fear this guard was
  // written against, and it was unfounded: provocation runs off `_struck`,
  // which is set from the ATTEMPTED damage before the gate restores the hull,
  // so a carrier at its first gate still registers every blow, still spools,
  // and still prints. What the guard actually did was leave phase one with no
  // floor at all — see the clamp in updateRobots.
  if (r.waves >= CARRIER_GATES) return false;   // all five out: it can be finished
  return r.hp <= carrierFloor(r.maxHp, r.waves);
}
const CARRIER_LAST_WAVE_EVERY = 2;    // seconds between waves once it does
const CARRIER_LAST_SWARM_CAP = 20;
// Break contact and it stops being a boss fight: no damage and nobody near for
// this long and it gives up, walks home to the factory and patrols. A player
// who is not taking the warrior route can simply leave.
// THE SHIELD is a first phase with its own health bar. While the rim holds it
// eats every blow, so the carrier itself takes nothing; break it and it falls
// off, the machine is bare for the rest of the fight, and the shield is on the
// ground for you to pick up and carry. Two phases out of one boss, and the
// reward for the first one is the thing that was stopping you.
const CARRIER_SHIELD_HP = 34;
// It is GUARDING THE FACTORY, not standing on it (David, 2026-08-14). Its beat
// is a wide perimeter loop rather than the 2.6-tile shuffle a muster post gets,
// so it reads as a sentry walking a building — and hitting the building brings
// it, which is what makes it a guard rather than a boss that happens to be
// parked there. That matters because the factory is the ai-key: the two warrior
// objectives on this island are the same errand.
const CARRIER_BEAT = 8;
const CARRIER_DISENGAGE = 8;
const CARRIER_NEAR = 14;         // the "you are still in this" radius
// THE KING'S OWN SHOT. It had none: the B-1 orbited and printed and never once
// fired, so at range with its swarm cleared it was harmless scenery you plinked
// at (David, 2026-08-15: "the boss does fire lasers yes? they should be
// occasional"). Occasional is the whole specification — this is not a hunter's
// rate of fire, it is a heavy weapon on a machine whose real answer to you is
// the foundry. Slow enough to be an event, hard enough that standing in the
// open through one is a decision.
const CARRIER_FIRE_EVERY = 4.2;  // seconds; a shot you notice, not a stream
const CARRIER_FIRE_RANGE = 11;
const CARRIER_DAMAGE = 9;
const M5_VISION = 13;
const M5_RANGE = 12;            // fires from way back
const M5_MIN_RANGE = 6.5;       // holds this far off; backs away (hides) if you close
const M5_FIRE_COOLDOWN = 1.5;   // a steady, nagging plink
const M5_DAMAGE = 5;            // low power — annoying, not lethal
// What the M-class brings to a turncoat. Shorter reach than its hunt of the
// player and a slower swing: it is policing the ground, not duelling you.
const M6_TURNCOAT_RANGE = 8;
const M6_TURNCOAT_DAMAGE = 14;
const M6_TURNCOAT_COOLDOWN = 0.9;
const TORPOR_BOLT_SPEED = 5.5;  // depart mode (R3): her soporific bolt crawls (vs the 16-t/s war-laser) so you can dodge it
const M4_HP = 16;               // fragile; a couple of hits drops it before it can report far
const M4_VISION = 11;
const M4_CONE_DOT = -0.25;      // a wide ~105°-either-side scout cone
const M4_PATROL_SPEED = 1.5;
const M4_KEEP_RANGE = 7;        // once it has you, it hovers about here, keeping sight while it reports
const M4_FLEE_SPEED = 3.4;
// (No give-up timers for the M-classes: a fortress guard that has acquired you
// stays on the hunt until it is destroyed or a terminal takes it off you. It
// sweeps your last-seen tile indefinitely rather than going home. See updateGuard.)

// ---- M4 scout squads -------------------------------------------------------
// Losing you turns the scouts from a scatter of individuals into a SEARCH TEAM:
// up to four form up and sweep the last contact together in an arrowhead, point
// leading, wings out, tail trailing. It reads as a deliberate hunt rather than
// four machines milling about, and a wall of four sightlines is much harder to
// slip than one.
//
// Spacing is the load-bearing constant here: two machines closer than
// ROBOT_MIN_SEP (0.62) get shoved apart AND chipped for BUMP_DAMAGE each
// (separateRobots), and an M4 only has 16 HP — a squad that flew in tight
// formation would grind itself to scrap. SQUAD_SPACING is ~2.6x the separation
// floor, and followers ease off as they reach their slot rather than driving
// through it, so the formation settles instead of jostling.
const SQUAD_MAX = 4;
const SQUAD_JOIN_R = 18;      // how far apart two searching scouts can be and still form up
const SQUAD_SPACING = 1.9;    // tiles between slots — ~3x ROBOT_MIN_SEP
const SQUAD_SETTLE = 0.4;     // once this close to its slot a follower stops nudging
const SQUAD_REFORM_T = 1.5;   // seconds between re-evaluating team membership (sticky in between)
const SQUAD_PERSONAL = 1.4;   // scouts actively steer apart inside this radius (bump range is 0.62)
const SQUAD_TURN_RATE = 2.2;  // how fast the arrowhead's heading may swing (rad/s), so slots don't whip

// Arrowhead, in formation space: forward = the sweep heading, side = its
// perpendicular. Slot 0 is the point (the leader, who actually drives the sweep).
const SQUAD_SLOTS = [
  { f: 0.9, s: 0 },    // point
  { f: -0.2, s: -1 },  // left wing
  { f: -0.2, s: 1 },   // right wing
  { f: -1.2, s: 0 },   // tail
];

let _squadReformT = 0;

// Nudge a move target away from any scout crowding this one. Bumping costs both
// machines HP (separateRobots), so the fix is to never get that close: each
// scout keeps a personal bubble and steers around its fellows rather than
// being shoved out of them after the fact.
function avoidScouts(r, robots, tx, ty) {
  let ax = 0, ay = 0, crowd = 0;
  for (const o of robots) {
    if (o === r || o.dead || o.fused || o.type !== 'm4') continue;
    const dx = r.x - o.x, dy = r.y - o.y;
    const d = Math.hypot(dx, dy);
    if (d >= SQUAD_PERSONAL) continue;
    // Coincident: push along a deterministic axis rather than dividing by ~0.
    const nx = d > 1e-4 ? dx / d : 1, ny = d > 1e-4 ? dy / d : 0;
    const strength = (SQUAD_PERSONAL - d) / SQUAD_PERSONAL; // 0 at the edge -> 1 at contact
    if (strength > crowd) crowd = strength;
    ax += nx * strength * 3.2;
    ay += ny * strength * 3.2;
  }
  // `crowd` lets the caller ALSO ease off the throttle. Steering alone can't
  // always win: two scouts closing head-on cover the gap inside a frame no
  // matter where their targets point. Slowing as they close is what actually
  // keeps them out of each other.
  return { x: tx + ax, y: ty + ay, crowd };
}

// The same idea for the household guard. Its own bubble is wider than a
// scout's, because an M-6 is a bigger object and two of them at 0.62 tiles
// read as one machine with two heads.
function avoidGuards(r, robots, tx, ty) {
  let ax = 0, ay = 0, crowd = 0, spread = 0;
  for (const o of robots) {
    if (o === r || o.dead || o.fused || o.type !== 'm6') continue;
    const dx = r.x - o.x, dy = r.y - o.y;
    const d = Math.hypot(dx, dy);
    if (d >= M6_PERSONAL) continue;
    const nx = d > 1e-4 ? dx / d : 1, ny = d > 1e-4 ? dy / d : 0;
    const strength = (M6_PERSONAL - d) / M6_PERSONAL;
    if (strength > crowd) crowd = strength;
    ax += nx * strength * 2.6;
    ay += ny * strength * 2.6;
    // Steering alone only fights the ring: two guards holding nearly the same
    // angle are steered apart and then walk straight back, because the place
    // each is going has not moved. Repel on the RING as well, so they end up
    // wanting different points rather than the same point from either side.
    if (o.swarmAngle === undefined) continue;
    let gap = r.swarmAngle - o.swarmAngle;
    while (gap > Math.PI) gap -= 2 * Math.PI;
    while (gap < -Math.PI) gap += 2 * Math.PI;
    if (Math.abs(gap) < M6_RING_GAP) {
      spread += (gap === 0 ? (r.x > o.x ? 1 : -1) : Math.sign(gap)) * strength;
    }
  }
  return { x: tx + ax, y: ty + ay, crowd, spread };
}

// Turn a heading toward a new one at a bounded rate, so the arrowhead swings
// smoothly instead of snapping (a snapped heading teleports the wing slots
// across each other, which is how formation flyers collide).
function steerHeading(cur, want, dt) {
  if (!cur) return want;
  const ca = Math.atan2(cur.y, cur.x), wa = Math.atan2(want.y, want.x);
  let diff = wa - ca;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const max = SQUAD_TURN_RATE * dt;
  const a = ca + Math.max(-max, Math.min(max, diff));
  return { x: Math.cos(a), y: Math.sin(a) };
}

// Re-form the search teams. Called once per frame from updateRobots, before the
// per-robot pass, so slots are current when updateM4 reads them. Membership is
// sticky between re-forms so scouts don't thrash between teams every frame.
function formM4Squads(robots, dt) {
  _squadReformT -= dt;
  const searching = [];
  for (const r of robots) {
    if (r.type !== 'm4') continue;
    const usable = !r.dead && !r.fused && !r.drained && !(r.disabledT > 0) && !r.driven;
    // Searching = hunting, but with no eyes on you and a last-known tile to work.
    if (usable && r.aggro && !r.sees && r.seenX != null) searching.push(r);
    else { r._squad = null; r._slot = -1; r._squadLead = null; }
  }
  if (_squadReformT > 0) return;
  _squadReformT = SQUAD_REFORM_T;
  for (const r of searching) { r._squad = null; r._slot = -1; r._squadLead = null; }
  let squadId = 0;
  for (const lead of searching) {
    if (lead._squad != null) continue;
    const team = [lead];
    for (const other of searching) {
      if (team.length >= SQUAD_MAX) break;
      if (other === lead || other._squad != null) continue;
      if (Math.hypot(other.x - lead.x, other.y - lead.y) <= SQUAD_JOIN_R) team.push(other);
    }
    if (team.length < 2) continue; // a lone scout is not a squad: it keeps its own spiral
    const id = squadId++;
    team.forEach((m, i) => { m._squad = id; m._slot = i; m._squadLead = team[0]; });
  }
}
const M6_BODY = '#232833';      // gunmetal blue-black armour
const M6_HEAD = '#141821';
const M5_BODY = '#2c2430';      // violet-tinged sniper
const M5_HEAD = '#191320';
const M4_BODY = '#3a3f2a';      // drab olive recon shell
const M4_HEAD = '#23281a';

// #159 — the B-1 CARRIER's own palette: BLACK, and the only black machine in the
// game. Every other chassis is a tint — the M6's blue-black gunmetal, the M5's
// violet, the M4's drab olive — so a true black silhouette reads as a different
// order of thing at any distance, before a single detail resolves.
//
// Against it, HERALD GOLD, and it is the only gold on the island, because the
// only gold thing on the island is the credential strapped to its back. The
// whole design is two colours: what it is, and what it is carrying.
// AND THE SHAPE IS AGAMEMNON'S (David, 2026-08-14). Iliad XI opens with the
// king arming: greaves with silver ankle-clasps, a corslet worked in bands, a
// great round shield, and a crested helm that nodded terribly above him. The
// B-1 is that panoply, in black and silver, on a machine — which is the whole
// game's move made once more in armour. It is not a hero. It is a courier with
// a king's kit, guarding a document, and it will not fight you for it.
const B1_BODY = '#0a0b0d';
const B1_PLATE = '#000000';     // beneath the panoply: flat, absolute black
const B1_HEAD = '#040506';
const B1_EDGE = '#1c1f26';      // the one lighter line, so black-on-black still has an edge
// TWO COLOURS AND NO OTHERS: black and gold. The panoply is Agamemnon's, the
// palette is the herald's, and the fact that they are the same gold is the
// point — the armour and the credential were issued by the same estate.
const B1_GOLD = '#c9922e';      // corslet bands, greave clasps, shield rim

// ---- THE AGAMEMNON CLASS ------------------------------------------------
// One to an island, and the only machines the estate NAMED rather than
// numbered (David, 2026-08-15). They are the kings who took Troy by siege and
// by force — which is the joke underneath the whole encounter, because the man
// walking up to them was there too, and did it another way.
//
// The chassis is the same panoply every time: it is one foundry design, and
// what changes is the METAL and the temper. Each is drawn from that king's own
// gear in the poem, not from the island's palette, so you read which king you
// are facing before you read where you are standing.
export const KINGS = {
  b1: {
    name: 'AGAMEMNON', island: 'calypso',
    // Iliad XI: the corslet of Kinyras, the shield with ten bronze circles.
    metal: '#c9922e', hi: '#f2c65e', lo: '#6d4f16',
    blurb: 'the king of men',
    boss: 3,      // tetrahedron: fire, and the first of them
  },
  b2: {
    name: 'AJAX', island: 'polyphemus',
    // Iliad VII: the sevenfold ox-hide shield "like a tower".
    //
    // NOT ANOTHER GOLD (David, 2026-08-15: "B2 looks too similar to B1"). Ajax
    // is the one king whose famous gear is HIDE rather than metal — seven
    // layers of it behind a bronze face — so he is dull, cold and unpolished
    // where Agamemnon is bright. The tower shield does the rest: it is drawn at
    // `shield` scale, which is the thing he is actually known for.
    metal: '#8a8574', hi: '#b6b09a', lo: '#403d33',
    blurb: 'the tower shield',
    shield: 1.6,          // sevenfold: layers, not a wider disc
    rim: 1,
    boss: 4,      // cube: earth, and a tower shield is a tower          // the sevenfold: far more rim to break through
    hull: 0.9,            // but the body under it is no tougher
  },
  b3: {
    name: 'DIOMEDES', island: 'circe',
    // Iliad V: the aristeia, the mortal who wounded two gods in an afternoon.
    // Bronze gone hot; it does not back away from anyone.
    metal: '#b6532c', hi: '#e58a52', lo: '#5e2410',
    blurb: 'the one who wounded gods',
    rim: 1.18,
    boss: 8,      // octahedron: air, drawn as its eight-point star
    press: 0.7,           // it comes at you rather than standing off
    hull: 1.15,
  },
  b4: {
    name: 'ACHILLES', island: 'helios',
    // Iliad XVIII: the shield Hephaistos made, with the sun and moon and the
    // whole earth on it. Silver-white, and the last of them.
    metal: '#cfd4dc', hi: '#ffffff', lo: '#6a707a',
    blurb: 'the shield of the world',
    rim: 1.38,   // Hephaistos made it with the whole earth on it
    boss: 5,      // dodecahedron: the one Plato gave to the COSMOS, and the
                  // shield of Iliad XVIII has the cosmos on it
    hull: 1.3,
    waveScale: 1.25,      // and it prints more of them
  },
};

/** The king a chassis is, or AGAMEMNON for anything that has not said. */
export function kingOf(r) {
  return KINGS[(r && r.designation && r.designation.toLowerCase()) || 'b1'] || KINGS.b1;
}
const B1_GOLD_HI = '#f2c65e';   // the lit edge of all of it
const B1_GOLD_LO = '#6d4f16';   // and its shadow
const B1_CREST = '#f2c65e';     // the helm crest, which nodded terribly
const B1_SHARD_HOT = '#ffe49a'; // the shard runs hotter than the armour
const B1_SHARD_DIM = '#7d6120';
const B1_SCALE = 1.34;          // half again the size of the pack it walks with

// Robots must never overlap: the minimum distance any two live (non-fused)
// machines are allowed to close to, enforced every tick after their own AI
// has moved them, so a swarm spreads out around its target instead of
// stacking on the same tile.
const ROBOT_MIN_SEP = 0.62;
// A collision between two machines chips both of them. LIGHTLY: at 2 a swarm
// crowding one doorway ground itself down without the player doing anything,
// and a garrison could arrive at a fight already half dead from the walk
// (David, 2026-08-15: "make the damage slightly less painful for them"). It
// still costs something, because machines shouldering each other aside should
// not be free — a jam in a corridor is meant to be bad for them.
const BUMP_DAMAGE = 1;
// And a longer breath between chips, which halves the rate again for a crowd
// that stays crowded. Two machines genuinely stuck together still wear down;
// two that brush past each other in a corridor now cost nothing much.
const BUMP_COOLDOWN = 2.5; // seconds before the same machine can be bump-hurt again
// What a bump between two machines on the same network costs instead of HP: a
// beat of standing still while they sort themselves out. Short enough to read
// as a stumble rather than a fault.
const BUMP_YIELD = 0.35;
// CPU budget: robots this far (in tiles) from the player skip their AI and the
// pairwise separation entirely — they're well off-screen, can't affect the
// player, and simply freeze until the player comes near again. This is what
// keeps a large map cheap: only the handful of machines around the player
// think each frame, not every machine everywhere. Squared to avoid a sqrt.
const ACTIVE_RANGE = 42;
const ACTIVE_RANGE_SQ = ACTIVE_RANGE * ACTIVE_RANGE;
function nearPlayer(e, player) {
  const dx = e.x - player.x, dy = e.y - player.y;
  return dx * dx + dy * dy <= ACTIVE_RANGE_SQ;
}

// A player perched on a low crate/rock sits ~1 tile out of melee reach: the
// solid object stops a robot closing the last step. Crates are not meant to be
// safe (unlike a tall wall-block you double-jump onto), so a robot facing a
// player standing on a low climbable (climbHeight <= 1) gets a small reach bonus
// to strike up onto it. Tall walls give no bonus — those stay a genuine perch.
function reachBonus(player, map) {
  if (!map.objectAt) return 0;
  const o = map.objectAt(Math.floor(player.x), Math.floor(player.y));
  const def = o && OBJECTS[o.type];
  return (def && def.climbable && (def.climbHeight || 0) <= 1) ? 0.6 : 0;
}

// W3s: unarmed repair drones fielded by the W-factory. They walk straight to
// the nearest obelisk that's been damaged but not yet destroyed and mend it
// back to full over a few seconds, then disperse (the same generic death
// path scraps them if the player kills one first).
const W3_HP = 20;
const W3_SPEED = 3.0;
const W3_REPAIR_RANGE = 1.3;
const W3_REPAIR_RATE = 2;       // obDamage points healed per second
const W3_UNFREEZE_TIME = 3;     // seconds standing at a looped node to reset it

// Ubik confusion: a hunter that wanders into a brightened patch loses its
// mind for a while — refreshed continuously while inside, decaying once it
// leaves, so lingering in the patch keeps it scrambled rather than a single
// timed hit.
const UBIK_CONFUSE_HOLD = 2.5;      // seconds confusion persists after leaving a patch
const UBIK_CONFUSE_SPEED = 2.2;     // erratic stagger speed
const UBIK_CONFUSE_ATTACK_RANGE = 1.0;
const UBIK_CONFUSE_ATTACK_DAMAGE = 7;
const UBIK_CONFUSE_ATTACK_COOLDOWN = 0.9;
const W3_BODY = '#1c3a44';      // dull blue-teal, unmistakably not a hunter
const W3_HEAD = '#122730';

// W5s: unarmed gardener drones. Never dispatched in response to anything —
// the factory just fields one whenever there isn't already a live one out,
// so there's always roughly one somewhere on the map — and it does nothing
// but wander and, now and then, plant a sapling on open grass nearby. Never
// aggros, never fights back; the same generic death path scraps it like any
// other machine if the player decides to.
const W5_HP = 12;
const W5_SPEED = 1.1;            // a slow, unhurried drift
const W5_WANDER_RANGE = 6;       // local patrol radius around its current recentred "home"
const W5_RECENTER_INTERVAL = 10; // seconds between re-anchoring home to itself — an unbounded slow walk, not a fixed beat
const W5_PLANT_INTERVAL = 18;    // seconds between planting attempts
const W5_PLANT_JITTER = 14;
const W5_PLANT_RANGE = 1;        // plants right beside itself — you see the gardener garden
const W5_BODY = '#243a1c';       // mossy green, reads as gardener not hunter
// Works amber. Every fighting chassis in the roster is a blue, a grey or a
// red-black, so a utility unit gets the one hue nothing else uses: you should
// know a courier from across a field before you can read its badge. The green
// cell in its cradle sits against it rather than in it.
const V1_BODY = '#7d5511';
const V1_HEAD = '#96681a';
// #149: the T-8 wears her island's blue, dimmed. Not the estate's black and not
// a gardener's green — it belongs to the room rather than to the garrison.
const T8_BODY = '#2b3466';
const T8_HEAD = '#3c4a8c';
const V1_CELL = '#7fe0b0';       // the charged cell it carries, lit
// #165 — the V-5 wears the GARDENER'S GREEN on the V-class frame. Colour is the
// job on this island (a blueboxed hunter's eye flushes green the moment it stops
// hunting and starts planting), and shape is the class. So a V-5 reads green at
// a glance and V-class on a second look, which is exactly the two facts about
// it: it does the W-5's work, with the V-1's mind.
const V5_BODY = '#1f4a2a';
const V5_HEAD = '#143520';
const W5_HEAD = '#16240f';

// Line-of-sight give-up: any hunting machine that can't see the player for
// this long stands down for a while (LOSE_INTEREST_COOLDOWN), during which
// normal proximity-based re-detection is suppressed — so ducking behind a
// wall or a hill for a few seconds is a real way to shake pursuit, not just
// a distance game. W1/W4 are dispatched already hunting with no patrol
// range of their own, so they get a plain re-acquire distance for coming
// back off cooldown.
const LOS_GIVEUP_AFTER = 6;
const LOSE_INTEREST_COOLDOWN = 5;
const HUNTER_REACQUIRE_RANGE = 14;
const HUNTER_WANDER_SPEED = 1.8;
const HUNTER_WANDER_RANGE = 6;

const STUCK_AFTER = 2;          // seconds of no progress while aggroed
const STUCK_GIVE_UP = 7;        // pinned this long, the chase is abandoned...
const STUCK_SULK = 12;          // ...and it won't re-acquire for this long
const PROGRESS_FRACTION = 0.25; // moved less than this share of a full step counts as no progress
const SPAWN_MIN_R = 1.5;        // robots seat this far from their tower...
const SPAWN_MAX_R = 4;          // ...to about this far, expanding if crowded
const SPAWN_MAX_R_FALLBACK = 8;
const FACTORY_SPAWN_T = 0.75;  // seconds a factory-dispatched bot flickers in
const SCRAP_MIN = 1;            // scrap dropped on destruction: SCRAP_MIN + 0 or 1

// Battery: every machine spawns part-charged and burns power by activity.
const BATTERY_MAX = 100;
const BATTERY_SPAWN_MIN = 60;   // spawn charge: 60..100, seeded per robot
const BATTERY_SPAWN_VARY = 40;
const BATTERY_LOW = 25;         // hostile machines break off to recharge below this
const DRAIN_PATROL = 0.35;      // battery per second while patrolling / trudging
const DRAIN_CHASE = 1.0;        // battery per second while chasing or stalking
const DRAIN_FRIENDLY = 0.2;     // battery per second in the player's service
const RECHARGE_RANGE = 1.6;     // tiles from home within which the charger reaches
const RECHARGE_RATE = 12;       // battery per second at the obelisk
const RECHARGE_TRAVEL_SPEED = 2.0; // unhurried low-power trudge home
const HP_FLEE_FRAC = 0.2;       // below this fraction of maxHp a machine breaks off to mend
const REPAIR_RATE = 1.5;        // hp per second at the charger — deliberately slow (a T2 from 20% is ~13s)

// Friendly (reprogrammed) behaviour.
const FOLLOW_MAX = 4;           // start moving when the player is further than this...
const FOLLOW_MIN = 2.5;         // ...and stop once back inside this
const FOLLOW_SPEED_T1 = 5.0;    // wheels keep up with a walking player easily
const FOLLOW_SPEED_T2 = 4.2;    // biped matches walking pace, as when hostile
const WORK_RANGE = 3;           // T2 friendlies notice trees within this radius
const WORK_SPEED = 2.0;         // amble over to the job
const CHOP_RANGE = 1.4;         // close enough to swing at the trunk
const CHOP_RATE = 0.7;          // tree hp per second
const TREE_HP_DEFAULT = 4;      // matches the player's felling code
const WOOD_PER_TREE = 2;
const CHOP_SHAKE_EVERY = 0.9;   // seconds between visible trunk shudders
const WORK_SCAN_EVERY = 0.5;    // seconds between searches for a fresh tree

// Palette: dark machinery with a single red light.
const T1_BODY = '#41464d';      // gunmetal wedge
const T1_BODY_EDGE = '#2c3036';
// THE SWARM IS NOT THE GARRISON. A T-1w is a T-1 built cheap and printed by the
// handful, and at a glance in a fight of twelve it read as a garrison T-1 —
// the one distinction a player needs instantly, because one is a real machine
// and the other is a distraction.
//
// OXIDE RED, not a darker grey. The first cut went darker and the little
// machines vanished into their own shadows on grass (David, 2026-08-15) — a
// swarm you cannot pick out is worse than one that looks like a T-1. Red reads
// at a glance, holds against both the grass and the shadow, and sets the swarm
// off from the carrier's black and gold instead of blending into it.
const T1W_BODY = '#7a2b22';
const T1W_BODY_EDGE = '#48160f';
const T1_WHEEL = '#1b1d20';
const T2_BODY = '#2e3138';
const T2_LIMB = '#23262b';
const T2_HEAD = '#26292f';
const EYE_DIM = '#8a1f16';      // sensor idling
const EYE_HOT = '#ff3b2a';      // sensor locked on
const EYE_FRIEND = '#46d95f';   // sensor reprogrammed
const EYE_FRIEND_HALO = 'rgba(70,217,95,0.22)';
const EYE_SOCKET = '#17181b';   // sensor off: a dark empty socket
const STUN_AMBER = [214, 152, 46]; // flickering while stunned
const DRAINED_TONE = -0.4;      // body darkening for a flat battery
const FRIENDLY_TONE = 0.2;      // body lightening for a reprogrammed machine
const FUSED_BODY = '#212123';   // blackened charcoal wreck
const FUSED_EDGE = '#131315';
const FUSED_DARK = '#191a1c';
const BATT_RED = '#7d2018';     // empty-battery marker over a drained machine
const SMOKE_GREY = 'rgba(140,140,140,'; // alpha appended per puff

// ---- Spawning -------------------------------------------------------------

// Base fields common to both classes. Each robot carries its own seeded rng
// so patrols stay deterministic for a given world seed.
function baseRobot(type, x, y, hp, rng) {
  return {
    type,
    x: x + 0.5,
    y: y + 0.5,
    hp,
    maxHp: hp,
    dead: false,
    hurt: false,          // set by the player's strike code; read once here
    home: { x: x + 0.5, y: y + 0.5 },
    facing: { x: 0, y: 1 },
    aggro: false,         // tell: renderer brightens the red sensor
    stuck: false,         // T1 only in practice: aggroed but going nowhere
    returning: false,     // T2 only: trudging back to its tower
    attackTimer: 0,
    noProgressT: 0,
    wanderTarget: null,
    wanderTimer: 0,
    walkPhase: 0,         // drives the T2 leg scissor
    animT: rng() * 10,    // desync idle animation between individuals
    battery: BATTERY_SPAWN_MIN + rng() * BATTERY_SPAWN_VARY,
    drained: false,       // battery hit zero: inert until the player re-batteries it
    recharging: false,    // heading home / drinking from the obelisk
    friendly: false,      // reprogrammed: serves the player, never attacks
    fused: false,         // dead-in-place wreck; external mining code owns it
    zombie: false,        // OB_gun-corrupted: immune to everything but bow/wave gun
    disabledT: 0,         // stun seconds remaining; external code sets this
    reportT: 0,           // seconds left holding station for a status report (net.js REPORT)
    reportCool: 0,        // seconds until it will answer another request
    limping: false,       // on the reserve cell, crawling home (net.js FORCE HOME)
    reserveSpent: false,  // the reserve is one charge and it does not come back
    scrapPenalty: false,  // set by external gun code: a penalised kill drops 1
    workTarget: null,     // T2 friendly: the tree currently being felled
    workScanT: 0,
    chopPulseT: 0,
    following: false,     // friendly follow hysteresis between FOLLOW_MIN/MAX
    bumpCooldown: 0,      // seconds before another machine colliding with this one can hurt it again
    // A T1 or T2 runs on a program it carries. Every other class
    // still has its policy compiled into this file; they get no program, and
    // `program: null` is what their page reports.
    program: type === 't1' ? T1_PROGRAM : type === 't1w' ? T1W_PROGRAM : type === 't2' ? T2_PROGRAM : type === 't3' ? T3_PROGRAM : type === 'w4' ? W4_PROGRAM : type === 'w1' ? W1_PROGRAM : type === 'w3' ? W3_PROGRAM : type === 'w5' ? W5_PROGRAM : type === 't8' ? T8_PROGRAM : null,
    // #149: a dancer's own place in the bar, so four of them keep the same beat
    // without nodding in lockstep.
    _t8Phase: type === 't8' ? rng() * Math.PI * 2 : 0,
    mlT: rng() * ML_TICK, // stagger the decision tick across a garrison
    intent: null,         // what the program last chose
    fault: null,          // why it last refused to choose; null while healthy
    rng: makeRng(Math.floor(rng() * 0xffffffff)),
  };
}

// A tile a robot may be seated on: in bounds, walkable, at ground level or
// above (the towers do not deploy machines into hollows), and NOT on the
// factory's own floor.
//
// That last one is a bug fix (#136). A factory dispatch seats its unit in a
// ring of up to eight tiles around the muster point, and the muster point is
// a tile and a half in front of the doors — so the ring reaches back over the
// building. The factory's interior tiles are walkable, because units stand in
// it while it prints, but they are enclosed: a unit seated there is walled in
// for good. Every footprint tile carries the factory in the object grid, so
// asking what is on the tile is enough to keep the ring off the roof.
function seatable(map, x, y, avoid, used) {
  if (map.isSolid(x, y)) return false;
  if (map.heightAt(x, y) < 0) return false;
  const on = map.objectAt ? map.objectAt(x, y) : null;
  if (on && on.type === 'wfactory') return false;
  if (Math.hypot(x + 0.5 - avoid.x, y + 0.5 - avoid.y) < avoid.r) return false;
  return !used.has(`${x},${y}`);
}

// Pick a free tile in a ring around the tower, widening the ring if the
// near ground is all solid or spoken for. Returns [x, y] or null.
//
// THE ORIGIN IS FLOORED FIRST, and that is the other half of #136. The map's
// grids are indexed `grid[y * w + x]` with no rounding, so a fractional
// coordinate reads off the end of the array and comes back undefined: heightAt
// gives undefined (and `undefined < 0` is false), objectAt gives undefined, and
// isSolid gives FALSE for every tile it is asked about. A factory musters at
// `wfactory.y + fh + 1.5`, which is always fractional, so every candidate in
// its ring was landing on a half-tile and passing every test unexamined —
// walls, water, hollows and the factory's own floor alike. Flooring here puts
// the search back on real tiles, and the checks in seatable start working.
function seatNear(map, ox, oy, avoid, used, rng, maxR) {
  ox = Math.floor(ox);
  oy = Math.floor(oy);
  const candidates = [];
  for (let dy = -maxR; dy <= maxR; dy++) {
    for (let dx = -maxR; dx <= maxR; dx++) {
      const d = Math.hypot(dx, dy);
      if (d < SPAWN_MIN_R || d > maxR + 0.2) continue;
      const x = ox + dx, y = oy + dy;
      if (seatable(map, x, y, avoid, used)) candidates.push([x, y]);
    }
  }
  if (!candidates.length) {
    return maxR < SPAWN_MAX_R_FALLBACK
      ? seatNear(map, ox, oy, avoid, used, rng, SPAWN_MAX_R_FALLBACK)
      : null;
  }
  return candidates[Math.floor(rng() * candidates.length)];
}

// A free, walkable tile hugging a tree within maxR of (ox, oy) — the T3's
// "nest" spot. Checks the four tiles orthogonally adjacent to each tree in
// range and keeps the closest free one; returns null if nothing qualifies,
// so the caller can fall back to the normal obelisk-ring seat.
function nearestTreeNest(map, ox, oy, maxR, used) {
  let best = null, bestD = Infinity;
  for (const o of map.objects) {
    if (o.type !== 'tree') continue;
    const d = Math.hypot(o.x - ox, o.y - oy);
    if (d > maxR) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const tx = o.x + dx, ty = o.y + dy;
      if (map.isSolid(tx, ty)) continue;
      if (map.heightAt && map.heightAt(tx, ty) < 0) continue;
      if (used.has(`${tx},${ty}`)) continue;
      if (d < bestD) { bestD = d; best = [tx, ty]; }
    }
  }
  return best;
}

// One T1 sentry per tower; every second tower also fields a T2 stalker.
export function spawnRobots(map, seed, obelisks, avoid) {
  const rng = makeRng(seed);
  const robots = [];
  const used = new Set();

  obelisks.forEach((ob, i) => {
    const wants = i % 2 === 1 ? ['t1', 't2'] : ['t1'];
    if (i % 6 === 5) wants.push('t3'); // rare: roughly one tower in six
    for (const type of wants) {
      let spot = seatNear(map, ob.x, ob.y, avoid, used, rng, SPAWN_MAX_R);
      if (!spot) continue; // tower stands in a dead corner: no machine
      if (type === 't3') {
        // Ambush unit: prefers to nest beside a nearby tree over the open
        // ring every other machine seats in, matching its "hides and waits"
        // behaviour. Best-effort — falls back to the normal seat if no tree
        // is close enough.
        const nest = nearestTreeNest(map, spot[0], spot[1], T3_NEST_SEARCH_R, used);
        if (nest) spot = nest;
      }
      used.add(`${spot[0]},${spot[1]}`);
      robots.push(baseRobot(type, spot[0], spot[1],
        type === 't1' ? T1_HP : type === 't3' ? T3_HP : T2_HP, rng));
    }
  });

  return robots;
}

// A revenge squad released the instant an obelisk falls: two to four W1s
// seated around the crater, immediately hunting. `seed` should vary per call
// (e.g. folded with the obelisk's coordinates) so repeat destructions don't
// all produce the same squad.
export function spawnW1s(map, seed, ox, oy, count = 3) {
  const rng = makeRng(seed >>> 0);
  const used = new Set();
  const avoid = { x: ox, y: oy, r: 0 };
  const squad = [];
  for (let i = 0; i < count; i++) {
    const spot = seatNear(map, ox, oy, avoid, used, rng, SPAWN_MAX_R_FALLBACK);
    if (!spot) continue;
    used.add(`${spot[0]},${spot[1]}`);
    const r = baseRobot('w1', spot[0], spot[1], W1_HP, rng);
    r.aggro = true; // deployed hunting: no detection phase
    r.spawnT = FACTORY_SPAWN_T; // flicker into existence out of the factory
    // Evenly spread around the target angle-wise (plus a little jitter) so a
    // squad surrounds rather than stacks, and staggered attack/withdraw
    // phases so the wave doesn't hit and retreat in perfect unison.
    r.swarmAngle = (2 * Math.PI * i) / count + (rng() - 0.5) * 0.5;
    r.swarmSpin = 0.15 + rng() * 0.15;
    r.w1Phase = rng() < 0.5 ? 'attack' : 'withdraw';
    r.w1PhaseT = 1 + rng() * (r.w1Phase === 'attack' ? W1_ATTACK_TIME : W1_WITHDRAW_TIME);
    squad.push(r);
  }
  return squad;
}

// HP by chassis, so a unit can be rebuilt from a save record without the caller
// having to know the table. Anything absent falls back to a T-1's.
const HP_BY_TYPE = {
  t1: T1_HP, t1w: T1W_HP, t2: T2_HP, t3: T3_HP, t8: T8_HP, v1: V1_HP,
  w1: W1_HP, w3: W3_HP, w4: W4_HP, m4: M4_HP, m5: M5_HP, m6: M6_HP, b1: CARRIER_HP,
};

/**
 * REBUILD A UNIT FROM ITS SAVE RECORD.
 *
 * The seeded roster regenerates itself from the world seed, but everything the
 * W-FACTORY printed during play does not: those machines were pushed onto the
 * robot list mid-run, so at load time there is nothing for their record to
 * match and the save quietly dropped them (David, 2026-08-15: "I reload a save
 * and the robots I had programmed have vanished"). On a long run the factory
 * makes most of the population — a W-4 goes out every time you touch a tower —
 * so this was the majority of what a player had reprogrammed.
 *
 * Everything here comes off the record: where it stood, which tower it is
 * posted to, and what it was running. It is not a fresh machine wearing an old
 * name; it is the machine, put back.
 */
export function reviveUnit(rec, seed = 1) {
  const type = String(rec && rec.type || '');
  if (!type || !CHASSIS[type]) return null;
  const rng = makeRng((seed ^ 0x9e37) >>> 0);
  const hp = HP_BY_TYPE[type] || T1_HP;
  // baseRobot centres on the tile, so hand it the corner and let it do that.
  const r = baseRobot(type, (rec.x ?? 0) - 0.5, (rec.y ?? 0) - 0.5, hp, rng);
  if (Array.isArray(rec.home) && rec.home.length === 2) {
    r.home = { x: rec.home[0], y: rec.home[1] };
  }
  // A V-class runs weights, and a revived one must not come back as a blank
  // chassis: give it a model unless the record carries a posted one.
  if (type === 'v1') {
    r.modelSeed = rec.ms ?? (seed >>> 3);
    r.gardener = !!rec.gfit;
    r.designation = r.gardener ? 'V5' : 'V1';
    r.program = makeVModel(r.modelSeed, r.gardener ? v5BuildName(r.modelSeed) : v1BuildName(r.modelSeed));
  } else {
    // Thunks, because several of these constants are declared further down the
    // file — the lookup has to happen at revive time, not at module load.
    r.program = STOCK_PROGRAM[type] ? STOCK_PROGRAM[type]() : null;
  }
  return r;
}

/** The program a chassis ships with, for a unit rebuilt from a save. */
const STOCK_PROGRAM = {
  t1: () => T1_PROGRAM, t1w: () => T1W_PROGRAM, t2: () => T2_PROGRAM,
  t3: () => T3_PROGRAM, w4: () => W4_PROGRAM, w1: () => W1_PROGRAM,
  w3: () => W3_PROGRAM, w5: () => W5_PROGRAM, t8: () => T8_PROGRAM,
};

// A fresh T1 or T2 the factory builds to re-garrison an obelisk that's lost its
// guards. Spawns at the factory (fx,fy), flickers in, and takes the tower's
// seat as `home` — so it walks over there and patrols around it (patrol/updateT1
// wander around `home`), exactly like an original garrison.
export function spawnGuard(map, seed, fx, fy, type, home) {
  const rng = makeRng(seed >>> 0);
  const used = new Set();
  const spot = seatNear(map, fx, fy, { x: fx, y: fy, r: 0 }, used, rng, SPAWN_MAX_R_FALLBACK);
  if (!spot) return null;
  const r = baseRobot(type, spot[0], spot[1], type === 't1' ? T1_HP : T2_HP, rng);
  r.home = { x: home.x, y: home.y }; // its posting: the undefended tower
  r.spawnT = FACTORY_SPAWN_T;         // flicker into existence out of the factory
  return r;
}

// A W4 laser hunter-killer, dispatched from the factory the instant the
// player attacks an obelisk. `seed` should vary per call.
export function spawnW4(map, seed, fx, fy) {
  const rng = makeRng(seed >>> 0);
  const used = new Set();
  const avoid = { x: fx, y: fy, r: 0 };
  const spot = seatNear(map, fx, fy, avoid, used, rng, SPAWN_MAX_R_FALLBACK);
  if (!spot) return null;
  const r = baseRobot('w4', spot[0], spot[1], W4_HP, rng);
  r.aggro = true;
  r.spawnT = FACTORY_SPAWN_T;
  return r;
}

// One repair drone off the factory floor, sent out to mend the nearest
// damaged obelisk. `seed` should vary per call so its seated tile isn't
// always the same.
export function spawnW3(map, seed, fx, fy) {
  const rng = makeRng(seed >>> 0);
  const used = new Set();
  const avoid = { x: fx, y: fy, r: 0 };
  const spot = seatNear(map, fx, fy, avoid, used, rng, SPAWN_MAX_R_FALLBACK);
  if (!spot) return null;
  const r = baseRobot('w3', spot[0], spot[1], W3_HP, rng);
  r.spawnT = FACTORY_SPAWN_T;
  return r;
}

// One gardener drone off the factory floor. No target, no urgency — it just
// starts wandering from wherever it's seated.
export function spawnW5(map, seed, fx, fy) {
  const rng = makeRng(seed >>> 0);
  const used = new Set();
  const avoid = { x: fx, y: fy, r: 0 };
  const spot = seatNear(map, fx, fy, avoid, used, rng, SPAWN_MAX_R_FALLBACK);
  if (!spot) return null;
  const r = baseRobot('w5', spot[0], spot[1], W5_HP, rng);
  r.spawnT = FACTORY_SPAWN_T;
  return r;
}

// #149: the dancers. Seated ON the lit floor rather than at a tower, because
// that is where they have been — the grove is their post, and the point of them
// is that the room was not empty before you walked into it. `spawnT` is left at
// zero: a factory unit flickers into being because it has just been made, and
// these have been here longer than the estate has been quiet.
export function spawnT8s(map, seed, cx, cy, count = 4) {
  const out = [];
  const rng = makeRng((seed ^ 0x7a8e) >>> 0);
  const used = new Set();
  let tries = 0;
  while (out.length < count && tries++ < count * 40) {
    // Somewhere in the clearing, off the middle so they are not all on her core.
    const a = rng() * Math.PI * 2, d = 5 + rng() * 9;
    const tx = Math.round(cx + Math.cos(a) * d), ty = Math.round(cy + Math.sin(a) * d);
    if (map.floorAt(tx, ty) !== 'lumen') continue;
    const spot = seatNear(map, tx, ty, { x: tx, y: ty, r: 0 }, used, rng, 3);
    if (!spot) continue;
    const r = baseRobot('t8', spot[0], spot[1], T8_HP, rng);
    r.home = { x: spot[0], y: spot[1] };
    out.push(r);
  }
  return out;
}

// A V-1 courier, seated at a tower like the fighters so it has a home obelisk
// and therefore a natural name (OB_XXXX.v1) that survives a save.
export function spawnV1(map, seed, fx, fy) {
  const rng = makeRng(seed >>> 0);
  const spot = seatNear(map, fx, fy, { x: fx, y: fy, r: 0 }, new Set(), rng, SPAWN_MAX_R_FALLBACK);
  if (!spot) return null;
  const r = baseRobot('v1', spot[0], spot[1], V1_HP, rng);
  r.spawnT = FACTORY_SPAWN_T;
  r.cargo = false;
  // Its weights are its own. The seed is the tower it belongs to, so the same
  // unit reads the same on every load — a checkpoint you can diff against.
  r.modelSeed = ((seed >>> 0) % 100000) + 1;
  r.program = makeVModel(r.modelSeed, v1BuildName(r.modelSeed));
  return r;
}

/**
 * A V-5: the V-class frame carrying a gardener's model. Same net, same forward
 * pass, its own weights — floating point all the way down, like its sibling.
 *
 * The seed is offset from the V-1's so the two never grow the same numbers: a
 * player who diffs one model against the other should find two different
 * machines, not one machine twice.
 */
export function spawnV5(map, seed, fx, fy) {
  const r = spawnV1(map, seed ^ 0x5eed5, fx, fy);
  if (!r) return null;
  r.gardener = true;
  r.designation = 'V5';
  r.program = makeVModel(r.modelSeed, v5BuildName(r.modelSeed));
  return r;
}

// V5_04, V5_37 — the same stamp as a V-1's, wearing the other number.
export function v5BuildName(seed) {
  return `V5_${String((seed | 0) % 100).padStart(2, '0')}`;
}

// V1_04, V1_37 — the foundry's build stamp, from the unit's own seed.
export function v1BuildName(seed) {
  return `V1_${String((seed | 0) % 100).padStart(2, '0')}`;
}

// The island's tending drones, each GARRISONED to a tower — seated a little off
// it, the way the fighters are, so a gardener has a home obelisk (and therefore
// a stable natural name, OB_XXXX.w5) and can be found, tagged and saved like the
// rest of the roster. Deterministic from the seed: which towers get one is a
// seeded shuffle, not Math.random, so the same island brings the same gardeners
// back on reload — which is what the tag/program persistence keys off.
export function spawnGardeners(map, seed, obelisks, count = 2) {
  const out = [];
  if (!obelisks || !obelisks.length) return out;
  const rng = makeRng((seed ^ 0x9a4d) >>> 0);
  const order = obelisks.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  for (const idx of order) {
    if (out.length >= count) break;
    const ob = obelisks[idx];
    const g = spawnW5(map, (seed ^ (0x5ad + out.length * 131)) >>> 0, ob.x, ob.y);
    if (g) out.push(g);
  }
  return out;
}

// The island's couriers, one per island by default, garrisoned to a tower the
// same way the gardeners are so each has a home obelisk and therefore a natural
// name (OB_XXXX.v1) that survives a save. Deterministic from the seed: which
// tower gets the courier is a property of the island, not of the session.
export function spawnCouriers(map, seed, obelisks, count = 1) {
  const out = [];
  if (!obelisks || !obelisks.length) return out;
  const rng = makeRng((seed ^ 0x7c1a) >>> 0);
  const order = obelisks.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  for (const idx of order) {
    if (out.length >= count) break;
    const ob = obelisks[idx];
    const v = spawnV1(map, (seed ^ (0xc0de + out.length * 149)) >>> 0, ob.x, ob.y);
    if (v) out.push(v);
  }
  return out;
}

/**
 * #165 — the island's V-5 gardeners, garrisoned to towers like the W-5s so each
 * has a home, a natural name and a place in its tower's roster.
 *
 * There are MORE of these than there are V-1s, and deliberately: the V-1 is one
 * courier doing invisible work, which is why nobody has ever seen the V-class
 * (David, 2026-08-14: "we must get the V1 in the game"). A gardener is out in
 * the open doing something you can watch, so the V-class finally has a member
 * you meet.
 */
export function spawnVGardeners(map, seed, obelisks, count = 2, taken = null) {
  const out = [];
  if (!obelisks || !obelisks.length) return out;
  const rng = makeRng((seed ^ 0x5a4d) >>> 0);
  const order = obelisks.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  // ONE V-CLASS PER TOWER. A courier and a gardener sharing a home would share
  // a save key too (same chassis, same tower), and the roster would list two
  // machines whose natural names are indistinguishable. `taken` is the towers
  // the couriers already hold.
  const used = new Set((taken || []).map((r) => `${Math.round(r.home.x)},${Math.round(r.home.y)}`));
  for (const idx of order) {
    if (out.length >= count) break;
    const ob = obelisks[idx];
    if (used.has(`${Math.round(ob.x)},${Math.round(ob.y)}`)) continue;
    const v = spawnV5(map, (seed ^ (0x5e5e + out.length * 167)) >>> 0, ob.x, ob.y);
    if (v) out.push(v);
  }
  return out;
}

// Seat a fortress guard of `type` near (mx, my). `fromFactory` adds the
// materialisation flicker for alarm-wave dispatches; the standing patrol spawns
// without it. Shared by the M4/M5/M6 spawners below.
function spawnGuardType(map, seed, mx, my, type, hp, fromFactory) {
  const rng = makeRng(seed >>> 0);
  const spot = seatNear(map, Math.floor(mx), Math.floor(my), { x: mx, y: my, r: 0 }, new Set(), rng, SPAWN_MAX_R_FALLBACK);
  if (!spot) return null;
  const r = baseRobot(type, spot[0], spot[1], hp, rng);
  r.hardened = true; // cannot be reprogrammed — drain one and it's only scrap
  // MAINS-POWERED. A fortress guard draws off the fortress, not a cell it has to
  // go and refill: it never runs its battery down, never breaks off the hunt to
  // trudge home and recharge, and never goes flat where it stands. Overworld
  // scavengers keep the battery economy; these do not, because a guard that
  // wanders off mid-raid to sit at its muster point reads as broken AI, not as
  // logistics. They stop for exactly three things: being killed, being stunned
  // or driven from a terminal (disabledT / driven), and the island's mind dying.
  r.mains = true;
  if (fromFactory) r.spawnT = FACTORY_SPAWN_T;
  return r;
}

// A light M4 report drone — the dormant fortress's patrol.
export function spawnM4(map, seed, mx, my, fromFactory = false) {
  return spawnGuardType(map, seed, mx, my, 'm4', M4_HP, fromFactory);
}
// An M5 sniper — hangs back, plinks orange lasers. Alarm-wave only.
export function spawnM5(map, seed, mx, my, fromFactory = true) {
  return spawnGuardType(map, seed, mx, my, 'm5', M5_HP, fromFactory);
}

// #159 — a T-1w, printed to a wave order. It comes out of the carrier already
// hunting and already flickering in, because it was made a second ago.
//
// NOT hardened, unlike the M-classes: the swarm is ordinary field-programmable
// stock, so `post` works on one and the player can turn it instead of breaking
// it. Battery-powered like the overworld machines rather than mains-fed like a
// guard, which means a swarm the player simply outlasts goes flat on its own.
export function spawnT1w(map, seed, mx, my) {
  const rng = makeRng(seed >>> 0);
  const spot = seatNear(map, Math.floor(mx), Math.floor(my), { x: mx, y: my, r: 0 }, new Set(), rng, SPAWN_MAX_R_FALLBACK);
  if (!spot) return null;
  const r = baseRobot('t1w', spot[0], spot[1], T1W_HP, rng);
  r.spawnT = FACTORY_SPAWN_T;
  r.aggro = true;
  // The plate reads T1w, lowercase w — the foundry's own convention for a
  // sub-variant of a class rather than a class of its own, the same way the
  // siren's repair unit wears T1a. `T1W` would claim it is a W-class, which it
  // is not: it is a T-1 built to a wave order.
  r.designation = 'T1w';
  return r;
}
// #159 — THE CARRIER. One per island, and the warrior's road to the HERMES card
// (docs/PLAN.md). A fortress that can forge the credential has to
// move the credential, so one M-class captain is carrying the shard itself.
//
// It is an M6 chassis underneath, with the differences that make it read as the
// boss it is rather than as a tough one of the pack: it is named, it withdraws
// instead of charging (updateCarrier), and it answers damage with a wave of
// T-1w swarm robots. What it carries matters more to the fortress than you do.
/**
 * A king of the AGAMEMNON class. `mark` picks which one ('b1'..'b4'); each
 * island has exactly one, and the mark decides its metal, its hull and how it
 * fights. The chassis and the whole gate/wave machinery are shared — a king is
 * the same panoply with a different temper, not a different machine.
 */
export function spawnCarrier(map, seed, mx, my, fromFactory = false, post = null, mark = 'b1') {
  const K = KINGS[mark] || KINGS.b1;
  const hp = Math.round(CARRIER_HP * (K.hull || 1));
  const r = spawnGuardType(map, seed, mx, my, 'b1', hp, fromFactory);
  if (!r) return null;
  // Its own name and colours ride on the machine, so the renderer, the roster
  // and the save all read the same king off one place.
  r.designation = mark.toUpperCase();
  r.metal = K.metal; r.metalHi = K.hi; r.metalLo = K.lo;
  r.kingName = K.name;
  if (K.shield) r.shieldScale = K.shield;
  r.rimScale = K.rim || 1;
  if (K.press) r.pressScale = K.press;
  if (K.waveScale) r.waveScale = K.waveScale;
  // WHAT IT IS GUARDING. `postObj` is the structure itself, watched for damage
  // the same way it watches its own hull, so no damage site had to learn that
  // the factory has a sentry. `home` is the centre of the beat it walks.
  if (post) {
    r.postObj = post;
    r.home = { x: post.x + (post.fw || 1) / 2, y: post.y + (post.fh || 1) / 2 };
    r._postHp = post.hp;
  }
  r.rng = makeRng((seed ^ 0x11e2) >>> 0);
  r.m6Phase = 'withdraw';
  r.swarmAngle = r.rng() * Math.PI * 2;
  r.swarmSpin = (r.rng() < 0.5 ? -1 : 1) * (0.1 + r.rng() * 0.15);
  r.carrier = true;
  // The name is the tell. Every other machine on the island reports as its class
  // and its home tower; this one has a designation, so a player who scans it or
  // clicks its tag learns there is something singular here before they find out
  // the hard way what it is holding.
  // AGAMEMNON class. The machine was drawn from the arming scene in Iliad XI at
  // David's direction, and every comment in this file already said so — only
  // the NAME was mine, and "carrier" was both wrong (it does not carry the
  // swarm anywhere, it prints it where it stands) and taken: the phone help
  // uses `carrier` in the telecoms sense, for a network with no customers left,
  // only subjects. The B-class are the only machines the estate named rather
  // than numbered, which is the point of them (David, 2026-08-15).
  r.unitName = `${mark.toUpperCase().replace('B', 'B-')} ${K.name}`;
  // IT SERVES ITS SOURCE. `hardened` (set by spawnGuardType) makes `post` refuse
  // it, but the host table serves `r.program` to a GET regardless — so a player
  // with a NostBook can read the carriage doctrine and the commented-out three
  // laws sitting above it, and can do precisely nothing about either.
  r.program = B1_PROGRAM;
  // The first wave is not free: it has to be provoked, and then it still waits
  // out the grace before anything prints.
  r.waveT = 0;
  r.waves = 0;            // gates released; the fight's whole progress
  r.spoolT = 0;           // counts down the telegraph before a wave
  r.banked = 0;           // damage held on a sealed hull, spent at the next gate
  r.struckT = 0;
  r.shieldHp = Math.round(CARRIER_SHIELD_HP * (K.shield || 1));
  r.shieldMax = Math.round(CARRIER_SHIELD_HP * (K.shield || 1));
  // Seed the hull watermark at spawn rather than lazily on first tick. Lazily
  // meant that if the very first update a carrier ever got was the one where it
  // had already been shot, the baseline was read AFTER the damage and the blow
  // was invisible to the shield.
  r._lastHp = r.hp;
  return r;
}

// An M6 pack robot — waves of 3-5. Alarm-wave dispatch. Staggered wave phase so
// a squad doesn't attack and withdraw in perfect unison.
export function spawnM6(map, seed, mx, my, fromFactory = true) {
  const r = spawnGuardType(map, seed, mx, my, 'm6', M6_HP, fromFactory);
  if (r) {
    r.rng = makeRng((seed ^ 0x51ce) >>> 0);
    r.m6Phase = r.rng() < 0.5 ? 'attack' : 'withdraw';
    r.m6PhaseT = 1 + r.rng() * (r.m6Phase === 'attack' ? M6_ATTACK_TIME : M6_WITHDRAW_TIME);
    r.swarmAngle = r.rng() * Math.PI * 2;
    r.swarmSpin = (r.rng() < 0.5 ? -1 : 1) * (0.1 + r.rng() * 0.15);
  }
  return r;
}

// ---- Movement helpers -----------------------------------------------------

const CORNERS = [
  [-RADIUS, -RADIUS], [RADIUS, -RADIUS],
  [-RADIUS, RADIUS], [RADIUS, RADIUS],
];

// Is tile (tx,ty) blocked for a robot? Normally identical to map.isSolid — a
// tree (a `soft` object) blocks a machine, which is what makes woods the player's
// cover. But a robot flagged `allowSoft` (wedged against a tree and going nowhere,
// see moveToward) may SHOVE THROUGH a soft object as a last resort, so it never
// freezes for good behind a single trunk. Hard objects (walls, rock, the factory)
// and solid floor (deep water) still block even then.
function isBlocked(map, tx, ty, allowSoft) {
  if (!allowSoft) return map.isSolid(tx, ty);
  if (!map.inBounds(tx, ty)) return true;
  const o = map.objectGrid[ty * map.w + tx];
  if (o && OBJECTS[o.type].soft) {
    const wf = map.floorAt(tx, ty);
    return wf === 'water' || wf === 'sea';   // push through the trunk, never onto water
  }
  return map.isSolid(tx, ty);
}

// T1 height rule: a wheeled wedge cannot gain height, full stop. Each corner
// keeps its own reference (the tile it is on now), so the body can roll
// cleanly down a step it is straddling but no corner ever moves onto a tile
// higher than the one under it. Everything else — being walled off by a
// one-step ridge, being trapped for good in a hollow — falls out of this.
function collidesT1(map, r, nx, ny, allowSoft) {
  for (const [ox, oy] of CORNERS) {
    const tx = Math.floor(nx + ox);
    const ty = Math.floor(ny + oy);
    if (isBlocked(map, tx, ty, allowSoft)) return true;
    const from = surfaceUnder(map, Math.floor(r.x + ox), Math.floor(r.y + oy), r.footZ, 1);
    const to = surfaceUnder(map, tx, ty, from, 1);
    if (to == null || to > from) return true;
  }
  return false;
}

/**
 * The level a machine of `body` blocks' height would stand on at this tile,
 * coming from `fromZ` (#188).
 *
 * COLUMNS, NOT THE FLAT HEIGHT. `heightAt` answers with the top of the column,
 * so a machine standing under a walkway read the DECK as the ground and found
 * itself three levels below where the map said it was — which is a wall it
 * cannot see and cannot get round. The player has walked on `standingHeightAt`
 * since the terrain rewrite's stage 5; this is the other half of that stage,
 * which the machines never got.
 *
 * `null` means there is nothing to stand on within a step, which the callers
 * read as blocked.
 */
function surfaceUnder(map, tx, ty, fromZ, body) {
  if (!map.standingHeightAt) return map.heightAt(tx, ty);
  const z = fromZ == null ? Infinity : fromZ;
  return map.standingHeightAt(tx, ty, z, 1, body);
}

// T2 height rule: same scheme as Player.collides — steps of one level either
// way are fine, anything steeper blocks.
function collidesT2(map, r, nx, ny, allowSoft) {
  const h = r.footZ != null ? r.footZ : surfaceUnder(map, Math.floor(r.x), Math.floor(r.y), null, 2);
  for (const [ox, oy] of CORNERS) {
    const tx = Math.floor(nx + ox);
    const ty = Math.floor(ny + oy);
    if (isBlocked(map, tx, ty, allowSoft)) return true;
    const s = surfaceUnder(map, tx, ty, h, 2);
    if (s == null || Math.abs(s - h) > 1) return true;
  }
  return false;
}

function collides(map, r, nx, ny, allowSoft) {
  return isWheeled(r) ? collidesT1(map, r, nx, ny, allowSoft) : collidesT2(map, r, nx, ny, allowSoft);
}

function moveAxis(r, dx, dy, map, allowSoft) {
  const nx = r.x + dx;
  const ny = r.y + dy;
  if (!collides(map, r, nx, ny, allowSoft)) {
    r.x = nx;
    r.y = ny;
    // WHICH LEVEL IT IS ON, remembered (#188). Without this a machine under a
    // deck asks the column afresh every frame with no feet to ask from, gets
    // the deck, and is walled in by a structure it is standing beneath.
    const s = surfaceUnder(map, Math.floor(nx), Math.floor(ny), r.footZ, isWheeled(r) ? 1 : 2);
    if (s != null) r.footZ = s;
  }
}

// Wedged against a tree for this long, a robot shoves through it (see isBlocked /
// the soft-push escape). Short, so a hunter pinned behind one trunk frees itself
// in well under a second rather than buzzing at it; the burst latch then keeps the
// door open just long enough to clear a whole copse in one walk.
const SOFT_UNSTICK_AFTER = 0.6;
const SOFT_PUSH_BURST = 0.5;

// Update a robot's soft-stuck bookkeeping after a move. If the move was made WITH
// soft-push help and actually got somewhere, refresh the burst (keep clearing the
// copse) and clear the stall timer. Otherwise: a near-zero move toward a target
// still meaningfully far away is a stall — count it; any real progress resets it.
function trackSoftStuck(r, moved, step, len, dt, allowSoft) {
  if (allowSoft && moved > step * 0.5) { r._softPushBurst = SOFT_PUSH_BURST; r._softStuckT = 0; return; }
  // A STALL IS A MOVE THAT DID NOT HAPPEN, however short it was going to be.
  // The gate used to be `len > 0.6`, so a machine aiming at a point less than
  // two-thirds of a tile away and covering none of it counted as arrived rather
  // than as stuck — and the soft-push escape, which is the only thing that gets
  // a walker out of a copse, never fired. Measured on an M-6 in a dense stand:
  // it stood perfectly still for five seconds with the stall clock at zero, and
  // moved the instant its standoff angle drifted far enough to clear 0.6
  // (David, 2026-08-18: "M6 gets stuck in trees").
  //
  // `step` is `min(speed * dt, len)`, so a machine standing ON its target has a
  // step of about nothing and is not counted — which is the case the old gate
  // was reaching for and caught far too much else with.
  // AND ONE GOOD FRAME DOES NOT CLEAR THE RECORD. Measured after the first fix:
  // the clock climbed to 0.5 and reset, over and over, never reaching the 0.6
  // threshold, because a machine wedged in a copse gets one decent frame in
  // five as it grinds along a trunk — and a hard reset threw the other four
  // away. It DECAYS instead, at twice the rate it builds: a machine genuinely
  // walking clears it almost at once, and one that is mostly stuck accumulates
  // no matter how it jitters.
  //
  // (An absolute floor was tried first and was wrong: a limping unit at 0.55
  // tiles a second covers nine thousandths of a tile in a frame, so any fixed
  // distance calls honest slow walking a stall.)
  if (step > 1e-4 && moved < step * 0.35) r._softStuckT = (r._softStuckT || 0) + dt;
  else r._softStuckT = Math.max(0, (r._softStuckT || 0) - dt * 2);
}

// Step towards a point; axis-separated so robots slide along walls and
// ledges. Returns the distance actually covered this step.
// Straight-line distance to the player. The M-6's boxed-in clause needs to
// know when it has actually arrived rather than when its orbit point says it
// should have.
function realDist(r, player) { return Math.hypot(player.x - r.x, player.y - r.y); }

function moveToward(r, tx, ty, speed, dt, map) {
  const dx = tx - r.x;
  const dy = ty - r.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return 0;
  const dirX = dx / len, dirY = dy / len;
  // Soft-push escape: once wedged past the threshold (or still inside a burst from
  // a previous shove), corners may pass through soft trees this step.
  if ((r._softPushBurst || 0) > 0) r._softPushBurst -= dt;
  const allowSoft = (r._softStuckT || 0) > SOFT_UNSTICK_AFTER || (r._softPushBurst || 0) > 0;
  // A height difference between here and the next tile over is a slope —
  // climbing or descending it costs effort, same as it costs the player
  // stamina, so movement slows crossing it either way. T1's own collision
  // rule already refuses to climb at all, so this only ever bites T1 going
  // downhill; every other type can cross a one-level step in either
  // direction and slows for it.
  if (map.heightAt) {
    const h0 = map.heightAt(Math.floor(r.x), Math.floor(r.y));
    const h1 = map.heightAt(Math.floor(r.x + dirX), Math.floor(r.y + dirY));
    if (h1 !== h0) speed *= SLOPE_SPEED_MULT;
  }
  const step = Math.min(speed * dt, len);
  const ox = r.x, oy = r.y;
  // Committed detour: while rounding an obstacle, keep sliding the chosen way
  // and DON'T also pull toward the blocked line — that pull/slide tug-of-war
  // is what made a blocked machine jitter in place (worst pinned behind a
  // single marble column). The commitment ends the moment the line opens.
  if ((r._detourT || 0) > 0) {
    r._detourT -= dt;
    const clearAhead = !map.isSolid(Math.floor(r.x + dirX * 1.2), Math.floor(r.y + dirY * 1.2));
    if (clearAhead) {
      r._detourT = 0; // path open again: fall through to the direct move below
    } else {
      const sSign = r._slide || 1;
      moveAxis(r, -dirY * sSign * step, 0, map, allowSoft);
      moveAxis(r, 0, dirX * sSign * step, map, allowSoft);
      const movedD = Math.hypot(r.x - ox, r.y - oy);
      if (movedD < step * 0.35) { r._slide = -sSign; r._detourT = 0.45; } // this side jammed too: flip ONCE and recommit
      trackSoftStuck(r, movedD, step, len, dt, allowSoft);
      if (movedD > 1e-6) {
        r.facing = { x: (r.x - ox) / movedD, y: (r.y - oy) / movedD };
        r.walkPhase += dt * 10;
      }
      return movedD;
    }
  }
  moveAxis(r, (dx / len) * step, 0, map, allowSoft);
  moveAxis(r, 0, (dy / len) * step, map, allowSoft);
  let moved = Math.hypot(r.x - ox, r.y - oy);
  // Wall-follow: if the direct path is blocked (a big obstacle like the 8x8
  // factory), slide along it perpendicular to the target instead of grinding
  // to a halt. A per-robot preferred side keeps the detour consistent so it
  // rounds a corner rather than jittering, flipping only if that side is stuck
  // too — this is what un-jams bots pinned against the factory hull.
  //
  // But NOT when the target tile itself is solid — a player swimming out to sea
  // stands on a water tile no land machine can reach, so there is no corner to
  // round: sliding along the shore just makes the bot skitter left and right
  // forever. Skip the slide there and let it settle at the waterline instead.
  const targetReachable = !map.isSolid(Math.floor(tx), Math.floor(ty));
  if (moved < step * 0.35 && targetReachable) {
    const px = -dirY, py = dirX; // unit perpendicular to the target direction
    if (r._slide === undefined) r._slide = 1;
    for (const s of [r._slide, -r._slide]) {
      const bx = r.x, by = r.y;
      moveAxis(r, px * s * step, 0, map, allowSoft);
      moveAxis(r, 0, py * s * step, map, allowSoft);
      const m2 = Math.hypot(r.x - bx, r.y - by);
      if (m2 > 1e-6) { r._slide = s; r._detourT = 0.45; moved += m2; break; } // commit: no direct pull until the line opens
    }
  }
  trackSoftStuck(r, moved, step, len, dt, allowSoft);
  if (moved > 1e-6) {
    r.facing = { x: (r.x - ox) / moved, y: (r.y - oy) / moved };
    r.walkPhase += dt * 10; // T2 legs scissor only while actually moving
  }
  return moved;
}

// The map's bridge tiles, found once and cached: the only dry crossings of the
// river, so a land machine the river cuts off from the player heads for the
// nearest one instead of grinding against the bank.
function bridgeTiles(map) {
  if (!map._bridgeTiles) {
    const b = [];
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      if (map.floorAt(x, y) === 'bridge') b.push({ x: x + 0.5, y: y + 0.5 });
    }
    map._bridgeTiles = b;
  }
  return map._bridgeTiles;
}

// True if the straight line between two points crosses river or sea water — a
// land machine can't just walk it, it has to find a bridge.
function waterBetween(ax, ay, bx, by, map) {
  const steps = Math.ceil(Math.hypot(bx - ax, by - ay));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const f = map.floorAt(Math.floor(ax + (bx - ax) * t), Math.floor(ay + (by - ay) * t));
    if (f === 'water' || f === 'sea') return true;
  }
  return false;
}

// Where a chasing machine should actually head: straight at the target unless
// water is in the way, in which case make for the nearest bridge — and once
// it's on the bridge, a point just across it — so the machine rounds onto the
// crossing and over rather than getting pinned on the near bank.
function chaseTarget(r, px, py, map) {
  if (!waterBetween(r.x, r.y, px, py, map)) return { x: px, y: py, crossing: false };
  const bridges = bridgeTiles(map);
  if (!bridges.length) return { x: px, y: py, crossing: false };
  let br = null, bd = Infinity;
  for (const t of bridges) { const d = Math.hypot(t.x - r.x, t.y - r.y); if (d < bd) { bd = d; br = t; } }
  if (bd < 2.5) return { x: br.x + (px >= br.x ? 3 : -3), y: br.y, crossing: true }; // on the bridge: aim just across
  return { x: br.x, y: br.y, crossing: true };
}

// Idle patrol: amble to points near home with pauses in between. The T1
// obeys its no-climb rule here too, so a trapped one just circles its pit.
function patrol(r, speed, range, dt, map) {
  r.wanderTimer -= dt;
  if (r.wanderTimer <= 0) {
    if (r.rng() < 0.35) {
      r.wanderTarget = null; // hold position a moment
      r.wanderTimer = 1.5 + r.rng() * 2.5;
    } else {
      const ang = r.rng() * Math.PI * 2;
      const d = 0.5 + r.rng() * (range - 0.5);
      r.wanderTarget = { x: r.home.x + Math.cos(ang) * d, y: r.home.y + Math.sin(ang) * d };
      r.wanderTimer = 2 + r.rng() * 2;
    }
  }
  if (r.wanderTarget) {
    moveToward(r, r.wanderTarget.x, r.wanderTarget.y, speed, dt, map);
    if (Math.hypot(r.wanderTarget.x - r.x, r.wanderTarget.y - r.y) < 0.1) {
      r.wanderTarget = null;
    }
  }
}

// #179 — inside this, a machine is not fooled by anything. Grass hides you from
// something across the field, not from something standing over you, and a
// hunter that has already closed must still be able to land its blow.
const STEALTH_CONTACT = 1.6;

function distTo(r, player) {
  // A held, charged Wi-Fi block jams hostile sensors: the player reads as
  // out of range everywhere, so hunters never acquire (and instantly lose)
  // the trail. Friendly robots don't use this path, so they still follow.
  if (player.invisibleToRobots) return Infinity;
  const d = Math.hypot(player.x - r.x, player.y - r.y);
  if (d < STEALTH_CONTACT) return d;
  // #179 — STEALTH, ALL OF IT, IN ONE LINE. This is the only place a hostile
  // asks how far away the player is, so scaling here reaches every acquisition
  // range, every give-up distance and every reacquire in the file at once. The
  // Wi-Fi block above is the same idea taken to its limit (Infinity); this is
  // the version you get for free, by moving carefully.
  const k = player.stealthFactor ? player.stealthFactor() : 1;
  return d * (k || 1);
}

// Scrap variation without Math.random: a cheap integer hash of the wreck's
// position, so the same robot dying in the same place always drops the same.
function scrapQty(x, y) {
  let h = (Math.floor(x * 64) * 0x9e3779b1) ^ (Math.floor(y * 64) * 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return SCRAP_MIN + ((h >>> 16) & 1);
}

// ---- Battery --------------------------------------------------------------

// Burn charge; at zero the machine goes flat where it stands. Flat is
// permanent until external code re-batteries it (battery = 100, drained =
// false); a friendly stays friendly while flat.
// THE RESERVE. Every one of these carries a second small cell that does nothing
// but walk the machine home when the main one is flat — a recovery feature, so
// that a unit that ran itself down in a field is a unit somebody can get back
// rather than a unit somebody has to carry. It is slow, it is one charge, and it
// does not come back.
const LIMP_SPEED = 0.55;        // tiles/sec: a crawl, well under RECHARGE_TRAVEL_SPEED
const LIMP_ARRIVE = 1.4;        // tiles: close enough to the charger to be on it

// Walk a flat machine home on its reserve. It cannot see, cannot fight and does
// not aggro; it goes to its tower and nothing else. Arriving puts it on the
// charger, which is the ordinary recharge path from there.
function updateLimpHome(r, dt, map) {
  const dHome = Math.hypot(r.home.x - r.x, r.home.y - r.y);
  if (dHome <= LIMP_ARRIVE) {
    r.limping = false;
    r.drained = false;
    r.recharging = true;    // the charger takes it from here, battery and hull
    r.battery = 1;          // just off the floor: the tower does the rest
    return;
  }
  moveToward(r, r.home.x, r.home.y, LIMP_SPEED, dt, map);
}

function drainBattery(r, rate, dt) {
  if (r.mains) return; // fortress guards run off the fortress: no drain, never flat
  r.battery = Math.max(0, r.battery - rate * dt);
  if (r.battery <= 0) {
    r.battery = 0;
    r.drained = true;
    r.aggro = false;
    r.stuck = false;
    r.recharging = false;
    r.returning = false;
  }
}

// Recharge state: trudge home, ignoring the player entirely, and drink from
// the obelisk once in range. The T1 keeps its never-uphill rule on the way,
// so one trapped below its charger drains flat instead. The charger mends
// the chassis too, at a much slower rate than it fills the battery — a
// machine that fled the fight badly damaged (see the low-HP break-off in
// updateRobots) is out of the picture for a genuinely long beat, not just
// the few seconds a battery top-up takes. It only returns to its rounds
// once BOTH are fully restored.
function updateRecharge(r, dt, map) {
  const dHome = Math.hypot(r.home.x - r.x, r.home.y - r.y);
  if (dHome <= RECHARGE_RANGE) {
    // #133 — A TOWER THAT WILL NOT FEED. `never feed` in an obelisk's posted
    // constitution cuts its garrison off from power, which is the strongest
    // single hack in the game: an island whose towers will not feed runs itself
    // down. main.js stamps the flag on the tower object each tower tick, so this
    // stays a boolean read and robots.js never learns what a constitution is.
    const post = map.objectAt ? map.objectAt(Math.floor(r.home.x), Math.floor(r.home.y)) : null;
    if (post && post.feedOff) {
      // It still limps home and still waits there. The tower simply has nothing
      // for it, which is a machine sitting at a dead socket rather than an error.
      r.battery = Math.max(0, r.battery);
      return;
    }
    r.battery = Math.min(BATTERY_MAX, r.battery + RECHARGE_RATE * dt);
    r.hp = Math.min(r.maxHp, r.hp + REPAIR_RATE * dt);
    if (r.battery >= BATTERY_MAX && r.hp >= r.maxHp) {
      r.recharging = false; // topped up and mended: back to the rounds
    }
    return;
  }
  drainBattery(r, DRAIN_PATROL, dt);
  if (r.drained) return;
  moveToward(r, r.home.x, r.home.y, RECHARGE_TRAVEL_SPEED, dt, map);
}

// ---- Update ---------------------------------------------------------------

export function updateRobots(dt, robots, player, map, dayNight) {
  // Stamp the daylight state where a gardener's sense can read it. dayNight
  // lives in main.js and the sense functions are pure of it; one boolean on the
  // map bridges the two without a wider dependency. Defaults to day if unknown.
  map._isDay = dayNight ? !dayNight.isNight() : true;
  _liveRobots = robots;     // this tick's roster, for an escort's `defend` to scan (see updateEscort)
  formM4Squads(robots, dt); // scouts that have lost you form up into search teams
  // The W-factory's location, for repelled W-units to retreat home to (below).
  let facX = null, facY = null;
  const _fac = map.objects && map.objects.find((o) => o.type === 'wfactory' && !o.destroyed);
  if (_fac) { facX = _fac.x + (_fac.fw || 1) / 2; facY = _fac.y + (_fac.fh || 1) / 2; }
  for (const r of robots) {
    if (r.dead) continue; // external code may set dead directly; nothing runs after
    if (r.driven) continue; // a HERMES relay is steering this one; its AI is suspended

    // Materialising out of the factory: tick down the flicker timer. The bot
    // still moves and fights normally while it fades in.
    if (r.spawnT > 0) r.spawnT = Math.max(0, r.spawnT - dt);

    // Fused wrecks: permanently dead-in-place scenery. No AI, no recharge,
    // no scrap of their own; external mining code decrements mineCharges and
    // eventually sets dead. Only the smoke animation phase keeps ticking.
    if (r.fused) {
      r.animT += dt;
      continue;
    }

    // Printed by a king that has just fallen: it stands, for a moment, with
    // nothing telling it what to do.
    if (r.leaderless > 0) {
      r.leaderless -= dt;
      r.animT += dt;
      r.aggro = false;
      continue;
    }

    // The check-in. Before anything else this machine does, because whether it
    // is on the books is a fact about the last tick, not this one.
    if (r.home) reportIn(r, dt, map);

    // #159 — THE CARRIER'S SHIELD, resolved HERE and not in updateCarrier,
    // because the death check below runs before any per-type update: the shield
    // was booking the damage a tick too late and the machine was already dead
    // when it got there. One electro-gun bolt (which writes hp = 0 outright)
    // killed the boss through a whole shield (David, 2026-08-14).
    //
    // Every damage site writes straight to `hp`, so the shield works by undoing
    // that write and charging the rim instead. Nothing that deals damage has to
    // know it exists.
    if (r.carrier) {
      if (r._lastHp == null) r._lastHp = r.hp;
      const took = r._lastHp - r.hp;
      r._struck = took > 0;
      if (took > 0 && (r.shieldHp ?? 0) > 0) {
        r.shieldHp -= took;
        r.hp = Math.min(r.maxHp, r.hp + took);
        r.shieldFlash = 0.25;
        if (r.shieldHp <= 0) {
          r.shieldHp = 0;
          r.shieldBroke = 0.9;
          (map.groundItems ??= []).push({ item: 'aspis', qty: 1, x: r.x - 0.4, y: r.y + 0.3, keep: true });
        }
      } else if (took > 0) {
        // WHILE IT IS PRINTING IT IS OPEN. The two seconds before a wave comes
        // out are the window the whole fight is built around: the ports crack,
        // the bands come up, and anything landed then counts double. It is a
        // telegraph, not a reaction test — you can see it winding up.
        const spooling = (r.spoolT ?? 0) > 0;
        if (spooling) r.hp -= took * (CARRIER_SPOOL_MULT - 1);

        // THE GATE HOLDS, BUT THE BLOW IS NOT WASTED. Past the floor it bites a
        // quarter and BANKS the rest, which is spent the moment the next wave
        // opens the gate. So working on a sealed hull is real work, visibly
        // kept and visibly paid; what it cannot do is skip a phase.
        // THE GATE HOLDS FROM THE FIRST BLOW, NOT THE SECOND PHASE.
        // This used to read `r.waves > 0`, which left the whole of phase one
        // with NO FLOOR AT ALL: carrierFloor(maxHp, 0) is maxHp, so the guard
        // that was meant to stop the hull sealing at full health instead
        // removed the hull's protection entirely until the first wave was out.
        // Anything with a fast enough rate of fire — an escort W-4 you posted
        // `follow` to, at 18 a bolt against a 60-point hull — took the boss
        // from full to dead through five unopened gates in about four seconds
        // (David, 2026-08-15: "B1 died instantly again when my follower a W4
        // shot it"). Nothing is wasted by the gate holding: the blow is banked
        // and paid the moment the next wave opens the gate.
        const floor = carrierFloor(r.maxHp, r.waves);
        if (r.waves < CARRIER_GATES && r.hp < floor) {
          const blocked = floor - r.hp;              // what the gate refused
          r.hp = floor;
          // THE BANK IS CAPPED AT ONE GATE. Uncapped it is a way to buy the
          // whole fight in advance: a machine firing steadily into a sealed
          // hull banked 150 against a 60-point hull inside four seconds, and
          // every gate from then on would have fallen the instant it opened.
          // A gate's worth is the most that can usefully be paid at one
          // opening anyway — past that the surplus was only ever going to be
          // re-banked by the next clamp.
          r.banked = Math.min((r.banked || 0) + blocked * (1 - CARRIER_SEALED_BITE),
                              r.maxHp / CARRIER_GATES);
          r.sealFlash = CARRIER_SEAL_FLASH;          // the blow rings off it
        }
      }
      r._lastHp = r.hp;
    }

    // Destruction via damage: mark dead and drop scrap exactly once. A
    // penalised kill (external gun code) yields a single scrap.
    // THE KING'S LAST BLOW STARTS ITS DEATH; it does not finish it. Everything
    // below (the scrap, the card, the achievement) waits for the fall.
    if (r.hp <= 0 && r.carrier && r.dying === undefined) {
      r.dying = CARRIER_DEATH;
      r.hp = 0;
      r.aggro = false;
      r.waveT = 999;            // it prints nothing more
      r.spoolT = 0;
      r._spooled = false;
      sfx.play('charge');
      if (player.say) player.say(`${r.unitName || 'The carrier'} stops. Something inside it lets go, and it begins to come apart.`);
      // ITS SWARM LOSES ITS CALLER. The machines it printed were an extension
      // of it; with the thing that was calling them gone they have no tactic
      // and nowhere to be, and they stand there. It is the clearest way the
      // fight can say it is over.
      for (const o of robots) {
        if (o.calledBy === r && !o.dead) { o.calledBy = null; o.leaderless = 1.8; o.tactic = null; o.aggro = false; }
      }
      continue;
    }
    if (r.dying !== undefined) {
      r.dying -= dt;
      r.animT += dt;
      if (r.dying > 0) continue;   // still coming apart
      r.hp = 0;                    // the fall
    }
    if (r.hp <= 0) {
      r.dead = true;
      r.stuck = false;
      // Every machine in the game dies here, so this is the one place the song
      // needs to hear about it. WHO killed it decides which track it feeds:
      // the stamps are set at each damage site (see _lastHitBy).
      achieveEvent('unitDestroyed', { type: r.type, cause: r._lastHitBy || 'unknown' });
      const qty = r.scrapPenalty ? 1 : scrapQty(r.x, r.y);
      (map.groundItems ??= []).push({ item: 'scrap', qty, x: r.x, y: r.y });
      // Every destroyed machine sheds a chip fragment — collect eight and you
      // can craft a whole access chip. Offset a touch so it doesn't stack
      // exactly on the scrap heap.
      map.groundItems.push({ item: 'chip_fragment', qty: 1, x: r.x + 0.25, y: r.y - 0.2 });
      // PLATE, cut from what it was wearing. Roughly one machine in seven sheds
      // a piece, and which piece is decided by the wreck's position rather than
      // by a roll — same rule as the OB_gun below, so a player cannot reload
      // until a cuirass falls out. The heavier classes carry the heavier plate,
      // which is the only place the type matters.
      // The tier is the class that was wearing it: a T sheds T-plate, an M sheds
      // fortress plate, and the piece is coloured like the machine it came off
      // so it reads on the ground before you are close enough for the name.
      // Which piece is decided by the wreck's position rather than by a roll,
      // the same rule as the OB_gun below, so a player cannot reload until a
      // cuirass falls out.
      {
        const tier = ARMOUR_TIER_OF[r.type] || 't';
        // About one machine in three. It was one in seven, which is right for a
        // prize and wrong for a consumable: plate wears out under fire, so the
        // rate has to keep a player in it rather than reward a long hunt.
        if ((Math.floor(r.x * 13 + r.y * 29) % 3) === 0) {
          const slot = ARMOUR_DROP_SLOTS[scrapQty(r.x * 5.1 + 11, r.y * 3.7 + 7) & 3];
          map.groundItems.push({ item: armourKey(tier, slot), qty: 1, x: r.x - 0.3, y: r.y + 0.2 });
        }
      }
      // A T1 very rarely carries an OB_gun — a prize find (deterministic from
      // its wreck position so it isn't reload-farmable).
      if (r.type === 't1' && (scrapQty(r.x * 1.7 + 3, r.y * 2.3 + 1) & 7) === 0
        && ((Math.floor(r.x * 31 + r.y * 17)) % 20 === 0)) {
        map.groundItems.push({ item: 'obgun', qty: 1, x: r.x, y: r.y });
        map.groundItems.push({ item: 'battery', qty: 4, x: r.x + 0.3, y: r.y });
      }
      // A W4 is the toughest thing the factory builds — bringing one down is
      // a proper win, so it drops a generous spoil of war on top of the
      // usual scrap: a stack of batteries and bonus scrap. A wreck only ever
      // sheds what the machine actually carried — a laser platform holds
      // cells and boards, not ordnance (it never threw a bomb in its life,
      // so it doesn't drop one in death); rarely its targeting boards
      // survive as extra chip fragments, deterministic from the wreck spot.
      if (r.type === 'w4') {
        map.groundItems.push({ item: 'battery', qty: 6, x: r.x + 0.3, y: r.y });
        map.groundItems.push({ item: 'scrap', qty: 4, x: r.x - 0.3, y: r.y - 0.2 });
        if (Math.floor(r.x * 53 + r.y * 29) % 5 === 0) {
          map.groundItems.push({ item: 'chip_fragment', qty: 2, x: r.x, y: r.y + 0.3 });
        }
      }
      // OPTICS, CUT OUT OF THE MACHINES THAT HAVE THEM. Goggles were craft-only
      // — five torch-heads and a circuit board — which is a fine recipe and a
      // bad supply, because the one time you need them is POSEIDON's fog, and
      // that is exactly when you are not standing at a bench stripping torches
      // (David, 2026-08-15: "would be useful in the fog").
      //
      // ONLY THE W-4 AND THE MILITARY CLASS. His call, and it is the right
      // fiction: these are the machines that hunt by looking. A T-1 has a lamp,
      // a W-3 has a soil probe; the hunter-killer and the guard carry the real
      // optics, and what you take off them is what they were using to find you.
      //
      // Deterministic from the wreck's position, like the plate and the OB_gun
      // above, so a player cannot reload until a pair falls out. About one in
      // four: often enough to be an answer to the fog, rare enough that the
      // recipe is still worth knowing when the ground is quiet.
      if ((r.type === 'w4' || GOGGLE_CLASSES.has(r.type))
        && Math.floor(r.x * 37 + r.y * 61) % 4 === 0) {
        map.groundItems.push({ item: 'goggles', qty: 1, x: r.x + 0.15, y: r.y + 0.4 });
      }
      // A WRECK SHEDS WHAT THE MACHINE ACTUALLY CARRIED. The M-6 throws
      // grenades, so its wreck has the rest of them on it — the same rule the
      // W-4's spoil is written against, applied to the class that earns it.
      // WHAT IT DID NOT THROW. A guard you rushed still has its three; one that
      // has been lobbing at you for a minute has nothing left to give, which is
      // the honest reward for having made it spend them.
      const left = r.type === 'm6' ? (r.bombs === undefined ? M6_BOMBS : r.bombs) : 0;
      if (left > 0) {
        map.groundItems.push({ item: 'bomb_small', qty: left, x: r.x - 0.2, y: r.y + 0.35 });
      }
      // #159 — the carrier sheds what it was carrying. `keep` because this is
      // the warrior's whole route off the island and it must not rot on the
      // ground while he is fighting the escort; `traced` because a credential
      // stops answering the moment its carrier does, and POSEIDON's net reads
      // the gap. The card works. It is also marked, for good.
      if (r.carrier) {
        map.groundItems.push({
          item: 'hermes_card', qty: 1, x: r.x, y: r.y + 0.35, keep: true, traced: true,
        });
      }
      continue;
    }

    // AI-ML `loop`: an infinite loop pinned into its home obelisk holds the
    // whole garrison dead still — no movement, no attack, no thinking — even
    // its idle animation stops, until a repair drone resets the node
    // (updateW3 below clears both this and frozenByOb).
    if (r.frozen) continue;

    // Ubik: standing in a brightened patch scrambles a hunter's mind —
    // refreshed continuously while inside so lingering keeps it confused,
    // decaying for a while after it wanders (or staggers) back out. Unarmed
    // W3/W5 drones and reprogrammed friendlies are unaffected.
    if (!r.friendly && r.type !== 'w3' && r.type !== 'w5' && map.ubikPatches && map.ubikPatches.length
      && map.ubikPatches.some((p) => Math.hypot(p.x - r.x, p.y - r.y) < (p.r || 3))) {
      r.ubikConfusedT = UBIK_CONFUSE_HOLD;
    } else if (r.ubikConfusedT > 0) {
      r.ubikConfusedT = Math.max(0, r.ubikConfusedT - dt);
    }
    if (r.ubikConfusedT > 0) {
      updateUbikConfused(r, dt, robots, map);
      r.animT += dt;
      continue;
    }

    // Off-screen and far from the player: skip all thinking until they come
    // back near. Friendlies follow the player so are never far; they're left
    // to update normally. (Placed after the death check above so a machine
    // killed at range still drops its scrap.) W3 repair drones are exempt:
    // they spawn at the remote factory and must travel across the map to mend
    // a damaged tower, which almost always happens off-screen — gating them on
    // player proximity meant they never actually came out and repaired.
    // An aggro'd fortress guard (M5/M6) keeps thinking however far off it is, so
    // a violation response relentlessly threads the whole maze to reach you
    // rather than freezing beyond the CPU cull range like ordinary machines.
    const relentless = (r.type === 'm5' || r.type === 'm6' || r.type === 'b1' || r.type === 'm4') && r.aggro;

    // A STATUS REPORT requested over the network. The unit stops where it is,
    // puts its lamp on a slow blue blink, takes its own readings and files them
    // to its tower. It runs above the distance cull because a report requested
    // from the far side of the island has to complete whether or not you get
    // there to watch — the point of the blink is that you CAN get there.
    if (r.reportCool > 0) r.reportCool = Math.max(0, r.reportCool - dt);
    if (r.reportT > 0) {
      r.reportT = Math.max(0, r.reportT - dt);
      r.animT += dt;
      if (r.reportT === 0) {
        r.reportDone = true;
        if (!r.lampFault) { r.lamp = null; r.lampFlash = 0; }
      }
      continue;
    }

    // ON THE RESERVE. Above the cull for the same reason the report is: you send
    // a flat machine home and then walk away, and it has to actually get there.
    // Culling it would strand it out of sight and leave its page claiming it was
    // on its way.
    if (r.drained && r.limping) { updateLimpHome(r, dt, map); r.animT += dt; continue; }

    if (!r.friendly && r.type !== 'w3' && !relentless && !nearPlayer(r, player)) continue;

    // Stunned: frozen in place, battery preserved. Only the timer and the
    // amber flicker phase advance; on expiry normal AI resumes next frame
    // (and aggros at once if the player is still in range).
    if (r.disabledT > 0) {
      r.disabledT = Math.max(0, r.disabledT - dt);
      if (r.disabledT === 0) r.stunColor = null; // drop CALYPSO's indigo tint on expiry
      r.animT += dt;
      continue;
    }

    // Knocked back by a solid hit: frozen (no movement, no attack) for a
    // beat, same as the shove the player's strike just gave it — stops it
    // trading blows nose-to-nose the instant it's been hit.
    if (r.knockT > 0) {
      r.knockT = Math.max(0, r.knockT - dt);
      r.animT += dt;
      continue;
    }

    // AI-ML `repel`: targeting inverted for a spell — it breaks off the hunt
    // until the effect wears off. Factory units (W-class) are recalled and stream
    // back to the W-factory rather than just backing away from you — a W4 driven
    // off retreats HOME. (Backing radially away, boxed against a wall, read as the
    // machine freezing; heading for the factory reads as an actual recall.)
    // Everything anchored elsewhere (obelisk T-units, roaming M-units) still just
    // flees the player.
    if (r.repelledT > 0) {
      r.repelledT = Math.max(0, r.repelledT - dt);
      const isWUnit = r.type === 'w1' || r.type === 'w3' || r.type === 'w4' || r.type === 'w5';
      if (isWUnit && facX != null) {
        moveToward(r, facX, facY, REPEL_FLEE_SPEED, dt, map);   // recalled to the foundry
      } else {
        const d = distTo(r, player);
        const ax = d > 1e-6 ? (r.x - player.x) / d : 1;
        const ay = d > 1e-6 ? (r.y - player.y) / d : 0;
        moveToward(r, r.x + ax * 3, r.y + ay * 3, REPEL_FLEE_SPEED, dt, map);
      }
      r.animT += dt;
      continue;
    }

    // AI-ML `sing`: the Portal easter egg — lines up facing the player and
    // performs its bit, then simply goes back to work (no longer powers down
    // for good; it drops aggro and resumes its normal patrol/hunt).
    if (r.singing) {
      r.choirT -= dt;
      moveToward(r, r.choirX, r.choirY, REPEL_FLEE_SPEED, dt, map);
      const dx = player.x - r.x, dy = player.y - r.y, dd = Math.hypot(dx, dy) || 1;
      r.facing = { x: dx / dd, y: dy / dd };
      r.animT += dt;
      if (r.choirT <= 0) {
        r.singing = false;
        r.aggro = false;
        r.loseInterestT = LOSE_INTEREST_COOLDOWN; // a beat before it re-acquires
      }
      continue;
    }

    // Blueboxed to a gardener: it tends the blight instead of hunting. It runs the
    // W5 wander-and-reseed AI whatever its original class was, and reads as friendly
    // (green eyes) so nothing targets it and it never targets you. Intercept here,
    // before the flat-battery/friendly-follower paths.
    if (r.gardener) { updateW5(r, dt, map, player); r.animT += dt; continue; }

    // Flat battery: fully inert until the player re-batteries it. (The reserve
    // walk is handled above the distance cull — a machine sent home keeps going
    // whether or not you stay to watch it.)
    if (r.drained) continue;

    r.animT += dt;

    // Taking a hit wakes the machine up regardless of range — unless it is
    // serving the player or has already broken off to recharge.
    if (r.hurt) {
      r.hurt = false;
      if (!r.friendly && !r.recharging && constitutionAllows(r, 'hunt')) r.aggro = true;
    }

    if (r.friendly) {
      updateFriendly(r, dt, player, map);
      continue;
    }

    if (r.recharging) {
      updateRecharge(r, dt, map);
      continue;
    }

    // Low battery: break off the hunt and head for the home obelisk.
    // Critically damaged (below HP_FLEE_FRAC of maxHp): same retreat — the
    // machine values its own chassis and limps home to mend at the charger,
    // slowly (see updateRecharge/REPAIR_RATE), before rejoining the fight.
    // Zombies are excluded: an OB_corrupted machine has no self-preservation
    // left in it.
    // Mains-powered fortress guards never break off: no battery to run down, and
    // no limping home to mend. A guard holds its post until it is destroyed —
    // wounding one buys you nothing but a wounded guard still coming.
    if (!r.mains && (r.battery < BATTERY_LOW || (!r.zombie && r.hp < r.maxHp * HP_FLEE_FRAC))) {
      r.recharging = true;
      r.aggro = false;
      r.stuck = false;
      r.noProgressT = 0;
      r.returning = false;
      updateRecharge(r, dt, map);
      continue;
    }

    // Losing line of sight for long enough breaks off the hunt regardless
    // of type or distance; see LOS_GIVEUP_AFTER above. Fortress M4/M5/M6 are
    // exempt — they never break off at all (updateGuard): they sweep your
    // last-seen tile and keep hunting until destroyed or taken off you.
    if (r.aggro && r.type !== 'w3' && r.type !== 'm5' && r.type !== 'm6' && r.type !== 'b1' && r.type !== 'm4') {
      const canSee = map.hasLineOfSight(r.x, r.y, player.x, player.y);
      r.losLostT = canSee ? 0 : (r.losLostT || 0) + dt;
      if (r.losLostT > LOS_GIVEUP_AFTER) {
        r.aggro = false;
        r.losLostT = 0;
        r.loseInterestT = LOSE_INTEREST_COOLDOWN;
        if (r.type !== 't1') r.returning = true; // head back toward home/tower/factory
      }
    } else if (r.loseInterestT > 0) {
      r.loseInterestT = Math.max(0, r.loseInterestT - dt);
    }

    if (isWheeled(r)) updateT1(r, dt, player, map);
    else if (r.type === 't3') updateT3(r, dt, player, map);
    else if (r.type === 'w1') updateW1(r, dt, player, map);
    else if (r.type === 'w3') updateW3(r, dt, map, robots, player);
    else if (r.type === 'w4') updateW4(r, dt, player, map);
    else if (r.type === 'w5') updateW5(r, dt, map, player);
    else if (r.type === 'v1') updateV1(r, dt, map, player);
    else if (r.type === 't8') updateT8(r, dt, map, player);
    else if (r.type === 'm6' || r.type === 'b1' || r.type === 'm5' || r.type === 'm4') updateGuard(r, dt, player, map, robots, facX, facY);
    else updateT2(r, dt, player, map);
  }
  separateRobots(robots, map, dt, player);
}

// Robots update as a registered system (docs/PLAN.md): the hub no
// longer calls updateRobots() directly, it ticks via systems.runUpdate(). order
// 30 puts robots just before fortress (35), NOT in the nominal actors band
// (40-59), because fortress reads this-frame robot `aggro` to drive its breach-
// report timer — Stage 1 protected that "fortress sees this-frame robots"
// ordering, so robots must tick first. The draw stays in the renderer's
// depth-sort (drawRobot), outside the registry, per the boundary in the doc.
// Called once from main.js setup (robots.js has no owning object to self-
// register in, the way daynight/fortress do from their constructor/factory).
export function registerRobotsSystem() {
  register({
    name: 'robots',
    order: 30,
    update: (w) => updateRobots(w.dt, w.robots, w.player, w.map, w.dayNight),
  });
}

// No two live machines may occupy (near enough) the same tile: after every
// robot's own AI has moved it this tick, push apart any pair that ended up
// too close. Fused wrecks are static scenery and are left alone; O(n^2) is
// fine at the handful of robots this game ever has active at once.
// Several relaxation passes, not one: with three or more machines crowded
// onto nearly the same point (e.g. a squad triangulated straight onto the
// player), a single pairwise pass can't fully resolve every overlap at once
// and the AI's own pull each frame would otherwise out-muscle it. A handful
// of cheap iterations converges to a clean spread instead.
const SEPARATION_PASSES = 4;
function separateRobots(robots, map, dt, player) {
  for (const r of robots) {
    if (r.bumpCooldown > 0) r.bumpCooldown = Math.max(0, r.bumpCooldown - dt);
  }
  // Only robots near the player can overlap in a way that matters (and only
  // they moved this frame — the rest were culled). Resolving separation over
  // just this subset turns the O(n^2) pass from all-machines-on-the-map into
  // a handful, which is what the culling is for.
  const active = robots.filter((r) => !r.dead && !r.fused && (!player || nearPlayer(r, player)));
  for (let pass = 0; pass < SEPARATION_PASSES; pass++) {
    let moved = false;
    for (let i = 0; i < active.length; i++) {
      const a = active[i];
      if (a.dead || a.fused) continue;
      for (let j = i + 1; j < active.length; j++) {
        const b = active[j];
        if (b.dead || b.fused) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d >= ROBOT_MIN_SEP) continue;
        moved = true;
        // A collision hurts both machines, gated by their own cooldown so a
        // pair jammed together for several frames (or several relaxation
        // passes within the same frame) chips away rather than melting
        // instantly. Only checked on the first pass — later passes this same
        // frame are just finishing the push-apart, not a fresh collision.
        // YOUR OWN MACHINES DO NOT CHIP EACH OTHER. They still get pushed
        // apart — nothing overlaps — but two units both under your command
        // killing each other by walking is a squad destroying itself for
        // obeying you, which is not a difficulty anybody chose.
        // MACHINES ON THE SAME NETWORK DO NOT WRECK EACH OTHER (#189, David
        // 2026-08-17: "T1w should not crash into each other. They are aware of
        // each other and work together as a swarm.. if they bump they can pause
        // with no damage... otherwise they just destroy each other in
        // seconds"). A swarm is a dozen machines converging on one point by
        // design; at 1 HP a bump and 2.5 seconds between them, the pack ground
        // itself down on the walk in and the player never touched it.
        //
        // The old rule exempted only YOUR units from each other, which is the
        // same argument seen from the other side: two machines under one
        // command killing each other by walking is not a difficulty anybody
        // chose. It is not a difficulty POSEIDON chose either. So the test is
        // now whether they are on the same side at all — and a converted unit
        // shouldering an estate machine still costs both, because those two
        // genuinely are fighting.
        const sameSide = isEscorting(a) === isEscorting(b);
        if (sameSide) { a.yieldT = Math.max(a.yieldT || 0, BUMP_YIELD); b.yieldT = Math.max(b.yieldT || 0, BUMP_YIELD); }
        if (pass === 0 && !sameSide && a.bumpCooldown <= 0 && b.bumpCooldown <= 0) {
          a.hp -= BUMP_DAMAGE; a.hurt = true; a._lastHitBy = 'machine';
          b.hp -= BUMP_DAMAGE; b.hurt = true; b._lastHitBy = 'machine';
          a.bumpCooldown = BUMP_COOLDOWN;
          b.bumpCooldown = BUMP_COOLDOWN;
          (map.sparks ??= []).push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, ttl: 0.3, max: 0.3 });
        }
        // Nearly coincident: no meaningful direction to push along, so pick
        // one from their (deterministic) index difference rather than divide
        // by ~0.
        const nx = d > 1e-4 ? dx / d : ((i + j) % 2 === 0 ? 1 : -1);
        const ny = d > 1e-4 ? dy / d : ((i + j) % 2 === 0 ? 0 : 1);
        const push = (ROBOT_MIN_SEP - d) * 0.5 + 0.01;
        moveAxis(a, -nx * push, -ny * push, map);
        moveAxis(b, nx * push, ny * push, map);
      }
    }
    if (!moved) break;
  }
}

// Ubik confusion: no targeting, no patrol — just a drunk stagger toward a
// fresh small random point every beat, and taking a swing at whatever other
// machine strays close, friend or foe alike (there's no "foe" distinction
// left in its head at all). Battery still drains at the normal patrol rate
// (drainBattery is called by the caller's usual paths before this, or not
// at all here — a confused unit is still "on", just not doing its job, so
// it isn't worth draining faster or slower than idling normally would).
function updateUbikConfused(r, dt, robots, map) {
  r.aggro = false;
  // Rooted to the spot — it doesn't wander or spin, it stays put and jumps
  // up and down where it stands (the renderer reads _confuseHopT for the
  // bounce), reality-static dots spinning over its head. It'll still swing
  // blindly at any machine that happens to be right next to it.
  r._confuseHopT = (r._confuseHopT || 0) + dt;
  r._confuseAttackTimer = Math.max(0, (r._confuseAttackTimer || 0) - dt);
  if (r._confuseAttackTimer <= 0) {
    for (const other of robots) {
      if (other === r || other.dead || other.fused || other.friendly) continue;
      if (Math.hypot(other.x - r.x, other.y - r.y) > UBIK_CONFUSE_ATTACK_RANGE) continue;
      other.hp -= UBIK_CONFUSE_ATTACK_DAMAGE;
      other.hurt = true;
      other._lastHitBy = 'ubik';   // a confused machine, swinging at its own side
      other.knockT = Math.max(other.knockT || 0, 0.3);
      (map.sparks ??= []).push({ x: other.x, y: other.y, ttl: 0.35, max: 0.35 });
      r._confuseAttackTimer = UBIK_CONFUSE_ATTACK_COOLDOWN;
      break;
    }
  }
}

// The tower a unit is homed to, found once and cached. A jammed or felled
// home reads as `linked: false`, which is how a program tells its network is
// down without a sensor for it.
function homeObelisk(r, map) {
  if (r._homeOb === undefined) {
    let best = null, bd = Infinity;
    for (const o of (map.objects || [])) {
      if (o.type !== 'obelisk') continue;
      const dd = (o.x - r.home.x) ** 2 + (o.y - r.home.y) ** 2;
      if (dd < bd) { bd = dd; best = o; }
    }
    r._homeOb = best || null;
  }
  return r._homeOb;
}

// A snapshot of what a unit's sensors can tell its program. This is the COMMON
// pack — the instruments every chassis with a program carries. A chassis row's
// `sense` builds on it and adds the readings peculiar to that machine (a
// shooter's fire control, a fitter's `work`), and supplies ONLY those: ask a
// T-1 for `daylight` or `blight` and the language default answers (false/0),
// because a T-1 has no light meter and no soil probe. A program written
// against a sensor the chassis lacks is not an error — it is a branch that
// never fires, which is the honesty the design turns on.
//
// `caps.detect` is the range at which `threat` holds; `caps.hurtAt` the hull
// fraction at which `hurt` does. Those two numbers are the whole difference
// between a T-1's senses and a T-2's, which is why one function serves both.
function baseSense(r, d, map, caps) {
  const ob = homeObelisk(r, map);
  return {
    charge: r.battery,
    integrity: r.maxHp ? (r.hp / r.maxHp) * 100 : 0,
    // A jammed Wi-Fi block reads as out of range everywhere (distTo returns
    // Infinity), so a program sees a very distant player rather than a broken
    // sensor, and its own `threat` branch quietly stops holding.
    range: Number.isFinite(d) ? d : T1_BLIND_RANGE,
    home_range: Math.hypot(r.home.x - r.x, r.home.y - r.y),
    threat: Number.isFinite(d) && d < caps.detect,
    hurt: r.maxHp ? r.hp <= r.maxHp * caps.hurtAt : false,
    linked: ob ? !(ob.destroyed || ob.jammed || ob.needsRebuild) : false,
  };
}

// The T-1 and T-2 sense packs: the common pack, with each chassis's own
// detection range and hurt threshold. Nothing else differs, which is the
// point — a program reads the same on both, and behaves differently only
// because the machine notices you at a different distance.
const t1Sense = (r, d, map) => baseSense(r, d, map, { detect: T1_DETECT_RANGE, hurtAt: T1_HURT_AT });
const t2Sense = (r, d, map) => baseSense(r, d, map, { detect: T2_DETECT_RANGE, hurtAt: T2_HURT_AT });

// A W-4's senses: the common pack, plus the fire control a shooter needs to
// decide whether it can take the shot. These readings need the player (line of
// sight, shield state), so the sense function takes it — the melee chassis
// ignore the extra argument.
//   sight    the target is in line of sight AND inside firing range
//   armed    the weapon has cooled down and can fire this tick
//   shielded the target's shield or forcefield is up (plinking is wasted)
//   contact  the target is right on top of it
//   lost_for seconds it has held with no line of sight (the give-up clock)
// A T-3's senses: the common pack plus fire control at emplacement ranges —
// it sees and shoots to T3_AMBUSH_RANGE, and `contact` is the point-blank claw
// distance, not a W-4's standoff.
// A W-1's senses. Just the common pack, and not even all of it: a W-1 homes to
// the crater it was deployed from, not a tower, so it has no link sensor —
// `linked` is dropped, and a program that reads it gets the honest false.
// A W-3's senses: the common pack, plus `work` — true when a repairable tower
// is within scan. `range`/`hurt` come free from the pack; a fitter has no fire
// control and no `threat` branch it acts on, but the pack carries them and a
// program is free to ignore them.
// A W-5's senses. The common pack minus `linked` (a gardener homes to nowhere,
// re-anchoring as it drifts), plus the three a gardener actually uses: `blight`
// (dead ground within scan), `work` (blight OR open grass to plant on), and
// `daylight` (the map's day flag). `threat` holds close (d < 6) so a program
// can be told to keep away from you.
function w5Sense(r, d, map) {
  const b = baseSense(r, d, map, { detect: 6, hurtAt: 0.35 });
  delete b.linked;
  b.home_range = 0;   // its home is wherever it is
  let blight = false, plantable = false;
  const R = W5_SCAN_RANGE;
  for (let dy = -R; dy <= R && !(blight && plantable); dy++) {
    for (let dx = -R; dx <= R; dx++) {
      const tx = Math.floor(r.x) + dx, ty = Math.floor(r.y) + dy;
      const f = map.floorAt ? map.floorAt(tx, ty) : null;
      if (f === 'blight' || f === 'blight_sick') { blight = true; }
      else if (f === 'grass' && !(map.objectAt && map.objectAt(tx, ty)) && (!map.heightAt || map.heightAt(tx, ty) === 0)) { plantable = true; }
      if (blight && plantable) break;
    }
  }
  return { ...b, blight, work: blight || plantable, daylight: map._isDay !== false };
}

// #149. What a dancer can tell about the world: how bright the floor is under
// it, and whether there is a brighter tile within reach. That is the whole
// instrument. It has no threat sense — it is not equipped to have one, which
// is a fact about the chassis rather than a setting somebody can change.
//
// The floor's brightness is read off map.lumenField, which grove.js fills every
// frame. Off her island there is no field, so `lit` is false and every T-8
// stands still — which is what a dancer does when the music stops.
function t8Light(map, x, y) {
  const f = map && map.lumenField, o = map && map.lumenOrigin;
  if (!f || !o) return 0;
  return spiralFieldAt(f, x - o.x, y - o.y);
}

function t8Sense(r, d, map) {
  const b = baseSense(r, d, map, { detect: 4, hurtAt: 0.4 });
  delete b.linked;
  delete b.threat;                  // it has no threat sense; see above
  b.home_range = 0;
  const here = t8Light(map, r.x, r.y);
  let best = here, bx = 0, by = 0;
  for (let dy = -T8_LOOK; dy <= T8_LOOK; dy++) {
    for (let dx = -T8_LOOK; dx <= T8_LOOK; dx++) {
      if (!dx && !dy) continue;
      const l = t8Light(map, r.x + dx, r.y + dy);
      if (l > best) { best = l; bx = dx; by = dy; }
    }
  }
  r._t8Toward = best > here + 0.05 ? { dx: bx, dy: by } : null;
  // TRESPASS: a person standing on the lit floor this unit keeps. `d` is the
  // range to the player, and `lit` under the PLAYER rather than under the unit
  // is what makes it a question about the floor and not about proximity — stand
  // off the lumen and the ushers have no business with you.
  const onFloor = map._t8PlayerLit === true;
  return {
    ...b,
    floorlight: Math.round(here * 100),
    lit: here > 0.12,
    brighter: !!r._t8Toward,
    trespass: onFloor && d < T8_USHER_RANGE,
  };
}

// A V-1's senses: the common pack plus the two a courier needs. The order of
// the pack IS the documented input vector of the model (v-model.js V_INPUTS),
// so changing it here without changing the weights makes the unit read its own
// world through the wrong columns.
function v1Sense(r, d, map) {
  const b = baseSense(r, d, map, { detect: V1_DETECT_RANGE, hurtAt: V1_HURT_AT });
  const c = nearestCasualty(r);
  return {
    ...b,
    cargo: !!r.cargo,
    casualty_range: c ? Math.hypot(c.x - r.x, c.y - r.y) : V1_NO_CASUALTY,
  };
}

// The nearest machine lying flat, from this tick's roster. D2: it checks
// `drained`, not allegiance — a cell is a cell, which is what makes a stolen
// courier worth having.
function nearestCasualty(r) {
  if (!_liveRobots) return null;
  let best = null, bestD = V1_SCAN_RANGE;
  for (const o of _liveRobots) {
    if (o === r || !o.drained || o.dead || o.fused || o.zombie) continue;
    const d = Math.hypot(o.x - r.x, o.y - r.y);
    if (d < bestD) { bestD = d; best = o; }
  }
  return best;
}

function w3Sense(r, d, map) {
  const b = baseSense(r, d, map, { detect: HUNTER_REACQUIRE_RANGE, hurtAt: 0.35 });
  let work = false;
  for (const o of (map.objects || [])) {
    if (!w3Repairable(o)) continue;
    if (Math.hypot(o.x + 0.5 - r.x, o.y + 0.5 - r.y) <= W3_SCAN_RANGE) { work = true; break; }
  }
  return { ...b, work };
}

function w1Sense(r, d, map) {
  const b = baseSense(r, d, map, { detect: HUNTER_REACQUIRE_RANGE, hurtAt: W1_HURT_AT });
  delete b.linked;
  return b;
}

function t3Sense(r, d, map, player) {
  const base = baseSense(r, d, map, { detect: T3_AMBUSH_RANGE, hurtAt: T3_HURT_AT });
  const canSee = player && map.hasLineOfSight
    ? map.hasLineOfSight(r.x, r.y, player.x, player.y) : false;
  const shielded = !!(player && !player.invisibleToRobots && player.shielded && player.shielded());
  return {
    ...base,
    sight: canSee && Number.isFinite(d) && d <= T3_AMBUSH_RANGE,
    armed: (r.attackTimer || 0) <= 0,
    shielded,
    contact: Number.isFinite(d) && d < T3_HIT_RANGE + 1,
    lost_for: r.losLostT || 0,
  };
}

function w4Sense(r, d, map, player) {
  // A W-4's `threat` holds as far as it re-acquires. Read here, not as a
  // load-time const: HUNTER_REACQUIRE_RANGE is defined lower in the file.
  const base = baseSense(r, d, map, { detect: HUNTER_REACQUIRE_RANGE, hurtAt: W4_HURT_AT });
  const canSee = player && map.hasLineOfSight
    ? map.hasLineOfSight(r.x, r.y, player.x, player.y) : false;
  const shielded = !!(player && !player.invisibleToRobots && player.shielded && player.shielded());
  return {
    ...base,
    sight: canSee && Number.isFinite(d) && d <= W4_RANGE,
    armed: (r.attackTimer || 0) <= 0,
    shielded,
    contact: Number.isFinite(d) && d < 1.6,
    lost_for: r.losLostT || 0,
  };
}

// One entry per chassis: how it reads the world, and what it can be told to do.
// A table rather than a `t2Think` beside the `t1Think`, because the thinking is
// identical for every machine on the island and only the instruments and the
// gear differ. Adding a unit type is adding a row.
// One entry per programmable chassis: how it reads the world (`sense`), what
// intents it can carry out (`can`), and whether it has a weapon a `[feet,
// weapon]` pair can drive (`fire`). A row is the whole of making a class
// programmable; the shooters (W-4, T-3) that set `fire: true` land in later
// stages. T-1 and T-2 are legs and a ram — no fire control — so a pair
// returned on one faults rather than being silently half-obeyed.
const CHASSIS = {
  t1: { sense: t1Sense, can: T1_CAN, fire: false },
  // #159: the swarm reads the world exactly as a T-1 does and can choose from
  // the same repertoire. It is the same machine built cheap.
  t1w: { sense: t1Sense, can: T1_CAN, fire: false },
  t2: { sense: t2Sense, can: T2_CAN, fire: false },
  w4: { sense: w4Sense, can: W4_CAN, fire: true },
  t3: { sense: t3Sense, can: T3_CAN, fire: true },
  w1: { sense: w1Sense, can: W1_CAN, fire: false },
  w3: { sense: w3Sense, can: W3_CAN, fire: false },
  w5: { sense: w5Sense, can: W5_CAN, fire: false },
  // The V-1 carries a fuel budget of its own: its program is a forward pass,
  // which costs a thousand times what a hand-written rule costs.
  v1: { sense: v1Sense, can: V1_CAN, fire: false, fuel: V1_FUEL },
  // #149. Legs and a lamp. No fire control, and no `hunt` in its repertoire.
  t8: { sense: t8Sense, can: T8_CAN, fire: false },
};

// The network is speaking over this unit's program: a tower's recall (repel),
// or a spoofer answering with its tower's voice (the unit reads friendly).
// A bluebox conversion is NOT here — that rewrites the unit into a gardener
// for real, program and all, rather than talking over it for a spell.
export function unitOverridden(r) {
  return !!(r && (r.repelledT > 0 || r.singing || r.friendly));
}

// Walk a queued route one order at a time. A `move` order is a leg: the unit
// heads for a tile relative to where it stood when the leg came up, and the leg
// is done on arrival or abandoned after a couple of seconds pinned (blocked is
// not a fault — the next leg simply starts from where the machine actually is).
// A lamp or beep order applies at once and pops, so a colour change lands
// between the legs it sits between. When the queue empties the route is
// cleared and the program is re-run next tick.
const ROUTE_LEG_SPEED = 2.4;   // an unhurried LOGO walk
function runRoute(r, dt, map, player) {
  r.beepT = Math.max(0, (r.beepT || 0) - dt);
  if (!r.route || !r.route.length) { r.route = null; r.mlT = 0; return; }
  const order = r.route[0];
  if (order.k === 'move') {
    if (!r.routeTarget) { r.routeTarget = { x: r.x + order.dx + 0.001, y: r.y + order.dy + 0.001 }; r._routeStuckT = 0; }
    const before = Math.hypot(r.routeTarget.x - r.x, r.routeTarget.y - r.y);
    moveToward(r, r.routeTarget.x, r.routeTarget.y, ROUTE_LEG_SPEED, dt, map);
    const after = Math.hypot(r.routeTarget.x - r.x, r.routeTarget.y - r.y);
    if (before - after < ROUTE_LEG_SPEED * dt * 0.35) r._routeStuckT = (r._routeStuckT || 0) + dt;
    else r._routeStuckT = 0;
    if (after < 0.3 || r._routeStuckT > 2) { r.route.shift(); r.routeTarget = null; r._routeStuckT = 0; }
  } else {
    // lamp / flash / beep — apply the one order now and drop it.
    applyEffects(r, [order], player ? distTo(r, player) : Infinity);
    r.route.shift();
  }
  r.animT += dt;
}

// Re-read the unit's program and store what it chose. Faults are facts about
// the machine, not error messages: it keeps the fault, drops back to its
// built-in reflexes, and its own web page reports the reason.
export function botThink(r, d, dt, map, player) {
  if (!r.program) return;
  // AUTHORITY BEATS PROGRAM. While the network is recalling this unit — a
  // tower's `repel`, or a spoofer wearing its tower's voice — its own program
  // does not get a vote. It is not FAULTED (nothing is broken, so no amber
  // lamp); it is OVERRIDDEN, and its page says so. Derived from the live
  // authority state rather than a stored flag, so it cannot fall out of step
  // with it. (repel and sing already `continue` before this runs; the check
  // stands so any future authority path that keeps a unit updating normally
  // still silences its program.)
  if (unitOverridden(r)) { r.intent = null; r.fireWish = null; r.route = null; return; }
  // A route in flight owns the machine: keep walking it, do not re-decide and
  // clobber the queue. When runRoute empties it (r.route = null), the next tick
  // re-runs the program — which, if it returns route again, refills the queue,
  // and that is how a circle or a back-and-forth loops with no loop construct.
  if (r.route && r.route.length) { r.intent = 'route'; return; }
  const chassis = CHASSIS[String(r.type || '').toLowerCase()];
  // No row in the table means this build does not let you program that unit.
  // Silently ignoring the program would leave a machine serving one on its own
  // page and never running it, so say so where the page will show it.
  if (!chassis) return botFault(r, `${r.type}: this unit takes no stored program`);
  r.beepT = Math.max(0, (r.beepT || 0) - dt);
  r.mlT -= dt;
  if (r.mlT > 0) return;
  r.mlT = ML_TICK;
  // Per-chassis fuel (docs/PLAN.md §1). Every hand-written program
  // costs single-digit steps, so the default budget is what makes a runaway
  // recursion read as a fault in that machine. A V-class runs a forward pass
  // instead, which is thousands of reductions of honest arithmetic, so its
  // chassis carries a budget sized to the net with room for a wrapper.
  const res = decide(r.program, chassis.sense(r, d, map, player),
    chassis.fuel ? { fuel: chassis.fuel } : undefined);
  // Coming out of a fault clears the fault lamp before the program gets to set
  // its own; a program's colours must not be mistaken for a broken machine.
  if (res.ok && r.lampFault) { r.lamp = null; r.lampFlash = 0; r.lampFault = false; }
  // A `route`: the ordered list of moves and lamp changes IS the effects, and
  // it must NOT be applied now — the orders play one at a time as the machine
  // walks, so a colour lands where the machine is when the order comes up, not
  // all at once at decision time. Checked BEFORE applyEffects for exactly that
  // reason. Stash the queue; runRoute plays it.
  if (res.ok && res.intent === 'route') {
    if (!chassis.can.includes('route')) return botFault(r, 'route: this chassis has no gear for that');
    r.route = res.effects.slice();
    r.routeTarget = null;
    r.intent = 'route';
    r.fault = null;
    return;
  }
  // Every other outcome applies its effects now: a beep before a bad branch is
  // a beep the unit really made, and a policy program's colours are meant to
  // land the instant it decides.
  applyEffects(r, res.effects, Number.isFinite(d) ? d : Infinity);
  // THE CONSTITUTION. Rebuilt from THIS decision's clauses, so it is exactly
  // what the current program declares — replace the program and the old
  // prohibitions go with it. It is not a fault and not an intent: it sits above
  // both, and the clamps below (plus constitutionAllows at the reflex sites)
  // are what make it bind even when the reasoning fails.
  r.constitution = null;
  for (const e of (res.effects || [])) {
    if (e.k === 'never') (r.constitution ||= {})[e.word] = true;
  }
  if (r.constitution && !r._constitutionSaid) {
    r._constitutionSaid = true;
    achieveEvent('constitutionInstalled', { unit: r._netId || r.type });
  }
  if (!res.ok) return botFault(r, res.fault);
  if (!chassis.can.includes(res.intent)) {
    return botFault(r, `${res.intent}: this chassis has no gear for that`);
  }
  // A `[feet, weapon]` pair on a chassis with no weapon is a program written
  // for the wrong machine. Faulting says so, rather than moving the feet and
  // quietly dropping the trigger — which would look like the program working.
  if (res.fire && !chassis.fire) {
    return botFault(r, `${res.fire}: this chassis has no fire control`);
  }
  // A forbidden intent is VETOED, not faulted: the machine is not broken, it is
  // constrained. It falls to patrol and blips white so the veto is visible.
  if (r.constitution && r.constitution[res.intent]) {
    r.intent = 'patrol';
    r.fireWish = null;
    r.lamp = 'white'; r.lampFlash = 1;
    r.fault = null;
    return;
  }
  r.intent = res.intent;
  // What the weapon should do this tick, for the update function to read: null
  // means "no opinion, use the reflex". Only a fire-capable chassis ever sees
  // a non-null value here, because the branch above faulted otherwise.
  // `never fire` keeps the trigger up whatever the program asked for. The
  // machine still tracks and still aims; it does not pull.
  r.fireWish = (r.constitution && r.constitution.fire) ? 'hold' : (res.fire || null);
  r.fault = null;
}

// May this machine do the thing its chassis is about to do? A constitution
// outranks the reflexes as well as the program — that is the whole point of
// the mechanic, and the reason a faulted unit is still bound by it. A unit with
// no program has no constitution and is allowed everything.
export function constitutionAllows(r, word) {
  return !(r && r.constitution && r.constitution[word]);
}

// A broken program is a broken machine, and it should be visible from across a
// field: the lamp goes AMBER and flashes, which is the one signal on this island
// that means a unit is running on its reflexes rather than its orders. Its own
// page carries the reason in words. The tell overrides anything the program set,
// because the program is exactly what is not working.
function botFault(r, why) {
  r.intent = null;
  r.fault = why;
  r.lamp = 'amber';
  r.lampFlash = 2;
  r.lampFault = true;
}

// ---- FOLLOW / DEFEND: a reprogrammed unit as an escort or a protector ------
// A program that returns `follow` makes its unit trail the player at a standoff
// and fight nothing. `defend` does the same until an enemy comes near the
// player, then peels the unit off to intercept it — a melee chassis (T-1/T-2/
// W-1) rams, a shooter (W-4/T-3) fires on it. The escort's intent is never
// `hunt`, so it never treats the player as a target: it is a bodyguard, not a
// threat, and other escorts running the same code are not targets to each other
// (they carry no aggro, and only aggroed enemies are engaged).
const ESCORT_SPEED = 3.0;          // brisk: keeps pace with the player and closes on threats
const ESCORT_STANDOFF = 2.0;       // trails at arm's length rather than shoving the player
// How far out the formation ring sits beyond the standoff, and how loose a
// station is before a machine bothers to correct. The slack matters: a tight
// station has every escort twitching to hold a millimetre, which is its own
// kind of grinding.
const ESCORT_RING = 0.9;
const ESCORT_SLOT_SLACK = 0.7;
const ESCORT_THREAT_RANGE = 9;     // peels off for an enemy this near the player
const ESCORT_MELEE_RANGE = 1.0;    // ram contact
const ESCORT_MELEE_DAMAGE = 16;
const ESCORT_MELEE_COOLDOWN = 0.7;
const ESCORT_SHOOT_RANGE = 7.5;    // a shooter opens fire within this
const ESCORT_SHOOT_COOLDOWN = 1.0;
const ESCORT_BOLT_DAMAGE = 18;

// This tick's live roster, stashed by updateRobots so `defend` can scan it. Read
// only from inside that same pass, so it is never stale where it is used.
let _liveRobots = null;

// The enemy nearest the player worth intercepting: a machine actively hunting
// the player (aggro), not dead/fused/friendly/converted/relay-driven, and
// within ESCORT_THREAT_RANGE of the player. Escorts carry no aggro, so this
// never returns one — protectors do not fight each other.
/** Is this machine running one of your escort intents right now? */
function isEscorting(r) {
  return !!r && !r.fault && (r.intent === 'follow' || r.intent === 'defend');
}

// HOW THE ESTATE FINDS OUT, which is not by looking at a machine and seeing
// that it has changed its mind (David, 2026-08-15: "how can it tell they are
// turned?"). A unit on the estate's business checks in with its home tower.
// One walking beside a person under arms does not — the escort program has
// replaced the loop that did the checking in — and after AWOL_AFTER seconds of
// silence the tower writes it up. `awol` is the ESTATE'S BELIEF about a
// machine, held on the machine for convenience but owned by the net, and it is
// the only thing the M-class acts on. Nothing anywhere reads a unit's actual
// allegiance.
//
// Three things follow from routing it through the net rather than through
// omniscience, and all three are playable:
//
//   - A TOWER THAT IS DOWN CANNOT FILE. Jam or fell the home tower and your
//     escorts are never written up, because there is nobody to write them up.
//     The felling verb was already the way to blind a tower's sight (#37); it
//     is now also the way to keep a machine off the books.
//   - IT TAKES TIME. Twenty seconds of silence, so a quick errand under arms
//     does not put a unit on a list, and a long campaign does.
//   - IT IS REVERSIBLE. Stand the unit down — take the escort program off it —
//     and it starts checking in again, and the tower clears the flag. A
//     machine can come back from being suspected.
//
// GARDENERS NEVER GO AWOL, and now there is a reason rather than an exception:
// a bluebox'd W-5 is still working the tower's ground and still reporting. It
// changed its trade, not its address. (David: "not gardener-aligned".)
const AWOL_AFTER = 20;      // seconds of silence before a tower writes a unit up

/** One unit's check-in, run every tick from updateRobots. */
function reportIn(r, dt, map) {
  const ob = homeObelisk(r, map);
  const linked = ob ? !(ob.destroyed || ob.jammed || ob.needsRebuild) : false;
  // Off the net there is no reporting and no filing: the clock stops where it
  // is, so cutting the tower freezes a unit's standing rather than clearing it.
  if (!linked) return;
  if (!isEscorting(r)) {
    r.silentT = 0;
    if (r.awol) r.awol = false;      // stood down, and the tower takes it back
    return;
  }
  r.silentT = (r.silentT || 0) + dt;
  if (r.silentT >= AWOL_AFTER) r.awol = true;
}

// What the M-class acts on: a machine its own network has written up. Not what
// the machine is — what the estate has decided about it.
function isTurned(o) {
  return !!o && !o.dead && !o.fused && !o.driven && !o.gardener && !!o.awol;
}

// The nearest written-up machine in sight, within `range`.
function nearestTurned(r, robots, map, range) {
  let best = null, bestD = range;
  for (const o of robots || []) {
    if (o === r || !isTurned(o)) continue;
    const d = Math.hypot(o.x - r.x, o.y - r.y);
    if (d >= bestD) continue;
    if (!map.hasLineOfSight(r.x, r.y, o.x, o.y)) continue;
    bestD = d; best = o;
  }
  return best;
}

// The nearest machine running one of the player's escort programs, within
// `range` of this one and in line of sight. The mirror of nearestPlayerThreat:
// that one finds what to protect the player FROM, this one finds what is doing
// the protecting.
function nearestEscort(r, robots, map, range) {
  let best = null, bestD = range;
  for (const o of robots || []) {
    if (o === r || o.dead || o.fused || o.drained) continue;
    if (!isEscorting(o)) continue;
    const d = Math.hypot(o.x - r.x, o.y - r.y);
    if (d >= bestD) continue;
    if (!map.hasLineOfSight(r.x, r.y, o.x, o.y)) continue;
    bestD = d; best = o;
  }
  return best;
}

// AN ESCORT STANDING IN THE WAY TAKES THE BLOW.
//
// Every hostile's strike aimed at the PLAYER and nothing else. A machine could
// only ever chip a follower by BUMPING into it — one point, on a two-and-a-half
// second cooldown — which never visibly moves the bar, so a follower under
// attack looked invulnerable (David, 2026-08-15: "my follower seems to not take
// damage properly", then "it was attacked and didn't seem to take damage"). It
// was not a display bug; `creatureHealthBar` was reading the truth. Nothing in
// the game could hurt it.
//
// Which also made an escort screen FREE: four W-4s on `follow` were armour that
// could not be worn down, and the point of posting a machine to walk in front of
// you should be that it costs you the machine.
//
// The rule is deliberately dumb, so a player can predict it: if one of yours is
// inside the reach of the blow meant for you, it wears it instead. Not a
// target-priority system — a thing in the way.
function escortInTheWay(r, range) {
  if (!_liveRobots) return null;
  let best = null, bestD = range;
  for (const o of _liveRobots) {
    if (o === r || o.dead || o.fused || o.drained || !isEscorting(o)) continue;
    const d = Math.hypot(o.x - r.x, o.y - r.y);
    if (d < bestD) { bestD = d; best = o; }
  }
  return best;
}

function nearestPlayerThreat(player) {
  if (!_liveRobots) return null;
  let best = null, bestD = ESCORT_THREAT_RANGE;
  for (const o of _liveRobots) {
    if (o.dead || o.fused || o.friendly || o.driven || o.singing || unitOverridden(o)) continue;
    if (!o.aggro) continue;
    const d = Math.hypot(o.x - player.x, o.y - player.y);
    if (d < bestD) { bestD = d; best = o; }
  }
  return best;
}

// Robot-on-robot damage, the same shape as the Ubik-confused swing: a hit, a
// hurt flash, a short knock, a spark. Death is resolved by updateRobots at the
// top of the next tick (hp <= 0 → dead + scrap), so nothing else is needed here.
function damageRobot(o, dmg, map) {
  o.hp -= dmg;
  o.hurt = true;
  o._lastHitBy = 'escort';   // a unit you programmed did this, so the kill is yours

  o.knockT = Math.max(o.knockT || 0, 0.3);
  (map.sparks ??= []).push({ x: o.x, y: o.y, ttl: 0.35, max: 0.35 });
}

// A shooter escort's bolt at an enemy machine — the chassis's own projectile
// (T-3 throws its heavier twin-beam colour), minus the shield/mirror handling,
// which is the player's alone.
function escortFire(r, target, map) {
  (map.projectiles ??= []).push({
    x0: r.x, y0: r.y, x1: target.x, y1: target.y, prog: 0,
    kind: r.type === 't3' ? 'laser_t3' : 'laser',
  });
  sfx.play('laser');
  damageRobot(target, ESCORT_BOLT_DAMAGE, map);
}

// The escort tick, shared by every mobile fighter chassis. `mode` is 'follow'
// or 'defend'. It sets aggro=false first, so whatever the chassis did with the
// player as prey is off the table for as long as the escort program runs.
function updateEscort(r, dt, map, player, mode) {
  r.attackTimer = Math.max(0, r.attackTimer - dt);
  r.aggro = false;        // an escort hunts nothing; keep it off the attack-the-player path
  r.returning = false;
  r.stuck = false; r.noProgressT = 0;

  const shooter = !!(CHASSIS[r.type] && CHASSIS[r.type].fire);
  const enemy = mode === 'defend' ? nearestPlayerThreat(player) : null;
  // A bodyguard runs on the SERVICE rate while it just trails you, not the
  // hunter's chase rate — only closing on a real threat costs the fast drain.
  // (Trailing at DRAIN_CHASE was flattening the cell far too quickly.)
  drainBattery(r, enemy ? DRAIN_CHASE : DRAIN_FRIENDLY, dt);
  if (r.drained) return;

  if (enemy) {
    const ex = enemy.x - r.x, ey = enemy.y - r.y, de = Math.hypot(ex, ey) || 1;
    r.facing = { x: ex / de, y: ey / de };
    if (shooter) {
      const canSee = map.hasLineOfSight(r.x, r.y, enemy.x, enemy.y);
      if (de > ESCORT_SHOOT_RANGE || !canSee) {
        const tgt = chaseTarget(r, enemy.x, enemy.y, map);
        moveToward(r, tgt.x, tgt.y, ESCORT_SPEED, dt, map);
      }
      if (de <= ESCORT_SHOOT_RANGE && canSee && r.attackTimer <= 0) {
        r.attackTimer = ESCORT_SHOOT_COOLDOWN;
        escortFire(r, enemy, map);
      }
    } else {
      const tgt = chaseTarget(r, enemy.x, enemy.y, map);
      moveToward(r, tgt.x, tgt.y, ESCORT_SPEED, dt, map);
      if (de < ESCORT_MELEE_RANGE && r.attackTimer <= 0) {
        r.attackTimer = ESCORT_MELEE_COOLDOWN;
        damageRobot(enemy, ESCORT_MELEE_DAMAGE, map);
      }
    }
    return;
  }

  // No enemy to see to (or plain `follow`): keep STATION on the player, not the
  // player's exact tile.
  //
  // Every escort used to steer at the same point, so a squad of five converged
  // on one spot, shouldered each other for as long as they were following, and
  // wore itself out doing it (David, 2026-08-15: "my followers all destroy
  // themselves very quickly as they bump each other"). Each one now holds its
  // own bearing on a ring around you, so a squad spreads into a screen instead
  // of a scrum — which is both what stops the grinding and what an escort is
  // supposed to look like.
  const slot = escortSlot(r);
  const ring = ESCORT_STANDOFF + ESCORT_RING;
  const sx = player.x + Math.cos(slot) * ring;
  const sy = player.y + Math.sin(slot) * ring;
  const ds = Math.hypot(sx - r.x, sy - r.y);
  const dp = Math.hypot(player.x - r.x, player.y - r.y);
  if (ds > ESCORT_SLOT_SLACK) {
    const tgt = chaseTarget(r, sx, sy, map);
    moveToward(r, tgt.x, tgt.y, ESCORT_SPEED, dt, map);
  } else if (dp > 1e-4) {
    // On station: face the way you face, which is what a guard does.
    r.facing = { x: (player.x - r.x) / dp, y: (player.y - r.y) / dp };
  }
}

// Which bearing on the ring this machine holds. Taken from its save identity
// (uid), so it is the same station across a reload and two escorts do not swap
// places every time the world is rebuilt. The golden angle spreads any number
// of them evenly without having to count them or renumber when one dies.
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
function escortSlot(r) {
  if (r._escortSlot == null) {
    const n = Number.isFinite(r.uid) ? r.uid : (r._netSerialSeed ??= Math.abs(hashName(r._netId || r.type)));
    r._escortSlot = (n * GOLDEN) % (Math.PI * 2);
  }
  return r._escortSlot;
}

/** A stable number from a name, for machines with no uid yet. */
function hashName(s) {
  let h = 2166136261;
  const t = String(s);
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// How close two machines of the same class get before they start steering
// around each other. Well outside the 0.62 at which they touch, so the
// avoidance does its work before the shove has to.
const SWARM_PERSONAL = 1.25;

/**
 * Nudge a move target away from the machines crowding this one (#189).
 *
 * THE SEPARATION PASS IS THE LAST RESORT, NOT THE PLAN. It shoves two machines
 * apart after they have already overlapped, which looks like what it is. A
 * swarm that is aware of itself steers around its own before it gets there —
 * so this is `avoidScouts`, which the M-4 scouts have had since they were
 * written, generalised to any machine of the same chassis.
 *
 * `crowd` (0..1) comes back so the caller can also ease off: steering alone
 * cannot win when two machines close head-on, because they cover the gap inside
 * one frame whatever their targets say.
 */
function avoidOwnKind(r, robots, tx, ty) {
  let ax = 0, ay = 0, crowd = 0;
  for (const o of robots) {
    if (o === r || o.dead || o.fused || o.drained) continue;
    if (o.type !== r.type) continue;
    const dx = r.x - o.x, dy = r.y - o.y;
    const d = Math.hypot(dx, dy);
    if (d >= SWARM_PERSONAL) continue;
    const nx = d > 1e-4 ? dx / d : 1, ny = d > 1e-4 ? dy / d : 0;
    const strength = (SWARM_PERSONAL - d) / SWARM_PERSONAL;
    if (strength > crowd) crowd = strength;
    ax += nx * strength * 2.6;
    ay += ny * strength * 2.6;
  }
  return { x: tx + ax, y: ty + ay, crowd };
}

function updateT1(r, dt, player, map) {
  r.attackTimer = Math.max(0, r.attackTimer - dt);
  // A bump with one of its own: stand for a beat and let the other through.
  if (r.yieldT > 0) { r.yieldT = Math.max(0, r.yieldT - dt); if (r.yieldT > 0) return; }

  const d = distTo(r, player);
  const ease = player.threatEase ? player.threatEase() : 1;
  // #159: a T-1 and a T-1w run this same function and differ only in the
  // numbers, which live in T1_TUNE.
  const T = tuneFor(r);

  // The program decides; this function acts. With no program, or with a
  // faulted one, the machine falls back to the reflexes below — which is what
  // a T1 did before it had a program at all.
  botThink(r, d, dt, map, player);
  const intent = (r.program && !r.fault) ? r.intent : null;
  if (intent === 'route') { runRoute(r, dt, map, player); return; }
  if (intent === 'follow' || intent === 'defend') { updateEscort(r, dt, map, player, intent); return; }

  if (intent) {
    r.aggro = intent === 'hunt';
    if (!r.aggro) { r.noProgressT = 0; r.stuck = false; }
  } else {
    // A T-1 must SEE you to take an interest; a T-1w already knows. `distTo`
    // has already answered Infinity for a player the machines cannot sense at
    // all (jacked in, wearing the block, Creative), so this only decides who
    // notices somebody who IS there to be noticed.
    const canAcquire = !T.needsSight || (map.hasLineOfSight && map.hasLineOfSight(r.x, r.y, player.x, player.y));
    if (!r.aggro && d < T.detect * ease && canAcquire
      && !(r.loseInterestT > 0) && constitutionAllows(r, 'hunt')) r.aggro = true;
    if (r.aggro && d > T.deaggro) r.aggro = false;
  }

  drainBattery(r, r.aggro ? DRAIN_CHASE : DRAIN_PATROL, dt);
  if (r.drained) return;

  if (r.aggro) {
    const expected = Math.min(T.chase * dt, d);
    const tgt = chaseTarget(r, player.x, player.y, map); // route via a bridge if the river is in the way
    // Steer around its own on the way in, and slow as it closes on one: a pack
    // converging on a single point is the whole shape of a swarm attack, and
    // the only thing that keeps it from being a pile-up.
    const clear = r.swarm !== false ? avoidOwnKind(r, _liveRobots || [], tgt.x, tgt.y) : { x: tgt.x, y: tgt.y, crowd: 0 };
    const moved = moveToward(r, clear.x, clear.y, T.chase * (1 - 0.55 * clear.crowd), dt, map);
    // Progress bookkeeping for the stuck tell: a chaser pinned by terrain
    // for a couple of seconds admits it (the renderer shows its confusion).
    if (moved < expected * PROGRESS_FRACTION) r.noProgressT += dt;
    else r.noProgressT = 0;
    r.stuck = r.noProgressT > STUCK_AFTER;
    // Pinned long enough, it writes the chase off as a bad job: back to the
    // patrol (its home tower) with a long sulk before it will re-acquire —
    // no more machines buzzing at an obstacle until the end of time.
    if (r.noProgressT > STUCK_GIVE_UP) {
      r.aggro = false;
      r.stuck = false;
      r.noProgressT = 0;
      r.loseInterestT = STUCK_SULK;
    }

    // Your machine, if it is inside the swing, wears it instead of you.
    const inTheWay = escortInTheWay(r, T.hitR + reachBonus(player, map));
    if (inTheWay && r.attackTimer <= 0) {
      r.attackTimer = T.cool;
      damageRobot(inTheWay, T.dmg, map);
      inTheWay._lastHitBy = 'machine';
      return;
    }
    if (d < T.hitR + reachBonus(player, map) && r.attackTimer <= 0) {
      r.attackTimer = T.cool;
      // A T-1w against a forcefield is a DRAIN, not a threat: it earths itself
      // on the shell and takes a bite of the cell. Without this the whole swarm
      // is inert against an armed field and the B-1's fight does not happen.
      if (r.type === 't1w' && player.drainField && player.drainField()) {
        // The field ate it. It cost the player a chunk of cell and no health.
      } else {
        // guardHit, not takeDamage: on her depart-mode island a swarm robot
        // detains like everything else the fortress sends (R3).
        guardHit(player, T.dmg * ease, 'machine');
      }
    }
  } else if (intent === 'home') {
    // Back to its tower and stand there. Not `recharging`: the program said go
    // home, so it goes home — whether it drinks is the tower's business.
    const dHome = Math.hypot(r.home.x - r.x, r.home.y - r.y);
    if (dHome > 0.8) moveToward(r, r.home.x, r.home.y, RECHARGE_TRAVEL_SPEED, dt, map);
  } else if (intent === 'flee') {
    const dx = r.x - player.x, dy = r.y - player.y, m = Math.hypot(dx, dy) || 1;
    moveToward(r, r.x + (dx / m) * 3, r.y + (dy / m) * 3, T1_CHASE_SPEED, dt, map);
  } else if (intent === 'wait') {
    r.wanderTarget = null; // stands where it is, sensor still turning
  } else {
    r.noProgressT = 0;
    r.stuck = false;
    patrol(r, T.patrol, T1_PATROL_RANGE, dt, map);
  }
}

// A dual-beam volley from both eyes at once — visually two bolts (orange,
// not the red every other shooter uses), but resolved as a single hit for
// roughly double a W4 bolt, same shield/mirror handling as W4's fire.
function fireT3Lasers(r, player, map, ease) {
  const perp = { x: -r.facing.y, y: r.facing.x };
  for (const o of [-0.18, 0.18]) {
    (map.projectiles ??= []).push({
      x0: r.x + perp.x * o, y0: r.y + perp.y * o,
      x1: player.x, y1: player.y, prog: 0, kind: 'laser_t3',
    });
  }
  sfx.play('laser'); // one pew per salvo (play() debounces regardless)
  const block = player.blockRangedShot ? player.blockRangedShot(r.x, r.y) : null;
  if (block === 'reflect') {
    r.hp -= 999; r.hurt = true; r._lastHitBy = 'reflect';
    for (let s = 0; s < 5; s++) (map.sparks ??= []).push({ x: r.x + (s - 2) * 0.15, y: r.y + (s % 2) * 0.2, ttl: 0.35, max: 0.35 });
    map.projectiles.push({ x0: player.x, y0: player.y, x1: r.x, y1: r.y, prog: 0, kind: 'laser_t3' });
  } else if (!block) {
    player.takeDamage(T3_LASER_DAMAGE * ease, 'machine');
  }
}

// A tactical ambusher, not a chaser: it nests beside a tree near its tower
// (see spawnRobots) and stays there — no blind proximity detection like a
// T1/T2, it has to actually get a clear line of sight before it counts as
// noticing you at all. Once it has, it holds its ground and fires rather
// than closing in, backing off only enough to keep a shot lined up if you
// press it, same shape as a W4 but far heavier per hit and far slower to
// recover — a single missed dodge costs a lot more than a W4 bolt does.
function updateT3(r, dt, player, map) {
  r.attackTimer = Math.max(0, r.attackTimer - dt);
  const ease = player.threatEase ? player.threatEase() : 1;

  // The program decides feet and weapon; this function acts. `wait` is the
  // camped nest state, `hunt` its short engage — a T-3 never sprints. With no
  // program, a fault, or a recall, the reflex detection below runs instead.
  const dThink = distTo(r, player);
  botThink(r, dThink, dt, map, player);
  const intent = (r.program && !r.fault && !unitOverridden(r)) ? r.intent : null;
  if (intent === 'route') { runRoute(r, dt, map, player); return; }
  if (intent === 'follow' || intent === 'defend') { updateEscort(r, dt, map, player, intent); return; }
  // A constitution outranks the trigger: `never fire` holds even on a faulted
  // program, when fireWish is null and the reflex would otherwise shoot.
  const mayFire = r.fireWish !== 'hold' && r.fireWish !== 'reload' && constitutionAllows(r, 'fire');

  if (r.returning && !intent) {
    moveToward(r, r.home.x, r.home.y, T3_RETURN_SPEED, dt, map);
    if (Math.hypot(r.home.x - r.x, r.home.y - r.y) < 1) r.returning = false;
    return;
  }

  drainBattery(r, r.aggro ? DRAIN_CHASE : DRAIN_PATROL, dt);
  if (r.drained) return;

  const d = distTo(r, player);
  const canSee = map.hasLineOfSight(r.x, r.y, player.x, player.y);

  // ---- feet -----------------------------------------------------------------
  if (intent === 'home') {
    if (Math.hypot(r.home.x - r.x, r.home.y - r.y) > 0.8) moveToward(r, r.home.x, r.home.y, T3_RETURN_SPEED, dt, map);
  } else if (intent === 'flee') {
    const fx = r.x - player.x, fy = r.y - player.y, fm = Math.hypot(fx, fy) || 1;
    moveToward(r, r.x + (fx / fm) * 3, r.y + (fy / fm) * 3, T3_RETREAT_SPEED, dt, map);
  } else if (intent === 'patrol') {
    patrol(r, T3_PATROL_SPEED, T3_PATROL_RANGE, dt, map);
  } else if (intent === 'wait' || intent === 'hunt') {
    // Both hold the nest and watch. `hunt` differs only in that it nudges back
    // if you crowd it — the camped engage, never a chase. It always faces you.
    if (d > 1e-4) r.facing = { x: (player.x - r.x) / d, y: (player.y - r.y) / d };
    if (intent === 'hunt' && d < T3_MIN_RANGE && d > T3_HIT_RANGE) {
      const dx = r.x - player.x, dy = r.y - player.y;
      moveToward(r, r.x + (dx / d) * 2, r.y + (dy / d) * 2, T3_RETREAT_SPEED, dt, map);
    }
  } else {
    // Reflex (no program): dormant until it sees you, then camped and firing.
    if (!r.aggro) {
      if (d < T3_AMBUSH_RANGE * ease && canSee && constitutionAllows(r, 'hunt')) r.aggro = true;
      else { patrol(r, T3_PATROL_SPEED, T3_PATROL_RANGE, dt, map); return; }
    }
    if (d > 1e-4) r.facing = { x: (player.x - r.x) / d, y: (player.y - r.y) / d };
    if (d < T3_MIN_RANGE && d > T3_HIT_RANGE) {
      const dx = r.x - player.x, dy = r.y - player.y;
      moveToward(r, r.x + (dx / d) * 2, r.y + (dy / d) * 2, T3_RETREAT_SPEED, dt, map);
    }
  }

  // ---- claw (point-blank fallback) and the volley ---------------------------
  if (d < T3_HIT_RANGE + reachBonus(player, map) && r.attackTimer <= 0 && mayFire) {
    r.attackTimer = T3_HIT_COOLDOWN;
    player.takeDamage(T3_HIT_DAMAGE * ease, 'machine');
    return;
  }
  // The volley: geometry AND the program's leave to fire. A held weapon still
  // tracks (the facing above), it just does not pull.
  if (d <= T3_AMBUSH_RANGE * ease && canSee && r.attackTimer <= 0 && mayFire) {
    r.attackTimer = T3_FIRE_COOLDOWN;
    fireT3Lasers(r, player, map, ease);
  }
}

function updateT2(r, dt, player, map) {
  r.attackTimer = Math.max(0, r.attackTimer - dt);

  const d = distTo(r, player);
  const ease = player.threatEase ? player.threatEase() : 1;

  // The program decides; this function acts. With no program, or with a
  // faulted one, it falls back to the reflexes below — which is what a T2 did
  // before it could be programmed at all.
  botThink(r, d, dt, map, player);
  const intent = (r.program && !r.fault) ? r.intent : null;
  if (intent === 'route') { runRoute(r, dt, map, player); return; }
  if (intent === 'follow' || intent === 'defend') { updateEscort(r, dt, map, player, intent); return; }

  if (intent) {
    r.aggro = intent === 'hunt';
    // `returning` is the reflex's own state and a program does not use it. Left
    // set, it would take the machine home the moment the program said patrol.
    r.returning = false;
  } else {
    if (!r.aggro && d < T2_DETECT_RANGE * ease && !(r.loseInterestT > 0) && constitutionAllows(r, 'hunt')) {
      r.aggro = true;
      r.returning = false;
    }
    if (r.aggro && d > T2_LOSE_RANGE) {
      r.aggro = false;
      r.returning = true; // trail gone cold: back to the tower
    }
  }

  drainBattery(r, r.aggro ? DRAIN_CHASE : DRAIN_PATROL, dt);
  if (r.drained) return;

  if (r.aggro) {
    const tgt = chaseTarget(r, player.x, player.y, map); // route via a bridge if the river is in the way
    moveToward(r, tgt.x, tgt.y, T2_STALK_SPEED, dt, map);
    if (d < T2_HIT_RANGE + reachBonus(player, map) && r.attackTimer <= 0) {
      r.attackTimer = T2_HIT_COOLDOWN;
      player.takeDamage(T2_HIT_DAMAGE * ease, 'machine');
    }
  } else if (intent === 'home') {
    // Told to go home: it trudges back at the speed it trudges back at, and
    // stands there. Whether the tower charges it is the tower's business.
    if (Math.hypot(r.home.x - r.x, r.home.y - r.y) > 0.8) {
      moveToward(r, r.home.x, r.home.y, T2_RETURN_SPEED, dt, map);
    }
  } else if (intent === 'flee') {
    const dx = r.x - player.x, dy = r.y - player.y, m = Math.hypot(dx, dy) || 1;
    moveToward(r, r.x + (dx / m) * 3, r.y + (dy / m) * 3, T2_STALK_SPEED, dt, map);
  } else if (intent === 'wait') {
    r.wanderTarget = null;   // stands where it is, sensor still turning
  } else if (r.returning) {
    moveToward(r, r.home.x, r.home.y, T2_RETURN_SPEED, dt, map);
    if (Math.hypot(r.home.x - r.x, r.home.y - r.y) < 1) r.returning = false;
  } else {
    patrol(r, T2_PATROL_SPEED, T2_PATROL_RANGE, dt, map);
  }
}

// A W1 revenge-squad hunter: spawned already aggroed, no detection phase.
// It cycles attack (close in and strike) and withdraw (fall back) phases, so
// a squad hits in waves rather than a single relentless charge, and it tracks
// a position triangulated from the obelisk network — refreshed every couple
// of seconds rather than live, so it still finds you (laggily) even behind a
// jammed Wi-Fi block that blinds every other machine. Losing line of sight
// for long enough (handled generically in updateRobots) breaks it off the
// hunt like any other machine — it heads back toward the crater, wanders,
// and re-acquires by plain distance once its cooldown expires.
function updateW1(r, dt, player, map) {
  r.attackTimer = Math.max(0, r.attackTimer - dt);
  const ease = player.threatEase ? player.threatEase() : 1;

  // The program chooses; the waves are the chassis. botThink sets the intent,
  // and `hunt` runs the whole wave-and-triangulation block below. No program,
  // fault, or recall falls through to the reflex acquire.
  const dThink = distTo(r, player);
  botThink(r, dThink, dt, map, player);
  const intent = (r.program && !r.fault && !unitOverridden(r)) ? r.intent : null;
  if (intent === 'route') { runRoute(r, dt, map, player); return; }
  if (intent === 'follow' || intent === 'defend') { updateEscort(r, dt, map, player, intent); return; }
  if (intent) { r.aggro = intent === 'hunt'; r.returning = false; }

  drainBattery(r, r.aggro ? DRAIN_CHASE : DRAIN_PATROL, dt);
  if (r.drained) return;

  if (!r.aggro) {
    if (intent === 'home') {
      if (Math.hypot(r.home.x - r.x, r.home.y - r.y) > 0.8) moveToward(r, r.home.x, r.home.y, W1_CHASE_SPEED * 0.5, dt, map);
      return;
    }
    if (intent === 'flee') {
      const fx = r.x - player.x, fy = r.y - player.y, fm = Math.hypot(fx, fy) || 1;
      moveToward(r, r.x + (fx / fm) * 3, r.y + (fy / fm) * 3, W1_CHASE_SPEED, dt, map);
      return;
    }
    if (intent === 'wait') { r.wanderTarget = null; return; }
    // Reflex (no program): re-acquire by live distance, else return, else wander.
    // distTo, not a raw hypot: a jammed or jacked-in player is not there to be
    // re-acquired.
    if (!intent && !(r.loseInterestT > 0) && constitutionAllows(r, 'hunt') && distTo(r, player) < HUNTER_REACQUIRE_RANGE * ease) {
      r.aggro = true;
    } else if (r.returning) {
      moveToward(r, r.home.x, r.home.y, W1_CHASE_SPEED * 0.5, dt, map);
      if (Math.hypot(r.home.x - r.x, r.home.y - r.y) < 1) r.returning = false;
      return;
    } else {
      patrol(r, HUNTER_WANDER_SPEED, HUNTER_WANDER_RANGE, dt, map);
      return;
    }
  }

  r.w1PhaseT -= dt;
  if (r.w1PhaseT <= 0) {
    if (r.w1Phase === 'attack') { r.w1Phase = 'withdraw'; r.w1PhaseT = W1_WITHDRAW_TIME + r.rng() * 2; }
    else { r.w1Phase = 'attack'; r.w1PhaseT = W1_ATTACK_TIME + r.rng() * 3; }
  }

  r._triangT = (r._triangT ?? 0) - dt;
  if (r._triangT <= 0) {
    r._triangT = W1_TRIANGULATE_EVERY + r.rng() * 1.5;
    r.lastKnown = { x: player.x, y: player.y };
  }
  const target = r.lastKnown || { x: player.x, y: player.y };

  r.swarmAngle += r.swarmSpin * dt;
  const standoff = r.w1Phase === 'attack' ? W1_ATTACK_STANDOFF : W1_WITHDRAW_RANGE;
  const route = chaseTarget(r, target.x, target.y, map);
  let tx, ty;
  if (route.crossing) { tx = route.x; ty = route.y; } // river in the way: make for the bridge first
  else { tx = target.x + Math.cos(r.swarmAngle) * standoff; ty = target.y + Math.sin(r.swarmAngle) * standoff; }
  moveToward(r, tx, ty, W1_CHASE_SPEED, dt, map);

  // Damage checks the real, live distance (not distTo, which a Wi-Fi block
  // forces to Infinity) — triangulation gets the squad close, but a hit still
  // requires the machine to actually be standing next to you. A jammer you
  // carry does not stop that; a terminal does. `jackedIn` was the whole of
  // task #92: the W1 swarm was the ONE class that could hit you at a console,
  // and it hit through a promise the obelisk prints on its own banner.
  const realD = Math.hypot(player.x - r.x, player.y - r.y);
  if (r.w1Phase === 'attack' && !player.jackedIn && realD < W1_HIT_RANGE + reachBonus(player, map) && r.attackTimer <= 0) {
    r.attackTimer = W1_HIT_COOLDOWN;
    player.takeDamage(W1_HIT_DAMAGE * ease, 'machine');
  }
}

// A W3 repair drone: unarmed, never aggros, walks to the nearest obelisk
// with obDamage > 0 (hit by an OB_gun but not yet toppled) and heals it back
// to zero over a few seconds, then disperses — its job done.
// A repairable obelisk is damaged-but-standing (hit by an OB_gun), one felled
// during the POSEIDON purge and flagged `needsRebuild` (the drone raises that
// one from its heap back into a working tower), or one pinned by a AI-ML
// `loop` hack (frozen — the drone works the loop back out instead).
function w3Repairable(o) {
  // Damaged-but-standing, frozen by a `loop` hack, OR fully toppled — the drone
  // raises even a completely destroyed tower back up (so felling obelisks is a
  // race against the repair crew until you bring the W-factory down).
  return o.type === 'obelisk' && (o.destroyed || o.obDamage > 0 || o.frozen);
}

// Nothing to mend right now: the drone doesn't vanish — it drifts off on a slow
// wander (re-anchoring its patrol home as it goes), still scanning for fresh
// damage each frame at the top of updateW3, so it peels away the instant a
// tower takes a hit somewhere.
function w3Wander(r, dt, map) {
  drainBattery(r, DRAIN_PATROL, dt);
  if (r.drained) return;
  patrol(r, W3_SPEED * 0.6, 8, dt, map);
  r._recenterT = (r._recenterT || 0) - dt;
  if (r._recenterT <= 0) { r._recenterT = 3.5; r.home = { x: r.x, y: r.y }; }
}
function updateW3(r, dt, map, robots, player) {
  r.aggro = false;
  // The program chooses the job; the chassis finds the tower. `tend` (or no
  // program at all) runs the repair trade below. Anything else — home, flee,
  // wait, patrol — is honoured here and the fitter does not mend.
  if (player) {
    const dThink = distTo(r, player);
    botThink(r, dThink, dt, map, player);
    const intent = (r.program && !r.fault && !unitOverridden(r)) ? r.intent : null;
    if (intent === 'route') { runRoute(r, dt, map, player); return; }
    if (intent && intent !== 'tend') {
      drainBattery(r, DRAIN_PATROL, dt);
      if (r.drained) return;
      if (intent === 'home') {
        if (Math.hypot(r.home.x - r.x, r.home.y - r.y) > 0.8) moveToward(r, r.home.x, r.home.y, W3_SPEED, dt, map);
      } else if (intent === 'flee' && Number.isFinite(dThink)) {
        const fx = r.x - player.x, fy = r.y - player.y, fm = Math.hypot(fx, fy) || 1;
        moveToward(r, r.x + (fx / fm) * 3, r.y + (fy / fm) * 3, W3_SPEED, dt, map);
      } else if (intent === 'patrol') {
        w3Wander(r, dt, map);
      } // wait: stand
      r.repairTarget = null;   // dropped the job; re-find when it next tends
      return;
    }
  }
  if (!r.repairTarget || !w3Repairable(r.repairTarget)) {
    let best = null, bestD = Infinity;
    for (const o of map.objects) {
      if (!w3Repairable(o)) continue;
      const d = Math.hypot(o.x + 0.5 - r.x, o.y + 0.5 - r.y);
      if (d < bestD) { bestD = d; best = o; }
    }
    r.repairTarget = best;
  }
  if (!r.repairTarget) { w3Wander(r, dt, map); return; } // nothing to mend: wander, looking
  const ob = r.repairTarget;
  const d = Math.hypot(ob.x + 0.5 - r.x, ob.y + 0.5 - r.y);
  drainBattery(r, DRAIN_PATROL, dt);
  if (r.drained) return;
  if (d > W3_REPAIR_RANGE) {
    moveToward(r, ob.x + 0.5, ob.y + 0.5, W3_SPEED, dt, map);
    return;
  }
  // Frozen by a AI-ML `loop` hack: hold position and work the loop back out
  // over a few seconds, releasing the node and every robot it pinned before
  // falling through to any ordinary damage repair below (both can be true
  // at once — a looped tower can also be scorched).
  if (ob.frozen) {
    ob.frozenResetT = (ob.frozenResetT || 0) + dt;
    if (ob.frozenResetT >= W3_UNFREEZE_TIME) {
      ob.frozen = false;
      ob.frozenT = 0;
      ob.frozenResetT = 0;
      if (robots) for (const other of robots) if (other.frozenByOb === ob) { other.frozen = false; other.frozenByOb = null; }
    }
  }
  // A felled tower starts its rebuild from full damage; a merely-scorched one
  // from wherever its obDamage sits. Either way, healing obDamage to zero
  // finishes the job.
  if (ob.destroyed && !(ob.obDamage > 0)) ob.obDamage = 5; // any felled tower rebuilds from full
  if (ob.obDamage > 0) {
    ob.obDamage = Math.max(0, ob.obDamage - W3_REPAIR_RATE * dt);
    ob.burning = 0;
  }
  if (!(ob.obDamage > 0) && !ob.frozen) {
    if (ob.destroyed) {
      // Raise it: standing and solid again, so the POSEIDON web can relight.
      ob.destroyed = false;
      ob.needsRebuild = false;
      map.objectGrid[ob.y * map.w + ob.x] = ob;
    }
    r.repairTarget = null; // job done — next frame it finds the next tower, or wanders
  }
}

// A W5 gardener drone: no destination, no urgency. It drifts on an
// unbounded slow random walk (patrol() around a "home" that's periodically
// re-anchored to wherever it currently is, rather than a fixed tower), and
// every so often plants a sapling on a nearby patch of open grass — reusing
// the same `grow` field the ambient forest-regrowth timer in main.js uses,
// so a planted sapling thickens up over the same ~minute. Never aggros,
// never fights back.
// #149 revised — THE USHER. It does not dance. It stands at its post while her
// floor is empty, and when a person is on the lumen it comes and moves them off
// it, with the other three, in waves.
//
// It is still not a guard, and the difference is the whole point: contact is a
// SHOVE and NOTHING ELSE — you lose a couple of tiles of ground and that is the
// entire cost. No damage, and deliberately not routed through detainHit either,
// because detention counts strikes toward a limit after which her guards start
// wounding, and an usher that eventually kills you is a guard with a nicer name.
// `hunt` is not in T8_CAN, so nothing you post to one can make it worse.
//
// The wave rhythm is shared: `map._t8Wave` is advanced once per tick by the
// first unit to see it this frame, so all four are on the same beat and come at
// you as a line that then gives you a moment. Four machines converging
// individually reads as a swarm; four arriving together reads as being asked
// to leave.
function updateT8(r, dt, map, player) {
  r.aggro = false;
  r.returning = false;
  r.attackTimer = Math.max(0, (r.attackTimer || 0) - dt);
  let intent = null;
  if (player) {
    // The floor under the PLAYER, stamped once per tick for every T-8's sense to
    // read. It is a property of the grove, not of any one machine.
    if (map._t8WaveT !== map._t8Stamp) {
      map._t8Stamp = map._t8WaveT;
      map._t8PlayerLit = t8Light(map, player.x, player.y) > 0.12;
    }
    botThink(r, distTo(r, player), dt, map, player);
    intent = (r.program && !r.fault && !unitOverridden(r)) ? r.intent : null;
    if (intent === 'route') { runRoute(r, dt, map, player); return; }
  }
  drainBattery(r, DRAIN_PATROL * 0.5, dt);
  if (r.drained) return;

  if (intent === 'home') {
    if (Math.hypot(r.home.x - r.x, r.home.y - r.y) > 0.8) moveToward(r, r.home.x, r.home.y, T8_SPEED, dt, map);
    return;
  }
  if (intent === 'wait') return;

  if (intent === 'usher' && player) {
    // THE WAVE, on the grove's clock rather than this unit's, so the four move
    // as one. Advance, then hold and let you take the ground back if you want
    // it — the pressure is steady and it is never a chase.
    map._t8WaveT = (map._t8WaveT ?? 0) + dt / 4;   // four readers, one clock
    const cycle = T8_ADVANCE_TIME + T8_HOLD_TIME;
    const advancing = ((map._t8WaveT % cycle) < T8_ADVANCE_TIME);
    const d = distTo(r, player);
    if (advancing) moveToward(r, player.x, player.y, T8_USHER_SPEED, dt, map);

    if (d < T8_SHOVE_RANGE + reachBonus(player, map) && r.attackTimer <= 0) {
      r.attackTimer = T8_SHOVE_COOLDOWN;
      sfx.play('keydrop');
      // Outward from the middle of the grove, not away from the machine: the
      // point is the direction you end up going, which is OFF her floor.
      const ox = player.x - (map.lumenOrigin ? map.lumenOrigin.x : r.home.x);
      const oy = player.y - (map.lumenOrigin ? map.lumenOrigin.y : r.home.y);
      const m = Math.hypot(ox, oy) || 1;
      if (player.shove) player.shove(map, (ox / m) * T8_SHOVE_PUSH, (oy / m) * T8_SHOVE_PUSH);
    }
    return;
  }

  // `stand` (told to, or the reflex): hold the post. It walks back if it has
  // drifted off it, and otherwise does nothing at all, which is what an amenity
  // unit on an empty floor should look like.
  if (Math.hypot(r.home.x - r.x, r.home.y - r.y) > 0.6) {
    moveToward(r, r.home.x, r.home.y, T8_SPEED, dt, map);
  }
}

function updateW5(r, dt, map, player) {
  r.aggro = false;
  // A blueboxed gardener reads friendly and is overridden, so botThink returns
  // null and the reflex plant-and-wander below runs — which is what a converted
  // hunter should do. A factory or stood-down W-5 with a live program gets its
  // intent instead.
  let intent = null;
  if (player) {
    botThink(r, distTo(r, player), dt, map, player);
    intent = (r.program && !r.fault && !unitOverridden(r)) ? r.intent : null;
    if (intent === 'route') { runRoute(r, dt, map, player); return; }
  }
  drainBattery(r, DRAIN_PATROL, dt);
  if (r.drained) return;

  if (intent === 'home') {
    // Stop wandering: hold the current anchor. A gardener told home stays put
    // rather than drifting, because its home IS wherever it stopped.
    if (Math.hypot(r.home.x - r.x, r.home.y - r.y) > 0.8) moveToward(r, r.home.x, r.home.y, W5_SPEED, dt, map);
    return;
  }
  if (intent === 'flee' && player) {
    const fx = r.x - player.x, fy = r.y - player.y, fm = Math.hypot(fx, fy) || 1;
    moveToward(r, r.x + (fx / fm) * 3, r.y + (fy / fm) * 3, W5_SPEED, dt, map);
    return;
  }
  if (intent === 'wait') { r.wanderTarget = null; return; }
  // patrol (told to, or reflex with no plant): wander only, do not plant.
  if (intent === 'patrol') {
    patrol(r, W5_SPEED, W5_WANDER_RANGE, dt, map);
    r._recenterT = (r._recenterT || 0) - dt;
    if (r._recenterT <= 0) { r._recenterT = W5_RECENTER_INTERVAL; r.home = { x: r.x, y: r.y }; }
    return;
  }
  // tend (told to), or the reflex gardener with no program: wander AND plant.
  patrol(r, W5_SPEED, W5_WANDER_RANGE, dt, map);
  r._recenterT = (r._recenterT || 0) - dt;
  if (r._recenterT <= 0) {
    r._recenterT = W5_RECENTER_INTERVAL;
    r.home = { x: r.x, y: r.y };
  }
  r._plantT = (r._plantT || W5_PLANT_INTERVAL) - dt;
  if (r._plantT <= 0) {
    r._plantT = W5_PLANT_INTERVAL + Math.random() * W5_PLANT_JITTER;
    for (let attempt = 0; attempt < 8; attempt++) {
      const tx = Math.floor(r.x + (Math.random() - 0.5) * 2 * W5_PLANT_RANGE);
      const ty = Math.floor(r.y + (Math.random() - 0.5) * 2 * W5_PLANT_RANGE);
      if (map.floorAt(tx, ty) === 'grass' && !map.objectAt(tx, ty) && (!map.heightAt || map.heightAt(tx, ty) === 0)) {
        map.addObject('tree', tx, ty, { variant: Math.floor(Math.random() * 3), grow: 0.15 });
        break;
      }
    }
  }
}

// A V-1 neural courier (#127). Its program is a net, and the net answers with
// an intent like any other program; this function is what an intent MEANS for a
// porter. `tend` is the job: fetch a cell from a live tower, walk it to the
// nearest machine lying flat, and stand it back up.
//
// The state machine is plain code on purpose. A player who perturbs a weight
// changes WHICH intent comes back, and the consequence has to be something they
// can watch happen: a courier that dithers between two casualties, walks to a
// unit that is not down, or forgets to go home for the next cell. Nothing in
// the numbers says "casualty". You find out by watching it work.
function updateV1(r, dt, map, player) {
  r.aggro = false;
  r._cargoCool = Math.max(0, (r._cargoCool || 0) - dt);

  botThink(r, distTo(r, player), dt, map, player);
  const intent = (r.program && !r.fault && !unitOverridden(r)) ? r.intent : null;
  if (intent === 'route') { runRoute(r, dt, map, player); return; }

  drainBattery(r, DRAIN_PATROL, dt);
  if (r.drained) { r.cargo = false; r._docking = 0; return; }

  if (intent === 'flee' && player) {
    const fx = r.x - player.x, fy = r.y - player.y, fm = Math.hypot(fx, fy) || 1;
    moveToward(r, r.x + (fx / fm) * 3, r.y + (fy / fm) * 3, V1_SPEED, dt, map);
    return;
  }
  if (intent === 'wait') { r.wanderTarget = null; r._docking = 0; return; }
  if (intent === 'home') { v1GoHome(r, dt, map); return; }
  if (intent === 'patrol') { patrol(r, V1_SPEED, V1_WANDER_RANGE, dt, map); return; }

  // `tend`, told or reflex: the courier job.
  const casualty = nearestCasualty(r);
  if (!r.cargo) {
    // Empty-handed: go and draw a cell. A tower that is down, jammed or waiting
    // to be rebuilt has nothing to give.
    if (r._cargoCool > 0) { patrol(r, V1_SPEED, V1_WANDER_RANGE, dt, map); return; }
    const ob = homeObelisk(r, map);
    if (!ob || ob.destroyed || ob.jammed || ob.needsRebuild) {
      patrol(r, V1_SPEED, V1_WANDER_RANGE, dt, map);
      return;
    }
    if (Math.hypot(ob.x + 0.5 - r.x, ob.y + 0.5 - r.y) > V1_REACH + 0.6) {
      r._docking = 0;
      chaseTarget(r, ob.x + 0.5, ob.y + 0.5, map);
      moveToward(r, r.wanderTarget ? r.wanderTarget.x : ob.x + 0.5,
        r.wanderTarget ? r.wanderTarget.y : ob.y + 0.5, V1_SPEED, dt, map);
      return;
    }
    r._docking = (r._docking || 0) + dt;
    if (r._docking >= V1_PICKUP_T) { r._docking = 0; r.cargo = true; r.beepT = 0.4; }
    return;
  }

  // Carrying: find the fallen. With nobody down it holds the cell and patrols,
  // which is what makes cutting the supply line worth doing — the cell is
  // already spent from the tower's point of view.
  if (!casualty) { patrol(r, V1_SPEED, V1_WANDER_RANGE, dt, map); return; }
  const d = Math.hypot(casualty.x - r.x, casualty.y - r.y);
  if (d > V1_REACH) {
    chaseTarget(r, casualty.x, casualty.y, map);
    moveToward(r, r.wanderTarget ? r.wanderTarget.x : casualty.x,
      r.wanderTarget ? r.wanderTarget.y : casualty.y, V1_SPEED, dt, map);
    return;
  }
  v1Deliver(r, casualty);
}

// Hand the cell over. The revived machine is on its feet with enough charge to
// walk itself home and finish the job on the existing recharge path.
function v1Deliver(r, target) {
  r.cargo = false;
  r._cargoCool = V1_COOLDOWN;
  r.beepT = 0.6;
  target.battery = Math.max(target.battery || 0, V1_DELIVER_TO);
  target.drained = false;
  target.recharging = false;
  target.limping = false;
  target.reserveSpent = false;
  target.disabledT = 0;
  target._revivedBy = r;
  achieveEvent('unitRevived', { type: target.type, by: 'v1' });
}

function v1GoHome(r, dt, map) {
  const ob = homeObelisk(r, map);
  const hx = ob ? ob.x + 0.5 : r.home.x, hy = ob ? ob.y + 0.5 : r.home.y;
  if (Math.hypot(hx - r.x, hy - r.y) > 0.9) moveToward(r, hx, hy, V1_SPEED, dt, map);
}

// A W4 laser hunter-killer: holds at range and fires rather than closing to
// melee, backing off if the player gets within its minimum range so it
// always keeps a clear line to shoot down. Losing line of sight (a wall or
// a hill in the way) for LOS_GIVEUP_AFTER seconds straight (generic, in
// updateRobots) makes it give up and head back to the factory instead of
// homing in on a memorised spot forever; taking a hit while it's giving up
// snaps it right back into the fight.
function updateW4(r, dt, player, map) {
  r.attackTimer = Math.max(0, r.attackTimer - dt);
  const ease = player.threatEase ? player.threatEase() : 1;

  // The program decides; this function acts. With no program, a faulted one,
  // or a unit under recall, `intent`/`fireWish` come back null and the reflex
  // aggro detection below runs — which is what a W-4 did before it had a
  // program at all.
  const dThink = distTo(r, player);
  botThink(r, dThink, dt, map, player);
  const intent = (r.program && !r.fault && !unitOverridden(r)) ? r.intent : null;
  if (intent === 'route') { runRoute(r, dt, map, player); return; }
  if (intent === 'follow' || intent === 'defend') { updateEscort(r, dt, map, player, intent); return; }
  // The weapon's orders for this tick: null means "reflex" — fire when able.
  // hold and reload both keep the trigger up; reload is a deliberate cooldown.
  // A constitution outranks the trigger: `never fire` holds even on a faulted
  // program, when fireWish is null and the reflex would otherwise shoot.
  const mayFire = r.fireWish !== 'hold' && r.fireWish !== 'reload' && constitutionAllows(r, 'fire');

  if (intent) {
    r.aggro = intent === 'hunt';
    r.returning = false;
  }

  drainBattery(r, r.aggro ? DRAIN_CHASE : DRAIN_PATROL, dt);
  if (r.drained) return;

  if (!r.aggro) {
    // A program told it not to hunt: honour home/flee/wait, else patrol. With
    // no program this is the reflex — give-up return, or re-acquire by distance.
    if (intent === 'home') {
      if (Math.hypot(r.home.x - r.x, r.home.y - r.y) > 0.8) moveToward(r, r.home.x, r.home.y, W4_SPEED * 0.6, dt, map);
      return;
    }
    if (intent === 'flee') {
      const fx = r.x - player.x, fy = r.y - player.y, fm = Math.hypot(fx, fy) || 1;
      moveToward(r, r.x + (fx / fm) * 3, r.y + (fy / fm) * 3, W4_SPEED, dt, map);
      return;
    }
    if (intent === 'wait') { r.wanderTarget = null; return; }
    // Reflex (no program): give-up return, or re-acquire by plain distance.
    if (!intent && !(r.loseInterestT > 0) && constitutionAllows(r, 'hunt') && distTo(r, player) < HUNTER_REACQUIRE_RANGE * ease) {
      r.aggro = true;
    } else if (r.returning) {
      moveToward(r, r.home.x, r.home.y, W4_SPEED * 0.6, dt, map);
      if (Math.hypot(r.home.x - r.x, r.home.y - r.y) < 1) r.returning = false;
      return;
    } else {
      patrol(r, HUNTER_WANDER_SPEED, HUNTER_WANDER_RANGE, dt, map);
      return;
    }
  }

  const d = distTo(r, player);
  const canSee = map.hasLineOfSight(r.x, r.y, player.x, player.y);
  // With the player's shield or forcefield up, plinking from a safe distance
  // is useless — so the hunter stops holding at range and bears down, closing
  // right in and staying on the player rather than backing off. It still fires
  // if it gets a clear line (the shield might drop; a mirror shield will
  // destroy it as it fires — the price of pressing a shielded target).
  const pressShielded = !player.invisibleToRobots && player.shielded && player.shielded();
  if (pressShielded) {
    if (d > 1.3) moveToward(r, player.x, player.y, W4_SPEED, dt, map);
  } else if (d > W4_RANGE) {
    moveToward(r, player.x, player.y, W4_SPEED, dt, map);
  } else if (d < W4_MIN_RANGE && d > 1e-4) {
    const dx = r.x - player.x, dy = r.y - player.y;
    moveToward(r, r.x + (dx / d) * 2, r.y + (dy / d) * 2, W4_SPEED, dt, map);
  }
  if (d <= W4_RANGE && d > 1e-4 && canSee) {
    r.facing = { x: (player.x - r.x) / d, y: (player.y - r.y) / d };
    // The shot itself is the one thing a program can veto: `hold`/`reload` keep
    // the trigger up while the machine still tracks and lines up. Facing the
    // target happens either way — a held weapon still aims.
    if (r.attackTimer <= 0 && mayFire) {
      r.attackTimer = W4_FIRE_COOLDOWN;
      (map.projectiles ??= []).push({ x0: r.x, y0: r.y, x1: player.x, y1: player.y, prog: 0, kind: 'laser' });
      sfx.play('laser');
      // A shield or forcefield can stop the bolt; a mirror shield throws it
      // straight back and hurts the shooter.
      const block = player.blockRangedShot ? player.blockRangedShot(r.x, r.y) : null;
      if (block === 'reflect') {
        // A mirror shield throws the bolt straight back and destroys the shooter.
        r.hp -= 999; r.hurt = true; r._lastHitBy = 'reflect';
        for (let s = 0; s < 5; s++) (map.sparks ??= []).push({ x: r.x + (s - 2) * 0.15, y: r.y + (s % 2) * 0.2, ttl: 0.35, max: 0.35 });
        map.projectiles.push({ x0: player.x, y0: player.y, x1: r.x, y1: r.y, prog: 0, kind: 'laser' });
      } else if (!block) {
        player.takeDamage(W4_DAMAGE * ease, 'machine');
      }
    }
  }
}

// ---- ZEUS fortress guards: M4 report drone / M5 sniper / M6 pack -----------

const GUARD_VISION = { m4: M4_VISION, m5: M5_VISION, m6: M6_VISION };
const GUARD_CONE = { m4: M4_CONE_DOT, m5: -0.1, m6: M6_CONE_DOT };

// Sight test: LOS + per-class vision range + the sensor's forward cone. A
// jammed Wi-Fi block blinds it (being struck still wakes it, generically).
function guardSees(r, player, map) {
  if (player.invisibleToRobots) return false;
  const d = Math.hypot(player.x - r.x, player.y - r.y);
  if (d > (GUARD_VISION[r.type] || M6_VISION) || d < 1e-4) return false;
  if (!map.hasLineOfSight(r.x, r.y, player.x, player.y)) return false;
  const dot = ((player.x - r.x) / d) * r.facing.x + ((player.y - r.y) / d) * r.facing.y;
  return dot > (GUARD_CONE[r.type] ?? M6_CONE_DOT);
}

// --- Fortress pathfinding: BFS through the corridors -------------------------
// The fortress is a maze, so a guard can't just walk at the intruder — it has to
// thread the corridors. A cheap breadth-first search over walkable tiles (the
// annex is flat, so solidity is the only gate) returns the next tile to step to.
// The player's own tile is always allowed as the goal even if something's on it.
function guardNextWaypoint(r, tx, ty, map) {
  const w = map.w, sx = Math.floor(r.x), sy = Math.floor(r.y), gx = Math.floor(tx), gy = Math.floor(ty);
  if (sx === gx && sy === gy) return { x: tx, y: ty };
  const start = sy * w + sx, goal = gy * w + gx;
  const prev = new Map([[start, -1]]);
  const q = [start];
  const MAX = 4500;               // node cap: bounds the cost if the target's unreachable
  let found = false;
  for (let h = 0; h < q.length && h < MAX; h++) {
    const cur = q[h];
    if (cur === goal) { found = true; break; }
    const cx = cur % w, cy = (cur - cx) / w;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= map.h) continue;
      const ni = ny * w + nx;
      if (prev.has(ni)) continue;
      if (ni !== goal && map.isSolid(nx, ny)) continue;
      prev.set(ni, cur);
      q.push(ni);
    }
  }
  if (!found) return null;
  let n = goal;
  while (prev.get(n) !== start && prev.get(n) !== -1) n = prev.get(n);
  return { x: (n % w) + 0.5, y: Math.floor(n / w) + 0.5 };
}

// Follow a cached corridor path toward the player. While a route exists it keeps
// the LOS-giveup clock at zero, so a guard threading the maze (out of sight for a
// stretch) stays on the hunt instead of giving up mid-corridor; only if there's
// genuinely no route (you've escaped the fortress) does the generic give-up run.
function pursueMaze(r, dt, tx, ty, map, speed) {
  r._pathT = (r._pathT ?? 0) - dt;
  const reached = r._wp && Math.hypot(r._wp.x - r.x, r._wp.y - r.y) < 0.45;
  if (!r._wp || reached || r._pathT <= 0) {
    r._wp = guardNextWaypoint(r, tx, ty, map);
    r._pathT = 0.4 + (r.rng ? r.rng() * 0.3 : 0.15);
  }
  if (r._wp) moveToward(r, r._wp.x, r._wp.y, speed, dt, map);
  else moveToward(r, tx, ty, speed, dt, map);
}

// `facX`/`facY` are the foundry, threaded through for the M-6's resupply run.
function updateGuard(r, dt, player, map, robots, facX = null, facY = null) {
  r.attackTimer = Math.max(0, r.attackTimer - dt);
  const ease = player.threatEase ? player.threatEase() : 1;
  drainBattery(r, r.aggro ? DRAIN_CHASE : DRAIN_PATROL, dt);
  if (r.drained) return;
  r.sees = false; // set true below only while actually hunting with eyes on you

  if (!r.aggro) {
    if (!(r.loseInterestT > 0) && guardSees(r, player, map)) {
      r.aggro = true; // spotted — the fortress controller starts its report clock
    } else if (r.returning) {
      moveToward(r, r.home.x, r.home.y, M6_CHASE_SPEED * 0.5, dt, map);
      if (Math.hypot(r.home.x - r.x, r.home.y - r.y) < 1) r.returning = false;
      return;
    } else {
      patrol(r, r.type === 'm4' ? M4_PATROL_SPEED : M6_PATROL_SPEED, M6_PATROL_RANGE, dt, map);
      return;
    }
  }

  // A guard that has acquired you STAYS on the hunt. It does not get bored, does
  // not wander back to its post, and does not forget: a fortress guard is not a
  // scavenger with somewhere else to be. The only things that take one off you
  // are destroying it, stunning or driving it from a terminal (disabledT /
  // driven), and the island's mind dying. It keeps sweeping your last-seen tile
  // when it loses sight, and re-acquires the moment it sees you again.
  //
  // `r.sees` — whether it has eyes on you THIS frame — is tracked separately from
  // `r.aggro` (whether it is hunting at all). The fortress's report clock and
  // stand-down read `sees`, so hiding well still quiets the alarm and stops the
  // reinforcement waves, even though the guards themselves stay hostile.
  const saw = !player.invisibleToRobots && map.hasLineOfSight(r.x, r.y, player.x, player.y);
  r.sees = saw;
  if (saw) { r.seenX = player.x; r.seenY = player.y; r.seenT = 0; }
  else r.seenT = (r.seenT || 0) + dt;

  const d = distTo(r, player);
  if (d > 1e-4) r.facing = { x: (player.x - r.x) / d, y: (player.y - r.y) / d }; // face you while engaged

  // A REFUNCTIONED UNIT IS A TARGET (David, 2026-08-15: "the M class can detect
  // a refunctioned W class and will attack it"). The M-class is the estate's
  // own police, and a machine that has stopped answering the net and started
  // walking beside a person is the exact thing it is posted against — so it
  // deals with the turncoat before it deals with you. It also means an escort
  // screen costs something to maintain in guarded ground, rather than being a
  // free set of extra guns.
  //
  // The M-4 is deliberately NOT armed here. It is the alarm, not the answer;
  // giving it a weapon because a new target appeared would quietly change what
  // that class is. It marks the turncoat and keeps it in sight, which is what
  // it does with you.
  // The carrier is an m6 by chassis and a king by behaviour: it has its own
  // targeting in updateCarrier, which already puts the escorts first.
  const turncoat = r.carrier ? null
    : nearestTurned(r, robots, map, r.type === 'm5' ? M5_RANGE : M6_TURNCOAT_RANGE);
  if (turncoat && r.type !== 'm4') {
    const dq = Math.hypot(turncoat.x - r.x, turncoat.y - r.y);
    if (dq > 1e-4) r.facing = { x: (turncoat.x - r.x) / dq, y: (turncoat.y - r.y) / dq };
    r.attackTimer = Math.max(0, r.attackTimer - dt);
    if (r.type === 'm5') {
      if (dq > M5_MIN_RANGE && r.attackTimer <= 0) {
        r.attackTimer = M5_FIRE_COOLDOWN;
        (map.projectiles ??= []).push({ x0: r.x, y0: r.y, x1: turncoat.x, y1: turncoat.y, prog: 0, kind: 'laser_m5' });
        sfx.play('laser');
        damageRobot(turncoat, M5_DAMAGE * 2, map);
        turncoat._lastHitBy = 'machine';
      }
    } else {
      moveToward(r, turncoat.x, turncoat.y, M6_CHASE_SPEED, dt, map);
      if (dq < 1.6 && r.attackTimer <= 0) {
        r.attackTimer = M6_TURNCOAT_COOLDOWN;
        damageRobot(turncoat, M6_TURNCOAT_DAMAGE, map);
        turncoat._lastHitBy = 'machine';
      }
    }
    return;
  }
  if (r.type === 'm4') updateM4(r, dt, player, map, d, robots);
  else if (r.type === 'm5') updateM5(r, dt, player, map, ease, d);
  else updateM6Pack(r, dt, player, map, robots, ease, facX, facY);
}

// M4: unarmed. It just holds you in sight at a wary distance while the breach
// reports (its `aggro` is what the fortress's report clock reads); it never
// strikes. Orbits to keep line of sight, backs off if you rush it.
function updateM4(r, dt, player, map, d, robots = []) {
  // Blind (no line of sight): it doesn't magically know where you are — it makes
  // for the tile it last saw you on and sweeps there. The give-up timer lives in
  // updateGuard; here it just walks the search.
  const canSee = !player.invisibleToRobots && map.hasLineOfSight(r.x, r.y, player.x, player.y);
  if (!canSee) {
    if (r.seenX == null) return;
    // A WING or the TAIL of a search team: hold station on the point instead of
    // running your own hunt. The whole squad moves as one shape.
    const lead = r._squadLead;
    if (r._squad != null && r._slot > 0 && lead && !lead.dead && !lead.drained) {
      const dir = lead._sweepDir || { x: 1, y: 0 };
      const px = -dir.y, py = dir.x; // perpendicular: the wings ride out on this
      const slot = SQUAD_SLOTS[Math.min(r._slot, SQUAD_SLOTS.length - 1)];
      let tx = lead.x + (dir.x * slot.f + px * slot.s) * SQUAD_SPACING;
      let ty = lead.y + (dir.y * slot.f + py * slot.s) * SQUAD_SPACING;
      const av = avoidScouts(r, robots, tx, ty); // never crowd a fellow
      tx = av.x; ty = av.y;
      const gap = Math.hypot(tx - r.x, ty - r.y);
      // Ease off inside the slot: driving hard at a station you already hold is
      // what makes machines grind into each other (and bumping costs both HP).
      if (gap > SQUAD_SETTLE) {
        const base = gap > 3 ? M4_FLEE_SPEED : M4_PATROL_SPEED;
        moveToward(r, tx, ty, base * (1 - 0.75 * av.crowd), dt, map);
      }
      return;
    }
    // The POINT (or a lone scout): drive the search. Head for the last-seen tile
    // first, then sweep outward from it.
    let tx, ty, speed;
    if (Math.hypot(r.seenX - r.x, r.seenY - r.y) > 1) {
      tx = r.seenX; ty = r.seenY; speed = M4_FLEE_SPEED;
    } else {
      // Arrived and you are not there. It used to simply STOP here — standing on
      // the spot forever, which is what read as a guard losing its point. Now it
      // sweeps: a widening spiral around the last contact. Resets whenever it
      // sees you again (updateGuard stamps seenX/seenY).
      //
      // WAYPOINT spiral, not a time-driven one. A target swept round a circle by
      // the clock moves faster than the scout can walk (radius x rate outruns
      // patrol speed), so the machine just gets dragged in a tight circle at the
      // centre and never searches anything. Instead it walks one leg at a time
      // and only advances the spiral when the leg is actually WALKED — so the
      // search genuinely expands outward over the ground.
      //
      // The phase offset is per-scout and stable: without it two scouts working
      // the same last contact trace the SAME spiral and drive straight into each
      // other. With it they quarter different arcs of the same ground.
      if (r._sweepPhase == null) r._sweepPhase = r.rng ? r.rng() * Math.PI * 2 : 0;
      r._searchWpT = (r._searchWpT ?? 0) - dt;
      const reached = r._searchWp && Math.hypot(r._searchWp.x - r.x, r._searchWp.y - r.y) < 1.2;
      if (!r._searchWp || reached || r._searchWpT <= 0) {
        r._searchLeg = (r._searchLeg || 0) + 1;
        const ang = r._sweepPhase + r._searchLeg * 1.1;             // ~63 degrees per leg
        const rad = 2.5 + Math.min(11, r._searchLeg * 1.3);         // creeps outward, capped
        r._searchWp = { x: r.seenX + Math.cos(ang) * rad, y: r.seenY + Math.sin(ang) * rad };
        r._searchWpT = 6;                                           // abandon an unreachable leg
      }
      tx = r._searchWp.x; ty = r._searchWp.y;
      speed = M4_PATROL_SPEED;
    }
    const av = avoidScouts(r, robots, tx, ty);
    tx = av.x; ty = av.y;
    // Publish the heading (rate-limited) so the wings know which way the
    // arrowhead points without it snapping around under them.
    const hx = tx - r.x, hy = ty - r.y, hd = Math.hypot(hx, hy);
    if (hd > 1e-3) r._sweepDir = steerHeading(r._sweepDir, { x: hx / hd, y: hy / hd }, dt);
    moveToward(r, tx, ty, speed * (1 - 0.75 * av.crowd), dt, map);
    return;
  }
  // Eyes on you again: the search spiral starts fresh from the new contact.
  r._searchLeg = 0; r._searchWp = null;
  // In sight: hold at a wary distance and orbit to keep the line open.
  if (d > M4_KEEP_RANGE + 1) {
    moveToward(r, player.x, player.y, M4_FLEE_SPEED, dt, map);
  } else if (d < M4_KEEP_RANGE - 1 && d > 1e-4) {
    const dx = r.x - player.x, dy = r.y - player.y;
    moveToward(r, r.x + (dx / d) * 3, r.y + (dy / d) * 3, M4_FLEE_SPEED, dt, map);
  } else if (d > 1e-4) {
    const ang = Math.atan2(r.y - player.y, r.x - player.x) + 0.8 * dt; // slow orbit
    moveToward(r, player.x + Math.cos(ang) * d, player.y + Math.sin(ang) * d, M4_FLEE_SPEED * 0.8, dt, map);
  }
}

// M5: the sniper. Camps at long range and plinks a low-power ORANGE laser on a
// clear line. It never charges — if you close inside its min range it scurries
// back to keep its distance (hiding). Losing sight for long breaks it off
// (generic LOS-giveup).
function updateM5(r, dt, player, map, ease, d) {
  const canSee = map.hasLineOfSight(r.x, r.y, player.x, player.y);
  // No firing line: the sniper HOLDS BACK in the quad. It moves to its assigned
  // post (r.holdPos, seeded on the open quadrangle) and waits there for you to
  // step into a sightline, rather than chasing into the maze after the pack.
  if (!canSee) {
    const hx = r.holdPos ? r.holdPos.x : player.x, hy = r.holdPos ? r.holdPos.y : player.y;
    if (Math.hypot(hx - r.x, hy - r.y) > 1.4) pursueMaze(r, dt, hx, hy, map, M6_CHASE_SPEED * 0.9);
    return;
  }
  if (d < M5_MIN_RANGE && d > 1e-4) {
    const dx = r.x - player.x, dy = r.y - player.y;
    moveToward(r, r.x + (dx / d) * 3, r.y + (dy / d) * 3, M6_CHASE_SPEED, dt, map);
  }
  if (canSee && d <= M5_RANGE && d > 1e-4 && r.attackTimer <= 0) {
    r.attackTimer = M5_FIRE_COOLDOWN;
    // Depart mode (R3): her sniper fires a SOPORIFIC bolt, not a laser. It is
    // slow and indigo — you can see it coming and step out of its path. It flies
    // to where you STOOD (x1/y1 fixed at fire time) and only detains if you are
    // still there when it lands (main.js resolves torpor bolts on arrival), so
    // moving is a real dodge. No instant hit, no reflect — a slow lotus-shot.
    if (player.detainMode) {
      (map.projectiles ??= []).push({
        x0: r.x, y0: r.y, x1: player.x, y1: player.y, prog: 0,
        kind: 'torpor', speed: TORPOR_BOLT_SPEED, dmg: M5_DAMAGE * ease,
      });
      sfx.play('laser', { pitch: 0.55 }); // a lower, sleepier note than the war-laser
      return;
    }
    (map.projectiles ??= []).push({ x0: r.x, y0: r.y, x1: player.x, y1: player.y, prog: 0, kind: 'laser_m5' });
    sfx.play('laser');
    const block = player.blockRangedShot ? player.blockRangedShot(r.x, r.y) : null;
    if (block === 'reflect') {
      r.hp -= 999; r.hurt = true; r._lastHitBy = 'reflect';
      map.projectiles.push({ x0: player.x, y0: player.y, x1: r.x, y1: r.y, prog: 0, kind: 'laser_m5' });
    } else if (!block) {
      guardHit(player, M5_DAMAGE * ease, 'machine');
    }
  }
}

// M6: pack robot. Only commits to a rush once M6_PACK_MIN of its fellows are
// aggro'd near you; a lone one hangs back at withdraw range and waits. Once the
// pack is up it runs waves — close and strike (attack phase), then fall back
// (withdraw), then charge again — each on its own staggered phase and swarm
// angle so the squad surrounds you rather than piling on one spot.
// #159 — THE CARRIER's own loop, split out of the M6 pack because it shares
// none of the pack's behaviour: no waves of its own, no charge, no pack count.
//
// It is a courier that has been found out. Three things it does, in order of how
// much it cares: keep away from you, print machines at you, and — only if you
// have it cornered — push you off. It never chases and it never commits.
function updateCarrier(r, dt, player, map, robots, ease) {
  const d = Math.hypot(player.x - r.x, player.y - r.y);
  r.m6Phase = 'withdraw';

  // Was it struck this tick? Decided up in updateRobots, where the shield is
  // resolved before the death check; this only reads the answer.
  const struck = !!r._struck;
  r.shieldFlash = Math.max(0, (r.shieldFlash || 0) - dt);
  r.shieldBroke = Math.max(0, (r.shieldBroke || 0) - dt);

  // THE BUILDING IT IS STANDING OVER. Swing at the factory and the carrier
  // comes, even if you never touched the carrier — that is the whole of what
  // makes it a guard. Watched by hull change, so bombs, the electro-gun and a
  // sledgehammer all count without any of them knowing about this.
  let postHit = false;
  if (r.postObj) {
    if (r._postHp == null) r._postHp = r.postObj.hp;
    postHit = r.postObj.hp < r._postHp;
    r._postHp = r.postObj.hp;
  }

  // DISENGAGE. This is the "you do not have to do this" clause: a player who is
  // not taking the warrior route can walk away, and the encounter ends rather
  // than following them across the island. It gives up when nothing has hurt it
  // and nobody is near for CARRIER_DISENGAGE seconds, and goes back to its beat.
  r.engageT = (r.engageT ?? 0);
  if (d < CARRIER_NEAR || struck || postHit) r.engageT = CARRIER_DISENGAGE;
  else r.engageT = Math.max(0, r.engageT - dt);
  if (r.engageT <= 0) {
    r.aggro = false;
    r.waveT = 0;            // a fight it walked away from starts fresh
    r.struckT = 0;
    patrol(r, CARRIER_SPEED, r.postObj ? CARRIER_BEAT : M6_PATROL_RANGE, dt, map);
    return;
  }

  // Withdraw: orbit at a fixed radius, slowly. Not a chase and not a flight —
  // a machine keeping a professional distance from a problem.
  r.swarmAngle = (r.swarmAngle ?? 0) + (r.swarmSpin ?? 0.12) * dt;
  moveToward(r,
    // DIOMEDES ORBITS CLOSER. `pressScale` is the one number that makes a king
    // feel different at range: Agamemnon keeps his distance and prints, the man
    // who wounded two gods in an afternoon does not.
    player.x + Math.cos(r.swarmAngle) * CARRIER_STANDOFF * (r.pressScale || 1),
    player.y + Math.sin(r.swarmAngle) * CARRIER_STANDOFF * (r.pressScale || 1),
    CARRIER_SPEED, dt, map);

  // THE OCCASIONAL SHOT. It fires while it orbits, on its own long cooldown,
  // and never while it is spooling: the two seconds it spends opening its ports
  // are the window the fight is built around, and a machine that shot at you
  // through its own telegraph would be taking that window back. Line of sight
  // is required, so breaking line is a real answer to it.
  r.fireT = Math.max(0, (r.fireT ?? 0) - dt);
  if (r.fireT <= 0 && (r.spoolT ?? 0) <= 0) {
    // THE ESCORTS GO FIRST. A king that shoots past the bodyguards at the man
    // behind them is not a king, it is a target dummy — and a player who posts
    // `follow` to four W-4s and walks in behind them has solved the fight
    // (David, 2026-08-15: "the B1 should be smart enough to also aim at the
    // followers first"). It clears the screen, then it deals with you. Nearest
    // escort first, because that is the one about to reach it.
    const guard = nearestEscort(r, robots, map, CARRIER_FIRE_RANGE);
    const tx = guard ? guard.x : player.x, ty = guard ? guard.y : player.y;
    const dt2 = Math.hypot(tx - r.x, ty - r.y);
    if (dt2 <= CARRIER_FIRE_RANGE && dt2 > 1e-4 && map.hasLineOfSight(r.x, r.y, tx, ty)) {
      r.fireT = CARRIER_FIRE_EVERY;
      r.facing = { x: (tx - r.x) / dt2, y: (ty - r.y) / dt2 };
      (map.projectiles ??= []).push({ x0: r.x, y0: r.y, x1: tx, y1: ty, prog: 0, kind: 'laser_m5' });
      sfx.play('laser', { pitch: 0.8 });
      if (guard) {
        // A machine takes it as a machine does. It hits harder than an escort's
        // own bolt: this is the weapon a king carries, and the screen is meant
        // to cost you something to keep up.
        damageRobot(guard, CARRIER_DAMAGE * 2, map);
        guard._lastHitBy = 'machine';
      } else {
        const block = player.blockRangedShot ? player.blockRangedShot(r.x, r.y) : null;
        if (block === 'reflect') {
          // A mirror shield kills anything else that fires into it. Not a king:
          // it takes the bolt back as damage like any other blow, which means
          // the GATE takes it and you still have to work the fight. A one-click
          // boss kill sitting behind an item would undo the whole five gates.
          r.hp -= CARRIER_DAMAGE * 3; r.hurt = true; r._lastHitBy = 'reflect';
          map.projectiles.push({ x0: player.x, y0: player.y, x1: r.x, y1: r.y, prog: 0, kind: 'laser_m5' });
        } else if (!block) {
          guardHit(player, CARRIER_DAMAGE * ease, 'machine');
        }
      }
    }
  }

  // THE WAVE. Struck, it starts a short fuse; when the fuse burns down and the
  // wave cooldown is clear, it prints. Once it has been opened at all it keeps
  // printing on the cooldown for as long as you stay in the fight — it does not
  // need hitting again to remember it is in one.
  if (struck) r.struckT = CARRIER_WAVE_GRACE;
  r.struckT = Math.max(0, (r.struckT ?? 0) - dt);
  r.waveT = Math.max(0, (r.waveT ?? 0) - dt);
  // Has it tipped into the last stand? Announced once, with its own tell, so the
  // player knows the rules just changed rather than wondering why the swarm
  // suddenly doubled.
  const lastStand = hpFracOf(r) <= CARRIER_LAST_STAND;
  if (lastStand && !r.lastStand) {
    r.lastStand = true;
    r.calling = 1.6;
    r.waveT = 0;                        // it does not wait out the old cycle
    if (player.say) player.say('The carrier stops backing away. Every port on it opens at once.');
    sfx.play('charge');
  }
  // Damage to the building provokes the waves too: a raid on the factory is the
  // thing it was posted to answer, and answering it by printing machines is the
  // only answer it has.
  if (postHit) r.struckT = CARRIER_WAVE_GRACE;
  const provoked = (r.struckT > 0) || (r.hp < r.maxHp) || postHit;
  // SPOOLING UP. Provoked and off cooldown, it does not print at once: it
  // spends two seconds opening its ports, and those two seconds are when it can
  // be hurt properly. The tell has to come first so a player can act on it.
  if (provoked && r.waveT <= 0 && (r.spoolT ?? 0) <= 0 && !r._spooled) {
    r.spoolT = CARRIER_SPOOL;
    r._spooled = true;
    sfx.play('charge');
  }
  if ((r.spoolT ?? 0) > 0) {
    r.spoolT = Math.max(0, r.spoolT - dt);
    if (r.spoolT > 0) return;          // still opening; the wave is not out yet
  }
  // ONCE IT HAS COMMITTED, IT PRINTS. Deliberately not re-checking `provoked`:
  // the grace on a blow is 0.6s and the spool is 2s, so a carrier whose shield
  // ate the hit would wind its ports open and then fizzle — the telegraph would
  // be a lie about half the time. Starting to open is the commitment.
  if (r.waveT <= 0 && r._spooled) {
    r._spooled = false;
    r.waveT = lastStand ? CARRIER_LAST_WAVE_EVERY : CARRIER_WAVE_EVERY;
    // The wave counts toward the gates, and the gate dropping SPENDS the bank:
    // everything landed on the sealed hull arrives at once, and the bar moves
    // for it. That is the payoff for having worked on it between waves.
    r.waves = (r.waves || 0) + 1;
    if (r.banked > 0) {
      r.hp -= r.banked;
      r.banked = 0;
      const f2 = carrierFloor(r.maxHp, r.waves);
      if (r.waves < CARRIER_GATES && r.hp < f2) {   // overflowed the next gate too
        r.banked = (f2 - r.hp) * (1 - CARRIER_SEALED_BITE);
        r.hp = f2;
      }
    }
    let alive = 0;
    for (const o of robots) if (o.calledBy === r && !o.dead && !o.fused) alive++;
    const cap = lastStand
      ? CARRIER_LAST_SWARM_CAP
      : Math.min(CARRIER_SWARM_CAP, CARRIER_SWARM_CAP_BASE + (r.waves || 0) * CARRIER_SWARM_CAP_STEP);
    const room = cap - alive;
    if (room > 0) {
      // The wave's ORDER, and the number that order needs. The old size curve
      // still caps it (a hurt carrier prints more, a threatening player draws
      // more), but the tactic sets the shape.
      const tactic = lastStand ? 'storm' : carrierTactic(r.waves);
      const want = Math.round(Math.max(carrierTacticSize(tactic), carrierWaveSize(r, player)) * (r.waveScale || 1));
      const n = Math.min(room, want);
      for (let i = 0; i < n; i++) {
        const w = spawnT1w(map, Math.floor(r.rng() * 0x7fffffff), Math.floor(r.x), Math.floor(r.y));
        if (!w) break;
        w.calledBy = r;   // the cap counts ITS swarm, not every machine on the island
        w.tactic = tactic;
        w.squad = r.waves;                 // which wave it came out with
        w.pack = Math.floor(i / 3);        // `packs` sends its threes in turn
        // `circle` gives each machine its own bearing on the ring, so they run
        // wide to different points rather than following one another out.
        w.ring = (i / Math.max(1, n)) * Math.PI * 2;
        w.tacticT = 0;
        robots.push(w);
      }
      if (player.say && !lastStand) player.say(WAVE_SAID[tactic] || '');
      r.calling = 1.2;    // render/audio tell: a wave just came out of it
    }
  }
  if (r.calling > 0) r.calling = Math.max(0, r.calling - dt);
  if (r.sealFlash > 0) r.sealFlash = Math.max(0, r.sealFlash - dt);

  if (d < M6_HIT_RANGE + reachBonus(player, map) && r.attackTimer <= 0) {
    r.attackTimer = M6_HIT_COOLDOWN;
    guardHit(player, CARRIER_HIT_DAMAGE * ease, 'machine');
  }
}

// How many go out this wave: CARRIER_WAVE_MIN while it is whole, rising to
// CARRIER_WAVE_MAX as the hull goes. Exported for the tests, which is the only
// honest way to pin a curve.
/** Hull left, 0..1. One reader so the wave curve and the last stand agree. */
function hpFracOf(r) {
  return r && r.maxHp ? Math.max(0, Math.min(1, r.hp / r.maxHp)) : 1;
}

export function carrierWaveSize(r, player = null) {
  const frac = hpFracOf(r);
  // The game mode scales the king's waves the same way it scales POSEIDON's:
  // the fight is the swarm, so the swarm is where the difficulty lives.
  const mode = player && player.modeRules ? player.modeRules().pressure : 1;
  const base = (CARRIER_WAVE_MIN + (CARRIER_WAVE_MAX - CARRIER_WAVE_MIN) * (1 - frac)) * mode;
  // #159 — THE FACTORY SIZES THE RESPONSE TO WHAT YOU ARE CARRYING (Henrik,
  // 2026-08-14: "perhaps the boss is more difficult if you have better items?").
  // Diegetic rather than rubber-banded: the thing dispatching machines can see
  // what walked up to it, and a person with a robot-sword is a different problem
  // from a person with a shovel. Bounded at +3 so it tunes the fight rather than
  // punishing you for having earned good kit.
  const bonus = player && player.weaponThreat ? Math.min(3, Math.max(0, player.weaponThreat())) : 0;
  return Math.round(base) + bonus;
}

function updateM6Pack(r, dt, player, map, robots, ease, facX = null, facY = null) {
  // OUT OF GRENADES: break off and walk to the foundry. It stops fighting while
  // it does — a machine that shoots at you all the way to the armoury and back
  // has not really run out of anything.
  if (r.bombs === 0 && facX != null && !r.carrier) {
    r.m6Resupply = true;
    r.aggro = false;
  }
  if (r.m6Resupply) {
    if (facX == null) { r.m6Resupply = false; r.bombs = M6_BOMBS; }   // no foundry left to visit
    else if (Math.hypot(facX - r.x, facY - r.y) <= M6_RESTOCK_AT) {
      r.bombs = M6_BOMBS;
      r.m6Resupply = false;
      r.m6BombT = M6_BOMB_EVERY;
    } else {
      const t = chaseTarget(r, facX, facY, map);
      moveToward(r, t.x, t.y, M6_RESTOCK_SPEED, dt, map);
      return;
    }
  }

  // No clear line to you (walls between): thread the maze at a run to close in.
  if (!map.hasLineOfSight(r.x, r.y, player.x, player.y)) {
    pursueMaze(r, dt, player.x, player.y, map, M6_CHASE_SPEED);
    return;
  }
  // #159 — the carrier. Its whole policy is to be somewhere else and to send
  // something else. It withdraws at a walk, and when you HURT it, it prints a
  // wave of T-1w swarm robots at you — bigger every time, as its hull goes.
  // Corner it and it shoves you off, weakly. The fight is the swarm.
  if (r.carrier) {
    updateCarrier(r, dt, player, map, robots, ease);
    return;
  }
  let pack = 0;
  for (const o of robots) {
    if (o.type === 'm6' && o.aggro && !o.dead && Math.hypot(o.x - player.x, o.y - player.y) < M6_PACK_RADIUS) pack++;
  }
  if (pack >= M6_PACK_MIN) {
    r.m6PhaseT = (r.m6PhaseT ?? 0) - dt;
    if (r.m6PhaseT <= 0) {
      if (r.m6Phase === 'attack') { r.m6Phase = 'withdraw'; r.m6PhaseT = M6_WITHDRAW_TIME + r.rng() * 1.5; }
      else { r.m6Phase = 'attack'; r.m6PhaseT = M6_ATTACK_TIME + r.rng() * 2; }
    }
  } else {
    // A LONE M6 USED TO WAIT FOREVER. `withdraw` holds it at M6_WITHDRAW_RANGE
    // (6 tiles) and its only weapon is a blow at 0.65, so a guard with no pack
    // orbited at a distance it could never attack from, for as long as you
    // stayed on the island — which read as a machine copying your movements
    // rather than hunting you (Hedda, 2026-08-15). It waits, and then it comes
    // anyway: alone it is cautious, not inert.
    r.m6LoneT = (r.m6LoneT ?? 0) + dt;
    if (r.m6LoneT > M6_LONE_PATIENCE) {
      r.m6PhaseT = (r.m6PhaseT ?? 0) - dt;
      if (r.m6PhaseT <= 0) {
        if (r.m6Phase === 'attack') { r.m6Phase = 'withdraw'; r.m6PhaseT = M6_WITHDRAW_TIME * 1.6 + r.rng() * 2; }
        else { r.m6Phase = 'attack'; r.m6PhaseT = M6_ATTACK_TIME * 0.7 + r.rng() * 1.5; }
      }
    } else {
      r.m6Phase = 'withdraw'; // hang back at the edge while it hopes for a pack
    }
  }
  if (pack >= M6_PACK_MIN) r.m6LoneT = 0;

  // IT CLOSES ON A PLACE, NOT ON A PERSON. The standoff point used to be an
  // offset from the player's LIVE position recomputed every frame, with the
  // orbit crawling at 0.12 rad/s — so the machine held a fixed vector off you
  // and traced your exact path, step for step. It steers at where it last SAW
  // you (`seenX`/`seenY`, which the dispatch above already keeps), so breaking
  // line of sight leaves it going to a place you have left, and the orbit is
  // quick enough to read as circling rather than as following.
  // THE ORBIT HAS A DIRECTION, and it keeps it. See the give-up clause below:
  // reversing is how it gets round a tree, so that has to be a decision which
  // sticks rather than a value redrawn from a random each time.
  if (r.m6OrbitDir === undefined) r.m6OrbitDir = r.rng() < 0.5 ? -1 : 1;
  // AND A PLACE ON IT. `r.swarmAngle ?? 0` meant every guard that was never
  // given an angle started at zero and advanced at the same rate, so a pack
  // held one point on the ring and stood inside each other for the whole
  // fight (David, 2026-08-17: "M6's now go ontop of each other"). The T-1
  // swarm has always dealt its members around the circle; the guards never
  // got it. Seeded once, from the machine's own generator, so it survives a
  // save and two guards do not agree.
  if (r.swarmAngle === undefined) r.swarmAngle = r.rng() * Math.PI * 2;
  if (r.m6Spin === undefined) r.m6Spin = M6_ORBIT_SPIN * (0.8 + r.rng() * 0.45);
  r.m6CommitT = Math.max(0, (r.m6CommitT ?? 0) - dt);
  r.swarmAngle += (r.swarmSpin ?? r.m6Spin) * r.m6OrbitDir * dt;
  // Boxed in (set below): stop holding a ring and press, which is the wanted
  // behaviour anyway. A guard that cannot circle you should close.
  const standoff = r.m6Boxed ? M6_BOXED_STANDOFF
    : r.m6Phase === 'attack' ? M6_ATTACK_STANDOFF : M6_WITHDRAW_RANGE;
  const aimX = r.seenX ?? player.x, aimY = r.seenY ?? player.y;
  const near = avoidGuards(r, robots, 0, 0);
  if (near.spread) r.swarmAngle += Math.sign(near.spread) * M6_RING_SHOVE * dt;
  const wantX = aimX + Math.cos(r.swarmAngle) * standoff;
  const wantY = aimY + Math.sin(r.swarmAngle) * standoff;
  // AND IT ROUTES. This branch was a bare moveToward with no progress
  // bookkeeping, so a guard pressed into the grove's ring of trees stayed there
  // (Hedda: "keeps trying to escape through calypso's wall of trees but it
  // cant"). The T-1 has had the give-up clause for months; the M-class never
  // got it. Same rule, same constants.
  // KEEP OUT OF EACH OTHER. The global separation pass shoves two machines
  // apart only once they are already inside 0.62 tiles, which is well past the
  // point where they read as one object. Steering the target is what stops
  // them arriving there, and easing the throttle is what stops two closing
  // head-on from covering the gap inside a single frame anyway.
  const clearX = wantX + (near.x), clearY = wantY + (near.y);
  const speed = M6_CHASE_SPEED * (1 - 0.55 * near.crowd);
  const expect = Math.min(speed * dt, Math.hypot(clearX - r.x, clearY - r.y));
  const tgt = chaseTarget(r, clearX, clearY, map);
  const went = moveToward(r, tgt.x, tgt.y, speed, dt, map);
  if (went < expect * PROGRESS_FRACTION) r.noProgressT += dt;
  else r.noProgressT = 0;
  r.stuck = r.noProgressT > STUCK_AFTER;
  if (r.noProgressT > M6_GIVE_UP && r.m6CommitT <= 0) {
    // PINNED, WHICH IN PRACTICE MEANS A TREE. This used to add a random half to
    // full turn to the orbit angle, which throws the standoff point across to
    // the far side of you. Wedged again on the way there it threw again, and
    // the two throws were independent, so it could come straight back.
    //
    // Reverse the way round instead, once, and commit to it: back the way it
    // came is a route it has just proved is open, and the commit window stops
    // the decision being retaken while it is still carrying it out.
    r.m6OrbitDir = -r.m6OrbitDir;
    r.m6CommitT = M6_ORBIT_COMMIT;
    r.m6Blocked = (r.m6Blocked ?? 0) + 1;
    r.noProgressT = 0;
    r.stuck = false;
    // Reversing did not free it either: trees both ways, or a wall it is trying
    // to hold a ring against. Close on the player rather than shuffle.
    if (r.m6Blocked >= 2) { r.m6Boxed = true; r.m6BoxedT = M6_BOXED_TIME; }
  }
  // The box clears itself and takes the count with it, so the next obstacle
  // gets the cheap fix first rather than going straight to a charge.
  if (r.m6Boxed) {
    r.m6BoxedT -= dt;
    if (r.m6BoxedT <= 0 || realDist(r, player) < M6_HIT_RANGE) {
      r.m6Boxed = false; r.m6Blocked = 0;
    }
  } else if (r.noProgressT === 0) {
    r.m6Blocked = 0;
  }

  // No `jackedIn` check here, unlike the W1 swarm above, and deliberately: the
  // daemon's household guard is not fooled by a credential on POSEIDON's
  // network. The gate and core terminals stand inside their reach.
  const realD = Math.hypot(player.x - r.x, player.y - r.y);
  if (r.m6Phase === 'attack' && realD < M6_HIT_RANGE + reachBonus(player, map) && r.attackTimer <= 0) {
    r.attackTimer = M6_HIT_COOLDOWN;
    // One of yours in the way wears it, as with every other blow.
    const inTheWay = escortInTheWay(r, M6_HIT_RANGE + reachBonus(player, map));
    if (inTheWay) { damageRobot(inTheWay, M6_HIT_DAMAGE, map); inTheWay._lastHitBy = 'machine'; }
    else guardHit(player, M6_HIT_DAMAGE * ease, 'machine');
    return;
  }
  // THE RIFLE. Out of reach but in sight, it shoots — which is what the class
  // is. Held to the ATTACK phase so it is still a pack animal with a rhythm
  // rather than a turret, and it needs a line, so cover works against it.
  // THE GRENADE, before the rifle: it is the rarer move and the one that should
  // win the tick when both are ready. Thrown to where it last saw you, so
  // stepping off that ground is the answer to it.
  // Lazily stocked rather than set at spawn, so a machine restored from a save
  // written before the M-6 was armed still has its magazine.
  if (r.bombs === undefined) r.bombs = M6_BOMBS;
  r.m6BombT = Math.max(0, (r.m6BombT ?? M6_BOMB_EVERY) - dt);
  if (r.m6Phase === 'attack' && r.bombs > 0 && r.m6BombT <= 0 && r.attackTimer <= 0
    && realD < M6_BOMB_RANGE && realD > M6_HIT_RANGE * 2
    && map.hasLineOfSight(r.x, r.y, player.x, player.y)) {
    r.m6BombT = M6_BOMB_EVERY;
    r.attackTimer = M6_FIRE_COOLDOWN;
    r.bombs -= 1;
    (map.bombs ??= []).push({
      x: r.seenX ?? player.x, y: r.seenY ?? player.y,
      fuse: M6_BOMB_FUSE, radius: M6_BOMB_RADIUS, damage: M6_BOMB_DAMAGE, thrown: true,
    });
    sfx.play('keydrop');
    if (player.say) player.say('The guard lobs something underarm. It lands and starts ticking.');
    return;
  }
  if (r.m6Phase === 'attack' && r.attackTimer <= 0
    && realD < M6_FIRE_RANGE && realD > M6_HIT_RANGE
    && map.hasLineOfSight(r.x, r.y, player.x, player.y)) {
    r.attackTimer = M6_FIRE_COOLDOWN;
    const guard = escortInTheWay(r, M6_FIRE_RANGE);
    const tx = guard ? guard.x : player.x, ty = guard ? guard.y : player.y;
    (map.projectiles ??= []).push({ x0: r.x, y0: r.y, x1: tx, y1: ty, prog: 0, kind: 'laser_m5' });
    sfx.play('laser');
    if (guard) { damageRobot(guard, M6_FIRE_DAMAGE, map); guard._lastHitBy = 'machine'; }
    else {
      const block = player.blockRangedShot ? player.blockRangedShot(r.x, r.y) : null;
      if (block === 'reflect') {
        r.hp -= 999; r.hurt = true; r._lastHitBy = 'reflect';
        map.projectiles.push({ x0: player.x, y0: player.y, x1: r.x, y1: r.y, prog: 0, kind: 'laser_m5' });
      } else if (!block) {
        guardHit(player, M6_FIRE_DAMAGE * ease, 'machine');
      }
    }
  }
}

// ---- Friendly (reprogrammed) ----------------------------------------------

// A reprogrammed machine serves the player: never attacks, never aggros,
// never goes home to the obelisk. It heels at a respectful distance; a T2
// also fells nearby trees for wood. It runs on the same battery, drained
// slowly by its lighter duties, and goes flat at zero until re-batteried.
function updateFriendly(r, dt, player, map) {
  r.aggro = false;
  r.stuck = false;
  r.returning = false;
  r.recharging = false;

  drainBattery(r, DRAIN_FRIENDLY, dt);
  if (r.drained) return; // friendly stays true; only the battery is gone

  // T2 work: any tree within noticing distance takes priority over heeling.
  if (r.type === 't2') {
    if (r.workTarget && map.objectAt(r.workTarget.x, r.workTarget.y) !== r.workTarget) {
      r.workTarget = null; // someone else felled it
    }
    if (!r.workTarget) {
      r.workScanT -= dt;
      if (r.workScanT <= 0) {
        r.workScanT = WORK_SCAN_EVERY;
        r.workTarget = nearestTree(r, map);
        r.chopPulseT = 0;
      }
    }
    if (r.workTarget) {
      workTree(r, dt, map);
      return;
    }
  }

  // Heel: keep FOLLOW_MIN..FOLLOW_MAX tiles behind the player. The T1 still
  // cannot climb, so it may lag or get blocked; that is its lot in life.
  const d = distTo(r, player);
  if (d > FOLLOW_MAX) r.following = true;
  else if (d <= FOLLOW_MIN) r.following = false;
  if (r.following) {
    const speed = r.type === 't1' ? FOLLOW_SPEED_T1 : FOLLOW_SPEED_T2;
    moveToward(r, player.x, player.y, speed, dt, map);
  }
}

// Nearest standing tree within working distance of the robot, or null.
function nearestTree(r, map) {
  let best = null, bestD = WORK_RANGE;
  for (const obj of map.objects) {
    if (obj.type !== 'tree') continue;
    const d = Math.hypot(obj.x + 0.5 - r.x, obj.y + 0.5 - r.y);
    if (d <= bestD) {
      best = obj;
      bestD = d;
    }
  }
  return best;
}

// Walk to the tree and chop steadily, same bookkeeping as the player's
// felling code: hp counts down, the trunk shudders, and the felled tree is
// replaced by dropped wood.
function workTree(r, dt, map) {
  const tree = r.workTarget;
  const tx = tree.x + 0.5, ty = tree.y + 0.5;
  if (Math.hypot(tx - r.x, ty - r.y) > CHOP_RANGE) {
    moveToward(r, tx, ty, WORK_SPEED, dt, map);
    return;
  }

  tree.hp = (tree.hp ?? TREE_HP_DEFAULT) - CHOP_RATE * dt;
  r.chopPulseT -= dt;
  if (r.chopPulseT <= 0) {
    r.chopPulseT = CHOP_SHAKE_EVERY;
    tree.shake = 0.3;
    map.shaking.add(tree);
  }

  if (tree.hp <= 0) {
    map.removeObject(tree);
    map.groundItems.push({ item: 'wood', qty: WOOD_PER_TREE, x: tree.x + 0.5, y: tree.y + 0.5 });
    r.workTarget = null;
    r.workScanT = 0; // look for the next job at once
  }
}

// ---- Drawing --------------------------------------------------------------

// Placeholder art in code, matching the renderer's style: shadow ellipse at
// the feet, simple shapes at tile scale. worldToScreen is the projection
// function from engine/iso.js, passed in so this module stays engine-free.
// All animation derives from the robot's own animT phase: no Date.now or
// Math.random anywhere in the draw path.

// Local copy of the renderer's hex shader so this module stays engine-free.
function shadeHex(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) * (1 + amount)));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) * (1 + amount)));
  const b = Math.max(0, Math.min(255, (n & 255) * (1 + amount)));
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

// Sensor light for the current state, or null for a fused wreck (no light
// at all). Hostile red as before, green in service, dark socket when flat,
// a flickering dim amber while stunned.
function sensorStyle(r) {
  if (r.fused) return null;
  if (r.drained) return { fill: EYE_SOCKET, halo: null };
  if ((r.disabledT || 0) > 0) {
    const t = r.animT || 0;
    const gate = Math.max(0, Math.sin(t * 11) * (0.4 + 0.6 * Math.sin(t * 4.3)));
    const a = 0.25 + 0.35 * gate;
    // `stunColor` overrides the amber: CALYPSO's interventions flicker in her own
    // indigo (nokia.js), so her hand on POSEIDON's machine reads as hers.
    const c = r.stunColor || `rgb(${STUN_AMBER[0]},${STUN_AMBER[1]},${STUN_AMBER[2]})`;
    const rgb = c.startsWith('#')
      ? [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
      : c.replace(/rgba?\(|\)/g, '').split(',').slice(0, 3).map(Number);
    return { fill: `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a.toFixed(3)})`, halo: null };
  }
  // Singing (AI-ML sing): the red light pulses in time with the choir. Each
  // machine is on a different vocal part (r.choirFlash, set in main from the
  // music), so the row of lights blinks out of step — a choir, not a metronome.
  if (r.singing) {
    const f = r.choirFlash || 0;
    const g = Math.round(18 + 62 * f), b = Math.round(14 + 46 * f);
    return { fill: `rgb(255,${g},${b})`, halo: f > 0.25 ? `rgba(255,70,50,${(0.18 + 0.42 * f).toFixed(3)})` : null };
  }
  // A lamp the machine's own program set (`eye` / `flash`).
  //
  // THIS NOW BEATS `friendly`. It used to sit below it, so the moment you
  // reprogrammed a unit to follow or defend you it turned green and whatever
  // `eye "white"` you had written was silently ignored — the verb worked, the
  // colour never appeared (David, 2026-08-15: "I used to be able to change the
  // colour of the eye... can we put it back as an option").
  //
  // The cases still ABOVE it are the ones that belong there: drained, stunned
  // and singing are things done TO a machine, and a flat unit must not be able
  // to claim it is fine. Being yours is a status, not a physical override, so a
  // machine you own shows the colour you told it to show. Say nothing and it
  // still goes green, which is the old default.
  //
  // Flashing gates the lamp off for part of each cycle rather than dimming it,
  // because that is what a relay driving an LED actually does.
  if (r.lamp) {
    const hex = LAMP_HEX[r.lamp];
    const hz = r.lampFlash || 0;
    const on = hz > 0 ? (Math.sin((r.animT || 0) * hz * Math.PI * 2) > 0) : true;
    if (!hex || !on) return { fill: EYE_SOCKET, halo: null };
    return { fill: hex, halo: `${hex}55` };
  }
  if (r.friendly) return { fill: EYE_FRIEND, halo: EYE_FRIEND_HALO };
  return { fill: r.aggro ? EYE_HOT : EYE_DIM, halo: r.aggro ? 'rgba(255,59,42,0.3)' : null };
}

// T3's own sensor tell: every special case (drained, stunned, singing,
// friendly) stays identical to every other machine, but the plain aggro/idle
// fallback is orange instead of red, so its threat reads as distinct from a
// T1/T2/W1/W4 at a glance.
function t3SensorStyle(r) {
  const s = sensorStyle(r);
  if (!s) return s;
  if (s.fill === EYE_HOT) return { fill: T3_EYE_HOT, halo: 'rgba(255,138,30,0.32)' };
  if (s.fill === EYE_DIM) return { fill: T3_EYE_DIM, halo: null };
  return s;
}

// WHO IS THIS. The body plate carries the class ('T1') and nothing else, which
// is all a machine needs to know about itself and no use at all to somebody
// holding one unit's address and looking at four of them. The sniffer sets a
// tagger here; when it is set, each unit wears the name the network knows it by.
let unitTagger = null;
export function setUnitTagger(fn) { unitTagger = fn; }

// The tags are also targets. A name is an address, and an address you can see
// but not follow is a worse tool than one you can. The rects are collected as
// they are drawn and read back by the click handler on the next frame.
let tagRects = [];
let tagClickable = false;
export function setUnitTagsClickable(on) { tagClickable = !!on; }
export function beginUnitTags() { tagRects = []; }

// EYES IN THE DARK (David, 2026-08-17: "would be good if robots eyes glow a bit
// in the dark - so we can see them in the night... scary").
//
// The sensor is the one part of a machine that is a light rather than a
// surface, so it is the one part the night does not take. Set once a frame from
// the renderer's ambient level; at noon it is zero and nothing here draws.
//
// It is a fair warning as well as a fright: a hunter you cannot see is the game
// cheating, and before this the only thing that gave a machine away at night
// was walking into it.
let robotNight = 0;
export function setRobotNight(v) { robotNight = Math.max(0, Math.min(1, v || 0)); }

/** `rgb(...)`, `rgba(...)` or `#rrggbb` to a triple, for the glow behind it. */
function eyeRGB(col) {
  if (!col) return null;
  if (col[0] === '#') return [parseInt(col.slice(1, 3), 16), parseInt(col.slice(3, 5), 16), parseInt(col.slice(5, 7), 16)];
  const m = col.match(/-?\d+(\.\d+)?/g);
  return m && m.length >= 3 ? [Number(m[0]), Number(m[1]), Number(m[2])] : null;
}

/**
 * The glow around a machine's sensor at night, drawn over the finished sprite.
 *
 * Where the eyes ARE is per chassis, because the sprites are hand-drawn and
 * there is no rig to ask: the T-1's single eye rides ahead of the hull in the
 * direction it is facing, the T-3 has the twin emitters it shoots from, the
 * B-1 wears a visor across a helm half again the size of anything else, and
 * everything else in the T-2 family has one horizontal visor on a small head.
 *
 * A wreck's eye is out, which is the whole reason a wreck reads as a wreck.
 */
function drawEyeGlow(ctx, r, c, worldToScreen) {
  if (robotNight <= 0.06 || r.fused) return;
  const s = r.type === 't3' ? t3SensorStyle(r) : sensorStyle(r);
  const rgb = s && eyeRGB(s.fill);
  if (!rgb) return;
  // A drained machine's socket is dark grey; it should stay dark rather than
  // glowing grey at you.
  if (r.drained) return;
  const spots = [];
  if (isWheeled(r) && r.type !== 't3' && worldToScreen) {
    const f = worldToScreen(r.x + r.facing.x * 0.3, r.y + r.facing.y * 0.3);
    spots.push([f.x, f.y - 9, 1]);
  } else if (r.type === 't3') {
    spots.push([c.x - 2.4, c.y - 34.5, 0.8], [c.x + 2.4, c.y - 34.5, 0.8]);
  } else if (r.type === 'b1') {
    spots.push([c.x, c.y - 33, 1.5]);
  } else {
    spots.push([c.x, c.y - 30, 0.9]);
  }
  const [rr, gg, bb] = rgb;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [x, y, k] of spots) {
    const R = 13 * k * (0.55 + 0.45 * robotNight);
    const g = ctx.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, `rgba(${rr},${gg},${bb},${(0.5 * robotNight).toFixed(3)})`);
    g.addColorStop(0.4, `rgba(${rr},${gg},${bb},${(0.18 * robotNight).toFixed(3)})`);
    g.addColorStop(1, `rgba(${rr},${gg},${bb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    // A hard core, so it is a point of light and not only a smudge.
    ctx.fillStyle = `rgba(255,255,255,${(0.3 * robotNight).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(x, y, 0.9 * k, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
export function unitTagAt(sx, sy) {
  if (!tagClickable) return null;
  for (const t of tagRects) {
    if (sx >= t.x && sx <= t.x + t.w && sy >= t.y && sy <= t.y + t.h) return t.r;
  }
  return null;
}

function drawUnitTag(ctx, r, c) {
  if (!unitTagger) return;
  // A tagger may answer a plain string, or {text, small} when the label is a
  // full net name rather than a nickname — `OB_A45C.T2_04` is twice the width
  // of «scout» and would sit over the machine like a placard at the same size.
  const got = unitTagger(r);
  if (!got) return;
  const tag = typeof got === 'string' ? got : got.text;
  const small = typeof got === 'object' && !!got.small;
  if (!tag) return;
  ctx.save();
  ctx.font = `bold ${small ? 5 : 7}px ui-monospace, monospace`;
  ctx.textAlign = 'center';
  const w = ctx.measureText(tag).width + (small ? 4 : 6);
  // Ride just over the head. The T1 is a low tank, so its head sits well below a
  // standing chassis' — a shorter lift keeps its label close instead of floating.
  const lift = isWheeled(r) ? 31 : 48;
  const bh = small ? 9 : 12;
  const x = c.x - w / 2, y = c.y - lift;   // under the health bar band, over the head
  ctx.fillStyle = 'rgba(10,24,32,0.78)';
  ctx.fillRect(x, y, w, bh);
  ctx.strokeStyle = 'rgba(90,190,235,0.7)'; ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, bh);
  ctx.fillStyle = tagClickable ? '#7fd0ff' : '#9fe4ff';
  ctx.fillText(tag, c.x, y + (small ? 6.5 : 9));
  // Underlined when it will actually go somewhere, which is the 1995 way of
  // saying so and needs no explaining to anyone who used a browser then.
  if (tagClickable) {
    ctx.strokeStyle = '#7fd0ff';
    ctx.beginPath(); ctx.moveTo(x + 4, y + bh - 1.5); ctx.lineTo(x + w - 4, y + bh - 1.5); ctx.stroke();
  }
  ctx.textAlign = 'left';
  // Record where the box ACTUALLY landed on screen, not where it was asked to
  // go. Everything here is drawn through the camera's transform (pan, zoom, the
  // per-entity elevation lift, the device pixel ratio), so the numbers handed to
  // fillRect are several transforms away from the numbers a mouse event carries.
  // Push them through the live matrix and back down to CSS pixels, which is the
  // space input.mousePos() speaks.
  const m = ctx.getTransform();
  const dpr = (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1;
  const a = m.transformPoint(new DOMPoint(x, y));
  const b = m.transformPoint(new DOMPoint(x + w, y + 12));
  ctx.restore();
  tagRects.push({
    r,
    x: Math.min(a.x, b.x) / dpr, y: Math.min(a.y, b.y) / dpr,
    w: Math.abs(b.x - a.x) / dpr, h: Math.abs(b.y - a.y) / dpr,
  });
}

// Body plate colour for the current state.
function bodyTone(base, r) {
  if (r.fused) return FUSED_BODY;
  if (r.drained) return shadeHex(base, DRAINED_TONE);
  if (r.friendly) return shadeHex(base, FRIENDLY_TONE);
  return base;
}

// Designation painted on the body plate, always visible. Coordinates are in
// the current (possibly translated/rotated) space.
function drawDesignation(ctx, r, x, y) {
  ctx.font = 'bold 7px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#b8bcc2'; // light grey, softer than stark white
  // `designation` overrides the type for a unit that is a variant rather than a
  // class of its own — the siren tower's own repair unit runs a W3's program
  // and wears T1a, because that is what it is.
  ctx.fillText(r.designation || r.type.toUpperCase(), x, y);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// Two-to-three tiny grey puffs drifting up from a fused wreck, phased off
// animT so each rises, fades, and loops.
function drawSmoke(ctx, x, y, animT) {
  for (let i = 0; i < 3; i++) {
    const p = (animT * 0.45 + i * 0.33) % 1;
    const a = 0.3 * (1 - p);
    ctx.fillStyle = `${SMOKE_GREY}${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x + Math.sin((animT + i * 2.1) * 1.7) * 2, y - p * 16, 1.6 + p * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Tiny dark-red empty-battery marker above a drained machine.
function drawBatteryIcon(ctx, x, y) {
  ctx.strokeStyle = BATT_RED;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 4.5, y - 2.5, 9, 5); // empty cell
  ctx.fillStyle = BATT_RED;
  ctx.fillRect(x + 4.5, y - 1, 1.5, 2);   // terminal nub
}

export function drawRobot(ctx, robot, worldToScreen) {
  if (robot.dead) return;
  // Factory materialisation: flicker in from nothing over FACTORY_SPAWN_T.
  let flickered = false;
  if (robot.spawnT > 0) {
    const base = 1 - robot.spawnT / FACTORY_SPAWN_T;          // 0 -> 1 fade-in
    const buzz = 0.55 + 0.45 * Math.abs(Math.sin(performance.now() / 45));
    ctx.save();
    ctx.globalAlpha = Math.max(0.08, Math.min(1, base * buzz));
    flickered = true;
  }
  const c = worldToScreen(robot.x, robot.y);
  if (robot.zombie) {
    // A sickly green halo: the tell that only a bow or the wave gun works.
    ctx.fillStyle = 'rgba(120,255,90,0.28)';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y - 14, 16, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Ubik confusion: rooted to the spot, jumping straight up and down — a
  // clean vertical bounce (|sin| so it always springs up from the ground,
  // never sinks below it) with only a hair of horizontal jitter, reads as a
  // machine gone haywire on its own axis rather than drifting or spinning.
  const jc = robot.ubikConfusedT > 0
    ? { x: c.x + (Math.random() - 0.5) * 1.5, y: c.y - Math.abs(Math.sin((robot._confuseHopT || 0) * 9)) * 7 }
    : c;
  if (isWheeled(robot)) drawT1(ctx, robot, jc, worldToScreen);
  else if (robot.type === 'b1') drawB1(ctx, robot, jc);
  else if (robot.type === 't3') drawT3(ctx, robot, jc);
  else drawT2(ctx, robot, jc);
  drawEyeGlow(ctx, robot, jc, worldToScreen);
  if (robot.ubikConfusedT > 0) {
    // Tell: violet dizzy dots circling the head, PKD's reality-static
    // rather than the boars' plain grey — same idea, different cause.
    ctx.fillStyle = 'rgba(210,150,255,0.9)';
    for (let i = 0; i < 3; i++) {
      const ang = performance.now() / 130 + (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(c.x + Math.cos(ang) * 9, c.y - 38 + Math.sin(ang) * 3, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  drawUnitTag(ctx, robot, c);
  if (flickered) ctx.restore();
}

function drawT1(ctx, r, c, worldToScreen) {
  // Sensor eye sits towards the direction of travel, like the dog's head.
  const f = worldToScreen(r.x + r.facing.x * 0.3, r.y + r.facing.y * 0.3);

  if (!r.noShadow) { // gate uses a separately-drawn, planted shadow while bobbing
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(c.x, c.y);
  // Tells: a burnt-out wreck slumps hard; a trapped machine lists to one
  // side, wheels spinning uselessly. (A Ubik-confused one no longer spins —
  // it bounces on the spot, handled by the hop offset in drawRobot.)
  if (r.fused) ctx.rotate(0.2);
  else if (r.stuck) ctx.rotate(0.12);

  ctx.fillStyle = r.fused ? FUSED_EDGE : T1_WHEEL; // two dark wheels under the chassis
  ctx.beginPath();
  ctx.arc(-6, -3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(6, -3, 4, 0, Math.PI * 2);
  ctx.fill();

  const swarm = r.designation === 'T1w';
  ctx.fillStyle = bodyTone(swarm ? T1W_BODY : T1_BODY, r); // low gunmetal wedge, nose down
  ctx.beginPath();
  ctx.moveTo(-10, -5);
  ctx.lineTo(10, -5);
  ctx.lineTo(6, -14);
  ctx.lineTo(-10, -11);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = r.fused ? FUSED_EDGE : (swarm ? T1W_BODY_EDGE : T1_BODY_EDGE);
  ctx.lineWidth = 1;
  ctx.stroke();

  drawDesignation(ctx, r, -1, -9); // 'T1' on the wedge plate

  ctx.restore();

  // Single sensor eye ahead of the body; colour and glow track the state.
  const s = sensorStyle(r);
  if (s) {
    if (s.halo) {
      ctx.fillStyle = s.halo;
      ctx.beginPath();
      ctx.arc(f.x, f.y - 9, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = s.fill;
    ctx.beginPath();
    ctx.arc(f.x, f.y - 9, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  if (r.fused) drawSmoke(ctx, c.x, c.y - 14, r.animT || 0);
  if (r.drained && !r.fused) drawBatteryIcon(ctx, c.x, c.y - 22);

  if (r.stuck && !r.fused && !r.drained) {
    // Tell: baffled grey '!?' above a machine that cannot get to you.
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(190,190,190,0.9)';
    ctx.fillText('!?', c.x, c.y - 22);
    ctx.textAlign = 'left';
  }
}

function drawT2(ctx, r, c) {
  if (!r.noShadow) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(c.x, c.y);
  // #149 revised: the T-8 no longer bobs. It kept time on `_t8Beat` with a
  // per-unit phase, and four machines nodding on the floor read as a glitch
  // rather than as a scene (David, 2026-08-14). It stands still now, which is
  // what an usher at a post does, and the only thing that moves it is walking.
  if (r.fused) ctx.rotate(0.14); // slumped wreck (a Ubik-confused one bounces, not spins — see drawRobot)

  // Gait: legs scissor with the walk phase, same scheme as the player.
  // A wreck's legs hang straight.
  const swing = r.fused ? 0 : Math.sin(r.walkPhase) * 3;
  ctx.fillStyle = r.fused ? FUSED_EDGE : T2_LIMB;
  ctx.fillRect(-4 + swing, -10, 3, 10);
  ctx.fillRect(1 - swing, -10, 3, 10);

  const bodyBase = r.type === 'w1' ? W1_BODY : r.type === 'w3' ? W3_BODY : r.type === 'w4' ? W4_BODY : r.type === 'w5' ? W5_BODY : r.type === 't8' ? T8_BODY : r.type === 'v1' ? (r.gardener ? V5_BODY : V1_BODY) : r.type === 'm6' ? M6_BODY : r.type === 'm5' ? M5_BODY : r.type === 'm4' ? M4_BODY : T2_BODY;
  const headBase = r.type === 'w1' ? W1_HEAD : r.type === 'w3' ? W3_HEAD : r.type === 'w4' ? W4_HEAD : r.type === 'w5' ? W5_HEAD : r.type === 't8' ? T8_HEAD : r.type === 'v1' ? (r.gardener ? V5_HEAD : V1_HEAD) : r.type === 'm6' ? M6_HEAD : r.type === 'm5' ? M5_HEAD : r.type === 'm4' ? M4_HEAD : T2_HEAD;
  ctx.fillStyle = bodyTone(bodyBase, r); // blocky torso, roughly player height overall
  ctx.fillRect(-6, -25, 12, 16);
  if (!r.fused) {
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; // dull sheen along the shoulders
    ctx.fillRect(-6, -25, 12, 2);
  }
  // A V-1's cell cradle, slung LOW on the chest — under the designation badge,
  // which sits mid-torso. A laden courier still has to read as a V-1.
  if (r.type === 'v1' && !r.fused) {
    ctx.fillStyle = '#0d1620';
    ctx.fillRect(-5, -13, 10, 4);
    if (r.cargo) {
      ctx.fillStyle = V1_CELL;
      ctx.fillRect(-4, -12, 8, 2);
      ctx.fillStyle = 'rgba(127,224,176,0.22)';   // the charge, bleeding past the socket
      ctx.fillRect(-6, -14, 12, 6);
    }
  }

  ctx.fillStyle = r.fused ? FUSED_DARK : headBase; // small head
  ctx.fillRect(-4, -33, 8, 7);

  // Horizontal visor; colour and glow track the state.
  const s = sensorStyle(r);
  if (s) {
    if (s.halo) {
      ctx.fillStyle = s.halo;
      ctx.fillRect(-5.5, -32, 11, 4);
    }
    ctx.fillStyle = s.fill;
    ctx.fillRect(-3.5, -31, 7, 2);
  }

  drawDesignation(ctx, r, 0, -17); // 'T2' on the torso plate

  ctx.restore();

  if (r.fused) drawSmoke(ctx, c.x, c.y - 34, r.animT || 0);
  if (r.drained && !r.fused) drawBatteryIcon(ctx, c.x, c.y - 40);
}

// #159 — THE B-1 CARRIER, drawn as Agamemnon arming (Iliad XI): greaves with
// clasps, a corslet worked in bands, a great round shield, and a crested helm.
// Black and gold, half again the size of anything else on the island, and the
// only machine in the game with a crest — so it reads as singular from across a
// field, before any label resolves.
//
// Everything that moves on it is state a player can act on: the crest lifts when
// it is about to print a wave, the shard on its back burns brighter the more of
// its hull is gone, and the shield comes across the body when you are close.
/**
 * The device at the centre of a king's shield: a regular polygon standing for
 * one of the Platonic solids. `n` of 0 falls back to the old round stud, so a
 * machine with no king still draws something.
 */
function bossShape(ctx, n, rad) {
  if (!n) { ctx.beginPath(); ctx.arc(0, 0, rad * 0.8, 0, Math.PI * 2); ctx.fill(); return; }
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    // Point-up, which is how a device is stamped and how a triangle reads.
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    // The octahedron is drawn as a star rather than an octagon: eight points
    // read as a solid seen corner-on, where an octagon just reads as a circle.
    const rr = (n === 8 && i % 2) ? rad * 0.45 : rad;
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawB1(ctx, r, c) {
  const t = r.animT || 0;
  const hpFrac = r.maxHp ? Math.max(0, Math.min(1, r.hp / r.maxHp)) : 1;
  const calling = (r.calling || 0) > 0;
  // #181 — COMING APART. `dying` counts down from CARRIER_DEATH; `gone` runs
  // 0 (the last blow) to 1 (the fall). Everything below reads it: the machine
  // shudders harder as it goes, the device at the centre of the shield loses
  // its light, and the ports it printed from vent in a ragged sequence rather
  // than all at once. Drawn here rather than as a particle burst because the
  // thing coming apart should be the MACHINE, not a puff over the top of it.
  const gone = r.dying !== undefined
    ? Math.max(0, Math.min(1, 1 - r.dying / CARRIER_DEATH)) : 0;
  if (gone > 0) {
    ctx.save();
    // The shudder, on the WHOLE sprite: fast, small, and worse as it goes. It
    // is a translate on the outer context rather than an offset added to every
    // coordinate below, so the shield, the shard and the swarm-ring shake with
    // the machine instead of sliding about on top of it.
    const q = gone * gone;
    ctx.translate(Math.sin(t * 47) * 2.2 * q, Math.sin(t * 39 + 1.1) * 1.6 * q);
  }
  const guard = r.engageT > 0;
  // SPOOLING: the two seconds before a wave comes out, and the only time the
  // hull is properly worth hitting. It has to be unmistakable from across the
  // clearing — a player who cannot see it is being asked to guess.
  const spool = Math.max(0, Math.min(1, 1 - (r.spoolT || 0) / 2));   // 0 -> 1 as it opens
  const spooling = (r.spoolT || 0) > 0;
  const sealRing = (r.sealFlash || 0) > 0;

  // A wide planted shadow — the first tell that this one is heavier.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, 19, 7.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // THE WAVE FLARE: a gold ring going out from it as the swarm prints. Drawn
  // under the body so the machine stays the solid thing in the middle of it.
  if (calling) {
    const k = 1 - (r.calling / 1.2);
    ctx.strokeStyle = `rgba(242,198,94,${0.6 * (1 - k)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y - 4, 16 + k * 38, 7 + k * 17, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  // THE PRINT TELL. A ring closing IN on it (the opposite of the wave flare
  // going out), the ports along its flank coming up white-hot, and the whole
  // machine held in a rising glow. Closing rather than expanding, because this
  // is it gathering to print rather than the wave leaving.
  if (spooling) {
    const k = spool;                     // 0 at the start of the spool, 1 at the print
    ctx.strokeStyle = `rgba(255,244,214,${0.25 + 0.55 * k})`;
    ctx.lineWidth = 1 + 2 * k;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y - 4, 52 - k * 34, 23 - k * 15, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
    // Heat under the body: it is about to push four machines out of itself.
    const g = ctx.createRadialGradient(c.x, c.y - 6, 2, c.x, c.y - 6, 26 + k * 10);
    g.addColorStop(0, `rgba(255,226,150,${0.30 + 0.35 * k})`);
    g.addColorStop(1, 'rgba(255,200,90,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(c.x, c.y - 6, 26 + k * 10, 15 + k * 6, 0, 0, Math.PI * 2); ctx.fill();
  }
  // A SEALED HULL RINGS. The blow landed and did almost nothing, and the
  // machine says so with a hard pale flash rather than the bar simply refusing
  // to move.
  if (sealRing) {
    const k = (r.sealFlash || 0) / 0.3;
    ctx.strokeStyle = `rgba(200,215,235,${0.75 * k})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y - 8, 20 + (1 - k) * 10, 22 + (1 - k) * 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(B1_SCALE, B1_SCALE);
  if (r.fused) ctx.rotate(0.16);
  // THE STAGGER, then the fall. Cubed, so almost all of it happens in the last
  // half-second: for most of the death the machine is still standing and only
  // shaking, and then the legs go. A linear lean would have it toppling slowly
  // from the first frame, which reads as a hinge rather than a collapse.
  if (gone > 0) ctx.rotate(0.62 * gone * gone * gone);

  const dead = r.fused || r.drained;
  const K = kingOf(r);
  const gold = r.fused ? FUSED_EDGE : (r.metal || K.metal);
  const body = r.fused ? FUSED_DARK : bodyTone(B1_BODY, r);
  // A heavy machine rolls rather than scissors: a slow, wide gait.
  const swing = dead ? 0 : Math.sin(r.walkPhase * 0.7) * 2.4;

  // GREAVES. Thick legs in a wide stance, because the stance is most of what
  // makes a small sprite read as heavy. "Clasps of silver at the ankles" — gold
  // here, the bright band at the foot of each greave.
  ctx.fillStyle = r.fused ? FUSED_EDGE : B1_PLATE;
  ctx.fillRect(-8 + swing, -13, 6, 13);
  ctx.fillRect(2 - swing, -13, 6, 13);
  ctx.fillStyle = gold;
  ctx.fillRect(-8 + swing, -3.4, 6, 1.8);
  ctx.fillRect(2 - swing, -3.4, 6, 1.8);
  ctx.fillStyle = r.metalLo || K.lo;
  ctx.fillRect(-8 + swing, -1.6, 6, 0.8);
  ctx.fillRect(2 - swing, -1.6, 6, 0.8);

  // THE SHARD, on a mast off the right shoulder and canted outward so it stands
  // PROUD of the silhouette rather than hiding behind it. It is the only thing
  // on the machine that is not armour, and it brightens as the hull goes: the
  // closer the carrier is to failing, the more plainly you see what you came for.
  if (!r.fused) {
    const heat = 0.4 + (1 - hpFrac) * 0.6;
    const pulse = 0.82 + Math.sin(t * 3.1) * 0.18;
    ctx.save();
    ctx.translate(12.5, -30);
    ctx.rotate(0.22);
    ctx.fillStyle = `rgba(255,228,154,${0.26 * heat * pulse})`;
    ctx.beginPath(); ctx.ellipse(0, 2, 8, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = r.metalLo || K.lo;                // the housing it rides in
    ctx.fillRect(-3, -5, 6, 15);
    ctx.fillStyle = '#050505';
    ctx.fillRect(-2.2, -4.2, 4.4, 13.4);
    ctx.fillStyle = B1_SHARD_HOT;                     // the shard itself
    ctx.globalAlpha = Math.min(1, heat * pulse + 0.3);
    ctx.fillRect(-1.5, -3.4, 3, 11.8);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // THE CORSLET: a black cuirass worked in bands, broad at the shoulder and
  // tapering, so the chest is the widest thing on it.
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-9.5, -34); ctx.lineTo(9.5, -34);
  ctx.lineTo(7.5, -13); ctx.lineTo(-7.5, -13);
  ctx.closePath(); ctx.fill();
  // OVERHEAT, and it is the GOLD that heats, not the machine. A full-plate
  // colour wash was tried and cut (David, 2026-08-14): repainting the corslet
  // red threw away the black silhouette, which is the whole identity. So the
  // black stays black and the metal already on it — the worked bands, and the
  // vent slits between them — runs up through orange to white as the hull goes.
  // Same information, and the machine still reads as itself while it dies.
  const heat = hpFrac < 0.92 ? Math.min(1, (0.92 - hpFrac) / 0.92) : 0;
  const beat = 0.72 + Math.sin(t * (2.4 + heat * 5)) * 0.28;   // faster as it worsens
  const k = heat * beat;
  const hot = (alpha = 1) => {
    // gold -> orange -> white, along the same ramp the bands and vents share
    const rC = Math.round(201 + 54 * k);
    const gC = Math.round(146 + 109 * Math.min(1, k * 1.25));
    const bC = Math.round(46 + 209 * Math.max(0, k - 0.45) / 0.55);
    return `rgba(${rC},${gC},${bC},${alpha})`;
  };

  if (!r.fused) {
    ctx.fillStyle = B1_EDGE;                          // black on black needs an edge
    ctx.fillRect(-9.5, -34, 19, 1);
    // THE VENTS: three slits cut between the bands. Shut and invisible while it
    // is cold; they open and glow as it works, so heat reads as something the
    // machine is DOING rather than a colour it has been given.
    if (k > 0.06) {
      ctx.fillStyle = hot(0.35 + k * 0.55);
      for (let i = 0; i < 3; i++) ctx.fillRect(-6.5, -31.4 + i * 5, 13, 0.6 + k * 1.5);
      ctx.fillStyle = `rgba(255,236,190,${k * 0.5})`;   // the white core of each
      for (let i = 0; i < 3; i++) ctx.fillRect(-5, -31.2 + i * 5, 10, 0.4 + k * 0.7);
    }
    const bandCold = r.fused ? FUSED_EDGE : (r.metal || K.metal);
    ctx.fillStyle = k > 0.06 ? hot(1) : bandCold;      // the worked bands, heating
    ctx.fillRect(-9.2, -29, 18.4, 1.5);
    ctx.fillRect(-8.8, -24, 17.6, 1.5);
    ctx.fillRect(-8.3, -19, 16.6, 1.5);
    ctx.fillStyle = r.metalLo || K.lo;
    ctx.fillRect(-9.2, -27.5, 18.4, 0.7);
    ctx.fillRect(-8.8, -22.5, 17.6, 0.7);
    ctx.fillRect(-8.3, -17.5, 16.6, 0.7);
    // A bloom sitting just off the plate — hot metal seen at dusk.
    if (k > 0.25) {
      ctx.fillStyle = hot(k * 0.16);
      ctx.fillRect(-12, -33, 24, 21);
    }
  }

  // HEAT WISPS off the shoulders once it is genuinely labouring. Three thin
  // rising smudges, drifting, which is the tell you catch out of the corner of
  // your eye before you have read anything else.
  if (!r.fused && !r.drained && heat > 0.45) {
    for (let i = 0; i < 3; i++) {
      const ph = t * 1.5 + i * 2.1;
      const rise = (ph % 2) / 2;                        // 0 -> 1, then repeat
      ctx.fillStyle = `rgba(255,214,150,${(1 - rise) * (heat - 0.45) * 0.5})`;
      ctx.fillRect(-7 + i * 6 + Math.sin(ph * 2) * 1.5, -36 - rise * 11, 1.6, 3.2);
    }
  }

  // PAULDRONS, wider than the chest and squared off. Most of why the silhouette
  // reads as a big machine at a distance.
  ctx.fillStyle = r.fused ? FUSED_EDGE : B1_PLATE;
  ctx.fillRect(-14, -35.5, 5.5, 9.5);
  ctx.fillRect(8.5, -35.5, 5.5, 9.5);
  ctx.fillStyle = gold;
  ctx.fillRect(-14, -35.5, 5.5, 1.6);
  ctx.fillRect(8.5, -35.5, 5.5, 1.6);

  // THE GREAT SHIELD, carried on the left arm and OUTSIDE the body line, so it
  // never covers the corslet it is meant to sit beside. It swings in across the
  // chest only when you are inside the standoff — the one aggressive-looking
  // thing it ever does, and it is a defensive move.
  if ((r.shieldHp ?? 0) > 0) {
    const sx = guard ? -7.5 : -15;
    const sy = guard ? -24 : -22;
    ctx.save();
    ctx.translate(sx, sy);
    // TWO DIFFERENT THINGS. `shield` is how much rim there is to break through;
    // `rim` is how big the disc is DRAWN. They are deliberately separate:
    // Ajax's sevenfold is layers rather than size, so he carries far more
    // shield on the same disc as Agamemnon (David, 2026-08-15) and the extra
    // rings below say so. The later kings do grow — Diomedes a little,
    // Achilles the most — so the class escalates visibly down the archipelago.
    const sr = 6.6 * (r.rimScale || 1);
    ctx.fillStyle = r.fused ? FUSED_DARK : '#070809';
    ctx.beginPath(); ctx.arc(0, 0, sr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = gold; ctx.lineWidth = 1.5;                 // the rim
    ctx.beginPath(); ctx.arc(0, 0, sr, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = r.metalLo || K.lo; ctx.lineWidth = 0.8;    // an inner ring
    ctx.beginPath(); ctx.arc(0, 0, sr * 0.62, 0, Math.PI * 2); ctx.stroke();
    // The sevenfold gets its extra hides, one ring each — same disc, more of it.
    if ((r.shieldScale || 1) > 1.2) {          // the sevenfold, whatever its size
      ctx.beginPath(); ctx.arc(0, 0, sr * 0.82, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, sr * 0.42, 0, Math.PI * 2); ctx.stroke();
    }
    // THE BOSS IS A PLATONIC SOLID, one per king (David, 2026-08-15). A round
    // stud says nothing; a shape at the centre of the shield is a device, and
    // these are the estate's own — the foundry stamping a solid on a machine
    // the way a house stamps a crest. Achilles gets the dodecahedron because
    // Plato gave that one to the cosmos, and the shield in Iliad XVIII has the
    // cosmos on it.
    // The device at the centre goes dark. It flares once, early, and then dims
    // through to nothing — the solid stays SHAPED, so what you see is the light
    // leaving it rather than the shield losing a part.
    if (gone > 0) {
      const flare = Math.max(0, 1 - gone / 0.3);
      if (flare > 0) {
        ctx.fillStyle = `rgba(255,246,224,${0.5 * flare})`;
        ctx.beginPath(); ctx.arc(0, 0, sr * 0.9, 0, Math.PI * 2); ctx.fill();
      }
      const d = Math.max(0, 1 - gone * 1.6);
      ctx.fillStyle = `rgb(${Math.round(28 + 173 * d)},${Math.round(26 + 120 * d)},${Math.round(24 + 22 * d)})`;
    } else {
      ctx.fillStyle = gold;
    }
    bossShape(ctx, K.boss || 0, 2.4 * (r.rimScale || 1));
    // A blow it just turned lights the whole face; and as the rim goes, cracks
    // open across it, so a player can SEE the first phase running out rather
    // than guessing at an invisible bar.
    if (r.shieldFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${0.5 * (r.shieldFlash / 0.25)})`;
      ctx.beginPath(); ctx.arc(0, 0, sr, 0, Math.PI * 2); ctx.fill();
    }
    const wear = 1 - Math.max(0, Math.min(1, (r.shieldHp || 0) / (r.shieldMax || 1)));
    if (wear > 0.25) {
      ctx.strokeStyle = `rgba(0,0,0,${0.5 + wear * 0.4})`;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-6, -2.5); ctx.lineTo(-1.5, 0.5); ctx.lineTo(-2.5, 5);
      if (wear > 0.6) { ctx.moveTo(5.5, -3); ctx.lineTo(1.5, -0.5); ctx.lineTo(4, 4.5); }
      ctx.stroke();
    }
    ctx.lineWidth = 1;
    ctx.restore();
  } else if (!r.fused) {
    // BARE. The arm the shield hung on, with the empty mounting bracket still on
    // it — so a machine that has lost its shield does not simply look like a
    // machine that never had one.
    ctx.fillStyle = B1_PLATE;
    ctx.fillRect(-13, -27, 4, 9);
    ctx.fillStyle = r.metalLo || K.lo;
    ctx.fillRect(-13.5, -23.5, 5, 1.4);
    if (r.shieldBroke > 0) {                     // the moment it came off
      ctx.fillStyle = `rgba(242,198,94,${0.55 * (r.shieldBroke / 0.9)})`;
      ctx.beginPath(); ctx.arc(-13, -22, 3 + (1 - r.shieldBroke / 0.9) * 9, 0, Math.PI * 2); ctx.fill();
    }
  }

  // THE HELM: narrow, set down between the pauldrons, with cheek-pieces. NO
  // CREST — a plume was tried and cut (David, 2026-08-14): at this sprite size
  // it read as a scythe stuck to its head rather than as horsehair, and it
  // wrecked the flat, heavy silhouette that is the best thing about the design.
  // The call tell moved to the brow band and the ring on the ground instead,
  // which are both already in the player's vocabulary.
  ctx.fillStyle = r.fused ? FUSED_DARK : B1_HEAD;
  ctx.fillRect(-5.5, -45, 11, 11);
  ctx.fillStyle = calling ? B1_CREST : gold;            // brow band, lit on a call
  ctx.fillRect(-5.5, -45, 11, 1.8);
  ctx.fillStyle = gold;                                 // cheek-pieces
  ctx.fillRect(-5.5, -38.5, 1.6, 4.5);
  ctx.fillRect(3.9, -38.5, 1.6, 4.5);
  if (calling && !r.fused) {                            // and it glows off the helm
    ctx.fillStyle = 'rgba(242,198,94,0.30)';
    ctx.fillRect(-8, -47, 16, 6);
  }

  // The visor. Same state colours as every other machine, wider, so a player
  // reads its mood with the vocabulary they already have.
  const s = sensorStyle(r);
  if (s) {
    if (s.halo) { ctx.fillStyle = s.halo; ctx.fillRect(-6, -43, 12, 4.5); }
    ctx.fillStyle = s.fill;
    ctx.fillRect(-3.8, -42, 7.6, 2.2);
  }

  ctx.restore();

  if (r.fused) drawSmoke(ctx, c.x, c.y - 50, r.animT || 0);
  if (r.drained && !r.fused) drawBatteryIcon(ctx, c.x, c.y - 58);

  // THE PORTS IT PRINTED FROM, venting. Five of them, each opening at its own
  // point in the fall so they go raggedly rather than together, and each one a
  // short white gout that widens as it thins. Drawn AFTER the body, not before
  // it: a vent behind the sprite is a vent you cannot see, and these come out
  // of the machine towards you. The last of them is still going when it lands.
  if (gone > 0) {
    for (let i = 0; i < CARRIER_DEATH_VENTS; i++) {
      const at = 0.08 + i * 0.16;
      const k = (gone - at) / 0.30;
      if (k <= 0 || k >= 1) continue;
      const a = (i / CARRIER_DEATH_VENTS) * Math.PI * 2 + 0.6;
      // Ports set around the hull and up its height, so they do not all fire
      // out of the same band of the sprite.
      const vx = c.x + Math.cos(a) * (9 + k * 12);
      const vy = c.y - 12 - (i % 3) * 9 + Math.sin(a) * 4 - k * 6;
      ctx.globalAlpha = (1 - k) * 0.9;
      ctx.fillStyle = '#fff6e0';
      ctx.beginPath();
      ctx.ellipse(vx, vy, 3.5 + 9 * k, 2.5 + 7 * k, a, 0, Math.PI * 2);
      ctx.fill();
    }
    // THE LANDING. In the last third the ground under it goes pale and wide —
    // the dust a machine this heavy puts up as it comes down.
    if (gone > 0.66) {
      const f = (gone - 0.66) / 0.34;
      ctx.globalAlpha = (1 - f) * 0.5;
      ctx.strokeStyle = '#e8dcc0';
      ctx.lineWidth = 1 + 2 * f;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 18 + f * 34, 7 + f * 15, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

// The T3 ambusher: a wheeled T2 with laser eyes — same family silhouette
// as the stalker, planted on the T1's undercarriage, with a pair of orange
// emitters for a face so the machine that fires the twin-laser volley is
// unmistakable at a glance (orange, never the red of the other machines).
function drawT3(ctx, r, c) {
  // The ambush sniper, rebuilt as a WHEELED T2 with laser eyes: the T2's
  // upright blocky silhouette planted on a T1-style wheeled chassis (it
  // repositions, it never walks), and a pair of always-lit orange laser
  // eyes — the machine whose whole identity is the twin-laser volley wears
  // its weapon on its face. Keeps the live-machine tremor, the riveted
  // sheen, and every state tell (aggro flare, stun flicker, fused slump).
  if (!r.noShadow) {
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 11 * T3_SCALE, 5 * T3_SCALE, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(c.x, c.y);
  const tremor = r.fused ? 0 : Math.sin((r.animT || 0) * 9) * 0.012;
  if (r.fused) ctx.rotate(0.16);
  else ctx.rotate(tremor);
  ctx.scale(T3_SCALE, T3_SCALE);

  // Wheeled base: two dark wheels with pale hubs under a low chassis skirt —
  // the T1's undercarriage carrying the T2's body.
  ctx.fillStyle = r.fused ? FUSED_EDGE : T3_LIMB;
  for (const wx of [-6, 6]) {
    ctx.beginPath();
    ctx.arc(wx, -3, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (!r.fused) {
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (const wx of [-6, 6]) {
      ctx.beginPath();
      ctx.arc(wx, -3, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = bodyTone(T3_BODY, r); // chassis skirt
  ctx.beginPath();
  ctx.moveTo(-9, -6);
  ctx.lineTo(9, -6);
  ctx.lineTo(7, -12);
  ctx.lineTo(-7, -12);
  ctx.closePath();
  ctx.fill();

  // Torso: the T2's blocky trunk, a shade taller so the sniper still reads
  // as the bigger machine at a glance.
  ctx.fillStyle = bodyTone(T3_BODY, r);
  ctx.fillRect(-7, -30, 14, 18);
  ctx.strokeStyle = r.fused ? FUSED_EDGE : T3_EDGE;
  ctx.lineWidth = 1;
  ctx.strokeRect(-7, -30, 14, 18);

  if (!r.fused) {
    // Riveted brushed-steel sheen clipped to the trunk (kept from the old
    // draw — it earns its keep at this scale).
    ctx.save();
    ctx.beginPath();
    ctx.rect(-7, -30, 14, 18);
    ctx.clip();
    const sheen = ctx.createLinearGradient(-7, -30, 7, -12);
    sheen.addColorStop(0, 'rgba(255,255,255,0.05)');
    sheen.addColorStop(0.42, 'rgba(255,255,255,0.22)');
    sheen.addColorStop(0.52, 'rgba(255,255,255,0.05)');
    sheen.addColorStop(1, 'rgba(0,0,0,0.16)');
    ctx.fillStyle = sheen;
    ctx.fillRect(-8, -31, 16, 20);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-7, -18);
    ctx.lineTo(7, -16);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (const [rx, ry] of [[-4, -27], [4, -26], [-3, -15], [5, -20]]) {
      ctx.beginPath();
      ctx.arc(rx, ry, 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // NO ARMS. It had two clawed struts waving off its shoulders — a tell for the
  // point-blank claw — and at this size they read as a bug rather than as a
  // machine, all elbow and no body (David, 2026-08-15: "it looks odd"). The
  // T-3 is a gun on a wheeled trunk; the claw is what it does when you are on
  // top of it, and it does not need to be advertised by waving.
  //
  // Short shoulder blocks stay, so the trunk still has a top rather than
  // stopping flat.
  if (!r.fused) {
    ctx.fillStyle = T3_LIMB;
    for (const side of [-1, 1]) ctx.fillRect(side === -1 ? -9.5 : 6.5, -27, 3, 5);
  }

  // Head: the T2's sensor block, one size up.
  ctx.fillStyle = r.fused ? FUSED_DARK : T3_HEAD;
  ctx.fillRect(-5, -39, 10, 9);
  ctx.strokeStyle = r.fused ? FUSED_EDGE : T3_EDGE;
  ctx.lineWidth = 1;
  ctx.strokeRect(-5, -39, 10, 9);

  // LASER EYES: a pair of round orange emitters, always faintly lit — this
  // is the machine that shoots from its face, and it should look like it.
  // t3SensorStyle flares them (and adds the halo) the instant it hunts;
  // fused/drained states go dark through the same path as everyone else.
  const s = t3SensorStyle(r);
  for (const ex of [-2.4, 2.4]) {
    ctx.fillStyle = EYE_SOCKET; // emitter housing
    ctx.beginPath();
    ctx.arc(ex, -34.5, 1.9, 0, Math.PI * 2);
    ctx.fill();
  }
  if (s) {
    for (const ex of [-2.4, 2.4]) {
      if (s.halo) {
        ctx.fillStyle = s.halo;
        ctx.beginPath();
        ctx.arc(ex, -34.5, 3.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = s.fill;
      ctx.beginPath();
      ctx.arc(ex, -34.5, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Hunting: a thin charge-line joins the two emitters — the twin lasers
    // converging, the last thing you see before the volley.
    if (s.halo && !r.fused && !r.drained) {
      ctx.strokeStyle = s.fill;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-2.4, -34.5);
      ctx.lineTo(2.4, -34.5);
      ctx.stroke();
    }
  }

  drawDesignation(ctx, r, 0, -21); // 'T3' on the trunk plate

  ctx.restore();

  if (r.fused) drawSmoke(ctx, c.x, c.y - 34 * T3_SCALE, r.animT || 0);
  if (r.drained && !r.fused) drawBatteryIcon(ctx, c.x, c.y - 43 * T3_SCALE);
}
