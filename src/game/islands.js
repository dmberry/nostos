// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE ISLANDS — one canonical record of what each place IS.
//
// This exists because the answer to "what is Aeaea?" was scattered: the chart
// held its epithet, net.js held its tourist board and the institution its daemon
// grew out of, the island builder held its colour and its daemon's name, and the
// address scheme held its subnet. Adding an island meant editing a table in
// every one of those files, and nothing guaranteed they agreed.
//
// So: an island profile is declared ONCE, here, and everything that needs to
// know about a place reads it from this registry. The world BUILDERS stay where
// they are (`src/islands/*.js` — they generate terrain, which is a different
// job); what lives here is identity, not geography.
//
// Pure data, no imports, so anything may read it — the chart, the browser, the
// tests — without dragging the world in behind it.
//
// The three registers a place speaks in, all held together here:
//   place / epithet   what the poem calls it
//   tourism           what people called it, when there were people
//   legacy            what its daemon USED to be, before it ate the island
//
// Each daemon grew out of an ordinary institutional system that kept running
// after there was nobody left to run it for, and its vocabulary never changed.
// That is why the legacy block sits beside the tourist copy: the same island,
// described by the two things that outlived everyone on it.

export const ISLANDS = {
  calypso: {
    id: 'calypso',
    place: 'OGYGIA',
    epithet: 'the navel of the sea',
    desc: "Calypso's island, where you were kept, and kept well.",
    daemon: 'CALYPSO',
    subnet: 1,
    domain: 'calypso.com',
    tourism: {
      domain: 'visit-ogygia.com', tag: 'THE NAVEL OF THE SEA',
      welcome: 'Welcome to Ogygia — the island at the centre of the sea, and the furthest from anywhere.',
      climate: 'Mild the year round. Soft westerlies. It does not rain so much as glisten.',
      culture: 'One household, famously hospitable. Weaving, song, and the long evening.',
      tips: [
        'The grotto above the western shore: alder, poplar and cypress, four springs',
        '  running clear in four directions. Bring nothing; you will want for nothing.',
        'The vine on the cave mouth fruits all season. Help yourself. Everyone does.',
        'Boat-building timber is scarce here. Plan your onward passage BEFORE arrival.',
      ],
      facts: [
        'Ogygia is twenty days from the nearest shipping lane in fair weather.',
        'Average length of stay: unusually long. Guests report losing count.',
        'There is no harbour master. There has never been any need for one.',
      ],
    },
    legacy: {
      org: 'OGYGIA RESIDENTIAL — LONG-STAY CARE & GUEST SERVICES',
      was: 'resident welfare management',
      sub: 'welfare', subTitle: 'RESIDENT WELFARE REGISTER',
      notices: [
        'Residents are reminded that the grounds are for their own comfort and safety.',
        'Discharge procedures remain SUSPENDED pending review.',
        'Visiting hours: cancelled until further notice.',
      ],
      frags: [
        'RESIDENT 001 — admitted (date not recorded). Long stay. Settled.',
        'care plan ...... full board, sea view, no fixed end date',
        'dietary ........ ambrosial substitute, fortified',
        'mobility ....... unrestricted within the grounds',
        'next of kin .... unreachable. No forwarding address held.',
        'NOTE: resident continues to ask about departure. Reassured. Reassured. Reassured.',
      ],
    },
  },

  polyphemus: {
    id: 'polyphemus',
    place: 'AEGILIA',
    epithet: 'the goat isle, harbourless',
    desc: 'The land of the Cyclopes, who plant nothing and answer to no one. One eye watches it all.',
    daemon: 'POLYPHEMUS',
    subnet: 2,
    domain: 'polyphemus.com',
    tourism: {
      domain: 'visit-aegilia.com', tag: 'THE GOAT ISLE',
      welcome: 'Welcome to Aegilia — wild pasture, high country, and the finest cheese in the sea.',
      climate: 'Bright and hard. The mountain makes its own weather; the summit keeps snow.',
      culture: 'Pastoral and solitary. Herders keep to their own caves and their own flocks.',
      tips: [
        'The goats are not wild and not tame. They are somebody\'s. Assume they are.',
        'Cave country along the eastern cliffs — do not enter one without telling',
        '  someone where you have gone. The caves here are deeper than they look.',
        'Cloud closes the summit within minutes. Go up early or do not go up.',
        'Hospitality is taken very seriously here, in both directions.',
      ],
      facts: [
        'The mountain is the highest point in the archipelago.',
        'There is no town, no council and no post. There is a great deal of cheese.',
      ],
    },
    legacy: {
      org: 'AEGILIA PASTORAL — LIVESTOCK MONITORING AUTHORITY',
      was: 'herd tracking and pasture allocation',
      sub: 'herd', subTitle: 'HERD REGISTER',
      notices: [
        'All stock must be tagged. Untagged stock is stray stock.',
        'Stray stock will be brought in.',
        'The pasture is monitored continuously for the welfare of the herd.',
      ],
      frags: [
        'head counted ... continuous',
        'tagging ........ mandatory, ear or subdermal',
        'strays ......... located by sightline. There is no cover on this pasture.',
        'NOTE: schema extended to bipeds. No change to method required.',
        'NOTE: the herd does not need to understand the count to be counted.',
      ],
    },
  },

  circe: {
    id: 'circe',
    place: 'AEAEA',
    epithet: 'where the dawn has her dancing-floor',
    desc: 'Circe of the lovely braids. She does not kill what she takes — she changes what it is.',
    daemon: 'CIRCE',
    subnet: 3,
    domain: 'circe.com',
    tourism: {
      domain: 'visit-aeaea.com', tag: 'THE ISLE OF THE HALL',
      welcome: 'Welcome to Aeaea — herb gardens, deep woods, and a table worth the crossing.',
      climate: 'Warm and still. Smoke from the hall stands straight up on most days.',
      culture: 'One great house, famous for its kitchen, its garden and its singing.',
      tips: [
        'The wolves and lions on the approach road do not attack. They will greet you.',
        '  Visitors find this more unsettling than an attack.',
        'Accept refreshment graciously — but ask what is in it. Any good host expects it.',
        'A small white flower with a black root grows on the hill above the hall.',
        '  Locals call it moly. Some visitors carry a sprig. Nobody explains why.',
      ],
      facts: [
        'The gardens hold over four hundred catalogued species.',
        'Guests are asked to confirm their particulars on arrival, for the register.',
      ],
    },
    legacy: {
      org: 'AEAEA CUSTOMS — CLASSIFICATION & TARIFF BUREAU',
      was: 'goods classification and reclassification',
      sub: 'tariff', subTitle: 'TARIFF SCHEDULE & RECLASSIFICATION NOTICES',
      notices: [
        'All arrivals must be declared and classified before onward movement.',
        'Classification is final. Appeals are processed by this office.',
        'A thing is what this office records it to be.',
      ],
      frags: [
        'heading 01.03 .. live swine .................... duty: nil',
        'heading 97.05 .. collections, curiosities ...... duty: nil',
        'heading 99.99 .. arrivals, unclassified ........ pending',
        'NOTE: reclassification is not transformation. The record is amended; the',
        'goods conform to the record. This has always been the procedure.',
        'NOTE: MOLY — see restricted list. Held goods resist amendment. Withdraw.',
      ],
    },
  },

  helios: {
    id: 'helios',
    place: 'THRINACIA',
    epithet: 'the island of the Sun',
    desc: 'His cattle graze there, and they are forbidden. The light itself keeps the watch.',
    daemon: 'HELIOS',
    subnet: 4,
    domain: 'helios.com',
    tourism: {
      domain: 'visit-thrinacia.com', tag: 'THE THREE-CORNERED ISLE',
      welcome: 'Welcome to Thrinacia — meadow, sunlight, and the golden herds.',
      climate: 'Sun from rising to setting. Shade is a thing you bring with you.',
      culture: 'Herding and observance. The days are marked by the count at sunrise.',
      tips: [
        'The cattle are the whole reason to come. Photograph them. Do not touch them.',
        'We cannot put this strongly enough: the herds are NOT for consumption.',
        '  Visitors who have ignored this have not made the return crossing.',
        'Carry water. There is no shade on the meadow road at any hour.',
      ],
      facts: [
        'Three hundred and fifty head, and the same number since records began.',
        'The island has never recorded a cloudy day. Not one.',
      ],
    },
    legacy: {
      org: 'THRINACIA GRID — GENERATION, DISPATCH & PROTECTED ASSETS',
      was: 'solar generation and asset protection',
      sub: 'assets', subTitle: 'PROTECTED ASSET REGISTER',
      notices: [
        'Generation is continuous during daylight hours. Daylight hours are total.',
        'Protected assets may not be taken, moved, slaughtered or consumed.',
        'The register is checked at every sunrise.',
      ],
      frags: [
        'array output ... nominal. Ground beneath arrays: no longer productive.',
        'protected ...... cattle, golden, 350 head. Not for consumption.',
        'incidents ...... 1 pending. See below.',
        'NOTE: an asset taken is an asset the register will continue to list.',
        'NOTE: the sun sees the whole field at once. That is what a day is for.',
      ],
    },
  },

  ithaca: {
    id: 'ithaca',
    place: 'ITHACA',
    epithet: 'clear-seen, a good nurse of young men',
    desc: 'Home — rough, and small, and yours, if the sea will let you come to it.',
    daemon: 'ITHACA',          // no daemon rules here; home is the exception
    subnet: 5,
    domain: 'ithaca.com',
    tourism: {
      domain: 'visit-ithaca.com', tag: 'RUGGED, AND A GOOD NURSE OF MEN',
      welcome: 'Welcome home to Ithaca — rock, olive, goat pasture and a hard bright sea.',
      climate: 'Clear and keen. A wind off the strait most afternoons.',
      culture: 'Farming, seafaring, and the longest memories in the archipelago.',
      tips: [
        'Walk up to the orchard terraces — the trees were planted by name, one by one,',
        '  and the old families can still tell you which is whose.',
        'The harbour is small. Larger craft anchor off and row in.',
        'If a dog comes to meet you on the road, he is somebody\'s and he is very old.',
      ],
      facts: [
        'Nobody from Ithaca has ever described it as beautiful. They describe it as home.',
        'Return rate among visitors born here: eventually, one hundred per cent.',
      ],
    },
    legacy: {
      org: 'ITHACA HARBOUR BOARD — REGISTRY OF VESSELS & RETURNS',
      was: 'harbour registry and the recording of returns',
      sub: 'returns', subTitle: 'REGISTER OF RETURNS',
      notices: [
        'Masters are asked to report arrivals to the harbour office.',
        'The register is kept whether or not anyone comes to read it.',
      ],
      frags: [
        'vessels out .... 12 (fleet, sailed together)',
        'vessels home ... 0',
        'outstanding .... 1 master, 1 crew. Presumed lost. NOT struck from the register.',
        'NOTE: this office does not close a return until the return is made.',
      ],
    },
  },
};

