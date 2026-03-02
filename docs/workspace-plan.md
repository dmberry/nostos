# V1 — the Workspace: her machine gets a desktop

**Unparked 2026-08-13.** The tool question in `docs/calypso-build-plan.md` §V1 is
answered, and the answer is that it was the wrong question. It is not
Interface Builder *or* Project Builder. It is the **Workspace**, and the others
are applications inside it.

Reference supplied by David: NeXTSTEP screenshots (Workspace Manager 3.3 and
WM 2.0), the 1995 *Putting Together a NEXTSTEP Application* chapter, and the
NeXTSTEP user-interface principles.

---

## Why a desktop and not the console she already has

Her line console works, and as of v1.527 it works properly: `ls`, `read`,
`get`, `post`, `checkers`, and a `help` that says so. That is not the argument
against it. The argument is that **a terminal is the estate's register.** Green
phosphor, RON-DOS, one line at a time, identical on all five islands. It is
POSEIDON's voice.

Hers is a NeXT, and the island's whole method is told in chrome rather than in
prose. Her draughts cabinet has worn NeXTSTEP since K2 (`ui.js`:
`_nextBevel`, `_nextTitleBar`, `_nextButton`). Her core is the cube since #150.
The desktop is the last piece of that, and it changes the verb: you stop
*reading her source* and start *using her machine*.

**The console stays.** A Terminal icon in the dock, as the reference has. A
player who would rather type keeps the whole read/edit/post loop.

---

## The one principle that is a build constraint

From the UI principles David supplied:

> consistency means that windows in different applications have the same look
> and functionality, mouse clicks and drags perform the same kinds of actions,
> common menu commands are in the same place and have the same names, keyboard
> alternatives, and so on.

Read that as an instruction about **implementation, not just appearance**: the
window chrome, the menu, the browser and the panels are ONE set of primitives
that every app draws with. The moment a second window grows its own title bar,
the pastiche is dead — and worse, so is the argument, because the argument is
that this system was *designed* and the estate's was accreted.

So: build the primitives first, and let the apps be thin.

**And it is a literal rule, not a vibe.** Of Terminal's menu the guidelines say:
*"As required there are **Info, Services, Hide** and **Quit** commands (in the
correct positions)."* Every app's menu is its own middle, with the same four
fixed items around it — Info at the top, Services / Hide / Quit at the foot.
So the menu builder takes a list of an app's own submenus and always frames it.
One function, and no app can get its own furniture wrong.

