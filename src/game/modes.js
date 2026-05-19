// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// GAME MODES.
//
// The game had one difficulty and a hidden testing switch: `creative`, set from
// the LYRE dev panel so Hedda could walk through a firefight and look at things.
// That switch was the right idea in the wrong place — it was a debug affordance
// that turned out to be a way to play, and it was reachable only by somebody who
// knew the dev word (David, 2026-08-15).
//
// So there are five modes, Creative is the first of them, and they are chosen on
// the title screen before a run starts rather than found later.
//
// FOUR NUMBERS AND A FLAG, deliberately. A mode that changes twenty things is a
// mode nobody can predict, and a player who cannot predict the difficulty cannot
// choose one. Each mode says what it does in a sentence and the sentence is
// true:
//
//   hurt      what a blow costs you
//   hunger    how fast food and stamina go
//   pressure  how hard the machines press — wave sizes, how readily they aggro
//   clock     how fast POSEIDON's countdown runs
//
// WHAT IS NOT HERE. No mode touches the puzzles, the language, the web, or what
// any machine will let you do to it. Hard is not a mode where the terminal
// refuses you; Easy is not a mode where the ML is simpler. The difficulty is in
// the world's pressure, and everything the game is actually about stays exactly
// the same in all five — which is also why Creative is a mode and not a cheat.

/**
 * The modes, in the order they are offered. `key` is what rides the save.
 *
 * MEDIUM IS 1.0 ACROSS THE BOARD and is the game as it has always been, so an
 * existing run that predates modes is a Medium run and nothing about it changes.
 * That is why the multipliers are relative to Medium rather than to some
 * abstract baseline: there is no fifth set of numbers nobody has played.
 */
export const MODES = [
  {
    key: 'creative',
    name: 'Creative',
    blurb: 'Nothing can hurt you. Everything else works exactly as it does.',
    detail: 'Shots land and do nothing. You can still fell a machine, still starve, '
      + 'still lose the ship. For looking, building and testing.',
    hurt: 0, hunger: 1, pressure: 1, clock: 1, creative: true,
  },
  {
    key: 'easy',
    name: 'Easy',
    blurb: 'Blows cost half. The machines are slower to take an interest.',
    detail: 'For learning the island, or for playing it as the story rather than the fight.',
    hurt: 0.5, hunger: 0.7, pressure: 0.7, clock: 0.75,
  },
  {
    key: 'medium',
    name: 'Medium',
    blurb: 'The game as it is meant to be played.',
    detail: 'The numbers every other mode is measured against.',
    hurt: 1, hunger: 1, pressure: 1, clock: 1,
  },
  {
    key: 'hard',
    name: 'Hard',
    blurb: 'Blows cost half again. The estate presses, and the clock runs.',
    detail: 'You will need the shields, the plate, and a reason to be where you are.',
    hurt: 1.5, hunger: 1.3, pressure: 1.4, clock: 1.35,
  },
  {
    key: 'insane',
    name: 'Insane',
    blurb: 'Twice the damage, no beginner\'s grace, and POSEIDON does not wait.',
    detail: 'The opening minutes are not eased, the waves come at full size from the '
      + 'first, and there is no margin anywhere. Chosen on purpose or not at all.',
    hurt: 2.2, hunger: 1.6, pressure: 1.9, clock: 1.8, noEase: true,
  },
];

export const DEFAULT_MODE = 'medium';

/** The mode record for a key. Anything unrecognised is Medium, never a crash. */
export function modeOf(key) {
  return MODES.find((m) => m.key === String(key || '').toLowerCase()) || MODES[2];
}

/** Is this key a mode we know? Used to decide whether a save's value is usable. */
export function isMode(key) {
  return MODES.some((m) => m.key === String(key || '').toLowerCase());
}

/**
 * The damage multiplier, which is the one every damage site goes through.
 *
 * Creative returns 0 rather than a small number: "almost nothing" is a mode
 * where a long enough fight still kills you, and that is not what it says on
 * the tin.
 */
export function hurtScale(key) {
  return modeOf(key).hurt;
}

/**
 * The modes in order of how much they ask of you: Creative 0 .. Insane 4.
 *
 * The ORDER IS THE TABLE'S, not a separate list, because two lists of five
 * things drift. Anything unrecognised ranks as Medium, matching `modeOf`.
 */
export function modeRank(key) {
  const i = MODES.findIndex((m) => m.key === String(key || '').toLowerCase());
  return i < 0 ? 2 : i;
}

/**
 * The lower of two modes — the one that asked less.
 *
 * THIS IS HOW A RUN IS GRADED (#173). The mode can be changed mid-run from the
 * Settings panel, so a completion has to be credited at the LOWEST mode the run
 * ever held: dropping to Creative for the one fight you could not win and
 * putting it back afterwards is a Creative run, and the record says so. The rule
 * is deliberately the strict one, because the alternative — crediting whatever
 * mode happened to be set at the moment you reached Ithaca — makes every mode
 * above Easy decorative.
 */
export function lowerMode(a, b) {
  if (!a) return b || DEFAULT_MODE;
  if (!b) return a;
  return modeRank(a) <= modeRank(b) ? a : b;
}

/**
 * Whether the opening-minutes easing applies at all.
 *
 * `threatEase` softens the first three minutes for a player who is clearly
 * still finding the controls. On Insane that would be the mode quietly not
 * being the mode for its first three minutes, so Insane turns it off.
 */
export function easeApplies(key) {
  return !modeOf(key).noEase;
}
