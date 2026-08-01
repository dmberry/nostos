// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// BUILDING, IN CREATIVE (#182).
//
// Hedda, 2026-08-15: "Creative works BUT you can't really do anything. To be
// true creative you should be able to edit the map and break blocks and place
// them and stuff or at least some primitive version of that, like in Minecraft
// and sandbox games."
//
// She is right, and the mode's own description already promised it — Creative
// says "For looking, building and testing" and only two of those three were
// true. So Creative gets a build mode, and it is CREATIVE-ONLY: the other four
// modes are about an island that is the way it is, and a player who can raise a
// wall in front of a hunter is not playing them. There is no cost, no inventory
// and no recipe here, because a Creative mode with a materials economy is just
// the game again with a different name on it.
//
// PURE. No DOM, no renderer, no player class: a map, a tile and a tool go in, a
// result comes out. Everything about how it is chosen and drawn lives in the
// hub, and everything about whether it is ALLOWED lives here, where it can be
// tested without a browser.

import { FLOORS, OBJECTS } from './tiles.js';
import { columnTop, columnSurface, pushBlock, popBlock, setBlockAt, solidAt } from './terrain.js';
import { breakRule, dropOf, isPlaceable } from './blocks.js';

/**
 * What must never be edited, however creative the mode is.
 *
 * These are the run's machinery: the towers you hack, the foundry that prints
 * the W-units, the ship you leave on, the doors and terminals of a hold. Let a
 * build tool delete an obelisk and the island quietly stops being completable —
 * which is a bug report from a player who will have no idea what they did.
 * Felling a tower is a thing the game already supports, through an axe and a
 * consequence; this is not another route to it.
 */
export const PROTECTED = new Set([
  'obelisk', 'tor', 'wfactory', 'boat', 'greek_ship', 'exitdoor',
  'fortwall', 'fortdoor', 'gateterm', 'mainframe',
]);

/**
 * The tools, in the order they sit on the palette.
 *
 * SHORT ENOUGH NOT TO SCROLL, which was always the real constraint — a palette
 * you hunt through is a palette you stop using, and the point of this is to put
 * a thing down and see how it looks. `swatch` is what the strip draws: a
 * material shows its own colour, everything else gets one of its own.
 */
export const TOOLS = [
  // PLACE AND BREAK, AND NOTHING ELSE (David, 2026-08-16: "like Minecraft - you
  // can only build on existing blocks - preventing the problem of RAISING and
  // LOWERING blocks and causing holes in the world").
  //
  // Raise and Lower are gone. They were heightmap verbs — they moved the GROUND
  // rather than putting anything on it — and they came with the failure they
  // could not not have: Lower dug into the island, and a tile lowered under a
  // neighbour is a hole in the world. There is one rule now, and it is the one
  // every player already knows: a block goes on top of what is there, and
  // breaking takes back a block that was put down.
  //
  // The freed slots went to two more materials, which is what a builder wanted
  // out of them anyway.
  { key: 'grass', name: 'Grass', kind: 'block', floor: 'grass' },
  { key: 'dirt', name: 'Dirt', kind: 'block', floor: 'dirt' },
  { key: 'sand', name: 'Sand', kind: 'block', floor: 'sand' },
  { key: 'stone', name: 'Stone', kind: 'block', floor: 'stone' },
  { key: 'boards', name: 'Boards', kind: 'block', floor: 'boards' },
  { key: 'glass', name: 'Glass', kind: 'block', floor: 'glass' },
  { key: 'water', name: 'Water', kind: 'block', floor: 'stream' },
  { key: 'tree', name: 'Tree', kind: 'object', object: 'tree', swatch: '#3f6b34' },
  { key: 'wall', name: 'Wall', kind: 'object', object: 'wall', swatch: '#8f8474' },
  { key: 'rock', name: 'Rock', kind: 'object', object: 'rock', swatch: '#6a6a66' },
  { key: 'erase', name: 'Break', kind: 'erase', swatch: '#b06050' },
];

/** The tool record for a key, or null. Unknown keys are refused, not guessed. */
export function toolOf(key) {
  return TOOLS.find((t) => t.key === key) || null;
}

/**
 * How high a stack may be built ABOVE the ground it stands on.
 *
 * There is no matching minimum any more, because there is no digging: the floor
 * is wherever the island's own ground is, and `map.bedrockAt` knows it per tile
 * (which is also why this is a height ABOVE the ground rather than an absolute
 * level — six blocks on a hilltop are six blocks, the same as six on a beach).
 */
export const BUILD_MAX = 6;

const fail = (why) => ({ ok: false, why });

/**
 * Whether this tile may be edited at all.
 *
 * Separate from `applyBuild` because the cursor wants to answer it every frame
 * without changing anything — a tile you cannot build on should look like one
 * before you click it, not after.
 */
export function canBuildAt(map, x, y) {
  if (!map || !map.inBounds(Math.floor(x), Math.floor(y))) return fail('off the map');
  const obj = map.objectAt(x, y);
  if (obj && PROTECTED.has(obj.type)) return fail(`${obj.type} is part of the island's works`);
  if (map.buildingAt && map.buildingAt(x, y)) return fail('a building stands here');
  // The sea is the island's edge and the thing the whole run is about crossing.
  // Filling it in from the beach is not a sandbox, it is a shortcut past the
  // ship, and it would let a Creative run walk to the next island.
  if (map.floorAt(x, y) === 'sea') return fail('the open sea is not yours to move');
  return { ok: true };
}

/**
 * Apply a tool to a tile. Returns `{ok, what}` or `{ok: false, why}`.
 *
 * `player` is optional and only used to keep you from burying yourself: a solid
 * object on the tile you are standing on would trap you inside it, which in a
 * mode with no damage means standing there forever.
 */
