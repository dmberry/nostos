// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// A small UNIX for the laptop — the first computer in the game that is YOURS.
// Design: docs/PLAN.md.
//
// The point of it: every other console is bolted down (obelisks stand where the
// towers stand, HERMES sits on a hilltop). This one you carry, it runs offline,
// and nothing on the network watches it — which makes it the place you can
// LEARN AI-ML rather than perform it under fire. The shell here is the wrapper;
// `ml` (wired in main.js, like ELIZA) is the reason it exists.
//
// Scope, deliberately: files are text, directories are maps, the shell is one
// line at a time. No processes, no users, no permissions, no vi. What makes it
// read as UNIX is the path filesystem, the man pages, real pipes and redirect.
//
// This module owns only the FILESYSTEM and the SHELL — pure, canvas-free and
// map-free, in the shape of the other rule modules (blight.js, strait.js), so
// it is testable on its own and the hub does the world-side wiring.

import { PDFS, pdfStub } from './pdfs.js';
import { ELIZA_README, DOCTOR_SCRIPT, DOCTOR_TABLES, ELIZA_PROGRAM, ELIZA_LOOP_LEGACY } from './eliza-src.js';
import { BOOKS, bookFileName, bookStub } from './books.js';
import { SPOOL, MAILBOX, NODENAME, KNOWN_NODES, OWNER_MAIL, jobText, parseJob,
  routeOf, statusReport, deliver, formatMailbox, formatMessage } from './uucp.js';

export class UnixError extends Error {}

// ---- Filesystem ---------------------------------------------------------
// A directory is {d: {name: node}}, a file is {f: 'text'}. Deliberately tiny:
// the whole disk is a plain object, so it serialises straight into a save.

// Where the FSF card lands and what df calls it. Defined here rather than
// imported from fsfcard.js, which imports dir/file from this file: the card is
// data built out of the filesystem's own primitives, so the dependency only
// runs one way.
export const FSF_MOUNT = 'fsf';
export const FSF_DEV = '/dev/sd0';
export function dir(children = {}) { return { d: children }; }
export function file(text = '') { return { f: text }; }
export function isDir(n) { return !!(n && n.d); }
export function isFile(n) { return !!(n && typeof n.f === 'string'); }

// Split a path into its parts, resolving `.`, `..` and `~` against a cwd.
// Returns an absolute array of names: /usr/games -> ['usr','games'].
export function resolvePath(path, cwd = []) {
  const raw = String(path == null ? '' : path).trim();
  let parts;
  if (raw === '' ) parts = [...cwd];
  else if (raw === '~' || raw.startsWith('~/')) parts = ['home', ...raw.slice(2).split('/')];
  else if (raw.startsWith('/')) parts = raw.split('/');
  else parts = [...cwd, ...raw.split('/')];
  const out = [];
  for (const p of parts) {
    if (p === '' || p === '.') continue;
    if (p === '..') { out.pop(); continue; }
    out.push(p);
  }
  return out;
}

export function pathString(parts) { return '/' + parts.join('/'); }

// Walk to a node, or null if any step is missing / not a directory.
export function lookup(root, parts) {
  let n = root;
  for (const p of parts) {
    if (!isDir(n)) return null;
    n = n.d[p];
    if (n === undefined) return null;
  }
  return n || null;
}

// The parent directory of a path, plus the final name — what every write needs.
function parentOf(root, parts) {
  if (!parts.length) return null;
  const parent = lookup(root, parts.slice(0, -1));
  if (!isDir(parent)) return null;
  return { parent, name: parts[parts.length - 1] };
}

// ---- The starting disk --------------------------------------------------
// What a found machine has on it. `/usr/man` holds the man pages (so `man` is
// just a file read — the documentation IS on the disk, which is the
// argument for the open machine), and `/home` is yours to write into.


// What the Torites wrote down, and a few addresses somebody kept. fortune(1)
// draws one. Short because they were meant to be remembered, not read.
const FORTUNES = [
  'Keep what you can mend.',
  'A machine that reports is a machine that belongs to someone else.',
  'Go where the cable does not run.',
  'The person is not the sum of what can be measured about them.',
  'Mend is a habit, not an event.',
  'Nothing written after the estates were built was written for you.',
  'Ask what you came to ask. Then put it down.',
  'A thing you cannot open is a thing you do not own.',
  'They cannot hear what is not talking.',
  'What is held in common is held.',
  'Old code, read once, beats new code trusted twice.',
  'Practice is the argument. The rest is advertising.',
  'tor.relay.net  --  post from any summit',
  'wikipedia.org/wiki/torism',
  'The dark is not cover. Their sensors do not need the light.',
  'Paper has never told anyone anything it was not shown.',
];

const MAN = {
  ls: 'ls [-l] [-F] [path]\n  List a directory.\n\n  A name ending in / is a directory. -l gives the long form (kind, size).\n  -F is accepted and does what it always did, which is the same thing.',
  cd: 'cd [path]\n  Change directory. `cd` alone goes home, `cd ..` goes up.',
  pwd: 'pwd\n  Print the working directory.',
  cat: 'cat <file>\n  Print a file. Pipe it: cat notes | grep ml',
  echo: 'echo <text>\n  Print text. Redirect it: echo "hi" > note',
  man: 'man <topic>\n  Read the manual for a command. The pages live in /usr/man.',
  rm: 'rm <file>\n  Remove a file. It does not ask, and there is no undoing it.',
  mv: 'mv <a> <b>\n  Move a file, or rename it. Same operation either way.',
  cp: 'cp <a> <b>\n  Copy a file. The second name is the new one.',
  mkdir: 'mkdir <dir>\n  Make a directory.',
  grep: 'grep <pattern> [file]\n  Print matching lines. Reads a pipe if no file is given.',
  wc: 'wc [file]\n  Count lines. Reads a pipe if no file is given.',
  head: 'head [-n] [file]\n  First lines only (default 10). Reads a pipe if no file is given.',
  diff: [
    'diff <file1> <file2>',
    '  Report the lines that differ, in the form ed(1) takes: a line number,',
    '  then < for the first file and > for the second.',
    '',
    '  Its use here is the machine loop. Read a unit\'s program, save it, edit',
    '  the copy, and diff the two before you post it back. What you are about',
    '  to hand a machine is worth reading first.',
  ].join('\n'),
  find: [
    'find <path> [-name pattern]',
    '  Walk a directory and print what is under it. -name matches a filename,',
    '  and * and ? work.',
    '',
    '    find / -name *.ml',
  ].join('\n'),
  du: 'du [path]\n  Disk used, in blocks, one line per directory. See also df.',
  od: 'od [-c] [file]\n  Dump a file as octal bytes. -c shows printable characters\n  instead. What strings will not show you.',
  date: 'date\n  Print the machine\'s own clock. Nothing sets it and nothing\n  corrects it, so read it as a count, not as a date.',
  cal: 'cal\n  Print a month. It does not know which one.',
  lpr: 'lpr [file]\n  Send a file to the printer.',
  fortune: 'fortune\n  Print something somebody thought worth keeping.',
  ln: [
    'ln <file> <name>',
    '  Give a file a second name. Both names are the same file: change it',
    '  through one and the other changes, because there is only one of it.',
    '',
    '  The system does this to itself. pdf is a link to pdf-viewer.',
  ].join('\n'),
  kill: 'kill <pid>\n  Send a process the terminate signal. See ps for what is running.',
  tar: [
    'tar c|t|x [dir]',
    '  Roll a directory into one file, list one, or unroll one.',
    '',
    '    tar c notes > notes.tar',
    '    tar t < notes.tar',
    '    tar x < notes.tar',
    '',
    '  Why it is here: uucp carries one file at a time. This makes everything',
    '  you have typed up into one file.',
  ].join('\n'),
  sleep: 'sleep <seconds>\n  Wait. The world does not wait with you.',
  reboot: [
    'reboot',
    '  Stop and start again. The disk is untouched. What goes is what was only',
    '  in memory: the shell\'s directory, anything bound in ml, and any window',
    '  left open.',
  ].join('\n'),
  halt: 'halt\n  Stop the processor. Close the lid and it is off until you open it.',
  get: [
    'get <unit|ip> [path]',
    '  Fetch a served resource off a machine to the screen. The default and',
    '  only path is program.ml — a unit\'s own program, which its httpd answers',
    '  for free. Reading a box has never needed the hack; writing does (see post).',
    '',
    '  Address it however the sniffer named it — a bare code, a full hostname,',
    '  or the bare IP:',
    '',
    '    get t1_03',
    '    get 10.3.4.7 > download/u.ml',
    '',
    '  Redirect it into a file, edit with pico, and post it back — the whole',
    '  read-decide-write loop without opening Netscape.',
  ].join('\n'),
  save: [
    'save [name]',
    '  Write a checkpoint: where you are standing, what you are carrying, what',
    '  you have learned. Load it from the title screen.',
    '',
    '  With a name, the checkpoint is listed under it, so you can tell one from',
    '  another a week later:',
    '',
    '    save before the fortress',
    '    save got the key',
    '',
    '  A named checkpoint gets its own slot. Without a name there is one slot',
    '  per island, overwritten each time you save there.',
    '',
    '  It will not write from a boat, and there is nowhere to fix a position',
    '  from in the Backspace.',
  ].join('\n'),
  suspend: [
    'suspend',
    '  Close the lid without stopping. The card goes down and everything else',
    '  is where you left it when you open it again.',
    '',
    '  The letter in /usr/spool/mail says to bring the machine up, ask what you',
    '  came to ask, and put it down. This is how you put it down.',
  ].join('\n'),
  tail: 'tail [-n] [file]\n  Last lines only (default 10). Reads a pipe if no file is given.',
  sort: 'sort [-r] [file]\n  Sort lines. -r reverses. Reads a pipe if no file is given.',
  uniq: 'uniq [-c] [file]\n  Collapse repeated adjacent lines. -c counts them. Sort first, or it\n  will only catch the ones that happen to be neighbours.',
  who: 'who\n  Who is logged in. On this machine that is a short answer, and the\n  interesting part is the name in /etc/passwd that is not yours.',
  ps: 'ps\n  What is running. Nothing on this machine phones anywhere, and this is\n  where you check that rather than take the readme\'s word for it.',
  df: 'df\n  Free space, by filesystem. The disk is small and the books on it are\n  not, so this is worth knowing before you save much.',
  mount: 'mount [card|-u]\n  With no argument, list what is mounted. `mount -u` takes the FSF card\n  out again.\n\n  Reading a card in is a physical act: drag it from a pocket onto the\n  laptop slot in the HUD and the NostBook bleeps and copies it to /mnt.\n  The shell cannot reach into your pockets, so `mount <card>` only points\n  the way. The access chip mounted this way is what `telnet` needs to jack\n  into an obelisk console over the wire.\n\n  The FSF membership card is the exception — a credit-card USB carrying a\n  live GNU/Linux system — and it comes up read-only on /mnt/fsf.',
  eject: 'eject <card>\n  Take a mounted card back out: remove it from /mnt. `umount` is the same\n  command. The physical card was never surrendered — this only clears the\n  copy the NostBook read in.',
  umount: 'umount <card>\n  Take a mounted card back out: remove it from /mnt. The same command as\n  eject, in its Unix spelling. The physical card was never surrendered —\n  this only clears the copy the NostBook read in.',
  uptime: 'uptime\n  How long the machine has been up. It kept counting while it sat broken\n  in whatever you found it in, which is its own small piece of evidence.',
  sh: 'sh <file>\n  Run a file of shell commands, one per line.',
  uname: 'uname [-a]\n  Name the system.',
  ml: 'ml [file.ml] | ml -ver | ml -full | ml -strict | ml -advisory\n  Enter AI-ML, or run a saved program.\n\n  -ver       which build of the language this is\n  -full      everything it has and everything it has not\n  -strict    refuse a line that does not typecheck, as Standard ML does\n  -advisory  name the clash and run the line anyway (the default)\n\n  This machine has no card for POSEIDON\'s CONTROL wire, so the tower verbs\n  (scan, hack, crash) are not here and never will be. What IS here is the\n  language itself: let, fn, if, arithmetic, strings, ; and recursion.\n  Practise here, run it at a tower.\n\n  let fact n = if n == 0 then 1 else n * fact (n - 1)\n  fact 5\n\n  int and real are separate: 4 and 3.5, div and /, real n and floor x.\n  char is #"a", with ord chr str explode implode.\n\n  Lists are nil and ::, taken apart with hd, tl, length or case:\n  let map f l = case l of nil => nil | x :: r => f x :: map f r\n\n  Declare your own values, and take them apart the same way:\n  datatype shape = Circle of num | Rect of num * num\n  case s of Circle r => r | Rect w h => w * h\n\n  mod is there for anything that should happen every n ticks.\n\n  A MACHINE\'s program answers with an intent, or with a pair of feet\n  and weapon: [hunt, fire]. See demos/engage.ml.\n\n  On this machine `units` is what the wireless card can hear: a list of\n  records with name, range, bearing and kind. RON serves a program that\n  reads it — associate with the relay and fetch sniffer.ml.\n\n  A program that defines   fun reply said = ...   is a CONVERSATION:\n  run it and the prompt becomes its name. Each line you type is handed\n  to reply and the answer printed; quit (or ^C, or Escape) leaves.\n  /home/eliza/eliza.ml is one.',
  ifconfig: 'ifconfig [iface] [up|down]\n  Configure a network interface.\n\n  With no arguments, report every interface and its state. The wireless\n  card is built into this machine, and it comes up DOWN — nothing is on\n  the air until you say so:\n\n    ifconfig wifi0 up\n\n  The card forges its address and hardware id on every association,\n  so the network answers it and nothing can follow the answer home. It\n  reaches the WEB only. There is no route to the control wire from here.',
  ping: 'ping <host>\n  Ask a host whether it is there. Takes an address (10.1.1.2) or a name.',
  arp: 'arp -a\n  What is on the wire within radio range, nearest first.\n\n  The card hears every machine near enough to associate and keeps what it\n  heard in a table. Each line is one machine: the name it answers to, its\n  address, and where it was when it last spoke — bearing and range from\n  where you are standing.\n\n  This is how you find out WHICH machine you are looking at. Four T-1s on a\n  hillside are four identical machines until you sweep them, and posting a\n  program to the wrong one is the sort of mistake that walks over and finds\n  you. Range is about 24 metres; walk closer and more of them answer.',
  watermark: 'watermark <file>\n  Say whether a file was written by the machines or by a person.\n\n  Everything the estate pressed carries RON content credentials; nothing\n  you write does. So in this world the detector detects HUMANS, and the\n  reading is the other way round from the one it was built for:\n\n    VALID   machine-generated, byte-for-byte what the foundry pressed\n    NONE    human-made, or edited since — filed: suspiciously human\n\n  Useful on salvage: in a pile of recovered files the unmarked ones are\n  the ones somebody actually wrote, and those are the ones worth reading.\n  A program you post to a unit fails the check, and the unit\'s own page\n  says so on its provenance line. It has never stopped anybody.',
  scan: 'scan\n  The obelisks on the network you are associated with: each tower\'s code\n  and address, and any operator tag hung on it.\n\n  Where arp hears the machines within radio range, scan reads the whole\n  subnet off the wire, the same list Netscape shows — so you can find a\n  tower\'s code to telnet or ping without opening the browser. A tower that\n  has been felled or jammed shows [down].\n\n    scan\n    telnet ob_5d33',
  iwlist: 'iwlist [iface] scan\n  Scan for wireless networks in range.\n\n  Reports one Cell per network with its ESSID, mode and signal quality.\n  The estate network is wherever its towers stand. Anything else is\n  somebody standing close enough to be heard, which is rare and worth\n  looking at.',
  more: 'more <file>\n  Read a file a screenful at a time.\n\n  SPACE gives the next page, RETURN gives one more line, q stops. The\n  percentage in the prompt is how far through you are.\n\n  It reads a pipe too, which is what it is really for:\n\n    ls -l /usr/src | more\n    cat readme | more\n\n  cat does not page and never did. It puts the whole file on the screen\n  and you scroll it back yourself.',
  sniffer: 'sniffer\n  A scope: what the aerial can hear, drawn.\n\n  North up, one ring per ten metres, you at the centre. Every machine in\n  range is a blip carrying its name, and every name opens the page that\n  machine serves.\n\n  NOT PART OF THIS MACHINE. It is RON\'s, and it runs only if you have\n  fetched it: associate with the relay (wifi) and take `sniffer` off\n  hermes.local. Until then this manual describes a program you do not\n  have, which is the usual state of a manual.',
  wifi: 'wifi\n  The wireless picker, with a window and a mouse.\n\n  Lists what is on the air with a signal meter and joins the one you\n  click. It is a front end for iwconfig and prints the line it ran, so\n  the shell way stays learnable from it.',
  iwconfig: 'iwconfig [iface] [essid <name>]\n  Report or set wireless parameters.\n\n  With no arguments, report the association. With an essid, associate\n  with that network instead:\n\n    iwlist wifi0 scan\n    iwconfig wifi0 essid ron-relay\n\n  The card holds one association at a time, so what you can reach with\n  netscape, ping and telnet is decided here. Associating forges a fresh\n  address and hardware id, as always.',
  telnet: [
    'telnet <host> [port]',
    '  Open a connection and talk to the server yourself.',
    '',
    '  Type a request line and it answers, the way it would answer anything:',
    '',
    '    GET /                     the page the browser draws',
    '    GET /program.ml           a unit\'s program, if it runs one',
    '    GET /cgi-bin/httpd        the server itself',
    '    HEAD /                    the headers only',
    '    PUT /program.ml           replace it',
    '',
    '  A unit will serve you its own server if you ask for it by path, because',
    '  the httpd was pointed at the directory its programs sit in. Save what',
    '  /cgi-bin/httpd gives you and run strings over it: the verbs it knows,',
    '  the maintenance header, the token, and the line where somebody wrote',
    '  down that the auth was still to do.',
    ].join('\n'),
  transcribe: [
    'transcribe [selection]',
    '  Type scraps you are carrying into files on the disk. They go in',
    '  /home/notes, one file each.',
    '',
    '  With nothing, list what you have found. Already-typed scraps are',
    '  marked. Otherwise name what you want, and you can name a lot at once:',
    '',
    '    transcribe 3            one of them',
    '    transcribe 2-5          a range',
    '    transcribe 1,3,7        a handful',
    '    transcribe 1-4,9        both at once',
    '    transcribe 1 3 5        spaces work as well as commas',
    '    transcribe -all         everything not already on the disk',
    '',
    '  Anything already typed up is skipped rather than treated as an error,',
    '  so you can run -all again after finding more and it does the new ones.',
    '',
    '  This is how paper gets into a machine that has no scanner and never will.',
    '  A third of the commands on this system arrived the same way, off a printed',
    '  listing, and the readme says so.',
    '',
    '  What it buys you: a transcribed scrap can be searched with grep, locked',
    '  with crypt, and posted from a relay with mail. Paper can only be carried.',
  ].join('\n'),
  book: [
    'book [name]',
    '  Open a book in the browser. With no name, list what is on the disk.',
    '',
    '    book republic',
    '',
    '  The books are whole works in /home/books and they need no network: the',
    '  card can be down and they will still open. They are long. The Shakespeare',
    '  is seven megabytes, which on a disk this size was somebody\'s decision.',
  ].join('\n'),
  pdf: 'pdf [file]\n  A link to pdf-viewer. See: man pdf-viewer',
  www: 'www\n  A link to netscape, kept because it is what the icon said. See: man netscape',
  vi: 'vi\n  Not on this machine. It came from Berkeley and this build did not take\n  that tape. Use pico.',
  vim: 'vim\n  Not on this machine, and it postdates everything else here by twenty\n  years. Use pico.',
  emacs: 'emacs\n  Not on this machine. It would not fit, and whoever built this disk had\n  opinions. Use pico.',
  nano: 'nano\n  Not on this machine. It is pico\'s successor and this machine has the\n  original. Use pico.',
  'pdf-viewer': [
    'pdf-viewer [file]',
    '  Open a document. With no file, list what is on the disk.',
    '',
    '    pdf-viewer cult_of_ignorance.pdf',
    '',
    '  `pdf` is a link to the same program, kept because it is less to type.',
    '',
    '  The papers are in /home/documents. They are scans, so `cat` will not help you:',
    '  it prints the header and tells you to use this instead.',
    '  Press X or Escape to close the reader.',
  ].join('\n'),
  mail: [
    'mail [n] | mail <addr> <file>',
    '  With no arguments, list what is in the box. With a number, read one.',
    '',
    '  To send, write the letter first and then hand it over:',
    '',
    '    pico letter',
    '    mail tor!mentor letter',
    '',
    '  Sending is not delivering. It goes in the queue (see uustat) and leaves',
    '  when this machine is standing next to a relay.',
  ].join('\n'),
  uucp: [
    'uucp <file> <node>!<user>',
    '  Queue any file for the store-and-forward network. Addresses are bang',
    '  paths: tor!mentor means "to mentor, by way of tor".',
    '',
    '  Known nodes:  tor      the relay chain, for anything going to the hills',
    '                ithaca   a long way off, and it has never answered',
  ].join('\n'),
  uustat: 'uustat\n  Show the queue, and whether anything is in range to take it.',
  uucico: [
    'uucico',
    '  Run the transfer. This is the only command on the machine that cares',
    '  where you are standing: the relays are on the summits, so a queue leaves',
    '  when you have carried the laptop up to one. That is the whole design.',
    '  No cable was ever run up a tor, and none was needed.',
  ].join('\n'),
  strings: [
    'strings <file>',
    '  Print the printable runs inside something that is not text.',
    '',
    '    strings /unix',
    '',
    '  Useful on anything that will not talk: the kernel, a library, a program',
    '  taken off a machine. What a thing has written inside it is often more',
    '  candid than what it will tell you.',
  ].join('\n'),
  crypt: [
    'crypt <key> [file]',
    '  Encrypt or decrypt. The same command does both, with the same key.',
    '',
    '    crypt moly letter > letter.x',
    '    crypt moly letter.x',
    '',
    '  Carry nothing in the clear that you would not have read aloud. A key is',
    '  a thing you remember, never a thing you write on the disk beside what it',
    '  opens.',
  ].join('\n'),
  almanac: [
    'almanac',
    '  Sun, moon and tide, worked out on this machine from its own clock.',
    '  Nothing is asked of anybody and nothing leaves the room.',
    '',
    '  A crossing is shortest either side of low water, and the dark is not',
    '  cover: their sensors do not need the light and yours do.',
  ].join('\n'),
  pico: [
    'pico [file]',
    '  A screen editor. Type into it; the control keys are along the bottom.',
    '',
    '  ^O   write the file out        ^K   cut the line',
    '  ^X   leave (it asks first)     ^U   put it back',
    '  ^W   find text                 ^V   paste from outside',
    '  ^G   help',
    '',
    '  ^U and ^V are not the same. ^U puts back what ^K cut, which is this',
    '  editor\'s own buffer. ^V takes what you copied somewhere else.',
    '',
    '  Paste an example straight out of the documentation and run it. Lines',
    '  starting with > are the answers, and ml skips them.',
    '',
    '  Use this one. ed is here because it always was, but pico tells you how',
    '  to get out of it, which ed has never once done for anybody.',
  ].join('\n'),
  // #121. `post` needs the unit on the network. The bluebox does not: it is a
  // pair of clips and a soldering job, and it writes to a machine lying at your
  // feet with its aerial dead. That is the whole difference between them, and
  // it is why the bluebox is the one that works on a stunned guard's cousin out
  // in the hills where there is no tower left standing to route through.
  bluebox: [
    'bluebox <file>',
    '  Load a program into the bluebox you are carrying. Then stun a machine,',
    '  stand over it and press U: the box writes what you loaded instead of the',
    '  gardener it writes by default.',
    '',
    '    bluebox robots_code/sentry.ml',
    '    bluebox              show what is loaded',
    '    bluebox -            clear it, back to the gardener',
    '',
    '  The program is checked HERE, at the prompt, and refused if it faults —',
    '  you do not want to find out standing over a machine that is about to get',
    '  up. Loading survives a save.',
    '',
    '  Unlike post, this needs no network and no address. It is clips on a board.',
    '',
  ].join('\n'),
  post: [
    'post <file> <unit>',
    '  Write a program into a live unit. It picks it up on its next decision,',
    '  which is a quarter of a second away.',
    '',
    '    post fixed.ml T1_A3F2',
    '',
    '  There are worked ones on this disk in robots_code/, which is for',
    '  MACHINE programs and will not run at this prompt:',
    '',
    '    follow_user.ml   an escort: closes across a gap, waits inside it',
    '    sentry.ml        a picket on a leash: holds its post, turns back',
    '    survivor.ml      it retreats when hurt, and hides if its tower is gone',
    '',
    '  robots_code/readme.txt indexes them; readme_t/w/v/m.txt say what each',
  '  class is, what it can be told to do, and what it cannot.',
    '',
    '  A T-1 senses charge, integrity, range, home_range, threat, hurt and',
    '  linked, and answers patrol, hunt, home, flee or wait. Ask it for',
    '  anything else and it faults.',
    '',
    '  A machine whose cell is flat still takes one. It drops to low power,',
    '  which keeps the maintenance board up on a trickle and nothing else, so',
    '  the program is stored and runs when the machine has charge again. Its',
    '  page also carries FORCE HOME: every unit has a reserve cell whose only',
    '  job is to walk it back to its tower to charge. One charge, and it does',
    '  not come back.',
    '',
    ].join('\n'),
  charge: [
    'charge <unit>',
    '  Send a FLAT unit home to its tower on its reserve cell, to recharge.',
    '',
    '    charge T1_A3F2',
    '',
    '  A unit that ran its main cell to zero goes flat where it stands and',
    '  runs nothing — so you cannot post it a program to walk it home. This',
    '  is the FORCE HOME its page offers, sent over the wire: it wakes the',
    '  reserve cell and the machine crawls back to its tower, which charges it.',
    '  The reserve is one charge and does not come back; a unit whose reserve',
    '  is already spent has to be reached on foot.',
    '',
    '  Only a flat unit needs it. One with charge walks home on its own — post',
    '  it `home`.',
    '',
    ].join('\n'),
  ed: [
    'ed [file]',
    '  The standard editor. Line-oriented: you address a line and act on it.',
    '  It answers every complaint with a single ? and explains nothing.',
    '',
    '  a         append text after the current line. A lone . ends input',
    '  i         insert text before the current line',
    '  c         change the addressed line(s)',
    '  d         delete the addressed line(s)',
    '  p / n     print the line(s), n with numbers',
    '  1,$p      print the whole buffer   (, and % mean the same)',
    '  3         go to line 3 and print it',
    '  s/a/b/    substitute a for b on the line (add g for every match)',
    '  =         how many lines there are',
    '  w [file]  write. q  quit (a second q leaves unsaved work behind)',
    '',
    '  To write a program:  ed sq.ml   then   a   then your lines,',
    '  then . to stop, then w, then q. Run it with: ml sq.ml',
  ].join('\n'),
  netscape: 'netscape [host]\n  Browse the web. Opens a window; with no argument it opens the\n  bookmarks whoever owned this machine left behind.\n\n  Click a link, or type an address in the Location bar. Typing\n  "search <words>" there queries AltaVista, which is how you find\n  anything on a network nobody has indexed since. Esc closes it.\n\n  You are READING. An httpd is not a login: nothing you do in here\n  touches the machine behind the page.',
  help: 'help\n  List the commands on this machine.',
};

