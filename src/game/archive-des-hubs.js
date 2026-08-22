// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE DESIGN WEBRINGS.
//
// The master ring is design-ring, which every page joins. Under it run six strands:
// furniture, interiors and decorating, textiles and rugs, landscape and garden,
// fashion, and the schools and movements.

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
    'the ringmaster is measuring a chair. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['design-ring.geocities.ws', 'Design Ring'],
  furniture: ['furniture-design-ring.geocities.ws', 'Furniture Design Ring'],
  interiors: ['interior-design-ring.geocities.ws', 'Interior Decoration Ring'],
  textiles: ['textile-design-ring.geocities.ws', 'Textiles &amp; Rugs Ring'],
  landscape: ['landscape-design-ring.geocities.ws', 'Landscape &amp; Garden Ring'],
  fashion: ['fashion-design-ring.geocities.ws', 'Fashion Design Ring'],
  movements: ['design-movements-ring.geocities.ws', 'Design Movements Ring'],
};

const A = [['thomas-chippendale.geocities.ws', 'Thomas Chippendale'], ['michael-thonet.geocities.ws', 'Michael Thonet'],
  ['the-eameses.geocities.ws', 'Charles &amp; Ray Eames'], ['gimson-and-the-barnsleys.geocities.ws', 'Gimson &amp; the Barnsleys'],
  ['kaare-klint.geocities.ws', 'Kaare Klint'], ['george-nakashima.geocities.ws', 'George Nakashima']];
const B = [['elsie-de-wolfe.geocities.ws', 'Elsie de Wolfe'], ['syrie-maugham.geocities.ws', 'Syrie Maugham'],
  ['dorothy-draper.geocities.ws', 'Dorothy Draper'], ['jean-michel-frank.geocities.ws', 'Jean-Michel Frank'],
  ['david-hicks.geocities.ws', 'David Hicks'], ['madeleine-castaing.geocities.ws', 'Madeleine Castaing']];
const C = [['morris-and-co.geocities.ws', 'Morris &amp; Co (textiles)'], ['anni-albers.geocities.ws', 'Anni Albers'],
  ['lucienne-day.geocities.ws', 'Lucienne Day'], ['dorothy-liebes.geocities.ws', 'Dorothy Liebes'],
  ['jack-lenor-larsen.geocities.ws', 'Jack Lenor Larsen'], ['sonia-delaunay.geocities.ws', 'Sonia Delaunay']];
const D = [['capability-brown.geocities.ws', 'Capability Brown'], ['gertrude-jekyll.geocities.ws', 'Gertrude Jekyll'],
  ['frederick-law-olmsted.geocities.ws', 'Frederick Law Olmsted'], ['roberto-burle-marx.geocities.ws', 'Roberto Burle Marx'],
  ['brenda-colvin.geocities.ws', 'Brenda Colvin'], ['andre-le-notre.geocities.ws', 'Andre Le Notre']];
const E = [['madeleine-vionnet.geocities.ws', 'Madeleine Vionnet'], ['paul-poiret.geocities.ws', 'Paul Poiret'],
  ['charles-james.geocities.ws', 'Charles James'], ['claire-mccardell.geocities.ws', 'Claire McCardell'],
  ['ossie-clark.geocities.ws', 'Ossie Clark'], ['elsa-schiaparelli.geocities.ws', 'Elsa Schiaparelli']];
const F = [['the-bauhaus.geocities.ws', 'The Bauhaus'], ['the-arts-and-crafts-movement.geocities.ws', 'The Arts &amp; Crafts Movement'],
  ['the-wiener-werkstatte.geocities.ws', 'The Wiener Werkstatte'], ['christopher-dresser.geocities.ws', 'Christopher Dresser'],
  ['eileen-gray.geocities.ws', 'Eileen Gray'], ['florence-knoll.geocities.ws', 'Florence Knoll']];

export const DES_RINGS = [
  ring(R.master[0], 'DESIGN RING', 'Design Ring', 'des-movements',
    ['<p>The made world and the people who shaped it: the chair and the room, the textile and '
      + 'the rug, the garden and the garment, and the schools that argued about how a thing '
      + 'should look and work.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.furniture, R.interiors, R.textiles, R.landscape, R.fashion, R.movements]),

  ring(R.furniture[0], 'FURNITURE DESIGN RING', 'Furniture Design Ring', 'des-furniture',
    ['<p>The chair as the hardest problem in design: the Director and the bentwood, moulded '
      + 'plywood and Danish modern, and the soul of the tree.</p>'],
    A, [R.interiors, R.movements]),

  ring(R.interiors[0], 'INTERIOR DECORATION RING', 'Interior Decoration Ring', 'des-interiors',
    ['<p>The invention of the decorator and the making of the room: the banishment of clutter, '
      + 'the all-white room, baroque modern, and the eccentric interior.</p>'],
    B, [R.furniture, R.textiles]),

  ring(R.textiles[0], 'TEXTILES AND RUGS RING', 'Textiles &amp; Rugs Ring', 'des-textiles',
    ['<p>Pattern and weave: the printed and woven textile, the Bauhaus loom, the post-war '
      + 'abstract botanical, and colour carried into cloth.</p>'],
    C, [R.interiors, R.fashion]),

  ring(R.landscape[0], 'LANDSCAPE AND GARDEN RING', 'Landscape &amp; Garden Ring', 'des-landscape',
    ['<p>The land composed: the English landscape park and the herbaceous border, the public '
      + 'park, the biomorphic garden, and the grand French axis.</p>'],
    D, [R.furniture, R.movements]),

  ring(R.fashion[0], 'FASHION DESIGN RING', 'Fashion Design Ring', 'des-fashion',
    ['<p>The body dressed: the bias cut and the freed corset, the couturier as sculptor, the '
      + 'American look, and surrealist fashion.</p>'],
    E, [R.textiles, R.interiors]),

  ring(R.movements[0], 'DESIGN MOVEMENTS RING', 'Design Movements Ring', 'des-movements',
    ['<p>The schools and the manifestos: the Bauhaus and the Arts and Crafts, the Vienna '
      + 'Workshops, the first industrial designer, and the modernists the century nearly '
      + 'forgot.</p>'],
    F, [R.furniture, R.landscape]),
];
