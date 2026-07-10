// A tiny systems registry: features attach as { update, drawWorld, drawScreen }
// modules and the main loop iterates them, instead of the hub hardcoding a
// bespoke call (and argument list) for every feature. See
// docs/refactor-registry.md for the contract, the boundary (this does NOT own
// the renderer's depth-sorted actor draw), and the migration plan.
//
// A system:
//   { name, order=100, update?(world), drawWorld?(g, world), drawScreen?(g, world) }
// `order` sorts update AND draw (lower first). `world` is the per-frame bag of
// shared state (dt, player, input, map, robots, ...). Draw helpers also take the
// raw canvas 2D context `g`, since drawing wants the context, not just state.

const _systems = [];

// Register a system. Re-registering a name replaces the prior one (so a New Game
// or island swap that re-runs setup can't leave a stale duplicate behind).
export function register(sys) {
  if (!sys || !sys.name) throw new Error('registerSystem: a system needs a name');
  const i = _systems.findIndex((s) => s.name === sys.name);
  if (i >= 0) _systems[i] = sys; else _systems.push(sys);
  _systems.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

export function unregister(name) {
  const i = _systems.findIndex((s) => s.name === name);
  if (i >= 0) _systems.splice(i, 1);
}

// Drop every system — call on New Game / island swap before re-registering.
export function clear() { _systems.length = 0; }

// For tests/inspection.
export function systemNames() { return _systems.map((s) => s.name); }

export function runUpdate(world) {
  for (const s of _systems) if (s.update) s.update(world);
}

export function runDrawWorld(g, world) {
  for (const s of _systems) if (s.drawWorld) s.drawWorld(g, world);
}

export function runDrawScreen(g, world) {
  for (const s of _systems) if (s.drawScreen) s.drawScreen(g, world);
}
