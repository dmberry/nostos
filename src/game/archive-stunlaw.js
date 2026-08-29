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
  '<hr>',
  '<p><small>&#9664; Older post</small></p>',
  '<hr>',
  '<h2>What Matter Who&rsquo;s Speaking?</h2>',
  '<p><small>David M. Berry &middot; first published 20 December 2025,',
  'revised 22 August 2026 to take account of recent advances in AI detection',
  'software</small></p>',
  '<blockquote class="fs-epi"><p>&ldquo;In 1950, it may have been possible to',
  'choose other paths. In the third decade of the new millennium, however, our',
  'reliance on cognitive assemblages and computational media has progressed so',
  'far that there is no going back&rdquo;</p>',
  '<p><small>&mdash; N. Katherine Hayles, 2025</small></p></blockquote>',
  '<blockquote class="fs-epi"><p>&ldquo;Though the sway of the Author remains',
  'powerful... it goes without saying that certain writers have long since',
  'attempted to loosen it&rdquo;</p>',
  '<p><small>&mdash; Roland Barthes, 1977</small></p></blockquote>',
  '<blockquote class="fs-epi"><p>&ldquo;What matter who&rsquo;s speaking,',
  'someone said, what matter who&rsquo;s speaking?&rdquo;</p>',
  '<p><small>&mdash; Michel Foucault quoting Samuel Beckett,',
  '1977</small></p></blockquote>',
  '<p>Academics are currently debating what is being called the',
  '&ldquo;provenance problem&rdquo; in regard to Large Language Models. In',
  'these discussions there seems to be an underlying anxiety that there will be',
  'some sort of breakdown in chains of scholarly citation and acknowledgement',
  'caused by artificial intelligence. In other words, there is a &ldquo;chain',
  'of custody&rdquo; for information, and we trust information because we know',
  'who said it and where it came from.</p>',
  '<p>It is notable that the discussion does not distinguish between',
  '<b>automation</b> and <b>augmentation</b>. Human creativity can be magnified',
  'when humans, augmented, become centaurs, half human and half machine.</p>',
  '<h2>Ghost-writing, and other old arrangements</h2>',
  '<p>This makes me wonder whether the term Gen AI has become too toxic in this',
  'discussion, and whether we need to think outside the technology and think',
  'about previous social and cultural practices. How much is AI text generation',
  'or augmentation similar to ghost-writing, or editing, or paying a copyeditor',
  'to help organise the text? Would it be helpful to call it',
  'ghost-in-the-machine writing, or is the AI better thought of as an',
  '<b>amanuensis</b>, or a research assistant?</p>',
  '<p>It is rare, the piece of writing that does not have different hands or',
  'eyes on it, or some level of technology applied to it.</p>',
  '<p>Nietzsche, going blind and hammering at his Malling-Hansen writing ball,',
  'wrote that <i>our writing tools are also working on our thoughts</i>',
  '(<i>Unser Schreibzeug arbeitet mit an unseren Gedanken</i>). Ironically,',
  'this appeared in a letter to Heinrich K&ouml;selitz, his assistant and',
  'friend, who transcribed and tidied his manuscripts, or as Nietzsche put it:',
  '<i>he wrote and also corrected: fundamentally, he was really the writer',
  'while I was merely the author.</i></p>',
  '<p>Kittler&rsquo;s translators observe that Nietzsche was the first German',
  'professor of philology to use a typewriter, and Kittler the first German',
  'professor of literature to teach computer programming, and that to',
  'paraphrase Nietzsche, the inscription technologies of the present have',
  'contributed to Kittler&rsquo;s thinking.</p>',
  '<h2>Why single out this one tool</h2>',
  '<p>We do not require scholars to declare their use of word processors, which',
  'increasingly incorporate LLM features in obscure ways, or spell-checkers and',
  'grammar-checkers, which have long suggested stylistic changes, or digital',
  'databases which algorithmically retrieve and rank sources, or search engines',
  'which shape what literature scholars encounter at all, or bibliographic',
  'software which automates citation and suggests related works.</p>',
  '<p>The demand to declare LLM use whilst treating other computational tools',
  'as transparent instruments seems to misunderstand the extent to which',
  'scholarly work has been softwarised since the 1990s. In Benjaminian terms it',
  'is an attempt to restore the cult value of <b>aura</b> to the manuscript.</p>',
  '<p>Every stage of contemporary academic writing is already mediated by',
  'computational processes that shape intellectual labour in ways that remain',
  'largely unexamined and undeclared. The selective anxiety about LLMs thus',
  'appears less like a principled ethical stance and more like a reaction to a',
  'threshold where the computational mediation of thought becomes uncomfortably',
  'visible.</p>',
  '<h2>An old thing made visible</h2>',
  '<p>Scholarly writing proceeds largely through assemblage and recombination,',
  'and complete attribution is impossible: the bibliography for every article',
  'and book one has ever read or consulted would be larger than the article',
  'itself. A scholar&rsquo;s &ldquo;own&rdquo; ideas were already assemblages',
  'of half-remembered readings, classroom discussions, conference',
  'conversations, theoretical frameworks absorbed and internalised.</p>',
  '<p>The notion of originality serves only to police boundaries and distribute',
  'academic capital rather than to describe the processes of knowledge',
  'production.</p>',
  '<p>Barthes: the text is <i>a tissue of citations, resulting from the',
  'thousand sources of culture</i>. The LLM is in this sense a dictionary made',
  'computational.</p>',
  '<p>Foucault: <i>the author-function is undoubtedly only one of the possible',
  'specifications of the subject... We can easily imagine a culture where',
  'discourse would circulate without any need for an author.</i></p>',
  '<h2>The Inversion, and diffusionisation</h2>',
  '<p>I have elsewhere called this the Inversion (<i>Umschlag</i>): a critical',
  'threshold where machine-generated content becomes somewhat indistinguishable',
  'from human writing but also actively reshapes our understanding of it.</p>',
  '<p>What it clashes with is <b>diffusionisation</b>, a process through which',
  'knowledge and cultural production become subject to probabilistic',
  'dissolution and reconstitution via computational processes. We cannot trace',
  'the influence of a source in generated text because the text does not',
  'contain that source&rsquo;s ideas in any recoverable form. It contains',
  'patterns that, when recombined under certain probabilistic constraints,',
  'produce outputs that may resemble that source&rsquo;s arguments.</p>',
  '<h2>The prisoner and the model of his prison</h2>',
  '<p>Calvino&rsquo;s story <i>The Count of Monte Cristo</i>, collected in',
  '<i>t zero</i>, offers the analogy I keep coming back to.</p>',
  '<p>Dant&egrave;s attempts to imagine the perfect prison, the one from which',
  'escape is impossible. His reasoning: if he succeeds, then either he has',
  'perfectly modelled his actual prison, and must accept his fate, or he has',
  'imagined a prison more secure than the real one, which means the real one',
  'has a flaw, and the flaw is where he gets out.</p>',
  '<p>Just as Dant&egrave;s uses his model to identify points of difference',
  'from reality, we might use our encounters with LLMs to identify what cannot',
  'be captured by statistical recombination. What resists diffusionisation.</p>',
  '<p>Calvino also speculates about <i>a writing machine that would bring to',
  'the page all those things that we are accustomed to consider as the most',
  'jealously guarded attributes of our psychological life</i>, and warns that',
  '<i>the more enlightened our houses are, the more their walls ooze',
  'ghosts.</i></p>',
  '<h2>The jagged frontier</h2>',
  '<p>Karpathy&rsquo;s term is <b>jagged intelligence</b>: these systems are',
  'both <i>a genius polymath and a confused and cognitively challenged grade',
  'schooler</i>. They excel where patterns are densely represented in training',
  'data and fail at tasks that seem trivial to us.</p>',
  '<p>The jaggedness is not a temporary limitation to be trained away. The',
  'unevenness shows that aspects of scholarly writing can be reduced to',
  'statistical pattern-matching, far more than we might wish to admit, and that',
  'other elements resist the reduction.</p>',
  '<p>Which turns the jagged frontier from a threat into a map.</p>',
  '<h2>Flickering signifiers</h2>',
  '<p>Hayles: where earlier theory worked with floating signifiers in a',
  'dialectic of presence and absence, information technologies foreground',
  '<i>pattern and randomness</i>. Each time we prompt, we receive a different',
  'configuration, a different assemblage of a thousand sources of culture. The',
  'text flickers between states and never settles into the material fixity that',
  'citation relies on.</p>',
  '<p>More recently she describes <b>cognitive assemblages</b>, collectivities',
  'of humans, computational media and electromechanical systems through which',
  'information, interpretations and meanings circulate. The text that emerges',
  'is created by the assemblage.</p>',
  '<h2>The detectors</h2>',
  '<p>We can see in recent attempts to use so-called AI detectors to shame',
  'authors, students and even casual writers that the author-function is being',
  'reinforced through technical means, even though these systems are themselves',
  'prone to error and hallucination, and suffer from the same black boxing that',
  'hinders our understanding of the models they are policing. They are made by',
  'private companies which seek to profit from provenance anxiety, and they',
  'build a culture of accusation.</p>',
  '<p>One of these services is still up, or was when I last looked:',
  '<a href="textprovenance.io">textprovenance.io</a>. I would encourage you to',
  'paste something of your own into it, and then to paste the same thing in',
  'again.</p>',
  '<p>People proclaim on social media their rightful ownership of the em-dash,',
  'or of the word delve, defending their human originality against the onslaught',
  'of generative writing. But as time goes by these technologies will improve',
  'until a moment when being AI-generated is considered more real than being',
  'human-created, and then the AIs will, perhaps, really own the em-dash.</p>',
  '<p>I wonder whether we should call the rejection of a claim on the grounds',
  'of its AI origin, rather than on its content, an <b>AI hominem</b>. There',
  'seem to be two kinds. <i>AI hominem ex origine</i>, the genetic fallacy,',
  'rejecting a claim because of where it came from. And <i>AI hominem ex',
  'persona</i>, attributing a personality to the machine in order to evaluate',
  'its output.</p>',
  '<h2>What to do instead</h2>',
  '<p>Rather than a static idea of provenance, a world where information had a',
  'body and authors had stable identities, we might move to <b>living',
  'provenance</b>: the processual elements of writing explored through a',
  'versioning system, a Git or a scholarly ledger, tracking the evolution of a',
  'text through its cognitive assemblage.</p>',
  '<p>There is also a shift in practice worth naming. From prompt engineering',
  'to <b>context engineering</b>, where the writer no longer asks the machine',
  'to write but constructs the informational milieu within which writing takes',
  'place, so that the question moves from <i>who wrote this?</i> to <i>who',
  'designed the context from which this emerged?</i> And perhaps beyond that to',
  '<b>signal engineering</b>: anti-probabilistic writing, a constellational',
  'style, choices made deliberately to be unlearnable.</p>',
  '<p>Foucault asks us to give up the tiresome repetitions, <i>Who is the real',
  'author? Have we proof of his authenticity and originality?</i>, and to hear',
  'new questions instead: <i>What are the modes of existence of this discourse?',
  'Where does it come from; how is it circulated; who controls it?</i> And',
  'behind all of them, he says, little more than the murmur of indifference.</p>',
  '<p>Barthes: to give writing its future, <i>the birth of the reader must be',
  'ransomed by the death of the Author</i>.</p>',
  '<hr>',
  '<p><small>Labels: provenance, authorship, LLMs, diffusionisation, the',
  'Inversion, jagged frontier, critical theory.</small></p>',
  '<hr>',
  '<h3>Notes</h3>',
  '<p><small><b>[1]</b> An analogy can be made with Wendell Berry\u2019s environmental critique. In <i>The Pleasures of Eating</i> he argues that a kind of industrial amnesia disconnects consumers from the origins of their food, and that ignorance of provenance makes people complicit in destructive systems. Responsibility, on his account, presupposes proximity and knowledge of origins. But in a globalised food system, knowing your farmer is an elite privilege unavailable to those for whom access and affordability matter more than origin. Both claims show a kind of origin-verification acting as an ideological apparatus that acknowledges and disavows the industrial systems mediating production. Under conditions of industrial and computational mediation, provenance is, perhaps, a fiction.</small></p>',
  '<p><small><b>[2]</b> Ironically, the proposal for a public declaration of LLM use in the acknowledgements does not solve the anxiety. Their own note reads: <i>During the drafting of this paper, GPT-5 and Claude Sonnet 4.5 were used to help edit and shorten a longer draft written by the authors.</i> And they advocate using LLMs, or tools like Scite or Elicit, to check whether AI-generated passages bear substantial similarity to existing scholarship. Using AI to verify AI demonstrates the infinite regression at the heart of the problem: it is LLMs all the way down.</small></p>',
  '<p><small><b>[3]</b> Automation implies the wholesale generation of text; augmentation suggests tools that enhance human capabilities. The focus on writing also overlooks what may be the more transformative use, which is AI methods for conducting the research itself: pattern recognition, large-scale text analysis, hypothesis generation. Framing the problem solely as one of writing and attribution may miss the deeper epistemological shift.</small></p>',
  '<p><small><b>[4]</b> To be fair, their conclusion does note that <i>perhaps we should be moving toward a view of scholarship that is more collaborative and diffuse by default, involving complex assemblages of humans and machines</i>. That sits uneasily with a paper otherwise focused on disclosure.</small></p>',
  '<p><small><b>[5]</b> A pragmatic response might be a threshold-based declaration on publication, not quantitative but declarative. A 30% threshold marking tools requiring a note, a 60% threshold requiring a declaration, and everything below 30% treated as standard computational infrastructure. Nested, so that an author is located within a department and an institution:</small></p>',
  '<pre class="jb-list">  AUTHOR(S): Sarah Sein, Marcus Weber\n    \u21b3 DEPARTMENT: Digital Studies, University of Sussex\n    \u21b3 COMPUTATIONAL TOOLS:\n        \u21b3 NOTABLE (&gt;30%):\n            \u21b3 Python 3.11: NLP analysis\n            \u21b3 Gemini Pro: initial brainstorming\n        \u21b3 MAJOR (&gt;60%):\n            \u21b3 N/A</pre>',
  '<p><small>This makes visible the infrastructural conditions enabling scholarship whilst preserving the author-function where it is needed, for career progression and accountability. A doctoral student can still claim an original contribution through the effective orchestration of a set of tools of inquiry: the originality includes the ability to steer them toward a question a computer could not have formulated on its own.</small></p>',
  '<p><small><b>[6]</b> Hayles, on a point of Rita Raley\u2019s: the productions of these models are unrepeatable and hence unverifiable. Repeat the same prompt and you get a different response, because the output is probabilistic. <i>Hence citation depends entirely on the assertions of the one who quotes, because they cannot be verified by anyone else.</i> Which destabilises an enterprise that has treated exact quotation as the sine qua non of acceptable work.</small></p>',
  '<p><small><b>[7]</b> Foucault: the author has played the role of regulator of the fictive, characteristic of an era of industrial and bourgeois society, of individualism and private property. It does not seem necessary that the function remain constant in form, complexity or existence. As society changes, the author-function will disappear, and fiction will function according to another mode, but still with a system of constraint, one which will no longer be the author but which will have to be determined or, perhaps, experienced.</small></p>',
  '<p><small><b>[8]</b> There is a shift in practice from prompt engineering to <b>context engineering</b>, which we might call context writing. The author no longer simply asks the machine to write but constructs the informational milieu within which writing takes place, which moves the question from <i>who wrote this?</i> to <i>who designed the context from which this emerged?</i> Under the Inversion this contextual authorship may become the primary mode. Writing may then shift toward the idiosyncratic and the counter-intuitive, toward what we might call a constellational style: anti-probabilistic writing, choices designed to be unlearnable. Perhaps a further shift from context engineering to <b>signal engineering</b>, where the writer produces non-statistical noise that generates new concepts. Under these conditions the jagged frontier becomes a space to inhabit strategically, which turns it from a threat into a map.</small></p>',
  '<p><small><b>[9]</b> Foucault\u2019s own text has an unstable provenance: at least two authorial versions and three translations, with the canonical form circulating under a description of its origin that is not wholly accurate. Set out separately at <a href=\"foucault-versions.geocities.ws\">which version are you citing?</a>, following Elden. The scholarship on the instability of Foucault\u2019s text is itself unstable.</small></p>',
  '<p><small><b>[10]</b> I wonder whether we should call the rejection of a claim on the grounds of its AI origin an <b>AI hominem</b>. Two kinds. <i>AI hominem ex origine</i>: rejecting a claim because of where it came from, the genetic fallacy. <i>AI hominem ex persona</i>: attributing a personality to the machine in order to evaluate its output.</small></p>',
  '<hr>',
  '<h3>Bibliography</h3>',
  '<p><small>Abebe, N. (2025) \u2018With the Em Dash, A.I. Embraces a Fading Tradition\u2019, <i>The New York Times</i>, 18 September.<br>',
  'Barthes, R. (1977) \u2018The Death of the Author\u2019, in <i>Image-Music-Text</i>, trans. S. Heath. London: Fontana, pp. 142\u2013148.<br>',
  'Beetlespace (2025) <i>A Proclamation Regarding the Restoration of the Dash</i>.<br>',
  'Benjamin, W. (2008) <i>The Work of Art in the Age of Mechanical Reproduction</i>. Penguin.<br>',
  'Berry, D. M. (2014) <i>Critical Theory and the Digital</i>. Bloomsbury.<br>',
  'Berry, D. M. (2025) \u2018Synthetic Media and Computational Capitalism: Towards a Critical Theory of Artificial Intelligence\u2019, <i>AI &amp; Society</i>, 40, pp. 5257\u20135269.<br>',
  'Berry, W. (1990a) \u2018The Pleasures of Eating\u2019, in <i>What Are People For?</i> North Point Press.<br>',
  'Berry, W. (1990b) \u2018Why I Am Not Going To Buy A Computer\u2019, in <i>What Are People For?</i> North Point Press.<br>',
  'Calvino, I. (1969) <i>t zero</i>. Harcourt, Brace &amp; World.<br>',
  'Calvino, I. (1986) \u2018Cybernetics and Ghosts\u2019, in <i>The Uses of Literature</i>. Harcourt Brace, pp. 3\u201327.<br>',
  'Craig, C. and Kerr, I. (2025) \u2018The death of the AI author\u2019, in <i>Robot Law: Volume II</i>. Edward Elgar, pp. 250\u2013285.<br>',
  'deBoer, F. (2026) \u2018I Wouldn\u2019t Say Pangram is Broken, But I Would Say That It\u2019s Brittle\u2019, 19 July.<br>',
  'Dell\u2019Acqua, F. et al. (2026) \u2018Navigating the Jagged Technological Frontier\u2019, <i>Organization Science</i>, 37(2), pp. 403\u2013423.<br>',
  'Dominus, M. (2025) Mastodon, on em-dashes.<br>',
  'Earp, B. D., Yuan, H., Koplin, J. and Porsdam Mann, S. (2025) \u2018LLM use in scholarly writing poses a provenance problem\u2019, <i>Nature Machine Intelligence</i>, 7(12), pp. 1889\u20131890.<br>',
  'Elden, S. (2021) \u2018What is an author? From Paris to Buffalo\u2019, <i>Progressive Geographies</i>, 28 October.<br>',
  'Foucault, M. (1977) \u2018What is an Author?\u2019, in <i>Language, Counter-Memory, Practice</i>, ed. D. F. Bouchard. Cornell, pp. 113\u2013138.<br>',
  'Foucault, M. (1979) \u2018What is an Author?\u2019, in J. Harari (ed.) <i>Textual Strategies</i>. Cornell, pp. 141\u2013160.<br>',
  'Hayles, N. K. (1999) <i>How We Became Posthuman</i>. University of Chicago Press.<br>',
  'Hayles, N. K. (2025) <i>Bacteria to AI: Human Futures with Our Nonhuman Symbionts</i>. University of Chicago Press.<br>',
  'Jancer, M. (2025) \u2018You\u2019re Not Imagining It. People Actually Are Starting To Talk Like ChatGPT.\u2019, <i>VICE</i>, 29 June.<br>',
  'Karpathy, A. (2025) <i>Year in Review 2025</i>.<br>',
  'Kirshner, A. (2026) \u2018A.I. Detectors Are Supposed to Make Our Writing Better. It Might Be Doing the Opposite.\u2019, <i>Slate</i>, 18 August.<br>',
  'Kittler, F. A. (1999) <i>Gramophone, Film, Typewriter</i>, trans. G. Winthrop-Young and M. Wutz. Stanford.<br>',
  'Klee, M. (2026) \u2018The Pope\u2019s Warnings About AI Were AI-Generated, a Detection Tool Claims\u2019, <i>Wired</i>, 22 April.<br>',
  'Nietzsche, F. (1969) <i>On the Genealogy of Morals and Ecce Homo</i>, trans. W. Kaufmann. Vintage.<br>',
  'Porsdam Mann, S. et al. (2024) \u2018Guidelines for ethical use and acknowledgement of large language models in academic writing\u2019, <i>Nature Machine Intelligence</i>, 6, pp. 1272\u20131274.<br>',
  'Requarth, T. (2026) \u2018The A.I. Writing Panic Is Completely Missing the Point\u2019, <i>Slate</i>, 17 April.<br>',
  'Taranto, J. (2026) \u2018The \u201cAI Detector\u201d as Defamation Machine\u2019, <i>Wall Street Journal</i>, 3 April.<br>',
  'Titcomb, J. (2026) \u2018Use AI at your peril, internet\u2019s \u201cslop janitor\u201d warns politicians\u2019, <i>The Telegraph</i>, 9 August.<br>',
  'Vara, V. (2026) \u2018How AI Is Creeping Into The New York Times\u2019, <i>The Atlantic</i>.<br>',
  'Winthrop-Young, G. and Wutz, M. (1999) \u2018Translators\u2019 Introduction\u2019, in Kittler, <i>Gramophone, Film, Typewriter</i>, pp. xi\u2013xxxviii.</small></p>',
  '<p><small>Posted by David M. Berry. Comments: 14. See also',
  '<a href="foucault-versions.geocities.ws">a note on the versions of',
  '&ldquo;What is an Author?&rdquo;</a>, which turns out to be its own',
  'case.</small></p>',
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
