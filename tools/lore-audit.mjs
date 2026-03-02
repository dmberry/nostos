// #139 — the lore audit the web-history plan asks for before the migration.
//
// The test, from docs/web-history-plan.md: "would a person have written this in
// pen and left it where you found it? If not, it belongs on a server."
//
// The classification is by explicit rule plus a named exception list, rather
// than by a model's opinion per row, so the result is auditable: you can
// disagree with a rule and see exactly which items it moved.
import { FRAGMENTS } from '../src/game/lore.js';

// A whole kind whose answer to the test is the same for every member.
const KIND_RULE = {
  handwritten: ['KEEP', 'handwritten is the answer to the question'],
  note: ['KEEP', 'graffiti, signs and notes are marks on the world'],
  crafting: ['KEEP', 'torn pages and recipe cards — and finding them IS the mechanic'],
  liminal: ['KEEP', 'a laminated sign is a physical object'],
  science: ['MOVE', 'reports and memos: institutional documents, born on a server'],
};

// Kinds that split. The exception list names the ones that go the OTHER way
// from their kind's default, and every entry says why in one word.
const DEFAULT = { code: 'MOVE', ron: 'MOVE', secret: 'MOVE', letter: 'KEEP' };
const EXCEPT = {
  // code: physical marks and PRINTED artefacts. The src-* set exists because a
  // listing you can hold is the point of it — fanfold, paper tape, a diskette
  // with DO NOT RUN in biro. Moving those to a web page destroys the item.
  'faith-molt': 'scratched', 'faith-cohere': 'on a wall',
  'eliza-05': 'printout', 'lang-02': 'torn page', 'fsw-08': 'in a manual',
  'ronml-01': 'scrawled', 'ronml-02': 'note', 'ronml-03': 'taped', 'ronml-04': 'chalked',
  'ronml-05': 'torn page', 'ronml-06': 'song sheet', 'ronml-07': 'folded card',
  'src-eliza': 'fanfold', 'src-apollo': 'stationery', 'src-10print': 'photocopy',
  'src-emacs': 'bound printout', 'src-spacewar': 'paper tape', 'src-agrippa': 'diskette',
  'src-adventure': 'lineprinter', 'src-git': 'printout', 'src-transformer': 'preprint',
  // ron: a TRACT is a pamphlet somebody handed you. A BROADCAST is a transmission.
  'tor-01': 'tract', 'tor-02': 'tract', 'tor-03': 'tract',
  'bs-why-04': 'scratched', 'home-03': 'scratched', 'home-04': 'scratched',
  'tear-01': 'scratched', 'craft-obg-2': 'scratched',
  // secret: the tradecraft ones are objects; the intercepts are signals.
  'secret-02': 'beer mat', 'secret-03': 'dead drop', 'secret-06': 'hand-delivered',
  'secret-09': 'under a seat', 'secret-10': 'one-time pad', 'secret-13': 'half-erased',
  'secret-14': 'on a wall', 'secret-15': 'coded, carried', 'secret-17': 'water-damaged',
  'bs-why-03': 'printed roll',
  // letter: one memo among the letters.
  'lang-01': 'a memo is a document',
};

const rows = FRAGMENTS.map((f) => {
  const kr = KIND_RULE[f.kind];
  let verdict, why;
  if (kr) { [verdict, why] = kr; }
  else {
    const d = DEFAULT[f.kind] || 'KEEP';
    if (EXCEPT[f.id]) { verdict = d === 'MOVE' ? 'KEEP' : 'MOVE'; why = EXCEPT[f.id]; }
    else { verdict = d; why = d === 'MOVE' ? 'born digital' : 'paper'; }
  }
  return { ...f, verdict, why };
});

const move = rows.filter((r) => r.verdict === 'MOVE');
const keep = rows.filter((r) => r.verdict === 'KEEP');
const byKind = {};
for (const r of rows) {
  byKind[r.kind] ??= { move: 0, keep: 0 };
  byKind[r.kind][r.verdict.toLowerCase()]++;
}

