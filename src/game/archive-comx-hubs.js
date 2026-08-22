// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE COMICS WEBRINGS.
//
// The master ring is comics-ring, which every page joins. Under it run six strands:
// the graphic-novel canon, the creators, the underground and alternative, manga and
// the global, the classic strips, and the industry and culture.

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
    'the ringmaster is bagging and boarding. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['comics-ring.geocities.ws', 'Comics Ring'],
  canon: ['graphic-novels-ring.geocities.ws', 'The Graphic-Novel Canon Ring'],
  creators: ['comics-creators-ring.geocities.ws', 'The Comics Creators Ring'],
  underground: ['underground-comix-ring.geocities.ws', 'The Underground &amp; Alternative Ring'],
  manga: ['manga-ring.geocities.ws', 'The Manga Ring'],
  strips: ['comic-strips-ring.geocities.ws', 'The Classic Strips Ring'],
  culture: ['comics-culture-ring.geocities.ws', 'The Comics Industry &amp; Culture Ring'],
};

const A = [['watchmen.geocities.ws', 'Watchmen'], ['the-dark-knight-returns.geocities.ws', 'The Dark Knight Returns'],
  ['maus.geocities.ws', 'Maus'], ['the-sandman.geocities.ws', 'The Sandman'],
  ['from-hell.geocities.ws', 'From Hell'], ['v-for-vendetta.geocities.ws', 'V for Vendetta']];
const B = [['alan-moore.geocities.ws', 'Alan Moore'], ['neil-gaiman.geocities.ws', 'Neil Gaiman'],
  ['frank-miller.geocities.ws', 'Frank Miller'], ['grant-morrison.geocities.ws', 'Grant Morrison'],
  ['chris-ware.geocities.ws', 'Chris Ware'], ['robert-crumb.geocities.ws', 'Robert Crumb']];
const C = [['zap-comix.geocities.ws', 'Zap Comix'], ['american-splendor.geocities.ws', 'American Splendor'],
  ['love-and-rockets.geocities.ws', 'Love and Rockets'], ['raw-magazine.geocities.ws', 'RAW'],
  ['weirdo.geocities.ws', 'Weirdo'], ['fabulous-furry-freak-brothers.geocities.ws', 'The Fabulous Furry Freak Brothers']];
const D = [['akira.geocities.ws', 'Akira'], ['astro-boy.geocities.ws', 'Astro Boy'],
  ['lone-wolf-and-cub.geocities.ws', 'Lone Wolf and Cub'], ['ghost-in-the-shell.geocities.ws', 'Ghost in the Shell'],
  ['nausicaa.geocities.ws', 'Nausicaa'], ['dragon-ball.geocities.ws', 'Dragon Ball']];
const E = [['krazy-kat.geocities.ws', 'Krazy Kat'], ['calvin-and-hobbes.geocities.ws', 'Calvin and Hobbes'],
  ['peanuts.geocities.ws', 'Peanuts'], ['tintin.geocities.ws', 'Tintin'],
  ['asterix.geocities.ws', 'Asterix'], ['little-nemo.geocities.ws', 'Little Nemo']];
const F = [['the-comics-code.geocities.ws', 'The Comics Code'], ['the-comic-shop.geocities.ws', 'The Comic Shop'],
  ['2000ad.geocities.ws', '2000 AD'], ['ec-comics.geocities.ws', 'EC Comics'],
  ['the-comic-con.geocities.ws', 'The Comic Convention'], ['the-superhero.geocities.ws', 'The Superhero']];

export const COMX_RINGS = [
  ring(R.master[0], 'COMICS RING', 'Comics Ring', 'comics-canon',
    ['<p>The medium of the panel and the gutter: the graphic-novel canon, the great creators, the '
      + 'underground and alternative, manga and the global, the classic newspaper strips, and the '
      + 'industry and culture around the four colours.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.canon, R.creators, R.underground, R.manga, R.strips, R.culture]),

  ring(R.canon[0], 'THE GRAPHIC-NOVEL CANON RING', 'The Graphic-Novel Canon Ring', 'comics-canon',
    ['<p>The books that argued comics could be literature: the watchmen, the returning knight, the '
      + 'mice and cats, the lord of dreams, the Ripper, and the man in the mask.</p>'],
    A, [R.creators, R.culture]),

  ring(R.creators[0], 'THE COMICS CREATORS RING', 'The Comics Creators Ring', 'comics-creators',
    ['<p>The writers and the artists: the magus of Northampton, the myth-maker, the noir hand, the '
      + 'chaos magician, the melancholy designer, and the father of the underground.</p>'],
    B, [R.canon, R.underground]),

  ring(R.underground[0], 'THE UNDERGROUND AND ALTERNATIVE RING', 'The Underground &amp; Alternative Ring', 'comics-underground',
    ['<p>The comix from the head shops and the small press: Zap and the ordinary life, the Locas and '
      + 'Palomar, the art anthologies, and the freak brothers.</p>'],
    C, [R.creators, R.strips]),

  ring(R.manga[0], 'THE MANGA RING', 'The Manga Ring', 'comics-manga',
    ['<p>The comics of Japan and the arrival in the West: Neo-Tokyo, the god of manga, the ronin and '
      + 'the cub, the ghost in the shell, the ecology epic, and the dragon balls.</p>'],
    D, [R.canon, R.culture]),

  ring(R.strips[0], 'THE CLASSIC STRIPS RING', 'The Classic Strips Ring', 'comics-strips',
    ['<p>The newspaper page: the brick and the love triangle, the boy and the tiger, the round-headed '
      + 'kid, the boy reporter, the Gaulish village, and Slumberland.</p>'],
    E, [R.underground, R.culture]),

  ring(R.culture[0], 'THE COMICS INDUSTRY AND CULTURE RING', 'The Comics Industry &amp; Culture Ring', 'comics-culture',
    ['<p>The business and the scene: the Code and the hearings, the direct-market shop, the British '
      + 'weekly, the EC line, the convention, and the argument about the superhero.</p>'],
    F, [R.canon, R.manga]),
];
