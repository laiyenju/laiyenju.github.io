/* The buildings: the sun's light, every model (SCENES), and drawing them (getWorld, drawWorld).
   Shared by the home page (assets/js/day.js) and the share cards (scripts/og/card.html).
   Needs assets/js/sky.js and assets/js/pixel-engine.js, loaded first. */
'use strict';
// rest days: weekends and these fixed-date public holidays are "home", other days "the office" (README 2.4).
// Only the fixed dates: on the homepage, check-ins cover the rest (lunar holidays, days off, make-up workdays).
const HOLIDAYS = { '01-01': "New Year's Day", '02-28': 'Peace Memorial Day', '04-04': "Children's Day", '05-01': 'Labor Day',
  '09-28': "Teachers' Day", '10-10': 'National Day', '10-25': 'Retrocession Day', '12-25': 'Constitution Day' };
/* ================= sun & light =================
   The sun and the page colour come from assets/js/sky.js (the notes use them too). */
const sunAt = ms => siteSky.sunAt(ms);
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
const bgFor = alt => siteSky.bgFor(alt);
const hex = c => siteSky.hex(c);
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
    alt, az: s.az, n, warm,
    kr: mix(1, .56, n) * (1 + .07 * warm), kg: mix(1, .6, n) * (1 + .01 * warm), kb: mix(1, .84, n) * (1 - .09 * warm),
    lit: cl((3 - alt) / 8, 0, 1),
    // after dark: the outline facing the sky turns light (the engine darkens it, which is lost on a dark sky),
    // and colours keep their saturation instead of greying as the light drops
    rim: cl((-2 - alt) / 6, 0, 1) * .5, sat: 1 + .3 * n,
    sx: Math.round(sx * 20) / 20, sy: Math.round(sy * 20) / 20,
    bg: bgFor(alt),
  };
}
// page and text colours for this sky, and the home page's sky behind the building (sky.js)
function applyTheme(L) { siteSky.paintHome(L.bg); if (siteSky.paintSky && L.az != null) siteSky.paintSky(L); }

