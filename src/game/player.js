// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

import { screenDirToWorld, ELEV, Z_PX } from '../engine/iso.js';
import { sfx } from '../engine/sound.js';
import { modeOf, DEFAULT_MODE, isMode, lowerMode } from './modes.js';
import { WOOD_PER_FIRE, FUEL_PER_WOOD, isLit, feedFire, tickCook, roastOf } from './cooking.js';   // #180
import { ITEMS } from './items.js';
import { ARMOUR_SLOTS, armourKey, takeHit, slotOf, shouldWear, freshPiece } from './armour.js';
import { OBJECTS } from './tiles.js';
import { DAEMON_VOICE, DAEMON_FINAL, daemonTier } from './fortress.js';
import { fire, SCORE, KILL_XP, zombieImmune } from './combat.js';
import { W5_PROGRAM } from './robots.js';
import { achieveEvent } from './achieve.js';

// The five credentials of the escape chain. Picking any of them up is a beat
// worth marking (docs/PLAN.md, the cards).
const CARD_ITEMS = new Set(['chip', 'ai_key', 'trojan_key', 'hermes_card', 'fsf_card']);

const WALK_SPEED = 4.2;   // tiles per second
const SPRINT_SPEED = 7.5;
const BLOCK_WALK_MULT = 0.6; // slower, steadier pace while up on a block top
const WOUNDED_SPEED = 3.2; // hobble walking pace when health is very low
const WOUNDED_AT = 20;     // health threshold for the hobble
const WOUNDED_SPRINT_DRAIN = 2.5; // wounded sprinting burns stamina this much faster
const RADIUS = 0.28;      // collision radius in tiles
const REACH = 0.9;        // how far ahead the player can use a tool
const CHIP_FRAGMENTS_PER_CHIP = 8; // fragments shed by machines to craft one chip
const FORTRESS_MAP_FRAGMENTS = 5; // scattered map quarters pieced into a fortress map
const SCRAP_PER_SWORD = 10; // scrap beaten into a robot sword
const TORCHES_PER_GOGGLES = 5; // torch-heads stripped for phosphor + a board -> goggles
const SNIFFER_CRAFT_CIRCUITS = 2;   // an aerial, a receiver, a screen
const SNIFFER_RANGE = 24;           // tiles: the same radio reach the laptop's card has
const BLUEBOX_CRAFT_CIRCUITS = 2;  // circuit boards soldered into a bluebox
// Reviving the machine you wash ashore with. Deliberately CHEAP and made of
// early scavenge — batteries and chip fragments turn up in caches from the first
// hour — because the NostBook is a tool you want in the player's hands early,
// not a late reward. Circuit boards were wrong for it: those come off felled
// towers, which is hours away.
// One of each. The NostBook is where you LEARN the language, so gating it
// behind a shopping list keeps a player away from the thing the game most
// wants them to find. Both drop off any machine you destroy.
const LAPTOP_REPAIR = [['battery', 1], ['chip_fragment', 1]];
const SPOOF_RANGE = 6;             // how close you must stand to impersonate a tower
const BLUEBOX_CONVERT_COST = 1;    // circuit board spent to splice one machine to a gardener
const WOOD_PER_BOAT = 12;   // wood felled and lashed into a boat (Player.craftBoat)
const BOAT_HULL = 100;      // a beached boat's starting hull HP (Stage 1b spends it crossing)
const BOAT_LAUNCH_RADIUS = 2; // must be right at the sea's edge to launch (within ~2 tiles of the shore)
const WOOD_PER_SHIP = 12;    // wood for a proper greek ship (plus oar + rope + sail + Calypso's recipe)
// How each machine's hull rings under a blade (sfx 'clang' pitch factor):
// small and thin rings high and short, heavy plate rings low and long.
const CLANG_PITCH = {
  t1: 1.5, m4: 1.3, w2: 1.3,          // small, tinny
  w3: 1.15, w5: 1.15,                  // light drones
  t2: 1, m5: 1,                        // the standard biped ring
  t3: 0.85, w1: 0.85, m6: 0.85,        // heavier chassis
  w4: 0.65,                            // the furnace plate
};
const TEMPLE_HEAL_R = 7;      // tiles from a temple-grove centre that count as inside it
const TEMPLE_HEAL_MULT = 3;   // health regen multiplier among the old stones
// A sanctuary is a place you can crawl to (#128). Among the stones you mend
// whether or not you have eaten, and you mend all the way — everywhere else on
// these islands recovery stops when the food does. It costs you the walk and
// the daylight, and POSEIDON's blight shuts it off, which is what keeps it from
// being a way to ignore hunger.
const TEMPLE_HURT_ENOUGH = 0.5;   // arrive under half and the mending is worth a name
const KNOCKBACK_DIST = 0.5; // tiles a melee hit shoves an animal/robot back
const KNOCKBACK_STUN = 0.4; // seconds it's frozen (no move, no attack) after
const TREE_HP = 4;        // penknife swings to fell a tree
// The factory hull only yields to a serious anti-machine tool. A blade lighter
// than this (penknife, machete, bat, saw...) just rings off the plating — you
// need a sledgehammer/crowbar/robot-sword, or explosives, or the electro-gun.
const FACTORY_MIN_TOOL = 4;
const TREE_CHOP_SPEEDUP = 0.55; // chop cooldown vs a normal swing: faster axe work
const WOOD_PER_TREE = 2;
const PICKUP_RANGE = 0.55;

const STAMINA_MAX = 100;
const SPRINT_DRAIN = 9;   // stamina per second while sprinting
const STAMINA_REGEN = 12; // per second when not sprinting
const HEALTH_REGEN = 1.5; // per second while fed and unpoisoned
const VENOM_DRAIN = 2;    // health per second while poisoned

const FOOD_MAX = 100;
const FOOD_DRAIN = 0.14;      // per second; empties over ~1.5 game days
const FOOD_SPRINT_MULT = 1.5; // sprinting burns food faster
const STARVE_DRAIN = 0.8;     // health per second at zero food
const HUNGRY_AT = 25;         // stamina recovers slowly below this

// Lotus torpor: eating lotus fruit dazes you — slowed, with a drunken roll in
// your step: your heading sways and lurches, so walking a straight line out of
// the grove takes real correcting (the lotus-eaters of Odyssey IX).
const TORPOR_TIME = 9;        // seconds of daze added per fruit eaten
// The mode's scale on a loss of health, written as a free function rather than
// only as a method: the depart-mode tests call `takeDamage` on a plain stand-in
// object, and `this.harm` is not there. A funnel that throws when it is borrowed
// is a funnel people route around.
/**
 * The mode stamp a certificate carries (#173) — a MODULE function, not a method.
 *
 * Same reason as `modeHarm` below: `boardBoat` and the death paths are borrowed
 * by the tests on plain stand-in objects, and a certificate builder that throws
 * when borrowed is a builder people route around. A stand-in with no mode gets
 * the default, which is what it was playing.
 */
function modeStamp(self) {
  return {
    mode: (self && (self.modeFloor || self.mode)) || DEFAULT_MODE,
    modeSet: (self && self.mode) || DEFAULT_MODE,
    modeSwitched: !!(self && self.modeSwitched),
  };
}

function modeHarm(self, amount) {
  if (!self || self.creative) return 0;
  return amount * modeOf(self.mode).hurt;
}

const TORPOR_MAX = 22;        // stacking cap, so a fistful doesn't strand you forever
const TORPOR_SLOW = 0.5;      // movement multiplier while dazed
const TORPOR_SWAY = 1.0;      // radians of peak heading roll while dazed (scaled by ease)
// G1 (CALYPSO's grove): her hold is a DEFLECTION, not a wall. It drags at your
// pace a little and turns a step aimed at her a lot, and it never stops you.
const GRIP_SLOW = 0.3;        // most of your pace it may take, at full grip
// Radians a step aimed at her is turned aside, at full grip. PAST A RIGHT
// ANGLE on purpose: at 90 degrees an inward step becomes purely sideways and
// you orbit her, which a determined player simply walks around by zigzagging.
// Past it the inward part of your step is REVERSED, and there is no angle of
// approach that closes the distance.
const GRIP_TURN = 2.0;
// And a current, outward, on top of the turn. The turn alone leaves you able to
// hold your ground and shuffle in a tile at a time; this means pressing in
// loses ground, which is what "you cannot get to her" has to mean.
const GRIP_PUSH = 2.6;        // tiles/sec drift away from her, at full grip
const ANVIL_SLOW = 0.1;       // carrying the anvil, anywhere on you: a tenth of your pace
const TORPOR_FOOD_DRAIN = 2;  // extra food/sec while dazed — you forget to look after yourself
// Depart mode (R3): how her fortress guards DETAIN before they wound.
const DETAIN_LIMIT = 3;       // warning strikes (torpor + turn-back) before patience runs out
const DETAIN_TORPOR = 5;      // seconds of daze per detain strike (lighter than a lotus fruit)
const DETAIN_PUSH = 1.4;      // tiles shoved back toward the island's heart per strike
const DETAIN_COOL_TIME = 12;  // seconds off her guards' radar before the warning count resets

const JUMP_VZ = 3.8;      // initial jump velocity (world units/s)
const GRAVITY = 12;
const JUMP_COST = 3;      // stamina
const CLIMB_COST = 2;     // stamina per height level climbed
const FORCEFIELD_MAX = 60;  // seconds of forcefield per battery
const FORCEFIELD_DRAIN = 1; // charge/sec while the field is up
const SHIELD_FRONT = 0.2;   // a shield covers shots from within this facing dot
const REFLECT_DAMAGE = 8;   // a mirror shield throws this back at the shooter
// Shields wear out under fire. The riot shield is sheet metal — count the blows
// it soaks and it eventually caves in. The mirror shield overheats: every bolt
// it throws back adds heat, it sheds heat when the fire lets up, past FADE it's
// glowing too hot to reflect (only absorbs), and at full heat it melts to scrap.
// The forcefield is energy, not metal, so it never breaks — but each blow it
// swallows costs extra charge, so a barrage drains the cell far faster than idle.
const RIOT_SHIELD_HITS = 12;      // blocked hits before a riot shield is battered apart
// THE ASPIS WORKS LIKE THE RIOT SHIELD, only better, which is what it is for:
// it came off something that was using it properly. Same mechanic — carried,
// covers every direction, wears with each blow — and twice the endurance.
const ASPIS_HITS = 26;
const MIRROR_HEAT_PER_HIT = 0.17; // heat gained per bolt reflected (0..1 scale)
const MIRROR_HEAT_COOL = 0.13;    // heat/sec shed while not being hit
const MIRROR_HEAT_FADE = 0.6;     // above this it's too hot to reflect — only absorbs
const FORCEFIELD_HIT_COST = 2;    // seconds of charge burned per blow the field eats
// #159 — WHAT A SWARM COSTS THE FIELD. A w-unit is a cheap machine whose whole
// contribution is to be one of many, and against an energy shell that makes it
// a drain rather than a threat: it earths itself on the shell and takes a bite
// of the cell doing it. Eight times an ordinary blow, because the alternative
// is what Henrik found — carry a forcefield and a stack of batteries and the
// B-1's waves cannot touch you, so the fight the swarm exists to create simply
// does not happen. The field is meant to be a costly minute, not an off-switch.
const FORCEFIELD_SWARM_COST = 16;

const WIFI_MAX = 600;    // Wi-Fi block charge in seconds (10 real minutes)
const SWIM_STAMINA_DRAIN = 8;  // stamina/sec while in deep water
const SWIM_HEALTH_DRAIN = 1.2; // health/sec: swimming a river is exhausting


// Item kinds that can occupy the hands slot.
const HOLDABLE = new Set(['tool', 'gun', 'gadget', 'bomb', 'map', 'spray', 'seed']);
// …and the per-item way out of it. HOLDABLE is a set of KINDS, so an item that
// should not be held can only be excused one of two ways: change what it is,
// which drags WEAPON_ORDER, item-classes and the combat rules along with it, or
// say so on the def. The seatbelt is the case: a tool by kind, a length of
// webbing in fact, and nobody wants it coming up in their hand. It still goes
// in a pocket and still does what it does from there.
const canHold = (key) => {
  const def = ITEMS[key];
  return !!def && HOLDABLE.has(def.kind) && !def.noHold;
};
const UBIK_SPRAYS = 20; // charges in a Ubik can before it runs dry
// Every so often the can does something stranger than settle a patch of
// reality — a beat of PKD's Ubik itself leaking through: a chapter-heading
// ad, a flicker of an older world underneath this one, something.
const UBIK_WEIRD_CHANCE = 0.28;
// Spraying the same spot again (within this radius) tops up that patch
// instead of laying a new one on top of it; three sprays there opens a
// portal instead of just brightening the ground.
const UBIK_MERGE_RANGE = 1.5;
const UBIK_PORTAL_SPRAYS = 3;
const UBIK_ADS = [
  'INSTANT UBIK. Poor sleep? Try new, improved Ubik, safe when taken as directed.',
  'Ubik. Comes in a spray can, extra fine mist. Safe when used as directed.',
  'Friends, this is Ubik talking. I am the word that never wears out.',
  'For a limited time only, Ubik reaches everywhere, even where you have not yet been.',
  'Ubik. Guaranteed, or double your money back. Void on Tuesdays.',
];

// Empty-handed is still a weapon, just a bad one: a stand-in "tool" so bare
// fists flow through the exact same melee path as a real one (target
// finding, wreck-mining, zombie immunity, tree handling) rather than the
// old "Your hands are empty" no-op. Barely scratches a machine and can't
// fell a tree at all — see the bare-hands branch alongside penknife's.
const BARE_HANDS = {
  name: 'Bare hands', kind: 'tool', tier: 0,
  treeDamage: 0, animalDamage: 2, robotDamage: 1,
  swingCooldown: 0.4, staminaCost: 2,
};


// Soft ground a shovel can sink into; hard surfaces (road, boards, water)
// resist digging.
/**
 * How tall you are, in blocks — the clearance a surface must have above it
 * before you can stand there (David, 2026-08-16). Two, like every other
 * two-legged thing in a block world; one block of clearance is a crawlspace and
 * you cannot use it.
 */
const PLAYER_HEIGHT = 2;

