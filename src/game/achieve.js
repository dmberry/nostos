// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// KLEOS — the achievement engine (docs/PLAN.md).
//
// Pure, like strait.js: no DOM, no timers, no world. Events in, awards out; the
// hub decides what a toast looks like. That is what makes the whole thing
// testable in node, and it is why the registry beside this file can stay data.
//
// TWO SCOPES, and the split is the design:
//
//   PROFILE   survives death and New Game, the way weaponsFound and the stage
//             checkpoints already do. Holds the MILESTONES and the lifetime
//             counters they are measured against — hours played, nights
//             survived, the long accrual that is not about any one run.
//   RUN       dies with the run. This run's counters, the purity state of each
//             conduct track, AND THE BADGES. Reloading an earlier checkpoint
//             restores the earlier state with it — checkpoint discipline is the
//             player's to spend, and spending it is a real choice.
//
// BADGES WERE PROFILE-SCOPED UNTIL v1.507, on the argument that kleos is the
// glory which outlives the run and taking it back when you die is the one thing
// the word cannot mean. It reads badly in play (David, 2026-08-13): a fresh run
// opened the panel already showing a wall of badges, which looks exactly like
// the game claiming credit you have not earned. The idea survives where it
// belongs — the MILESTONES are the thing that outlives you, and the panel now
// says so in one word at the bottom.

import { TRACKS, BADGES, MILESTONES, COUNTERS, PURITY_BREAKS, LAURELS_LIVE, tierThresholds, TIER_NAMES } from './achievements-registry.js';

const PROFILE_VERSION = 1;

let profile = null;   // earned awards + lifetime counters
let run = null;       // this run's counters + purity

// Where earned awards go to be SEEN. The engine stays pure — it does not know
// what a toast is — but every call site must reach the same reporting, whether
// it came through the hub or straight from robots.js at the moment a machine
// died. Without this, a kill counted silently and saved nothing, which reads
// exactly like a system that is not working.
let sink = null;
export function setAchieveSink(fn) { sink = fn; }

function emptyProfile() {
  return { v: PROFILE_VERSION, lifetime: {}, distinct: {}, badges: {}, tiers: {}, milestones: {}, laurels: {} };
}
function emptyRun() {
  return { counters: {}, distinct: {}, breaks: {}, island: null, day: 0, badges: {}, badgeCounts: {}, tiers: {} };
}

// Rebuild a saved scope, keeping anything we do not recognise. An award id this
// build has never heard of belongs to a build that did, and dropping it would
// eat a player's history — so unknown keys ride along untouched.
function reviveProfile(saved) {
  const p = emptyProfile();
  if (!saved || typeof saved !== 'object') return p;
  p.v = PROFILE_VERSION;
  for (const k of ['lifetime', 'distinct', 'badges', 'tiers', 'milestones', 'laurels']) {
    if (saved[k] && typeof saved[k] === 'object') p[k] = { ...saved[k] };
  }
  return p;
}
function reviveRun(saved) {
  const r = emptyRun();
  if (!saved || typeof saved !== 'object') return r;
  for (const k of ['counters', 'distinct', 'breaks', 'badges', 'badgeCounts', 'tiers']) {
    if (saved[k] && typeof saved[k] === 'object') r[k] = { ...saved[k] };
  }
  r.island = saved.island || null;
  r.day = saved.day || 0;
  return r;
}

export function initAchievements({ profile: p, run: r } = {}) {
  profile = reviveProfile(p);
  run = reviveRun(r);
}

export function achieveRunState() { return run ? JSON.parse(JSON.stringify(run)) : emptyRun(); }
export function achieveProfile() { return profile ? JSON.parse(JSON.stringify(profile)) : emptyProfile(); }

// Start a fresh run, keeping the profile. Called on New Game and after death.
// The outgoing run is kept whole as `lastRun` — that is the panel's LAST GAME
// tab, and it is the only place the shape of a finished run survives: the
// profile has totals, and totals cannot tell you how the last one went.
export function resetRun() {
  if (run) profile.lastRun = JSON.parse(JSON.stringify(run));
  run = emptyRun();
}

// ---- counting ---------------------------------------------------------------
// A distinct counter stores its seen set as a plain object so the whole scope
// stays JSON — a Set would vanish through localStorage without a sound.
// The run keeps its numbers in `counters`, the profile in `lifetime`. One
// accessor so nothing below has to care which scope it was handed.
function storeOf(scope) { return scope.counters || scope.lifetime; }

function bumpCounter(scope, name, def, data) {
  const store = storeOf(scope);
  if (def.distinct) {
    const key = String(data[def.distinct] ?? '');
    if (!key) return false;
    const seen = (scope.distinct[name] ||= {});
    if (seen[key]) return false;
    seen[key] = 1;
    store[name] = (store[name] || 0) + 1;
    return true;
  }
  if (def.set) {
    // A set-counter takes the payload's value rather than adding to it, so a
    // reloaded checkpoint cannot count the same days twice.
    const v = def.set(data);
    if (v > (store[name] || 0)) { store[name] = v; return true; }
    return false;
  }
  store[name] = (store[name] || 0) + (def.amount ? def.amount(data) : 1);
  return true;
}

