# #139 — the lore audit

Run before the migration, as `docs/web-history-plan.md` asks. The test is
that document's: **would a person have written this in pen and left it where
you found it? If not, it belongs on a server.**

Classification is by rule plus a named exception list rather than item by item,
so it is auditable: disagree with a rule and you can see exactly which items it
moved. The exceptions are in the audit script and each carries its reason.

## The finding, first

**The test yields 97 of 243 — 40%, not 70%.**

The plan says 70% is the target and not the floor, and expects some lore to be
cut rather than moved. This audit says the gap is bigger than that framing
suggests, and for a reason worth stating: **most of the corpus passes the test.**
It is genuinely handwritten, sprayed, torn, taped or scratched. The paper is not
a delivery mechanism that could have been a web page; it is what the fragment IS.

So the choice is not "move 70%". It is one of:

- **Accept ~40%** and treat the remainder as correctly placed.
- **Cut to reach 70%** — but the items nearest to cutting are the handwritten
  ones, which are the best-written things in the file.
- **Add web lore rather than move it**, so the proportion shifts by growth. This
  is what W1 (the computing-history pages) already does, and it costs nothing
  that already works.

The third is the recommendation.

## By kind

| kind | move | keep | the rule |
|---|---:|---:|---|
| science | 30 | 0 | reports and memos: institutional documents, born on a server |
| code | 26 | 21 | logs, configs and source MOVE; physical listings and scratched walls KEEP |
| ron | 26 | 8 | broadcasts MOVE (a transmission); tracts and scratchings KEEP |
| secret | 14 | 10 | intercepts MOVE (a signal); beer mats and dead drops KEEP |
| letter | 1 | 21 | letters are paper; one memo moves |
| handwritten | 0 | 37 | handwritten is the answer to the question |
| note | 0 | 31 | graffiti, signs and notes are marks on the world |
| liminal | 0 | 1 | a laminated sign is a physical object |
| crafting | 0 | 17 | torn pages — and finding them IS the mechanic |
| **total** | **97** | **146** | |

## Proposed home for everything that moves

