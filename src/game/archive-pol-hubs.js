// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE STATESPEOPLE WEBRINGS.
//
// The master ring is statesmen-ring, which every page joins. Under it run six
// strands: founders and revolutions, nineteenth-century statecraft, the parties
// and campaigns, decolonisation and independence, the Cold War, and the orators
// and reformers.

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
    'the ringmaster is counting the vote. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['statesmen-ring.geocities.ws', 'Statespeople Ring'],
  founders: ['founders-and-revolutions-ring.geocities.ws', 'Founders &amp; Revolutions Ring'],
  statecraft: ['statecraft-ring.geocities.ws', 'Nineteenth-Century Statecraft Ring'],
  parties: ['parties-and-campaigns-ring.geocities.ws', 'Parties &amp; Campaigns Ring'],
  independence: ['independence-ring.geocities.ws', 'Decolonisation &amp; Independence Ring'],
  coldwar: ['cold-war-leaders-ring.geocities.ws', 'The Cold War Ring'],
  reformers: ['orators-and-reformers-ring.geocities.ws', 'Orators &amp; Reformers Ring'],
};

const A = [['george-washington.geocities.ws', 'George Washington'], ['thomas-jefferson.geocities.ws', 'Thomas Jefferson'],
  ['abraham-lincoln.geocities.ws', 'Abraham Lincoln'], ['simon-bolivar.geocities.ws', 'Simon Bolivar'],
  ['toussaint-louverture.geocities.ws', 'Toussaint Louverture'], ['the-declaration-of-independence.geocities.ws', 'The Declaration of Independence']];
const B = [['otto-von-bismarck.geocities.ws', 'Otto von Bismarck'], ['klemens-von-metternich.geocities.ws', 'Klemens von Metternich'],
  ['talleyrand.geocities.ws', 'Talleyrand'], ['william-gladstone.geocities.ws', 'William Gladstone'],
  ['benjamin-disraeli.geocities.ws', 'Benjamin Disraeli'], ['the-congress-of-vienna.geocities.ws', 'The Congress of Vienna']];
const C = [['emmeline-pankhurst.geocities.ws', 'Emmeline Pankhurst'], ['the-suffragettes.geocities.ws', 'The Suffragettes'],
  ['the-labour-party.geocities.ws', 'The Labour Party'], ['the-indian-national-congress.geocities.ws', 'The Indian National Congress'],
  ['william-wilberforce.geocities.ws', 'William Wilberforce'], ['the-anti-corn-law-league.geocities.ws', 'The Anti-Corn-Law League']];
const D = [['nelson-mandela.geocities.ws', 'Nelson Mandela'], ['jawaharlal-nehru.geocities.ws', 'Jawaharlal Nehru'],
  ['sukarno.geocities.ws', 'Sukarno'], ['kemal-ataturk.geocities.ws', 'Mustafa Kemal Ataturk'],
  ['david-ben-gurion.geocities.ws', 'David Ben-Gurion'], ['eamon-de-valera.geocities.ws', 'Eamon de Valera']];
const E = [['winston-churchill.geocities.ws', 'Winston Churchill'], ['franklin-roosevelt.geocities.ws', 'Franklin Roosevelt'],
  ['charles-de-gaulle.geocities.ws', 'Charles de Gaulle'], ['konrad-adenauer.geocities.ws', 'Konrad Adenauer'],
  ['olof-palme.geocities.ws', 'Olof Palme'], ['salvador-allende.geocities.ws', 'Salvador Allende']];
const F = [['martin-luther-king.geocities.ws', 'Martin Luther King'], ['frederick-douglass.geocities.ws', 'Frederick Douglass'],
  ['golda-meir.geocities.ws', 'Golda Meir'], ['indira-gandhi.geocities.ws', 'Indira Gandhi'],
  ['lech-walesa.geocities.ws', 'Lech Walesa'], ['jose-marti.geocities.ws', 'Jose Marti']];

export const POL_RINGS = [
  ring(R.master[0], 'STATESPEOPLE RING', 'Statespeople Ring', 'pol-founders',
    ['<p>Three centuries of the people who took and held power and the movements that '
      + 'pushed them: the founders and revolutionaries, the statecraft of the old order, the '
      + 'parties and campaigns, the leaders of independence, the Cold War, and the orators and '
      + 'reformers.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.founders, R.statecraft, R.parties, R.independence, R.coldwar, R.reformers]),

  ring(R.founders[0], 'FOUNDERS AND REVOLUTIONS RING', 'Founders &amp; Revolutions Ring', 'pol-founders',
    ['<p>The making of new states: the American founding and its contradictions, the Latin '
      + 'American liberation, and the only slave revolt to found a nation.</p>'],
    A, [R.statecraft, R.independence]),

  ring(R.statecraft[0], 'NINETEENTH-CENTURY STATECRAFT RING', 'Nineteenth-Century Statecraft Ring', 'pol-statecraft',
    ['<p>The old order and its masters: blood and iron, the balance of power, the survivor of '
      + 'every regime, and the great Victorian rivalry.</p>'],
    B, [R.founders, R.parties]),

  ring(R.parties[0], 'PARTIES AND CAMPAIGNS RING', 'Parties &amp; Campaigns Ring', 'pol-parties',
    ['<p>Politics as organisation: the suffrage militants, the party of labour, the party of '
      + 'independence, the abolitionists, and the pressure group that invented itself.</p>'],
    C, [R.statecraft, R.reformers]),

  ring(R.independence[0], 'DECOLONISATION AND INDEPENDENCE RING', 'Decolonisation &amp; Independence Ring', 'pol-independence',
    ['<p>The leaders of the new nations: the long walk from prison to the presidency, the '
      + 'non-aligned, the founders of republics, and the shadow over a young state.</p>'],
    D, [R.founders, R.coldwar]),

  ring(R.coldwar[0], 'THE COLD WAR RING', 'The Cold War Ring', 'pol-coldwar',
    ['<p>The mid-century and the long stand-off: the wartime leaders, the New Deal, the Fifth '
      + 'Republic, the model welfare state, and the road to the Chilean coup.</p>'],
    E, [R.independence, R.reformers]),

  ring(R.reformers[0], 'ORATORS AND REFORMERS RING', 'Orators &amp; Reformers Ring', 'pol-reformers',
    ['<p>The voices that moved the crowd: the dream at the March, the greatest abolition orator, '
      + 'the women who led their nations, the shipyard electrician, and the apostle of Cuba.</p>'],
    F, [R.parties, R.coldwar]),
];