function counterValue(scope, name) { return storeOf(scope)[name] || 0; }

// Progress along a track, in whichever scope is being asked about. The default
// is the RUN, because that is what the panel's first tab shows and what the
// tiers are awarded against; pass the profile for the lifetime view.
function trackProgress(track, scope = run) {
  return track.counters.reduce((sum, c) => sum + counterValue(scope, c), 0);
}

// ---- purity -----------------------------------------------------------------
// A break is recorded once per track per island. The FIRST deed is the one that
// cost you the laurel, and naming a later one would be a lie about which.
function recordBreaks(eventName, data) {
  const out = [];
  for (const track of TRACKS) {
    if (!track.purity) continue;
    if (isBroken(track.id, run.island)) continue;
    for (const signal of track.purity.brokenBy) {
      for (const rule of (PURITY_BREAKS[signal] || [])) {
        if (rule.event !== eventName) continue;
        if (rule.when && !rule.when(data)) continue;
        const why = rule.why ? rule.why(data) : signal;
        (run.breaks[track.id] ||= []).push({ island: run.island, day: run.day, why });
        out.push({ kind: 'purity-lost', id: track.id, name: track.name, why, day: run.day });
      }
    }
  }
  return out;
}

function isBroken(trackId, island) {
  const list = run.breaks[trackId];
  if (!list || !list.length) return false;
  if (island === undefined) return true;             // any break at all, this run
  return list.some((b) => b.island === island);      // a break on THIS island
}

// ---- the single write path --------------------------------------------------
// Every achievement in the game is earned through here. Returns the awards this
// event newly earned, for the hub to toast; earning is idempotent, so a repeated
// event never re-awards.
export function achieveEvent(name, data = {}) {
  if (!profile || !run) return [];
  const awards = [];

  // Book-keeping the engine keeps for itself: where you are and what day it is,
  // so a purity break can name both.
  if (name === 'islandVisited' && data.id) run.island = data.id;
  if (name === 'dayEnd' && data.day) run.day = data.day;

  // 1. counters, both scopes
  for (const [cname, def] of Object.entries(COUNTERS)) {
    if (def.on !== name) continue;
    if (def.when && !def.when(data)) continue;
    bumpCounter(run, cname, def, data);
    bumpCounter(profile, cname, def, data);
  }

  // 2. badges — counted in the RUN, because a badge is a thing you have done
  //    THIS TIME. `badgeCounts` has been sitting in the run scope unused since
  //    the system was written, which is a fair hint at where this belonged.
  for (const b of BADGES) {
    if (b.on.event !== name) continue;
    if (run.badges[b.id]) continue;
    if (b.on.when && !b.on.when(data)) continue;
    // A threshold may be a function, so a badge over a manifest ("every tape")
    // follows the content instead of freezing at whatever the count was today.
    const need = (typeof b.on.n === 'function' ? b.on.n() : b.on.n) || 1;
    let have;
    if (b.on.distinct) {
      const key = String(data[b.on.distinct] ?? '');
      const seen = (run.distinct[`badge:${b.id}`] ||= {});
      if (key && !seen[key]) seen[key] = 1;
      have = Object.keys(seen).length;
    } else {
      have = (run.badgeCounts[b.id] = (run.badgeCounts[b.id] || 0) + 1);
    }
    if (have >= need) {
      run.badges[b.id] = { day: run.day };
      // The profile keeps its own all-time record of the same thing, so the
      // panel's ALL GAMES tab has something to show. It is a tally, not the
      // thing the run is judged on.
      profile.badges[b.id] = profile.badges[b.id] || { day: run.day };
      awards.push({ kind: 'badge', id: b.id, name: b.name, blurb: b.blurb });
    }
  }

  // 3. track tiers
  for (const track of TRACKS) {
    if (!track.counters.some((c) => COUNTERS[c] && COUNTERS[c].on === name)) continue;
    const have = trackProgress(track);
    const tiers = tierThresholds(track);
    const at = run.tiers[track.id] || 0;
    for (let i = at; i < tiers.length; i++) {
      if (have < tiers[i].at) break;
      run.tiers[track.id] = i + 1;
      profile.tiers[track.id] = Math.max(profile.tiers[track.id] || 0, i + 1);   // the all-time best
      awards.push({
        kind: 'tier', id: track.id, name: track.name, tier: i + 1,
        tierName: tiers[i].name || TIER_NAMES[i], summit: i === tiers.length - 1,
      });
    }
  }

  // 4. milestones (lifetime only)
  for (const m of MILESTONES) {
    if (profile.milestones[m.id]) continue;
    if ((profile.lifetime[m.counter] || 0) < m.at) continue;
    profile.milestones[m.id] = true;
    awards.push({ kind: 'milestone', id: m.id, name: m.name, blurb: m.blurb });
  }

  // 5. purity
  awards.push(...recordBreaks(name, data));

  // 6. laurels, judged when an island's objective completes
  if (name === 'islandComplete' && data.id) awards.push(...judgeLaurels(data.id));

  if (awards.length && sink) { try { sink(awards); } catch (_) { /* reporting must never break play */ } }
  return awards;
}

