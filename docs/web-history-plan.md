# The cached web carries the history (plan)

Companion to `docs/ai-codebase-plan.md` §9 and stage W1 of
`docs/calypso-build-plan.md`. Also the frame for **#139** (move ~70% of the
lore off paper scraps and onto the web), which should run before or alongside
the page-mass here so the new pages land in a web that has already been
reorganised.

## The principle

The history pages are the hint system. A page on the perceptron's limits IS
the Polyphemus solution; a page on Samuel's self-play IS the shape of the
concession route. Nobody hands the player a quest marker; they do the joining.

Two hard rules:

1. **Everything factual is true.** Real people, real papers, real years.
   Verified against Zotero before shipping; anything the library does not hold
   goes to David for verification, not into the game on trust.
2. **No page names a puzzle or a solution.** History only. The moment a page
   says "so to beat the eye you must…", the mechanic is dead.

## The voice: period junk, true content

A 1990s cached web is university course notes with one broken image, a
departmental FTP index, a fan page with a hit counter and a guestbook link
that 404s, a mailing-list archive with mangled quoting, a CFP eleven months
stale. The information is right and the presentation is wrong, because that is
what the web was, and because a player believes a bad page more than a good
one. Reuse the existing site furniture from #95's discursive map.

## The pages

Priority order = usefulness to a stuck player. W1 (the Calypso subset) is the
first seven; the rest follow with their daemons.

| # | page | dressed as | serves |
|---|---|---|---|
| 1 | Samuel's checkers program and self-play | IBM alumni fan page, hit counter | the concession route |
| 2 | Strachey 1952: draughts and the love letters, same machine, same year | university course notes, broken image where the Mark I photo was | Calypso's whole character |
| 3 | Shannon, "Game Playing Machines", *J. Franklin Inst.* 260, 447–453, Dec 1955 | a citations page from a survey course | the framing |
| 4 | Weizenbaum, "How to Make a Computer Appear Intelligent" (1962); ELIZA (1966) | mailing-list argument, quoting mangled | the memo in her filesystem; Circe later |
| 5 | the 1983 film about the war computer | fan page, describe don't quote | the concession route's shape |
| 6 | finite state machines, with a hand-drawn GIF of a graph | lecture notes, .edu | reading `main.ml` |
| 7 | Agre, "Surveillance and Capture", *The Information Society* 10(2), 1994 | a department preprint index | the capture mechanic; the dissenting engineer |
| 8 | the perceptron, Rosenblatt 1958; Minsky & Papert 1969 | conference retrospective page | POLYPHEMUS, directly |
| 9 | Adventure, and the real cave Crowther mapped | caver's homepage | POLYPHEMUS's cabinet |
| 10 | Spacewar! and the PDP-1, 1962 | computer-museum volunteer page | POSEIDON's cabinet |
| 11 | Hammurabi / The Sumer Game, 1968 | BASIC games nostalgia page | HELIOS's cabinet |

### The NeXT set (David, 2026-08-12)

Her platform (`docs/ai-codebase-plan.md` §3b–3c) earns its own cluster, and two
of these are load-bearing rather than flavour — they are how the player learns
what Interface Builder and Mach ports *are*, which is what the hacker ending
and the dead channel are built on.

| # | page | dressed as | serves |
|---|---|---|---|
| 12 | **Interface Builder: connecting objects** | a NeXT user-group tutorial, screenshots described but missing | **load-bearing.** You wire objects by dragging a connection between them. That is the hacker ending, and nobody says so |
| 13 | **Mach: ports and rights** | CMU tech-report abstract page, PostScript link dead | **load-bearing.** A port you hold no send right to cannot be messaged. That is the dead channel |
| 14 | the NeXT cube: specs, and why it did not sell | hardware enthusiast page, price list, mild bitterness | the object in her cave |
| 15 | **the first web server was a NeXT** | a CERN page, or a fan's photo caption of the label on the machine asking nobody to power it down | the game's own web was born on her hardware. Say nothing more |
| 16 | Jobs and the wilderness: Apple 1985, NeXT after | a fan page written IN 1995, which does not know how it ends | see below |
| 17 | NeXTSTEP after the hardware: software on other people's boxes, 1993 on | a mailing-list thread, quoting mangled | an exile OS, still running |

