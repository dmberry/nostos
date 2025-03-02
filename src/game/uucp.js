// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// STORE AND FORWARD: uucp, mail, and the reason the hilltops matter.
//
// The Torite doctrine says go where the cable does not run, and the obvious
// objection is that people who cannot be reached also cannot reach each other.
// UUCP is the answer the period actually had. You do not need a live link to
// send something; you need a link that will exist at some point. Mail is written
// now, queued on the disk, and carried later, by whatever happens to touch both
// ends. On this island that means the relays RON left on the summits: you write
// at the shore, walk up, and the queue drains.
//
// That is the whole mechanic, and it is why this is a system rather than a
// command. The laptop can compose and queue anywhere. It can only DELIVER
// standing next to a relay, which turns a hilltop from a place with a terminal
// on it into a post office.
//
// Pure: queue arithmetic and mailbox formatting, no world and no DOM. main.js
// supplies the one thing this module cannot know, which is whether there is a
// relay within reach.

// Where things sit on the disk, following the layout of the period.
export const SPOOL = ['usr', 'spool', 'uucp'];
export const MAILBOX = ['usr', 'spool', 'mail'];

// The machine's own name on the store-and-forward network. Bang paths are
// addressed relative to it: `tor!mentor` means "via tor, to mentor".
export const NODENAME = 'nostbook';

// Who can be addressed. A short list on purpose: this is a network of people
// somebody has actually met.
export const KNOWN_NODES = [
  { node: 'tor', desc: 'the relay chain. Anything for the hills goes through it.' },
  { node: 'ithaca', desc: 'a long way off, and the queue for it has never drained.' },
];

// The previous owner's mail, still in her box. Nobody deleted it because nobody
// came back to the machine after she left it.
export const OWNER_MAIL = [
  {
    from: 'j.marsh',
    to: 'e.marsh',
    subject: 'the boat',
    date: 'Tue 14:22',
    body: [
      'Took it round to the yard. The man there says the sail is past mending and',
      'he has no cloth, so it will have to be the oars or nothing.',
      '',
      'Do not wait for me if the road goes. Go up. You know where.',
    ].join('\n'),
  },
  {
    from: 'MAILER-DAEMON',
    to: 'e.marsh',
    subject: 'Returned mail: host unknown',
    date: 'Thu 03:01',
    body: [
      '   ----- Transcript of session follows -----',
      '550 <exchange-daily.com>: host unknown',
      '',
      '   ----- Unsent message follows -----',
      'Subject: cancel my subscription',
      '',
      'There is no one to read this. I know that. I am writing it anyway.',
    ].join('\n'),
  },
  {
    from: 'tor!unsigned',
    to: 'e.marsh',
    subject: '(no subject)',
    date: 'Sun 21:40',
    body: [
      'Relayed four times to reach you, so this is old.',
      '',
      'Keep the machine off the air unless you are using it. Bring it up, ask what',
      'you came to ask, put it down. They cannot hear a thing that is not talking.',
      '',
      'Burn this. Or do not, it is only paper, and paper has never told anyone',
      'anything it was not shown.',
    ].join('\n'),
  },
];

// ---- the queue -------------------------------------------------------------

// One queued job, stored as a file in the spool so it survives in the save the
// same way everything else on this disk does.
export function jobText(job) {
  return [
    `From ${NODENAME}`,
    `To ${job.to}`,
    `Subject ${job.subject || '(no subject)'}`,
    '',
    job.body || '',
  ].join('\n');
}

export function parseJob(text) {
  const lines = String(text || '').split('\n');
  const head = {};
  let i = 0;
  for (; i < lines.length && lines[i].trim() !== ''; i++) {
    const m = lines[i].match(/^(From|To|Subject)\s+(.*)$/);
    if (m) head[m[1].toLowerCase()] = m[2];
  }
  return { from: head.from || NODENAME, to: head.to || '', subject: head.subject || '', body: lines.slice(i + 1).join('\n') };
}

// A bang path: `tor!mentor` is "to mentor, by way of tor". A bare name is local.
export function routeOf(addr) {
  const parts = String(addr || '').split('!').filter(Boolean);
  if (parts.length < 2) return { via: null, user: parts[0] || '', local: true };
  return { via: parts[0], user: parts.slice(1).join('!'), local: false };
}

// What `uustat` prints: the queue, oldest first, with what it is waiting for.
export function statusReport(jobs, hasRelay) {
  if (!jobs.length) return 'uustat: queue empty';
  const lines = jobs.map((j, n) => {
    const r = routeOf(j.to);
    return `${String(n + 1).padStart(3)}  ${(r.via || 'local').padEnd(8)} ${j.to.padEnd(22)} ${j.subject || '(no subject)'}`;
  });
  return [
    `${jobs.length} job(s) queued.`,
    ...lines,
    '',
    hasRelay
      ? 'A relay is in range. Run uucico to hand the queue over.'
      : 'No relay in range. The queue waits. Carry the machine to a hilltop.',
  ].join('\n');
}

// Handing the queue over. Only local mail and anything routed via a relay can
// go; anything addressed to a host that has not answered in years stays put,
// which is its own small piece of the world's condition.
export function deliver(jobs) {
  const sent = [];
  const held = [];
  for (const j of jobs) {
    const r = routeOf(j.to);
    if (r.via === 'ithaca') held.push({ job: j, why: 'no route to ithaca. It has never answered.' });
    else sent.push(j);
  }
  return { sent, held };
}

// ---- mail ------------------------------------------------------------------

export function formatMailbox(msgs) {
  if (!msgs.length) return 'No mail.';
  const head = msgs.map((m, i) => `${String(i + 1).padStart(2)}  ${m.from.padEnd(16)} ${m.date.padEnd(10)} ${m.subject}`);
  return [`${msgs.length} message(s):`, ...head, '', 'Read one with:  mail <number>'].join('\n');
}

export function formatMessage(m, n) {
  return [
    `Message ${n}:`,
    `From: ${m.from}`,
    `To: ${m.to}`,
    `Subject: ${m.subject}`,
    `Date: ${m.date}`,
    '',
    m.body,
  ].join('\n');
}
