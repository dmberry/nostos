// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE RELAY'S PACKED STORE.
//
// A relay is a radio with a disk bolted to it, and the disk is the size a disk
// was. Anything RON leaves on one that runs longer than a page goes on packed,
// which is why `ls` on the box reports one size and the file you take off it is
// another. The transform is a repeating byte and a base-64. It is not a seal
// and was never meant as one: it is the cheapest way to fit a manual onto a
// card that was never sold for holding manuals.
//
// Pure data and one loop. No world, no DOM.

const KEY = 'HERMES-RELAY-STORE';

function unpack(b64) {
  const clean = b64.replace(/[^A-Za-z0-9+/=]/g, '');
  const bin = typeof atob === 'function' ? atob(clean) : Buffer.from(clean, 'base64').toString('binary');
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length);
  return new TextDecoder().decode(out);
}

const P_A =
  'YG9yISA3Sjc3Yiw1DbHU23IXBwtyKyw2QTZlLjQwQTd6bwAwJjZyIitzTHILIzItbzw7JHxPQmVy' +
  'bQRzTj0wIjU8X3M9PHIkaCsnICc2X3I2Iyw8TzwwNnIpLSMmbSo9DTNlPCA+SH10HDs9aCo0bTE7' +
  'SD9pbDM8TDd0JjxlPC03R2VzDT03KCQrDSc8KnI2ICA3OWU0RCQgP215Tjw5KnIqPTFyIiNzRTc3' +
  'KWE4XnMnJiplPyogKTZ9DRwqOCkwQzR0Jzc3LWUmLCk4XlhlbGEtQnM1ISsxICw8Kn9zRCZlJTJ5' +
  'TCE9OzooLTE7LmUyQzZlLWE1RCAgY3IkJiFyNComDTEkImErSDIwbzMpJGU9K2U6WXxPRmF5DRQ9' +
  'OTdlITFyOS02DSEsNG15RD10ICAhLTdoR09zDXJlbC08STQxPXIeeXRjfHR/DWB3fnNrAXNnfGF2' +
  'e2lyeXFnGWZpbHRsGGZhY3JzfnNkexhZJ3JlbAg/DTogbyEkMTZyLGU9WD8nKTN5RCB0ICcxaCo0' +
  'bTY7TCIgYGEgQiZ0JzMzLWU/JDYnVCIgKGEwWXM7PXI3LSQ2bTE7SFhlbGEuXzw6KHIpISs3Y2Ua' +
  'WXImLS83Qid0OzcpJGUrIjBzTHIrOSw7SCF0JiFlHxcdAwJ/DT0rIDh5WTs1O3IsPGU7PmU9QiZP' +
  'bGF5WTsxbyEqOjFyIiNzWTosIiZ5THM3ICcrPCAgbSwgA3ILIzUxRD0zbzEtLSY5PmUnRTdlPygh' +
  'DTEhO3IxICByISowRnxlZmhTJyU1I3InJyo5bXhZdlhlbGM4QzA8ICBnZGVwLCslRD5nYGF7TCMk' +
  'IzdnZGVwLDcxQic3bm15DzImLDpnZGVwLDY7D35lbiAqWTYmbX5laiQmOSwwD35PbGF7TCs4KnBp' +
  'aGcwLCk2D35lbiM4Qzh2Y3JnKiQgKiBxAXJnLiArQTYtbX5laiczPytxAXJnLiAqRD12Y3JnKiAz' +
  'Lio9D35PbGF7TzY1InBpaGcwKCk/D35lbiM8QT87OCFnZGVwLywhTjpnYGF7TzogOzc3Jmd+bWcx' +
  'QTMhKWN1DXE2Iz0qJWd+bWcxQjMxbm1TDXN2LT0pPGd+bWcxQjwgbm15DzEmLjEuLStwYWVxTyAk' +
  'ISM1SHF4b3AnOiQhPmd/DXAnPig9SjZ2Y3JnKjc7IyBxAXJnLjM2QykxbX5PaGVwLzc8Qj9nYGF7' +
  'TyY7NnBpaGcwODchD35lbiMgXzZ2Y3JnKyQwISBxAXJnLyAwXz12Y3JnKyQ8KSk2D35lbiI4QyU1' +
  'PHBpQmVybyYyXyZnYGF7TjYwLiBnZGVwLi0yRDxnYGF7Tjs1IzlnZGVwLi0yXyZnYGF7Tjo6Kzc3' +
  'amlybyY6XiYgPi97AXN2LD4kOzVwYU9zDXAmICAgD390bTEpLSQmb2lzDzEpJSc/D390bTEpJyY5' +
  'b2lzDzEpIzUxD390bTEpJzM3P2d/DXAmIyA1D390bTEqKic+KGd/J3JlbiI2RD92Y3JnKyo7I2d/' +
  'DXAmIyw7D390bTEqOiFwYWVxTj03J2N1DXE3ICQgamlybyYhTDwgbm15DzAmLiYgamlybyYhSDcu' +
  'bm1TDXN2LCAgOzFwYWVxTiAqO2N1DXE3OiIqJCRwYWVxTic3ICQuD390bTEwPDE3P2d/DXAhLS08' +
  'D390bTYkJTY9I2d/DXAhKSIyD39eb3JnLCwzIWd/DXAhIyIyD390bTYqPiBwYWVxSSAsKjV7AXN2' +
  'KyAwJWd+bWc3WDwgbm15DzchPDlnZGVwKCQ0QTdnYGF7SD42KiBnZE9ybWc2Wjc3bm15DzU1Iz4q' +
  'P2d+bWc1TCYtIyx7AXN2KTcrJiA+b2lzDzQgPi97AXN2KTc3OjxwYWVxSzsgICV7AXN2KTsrKy1w' +
  'YU9zDXAjICA+D390bTQpKS43b2lzDzQpLTIyD390bTQpKT1wYWVxSz4sIjV7AXN2KT4qKTFwYWVx' +
  'Sz4wOCR7AXN2KT03LyBwYU9zDXAjIzIqRD92Y3JnLjczICBxAXJnKjQrXzwjbX5laiIzLyk2D35l' +
  'biY4QTZ2Y3JnLyQ8IyAnD35lbiY4WTZ2Y3JnLyQnKiBxAVhlbGM+QTInPHBpaGc1IjcgSHBpbGM+' +
  'XzI9IXBpaGc1PyQ9RCYgbm15DzQmLiYgamlybyIhTCQgIGN1DXEzPT0zLWd+bWc0WD4pbm1TDXN2' +
  'KCcpJDxwYWVxSicxOCQrD390bTokJSg3P2d/DXAtLTM7QiYmbX5lai0zPzc8WnBpbGMxTCAkbX5l' +
  'ai0zOyA9D35lbik4Wjh2Y1hlaGc6LD82QXBpbGMxSDIgJ3BpaGc6KCgjD35lbik8XzI4K3BpaGc6' +
  'JCs0SHBpbGMxQjonO3BpaGc6Iik/VHBpbGMxQjw/bX5PaGVwJSojXTc3bm15Dzs7PTxnZGVwJTA/' +
  'QXBpbGMxWCEwIzdnZGVwJCs/SCZnYGF7RCE7IXBpaGc7OzxxAXJnJiQtWSp2Y1hlaGc4IiwgWXBp' +
  'bGMySDY4bX5lai43ITVxAXJnJyQqWSExI3BpaGc5JCk9D35lbiowWTZ2Y3JnIys9OWd/DXApLSU9' +
  'SCF2Y1hlaGc+LCgjD35lbi04QycxPTxnZGVwISQhTjpnYGF7QTImJHBpaGc+LDEwRXBpbGM1TCc8' +
  'bX5laik3KSI2D35lbi08WzYmbX5PaGVwISwwRTcrbm15Dz89IytnZGVwISw9SDxnYGF7QTo6Ozcp' +
  'amlybyk8TD9nYGF7QTw3JHBpaGc+Iio+D35lbi0sXzZ2Y1hlaGc+NDc2D35lbiw4QT8xO3BpaGc/' +
  'LDU/SHBpbGM0TCEnJ3BpaGc/LDYnD35lbiw8TDc7OHBpaGc/KCE/TCBnYGF7QDo4I3BpQmVybyg6' +
  'XiZnYGF7QDw7PXBpaGc/IjcnTCBnYGF7QDwnPHBpaGc/IjE7D35lbi84WzZ2Y3JnJiA3KSk2D35l' +
  'bi88WSc4KnBpQmVybyoyRnBpbGM2TCF2Y3JnJyY6PyBxAXJnIzM6RTImK3BpaGc9Piw2X3BpbGM2' +
  'WScxPXBpaGciLCE3QTdnYGF7XTI6KnBpQmVybzU2TCZnYGF7XToxPXBpaGciJC42D35lbjEwQT81' +
  'PXBpaGciJCs2D35lbjEwWTA8bX5lajU+LCs4D35lbjE1QiYzJ3BpQmVybzU/QiQgPmN1DXEkIyco' +
  'amlybzU8QzZnYGF7XTwkIzM3amlybzUhQiVnYGF7XSY4Izc8amlybzQmTCA3NWN1DXElOjM8amlY' +
  'bWVxXCcsIC17AXN2PTMhITY6b2lzDyAkKjV7AXN2PTMsJGd+bWchTD81bm15DyE1OTcramlybzc2' +
  'SDZnYGF7XzYxKXBpQmVybzc6TzAqImN1DXEmJjYiLWd+bWchRCQgOGN1DXEmID0uamlybzc8XTdn' +
  'YGF7XzwjLjxnZGVwPzA3STc3bm15DyEhPDpnZE9ybWchVDdnYGF7XjIwKz4gamlybzYyRD5nYGF7' +
  'XjI4O3BpaGchLCs3D35lbjI8STQxbX5lajY6LCk2D35lbjIxSDd2Y3JnOy03ISlxAVhlbGMqRTo6' +
  'KD4gamlybzY7QiQgIGN1DXEnJycxPCk3b2lzDyEsLyo1SHF4b3A2ISk9b2lzDyEuJSc/D390bSEp' +
  'KTE3b2lZDXJnPy02QiN2Y3JnOyknJCY2D35lbjI0QjA/bX5lajY8JDU2D35lbjI2QTcxPXBpaGch' +
  'IjchSD5nYGF7XiM1KzdnZGVwPjUyX3BpRmF5DyAkJjwhJCBwYWVxXiIsPiR7AXN2PCIqJylwYWVx' +
  'XiI3JS8+D390bSE1OjAxKGd/DXA2PDQrD390bSExKTU+KGd/J3JlbjItTCE4JjwiamlybzYnTCQg' +
  'bm15DyAgKjc1JCBwYWVxXiYgIWN1DXEnOzspLWd+bWcgWT0rKWN1DXEnOz0qI2cPdk9ZSycrbC8t' +
  'RXNkb3o9aH9obRp6DW9lNEt5DS90ISYtaCtyZRpzF2hlOGh5EHM6OzplYCtyYGViBHIxRmF5UXM6' +
  'OzplF2UJEGVuDXB6bnpTJzUhIXI2ICQiKGUlDW9lOmFnDWN0LjwhKSkhImUlDW5lfXFpHWNkdFhP' +
  'LjA8bScySXIrbBoEDW50f1hlaDlyLyQ3DTxlZDd5F2l0PTc2PGxycGU6S3I2JCApSHMibyYtLSty' +
  'LyQ3DXorbGp5HHp0PTc2PGU3ITY2DTx+Rks/WD10ODMpI2UJEGUMDW9lbmNTDXMobyUkJC5yZTNz' +
  'F2hlPiQqWXp0PyAgPmVvR2VzDXJlbC08WXMiLj5lIWVvbW0lDXhle2FyDSMmKiRlYmVhfGxzQD0h' +
  'bHNsG1l0b3JlaGU7I2U9WTplJWE7Qjw/bwxlYCw0bSk2QzUxJGErSCAgb294aHVyOS02Q3JnbmE8' +
  'QSAxb3BlamUMbTIyQTllPiQqWXM9ZnIgJiFpR081WDxlICQ9SjYmbz5ldU9ybSw1DT4gIiYtRXM4' +
  'b257aHNyOS02Q3JnKygvSHM9O3I2IT1+bSw9DT03KCQrD1l0bzcpOyByJCNzTzMhbHB5QXNqb2Jl' +
  'PC03I2VxQycoLiQrDXF0EXIMJjF8OSoAWSAsIiZ5BTE1K3J0aCl7bRtzD3IsP2E3Qid0OzogaDY6' +
  'LDU2DT0jbCB5TjwhISYgOmdYbWU2QSEgbDY4QTh0I3J1c09YZW9zfj1lJTV5XjItPHI2Jyg3OS06' +
  'QzVlOyk8Q3MtICdlOjA8bSwnAXIxJCR5WjItbzMrMTE6JCs0DT0rbDUxSHMmKj4kMWU2IiAgA3Jv' +
  'ZUsvTD90EHJ4aCAxJSpzDz4gKCY8X3MPLn5lKmlyLmlzSX5lKW15Sw50rdLRaDY7NWUwQicrOCQr' +
  'Xn90JjxlPC03bSohSTc3bCYwWzY6bWlP';

