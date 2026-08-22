// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE POLITICAL-ECONOMY WEBRINGS.
//
// The master ring is political-economy-ring, which every page joins. Under it run
// six strands: the classicals, Marx and the critique, the marginalists, Keynes and
// the cycle, the Austrians, and the heterodox. Names cross the strands on purpose:
// Ricardo answers to both the classicals and Marx, Sraffa to both Marx and Keynes,
// Myrdal to both the counter-revolution and the heterodox.

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
    'the ringmaster is balancing the books. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['political-economy-ring.geocities.ws', 'Political Economy Ring'],
  classical: ['classical-economics-ring.geocities.ws', 'Classical Economics Ring'],
  marx: ['marxian-economics-ring.geocities.ws', 'Marxian Economics Ring'],
  marginal: ['marginalist-ring.geocities.ws', 'The Marginalist Ring'],
  keynes: ['keynesian-economics-ring.geocities.ws', 'Keynesian Economics Ring'],
  austrian: ['austrian-economics-ring.geocities.ws', 'Austrian Economics Ring'],
  heterodox: ['heterodox-economics-ring.geocities.ws', 'Heterodox Economics Ring'],
};

const A = [['adam-smith.geocities.ws', 'Adam Smith'], ['david-ricardo.geocities.ws', 'David Ricardo'],
  ['thomas-malthus.geocities.ws', 'Thomas Malthus'], ['jean-baptiste-say.geocities.ws', 'Jean-Baptiste Say'],
  ['the-physiocrats.geocities.ws', 'The Physiocrats'], ['js-mill-economics.geocities.ws', 'J. S. Mill']];
const B = [['karl-marx-capital.geocities.ws', 'Karl Marx, Capital'], ['friedrich-engels-economics.geocities.ws', 'Friedrich Engels'],
  ['luxemburg-accumulation.geocities.ws', 'Rosa Luxemburg'], ['rudolf-hilferding.geocities.ws', 'Rudolf Hilferding'],
  ['michal-kalecki.geocities.ws', 'Michal Kalecki'], ['piero-sraffa.geocities.ws', 'Piero Sraffa']];
const C = [['alfred-marshall.geocities.ws', 'Alfred Marshall'], ['stanley-jevons.geocities.ws', 'W. S. Jevons'],
  ['carl-menger.geocities.ws', 'Carl Menger'], ['leon-walras.geocities.ws', 'Leon Walras'],
  ['vilfredo-pareto.geocities.ws', 'Vilfredo Pareto'], ['arthur-pigou.geocities.ws', 'A. C. Pigou']];
const D = [['maynard-keynes.geocities.ws', 'J. M. Keynes'], ['joan-robinson.geocities.ws', 'Joan Robinson'],
  ['hyman-minsky.geocities.ws', 'Hyman Minsky'], ['irving-fisher.geocities.ws', 'Irving Fisher'],
  ['wassily-leontief.geocities.ws', 'Wassily Leontief'], ['nicholas-kaldor.geocities.ws', 'Nicholas Kaldor']];
const E = [['friedrich-hayek.geocities.ws', 'Friedrich Hayek'], ['von-mises.geocities.ws', 'Ludwig von Mises'],
  ['joseph-schumpeter.geocities.ws', 'Joseph Schumpeter'], ['milton-friedman.geocities.ws', 'Milton Friedman'],
  ['ronald-coase.geocities.ws', 'Ronald Coase']];
const F = [['thorstein-veblen.geocities.ws', 'Thorstein Veblen'], ['karl-polanyi.geocities.ws', 'Karl Polanyi'],
  ['jk-galbraith.geocities.ws', 'J. K. Galbraith'], ['albert-hirschman.geocities.ws', 'Albert Hirschman'],
  ['georgescu-roegen.geocities.ws', 'Georgescu-Roegen'], ['gunnar-myrdal.geocities.ws', 'Gunnar Myrdal']];

export const PE_RINGS = [
  ring(R.master[0], 'POLITICAL ECONOMY RING', 'Political Economy Ring', 'pe-classical',
    ['<p>Two hundred years of the argument about how a society makes its living and who '
      + 'gets what: the classicals, Marx, the marginalists, Keynes and the cycle, the '
      + 'Austrians, and the heterodox who would not settle down.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.classical, R.marx, R.marginal, R.keynes, R.austrian, R.heterodox]),

  ring(R.classical[0], 'CLASSICAL ECONOMICS RING', 'Classical Economics Ring', 'pe-classical',
    ['<p>The founders: the division of labour, the labour theory of value, rent and '
      + 'population, and the market read as a natural order.</p>'],
    A, [R.marx, R.marginal]),

  ring(R.marx[0], 'MARXIAN ECONOMICS RING', 'Marxian Economics Ring', 'pe-marx',
    ['<p>The critique of political economy: surplus value and the commodity, accumulation '
      + 'and crisis, finance capital, and the long quarrel over how value becomes price.</p>'],
    B, [R.classical, R.keynes]),

  ring(R.marginal[0], 'THE MARGINALIST RING', 'The Marginalist Ring', 'pe-marginal',
    ['<p>The revolution of 1871: value at the margin, supply and demand as scissors, general '
      + 'equilibrium, and the welfare economics built on top.</p>'],
    C, [R.classical, R.austrian]),

  ring(R.keynes[0], 'KEYNESIAN ECONOMICS RING', 'Keynesian Economics Ring', 'pe-macro',
    ['<p>Demand, money and the cycle: the multiplier and liquidity preference, imperfect '
      + 'competition, financial instability, and the economics of the whole rather than the '
      + 'firm.</p>'],
    D, [R.marx, R.heterodox]),

  ring(R.austrian[0], 'AUSTRIAN ECONOMICS RING', 'Austrian Economics Ring', 'pe-austrian',
    ['<p>Markets and the counter-revolution: the knowledge problem and spontaneous order, '
      + 'the calculation debate, creative destruction, and the monetarist return.</p>'],
    E, [R.marginal, R.heterodox]),

  ring(R.heterodox[0], 'HETERODOX ECONOMICS RING', 'Heterodox Economics Ring', 'pe-heterodox',
    ['<p>The ones who would not fit: conspicuous consumption and the institution, the '
      + 'embedded market, countervailing power, entropy and the economy, and cumulative '
      + 'causation.</p>'],
    F, [R.keynes, R.austrian]),
];
