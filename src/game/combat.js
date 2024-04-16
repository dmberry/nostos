// Ranged weapon fire, factored out of player.js to keep that file navigable
// (part of the systems-registry refactor's file-size split; see
// docs/refactor-registry.md). These are the player's gun actions: they read and
// mutate the player, the map, and the enemy lists, so `player` is passed in as
// the first argument rather than being `this`. Everything they call back into
// (say, sparkAt, addScore, gainXp, xpLevel, beamRange, obeliskInFront,
// damageObelisk, damageFactory, scareAnimals) stays a Player method; combat.js
// imports nothing from player.js, so there is no import cycle.
//
// Also home to two combat primitives that were shared between melee and ranged
// code in player.js — the score table and the zombie-immunity rule — so both
// player.js and this module import them from one place.

import { ITEMS } from './items.js';
import { sfx } from '../engine/sound.js';

// Survival score awards. A felled tree is the baseline point; skilled tools
// and tougher kills are worth more.
export const SCORE = { tree: 1, animal: 3, robot: 10, wreck: 2, cache: 2, book: 5, fragment: 5 };

// A robot the OB-gun's beam has corrupted into a "zombie" shrugs off every
// weapon except the bow and the wave gun — the only two builds precise
// enough to hit whatever in it is still killable.
export function zombieImmune(target, tool) {
  return !!(target && target.zombie) && tool.key !== 'bow' && tool.key !== 'wavegun';
}

function burnObelisk(player, tool, map, range) {
  const ob = player.obeliskInFront(map, range);
  if (!ob) { player.say('No obelisk in your sights.'); return; }
  let i = player.pockets.findIndex((s) => s && s.item === 'battery');
  let slots = player.pockets;
  if (i < 0 && player.backpack) { i = player.backpack.slots.findIndex((s) => s && s.item === 'battery'); slots = player.backpack.slots; }
  if (i < 0) { player.say('The OB-gun needs a battery.'); return; }
  slots[i].qty -= 1; if (slots[i].qty <= 0) slots[i] = null;
  player.swingTimer = tool.swingCooldown;
  sfx.play('zap');
  player.damageObelisk(ob, map, 1);
}

// A piercing beam: cuts a straight line from the muzzle out to `range` and
// damages every enemy it passes through. Costs one round of the gun's ammo.
function pierceShot(player, tool, map, animals, robots) {
  let ai = player.pockets.findIndex((s) => s && s.item === tool.ammoType);
  let slots = player.pockets;
  if (ai < 0 && player.backpack) { ai = player.backpack.slots.findIndex((s) => s && s.item === tool.ammoType); slots = player.backpack.slots; }
  if (ai < 0) { player.say(`The ${tool.name.toLowerCase()} needs ${ITEMS[tool.ammoType].name.toLowerCase()}.`); return; }
  slots[ai].qty -= 1; if (slots[ai].qty <= 0) slots[ai] = null;
  player.swingTimer = tool.swingCooldown;
  sfx.play('zap');
  const rng = tool.range + player.xpLevel('guns') * 0.3;
  // The beam stops dead at the first solid object in its path — it
  // doesn't cut through walls to hit whatever's cowering behind one.
  const maxAlong = player.beamRange(map, rng);
  let wiped = false;
  // Everything within a narrow corridor ahead, up to the beam's actual
  // (possibly wall-shortened) reach, gets hit.
  const hit = (e, robot) => {
    if (e.dead || e.fused || e.friendly) return;
    const dx = e.x - player.x, dy = e.y - player.y;
    const along = dx * player.facing.x + dy * player.facing.y;
    if (along < 0 || along > maxAlong) return;
    const perp = Math.abs(dx * -player.facing.y + dy * player.facing.x);
    if (perp > 0.8) return;
    // The beam that fells towers doesn't wound a mere machine — it wipes
    // it out where it stands, whatever the class (the old corrupt-into-a-
    // zombie behaviour is gone; existing zombies still fall to it too).
    if (robot && tool.effect === 'burn') {
      e.hp = 0; e.hurt = true; wiped = true;
      e.scrapPenalty = true; // gunfire ruins the salvage, this most of all
      player.sparkAt(map, e.x, e.y);
      player.gainXp('guns', 2);
      player.addScore(SCORE.robot);
      return;
    }
    if (robot && zombieImmune(e, tool)) return;
    e.hp -= robot ? (tool.robotDamage + player.xpLevel('guns')) : (tool.animalDamage + player.xpLevel('guns'));
    e.hurt = true;
    if (robot) { e.scrapPenalty = true; player.sparkAt(map, e.x, e.y); }
    player.gainXp('guns', 2);
    if (e.hp <= 0 && !robot) { e.dead = true; map.groundItems.push({ item: 'meat', qty: 1, x: e.x, y: e.y }); player.addScore(SCORE.animal); }
    else if (e.hp <= 0 && robot) player.addScore(SCORE.robot);
  };
  for (const a of animals) hit(a, false);
  for (const r of robots) hit(r, true);
  // A long tracer to the end of the beam (or the wall that stopped it).
  map.projectiles = map.projectiles || [];
  map.projectiles.push({ x0: player.x + player.facing.x * 0.4, y0: player.y + player.facing.y * 0.4, x1: player.x + player.facing.x * maxAlong, y1: player.y + player.facing.y * maxAlong, prog: 0, kind: 'fuse' });
  player.say(wiped
    ? 'The beam takes the machine apart where it stands.'
    : 'The beam cuts a line clean through them.');
}