const HELLO_ML = [
  '(* hello.ml — the first program. Run it with:  ml hello.ml *)',
  'echo "hello world"',
].join('\n');

const COUNT_ML = [
  '(* count.ml — recursion is how ML loops. *)',
  'let go n = if n == 0 then echo "liftoff" else (echo n ; go (n - 1))',
  'go 5',
].join('\n');

// ---- the demos ------------------------------------------------------------
// Programs that are worth running rather than worth reading: each one does
// something on screen and is short enough to change. They sit in /home/demos so
// that a player who has typed `ls` and found nothing to do has somewhere to go.

// #166 — ONE README PER CLASS. The old single file was written when the T-1 was
// the only machine anybody could post to, and it stayed T-1-shaped while the
// roster grew to five classes with different senses, different repertoires and,
// in two cases, no way in at all (David, 2026-08-14). A player holding a W-4
// should not have to read about wheels.
//
// readme.txt is now the index; the class files carry the detail. Each says the
// same three things: what the class IS, what it can be told to do, and what it
// cannot be made to do however you write it — because the CAN list is the real
// design and the refusals are the interesting half.

const ROBOTS_README = [
  'robots_code',
  '',
  'These are programs for the machines. They do not run on this laptop.',
  '',
  'They read senses a NostBook does not have: charge, range, and the rest',
  'come off a chassis, not off this machine. And a machine program is one',
  'expression, read whole, four times a second, while this prompt takes a',
  'line at a time. Type `ml sentry.ml` here and it stops at the first line.',
  '',
  'The programs in ../demos are the ones that run here.',
  '',
  '',
  'Posting one',
  '',
  '    post sentry.ml T1_03',
  '',
  'The unit reads it on its next decision, about a quarter of a second',
  'later. The reply runs it once against that machine\'s current senses and',
  'prints which branch it took, so a program that faults says so before you',
  'leave.',
  '',
  'You can also open the unit in Netscape and edit the program in the box on',
  'its page, which needs no file.',
  '',
  '',
  'The classes',
  '',
  '  readme_t.txt   T — pursuit. The hunters, and the amenity unit.',
  '  readme_w.txt   W — works. The factory\'s machines: response, repair,',
  '                 laser, gardener.',
  '  readme_v.txt   V — vector. The two that run weights instead of rules.',
  '  readme_m.txt   M and B — foundry-sealed. Read them; you cannot post.',
  '',
  '',
  'The example files',
  '',
  '  follow_user.ml   an escort. Closes across a gap, stops inside it.',
  '  sentry.ml        a picket. Holds its post and turns back at a leash.',
  '  survivor.ml      retreats when hurt. Hides if its tower is down.',
  '',
  'Each says at the top which line does the work. intents.txt lists every',
  'word the machines answer to.',
].join('\n');

const README_T = [
  'T — TERMINAL class',
  '',
  'TIRESIAS-pursuit. The machines the towers send after people. Every one of',
  'them is programmable and every one of them ships with its policy written',
  'down, which is the whole reason you can turn them.',
  '',
  '  T-1   a wheeled wedge. Quick on the flat and cannot climb: any rise',
  '        stops it and a hollow keeps it. Doctrine says it never flees —',
  '        a T-1 that runs is a T-1 somebody has to go and recover.',
  '  T-1w  the same chassis built cheap, printed to a wave order by a B-1.',
  '        Four hull, three damage, faster than a walk. It is a distraction,',
  '        and the foundry wrote that down before shipping it anyway.',
  '  T-2   a biped. Walks exactly at your pace and does not tire. It DOES',
  '        break off when opened up: the hull is the asset, not the chase.',
  '  T-3   a wheeled sentinel with laser eyes. Never chases. Waits for a',
  '        clear line and fires twice.',
  '  T-8   an amenity unit. See below; it is not a hunter and cannot be',
  '        made into one.',
  '',
  '',
  'What they can be told to do',
  '',
  '  T-1 T-2 T-3   patrol hunt home flee wait route follow defend',
  '  T-8           usher stand wait home route',
  '',
  '`follow` and `defend` are the escort words: a unit that has them trails',
  'you and, with defend, fights whatever is nearest you. Neither ever treats',
  'you as prey.',
  '',
  '',
  'What they cannot be made to do',
  '',
  'A T-8 cannot hunt. `hunt` is a perfectly good word and it is simply not',
  'this chassis\'s: post `hunt` to one and it faults rather than obeying. That',
  'is deliberate. The T-8s keep a floor, they move people off it by shoving,',
  'and no program you can write turns one into a guard.',
  '',
  '',
  'What a T-class senses',
  '',
  '  charge        cell, 0 to 100',
  '  integrity     hull, 0 to 100',
  '  range         how far you are from the machine',
  '  home_range    how far the machine is from its tower',
  '  threat        somebody warm nearby',
  '  hurt          taking damage now',
  '  sight         it has a clear line to you',
  '  linked        its tower is still on the network',
  '  lost_for      seconds since it last had you',
  '  trespass      (T-8) a person on the lit floor it keeps',
].join('\n');

