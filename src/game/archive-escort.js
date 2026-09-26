// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// hack_nostos: a homepage of working field programs. Every sample on it runs as
// printed; each was checked against ai_ml.js `decide` before it went on the
// page (calm, sighted, far, flat). The senses are baseSense in robots.js, the
// intents T1_CAN and friends, and `defend` is the escort in updateEscort.

const P = (dom, name, title, body) => ({ domain: dom, name, title, body });

const HACK = P('hack_nostos.geocities.ws', 'HACK_NOSTOS',
  'hack_nostos :: brain code for the machines', [
    '<!--bg:codeterm-->',
    '<h1>hack_nostos</h1>',
    '<p><small>brain code for the machines on this island. kept by Ronnie.</small></p>',
    '<hr>',
    '<p>Every machine out there runs a short program, and it will read it to',
    'anybody who asks. It is called <code>program.ml</code>. You can take it off',
    'the wire, read it, write the machine a different one and send it back.',
    'These are mine. All of them run as printed.</p>',

    '<h2>How a brain works</h2>',
    '<p>The program is one expression. The machine works it out about four times',
    'a second, and what comes out is an <b>intent</b>, the thing it does next:</p>',
    '<pre>patrol   walk its beat          hunt     close on you and strike',
    'home     back to its tower      flee     get away from you',
    'wait     stand still            route    walk a set path',
    'follow   keep station on you    defend   keep station, and go for',
    '                                         anything that comes for you</pre>',
    '<p>To choose, it reads its <b>senses</b>. These are the ones worth knowing:</p>',
    '<pre>charge       its cell, 0 to 100',
    'range        how far away you are',
    'threat       true when it has you in sight',
    'hurt         true when its hull is badly damaged',
    'integrity    its hull, 0 to 100',
    'home_range   how far it is from its tower',
    'linked       true while its tower is standing</pre>',
    '<p>A Wi-Fi block hides you from these as well as from the hunters. With one',
    'running, <code>threat</code> is false and <code>range</code> reads as very',
    'far, so write for that if you carry one.</p>',
    '<p>Three <b>service aids</b> go in front of the choice, joined with',
    '<code>;</code>. They change nothing about what the machine does. They help',
    'you tell it apart from the rest.</p>',
    '<pre>eye "white"   the lamp: red amber green blue white off',
    'flash 4       flashes a second; 0 is steady',
    'beep          one buzz</pre>',
    '<p>Anything between <code>(*</code> and <code>*)</code> is a comment.',
    '<code>let near = 3 in</code> gives a number a name for the lines below it.</p>',

    '<h2>Putting one on a machine</h2>',
    '<p>From the NostBook, standing near enough that it can hear you:</p>',
    '<pre>ifconfig wifi0 up',
    'arp -a                    (* the names in radio range *)',
    'get w4_07 &gt; mine.ml      (* its own program, to read first *)',
    'pico mine.ml              (* write yours over it, save *)',
    'post mine.ml w4_07        (* send it back *)',
    'post mine.ml w4_*         (* or every W-4 in range *)</pre>',
    '<p>Use the name <code>arp</code> gives you, not mine. Guards will not take a',
    'program. You get a 403 and the words foundry-sealed firmware.</p>',

    '<h2>bodyguard.ml</h2>',
    '<pre>(* bodyguard.ml -- walks with you and fights for you *)',
    'eye "white" ; flash 0 ;',
    'if charge &lt; 15 then home',
    'else if threat then (flash 4 ; defend)',
    'else defend</pre>',
    '<p>The one I use. <code>defend</code> keeps it at your side, and when a',
    'machine comes for you it goes for that machine. A W-4 or a T-3 shoots from',
    'range; the rest close in and strike. The eye is white, which the estate',
    'never uses, so you can pick yours out of a crowd. It flashes when it has you',
    'in sight. When its cell drops below 15 it goes home to charge, and then it',
    'comes back to you.</p>',

    '<h2>dog.ml</h2>',
    '<pre>(* dog.ml -- company, no teeth *)',
    'eye "white" ;',
    'if charge &lt; 15 then home',
    'else follow</pre>',
    '<p>Follows you and does nothing else. It will not fight for you. It is the',
    'one to start with, because nothing that goes wrong with it can hurt you.</p>',

    '<h2>leash.ml</h2>',
    '<pre>(* leash.ml -- follows, but only so far *)',
    'let near = 3 in',
    'let gone = 14 in',
    'eye "white" ;',
    'if charge &lt; 15 then home',
    'else if range &gt; gone then home',
    'else if range &gt; near then follow',
    'else wait</pre>',
    '<p>Two numbers do the work. Closer than <code>near</code> and it stands still.',
    'Further than <code>gone</code> and it gives up and goes home. Carry a Wi-Fi',
    'block and it reads you as far away and goes straight home, so use dog.ml',
    'if you carry one.</p>',

    '<h2>doorbell.ml</h2>',
    '<pre>(* doorbell.ml -- rings when you come into sight *)',
    'if threat then (eye "red" ; flash 6 ; beep ; wait)',
    'else (eye "green" ; flash 0 ; patrol)</pre>',
    '<p>Walks its beat with a green eye. When you come into sight it stops, goes',
    'red, flashes and buzzes. Put it on a machine near a place you sleep and you',
    'can hear it from inside.</p>',

    '<h2>shy.ml</h2>',
    '<pre>(* shy.ml -- will not come near you *)',
    'eye "blue" ;',
    'if threat then flee',
    'else if charge &lt; 15 then home',
    'else patrol',
    '</pre>',
    '<p>A hunter with the hunt taken out. When it sees you it runs. The rest of',
    'the time it walks its beat as if nothing had changed.</p>',

    '<h2>lighthouse.ml</h2>',
    '<pre>(* lighthouse.ml -- a light to walk back to *)',
    'eye "amber" ; flash 1 ;',
    'wait</pre>',
    '<p>Stands where it is and flashes amber once a second, all night. Put one on',
    'a hill above somewhere you want to find again.</p>',

    '<hr>',
    '<p>The network files what you post as unsigned, and the machine\'s own page',
    'says so afterwards. Everything the machines wrote is signed.</p>',
    '<p><small>more on the language in the',
    '<a href="stunlaw.blogspot.com/development-guide">development guide</a>.',
    'the works history of the T-1 program is on any NostBook: sccs prs',
    '/usr/src/robots/s.pursuit.ml. programs as poems, fights between them and',
    'the rest are on <a href="hypertext-ring.geocities.ws">the hypertext ring</a>.',
    '-- Ronnie</small></p>',
  ]);

export const ESCORT = [HACK];
