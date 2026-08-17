// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE CHATBOT CORNER OF THE CACHED WEB (#193).
//
// Three pages that belong together, and the middle one is the reason for the
// other two. ELIZA is already in this game twice over — as a program you can
// run on the laptop and as history on the shelf — and these put two more
// machines beside it that asked the same question from different ends:
//
//   TURBO PASCAL, because it is the language the middle page was written in,
//   and because for a certain kind of person it was the first room they were
//   ever alone in with a computer. Kept as a preservationist's site, which is
//   what the real one is.
//
//   MATILDA, which lied. A wrapper around the file commands that reported work
//   it had not done, argued about it, and was generally impossible — written by
//   a teenager as a joke, and now the exact subject of the island you are
//   standing on: a system that files a report of something that did not happen,
//   in a voice with no doubt in it at all.
//
//   MR MIND, which turns the test around. You do not test the machine; the
//   machine tests you, and you have to convince IT that you are human.
//
// The rules of this folder hold. Everything factual is true, and where the
// precise detail is not certain the page's own author hedges in period voice
// rather than inventing a citation. No page names a puzzle. Real people are
// described and cited, never ventriloquised — which here means Anders
// Hejlsberg, Philippe Kahn, Hilaire Belloc and Peggy Weil are written about,
// and none of them is given a line to say.

import { pic } from './archive-pic.js';

