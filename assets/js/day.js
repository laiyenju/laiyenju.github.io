/* Homepage: one pixel building a day, the timeline, and the terminal (see README 1 and 2.4).
   Needs assets/js/pixel-engine.js, loaded first. */
'use strict';
/* ================= data =================
   Written into the page by _layouts/home.html from published/ (notes), _data/works.yml,
   _data/days.yml (places) and _data/little.yml (small things, shown for a week). */
const SITE = JSON.parse(document.getElementById('site-data').textContent);
const CITY = { name: 'Taipei', short: 'taipei', lat: 25.033, lon: 121.565, tz: 8 };
const NOTES = SITE.notes || [];
const WORKS = (SITE.works || []).map(w => ({ slug: w.slug, year: String(w.year || ''), title: w.title, sub: w.sub || '', role: w.role || '',
  problem: w.problem || '', did: w.did || '', result: w.result || '', url: w.url || '', urlLabel: w.url_label || '' }));
const HOLIDAYS = { '01-01': "New Year's Day", '02-28': 'Peace Memorial Day', '04-04': "Children's Day", '05-01': 'Labor Day', '10-10': 'National Day' };
const BIO = 'Product manager in Taipei. Writes about how products get decided.';

const pad = n => String(n).padStart(2, '0');
const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const NUM = ['', 'A', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
const ago = y => y === 1 ? 'A year ago' : `${NUM[y] || y} years ago`;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function taipeiParts(ms) {
  const d = new Date(ms + CITY.tz * 3600e3);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), wd: d.getUTCDay(), h: d.getUTCHours(), min: d.getUTCMinutes() };
}
function dayMs(y, m, d) { return Date.UTC(y, m - 1, d); }
function fromDayMs(ms) { const d = new Date(ms); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), wd: d.getUTCDay() }; }
const REAL = taipeiParts(Date.now());
const REAL_DAY = dayMs(REAL.y, REAL.m, REAL.d);
const REAL_MD = pad(REAL.m) + '-' + pad(REAL.d);
/* Places (_data/days.yml). The sentence under each building is written by one rule (sentenceFor):
     "{N years ago}, {prep} {place}, Yen {did}[ with {with}].[ {extra}]"
   Required: date, scene, name, zh (Chinese name; no_zh: true leaves it out), place, did.
   Optional: prep (default "in"), with, extra, map, country (default "Japan"). */
const MEMORIES = (SITE.days || []).map(d => ({ date: String(d.date), scene: d.scene, name: d.name, zh: d.zh, noZh: !!d.no_zh,
  place: d.place, prep: d.prep, did: d.did, with: d.with, extra: d.extra, map: d.map, country: d.country }));
