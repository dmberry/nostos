// A small UNIX for the laptop — the first computer in the game that is YOURS.
// Design: docs/laptop-plan.md.
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

export class UnixError extends Error {}

// ---- Filesystem ---------------------------------------------------------
// A directory is {d: {name: node}}, a file is {f: 'text'}. Deliberately tiny:
// the whole disk is a plain object, so it serialises straight into a save.

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
// just a file read — the documentation IS on the disk, which is the whole
// argument for the open machine), and `/home` is yours to write into.

const MAN = {
  ls: 'ls [-l] [path]\n  List a directory. -l gives the long form (size, kind).',
  cd: 'cd [path]\n  Change directory. `cd` alone goes home, `cd ..` goes up.',
  pwd: 'pwd\n  Print the working directory.',
  cat: 'cat <file>\n  Print a file. Pipe it: cat notes | grep ml',
  echo: 'echo <text>\n  Print text. Redirect it: echo "hi" > note',
  man: 'man <topic>\n  Read the manual for a command. The pages live in /usr/man.',
  rm: 'rm <file>\n  Remove a file.',
  mv: 'mv <a> <b>\n  Move or rename.',
  cp: 'cp <a> <b>\n  Copy.',
  mkdir: 'mkdir <dir>\n  Make a directory.',
  grep: 'grep <pattern> [file]\n  Print matching lines. Reads a pipe if no file is given.',
  wc: 'wc [file]\n  Count lines. Reads a pipe if no file is given.',
  head: 'head [-n] [file]\n  First lines only (default 10). Reads a pipe if no file is given.',
  sh: 'sh <file>\n  Run a file of shell commands, one per line.',
  uname: 'uname [-a]\n  Name the system.',
  ml: 'ml [file.ml]\n  Enter AI-ML, or run a saved program.\n\n  This machine has no card for POSEIDON\'s CONTROL wire, so the tower verbs\n  (scan, hack, crash) are not here and never will be. What IS here is the\n  language itself: let, fn, if, arithmetic, strings, ; and recursion.\n  Practise here, run it at a tower.\n\n  let fact n = if n == 0 then 1 else n * fact (n - 1)\n  fact 5',
  ifconfig: 'ifconfig [iface] [up|down]\n  Configure a network interface.\n\n  With no arguments, report every interface and its state. The wireless\n  card is built into this machine, and it comes up DOWN — nothing is on\n  the air until you say so:\n\n    ifconfig wifi0 up\n\n  The card forges its address and hardware id on every association,\n  so the network answers it and nothing can follow the answer home. It\n  reaches the WEB only. There is no route to the control wire from here.',
  ping: 'ping <host>\n  Ask a host whether it is there. Takes an address (10.1.1.2) or a name.',
  pdf: [
    'pdf [file]',
    '  Open a document. With no file, list what is on the disk.',
    '',
    '    pdf cult_of_ignorance.pdf',
    '',
    '  The papers are in /home/pdf. They are scans, so `cat` will not help you:',
    '  it prints the header and tells you to use this instead.',
    '  Press X or Escape to close the reader.',
  ].join('\n'),
  pico: [
    'pico [file]',
    '  A screen editor. Type into it; the control keys are along the bottom.',
    '',
    '  ^O   write the file out        ^K   cut the line',
    '  ^X   leave (it asks first)     ^U   put it back',
    '  ^W   find text                 ^G   help',
    '',
    '  Use this one. ed is here because it always was, but pico tells you how',
    '  to get out of it, which ed has never once done for anybody.',
  ].join('\n'),
  post: [
    'post <file> <unit>',
    '  Send a file to a machine that serves one. In practice: put a program',
    '  back into a unit.',
    '',
    '    post t1_03.ml t1_03',
    '',
    '  The unit picks it up on its next decision, a quarter of a second later.',
    '  A program that will not run does not bounce: the machine takes it, faults,',
    '  and stands there with its lamp flashing amber until you send a better one.',
    '  Needs the card up (ifconfig wifi0 up).',
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

const README = [
  'This machine is yours.',
  '',
  'Everything here is a file. The manual is a file. The programs are files.',
  'Nothing on it is sealed, which is the whole reason you can read it.',
  '',
  'The wireless card is built in and it lies about itself every time it',
  'associates, so you can go and look at what they are serving without',
  'anything being able to look back. It brings up DOWN. That is deliberate.',
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

export function makeDisk() {
  const man = {};
  for (const [k, v] of Object.entries(MAN)) man[k] = file(v);
  return dir({
    bin: dir({}),                     // the commands are built in; /bin is scenery
    etc: dir({ motd: file('Reality Or Nothing.') }),
    usr: dir({
      man: dir(man),
      games: dir({}),                 // L7: ADVENTURE, Spacewar!
      lib: dir({}),
    }),
    home: dir({
      'readme': file(README),
      'hello.ml': file(HELLO_ML),
      'count.ml': file(COUNT_ML),
      // Where the browser puts anything it fetches off the network — a machine's
      // program.ml, mostly. Kept apart from your own files so a download can
      // never quietly overwrite something you wrote.
      download: dir({}),
      // The previous owner's papers (pdfs.js). Real documents, shipped as
      // assets; `cat` gets a header and a pointer, `pdf` opens the reader.
      pdf: dir(Object.fromEntries(PDFS.map((d) => [d.name, file(pdfStub(d))]))),
    }),
  });
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
const UNAME_FULL = 'UNIX V7 (RON build) — portable, unnetworked, yours';

function readFileAt(env, path) {
  const parts = resolvePath(path, env.cwd);
  const n = lookup(env.root, parts);
  if (!n) throw new UnixError(`${path}: no such file or directory`);
  if (isDir(n)) throw new UnixError(`${path}: is a directory`);
  return n.f;
}

// Text in, text out: the filters that make a pipe worth having.
function inputOf(args, stdin, env) {
  if (args.length) return readFileAt(env, args[0]);
  if (stdin != null) return stdin;
  throw new UnixError('nothing to read — give a file or pipe one in');
}

const COMMANDS = {
  pwd: (_a, _in, env) => pathString(env.cwd) || '/',

  ls: (args, _in, env) => {
    const long = args.includes('-l');
    const rest = args.filter((a) => a !== '-l');
    const parts = resolvePath(rest[0] || '', env.cwd);
    const n = lookup(env.root, parts);
    if (!n) throw new UnixError(`${rest[0] || pathString(parts)}: no such file or directory`);
    if (isFile(n)) return rest[0];
    const names = Object.keys(n.d).sort();
    if (!names.length) return '';
    if (!long) return names.join('  ');
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
      return lo.concat('', 'No wireless card is fitted to this machine.').join('\n');
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
    '  grep  wc  head  sh  uname  ml  pico  ed  pdf  help',
    '  ifconfig  ping  netscape  post',
    '',
    '  |  pipes one into the next     cat readme | grep machine',
    '  >  writes output to a file     echo "hi" > note',
    '',
    '  ml            start AI-ML (practise the language, off their control wire)',
    '  ml hello.ml   run a saved program',
    '  man <cmd>     read the manual for a command',
    ...(env && env.net && env.net.card
      ? ['',
        env.net.up
          ? '  netscape      the card is UP — go and look at what they are serving'
          : '  ifconfig wifi0 up   bring the card up, then: netscape']
      : []),
  ].join('\n'),
};

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
      // The document reader. Same contract as pico: the hub owns the window.
      if (name === 'pdf') {
        if (!hooks.pdf) throw new UnixError('no document reader on this machine');
        return hooks.pdf(args, env);
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