Terminal's title bar is the other thing to copy exactly: `/bin/csh (ttyp1)
80x24` — **the shell, the tty and the window size**. A window that tells you
what it is running and how big it is, in its title, is a period detail that
costs a string.

The second principle is the player's:

> NeXTSTEP puts you in charge of your workspace and its windows.

Move, resize, miniaturise, hide, close. On her island, where nothing else is
in your control, the fact that **the windows do exactly what you tell them** is
worth more than any line of dialogue. It is the only thing on Ogygia that obeys.

---

## The widget spec, from the reference figures

David supplied the UI guidelines figures. These are the details that separate a
pastiche from the thing, and most of them are cheap. Getting them wrong is what
makes a period UI feel like a modern one wearing grey.

**The standard window (fig 2).**
- **Miniaturise LEFT, close RIGHT.** Inverted from every modern desktop, and
  the single most recognisable thing about the frame. Getting this backwards
  would be the tell.
- A **three-part resize bar** across the whole foot, not a corner grip.
- The scrollbar has a **knob with a dimple**, and **both scroll arrows stacked
  together at the BOTTOM** of the bar — not one at each end.
- **A "hole" in the close button means unsaved changes** (fig 7). That is the
  document's dirty flag, and it is worth having for Edit alone: you re-guard
  `main.ml`, and the close box tells you it is not written yet.

**The menu (fig 4).**
- Vertical, top-left, `▷` on any row with a submenu, **key equivalents
  right-aligned** in their own column.
- **`...` on a row means it opens a panel.** Rows without dots act at once.
- **Torn off, a submenu gains a close button** and becomes a floating panel.
- **Greyed rows are disabled in that context** — and they stay visible rather
  than vanishing, which is the opposite of a modern context menu and is the
  whole "you can see what the system can do" posture.

**Two kinds of list button, and they are not the same (figs 5, 6).**
- **Pop-up list** — a `▣` glyph. Press, drag, release: the button then **shows
  what you chose**. It is a value.
- **Pull-down list** — a `▽` glyph. Same interaction, but the button **keeps its
  own label** afterwards. It is a verb menu.
  Using the wrong one is a real error, not a cosmetic one.

**Panels (fig 3, and the Attributes Inspector).**
- An attention panel has an **empty black title bar**, an **identifying icon**
  with the name in **large type** beside it, and its buttons bottom-right with
  **the default action carrying a `⏎` glyph** and Cancel to its left.
- A control panel (the Inspector) has a **title and a close box**, a pop-up
  list at the top to switch inspector, and grouped, labelled boxes below —
  `Permissions` as a Read/Write × Owner/Group/Other grid of ticks, `Changed`
  as a little clock and tear-off calendar. `Revert` / `OK` at the foot.

**The dock (fig 8).** An app icon carries **three small dots when the app is NOT
running**. Running apps have no dots. One glyph, and the dock becomes a status
display rather than a launcher.

**Focus is THREE states, not two (fig 9).** This is the part a modern
implementation gets wrong by default, and it is worth doing properly because it
is the one place the UI is cleverer than what replaced it.

A window can be **key** (it takes the keystrokes) and/or **main** (it is the
document the app's menu acts on). They are not the same thing, and the title
bar says which:

| standard window's title bar | means |
|---|---|
| **black** | key AND main |
| **dark grey** | main, not key |
| **light grey** | neither |

| panel's title bar | means |
|---|---|
| **black** | key, not main |
| **light grey** | neither |

**A panel can never be main**, which is why it has no dark grey. That is the
whole point of the distinction: open the Inspector over a document and the
Inspector goes black (it has the keyboard) while the document goes **dark grey**
— still the thing being worked on. Two windows, both lit, saying different
things about what they are for. Modern desktops collapse this to one bit and
lose it.

**Controls.**
- **Action** button (does a thing) vs **two-state** button (sets a thing). A
  **radio matrix** is a group of two-state buttons where exactly one is on.
- **Text field**: one line, editable and selectable, and **Tab moves between
  fields in a group**.
- **Slider vs scroller (fig 10)**, and the difference is the knob: **a scroll
  knob's SIZE shows how much of the content is visible**; **a slider knob's size
  never changes**. So a scroller reports two things at once — position and
  proportion — and a slider reports one.

## The primitives (build these first)

1. **The window.** Grey chrome, ribbed title bar, close box right, miniaturise
   box left, resize bar at the foot. Draggable by the title bar. A z-order.
2. **The menu.** The vertical Workspace menu top-left: `Info / File / Edit /
   Disk / View / Tools / Windows / Services / Hide / Log Out`, each row with its
   key equivalent right-aligned, submenus opening to the right.
   **Tear-off**: a submenu dragged away becomes a floating panel with its own
   close box (the reference shows `Tools` torn off). This is the most
   distinctive interaction NeXTSTEP has and it is cheap once windows exist.
3. **The dock.** Column down the right edge, app icons, the cube at the top and
   **the recycler always at the foot** — those two positions are fixed, the
   middle is the user's. Two of the tiles are live rather than launchers: a
   **clock** showing the time and a **calendar** showing the date. Ours read
   the island clock, so the dock is where day/night is visible from inside the
   Workspace without a window. Three dots under an icon means the app is not
   running.
4. **The column browser.** The thing everyone remembers: columns of names,
   `▷` on a directory, selection scrolls a new column in from the right, the
   selected item's icon in the final pane.
5. **Miniaturised icons** on the desktop floor, restored by double-click.

## The applications (thin, on top of those)

| app | does | notes |
|---|---|---|
| **File Viewer** | three parts — see below | stage 1 on its own is most of the value |
| **Edit** | open a file, change it, save; structure folding | this is where `main.ml` gets re-guarded — R1's third door |
| **Librarian** | search the docs, driven from any app's selection via Services | the lookup mechanic, see below |
| **Terminal** | the existing core console, in a window | keeps the typed loop |
| **Inspector** | Attributes: path, size, owner, group, permissions grid, changed date | the reference panel; pure decoration and worth it |
| **Project Builder** | the hub: a project is a DIRECTORY, and it generates main, a nib, a makefile, `PB.project` | stage 3 |
| **Interface Builder** | wire objects: "establish the target and action for a control" | stage 3, and see below |

### The File Viewer is three parts, and they have names

- **The shelf** — the strip under the title bar. It stores icons of any file or
  folder, and **the upper-left one is always home** (the house). You put
  something there by dragging it up from the browser, and take it off by
  dragging it out into the workspace.
  On Ogygia the house is HERS, and `main.ml` on the shelf is a player marking
  the file they intend to change. That is a nicer bookmark than anything we
  would have invented.
- **The icon path** — the trail from the machine down to where you are, `▷`
  between each, the current one highlighted.
- **The browser** — which keeps its name in **icon** view or **listing** view,
  both of which the View menu offers.

### Edit is a code editor, and two of its features are game mechanics

The tutorial recommends Edit over emacs and vi for someone starting out,
because "it works like most other NeXTSTEP programs" — the consistency rule
again, sold as a reason to pick a tool. Its title bar carries three fields:
**`LinesView.m - C- — ~/Lines`**, so filename, language mode, and directory.
Ours would read `main.ml - ML - ~/`.

**Structure folding.** `Format ▷ Structure ▷` has four rows with key
equivalents: `Contract All (0)`, `Expand All (9)`, `Contract Sel`, `Expand Sel`.
Double-clicking an opening brace selects to its matching close. A contracted
block collapses to a **white arrow** ( ⟨▭⟩ ) sitting inline where the code was,
and clicking the arrow expands it. This is worth building for one reason: her
`main.ml` is 1704 bytes and the guard the player needs is buried in it. Contract
All gives them the shape of the file in one screen — every function reduced to
its header and an arrow. It is navigation, and it is period-correct, and it
means we do not need a Find panel to make the file usable.

**Services ▷ Librarian ▷ Search.** Select an identifier, choose that, and the
Librarian launches and searches the documentation for it. This is the lookup
mechanic, and it already exists in the artefact rather than being bolted on:
the player selects `RELEASE` in her source, asks the system what it is, and
gets the page. Note the pattern — a Service takes **the current selection**
from any app and hands it to another. One implementation, available everywhere.

**The Librarian window** (fig 8) is the File Viewer's anatomy reused, which is
the point about consistency doing real work:

- **a shelf of bookshelves** across the top, one selected and lit —
  `Concepts`, `NeXT Developer`, `Developer RelNotes`, `UNIX Manual Pages`.
  Ours: `Ogygia`, `ML Reference`, `RONML Notes`, `UNIX Manual Pages` — and the
  last one can be the `MAN` table we already have.
- **a control row**: `List Titles` and `Search` as big icon buttons, the search
  field, a plain count (`38 found`), and two pop-ups (`In Contents ▣` /
  `Word ▣`) which set the scope.
- **a results listing** of full paths, one selected.

### The Workspace menu, in full (fig 13)

Copy it. The key equivalents are part of the artefact.

```
Workspace
  Info ▷      Info Panel… · Legal… · Preferences… · Help… (?)
  File ▷      Open (o) · Open as Folder (O) · New Folder (n) · Duplicate (d)
              Compress · Destroy (r) · Empty Recycler
  Edit ▷      Cut (x) · Copy (c) · Paste (v) · Delete · Select All (a)
  Disk ▷      Eject (e) · Initialize…
  View ▷      Browser (B) · Icon (I) · Listing (L) · Sort Icons
              Clean Up Icons · New Viewer (N) · Update Viewers (u)
  Tools ▷     Inspector… · Finder (f) · Processes… (P) · Console (C)
  Windows ▷   Arrange in Front · ✕ File Viewer · ✕ Finder
              Miniaturize Window (m) · Close Window (w)
  Services ▷  Define in Webster (=) · Edit ▷ · Librarian ▷ · Mail ▷
              Project ▷ · Terminal ▷
  Hide        h
  Log Out     q
