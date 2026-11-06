// An out check-in that asks to be today's building → find the place in _data/days.yml by where Yen is
// (run by .github/workflows/checkin.yml, README 3.6).
// Usage: LATLON="25.0346,121.5667" DID="had lunch with Mei" node scripts/checkin/day.js _data/days.yml
// A place whose coords are within NEAR metres has a model already: a new entry copies its facts (scene,
// name, zh, place, coords, map, country) from the last entry there, with today's date (Taipei) and DID,
// written in place. Prints the place's English name, so the workflow can use it for the check-in's label.
// Exits 2 when no place is near: a new place needs a model first (the workflow opens an issue).
'use strict';
const fs = require('fs');

const NEAR = 150; // metres: a building's own grounds, not the one across the street (Taipei 101 is ~230 m from Nan Shan)
const file = process.argv[2];
const m = String(process.env.LATLON || '').match(/(-?\d+(?:\.\d+)?)\s*[,，\s]\s*(-?\d+(?:\.\d+)?)/);
if (!m) { console.error(`LATLON must be "latitude,longitude" (got "${process.env.LATLON || ''}")`); process.exit(1); }
const here = [+m[1], +m[2]];
const did = String(process.env.DID || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160) || 'spent time here';

const t = new Date(Date.now() + 8 * 3600e3); // Taipei, UTC+8
const date = t.toISOString().slice(0, 10);

const text = fs.readFileSync(file, 'utf8');
const lines = text.split('\n');
// entries: from a "- date:" line through its indented lines
const entries = [];
for (let i = 0; i < lines.length; i++) {
  if (!lines[i].startsWith('- date:')) continue;
  let j = i + 1;
  while (j < lines.length && lines[j].startsWith('  ')) j++;
  entries.push(lines.slice(i, j));
}
const field = (e, k) => { const l = e.find(l => l.startsWith(`  ${k}:`)); return l ? l.slice(k.length + 3).trim() : ''; };
const coordsOf = e => { const c = field(e, 'coords').match(/\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]/); return c ? [+c[1], +c[2]] : null; };
const metres = (a, b) => {
  const R = 6371e3, r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
let best = null, bestD = Infinity;
for (const e of entries) { const c = coordsOf(e); if (!c) continue; const d = metres(here, c); if (d <= bestD) { best = e; bestD = d; } }
if (!best || bestD > NEAR) { console.error(`no place within ${NEAR} m (nearest ${best ? field(best, 'name') + ', ' + Math.round(bestD) + ' m' : 'none'}): a new place`); process.exit(2); }
const scene = field(best, 'scene'), name = field(best, 'name');
console.error(`${name} (${scene}), ${Math.round(bestD)} m away`);

const dateOf = e => e[0].slice(7).trim().replace(/"/g, '');
if (entries.some(e => field(e, 'scene') === scene && dateOf(e) === date)) { console.error(`${date} already has ${scene}`); process.stdout.write(name + '\n'); process.exit(0); }

// the place's facts stay; what happened that day is new
const DAY_ONLY = /^ {2}(did|with|extra):/;
let skip = false; // a day-only key's own list lines go with it
const facts = best.slice(1).filter(l => { if (/^ {2}\S/.test(l)) skip = DAY_ONLY.test(l); return !skip; });
const entry = [`- date: "${date}"`, ...facts, `  did: ${JSON.stringify(did)}`];
fs.writeFileSync(file, text.replace(/\n*$/, '\n') + '\n' + entry.join('\n') + '\n');
console.error(entry.join('\n'));
process.stdout.write(name + '\n');
