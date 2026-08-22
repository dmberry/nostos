// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE HOME-COMPUTER WEBRINGS, 1975–1995.
//
// The machines that came home, and the people who built them: the kit era, the
// 1977 trinity, the 8-bit boom, the 16-bit generation, and the beige box that
// outlived them all. One main ring and four along the lines the playground
// argued about.

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
    '<p><small>« prev · <a href="' + members[0][0] + '">random</a> · next »<br>',
    'ringmaster is waiting for a tape to load. the ring turns anyway.</small></p>',
  ],
});

const R = {
  main: ['home-computers-ring.geocities.ws', 'Home Computers Ring'],
  eight: ['eight-bit-ring.geocities.ws', 'The 8-bit Ring'],
  sixteen: ['sixteen-bit-ring.geocities.ws', 'The 16-bit Ring'],
  pc: ['pc-clones-ring.geocities.ws', 'The PC &amp; Clones Ring'],
  makers: ['home-computer-makers-ring.geocities.ws', 'The Makers Ring'],
};

export const HOME_RINGS = [
  ring(R.main[0], 'HOME COMPUTERS RING', 'Home Computers Ring', 'trinity',
    ['<p>Every machine that came home between the Altair and Windows 95, and the '
      + 'people who made them. Kept by people who still know the difference between '
      + 'a 6502 and a Z80, and still argue about it.</p>'],
    [['altair-8800.geocities.ws', 'The Altair 8800'],
     ['homebrew-club.geocities.ws', 'The Homebrew Computer Club'],
     ['apple-i.geocities.ws', 'The Apple I'],
     ['imsai-8080.geocities.ws', 'The IMSAI 8080'],
     ['cpm-digital-research.geocities.ws', 'CP/M &amp; Gary Kildall'],
     ['apple-ii.geocities.ws', 'The Apple II'],
     ['commodore-pet.geocities.ws', 'The Commodore PET'],
     ['trs-80.geocities.ws', 'The TRS-80'],
     ['atari-800.geocities.ws', 'The Atari 400/800'],
     ['ti-994a.geocities.ws', 'The TI-99/4A'],
     ['mos-6502.geocities.ws', 'The MOS 6502'],
     ['zx-spectrum.geocities.ws', 'The ZX Spectrum'],
     ['bbc-micro.geocities.ws', 'The BBC Micro'],
     ['commodore-64.geocities.ws', 'The Commodore 64'],
     ['amstrad-cpc.geocities.ws', 'The Amstrad CPC'],
     ['msx.geocities.ws', 'The MSX standard'],
     ['dragon-jupiter.geocities.ws', 'The Dragon 32 &amp; Jupiter Ace'],
     ['woz.geocities.ws', 'Steve Wozniak'],
     ['sir-clive-sinclair.geocities.ws', 'Sir Clive Sinclair'],
     ['jack-tramiel.geocities.ws', 'Jack Tramiel'],
     ['ed-roberts.geocities.ws', 'Ed Roberts'],
     ['sophie-wilson.geocities.ws', 'Sophie Wilson'],
     ['alan-sugar.geocities.ws', 'Alan Sugar'],
     ['macintosh-128k.geocities.ws', 'The Macintosh'],
     ['amiga.geocities.ws', 'The Commodore Amiga'],
     ['atari-st.geocities.ws', 'The Atari ST'],
     ['acorn-archimedes.geocities.ws', 'The Acorn Archimedes'],
     ['jay-miner.geocities.ws', 'Jay Miner'],
     ['arm-story.geocities.ws', 'The ARM story'],
     ['ibm-pc-5150.geocities.ws', 'The IBM PC (5150)'],
     ['ms-dos.geocities.ws', 'MS-DOS &amp; the Microsoft deal'],
     ['ibm-pc-clones.geocities.ws', 'The PC clones'],
     ['intel-x86.geocities.ws', 'Intel &amp; the x86'],
     ['the-beige-box.geocities.ws', 'How the beige box won'],
     ['type-in-listings.geocities.ws', 'Type-in listings'],
     ['the-datasette.geocities.ws', 'Cassette &amp; floppy'],
     ['demoscene-home.geocities.ws', 'The demoscene at home'],
     ['computer-shops.geocities.ws', 'The computer shop'],
     ['home-computer-ads.geocities.ws', 'The adverts'],
     ['a-history-of-home-computers.geocities.ws', 'A history of the home computer'],
     ['the-home-computer-wars.geocities.ws', 'The home computer wars'],
     ['what-happened-to-them.geocities.ws', 'What happened to the machines'],
     ['retro-hobby.geocities.ws', 'The retrocomputing hobby'],
     ['sinclair-vs-acorn.geocities.ws', 'Sinclair vs Acorn']],
    [R.eight, R.sixteen, R.pc, R.makers]),

  ring(R.eight[0], 'THE 8-BIT RING', 'The 8-bit Ring', 'eightbit',
    ['<p>Rubber keys and colour clash, the SID chip and BBC BASIC, cassette loads '
      + 'and type-in listings. The machines a generation learned to program on, one '
      + 'POKE at a time.</p>'],
    [['zx-spectrum.geocities.ws', 'The ZX Spectrum'],
     ['bbc-micro.geocities.ws', 'The BBC Micro'],
     ['commodore-64.geocities.ws', 'The Commodore 64'],
     ['amstrad-cpc.geocities.ws', 'The Amstrad CPC'],
     ['msx.geocities.ws', 'The MSX standard'],
     ['dragon-jupiter.geocities.ws', 'The Dragon 32 &amp; Jupiter Ace'],
     ['commodore-pet.geocities.ws', 'The Commodore PET'],
     ['trs-80.geocities.ws', 'The TRS-80'],
     ['atari-800.geocities.ws', 'The Atari 400/800'],
     ['type-in-listings.geocities.ws', 'Type-in listings']],
    [R.main]),

  ring(R.sixteen[0], 'THE 16-BIT RING', 'The 16-bit Ring', 'sixteen',
    ['<p>The 68000 generation: the Macintosh and the mouse, the Amiga and its '
      + 'custom chips, the ST and its MIDI ports, and the Archimedes that was too '
      + 'far ahead to sell.</p>'],
    [['macintosh-128k.geocities.ws', 'The Macintosh'],
     ['amiga.geocities.ws', 'The Commodore Amiga'],
     ['atari-st.geocities.ws', 'The Atari ST'],
     ['acorn-archimedes.geocities.ws', 'The Acorn Archimedes'],
     ['jay-miner.geocities.ws', 'Jay Miner'],
     ['arm-story.geocities.ws', 'The ARM story'],
     ['demoscene-home.geocities.ws', 'The demoscene at home']],
    [R.main]),

  ring(R.pc[0], 'THE PC AND CLONES RING', 'The PC &amp; Clones Ring', 'pc',
    ['<p>The boring machine that won. The open IBM architecture, the DOS deal, the '
      + 'clean-room BIOS, the x86, and the beige box that anyone could build and '
      + 'nobody could love.</p>'],
    [['ibm-pc-5150.geocities.ws', 'The IBM PC (5150)'],
     ['ms-dos.geocities.ws', 'MS-DOS &amp; the Microsoft deal'],
     ['ibm-pc-clones.geocities.ws', 'The PC clones'],
     ['intel-x86.geocities.ws', 'Intel &amp; the x86'],
     ['the-beige-box.geocities.ws', 'How the beige box won'],
     ['cpm-digital-research.geocities.ws', 'CP/M &amp; Gary Kildall'],
     ['what-happened-to-them.geocities.ws', 'What happened to the machines']],
    [R.main]),

  ring(R.makers[0], 'THE MAKERS RING', 'The Makers Ring', 'people',
    ['<p>The people behind the plastic: the engineer who counted every chip, the '
      + 'man who cut every corner, the survivor who ran the price wars, and the '
      + 'programmer who designed the CPU in your phone.</p>'],
    [['woz.geocities.ws', 'Steve Wozniak'],
     ['sir-clive-sinclair.geocities.ws', 'Sir Clive Sinclair'],
     ['jack-tramiel.geocities.ws', 'Jack Tramiel'],
     ['ed-roberts.geocities.ws', 'Ed Roberts'],
     ['sophie-wilson.geocities.ws', 'Sophie Wilson'],
     ['alan-sugar.geocities.ws', 'Alan Sugar'],
     ['jay-miner.geocities.ws', 'Jay Miner'],
     ['sinclair-vs-acorn.geocities.ws', 'Sinclair vs Acorn']],
    [R.main]),
];