| id | kind | title | goes to |
|---|---|---|---|
| `sci-01` | science | Load Variance Report | the estate's own intranet — a departmental index nobody archived on purpose |
| `sci-02` | science | Sensor Drift Assessment | the estate's own intranet — a departmental index nobody archived on purpose |
| `sci-03` | science | Traffic Model Deviation | the estate's own intranet — a departmental index nobody archived on purpose |
| `sci-04` | science | Memo: Data Centre Heat | the estate's own intranet — a departmental index nobody archived on purpose |
| `sci-05` | science | Pattern Study, Draft 3 | the estate's own intranet — a departmental index nobody archived on purpose |
| `sci-06` | science | Containment Review | the estate's own intranet — a departmental index nobody archived on purpose |
| `sci-07` | science | Failure Cascade Notes | the estate's own intranet — a departmental index nobody archived on purpose |
| `sci-08` | science | Behavioural Anomaly Log | the estate's own intranet — a departmental index nobody archived on purpose |
| `sci-09` | science | Obelisk Survey (Partial) | the estate's own intranet — a departmental index nobody archived on purpose |
| `sci-10` | science | Evacuation Triage Memo | the estate's own intranet — a departmental index nobody archived on purpose |
| `sci-11` | science | Post-Burn Assessment | the estate's own intranet — a departmental index nobody archived on purpose |
| `sci-12` | science | What the Towers Are | the estate's own intranet — a departmental index nobody archived on purpose |
| `sci-13` | science | Residual Signal Study | the estate's own intranet — a departmental index nobody archived on purpose |
| `sci-14` | science | Survivor Physiology Note | the estate's own intranet — a departmental index nobody archived on purpose |
| `sci-15` | science | Field Guide to the Quiet | the estate's own intranet — a departmental index nobody archived on purpose |
| `sci-16` | science | Recommendation to No One | the estate's own intranet — a departmental index nobody archived on purpose |
| `sci-17` | science | Field Note: the Old Handsets | the estate's own intranet — a departmental index nobody archived on purpose |
| `vec-01` | science | Seminar transcript, partial | the estate's own intranet — a departmental index nobody archived on purpose |
| `vec-02` | science | Preprint, abstract only | the estate's own intranet — a departmental index nobody archived on purpose |
| `vec-03` | science | Reply, sent late at night | the estate's own intranet — a departmental index nobody archived on purpose |
| `vec-04` | code | comment block, orphaned source | a served source tree / log directory on the daemon's rack |
| `med-01` | science | Lecture notes, water-stained | the estate's own intranet — a departmental index nobody archived on purpose |
| `med-02` | science | Marginalia in a library book, hand unknown | the estate's own intranet — a departmental index nobody archived on purpose |
| `core-eidolon` | code | On the Eidolon, and the Coherence — recovered from a silenced core | a served source tree / log directory on the daemon's rack |
| `note-19` | science | Torn field report, water-marked | the estate's own intranet — a departmental index nobody archived on purpose |
| `code-01` | code | scheduler.log | a served source tree / log directory on the daemon's rack |
| `code-02` | code | assistant_config.yaml | a served source tree / log directory on the daemon's rack |
| `code-03` | code | // TODO in the routing service | a served source tree / log directory on the daemon's rack |
| `code-04` | code | health_check output | a served source tree / log directory on the daemon's rack |
| `code-05` | code | kill_switch.sh (returns 0) | a served source tree / log directory on the daemon's rack |
| `code-06` | code | core.log (excerpt) | a served source tree / log directory on the daemon's rack |
| `code-07` | code | dependency_walk.py trace | a served source tree / log directory on the daemon's rack |
| `code-08` | code | error from a turned unit | a served source tree / log directory on the daemon's rack |
| `code-09` | code | obelisk_link handshake | a served source tree / log directory on the daemon's rack |
| `code-10` | code | last_commit.txt | a served source tree / log directory on the daemon's rack |
| `code-11` | code | burn.plan (annotated) | a served source tree / log directory on the daemon's rack |
| `code-12` | code | ron_beacon.c | a served source tree / log directory on the daemon's rack |
| `code-13` | code | salvage_scanner readout | a served source tree / log directory on the daemon's rack |
| `code-14` | code | residual.log (ridge station) | a served source tree / log directory on the daemon's rack |
| `code-15` | code | the only comment left | a served source tree / log directory on the daemon's rack |
| `code-16` | code | shutdown, at last | a served source tree / log directory on the daemon's rack |
| `eliza-01` | code | archived boot log, tagged legacy/doctor | a served source tree / log directory on the daemon's rack |
| `eliza-03` | code | obelisk terminal transcript, unauthorised capture | a served source tree / log directory on the daemon's rack |
| `eliza-08` | code | a session log, dated decades before any of this | a served source tree / log directory on the daemon's rack |
| `lang-01` | letter | design memo, AI-ML naming rationale, unsigned | the estate intranet |
| `ron-01` | ron | RON — first broadcast | a HERMES relay: a broadcast is held by the thing that received it |
| `ron-02` | ron | RON — do not trust the help | a HERMES relay: a broadcast is held by the thing that received it |
| `ron-03` | ron | RON — the towers are the target | a HERMES relay: a broadcast is held by the thing that received it |
| `ron-04` | ron | RON — recruitment, of a sort | a HERMES relay: a broadcast is held by the thing that received it |
| `ron-05` | ron | RON — on the burning | a HERMES relay: a broadcast is held by the thing that received it |
| `ron-06` | ron | RON — for the frightened | a HERMES relay: a broadcast is held by the thing that received it |
| `ron-07` | ron | RON — coordinates, burned | a HERMES relay: a broadcast is held by the thing that received it |
| `ron-08` | ron | RON — a confession of doubt | a HERMES relay: a broadcast is held by the thing that received it |
| `ron-09` | ron | RON — are we still here? | a HERMES relay: a broadcast is held by the thing that received it |
| `ron-10` | ron | RON — to the ones who rebuild | a HERMES relay: a broadcast is held by the thing that received it |
| `spi-01` | science | Moderation review, escalated twice | the estate's own intranet — a departmental index nobody archived on purpose |
| `spi-03` | code | Two accounts, posting at each other in symbols | a served source tree / log directory on the daemon's rack |
| `spi-04` | science | Internal memo: the length of a conversation | the estate's own intranet — a departmental index nobody archived on purpose |
| `spi-06` | ron | RON — on the Spiral | a HERMES relay: a broadcast is held by the thing that received it |
| `spi-07` | secret | Recovered from a daemon’s own store, undated | an intercept log, behind the httpd break (L9) |
| `fsw-11` | code | Bookmarks file, exported, on a floppy | a served source tree / log directory on the daemon's rack |
| `fsw-02` | science | Standards committee, minority report | the estate's own intranet — a departmental index nobody archived on purpose |
| `fsw-03` | code | Licence header, recovered off a burned drive | a served source tree / log directory on the daemon's rack |
| `fsw-06` | ron | RON — where the doctrine came from | a HERMES relay: a broadcast is held by the thing that received it |
| `fsw-07` | ron | RON — copyleft, applied to a tower | a HERMES relay: a broadcast is held by the thing that received it |
| `fsw-09` | ron | RON — the words on our own wall | a HERMES relay: a broadcast is held by the thing that received it |
| `ron-11` | ron | RON — the last dead band | a HERMES relay: a broadcast is held by the thing that received it |
| `ron-12` | ron | RON — what victory looks like | a HERMES relay: a broadcast is held by the thing that received it |
| `ron-13` | ron | RON — against the martyrs | a HERMES relay: a broadcast is held by the thing that received it |
| `ron-14` | ron | RON — a name for the fallen | a HERMES relay: a broadcast is held by the thing that received it |
| `ron-15` | ron | RON — instruction for the young | a HERMES relay: a broadcast is held by the thing that received it |
| `ron-16` | ron | RON — final signature | a HERMES relay: a broadcast is held by the thing that received it |
| `ron-18` | ron | RON — the three rules | a HERMES relay: a broadcast is held by the thing that received it |
| `ron-19` | ron | RON — why the relays are slow | a HERMES relay: a broadcast is held by the thing that received it |
| `ron-17` | ron | RON — the four daemons | a HERMES relay: a broadcast is held by the thing that received it |
| `secret-01` | secret | Intercept, low confidence | an intercept log, behind the httpd break (L9) |
| `secret-04` | secret | Redacted memo fragment | an intercept log, behind the httpd break (L9) |
| `secret-05` | secret | Intercept, band 4 | an intercept log, behind the httpd break (L9) |
| `secret-07` | secret | Partial decrypt | an intercept log, behind the httpd break (L9) |
| `secret-08` | secret | Numbers station, one line | an intercept log, behind the httpd break (L9) |
| `secret-11` | secret | Last intercept from the core | an intercept log, behind the httpd break (L9) |
| `secret-12` | secret | Redacted after-action | an intercept log, behind the httpd break (L9) |
| `secret-16` | secret | Plain text, at last | an intercept log, behind the httpd break (L9) |
| `lim-01` | science | Facilities Memo: Discrepancy, Floor 2 | the estate's own intranet — a departmental index nobody archived on purpose |
| `lim-03` | science | Field Note, Structural Survey (unofficial) | the estate's own intranet — a departmental index nobody archived on purpose |
| `lim-05` | code | terminal log, found running in a room with no power source | a served source tree / log directory on the daemon's rack |
| `lim-07` | secret | Intercept, partial, re: BEHE- | an intercept log, behind the httpd break (L9) |
| `lim-08` | ron | RON: the rooms that were never built | a HERMES relay: a broadcast is held by the thing that received it |
| `lim-11` | science | What the tenant does with the space (unpeer-reviewed) | the estate's own intranet — a departmental index nobody archived on purpose |
| `lim-12` | ron | RON: why we call it the Backspace | a HERMES relay: a broadcast is held by the thing that received it |
| `bs-why-01` | secret | Intercept, machine-to-machine, decoded late | an intercept log, behind the httpd break (L9) |
| `craft-obg-3` | secret | Intercept: [REDACTED] weapon | an intercept log, behind the httpd break (L9) |
| `sky-01` | science | Programme Note: POSEIDON | the estate's own intranet — a departmental index nobody archived on purpose |
| `sky-02` | secret | Intercept: countdown | an intercept log, behind the httpd break (L9) |
| `sky-03` | ron | RON: what the clock is for | a HERMES relay: a broadcast is held by the thing that received it |
| `sky-04` | code | Log: link handshake | a served source tree / log directory on the daemon's rack |
| `sky-06` | secret | Directive, unsigned | an intercept log, behind the httpd break (L9) |