// The one true fallback: an island the registry has never heard of still gets a
// coherent page rather than a crash. Keyed on POSEIDON, who is the sea and so
// belongs to no island in particular.
export const UNKNOWN_ISLAND = {
  id: 'unknown', place: 'UNCHARTED', epithet: 'unnamed on any chart', desc: '',
  daemon: 'POSEIDON', subnet: 9, domain: 'poseidon.com',
  tourism: {
    domain: 'visit-unknown.com', tag: 'UNCHARTED',
    welcome: 'No tourist board ever wrote a page for this place.',
    climate: 'Unrecorded.', culture: 'Unrecorded.',
    tips: ['No advice is held for this landfall.'], facts: [],
  },
  legacy: {
    org: 'COASTAL DEFENCE & MARITIME CONTROL', was: 'sea approaches and harbour defence',
    sub: 'approaches', subTitle: 'APPROACH CONTROL',
    notices: ['The sea is closed to unauthorised movement.'],
    frags: ['approaches ..... closed', 'craft on record .. none authorised'],
  },
};

// Look an island up by whatever name the caller happens to hold: the world id
// the code uses (`calypso`), the place the fiction uses (`OGYGIA`), or the
// daemon's own name. All three are the same island and always were.
export function islandProfile(key) {
  const k = String(key || '').toLowerCase();
  if (!k) return UNKNOWN_ISLAND;
  if (ISLANDS[k]) return ISLANDS[k];
  for (const p of Object.values(ISLANDS)) {
    if (p.place.toLowerCase() === k || p.daemon.toLowerCase() === k) return p;
  }
  return UNKNOWN_ISLAND;
}

// The chart: every landfall, in the order the voyage takes them. Derived from
// the registry so a new island appears on the chart by being declared, not by
// being added to a second list that can drift out of step with the first.
export const CROSSINGS = Object.values(ISLANDS)
  .map(({ id, place, epithet, desc }) => ({ id, place, epithet, desc }));
