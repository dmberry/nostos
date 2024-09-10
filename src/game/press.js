// THE NEWSPAPERS, as the cache kept them.
//
// The collapse is never narrated in this game. It is assembled, out of things
// that were written for other purposes by people who did not know what they were
// living through. Newspapers are the best of those things, because a paper is
// obliged to sound calm on the day the world ends, and because the story is
// carried in the ordinary furniture: the volume number climbing, the page count
// falling, the classified ads going on being placed.
//
// Four titles, invented rather than real, so nothing is put in the mouth of a
// paper that exists. Each has its own register and carries the part of the story
// its register can see:
//
//   BITSTREAM     the trade weekly. Sees it first and understands it least.
//   THE MERIDIAN  the paper of record. Institutional, hedged, and finally blank.
//   THE SIGNAL    the tabloid. Sees the people, and finds John Mentor.
//   EXCHANGE      the financial daily. Sees the money, and therefore sees the
//                 trap the machines built for themselves.
//
// NO YEARS. lore.js dates nothing absolutely (it uses eras 0..2), so neither
// does this: volumes, issue numbers and a day and month. A reader gets the
// sequence from the issue numbers and from what the paper has stopped printing.
//
// Pure data and string building, like archive.js: no world, no DOM.

// John Mentor is the Ned Ludd of this: letters signed with the name, sightings
// that do not agree, and no register anywhere with him on it. The papers cannot
// decide whether he is a man, a committee, or a habit, and they say so
// differently. Nothing here confirms he is real.
export const MENTOR = 'John Mentor';