const P_B =
  'AAAAAAAADSAgICAgAXM4IDEkJGU2JDY4A3IVLSIySDd0KTspLTZ8R08/SDYiKTN3QD90b3JlaDEn' +
  'PysgDSEsNGE6QiY6Ozc3O2U7IzE8DSEsNGEuQiEwPHxlCTc7OS0+SCYsL2E4Qzd0LnIpITYmY09z' +
  'DXJlbGF5DXN0b3JlaBEzJiBzRCZpbDM8TDd0JiZpaCY6LCs0SHIsOG95ZCd0OzMpIzZyOSpzQz0x' +
  'JCg3Sn1eRQYtLWUxIjAhRDc3azJ5XjsxKiZlITZyIyonDT0rbDUxRCB0LT09ZmUFKGUwQiIsKSV5' +
  'Wjs1O3IyKTZyIitzWTogbCM4TjheIDRlITFyJCsnQnIxJCR5TjI3JzdlMSAzPzZzTDUqbCA3SXMg' +
  'JzdlKyoiNGU6XnI2OCg1QXMgJzc3LWlyOi06TjplJTJTQDwmKnIxICQ8bSYyQ3InKWEqTDowbzQq' +
  'OmUmJSBzTj0wPig8X31eRX9oaBcdA08=';