// a day can have more than one building: the first keeps the date as its id, the next ones get date-2, date-3 …
{ const seen = {}; for (const m of MEMORIES) { seen[m.date] = (seen[m.date] || 0) + 1; m.id = seen[m.date] > 1 ? `${m.date}-${seen[m.date]}` : m.date; } }
const byDate = (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
function escHtml(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
const listOf = v => { const a = [].concat(v || []); return a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; };
function checkMemory(m) {
  const missing = ['date', 'scene', 'name', 'place', 'did'].filter(k => !m[k]);
  if (!m.zh && !m.noZh) missing.push('zh');
  if (!SCENES[m.scene]) missing.push('scene (no model yet: ' + m.scene + ')');
  if (missing.length) console.warn(`Memory "${m.name || m.date}" is missing: ${missing.join(', ')}`);
  return !missing.length;
}
// returns HTML: the place becomes a Google Maps link
function sentenceFor(m, years) {
  const esc = escHtml;
  const map = `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.map || m.name + ', ' + m.place)}" target="_blank" rel="noopener">${esc(m.place)} ↗</a>`;
  const withWho = m.with ? ` with ${esc(listOf(m.with))}` : '';
  return `${ago(years)}, ${m.prep || 'in'} ${map}, Yen ${esc(m.did)}${withWho}.` + (m.extra ? ' ' + esc(m.extra) : '');
}
// small things (a Shiba on a walk…): each shows for seven days from its date
const LITTLE = (SITE.little || []).map(l => { const [y, m, d] = String(l.date).split('-').map(Number); return { day: dayMs(y, m, d), kind: l.kind, text: l.text }; });

/* ================= sun & light ================= */
function sunAt(ms) {
  const d = new Date(ms), n = (ms - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5;
  const rad = Math.PI / 180, decl = 23.44 * Math.sin(2 * Math.PI * (284 + n) / 365) * rad;
  const B = 2 * Math.PI * (n - 81) / 364, eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const solar = d.getUTCHours() + d.getUTCMinutes() / 60 + CITY.lon / 15 + eot / 60;
  const H = (solar - 12) * 15 * rad, lat = CITY.lat * rad;
  const alt = Math.asin(Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(H));
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat) - Math.tan(decl) * Math.cos(lat)) + Math.PI;
  return { alt: alt / rad, az };
}
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
const BG_STOPS = [[-18, [21, 25, 38]], [-9, [40, 46, 74]], [-4, [128, 120, 154]], [0, [222, 200, 190]], [5, [244, 230, 212]], [14, [247, 243, 234]], [28, [248, 248, 245]]];
function bgFor(alt) {
  if (alt <= BG_STOPS[0][0]) return BG_STOPS[0][1];
  for (let k = 1; k < BG_STOPS.length; k++) {
    const [a1, c1] = BG_STOPS[k], [a0, c0] = BG_STOPS[k - 1];
    if (alt <= a1) { const t = (alt - a0) / (a1 - a0); return c0.map((v, j) => mix(v, c1[j], t)); }
  }
  return BG_STOPS[BG_STOPS.length - 1][1];
}
const hex = c => '#' + c.map(v => pad(Math.round(v).toString(16))).join('');
function lightFor(ms) {
  const s = sunAt(ms), alt = s.alt;
  const n = cl((4 - alt) / 14, 0, 1);
  const warm = alt > -3 && alt < 12 ? cl(1 - Math.abs(alt - 3) / 9, 0, 1) : 0;
  let sx = .5, sy = -.1;
  if (alt > 4) {
    const len = cl(.6 / Math.tan(alt * Math.PI / 180), .35, 1.1);
    sx = -Math.sin(s.az) * len; sy = Math.cos(s.az) * len;
  }
  return {
    alt, n, warm,
    kr: mix(1, .56, n) * (1 + .07 * warm), kg: mix(1, .6, n) * (1 + .01 * warm), kb: mix(1, .84, n) * (1 - .09 * warm),
    lit: cl((3 - alt) / 8, 0, 1),
    sx: Math.round(sx * 20) / 20, sy: Math.round(sy * 20) / 20,
    bg: bgFor(alt),
  };
}
function applyTheme(L) {
  const bg = L.bg, lum = (.2126 * bg[0] + .7152 * bg[1] + .0722 * bg[2]) / 255;
  const dark = lum < .45, root = document.documentElement.style;
  root.setProperty('--bg', hex(bg));
  root.setProperty('--ink', dark ? '#ece7dd' : '#262421');
  root.setProperty('--ink-soft', dark ? '#aaa3b8' : '#6f6a62');
  root.setProperty('--rule', dark ? 'rgba(236,231,221,.18)' : 'rgba(38,36,33,.14)');
  root.setProperty('--accent', dark ? '#f0a46a' : '#b5531e');
  const sheet = dark ? bg.map(v => v + 14) : bg.map(v => mix(v, 255, .7));
  root.setProperty('--sheet', hex(sheet.map(v => cl(v, 0, 255))));
  root.colorScheme = dark ? 'dark' : 'light';
}

/* ================= scenes ================= */
const C = {
  WHITE: [238, 236, 230], GLASS: [58, 72, 82], CURTAIN: [96, 116, 132], FIN: [214, 216, 214], CONC: [186, 184, 178], WOOD: [126, 90, 60], WOOD_L: [172, 130, 88],
  SHOJI: [238, 232, 214], TILE: [84, 86, 96], STONE: [170, 168, 160], LANTERN: [150, 146, 138], GRAVEL: [214, 208, 194], PAVE: [198, 196, 190],
  SAND: [226, 210, 172], WATER: [94, 148, 170], VERMIL: [204, 66, 40], INK: [44, 40, 40], BARKROOF: [120, 84, 64],
  POT: [176, 98, 64], GREEN: [86, 124, 70], DECK: [150, 112, 80],
  SHIBA: [212, 136, 70], CREAM: [244, 234, 214], DEER: [164, 116, 74], NOSE: [40, 30, 28],
};
const toneCache = new Map();
function closeTones(e, base) {
  let t = toneCache.get(base);
  if (!t) { t = [.9, .95, 1, 1.04].map(k => e.rgb(base[0] * k, base[1] * k, base[2] * k)); toneCache.set(base, t); }
  return t;
}
function surface(e, base, x, y, ix, iy, amp = .8) {
  const v = .5 + (e.noise(x * .8, y * .8) - .5) * amp;
  return closeTones(e, base)[e.clamp(Math.floor(v * 4 + (e.bayerAt(ix, iy) - .5) * .6), 0, 3)];
}
function edgeOf(e, x, y, a, b, ix, iy) {
  const edge = Math.pow(Math.pow(Math.abs(x) / a, 4) + Math.pow(Math.abs(y) / b, 4), .25);
  const r = edge + (e.noise(x * 1.6, y * 1.6) - .5) * .12;
  if (r > 1.04) return null;
  if (r > .93 && e.hash(ix, iy) < (r - .93) / .11) return null;
  return r;
}
function grassAt(e, x, y, ix, iy, i) {
  e.kinds[i] = e.KIND_GRASS;
  const t = e.noise(x * .9, y * .9) * 1.15 + (e.hash(ix, iy) - .5) * .55 - .08;
  return e.rgb(...e.GRASS[e.clamp(Math.floor(t * 4.2), 0, 3)]);
}
function waterAt(e, x, y, ix, iy) {
  const tones = closeTones(e, C.WATER);
  if (e.hash(ix, iy) > .988) return e.rgb(214, 232, 236);
  const v = .5 + Math.sin((x + y) * 2.2 + e.noise(x * .7, y * .7) * 4) * .22;
  return tones[e.clamp(Math.floor(v * 4 + (e.bayerAt(ix, iy) - .5) * .7), 0, 3)];
}
function boxShadow(e, x0, y0, x1, y1, z) {
  const n = Math.max(2, Math.ceil(z / .8));
  for (let k = 0; k <= n; k++) { const zz = .2 + (z - .2) * k / n; for (let x = x0; x <= x1; x += .4) for (let y = y0; y <= y1; y += .4) e.castShadow(x, y, zz, .32); }
}
/* Lettering on a wall, in a 3×5 pixel font, drawn in screen pixels so it stays sharp and readable.
   It follows the wall's slope the way pixel-art signs do: at scale 2 every font column steps one pixel,
   at scale 1 every letter steps as a whole. face 'y' = a wall facing +y (letters run toward +x),
   face 'x' = a wall facing +x (letters run toward −y). x, y, z = the centre of the text's top edge on that wall. */
const FONT3 = {
  A: '010101111101101', B: '110101110101110', C: '111100100100111', E: '111100110100111', G: '111100101101111', H: '101101111101101',
  I: '111010010010111', K: '101110100110101', L: '100100100100111', M: '1000111011101011000110001', N: '10011101101110011001', O: '111101101101111',
  R: '110101110101101', S: '111100111001111', T: '111010010010010', W: '1000110001101011010101010', Y: '101101010010010', D: '110101101101110',
  o: '000111101101111', g: '111101111001111', l: '010010010010010', e: '111101111100111', ' ': '000000000000000',
};
function signIso(e, text, { face = 'y', x, y, z, scale = 2, colors }) {
  const glyph = ch => FONT3[ch] || FONT3[ch.toUpperCase()] || FONT3[' '];
  const adv = ch => ch === ' ' ? 2 : glyph(ch).length / 5 + 1;
  const chars = [...text], cols = chars.reduce((w, ch) => w + adv(ch), -1);
  const p = e.project(x, y, z), dir = face === 'y' ? 1 : -1;
  const ox = Math.round(p.sx - cols * scale / 2), oy = Math.round(p.sy - dir * cols * scale / 4);
  let col = 0;
  chars.forEach((ch, k) => {
    const g = glyph(ch), gw = g.length / 5, color = e.rgb(...colors[k % colors.length]);
    for (let r = 0; r < 5; r++) for (let c = 0; c < gw; c++) {
      if (g[r * gw + c] !== '1') continue;
      const cc = col + c, step = scale >= 2 ? cc * scale / 2 : Math.floor(col / 2);
      const sx = ox + cc * scale, sy = oy + dir * step + r * scale;
      for (let a = 0; a < scale; a++) for (let b = 0; b < scale; b++) {
        const ix = sx + a, iy = sy + b;
        if (ix < 0 || iy < 0 || ix >= e.W || iy >= e.H) continue;
        e.pix[iy * e.W + ix] = color;
      }
    }
    col += adv(ch);
  });
}
function flag(e, x, y, h, cloth) {
  e.box(x - .03, y - .03, 0, x + .03, y + .03, h, [120, 122, 126]);
  e.box(x + .03, y - .02, h - .45, x + .55, y + .02, h - .05, cloth);
}
function usFlag(e, x, y, h) {
  e.box(x - .03, y - .03, 0, x + .03, y + .03, h, [120, 122, 126]);
  for (let k = 0; k < 5; k++) e.box(x + .03, y - .02, h - .45 + k * .08, x + .6, y + .02, h - .37 + k * .08, k % 2 ? [240, 240, 236] : [186, 46, 44]);
  e.box(x + .03, y - .025, h - .25, x + .28, y + .025, h - .05, [44, 56, 110]);
}

function lantern(e, api, x, y, s = 1) {
  const B = (a, b, c, d, z0, z1, col) => e.box(x + a * s, y + b * s, z0 * s, x + c * s, y + d * s, z1 * s, col);
  B(-.4, -.4, .4, .4, 0, .3, C.STONE);
  B(-.15, -.15, .15, .15, .3, 1.1, C.STONE);
  api.emissive(() => B(-.35, -.35, .35, .35, 1.1, 1.55, C.LANTERN));
  B(-.55, -.55, .55, .55, 1.55, 1.75, C.STONE);
  B(-.15, -.15, .15, .15, 1.75, 1.95, C.STONE);
  boxShadow(e, x - .5 * s, y - .5 * s, x + .5 * s, y + .5 * s, 1.75 * s);
}
function pacer(e, t, x0, x1, speed) {
  const L = x1 - x0, s = (e.STILL ? L * .4 : t * speed) % (2 * L), fwd = s < L;
  return { x: x0 + (fwd ? s : 2 * L - s), yaw: fwd ? 0 : Math.PI };
}
function shiba(e, x, y, yaw, t) {
  const fx = Math.cos(yaw), fy = Math.sin(yaw);
  const P = (a, b, c) => [x + fx * a - fy * b, y + fy * a + fx * b, c];
  const add = (a, b, r0, r1, col) => e.dynamicAdd(a, b, r0, r1, () => col);
  const sw = e.STILL ? 0 : Math.sin(t * 9) * .12;
  for (const [a, b, s] of [[.3, .14, 1], [.3, -.14, -1], [-.3, .14, -1], [-.3, -.14, 1]]) add(P(a, b, .45), P(a + sw * s, b, .06), .07, .06, C.SHIBA);
  add(P(-.32, 0, .55), P(.32, 0, .6), .23, .24, C.SHIBA);
  add(P(-.05, 0, .42), P(.25, 0, .46), .14, .14, C.CREAM);
  add(P(.52, 0, .82), P(.52, 0, .82), .2, .2, C.SHIBA);
  add(P(.7, 0, .76), P(.76, 0, .74), .1, .08, C.CREAM);
  add(P(.84, 0, .76), P(.84, 0, .76), .035, .035, C.NOSE);
  add(P(.48, .1, 1.0), P(.5, .1, 1.08), .06, .03, C.SHIBA);
  add(P(.48, -.1, 1.0), P(.5, -.1, 1.08), .06, .03, C.SHIBA);
  add(P(-.42, 0, .78), P(-.34, 0, .92), .1, .09, C.CREAM);
}
function shibaLoop(e, t, cx, cy, rx, ry) {
  const th = t * .5;
  shiba(e, cx + Math.cos(th) * rx, cy + Math.sin(th) * ry, Math.atan2(ry * Math.cos(th), -rx * Math.sin(th)), t);
}
function deer(e, x, y, yaw, t) {
  const fx = Math.cos(yaw), fy = Math.sin(yaw);
  const P = (a, b, c) => [x + fx * a - fy * b, y + fy * a + fx * b, c];
  const add = (a, b, r0, r1, col) => e.dynamicAdd(a, b, r0, r1, () => col);
  const sw = e.STILL ? 0 : Math.sin(t * 5) * .16;
  for (const [a, b, s] of [[.42, .16, 1], [.42, -.16, -1], [-.42, .16, -1], [-.42, -.16, 1]]) add(P(a, b, .95), P(a + sw * s, b, .06), .08, .06, C.DEER);
  add(P(-.48, 0, 1.05), P(.45, 0, 1.12), .3, .3, C.DEER);
  add(P(.5, 0, 1.2), P(.72, 0, 1.62), .13, .11, C.DEER);
  add(P(.84, 0, 1.68), P(.98, 0, 1.6), .15, .1, C.DEER);
  add(P(.76, .12, 1.86), P(.74, .16, 1.94), .05, .04, C.DEER);
  add(P(.76, -.12, 1.86), P(.74, -.16, 1.94), .05, .04, C.DEER);
  add(P(-.66, 0, 1.12), P(-.7, 0, 1.0), .08, .06, C.CREAM);
}

/* Each scene: a tight plinth of ground around one large building. W/H/S/origin frame it. */
const SCENES = {
  // Fubon Liaoning Building (Liaoning St 177, Taipei): a slim blue glass tower split by dark recessed bands,
  // the Fubon logo at the top of its face, on a wide podium with a long glass band, a perforated metal panel
  // and a roof garden (wood deck, round planters, blue umbrellas, a lawn and solar panels)
  studio: {
    bare: true, S: 10, origin: 70, cx: .3, cy: .2, R: 6, zmax: 16,
    build(e, api) {
      const { box } = e, GL = [70, 104, 140], DARK = [40, 46, 56], MET = [168, 172, 176], SILV = [206, 210, 212];
      const TX0 = -2.6, TX1 = 2.6, TY0 = -3.0, TY1 = -.2, TOP = 15.4, PZ = 3.0;
      // tower: glass body, the dark recesses that split it, floor bands and mullions on the front (+y) and side (+x)
      api.emissive(() => box(TX0, TY0, 0, TX1, TY1, TOP, GL, 2), 'floors');
      for (const x of [-1.75, 1.55]) box(x, TY1 - .1, PZ, x + .2, TY1 + .02, TOP, DARK);
      box(TX1 - .1, -1.7, PZ, TX1 + .02, -1.5, TOP, DARK);
      for (let z = PZ + .6; z < TOP - 1; z += .62) {
        box(TX0, TY1, z, -1.75, TY1 + .16, z + .07, MET); box(1.75, TY1, z, TX1, TY1 + .16, z + .07, MET);
        box(TX1, TY0, z, TX1 + .16, TY1, z + .07, MET);
      }
      for (let x = -1.45; x < 1.5; x += .34) box(x, TY1, PZ, x + .05, TY1 + .05, TOP - 1, DARK);
      // light metal louvres across the top floors, the Fubon logo (blue over green) at their left
      for (let z = TOP - 1; z < TOP; z += .14) box(TX0, TY1, z, TX1, TY1 + .08, z + .07, SILV);
      for (let z = TOP - 1; z < TOP; z += .14) box(TX1, TY0, z, TX1 + .08, TY1, z + .07, SILV);
      box(-1.45, TY1 + .08, TOP - .5, -.95, TY1 + .12, TOP - .1, [46, 110, 196]);
      box(-1.3, TY1 + .08, TOP - .95, -.8, TY1 + .12, TOP - .55, [62, 168, 96]);
      box(TX0 - .05, TY0 - .05, TOP, TX1 + .05, TY1 + .05, TOP + .15, [104, 110, 118]);
      // podium: recessed glass ground floor, a long glass band above it, the perforated panel on the right
      const PX0 = -5.0, PX1 = 5.4, PY0 = -3.4, PY1 = 3.0;
      api.emissive(() => box(PX0 + .4, PY0 + .4, 0, PX1 - .4, PY1 - .5, 1.0, C.GLASS, 1), 'lobby');
      for (let x = PX0 + .6; x < PX1 - .4; x += .8) box(x, PY1 - .55, 0, x + .08, PY1 - .47, 1.0, MET);
      box(PX0, PY0, 1.0, PX1, PY1, 1.15, MET, 3);
      api.emissive(() => box(PX0, PY0, 1.15, 2.2, PY1, PZ - .2, [96, 128, 150], 4));
      for (let x = PX0 + .3; x < 2.2; x += .36) box(x, PY1, 1.15, x + .05, PY1 + .05, PZ - .2, DARK);
      box(2.2, PY0, 1.15, PX1, PY1, PZ - .2, [150, 154, 158], 5);
      for (let x = 2.35; x < PX1; x += .22) for (let z = 1.3; z < PZ - .3; z += .22) box(x, PY1, z, x + .08, PY1 + .03, z + .08, [118, 122, 128]);
      for (let y = PY0 + .15; y < PY1; y += .22) for (let z = 1.3; z < PZ - .3; z += .22) box(PX1, y, z, PX1 + .03, y + .08, z + .08, [118, 122, 128]);
      box(PX0 - .05, PY0 - .05, PZ - .2, PX1 + .05, PY1 + .05, PZ, SILV);
      // the teal logo on the lobby glass
      box(-1.1, PY1 - .5, .35, -.6, PY1 - .46, .85, [40, 170, 170]);
      // roof garden: wood deck in front of the tower, round white planters with trees, blue umbrellas
      box(PX0 + .2, TY1 + .1, PZ, 1.2, PY1 - .2, PZ + .06, C.DECK);
      for (const [x, y] of [[-4.2, 2.2], [-2.8, 1.0], [-1.4, 2.3], [-.2, 1.1]]) {
        box(x - .45, y - .45, PZ, x + .45, y + .45, PZ + .2, [236, 236, 232]);
        box(x - .35, y - .35, PZ + .2, x + .35, y + .35, PZ + .22, C.GREEN);
        e.sphere(x, y, PZ + .95, .5, C.GREEN, 'rough');
      }
      for (const [x, y] of [[-3.4, .4], [.4, .3], [.7, 1.9]]) {
        box(x - .02, y - .02, PZ, x + .02, y + .02, PZ + .55, MET);
        box(x - .3, y - .3, PZ + .55, x + .3, y + .3, PZ + .62, [52, 112, 196]);
      }
      // the raised block on the right: lawn on its roof, solar panels beside it
      box(1.5, -1.8, PZ, PX1 - .2, PY1 - .2, PZ + .7, [210, 212, 210], 6);
      box(1.6, -1.7, PZ + .7, 3.6, PY1 - .3, PZ + .78, [120, 160, 82]);
      for (let x = 3.75; x < PX1 - .3; x += .45) box(x, -1.6, PZ + .7, x + .38, PY1 - .4, PZ + .82, [52, 64, 96]);
      // the white curved canopy over the MRT entrance, front left
      box(PX0 - .2, PY1 + .6, 0, PX0 + 1.6, PY1 + 1.6, .6, [180, 196, 204]);
      box(PX0 - .3, PY1 + .5, .6, PX0 + 1.7, PY1 + 1.7, .75, [244, 244, 240]);
      box(PX0 + .1, PY1 + .4, .75, PX0 + 1.3, PY1 + 1.8, .85, [244, 244, 240]);
      boxShadow(e, TX0, TY0, TX1, TY1, TOP);
      boxShadow(e, PX0, PY0, PX1, PY1, PZ);
    },
    animate(e, t, o) {
      if (o.shiba) shibaLoop(e, t, 1.2, 4.6, 2.2, .5);
    },
  },
  home: {
    S: 15, origin: 22, cx: 0, cy: -.4, R: 6, zmax: 4.4,
    ground(e, x, y, ix, iy, i) {
      if (edgeOf(e, x, y, 5.6, 4.6, ix, iy) == null) return 0;
      for (let k = 0; k < 4; k++) {
        const sx = 1.6 + k * .6, sy = 1.9 + k * .7;
        if (Math.hypot(x - sx, (y - sy) * 1.2) < .36 + e.noise(x * 3, y * 3) * .1) return surface(e, C.STONE, x, y, ix, iy, .5);
      }
      if (x > -4 && x < 4 && y > -3.8 && y < 1.6) return surface(e, C.GRAVEL, x, y, ix, iy);
      return grassAt(e, x, y, ix, iy, i);
    },
    build(e, api, o) {
      const { box } = e;
      box(-3.4, -3.4, 0, 3.4, 1.0, .3, C.STONE, 1);
      box(-3.0, -3.0, .3, 3.0, .6, 2.2, C.WOOD, 2);
      api.emissive(() => box(-2.6, .6, .45, 2.6, .67, 2.0, C.SHOJI, 3));
      for (let x = -2.6; x <= 2.61; x += .65) box(x, .67, .45, x + .07, .7, 2.0, C.WOOD);
      for (const z of [.45, .97, 1.49, 1.94]) box(-2.6, .67, z, 2.6, .7, z + .06, C.WOOD);
      box(-3.3, .7, 0, 3.3, 1.65, .42, C.WOOD_L, 4);
      let top = 2.2;
      for (let k = 0; k < 7; k++) {
        const hw = 2.6 - k * .4;
        if (hw < .15) break;
        box(-3.6, -1.2 - hw, 2.2 + k * .24, 3.6, -1.2 + hw, 2.2 + (k + 1) * .24, C.TILE, 10 + k);
        top = 2.2 + (k + 1) * .24;
      }
      box(-3.7, -1.38, top, 3.7, -1.02, top + .14, C.INK);
      boxShadow(e, -3.6, -3.8, 3.6, 1.4, 2.4);
      o.notes.forEach((_, j) => {
        const px = -2.6 + j * .9;
        e.capsule([px, 1.2, .42], [px, 1.2, .68], .2, .24, () => C.POT);
        e.sphere(px, 1.2, .95, .3, C.GREEN, 'rough');
        e.castShadow(px, 1.2, .8, .3);
      });
      if (!o.pure) lantern(e, api, 4.0, 1.0, .8);
      e.growTree(-4.4, -3.0, .55, 240, 20);
    },
    animate(e, t, o) {
      if (o.shiba) shibaLoop(e, t, 1.8, 3.0, 1.6, .7);
    },
  },
  itsukushima: {
    bare: true, S: 14, origin: 20, cx: -.6, cy: -1.2, R: 6.4, zmax: 4.5,
    build(e, api) {
      const { box } = e, V = C.VERMIL;
      box(-5.4, -5.2, 0, 3.2, -2.6, .45, C.DECK, 1);
      box(-5.0, -4.9, .45, 2.8, -3.0, 2.0, C.WHITE, 2);
      for (let x = -5.0; x <= 2.7; x += 1.1) box(x, -3.0, .45, x + .22, -2.85, 2.0, V);
      box(-5.0, -3.0, 1.82, 2.8, -2.82, 2.02, V);
      for (let k = 0; k < 6; k++) {
        const hw = 1.75 - k * .32;
        if (hw < .15) break;
        box(-5.4, -3.95 - hw, 2.0 + k * .2, 3.2, -3.95 + hw, 2.0 + (k + 1) * .2, C.BARKROOF, 20 + k);
      }
      boxShadow(e, -5.4, -5.7, 3.2, -2.2, 2.2);
      const Y = 1.8;
      for (const px of [-.6, 3.0]) {
        box(px - .22, Y - .22, 0, px + .22, Y + .22, 3.8, V);
        box(px - .12, Y - 1.0, 0, px + .12, Y - .76, 2.0, V); box(px - .12, Y + .76, 0, px + .12, Y + 1.0, 2.0, V);
        box(px - .1, Y - 1.0, 1.7, px + .1, Y + 1.0, 1.85, V);
        boxShadow(e, px - .2, Y - 1.0, px + .2, Y + 1.0, 2.0);
      }
      box(-1.3, Y - .12, 2.8, 3.7, Y + .12, 3.04, V);
      box(1.1, Y - .12, 3.04, 1.3, Y + .12, 3.6, V);
      box(-1.7, Y - .28, 3.6, 4.1, Y + .28, 3.92, V);
      box(-1.9, Y - .33, 3.92, 4.3, Y + .33, 4.16, C.INK);
      boxShadow(e, -1.9, Y - .33, 4.3, Y + .33, 4.1);
    },
    animate(e, t) { const p = pacer(e, t, 0, 3.6, .5); deer(e, p.x, -2.0, p.yaw, t); },
  },
  naoshima: {
    bare: true, S: 15, origin: 18, cx: 0, cy: -2.0, R: 5.6, zmax: 3.6,
    build(e, api, o = {}) {
      const { box } = e, holes = e.rgb(128, 126, 120);
      box(1.6, -4.4, 0, 4.8, -1.4, 3.2, C.CONC, 3);
      api.emissive(() => box(3.0, -1.4, .2, 3.26, -1.33, 3.0, C.GLASS));
      box(-5.0, -1.4, 0, .8, -.8, 2.6, C.CONC, 1);
      box(.8, -4.6, 0, 1.4, -.8, 2.6, C.CONC, 2);
      for (let x = -4.7; x < .7; x += .6) for (const z of [.45, 1.05, 1.65, 2.25]) e.plot(x, -.78, z, holes);
      for (let y = -4.3; y < -.9; y += .6) for (const z of [.45, 1.05, 1.65, 2.25]) e.plot(1.42, y, z, holes);
      for (let x = 1.9; x < 4.7; x += .6) for (const z of [.5, 1.2, 1.9, 2.6]) if (Math.abs(x - 3.13) > .3) e.plot(x, -1.38, z, holes);
      for (let y = -4.1; y < -1.5; y += .6) for (const z of [.5, 1.2, 1.9, 2.6]) e.plot(4.82, y, z, holes);
      boxShadow(e, -5.0, -1.4, .8, -.8, 2.6);
      boxShadow(e, .8, -4.6, 1.4, -.8, 2.6);
      boxShadow(e, 1.6, -4.4, 4.8, -1.4, 3.2);
      if (!o.pure) {
        box(-3.2, 1.0, .42, -1.2, 1.4, .52, C.WOOD_L);
        box(-3.1, 1.05, 0, -3.0, 1.35, .42, C.INK); box(-1.4, 1.05, 0, -1.3, 1.35, .42, C.INK);
      }
    },
  },
  // Grand Central Terminal: Beaux-Arts front with three tall arched windows, paired columns, clock and sculpture on top
  grandcentral: {
    bare: true, S: 13, origin: 26, cx: 0, cy: 0, R: 5, zmax: 6.4,
    build(e, api) {
      const { box } = e, ST = [214, 200, 168], SD = [188, 174, 144], G = C.GLASS;
      box(-5, -3.6, 0, 5, -.2, 4.0, SD, 1);
      box(-4.6, 1.6, 0, 4.6, 2.2, .5, SD, 2);
      box(-4.4, -.2, 0, 4.4, 1.6, 4.5, ST, 3);
      for (const x of [-2.6, 0, 2.6]) {
        api.emissive(() => box(x - .62, 1.6, 1.0, x + .62, 1.67, 3.9, G));
        for (const mx of [x - .21, x + .21]) box(mx - .04, 1.67, 1.0, mx + .04, 1.71, 3.9, ST);
        box(x - .62, 1.67, 2.45, x + .62, 1.71, 2.52, ST);
      }
      for (const x of [-3.75, -1.3, 1.3, 3.75]) { box(x - .28, 1.6, .5, x - .06, 1.86, 4.2, ST); box(x + .06, 1.6, .5, x + .28, 1.86, 4.2, ST); }
      box(-4.6, -.3, 4.5, 4.6, 1.95, 4.78, SD);
      box(-2.1, .1, 4.78, 2.1, 1.5, 5.6, ST);
      // the round clock over the centre window, and the sculpture group (Mercury, Hercules, Minerva) around it
      e.sphere(0, 1.6, 5.15, .42, [226, 190, 92], 'gloss');
      e.sphere(0, 1.72, 5.15, .26, [250, 246, 232]);
      for (const [x, z, r] of [[-1.1, 5.4, .38], [1.1, 5.4, .38], [0, 6.0, .42], [-.6, 5.9, .3], [.6, 5.9, .3]]) e.sphere(x, 1.2, z, r, [170, 166, 150], 'rough');
      box(-1.4, .6, 5.6, 1.4, 1.3, 5.75, [168, 160, 132]);
      usFlag(e, 4.2, 2.0, 1.4);
      boxShadow(e, -5, -3.6, 5, 2.2, 4.5);
    },
  },
  // The White House: north front with a columned portico and pediment
  whitehouse: {
    bare: true, S: 13, origin: 18, cx: 0, cy: 0, R: 5, zmax: 4.6,
    build(e, api) {
      const { box } = e, W = [240, 240, 236], G = C.GLASS;
      box(-4.6, -2.2, 0, 4.6, 1, 3.0, W, 1);
      box(-4.7, -2.3, 3.0, 4.7, 1.1, 3.22, W);
      for (let x = -4.5; x < 4.6; x += .45) box(x, .96, 3.22, x + .16, 1.1, 3.5, W);
      box(-4.7, .94, 3.5, 4.7, 1.1, 3.58, W);
      for (let x = -4.2; x < 4.2; x += 1) {
        if (Math.abs(x + .22) < 1.9) continue;
        for (const z of [.55, 1.85]) api.emissive(() => box(x, 1, z, x + .44, 1.06, z + .8, G));
      }
      box(-1.9, 1, 0, 1.9, 2.9, .3, [222, 222, 216]);
      for (const x of [-1.55, -.55, .55, 1.55]) box(x - .13, 2.45, .3, x + .13, 2.71, 2.85, W);
      box(-1.85, 1, 2.85, 1.85, 2.8, 3.1, W);
      for (let k = 0; k < 4; k++) box(-1.85 + k * .44, 1, 3.1 + k * .16, 1.85 - k * .44, 2.8, 3.1 + (k + 1) * .16, W);
      api.emissive(() => box(-.32, 1, .3, .32, 1.06, 1.7, G));
      for (const x of [-3.2, 3.0]) box(x, -1.4, 3.22, x + .4, -1.0, 3.9, W);
      box(-.04, -.7, 3.22, .04, -.62, 4.9, [96, 96, 96]);
      box(.04, -.7, 4.4, .9, -.66, 4.86, [186, 52, 48]); box(.04, -.7, 4.62, .36, -.65, 4.86, [52, 62, 120]);
      // the fountain on the North Lawn
      box(-1.0, 4.0, 0, 1.0, 5.6, .25, [200, 198, 190]);
      box(-.8, 4.2, .2, .8, 5.4, .27, [120, 168, 196]);
      e.capsule([0, 4.8, .25], [0, 4.8, 1.3], .14, .05, () => [226, 238, 244]);
      boxShadow(e, -4.7, -2.3, 4.7, 2.9, 3.2);
    },
  },
  // MBC headquarters, Digital Media City: two glass towers on a shared podium (placeholder shape)
  mbc: {
    bare: true, S: 11, origin: 54, cx: 0, cy: 0, R: 5, zmax: 11,
    build(e, api) {
      const { box } = e, GL = [104, 128, 150], FR = [218, 222, 226];
      box(-4, -2.2, 0, 4, 2.2, 1.6, FR, 1);
      api.emissive(() => box(-3.8, 2.2, .2, 3.8, 2.27, 1.4, C.GLASS));
      api.emissive(() => box(-3.4, -1.6, 1.6, -.4, 1.6, 10.5, GL, 2), 'floors');
      api.emissive(() => box(.6, -1.6, 1.6, 3.4, 1.6, 8.0, GL, 3), 'floors');
      for (let z = 1.6; z < 10.5; z += .6) box(-3.44, -1.64, z, -.36, 1.64, z + .08, FR);
      for (let z = 1.6; z < 8.0; z += .6) box(.56, -1.64, z, 3.44, 1.64, z + .08, FR);
      box(-3.5, -1.7, 10.5, -.3, 1.7, 10.8, FR); box(.5, -1.7, 8.0, 3.5, 1.7, 8.3, FR);
      box(-.4, -.6, 6.0, .6, .6, 6.5, FR);
      signIso(e, 'MBC', { face: 'y', x: 0, y: 2.27, z: 1.5, scale: 2, colors: [[28, 40, 92]] });
      boxShadow(e, -4, -2.2, 4, 2.2, 10.5);
    },
  },
  // Hongik University, Hongmun Hall: a tall block with a huge gate cut through it
  hongik: {
    bare: true, S: 12, origin: 40, cx: 0, cy: 0, R: 5, zmax: 9,
    build(e, api) {
      const { box } = e, BR = [176, 112, 92], CN = [196, 192, 186];
      box(-3.8, -1.6, 0, -1.1, 1.6, 8.6, BR, 1);
      box(1.1, -1.6, 0, 3.8, 1.6, 8.6, BR, 2);
      box(-1.1, -1.6, 4.8, 1.1, 1.6, 8.6, BR, 3);
      box(-3.9, -1.7, 8.6, 3.9, 1.7, 8.9, CN);
      for (const [x0, x1] of [[-3.5, -1.4], [1.4, 3.5]]) for (let z = .6; z < 8.2; z += .9) for (let x = x0; x < x1; x += .7) api.emissive(() => box(x, 1.6, z, x + .36, 1.66, z + .5, C.GLASS));
      for (let z = 5.2; z < 8.2; z += .9) for (let x = -.9; x < .9; x += .7) api.emissive(() => box(x, 1.6, z, x + .36, 1.66, z + .5, C.GLASS));
      box(-1.1, -1.6, 4.6, 1.1, 1.6, 4.8, CN);
      boxShadow(e, -3.9, -1.7, 3.9, 1.7, 8.6);
    },
  },
  // United Nations headquarters: the Secretariat slab and the low General Assembly beside it
  unitednations: {
    bare: true, S: 10, origin: 56, cx: 0, cy: 0, R: 5, zmax: 15,
    build(e, api) {
      const { box } = e, MB = [232, 230, 222], GL = [92, 130, 126];
      api.emissive(() => box(-1.0, -3.4, 0, 1.0, 3.4, 14.5, GL, 1), 'floors');
      for (let z = .6; z < 14.5; z += .55) box(-1.04, -3.44, z, 1.04, 3.44, z + .06, [170, 196, 190]);
      box(-1.1, -3.6, 0, 1.1, -3.3, 14.8, MB); box(-1.1, 3.3, 0, 1.1, 3.6, 14.8, MB);
      box(-1.1, -3.6, 14.5, 1.1, 3.6, 14.9, MB);
      box(1.8, -2.4, 0, 6.2, 2.4, 2.4, MB, 2);
      for (let k = 0; k < 4; k++) box(1.8 + k * .3, -2.4, 2.4 + k * .22, 6.2 - k * .3, 2.4, 2.4 + (k + 1) * .22, [222, 220, 212]);
      box(3.6, -.5, 3.3, 4.4, .5, 3.7, MB);
      // the row of member states' flags along First Avenue
      const cloths = [[186, 46, 44], [44, 96, 168], [240, 200, 60], [36, 128, 72], [240, 240, 236], [30, 30, 34], [214, 110, 40], [96, 160, 210]];
      for (let k = 0; k < 14; k++) flag(e, -1.6 + k * .58, 4.6, 2.2, cloths[(k * 5) % cloths.length]);
      boxShadow(e, -1.1, -3.6, 6.2, 3.6, 14.5);
    },
  },
  // Whitney Museum of American Art: a steel-clad block stepping down in terraces toward the High Line
  whitney: {
    bare: true, S: 12, origin: 40, cx: 0, cy: 0, R: 5, zmax: 8,
    build(e, api) {
      const { box } = e, ST = [150, 162, 172], SD = [126, 138, 150], GL = C.GLASS;
      box(-4, -2.4, 0, 1.2, 2.4, 7.6, ST, 1);
      box(1.2, -2.4, 0, 2.8, 2.4, 6.0, SD, 2);
      box(2.8, -2.4, 0, 4.2, 2.4, 4.4, ST, 3);
      box(4.2, -2.4, 0, 5.2, 2.4, 2.8, SD, 4);
      api.emissive(() => box(-3.8, 2.4, 0, 5.0, 2.47, 1.3, GL));
      for (const [x0, x1, top] of [[-4, 1.2, 7.6], [1.2, 2.8, 6.0], [2.8, 4.2, 4.4]]) for (let z = 2.2; z < top - .4; z += 1.6) api.emissive(() => box(x0 + .2, 2.4, z, x1 - .2, 2.46, z + .28, GL));
      api.emissive(() => box(-4.06, -2.0, 2.0, -4.0, 1.6, 6.8, GL));
      for (const [x0, x1, z] of [[1.2, 2.8, 6.0], [2.8, 4.2, 4.4], [4.2, 5.2, 2.8]]) box(x0, -2.4, z, x1, -2.3, z + .35, [200, 204, 206]);
      // the outdoor stairs that link the terraces
      for (const [x0, z0, z1] of [[1.3, 4.4, 6.0], [2.9, 2.8, 4.4]]) for (let k = 0; k < 5; k++) box(x0 + k * .28, -.6, z1 - (k + 1) * (z1 - z0) / 5, x0 + (k + 1) * .28, .2, z1 - k * (z1 - z0) / 5, [200, 204, 206]);
      // the big overhang above the entrance, facing the river
      box(-4.9, -2.4, 3.4, -4.0, 2.4, 7.6, ST);
      api.emissive(() => box(-4.96, -2.0, 4.0, -4.9, 2.0, 7.0, GL));
      boxShadow(e, -4.9, -2.4, 5.2, 2.4, 7.6);
    },
  },
  // United States Capitol: a dome on a drum, between two long wings
  capitol: {
    bare: true, S: 10, origin: 40, cx: 0, cy: 0, R: 5, zmax: 9,
    build(e, api) {
      const { box } = e, W = [238, 236, 228];
      box(-7, -1.8, 0, 7, 1.6, 2.6, W, 1);
      box(-7.1, -1.9, 2.6, 7.1, 1.7, 2.85, W);
      for (let x = -6.6; x < 6.6; x += .7) { if (Math.abs(x) < 2.4) continue; api.emissive(() => box(x, 1.6, .6, x + .3, 1.66, 2.0, C.GLASS)); }
      box(-2.2, 1.6, 0, 2.2, 3.0, .4, [226, 224, 216]);
      for (const x of [-1.9, -1.1, -.3, .5, 1.3]) box(x, 2.6, .4, x + .22, 2.82, 2.5, W);
      box(-2.2, 1.6, 2.5, 2.2, 3.0, 2.85, W);
      for (let k = 0; k < 3; k++) box(-2.2 + k * .6, 1.6, 2.85 + k * .2, 2.2 - k * .6, 3.0, 2.85 + (k + 1) * .2, W);
      e.capsule([0, 0, 2.85], [0, 0, 4.6], 1.75, 1.75, () => W);
      for (let a = 0; a < 6.283; a += .42) box(Math.cos(a) * 1.78 - .06, Math.sin(a) * 1.78 - .06, 3.0, Math.cos(a) * 1.78 + .06, Math.sin(a) * 1.78 + .06, 4.4, [210, 208, 200]);
      e.sphere(0, 0, 4.8, 1.6, W);
      e.capsule([0, 0, 6.2], [0, 0, 6.9], .32, .26, () => W);
      e.capsule([0, 0, 6.9], [0, 0, 7.5], .1, .08, () => [96, 98, 104]);
      e.sphere(0, 0, 7.6, .09, [96, 98, 104]);
      for (const x of [-5, 5]) usFlag(e, x, 0, 3.8);
      boxShadow(e, -7, -1.9, 7, 3.0, 4.5);
    },
  },
  // Washington Monument: a stone obelisk
  washington: {
    bare: true, S: 9, origin: 92, cx: 0, cy: 0, R: 4.5, zmax: 19,
    build(e, api) {
      const { box } = e, ST = [226, 218, 202], SD = [212, 204, 188];
      for (let k = 0; k < 18; k++) {
        const h = .82 - k * .012;
        box(-h, -h, k, h, h, k + 1, k % 2 ? ST : SD, k);
      }
      for (let k = 0; k < 4; k++) { const h = .6 - k * .15; box(-h, -h, 18 + k * .35, h, h, 18 + (k + 1) * .35, ST); }
      for (const x of [-.2, .1]) { box(x, .62, 16.8, x + .12, .66, 17.2, [70, 64, 58]); box(.62, -x - .12, 16.8, .66, -x, 17.2, [70, 64, 58]); }
      // the ring of American flags around the base
      for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; usFlag(e, Math.cos(a) * 3.1, Math.sin(a) * 3.1, 2.4); }
      boxShadow(e, -.82, -.82, .82, .82, 18);
    },
  },
  // 111 Eighth Avenue (the old Port of New York Authority building, now Google's office): a brick block with setbacks on a stone base
  google: {
    bare: true, S: 10, origin: 48, cx: 0, cy: 0, R: 5, zmax: 11,
    build(e, api) {
      const { box } = e, BR = [142, 92, 72], BD = [124, 80, 62], ST = [208, 202, 188], G = C.GLASS;
      box(-5, -2.6, 0, 5, 2.6, 1.7, ST, 1);
      box(-4.8, -2.4, 1.7, 4.8, 2.4, 8.4, BR, 2);
      box(-3.8, -1.8, 8.4, 3.8, 1.8, 9.6, BD, 3);
      box(-2.6, -1.2, 9.6, 2.6, 1.2, 10.5, BR, 4);
      for (let z = 2.1; z < 8.2; z += .75) for (let x = -4.5; x < 4.6; x += .62) api.emissive(() => box(x, 2.4, z, x + .3, 2.46, z + .42, G), 'floors');
      for (let z = 2.1; z < 8.2; z += .75) for (let y = -2.1; y < 2.2; y += .62) api.emissive(() => box(4.8, y, z, 4.86, y + .3, z + .42, G), 'floors');
      for (let x = -4.4; x < 4.5; x += 1.4) api.emissive(() => box(x, 2.6, .3, x + .8, 2.66, 1.4, G));
      box(-5.05, 2.55, 1.5, 5.05, 2.75, 1.7, [190, 184, 170]);
      // the Google sign above the stone base, and the old terminal's name cut into the stone
      signIso(e, 'Google', { face: 'y', x: 0, y: 2.47, z: 3.5, scale: 2, colors: [[66, 133, 244], [219, 68, 55], [244, 180, 0], [66, 133, 244], [15, 157, 88], [219, 68, 55]] });
      signIso(e, 'INLAND TERMINAL', { face: 'y', x: 1.2, y: 2.75, z: 1.66, scale: 1, colors: [[140, 120, 84]] });
      usFlag(e, -4.4, 3.4, 3.2);
      boxShadow(e, -5, -2.6, 5, 2.6, 8.4);
    },
  },
  // The High Line: an old elevated rail line on steel columns, now a planted walkway
  highline: {
    bare: true, S: 13, origin: 18, cx: 0, cy: 0, R: 5, zmax: 4,
    build(e) {
      const { box } = e, STEEL = [74, 84, 80], PAVE = [192, 190, 182], WOOD = [168, 128, 88];
      for (const x of [-4.6, -1.6, 1.4, 4.4]) for (const y of [-.8, .8]) box(x - .14, y - .14, 0, x + .14, y + .14, 2.2, STEEL);
      box(-5.4, -1.2, 2.2, 5.4, 1.2, 2.7, STEEL, 1);
      box(-5.3, -1.1, 2.7, 5.3, 1.1, 2.8, PAVE, 2);
      for (let x = -5.2; x < 5.2; x += .5) box(x, -1.15, 2.8, x + .06, -1.1, 3.3, STEEL);
      box(-5.3, -1.18, 3.24, 5.3, -1.1, 3.3, STEEL);
      box(-5.2, .3, 2.8, -1.4, 1.05, 3.05, [120, 86, 62]);
      for (let k = 0; k < 9; k++) e.sphere(-4.9 + k * .45, .68 + (k % 2) * .08, 3.25, .26, k % 3 ? C.GREEN : [140, 150, 96], 'rough');
      for (let k = 0; k < 7; k++) e.sphere(-4.7 + k * .5, .5 + (k % 3) * .14, 3.5, .07, [[214, 120, 160], [240, 214, 90], [240, 240, 236]][k % 3]);
      // the old rail tracks left in the paving
      for (const y of [-.5, -.2]) box(-5.2, y, 2.8, -1.6, y + .05, 2.86, [120, 96, 80]);
      box(.4, .2, 2.8, 3.4, .75, 3.1, WOOD); box(.4, .75, 2.8, 3.4, .95, 3.4, WOOD);
      boxShadow(e, -5.4, -1.2, 5.4, 1.2, 2.7);
    },
  },
  // The New York Times Building: a glass tower behind a screen of horizontal ceramic rods, with a mast on top
  nyt: {
    bare: true, S: 11, origin: 70, cx: 0, cy: 0, R: 4, zmax: 18,
    build(e, api) {
      const { box } = e, ROD = [218, 220, 216], GL = [96, 118, 136], X = 3.0, Y = 2.2;
      api.emissive(() => box(-X, -Y, 0, X, Y, 1.6, C.GLASS, 1));
      api.emissive(() => box(-X, -Y, 1.6, X, Y, 14.6, GL, 2), 'floors');
      // ceramic rods stop short of the corners, where the glass shows, as on the real building
      for (let z = 1.9; z < 14.6; z += .38) { box(-X + .5, Y, z, X - .5, Y + .1, z + .1, ROD); box(X, -Y + .5, z, X + .1, Y - .5, z + .1, ROD); }
      box(-X - .1, -Y - .1, 14.6, X + .1, Y + .1, 14.9, ROD);
      box(-.12, -.12, 14.9, .12, .12, 18, [150, 152, 156]);
      box(-X - .2, Y, 1.5, X + .2, Y + .9, 1.65, ROD);
      // the name across the rods, low on the front, in two lines
      const ink = [[28, 28, 30]];
      for (const [line, top] of [['THE NEW', 5.6], ['YORK TIMES', 4.6]]) signIso(e, line, { face: 'y', x: 0, y: Y + .1, z: top, scale: 1, colors: ink });
      boxShadow(e, -X - .1, -Y - .1, X + .1, Y + .1, 14.6);
    },
  },
  // Lincoln Memorial: a Doric temple of white marble on a stepped base, columns all round
  lincoln: {
    bare: true, S: 12, origin: 26, cx: 0, cy: 0, R: 5, zmax: 5,
    build(e) {
      const { box } = e, MB = [236, 234, 226], MD = [220, 218, 210];
      for (let k = 0; k < 4; k++) box(-6 + k * .3, -3.6 + k * .3, k * .25, 6 - k * .3, 3.6 - k * .3, (k + 1) * .25, MD, k);
      box(-4.4, -2.0, 1.0, 4.4, 2.0, 3.6, [200, 198, 190], 5);
      for (let x = -4.8; x <= 4.81; x += .8) { box(x - .17, 2.42, 1.0, x + .17, 2.76, 3.7, MB); box(x - .17, -2.76, 1.0, x + .17, -2.42, 3.7, MB); }
      for (let y = -2.0; y <= 2.01; y += .8) { box(4.82, y - .17, 1.0, 5.16, y + .17, 3.7, MB); box(-5.16, y - .17, 1.0, -4.82, y + .17, 3.7, MB); }
      box(-5.4, -3.0, 3.7, 5.4, 3.0, 4.3, MB);
      box(-4.4, -2.0, 4.3, 4.4, 2.0, 5.0, MD);
      // the open centre of the front, with Lincoln seated inside
      box(-1.3, 1.98, 1.0, 1.3, 2.04, 3.5, [70, 70, 74]);
      e.capsule([0, 2.06, 1.3], [0, 2.06, 2.1], .34, .26, () => [244, 242, 236]);
      e.sphere(0, 2.1, 2.4, .2, [244, 242, 236]);
      box(-.45, 2.04, 1.0, .45, 2.3, 1.3, [236, 234, 226]);
      // the wide steps up the front
      for (let k = 0; k < 4; k++) box(-2.4 + k * .1, 3.6 + (3 - k) * .35, 0, 2.4 - k * .1, 3.6 + (4 - k) * .35, (k + 1) * .25, MD);
      boxShadow(e, -5.4, -3.0, 5.4, 3.0, 4.3);
    },
  },
};