/* ================= scenes ================= */
const C = {
  WHITE: [238, 236, 230], GLASS: [58, 72, 82], CURTAIN: [96, 116, 132], FIN: [214, 216, 214], CONC: [186, 184, 178], WOOD: [126, 90, 60], WOOD_L: [172, 130, 88],
  STONE: [170, 168, 160], PAVE: [204, 200, 192], CURB: [160, 158, 152],
  SAND: [226, 210, 172], WATER: [94, 148, 170], VERMIL: [204, 66, 40], INK: [44, 40, 40], BARKROOF: [120, 84, 64],
  POT: [176, 98, 64], GREEN: [86, 124, 70], DECK: [150, 112, 80],
  ALU: [196, 200, 204], ALU_D: [120, 126, 134], BASE: [168, 166, 160], PLASTER: [238, 234, 226], OAK: [196, 160, 118], OAK_L: [214, 184, 142],
  STEEL: [62, 64, 70], LAMP: [250, 226, 170], SCREEN: [96, 150, 190], CODE: [210, 236, 250], CABINET: [236, 234, 228], COUNTER: [70, 70, 74],
  RUG: [214, 194, 160], SOFA: [128, 146, 128], MUSTARD: [214, 164, 58], CORAL: [214, 104, 84], SAGE: [150, 170, 130], STEAM: [236, 236, 236],
  SHIBA: [212, 136, 70], CAT: [58, 56, 62], CREAM: [244, 234, 214], DEER: [164, 116, 74], NOSE: [40, 30, 28],
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
  Z: '111001010100111', o: '000111101101111', g: '111101111001111', l: '010010010010010', e: '111101111100111', ' ': '000000000000000',
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
/* Small things that move, on the home page only: flags in the wind, birds, ripples, plants, a blinking light.
   A scene hands them to e.moving(fn); the home page calls fn(e, t) on every frame (t in seconds, stepped at 8 fps).
   The timeline draws the building still, so there fn(e, null) runs once: the same thing, at rest. */
const POLE = [120, 122, 126];
// a cloth hanging from a pole at (x, y), top edge at z: ripples run from the pole to the free end
function cloth(e, x, y, z, len, ht, colorAt, t, phase = 0) {
  for (let u = 0; u <= len; u += .03) {
    const k = u / len, w = t == null ? 0 : t * 3.4 - k * 4.4 + phase;
    const dy = t == null ? 0 : Math.sin(w) * .1 * k, dz = t == null ? 0 : (Math.sin(w * .6 + 1) * .05 - .05 * k) * k;
    const s = t == null ? 0 : Math.cos(w); // the slope of the fold: the side turned to the light is brighter
    const level = s > .5 ? 4 : s > -.5 ? 3 : 2;
    for (let v = 0; v <= ht; v += .03) e.plot(x + u, y + dy, z - v + dz, e.rampOf(colorAt(k, v / ht))[level]);
  }
}
function flag(e, x, y, h, color, z0 = 0) {
  e.box(x - .03, y - .03, z0, x + .03, y + .03, z0 + h, POLE);
  e.moving((e, t) => cloth(e, x + .03, y, z0 + h - .05, .52, .38, () => color, t, x * 1.7 + y));
}
const US_RED = [186, 46, 44], US_WHITE = [240, 240, 236], US_BLUE = [44, 56, 110];
function usFlag(e, x, y, h, z0 = 0) {
  e.box(x - .03, y - .03, z0, x + .03, y + .03, z0 + h, POLE);
  e.moving((e, t) => cloth(e, x + .03, y, z0 + h - .05, .58, .4, (u, v) => u < .45 && v < .55 ? US_BLUE : Math.floor(v * 7) % 2 ? US_WHITE : US_RED, t, x * 1.3 + y * .7));
}
const KR_RED = [200, 48, 52], KR_BLUE = [32, 72, 150], KR_WHITE = [244, 244, 240];
function krFlag(e, x, y, h, z0 = 0) {
  e.box(x - .03, y - .03, z0, x + .03, y + .03, z0 + h, POLE);
  e.moving((e, t) => cloth(e, x + .03, y, z0 + h - .05, .56, .38, (u, v) => Math.hypot((u - .5) * .56, (v - .5) * .38) < .1 ? (v < .5 ? KR_RED : KR_BLUE) : KR_WHITE, t, x + y));
}
// a few birds circling the building, wings up and down; hidden while they pass behind it
const BIRD = [[[-2, -1], [-1, 0], [0, 0], [1, 0], [2, -1]], [[-2, 1], [-1, 0], [0, 0], [1, 0], [2, 1]]];
function birds(e, t, cx, cy, r, z, n = 3) {
  if (t == null) return;
  const ink = e.rgb(58, 56, 64);
  for (let k = 0; k < n; k++) {
    const a = t * .16 + k * .45, p = e.project(cx + Math.cos(a) * (r + k * .5), cy + Math.sin(a) * (r + k * .5), z + k * .5 + Math.sin(t * .6 + k) * .3);
    for (const [dx, dy] of BIRD[Math.floor(t * 4 + k * 3) % 2]) {
      const ix = Math.round(p.sx) + dx, iy = Math.round(p.sy) + dy;
      if (ix < 0 || iy < 0 || ix >= e.W || iy >= e.H) continue;
      const i = iy * e.W + ix;
      if (p.d <= e.zb[i]) continue;
      e.zb[i] = p.d; e.pix[i] = ink;
    }
  }
}
// rings spreading on water around a point at ground level
function ripples(e, t, x, y) {
  if (t == null) return;
  const c = e.rgb(176, 214, 230);
  for (let k = 0; k < 2; k++) {
    const f = (t * .35 + k * .5) % 1, r = .3 + f * 1.1;
    for (let a = 0; a < 6.283; a += .07) if (e.hash(Math.round(a * 30), k) > f * .8) e.plot(x + Math.cos(a) * r, y + Math.sin(a) * r * .9, .01, c);
  }
}
// an aircraft warning light on top of something tall: on, off, on
function beacon(e, t, x, y, z) {
  if (t == null || Math.floor(t * 1.25) % 2 === 0) e.sphere(x, y, z, .14, [236, 52, 40], 'gloss');
}

/* The home: a book wall (one coloured book per note) and glass that lets the room under it show through. */
const HOME_TREES = [[-2.9, 4.5], [3.5, -4.6]];
// the shiba's round at home: along the book wall, out the open side onto the sidewalk, back in past the table
const HOME_WALK = [[-.95, .9], [-.95, 2.4], [-.2, 2.9], [.4, 3.7], [2.6, 3.9], [3.3, 2.8], [3.3, -.5], [2.5, -1.0], [1.6, -1.0], [0, -.9], [-.6, .2]];
// a point at distance d along a closed path of [x, y] corners, and the way it faces there
function alongPath(pts, d) {
  const segs = pts.map((a, k) => { const b = pts[(k + 1) % pts.length]; return [a, b, Math.hypot(b[0] - a[0], b[1] - a[1])]; });
  let s = d % segs.reduce((n, g) => n + g[2], 0);
  for (const [a, b, len] of segs) {
    if (s > len) { s -= len; continue; }
    const f = s / len;
    return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, yaw: Math.atan2(b[1] - a[1], b[0] - a[0]) };
  }
  return { x: pts[0][0], y: pts[0][1], yaw: 0 };
}
const NOTE_BOOKS = [[214, 72, 52], [236, 176, 48], [44, 132, 140], [52, 84, 170], [126, 170, 84], [196, 96, 150]];
const PLAIN_BOOKS = [[150, 146, 138], [178, 172, 160], [124, 122, 118], [204, 198, 184], [140, 132, 120], [166, 160, 152]];
// shelves on the wall at x = x0 (front at x1), from y0 to y1 and z0 to z1. Grey books, plants, records and vases fill
// it from the start, so it never looks empty; each note turns one book into a coloured one, from the top left
// (top shelf first; on screen, left is +y).
function bookWall(e, notes, x0, x1, y0, y1, z0, z1) {
  const { box } = e, rows = 8, cols = Math.round((y1 - y0) / .72), rh = (z1 - z0) / rows, cw = (y1 - y0) / cols;
  for (let r = 0; r <= rows; r++) box(x0, y0, z0 + r * rh - .05, x1, y1, z0 + r * rh, C.OAK);
  for (let c = 0; c <= cols; c++) box(x0, y0 + c * cw - .025, z0, x1, y0 + c * cw + .025, z1, C.OAK);
  let j = 0;
  const plants = [];
  for (let r = rows - 1; r >= 0; r--) for (let c = cols - 1; c >= 0; c--) {
    const zb = z0 + r * rh, ya = y0 + c * cw + .04, yb = y0 + (c + 1) * cw - .04, ym = (ya + yb) / 2, h = e.hash(c * 7 + 1, r * 5 + 2);
    // a few cells (never the top-left one, where the coloured books start) hold something else
    if (r < rows - 1 && h < .24) {
      const kind = Math.floor(e.hash(c, r + 9) * 3) === 2 && r > 2 ? 0 : Math.floor(e.hash(c, r + 9) * 3);
      if (kind === 0) {
        box(x0 + .1, ym - .12, zb, x1 - .08, ym + .12, zb + .2, C.POT);
        plants.push([(x0 + x1) / 2, ym, zb + .32]);
      } else if (kind === 1) {
        for (let k = 0; k < 3; k++) box(x0 + .04, ym - .2 + k * .03, zb, x1 - .06, ym - .17 + k * .03, zb + .4, [C.INK, C.CORAL, C.CREAM][k]);
      } else {
        e.capsule([(x0 + x1) / 2, ym, zb + .02], [(x0 + x1) / 2, ym, zb + .26], .1, .06, () => [222, 214, 196]);
      }
      continue;
    }
    for (let y = yb, k = 0; ; k++) {
      const w = .07 + e.hash(c * 31 + k, r) * .05;
      if (y - w < ya) break;
      const note = j < notes.length, ht = note ? rh * .84 : rh * (.58 + e.hash(k, c * 3 + r) * .22);
      box(x0 + .04, y - w, zb, x1 - .03 - (note ? 0 : .02), y - .008, zb + ht, note ? NOTE_BOOKS[j % NOTE_BOOKS.length] : PLAIN_BOOKS[Math.floor(e.hash(k * 3, c + r * 11) * PLAIN_BOOKS.length)]);
      if (note) j++;
      y -= w;
    }
  }
  // the plants on the shelves trail and sway a little
  e.moving((e, t) => plants.forEach(([x, y, z], k) => {
    const sw = t == null ? 0 : Math.sin(t * 1.5 + k * 1.9) * .04;
    e.sphere(x, y + sw, z, .17, C.GREEN, 'rough');
    e.sphere(x + .06, y - sw, z - .2, .1, C.GREEN, 'rough');
  }));
}
// a flat pane of glass at height z: it does not hide what is under it, it tints it, with a few bright streaks
function glassPane(e, x0, y0, x1, y1, z) {
  const seen = new Uint8Array(e.W * e.H), G = [168, 200, 214], HI = [240, 246, 248];
  for (let a = x0; a <= x1; a += .03) for (let b = y0; b <= y1; b += .03) {
    const p = e.project(a, b, z), ix = p.sx | 0, iy = p.sy | 0;
    if (ix < 0 || iy < 0 || ix >= e.W || iy >= e.H) continue;
    const i = iy * e.W + ix, c = e.pix[i];
    if (seen[i] || p.d <= e.zb[i] || !(c >>> 24)) continue;
    seen[i] = 1;
    const streak = (((a + b) % 1.6) + 1.6) % 1.6 < .16, k = streak ? .62 : .42, to = streak ? HI : G;
    e.pix[i] = e.rgb(mix(c & 255, to[0], k), mix(c >> 8 & 255, to[1], k), mix(c >> 16 & 255, to[2], k));
  }
}
function pacer(e, t, x0, x1, speed) {
  const L = x1 - x0, s = (e.STILL ? L * .4 : t * speed) % (2 * L), fwd = s < L;
  return { x: x0 + (fwd ? s : 2 * L - s), yaw: fwd ? 0 : Math.PI };
}
function shiba(e, x, y, yaw, t, z0 = 0) {
  const fx = Math.cos(yaw), fy = Math.sin(yaw);
  const P = (a, b, c) => [x + fx * a - fy * b, y + fy * a + fx * b, c + z0];
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
// a black-and-white cat sitting at (x, y) on a surface at height z, facing yaw; its tail sweeps and its head turns now and then
function cat(e, x, y, z, yaw, t, k = 1.3) {
  const fx = Math.cos(yaw), fy = Math.sin(yaw);
  const P = (a, b, c) => [x + (fx * a - fy * b) * k, y + (fy * a + fx * b) * k, z + c * k];
  const add = (a, b, r0, r1, col) => e.dynamicAdd(a, b, r0 * k, r1 * k, () => col);
  const sw = e.STILL ? 0 : Math.sin(t * 2.2), look = e.STILL ? 0 : (Math.floor(t / 3) % 3 === 1 ? .06 : 0);
  add(P(-.1, 0, .12), P(-.1, 0, .12), .2, .2, C.CAT);
  add(P(-.04, 0, .2), P(.03, 0, .4), .15, .12, C.CAT);
  add(P(.08, 0, .16), P(.09, 0, .34), .08, .07, C.CREAM);
  add(P(.12, look, .55), P(.12, look, .55), .13, .13, C.CAT);
  add(P(.12, look + .07, .64), P(.12, look + .08, .74), .04, .02, C.CAT);
  add(P(.12, look - .07, .64), P(.12, look - .08, .74), .04, .02, C.CAT);
  add(P(.22, look, .5), P(.22, look, .5), .05, .05, C.CREAM);
  add(P(.25, look, .53), P(.25, look, .53), .025, .025, C.CORAL);
  add(P(-.26, 0, .04), P(-.2, .18 + sw * .14, .05 + Math.abs(sw) * .06), .05, .04, C.CAT);
}
// the same cat walking: body level, legs stepping, tail up
function catWalking(e, x, y, z, yaw, t, k = 1.3) {
  const fx = Math.cos(yaw), fy = Math.sin(yaw);
  const P = (a, b, c) => [x + (fx * a - fy * b) * k, y + (fy * a + fx * b) * k, z + c * k];
  const add = (a, b, r0, r1, col) => e.dynamicAdd(a, b, r0 * k, r1 * k, () => col);
  const st = Math.sin(t * 8) * .07;
  for (const [a, b, s] of [[.14, .07, 1], [.14, -.07, -1], [-.14, .07, -1], [-.14, -.07, 1]]) add(P(a, b, .22), P(a + st * s, b, .03), .04, .035, C.CAT);
  add(P(-.18, 0, .3), P(.16, 0, .32), .12, .12, C.CAT);
  add(P(.08, 0, .24), P(.14, 0, .26), .07, .07, C.CREAM);
  add(P(.3, 0, .42), P(.3, 0, .42), .12, .12, C.CAT);
  add(P(.3, .07, .5), P(.31, .08, .6), .04, .02, C.CAT);
  add(P(.3, -.07, .5), P(.31, -.08, .6), .04, .02, C.CAT);
  add(P(.39, 0, .38), P(.39, 0, .38), .05, .05, C.CREAM);
  add(P(-.3, 0, .34), P(-.38, Math.sin(t * 3) * .05, .62), .04, .03, C.CAT);
}
// now and then the cat gets up, walks along the back of the sofa, and sits down again at the other end
function catOnSofa(e, t, x, ya, yb, z) {
  if (e.STILL) return cat(e, x, ya, z, Math.PI / 2, 0);
  const c = t % 24, walk = (from, to, f) => catWalking(e, x, from + (to - from) * f, z, to > from ? Math.PI / 2 : -Math.PI / 2, t);
  if (c < 10) cat(e, x, ya, z, Math.PI / 2, t);
  else if (c < 13) walk(ya, yb, (c - 10) / 3);
  else if (c < 20) cat(e, x, yb, z, Math.PI / 2, t);
  else if (c < 23) walk(yb, ya, (c - 20) / 3);
  else cat(e, x, ya, z, Math.PI / 2, t);
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
        e.moving((e, t) => e.sphere(x + (t == null ? 0 : Math.sin(t * 1.7 + x) * .1), y, PZ + .95, .5, C.GREEN, 'rough'));
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
      e.moving((e, t) => beacon(e, t, 0, -1.6, TOP + .35));
      boxShadow(e, TX0, TY0, TX1, TY1, TOP);
      boxShadow(e, PX0, PY0, PX1, PY1, PZ);
    },
    animate(e, t, o) {
      if (o.shiba) shibaLoop(e, t, 1.2, 4.6, 2.2, .5);
    },
  },
  // Home: a two-storey aluminium box, cut open on the two sides the page looks from (+x, +y), so the rooms show.
  // Inside: a book wall the full height of the double-height room (one coloured book per note), a loft with a
  // reading corner, a long table that is both desk and dining table, the kitchen, a sofa. A glass skylight over
  // the tall room. Outside: a paved Minsheng-style sidewalk with street trees. A shiba and a cat live here.
  home: {
    S: 14, origin: 30, cx: .4, cy: -.2, R: 6, zmax: 5.2,
    ground(e, x, y, ix, iy, i) {
      if (edgeOf(e, x - .2, y + .2, 5.4, 5.8, ix, iy) == null) return 0;
      for (const [tx, ty] of HOME_TREES) {
        const d = Math.max(Math.abs(x - tx), Math.abs(y - ty));
        if (d < .62) return d > .54 ? surface(e, C.CURB, x, y, ix, iy, .3) : grassAt(e, x, y, ix, iy, i);
      }
      // a planted strip behind the house, sidewalk pavers everywhere else
      if (x < -2.7 || y < -4.3) return grassAt(e, x, y, ix, iy, i);
      const gx = ((x % .6) + .6) % .6, gy = ((y % .6) + .6) % .6;
      if (gx < .04 || gy < .04) return closeTones(e, C.PAVE)[0];
      return surface(e, C.PAVE, Math.floor(x / .6) * 3.1, Math.floor(y / .6) * 2.3, ix, iy, .5);
    },
    build(e, api, o) {
      const { box } = e;
      const X0 = -2.0, X1 = 2.0, Y0 = -3.6, Y1 = 3.2, IX = -1.85, IY = -3.45, TOP = 4.75, LY = -.6, F = .34, LF = 2.7;
      const SH = -1.49; // the front of the book wall
      // the box: a concrete base, two aluminium walls at the back, the roof over the loft, a frame round the skylight
      box(X0 - .12, Y0 - .12, 0, X1 + .12, Y1 + .12, .3, C.BASE, 1);
      box(X0, Y0, .3, IX - .02, Y1, TOP, C.ALU, 2);
      box(X0, Y0, .3, X1, IY - .02, TOP, C.ALU, 3);
      box(X0 - .06, Y0 - .06, TOP, X1 + .06, LY, TOP + .28, C.ALU, 4);
      box(X0 - .06, LY, TOP, X0 + .2, Y1 + .06, TOP + .28, C.ALU);
      box(X1 - .2, LY, TOP, X1 + .06, Y1 + .06, TOP + .28, C.ALU);
      box(X0 - .06, Y1 - .2, TOP, X1 + .06, Y1 + .06, TOP + .28, C.ALU);
      box(X1 - .16, Y1 - .16, F, X1, Y1, TOP, C.ALU);
      box(X1 - .12, LY - .12, F, X1, LY, LF, C.ALU);
      api.emissive(() => box(X1, Y1 - .12, 1.4, X1 + .03, Y1 - .04, 2.3, C.LAMP));
      // the rooms, lit from inside at night: wall lining, floors, the book wall, furniture
      api.emissive(() => {
        box(IX - .02, Y0 + .1, F, IX, Y1, TOP, C.PLASTER);
        box(X0 + .1, IY - .02, F, X1, IY, TOP, C.PLASTER);
        box(IX, IY, .3, X1 - .02, Y1 - .02, F, C.OAK, 5);
        // the loft: its slab shows as an aluminium band, oak on top, a thin steel rail
        box(SH, IY, LF - .25, X1, LY, LF, C.ALU);
        box(SH, IY, LF, X1 - .02, LY, LF + .03, C.OAK, 6);
        for (let x = SH + .3; x < X1; x += .5) box(x, LY - .04, LF, x + .03, LY, LF + .85, C.STEEL);
        box(SH, LY - .05, LF + .85, X1, LY, LF + .89, C.STEEL);
        for (let y = IY + .2; y < LY; y += .5) box(X1 - .04, y, LF, X1, y + .03, LF + .85, C.STEEL);
        box(X1 - .05, IY, LF + .85, X1, LY, LF + .89, C.STEEL);
        bookWall(e, o.notes || [], IX, SH, IY + .05, Y1 - .05, F, TOP);
        // a library ladder up to the loft
        for (let k = 0; k <= 8; k++) {
          const f = k / 8, y = .3 - f * .85, z = F + f * (LF + .2 - F);
          box(SH + .05, y - .04, z, SH + .45, y, z + .04, C.STEEL);
        }
        for (const x of [SH + .05, SH + .41]) for (let f = 0; f < 1; f += .02) box(x, .3 - f * .85 - .03, F + f * (LF + .2 - F), x + .04, .3 - f * .85, F + f * (LF + .2 - F) + .06, C.STEEL);
        // kitchen along the back wall, under the loft: white counter, dark top, a pot on the hob, jars on a shelf
        box(-1.3, IY, F, X1 - .1, IY + .6, 1.2, C.CABINET, 7);
        box(-1.32, IY, 1.2, X1 - .08, IY + .64, 1.26, C.COUNTER);
        box(.6, IY + .1, 1.26, 1.2, IY + .5, 1.28, C.INK);
        e.capsule([.9, IY + .3, 1.3], [.9, IY + .3, 1.46], .17, .17, () => C.STEEL);
        box(-1.2, IY, 1.9, 1.8, IY + .3, 1.95, C.OAK);
        for (let x = -1.1; x < 1.7; x += .32) e.capsule([x, IY + .15, 1.97], [x, IY + .15, 2.1], .07 + e.hash(x * 9, 3) * .03, .06, () => [[200, 120, 70], [120, 150, 110], [230, 226, 214]][Math.floor(e.hash(x * 7, 1) * 3)]);
        // the long table: desk by day, dining table at night. Steel legs, oak top, two chairs, a laptop
        for (const [x, y] of [[-.9, -2.45], [1.25, -2.45], [-.9, -1.75], [1.25, -1.75]]) box(x, y, F, x + .05, y + .05, 1.0, C.STEEL);
        box(-.95, -2.5, 1.0, 1.35, -1.68, 1.06, C.OAK_L, 8);
        for (const x of [-.4, .6]) {
          box(x - .18, -1.45, F, x + .18, -1.12, .78, C.STEEL);
          box(x - .2, -1.48, .78, x + .2, -1.1, .84, C.OAK);
          box(x - .2, -1.12, .84, x + .2, -1.08, 1.3, C.OAK);
        }
        box(-.1, -2.3, 1.06, .34, -2.02, 1.08, C.ALU_D);
        box(.9, -2.2, 1.06, 1.05, -2.05, 1.18, C.PLASTER);
        e.capsule([-.6, -2.1, 1.08], [-.6, -2.1, 1.14], .09, .09, () => C.CREAM);
        // the living room: rug, a sofa facing the book wall, a low table, a floor lamp, a big plant in the corner
        box(-1.2, .1, F, 1.4, 2.8, F + .02, C.RUG, 9);
        box(.55, .3, F, 1.45, 2.5, .78, C.SOFA, 10);
        box(1.15, .3, .78, 1.45, 2.5, 1.32, C.SOFA, 11);
        box(.55, .3, .78, 1.45, .52, 1.02, C.SOFA); box(.55, 2.28, .78, 1.45, 2.5, 1.02, C.SOFA);
        e.capsule([.95, .9, .95], [.95, 1.0, 1.1], .17, .15, () => C.MUSTARD);
        box(-.6, .95, F, .15, 1.85, .66, C.OAK_L);
        box(-.4, 1.2, .66, -.05, 1.45, .7, C.CORAL);
        box(1.55, -.15, F, 1.65, -.05, 2.1, C.STEEL);
        box(1.0, 2.75, F, 1.4, 3.1, .85, C.POT);
        // the loft: a reading corner with a beanbag, a stack of books and a floor lamp
        box(-1.2, -3.0, LF + .03, 1.2, -1.2, LF + .05, C.RUG);
        box(1.45, -3.3, LF + .03, 1.55, -3.2, LF + 1.5, C.STEEL);
        box(-.7, -1.8, LF + .03, -.3, -1.45, LF + .35, C.OAK_L);
        for (let k = 0; k < 3; k++) box(-.65, -1.75, LF + .35 + k * .07, -.32 + k * .03, -1.5, LF + .42 + k * .07, [C.CORAL, C.SAGE, C.CREAM][k]);
        e.sphere(.4, -2.1, LF + .38, .44, C.MUSTARD, 'rough');
        box(1.1, -1.1, LF + .03, 1.45, -.75, LF + .45, C.POT);
      }, 'flood');
      // the lights: pendants over the table, the floor lamps, the laptop screen
      api.emissive(() => {
        for (const x of [-.25, .75]) {
          box(x - .01, -2.1, 1.85, x + .01, -2.08, LF - .25, C.INK);
          box(x - .16, -2.25, 1.72, x + .16, -1.93, 1.86, C.LAMP);
        }
        box(1.4, -.3, 2.1, 1.75, .05, 2.4, C.LAMP);
        box(1.32, -3.4, LF + 1.5, 1.66, -3.08, LF + 1.8, C.LAMP);
        box(-.1, -2.32, 1.08, .34, -2.29, 1.38, C.SCREEN);
      });
      // the skylight over the tall room: steel glazing bars, then glass that tints what is under it
      for (let y = LY + .9; y < Y1 - .3; y += .9) box(X0 + .2, y, TOP + .2, X1 - .2, y + .05, TOP + .26, C.ALU_D);
      glassPane(e, X0 + .2, LY, X1 - .2, Y1 - .2, TOP + .24);
      // things that move: steam from the pot, the laptop screen, the plants, the street trees
      e.moving((e, t) => {
        if (t == null) return;
        for (let k = 0; k < 3; k++) {
          const f = (t * .5 + k / 3) % 1;
          e.sphere(.9 + Math.sin(t * 2 + k) * .08, IY + .3 + f * .2, 1.6 + f * .8, .08 + f * .08, C.STEAM);
        }
      });
      e.moving((e, t) => {
        const s = t == null ? 0 : Math.floor(t * 2);
        for (let r = 0; r < 4; r++) {
          const w = .1 + e.hash(r, s) * .22;
          box(-.04, -2.285, 1.3 - r * .06, -.04 + w, -2.28, 1.32 - r * .06, C.CODE);
        }
      });
      e.moving((e, t) => {
        const sw = t == null ? 0 : Math.sin(t * 1.3) * .05;
        e.sphere(1.2 + sw, 2.92, 1.25, .38, C.GREEN, 'rough');
        e.sphere(1.15 - sw, 2.85, 1.7, .3, C.GREEN, 'rough');
        e.sphere(1.28 + sw * .6, -.92, LF + .75, .3, C.GREEN, 'rough');
      });
      // light sliding over the skylight glass, and birds over the roof
      e.moving((e, t) => {
        if (t == null) return;
        const c = e.rgb(244, 248, 250), mid = X0 + (t * .3 % 1) * 7 - 1.5;
        for (let a = X0 + .25; a < X1 - .2; a += .04) for (let b = LY + .05; b < Y1 - .2; b += .04) {
          const d = a + b * .5 - mid;
          if (d > 0 && d < .25 && e.hash(Math.round(a * 50), Math.round(b * 50)) < .5) e.plot(a, b, TOP + .25, c);
        }
      });
      e.moving((e, t) => birds(e, t, 0, -.2, 4.2, 7.2));
      for (const [x, y] of HOME_TREES) e.growTree(x, y, .8, 300, Math.round(x * 13 + y));
      // shade from what is solid: the two back walls and the roof (the open sides let the sun in)
      boxShadow(e, X0, Y0, X0 + .2, Y1, TOP);
      boxShadow(e, X0, Y0, X1, Y0 + .2, TOP);
      for (let x = X0; x <= X1; x += .4) for (let y = Y0; y <= Y1; y += .4) e.castShadow(x, y, TOP + .2, .32);
    },
    animate(e, t) {
      // the shiba lives here: a round from the book wall, out onto the sidewalk and back in past the table.
      // The cat sits on the back of the sofa and now and then walks along it.
      const p = alongPath(HOME_WALK, e.STILL ? 3 : t * .55);
      const inside = p.x < 2.05 && p.y < 3.25;
      shiba(e, p.x, p.y, p.yaw, t, inside ? .34 : 0);
      catOnSofa(e, t, 1.3, 1.9, .8, 1.32);
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
      // a paper lantern hanging between each pair of posts
      for (let x = -4.4; x < 2.6; x += 1.1) api.emissive(() => box(x + .14, -2.8, 1.2, x + .38, -2.62, 1.55, [244, 230, 196]));
      for (let k = 0; k < 6; k++) {
        const hw = 1.75 - k * .32;
        if (hw < .15) break;
        box(-5.4, -3.95 - hw, 2.0 + k * .2, 3.2, -3.95 + hw, 2.0 + (k + 1) * .2, C.BARKROOF, 20 + k);
      }
      boxShadow(e, -5.4, -5.7, 3.2, -2.2, 2.2);
      const Y = 1.8;
      api.emissive(() => {
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
      }, 'flood');
      for (const px of [-.6, 3.0]) e.moving((e, t) => ripples(e, t, px, Y));
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
      api.emissive(() => {
        for (let x = -4.7; x < .7; x += .6) for (const z of [.45, 1.05, 1.65, 2.25]) e.plot(x, -.78, z, holes);
        for (let y = -4.3; y < -.9; y += .6) for (const z of [.45, 1.05, 1.65, 2.25]) e.plot(1.42, y, z, holes);
        for (let x = 1.9; x < 4.7; x += .6) for (const z of [.5, 1.2, 1.9, 2.6]) if (Math.abs(x - 3.13) > .3) e.plot(x, -1.38, z, holes);
        for (let y = -4.1; y < -1.5; y += .6) for (const z of [.5, 1.2, 1.9, 2.6]) e.plot(4.82, y, z, holes);
      });
      e.moving((e, t) => birds(e, t, 0, -2.4, 4.6, 4.6));
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
      api.emissive(() => box(-4.4, -.2, 0, 4.4, 1.6, 4.5, ST, 3), 'flood');
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
      api.emissive(() => box(-4.6, -2.2, 0, 4.6, 1, 3.0, W, 1), 'flood');
      box(-4.7, -2.3, 3.0, 4.7, 1.1, 3.22, W);
      for (let x = -4.5; x < 4.6; x += .45) box(x, .96, 3.22, x + .16, 1.1, 3.5, W);
      box(-4.7, .94, 3.5, 4.7, 1.1, 3.58, W);
      for (let x = -4.2; x < 4.2; x += 1) {
        if (Math.abs(x + .22) < 1.9) continue;
        for (const z of [.55, 1.85]) api.emissive(() => box(x, 1, z, x + .44, 1.06, z + .8, G));
      }
      box(-1.9, 1, 0, 1.9, 2.9, .3, [222, 222, 216]);
      api.emissive(() => { for (const x of [-1.55, -.55, .55, 1.55]) box(x - .13, 2.45, .3, x + .13, 2.71, 2.85, W); }, 'flood');
      box(-1.85, 1, 2.85, 1.85, 2.8, 3.1, W);
      for (let k = 0; k < 4; k++) box(-1.85 + k * .44, 1, 3.1 + k * .16, 1.85 - k * .44, 2.8, 3.1 + (k + 1) * .16, W);
      api.emissive(() => box(-.32, 1, .3, .32, 1.06, 1.7, G));
      for (const x of [-3.2, 3.0]) box(x, -1.4, 3.22, x + .4, -1.0, 3.9, W);
      usFlag(e, 0, -.66, 1.68, 3.22);
      // the fountain on the North Lawn
      box(-1.0, 4.0, 0, 1.0, 5.6, .25, [200, 198, 190]);
      box(-.8, 4.2, .2, .8, 5.4, .27, [120, 168, 196]);
      e.capsule([0, 4.8, .25], [0, 4.8, 1.3], .14, .05, () => [226, 238, 244]);
      e.moving((e, t) => {
        if (t == null) return;
        const c = e.rgb(232, 242, 248);
        for (let k = 0; k < 10; k++) { const f = (t * .9 + k / 10) % 1, a = k * 2.4; e.plot(Math.cos(a) * f * .7, 4.8 + Math.sin(a) * f * .6, 1.3 + f * .5 - f * f * 1.6, c); }
      });
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
      for (const x of [-3.6, -2.8]) krFlag(e, x, 3.2, 2.4);
      flag(e, -2.0, 3.2, 2.4, [28, 40, 92]);
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
      krFlag(e, 3.2, 1.2, 1.3, 8.9);
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
      e.moving((e, t) => birds(e, t, 0, 0, 5.2, 8.6));
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
      api.emissive(() => {
        e.capsule([0, 0, 2.85], [0, 0, 4.6], 1.75, 1.75, () => W);
        for (let a = 0; a < 6.283; a += .42) box(Math.cos(a) * 1.78 - .06, Math.sin(a) * 1.78 - .06, 3.0, Math.cos(a) * 1.78 + .06, Math.sin(a) * 1.78 + .06, 4.4, [210, 208, 200]);
        e.sphere(0, 0, 4.8, 1.6, W);
        e.capsule([0, 0, 6.2], [0, 0, 6.9], .32, .26, () => W);
      }, 'flood');
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
      api.emissive(() => {
        for (let k = 0; k < 18; k++) {
          const h = .82 - k * .012;
          box(-h, -h, k, h, h, k + 1, k % 2 ? ST : SD, k);
        }
        for (let k = 0; k < 4; k++) { const h = .6 - k * .15; box(-h, -h, 18 + k * .35, h, h, 18 + (k + 1) * .35, ST); }
      }, 'flood');
      api.emissive(() => { for (const x of [-.2, .1]) { box(x, .62, 16.8, x + .12, .66, 17.2, [70, 64, 58]); box(.62, -x - .12, 16.8, .66, -x, 17.2, [70, 64, 58]); } });
      e.moving((e, t) => beacon(e, t, 0, 0, 19.55));
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
    build(e, api) {
      const { box } = e, STEEL = [74, 84, 80], PAVE = [192, 190, 182], WOOD = [168, 128, 88];
      for (const x of [-4.6, -1.6, 1.4, 4.4]) for (const y of [-.8, .8]) box(x - .14, y - .14, 0, x + .14, y + .14, 2.2, STEEL);
      box(-5.4, -1.2, 2.2, 5.4, 1.2, 2.7, STEEL, 1);
      box(-5.3, -1.1, 2.7, 5.3, 1.1, 2.8, PAVE, 2);
      for (let x = -5.2; x < 5.2; x += .5) box(x, -1.15, 2.8, x + .06, -1.1, 3.3, STEEL);
      box(-5.3, -1.18, 3.24, 5.3, -1.1, 3.3, STEEL);
      for (const x of [-3.6, -.6, 2.4, 5.0]) {
        box(x - .03, .98, 2.8, x + .03, 1.04, 3.9, STEEL);
        api.emissive(() => box(x - .1, .9, 3.9, x + .1, 1.1, 4.0, [244, 230, 196]));
      }
      box(-5.2, .3, 2.8, -1.4, 1.05, 3.05, [120, 86, 62]);
      e.moving((e, t) => {
        const sway = k => t == null ? 0 : Math.sin(t * 1.9 + k * .8) * .07;
        for (let k = 0; k < 9; k++) e.sphere(-4.9 + k * .45 + sway(k) * .6, .68 + (k % 2) * .08, 3.25, .26, k % 3 ? C.GREEN : [140, 150, 96], 'rough');
        for (let k = 0; k < 7; k++) e.sphere(-4.7 + k * .5 + sway(k + 3), .5 + (k % 3) * .14, 3.5, .07, [[214, 120, 160], [240, 214, 90], [240, 240, 236]][k % 3]);
      });
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
      e.moving((e, t) => beacon(e, t, 0, 0, 18.15));
      box(-X - .2, Y, 1.5, X + .2, Y + .9, 1.65, ROD);
      // the name across the rods, low on the front, in two lines
      const ink = [[28, 28, 30]];
      for (const [line, top] of [['THE NEW', 5.6], ['YORK TIMES', 4.6]]) signIso(e, line, { face: 'y', x: 0, y: Y + .1, z: top, scale: 1, colors: ink });
      boxShadow(e, -X - .1, -Y - .1, X + .1, Y + .1, 14.6);
    },
  },
  // Taipei Nan Shan Plaza (Breeze Nan Shan), Xinyi, by Mitsubishi Jisho Sekkei. Three buildings in one row along a
  // long east-west site, read together as a range of peaks: the retail building on the west (Breeze Nan Shan), three
  // big stacked and offset boxes clad in a silver stainless-steel plum-blossom screen that glows gold at night, with
  // planted terraces; in the middle the 272 m office tower, octagonal in plan, shaped like hands joined in prayer, its
  // top floors (the restaurant and rooftop bar) a lighter glass crown cut on a slant, the "fingernails"; on the east,
  // facing Songren Road, the cultural building that is also the office entrance: a titanium polyhedron that seems to
  // float off the ground, its glass front leaning out towards the street, the roof rising to a point over it.
  // West is −x, east is +x.
  nanshan: {
    bare: true, S: 8, origin: 96, cx: -.5, cy: 0, R: 9.5, zmax: 24,
    build(e, api) {
      const { box } = e;
      // ---- the tower: an octagon (a box with its corners cut), a little narrower at the top
      const GL = [74, 102, 130], GL2 = [60, 86, 114], MUL = [128, 146, 162], TOP = 20, step = .4;
      const wAt = z => 2.5 - .35 * z / TOP, dAt = z => 1.8 - .25 * z / TOP, CUT = .7;
      const oct = (w, d, z0, z1, col, id) => { box(-w, -d + CUT, z0, w, d - CUT, z1, col, id); box(-w + CUT, -d, z0, w - CUT, d, z1, col, id); };
      for (let z = 0; z < TOP; z += step) {
        const w = wAt(z), d = dAt(z);
        api.emissive(() => { box(-w, -d + CUT, z, 0, d - CUT, z + step, GL, 1); box(-w + CUT, -d, z, 0, d, z + step, GL, 1);
          box(0, -d + CUT, z, w, d - CUT, z + step, GL2, 2); box(0, -d, z, w - CUT, d, z + step, GL2, 2); }, 'floors');
        // fine vertical mullions on the south (+y) and east (+x) faces and on the cut corner between them
        for (let x = -w + CUT + .15; x < w - CUT; x += .3) box(x, d, z, x + .03, d + .03, z + step, MUL);
        for (let y = -d + CUT + .15; y < d - CUT; y += .3) box(w, y, z, w + .03, y + .03, z + step, MUL);
        // the two hands meet down the middle of the long face
        box(-.05, d, z, .05, d + .07, z + step, [204, 214, 222]);
      }
      // the crown: lighter glass, its top cut on a slant rising to the east, the glass running past the roof as a screen
      const CR = [156, 196, 216], CR2 = [132, 176, 200], w0 = wAt(TOP), d0 = dAt(TOP);
      for (let x = -w0; x < w0; x += .1) {
        const f = (x + w0) / (2 * w0), top = TOP + 1.2 + 3.0 * f, c = Math.max(0, CUT - Math.min(x + w0, w0 - x - .1));
        api.emissive(() => box(x, -d0 + c, TOP, x + .1, d0 - c, top - .5, x < 0 ? CR : CR2, 3)); // the restaurant and bar, lit at night
        box(x, d0 - c - .05, top - .5, x + .1, d0 - c, top, CR);
      }
      for (let z = TOP + .35; z < TOP + 1.4; z += .35) oct(w0 + .02, d0 + .02, z, z + .05, [220, 230, 236]);
      e.moving((e, t) => beacon(e, t, w0 - .2, 0, TOP + 4.4));
      // ---- the retail building on the west: three big boxes, stacked and offset, in a silver screen (gold at night),
      // a band of glass under each, trees on the terraces; a blue glass box sits out over the top box's corner
      const SS = [196, 196, 190], SS2 = [168, 168, 164];
      const screen = (x0, y0, z0, x1, y1, z1, id) => {
        api.emissive(() => box(x0, y0, z0, x1, y1, z1, SS, id), 'flood');
        for (let x = x0 + .2; x < x1; x += .4) for (let z = z0 + .2; z < z1 - .1; z += .4) box(x, y1, z, x + .2, y1 + .02, z + .2, SS2);
        for (let y = y0 + .2; y < y1; y += .4) for (let z = z0 + .2; z < z1 - .1; z += .4) box(x1, y, z, x1 + .02, y + .2, z + .2, SS2);
      };
      const band = (x0, y0, z0, x1, y1, z1, id) => api.emissive(() => box(x0, y0, z0, x1, y1, z1, [96, 126, 148], id), 'lobby');
      band(-10, -3, 0, -3.2, 3.0, 1.0, 5);
      screen(-10.4, -3.4, 1.0, -3.0, 3.4, 2.9, 6);
      band(-10.2, -3.2, 2.9, -4.2, 2.0, 3.3, 7);
      screen(-10.8, -3.6, 3.3, -4.6, 1.8, 5.2, 8);
      band(-10.4, -3.4, 5.2, -5.4, 1.2, 5.6, 9);
      screen(-9.8, -3.2, 5.6, -5.6, 1.4, 7.4, 10);
      api.emissive(() => box(-11.2, -1.0, 5.6, -8.4, 2.2, 7.6, [56, 88, 132], 11), 'floors');
      box(-11.25, -1.05, 7.6, -8.35, 2.25, 7.7, [190, 194, 198]);
      // terraces: the front ledges of the lower boxes, planted
      box(-10.4, 2.0, 2.9, -3.0, 3.4, 3.0, C.GREEN); box(-4.6, -3.6, 5.2, -4.2, 1.8, 5.3, C.GREEN);
      box(-10.8, 1.2, 5.2, -4.6, 1.8, 5.3, C.GREEN);
      for (const [x, y, z] of [[-9.6, 2.7, 3.0], [-8.0, 2.7, 3.0], [-6.4, 2.7, 3.0], [-4.8, 2.7, 3.0], [-3.6, 2.4, 3.0], [-9.8, 1.5, 5.3], [-7.6, 1.5, 5.3], [-5.4, 1.5, 5.3]])
        e.moving((e, ti) => e.sphere(x + (ti == null ? 0 : Math.sin(ti * 1.5 + x) * .06), y, z + .45, .42, C.GREEN, 'rough'));
      signIso(e, 'BREEZE', { face: 'y', x: -7.4, y: 3.42, z: 2.5, scale: 1, colors: [[204, 36, 40]] });
      // ---- the cultural building on the east, the office entrance on Songren Road: a titanium polyhedron on a
      // narrow, recessed glass base, so it seems to float; its east face is glass leaning out over the street, and
      // the roof rises from the tower towards a sharp point above that glass
      const TI = [178, 180, 182], TI2 = [146, 148, 152], SEAM = [212, 214, 216], GLE = [104, 128, 146];
      const X0 = 2.9, X1 = 6.6, LEAN = .45, ZT = 7.2;
      // the lobby glass under it, set back, so the titanium seems to float
      api.emissive(() => box(X0 + .6, -1.5, 0, X1 - .2, 1.5, 1.2, [200, 184, 150], 12), 'lobby');
      for (let x = X0; x < X1 + LEAN * ZT; x += .1) {
        const f = (x - X0) / (X1 + LEAN * ZT - X0), top = 3.2 + (ZT - 3.2) * f * f;
        const under = 1.0 + 1.2 * f;
        for (let z = under; z < top; z += .2) {
          const edge = X1 + LEAN * z; // the east face leans out as it rises
          if (x > edge) continue;
          const half = 1.9 + .14 * z, glass = x > edge - .3;
          if (glass) api.emissive(() => box(x, -half + .3, z, x + .1, half - .3, z + .2, GLE, 15));
          else {
            // titanium panels, with seams running on the diagonal
            const seam = ((x * .7 + z * .45) % 1 + 1) % 1 < .08;
            box(x, -half, z, x + .1, half, z + .2, seam ? TI2 : TI, 13);
          }
        }
        if (x <= X1 + LEAN * top) box(x, -(1.9 + .14 * top), top, x + .1, 1.9 + .14 * top, top + .08, SEAM); // the roof edge
      }
      // the three are one: low links between them
      box(-3.2, -2.0, 0, -2.3, 2.0, 2.4, SS2); box(2.0, -2.0, 0, 3.2, 2.0, 2.8, TI2);
      // street trees along the south
      for (const x of [-9, -6.5, -4, 4.2, 6.6]) {
        box(x - .04, 4.6, 0, x + .04, 4.68, .8, C.WOOD);
        e.moving((e, t) => e.sphere(x + (t == null ? 0 : Math.sin(t * 1.6 + x) * .08), 4.64, 1.2, .45, C.GREEN, 'rough'));
      }
      // the plaza on Songren Road in front of the entrance, with its long white bench
      box(X1 + .6, -2.6, 0, X1 + 3.4, 2.6, .05, [222, 220, 214]);
      box(X1 + 2.4, -1.8, .05, X1 + 2.8, 1.8, .35, [240, 238, 232]);
      // people on the plazas: colleagues walking to the meetup, shoppers outside Breeze
      const PEOPLE = [[-9.2, 6.0, 3.9, .55, [52, 72, 120], 0], [-8.4, 6.2, 4.1, .4, [196, 88, 64], 3.1], [-6, 2.4, 3.8, .5, [60, 60, 64], 1.7],
        [-3, 7.8, 4.0, .6, [226, 222, 214], 5.2], [7.6, 9.4, -1.0, .35, [40, 44, 52], 0], [7.4, 9.6, 1.2, .45, [120, 150, 96], 2.4]];
      e.moving((e, t) => PEOPLE.forEach(([x0, x1, y, v, col, ph]) => {
        const p = pacer(e, (t || 0) + ph * 3, x0, x1, v), bob = e.STILL || t == null ? 0 : Math.abs(Math.sin((t + ph) * 7)) * .06;
        e.capsule([p.x, y, .2 + bob], [p.x, y, .8 + bob], .2, .17, () => col);
        e.sphere(p.x, y, 1.08 + bob, .16, [224, 190, 160]);
      }));
      e.moving((e, t) => birds(e, t, 0, 0, 4.5, 16));
      boxShadow(e, -2.5, -1.8, 2.5, 1.8, TOP);
      boxShadow(e, -10.8, -3.6, -3.0, 3.4, 7.4);
      boxShadow(e, X0, -2.6, X1 + 2, 2.6, 5.4);
    },
  },
  // Lincoln Memorial: a Doric temple of white marble on a stepped base, columns all round
  lincoln: {
    bare: true, S: 12, origin: 26, cx: 0, cy: 0, R: 5, zmax: 5,
    build(e, api) {
      const { box } = e, MB = [236, 234, 226], MD = [220, 218, 210];
      for (let k = 0; k < 4; k++) box(-6 + k * .3, -3.6 + k * .3, k * .25, 6 - k * .3, 3.6 - k * .3, (k + 1) * .25, MD, k);
      box(-4.4, -2.0, 1.0, 4.4, 2.0, 3.6, [200, 198, 190], 5);
      api.emissive(() => {
        for (let x = -4.8; x <= 4.81; x += .8) { box(x - .17, 2.42, 1.0, x + .17, 2.76, 3.7, MB); box(x - .17, -2.76, 1.0, x + .17, -2.42, 3.7, MB); }
        for (let y = -2.0; y <= 2.01; y += .8) { box(4.82, y - .17, 1.0, 5.16, y + .17, 3.7, MB); box(-5.16, y - .17, 1.0, -4.82, y + .17, 3.7, MB); }
        box(-5.4, -3.0, 3.7, 5.4, 3.0, 4.3, MB);
      }, 'flood');
      box(-4.4, -2.0, 4.3, 4.4, 2.0, 5.0, MD);
      // the open centre of the front, with Lincoln seated inside
      api.emissive(() => box(-1.3, 1.98, 1.0, 1.3, 2.04, 3.5, [70, 70, 74]));
      e.capsule([0, 2.06, 1.3], [0, 2.06, 2.1], .34, .26, () => [244, 242, 236]);
      e.sphere(0, 2.1, 2.4, .2, [244, 242, 236]);
      box(-.45, 2.04, 1.0, .45, 2.3, 1.3, [236, 234, 226]);
      // the wide steps up the front
      for (let k = 0; k < 4; k++) box(-2.4 + k * .1, 3.6 + (3 - k) * .35, 0, 2.4 - k * .1, 3.6 + (4 - k) * .35, (k + 1) * .25, MD);
      e.moving((e, t) => birds(e, t, 0, 0, 5.4, 5.6));
      boxShadow(e, -5.4, -3.0, 5.4, 3.0, 4.3);
    },
  },
};