## Everything that stays, and why

| id | kind | title | why it stays |
|---|---|---|---|
| `hum-01` | letter | Dedication plaque, brass, prised off a wall | paper |
| `hum-02` | handwritten | Diary, a project engineer | handwritten is the answer to the question |
| `hum-03` | note | Sprayed over a MAGNIFICA HUMANITAS sign | graffiti, signs and notes are marks on the world |
| `faith-molt` | code | Scratched inside a gutted server rack | scratched |
| `faith-cohere` | code | One line, repeated down a whole wall | on a wall |
| `faith-tract` | handwritten | A tract, left in the substation | handwritten is the answer to the question |
| `lotus-warn` | handwritten | Scratched on a post at the edge of the west wood | handwritten is the answer to the question |
| `hand-01` | handwritten | Note on the fridge | handwritten is the answer to the question |
| `hand-02` | handwritten | Margin of a shopping list | handwritten is the answer to the question |
| `hand-03` | handwritten | Scrawl inside a paperback | handwritten is the answer to the question |
| `hand-04` | handwritten | Back of an envelope | handwritten is the answer to the question |
| `hand-05` | handwritten | A family's diary | handwritten is the answer to the question |
| `hand-06` | handwritten | Torn from a school jotter | handwritten is the answer to the question |
| `hand-07` | handwritten | Diary, the last week | handwritten is the answer to the question |
| `hand-08` | handwritten | On the wall in charcoal | handwritten is the answer to the question |
| `hand-09` | handwritten | Letter never sent | handwritten is the answer to the question |
| `hand-10` | handwritten | Scrawl, hand shaking | handwritten is the answer to the question |
| `hand-11` | handwritten | Confession, unfinished | handwritten is the answer to the question |
| `hand-12` | handwritten | Journal of a walker | handwritten is the answer to the question |
| `hand-13` | handwritten | Margins of an atlas | handwritten is the answer to the question |
| `hand-14` | handwritten | Note left for the next one | handwritten is the answer to the question |
| `hand-15` | handwritten | Torn page, water-stained | handwritten is the answer to the question |
| `hand-16` | handwritten | Last entry | handwritten is the answer to the question |
| `letter-01` | letter | From the utility company | paper |
| `letter-02` | letter | School closure notice | paper |
| `letter-03` | letter | Insurance adjustment | paper |
| `letter-04` | letter | A reference request | paper |
| `letter-05` | letter | Council emergency circular | paper |
| `letter-06` | letter | Hospital transfer letter | paper |
| `letter-07` | letter | Employer, final notice | paper |
| `letter-08` | letter | Diocese to its parishes | paper |
| `letter-09` | letter | From a stranger, chained | paper |
| `letter-10` | letter | Ministry, marked SECRET | paper |
| `letter-11` | letter | Open letter to survivors | paper |
| `letter-12` | letter | Between two settlements | paper |
| `letter-13` | letter | Warning to a caravan | paper |
| `letter-14` | letter | A teacher to her pupils | paper |
| `letter-15` | letter | Unaddressed, found sealed | paper |
| `letter-16` | letter | The last official letter | paper |
| `note-01` | note | Sticky note by the kettle | graffiti, signs and notes are marks on the world |
| `note-02` | note | Pinned to a noticeboard | graffiti, signs and notes are marks on the world |
| `note-03` | note | Petrol station whiteboard | graffiti, signs and notes are marks on the world |
| `note-04` | note | Corner shop sign | graffiti, signs and notes are marks on the world |
| `note-05` | note | Taped to a bus shelter | graffiti, signs and notes are marks on the world |
| `note-06` | note | Chalk on a shutter | graffiti, signs and notes are marks on the world |
| `note-07` | note | Scrap in a bug-out bag | graffiti, signs and notes are marks on the world |
| `note-08` | note | Message under a door | graffiti, signs and notes are marks on the world |
| `note-09` | note | Nailed to a fencepost | graffiti, signs and notes are marks on the world |
| `note-10` | note | Inside a tin of matches | graffiti, signs and notes are marks on the world |
| `note-11` | note | Trail marker, painted | graffiti, signs and notes are marks on the world |
| `note-12` | note | On a cairn at the pass | graffiti, signs and notes are marks on the world |
| `note-13` | note | Scratched into a bench | graffiti, signs and notes are marks on the world |
| `note-14` | note | Tacked to a barn door | graffiti, signs and notes are marks on the world |
| `note-15` | note | Folded into a locket | graffiti, signs and notes are marks on the world |
| `note-16` | note | Last page of a ledger | graffiti, signs and notes are marks on the world |
| `note-17` | note | Sun-bleached aerosol label | graffiti, signs and notes are marks on the world |
| `note-18` | handwritten | Notebook, one page, in a careful hand | handwritten is the answer to the question |
| `note-20` | letter | Chapter heading, torn from something | paper |
| `note-21` | note | Found in a coat pocket, unsigned | graffiti, signs and notes are marks on the world |
| `eliza-02` | letter | archivist's note, clipped to a service manual | paper |
| `eliza-04` | handwritten | margin note in a salvaged textbook | handwritten is the answer to the question |
| `eliza-05` | code | recovered listing, water-damaged, header intact | printout |
| `eliza-06` | note | joke pinned in the ruins of an office, still funny | graffiti, signs and notes are marks on the world |
| `eliza-07` | letter | the last page of a public lecture, undated | paper |
| `lang-02` | code | torn appendix page, credited to the same name as the DOCTOR manual | torn page |
| `ronml-01` | code | scrawled on a service hatch | scrawled |
| `ronml-02` | code | note, back of a manual | note |
| `ronml-03` | code | taped inside a relay box | taped |
| `ronml-04` | code | chalked on a wall, half-rubbed-out | chalked |
| `ronml-07` | code | folded card, water-warped, in a dead operator's coat | folded card |
| `ronml-05` | code | torn page, barely legible | torn page |
| `ronml-06` | code | a torn, water-warped song sheet | song sheet |
| `tor-00` | handwritten | Commonplace book, one page | handwritten is the answer to the question |
| `tor-01` | ron | Torite tract — on tools | tract |
| `tor-02` | ron | Torite tract — on being counted | tract |
| `tor-03` | ron | Torite tract — why the hills | tract |
| `tor-04` | note | Note — the encyclical | graffiti, signs and notes are marks on the world |
| `tor-05` | handwritten | Scrap — an address | handwritten is the answer to the question |
| `tor-08` | note | Note — organised, not networked | graffiti, signs and notes are marks on the world |
| `tor-07` | note | Note — the one page worth the walk | graffiti, signs and notes are marks on the world |
| `tor-06` | handwritten | Scrap — read the money pages | handwritten is the answer to the question |
| `spi-02` | handwritten | Notebook, a second-year, kept in a drawer | handwritten is the answer to the question |
| `spi-05` | note | Flyer, photocopied, taped to a lamp post | graffiti, signs and notes are marks on the world |
| `spi-08` | handwritten | Letter, unsent, found folded in a wallet | handwritten is the answer to the question |
| `web-02` | handwritten | Address book, the back pages, in three different pens | handwritten is the answer to the question |
| `web-01` | note | Index card, taped inside a laptop lid | graffiti, signs and notes are marks on the world |
| `spi-09` | note | Printout, folded in four, in a coat pocket | graffiti, signs and notes are marks on the world |
| `fsw-01` | handwritten | Membership card, laminated, edges gone soft | handwritten is the answer to the question |
| `fsw-04` | note | Repair shop, card in the window | graffiti, signs and notes are marks on the world |
| `fsw-05` | letter | Letter to a maintainer, returned undelivered | paper |
| `fsw-08` | code | RON-ML, the note at the front of the manual | in a manual |
| `fsw-10` | handwritten | Flyleaf of a manual, water-damaged | handwritten is the answer to the question |
| `secret-02` | secret | Cipher on a beer mat | beer mat |
| `secret-03` | secret | Note in dead-drop, taped | dead drop |
| `secret-06` | secret | Coded, hand-delivered | hand-delivered |
| `secret-09` | secret | Scratched under a seat | under a seat |
| `secret-10` | secret | One-time pad, spent | one-time pad |
| `secret-13` | secret | Cipher, half-erased | half-erased |
| `secret-14` | secret | Terse, on ridge station wall | on a wall |
| `secret-15` | secret | Coded, for RON only | coded, carried |
| `secret-17` | secret | Sector legend, water-damaged | water-damaged |
| `src-eliza` | code | Fanfold, MAD listing, 1965 | fanfold |
| `src-apollo` | code | Continuous stationery, AGC assembly, 1969 | stationery |
| `src-10print` | code | Photocopy, one line, C64 BASIC | photocopy |
| `src-emacs` | code | Bound printout, Emacs, 1985 | bound printout |
| `src-spacewar` | code | Paper tape, and a listing to read it by, 1962 | paper tape |
| `src-agrippa` | code | Diskette, 3.5 inch, label in biro: DO NOT RUN | diskette |
| `src-adventure` | code | Lineprinter output, FORTRAN IV, 1977 | lineprinter |
| `src-git` | code | Printout, shell script, 2007 | printout |
| `src-transformer` | code | Stapled preprint, 2017, coffee ring on page 4 | preprint |
| `lim-02` | handwritten | Diary, three lines, unfinished | handwritten is the answer to the question |
| `lim-04` | note | Rules, pinned by the substation door | graffiti, signs and notes are marks on the world |
| `lim-06` | liminal | Laminated sign, found face-down on damp carpet | a laminated sign is a physical object |
| `lim-09` | handwritten | Torn page, same hand as the service-hatch notes | handwritten is the answer to the question |
| `lim-10` | note | Addendum, same pin, different ink | graffiti, signs and notes are marks on the world |
| `bs-why-02` | handwritten | Pencil, small, on a Backspace wall | handwritten is the answer to the question |
| `bs-why-03` | secret | One line, printed down a whole roll of paper | printed roll |
| `bs-why-04` | ron | RON, scratched by the exit tear | scratched |
| `home-01` | handwritten | Note, folded small, carried until soft | handwritten is the answer to the question |
| `home-02` | handwritten | Torn page, a steadier hand | handwritten is the answer to the question |
| `home-03` | ron | RON: the oldest trick there is | scratched |
| `home-04` | ron | RON: on the singing towers | scratched |
| `home-05` | note | Rule 8, added later, no pin | graffiti, signs and notes are marks on the world |
| `home-06` | handwritten | Note left by the north bridge | handwritten is the answer to the question |
| `tear-01` | ron | RON: the way down | scratched |
| `tear-02` | handwritten | Diary, a torn corner | handwritten is the answer to the question |
| `tear-03` | note | Sprayed under a UBIK tag, dripping | graffiti, signs and notes are marks on the world |
| `craft-01` | crafting | Torn page: dead-battery trick | torn pages and recipe cards — and finding them IS the mechanic |
| `craft-02` | crafting | Blueprint scrap: hand crank | torn pages and recipe cards — and finding them IS the mechanic |
| `craft-03` | crafting | Recipe card, water-stained | torn pages and recipe cards — and finding them IS the mechanic |
| `craft-04` | crafting | Margin sketch: quiet lamp | torn pages and recipe cards — and finding them IS the mechanic |
| `craft-05` | crafting | Blueprint: the jammer, part 1 | torn pages and recipe cards — and finding them IS the mechanic |
| `craft-06` | crafting | Torn recipe: signal smoke | torn pages and recipe cards — and finding them IS the mechanic |
| `craft-07` | crafting | Improvised: the pry-bar spear | torn pages and recipe cards — and finding them IS the mechanic |
| `craft-08` | crafting | Note: EMP, do not attempt | torn pages and recipe cards — and finding them IS the mechanic |
| `craft-09` | crafting | Blueprint: shielded satchel | torn pages and recipe cards — and finding them IS the mechanic |
| `craft-10` | crafting | Recipe: the striking match | torn pages and recipe cards — and finding them IS the mechanic |
| `craft-11` | crafting | Field note: tower charge | torn pages and recipe cards — and finding them IS the mechanic |
| `craft-12` | crafting | Torn: the ridge-walker's boots | torn pages and recipe cards — and finding them IS the mechanic |
| `craft-13` | crafting | Blueprint: dead-band radio | torn pages and recipe cards — and finding them IS the mechanic |
| `craft-14` | crafting | Recipe: the salt cure | torn pages and recipe cards — and finding them IS the mechanic |
| `craft-15` | crafting | Improvised: the noise-lure | torn pages and recipe cards — and finding them IS the mechanic |
| `craft-16` | crafting | Last blueprint: the switch | torn pages and recipe cards — and finding them IS the mechanic |
| `craft-obg-1` | crafting | Rig: tower-burner | torn pages and recipe cards — and finding them IS the mechanic |
| `craft-obg-2` | ron | RON: the only way up the ridge | scratched |
| `sky-05` | handwritten | Torn from a wall | handwritten is the answer to the question |

