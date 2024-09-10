import fs from "fs";
const s = fs.readFileSync("src/main.js","utf8");
const declared = new Set([...s.matchAll(/(?:function|const|let|var|class)\s+([a-zA-Z_$][\w$]*)/g)].map(m=>m[1]));
for (const m of s.matchAll(/\(([^()]*)\)\s*=>/g))
  m[1].split(",").forEach(a=>{const n=a.trim().replace(/[=:].*/,"").trim(); if(/^[a-zA-Z_$][\w$]*$/.test(n)) declared.add(n);});
for (const m of s.matchAll(/function\s+[a-zA-Z_$\w]*\s*\(([^()]*)\)/g))
  m[1].split(",").forEach(a=>{const n=a.trim().replace(/[=:].*/,"").trim(); if(/^[a-zA-Z_$][\w$]*$/.test(n)) declared.add(n);});
const imported = new Set([...s.matchAll(/import\s*\{([^}]+)\}/g)].flatMap(m=>m[1].split(",").map(x=>x.trim().split(" as ").pop())));
const code = s.replace(/\/\*[\s\S]*?\*\//g,"").replace(/\/\/[^\n]*/g,"")
  .replace(/`(?:\\.|\$\{[^}]*\}|[^`\\])*`/g,"``").replace(/"(?:\\.|[^"\\])*"/g,'""').replace(/'(?:\\.|[^'\\])*'/g,"''");
const region = code.slice(code.indexOf("function netWorldDescriptor"), code.indexOf("function closeObTerminal"));
const G = new Set("Math String Number Object Array JSON parseInt parseFloat isNaN setTimeout clearTimeout requestAnimationFrame Set Map Date console document window localStorage performance encodeURIComponent RegExp Boolean Error true false null undefined this new typeof return if for while switch catch function const let var of in else break continue await async try throw delete void instanceof case default do class extends super yield import export from as".split(" "));
const used = new Set([...region.matchAll(/(?:^|[^.\w$])([a-zA-Z_$][\w$]*)/g)].map(m=>m[1]));
const missing = [...used].filter(n=>!declared.has(n)&&!imported.has(n)&&!G.has(n));
console.log(missing.length ? "UNDEFINED: "+missing.join(", ") : "clean: every free identifier in the laptop/net region resolves");
