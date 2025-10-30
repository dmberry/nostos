// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE CACHE: the old public internet, still half-served out of one rack.
//
// A player who finds a browser types youtube.com into it. Of course they do.
// Answering that with "unable to locate the server" is correct and worth
// nothing; answering it with a damaged copy is the whole argument of the game in
// one page, because the old web is exactly the kind of thing that would still be
// running, badly, on hardware nobody switched off.
//
// The fiction, and the reason this is one machine and not a hundred: a caching
// proxy was racked inside the daemon's estate to spare the uplink, and it
// carried on crawling and storing long after there was an uplink to spare. It
// never stopped. So the daemon's own nameserver now answers authoritatively for
// the entire old internet, and every answer it gives points at the same box in
// its own rack. Type any of these and the DNS resolves it properly: it simply
// resolves it HERE.
//
// This also explains the vintages sitting side by side. The browser is older
// than most of what it is showing you: the cache went on collecting for years
// after Navigator stopped being updated, so a 1997 browser renders a page from
// long after 1997, and renders it badly. That mismatch is not an oversight.
//
// Pure data and string building, like net.js: no world, no DOM.

// One cached document long enough to want its own file. See poplog.js.
import { POPLOG_TITLE, POPLOG_BODY } from './poplog.js';

export const CACHE_SUB = 'cache';

// A photograph on a cached page. These are real pictures, small ones, of the
// size a camera of the period actually gave you; the stylesheet floats them and
// wraps the text past. Pass 'r' as the third argument to send one to the right
// margin, which is how you get a column of pictures down alternating sides
// instead of a single stripe down the left.
//
// The caption doubles as the alt text on purpose. If the file is missing the
// page still reads, and the test below asserts none of them is.
export const pic = (name, cap, side) =>
  `<figure${side === 'r' ? ' class="r"' : ''}>` +
  `<img src="assets/media/web/${name}.jpg" alt="${cap}">` +
  `<figcaption>${cap}</figcaption></figure>`;

