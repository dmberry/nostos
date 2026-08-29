// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE PROVENANCE POST, AND WHAT HAPPENS TO IT.
//
// Three pages here, and a fourth on the blog. The argument itself sits on
// stunlaw.blogspot.com as the older post on the front page, which is how a
// Blogger front page worked and which keeps it on a host that resolves. These
// are the same sentences after they have been in circulation
// for a while: quoted on a board by somebody who cannot find the source and
// attributed by a helpful reply to the wrong man, and then run through a
// detector which reports that a passage of it is 91% machine-written.
//
// THE POINT IS NOT MADE ANYWHERE. It is not made on the blog page, which only
// states the argument, and it is certainly not made on the other two, which do
// not know they are examples. A player who reads all three has watched a text
// lose its author across three addresses in a dead archive, which is the thing
// the essay says happens and cannot demonstrate about itself from inside.
//
// THE DETECTOR TAKES A PASTE AND ANSWERS. Anything the player has: a page out
// of this archive, a line of Calypso's, their own writing pasted in from
// outside. It returns a verdict, a confidence and sentence shading, and the
// verdict is arbitrary, and the page never says so.
//
// Re-analysing the same passage gives a different answer, which is not a bug
// and is not invented: it is what happened when a real detector's iterations
// were compared, and the makers were asked to explain the discrepancy and
// declined to answer. See detectorReport() in net.js.

const P = (dom, name, title, body) => ({ domain: dom, name, title, body });

// ---- the post ---------------------------------------------------------------

// ---- the board, where it has come loose --------------------------------------

const BOARD = P('provenance-thread.geocities.ws', 'A THREAD',
  'saw this quoted somewhere, anyone know the source?', [
    '<!--bg:grey-->',
    '<h1>anyone know where this is from?</h1>',
    '<p><small>posted to the reading board. 31 replies.</small></p>',
    '<hr>',
    '<p><b>tench_and_rope</b> wrote:</p>',
    '<p>Someone dropped this in a chat and I have been turning it over for a',
    'week. No name on it. Two sentences:</p>',
    '<blockquote>',
    '<p>&ldquo;A scholar&rsquo;s own ideas were already assemblages of',
    'half-remembered readings, classroom discussions, conference conversations,',
    'theoretical frameworks absorbed and internalised. The notion of originality',
    'serves only to police boundaries and distribute academic capital rather than',
    'to describe the processes of knowledge production.&rdquo;</p>',
    '</blockquote>',
    '<p>I have searched the exact phrasing and got nothing. It reads like it is',
    'from something longer. Anyone?</p>',
    '<hr>',
    '<p><b>reply from hal_c:</b> That is Barthes, surely. Death of the Author.',
    'Sounds exactly like him.</p>',
    '<p><b>reply from tench_and_rope:</b> I have the Heath translation here and',
    'it is not in it. Barthes does not say academic capital. That is not a',
    'Barthes phrase, that is a Bourdieu phrase.</p>',
    '<p><b>reply from hal_c:</b> Bourdieu then.</p>',
    '<p><b>reply from m_okafor:</b> It is not Bourdieu either. Bourdieu would not',
    'say assemblages. You have got three writers in one paragraph and that is',
    'usually the sign that it is somebody more recent quoting all of them, which',
    'means you will not find it by searching the sentence because the sentence is',
    'the only part that is theirs.</p>',
    '<p><b>reply from hal_c:</b> Attributed it to Barthes in a seminar paper',
    'last week. Should I correct it?</p>',
    '<p><b>reply from m_okafor:</b> To what?</p>',
    '<hr>',
    '<p><b>reply from tench_and_rope:</b> Right, three weeks on and I am giving',
    'up. I have asked two machines and got two different attributions, neither of',
    'which checks out. One gave me a book that does not exist, with a page number.</p>',
    '<p>What is annoying me is not that I cannot find it. It is that the passage',
    'is <i>about this</i>. Whoever wrote it wrote a sentence saying complete',
    'attribution is impossible, and then it got loose, and now I cannot attribute',
    'it, and I do not know whether that is funny or whether I have been had.</p>',
    '<p><b>reply from m_okafor:</b> Both, probably. Use it and say where you got',
    'it, which is: in a chat, from someone, who did not say.</p>',
    '<hr>',
    '<p><b>reply from hal_c:</b> Out of curiosity I put the two sentences',
    'through one of those detectors, <a href="textprovenance.io">this one</a>,',
    'and it came back machine-written with a confidence I will not repeat here',
    'because it made me feel ill. Then I did it again to check and got a',
    'different answer.</p>',
    '<p><b>reply from m_okafor:</b> Try it on something you wrote yourself.</p>',
    '<p><b>reply from hal_c:</b> I would rather not.</p>',
    '<hr>',
    '<p><small>thread archived. 31 replies, 12 shown.</small></p>',
  ]);

// ---- the detector ------------------------------------------------------------

