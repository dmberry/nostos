// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// LA PLAGE. A sequence of photographs, two title cards and a black, with a
// French narration and English subtitles. The same frames and the same takes
// for everybody: `laplage` plays it full page on the NostBook, and a page on the
// cached web embeds it. The browser plays it (data-slides in main.js).

export const STILLS_DIR = 'assets/media/stills';
export const STILLS_AUDIO = 'assets/audio/jetee';

// [file(s), subtitle, milliseconds on screen, narration, a quieter track under
// it]. A narrated still holds for its line and a breath after it.
export const STILLS = [
  ['01.jpg', 'Nothing tells memories from other moments. This one was a morning on the beach at Ithaca, a boat drawn up on the sand, and nobody there yet.', 11100, '01'],
  ['02.jpg', 'What he kept of that morning was a face, and the sense of having watched someone arrive.', 7900, '02'],
  ['03.jpg', 'Some time after came POSEIDON. The towers were already standing; all they had to do was light up.', 8200, '03'],
  ['04.jpg', 'By day the machines held the islands. The survivors lived under the towers, and the victors kept watch over an empire of silence.', 10300, '04'],
  ['05.jpg', 'The people of the camps were looking for someone attached enough to one image to go back along it. They chose him for that face, and that morning.', 10800, '05', 'de'],
  ['06.jpg', 'On the tenth day, images begin to come back. A real dog. A real sea. Real sand.', 8600, '06'],
  ['07.jpg', 'Each time back, there was a boat. He did not know where it led, only that it was there for him.', 8800, '07'],
  [['08a.jpg', '08b.jpg', '08c.jpg'], '', 7500],
  ['09.jpg', 'Then they sent him further. Others were waiting on the far shore. The meeting was short.', 9500, '09'],
  ['10.jpg', '', 5000],
  ['11.jpg', 'They had no use for these scraps of another time.', 5500, '11'],
  ['12.jpg', 'They offered to keep him. He asked to be sent back: to Ithaca, to that beach, to someone who was perhaps still waiting.', 10900, '12'],
];
// Over the black at the end.
export const STILLS_LAST = ['Then he understood that what he had seen on the beach that morning was his own return.', '13'];