/* ================= worlds ================= */
let LIGHT = lightFor(Date.now());
const worlds = new Map();
const ANG = 16; // turntable steps (22.5° each)
function getWorld(scene, opts, rot = 0, keep = true) {
  const key = [scene, opts.shiba ? 1 : 0, opts.pure ? 'pure' : '', LIGHT.sx, LIGHT.sy, rot].join('|');
  if (worlds.has(key)) { const w = worlds.get(key); worlds.delete(key); worlds.set(key, w); return w; }
  const sc = SCENES[scene];
  const canvas = document.createElement('canvas');
  const pure = !!opts.pure, bare = sc.bare || pure;
  const e0 = createPixelEngine(canvas, { W: 420, H: 420, S: sc.S, originY: sc.origin, cx: sc.cx, cy: sc.cy, rot: rot * 2 * Math.PI / ANG, shadowX: LIGHT.sx, shadowY: LIGHT.sy });
  // a "pure" world draws the building only: shadows, people, animals and trees are switched off
  const e = pure ? Object.assign({}, e0, { castShadow() {}, growTree() {}, figure() { return [0, 0, 0]; } }) : e0;
  e.zb.fill(-1e9); e.pix.fill(0);
  const MARK = e.rgb(255, 255, 255);
  for (let iy = 0; iy < e.H; iy++) for (let ix = 0; ix < e.W; ix++) {
    const g = e.unproject(ix + .5, iy + .5), i = iy * e.W + ix, c = bare ? MARK : sc.ground(e, g.x, g.y, ix, iy, i);
    if (!c) continue;
    e.pix[i] = c; e.ground[i] = 1; e.zb[i] = e.project(g.x, g.y, 0).d;
  }
  e.growGrass();
  e.groundZ.set(e.zb);
  const em = [], emc = [], emk = [];
  const api = {
    emissive(fn, kind = 'all') {
      const before = e.pix.slice();
      fn();
      for (let i = 0; i < e.pix.length; i++) if (e.pix[i] !== before[i]) { em.push(i); emc.push(e.pix[i]); emk.push(kind); }
    },
  };
  sc.build(e, api, opts);
  e.pendingShadows.length = 0;
  if (sc.statics && !pure) sc.statics(e, opts);
  e.flushShadows();
  if (!pure) e.bakeOcclusion();
  e.staticShadow.set(e.shadowMask);
  e.applyShadows(e.groundZ);
  e.bakedPix.set(e.pix); e.bakedZ.set(e.zb);
  const lit = [];
  for (let k = 0; k < em.length; k++) {
    if (e.bakedPix[em[k]] !== emc[k]) continue;
    // office floors: light only some floors, so the tower reads as a building at night
    if (emk[k] === 'floors' && e.hash(3, Math.floor((em[k] / e.W) / 6.5)) < .45) continue;
    lit.push(em[k]);
  }
  // crop around the building itself (not its shadow), centred on it, so it stays in the middle at any hour
  let x0 = e.W, y0 = e.H, x1 = 0, y1 = 0;
  for (let iy = 0; iy < e.H; iy++) for (let ix = 0; ix < e.W; ix++) {
    const i = iy * e.W + ix, p = e.bakedPix[i];
    if (!(p >>> 24)) continue;
    if (bare && e.ground[i] && e.bakedZ[i] === e.groundZ[i]) continue; // ground or shadow
    if (ix < x0) x0 = ix; if (ix > x1) x1 = ix; if (iy < y0) y0 = iy; if (iy > y1) y1 = iy;
  }
  const mx = 14, half = Math.max((x1 - x0) / 2 + mx, 40), cxm = (x0 + x1) / 2;
  x0 = Math.max(0, Math.round(cxm - half)); x1 = Math.min(e.W - 1, Math.round(cxm + half));
  y0 = Math.max(0, y0 - 12); y1 = Math.min(e.H - 1, y1 + 18);
  // the picture then grows to take in the whole shadow. The building's box above still decides the size and the
  // centre on screen; the extra edges (pad: top, right, bottom, left) are allowed to spill over the page.
  let sx0 = x0, sy0 = y0, sx1 = x1, sy1 = y1;
  if (bare && !pure) {
    for (let iy = 0; iy < e.H; iy++) for (let ix = 0; ix < e.W; ix++) {
      const i = iy * e.W + ix, p = e.bakedPix[i];
      if (!e.ground[i] || e.bakedZ[i] !== e.groundZ[i] || p === MARK || !(p >>> 24)) continue; // only shaded ground
      if (ix < sx0) sx0 = ix; if (ix > sx1) sx1 = ix; if (iy < sy0) sy0 = iy; if (iy > sy1) sy1 = iy;
    }
    sx0 = Math.max(0, sx0 - 2); sy0 = Math.max(0, sy0 - 2); sx1 = Math.min(e.W - 1, sx1 + 2); sy1 = Math.min(e.H - 1, sy1 + 2);
  }
  const pad = [y0 - sy0, sx1 - x1, sy1 - y1, x0 - sx0];
  const view = document.createElement('canvas'); view.width = sx1 - sx0 + 1; view.height = sy1 - sy0 + 1;
  const w = { key, scene, sc, e, canvas, view, crop: [sx0, sy0, view.width, view.height], pad, opts, em: Int32Array.from(lit), MARK, bare, pure };
  if (!keep) return w;
  worlds.set(key, w);
  while (worlds.size > 6) worlds.delete(worlds.keys().next().value);
  return w;
}
function drawWorld(w, t) {
  const e = w.e, pix = e.pix;
  pix.set(e.bakedPix); e.zb.set(e.bakedZ);
  e.pendingShadows.length = 0;
  if (w.sc.animate && !w.pure) w.sc.animate(e, t, w.opts);
  const wt = e.STILL ? 0 : Math.floor(t * 8) / 8;
  e.drawLeaves(wt); e.drawTufts(wt);
  e.flushShadows(); e.applyShadows(e.bakedZ); e.shadeEdges();
  // bare scenes: the ground is invisible; only its shadows stay, as soft translucent violet
  if (w.bare) {
    for (let i = 0; i < pix.length; i++) {
      if (!e.ground[i] || e.zb[i] !== e.groundZ[i]) continue;
      const p = pix[i];
      if (p === w.MARK) { pix[i] = 0; continue; }
      const a = Math.round(cl((255 - (p & 255)) / 255 * .62, 0, .5) * 255);
      pix[i] = ((a << 24) | (62 << 16) | (30 << 8) | 34) >>> 0;
    }
  }
  const L = LIGHT;
  if (L.kr !== 1 || L.kg !== 1 || L.kb !== 1) {
    for (let i = 0; i < pix.length; i++) {
      const p = pix[i], a = p >>> 24;
      if (!a) continue;
      pix[i] = ((a << 24) | (Math.min(255, (p >> 16 & 255) * L.kb) << 16) | (Math.min(255, (p >> 8 & 255) * L.kg) << 8) | Math.min(255, (p & 255) * L.kr)) >>> 0;
    }
  }
  if (L.lit > 0) {
    for (const i of w.em) {
      const p = e.bakedPix[i], a = e.hash(i % e.W, i / e.W | 0) > .5;
      pix[i] = e.rgb(mix((p & 255) * L.kr, a ? 255 : 246, L.lit), mix((p >> 8 & 255) * L.kg, a ? 210 : 186, L.lit), mix((p >> 16 & 255) * L.kb, a ? 140 : 104, L.lit));
    }
  }
  e.ctx.putImageData(e.image, 0, 0);
  const [cx0, cy0, cw, ch] = w.crop, g = w.view.getContext('2d');
  g.clearRect(0, 0, cw, ch); g.drawImage(w.canvas, cx0, cy0, cw, ch, 0, 0, cw, ch);
}