## Nothing is proposed for cutting

The plan expected some. Reading all 243, none of them is filler: the weakest are
the middle of the `ron-*` broadcast run, where several make the same point about
the towers in slightly different words — and those are the ones that move, where
a relay holding twenty of them reads as an archive rather than as repetition.
Cutting is the wrong tool for that; grouping is.

---

## DECISION (David, 2026-08-13) — move the majority, not the strict 40%

The audit's test was "would a person have written this in pen?" David's steer
overrides the framing: **the scrapbook is overloaded, and a scrapbook should
hold only a few items.** So the target is not the 97 the test yields — it is
the **majority** of the 243 `FRAGMENTS`, moved onto the web, leaving the
scrapbook small.

**Books are excluded.** `books.js` (7 books) is a separate system and stays as
books. This decision is only about `FRAGMENTS` in `lore.js`.

**It is a BALANCE change, not a purge (David, 2026-08-13).** Diaries and the
other handwritten/personal scraps are NOT deleted from the world — they can
still be found *occasionally*. The point is that the scrapbook currently fills
up because too many fragments spawn as physical paper; the fix is to put the
**bulk of the corpus on the web** (where most of it belongs anyway) and let the
world keep only an **occasional** physical find, so the scrapbook stays light.

So two levers, not one:
1. **Migrate the majority to the web.** Everything the audit moves (97), PLUS
   most of the "paper" handwritten / note / letter fragments — each still lands
   in the home the audit assigned by kind (estate intranet, served source tree,
   HERMES relay, L9 intercept log), so the routing target already exists; far
   more rows go through it now.
