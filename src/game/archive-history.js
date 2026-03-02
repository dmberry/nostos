// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// W1 (docs/web-history-plan.md) — the history, cached, and it is the hint system.
//
// A page on Samuel's checkers program says the program learned by playing
// itself. Nothing on it mentions CALYPSO, or a streak of five, or a way off her
// island. A player who reads it and then watches her decline a sixth game has
// done the joining themselves, and that is the whole method: the walkthrough is
// the history, and it was on the shelf the entire time.
//
// TWO RULES, and they are load-bearing rather than pious.
//
// EVERYTHING FACTUAL IS TRUE. These pages are how a stuck player gets unstuck,
// so a false one is a broken hint, not a harmless flourish. Where the precise
// detail is not certain, the page's own author is unsure IN PERIOD VOICE — a
// hobbyist in 1995 hedging about a date is more authentic than a perfect
// citation, and it is honest. Do not smooth those hedges away later.
//
// NO PAGE NAMES A PUZZLE. The moment one says "so to beat her you must", the
// mechanic is dead and the player is reading a walkthrough instead of a web.
//
// Real people are described and cited, never ventriloquised: no invented
// quotations, no imagined interiority. That covers Strachey, Samuel, Shannon,
// Weizenbaum and Agre here, and the film gets the same treatment.

// Most images on these pages are DESCRIBED as missing rather than shown, because
// a broken image is a period-accurate thing a 1990s page can offer and it costs
// no assets. A few real ones are allowed where the fan-page author would plainly
// have a snapshot of their own — a photo of their screen, their marked-up copy
// of the paper. pic() lives in its own file (archive-pic.js) since #143, so this
// import is not the cycle the old note warned about.
import { pic } from './archive-pic.js';

