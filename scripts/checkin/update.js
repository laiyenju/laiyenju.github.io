// One check-in → the new location.json (run by .github/workflows/checkin.yml, README 3.5).
// Usage: PLACE=office LABEL="" node scripts/checkin/update.js last.json > location.json
// The file holds words only, never coordinates:
//   place     home | office | out
//   label     what the homepage says: "Yen is {label}, Taipei."
//   at        when (UTC)
//   office_at the last office check-in, kept across check-ins: the homepage shows the office
//             building on any day that has one (holidays and make-up workdays need no calendar)
'use strict';
const fs = require('fs');

const LABELS = { home: 'at home', office: 'at the office', out: 'out somewhere in the city' };
const place = String(process.env.PLACE || '').trim();
if (!LABELS[place]) { console.error(`place must be one of: ${Object.keys(LABELS).join(', ')} (got "${place}")`); process.exit(1); }

let last = {};
try { last = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')) || {}; } catch (e) {}

const label = String(process.env.LABEL || '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || LABELS[place];
const at = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const out = { place, label, at, office_at: place === 'office' ? at : (last.office_at || null) };
process.stdout.write(JSON.stringify(out, null, 2) + '\n');