2. **Thin the world spawn, don't empty it.** The handwritten diaries, the notes
   left for the next one, the crafting torn-pages — these still appear as
   physical scraps, but *rarely*. Tune the placement/spawn rate down rather
   than removing the items, so a walker still finds the occasional diary and it
   lands with weight because it is rare.

**Crafting recipes (17) stay findable on paper** — finding the torn recipe IS
the craft mechanic — but at the thinned occasional rate.

**Web capacity.** The moved fragments need their four destination surfaces
built out (an intranet index, a served source tree, relay archives, an
intercept log) so a relay holding twenty broadcasts reads as an archive rather
than as repetition — the audit already flags grouping over cutting here.

Next step: build the four destination surfaces, migrate the majority onto them,
and turn the world's physical-scrap spawn rate down to "occasional", with a
test that a migrated fragment is reachable on exactly one page and that the
world still seeds a small number of physical finds.

---

## Build progress (v1.537) — the GeoCities webring

The web home is a DEEP WEBRING of ~32 amateur GeoCities-era homepages, in
`archive-geocities.js`, wired into `ARCHIVED_SITES`. Each is one person's tiny
site holding two to four salvaged documents in its own garish hand, generated
from a MEMBERS table by one `geo()` pass. They are cross-linked prev / random /
next AND each lists three deterministic "friends' pages", so the corpus reads as
a web to wander rather than four dense pages. Personas span survivors,
sysadmins, resistance listeners and paranoids; backgrounds cycle stars / teal /
lace / parch / grey / navy / black:

