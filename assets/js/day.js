/* Homepage: one pixel building a day, the timeline, and the terminal (see README 1 and 2.4).
   Needs assets/js/sky.js, pixel-engine.js and scenes.js (the buildings), loaded first. */
'use strict';
/* ================= data =================
   Written into the page by _layouts/home.html from published/ (notes), _data/works.yml,
   _data/days.yml (places) and _data/little.yml (small things, shown for a week). */
const SITE = JSON.parse(document.getElementById('site-data').textContent);
const CITY = siteSky.CITY; // where Yen is: assets/js/sky.js
const NOTES = SITE.notes || [];
const WORKS = (SITE.works || []).map(w => ({ slug: w.slug, year: String(w.year || ''), title: w.title, sub: w.sub || '', role: w.role || '',
  problem: w.problem || '', did: w.did || '', result: w.result || '', url: w.url || '', urlLabel: w.url_label || '' }));
const BIO = 'Yen decides what gets built, then builds some of it. Writes about how those decisions get made.';

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
/* Places (_data/days.yml). Under each building: when (whenTag), the name, where (placeFor) and one sentence
   (sentenceFor): "Yen {did}[ with {with}].[ {extra}]". No date or "years ago" in the sentence: the line above says it.
   Required: date, scene, name, zh (Chinese name; no_zh: true leaves it out), place, did.
   Optional: with, extra, map, country (default "Japan"). */
const MEMORIES = (SITE.days || []).map(d => ({ date: String(d.date), scene: d.scene, name: d.name, zh: d.zh, noZh: !!d.no_zh,
  place: d.place, did: d.did, with: d.with, extra: d.extra, map: d.map, country: d.country }));
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
/* Each fact is said once, in one place: when (the accent line above the title, or the date card in the timeline),
   what (the title), where (the line under it, a Google Maps link) and what happened (the sentence). */
function placeFor(m) {
  return `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.map || m.name + ', ' + m.place)}" target="_blank" rel="noopener">${escHtml(m.place)} ↗</a>`;
}
// "Seven years ago · January 22, 2019": the one place a past building says when
function whenTag(date, nowY) { const d = parseDay(date); return `${ago(nowY - d.y)} · ${LONG_MON[d.m - 1]} ${d.d}, ${d.y}`; }
// "Yen {did}[ with {with}].[ {extra}]" (HTML)
function sentenceFor(m) {
  const withWho = m.with ? ` with ${escHtml(listOf(m.with))}` : '';
  return `Yen ${escHtml(m.did)}${withWho}.` + (m.extra ? ' ' + escHtml(m.extra) : '');
}
// small things (a Shiba on a walk…): each shows for seven days from its date
const LITTLE = (SITE.little || []).map(l => { const [y, m, d] = String(l.date).split('-').map(Number); return { day: dayMs(y, m, d), kind: l.kind, text: l.text }; });


