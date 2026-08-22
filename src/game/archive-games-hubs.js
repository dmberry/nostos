// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE GAME-MAKERS WEBRINGS, 1940–2000.
//
// The people who wrote the games and built the machines they ran on, tied
// together the way the fanzines and the type-in listings tied them. Overlapping
// on purpose: the women-in-games ring crosses the arcade, adventure and sim
// rings, because the makers it names were working in all of them at once.

const ring = (domain, name, title, bg, blurb, members, sisters) => ({
  domain, name, title,
  body: [
    `<!--bg:${bg}-->`,
    `<h1>${title}</h1>`,
    '<p><small>a webring · add the strip to join · walked, not searched</small></p>',
    '<hr>',
    ...blurb,
    '<p><b>Member sites</b>:</p>',
    '<ul>',
    ...members.map(([d, t]) => `<li><a href="${d}">${t}</a></li>`),
    '</ul>',
    ...(sisters ? ['<p><small>sister rings: ' + sisters.map(([d, t]) => `<a href="${d}">${t}</a>`).join(' · ') + '</small></p>'] : []),
    '<hr>',
    '<p><small>« prev · <a href="' + members[0][0] + '">random</a> · next »<br>',
    'ringmaster off chasing a high score. the ring turns anyway.</small></p>',
  ],
});

const R = {
  arcade: ['arcade-coinop-ring.geocities.ws', 'Arcade Coin-Op Ring'],
  bedroom: ['bedroom-coders-ring.geocities.ws', 'Bedroom Coders Ring'],
  adventure: ['adventure-ring.geocities.ws', 'Adventure Ring'],
  sim: ['sim-strategy-ring.geocities.ws', 'Sim &amp; Strategy Ring'],
  console: ['console-jp-ring.geocities.ws', 'Japanese Console Ring'],
  fps: ['fps-3d-ring.geocities.ws', 'FPS &amp; 3D Ring'],
  women: ['women-in-games-ring.geocities.ws', 'Women in Games Ring'],
};