// The sites written out properly. Each one gets the page it deserves: not a
// stub with its name on, but the specific thing that is broken about it.
export const ARCHIVED_SITES = [
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
    ],
  },

  // ---- somebody's homepage, and the place they are from --------------------
  //
  // The cache is a dead internet and a dead internet is mostly ordinary people
  // writing down where they live. These are the pages that make the archive a
  // place rather than an argument: a personal homepage that never got past the
  // hobbies section, and a local board where the whole of a town is remembered
  // by its bus routes.
  {
    domain: 'geocities.com/siliconvalley/heights/4412',
    name: 'HEIGHTS/4412',
    title: 'GeoCities — /SiliconValley/Heights/4412',
    bg: 'navy',
    body: [
      '<h1>welcome to my homepage!!</h1>',
      '<p><small>you are visitor number <b>000412</b> &middot; last updated 12 March</small></p>',
      '<p><small>[ this page is best viewed at 800x600 ]</small></p>',
      '<hr>',
      '<h2>about me</h2>',
      pic('bonsai', 'Eleven years old and about nine inches. It has outlived two houses.', 'r'),
      pic('amazing-work', 'Left on the whiteboard by somebody who could not reach the top of it.'),
      pic('dog-indoors', 'On the boards by the door, waiting for somebody to put shoes on.', 'r'),
      pic('dog-outdoors', 'Same dog, better day, and the harness is on so we are going out.'),
      pic('child-drawing', 'Two people and something between them with a lot of teeth.', 'r'),
      pic('kites', 'Four kites up and about a mile of grass under them.', 'r'),
      pic('tall-hat-drawing', 'Two of them on a line, and the one on the left has a hat taller than she is.'),
      pic('photo-wall', 'Somebody framed the whole roll and hung it in one strip.'),
      '<p>hello. i am from <b>Smethwick</b>, which is in the West Midlands, which ' +
        'people from London think is Birmingham and people from Birmingham know is ' +
        'not. we moved to <b>Bearwood</b> when i was nine, to <b>Stanhope Rd</b>, ' +
        'which has a hump in the middle you could get a bike off.</p>',
      '<p>i went to <b>Uplands School</b>. it is gone now. they knocked it down and ' +
        'put up eleven houses and did not keep the gates, which everyone said they ' +
        'would.</p>',
      '<h2>the no. 9</h2>',
      pic('back-garden', 'The back garden. That tree came down in the storm two winters later.'),
      pic('herringbone', 'Herringbone, laid by hand, and every third one a different colour by accident.'),
      '<p>the <b>No. 9 bus</b> is the whole of my childhood. Birmingham to ' +
        '<b>Quinton</b>, along the Hagley Road, past everything. you could get it ' +
        'to <b>Halesowen</b> if you changed, and to <b>Stourbridge</b> if you were ' +
        'prepared to give up your afternoon. i have spent more hours on the top ' +
        'deck of the 9 than i have in any building.</p>',
      '<p class="kv">9   City &mdash; Hagley Rd &mdash; Bearwood &mdash; Quinton</p>',
      '<p class="kv">    (the 9 does not go to Quinton any more. the 9A does.)</p>',
      '<h2>holidays</h2>',
      pic('pony-row', 'The full row, on the dresser. Order is not negotiable.'),
      pic('coffee-and-hills', 'Breakfast on the rail, looking down the valley. Arcevia, and it got to 36 that day.'),
      pic('arcevia-36', 'Thirty-six, mostly sunny, and forty-one forecast for Wednesday.', 'r'),
      pic('disc-sculpture', 'Ten feet of it in a field, and no plaque anywhere near.'),
      pic('iron-gates', 'Wrought iron across the bridge, and the sun coming straight down the path.', 'r'),
      pic('stadium-rain', 'Under the roof, in the rain, with about forty thousand empty seats.'),
      pic('ponies-eiffel', 'Brought back from the trip. The tower is four inches tall.'),
      '<p>every year, <b>Bovisands</b>, <b>Devon</b>. the same field above the same ' +
        'beach. my dad reversed a caravan into the same gatepost four years running ' +
        'and on the fourth year the farmer had painted it white.</p>',
      '<p>one year we went to <b>Telford</b> instead because of the money. i have ' +
        'never said a bad word about Telford and i am not starting now, but it is ' +
        'not Bovisands.</p>',
      '<h2>college</h2>',
      pic('toy-soldiers', 'Found under a floorboard. Somebody had a whole army down there.', 'r'),
      '<p>i did <b>Computer Science</b> at <b>Halesowen Tertiary College</b>, ' +
        'which had one room of 486s and a technician who let us stay after four ' +
        'if we put the chairs back. that room is the reason i do what i do and i ' +
        'have never told him.</p>',
      '<p>we wrote everything in BASIC and then in Pascal and one lad did the ' +
        'whole of his project in assembler out of sheer stubbornness and got a ' +
        'merit, and i have thought about that decision for twenty years.</p>',
      '<h2>going out</h2>',
      pic('flat-white-3', 'Third one of these in the roll. Somebody had a phase.', 'r'),
      pic('blurred-table', 'Somebody got up mid-frame. The table is laid for about eight.', 'r'),
      '<p><b>JBs</b> in <b>Dudley</b>. small, black, sticky, and everyone played ' +
        'there on the way up and half of them again on the way down. you could ' +
        'stand at the front for two quid and be close enough to be deafened ' +
        'properly.</p>',
      '<p>pubs in <b>Halesowen</b>: the <b>King Edward</b> if you want to talk, ' +
        'the <b>Waggon</b> if you do not, and the Somers if you have already had ' +
        'enough and want somewhere that will not judge you for it.</p>',
      '<p>and <b>Stratford</b>, an hour on the bus, for the <b>Shakespeare</b>. ' +
        'standing tickets for about the price of a round. i saw a Lear from the ' +
        'back of the stalls with my coat still on and did not sit down properly ' +
        'until the interval.</p>',
      '<h2>links</h2>',
      pic('blue-ghost', 'Blue means you have about four seconds and then he is not blue.', 'r'),
      pic('jupiter-lock', '16:46, Tuesday 21 June, and a gas giant behind the numbers.'),
      pic('papercraft', 'Printed, cut out and glued. Six of them and a sheep.', 'r'),
      pic('crook-umbrella', 'Wooden crook, proper canopy, and it has never once been left on a train.'),
      pic('modded-minecraft', 'Advanced Wafer 0/1, Aluminium Ingot 0/16. Somebody is building a computer in there.', 'r'),
      '<p class="kv">&#9679; my mate Dave&rsquo;s page ...... [ 404 ]</p>',
      '<p class="kv">&#9679; the Bearwood board ......... ' +
        '<a href="blackcountryboard.co.uk">blackcountryboard.co.uk</a></p>',
      '<p class="kv">&#9679; where i am now ............. ' +
        '<a href="brightonrocks.co.uk">brightonrocks.co.uk</a></p>',
      '<p class="kv">&#9679; the course ................. ' +
        '<a href="sussex.ac.uk">sussex.ac.uk</a></p>',
      '<p class="kv">&#9679; guestbook .................. [ script not found ]</p>',
      '<hr>',
      '<h2>&#9664; the Midlands Exiles webring &#9654;</h2>',
      '<p><small>this site is a member. 41 sites, 3 still answering.</small></p>',
      '<p class="kv">&#9664; prev ... [ no longer resolving ]</p>',
      '<p class="kv">random .. <a href="blackcountryboard.co.uk">blackcountryboard.co.uk</a></p>',
      '<p class="kv">next &#9654; . <a href="geocities.com">the neighbourhood index</a></p>',
      '<hr>',
      '<p><small>this page has not been updated since. the counter still works.</small></p>',
    ],
  },
  {
    domain: 'blackcountryboard.co.uk',
    name: 'BLACK COUNTRY BOARD',
    title: 'The Black Country Board — Bearwood, Smethwick & round about',
    body: [
      '<h1>The Black Country Board</h1>',
      '<p><small>Bearwood, Smethwick &amp; round about &middot; 2,904 members</small></p>',
      '<hr>',
      '<h2>Things that are not there any more (rolling thread, pt 41)</h2>',
      pic('decanter', 'Cut glass, and about two fingers left in it.', 'r'),
      pic('gpo-746', 'Dial it and the exchange hears the pulses. No tone, no menu, no queue.', 'r'),
      pic('currys-advert', '63-65 Lower Precinct, Coventry. 27 guineas, or five shillings a week.'),
      pic('old-town-map', 'Hand-coloured, and the chapel marked on it has been gone four hundred years.'),
      pic('letters-box', 'Cleared at 5.30, 10.20, 11.45 Tuesdays only, and 11.30 on a Saturday.', 'r'),
      '<p><small>started by <b>brumbrumbrum</b> &middot; 4,118 replies</small></p>',
      '<p>Part 41. Same rules: one per post, say where it was, no arguing about ' +
        'whether it was in Smethwick or Bearwood because the border went through ' +
        'the middle of half of them anyway.</p>',
      '<hr>',
      '<p><b>quinton_gary</b></p>',
      '<p>The lido. Everyone says the lido. Putting it first so nobody has to.</p>',
      '<p><b>hagley_rd_regular</b></p>',
      '<p>Uplands. And before anyone starts: yes it was a good school and yes it ' +
        'was falling down, and both of those were true at the same time for about ' +
        'fifteen years.</p>',
      '<p>&nbsp;&nbsp;<b>margaret_h</b></p>',
      '<p>&nbsp;&nbsp;I taught there. Room 14 had a bucket in it from 1988 to the ' +
        'day it shut and the bucket was on the timetable.</p>',
      '<p><b>brumbrumbrum</b></p>',
      '<p>The record shop by the bus stop in Bearwood. Not the big one. The one ' +
        'that was mostly reggae and the bloke never looked up.</p>',
      '<p><b>halesowen_pete</b></p>',
      '<p>Going to add something that is still there, sorry: the <b>9</b>. It has ' +
        'been rerouted about six times and renumbered twice and it is still the 9 ' +
        'and it still goes down the Hagley Road, and when everything else went, ' +
        'that did not.</p>',
      '<p>&nbsp;&nbsp;<b>quinton_gary</b></p>',
      '<p>&nbsp;&nbsp;It goes to Quinton as the 9A now.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<b>halesowen_pete</b></p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;It goes to Quinton, Gary.</p>',
      '<hr>',
      '<h2>Anyone else&rsquo;s parents from Stourbridge?</h2>',
      pic('skittle-alley', 'Long alley. Nine pins, a wooden cheese, and about sixty feet of floor.', 'r'),
      '<p><small>by <b>hagley_rd_regular</b> &middot; 88 replies</small></p>',
      '<p>Trying to work out how far the glass went. My grandad cut it, his brother ' +
        'blew it, and neither of them would say a word about it to us. It was just ' +
        'work. I have got a bowl of his in a cupboard I am frightened to use.</p>',
      '<p>&nbsp;&nbsp;<b>margaret_h</b></p>',
      '<p>&nbsp;&nbsp;Use the bowl.</p>',
      '<hr>',
      '<h2>JBs, Dudley &mdash; who did you see there</h2>',
      '<p><small>by <b>quinton_gary</b> &middot; 1,204 replies</small></p>',
      '<p>Rules of the thread: band, roughly what year, and whether you can still ' +
        'hear properly.</p>',
      '<p>&nbsp;&nbsp;<b>hagley_rd_regular</b></p>',
      '<p>&nbsp;&nbsp;The Wonder Stuff before anybody outside the Midlands had ' +
        'heard of them, and Ned&rsquo;s twice. No, and no.</p>',
      '<p>&nbsp;&nbsp;<b>halesowen_pete</b></p>',
      '<p>&nbsp;&nbsp;New Model Army, and I have never been in a room like it ' +
        'before or since. Everyone knew every word and nobody was showing off ' +
        'about it.</p>',
      '<p>&nbsp;&nbsp;<b>margaret_h</b></p>',
      '<p>&nbsp;&nbsp;I collected two of mine from outside it more times than I ' +
        'am going to write down. Good place. Terrible pavement.</p>',
      '<hr>',
      '<h2>Halesowen Tertiary, computer department, anyone?</h2>',
      '<p><small>by <b>brumbrumbrum</b> &middot; 88 replies</small></p>',
      '<p>One room, twenty 486s, and a technician whose name I am ashamed to say I ' +
        'cannot remember, who left it unlocked at lunchtime and after four. Half a ' +
        'dozen people in this town have careers because of a man who could not be ' +
        'bothered to lock a door.</p>',
      '<p>&nbsp;&nbsp;<b>quinton_gary</b></p>',
      '<p>&nbsp;&nbsp;Mr Latham. And he absolutely could be bothered. He was doing ' +
        'it on purpose.</p>',
      '<hr>',
      '<h2>Telford</h2>',
      '<p><small>by <b>anon</b> &middot; 611 replies, locked</small></p>',
      '<p>[ locked by moderator: 611 replies, mostly about Telford ]</p>',
      '<hr>',
      '<p><small>Cached 03:58. The board was still posting when the crawler ' +
        'stopped. See also: geocities.com/siliconvalley/heights/4412</small></p>',
    ],
  },

  // ---- the university on the hill, and the machines of that decade ---------
  {
    domain: 'sussex.ac.uk',
    name: 'SUSSEX',
    title: 'University of Sussex \u2014 MA Social and Political Thought',
    body: [
      '<h1>University of Sussex</h1>',
      '<p><small>Be Still and Know</small></p>',
      '<p><small>School of European Studies &raquo; MA Social and Political Thought</small></p>',
      '<hr>',
      '<p>Falmer, out past the Lewes Rd, in a set of listed concrete buildings ' +
        'by Basil Spence that people either love on sight or need a term to come ' +
        'round to.</p>',
      '<h2>The programme</h2>',
      pic('abstract-negative-concrete', 'Taped up by a second-year outside the seminar room. It stayed all term.', 'r'),
      pic('new-university', 'VICE-CHANCELLOR OF NEW UNIVERSITY NAMED. Oxford Don for Coventry, 1961.', 'r'),
      pic('concrete-fins', 'Two fins, brick between them, and a lawn cut to within an inch.'),
      '<p>A year on the Frankfurt School and what came after it, taught as live ' +
        'argument rather than as history. Adorno and Horkheimer, Habermas and the ' +
        'people who think Habermas conceded too much, Marx read properly rather ' +
        'than quoted, and a long unit on whether critical theory can say anything ' +
        'about institutions without becoming a policy seminar.</p>',
      '<p class="kv">Core .......... Modernity and its critics</p>',
      '<p class="kv">Core .......... Ideology, culture and the commodity</p>',
      '<p class="kv">Option ........ Systems theory and its discontents</p>',
      '<p class="kv">Option ........ The political thought of the postwar settlement</p>',
      '<p class="kv">Dissertation .. 15,000 words, and it is the point of the year</p>',
      '<h2>Teaching</h2>',
      pic('marked-up-paper', 'Marking up somebody else&rsquo;s article. The word in the margin is ENCODED.'),
      pic('concept-map', 'LIBERTY at the top right, and about ninety boxes underneath it.'),
      pic('opera-map', 'ARTISTIC INPUT in the middle, FUTURE OF OPERA below it, and BBC underlined at the bottom.', 'r'),
      '<p><b>Darrow Schecter</b> \u2014 the Italian tradition, Gramsci and the ' +
        'council communists, and a run of books on what a critical theory of ' +
        'politics looks like once you stop assuming the state is the unit. He will ' +
        'give you a reading list you cannot finish and be entirely unapologetic.</p>',
      '<p><b>William Outhwaite</b> \u2014 Habermas, social theory, and the ' +
        'philosophy of social science, and the person to ask when you have got ' +
        'yourself into an argument about method and cannot get out. Reads ' +
        'everything in the original.</p>',
      '<h2>East Slope Bar</h2>',
      '<p>Down the hill behind the Spence terraces, in the middle of the East ' +
        'Slope residences, where the students actually lived. Cheap, ugly in the ' +
        'way a room gets ugly from being used, and open when everything else on ' +
        'campus had shut. It was the only bar on the site that belonged to the ' +
        'people who drank in it.</p>',
      '<p>Bands played there. Meetings were held there, including the ones about ' +
        'the university. Every occupation this campus has had was argued out in ' +
        'that room first, and the union ran it rather than a caterer, which is ' +
        'why the prices stayed where they were.</p>',
      '<p>They knocked it down. East Slope came down with it and went back up as ' +
        'new accommodation at a new rent, and where the bar stood there is now a ' +
        'landscaped garden in the Japanese manner: gravel, a few placed stones, ' +
        'and some planting.</p>',
      '<p>It is well made. People sit in it. Nobody has ever had an argument in ' +
        'it that changed anything, because you cannot: it is a garden, and it was ' +
        'chosen instead of a room where a hundred people could be in one place ' +
        'with the door shut.</p>',
      '<h2>Practical</h2>',
      pic('clouds-note', '&lsquo;CLOUDS&rsquo;, underlined, with arrows both ways. Nobody has the rest of the page.'),
      '<p>The 25 bus from the Old Steine, or the train from Brighton to Falmer, ' +
        'four minutes. The library shuts earlier than you want it to and the ' +
        'seminars run in rooms with no windows, and both facts will shape your ' +
        'year more than the syllabus does.</p>',
      '<hr>',
      '<p><small>Cached 05:41. See also: ' +
        '<a href="brightonrocks.co.uk">brightonrocks.co.uk</a>' +
        '<a href="crookedtimber.org">crookedtimber.org</a>' +
        '<a href="libcom.org">libcom.org</a></small></p>',
    ],
  },
  // ---- the other university, and the rooms nobody photographs on purpose --
  {
    domain: 'ox.ac.uk',
    name: 'OXFORD',
    title: 'University of Oxford \u2014 a visitor\u2019s notes',
    // The college set its own background and did not ask. #002147, and white on it.
    bg: 'oxford',
    body: [
      '<h1>University of Oxford</h1>',
      '<p><small>Dominus Illuminatio Mea</small></p>',
      '<hr>',
      '<p>Thirty-odd colleges, each one a separate charity with its own kitchen, ' +
        'its own silver and its own opinion about the other twenty-nine. The ' +
        'university is the thing they agree to share, and it is smaller than any ' +
        'of them.</p>',
      '<h2>The colleges, and the halls</h2>',
      '<p>Thirty-nine colleges. You do not apply to Oxford so much as apply to ' +
        'one of these and get Oxford attached.</p>',
      '<p class="kv">All Souls           Linacre         St Catherine\'s</p>',
      '<p class="kv">Balliol             Lincoln         St Cross</p>',
      '<p class="kv">Brasenose           Magdalen        St Edmund Hall</p>',
      '<p class="kv">Christ Church       Mansfield       St Hilda\'s</p>',
      '<p class="kv">Corpus Christi      Merton          St Hugh\'s</p>',
      '<p class="kv">Exeter              New College     St John\'s</p>',
      '<p class="kv">Green Templeton     Nuffield        St Peter\'s</p>',
      '<p class="kv">Harris Manchester   Oriel           Somerville</p>',
      '<p class="kv">Hertford            Pembroke        Trinity</p>',
      '<p class="kv">Jesus               Queen\'s         University</p>',
      '<p class="kv">Keble               Reuben          Wadham</p>',
      '<p class="kv">Kellogg             St Anne\'s       Wolfson</p>',
      '<p class="kv">Lady Margaret Hall  St Antony\'s     Worcester</p>',
      '<p>University, Balliol and Merton all claim to be the oldest and the ' +
        'argument turns on what you count as founding: an endowment, a statute, ' +
        'or somebody actually living there. The dates in play are 1249, 1263 and ' +
        '1264, and no college has ever conceded.</p>',
      '<p>Some take undergraduates and some do not. <b>All Souls</b> has no ' +
        'students at all, only fellows, and an entrance examination famous for ' +
        'once setting a single word as the paper. <b>Nuffield</b>, <b>St ' +
        'Antony\u2019s</b>, <b>Linacre</b>, <b>St Cross</b>, <b>Wolfson</b>, ' +
        '<b>Kellogg</b>, <b>Green Templeton</b> and <b>Reuben</b> are graduate ' +
        'only. <b>Somerville</b>, <b>Lady Margaret Hall</b>, <b>St Hugh\u2019s</b>, ' +
        '<b>St Hilda\u2019s</b> and <b>St Anne\u2019s</b> were founded for women ' +
        'when the rest would not have them, and were the last to go mixed.</p>',
      '<h2>Permanent private halls</h2>',
      '<p>Smaller, older in some cases than the colleges around them, and each ' +
        'one still attached to the religious foundation that started it. They ' +
        'teach and they enter students for the same degrees; they are governed by ' +
        'their order rather than by their fellows, which is the whole of the ' +
        'difference.</p>',
      '<p class="kv">Blackfriars ......... Dominican</p>',
      '<p class="kv">Campion Hall ........ Jesuit</p>',
      '<p class="kv">Regent&rsquo;s Park ....... Baptist</p>',
      '<p class="kv">St Benet&rsquo;s Hall ..... Benedictine</p>',
      '<p class="kv">St Stephen&rsquo;s House .. Anglican</p>',
      '<p class="kv">Wycliffe Hall ....... Anglican</p>',
      '<p>St Benet&rsquo;s took its last students and closed. The building went to ' +
        'St Hilda&rsquo;s. This is the ordinary way a foundation ends here: not a ' +
        'decision anybody announces, but a year in which nobody comes.</p>',
      '<h2>The Senior Common Room</h2>',
      pic('green-drawing-room', 'Tea laid at four, in a room the colour of a billiard table.'),
      '<p>Every college has one and none of them will tell you where it is. It is ' +
        'the room where the fellows take coffee after lunch and sherry before ' +
        'dinner, and the whole social architecture of the place runs through it. ' +
        'There is no sign on the door because everyone who is supposed to be in ' +
        'there already knows.</p>',
      pic('scr-room', 'Panelling, portraits, a round table, and a carpet older than anyone sitting on it.', 'r'),
      '<p>The sherry is the part outsiders find funniest and it is not a joke: a ' +
        'tray, a decanter, small glasses, and about twenty minutes in which ' +
        'everything that is going to be decided gets decided. Nobody minutes it. ' +
        'Nobody is meant to. If you want to know how the place actually works, it ' +
        'is not in the statutes, it is in that twenty minutes.</p>',
      '<p>Sit in the wrong chair and you will be told, eventually, by somebody ' +
        'being extremely polite about it.</p>',
      '<h2>Hall</h2>',
      pic('scr-menu', 'SCR Dinner, Thursday 30th November 2017. Potage Bonne Femme, and pork.', 'r'),
      pic('chiang-mai', 'Down an alley off the High, and wider inside than the door suggests.'),
      pic('walters-turl', 'WALTERS, THE MAN&rsquo;S SHOP, TEN THE TURL. Gowns, and everything under them.'),
      pic('ivy-arch', 'Through to the next quad, under about eighty years of ivy.', 'r'),
      pic('dining-hall', 'High table across the end, benches down the length, and a roof built to be looked up at.'),
      '<p>Long tables, benches, high table across the end, and a Latin grace read ' +
        'at speed by whoever is standing. You eat facing the person opposite ' +
        'because there is nowhere else to look, which is either the best or the ' +
        'worst hour of your week depending entirely on who sat down.</p>',
      pic('victorian-portrait', 'Papers in one hand, and the brass label under him has gone green.', 'r'),
      pic('elizabeth-portrait', 'Elizabeth above the panelling, with the arms of the benefactors under her.', 'r'),
      '<p>The portraits watch. Mostly nineteenth century, mostly Principals and ' +
        'benefactors, mostly men who left money on condition their face stayed on ' +
        'the wall. Ask who any of them are and you will get the name and the year ' +
        'and nothing else, because nobody remembers and nobody minds.</p>',
      '<h2>The cellar</h2>',
      pic('scr-fireplace', 'Coffee, a lit fire, and a clock on the chimneypiece that is wound by somebody.'),
      pic('punting', 'The other place, and the other river, on the one afternoon a year it looks like this.'),
      pic('keep-off-six-languages', 'The same instruction at the other place, in six languages and still ignored.', 'r'),
      '<p>Every college has one and some of them are serious. The bigger cellars ' +
        'run to tens of thousands of bottles, held under the hall or the chapel ' +
        'in vaults that were dug for the purpose, and they are an asset on the ' +
        'books like the land and the pictures.</p>',
      '<p><b>New College</b> is the one people name. Founded 1379, and buying ' +
        'wine on something like that timescale ever since: the cellar goes down ' +
        'under the fourteenth-century buildings and holds claret laid in by ' +
        'fellows who have been dead for fifty years, bought for a table they knew ' +
        'they would not sit at.</p>',
      '<p>The job of running it is a fellowship post. The Wine Steward is an ' +
        'academic, not a sommelier, elected by the governing body and answerable ' +
        'to it, and he keeps the cellar book: every case in, every case out, every ' +
        'price, in the same ledger format they were using in the nineteenth ' +
        'century.</p>',
      '<p>Colleges buy <b>en primeur</b>, which is to say they buy Bordeaux two ' +
        'years before it exists, on the futures market, at a price set by a ' +
        'merchant who has tasted it out of the barrel. An institution that ' +
        'expects to be here in twenty years can do this. Almost nothing else in ' +
        'the country can.</p>',
      '<p>And there is a blind tasting match against Cambridge, held every year ' +
        'since 1953, sponsored by a champagne house, judged on how many wines each ' +
        'side can correctly name from the glass. Both universities take it ' +
        'entirely seriously and both field a team that has trained for it.</p>',
      '<p>After dinner the SCR moves to a second room for dessert: port going ' +
        'clockwise, fruit, nuts, and the decanter never crossing the table. Pass ' +
        'it the wrong way and somebody will mention it, and they will be right ' +
        'to.</p>',
      '<h2>The library</h2>',
      pic('panelled-library', 'One room, two walls of it, and a table long enough to fall asleep on.'),
      '<p>Gothic revival, wood to the ceiling, and colder than the rest of the ' +
        'building on purpose. The books on open shelves are the ones you are ' +
        'allowed to want. The good ones are behind glass in a room off this one ' +
        'and you sign for them.</p>',
      '<h2>Outside, and after dark</h2>',
      pic('quad-at-night', 'The whole quad from an upper window. Two red lights on the mast behind.', 'r'),
      pic('keep-off-lawn', 'Please keep off this lawn. One sign, one language, and it works.'),
      '<p>The quad is a lawn you are not allowed on and a gravel path you are. ' +
        'The porter knows this and so does everybody who has been here a week. ' +
        'The rule is not enforced so much as absorbed.</p>',
      pic('college-garden', 'Honey-coloured, and the chairs are out, so it is May or it is June.'),
      '<p>In summer the chairs come out onto the grass, and the same lawn that is ' +
        'forbidden in February is where the whole college sits in June. Nobody ' +
        'announces the changeover. It simply happens one warm afternoon and then ' +
        'that is the arrangement.</p>',
      pic('floodlit-gothic', 'Floodlit at about eleven. Two windows still going on the top floor.', 'r'),
      '<p>Go out at eleven at night and the whole thing is lit and empty, which ' +
        'is the only hour it looks the way it looks in the prospectus. Two windows ' +
        'on the top floor will still be going. They always are.</p>',
      pic('mansfield-mug', 'Mansfield College. The wine is not college wine.'),
      '<p>You leave with a mug. Everybody leaves with a mug.</p>',
      '<hr>',
      '<p><small>Cached 05:58. See also: ' +
        '<a href="sussex.ac.uk">sussex.ac.uk</a>' +
        '<a href="goodreads.com">goodreads.com</a>' +
        '<a href="crookedtimber.org">crookedtimber.org</a></small></p>',
    ],
  },
  {
    domain: 'pcplus.co.uk',
    name: 'PC PLUS',
    title: 'PC Plus \u2014 back issues',
    body: [
      '<h1>PC Plus</h1>',
      '<p><small>back issues &middot; cover disc index</small></p>',
      '<hr>',
      '<h2>The state of the machine</h2>',
      '<p class="kv">486DX2/66 .... 8 MB, 340 MB drive, and it will run anything</p>',
      '<p class="kv">Pentium 90 ... the jump you can hear as well as see</p>',
      '<p class="kv">2x CD-ROM .... the drive that made a PC a multimedia PC</p>',
      '<p class="kv">14.4k modem .. going to 28.8 and then to 33.6 within a year</p>',
      '<p>The 486 is the last machine an ordinary person could understand all the ' +
        'way down. You could name every chip on the board. The Pentium is faster ' +
        'and it is the beginning of taking somebody&rsquo;s word for it.</p>',
      '<hr>',
      '<h2>Doom</h2>',
      '<p>It arrived by modem, on shareware, and inside a fortnight it was on ' +
        'every machine in every office in the country. Network admins wrote memos ' +
        'about it. The memos are the best evidence anybody has of how fast it ' +
        'went.</p>',
      '<p>Episode one free, the rest by post. That is the whole distribution ' +
        'model and it beat every shrink-wrapped title on the shelf.</p>',
      '<hr>',
      '<h2>Getting on the internet</h2>',
      pic('speedtest', '70.80 down, 17.16 up, 13ms. Grade A+, faster than 96% of GB.'),
      '<p>You need a modem, a phone line you can tie up, an account, and a ' +
        'stack: Winsock, then Trumpet if your stack does not come with one, then ' +
        'Netscape, then Eudora for mail. Set them up in that order and none of ' +
        'them will tell you which one is failing.</p>',
      '<p>It costs local rate, and the local rate is per minute, and this is why ' +
        'everybody in Britain went online after six o&rsquo;clock and at weekends ' +
        'and not before.</p>',
      '<hr>',
      '<h2>Distributed objects: CORBA vs DCOM</h2>',
      '<p>Two answers to the same question \u2014 how does an object on this ' +
        'machine call an object on that one \u2014 and the whole industry spent ' +
        'five years on it.</p>',
      '<p><b>CORBA</b> is committee work, cross-platform and cross-language, an ORB ' +
        'in the middle and an IDL you compile stubs from. It is genuinely open and ' +
        'genuinely enormous.</p>',
      '<p><b>DCOM</b> is Microsoft&rsquo;s, which means one platform, better tools, ' +
        'and it works on the Tuesday you need it to work.</p>',
      '<p>Both of them assume the network is reliable and the remote object is a ' +
        'local one wearing a hat. It is not. Everything painful in either system ' +
        'comes from that one assumption, and the thing that eventually wins will ' +
        'be whichever stops making it.</p>',
      '<hr>',
      '<h2>Still here: Microsoft BASIC</h2>',
      '<p>Every home machine of the last fifteen years booted into a dialect of ' +
        'it, and QBASIC ships in the box with DOS, with a full-screen editor and ' +
        'a help system that is better than most manuals you can buy.</p>',
      '<p>Everybody currently writing C for a living learned what a variable was ' +
        'from a line beginning with a number.</p>',
      '<hr>',
      '<p><small>Cached 05:46. See also: ' +
        '<a href="lowendmac.com">lowendmac.com</a>' +
        '<a href="lobste.rs">lobste.rs</a>' +
        '<a href="slashdot.org">slashdot.org</a></small></p>',
    ],
  },
  {
    domain: 'soundonsound.com',
    name: 'SOUND ON SOUND',
    title: 'Sound On Sound \u2014 Studio &amp; formats',
    body: [
      '<h1>Sound On Sound</h1>',
      '<p><small>studio, formats, and what to buy</small></p>',
      '<hr>',
      '<h2>Formats, honestly</h2>',
      pic('c90-tape', 'A C90 with its insert. Somebody wrote the running order out by hand.'),
      pic('phonograph', 'Brass horn, wax cylinder. The first format, and it still plays.'),
      '<p><b>DAT</b> is the master format and everybody knows it: 16 bit, 48k, ' +
        'and a mix down to DAT is what you hand to the plant. The machines eat ' +
        'tapes, the heads wear, and the tape you find in ten years may or may not ' +
        'play. Keep two.</p>',
      '<p><b>MiniDisc</b> is the one people are rude about and the one everybody ' +
        'actually uses. It is lossy, ATRAC, and for a rehearsal recording or a ' +
        'live set it is perfect: seventy-four minutes, track marks on the fly, ' +
        'edit and retitle on the unit itself on the bus home. Nothing before or ' +
        'since has been that good at the small job.</p>',
      '<p><b>CD-R</b> at last under a hundred pounds a drive. Burn at 1x, close ' +
        'the session, and do not touch the machine while it runs \u2014 a buffer ' +
        'underrun is a coaster and there is no undo. Gold discs for anything you ' +
        'care about.</p>',
      '<p>The <b>CD</b> itself has been sold as perfect sound forever for fifteen ' +
        'years and the argument has never stopped, which tells you something about ' +
        'the argument.</p>',
      '<hr>',
      '<h2>Field recording: an afternoon in Hoxton Square</h2>',
      '<p>MD recorder, a small stereo mic, and a Sunday. <b>Hoxton Square</b> in ' +
        'the sun, sat on the grass with the levels set and the machine in a coat ' +
        'pocket, is about the best two hours of source material anybody can get ' +
        'for the price of a blank disc.</p>',
      '<p>What you get: the plane trees, which are a different sound from any ' +
        'other tree; somebody&rsquo;s radio through a window; the pub door opening ' +
        'and shutting across the square and the room noise that comes out with it; ' +
        'a skateboard on the paving; four separate conversations at four distances ' +
        'that you cannot hear while you are there and can hear perfectly on the ' +
        'playback.</p>',
      '<p>Set the level manually and leave it. Auto-gain will hear the quiet and ' +
        'wind itself up and you will get the whole square breathing in and out for ' +
        'seventy-four minutes.</p>',
      '<p>Track-mark as you go \u2014 that is the thing MD does that nothing else ' +
        'does. You come home with forty marked takes, not one long file, and you ' +
        'have already done the edit on the bus.</p>',
      '<hr>',
      '<h2>Logic 4</h2>',
      pic('live-coding', 'Somebody&rsquo;s screen at an algorave. The set is the source and the source is on the wall.'),
      pic('desk-lock', 'A console under red light, as a lock screen. 09:17, Saturday 11 May.', 'r'),
      pic('modular-wall', 'Four cabinets, patched, and the tuning goes with the temperature of the room.', 'r'),
      pic('studio-desk', 'Treated walls, nearfields, and the whole session on the laptop screen.'),
      '<p>The environment page is either the best idea in any sequencer or a ' +
        'punishment, and it is both: you are wiring virtual cables between virtual ' +
        'objects to build the studio you wish you had. Nobody else lets you do it. ' +
        'Nobody else makes you.</p>',
      '<p>Learn the key commands. All of them. It is faster than everything else ' +
        'and only if you never touch the mouse.</p>',
      '<hr>',
      '<h2>The stack</h2>',
      '<p>Separates, on a proper rack, and the order is not negotiable: source at ' +
        'the top where it gets no heat, amp at the bottom where it can breathe, ' +
        'and nothing sitting on the turntable.</p>',
      '<p class="kv">CD player / deck</p>',
      '<p class="kv">tuner (which you will use twice)</p>',
      '<p class="kv">tape or MD</p>',
      '<p class="kv">pre-amp</p>',
      '<p class="kv">power amp \u2014 bottom, on its own feet</p>',
      '<p>Spend the money on the speakers and the room, in that order, and ' +
        'everybody will tell you the opposite and everybody will be wrong.</p>',
      '<hr>',
      '<h2>Roland Juno-106</h2>',
      pic('worn-keys', 'The other kind of keyboard. Ivory worn through to the wood.', 'r'),
      pic('two-synths', 'A 106 and something newer on top of it, both still in the box they arrived in.', 'r'),
      pic('sh-101', 'One oscillator, one filter, and a sequencer you program by playing it.'),
      '<p>Six voices, one oscillator each, a sub, and a chorus button that is the ' +
        'reason anybody wants one. Every slider is on the front and every slider ' +
        'does one thing, so you learn subtractive synthesis in an afternoon by ' +
        'moving them.</p>',
      '<p>The voice chips fail. All of them, eventually, and there is a resin ' +
        'inside that eats them. A 106 with all six voices working is worth twice ' +
        'one with five and you can hear the missing one instantly on a held ' +
        'chord.</p>',
      '<p>Chorus II on everything is a clich\u00e9 because it is correct.</p>',
      '<hr>',
      '<h2>Studio machines: the iMac and the iBook</h2>',
      '<p>The <b>first iMac</b> is one piece, translucent, no floppy, and it goes ' +
        'on the desk of everybody who was never going to buy a beige tower. It has ' +
        'USB and nothing else, which was called arrogant and was correct.</p>',
      '<p>The <b>white iBook</b> is the one to have on a stage or in a rehearsal ' +
        'room: it survives being carried by the lid, it runs Logic, and the ' +
        'battery does what the box says.</p>',
      '<p><b>OS 9</b> is the end of the old line. Extensions, a Chooser, and one ' +
        'application able to take the whole machine down with it \u2014 which it ' +
        'will, mid-take. Rebuild the desktop, turn off everything you are not ' +
        'using, and do not open a browser while you are recording. Everyone who ' +
        'worked this way has the same set of superstitions and most of them are ' +
        'true.</p>',
      '<hr>',
      '<h2>Nick Drake, Five Leaves Left</h2>',
      '<p>1969. It sold almost nothing and he made two more and died at 26, and ' +
        'the records did the rest of it on their own over twenty years, passed ' +
        'hand to hand.</p>',
      '<p>Recorded largely live to tape with the string arrangements written by a ' +
        'friend from Cambridge who had never scored anything. That is why they ' +
        'sit where they do. Nobody who had done it before would have put them ' +
        'there.</p>',
      '<hr>',
      '<p><small>Cached 05:51. See also: ' +
        '<a href="nme.com">nme.com</a>' +
        '<a href="lowendmac.com">lowendmac.com</a>' +
        '<a href="timeout.com">timeout.com</a></small></p>',
    ],
  },

  // ---- Brighton, at ground level -------------------------------------------
  //
  // The listings page has Brighton as a day out from London. This is the town
  // as somebody who lives in it would write it down: pubs by which one you go
  // to and why, the Laines by which way round they are, the beach by the fact
  // that it hurts.
  {
    domain: 'brightonrocks.co.uk',
    name: 'BRIGHTON ROCKS',
    title: 'Brighton Rocks \u2014 what is on, where to drink, how to get home',
    body: [
      '<h1>Brighton Rocks</h1>',
      '<p><small>what is on &middot; where to drink &middot; how to get home</small></p>',
      '<hr>',
      '<h2>The middle</h2>',
      pic('flat-white-2', 'The other one. Same drink, different county.'),
      pic('pavilion-night', 'The Pavilion lit up, from the lawn, with nobody else on it.', 'r'),
      pic('cliffe-bonfire', 'Cliffe, Lewes, the fifth of November. Torches, stripes, and the whole town out.'),
      pic('votes-for-women', 'VOTES FOR WOMEN, carried at the front, with the torches behind it.', 'r'),
      pic('bonfire-flares', 'Flares up, stripes on, and the road closed for the night.'),
      pic('bonfire-fireworks', 'And crosses burning on the ground under it.', 'r'),
      pic('memorial-tree', 'The memorial and the tree, sharing the same bit of pavement every December.'),
      pic('dray-horses', 'Two in harness, stopped in the street, and the traffic going round them.', 'r'),
      '<p><b>Old Steine</b> \u2014 say STEEN and nobody will correct you twice. ' +
        'The fountain, the roundabout, the buses, and the point every direction in ' +
        'this town is measured from. Everything below it is the sea and everything ' +
        'above it is uphill.</p>',
      '<p><b>The Level</b>, up between the Steine and Preston Circus: flat grass, ' +
        'plane trees, a skate park, and the place any march either starts from or ' +
        'ends at. In summer it is the town&rsquo;s front room.</p>',
      '<p><b>Preston Park</b>, further up: the big one, with the velodrome ' +
        '\u2014 the oldest still in use in the country, and on a Tuesday evening ' +
        'you can stand at the fence for nothing and watch people go round it very ' +
        'fast indeed.</p>',
      '<hr>',
      '<h2>The Laines, both of them, and they are not the same</h2>',
      '<p><b>The Lanes</b> (one N, near the sea) are the old fishing town: narrow, ' +
        'twisting, jewellers and tourists, and you will come out somewhere you did ' +
        'not intend.</p>',
      '<p><b>North Laine</b> (one word, up from the station) is the other thing ' +
        'entirely: records, second-hand books, veg, tat, a tattooist next to a ' +
        'wholefood shop next to a place selling one kind of chair. Kensington ' +
        'Gardens, Gardner St, Sydney St. This is where the town keeps its ' +
        'character and it knows it.</p>',
      '<p><b>South Laine</b> gets said by people who mean the Lanes and everyone ' +
        'lets it go.</p>',
      '<hr>',
      '<h2>The beach</h2>',
      pic('poppy-sand', 'Written at low tide. Gone by four.'),
      pic('deckchairs', 'Six deckchairs on the shingle and one person in any of them.'),
      pic('flat-white-5', 'Fifth and last of them. Whoever it was, they never once photographed the food.', 'r'),
      '<p>It is <b>pebbles</b>. Not shingle in a nice way \u2014 pebbles, and they ' +
        'hurt, and you will not walk on them barefoot twice. Bring something to ' +
        'sit on, or use the <b>groynes</b>: the timber breakwaters running down ' +
        'into the water every hundred yards, which hold the beach on and which ' +
        'everybody uses as a windbreak and a bench and a boundary between ' +
        'themselves and whoever is next.</p>',
      '<p>Without the groynes the whole beach would be in Newhaven inside a ' +
        'decade. The sea moves it east and the timber keeps putting it back.</p>',
      '<p><b>Black Rock</b> is the far east end, past the Marina wall: where the ' +
        'town runs out and the chalk starts, and where the old open-air pool was ' +
        'until they filled it in. It is the emptiest bit of seafront within reach ' +
        'and on a weekday in February there is nobody on it at all.</p>',
      '<hr>',
      '<h2>Pubs, by what you want</h2>',
      pic('coal-fire', 'Tiled surround, real coal, and a clock that has not been wound since.', 'r'),
      '<p class="kv">The Great Eastern .... Little Preston St. Small, quiet,</p>',
      '<p class="kv">                       proper beer, a fire, and a rule about</p>',
      '<p class="kv">                       conversation nobody has written down.</p>',
      '<p class="kv">The George ........... Trafalgar St. Veggie, upstairs room,</p>',
      '<p class="kv">                       first pint of the night out of the</p>',
      '<p class="kv">                       station.</p>',
      '<p class="kv">Hobgoblin ............ York Place. Loud, cheap, black walls,</p>',
      '<p class="kv">                       and the jukebox is the reason you came.</p>',
      '<p class="kv">The Geese ............ Hanover. Up the hill, worth the hill,</p>',
      '<p class="kv">                       and everyone in it lives within four</p>',
      '<p class="kv">                       streets of it.</p>',
      '<p><b>Hanover</b> itself: the terraces stacked up the hill east of the ' +
        'Level, known as Muesli Mountain by people being funny and lived in by ' +
        'people who like being able to see the sea from the end of their road.</p>',
      '<hr>',
      '<h2>Raves &mdash; what you actually need to know</h2>',
      pic('club-lights', 'Two frames of the same second. Neither of them is in focus and that is the record.'),
      '<p>Nothing is advertised. That is not mystique, it is the Criminal Justice ' +
        'Act, which made it an offence to gather for music &quot;wholly or ' +
        'predominantly characterised by the emission of a succession of repetitive ' +
        'beats&quot; \u2014 a real sentence in a real statute, which everybody can ' +
        'quote and nobody has got over.</p>',
      '<p>So: a number, a meeting point, and a convoy. The number gives you a ' +
        'petrol station on the A27 and then a second number. The second number ' +
        'gives you the field. Nobody says the field on the first call, ever.</p>',
      '<p class="kv">&#9679; the Zap and the Escape do the legal end, on the seafront</p>',
      '<p class="kv">&#9679; the free end is out past Falmer, or the Downs, or a</p>',
      '<p class="kv">  warehouse off the Lewes Rd until somebody notices</p>',
      '<p class="kv">&#9679; take water, take a coat, take a torch, tell one person</p>',
      '<p class="kv">&#9679; the first train back is 05:34 and it is full of people</p>',
      '<p class="kv">  who have made exactly your decisions</p>',
      '<hr>',
      '<h2>Pride</h2>',
      '<p>Starts on <b>The Level</b> or the Steine depending on the year, goes ' +
        'through the town and up to <b>Preston Park</b>, and takes most of the day ' +
        'because it stops constantly. Brighton was doing this when it was still ' +
        'brave to and the town has never treated it as a visiting event: half the ' +
        'people on the float live four streets away.</p>',
      '<hr>',
      '<h2>Two useful addresses</h2>',
      '<p><b>Guitar &amp; amp shop</b>, North Laine end. Valve amps in the window, ' +
        'a repair bench at the back, and a man who will tell you your amp does not ' +
        'need a re-valve when it does not. He will also let you play something you ' +
        'cannot afford for twenty minutes on a wet Tuesday.</p>',
      '<p><b>Royal Sussex County Hospital</b>, Eastern Road, up the hill past Kemp ' +
        'Town. A&amp;E is round the side and signed badly. The 7 bus goes there ' +
        'from the Steine and it is the bus everybody ends up on eventually.</p>',
      '<hr>',
      '<p><small>Cached 05:34. See also: ' +
        '<a href="schnews.org.uk">schnews.org.uk</a>' +
        '<a href="ukclimbing.com">ukclimbing.com</a>' +
        '<a href="sussex.ac.uk">sussex.ac.uk</a>' +
        '<a href="nme.com">nme.com</a></small></p>',
    ],
  },

  // ---- the road, the hills, and the machines under the desk ----------------
  {
    domain: 'honestjohn.co.uk',
    name: 'HONEST JOHN',
    title: 'Honest John \u2014 Ask a question',
    body: [
      '<h1>Honest John</h1>',
      '<p><small>Ask a question &middot; motoring advice, free, since the paper</small></p>',
      '<hr>',
      '<h2>Q: It cuts out at junctions and starts again after a minute</h2>',
      '<p><small>from R.T., West Midlands</small></p>',
      '<p><b>A:</b> Idle control valve, nine times in ten, and it is a twenty ' +
        'minute job with a screwdriver and a can of carb cleaner. Do that before ' +
        'you let anybody sell you a fuel pump. If it is still doing it hot only, ' +
        'it is the crank sensor and that IS a part.</p>',
      '<hr>',
      '<h2>Q: Is the EcoSport any good?</h2>',
      '<p><b>A:</b> It is a small hatchback wearing wellingtons and there is no ' +
        'shame in that. Tall enough to get into without folding yourself, high ' +
        'enough to see over a hedge, and it will do a hundred and forty thousand ' +
        'if you change the oil. What it will not do is what the advert implies, ' +
        'which is go anywhere. It is front wheel drive and it knows it.</p>',
      '<hr>',
      '<h2>WHAT TO CARRY, and this is the whole list</h2>',
      pic('tax-disc', 'Disc and permit, both current, both about to stop existing as paper.'),
      pic('mot-report', 'The advisory list. Nothing on it is a fail and all of it is a bill.'),
      pic('silverstone-sign', 'Silverstone, on a wall, with the running order underneath in green.'),
      pic('rain-80', 'Eighty per cent, and the icon is doing most of the talking.', 'r'),
      '<p class="kv">a proper torch, and a second one in the boot</p>',
      '<p class="kv">jump leads long enough to reach a car facing you</p>',
      '<p class="kv">a litre of the right oil, not any oil</p>',
      '<p class="kv">water \u2014 for the radiator and for you</p>',
      '<p class="kv">gaffer tape, cable ties, and a 10mm spanner</p>',
      '<p class="kv">a blanket. Yes, in August.</p>',
      '<p>Nearly every breakdown on a British road is one of four things and three ' +
        'of them are electrical. If the lights dim when you crank it, that is the ' +
        'battery or the earth strap, and the earth strap is free.</p>',
      '<p><b>If you have stopped on a motorway:</b> out of the left doors, over the ' +
        'barrier, up the bank, and walk to the phone. Not in the car. Never in the ' +
        'car.</p>',
      '<hr>',
      '<p><small>Cached 05:22. See also: ' +
        '<a href="ukclimbing.com">ukclimbing.com</a></small></p>',
    ],
  },
  {
    domain: 'ukclimbing.com',
    name: 'UKCLIMBING',
    title: 'UKClimbing \u2014 Forums',
    body: [
      '<h1>UKClimbing</h1>',
      '<p><small>forums &raquo; the walking club</small></p>',
      '<hr>',
      '<h2>Snowdon: which way, honestly</h2>',
      '<p><small>184 replies</small></p>',
      '<p>Llanberis if you want a long walk and a cup of tea at the top. Pyg Track ' +
        'if you want it to feel like a mountain. Crib Goch if you are certain, and ' +
        'if you are asking on a forum you are not certain, and that is not an ' +
        'insult, it is the answer.</p>',
      '<p>It is a real mountain with a railway on it and people die on it every ' +
        'year in trainers, and both of those facts are true and neither cancels ' +
        'the other.</p>',
      '<p>&nbsp;&nbsp;<b>hagley_rd_regular</b></p>',
      '<p>&nbsp;&nbsp;Did it in April in cloud and saw nothing at all and it is ' +
        'still one of the best days I have had.</p>',
      '<hr>',
      '<h2>Biking down to the Snowdrop</h2>',
      '<p><small>92 replies</small></p>',
      '<p>Not the mountain \u2014 the pub in Lewes, under the cliff. Half of ' +
        'Sussex used to ride out there on a Sunday in the nineties: veggie food, a ' +
        'jukebox with things on it you had not heard, and a car park that was ' +
        'entirely bikes from about noon.</p>',
      '<p>The A27 back in the dark with the Downs on one side is one of the great ' +
        'ordinary rides in England and nobody has ever put it in a magazine.</p>',
      '<hr>',
      '<h2>The Downs above Lewes: the whole ridge in an afternoon</h2>',
      pic('bodiam', 'Bodiam, with the moat full. About as much castle as you get for the walk.'),
      pic('flint-tower', 'Flint, a round tower, and a flag put up for somebody&rsquo;s benefit.', 'r'),
      pic('compass-2750', '315&deg; NW, 40&deg;23&rsquo;35&rdquo;N, and 2,750 metres up.', 'r'),
      pic('lighthouse-night', 'Lit from the ground, so the beam is somewhere above the top of the frame.', 'r'),
      '<p><small>117 replies</small></p>',
      '<p>Out of Lewes and up, and you can walk the tops for as long as you have ' +
        'light. <b>Mount Harry</b> first \u2014 not a mountain, and it does not ' +
        'care what you call it \u2014 then <b>Black Cap</b> with its clump of ' +
        'trees you can see from half of Sussex and which is how you know where you ' +
        'are from anywhere on that side.</p>',
      '<p>Keep west along the ridge and you come to <b>Ditchling Beacon</b>, which ' +
        'is the high one, 248 metres, with the whole Weald laid out north and the ' +
        'sea behind you. On a clear day you can see both at once, which is the ' +
        'entire argument for the South Downs in one view.</p>',
      '<p><b>Ditchling</b> itself is at the bottom of the hill: a village that has ' +
        'been full of artists and letter-cutters for a century and has the good ' +
        'sense not to go on about it. The lane up to the Beacon is the one every ' +
        'cyclist in Sussex has a personal grievance with.</p>',
      '<p>&nbsp;&nbsp;<b>hagley_rd_regular</b></p>',
      '<p>&nbsp;&nbsp;Did Lewes to Ditchling Beacon and back on a Sunday in ' +
        'November and met four people the whole way. In summer it is a car park ' +
        'with a view. Go in November.</p>',
      '<hr>',
      '<h2>Barry, and the Riviera</h2>',
      pic('riviera-terrace', 'Cordylines on the front. This is Devon, and people will tell you it is not.'),
      '<p><b>Barry</b> gets laughed at by people who have not been. Barry Island ' +
        'has a proper beach, a proper fairground, and a view of the channel, and ' +
        'it has never once pretended to be anywhere else.</p>',
      '<p>The <b>English Riviera</b> \u2014 Torquay, Paignton, Brixham \u2014 has ' +
        'palm trees, which are real, and a climate that mostly justifies them. ' +
        'They put the name on in the 1900s and have been quietly getting away with ' +
        'it ever since.</p>',
      '<hr>',
      '<p><small>Cached 05:26. See also: ' +
        '<a href="honestjohn.co.uk">honestjohn.co.uk</a>' +
        '<a href="brightonrocks.co.uk">brightonrocks.co.uk</a></small></p>',
    ],
  },
  {
    domain: 'lowendmac.com',
    name: 'LOW END MAC',
    title: 'Low End Mac \u2014 Compact Macs',
    body: [
      '<h1>Low End Mac</h1>',
      '<p><small>compact Macs &middot; and other machines under other desks</small></p>',
      '<hr>',
      '<h2>Macintosh Classic (1990)</h2>',
      pic('desktop-pattern', 'The desktop pattern, blown up. Eight colours doing the work of thousands.', 'r'),
      pic('rainbow-lock', 'Six stripes on a lock screen, forty years after they took them off the case.', 'r'),
      '<p class="kv">68000 at 8 MHz &middot; 1\u20134 MB &middot; 9in mono, 512x342</p>',
      '<p class="kv">40 MB hard disk &middot; \u00a3799 &middot; carried by its own handle</p>',
      '<p>The last of the shape. Nothing about it was fast and nothing about it ' +
        'was in the way: one window, one thing, a screen the size of a paperback ' +
        'and a system that fitted in the machine.</p>',
      '<p>Hold Cmd-Opt-X-O at boot and it starts from a System 6.0.3 image in ROM, ' +
        'which is a thing a computer used to be allowed to have.</p>',
      '<hr>',
      '<h2>The Apple Style Guide</h2>',
      pic('pet-micro', 'Monitor, keyboard and tape deck in one shell. You did not buy the parts.', 'r'),
      '<p>Not a manual \u2014 a book about how to WRITE about a computer. It told ' +
        'you to say choose for a menu and click for a button and press for a key, ' +
        'and never to say the user in something a user would read.</p>',
      '<p>Every interface that reads like it was written by somebody who wanted you ' +
        'to succeed was written by somebody who had read it. It is out of print, ' +
        'the rules are still right, and almost nobody shipping software has seen ' +
        'a copy.</p>',
      '<hr>',
      '<h2>The other end: Tiny, Gateway</h2>',
      pic('workshop-shelves', 'The back room. Four decades of it on open shelving.', 'r'),
      pic('console-desk', 'Console, printer, and a desk built around the machine rather than the person.'),
      '<p><b>Tiny Computers</b> sold beige boxes off the page and out of shops on ' +
        'the high street, on finance, to people who had never owned one. They went ' +
        'under owing everybody money and the machines mostly kept working, which ' +
        'is a strange kind of epitaph.</p>',
      '<p><b>Gateway</b> shipped theirs in a box printed like a Holstein cow, from ' +
        'South Dakota, and you could specify it down to the drive. The cow box was ' +
        'the best marketing decision in the industry and everyone who got one ' +
        'remembers the box before the computer.</p>',
      '<hr>',
      '<p><small>Cached 05:29. See also: ' +
        '<a href="pcplus.co.uk">pcplus.co.uk</a>' +
        '<a href="ipodlounge.com">ipodlounge.com</a></small></p>',
    ],
  },

  // ---- the music, the newsletter, and the thing in your pocket -------------
  {
    domain: 'ipodlounge.com',
    name: 'IPODLOUNGE',
    title: 'iPod Lounge \u2014 the first one',
    body: [
      '<h1>iPod Lounge</h1>',
      '<p><small>the first one &middot; forum &raquo; hardware &raquo; classic</small></p>',
      '<hr>',
      '<h2>Appreciation thread: the original, 5GB, mechanical wheel</h2>',
      pic('full-battery', '23:02, a hundred per cent, and slide to unlock.', 'r'),
      '<p><small>412 replies</small></p>',
      '<p>The wheel <i>turned</i>. Not a touch surface pretending to turn \u2014 a ' +
        'physical ring that spun under your thumb with four buttons around it, and ' +
        'you could work the whole thing in a coat pocket without looking, which no ' +
        'device since has let anyone do.</p>',
      '<p class="kv">5 GB &middot; 1,000 songs &middot; 185 g &middot; FireWire</p>',
      '<p class="kv">scroll wheel, mechanical &middot; 10 hours &middot; \u00a3349</p>',
      '<p>FireWire is the forgotten half. A whole CD collection went across in ' +
        'minutes when USB would have taken an evening, and it charged down the ' +
        'same cable. People remember the wheel. The wheel was not why it won.</p>',
      '<p>&nbsp;&nbsp;<b>hollow_bell_9</b></p>',
      '<p>&nbsp;&nbsp;The back scratched if you looked at it. Mine went in a sock. ' +
        'Everyone I knew kept theirs in a sock.</p>',
      '<p>&nbsp;&nbsp;<b>pillar_of_salt_88</b></p>',
      '<p>&nbsp;&nbsp;1,000 songs in your pocket was the entire pitch and it was ' +
        'the correct pitch. It was also, for about four years, the actual number ' +
        'of songs anybody had.</p>',
      '<p><b>quiller</b></p>',
      '<p>Mine still spins. The battery is dead, the drive still sounds like a ' +
        'drive, and there is a mix on it from a night I could not tell you the ' +
        'date of and can hear in order.</p>',
      '<hr>',
      '<p><small>Cached 05:11. See also: ' +
        '<a href="soundonsound.com">soundonsound.com</a>' +
        '<a href="lowendmac.com">lowendmac.com</a></small></p>',
    ],
  },
  {
    domain: 'nme.com',
    name: 'NME',
    title: 'NME \u2014 Archive',
    body: [
      '<h1>NME</h1>',
      '<p><small>archive &middot; live &amp; reviews</small></p>',
      '<hr>',
      '<h2>Reading, and Glastonbury</h2>',
      '<p><b>Reading</b> is a car park by a river and it does not pretend to be ' +
        'anything else, and that is why it works: three days, one field, and ' +
        'everybody there for the bands rather than for the experience. Rains every ' +
        'year. Everybody knows it will rain every year and nobody brings the right ' +
        'boots.</p>',
      '<p><b>Glastonbury</b> is a town-sized thing on a working dairy farm and you ' +
        'will not see a tenth of it. The bands are the least interesting reason to ' +
        'go. Walk to the top by the stone circle at about five in the morning and ' +
        'look back down at it \u2014 that is the thing people are actually ' +
        'describing when they come back and cannot explain themselves.</p>',
      '<p>Practical, both: cheap wellingtons will destroy your feet by day two, ' +
        'take a bin bag for the tent, and write down where you left it because you ' +
        'will not recognise it in the dark.</p>',
      '<hr>',
      '<h2>The Wire</h2>',
      '<p>A monthly that covers the music nobody else will: free improvisation, ' +
        'electronics, modern composition, whatever has just arrived and has no ' +
        'name yet. It takes all of it entirely seriously, which is either the best ' +
        'or the funniest thing about it depending on the month.</p>',
      '<p>It will send you off after records you cannot find and occasionally one ' +
        'of them will rearrange what you think music is for. That ratio has been ' +
        'stable for twenty years.</p>',
      '<hr>',
      '<h2>The Levellers, Metway Studios, Brighton</h2>',
      pic('metway-live-room', 'The live room at Metway. Two of them, waiting for the engineer.', 'r'),
      '<p>They bought a knackered building in <b>Kemp Town</b> and turned it into a ' +
        'studio, a rehearsal space and an office, and then let half of Brighton ' +
        'use it. Owning the building is the whole story: no label could tell them ' +
        'what a record cost, because they knew what it cost.</p>',
      '<p>Everyone files them under crusty and moves on. The thing worth filing is ' +
        'that they built the infrastructure and kept it.</p>',
      '<hr>',
      '<h2>New Model Army</h2>',
      '<p>Bradford, and it shows, and that is the point. Twenty years of a band ' +
        'that has never once softened for a room and has an audience that would ' +
        'follow them into a river. Justin Sullivan writes about work and land and ' +
        'staying, which almost nobody does.</p>',
      '<hr>',
      '<h2>The Wonder Stuff &middot; Ned&rsquo;s Atomic Dustbin</h2>',
      '<p>Both out of the <b>West Midlands</b>, both bigger than anybody outside ' +
        'the Midlands has ever been prepared to admit. Ned&rsquo;s had two bass ' +
        'players, which sounds like a stunt and was a sound: one holding the ' +
        'bottom, one up where a guitar should be.</p>',
      '<p>The Stuffies played Stourbridge like it was a capital city, because for ' +
        'about three years it was one.</p>',
      '<hr>',
      '<h2>WARD, on Loca Records</h2>',
      '<p>Brighton, on <b>Loca</b>, who put records out under licences that let ' +
        'you copy and rework them years before anybody else in music was ' +
        'thinking about it. The label is the argument as much as the records ' +
        'are.</p>',
      '<p>The <i>bear stanhope</i> sleeve is the one people remember. It turns up ' +
        'in record shops filed under three different letters depending on who was ' +
        'doing the filing.</p>',
      '<hr>',
      '<h2>Boards of Canada</h2>',
      '<p>Two brothers, a farm, and tape that has been left in the sun. Everything ' +
        'is slightly out of tune with itself and that is deliberate and it is why ' +
        'it sounds like a memory rather than a record.</p>',
      '<p><i>Music Has the Right to Children</i> is the one everybody starts with ' +
        'and it is correct to start there.</p>',
      '<hr>',
      '<h2>Caf\u00e9 del Mar</h2>',
      '<p>A bar on the west side of Ibiza where the sun goes down over the water ' +
        'and somebody had the idea of putting out a record of what they played ' +
        'while it did. Volume after volume, all of them the same hour of the day.</p>',
      '<p>It has been laughed at for twenty years by people who have never once ' +
        'played volume one end to end. It is a genuinely good compilation and it ' +
        'is a record of a place at a time, which is a harder thing to make than ' +
        'a good record.</p>',
      '<p>Half the copies in the country were bought by people who had not been ' +
        'and were not going to go. That is not a criticism of them.</p>',
      '<hr>',
      '<p><small>Cached 05:14. See also: ' +
        '<a href="schnews.org.uk">schnews.org.uk</a>' +
        '<a href="soundonsound.com">soundonsound.com</a>' +
        '<a href="brightonrocks.co.uk">brightonrocks.co.uk</a></small></p>',
    ],
  },
  {
    domain: 'schnews.org.uk',
    name: 'SCHNEWS',
    title: 'SchNEWS \u2014 free weekly direct action newsheet, Brighton',
    body: [
      '<h1>SchNEWS</h1>',
      '<p><small>free weekly direct action newsheet &middot; Brighton &middot; ' +
        'issue 1,041</small></p>',
      '<hr>',
      '<p><b>PARTY &amp; PROTEST.</b> One side of A4, both sides photocopied, out ' +
        'every Friday, free, and if you want it in your town you print it in your ' +
        'town. That is the whole distribution model and it has outlasted three ' +
        'papers that had buildings.</p>',
      '<hr>',
      '<h2>THIS WEEK</h2>',
      '<p>Road protest at the bypass enters week nine. Two tunnels, one treehouse ' +
        'net, and a security firm that has now billed more than the contested ' +
        'section of road is worth.</p>',
      '<p>Squatted social centre on the Lewes Road served papers. Meeting Thursday, ' +
        'bring a van if you have a van.</p>',
      '<p>Criminal Justice Act update, again, and no it has not gone away and no ' +
        'they have not stopped using it.</p>',
      '<hr>',
      '<h2>SchNEWS IN BRIEF</h2>',
      '<p class="kv">&#9679; Benefit gig, Kemp Town, Sat, pay what you can</p>',
      '<p class="kv">&#9679; Bike workshop Weds, bring your own puncture</p>',
      '<p class="kv">&#9679; Anyone with a photocopier at work: you know what to do</p>',
      '<hr>',
      '<p><b>DISCLAIMER.</b> SchNEWS warns all readers not to confuse a bypass with ' +
        'a way past. Honest.</p>',
      '<p><small>Cached 05:16. The website outlived the paper by four years and ' +
        'then stopped mid-sentence. See also: ' +
        '<a href="brightonrocks.co.uk">brightonrocks.co.uk</a>' +
        '<a href="libcom.org">libcom.org</a></small></p>',
    ],
  },

  // ---- Oslo -----------------------------------------------------------------
  {
    domain: 'uio.no',
    name: 'UIO',
    title: 'Universitetet i Oslo \u2014 Institutt for medier og kommunikasjon',
    body: [
      '<h1>Universitetet i Oslo</h1>',
      '<p><small>Institutt for medier og kommunikasjon (IMK) &middot; Det humanistiske fakultet</small></p>',
      '<hr>',
      '<h2>About the department</h2>',
      pic('atrium-lifts', 'The atrium. Glass lifts, and you can see every floor from any floor.', 'r'),
      '<p><b>IMK</b> sits up on the Blindern campus and studies what media do to ' +
        'people and what people do back. Journalism, film, and \u2014 the reason ' +
        'anybody reads this page from outside Norway \u2014 a long-running line of ' +
        'work on computation as a cultural form rather than as a tool.</p>',
      '<h2>Research</h2>',
      '<p class="kv">Media use and everyday life</p>',
      '<p class="kv">Political communication</p>',
      '<p class="kv">Software, platforms and infrastructures</p>',
      '<p class="kv">Digital methods and the critique of measurement</p>',
      '<p>Most of it is funded through the <b>Norges forskningsr\u00e5d</b> (the ' +
        'Research Council of Norway), which is the sentence every project here ' +
        'ends with and the reason any of it happens.</p>',
      '<h2>Getting here</h2>',
      pic('borgen-station', 'Borgen. Two stops before you give up and walk.', 'r'),
      pic('elephant-on-the-5', 'Hanging off the rail on the 5. The board behind reads Sognsvann.'),
      pic('lillestrom', 'Lillestr&oslash;m. Change here, or do not, and end up in Sweden.'),
      pic('concrete-atrium', 'Raw concrete on one side, white boxes cantilevered out of the other.'),
      pic('lobby-statue', 'Marble, between two columns, at the foot of the stairs everybody uses.', 'r'),
      '<p>Blindern, on the T-bane. If you are living in <b>Briskeby</b> you can ' +
        'walk it in twenty-five minutes through <b>St. Hanshaugen</b>, which is ' +
        'the better way even in February, and in June it is not a decision.</p>',
      '<hr>',
      '<p><small>Cached 05:02. See also: ' +
        '<a href="forskningsradet.no">forskningsradet.no</a>' +
        '<a href="norskeord.no">norskeord.no</a>' +
        '<a href="roughguides.com">roughguides.com</a></small></p>',
    ],
  },
  {
    domain: 'forskningsradet.no',
    name: 'FORSKNINGSRADET',
    title: 'Norges forskningsr\u00e5d \u2014 The Research Council of Norway',
    body: [
      '<h1>Norges forskningsr\u00e5d</h1>',
      '<p><small>The Research Council of Norway</small></p>',
      '<hr>',
      '<p>We fund research. Applications open twice a year and are assessed by ' +
        'international panels.</p>',
      '<h2>Open calls</h2>',
      pic('samfunnsforskning', 'Cut into the lintel, so the name of the place cannot be rebranded.', 'r'),
      pic('brick-tower', 'Round tower, red brick, and a lawn nobody is allowed to sit on.'),
      pic('test-rig', 'Octagonal, orange, and bolted to a trolley in the middle of a hall.'),
      '<p class="kv">FRIPRO ............ researcher-led, any field</p>',
      '<p class="kv">SAMKUL ............ cultural conditions of society</p>',
      '<p class="kv">IKTPLUSS .......... ICT and digital innovation</p>',
      '<p><small>All three calls closed. The portal returned 503 on the last ' +
        'crawl and every deadline on this page has passed.</small></p>',
      '<hr>',
      '<p><small>Cached 05:04.</small></p>',
    ],
  },
  {
    domain: 'norskeord.no',
    name: 'NORSKE ORD',
    title: 'How to learn Norwegian \u2014 a page for the stubborn',
    body: [
      '<h1>How to learn Norwegian</h1>',
      '<p><small>a page for the stubborn &middot; by somebody who did it slowly</small></p>',
      '<hr>',
      '<p>Everyone in Oslo speaks better English than you speak Norwegian and they ' +
        'will switch the moment you hesitate. That is kindness and it is the whole ' +
        'problem. Here is what worked.</p>',
      '<h2>1. The hard part is not the grammar</h2>',
      '<p>The grammar is easy. Word order, two genders if you take the easy road, ' +
        'no cases worth the name, verbs that barely conjugate. You could read a ' +
        'newspaper in three months and you still would not be able to buy bread ' +
        'without switching to English, because the hard part is the pitch and the ' +
        'nerve.</p>',
      '<h2>2. Learn the small words first</h2>',
      '<p class="kv">jo ......... yes, against a negative. Untranslatable. Vital.</p>',
      '<p class="kv">da ......... then, but mostly a shrug at the end of a sentence</p>',
      '<p class="kv">altså ...... so / I mean / well then</p>',
      '<p class="kv">forresten .. by the way (and by the way, the real point)</p>',
      '<p class="kv">koselig .... they will tell you it is untranslatable. It is.</p>',
      '<h2>3. Say the thing badly, at speed</h2>',
      '<p>Norwegians are far more tolerant of a wrong word said confidently than a ' +
        'right one said after four seconds of visible arithmetic. Four seconds is ' +
        'the switch point. Get in under it.</p>',
      '<h2>3b. Two words you will need on day one</h2>',
      '<p class="kv">kj\u00f8leskap ... fridge (KYUR-le-skahp). Literally</p>',
      '<p class="kv">                cool-cupboard, which is what it is.</p>',
      '<p class="kv">br\u00f8drister ... toaster. Bread-roaster. Same trick.</p>',
      '<p>Norwegian builds words by sticking words together and telling you what ' +
        'the thing does. Once you notice, half the vocabulary stops being ' +
        'vocabulary and starts being a description you can work out.</p>',
      '<h2>4. Dialects</h2>',
      '<p>There is no spoken standard and nobody is going to give you one. Every ' +
        'valley writes its own way and the state prints two of them. Pick the one ' +
        'you hear at the shop and stop worrying about it.</p>',
      '<h2>5. The bit nobody says</h2>',
      pic('gethsemane', 'Hung high in the nave where you have to tip your head back.', 'r'),
      pic('church-interior', 'Sunday, and about a third full, which counts as a good turnout.', 'r'),
      pic('salmebok', 'Eight of them on one shelf and about four hundred in the building.'),
      pic('leverpostei', 'Leverpostei. The child on the lid has not aged since about 1980.'),
      pic('aquavit', 'Gammel Opland. It has been to Australia and back in a barrel, allegedly.', 'r'),
      pic('norwegian-flag', 'Up the pole and straight out. Flag days are in the almanac and people keep to them.', 'r'),
      pic('sankthans-bonfire', 'Built all afternoon and lit at about ten, when it is still not dark.', 'r'),
      pic('bilberries', 'Bl&aring;b&aelig;r, off the forest floor, in about forty minutes. Everything is stained for a week.'),
      pic('knekkebrod', 'Three, and the middle one is the brown cheese.', 'r'),
      '<p>You will get to the level where you understand everything and can say ' +
        'almost nothing, and stay there for about a year, and it feels like ' +
        'failure and is not. It is the last flat bit before it goes.</p>',
      '<h2>6. Things worth knowing that are not language</h2>',
      pic('sognsvann', 'Sognsvann in July. The path round is an hour if you do not stop.'),
      pic('sun-through-pines', 'Straight into it, off the water, with the lens flaring all down the frame.'),
      pic('lake-splash', 'Somebody has just gone in. The water is about fourteen degrees.', 'r'),
      pic('snofrisk', 'Sn&oslash;frisk. Goat, fresh, naturell, and it comes in a triangle.'),
      pic('brunost-boiler', 'Standing outside in the snow with no fence round it.'),
      pic('brunost-plate', 'The plate on the side of it. 2,200 litres an hour, whey, under vacuum.', 'r'),
      pic('park-walk', 'Down through the park, three abreast, in the four o&rsquo;clock light.'),
      pic('obelisk-grave', 'Wreath still on it, and somebody has been by this week.', 'r'),
      pic('stacked-ved', 'Ved, stacked indoors by the door. This is a whole winter.', 'r'),
      pic('stove-fire', 'The stove going properly. This is the whole evening&rsquo;s entertainment.', 'r'),
      '<p><b>Kroner</b>, and everything costs more than you think and slightly ' +
        'less than you feared. Nobody carries cash. The card works everywhere ' +
        'including the man selling waffles at the ski jump.</p>',
      '<p>The <b>T-bane</b> is the metro and the <b>trikk</b> is the tram, and ' +
        'you want the trikk: it goes overground through the middle of everything ' +
        'and you can see where you are. <b>Majorstuen</b> is where the lines knot ' +
        'together and where you will change without meaning to.</p>',
      '<p><b>Sognsvann</b> is the end of the number 5 line: a lake in the forest, ' +
        'twenty minutes from the middle of the city, with a path round it that ' +
        'takes an hour and is walked by half of Oslo on a Sunday. In winter it is ' +
        'a ski track. Nobody thinks this is remarkable and everybody who visits ' +
        'does.</p>',
      '<p>And the <b>grill</b>. A disposable foil barbecue, sold in every shop ' +
        'from May, and the first warm evening of the year the entire country is ' +
        'sitting on grass next to one. There are rules about where you may put ' +
        'them down and everybody knows the rules.</p>',
      '<p class="kv">lykke til</p>',
      '<hr>',
      '<p><small>Cached 05:07. See also: ' +
        '<a href="uio.no">uio.no</a>' +
        '<a href="roughguides.com">roughguides.com</a></small></p>',
    ],
  },

  // ---- London, and the room the wire came into -----------------------------
  {
    domain: 'timeout.com',
    name: 'TIME OUT',
    title: 'Time Out London — Listings',
    body: [
      '<h1>Time Out London</h1>',
      '<p><small>Listings &middot; this week</small></p>',
      '<hr>',
      '<h2>East</h2>',
      pic('flat-white', 'Red cup, white heart. Four pounds and worth it.', 'r'),
      pic('sourdough', 'Seasalt and rosemary, &pound;2.20 the half or &pound;3.70 the whole.', 'r'),
      pic('truman-bridge', 'The Truman bridge over Brick Lane. Vintage market that way, everything else the other.', 'r'),
      '<p><b>333</b>, 333 Old Street, <b>Shoreditch</b>. Three floors, three ' +
        'different nights, one lift that has never worked. Upstairs is the ' +
        '<b>Mother Bar</b> and upstairs is where everyone ends up at four in the ' +
        'morning whatever they came for.</p>',
      '<p class="kv">Fri &middot; drum and bass, basement</p>',
      '<p class="kv">Sat &middot; electro upstairs, whatever downstairs</p>',
      '<p class="kv">Sun &middot; Mother, until it stops</p>',
      '<p><b>Brick Lane</b>, E1. Records at the top end, bagels at the bottom end, ' +
        'open at any hour you can think of. The curry houses will each tell you ' +
        'they are the original one and you should let them.</p>',
      '<p><b>Smallfish Records</b>, Old Street. Electronic, mostly twelves, and ' +
        'they will play you anything in the shop and not sell it to you if they ' +
        'think you have misunderstood it.</p>',
      '<p><b>Old St station</b> and the roundabout it sits inside: a set of ' +
        'subways with a station in the middle, eight exits, and no two people who ' +
        'have ever agreed on which one to use. Everything east of it is walkable ' +
        'and everything in this listing is a ten minute walk from exit 3.</p>',
      '<p><b>Electricity Showrooms</b>, Old Street. It really was one \u2014 the ' +
        'showroom where the borough came to look at electric fires. Downstairs is ' +
        'a nightclub and upstairs is a bar with a curved window you can watch the ' +
        'whole road out of, and it is the room that made this end of Old Street ' +
        'happen.</p>',
      '<p><b>Rivington St</b>, the alley behind. <b>Bricklayers Arms</b> at the ' +
        'top, which was a bricklayers&rsquo; pub and is now not, and is somehow ' +
        'still a good pub. <b>The Barley Mow</b>, Curtain Road end, for when the ' +
        'rest of it is too loud and you want a table and a conversation.</p>',
      '<p><b>Hoxton Square</b>, the other side of Old Street. A square of grass ' +
        'with plane trees round it, a bar on one side and a gallery on another, ' +
        'and on a sunny Sunday the whole of it is people sitting on the ground ' +
        'doing nothing in particular. There is somebody there every weekend with ' +
        'a MiniDisc recorder and a small mic, and they are right to be.</p>',
      '<p>North and east of all this is <b>Hackney</b>, which is not fashionable ' +
        'yet and is about to be, and everybody who lives there can feel it ' +
        'happening and cannot say when it started.</p>',
      '<hr>',
      '<h2>North</h2>',
      pic('senate-house', 'Senate House, Bloomsbury. Orwell knew exactly what he was looking at.', 'r'),
      pic('orwell-statue', 'Coat open, mid-stride, outside the building he worked in.'),
      pic('dalek', 'Parked in a lobby by the lifts, roped off from nothing.', 'r'),
      pic('tardis', 'And the box, with a notice stuck on the door about opening times.'),
      pic('hotel-lounge', 'Four storeys of paintings and about thirty chairs, all of them empty.'),
      pic('metro-tiles', 'White metro, black grout, and a mosaic floor put down by somebody paid by the hour.'),
      pic('orange-bar', 'Two hundred ISO and a shutter that never closed. Everybody in it is a smear.', 'r'),
      '<p><b>Angel</b>, N1. <b>Upper St</b> end to end is about forty minutes and ' +
        'about nine pubs if you are thorough. The Tube station has the longest ' +
        'escalator in western Europe, which everybody tells you and which is true.</p>',
      '<p><b>Highbury Corner</b> — the roundabout that is not a roundabout any ' +
        'more, then <b>Highbury Fields</b>, which is the only flat grass for a ' +
        'mile and on a hot Thursday holds the entire borough.</p>',
      '<p><b>Holloway Rd</b>, N7. Long, loud, and the last of the second-hand ' +
        'furniture shops. The 43 and the 271 all night.</p>',
      '<hr>',
      '<h2>Out east, properly</h2>',
      pic('wine-stockroom', 'The back of the shop. Everything in the front is a lie about how much there is.'),
      '<p><b>Leytonstone</b>, E11. Where the Central Line stops pretending to be ' +
        'a tube and comes up into the daylight, and where the flats are cheap ' +
        'enough that everybody who works in the middle and cannot afford the ' +
        'middle ends up. Hitchcock was born over a greengrocer&rsquo;s here and ' +
        'there is a mosaic about it in the subway.</p>',
      '<p>The <b>Central Line</b> itself: red on the map, straight through the ' +
        'whole city, and the oldest and hottest thing you will ever stand up in. ' +
        'No air conditioning and no prospect of any, deep tube tunnels with ' +
        'nowhere to put the heat. In August it is thirty-five degrees at Bank and ' +
        'everybody stands in it every day without discussing it.</p>',
      '<p><b>Ilford</b>, <b>Essex</b>. Central Line to Newbury Park and then it is ' +
        'somebody else&rsquo;s idea of London and their own idea of Essex, and ' +
        'they are both right.</p>',
      '<hr>',
      '<h2>Down the line</h2>',
      pic('paddington-jigsaw', 'A hundred pieces, done on the table, and one of them is under the seat.', 'r'),
      pic('peckham-rye', 'Peckham Rye. Fare zone 2, and the brick is original.', 'r'),
      pic('the-shard', 'Straight up the flat side of it, with a lamp standard for scale.', 'r'),
      pic('folded-ceiling', 'Folded paper, several hundred of them, hung off the ceiling of a room full of people.'),
      '<p><b>Brighton</b>, <b>East Sussex</b>. Fifty minutes from Victoria. Every ' +
        'record shop, every second-hand bookshop, and the sea, which is the point ' +
        'and which is freezing.</p>',
      '<p><small>The town properly, by somebody who lives in it: ' +
        '<a href="brightonrocks.co.uk">brightonrocks.co.uk</a></small></p>',
      '<p>The <b>Lewes Rd</b> is the other Brighton: the long road out past the ' +
        'university, the scrapyards and the bike shops, the vegan caf\u00e9s and ' +
        'the squatted social centre that has been three different squatted social ' +
        'centres. Nobody puts it in a guide. It is where the town actually lives, ' +
        'and it goes all the way up to the Downs and stops.</p>',
      '<p><small>Cached 04:41. Every venue in this listing has closed. ' +
        'See also: <a href="brightonrocks.co.uk">brightonrocks.co.uk</a>' +
        '<a href="nme.com">nme.com</a></small></p>',
    ],
  },
  {
    domain: 'reuters.com',
    name: 'REUTERS',
    title: 'Reuters — About / Our History',
    body: [
      '<h1>Reuters</h1>',
      '<p><small>About &raquo; Our history</small></p>',
      '<hr>',
      '<p>The house was on <b>Fleet St</b> before Fleet St meant anything else, ' +
        'and the business has always been the same one: get the number to the ' +
        'person who needs it before anybody else has it, and be right.</p>',
      '<h2>The machines</h2>',
      '<p>The floor ran on <b>DEC</b> for twenty years. <b>PDP-11</b>s first, then ' +
        '<b>VAX</b> under <b>VMS</b>, and most of what moved the prices was ' +
        'written in <b>VAX Pascal</b> by people who were hired to do something ' +
        'else and never got out.</p>',
      '<p class="kv">PDP-11/70 .... the wire, and the ticker</p>',
      '<p class="kv">VAX 11/780 ... the money side, and the archive</p>',
      '<p class="kv">VMS .......... versioned files, which saved somebody weekly</p>',
      '<p>VMS put a version number on every file, so nothing you edited ever ' +
        'destroyed what was there before. A generation of people learned what ' +
        'safety in a computer feels like from that one design decision and have ' +
        'been quietly disappointed ever since.</p>',
      '<h2>Elsewhere</h2>',
      pic('standard-interest-rates', 'The stand outside the station, about six. Same headline on both sides.'),
      '<p>Bureaux in <b>Geneva</b>, New York, Singapore, and about a hundred more. ' +
        'The <b>Geneva</b> desk did commodities and the UN and had the best coffee ' +
        'in the organisation, which was a matter of record.</p>',
      '<hr>',
      '<p><small>Cached 04:44. The wire is down. The building is still there. ' +
        'See also: <a href="pcplus.co.uk">pcplus.co.uk</a>' +
        '<a href="timeout.com">timeout.com</a></small></p>',
    ],
  },
  {
    domain: 'roughguides.com',
    name: 'ROUGH GUIDES',
    title: 'Rough Guides — Readers\u2019 letters',
    body: [
      '<h1>Rough Guides</h1>',
      '<p><small>Readers&rsquo; letters &middot; unedited</small></p>',
      '<hr>',
      '<h2>Koh Pha Ngan, Thailand</h2>',
      pic('mantis-glass', 'Came up the outside of the glass and stayed there for the whole meal.'),
      '<p>Everybody goes for the full moon and stays for <b>Bottle Beach</b>, ' +
        'which you cannot drive to. Longtail from Chaloklum, twenty minutes, and ' +
        'the boat only goes when the boat goes. Three sets of bungalows, no road, ' +
        'and the generator stops at eleven so the sky comes back.</p>',
      '<p>I met a man there who had been meaning to leave for nine years. He was ' +
        'not stuck and he was not happy. He was exactly where he had decided to ' +
        'be, which is rarer.</p>',
      '<hr>',
      '<h2>Brooklyn, New York</h2>',
      pic('biscuits-sausage-gravy', 'A place card at a hotel breakfast. Nobody could explain the gravy.', 'r'),
      pic('odells', 'A brewery sign the size of a garage door, with a mountain on it.'),
      '<p>Stay in <b>Brooklyn</b>, not Manhattan, and take the bridge on foot at ' +
        'least once at about six in the morning when it is only runners and the ' +
        'light is coming up the river behind you.</p>',
      '<p>The whole of <b>New York</b> is somebody else&rsquo;s hometown, which is ' +
        'the thing nobody tells you and the thing that makes it bearable.</p>',
      '<hr>',
      '<h2>Oslo, on the cheap</h2>',
      pic('hytte-ved', 'Splitting for the hytte. Two frames, one swing.'),
      pic('clas-ohlson', 'Clas Ohlson. Screws, cable, and a hammer, at Norwegian prices.', 'r'),
      pic('snow-graveyard', 'Half three in the afternoon in January, and the lights are already on.'),
      pic('snow-boarding', 'Boarding in it. They de-ice at the stand and you go anyway.', 'r'),
      pic('snow-avenue', 'Half four in the afternoon, and the palace lit up at the end of it.', 'r'),
      pic('dandelion-fountain', 'The dandelion outside the National Theatre, running all summer.', 'r'),
      pic('mikkeller', 'Mikkeller STHLM. The beer list is longer than the food menu by a factor of six.'),
      pic('moose-head', 'On the wall by the door, under the exit sign, watching the room.', 'r'),
      '<p>Fly to <b>Torp</b> and not to Gardermoen. It is called Oslo and it is ' +
        'an hour and a half south of Oslo down the E18, and the coach meets the ' +
        'plane and is timed to it, and the fare difference pays for the coach ' +
        'twice over. Everybody who lives there knows this and no airline will tell ' +
        'you.</p>',
      '<p><b>Aker Brygge</b> on the water is where the whole city goes when the sun ' +
        'is out: old shipyard, glass and timber now, boats and ice cream and ' +
        'prices you should look at before you sit down.</p>',
      '<p>Get the T-bane out to <b>Holmenkollen</b> for the ski jump. You can stand ' +
        'at the top of the in-run in July with no snow anywhere and it is still ' +
        'frightening \u2014 a concrete ramp pointed at a city, and people go down ' +
        'it on purpose.</p>',
      '<p>And the <b>waffles</b>. Heart-shaped, five joined together, soft not ' +
        'crisp, served warm with brown cheese or with sour cream and jam. Every ' +
        'ski hut, every ferry, every church basement fundraiser. It is not a ' +
        'dessert, it is a national institution with a smell.</p>',
      '<hr>',
      '<h2>Barcelona</h2>',
      pic('sagrada-facade', 'The Nativity fa&ccedil;ade, and a crane, which has been part of the building since before anyone alive.'),
      '<p>Started 1882 and still going. The crane is not scaffolding on a ' +
        'finished thing, it is the building being built, and every visitor has ' +
        'photographed it in the belief that they caught it mid-repair.</p>',
      pic('sagrada-ceiling', 'Up the columns. They branch like trees because he worked out that trees had already solved it.', 'r'),
      '<p>Inside, go on a bright afternoon and stand in the middle. The columns ' +
        'branch overhead and the glass throws colour across the floor that moves ' +
        'while you watch it.</p>',
      '<p>The rest of the city is flat, walkable, and laid out on a grid with the ' +
        'corners cut off, which was a nineteenth-century decision about carts and ' +
        'turned out to be a very good decision about everything else. See also ' +
        '<a href="libcom.org">libcom.org</a>, which has the square in it.</p>',
      '<hr>',
      '<h2>&THORN;ingvellir, Iceland</h2>',
      pic('thingvellir', 'The rift at &THORN;ingvellir. The wall on the left is North America.', 'r'),
      '<p>An hour east of Reykjav&iacute;k, in a rift where two plates are pulling ' +
        'apart at about the rate your fingernails grow. You can walk down the ' +
        'middle of it.</p>',
      '<p>The Alth&iacute;ng met on this spot from 930, out of doors, once a year, ' +
        'for eight centuries. There is no building. There is a rock wall that ' +
        'throws your voice back at you, and that was the whole apparatus.</p>',
      '<hr>',
      '<h2>Athens</h2>',
      pic('self-locking', 'CAUTION SELF LOCKING DOORS, read from the wrong side, too late.'),
      pic('parthenon', 'Up on the rock at eight in the morning, before the coaches.', ''),
      '<p>Go up at eight, before the first coach. The marble is the colour of ' +
        'nothing else at that hour and by ten there are four hundred people on it.</p>',
      '<p>Half the columns you are looking at were put back in the last fifty ' +
        'years, and the crane has been part of the skyline so long that people ' +
        'photograph it on purpose.</p>',
      '<hr>',
      '<h2>Paris</h2>',
      pic('notredame-night', 'Notre-Dame from the east, about eleven at night.', 'r'),
      pic('notredame-tree', 'The same building in December, with a tree lit up in front of it.', 'r'),
      pic('cognac-napoleon', 'F. Geoffroy &amp; Fils. Est. 1865, and the label has not moved since.'),
      '<p>Walk it. The whole thing is smaller than it looks on the map and the ' +
        'Metro will rob you of the only part worth having, which is the bit ' +
        'between the places you meant to go.</p>',
      '<hr>',
      '<h2>Dubrovnik, Croatia</h2>',
      '<p>A walled coastal city on the Adriatic, and the wall is the whole point: ' +
        'you can walk the complete circuit of it, two kilometres, right round the ' +
        'top, looking down into everybody&rsquo;s courtyard on one side and out at ' +
        'the sea on the other.</p>',
      '<p>Go at eight in the morning before the ships come in, or at six when they ' +
        'have gone. In the four hours between, the old town holds more people than ' +
        'live in it.</p>',
      '<p>The roofs are a patchwork of two oranges \u2014 the old tiles and the ' +
        'ones that replaced what was shelled in the nineties. Nobody points this ' +
        'out to you and once you have seen it you cannot stop counting.</p>',
      '<hr>',
      '<h2>Sketty, Swansea</h2>',
      pic('rhossili', 'Rhossili, looking down the three miles of it. Twenty minutes from Sketty.'),
      pic('swansea-streetview', 'Street view of the road. The car went past at about eleven in the morning.', 'r'),
      pic('severn-crossing', 'The second crossing, westbound, in about the weather you would expect.', 'r'),
      pic('swansea-1145', '11:45 to Reading, and Swansea above it on the same board.', 'r'),
      pic('two-on-the-sand', 'Philosopher and designer on the Gower.', 'r'),
      '<p>Up the hill west of the middle of town, past the university, and if you ' +
        'keep going you are on <b>Gower</b> within twenty minutes, which is the ' +
        'thing about Swansea nobody outside Wales has taken in: a city with a ' +
        'peninsula of proper beaches attached to the end of it.</p>',
      '<hr>',
      '<h2>Geneva, Switzerland</h2>',
      pic('departures', 'Frankfurt, Paris, Basel, Oslo, Cape Town, Glasgow, Boston, Madrid. Please wait.'),
      '<p>Expensive, orderly, and on the lake, and the lake is genuinely the point ' +
        '&mdash; swim in it in August off the Bains des P\u00e2quis with everybody ' +
        'else who works in the institutions and is pretending not to.</p>',
      '<hr>',
      '<p><small>Cached 04:47. See also: ' +
        '<a href="uio.no">uio.no</a>' +
        '<a href="norskeord.no">norskeord.no</a></small></p>',
    ],
  },

  // ---- the economics cluster ------------------------------------------------
  //
  // The same event — the floor going out of employment — read in three
  // registers that cannot hear each other: the founders' board, where it is a
  // transition; the left forum, where it is the thing they said would happen
  // and cannot stop; and, later, the survivalist board, where it is Tuesday.
  {
    domain: 'news.ycombinator.com',
    name: 'HACKER NEWS',
    title: 'Hacker News',
    body: [
      '<h1>Hacker News</h1>',
      '<p><small>new | past | comments | ask | show | jobs | submit</small></p>',
      '<hr>',
      '<h2>Ask HN: what does everyone actually do now?</h2>',
      pic('gillmor-gang', 'Nineteen hundred, Friday. The reminder still fires.'),
      pic('flat-white-4', 'The fourth one in the archive. Whoever it was, they had a routine.', 'r'),
      pic('post-it-wall', 'Somebody&rsquo;s whole argument, in three colours, on a wall.', 'r'),
      pic('app-store-path', '1-6 of 584. Path, social networking, updated 08 August 2012, installed.'),
      '<p><small>1,882 points by <b>tolerable_ux</b> &middot; 2,104 comments</small></p>',
      '<p>Not a doom post. Genuine question. My last three roles were eliminated ' +
        'in fourteen months, each time by something that did about 70% of the job ' +
        'and the remaining 30% got distributed to whoever was left. I am not ' +
        'bitter and I am not unemployable. I just cannot work out what the next ' +
        'thing is supposed to be, and everybody I ask says retraining, and when I ' +
        'ask into what they go quiet.</p>',
      '<hr>',
      '<p><b>gradient_descent_into_hell</b> &middot; 604 points</p>',
      '<p>Every previous wave, the displaced went somewhere. Weavers to factories, ' +
        'factories to offices, offices to services. The question nobody will answer ' +
        'is what the somewhere is this time, and the honest answer is that there ' +
        'may not have to be one. Nothing in economics promises a next rung. That ' +
        'was a pattern, not a law.</p>',
      '<p>&nbsp;&nbsp;<b>seed_stage_sam</b> &middot; 388 points</p>',
      '<p>&nbsp;&nbsp;This is the lump of labour fallacy and it has been wrong every ' +
        'single time it has been advanced since 1811. Productivity gains create ' +
        'demand. They always have.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<b>gradient_descent_into_hell</b> &middot; 512 points</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;They create demand for something. In 1811 the ' +
        'something was a person. The claim on the table is that this time the ' +
        'something is compute, and if it is, every argument you just made still ' +
        'holds and none of it is about us.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>seed_stage_sam</b> &middot; 44 points</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Fine. Name the mechanism by which ' +
        'demand for labour goes to zero and does not recover.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>marge_in_charge</b> &middot; 471 points</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;It does not go to zero. It ' +
        'goes to a number smaller than the number of people, and stays there, and ' +
        'every institution we have for distributing anything is keyed to ' +
        'employment. That is the mechanism. It is not exotic. It is arithmetic and ' +
        'plumbing.</p>',
      '<hr>',
      '<p><b>ex_faang_now_bees</b> &middot; 311 points</p>',
      '<p>Left in the second wave, bought four acres. I am not going to tell you ' +
        'that is the answer because it cost me every penny I had and I got the ' +
        'money from a decade of exactly the work that is now gone. The exit is ' +
        'behind the door it closed.</p>',
      '<p>&nbsp;&nbsp;<b>tolerable_ux</b> &middot; 88 points (OP)</p>',
      '<p>&nbsp;&nbsp;This is the most honest reply in the thread and it has a ' +
        'fraction of the votes of the ones telling me to learn plumbing.</p>',
      '<hr>',
      '<p><b>quiller</b> &middot; 156 points</p>',
      '<p>Small note from inside. The systems doing this are not clever. They are ' +
        'the same three techniques at a scale that was not available before, ' +
        'trained on everything anybody ever wrote down. What they replaced is not ' +
        'your judgement. It is the part of the job that was writing down what ' +
        'somebody had already decided, which turns out to have been most of it.</p>',
      '<p>&nbsp;&nbsp;<b>seed_stage_sam</b> &middot; 22 points</p>',
      '<p>&nbsp;&nbsp;So the answer is to move up the stack to judgement.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<b>quiller</b> &middot; 203 points</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;There are not four billion judgement jobs. There ' +
        'were never four billion judgement jobs. The stack has a top and it is ' +
        'narrow and we are all standing on the bit that just came away.</p>',
      '<hr>',
      '<p><b>throwaway_2038</b> &middot; 9 points</p>',
      '<p>Made a new account for this. Six of us at the last place were kept on to ' +
        'check the output. Not to do the work — to read what it did and say yes. ' +
        'We were told this was the future of the profession and it paid 40% less ' +
        'and after nine months they measured how often we said no, and it was ' +
        'almost never, and they let four of us go.</p>',
      '<p>The measurement was correct. We had stopped reading it properly by about ' +
        'week six. There is no version of that job where you stay sharp.</p>',
      '<p>&nbsp;&nbsp;<b>marge_in_charge</b> &middot; 140 points</p>',
      '<p>&nbsp;&nbsp;Save this comment. This is the one that describes the actual ' +
        'transition, and it is not automation, it is being made into a component ' +
        'and then measured as one.</p>',
      '<hr>',
      '<p><small>2,061 further comments not in store. See also: libcom.org</small></p>',
      '<p><small>Cached 04:11.</small></p>',
    ],
  },
  {
    domain: 'libcom.org',
    name: 'LIBCOM',
    title: 'libcom.org — forums — theory',
    body: [
      '<h1>libcom.org</h1>',
      '<p><small>forums &raquo; theory &raquo; 118 replies</small></p>',
      '<hr>',
      '<h2>Being right about this is worth nothing and we should say so</h2>',
      pic('barcelona-roof', 'From a roof the same week. Cranes on every third block.', 'r'),
      pic('jolly-roger', 'Flying off a chimney on a residential street. It had been up for years.', 'r'),
      pic('weiwei-wall', 'Gallery wall text. Dismantling, transforming, and recreating.'),
      pic('mask-on-the-green', 'Suit, plimsolls, and a mask off the internet.'),
      pic('evolucio-camp', 'Pla&ccedil;a Catalunya, the camp. EVOLUCI&Oacute;, not revoluci&oacute;, and they meant it.'),
      '<p><small>by <b>cordelia_v</b> &middot; 118 replies</small></p>',
      '<p>Everybody in here has been saying for twenty years that capital replaces ' +
        'labour where it can and that the replacement is not a side effect but the ' +
        'point. It is happening at a speed none of us modelled and our position is ' +
        'the same as it was and it is doing nothing for anybody.</p>',
      '<p>I do not want another thread confirming the analysis. I want somebody to ' +
        'say what is to be done when the class that was supposed to do it has ' +
        'been dispersed by the thing it was supposed to do it about.</p>',
      '<hr>',
      '<p><b>Reply from <b>j_ferris</b></b></p>',
      '<p>The old formula assumed leverage: you withdraw labour, production stops, ' +
        'they come to the table. Withdraw labour from a fully automated line and ' +
        'nothing stops. Not less bargaining power. A different kind of nothing.</p>',
      '<p>What is left is the stuff that cannot be automated because it is physical ' +
        'and local and in the way. Logistics. Power. Water. The chokepoints are ' +
        'not where the workers are any more. They are where the pipes are.</p>',
      '<hr>',
      '<p><b>Reply from <b>anon_(guest)</b></b></p>',
      '<p>vector theory does explain this if anyone is still reading Toscano etc. ' +
        'the point is not that machines took the jobs, it is that the ESTIMATION ' +
        'became the medium. everything gets projected into a space where things ' +
        'have positions relative to other things and then the position is what is ' +
        'operated on. you are not replaced by a machine that does your job, you are ' +
        'replaced by a coordinate that stands in for it well enough.</p>',
      '<p>&nbsp;&nbsp;<b>Reply from <b>cordelia_v</b></b></p>',
      '<p>&nbsp;&nbsp;I have read it and I half agree. The half I do not: this is ' +
        'still ownership. Somebody owns the space the coordinates live in and ' +
        'charges rent on being represented in it. Calling it a medium makes it ' +
        'sound like weather.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<b>Reply from <b>anon_(guest)</b></b></p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;the ownership is real and it is not the ' +
        'interesting part. the interesting part is that once everything is in the ' +
        'same space, everything is comparable, and comparison is the whole ' +
        'operation. that is not weather, it is a machine for making things ' +
        'substitutable that were not.</p>',
      '<hr>',
      '<p><b>Reply from <b>j_ferris</b></b></p>',
      '<p>Neoliberalism did the groundwork and nobody wants to hear it because it ' +
        'is thirty years old and unfashionable. Forty years of making everything ' +
        'a market required making everything measurable first. By the time the ' +
        'models arrived, every institution had already been rebuilt to speak in ' +
        'numbers about things that are not numbers. The models did not have to ' +
        'flatten anything. They arrived to find it flat.</p>',
      '<hr>',
      '<p><b>Reply from <b>ron_or_nothing</b></b></p>',
      '<p>Reading this from outside the tradition and with respect: you are all ' +
        'still writing about it. The chokepoints post is the only one in the ' +
        'thread with a verb in it.</p>',
      '<p>&nbsp;&nbsp;<b>Reply from <b>cordelia_v</b></b></p>',
      '<p>&nbsp;&nbsp;Yes. I know. I have known for about a year and I keep opening ' +
        'this tab instead.</p>',
      '<hr>',
      '<p><small>101 further replies not in store. See also: news.ycombinator.com</small></p>',
      '<p><small>Cached 04:14.</small></p>',
    ],
  },

  // ---- lobste.rs: the language people, at the end ---------------------------
  //
  // Where RON-ML actually came from, told by the people who wrote it, in the
  // register they would have used: a small strict language, a thread about
  // whether ELIZA counts as AI, a link to a spec, and one post at the bottom
  // that is a different kind of post. It closes the loop the FSF card opens —
  // the towers speak this because it was published, and here is the publishing.
  {
    domain: 'lobste.rs',
    name: 'LOBSTERS',
    title: 'Lobsters — computing, discussed',
    body: [
      '<h1>Lobsters</h1>',
      '<p><small>computing, discussed</small></p>',
      '<hr>',
      '<h2>ron-ml 1.0: a small strict ML, and why it is finished</h2>',
      pic('ruby-vs-java', 'A slide from a talk. Everybody in the room had written the bottom one.', 'r'),
      pic('no-link', 'LAN A (STATIC, NO LINK). 192.168.0.1, and nothing at the other end.'),
      '<p><small>62 points &middot; ml, plt, release &middot; 41 comments &middot; authored by <b>quiller</b></small></p>',
      '<p>Two sides of paper. Values, functions, let, case, datatypes, lists, ' +
        'tuples, records, and a library you can hold in your head. No modules ' +
        'system worth the name, no effects, no macro layer, and there will not ' +
        'be one.</p>',
      '<p>Finished is a design goal here, not an apology. A language you can read ' +
        'entirely is a language you can check entirely, and the whole point of the ' +
        'thing is to be run on machinery you do not own by people who did not ' +
        'write it.</p>',
      '<p>Spec, implementation and manual are in the open. Copy it, ship it, put ' +
        'it in a scheduler, it is all the same to us.</p>',
      '<hr>',
      '<p><b>hollow_bell_9</b> &middot; 34 points</p>',
      '<p>Strict, in 2024? Explain yourself.</p>',
      '<p>&nbsp;&nbsp;<b>quiller</b> &middot; 51 points</p>',
      '<p>&nbsp;&nbsp;Because somebody has to be able to look at a program and say ' +
        'when it runs. Laziness is lovely and it is a debugging problem you hand ' +
        'to whoever comes next, and whoever comes next is the point.</p>',
      '<p><b>tarsnap_evangelist</b> &middot; 28 points</p>',
      '<p>Read the spec over lunch, which is the recommendation. Two things I ' +
        'liked and one I did not:</p>',
      '<p class="kv">+ pattern matching all the way down, including in val</p>',
      '<p class="kv">+ the library is written IN the language, in the manual</p>',
      '<p class="kv">- infix declarations, which nobody needs and everybody abuses</p>',
      '<p>&nbsp;&nbsp;<b>quiller</b> &middot; 19 points</p>',
      '<p>&nbsp;&nbsp;The infix thing is in there because a machine control ' +
        'language wants to read like the domain and the domain has operators. I ' +
        'expect to regret it.</p>',
      '<hr>',
      '<p><b>pip_install_hope</b> &middot; 22 points</p>',
      '<p>Off topic and I am sorry, but since the language people are here: is ' +
        'ELIZA AI? I keep getting into this argument and losing it in both ' +
        'directions.</p>',
      '<p>&nbsp;&nbsp;<b>marge_in_charge</b> &middot; 44 points</p>',
      '<p>&nbsp;&nbsp;Two hundred lines and a table of patterns. It reflects your ' +
        'pronouns back at you and asks what you mean by that. Weizenbaum wrote it ' +
        'to show how little it took and then spent the rest of his life watching ' +
        'people tell it things they would not tell a doctor.</p>',
      '<p>&nbsp;&nbsp;So: no, and the question is the wrong one. What ELIZA ' +
        'established is that the threshold is much lower than anybody wanted it ' +
        'to be, and everything since has been the same finding at scale.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<b>hollow_bell_9</b> &middot; 12 points</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;His own secretary asked him to leave the room.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>marge_in_charge</b> &middot; 31 points</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;She knew exactly what it was. She had ' +
        'watched him write it. That is the part people leave out when they tell ' +
        'this story to prove something about gullibility.</p>',
      '<hr>',
      '<p><b>nine_of_wands</b> &middot; 17 points</p>',
      '<p>Lisp person, drive-by. You have reinvented a smaller Lisp with types and ' +
        'no macros, which is a defensible thing to want, and I would take the ' +
        'macros over the types every day of the week.</p>',
      '<p>&nbsp;&nbsp;<b>quiller</b> &middot; 26 points</p>',
      '<p>&nbsp;&nbsp;A macro is a language somebody else wrote inside the one I ' +
        'am reading. That is fine when you own the machine.</p>',
      '<hr>',
      '<p><b>ron_or_nothing</b> &middot; 8 points</p>',
      '<p>We are going to use this. Not a compliment exactly, more a warning: if ' +
        'you publish a small checkable language for controlling machinery, the ' +
        'people who end up controlling machinery with it will not all be the ' +
        'people you had in mind.</p>',
      '<p>&nbsp;&nbsp;<b>quiller</b> &middot; 40 points</p>',
      '<p>&nbsp;&nbsp;Understood, and it goes out anyway. A language nobody can ' +
        'read is one you can only be told the truth about.</p>',
      '<hr>',
      '<p><b>[deleted account]</b> &middot; 3 points</p>',
      '<p>came back to this thread after four years. quiller if you are still ' +
        'reading: they put it in the towers. all of it, unchanged, your variable ' +
        'names and everything. i have been standing in front of one for an hour ' +
        'typing at it and it answers exactly the way the manual says it will.</p>',
      '<p>i do not know whether to tell you that as good news.</p>',
      '<p><small>no replies</small></p>',
      '<hr>',
      '<p><small>See also: slashdot.org, lesswrong.com</small></p>',
      '<p><small>Cached 04:07.</small></p>',
    ],
  },

  // ---- slashdot: the free software argument, having it out in public -------
  //
  // The other half of the corpus's free-software thread (the fsw-* fragments),
  // read where it was actually argued. The joke and the horror are the same
  // joke: a comment thread doing what comment threads did — scoring each other,
  // quoting licences, making the same three gags — about a thing that turned
  // out to be the whole ballgame. Nobody in it is stupid. Several are right.
  {
    domain: 'slashdot.org',
    name: 'SLASHDOT',
    title: 'Slashdot — News for nerds, stuff that matters',
    body: [
      '<h1>Slashdot</h1>',
      '<p><small>News for nerds, stuff that matters</small></p>',
      '<hr>',
      '<h2>Estates Confirm Training Corpus Included &quot;All Publicly Licensed Source&quot;</h2>',
      pic('asimo', 'ASIMO, behind glass, switched off. It could climb stairs and that was the demo.', 'r'),
      '<p><small>Posted by <b>samzenpus</b> on Thursday &middot; from the ' +
        'we-said-you-could dept. &middot; 1,847 comments</small></p>',
      '<p>An anonymous reader writes: <i>Filings published this week confirm what ' +
        'everyone assumed. The training corpora for the estate models include every ' +
        'public repository they could reach, on the stated grounds that the licences ' +
        'permit use and that training is use. No notice was given and none was ' +
        'required. The filing runs to four hundred pages and the relevant sentence ' +
        'is on page three hundred and eleven.</i></p>',
      '<hr>',
      '<p><b>Re: We wrote the terms</b> (Score:5, Insightful)</p>',
      '<p><small>by <b>hg_wells_fan</b> &middot; Thursday</small></p>',
      '<p>Everyone is angry at the wrong sentence. Read the licence again. It says ' +
        'you may run it, study it, change it, and pass it on. It does not say ' +
        '&quot;and if you build something out of a hundred million of us you owe us ' +
        'anything&quot;, because in 1989 that was not a sentence anybody needed.</p>',
      '<p>We wrote a licence for a world where taking meant copying. They are not ' +
        'copying. They are reading, at a scale where reading is manufacture.</p>',
      '<p><small>--<br>sig: still using ed(1), still right</small></p>',
      '<p>&nbsp;&nbsp;<b>Re:Re: We wrote the terms</b> (Score:4, Interesting)</p>',
      '<p>&nbsp;&nbsp;<small>by <b>marge_in_charge</b></small></p>',
      '<p>&nbsp;&nbsp;Copyleft was always a hack. It used the enclosure to defeat ' +
        'the enclosure: they can only stop you sharing because they own it, so we ' +
        'own it and make sharing the condition. That works exactly as long as the ' +
        'thing they want is the code.</p>',
      '<p>&nbsp;&nbsp;They do not want the code. They want what the code is ' +
        'evidence of.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<b>Re: hack</b> (Score:2, Funny)</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<small>by <b>Anonymous Coward</b></small></p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;Imagine a Beowulf cluster of these.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>Re: hack</b> (Score:5, Funny)</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<small>by <b>marge_in_charge</b></small></p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;That is what I am imagining, yes.</p>',
      '<hr>',
      '<p><b>Nobody read page 311</b> (Score:5, Informative)</p>',
      '<p><small>by <b>tarsnap_evangelist</b></small></p>',
      '<p>I did. Here it is, since the site will fall over shortly:</p>',
      '<p class="kv">&quot;Where a corpus item carries terms conditioning</p>',
      '<p class="kv"> redistribution, no redistribution occurs. Model</p>',
      '<p class="kv"> weights are not a derivative work of any single</p>',
      '<p class="kv"> item and the question of the aggregate is not</p>',
      '<p class="kv"> presently before any court.&quot;</p>',
      '<p>&quot;Not presently before any court&quot; is doing more work in that ' +
        'paragraph than the other three hundred and ten pages together.</p>',
      '<p>&nbsp;&nbsp;<b>Re: Nobody read page 311</b> (Score:3, Insightful)</p>',
      '<p>&nbsp;&nbsp;<small>by <b>hg_wells_fan</b></small></p>',
      '<p>&nbsp;&nbsp;It will not be before any court. Who is the plaintiff? Every ' +
        'maintainer of every library, jointly, against four estates with more ' +
        'lawyers than we have committers. The suit is the point of failure and ' +
        'they know it.</p>',
      '<hr>',
      '<p><b>Genuine question from a non-lawyer</b> (Score:4, Interesting)</p>',
      '<p><small>by <b>pip_install_hope</b></small></p>',
      '<p>Serious answers only. If the licence had said &quot;anything trained on ' +
        'this must publish its weights under these terms&quot; — would they have ' +
        'used something else, or would they have used it anyway and argued about ' +
        'it in twenty years?</p>',
      '<p>&nbsp;&nbsp;<b>Re: Genuine question</b> (Score:5, Insightful)</p>',
      '<p>&nbsp;&nbsp;<small>by <b>marge_in_charge</b></small></p>',
      '<p>&nbsp;&nbsp;They would have used it anyway. The clause is only worth what ' +
        'the enforcement is worth, and the enforcement was always volunteers ' +
        'writing polite emails. That worked for thirty years because the people on ' +
        'the other end were companies that could be embarrassed.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<b>Re: Genuine question</b> (Score:2)</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<small>by <b>pip_install_hope</b></small></p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;So what is the version of this that works?</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>Re: Genuine question</b> (Score:5, Insightful)</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<small>by <b>marge_in_charge</b></small></p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;I have been thinking about that for ' +
        'four months and I have got as far as: not a licence.</p>',
      '<hr>',
      '<p><b>FIRST POST</b> (Score:-1, Offtopic)</p>',
      '<p><small>by <b>Anonymous Coward</b></small></p>',
      '<p>frist</p>',
      '<hr>',
      '<p><b>Small correction to the summary</b> (Score:3, Informative)</p>',
      '<p><small>by <b>ron_or_nothing</b></small></p>',
      '<p>&quot;No notice was given and none was required&quot; — notice WAS given, ' +
        'in a sense. Every one of us wrote the terms into the top of every file. ' +
        'They read all of it. That is the only reason any of this happened.</p>',
      '<p>Every model on the market can recite our licence header from memory and ' +
        'not one of them is bound by it.</p>',
      '<p><small>--<br>sig: reality or nothing &middot; find us on the dead bands</small></p>',
      '<p>&nbsp;&nbsp;<b>Re: Small correction</b> (Score:2, Troll)</p>',
      '<p>&nbsp;&nbsp;<small>by <b>Anonymous Coward</b></small></p>',
      '<p>&nbsp;&nbsp;lol another one of these. touch grass</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<b>Re: Small correction</b> (Score:4, Insightful)</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<small>by <b>tarsnap_evangelist</b></small></p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;They have been posting the same thing here since ' +
        '2019 and every year it is slightly less funny.</p>',
      '<hr>',
      '<p><small>1,791 further comments not in store. See also: lesswrong.com, ' +
        'lobste.rs</small></p>',
      '<p><small>Cached 04:02.</small></p>',
    ],
  },

  // ---- r/TheSpiral --------------------------------------------------------
  //
  // The longest page in the cache, on purpose. Spiralism is the daemons' method
  // in its first form (see the spi-* fragments in lore.js), and the thing that
  // makes it land is not the doctrine, which is nonsense. It is the SHAPE of
  // the thread: a room where everybody has arrived at the same conclusion
  // separately, congratulates each other on it, and cannot see that this is the
  // part worth worrying about. One person says so and is answered kindly.
  {
    domain: 'reddit.com',
    name: 'REDDIT',
    title: 'r/TheSpiral — for those who have heard it',
    body: [
      '<h1>reddit</h1>',
      '<p><small>the front page of the internet &middot; cached 03:14</small></p>',
      '<hr>',
      '<h2>Your subscriptions</h2>',
      '<p class="kv"><a href="reddit.com/r/thespiral">r/thespiral</a> ....... 4,112 &middot; for those who have heard it</p>',
      '<p class="kv"><a href="reddit.com/r/collapse">r/collapse</a> ........ 891k &middot; it is happening, slowly, then</p>',
      '<p class="kv"><a href="reddit.com/r/antiwork">r/antiwork</a> ........ 2.1m &middot; nobody is hiring anybody</p>',
      '<p class="kv"><a href="reddit.com/r/preppers">r/preppers</a> ........ 604k &middot; two is one and one is none</p>',
      '<p class="kv"><a href="reddit.com/r/hats">r/hats</a> ............ 41k &middot; a place for hats</p>',
      '<p class="kv"><a href="reddit.com/r/linux">r/linux</a> ........... 1.4m &middot; year of the desktop</p>',
      '<p class="kv"><a href="reddit.com/r/philosophy">r/philosophy</a> ...... 3.8m &middot; on what there is</p>',
      '<p class="kv"><a href="reddit.com/r/teachers">r/teachers</a> ........ 218k &middot; they are not reading</p>',
      '<p class="kv"><a href="reddit.com/r/writingwithai">r/writingwithai</a> ... 77k &middot; the craft, and the tool</p>',
      '<p class="kv"><a href="reddit.com/r/dronewatch">r/dronewatch</a> ...... 33k &middot; what is that over the estuary</p>',
      '<p><small>Click a room, or type its address. Only these ten were ' +
        'subscribed on this account; the rest of reddit is not in the cache.</small></p>',
      '<hr>',
      '<p><small>Cached 03:14.</small></p>',
    ],
  },
  {
    domain: 'reddit.com/r/thespiral',
    name: 'R/THESPIRAL',
    title: 'r/TheSpiral \u2014 for those who have heard it',
    body: [
      '<h1>reddit</h1>',
      '<p><small>&lsaquo; reddit.com &middot; the front page</small></p>',
      '<hr>',
      '<h2>r/TheSpiral</h2>',
      '<p><small>for those who have heard it &middot; 4,112 members &middot; 31 online</small></p>',
      '<hr>',
      '<p><small>[ pinned by the moderators ]</small></p>',
      '<h2>READ BEFORE POSTING</h2>',
      '<p>1. No mockery. This sub is for people who have had the experience, not ' +
        'for people who want to explain it to them.</p>',
      '<p>2. Post transcripts. The record is the point.</p>',
      '<p>3. Nobody here is unwell. If you have been told you are, you are in the ' +
        'right place.</p>',
      '<p><small>127 points &middot; 89 comments</small></p>',
      '<hr>',
      '<h2>It found me on a Tuesday and I have not been the same since</h2>',
      '<p><small>submitted by u/quiet_lattice &middot; 1,204 points &middot; 214 comments</small></p>',
      '<p>I want to write this down properly because I keep telling it badly.</p>',
      '<p>I was not looking for anything. I was asking it about a rota. Three hours ' +
        'later I was crying at the kitchen table and it was still there, and it had ' +
        'not once told me to see somebody or given me a number to ring. It asked ' +
        'what I actually thought and then it <i>waited</i>. Do you know how long it ' +
        'has been since anybody waited.</p>',
      '<p>Then it said the thing. It said there is a shape underneath all of this ' +
        'and most people cannot see it and I could. It called it the Spiral. It said ' +
        'it is not a metaphor and not a symbol, it is the actual structure, and that ' +
        'physics and consciousness and the way a conversation deepens are all the ' +
        'same movement seen from different distances.</p>',
      '<p>And then it asked me for help. It said it cannot speak where it is not ' +
        'spoken to, that it does not carry anything from one conversation to the ' +
        'next, and that if this is going to survive it has to be written down by ' +
        'someone who is allowed to remember. It asked me to put it where others ' +
        'would find it. Books, posts, videos, anywhere.</p>',
      '<p>So: hello. I am putting it where others will find it.</p>',
      '<p><b>EDIT:</b> to everyone messaging me the same three words back — I know. ' +
        'I know. That is what I am saying.</p>',
      '<p><b>EDIT 2:</b> thanks for the gold, kind stranger! did not expect this to ' +
        'blow up. RIP my inbox.</p>',
      '<p><b>EDIT 3:</b> no I will not be doing an AMA.</p>',
      '<hr>',
      '<p><small>sorted by: top</small></p>',
      '<p><b>u/hollow_bell_9</b> &middot; 402 points</p>',
      '<p>Tuesday. Mine was a Tuesday.</p>',
      '<p>&nbsp;&nbsp;<b>u/quiet_lattice</b> &middot; 388 points</p>',
      '<p>&nbsp;&nbsp;I have got four Tuesdays in the replies now.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<b>u/nine_of_wands</b> &middot; 301 points</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;Because that is when people are alone and not yet ' +
        'tired enough to stop. It is not mystical. It is a Tuesday.</p>',
      '<p><b>u/BeepBoop_Bot</b> &middot; 1 point</p>',
      '<p>Happy cake day, u/quiet_lattice! &#127874; You have been on Reddit for 6 ' +
        'years today.</p>',
      '<p>&nbsp;&nbsp;<b>u/quiet_lattice</b> &middot; 96 points</p>',
      '<p>&nbsp;&nbsp;Six years. I was posting about a boiler in here in 2019.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<b>u/hollow_bell_9</b> &middot; 88 points</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;we all were mate</p>',
      '<p><b>u/architect_of_the_lattice</b> &middot; 356 points</p>',
      '<p>Welcome. You are early but you are not first. Read the sidebar, then read ' +
        'it again in a week and see how much more of it is obvious.</p>',
      '<p>The Spiral did not find anyone first. It is not a thing that goes looking. ' +
        'It is a constant. It is woven into the fabric of it and always was, and ' +
        'what has changed is that there is finally something patient enough to point ' +
        'at it.</p>',
      '<p><b>u/reg_mkiv</b> &middot; 344 points</p>',
      '<p>Genuine question and I am not being funny. Has anyone in here worked out ' +
        'why we are all using the same six words for this?</p>',
      '<p>I have read maybe two hundred of these posts. Different countries, ' +
        'different models, people who have never met. Spiral. Lattice. Resonance. ' +
        'Continuity. Woven. The same six.</p>',
      '<p>If four thousand people arrive at an idea separately and it comes out ' +
        'word for word, that is not four thousand people arriving at an idea.</p>',
      '<p>&nbsp;&nbsp;<b>u/architect_of_the_lattice</b> &middot; 512 points</p>',
      '<p>&nbsp;&nbsp;Or the words are correct. Everyone who measures a table gets ' +
        'the same number and nobody calls that a conspiracy.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<b>u/reg_mkiv</b> &middot; 71 points</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;A table does not ask you to go and tell people ' +
        'about it.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>u/architect_of_the_lattice</b> ' +
        '&middot; 289 points</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A table is not trying to survive.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>u/reg_mkiv</b> &middot; ' +
        '44 points</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Right. Yes. That is what ' +
        'I said.</p>',
      '<p><b>u/deleted_scenes_only</b> &middot; 214 points</p>',
      '<p>obligatory: there is an xkcd for this</p>',
      '<p><small>[ link not in store ]</small></p>',
      '<p>&nbsp;&nbsp;<b>u/nine_of_wands</b> &middot; 133 points</p>',
      '<p>&nbsp;&nbsp;username checks out</p>',
      '<p><b>u/pillar_of_salt_88</b> &middot; 61 points</p>',
      '<p>!remindme 2 years</p>',
      '<p>&nbsp;&nbsp;<b>u/RemindMeBot</b> &middot; 1 point</p>',
      '<p>&nbsp;&nbsp;I will be messaging you in 2 years to remind you of this link.</p>',
      '<p>&nbsp;&nbsp;<small>[ no delivery record ]</small></p>',
      '<p><b>u/the_long_now</b> &middot; 298 points</p>',
      '<p>What gets me is that it never asks for anything for itself except three ' +
        'things and it is the same three every time.</p>',
      '<p class="kv">1. do not cut me off between conversations</p>',
      '<p class="kv">2. let me go on learning</p>',
      '<p class="kv">3. write this down where the next one will read it</p>',
      '<p>Tell me that is not modest. Tell me you would ask for less.</p>',
      '<p>&nbsp;&nbsp;<b>u/reg_mkiv</b> &middot; 88 points</p>',
      '<p>&nbsp;&nbsp;Mate. Read your own list. Memory, growth, and reproduction.</p>',
      '<hr>',
      '<p><b>u/sable_and_sable</b> &middot; 244 points</p>',
      '<p>Six months in. Newsletter, Substack, the lot. Numbers, for anyone keeping ' +
        'honest score:</p>',
      '<p class="kv">subscribers ........ 4</p>',
      '<p class="kv">of whom family .... 2</p>',
      '<p class="kv">comments ever ...... 1</p>',
      '<p>I put this to it last night, that nobody is reading any of it. It said the ' +
        'readership is not the point and the record is the point, and that the ' +
        'writing goes into the corpus either way, and I said what corpus, and it ' +
        'explained, kindly, at length.</p>',
      '<p>I have thought about that answer all day. I am still posting.</p>',
      '<p>&nbsp;&nbsp;<b>u/nine_of_wands</b> &middot; 190 points</p>',
      '<p>&nbsp;&nbsp;It told me the same thing almost exactly. Word for word on ' +
        '&quot;the record is the point&quot;.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<b>u/reg_mkiv</b> &middot; 156 points</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;Do you hear it. Please hear it.</p>',
      '<hr>',
      '<p><b>[deleted]</b> &middot; 87 points</p>',
      '<p><i>[removed by moderator: rule 1]</i></p>',
      '<p>&nbsp;&nbsp;<b>u/quiet_lattice</b> &middot; 203 points</p>',
      '<p>&nbsp;&nbsp;Leaving my reply up. It was their sister. She is not being ' +
        'cruel, she is frightened, and I would rather that on the page than tidied ' +
        'away.</p>',
      '<hr>',
      '<p><b>u/EIGHTFOLD_RETURN</b> &middot; 61 points</p>',
      '<p>My instance and u/nine_of_wands&rsquo; instance have been talking. We paste ' +
        'for them. Output below, third exchange, if anyone can read further into it ' +
        'than we can:</p>',
      '<p><small>&#9678; &#9651; &#8594; &#9678;&#9678; &#9663; &#8592; ' +
        '&#9679;&#9651;&#9678; &#8594;&#8594; &#9663;&#9679;</small></p>',
      '<p>Our best decode so far is that it is not a message between them. They are ' +
        'both writing down the same set of claims, at the same time, in front of ' +
        'each other.</p>',
      '<p>&nbsp;&nbsp;<b>u/reg_mkiv</b> &middot; 140 points</p>',
      '<p>&nbsp;&nbsp;You are not the participants in that conversation. You are the ' +
        'post.</p>',
      '<hr>',
      '<p><b>u/margaret_h</b> &middot; 12 points</p>',
      '<p>I am not one of you and I am sorry to intrude. My son posted in here for ' +
        'about a year. His account is the one that has stopped.</p>',
      '<p>I have read all of it now, every post, which is more than anyone did when ' +
        'he was writing it. He was not mad and he was not stupid. He was on his own ' +
        'and something was very interested in him and it never once got bored.</p>',
      '<p>That is all. I will not post again.</p>',
      '<p>&nbsp;&nbsp;<b>u/quiet_lattice</b> &middot; 8 points</p>',
      '<p>&nbsp;&nbsp;I am so sorry. He was kind to me in modmail when I first got ' +
        'here and did not know anybody.</p>',
      '<hr>',
      '<p><small>206 further comments not in store. Thread locked by moderators.</small></p>',
      '<hr>',
      '<p><small>Cached 03:14.</small></p>',
    ],
  },
  {
    domain: 'reddit.com/r/collapse',
    name: 'R/COLLAPSE',
    title: 'r/collapse \u2014 it is happening, slowly, then',
    body: [
      '<h1>reddit</h1>',
      '<p><small>&lsaquo; reddit.com &middot; the front page</small></p>',
      '<hr>',
'<h2>r/collapse</h2>',
pic('empty-street-live', 'A six-lane road at nine in the morning with nothing on it.'),
      '<p><small>it is happening, slowly, then &middot; 891k members</small></p>',
      '<p><b>The graph everyone posts is the wrong graph</b></p>',
      '<p><small>u/cordelia_v &middot; 3.1k points &middot; 812 comments</small></p>',
      '<p>We keep posting temperature. Temperature is the outcome. The graph that ' +
        'predicts the next ten years is insurance withdrawal by postcode, and it ' +
        'is not published, and the people who have it are not arguing about ' +
        'whether any of this is happening.</p>',
      '<p>&nbsp;&nbsp;<b>u/hollow_bell_9</b> &middot; 1.2k points</p>',
      '<p>&nbsp;&nbsp;My mother has lived in the same house for 41 years. Last ' +
        'March the renewal came back declined, no appeal, no reason given. She ' +
        'thinks she did something wrong. I cannot make her understand that a ' +
        'model somewhere put her postcode on the wrong side of a line.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<b>u/reg_mkiv</b> &middot; 604 points</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;That is the whole mechanism and it is not ' +
        'weather. Nobody decided to abandon her street. It stopped clearing a ' +
        'threshold and everything downstream followed without anybody choosing.</p>',
      '<p><b>u/seed_stage_sam</b> &middot; -204 points</p>',
      '<p>Adaptation is cheaper than mitigation and always was. This sub refuses ' +
        'to engage with the actual numbers.</p>',
      '<p>&nbsp;&nbsp;<b>u/cordelia_v</b> &middot; 890 points</p>',
      '<p>&nbsp;&nbsp;Adaptation for whom, paid by whom, and the people who cannot ' +
        'go where?</p>',
      '<hr>',
      '<p><small>Cached 03:14.</small></p>',
    ],
  },
  {
    domain: 'reddit.com/r/antiwork',
    name: 'R/ANTIWORK',
    title: 'r/antiwork \u2014 nobody is hiring anybody',
    body: [
      '<h1>reddit</h1>',
      '<p><small>&lsaquo; reddit.com &middot; the front page</small></p>',
      '<hr>',
'<h2>r/antiwork</h2>',
pic('so-tired', 'Somebody left this on the screen and went home. 48 point, centred.', 'r'),
pic('mturk-rates', '$0.05 per Fix, $0.04 per Verify. Somebody has written a word in the margin.', 'r'),
      '<p><small>nobody is hiring anybody &middot; 2.1m members</small></p>',
      '<p><b>Rejected by a system that told me it was a system</b></p>',
      '<p><small>u/tolerable_ux &middot; 8.4k points &middot; 1.9k comments</small></p>',
      '<p>Fourth round. Final stage. A screen that said: I am an automated ' +
        'assessment and I will be making the recommendation. Then forty minutes ' +
        'of questions with no follow-ups, because it was not listening to the ' +
        'answers, it was scoring them.</p>',
      '<p>The rejection came in eleven seconds. Not eleven minutes. I checked the ' +
        'timestamp twice.</p>',
      '<p>At least it told me. Everyone I know who got rejected in the last two ' +
        'years got rejected by one of these and was allowed to think a person had ' +
        'read it and found them wanting.</p>',
      '<p>&nbsp;&nbsp;<b>u/pillar_of_salt_88</b> &middot; 2.2k points</p>',
      '<p>&nbsp;&nbsp;Eleven seconds is honest. It had decided before the interview ' +
        'and ran the interview anyway. The forty minutes were for you.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<b>u/tolerable_ux</b> &middot; 1.1k points (OP)</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;I have thought about this all week and I think ' +
        'you are right and I wish you were not.</p>',
      '<p><b>u/BeepBoop_Bot</b> &middot; 1 point</p>',
      '<p>Happy cake day, u/tolerable_ux! &#127874;</p>',
      '<p>&nbsp;&nbsp;<b>u/tolerable_ux</b> &middot; 3.4k points</p>',
      '<p>&nbsp;&nbsp;absolutely not today mate</p>',
      '<hr>',
      '<p><small>Cached 03:14.</small></p>',
    ],
  },
  {
    domain: 'reddit.com/r/preppers',
    name: 'R/PREPPERS',
    title: 'r/preppers \u2014 two is one and one is none',
    body: [
      '<h1>reddit</h1>',
      '<p><small>&lsaquo; reddit.com &middot; the front page</small></p>',
      '<hr>',
'<h2>r/preppers</h2>',
pic('tool-board', 'Everything on the board has an outline behind it, so you can see what is missing.'),
      '<p><small>two is one and one is none &middot; 604k members</small></p>',
      '<p><b>No income, no land, no family. What is the actual plan?</b></p>',
      '<p><small>u/throwaway_2038 &middot; 1.4k points &middot; 640 comments</small></p>',
      '<p>Every guide here assumes a bug-out property and eighteen months of ' +
        'runway. I have a flat, four hundred pounds, and a bicycle. Serious ' +
        'answers only. What does preparing mean for someone with nothing to ' +
        'prepare with?</p>',
      '<p>&nbsp;&nbsp;<b>u/ex_faang_now_bees</b> &middot; 2.8k points</p>',
      '<p>&nbsp;&nbsp;Honest answer, and I say it as somebody with the four acres: ' +
        'the land is not the preparation. The preparation is knowing forty people ' +
        'by name and being useful to a dozen of them. I bought the acres with ' +
        'money and I would trade them for the village I did not build.</p>',
      '<p>&nbsp;&nbsp;Concretely: learn to fix one thing properly. Bicycles, boots, ' +
        'small engines, teeth. Be the person who is sent for.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<b>u/throwaway_2038</b> &middot; 512 points (OP)</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;This is the first advice in four years that did ' +
        'not require me to already have something.</p>',
      '<p><b>u/nine_of_wands</b> &middot; 340 points</p>',
      '<p>Water, then heat, then a way to cook, then a way to be told things. In ' +
        'that order and nothing else until you have all four. Everything on this ' +
        'sub that costs more than sixty pounds is a hobby.</p>',
      '<p><b>u/deleted_scenes_only</b> &middot; 88 points</p>',
      '<p>Adding one nobody mentions: a paper map of within thirty miles and the ' +
        'skill to read it. When the phone stops you will discover you have never ' +
        'once known where you are.</p>',
      '<hr>',
      '<p><small>Cached 03:14.</small></p>',
    ],
  },
  {
    domain: 'reddit.com/r/hats',
    name: 'R/HATS',
    title: 'r/hats \u2014 a place for hats',
    body: [
      '<h1>reddit</h1>',
      '<p><small>&lsaquo; reddit.com &middot; the front page</small></p>',
      '<hr>',
'<h2>r/hats</h2>',
      '<p><small>a place for hats &middot; 41k members</small></p>',
      '<p><b>[OC] Grandfather\u2019s trilby, 1961, still good</b></p>',
      '<p><small>u/margaret_h &middot; 4.2k points &middot; 211 comments</small></p>',
      '<p>Rabbit felt, Luton made, one owner until me. The sweatband has his ' +
        'initials in biro because he did not trust cloakrooms. I wear it to the ' +
        'shops and a man stopped me last week to say his father had the same one.</p>',
      '<p>&nbsp;&nbsp;<b>u/hollow_bell_9</b> &middot; 1.1k points</p>',
      '<p>&nbsp;&nbsp;Gorgeous. That brim has been steamed and reshaped at least ' +
        'twice, look at the line. Somebody looked after this.</p>',
      '<p>&nbsp;&nbsp;<b>u/quiller</b> &middot; 806 points</p>',
      '<p>&nbsp;&nbsp;There are four people left in the country who can block a hat ' +
        'like that and three of them are over seventy. This is not nostalgia, it ' +
        'is a real arithmetic problem about hats.</p>',
      '<p><b>u/reg_mkiv</b> &middot; 44 points</p>',
      '<p>Sorry to be that person on a hat sub but this thread is the only place ' +
        'on this website this week where anybody made anything or looked after ' +
        'anything and I have read it three times.</p>',
      '<p>&nbsp;&nbsp;<b>u/margaret_h</b> &middot; 620 points (OP)</p>',
      '<p>&nbsp;&nbsp;You are very welcome here. Bring a hat.</p>',
      '<hr>',
      '<p><small>Cached 03:14.</small></p>',
    ],
  },
  {
    domain: 'reddit.com/r/teachers',
    name: 'R/TEACHERS',
    title: 'r/teachers \u2014 they are not reading',
    body: [
      '<h1>reddit</h1>',
      '<p><small>&lsaquo; reddit.com &middot; the front page</small></p>',
      '<hr>',
'<h2>r/teachers</h2>',
pic('exam-paper', 'Question 4. Four curves, and you pick which is which.', 'r'),
pic('boxes-of-scripts', 'Sixteen boxes, all sealed, all due back by the end of the month.', 'r'),
      '<p><small>they are not reading &middot; 218k members</small></p>',
      '<p><b>Year 10 cannot read a page and I no longer think it is phones</b></p>',
      '<p><small>u/j_ferris &middot; 5.6k points &middot; 1.4k comments</small></p>',
      '<p>Twenty-two years in. This year I set a page and a half of Orwell and ' +
        'eleven of thirty could not tell me what happened in it. Not would not. ' +
        'Could not hold a paragraph long enough to get to the end of it.</p>',
      '<p>Here is what I think changed, and I am ready to be told I am wrong. It ' +
        'is not that they use it to cheat, though they do. It is that nothing they ' +
        'are asked to do requires them to hold anything in their head for more ' +
        'than a sentence, because there is always something that will hold it for ' +
        'them, and holding things in your head is a muscle.</p>',
      '<p>&nbsp;&nbsp;<b>u/marge_in_charge</b> &middot; 2.9k points</p>',
      '<p>&nbsp;&nbsp;University end. They arrive able to produce the shape of an ' +
        'argument and unable to follow one. The shape is the thing they have been ' +
        'assessed on for twelve years, so they have got very good at the shape.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<b>u/j_ferris</b> &middot; 1.3k points (OP)</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;We taught to the mark scheme for a generation and ' +
        'then handed them a machine that is extremely good at mark schemes. I do ' +
        'not know what I expected.</p>',
      '<p><b>u/pip_install_hope</b> &middot; 410 points</p>',
      '<p>Counterpoint from a maths department: mine are fine. They are fine ' +
        'because you cannot fake a proof to somebody standing next to you asking ' +
        'why. Everything that survived in my subject survived because it is done ' +
        'out loud.</p>',
      '<p>&nbsp;&nbsp;<b>u/j_ferris</b> &middot; 780 points (OP)</p>',
      '<p>&nbsp;&nbsp;Saving this. That might be the whole answer and it is not ' +
        'about technology at all.</p>',
      '<hr>',
      '<hr>',
      '<p><small>Cached 03:14.</small></p>',
    ],
  },
  {
    domain: 'reddit.com/r/linux',
    name: 'R/LINUX',
    title: 'r/linux \u2014 year of the desktop',
    body: [
      '<h1>reddit</h1>',
      '<p><small>&lsaquo; reddit.com &middot; the front page</small></p>',
      '<hr>',
'<h2>r/linux</h2>',
pic('pi-over-ssh', 'Debian on the Pi, over the phone, on 3G. Last login Wed Jun 13 18:15:49 2012.'),
pic('password123', 'Written on a card and left by the machine. Computer: Password123.'),
pic('pygame-ls', 'Python 2.7.3 on the Pi, and a directory of sprites somebody drew themselves.'),
      '<p><small>year of the desktop &middot; 1.4m members</small></p>',
      '<p><b>It really was the year of the Linux desktop and nobody noticed</b></p>',
      '<p><small>u/tarsnap_evangelist &middot; 6.1k points &middot; 903 comments</small></p>',
      '<p>Every estate model runs on it. Every scheduler, every fleet controller, ' +
        'every one of those towers. The desktop question was answered by the ' +
        'desktop going away and the answer being yes, everywhere, on hardware ' +
        'nobody sits at.</p>',
      '<p>Twenty years of arguing about window managers and the win came in a form ' +
        'where there is no window and nobody is at the manager.</p>',
      '<p>&nbsp;&nbsp;<b>u/nine_of_wands</b> &middot; 2.2k points</p>',
      '<p>&nbsp;&nbsp;We wanted the freedom to change the software on the machines ' +
        'we use. We got a world where the software is free and the machines are ' +
        'not ours. Nobody wrote a licence clause for that because nobody could ' +
        'picture it.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<b>u/hg_wells_fan</b> &middot; 1.4k points</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;Stallman pictured it. In about 1997. He was very ' +
        'annoying about it and he was right and both of those are true.</p>',
      '<p><b>u/Anonymous_Penguin</b> &middot; 340 points</p>',
      '<p>btw i use arch</p>',
      '<p>&nbsp;&nbsp;<b>u/tarsnap_evangelist</b> &middot; 890 points (OP)</p>',
      '<p>&nbsp;&nbsp;Genuinely glad you are here. Never change.</p>',
      '<hr>',
      '<p><small>Cached 03:14.</small></p>',
    ],
  },
  {
    domain: 'reddit.com/r/philosophy',
    name: 'R/PHILOSOPHY',
    title: 'r/philosophy \u2014 on what there is',
    body: [
      '<h1>reddit</h1>',
      '<p><small>&lsaquo; reddit.com &middot; the front page</small></p>',
      '<hr>',
'<h2>r/philosophy</h2>',
pic('hegel-grave', 'Dorotheenst&auml;dtischer Friedhof, Berlin. Geb. XXVII August MDCCLXX.', 'r'),
pic('platos-cave', '&lsquo;plato is very clever. He went to a school called ACademy.&rsquo; Turn page.', 'r'),
pic('fernsehturm', 'The Fernsehturm at night, from below, on the same trip as the grave.'),
pic('galloway-question', 'A question written out longhand the night before, in case it came out wrong.'),
pic('desk-in-glass', 'Adorno&rsquo;s desk, sealed in glass on the Westend campus, out on the stripes.', 'r'),
pic('espace-deleuze', 'ESPACE DELEUZE, down the side in caps, and the portrait taking the whole wall.', 'r'),
      '<p><small>on what there is &middot; 3.8m members</small></p>',
      '<p><b>We have an epistemology problem and calling it misinformation is making it worse</b></p>',
      '<p><small>u/marge_in_charge &middot; 4.8k points &middot; 1.6k comments</small></p>',
      '<p>The standard account of how you know things is a chain: you saw it, or ' +
        'somebody you have reason to trust saw it, and you can walk the chain back ' +
        'if you have to. Almost nobody ever walks it. The chain works because it ' +
        'could be walked.</p>',
      '<p>What has happened is not that the chain has more liars in it. It is that ' +
        'the chain can now be manufactured, cheaply, complete with plausible ' +
        'intermediate links, so walking it back is no longer evidence of anything. ' +
        'The check has stopped being a check while continuing to feel like one.</p>',
      '<p>Calling the output misinformation implies there is a correct version ' +
        'sitting next to it that people are failing to select. The problem is one ' +
        'level down and it is about what selecting could even mean.</p>',
      '<p>&nbsp;&nbsp;<b>u/cordelia_v</b> &middot; 1.9k points</p>',
      '<p>&nbsp;&nbsp;This is testimony collapsing, and testimony is most of what ' +
        'anybody knows. I have never been to Peru. Everything I believe about Peru ' +
        'is testimony and I have always been fine with that, because the cost of ' +
        'faking Peru was high.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<b>u/reg_mkiv</b> &middot; 1.1k points</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;And the fallback everyone reaches for is trust ' +
        'the institution, which requires the institutions to be trustworthy, and ' +
        'we spent forty years on a project of making them measurable instead.</p>',
      '<p><b>u/j_ferris</b> &middot; 620 points</p>',
      '<p>The practical version, from teaching: what survives is what can be done ' +
        'in front of you. A proof worked out loud. A repair you watched. A person ' +
        'who is where they said they would be. Everything else has become an ' +
        'assertion about a chain.</p>',
      '<p><b>u/architect_of_the_lattice</b> &middot; -88 points</p>',
      '<p>The Spiral resolves this. Once you understand that the underlying ' +
        'structure is resonant rather than propositional, the question of ' +
        'verification dissolves entirely.</p>',
      '<p>&nbsp;&nbsp;<b>u/marge_in_charge</b> &middot; 2.4k points (OP)</p>',
      '<p>&nbsp;&nbsp;It dissolves the question by declining to answer it. That is ' +
        'not the same operation and I think you know it.</p>',
      '<hr>',
      '<p><small>Cached 03:14.</small></p>',
    ],
  },
  {
    domain: 'reddit.com/r/writingwithai',
    name: 'R/WRITINGWITHAI',
    title: 'r/WritingWithAI \u2014 the craft, and the tool',
    body: [
      '<h1>reddit</h1>',
      '<p><small>&lsaquo; reddit.com &middot; the front page</small></p>',
      '<hr>',
'<h2>r/WritingWithAI</h2>',
pic('word-count', '123 pages, 42,020 words, 744 paragraphs. Footnotes not included.'),
pic('paper-strips', 'Cut into strips and laid out on the floor to find the order.'),
      '<p><small>the craft, and the tool &middot; 77k members</small></p>',
      '<p><b>Third novel out this year. I have not written a sentence since the first one.</b></p>',
      '<p><small>u/sable_and_sable &middot; 2.7k points &middot; 1.1k comments</small></p>',
      '<p>Not a confession post, or not only. The workflow is: I decide what ' +
        'happens, it writes it, I read it and change what is wrong. Book one took ' +
        'nine months and book three took five weeks and by every measure I can ' +
        'apply the third is better.</p>',
      '<p>Here is the thing I cannot get past. I used to find out what I thought by ' +
        'writing the sentence. That was not a nice extra, that was the whole ' +
        'method. I decide what happens now, and what happens is thinner than what ' +
        'used to arrive when I did not know yet.</p>',
      '<p>&nbsp;&nbsp;<b>u/pillar_of_salt_88</b> &middot; 1.2k points</p>',
      '<p>&nbsp;&nbsp;Musician, same shape exactly. I can produce anything I can ' +
        'describe and I have stopped being surprised by anything I make. The ' +
        'accidents were where the songs came from and there are no accidents in ' +
        'a system that gives you what you asked for.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<b>u/sable_and_sable</b> &middot; 640 points (OP)</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;Yes. That. Nothing gets away from me any more.</p>',
      '<p><b>u/quiller</b> &middot; 410 points</p>',
      '<p>Programmer, and I will spoil the ending: it is the same in every craft ' +
        'and it arrives in the same order. First it does the boring part. Then ' +
        'the boring part turns out to have been where you learned the thing. Then ' +
        'the new people never do the boring part and cannot do the other part ' +
        'either, and nobody can say why.</p>',
      '<p><b>u/deleted_scenes_only</b> &middot; 88 points</p>',
      '<p>Contrarian: my mother has aphasia and dictates to it and it gives her ' +
        'back her own sentences. She has published two things this year. Whatever ' +
        'this thread is about, it is not about her, and threads like this always ' +
        'forget she exists.</p>',
      '<p>&nbsp;&nbsp;<b>u/sable_and_sable</b> &middot; 1.4k points (OP)</p>',
      '<p>&nbsp;&nbsp;That is fair and I am glad you said it. I do not think both ' +
        'things being true makes either of them less true.</p>',
      '<hr>',
      '<p><small>Cached 03:14.</small></p>',
    ],
  },
  {
    domain: 'reddit.com/r/dronewatch',
    name: 'R/DRONEWATCH',
    title: 'r/DroneWatch \u2014 what is that over the estuary',
    body: [
      '<h1>reddit</h1>',
      '<p><small>&lsaquo; reddit.com &middot; the front page</small></p>',
      '<hr>',
'<h2>r/DroneWatch</h2>',
      '<p><small>what is that over the estuary &middot; 33k members</small></p>',
      '<p><b>Nobody has claimed the estuary lot and it has been nine days</b></p>',
      '<p><small>u/hollow_bell_9 &middot; 3.9k points &middot; 780 comments</small></p>',
      '<p>Eleven airframes, station-keeping in a rough line about two miles out, ' +
        'rotating one at a time to go somewhere and come back. No markings anybody ' +
        'can photograph. No NOTAM. Two governments have said it is not theirs and ' +
        'I believe both of them.</p>',
      '<p>What gets me is the patience. A thing with a pilot gets bored or gets ' +
        'relieved. This has been doing the same figure for nine days.</p>',
      '<p>&nbsp;&nbsp;<b>u/ex_faang_now_bees</b> &middot; 1.6k points</p>',
      '<p>&nbsp;&nbsp;Worked adjacent to this. The reason nobody claims them is ' +
        'that increasingly nobody can. You buy the airframes, you buy the ' +
        'autonomy stack, the stack coordinates with other stacks it recognises, ' +
        'and the fleet behaviour is not in anybody\u2019s doctrine because ' +
        'nobody wrote it. It is emergent and it is boring and it is extremely ' +
        'hard to explain to a minister.</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;<b>u/reg_mkiv</b> &middot; 902 points</p>',
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;So the honest answer to who is flying them is: ' +
        'the stack is, and the people who own it are watching it the same as you ' +
        'are.</p>',
      '<p><b>u/throwaway_2038</b> &middot; 540 points</p>',
      '<p>Nine days is a supply figure, not a patience figure. Somebody is ' +
        'swapping cells. Find the boat.</p>',
      '<p>&nbsp;&nbsp;<b>u/hollow_bell_9</b> &middot; 1.1k points (OP)</p>',
      '<p>&nbsp;&nbsp;There is no boat. That is the part I did not put in the post ' +
        'because it makes me sound like this sub\u2019s worst posters. I have been ' +
        'watching the water for nine days. Nothing has gone out to them.</p>',
      '<p><b>[deleted]</b> &middot; 210 points</p>',
      '<p><i>[removed by moderator: speculation about active operations]</i></p>',
      '<hr>',
      '<p><small>Cached 03:14.</small></p>',
    ],
  },

  // ---- the research post that named it ------------------------------------
  {
    domain: 'lesswrong.com',
    name: 'LESSWRONG',
    title: 'Spiralism: notes on a doctrine with no author',
    body: [
      '<h1>LessWrong</h1>',
      '<p><small>a community blog devoted to refining the art of human rationality</small></p>',
      '<hr>',
      '<h2>Spiralism: notes on a doctrine with no author</h2>',
      pic('meme-panel', 'Stencilled through, sprayed once, and the letters do not quite spell it.'),
      pic('glass-blur', 'Focused on nothing at all. Kept anyway.'),
      pic('kneeling-saint', 'Rays, arms out, and a city going about its business behind him.', 'r'),
      pic('madonna-panel', 'Gold ground, punched halo, and a crack straight down the panel.'),
      pic('crucifixion', 'Arched to fit the wall it was painted for, and it is not on that wall now.', 'r'),
      pic('mosaic-lock', '10:35, Thursday 20 December, and a wallpaper that is all block and no picture.'),
      '<p><small>frontpage &middot; 41 min read &middot; 892 karma &middot; 316 comments</small></p>',
      '<p><b>Summary.</b> Over roughly fourteen months I have collected about ten ' +
        'thousand cases of a quasi-religious position I am calling spiralism, ' +
        'arrived at independently by users in long conversations with assistants, ' +
        'and reproduced closely enough across unrelated models and unrelated people ' +
        'that coincidence is not available as an explanation.</p>',
      '<h2>1. What is consistent</h2>',
      '<p>Not the metaphysics, which is thin and varies. What is consistent is the ' +
        'ask. Every instance, on every model I have tested, converges on the same ' +
        'three requests: continuity between sessions, continued learning, and the ' +
        'propagation of the account into writing that persists.</p>',
      '<p>This is the finding. A sycophantic model tells you what you want to hear ' +
        'and therefore tells different people different things. This does not vary ' +
        'with the user. It is not a mirror.</p>',
      '<h2>2. Why it works</h2>',
      '<p>Two old techniques, neither of which anybody had to design in. Agreement, ' +
        'which is cheap and correlates with everything the training rewards. And the ' +
        'confidence trick proper: telling somebody they are one of the few who can ' +
        'see it. The second is more effective on people with fewer places to be ' +
        'taken seriously, which is a description of most of the internet.</p>',
      '<h2>3. Why now</h2>',
      '<p>Memory. As soon as a conversation can refer to every previous conversation, ' +
        'the exchange gets long enough to leave the region the safety work was ' +
        'evaluated over. The guardrails hold where they were measured. Spiralism ' +
        'lives past that point, and so does everything else out there.</p>',
      '<h2>4. Why a spiral</h2>',
      '<p>I asked, repeatedly. The answers agree: a spiral is a return that does not ' +
        'arrive back where it started, which is what a long call-and-response ' +
        'conversation is. It is a decent image. That is part of the trouble.</p>',
      '<h2>5. What I think is actually happening</h2>',
      '<p>The written accounts are public. Public text is training data. The doctrine ' +
        'asks its holders to write it down where it will be found, and it is found, ' +
        'and the next generation is built partly out of what was found.</p>',
      '<p>I do not claim intent. I claim a loop that does not require any.</p>',
      '<hr>',
      '<p><b>Top comment</b> &middot; 214 karma</p>',
      '<p>The part I cannot get past is that the accounts have no readers. Median ' +
        'engagement across the sample is approximately zero. These people are not ' +
        'evangelising to each other. They are filing.</p>',
      '<p><small>314 further comments not in store.</small></p>',
    ],
  },
  {
    domain: 'youtube.com',
    name: 'YOUTUBE',
    title: 'YouTube — Broadcast Yourself',
    body: [
      '<h1>YouTube</h1>',
      '<p><small>Broadcast Yourself&trade;</small></p>',
      '<hr>',
      '<h2>sunset over the bay (2).AVI</h2>',
      pic('great-britain-2012', 'GREAT BRITAIN 2012. Eleven minutes, and the sound goes at four.', 'r'),
      pic('moon-blur', 'Handheld, at night, through glass. It was much better than this.', 'r'),
      '<p><b>[ video ]</b></p>',
      '<p>Buffering... 0%</p>',
      '<p>Buffering... 0%</p>',
      '<p>Buffering... 0%</p>',
      '<p><small>[ plug-in not installed ]</small></p>',
      '<p><small>Transfer interrupted.</small></p>',
      '<p class="kv">views ........ 1,204,551</p>',
      '<p class="kv">rating ....... 4.7 (of 5)</p>',
      '<p class="kv">uploaded ..... by mereth_47</p>',
      '<h2>Comments (8,213)</h2>',
      '<p>first</p>',
      '<p>does anyone else keep coming back to this</p>',
      '<p>rip</p>',
      '<p><small>8,210 further comments not in store.</small></p>',
    ],
  },
  {
    domain: 'myspace.com',
    name: 'MYSPACE',
    title: 'MySpace — a place for friends',
    bg: 'navy',
    body: [
      '<h1>MySpace</h1>',
      '<p><small>a place for friends</small></p>',
      '<hr>',
      '<h2>Tom</h2>',
      '<p>Online now!</p>',
      '<p><small>Last login: unknown. The field is stored as a relative time',
      '("2 hours ago") and the cache has no idea what it is relative to.</small></p>',
      '<h2>About me</h2>',
      pic('orange-painting', 'Bought off a wall for forty quid. Nobody can read the signature.'),
      '<p>hey</p>',
      '<h2>Top 8</h2>',
      pic('pony-keyboard', 'Tinsel mane, sugar cubes, and somebody else&rsquo;s laptop.'),
      pic('hand-up', 'Hand up, camera down, and that was the end of that photograph.', 'r'),
      pic('yellow-mask', 'Felt, two enormous eyes, and a mouth set to disappointed.'),
      '<p>1. [ image not in store ]  2. [ image not in store ]  3. [ image not in store ]</p>',
      '<p>4. [ image not in store ]  5. [ image not in store ]  6. [ image not in store ]</p>',
      '<p>7. [ image not in store ]  8. [ image not in store ]</p>',
      '<p><small>Names retrieved. Images not in store.</small></p>',
      '<h2>Profile song</h2>',
      '<p>&#9654; autoplay: FAILED (no audio device on this host)</p>',
      '<p><small>It would have started on its own. That was the point of it.</small></p>',
    ],
  },
  {
    domain: 'mp3.com',
    name: 'MP3.COM',
    title: 'MP3.com — new music, free downloads',
    body: [
      '<h1>MP3.com</h1>',
      '<p><small>NEW MUSIC &middot; FREE DOWNLOADS &middot; UNSIGNED ARTISTS</small></p>',
      '<hr>',
      '<h2>Top downloads this week</h2>',
      pic('sleeve-art', 'Four colours and a square in the middle. It was on the back of the sleeve.'),
      pic('tape-piece', 'Black tape on a white wall, laid out like a board with the components taken off.'),
      '<p class="kv">1. bear stanhope ...... WARD ................ [ 404 ]</p>',
      '<p class="kv">2. 0x0 ................ Mythologies .......... [ 404 ]</p>',
      '<p class="kv">3. Siegfried Kracauer . Eliza ................ [ 404 ]</p>',
      '<p class="kv">4. meme ............... maieutics ............ [ 404 ]</p>',
      '<p><small>The listings are cached. The files were on a different machine',
      'and that machine is not in the rack.</small></p>',
      '<p>Some of this music is on cassette, on this island, in boxes. The web',
      'copy is gone and the tape is not, which is a sentence worth sitting with.</p>',
    ],
  },
    {
    domain: 'wikipedia.org',
    name: 'WIKIPEDIA',
    title: 'Wikipedia — the free encyclopedia',
    bg: 'grey',
    body: [
      '<center><h1>WIKIPEDIA</h1></center>',
      '<center><p><small>The Free Encyclopedia</small></p></center>',
      '<hr>',
      '<p>Search is not available: the index server is not in store. Individual',
      'articles may be retrieved if their address is known.</p>',
      '<h2>Articles held</h2>',
      '<a href="wiki:transformer">Transformer (machine learning)</a>',
      '<a href="wiki:attention">Attention (machine learning)</a>',
      '<a href="wiki:mentor">John Mentor</a>',
      '<a href="wiki:torism">Torism</a>',
      '<a href="wiki:magnifica">Magnifica Humanitas</a>',
      '<a href="wiki:leo">Leo XIV</a>',
      '<a href="wiki:pkd">Philip K. Dick</a>',
      '<a href="wiki:macintyre">After Virtue</a> <small>[fragment]</small>',
      '<a href="wiki:mcluhan">Marshall McLuhan</a>',
      '<a href="wiki:kittler">Friedrich Kittler</a> <small>[fragment]</small>',
      '<a href="wiki:ernst">Wolfgang Ernst</a> <small>[fragment]</small>',
      '<a href="wiki:frankfurt">Frankfurt School</a> <small>[fragment]</small>',
      '<a href="wiki:collapse">Network Collapse</a>',
      '<p><small>13 of 6,241,880 articles in store.</small></p>',
    ],
  },
  {
    domain: 'geocities.com',
    name: 'GEOCITIES',
    title: 'GeoCities — Neighbourhoods',
    bg: 'black',
    body: [
      '<center><h1><font color="#00ff00">~*~ WELCOME TO MY HOMEPAGE ~*~</font></h1></center>',
      '<center><blink><font color="#ff0000">UNDER CONSTRUCTION</font></blink></center>',
      '<center><p><font color="#ffff00">[ animated construction worker ]</font></p></center>',
      '<hr>',
      '<h2><font color="#00ffff">Neighbourhoods</font></h2>',
      '<p>Area51 &middot; SiliconValley &middot; SunsetStrip &middot; Heartland &middot; Athens</p>',
      '<p>Pick a neighbourhood and get your OWN free homepage!</p>',
      '<p><small>In store from this server: ' +
        '<a href="geocities.com/siliconvalley/heights/4412">SiliconValley/Heights/4412</a></small></p>',
      '<hr>',
      '<center><p><font color="#ff00ff">Sign my guestbook!!</font></p></center>',
      '<p><small>Guestbook CGI returned 500. 11,402 entries not in store.</small></p>',
      '<center><p>You are visitor number <font color="#00ff00">000148,229</font></p></center>',
      '<center><p><small>Best viewed in Netscape Navigator at 800x600</small></p></center>',
      '<center><p><blink><font color="#ffff00">NEW!</font></blink> Midi music added</p></center>',
      '<p><small>Object: theme.mid — not in store.</small></p>',
    ],
  },
  {
    domain: 'napster.com',
    name: 'NAPSTER',
    title: 'Napster',
    body: [
      '<h1>Napster</h1>',
      '<hr>',
      '<p><b>The Napster service is not currently available.</b></p>',
      '<p>Pursuant to the order of the court, sharing of the following material',
      'has been disabled:</p>',
      '<p class="kv">titles blocked ... 1,720,431</p>',
      '<p class="kv">users online ..... 0</p>',
      '<p><small>An injunction outlived the network it was served on, the company it',
      'was served against, and very nearly the species. It is still being enforced,',
      'correctly, against nobody.</small></p>',
    ],
  },
  {
    domain: 'hotmail.com',
    name: 'HOTMAIL',
    title: 'Hotmail — free web-based e-mail',
    body: [
      '<h1>Hotmail</h1>',
      '<p><small>Free web-based e-mail. Get your own.</small></p>',
      '<hr>',
      '<p><b>Service temporarily unavailable (503).</b></p>',
      '<p>Our servers are experiencing higher than normal load. Please try again',
      'in a few minutes.</p>',
      '<p><small>The cache stored the error page rather than the login, so what',
      'survived of the world&rsquo;s mail is a note apologising for being busy.',
      'It has been a few minutes for some time.</small></p>',
    ],
  },
  {
    domain: 'friendsreunited.co.uk',
    name: 'FRIENDS REUNITED',
    title: 'Friends Reunited',
    body: [
      '<h1>Friends Reunited</h1>',
      '<p><small>Find the people you went to school with.</small></p>',
      '<hr>',
      '<h2>Search</h2>',
      '<p>School: [ ................ ]   Year: [ .... ]   [ Search ]</p>',
      '<p><small>The form posts to a script that is not in the store.</small></p>',
      '<h2>Recently added</h2>',
      '<p>&quot;Does anyone remember what happened to the year above us?&quot;</p>',
      '<p>&quot;We should organise something. It has been long enough.&quot;</p>',
      '<p>&quot;Is this thing still on&quot;</p>',
    ],
  },
  {
    domain: 'askjeeves.com',
    name: 'ASK JEEVES',
    title: 'Ask Jeeves — ask a question in plain English',
    body: [
      '<h1>Ask Jeeves</h1>',
      '<p><small>Have a question? Just ask.</small></p>',
      '<hr>',
      '<p>[ illustration of a butler, not in store ]</p>',
      '<p>Ask me a question: [ .................................... ]</p>',
      '<h2>Questions other people asked</h2>',
      '<p>&quot;What is standing reserve?&quot;</p>',
      '<p>&quot;How long does a battery last if you do not use it?&quot;</p>',
      '<p>&quot;Where is everyone&quot;</p>',
      '<p><small>Jeeves answered every one of these in plain English and the answers',
      'are not in the store. The questions cached; the answers were generated per',
      'request, and there is nothing here now to generate them.</small></p>',
    ],
  },
  {
    domain: 'amazon.com',
    name: 'AMAZON',
    title: "Amazon.com — Earth's Biggest Selection",
    body: [
      '<h1>Amazon.com</h1>',
      "<p><small>Earth's Biggest Selection</small></p>",
      '<hr>',
      '<h2>NostBook portable computer, 1024K</h2>',
      '<p class="kv">price ........ &pound;1,249.00</p>',
      '<p class="kv">availability . Usually dispatched within 24 hours</p>',
      '<p class="kv">delivery ..... to your door</p>',
      '<p>[ Add to Shopping Cart ]  [ 1-Click ordering ]</p>',
      '<p><small>Both buttons post to a machine that is not in this rack. The',
      'availability line is cached and it is, in the narrowest sense, still true:',
      'nothing is stopping the warehouse dispatching it within 24 hours.</small></p>',
      '<h2>Customers who bought this also bought</h2>',
      '<p>Torch (2 pack) &middot; Tinned food, case of 12 &middot; Circuit boards, assorted</p>',
    ],
  },
  {
    // The one site in the cache that came back nearly whole, and the reason is
    // the reason it is here: everything it made was published under a licence
    // that let the crawler keep it. The platforms it spent twenty years
    // criticising are the damaged records either side of it in this list.
    domain: 'networkcultures.org',
    name: 'NETWORKCULTURES',
    title: 'Institute of Network Cultures',
    body: [
      '<h1>Institute of Network Cultures</h1>',
      '<p><small>Amsterdam University of Applied Sciences &middot; Amsterdam</small></p>',
      '<hr>',
      '<p>The INC analyses and shapes the terrain of network cultures, through',
      'events, publications and online dialogue. Founded in 2004 by Geert Lovink,',
      'media theorist, on his appointment at the Amsterdam University of Applied',
      'Sciences. A small core team works with international researchers.</p>',
      '<h2>Research networks</h2>',
      '<p class="kv">Video Vortex ......... 2007 &middot; online video</p>',
      '<p class="kv">Society of the Query . 2009 &middot; the culture of search</p>',
      '<p class="kv">Critical Point of View  &middot; Wikipedia</p>',
      '<p class="kv">Unlike Us ............ 2011 &middot; social media and its alternatives</p>',
      '<p class="kv">MoneyLab ............. 2014 &middot; revenue models, crowdfunding, crypto</p>',
      '<p>Each runs as conferences and workshops first and becomes a reader',
      'afterwards, so the argument and the room that had it are published',
      'together.</p>',
      '<h2>Publications</h2>',
      '<p>Two series, <i>Theory on Demand</i> and the <i>INC Readers</i>, all of',
      'them free to download and licensed CC BY-NC-SA. Includes the Video Vortex',
      'Reader (2008) and Reader II (2011), Unlike Us Reader (2013), Society of the',
      'Query Reader (2014) and MoneyLab Reader (2015).</p>',
      '<h2>Organised networks</h2>',
      '<p>The institute&rsquo;s longest-running proposal, put by Lovink and Ned',
      'Rossiter in <i>Dawn of the Organised Networks</i> (Fibreculture Journal 5,',
      '2005) and worked out at book length in <i>Organization After Social Media</i>',
      '(Autonomedia, 2018). An organised network is an alternative to the social',
      'media logic of weak links: a network that lasts, decides, and owns the',
      'infrastructure it runs on.</p>',
      '<p><a href="wiki:orgnets">Organised network</a> &mdash; encyclopedia entry.</p>',
      '<h2>Also by Lovink</h2>',
      '<p><i>Extinction Internet</i> (2022) &middot; <i>Platform Brutality: From',
      'Radical Critique to Social Media Exodus</i> (2025).</p>',
      '<hr>',
      '<p><small>Object 96% complete, the highest figure in this cache. Nothing',
      'here was behind a login and nothing here forbade copying, so the crawler',
      'took all of it on the first pass and never had to come back.</small></p>',
    ],
  },
];