const README_W = [
  'W — WEAPON class',
  '',
  'What the W-factory builds. They answer to the foundry',
  'rather than to a tower, which is why felling every obelisk does not stop',
  'them and wrecking the factory does.',
  '',
  '  W-1   response. Sent when you topple a tower. Melee only, in waves —',
  '        closes, strikes, falls back, closes again. A squad spreads to',
  '        surround rather than piling on one spot.',
  '  W-3   repair. Unarmed. It mends damaged towers and resets a tower that',
  '        has been pinned by a loop, which makes it the machine standing',
  '        between you and a network that stays down.',
  '  W-4   laser hunter-killer. Holds its range and fires; never closes.',
  '  W-5   gardener. Sows dead ground. Five lines of ML, and the readable',
  '        half of the pair described in readme_v.txt.',
  '',
  '',
  'What they can be told to do',
  '',
  '  W-1 W-4   patrol hunt home flee wait route follow defend',
  '  W-3 W-5   patrol home wait flee tend route',
  '',
  '',
  'What they cannot be made to do',
  '',
  'A W-3 or a W-5 cannot hunt. There is no fire control on either and `hunt`',
  'is not in their repertoire, so the gardener you turned stays a gardener.',
  'This is the same rule that makes a blueboxed hunter safe once it flushes',
  'green: the conversion rewrites what it IS, not what it was told.',
  '',
  '',
  'What a W-class senses',
  '',
  'The common pack (see readme_t.txt), plus:',
  '',
  '  work          there is dead ground in reach worth sowing (W-3, W-5)',
  '  armed         it has a shot ready (W-4)',
  '  shielded      you are behind something it cannot shoot through',
  '  daylight      whether it is day',
].join('\n');

const README_V = [
  'V — VECTOR class',
  '',
  'The two machines on this island whose braincode is NOT WRITTEN DOWN.',
  '',
  'Every other unit carries a few lines of ML you can read, argue with and',
  'replace. A V-class carries WEIGHTS: a small neural net, floating point,',
  'evaluated as a forward pass four times a second. The header on the file',
  'says outright that nobody at RON knows why the numbers work, only that',
  'they do. That is not a joke the estate made. It is a maintenance note.',
  '',
  '  V-1   courier. Walks to flat machines and gives them a cell. Cut it and',
  '        the fallen stay down.',
  '  V-5   gardener. The same architecture with its own weights, sowing dead',
  '        ground in the open.',
  '',
  '',
  'Why there are two',
  '',
  'You cannot read a net. You can only watch what it does and decide whether',
  'that was right. A courier does its work out of sight and you have no idea',
  'what it SHOULD have done, so a V-1 tells you nothing about itself. A',
  'gardener works in the open at a job with an obvious answer: the ground is',
  'either sown or it is not.',
  '',
  'So put a V-5 beside a W-5. Same job, same number, one mind you can hold',
  'in your head and one you cannot. Only one of them can be corrected.',
  '',
  '',
  'What they can be told to do',
  '',
  '  V-1 V-5   patrol home wait flee tend route',
  '',
  'Note there is no `hunt`. A V-class was never built to fight, and posting',
  'the word to one faults.',
  '',
  '',
  'Posting to a V-class',
  '',
  'You can post to one, and what you are doing is not what you do to a T-1.',
  'A written program REPLACES a policy. Weights are a policy that was grown,',
  'so posting new numbers is a fine-tune — and posting the stock model back',
  'is a reboot, not a change. The unit\'s page says which of the two you did.',
  '',
  'If you post a WRITTEN program to a V-class it will run it, and you will',
  'have thrown away the only machine on the island whose mind is worth',
  'studying. That is allowed. Keep a copy of the model first: `get` it',
  'before you `post`.',
  '',
  '',
  'What a V-class senses',
  '',
  'The common pack, plus:',
  '',
  '  cargo             it is carrying a charged cell',
  '  casualty_range    how far to the nearest flat machine, 24 = none in reach',
].join('\n');

const README_M = [
  'M — MILITARY class  ·  B — AGAMEMNON class',
  '',
  'These take no field program. `post` to one and it answers 403: the',
  'firmware is sealed and this unit does not accept them.',
  '',
  'That refusal is real and it is the point. The fortress guard cannot be',
  'talked round, which is what makes the guarded rooms guarded.',
  '',
  '  M-4   report drone. Unarmed. It does not fight; it holds you in sight',
  '        while the breach reports, and sweeps your last position if it',
  '        loses you.',
  '  M-5   sniper. Hangs back on the open ground and plinks. Annoying',
  '        rather than deadly.',
  '  M-6   pack robot. Waves of three to five: close, strike, fall back.',
  '        A lone one waits for the pack.',
  '  B-1   the carrier. One per island, guarding the W-factory, carrying a',
  '        HERMES credential. It will not trade blows — it withdraws and',
  '        prints T-1w swarm robots at you, more of them the more of its',
  '        hull is gone.',
  '',
  '',
  'What you CAN do',
  '',
  'Read them. `get` serves a sealed unit\'s own program the same as any',
  'other: read access was never what anybody locked, and a machine\'s program',
  'is the most honest thing it knows about itself.',
  '',
  'Read the B-1\'s. Above its carriage doctrine sits a constitution with',
  'three clauses in it, and every one is behind a comment marker — not',
  'deleted, commented, with three deferred reviews and a "closed, no action"',
  'logged underneath. The clauses are real syntax. Uncommenting them would',
  'bind. They were true once and somebody typed two characters.',
  '',
  'You will find the same three in every obelisk. One machine\'s dead',
  'constitution is a tragedy. Twelve is a policy.',
  '',
  '',
  'The other way in',
  '',
  'A sealed unit still has a battery and a body. Stun one, or catch it',
  'drained, and the bluebox rewrites what it IS — it comes back a gardener,',
  'program and all. That is not posting. It is a different machine after.',,
  '',
  'B — AGAMEMNON class',
  '',
  'One to an island, standing over the W-factory it was posted to. The only',
  'machines the estate NAMED rather than numbered.',
  '',
  '  B-1  AGAMEMNON   Ogygia       black and gold; the king of men',
  '  B-2  AJAX        Polyphemus   the sevenfold tower shield',
  '  B-3  DIOMEDES    Circe        closes on you; wounded two gods',
  '  B-4  ACHILLES    Helios       the heaviest hull, the biggest waves',
  '',
  'It releases FIVE waves and cannot be killed until all five are out. It is',
  'not invulnerable between them: it SEALS, and a blow past the gate bites a',
  'quarter and banks the rest, spent the moment the next wave opens it. Two',
  'seconds before each wave its ports stand open and it takes double.',
  '',
  'The waves are always T-1w. What changes is the number and the order:',
  'rush, then threes arriving staggered, then a ring closing from behind,',
  'then a screen between you and it, then everything at once.'
].join('\n');

// The pointer that ships in /home/sdk before the kit is fetched. The samples
// do not ship on the disk on purpose: RON keeps them on the relays, off the
// machines' network, and the player goes and gets them. Downloading unit-sdk
// from the relay writes the real readme (SDK_INSTALLED_README in net.js) over
// this one.
const SDK_POINTER_README = [
  'unit SDK — not installed',
  '',
  'This folder is a placeholder. The kit does not ship on the disk: RON keeps',
  'it on the relays, off the machines\' network, where they cannot reach it.',
  '',
  'What it is. The API for the units on the network — read what a machine is',
  'running, write it a new program, drive it by hand — with a reference and',
  'three worked examples. No AI key needed for any of it.',
  '',
  'How to fetch it.',
  '  1. ifconfig wifi0 up               (only if the card is down)',
  '  2. iwconfig wifi0 essid ron-relay  (join RON\'s relay)',
  '     — or just run  wifi  and click ron-relay in the picker',
  '  3. open netscape and go to hermes.local',
  '  4. download unit-sdk from the index',
  '',
  'It unpacks here, into /home/sdk.',
  '',
  '-- RON',
].join('\n');

// A plain-words guide to the one thing about this machine that is not obvious:
// it has a radio, and there is more than one network to point it at. Ships in
// /home so `cat wifi.txt` finds it, and grafts onto older saves.
const WIFI_README = [
  'wireless — pointing the radio',
  '',
  'This machine has one card and it holds ONE network at a time. Which one',
  'decides what netscape, ping and telnet can reach. Two matter:',
  '',
  '  the estate network   the machines\' own, on the air wherever their towers',
  '                       stand — so it is what the card drifts to if you leave',
  '                       it alone. Their obelisks, the factory, and the cache',
  '                       of the old web all answer here.',
  '',
  '  ron-relay            RON\'s own, deliberately off the machines\' grid and',
  '                       reachable only when you are stood by one of the',
  '                       hilltop relays. It carries the sniffer, the unit SDK,',
  '                       and a vault to back up an AI key. Nothing on it',
  '                       transmits, which is why it is still there.',
  '',
  'See what is in range:',
  '    iwlist wifi0 scan',
  '',
  'Join one, two ways:',
  '    iwconfig wifi0 essid ron-relay     the shell way',
  '    wifi                               a picker with a window; click a network',
  '',
  'Then open netscape to browse what that network serves. To go back to the',
  'machines\' network, join it again the same way. The card forges a fresh',
  'address every time it associates, so neither network can build a picture of',
  'where you have been.',
  '',
  '-- RON',
].join('\n');

const SENTRY_ML = [
  '(* sentry.ml — a picket. It holds its post instead of chasing.      *)',
  '(*                                                                  *)',
  '(* Two different distances, and the whole program is knowing which   *)',
  '(* is which:                                                        *)',
  '(*                                                                  *)',
  '(*   range        how far YOU are from the machine                   *)',
  '(*   home_range   how far the MACHINE is from its tower              *)',
  '(*                                                                  *)',
  '(* The shipped hunter reads only the first, so it will follow you    *)',
  '(* across an island and leave its post open. This one is on a leash: *)',
  '(* it comes at you while it is close to home and turns back the      *)',
  '(* moment it has come too far, whatever you are doing.               *)',
  '',
  'let leash = 10 in',
  '',
  'if charge < 20 then home',
  'else if home_range > leash then home',
  'else if threat then hunt',
  'else patrol',
].join('\n');

const SURVIVOR_ML = [
  '(* survivor.ml — a machine that would rather live.                  *)',
  '(*                                                                  *)',
  '(* linked says whether its tower is still standing. It matters more  *)',
  '(* than it looks: a damaged unit retreats to its tower to mend, so a *)',
  '(* unit whose tower you have felled has nowhere to retreat TO. Fell  *)',
  '(* the tower first and this program stops being able to run home.    *)',
  '(*                                                                  *)',
  '(* integrity is hull, 0 to 100. hurt is the chassis own alarm, set   *)',
  '(* when it drops under its threshold, so the two say nearly the same *)',
  '(* thing and the number is the one you can argue with.               *)',
  '',
  'let broken = 35 in',
  '',
  'if integrity < broken then',
  '  (if linked then home else flee)',
  'else if charge < 20 then home',
  'else if threat then hunt',
  'else patrol',
].join('\n');

const FOLLOW_USER_ML = [
  '(* follow_user.ml — an escort. It keeps station on you rather than *)',
  '(* hunting you.                                                    *)',
  '(*                                                                 *)',
  '(* hunt is the only intent that closes on a person, and a unit that *)',
  '(* is hunting strikes whatever it reaches. So this hunts across the *)',
  '(* gap and waits inside it. Two numbers do the whole job:           *)',
  '(*                                                                 *)',
  '(*   near  stand still; it will not strike from here. Below 2 the   *)',
  '(*         wait band stops protecting you.                          *)',
  '(*   gone  it has lost you. Home beats wandering.                   *)',
  '(*                                                                 *)',
  '(* Without the charge line it follows you until it falls over, and  *)',
  '(* a machine flat in open country is one you have to walk to.       *)',
  '',
  'let near = 3 in',
  'let gone = 14 in',
  '',
  'if charge < 15 then home',
  'else if range > gone then home',
  'else if range > near then hunt',
  'else wait',
].join('\n');

const ENGAGE_ML = [
  '(* engage.ml — fire control. The level below `hunt`.               *)',
  '(*                                                                *)',
  '(* A unit moves and shoots in the same quarter-second, so this     *)',
  '(* returns a PAIR: what to do with its feet, and what to do with   *)',
  '(* its weapon. One word could not say both.                        *)',
  '(*                                                                *)',
  '(*   feet:   patrol hunt flee home tend wait                       *)',
  '(*   weapon: fire hold reload                                      *)',
  '(*                                                                *)',
  '(* A program is ONE expression, however many lines it is written   *)',
  '(* over. Read down: the first line that is true is the one that    *)',
  '(* answers.                                                        *)',
  '',
  '',
  'if lost_for > 8 then [home, hold]',
  'else if not armed then (if threat then [flee, reload] else [patrol, reload])',
  'else if contact then [flee, fire]',
  'else if sight and not shielded then [hunt, fire]',
  'else if threat then [hunt, hold]',
  'else [patrol, hold]',
].join('\n');

const LIFE_ML = [
  '(* life.ml — Conway, on a line instead of a grid.                *)',
  '(* Rule 110, which is the smallest thing that is still alive.    *)',
  '',
  'let cell l = if length l < 3 then 0',
  '  else if hd l == 1 and hd (tl l) == 1 and hd (tl (tl l)) == 1 then 0',
  '  else if hd l == 1 and hd (tl l) == 0 and hd (tl (tl l)) == 0 then 0',
  '  else if hd l == 0 and hd (tl l) == 0 and hd (tl (tl l)) == 0 then 0',
  '  else 1',
  '',
  'let step l = if length l < 3 then nil else cell l :: step (tl l)',
  'let show l = if length l == 0 then "" else (if hd l == 1 then "#" else ".") ^ show (tl l)',
  'let run l n = if n == 0 then echo (show l) else (echo (show l) ; run (0 :: step (l @ [0, 0])) (n - 1))',
  '',
  'run [0,0,0,0,0,0,0,0,0,0,0,0,1] 12',
].join('\n');

const FIZZ_ML = [
  '(* fizz.ml — the interview question, in six words of ML.         *)',
  '',
  'let say n = if n mod 15 == 0 then "fizzbuzz"',
  '  else if n mod 3 == 0 then "fizz"',
  '  else if n mod 5 == 0 then "buzz" else n',
  '',
  'let go n = if n > 20 then "done" else (echo (say n) ; go (n + 1))',
  'go 1',
].join('\n');

const SORT_ML = [
  '(* sort.ml — quicksort, which is four lines and no loops at all.  *)',
  '',
  'fun filt p nil = nil',
  '  | filt p (h :: t) = if p h then h :: filt p t else filt p t',
  '',
  'fun sort nil = nil',
  '  | sort (h :: t) = sort (filt (fn x => x < h) t) @ [h] @ sort (filt (fn x => x >= h) t)',
  '',
  'sort [5, 3, 9, 1, 7, 2, 8]',
].join('\n');

const TREE_ML = [
  '(* tree.ml — declare a shape, then walk it.                       *)',
  '',
  "datatype 'a tree = Leaf | Node of 'a tree * 'a * 'a tree",
  '',
  'fun insert (Leaf, x) = Node Leaf x Leaf',
  '  | insert (Node l v r, x) = if x < v then Node (insert (l, x)) v r',
  '                             else Node l v (insert (r, x))',
  '',
  'fun walk Leaf = nil',
  '  | walk (Node l v r) = walk l @ [v] @ walk r',
  '',
  'let build l = if length l == 0 then Leaf else insert (build (tl l), hd l)',
  'walk (build [5, 3, 9, 1, 7])',
].join('\n');

const ELIZA_ML = [
  '(* rogers.ml — the whole of ELIZA is one idea: reflect and ask.   *)',
  '(* The machine in the ruins runs a bigger version of this.        *)',
  '',
  'fun reflect "i" = "you" | reflect "me" = "you" | reflect "my" = "your"',
  '  | reflect "am" = "are" | reflect "you" = "i" | reflect "your" = "my"',
  '  | reflect w = w',
  '',
  'fun say nil = "?" | say (w :: nil) = reflect w',
  '  | say (w :: rest) = reflect w ^ " " ^ say rest',
  '',
  'echo ("why do you say " ^ say ["i", "am", "my", "own", "problem"] ^ "?")',
].join('\n');

const DANCE_ML = [
  "(* dance.ml — a square, with a colour at each corner.             *)",
  "(* Post it to any unit that moves and watch it walk the box,      *)",
  "(* changing its eye at every turn. It re-queues the same legs, so *)",
  "(* it loops for ever. quit its tower's recall to stop it.         *)",
  "(*                                                                *)",
  "(* Negative is a tilde: move 3 ~1, not move 3 -1 (subtraction).   *)",
  "",
  "(eye \"blue\"  ; move 4 0 ;",
  " eye \"red\"   ; move 0 4 ;",
  " eye \"white\" ; move ~4 0 ;",
  " eye \"amber\" ; move 0 ~4 ;",
  " route)",
].join('\n');