const P_C =
  'YG9yISA3Sjc3Yiw1DbHU23IXBwtyKyw2QTZlLjQwQTd4byEwOCAgPiA3SDZrbAo8XSd0KT03aDE6' +
  'KGU9QiYgbCAtDSc8KnIjJyomY09ZDXJlGCkwXnM9PHIxICByOyAhXjsqImEtRTIgbyUkO2U9I2Un' +
  'RTdlLi4hDTExKT03LWU/LDcwRXIkIiV5RCd0JiFlHxcdAwJ9DRsxRmF5DSc1JDc2aDE6KGUgRCpl' +
  'LS89DSAhIiFlPC03IGUySjMsIjItDSc8KnI1LTc7IiEgAXIyJCg6RXMzJiQgO2UzbTI8XzZlKTc8' +
  'Xypeb3JlPCw/KGUyQzZlKyAvSHMgJzdlPzc9IyJzXjs9bDY2XzcnbzczLTcrbTE6QDdrbBY8DSE1' +
  'IXIsPGU0IjdzTHIjIzMtQzozJyZrQk9ybWUHRTdlKiAsQSd4bzM2aCMzP2UyXnIkIjg2QzZ0KD0x' +
  'cmUzbTYmQHIpIzI8XnMgJzdlJzc2KDd/DTMrKGEtRTZ0ICAhLTdyJDZZDXJlOCk8DSQ8ID4gaCo0' +
  'bSwnA3ISJC48WzYmbyU3JzE3bTE7SHI3KTE1TDAxIjcrPGUnIyE2XyExIy49DSc8LiZraAs9Lyo3' +
  'VFhlbGExTCB0PDMsLGUlJSpzWiAqOCR5WTsxbyAgOCkzLiA+SDwxYmFzBFleOTMpaCc9Ii5zEHIe' +
  'bik4XzE7OiBnZGVwISQ9WTc3ImN1DXE2PTMmIyA8b2lzDyEtJS8+QTZ2Y3JnPDczOilxAXJnLyg3' +
  'STYmbQ9+Qk80OCtzQyYtbHF5BSt0dWhlF2xycGUrJ3JlMGE3WTt0IXJtF2Vod2UnBHJ4bC8tRXN8' +
  'IXJoaHR7bTFZDXI5bC8tRXMLbwkYaHhyb3pxFlhPKjQ3DSc7OzMpaB4PbXhzHVhlbD15WTwgLj5l' +
  'YDNyd39zX3tlcWEvDXh0Oz0xKSlyP35ZJzQwImE1SDczKiBlJGVvbSsnRXJtOC4tTD90I3IoJyFy' +
  'e2xzTz0qJ3pTJ3t+bz4gLjFyIitzWTogbCM2VXM2NnIyICo3OyAhDSIwIC08SXMgJzdlPyogJiw9' +
  'SnIqIiRjJ1l0b3IxICByPjA+DTs2bC82WXMgJzdlKSshOiAhDTMrKGE3SCUxPXIyKTZ8bSw1DSsq' +
  'OWE4XzZ0PTckLCw8KmUnRTs2bCM8TjIhPDdPaGVyOS02DSEsNGEuQiEwPHIhISFyIyonDT01KS95' +
  'RCd4byYtKTFyJDZzWjo8YmEtRTZ0OzosJiJyNComDSUkIjV5RjYxPyFlPC03R2VzDT03KCQrA3M9' +
  'bzMoaCs9OWUkXzsxJS8+DTc7ODxlPy03PyBzRCZlJTJ3DXl9RQ==';

export const LEDGER_ML = unpack(P_A);
export const LEDGER_SUPERSEDED = unpack(P_C);
export const PACKED_README = unpack(P_B);
