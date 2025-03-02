# More at the obelisk: control verbs, and a browser that is not Netscape

*Written 2026-08-09 at v1.336. Two requests in one: verbs that reach further
into the island once you have a decrypted key, and a second browser on the
obelisk that is nothing like the one on the NostBook.*

## What is already there, and what it means

The terminal has nineteen verbs and they are all **local**: `scan`, `hack`,
`crash`, `loop` act on one node; `sleep`, `repel`, `rewind` buy a pocket of
room. Nothing reaches the island as a system. The decrypted AI key exists and
does exactly one thing — `unlock` a fortress door — so the most laborious thing
a player can make has a single use.

Three of the four new verbs are already half-built in `ronmlCtx`:

| asked for | what exists |
|---|---|
| `robots on\|off` | `sleepNearby(mins)` idles machines in a radius for a time |
| `poseidon up\|down` | `player.skylinkActive` is the switch; `rewindClock` already moves the deadline |
| `fog high\|low\|clear` | `poseidonFog` is a single number, driven each frame by `updateFog` |

So this is mostly plumbing, and the interesting decisions are about **what it
costs** and **how long it lasts**.

## A. The verbs

**The gate.** Every one of these needs a **decrypted AI key**, the value
`decrypt aikey` returns. `unlock` already checks that shape — `tag === 'key'`,
`kind === 'aikey'`, `enc === false` — and the check moves into one helper so
the new verbs and `unlock` cannot drift apart. The key is not consumed. This
gives the AI key the second use it has always wanted.

**The arguments are bare words**, as `hack OB_1A2B` is: NostOS lets an unbound
bare word through as a value, so `fog HIGH` arrives as a node named `HIGH`. A
string works too, and both fold case, because the game folds case everywhere.
An unknown word is named back rather than ignored.

| verb | does |
|---|---|
| `fog HIGH` | drives the purge fog to full over the island |
| `fog LOW` | thins it to a haze |
| `fog CLEAR` | lifts it entirely |
| `poseidon DOWN` | takes the purge offline for a while — the towers stop pooling sight, the blight stops spreading |
| `poseidon UP` | wakes it early, which is a thing you would do on purpose only once |
| `robots OFF` | idles every machine within reach, for a while |
| `robots ON` | wakes them, and they are cross |
| `sight OFF` | cuts the shared-sight net without felling anything |
| `blight STOP` | freezes every front where it stands |

**Everything is temporary and everything is overridden by the world.** A fog
override decays; `poseidon DOWN` runs a countdown and comes back up. The purge
is the game's clock and a verb that stopped it for good would stop the game.

**None of it is free.** Each costs the tower you are standing at: it goes
`frozen` for the duration, the way `loop` leaves one. You are spending a node to
reach the island.

## B. Explorer

The NostBook runs Netscape over `net.js`, which already holds the whole web:
`hostTable`, `findHost`, `programPage`, `searchResults`, `bookmarksPage`,
`whatsNewPage`. **The obelisk's browser reuses every one of them.** The web is
the same web; what differs is who is showing it to you.

`explorer` at an obelisk opens it. It is the machines' own browser and it is
horrible:

- **Grey 3D bevels everywhere**, a navy gradient title bar, a toolbar of chunky
  buttons with text labels, and a status bar that says `Done` when it is not.
- **Times New Roman**, blue underlined links, a visited purple, and a
  background that is not quite white.
- **Modal warnings** on anything with a RON address: *This site may contain
  content that is not authorised for this terminal. Continue?* — with OK and
  Cancel that both continue.
- **Pop-ups.** A small window that opens itself over the page every so often,
  offering something the machines want you to want, with a close box that moves
  the first time you go for it. Capped, and it stops after you dismiss enough of
  them: a joke that will not end is not a joke.
- A **security padlock that is broken** and says so when clicked.

It shows one thing Netscape does not: a tower's page carries its **garrison**,
which is what makes the awful thing worth using.

## Order

1. The key check as one helper, and `fog`. Smallest end-to-end slice: a verb
   that takes a bare word, checks the key, and changes something you can see.
2. `poseidon`, `robots`, `sight`, `blight` on the same frame.
3. Explorer's chrome and the page reuse.
4. The pop-ups and the warnings, last, because they are the part most likely to
   be too much and the easiest to turn down.

## How it will be verified

1. Each verb refused without a decrypted key, and named in the refusal.
2. Each verb's effect asserted on the world state, not on the message.
3. The fog override decays and the purge comes back up: a test that runs the
   clock forward.
4. Explorer renders a host page, a search and the bookmarks, driven headlessly
   through `net.js`, so the chrome can change without breaking the test.
5. 715 tests, and the game loaded in a browser with the console clean.