// Every conduct track whose constraint held from arrival to victory on this
// island earns its laurel. GATED: see LAURELS_LIVE in the registry — the
// machinery runs and is tested, but nothing is awarded until the A5 audit has
// proved each constraint actually holdable.
function judgeLaurels(islandId) {
  const out = [];
  for (const track of TRACKS) {
    if (!track.purity) continue;
    if (isBroken(track.id, islandId)) continue;
    const key = `${track.id}@${islandId}`;
    if (profile.laurels[key]) continue;
    const tiers = tierThresholds(track);
    const summit = tiers[tiers.length - 1].name || track.name;
    if (!LAURELS_LIVE) continue;
    profile.laurels[key] = { day: run.day };
    out.push({ kind: 'laurel', id: key, name: summit, island: islandId, track: track.id });
  }
  return out;
}

// Wall-clock, accumulated on the autosave's existing cadence rather than a timer
// of its own. Returns any milestone it just crossed.
export function achieveTick(seconds) {
  if (!profile || !seconds) return [];
  profile.lifetime.playSeconds = (profile.lifetime.playSeconds || 0) + seconds;
  const out = [];
  for (const m of MILESTONES) {
    if (profile.milestones[m.id]) continue;
    if ((profile.lifetime[m.counter] || 0) < m.at) continue;
    profile.milestones[m.id] = true;
    out.push({ kind: 'milestone', id: m.id, name: m.name, blurb: m.blurb });
  }
  if (out.length && sink) { try { sink(out); } catch (_) { /* never break play */ } }
  return out;
}

// ---- the model the notebook renders ----------------------------------------
// Everything computed here, nothing stored: the tab holds no state of its own.
/**
 * The panel's model, for one of three views (David, 2026-08-13):
 *
 *   'run'   THIS GAME  — what you have done since you last started or died
 *   'last'  LAST GAME  — the same, for the run before this one
 *   'all'   ALL GAMES  — the lifetime tally, and the milestones
 *
 * Three views beats arguing about which one the panel is, which is what the
 * badges-are-lifetime question had turned into.
 */
export function achieveModel(scope = 'run') {
  if (!profile || !run) initAchievements({});
  const view = scope === 'last' ? (profile.lastRun ? reviveRun(profile.lastRun) : null)
    : scope === 'all' ? null : run;
  const all = scope === 'all';
  const tracks = TRACKS.map((track) => {
    const have = trackProgress(track, all ? profile : (view || emptyRun()));
    const tiers = tierThresholds(track);
    // THE DISPLAYED TIER IS DERIVED FROM `have`, not read from the stored index.
    // A stored index means nothing once the ladder changes: profiles written
    // under the old four-rung WARRIOR carried tier 3 for 75 kills, and against
    // the ten-rung ladder that index points at rung 12 — so ALL GAMES showed
    // "82/12", a player with eighty-two kills being told the next rung is at
    // twelve. Counting the rungs actually cleared is right whatever the ladder
    // does next, and it heals every old profile without a migration.
    //
    // The AWARDING still uses the stored index, because that is what makes a
    // tier fire once rather than on every event after it.
    const tier = tiers.filter((x) => have >= x.at).length;
    const next = tiers[tier] || null;
    const summitName = tiers[tiers.length - 1].name || null;
    // Purity is a run's property. ALL GAMES has no single answer to "did you
    // keep it", so it does not claim one.
    const broken = track.purity && !all && view ? ((view.breaks[track.id] || [])[0] || null) : null;
    return {
      id: track.id, name: track.name, blurb: track.blurb, kind: track.kind, unit: track.unit,
      tier, rungs: tiers.length,
      tierLabel: tier ? (tiers[tier - 1].name || TIER_NAMES[tier - 1]) : '',
      have, next: next ? next.at : null, summitName, summited: tier >= tiers.length,
      purity: track.purity && !all
        ? (broken ? { intact: false, why: broken.why, day: broken.day } : (view ? { intact: true } : null))
        : null,
    };
  });
  const badges = BADGES.map((b) => ({
    id: b.id, name: b.name, blurb: b.blurb, ai: !!b.ai,
    earned: all ? !!profile.badges[b.id] : !!(view && view.badges[b.id]),
  }));
  const milestones = MILESTONES.map((m) => ({
    id: m.id, name: m.name, blurb: m.blurb, at: m.at, counter: m.counter,
    have: profile.lifetime[m.counter] || 0, earned: !!profile.milestones[m.id],
  }));
  return {
    scope, tracks, badges, milestones,
    badgesEarned: badges.filter((b) => b.earned).length,
    laurels: Object.keys(profile.laurels).map((k) => {
      const [track, island] = k.split('@');
      return { key: k, track, island, name: (TRACKS.find((t) => t.id === track) || {}).name || track };
    }),
    laurelsLive: LAURELS_LIVE,
    day: run.day,
    playSeconds: profile.lifetime.playSeconds || 0,
  };
}
