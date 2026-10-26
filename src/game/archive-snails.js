// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// A page on the knight-versus-snail drollery of Gothic manuscript margins, put
// up by someone who reads too much medieval marginalia.
//
// Compilation and running order follow the British Library Medieval Manuscripts
// blog, "Knight v Snail" (Sarah J. Biggs, 25 September 2013),
// https://www.bl.uk/stories/blogs/posts/knight-v-snail . The manuscripts are in
// the British Library and the images are in the public domain; each is credited
// below by shelfmark and folio.

const P = (domain, name, title, body) => ({ domain, name, title, body });
const pic = (src, cap) => `<img class="indie-pic" src="assets/media/web/snails/${src}" alt=""><span class="indie-cap">${cap}</span>`;

const SNAIL = P('knight-v-snail.geocities.ws', 'KNIGHT v SNAIL', 'Knight v. Snail :: a marginal puzzle', [
  '<!--bg:parch-->',
  '<h1>KNIGHT v. SNAIL</h1>',
  '<p><small>a page kept by someone who went looking for one armoured knight',
  'fighting one snail in the margin of a psalter, and found a great many. the',
  'pictures are all from manuscripts in the British Library and are out of',
  'copyright. the order and the titles follow the Library\'s own write-up, which',
  'is where I started. sign the guestbook if you know the answer, because nobody',
  'else seems to.</small></p>',
  '<hr>',
  // snails/snail-man.jpg: a human-headed snail drollery (BL manuscript; public domain)
  pic('snail-man.jpg', 'not a fight, just a neighbour: a man who is also his own shell'),
  '<h2>The thing itself</h2>',
  '<p>Turn the pages of a Gothic prayer book or law book from around 1300 and,',
  'down in the margin where the text has no more claim on the space, you keep',
  'meeting the same scene. A knight in mail, sword or lance raised, squares up to',
  'a snail. Sometimes he recoils from it. Sometimes he kneels to it. The snail',
  'advances, horns out, and does not hurry. The joke is drawn with complete',
  'seriousness, over and over, by different artists in different countries across',
  'a single generation.</p>',
  '<h2>The dossier</h2>',
  // snails/snail-1-royal14bv.jpg: Royal MS 14 B V, membrane 3 (genealogical roll of the kings of England, late 13th c.), British Library, public domain
  pic('snail-1-royal14bv.jpg', 'I. a genealogical roll of the kings of England, late 13th century. Royal MS 14 B V, membrane 3'),
  // snails/snail-2-gorleston-193v.jpg: Add MS 49622, f. 193v (Gorleston Psalter, Suffolk, 1310-1324), British Library, public domain
  pic('snail-2-gorleston-193v.jpg', 'II: Battle in the Margins. the Gorleston Psalter, Suffolk, 1310-1324. Add MS 49622, f. 193v'),
  // snails/snail-3-yatesthompson19.jpg: Yates Thompson MS 19, f. 65r (Brunetto Latini, Li Livres dou Tresor, Picardy, c.1315-1325), British Library, public domain
  pic('snail-3-yatesthompson19.jpg', 'III: Extreme Jousting. Brunetto Latini, Li Livres dou Tresor, Picardy, c.1315-1325. Yates Thompson MS 19, f. 65r'),
  // snails/snail-4-queenmary.jpg: Royal MS 2 B VII, f. 148r (Queen Mary Psalter, England, 1310-1320), British Library, public domain
  pic('snail-4-queenmary.jpg', 'IV: The Snails Attack. the Queen Mary Psalter, England, 1310-1320. Royal MS 2 B VII, f. 148r'),
  // snails/snail-5-smithfield.jpg: Royal MS 10 E IV, f. 107r (Smithfield Decretals, c.1300-1340), British Library, public domain
  pic('snail-5-smithfield.jpg', 'V: Revenge of the Snail. the Smithfield Decretals, c.1300-1340. Royal MS 10 E IV, f. 107r'),
  // snails/snail-6-gorleston-162v.jpg: Add MS 49622, f. 162v (Gorleston Psalter), British Library, public domain
  pic('snail-6-gorleston-162v.jpg', 'VI: The Gastropod Conqueror. the Gorleston Psalter. Add MS 49622, f. 162v'),
  // snails/snail-7-harley6563.jpg: Harley MS 6563, ff. 62v-63r (Book of Hours, London, c.1320-1330), British Library, public domain
  pic('snail-7-harley6563.jpg', 'VII: A Pretty Comprehensive Defeat. a Book of Hours, London, c.1320-1330. Harley MS 6563, ff. 62v-63r'),
  // snails/snail-8-gorleston-210v.jpg: Add MS 49622, f. 210v (Gorleston Psalter), British Library, public domain
  pic('snail-8-gorleston-210v.jpg', 'VIII: and once, a switch. it is a monkey this time. the Gorleston Psalter. Add MS 49622, f. 210v'),
  '<h2>Why? what people have said</h2>',
  '<p><b>The Lombards.</b> Lillian Randall counted the scenes and noticed where',
  'they cluster, and in 1962 she offered the reading that still gets quoted',
  'first. The snail stood for the Lombards, the northern Italian bankers whom the',
  'rest of Europe owed money and therefore despised, and whom the chronicles',
  'called cowardly, treacherous and slow to fight. A knight shrinking from a',
  'snail is a knight shrinking from a Lombard: a joke about a people held to have',
  'no courage. It explains the contempt in the picture. It does not explain why',
  'the snail so often wins.</p>',
  '<p><b>Cowardice, plainly.</b> Strip out the Lombards and you are left with the',
  'simpler target. A man in full armour who will not face a creature he could',
  'step on is every boast that cannot be cashed. The margin is where the main',
  'picture\'s knight, all valour and gold leaf, gets measured against a snail and',
  'comes up short.</p>',
  '<p><b>Death, and the rising from it.</b> A snail carries its tomb and comes',
  'out of it anyway. Medieval readers knew the shell as a figure of the grave and',
  'the body that leaves it at the resurrection. On this reading the fight is the',
  'oldest one, the soul against death, drawn small in the corner of a page that',
  'is praying about exactly that.</p>',
  '<p><b>The low against the high.</b> The snail is slow, humble, armoured in its',
  'own back, and it keeps coming. Set it against the mounted aristocrat and you',
  'have the poor man, or the man climbing out of his station, who cannot be',
  'ridden down because he will not stop.</p>',
  '<p><b>The margin that answers back.</b> Michael Camille taught a generation to',
  'read these edges as a place of licensed inversion, the world turned upside',
  'down beside the sacred text, where a snail may rout a knight because down here',
  'the rules are suspended. The drollery is not a rebus with one solution. It is',
  'the page making fun of its own solemn centre.</p>',
  '<p><b>Nobody knows.</b> The Library that holds most of these put the question',
  'to its readers and admitted it had no settled answer. The scene may be several',
  'of these at once, or a visual joke that a workshop found funny and copied until',
  'it meant whatever the next reader needed. A drawing can outlast every reason it',
  'was drawn for and still get passed along.</p>',
  '<h2>The snail ennobled</h2>',
  '<p>The heraldry books give the snail a different life. There the house-snail is',
  'a charge like any other, granted to families and drawn with care, horns up and',
  'shell coiled on a shield that someone carried with pride. Three house-snails,',
  'blazoned and borne.</p>',
  // snails/three-snails-arms.png: heraldic woodcut, "Three house-snails", early-modern English book of heraldry; public domain
  pic('three-snails-arms.png', 'three house-snails, borne as a coat of arms. from an old book of heraldry'),
  '<h2>And it is not only snails</h2>',
  '<p>Once you start reading the margins for the fight the centre will not show,',
  'the other combatants turn up. The hare arms itself. The world below the text',
  'line keeps its own war.</p>',
  // snails/rabbit-royal10eiv.jpg: Royal MS 10 E IV, f. 64 (Smithfield Decretals), British Library, public domain
  pic('rabbit-royal10eiv.jpg', 'a hare takes up a weapon. the Smithfield Decretals again. Royal MS 10 E IV, f. 64'),
  '<hr>',
  '<h2>Reading</h2>',
  '<pre>',
  'Camille, M. (1992) Image on the Edge: The Margins of Medieval Art. London: Reaktion.',
  'Randall, L. M. C. (1962) "The Snail in Gothic Marginal Warfare", Speculum 37(3).',
  'Randall, L. M. C. (1966) Images in the Margins of Gothic Manuscripts. Berkeley: California UP.',
  'Sandler, L. F. (1997) "The Study of Marginal Imagery", Studies in Iconography 18.',
  '</pre>',
  '<p><small>counter: 00417 &middot; last updated when I should have been revising &middot;',
  'see also the people who put pictures inside pictures at',
  '<a href="en-abyme.geocities.ws">mise en abyme</a></small></p>',
  '<p><small>found a knight against a snail I have not catalogued? the guestbook is open.</small></p>',
]);

export const SNAIL_SITES = [SNAIL];
