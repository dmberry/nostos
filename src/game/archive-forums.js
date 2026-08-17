// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #143 — the cached web, part three: the argument, having itself in public.
//
// Split out of archive.js. Nothing here changed in the move.
//
// The economics cluster, lobste.rs at the end, slashdot having the free
// software argument out loud, r/TheSpiral, and the research post that named it.

import { pic } from './archive-pic.js';

export const FORUM_SITES = [
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
      '<p><small>This record is what the crawler kept. Where a page is short or a link here is dead, a library in San Francisco was collecting the same web at the same time and may hold more of it: <a href="archive.org">archive.org</a>.</small></p>',
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
      '<p><small>Two pages from the same years, from people who were there rather than theorising it: <a href="soundsystem.geocities.ws">the rig</a>, and <a href="levellers.fanpages.org.uk">the band the Act was written at</a>.</small></p>',
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
      '<p class="kv"><small>&#9650; back to <a href="reddit.com">the front page</a></small></p>',
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
      '<p class="kv"><small>&#9650; back to <a href="reddit.com">the front page</a></small></p>',
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
      '<p class="kv"><small>&#9650; back to <a href="reddit.com">the front page</a></small></p>',
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
      '<p class="kv"><small>&#9650; back to <a href="reddit.com">the front page</a></small></p>',
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
      '<p class="kv"><small>&#9650; back to <a href="reddit.com">the front page</a></small></p>',
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
      '<p class="kv"><small>&#9650; back to <a href="reddit.com">the front page</a></small></p>',
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
      '<p class="kv"><small>&#9650; back to <a href="reddit.com">the front page</a></small></p>',
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
      '<p class="kv"><small>&#9650; back to <a href="reddit.com">the front page</a></small></p>',
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
      '<p class="kv"><small>&#9650; back to <a href="reddit.com">the front page</a></small></p>',
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
      '<p class="kv"><small>&#9650; back to <a href="reddit.com">the front page</a></small></p>',
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
      '<p>It is also not a new one. The oldest version of the figure is the Greek ' +
        'key &mdash; the meander, named for a river that doubles back on itself and ' +
        'still reaches the sea &mdash; and it has been painted on walls for three ' +
        'thousand years by people who were not talking to anything. I mention it ' +
        'because a doctrine that arrives at the same shape as a border on a ' +
        'water jug has not necessarily arrived anywhere.</p>',
      '<p><i>Edit, later:</i> somebody has been spraying them. Not the tag, the ' +
        'key itself, two or three of them at a time, on retaining walls and the ' +
        'sides of substations. No signature. I have no idea whether that is a ' +
        'reader of this post or somebody who has never heard of any of it, and I ' +
        'have decided I prefer not knowing.</p>',
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
      '<p><small>This record is what the crawler kept. Where a page is short or a link here is dead, a library in San Francisco was collecting the same web at the same time and may hold more of it: <a href="archive.org">archive.org</a>.</small></p>',
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
      '<p><small>This record is what the crawler kept. Where a page is short or a link here is dead, a library in San Francisco was collecting the same web at the same time and may hold more of it: <a href="archive.org">archive.org</a>.</small></p>',
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
      '<p><small>Artist pages still in store: <a href="ward.fanpages.org.uk">WARD</a>. Label: <a href="locarecords.com">locarecords.com</a>.</small></p>',
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
      '<p><small>This record is what the crawler kept. Where a page is short or a link here is dead, a library in San Francisco was collecting the same web at the same time and may hold more of it: <a href="archive.org">archive.org</a>.</small></p>',
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
      '<p><small>This record is what the crawler kept. Where a page is short or a link here is dead, a library in San Francisco was collecting the same web at the same time and may hold more of it: <a href="archive.org">archive.org</a>.</small></p>',
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
      '<p><small>This record is what the crawler kept. Where a page is short or a link here is dead, a library in San Francisco was collecting the same web at the same time and may hold more of it: <a href="archive.org">archive.org</a>.</small></p>',
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
      '<p><small>This record is what the crawler kept. Where a page is short or a link here is dead, a library in San Francisco was collecting the same web at the same time and may hold more of it: <a href="archive.org">archive.org</a>.</small></p>',
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
      '<p><small>This record is what the crawler kept. Where a page is short or a link here is dead, a library in San Francisco was collecting the same web at the same time and may hold more of it: <a href="archive.org">archive.org</a>.</small></p>',
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
      '<p><small>This record is what the crawler kept. Where a page is short or a link here is dead, a library in San Francisco was collecting the same web at the same time and may hold more of it: <a href="archive.org">archive.org</a>.</small></p>',
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
