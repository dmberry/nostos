# True 3D blocks in the isometric world — the plan

David, 2026-08-15, after playing build mode: *"I think you need to revisit the
building - it might need refactoring of the way you manage the isometric world.
It is clearly bodged to make it work, but is not scalable as currently
implemented"* and *"ok you should create a plan to rewrite the block rendering
so that it is true 3D in the isometric world."*

This is that plan. It is a design document, not a diff: the work is sized in
days and is not to be started as a side effect of a bug fix. Task #185 tracks
it. The v1.563 patches (height-aware picking, the depth sort taking raised
tiles, textured faces) make #182 *usable*; nothing in them changes the model,
and the model is the problem.

---

## 1. What the world actually is today

One sentence: **a heightmap wearing a costume.**

- `GameMap` (src/game/map.js) keeps two parallel arrays per tile:
  `floor` (a material name) and `height` (one `Int8Array` level). A tile IS
  its top surface. There is nothing underneath it and nothing above it.
- The renderer draws a raised tile as a lifted diamond (`tileCorners(tx, ty,
  h * ELEV)`) and patches the two visible vertical gaps with `skirt()` fills.
  The face is not a thing in the model; it is the *absence* between two
  heights, painted after the fact.
- Everything that stands on the world does its own arithmetic:
  `heightAt(x,y) * ELEV` appears independently in the sprite pass, the build
  cursor, the shield bar, the night veil's `playerScreen`, the tor/obelisk hit
  rects, and (since v1.563) the tile picker. Sixteen files touch `heightAt`.
- Picking is the inverse projection at ground level plus (since v1.563) a
  top-down search over candidate heights — a guess about what the draw pass
  did, maintained separately from the draw pass.

## 2. What that can never do

These are not bugs; they are things the data structure cannot say:

1. **A stone block on grass.** `floor` and `height` have one entry per tile.
   Raising a tile stretches its one material upward. A tower of anything is a
   tower of the ground it stands on. (This is David's "you can only raise" —
   the material tools change the TOP, and the block below repaints with it.)
2. **Bridges, arches, overhangs, rooms.** A heightmap has no holes: there is
   exactly one walkable surface per column. You cannot walk under anything.
3. **Two materials in one column** — a sand path over a stone foundation, a
   grass roof.
4. **Exact picking.** The picker infers what the renderer drew. Whenever one
   changes and the other does not (v1.560→v1.563 was exactly this), the click
   lands on the wrong tile. The two can only be made to agree by construction,
   i.e. by sharing geometry.
