// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE SCIENCE WEBRINGS.
//
// The master ring is science-ring, which every page joins. Under it run six
// strands: physics and the cosmos, matter and the elements, life and evolution,
// medicine and the body, the women of science, and the laboratory and institution.

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
    'the ringmaster is at the bench. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['science-ring.geocities.ws', 'Science Ring'],
  physics: ['physics-and-cosmos-ring.geocities.ws', 'The Physics &amp; Cosmos Ring'],
  matter: ['matter-and-elements-ring.geocities.ws', 'The Matter &amp; Elements Ring'],
  life: ['life-and-evolution-ring.geocities.ws', 'The Life &amp; Evolution Ring'],
  medicine: ['medicine-and-the-body-ring.geocities.ws', 'The Medicine &amp; the Body Ring'],
  women: ['women-of-science-ring.geocities.ws', 'The Women of Science Ring'],
  institutions: ['laboratory-and-institution-ring.geocities.ws', 'The Laboratory &amp; Institution Ring'],
};

const A = [['albert-einstein.geocities.ws', 'Albert Einstein'], ['newton-principia.geocities.ws', 'Newton'],
  ['galileo-galilei.geocities.ws', 'Galileo'], ['michael-faraday.geocities.ws', 'Michael Faraday'],
  ['james-clerk-maxwell.geocities.ws', 'James Clerk Maxwell'], ['niels-bohr.geocities.ws', 'Niels Bohr']];
const B = [['dmitri-mendeleev.geocities.ws', 'Dmitri Mendeleev'], ['louis-pasteur.geocities.ws', 'Louis Pasteur'],
  ['ernest-rutherford.geocities.ws', 'Ernest Rutherford'], ['the-periodic-table.geocities.ws', 'The Periodic Table'],
  ['antoine-lavoisier.geocities.ws', 'Antoine Lavoisier'], ['humphry-davy.geocities.ws', 'Humphry Davy']];
const C = [['charles-darwin.geocities.ws', 'Charles Darwin'], ['gregor-mendel.geocities.ws', 'Gregor Mendel'],
  ['alexander-von-humboldt.geocities.ws', 'Alexander von Humboldt'], ['carl-linnaeus.geocities.ws', 'Carl Linnaeus'],
  ['alfred-russel-wallace.geocities.ws', 'Alfred Russel Wallace'], ['on-the-origin-of-species.geocities.ws', 'On the Origin of Species']];
const D = [['edward-jenner.geocities.ws', 'Edward Jenner'], ['joseph-lister.geocities.ws', 'Joseph Lister'],
  ['john-snow.geocities.ws', 'John Snow'], ['william-harvey.geocities.ws', 'William Harvey'],
  ['florence-nightingale.geocities.ws', 'Florence Nightingale'], ['the-germ-theory.geocities.ws', 'The Germ Theory']];
const E = [['marie-curie.geocities.ws', 'Marie Curie'], ['lise-meitner.geocities.ws', 'Lise Meitner'],
  ['rosalind-franklin.geocities.ws', 'Rosalind Franklin'], ['cecilia-payne.geocities.ws', 'Cecilia Payne'],
  ['barbara-mcclintock.geocities.ws', 'Barbara McClintock'], ['dorothy-hodgkin.geocities.ws', 'Dorothy Hodgkin']];
const F = [['the-royal-society.geocities.ws', 'The Royal Society'], ['the-laboratory.geocities.ws', 'The Laboratory'],
  ['the-scientific-method.geocities.ws', 'The Scientific Method'], ['the-nobel-prize.geocities.ws', 'The Nobel Prize'],
  ['the-scientific-journal.geocities.ws', 'The Scientific Journal'], ['the-natural-history-museum.geocities.ws', 'The Natural History Museum']];

export const SCI_RINGS = [
  ring(R.master[0], 'SCIENCE RING', 'Science Ring', 'sci-physics',
    ['<p>The work of finding things out: physics and the cosmos, matter and the elements, life and '
      + 'evolution, medicine and the body, the women written out of the sleeve notes, and the '
      + 'societies and laboratories that held it together.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.physics, R.matter, R.life, R.medicine, R.women, R.institutions]),

  ring(R.physics[0], 'THE PHYSICS AND COSMOS RING', 'The Physics &amp; Cosmos Ring', 'sci-physics',
    ['<p>Gravity and light and the atom: the curved spacetime, the Principia, the moons of Jupiter, '
      + 'the field and its lines, the equations of light, and the quantum.</p>'],
    A, [R.matter, R.institutions]),

  ring(R.matter[0], 'THE MATTER AND ELEMENTS RING', 'The Matter &amp; Elements Ring', 'sci-matter',
    ['<p>The map of matter: the periodic table and its gaps, the germ-killing chemist, the nucleus '
      + 'in the gold foil, the overthrow of phlogiston, and the safety lamp.</p>'],
    B, [R.physics, R.life]),

  ring(R.life[0], 'THE LIFE AND EVOLUTION RING', 'The Life &amp; Evolution Ring', 'sci-life',
    ['<p>Descent with modification: the finches and the Origin, the pea plants, the web of life on '
      + 'Chimborazo, the binomial names, the Wallace Line, and the book of 1859.</p>'],
    C, [R.matter, R.medicine]),

  ring(R.medicine[0], 'THE MEDICINE AND THE BODY RING', 'The Medicine &amp; the Body Ring', 'sci-medicine',
    ['<p>The fight with disease: the cowpox and the vaccine, the carbolic spray, the Broad Street '
      + 'pump, the circulation of the blood, the lady with the lamp, and the germ theory.</p>'],
    D, [R.life, R.women]),

  ring(R.women[0], 'THE WOMEN OF SCIENCE RING', 'The Women of Science Ring', 'sci-women',
    ['<p>The scientists left off the medal: two Nobels and the radium, the fission she explained, '
      + 'Photo 51, the hydrogen in the stars, the jumping genes, and the shape of insulin.</p>'],
    E, [R.medicine, R.institutions]),

  ring(R.institutions[0], 'THE LABORATORY AND INSTITUTION RING', 'The Laboratory &amp; Institution Ring', 'sci-institutions',
    ['<p>Where the work was held: the Royal Society and its motto, the research bench, the method '
      + 'itself, the prize and its omissions, the journal and the referee, and the museum.</p>'],
    F, [R.physics, R.women]),
];