**Page 16 is the one to get right.** Written in 1995, it cannot know Jobs
returns to Apple, cannot know about the iMac or any of it. It is a fan hoping,
in the present tense, about a company that is not doing well. On the island of
exile, in the seventh year, that page is doing a great deal of work for
something that only states facts.

**Rule for real people.** Jobs, Berners-Lee, Strachey, Samuel, Weizenbaum,
Agre, Minsky, Papert, Rosenblatt, Crowther: describe and cite, never
ventriloquise. No invented quotations, no imagined interiority, no putting
words in a real mouth. The film page has the same rule and for the same reason.

### The symbolic-AI and hardware set (David, 2026-08-12)

Requested: Simon and Newell, DEC, the PDP-1, Spacewar!. These are the spine of
the pre-1970 half of §3's periodisation, and they carry POSEIDON's cabinet.

Note on the name: the language is **IPL-V** — Information Processing Language,
Newell, Shaw and Simon — not IPV-5. Worth getting right on a page that is
supposed to be true.

| # | page | dressed as | serves |
|---|---|---|---|
| 18 | **Newell, Shaw and Simon: Logic Theorist and IPL** | a departmental history page, RAND-flavoured, one dead link to a tech report | the symbolic era. Machines that manipulate SYMBOLS rather than numbers, and list processing as the enabling idea. Sets up CIRCE's rewriting |
| 19 | **General Problem Solver, and means-ends analysis** | seminar notes | the ambition, and its ceiling. The best available account of why GOFAI felt like it was about to work |
| 20 | **Dartmouth 1956** | a conference retrospective with the attendee list | where the name "artificial intelligence" came from, and how few people were in the room |
| 21 | **DEC and the PDP line** | a used-hardware dealer's page, prices in dollars, "WILL SHIP" | the machines the rest of it ran on. Minicomputers as the thing that put a computer in a room with a person |
| 22 | **the PDP-1 and its CRT** | computer-museum volunteer page, restoration diary | the display that made Spacewar! possible |
| 23 | **Spacewar!, 1962** | a fan page by somebody who played it at MIT | POSEIDON's cabinet. The gravity well is the mechanic and the page can describe it without ever saying why it matters here |
| 24 | Simon on bounded rationality | a management-school reading list, out of place among the rest | Simon won a Nobel in economics, which readers of the AI pages do not expect, and it reframes what he thought he was studying |

Page 23 is load-bearing for POSEIDON's cabinet in the same way pages 12 and 13
are for Calypso's hacker ending: it teaches the gravity well as a thing you
must fly against, and names no puzzle.

Optional and knowingly anachronistic (the game already jokes across time):
a 2007 result that draughts played perfectly is a draw — which is what the
player watches her discover in K4. If included, dress it as a "preprint from
the future" glitch page rather than a period page.

## Citations to verify (Zotero first, David second)

- Shannon, C.E. (1955). "Game Playing Machines." *Journal of the Franklin
  Institute* 260(6), 447–453.
- Samuel, A.L. (1959). "Some Studies in Machine Learning Using the Game of
  Checkers." *IBM Journal of Research and Development* 3(3).
- Weizenbaum, J. (1962). "How to Make a Computer Appear Intelligent."
  *Datamation* 8.
- Weizenbaum, J. (1966). "ELIZA — A Computer Program for the Study of Natural
  Language Communication…" *CACM* 9(1).
- Agre, P.E. (1994). "Surveillance and Capture: Two Models of Privacy."
  *The Information Society* 10(2), 101–127.
- Rosenblatt, F. (1958). "The Perceptron…" *Psychological Review* 65(6).
- Minsky, M. & Papert, S. (1969). *Perceptrons*. MIT Press.
- Strachey's 1952 draughts programme and the love letter generator
  (Ferranti Mark I): verify the best primary/secondary sources with David —
  the standard scholarly treatments are in the CCS literature he knows.

## Relation to #139 (the lore migration)

#139's test for every existing lore item: would a person have written this in
pen and left it where you found it? If not, it belongs on a server. Run that
audit first (deliverable: item / current home / proposed home / keep-move-cut),
then land these history pages into the reorganised web. Expect some lore to be
cut rather than moved; 70% relocated is the target, not the floor.