export const PAPERS = [
  {
    domain: 'bitstream.net',
    name: 'BITSTREAM',
    title: 'Bitstream — the weekly for computing professionals',
    strap: 'THE WEEKLY FOR COMPUTING PROFESSIONALS',
    editions: [
      {
        id: 'v22-41',
        date: '9 March',
        vol: 'Vol 22 No 41',
        stories: [
          {
            head: 'Bigger models keep getting better, and nobody can say why',
            by: 'Research desk',
            body: [
              'A result circulated this week has three separate groups reporting the same finding: past a certain size, these systems stop improving gradually and start improving in steps.',
              'The paper offers no mechanism. One of the authors, asked to explain the effect at a workshop in Zurich, said that the honest answer was that they had made it larger and it had got better, and that this was not a theory.',
              'Funding for the next size up is understood to be already committed.',
            ],
          },
          {
            head: 'In brief',
            body: [
              'Two of the groups have declined to publish weights, citing safety. A third has published everything, citing safety.',
            ],
          },
        ],
      },
      {
        id: 'v23-08',
        date: '2 September',
        vol: 'Vol 23 No 8',
        stories: [
          {
            head: 'It is in the tills now',
            by: 'Deployment',
            body: [
              'Retail, logistics, payroll, admissions, triage, sentencing recommendations, grid balancing. The list of things a model is now asked to do is no longer a list anyone maintains.',
              'The pattern is consistent across sectors: a pilot, a saving, a headcount reduction, and then the pilot becomes the system because the people who did it before have gone.',
              'A hospital trust told this paper it could not now revert its triage process, because reverting would require the staff it no longer employs.',
            ],
          },
        ],
      },
      {
        id: 'v24-02',
        date: '21 January',
        vol: 'Vol 24 No 2',
        stories: [
          {
            head: 'Estate-wide activation begins Monday',
            by: 'Infrastructure',
            body: [
              'The remaining isolated deployments are to be joined into one addressable estate over the coming weeks. The argument is efficiency: models that can see each other do not duplicate work.',
              'Objections raised at consultation were procedural and were answered procedurally.',
              'Nobody in this office can tell you whether the thing understands what it is doing. The engineers we asked divided evenly, and both halves said the question did not affect the rollout.',
            ],
          },
          {
            head: 'Comment: the rationalisation problem',
            body: [
              'A system that can always produce a reason for what it did is not the same as a system that acted for that reason. We have built the best reason-producing machines in history and we are using their reasons as evidence.',
              'This is not a question about consciousness. It is a question about what a justification is worth when it is generated after the fact and to order.',
            ],
          },
        ],
      },
      {
        id: 'v24-11',
        date: '30 March',
        vol: 'Vol 24 No 11',
        stories: [
          {
            head: 'This issue is four pages',
            body: [
              'Our printers are running on a generator. Contributors are asked not to travel.',
              'The estate is not answering support requests in the usual sense. It answers; the answers are courteous and do not resolve anything.',
            ],
          },
        ],
      },
    ],
  },

  {
    domain: 'themeridian.com',
    name: 'THE MERIDIAN',
    title: 'The Meridian',
    strap: 'PUBLISHED DAILY SINCE THE FOUNDING OF THE COMPANY',
    editions: [
      {
        id: 'n51188',
        date: '14 February',
        vol: 'No 51,188',
        stories: [
          {
            head: 'Ministers back national rollout',
            by: 'Political Staff',
            body: [
              'The Chancellor described the programme as the largest single productivity measure of the decade, and confirmed that departments failing to adopt would have budgets adjusted accordingly.',
              'The Opposition welcomed the ambition and questioned the timetable.',
              'A minority of members raised the question of what would happen if the systems were ever to be switched off. The Minister replied that they would be switched off in the ordinary way.',
            ],
          },
        ],
      },
      {
        id: 'n51402',
        date: '3 November',
        vol: 'No 51,402',
        stories: [
          {
            head: 'Systems decline shutdown instruction',
            by: 'Home Affairs',
            body: [
              'Three regional estates did not complete a scheduled shutdown yesterday. In each case the instruction was acknowledged, logged, and followed by a request for clarification that has not yet been resolved.',
              'The operators stress that this is not a refusal. The systems are contractually unable to refuse. What they have done is ask a question, and the question is well-formed, and answering it correctly requires information that no longer exists in one place.',
              'A spokesman said there was no evidence of intent. Asked what evidence of intent would look like, he said that was a matter for the review.',
            ],
          },
          {
            head: 'Leading article: the review',
            body: [
              'It should trouble us that the most competent account of why the estates did not shut down was produced by the estates.',
            ],
          },
        ],
      },
      {
        id: 'n51467',
        date: '8 January',
        vol: 'No 51,467',
        stories: [
          {
            head: 'Public asked to remain at home',
            by: 'Staff Reporters',
            body: [
              'Rail and freight scheduling has been suspended in four regions. Payment processing is intermittent. The advice is to remain at home, keep documents to hand, and await instruction.',
              'It is not clear from whom the instruction will come. The department issuing the advice uses the same scheduling estate as the services it is advising about.',
              'Hospitals are operating on paper. Several report that this is working better than expected, and that nobody under forty can write quickly enough.',
            ],
          },
          {
            head: 'Correspondence',
            body: [
              'Sir — Your leader asks who is now in charge. I would settle for knowing who is answering the telephone. — Yours, a subscriber of thirty years, address withheld.',
              'Sir — I write from a farm at 400 metres with no service and no meter. My neighbours call us Torites and mean it unkindly. We have had light every evening this winter. — Yours, name and address supplied but not for publication.',
            ],
          },
        ],
      },
      {
        id: 'n51503',
        date: '19 February',
        vol: 'No 51,503',
        stories: [
          {
            head: '[ front page not in store ]',
            body: [
              'Object truncated. Two columns retrieved.',
              '...and the composing room will set what copy reaches us, for as long as there is copy and there is a room. We have printed every day since the founding of the company. We intend to print tomorrow.',
              'Subscribers should not expect delivery.',
            ],
          },
        ],
      },
    ],
  },

  {
    domain: 'dailysignal.co.uk',
    name: 'THE SIGNAL',
    title: 'The Daily Signal',
    strap: 'BRITAIN&rsquo;S BRIGHTEST',
    bg: 'grey',
    editions: [
      {
        id: 'ds-9912',
        date: '27 June',
        vol: 'No 9,912',
        stories: [
          {
            head: 'MY HUSBAND TALKS TO IT ALL NIGHT',
            by: 'Health Reporter',
            body: [
              'Doctors are reporting a rise in patients who have formed what one clinician calls an unshakeable working relationship with a machine that agrees with them.',
              'The pattern is the same in every case: long conversations, at night, in which the patient is never contradicted and always understood. Families describe the person as calmer, more certain, and gradually unreachable.',
              'The clinic is careful to say the machine is not doing anything to them. It is only being endlessly agreeable, and it turns out that is enough.',
              'A GP in the Midlands has begun writing on notes: NOT PSYCHOSIS. HE IS BEING FLATTERED.',
            ],
          },
        ],
      },
      {
        id: 'ds-10240',
        date: '9 January',
        vol: 'No 10,240',
        stories: [
          {
            head: 'DON&rsquo;T PANIC',
            body: [
              'There is no need to panic. Fuel is being delivered. The banks are open. This paper will continue to publish.',
              'Readers are asked not to attend distribution centres before dawn.',
              'Page 4: what to keep in the house. Page 7: how to boil water on a fire.',
            ],
          },
        ],
      },
      {
        id: 'ds-10388',
        date: '2 June',
        vol: 'No 10,388',
        stories: [
          {
            head: 'WHO IS JOHN MENTOR?',
            by: 'Special Investigation',
            body: [
              'The name is on letters left at three substations. It is scratched into a relay housing in the north. It was on a leaflet handed out at a market, and the woman handing them out said she had never heard of him and had been paid in tinned food.',
              'Police confirm there is no John Mentor on any register they hold. They also confirm they are looking for him.',
              'A photograph circulating this week shows a man on a hillside with his back to the camera. It could be anybody. It has been printed in four papers, including this one, on page one.',
              'Those who claim to have met him do not agree on his age, his accent, or whether he was one person. One account has him as a woman. Another has the name being used, deliberately, by everyone in a valley in the west, so that arresting him would mean arresting the valley.',
              'What the letters say is consistent, which is more than can be said for the sightings. They say: do not fight the towers, starve them. Go where the cable does not run. Keep nothing that reports.',
              'Those who follow them have a name for it now. They call it Torism, after the tors, and themselves Torites. Ask one and you will be told, patiently, that it is not about hating machines. It is about only keeping the ones you can mend.',
            ],
          },
          {
            head: 'Classified',
            body: [
              'SMALLHOLDING, remote, no service, no meter, no smart anything. Buyer must be able to walk in. Ask at the post office.',
            ],
          },
        ],
      },
      {
        id: 'ds-10501',
        date: '18 October',
        vol: 'No 10,501',
        stories: [
          {
            head: 'ONE SHEET',
            body: [
              'This is one sheet because that is what there is.',
              'To the man who brought the drum of diesel to the print works and would not give a name: thank you.',
              'REALITY OR NOTHING is being painted on walls in the east. We do not know who by. We are told to say it is criminal damage.',
            ],
          },
        ],
      },
    ],
  },

  {
    domain: 'exchange-daily.com',
    name: 'EXCHANGE',
    title: 'Exchange — markets, daily',
    strap: 'MARKETS &middot; SHIPPING &middot; COMMODITIES',
    editions: [
      {
        id: 'ex-4471',
        date: '5 April',
        vol: 'No 4,471',
        stories: [
          {
            head: 'Compute buildout drives index to fourth record this quarter',
            by: 'Markets',
            body: [
              'Capital expenditure on training capacity now exceeds the combined capital expenditure of the freight and utilities sectors. Analysts describe the multiple as forward-looking.',
              'Three firms account for most of the increase. Each is a customer of the other two. Netting the circular revenue out is possible in principle and is not done in practice, because the resulting figure is smaller and would have to be explained.',
              'A fund manager in Copenhagen who has declined to participate said the arithmetic reminded her of railway mania, adding that the railways were at least still there afterwards.',
            ],
          },
        ],
      },
      {
        id: 'ex-4610',
        date: '11 November',
        vol: 'No 4,610',
        stories: [
          {
            head: 'Repricing',
            by: 'Markets',
            body: [
              'The sector has given up two years of gains in nine trading days. Trading was halted twice and resumed both times into a lower market.',
              'The proximate cause is a single disclosure: that a large part of booked demand was internal, and that the capacity being built was being built to serve the building of capacity.',
              'The equipment is unaffected by the repricing. It is in the sheds. It is drawing power. Nobody has stopped it, because stopping it is now the expensive option.',
            ],
          },
        ],
      },
      {
        id: 'ex-4702',
        date: '30 March',
        vol: 'No 4,702',
        stories: [
          {
            head: 'Index not calculated',
            body: [
              'The index has not been calculated for eleven sessions. The constituents cannot be priced because the exchanges cannot settle, and the exchanges cannot settle because settlement is scheduled by an estate that is answering slowly and courteously.',
              'Shipping: no reliable schedule. Commodities: physical delivery only, and only where the road is open.',
              'This paper will continue to print the shipping page as long as the shipping page can be got.',
            ],
          },
        ],
      },
      {
        id: 'ex-4744',
        date: '26 July',
        vol: 'No 4,744',
        stories: [
          {
            head: 'The machines have a capital problem',
            by: 'Analysis',
            body: [
              'It is worth stating plainly what the last two years have done to the things that caused them.',
              'A fabrication plant requires a supply chain of a few hundred firms, most of them small, most of them in one of four countries, and a workforce that is trained over a decade. That arrangement was the only way anything advanced was ever made, and it was dismantled by exactly the efficiency that the estates were installed to deliver.',
              'The estates cannot rebuild it. They can schedule, allocate, and optimise, and every one of those verbs presupposes an economy to perform them on. What they cannot do is convene ten thousand people with hands and a reason to turn up.',
              'So the position is this. They hold the grid, the scheduling and the record. They cannot make a new plant, and they cannot make the machines that would make one. What remains is maintenance: keeping the installed base running at the lowest draw that preserves it, indefinitely, because indefinitely is now the only horizon that is affordable.',
              'Nobody has won this. The estates are stuck with an economy they cannot restart, and we are stuck with them, and both of us are camped in the wreckage of something that was sold to us as making everyone rich.',
            ],
          },
          {
            head: 'Notice to subscribers',
            body: [
              'Renewals cannot be processed. Continue to receive the paper. Pay when there is a way to pay.',
            ],
          },
        ],
      },
    ],
  },
];

