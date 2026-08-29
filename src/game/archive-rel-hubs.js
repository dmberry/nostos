// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE RELIGION RINGS.
//
// Two, because the pages fall into two jobs. One ring is about how texts were
// carried and copied, which puts it next to the cryptography and language webs
// rather than next to anything devotional. The other is about the splits.
//
// The sister links reach into thinkers and language on purpose. A reader who
// arrives at the isnad from the cryptography side should be able to get to
// Avicenna without going back through a search box.

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
    ...(sisters ? ['<p><small>sister rings: ' + sisters.map(([d, t]) => `<a href="${d}">${t}</a>`).join(' · ') + '</small></p>'] : []),
    '<hr>',
    '<p><small>« prev · random · next »</small></p>',
  ],
});

export const REL_RINGS = [
  ring('sacred-texts-ring.geocities.ws', 'SACRED TEXTS RING',
    'Sacred Texts Ring', 'parch',
    ['<p>How the big books got here. Not what they say, which is somebody '
      + 'else&rsquo;s ring, but the carrying: what was memorised, what was '
      + 'written down and when, who checked the copies, what the checking '
      + 'procedure was, and what the invention of printing did to all of it.</p>',
     '<p>Several of us came to this from the history of the book and one from '
      + 'error correction at work. Members hold every position on the underlying '
      + 'questions and a couple of us hold none.</p>'],
    [['the-quran.geocities.ws', 'The Qur&rsquo;an'],
     ['how-the-bible-was-assembled.geocities.ws', 'How the Bible was assembled'],
     ['torah-and-talmud.geocities.ws', 'The shape of a Talmud page'],
     ['the-pali-canon.geocities.ws', 'The three baskets'],
     ['the-vedas.geocities.ws', 'The Vedas, and how they were carried'],
     ['the-book-and-the-press.geocities.ws', 'Printing the scripture']],
    [['faith-and-schism-ring.geocities.ws', 'faith &amp; schism'],
     ['world-languages-ring.geocities.ws', 'the language ring']]),

  ring('faith-and-schism-ring.geocities.ws', 'FAITH AND SCHISM RING',
    'Faith &amp; Schism Ring', 'scholastic',
    ['<p>Where the traditions divided, what the division was actually about, '
      + 'and the long argument that runs underneath the lot of it from Plotinus '
      + 'onwards.</p>',
     '<p>House rule, agreed after a bad year: describe a position as its '
      + 'holders would recognise it before disagreeing with it. Pages that '
      + 'cannot manage that get dropped from the ring.</p>'],
    [['the-isnad.geocities.ws', 'The isnad'],
     ['sunni-and-shia.geocities.ws', 'Sunni and Shia'],
     ['schools-of-buddhism.geocities.ws', 'The schools of Buddhism'],
     ['the-reformation.geocities.ws', 'The Reformation'],
     ['the-plymouth-brethren.geocities.ws', 'The Plymouth Brethren'],
     ['neoplatonism-and-after.geocities.ws', 'Neoplatonism and after']],
    [['sacred-texts-ring.geocities.ws', 'sacred texts'],
     ['philosophy-ring.geocities.ws', 'the philosophy ring']]),
];