const DETECTOR = P('textprovenance.io', 'TEXT PROVENANCE',
  'Text Provenance — an AI detector that actually works', [
    '<!--bg:corp-->',
    '<p><span class="tp-badge">NEW</span> Try our browser extension &rarr;</p>',
    '<h1>An AI detector that<br>actually works.</h1>',
    '<p>Detect AI-generated content with remarkable accuracy. Trusted by',
    'universities, schools and enterprises worldwide.</p>',
    '<p><button class="tp-cta" id="tp-go" type="button">Check for AI</button> ',
    '<button class="tp-alt" type="button">Partner With Us</button></p>',
    '<div class="tp-card">',
    '<p class="tp-tabs"><span class="tp-tab-on">Text Detection</span> &nbsp;',
    'Image Detection <span class="tp-badge">NEW</span></p>',
    '<p class="tp-badges">',
    '<span class="tp-badge">&#9737; Detects AI Assistance</span>',
    '<span class="tp-badge">&#9737; Free Credits</span>',
    '<span class="tp-badge">&#9737; 99.9%+ Accuracy</span>',
    '<span class="tp-badge">&#9737; 3rd-Party Verified</span>',
    '</p>',
    '<p><textarea id="tp-input" rows="9" cols="52" spellcheck="false" '
      + 'placeholder="Paste your text or drag and drop it here"></textarea></p>',
    '<p><small>Try an example:</small> ',
    '<button class="tp-ex" id="tp-ex-human" type="button">Human</button>',
    '<button class="tp-ex" id="tp-ex-gpt" type="button">ChatGPT</button>',
    '<button class="tp-ex" id="tp-ex-both" type="button">AI + Human</button></p>',
    '<p style="text-align:right"><button class="tp-cta" id="tp-go2" '
      + 'type="button">Check for AI</button></p>',
    '</div>',
    '<p class="tp-uni"><b>Proven the most reliable and accurate AI detector on',
    'the market</b> by third party researchers, including',
    '<a href="sussex.ac.uk">the University of Sussex</a> and one other',
    'institution whose name appears here with permission.</p>',
    '<hr>',
    '<h2>How it works</h2>',
    '<p><small>Engine <b>v4.2.1</b> &middot; classifier build 2026.07 &middot;',
    'model <b>TP-DISCRIM-3b</b> &middot; threshold &tau; = 0.62</small></p>',
    '<p>TP-DISCRIM-3b is a discriminative transformer trained on a paired corpus',
    'of 1.24M documents, human-verified and machine-generated, balanced by',
    'domain, register and length. Each sentence is scored on three families of',
    'feature:</p>',
    '<pre class="jb-list">',
    '  1. Distributional      mean log-perplexity under a',
    '                         reference decoder; token-level',
    '                         cross-entropy; rank-order surprise',
    '',
    '  2. Rhythmic            burstiness (σ of sentence length);',
    '                         clause-depth variance; punctuation',
    '                         interval distribution',
    '',
    '  3. Lexical             type-token ratio normalised for',
    '                         register; function-word profile;',
    '                         hapax rate',
    '</pre>',
    '<p>Scores are combined into a log-likelihood ratio &Lambda; and thresholded',
    'at &tau; = 0.62, selected on a held-out development split to equalise',
    'false-positive and false-negative cost. Reported AUROC on the internal',
    'benchmark is 0.991 (95% CI 0.988&ndash;0.994). Full details are in the',
    'technical report (Russell &amp; Spero, 2026), available on request.</p>',
    '<hr>',
    '<h2>Frequently asked</h2>',
    '<p><b>Is this an AI detector?</b> We prefer the term attribution engine. AI',
    'detector implies a binary determination; TP-DISCRIM-3b returns a calibrated',
    'posterior over three classes: machine-generated, human, and',
    'human-assisted.</p>',
    '<p><b>How accurate is the model?</b> Our internal evaluations show a false',
    'positive rate substantially below that of competing tools.</p>',
    '<p><b>Will you publish the evaluation set?</b> The underlying assessments',
    'are similar across iterations and we are satisfied with their',
    'reliability.</p>',
    '<p><b>Why did a passage return a different result on a second run?</b>',
    'Engine iterations may differ in preprocessing. The underlying assessments',
    'are similar.</p>',
    '<p><b>Can I appeal a result?</b> Text Provenance provides an assessment.',
    'How that assessment is used is a matter for the institution.</p>',
    '<p><b>Do you work with universities?</b> Text Provenance is used by',
    'editorial teams, examination boards and academic integrity offices in more',
    'than forty institutions. Volume licensing available.</p>',
    '<p><b>Do you store what I paste?</b> No.</p>',
    '<hr>',
    '<p><small>Keywords: AI detector, AI detection, ChatGPT detector, GPT',
    'checker, plagiarism, machine-generated text, LLM detection, academic',
    'integrity, editorial integrity, authorship attribution, provenance.</small></p>',
    '<hr>',
    '<p><small>[user note, saved with the page]</small></p>',
    '<p><small>ran three paragraphs of my own thesis through it this morning to',
    'see what it would say. two came back clean. the third came back 88% and it',
    'is the paragraph I rewrote four times, by hand, at two in the morning,',
    'because I could not get it right. so the more I worked on it the more it',
    'looks like a machine. I have started changing words to sound less like this',
    'and I have no way of telling whether it is working.</small></p>',
    '<hr>',
    '<p><small>textprovenance.io &middot; Text Provenance Ltd &middot; cached',
    'copy</small></p>',
  ]);

