// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// WHAT THE TOWER WAS BEFORE (#197).
//
// David, 2026-08-18: "Can we have additional folders as well (both on obs and
// via telnet — they should be the same) for different elements of the ob — or
// just archaic remnants of their original human programming."
//
// A tower's disk held two things: `logs/`, which is the estate writing about
// its units this week, and the bench, which is whatever you copied there. Both
// are about NOW. Nothing on it remembered that somebody built the thing.
//
// These folders do. They are the layer underneath — a machine that was
// installed by a contractor, commissioned by a person with a name, handed to
// staff who kept a rota and a tea fund on it because it was the only disk in
// the building, and then inherited by software that never deleted any of it
// because deleting was not in the software's job.
//
// THE RULE FOR EVERYTHING IN HERE: nobody is talking to the player. Not one
// file addresses a reader, hints at a puzzle, or knows the world ended. They
// are documents that were correct when they were written and are still sitting
// there. The horror, where there is any, is arithmetic the player does: a
// calibration due date, a rota with the same four names on it, a mail spool
// with one message in it from seven years ago.
//
// STATIC AND PURE, like keeper.js and HERMES_DOCS: a path in, a listing or a
// body out. `${CODE}` is substituted with the tower's own code so a page reads
// as that machine's rather than as a template — that is the only thing here
// that varies, and it varies because the estate's own tooling did it.

export const OB_ARCHAIC_TREE = {
  etc: ['motd', 'hosts.old', 'crontab'],
  staff: ['rota.txt', 'teafund.txt', 'leaving.txt'],
  wx: ['README', 'calib.log'],
};

/** The folders, in the order a listing should show them. */
export const OB_ARCHAIC_DIRS = Object.keys(OB_ARCHAIC_TREE);

/** One line each, for the `drives` banner. */
export const OB_ARCHAIC_ABOUT = {
  etc: 'the machine as it was set up',
  staff: 'the people who used to be here',
  wx: 'the weather station on the mast',
};

const FILES = {
  'etc/motd': `SunOS Release 4.1.4  (\${CODE})  #3

  ** OBSERVATION MAST \${CODE} **
  Site network. Authorised users only.

  Please do NOT power-cycle this cabinet to clear a fault. Log it.
  The mast heater draws off the same rail and the anemometer ices at 3C.

  Fault line: ext 2140 (working hours)
              ext 2199 (out of hours, rings the gate house)

  Last edited by R. Amell, estates & grounds.`,

  'etc/hosts.old': `# pre-conversion hosts file. kept because the survey rig
# still has some of these hard-coded and nobody will own that.

127.0.0.1       localhost
10.0.2.11       \${CODE}         mast obs
10.0.2.12       mast-b          (decommissioned)
10.0.2.20       gatehouse       gh
10.0.2.21       workshop
10.0.2.30       office          admin acct
10.0.2.40       weighbridge
10.0.2.99       tape            backup, tuesdays

# do not renumber without telling the workshop. they will not notice
# for a fortnight and then they will notice all at once.`,

  'etc/crontab': `# min hr  dom mon dow  command

  */5 *   *   *   *    /usr/local/bin/mast_sample
  0   *   *   *   *    /usr/local/bin/mast_roll
  0   6   *   *   *    /usr/local/bin/mast_summary | mail obs
  0   2   *   *   2    /usr/local/bin/backup_tape
  15  4   1   *   *    /usr/local/bin/calib_check

# mast_sample has run every five minutes since commissioning.
# backup_tape has failed every tuesday since the drive went. it will
# keep trying. that is what it is for.`,

  'staff/rota.txt': `MAST CHECK — WEEKLY ROTA

Walk the mast, read the gauge, sign the sheet. Ten minutes.

  wk 1   R. Amell
  wk 2   J. Okonkwo
  wk 3   R. Amell
  wk 4   P. Sandhu
  wk 5   J. Okonkwo
  wk 6   R. Amell

  ... repeats.

If the anemometer is iced do NOT free it by hand, it bends. Kettle of
warm water, and tell the workshop it happened again.

Rota kept by whoever has been here longest, which is R. Amell, which is
why R. Amell is on it three weeks in six.`,

  'staff/teafund.txt': `TEA FUND

  in the tin        £14.60
  owed by Pete      £2.00   (says he paid, tin says otherwise)
  owed by the night shift    unknown, nobody asks

  milk rota: whoever is in first. this has never worked.

  BISCUITS ARE NOT COVERED BY THE FUND. this was discussed at length
  and the decision was final and it is still being discussed.`,

  'staff/leaving.txt': `for R's last day —

sign below, don't spoil it, and DO NOT put it on the noticeboard until
friday because she comes past the board every morning.

  All the best, from all of us in the workshop
  Thanks for eighteen years of not once saying I told you so
  You are the only person who ever understood the tape drive
  Don't be a stranger. Come back and shout at the anemometer.
  Enjoy the garden!!
  From the night shift — sorry we never met properly, but the log
  said you'd been in and fixed it before we got here, most weeks

typed up by J.O. because nobody could read the card.`,

  'wx/README': `OBSERVATION MAST — \${CODE}

Anemometer, vane, thermistor pair, and a rain gauge that reads low in
anything over about 20mm/hr and always has.

Sampled every five minutes. Rolled hourly. Summarised at 0600 and mailed
to obs, who forward it on to the regional set.

The data is only worth anything if the calibration is current. See
calib.log, and if it is out of date the correct thing to do is say so in
the summary rather than quietly keep sending it.`,

  'wx/calib.log': `ANEMOMETER / THERMISTOR CALIBRATION

  date        by          result       next due
  ----------  ----------  -----------  ----------
  12/03       R. Amell    pass         12/09
  09/09       R. Amell    pass         09/03
  14/03       P. Sandhu   pass (vane   14/09
                          2 deg, noted)
  11/09       R. Amell    pass         11/03
  10/03       R. Amell    pass         10/09
  08/09       J. Okonkwo  pass         08/03

  ** NEXT DUE 08/03 **

  mast_sample continues to run. the summary continues to be mailed.
  the calibration is a separate job and it is not automatic.`,
};

/** Does this drive path name one of the archaic folders? */
export function isArchaicDir(sub) {
  return OB_ARCHAIC_DIRS.includes(String(sub || ''));
}

/** What is in `sub`, or the folder names themselves for the drive root. */
export function archaicLs(sub) {
  const key = String(sub || '');
  if (!key) return OB_ARCHAIC_DIRS.map((d) => `${d}/`);
  return (OB_ARCHAIC_TREE[key] || []).slice();
}

/**
 * The text of a file in one of these folders, with the tower's code stamped in.
 *
 * Extension-forgiving and case-insensitive like every other read at these
 * terminals. `code` is the tower's own (OB_1A2B); a missing one falls back to
 * the generic mast label rather than printing an empty box.
 */
export function archaicRead(sub, name, code = 'OB') {
  const dir = String(sub || '');
  const want = String(name || '').toLowerCase().trim();
  const list = OB_ARCHAIC_TREE[dir] || [];
  const hit = list.find((f) => f.toLowerCase() === want
    || f.toLowerCase().replace(/\.[a-z]+$/, '') === want);
  if (!hit) return null;
  const body = FILES[`${dir}/${hit}`];
  return body == null ? null : body.replace(/\$\{CODE\}/g, String(code || 'OB'));
}

/** Every readable path, for a test to walk. */
export function archaicPaths() {
  return Object.keys(FILES);
}
