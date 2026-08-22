// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE WORLD CINEMA WEBRINGS.
//
// The master ring is world-cinema-ring, which every page joins. Under it run six
// strands: the silent era, the Hollywood auteurs, the French and European new
// waves, Japanese and Asian cinema, the modernist masters, and the institutions.

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
    'the ringmaster is threading the projector. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['world-cinema-ring.geocities.ws', 'World Cinema Ring'],
  silent: ['silent-era-ring.geocities.ws', 'The Silent Era Ring'],
  auteur: ['hollywood-auteurs-ring.geocities.ws', 'The Hollywood Auteurs Ring'],
  newwave: ['new-waves-ring.geocities.ws', 'The New Waves Ring'],
  asia: ['asian-cinema-ring.geocities.ws', 'The Asian Cinema Ring'],
  modernist: ['modernist-masters-ring.geocities.ws', 'The Modernist Masters Ring'],
  institution: ['film-institutions-ring.geocities.ws', 'The Film Institutions Ring'],
};

const A = [['sergei-eisenstein.geocities.ws', 'Sergei Eisenstein'], ['fritz-lang.geocities.ws', 'Fritz Lang'],
  ['f-w-murnau.geocities.ws', 'F. W. Murnau'], ['german-expressionism-film.geocities.ws', 'German Expressionism'],
  ['the-battleship-potemkin.geocities.ws', 'Battleship Potemkin'], ['the-silent-film.geocities.ws', 'The Silent Film']];
const B = [['orson-welles.geocities.ws', 'Orson Welles'], ['alfred-hitchcock.geocities.ws', 'Alfred Hitchcock'],
  ['stanley-kubrick.geocities.ws', 'Stanley Kubrick'], ['citizen-kane.geocities.ws', 'Citizen Kane'],
  ['the-auteur-theory.geocities.ws', 'The Auteur Theory'], ['the-western-genre.geocities.ws', 'The Western']];
const C = [['jean-luc-godard.geocities.ws', 'Jean-Luc Godard'], ['francois-truffaut.geocities.ws', 'François Truffaut'],
  ['agnes-varda.geocities.ws', 'Agnès Varda'], ['the-french-new-wave.geocities.ws', 'The French New Wave'],
  ['robert-bresson.geocities.ws', 'Robert Bresson'], ['michelangelo-antonioni.geocities.ws', 'Michelangelo Antonioni']];
const D = [['akira-kurosawa.geocities.ws', 'Akira Kurosawa'], ['yasujiro-ozu.geocities.ws', 'Yasujiro Ozu'],
  ['satyajit-ray.geocities.ws', 'Satyajit Ray'], ['tokyo-story.geocities.ws', 'Tokyo Story'],
  ['japanese-cinema.geocities.ws', 'Japanese Cinema'], ['indian-cinema.geocities.ws', 'Indian Cinema']];
const E = [['ingmar-bergman.geocities.ws', 'Ingmar Bergman'], ['federico-fellini.geocities.ws', 'Federico Fellini'],
  ['andrei-tarkovsky.geocities.ws', 'Andrei Tarkovsky'], ['luis-bunuel.geocities.ws', 'Luis Buñuel'],
  ['jean-renoir.geocities.ws', 'Jean Renoir'], ['the-seventh-seal.geocities.ws', 'The Seventh Seal']];
const F = [['italian-neorealism.geocities.ws', 'Italian Neorealism'], ['the-cinematheque.geocities.ws', 'The Cinematheque'],
  ['the-film-festival.geocities.ws', 'The Film Festival'], ['the-montage.geocities.ws', 'The Montage'],
  ['the-long-take.geocities.ws', 'The Long Take'], ['the-film-critic.geocities.ws', 'The Film Critic']];

export const CINE_RINGS = [
  ring(R.master[0], 'WORLD CINEMA RING', 'World Cinema Ring', 'cine-auteur',
    ['<p>The image and the cut: the silent era and its language, the Hollywood auteurs, the French and '
      + 'European new waves, the Japanese and Asian masters, the modernists, and the cinematheques and '
      + 'festivals that kept the reels turning.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.silent, R.auteur, R.newwave, R.asia, R.modernist, R.institution]),

  ring(R.silent[0], 'THE SILENT ERA RING', 'The Silent Era Ring', 'cine-silent',
    ['<p>Before the sound came: the Odessa Steps, the city of Metropolis, the vampire\'s shadow, the '
      + 'painted sets of Caligari, the pram on the stairs, and the language of the iris.</p>'],
    A, [R.auteur, R.institution]),

  ring(R.auteur[0], 'THE HOLLYWOOD AUTEURS RING', 'The Hollywood Auteurs Ring', 'cine-auteur',
    ['<p>The director as author inside the studio: the deep focus of Kane, the master of suspense, the '
      + 'one-point corridor, "Rosebud", the politique des auteurs, and the myth of the frontier.</p>'],
    B, [R.silent, R.newwave]),

  ring(R.newwave[0], 'THE NEW WAVES RING', 'The New Waves Ring', 'cine-newwave',
    ['<p>The camera in the street: the jump cut of Breathless, the 400 blows, the gleaner\'s eye, the '
      + 'caméra-stylo, the model not the actor, and the vanished woman.</p>'],
    C, [R.auteur, R.modernist]),

  ring(R.asia[0], 'THE ASIAN CINEMA RING', 'The Asian Cinema Ring', 'cine-asia',
    ['<p>The scroll and the tatami: the seven samurai, the low camera and the pillow shot, the Apu '
      + 'trilogy, the quiet devastation of Tokyo Story, and the parallel cinema.</p>'],
    D, [R.modernist, R.institution]),

  ring(R.modernist[0], 'THE MODERNIST MASTERS RING', 'The Modernist Masters Ring', 'cine-modernist',
    ['<p>The chess game and the dream: the knight and Death, the block of 8 1/2, the sculpting in time, '
      + 'the surrealist razor, the rules of the game, and the plague on the shore.</p>'],
    E, [R.newwave, R.asia]),

  ring(R.institution[0], 'THE FILM INSTITUTIONS RING', 'The Film Institutions Ring', 'cine-institution',
    ['<p>What held the cinema up: the neorealist street, the cinematheque and its keeper, the festival '
      + 'and its palm, the collision of the cut, the unbroken take, and the critic.</p>'],
    F, [R.silent, R.asia]),
];
