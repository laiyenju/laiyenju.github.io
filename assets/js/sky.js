/* The sky over the city, shared by the home page (day.js) and the notes (theme-boot.html, theme.js):
   where the sun is, the moment it shows (now, or the home page's rewind), and the colour of the page that goes with it. Loaded in <head>, before first paint.
   City: change CITY here when travelling (README 2.4). */
(function () {
  'use strict';
  var CITY = { name: 'Taipei', short: 'taipei', lat: 25.033, lon: 121.565, tz: 8 };

  function sunAt(ms) {
    var d = new Date(ms), n = (ms - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5;
    var rad = Math.PI / 180, decl = 23.44 * Math.sin(2 * Math.PI * (284 + n) / 365) * rad;
    var B = 2 * Math.PI * (n - 81) / 364, eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    var solar = d.getUTCHours() + d.getUTCMinutes() / 60 + CITY.lon / 15 + eot / 60;
    var H = (solar - 12) * 15 * rad, lat = CITY.lat * rad;
    var alt = Math.asin(Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(H));
    var az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat) - Math.tan(decl) * Math.cos(lat)) + Math.PI;
    return { alt: alt / rad, az: az };
  }

  // page colour by the sun's height (degrees): night blue, dusk violet, plum, sunrise warm, day near white.
  // The plum (−0.6°) is the ground under a rose horizon, and the page turns light just above it (−0.4°), in a
  // step: a slow run from violet to the warm sunrise colour goes through greys, which colours() then darkens to a
  // dull brown.
  var BG_STOPS = [[-18, [21, 25, 38]], [-9, [40, 46, 74]], [-4, [62, 53, 96]], [-0.6, [110, 62, 84]], [-0.4, [226, 202, 192]], [0, [222, 200, 190]], [5, [244, 230, 212]], [14, [247, 243, 234]], [28, [248, 248, 245]]];
  function mix(a, b, t) { return a + (b - a) * t; }
  function bgFor(alt) {
    if (alt <= BG_STOPS[0][0]) return BG_STOPS[0][1];
    for (var k = 1; k < BG_STOPS.length; k++) {
      var a1 = BG_STOPS[k][0], c1 = BG_STOPS[k][1], a0 = BG_STOPS[k - 1][0], c0 = BG_STOPS[k - 1][1];
      if (alt <= a1) { var t = (alt - a0) / (a1 - a0); return c0.map(function (v, j) { return mix(v, c1[j], t); }); }
    }
    return BG_STOPS[BG_STOPS.length - 1][1];
  }
  // The sky over the home page's building: two colours for each height of the sun, the zenith (top of the page) and
  // the horizon (behind the building's base); under the horizon the ground is the page colour above (bgFor).
  // Morning and afternoon have their own colours (the sun in the east or the west), so 09:30 and 14:30, at the same
  // height, are not the same sky. Under the horizon both are one night (README 2.5.1).
  var SKY_LOW = [[-18, [9, 12, 22], [26, 32, 56]], [-9, [18, 22, 51], [52, 53, 95]], [-4, [27, 30, 68], [143, 95, 130]]];
  var SKY_STOPS = {
    am: SKY_LOW.concat([[0, [143, 164, 207], [242, 201, 176]], [10, [178, 200, 224], [243, 228, 214]], [25, [184, 209, 230], [245, 242, 234]], [50, [169, 200, 230], [248, 248, 243]]]),
    pm: SKY_LOW.concat([[0, [138, 143, 191], [240, 179, 148]], [10, [170, 184, 214], [246, 218, 182]], [25, [191, 207, 223], [246, 238, 221]], [50, [169, 200, 230], [248, 248, 243]]]),
  };
  // the sun's az is from the north, clockwise: under 180° it is still rising
  function skyFor(alt, az) {
    var S = SKY_STOPS[az < Math.PI ? 'am' : 'pm'], last = S[S.length - 1];
    if (alt <= S[0][0]) return { top: S[0][1], horizon: S[0][2] };
    for (var k = 1; k < S.length; k++) {
      if (alt <= S[k][0]) {
        var t = (alt - S[k - 1][0]) / (S[k][0] - S[k - 1][0]);
        return { top: S[k - 1][1].map(function (v, j) { return mix(v, S[k][1][j], t); }), horizon: S[k - 1][2].map(function (v, j) { return mix(v, S[k][2][j], t); }) };
      }
    }
    return { top: last[1], horizon: last[2] };
  }
  // Halfway between two colours without the grey: a straight mix of a blue zenith and a peach horizon is a dull
  // mauve, so the mix (in Oklab) gets back the colourfulness its two ends have on average. Its hue is the mix's own.
  function toLab(c) {
    var r = lin(c[0]), g = lin(c[1]), b = lin(c[2]);
    var l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b), m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b), s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
    return [.2104542553 * l + .793617785 * m - .0040720468 * s, 1.9779984951 * l - 2.428592205 * m + .4505937099 * s, .0259040371 * l + .7827717662 * m - .808675766 * s];
  }
  function fromLab(L) {
    var l = Math.pow(L[0] + .3963377774 * L[1] + .2158037573 * L[2], 3), m = Math.pow(L[0] - .1055613458 * L[1] - .0638541728 * L[2], 3), s = Math.pow(L[0] - .0894841775 * L[1] - 1.291485548 * L[2], 3);
    return [4.0767416621 * l - 3.3077115913 * m + .2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, -.0041960863 * l - .7034186147 * m + 1.707614701 * s]
      .map(function (v) { v = Math.max(0, Math.min(1, v)); return 255 * (v <= .0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - .055); });
  }
  function between(a, b) {
    var A = toLab(a), B = toLab(b), M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2];
    var want = (Math.hypot(A[1], A[2]) + Math.hypot(B[1], B[2])) / 2, has = Math.hypot(M[1], M[2]);
    var k = has > .004 ? Math.min(want / has, 3) : 1;
    return fromLab([M[0], M[1] * k, M[2] * k]);
  }
  function hex(c) { return '#' + c.map(function (v) { var h = Math.round(Math.max(0, Math.min(255, v))).toString(16); return h.length < 2 ? '0' + h : h; }).join(''); }

  // contrast between two colours, as WCAG measures it (4.5 is the floor for body-size text)
  function lin(v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }
  function rel(c) { return .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2]); }
  function contrast(a, b) { var x = rel(a), y = rel(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  // a text colour as designed, moved toward `to` only as far as it takes to read on this ground
  function fit(want, bg, to, need) {
    for (var t = 0; t <= 1.0001; t += .05) {
      var c = want.map(function (v, j) { return mix(v, to[j], t); });
      if (contrast(c, bg) >= need) return c;
    }
    return to;
  }

  // The page colour, a slightly lifted "sheet" colour for cards and buttons, whether light text is needed,
  // and the text colours for this ground: ink, soft (subtitles), faint (dates, hints) and the accent.
  // At dusk the sky passes through mid tones where neither dark nor light text reads well, so the colour keeps
  // its hue but is pushed darker (under light text) or lighter (under dark text); then each text colour keeps its
  // designed tone where it can and darkens or lightens only as far as it needs to read (contrast 4.5, with a little to spare for tinted boxes such as code).
  var TEXT = {
    day: { ink: [38, 36, 33], soft: [90, 84, 78], faint: [115, 109, 102], accent: [181, 83, 30] },
    night: { ink: [236, 231, 221], soft: [182, 185, 191], faint: [150, 154, 166], accent: [240, 164, 106] },
  };
  function colours(bg) {
    var lum = (.2126 * bg[0] + .7152 * bg[1] + .0722 * bg[2]) / 255, dark = lum < .55;
    if (dark && lum > .3) { var d = .3 / lum; bg = bg.map(function (v) { return v * d; }); }
    if (!dark && lum < .7) { var t = (.7 - lum) / (1 - lum); bg = bg.map(function (v) { return mix(v, 255, t); }); }
    var sheet = dark ? bg.map(function (v) { return v + 14; }) : bg.map(function (v) { return mix(v, 255, .7); });
    var T = dark ? TEXT.night : TEXT.day, edge = dark ? [255, 255, 255] : [0, 0, 0];
    return {
      bg: hex(bg), sheet: hex(sheet), dark: dark,
      ink: hex(fit(T.ink, bg, edge, 7)),
      soft: hex(fit(T.soft, bg, T.ink, 5.6)),
      faint: hex(fit(T.faint, bg, T.ink, 5)),
      accent: hex(fit(T.accent, bg, edge, 4.8)),
    };
  }

  // The moment the whole site's sky shows: now, or the minute today's home page was rewound to (day.js showAt), so the
  // notes, the timeline and the works keep the sky the visitor chose. Only the home page can rewind; it is kept for
  // this tab (sessionStorage, shared with the notes framed in the home page) until the home page comes back to now,
  // and only for the day it was set on (the rewind is through today).
  var AT_KEY = 'skyAt';
  function cityDay(ms) { return Math.floor((ms + CITY.tz * 3600e3) / 864e5); }
  function shownMs() {
    var now = Date.now(), ms = 0;
    try { ms = +sessionStorage.getItem(AT_KEY) || 0; } catch (e) {}
    return ms && ms <= now && cityDay(ms) === cityDay(now) ? ms : now;
  }
  function keepAt(ms) {
    try { if (ms == null) sessionStorage.removeItem(AT_KEY); else sessionStorage.setItem(AT_KEY, String(Math.round(ms))); } catch (e) {}
  }

  // the notes: the ground (--sky, --sky-sheet) and its text colours (--t-*) on <html>; true when the sky is dark
  var NOTE_VARS = ['--sky', '--sky-sheet', '--t-ink', '--t-soft', '--t-faint', '--t-accent'];
  function paintNotes(ms) {
    var c = colours(bgFor(sunAt(ms == null ? shownMs() : ms).alt)), root = document.documentElement.style;
    [c.bg, c.sheet, c.ink, c.soft, c.faint, c.accent].forEach(function (v, k) { root.setProperty(NOTE_VARS[k], v); });
    return c.dark;
  }

  // the home page: its colour variables for this sky (day.js keeps them in step; home.html paints them before first paint)
  function paintHome(bg) {
    var c = colours(bg), dark = c.dark, root = document.documentElement.style;
    root.setProperty('--bg', c.bg);
    root.setProperty('--ink', c.ink);
    root.setProperty('--ink-soft', c.faint);
    root.setProperty('--ink-card', c.soft);
    root.setProperty('--rule', dark ? 'rgba(236,231,221,.18)' : 'rgba(38,36,33,.14)');
    root.setProperty('--accent', c.accent);
    root.setProperty('--sheet', c.sheet);
    root.colorScheme = dark ? 'dark' : 'light';
  }
  // the home page's sky (sun: sunAt): the horizon as designed, the zenith made readable the way the ground is
  // (colours), since the date card sits on it; the card's words take their colours from the zenith (--sky-*, day.css)
  function paintSky(sun) {
    var s = skyFor(sun.alt, sun.az), c = colours(s.top), root = document.documentElement.style;
    root.setProperty('--sky-top', c.bg);
    root.setProperty('--sky-horizon', hex(s.horizon));
    // the middle of the sky, and the middle of the glow under the horizon (down to the ground, the page colour)
    var top = [1, 3, 5].map(function (k) { return parseInt(c.bg.slice(k, k + 2), 16); });
    var ground = colours(bgFor(sun.alt)).bg, g = [1, 3, 5].map(function (k) { return parseInt(ground.slice(k, k + 2), 16); });
    root.setProperty('--sky-mid', hex(between(top, s.horizon)));
    root.setProperty('--sky-low', hex(between(s.horizon, g)));
    root.setProperty('--sky-ink', c.ink);
    root.setProperty('--sky-faint', c.faint);
    root.setProperty('--sky-accent', c.accent);
    // the stars come out between −6° and −12°
    root.setProperty('--stars', Math.max(0, Math.min(1, (-6 - sun.alt) / 6)).toFixed(3));
  }
  // The live time in the date card, HH:MM:SS in the city, each digit on a strip 0–9 that rolls to its number
  // (home page and notes alike; styles .roll in day.css and site.css). Each strip ends in a second 0, so 9 → 0
  // keeps rolling forward instead of running back through every digit; it then snaps to the first 0 unseen.
  // back (the home page's rewind, day.js): the digits roll the other way, and 0 → 9 jumps to the last 0 unseen first.
  function rollClock(el, ms, back) {
    var d = new Date((ms == null ? Date.now() : ms) + CITY.tz * 3600e3);
    var two = function (n) { return (n < 10 ? '0' : '') + n; };
    var text = two(d.getUTCHours()) + ':' + two(d.getUTCMinutes()) + ':' + two(d.getUTCSeconds());
    if (!el.firstChild || el.getAttribute('data-roll') !== '1') {
      el.setAttribute('data-roll', '1');
      el.innerHTML = '<span class="sr"></span>' + text.split('').map(function (ch) {
        return /\d/.test(ch) ? '<span class="rg" aria-hidden="true"><span class="rs">' + '01234567890'.split('').map(function (n) { return '<span>' + n + '</span>'; }).join('') + '</span></span>' : '<span aria-hidden="true">' + ch + '</span>';
      }).join('');
    }
    // screen readers get the time once a minute, as text, not ten digits per strip
    if (el.firstChild.textContent !== text.slice(0, 5)) el.firstChild.textContent = text.slice(0, 5);
    var digits = el.querySelectorAll('.rs'), k = 0;
    text.replace(/:/g, '').split('').forEach(function (ch) {
      var strip = digits[k++], to = +ch, from = strip._n == null ? to : strip._n;
      strip._n = to;
      if (to === from) { if (strip._snap == null) strip.style.transform = 'translateY(' + -to * 1.35 + 'em)'; return; }
      clearTimeout(strip._snap);
      strip.style.transition = '';
      if (back && to > from) { // wrapped backwards: from the last 0 (looks the same as the first), roll back to the digit
        strip.style.transition = 'none'; strip.style.transform = 'translateY(' + -10 * 1.35 + 'em)';
        void strip.offsetHeight; strip.style.transition = '';
        strip.style.transform = 'translateY(' + -to * 1.35 + 'em)'; strip._snap = null;
      } else if (!back && to < from) { // wrapped: roll on to the last 0, jump back to the first, and on to the digit
        // (a ticking clock lands on 0; the rewind can jump, 7 → 2)
        strip.style.transform = 'translateY(' + -10 * 1.35 + 'em)';
        strip._snap = setTimeout(function () {
          strip.style.transition = 'none'; strip.style.transform = 'translateY(0)'; strip._snap = null;
          if (to) { void strip.offsetHeight; strip.style.transition = ''; strip.style.transform = 'translateY(' + -to * 1.35 + 'em)'; }
        }, 450);
      } else { strip.style.transform = 'translateY(' + -to * 1.35 + 'em)'; strip._snap = null; }
    });
  }
  window.siteSky = { CITY: CITY, sunAt: sunAt, bgFor: bgFor, colours: colours, hex: hex, paintNotes: paintNotes, paintHome: paintHome, skyFor: skyFor, paintSky: paintSky, shownMs: shownMs, keepAt: keepAt, SKY_STOPS: SKY_STOPS, contrast: contrast, rollClock: rollClock };
})();