export function applyBuild(map, x, y, toolKey, { player = null, face = null, z = null, held = undefined, pack = null } = {}) {
  const tool = toolOf(toolKey);
  if (!tool) return fail('no such tool');
  // A BLOCK ASKED FOR ON A SIDE FACE GOES BESIDE, NOT ON TOP (#186, David
  // 2026-08-16). Placing only ever grew a column upward, so there was no way to
  // put a block at a height with air under it — and without that there are no
  // arches, no doorways and no bridges you built yourself. The face you pointed
  // at names both the neighbour and the level: the south face of a block at 3
  // is a block at 3 on the tile to the south.
  if (face && tool.kind === 'block' && z != null) return placeBeside(map, x, y, tool, face, z, player);
  const allowed = canBuildAt(map, x, y);
  if (!allowed.ok) return allowed;
  const tx = Math.floor(x), ty = Math.floor(y);
  const onMe = player && Math.floor(player.x) === tx && Math.floor(player.y) === ty;

  if (tool.kind === 'block') {
    if (!FLOORS[tool.floor]) return fail('no such material');
    if (onMe) return fail('not on top of yourself');
    const ground = map.bedrockAt(tx, ty);
    const col = map.editColumn(tx, ty);
    if (columnTop(col) - ground >= BUILD_MAX) return fail('as high as it goes');
    map.rememberBedrock(tx, ty);   // before the first edit, while the truth is still here
    pushBlock(col, tool.floor);
    map.setColumn(tx, ty, col);
    return { ok: true, what: `${tool.floor} block placed` };
  }

  if (tool.kind === 'object') {
    if (!OBJECTS[tool.object]) return fail('no such object');
    if (onMe && OBJECTS[tool.object].solid) return fail('not on top of yourself');
    const there = map.objectAt(tx, ty);
    // Replacing is one click, not two. Anything unprotected goes; the protected
    // set was already refused above.
    if (there) {
      if (there.type === tool.object) return fail(`a ${tool.object} is already here`);
      map.removeObject(there);
    }
    const obj = map.addObject(tool.object, tx, ty);
    if (!obj) return fail('the tile would not take it');
    return { ok: true, what: `${tool.object} placed`, obj };
  }

  // BREAK: whatever is topmost. An object standing on the tile goes first —
  // it is the thing your eye is on — and once the tile is clear the block under
  // it comes off. One tool for "get rid of what is here", which is the only
  // thing a player means by pointing at something and pressing break.
  const there = map.objectAt(tx, ty);
  if (there) { map.removeObject(there); return { ok: true, what: `${there.type} cleared` }; }
  const col = map.editColumn(tx, ty);
  // A TOOL IN HAND, WHERE THERE IS ONE (#187). Creative passes no `tool` and no
  // `pack` and is unchanged: break anything, keep nothing. Where a caller does
  // pass them, the material decides whether what you are holding will take it
  // and what comes off in your hands — see blocks.js, which owns the ladder.
  if (tool.kind === 'erase' && held !== undefined) {
    const mat0 = columnSurface(col);
    const rule = breakRule(mat0, held);
    if (!rule.ok) return fail(rule.why);
  }
  // THE ISLAND IS NOT YOURS TO DIG. You can take back every block you put down
  // and not one grain of the ground underneath — so there is no way to open a
  // hole in the world, which is the whole reason the ground level is remembered.
  if (columnTop(col) <= map.bedrockAt(tx, ty)) return fail('that is the ground itself');
  const mat = columnSurface(col);
  popBlock(col);
  map.setColumn(tx, ty, col);
  const drop = held !== undefined ? dropOf(mat) : null;
  if (drop && pack && pack.stow) pack.stow(`block_${drop}`, 1);
  return { ok: true, what: `${mat} block broken`, drop };
}

/**
 * Put a block against the face of another one (#186).
 *
 * `face` is which side of `(x, y)` was pointed at — 's' for the south face,
 * 'e' for the east — and `z` is that face's own top level. The block lands on
 * the NEIGHBOUR beyond it, at the same level, so a run of them walks out into
 * the air and meets the pier on the other side: an arch.
 *
 * It is still the Minecraft rule. You may only build against something that is
 * already there, the ceiling is the same six above the ground, and nothing here
 * can dig — the level asked for is either empty or the placement is refused.
 */
function placeBeside(map, x, y, tool, face, z, player) {
  if (!FLOORS[tool.floor]) return fail('no such material');
  const tx = Math.floor(x) + (face === 'e' ? 1 : 0);
  const ty = Math.floor(y) + (face === 's' ? 1 : 0);
  const allowed = canBuildAt(map, tx, ty);
  if (!allowed.ok) return allowed;
  if (player && Math.floor(player.x) === tx && Math.floor(player.y) === ty) {
    // Only where it would actually close over you: a block at head height or
    // your feet traps you, one well overhead is a ceiling and perfectly fine.
    const feet = player.footZ != null ? player.footZ : 0;
    if (z > feet && z <= feet + 2) return fail('not on top of yourself');
  }
  const ground = map.bedrockAt(tx, ty);
  if (z - ground > BUILD_MAX) return fail('as high as it goes');
  const col = map.editColumn(tx, ty);
  if (solidAt(col, z)) return fail('there is already a block there');
  map.rememberBedrock(tx, ty);
  if (!setBlockAt(col, z, tool.floor)) return fail('nothing to build against there');
  map.setColumn(tx, ty, col);
  return { ok: true, what: `${tool.floor} block placed`, at: { x: tx, y: ty, z } };
}