/* ================= day ================= */
const state = { ang: 0, day: REAL_DAY, minute: REAL.h * 60 + REAL.min, followNow: true, items: [], index: 0 };
function isRestDay(dd) { const md = pad(dd.m) + '-' + pad(dd.d); return { rest: dd.wd === 0 || dd.wd === 6 || !!HOLIDAYS[md], holiday: HOLIDAYS[md] }; }
// left → right: oldest year → today
function buildItems() {
  const dd = fromDayMs(state.day), md = pad(dd.m) + '-' + pad(dd.d);
  const r = isRestDay(dd), base = todayScene();
  const little = LITTLE.filter(l => state.day >= l.day && state.day < l.day + 7 * 864e5);
  const extra = little.map(l => l.text).join(' ');
  const items = MEMORIES.filter(m => m.date.slice(5) === md && +m.date.slice(0, 4) < dd.y && checkMemory(m))
    .sort(byDate).map(m => {
      const year = +m.date.slice(0, 4);
      return { date: m.date, id: m.id, scene: m.scene, opts: {}, label: String(year), pastView: true, tag: whenTag(m.date, dd.y), name: m.zh && !m.noZh ? `${m.name}\u00a0· ${m.zh}` : m.name, meta: placeFor(m), html: sentenceFor(m) };
    });
  const day = r.holiday || (r.rest ? 'Weekend' : 'Weekday');
  items.push({
    scene: base, opts: { shiba: little.some(l => l.kind === 'shiba'), notes: NOTES }, label: 'Today', about: true, id: todayISO(),
    name: base === 'home' ? 'Yen is at home today.' : 'Yen is at the office today.',
    place: base === 'home' ? 'home' : 'the office',
    // the date card already says the weekday and the city: only a holiday's name is news here
    meta: r.holiday ? escHtml(r.holiday) : '',
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
  const words = $('group').querySelector('.tools').offsetHeight + $('group').querySelector('.caption').offsetHeight;
  if (wide) {
    // wide screens: the date card is in the bottom-left corner, so the building has the top of the screen and its words
    // sit under it. The building takes what the words leave (between 260 and 640px); the block is centred in the
    // room between a 40px top margin and the bottom line (96px: the corner card's row).
    const top = 40, bottom = 96, room = innerHeight - top - bottom - words;
    h = Math.round(cl(room, 260, 640));
    lift = top + Math.max(0, Math.round((room - h) / 2));
  } else {
    // phones: the building always gets 60% of the screen height, the same size whether or not the day has other years
    // (the thumbnail row) or a long sentence: those may run below the first screen, the page scrolls.
    // When the words do fit, the space left is split above and below, so the building and its words stay together.
    const room = innerHeight - 76 - $('cmdbar').offsetHeight;
    h = Math.round(cl(innerHeight * .6, 200, 620));
    lift = Math.max(0, Math.round((room - (words + 8 + 12) - h) / 2));
  }
  STAGE = { w: wide ? Math.min(group.clientWidth, 900) : group.clientWidth, h };
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
  const f = wholePixels(Math.max(.4, Math.min(STAGE.w / iw, STAGE.h / ih, 4.4) * .97));
  disp.style.width = Math.round(disp.width * f) + 'px'; disp.style.height = Math.round(disp.height * f) + 'px';
  disp.style.margin = `${-t * f}px ${-r * f}px ${-b * f}px ${-l * f}px`;
}
// whole screen pixels per model pixel: an in-between scale makes some pixels one wider than the next, and the
// building's outline turns ragged. Rounds to the nearest whole step, never more than 12% larger than asked.
function wholePixels(f) {
  const dpr = window.devicePixelRatio || 1, k = f * dpr;
  return k < 1.5 ? f : (Math.round(k) <= k * 1.12 ? Math.round(k) : Math.floor(k)) / dpr;
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
  if (document.getElementById('tl').hidden) dialTo(todayISO(), `${LONG_DAY[dd.wd]} · ${CITY.name}`, true);
  $('capName').textContent = it.name; $('capName').classList.toggle('past', !it.about && !it.main);
  $('capMeta').innerHTML = it.meta; $('capMeta').hidden = !it.meta;
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
    return { date: o.date, id: o.id, scene: o.scene, opts: {}, label: o.date === date ? 'That day' : String(y), main, pastView: true,
      tag: whenTag(o.date, now),
      name: o.zh && !o.noZh ? `${o.name}\u00a0· ${o.zh}` : o.name, meta: placeFor(o), html: sentenceFor(o) };
  });
  state.index = Math.max(0, state.items.findIndex(it => it.main));
  renderText(); renderThumbs(); sizeStage(); mount(false);
  ctaFor('Today');
  scrollTo(0, 0);
}
// the top button: Timeline on today's page, Today anywhere else (it then goes back to today)
// the top card's button. Timeline on today's page; Today anywhere else in time; on a work page the card turns
// into the way back to the list (← Work, on its left) and a Home button stands beside it.
function ctaFor(word) {
  const back = word === 'Work';
  $('ctaText').textContent = word;
  $('ctaTl').classList.toggle('is-back', back);
  document.querySelector('.top').classList.toggle('has-home', back);
  $('homeBtn').hidden = !back;
  $('whenBtn').setAttribute('aria-label', back ? 'Back to all work' : word === 'Today' ? 'Back to today' : 'Open the timeline');
}
function exitPast() {
  if (!state.pastDate) return;
  state.pastDate = null;
  document.body.classList.remove('is-past');
  ctaFor('Timeline');
  renderDay();
}
function renderDay() { state.ang = 0; buildItems(); renderText(); renderThumbs(); sizeStage(); mount(false); }
/* ================= check-ins (README 3.5) =================
   location.json on the checkin branch, written by .github/workflows/checkin.yml when an iPhone Shortcut
   checks Yen in: { place: home|office|out|left_home|left_office, label, at, office_at, homes }. Words only, never coordinates.
   Today's building (where Yen spends the day, not where Yen is right now: that is "Where's Yen"):
   1. the office if Yen checked in at the office today (also on a weekend: a make-up workday);
   2. home on weekends and HOLIDAYS;
   3. home on a weekday with a home check-in in office hours (OFFICE_HOURS): a day off or a day working from home;
   4. the office on every other weekday, all day: coming home in the evening does not turn it into a day off. */
