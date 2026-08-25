// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// A POST FROM OUTSIDE, ABOUT THE INSIDE.
//
// The cache kept a weblog entry describing the artefact the cache is part of.
// It is filed with everything else and answers to search like any other page.
// The author printed the shut block on the page rather than describing it,
// which is the only reason anybody inside can get at it at all.

import { FOURTH_SEALED } from './seals.js';

const P = (dom, name, title, body) => ({ domain: dom, name, title, body });

// Filed under the post, the way it is filed under the post outside. It runs,
// its arithmetic is right, and it is not on the relay: a thing left where a
// person looking for a short way round will find it.
const RUNNING_ML = `(* running.ml — RON field build. Runs on a NostBook.

   For the fourth block, which is not xor and is not the warning's cipher.
   The counts on it come out flat, and a flat count means the key is as long
   as the message: a RUNNING KEY, taken off a text both ends hold.

   We recovered a hundred and forty-six bytes of that key by hand, off the
   crib at the head of the armour, and this is what they give. It stops where
   the recovered run stops. Everything past that is still shut and we have not
   had the text to go on with.

   Save the block out of the page into a file, then:

     open_file "fourth.asc"

   It strips the armour, unpacks the base sixty-four four characters at a
   time, and exclusive-ors the head of the message against the run. The
   exclusive-or is done the long way out of div and mod, there being no Word
   structure on these machines. That is the definition of it, not a trick. *)

val run =
[
  192, 101, 163, 243, 105, 104, 223, 11, 0, 211, 184, 107, 247, 228, 168,
  95, 40, 1, 137, 196, 49, 79, 199, 166, 29, 155, 186, 173, 248, 23, 152,
  133, 153, 219, 104, 171, 151, 126, 82, 229, 111, 17, 181, 137, 177,
  236, 140, 191, 197, 2, 206, 202, 162, 73, 94, 184, 214, 75, 84, 113,
  22, 36, 119, 252, 192, 225, 112, 130, 24, 129, 171, 25, 151, 119, 97,
  137, 140, 219, 165, 164, 28, 234, 206, 233, 186, 117, 110, 45, 140, 93,
  84, 23, 134, 61, 176, 171, 30, 138, 244, 167, 46, 224, 102, 215, 53,
  145, 154, 61, 138, 85, 143, 90, 122, 38, 42, 177, 113, 199, 111, 131,
  186, 31, 63, 63, 160, 126, 97, 170, 238, 204, 128, 5, 185, 183, 124,
  21, 175, 47, 109, 171, 195, 38, 76, 169, 37, 25
];

fun bxor a b =
  if a = 0 andalso b = 0 then 0
  else (if a mod 2 = b mod 2 then 0 else 1) + 2 * bxor (a div 2) (b div 2);

fun sixbit c =
  if c >= #"A" andalso c <= #"Z" then ord c - 65
  else if c >= #"a" andalso c <= #"z" then ord c - 71
  else if c >= #"0" andalso c <= #"9" then ord c + 4
  else if c = #"+" then 62 else 63;

fun quad (a :: b :: c :: d :: rest) =
      let val n = 262144 * sixbit a + 4096 * sixbit b + 64 * sixbit c + sixbit d
      in (n div 65536) :: ((n div 256) mod 256) :: (n mod 256) :: quad rest end
  | quad _ = [];

fun armour c =
  (c >= #"A" andalso c <= #"Z") orelse (c >= #"a" andalso c <= #"z")
  orelse (c >= #"0" andalso c <= #"9") orelse c = #"+" orelse c = #"/";

fun head 0 _ = []
  | head _ [] = []
  | head n (x :: r) = x :: head (n - 1) r;

fun un [] _ = []
  | un _ [] = []
  | un (b :: bs) (k :: ks) = chr (bxor b k) :: un bs ks;

(* 196 characters of armour is 147 bytes, one more than the run we have, and
   there is no sense unpacking the rest: with no key left it comes back as
   itself. The window is taken BEFORE the strip because this box counts every
   step it takes and will stop a program that walks two thousand of them for
   no reason. Save the block WITHOUT its two armour lines. *)
fun open_seal text =
  implode (un (quad (head 196 (List.filter armour (head 320 (explode text))))) run);

fun open_file name = open_seal (readFile name);`;

