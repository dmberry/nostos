// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE PUBLIC SERVICE RING.
//
// One ring, small on purpose. It sits between the `tv` web, which is about
// programmes, and the `mt` web, which is about theory, and it is about neither:
// it is about who paid, who was allowed on, and what a public was taken to be.
// The sister links point at both neighbours so a reader falls into it sideways
// while looking for something else, which is how anyone ever found anything
// out here.

const ring = (domain, name, title, bg, blurb, members, sisters) => ({
  domain, name, title,
  body: [
    `<!--bg:${bg}-->`,
    `<h1>${title}</h1>`,
    '<p><small>a webring · a page joins by adding the strip · walked, not searched</small></p>',
    '<hr>',
    ...blurb,
    '<p><b>Member sites</b>:</p>',
    '<ul>',
    ...members.map(([d, t]) => `<li><a href="${d}">${t}</a></li>`),
    '</ul>',
    ...(sisters ? ['<p><small>sister rings: ' + sisters.map(([d, t]) => `<a href="${d}">${t}</a>`).join(' · ') + '</small></p>'] : []),
    '<hr>',
    '<p><small>« prev · random · next »</small></p>',
  ],
});

export const PSB_RINGS = [
  ring('public-service-ring.geocities.ws', 'PUBLIC SERVICE RING',
    'Public Service Ring', 'proto',
    ['<p>Broadcasting as an institution rather than as a schedule. Charters, '
      + 'licence fees, committee reports and the arguments about who a service '
      + 'reaching everybody is supposed to answer to. Started because the '
      + 'television rings are all about programmes and none of us could find '
      + 'anywhere to put a page about the Crawford Committee.</p>',
     '<p>Not nostalgia. Several of us think these institutions were '
      + 'paternalistic, and one of us will tell you so at length. The point is '
      + 'that they were argued over in public, on the record, by people who had '
      + 'to answer for the answer.</p>'],
    [['founding-of-the-bbc.geocities.ws', 'Founding of the BBC'],
     ['the-licence-fee.geocities.ws', 'The licence fee'],
     ['reith-and-after.geocities.ws', 'Reith, and after'],
     ['pbs-and-the-senate.geocities.ws', 'PBS and the Senate'],
     ['ceefax.geocities.ws', 'Ceefax'],
     ['the-domesday-disc.geocities.ws', 'The Domesday disc'],
     ['marconi.geocities.ws', 'Marconi'],
     ['computer-literacy-project.geocities.ws', 'The Computer Literacy Project']],
    [['television-ring.geocities.ws', 'the television ring'],
     ['mediatheory-ring.geocities.ws', 'media theory']]),
];