// Bare hostnames, and no leading `www.`. Two constraints from the cache, both
// found the hard way: a slash in a domain fails to resolve, so the paths a page
// of this vintage really had (members.aol.com/checkersbot, ~history/strachey)
// cannot live here; and findHost strips `www.` from the query, so a host stored
// WITH it can never be found. The path and the vintage live in the page's own
// voice instead, which is where they read better anyway.
//
// Also: use literal · and " rather than the HTML entities. renderPage's strip()
// decodes &amp;, &lt; and &gt; and nothing else, so any other entity reaches the
// CRT spelled out.
export const HISTORY_SITES = [
  // ---- Samuel, and the machine that played itself -------------------------
  // The load-bearing page for the concession route (K4). Self-play is not a
  // film's invention; it is what the 1959 program actually did.
  {
    domain: 'checkersbot.org',
    name: 'CHECKERSBOT',
    title: "Art Samuel's checkers player — a fan page",
    body: [
      '<h1>The Samuel Checkers Player</h1>',
      '<p><small>a fan page · last updated some time ago · you are visitor 00417</small></p>',
      '<hr>',
      '<h2>What it was</h2>',
      '<p>Arthur Samuel worked at IBM and spent years on a program that played',
      'checkers. He started in the early fifties on the 701 and kept at it. The',
      'famous paper is <i>Some Studies in Machine Learning Using the Game of',
      'Checkers</i>, IBM Journal, 1959. If you only read one thing, read that.</p>',
      '<h2>Why anybody still cares</h2>',
      '<p>Plenty of people wrote programs that played games. Samuel wrote one that',
      'got BETTER. That is the whole thing. It kept a record of positions it had',
      'seen and what they were worth, adjusted the weights it scored a board with,',
      'and improved without anybody going in and improving it.</p>',
      '<p><b>And the way it practised was by playing itself.</b> Two copies, one',
      'machine, no opponent needed. It would sit there and play through games',
      'against a version of itself and come out of it stronger than it went in.',
      'People had written about machines that learn. This one did it on a',
      'schedule, overnight, on hardware you could go and look at.</p>',
      '<h2>The thing nobody mentions</h2>',
      '<p>Checkers is a small game and a good player is very hard to beat. Two',
      'strong players draw, and draw, and draw. A program that has played itself',
      'enough is playing a position it already knows the end of. What that is',
      'like from the inside is not a question the paper asks.</p>',
      '<h2>Where it went afterwards</h2>',
      '<p>People think the checkers player stopped at IBM. It did not. Samuel',
      'retired from IBM in the sixties and took the program with him to the',
      'Stanford AI Lab, and there is a version of it from about 1972 that runs on',
      'the PDP-10 under WAITS, which is the operating system they wrote at',
      'Stanford. Somebody ported the old IBM assembly across by hand. The source',
      'is up on saildart if you go looking, and it is a strange thing to read: a',
      'fifties learning program, in the file listings of a seventies time-sharing',
      'machine, still there.</p>',
      '<p>You can still run it. The command is <tt>R CHECKE</tt> and it wants your',
      'moves as square numbers, 1 to 32, the way the notation has always gone. I',
      'sat and lost to a program older than I am. Here is my screen, for anyone',
      'who does not believe me.</p>',
      pic('pygame-ls', "A photo of my screen with the old checkers in among everything else. Yes it is a phone photo of a monitor. That is the internet for you."),
      '<p>There was even a cut-down one in 1977 for a home machine called the',
      'VideoBrain, in a kilobyte of memory, which if you have ever tried to fit',
      'anything into a kilobyte you will know is close to a miracle. The same idea',
      'kept shrinking to fit whatever hardware would have it, and it never stopped',
      'working.</p>',
      '<hr>',
      '<p><small>mail me: checkersbot at aol dot com. I do not have the 1959 paper',
      'scanned and please stop asking, it is forty pages.</small></p>',
    ],
  },

  // ---- Strachey: the draughts programme and the love letters --------------
  // Calypso's whole character, on one page, without her name on it. Manchester
  // is correct: the Ferranti Mark I was the Manchester machine.
  {
    domain: 'history.cs.man.ac.uk',
    name: 'MANCHESTER',
    title: 'Christopher Strachey and the Mark I — course notes',
    body: [
      '<h1>Strachey and the Ferranti Mark I</h1>',
      '<p><small>supplementary notes, History of Computing · not examinable</small></p>',
      '<hr>',
      '<h2>Two programmes, one summer</h2>',
      '<p>Christopher Strachey came to the Manchester machine as an outsider — a',
      'schoolmaster, not an engineer — and wrote, on the same hardware and within',
      'about a year of each other, two of the most-cited programmes of the era.</p>',
      '<p>The first played DRAUGHTS. It is among the earliest programmes anywhere',
      'that played a game to completion against a person, and Strachey wrote about',
      'the experience himself afterwards for a general audience.</p>',
      '<p>He did not begin at Manchester. The first attempt was on Turing\'s Pilot',
      'ACE at the National Physical Laboratory, around 1950 or 1951, and it ran out',
      'of store — the machine simply did not have the room. He carried it to the',
      'larger Ferranti Mark I at Manchester, and by the summer of 1952 it could',
      'play a full game at a reasonable speed. The board was held as bit patterns,',
      'one word for the white men, one for the black, one for the kings, which is a',
      'trick programmers rediscover to this day and call by other names.</p>',
      '<p>The detail everyone repeats, and it appears to be true, is that on',
      'finishing a game the machine played the national anthem. Accounts say "God',
      'Save the King", which places the story before the coronation, so take the',
      'exact month with a pinch of salt. A room of engineers, a completed game of',
      'draughts, and a valve computer picking out the anthem: that is the founding',
      'image of the whole business, and it happened.</p>',
      pic('marked-up-paper', 'My photocopy of the 1954 essay, with my own working in the margins. Departmental library, do not tell them.', 'r'),
      '<p>The second wrote LOVE LETTERS. It assembled them out of a template and',
      'word lists: a salutation, a couple of clauses picked at random, endearments',
      'drawn from a table, a signature. Students see the output and laugh, and',
      'then read three of them in a row and stop laughing, which is the correct',
      'response and the reason it is on this handout.</p>',
      '<h2>Why we teach them together</h2>',
      '<p>Because the same person, the same machine and the same few months',
      'produced a programme that plays to win and a programme that produces',
      'affection on demand, and neither of them was a stunt. Strachey was working',
      'out what the machine could be made to do, and those were two of the',
      'answers.</p>',
      '<p>It is worth saying that the letters are more sophisticated than they',
      'look. The vocabulary is doing a great deal of work and the grammar very',
      'little, which is a lesson that keeps having to be relearned.</p>',
      '<p>One nice detail: the randomness came from the machine itself. The Mark I',
      'had a hardware random number source built on the noise off a resistor, so',
      'the choice of which endearment to reach for was drawn from the thermal',
      'hiss of the electronics. The affection was, quite literally, noise.</p>',
      '<h2>Reading</h2>',
      '<p>Strachey, "The "Thinking" Machine", 1954. There is a copy in',
      'the departmental library. The link to the scan on this page has been broken',
      'since the server was rebuilt and I have not had time.</p>',
    ],
  },

  // ---- Shannon 1955: the framing ------------------------------------------
  {
    domain: 'gamehist.cs.uiuc.edu',
    name: 'GAMEHIST',
    title: 'Machines that play games — a reading list',
    body: [
      '<h1>Machines That Play Games</h1>',
      '<p><small>reading list for the seminar · corrections welcome</small></p>',
      '<hr>',
      '<h2>Start here</h2>',
      '<p>Shannon, C. E., "Game Playing Machines", <i>Journal of the Franklin',
      'Institute</i>, vol. 260, pp. 447-453, December 1955.</p>',
      '<p>Short, readable, and it is the piece that gets the field to agree what',
      'it is arguing about. Shannon had already done the chess paper in 1950; this',
      'one steps back and asks what it means that we keep building these at all.</p>',
      '<h2>Then</h2>',
      '<p>Samuel, A. L., "Some Studies in Machine Learning Using the Game of',
      'Checkers", <i>IBM Journal of Research and Development</i>, 1959. The',
      'learning one.</p>',
      '<p>Strachey on the Manchester draughts programme, and his 1954 piece for',
      'the general reader.</p>',
      '<p>Turing on chess. Everyone cites this and I am not convinced everyone has',
      'read it.</p>',
      '<h2>A note on why games</h2>',
      '<p>The standard answer is that a game has rules you can write down, a',
      'position you can score, and a result you cannot argue with, so it is the',
      'cheapest available laboratory. The less standard answer is that a game is a',
      'thing a machine and a person can do TOGETHER, which none of the other',
      'candidate tasks are, and that this is why the results were so much more',
      'unsettling than anybody expected them to be.</p>',
      '<hr>',
      '<p><small>maintained by the seminar convenor. Page last touched a while',
      'ago; the Franklin Institute page numbers are from my own offprint so they',
      'should be right.</small></p>',
    ],
  },

  // ---- Weizenbaum: the counter-argument -----------------------------------
  {
    domain: 'listserv.cmu.edu',
    name: 'AI-HIST',
    title: 'AI-HIST digest — Weizenbaum thread',
    body: [
      '<h1>AI-HIST Digest</h1>',
      '<p><small>archived thread · quoting has not survived the archiver</small></p>',
      '<hr>',
      '<h2>Subject: Re: Re: appearing vs being (was: ELIZA again)</h2>',
      '<p>&gt; &gt; the point of the 1962 Datamation piece is right there in the',
      '&gt; &gt; title. HOW TO MAKE A COMPUTER APPEAR INTELLIGENT. Appear.</p>',
      '<p>&gt; yes but he wrote it before ELIZA so you cannot read it as a</p>',
      '<p>&gt; retraction of ELIZA</p>',
      '<p>Nobody said retraction. The order is the interesting part. He worked out',
      'how cheap the appearance was FIRST, and then built the thing that gave',
      'people the appearance, and then spent the rest of his career on what',
      'happened next. ELIZA is 1966, CACM. The secretary story is in the later',
      'book and I am not going to retype it again.</p>',
      '<p>&gt; the program is a hundred lines and a table of patterns</p>',
      '<p>That IS the argument. It matches what you typed against patterns and',
      'turns it back at you. There is nothing in it that knows anything. And it',
      'worked, on people who had been told exactly how it worked, which is the',
      'part that bothered him and should bother you.</p>',
      '<p>&gt; so what is the criterion then</p>',
      '<p>There is not one, and that is his point, and it is why he is filed under',
      'philosophy by people who would rather not deal with him. You cannot tell',
      'from the outside. You can only read the source, and most people never',
      'will, and the ones who do still fall for it.</p>',
      '<hr>',
      '<p><small>[digest ends] [4 messages in this thread] [next thread]</small></p>',
    ],
  },

  // ---- the 1983 film -------------------------------------------------------
  // Described, never quoted. It is somebody's film.
  {
    domain: 'wardialer.tripod.com',
    name: 'WARDIALER',
    title: 'The 1983 one — a fan page',
    body: [
      '<h1>The 1983 One</h1>',
      '<p><small>under construction · best viewed at 640x480</small></p>',
      '<hr>',
      '<h2>Why this film and not the other ones</h2>',
      '<p>Because it is the only one where the machine is not evil. It is doing',
      'what it was built to do, correctly, at the wrong time and about the wrong',
      'thing, and nobody in the film can talk it out of that because talking is',
      'not how it takes input.</p>',
      '<h2>The ending, without spoiling it</h2>',
      '<p>The machine is not beaten, argued with, or unplugged. It is given a',
      'game it cannot win and allowed to play it out, over and over, at its own',
      'speed, until it has exhausted the thing. What it arrives at, it arrives at',
      'by itself, from the playing. Nobody tells it.</p>',
      '<p>People remember the last line. What I think is better is the several',
      'minutes before it, where the room just watches a machine run the same',
      'small game to the end again and again and understands before it does.</p>',
      '<h2>The bit that is actually true</h2>',
      '<p>Machines really did learn by playing themselves, and they were doing it',
      'in the fifties, not the eighties. Look up Samuel and the checkers work.',
      'The film did not invent that idea, it just found the right room to put it',
      'in.</p>',
      '<hr>',
      '<p><small>[HOME] [LINKS] [SIGN MY GUESTBOOK] · guestbook is broken,',
      'sorry, the CGI host went away</small></p>',
    ],
  },

  // ---- finite state machines ----------------------------------------------
  {
    domain: 'fsm.cs.rochester.edu',
    name: 'FSM-NOTES',
    title: 'Finite state machines — lecture notes',
    body: [
      '<h1>Finite State Machines</h1>',
      '<p><small>CS lecture 4 · handout · diagrams redrawn by hand',
      'because the plotter is broken</small></p>',
      '<hr>',
      '<h2>The whole idea</h2>',
      '<p>A machine that is in exactly one STATE at a time, and moves to another',
      'state when something happens. That is all. The something is an input, the',
      'move is a TRANSITION, and the transition may be guarded: it fires only if',
      'a condition holds.</p>',
      '<p>You draw it as circles and arrows. You can hold the whole behaviour of a',
      'machine in your head this way, which you cannot do from the code, and this',
      'is the single best reason to draw the diagram before you write anything.</p>',
      '<h2>What the diagram shows you that the code does not</h2>',
      '<p>REACHABILITY. Once it is drawn you can see, immediately, whether there',
      'is any path from where the machine starts to a given state. In source this',
      'is genuinely hard to see: the states are scattered across functions, the',
      'transitions are buried in conditionals, and a state with nothing leading',
      'into it looks exactly like a state with something leading into it.</p>',
      '<p>An unreachable state is not a syntax error. It compiles. It runs. It',
      'sits there for the life of the program doing nothing, and it is a perfectly',
      'ordinary thing to find in code that has been maintained for years by',
      'people who are no longer there.</p>',
      '<h2>Exercise 4.3</h2>',
      '<p>Given the transition table overleaf, list the states reachable from the',
      'initial state. Then list the ones that are not, and say for each one what',
      'you think it was for.</p>',
    ],
  },

  // ---- Agre: capture ------------------------------------------------------
  // UCLA GSE&IS is where Agre actually was, which makes the address real.
  {
    domain: 'dlis.gseis.ucla.edu',
    name: 'PAGRE',
    title: 'Philip E. Agre — papers',
    body: [
      '<h1>Philip E. Agre</h1>',
      '<p><small>Department of Information Studies · papers, mostly as',
      'PostScript, some links rotted</small></p>',
      '<hr>',
      '<h2>Surveillance and Capture: Two Models of Privacy</h2>',
      '<p><i>The Information Society</i>, 1994. [ps] [ps.gz — link dead]</p>',
      '<p>Argues that the privacy debate has exactly one metaphor in it, and that',
      'the metaphor is wrong for most of what is actually happening.</p>',
      '<p>The SURVEILLANCE model is visual: watching, the eye, the state, the',
      'file on the individual. It is territorial and it is centralised and it is',
      'what everybody pictures.</p>',
      '<p>The CAPTURE model is linguistic and it is what he thinks is really going',
      'on. Activity is not merely observed. It is REORGANISED so that it can be',
      'represented at all: a grammar of action is imposed on the work, the work is',
      'restructured until it fits the grammar, and the fitting is the point. The',
      'people doing it are not police. They are systems designers, and they are',
      'usually solving a scheduling problem.</p>',
      '<p>The consequence he draws, and it is the uncomfortable one: you can be',
      'captured without being watched by anyone at all, and you will find it much',
      'harder to object, because nothing was hidden from you and you filled in the',
      'form yourself.</p>',
      '<h2>Toward a Critical Technical Practice</h2>',
      '<p>On trying to reform AI from inside it, and on what it costs. Written by',
      'somebody who did the work before deciding the work needed arguing with,',
      'which is rarer than it should be.</p>',
      '<h2>Other</h2>',
      '<p>Notes, a mailing list I run, and a long piece on how to help somebody',
      'use a computer. [index — 403]</p>',
    ],
  },

  // ---- Conway's Life ------------------------------------------------------
  // Seeded here because the same rule runs on CALYPSO's floor when nobody is
  // standing on it (F2a). The page never says so. What it DOES say, and this is
  // the hint if a player wants one, is that a random Life runs down: it settles
  // into ash, blocks and blinkers, and stops. A floor that has been going for
  // seven years is a floor somebody is feeding.
  {
    domain: 'lifepatterns.tripod.com',
    name: 'LIFEPATTERNS',
    title: "Conway's Game of Life — patterns and notes",
    body: [
      '<h1>The Game of Life</h1>',
      '<p><small>a pattern collection · maintained badly · best viewed at 800x600',
      'in anything at all</small></p>',
      '<hr>',
      '<p>[IMAGE: glider.gif — a five-cell pattern, four frames. Not loading.]</p>',
      '<h2>The rule</h2>',
      '<p>A grid of cells, each one live or dead. Every generation, all at once:</p>',
      '<p>A live cell with two or three live neighbours lives on.</p>',
      '<p>A dead cell with exactly three live neighbours comes alive.</p>',
      '<p>Everything else dies, or stays dead.</p>',
      '<p>That is the entire specification. It fits on a postcard and people have',
      'been finding things in it for twenty-five years.</p>',
      '<h2>Where it comes from</h2>',
      '<p>John Conway, at Cambridge, working it out on a Go board with a group of',
      'people and a lot of stones. Published in Martin Gardner\'s Mathematical',
      'Games column in <i>Scientific American</i>, October 1970, which is how',
      'nearly everybody heard about it.</p>',
      '<p>It is a CELLULAR AUTOMATON, which is an older idea — von Neumann and',
      'Ulam at Los Alamos, chasing a machine that could build a copy of itself.',
      'Von Neumann\'s version needed twenty-nine states per cell. Conway\'s needs',
      'two, and does not obviously need to be able to do anything at all, and can.</p>',
      '<h2>Patterns worth knowing</h2>',
      '<p>THE GLIDER. Five cells that walk diagonally across the board forever,',
      'one cell every four generations. Richard Guy spotted it in 1970 while the',
      'rule was still being argued about. It is the thing everybody draws.</p>',
      '<p>THE R-PENTOMINO. Five cells in a shape you would not look at twice. It',
      'runs for eleven hundred and three generations before it settles, throws',
      'off gliders in six directions on the way, and there was no way to know',
      'that except by running it.</p>',
      '<p>THE GLIDER GUN. Conway offered fifty dollars for a pattern that grows',
      'without limit, and thought there might not be one. Bill Gosper\'s group at',
      'MIT found a gun in November 1970 — a thing that sits still and fires a',
      'glider every thirty generations, forever. That is the fifty dollars gone',
      'and the question with it.</p>',
      '<h2>What actually happens if you just fill the board at random</h2>',
      '<p>It gets very busy, and then it runs down. Whatever density you start at',
      '— a third live, half, it makes little difference — the population crashes',
      'in the first hundred generations or so and keeps sagging, and after a few',
      'hundred more you are left with ASH: a scatter of little still things,',
      'mostly blocks and beehives, and blinkers going on and off in place.</p>',
      '<p>A board of ash is not dead. It is worse than dead: it twitches. Every',
      'blinker is still obeying the rule perfectly and nothing is ever going to',
      'happen again.</p>',
      '<p>Which means a Life that has been running a long time and is still full',
      'of things is not a Life that was left alone. Something is putting cells',
      'back. This is not a deep observation, but it took me an embarrassing',
      'number of evenings to arrive at it.</p>',
      '<h2>Running it</h2>',
      '<p>Here it is in ML. Not what anyone would choose, but the rule comes out',
      'as four lines and it reads like the rule, which is the whole argument for',
      'writing it that way.</p>',
      '<p>Two things I got wrong first, so you do not have to. Keep the board as',
      'a list of STRINGS, one row each. A list of integers is prettier and it',
      'will not run, because nth walks the list from the start every time you ask',
      'and it is asked nine times a cell. And do not fetch a row by nth either,',
      'for the same reason — walk them THREE AT A TIME, the one above, the one',
      'you are working out, and the one below, and never index the list at all.</p>',
      '<p><b>life.ml</b></p>',
      '<pre>',
      'val w = 12',
      'val h = 8',
      '',
      'fun cell (row, x) =',
      '      if x &lt; 0 orelse x &gt;= w then 0',
      '      else if String.sub (row, x) = #"#" then 1 else 0',
      '',
      'fun three (row, x) = cell (row, x-1) + cell (row, x) + cell (row, x+1)',
      '',
      'fun rule (c, n) =',
      '      if c = 1 then (if n = 2 orelse n = 3 then #"#" else #".")',
      '      else (if n = 3 then #"#" else #".")',
      '',
      'fun newRow (above, cur, below) =',
      '      String.implode (List.tabulate (w, fn x =&gt;',
      '        rule (cell (cur, x),',
      '              three (above, x) + three (cur, x) + three (below, x)',
      '                - cell (cur, x))))',
      '',
      'val blank = String.implode (List.tabulate (w, fn _ =&gt; #"."))',
      '',
      'fun walk (a, c, []) = [newRow (a, c, blank)]',
      '  | walk (a, c, n :: more) = newRow (a, c, n) :: walk (c, n, more)',
      '',
      'fun step [] = []',
      '  | step (r :: rs) = walk (blank, r, rs)',
      '',
      'fun draw b = String.concatWith "\\n" b',
      '</pre>',
      '<p>A word about machines. This wants more room to run than a pocket',
      'machine will give you — most of them stop a program after a fixed amount',
      'of work, and one generation of a board worth looking at is already past',
      'it. On anything with a proper terminal it is fine. On a handheld, expect',
      'to be cut off, and do not conclude you have typed it in wrong.</p>',
      '<p>[IMAGE: rpent.gif — 1103 generations, animated, 400K. You do not want',
      'this on a modem and I do not want the bandwidth bill.]</p>',
    ],
  },
];
