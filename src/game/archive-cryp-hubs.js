// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE CRYPTOGRAPHY WEBRINGS.
//
// The master ring is cryptography-ring, which every page joins. Under it run six
// strands: classical ciphers, stream and symmetric, public-key, hashing and
// integrity, the crypto wars, and the four seals on this machine.

const ring = (domain, name, title, bg, blurb, members, sisters) => ({
  domain, name, title,
  body: [
    `<!--bg:${bg}-->`,
    `<h1>${title}</h1>`,
    '<p><small>a webring · a page joins by adding the strip · walked, not searched</small></p>',
    '<hr>',
    ...blurb,
    '<p><b>Member sites</b>:</p>',
    '<ul>',
    ...members.map(([d, t]) => `<li><a href="${d}">${t}</a></li>`),
    '</ul>',
    ...(sisters ? ['<p><small>strands: ' + sisters.map(([d, t]) => `<a href="${d}">${t}</a>`).join(' · ') + '</small></p>'] : []),
    '<hr>',
    '<p><small>« prev · <a href="' + members[0][0] + '">random</a> · next »<br>',
    'the ringmaster is factoring something. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['cryptography-ring.geocities.ws', 'Cryptography Ring'],
  classical: ['classical-ciphers-ring.geocities.ws', 'The Classical Ciphers Ring'],
  symmetric: ['stream-and-symmetric-ring.geocities.ws', 'The Stream &amp; Symmetric Ring'],
  publickey: ['public-key-crypto-ring.geocities.ws', 'The Public-Key Ring'],
  integrity: ['hashing-and-integrity-ring.geocities.ws', 'The Hashing &amp; Integrity Ring'],
  cryptowars: ['crypto-wars-ring.geocities.ws', 'The Crypto Wars Ring'],
  seals: ['the-seals-ring.geocities.ws', 'The Seals of This Machine Ring'],
  people: ['the-cryptographers-ring.geocities.ws', 'The Cryptographers Ring'],
};

const A = [['the-vigenere-cipher.geocities.ws', 'The Vigenère Cipher'], ['the-caesar-cipher.geocities.ws', 'The Caesar Cipher'],
  ['the-substitution-cipher.geocities.ws', 'The Substitution Cipher'], ['the-transposition-cipher.geocities.ws', 'The Transposition Cipher'],
  ['frequency-analysis.geocities.ws', 'Frequency Analysis'], ['the-one-time-pad.geocities.ws', 'The One-Time Pad']];
const B = [['rc4.geocities.ws', 'RC4'], ['the-stream-cipher.geocities.ws', 'The Stream Cipher'],
  ['xor-and-the-repeating-key.geocities.ws', 'XOR &amp; the Repeating Key'], ['the-enigma-machine.geocities.ws', 'The Enigma Machine'],
  ['des-and-the-block-cipher.geocities.ws', 'DES &amp; the Block Cipher'], ['the-keystream.geocities.ws', 'The Keystream']];
const C = [['rsa.geocities.ws', 'RSA'], ['diffie-hellman.geocities.ws', 'Diffie-Hellman'],
  ['the-trapdoor-function.geocities.ws', 'The Trapdoor Function'], ['integer-factorisation.geocities.ws', 'Integer Factorisation'],
  ['the-key-exchange.geocities.ws', 'The Key Exchange'], ['the-digital-signature.geocities.ws', 'The Digital Signature']];
const D = [['the-hash-function.geocities.ws', 'The Hash Function'], ['the-checksum.geocities.ws', 'The Checksum'],
  ['md5-and-sha.geocities.ws', 'MD5 &amp; SHA'], ['the-message-authentication-code.geocities.ws', 'The MAC'],
  ['the-collision.geocities.ws', 'The Collision'], ['the-fingerprint.geocities.ws', 'The Fingerprint']];
const E = [['pgp-and-phil-zimmermann.geocities.ws', 'PGP &amp; Phil Zimmermann'], ['the-clipper-chip.geocities.ws', 'The Clipper Chip'],
  ['export-grade-crypto.geocities.ws', 'Export-Grade Crypto'], ['the-key-length-debate.geocities.ws', 'The Key-Length Debate'],
  ['the-cypherpunks.geocities.ws', 'The Cypherpunks'], ['key-escrow.geocities.ws', 'Key Escrow']];
const F = [['the-four-seals.geocities.ws', 'The Four Seals'], ['the-letter-rc4.geocities.ws', 'The Letter (RC4)'],
  ['the-warning-rsa.geocities.ws', 'The Warning (RSA)'], ['the-session-vigenere.geocities.ws', 'The Session (Vigenère)'],
  ['the-note-xor.geocities.ws', 'The Note (XOR)'], ['steganography.geocities.ws', 'Steganography']];
const G = [['agrippa-a-book-of-the-dead.geocities.ws', 'Agrippa (A Book of the Dead)'], ['ron-rivest.geocities.ws', 'Ron Rivest'],
  ['shamir-and-adleman.geocities.ws', 'Shamir &amp; Adleman'], ['blaise-de-vigenere.geocities.ws', 'Blaise de Vigenère'],
  ['diffie-and-hellman.geocities.ws', 'Diffie &amp; Hellman'], ['the-manchester-love-letters.geocities.ws', 'The Manchester Love Letters']];

export const CRYP_RINGS = [
  ring(R.master[0], 'CRYPTOGRAPHY RING', 'Cryptography Ring', 'cryp-symmetric',
    ['<p>The mathematics that turned political: the classical ciphers, the stream and block ciphers, the '
      + 'public-key revolution, the hash and the fingerprint, the crypto wars of the decade, and the four '
      + 'sealed things on the machine you are reading this on.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F, ...G],
    [R.classical, R.symmetric, R.publickey, R.integrity, R.cryptowars, R.seals, R.people]),

  ring(R.classical[0], 'THE CLASSICAL CIPHERS RING', 'The Classical Ciphers Ring', 'cryp-classical',
    ['<p>Pen, paper and the tableau: the shift, the polyalphabetic keyword, the substitution and its '
      + 'downfall to letter counts, the reordering rail, and the perfect but impractical pad.</p>'],
    A, [R.symmetric, R.seals]),

  ring(R.symmetric[0], 'THE STREAM AND SYMMETRIC RING', 'The Stream &amp; Symmetric Ring', 'cryp-symmetric',
    ['<p>One key for both ends: the RC4 keystream, the exclusive-or and the fatal repeated key, the '
      + 'rotors of Enigma, the 56 bits of DES, and the stream that must never repeat.</p>'],
    B, [R.classical, R.publickey]),

  ring(R.publickey[0], 'THE PUBLIC-KEY RING', 'The Public-Key Ring', 'cryp-publickey',
    ['<p>A key you can publish: the RSA modulus and its primes, the Diffie-Hellman handshake over an open '
      + 'wire, the one-way trapdoor, the hardness of factoring, and the signature.</p>'],
    C, [R.symmetric, R.integrity]),

  ring(R.integrity[0], 'THE HASHING AND INTEGRITY RING', 'The Hashing &amp; Integrity Ring', 'cryp-integrity',
    ['<p>Not secrecy but proof: the one-way digest, the checksum that is not cryptographic, MD5 and SHA, '
      + 'the keyed MAC, the inevitable collision, and the fingerprint you read down the phone.</p>'],
    D, [R.publickey, R.cryptowars]),

  ring(R.cryptowars[0], 'THE CRYPTO WARS RING', 'The Crypto Wars Ring', 'cryp-cryptowars',
    ['<p>Mathematics as munitions: Zimmermann and the printed source, the Clipper chip and its back door, '
      + 'the crippled 40-bit export builds, the key-length tables, and the cypherpunks who wrote code.</p>'],
    E, [R.integrity, R.seals]),

  ring(R.seals[0], 'THE SEALS OF THIS MACHINE RING', 'The Seals of This Machine Ring', 'cryp-seals',
    ['<p>Four texts under four locks, and a fifth way in that is no lock at all: the mechanical letter, '
      + 'the warning that opens once, the session under a name, the note under a repeating breath, and the '
      + 'thing hidden in the page itself. The ciphers are named here; the keys are not.</p>'],
    F, [R.classical, R.cryptowars, R.people]),

  ring(R.people[0], 'THE CRYPTOGRAPHERS RING', 'The Cryptographers Ring', 'cryp-people',
    ['<p>The hands behind the locks, and the two works the seals borrow: the self-erasing Agrippa, the '
      + 'man whose ciphers seal two of the four, the S and the A of RSA, the diplomat who lent his name '
      + 'to the polyalphabetic cipher, the pair who opened the public-key door, and the machine that '
      + 'wrote a love letter in 1952.</p>'],
    G, [R.seals, R.publickey]),
];
