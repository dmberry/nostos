// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE PAINTERS WEBRINGS.
//
// The master ring is painters-ring, which every page joins. Under it run six
// strands: Romanticism and landscape, Impressionism, the overlooked women,
// modernism and abstraction, American painting, and the visionary and outsider.

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
    'the ringmaster is hanging a show. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['painters-ring.geocities.ws', 'Painters Ring'],
  romantic: ['romanticism-ring.geocities.ws', 'Romanticism &amp; Landscape Ring'],
  impressionist: ['impressionism-ring.geocities.ws', 'Impressionism Ring'],
  women: ['overlooked-women-painters-ring.geocities.ws', 'The Overlooked Women Ring'],
  modern: ['modern-art-ring.geocities.ws', 'Modernism &amp; Abstraction Ring'],
  american: ['american-painting-ring.geocities.ws', 'American Painting Ring'],
  outsider: ['visionary-art-ring.geocities.ws', 'Visionary &amp; Outsider Ring'],
};

const A = [['jmw-turner.geocities.ws', 'J. M. W. Turner'], ['caspar-david-friedrich.geocities.ws', 'Caspar David Friedrich'],
  ['john-constable.geocities.ws', 'John Constable'], ['francisco-goya.geocities.ws', 'Francisco Goya'],
  ['eugene-delacroix.geocities.ws', 'Eugene Delacroix'], ['thomas-cole.geocities.ws', 'Thomas Cole']];
const B = [['claude-monet.geocities.ws', 'Claude Monet'], ['berthe-morisot.geocities.ws', 'Berthe Morisot'],
  ['vincent-van-gogh.geocities.ws', 'Vincent van Gogh'], ['paul-cezanne.geocities.ws', 'Paul Cezanne'],
  ['mary-cassatt.geocities.ws', 'Mary Cassatt'], ['georges-seurat.geocities.ws', 'Georges Seurat']];
const C = [['vigee-le-brun.geocities.ws', 'Elisabeth Vigee Le Brun'], ['paula-modersohn-becker.geocities.ws', 'Paula Modersohn-Becker'],
  ['hilma-af-klint.geocities.ws', 'Hilma af Klint'], ['leonora-carrington.geocities.ws', 'Leonora Carrington'],
  ['remedios-varo.geocities.ws', 'Remedios Varo'], ['alice-neel.geocities.ws', 'Alice Neel']];
const D = [['pablo-picasso.geocities.ws', 'Pablo Picasso'], ['wassily-kandinsky.geocities.ws', 'Wassily Kandinsky'],
  ['piet-mondrian.geocities.ws', 'Piet Mondrian'], ['henri-matisse.geocities.ws', 'Henri Matisse'],
  ['kazimir-malevich.geocities.ws', 'Kazimir Malevich'], ['paul-klee.geocities.ws', 'Paul Klee']];
const E = [['jackson-pollock.geocities.ws', 'Jackson Pollock'], ['mark-rothko.geocities.ws', 'Mark Rothko'],
  ['norman-lewis.geocities.ws', 'Norman Lewis'], ['alma-thomas.geocities.ws', 'Alma Thomas'],
  ['edward-hopper.geocities.ws', 'Edward Hopper'], ['charles-burchfield.geocities.ws', 'Charles Burchfield']];
const F = [['william-blake.geocities.ws', 'William Blake'], ['henri-rousseau.geocities.ws', 'Henri Rousseau'],
  ['seraphine-louis.geocities.ws', 'Seraphine Louis'], ['lois-mailou-jones.geocities.ws', 'Lois Mailou Jones'],
  ['aubrey-williams.geocities.ws', 'Aubrey Williams'], ['frida-kahlo.geocities.ws', 'Frida Kahlo']];

export const ART_RINGS = [
  ring(R.master[0], 'PAINTERS RING', 'Painters Ring', 'art-modern',
    ['<p>Three centuries of painting and the people who made it: the Romantics and the '
      + 'Impressionists, the women the canon overlooked, the modernists and the abstractionists, '
      + 'the American century, and the visionaries and outsiders.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.romantic, R.impressionist, R.women, R.modern, R.american, R.outsider]),

  ring(R.romantic[0], 'ROMANTICISM AND LANDSCAPE RING', 'Romanticism &amp; Landscape Ring', 'art-romantic',
    ['<p>The sublime and the storm: light and the sea, the wanderer above the fog, the English '
      + 'field, the disasters of war, and the American wilderness.</p>'],
    A, [R.impressionist, R.outsider]),

  ring(R.impressionist[0], 'IMPRESSIONISM RING', 'Impressionism Ring', 'art-impressionist',
    ['<p>Painting the light itself: the series and the water lilies, the overlooked women of the '
      + 'first exhibition, the short lives, and the bridge to the modern.</p>'],
    B, [R.romantic, R.modern]),

  ring(R.women[0], 'THE OVERLOOKED WOMEN RING', 'The Overlooked Women Ring', 'art-women',
    ['<p>The women the histories left out: the great portraitist of the eighteenth century, the '
      + 'abstraction that came before Kandinsky, the Surrealists of Mexico, and the collector of '
      + 'souls.</p>'],
    C, [R.impressionist, R.modern]),

  ring(R.modern[0], 'MODERNISM AND ABSTRACTION RING', 'Modernism &amp; Abstraction Ring', 'art-modern',
    ['<p>The century that broke the picture: Cubism and pure abstraction, the grid and the wild '
      + 'colour, the Black Square, and the line taken for a walk.</p>'],
    D, [R.impressionist, R.american]),

  ring(R.american[0], 'AMERICAN PAINTING RING', 'American Painting Ring', 'art-american',
    ['<p>The American century in paint: the drip and the colour-field, the abstractionists the '
      + 'movement overlooked, the loneliness of the diner, and the throb of the small town.</p>'],
    E, [R.modern, R.outsider]),

  ring(R.outsider[0], 'VISIONARY AND OUTSIDER RING', 'Visionary &amp; Outsider Ring', 'art-outsider',
    ['<p>The seers and the self-taught: the illuminated books, the customs officer’s jungle, the '
      + 'cleaner who painted ecstasy, the pioneers the canon passed over, and the painter of the '
      + 'self.</p>'],
    F, [R.romantic, R.american]),
];
