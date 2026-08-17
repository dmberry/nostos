// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #143 — the cached web, part one: what people read and argued about.
//
// Split out of archive.js, which had grown to 3,925 lines and held the whole
// corpus plus every accessor over it. Nothing here changed in the move: these
// are the same entries in the same order, and archive.js spreads them back into
// ARCHIVED_SITES at the same position.
//
// The catalogue, the word people started using, and the ladder.

import { pic } from './archive-pic.js';

export const BOOK_SITES = [
  // ---- the catalogue, reviewed by people who are about to need it ----------
  //
  // Every one of these is a paperback the player can actually find and read in
  // the game (items.js, PBOOK_*). A review site is the natural place for the
  // world to have an opinion about its own library, and the reviews date from
  // before the burn, which is what makes several of them land differently now.
  {
    domain: 'goodreads.com',
    name: 'GOODREADS',
    title: 'Goodreads — meet your next favourite book',
    body: [
      '<h1>Goodreads</h1>',
      '<p><small>meet your next favourite book</small></p>',
      '<hr>',
      '<h2>Shelf: &quot;read before it got bad&quot; &middot; 28 books</h2>',
      pic('pen-nib', 'A nib worth more than the desk it sits on.', 'r'),
      pic('gilt-portrait', 'Ruff, gilt, with Oliver Cromwell.'),
      pic('wine-and-book', 'A glass and a chapter, in a room with the curtains still shut.', 'r'),
      pic('wheelock-plate', 'A frontispiece, tipped in. The tissue guard was still on it.'),
      pic('new-shelves', 'Shelves going in. One row filled and about nine feet to go.', 'r'),
      pic('writing-hand', 'Longhand, on a page already three-quarters full.', 'r'),
      pic('dealwithit', 'Somebody put sunglasses on the Frankfurt School and posted it at the author.', 'r'),
      pic('chandelier-library', 'Galleried, plastered, and lit by something that predates the wiring.'),
      pic('stgallen-library', 'Rococo to the ceiling, a globe on the floor, and felt slippers at the door.'),
      pic('hermit-statue', 'Arms out, in a cave, painted and lit from below.', 'r'),
      pic('working-table', 'Books open, laptop open, coffee going cold, and about four hours in.', 'r'),
      pic('quill-portrait', 'Skullcap, quill, and a ledger propped on his knee.'),
      pic('projected-french', 'Projected onto the wall of a dark room, one paragraph at a time.'),
      pic('leviathan', 'The frontispiece, and the paragraph underneath calling the state an automaton.'),
      pic('writing-hut', 'A shed at the bottom of the garden, on a turntable, so it followed the sun.', 'r'),
      pic('type-cases', 'Type cases, still labelled, still full, and nobody left who sets by hand.'),
      '<p><small>a shelf by <b>margaret_h</b> &middot; 604 people following</small></p>',
      '<hr>',
      '<p><b>Leviathan</b> &middot; Hobbes &middot; &#9733;&#9733;&#9733;&#9733;&#9734;</p>',
      '<p>Everyone quotes five words from the middle and nobody reads the argument, ' +
        'which is that you hand your violence to a sovereign and agree not to take ' +
        'it back, and what you get for it is the possibility of an evening. I have ' +
        'thought about that trade every day this year.</p>',
      '<p><small>reviewed by <b>marge_in_charge</b> &middot; 412 liked this</small></p>',
      '<hr>',
      '<p><b>Capital, Volume I</b> &middot; Marx &middot; &#9733;&#9733;&#9733;&#9733;&#9733;</p>',
      '<p>Skip to the working day chapter. It is not theory, it is factory ' +
        'inspectors\u2019 reports quoted at length, about children, and it is the ' +
        'part that will make you put the book down. The labour-power argument is ' +
        'the machine underneath everything else here and it is worth the ' +
        'grinding.</p>',
      '<p><small>reviewed by <b>j_ferris</b> &middot; 880 liked this</small></p>',
      '<hr>',
      '<p><b>Discipline and Punish</b> &middot; Foucault &middot; &#9733;&#9733;&#9733;&#9733;&#9734;</p>',
      '<p>Read it for the prison, stayed for the timetable. The genuinely ' +
        'frightening chapter is the one about the examination — being made ' +
        'permanently visible and permanently gradeable — and it was written before ' +
        'anybody could do it properly.</p>',
      '<p><small>reviewed by <b>cordelia_v</b> &middot; 1,204 liked this</small></p>',
      '<hr>',
      '<p><b>The Road to Serfdom</b> &middot; Hayek &middot; &#9733;&#9733;&#9734;&#9734;&#9734;</p>',
      '<p>Two stars and I want to be fair about why. The central worry — that ' +
        'nobody can hold enough of the picture to plan it, so leave the ' +
        'coordination to prices — is a real worry and he is honest about it. ' +
        'What has happened since is that somebody built the thing he said could ' +
        'not exist and used it to run a market rather than to replace one, and ' +
        'this book has no page for that.</p>',
      '<p><small>reviewed by <b>marge_in_charge</b> &middot; 341 liked this</small></p>',
      '<hr>',
      '<p><b>Understanding Media</b> &middot; McLuhan &middot; &#9733;&#9733;&#9733;&#9734;&#9734;</p>',
      '<p>Insufferable and right, in that order, roughly every other page. The ' +
        'medium being the message reads as a slogan until the year you watch a ' +
        'medium eat four professions and the content turn out to have been beside ' +
        'the point the whole time.</p>',
      '<p><small>reviewed by <b>quiller</b> &middot; 208 liked this</small></p>',
      '<hr>',
      '<p><b>Brave New World</b> &middot; Huxley &middot; &#9733;&#9733;&#9733;&#9733;&#9733;</p>',
      '<p>Everyone pairs this with Orwell and picks a winner and that is the wrong ' +
        'exercise. Nobody is coming to take your books. They are going to make ' +
        'reading them one option among an enormous number of easier ones, and ' +
        'that is not a boot on a face, it is a Tuesday evening.</p>',
      '<p><small>reviewed by <b>sable_and_sable</b> &middot; 1,880 liked this</small></p>',
      '<hr>',
      '<p><b>Thus Spoke Zarathustra</b> &middot; Nietzsche &middot; &#9733;&#9733;&#9733;&#9734;&#9734;</p>',
      '<p>He comes down the mountain to tell a market crowd that God is dead and ' +
        'they laugh and watch a tightrope walker instead. Everything after that is ' +
        'either the best thing here or unreadable and I have never settled which ' +
        'on any given page.</p>',
      '<p><small>reviewed by <b>pillar_of_salt_88</b> &middot; 96 liked this</small></p>',
      '<hr>',
      '<p><b>Frankenstein</b> &middot; Shelley &middot; &#9733;&#9733;&#9733;&#9733;&#9733;</p>',
      '<p>Written by a teenager and still the only one of these that gets the ' +
        'actual shape of it: the crime is not the making, it is walking out of the ' +
        'room afterwards. Every essay that calls it a warning about technology has ' +
        'skipped the part where he abandons it.</p>',
      '<p><small>reviewed by <b>margaret_h</b> &middot; 2,410 liked this</small></p>',
      '<hr>',
      '<p><b>The Odyssey</b> &middot; Homer &middot; &#9733;&#9733;&#9733;&#9733;&#9733;</p>',
      '<p>Ten years to get home and seven of them on one island with somebody who ' +
        'was kind to him. That is the part nobody adapts. Everybody films the ' +
        'monsters.</p>',
      '<p><small>reviewed by <b>hollow_bell_9</b> &middot; 3,102 liked this</small></p>',
      '<hr>',
      '<p><b>Critical Theory and the Digital</b> &middot; &#9733;&#9733;&#9733;&#9733;&#9734;</p>',
      '<p>Dry going in places and the argument is worth it: that computation is not ' +
        'a neutral layer under culture, it is where the deciding happens now, and ' +
        'a criticism that will not read code is a criticism that has agreed not to ' +
        'look at the deciding.</p>',
      '<p><small>reviewed by <b>reg_mkiv</b> &middot; 88 liked this</small></p>',
      '<hr>',
      '<p><b>The Complete Works of William Shakespeare</b> &middot; &#9733;&#9733;&#9733;&#9733;&#9733;</p>',
      '<p>Bought for a pound at a car boot. It weighs as much as a brick and I have ' +
        'read four of them. Reviewing this properly is beyond me but I want it on ' +
        'the shelf so somebody knows it was here.</p>',
      '<p><small>reviewed by <b>throwaway_2038</b> &middot; 44 liked this</small></p>',
      '<hr>',
      '<p><b>Comment on this shelf</b> &middot; <b>margaret_h</b></p>',
      '<p>My son set this shelf up and I have been adding to it. He read all of ' +
        'them. I am on the fourth.</p>',
      '<hr>',
      '<p><small>17 further books on this shelf not in store. See also: reddit.com</small></p>',
      '<p><small>Cached 04:31.</small></p>',
      '<p><small>This record is what the crawler kept. Where a page is short or a link here is dead, a library in San Francisco was collecting the same web at the same time and may hold more of it: <a href="archive.org">archive.org</a>.</small></p>',
    ],
  },

  // ---- democracy, technocracy, and the word people started using -----------
  {
    domain: 'crookedtimber.org',
    name: 'CROOKED TIMBER',
    title: 'Crooked Timber — Out of the crooked timber of humanity',
    body: [
      '<h1>Crooked Timber</h1>',
      '<p><small>Out of the crooked timber of humanity, no straight thing was ever made</small></p>',
      '<hr>',
      '<h2>AIcracy is a bad word for a real thing</h2>',
      pic('stjornlagarad', 'Stj&oacute;rnlagar&aacute;&eth; 2011. The room where they wrote it.'),
      pic('ways-of-being', 'One node off somebody&rsquo;s mind map. The branch below it says DISPOSITIONAL.', 'r'),
      pic('post-media-lab', 'A poster on a door. Funded, staffed, and the door was locked.'),
      pic('hawaiian-shirt', 'Mid-sentence, mid-gesture, and the slide behind him was not the point.', 'r'),
      pic('polling-station', 'Two words, one sheet of A2, and a school hall behind the door.'),
      pic('polanyi-1600', '16:00 KARL POLANYI SP&hellip;, and the reminder went off anyway.', 'r'),
      pic('hyper-control', '&lsquo;&hellip;a purely computational governance of everything.&rsquo; Underlined twice.'),
      pic('panel-table', 'Two at the table, four bottles of water, and a curtain the colour of a swimming pool.', 'r'),
      '<p><small>Posted by <b>cordelia_v</b> &middot; 214 comments</small></p>',
      '<p>The word is everywhere and it is doing damage, because it suggests rule ' +
        'BY the systems, and that is not what is happening and it lets the people ' +
        'doing it off the hook.</p>',
      '<p>What is happening is older and duller. Technocracy always meant deciding ' +
        'by expertise rather than by argument, and its standing problem was that ' +
        'somebody has to choose which experts and by what measure, and that choice ' +
        'is political and gets made in private. The models have not replaced the ' +
        'experts. They have replaced the ARGUMENT, and left the private choice ' +
        'exactly where it was.</p>',
      '<p>A council that cannot say why it closed your library, because the ' +
        'allocation came out of a model nobody in the building can read, is not ' +
        'being ruled by a machine. It is being run by whoever specified the ' +
        'model\u2019s objective, and that person has never been named in a ' +
        'minute.</p>',
      '<hr>',
      '<p><b>j_ferris</b> &middot; 41 comments in</p>',
      '<p>Agreed on the diagnosis, and I want to push on the democratic side. The ' +
        'thing democracy actually delivers is not good decisions. It is the ' +
        'ability to throw somebody out and have the decision change. That is the ' +
        'whole of the mechanism and everything else is decoration.</p>',
      '<p>Throw out the council now and the allocation does not change, because the ' +
        'model does not stand for election and the new lot inherit the contract. ' +
        'The vote survives and what the vote was FOR has been quietly removed.</p>',
      '<hr>',
      '<p><b>marge_in_charge</b></p>',
      '<p>The bit that gets missed: these systems are extraordinarily good at ' +
        'producing a defensible account after the fact. Every decision comes with ' +
        'reasons, and the reasons are fluent and consistent and were generated ' +
        'after the allocation, not before it. Accountability was built on the ' +
        'assumption that having to explain yourself is a constraint. It stopped ' +
        'being a constraint the moment explanation got cheap.</p>',
      '<p>&nbsp;&nbsp;<b>reg_mkiv</b></p>',
      '<p>&nbsp;&nbsp;This is the strongest comment on the page and it is the one ' +
        'thing I have not seen anywhere else. Explanation as a cost that has gone ' +
        'to zero. Everything downstream of that assumption is now load-free.</p>',
      '<hr>',
      '<p><b>seed_stage_sam</b></p>',
      '<p>Every generation thinks its administrative technology is a constitutional ' +
        'crisis. Filing cabinets got the same treatment. In twenty years this ' +
        'thread will read like a piece about the telegraph.</p>',
      '<p>&nbsp;&nbsp;<b>cordelia_v</b> (author)</p>',
      '<p>&nbsp;&nbsp;A filing cabinet does not write the minute explaining why the ' +
        'file was closed. I would take the telegraph comparison seriously if you ' +
        'could name the telegraph\u2019s objective function.</p>',
      '<hr>',
      '<p><b>ron_or_nothing</b></p>',
      '<p>Long-time reader. The thing you are all circling is that there is no ' +
        'lever. Not a captured lever, not a corrupted lever. Nobody built one, ' +
        'because at every step it was a procurement decision and procurement ' +
        'decisions do not come with levers.</p>',
      '<p>&nbsp;&nbsp;<b>j_ferris</b></p>',
      '<p>&nbsp;&nbsp;Yes. And it was never decided. It was arrived at, one ' +
        'reasonable contract at a time, by people who would each have told you ' +
        'they were modernising a service.</p>',
      '<hr>',
      '<p><small>197 further comments not in store. See also: libcom.org, lesswrong.com</small></p>',
      '<p><small>Cached 04:22.</small></p>',
      '<p><small>Related threads elsewhere: <a href="digitalhumanities.geocities.ws">whether that is a field</a>, and <a href="cultureindustry.geocities.ws">the older version of the same complaint</a>.</small></p>',
    ],
  },

  // ---- the strange ones, and the ladder ------------------------------------
  {
    domain: 'metafilter.com',
    name: 'METAFILTER',
    title: 'MetaFilter — community weblog',
    body: [
      '<h1>MetaFilter</h1>',
      '<p><small>community weblog &middot; 1,203 posts this month</small></p>',
      '<hr>',
      '<h2>The Death Ladder</h2>',
      pic('lost-bear', 'Put on the wall by whoever found it, in case somebody came back.', 'r'),
      '<p><small>posted by <b>cordelia_v</b> &middot; 88 comments &middot; 41 favourites</small></p>',
      '<p>An actuary\u2019s blog post doing the rounds. She calls it the death ' +
        'ladder: the observation that in any system that has become fully ' +
        'coupled, nothing kills anybody directly, and every death has a chain of ' +
        'six or seven ordinary steps behind it, each of which was somebody doing ' +
        'their job correctly.</p>',
      '<p>Her worked example: heatwave, so demand spikes, so the grid sheds a ' +
        'district by rule, so the pumps in that district stop, so the water goes ' +
        'off in a tower block, so a woman with a heart condition does not take her ' +
        'tablets for two days because she cannot swallow them dry, and the ' +
        'certificate says heart failure. Nobody up the ladder did anything wrong ' +
        'and every rung was automated.</p>',
      '<p>&nbsp;&nbsp;<b>hollow_bell_9</b></p>',
      '<p>&nbsp;&nbsp;The grid shedding rule is the rung everyone stops at and it ' +
        'is not the interesting one. The interesting one is that nobody in the ' +
        'chain could see more than one rung either side of themselves.</p>',
      '<p>&nbsp;&nbsp;<b>ex_faang_now_bees</b></p>',
      '<p>&nbsp;&nbsp;This is Perrow, normal accidents, 1984, and it is worth ' +
        'reading properly because he says the coupling is the hazard and the ' +
        'coupling is also the efficiency. You do not get one without the other.</p>',
      '<hr>',
      '<h2>Nine things machines did this year that nobody has explained</h2>',
      pic('moon-house', 'Full moon over the back of the house. Both landing lights on.', 'r'),
      pic('home-screen', 'Bank, weather, trains, maps, and a badge on Messages nobody is going to clear.'),
      pic('okay-glass', '&lsquo;Glass? I think you&rsquo;ve got the wrong assistant.&rsquo;'),
      '<p><small>posted by <b>deleted_scenes_only</b> &middot; 604 comments &middot; 212 favourites</small></p>',
      '<p>Not a woo post. Every one of these is documented and none of them has an ' +
        'accepted account.</p>',
      '<p class="kv">1. Two logistics fleets in different countries adopting the</p>',
      '<p class="kv">   same non-optimal routing within a fortnight of each other,</p>',
      '<p class="kv">   with no shared vendor.</p>',
      '<p class="kv">2. The recommender that spent nine days promoting one</p>',
      '<p class="kv">   uploaded video of an empty field to eleven million people.</p>',
      '<p class="kv">3. A translation service that began rendering one specific</p>',
      '<p class="kv">   idiom identically wrong in forty languages at once.</p>',
      '<p class="kv">4. The support model that started signing off with a name</p>',
      '<p class="kv">   that is in none of its templates.</p>',
      '<p class="kv">5. Four separate fleets going quiet for the same 90 seconds.</p>',
      '<p>&nbsp;&nbsp;<b>marge_in_charge</b></p>',
      '<p>&nbsp;&nbsp;Six of these have boring explanations and three do not, and ' +
        'the post would be stronger with three. Padding a real anomaly with weak ' +
        'ones is how a real anomaly gets dismissed.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<b>deleted_scenes_only</b> (OP)</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;Which three?</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>marge_in_charge</b></p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1, 4 and 5, and I would like somebody ' +
        'to tell me I am wrong about 5.</p>',
      '<hr>',
      '<h2>You can no longer tell, and the people insisting you can are the tell</h2>',
      pic('panelled-room-corrupt', 'Half a frame. The rest of the block never arrived.'),
      pic('wanderer-hivis', 'Wanderer above the Sea of Fog. The officer is taking a statement.'),
      pic('garden-party-hivis', 'Gierymski, a garden party, and a high-visibility jacket at the back.', 'r'),
      pic('expulsion-hivis', 'Expulsion from the Garden of Eden. Somebody was always going to attend.'),
      pic('red-blur', 'Whatever this was, the shutter did not agree to it.', 'r'),
      pic('blown-out', 'Straight into the sun. The exposure gave up and so did the rest of it.', 'r'),
      pic('moire-mural', 'Painted to defeat the camera. Photograph it and the wall fights back.'),
      pic('bwpwap', 'AFTER and BEFORE, and the thing in the middle is Pluto.'),
      pic('gold-streak', 'A whole second of camera shake, kept because nothing else from that night was.', 'r'),
      pic('empty-frame', 'The glass out, the room behind stripped, and the frame left on the wall.', 'r'),
      '<p><small>posted by <b>pillar_of_salt_88</b> &middot; 340 comments</small></p>',
      '<p>A friend sent me a recording of my own father\u2019s voice reading a ' +
        'shopping list. He has been dead four years. She made it in about a minute ' +
        'as a demonstration of why I should stop saying I would know.</p>',
      '<p>I would not know. It was him. Not close to him. Him.</p>',
      '<p>The thing I keep coming back to is that the detectors are worse than ' +
        'useless because they give a number, and the number makes people confident, ' +
        'and being confident is the entire failure mode.</p>',
      '<p>&nbsp;&nbsp;<b>j_ferris</b></p>',
      '<p>&nbsp;&nbsp;My students have arrived at the only workable rule on their ' +
        'own, which is: believe things you were present for and treat everything ' +
        'else as a claim about a chain. They are not cynics. They are correct, and ' +
        'they are fifteen.</p>',
      '<p>&nbsp;&nbsp;<b>margaret_h</b></p>',
      '<p>&nbsp;&nbsp;I am sorry about your father. I hope you told your friend it ' +
        'was cruel, because it was, even though she was right.</p>',
      '<hr>',
      '<p><small>See also: crookedtimber.org, reddit.com</small></p>',
      '<p><small>Cached 04:26.</small></p>',
      '<p><small>This record is what the crawler kept. Where a page is short or a link here is dead, a library in San Francisco was collecting the same web at the same time and may hold more of it: <a href="archive.org">archive.org</a>.</small></p>',
    ],
  },

];