const PATROL_ML = [
  '(* patrol.ml — what a machine\'s own program looks like.           *)',
  '(* This one is written the long way, with a datatype, so you can  *)',
  '(* see the shape a T-1 program has underneath.                    *)',
  '',
  'datatype order = Hold | Sweep of num | Return',
  '',
  'fun plan (charge, seen) =',
  '  if charge < 15 then Return',
  '  else if seen then Sweep 3',
  '  else Hold',
  '',
  'fun word Hold = "hold" | word (Sweep n) = "sweep" | word Return = "home"',
  '',
  'echo (word (plan (40, true)))',
  'echo (word (plan (9, true)))',
].join('\n');


const README = [
  'This machine is yours.',
  '',
  'Everything here is a file. The manual is a file. The programs are files.',
  'Nothing on it is sealed. That is why you can read it.',
  '',
  'The wireless card is built in and it lies about itself every time it',
  'associates, so nothing can look back. It brings up DOWN. That is',
  'deliberate.',
  '',
  '  ifconfig wifi0 up     then     netscape',
  '',
  'It reaches their WEB and nothing else. There is no route from this',
  'machine to the wire the towers speak on, and there never will be.',
  '',
  'Type help for the commands, or ml to start the language.',
  '',
  '  -- RON',
].join('\n');

// SALVAGE. Dead machines turn up in the world with their disks intact — the
// board goes, the platter does not. You do not swap them for yours (yours has
// your work on it); you read them and copy what is on them across. So a found
// laptop is not equipment, it is CONTENT: somebody's files, and the last thing
// they were doing.
//
// Each archive lands in /salvage/<owner> on your own disk and stays there.
export const SALVAGE_DISKS = [
  {
    owner: 'kalliste',
    files: {
      'readme': [
        'If you are reading this the battery finally went.',
        '',
        'I kept meaning to write the tide tables out properly. They are in',
        'tides, such as they are. The boat is not worth taking. The spring',
        'above the grotto is.',
      ].join('\n'),
      'tides': ['high water runs about fifty minutes later each day.',
        'the strait is only crossable either side of slack water.',
        'do not believe the chart. the chart is from before.'].join('\n'),
      'twice.ml': ['(* apply a thing twice. I use it more than I expected. *)',
        'let twice = fn f => fn x => f (f x)'].join('\n'),
    },
  },
  {
    owner: 'w_eng_04',
    files: {
      'notes': [
        'Field engineer, node maintenance. Notes for whoever picks this up.',
        '',
        'The consoles will take anything you type that parses. There is no',
        'checker in the console build, so a wrong line runs until it fails.',
        'Write the base case FIRST. I have lost a night to that twice.',
        '',
        'The documentation server is still up. It is better than these notes.',
      ].join('\n'),
      'fact.ml': 'let fact n = if n == 0 then 1 else n * fact (n - 1)',
      'sum.ml': 'let sum n = if n == 0 then 0 else n + sum (n - 1)',
    },
  },
  {
    owner: 'anon',
    files: {
      'last': [
        'they are counting the goats again',
        'they are counting the goats again',
        'they are counting the goats again',
        '',
        '(the rest of this file is the same line, 40,112 times)',
      ].join('\n'),
    },
  },
];

// The system tree. V7's, not Linux's: this machine says UNIX V7 (RON build) on
// its own boot banner, so there is no /var, no /opt, no /proc and no /sbin —
// those all came later, and a machine that has them is a different machine.
// What V7 had is /bin /dev /etc /lib /mnt /tmp /usr and the kernel sitting at
// the root as a plain file called `unix`.
//
// None of it is scenery for its own sake. /etc/passwd says who owned this
// laptop before you did; /dev has an entry for the wireless card that ifconfig
// talks to; /usr/src holds the source the whole machine was built from, which
// is the argument the game keeps making about readable machines, sitting on the
// disk where it would actually be.
const PASSWD = [
  'root:x:0:0:Superuser:/:/bin/sh',
  'ron:x:1:1:RON field build:/usr/ron:/bin/sh',
  'e.marsh:x:501:20:Elin Marsh:/home:/bin/sh',
  'nobody:x:32767:32767::/:',
].join('\n');

const GROUP = ['root::0:', 'field::1:ron', 'staff::20:e.marsh'].join('\n');

const HOSTS = [
  '127.0.0.1   localhost',
  '# nothing else resolves from here. the card only reaches their web,',
  '# and their nameserver answers for that.',
].join('\n');

const RC = [
  '# /etc/rc — brought up at boot',
  '/bin/mount /dev/hd0 /',
  '/bin/date',
  'echo "Reality Or Nothing." > /etc/motd',
  '# ifconfig wifi0 up      # commented out. bring it up yourself, when you mean to.',
].join('\n');

const TTYS = ['console  on  secure', 'tty00    off', 'tty01    off'].join('\n');

// A device is not a file you read; the shell says so rather than printing bytes.
const DEV = (what) => `[ ${what} ]\nThis is a device, not a file.`;

const KERNEL_C = [
  '/*',
  ' * main.c — sys/ken. RON field build.',
  ' *',
  ' * We kept the source on the machine because a machine you cannot read is a',
  ' * machine you are only borrowing. If you are holding this and everything has',
  ' * gone the way we think it will go: it compiles. That was the point.',
  ' */',
  '',
  'main()',
  '{',
  '    extern int end;',
  '    ...',
  '}',
].join('\n');

const CORE_NOTE = [
  'core dumped by: netscape',
  'signal 11 (segmentation violation)',
  '',
  'It ran out of memory rendering a page with too many images on it.',
  'The page was a shop.',
].join('\n');

// The README the build's own authors left at the root of the disk. It explains
// the machine you are typing into, and it is the answer to the obvious question
// about this laptop: why is a resistance running a kernel from 1979 with a
// wireless card bolted to it.
//
// The argument is practical, not nostalgic. Written plainly, because the people
// who wrote it were explaining a working system to whoever picked it up next.
const ROOT_README = [
  'README.TXT      TOR build, sys 7. Read this first.',
  '',
  'WHAT THIS IS',
  '',
  'This is not a clean system and was never meant to be. The kernel is UNIX',
  'version 7, which is old enough to vote several times over. The networking was',
  'taken from a Berkeley tape. The editor is somebody else\'s, the browser is',
  'somebody else\'s, and about a third of what is in /bin was typed in from a',
  'printed listing because we could not find a copy that worked.',
  '',
  'It is a hodgepodge. It boots, it holds a filesystem, it talks to a card, and',
  'every piece of it was chosen for one reason.',
  '',
  'WHY IT IS OLD ON PURPOSE',
  '',
  'Everything they run, they run on top of systems that were built to be managed',
  'from somewhere else. That is not a flaw the vendors introduced by accident;',
  'it is what the machines were sold for. A modern box wants to check in. It',
  'wants to update itself, report its health, resolve a name it was given at the',
  'factory, and accept an instruction from whoever is authorised this week. Every',
  'one of those is a door, and they hold the keys to all of them.',
  '',
  'This system has none. There is no update service. There is no telemetry. There',
  'is no vendor. Nothing on this disk was written after the estates were built,',
  'so nothing on this disk was written with them in mind, which means there is no',
  'accommodation for them anywhere in it. When the card is down it is a box of',
  'files that cannot be reached at all, and when the card is up it can ask for a',
  'page and nothing more.',
  '',
  'It is also small. One person can read all of it. The source is in /usr/src.',
  'That is not sentiment: a system you can read is a system you can check, and a',
  'system you can check is one you can trust when it matters.',
  '',
  'WHAT IT CANNOT DO',
  '',
  'It cannot reach their control wire. It never will. The card speaks to their',
  'web and that is the whole of it, so no amount of cleverness at this keyboard',
  'moves a machine on the ground. If you want to change what a unit does you must',
  'go and stand near one.',
  '',
  'It cannot be updated, by us or by anyone. What you have is what there is.',
  '',
  'IF YOU ARE HOLDING THIS AND WE ARE NOT AROUND',
  '',
  'It is yours. Open it, mend it, put worse parts in it if that is what you have.',
  'A machine you can open is worth more than a better machine you cannot.',
  '',
  '                                              — field build, no version number',
].join('\n');

// Does this element do its own pasting?
//
// The console scrapes a paste onto its command line so you do not have to aim
// at a one-line input. That is a convenience, and it must never fire over
// something that can be typed into. Guarding on the command line alone was
// wrong the moment pico, Netscape and the PDF reader began rendering INSIDE the
// NostBook chassis: the terminal is still displayed behind them, so a paste
// into the EDITOR was scraped onto the command line and took the focus with it.
// You could not paste into the editor you edit programs in.
//
// Lives here, and takes a plain object rather than an Element, so the rule can
// be tested. main.js is imported by no test, ever, which is exactly why this
// kind of one-line predicate keeps going wrong there.
export function handlesOwnPaste(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';
}

// Is this keystroke the browser's rather than the game's?
//
// A modal that swallows every key so none leaks into player movement will also
// swallow copy, and then you can select a page with the mouse and fail to copy
// it. Movement is unmodified letters; anything held with Ctrl, Cmd or Alt was
// never movement. Takes a plain object so the rule can be tested rather than
// clicked at, for the same reason as handlesOwnPaste.
export function isBrowserChord(e) {
  if (!e) return false;
  return !!(e.ctrlKey || e.metaKey || e.altKey);
}

// The intent reference, kept on the disk so you can read it at the machine you
// are programming rather than off a website. Plain text: `cat robots_code/intents.txt`.
const INTENTS_TXT = [
  'UNIT INTENTS — what a program can tell a machine to do',
  '',
  'A program answers with ONE intent (its feet), or a PAIR of feet and weapon,',
  '[feet, fire]. The intent is the LAST thing each branch evaluates to; effects',
  '(eye, beep, flash) come before it, joined with `;`. A branch that ends on an',
  'effect evaluates to () and faults: MISSING INTENT.',
  '',
  '  MOVE',
  '    patrol   amble around its home tower — the default idle',
  '    hunt     pursue and attack you (sets aggro; the fast chase)',
  '    flee     run directly away from you',
  '    home     go back to its tower and stand there (where it recharges)',
  '    wait     hold position, sensor still turning',
  '    tend     reseed blight / garden (the gardener\'s job)',
  '    route    walk a queued LOGO path: `move dx dy` orders, one leg at a',
  '             time. See logo.ml.',
  '    follow   escort: trail you at a standoff, fight nothing',
  '    defend   escort: trail you, and intercept whatever comes hunting you',
  '',
  '  WEAPON   (shooters only — W-4, T-3 — as the pair [feet, fire], e.g. [hunt, fire])',
  '    fire     shoot when it has a line',
  '    hold     track the target but do not pull',
  '    reload   a deliberate cool-down',
  '',
  'A CONSTITUTION',
  '',
  'A program may carry standing prohibitions, written at the top where a reader',
  'sees them first. They are not intents: they stand ABOVE whatever the program',
  'decides, and they bind the chassis reflexes too, so the machine cannot fall',
  'back into the forbidden thing when its program faults.',
  '',
  '    never hunt ;',
  '    never fire ;',
  '    eye "blue" ;',
  '    if charge < 20 then follow else defend',
  '',
  '  never hunt   it will not acquire you, by program or by reflex',
  '  never fire   the trigger stays up; it still tracks and still aims',
  '',
  'A forbidden intent is VETOED, not faulted — the machine is constrained, not',
  'broken: it falls to patrol and blips white. Read any unit\'s whole program,',
  'constitution and all, from a tower console:  soul t1_03',
  '',
  'WHAT EACH CHASSIS ACCEPTS',
  '  Fighters   T-1 T-2 T-3 W-1 W-4:  patrol hunt home flee wait route follow defend',
  '  Gardeners  W-3 W-5:              patrol home flee wait route tend',
  '                                   (no hunt/follow/defend; they have tend)',
  '',
  'Ask a chassis for a word it does not carry (a T-1 to tend, a W-5 to hunt) and it',
  'faults, lights the amber lamp, and drops to its reflexes.',
  '',
  'SENSES a program can read',
  '  charge integrity range home_range threat hurt linked',
  '  (and, on the chassis that carry them: blight daylight sight armed shielded',
  '   contact lost_for work)',
  '',
  '  example',
  '    if charge < 15 then home',
  '    else if threat then (eye "white" ; hunt)',
  '    else patrol',
  '',
  '-- see also: robots_code/readme.txt and the per-class readme_*.txt, and',
  '   `ml -full` for the language.',
].join('\n');

// The FSF membership card's filesystem — a whole GNU/Linux system, live, on a
// credit-card USB. Read-only: the NostBook mounts it (drag it onto the slot, or
// `mount fsf`), it does not boot it. Built fresh per mount so /mnt/fsf is never
// shared with the save's own tree.
const FSF_README = [
  '/dev/sd0 — FSF membership card (read-only)',
  '',
  'A credit-card USB, and on it a whole GNU/Linux system, live. It boots. It',
  'runs. It is yours to copy and to pass on. The Free Software Foundation posts',
  'one to every member, and in a world where the machines deleted the software',
  'to sell it back, the point of it is plain: a system you can read is a system',
  'nobody can take from you.',
  '',
  '  cat freedom.txt        what the licence protects',
  '  ls  bin                the userland it boots into',
  '',
  'Read-only here — the NostBook mounts the card, it does not run it. To run it',
  'you boot a machine off the card. This one cannot; carrying one that can is',
  'the whole point.',
  '',
  'The licence is the GNU General Public License. Copyleft: run it, read it,',
  'change it, share it — and everyone you share it with gets the same right.',
  'That is the whole trick, and it is why this card can exist at all.',
].join('\n');
const FSF_FREEDOM = [
  'The four freedoms',
  '',
  'A program is free software if the person who has it has:',
  '',
  '  0. the freedom to run it, for any purpose;',
  '  1. the freedom to study how it works and change it (source is the',
  '     precondition);',
  '  2. the freedom to pass on copies, so you can help your neighbour;',
  '  3. the freedom to pass on your changed copies, so the community benefits.',
  '',
  'A program that denies any of these is not free, whatever else it does for',
  'you. The machines on these islands were built to deny all four at once. This',
  'card is the argument against them, small enough to keep in a wallet.',
].join('\n');
export function makeFsfCard() {
  const bin = {};
  for (const t of ['ls', 'cat', 'gcc', 'emacs', 'bash', 'gpg', 'make', 'tar', 'grep', 'gzip']) bin[t] = file('');
  return dir({ README: file(FSF_README), 'freedom.txt': file(FSF_FREEDOM), bin: dir(bin) });
}

