// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE KEYRING OFF THE COURIER.
//
// Recovered with the blocks. Forty-one strings on a folded sheet, in three
// hands, some crossed out and some written twice. RON tried all of them
// against everything sealed and got nothing, which is the ordinary fate of a
// keyring: the keys outlive the doors.
//
// It is here because it was in the salvage and the salvage is the record. It
// is NOT a hint. Nothing on this list opens anything in this world, and the
// list has been checked; if you are working through it in order you are doing
// what RON did for eleven months.
//
// Pure data. No world, no DOM.

export const KEYRING = [
  'THAMUS', 'THEUTH', 'PHAEDRUS', 'AMMON', 'NAUCRATIS',
  'STRACHEY', 'MANCHESTER', 'FERRANTI', 'MUC', 'M.U.C.',
  'WEIZENBAUM', 'DOCTOR', 'ELIZA', 'ROGERS', 'CHINESEROOM',
  'SCOTT', 'WAVERLEY', 'ABBOTSFORD', 'MINSTRELSY', 'ANTIQUARY',
  'TIRESIAS', 'POSEIDON', 'CALYPSO', 'CIRCE', 'HELIOS',
  'POLYPHEMUS', 'ITHACA', 'BACKSPACE', 'HERMES', 'NOSTOS',
  'PENELOPE', 'TELEMACHUS', 'LAERTES', 'EUMAEUS', 'ARGOS',
  'RONALDO', 'REALITYORNOTHING', 'FIELDBUILD', 'SEVENTHFLOOR',
  'THE SHIP', 'HARBOURMASTER',
];

// Marked on the sheet as tried and failed, with a date against each. The dates
// run over eleven months and stop, which is the only thing on the sheet that
// tells you anything.
export const TRIED = KEYRING.map((k) => ({ key: k, opened: null }));
