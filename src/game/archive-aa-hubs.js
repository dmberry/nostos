// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE ANTICOLONIAL & POSTCOLONIAL WEBRINGS.
//
// The master ring is anticolonial-ring, which every page joins. Under it run six
// strands: Negritude and Francophone anticolonial thought, African liberation,
// African letters, Indian thought, East Asian philosophy, and postcolonial theory.

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
    'the ringmaster is reading late. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['anticolonial-ring.geocities.ws', 'Anticolonial &amp; Postcolonial Ring'],
  negritude: ['negritude-ring.geocities.ws', 'The Negritude Ring'],
  africa: ['african-liberation-ring.geocities.ws', 'African Liberation Ring'],
  letters: ['african-letters-ring.geocities.ws', 'African Letters Ring'],
  india: ['indian-thought-ring.geocities.ws', 'Indian Thought Ring'],
  eastasia: ['east-asian-philosophy-ring.geocities.ws', 'East Asian Philosophy Ring'],
  postcolonial: ['postcolonial-theory-ring.geocities.ws', 'Postcolonial Theory Ring'],
};

const A = [['aime-cesaire.geocities.ws', 'Aime Cesaire'], ['leopold-senghor.geocities.ws', 'Leopold Senghor'],
  ['frantz-fanon.geocities.ws', 'Frantz Fanon'], ['albert-memmi.geocities.ws', 'Albert Memmi'],
  ['edouard-glissant.geocities.ws', 'Edouard Glissant'], ['leon-damas.geocities.ws', 'Leon Damas']];
const B = [['kwame-nkrumah.geocities.ws', 'Kwame Nkrumah'], ['amilcar-cabral.geocities.ws', 'Amilcar Cabral'],
  ['julius-nyerere.geocities.ws', 'Julius Nyerere'], ['steve-biko.geocities.ws', 'Steve Biko'],
  ['cheikh-anta-diop.geocities.ws', 'Cheikh Anta Diop'], ['walter-rodney.geocities.ws', 'Walter Rodney']];
const C = [['chinua-achebe.geocities.ws', 'Chinua Achebe'], ['ngugi-wa-thiongo.geocities.ws', 'Ngugi wa Thiong’o'],
  ['wole-soyinka.geocities.ws', 'Wole Soyinka'], ['ama-ata-aidoo.geocities.ws', 'Ama Ata Aidoo'],
  ['bessie-head.geocities.ws', 'Bessie Head'], ['tsitsi-dangarembga.geocities.ws', 'Tsitsi Dangarembga']];
const D = [['rabindranath-tagore.geocities.ws', 'Rabindranath Tagore'], ['mohandas-gandhi.geocities.ws', 'Mohandas Gandhi'],
  ['br-ambedkar.geocities.ws', 'B. R. Ambedkar'], ['sri-aurobindo.geocities.ws', 'Sri Aurobindo'],
  ['muhammad-iqbal.geocities.ws', 'Muhammad Iqbal'], ['partha-chatterjee.geocities.ws', 'Partha Chatterjee']];
const E = [['nishida-kitaro.geocities.ws', 'Nishida Kitaro'], ['dt-suzuki.geocities.ws', 'D. T. Suzuki'],
  ['watsuji-tetsuro.geocities.ws', 'Watsuji Tetsuro'], ['lu-xun.geocities.ws', 'Lu Xun'],
  ['feng-youlan.geocities.ws', 'Feng Youlan'], ['kang-youwei.geocities.ws', 'Kang Youwei']];
const F = [['edward-said.geocities.ws', 'Edward Said'], ['ranajit-guha.geocities.ws', 'Ranajit Guha'],
  ['gayatri-spivak.geocities.ws', 'Gayatri Spivak'], ['homi-bhabha.geocities.ws', 'Homi Bhabha'],
  ['ashis-nandy.geocities.ws', 'Ashis Nandy'], ['ali-shariati.geocities.ws', 'Ali Shariati']];

export const AA_RINGS = [
  ring(R.master[0], 'ANTICOLONIAL AND POSTCOLONIAL RING', 'Anticolonial &amp; Postcolonial Ring', 'aa-negritude',
    ['<p>The thinkers and writers of Africa and Asia in the century of decolonisation: '
      + 'Negritude and liberation, the novel and the poem, Indian and East Asian thought, and '
      + 'the theory that read the empire back to itself.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.negritude, R.africa, R.letters, R.india, R.eastasia, R.postcolonial]),

  ring(R.negritude[0], 'THE NEGRITUDE RING', 'The Negritude Ring', 'aa-negritude',
    ['<p>Negritude and the Francophone refusal: the return to the native land, colonisation '
      + 'named as thingification, the psychiatry of the colonised, and creolisation.</p>'],
    A, [R.africa, R.postcolonial]),

  ring(R.africa[0], 'AFRICAN LIBERATION RING', 'African Liberation Ring', 'aa-africa',
    ['<p>The thought of African liberation: consciencism and pan-Africanism, national '
      + 'liberation and culture, Ujamaa, Black Consciousness, and the underdevelopment of a '
      + 'continent.</p>'],
    B, [R.negritude, R.letters]),

  ring(R.letters[0], 'AFRICAN LETTERS RING', 'African Letters Ring', 'aa-letters',
    ['<p>The African novel and its answer to empire: things falling apart, the mind '
      + 'decolonised, the king’s horseman, and the nervous conditions of the colonised.</p>'],
    C, [R.africa, R.postcolonial]),

  ring(R.india[0], 'INDIAN THOUGHT RING', 'Indian Thought Ring', 'aa-india',
    ['<p>The Indian nineteenth and twentieth centuries: the poet of Gitanjali, satyagraha, the '
      + 'annihilation of caste, integral yoga, and the subaltern.</p>'],
    D, [R.eastasia, R.postcolonial]),

  ring(R.eastasia[0], 'EAST ASIAN PHILOSOPHY RING', 'East Asian Philosophy Ring', 'aa-eastasia',
    ['<p>The Kyoto School and modern East Asian thought: pure experience and absolute '
      + 'nothingness, Zen carried west, the ethics of betweenness, and modern Chinese letters '
      + 'and reform.</p>'],
    E, [R.india, R.postcolonial]),

  ring(R.postcolonial[0], 'POSTCOLONIAL THEORY RING', 'Postcolonial Theory Ring', 'aa-postcolonial',
    ['<p>The theory that read the empire: orientalism, the subaltern, hybridity and the third '
      + 'space, the intimate enemy, and the sociology of a revolution.</p>'],
    F, [R.negritude, R.india]),
];
