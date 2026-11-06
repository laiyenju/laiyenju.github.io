// An out check-in at a place that already has a building → one more day in _data/days.yml
// (run by .github/workflows/checkin.yml, README 3.6).
// Usage: SCENE=nanshan DID="had lunch with Mei" node scripts/checkin/day.js _data/days.yml
// The new entry copies the place's facts (name, zh, place, coords, map, country) from the last entry
// with the same scene, and takes today's date (Taipei) and DID. Writes the file in place.
// Prints the place's English name, so the workflow can use it for the check-in's label.
// Exits 2 when the scene has no entry yet (a new place needs a model first: README 3.6).
'use strict';
const fs = require('fs');

const file = process.argv[2];
const scene = String(process.env.SCENE || '').trim();
if (!/^[a-z0-9]+$/.test(scene)) { console.error(`scene must be a model name like "nanshan" (got "${scene}")`); process.exit(1); }
const did = String(process.env.DID || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160) || 'spent time here';

const t = new Date(Date.now() + 8 * 3600e3); // Taipei, UTC+8
const date = t.toISOString().slice(0, 10);

const text = fs.readFileSync(file, 'utf8');
const lines = text.split('\n');
// entries: from a "- date:" line up to the next one, a comment or a blank line
const entries = [];
for (let i = 0; i < lines.length; i++) {
  if (!lines[i].startsWith('- date:')) continue;
  let j = i + 1;
  while (j < lines.length && lines[j].startsWith('  ')) j++;
  entries.push(lines.slice(i, j));
}
const sceneOf = e => (e.find(l => l.startsWith('  scene:')) || '').split(':')[1].trim();
const dateOf = e => e[0].split(':')[1].trim().replace(/"/g, '');
const same = entries.filter(e => sceneOf(e) === scene);
if (!same.length) { console.error(`no day in ${file} has scene "${scene}" yet: a new place needs a model first (README 3.6)`); process.exit(2); }
const last = same[same.length - 1];
const name = (last.find(l => l.startsWith('  name:')) || '').slice(8).trim();

if (same.some(e => dateOf(e) === date)) { console.error(`${date} already has ${scene}`); process.stdout.write(name + '\n'); process.exit(0); }

// the place's facts stay; what happened that day is new
const DAY_ONLY = /^ {2}(did|with|extra):/;
let skip = false; // a day-only key's own list lines go with it
const facts = last.slice(1).filter(l => { if (/^ {2}\S/.test(l)) skip = DAY_ONLY.test(l); return !skip; });
const entry = [`- date: "${date}"`, ...facts, `  did: ${JSON.stringify(did)}`];
fs.writeFileSync(file, text.replace(/\n*$/, '\n') + '\n' + entry.join('\n') + '\n');
console.error(entry.join('\n'));
process.stdout.write(name + '\n');