/* ================= day ================= */
const state = { ang: 0, day: REAL_DAY, minute: REAL.h * 60 + REAL.min, followNow: true, items: [], index: 0 };
function isRestDay(dd) { const md = pad(dd.m) + '-' + pad(dd.d); return { rest: dd.wd === 0 || dd.wd === 6 || !!HOLIDAYS[md], holiday: HOLIDAYS[md] }; }
// left → right: oldest year → today
function buildItems() {
  const dd = fromDayMs(state.day), md = pad(dd.m) + '-' + pad(dd.d);
  const r = isRestDay(dd), base = r.rest ? 'home' : 'studio';
  const little = LITTLE.filter(l => state.day >= l.day && state.day < l.day + 7 * 864e5);
  const extra = little.map(l => l.text).join(' ');
  const items = MEMORIES.filter(m => m.date.slice(5) === md && +m.date.slice(0, 4) < dd.y && checkMemory(m))
    .sort(byDate).map(m => {
      const year = +m.date.slice(0, 4);
      return { date: m.date, id: m.id, scene: m.scene, opts: {}, label: String(year), name: m.zh && !m.noZh ? `${m.name}\u00a0· ${m.zh}` : m.name, meta: '', html: sentenceFor(m, dd.y - year) };
    });
  const day = r.holiday || (r.rest ? 'Weekend' : 'Weekday');
  items.push({
    scene: base, opts: { shiba: little.some(l => l.kind === 'shiba'), notes: NOTES }, label: 'Today', about: true, id: todayISO(),
    name: base === 'home' ? 'Yen is at home today.' : 'Yen is at the office today.',
    place: base === 'home' ? 'home' : 'the office',
    meta: `${day} · ${CITY.name}`,
    note: BIO + (extra ? ' ' + extra : ''),
  });
  state.items = items; state.index = items.length - 1;
}

