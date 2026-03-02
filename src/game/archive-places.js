// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #143 — the cached web, part two: places, and the people who lived in them.
//
// Split out of archive.js. Nothing here changed in the move.
//
// Somebody's homepage, the two universities, Brighton at ground level, the road
// and the hills, the music and the newsletter, Oslo, and London — the room the
// wire came into.

import { pic } from './archive-pic.js';
import { POPLOG_TITLE, POPLOG_BODY } from './poplog.js';

export const PLACE_SITES = [
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

];
