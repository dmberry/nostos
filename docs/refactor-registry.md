# Systems registry — contract design, decision log, migration plan

Branch: `refactor/systems-registry`. Status: **Stage 0 (vertical slice) — for review.**
Nothing here is on `main`. This is an isolated worktree so the daily push can
continue undisturbed; a bad pass is `git worktree remove`, not a revert.

## Why

`main.js update(dt)` and the renderer's `draw` are god-functions. Every feature
is hardcoded into the hub with a *bespoke* signature:

```
lore.update(dt, player, input)
updateRobots(dt, robots, player, map)
fortress.update(dt, player, robots, worldStir)
dayNight.update(dt)
player.update(dt, input, map, animals, foes, mouseWorld)
```

Adding a feature means editing the hub in two or three places (an update call, a
world-space draw, a screen-space draw) and threading whatever args it needs.
This refactor introduces a registry so a feature attaches as a `{update, draw}`
module and the hub just *iterates registered systems* — zero hub edits per
feature.

## The registry and the islands "world-contract" are the same problem

The islands plan wants a "Stage-0 world-contract" so island builds can run in
parallel. That contract is exactly the thing the registry needs: **one `world`
object, assembled once per frame, holding the state every system reads.** Build
the registry and the islands get their contract for free. Do them as one.

## The contract (proposed)

```js
// A system. Any field may be omitted — a HUD widget has only drawScreen; a
// clock has only update.
{
  name: 'lore',
  order: 100,              // lower runs first, for update AND draw. default 100.
  update(world)   {}       // per-frame tick
  drawWorld(g, world) {}   // world-space: inside the camera transform, BEFORE restore
  drawScreen(g, world) {}  // screen-space: HUD / full-screen overlay
}

// The world-contract: one bag, built once per frame, passed to every system.
world = {
  dt, now,
  player, input, map, camera,
  robots, animals, birds,
  dayNight, worldStir, lore, fortress,
  sfx, w, h,
}
```

Registry API (`src/engine/systems.js`):

```
register(sys)            unregister(name)        clear()
runUpdate(world)         runDrawWorld(g, world)  runDrawScreen(g, world)
```

## The honest boundary (what the registry does NOT own)

The renderer draws actors (robots, animals, objects) with a **painter's-algorithm
depth sort** — they interleave by screen-Y, they are not independent passes. The
registry **cannot** own that sort. It owns:

- every feature's `update`,
- **non-depth-sorted** world-space *overlays* (lore's floating fragments, the
  skylink web, projectiles/sparks — things drawn as their own pass after the
  sort), and
- screen-space HUD/overlays.

Depth-sorted actors keep their draw in the renderer's sort. A system that spawns
actors registers its `update`; its actors are drawn by the existing sort. This
boundary is the main thing to sanity-check in review.

## Why `lore` is the Stage-0 slice

`lore` is already the closest thing to a clean system in the codebase (its own
header says it touches the game through four hooks). It exercises **all three**
integration points in one small, low-risk feature:

- `main.js:` `lore.update(dt, player, input)` — one update call.
- `renderer.js:` `hud.lore.drawWorld(ctx)` — a clean world-space pass.
- `renderer.js:` `hud.lore.drawOverlay(ctx, w, h)` — a screen-space pass.

If the contract can hold lore without contortion, it can hold the rest. If it
can't, we find out having touched ~5 lines, not the whole codebase.

## Open questions surfaced (decide before mass rollout)

1. **Ordering.** Update order matters today (player before robots; fortress
   after robots). The `order` field encodes it, but the exact numbers need a
   pass over the current sequence. *Slice keeps every non-lore call exactly
   where it is, so ordering is unchanged.*
2. **Early-return gating.** `paused` / `resting` / `driveState` gate *subsets* of
   updates (some clocks still tick while resting). A flat `runUpdate` can't
   express that. Options: a `whenPaused`/`whenResting` tag per system, or the hub
   keeps the gates and only the "normal-play" set runs through the registry.
   *Slice leaves the gates in the hub; lore already sits below them.*
3. **Lifecycle.** New Game / island swap must `clear()` and re-register (or the
   registry must hold module singletons that survive). *Slice registers lore
   once and checks New Game still works.*
4. **Self-registration vs hub-registration.** End state: each feature calls
   `register()` itself (truly zero hub edits). Slice registers lore *from the
   hub* via a thin adapter, so `lore.js` (owned, isolated) is untouched and the
   change is trivially reversible. Moving registration into features is the last
   migration step, once the contract is blessed.

## Migration plan (staged, each stage boots green)

- **Stage 0 — this slice.** `systems.js` + register `lore` via adapter; swap its
  1 update + 2 draw call sites to registry dispatch. **STOP for review.**
- **Stage 1.** Migrate the other clean singletons through the hub adapter:
  `dayNight`, `worldStir`, `fortress` (update-side), skylink web (drawWorld).
  Nail down `order` numbers against the current sequence.
- **Stage 2.** The ROADMAP file-size split, now expressed as systems: renderer
  HUD/modals → `ui.js`; player weapon-fire (`fire`/`pierceShot`/`coneShot`/
  `burnObelisk`) → `combat.js`.
- **Stage 3.** `robots.js`: update-functions become systems; draw stays in the
  depth-sort (per the boundary above).
- **Stage 4.** Move `register()` into each feature module — zero hub edits — and
  add `clear()` to New Game / island swap. Wire the islands world-contract onto
  the same `world` bag.

## Decision log

- **2026-07-10.** Chose one `world` bag over per-call arg lists — unifies the
  registry with the islands world-contract; a system reads only what it needs.
- **2026-07-10.** Draw split into `drawWorld` (pre-camera-restore) and
  `drawScreen` (HUD) phases, because `lore` needs both. Depth-sorted actors are
  explicitly **excluded** from the registry and stay in the renderer's sort.
- **2026-07-10.** Stage 0 registers `lore` from the hub via an adapter (not by
  editing `lore.js`) to keep the proof reversible and the owned lore module
  untouched.