// The wave gun: a fan of laser shots that hits every enemy inside a wide
// cone ahead, up to range — built to scythe a whole wave at once.
function coneShot(player, tool, map, animals, robots) {
  let ai = player.pockets.findIndex((s) => s && s.item === tool.ammoType);
  let slots = player.pockets;
  if (ai < 0 && player.backpack) { ai = player.backpack.slots.findIndex((s) => s && s.item === tool.ammoType); slots = player.backpack.slots; }
  if (ai < 0) { player.say(`The ${tool.name.toLowerCase()} needs ${ITEMS[tool.ammoType].name.toLowerCase()}.`); return; }
  slots[ai].qty -= 1; if (slots[ai].qty <= 0) slots[ai] = null;
  player.swingTimer = tool.swingCooldown;
  sfx.play('zap');
  const rng = tool.range + player.xpLevel('guns') * 0.3;
  const HALF = Math.cos(Math.PI / 5); // ~36° half-angle cone
  let hitCount = 0;
  const hit = (e, robot) => {
    if (e.dead || e.fused || e.friendly) return;
    const dx = e.x - player.x, dy = e.y - player.y;
    const d = Math.hypot(dx, dy);
    if (d > rng || d === 0) return;
    if ((dx * player.facing.x + dy * player.facing.y) / d < HALF) return; // outside the cone
    if (!map.hasLineOfSight(player.x, player.y, e.x, e.y)) return; // a wall shadows this one
    e.hp -= robot ? tool.robotDamage : tool.animalDamage;
    e.hurt = true;
    if (robot) { e.scrapPenalty = true; player.sparkAt(map, e.x, e.y); }
    hitCount++;
    if (e.hp <= 0 && !robot) { e.dead = true; map.groundItems.push({ item: 'meat', qty: 1, x: e.x, y: e.y }); player.addScore(SCORE.animal); }
    else if (e.hp <= 0 && robot) player.addScore(SCORE.robot);
  };
  for (const a of animals) hit(a, false);
  for (const r of robots) hit(r, true);
  player.gainXp('guns', 2 + hitCount);
  // Three visible fan beams.
  map.projectiles = map.projectiles || [];
  for (const ang of [-0.5, 0, 0.5]) {
    const fx = player.facing.x * Math.cos(ang) - player.facing.y * Math.sin(ang);
    const fy = player.facing.x * Math.sin(ang) + player.facing.y * Math.cos(ang);
    map.projectiles.push({ x0: player.x + fx * 0.4, y0: player.y + fy * 0.4, x1: player.x + fx * rng, y1: player.y + fy * rng, prog: 0, kind: 'stun' });
  }
  player.say(hitCount ? `The wave gun scythes through ${hitCount}.` : 'The wave fans out into empty air.');
}