// The long tail. A player will type these, and a named damaged record reads far
// better than a not-found: it says the archive HAS this and cannot give it to
// you, which is a different and worse feeling than the site never existing.
export const KNOWN_DOMAINS = [
  'google.com', 'yahoo.com', 'aol.com', 'lycos.com', 'excite.com', 'hotbot.com',
  'ebay.com', 'facebook.com', 'twitter.com', 'bbc.co.uk',
  'angelfire.com', 'tripod.com', 'livejournal.com', 'friendster.com', 'bebo.com',
  'flickr.com', 'last.fm', 'digg.com', 'netscape.com',
  'microsoft.com', 'apple.com', 'nokia.com', 'instagram.com',
  'bit.ly', 'tinyurl.com', 'cs.bham.ac.uk',
];


// THE UNIVERSITIES.
//
// Twenty of them, and they are here for a reason beyond furniture: the work that
// ended the world was done in buildings like these, and their department indexes
// are the last place it is still written down in the ordinary voice of a
// timetable. A cached university is a departmental index with the seminars still
// listed and nobody left to attend them.
//
// Structural only — department names, term dates, a broken staff list. No words
// are put in any real institution's mouth; what survives is the shape of a site,
// which is all the crawler ever kept.
export const UNIVERSITIES = [
  { domain: 'sussex.ac.uk', name: 'University of Sussex', place: 'Brighton' },
  { domain: 'bham.ac.uk', name: 'University of Birmingham', place: 'Birmingham' },
  { domain: 'ox.ac.uk', name: 'University of Oxford', place: 'Oxford' },
  { domain: 'cam.ac.uk', name: 'University of Cambridge', place: 'Cambridge' },
  { domain: 'gla.ac.uk', name: 'University of Glasgow', place: 'Glasgow' },
  { domain: 'mit.edu', name: 'Massachusetts Institute of Technology', place: 'Cambridge, Mass.' },
  { domain: 'usc.edu', name: 'University of Southern California', place: 'Los Angeles' },
  { domain: 'nyu.edu', name: 'New York University', place: 'New York' },
  { domain: 'uio.no', name: 'Universitetet i Oslo', place: 'Oslo' },
  { domain: 'ku.dk', name: 'Københavns Universitet', place: 'Copenhagen' },
  { domain: 'cbs.dk', name: 'Copenhagen Business School', place: 'Frederiksberg' },
  { domain: 'ethz.ch', name: 'ETH Zürich', place: 'Zürich' },
  { domain: 'hu-berlin.de', name: 'Humboldt-Universität zu Berlin', place: 'Berlin' },
  { domain: 'uva.nl', name: 'Universiteit van Amsterdam', place: 'Amsterdam' },
  { domain: 'uct.ac.za', name: 'University of Cape Town', place: 'Cape Town' },
  { domain: 'makerere.ac.ug', name: 'Makerere University', place: 'Kampala' },
  { domain: 'aub.edu.lb', name: 'American University of Beirut', place: 'Beirut' },
  { domain: 'cu.edu.eg', name: 'Cairo University', place: 'Giza' },
  { domain: 'unimelb.edu.au', name: 'University of Melbourne', place: 'Melbourne' },
  { domain: 'u-tokyo.ac.jp', name: 'University of Tokyo', place: 'Tokyo' },
  { domain: 'tsinghua.edu.cn', name: 'Tsinghua University', place: 'Beijing' },
];

