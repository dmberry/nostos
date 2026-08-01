// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The machines, as their owners wrote about them.
//
// Six pages about hardware and one about a program, all kept by people rather
// than by manufacturers, which is what a page about a computer was in 1999. The
// register is somebody who OWNED one and still has it in the loft: specific
// about the parts, unembarrassed about the affection, and quietly furious about
// one particular thing per machine.
//
// These are wired into the corpus that already exists rather than sitting off
// on their own:
//
//   - pagemaker.geocities.ws is the join. Every gig poster on the wall at JB's
//     and every flyer on the tables in the Heart & Hand was set by somebody on
//     a machine like these, and the specific route — an Amiga running a Mac
//     emulator running Aldus PageMaker, because that was cheaper than a Mac —
//     is the sort of thing only the person who did it remembers.
//   - spectrum48.geocities.ws is Ward's, via the fan page. A band who called an
//     album "It Might Be Useful For Us To Know" having a favourite computer is
//     exactly the kind of fact a fan page carries and nobody else records.
//   - winchester.geocities.ws is the odd one out on purpose: not a home
//     computer, and the page knows it, and its keeper worked with them.
//
// FACTS. Where a page states a number it is a number the keeper would have had
// in front of them — a chip, a clock speed, a capacity, a price they paid. Where
// a keeper is guessing, the page says it is guessing. Nothing here is a spec
// sheet copied out; a spec sheet is not what a person writes about a machine
// they carried up two flights of stairs.

import { pic } from './archive-pic.js';