// Fire the held gun at the nearest target in range and roughly in front.
// Guns consume ammunition (ammoType) from the pockets per shot. Stun and
// fuse effects work on machines only; pistol and shotgun hit flesh too.
export function fire(player, tool, map, animals, robots) {
  // Gun practice steadies the hand: range grows a little with the level.
  const range = tool.range + player.xpLevel('guns') * 0.3;

  // The OB-gun burns an obelisk if one is in front; otherwise it fires a
  // piercing beam that cuts through every enemy in its path. The railgun
  // always pierces.
  if (tool.effect === 'burn') {
    if (player.obeliskInFront(map, range)) { burnObelisk(player, tool, map, range); return; }
    pierceShot(player, tool, map, animals, robots); return;
  }
  if (tool.pierce) { pierceShot(player, tool, map, animals, robots); return; }
  if (tool.cone) { coneShot(player, tool, map, animals, robots); return; }
  let target = null, best = Infinity, isRobot = false;
  const consider = (e, robot) => {
    if (e.dead || e.fused || e.friendly) return;
    const dx = e.x - player.x, dy = e.y - player.y;
    const d = Math.hypot(dx, dy);
    if (d > range || d === 0) return;
    if (dx * player.facing.x + dy * player.facing.y < 0) return;
    if (d < best && map.hasLineOfSight(player.x, player.y, e.x, e.y)) { best = d; target = e; isRobot = robot; }
  };
  if (tool.animalDamage != null) for (const a of animals) consider(a, false);
  for (const r of robots) consider(r, true);

  // The electro-gun's arc bites obelisks too — a slower way to fell a tower
  // than the OB-gun, but it works. If one's in front and no closer than any
  // machine, it takes the shot instead.
  let obTarget = null;
  let facTarget = null;
  if (tool.effect === 'fuse') {
    const ob = player.obeliskInFront(map, range);
    let obD = Infinity;
    if (ob) {
      obD = Math.hypot(ob.x + 0.5 - player.x, ob.y + 0.5 - player.y);
      if (obD <= best) obTarget = ob;
    }
    // The arc scorches the W-factory hull too — a slow, self-charging way to
    // bring the foundry down without spending bombs. Measure to its nearest
    // edge (the footprint is huge). It only takes the shot if it's the closest
    // thing in front (nearer than any machine and than an obelisk).
    const fac = map.objects.find((o) => o.type === 'wfactory' && !o.destroyed);
    if (fac) {
      const nx = Math.max(fac.x, Math.min(player.x, fac.x + (fac.fw || 1)));
      const ny = Math.max(fac.y, Math.min(player.y, fac.y + (fac.fh || 1)));
      const fdx = nx - player.x, fdy = ny - player.y, fd = Math.hypot(fdx, fdy);
      if (fd <= range && (fdx * player.facing.x + fdy * player.facing.y) >= 0 && fd <= best && fd <= obD) {
        facTarget = { fac, x: nx + 0.5, y: ny };
        obTarget = null; // the factory is nearer — it takes the shot
      }
    }
  }

  // The electro-gun runs off its own self-charging cell — no pocket ammo.
  // When the cell's too low it just needs a moment to trickle back up.
  if (tool.selfCharge) {
    if (player.electroCharge < tool.shotCost) {
      player.say('The electro-gun hums, near flat — give its cell a moment to recharge.');
      return;
    }
    player.electroCharge -= tool.shotCost;
    // Firing near wildlife spooks it: the crackle sends animals bolting.
    player.scareAnimals(animals, 7);
  } else {
    // Other guns draw ammo from the pockets first, then the backpack — no
    // need to manually shuffle rounds forward. Consumed whether or not
    // there's a target in range: pulling the trigger with nothing in your
    // sights still wastes the round rather than refusing to fire.
    let ammoSlots = player.pockets;
    let i = player.pockets.findIndex((s) => s && s.item === tool.ammoType);
    if (i < 0 && player.backpack) {
      i = player.backpack.slots.findIndex((s) => s && s.item === tool.ammoType);
      ammoSlots = player.backpack.slots;
    }
    if (i < 0) {
      player.say(`The ${tool.name.toLowerCase()} is dead weight without ${ITEMS[tool.ammoType].name.toLowerCase()}.`);
      return;
    }
    ammoSlots[i].qty -= 1;
    if (ammoSlots[i].qty <= 0) ammoSlots[i] = null;
  }
  player.swingTimer = tool.swingCooldown;
  player.stamina = Math.max(0, player.stamina - (tool.staminaCost ?? 0));

  // W-factory in the arc's path (electro-gun only): the bolt flies to its
  // hull and chews into it, a slow siege off the self-charging cell.
  if (facTarget) {
    map.projectiles = map.projectiles || [];
    map.projectiles.push({
      x0: player.x + player.facing.x * 0.4, y0: player.y + player.facing.y * 0.4,
      x1: facTarget.x, y1: facTarget.y, prog: 0, kind: 'fuse',
    });
    sfx.play('zap');
    player.sparkBurst(map, facTarget.x, facTarget.y);
    player.damageFactory(facTarget.fac, map, 14);
    return;
  }

  // Obelisk in the arc's path (electro-gun only): the bolt flies to it and
  // scorches it, same as an OB-gun burn but from the electro-gun's cell.
  if (obTarget) {
    const bx = obTarget.x + 0.5, by = obTarget.y + 0.5;
    map.projectiles = map.projectiles || [];
    map.projectiles.push({
      x0: player.x + player.facing.x * 0.4, y0: player.y + player.facing.y * 0.4,
      x1: bx, y1: by, prog: 0, kind: 'fuse',
    });
    sfx.play('zap');
    player.sparkBurst(map, bx, by);
    player.damageObelisk(obTarget, map, 1);
    return;
  }

  // A visible round travels from the muzzle to the target (cosmetic; the
  // hit itself is instant). Electric guns fire a cyan/violet bolt. With no
  // target it still flies out to the shot's real reach (a wall or a hill
  // stops it early, same as beamRange elsewhere) rather than nowhere.
  const missRange = player.beamRange(map, range);
  const tx = target ? target.x : player.x + player.facing.x * missRange;
  const ty = target ? target.y : player.y + player.facing.y * missRange;
  map.projectiles = map.projectiles || [];
  map.projectiles.push({
    x0: player.x + player.facing.x * 0.4, y0: player.y + player.facing.y * 0.4,
    x1: tx, y1: ty, prog: 0,
    kind: tool.effect === 'stun' ? 'stun' : tool.effect === 'fuse' ? 'fuse' : 'bullet',
  });

  if (!target) {
    sfx.play('shot');
    player.say('You fire into the empty air.');
    return;
  }

  if (isRobot && zombieImmune(target, tool)) {
    player.say('The shot has no effect — the husk is only vulnerable to a bow or the wave gun now.');
  } else if (tool.effect === 'stun') {
    sfx.play('zap');
    target.disabledT = tool.stunTime;
    player.sparkAt(map, target.x, target.y);
    player.say('The stun bolt drops the machine cold. It will not stay down forever.');
  } else if (tool.effect === 'fuse') {
    sfx.play('zap');
    // A full charge destroys the machine outright — a clean kill (no scrap
    // penalty), so it drops its full salvage on the robots module's next
    // tick, chip fragment and all.
    target.hp = 0;
    target.hurt = true;
    target.scrapPenalty = false;
    player.sparkBurst(map, target.x, target.y);
    player.addScore(SCORE.robot);
    player.say('The machine convulses in a storm of sparks and dies where it stands.');
  } else if (isRobot) {
    sfx.play('shot');
    target.scrapPenalty = true; // gunfire mangles the salvage
    target.hp -= tool.robotDamage + player.xpLevel('guns');
    target.hurt = true;
    player.sparkAt(map, target.x, target.y);
    player.gainXp('guns', target.hp <= 0 ? 5 : 1);
    if (target.hp <= 0) player.addScore(SCORE.robot);
    player.say(target.hp <= 0
      ? 'The machine collapses in a shower of sparks.'
      : 'The round punches into the machine.');
  } else {
    sfx.play('shot');
    target.hp -= tool.animalDamage + player.xpLevel('guns');
    target.hurt = true;
    player.gainXp('guns', target.hp <= 0 ? 5 : 1);
    if (target.hp <= 0) {
      target.dead = true;
      map.groundItems.push({ item: 'meat', qty: 1, x: target.x, y: target.y });
      player.addScore(SCORE.animal);
      player.say(`The ${target.type} drops where it stands.`);
    } else {
      player.say(`You wing the ${target.type}.`);
    }
  }
}
