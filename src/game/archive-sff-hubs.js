// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE SCIENCE FICTION & FANTASY WEBRINGS.
//
// The master ring is sff-ring, which every page joins. Under it run six strands:
// the founders, the golden age, the new wave, cyberpunk, fantasy and the epic,
// and the fandom and culture.

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
    'the ringmaster is at a convention. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['sff-ring.geocities.ws', 'SF &amp; Fantasy Ring'],
  founders: ['sf-founders-ring.geocities.ws', 'The Founders Ring'],
  goldenage: ['golden-age-sf-ring.geocities.ws', 'The Golden Age Ring'],
  newwave: ['new-wave-sf-ring.geocities.ws', 'The New Wave Ring'],
  cyberpunk: ['cyberpunk-ring.geocities.ws', 'The Cyberpunk Ring'],
  fantasy: ['epic-fantasy-ring.geocities.ws', 'The Epic Fantasy Ring'],
  culture: ['sf-fandom-ring.geocities.ws', 'The Fandom &amp; Culture Ring'],
};

const A = [['h-g-wells.geocities.ws', 'H. G. Wells'], ['jules-verne.geocities.ws', 'Jules Verne'],
  ['hugo-gernsback.geocities.ws', 'Hugo Gernsback'], ['the-pulps.geocities.ws', 'The Pulps'],
  ['weird-tales.geocities.ws', 'Weird Tales'], ['the-time-machine.geocities.ws', 'The Time Machine']];
const B = [['isaac-asimov.geocities.ws', 'Isaac Asimov'], ['arthur-c-clarke.geocities.ws', 'Arthur C. Clarke'],
  ['robert-heinlein.geocities.ws', 'Robert Heinlein'], ['foundation.geocities.ws', 'Foundation'],
  ['astounding-stories.geocities.ws', 'Astounding'], ['the-hugo-awards.geocities.ws', 'The Hugo Awards']];
const C = [['ursula-k-le-guin.geocities.ws', 'Ursula K. Le Guin'], ['philip-k-dick.geocities.ws', 'Philip K. Dick'],
  ['harlan-ellison.geocities.ws', 'Harlan Ellison'], ['michael-moorcock.geocities.ws', 'Michael Moorcock'],
  ['stanislaw-lem.geocities.ws', 'Stanislaw Lem'], ['the-new-wave-sf.geocities.ws', 'The New Wave']];
const D = [['william-gibson.geocities.ws', 'William Gibson'], ['neuromancer.geocities.ws', 'Neuromancer'],
  ['cyberpunk.geocities.ws', 'Cyberpunk'], ['bruce-sterling.geocities.ws', 'Bruce Sterling'],
  ['j-g-ballard.geocities.ws', 'J. G. Ballard'], ['the-dystopia.geocities.ws', 'The Dystopia']];
const E = [['j-r-r-tolkien.geocities.ws', 'J. R. R. Tolkien'], ['the-lord-of-the-rings.geocities.ws', 'The Lord of the Rings'],
  ['the-earthsea.geocities.ws', 'Earthsea'], ['robert-e-howard.geocities.ws', 'Robert E. Howard'],
  ['lord-dunsany.geocities.ws', 'Lord Dunsany'], ['mervyn-peake.geocities.ws', 'Mervyn Peake']];
const F = [['octavia-butler.geocities.ws', 'Octavia Butler'], ['ray-bradbury.geocities.ws', 'Ray Bradbury'],
  ['frank-herbert.geocities.ws', 'Frank Herbert'], ['dune.geocities.ws', 'Dune'],
  ['the-sf-fandom.geocities.ws', 'The SF Fandom'], ['the-worldcon.geocities.ws', 'The Worldcon']];

export const SFF_RINGS = [
  ring(R.master[0], 'SF AND FANTASY RING', 'SF &amp; Fantasy Ring', 'sff-goldenage',
    ['<p>The literature of the what-if: the scientific romancers, the golden-age engineers, the new-wave '
      + 'experimenters, the cyberpunks, the fantasists and their epics, and the fandom that argued the '
      + 'canon into being.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.founders, R.goldenage, R.newwave, R.cyberpunk, R.fantasy, R.culture]),

  ring(R.founders[0], 'THE FOUNDERS RING', 'The Founders Ring', 'sff-founders',
    ['<p>Where it began: the time machine and the Martians, the Nautilus, the man who named the genre, '
      + 'the wood-pulp magazines, and the weird tale.</p>'],
    A, [R.goldenage, R.culture]),

  ring(R.goldenage[0], 'THE GOLDEN AGE RING', 'The Golden Age Ring', 'sff-goldenage',
    ['<p>The engineers of wonder: the Three Laws, the geostationary orbit, the harsh mistress moon, the '
      + 'Seldon Plan, the Campbell stable, and the rocket trophy.</p>'],
    B, [R.founders, R.newwave]),

  ring(R.newwave[0], 'THE NEW WAVE RING', 'The New Wave Ring', 'sff-newwave',
    ['<p>Inner space over outer: the ambisexual Gethen, the paranoid fake, the dangerous vision, the '
      + 'Eternal Champion, the unknowable ocean, and the literary break.</p>'],
    C, [R.goldenage, R.cyberpunk]),

  ring(R.cyberpunk[0], 'THE CYBERPUNK RING', 'The Cyberpunk Ring', 'sff-cyberpunk',
    ['<p>High tech and low life: the matrix and the console cowboy, the dead-channel sky, the '
      + 'mirrorshades, the Shaper and the Mechanist, the inner-space disaster, and the boot on the face.</p>'],
    D, [R.newwave, R.fantasy]),

  ring(R.fantasy[0], 'THE EPIC FANTASY RING', 'The Epic Fantasy Ring', 'sff-fantasy',
    ['<p>The sub-created world: the One Ring, the fellowship, the wizard school of Earthsea, the '
      + 'barbarian, the dream-gods of Pegana, and the crumbling Gormenghast.</p>'],
    E, [R.cyberpunk, R.culture]),

  ring(R.culture[0], 'THE FANDOM AND CULTURE RING', 'The Fandom &amp; Culture Ring', 'sff-culture',
    ['<p>The readers and the outsiders: the antebellum time-slip, the burning books, the spice of '
      + 'Arrakis, the desert messiah, the fanzine, and the convention hall.</p>'],
    F, [R.founders, R.fantasy]),
];