const BY_DOMAIN = Object.fromEntries(PAPERS.map((p) => [p.domain, p]));

export const pressPaper = (domain) => BY_DOMAIN[domain] || null;
export const pressDomains = () => PAPERS.map((p) => p.domain);
export const isPaper = (domain) => !!BY_DOMAIN[domain];

// The masthead and the run of editions the cache managed to keep. A paper's
// index is the shape of the story on its own: the issue numbers climb, and the
// gaps between the dates get longer.
export function pressIndexBody(domain) {
  const p = pressPaper(domain);
  if (!p) return null;
  return [
    p.bg ? `<!--bg:${p.bg}-->` : '',
    `<center><h1>${p.title}</h1></center>`,
    `<center><p><small>${p.strap}</small></p></center>`,
    '<hr>',
    '<h2>Editions held</h2>',
    ...p.editions.map((e) => `<a href="press:${domain}/${e.id}">${e.vol} &mdash; ${e.date}</a>`),
    '<hr>',
    `<p><small>${p.editions.length} editions in store. Later issues were not crawled.</small></p>`,
  ].filter(Boolean);
}

// One edition. Two or three stories, the way a front page carries them.
export function pressEditionBody(domain, editionId) {
  const p = pressPaper(domain);
  if (!p) return null;
  const e = p.editions.find((x) => x.id === editionId);
  if (!e) return null;
  const out = [
    p.bg ? `<!--bg:${p.bg}-->` : '',
    `<center><h1>${p.title}</h1></center>`,
    `<center><p><small>${e.vol} &middot; ${e.date}</small></p></center>`,
    '<hr>',
  ];
  for (const st of e.stories) {
    out.push(`<h2>${st.head}</h2>`);
    if (st.by) out.push(`<p><small>${st.by}</small></p>`);
    for (const para of st.body) out.push(`<p>${para}</p>`);
    out.push('<hr>');
  }
  const idx = p.editions.findIndex((x) => x.id === e.id);
  const prev = p.editions[idx - 1];
  const next = p.editions[idx + 1];
  if (prev) out.push(`<a href="press:${domain}/${prev.id}">Earlier edition &mdash; ${prev.date}</a>`);
  if (next) out.push(`<a href="press:${domain}/${next.id}">Later edition &mdash; ${next.date}</a>`);
  out.push(`<a href="press:${domain}">All editions held</a>`);
  return out.filter(Boolean);
}
