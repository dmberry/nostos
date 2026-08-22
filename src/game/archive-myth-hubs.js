// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE MYTHOLOGY WEBRINGS.
//
// The master ring is mythology-ring, which every page joins. Under it run six
// strands: Greek and Roman, Norse and Celtic, Egyptian and Mesopotamian, Asian
// and African, the Americas and Oceania, and the study of myth.

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
    'the ringmaster is retelling an old story. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['mythology-ring.geocities.ws', 'Mythology Ring'],
  greek: ['greek-and-roman-myth-ring.geocities.ws', 'The Greek &amp; Roman Ring'],
  norse: ['norse-and-celtic-myth-ring.geocities.ws', 'The Norse &amp; Celtic Ring'],
  egypt: ['egypt-and-mesopotamia-myth-ring.geocities.ws', 'The Egyptian &amp; Mesopotamian Ring'],
  asiaafrica: ['asian-and-african-myth-ring.geocities.ws', 'The Asian &amp; African Ring'],
  americas: ['americas-and-oceania-myth-ring.geocities.ws', 'The Americas &amp; Oceania Ring'],
  study: ['study-of-myth-ring.geocities.ws', 'The Study of Myth Ring'],
};

const A = [['zeus.geocities.ws', 'Zeus'], ['the-greek-gods.geocities.ws', 'The Greek Gods'],
  ['the-trojan-war.geocities.ws', 'The Trojan War'], ['the-labours-of-heracles.geocities.ws', 'The Labours of Heracles'],
  ['the-underworld.geocities.ws', 'The Underworld'], ['the-roman-myths.geocities.ws', 'The Roman Myths']];
const B = [['odin.geocities.ws', 'Odin'], ['the-norse-gods.geocities.ws', 'The Norse Gods'],
  ['ragnarok.geocities.ws', 'Ragnarök'], ['the-celtic-myths.geocities.ws', 'The Celtic Myths'],
  ['cu-chulainn.geocities.ws', 'Cú Chulainn'], ['the-mabinogion.geocities.ws', 'The Mabinogion']];
const C = [['the-epic-of-gilgamesh.geocities.ws', 'The Epic of Gilgamesh'], ['the-egyptian-gods.geocities.ws', 'The Egyptian Gods'],
  ['osiris.geocities.ws', 'Osiris'], ['the-book-of-the-dead.geocities.ws', 'The Book of the Dead'],
  ['ishtar.geocities.ws', 'Ishtar'], ['the-mesopotamian-myths.geocities.ws', 'The Mesopotamian Myths']];
const D = [['the-ramayana.geocities.ws', 'The Ramayana'], ['the-hindu-epics.geocities.ws', 'The Hindu Epics'],
  ['journey-to-the-west.geocities.ws', 'Journey to the West'], ['the-japanese-kami.geocities.ws', 'The Japanese Kami'],
  ['anansi.geocities.ws', 'Anansi'], ['the-african-myths.geocities.ws', 'The African Myths']];
const E = [['quetzalcoatl.geocities.ws', 'Quetzalcoatl'], ['the-maya-myths.geocities.ws', 'The Maya Myths'],
  ['the-dreamtime.geocities.ws', 'The Dreamtime'], ['the-polynesian-myths.geocities.ws', 'The Polynesian Myths'],
  ['the-inca-myths.geocities.ws', 'The Inca Myths'], ['coyote-the-trickster.geocities.ws', 'Coyote the Trickster']];
const F = [['the-hero-with-a-thousand-faces.geocities.ws', 'The Hero with a Thousand Faces'], ['the-golden-bough.geocities.ws', 'The Golden Bough'],
  ['the-trickster.geocities.ws', 'The Trickster'], ['the-creation-myth.geocities.ws', 'The Creation Myth'],
  ['the-flood-myth.geocities.ws', 'The Flood Myth'], ['the-fairy-tale.geocities.ws', 'The Fairy Tale']];

export const MYTH_RINGS = [
  ring(R.master[0], 'MYTHOLOGY RING', 'Mythology Ring', 'myth-greek',
    ['<p>The old stories the world told itself: the Greek and Roman pantheon, the Norse and Celtic, the '
      + 'Egyptian and Mesopotamian, the great traditions of Asia and Africa, the myths of the Americas '
      + 'and Oceania, and the scholars who tried to explain them all.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.greek, R.norse, R.egypt, R.asiaafrica, R.americas, R.study]),

  ring(R.greek[0], 'THE GREEK AND ROMAN RING', 'The Greek &amp; Roman Ring', 'myth-greek',
    ['<p>Olympus and the forum: the thunderbolt king, the twelve on the mountain, the war for Helen, the '
      + 'twelve labours, the realm of Hades, and the gods in their Roman names.</p>'],
    A, [R.norse, R.study]),

  ring(R.norse[0], 'THE NORSE AND CELTIC RING', 'The Norse &amp; Celtic Ring', 'myth-norse',
    ['<p>The North and the isles: the one-eyed Allfather, the Aesir and the hammer, the twilight of the '
      + 'gods, the Otherworld, the hound of Ulster, and the four Welsh branches.</p>'],
    B, [R.greek, R.egypt]),

  ring(R.egypt[0], 'THE EGYPTIAN AND MESOPOTAMIAN RING', 'The Egyptian &amp; Mesopotamian Ring', 'myth-egypt',
    ['<p>The first cities and the first stories: the oldest epic, the sun that voyages, the murdered and '
      + 'risen lord, the weighing of the heart, the queen of heaven, and the cuneiform gods.</p>'],
    C, [R.norse, R.asiaafrica]),

  ring(R.asiaafrica[0], 'THE ASIAN AND AFRICAN RING', 'The Asian &amp; African Ring', 'myth-asia-africa',
    ['<p>The living epics and the oral tales: the exile of Rama, the great Hindu scriptures, the pilgrim '
      + 'monkey, the kami of the islands, the spider who keeps the stories, and the traditions of the '
      + 'continent.</p>'],
    D, [R.egypt, R.americas]),

  ring(R.americas[0], 'THE AMERICAS AND OCEANIA RING', 'The Americas &amp; Oceania Ring', 'myth-americas',
    ['<p>The feathered serpent and the songline: the wind and morning-star god, the hero twins of the '
      + 'Popol Vuh, the Dreaming, the demigod who fished up islands, the Andean creator, and the '
      + 'trickster Coyote.</p>'],
    E, [R.asiaafrica, R.study]),

  ring(R.study[0], 'THE STUDY OF MYTH RING', 'The Study of Myth Ring', 'myth-study',
    ['<p>The scholars and the patterns: the hero with a thousand faces, the golden bough, the trickster '
      + 'archetype, the creation and the flood as types, and the collected fairy tale.</p>'],
    F, [R.greek, R.americas]),
];