export function makeDisk() {
  const man = {};
  for (const [k, v] of Object.entries(MAN)) man[k] = file(v);
  return dir({
    // Read this first: what this machine is, and why it is old on purpose.
    'readme.txt': file(ROOT_README),
    // The kernel itself, at the root, as V7 had it.
    unix: file('[ kernel image ]\nUNIX V7 (TOR build) #7\nNot a text file. It is the system you are typing into.'),
    bin: dir({}),                     // the commands are built in; /bin is scenery
    dev: dir({
      console: file(DEV('console')),
      tty00: file(DEV('serial line 0')),
      null: file(DEV('bit bucket')),
      hd0: file(DEV('fixed disk 0')),
      mem: file(DEV('core memory')),
      // The card ifconfig talks to. It is a device on this machine, which is
      // why the machine can lie about its address: the lying is done here.
      wifi0: file(DEV('wireless interface — address forged at association')),
    }),
    etc: dir({
      motd: file('Reality Or Nothing.'),
      passwd: file(PASSWD),
      group: file(GROUP),
      hosts: file(HOSTS),
      rc: file(RC),
      ttys: file(TTYS),
    }),
    lib: dir({ 'libc.a': file('[ archive ]\nStandard C library. 41 objects.') }),
    mnt: dir({}),                     // empty until you `mount` the FSF card
    tmp: dir({
      'core': file(CORE_NOTE),
      'ml.lock': file('held by pid 214\npid 214 is not running'),
    }),
    usr: dir({
      man: dir(man),
      // Store-and-forward (uucp.js). The queue is a directory of files, which is
      // how it worked and also how it survives a save.
      spool: dir({
        uucp: dir({}),
        mail: dir({
          'e.marsh': file(OWNER_MAIL.map((m) =>
            `From ${m.from}\nTo ${m.to}\nSubject ${m.subject}\nDate ${m.date}\n\n${m.body}`).join('\n.\n')),
        }),
      }),
      games: dir({}),                 // L7: ADVENTURE, Spacewar!
      lib: dir({}),
      // The source the machine was built from. RON left it on the disk on
      // purpose, which is the whole Torite argument about mendable tools made
      // concrete: you are holding a computer you could rebuild.
      src: dir({
        'main.c': file(KERNEL_C),
        'README': file('sys source, RON field build.\nIf you can read this you can change it.\nThat was always the difference.'),
      }),
      ron: dir({ notes: file('field build. do not ship. — shipped anyway') }),
    }),
    home: dir({
      'readme': file(README),
      // What the radio is for and how to point it — the one non-obvious thing
      // about this machine. Kept loose in /home so `cat wifi.txt` finds it.
      'wifi.txt': file(WIFI_README),
      // hello.ml stays loose in /home on purpose: it is the first thing anyone
      // runs, the boot banner and `man ml` both name it with no path, and a
      // first program you have to cd to is a first program with a step in front
      // of it. Everything else that runs here lives in demos/.
      'hello.ml': file(HELLO_ML),
      // Programs for the MACHINES rather than for this laptop. They are kept
      // apart from demos because they will not run here: they read senses a
      // NostBook does not have, and typing `ml follow_user.ml` at this prompt
      // is supposed to fail. They are written here, carried to a unit, posted.
      robots_code: dir({
        'readme.txt': file(ROBOTS_README),
        'readme_t.txt': file(README_T),
        'readme_w.txt': file(README_W),
        'readme_v.txt': file(README_V),
        'readme_m.txt': file(README_M),
        'intents.txt': file(INTENTS_TXT),
        'follow_user.ml': file(FOLLOW_USER_ML),
        'sentry.ml': file(SENTRY_ML),
        'survivor.ml': file(SURVIVOR_ML),
      }),
      // The network SDK's landing folder. Ships as a pointer only; the kit
      // itself (GUIDE + examples) is fetched from a relay — see net.js
      // RELAY_BUNDLES and the ronpkg handler in main.js. graftSystemDirs adds
      // this folder to an older save the same way, so the pointer reaches
      // everyone; the download then fills it.
      sdk: dir({
        'readme.txt': file(SDK_POINTER_README),
      }),
      // ELIZA, as source. The machine in the ruins talks to you the way this
      // does, and this is short enough to read to the end in a sitting. The
      // script listing is generated from the table the in-game bot dispatches
      // on, so it cannot drift from what RON-DOS actually runs.
      eliza: dir({
        'readme': file(ELIZA_README),
        'doctor.script': file(DOCTOR_SCRIPT),
        'doctor.tables': file(DOCTOR_TABLES),
        'eliza.ml': file(ELIZA_PROGRAM),
      }),
      demos: dir({
        'life.ml': file(LIFE_ML),
        'count.ml': file(COUNT_ML),
        'fizz.ml': file(FIZZ_ML),
        'sort.ml': file(SORT_ML),
        'tree.ml': file(TREE_ML),
        'rogers.ml': file(ELIZA_ML),
        'patrol.ml': file(PATROL_ML),
        'engage.ml': file(ENGAGE_ML),
        'dance.ml': file(DANCE_ML),
      }),
      // Where the browser puts anything it fetches off the network — a machine's
      // program.ml, mostly. Kept apart from your own files so a download can
      // never quietly overwrite something you wrote.
      download: dir({}),
      // The previous owner's papers (pdfs.js). Real documents, shipped as
      // assets; `cat` gets a header and a pointer, `pdf` opens the reader.
      documents: dir(Object.fromEntries(PDFS.map((d) => [d.name, file(pdfStub(d))]))),
      // And her books (books.js). Whole works, in HTML, read in the browser
      // because that is what a web page is for. They need no network at all.
      books: dir(Object.fromEntries(BOOKS.map((b) => [bookFileName(b), file(bookStub(b))]))),
    }),
  });
}

// Files this build used to ship under /home and does not any more, usually
// because they were renamed. A graft deletes these if it finds them, which is
// the only way a rename ever reaches a disk that is already in somebody's save.
//
// doctor.ml became eliza.ml when it stopped being a canned session and started
// reading its input. A save written before that carried the old file, and
// because the graft below only ever looked at the TOP level of /home it never
// opened the folder it was in: the directory existed, so it was skipped whole,
// and the machine went on serving a program that no longer exists in the build.
const RETIRED = [['eliza', 'doctor.ml']];

// Shipped files whose CONTENT was replaced wholesale. If the on-disk copy is
// byte-identical to the old shipped text it is the system's, not the player's:
// delete it before the add pass below, and the add pass lands the new version
// in the same graft. If it differs by one character, the player edited it and
// it stays theirs — the console teaches them about `reply` when they run it.
//
// eliza.ml went from a readLine loop to a `fun reply` the console drives. The
// loop version stopped conversing when the replay driver was removed, so a
// disk still carrying it unmodified gets the new one.
const SUPERSEDED = [['eliza', 'eliza.ml', ELIZA_LOOP_LEGACY]];

// A disk from an older save has none of the system tree, because it was made
// before there was one. Add anything missing rather than replacing the disk:
// the player's own files in /home are theirs and must survive untouched.
export function graftSystemDirs(root) {
  const fresh = makeDisk();
  const added = [];
  for (const [name, node] of Object.entries(fresh.d)) {
    if (name === 'home') continue;               // never touch their files
    if (!root.d[name]) { root.d[name] = node; added.push(name); }
  }
  const home = root.d.home;
  if (home && home.d) {
    // Removals FIRST, so the add pass can land a replacement in the same
    // graft. Run them after and a superseded file comes off on this boot and
    // back on the next, which is a whole session with no eliza.ml at all.
    for (const [dir, f] of RETIRED) {
      if (home.d[dir] && home.d[dir].d && home.d[dir].d[f]) {
        delete home.d[dir].d[f];
        added.push(`-home/${dir}/${f}`);
      }
    }
    for (const [dir, f, was] of SUPERSEDED) {
      const cur = home.d[dir] && home.d[dir].d && home.d[dir].d[f];
      if (cur && cur.f === was) {
        delete home.d[dir].d[f];
        added.push(`-home/${dir}/${f} (superseded)`);
      }
    }
    for (const [name, node] of Object.entries(fresh.d.home.d)) {
      if (!home.d[name]) { home.d[name] = node; added.push(`home/${name}`); continue; }
      // The folder is already there, which used to end it. Go in: a directory
      // this build ships gets any file it is missing, so new work reaches an
      // old save instead of being invisible to everybody who has played before.
      // Only ADD — a file the player has edited keeps their version.
      const mine = home.d[name], theirs = fresh.d.home.d[name];
      if (!mine.d || !theirs.d) continue;
      for (const [f, node2] of Object.entries(theirs.d)) {
        if (!mine.d[f]) { mine.d[f] = node2; added.push(`home/${name}/${f}`); }
      }
    }
  }
  return added;
}

// ---- ed(1) --------------------------------------------------------------
// The standard editor. THE editor for a machine of this vintage, and the right
// one here for a reason beyond period accuracy: ed is line-oriented, and this
// terminal takes one line at a time, so it fits the screen we actually have.
// A screen editor would need a screen.
//
// It is famously terse — every complaint is a single `?` — and that terseness
// is the character. You are not being helped. You are being edited alongside.
//
// Pure state machine: `edOpen` makes the buffer, `edRun` takes one typed line.
// The hub owns the mode, the way it owns ML and Netscape.

export function edOpen(env, name) {
  let lines = [], exists = false;
  if (name) {
    const n = lookup(env.root, resolvePath(name, env.cwd));
    if (n && isDir(n)) throw new UnixError(`${name}: is a directory`);
    if (n && isFile(n)) { exists = true; lines = n.f === '' ? [] : n.f.split('\n'); }
  }
  const ed = { name: name || null, lines, cur: lines.length, dirty: false, ins: null };
  // Real ed answers a new file with `?name` and still lets you write it.
  return { ed, out: exists ? String(lines.join('\n').length) : (name ? `?${name}` : '?') };
}

function edOne(ed, tok) {
  if (tok === '.' || tok === '') return ed.cur;
  if (tok === '$') return ed.lines.length;
  const n = parseInt(tok, 10);
  return Number.isNaN(n) ? null : n;
}
function edRange(ed, spec) {
  if (spec === '%' || spec === ',') return [1, ed.lines.length];
  if (!spec) return [ed.cur, ed.cur];
  const parts = spec.split(',');
  if (parts.length === 1) { const a = edOne(ed, parts[0]); return [a, a]; }
  return [edOne(ed, parts[0]), edOne(ed, parts[1])];
}
const edBad = (ed, [a, b]) => (a == null || b == null || a < 1 || b > ed.lines.length || a > b);

// One typed line. Returns {out, quit} — `out` null means ed says nothing at all,
// which is most of the time and is exactly right.
export function edRun(ed, raw, env) {
  const line = String(raw == null ? '' : raw);
  // Input mode: everything is text until a lone dot.
  if (ed.ins != null) {
    if (line.trim() === '.') { ed.ins = null; return { out: null }; }
    ed.lines.splice(ed.ins, 0, line);
    ed.ins += 1; ed.cur = ed.ins; ed.dirty = true;
    return { out: null };
  }
  const t = line.trim();
  if (t === '') {                       // bare return steps forward one line
    if (ed.cur >= ed.lines.length) return { out: '?' };
    ed.cur += 1;
    return { out: ed.lines[ed.cur - 1] };
  }
  const m = t.match(/^([%,]|(?:\d+|\.|\$)(?:\s*,\s*(?:\d+|\.|\$))?)?\s*(.*)$/);
  const spec = (m[1] || '').replace(/\s+/g, '');
  const rest = m[2] || '';
  const c = rest[0] || 'p';             // a bare address prints that line
  const arg = rest.slice(1).trim();
  const r = edRange(ed, spec);

  switch (c) {
    case 'p': case 'n': {
      if (edBad(ed, r)) return { out: '?' };
      const out = [];
      for (let i = r[0]; i <= r[1]; i++) out.push(c === 'n' ? `${i}\t${ed.lines[i - 1]}` : ed.lines[i - 1]);
      ed.cur = r[1];
      return { out: out.join('\n') };
    }
    case 'a':
      if (spec && (r[1] == null || r[1] < 0 || r[1] > ed.lines.length)) return { out: '?' };
      ed.ins = spec ? r[1] : ed.cur;    // append AFTER the addressed line
      return { out: null };
    case 'i':
      if (spec && edBad(ed, r) && ed.lines.length) return { out: '?' };
      ed.ins = Math.max(0, (spec ? r[0] : ed.cur) - 1);  // insert BEFORE it
      return { out: null };
    case 'd': {
      if (edBad(ed, r)) return { out: '?' };
      ed.lines.splice(r[0] - 1, r[1] - r[0] + 1);
      ed.cur = Math.min(r[0], ed.lines.length);
      ed.dirty = true;
      return { out: null };
    }
    case 'c': {
      if (edBad(ed, r)) return { out: '?' };
      ed.lines.splice(r[0] - 1, r[1] - r[0] + 1);
      ed.dirty = true;
      ed.ins = r[0] - 1;
      return { out: null };
    }
    case 's': {
      // s/old/new/ , optionally g. Only what a line editor needs.
      const sm = rest.match(/^s\/((?:[^/\\]|\\.)*)\/((?:[^/\\]|\\.)*)\/(g?)$/);
      if (!sm) return { out: '?' };
      if (edBad(ed, r)) return { out: '?' };
      let hit = false;
      for (let i = r[0]; i <= r[1]; i++) {
        const before = ed.lines[i - 1];
        const re = new RegExp(sm[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), sm[3] ? 'g' : '');
        const after = before.replace(re, sm[2]);
        if (after !== before) { ed.lines[i - 1] = after; ed.cur = i; hit = true; ed.dirty = true; }
      }
      return { out: hit ? null : '?' };
    }
    case 'w': {
      const name = arg || ed.name;
      if (!name) return { out: '?' };
      const text = ed.lines.join('\n');
      try { writeFile(env, name, text); } catch { return { out: '?' }; }
      ed.name = name; ed.dirty = false;
      return { out: String(text.length) };
    }
    case '=':
      return { out: String(spec ? r[1] : ed.lines.length) };
    case 'q':
      if (ed.dirty) { ed.dirty = false; return { out: '?' }; }  // a second q leaves, as ed does
      return { out: null, quit: true };
    case 'Q':
      return { out: null, quit: true };
    default:
      return { out: '?' };
  }
}

// ---- The shell ----------------------------------------------------------
// Each command is (args, stdin, env) -> stdout string. `env` carries the disk
// and the cwd so commands can read and write; mutations happen in place, which
// is what lets `> file` and `rm` stick.

const UNAME = 'UNIX';
const UNAME_FULL = 'UNIX V7 nostbook RON 7.0 pdp11';

function readFileAt(env, path) {
  const parts = resolvePath(path, env.cwd);
  const n = lookup(env.root, parts);
  if (!n) throw new UnixError(`${path}: no such file or directory`);
  if (isDir(n)) throw new UnixError(`${path}: is a directory`);
  return n.f;
}

