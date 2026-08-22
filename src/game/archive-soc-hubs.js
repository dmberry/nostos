// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE SOCIALISM WEBRINGS.
//
// The master ring is socialism-ring, which every page joins. Under it run six
// strands: the utopians and cooperators, Marx and scientific socialism, the
// anarchists, the social democrats, the revolutionaries, and the English and
// guild socialists.

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
    'the ringmaster is at the branch meeting. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['socialism-ring.geocities.ws', 'Socialism Ring'],
  utopian: ['utopian-socialism-ring.geocities.ws', 'Utopian &amp; Cooperative Ring'],
  marxian: ['marxian-socialism-ring.geocities.ws', 'Scientific Socialism Ring'],
  anarchist: ['anarchism-ring.geocities.ws', 'Anarchism Ring'],
  socialdem: ['social-democracy-ring.geocities.ws', 'Social Democracy Ring'],
  revolutionary: ['revolutionary-socialism-ring.geocities.ws', 'Revolutionary Socialism Ring'],
  english: ['english-socialism-ring.geocities.ws', 'English &amp; Guild Socialism Ring'],
};

const A = [['robert-owen.geocities.ws', 'Robert Owen'], ['henri-saint-simon.geocities.ws', 'Henri de Saint-Simon'],
  ['charles-fourier.geocities.ws', 'Charles Fourier'], ['etienne-cabet.geocities.ws', 'Etienne Cabet'],
  ['the-cooperative-movement.geocities.ws', 'The Cooperative Movement'], ['new-harmony.geocities.ws', 'New Harmony']];
const B = [['karl-marx-socialism.geocities.ws', 'Karl Marx'], ['friedrich-engels-socialism.geocities.ws', 'Friedrich Engels'],
  ['the-communist-manifesto.geocities.ws', 'The Communist Manifesto'], ['the-first-international.geocities.ws', 'The First International'],
  ['the-paris-commune.geocities.ws', 'The Paris Commune'], ['karl-kautsky.geocities.ws', 'Karl Kautsky']];
const C = [['mikhail-bakunin.geocities.ws', 'Mikhail Bakunin'], ['peter-kropotkin.geocities.ws', 'Peter Kropotkin'],
  ['pierre-joseph-proudhon.geocities.ws', 'Pierre-Joseph Proudhon'], ['emma-goldman.geocities.ws', 'Emma Goldman'],
  ['errico-malatesta.geocities.ws', 'Errico Malatesta'], ['the-iww.geocities.ws', 'The IWW']];
const D = [['eduard-bernstein.geocities.ws', 'Eduard Bernstein'], ['jean-jaures.geocities.ws', 'Jean Jaures'],
  ['the-spd.geocities.ws', 'The SPD'], ['the-fabian-society.geocities.ws', 'The Fabian Society'],
  ['keir-hardie.geocities.ws', 'Keir Hardie'], ['the-second-international.geocities.ws', 'The Second International']];
const E = [['rosa-luxemburg-socialism.geocities.ws', 'Rosa Luxemburg'], ['antonio-gramsci.geocities.ws', 'Antonio Gramsci'],
  ['the-third-international.geocities.ws', 'The Third International'], ['karl-liebknecht.geocities.ws', 'Karl Liebknecht'],
  ['clara-zetkin.geocities.ws', 'Clara Zetkin'], ['the-spartacus-league.geocities.ws', 'The Spartacus League']];
const F = [['william-morris.geocities.ws', 'William Morris'], ['robert-tressell.geocities.ws', 'Robert Tressell'],
  ['the-chartists.geocities.ws', 'The Chartists'], ['gdh-cole.geocities.ws', 'G. D. H. Cole'],
  ['rh-tawney.geocities.ws', 'R. H. Tawney'], ['eugene-debs.geocities.ws', 'Eugene Debs']];

export const SOC_RINGS = [
  ring(R.master[0], 'SOCIALISM RING', 'Socialism Ring', 'soc-marxian',
    ['<p>Two centuries of the argument about how a society should own and share what it makes: '
      + 'the utopians and cooperators, Marx and the scientific socialists, the anarchists, the '
      + 'social democrats, the revolutionaries, and the English and guild socialists.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.utopian, R.marxian, R.anarchist, R.socialdem, R.revolutionary, R.english]),

  ring(R.utopian[0], 'UTOPIAN AND COOPERATIVE RING', 'Utopian &amp; Cooperative Ring', 'soc-utopian',
    ['<p>The socialism of the model community and the store: New Lanark and New Harmony, the '
      + 'phalanstery, Icaria, and the Rochdale Pioneers.</p>'],
    A, [R.marxian, R.english]),

  ring(R.marxian[0], 'SCIENTIFIC SOCIALISM RING', 'Scientific Socialism Ring', 'soc-marxian',
    ['<p>Marx, Engels and the tradition they founded: the Manifesto, historical materialism, '
      + 'the First International, the Commune, and orthodox Marxism.</p>'],
    B, [R.utopian, R.revolutionary]),

  ring(R.anarchist[0], 'ANARCHISM RING', 'Anarchism Ring', 'soc-anarchist',
    ['<p>Socialism without the state: collectivism and mutual aid, "property is theft", '
      + 'anarchist feminism, and one big union.</p>'],
    C, [R.marxian, R.english]),

  ring(R.socialdem[0], 'SOCIAL DEMOCRACY RING', 'Social Democracy Ring', 'soc-socialdem',
    ['<p>The parliamentary road: revisionism, the mass party, the Fabian gradualists, the '
      + 'Labour Party, and the Internationals that voted for war.</p>'],
    D, [R.revolutionary, R.english]),

  ring(R.revolutionary[0], 'REVOLUTIONARY SOCIALISM RING', 'Revolutionary Socialism Ring', 'soc-revolutionary',
    ['<p>Reform or revolution: the mass strike, hegemony and the war of position, the Comintern, '
      + 'and the Spartacus League crushed in the Berlin winter.</p>'],
    E, [R.marxian, R.socialdem]),

  ring(R.english[0], 'ENGLISH AND GUILD SOCIALISM RING', 'English &amp; Guild Socialism Ring', 'soc-english',
    ['<p>The English road and its cousins: News from Nowhere and the Arts and Crafts, the '
      + 'ragged-trousered philanthropists, the People’s Charter, guild socialism, and Debs.</p>'],
    F, [R.utopian, R.socialdem]),
];