```

Two things to keep rather than tidy away:
- **Rows stay when they cannot be used**, greyed. `Open as Folder`, `Browser`,
  `Sort Icons` are greyed in the reference because of what is selected at that
  moment, not removed. The menu is a map of the system, not of this instant.
- **`Windows` lists the open windows** with a mark beside each, so it doubles as
  a window list. `Close Window` greys out when there is nothing to close.
  The marks carry state: **`✕` is an open window, `✕` WITH A HOLE is one with
  unsaved changes** — the same glyph and the same meaning as in the title bar's
  close button — and **`::` is one that is miniaturised**. So the dirty flag
  shows in two places at once and they are the same symbol, which is the
  consistency rule doing real work rather than being a slogan.

**Folder windows list `../` at the foot** to go up, rather than putting a
control in the chrome.

**Log Out (q)** is the one to think about. On her island, a menu item that ends
the session, sitting under a machine you reached by walking through a wood you
cannot leave, is either very funny or the best thing in the build. It should
probably do exactly what it says: close the Workspace, and put you back in the
grove, with the lights still going.

### Why Interface Builder is the right home for R1's third door

From the reference: IB's whole idea is that you connect objects by dragging.
So **dragging a connection into `RELEASE`** is not an editor invented for this
game — it is the tool behaving completely normally. The `agreed` transition in
`calypso-code.js` is guarded on something nothing sets; the hack is to notice
that and re-guard it on a predicate that IS true. In a text editor that is a
line change. In IB it is a wire, pulled from one object to another, in front
of you.

That is the strongest version of the door and it is the reason to get to
stage 3 eventually. It is **not** a reason to start there.

---

## Staging

- **V1a — the primitives + File Viewer. SHIPPED, v1.528–v1.535.** Her files,
  browsable in her own chrome, in windows you can move, **resize** (viewer/edit,
  not the board), stack and miniaturise. Boot sequence; the figure-13 menu with
  tear-off, and **every leaf resolves** — an action, or a NeXTSTEP **attention
  panel** saying it does nothing yet (a world toast would sit behind the
  desktop). Shelf (icons open what they point at), icon path, column browser,
  dock with a live clock and calendar. **Windows drag even when over another
  window** (hit rects carry a stacking z + within-window priority). Edit with
  structure folding and text **clipped to the page**. Preferences with
  **Calypso Self-Learn** (always available; the board's start button reads
  SELF-PLAY and self-play ends on the WarGames WINNER: NONE). Her source moved
  into a **braincode/** folder. Terminal.app is her black-on-white console with
  a `/bin/csh (ttyp1)` title bar and a login banner; it **suspends** (not
  closes) when you click the desktop and resumes from the dock. `run` opens her
  draughts board, not pong. Menu dropped clear of the game's help control; Hide
  tucks the windows away rather than logging out.
  Still to click-verify in play: the full read/edit/post loop, tear-off, the
  Self-Learn WarGames ending, and resize under a real cursor.
- **V1b — the console as a real canvas window.** The terminal is a DOM overlay
  above the canvas, so it can neither sit behind a window nor be clicked
  through; suspend/resume is the interim. Rendering it on the canvas as a
  workspace window is the proper fix, and it also unlocks Edit driving the same
  read/edit/post loop entirely inside the desktop.
  **Foundation landed (v1.536):** `game/console-buffer.js` — a pure,
  island-agnostic console model (scrollback, line editing, history, wrap, theme
  hook), 12 tests, no wiring yet so nothing that works can break. Made abstract
  on purpose (David, 2026-08-13): CALYPSO renders through it first, any island's
  console can adopt it later.

  **Wired, and it is a window:** `ui._wsTerminal` draws the buffer inside a
  window rect, black on white and monospace, with the caret shown only on the
  focused window. The window's size decides `cols`/`rows` and tells the model,
  so the wrap lands where it is drawn rather than somewhere near it. Terminal.app
  from the dock now opens a canvas window instead of the DOM panel: it stacks,
  drags, resizes and sits over the File Viewer with the desktop behind it, which
  the overlay never could. Keys are taken by one `window` listener that fires
  only when the focused window is the terminal, so the desktop shortcuts, the dev
  word and the movement keys are untouched everywhere else. Output goes through
  `replPrint`, which mirrors into the buffer, and submit calls `coreRun`, so one
  dispatch feeds the panel and the window and they cannot drift.
  `coreBanner()` was lifted out of `openCoreTerminal` so both open on the same
  words. **The DOM terminal stays for obelisks / HERMES / the laptop**, so the
  blast radius is her sanctum. Verified in play: launch, banner, her voice,
  `help` typed and answered, wrap at the window edge, caret at the prompt.
  **The DOM panel is retired for her station.** Her cube already opened the
  Workspace rather than `openCoreTerminal`, so the panel was only reachable by
  the four martial daemons; its CALYPSO branches, the `nextstep`/`on-desktop`
  chrome, the title-bar override, the title-bar drag handler and the whole
  `suspendTerminal`/`terminalSuspended` pair are gone. All of that existed for
  one reason: a DOM overlay cannot sit behind a window. The canvas window can,
  so none of it has a job. `wsTermCx` is cleared on Log Out. The two class names
  stay in `TERM_CHROMES` because that list's job is to CLEAR what it does not
  want, and a class nobody sets is exactly the sort of thing that comes back.
  **TODO, and it is a correction rather than a feature.** `Info ▷ Processes…` is
  in the menu because the figure-13 menu is reproduced whole, but **NeXTSTEP had
  no native graphical process viewer**. Task management went through the
  Workspace Manager itself and through the Unix tools — `ps`, `top` — typed into
  Terminal.app. So this leaf must NOT grow into a window with a process list:
  that would be inventing an application the system never shipped, on a desktop
  whose whole claim is that it is the real one. Either it stays a refusal, or it
  answers by telling you to type `ps` at her prompt, which is where the answer
  actually lived. Her Terminal is a real console now, so `ps` is a thing that
  could genuinely work. (David, 2026-08-13.)

  **Still open:** Edit driving the read/edit/post loop inside the desktop;
  scrollback by mouse wheel; and the dead `.nextstep` / `.on-desktop` CSS in
  index.html, which nothing can now apply.
- **V1c — Project Builder / Interface Builder.** Only once a and b are good in
  play. Do not start this first because it is the most interesting.

## What exists to build on

- `ui.js` — `_nextBevel`, `_nextTitleBar`, `_nextButton` from the draughts
  cabinet (K2, v1.479). The chrome vocabulary is already here and already
  matches the reference.
- `calypso-code.js` — `calypsoFiles()` is the filesystem: seven files,
  `main.ml` 1704 bytes among them.
- The `#obterminal` panel shows how a full-screen overlay is wired, focused and
  dismissed.
- `screenCovered()` (v1.525) already throttles the world's draw behind a
  full-screen panel. The Workspace must use it — the grove is ~1,000 lit floor
  studs a frame and there is no reason to draw them behind a desktop.

## The trap to avoid

The reference is a working operating system with twenty years of thought in it,
and the temptation is to build all of it. The test for every element: **does a
player who never opens Project Builder still meet the argument?** If yes, it
can wait. Stage one is the File Viewer over her own source, in her own chrome,
on a machine where the windows obey you.