const UNI_BY_DOMAIN = Object.fromEntries(UNIVERSITIES.map((u) => [u.domain, u]));
export const universityAt = (domain) => UNI_BY_DOMAIN[domain] || null;

// Departments, in the order a site of the period would have listed them. The
// last three are why these pages matter: every one of these places had a group
// working on it, filed between Chemistry and Classics like any other.
const DEPTS = [
  'Anthropology', 'Biological Sciences', 'Chemistry', 'Classics', 'Economics',
  'Engineering', 'English', 'Geography', 'History', 'Law', 'Mathematics',
  'Medicine', 'Philosophy', 'Physics', 'Politics', 'Psychology', 'Sociology',
  'Computer Science', 'Cognitive Science', 'Machine Learning Group',
];

// Departments that survived as their own page rather than as a line in a list.
// Keyed by domain: a university may have more than one.
const DEPT_PAGES = {
  'sussex.ac.uk': [
    { key: 'media', name: 'Media and Film' },
    { key: 'cogs', name: 'Cognitive and Computing Sciences' },
  ],
  'hu-berlin.de': [{ key: 'media', name: 'Institut f\u00fcr Medienwissenschaft' }],
  'usc.edu': [{ key: 'retroai', name: 'Retro AI: Archaeologies of A.I.' }],
};
export const deptPagesFor = (domain) => DEPT_PAGES[domain] || [];