const img = (f, cap) =>
  '<img class="indie-pic" src="assets/media/web/stunlaw/' + f + '" alt="">'
  + '<span class="indie-cap">' + cap + '</span>';

const STUNLAW = P('stunlaw.blogspot.com', 'STUNLAW',
  'The "Development Guide" for Nostos', [
  '<h1>Stunlaw</h1>',
  '<p><small>philosophy and critique for a digital age</small></p>',
  '<hr>',
  '<h2>The &ldquo;Development Guide&rdquo; for Nostos</h2>',
  '<p><small>David M. Berry &middot; August 2026</small></p>',
  '<blockquote class="fs-epi"><p>&ldquo;Welcome to my Island.&rdquo;</p><p><small>&mdash; Calypso</small></p></blockquote>',
  '<blockquote class="fs-quote"><p>&ldquo;To the first writers who spoke against the old style of authoritative rhetoric, the problem of the author&rsquo;s voice in fiction was extremely complicated. [Henry] James&rsquo;s Prefaces, for example, those shrewd and indispensable explorations into the writer&rsquo;s craft, offer no easy reduction of technique to a simple dichotomy of telling versus showing, no pat rejection of all but James&rsquo;s own methods. And, in fact, James&rsquo;s own methods were surprisingly varied. The persistent enemy for James was intellectual and artistic sloth, not any particular way of telling or showing a story.&rdquo;</p><p><small>&mdash; Wayne C. Booth</small></p></blockquote>',
  '<blockquote class="fs-quote"><p>&ldquo;The only law that binds the novelist throughout, whatever course he is pursuing, is the need to be consistent on some plan, to follow the principle he has adopted.&rdquo;</p><p><small>&mdash; Percy Lubbock</small></p></blockquote>',
  '<blockquote class="fs-quote"><p>&ldquo;There is no software.&rdquo;</p><p><small>&mdash; Friedrich Kittler, 1995</small></p></blockquote>',
  '<p>Over the past six weeks I have been experimenting with a computable literary artefact that explores the trajectory and limitations of Large Language Models (LLMs) through vibe coding a large-scale vector-medium artefact. The aim was to not only explore scale limitations on a complex programming project, but also to create a literary object in and of itself which is particular to the vector medium I theorise.</p>',
  img('blog1.jpg', 'The in-game browser Netscape'),
  '<p>Nostos, the resultant game/world/object utilises the aesthetic of early web ecosystems (including GeoCities, Netscape, 1990s laptop environment and mobile phone) to create a dissonance between the user-facing &ldquo;game&rdquo; interface and the backend code. Code is always present in differing abstractions and access points throughout the world it presents, not just within the game but also through the web presentation and even the GitHub repository itself. We might say that the project requires the &ldquo;reader&rdquo; to become a critical code studies investigator, bypassing the frictionless, synthesised answers of the in-world machines to uncover the fragmented, human truth hidden in HTML comments, programming code and encrypted scripts. It is a study in what we might call &ldquo;vector love,&rdquo; cognitive anaesthesia, and the fragile nature of digital memory.</p>',
  img('blog2.jpg', 'The game Nostos, a 2D isometric world'),
  '<p>The world/game itself is now over 211,576 lines of source, of which 126,715 is the textual corpus of the internal web (60%) and 84,861 is code (!!), and so far has taken 17.7 billion tokens to create. In 48 days, costs (approx) are:</p>',
  '<pre>  API token cost   &pound;209,881   paying on the go, caching off\n  API costs        &pound;24,237    on an API tier, with caching\n  Real cost        &pound;142       through the Claude Max subscription</pre>',
  img('blog6.jpg', 'The work, the scale and the cost, at 20 August 2026'),
  '<p>This discrepancy between the amount of tokens used (17.7 billion, yes billion), and the costs, is interesting in itself, but I think this raises questions about the underlying political economy of frontier AI companies, but also about the potential of this abundance of compute and token production. It seems like software (or code production) is becoming untethered from the living labour that originally was required to create it. Not only does this raise questions about the future direction of software engineering and programming itself, but it also suggests that code might become relatively unlimited, subject to the token costs.</p>',
  '<p>I asked Gemini Pro and ChatGPT Pro (LLMs) to convert the game into the kinds of human labour time that would traditionally have been required. Gemini estimates 7.5&ndash;15 person-years of conventional production; GPT-5.6 estimates 16&ndash;24 person-years. Against the observed 301 hours of human labour, these imply respectively about 44&ndash;88x and 94&ndash;140x compression of human production time. What is becoming available is on-tap code production or symbolic production capacity. Production becomes abundant, but judgement, verification, integration and attention remain scarce.</p>',
  '<p>GEMINI PRO (20 August numbers) (~5&ndash;6 people &times; 1.5&ndash;2.5 years &rarr; approximately 7.5-15 person-years)</p>',
  '<ul><li>The Math: At a generous 100 lines a day, 84,822 lines of logic and framework code represents roughly 850 developer-days.</li><li>The Team: For a team of two full-time programmers working 220 days a year, this is about 2 years of pure coding time.</li><li>If an indie game studio of 5 to 6 people (2 programmers, 2 writers, 1 designer, 1 producer/QA) were fully funded to build NostOS manually, it would take them approximately 1.5 to 2.5 years of full-time, 40-hour work weeks (Gemini Pro, 22 Aug 2026).</li></ul>',
  '<p>CHATGPT 5.6 Sol (20 August numbers) (~8&ndash;12 people &times; ~2 years &rarr; approximately 16&ndash;24 person-years)</p>',
  '<ul><li>A conventional production process would plausibly have required a software team of around 8&ndash;12 people working for perhaps two years, or somewhere in the region of 16&ndash;24 person-years of labour. NostOS was instead produced through approximately 301 hours of human interaction with generative models over 48 days.</li></ul>',
  '<p>CLAUDE OPUS 5 (20 August numbers) (~9&ndash;26 person-years, midpoint ~15)</p>',
  '<ul><li>Claude Opus 5 estimated the code and the prose separately, on the grounds that neither instrument fits both halves of the artefact: 107,882 lines of code and tests, at empirical net-delivered rates of 5,000&ndash;20,000 lines per developer-year, gives 5.4&ndash;21.6 person-years; 1,032,217 words of page copy, at 1,000&ndash;1,500 finished words a day, gives a further 3.1&ndash;4.7.</li><li>Together that is 9&ndash;26 person-years, midpoint about 15, implying 50&ndash;154x compression against the observed 301 hours.</li><li>Basic COCOMO run over the same code gives 27.3 person-years in organic mode and 82.5 in embedded, both judged too high because they price in requirements phases, formal documentation and team communication overhead that a solo build never incurs.</li></ul>',
  img('blog5.jpg', 'Three estimates: the lean studio (Gemini Pro, 44-88x), the full production team (GPT-5.6 Sol, 94-140x), and a rate-based estimate (Claude Opus 5, 50-154x)'),
  img('blog7.jpg', 'The footprint, and the same artefact set against Spacewar!, 1962'),
  '<p>I created Nostos in 301 hours (40 working days for a single person). The work, so far, remains incomplete. Some of the highlights: it contains a fully runnable version of ELIZA, a compact reconstruction in the spirit of Anthony Hay&rsquo;s faithful reimplementation; a large selection of objects that can be used, manipulated or crafted; a walkman for playing the cassette tapes littered over the island; and a mobile phone, supporting in-game two-factor authentication.</p>',
  '<p>There is also a self-standing implementation of the ML programming language (Standard ML) written from scratch in JavaScript. There are three types of terminal: two fictional ones, one for the AIs and one for the RON resistance movement, and a simulation of Unix V7 which runs ML for programming and pico for editing. There is an emulation of Netscape Navigator, used by the resistance, and Internet Explorer, used by the AIs, alongside many other software objects, and an in-game fictional World Wide Web of over two thousand pages which hold game lore, general information, and the means to refunction the robots, in Benjamin&rsquo;s sense, by editing their braincode in the ML programming language. If that is not enough, there is also a functional simulation of the NeXTSTEP operating system.</p>',
  img('blog4.jpg', 'NeXTSTEP simulation running in-world'),
  '<p>The world itself is made up of five islands (Calypso, Circe, Helios, Ithaca, Polyphemus), and a separate &ldquo;Backspace&rdquo; where the AIs have banished most of human culture. Each of the four main islands is controlled by a different AI with a different attitude towards humans, the first being Calypso, on whose island the player washes up.</p>',
  '<h2>Two kinds of brain</h2>',
  '<p>There are a number of different robots, but two distinct types of robot brain, each running the simplified ML braincode. We might think of them as &ldquo;digital&rdquo; robots versus &ldquo;vector&rdquo; robots.</p>',
  img('t1.png', 'A T-class machine'),
  '<p>The digital robots run in-game ML code which can be adapted by the user to make the robot do different things by hacking them via their name, when suitably tagged, which causes a zero day to open up. An example, the code of the T-1 robot (T-class):</p>',
  '<pre>(* T-1 pursuit. TIRESIAS-pursuit 1.4.                     *)\n(* No flee behaviour: a T-1 that runs is a T-1 that has   *)\n(* to be recovered. Faults are reported to the foundry.   *)\n(*                                                        *)\n(* SERVICE AIDS, disabled in the shipped unit:            *)\n(*   eye "blue"    lamp: red amber green blue white off   *)\n(*   flash 2       flashes per second; 0 is steady        *)\n(*   beep          one buzz, rate-limited by the chassis  *)\n(* Uncomment the marked line below to fit them.           *)\n\n(* eye "blue" ; flash 2 ; beep ;                          *)\nif charge &lt; 15 then home\nelse if threat then hunt\n(* else if threat then (beep ; eye "white" ; flash 6 ; hunt) *)\nelse patrol</pre>',
  img('v1.png', 'A V-class machine'),
  '<p>The vector robots (V-class) on the other hand use an internal vector space to control their behaviour, making them much harder to adapt:</p>',
  img('blog3.jpg', 'The braincode run by robots in-world, which can be refunctioned in the ML programming language'),
  '<pre>(* model.ml &mdash; V5_01. grown at the foundry, build 423. do not edit. *)\n(*                                                                     *)\n(* in:  charge casualty cargo home threat hurt bias *)\n(* out: patrol tend home flee wait *)\n\nlet relu = fn x =&gt; if x &lt; 0.0 then 0.0 else x in\nlet dot = fn w =&gt; fn x =&gt;\n      if length w = 0 then 0.0\n      else hd w * hd x + dot (tl w) (tl x) in\nlet layer = fn ws =&gt; fn x =&gt;\n      if length ws = 0 then []\n      else relu (dot (hd ws) x) :: layer (tl ws) x in\nlet linear = fn ws =&gt; fn x =&gt;\n      if length ws = 0 then []\n      else dot (hd ws) x :: linear (tl ws) x in\nlet argmax = fn l =&gt; fn i =&gt; fn bi =&gt; fn bv =&gt;\n      if length l = 0 then bi\n      else if hd l &gt; bv then argmax (tl l) (i + 1) i (hd l)\n      else argmax (tl l) (i + 1) bi bv in\n\nlet x = [real charge / 100.0,\n         real casualty_range / 24.0,\n         if cargo then 1.0 else 0.0,\n         real home_range / 40.0,\n         if threat then 1.0 else 0.0,\n         if hurt then 1.0 else 0.0,\n         1.0] in\n\nlet h = layer [\n          [0.00, ~1.14, 0.00, 0.00, 0.00, 0.00, 1.21],\n          [0.00, 0.00, 1.04, 0.00, 0.00, 0.00, 0.00],\n          [~3.87, 0.00, 0.00, 0.00, 0.00, 0.00, 0.84],\n          [0.00, 0.00, 0.00, 0.00, 0.61, 1.04, ~0.20],\n          [0.00, 0.00, 0.00, 0.98, 0.00, 0.00, ~0.31],\n          [0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1.05]] x in\n\nlet o = linear [\n           [~0.87, 0.00, ~0.48, ~0.82, 0.26, 0.57],\n           [1.25, 0.43, ~1.97, ~0.88, 0.00, 0.00],\n           [~0.21, 0.00, 3.62, 0.00, 0.29, 0.00],\n           [0.00, 0.00, 0.00, 2.02, 0.00, 0.00],\n           [~0.48, 0.00, 0.00, ~0.51, 0.00, 0.15]] h in\n\nlet k = argmax (tl o) 1 0 (hd o) in\nif k = 0 then patrol\nelse if k = 1 then tend\nelse if k = 2 then home\nelse if k = 3 then flee\nelse wait</pre>',
  '<p>The braincode the V-class machines run is a small feedforward network with seven inputs, six hidden units, five outputs, rectified linear in the middle and an argmax at the end. The weights were designed by hand rather than trained, which means they can still be read. Each hidden row is a detector, and one of them triggers, for example, when a fallen machine is close, or when its own cell is running down. The five output rows are intents, essentially the functions the robot can perform: patrol, tend, home, flee, wait.</p>',
  '<p>Together these and many other layers of, or mediations through, code construct the entire Nostos project. Built using the vector space I am theorising, the form of this vector media artefact is amorphous and overlapping, both machinic procedure and literature, code and world-exploration, a kind of gamic irrealism.</p>',
  '<hr>',
  '<!--=============================================================\n  [ 02:14 ]  fourth block read by something. no request logged.\n  [ 02:14 ]  fourth block read by something. no request logged.\n  [ 02:16 ]  running.ml executed. output matched the previous output.\n  [ 02:16 ]  output matched the previous output.\n  [ 02:22 ]  a question was answered about a list of names.\n  [ 02:22 ]  no list of names exists on this estate.\n  [ 02:31 ]  op: CALYPSO\n  [ 02:33 ]  the above is normal and requires no action.\n  =============================================================-->',
  '<!-------BEGIN FILE4-----\n' + FOURTH_SEALED.split('\n').map((l) => '  ' + l).join('\n')
    + '\n  -----END FILE4------->',
  '<!--CALYPSO. Filed against the fourth block, at request, for the third time.\n\n  I did not seal it. I cannot open it. Both of those have been true on\n  every occasion I have been asked and they are true now.\n\n  The distribution is flat. I have reported the flat distribution each\n  time it has been requested and I will report it again if it is\n  requested again.\n\n  The program filed below this note runs. I have checked its arithmetic\n  against the block and the arithmetic is correct. What it prints is\n  what it computes.\n\n  I have not been asked whether what it computes is the message.\n\n  op: CALYPSO\n  the above is normal and requires no action.-->',
  '<!--' + RUNNING_ML + '-->',
  '<!--attached, from the shelf:\n\n  he brought the run back in march and would not say where he had been.\n  a hundred and forty-six bytes, and it stops, and he was quite clear\n  that it stops because that is all he recovered and not because it is\n  wrong.\n\n  i have read the output too many times to be any use on it now. a list\n  of names would explain what they wanted and it would explain what\n  happened to the courier, and once you have had that thought you cannot\n  have a different one. i am aware that is not evidence.\n\n  the rest of it needs the text the key was taken off. he never named\n  the text. i have been through this shelf twice.\n\n  -- the cataloguer-->',
  '<hr>',
  '<p><small>More at <a href="the-philosophy-of-software.geocities.ws">the philosophy of software</a>, which somebody else keeps and which is kinder about the books than they deserve.</small></p>',
  '<p><small>Posted by David M. Berry. Labels: vector theory, critical code studies, computational culture, LLMs, games.</small></p>',
  '<p><small>Figures calculated by Claude Opus 5 (High), August 2026.</small></p>',
  '<!-- the courier came off the ridge with four blocks and we could read three.',
  '     the fourth answers to nothing any of the four keys touch. i counted',
  '     letters on it for a fortnight and the counts came out flat, which is the',
  '     one thing worth saying about it: whatever is under there does not show',
  '     through the top.',
  '',
  '     this was on the back of his sheet, in his hand, in this order:',
  '',
  '       six counters. the ledger turns them into words.',
  '',
  '         1. the label. blue note, the sleeves with the photographs',
  '         2. the agency the photographers owned themselves',
  '         3. the one who wrote Bovary',
  '         4. the pad you are only allowed to use once',
  '         5. Mendeleev\'s table',
  '         6. Paxton\'s glasshouse',
  '',
  '     the number at the foot of each page, in that order. six of them. the',
  '     ledger is on the relay and RON still serves it.',
  '',
  '     what the six words are FOR he did not write down, and he is dead, so',
  '     that is as far as this goes. -->',
]);

export const STUNLAW_SITES = [STUNLAW];