const CHECKIN_URL = 'https://raw.githubusercontent.com/laiyenju/laiyenju.github.io/checkin/location.json';
const CHECKIN_FRESH = 6 * 3600e3, TRANSIT_FRESH = 90 * 60e3, TRANSIT = ['left_home', 'left_office'], OFFICE_HOURS = [9 * 60, 18 * 60 + 30];
let CHECKIN = null;
const sameDay = (ms, day) => { const t = taipeiParts(ms); return dayMs(t.y, t.m, t.d) === day; };
const inOfficeHours = ms => { const t = taipeiParts(ms), m = t.h * 60 + t.min; return m >= OFFICE_HOURS[0] && m < OFFICE_HOURS[1]; };
function todayScene() {
  const c = CHECKIN;
  if (c && c.office_at && sameDay(Date.parse(c.office_at), state.day)) return 'studio';
  if (isRestDay(fromDayMs(state.day)).rest) return 'home';
  const homes = c ? (c.homes || (c.place === 'home' ? [c.at] : [])) : [];
  if (homes.some(at => sameDay(Date.parse(at), state.day) && inOfficeHours(Date.parse(at)))) return 'home';
  return 'studio';
}
// redraw today only when its building changes, and only on today's page
function refreshToday() {
  const t = state.items[state.items.length - 1];
  if (t && t.scene !== todayScene() && tl.hidden && !state.pastDate) renderDay();
}
function loadCheckin() {
  fetch(CHECKIN_URL, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null)
    .then(c => { if (c && c.label && Date.parse(c.at)) { CHECKIN = c; refreshToday(); } }).catch(() => {});
}
/* ================= where is Yen now =================
   1. A check-in wins if it is less than 6 hours old; one on the way (left home, left the office) only for 90 minutes,
      so a missed arrival does not leave Yen "on the way home" all evening. Leaving home on an office day says where to.
   2. Otherwise the page reads Yen's usual day from the clock, and says "usually" so nobody takes it as fact. */
const WEEKDAY = [[0, 'asleep'], [7 * 60, 'on the way to the office'], [9 * 60, 'at the office'], [12 * 60, 'out for lunch near the office'],
  [13 * 60 + 30, 'at the office'], [18 * 60 + 30, 'on the way home'], [19 * 60 + 30, 'at home']];
