// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE GAMES WEBRINGS.
//
// The master ring is games-ring, which every page joins. Under it run six strands:
// the arcade golden age, the console wars, the bedroom coders and home micros, the
// designers and auteurs, the landmark games, and the scene and industry.

const ring = (domain, name, title, bg, blurb, members, sisters) => ({
  domain, name, title,
  body: [
    `<!--bg:${bg}-->`,
    `<h1>${title}</h1>`,
    '<p><small>a webring · a page joins by adding the strip · walked, not searched</small></p>',
    '<hr>',
    ...blurb,
    '<p><b>Member sites</b>:</p>',
    '<ul>',
    ...members.map(([d, t]) => `<li><a href="${d}">${t}</a></li>`),
    '</ul>',
    ...(sisters ? ['<p><small>strands: ' + sisters.map(([d, t]) => `<a href="${d}">${t}</a>`).join(' · ') + '</small></p>'] : []),
    '<hr>',
    '<p><small>« prev · <a href="' + members[0][0] + '">random</a> · next »<br>',
    'the ringmaster is chasing a high score. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['games-ring.geocities.ws', 'Games Ring'],
  arcade: ['arcade-golden-age-ring.geocities.ws', 'The Arcade Golden Age Ring'],
  console: ['console-wars-ring.geocities.ws', 'The Console Wars Ring'],
  bedroom: ['game-bedroom-coders-ring.geocities.ws', 'The Bedroom Coders Ring'],
  designers: ['game-designers-ring.geocities.ws', 'The Game Designers Ring'],
  landmark: ['landmark-games-ring.geocities.ws', 'The Landmark Games Ring'],
  culture: ['game-culture-ring.geocities.ws', 'The Scene &amp; Industry Ring'],
};

const A = [['space-invaders-descent.geocities.ws', 'Space Invaders'], ['pac-man-patterns.geocities.ws', 'Pac-Man'],
  ['donkey-kong-screens.geocities.ws', 'Donkey Kong'], ['defender.geocities.ws', 'Defender'],
  ['tempest.geocities.ws', 'Tempest'], ['robotron-2084.geocities.ws', 'Robotron: 2084']];
const B = [['the-atari-2600.geocities.ws', 'The Atari 2600'], ['the-nes.geocities.ws', 'The NES'],
  ['the-mega-drive.geocities.ws', 'The Mega Drive'], ['the-snes.geocities.ws', 'The SNES'],
  ['the-game-boy.geocities.ws', 'The Game Boy'], ['the-video-game-crash.geocities.ws', 'The Crash of 1983']];
const C = [['the-zx-spectrum.geocities.ws', 'The ZX Spectrum'], ['the-commodore-64.geocities.ws', 'The Commodore 64'],
  ['elite-commander.geocities.ws', 'Elite'], ['manic-miner-willy.geocities.ws', 'Manic Miner'],
  ['the-demoscene.geocities.ws', 'The Demoscene'], ['the-bedroom-coder.geocities.ws', 'The Bedroom Coder']];
const D = [['shigeru-miyamoto.geocities.ws', 'Shigeru Miyamoto'], ['will-wright.geocities.ws', 'Will Wright'],
  ['roberta-williams.geocities.ws', 'Roberta Williams'], ['carol-shaw.geocities.ws', 'Carol Shaw'],
  ['richard-garriott.geocities.ws', 'Richard Garriott'], ['hideo-kojima.geocities.ws', 'Hideo Kojima']];
const E = [['zork.geocities.ws', 'Zork'], ['tetris.geocities.ws', 'Tetris'],
  ['doom.geocities.ws', 'Doom'], ['simcity.geocities.ws', 'SimCity'],
  ['the-legend-of-zelda.geocities.ws', 'The Legend of Zelda'], ['myst.geocities.ws', 'Myst']];
const F = [['the-arcade.geocities.ws', 'The Arcade'], ['the-games-magazine.geocities.ws', 'The Games Magazine'],
  ['the-cheat-code.geocities.ws', 'The Cheat Code'], ['id-software.geocities.ws', 'id Software'],
  ['the-shareware-model.geocities.ws', 'The Shareware Model'], ['the-mud.geocities.ws', 'The MUD']];

export const GAME_RINGS = [
  ring(R.master[0], 'GAMES RING', 'Games Ring', 'games-arcade',
    ['<p>The medium of the joystick and the save file: the arcade golden age, the console wars, the '
      + 'bedroom coders and the home micros, the designers and auteurs, the landmark games, and the '
      + 'scene and the industry around the play.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.arcade, R.console, R.bedroom, R.designers, R.landmark, R.culture]),

  ring(R.arcade[0], 'THE ARCADE GOLDEN AGE RING', 'The Arcade Golden Age Ring', 'games-arcade',
    ['<p>Insert coin: the descending invaders, the maze and the ghosts, the barrels and the ape, the '
      + 'humanoids to rescue, the vector tube, and the twin-stick waves.</p>'],
    A, [R.console, R.culture]),

  ring(R.console[0], 'THE CONSOLE WARS RING', 'The Console Wars Ring', 'games-console',
    ['<p>The grey boxes under the television: the wood-grain VCS, the toaster slot, the blast '
      + 'processing, the 16-bit rival, the green handheld, and the crash they rebuilt from.</p>'],
    B, [R.arcade, R.landmark]),

  ring(R.bedroom[0], 'THE BEDROOM CODERS RING', 'The Bedroom Coders Ring', 'games-bedroom',
    ['<p>The cassette and the type-in: the rubber keys, the SID chip, the universe in 22K, the twenty '
      + 'caverns, the demoscene, and the one-person industry.</p>'],
    C, [R.designers, R.culture]),

  ring(R.designers[0], 'THE GAME DESIGNERS RING', 'The Game Designers Ring', 'games-designers',
    ['<p>The hands behind the play: the gardener of Mario and Zelda, the maker of software toys, the '
      + 'adventure pioneer, the overlooked programmer, Lord British, and the cinematic auteur.</p>'],
    D, [R.bedroom, R.landmark]),

  ring(R.landmark[0], 'THE LANDMARK GAMES RING', 'The Landmark Games Ring', 'games-landmark',
    ['<p>The games that changed the medium: the falling blocks, the twisty passages, the shareware '
      + 'shooter, the city with no win, the gold cartridge, and the linking books.</p>'],
    E, [R.console, R.designers]),

  ring(R.culture[0], 'THE SCENE AND INDUSTRY RING', 'The Scene &amp; Industry Ring', 'games-culture',
    ['<p>Around the play: the arcade as place, the games press, the cheat code, the shareware studio, '
      + 'the try-before-you-buy, and the dungeon on the modem.</p>'],
    F, [R.arcade, R.landmark]),
];