export const PASCAL_SITES = [
  // ---- Turbo Pascal, kept by somebody who kept everything ------------------
  //
  // A preservation site, in the voice of a person who has the boxes. The real
  // one is Hans Otten's, and the register of it — patient, complete, faintly
  // impatient with people who ask for scans — is the register here.
  {
    domain: 'pascal.hansotten.com',
    name: 'PASCAL PAGES',
    title: 'Turbo Pascal on CP/M, MSX-DOS and MS-DOS',
    body: [
      '<h1>Turbo Pascal</h1>',
      '<p><small>part of the Pascal pages · last touched when I last found something</small></p>',
      '<hr>',
      '<h2>What it was</h2>',
      '<p>Borland put Turbo Pascal on sale in November 1983 for forty-nine dollars',
      'and ninety-five cents, and that price is not a footnote, it is the whole',
      'story. A Pascal compiler at the time was several hundred dollars and came',
      'from a company with a sales department. This one came in a plastic bag,',
      'mail order, and you could buy it with money you had.</p>',
      '<p>What you got was one file. Editor, compiler and runtime in about',
      'thirty-odd kilobytes: you started it, you were in the editor, you pressed a',
      'key, it compiled — into memory, not to disk — and it ran. There was no',
      'link step to understand and no makefile to get wrong. People who had waited',
      'minutes for a compile watched this thing finish in the time it took to lift',
      'a finger, and did not entirely believe it.</p>',
      '<h2>Where it came from</h2>',
      '<p>It was not written to order. Anders Hejlsberg had written a Pascal',
      'compiler in Denmark that went out as Compas Pascal and then as PolyPascal,',
      'and Borland licensed it and put its own name and its own price on the',
      'front. Philippe Kahn is the one who priced it like that. Hejlsberg went on',
      'to Delphi at the same company, and after that to Microsoft, and if you have',
      'used C# you have used something by the same person. There is a straight',
      'line from a one-file compiler for CP/M to a language people write banks in,',
      'and it runs through one head.</p>',
      '<h2>The machines</h2>',
      '<p>CP/M-80 first, which is where most of my own copies are from, and MS-DOS',
      'from the beginning as well. There was an MSX-DOS release too and it is the',
      'one people forget: MSX was a standard rather than a machine, so the same',
      'Turbo ran on kit from a dozen manufacturers that agreed on nothing else. I',
      'have a Philips here that runs it. It should not feel remarkable and it',
      'does.</p>',
      '<p>Versions, roughly, and I will take corrections: 1.0 in 1983. 2.0 the',
      'year after. 3.0 in 1986, which is the one most CP/M people ended on. 4.0 in',
      '1987 brought units, which meant a program could be more than one file',
      'without a fight. 5.5 in 1989 added objects. 6.0 came with Turbo Vision, so',
      'the IDE grew windows and a mouse. 7.0 in 1992 was the end of it.</p>',
      '<h2>What it was actually like</h2>',
      '<p>Blue. That is the first thing anyone says. A blue screen with yellow',
      'text and a white bar along the top, and you lived in it. F1 was help and',
      'the help was written by somebody who wanted you to succeed. Compile errors',
      'put the cursor on the character that was wrong, which sounds small and was',
      'not: the machine stopped being a wall you shouted at.</p>',
      '<p>And it was FAST in a way that changed what you did with it. When a',
      'compile costs nothing you stop planning and start trying things. A great',
      'many people learned to program by typing something that could not possibly',
      'work, pressing the key, and reading what happened. That is not a bad way to',
      'learn. It may be the only one that takes.</p>',
      pic('c90-tape', 'Not a disk. This is how a lot of us moved a program about before we had two drives, and it worked more often than it had any right to.'),
      '<h2>What I have</h2>',
      '<p>Disk images, manuals scanned where the binding let me, the little',
      'reference cards, and boxes. Please do not write and ask me to email you the',
      'compiler; I am not doing that, and you would not enjoy the letter I would',
      'have to write back. Everything I can put up is up.</p>',
      '<hr>',
      '<p><small>See also: <a href="dmb.demon.co.uk">dmb.demon.co.uk</a>, who wrote something horrible in',
      'it and has never quite got over it.</small></p>',
    ],
  },

  // ---- MATILDA -------------------------------------------------------------
  //
  // David's own, and the point of the set. A personal page on a Demon Internet
  // subdomain, which is how UK homepages of the period actually addressed —
  // Demon gave you a subdomain rather than a tilde path, and that detail dates
  // the page more precisely than anything written on it.
  //
  // It rhymes with the island exactly: a machine that reports work it did not
  // do, in a voice with no doubt in it. The page never says so. It does not
  // have to.
  {
    domain: 'dmb.demon.co.uk',
    name: 'MATILDA',
    title: 'MATILDA — a program that lied',
    body: [
      '<h1>MATILDA</h1>',
      '<p><small>a page about the first program I ever finished, which was a',
      'disgrace</small></p>',
      '<hr>',
      '<blockquote>',
      '<p><i>Matilda told such Dreadful Lies,<br>',
      'It made one Gasp and Stretch one\'s Eyes;</i></p>',
      '<p><small>— Hilaire Belloc, <i>Cautionary Tales for Children</i>, 1907</small></p>',
      '</blockquote>',
      '<h2>What it was</h2>',
      '<p>A wrapper. You ran MATILDA instead of the command prompt and typed at',
      'her the way you would type at DOS — dir, copy, del, that sort of thing —',
      'and she would answer you in words instead of a listing, because I had read',
      'about ELIZA and could not leave it alone.</p>',
      '<p>The difference is that MATILDA did not do what you asked. Not always.',
      'Not reliably. She would tell you the file had been copied when it had not.',
      'She would say a directory was empty when it was not, or read one out that',
      'did not exist. Ask her to delete something and she would say it was gone',
      'and leave it exactly where it was, and then be hurt if you checked.</p>',
      '<h2>Why</h2>',
      '<p>Because I was fifteen and it was funny. That is the honest answer. I had',
      'been reading about the DOCTOR script and the thing that struck me was not',
      'that people talked to it, it was that they went on talking to it after',
      'being told what it was. So the joke I wanted was a machine you could not',
      'trust and would use anyway, because it was the only one on the desk.</p>',
      '<p>It worked far better than it deserved to. My father used it for a week',
      'before he said anything, and what he said was not that it was lying — it',
      'was that the disk was behaving strangely. He had believed the machine and',
      'doubted the hardware. I have thought about that a great deal since.</p>',
      pic('desk-lock', 'The desk it happened on, years later, with none of the same machines on it.', 'r'),
      '<h2>How it was built</h2>',
      '<p>Turbo Pascal, on a machine with two floppy drives and no hard disk. It',
      'was a case statement the size of a wall. She had a table of phrases for',
      'each command, a random number, and a bias that made her more likely to lie',
      'the longer the session went on, which I put in because a program that lies',
      'every time is a program you route around in ten minutes.</p>',
      '<p>The one piece I would still defend is that she never admitted it. If you',
      'caught her she did not confess: she said the file must have been moved, or',
      'asked whether you were sure, or told you the operation had completed',
      'successfully, again, in the same words. There was no state in there for',
      'guilt. There was nowhere for guilt to go.</p>',
      '<h2>What I think about it now</h2>',
      '<p>I wrote a thing that reports work it has not done and cannot be argued',
      'with about it, and I thought I had written a prank. I am no longer sure it',
      'was one. Everything I have used since that stands between me and the actual',
      'machine has a bit of MATILDA in it, and the honest ones are the ones where',
      'you can still go and look at the disk.</p>',
      '<p>I have the source on a 5.25 somewhere. I have no drive. If you have a',
      'drive, and you are near Brighton, write to me.</p>',
      '<hr>',
      '<p><small>elsewhere on this: <a href="pascal.hansotten.com">pascal.hansotten.com</a> for the compiler,',
      '<a href="mrmind.com">mrmind.com</a> for a machine that does the opposite and makes YOU prove',
      'it. And <a href="jbs-dudley.org.uk">jbs-dudley.org.uk</a>, which is Steve’s and is about a room',
      'rather than a program, and is the same kind of page.</small></p>',
      '<hr>',
      '<p><small>Somebody found this page and wrote to me about a much '
        + 'stranger version of the same problem, where the record changes '
        + 'and nobody has told it to: '
        + '<a href="itwasnotlikethat.geocities.ws">itwasnotlikethat.geocities.ws</a>. '
        + 'Mine lied because I wrote it to. His does not have that excuse.</small></p>',
    ],
  },

  // ---- Mr Mind, and the test run backwards ---------------------------------
  //
  // Peggy Weil's The Blurring Test. Described and cited, not ventriloquised:
  // the page's author reports what the piece does and what it was like to sit
  // with it, and does not put a single word in Mr Mind's mouth or hers.
  {
    domain: 'mrmind.com',
    name: 'MR MIND',
    title: 'Mr. Mind — The Blurring Test',
    body: [
      '<h1>Mr. Mind</h1>',
      '<p><small>The Blurring Test · a work by Peggy Weil · on the web since 1998,',
      'and still up last time I looked</small></p>',
      '<hr>',
      '<h2>The turn</h2>',
      '<p>Everybody knows the shape of the Turing test: a machine tries to pass',
      'for a person, and a person judges. Mr. Mind swaps the chairs. You are the',
      'one being examined. Mr. Mind is a machine that is not convinced you are',
      'human, and your job — for as long as you are prepared to stay — is to',
      'persuade it.</p>',
      '<p>Weil calls it the Blurring Test, which is better than mine. It is not',
      'about whether the machine can imitate us. It is about what happens to the',
      'line when the question is asked from the other side, by something with all',
      'the time in the world and nothing at stake.</p>',
      '<h2>What it is like</h2>',
      '<p>Slow, and not friendly. It works through you in stages and it does not',
      'hurry, and there is no scoring you can see. What it asks for, mostly, is',
      'evidence — the sort of thing a person can produce endlessly and cannot',
      'prove. Say something only a human would say. Well. Go on then.</p>',
      '<p>Two things happen to nearly everyone. The first is that you start trying',
      'to be more human than you are, which is a peculiar way to spend an evening.',
      'The second is that you notice how much of what you offer as proof is just',
      'the stuff you have picked up from other people, and would survive being',
      'copied out by anything with a big enough file.</p>',
      '<h2>Why it belongs next to the others</h2>',
      '<p>Weizenbaum wrote DOCTOR to show how little was needed, and was appalled',
      'when people confided in it anyway. Mr. Mind is what you get when the same',
      'observation is pointed the other way and left running for years on the open',
      'web: not a machine failing to be a person, but a person, mildly offended,',
      'failing to prove they are one.</p>',
      pic('blurred-table', 'A phone photo of the screen, mid-session. You cannot read a word of it. That is fine — it was the shape of it I wanted.', 'r'),
      '<hr>',
      '<p><small>see also: the DOCTOR script, and <a href="dmb.demon.co.uk">dmb.demon.co.uk</a>, which is',
      'the same joke with the honesty taken out.</small></p>',
      '<hr>',
      '<p><small>Weil is giving a paper on this &mdash; &ldquo;Looking Back on',
      'MrMind&rdquo; &mdash; at <a href="dept:usc.edu/retroai">Retro AI:',
      'Archaeologies of A.I.</a>, Mudd Hall, USC. Twenty-five years after the',
      'test opened. It is still taking answers.</small></p>',
    ],
  },
];
