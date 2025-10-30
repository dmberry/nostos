# Laptop telnet into an obelisk console

## The idea
The NostBook becomes a remote console. `telnet <ob>` opens that obelisk's OWN
AI-ML console from the laptop — `scan`, `hack`, `tag`, `crash`, the lot, exactly
as if you were jacked in at the tower, with the machine's green phosphor to say
you are inside their kit now (versus the NostBook's pale phosphor). This is where
tagging and the rest of the network work happen, so there is NO separate laptop
tag/obs toolkit: one console, reached two ways.

## Access — the card lives on the laptop
Jacking in at the tower needs the access chip in hand. Remotely, the chip has to
be IN the NostBook. You copy it in by dragging the access card onto the laptop (read the slot as USB
or SD): the NostBook bleeps, copies the key into `/mnt` on the disk, and the
physical card bounces straight back to your inventory — nothing consumed, you
still carry the card. (This drag → bleep → copy → return-to-inventory is a clean
reusable mechanic: other cards/keys can be pulled onto the laptop the same way.)
`telnet <ob>` checks `/mnt` for the key; without it, connection refused — "no
access chip mounted."

## Behaviour
- `telnet <ob>` (tower reachable + up; key mounted) → green console, `terminalOb`
  = the remote tower, the same `ronmlCtx` the physical console uses. Full verbs.
- `^]` / `quit` / `logout` → back at the NostBook shell, pale phosphor.
- Destructive verbs work remotely too (decision: "exactly the same"). The gate is
  the mounted card + the tower being on the wire, not a verb whitelist. The AI key
  still gates the sharp verbs (sleep/rewind/repel/unlock), remote or not, exactly
  as `ctx.hasAiKey` already enforces at the tower.
- Card up required (same wire as get/post/netscape).

## What it replaces
The garrison-addressed laptop tag toolkit (`obs` / `tag <ob> <robot>` / `-all` /
`-auto` / tags-as-aliases) is NOT built — you telnet in and use the console's own
`tag`. The flat `tag <unit>` shell command from v1.442 comes off the laptop too;
tagging is a console mechanic now. The sniffer's click-to-tag stays — it is quick
in-range identification and does not need a console.

## Build stages
1. **Mount.** Drag the access card onto the laptop → copy the key to `/mnt` on the
   disk (kept, not consumed). A `mount` / `umount` command for keyboard players;
   `ls /mnt` shows the mounted key.
2. **telnet routing.** In `telnetOpen`, if the host is an obelisk AND `/mnt` holds
   the key, enter OB-console mode (`terminalOb = ob.ref`, green theme); else the
   period-correct "connection refused" with the reason.
3. **REPL.** While in telnet-OB, run lines through `ronmlCtx()` against the remote
   tower; `^]`/`quit` restores laptop mode + theme + prompt.
4. **Cleanup.** Remove the flat laptop `tag`; update man pages. The OB console
   `tag` verb and the sniffer stay.

## Open
- **Which credential.** The access CHIP jacks you into a console; the AI KEY gates
  the fortress and the sharp verbs. Mounting the CHIP is the telnet gate; the AI
  key requirement for sharp verbs is unchanged (`ctx.hasAiKey`).
- **Mount UI.** Drag-onto-laptop (tangible, what was asked) vs a `mount` command
  that reads a held card (keyboard-friendly). Likely both.