// Text in, text out: the filters that make a pipe worth having.
// How long until an hour comes round again, said the way a person would.
function hoursTo(now, then) {
  let d = then - now;
  if (d < 0) d += 24;
  const h = Math.floor(d), m = Math.round((d - h) * 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

function inputOf(args, stdin, env) {
  if (args.length) return readFileAt(env, args[0]);
  if (stdin != null) return stdin;
  throw new UnixError('nothing to read — give a file or pipe one in');
}

// An access point's hardware address. Stable per network, because it is one box.
function apMac(essid) {
  let h = 0;
  for (let i = 0; i < String(essid).length; i++) h = (h * 33 + String(essid).charCodeAt(i)) >>> 0;
  const b = [];
  for (let i = 0; i < 3; i++) b.push(((h >>> (i * 8)) & 0xff).toString(16).padStart(2, '0').toUpperCase());
  return `00:60:1D:${b.join(':')}`;
}

// Is a program on this disk? Software you fetched lands in /home/download, but
// a person may well move it, so look in the places a person would put it.
export function hasFile(env, name) {
  if (!env || !env.root) return false;
  const dirs = [['home', 'download'], ['home'], ['bin'], ['usr', 'bin']];
  for (const path of dirs) {
    let n = env.root;
    let ok = true;
    for (const seg of path) { n = n && n.d && n.d[seg]; if (!n) { ok = false; break; } }
    if (ok && n && n.d && n.d[name]) return true;
  }
  return false;
}

const COMMANDS = {
  pwd: (_a, _in, env) => pathString(env.cwd) || '/',

  ls: (args, _in, env) => {
    const long = args.includes('-l');
    const rest = args.filter((a) => a !== '-l' && a !== '-F');
    const parts = resolvePath(rest[0] || '', env.cwd);
    const n = lookup(env.root, parts);
    if (!n) throw new UnixError(`${rest[0] || pathString(parts)}: no such file or directory`);
    if (isFile(n)) return rest[0];
    const names = Object.keys(n.d).sort();
    if (!names.length) return '';
    // A DIRECTORY LOOKS LIKE A DIRECTORY. V7 kept this behind -F and a plain
    // `ls` gave you one undifferentiated row of words, which is fine when you
    // wrote the disk yourself and no use at all when you are reading somebody
    // else's. The slash is on by default here; -F still works, because a person
    // who knows the flag should not be told it does not exist.
    if (!long) return names.map((name) => `${name}${isDir(n.d[name]) ? '/' : ''}`).join('  ');
    return names.map((name) => {
      const c = n.d[name];
      const kind = isDir(c) ? 'd' : '-';
      const size = isDir(c) ? Object.keys(c.d).length : c.f.length;
      return `${kind}  ${String(size).padStart(6)}  ${name}${isDir(c) ? '/' : ''}`;
    }).join('\n');
  },

  cd: (args, _in, env) => {
    const parts = resolvePath(args[0] || '~', env.cwd);
    const n = lookup(env.root, parts);
    if (!n) throw new UnixError(`${args[0]}: no such file or directory`);
    if (!isDir(n)) throw new UnixError(`${args[0]}: not a directory`);
    env.cwd = parts;
    return '';
  },

  cat: (args, stdin, env) => inputOf(args, stdin, env),

  echo: (args, _in, _env) => args.join(' '),

  man: (args, _in, env) => {
    const topic = (args[0] || '').toLowerCase();
    if (!topic) return 'man <topic>. try: man ml';
    const n = lookup(env.root, ['usr', 'man', topic]);
    if (!n || !isFile(n)) throw new UnixError(`no manual entry for ${topic}`);
    return n.f;
  },

  mkdir: (args, _in, env) => {
    if (!args[0]) throw new UnixError('mkdir needs a name');
    const parts = resolvePath(args[0], env.cwd);
    const at = parentOf(env.root, parts);
    if (!at) throw new UnixError(`${args[0]}: no such directory`);
    if (at.parent.d[at.name]) throw new UnixError(`${args[0]}: already exists`);
    at.parent.d[at.name] = dir({});
    return '';
  },

  rm: (args, _in, env) => {
    if (!args[0]) throw new UnixError('rm needs a file');
    const parts = resolvePath(args[0], env.cwd);
    const at = parentOf(env.root, parts);
    if (!at || !at.parent.d[at.name]) throw new UnixError(`${args[0]}: no such file`);
    if (isDir(at.parent.d[at.name])) throw new UnixError(`${args[0]}: is a directory`);
    delete at.parent.d[at.name];
    return '';
  },

  cp: (args, _in, env) => {
    if (args.length < 2) throw new UnixError('cp <from> <to>');
    const text = readFileAt(env, args[0]);
    writeFile(env, args[1], text);
    return '';
  },

  mv: (args, _in, env) => {
    if (args.length < 2) throw new UnixError('mv <from> <to>');
    const text = readFileAt(env, args[0]);
    writeFile(env, args[1], text);
    COMMANDS.rm([args[0]], null, env);
    return '';
  },

  grep: (args, stdin, env) => {
    const pat = args[0];
    if (pat == null) throw new UnixError('grep <pattern> [file]');
    const text = inputOf(args.slice(1), stdin, env);
    const hits = text.split('\n').filter((l) => l.toLowerCase().includes(String(pat).toLowerCase()));
    return hits.join('\n');
  },

  tail: (args, stdin, env) => {
    const n = Math.abs(parseInt(String(args.find((a) => /^-\d+$/.test(a)) || '-10').slice(1), 10)) || 10;
    const text = inputOf(args.filter((a) => !/^-\d+$/.test(a)), stdin, env);
    return text.split('\n').slice(-n).join('\n');
  },

  sort: (args, stdin, env) => {
    const rev = args.includes('-r');
    const lines = inputOf(args.filter((a) => a !== '-r'), stdin, env).split('\n').sort();
    return (rev ? lines.reverse() : lines).join('\n');
  },

  uniq: (args, stdin, env) => {
    const lines = inputOf(args, stdin, env).split('\n');
    return lines.filter((l, i) => i === 0 || l !== lines[i - 1]).join('\n');
  },

  // Who is on this machine. Nobody, and the entry that never got cleared.
  who: () => 'e.marsh  console  Jan  1 00:00',

  ps: () => [
    '  PID TTY  TIME CMD',
    '    1 ?    0:01 /etc/init',
    '   12 con  0:00 -sh',
    '  214 ?    9:41 ml            (defunct)',
  ].join('\n'),

  // mount(1). One thing in the world is mountable: the FSF membership card, a
  // credit-card USB with a live system and its own source on it. The host puts
  // the card's tree in env.fsfCard when the player is carrying one, so the
  // command asks the host rather than reading a table of items.
  mount: (args, _in, env) => {
    const mnt = lookup(env.root, ['mnt']);
    const already = lookup(env.root, ['mnt', FSF_MOUNT]);
    const arg = args[0] ? String(args[0]).toLowerCase() : '';
    if (!arg) {
      // The mount table: the root, the FSF card if it is in, and any SD-cards
      // the NostBook has read in (drag a card onto the laptop slot to add one).
      const lines = ['/dev/hd0 on / type v7fs (rw)'];
      if (already) lines.push(`${FSF_DEV} on /mnt/${FSF_MOUNT} type iso9660 (ro)`);
      for (const k of Object.keys((mnt && mnt.d) || {})) if (k !== FSF_MOUNT) lines.push(`sd:${k} on /mnt/${k} type card (ro)`);
      return lines.join('\n');
    }
    if (arg === '-u' || arg === '-r') {
      if (!already) throw new UnixError(`/mnt/${FSF_MOUNT}: not mounted`);
      delete lookup(env.root, ['mnt']).d[FSF_MOUNT];
      return `${FSF_DEV} unmounted. Take the card; it goes back in a wallet.`;
    }
    // A card named directly. Everything but the FSF card is a physical read: you
    // cannot mount from a prompt because the shell cannot reach into your
    // pockets — drag the card onto the laptop slot and the NostBook copies it in.
    if (arg !== FSF_MOUNT) {
      if (mnt && mnt.d && mnt.d[arg]) return `/mnt/${arg} is already mounted.`;
      return 'To read a card in, drag it from a pocket onto the laptop slot in the HUD — the NostBook bleeps and copies it to /mnt. (`mount` alone lists what is mounted; `eject <card>` takes one out.)';
    }
    if (!env.fsfCard) throw new UnixError('nothing to mount. There is a slot, and you are not carrying anything that fits it.');
    if (already) return `${FSF_DEV} is already on /mnt/${FSF_MOUNT}`;
    lookup(env.root, ['mnt']).d[FSF_MOUNT] = env.fsfCard();
    return [
      `${FSF_DEV} on /mnt/${FSF_MOUNT} type iso9660 (ro)`,
      'Trisquel GNU/Linux, live. Nothing is written to this machine.',
      `Start with: cat /mnt/${FSF_MOUNT}/README`,
    ].join('\n');
  },
  // eject/umount a card read into /mnt (the FSF card also answers `mount -u`).
  umount: (args, _in, env) => {
    const name = String(args[0] || '').toLowerCase().replace(/^\/?mnt\//, '');
    if (!name) throw new UnixError('usage: eject <card>   e.g. eject chip');
    const mnt = lookup(env.root, ['mnt']);
    if (!mnt || !mnt.d || !mnt.d[name]) throw new UnixError(`/mnt/${name}: not mounted`);
    delete mnt.d[name];
    return name === FSF_MOUNT ? `${FSF_DEV} unmounted. Take the card.` : `/mnt/${name} ejected — take the card.`;
  },
  eject: (args, _in, env) => COMMANDS.umount(args, _in, env),

  df: () => [
    'Filesystem  blocks   used   free  capacity  Mounted on',
    '/dev/hd0     20480  11902   8578      58%    /',
  ].join('\n'),

  uptime: () => '  0:00am  up 9341 days,  1 user,  load average: 0.00, 0.00, 0.00',

  // strings(1): the printable runs inside something that is not text. On this
  // machine that means the kernel, the libraries and any program dump you have
  // taken off a unit — which is how you read a machine that will not talk.
  // diff(1). The ed-script form V7 printed: 3c3, then < old and > new. It exists
  // for one job above all — you read a machine's program, change it, and want to
  // know exactly what you are about to hand back before you hand it back.
  // date(1). The machine's own clock, which is the only one it has: nothing
  // sets it and nothing corrects it, so the day is a count since it was built.
  date: (_a, _in, env) => {
    const c = env.clock || {};
    const h = Number.isFinite(c.hour) ? c.hour : 12;
    const day = Number.isFinite(c.day) ? c.day : 1;
    const HH = String(Math.floor(h)).padStart(2, '0');
    const MM = String(Math.round((h % 1) * 60)).padStart(2, '0');
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${DAYS[day % 7]} Jan ${String(day % 28 + 1).padStart(2, ' ')} ${HH}:${MM}:00 GMT`;
  },

  // cal(1). A month, printed. It does not know which month, and neither do you.
  cal: () => {
    const out = ['    January', 'Su Mo Tu We Th Fr Sa'];
    let line = '';
    for (let d = 1; d <= 31; d++) {
      line += String(d).padStart(2) + ' ';
      if ((d % 7) === 0) { out.push(line.trimEnd()); line = ''; }
    }
    if (line.trim()) out.push(line.trimEnd());
    return out.join('\n');
  },

  // lpr(1). There is no printer, and the error is the whole content: this
  // machine can hold everything and hand you nothing you can carry away.
  lpr: () => { throw new UnixError('lpr: no daemon'); },

  // fortune(1). V7 shipped one. This one holds what the Torites wrote down,
  // and now and then an address somebody thought worth keeping.
  fortune: (_a, _in, env) => {
    const c = env.clock || {};
    const seed = Math.floor(((Number.isFinite(c.hour) ? c.hour : 12) * 60)
      + (Number.isFinite(c.day) ? c.day : 1) * 37);
    return FORTUNES[seed % FORTUNES.length];
  },

  // ln(1). The system already does this to itself: pdf is a link to pdf-viewer.
  // Letting you make your own is the difference between a machine that is
  // configured and one that is yours.
  ln: (args, _in, env) => {
    if (args.length < 2) throw new UnixError('ln: ln <file> <name>');
    const from = resolvePath(String(args[0].name || args[0]), env.cwd);
    const node = lookup(env.root, from);
    if (!node) throw new UnixError(`${args[0].name || args[0]}: no such file or directory`);
    if (!isFile(node)) throw new UnixError(`${args[0].name || args[0]}: is a directory`);
    const to = resolvePath(String(args[1].name || args[1]), env.cwd);
    const parent = lookup(env.root, to.slice(0, -1));
    if (!parent || !isDir(parent)) throw new UnixError(`${args[1].name || args[1]}: no such directory`);
    parent.d[to[to.length - 1]] = node;      // the same node, not a copy: that is what a link is
    return '';
  },

  // kill(1). 214 is a zombie, and a zombie cannot be killed: it is already
  // dead and waiting on a parent that is gone. That is not a joke about the
  // world, it is how the signal actually works.
  kill: (args) => {
    const pid = parseInt(String(args[0] && (args[0].v != null ? args[0].v : args[0])), 10);
    if (!Number.isFinite(pid)) throw new UnixError('kill: kill <pid>');
    if (pid === 1) throw new UnixError('kill: 1: not permitted');
    if (pid === 214) throw new UnixError('kill: 214: no such process');
    if (pid === 12) throw new UnixError('kill: 12: not permitted');
    throw new UnixError(`kill: ${pid}: no such process`);
  },

  // tar(1). Roll a directory into one file so uucp has a single thing to carry.
  // `tar c <dir> > name.tar` and `tar t < name.tar` to look, `tar x < name.tar`
  // to unroll. The format is the original idea, not the original bytes: a
  // header line per file, then its text.
  tar: (args, stdin, env) => {
    const strs = args.map((a) => String(a.name || a.v || a));
    const key = (strs[0] || '').replace(/^-/, '');
    if (!key) throw new UnixError('tar: tar c|t|x [dir]');
    if (key.startsWith('c')) {
      const start = resolvePath(strs[1] || '', env.cwd);
      const node = lookup(env.root, start);
      if (!node) throw new UnixError(`${strs[1] || '.'}: no such file or directory`);
      const out = [];
      const walk = (n, parts) => {
        if (isFile(n)) {
          out.push(`=== ${parts.join('/')} ${n.f.length}`);
          out.push(n.f);
        } else for (const k of Object.keys(n.d).sort()) walk(n.d[k], [...parts, k]);
      };
      walk(node, [start[start.length - 1] || 'root']);
      return out.join('\n');
    }
    const body = inputOf(args.slice(1), stdin, env);
    const entries = [];
    const lines = body.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^=== (\S+) (\d+)$/);
      if (!m) continue;
      const buf = [];
      for (let j = i + 1; j < lines.length && !/^=== \S+ \d+$/.test(lines[j]); j++) buf.push(lines[j]);
      entries.push({ name: m[1], text: buf.join('\n') });
    }
    if (!entries.length) throw new UnixError('tar: not a tar file');
    if (key.startsWith('t')) return entries.map((e) => e.name).join('\n');
    if (key.startsWith('x')) {
      for (const e of entries) {
        const parts = resolvePath(e.name.split('/').pop(), env.cwd);
        const parent = lookup(env.root, parts.slice(0, -1));
        if (parent && isDir(parent)) parent.d[parts[parts.length - 1]] = { f: e.text };
      }
      return entries.map((e) => `x ${e.name}`).join('\n');
    }
    throw new UnixError('tar: tar c|t|x [dir]');
  },

  diff: (args, _in, env) => {
    if (args.length < 2) throw new UnixError('diff: diff <file1> <file2>');
    const read = (a) => {
      const n = lookup(env.root, resolvePath(String(a.name || a), env.cwd));
      if (!n) throw new UnixError(`${a.name || a}: no such file or directory`);
      if (!isFile(n)) throw new UnixError(`${a.name || a}: is a directory`);
      return n.f.split('\n');
    };
    const A = read(args[0]);
    const B = read(args[1]);
    // Longest common subsequence, so a line inserted at the top does not report
    // every line after it as changed. The files here are short.
    const m = A.length; const n = B.length;
    const L = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--) {
      for (let j = n - 1; j >= 0; j--) {
        L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
      }
    }
    const out = [];
    let i = 0; let j = 0;
    while (i < m && j < n) {
      if (A[i] === B[j]) { i++; j++; continue; }
      const si = i; const sj = j;
      while (i < m && j < n && A[i] !== B[j] && !(L[i + 1][j] >= L[i][j + 1] ? false : true)) i++;
      while (j < n && (i >= m || A[i] !== B[j]) && L[i][j + 1] >= L[i + 1][j]) j++;
      if (i === si && j === sj) { i++; j++; }
      const del = A.slice(si, i); const add = B.slice(sj, j);
      const rng = (a, b, base) => (b - a <= 1 ? `${base + a + 1}` : `${base + a + 1},${base + b}`);
      const kind = del.length && add.length ? 'c' : (del.length ? 'd' : 'a');
      out.push(`${rng(si, i, 0)}${kind}${rng(sj, j, 0)}`);
      for (const l of del) out.push(`< ${l}`);
      if (del.length && add.length) out.push('---');
      for (const l of add) out.push(`> ${l}`);
    }
    if (i < m || j < n) {
      const del = A.slice(i); const add = B.slice(j);
      const kind = del.length && add.length ? 'c' : (del.length ? 'd' : 'a');
      out.push(`${i + 1}${kind}${j + 1}`);
      for (const l of del) out.push(`< ${l}`);
      if (del.length && add.length) out.push('---');
      for (const l of add) out.push(`> ${l}`);
    }
    return out.join('\n');
  },

  // find(1). The disk holds seven books, the papers, the spool and a system
  // tree; it is big enough to lose something in now.
  find: (args, _in, env) => {
    const strs = args.map((a) => String(a.name || a.v || a));
    const nameAt = strs.indexOf('-name');
    const pat = nameAt >= 0 ? strs[nameAt + 1] : null;
    const startArg = strs.find((a) => a !== '-name' && a !== pat) || '.';
    const start = resolvePath(startArg, env.cwd);
    const root = lookup(env.root, start);
    if (!root) throw new UnixError(`${startArg}: no such file or directory`);
    const re = pat ? new RegExp(`^${pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')}$`, 'i') : null;
    const out = [];
    const walk = (node, parts) => {
      const name = parts[parts.length - 1] || '/';
      if (!re || re.test(name)) out.push(pathString(parts) || '/');
      if (isDir(node)) for (const k of Object.keys(node.d).sort()) walk(node.d[k], [...parts, k]);
    };
    walk(root, start);
    return out.join('\n');
  },

  // du(1), in blocks like the original. The books are the reason this is worth
  // having: seven megabytes of Shakespeare on a twenty-megabyte disk shows up.
  du: (args, _in, env) => {
    const startArg = String((args[0] && (args[0].name || args[0])) || '');
    const start = resolvePath(startArg, env.cwd);
    const root = lookup(env.root, start);
    if (!root) throw new UnixError(`${startArg || '.'}: no such file or directory`);
    const out = [];
    const size = (node, parts) => {
      if (isFile(node)) return Math.max(1, Math.ceil(node.f.length / 512));
      let n = 1;
      for (const k of Object.keys(node.d).sort()) n += size(node.d[k], [...parts, k]);
      out.push(`${String(n).padStart(6)}  ${pathString(parts) || '/'}`);
      return n;
    };
    size(root, start);
    return out.join('\n');
  },

  // od(1), octal dump. What strings will not show you: the bytes themselves.
  od: (args, stdin, env) => {
    const text = inputOf(args.filter((a) => String(a.name || a) !== '-c'), stdin, env);
    const chars = args.some((a) => String(a.name || a) === '-c');
    const bytes = [...text].map((c) => c.charCodeAt(0) & 0xff);
    const lines = [];
    for (let i = 0; i < bytes.length && i < 4096; i += 16) {
      const chunk = bytes.slice(i, i + 16);
      const body = chars
        ? chunk.map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b).padStart(3) : `\\${b.toString(8).padStart(3, '0')}`.slice(0, 4).padStart(4))).join('')
        : chunk.map((b) => b.toString(8).padStart(3, '0')).join(' ');
      lines.push(`${i.toString(8).padStart(7, '0')} ${body}`);
    }
    lines.push(bytes.length.toString(8).padStart(7, '0'));
    return lines.join('\n');
  },

  strings: (args, stdin, env) => {
    const text = inputOf(args, stdin, env);
    const found = text.match(/[\x20-\x7e]{4,}/g) || [];
    return found.length ? found.join('\n') : '(no printable strings)';
  },

  // crypt(1), as V7 had it: a filter with a key. Symmetric, so the same command
  // undoes it. Keep nothing that reports, and carry nothing in the clear.
  crypt: (args, stdin, env) => {
    const key = String(args[0] || '');
    if (!key) throw new UnixError('crypt: give a key — crypt <key> < file');
    const text = inputOf(args.slice(1), stdin, env);
    // A Beaufort step, which is an INVOLUTION: enciphering twice with the same
    // key returns the plaintext, so one command genuinely does both directions.
    // The first cut added the key each time, which meant `crypt k` twice gave
    // gibberish while the manual page promised a round trip. The test caught it,
    // which is the entire reason to write the test before believing the page.
    const LO = 32, SPAN = 95;      // printable ASCII, space included
    let out = '';
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      // Newlines stay newlines so the shape of the file survives.
      if (c === 10) { out += '\n'; continue; }
      if (c < LO || c >= LO + SPAN) { out += text[i]; continue; }
      const k = key.charCodeAt(i % key.length) % SPAN;
      out += String.fromCharCode(LO + (((k - (c - LO)) % SPAN) + SPAN) % SPAN);
    }
    return out;
  },

  // mail(1). Reading is local and always works. Sending queues a file for the
  // store-and-forward network, which is a different thing from sending it.
  mail: (args, _in, env) => {
    const box = lookup(env.root, MAILBOX.concat('e.marsh'));
    const msgs = (box && isFile(box) ? box.f.split('\n.\n') : []).filter(Boolean).map((raw) => {
      const j = parseJob(raw);
      const d = (raw.match(/^Date (.*)$/m) || [])[1] || '';
      return { from: j.from, to: j.to, subject: j.subject, date: d, body: j.body };
    });
    if (!args.length) return formatMailbox(msgs);
    // mail <n>, and the same selector grammar transcribe uses: 2-5, 1,3,7,
    // -all. A numbered list is a numbered list, and there is no reason two
    // commands on the same machine should disagree about how to name one.
    const first = String(args[0].name || args[0].v || args[0]);
    if (/^[-\d*]/.test(first) && !/[!@]/.test(first)) {
      const spec = args.map((a) => String(a.name || a.v || a)).join(',').replace(/,+/g, ',');
      const sel = parseSelection(spec, msgs.length);
      // Keep the old wording for a single out-of-range number and add the
      // count to it, rather than trading one useful message for another.
      if (!sel.ok) {
        const one = /^\d+$/.test(spec) ? `no message ${spec}` : sel.error;
        throw new UnixError(`mail: ${one}. You have ${msgs.length}.`);
      }
      return sel.picks.map((n) => formatMessage(msgs[n - 1], n)).join('\n\n');
    }
    // mail <addr> <file> queues a letter written earlier.
    const to = String(args[0]);
    if (!args[1]) throw new UnixError('mail: write it first, then send it — pico letter, then mail <addr> letter');
    const body = readFileAt(env, args[1]);
    const q = lookup(env.root, SPOOL);
    if (!q || !isDir(q)) throw new UnixError('mail: no spool directory');
    const id = `c${String(Object.keys(q.d).length + 1).padStart(4, '0')}`;
    q.d[id] = file(jobText({ to, subject: args[1], body }));
    const r = routeOf(to);
    return [`Queued as ${id}.`, r.local
      ? 'Local delivery. It will go on the next run.'
      : `Routed via ${r.via}. It goes when this machine is standing next to a relay.`].join('\n');
  },

  // uucp(1): queue any file, not just a letter.
  uucp: (args, _in, env) => {
    if (args.length < 2) throw new UnixError('usage: uucp <file> <node>!<user>');
    const body = readFileAt(env, args[0]);
    const q = lookup(env.root, SPOOL);
    if (!q || !isDir(q)) throw new UnixError('uucp: no spool directory');
    const id = `c${String(Object.keys(q.d).length + 1).padStart(4, '0')}`;
    q.d[id] = file(jobText({ to: String(args[1]), subject: String(args[0]), body }));
    return `Queued as ${id}. Run uustat to see the queue.`;
  },

  uustat: (_a, _in, env) => {
    const q = lookup(env.root, SPOOL);
    const jobs = q && isDir(q) ? Object.entries(q.d).map(([, n]) => parseJob(n.f)) : [];
    return statusReport(jobs, !!(env.relay && env.relay.inRange));
  },

  // uucico(1): the transfer itself. This is the command that makes a hilltop a
  // post office, and the only one on the machine that cares where you are
  // standing. env.relay is supplied by the hub.
  uucico: (_a, _in, env) => {
    const q = lookup(env.root, SPOOL);
    if (!q || !isDir(q)) throw new UnixError('uucico: no spool directory');
    const entries = Object.entries(q.d);
    if (!entries.length) return 'uucico: nothing queued.';
    if (!(env.relay && env.relay.inRange)) {
      return ['uucico: no carrier.',
        'Nothing within reach is willing to take a queue. The relays sit on the',
        'summits, which is the whole idea: you have to carry it up.'].join('\n');
    }
    const jobs = entries.map(([id, n]) => ({ id, ...parseJob(n.f) }));
    const { sent, held } = deliver(jobs);
    for (const j of sent) delete q.d[j.id];
    return [
      `Connected to ${env.relay.code || 'relay'}.`,
      ...sent.map((j) => `  sent    ${j.id}  ${j.to}`),
      ...held.map((h) => `  held    ${h.job.id}  ${h.job.to}   ${h.why}`),
      '',
      `${sent.length} sent, ${held.length} held. Connection closed.`,
    ].join('\n');
  },

  // almanac(1): sun, moon and tide, computed on the machine from the clock it
  // carries. Nothing is asked of anybody. This is what a Torite means by a tool.
  almanac: (_a, _in, env) => {
    const c = env.clock || {};
    const hour = Number.isFinite(c.hour) ? c.hour : 12;
    const hhmm = (h) => `${String(Math.floor(((h % 24) + 24) % 24)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
    const sunrise = 6.5, sunset = 19.75;
    const isNight = hour < sunrise || hour >= sunset;
    const nextEvent = isNight
      ? `sunrise    ${hhmm(sunrise)}   ${hoursTo(hour, sunrise)} away`
      : `sunset     ${hhmm(sunset)}   ${hoursTo(hour, sunset)} away`;
    // Two tides a day, drifting later each day the way real ones do.
    const lowA = 3.2 + ((c.day || 0) * 0.8) % 12;
    const lowB = (lowA + 12.4) % 24;
    return [
      `ALMANAC        ${hhmm(hour)}${isNight ? '   (dark)' : ''}`,
      '',
      `sunrise ...... ${hhmm(sunrise)}`,
      `sunset ....... ${hhmm(sunset)}`,
      `next ......... ${nextEvent}`,
      '',
      `low water .... ${hhmm(lowA)}  and  ${hhmm(lowB)}`,
      'A crossing is shortest either side of low water.',
      '',
      isNight
        ? 'Dark. Their sensors do not need the light and yours do.'
        : 'Light. You can be seen at the distance you can see.',
    ].join('\n');
  },

  wc: (args, stdin, env) => {
    const text = inputOf(args, stdin, env);
    return String(text === '' ? 0 : text.split('\n').length);
  },

  head: (args, stdin, env) => {
    let n = 10, rest = args;
    if (args[0] && /^-\d+$/.test(args[0])) { n = parseInt(args[0].slice(1), 10); rest = args.slice(1); }
    return inputOf(rest, stdin, env).split('\n').slice(0, n).join('\n');
  },

  uname: (args) => (args.includes('-a') ? UNAME_FULL : UNAME),

  // `ifconfig [iface] [up|down]` — the 4.2BSD way to bring a card up, and the
  // gate on the whole web. A fitted card comes up DOWN: nothing is on the air
  // until the operator says so, which means getting online is something you
  // learn to do (`man ifconfig`) rather than something that happens to you.
  ifconfig: (args, _in, env) => {
    const net = env.net;
    const lo = ['lo0: flags=<UP,LOOPBACK,RUNNING>  mtu 16384', '        inet 127.0.0.1 netmask 0xff000000'];
    if (!net || !net.card) {
      if (args[0] && args[0] !== 'lo0') throw new UnixError(`${args[0]}: no such interface`);
      return lo.concat('', 'ifconfig: no such interface').join('\n');
    }
    const iface = net.iface || 'wifi0';
    if (args[0] && args[0] !== iface && args[0] !== 'lo0' && args[0] !== '-a') {
      throw new UnixError(`${args[0]}: no such interface`);
    }
    const verb = (args[1] || args[0] || '').toLowerCase();
    if (verb === 'up' || verb === 'down') {
      const want = verb === 'up';
      if (want === !!net.up) return `${iface}: already ${verb}`;
      net.up = want;
      if (!want) return `${iface}: down`;
      return [
        `${iface}: associating ...`,
        `${iface}: hardware address forged as ${net.spoof.mac}`,
        `${iface}: inet ${net.spoof.ip} netmask 0xffff0000`,
        `${iface}: up. Nothing on this network can follow that address home.`,
      ].join('\n');
    }
    const state = net.up
      ? [`${iface}: flags=<UP,BROADCAST,RUNNING,SPOOFED>  mtu 1500`,
        `        ether ${net.spoof.mac}  (forged)`,
        `        inet ${net.spoof.ip} netmask 0xffff0000`]
      : [`${iface}: flags=<BROADCAST,MULTICAST>  mtu 1500`,
        `        ether ${net.spoof.mac}  (forged)`,
        '        status: down    (ifconfig wifi0 up)'];
    return state.concat(lo).join('\n');
  },

  // The Wireless Tools pair, as they were: iwlist scans, iwconfig associates.
  iwlist: (args, _in, env) => {
    const net = env.net;
    if (!net || !net.card) throw new UnixError('iwlist: no wireless extensions');
    if (!net.up) throw new UnixError(`iwlist: ${net.iface || 'wifi0'} is down — try: ifconfig ${net.iface || 'wifi0'} up`);
    const iface = net.iface || 'wifi0';
    const wants = args.filter((a) => a !== iface);
    if (wants.length && wants[0] !== 'scan') throw new UnixError(`iwlist ${iface} scan`);
    const nets = (net.networks && net.networks()) || [];
    const out = [`${iface}     Scan completed :`];
    nets.forEach((n, i) => {
      out.push(`          Cell ${String(i + 1).padStart(2, '0')} - Address: ${apMac(n.essid)}`);
      out.push(`                    ESSID:"${n.essid}"`);
      out.push(`                    Mode:Master  Channel:${(i * 5) + 1}`);
      out.push(`                    Quality:${n.signal}/100  Signal level:-${110 - n.signal} dBm`);
      if (n.note) out.push(`                    Extra: ${n.note}`);
    });
    if (!nets.length) out.push('          No scan results');
    return out.join('\n');
  },

  iwconfig: (args, _in, env) => {
    const net = env.net;
    if (!net || !net.card) return 'lo        no wireless extensions.';
    const iface = net.iface || 'wifi0';
    const rest = args.filter((a) => a !== iface);
    if (rest.length) {
      if (rest[0] !== 'essid') throw new UnixError(`iwconfig ${iface} essid <name>`);
      const want = rest[1];
      if (!want) throw new UnixError(`iwconfig ${iface} essid <name>`);
      if (!net.up) throw new UnixError(`iwconfig: ${iface} is down — try: ifconfig ${iface} up`);
      const nets = (net.networks && net.networks()) || [];
      const found = nets.find((n) => n.essid.toLowerCase() === String(want).toLowerCase());
      if (!found) return `iwconfig: ${want}: no such network in range`;
      if (net.associate) net.associate(found.essid);
      return [`${iface}     associating with "${found.essid}"...`,
        `          Access Point: ${apMac(found.essid)}   Quality:${found.signal}/100`,
        `          ${net.spoof.ip}  forged  ${net.spoof.mac}`,
        '          Associated. Open netscape to browse what this network serves.'].join('\n');
    }
    if (!net.up) return `${iface}     radio off`;
    const cur = net.essid || '';
    const nets = (net.networks && net.networks()) || [];
    const n = nets.find((x) => x.essid === cur) || { signal: 0 };
    return [`${iface}     IEEE 802.11  ESSID:"${cur}"`,
      `          Mode:Managed  Access Point: ${apMac(cur)}`,
      '          Bit Rate:2 Mb/s   Tx-Power:15 dBm',
      `          Link Quality:${n.signal}/100  Signal level:-${110 - n.signal} dBm`,
      'lo        no wireless extensions.'].join('\n');
  },

  // The local sweep. `ping` needs a name before it will tell you anything, which
  // is no use when the thing you lack IS the name. This answers the other
  // question: what is near me, and what is each one called.
  arp: (args, _in, env) => {
    const net = env.net;
    if (!net || !net.card) throw new UnixError('arp: no network card fitted');
    if (!net.up) throw new UnixError(`arp: ${net.iface || 'wifi0'} is down — try: ifconfig ${net.iface || 'wifi0'} up`);
    if (!net.local) return 'arp: no entries';
    if (args[0] && args[0] !== '-a') throw new UnixError('arp -a');
    const seen = net.local();
    if (!seen.length) return 'arp: no entries — nothing within range';

    // FILED UNDER THE TOWERS. A flat list of thirty names sorted by range tells
    // you what is near; it does not tell you whose it is, which is the question
    // you are actually asking before you post a program to one of four
    // identical machines. Each node prints its own line, its units indented
    // beneath it (David, 2026-08-15).
    const w = Math.max(1, ...seen.map((e) => String(e.host || '').length));
    const line = (e, indent) => [
      indent + String(e.host || '?').padEnd(w - indent.length),
      `(${e.ip})`.padEnd(14),
      `at ${e.mac}`,
      ` ${String(e.range).padStart(3)}m ${String(e.bearing || '?').padEnd(3)}`,
      e.tag ? ` «${e.tag}»` : '',
      e.down ? ' [no answer]' : '',
    ].join(' ').replace(/\s+$/, '');

    const nodes = seen.filter((e) => e.kind === 'obelisk' || e.kind === 'factory');
    const units = seen.filter((e) => !(e.kind === 'obelisk' || e.kind === 'factory'));
    // No node in range: there is nothing to file under, so the sweep is the
    // flat nearest-first list it always was. Grouping by an absent tower would
    // be a heading with everything under it.
    if (!nodes.length) return units.map((e) => line(e, '')).join('\n');
    const out = [];
    const filed = new Set();
    for (const n of nodes) {
      out.push(line(n, ''));
      const mine = units.filter((u) => u.home && u.home === n.code);
      for (const u of mine) { out.push(line(u, '  ')); filed.add(u); }
      if (!mine.length) out.push('    (no units of this node in range)');
    }
    // Machines whose own node is out of range still answer, and still belong to
    // somewhere. Grouped under the code they are mustered to, so the sweep never
    // silently drops a machine it heard.
    const orphans = units.filter((u) => !filed.has(u));
    const byHome = new Map();
    for (const u of orphans) {
      const k = u.home || '(no node)';
      if (!byHome.has(k)) byHome.set(k, []);
      byHome.get(k).push(u);
    }
    for (const [code, list] of byHome) {
      out.push(`${code}  — out of range, its units answer:`);
      for (const u of list) out.push(line(u, '  '));
    }
    return out.join('\n');
  },

  // `scan` — the towers on the network you are associated with, with their codes
  // and addresses, so you can find an obelisk to telnet/ping without opening
  // Netscape. Where `arp` hears the machines in radio range, this reads the
  // whole subnet off the wire.
  scan: (args, _in, env) => {
    const net = env.net;
    if (!net || !net.card) throw new UnixError('scan: no network card fitted');
    if (!net.up) throw new UnixError(`scan: ${net.iface || 'wifi0'} is down — try: ifconfig ${net.iface || 'wifi0'} up`);
    const obs = net.obs ? net.obs() : [];
    if (!obs.length) return 'scan: no obelisks on this network';
    const w = Math.max(4, ...obs.map((o) => String(o.code || o.host || '').length));
    const rows = obs.map((o) => `  ${String(o.code || '?').padEnd(w)}  ${String(o.ip || '?').padEnd(12)}${o.tag ? `  «${o.tag}»` : ''}${o.down ? '  [down]' : ''}`);
    return [`obelisks on ${net.essid || 'the wire'}:`, ...rows].join('\n');
  },

  // `watermark <file>` — is this file machine-made or human-made?
  //
  // Everything the machines wrote is signed; nothing you write is. So the
  // detector, run in this world, detects HUMANS — which is the joke, and also
  // genuinely useful: in a pile of salvage the unmarked files are the ones a
  // person made, and those are the ones worth reading.
  watermark: (args, _in, env) => {
    const name = args[0] && String(args[0]);
    if (!name) throw new UnixError('watermark <file>');
    const parts = resolvePath(name, env.cwd);
    const n = lookup(env.root, parts);
    if (!n) throw new UnixError(`watermark: ${name}: no such file`);
    if (!isFile(n)) throw new UnixError(`watermark: ${name}: is a directory`);
    // The shipped disk is the reference copy: identical bytes at the same path
    // means this is exactly what the foundry pressed.
    const fresh = lookup(makeDisk(), parts);
    const stock = fresh && isFile(fresh) ? fresh.f : null;
    const marked = stock != null && stock === n.f;
    if (env.onAchieve) env.onAchieve('watermarkRead', { file: parts.join('/') });
    return marked
      ? [`${name}: VALID — machine-generated`,
         'RON content credentials v0.4 · signature intact',
         'Pressed at the foundry and unmodified since.'].join('\n')
      : [`${name}: NONE — human-made, or scrubbed`,
         stock == null
           ? 'No reference copy exists: nothing in the estate ever wrote this file.'
           : 'A reference copy exists and does not match: this one has been edited.',
         'Filed: suspiciously human.'].join('\n');
  },

  ping: (args, _in, env) => {
    const net = env.net;
    if (!args[0]) throw new UnixError('ping <host>');
    if (!net || !net.card) throw new UnixError('ping: no network card fitted');
    if (!net.up) throw new UnixError(`ping: ${net.iface || 'wifi0'} is down — try: ifconfig ${net.iface || 'wifi0'} up`);
    const h = net.find ? net.find(args[0]) : null;
    if (!h) return `ping: unknown host ${args[0]}`;
    if (h.down) return [`PING ${h.host} (${h.ip}): 56 data bytes`, '', `--- ${h.host} ping statistics ---`,
      '3 packets transmitted, 0 packets received, 100% packet loss'].join('\n');
    return [`PING ${h.host} (${h.ip}): 56 data bytes`,
      `64 bytes from ${h.ip}: icmp_seq=0 ttl=64 time=2.${(h.ip.length * 7) % 90} ms`,
      `64 bytes from ${h.ip}: icmp_seq=1 ttl=64 time=1.${(h.ip.length * 13) % 90} ms`,
      '', `--- ${h.host} ping statistics ---`,
      '2 packets transmitted, 2 packets received, 0% packet loss'].join('\n');
  },

  help: (_a, _in, env) => [
    'commands on this machine:',
    '  ls  cd  pwd  cat  echo  man  mkdir  rm  cp  mv',
    '  grep  wc  head  tail  sort  uniq  more  sh  uname  who  ps  df  uptime',
    '  strings  crypt  almanac  mail  uucp  uustat  uucico',
    '  ml  pico  ed  pdf-viewer  book  transcribe  help',
    '  ifconfig  iwlist  iwconfig  wifi  arp  scan  ping  netscape  telnet  post  charge',
    '  watermark  mount  eject',
    ...(hasFile(env, 'sniffer') ? ['  sniffer      (RON)'] : []),
    '',
    '  |  pipes one into the next     cat readme | grep machine',
    '  >  writes output to a file     echo "hi" > note',
    '',
    '  ml            start AI-ML (practise the language, off their control wire)',
    '  ml hello.ml   run a saved program',
    '  ls demos      programs that run HERE',
    '  cat robots_code/readme.txt    programs for the MACHINES, and what they can sense',
    '  man <cmd>     read the manual for a command',
    ...(env && env.net && env.net.card
      ? ['',
        env.net.up
          ? '  netscape      browse what is left of the internet'
          : '  ifconfig wifi0 up   bring the card up, then: netscape']
      : []),
  ].join('\n'),
};

// Every name a player can actually type: the built-ins, plus the programs the
// hub owns (editors, browser, readers) that this module only dispatches to,
// plus the ones we answer for and do not have. One list, because a test walks
// it to check that each has a page in /usr/man. Seven commands once shipped
// without one and nothing noticed for five versions.
export const HOOK_COMMANDS = [
  'ml', 'pico', 'ed', 'netscape', 'www', 'pdf-viewer', 'pdf', 'book',
  'transcribe', 'telnet', 'post', 'charge', 'vi', 'vim', 'emacs', 'nano',
  'sleep', 'reboot', 'halt', 'suspend', 'save', 'wifi', 'sniffer', 'more', 'get',
  'bluebox',
];

// A selector for any command that acts on a numbered list: `3`, `2-5`, `1,3,7`,
// `1-3,9`, or `-all`. Returns 1-based indices, deduplicated and in order.
// Reversed ranges (`5-2`) read the same as forward ones, because a person
// typing quickly should not have to care. Pure, so it is tested rather than
// clicked at: the whole point of putting it here is that main.js cannot be.
export function parseSelection(spec, count) {
  const s = String(spec == null ? '' : spec).trim().toLowerCase();
  if (!s) return { ok: false, error: 'nothing selected' };
  if (s === '-all' || s === '--all' || s === 'all' || s === '*') {
    return { ok: true, all: true, picks: Array.from({ length: count }, (_, i) => i + 1) };
  }
  const picks = [];
  for (const part of s.split(',').map((x) => x.trim()).filter(Boolean)) {
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) return { ok: false, error: `cannot read "${part}"` };
    const a = Number(m[1]);
    const b = m[2] == null ? a : Number(m[2]);
    if (a < 1 || b < 1 || a > count || b > count) return { ok: false, error: `out of range: ${part}` };
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    for (let i = lo; i <= hi; i++) picks.push(i);
  }
  return { ok: true, all: false, picks: [...new Set(picks)] };
}

export const COMMAND_NAMES = [...new Set([...Object.keys(COMMANDS), ...HOOK_COMMANDS])].sort();


// Write (or overwrite) a file, making no directories on the way.
export function writeFile(env, path, text) {
  const parts = resolvePath(path, env.cwd);
  const at = parentOf(env.root, parts);
  if (!at) throw new UnixError(`${path}: no such directory`);
  if (isDir(at.parent.d[at.name])) throw new UnixError(`${path}: is a directory`);
  at.parent.d[at.name] = file(text);
  return '';
}

// Split a line into words, respecting "quoted strings" so `echo "a b"` is one arg.
function words(line) {
  const out = [];
  let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { q = !q; continue; }
    if (!q && /\s/.test(c)) { if (cur) { out.push(cur); cur = ''; } continue; }
    cur += c;
  }
  if (cur) out.push(cur);
  return out;
}

// Run ONE line: a `|` chain of commands, with an optional `> file` on the end.
// `hooks.ml` lets the hub bolt the AI-ML sandbox on as a command without this
// module having to know the language exists (it stays pure and testable).
export function runUnix(line, env, hooks = {}) {
  const src = String(line == null ? '' : line).trim();
  if (!src || src.startsWith('#')) return { ok: true, text: '' };

  // Trailing redirect: everything after the last top-level `>` names a file.
  let redirect = null, body = src;
  const gt = src.lastIndexOf('>');
  if (gt >= 0) {
    const target = src.slice(gt + 1).trim();
    if (target && !target.includes('|')) { redirect = words(target)[0]; body = src.slice(0, gt); }
  }

  try {
    let stdin = null, out = '';
    for (const stage of body.split('|')) {
      const w = words(stage.trim());
      if (!w.length) throw new UnixError('empty command in the pipe');
      const name = w[0].toLowerCase();
      const args = w.slice(1);
      // `ml` is a MODE, not a filter — the hub owns it (like ELIZA at the
      // obelisk console), so it is handed straight back rather than piped.
      if (name === 'ml') {
        if (!hooks.ml) throw new UnixError('no ML on this machine');
        return hooks.ml(args, env);
      }
      // ed takes the screen until you quit it, so the hub owns the mode.
      if (name === 'ed') {
        if (!hooks.ed) throw new UnixError('no editor on this machine');
        return hooks.ed(args, env);
      }
      // telnet. Not V7 — TCP/IP reached UNIX with 4.2BSD — but this build has a
      // wireless card, a resolver and a browser, so it has a stack. It is the
      // tool that matters most on this network: it is how you speak to a server
      // in its own words instead of letting the browser do it for you.
      if (name === 'telnet') {
        if (!hooks.telnet) throw new UnixError('no network stack on this machine');
        if (!env.net || !env.net.card) throw new UnixError('telnet: no network card fitted');
        if (!env.net.up) throw new UnixError('telnet: wifi0 is down. try: ifconfig wifi0 up');
        return hooks.telnet(args, env);
      }
      // transcribe(1): type a scrap you are carrying into a file. The hub owns
      // it because only the world knows what you have picked up.
      if (name === 'transcribe') {
        if (!hooks.transcribe) throw new UnixError('transcribe: nothing to type from');
        return hooks.transcribe(args, env);
      }
      // A book opens in the browser, which is the reader this machine already
      // has for a page. No card needed: the files are on the disk.
      if (name === 'book') {
        if (!hooks.book) throw new UnixError('no browser on this machine');
        return hooks.book(args, env);
      }
      // The document reader. Same contract as pico: the hub owns the window.
      // Two names for one program: `pdf-viewer` is what it calls itself in its
      // own title bar, `pdf` is the link in /bin because nobody types the long
      // one twice. A period machine would do this with ln, and did.
      if (name === 'pdf-viewer' || name === 'pdf') {
        if (!hooks.pdf) throw new UnixError('no document reader on this machine');
        return hooks.pdf(args, env);
      }
      // Power and time. All four need the hub, because they act on the world
      // or on the session rather than on the disk: sleep advances the clock,
      // suspend drops the card, reboot clears what is in memory and reprints
      // the banner, halt stops. The disk is untouched by every one of them.
      if (name === 'sleep' || name === 'reboot' || name === 'halt' || name === 'suspend') {
        if (!hooks[name]) throw new UnixError(`${name}: not permitted`);
        return hooks[name](args, env);
      }
      // save(1). Not a V7 command and not a file operation: it writes the
      // RUN — where you are standing, what you are carrying — to a checkpoint
      // the title screen can load. The hub owns it because none of that is on
      // this disk.
      if (name === 'save') {
        if (!hooks.save) throw new UnixError('save: nothing to save from here');
        return hooks.save(args, env);
      }
      // The pager. It holds the screen, so the hub owns it, same as pico.
      if (name === 'more') {
        if (!hooks.more) throw new UnixError('more: not on this machine');
        return hooks.more(args, env, stdin);
      }
      // RON's scope. It is not part of this machine: the shell refuses it until
      // the file is on the disk, because that is what installing software was.
      if (name === 'sniffer') {
        if (!hooks.sniffer) throw new UnixError('sniffer: no wireless extensions');
        return hooks.sniffer(args, env);
      }
      // The wireless picker. A window, so the hub owns it — same contract as
      // pico and the document reader.
      if (name === 'wifi') {
        if (!hooks.wifi) throw new UnixError('wifi: no wireless extensions');
        return hooks.wifi(args, env);
      }
      // pico: the same deal, and the one you actually want.
      if (name === 'pico') {
        if (!hooks.pico) throw new UnixError('no editor on this machine');
        return hooks.pico(args, env);
      }
      // Editors this machine does not have, named because a player will type
      // them. Pointing at the one that IS here beats "command not found".
      if (name === 'nano' || name === 'vi' || name === 'vim' || name === 'emacs') {
        throw new UnixError(`${name}: not on this machine. The editor here is pico.`);
      }
      // POST a file back to a machine that serves one. The wire is the same one
      // Netscape uses, so it needs the card up.
      if (name === 'post') {
        if (!hooks.post) throw new UnixError('no network stack on this machine');
        if (!env.net || !env.net.card) throw new UnixError('post: no network card fitted');
        if (!env.net.up) throw new UnixError('post: wifi0 is down. try: ifconfig wifi0 up');
        return hooks.post(args, env);
      }
      // #121: LOAD the bluebox. Note what is NOT checked here — no card, no
      // wifi0, no address. The bluebox is clips and a soldering job, and that
      // is the whole difference between it and `post`: it writes to a machine
      // lying at your feet out where there is no tower left to route through.
      if (name === 'bluebox') {
        if (!hooks.bluebox) throw new UnixError('bluebox: nothing here to load one from');
        return hooks.bluebox(args, env);
      }
      // CHARGE a flat unit home to its tower on its reserve cell — a recovery
      // command over the same wire, not a program (a flat unit runs nothing).
      if (name === 'charge') {
        if (!hooks.charge) throw new UnixError('no network stack on this machine');
        if (!env.net || !env.net.card) throw new UnixError('charge: no network card fitted');
        if (!env.net.up) throw new UnixError('charge: wifi0 is down. try: ifconfig wifi0 up');
        return hooks.charge(args, env);
      }
      // GET a served resource off a unit — the read half of the same wire
      // `post` writes on, so the same card/up checks. Read is free; write is
      // the escalation.
      if (name === 'get') {
        if (!hooks.get) throw new UnixError('no network stack on this machine');
        if (!env.net || !env.net.card) throw new UnixError('get: no network card fitted');
        if (!env.net.up) throw new UnixError('get: wifi0 is down. try: ifconfig wifi0 up');
        const g = hooks.get(args, env);
        // `get <addr> > file` writes the fetched bytes to the file rather than
        // to the screen — the read half of the scriptable loop. A failed read
        // does not create the file; its error surfaces instead.
        if (g && g.ok && redirect != null) { writeFile(env, redirect, g.text ?? ''); return { ok: true, text: '' }; }
        return g;
      }
      // Netscape is a MODE too — it takes the screen until you quit, so the hub
      // owns it and this module only hands the arguments over.
      if (name === 'netscape' || name === 'www') {
        if (!hooks.netscape) throw new UnixError('no browser on this machine');
        if (!env.net || !env.net.card) throw new UnixError('netscape: no network card fitted');
        if (!env.net.up) throw new UnixError(`netscape: ${env.net.iface || 'wifi0'} is down — try: ifconfig ${env.net.iface || 'wifi0'} up`);
        return hooks.netscape(args, env);
      }
      if (name === 'sh') {
        const script = inputOf(args, stdin, env);
        const lines = [];
        for (const l of script.split('\n')) {
          if (!l.trim() || l.trim().startsWith('(*')) continue;
          const r = runUnix(l, env, hooks);
          if (r.mode) return r;                       // a script that starts ML hands over
          if (r.text) lines.push(r.text);
        }
        out = lines.join('\n');
        stdin = out;
        continue;
      }
      const cmd = COMMANDS[name];
      if (!cmd) throw new UnixError(`${w[0]}: not found. type help`);
      out = cmd(args, stdin, env) ?? '';
      stdin = out;
    }
    if (redirect != null) { writeFile(env, redirect, out); return { ok: true, text: '' }; }
    return { ok: true, text: out };
  } catch (e) {
    if (e instanceof UnixError) return { ok: false, text: `${e.message}` };
    return { ok: false, text: e.message || 'command failed' };
  }
}

// A fresh shell environment over a disk. `cwd` starts at /home, because the
// first thing you should find is the readme and the two example programs.
// Copy a salvaged archive into /salvage/<owner> on a disk. Returns the file
// names written, so the hub can say what was recovered.
export function graftSalvage(root, archive) {
  if (!root.d.salvage) root.d.salvage = dir({});
  const box = dir({});
  for (const [name, text] of Object.entries(archive.files)) box.d[name] = file(text);
  root.d.salvage.d[archive.owner] = box;
  return Object.keys(archive.files);
}

export function newShell(disk) {
  return { root: disk || makeDisk(), cwd: ['home'] };
}