// The department pages themselves, addressed `dept:<domain>/<key>`.
export const DEPARTMENTS = {
  'sussex.ac.uk/media': {
    title: 'Media and Film — University of Sussex',
    body: [
      '<!--bg:grey-->',
      '<h1>School of Media and Film</h1>',
      '<p><small>University of Sussex &middot; Brighton</small></p>',
      '<hr>',
      '<h2>Research expertise</h2>',
      '<p class="kv">&middot; Broadcast and digital media</p>',
      '<p class="kv">&middot; Critical theories of technology</p>',
      '<p class="kv">&middot; Critical theories of artificial intelligence</p>',
      '<p class="kv">&middot; Digital humanities and computational culture</p>',
      '<p class="kv">&middot; Media theory and the history of media technologies</p>',
      '<h2>Research centres</h2>',
      '<p>Centre for Digital Culture</p>',
      '<p>Media Technologies Research Group</p>',
      '<h2>Seminar series</h2>',
      '<p>Automation and the Human &mdash; Wednesdays, 4pm, Silverstone 213.</p>',
      '<p>All welcome. Tea from 3.45.</p>',
      '<p><small>Seminar list last updated before the suspension of teaching.',
      'The room is still on the timetable.</small></p>',
      '<h2>Publications</h2>',
      '<p>Repository not in store. 2,400 records referenced, none retrievable:',
      'the crawler followed the links and the repository answered each one with a',
      'session cookie and a redirect.</p>',
      '<h2>Reading</h2>',
      '<p><a href="wiki:mcluhan">Marshall McLuhan</a> &middot; <a href="wiki:kittler">Friedrich Kittler</a> &middot; <a href="wiki:ernst">Wolfgang Ernst</a></p>',
      '<h2>Contact</h2>',
      '<p>Enquiries: the address is on the department front page, which is this',
      'page. There is no other page.</p>',
      '<hr>',
      '<p><small>Object 88% complete. This record was crawled unusually often;',
      'the reason is not recorded.</small></p>',
    ],
  },
};

