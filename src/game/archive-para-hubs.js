// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE PARANORMAL WEBRINGS.
//
// The master ring is paranormal-ring, which every page joins. Under it run six
// strands: UFOs and aliens, cryptids, ghosts and hauntings, conspiracies and lost
// worlds, the occult and the psychic, and the skeptics and the culture.

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
    'the ringmaster wants to believe. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['paranormal-ring.geocities.ws', 'Paranormal Ring'],
  ufo: ['ufos-and-aliens-ring.geocities.ws', 'The UFOs &amp; Aliens Ring'],
  cryptid: ['cryptids-ring.geocities.ws', 'The Cryptids Ring'],
  ghost: ['ghosts-and-hauntings-ring.geocities.ws', 'The Ghosts &amp; Hauntings Ring'],
  conspiracy: ['conspiracies-and-lost-worlds-ring.geocities.ws', 'The Conspiracies &amp; Lost Worlds Ring'],
  occult: ['occult-and-psychic-ring.geocities.ws', 'The Occult &amp; Psychic Ring'],
  skeptic: ['skeptics-ring.geocities.ws', 'The Skeptics Ring'],
};

const A = [['roswell.geocities.ws', 'Roswell'], ['area-51.geocities.ws', 'Area 51'],
  ['the-grays.geocities.ws', 'The Greys'], ['crop-circles.geocities.ws', 'Crop Circles'],
  ['the-abduction.geocities.ws', 'The Abduction'], ['project-blue-book.geocities.ws', 'Project Blue Book']];
const B = [['bigfoot.geocities.ws', 'Bigfoot'], ['the-loch-ness-monster.geocities.ws', 'The Loch Ness Monster'],
  ['mothman.geocities.ws', 'Mothman'], ['the-chupacabra.geocities.ws', 'The Chupacabra'],
  ['the-yeti.geocities.ws', 'The Yeti'], ['cryptozoology.geocities.ws', 'Cryptozoology']];
const C = [['the-haunted-house.geocities.ws', 'The Haunted House'], ['poltergeists.geocities.ws', 'Poltergeists'],
  ['the-seance.geocities.ws', 'The Seance'], ['ectoplasm.geocities.ws', 'Ectoplasm'],
  ['the-ghost-hunt.geocities.ws', 'The Ghost Hunt'], ['the-victorian-spiritualists.geocities.ws', 'The Victorian Spiritualists']];
const D = [['the-bermuda-triangle.geocities.ws', 'The Bermuda Triangle'], ['atlantis.geocities.ws', 'Atlantis'],
  ['ancient-astronauts.geocities.ws', 'Ancient Astronauts'], ['the-philadelphia-experiment.geocities.ws', 'The Philadelphia Experiment'],
  ['the-men-in-black.geocities.ws', 'The Men in Black'], ['nostradamus.geocities.ws', 'Nostradamus']];
const E = [['tarot.geocities.ws', 'Tarot'], ['astrology-esoterica.geocities.ws', 'Astrology'],
  ['esp-and-psi.geocities.ws', 'ESP &amp; Psi'], ['the-ouija-board.geocities.ws', 'The Ouija Board'],
  ['the-pyramids-mystery.geocities.ws', 'The Pyramids'], ['ley-lines.geocities.ws', 'Ley Lines']];
const F = [['csicop.geocities.ws', 'CSICOP'], ['the-amazing-randi.geocities.ws', 'The Amazing Randi'],
  ['fortean-times.geocities.ws', 'Fortean Times'], ['the-x-files-culture.geocities.ws', 'The X-Files'],
  ['the-paranormal-tv.geocities.ws', 'Paranormal TV'], ['the-debunker.geocities.ws', 'The Debunker']];

export const PARA_RINGS = [
  ring(R.master[0], 'PARANORMAL RING', 'Paranormal Ring', 'para-ufo',
    ['<p>The truth is out there, and so is the man with the plank who made the crop circle: UFOs and '
      + 'aliens, the cryptids, the ghosts and hauntings, the conspiracies and lost worlds, the occult '
      + 'and the psychic, and the skeptics who test the lot.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.ufo, R.cryptid, R.ghost, R.conspiracy, R.occult, R.skeptic]),

  ring(R.ufo[0], 'THE UFOS AND ALIENS RING', 'The UFOs &amp; Aliens Ring', 'para-ufo',
    ['<p>Lights in the sky and the debris in the desert: the ranch at Roswell, the base at Groom Lake, '
      + 'the big-eyed Greys, the circles in the corn, the missing time, and the Air Force file.</p>'],
    A, [R.cryptid, R.skeptic]),

  ring(R.cryptid[0], 'THE CRYPTIDS RING', 'The Cryptids Ring', 'para-cryptid',
    ['<p>The hidden animals: the film at Bluff Creek, the Surgeon\'s Photograph, the winged figure over '
      + 'Point Pleasant, the goat-sucker, the snowman\'s footprint, and the science that hunts them.</p>'],
    B, [R.ufo, R.conspiracy]),

  ring(R.ghost[0], 'THE GHOSTS AND HAUNTINGS RING', 'The Ghosts &amp; Hauntings Ring', 'para-ghost',
    ['<p>The cold spot on the stair: the most haunted house in England, the noisy ghost, the darkened '
      + 'seance, the cheesecloth ectoplasm, the vigil with the EMF meter, and the Fox sisters.</p>'],
    C, [R.occult, R.skeptic]),

  ring(R.conspiracy[0], 'THE CONSPIRACIES AND LOST WORLDS RING', 'The Conspiracies &amp; Lost Worlds Ring', 'para-conspiracy',
    ['<p>The map with the hole in it: the Devil\'s Triangle, the sunken island, the gods who were '
      + 'astronauts, the invisible ship, the men in the dark suits, and the quatrains.</p>'],
    D, [R.cryptid, R.occult]),

  ring(R.occult[0], 'THE OCCULT AND PSYCHIC RING', 'The Occult &amp; Psychic Ring', 'para-occult',
    ['<p>The cards and the chart and the board: the Major Arcana, the natal wheel, the Zener cards at '
      + 'Duke, the planchette, the power in the pyramid, and the old straight track.</p>'],
    E, [R.ghost, R.conspiracy]),

  ring(R.skeptic[0], 'THE SKEPTICS RING', 'The Skeptics Ring', 'para-skeptic',
    ['<p>Extraordinary claims and the people who test them: the committee and its inquirer, the '
      + 'magician with the million-dollar cheque, the Fortean eyebrow, the X-Files effect, the TV '
      + 'boom, and the debunker\'s toolkit.</p>'],
    F, [R.ufo, R.ghost]),
];