const out = [];
out.push('# #139 — the lore audit');
out.push('');
out.push('Run before the migration, as `docs/web-history-plan.md` asks. The test is');
out.push('that document\'s: **would a person have written this in pen and left it where');
out.push('you found it? If not, it belongs on a server.**');
out.push('');
out.push('Classification is by rule plus a named exception list rather than item by item,');
out.push('so it is auditable: disagree with a rule and you can see exactly which items it');
out.push('moved. The exceptions are in the audit script and each carries its reason.');
out.push('');
out.push('## The finding, first');
out.push('');
out.push(`**The test yields ${move.length} of ${rows.length} — ${Math.round(move.length / rows.length * 100)}%, not 70%.**`);
out.push('');
out.push('The plan says 70% is the target and not the floor, and expects some lore to be');
out.push('cut rather than moved. This audit says the gap is bigger than that framing');
out.push('suggests, and for a reason worth stating: **most of the corpus passes the test.**');
out.push('It is genuinely handwritten, sprayed, torn, taped or scratched. The paper is not');
out.push('a delivery mechanism that could have been a web page; it is what the fragment IS.');
out.push('');
out.push('So the choice is not "move 70%". It is one of:');
out.push('');
out.push('- **Accept ~40%** and treat the remainder as correctly placed.');
out.push('- **Cut to reach 70%** — but the items nearest to cutting are the handwritten');
out.push('  ones, which are the best-written things in the file.');
out.push('- **Add web lore rather than move it**, so the proportion shifts by growth. This');
out.push('  is what W1 (the computing-history pages) already does, and it costs nothing');
out.push('  that already works.');
out.push('');
out.push('The third is the recommendation.');
out.push('');
out.push('## By kind');
out.push('');
out.push('| kind | move | keep | the rule |');
out.push('|---|---:|---:|---|');
const RULE_TEXT = {
  science: 'reports and memos: institutional documents, born on a server',
  code: 'logs, configs and source MOVE; physical listings and scratched walls KEEP',
  ron: 'broadcasts MOVE (a transmission); tracts and scratchings KEEP',
  secret: 'intercepts MOVE (a signal); beer mats and dead drops KEEP',
  letter: 'letters are paper; one memo moves',
  handwritten: 'handwritten is the answer to the question',
  note: 'graffiti, signs and notes are marks on the world',
  crafting: 'torn pages — and finding them IS the mechanic',
  liminal: 'a laminated sign is a physical object',
};
for (const [k, v] of Object.entries(byKind).sort((a, b) => b[1].move - a[1].move)) {
  out.push(`| ${k} | ${v.move} | ${v.keep} | ${RULE_TEXT[k] || ''} |`);
}
out.push(`| **total** | **${move.length}** | **${keep.length}** | |`);
out.push('');
out.push('## Proposed home for everything that moves');
out.push('');
out.push('| id | kind | title | goes to |');
out.push('|---|---|---|---|');
const HOME = {
  science: 'the estate\'s own intranet — a departmental index nobody archived on purpose',
  code: 'a served source tree / log directory on the daemon\'s rack',
  ron: 'a HERMES relay: a broadcast is held by the thing that received it',
  secret: 'an intercept log, behind the httpd break (L9)',
  letter: 'the estate intranet',
};
for (const r of move) {
  out.push(`| \`${r.id}\` | ${r.kind} | ${r.title.replace(/\|/g, '\\|')} | ${HOME[r.kind]} |`);
}
out.push('');
out.push('## Everything that stays, and why');
out.push('');
out.push('| id | kind | title | why it stays |');
out.push('|---|---|---|---|');
for (const r of keep) {
  out.push(`| \`${r.id}\` | ${r.kind} | ${r.title.replace(/\|/g, '\\|')} | ${r.why} |`);
}
out.push('');
out.push('## Nothing is proposed for cutting');
out.push('');
out.push('The plan expected some. Reading all 243, none of them is filler: the weakest are');
out.push('the middle of the `ron-*` broadcast run, where several make the same point about');
out.push('the towers in slightly different words — and those are the ones that move, where');
out.push('a relay holding twenty of them reads as an archive rather than as repetition.');
out.push('Cutting is the wrong tool for that; grouping is.');

console.log(out.join('\n'));