/* ================= ui ================= */
const $ = id => document.getElementById(id);
const stage = $('stage'), thumbsEl = $('thumbs'), group = $('group');
let mainWorld = null;
// The stage box has one fixed size for every building, so the text under it never moves.
let STAGE = { w: 300, h: 300 };
function sizeStage() {
  const wide = innerWidth >= 900;
  let h, lift = 0;
  if (wide) h = Math.round(cl(innerHeight - 76 - 56, 260, 760));
  else {
    // phones: the first screen holds the building, today's words and the bar, with nothing hidden under the bar.
    // The building gets what is left after the words (up to half the screen); any space still left is split
    // above and below, so the building and its words stay together in the middle instead of drifting apart.
    const room = innerHeight - 76 - $('cmdbar').offsetHeight;
    const words = $('group').querySelector('.tools').offsetHeight + $('group').querySelector('.caption').offsetHeight + 8 + 12;
    h = Math.round(cl(Math.min(innerHeight * .5, room - words), 180, 520));
    lift = Math.max(0, Math.round((room - words - h) / 2));
  }
  STAGE = { w: wide ? Math.round(group.clientWidth * .53) : group.clientWidth, h };
  stage.style.width = STAGE.w + 'px'; stage.style.height = STAGE.h + 'px';
  group.style.paddingTop = lift ? lift + 'px' : '';
}
const disp = document.createElement('canvas');
stage.append(disp);
// the building's own box inside a world's picture: [x, y, width, height] (the rest is shadow)
function innerOf(w) { const [t, r, b, l] = w.pad; return [l, t, w.view.width - l - r, w.view.height - t - b]; }
function fitCanvas(w) {
  if (disp.width !== w.view.width || disp.height !== w.view.height) { disp.width = w.view.width; disp.height = w.view.height; }
  // sized and placed by the building alone; negative margins let the shadow spill past the stage, uncut
  const [, , iw, ih] = innerOf(w), [t, r, b, l] = w.pad;
  const f = Math.max(.4, Math.min(STAGE.w / iw, STAGE.h / ih, 3.4) * .86);
  disp.style.width = Math.round(disp.width * f) + 'px'; disp.style.height = Math.round(disp.height * f) + 'px';
  disp.style.margin = `${-t * f}px ${-r * f}px ${-b * f}px ${-l * f}px`;
}
// the building part of what is on screen now, as its own picture and place (for the timeline's fly-in and fly-out)
function dispInner() {
  const r = disp.getBoundingClientRect(), k = r.width / disp.width;
  const [x, y, iw, ih] = mainWorld ? innerOf(mainWorld) : [0, 0, disp.width, disp.height];
  const c = document.createElement('canvas'); c.width = iw; c.height = ih;
  c.getContext('2d').drawImage(disp, x, y, iw, ih, 0, 0, iw, ih);
  return { img: c, rect: { left: r.left + x * k, top: r.top + y * k, width: iw * k, height: ih * k } };
}
function blit(src) { const g = disp.getContext('2d'); g.clearRect(0, 0, disp.width, disp.height); g.drawImage(src, 0, 0); }
/* turntable: 16 pre-drawn views per building, filled in the background, so dragging is smooth */
const frames = new Map();
let frameJob = 0;
function frameSet(it) {
  const key = [it.scene, it.opts.shiba ? 1 : 0, LIGHT.sx, LIGHT.sy, LIGHT.n.toFixed(2)].join('|');
  if (!frames.has(key)) { frames.set(key, new Array(ANG).fill(null)); while (frames.size > 4) frames.delete(frames.keys().next().value); }
  return frames.get(key);
}
function renderFrame(it, a) {
  const set = frameSet(it);
  if (set[a]) return set[a];
  const w = worlds.get([it.scene, it.opts.shiba ? 1 : 0, LIGHT.sx, LIGHT.sy, a].join('|')) || getWorld(it.scene, it.opts, a, false);
  drawWorld(w, clockT());
  const c = document.createElement('canvas'); c.width = w.view.width; c.height = w.view.height;
  c.getContext('2d').drawImage(w.view, 0, 0);
  set[a] = c;
  return c;
}
function prefill(it, from) {
  const job = ++frameJob, order = [];
  for (let k = 1; k <= ANG / 2; k++) order.push((from + k) % ANG, (from - k + ANG) % ANG);
  const step = () => {
    if (job !== frameJob) return;
    const a = order.shift();
    if (a === undefined) return;
    renderFrame(it, a);
    setTimeout(step, 30);
  };
  setTimeout(step, 400);
}
function nearestFrame(it, a) {
  const set = frameSet(it);
  for (let k = 0; k <= ANG / 2; k++) { if (set[(a + k) % ANG]) return set[(a + k) % ANG]; if (set[(a - k + ANG) % ANG]) return set[(a - k + ANG) % ANG]; }
  return null;
}
function renderText() {
  const dd = fromDayMs(state.day), it = state.items[state.index];
  if (document.getElementById('tl').hidden) dialTo(todayISO(), `${LONG_DAY[dd.wd]} · ${CITY.name} ${pad(Math.floor(state.minute / 60))}:${pad(state.minute % 60)}`);
  $('capName').textContent = it.name; $('capName').classList.toggle('past', !it.about && !it.main);
  $('capMeta').textContent = it.meta; $('capMeta').hidden = !it.meta;
  if (it.html) $('capNote').innerHTML = it.html; else $('capNote').textContent = it.note;
  $('capTag').hidden = !it.pastView; if (it.pastView) $('capTag').textContent = it.tag;
}
function renderThumbs() {
  thumbsEl.innerHTML = '';
  thumbsEl.classList.toggle('none', state.items.length < 2);
  state.items.forEach((it, k) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'thumb'; b.setAttribute('role', 'tab');
    b.setAttribute('aria-current', String(k === state.index));
    b.setAttribute('aria-label', `${it.label} ${it.name}`);
    const c = document.createElement('canvas'); c.width = 120; c.height = 108;
    const s = document.createElement('span'); s.textContent = it.label;
    b.append(c, s);
    b.addEventListener('click', () => go(k));
    thumbsEl.append(b);
    it.thumb = c;
  });
  paintThumbs();
}
function paintThumbs() {
  state.items.forEach(it => {
    if (!it.thumb) return;
    const w = getWorld(it.scene, it.opts, 0);
    drawWorld(w, 1.3);
    const g = it.thumb.getContext('2d'), [sx, sy, sw, sh] = innerOf(w);
    const k = Math.min(120 / sw, 108 / sh), dw = sw * k, dh = sh * k;
    g.clearRect(0, 0, 120, 108); g.imageSmoothingEnabled = true;
    g.drawImage(w.view, sx, sy, sw, sh, (120 - dw) / 2, (108 - dh) / 2, dw, dh);
  });
  if (mainWorld) { drawWorld(mainWorld, clockT()); blit(mainWorld.view); }
}
function mount(animated) {
  const it = state.items[state.index];
  const show = () => {
    const w = getWorld(it.scene, it.opts, state.ang);
    mainWorld = w; fitCanvas(w); drawWorld(w, clockT()); blit(w.view);
  };
  if (!animated) { show(); return; }
  disp.classList.add('out');
  setTimeout(() => {
    show(); disp.classList.remove('out'); disp.classList.add('in');
    requestAnimationFrame(() => requestAnimationFrame(() => disp.classList.remove('in')));
  }, 200);
}
function go(k) {
  const n = state.items.length;
  if (n < 2) return;
  const next = cl(k, 0, n - 1);
  if (next === state.index) return;
  state.index = next; state.ang = 0;
  [...thumbsEl.children].forEach((b, j) => b.setAttribute('aria-current', String(j === next)));
  renderText();
  mount(true);
}
/* the homepage, but on a past day: only reached from the timeline (#past-YYYY-MM-DD).
   Same page as today, only the main building is swapped; the badge says which day it is,
   the top button says Today and goes back, tapping the building opens the timeline there. */