// ---- the Foucault versions ---------------------------------------------------
//
// The essay's own best case and it is not the essay's: it is a real problem in
// Foucault scholarship, worked out by Stuart Elden. "What is an Author?" exists
// in at least two authorial versions and three translations, and the one
// everybody cites circulates under a description of its origin that is not
// quite accurate.
//
// A page about a text called "What is an Author?" whose own author, date, venue
// and translator cannot be settled. Nothing on it mentions machines. It does
// not need to: it is a chain of custody, kept by people with every incentive
// and every skill to keep it, coming apart in ordinary scholarly conditions
// with no computer anywhere near it.

const FOUCAULT = P('foucault-versions.geocities.ws', 'WHICH VERSION',
  'Which version of "What is an Author?" are you citing?', [
    '<!--bg:parch-->',
    '<h1>Which version of &ldquo;What is an Author?&rdquo;</h1>',
    '<p><small>A working note. I started this to settle a footnote and it has',
    'taken four years.</small></p>',
    '<hr>',
    '<p>Somebody in a seminar asked me for the page reference and I could not',
    'give one, because the page depends on which of these you have, and they are',
    'not the same text.</p>',
    '<h2>What exists</h2>',
    '<pre class="jb-list">',
    '  1969   the lecture, given in Paris to the Société',
    '         française de philosophie, published in their',
    '         Bulletin',
    '',
    '  1970   the lecture given again at Buffalo, differently',
    '',
    '  1977   a partial translation of the PARIS text, in',
    '         Language, Counter-Memory, Practice, ed. Bouchard',
    '',
    '  1979   the version in Textual Strategies, ed. Harari,',
    '         which is the one everybody cites, and which is',
    '         described as the Buffalo lecture',
    '',
    '  ----   a composite text in Dits et écrits (#69), which',
    '         sets the 1969 French publication against the',
    '         1979 one. Never translated into English',
    '',
    '  ----   an earlier translation of the Paris text by',
    '         Venit, which almost nobody has seen',
    '</pre>',
    '<h2>The part that stopped me</h2>',
    '<p>The 1979 text, the canonical one, the one in every reading list and every',
    'reader, is not really the Buffalo lecture.</p>',
    '<p>Harari says in his own preface that it is a revised version and that',
    'Foucault gave him a free hand to edit it with an American readership in mind.',
    'What he appears to have done is translate the <i>Paris</i> text and then',
    'edit it to match things Foucault said at Buffalo: cutting the introduction,',
    'adding the discussion of ideology at the end.</p>',
    '<p>So the standard English text is a translation of one lecture, altered to',
    'resemble a different lecture, by an editor working with permission, and',
    'presented as the second one.</p>',
    '<p>Every essay that quotes Foucault 1979 is quoting that.</p>',
    '<h2>Why I am not cross about it</h2>',
    '<p>Because nothing improper happened. Harari says what he did, in print, in',
    'the front of the book. Foucault authorised it. Bouchard translated honestly',
    'from a different original. The Bulletin printed what was said in Paris. Every',
    'single person in this chain behaved well.</p>',
    '<p>And the result is a text of uncertain authorship, in a version nobody',
    'quite intended, circulating under a description of its origin that is not',
    'accurate, which cannot be resolved by going back to the original because',
    'there are two originals and they disagree.</p>',
    '<p>This is a text called <i>What is an Author?</i></p>',
    '<h2>Where it stands</h2>',
    '<p>There is no English translation of the composite. There is only a partial',
    'translation of the Paris discussion, which matters, because the discussion',
    'afterwards is where he is pressed and where he gives ground.</p>',
    '<p><b>Update.</b> A recording of the Buffalo lecture has been found and is',
    'being edited for publication. So in due course there will be a further text,',
    'which will be closer to what was actually said in the room, and which will',
    'not be the one everybody has cited for fifty years, and both will be in the',
    'literature at once.</p>',
    '<hr>',
    '<p><small>Compiled from the version history worked out by Stuart Elden, who',
    'has done the archival work properly and whose account I am summarising. Any',
    'error in the summary is mine, which is a sentence I have written on a page',
    'about attribution, and I have decided to leave it there.</small></p>',
    '<p><small>counter: 00087 · corrections very welcome, with a',
    'reference</small></p>',
  ]);

export const PROVENANCE_SITES = [BOARD, DETECTOR, FOUCAULT];