5. **Correct occlusion without special cases.** Every sprite-vs-terrain and
   terrain-vs-terrain ordering fixed so far (the factory's centre depth, the
   climbRaise hack, v1.563's raised-tile drawables) is a patch on depth being
   *computed*, per case, instead of *falling out* of one draw order.

## 3. The design: a column world drawn as prisms

### 3.1 The model — `TerrainColumn` replaces the two arrays

Each tile becomes a **column**: a short stack of block records from a base
level upward.

```js
// src/game/terrain.js — new, pure, tested in node
// A column is an array of runs, bottom-up: [{mat: 'stone', h: 2}, {mat: 'grass', h: 1}]
// means two stone blocks with one grass block on top. Air above; nothing below.
// A GAP run {mat: null, h: n} is air inside the column — that is a bridge.
```

- **Compact:** the overwhelming majority of tiles are one run of one material
  (`[{mat:'grass', h:0}]` — flat ground is height 0, no blocks). Stored as a
  `Map` of exceptions over the flat default, exactly the way `objectGrid`
  already works, so the memory cost is proportional to what was built, not to
  the map.
- **The old accessors survive.** `floorAt` returns the top run's material;
  `heightAt` returns the column's top surface level; `setFloor` recolours the
  top run; `setHeight` grows/shrinks the top run. Every one of the sixteen
  consumer files keeps working unchanged on day one. New capability comes
  from new accessors (`columnAt`, `surfaceAbove(z)`, `solidAt(x, y, z)`),
  adopted only where needed.
- **Save format:** the exceptions Map serialises as a short list per island —
  which also closes the "building does not persist" gap in docs/PLAN.md for
  free, since the whole column store IS the diff against the generated island.

### 3.2 The renderer — one prism, one place, one hit list

A new terrain pass replaces `drawFloor`'s lift-and-skirt:

- **`drawPrism(col, tx, ty)`** draws a column as its visible geometry: the top
  diamond and the south/east faces of each run, texture, foot-darkening and
  edge lip decided *here and nowhere else*. The v1.563 face treatment moves in
  wholesale; `skirt()` is deleted.
- **Depth is uniform.** Every prism is a drawable at `x + y + 1`, interleaved
  with sprites in the one existing sort — v1.563 already proved this ordering
  on raised tiles; the rewrite makes it the only path rather than the
  exception. `climbRaise` and the factory's centre-depth stay as they are
  (they are about sprites and multi-tile objects, not terrain).
- **The hit list.** As each prism draws, it appends `{tx, ty, z, quad}` for its
  top face into a per-frame array (the pattern `torHits` and `_buildCells`
  already use). Picking becomes: walk the list back-to-front, first quad
  containing the pointer wins. **Drawing and picking cannot disagree, because
  the picker reads what the draw pass wrote.** The v1.563 search loop is
  deleted.
- **Culling:** a run fully hidden by the column south-east of it skips its
  faces (cheap neighbour test). Flat default tiles keep the exact current
  fast path — pass 1, row-major, untouched — so the cost of the new machinery
  is paid only where something is built.

### 3.3 Movement — the third dimension the player already half-has

The player already has `z` (jump) and `effectiveHeightAt` (climbing). The
column model formalises it:

- **Standing surface** = `surfaceAbove(x, y, feetZ)`: the top of the highest
  run at or below your feet. Walking off a bridge finds the ground below;
  walking under it finds the gap.
- **Step rule stays the game's own:** one level up free, `climbable` objects
  as now, more than one level is a wall. (No new verbs; JUMP already exists.)
- Robots get the same via the existing `map.isSolid` gate growing a `z`
  parameter with a default — again, no caller changes until a caller cares.

### 3.4 Build mode on top of it

- The material tools **place a block** (push a run) instead of recolouring the
  ground; Raise/Lower keep their meaning (grow/shrink the top run). Clear pops
  the top run. That is Hedda's "break blocks and place them" in the real sense.
- The cursor gains a **face-aware target**: pointing at a top face targets the
  block above it; pointing at a south/east face targets the neighbour in front
  — the Minecraft convention, and it comes free from the hit list carrying
  which quad was hit.
- Protection rules (`PROTECTED`, the sea, not-on-yourself) carry over
  unchanged from build.js.

## 4. What is explicitly out of scope

- **No WebGL, no engine swap.** Canvas 2D painter's-algorithm prisms are fully
  sufficient at this art scale, and "no build step, ever" stays decided.
- **No free rotation.** One fixed isometric camera, as now.
- **No lighting model.** The three-tone face shading (top / south / east) plus
  the foot gradient is the whole of it.
- **Survival-mode building.** The column world ships Creative-only, same as
  #182. Whether Survival ever places blocks is a design question for another
  day, not an engine question.

## 4a. Where this has got to (2026-08-16)

Stages 1, 2, 3, 6 are done and shipped; stage 4 is done except for two pieces
named below. Stage 5 has not been started.

| | | |
|---|---|---|
| 1 | `terrain.js` — column store, accessors, serialiser, property test | **done**, v1.564 |
| 2 | `GameMap` delegates; sparse store over the two arrays | **done**, v1.564 |
| 3 | `drawPrism` + hit list; picker reads it; `skirt` demoted to a helper | **done**, v1.564 |
| 4 | Material tools place blocks; Break pops object then block | **done**, v1.565 |
| 4 | Place-and-break only: Raise/Lower dropped, Break stops at the ground | **done**, v1.566 |
| 4 | Face-aware targeting — a block NEXT to a block, which is what an arch needs (task #186) | **not started** |
| 4 | A tool that makes a gap — the bridge | **not started** |
| 5 | Movement over columns — the player walks under things | **done**, v1.567 (robots still read the flat height) |
| 6 | Persistence — the store rides the island save | **done**, v1.565 |

**What the two unfinished stage-4 pieces need.** The hit list currently records
only TOP faces, which is why every pick is a top-face pick and why a block can
only go on top of a column. Face-aware targeting means recording the south/east
quads too, tagged with which face they are, and then: a hit on a top face builds
ABOVE that tile, a hit on a side face builds on the NEIGHBOUR in front of it, at
the level of the face that was hit. That is one more push per slab in
`drawPrism` and a branch in `buildTargetFor`; the geometry is already computed
where the faces are drawn.

**That is what an arch needs** (David, 2026-08-16: "if we are going to be able
to create arches - we need to place a block NEXT to another block. This means
the minecraft rule that a block can be placed NEXT to a block on any surface").
An arch is a block hanging in the air beside another with nothing under it, and
the only way to say where it goes is to name the face it springs from. It also
wants `setBlockAt(col, z, mat)` in terrain.js — placing at a level that is not
the top of the stack means inserting a run with air below it, which `pushGap`,
`slabs()` and `solidAt()` already handle; that one function is the gap. Task #186.

**What stage 5 needs, and why it was left.** `surfaceBelow` exists and is tested;
the work is in the callers. `Player.update` resolves standing height through
`effectiveHeightAt`, and the step rule, the jump landing and the swim check all
read it; robots reach the same ground through `map.isSolid`. Both need a foot
level threaded through, with a default that preserves today's answers exactly.
It is a day's work in collision code that only pays off once bridges exist to
walk under, and collision is the one place in this game where a quiet mistake is
expensive — so it wants its own session with time to play afterwards, not the
tail of the one that built everything above it.

## 5. Order of work

Each stage lands green and shippable; the suite runs at every step.

1. **`terrain.js`** — the column store, the compatibility accessors, the
   serialiser. Pure; tested against the existing `GameMap` behaviour
   (a property test: for any sequence of setFloor/setHeight, old and new
   answer identically). *~1 day.*
2. **`GameMap` delegates** to it behind the same API. All 1506 tests must pass
   with zero renderer changes. *~half a day.*
3. **`drawPrism` + hit list**, raised tiles only (flat fast path untouched);
   delete `skirt()` and the picker search; build cursor reads the hit list.
   Verified in the browser: the v1.563 wall/robot occlusion scene, the
   staircase, picking on every face of a 6-stack. *~1–2 days.*
4. **Columns in build mode** — place/pop runs, face-aware targeting, gap runs
   (bridges). *~1 day.*
5. **Movement over columns** — surfaceAbove for the player, then robots.
   *~1 day, plus play.*
6. **Persistence** — the exceptions Map rides the island save; closes the
   #182/#180 persistence gaps. *~half a day.*

Stages 1–3 are the rewrite David asked for; 4–6 are what it buys. After
stage 3 the "bodged" layer is gone: one model, one draw path, one hit list.

## 6. Risks, named

- **The mountain, the coast, the fortress** all write heights today
  (worldgen.js, coast.js, ruins.js, islands/*). The compatibility accessors
  are the contract that keeps them working; the property test in stage 1 is
  what makes that claim checkable rather than hoped.
- **Perf:** the flat-tile fast path is the guard. The exception store means an
  untouched island renders exactly as today.
- **The graffiti, ripples, floor messages** draw onto floor tiles by tile
  coordinate; they follow the top face and need a pass of eyes in stage 3.
- **Sea and rivers** stay pinned flat (the existing rule); water is not a
  column material in this plan. The Creative water tool keeps painting
  surface water only.
