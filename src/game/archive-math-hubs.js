// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE MATHEMATICIANS WEBRINGS.
//
// The master ring is mathematicians-ring, which every page joins. Under it run
// six strands: antiquity and geometry, the calculus, the nineteenth century, the
// foundations, the twentieth century, and the singular outsiders.

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
    'the ringmaster is checking a proof. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['mathematicians-ring.geocities.ws', 'Mathematicians Ring'],
  antiquity: ['ancient-mathematics-ring.geocities.ws', 'Ancient Mathematics Ring'],
  analysis: ['the-calculus-ring.geocities.ws', 'The Calculus Ring'],
  c19: ['nineteenth-century-maths-ring.geocities.ws', 'The Nineteenth-Century Ring'],
  foundations: ['foundations-of-maths-ring.geocities.ws', 'The Foundations Ring'],
  modern: ['twentieth-century-maths-ring.geocities.ws', 'The Twentieth-Century Ring'],
  heterodox: ['singular-mathematicians-ring.geocities.ws', 'The Singular Figures Ring'],
};

const A = [['euclid.geocities.ws', 'Euclid'], ['archimedes.geocities.ws', 'Archimedes'],
  ['pythagoras.geocities.ws', 'Pythagoras'], ['hypatia.geocities.ws', 'Hypatia'],
  ['diophantus.geocities.ws', 'Diophantus'], ['al-khwarizmi.geocities.ws', 'al-Khwarizmi']];
const B = [['isaac-newton.geocities.ws', 'Isaac Newton'], ['leibniz-calculus.geocities.ws', 'Leibniz (the calculus)'],
  ['leonhard-euler.geocities.ws', 'Leonhard Euler'], ['pierre-fermat.geocities.ws', 'Pierre de Fermat'],
  ['the-bernoullis.geocities.ws', 'The Bernoullis'], ['joseph-lagrange.geocities.ws', 'Joseph-Louis Lagrange']];
const C = [['carl-gauss.geocities.ws', 'Carl Friedrich Gauss'], ['bernhard-riemann.geocities.ws', 'Bernhard Riemann'],
  ['evariste-galois.geocities.ws', 'Evariste Galois'], ['niels-abel.geocities.ws', 'Niels Henrik Abel'],
  ['augustin-cauchy.geocities.ws', 'Augustin-Louis Cauchy'], ['karl-weierstrass.geocities.ws', 'Karl Weierstrass']];
const D = [['georg-cantor.geocities.ws', 'Georg Cantor'], ['godel-incompleteness.geocities.ws', 'Kurt Godel'],
  ['david-hilbert.geocities.ws', 'David Hilbert'], ['luitzen-brouwer.geocities.ws', 'L. E. J. Brouwer'],
  ['giuseppe-peano.geocities.ws', 'Giuseppe Peano'], ['alfred-tarski.geocities.ws', 'Alfred Tarski']];
const E = [['srinivasa-ramanujan.geocities.ws', 'Srinivasa Ramanujan'], ['emmy-noether.geocities.ws', 'Emmy Noether'],
  ['computable-numbers.geocities.ws', 'Alan Turing (the mathematician)'], ['von-neumann-mathematics.geocities.ws', 'John von Neumann'],
  ['andrey-kolmogorov.geocities.ws', 'Andrey Kolmogorov'], ['alexander-grothendieck.geocities.ws', 'Alexander Grothendieck']];
const F = [['paul-erdos.geocities.ws', 'Paul Erdos'], ['benoit-mandelbrot.geocities.ws', 'Benoit Mandelbrot'],
  ['john-nash.geocities.ws', 'John Nash'], ['henri-poincare.geocities.ws', 'Henri Poincare'],
  ['sofia-kovalevskaya.geocities.ws', 'Sofia Kovalevskaya'], ['george-boole.geocities.ws', 'George Boole']];

export const MATH_RINGS = [
  ring(R.master[0], 'MATHEMATICIANS RING', 'Mathematicians Ring', 'math-antiquity',
    ['<p>From the axioms of Euclid to the fractals of Mandelbrot: the people who found the '
      + 'patterns and proved them, and the outsiders the field ignored until it could not.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.antiquity, R.analysis, R.c19, R.foundations, R.modern, R.heterodox]),

  ring(R.antiquity[0], 'ANCIENT MATHEMATICS RING', 'Ancient Mathematics Ring', 'math-antiquity',
    ['<p>The first proofs: the axiomatic method, the method of exhaustion, the theorem and '
      + 'the cult, and the algebra that came out of Baghdad.</p>'],
    A, [R.analysis, R.foundations]),

  ring(R.analysis[0], 'THE CALCULUS RING', 'The Calculus Ring', 'math-analysis',
    ['<p>The invention of the calculus and the century it opened: fluxions and dx, e and the '
      + 'bridges of Konigsberg, the last theorem and the calculus of variations.</p>'],
    B, [R.antiquity, R.c19]),

  ring(R.c19[0], 'THE NINETEENTH-CENTURY RING', 'The Nineteenth-Century Ring', 'math-19c',
    ['<p>Rigour and revolution: the prince of mathematicians, the geometry Einstein would '
      + 'need, group theory written the night before a duel, and the quintic proved '
      + 'impossible.</p>'],
    C, [R.analysis, R.foundations]),

  ring(R.foundations[0], 'THE FOUNDATIONS RING', 'The Foundations Ring', 'math-foundations',
    ['<p>What can be proved, and what cannot: the transfinite, the incompleteness theorems, '
      + 'the 23 problems, intuitionism, and the definition of truth itself.</p>'],
    D, [R.c19, R.modern]),

  ring(R.modern[0], 'THE TWENTIETH-CENTURY RING', 'The Twentieth-Century Ring', 'math-modern',
    ['<p>The modern century: the notebooks from Madras, the theorem of symmetry, the '
      + 'universal machine, game theory, probability made rigorous, and the rebuilding of '
      + 'geometry.</p>'],
    E, [R.foundations, R.heterodox]),

  ring(R.heterodox[0], 'THE SINGULAR FIGURES RING', 'The Singular Figures Ring', 'math-heterodox',
    ['<p>The ones who did not fit: the wanderer with no home, the fractal between disciplines, '
      + 'the troubled equilibrium, the last universalist, the first woman with a chair, and the '
      + 'schoolmaster whose logic runs every machine.</p>'],
    F, [R.modern, R.c19]),
];