/* ================= worlds ================= */
let LIGHT = lightFor(Date.now());
/* Shadows on the ground. A low sun would throw a tower's shadow further than the building is wide, and the shadow,
   not the building, would lead the picture: so a shadow reaches at most `reach` ground units from what casts it
   (short ones keep their true length, tall ones are drawn in), and it fades with the distance from the building's
   foot, to `far` of its strength at `reach` (bare scenes, whose shadow lies on the page). */
const SHADOW = { reach: 6, far: .3 };
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
  if (!pure) {
    const len = Math.hypot(LIGHT.sx, LIGHT.sy) || 1, k = SHADOW.reach / len, cast = e0.castShadow;
    e.castShadow = (x, y, z, ...rest) => cast(x, y, k * Math.tanh(z / k), ...rest);
  }
  e.zb.fill(-1e9); e.pix.fill(0);
  const MARK = e.rgb(255, 255, 255);
  for (let iy = 0; iy < e.H; iy++) for (let ix = 0; ix < e.W; ix++) {
    const g = e.unproject(ix + .5, iy + .5), i = iy * e.W + ix, c = bare ? MARK : sc.ground(e, g.x, g.y, ix, iy, i);
    if (!c) continue;
    e.pix[i] = c; e.ground[i] = 1; e.zb[i] = e.project(g.x, g.y, 0).d;
  }
  e.growGrass();
  e.groundZ.set(e.zb);
  const movers = [];
  e.moving = fn => { if (pure) fn(e, null); else movers.push(fn); };
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
  // the ground's soft darkening next to things is worked out on screen, so with no ground drawn (bare) it only
  // leaves a speckled grey fringe around the building, most visible on a light sky: bare scenes skip it
  if (!bare) e.bakeOcclusion();
  e.staticShadow.set(e.shadowMask);
  e.applyShadows(e.groundZ);
  if (bare) cleanShadow(e, MARK);
  e.bakedPix.set(e.pix); e.bakedZ.set(e.zb);
  const lit = [], flood = [];
  for (let k = 0; k < em.length; k++) {
    if (e.bakedPix[em[k]] !== emc[k]) continue;
    if (emk[k] === 'flood') { flood.push(em[k]); continue; }
    // office floors: a few floors stay dark, so the tower reads as a building at night
    if (emk[k] === 'floors' && e.hash(3, Math.floor((em[k] / e.W) / 6.5)) < .22) continue;
    lit.push(em[k]);
  }
  // the building's outline: its pixels next to sky or ground (lit light after dark, see lightFor)
  const rim = [], open = j => e.bakedZ[j] === e.groundZ[j];
  for (let iy = 1; iy < e.H - 1; iy++) for (let ix = 1; ix < e.W - 1; ix++) {
    const i = iy * e.W + ix;
    if (open(i) || !(e.bakedPix[i] >>> 24)) continue;
    if (open(i - 1) || open(i + 1) || open(i - e.W) || open(i + e.W)) rim.push(i);
  }
  // bare scenes: the footprint in ground units, [x0, y0, x1, y1] (the building's pixels that touch the ground, taken
  // back to it: a pixel shows a point at some height, and only near the ground is its depth the ground's own depth
  // there; an arch's underside, a roof edge or a flag would land far behind the building). The platform is laid
  // around it (day.js plateFor), and the shadow fades with the distance from it (fade: 0–255 for each ground pixel).
  let foot = null, fade = null;
  if (bare && !pure) {
    const lift = e.project(0, 0, .25), under = e.unproject(lift.sx, lift.sy);
    const near = Math.abs(lift.d - e.project(under.x, under.y, 0).d) || 1e-6;
    let fx0 = 1e9, fy0 = 1e9, fx1 = -1e9, fy1 = -1e9;
    for (let iy = 0; iy < e.H; iy++) for (let ix = 0; ix < e.W; ix++) {
      const i = iy * e.W + ix, p = e.bakedPix[i];
      if (!(p >>> 24) || p === MARK || !e.ground[i] || e.bakedZ[i] === e.groundZ[i]) continue;
      if (Math.abs(e.bakedZ[i] - e.groundZ[i]) > near) continue;
      const g = e.unproject(ix + .5, iy + .5);
      fx0 = Math.min(fx0, g.x); fx1 = Math.max(fx1, g.x); fy0 = Math.min(fy0, g.y); fy1 = Math.max(fy1, g.y);
    }
    if (fx0 <= fx1) {
      foot = [fx0, fy0, fx1, fy1]; fade = new Uint8Array(e.W * e.H).fill(255);
      for (let iy = 0; iy < e.H; iy++) for (let ix = 0; ix < e.W; ix++) {
        const i = iy * e.W + ix;
        if (!e.ground[i]) continue;
        const g = e.unproject(ix + .5, iy + .5);
        const d = cl(Math.hypot(Math.max(fx0 - g.x, 0, g.x - fx1), Math.max(fy0 - g.y, 0, g.y - fy1)) / SHADOW.reach, 0, 1);
        fade[i] = Math.round(255 * mix(1, SHADOW.far, d * d * (3 - 2 * d)));
      }
    }
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
  const w = { key, scene, sc, e, canvas, view, crop: [sx0, sy0, view.width, view.height], pad, opts, em: Int32Array.from(lit), flood: Int32Array.from(flood), rim: Int32Array.from(rim), movers, MARK, bare, pure, foot, fade };
  if (!keep) return w;
  worlds.set(key, w);
  while (worlds.size > 6) worlds.delete(worlds.keys().next().value);
  return w;
}
// bare scenes: shadows on the ground are drawn as round blobs with a dithered rim, which reads as a ragged cut-out
// once the ground is invisible. Two passes of a 3×3 majority vote give the shadow one clean edge.
function cleanShadow(e, MARK) {
  const { W, H, pix, zb, groundZ, ground } = e, open = i => ground[i] && zb[i] === groundZ[i];
  for (let pass = 0; pass < 2; pass++) {
    const snap = pix.slice();
    for (let iy = 1; iy < H - 1; iy++) for (let ix = 1; ix < W - 1; ix++) {
      const i = iy * W + ix;
      if (!open(i)) continue;
      let dark = 0, sum = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const j = i + dy * W + dx;
        if (!open(j)) { dark++; continue; } // the building's foot counts as shade, so the shadow meets it
        if (snap[j] !== MARK) { dark++; sum = snap[j]; }
      }
      if (snap[i] === MARK && dark >= 6 && sum) pix[i] = sum;
      else if (snap[i] !== MARK && dark <= 3) pix[i] = MARK;
    }
  }
}
const MOON = [184, 192, 226]; // the light outline after dark
function drawWorld(w, t) {
  const e = w.e, pix = e.pix;
  pix.set(e.bakedPix); e.zb.set(e.bakedZ);
  e.pendingShadows.length = 0;
  const wt = e.STILL ? 0 : Math.floor(t * 8) / 8;
  if (w.sc.animate && !w.pure) w.sc.animate(e, t, w.opts);
  for (const fn of w.movers) fn(e, wt);
  e.drawLeaves(wt); e.drawTufts(wt);
  e.flushShadows(); e.applyShadows(e.bakedZ); e.shadeEdges();
  // bare scenes: the ground is invisible; only its shadows stay, as soft translucent violet
  if (w.bare) {
    for (let i = 0; i < pix.length; i++) {
      if (!e.ground[i] || e.zb[i] !== e.groundZ[i]) continue;
      const p = pix[i];
      if (p === w.MARK) { pix[i] = 0; continue; }
      const a = Math.round(cl((255 - (p & 255)) / 255 * .62, 0, .5) * (w.fade ? w.fade[i] : 255));
      pix[i] = ((a << 24) | (62 << 16) | (30 << 8) | 34) >>> 0;
    }
  }
  const L = LIGHT;
  if (L.kr !== 1 || L.kg !== 1 || L.kb !== 1) {
    const s = L.sat;
    for (let i = 0; i < pix.length; i++) {
      const p = pix[i], a = p >>> 24;
      if (!a) continue;
      const r = (p & 255) * L.kr, g = (p >> 8 & 255) * L.kg, b = (p >> 16 & 255) * L.kb, m = (r + g + b) / 3;
      pix[i] = ((a << 24) | (cl(m + (b - m) * s, 0, 255) << 16) | (cl(m + (g - m) * s, 0, 255) << 8) | cl(m + (r - m) * s, 0, 255)) >>> 0;
    }
  }
  if (L.rim > 0) {
    for (const i of w.rim) {
      if (e.zb[i] !== e.bakedZ[i]) continue; // something moving is in front
      const p = pix[i];
      pix[i] = e.rgb(mix(p & 255, MOON[0], L.rim), mix(p >> 8 & 255, MOON[1], L.rim), mix(p >> 16 & 255, MOON[2], L.rim));
    }
  }
  if (L.lit > 0) {
    // floodlit walls (monuments, a shrine gate): at night they keep most of their daytime colour, a little warmer
    const f = L.lit * .6, fr = mix(1, 1.06 / L.kr, f), fg = mix(1, .98 / L.kg, f), fb = mix(1, .84 / L.kb, f);
    for (const i of w.flood) {
      if (e.zb[i] !== e.bakedZ[i]) continue; // something moving is in front
      const p = pix[i];
      pix[i] = e.rgb((p & 255) * fr, (p >> 8 & 255) * fg, (p >> 16 & 255) * fb);
    }
    for (const i of w.em) {
      if (e.zb[i] !== e.bakedZ[i]) continue;
      const p = e.bakedPix[i], a = e.hash(i % e.W, i / e.W | 0) > .5;
      pix[i] = e.rgb(mix((p & 255) * L.kr, a ? 255 : 246, L.lit), mix((p >> 8 & 255) * L.kg, a ? 210 : 186, L.lit), mix((p >> 16 & 255) * L.kb, a ? 140 : 104, L.lit));
    }
  }
  e.ctx.putImageData(e.image, 0, 0);
  const [cx0, cy0, cw, ch] = w.crop, g = w.view.getContext('2d');
  g.clearRect(0, 0, cw, ch); g.drawImage(w.canvas, cx0, cy0, cw, ch, 0, 0, cw, ch);
}