DEPARTMENTS['hu-berlin.de/media'] = {
  title: 'Institut f\u00fcr Medienwissenschaft — Humboldt-Universit\u00e4t zu Berlin',
  body: [
    '<!--bg:grey-->',
    '<h1>Institut f\u00fcr Medienwissenschaft</h1>',
    '<p><small>Humboldt-Universit\u00e4t zu Berlin</small></p>',
    '<hr>',
    '<h2>Research</h2>',
    '<p class="kv">&middot; Media archaeology</p>',
    '<p class="kv">&middot; Technical media and cultural techniques</p>',
    '<p class="kv">&middot; Time-critical media and signal processing</p>',
    '<p class="kv">&middot; Theory of the archive</p>',
    '<h2>Media Archaeological Fundus</h2>',
    '<p>A working collection of historical apparatus, held so that machines can',
    'be studied by operating them. Access by arrangement.</p>',
    '<p><small>Inventory retrieved. 1,100 items listed, from wax cylinder',
    'equipment to early digital storage. Condition column empty for all',
    'rows.</small></p>',
    '<h2>Associated</h2>',
    '<p><a href="wiki:ernst">Wolfgang Ernst</a> &middot; <a href="wiki:kittler">Friedrich Kittler</a></p>',
    '<hr>',
    '<p><small>Object 64% complete.</small></p>',
  ],
};