const RESTDAY = [[0, 'asleep'], [9 * 60, 'having a slow morning at home'], [12 * 60, 'out somewhere in the city'], [19 * 60, 'at home']];
function whereNow() {
  const hm = `${pad(Math.floor(state.minute / 60))}:${pad(state.minute % 60)}`;
  const c = CHECKIN, fresh = c && (TRANSIT.includes(c.place) ? TRANSIT_FRESH : CHECKIN_FRESH);
  if (c && Date.now() - Date.parse(c.at) < fresh) {
    const t = taipeiParts(Date.parse(c.at));
    const label = c.place === 'left_home' && c.label === 'heading out' && todayScene() === 'studio' ? 'on the way to the office' : c.label;
    return `Yen is ${label}, ${CITY.name}. Checked in at ${pad(t.h)}:${pad(t.min)}.`;
  }
  const rest = todayScene() === 'home', plan = rest ? RESTDAY : WEEKDAY;
  let now = plan[0][1];
  for (const [from, label] of plan) if (state.minute >= from) now = label;
  return `It's ${hm} in ${CITY.name}${rest ? ' on a day off' : ''}. At this hour Yen is usually ${now}.`;
}
/* ================= terminal ================= */
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const logEl = $('log');
document.querySelectorAll('.city').forEach(el => { el.textContent = CITY.short; }); // the input line's yen@<city>
// notes and works share one list: date or year | title, then a short line under it (subtitle or description).
// Each row carries its language, so Chinese titles get Chinese line breaking and spacing.
const lsRows = rows => `<div class="ls">${rows.map(r => `<a href="${r.url}" lang="${esc(r.lang || 'zh-Hant')}"><span class="d">${r.date}</span><span class="t">${esc(r.title)}</span>${r.sub ? `<span class="r">${esc(r.sub)}</span>` : ''}</a>`).join('')}</div>`;
const line = (t, cls = '') => `<div class="out-line ${cls}">${esc(t)}</div>`;
const COMMANDS = {
  'whoami': () => line(BIO.replace(/^Yen /, 'Yen Lai, product manager, ')) + `<div class="out-line mono"><a href="https://github.com/laiyenju" target="_blank" rel="noopener">github</a> · <a href="https://www.linkedin.com/in/laiyenju/" target="_blank" rel="noopener">linkedin</a> · <a href="https://x.com/theYenLai" target="_blank" rel="noopener">x</a></div>`,
  'ls notes': () => lsRows(NOTES),
  'ls works': () => WORKS.length ? `<div class="ls">${WORKS.map(w => `<button type="button" data-run="open works/${w.slug}" lang="en"><span class="d">${w.year}</span><span class="t">${esc(w.title)}</span><span class="r">${esc(w.sub)}</span></button>`).join('')}</div>` : line('Nothing here yet.'),
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
    clearTerm();
    scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    return;
  }
  typing = true;
  try {
    // In three beats you can follow: the screen settles on the line, the command types out behind a cursor
    // and waits a moment as if Enter were pressed, then the output comes in a row at a time.
    // opening a row from a list (open works/…) happens at once: the click is the command, no typing, no scroll
    const quick = key.startsWith('open ');
    const block = document.createElement('div'); block.className = 'block';
    block.innerHTML = prompt(typed && !quick ? '' : raw.trim());
    logEl.append(block);
    if (key !== 'cd ~' && !quick) focusLine(block);
    const b = block.querySelector('b');
    if (quick) { /* nothing to type */ } else if (typed && !still()) {
      b.insertAdjacentHTML('afterend', '<span class="cur" aria-hidden="true"></span>');
      await settled(); await wait(120);
      for (const ch of raw) { b.textContent += ch; await wait(ch === ' ' ? 90 : 55); }
      await wait(260);
      block.querySelector('.cur').remove();
    } else if (typed) b.textContent = raw;
    const fn = COMMANDS[key];
    const out = document.createElement('div'); out.className = 'result';
    out.innerHTML = fn ? fn() : line(`Command not found: ${raw.trim()}. Try one of the buttons below.`, 'err');
    block.append(out);
    if (key !== 'cd ~' && !openOverlay()) roomBelow(FOCUS.at, true);
    if (!still() && !quick) await reveal(out);
  } finally { typing = false; }
}
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(r => setTimeout(r, ms));
// resolves once the scroll that focusLine started has come to rest (or after 700ms at most)
function settled() {
  return new Promise(res => {
    if (Math.abs(scrollY - FOCUS.at) < 2) return res();
    let done = false;
    const fin = () => { if (done) return; done = true; removeEventListener('scrollend', fin); res(); };
    addEventListener('scrollend', fin); setTimeout(fin, 700);
  });
}
// output a row at a time: list rows and label/value pairs one by one, other output line by line; at most ~0.6s in all
async function reveal(out, total = 600) {
  const units = [];
  for (const el of out.children) { if (el.matches('.ls, dl.case')) units.push(...el.children); else units.push(el); }
  if (!units.length) return;
  const step = Math.min(70, total / units.length);
  units.forEach(u => u.classList.add('rise'));
  out.getBoundingClientRect();
  units.forEach((u, i) => setTimeout(() => u.classList.add('in'), i * step));
  await wait(units.length * step + 260);
  units.forEach(u => u.classList.remove('rise', 'in'));
}
// the line being typed goes near the top of the screen, just under the date card, so the eye knows where to look;
// the output then reads downwards from there. The terminal grows empty room below when there is not enough page to scroll.
const FOCUS = { at: 0 };
// The room is worked out from the page as it stands, never by removing it first: taking it away even for a moment
// shortens the page, the browser pulls the view up to fit, and the line jumps down just as the output arrives.
function roomBelow(target, hold) {
  const term = document.querySelector('.term'), base = Math.round(innerHeight * .3);
  const now = parseFloat(getComputedStyle(term).paddingBottom) || 0;
  const content = document.documentElement.scrollHeight - now;
  term.style.paddingBottom = Math.max(base, target + innerHeight - content) + 'px';
  // once the output is in (hold), the view stays on the line, whatever the room did
  if (hold && Math.abs(scrollY - target) > 1 && Math.abs(scrollY - target) < innerHeight) scrollTo({ top: target, behavior: 'instant' });
}
function focusLine(block, now) {
  // phones: just under the date card at the top. Wide screens: the card is down in the corner, so near the top edge.
  const below = innerWidth >= 900 ? 40 : document.querySelector('.top').offsetHeight + 20;
  FOCUS.at = Math.max(0, Math.round(scrollY + block.getBoundingClientRect().top - below));
  roomBelow(FOCUS.at);
  scrollTo({ top: FOCUS.at, behavior: now || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}
// Rows in a list: picked, a row turns reverse video for a beat (the terminal's "selected") and then opens;
// coming back, the row you just read lights the same way and fades, so you know where you were.
const PICK = 110;
function lightRow(row, fade) {
  if (!row || still()) return;
  row.classList.remove('was'); row.classList.add('lit');
  if (fade) setTimeout(() => { row.classList.add('was'); row.classList.remove('lit'); setTimeout(() => row.classList.remove('was'), 900); }, 520);
}
logEl.addEventListener('click', ev => {
  const b = ev.target.closest('[data-run]');
  if (b) { const go = () => run(b.dataset.run, true); if (b.closest('.ls') && !still()) { lightRow(b); setTimeout(() => { go(); b.classList.remove('lit'); }, PICK); } else go(); return; }
  // a note from the list opens like a work: in this tab, at once (no typing on arrival), and the list is one step back
  const a = ev.target.closest('.ls a[href]');
  if (a && !ev.metaKey && !ev.ctrlKey && !ev.shiftKey && !ev.altKey && ev.button === 0) {
    const path = new URL(a.href, location.href).pathname;
    try { sessionStorage.setItem('post-handoff', path); sessionStorage.setItem('post-from-list', path); } catch (e) {}
    if (!still()) { ev.preventDefault(); lightRow(a); setTimeout(() => { location.href = a.href; }, PICK); }
  }
});
// the page after it bfcache-restores still shows the row lit from the way out
addEventListener('pagehide', () => logEl.querySelectorAll('.ls .lit').forEach(r => r.classList.remove('lit')));
// back from a note to the list (post.js leaves a note in post-return). Kept in memory by the browser: the list is
// still there, so it comes back under the date card, as after a work. Reloaded instead: list the notes again.
function backFromNote(kept) {
  let r = null;
  try { r = JSON.parse(sessionStorage.getItem('post-return') || 'null'); sessionStorage.removeItem('post-return'); } catch (e) {}
  if (!r || Date.now() - r.t > 30 * 60e3 || new URLSearchParams(location.search).get('view')) return;
  if (!r.toList) { if (kept) { clearTerm(); scrollTo(0, 0); } return; } // back from a note some other way (Home, ~): a clean home page
  const list = kept && [...logEl.querySelectorAll('.block')].reverse().find(b => b.querySelector('.ls a[href]'));
  const readRow = blk => blk && [...blk.querySelectorAll('.ls a[href]')].find(a => new URL(a.href, location.href).pathname === r.path);
  if (list) { focusLine(list); lightRow(readRow(list), true); return; } // as after a work: the list glides up under the date card
  // the page was loaded afresh: put the list back as it was, at once (it was already printed once)
  const block = document.createElement('div'); block.className = 'block';
  block.innerHTML = prompt('ls notes') + COMMANDS['ls notes']();
  logEl.append(block);
  focusLine(block, true);
  lightRow(readRow(block), true);
}
addEventListener('pageshow', e => backFromNote(e.persisted));
// the buttons: one bar for the whole page (see placeBar). A button runs its command; run() brings the line into view.
$('cmdForm').addEventListener('submit', ev => { ev.preventDefault(); const v = $('cmd').value; $('cmd').value = ''; run(v, false); });
{
  const d = document.createElement('button'); d.type = 'button'; d.className = 'dollar'; d.textContent = '$'; d.title = 'Type a command';
  d.addEventListener('click', () => { focusLine($('cmdForm')); $('cmd').focus({ preventScroll: true }); });
  $('cmdbar').append(d);
}
CHIPS.forEach(([label, c]) => {
  const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.title = c;
  b.addEventListener('click', () => run(c, true));
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
// the terminal empty, as on a fresh page: what the home page looks like whenever it is come back to from another view
// (the timeline, a work's page via Home, a past day). Only going back to a list (← Work, works/, or back from a note) keeps it.
function clearTerm() { logEl.innerHTML = ''; $('cmd').value = ''; $('cmd').blur(); document.querySelector('.term').style.paddingBottom = ''; }

/* overlays: one work (#work-<slug>), the timeline (#timeline), one day (#day-YYYY-MM-DD) */
const reader = $('reader'), tl = $('tl');
const openOverlay = () => (!reader.hidden && reader) || (!tl.hidden && tl) || null;
function go2(hash) { if (location.hash !== hash) { try { history.pushState(null, '', hash); } catch (e) { location.hash = hash; return; } } route(); }
function showOverlay(el) {
  for (const o of [reader, tl]) o.hidden = o !== el;
  ctaFor(location.hash.startsWith('#work-') ? 'Work' : 'Today');
  el.scrollTop = 0; document.body.style.overflow = 'hidden'; updateMore();
}
function closeOverlays(keep) {
  if (!keep) clearTerm();
  reader.hidden = true; tl.hidden = true; document.body.style.overflow = ''; ctaFor('Timeline'); document.body.classList.remove('tl-in');
  if (state.pastDate) exitPast(); else renderText();
  if (location.hash) { try { history.pushState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; } }
  updateMore();
}
const WORK = { fromList: false };
// back to all the work: the list it was opened from, or a fresh `ls works` when it came from a link
function backToWorks() {
  const list = WORK.fromList && [...logEl.querySelectorAll('.block')].reverse().find(b => b.querySelector('.ls [data-run^="open works/"]'));
  closeOverlays(!!list);
  if (list) { focusLine(list); lightRow(list.querySelector(`.ls [data-run="open works/${WORK.slug}"]`), true); }
  else setTimeout(() => run('ls works', true), 60);
}
function openWork(slug) {
  const w = WORKS.find(x => x.slug === slug);
  if (!w) return;
  $('readerBody').innerHTML = `
    <span class="prompt">yen@${CITY.short} <button type="button" class="path" data-go="home" title="Home">~</button> <i>$</i> <b>cat <button type="button" class="path" data-go="works" title="All work">works/</button>${esc(w.slug)}.md</b></span>
    <h1>${esc(w.title)}</h1>
    <p class="sub">${esc(w.sub)}</p>
    <p class="byline">${esc(w.year)} · ${esc(w.role)}</p>
    <h2>The problem</h2><p>${esc(w.problem)}</p>
    <h2>What Yen did</h2><p>${esc(w.did)}</p>
    <h2>The result</h2><p>${esc(w.result)}</p>
    ${w.url ? `<p class="out"><a href="${w.url}" target="_blank" rel="noopener">${esc(w.urlLabel || 'open the portfolio')} ↗</a></p>` : ''}
`;
  // opened from the list in the terminal: going back (← Work, or works/ in the path) closes the page, and the list is still there underneath
  WORK.fromList = !!logEl.querySelector(`.ls [data-run="open works/${w.slug}"]`); WORK.slug = w.slug;
  showOverlay(reader);
  if (!still()) reveal($('readerBody'), 260); // the page prints in from the top, like cat, in about a quarter second
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
function timelineEntries() {
  const today = state.items[state.items.length - 1];
  const past = MEMORIES.filter(m => m.date < todayISO() && checkMemory(m)).sort(byDate).reverse();
  return [{ date: todayISO(), id: todayISO(), today: true, scene: today.scene, opts: today.opts, name: today.name, html: today.meta }]
    .concat(past.map(m => ({ date: m.date, id: m.id, m, scene: m.scene, opts: {}, name: m.zh && !m.noZh ? `${m.name}\u00a0· ${m.zh}` : m.name, html: sentenceFor(m) })));
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
// sub: the line under the date; live: end it with the time now, to the second (siteSky.rollClock, ticked by secondTick)
// past: a day gone by (the timeline), written in the accent like the line above a past building (.past-tag)
function dialTo(iso, sub, live = false, past = false) {
  const el = $('date'), text = iso.replace(/-/g, '.');
  $('whenBtn').classList.toggle('is-past-day', past);
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
  // "Thursday · Taipei 16:15": the weekday goes in its own span, so a narrow screen can leave it out
  const put = () => {
    const k = sub.indexOf(' · ');
    c.innerHTML = (k > 0 ? `<span class="wd">${esc(sub.slice(0, k + 3))}</span>${esc(sub.slice(k + 3))}` : esc(sub)) + (live ? ' <span class="roll" id="clockRoll"></span>' : '');
    c._key = sub + '|' + live;
    if (live) siteSky.rollClock($('clockRoll'));
  };
  if (c._key !== sub + '|' + live) {
    if (!c._key) put();
    else { c.classList.add('swap'); clearTimeout(c._t); c._t = setTimeout(() => { put(); c.classList.remove('swap'); }, 220); }
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
  const st = $('tlStage'), f = wholePixels(Math.min(st.clientWidth / cv.width, st.clientHeight / cv.height, 3.2) * .86);
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
  layoutRow();
  t.setAttribute('aria-valuetext', x.today ? 'Today' : `${x.name}, ${x.date}`);
}
/* wide screens: the other days stand in a row either side of the chosen one, small and grey (not chosen yet), so the
   timeline is not one building in an empty screen. The row runs past the screen's edges when there are many.
   Click one to go to it. Phones: hidden (.tl-row in day.css), and not drawn. */
const ROW = { box: 220, gap: 26 };
function renderRow() {
  const row = $('tlRow'); if (!row || innerWidth < 900) return;
  const st = $('tlStage'), H = st.clientHeight * .6;
  row.innerHTML = '';
  TL.list.forEach((x, k) => {
    const img = tlImage(x), c = document.createElement('canvas');
    c.className = 'tl-nb'; c.dataset.k = k; c.width = img.width; c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0);
    const f = wholePixels(Math.min(ROW.box / img.width, H / img.height, 2.4) * .86);
    c.style.width = Math.round(img.width * f) + 'px'; c.style.height = Math.round(img.height * f) + 'px';
    row.append(c);
  });
  layoutRow(true);
}
function layoutRow(first) {
  const row = $('tlRow'); if (!row || !row.children.length) return;
  // the first ones stand close to the chosen one (a big building may overlap them a little: they sit behind it)
  const half = Math.min($('tlStage').clientWidth / 2, 210), step = ROW.box + ROW.gap;
  for (const c of row.children) {
    const d = +c.dataset.k - TL.idx;
    if (first) c.style.transition = 'none';
    c.classList.toggle('on', d === 0);
    // the chosen one hides here (the big canvas shows it); the rest keep their places either side
    const x = d === 0 ? 0 : Math.sign(d) * (half + ROW.gap + ROW.box / 2 + (Math.abs(d) - 1) * step);
    c.style.setProperty('--x', x.toFixed(1) + 'px');
    if (first) { c.getBoundingClientRect(); c.style.transition = ''; }
  }
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
  dialTo(x.date, `${LONG_DAY[d.wd]} · ${years > 0 ? ago(years).toLowerCase() : 'today'}`, false, years > 0);
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
  document.body.classList.add('tl-in'); // today's words step aside first, so the two captions never overlap
  TL.list = tlEntries(); TL.idx = -1; TL.cur = null; TL.token = (TL.token || 0) + 1;
  const k = Math.max(0, TL.list.findIndex(x => x.id === date));
  $('tlBody').innerHTML = `<div class="tlm wrap">
      <div class="tl-stage" id="tlStage" role="button" tabindex="0" aria-label="This day's building. Tap to read the day. Swipe left or right for other days."><div class="tl-row" id="tlRow" aria-hidden="true"></div><canvas id="tlc"></canvas></div>
      <div class="tl-cap hide" id="tlCap"><div class="n" id="tlName"></div><div class="s" id="tlPlace"></div></div>
    </div>
    <div class="ruler"><div class="stats" id="tlStats"></div><div class="ruler-track" id="rulerTrack" role="slider" tabindex="0" aria-label="Days kept, oldest on the left" aria-valuemin="1" aria-valuemax="${TL.list.length}"></div></div>`;
  const fly = TL.from && TL.from.id === TL.list[k].id && !matchMedia('(prefers-reduced-motion: reduce)').matches ? TL.from : null;
  TL.from = null;
  if (fly) tl.classList.add('clear');
  showOverlay(tl);
  ctaFor('Today');
  renderRuler(); renderRow();
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
    else if (Math.hypot(dx, dy) < 10 && ev.type === 'pointerup') {
      const nb = ev.target.closest && ev.target.closest('.tl-nb:not(.on)');
      nb ? showTlDay(+nb.dataset.k) : tapTl();
    }
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
  clearTerm();
  setup();
  scrollTo(0, 0);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!img || !from || still) { tl.hidden = true; document.body.style.overflow = ''; document.body.classList.remove('tl-in'); renderText(); updateMore(); return; }
  const at = dispInner(), to = rectLike(img, at.img, at.rect), g = ghostOf(img, to);
  const fromRect = rectLike(img, cv, from);
  disp.style.opacity = '0';
  cv.style.visibility = 'hidden';
  tl.classList.add('clear');
  headerNow();
  flyFrom(g, fromRect, MOVE);
  setTimeout(() => {
    tl.hidden = true; tl.classList.remove('clear'); document.body.style.overflow = ''; document.body.classList.remove('tl-in');
    disp.style.transition = 'opacity .25s ease'; disp.style.opacity = '1';
    setTimeout(() => { g.remove(); disp.style.transition = ''; }, 260);
    updateMore();
  }, MOVE);
}
function headerNow() { const dd = fromDayMs(state.day); dialTo(todayISO(), `${LONG_DAY[dd.wd]} · ${CITY.name}`, true); }
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
function route() {
  const h = location.hash;
  let m;
  if ((m = h.match(/^#work-(.+)$/))) openWork(m[1]);
  else if (h === '#timeline') { if (state.pastDate) { state.pastDate = null; document.body.classList.remove('is-past'); renderDay(); } if (tl.hidden) openTl(todayISO()); else showTlDay(TL.list.length - 1); }
  else if ((m = h.match(/^#day-(\d{4}-\d{2}-\d{2}(?:-\d+)?)$/))) { if (state.pastDate) { state.pastDate = null; document.body.classList.remove('is-past'); renderDay(); } if (tl.hidden) openTl(m[1]); }
  else if ((m = h.match(/^#past-(\d{4}-\d{2}-\d{2}(?:-\d+)?)$/))) { reader.hidden = true; tl.hidden = true; document.body.style.overflow = ''; renderPast(m[1]); updateMore(); }
  else {
    if (openOverlay() || state.pastDate) { if (reader.hidden || !WORK.fromList) clearTerm(); }
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
    // the path in a work's prompt: works/ back to the list, ~ home
    const goTo = ev.target.closest('[data-go]');
    if (goTo && goTo.dataset.go === 'works') backToWorks();
    else if (goTo && goTo.dataset.go === 'home') { closeOverlays(); scrollTo({ top: 0, behavior: still() ? 'auto' : 'smooth' }); }
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
  // q: 0 at the top, 1 once the terminal's top is 70% down the screen (when the buttons move down into the terminal)
  const q = cl(scrollY / Math.max(1, document.querySelector('.term').offsetTop - innerHeight * .7), 0, 1);
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
  else if (!reader.hidden) backToWorks();
  else if (state.pastDate) closeOverlays();
  else openTimeline();
});
$('homeBtn').addEventListener('click', () => { closeOverlays(); scrollTo({ top: 0, behavior: still() ? 'auto' : 'smooth' }); });
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

/* the seconds in the date card, on the second */
function secondTick() {
  const r = $('clockRoll');
  if (r && !document.hidden) siteSky.rollClock(r);
  setTimeout(secondTick, 1000 - Date.now() % 1000 + 15);
}
secondTick();

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
  if (day !== state.day && tl.hidden && !state.pastDate) { state.day = day; refreshLight(true); renderDay(); } else { refreshLight(true); refreshToday(); }
  if (r.min % 10 === 0) loadCheckin(); // a page left open hears of new check-ins
}, 60e3);
addEventListener('resize', () => { sizeStage(); if (mainWorld) fitCanvas(mainWorld); onScroll(); });
// the words change height once the web fonts arrive (Quattro sets wider than the fallback), so measure again
if (document.fonts) document.fonts.addEventListener('loadingdone', () => { sizeStage(); if (mainWorld) fitCanvas(mainWorld); onScroll(); });

applyTheme(LIGHT);
refreshLight(false);
renderLists();
renderDay();
loadCheckin();
onScroll();
route();
openView();
requestAnimationFrame(frame);