function renderPast(date) {
  const x = tlEntries().find(e => e.id === date && !e.today);
  if (!x) { exitPast(); return; }
  const id = date; date = x.date;
  const m = x.m, d = parseDay(date), now = fromDayMs(state.day).y, md = date.slice(5);
  state.pastDate = id;
  document.body.classList.add('is-past');
  // that day's homepage: earlier years on the same date on the left, that building as the main one
  const same = MEMORIES.filter(o => o.date.slice(5) === md && o.date <= date && checkMemory(o)).sort(byDate);
  state.items = same.map(o => {
    const y = +o.date.slice(0, 4), main = o.id === id;
    return { date: o.date, id: o.id, scene: o.scene, opts: {}, label: o.date === date ? 'That day' : String(y), main, pastView: main,
      tag: `${ago(now - d.y)} · ${LONG_MON[d.m - 1]} ${d.d}, ${d.y}`,
      name: o.zh && !o.noZh ? `${o.name}\u00a0· ${o.zh}` : o.name, meta: '', html: sentenceFor(o, now - y) };
  });
  state.index = Math.max(0, state.items.findIndex(it => it.main));
  renderText(); renderThumbs(); sizeStage(); mount(false);
  ctaFor('Today');
  scrollTo(0, 0);
}
// the top button: Timeline on today's page, Today anywhere else (it then goes back to today)
function ctaFor(word) { $('ctaText').textContent = word; $('whenBtn').setAttribute('aria-label', word === 'Today' ? 'Back to today' : 'Open the timeline'); }
function exitPast() {
  if (!state.pastDate) return;
  state.pastDate = null;
  document.body.classList.remove('is-past');
  ctaFor('Timeline');
  renderDay();
}
function renderDay() { state.ang = 0; buildItems(); renderText(); renderThumbs(); sizeStage(); mount(false); }
/* ================= where is Yen now =================
   1. A check-in wins if it is less than 6 hours old. In the real site it comes from location.json,
      which an iPhone Shortcut updates when Yen arrives at or leaves a place (only a label, never coordinates).
   2. Otherwise the page reads Yen's usual day from the clock, and says "usually" so nobody takes it as fact. */
const CHECKIN = null; // e.g. { label: 'at a café in Daan', at: '2026-11-04T15:20:00+08:00' }
const WEEKDAY = [[0, 'asleep'], [7 * 60, 'on the way to the office'], [9 * 60, 'at the office'], [12 * 60, 'out for lunch near the office'],
  [13 * 60 + 30, 'at the office'], [18 * 60 + 30, 'on the way home'], [19 * 60 + 30, 'at home']];
const RESTDAY = [[0, 'asleep'], [9 * 60, 'having a slow morning at home'], [12 * 60, 'out somewhere in the city'], [19 * 60, 'at home']];
function whereNow() {
  const hm = `${pad(Math.floor(state.minute / 60))}:${pad(state.minute % 60)}`;
  if (CHECKIN && Date.now() - Date.parse(CHECKIN.at) < 6 * 3600e3) {
    const t = taipeiParts(Date.parse(CHECKIN.at));
    return `Yen is ${CHECKIN.label}, ${CITY.name}. Checked in at ${pad(t.h)}:${pad(t.min)}.`;
  }
  const rest = isRestDay(fromDayMs(state.day)).rest, plan = rest ? RESTDAY : WEEKDAY;
  let now = plan[0][1];
  for (const [from, label] of plan) if (state.minute >= from) now = label;
  return `It's ${hm} in ${CITY.name}${rest ? ' on a day off' : ''}. At this hour Yen is usually ${now}.`;
}
/* ================= terminal ================= */
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const logEl = $('log');
const lsRows = rows => `<div class="ls">${rows.map(r => `<a href="${r.url}" target="_blank" rel="noopener"><span class="d">${r.date}</span><span class="t">${esc(r.title)}</span></a>`).join('')}</div>`;
const line = (t, cls = '') => `<div class="out-line ${cls}">${esc(t)}</div>`;
const COMMANDS = {
  'whoami': () => line(`Yen Lai. ${BIO}`) + `<div class="out-line mono"><a href="https://github.com/laiyenju" target="_blank" rel="noopener">github</a> · <a href="https://www.linkedin.com/in/laiyenju/" target="_blank" rel="noopener">linkedin</a> · <a href="https://x.com/theYenLai" target="_blank" rel="noopener">x</a></div>`,
  'ls notes': () => lsRows(NOTES),
  'ls works': () => WORKS.length ? `<div class="works">${WORKS.map(w => `<button type="button" data-run="open works/${w.slug}"><span class="y">${w.year}</span><span class="t">${esc(w.title)}</span><span class="r">${esc(w.sub)}</span></button>`).join('')}</div>` : line('Nothing here yet.'),
  'ls': () => line('notes/   works/', 'mono'),
  'whereis yen': () => line(whereNow()),
  'timeline': () => { go2('#timeline'); return line('Opened the timeline.'); },
  'cd ~': () => { scrollTo({ top: 0, behavior: 'smooth' }); return ''; },
  'help': () => `<div class="out-line mono">${[
    ['whoami', 'about Yen'], ['ls notes', 'read the notes'], ['ls works', 'see the work'], ['whereis yen', 'where Yen is today'],
    ['timeline', 'every day kept so far'], ['cd ~', 'back to the top'], ['clear', 'clear the screen'],
  ].map(([c, d]) => `${c.padEnd(12, '\u00a0')}${d}`).join('<br>')}</div>`,
};
for (const w of WORKS) {
  COMMANDS['open works/' + w.slug] = () => { go2('#work-' + w.slug); return line(`Opened ${w.title}.`); };
  COMMANDS['cat works/' + w.slug] = () => `<div class="out-line"><b>${esc(w.title)}</b> <span class="soft">· ${esc(w.sub)}</span></div><dl class="case">
    <dt>year</dt><dd>${w.year}</dd><dt>role</dt><dd>${esc(w.role)}</dd><dt>problem</dt><dd>${esc(w.problem)}</dd>
    <dt>what Yen did</dt><dd>${esc(w.did)}</dd><dt>result</dt><dd>${esc(w.result)}</dd></dl>` + (w.url ? `<div class="out-line mono"><a href="${w.url}" target="_blank" rel="noopener">${w.urlLabel || 'open the portfolio'}</a></div>` : '');
}
const ALIASES = { 'ls notes/': 'ls notes', 'ls works/': 'ls works', 'whereis': 'whereis yen', 'cd': 'cd ~', 'cd ..': 'cd ~', 'notes': 'ls notes', 'works': 'ls works', 'about': 'whoami' };
// plain-language labels on the buttons; the terminal still shows the real command being typed
const CHIPS = [['About Yen', 'whoami'], ['Notes', 'ls notes'], ['Work', 'ls works'], ["Where's Yen", 'whereis yen'], ['Clear', 'clear']];
let typing = false;
function prompt(cmd) { return `<span class="prompt">yen@${CITY.short} ~ <i>$</i> <b>${esc(cmd)}</b></span>`; }
async function run(raw, typed) {
  const cmd = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!cmd || typing) return;
  const key = ALIASES[cmd] || cmd;
  // clear = close the terminal: empty it and go back to the top, where the page started
  if (key === 'clear') {
    logEl.innerHTML = ''; $('cmd').value = ''; $('cmd').blur();
    scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    return;
  }
  const block = document.createElement('div'); block.className = 'block';
  block.innerHTML = prompt(typed ? '' : raw.trim());
  logEl.append(block);
  if (typed && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    typing = true;
    const b = block.querySelector('b');
    for (const ch of raw) { b.textContent += ch; await new Promise(r => setTimeout(r, 32)); }
    typing = false;
  } else if (typed) block.querySelector('b').textContent = raw;
  const fn = COMMANDS[key];
  block.insertAdjacentHTML('beforeend', fn ? fn() : line(`Command not found: ${raw.trim()}. Try one of the buttons below.`, 'err'));
  if (key !== 'cd ~') $('cmdForm').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
logEl.addEventListener('click', ev => { const b = ev.target.closest('[data-run]'); if (b) run(b.dataset.run, true); });
// the buttons live in one bar fixed to the bottom of the screen, on every screen size.
// From the top of the page, a button first scrolls down to the terminal, then runs.
function toTerm(then) {
  const t = document.querySelector('.term');
  if (t.getBoundingClientRect().top < innerHeight * .5) then(); else { scrollTo({ top: t.offsetTop + 10, behavior: 'smooth' }); setTimeout(then, 450); }
}
$('cmdForm').addEventListener('submit', ev => { ev.preventDefault(); const v = $('cmd').value; $('cmd').value = ''; run(v, false); });
{
  const d = document.createElement('button'); d.type = 'button'; d.className = 'dollar'; d.textContent = '$'; d.title = 'Type a command';
  d.addEventListener('click', () => toTerm(() => $('cmd').focus()));
  $('cmdbar').append(d);
}
CHIPS.forEach(([label, c]) => {
  const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.title = c;
  b.addEventListener('click', () => c === 'clear' ? run(c, true) : toTerm(() => run(c, true)));
  $('cmdbar').append(b);
});
// when the bar is wider than the screen, fade its right edge so it reads as "swipe for more"
// one bar, two homes. Phones: always fixed to the bottom (inside the terminal, CSS does the rest).
// Wide screens: under today's words at the top; once the reader heads for the terminal it glides down
// into the terminal and sticks to its bottom, and glides back up on the way out.
let barReady = false;
function placeBar(q) {
  const bar = $('cmdbar'), up = bar.parentNode === $('barSlot');
  // a little slack either side of the switch point, so a slow scroll does not bounce it back and forth
  const home = innerWidth >= 900 && q < (up ? .45 : .35) ? $('barSlot') : $('cmdForm').parentNode;
  if (bar.parentNode === home) { barReady = true; return; }
  const a = bar.getBoundingClientRect();
  home.append(bar); barEdge();
  if (!barReady || matchMedia('(prefers-reduced-motion: reduce)').matches || innerWidth < 900) { barReady = true; return; }
  const b = bar.getBoundingClientRect();
  bar.style.transition = 'none';
  bar.style.transform = `translate(${a.left - b.left}px, ${a.top - b.top}px)`;
  bar.style.opacity = '.4';
  bar.getBoundingClientRect();
  bar.style.transition = 'transform .5s cubic-bezier(.2, .8, .2, 1), opacity .5s ease';
  bar.style.transform = ''; bar.style.opacity = '';
  setTimeout(() => { bar.style.transition = ''; }, 520);
}
function barEdge() { const c = $('cmdbar'); c.classList.toggle('more-right', c.scrollLeft + c.clientWidth < c.scrollWidth - 4); }
$('cmdbar').addEventListener('scroll', barEdge, { passive: true }); addEventListener('resize', barEdge); barEdge();
function renderLists() { logEl.innerHTML = ''; }

/* overlays: one work (#work-<slug>), the timeline (#timeline), one day (#day-YYYY-MM-DD) */
const reader = $('reader'), tl = $('tl');
const openOverlay = () => (!reader.hidden && reader) || (!tl.hidden && tl) || null;
function go2(hash) { if (location.hash !== hash) { try { history.pushState(null, '', hash); } catch (e) { location.hash = hash; return; } } route(); }
function showOverlay(el) {
  for (const o of [reader, tl]) o.hidden = o !== el;
  ctaFor(location.hash.startsWith('#work-') ? 'Timeline' : 'Today');
  el.scrollTop = 0; document.body.style.overflow = 'hidden'; updateMore();
}
function closeOverlays() {
  reader.hidden = true; tl.hidden = true; document.body.style.overflow = ''; ctaFor('Timeline');
  if (state.pastDate) exitPast(); else renderText();
  if (location.hash) { try { history.pushState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; } }
  updateMore();
}
function openWork(slug) {
  const w = WORKS.find(x => x.slug === slug);
  if (!w) return;
  $('readerBody').innerHTML = `
    <span class="prompt">yen@${CITY.short} ~ <i>$</i> <b>cat works/${esc(w.slug)}.md</b></span>
    <h1>${esc(w.title)}</h1>
    <p class="sub">${esc(w.sub)}</p>
    <p class="byline">${esc(w.year)} · ${esc(w.role)}</p>
    <h2>The problem</h2><p>${esc(w.problem)}</p>
    <h2>What Yen did</h2><p>${esc(w.did)}</p>
    <h2>The result</h2><p>${esc(w.result)}</p>
    ${w.url ? `<p class="out"><a href="${w.url}" target="_blank" rel="noopener">${esc(w.urlLabel || 'open the portfolio')} ↗</a></p>` : ''}
    <div class="nav-row"><button type="button" class="back" data-close>← cd ~</button></div>`;
  showOverlay(reader);
}
function snapshot(scene, opts, maxW, maxH) {
  const w = getWorld(scene, opts, 0); drawWorld(w, 1.3);
  const [sx, sy, sw, sh] = innerOf(w), k = Math.min(maxW / sw, maxH / sh);
  const c = document.createElement('canvas'); c.width = Math.round(sw * k); c.height = Math.round(sh * k);
  const g = c.getContext('2d'); g.imageSmoothingEnabled = k < 1; g.drawImage(w.view, sx, sy, sw, sh, 0, 0, c.width, c.height);
  return c;
}
const LONG_MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const LONG_DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const parseDay = d => { const [y, m, dd] = d.split('-').map(Number); return fromDayMs(dayMs(y, m, dd)); };
const todayISO = () => { const d = fromDayMs(state.day); return `${d.y}-${pad(d.m)}-${pad(d.d)}`; };
// the sentence without "N years ago": used in the timeline, where the date is already shown
function plainSentence(m) {
  const html = sentenceFor(m, 1).replace(/^A year ago, /, '');
  return html.charAt(0).toUpperCase() + html.slice(1);
}
function timelineEntries() {
  const today = state.items[state.items.length - 1];
  const past = MEMORIES.filter(m => m.date < todayISO() && checkMemory(m)).sort(byDate).reverse();
  return [{ date: todayISO(), id: todayISO(), today: true, scene: today.scene, opts: today.opts, name: today.name, html: escHtml(today.meta) }]
    .concat(past.map(m => ({ date: m.date, id: m.id, m, scene: m.scene, opts: {}, name: m.zh && !m.noZh ? `${m.name}\u00a0· ${m.zh}` : m.name, html: plainSentence(m) })));
}
/* ---------- timeline mode ----------
   Days go left (oldest) to right (today), like the homepage. Changing day: the building
   dissolves, the date at the top turns like a dial, and the next building is built from the ground up.
   Tapping the building opens that day's record. */