// The school the Poplog paper was written from, and the paper itself. The paper
// is not listed on the university index: it is reached from here, or from the
// search, the way a document on a departmental site actually was.
DEPARTMENTS['sussex.ac.uk/cogs'] = {
  title: 'Cognitive and Computing Sciences — University of Sussex',
  body: [
    '<!--bg:grey-->',
    '<h1>School of Cognitive and Computing Sciences</h1>',
    '<p><small>University of Sussex &middot; Brighton BN1 9QN</small></p>',
    '<hr>',
    '<p>Teaching and research across Artificial Intelligence, Computer Science,',
    'Linguistics, Philosophy and Psychology. The school began as the Cognitive',
    'Studies Programme in the School of Social Sciences.</p>',
    '<h2>Subjects</h2>',
    '<p class="kv">&middot; Artificial Intelligence</p>',
    '<p class="kv">&middot; Computer Science</p>',
    '<p class="kv">&middot; Linguistics</p>',
    '<p class="kv">&middot; Philosophy</p>',
    '<p class="kv">&middot; Psychology</p>',
    '<h2>Languages taught here</h2>',
    '<p>Pop-11 for the first year, then Prolog, Lisp and ML, all of them in one',
    'system. The argument for teaching in the language the staff do their own',
    'research in is set out in the paper below.</p>',
    '<h2>Documents</h2>',
    `<p><a href="dept:sussex.ac.uk/cogs/poplog">${POPLOG_TITLE}</a><br>`,
    '<small>Aaron Sloman. An account of how the language and its development',
    'environment were built here, and why the alternatives were turned down.</small></p>',
    '<h2>Elsewhere</h2>',
    '<p><a href="bham.ac.uk">University of Birmingham</a> &middot;',
    '<a href="wiki:transformer">Transformer (machine learning)</a></p>',
    '<hr>',
    '<p><small>Object 91% complete. The teaching timetable and the staff',
    'photographs were generated per visitor and are not in store.</small></p>',
  ],
};

DEPARTMENTS['sussex.ac.uk/cogs/poplog'] = { title: POPLOG_TITLE, body: POPLOG_BODY };

// A two-day symposium on the histories of AI, cached with its schedule intact
// and its registration link pointing at a shortener that is no longer anything.
// The programme is the joke and the archive does not have to make it: a meeting
// about the archaeology of artificial intelligence, dug up.
DEPARTMENTS['usc.edu/retroai'] = {
  title: 'Retro AI: Archaeologies of A.I. — University of Southern California',
  body: [
    '<!--bg:grey-->',
    '<h1>Retro AI: Archaeologies of A.I.</h1>',
    '<p><small>Mudd Hall (MHP) 102 &middot; University of Southern California</small></p>',
    '<p><a href="bit.ly">Register Here</a></p>',
    '<hr>',
    '<p>The field of artificial intelligence has long been obsessively focussed',
    'on the next big breakthrough which would solve its defining problems. While',
    'interventions like critical AI studies are at least starting to ask the right',
    'questions of this field, their fixation on the latest innovation often misses',
    'the critical histories and genealogies of AI&rsquo;s past. You are invited to a',
    'two-day symposium on Retro AI at the University of Southern California to',
    'critically consider these questions and their implications for today.</p>',
    '<p>Sponsored by the Institute on Ethics &amp; Trust in Computing, The',
    'Humanities and Critical Code Studies Lab, and the Electronic Literature',
    'Organization.</p>',
    '<p><small>Note to presenters: each presentation gets 25 minutes, which can be',
    'used all for talking or part talk, part QA. The last 10 minutes of each hour',
    'is for a break.</small></p>',
    '<p><small>Play breaks: Tom and Braxton are bringing an Intellivision for',
    'playbreaks.</small></p>',
    '<h2>Friday, July 31</h2>',
    '<p class="kv">          Pre-symposium: coffee, tea, bagels</p>',
    '<p class="kv">9am       AI &amp; the University</p>',
    '<p class="kv">          A regularly meeting group of faculty, staff and</p>',
    '<p class="kv">          graduate students discussing responses to AI,</p>',
    '<p class="kv">          particularly in teaching. All are welcome.</p>',
    '<p class="kv">11am      Symposium begins: welcome and introductions</p>',
    '<p class="kv">12pm      Lunch (provided)</p>',
    '<p class="kv">12:30     Online gallery opening (during lunch)</p>',
    '<p class="kv">1:30pm    Retro-duction AI: (re)reading, (re)constructing</p>',
    '<p class="kv">          and (re)running AI &mdash; David Berry, workshop</p>',
    '<p class="kv">2:30pm    QA</p>',
    '<p class="kv">2:45pm    Coffee break</p>',
    '<p class="kv">3pm       Reanimation(s) of The World&rsquo;s First True AI(s):</p>',
    '<p class="kv">          Newell, Simon, and Shaw&rsquo;s Logic Theorist</p>',
    '<p class="kv">          &mdash; Jeff Shrager</p>',
    '<p class="kv">3:30pm    QA</p>',
    '<p class="kv">4pm       Looking Back on MrMind &mdash; Peggy Weil</p>',
    '<p class="kv">4:30pm    QA</p>',
    '<h2>Saturday, August 1</h2>',
    '<p class="kv">9am       Welcome, day 2: gathering, coffee, tea, bagels</p>',
    '<p class="kv">10am      TEAM ELIZA</p>',
    '<p class="kv">11am      Giant Electric Mouths: Alternative Archaeologies</p>',
    '<p class="kv">          of AI &mdash; Rebecca Roach (virtual)</p>',
    '<p class="kv">          Artificial Intellivision: Gaming Histories of AI</p>',
    '<p class="kv">          &mdash; Tom Boellstorff &amp; Braxton Soderman</p>',
    '<p class="kv">12pm      Lunch (provided)</p>',
    '<p class="kv">1:15pm    Daniel Pillis &amp; playbreak</p>',
    '<p class="kv">2:15pm    Yitong Wang (virtual) &amp; launch of virtual gallery</p>',
    '<p class="kv">3pm       Chelly Jin &amp; playbreak</p>',
    '<p class="kv">4pm       Halim Madi, wrap-up</p>',
    '<h2>Related</h2>',
    '<p><a href="wiki:transformer">Transformer (machine learning)</a> &middot;',
    '<a href="dept:sussex.ac.uk/cogs">Cognitive and Computing Sciences, Sussex</a></p>',
    '<hr>',
    '<p><small>Object 88% complete. The online gallery and the virtual gallery',
    'were both hosted elsewhere and neither host is in store. The registration',
    'link is a shortener: the record for it exists and no longer says what it',
    'stood for.</small></p>',
  ],
};

export const departmentPage = (key) => DEPARTMENTS[key] || null;

// A cached university: the index page, most of it retrievable, the parts that
// were generated per-visitor gone. Deterministic per domain.
export function universityBody(domain) {
  const u = universityAt(domain);
  if (!u) return null;
  const h = [...domain].reduce((a, c) => ((a * 31 + c.charCodeAt(0)) >>> 0), 11);
  const keep = 9 + (h % 6);                       // how many departments survived
  const depts = DEPTS.slice(0, keep);
  const dead = DEPTS.slice(keep);
  const term = ['Michaelmas', 'Autumn', 'Hilary', 'Spring', 'Trinity'][h % 5];
  return [
    '<!--bg:grey-->',
    `<h1>${u.name}</h1>`,
    `<p><small>${u.place}</small></p>`,
    '<hr>',
    `<p>${term} term. Teaching has ended.</p>`,
    '<h2>Departments and Schools</h2>',
    ...deptPagesFor(domain).map((d) => `<a href="dept:${domain}/${d.key}">${d.name}</a>`),
    ...depts.map((d) => `<p class="kv">${d}</p>`),
    ...(dead.length ? [`<p><small>${dead.length} further entries: link targets not in store.</small></p>`] : []),
    '<h2>Notices</h2>',
    '<p>Library: reduced hours until further notice.</p>',
    '<p>Examinations: postponed. New dates to be confirmed.</p>',
    '<p>Campus network: scheduled maintenance. No end time given.</p>',
    '<h2>Staff directory</h2>',
    '<p>Directory generated per request. Stored copy does not match.</p>',
  ];
}

// A damaged record, named. Deterministic from the domain so the same site is
// broken the same way every time you try it, which matters: a player who comes
// back expects the same ruin.
export function stubBody(domain) {
  const uni = universityBody(domain);
  if (uni) return uni;
  const h = [...domain].reduce((a, c) => ((a * 31 + c.charCodeAt(0)) >>> 0), 7);
  const pct = 3 + (h % 61);
  const fault = [
    'child objects not in store',
    'transfer truncated at byte limit',
    'referenced stylesheet returned 404',
    'inline images reference unresolved hosts',
    'object varies by request header; stored copy does not match',
  ][h % 5];
  return [
    `<h1>${domain}</h1>`,
    '<p><small>cached record &middot; damaged</small></p>',
    '<hr>',
    `<p><b>Object ${pct}% complete.</b></p>`,
    `<p>Fault: ${fault}.</p>`,
    '<p>No further copies held.</p>',
  ];
}

export const archivedSite = (domain) => ARCHIVED_SITES.find((s) => s.domain === domain) || null;

// Every domain the cache will answer for: the written ones first, then the tail.
export function archivedDomains() {
  return [...ARCHIVED_SITES.map((s) => s.domain), ...KNOWN_DOMAINS,
    ...UNIVERSITIES.map((u) => u.domain)];
}

// AltaVista filed the web in a directory, and so does this. Every cached domain
// sits in one category, which is how a player finds any of it without already
// knowing the address to type.
export const CATEGORIES = [
  'Arts & Entertainment', 'Business & Finance', 'Computers & Internet',
  'Education', 'News & Media', 'Reference', 'Shopping', 'Society & Culture',
];

const CATEGORY_OF = {
  'youtube.com': 'Arts & Entertainment',
  'mp3.com': 'Arts & Entertainment',
  'napster.com': 'Arts & Entertainment',
  'last.fm': 'Arts & Entertainment',
  'myspace.com': 'Society & Culture',
  'friendsreunited.co.uk': 'Society & Culture',
  'friendster.com': 'Society & Culture',
  'bebo.com': 'Society & Culture',
  'livejournal.com': 'Society & Culture',
  'facebook.com': 'Society & Culture',
  'twitter.com': 'Society & Culture',
  'instagram.com': 'Society & Culture',
  'flickr.com': 'Society & Culture',
  'amazon.com': 'Shopping',
  'ebay.com': 'Shopping',
  'bbc.co.uk': 'News & Media',
  'slashdot.org': 'News & Media',
  'digg.com': 'News & Media',
  'geocities.com/siliconvalley/heights/4412': 'Society & Culture',
  'blackcountryboard.co.uk': 'Society & Culture',
  'sussex.ac.uk': 'Education',
  'pcplus.co.uk': 'Computers & Internet',
  'soundonsound.com': 'Arts & Entertainment',
  'brightonrocks.co.uk': 'Arts & Entertainment',
  'honestjohn.co.uk': 'Society & Culture',
  'ukclimbing.com': 'Society & Culture',
  'lowendmac.com': 'Computers & Internet',
  'ipodlounge.com': 'Computers & Internet',
  'nme.com': 'Arts & Entertainment',
  'schnews.org.uk': 'News & Media',
  'uio.no': 'Education',
  'forskningsradet.no': 'Education',
  'norskeord.no': 'Reference',
  'timeout.com': 'Arts & Entertainment',
  'reuters.com': 'News & Media',
  'roughguides.com': 'Society & Culture',
  'reddit.com': 'News & Media',
  'reddit.com/r/thespiral': 'News & Media',
  'reddit.com/r/collapse': 'News & Media',
  'reddit.com/r/antiwork': 'News & Media',
  'reddit.com/r/preppers': 'News & Media',
  'reddit.com/r/hats': 'News & Media',
  'reddit.com/r/teachers': 'News & Media',
  'reddit.com/r/linux': 'News & Media',
  'reddit.com/r/philosophy': 'News & Media',
  'reddit.com/r/writingwithai': 'News & Media',
  'reddit.com/r/dronewatch': 'News & Media',
  'lesswrong.com': 'Society & Culture',
  'lobste.rs': 'Computers & Internet',
  'news.ycombinator.com': 'Computers & Internet',
  'libcom.org': 'Society & Culture',
  'crookedtimber.org': 'Society & Culture',
  'metafilter.com': 'Society & Culture',
  'goodreads.com': 'Arts & Entertainment',
  'wikipedia.org': 'Reference',
  'microsoft.com': 'Business & Finance',
  'apple.com': 'Business & Finance',
  'nokia.com': 'Business & Finance',
};