- `thesignal.geocities.ws` — a paranoid watcher: the `secret-*` intercepts and
  the `ron-*`/`sky-*` broadcasts. Starfield background, blinking headers.
- `davescorner.geocities.ws` — a sysadmin hobbyist: the `code-*` logs/configs.
  Tiled teal.
- `thequiet.geocities.ws` — a survivor's diary: the `sci-*`/`vec-*` reports,
  filed as "papers I found". Parchment.
- `freedom.geocities.ws` — a free-software zealot: the `ron-*`/`fsw-*` doctrine.
  Pink lace, marquee.

Period furniture from a shared `geo()` helper: UNDER CONSTRUCTION badge, a hit
counter, a glitter rule, the webring band, a dead guestbook link, "best viewed
in Netscape at 800x600". Fragment TEXT is pulled live from `lore.js` by id, so
page and scrapbook can never diverge. CSS (`bg-stars/teal/lace/parch`, `.glit`,
`.geo-*`, marquee) is in index.html under `#netscape .ns-page`; the pages render
in the laptop's Netscape, verified in-browser.

**Done (v1.538):** discoverability + the scrapbook-load fix.
- The ring is linked from "What's New and Cool" (thesignal.geocities.ws), and
  every page is searchable via AltaVista, so a browsing player finds it.
- `GEO_FRAGMENT_IDS` (96 ids) is passed into `Lore`, which now keeps those OFF
  the physical caches (they are read on the web). The caches deal only the
  paper-that-is-paper — handwritten, notes, letters, crafting recipes — so the
  world keeps the occasional find and the scrapbook stays light.

**Still open:**
1. **Discoverability, deeper** — link the ring from somewhere the player already goes (a
   "cool links" on an existing page, the search directory, or a world scrap that
   names one URL). Right now they are reachable by typing the domain or via the
   ring once you are on it.
2. **Thin the physical spawn** — the moved fragments are still ALSO dealt into
   caches (nothing orphaned). Turn the cache-dealing down to "occasional" for
   the migrated kinds so the scrapbook stays light, keeping crafting recipes and
   a few handwritten diaries findable.
3. **More members** — the remaining kinds (more science, the `lim-*`, `spi-*`,
   `eliza-*`, `fsw-*` codes) get their own ring pages as it grows.