const TL = { list: [], idx: 0, busy: false };
function tlEntries() { return timelineEntries().slice().reverse(); }
function pureImage(x) {
  const w = getWorld(x.scene, Object.assign({}, x.opts, { pure: true, notes: [], shiba: false }), 0);
  drawWorld(w, 0);
  const c = document.createElement('canvas'); c.width = w.view.width; c.height = w.view.height; c.getContext('2d').drawImage(w.view, 0, 0);
  return c;
}
// header date as a dial: each digit is a strip 0–9 that slides to its number
function dialTo(iso, sub) {
  const el = $('date'), text = iso.replace(/-/g, '.');
  if (!el.querySelector('.dial') || el.querySelector('.dial').children.length !== text.length) {
    el.innerHTML = `<span class="dial">${[...text].map(ch => /\d/.test(ch)
      ? `<span class="dg"><span class="strip">${'0123456789'.split('').map(n => `<span>${n}</span>`).join('')}</span></span>` : `<span>${ch}</span>`).join('')}</span>`;
  }
  [...el.querySelector('.dial').children].forEach((c, k) => {
    const strip = c.querySelector('.strip');
    if (!strip) return;
    strip.style.transitionDelay = (k * 35) + 'ms';
    strip.style.transform = `translateY(${-(+text[k]) * 1.35}em)`;
  });
  const c = $('clock');
  if (c.textContent !== sub) {
    if (!c.textContent || c.textContent === 'Taipei —') c.textContent = sub;
    else { c.classList.add('swap'); clearTimeout(c._t); c._t = setTimeout(() => { c.textContent = sub; c.classList.remove('swap'); }, 220); }
  }
}
const BAYER8 = (() => { const b = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21]; return (x, y) => b[(y & 7) * 8 + (x & 7)] / 64; })();
// dissolve the current building with a dither pattern, from p0 to 1; stops if another change starts
function dissolve(cv, src, p0, ms, token) {
  return new Promise(res => {
    if (!src || ms === 0) { cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); res(); return; }
    const t0 = performance.now();
    const tick = now => {
      if (token !== TL.token) { res(); return; }
      const p = p0 + (1 - p0) * Math.min(1, (now - t0) / ms);
      paintDissolved(cv, src, p);
      p < 1 ? requestAnimationFrame(tick) : res();
    };
    requestAnimationFrame(tick);
  });
}
const baseData = new WeakMap();
function paintDissolved(cv, src, p) {
  let base = baseData.get(src);
  if (!base) { base = src.getContext('2d').getImageData(0, 0, src.width, src.height); baseData.set(src, base); }
  if (cv.width !== src.width || cv.height !== src.height) { cv.width = src.width; cv.height = src.height; }
  const img = new ImageData(new Uint8ClampedArray(base.data), src.width, src.height), d = img.data;
  if (p > 0) for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) if (BAYER8(x, y) < p) d[(y * src.width + x) * 4 + 3] = 0;
  cv.getContext('2d').putImageData(img, 0, 0);
}
// lay the building brick by brick, course by course from the ground up (running bond)
function buildUp(cv, img, ms, token) {
  return new Promise(res => {
    cv.width = img.width; cv.height = img.height;
    const g = cv.getContext('2d'), W = img.width, H = img.height, src = img.getContext('2d').getImageData(0, 0, W, H).data;
    if (!ms) { g.clearRect(0, 0, W, H); g.drawImage(img, 0, 0); res(); return; }
    const BW = 4, BH = 3, bricks = [];
    let rows = 0;
    for (let r = 0, y = H - BH; y > -BH; r++, y -= BH) {
      const off = r % 2 ? BW / 2 : 0;
      for (let x = -off; x < W; x += BW) {
        const x0 = Math.max(0, x), y0 = Math.max(0, y), x1 = Math.min(W, x + BW), y1 = Math.min(H, y + BH);
        let any = false;
        for (let yy = y0; yy < y1 && !any; yy++) for (let xx = x0; xx < x1; xx++) if (src[(yy * W + xx) * 4 + 3]) { any = true; break; }
        if (any) bricks.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0, r });
      }
      rows = r;
    }
    const used = [...new Set(bricks.map(b => b.r))].sort((a, b) => a - b), rank = new Map(used.map((r, k) => [r, k]));
    const span = ms * .82, drop = 150;
    for (const b of bricks) b.t = rank.get(b.r) / Math.max(1, used.length - 1) * span + Math.random() * ms * .1;
    bricks.sort((a, b) => a.t - b.t);
    const settled = document.createElement('canvas'); settled.width = W; settled.height = H;
    const sg = settled.getContext('2d');
    let done = 0;
    const t0 = performance.now();
    const tick = now => {
      if (token !== TL.token) { res(); return; }
      const t = now - t0;
      while (done < bricks.length && t - bricks[done].t >= drop) { const b = bricks[done++]; sg.drawImage(img, b.x, b.y, b.w, b.h, b.x, b.y, b.w, b.h); }
      g.clearRect(0, 0, W, H); g.drawImage(settled, 0, 0);
      for (let k = done; k < bricks.length && bricks[k].t <= t; k++) {
        const b = bricks[k], e = (t - b.t) / drop, fall = Math.round((1 - e) * (1 - e) * 6);
        g.globalAlpha = Math.min(1, e * 1.6);
        g.drawImage(img, b.x, b.y, b.w, b.h, b.x, b.y - fall, b.w, b.h);
      }
      g.globalAlpha = 1;
      done < bricks.length ? requestAnimationFrame(tick) : (g.clearRect(0, 0, W, H), g.drawImage(img, 0, 0), res());
    };
    requestAnimationFrame(tick);
  });
}
function fitTl(cv) {
  const st = $('tlStage'), f = Math.min(st.clientWidth / cv.width, st.clientHeight / cv.height, 3.2) * .86;
  cv.style.width = Math.round(cv.width * f) + 'px'; cv.style.height = Math.round(cv.height * f) + 'px';
}
/* The ruler under the timeline: one stop per building, evenly spaced (buildings on the same day sit closer),
   oldest on the left. No years on it: the date at the top already says when. Drag along it to scrub. */