export const MACHINE_SITES = [
  // ---- Amiga ---------------------------------------------------------------
  {
    domain: 'amiga.fanpages.org.uk',
    name: 'AMIGA',
    title: 'The Amiga page',
    body: [
      '<!--bg:navy-->',
      '<h1>Amiga</h1>',
      '<p><small>A500, and what people actually did with them.</small></p>',
      '<hr>',
      '<p>The Amiga was a machine that could do things nothing else at the price',
      'could do, sold to people who mostly played games on it, by a company that',
      'could not decide what it was for, and it is now the most fondly remembered',
      'computer in this country and one of the most poorly served by its own',
      'history. So here is a page.</p>',

      '<h2>The A500</h2>',
      '<pre class="jb-list">',
      '  processor      Motorola 68000 at 7.14 MHz',
      '  memory         512K, and the first thing everyone did was double it',
      '  graphics       custom chips: Agnus, Denise, Paula',
      '  sound          four channels, stereo, in hardware, in 1987',
      '  storage        one 880K floppy, built in',
      '  shape          a keyboard with the computer inside it',
      '</pre>',
      '<p>The three custom chips are the entire argument. Everything else on sale',
      'made the processor do the work; the Amiga had silicon that shifted blocks',
      'of graphics about and played four channels of sampled sound without asking',
      'the 68000 for permission. That is why the games looked like that and why',
      'the machine could hold a picture steady while doing something else, which',
      'sounds like nothing and was not nothing.</p>',

      '<h2>The disk swapping</h2>',
      '<p>One drive. One. So anything serious meant taking a disk out, putting',
      'another in, being asked for the first one again, and doing that eleven',
      'times, and the drive made a noise like a small machine being sick.',
      'Everybody who could afford a second drive bought one and everybody who',
      'bought one says it changed their life, which is a lot of claim for a box',
      'with a slot in it and is also true.</p>',

      '<h2>What people did on them</h2>',
      '<p>Games, yes. But also: music, because four channels of sampler in',
      'hardware meant trackers, and trackers meant a generation of people who',
      'learned to arrange music by moving numbers up and down a column. Video',
      'titling, because it could put text over a video signal without a studio.',
      'And desktop publishing, which is a whole page of its own at',
      '<a href="pagemaker.geocities.ws">pagemaker.geocities.ws</a> and is the',
      'reason I have any of this in the loft.</p>',

      '<h2>The thing I am still cross about</h2>',
      '<p>It was not beaten. It was mismanaged. The machine that was three years',
      'ahead in 1987 was still being sold, largely unchanged, when it was three',
      'years behind, and the people who owned them knew exactly what was',
      'happening and could not do anything about it from a bedroom in the West',
      'Midlands.</p>',
      '<hr>',
      '<p><small>Kept by <b>brumbrumbrum</b>. See also',
      '<a href="atarist.fanpages.org.uk">the Atari ST</a>, which I will be fair',
      'about, and <a href="blackcountryboard.co.uk">the board</a>.</small></p>',
    ],
  },

  // ---- Atari ST ------------------------------------------------------------
  {
    domain: 'atarist.fanpages.org.uk',
    name: 'ATARI ST',
    title: 'The Atari ST page',
    body: [
      '<!--bg:grey-->',
      '<h1>Atari ST</h1>',
      '<p><small>520 and 1040. The one with MIDI in the back.</small></p>',
      '<hr>',
      '<p>Every argument about the ST is an argument about the Amiga and it is',
      'boring and I am going to get it out of the way. The Amiga had better',
      'graphics and better sound. The ST had a faster clock, a better monochrome',
      'monitor, and two MIDI sockets on the back as standard.</p>',
      '<p>That last one decided the next fifteen years of British music and',
      'nobody at Atari appears to have planned it.</p>',

      '<h2>The machine</h2>',
      '<pre class="jb-list">',
      '  processor      Motorola 68000 at 8 MHz',
      '  memory         512K on the 520, a megabyte on the 1040',
      '  display        colour, or high-resolution mono at 640x400',
      '  sound          three channels, and we do not discuss it',
      '  in the back    MIDI IN and MIDI OUT, fitted, no card, no extra',
      '</pre>',

      '<h2>MIDI</h2>',
      '<p>Because the sockets were there and because the machine kept time',
      'without drifting, every studio in the country that could not afford a',
      'proper system ended up with an ST in the corner running a sequencer. Not',
      'some. Most. Records you own were sequenced on this machine, by people who',
      'would not have described themselves as computer users at all and who could',
      'not have told you what a 68000 was.</p>',
      '<p>It kept time better than machines that cost ten times as much, for the',
      'unglamorous reason that it was not doing anything else at the same time.',
      'A single-tasking computer with nothing to interrupt it is a metronome.</p>',

      '<h2>The mono monitor</h2>',
      '<p>The other thing nobody mentions. High-resolution black and white,',
      'rock steady, no flicker, and if you were setting type or writing anything',
      'long it was better than colour and better than most of what the PC world',
      'had. People bought an ST as a word processor and never played a game on',
      'it.</p>',
      '<hr>',
      '<p><small>Kept by <b>halesowen_pete</b>. Fair’s fair:',
      '<a href="amiga.fanpages.org.uk">the Amiga page</a>. And see',
      '<a href="pagemaker.geocities.ws">the DTP page</a>, who took the other',
      'route.</small></p>',
    ],
  },

  // ---- Spectrum ------------------------------------------------------------
  //
  // Ward's, via the fan page. The keeper here is the Ward fan page's keeper,
  // which is why the tone matches and why the two link to each other.
  {
    domain: 'spectrum48.geocities.ws',
    name: 'SPECTRUM 48K',
    title: 'ZX Spectrum 48K',
    body: [
      '<!--bg:black-->',
      '<h1>ZX Spectrum 48K</h1>',
      '<p><small>Rubber keys. Sinclair. 1982.</small></p>',
      '<hr>',
      '<p>This page exists because I asked a band what their favourite computer',
      'was, expecting not to be answered, and got back one line: <i>Spectrum 48K,',
      'and it is not close.</i></p>',
      '<p>So: <a href="ward.fanpages.org.uk">Ward</a>’s favourite computer, and',
      'mine, and everybody’s who had one.</p>',

      '<h2>What it was</h2>',
      '<pre class="jb-list">',
      '  processor      Zilog Z80A at 3.5 MHz',
      '  memory         48 kilobytes',
      '  display        256 x 192, eight colours, and the attribute problem',
      '  sound          one channel. A beeper. One.',
      '  storage        cassette tape',
      '  keyboard       rubber, dead, and every key does five things',
      '</pre>',

      '<h2>Colour clash</h2>',
      '<p>The famous fault, and the reason Spectrum games look the way they do.',
      'The machine stored the shape of the picture separately from its colour,',
      'and it only stored one pair of colours for every eight-by-eight square. So',
      'if two things overlapped in the same square, one of them changed colour.',
      'Whole games are designed around avoiding it.</p>',
      '<p>It is a limitation and it produced a look, and thirty years later the',
      'look is the thing people are copying on purpose. That is not irony. Any',
      'medium that is easy does not develop a style.</p>',

      '<h2>The tape</h2>',
      '<p>Five minutes. Sometimes eight. A noise like a fax argument, a border',
      'flashing in stripes so you knew it was still reading, and then either a',
      'game or <b>R Tape loading error</b>, and if it was the error you did the',
      'five minutes again with the volume adjusted by an eighth of a turn.</p>',
      '<p>Anyone who says they did not learn patience off a Spectrum is lying, and',
      'anyone who says the wait was part of the pleasure is lying differently.</p>',

      '<h2>Why a band would say this</h2>',
      '<p>I did ask. The answer was that it is the only computer either of them',
      'has owned where they understood the whole of it, top to bottom, and that',
      'you cannot get that back afterwards no matter how much you learn.</p>',
      '<hr>',
      '<p><small>Kept by <b>Andy R.</b>, who also does',
      '<a href="ward.fanpages.org.uk">the Ward page</a>. See also',
      '<a href="bbcmicro.geocities.ws">the BBC Micro</a>, which is the one they',
      'had at school.</small></p>',
    ],
  },

  // ---- BBC Micro -----------------------------------------------------------
  {
    domain: 'bbcmicro.geocities.ws',
    name: 'BBC MICRO',
    title: 'BBC Microcomputer Model B',
    body: [
      '<!--bg:oxford-->',
      '<h1>BBC Microcomputer, Model B</h1>',
      '<p><small>Acorn. The one that was in every school in the country.</small></p>',
      '<hr>',
      '<p>Nobody had one at home. Everybody used one. That is the whole social',
      'position of this machine: an entire generation of British children learned',
      'what a computer was on a Model B that belonged to a school, in a room they',
      'were let into for forty minutes a week.</p>',

      '<h2>The machine</h2>',
      '<pre class="jb-list">',
      '  processor      MOS 6502 at 2 MHz — twice what the competition ran',
      '  memory         32K on the Model B',
      '  display        eight modes, from 640x256 mono to big fat colour',
      '  sound          three channels and a noise channel',
      '  back panel     more ports than any machine of its era',
      '  build          cream, solid, and it did not break',
      '</pre>',
      '<p>The back panel is the point. Analogue in, the 1MHz bus, the user port,',
      'the tube. Acorn built a machine that expected to be connected to things,',
      'and schools connected them to things: temperature probes, plotters, turtle',
      'robots that drew on sugar paper on the floor.</p>',

      '<h2>BBC BASIC</h2>',
      '<p>The best BASIC anybody shipped. Proper named procedures, proper local',
      'variables, and an assembler built into the language, so you could write',
      'assembly inside a BASIC program and have it assembled when the program',
      'ran. That is an extraordinary thing to have put in front of eleven year',
      'olds and a certain number of them noticed.</p>',

      '<h2>The room</h2>',
      '<p>One machine per two or three children, a TV on a trolley, and a rota.',
      'The whole experience of computing in a British school in the eighties was',
      'waiting for your turn and then having eight minutes.</p>',
      '<p>By the time we were at college it was a room of',
      '<a href="halesowencollege.ac.uk">486s</a> and the door was unlocked at',
      'lunchtime, which changed everything, and there is a thread about the man',
      'who unlocked it on <a href="blackcountryboard.co.uk">the board</a>.</p>',
      '<hr>',
      '<p><small>Kept by <b>quinton_gary</b>. See also',
      '<a href="spectrum48.geocities.ws">the Spectrum</a>, which is the one we',
      'had at home, and which was worse and better. And if you want to know what',
      'the school’s disks were actually doing, somebody who serviced them has',
      'written <a href="winchester.geocities.ws">that page</a>.</small></p>',
    ],
  },

  // ---- PageMaker, and the emulation route ----------------------------------
  //
  // The join between the machines and the music. The poster walls in this
  // archive were set by somebody, and this is that somebody's page.
  {
    domain: 'pagemaker.geocities.ws',
    name: 'PAGEMAKER',
    title: 'Aldus PageMaker, on an Amiga',
    body: [
      '<!--bg:parch-->',
      '<h1>Aldus PageMaker</h1>',
      '<p><small>And how to run it without owning a Mac.</small></p>',
      '<hr>',
      '<p>If you saw a gig poster in the Midlands between about 1989 and 1996',
      'there is a fair chance it was set in PageMaker, and a smaller but real',
      'chance it was set in PageMaker on an Amiga pretending to be a Macintosh,',
      'which is what this page is actually about.</p>',

      '<h2>What PageMaker was</h2>',
      '<p>Aldus PageMaker is the program that started desktop publishing. Not',
      'one of the programs. The one. A Mac, a laser printer and PageMaker is the',
      'entire origin of the thing, and by the early nineties every fanzine,',
      'flyer, parish newsletter and gig poster in the country was being made this',
      'way by people who had never been near a print shop.</p>',
      '<p>You put a page on the screen. You drew boxes on it. Text flowed through',
      'the boxes and stayed where you put it. Before that you did this with a',
      'scalpel and wax and a light box, and afterwards you did not.</p>',

      '<h2>The problem</h2>',
      '<p>It ran on a Mac and Macs cost what a car cost.</p>',

      '<h2>The route</h2>',
      '<p>So: you did it on an <a href="amiga.fanpages.org.uk">Amiga</a>. Not',
      'natively — there was no Amiga PageMaker. You ran a Macintosh emulator on',
      'the Amiga, and the emulator ran the real Mac operating system, and',
      'PageMaker ran on that.</p>',
      '<p>It worked because both machines had the same processor. A 68000 is a',
      '68000 whether Motorola sold it to Commodore or to Apple, so the emulator',
      'was not simulating a chip instruction by instruction, it was translating',
      'what the Mac ROM and the Mac OS expected onto Amiga hardware, and the',
      'application code ran on the metal at full speed. That is the whole trick',
      'and it is why it was usable rather than a demonstration.</p>',
      '<p>What you needed:</p>',
      '<pre class="jb-list">',
      '  an Amiga             more memory than it came with. All of it.',
      '  the emulator         a card or a program, depending which one',
      '  Mac ROMs             which you had to get off an actual Mac',
      '  a Mac system disk    ditto',
      '  PageMaker            and then it just runs',
      '  a laser printer      the expensive bit, so you used somebody else’s',
      '</pre>',
      '<p>The ROMs are the part nobody writes down. You could not buy them on',
      'their own. Everyone I knew who did this got them out of a Mac belonging to',
      'a school, a college, a print shop or an office, on a weekend, with',
      'permission or the next thing to it, and that is why this arrangement is',
      'remembered as a bodge rather than as what it actually was, which was',
      'ordinary people finding the cheapest legal-ish road to a professional',
      'tool.</p>',

      '<h2>What came out of it</h2>',
      '<p>Posters. Hundreds of them. If you look at the wall in the back room of',
      '<a href="theheartandhand.geocities.ws">the Heart &amp; Hand</a>, or at the',
      'bills people have scanned onto <a href="jbs-dudley.org.uk">the JB’s',
      'page</a>, you are looking at the output of about a dozen bedrooms.</p>',
      '<p>You can tell them, as well. The same three typefaces, because that is',
      'what came in the box. Rules under headings, because a rule under a heading',
      'was one click. And a certain kind of tight, slightly cramped column,',
      'because everyone was trying to get one more band on the bill onto an A4.</p>',
      '<hr>',
      '<p><small>Kept by <b>warley_dave</b>. I did about two hundred of these',
      'and I have not got one of them.</small></p>',
    ],
  },

  // ---- the Winchester ------------------------------------------------------
  //
  // Deliberately the odd one: not a home machine, and the page's keeper is a
  // working engineer rather than an enthusiast, so the register drops the
  // affection and picks up the maintenance log.
  {
    domain: 'winchester.geocities.ws',
    name: 'WINCHESTER DISK',
    title: 'The Winchester hard disk',
    body: [
      '<!--bg:grey-->',
      '<h1>The Winchester disk</h1>',
      '<p><small>Sealed head-disk assembly. Why we called it that and what it',
      'was like to work on.</small></p>',
      '<hr>',
      '<p>I serviced these for eleven years and I have noticed that nobody who',
      'writes about old computers writes about the disks, so this is that page.',
      'It is not nostalgic. Some of this was miserable.</p>',

      '<h2>The name</h2>',
      '<p>IBM’s 3340, about 1973. The design put the heads, the arms and the',
      'platters together inside one sealed unit, so the heads never left the',
      'disk and never had to be re-aligned to it. It was a two-part drive of 30',
      'megabytes and 30 megabytes and somebody in the lab called it a 30-30,',
      'which is a Winchester rifle, and the name stuck to the whole technology',
      'for twenty years.</p>',
      '<p>Every sealed hard disk that came after is a Winchester by descent. By',
      'the nineties people had stopped saying it, and the word survives mostly in',
      'documentation written by people who learned the job when it mattered.</p>',

      '<h2>Why sealing changed everything</h2>',
      '<p>Before this, a disk pack was a thing you carried. Removable, in a',
      'plastic case like a cake stand, and you loaded it into a drive the size of',
      'a washing machine. The heads had to find the tracks on a platter they had',
      'never met. That meant loose tolerances, big tracks, low capacity, and a',
      'stream of alignment work for people like me.</p>',
      '<p>Seal it and the heads and the platters are a matched set for life. You',
      'can fly the head closer, put the tracks nearer together, and get capacity',
      'out of the same area. Everything since is that decision compounding.</p>',

      '<h2>The head crash</h2>',
      '<p>The head flies on a film of air a fraction of the thickness of a hair.',
      'If it touches, it ploughs. You hear it — a rising scraping note — and by',
      'the time you have heard it the surface is gone and so is everything on it,',
      'and there is no recovering it in the field and usually not out of it.</p>',
      '<p>I have heard that noise five times. You do not forget the sound and you',
      'do not forget the face of whoever is standing next to you.</p>',

      '<h2>Working on them</h2>',
      '<pre class="jb-list">',
      '  weight        a full-height 5.25 drive is a lump. Two hands.',
      '  noise         spin-up you can hear through a wall',
      '  heat          they run warm and they want air, and nobody',
      '                ever gave them enough of it',
      '  parking       park the heads before you move the machine.',
      '                Before. Every time. No exceptions.',
      '  backups       tape, nightly, verified, and nobody did',
      '</pre>',
      '<p>That last line is the whole of my working life. The technology was',
      'sound. The failures I attended were nearly always somebody’s procedure,',
      'not somebody’s hardware.</p>',
      '<hr>',
      '<p><small>Kept by <b>margaret_h</b>’s brother, who does not want his name',
      'on it, which is why she posted the link on',
      '<a href="blackcountryboard.co.uk">the board</a> and I did not.</small></p>',
      '<p><small>I keep a second page, about the logs rather than the disks:',
      '<a href="itwasnotlikethat.geocities.ws">itwasnotlikethat</a>. Nobody has',
      'ever written in about that one.</small></p>',
    ],
  },
];
