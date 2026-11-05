/* The sky over the city, shared by the home page (day.js) and the notes (theme-boot.html, theme.js):
   where the sun is, and the colour of the page that goes with it. Loaded in <head>, before first paint.
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

  // page colour by the sun's height (degrees): night blue, dusk violet, sunrise warm, day near white
  var BG_STOPS = [[-18, [21, 25, 38]], [-9, [40, 46, 74]], [-4, [128, 120, 154]], [0, [222, 200, 190]], [5, [244, 230, 212]], [14, [247, 243, 234]], [28, [248, 248, 245]]];
  function mix(a, b, t) { return a + (b - a) * t; }
  function bgFor(alt) {
    if (alt <= BG_STOPS[0][0]) return BG_STOPS[0][1];
    for (var k = 1; k < BG_STOPS.length; k++) {
      var a1 = BG_STOPS[k][0], c1 = BG_STOPS[k][1], a0 = BG_STOPS[k - 1][0], c0 = BG_STOPS[k - 1][1];
      if (alt <= a1) { var t = (alt - a0) / (a1 - a0); return c0.map(function (v, j) { return mix(v, c1[j], t); }); }
    }
    return BG_STOPS[BG_STOPS.length - 1][1];
  }
  function hex(c) { return '#' + c.map(function (v) { var h = Math.round(Math.max(0, Math.min(255, v))).toString(16); return h.length < 2 ? '0' + h : h; }).join(''); }

  // the page colour, a slightly lifted "sheet" colour for cards and buttons, and whether light text is needed.
  // At dusk the sky passes through mid tones where neither dark nor light text reads well, so the colour keeps
  // its hue but is pushed darker (under light text) or lighter (under dark text) until the text has room.
  function colours(bg) {
    var lum = (.2126 * bg[0] + .7152 * bg[1] + .0722 * bg[2]) / 255, dark = lum < .55;
    if (dark && lum > .3) { var d = .3 / lum; bg = bg.map(function (v) { return v * d; }); }
    if (!dark && lum < .7) { var t = (.7 - lum) / (1 - lum); bg = bg.map(function (v) { return mix(v, 255, t); }); }
    var sheet = dark ? bg.map(function (v) { return v + 14; }) : bg.map(function (v) { return mix(v, 255, .7); });
    return { bg: hex(bg), sheet: hex(sheet), dark: dark };
  }

  // the notes: --sky and --sky-sheet on <html>, and night (light text) when the sky is dark
  function paintNotes(ms) {
    var c = colours(bgFor(sunAt(ms == null ? Date.now() : ms).alt)), root = document.documentElement.style;
    root.setProperty('--sky', c.bg); root.setProperty('--sky-sheet', c.sheet);
    return c.dark;
  }
  function isDark(ms) { return colours(bgFor(sunAt(ms == null ? Date.now() : ms).alt)).dark; }
  function clearNotes() {
    var root = document.documentElement.style;
    root.removeProperty('--sky'); root.removeProperty('--sky-sheet');
  }

  window.siteSky = { CITY: CITY, sunAt: sunAt, bgFor: bgFor, colours: colours, hex: hex, paintNotes: paintNotes, clearNotes: clearNotes, isDark: isDark };
})();