function renderRuler() {
  const list = TL.list, at = [0];
  for (let k = 1; k < list.length; k++) at.push(at[k - 1] + (list[k].date === list[k - 1].date ? .5 : 1));
  const span = at[at.length - 1] || 1, pos = k => list.length < 2 ? 50 : at[k] / span * 100;
  let h = '';
  list.forEach((x, k) => { h += `<span class="dot" data-k="${k}" style="left:${pos(k)}%"></span>`; });
  h += `<span class="needle" id="needle"></span>`;
  $('rulerTrack').innerHTML = h;
  TL.pos = pos;
}
function markRuler() {
  $('rulerTrack').querySelectorAll('.dot').forEach(d => d.classList.toggle('on', +d.dataset.k === TL.idx));
  $('needle').style.left = TL.pos(TL.idx) + '%';
  const x = TL.list[TL.idx], t = $('rulerTrack');
  t.setAttribute('aria-valuenow', TL.idx + 1);
  t.setAttribute('aria-valuetext', x.today ? 'Today' : `${x.name}, ${x.date}`);
}
function placeLine(x) {
  if (x.today) return 'Taiwan';
  return (x.m.country || 'Japan') + (x.m.with ? ` · with ${listOf(x.m.with)}` : '');
}
const tlImages = new Map();
function tlImage(x) { const key = x.id + '|' + LIGHT.n.toFixed(2); if (!tlImages.has(key)) tlImages.set(key, pureImage(x)); return tlImages.get(key); }
// no lock: a new change interrupts the running one, so quick swipes feel continuous
async function showTlDay(k, first, fromP = 0, instant = false) {
  const next = cl(k, 0, TL.list.length - 1);
  if (next === TL.idx && !first) { settleBack(); return; }
  const token = ++TL.token, prev = TL.cur;
  TL.idx = next;
  const x = TL.list[TL.idx], d = parseDay(x.date), years = fromDayMs(state.day).y - d.y;
  const still = instant || matchMedia('(prefers-reduced-motion: reduce)').matches, cv = $('tlc');
  try { history.replaceState(null, '', '#day-' + x.id); } catch (e) {}
  markRuler();
  $('tlCap').classList.add('hide');
  dialTo(x.date, `${LONG_DAY[d.wd]} · ${years > 0 ? ago(years).toLowerCase() : 'today'}`);
  cv.classList.add('snapback'); cv.style.transform = '';
  const img = tlImage(x);
  // quick chained swipes shorten the animation instead of queueing it
  const quick = performance.now() - (TL.last || 0) < 500; TL.last = performance.now();
  await dissolve(cv, prev, fromP, first || still ? 0 : (quick ? 120 : 200) * (1 - fromP), token);
  if (token !== TL.token) return;
  TL.cur = img;
  cv.width = img.width; cv.height = img.height; fitTl(cv);
  $('tlName').textContent = x.today ? (x.scene === 'home' ? 'Home' : 'The office') : x.name;
  $('tlPlace').textContent = placeLine(x);
  $('tlCap').classList.remove('hide');
  await buildUp(cv, img, first || still ? 0 : (quick ? 520 : 900), token);
}
function settleBack() {
  const cv = $('tlc'); if (!cv || !TL.cur) return;
  cv.classList.add('snapback'); cv.style.transform = '';
  paintDissolved(cv, TL.cur, 0);
}
function openTl(date) {
  TL.list = tlEntries(); TL.idx = -1; TL.cur = null; TL.token = (TL.token || 0) + 1;
  const k = Math.max(0, TL.list.findIndex(x => x.id === date));
  $('tlBody').innerHTML = `<div class="tlm wrap">
      <div class="tl-stage" id="tlStage" role="button" tabindex="0" aria-label="This day's building. Tap to read the day. Swipe left or right for other days."><canvas id="tlc"></canvas></div>
      <div class="tl-cap hide" id="tlCap"><div class="n" id="tlName"></div><div class="s" id="tlPlace"></div></div>
    </div>
    <div class="ruler"><div class="stats" id="tlStats"></div><div class="ruler-track" id="rulerTrack" role="slider" tabindex="0" aria-label="Days kept, oldest on the left" aria-valuemin="1" aria-valuemax="${TL.list.length}"></div></div>`;
  const fly = TL.from && TL.from.id === TL.list[k].id && !matchMedia('(prefers-reduced-motion: reduce)').matches ? TL.from : null;
  TL.from = null;
  if (fly) tl.classList.add('clear');
  showOverlay(tl);
  ctaFor('Today');
  renderRuler();
  const pastOnly = TL.list.filter(x => !x.today);
  const nPlaces = new Set(pastOnly.map(x => x.m.name)).size, nCountries = new Set(pastOnly.map(x => x.m.country || 'Japan').concat(['Taiwan'])).size;
  $('tlStats').textContent = `${new Set(TL.list.map(x => x.date)).size} days kept · ${nPlaces} places · ${nCountries} countries`;
  showTlDay(k, true).then(() => {
    if (!fly) return;
    const cv = $('tlc'), tlRect = cv.getBoundingClientRect(), g = ghostOf(fly.img, rectLike(fly.img, cv, tlRect));
    const homeRectForTl = rectLike(cv, fly.img, fly.rect);
    disp.style.opacity = '0'; // the homepage copy would show through while the page fades in
    setTimeout(() => { disp.style.opacity = ''; }, MOVE + 60);
    requestAnimationFrame(() => tl.classList.remove('clear'));
    flyFrom(cv, homeRectForTl, MOVE);
    flyFrom(g, fly.rect, MOVE);
    g.style.transition += ', opacity .45s ease .1s'; g.style.opacity = '0';
    setTimeout(() => g.remove(), MOVE + 200);
  });
  // swipe: the building follows the finger and comes apart as it goes; let go to change day. tap: back to the homepage on that day
  const st = $('tlStage');
  let sw = null, raf = 0;
  st.addEventListener('pointerdown', ev => { sw = { x: ev.clientX, y: ev.clientY, id: ev.pointerId, moved: false, p: 0 }; });
  st.addEventListener('pointermove', ev => {
    if (!sw || ev.pointerId !== sw.id) return;
    const dx = ev.clientX - sw.x, dy = ev.clientY - sw.y;
    if (!sw.moved && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) { sw.moved = true; st.setPointerCapture(ev.pointerId); TL.token++; }
    if (!sw.moved || !TL.cur) return;
    const edge = (dx < 0 && TL.idx === TL.list.length - 1) || (dx > 0 && TL.idx === 0);
    sw.p = edge ? 0 : Math.min(.85, Math.abs(dx) / (st.clientWidth * .7));
    const cv = $('tlc');
    cv.classList.remove('snapback');
    cv.style.transform = `translateX(${dx * (edge ? .12 : .3)}px)`;
    cancelAnimationFrame(raf); raf = requestAnimationFrame(() => paintDissolved(cv, TL.cur, sw ? sw.p : 0));
  });
  const end = ev => {
    if (!sw || ev.pointerId !== sw.id) return;
    const dx = ev.clientX - sw.x, dy = ev.clientY - sw.y, p = sw.p;
    if (sw.moved && Math.abs(dx) > 40 && p > 0) showTlDay(TL.idx + (dx < 0 ? 1 : -1), false, p);
    else if (sw.moved) settleBack();
    else if (Math.hypot(dx, dy) < 10 && ev.type === 'pointerup') tapTl();
    sw = null;
  };
  st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end);
  st.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); tapTl(); } });
  const track = $('rulerTrack');
  // tap a stop to go there; drag along the ruler to scrub: the building changes at once under the finger
  const nearest = ev => {
    const r = track.getBoundingClientRect(), at = (ev.clientX - r.left) / r.width * 100;
    let best = 0, bd = 1e9;
    TL.list.forEach((x, k) => { const dd = Math.abs(TL.pos(k) - at); if (dd < bd) { bd = dd; best = k; } });
    return best;
  };
  let drag = null;
  track.addEventListener('pointerdown', ev => {
    ev.preventDefault();
    track.setPointerCapture(ev.pointerId);
    drag = { id: ev.pointerId, x: ev.clientX, moved: false };
    const k = nearest(ev); if (k !== TL.idx) showTlDay(k);
  });
  track.addEventListener('pointermove', ev => {
    if (!drag || ev.pointerId !== drag.id) return;
    if (!drag.moved && Math.abs(ev.clientX - drag.x) > 6) { drag.moved = true; track.classList.add('drag'); }
    if (!drag.moved) return;
    const k = nearest(ev); if (k !== TL.idx) showTlDay(k, false, 0, true);
  });
  const stop = ev => { if (!drag || ev.pointerId !== drag.id) return; drag = null; track.classList.remove('drag'); };
  track.addEventListener('pointerup', stop); track.addEventListener('pointercancel', stop);
  track.addEventListener('keydown', ev => {
    const d = { ArrowLeft: -1, ArrowRight: 1, Home: -TL.list.length, End: TL.list.length }[ev.key];
    if (d) { ev.preventDefault(); showTlDay(TL.idx + d); }
  });
}
// today → today's homepage; same month and day as today → today's homepage on that year's tab; otherwise → a homepage with that building as the main one
/* the building moves between the two pages instead of being rebuilt */
function flyFrom(el, from, ms) {
  const to = el.getBoundingClientRect();
  if (!from || !to.width) return;
  el.style.transformOrigin = '0 0'; el.style.transition = 'none';
  el.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
  el.getBoundingClientRect();
  el.style.transition = `transform ${ms}ms cubic-bezier(.2, .8, .2, 1)`; el.style.transform = '';
  setTimeout(() => { el.style.transition = ''; el.style.transformOrigin = ''; }, ms + 30);
}
// where image `src` would sit if drawn at the same pixel scale as `ref` (crops share the building's top and centre)
function rectLike(src, refEl, refRect) {
  const k = refRect.width / refEl.width, w = src.width * k, h = src.height * k;
  return { left: refRect.left + refRect.width / 2 - w / 2, top: refRect.top, width: w, height: h };
}
function ghostOf(src, rect) {
  const g = document.createElement('canvas'); g.className = 'ghost'; g.width = src.width; g.height = src.height;
  g.getContext('2d').drawImage(src, 0, 0);
  Object.assign(g.style, { left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px' });
  document.body.append(g);
  return g;
}
const MOVE = 480;
// leave the timeline: set up the homepage underneath, then move the building down into it
function leaveTl(setup, hash) {
  const cv = $('tlc'), from = cv && cv.getBoundingClientRect(), img = TL.cur;
  TL.token++;
  try { history.pushState(null, '', hash || (location.pathname + location.search)); } catch (e) {}
  setup();
  scrollTo(0, 0);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!img || !from || still) { tl.hidden = true; document.body.style.overflow = ''; renderText(); updateMore(); return; }
  const at = dispInner(), to = rectLike(img, at.img, at.rect), g = ghostOf(img, to);
  const fromRect = rectLike(img, cv, from);
  disp.style.opacity = '0';
  cv.style.visibility = 'hidden';
  tl.classList.add('clear');
  headerNow();
  flyFrom(g, fromRect, MOVE);
  setTimeout(() => {
    tl.hidden = true; tl.classList.remove('clear'); document.body.style.overflow = '';
    disp.style.transition = 'opacity .25s ease'; disp.style.opacity = '1';
    setTimeout(() => { g.remove(); disp.style.transition = ''; }, 260);
    updateMore();
  }, MOVE);
}
function headerNow() { const dd = fromDayMs(state.day); dialTo(todayISO(), `${LONG_DAY[dd.wd]} · ${CITY.name} ${pad(Math.floor(state.minute / 60))}:${pad(state.minute % 60)}`); }
function homeToday() { if (state.pastDate) { state.pastDate = null; document.body.classList.remove('is-past'); renderDay(); } ctaFor('Timeline'); }
function tapTl() {
  const x = TL.list[TL.idx];
  if (x.today) { leaveTl(() => { homeToday(); const k = state.items.length - 1; if (state.index !== k) { state.index = k; renderThumbs(); mount(false); } renderText(); }); return; }
  if (x.date.slice(5) === todayISO().slice(5)) {
    leaveTl(() => {
      homeToday();
      const k = state.items.findIndex(it => it.id === x.id);
      if (k >= 0 && k !== state.index) { state.index = k; renderThumbs(); mount(false); }
      renderText();
    });
    return;
  }
  leaveTl(() => renderPast(x.id), '#past-' + x.id);
}
function leaveToToday() { leaveTl(() => { homeToday(); renderText(); }); }
// the day's record: a whole page, reached only from the timeline
function openRecord(date) {
  const list = tlEntries(), x = list.find(e => e.date === date);
  if (!x) { go2('#timeline'); return; }
  const d = parseDay(date), years = fromDayMs(state.day).y - d.y;
  let body;
  if (x.today) { const it = state.items[state.items.length - 1]; body = `<p>${esc(it.note)}</p><p>${esc(whereNow())}</p>`; }
  else {
    const m = x.m, map = `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.map || m.name + ', ' + m.place)}" target="_blank" rel="noopener">${esc(m.place)}, ${esc(m.country || 'Japan')} ↗</a>`;
    body = `<p class="day-meta">${map}${m.with ? ' · with ' + esc(listOf(m.with)) : ''}</p>` + (m.story || [plainSentence(m)]).map(t => `<p>${esc(t)}</p>`).join('');
  }
  $('readerBody').innerHTML = `<span class="prompt">yen@${CITY.short} ~ <i>$</i> <b>cat days/${date}.md</b></span>
    <p class="byline">${LONG_DAY[d.wd]}, ${LONG_MON[d.m - 1]} ${d.d}, ${d.y} · ${years > 0 ? ago(years).toLowerCase() : 'today'}</p>
    <h1>${esc(x.today ? (x.scene === 'home' ? 'Home' : 'The office') : x.name)}</h1>
    <div class="day-model" id="dayModel"></div>${body}
    <div class="nav-row"><button type="button" class="back" data-hash="#day-${date}">← Timeline</button><button type="button" class="back" data-close>cd ~</button></div>`;
  $('dayModel').append(pureImage(x));
  const c = $('dayModel').firstChild, f = Math.min(560 / c.width, 380 / c.height, 3) * .9;
  c.style.width = Math.round(c.width * f) + 'px'; c.style.height = Math.round(c.height * f) + 'px';
  showOverlay(reader);
}
function route() {
  const h = location.hash;
  let m;
  if ((m = h.match(/^#work-(.+)$/))) openWork(m[1]);
  else if (h === '#timeline') { if (state.pastDate) { state.pastDate = null; document.body.classList.remove('is-past'); renderDay(); } if (tl.hidden) openTl(todayISO()); else showTlDay(TL.list.length - 1); }
  else if ((m = h.match(/^#day-(\d{4}-\d{2}-\d{2}(?:-\d+)?)$/))) { if (state.pastDate) { state.pastDate = null; document.body.classList.remove('is-past'); renderDay(); } if (tl.hidden) openTl(m[1]); }
  else if ((m = h.match(/^#past-(\d{4}-\d{2}-\d{2}(?:-\d+)?)$/))) { reader.hidden = true; tl.hidden = true; document.body.style.overflow = ''; renderPast(m[1]); updateMore(); }
  else {
    if (openOverlay()) { reader.hidden = true; tl.hidden = true; document.body.style.overflow = ''; ctaFor('Timeline'); }
    if (state.pastDate) exitPast(); else renderText();
    updateMore();
  }
}
addEventListener('hashchange', route);
addEventListener('popstate', route);
for (const o of [reader, tl]) {
  o.addEventListener('scroll', () => updateMore(), { passive: true });
  o.addEventListener('click', ev => {
    const c = ev.target.closest('[data-close]'), hsh = ev.target.closest('[data-hash]'), day = ev.target.closest('[data-day]');
    if (c) closeOverlays(); else if (hsh) go2(hsh.dataset.hash); else if (day) go2('#day-' + day.dataset.day);
  });
}
addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && !tl.hidden) leaveToToday(); else if (ev.key === 'Escape' && openOverlay()) closeOverlays();
  if (!tl.hidden && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) { ev.stopImmediatePropagation(); showTlDay(TL.idx + (ev.key === 'ArrowRight' ? 1 : -1)); }
}, true);

/* scroll: the building shrinks a little; a hint says when there is more below */
function updateMore() {
  const o = openOverlay(), el = o || document.documentElement;
  const top = o ? o.scrollTop : scrollY, view = o ? o.clientHeight : innerHeight;
  const more = top + view < el.scrollHeight - 24;
  // on the home page the bar sits at the bottom instead of the hint; overlays have their own bottom (ruler) and hide the bar
  $('more').classList.toggle('off', !more || !o);
  $('cmdbar').classList.toggle('off', !!o);
}
function onScroll() {
  const p = cl(scrollY / (STAGE.h * .9), 0, 1);
  document.documentElement.style.setProperty('--p', p.toFixed(3));
  // wide screens: the building slides to the middle, above the terminal; --dx is how far
  const st = $('stage'); let x = 0;
  for (let e = st; e; e = e.offsetParent) x += e.offsetLeft;
  // q: 0 at the top, 1 once the terminal's top is 70% down the screen
  const q = cl(scrollY / Math.max(1, document.querySelector('.term').offsetTop - innerHeight * .7), 0, 1);
  const dx = innerWidth >= 900 ? (innerWidth / 2 - (x + st.offsetWidth / 2)) * q : 0;
  document.documentElement.style.setProperty('--dx', dx.toFixed(1) + 'px');
  document.documentElement.style.setProperty('--q', q.toFixed(3));
  document.body.classList.toggle('words-off', q > .6);
  placeBar(q);
  updateMore();
}
addEventListener('scroll', onScroll, { passive: true });

/* the building: swipe left/right = other years (left = newer), tap = timeline */
let drag = null;
const spinning = false;
stage.addEventListener('pointerdown', ev => { drag = { x: ev.clientX, y: ev.clientY, id: ev.pointerId, mode: null }; });
stage.addEventListener('pointermove', ev => {
  if (!drag || ev.pointerId !== drag.id) return;
  const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
  if (!drag.mode && Math.hypot(dx, dy) > 8) {
    drag.mode = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    if (drag.mode === 'h') stage.setPointerCapture(ev.pointerId);
  }
  if (drag.mode === 'h') disp.style.transform = `translateX(${dx * .35}px) scale(${1 - Math.min(.25, Math.abs(dx) / 900)})`;
});
function endDrag(ev) {
  if (!drag || ev.pointerId !== drag.id) return;
  const dx = ev.clientX - drag.x;
  if (drag.mode === 'h') { disp.style.transform = ''; if (Math.abs(dx) > 50) go(state.index + (dx < 0 ? 1 : -1)); }
  if (!drag.mode && ev.type === 'pointerup') openTimeline();
  drag = null;
}
stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);
stage.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openTimeline(); } });
function openTimeline() {
  const it = state.items[state.index];
  const b = dispInner();
  TL.from = { rect: b.rect, img: b.img, id: it.id && !it.about ? it.id : todayISO() };
  go2('#day-' + TL.from.id);
}
let wheelT = 0;
addEventListener('wheel', ev => {
  if (Math.abs(ev.deltaX) > Math.abs(ev.deltaY) * 1.5 && Math.abs(ev.deltaX) > 18 && performance.now() - wheelT > 450) {
    wheelT = performance.now(); go(state.index + (ev.deltaX > 0 ? 1 : -1));
  }
}, { passive: true });
addEventListener('keydown', ev => {
  if (ev.target.closest('input')) return;
  if (ev.key === '/' ) { ev.preventDefault(); $('cmd').focus(); $('cmd').scrollIntoView({ block: 'center' }); return; }
  if (ev.key === 'ArrowRight') go(state.index + 1);
  if (ev.key === 'ArrowLeft') go(state.index - 1);
});
$('whenBtn').addEventListener('click', () => {
  if (!tl.hidden) leaveToToday();
  else if (!reader.hidden || state.pastDate) closeOverlays();
  else openTimeline();
});
function toast(text) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = text; document.body.append(t);
  setTimeout(() => t.remove(), 2200);
}

/* light: follows the sun over the city at the real time */
function minuteMs() { return state.day - CITY.tz * 3600e3 + state.minute * 60e3; }
function refreshLight(rebake) {
  const L = lightFor(minuteMs()), shadowChanged = L.sx !== LIGHT.sx || L.sy !== LIGHT.sy;
  LIGHT = L; applyTheme(L);
  if (!state.items.length) return;
  frames.clear();
  if (rebake && shadowChanged) { renderThumbs(); mount(false); } else { paintThumbs(); renderText(); }
}

/* /notes/ and /works/ send readers here with ?view=notes or ?view=works: open the terminal on that list */
function openView() {
  const v = new URLSearchParams(location.search).get('view');
  if (v !== 'notes' && v !== 'works') return;
  try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
  setTimeout(() => { scrollTo({ top: document.querySelector('.term').offsetTop - 80 }); run(v === 'notes' ? 'ls notes' : 'ls works', true); }, 300);
}

/* loop */
var t0 = performance.now();
const clockT = () => (performance.now() - t0) / 1000;
let lastFrame = 0;
function frame(now) {
  if (mainWorld && !spinning && !document.hidden && now - lastFrame > 33 && scrollY < innerHeight * 1.2) { lastFrame = now; drawWorld(mainWorld, clockT()); blit(mainWorld.view); }
  requestAnimationFrame(frame);
}
setInterval(() => {
  const r = taipeiParts(Date.now()), day = dayMs(r.y, r.m, r.d);
  state.minute = r.h * 60 + r.min;
  if (day !== state.day && tl.hidden && !state.pastDate) { state.day = day; refreshLight(true); renderDay(); } else refreshLight(true);
}, 60e3);
addEventListener('resize', () => { sizeStage(); if (mainWorld) fitCanvas(mainWorld); onScroll(); });

applyTheme(LIGHT);
refreshLight(false);
renderLists();
renderDay();
onScroll();
route();
openView();
requestAnimationFrame(frame);