export const GAMES_RINGS = [
  ring(R.arcade[0], 'ARCADE COIN-OP RING', 'Arcade Coin-Op Ring', 'arcade',
    ['<p>The cabinet, the coin slot, the attract mode. Vector and raster, from the '
      + 'first Pong table to the falling blocks that ate the world. Kept by people '
      + 'who still have the callus.</p>'],
    [['pong-and-atari.geocities.ws', 'Nolan Bushnell / Atari'],
     ['space-invaders.geocities.ws', 'Tomohiro Nishikado'],
     ['pac-man.geocities.ws', 'Toru Iwatani'],
     ['defender-robotron.geocities.ws', 'Eugene Jarvis'],
     ['asteroids.geocities.ws', 'Ed Logg / Asteroids'],
     ['centipede.geocities.ws', 'Dona Bailey / Centipede'],
     ['tetris-pajitnov.geocities.ws', 'Alexey Pajitnov / Tetris']],
    [R.women, R.console]),

  ring(R.bedroom[0], 'BEDROOM CODERS RING', 'Bedroom Coders Ring', 'bedroom',
    ['<p>One person, one machine, one summer. The Spectrum, the C64, the BBC, the '
      + 'cassette that took four minutes to load and sometimes did not. Type it in, '
      + 'save it twice, send it to a label on a bus.</p>'],
    [['manic-miner.geocities.ws', 'Matthew Smith'],
     ['horace-skiing.geocities.ws', 'William Tang / Horace'],
     ['llamasoft.geocities.ws', 'Jeff Minter / Llamasoft'],
     ['elite.geocities.ws', 'Braben &amp; Bell / Elite'],
     ['paradroid.geocities.ws', 'Andrew Braybrook'],
     ['head-over-heels.geocities.ws', 'Ritman &amp; Drummond'],
     ['dizzy-oliver-twins.geocities.ws', 'The Oliver Twins / Dizzy']],
    [R.sim, R.fps]),

  ring(R.adventure[0], 'ADVENTURE RING', 'Adventure Ring', 'adventure',
    ['<p>You are in a maze of twisty little passages. The parser, the graphic '
      + 'adventure, the still world you click through. Type NORTH and see what the '
      + 'machine has hidden. Mind the grue.</p>'],
    [['colossal-cave.geocities.ws', 'Crowther &amp; Woods'],
     ['zork-infocom.geocities.ws', 'Infocom / Zork'],
     ['ultima-garriott.geocities.ws', 'Richard Garriott / Ultima'],
     ['kings-quest-sierra.geocities.ws', 'Roberta &amp; Ken Williams'],
     ['adventure-robinett.geocities.ws', 'Warren Robinett'],
     ['myst-cyan.geocities.ws', 'The Miller brothers / Myst']],
    [R.women, R.sim]),

  ring(R.sim[0], 'SIM AND STRATEGY RING', 'Sim &amp; Strategy Ring', 'adventure',
    ['<p>The world as a system you poke. God games, city games, train and railway '
      + 'and rollercoaster empires, the map you win by not starting a war. No lives, '
      + 'no timer, just the thing running and you inside it.</p>'],
    [['populous-molyneux.geocities.ws', 'Peter Molyneux / Bullfrog'],
     ['sim-city-wright.geocities.ws', 'Will Wright / Maxis'],
     ['civilization-meier.geocities.ws', 'Sid Meier'],
     ['balance-crawford.geocities.ws', 'Chris Crawford'],
     ['mule-bunten.geocities.ws', 'Dani Bunten Berry / M.U.L.E.'],
     ['stunt-car-crammond.geocities.ws', 'Geoff Crammond'],
     ['rollercoaster-sawyer.geocities.ws', 'Chris Sawyer']],
    [R.bedroom, R.women]),

  ring(R.console[0], 'JAPANESE CONSOLE RING', 'Japanese Console Ring', 'console',
    ['<p>The famicom, the Game Boy, the PlayStation. The platformer, the JRPG, the '
      + 'stealth game, the driving sim. Design from playgrounds and gardens and the '
      + 'link cable between two handhelds.</p>'],
    [['donkey-kong.geocities.ws', 'Shigeru Miyamoto'],
     ['metroid-yokoi.geocities.ws', 'Gunpei Yokoi'],
     ['final-fantasy.geocities.ws', 'Hironobu Sakaguchi'],
     ['dragon-quest.geocities.ws', 'Yuji Horii'],
     ['pokemon-tajiri.geocities.ws', 'Satoshi Tajiri'],
     ['metal-gear-kojima.geocities.ws', 'Hideo Kojima'],
     ['mario-64.geocities.ws', 'Super Mario 64'],
     ['gran-turismo.geocities.ws', 'Kazunori Yamauchi']],
    [R.arcade, R.fps]),

  ring(R.fps[0], 'FPS AND 3D RING', 'FPS &amp; 3D Ring', 'fps',
    ['<p>The shareware disk, the deathmatch, the WAD. The moment the screen became '
      + 'a room you stood inside. Engines that outlived their games, mods that '
      + 'dwarfed them, and the demoscene that taught half of them to code.</p>'],
    [['doom-id.geocities.ws', 'id Software'],
     ['deus-ex-spector.geocities.ws', 'Warren Spector'],
     ['unreal-sweeney.geocities.ws', 'Tim Sweeney / Epic'],
     ['half-life-valve.geocities.ws', 'Gabe Newell / Valve'],
     ['tomb-raider-core.geocities.ws', 'Core Design / Tomb Raider'],
     ['demoscene.geocities.ws', 'The Demoscene'],
     ['grand-theft-auto.geocities.ws', 'Grand Theft Auto / DMA']],
    [R.console, R.bedroom]),

  ring(R.women[0], 'WOMEN IN GAMES RING', 'Women in Games Ring', 'arcade',
    ['<p>The women who wrote the games in the years the industry liked to pretend '
      + 'they were not there. Coin-op assembly, the first graphic adventure, the 4K '
      + 'river, the game about people playing together.</p>'],
    [['centipede.geocities.ws', 'Dona Bailey / Centipede'],
     ['river-raid-shaw.geocities.ws', 'Carol Shaw / River Raid'],
     ['kings-quest-sierra.geocities.ws', 'Roberta Williams / Sierra'],
     ['mule-bunten.geocities.ws', 'Dani Bunten Berry / M.U.L.E.']],
    [R.arcade, R.adventure, R.sim]),
];