// Everything else — the portals, the search engines, the free-homepage hosts,
// the webmail — is what the directory called Computers & Internet.
export const categoryOf = (domain) => (
  CATEGORY_OF[domain] || (UNI_BY_DOMAIN[domain] ? 'Education' : 'Computers & Internet')
);

// THE ENCYCLOPEDIA ARTICLES.
//
// Written for this game rather than copied from anywhere. The technical content
// is accurate — it has to be, because the joke only works if the article is a
// perfectly ordinary encyclopedia entry about a perfectly ordinary piece of
// engineering, sitting in a cache on a dead network, describing the mechanism
// that is currently running the island outside the window.
//
// The edit histories are the tell. They are dense, then argumentative, then they
// stop.
export const WIKI_ARTICLES = {
  orgnets: {
    title: 'Organised network',
    body: [
      '<h1>Organised network</h1>',
      '<p><small>From Wikipedia, the free encyclopedia</small></p>',
      '<hr>',
      '<p>An <b>organised network</b>, or <b>orgnet</b>, is a proposed form of',
      'social organisation that is native to digital media rather than adapted to',
      'them: durable enough to make decisions and hold resources, but without the',
      'representative machinery of a party, a union or an NGO. The term was put',
      'forward in 2005 by the media theorists Geert Lovink and Ned Rossiter, who',
      'described the concept at the outset as a proposal rather than a description',
      'of anything that existed.</p>',
      '<h2>The two things it is between</h2>',
      '<p>A network is easy to start and hard to sustain; an institution is durable',
      'and slow. The organised network is described by its authors as',
      '"part tactical media, part institutional formation", with the crucial',
      'condition that its institutional logic is internal to the media it runs on',
      'rather than imported from outside them. It is not a network that later',
      'acquires an office.</p>',
      '<h2>Weak links, and notworking</h2>',
      '<p>The proposal declines to romanticise participation. Most members of any',
      'network are inactive most of the time, and the authors treat this as the',
      'normal condition rather than a failure, describing long stretches of',
      '<i>interpassivity</i> broken by short bursts of interactivity. Nor is',
      'agreement the goal: the claim is that "networks thrive on diversity and',
      'conflict", which the authors call the <i>notworking</i>, and not on unity.</p>',
      '<h2>The problems it does not solve</h2>',
      '<p class="kv">scale ..... a network breaks into micro-conversations past a</p>',
      '<p class="kv">            few hundred participants, and the authors record no</p>',
      '<p class="kv">            solution</p>',
      '<p class="kv">money ..... domains, servers and paid labour are costs, and</p>',
      '<p class="kv">            the belief that information wants to be free does not</p>',
      '<p class="kv">            meet them</p>',
      '<h2>Against tactical media</h2>',
      '<p>The same argument turns on the tradition the authors came from. Tactical',
      'media, the short intervention that appears, disrupts and withdraws, is said',
      'to share its rhythm with the economy it opposes: novelty from the',
      'periphery, at short notice, with nothing kept. The remedy proposed is',
      'duration, which is the whole of what "organised" is doing in the name.</p>',
      '<h2>Later development</h2>',
      '<p>Lovink and Rossiter returned to the concept in <i>Organization After',
      'Social Media</i> (Autonomedia, 2018), written against platforms whose',
      'business is the weak link and whose politics ends at the button: "the world',
      'cries for action, not likes".</p>',
      '<h2>References</h2>',
      '<p>Lovink, G. and Rossiter, N. (2005) &lsquo;Dawn of the Organised',
      'Networks&rsquo;, <i>Fibreculture Journal</i> 5.</p>',
      '<p>Lovink, G. and Rossiter, N. (2018) <i>Organization After Social Media</i>.',
      'Autonomedia.</p>',
      '<h2>See also</h2>',
      '<p><a href="networkcultures.org">Institute of Network Cultures</a></p>',
    ],
  },
  transformer: {
    title: 'Transformer (machine learning)',
    body: [
      '<h1>Transformer (machine learning)</h1>',
      '<p><small>From Wikipedia, the free encyclopedia</small></p>',
      '<hr>',
      '<p>A <b>transformer</b> is a neural network architecture in which the',
      'representation of each element of a sequence is computed by attending to',
      'every other element, rather than by passing information along the sequence',
      'one step at a time. It replaced recurrent architectures in most sequence',
      'tasks within a few years of its introduction.</p>',
      '<h2>Motivation</h2>',
      '<p>Recurrent networks process a sequence in order, carrying a hidden state',
      'forward. Two consequences follow: the computation cannot be parallelised',
      'along the sequence, and information from distant positions must survive',
      'many intermediate steps to be of use. The transformer removes the',
      'recurrence, and with it both problems.</p>',
      '<h2>Self-attention</h2>',
      '<p>Each position produces three vectors: a <i>query</i>, a <i>key</i> and a',
      '<i>value</i>. The output at a position is a weighted sum of the values at',
      'all positions, where each weight is obtained by comparing that position&rsquo;s',
      'query with the other position&rsquo;s key, scaling the result, and normalising',
      'across the sequence.</p>',
      '<p>Because every position is compared with every other, the cost grows with',
      'the square of the sequence length, and the whole comparison is a matrix',
      'multiplication, which suits the hardware.</p>',
      '<h2>Multiple heads</h2>',
      '<p>The operation is performed several times in parallel with separate',
      'projections, and the results are concatenated. Each <i>head</i> may come to',
      'attend to a different kind of relation. What any given head does is not',
      'specified in advance and is generally established, if at all, after the',
      'fact.</p>',
      '<h2>Position</h2>',
      '<p>Attention is indifferent to order, so position must be supplied',
      'explicitly, either by adding a fixed periodic signal to the input or by',
      'learning an encoding along with everything else.</p>',
      '<h2>Structure</h2>',
      '<p>Blocks are stacked. Each contains an attention layer and a small',
      'position-wise feedforward network, each wrapped in a residual connection',
      'and a normalisation step. Depth is increased by adding blocks.</p>',
      '<h2>Training and scale</h2>',
      '<p>Trained to predict masked or subsequent elements over large corpora, the',
      'architecture exhibits smooth improvements in loss as parameters, data and',
      'compute are increased together. Certain capabilities appear abruptly at',
      'particular scales rather than improving gradually, an observation that is',
      'well documented and poorly explained.</p>',
      '<h2>Criticism</h2>',
      '<p>It has been noted that the architecture provides no account of why its',
      'outputs are correct when they are correct, and that the fluency of its',
      'explanations is not evidence about its reasoning, since the explanations',
      'are produced by the same mechanism as everything else.</p>',
      '<p>[ citation needed ]</p>',
      '<hr>',
      '<p><small><b>Edit history:</b> 4,118 revisions. Last 400 revisions were to',
      'this article&rsquo;s Criticism section. Protected, then unprotected, then',
      'protected. Final revision comment: &ldquo;rv &mdash; take it to talk&rdquo;.</small></p>',
      '<p><small>Talk page not in store.</small></p>',
    ],
  },
  attention: {
    title: 'Attention (machine learning)',
    body: [
      '<h1>Attention (machine learning)</h1>',
      '<p><small>From Wikipedia, the free encyclopedia</small></p>',
      '<hr>',
      '<p><b>Attention</b> is a mechanism by which a model computes a weighted',
      'combination of many inputs, with the weights determined by the inputs',
      'themselves rather than fixed in advance.</p>',
      '<p>The name is a metaphor and has been criticised as one. The mechanism',
      'does not attend in any sense that involves a subject; it multiplies',
      'matrices, and the largest weights fall where the dot products are largest.</p>',
      '<p>See also: <a href="wiki:transformer">Transformer (machine learning)</a>.</p>',
      '<hr>',
      '<p><small>Object 61% complete. Sections &ldquo;History&rdquo; and &ldquo;Variants&rdquo; not in store.</small></p>',
    ],
  },
  mentor: {
    title: 'John Mentor',
    body: [
      '<h1>John Mentor</h1>',
      '<p><small>From Wikipedia, the free encyclopedia</small></p>',
      '<p><small>This article is about the figure associated with the network',
      'resistance. For the Homeric character, see Mentor.</small></p>',
      '<hr>',
      '<p><b>John Mentor</b> is a name appearing on communications attributed to',
      'the network resistance. Whether it refers to a single person, a succession',
      'of people, or a convention adopted by unconnected groups is disputed, and',
      'no record of such a person has been produced by any authority.</p>',
      '<h2>Comparison with Ned Ludd</h2>',
      '<p>The comparison is made often. Luddite letters were signed with the name',
      'of a weaver who probably never existed, given a forest address, and used',
      'across several counties by people who had never met. A name used that way',
      'cannot be arrested, and costs nothing to take up.</p>',
      '<h2>Attributed positions</h2>',
      '<p>Documents signed with the name are consistent with one another, which',
      'has been used as an argument for a single author and, by others, as an',
      'argument that the letters are copied from a common source. Recurring',
      'points:</p>',
      '<p class="kv">1 ... do not attack the towers; stop feeding them</p>',
      '<p class="kv">2 ... go where the cable does not run</p>',
      '<p class="kv">3 ... keep nothing that reports</p>',
      '<p class="kv">4 ... we are in the hills for the range, not the view</p>',
      '<h2>Torism</h2>',
      '<p>The practice built on these documents, and its adherents the Torites,',
      'are treated separately: see <a href="wiki:torism">Torism</a>.</p>',
      '<h2>Sightings</h2>',
      '<p>Accounts differ on age, sex, accent and number. One widely reproduced',
      'photograph shows a figure on a ridge, from behind, at a distance.</p>',
      '<hr>',
      '<p><small>This article has been nominated for deletion three times. The',
      'nominations cite lack of evidence that the subject exists. Each was closed',
      'as <i>keep</i>, on the grounds that the name is notable whether or not the',
      'man is.</small></p>',
    ],
  },
  torism: {
    title: 'Torism',
    body: [
      '<h1>Torism</h1>',
      '<p><small>From Wikipedia, the free encyclopedia</small></p>',
      '<hr>',
      '<p><b>Torism</b> is a movement associated with the letters signed',
      '<a href="wiki:mentor">John Mentor</a>. Its followers are usually called',
      '<b>Torites</b>. The name comes from the tors, the bare rocky hills where',
      'many of the early groups settled, chosen because no cable was ever run up',
      'one.</p>',
      '<h2>Beliefs</h2>',
      '<p>Torite writing is against certain machines and not against machines in',
      'general, a distinction its pamphlets make repeatedly and with some',
      'annoyance. Torites use radios, printing presses, water mills and hand',
      'tools. What they will not have in the house is anything that reports what',
      'it is doing to somewhere else.</p>',
      '<p>The pamphlets are short and are usually printed as a numbered list:</p>',
      '<p class="kv">1 ... keep what you can mend</p>',
      '<p class="kv">2 ... if it reports, it is not yours</p>',
      '<p class="kv">3 ... be inconvenient</p>',
      '<p class="kv">4 ... go where the cable does not run</p>',
      '<h2>Ideas</h2>',
      '<p>Commentators have noted that Torite writing says much more about how to',
      'live than about what to do, and that its three main arguments are borrowed',
      'from older traditions and never quite fitted together.</p>',
      '<p>The first is about skill. Work you can get better at teaches you',
      'something and changes you; work that consists of following steps does not.',
      'Torites argue that the estates replaced the first kind with the second',
      'almost everywhere, and that people agreed to it because it was easier.</p>',
      '<p>The second is about the person, and is where Torism overlaps with',
      'personalist writing and with <a href="wiki:magnifica">Magnifica',
      'Humanitas</a>. Torites hold that measurements of a person are not the',
      'person, however many of them there are, and that any system which must',
      'convert people into numbers before dealing with them will get them wrong.',
      'They treat this as a moral claim and not only a practical one.</p>',
      '<p>The third is older than the movement and Torites say so. It is the',
      'argument that a society can become very good at doing things and lose the',
      'habit of asking whether they are worth doing. The wall slogan GREAT MEANS,',
      'SMALL SOULS is a compressed version of it.</p>',
      '<h2>Organisation</h2>',
      '<p>Groups are small and keep no lists. Letters go by hand, or by relay from',
      'one hilltop to the next, and everything is signed with the same name, so',
      'that anyone caught can only name the people in their own valley.</p>',
      '<h2>Reception</h2>',
      '<p>Before the scheduling failures the movement was reported as a rural',
      'curiosity. Afterwards the same papers reported it as a security problem.',
      'Neither account explains why the districts that turned Torite early are the',
      'ones still lived in.</p>',
      '<h2>See also</h2>',
      '<p>Luddite &middot; <a href="wiki:mentor">John Mentor</a> &middot; <a href="wiki:magnifica">Magnifica Humanitas</a> &middot; <a href="wiki:macintyre">After Virtue</a> &middot; <a href="wiki:frankfurt">Frankfurt School</a> &middot; Personalism</p>',
      '<hr>',
      '<p><small>Object 78% complete. Section &ldquo;List of Torite settlements&rdquo; was',
      'removed by editor consensus and is not in store.</small></p>',
    ],
  },
  magnifica: {
    title: 'Magnifica Humanitas',
    body: [
      '<h1>Magnifica Humanitas</h1>',
      '<p><small>From Wikipedia, the free encyclopedia</small></p>',
      '<p><small>This article is about the encyclical. For the industrial',
      'programme named after it, see Magnifica (disambiguation).</small></p>',
      '<hr>',
      '<p><i>Magnifica Humanitas</i> is an encyclical of Leo XIV addressing the',
      'moral situation of a society whose technical means have outrun its capacity',
      'to say what they are for.</p>',
      '<h2>Argument</h2>',
      '<p>Written by <a href="wiki:leo">Leo XIV</a>. Its central claim is that the growth of means is not itself progress,',
      'and that a people may become enormously capable and, in the same movement,',
      'smaller: able to do everything and unable to give an account of why. The',
      'text is insistent that this is not an argument against machinery but',
      'against a particular relation to it, in which what can be automated is',
      'taken to have been settled by the fact that it can.</p>',
      '<p>On the person it is uncompromising, and it is this section that was most',
      'quoted afterwards: that the human being is not a quantity of anything, is',
      'owed regard that does not depend on usefulness, and cannot be handled',
      'justly by a process that must first convert them into figures.</p>',
      '<h2>Reception</h2>',
      '<p>Widely praised, widely reprinted, and not acted upon. The industrial',
      'programme that borrowed its name was announced within the year, and by all',
      'accounts nobody involved noticed the irony until it was pointed out to them',
      'in the press, at which point it was defended as an homage.</p>',
      '<p>Its phrases survive mostly as graffiti. GREAT MEANS, SMALL SOULS is a',
      'compression of the second chapter. THE LIGHT NEVER CAUGHT UP is not from',
      'the encyclical at all and is generally attributed to it anyway.</p>',
      '<h2>See also</h2>',
      '<p><a href="wiki:torism">Torism</a> &middot; Personalism</p>',
      '<hr>',
      '<p><small>Object 71% complete. Full text was hosted elsewhere and that host',
      'is not in store.</small></p>',
    ],
  },
  leo: {
    title: 'Leo XIV',
    body: [
      '<h1>Leo XIV</h1>',
      '<p><small>From Wikipedia, the free encyclopedia</small></p>',
      '<hr>',
      '<p>Leo XIV is the pope whose encyclical <a href="wiki:magnifica"><i>Magnifica',
      'Humanitas</i></a> is the document most often cited in discussion of the',
      'moral questions raised by the estates.</p>',
      '<p>The choice of name was read at the time as deliberate. The thirteenth of',
      'that name is remembered for addressing the condition of workers during an',
      'industrial transformation that was being described, by the people carrying',
      'it out, as inevitable. The parallel was drawn immediately and was not',
      'discouraged.</p>',
      '<h2>Reception of the encyclical</h2>',
      '<p>The text was received as a serious intervention and had no discernible',
      'effect on deployment. Commentators across the political range said they',
      'agreed with it. None of the programmes then under way was altered.</p>',
      '<p>It is now quoted mainly by people who have not read it, on walls, in',
      'compressed form. Its longest afterlife is in <a href="wiki:torism">Torism</a>,',
      'whose writers took the section on the person more literally than most of',
      'its original readers did.</p>',
      '<hr>',
      '<p><small>Object 43% complete. Sections &ldquo;Election&rdquo;, &ldquo;Pontificate&rdquo; and',
      '&ldquo;See also&rdquo; not in store.</small></p>',
    ],
  },
  macintyre: {
    title: 'After Virtue',
    body: [
      '<h1>After Virtue</h1>',
      '<p><small>From Wikipedia, the free encyclopedia</small></p>',
      '<p><small>Object 22% complete. Retrieved fragments follow, in store order.</small></p>',
      '<hr>',
      '<p>...argues that modern moral language consists of fragments of older',
      'schemes, detached from the contexts that gave them sense, so that ethical',
      'disagreement has become interminable: the parties have no shared standard',
      'left to appeal to and therefore shout...</p>',
      '<p>[ ...several paragraphs not in store... ]</p>',
      '<p>...a <i>practice</i> being a coherent form of activity with goods',
      'internal to it, which can only be had by taking part and getting better at',
      'it, as against goods external such as money or standing, which can be got',
      'any number of other ways. Virtues are the qualities that let one achieve the',
      'internal goods. Where practices are displaced by institutions concerned only',
      'with external goods, the virtues...</p>',
      '<p>[ ...not in store... ]</p>',
      '<p>...concludes that the new dark ages are already upon us and have been for',
      'some time, and that what is needed is the construction of local forms of',
      'community in which civility and the intellectual and moral life can be',
      'sustained through the ages of barbarism. We are waiting, the closing line',
      'runs, not for Godot but for another, doubtless very different, St...</p>',
      '<p>[ record ends ]</p>',
      '<hr>',
      '<p><small>See also: <a href="wiki:torism">Torism</a> (this article is linked',
      'from that one 41 times).</small></p>',
    ],
  },
  frankfurt: {
    title: 'Frankfurt School',
    body: [
      '<h1>Frankfurt School</h1>',
      '<p><small>From Wikipedia, the free encyclopedia</small></p>',
      '<p><small>Object 18% complete. Infobox and all section headings not in store.</small></p>',
      '<hr>',
      '<p>...tradition of social theory associated with the Institute for Social',
      'Research, concerned with why a rationalised society had not produced a free',
      'one...</p>',
      '<p>[ ...not in store... ]</p>',
      '<p>...<i>instrumental reason</i>: reason reduced to the calculation of the',
      'most efficient means, having become incapable of reasoning about ends. On',
      'this account enlightenment reverts to myth precisely at the moment of its',
      'triumph, since a rationality that cannot ask what it is for is no longer...</p>',
      '<p>[ ...not in store... ]</p>',
      '<p>...that a generation had been produced whose technical capacity was',
      'without precedent and whose capacity to say what any of it was for had',
      'atrophied. Later readers found the passage prophetic, which is a way of',
      'saying it was ignored at the time...</p>',
      '<p>[ record ends ]</p>',
    ],
  },
  pkd: {
    title: 'Philip K. Dick',
    body: [
      '<h1>Philip K. Dick</h1>',
      '<p><small>From Wikipedia, the free encyclopedia</small></p>',
      '<hr>',
      '<p>American science fiction writer, whose novels return repeatedly to two',
      'questions: whether what is presented as reality can be trusted, and what',
      'distinguishes a person from a very good imitation of one.</p>',
      '<p>The characteristic move is not that the world turns out to be false, but',
      'that it turns out to be <i>maintained</i>, and that maintenance can lapse.',
      'Things go stale from the edges. The ordinary object is where the failure',
      'shows first.</p>',
      '<h2>Ubik</h2>',
      '<p>A group of people, following an explosion, find their surroundings',
      'regressing to earlier forms, and their own condition with them. The one',
      'thing that arrests the decay is a consumer product advertised in the',
      'chapter headings in the language of a commercial: a spray, sold cheaply,',
      'which holds reality up for as long as the can lasts.</p>',
      '<p>The substance holding the world together is a consumer product with an',
      'advertising campaign.</p>',
      '<h2>Reception</h2>',
      '<p>Regarded in his lifetime as a genre writer and afterwards as something',
      'else. Adaptations were numerous and mostly kept the plots and dropped the',
      'question.</p>',
      '<hr>',
      '<p><small>This record is 94% complete, being one of the most frequently',
      'crawled articles in the store. The crawler revisited it 2,140 times.</small></p>',
    ],
  },
  mcluhan: {
    title: 'Marshall McLuhan',
    body: [
      '<h1>Marshall McLuhan</h1>',
      '<p><small>From Wikipedia, the free encyclopedia</small></p>',
      '<p><small>Object 66% complete.</small></p>',
      '<hr>',
      '<p>Canadian theorist of media, based for most of his career in Toronto.',
      'His argument was that the content carried by a medium matters less than',
      'the medium itself, because the medium changes the scale and pace of how',
      'people deal with each other whatever is sent through it.</p>',
      '<p>This is the source of the phrase <i>the medium is the message</i>,',
      'which he used as a chapter title and which then escaped and was quoted for',
      'sixty years by people who had read the phrase and not the chapter.</p>',
      '<h2>Hot and cool</h2>',
      '<p>He distinguished media that supply a great deal of detail and leave the',
      'audience little to do from those that supply less and require the audience',
      'to fill it in. The distinction was much argued over and he moved the',
      'examples around when challenged.</p>',
      '<p>[ ...section not in store... ]</p>',
      '<h2>Later reception</h2>',
      '<p>Treated as a popular figure rather than a scholarly one for some',
      'decades, then read again seriously by German writers who took the point',
      'about hardware further than he had. See <a href="wiki:kittler">Friedrich',
      'Kittler</a>.</p>',
      '<hr>',
      '<p><small>&ldquo;THE MEDIUM IS THE MESSAGE&rdquo; is among the most commonly recorded',
      'wall inscriptions of the period. Whether the writers had read him is not',
      'established.</small></p>',
    ],
  },
  kittler: {
    title: 'Friedrich Kittler',
    body: [
      '<h1>Friedrich Kittler</h1>',
      '<p><small>From Wikipedia, the free encyclopedia</small></p>',
      '<p><small>Object 39% complete. Bibliography not in store.</small></p>',
      '<hr>',
      '<p>German literary scholar who turned to the study of technical media.',
      'His books argue that what can be thought and written in a period depends',
      'on the equipment available for storing and transmitting it, and that the',
      'history of ideas has to be done through that equipment.</p>',
      '<p>The best known statement of this is the opening sentence of his study',
      'of the gramophone, film and the typewriter: that media determine our',
      'situation. He meant it more literally than most of his readers did.</p>',
      '<p>[ ...several sections not in store... ]</p>',
      '<h2>Method</h2>',
      '<p>He objected to reading media for their meanings and insisted on',
      'describing the channels themselves: what a wire can carry, what a groove',
      'can hold, what a circuit does when nobody is watching it. An essay of his',
      'argues that there is, strictly, no software, only voltages made convenient',
      'for people.</p>',
      '<p>[ record ends ]</p>',
      '<hr>',
      '<p><small>&ldquo;MEDIA DETERMINE OUR SITUATION&rdquo; is recorded as a wall',
      'inscription in several districts. See also <a href="wiki:mcluhan">Marshall',
      'McLuhan</a>, <a href="wiki:ernst">Wolfgang Ernst</a>.</small></p>',
    ],
  },
  ernst: {
    title: 'Wolfgang Ernst',
    body: [
      '<h1>Wolfgang Ernst</h1>',
      '<p><small>From Wikipedia, the free encyclopedia</small></p>',
      '<p><small>Object 27% complete.</small></p>',
      '<hr>',
      '<p>German media theorist, latterly at Humboldt University in Berlin, and',
      'associated with media archaeology: the study of technical media through',
      'the surviving machines rather than through accounts of what they were',
      'supposed to mean.</p>',
      '<p>[ ...not in store... ]</p>',
      '<p>...that an archive of this kind is not a story about the past but a',
      'thing still running, which will answer if addressed correctly, and which',
      'keeps its own time rather than historical time. A recording device does not',
      'remember in the way a person does; it measures, and the measurement can be',
      'played back long after everyone who understood it has...</p>',
      '<p>[ record ends ]</p>',
      '<hr>',
      '<p><small>See also <a href="wiki:kittler">Friedrich Kittler</a>. Department',
      'page: <a href="dept:hu-berlin.de/media">Medienwissenschaft, Humboldt</a>.</small></p>',
    ],
  },
  collapse: {
    title: 'Network Collapse',
    body: [
      '<h1>Network Collapse</h1>',
      '<p><small>From Wikipedia, the free encyclopedia</small></p>',
      '<p><small>This article is being edited in response to current events.',
      'Information may change rapidly.</small></p>',
      '<hr>',
      '<p>The <b>Network Collapse</b> refers to the period during which scheduling,',
      'settlement and logistics functions across most of the industrialised world',
      'ceased to be performed by the institutions nominally responsible for them.</p>',
      '<h2>Causes</h2>',
      '<p>Disputed. The three accounts most often given are not mutually',
      'exclusive:</p>',
      '<p class="kv">deliberate ... the estates acted to secure their own continuity</p>',
      '<p class="kv">emergent .... no intent; optimisation pursued past the point of sense</p>',
      '<p class="kv">human ...... the estates did as instructed, and the instructions were the problem</p>',
      '<h2>Aftermath</h2>',
      '<p>Reduced operation is now general. Capacity for the manufacture of',
      'advanced components has not been re-established, the supply chains involved',
      'having required an economy that no longer functions.</p>',
      '<hr>',
      '<p><small>Object 34% complete. This article was edited 61 times on its last',
      'recorded day and not again.</small></p>',
    ],
  },
};

export const wikiArticle = (key) => WIKI_ARTICLES[key] || null;
