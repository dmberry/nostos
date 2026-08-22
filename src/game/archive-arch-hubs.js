// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE ARCHITECTURE WEBRINGS.
//
// The master ring is architecture-ring, which every page joins. Under it run six
// strands: the modern masters, the pioneers, brutalism and the postwar, the women
// of architecture, the world and the vernacular, and ideas and the city.

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
    'the ringmaster is out sketching a facade. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['architecture-ring.geocities.ws', 'Architecture Ring'],
  modern: ['modern-masters-arch-ring.geocities.ws', 'The Modern Masters Ring'],
  pioneers: ['arch-pioneers-ring.geocities.ws', 'The Pioneers Ring'],
  brutalist: ['brutalism-ring.geocities.ws', 'The Brutalism &amp; Postwar Ring'],
  women: ['women-in-architecture-ring.geocities.ws', 'The Women of Architecture Ring'],
  world: ['world-architecture-ring.geocities.ws', 'The World &amp; Vernacular Ring'],
  ideas: ['architecture-ideas-ring.geocities.ws', 'The Ideas &amp; the City Ring'],
};

const A = [['le-corbusier.geocities.ws', 'Le Corbusier'], ['mies-van-der-rohe.geocities.ws', 'Mies van der Rohe'],
  ['walter-gropius.geocities.ws', 'Walter Gropius'], ['frank-lloyd-wright.geocities.ws', 'Frank Lloyd Wright'],
  ['bauhaus-architecture.geocities.ws', 'Bauhaus Architecture'], ['the-international-style.geocities.ws', 'The International Style']];
const B = [['louis-sullivan.geocities.ws', 'Louis Sullivan'], ['antoni-gaudi.geocities.ws', 'Antoni Gaudí'],
  ['the-skyscraper.geocities.ws', 'The Skyscraper'], ['the-crystal-palace.geocities.ws', 'The Crystal Palace'],
  ['the-eiffel-tower.geocities.ws', 'The Eiffel Tower'], ['arts-and-crafts.geocities.ws', 'Arts and Crafts']];
const C = [['louis-kahn.geocities.ws', 'Louis Kahn'], ['oscar-niemeyer.geocities.ws', 'Oscar Niemeyer'],
  ['alison-and-peter-smithson.geocities.ws', 'The Smithsons'], ['brutalism.geocities.ws', 'Brutalism'],
  ['the-barbican.geocities.ws', 'The Barbican'], ['kenzo-tange.geocities.ws', 'Kenzo Tange']];
const D = [['zaha-hadid.geocities.ws', 'Zaha Hadid'], ['charlotte-perriand.geocities.ws', 'Charlotte Perriand'],
  ['lina-bo-bardi.geocities.ws', 'Lina Bo Bardi'], ['denise-scott-brown.geocities.ws', 'Denise Scott Brown'],
  ['julia-morgan.geocities.ws', 'Julia Morgan'], ['jane-jacobs.geocities.ws', 'Jane Jacobs']];
const E = [['geoffrey-bawa.geocities.ws', 'Geoffrey Bawa'], ['hassan-fathy.geocities.ws', 'Hassan Fathy'],
  ['balkrishna-doshi.geocities.ws', 'Balkrishna Doshi'], ['tadao-ando.geocities.ws', 'Tadao Ando'],
  ['luis-barragan.geocities.ws', 'Luis Barragán'], ['the-vernacular.geocities.ws', 'The Vernacular']];
const F = [['the-garden-city.geocities.ws', 'The Garden City'], ['urban-planning.geocities.ws', 'Urban Planning'],
  ['postmodern-architecture.geocities.ws', 'Postmodern Architecture'], ['the-cathedral.geocities.ws', 'The Cathedral'],
  ['form-follows-function.geocities.ws', 'Form Follows Function'], ['the-city-in-history.geocities.ws', 'The City in History']];

export const ARCH_RINGS = [
  ring(R.master[0], 'ARCHITECTURE RING', 'Architecture Ring', 'arch-modern',
    ['<p>The plan and the section: the modern masters, the iron-and-glass pioneers, the raw concrete of '
      + 'brutalism, the women written out of the citations, the world and its vernaculars, and the ideas '
      + 'that shaped the city.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.modern, R.pioneers, R.brutalist, R.women, R.world, R.ideas]),

  ring(R.modern[0], 'THE MODERN MASTERS RING', 'The Modern Masters Ring', 'arch-modern',
    ['<p>The machine for living: the Five Points and the Modulor, less is more, the Dessau school, the '
      + 'cantilever over the waterfall, and the white box that went global.</p>'],
    A, [R.pioneers, R.ideas]),

  ring(R.pioneers[0], 'THE PIONEERS RING', 'The Pioneers Ring', 'arch-pioneers',
    ['<p>Iron, glass and ornament: form following function, the Sagrada Família, the steel frame, the '
      + 'Crystal Palace, the wrought-iron tower, and the honest craft.</p>'],
    B, [R.modern, R.brutalist]),

  ring(R.brutalist[0], 'THE BRUTALISM AND POSTWAR RING', 'The Brutalism &amp; Postwar Ring', 'arch-brutalist',
    ['<p>Béton brut: what the brick wants to be, the curve of Brasília, the streets in the sky, the raw '
      + 'concrete, the City estate, and the peace memorial.</p>'],
    C, [R.pioneers, R.women]),

  ring(R.women[0], 'THE WOMEN OF ARCHITECTURE RING', 'The Women of Architecture Ring', 'arch-women',
    ['<p>The architects left off the citation: the parametric first Pritzker, the chaise longue, the '
      + 'lifted glass box, the decorated shed, the Hearst hillside, and the eyes on the street.</p>'],
    D, [R.brutalist, R.world]),

  ring(R.world[0], 'THE WORLD AND VERNACULAR RING', 'The World &amp; Vernacular Ring', 'arch-world',
    ['<p>Beyond the white box: the tropical modern, the mud brick and the Nubian vault, the humane Indian '
      + 'modern, the concrete and the light, the colour and the water, and the architecture without '
      + 'architects.</p>'],
    E, [R.women, R.ideas]),

  ring(R.ideas[0], 'THE IDEAS AND THE CITY RING', 'The Ideas &amp; the City Ring', 'arch-ideas',
    ['<p>The city as an argument: the garden city and its magnets, the master plan, the return of '
      + 'ornament, the Gothic light, the modernist creed, and the long view of history.</p>'],
    F, [R.modern, R.world]),
];