// The narration, in the language it was spoken in, sealed the way `unseal`
// reads a block. The text is not in this file.
export const PLAGE_SEALED =
  'RqjluFU3kwttQGUvQWG7qmKNYtmLfpu/Zum+km/OnGKIa7KIPkqWA7Dk+4vQFcPf\n' +
  'TajiriZt/4IX3J6hrVygXlEqLnqzKmfL4d+3oLcF3y6vfg1zVs12iutZ9uST74xL\n' +
  'SfUvcpy3VC86uhZzIYwrOjNnfvw/wOji/XzSRY+nyjl+NCJhu8j/7rwrCl+LyZaw\n' +
  'ZcYqkAk0AkCOKgRrYfJZgUqlodxsGRsUinJaeI5cuXHnUNipW1f0EFh6gHt9VS+C\n' +
  'c5bgGQAgYkOjt9hZYekkh3E4RgTZyQdqDbW1TM3IsBFbloTyd44LXsdcuqAWWVbM\n' +
  'Ha/DIFVSKpxxrFpLYYNZ+KBbtYX0hknOl48QxOeDk9nHIv3piHokGvIOYYVK9+D/\n' +
  'EzvxI2Bk4V+iPbININUfiaadL62HndWyx+kOq7q4CLsy5DOovAIXzL+Mx+Hab8ma\n' +
  'ookYG8Exz8Loq2VEmJZaoC7liZ92AecHJe/QqNTMsUu6c1TeAQs8T8TwJekq+bnC\n' +
  'eeaIjTgwqeP5HXW9Ppa7wWX9UP1JocDRTAvk0i5pICZS7iSoF35Pi1VSmN7wn+Xa\n' +
  '2wj9rpx6WciD3E7yKnVvdQe6kHZsloOi7f9XeEi+bMf8dMbVC9N1vKWoP7i7elL/\n' +
  'lhLfGXnxEEJyHHWV1vVkPxxJGVeBZ625PyvAjuhZaK14K+ZnWDSmUpp1npfB1vtt\n' +
  'diKGzjBhFSPn/ooCCygXCDwB5rumOVan7cSIPfPvyUrUrW1iDreE4ArEsYj7wAnH\n' +
  '0obtW//xu7Nb0/5v/r2Bu9tGupC28gCCTDJBYOGjOjXuG/uINqfrRIzf5bUwV6aC\n' +
  'r6TWknKGE5KRUlBX4gC2sAubJuG01O2eO0m/mbfrkHTTE4Vr/sOUFHQ9pvRNlV9s\n' +
  'We4nT71HNn1GRy8zMEUj3aVayVBixKYniKlnaB64uthMobK0rTt4s5MxraAoBzsE\n' +
  'jc51DfFaCfT2VxQHl7MC7Z9ezMXxF5mvzC7nhiESNRch9bXKfNqBc5NaUM6utc2P\n' +
  'XkOHdSO4sVR/H3au8N7VBy43mzcbf+evHMRfzyXJLXzBdb3IgNO+GVHhMUIiNP3c\n' +
  'w6w+uUtqGG3MaYuz+OONcPV5U4RBCDSODR1uUY9cXs2xpTrhB+6TEHWPT1eGfA9i\n' +
  'j9f0/dqwekTh/hfFBmKWU+vZRTVdfVLHaZLZOQftmjwvEhr9NQ6ymhXh5PNhfHdi\n' +
  'RgMRtLH+I0Aw/n1F1Cz5TNLrT6+HkOZXRuUsxrDgcYb1ttO5Z+gjXL1cWN3dxEbY\n' +
  'culwNnruZKXg6XueHgQQ2gYpJ1Rs3wYb2gH/ivqFXRYQBQC8aSKIPL0etu8DoRjP\n' +
  'oZNF4qEfP/MDEqDZc/DLhLeAdfmISI0SekYWVxIojWKFcmRufs/mu1rySu/yuekn\n' +
  'ktatZJ1OvKQyyVrmUnX53fJX6S/dlodWre+nCjgAS4BiWSacp3nbv92Iwa0SvqBS\n' +
  'vWRDlE3obiaqS8blQmXzEeZsUZBn9kN2cNqV+59BxKcG0tWWH0iJFjitaXFeqUmA\n' +
  'oD0+yt1VPE6SyoCbq7PvB1WOCgybiZclqeoaVV4j/Cq4iH+yz3LyRqLKJCCWmAMb\n' +
  'Crel3ODCbZ+IBmp2V/nr4oKKv503hW18IjMg4muNelQ5uGW1aAKqB29fTnHZnbRS\n' +
  'K+5SnxRNFJWEaD9AQeRTZo9GIBfsQeiEoRyeeCjfpXfz7e8=\n';

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// The reel itself: a div of slides. `embed` sets it in a player box on a page;
// `bare` is the reel alone, for a window of its own; otherwise it fills the
// browser page. The browser starts it (startReel in main.js).
export function stillsReel({ embed = false, bare = false } = {}) {
  const img = (f) => `<img src="${STILLS_DIR}/${f}" alt="" width="512" height="288">`;
  const reel = ['<div class="stills-reel" data-slides="5000">',
    '<figure class="still-title"><p>Ceci est l&rsquo;histoire de quelqu&rsquo;un<br>marqu&eacute; par une image d&rsquo;Ithaque.</p></figure>',
    '<figure class="still-title" data-ms="9000"><p>La sc&egrave;ne, dont la signification ne devait appara&icirc;tre que beaucoup plus tard, eut lieu sur une plage d&rsquo;Ithaque, quelques ann&eacute;es avant que POSEIDON ne s&rsquo;&eacute;veille.</p></figure>',
    ...STILLS.map(([f, cap, ms, voice, under]) => `<figure${ms ? ` data-ms="${ms}"` : ''}${voice ? ` data-audio="${STILLS_AUDIO}/${voice}.m4a"` : ''}${under ? ` data-under="${STILLS_AUDIO}/${under}.m4a"` : ''}>${Array.isArray(f) ? `<div class="still-live">${f.map(img).join('')}</div>` : img(f)}<figcaption>${esc(cap) || '&nbsp;'}</figcaption></figure>`),
    `<figure class="still-black" data-audio="${STILLS_AUDIO}/${STILLS_LAST[1]}.m4a"><p class="still-endcredit">Inspired by Chris Marker, <i>La Jet&eacute;e</i> (1962).</p><figcaption>${esc(STILLS_LAST[0])}</figcaption></figure>`,
    '</div>'].join('\n');
  if (bare) return reel;
  if (!embed) return ['<!--bg:stills-->', reel].join('\n');
  return `<div class="stills-embed">${reel}</div>`;
}