const DIGGABLE = new Set(['grass', 'tallgrass', 'dirt', 'sand']);
const PIT_DEPTH = -2;    // trap depth: a steep pit a T1 cannot climb out of

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.spawnX = x;
    this.spawnY = y;
    this.z = 0;           // height above ground while jumping
    this.vz = 0;
    this.doubleJumped = false; // a second, mid-air jump: reaches block tops
    // THE MODE. Creative used to be a lone boolean set from the dev panel; it is
    // now the first of five modes chosen on the title screen, and `creative` is
    // derived from it rather than set beside it. The LYRE switch still works and
    // still flips this same flag — it is the same held breath, reachable two ways.
    this.mode = DEFAULT_MODE;
    this.creative = false;     // derived from the mode; LYRE toggles it directly too
    // #173 — WHAT THE RUN IS GRADED AT. The mode can be changed at any point
    // from the Settings panel, so the mode you are on when you reach Ithaca is
    // not the mode you played. `modeFloor` is the lowest this run ever held and
    // it is what a completion is credited at; `modeSwitched` records that it
    // moved at all, which is a different (and milder) fact worth printing.
    // WHICH LEVEL YOUR FEET ARE ON (terrain stage 5). On ordinary ground this is
    // exactly `effectiveHeightAt` and always has been — the tile has one
    // surface, so there was nothing to remember. On a column with air in it
    // there are two, and which one you are on is a fact about YOU, not about the
    // tile: standing under a deck and standing on it are the same x and y.
    // Carried across frames because it is the only way the question stays
    // answerable — you cannot infer it from a position alone.
    this.footZ = 0;
    this.modeFloor = DEFAULT_MODE;
    this.modeSwitched = false;
    // ADOPTING a mode is not SWITCHING one. The first `setMode` is the title
    // screen's choice (or a save being restored), and counting that as a switch
    // would mark every run as switched before it started.
    this._modeSet = false;
    this.forcefieldCharge = 0; // seconds of forcefield left in the current cell
    this.forcefieldArmed = false; // toggled by clicking the forcefield in any slot
    this.riotShieldHits = 0;   // blows a carried riot shield has soaked; breaks at RIOT_SHIELD_HITS
    this.aspisHits = 0;        // the same count for the great shield; breaks at ASPIS_HITS
    this.mirrorHeat = 0;       // 0..1 mirror-shield overheat; reflects while cool, melts at 1
    this.compassArmed = false; // toggled by clicking the electro-compass in any slot
    this.gogglesOn = false;    // night-vision goggles worn: they cut POSEIDON's fog
    // #121: what the bluebox is loaded with, and the file it came from. Null
    // means it writes the gardener it was soldered to write.
    this.blueboxProgram = null;
    this.blueboxFile = null;
    this.ronmlKeys = new Set(); // node ids AI-ML's `hack` has cracked open this session
    this.ammoFrac = {};        // accumulated fractional ammo per gun
    this.electroCharge = (ITEMS.electrogun && ITEMS.electrogun.internalMax) || 4; // electro-gun's self-charging internal cell
    this.terminalSafe = false;  // true while jacked into a console — an obelisk, or the NostBook (invisible to machines)
    this.ubikSprays = UBIK_SPRAYS; // charges left in the Ubik can (set on pickup below too)
    this.ubikFlickerT = 0; // seconds left of the "old world showing through" flicker on spray
    this.ubikFlickerX = 0; this.ubikFlickerY = 0; // world pos the flicker is centred on
    this._ubikTeleportCooldown = 0; // seconds before another portal can fire (main.js)
    this.ubikHiccupT = 0; this.ubikHiccupKind = null; // brief discolor/lean/twist while standing in a patch

    // Adaptive-difficulty telemetry: a rough, cheap read on whether this is a
    // player still finding their feet — tracked purely from movement, no
    // combat outcomes needed (so it works even before a first fight). See
    // threatEase() below for how it's turned into an actual easing factor.
    this.distanceTraveled = 0; // tiles attempted-moved since this run began
    this.playSeconds = 0;      // real seconds since this run began
    this.facing = { x: 0, y: 1 };
    this.moving = false;
    this.sprinting = false;
    this.walkPhase = 0; // drives the gait animation

    this.health = 100;
    this.maxHealth = 100;
    this.stamina = STAMINA_MAX;
    this.maxStamina = STAMINA_MAX;
    this.food = FOOD_MAX;
    this.maxFood = FOOD_MAX;
    this.venom = 0;       // seconds of poison remaining
    // CIRCE's swine-magic (AEAEA): 0..1. On her island it climbs unless you carry
    // MOLY; at 1 you are RECLASSIFIED — no longer a person to the network. The
    // machines stop hunting you (a beast is not an intruder) but you can no longer
    // wield a weapon or work a terminal. Carrying moly holds your shape and drains
    // it back. Ticked in main.js's transmutation pass (combat loop, AEAEA only).
    this.swine = 0;

    this.hands = 'penknife';                 // starting tool
    this.boatBuilt = false;                  // one boat at a time; a session flag (Stage 1c persists it as campaign state)
    this.aboard = null;                      // {type, mirror, wob} while under way — the renderer draws hull + man as one
    this.shipBuilt = false;                  // one greek ship at a time (independent of the plain boat)
    this.calypsoLeave = false;               // Calypso refunctioned (retire): the sea will let you go (decision #8)
    // #141 — THE SECOND GATE, and it is a different KIND of gate. The ship is
    // material and Calypso gives the means; the permission is juridical and
    // POSEIDON honours it or does not. R0 established that he is already the
    // one who turns you back (onDepartFail), so a leave that only reached
    // Calypso was never going to be enough. Set by uploading permission.ml at
    // any obelisk, which propagates it across the net he runs on.
    this.seaPermission = false;
    this.detainMode = false;                 // R3: on a depart-mode island her fortress guards detain, not slay (main.js sets it per world)
    // Which daemons the card is armed against. Each island's HERMES relay holds
    // only its own virus, so arming is PER ISLAND: a card forged on Ogygia opens
    // nothing on Aeaea. Names are AI_NAMEs ('CALYPSO', 'POLYPHEMUS', ...).
    this.virusArmed = new Set();
    // #159: the card in hand was cut off a dead carrier rather than forged at a
    // relay (docs/PLAN.md). It opens her door exactly as the
    // forged one does; POSEIDON's net has simply read that it went missing.
    this.hermesTraced = false;
    // The Nokia 3310 — Calypso's channel (docs/PLAN.md). A worn
    // fixture like the walkman: never dropped, never a pocket slot. `calypsoHold`
    // is her hold on you AND her protection of you (0..1); `nokiaSent` records the
    // one-shot texts she has already sent, so a reload does not re-tutorial you.
    this.nokia = true;
    this.calypsoHold = 0.65;                  // seven years kept: you begin already held (nokia.js HOLD_INIT)
    this.nokiaSent = new Set();
    this._nokiaIvIdx = 0;                     // cycles her intervention lines
    this.phone = { item: 'nokia_3310', qty: 1 }; // the PHONE box beside the walkman (swappable in a later build)
    // The laptop you carry (docs/PLAN.md): its own slot beside the phone and
    // the walkman, because a laptop is almost nothing but per-instance state and
    // inventory slots hold only {item, qty}. Null until you find one.
    //   { model: 'laptop', os: 'unix', fs: <disk>, heat: 0, damage: null }
    this.laptop = null;
    this.lying = false;  // washed ashore: a fresh game starts face-up on the sand (main.js sets it; first input gets you up)
    this.snakeHigh = 0;  // the 3310's Snake high score (persisted with the save)
    this.nokiaLog = [];                       // the SMS threads: { th: 'CALYPSO'|'RON', from: 'you'|'them', text }
    // Washed ashore with it: a dead machine in your pocket from the first minute.
    // It is the promise the opening makes — something of yours, that does not
    // work yet, and that a few hours of scavenging will bring back.
    this.pockets = [{ item: 'note_home', qty: 1 }, { item: 'laptop_broken', qty: 1 }, null, null];
    this.backpack = null;                    // {slots: [16], weapon} once found; dropped on death
    this.selectedPocket = null;              // 0-3 (pockets), 'bw' (backpack weapon), or null
    // The walkman, worn on a carry strap: its own dashboard slot that only
    // takes kind:'tape' items. You start with one cassette already in it —
    // stopped; clicking it cycles side A -> side B -> stopped (equipSlot).
    // The side is deliberately NOT persisted: every session starts with the
    // tape stopped, so the saved music setting isn't fought over on load.
    this.walkman = { item: 'tape_1', qty: 1 }; // meme / compilation (see items.js TAPES)
    this.walkmanSide = null;                 // 'A', 'B', or null (stopped)
    this.swingTimer = 0;
    this.hurtTimer = 0;   // brief red flash after taking damage
    this.message = null;  // {text, ttl} transient HUD line
    this.daemonVoice = null;  // {text, ttl, tier, ai} — the core speaking as you break it
    this.torpor = 0;          // seconds of daze remaining, whatever caused it
    // THE GOLD WASH IS THE FRUIT, NOT EVERY DAZE. `torpor` is the mechanic —
    // slow feet and a drunken heading — and two very different things stack it:
    // the lotus, and one of her guards turning you back. Painting the screen
    // gold for both meant a single guard tap read as "I have eaten the lotus"
    // (David, 2026-08-15: "when it attacks it makes the screen go yellow like I
    // am in lotus fruit mode"). A detain gives 5 seconds and the wash is at full
    // strength by 3, so one blow was the whole effect.
    //
    // So the daze is still the daze, and only the fruit is golden.
    this.lotusDaze = 0;       // seconds of LOTUS torpor; drives the gold haze alone
    // G1: how hard CALYPSO's grove is holding you, 0..1. Set every frame from
    // your distance to her core (game/grove.js hold()), and zero on the green
    // path. Not a timer like torpor — it is WHERE YOU ARE STANDING, so walking
    // out of it is the whole of the cure.
    this.grip = 0;

    this.name = 'Nobody';   // Odysseus's 'Outis' to the Cyclops — and the 'nobody' the OB terminals accept
    this.gender = 'm';    // 'm' | 'f' | 'u'
    this.skills = new Set(); // knowledge from books; survives death
    this.booksRead = new Set(); // the Library: which physical books you have read
    this.skillLog = [];   // books read, in order (for the skills screen)
    this.weaponsFound = new Set(['penknife']); // for the weapon chart; survives death
    this.killLog = [];    // obelisks destroyed, by hex code name
    this.circuitNums = new Set(); // numbered circuit boards collected (1-8) for the wave gun

    this.wifiPower = 0;   // Wi-Fi block charge (seconds) while one is held
    this.wifiMax = WIFI_MAX;
    this.invisibleToRobots = false; // true while a charged block is in hand
    this.score = 0;       // survival score; persists across deaths
    this.skylinkActive = false; // true during the final 30s purge once POSEIDON comes online

    // Practice makes better: melee/guns sharpen with use, knowledge with
    // reading. Levels rise on a square-root curve (25, 100, 225... xp per
    // level) and, like skills, survive death and reloads.
    this.xp = { melee: 0, guns: 0, knowledge: 0 };
    // GROUND YOU HAVE SEEN. Knowledge came only from reading, so a player who
    // walked the whole archipelago and read nothing had learnt nothing. Coarse
    // 8x8 blocks, keyed per world, so a fresh island is worth exploring and
    // pacing the same field is not. A 128x128 island is 256 blocks, which is
    // worth about three levels for walking all of it — a real investment,
    // and less than a shelf of books.
    this.seenGround = new Set();
    this.worldId = '';   // set by main.js on every world switch
  }

  xpLevel(kind) {
    return Math.floor(Math.sqrt((this.xp[kind] || 0) / 25));
  }

  gainXp(kind, amount) {
    const before = this.xpLevel(kind);
    this.xp[kind] = (this.xp[kind] || 0) + amount;
    if (this.xpLevel(kind) > before) {
      const label = kind === 'guns' ? 'aim' : kind === 'melee' ? 'swordarm' : 'mind';
      this.say(`Practice pays off: your ${label} sharpens.`);
    }
    if (this.onXpGain) this.onXpGain();
  }

  // Walking somewhere new teaches you something. Called every frame; the Set
  // lookup is the whole cost, and only a block you have not stood in before
  // pays out.
  noteGround() {
    const key = `${this.worldId}:${Math.floor(this.x / 8)},${Math.floor(this.y / 8)}`;
    if (this.seenGround.has(key)) return;
    this.seenGround.add(key);
    // The first block on arrival is not exploration, it is where you woke up.
    if (this.seenGround.size > 1) this.gainXp('knowledge', 1);
  }

  setPersona(name, gender) {
    this.name = name;
    this.gender = gender;
  }

  addScore(n) {
    this.score += n;
    if (this.onScore) this.onScore();
  }

  // Record that a weapon has been seen at least once (for the weapon chart).
  discoverWeapon(key) {
    const def = ITEMS[key];
    if (!def || (def.kind !== 'tool' && def.kind !== 'gun')) return;
    if (!this.weaponsFound.has(key)) {
      this.weaponsFound.add(key);
      if (this.onWeaponFound) this.onWeaponFound();
    }
  }

  // True if a single named item sits anywhere on the player (hand, pockets,
  // backpack, spare-weapon slot).
  hasItem(key) {
    if (this.hands === key) return true;
    if (this.pockets.some((s) => s && s.item === key)) return true;
    if (this.backpack) {
      if (this.backpack.weapon === key) return true;
      if (this.backpack.slots.some((s) => s && s.item === key)) return true;
    }
    return false;
  }

  // The AI card is one physical object refunctioned through three states —
  // ai_key -> trojan_key -> hermes_card (the Calypso escape chain). Anything
  // that asks "do you hold the AI key" accepts the whole family, so refunctioning
  // the card never strips its base authority (copy aikey / backup still work).
  hasAiKeyFamily() {
    return this.hasItem('ai_key') || this.hasItem('trojan_key') || this.hasItem('hermes_card');
  }

  // The refunctioned card — a Trojan key or the Hermes card — carries the
  // Lion's-Gate credential (factory_id.ml + root_access.ml); a bare ai_key does
  // not. This is what opens the fortress gate now (fortress_key is retired).
  hasTrojanCard() {
    return this.hasItem('trojan_key') || this.hasItem('hermes_card');
  }

  // Is the card armed against THIS island's daemon? You must still be holding a
  // card for the arming to mean anything — the code lives on the card, not in
  // your head, so losing it costs you the arming until you reprint and reforge.
  hasVirusFor(aiName) {
    return this.hasTrojanCard() && this.virusArmed.has(aiName);
  }

  // MOLY, the ward against CIRCE's swine-magic (Odyssey 10.302-6). Merely CARRYING
  // it holds your shape — it is never eaten or spent.
  hasMoly() {
    return this.hasItem('moly');
  }

  // Fully reclassified by CIRCE: the network no longer reads you as a person. The
  // machines let you be, but you cannot wield a weapon or work a terminal.
  isSwine() {
    return this.swine >= 1;
  }

  // Remove one of a named item from wherever it is. Returns whether it went.
  removeItem(key) {
    if (this.hands === key) { this.hands = null; return true; }
    let i = this.pockets.findIndex((s) => s && s.item === key);
    if (i >= 0) { this.pockets[i].qty -= 1; if (this.pockets[i].qty <= 0) this.pockets[i] = null; return true; }
    if (this.backpack) {
      if (this.backpack.weapon === key) { this.backpack.weapon = null; return true; }
      i = this.backpack.slots.findIndex((s) => s && s.item === key);
      if (i >= 0) { this.backpack.slots[i].qty -= 1; if (this.backpack.slots[i].qty <= 0) this.backpack.slots[i] = null; return true; }
    }
    return false;
  }

  // Swap one held item for another IN PLACE — same hand, pocket, or backpack
  // spot. Used to refunction the AI card through its states (ai_key ->
  // trojan_key -> hermes_card): the card is one physical object, so its new
  // state must take the exact place of the old. Never remove-then-restow — that
  // fails, and can LOSE the card, when the key is in hand or the pack is full.
  // (A qty>1 stack decrements and stows the new one; restores itself if full.)
  swapItem(fromKey, toKey) {
    if (this.hands === fromKey) { this.hands = toKey; return true; }
    const doSlot = (arr, i) => {
      if (arr[i].qty > 1) { arr[i].qty -= 1; if (this.stow(toKey, 1) > 0) return true; arr[i].qty += 1; return false; }
      arr[i] = { item: toKey, qty: 1 }; return true;
    };
    let i = this.pockets.findIndex((s) => s && s.item === fromKey);
    if (i >= 0) return doSlot(this.pockets, i);
    if (this.backpack) {
      if (this.backpack.weapon === fromKey) { this.backpack.weapon = toKey; return true; }
      i = this.backpack.slots.findIndex((s) => s && s.item === fromKey);
      if (i >= 0) return doSlot(this.backpack.slots, i);
    }
    return false;
  }

  // Total count of a named item across hand, pockets, and backpack.
  countItem(key) {
    let n = 0;
    if (this.hands === key) n += 1;
    for (const s of this.pockets) if (s && s.item === key) n += s.qty;
    if (this.backpack) {
      if (this.backpack.weapon === key) n += 1;
      for (const s of this.backpack.slots) if (s && s.item === key) n += s.qty;
    }
    return n;
  }

  // Can the OB_gun be crafted right now? (Stun-gun + electro-gun + Wi-Fi block.)
  canCraftObGun() {
    return this.hasItem('stungun') && this.hasItem('electrogun') && this.hasItem('wifiblock');
  }

  // Eight chip fragments (shed by destroyed machines) assemble into a whole
  // access chip.
  canCraftChip() {
    return this.countItem('chip_fragment') >= CHIP_FRAGMENTS_PER_CHIP;
  }

  craftChip() {
    if (!this.canCraftChip()) { this.say(`You need ${CHIP_FRAGMENTS_PER_CHIP} chip fragments; you have ${this.countItem('chip_fragment')}.`); return false; }
    for (let n = 0; n < CHIP_FRAGMENTS_PER_CHIP; n++) this.removeItem('chip_fragment');
    const stored = this.stow('chip', 1);
    if (stored <= 0) { this.say('No room to assemble the chip — free a slot first.');
      // put the fragments back so the craft isn't a silent loss
      for (let n = 0; n < CHIP_FRAGMENTS_PER_CHIP; n++) this.stow('chip_fragment', 1);
      return false;
    }
    sfx.play('zap');
    this.say('Eight fragments lock together into a working access chip.');
    return true;
  }

  // Piece the scattered fortress-map fragments into a whole fortress map.
  canCraftFortressMap() {
    return !this.hasItem('fortress_map') && this.countItem('fortress_map_fragment') >= FORTRESS_MAP_FRAGMENTS;
  }

  craftFortressMap() {
    if (!this.canCraftFortressMap()) {
      this.say(`You need ${FORTRESS_MAP_FRAGMENTS} fortress-map fragments; you have ${this.countItem('fortress_map_fragment')}.`);
      return false;
    }
    for (let n = 0; n < FORTRESS_MAP_FRAGMENTS; n++) this.removeItem('fortress_map_fragment');
    const stored = this.stow('fortress_map', 1);
    if (stored <= 0) {
      this.say('No room to piece the map together — free a slot first.');
      for (let n = 0; n < FORTRESS_MAP_FRAGMENTS; n++) this.stow('fortress_map_fragment', 1);
      return false;
    }
    sfx.play('zap');
    this.say('The fragments align into a whole fortress map — the maze laid bare. Carry it in and the way will light.');
    return true;
  }

  // Ten scrap beaten into a robot sword — a heavy anti-machine melee blade.
  canCraftSword() {
    return this.countItem('scrap') >= SCRAP_PER_SWORD && !this.hasItem('robot_sword');
  }

  // Night-vision goggles from 5 torches (their phosphor) + a circuit board (to
  // drive the tube) — see items.js. Another use for the circuit boards obelisks
  // drop, and the thing that lets you move under POSEIDON's fog.
  canCraftGoggles() {
    return this.countItem('torch') >= TORCHES_PER_GOGGLES && this.hasItem('circuit') && !this.hasItem('goggles');
  }

  craftGoggles() {
    if (!this.canCraftGoggles()) {
      this.say(`Goggles need ${TORCHES_PER_GOGGLES} torches and a circuit board.`);
      return false;
    }
    for (let n = 0; n < TORCHES_PER_GOGGLES; n++) this.removeItem('torch');
    this.removeItem('circuit');
    if (!this.stow('goggles', 1)) { this.say('No room for the goggles.'); return false; }
    sfx.play('zap');
    this.say('You strip five torch-heads for their phosphor and wire them to a board: night-vision goggles. Click them to wear them.');
    return true;
  }

  // The bluebox — a reprogrammer soldered from circuit boards. One per player.
  canCraftBluebox() {
    return !this.hasItem('bluebox') && this.countItem('circuit') >= BLUEBOX_CRAFT_CIRCUITS;
  }

  craftBluebox() {
    if (!this.canCraftBluebox()) {
      this.say(this.hasItem('bluebox') ? 'You already carry a bluebox.' : `A bluebox needs ${BLUEBOX_CRAFT_CIRCUITS} circuit boards.`);
      return false;
    }
    for (let n = 0; n < BLUEBOX_CRAFT_CIRCUITS; n++) this.removeItem('circuit');
    if (!this.stow('bluebox', 1)) { this.say('No room for the bluebox.'); return false; }
    sfx.play('zap');
    this.say('You solder the boards into a bluebox. Stun a machine, then press U beside it to rewrite it into a gardener.');
    return true;
  }

  // Repairing the broken laptop (docs/PLAN.md §3a). There is one machine
  // in this game and this is how you come by it: find a dead one, solder circuit
  // boards into it, and it is yours. The disk always survived — what died was the
  // board — so the files and the manual come back with it.
  canRepairLaptop() {
    if (!this.hasItem('laptop_broken') || this.laptop) return false;
    return LAPTOP_REPAIR.every(([k, n]) => this.countItem(k) >= n);
  }

  // What the repair still wants, for the message and the HUD hint. Pluralised,
  // because "2 more battery" is the kind of small wrongness that makes a game
  // read as unfinished.
  laptopRepairShort() {
    return LAPTOP_REPAIR.filter(([k, n]) => this.countItem(k) < n)
      .map(([k, n]) => {
        const short = n - this.countItem(k);
        const name = (ITEMS[k] ? ITEMS[k].name.toLowerCase() : k);
        // battery -> batteries, not batterys. A consonant before a final y takes
        // -ies; everything else in this recipe takes a plain s.
        const many = /[^aeiou]y$/.test(name) ? `${name.slice(0, -1)}ies` : `${name}s`;
        return `${short} more ${short === 1 ? name : many}`;
      });
  }

  repairLaptop(makeDisk) {
    if (!this.canRepairLaptop()) {
      if (this.laptop) this.say('You already carry a working NostBook.');
      else if (this.hasItem('laptop_broken')) this.say(`The board is scorched. It needs ${this.laptopRepairShort().join(' and ')}.`);
      return false;
    }
    for (const [k, n] of LAPTOP_REPAIR) for (let i = 0; i < n; i++) this.removeItem(k);
    this.removeItem('laptop_broken');
    this.laptop = { model: 'laptop', os: 'unix', fs: makeDisk(), heat: 0, damage: null, netUp: true };
    sfx.play('zap');
    achieveEvent('laptopFixed', {});
    this.say('You strip the cells and the chip fragments into the burnt board, and the screen catches. The disk was never the problem. Press L.');
    return true;
  }

  // The OB SPOOFER (docs/PLAN.md): stand under a tower, transmit, and the
  // machine's own control wire hears an obelisk that is not there. Every unit
  // HOMED TO THAT TOWER takes its orders from you from then on.
  //
  // This is deliberately the opposite trade to the bluebox. The bluebox is
  // surgical and safe: one machine at a time, and it must already be down. The
  // spoofer takes a whole garrison at once, standing in the open, under the eye,
  // and costs a battery — and you only know whether the garrison is worth the
  // charge because you read the tower's own page first. The web is the recon;
  // this is what the recon was for.
  spoofObelisk(obeliskObjs = [], robots = [], map) {
    if (!this.hasItem('ob_spoofer')) { this.say('You have no OB spoofer.'); return false; }
    let best = null, bd = SPOOF_RANGE * SPOOF_RANGE;
    for (const ob of obeliskObjs) {
      if (ob.destroyed) continue;
      const d = (ob.x + 0.5 - this.x) ** 2 + (ob.y + 0.5 - this.y) ** 2;
      if (d < bd) { bd = d; best = ob; }
    }
    if (!best) { this.say('No tower in range. The spoofer only reaches a few squares — you have to stand under it.'); return false; }
    if (best.spoofed) { this.say(`${best.code} already answers to you.`); return false; }
    if (!this.removeItem('battery')) { this.say('The spoofer needs a battery.'); return false; }

    best.spoofed = true;
    // Its garrison is whoever the network homed to this tower — the same list the
    // tower publishes on its own page.
    let turned = 0;
    for (const r of robots) {
      if (r.dead || r.friendly || r.hardened) continue;
      if (r._netHome !== best.code) continue;
      r.friendly = true;
      r.aggro = false;
      r.spoofedBy = best.code;
      turned += 1;
    }
    sfx.play('zap');
    this.say(turned
      ? `The spoofer takes ${best.code}'s voice. ${turned} unit${turned === 1 ? '' : 's'} homed to it turn and wait for your orders.`
      : `The spoofer takes ${best.code}'s voice — but nothing is homed to it. Read a tower's page before you spend a cell.`);
    return true;
  }

  // Install a found machine into the slot (E while holding one).
  installLaptop(makeDisk) {
    if (!this.removeItem('laptop')) return false;
    this.laptop = { model: 'laptop', os: 'unix', fs: makeDisk(), heat: 0, damage: null, netUp: true };
    sfx.play('keydrop');
    this.say('The lid comes up and it boots on the first try. Press L.');
    return true;
  }

  // Salvage a dead machine's disk onto yours (E while holding one). The board is
  // gone; the platter is not. Each archive lands in its OWN FOLDER under
  // /salvage, named for whoever owned it, so your own /home stays yours and the
  // dead keep their names on their work.
  //
  // This is why found machines are not swapped for yours: yours has your files
  // on it. A found one is somebody else's files, and that is the whole value.
  salvageLaptop(archives, graft) {
    if (!this.hasItem('dead_laptop')) return false;
    if (!this.laptop) { this.say('Nothing to read it ON. Repair your own machine first.'); return false; }
    if (!this.laptop.fs) { this.say('Your machine has no disk mounted.'); return false; }
    if (!this.salvaged) this.salvaged = [];
    const next = archives.find((x) => !this.salvaged.includes(x.owner));
    if (!next) { this.say('You have already read everything these disks had on them.'); return false; }
    const names = graft(this.laptop.fs, next);
    this.salvaged.push(next.owner);
    this.removeItem('dead_laptop');
    sfx.play('keydrop');
    this.say(`The disk reads. ${names.length} file(s) copied to /salvage/${next.owner} — open the NostBook (L) and: ls /salvage/${next.owner}`);
    return true;
  }

  // Bluebox a downed machine (U): splice new orders into a robot that has been
  // stunned, or is drained / recharging, turning it into a green-eyed GARDENER
  // that tends the blight. Costs a circuit board a splice — the constant use for
  // circuits. Refuses a live hunter (stun it first) and a hardened fortress guard.
  bluebox(robots = [], map) {
    if (!this.hasItem('bluebox')) { this.say('You have no bluebox — build one from circuit boards (C).'); return; }
    const near = (r) => Math.hypot(r.x - this.x, r.y - this.y) < 1.6;
    const inert = (r) => (r.disabledT || 0) > 0 || r.drained || r.recharging;
    const candidate = robots.filter((r) => !r.dead && !r.fused && !r.friendly && !r.gardener && near(r));
    const bot = candidate.find((r) => !r.hardened && inert(r));
    if (!bot) {
      if (candidate.some((r) => r.hardened)) { this.say('Its firmware is sealed — a fortress guard takes no new orders.'); return; }
      if (candidate.length) { this.say('It is still live — the bluebox only takes a machine that is down. Stun it first, or catch it recharging.'); return; }
      this.say('No downed machine within reach to splice.');
      return;
    }
    if (this.countItem('circuit') < BLUEBOX_CONVERT_COST) { this.say('The bluebox needs a circuit board to write with. Fell a tower for one.'); return; }
    for (let n = 0; n < BLUEBOX_CONVERT_COST; n++) this.removeItem('circuit');
    // #121: the box writes what you loaded into it (`bluebox <file>` on the
    // NostBook), or the gardener if you loaded nothing. The gardener stays the
    // default because it is the one conversion that needs no programming at all
    // — a player who never opens the laptop still gets the whole mechanic.
    //
    // FRIENDLY EITHER WAY. What the bluebox does is take the machine off the
    // network, and a machine off the network is not the estate's any more
    // whatever it then does with its legs. Writing your own program changes what
    // it does; it does not put it back under the tower.
    const custom = this.blueboxProgram || null;
    bot.gardener = !custom;
    bot.friendly = true;      // reads friendly: green eye, nothing targets it, it targets nothing
    bot.program = custom || W5_PROGRAM;  // its page reads as whatever it now runs
    bot._unwatermarked = !!custom;       // #126: your program carries no RON credentials
    bot.fault = null; bot.intent = null;
    bot.aggro = false;
    bot.hurt = false;
    bot.drained = false;
    bot.disabledT = 0;
    bot.recharging = false;
    bot.battery = 100;
    sfx.play('zap');
    if (map) this.sparkAt(map, bot.x, bot.y);
    // Three things at once, and each is a different achievement's business: a
    // gardener made, a machine pacified rather than killed, and a machine that
    // can no longer hurt anyone by any route at all.
    if (!custom) achieveEvent('gardenerMade', { type: bot.type });
    achieveEvent('unitPacified', { how: 'convert' });
    achieveEvent('madeSafe', { how: 'convert' });
    this.say(custom
      ? `You splice the bluebox into the ${bot.type.toUpperCase()}. Its eye flushes green and it comes up running ${this.blueboxFile || 'your program'} — off the network, and yours.`
      : `You splice the bluebox into the ${bot.type.toUpperCase()}. Its eye flushes green and it turns to the dead ground — a gardener now.`);
  }

  // THE BOT SNIFFER. Two boards and a cell: an aerial, a receiver and a screen.
  // It is the cheapest thing in the game that changes how the island reads,
  // because after it every machine on the hillside has a name on it.
  canCraftSniffer() {
    return !this.hasItem('sniffer') && this.countItem('circuit') >= SNIFFER_CRAFT_CIRCUITS
      && this.countItem('battery') >= 1;
  }

  craftSniffer() {
    if (!this.canCraftSniffer()) {
      this.say(this.hasItem('sniffer') ? 'You already carry a sniffer.'
        : `A bot sniffer needs ${SNIFFER_CRAFT_CIRCUITS} circuit boards and a battery.`);
      return false;
    }
    for (let n = 0; n < SNIFFER_CRAFT_CIRCUITS; n++) this.removeItem('circuit');
    this.removeItem('battery');
    if (!this.stow('sniffer', 1)) { this.say('No room for the sniffer.'); return false; }
    sfx.play('blip');
    this.say('You build a bot sniffer. Hold it and every machine in range wears its name; press Y to make one stand still and say it.');
    return true;
  }

  // The active sweep. It sends the same maintenance interrogation the tower
  // sends over the network, and the unit cannot tell the two apart — which is
  // the whole reason it works. `onSniff` files the report; the caller owns that,
  // because the wording of a status report belongs with the network code.
  sniff(robots = [], map) {
    if (!this.hasItem('sniffer')) { this.say('You have no bot sniffer — build one from circuit boards and a battery (C).'); return; }
    const inRange = (robots || []).filter((r) => !r.dead && !r.fused && !r.friendly
      && Math.hypot(r.x - this.x, r.y - this.y) <= SNIFFER_RANGE);
    if (!inRange.length) { this.say('Nothing on the air within range.'); return; }
    const target = inRange
      .filter((r) => (r.reportT || 0) <= 0 && (r.reportCool || 0) <= 0)
      .sort((a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y))[0];
    if (!target) { this.say('Every machine in range has just answered one. They will not answer another yet.'); return; }
    if (target.hardened) { this.say('A fortress guard does not take maintenance traffic. It ignores the wand.'); return; }
    sfx.play('blip');
    if (map) this.sparkAt(map, target.x, target.y);
    const name = this.onSniff ? this.onSniff(target) : target.type.toUpperCase();
    this.say(`${name} stops where it stands, and its lamp goes to a slow blue blink.`);
  }

  craftSword() {
    if (!this.canCraftSword()) { this.say(`You need ${SCRAP_PER_SWORD} scrap; you have ${this.countItem('scrap')}.`); return false; }
    for (let n = 0; n < SCRAP_PER_SWORD; n++) this.removeItem('scrap');
    if (this.hands && this.hands !== 'robot_sword') this.stow(this.hands, 1);
    this.hands = 'robot_sword';
    this.discoverWeapon('robot_sword');
    sfx.play('zap');
    this.say('You beat ten scrap into a robot sword. It bites the machines hard.');
    return true;
  }

  // A boat: 12 wood lashed together with a real cutting tool (axe/saw class —
  // anything that bites wood, treeDamage >= 2) in hand, built standing at the
  // water's edge. Not pocketed: craftBoat beaches it as a world object you
  // board (Stage 1b). One boat at a time (this.boatBuilt); Stage 1c persists it.
  canCraftBoat(map) {
    if (this.boatBuilt) return false;
    if (this.countItem('wood') < WOOD_PER_BOAT) return false;
    if ((ITEMS[this.hands]?.treeDamage ?? 0) < 2) return false;
    return !!this._findLaunchTile(map);
  }

  craftBoat(map) {
    if (this.boatBuilt) { this.say('Your boat is already beached at the shore.'); return false; }
    if (this.countItem('wood') < WOOD_PER_BOAT) {
      this.say(`You need ${WOOD_PER_BOAT} wood to build a boat; you have ${this.countItem('wood')}.`);
      return false;
    }
    if ((ITEMS[this.hands]?.treeDamage ?? 0) < 2) {
      this.say('You need a proper cutting tool in hand — a saw or a good blade — to fell and shape the timber.');
      return false;
    }
    const tile = this._findLaunchTile(map);
    if (!tile) { this.say("You must be at the water's edge to launch a boat."); return false; }
    const boat = map.addObject('boat', tile.x, tile.y, { hull: BOAT_HULL, maxHull: BOAT_HULL });
    if (!boat) { this.say('No room at the shore to set the boat down.'); return false; }
    for (let n = 0; n < WOOD_PER_BOAT; n++) this.removeItem('wood');
    this.boatBuilt = true;
    sfx.play('zap');
    this.say("You lash the timber into a boat, beached at the water's edge. Board it to cross the sea.");
    return true;
  }

  // A proper sea-going ship (Stage 1d). Needs Calypso's recipe (the bronze axe,
  // dropped when you refunction her via `retire`) plus wood and the three found
  // parts — oar, rope, sail. The recipe is NOT consumed, so you can build again.
  // Beached at the shore like the boat, but seaworthy: only a greek_ship leaves.
  canCraftGreekShip(map) {
    if (this.shipBuilt) return false;
    if (!this.hasItem('bronze_axe')) return false;
    if (this.countItem('wood') < WOOD_PER_SHIP) return false;
    if (!this.hasItem('oar') || !this.hasItem('rope') || !this.hasItem('sail')) return false;
    return !!this._findLaunchTile(map);
  }

  craftGreekShip(map) {
    if (this.shipBuilt) { this.say('Your ship is already beached at the shore.'); return false; }
    if (!this.hasItem('bronze_axe')) { this.say("You need Calypso's recipe — her bronze axe — to build a sea-worthy ship. She gives it up when she lets you go."); return false; }
    if (this.countItem('wood') < WOOD_PER_SHIP) { this.say(`You need ${WOOD_PER_SHIP} wood for a proper ship; you have ${this.countItem('wood')}.`); return false; }
    if (!this.hasItem('oar') || !this.hasItem('rope') || !this.hasItem('sail')) {
      this.say('A sea-worthy ship needs an oar, a rope, and a sail. Find them at the wrecks and huts along the coast.');
      return false;
    }
    const tile = this._findLaunchTile(map);
    if (!tile) { this.say("You must be at the water's edge to lay a ship's keel."); return false; }
    const ship = map.addObject('greek_ship', tile.x, tile.y, { hull: BOAT_HULL, maxHull: BOAT_HULL, seaworthy: true });
    if (!ship) { this.say('No room at the shore to set the ship down.'); return false; }
    for (let n = 0; n < WOOD_PER_SHIP; n++) this.removeItem('wood');
    this.removeItem('oar'); this.removeItem('rope'); this.removeItem('sail');
    this.shipBuilt = true;
    sfx.play('zap');
    this.say("To Calypso's recipe you raise a proper ship — oar shipped, rope fast, sail bent on. It rides the swell at the water's edge. Board it and cross the sea.");
    return true;
  }

  // Board a beached vessel and cross the sea (Stage 1b/1d). Only a seaworthy
  // greek_ship survives the crossing off Ogygia; the plain boat-no-sail is never
  // sea-ready, so Poseidon's swell flings it back onto the sand.
  boardBoat(map, boat) {
    if (this._ended || this.deathCert) return;
    // A sea-worthy hull is not enough on its own (#141). Poseidon runs on the
    // obelisk net and the net has to have been told. Without that the launch
    // still HAPPENS — you row out and the sea sends you home — because the
    // refusal has always belonged to him rather than to a locked door.
    if (boat && boat.seaworthy && !this.seaPermission) {
      if (this.onDepartFail && this.onDepartFail(this, boat) !== false) return;
      this.say('You push off, and the swell stands up against you. The ship is sound. Something else is not.');
      this.x -= this.facing.x * 1.5;
      this.y -= this.facing.y * 1.5;
      return;
    }
    if (boat && boat.seaworthy) {
      // The crossing switches worlds, which is a main.js concern (goToWorld, and
      // it must defer to a clean frame boundary), so hand off to the wired hook:
      // it sails you to the next island rather than ending the run. The victory
      // certificate below is the standalone fallback (no crossing wired — unit
      // tests), preserved so a seaworthy launch always at least resolves.
      if (this.onDepart) { this.onDepart(this, boat); return; }
      this._ended = true;
      this.deathCert = {
        name: this.name, gender: this.gender,
        cause: 'you sailed from Ogygia', score: this.score,
        skills: [...this.skills], deaths: this.deaths || 0,
        victory: true, escaped: true, ...modeStamp(this),
      };
      sfx.play('zap');
      this.say('You push off the sand and step aboard. The sea heaves but does not close over you. Calypso has let you go. You have left Ogygia.');
    } else {
      // An unfinished boat still LAUNCHES. The refusal is not a locked door: you
      // get to push off, you get out onto the water, and the sea turns you back.
      // Poseidon is the one saying no, not the game — so hand off to the failed-
      // crossing sequence (main.js drives it: it moves the world, so it can't
      // resolve here). It declines with `false` when there is no open water to
      // sail into at all, and then — as with no hook wired, in the unit tests —
      // you get the plain bounce, because there was never a voyage to have.
      if (this.onDepartFail && this.onDepartFail(this, boat) !== false) return;
      this.washedBack();
    }
  }

  // Shoved off the water before you were properly on it.
  washedBack() {
    sfx.play('hurt');
    this.say(`You launch, and the swell rises against you. Poseidon hurls the boat back onto the beach. ${this.launchHint()}`);
    this.x -= this.facing.x * 1.5;
    this.y -= this.facing.y * 1.5;
  }

  // What you still need before the sea will have you. Shared by the instant
  // bounce and the failed-crossing sequence, so they can never drift apart.
  launchHint() {
    return this.hasItem('bronze_axe')
      ? "This is no ship for the open sea. Build a proper one to Calypso's recipe — wood, oar, rope, and sail."
      : "This is no ship for the open sea, and Calypso has not released you. Refunction her at the fortress, then build a proper ship to her recipe.";
  }

  // The nearest walkable land tile at the sea's edge (8-adjacent to an open-sea
  // tile), within BOAT_LAUNCH_RADIUS of the player and clear of objects — where
  // a crafted boat is beached. Excludes the player's own tile so building never
  // traps you inside the hull. Returns {x, y} or null (not at the shore).
  _findLaunchTile(map) {
    if (!map) return null;
    const px = Math.floor(this.x), py = Math.floor(this.y);
    const seaAdjacent = (x, y) => {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        if (map.floorAt(x + dx, y + dy) === 'sea') return true;
      }
      return false;
    };
    let best = null, bestD = Infinity;
    const R = BOAT_LAUNCH_RADIUS;
    for (let y = py - R; y <= py + R; y++) {
      for (let x = px - R; x <= px + R; x++) {
        if (!map.inBounds(x, y)) continue;
        if (x === px && y === py) continue;         // never under the player
        const f = map.floorAt(x, y);
        if (f === 'sea' || f === 'water') continue;  // must be land, not water
        if (map.objectAt(x, y)) continue;            // tile must be free
        if (!seaAdjacent(x, y)) continue;            // right at the sea's edge
        const d = (x - px) * (x - px) + (y - py) * (y - py);
        if (d < bestD) { bestD = d; best = { x, y }; }
      }
    }
    return best;
  }

  // Eight distinct numbered circuit boards (from destroyed obelisks) build a
  // wave gun.
  canCraftWaveGun() {
    return this.circuitNums.size >= 8 && this.hasItem('circuit') && !this.weaponsFound.has('wavegun');
  }

  craftWaveGun(map) {
    if (!this.canCraftWaveGun()) { this.say('You need all eight numbered circuit boards.'); return false; }
    for (let n = 0; n < 8; n++) this.removeItem('circuit');
    this.circuitNums.clear();
    if (this.hands && this.hands !== 'wavegun') this.stow(this.hands, 1);
    this.hands = 'wavegun';
    this.discoverWeapon('wavegun');
    sfx.play('zap');
    this.say('The eight boards click together into a wave gun. It fans laser-fire across a whole crowd.');
    return true;
  }

  // Combine the three into the OB_gun and take it in hand. The Wi-Fi block is
  // consumed, so main respawns a fresh one somewhere random.
  craftObGun(map) {
    if (!this.canCraftObGun()) { this.say('You need a stun-gun, an electro-gun and a Wi-Fi block.'); return false; }
    this.removeItem('stungun');
    this.removeItem('electrogun');
    this.removeItem('wifiblock');
    if (this.hands && this.hands !== 'obgun') this.stow(this.hands, 1);
    this.hands = 'obgun';
    this.discoverWeapon('obgun');
    sfx.play('zap');
    this.say('You wire the three together into an OB_gun. It hums, hungry for a tower.');
    return true;
  }

  // A ground-item drop that carries the Wi-Fi block's remaining charge, so a
  // dropped block keeps its charge instead of resetting to full on re-pickup.
  giDrop(item, qty, x, y) {
    const g = { item, qty, x, y };
    if (item === 'wifiblock') g.power = this.wifiPower;
    return g;
  }

  // A brief burst of sparks where a weapon lands on a robot. Purely visual;
  // main.js ticks the ttl and the renderer draws + prunes it.
  sparkAt(map, x, y) {
    (map.sparks ??= []).push({ x, y, ttl: 0.3, max: 0.3 });
  }

  // A bright burst — several sparks scattered around a point (electro-gun kills).
  sparkBurst(map, x, y) {
    const off = [[0, 0], [0.4, 0.1], [-0.3, 0.2], [0.2, -0.3], [-0.25, -0.2]];
    for (const [ox, oy] of off) (map.sparks ??= []).push({ x: x + ox, y: y + oy, ttl: 0.35, max: 0.35 });
  }

  // Startle nearby animals into fleeing (e.g. the electro-gun's crackle). Sets
  // a scared timer that updateAnimals turns into a run away from the player.
  scareAnimals(animals, range) {
    for (const a of (animals || [])) {
      if (a.dead) continue;
      if (Math.hypot(a.x - this.x, a.y - this.y) > range) continue;
      a.scaredT = Math.max(a.scaredT || 0, 3);
      if (a.type === 'dog') { a.fleeTimer = Math.max(a.fleeTimer || 0, 3); a.aggro = false; }
    }
  }

  // How far a beam actually reaches along the facing direction before a
  // solid object (wall, tree, rock, wreck) cuts it short. Never further
  // than maxRange.
  beamRange(map, maxRange) {
    const steps = Math.ceil(maxRange * 4);
    for (let i = 1; i <= steps; i++) {
      const t = (i / steps) * maxRange;
      const x = Math.floor(this.x + this.facing.x * t), y = Math.floor(this.y + this.facing.y * t);
      if (map.blocksShot(x, y)) return t;
    }
    return maxRange;
  }

  // ---- generic slot access (for click-equip and pointer drag) ----------

  // Read the {item, qty} in a slot descriptor, or null.
  getSlot(slot) {
    if (slot.kind === 'hands') return this.hands ? { item: this.hands, qty: 1 } : null;
    if (slot.kind === 'bw') return this.backpack && this.backpack.weapon ? { item: this.backpack.weapon, qty: 1 } : null;
    if (slot.kind === 'pocket') return this.pockets[slot.i] || null;
    if (slot.kind === 'bpstore') return this.backpack ? (this.backpack.slots[slot.i] || null) : null;
    if (slot.kind === 'walkman') return this.walkman || null;
    // Worn armour. A piece carries its own wear, so the slot value keeps `dur`
    // and it travels with the piece — drag a half-spent helm into the pack and
    // it is still half spent when you take it out.
    if (slot.kind === 'armour') {
      const w = this.armour && this.armour[slot.i];
      return w ? { item: w.item, qty: 1, dur: w.dur } : null;
    }
    // THE LAPTOP SLOT. It was display-and-click only, so a NostBook picked up
    // off the ground went into a pocket and answered "can't hold nostbook in
    // hand" — the one machine in the game with a slot of its own, and no way
    // to put it there. The whole machine rides in the slot value, because the
    // disk is on it and a drag that dropped the filesystem would be a theft.
    if (slot.kind === 'laptop') {
      return this.laptop ? { item: this.laptop.model || 'laptop', qty: 1, machine: this.laptop } : null;
    }
    // 'packbadge' is a drop-onto-the-backpack target only, never a source: you
    // don't drag the bag itself, so it reads as empty.
    return null;
  }

  setSlot(slot, val) {
    if (slot.kind === 'hands') { this.hands = val ? val.item : null; return true; }
    if (slot.kind === 'bw') { if (!this.backpack) return false; this.backpack.weapon = val ? val.item : null; return true; }
    if (slot.kind === 'pocket') { this.pockets[slot.i] = val; return true; }
    if (slot.kind === 'bpstore') { if (!this.backpack) return false; this.backpack.slots[slot.i] = val; return true; }
    if (slot.kind === 'laptop') {
      if (!val) { this.laptop = null; return true; }
      const def = ITEMS[val.item];
      // Only a WORKING machine sits in the cradle. A burnt board is cargo until
      // it is repaired (repairLaptop), and refusing here is what tells moveItem
      // to leave it where it was rather than swallowing it.
      if (!def || def.kind !== 'laptop' || val.item !== 'laptop') return false;
      // No `fs` here: player.js does not import unix.js (repairLaptop takes
      // makeDisk as an argument for exactly that reason), and openLaptop
      // already grafts a disk onto a machine that arrives without one.
      this.laptop = val.machine
        || { model: val.item, os: 'unix', heat: 0, damage: null, netUp: true };
      return true;
    }
    if (slot.kind === 'armour') {
      // A slot takes only the piece made for it: a cuirass will not go on your
      // head, and refusing is how moveItem knows to leave the source alone.
      if (!this.armour) this.armour = { head: null, chest: null, legs: null, feet: null };
      if (!val) { this.armour[slot.i] = null; return true; }
      const def = ITEMS[val.item];
      if (slotOf(def) !== slot.i) return false;
      this.armour[slot.i] = { item: val.item, dur: val.dur != null ? val.dur : (def.maxDur || 1) };
      return true;
    }
    // Dropping onto the backpack badge (the bag icon on the dashboard) stows the
    // item into the first free storage slot — the natural "put it in the bag"
    // gesture, and how you get a pocket item into the pack without opening it.
    if (slot.kind === 'packbadge') {
      if (!this.backpack || !val) return false;
      const free = this.backpack.slots.findIndex((s) => !s);
      if (free < 0) return false; // pack full: refuse (moveItem leaves the source alone)
      this.backpack.slots[free] = val;
      return true;
    }
    if (slot.kind === 'walkman') {
      // Any change of tape stops playback — the new one starts stopped and
      // wants a click, same as a real deck after a swap.
      this.walkman = val || null;
      if (this.walkmanSide) { this.walkmanSide = null; sfx.stopTape(); } // back to the ambient bed
      return true;
    }
    return false;
  }

  // Drag one slot's contents onto another, swapping if the target is full.
  // The hands and spare-weapon slots only accept a single holdable item.
  moveItem(from, to) {
    const a = this.getSlot(from);
    if (!a) return;
    const b = this.getSlot(to);
    const onlyHoldable = (s) => s.kind === 'hands' || s.kind === 'bw';
    if (onlyHoldable(to) && (!canHold(a.item) || a.qty > 1)) {
      this.say("That won't go in the hand.");
      return;
    }
    if (onlyHoldable(from) && b && (!canHold(b.item) || b.qty > 1)) {
      this.say("Can't swap that into the hand.");
      return;
    }
    if (to.kind === 'walkman' && ITEMS[a.item].kind !== 'tape') {
      this.say('Only a cassette fits the walkman.');
      return;
    }
    // Place into the target FIRST and only clear the source if that succeeded —
    // otherwise a target that can't take the item (a full backpack, a badge with
    // no room) would delete it. Never move an item into nowhere.
    if (!this.setSlot(to, a)) {
      this.say(to.kind === 'packbadge' ? 'The backpack is full.' : "That won't go there.");
      return;
    }
    this.setSlot(from, b || null);
    this.say(`Moved ${ITEMS[a.item].name.toLowerCase()}.`);
  }

  // Equip / stow via a clicked dashboard or backpack slot. Clicking a pocket
  // (or the spare-weapon slot) swaps it with the hands slot; clicking the
  // hands slot puts the held item away; clicking a backpack storage slot
  // takes a weapon from it into the hand. The forcefield and electro-compass
  // are the exception: clicking either in any slot just arms/disarms it in
  // place — you never need to hold them, since they work the moment they're
  // carried and armed.
  equipSlot(slot) {
    // The walkman is a deck, not a stow slot: a click on the tape in it
    // cycles play side A -> flip to side B -> stop, driving the same music
    // system as the M key (which still works, and simply overrides this).
    if (slot.kind === 'walkman') {
      if (!this.walkman) { this.say('The walkman is empty. A cassette would fit.'); return; }
      const def = ITEMS[this.walkman.item];
      if (this.walkmanSide === 'A') {
        this.walkmanSide = 'B';
        sfx.playTape(def.sideB.tracks);
        this.say(`You flip the tape over. Side B — "${def.sideB.label}".`);
      } else if (this.walkmanSide === 'B') {
        this.walkmanSide = null;
        sfx.stopTape(); // back to the ambient synth bed
        this.say('The walkman clunks to a stop.');
      } else {
        this.walkmanSide = 'A';
        sfx.playTape(def.sideA.tracks);
        this.say(`The spools catch and turn. Side A — "${def.sideA.label}".`);
      }
      // Liner notes for the HUD toast (main.js): artist, album, side label.
      if (this.onTapeToast) this.onTapeToast(def, this.walkmanSide);
      return;
    }
    const held = this.getSlot(slot);
    if (held && held.item === 'forcefield') {
      this.toggleForcefield();
      return;
    }
    if (held && held.item === 'compass') {
      this.compassArmed = !this.compassArmed;
      this.say(this.compassArmed ? 'Compass armed — the chevrons will home on anything notable nearby.' : 'Compass disarmed.');
      return;
    }
    if (held && held.item === 'goggles') {
      this.gogglesOn = !this.gogglesOn;
      this.say(this.gogglesOn ? 'Goggles on. The fog goes green and thin, and you can see.' : 'Goggles up. The fog closes back in.');
      return;
    }
    // Clicking the dead NostBook says what its board still wants, from whatever
    // slot it is in. This is the one item in the game whose entire purpose is a
    // recipe you cannot see, and until now a tap on it silently moved it to your
    // hand and told you nothing — so the machine the rest of the game hangs off
    // could sit in a pocket, unbuilt, because nothing ever said what it took.
    if (held && held.item === 'laptop_broken') {
      if (this.laptop) { this.say('You already carry a working NostBook. This one is spares.'); return; }
      const short = this.laptopRepairShort();
      this.say(short.length
        ? `The board is burnt through. It needs ${short.join(' and ')}, soldered in with C. Both come out of wrecked machines.`
        : 'You have what the board needs: two cells and two chip fragments. Press C to rebuild it.');
      return;
    }
    // Clicking a printed map (in any slot) just unfolds it — no need to move
    // it to the hand first.
    if (held && held.item === 'printed_map') {
      if (this.onReadMap) this.onReadMap(); else this.say('You unfold the map.');
      return;
    }
    // Clicking food (in a pocket, the pack, or the weapon sleeve) eats one of
    // it — the touch way to eat, since mobile has no E key. Same rules as
    // eat(): no gorging when nearly full, and the lotus is still the lotus.
    if (held && ITEMS[held.item] && ITEMS[held.item].food != null
        && (slot.kind === 'pocket' || slot.kind === 'bpstore' || slot.kind === 'bw')) {
      if (this.food >= this.maxFood - 2) { this.say('You are not hungry.'); return; }
      const key = held.item;
      if (held.qty > 1) held.qty -= 1; else this.setSlot(slot, null);
      this.consumeFood(key);
      return;
    }
    if (slot.kind === 'pocket') { this.selectedPocket = slot.i; this.swapHands(); return; }
    if (slot.kind === 'bw') { this.selectedPocket = 'bw'; this.swapHands(); return; }
    if (slot.kind === 'hands') {
      if (!this.hands) return;
      const item = this.hands;
      if (this.stow(item, 1) > 0) {
        this.hands = null;
        this.say(`You put the ${ITEMS[item].name.toLowerCase()} away.`);
      } else {
        this.say('No room to stow it.');
      }
      return;
    }
    if (slot.kind === 'bpstore' && this.backpack) {
      const s = this.backpack.slots[slot.i];
      // Same as the pockets: a book/note in the backpack reads on click.
      if (s && ITEMS[s.item].kind === 'book') {
        const key = s.item;
        if (s.qty > 1) s.qty -= 1; else this.backpack.slots[slot.i] = null;
        this.learnFromBook(key);
        return;
      }
      if (s && (!canHold(s.item) || s.qty > 1)) {
        // Not a hand item (or a whole stack): one tap moves it to the first
        // free pocket instead — the mobile-friendly swap out of the pack.
        const free = this.pockets.findIndex((ps) => !ps);
        if (free < 0) { this.say('Pockets are full.'); return; }
        this.pockets[free] = s;
        this.backpack.slots[slot.i] = null;
        this.say(`Moved ${ITEMS[s.item].name.toLowerCase()} to a pocket.`);
        return;
      }
      const held = this.hands;
      this.hands = s ? s.item : null;
      this.backpack.slots[slot.i] = held ? { item: held, qty: 1 } : null;
      this.say(this.hands ? `You ready the ${ITEMS[this.hands].name.toLowerCase()}.` : 'You put your weapon away.');
    }
  }

  update(dt, input, map, animals = [], robots = [], mouseWorld = null) {
    this.noteGround();
    this.swingTimer = Math.max(0, this.swingTimer - dt);
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    if (this.ubikFlickerT > 0) this.ubikFlickerT = Math.max(0, this.ubikFlickerT - dt);
    if (this._ubikTeleportCooldown > 0) this._ubikTeleportCooldown = Math.max(0, this._ubikTeleportCooldown - dt);
    // Standing in a brightened Ubik patch, reality hiccups every so often —
    // a brief discolour, lean, or twist, like the ground hasn't quite
    // decided it's real yet. Purely cosmetic; renderer.js reads
    // ubikHiccupT/Kind. Rolled here (not in the renderer) so the effect
    // persists smoothly across frames instead of re-rolling every draw.
    if (this.ubikHiccupT > 0) this.ubikHiccupT = Math.max(0, this.ubikHiccupT - dt);
    else if (map.ubikPatches && map.ubikPatches.some((p) => Math.hypot(p.x - this.x, p.y - this.y) < (p.r || 3))) {
      if (Math.random() < dt * 0.35) {
        this.ubikHiccupT = 0.25 + Math.random() * 0.2;
        this.ubikHiccupKind = ['discolor', 'lean', 'twist'][Math.floor(Math.random() * 3)];
      }
    }
    this.playSeconds += dt;
    if (this.message) {
      this.message.ttl -= dt;
      if (this.message.ttl <= 0) this.message = null;
    }
    if (this.daemonVoice) {
      this.daemonVoice.ttl -= dt;
      if (this.daemonVoice.ttl <= 0) this.daemonVoice = null;
    }
    this.unstickIfTrapped(map);

    // Depart-mode detention (R3): once you have been off her guards' radar for
    // DETAIN_COOL_TIME, the warning count resets so a fresh foray gets warned
    // again rather than going straight to lethal. Each detain hit zeroes the
    // timer (detainHit), so this only advances while no guard is striking you.
    if (this._detainStrikes) {
      this._detainCool = (this._detainCool || 0) + dt;
      if (this._detainCool >= DETAIN_COOL_TIME) { this._detainStrikes = 0; this._detainCool = 0; }
    }

    // Face the cursor at all times, independent of movement direction —
    // lets the player strafe while keeping a weapon trained on a target.
    // Also remembered so a thrown bomb can land where you're actually aiming.
    this.aimWorld = mouseWorld || this.aimWorld;
    if (mouseWorld) {
      const fx = mouseWorld.x - this.x, fy = mouseWorld.y - this.y;
      const flen = Math.hypot(fx, fy);
      if (flen > 1e-4) this.facing = { x: fx / flen, y: fy / flen };
    }

    // Hunger: food drains steadily, faster while sprinting. At zero you
    // starve; health only recovers when you are properly fed.
    // F1 (#140): on an island of PLENTY you do not get hungry. Ogygia is the
    // one place in the game where nothing is scarce, because comfort is the
    // trap and the trap should be comfortable. Everywhere else the clock in
    // your stomach runs.
    if (!(map && map.plenty)) {
      this.food = Math.max(0, this.food - FOOD_DRAIN * (this.sprinting ? FOOD_SPRINT_MULT : 1) * modeOf(this.mode).hunger * dt);
    } else if (this.food < this.maxFood) {
      this.food = Math.min(this.maxFood, this.food + FOOD_DRAIN * dt);
    }
    if (this.food <= 0) {
      this.health -= modeHarm(this, STARVE_DRAIN * dt);
      if (this.health <= 0) { this.die(map, 'starvation'); return; }
    }

    // Venom drains health over time; otherwise health slowly recovers
    // while well fed.
    // Standing among the old stones, on ground POSEIDON has not killed. Worked
    // out every tick rather than inside the regen branch, because the sanctuary
    // has to be known even at full health — that is when you leave it.
    {
      const gf0 = map.floorAt ? map.floorAt(Math.floor(this.x), Math.floor(this.y)) : null;
      const dead = gf0 === 'blight' || gf0 === 'blight_sick';
      this._inTemple = !dead && !!(map.temples
        && map.temples.some((t) => Math.hypot(t.x - this.x, t.y - this.y) < TEMPLE_HEAL_R));
      if (!this._inTemple) this._templeFrom = null;   // leaving resets the reckoning
    }
    if (this.venom > 0) {
      this.venom = Math.max(0, this.venom - dt);
      this.health -= modeHarm(this, VENOM_DRAIN * dt);
      if (this.health <= 0) this.die(map, 'the venom');
    } else if (this.health < this.maxHealth && (this.food > 50 || this._inTemple)) {
      // The marble temples hold a healing vibe: within an old grove, recovery
      // runs faster — the stones remember being sacred (map.temples is set
      // from placeRuins' grove centres in main.js).
      let regen = HEALTH_REGEN;
      // Dead ground does not heal you. On POSEIDON's blight the temple's stillness
      // is broken and even ordinary recovery crawls — so you cannot simply wait it
      // out in the grey, you have to take the tower that made it.
      const gf = map.floorAt ? map.floorAt(Math.floor(this.x), Math.floor(this.y)) : null;
      const onBlight = gf === 'blight' || gf === 'blight_sick';
      const temples = map.temples;
      if (!onBlight && temples && temples.some((t) => Math.hypot(t.x - this.x, t.y - this.y) < TEMPLE_HEAL_R)) {
        regen *= TEMPLE_HEAL_MULT;
        // Remember how badly you arrived, so coming down whole can be told from
        // topping up a scratch.
        if (this._templeFrom == null) this._templeFrom = this.health / this.maxHealth;
        if (!this._templeSaid) { this._templeSaid = true; this.say('A stillness among the old stones. Your wounds knit faster here.'); }
      } else if (this._templeSaid) this._templeSaid = false;
      if (onBlight) {
        regen *= 0.2;
        if (!this._blightSaid) { this._blightSaid = true; this.say('The dead ground gives nothing back. You will not mend here.'); }
      } else if (this._blightSaid) this._blightSaid = false;
      this.health = Math.min(this.maxHealth, this.health + regen * dt);
      if (this._inTemple && this.health >= this.maxHealth) {
        if (this._templeFrom != null && this._templeFrom < TEMPLE_HURT_ENOUGH) {
          achieveEvent('templeHealed', { from: Math.round(this._templeFrom * 100) });
          this.say('Whole again, among the stones. The machines have nothing that does this.');
        }
        this._templeFrom = null;
      }
    }

    // Lotus torpor: the daze bleeds off slowly, drains you while it lasts,
    // and rolls the ground under your feet — you walk drunk, not dragged
    // (Odyssey IX by way of the taverna). The sway loosens in the last few
    // seconds so the walk home is recoverable.
    if (this.lotusDaze > 0) this.lotusDaze = Math.max(0, this.lotusDaze - dt);
    if (this.torpor > 0) {
      this.torpor = Math.max(0, this.torpor - dt);
      this.food = Math.max(0, this.food - TORPOR_FOOD_DRAIN * dt);
    }
    // The woozy clock: two slow sines out of phase make the roll, and every
    // second or so the lean re-seeds so the stagger never metronomes. It runs
    // for the lotus AND for G1's grove-grip, which uses the same stagger with a
    // different cause — a clock that only ticked while a fruit was digesting
    // would leave the grove's sway frozen at whatever it happened to be.
    if (this.torpor > 0 || this.grip > 0) {
      this._woozyT = (this._woozyT || 0) + dt;
      this._woozyLurchT = (this._woozyLurchT || 0) - dt;
      if (this._woozyLurchT <= 0) {
        this._woozyLurchT = 1 + Math.random() * 1.2;
        this._woozyBias = (Math.random() - 0.5) * 1.6;
      }
    }

    // G1: the current. Her grove does not hold you in place, it eases you back
    // out — so this runs whether or not you are walking, and standing still deep
    // in it drifts you gently away from her. It is applied before the movement
    // below so a step and the drift compose rather than fight.
    if (this.grip > 0 && this._gripAt && !this._ended) {
      const ax = this.x - this._gripAt.x, ay = this.y - this._gripAt.y;
      const al = Math.hypot(ax, ay);
      if (al > 0.001) {
        const p = GRIP_PUSH * this.grip * this.grip * dt;
        this.moveAxis((ax / al) * p, 0, map);
        this.moveAxis(0, (ay / al) * p, map);
      }
    }

    const intent = input.moveIntent();
    this.moving = intent.dx !== 0 || intent.dy !== 0;
    // Washed ashore: you begin where the sea left you, flat on the sand. Any
    // movement (or a jump) gets you to your feet; until then you stay down —
    // no walking, no swinging, just the waves.
    if (this.lying) {
      if (this.moving || input.jumpPressed()) {
        this.lying = false;
        this._lieDir = undefined;   // on your feet: the sprite follows you again
        this.say('You get up. Sand in everything. But it is land, and it holds.');
      } else {
        this.moving = false;
        return;
      }
    }
    const wantSprint = input.sprinting() && this.moving;
    this.sprinting = wantSprint && this.stamina > 0;

    if (this.sprinting) {
      let drain = this.skills.has('fleetfoot') ? SPRINT_DRAIN * 0.45 : SPRINT_DRAIN;
      if (this.health < WOUNDED_AT) drain *= WOUNDED_SPRINT_DRAIN; // adrenaline is brief
      this.stamina = Math.max(0, this.stamina - drain * dt);
    } else {
      const regen = this.food < HUNGRY_AT ? STAMINA_REGEN * 0.5 : STAMINA_REGEN;
      this.stamina = Math.min(this.maxStamina, this.stamina + regen * dt);
    }

    if (this.moving) {
      const dir = screenDirToWorld(intent.dx, intent.dy);
      let speed = this.sprinting ? SPRINT_SPEED : WALK_SPEED;
      // Badly hurt, you hobble — though adrenaline still lets you sprint,
      // just not for long (see the wounded stamina drain above).
      if (this.health < WOUNDED_AT && !this.sprinting) speed = WOUNDED_SPEED;
      // Wading a stream is slow; swimming a river slower still; climbing
      // costs stamina (handled below).
      const under = map.floorAt(Math.floor(this.x), Math.floor(this.y));
      if (under === 'stream') speed *= 0.55;
      else if (under === 'water' || under === 'sea') speed *= 0.45;
      // Pushing through a walk-through tree's foliage slows you a little.
      const objHere = map.objectAt ? map.objectAt(Math.floor(this.x), Math.floor(this.y)) : null;
      if (objHere && objHere.type === 'tree') speed *= 0.75;
      // Lotus daze: heavy limbs. Fighting the pull out of the grove is slow work.
      if (this.torpor > 0) speed *= TORPOR_SLOW;
      // G1: her grove, and it drags at you less than a lotus fruit does. The
      // point is not that you cannot move — it is that you cannot move TOWARD
      // her, and that is the deflection below rather than this.
      if (this.grip > 0) speed *= 1 - GRIP_SLOW * this.grip;
      // Burden items (the anvil, the large stone): heavy is heavy, wherever
      // you put it. 10% pace, and the game says so once per pickup.
      const burden = this.carryingBurden();
      if (burden) {
        speed *= ANVIL_SLOW;
        if (!this._burdenSaid) { this._burdenSaid = true; this.say(`The ${ITEMS[burden].name.toLowerCase()} is exactly as heavy as it looks. You can barely move.`); }
      } else if (this._burdenSaid) this._burdenSaid = false;
      // Up on a block top, ease off the pace — the footprint is small and a
      // full walking speed makes edges twitchy to line up. Slower is easier
      // to control up there.
      // ONE SOURCE FOR THE GROUND UNDER YOU. The drop-off seeding and the
      // climb-on bleed below exist to keep the sprite's total lift continuous —
      // they are the fix for the original "jumpy on blocks" glitch — and they
      // only work if they are computed against the SAME height the renderer
      // lifts by. Lifting by `footZ` while compensating against
      // `effectiveHeightAt` put those two back out of step and the glitch came
      // straight back (David, 2026-08-16: "the player is glitchy jumping between
      // vertical layers"). `groundUnder` is that one source now.
      const effBefore = this.groundUnder(map, this.x, this.y);
      const hBefore = map.heightAt ? map.heightAt(Math.floor(this.x), Math.floor(this.y)) : 0;
      if (this.z === 0 && effBefore > hBefore) speed *= BLOCK_WALK_MULT;
      this.distanceTraveled += speed * dt;
      // Lotus daze: the direction you MEAN to walk rolls side to side under
      // you — a drunken heading sway you steer against, easing off as the
      // daze does.
      let mdx = dir.x, mdy = dir.y;
      // G1: A STEP AIMED AT HER SLIDES OFF. The turn is applied only to the part
      // of your heading that points at her core, so walking away is clean and
      // walking in is not — press straight at her and you arc past. Which way it
      // turns comes from where you are standing rather than from a coin, so it
      // is consistent: the room is not random, it is simply not letting you.
      if (this.grip > 0 && this._gripAt) {
        const tx = this._gripAt.x - this.x, ty = this._gripAt.y - this.y;
        const tl = Math.hypot(tx, ty) || 1;
        const toward = (dir.x * tx + dir.y * ty) / tl;   // -1..1
        if (toward > 0) {
          // The turn is the FULL angle for any step with an inward component,
          // rather than being scaled by how directly you are aiming. Scaling it
          // by `toward` was the first version and it has an obvious defeat:
          // approach at forty-five degrees, take the smaller turn, repeat. The
          // room does not negotiate about the angle you chose.
          const side = ((Math.floor(this.x) + Math.floor(this.y)) & 1) ? 1 : -1;
          const a = GRIP_TURN * this.grip * side;
          const cs = Math.cos(a), sn = Math.sin(a);
          mdx = dir.x * cs - dir.y * sn;
          mdy = dir.x * sn + dir.y * cs;
        }
      }
      const woozy = Math.max(this.torpor > 0 ? Math.min(1, this.torpor / 3) : 0, this.grip);
      if (woozy > 0) {
        const ease = woozy;
        const sway = (Math.sin(this._woozyT * 2.1) * 0.55
          + Math.sin(this._woozyT * 0.9 + 1.7) * 0.3
          + (this._woozyBias || 0) * 0.35) * TORPOR_SWAY * ease;
        const cs = Math.cos(sway), sn = Math.sin(sway);
        const bx = mdx, by = mdy;
        mdx = bx * cs - by * sn;
        mdy = bx * sn + by * cs;
      }
      this.moveAxis(mdx * speed * dt, 0, map);
      this.moveAxis(0, mdy * speed * dt, map);
      const effAfter = this.groundUnder(map, this.x, this.y);
      const hAfter = map.heightAt ? map.heightAt(Math.floor(this.x), Math.floor(this.y)) : 0;
      this.footZ = effAfter;    // and the renderer lifts by exactly this
      if (hAfter > hBefore) this.stamina = Math.max(0, this.stamina - CLIMB_COST);
      // Walked off the edge of a block onto lower ground: drop off it and
      // keep going, rather than snapping down. Seed `z` with the height lost —
      // DERIVED, not a hard 0.5: a level is ELEV pixels and z renders at Z_PX
      // per unit, so one level is `ELEV / Z_PX` of z. Writing that ratio out as
      // a number is how a constant goes stale the day somebody changes the
      // block height, and the symptom would be the sprite snapping down a cliff
      // instead of falling it.
      if (this.z === 0 && this.vz === 0 && effAfter < effBefore) {
        this.z = (effBefore - effAfter) * (ELEV / Z_PX);
        this.doubleJumped = false;
      } else if ((this.z > 0 || this.vz !== 0) && effAfter > effBefore) {
        // Inverse of the drop-off above: jumping or climbing ONTO a taller
        // tile (a crate, or a wall via the double jump). The terrain lift the
        // renderer applies (effectiveHeightAt * ELEV) jumps up by the whole
        // block height the instant your tile flips onto the block; bleed that
        // same height back out of the jump `z` so the sprite's total lift
        // stays continuous instead of popping up a block-height in one frame
        // (the "jumpy on blocks" glitch). Clamp at 0 — if the ledge was grabbed
        // before you rose to its height, you just settle onto it with no dip.
        this.z = Math.max(0, this.z - (effAfter - effBefore) * (ELEV / Z_PX));
      }
      this.walkPhase += dt * (this.sprinting ? 13 : 9);
      // Footstep on each stride, voiced by the surface underfoot.
      const stride = Math.floor(this.walkPhase / Math.PI);
      if (stride !== this.lastStride && this.z === 0) {
        this.lastStride = stride;
        sfx.step(map.floorAt(Math.floor(this.x), Math.floor(this.y)) || 'grass');
      }
    } else {
      this.walkPhase = 0;
    }

    // Swimming a river is exhausting: it drains stamina fast and chips at
    // health, whether you're moving or treading water. Get across and out.
    const swimFloor = map.floorAt(Math.floor(this.x), Math.floor(this.y));
    this.swimming = swimFloor === 'water' || swimFloor === 'sea';
    if (this.swimming) {
      this.stamina = Math.max(0, this.stamina - SWIM_STAMINA_DRAIN * dt);
      this.health = Math.max(0, this.health - modeHarm(this, SWIM_HEALTH_DRAIN * dt));
      if (this.health <= 0) { this.die(map, swimFloor === 'sea' ? 'the cold sea' : 'the cold river'); return; }
    }

    // Jump: purely vertical hop; collision footprint is unchanged. A normal
    // jump (from the ground) clears terrain steps and hops out of a dug pit
    // but is NOT tall enough to reach a block top. Press jump a second time
    // in mid-air for a double jump — a fresh upward kick that raises how
    // high you can step (see collides) just enough to land on a wall.
    const airborne = this.z > 0 || this.vz !== 0;
    if (input.jumpPressed()) {
      if (this.z === 0 && this.stamina >= JUMP_COST) {
        this.vz = JUMP_VZ;
        this.stamina -= JUMP_COST;
        this.doubleJumped = false;
        sfx.play('jump');
      } else if (airborne && !this.doubleJumped && this.stamina >= JUMP_COST) {
        this.vz = JUMP_VZ;         // fresh kick upward off the first hop
        this.stamina -= JUMP_COST;
        this.doubleJumped = true;
        sfx.play('jump');
      }
    }
    if (this.z > 0 || this.vz !== 0) {
      this.vz -= GRAVITY * dt;
      this.z += this.vz * dt;
      if (this.z <= 0) {
        this.z = 0;
        this.vz = 0;
        this.doubleJumped = false; // landed: next jump starts fresh
      }
    }

    // Wi-Fi block: works while carried anywhere, no need to hold it. Its
    // cell drains while active; when flat it pulls a fresh battery — but
    // only with a machine near, so it never wastes cells while you are safe.
    if (this.ownsWifiBlock()) {
      if (this.wifiPower > 0) {
        this.wifiPower = Math.max(0, this.wifiPower - dt);
      } else if (this.robotNear(robots) && this.consumeBattery()) {
        this.wifiPower = this.wifiMax;
        this.say('Your Wi-Fi block draws a fresh cell. You drop off their sensors.');
      } else if (this._wifiOn) {
        this.say('Your Wi-Fi block is flat. It needs a battery.');
      }
    }
    // Jacked into an obelisk terminal (with a chip), the obelisk shields you —
    // the machines lose you entirely, same as a live Wi-Fi block.
    //
    // CIRCE's swine (AEAEA) take the same road by the opposite route: the block
    // hides you by jamming the signal, she hides you by making you not a person.
    // Either way the network cannot find an intruder where there is none, and the
    // whole existing plumbing (distTo → Infinity, detection → false, guard
    // line-of-sight → false) already follows this one flag.
    this._wifiOn = this.ownsWifiBlock() && this.wifiPower > 0;
    // CREATIVE MEANS THE MACHINES DO NOT COME FOR YOU, which is a better answer
    // than absorbing blows nobody should have thrown (David, 2026-08-15: "rather
    // than check damage — maybe make everything passive — non-attacking. in
    // creative mode obviously").
    //
    // It reuses the mechanism the game already has and already trusts: the same
    // flag the Wi-Fi block sets, and a jacked-in operator, and a person Circe
    // has turned into a pig. Every sensing site in robots.js reads it — `distTo`
    // answers Infinity, `saw` and `canSee` answer false — so a Creative player
    // is not a target rather than being an invulnerable one, and the guards
    // never start the detain that stacks torpor and fogs the screen.
    //
    // `modeHarm` still returns 0, deliberately. Two independent guarantees, so
    // one new damage source cannot quietly undo the mode.
    this.invisibleToRobots = this.unseenByMachines();

    // A JAM IS NOT A SHIELD, AND A TERMINAL IS. The flag above hides you from
    // every machine's SENSORS, and the swarm classes deliberately look past it
    // when they strike: a held Wi-Fi block confuses the network, but a W1 that
    // has already triangulated its way on top of you still connects. That is
    // the right trade for a jammer you carry around and swing a bat next to.
    //
    // It is the wrong trade for a console. Jacked in you cannot move, cannot
    // dodge and cannot swing, and the obelisk says on its own banner that you
    // are hidden while you are in there. So the terminal carries a second,
    // stronger flag and the swarm reads THIS one before it hits.
    //
    // Fortress guards (M4/M5/M6) do not read it: an access chip is a credential
    // on POSEIDON's network, and the daemon's own household troops standing over
    // its core are not fooled by one. The gate and core terminals are inside
    // their reach on purpose.
    this.jackedIn = this.terminalSafe;

    // Forcefield: armed by clicking it in whatever slot it's carried in (hand,
    // pocket, or backpack — no need to hold it). While armed and carried it
    // burns its charge; when a cell runs out it pulls a fresh battery from
    // your kit, and with none left the field drops until you feed it one.
    // Losing the item entirely disarms it so a freshly found one starts off.
    if (!this.hasItem('forcefield')) this.forcefieldArmed = false;
    if (this.hasItem('forcefield') && this.forcefieldArmed) {
      if (this.forcefieldCharge > 0) {
        this.forcefieldCharge = Math.max(0, this.forcefieldCharge - FORCEFIELD_DRAIN * dt);
      } else if (this.consumeBattery()) {
        this.forcefieldCharge = FORCEFIELD_MAX;
        if (!this._ffOn) this.say('The forcefield hums up around you — a green shell nothing gets through.');
      } else if (this._ffOn) {
        this.say('The forcefield flickers out. It needs a battery.');
      }
      this._ffOn = this.forcefieldCharge > 0;
    } else {
      this._ffOn = false;
    }

    // Mirror shield sheds heat when it isn't actively bouncing fire, so it only
    // overheats under a sustained barrage. Carry no mirror shield and its heat
    // resets, so a freshly found one starts cool. Likewise a dropped riot shield
    // forgets its dents — pick a new one up and it's whole again.
    if (this.hasItem('mirror_shield')) {
      this.mirrorHeat = Math.max(0, this.mirrorHeat - MIRROR_HEAT_COOL * dt);
    } else {
      this.mirrorHeat = 0;
    }
    if (!this.hasItem('shield')) this.riotShieldHits = 0;
    if (!this.hasItem('aspis')) this.aspisHits = 0;

    // Electro-compass: armed the same way — click it in whatever slot it's
    // carried in. Stays armed (chevrons on) until you drop the item entirely.
    if (!this.hasItem('compass')) this.compassArmed = false;
    if (!this.hasItem('goggles')) this.gogglesOn = false;

    // Electro-gun solar trickle: while you carry it (hand, pocket, or pack)
    // its internal cell slowly refills, so it comes back to life on its own.
    if (this.hasItem('electrogun')) {
      const eg = ITEMS.electrogun;
      this.electroCharge = Math.min(eg.internalMax, this.electroCharge + eg.chargeRate * dt);
    }

    // `footZ` is NOT followed here. It is set where the movement resolves, in
    // one place, beside the lift compensation that has to agree with it — a
    // second follow further down the frame stepped it again and the two fought.
    this.updateCooking(map, dt);        // #180: a roast counts down while you stand there
    if (input.usePressed()) this.useHands(map, animals, robots);
    if (input.eatPressed()) this.eat();
    if (input.readPressed()) this.read(robots);
    const picked = input.pocketSelectPressed();
    if (picked >= 0) this.selectPocket(picked);
    if (input.backpackWeaponSelectPressed()) this.selectBackpackWeapon();
    if (input.swapPressed()) this.swapHands();
    if (input.dropPressed()) this.drop(map);
    this.pickupNearby(map);
  }

  // Returns the item key of any burden-flagged item (ITEMS[..].burden — the
  // anvil, the large stone) anywhere on your person: hands, pockets, backpack
  // slots, the spare-weapon sleeve. There is no clever way to carry one.
  carryingBurden() {
    const heavy = (k) => k && ITEMS[k] && ITEMS[k].burden ? k : null;
    if (heavy(this.hands)) return this.hands;
    const p = this.pockets.find((s) => s && heavy(s.item));
    if (p) return p.item;
    if (this.backpack) {
      if (heavy(this.backpack.weapon)) return this.backpack.weapon;
      const b = this.backpack.slots.find((s) => s && heavy(s.item));
      if (b) return b.item;
    }
    return null;
  }

  // Drop a specific slot's whole contents on the ground ahead (used by
  // dragging an item off the inventory panel to get rid of it). Lands beyond
  // pickup range so it doesn't walk straight back into your kit.
  dropSlot(slot, map) {
    const s = this.getSlot(slot);
    if (!s) return false;
    const dropX = this.x + this.facing.x * (PICKUP_RANGE + 0.4);
    const dropY = this.y + this.facing.y * (PICKUP_RANGE + 0.4);
    map.groundItems.push(this.giDrop(s.item, s.qty, dropX, dropY));
    this.setSlot(slot, null);
    this.say(`You drop the ${ITEMS[s.item].name.toLowerCase()}.`);
    return true;
  }

  // F drops the selected pocket's contents, or the held tool/gun if no
  // pocket is selected. Lands a step ahead of the player (beyond pickup
  // range) so it doesn't just walk straight back into the pockets.
  drop(map) {
    const dropX = this.x + this.facing.x * (PICKUP_RANGE + 0.4);
    const dropY = this.y + this.facing.y * (PICKUP_RANGE + 0.4);
    if (this.selectedPocket === 'bw' && this.backpack && this.backpack.weapon) {
      map.groundItems.push(this.giDrop(this.backpack.weapon, 1, dropX, dropY));
      this.say(`You drop the ${ITEMS[this.backpack.weapon].name.toLowerCase()}.`);
      this.backpack.weapon = null;
      return;
    }
    if (this.selectedPocket != null && this.selectedPocket !== 'bw' && this.pockets[this.selectedPocket]) {
      const slot = this.pockets[this.selectedPocket];
      map.groundItems.push(this.giDrop(slot.item, slot.qty, dropX, dropY));
      this.pockets[this.selectedPocket] = null;
      this.say(`You drop the ${ITEMS[slot.item].name.toLowerCase()}.`);
      return;
    }
    if (this.hands) {
      map.groundItems.push(this.giDrop(this.hands, 1, dropX, dropY));
      this.say(`You drop the ${ITEMS[this.hands].name.toLowerCase()}.`);
      this.hands = null;
      return;
    }
    this.say('Nothing to drop.');
  }

  // Press 1-4 to select a pocket slot (toggle off by pressing it again).
  selectPocket(i) {
    this.selectedPocket = this.selectedPocket === i ? null : i;
  }

  // Press 5 to select the backpack's dedicated spare-weapon slot, once
  // you're carrying one.
  selectBackpackWeapon() {
    if (!this.backpack) {
      this.say('No backpack.');
      return;
    }
    this.selectedPocket = this.selectedPocket === 'bw' ? null : 'bw';
  }

  // G swaps the held tool with whatever is in the selected pocket (or the
  // backpack's spare-weapon slot), so a weapon can be put away and swapped
  // for another without dropping it. Only tools/guns move into the hands
  // slot; a pocket full of resources (wood, ammo, food, ...) has nothing
  // sensible to hold there.
  swapHands() {
    if (this.selectedPocket == null) {
      this.say('Select a pocket (1-4) first.');
      return;
    }
    if (this.selectedPocket === 'bw') {
      const heldItem = this.hands;
      this.hands = this.backpack.weapon || null;
      this.backpack.weapon = heldItem || null;
      this.say(this.hands ? `You ready the ${ITEMS[this.hands].name.toLowerCase()}.` : 'You put your weapon away.');
      return;
    }
    const i = this.selectedPocket;
    const slot = this.pockets[i];
    // A book or note is read, not held: selecting it opens it on the spot (a
    // note files into the notepad, a manual teaches its skill), same as R —
    // so clicking the starting note reads it instead of refusing the hand.
    if (slot && ITEMS[slot.item].kind === 'book') {
      const key = slot.item;
      if (slot.qty > 1) slot.qty -= 1; else this.pockets[i] = null;
      this.learnFromBook(key);
      return;
    }
    if (slot && !canHold(slot.item)) {
      this.say(`Can't hold ${ITEMS[slot.item].name.toLowerCase()} in hand.`);
      return;
    }
    const heldItem = this.hands;
    if (slot && slot.qty > 1) {
      // A stack (e.g. several bombs): take just one into the hand and leave the
      // rest in the pocket — the hand slot holds a single item, so moving the
      // whole slot would silently lose the surplus. Any previously-held item is
      // stowed into free space rather than overwriting the stack.
      this.hands = slot.item;
      slot.qty -= 1;
      if (heldItem) this.stow(heldItem, 1);
      this.say(`You ready a ${ITEMS[this.hands].name.toLowerCase()}.`);
      return;
    }
    this.hands = slot ? slot.item : null;
    this.pockets[i] = heldItem ? { item: heldItem, qty: 1 } : null;
    this.say(this.hands ? `You ready the ${ITEMS[this.hands].name.toLowerCase()}.` : 'You put your weapon away.');
  }

  // R interfaces with things: a drained robot nearby gets reprogrammed
  // (costs a battery); otherwise read the first book in the pockets.
  read(robots = []) {
    const bot = robots.find((r) => !r.dead && !r.fused && r.drained
      && Math.hypot(r.x - this.x, r.y - this.y) < 1.3);
    if (bot && bot.hardened) {
      // Fortress guards (M6) are hardened: their orders can't be rewritten.
      this.say('Its firmware is sealed — a fortress guard takes no new orders. Scrap it or leave it.');
      return;
    }
    if (bot) {
      let batterySlots = this.pockets;
      let i = this.pockets.findIndex((s) => s && s.item === 'battery');
      if (i < 0 && this.backpack) {
        i = this.backpack.slots.findIndex((s) => s && s.item === 'battery');
        batterySlots = this.backpack.slots;
      }
      if (i < 0) {
        this.say('Its cells are flat. You need a battery to restart it.');
        return;
      }
      batterySlots[i].qty -= 1;
      if (batterySlots[i].qty <= 0) batterySlots[i] = null;
      bot.friendly = true;
      bot.drained = false;
      bot.battery = 100;
      bot.disabledT = 0;
      sfx.play('zap');
      this.say(`You splice into the ${bot.type.toUpperCase()} and rewrite its orders. It works for you now.`);
      return;
    }
    this.readBook();
  }

  // Read the first book in the pockets (then the backpack) and learn its
  // skill for good.
  readBook() {
    const slots = this.backpack ? [...this.pockets, ...this.backpack.slots] : this.pockets;
    const pocketsLen = this.pockets.length;
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (!slot) continue;
      const def = ITEMS[slot.item];
      if (def.kind !== 'book') continue;
      if (i < pocketsLen) this.pockets[i] = null;
      else this.backpack.slots[i - pocketsLen] = null;
      this.learnFromBook(slot.item);
      return;
    }
    this.say('Nothing to read.');
  }

  // Learn a book's skill (or re-read it for a little knowledge). Shared by
  // the R key and by walking onto / clicking a book, which reads it on the
  // spot rather than pocketing it.
  learnFromBook(itemKey) {
    const def = ITEMS[itemKey];
    // A note/document (the starting Odyssey note, etc.): no skill, no manual —
    // it files itself into the notepad (main.js wires onReadNote) so you carry
    // the story, then a short line acknowledges it.
    if (def.toNotepad) {
      this.gainXp('knowledge', 3);
      if (this.onReadNote) this.onReadNote(itemKey);
      this.say(`You read ${def.name} and fold it into your notepad (N).`);
      return;
    }
    // The AI-ML manual and its torn pages teach the console language, not a
    // survival skill — just show their text and count as a little knowledge.
    if (def.manual) {
      this.gainXp('knowledge', def.tip ? 3 : 8);
      this.readManuals ??= new Set();
      if (!this.readManuals.has(itemKey)) { this.addScore(SCORE.book); this.readManuals.add(itemKey); }
      this._shelve(itemKey, def);
      this._fileBookNote(def);
      this.say(`You read ${def.name}. ${def.text} (On your shelf now \u2014 Shift+N for the Library.)`);
      return;
    }
    this._shelve(itemKey, def);
    this._fileBookNote(def);
    // A PAPERBACK TEACHES NO SKILL, and there are 28 of them. Without this the
    // branch below added `undefined` to the skills set and pushed {skill:
    // undefined} into the skill log — both of which are saved and both of which
    // the Record panel draws. Reading Foucault is worth knowing something; it is
    // not worth a skill called undefined.
    if (!def.skill) {
      this.gainXp('knowledge', this.booksRead && this.booksRead.has(itemKey) ? 2 : 6);
      this.addScore(SCORE.book);
      this.say(`You read ${def.name}. It is on your shelf now \u2014 Shift+N for the Library.`);
      return;
    }
    if (this.skills.has(def.skill)) {
      this.gainXp('knowledge', 2); // re-reading still teaches a little
      this.say(`You have already read ${def.name}. (It is on your shelf \u2014 Shift+N.)`);
    } else {
      this.skills.add(def.skill);
      this.skillLog.push({ skill: def.skill });
      this.gainXp('knowledge', 10);
      this.addScore(SCORE.book);
      this.say(`You read "${def.name}". ${def.skillText} On your shelf now \u2014 Shift+N for the Library.`);
      if (this.onSkillLearned) this.onSkillLearned(def.skill);
    }
  }

  // YOUR SHELF. Which physical books you have read, by item key, and nothing
  // else: the Library is built from this and from ITEMS, so it survives a
  // reload where the filed pages do not. A book you actually read and carried
  // is a thing you have; a page of notes about it is a thing this run made.
  _shelve(itemKey, def) {
    if (!def || (def.kind !== 'book' && def.kind !== 'paperbook')) return;
    this.booksRead ??= new Set();
    this.booksRead.add(itemKey);
    achieveEvent('bookRead', { id: itemKey });
  }

  // File a one-page summary of a book into the notepad — title, author, and a
  // short abstract of what it is — so a read book leaves a record you can flip
  // back to, not just a one-off message.
  _fileBookNote(def) {
    if (!this.onFileNote) return;
    // A def can supply notepadText for a hand-written, literal page (used by
    // the AI-ML manuals, which are complex enough to warrant a clean, fully
    // spelled-out reference rather than an auto-assembled blurb).
    let body;
    if (def.notepadText) {
      body = (def.author ? `by ${def.author}\n\n` : '') + def.notepadText;
    } else {
      const parts = [];
      if (def.author) parts.push(`by ${def.author}`);
      if (def.abstract) parts.push(def.abstract);
      const effect = def.skillText || def.text;
      if (effect && effect !== def.abstract) parts.push(effect);
      body = parts.join('\n\n');
    }
    // cover: a media path (book/album art) the notepad can render as a thumbnail;
    // cat sorts it into the Scrapbook's Books / Albums / Documents sections.
    const cat = (def.kind === 'record' || def.kind === 'tape') ? 'Album'
      : (def.kind === 'book' || def.kind === 'paperbook') ? 'Book'
      : 'Document';
    this.onFileNote(def.short || def.name, body, def.cover || null, cat);
  }

  // The swallow itself — shared by eat() (the E key) and the click-to-eat
  // path in equipSlot (mobile has no E key): hunger restored plus any
  // per-food effect (the herbalist's berries, the lotus trap).
  consumeFood(itemKey) {
    const def = ITEMS[itemKey];
    this.food = Math.min(this.maxFood, this.food + def.food);
    sfx.play('eat');
    if (itemKey === 'berries' && this.skills.has('herbalism')) {
      this.venom = 0;
      this.health = Math.min(this.maxHealth, this.health + 5);
      this.say('You eat the berries. The right ones: the venom fades.');
    } else if (def.lotus) {
      // The trap. No warning until it is already in you: a dreamy line, and
      // the torpor takes hold in update (slow + the drunken heading sway).
      this.torpor = Math.min(TORPOR_MAX, this.torpor + TORPOR_TIME);
      this.lotusDaze = Math.min(TORPOR_MAX, this.lotusDaze + TORPOR_TIME);
      this.say('The fruit is sweeter than anything you remember. You forget, for a moment, why you were in such a hurry.');
    } else {
      // #180 — a hot meal puts strength back as well as filling you. Only
      // cooked food carries `stamina`, so this is the fire paying for itself a
      // second time and there is nothing to check beyond the item's own record.
      if (def.stamina) this.stamina = Math.min(this.maxStamina, this.stamina + def.stamina);
      this.say(def.stamina
        ? `You eat the ${def.name.toLowerCase()}. Hot food, and you feel it.`
        : `You eat the ${def.name.toLowerCase()}.`);
    }
  }

  // Eat the first edible thing in the pockets, then the backpack — a
  // backpack is just more room, not a separate inventory to manage by hand.
  eat() {
    const tryEat = (slots) => {
      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        if (!slot) continue;
        const def = ITEMS[slot.item];
        if (def.food == null) continue;
        if (this.food >= this.maxFood - 2) {
          this.say('You are not hungry.');
          return true;
        }
        slot.qty -= 1;
        if (slot.qty <= 0) slots[i] = null;
        this.consumeFood(slot.item);
        return true;
      }
      return false;
    };
    if (tryEat(this.pockets)) return;
    if (this.backpack && tryEat(this.backpack.slots)) return;
    this.say('Nothing to eat.');
  }

  // Swing the held tool: hits a robot or animal in reach first, otherwise
  // searches a cache box or chops the tree on the faced tile. No swinging
  // mid-jump. A gun (or an empty hand) can't melee or chop, but a cache
  // ahead is always searched with the free hand regardless of what's in
  // the primary hand.
  // ---- #180: cooking -------------------------------------------------------

  /**
   * Lay a fire on the tile ahead. Three wood, no tool needed.
   *
   * NO TOOL, deliberately, unlike the boat: gathering the wood already took a
   * blade, and asking for one twice would mean a player who has put the axe
   * down cannot light a fire with the logs in their pack.
   */
  canBuildFire(map) {
    if (this.countItem('wood') < WOOD_PER_FIRE) return false;
    const tx = Math.floor(this.x + this.facing.x * REACH);
    const ty = Math.floor(this.y + this.facing.y * REACH);
    return map.inBounds(tx, ty) && !map.objectAt(tx, ty) && !map.buildingAt(tx, ty);
  }

  buildFire(map) {
    if (this.countItem('wood') < WOOD_PER_FIRE) {
      this.say(`A fire wants ${WOOD_PER_FIRE} wood; you have ${this.countItem('wood')}.`);
      return false;
    }
    const tx = Math.floor(this.x + this.facing.x * REACH);
    const ty = Math.floor(this.y + this.facing.y * REACH);
    const fire = map.addObject('campfire', tx, ty, { fuel: WOOD_PER_FIRE * FUEL_PER_WOOD, cook: 0, flick: 0 });
    if (!fire) { this.say('No clear ground in front of you to lay a fire.'); return false; }
    for (let n = 0; n < WOOD_PER_FIRE; n++) this.removeItem('wood');
    sfx.play('chop');
    this.say('You lay the wood and get a flame going. Hold meat over it to roast; more wood keeps it alive.');
    return true;
  }

  /**
   * Use the fire in front of you: start a roast, or put wood on.
   *
   * The roast itself is counted in `update` while you stand there — this only
   * begins it. Walking away stops it, which is the whole reason it takes time
   * rather than happening on the press.
   */
  useFire(fire) {
    if (!isLit(fire)) { this.say('The fire is out. Lay another.'); return; }
    if (this.findRaw()) {
      this._cooking = true;
      this.say('You hold it over the flame.');
      return;
    }
    if (this.hasItem('wood')) {
      const r = feedFire(fire);
      if (!r.ok) { this.say(`The fire ${r.why}.`); return; }
      this.removeItem('wood');
      sfx.play('chop');
      this.say('You feed the fire. It takes hold again.');
      return;
    }
    this.say('Nothing to cook and no wood to spare. It burns down.');
  }

  /** The first raw thing on your person that a fire would change, as a slot. */
  findRaw() {
    const scan = (slots) => {
      for (let i = 0; i < slots.length; i++) {
        if (slots[i] && roastOf(slots[i].item)) return { slots, i };
      }
      return null;
    };
    return scan(this.pockets) || (this.backpack ? scan(this.backpack.slots) : null);
  }

  /**
   * Count down a roast, one piece at a time, while you stand by the fire.
   *
   * Called every tick from `update`. Standing there is the whole cost: step
   * away, or let the fire go out, and the count resets — `tickCook` clears it
   * on a dead fire, and the check below clears it when you leave.
   */
  updateCooking(map, dt) {
    if (!this._cooking) return;
    const fire = this.fireBeside(map);
    const raw = this.findRaw();
    if (!fire || !raw) {
      if (this._cooking) this.say(fire ? 'Nothing left to roast.' : 'You step away from the fire.');
      this._cooking = false;
      return;
    }
    const r = tickCook(fire, dt);
    if (!r.done) return;
    const slot = raw.slots[raw.i];
    const roast = roastOf(slot.item);
    slot.qty -= 1;
    if (slot.qty <= 0) raw.slots[raw.i] = null;
    if (this.stow(roast, 1) === 0) {
      // Nowhere to put it: it goes on the ground rather than out of existence.
      if (map.groundItems) map.groundItems.push(this.giDrop(roast, 1, this.x, this.y));
    }
    sfx.play('eat');
    this.say(`${ITEMS[roast].name} — done. It smells like something you had a life ago.`);
  }

  /** The lit fire on an adjacent tile, if you are standing next to one. */
  fireBeside(map) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const o = map.objectAt(Math.floor(this.x) + dx, Math.floor(this.y) + dy);
        if (isLit(o)) return o;
      }
    }
    return null;
  }

  useHands(map, animals = [], robots = []) {
    // Reclassified by CIRCE: a beast has no hands to swing with. (Boarding a ship
    // still works — you can flee Aeaea as a swine; you just can't fight on it.)
    if (this.isSwine()) {
      const obj = map.objectAt(Math.floor(this.x + this.facing.x), Math.floor(this.y + this.facing.y));
      if (!(obj && (obj.type === 'boat' || obj.type === 'greek_ship'))) {
        this.say('You paw at it with a trotter. Whatever you were, you cannot hold a thing like this now — find moly.');
        return;
      }
    }
    // Empty hands still throw a (weak) punch — see BARE_HANDS — rather than
    // refusing to do anything.
    const tool = this.hands ? ITEMS[this.hands] : BARE_HANDS;
    if (this.swingTimer > 0 || this.z > 0) return;

    const tx = Math.floor(this.x + this.facing.x * REACH);
    const ty = Math.floor(this.y + this.facing.y * REACH);
    const obj = map.objectAt(tx, ty);
    const facingBox = obj && obj.type === 'box';
    // Board a beached boat -> the departure (Stage 1b / decision #8): with
    // Calypso's leave you sail off; without it, Poseidon storms you back.
    if (obj && (obj.type === 'boat' || obj.type === 'greek_ship')) { this.boardBoat(map, obj); return; }
    // #180 — THE FIRE. Using a lit fire either starts a roast or feeds it, and
    // which one is decided by what you are carrying rather than by a menu: raw
    // meat first, because that is what you walked over here for, then wood.
    // Handled before the tool branches below so that swinging an axe at your own
    // campfire tends it instead of scattering it.
    if (obj && obj.type === 'campfire') { this.useFire(obj); return; }

    // Defensive gear is passive — a shield blocks by being held and facing the
    // shot, a forcefield by simply being up. Using it just searches a cache
    // ahead if there is one, otherwise does nothing.
    if (tool.kind === 'shield' || tool.kind === 'forcefield' || tool.kind === 'compass' || tool.kind === 'map') {
      if (facingBox) this.openBox(obj, map);
      else if (tool.kind === 'compass') this.say('The compass needle swings, seeking.');
      else if (tool.kind === 'shield') this.say('You raise the shield.');
      else if (tool.kind === 'map') { if (this.onReadMap) this.onReadMap(); else this.say('You unfold the map.'); }
      return;
    }

    if (tool.kind === 'gun' || tool.kind === 'gadget' || tool.kind === 'bomb' || tool.kind === 'spray') {
      if (facingBox) { this.openBox(obj, map); return; }
      if (tool.kind === 'gun') fire(this, tool, map, animals, robots);
      else if (tool.kind === 'gadget') this.useGadget(tool);
      else if (tool.kind === 'bomb') this.dropBomb(tool, map);
      else if (tool.kind === 'spray') this.sprayUbik(map);
      return;
    }
    // A working machine found in a box: put it in the slot. If you already carry
    // one, the spare stays in the pack — swapping is pointless now that a found
    // machine's VALUE is its disk, and a disk is read across rather than carried
    // (see salvageLaptop). Your own machine keeps your own work on it.
    if (tool.kind === 'laptop' && !tool.dead && !tool.broken) {
      if (this.laptop) { this.say('You already carry a working NostBook. Keep this one as a spare.'); return; }
      if (this.onInstallLaptop) this.onInstallLaptop();
      return;
    }
    // A dead machine in hand: read its disk onto yours. The hub supplies the
    // archives and the graft, so this file stays free of disk-format knowledge.
    if (tool.dead && tool.kind === 'laptop') {
      if (this.onSalvageLaptop) this.onSalvageLaptop();
      else this.say('You turn it over. Nothing here can read it.');
      return;
    }
    // Grass seed: sow it into the dead ground ahead to green one blighted tile
    // back. The blight/obelisk knowledge lives in the hub, so route it there —
    // it heals the tile, or refuses if a live tower still stands over it.
    if (tool.kind === 'seed') {
      const stx = Math.floor(this.x + this.facing.x * REACH);
      const sty = Math.floor(this.y + this.facing.y * REACH);
      if (this.onPlantSeed) this.onPlantSeed(stx, sty);
      else this.say('There is nothing to sow here.');
      return;
    }
    if (this.stamina < tool.staminaCost) {
      this.say('Too exhausted to swing.');
      return;
    }

    // Nearest living creature or machine within reach and roughly in front.
    // Fused wrecks stay targetable: hitting one mines it for parts. A
    // drained (battery-flat) robot stays targetable too: R still offers a
    // free reprogram at close range, but a player who'd rather just be rid
    // of it can beat it down for scrap instead, same as any other kill.
    let target = null, best = Infinity, isRobot = false;
    const consider = (e, robot) => {
      if (e.dead || e.friendly) return;
      const dx = e.x - this.x, dy = e.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d > 1.1 || d === 0) return;
      if (dx * this.facing.x + dy * this.facing.y < 0) return; // behind us
      if (d < best) { best = d; target = e; isRobot = robot; }
    };
    for (const a of animals) consider(a, false);
    for (const r of robots) consider(r, true);
    if (target && isRobot && target.fused) {
      this.swingTimer = tool.swingCooldown;
      this.stamina -= tool.staminaCost;
      sfx.play('chop');
      this.sparkAt(map, target.x, target.y);
      target.mineCharges = (target.mineCharges ?? 3) - 1;
      map.groundItems.push({ item: 'scrap', qty: 2, x: target.x, y: target.y });
      if (target.mineCharges <= 0) {
        target.dead = true;
        this.addScore(SCORE.wreck);
        this.say('You strip the last usable parts from the wreck.');
      } else {
        this.say('You pry parts out of the fused machine.');
      }
      return;
    }
    if (target && isRobot && zombieImmune(target, tool)) {
      this.swingTimer = tool.swingCooldown;
      this.stamina -= tool.staminaCost;
      sfx.play('chop');
      this.say('The blade clangs off the husk without effect — only a bow or the wave gun can finish a zombie machine.');
      return;
    }
    if (target) {
      this.swingTimer = tool.swingCooldown;
      this.stamina -= tool.staminaCost;
      // Metal answers in metal — and different hulls ring differently: the
      // T1's thin wedge is tinny, the W4's furnace plate is deep and long.
      if (isRobot) sfx.play('clang', { pitch: CLANG_PITCH[target.type] || 1 });
      else sfx.play('chop');
      // A practised swordarm hits harder.
      const bonus = this.xpLevel('melee');
      target.hp -= (isRobot ? (tool.robotDamage ?? 1) : (tool.animalDamage ?? 3)) + bonus;
      target.hurt = true; // modules read this (pack flee, boar enrage, robot aggro)
      // The blow is yours, and the song counts it as such: the kill will be
      // attributed to your hand, and a hacker who swings has stopped hacking.
      if (isRobot) { target._lastHitBy = 'melee'; achieveEvent('handDamage', {}); }
      // A solid blow shoves it back and rattles it for a beat (frozen, no
      // attack) — otherwise it just stands there trading hits nose-to-nose,
      // landing its own attack the instant yours lands and out-damaging you
      // even though you struck first.
      const kd = best > 1e-4 ? best : 1;
      const kx = target.x + ((target.x - this.x) / kd) * KNOCKBACK_DIST;
      const ky = target.y + ((target.y - this.y) / kd) * KNOCKBACK_DIST;
      if (!map.isSolid(Math.floor(kx), Math.floor(ky))) { target.x = kx; target.y = ky; }
      target.knockT = KNOCKBACK_STUN;
      this.gainXp('melee', target.hp <= 0 ? KILL_XP : 1);
      if (isRobot) {
        this.sparkAt(map, target.x, target.y);
        // The robots module marks it dead and drops scrap on its next tick.
        if (target.hp <= 0) this.addScore(SCORE.robot);
        this.say(target.hp <= 0
          ? 'The machine sparks, shudders, and dies.'
          : `The ${tool.name.toLowerCase()} clangs off the machine.`);
      } else if (target.hp <= 0) {
        target.dead = true;
        achieveEvent('animalKilled', { type: target.type });
        map.groundItems.push({ item: 'meat', qty: 1, x: target.x, y: target.y });
        this.addScore(SCORE.animal);
        this.say(`The ${target.type} goes down.`);
      } else {
        this.say(`You catch the ${target.type} with the blade.`);
      }
      return;
    }

    // Resistance cache: search it rather than hit it.
    if (facingBox) { this.openBox(obj, map); return; }

    // Abandoned car: smash it open (best with a crowbar) for what's inside.
    if (obj && obj.type === 'car') { this.smashCar(obj, map, tool); return; }

    // The W-factory: hammer at its 8x8 hull. Many blows bring it down and it
    // drops an AI key.
    if (obj && obj.type === 'wfactory') { this.hitFactory(obj, map, tool); return; }

    // The mainframe core: the AI itself. Break its hull down (heavy kit only)
    // and the island's controlling mind dies — every machine goes dark.
    if (obj && obj.type === 'mainframe') { this.hitCore(obj, map, tool); return; }

    // An obelisk: only a blade meant for machines bites the alloy. The
    // robot-sword cuts it down — but slower than the electro-gun's arc (half a
    // burn a stroke, so about ten strokes to the gun's five), and you must
    // stand right under the eye to do it, in range of whatever it has called.
    // Any lighter blade just rings off it.
    if (obj && obj.type === 'obelisk' && !obj.destroyed) {
      if (this.hands === 'robot_sword') {
        this.swingTimer = tool.swingCooldown;
        this.stamina = Math.max(0, this.stamina - (tool.staminaCost ?? 0));
        sfx.play('clang', { pitch: 0.7 });
        this.sparkAt(map, obj.x + 0.5, obj.y + 0.5);
        obj.shake = 0.15;
        this.damageObelisk(obj, map, 0.5);
      } else {
        this.swingTimer = tool.swingCooldown;
        this.stamina = Math.max(0, this.stamina - (tool.staminaCost ?? 0) * 0.5);
        sfx.play('clang', { pitch: 0.5 });
        obj.shake = 0.1;
        this.say(`The ${(tool.name || 'weapon').toLowerCase()} rings off the obelisk's alloy — only the robot-sword cuts it, or the electro-gun.`);
      }
      return;
    }

    // Shovel: dig a pit in the open ground ahead. A steep pit (height -2)
    // is a trap — a wheeled T1 rolls in and can't climb out, and you can
    // only get out yourself by jumping.
    if (tool.dig && !obj) { this.dig(map, tx, ty); return; }

    if (!obj || obj.type !== 'tree') {
      // A swing at empty air. It MUST still animate: early players press the use
      // key with nothing in range, and if the tool does not visibly move they
      // read the controls as broken (real feedback from testers). The arc is
      // driven entirely by swingTimer (renderer.drawHeldItem), so a whiff that
      // did not set it showed nothing. A whiff costs half stamina — you swung,
      // but hit nothing to follow through on — never health.
      this.swingTimer = tool.swingCooldown;
      this.stamina = Math.max(0, this.stamina - tool.staminaCost * 0.5);
      sfx.play('swing');
      return;
    }

    // A penknife is far too small to fell a tree — hacking away with one just
    // burns energy and wears you down. Bare hands are worse still.
    if (this.hands === 'penknife') {
      this.swingTimer = tool.swingCooldown;
      this.stamina = Math.max(0, this.stamina - 8);
      this.health = Math.max(1, this.health - modeHarm(this, 0.6));
      sfx.play('swing');
      this.say('The penknife is useless against a tree — you only tire yourself out.');
      return;
    }
    if (!this.hands) {
      this.swingTimer = tool.swingCooldown;
      this.stamina = Math.max(0, this.stamina - 6);
      sfx.play('swing');
      this.say('Bare hands against a tree trunk get you nowhere.');
      return;
    }

    // Chopping swings noticeably faster than a normal attack cooldown, so
    // felling a tree feels brisk rather than a slow plod.
    this.swingTimer = tool.swingCooldown * TREE_CHOP_SPEEDUP;
    this.stamina -= tool.staminaCost;
    sfx.play('chop');
    const treeDmg = this.skills.has('woodcraft') ? tool.treeDamage * 2 : tool.treeDamage;
    obj.maxHp = obj.maxHp ?? TREE_HP;   // for the damage bar drawn above it
    obj.hp = (obj.hp ?? TREE_HP) - treeDmg;
    obj.shake = 0.25;
    map.shaking.add(obj);

    if (obj.hp <= 0) {
      map.removeObject(obj);
      // Bigger trees yield more wood: the two large variants most, the medium
      // one less, a small one least, a bare/dead one somewhere between. A
      // part-grown sapling (obj.grow) yields proportionally less.
      const byVariant = [4, 4, 3, 1, 2];
      const wood = Math.max(1, Math.round((byVariant[obj.variant] ?? WOOD_PER_TREE) * (obj.grow == null ? 1 : obj.grow)));
      map.groundItems.push({ item: 'wood', qty: wood, x: obj.x + 0.5, y: obj.y + 0.5 });
      sfx.play('treefall');
      // A felled tree scores a point; the right tool (a saw) or the skill to
      // use it earns more.
      let pts = SCORE.tree;
      if (tool.sawBonus) pts += tool.sawBonus;
      if (this.skills.has('woodcraft')) pts += 1;
      this.addScore(pts);
      this.say(`The tree comes down. +${pts}`);
    } else {
      this.say(`You hack at the tree with the ${ITEMS[this.hands].name.toLowerCase()}.`);
    }
  }

  // Drop a ticking bomb a step ahead. It's consumed from your kit and lives
  // in map.bombs; main ticks its fuse and detonates it.
  dropBomb(tool, map) {
    this.swingTimer = 0.4;
    map.bombs = map.bombs || [];
    // Thrown, not just dropped: it lands where you're aiming, out to a real
    // distance, in an arc — like an actual lobbed grenade it clears a wall or
    // a low block in its path rather than stopping dead at the first one. You
    // aim by pointing: it lands on the tile under the cursor, capped at the
    // throw range, so a nearby click drops it close and a far one throws it
    // full distance. Only pulled back if the landing spot is inside solid
    // geometry.
    const THROW_RANGE = tool.throwRange ?? 4.5;
    let dist = THROW_RANGE;
    if (this.aimWorld) {
      const dd = Math.hypot(this.aimWorld.x - this.x, this.aimWorld.y - this.y);
      dist = Math.max(0.6, Math.min(dd, THROW_RANGE));
    }
    let bx = this.x + this.facing.x * dist, by = this.y + this.facing.y * dist;
    if (map.isSolid(Math.floor(bx), Math.floor(by))) {
      for (let d = dist - 0.5; d > 0.5; d -= 0.5) {
        const tx = this.x + this.facing.x * d, ty = this.y + this.facing.y * d;
        if (!map.isSolid(Math.floor(tx), Math.floor(ty))) { bx = tx; by = ty; break; }
      }
    }
    map.bombs.push({ x: bx, y: by, fuse: tool.fuse, radius: tool.radius, damage: tool.damage, obelisk: !!tool.obelisk, key: tool.key });
    // The thrown bomb leaves your hand; rather than leave you empty-handed (or
    // fumbling to re-arm), your best weapon is brought straight to hand. Any
    // spare bombs stay in your pockets to re-select if you want another.
    if (this.hands === tool.key) this.hands = null;
    else this.removeItem(tool.key);
    this.autoEquipBestWeapon();
    sfx.play('pickup');
    this.say(`You lob the ${tool.name.toLowerCase()} out, ticking. Get clear.`);
  }

  // Bring the highest-power weapon you're carrying (pockets, then backpack)
  // into the hands slot. Used after throwing a bomb so you're immediately
  // ready to fight. Leaves the hand empty if you have no weapon at all.
  autoEquipBestWeapon() {
    if (this.hands) return;
    let bestArr = null, bestIdx = -1, bestPow = -1;
    const scan = (arr) => {
      if (!arr) return;
      for (let k = 0; k < arr.length; k++) {
        const s = arr[k];
        if (!s) continue;
        const def = ITEMS[s.item];
        if (!def || (def.kind !== 'tool' && def.kind !== 'gun')) continue;
        if (!canHold(s.item)) continue;
        const pow = def.power || 0;
        if (pow > bestPow) { bestPow = pow; bestArr = arr; bestIdx = k; }
      }
    };
    scan(this.pockets);
    if (this.backpack) scan(this.backpack.slots);
    if (bestArr) {
      this.hands = bestArr[bestIdx].item;
      bestArr[bestIdx].qty -= 1;
      if (bestArr[bestIdx].qty <= 0) bestArr[bestIdx] = null;
      this.say(`You bring the ${ITEMS[this.hands].name.toLowerCase()} up.`);
    }
  }

  // Use the Wi-Fi block: spend a battery (pockets, then backpack) to top
  // its charge back to full. Batteries are the only way to keep it running.
  useGadget(tool) {
    this.swingTimer = 0.4;
    let slots = this.pockets;
    let i = this.pockets.findIndex((s) => s && s.item === 'battery');
    if (i < 0 && this.backpack) {
      i = this.backpack.slots.findIndex((s) => s && s.item === 'battery');
      slots = this.backpack.slots;
    }
    if (i < 0) {
      this.say(`The ${tool.name.toLowerCase()} is dead. It needs a battery.`);
      return;
    }
    slots[i].qty -= 1;
    if (slots[i].qty <= 0) slots[i] = null;
    this.wifiPower = this.wifiMax;
    sfx.play('zap');
    this.say('You slot a fresh cell into the block. The machines lose your signal.');
  }

  // Spray the can of Ubik: lays down a lasting patch of "realness" a little
  // ahead of you where the ground and everything on it reads brighter, warmer,
  // more solid — as if a thin fake had been dissolved off the top. Twenty
  // sprays to a can, tracked on the player; then it hisses dry. Sometimes
  // (UBIK_WEIRD_CHANCE) the can does something odder than that — a beat of
  // the old novel's paranoia leaking through: a stray chapter-ad, a flicker
  // of an older world underneath (renderer.js reads player.ubikFlickerT/X/Y).
  // Spraying the same spot three times over doesn't just brighten it harder
  // — it tears all the way through and opens a portal (see map.ubikPatches'
  // `portal`/`sprayCount` fields, linked up in main.js).
  sprayUbik(map) {
    this.swingTimer = 0.5;
    if (this.ubikSprays == null) this.ubikSprays = UBIK_SPRAYS;
    if (this.ubikSprays <= 0) {
      sfx.play('pickup');
      this.say('The can hisses, empty. Whatever was in it, there is no more of it.');
      return;
    }
    this.ubikSprays -= 1;
    const px = this.x + this.facing.x * 1.2, py = this.y + this.facing.y * 1.2;
    const patches = (map.ubikPatches ??= []);
    let patch = patches.find((p) => !p.portal && Math.hypot(p.x - px, p.y - py) < UBIK_MERGE_RANGE);
    if (!patch) {
      patch = { x: px, y: py, r: 3.2, t: 0, sprayCount: 0 };
      patches.push(patch);
    }
    patch.sprayCount += 1;
    patch.t = 0; // topping up a patch renews its life
    patch.x = px; patch.y = py; // recentre slightly toward the latest spray
    sfx.play('zap');
    this.ubikFlickerT = 0.35; // a half-beat of the old world showing through before Ubik wins
    this.ubikFlickerX = px; this.ubikFlickerY = py; // where to localise it (renderer.js)
    const left = this.ubikSprays;
    if (patch.sprayCount >= UBIK_PORTAL_SPRAYS && !patch.portal) {
      patch.portal = true;
      patch.r = 1.5; // a doorway-sized tear, not a bus-sized one (renderer.js stretches it into a tall oval)
      sfx.play('charge');
      this.say('The ground doesn\'t just brighten this time — it tears, and holds open. A portal.');
      return;
    }
    if (Math.random() < UBIK_WEIRD_CHANCE) {
      const ad = UBIK_ADS[Math.floor(Math.random() * UBIK_ADS.length)];
      this.say(ad);
    } else {
      this.say(left > 0
        ? `A fine mist settles, and the world here comes true — colours, edges, weight. ${left} spray${left === 1 ? '' : 's'} left.`
        : 'The last of it drifts down and holds. The can is spent now, and lighter than it should be.');
    }
  }

  // True if a Wi-Fi block is anywhere on the player: in hand, a pocket, or
  // the backpack. It works wherever it is carried.
  ownsWifiBlock() {
    if (this.hands === 'wifiblock') return true;
    if (this.pockets.some((s) => s && s.item === 'wifiblock')) return true;
    if (this.backpack && this.backpack.slots.some((s) => s && s.item === 'wifiblock')) return true;
    return false;
  }

  // Spend one battery from the pockets, then the backpack. Returns whether
  // one was found.
  consumeBattery() {
    const take = (slots) => {
      const i = slots.findIndex((s) => s && s.item === 'battery');
      if (i < 0) return false;
      slots[i].qty -= 1;
      if (slots[i].qty <= 0) slots[i] = null;
      return true;
    };
    if (take(this.pockets)) return true;
    if (this.backpack && take(this.backpack.slots)) return true;
    return false;
  }

  // Cheap, continuously-reassessed read on whether this is still a beginner
  // finding their feet, so robots can go easy on them until they do. Judged
  // purely from movement pace (tiles covered per second since the run
  // began) rather than combat outcomes, so it works from second one, before
  // any fight has happened. A player who is slow and hesitant early on
  // reads as "aimless" — low pace. Self-limiting on two fronts: pace
  // recovers immediately once the player starts moving with intent, and the
  // easing switches off entirely once EASE_WINDOW has elapsed regardless of
  // pace, so a genuinely slow/careful player doesn't get a permanently
  // trivial game. Returns a multiplier in [EASE_MIN, 1] to scale detection
  // range and damage down by.
  /**
   * Scale a loss of health by the game mode. THE ONE PLACE that decides what a
   * point of damage is worth, whatever caused it.
   *
   * `takeDamage` is the combat funnel, and for a long time it was the only
   * thing that consulted `creative` — so Creative stopped a laser and did not
   * stop the sea. Four other sites wrote `this.health` directly: starvation,
   * venom, swimming, and the penknife. A player in a mode whose one promise is
   * "nothing can hurt you" drowned on the beach (David, 2026-08-15: "creative
   * mode doesn't work. I got killed almost immediately").
   *
   * So every one of them goes through here now. Creative returns 0, which is
   * the promise kept; the rest scale like a blow does, because starving on
   * Insane should cost what being shot on Insane costs.
   */
  /**
   * Can the estate's machines find you at all?
   *
   * The four ways to be nobody: a charged Wi-Fi block in hand, jacked into a
   * terminal, wearing the shape Circe gave you, and Creative.
   *
   * CREATIVE BELONGS HERE rather than in the damage path (David, 2026-08-15:
   * "rather than check damage — maybe make everything passive — non-attacking").
   * Absorbing blows leaves a world that still hunts you, still swarms, still
   * starts the detain that stacks torpor and fogs the screen; not being a target
   * is the quiet island the mode is for. Every sensing site in robots.js already
   * reads this flag, so it costs nothing and cannot be forgotten at one of them.
   */
  unseenByMachines() {
    return !!(this._wifiOn || this.terminalSafe || this.isSwine() || this.creative);
  }

  /**
   * The level of the ground under you — the ONE answer, used by the movement
   * compensation, the collider and the renderer alike.
   *
   * On ordinary ground this is `effectiveHeightAt` exactly, as it has always
   * been. It differs only on a column somebody built air into, where which
   * surface you are on is a fact about you rather than about the tile, and
   * `footZ` is what carries that across frames.
   */
  groundUnder(map, x, y) {
    const fx = Math.floor(x), fy = Math.floor(y);
    if (map.standingHeightAt) {
      // CONTINUITY IS THE RULE (David, 2026-08-16: "if the player is walking it
      // is unlikely to suddenly jump vertically... ditto walking on an arch").
      //
      // The reach is ONE step, plus however high you have actually jumped —
      // `z` is the real lift off the ground, and a level is half a z unit. So a
      // layer is gained by being high enough to gain it, and never by anything
      // else. Reading the airborne flag instead widened the reach to two or
      // three levels the moment `z` was non-zero, which a DROP also does: a
      // walker stepping off a kerb under a bridge suddenly "reached" the deck
      // and the sprite snapped a storey upward.
      //
      // Descending needs no allowance: `standOn` takes the highest lid at or
      // below the ceiling, so falling finds the floor beneath you by itself.
      const reach = 1 + Math.max(0, this.z || 0) * 2;
      return map.standingHeightAt(fx, fy, this.footZ ?? 0, reach, PLAYER_HEIGHT);
    }
    return map.effectiveHeightAt ? map.effectiveHeightAt(fx, fy)
      : (map.heightAt ? map.heightAt(fx, fy) : 0);
  }

  harm(amount) { return modeHarm(this, amount); }

  // ---- #179: stealth, for the pacifist route --------------------------------
  //
  // The only stealth the game had was a Wi-Fi block: a found object with a
  // battery that makes you FLAT INVISIBLE while it lasts. That is a good item
  // and a bad system — it runs out, it cannot be planned around, and the run
  // that most needs to get past a machine without killing it is the run least
  // likely to be carrying one.
  //
  // SO STEALTH IS HOW YOU MOVE, and it costs no item and no key. There is
  // nothing new to press: the tall grass has been in the world since the first
  // map and has never done anything, and standing still has never been worth
  // doing. Both are now worth something, and sprinting is worth less.
  //
  // IT SCALES DISTANCE, not sight. `distTo` in robots.js is the one place every
  // hostile asks how far away you are, so a multiplier there reaches every
  // acquisition range, every give-up range and every reacquire in the file
  // without touching one of them — and it degrades the right way, because a
  // machine that has already closed on you is unaffected (see the contact
  // radius in distTo: grass hides nothing from something standing over you).

  /** True when the tile under you is cover. Only tall grass, so far. */
  inCover() {
    const f = this.map && this.map.floorAt ? this.map.floorAt(this.x, this.y) : null;
    return f === 'tallgrass';
  }

  /**
   * How much further away you read than you are. 1 is plainly visible.
   *
   * Deliberately a small table rather than a formula: a player has to be able
   * to learn this in one fight, and "crouch in the grass and hold still" is a
   * sentence. Sprinting reads as CLOSER than you are, which is the only way the
   * game says out loud that running is loud.
   */
  stealthFactor() {
    if (this.sprinting) return 0.8;
    if (this.inCover()) return this.moving ? 2.2 : 4;
    return this.moving ? 1 : 1.15;
  }

  /** A word for the HUD: what your stealth is doing right now, or null. */
  stealthState() {
    if (this.invisibleToRobots) return null;   // the Wi-Fi block has its own readout
    if (this.sprinting) return { text: 'LOUD', good: false };
    if (this.inCover()) return this.moving ? { text: 'IN COVER', good: true } : { text: 'HIDDEN', good: true };
    return null;
  }

  /** Adopt a mode. Anything unrecognised falls back to Medium rather than break. */
  setMode(key) {
    const was = this.mode;
    const adopted = this._modeSet;
    this.mode = isMode(key) ? String(key).toLowerCase() : DEFAULT_MODE;
    this.creative = !!modeOf(this.mode).creative;
    // The floor only ever goes DOWN, which is what makes it a grade rather than
    // a reading: putting Hard back on after a Creative afternoon does not undo
    // the afternoon. The first call SETS the floor rather than lowering it, so
    // starting on Insane is an Insane run and not a Medium one.
    this.modeFloor = adopted ? lowerMode(this.modeFloor, this.mode) : this.mode;
    if (adopted && was !== this.mode) this.modeSwitched = true;
    this._modeSet = true;
    return this.mode;
  }

  /**
   * The mode stamp every certificate carries (#173).
   *
   * A run is credited at its FLOOR, not at whatever was set when it ended. The
   * stamp goes on death certificates too, not only victories: dying on Insane
   * is worth saying, and a certificate that only mentions the mode when you win
   * is a certificate that mentions it when it flatters you.
   */
  modeStamp() { return modeStamp(this); }

  /** The mode's record: hurt, hunger, pressure, clock. */
  modeRules() { return modeOf(this.mode); }

  threatEase() {
    const EASE_WINDOW = 180;   // seconds; easing only applies in the opening minutes
    const EASE_MIN = 0.55;     // floor multiplier while clearly still learning
    const PACE_FLOOR = 0.55;   // tiles/sec below which movement reads as aimless
    // Insane does not ease. Softening the first three minutes would be the mode
    // quietly not being the mode for its opening, which is the part that decides
    // whether somebody keeps playing it.
    if (modeOf(this.mode).noEase) return 1;
    if (this.playSeconds >= EASE_WINDOW) return 1;
    const pace = this.distanceTraveled / Math.max(1, this.playSeconds);
    if (pace >= PACE_FLOOR) return 1;
    const t = pace / PACE_FLOOR; // 0 (motionless) .. 1 (at the floor)
    return EASE_MIN + (1 - EASE_MIN) * t;
  }

  robotNear(robots, range = 22) {
    for (const r of robots || []) {
      if (r.dead || r.friendly || r.drained || r.fused) continue;
      if (Math.hypot(r.x - this.x, r.y - this.y) < range) return true;
    }
    return false;
  }

  // Shovel: sink the faced tile one step, down to a steep pit at PIT_DEPTH.
  // Only soft, open ground digs. A finished pit traps a wheeled T1 (it can
  // never move onto a higher tile) while you can still jump out.
  dig(map, tx, ty) {
    const tool = ITEMS[this.hands];
    const f = map.floorAt(tx, ty);
    if (!DIGGABLE.has(f)) {
      this.say('The ground here is too hard to dig.');
      return;
    }
    if (this.stamina < tool.staminaCost) {
      this.say('Too exhausted to dig.');
      return;
    }
    const cur = map.heightAt ? map.heightAt(tx, ty) : 0;
    if (cur <= PIT_DEPTH) {
      this.say('The pit is already dug.');
      return;
    }
    this.swingTimer = tool.swingCooldown;
    this.stamina -= tool.staminaCost;
    map.setHeight(tx, ty, cur - 1);
    map.setFloor(tx, ty, 'dirt');
    sfx.play('chop');
    this.say(cur - 1 <= PIT_DEPTH
      ? 'You finish the pit. A machine will not climb out of that.'
      : 'You dig at the ground.');
  }

  // A melee blow on the W-factory hull.
  /**
   * #149 — an usher's shove. Moves the player by (dx, dy) tiles, refusing any
   * step that would put them inside something solid, so being moved off her
   * floor can never post you into a tree or a wall.
   *
   * Deliberately NOT damage and deliberately not `detainHit`: the T-8s are
   * amenity units, and detainHit counts strikes toward a limit after which the
   * guards start wounding. An usher that eventually kills you is a guard with a
   * nicer name. All it can ever cost you is ground.
   */
  shove(map, dx, dy) {
    const solid = (x, y) => (map.isSolid ? map.isSolid(Math.floor(x), Math.floor(y)) : false);
    // Step it out rather than teleporting, so a shove past a wall stops at the
    // wall instead of skipping over it.
    const STEPS = 6;
    for (let i = 0; i < STEPS; i++) {
      const nx = this.x + dx / STEPS, ny = this.y + dy / STEPS;
      if (solid(nx, this.y) && solid(this.x, ny)) break;
      if (!solid(nx, this.y)) this.x = nx;
      if (!solid(this.x, ny)) this.y = ny;
    }
    this.hurtTimer = 0.14;   // the flash, so the shove is felt without a wound
  }

  hitFactory(obj, map, tool) {
    if (obj.destroyed) { this.say('The factory is already a smoking ruin.'); return; }
    this.swingTimer = tool.swingCooldown || 0.5;
    this.stamina = Math.max(0, this.stamina - (tool.staminaCost ?? 0));
    // Anything lighter than a proper wrecking tool just clangs off the hull.
    if ((tool.robotDamage ?? 1) < FACTORY_MIN_TOOL) {
      sfx.play('clang', { pitch: 0.5 }); // it says clang — it should clang (deep: 8x8 of plate)
      obj.shake = 0.12;
      this.say(`The ${(tool.name || 'weapon').toLowerCase()} clangs uselessly off the factory hull. You need a sledgehammer or crowbar, explosives, or the electro-gun.`);
      return;
    }
    sfx.play('clang', { pitch: 0.5 }); // the foundry's deep ring
    const cx = obj.x + (obj.fw || 1) / 2, cy = obj.y + (obj.fh || 1) / 2;
    this.sparkAt(map, cx, cy);
    obj.shake = 0.2;
    this.damageFactory(obj, map, (tool.robotDamage ?? 1) + this.xpLevel('melee'));
  }

  // Apply `amount` damage to the factory (from a melee blow or a bomb blast);
  // when its hull gives, flatten the whole footprint to a walkable heap and
  // spill an AI key + salvage.
  damageFactory(obj, map, amount) {
    if (obj.destroyed) return;
    obj.maxHp = obj.maxHp ?? obj.hp ?? 160;
    obj.hp = (obj.hp ?? obj.maxHp) - amount;
    if (obj.hp > 0) return;
    obj.destroyed = true;
    if (obj.footprint) {
      for (const t of obj.footprint) {
        if (map.objectGrid[t.y * map.w + t.x] === obj) map.objectGrid[t.y * map.w + t.x] = null;
      }
    }
    const cx = obj.x + (obj.fw || 1) / 2, cy = obj.y + (obj.fh || 1) / 2;
    map.groundItems.push({ item: 'ai_key', qty: 1, x: cx, y: cy });
    map.groundItems.push({ item: 'scrap', qty: 6, x: cx + 0.6, y: cy });
    map.groundItems.push({ item: 'battery', qty: 4, x: cx - 0.6, y: cy });
    // BLACK PLATE, the whole set, off the floor of the thing that made all the
    // others. It is the only place it comes from and there is one factory an
    // island, so a full black set is a record of four factories rather than a
    // grind. Laid out in a small arc so the pieces do not stack into one pile.
    ARMOUR_SLOTS.forEach((slot, i) => {
      const a = (i / ARMOUR_SLOTS.length) * Math.PI * 2;
      map.groundItems.push({
        item: armourKey('x', slot), qty: 1,
        x: cx + Math.cos(a) * 1.1, y: cy + Math.sin(a) * 0.8,
        keep: true,   // it does not rot: this is the prize for taking a factory
      });
    });
    this.addScore(40);
    sfx.play('treefall');
    this.say('The W-factory buckles and collapses in a roar. An AI key glints in the wreckage.');
  }

  // Hammer the mainframe core — the AI itself — the way you crack the factory:
  // heavy kit only, many blows. When its hull gives, the island's mind dies and
  // `onCoreDefeated` fires (main.js powers down the island + the victory modal).
  hitCore(obj, map, tool) {
    if (obj.defeated) { this.say('The core stands dark and dead.'); return; }
    // Depart mode (R3): Calypso is not yours to break. The core takes no damage
    // and never falls to a wrecking tool — leaving is the sea, not her ruin.
    if (obj.indestructible) {
      this.swingTimer = tool.swingCooldown || 0.5;
      sfx.play('swing'); obj.shake = 0.1;
      this.say('You strike the core and it does not care. She is not yours to break — the way out of Ogygia is the sea, not her ruin.');
      return;
    }
    // Shielded (kill mode): the housing rides behind a field until this island's
    // own virus is run at the core's terminal. The tell points at the terminal,
    // so a player who has only ever hit things learns there is a code to find.
    if (obj.shielded) {
      this.swingTimer = tool.swingCooldown || 0.5;
      sfx.play('clang', { pitch: 1.5 }); obj.shake = 0.08;
      this.say(`A field turns the blow a hand's width from the housing. ${obj.ai || 'The core'} is shielded — its own code, forged at a relay on this island, is the only thing that drops it. Try its terminal.`);
      return;
    }
    this.swingTimer = tool.swingCooldown || 0.5;
    this.stamina = Math.max(0, this.stamina - (tool.staminaCost ?? 0));
    if ((tool.robotDamage ?? 1) < FACTORY_MIN_TOOL) {
      sfx.play('swing'); obj.shake = 0.12;
      this.say(`The ${(tool.name || 'weapon').toLowerCase()} rings off the core — you need a wrecking tool, explosives, or the electro-gun to crack it.`);
      return;
    }
    sfx.play('clang', { pitch: 0.55 }); // the daemon's housing: nearly as deep as the foundry
    const cx = obj.x + (obj.fw || 1) / 2, cy = obj.y + (obj.fh || 1) / 2;
    this.sparkAt(map, cx, cy);
    obj.shake = 0.2;
    this.damageCore(obj, map, (tool.robotDamage ?? 1) + this.xpLevel('melee'));
  }

  // Apply `amount` to the core (melee, a bomb blast, or the electro-gun's arc).
  // On kill, mark it defeated and fire the island-death hook exactly once.
  damageCore(obj, map, amount) {
    // depart mode: she cannot be razed. shielded: the field turns bombs and the
    // electro-arc too, so no weapon route skips the code. (Both land here.)
    if (obj.defeated || obj.indestructible || obj.shielded) return;
    obj.maxHp = obj.maxHp ?? obj.hp ?? 250;
    obj.hp = (obj.hp ?? obj.maxHp) - amount;
    if (obj.hp > 0) { this.daemonSpeak(obj); return; }
    // Death throe: a heavy blow can leap the core from above 10% straight to
    // dead, skipping the final movement of the aria. The first time that would
    // happen, it clings to a last sliver and speaks the dying lines instead —
    // one more blow finishes it. (Also just reads well: the god will not quite go.)
    if (!obj._throed && obj._voiceTier !== 'dying') {
      obj._throed = true;
      obj.hp = Math.max(1, Math.round(obj.maxHp * 0.03));
      obj.shake = 0.3;
      this.daemonSpeak(obj);
      return;
    }
    obj.defeated = true;
    const cx = obj.x + (obj.fw || 1) / 2, cy = obj.y + (obj.fh || 1) / 2;
    for (let s = 0; s < 14; s++) this.sparkAt(map, cx + (Math.random() - 0.5) * (obj.fw || 4), cy + (Math.random() - 0.5) * (obj.fh || 4));
    this.addScore(200);
    // The last words carry onto the victory modal (the fireworks would cover a
    // voice-band line), so hand them to the kill hook.
    obj.lastWords = DAEMON_FINAL;
    if (this.onCoreDefeated) this.onCoreDefeated(obj);
  }

  // Speak the next line of the core's death-aria. Gated so the monologue reads:
  // a fresh line fires instantly when the aria crosses into a new movement
  // (wrath -> mercy -> dying), and otherwise no faster than MIN_VOICE_GAP, so
  // rapid blows don't flicker through the whole script at once. The per-tier
  // index advances so successive lines within a movement are revealed in order.
  daemonSpeak(obj) {
    const MIN_VOICE_GAP = 2.4;
    const frac = obj.hp / (obj.maxHp || 1);
    const tier = daemonTier(frac);
    const now = this.playSeconds || 0;
    const changed = obj._voiceTier !== tier;
    if (!changed && now - (obj._voiceAt ?? -99) < MIN_VOICE_GAP) return;
    if (changed) { obj._voiceTier = tier; obj._voiceIdx = 0; }
    const pool = DAEMON_VOICE[tier] || [];
    if (!pool.length) return;
    const raw = pool[Math.min(obj._voiceIdx || 0, pool.length - 1)];
    const ai = obj.ai || 'ZEUS';
    const line = raw.replace(/\{AI\}/g, ai);   // the core speaks its OWN name
    obj._voiceIdx = (obj._voiceIdx || 0) + 1;
    obj._voiceAt = now;
    this.daemonVoice = { text: line, ttl: 5.5, tier, ai };
  }

  // Smash an abandoned car open. A crowbar (high robotDamage) pries it apart
  // in a couple of blows; anything else takes longer. When it gives, scatter
  // what was left inside around the wreck.
  smashCar(obj, map, tool) {
    if (obj.smashed) { this.say('The wreck is already stripped.'); return; }
    if (!tool || (tool.kind !== 'tool' && tool.kind !== 'gun')) {
      this.say('You need something to break it open — a crowbar works best.');
      return;
    }
    if (this.stamina < (tool.staminaCost ?? 4)) { this.say('Too exhausted.'); return; }
    this.swingTimer = tool.swingCooldown ?? 0.5;
    this.stamina -= tool.staminaCost ?? 4;
    sfx.play('chop');
    obj.hp = (obj.hp ?? 10) - (tool.robotDamage ?? 1);
    obj.shake = 0.3;
    map.shaking.add(obj);
    if (obj.hp > 0) {
      this.say('You smash at the car. Glass and metal give.');
      return;
    }
    obj.smashed = true;
    this.addScore(3);
    sfx.play('treefall');
    // Loot spills out at your feet (the car footprint itself is solid, so it
    // must land on the walkable tile you're standing on to be collectable).
    // A car battery is a generous find; the rest is a grab-bag of salvage,
    // tools, and reading matter.
    const drop = (item, qty) => map.groundItems.push({
      item, qty, x: this.x + (Math.random() - 0.5) * 0.8, y: this.y + (Math.random() - 0.5) * 0.8,
    });
    drop('battery', 2 + Math.floor(Math.random() * 2)); // the big car battery
    if (Math.random() < 0.5) drop('seatbelt', 1);
    if (Math.random() < 0.35) drop(['bat', 'machete', 'crowbar'][Math.floor(Math.random() * 3)], 1);
    if (Math.random() < 0.3) drop(['book_wood', 'book_herbs', 'book_track', 'book_run'][Math.floor(Math.random() * 4)], 1);
    if (Math.random() < 0.5) drop('scrap', 1 + Math.floor(Math.random() * 2));
    if (Math.random() < 0.4) drop('tin', 1);
    if (Math.random() < 0.3) drop('torch', 1);
    this.say('You break the car open and strip what is inside.');
  }

  // Search a resistance cache with the free hand — usable whatever the
  // primary hand is holding, gun, tool, or nothing.
  openBox(obj, map) {
    this.swingTimer = 0.4;
    if (obj.opened) {
      this.say('The box is empty.');
      return;
    }
    obj.opened = true;
    const drops = Array.isArray(obj.loot) ? obj.loot : [obj.loot];
    for (const l of drops) map.groundItems.push({ ...l, x: this.x, y: this.y });
    this.addScore(SCORE.cache);
    sfx.play('pickup');
    if (obj.starterCache) {
      // A one-off note left with the welcome kit rather than a full lore
      // fragment: it doesn't need tracking or re-reading, just to be seen once.
      this.say('A note, pinned inside the lid: "Whoever finds this — pack, shield, '
        + 'something that shoots, something to eat. Don\'t go out there empty-handed. '
        + 'Learn the towers before you learn to run from them. Good luck." '
        + `Inside: ${drops.map((l) => ITEMS[l.item].name.toLowerCase()).join(', ')}.`);
    } else if (drops.some((l) => ITEMS[l.item] && ITEMS[l.item].backspace)) {
      // A deleted object recovered from the Backspace (paper book / vinyl).
      const names = drops.map((l) => ITEMS[l.item].name).join(', ');
      this.say(`Inside, something backspaced out of the world: ${names}. A form they couldn't watch you use — so they deleted it, and it fell through to here.`);
    } else {
      this.say(`You prise open the cache: ${drops.map((l) => ITEMS[l.item].name.toLowerCase()).join(', ')}.`);
    }
    // Recovered documents packed in with the cache — RON's dispersed record,
    // now concentrated where you actually search. Fold them into the Scrapbook.
    if (Array.isArray(obj.lore) && obj.lore.length && this.onFindLore) {
      let n = 0;
      for (const id of obj.lore) if (this.onFindLore(id)) n++;
      obj.lore = []; // consumed — a re-stocked box won't re-grant them
      if (n) this.say(n > 1
        ? `Wedged in beside it: a stack of papers, bound with wire. You unfold ${n} documents into your Scrapbook (J).`
        : `Wedged in beside it: a single sheet, filed to your Scrapbook (J).`);
    }
  }

  // Set fire to the nearest obelisk in range and roughly in front. Five hits
  // bring one down; it looks more damaged each time and finally collapses
  // into a heap of salvage. Costs a battery per shot.
  // The nearest un-destroyed obelisk in front and within range, or null.
  obeliskInFront(map, range) {
    let ob = null, best = Infinity;
    for (const o of map.objects) {
      if (o.type !== 'obelisk' || o.destroyed) continue;
      const dx = o.x + 0.5 - this.x, dy = o.y + 0.5 - this.y;
      const d = Math.hypot(dx, dy);
      if (d > range) continue;
      if (dx * this.facing.x + dy * this.facing.y < 0) continue;
      if (d < best) { best = d; ob = o; }
    }
    return ob;
  }


  // Land `amount` burns on an obelisk: scorch/shrink it, report the attack up
  // the network (a W4 is dispatched), and fell it once it reaches five. Shared
  // by the OB_gun (`burnObelisk`) and the electro-gun's arc.
  damageObelisk(ob, map, amount = 1) {
    ob.obDamage = (ob.obDamage || 0) + amount;
    ob.burning = 3; // seconds of visible flame, ticked by the renderer/main
    // Every attack on an obelisk is reported up the network: the W-factory
    // answers by dispatching a W4 hunter-killer after you (main throttles
    // this so it can't be spammed by rapid-fire hits).
    if (this.onObeliskAttacked) this.onObeliskAttacked(ob);
    if (ob.obDamage >= 5) {
      ob.destroyed = true;
      // The heap is walkable now, so the salvage on it can be collected.
      map.objectGrid[ob.y * map.w + ob.x] = null;
      this.spillObeliskSalvage(ob, map);
      this.say(`Obelisk ${ob.code || ''} buckles and comes down in a shower of sparks and circuitry.`);
    } else {
      // Round UP so a fractional chip (the robot-sword lands half a burn a
      // stroke) still reads as whole hits to go, never "4.5 more".
      this.say(`The obelisk catches fire. ${Math.ceil(5 - ob.obDamage)} more should finish it.`);
    }
  }

  // A bomb's fuse has run out: a cloud of fire that hurts every living thing
  // in its radius (you included), and — for the insane bomb — brings down any
  // obelisk caught in the blast. Called from main when b.fuse <= 0.
  detonateBomb(b, map, animals, robots, droids, obeliskObjs) {
    const hitList = (arr, robot) => {
      for (const e of arr) {
        if (e.dead || e.fused) continue;
        if (robot && e.zombie) continue; // bombs can't touch a zombified machine either
        if (Math.hypot(e.x - b.x, e.y - b.y) > b.radius) continue;
        e.hp -= b.damage; e.hurt = true; e.justHurt = true;
        // You set the fuse, so whatever it kills is yours (achievements-plan §4).
        if (robot) { e._lastHitBy = 'weapon'; achieveEvent('handDamage', {}); }
        if (robot) { e.scrapPenalty = true; this.sparkAt(map, e.x, e.y); }
        if (e.hp <= 0 && !robot) { e.dead = true; achieveEvent('animalKilled', { type: e.type }); map.groundItems.push({ item: 'meat', qty: 1, x: e.x, y: e.y }); this.addScore(SCORE.animal); }
        else if (e.hp <= 0 && robot) this.addScore(SCORE.robot);
      }
    };
    hitList(animals, false);
    hitList(robots, true);
    if (droids) hitList(droids, true);
    if (Math.hypot(this.x - b.x, this.y - b.y) <= b.radius) this.takeDamage(b.damage * 0.6, 'the blast');
    // A blast near the W-factory chews into its hull too (its footprint is
    // big, so measure to the nearest edge of it, not just its centre).
    const fac = map.objects.find((o) => o.type === 'wfactory' && !o.destroyed);
    if (fac) {
      const nx = Math.max(fac.x, Math.min(b.x, fac.x + (fac.fw || 1)));
      const ny = Math.max(fac.y, Math.min(b.y, fac.y + (fac.fh || 1)));
      if (Math.hypot(nx - b.x, ny - b.y) <= b.radius) this.damageFactory(fac, map, b.damage);
    }
    if (b.obelisk && obeliskObjs) {
      for (const ob of obeliskObjs) {
        if (ob.destroyed) continue;
        if (Math.hypot(ob.x + 0.5 - b.x, ob.y + 0.5 - b.y) > b.radius) continue;
        ob.destroyed = true;
        map.objectGrid[ob.y * map.w + ob.x] = null;
        this.spillObeliskSalvage(ob, map);
      }
    }
  }

  // The heap of salvage a physically-destroyed obelisk leaves behind: its one
  // numbered circuit board (1-8, guaranteed spread across the towers — collect
  // all eight for a wave gun), batteries, scrap, and — always — an access chip,
  // so felling any tower hands you the means to jack into the others. Shared by
  // the OB_gun and the insane bomb. (Not called by AI-ML `crash`, which only
  // knocks a tower dark temporarily and leaves nothing behind.)
  spillObeliskSalvage(ob, map) {
    this.addScore(20);
    const num = ob.circuitNum || (1 + Math.floor(Math.random() * 8));
    map.groundItems.push({ item: 'circuit', qty: 1, num, x: ob.x + 0.5, y: ob.y + 0.5 });
    map.groundItems.push({ item: 'battery', qty: 4, x: ob.x + 0.5, y: ob.y + 0.5 });
    map.groundItems.push({ item: 'scrap', qty: 3, x: ob.x + 0.5, y: ob.y + 0.5 });
    map.groundItems.push({ item: 'chip', qty: 1, x: ob.x + 0.3, y: ob.y + 0.7 });
    if (ob.code) this.killLog.push(ob.code);
    if (this.onObeliskDestroyed) this.onObeliskDestroyed(ob);
  }


  // Walk over dropped loot to collect it (if there is room). A backpack
  // found on the ground is worn, not stowed. A better weapon than the one
  // in hand is equipped on the spot; the old tool goes to the backpack's
  // spare-weapon slot if there's one free, otherwise a pocket, otherwise
  // the ground.
  pickupNearby(map) {
    for (const gi of map.groundItems) {
      if (Math.hypot(gi.x - this.x, gi.y - this.y) > PICKUP_RANGE) continue;
      const def = ITEMS[gi.item];
      if (def.kind === 'backpack') {
        if (this.backpack) continue; // already carrying one; leave it be
        this.backpack = { slots: new Array(16).fill(null), weapon: null };
        gi.qty -= 1;
        sfx.play('pickup');
        this.say('You find a backpack — 16 more slots, and room for a spare weapon.');
        continue;
      }
      // Books are read on the spot for their knowledge, not carried.
      if (def.kind === 'book') {
        gi.qty -= 1;
        sfx.play('pickup');
        this.learnFromBook(gi.item);
        continue;
      }
      if (def.kind === 'tool' && (def.tier ?? 0) > (ITEMS[this.hands]?.tier ?? 0)) {
        const old = this.hands;
        this.hands = gi.item;
        this.discoverWeapon(gi.item);
        gi.qty -= 1;
        // Only stow the displaced item if there was one — grabbing a tool
        // with empty hands must not try to stow null (that used to throw and
        // freeze the game when opening a crate bare-handed).
        if (old) {
          if (this.backpack && !this.backpack.weapon) {
            this.backpack.weapon = old;
          } else if (this.stow(old, 1) === 0) {
            map.groundItems.push({ item: old, qty: 1, x: this.x, y: this.y });
          }
        }
        sfx.play('pickup');
        this.say(`You take the ${def.name.toLowerCase()} in hand.`);
        continue;
      }
      // A WORKING NOSTBOOK GOES STRAIGHT INTO ITS CRADLE. It has a slot of its
      // own on the dashboard and there is nothing else it can do in a pocket.
      if (gi.item === 'laptop' && !this.laptop) {
        this.laptop = gi.machine
          || { model: 'laptop', os: 'unix', heat: 0, damage: null, netUp: true };
        gi.qty -= 1;
        sfx.play('pickup');
        this.say('A NostBook, and it lights. It goes in the cradle — press L.');
        continue;
      }
      // PLATE GOES ON WHERE YOU STAND. Walking over a better helm and then
      // having to open a panel to use it is the friction that makes a player
      // ignore a whole system, so it is worn on pickup when it is an
      // improvement and what came off goes into the bag rather than vanishing.
      if (def.kind === 'armour') {
        const { worn, displaced } = this.wearArmour(gi.item);
        if (worn) {
          gi.qty -= 1;
          if (displaced && this.stow(displaced.item, 1) === 0) {
            map.groundItems.push({ item: displaced.item, qty: 1, x: this.x, y: this.y });
          }
          sfx.play('pickup');
          this.say(`${def.name} \u2014 on. ${displaced ? 'The old piece goes in the bag.' : ''}`.trim());
          continue;
        }
        // Not an improvement: it goes in the bag like anything else, and the
        // panel is there for a player who wants it on anyway.
      }
      const stored = this.stow(gi.item, gi.qty);
      if (stored <= 0) {
        // Nothing fit: with no backpack to overflow into, the pockets are full.
        // Nudge the player to go find a backpack — but only a couple of times,
        // so it never nags. (The hint counter persists for the run.)
        if (!this.backpack && (this._backpackHints || 0) < 2) {
          this._backpackHints = (this._backpackHints || 0) + 1;
          this.say('Your pockets are full. A backpack would carry far more — go find one.');
        }
        continue;
      }
      gi.qty -= stored;
      this.discoverWeapon(gi.item);
      // A recovered book or album leaves a page in the Scrapbook (cover +
      // what it is), the same way a read skill-book does — you carry the object
      // AND a record of it. onFileNote dedupes, so re-grabbing won't double it.
      if (def.kind === 'paperbook' || def.kind === 'record' || def.kind === 'tape') this._fileBookNote(def);
      // Numbered circuit boards go toward the wave gun.
      if (gi.item === 'circuit' && gi.num != null) this.circuitNums.add(gi.num);
      // A found Wi-Fi block comes with a charge — a genuine reward, and
      // usable at once (hold it, and top it up with batteries later).
      if (gi.item === 'wifiblock') this.wifiPower = (gi.power != null) ? gi.power : this.wifiMax;
      // #159 — a HERMES card cut off a dead carrier rather than forged at a
      // relay. It works; it is also a credential the net has already listed as
      // missing, and the flag is what everything downstream reads to know which
      // of the two routes the player took. Sticky: nothing washes it off.
      if (gi.item === 'hermes_card' && gi.traced) {
        this.hermesTraced = true;
        if (this.onHermesSeized) this.onHermesSeized(this);
      }
      sfx.play('pickup');
      this.say(gi.item === 'wifiblock'
        ? 'You find a Wi-Fi block — hold it and the machines cannot see you.'
        : gi.item === 'ai_key'
        ? 'AI key. Jack into an obelisk and type  copy aikey  — then you can print spares, or back it up at a HERMES relay, and never lose it.'
        : `+${stored} ${ITEMS[gi.item].name.toLowerCase()}`);
    }
    map.groundItems = map.groundItems.filter((gi) => gi.qty > 0);
  }

  /**
   * #159 — a swarm unit earthing itself on the field. Burns charge and nothing
   * else: the field still stops the blow, it just costs to keep standing there.
   * Returns true if the field was up and took it.
   */
  drainField(seconds = FORCEFIELD_SWARM_COST) {
    if (!this.forcefieldActive()) return false;
    this.forcefieldCharge = Math.max(0, this.forcefieldCharge - seconds);
    return true;
  }

  /**
   * #159 — how armed this person looks to a machine sizing up a response, 0-3.
   * Read off what is actually IN HAND plus whether an energy shell is up, which
   * is the pair Henrik found trivialised the B-1 (a robot-sword behind a
   * forcefield). Deliberately not a tally of everything in the bag: the factory
   * can see what you are holding, not what you are carrying.
   */
  weaponThreat() {
    const d = ITEMS[this.hands];
    const dmg = (d && d.robotDamage) || 0;
    let n = dmg >= 9 ? 2 : dmg >= 5 ? 1 : 0;
    if (this.forcefieldActive()) n += 1;
    return n;
  }

  forcefieldActive() {
    return this.hasItem('forcefield') && this.forcefieldArmed && this.forcefieldCharge > 0;
  }

  // Forcefield charge as a 0..1 fraction of a full cell, for the HUD gauge.
  forcefieldFrac() {
    return Math.max(0, Math.min(1, this.forcefieldCharge / FORCEFIELD_MAX));
  }

  // Arm/disarm the forcefield — from a click on the item (equipSlot) or the T
  // key. Disarming stops the cell draining, so you can save battery between
  // fights instead of letting it burn while carried.
  toggleForcefield() {
    if (!this.hasItem('forcefield')) { this.say('You have no forcefield to arm.'); return; }
    this.forcefieldArmed = !this.forcefieldArmed;
    this.say(this.forcefieldArmed
      ? 'Forcefield armed — it powers up once it has a battery.'
      : 'Forcefield disarmed — the cell stops draining.');
  }

  // While the electro-compass is armed and carried, the facing chevron
  // becomes a cluster of pointers — one per category of notable thing,
  // each to the nearest of its kind, colour-coded: factory (blue), obelisk
  // (green), a dropped backpack (yellow), a dropped OB_gun (orange). The AI
  // mainframe (red) will slot in here once it exists. Returns an array of
  // {x, y, color}, one entry per category that has something to point at.
  compassTargets() {
    const map = this.map;
    if (!map) return [];
    const nearest = {}; // color -> {x,y,d}
    const consider = (x, y, color) => {
      const d = Math.hypot(x - this.x, y - this.y);
      if (!nearest[color] || d < nearest[color].d) nearest[color] = { x, y, d };
    };
    for (const o of map.objects) {
      if (o.type === 'wfactory' && !o.destroyed) consider(o.x + (o.fw || 1) / 2, o.y + (o.fh || 1) / 2, '#4f8fe0');
      else if (o.type === 'obelisk' && !o.destroyed) consider(o.x + 0.5, o.y + 0.5, '#4fe07a');
    }
    for (const gi of (map.groundItems || [])) {
      if (gi.item === 'backpack') consider(gi.x, gi.y, '#e6d24a');
      else if (gi.item === 'obgun') consider(gi.x, gi.y, '#e0842f');
    }
    return Object.entries(nearest).map(([color, t]) => ({ x: t.x, y: t.y, color }));
  }

  // A laser is on its way. Returns how it's stopped, if at all:
  //  'reflect' — a mirror shield throws it back, destroying the shooter
  //  'absorb'  — a plain shield or the forcefield eats it
  //  null      — nothing stops it; it lands
  // Shields work while simply CARRIED (hand, pocket, or pack) — they're a
  // worn deflector, not something you have to hold up and aim — and cover you
  // from any direction. The mirror shield takes priority over the plain one.
  blockRangedShot() {
    // Called once per incoming shot as it resolves, so this is also where a
    // shield ages: each call is one blow landing on it.
    if (this.forcefieldActive()) {
      // Energy shell — never breaks, but swallowing a blow costs extra charge.
      this.forcefieldCharge = Math.max(0, this.forcefieldCharge - FORCEFIELD_HIT_COST);
      return 'absorb';
    }
    if (this.hasItem('mirror_shield')) {
      // Reflect only while cool; each bolt heats it, and at full heat it melts.
      const cool = this.mirrorHeat < MIRROR_HEAT_FADE;
      const wasCool = cool;
      this.mirrorHeat = Math.min(1, this.mirrorHeat + MIRROR_HEAT_PER_HIT);
      if (wasCool && this.mirrorHeat >= MIRROR_HEAT_FADE) {
        this.say('The mirror shield flares cherry-red — too hot to throw shots back now.');
      }
      if (this.mirrorHeat >= 1) { this._meltMirrorShield(); return 'absorb'; }
      return cool ? 'reflect' : 'absorb';
    }
    if (this.hasItem('aspis')) {
      this.aspisHits += 1;
      if (this.aspisHits >= ASPIS_HITS) { this._breakAspis(); return 'absorb'; }
      if (this.aspisHits === ASPIS_HITS - 5) {
        this.say('The great shield is scarred across the face — the rim is starting to go.');
      }
      return 'absorb';
    }
    if (this.hasItem('shield')) {
      this.riotShieldHits += 1;
      if (this.riotShieldHits >= RIOT_SHIELD_HITS) { this._breakRiotShield(); return 'absorb'; }
      if (this.riotShieldHits === RIOT_SHIELD_HITS - 3) {
        this.say('Your riot shield is badly dented — it will not take many more.');
      }
      return 'absorb';
    }
    return null;
  }

  // The mirror shield reaches full heat and slumps: it's gone, leaving a lump
  // of molten metal recovered as scrap. Heat resets so a fresh one starts cool.
  _meltMirrorShield() {
    this.removeItem('mirror_shield');
    this.mirrorHeat = 0;
    const got = this.stow('scrap', 3);
    if (got < 3 && this.map) this.map.groundItems.push({ item: 'scrap', qty: 3 - got, x: this.x, y: this.y });
    this.say('The mirror shield overheats and slumps into a lump of molten scrap.');
    sfx.play('hurt');
  }

  // The riot shield caves in after too many blows: gone, leaving some scrap.
  _breakRiotShield() {
    this.removeItem('shield');
    this.riotShieldHits = 0;
    const got = this.stow('scrap', 2);
    if (got < 2 && this.map) this.map.groundItems.push({ item: 'scrap', qty: 2 - got, x: this.x, y: this.y });
    this.say('Your riot shield caves in under the barrage — battered to scrap.');
    sfx.play('hurt');
  }

  // The rim finally gives, a second time — it gave once on the B-1's arm and
  // now it gives on yours. More scrap than the riot shield: it is a bigger
  // thing, and bronze.
  _breakAspis() {
    this.removeItem('aspis');
    this.aspisHits = 0;
    const got = this.stow('scrap', 4);
    if (got < 4 && this.map) this.map.groundItems.push({ item: 'scrap', qty: 4 - got, x: this.x, y: this.y });
    this.say('The great shield splits along the rim and comes apart in your hand.');
    sfx.play('hurt');
  }

  // A carried riot/mirror shield also turns a machine's physical BLOW (T1/T2
  // and the rest), not only its lasers, and wears the same way — a hit counts
  // against the riot shield, heats the mirror. No reflect on a melee blow (you
  // can't bounce a fist back), so the mirror just absorbs it. Returns true if a
  // shield ate the blow.
  absorbMeleeOnShield() {
    if (this.hasItem('mirror_shield')) {
      this.mirrorHeat = Math.min(1, this.mirrorHeat + MIRROR_HEAT_PER_HIT);
      if (this.mirrorHeat >= 1) this._meltMirrorShield();
      return true;
    }
    if (this.hasItem('aspis')) {
      this.aspisHits += 1;
      if (this.aspisHits === ASPIS_HITS - 5) this.say('The great shield is scarred across the face — the rim is starting to go.');
      if (this.aspisHits >= ASPIS_HITS) this._breakAspis();
      return true;
    }
    if (this.hasItem('shield')) {
      this.riotShieldHits += 1;
      if (this.riotShieldHits === RIOT_SHIELD_HITS - 3) this.say('Your riot shield is badly dented — it will not take many more.');
      if (this.riotShieldHits >= RIOT_SHIELD_HITS) this._breakRiotShield();
      return true;
    }
    return false;
  }

  // True if a carried shield/forcefield is currently shielding you — used to
  // draw the protective glow even when the item isn't in hand.
  shielded() {
    return this.forcefieldActive() || this.hasItem('mirror_shield') || this.hasItem('aspis') || this.hasItem('shield');
  }

  // A read on the carried plain/mirror shield's condition, for the HUD. Returns
  // { kind, frac (0 fresh -> 1 spent/melting), hot, label } or null. Mirror
  // takes priority (it's what actually protects — see blockRangedShot).
  shieldStatus() {
    // `frac` is how SPENT the shield is (0 fresh -> 1 gone); `pct` is the
    // condition remaining as a percentage, which the HUD shows.
    if (this.hasItem('mirror_shield')) {
      const frac = Math.max(0, Math.min(1, this.mirrorHeat));
      return { kind: 'mirror', frac, pct: Math.round((1 - frac) * 100), hot: frac >= MIRROR_HEAT_FADE };
    }
    if (this.hasItem('shield')) {
      const frac = Math.max(0, Math.min(1, this.riotShieldHits / RIOT_SHIELD_HITS));
      return { kind: 'riot', frac, pct: Math.round((1 - frac) * 100), hot: this.riotShieldHits >= RIOT_SHIELD_HITS - 3 };
    }
    return null;
  }

  // True when standing (not mid-jump) on top of a raised block — its
  // effective height sits above the bare terrain height there.
  onBlockTop() {
    const m = this.map;
    if (!m || !m.effectiveHeightAt || !m.heightAt || this.z > 0) return false;
    const fx = Math.floor(this.x), fy = Math.floor(this.y);
    // Only a TALL block is a real safe perch — a wall you double-jump onto
    // (climbHeight 2.5). A low crate or rock (climbHeight 1) lifts you but not
    // out of a machine's reach: robots strike up onto it (see reachBonus in
    // robots.js), so a loot box is no longer an invincibility pedestal.
    return m.effectiveHeightAt(fx, fy) - m.heightAt(fx, fy) >= 2;
  }

  // Depart mode (R3): a hit from one of Calypso's fortress guards. Being caught
  // in her domain means being KEPT, not killed — the first few strikes daze you
  // with the same lotus torpor and shove you back toward the centre (a warning).
  // Sustained intrusion past DETAIN_LIMIT turns lethal: her patience runs out and
  // the blow lands for real. `amount` is the guard's ordinary damage, used once
  // the detention escalates. The strike count cools while you are off her radar
  // (reset by the guard-free quiet in update), so a later foray warns again.
  detainHit(amount, source) {
    if (this._ended || this.deathCert) return;
    // Shields/forcefield still turn the blow, exactly as in combat.
    if (this.forcefieldActive()) { this.forcefieldCharge = Math.max(0, this.forcefieldCharge - FORCEFIELD_HIT_COST); this.hurtTimer = 0.12; return; }
    if (source === 'machine' && this.absorbMeleeOnShield()) { this.hurtTimer = 0.12; return; }
    this._detainStrikes = (this._detainStrikes || 0) + 1;
    this._detainCool = 0; // resets the off-radar cooldown in update
    if (this._detainStrikes <= DETAIN_LIMIT) {
      // Warned, not wounded: a dose of torpor and a push back toward the island's
      // heart — kalyptō, detention by comfort.
      this.torpor = Math.min(TORPOR_MAX, this.torpor + DETAIN_TORPOR);
      const cx = (this.map && this.map.w ? this.map.w / 2 : this.x);
      const cy = (this.map && this.map.h ? this.map.h / 2 : this.y);
      const dx = cx - this.x, dy = cy - this.y, d = Math.hypot(dx, dy) || 1;
      this.x += (dx / d) * DETAIN_PUSH;
      this.y += (dy / d) * DETAIN_PUSH;
      this.hurtTimer = 0.2;
      sfx.play('hurt', { pitch: 1.4 }); // a softer, higher note than a real wound
      if (this._detainStrikes === 1) this.say('The guard takes you gently by the arm and turns you back inward. A sweetness fogs your head. You are being kept, not killed — for now.');
      else this.say('Turned back again, and dazed. Her guards will not let you leave this way — press it and their patience ends.');
      return;
    }
    // Patience spent: the detention turns real. From here the guard wounds.
    if (this._detainStrikes === DETAIN_LIMIT + 1) this.say('Her guards give up on gentleness. The next blows are meant to hurt.');
    this.takeDamage(amount, source);
  }

  takeDamage(amount, source) {
    // CREATIVE MODE (Hedda's, via LYRE). Nothing can hurt you, so the island can
    // be walked, read and tested without the fight interrupting — but the world
    // is otherwise untouched: the machines still hunt, the swarm still comes,
    // and you can still kill every one of them if you are so inclined. It is
    // not god mode, it is a held breath.
    //
    // The hit still REGISTERS (the flash, the sound at the call site), because a
    // tester needs to see that a thing connected — silence would make a broken
    // hitbox and a working one look identical.
    if (this.creative) { this.hurtTimer = 0.12; return; }
    // The same scale the attrition sites use (see `harm`), so a blow and the sea
    // cannot disagree about what a mode means.
    amount = modeHarm(this, amount);
    // The forcefield stops everything — shot or blow — while it's up, but each
    // blow it eats costs charge, so being swarmed drains the cell fast.
    if (this.forcefieldActive()) {
      this.forcefieldCharge = Math.max(0, this.forcefieldCharge - FORCEFIELD_HIT_COST);
      this.hurtTimer = 0.12;
      return;
    }
    // A carried riot/mirror shield turns a machine's melee blow too (not just
    // its lasers, which blockRangedShot already handles), wearing as it does.
    if (source === 'machine' && this.absorbMeleeOnShield()) { this.hurtTimer = 0.12; return; }
    // Up on a block top, ground enemies can't reach you — melee, bites, and
    // lasers all fall short. (A bomb blast still catches you; flying machines,
    // to come, will too.) So they keep trying in vain while you're safe up high.
    if (source !== 'the blast' && this.onBlockTop()) return;
    // THE PLATE TAKES ITS SHARE FIRST, and is worn by taking it. Every piece
    // you have on loses a point per blow, so a set is something you are
    // standing inside for as long as it lasts rather than a permanent upgrade.
    // Combat only: armour does not help with hunger, venom or cold water.
    if (source !== 'starvation' && source !== 'the venom'
      && source !== 'the cold sea' && source !== 'the cold river') {
      const { reduction, broke } = takeHit(this.armour, (k) => ITEMS[k]);
      if (reduction > 0) amount *= (1 - reduction);
      for (const key of broke) {
        const d = ITEMS[key] || {};
        this.say(`Your ${d.short || d.name || 'plate'} comes apart and falls away.`);
        sfx.play('hurt');
      }
    }
    // Reverse-log depletion in the low zone: once the bar is flashing, soften
    // incoming combat damage toward a floor, so it drains slower and slower the
    // closer you are to death — a beat to notice and run instead of dropping dead
    // the instant it flashes. (Combat only; starve/venom/drowning still bite.)
    const LOW = this.maxHealth * 0.30;
    if (this.health < LOW && amount > 0) {
      const t = Math.max(0, this.health / LOW);   // 1 at the threshold -> 0 at empty
      amount *= 0.30 + 0.70 * t;                   // full at the threshold, down to 0.30x near empty
    }
    this.health -= amount;
    this.hurtTimer = 0.35;
    if (source === 'viper') sfx.play('hiss');
    sfx.play('hurt');
    if (this.health <= 0) {
      if (this.skylinkActive) this.dieToSkylink();
      else this.die(this.map, `the ${source}`);
    }
  }

  // Caught in POSEIDON's final 30-second purge: there is no waking back up
  // at the road this time — the certificate shows straight away, same
  // ending as simply running out the clock.
  dieToSkylink() {
    if (this._ended) return;
    this._ended = true;
    this.deaths = (this.deaths || 0) + 1;
    this.deathCert = {
      name: this.name, gender: this.gender, cause: 'POSEIDON coming online',
      score: this.score, skills: [...this.skills], deaths: this.deaths, skylink: true,
      ...modeStamp(this),
    };
    if (this.onDeath) this.onDeath();
    sfx.play('die');
  }

  // Death: you lose everything you were carrying (it is not dropped — it's
  // gone), and wake back at the spawn point with just a penknife.
  die(map, cause) {
    map = map || this.map;
    // A certificate of death, snapped from the run's final state. The score
    // is cumulative and survives; deaths count up. main shows it as a modal.
    this.deaths = (this.deaths || 0) + 1;
    this.deathCert = {
      name: this.name, gender: this.gender, cause, score: this.score,
      skills: [...this.skills], deaths: this.deaths, ...modeStamp(this),
    };
    if (this.onDeath) this.onDeath();

    this.pockets = [{ item: 'note_home', qty: 1 }, null, null, null]; // the note is with you each new run
    this.backpack = null;
    this.selectedPocket = null;
    this.hands = 'penknife';
    this.health = this.maxHealth;
    this.stamina = this.maxStamina;
    this.food = this.maxFood;
    this.venom = 0;
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.z = 0;
    this.vz = 0;
    sfx.play('die');
    this.say(`You were killed by ${cause}. You lose everything and wake back at the road.`);
  }

  // Add qty of an item to pockets, stacking first, then overflow into the
  // backpack (if carried). Returns how many fitted.
  // Armour goes ON when you pick it up, and only into the pack when it is not
  // an improvement — walking over a better helm and then having to open a panel
  // to use it is the friction that makes a player ignore a whole system.
  // Returns the piece that came off, so the caller can stow it rather than
  // having it vanish. null means nothing was worn.
  wearArmour(itemKey) {
    const def = ITEMS[itemKey];
    const slot = slotOf(def);
    if (!slot) return { worn: false, displaced: null };
    if (!this.armour) this.armour = { head: null, chest: null, legs: null, feet: null };
    if (!shouldWear(this.armour, def, (k) => ITEMS[k])) return { worn: false, displaced: null };
    const off = this.armour[slot];
    this.armour[slot] = freshPiece(itemKey, (k) => ITEMS[k]);
    return { worn: true, displaced: off };
  }

  /** Every worn piece, for the save and for the panel. */
  armourWorn() {
    const out = {};
    for (const s of ARMOUR_SLOTS) out[s] = (this.armour && this.armour[s]) || null;
    return out;
  }

  stow(itemKey, qty) {
    if (!itemKey || !ITEMS[itemKey]) return 0; // never stow a null/unknown item
    let left = this._fillSlots(this.pockets, itemKey, qty);
    if (left > 0 && this.backpack) left = this._fillSlots(this.backpack.slots, itemKey, left);
    const took = qty - left;
    // Every card in the escape chain is a rung of the story, so picking one up
    // is worth noticing. One event, keyed by which card it was.
    if (took > 0 && CARD_ITEMS.has(itemKey)) achieveEvent('cardTaken', { card: itemKey });
    return took;
  }

  // Stack into existing matching slots first, then fill empty ones.
  // Returns how much of qty is left over (didn't fit in this slot array).
  _fillSlots(slots, itemKey, qty) {
    const def = ITEMS[itemKey];
    let left = qty;
    for (let i = 0; i < slots.length && left > 0; i++) {
      const slot = slots[i];
      if (slot && slot.item === itemKey && slot.qty < def.stack) {
        const take = Math.min(left, def.stack - slot.qty);
        slot.qty += take;
        left -= take;
      }
    }
    for (let i = 0; i < slots.length && left > 0; i++) {
      if (!slots[i]) {
        const take = Math.min(left, def.stack);
        slots[i] = { item: itemKey, qty: take };
        left -= take;
      }
    }
    return left;
  }

  say(text) {
    this.message = { text, ttl: 3 };
  }

  moveAxis(dx, dy, map) {
    const nx = this.x + dx;
    const ny = this.y + dy;
    if (!this.collides(nx, ny, map)) {
      this.x = nx;
      this.y = ny;
    }
  }

  // Knockback from a fight (or a bad spawn spot) can leave the player
  // embedded in solid geometry. Detect it and step out to the nearest open
  // tile, spiralling outward ring by ring, rather than leaving them stuck.
  unstickIfTrapped(map) {
    if (!this.collides(this.x, this.y, map)) return;
    const cx = Math.floor(this.x), cy = Math.floor(this.y);
    for (let r = 1; r <= 6; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; // ring only
          const nx = cx + dx + 0.5, ny = cy + dy + 0.5;
          if (!this.collides(nx, ny, map)) {
            this.x = nx;
            this.y = ny;
            this.say('You wrench yourself free.');
            return;
          }
        }
      }
    }
  }

  // Sample the four corners of the player's bounding square. A corner
  // blocks if its tile is solid or too many height levels away. The height
  // you can step in one move depends on what you're doing:
  //   on foot        -> 1  (walk up a terrain step, over rubble/rock)
  //   a normal jump   -> 2  (hop onto higher ground, out of a dug pit)
  //   a double jump   -> 3  (reach a block top: walls are climbHeight 2.5)
  // A "climbable" object (wall, rubble, rock — tiles.js) counts as a raised
  // step of its climbHeight instead of flatly blocking, so it can be climbed
  // and stood on top of once there — but a wall's 2.5 is out of reach of a
  // single jump, so it takes the double jump. None of this lets a jump skip
  // terrain, which is always at most one level between adjacent tiles (the
  // generator's Lipschitz guarantee). A wheeled robot can't climb at all.
  //
  // Stepping UP is capped by maxStep (that's what stops you walking through a
  // wall from the ground). Stepping DOWN is capped too — normally — so you
  // can't stroll off a cliff or into a dug pit. The exception is when you're
  // already standing on top of a climbable object (a wall/rock): then you can
  // drop off any edge freely, so roaming a block top and walking off it feels
  // natural instead of being fenced into the middle of the block.
  collides(x, y, map) {
    const cfx = Math.floor(this.x), cfy = Math.floor(this.y);
    // Your feet, not the tile's lid. Under a deck those differ, and reading the
    // lid made stepping off the far end of a bridge look like a three-level
    // drop off something you were never standing on.
    const h = this.groundUnder(map, this.x, this.y);
    const curObj = map.objectAt ? map.objectAt(cfx, cfy) : null;
    const onLedge = !!(curObj && OBJECTS[curObj.type] && OBJECTS[curObj.type].climbable);
    const airborne = this.z > 0 || this.vz !== 0;
    const maxStep = !airborne ? 1 : (this.doubleJumped ? 3 : 2);
    // WHERE YOUR FEET ARE, for a column that has air in it (terrain stage 5).
    // `standingHeightAt` answers exactly what `effectiveHeightAt` always did on
    // an ordinary tile — it is only a different question on a tile somebody
    // built a gap into, where the surface you move onto depends on whether you
    // are above the deck or under it.
    const feetZ = h;

    // A flatly-solid, NON-climbable object (obelisk, box, car, factory)
    // blocks whenever any corner of the footprint overlaps it — that keeps
    // the body from clipping into a building or a crate. Climbable objects
    // (walls/rock/rubble) are deliberately excluded here; their passability
    // is a height question, handled below, so you can stand on and step off
    // them. Water is passable (the player swims).
    const solidCorner = (tx, ty) => {
      const obj = map.objectAt ? map.objectAt(tx, ty) : null;
      const def = obj && OBJECTS[obj.type];
      const climbable = def && def.climbable;
      // `soft` objects (trees) block robots and shots, but the player pushes
      // through them — a human's edge in the woods, where the machines can't
      // follow. So they never count as a solid corner for the player.
      const soft = def && def.soft;
      const wf = map.floorAt(tx, ty);
      return map.isSolid(tx, ty) && wf !== 'water' && wf !== 'sea' && !climbable && !soft;
    };
    if (solidCorner(Math.floor(x - RADIUS), Math.floor(y - RADIUS))
      || solidCorner(Math.floor(x + RADIUS), Math.floor(y - RADIUS))
      || solidCorner(Math.floor(x - RADIUS), Math.floor(y + RADIUS))
      || solidCorner(Math.floor(x + RADIUS), Math.floor(y + RADIUS))) return true;

    // The height step is judged on the destination's CENTRE tile, not the
    // four corners. Cornerwise height checks make a tall thin wall miserable
    // to stand on: near any edge one corner overhangs the drop and blocks
    // you, fencing you into the middle of the block and snagging you at the
    // base when you step off. Centre-tile keeps walking on, along, and off a
    // block smooth; a wall you approach from the ground still blocks because
    // its centre is a +2.5 step (out of reach on foot), and you only overlap
    // its base by the footprint radius, which reads as standing against it.
    if (!map.heightAt) return false;
    const targetH = map.standingHeightAt
      ? map.standingHeightAt(Math.floor(x), Math.floor(y), feetZ, maxStep)
      : (map.effectiveHeightAt ? map.effectiveHeightAt(Math.floor(x), Math.floor(y))
        : map.heightAt(Math.floor(x), Math.floor(y)));
    const dh = targetH - h;
    if (dh > maxStep) return true;              // too high to step up
    if (dh < -maxStep && !onLedge) return true; // too far to drop, unless walking off a ledge
    return false;
  }
}
