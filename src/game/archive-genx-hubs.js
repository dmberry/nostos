// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE GEN X SCREEN WEBRINGS.
//
// The master ring is genx-screen-ring, which every page joins. Under it run six
// strands: the video-store cult canon, the midnight movies, the indie and Sundance
// boom, the cult directors, the cult actors, and the scene around the screen.

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
    'the ringmaster is rewinding the tape. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['genx-screen-ring.geocities.ws', 'Gen X Screen Ring'],
  cult: ['cult-films-ring.geocities.ws', 'The Cult Films Ring'],
  midnight: ['midnight-movies-ring.geocities.ws', 'The Midnight Movies Ring'],
  indie: ['indie-cinema-ring.geocities.ws', 'The Indie Cinema Ring'],
  auteurs: ['cult-directors-ring.geocities.ws', 'The Cult Directors Ring'],
  actors: ['cult-actors-ring.geocities.ws', 'The Cult Actors Ring'],
  culture: ['video-store-culture-ring.geocities.ws', 'The Video-Store Culture Ring'],
};

const A = [['blade-runner.geocities.ws', 'Blade Runner'], ['the-big-lebowski.geocities.ws', 'The Big Lebowski'],
  ['repo-man.geocities.ws', 'Repo Man'], ['brazil.geocities.ws', 'Brazil'],
  ['withnail-and-i.geocities.ws', 'Withnail and I'], ['fight-club.geocities.ws', 'Fight Club']];
const B = [['eraserhead.geocities.ws', 'Eraserhead'], ['the-evil-dead.geocities.ws', 'The Evil Dead'],
  ['el-topo.geocities.ws', 'El Topo'], ['rocky-horror.geocities.ws', 'The Rocky Horror Picture Show'],
  ['re-animator.geocities.ws', 'Re-Animator'], ['night-of-the-living-dead.geocities.ws', 'Night of the Living Dead']];
const C = [['reservoir-dogs.geocities.ws', 'Reservoir Dogs'], ['clerks.geocities.ws', 'Clerks'],
  ['slacker.geocities.ws', 'Slacker'], ['sex-lies-and-videotape.geocities.ws', 'sex, lies, and videotape'],
  ['welcome-to-the-dollhouse.geocities.ws', 'Welcome to the Dollhouse'], ['pi-the-movie.geocities.ws', 'Pi']];
const D = [['david-lynch.geocities.ws', 'David Lynch'], ['jim-jarmusch.geocities.ws', 'Jim Jarmusch'],
  ['john-waters.geocities.ws', 'John Waters'], ['hal-hartley.geocities.ws', 'Hal Hartley'],
  ['richard-linklater.geocities.ws', 'Richard Linklater'], ['the-coen-brothers.geocities.ws', 'The Coen Brothers']];
const E = [['steve-buscemi.geocities.ws', 'Steve Buscemi'], ['parker-posey.geocities.ws', 'Parker Posey'],
  ['crispin-glover.geocities.ws', 'Crispin Glover'], ['christopher-walken.geocities.ws', 'Christopher Walken'],
  ['pam-grier.geocities.ws', 'Pam Grier'], ['harry-dean-stanton.geocities.ws', 'Harry Dean Stanton']];
const F = [['the-video-store.geocities.ws', 'The Video Store'], ['the-zine.geocities.ws', 'The Zine'],
  ['college-radio.geocities.ws', 'College Radio'], ['the-c90-mixtape.geocities.ws', 'The Mixtape'],
  ['reality-bites.geocities.ws', 'Reality Bites'], ['the-sundance-institute.geocities.ws', 'The Sundance Institute']];

export const GENX_RINGS = [
  ring(R.master[0], 'GEN X SCREEN RING', 'Gen X Screen Ring', 'genx-indie',
    ['<p>The films a generation found on the bottom shelf of the video store and in the '
      + 'midnight show: the cult canon, the horror, the Sundance independents, the directors '
      + 'and the character actors, and the whole scene of zines and college radio around it.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.cult, R.midnight, R.indie, R.auteurs, R.actors, R.culture]),

  ring(R.cult[0], 'THE CULT FILMS RING', 'The Cult Films Ring', 'genx-cult',
    ['<p>The video-store canon: the flops that became classics, the quotable ones, the ones you '
      + 'heard about from a friend and never forgot.</p>'],
    A, [R.midnight, R.auteurs]),

  ring(R.midnight[0], 'THE MIDNIGHT MOVIES RING', 'The Midnight Movies Ring', 'genx-midnight',
    ['<p>The films that played at midnight to a room that knew every line: the surreal, the '
      + 'low-budget horror, the ones the ratings board hated.</p>'],
    B, [R.cult, R.actors]),

  ring(R.indie[0], 'THE INDIE CINEMA RING', 'The Indie Cinema Ring', 'genx-indie',
    ['<p>The American independent boom: the credit-card budgets, the talky first features, the '
      + 'Sundance breakthroughs that changed what a film could be.</p>'],
    C, [R.auteurs, R.culture]),

  ring(R.auteurs[0], 'THE CULT DIRECTORS RING', 'The Cult Directors Ring', 'genx-auteurs',
    ['<p>The auteurs with the followings: the dream logic and the deadpan and the gleeful bad '
      + 'taste, the ones whose names sold the ticket.</p>'],
    D, [R.cult, R.indie]),

  ring(R.actors[0], 'THE CULT ACTORS RING', 'The Cult Actors Ring', 'genx-actors',
    ['<p>The character actors and the cult icons: the faces you knew before you knew the names, '
      + 'the ones who made the small parts the reason to watch.</p>'],
    E, [R.midnight, R.auteurs]),

  ring(R.culture[0], 'THE VIDEO-STORE CULTURE RING', 'The Video-Store Culture Ring', 'genx-culture',
    ['<p>The scene around the screen: the independent video store and the staff picks, the '
      + 'photocopied zine, the left of the radio dial, the mixtape, and the festival that '
      + 'launched it all.</p>'],
    F, [R.indie, R.cult]),
];
