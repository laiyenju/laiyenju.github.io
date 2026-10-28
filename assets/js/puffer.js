/*!
 * puffer.js — living ASCII 河豚 field for Yen's homepage
 *
 * Adapted from ascii-sharks (MIT) https://github.com/stackedlol/ascii-sharks
 * Copyright (c) 2026 drewdi — OceanEngine / AsciiRenderer patterns:
 * fixed timestep, offscreen pause, prefers-reduced-motion → still, DPR≤2,
 * wake diffusion. The 河豚 itself is the locked glyph frames, not a sampled blob.
 *
 * Motif change: paper-white (#fafaf7) transparent canvas, dark ink glyphs.
 * Creature: Ink-locked 96×42 rest/mid/full frames composited upright into the
 * field (eyes and spine stay the locked glyphs). Hover lerps toward mid;
 * click holds full. Drift does not rotate or chase.
 *
 * API: Puffer.mount(el, opts), Puffer.destroy(el), Puffer.setState(el, state)
 */
(function (global) {
  "use strict";

  var TAU = Math.PI * 2;
  var STEP = 1 / 60;
  var MAX_STEPS = 4;
  var FIELD_GLYPHS = "·:.'`,;:~-";
  var INK = [28, 27, 25];

  /* Ink-locked 96×42 frames. Creature layer only — the field stays procedural. */
  var FRAME_COLS = 96;
  var FRAME_ROWS = 42;
  var FRAME_TEXT = {
    rest: "                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                          ,,,%``.'%`.'                                          \n                                     '.8@@@@#8###@@@:...#`.                                     \n                                  .`##@#X#8#8S88X.:......::@''                                  \n                                 `X#88SS888XSXSS.:(\u00b7)..(\u00b7):..X.                                 \n                               %''XS8SSX%XXSX%8.:::.....:::::#,,                                \n                               :,`8XXX8%XXSX%SXX..::::-:::..@8`.                                \n                                 ,8SX8XSX%XX%S%%S:::.::.::.8#'.                                 \n                                  .,8XXSXtt%S%S%S%SSS%SX####',                                  \n                                     ,'8SSX8S8S8X888XXX#X`'                                     \n                                          .`..',`'t;;%S                                         \n                                                                                                \n                                        ..~~~~~~~~~~~~~..                                       \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n",
    mid: "                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                           tttStt%SS:                                           \n                                           ::t;%,,;SS                                           \n                                       ''`.,,'`.#@,,,`,,,                                       \n                                  `,,,.`@@#@#@@@#@###@##''',,                                   \n                               .`,'`@@#@8##@#8#@#@@@@@@@#@@@'',,'.                              \n                             '.'`###888@@@8#8#@#8@@@888#@@@@@###`,'                             \n                            ',.88@####8###X##XX88#8XX#X#@@@@@#@#@..,                            \n                          `''8##8##X#X88#S88888SXSS#8X88#8#8@@@#@@.`.                           \n                         '``8#8XX#8XXXXXXSSSSX88X8SSSSSXXXX#8#@#@#@#,'                          \n                        `',XXX#X#88XSXXS8X%8X%XX%SXX8S.:SX8#88#@@8#@@`.                         \n                       `'.####XXXX8XS88%XSXX%%SSX8.::...::::8X8#88#@@``,                        \n                      .'8#X8SX88X8SXXSXX%XSXS%XX:.:......:::..XXX###@@,,'                       \n                      :'.#8XXSSS88SXSS%%XXXXSXX..:(\u00b7)...:(\u00b7).::#8X@8@@@`,'                      \n                    S;%.,8X#XSS8S%%%X%%S%XXSX%8.:::.....::::::.#8X@8##@''                       \n                    %;:'.XXX8SS8XSSSSSX%XXSX%S8...::::::::..:.:8X###8#`.,                       \n                      t,,SX8XX8S%XX%SXXSX%XX%S%S.:::.::-::...:8X#8#@@@'`                        \n                       .,;8SS8XS%%SXXSSSX%%SXSSSXX.::::..:.:SX8X#XX#@@,,                        \n                        ``XSXXXS%SS%XS%X%%SX%S%XSXXXXSS8SX88SSSS88#8@',.                        \n                        '';8888StSSt%%%SS%tt%S%S%tStSttS%SS%XSXX8X#8@'`                         \n                        ,'.XX88XSXS%t%t%tS%%%%%StSt%tS%%SSSXS%#X88X8''                          \n                         '``,SXXXXSSSS%%S%%SStSt%tt%%SS%XSXSSX888X88.,                          \n                            ,``XS8%SXXt%%S%S%%t%tSS%SS%%XS88#XX8#'`,                            \n                             `.'.XX88XSXS%SSS%t%XXSSXX8SS88X#8X...                              \n                                ','`8XX888SSXXX8S88XS8SX8X#8.,`,                                \n                                   '.'S8SSXX888SSS8888XX8,'.`                                   \n                                     `''','`,,.``,``'..`';;                                     \n                                                    :;S;;%:                                     \n                                                                                                \n                                   ...~~~~~~~~~~~~~~~~~~~~~...                                  \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n",
    full: "                                         %t...,``@.`.%:                                         \n                                   ''.,..,,,,.'##@@#.,'```.`.                                   \n                               `','.`'`.;:@@#@@@##@###::,`',,,,,'                               \n                       ...`'`..'''';@@@@@#@#@@#@@#@@@#@@@@@@;'''...`                            \n                       '`';#'.`:@#@@@8@#8###88##8#8#@@@@@@#@@#@@..`''``,,''                     \n                       '':####@@###8@@@8#@@888#####8@##8@@@@##@@##@,`..`'`'                     \n                      .'`;8@@@88@88@@#@#@X@888X@#8#8@@##@#8@@@@@@#@@@@#@#..                     \n                    .`.'`#@88#@@@#XXX#XXX#X888X88X88X888##@#@###@@@@@@##:``'                    \n                   ,.''@88#@8###8#X8#8#8X8XX#X##X8X88##8X##8####8@@#@###@.`',                   \n                  ,.,,#8@8X8###888X###XXXXX88888SXXX8X8##XX8#8#8#@@#@@##@#...'                  \n                 ',':888#X88X#8X#8#SX8SXX8S8S888SXSSS8SX88#8X8#8#@8#8@#@@@@;.`.                 \n                `,`;@8XXX#XXXX8XXXSSXXSXSXX8XSX8X88XXX8XSXX##8X888#8#@#@#@##:''`                \n               ..`;8@X###XXX8X88SXXXSSS888SXSX8XS8X8SSSX8X88XXXXX8#8@8#88@#@#;'..               \n              `'.:X88888888S888SS8X8XXS88X%XX%%SSXS%S8%X88888S8S8X8888@##@#@@@;.,,              \n             ''`'X#X##X##SSSXSXXS88SX%SSX%SXXXX%S%%XS%SS8XXS888SX8X8#X@##@#@#@@',,.             \n          ',`'`X###8#8#888X8S8XSSXS%SSSSS%%%%SXXSX%SSSS:.SS8SX8XXS#X#XX@@@@@#@@:`'`             \n         '`';8###8X88#SXS8SSSS8%XXXS%SS%XS%XS%XXSX.::..:...:.:X88SS888X88#@8##@@`,,.            \n          ',.'88#8#8XS8XSS8888%SSSXS%XX%XSXX%%SX.:.::...::::.:::SSXX#X8X8@8#@8@@@@',.'`         \n          :;,`.#88#S8XXXX8SXSSXXSX%SSSXX%XSXS%8::.:......:::..:..XXXX##X#8##8##@@@#;.'.         \n        t%;:'',88X8S88SSS8XSS%%%XX%SSS%%XXXXS8X..:(\u00b7)...:.(\u00b7)::..S8S8#8XXXX####8@@.`'`          \n       %%t:;''.88XS8X8888XS8S%%X%%%%X%%S%XXSXS:.:::.....::::::.::.8SXX#X#88###@@#,''            \n       ::;%t.',X888XS8S8XSSSX%%XXSSSSSX%XXSX%S8...::::::::..:.::.88XSSX#X#88888##`,.            \n        %ttt'.`X#8SS8SSXXSSXSSX%%XX%SXXSX%SX%%S:.:::.::.-:...:...X888X#XX#X@8@@##,``            \n          tS,``:8X8X8SX8S8X%%XS%%%SXXSSSXt%SXSSX8..::::..:.:...X8SSX888XXX#8@8@@;.',            \n            t'':88SS8XSSXSS%SSSS%SS%XS%X%%SX%S%XS88.::::::..:SS%XX8S8SXXX##888#8:'`,            \n             `,.XSS8SSXSSSSXXXX%%XX%SSSXXSt%SXSXStX%8SS8X8XSXSXXXSXS8XSX8#XX@8##'`'             \n             ',,:S8888SX%S%SSXXS%XXS%S%S%XSSSSSX%X%S%XSSXXSXS%XSXXSS8S#8888#@#8:`.'             \n             ',`,8XSXX8%%%S%%t%%%%%%SS%%S%%SStSt%tt%%SStS%S%tt%SS%S%X%SS8X8@#@@'''.             \n              ,`'SSS8S88%t%%%%S%tSt%%St%%S%S%%t%tSS%SSttS%S%SttSXX%SXSX8X8X@88`.,.              \n              ,`88SSSS888%S%%ttS%%%SS%tS%t%SS%t%SS%%SSSttSStSS%XXS%S%XX#X#XX@;'.`               \n             `''SX8XX8XXSSXSt%S%%%S%S%%SSStt%%%StSS%tSt%S%S%%S%XXSSSSX8XXX8#8@`''               \n             ''..'`':88SS8XX%t%tS%St%StStt%%SSStttSSSS%%S%t%%S%%%SS88X88XX#XX@;``               \n                 ',...S88SSSXXXStStt%tSS%%SSttt%%tt%%%Stt%SXXXX%%X#XX888#@@@;,,'.'              \n                   ..``888S8%8XX%%%SttStSSt%S%SSS%S%t%tt%%%XS%%XX8#88XX8X'`,,'```               \n                    ..'.'X8SXS88S%%%S%%%%S%S%%tt%S%t%%tSSXXXXXXXS##88XX.''``                    \n                      `,''`XXS8XS8SSSXtSS%StS%tSSt%SS%SXS888S8SXX8X#8..,,'                      \n                        '..,'XX8XXXSS8SXS8XX8%%X8X8XSXX8SSXSSXX#X##'.`',                        \n                          `,,,,`SXXSX%8SXSSSXSX88XXS88SX8SXX#8X#``',''                          \n                            ,.'''8X8XSXSSX8SS8S88XSSSXXXXXSS8..'.,,,                            \n                               ,,S8SX.``;:X8X888SXXXS8X8SS8S',','                               \n                               `.,`.,`..`,''''''',.'.','.8S...S                                 \n                             ...`''`~~~~~',``''``.'''S:%`'.'`S;.....                            \n"
  };

  function parseFrame(text) {
    var lines = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    if (lines.length && lines[lines.length - 1] === "") lines.pop();
    while (lines.length < FRAME_ROWS) lines.push(new Array(FRAME_COLS + 1).join(" "));
    return lines.slice(0, FRAME_ROWS).map(function (line) {
      if (line.length < FRAME_COLS) return line + new Array(FRAME_COLS - line.length + 1).join(" ");
      return line.slice(0, FRAME_COLS);
    });
  }

  var GRIDS = {
    rest: parseFrame(FRAME_TEXT.rest),
    mid: parseFrame(FRAME_TEXT.mid),
    full: parseFrame(FRAME_TEXT.full)
  };
  var FRAME_STATES = [GRIDS.rest, GRIDS.mid, GRIDS.full];
  var BLEND_ROWS = new Array(FRAME_ROWS);
  /* '1' / '2' where idle adds a light spine around the locked rest body. */
  var SPINE_MASK = null;

  /**
   * Rest frame is a small lens. Grow it one contour step — outward spines
   * on cells mid already inks — so idle reads as a 河豚. Mid/full grids stay locked.
   */
  (function augmentRest() {
    var rest = GRIDS.rest;
    var mid = GRIDS.mid;
    var body = {};
    var y, x, ch;
    for (y = 0; y < FRAME_ROWS; y++) {
      for (x = 0; x < FRAME_COLS; x++) {
        ch = rest[y].charAt(x);
        if (ch !== " " && ch !== "~") body[x + "," + y] = true;
      }
    }
    function ringAround(src, blocked) {
      var out = {};
      var key, parts, px, py, dy, dx, nx, ny, k;
      for (key in src) {
        if (!Object.prototype.hasOwnProperty.call(src, key)) continue;
        parts = key.split(",");
        px = +parts[0];
        py = +parts[1];
        for (dy = -1; dy <= 1; dy++) {
          for (dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            nx = px + dx;
            ny = py + dy;
            if (nx < 0 || ny < 0 || nx >= FRAME_COLS || ny >= FRAME_ROWS) continue;
            k = nx + "," + ny;
            if (blocked[k] || src[k]) continue;
            if (mid[ny].charAt(nx) === " ") continue;
            out[k] = [nx, ny];
          }
        }
      }
      return out;
    }
    function outwardGlyph(nx, ny) {
      var sx = 0;
      var sy = 0;
      var n = 0;
      var dy, dx, k;
      for (dy = -2; dy <= 2; dy++) {
        for (dx = -2; dx <= 2; dx++) {
          k = nx + dx + "," + (ny + dy);
          if (!body[k]) continue;
          sx += nx + dx;
          sy += ny + dy;
          n++;
        }
      }
      var ax = n ? nx - sx / n : 0;
      var ay = n ? ny - sy / n : -1;
      var adx = Math.abs(ax);
      var ady = Math.abs(ay);
      // Belly stays a short tick so idle doesn't grow a bar curtain.
      if (ay > adx * 0.45) return "'";
      if (ady > adx * 1.2) return "|";
      if (adx > ady * 1.2) return ":";
      return ax * ay >= 0 ? "\\" : "/";
    }
    var ring1 = ringAround(body, body);
    var blocked = {};
    var key;
    for (key in body) blocked[key] = true;
    for (key in ring1) blocked[key] = true;
    var ring2 = ringAround(ring1, blocked);
    var rows = [];
    var mask = [];
    for (y = 0; y < FRAME_ROWS; y++) {
      rows.push(rest[y].split(""));
      mask.push(new Array(FRAME_COLS + 1).join("0"));
    }
    function paint(ring, mark) {
      var k, nx, ny, glyph, chars;
      for (k in ring) {
        if (!Object.prototype.hasOwnProperty.call(ring, k)) continue;
        nx = ring[k][0];
        ny = ring[k][1];
        glyph = outwardGlyph(nx, ny);
        rows[ny][nx] = glyph;
        chars = mask[ny].split("");
        chars[nx] = mark;
        mask[ny] = chars.join("");
      }
    }
    paint(ring1, "1");
    GRIDS.rest = rows.map(function (chars) {
      return chars.join("");
    });
    FRAME_STATES[0] = GRIDS.rest;
    SPINE_MASK = mask;
  })();

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function blendChar(ca, cb, t) {
    if (t <= 0.02) return ca;
    if (t >= 0.98) return cb;
    if (ca === " " && cb === " ") return " ";
    if (ca === " ") return t > 0.42 ? cb : " ";
    if (cb === " ") return t < 0.58 ? ca : " ";
    return t < 0.5 ? ca : cb;
  }

  function sampleGrid(level) {
    level = clamp(level, 0, 2);
    var i0 = Math.floor(level);
    if (i0 >= 2) return GRIDS.full;
    var t = level - i0;
    var a = FRAME_STATES[i0];
    var b = FRAME_STATES[i0 + 1];
    if (t <= 0.02) return a;
    if (t >= 0.98) return b;
    for (var y = 0; y < FRAME_ROWS; y++) {
      var la = a[y];
      var lb = b[y];
      var chars = new Array(FRAME_COLS);
      for (var x = 0; x < FRAME_COLS; x++) chars[x] = blendChar(la.charAt(x), lb.charAt(x), t);
      BLEND_ROWS[y] = chars.join("");
    }
    return BLEND_ROWS;
  }

  /** Fit the locked frame at field-cell size when the stage can hold 96×42. */
  function fishLayout(width, height, cw, ch) {
    cw = cw || 11;
    ch = ch || 16;
    var aligned = cw * FRAME_COLS <= width * 0.98 && ch * FRAME_ROWS <= height * 0.92;
    var fishCw = cw;
    var fishCh = ch;
    if (!aligned) {
      fishCw = (width * 0.92) / FRAME_COLS;
      fishCh = fishCw * (ch / cw);
      var maxH = height * 0.86;
      if (fishCh * FRAME_ROWS > maxH) {
        fishCh = maxH / FRAME_ROWS;
        fishCw = fishCh * (cw / ch);
      }
    }
    return {
      fishCw: fishCw,
      fishCh: fishCh,
      gridW: fishCw * FRAME_COLS,
      gridH: fishCh * FRAME_ROWS,
      aligned: aligned
    };
  }

  function glyphInk(ch) {
    if (".,'`".indexOf(ch) >= 0) return { rgba: "rgba(63,60,55,0.62)" };
    if (":;".indexOf(ch) >= 0) return { rgba: "rgba(63,60,55,0.8)" };
    if ("·".indexOf(ch) >= 0 || ch === "(" || ch === ")") return { rgba: "rgba(28,27,25,1)" };
    return { rgba: "rgba(28,27,25,0.94)" };
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }
  function rand(lo, hi) {
    return lo + Math.random() * (hi - lo);
  }
  function angleDiff(a, b) {
    var d = (b - a) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return d;
  }
  function hash3(x, y, z) {
    var h =
      Math.imul(x | 0, 374761393) ^
      Math.imul(y | 0, 668265263) ^
      Math.imul(z | 0, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function smoothstep(e0, e1, x) {
    var t = clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  var K1 = 1 / 280;
  var K2 = 1 / 320;
  var K3 = 1 / 200;
  var CURRENT_SCALE = 2800;
  function current(x, y, t, out) {
    var a = x * K1 + t * 0.06;
    var b = y * K2 - t * 0.045;
    var c = (x + y) * K3 + t * 0.09;
    out.x = (-K2 * Math.sin(a) * Math.sin(b) + 0.5 * K3 * Math.cos(c)) * CURRENT_SCALE;
    out.y = (-K1 * Math.cos(a) * Math.cos(b) - 0.5 * K3 * Math.cos(c)) * CURRENT_SCALE;
    return out;
  }

  /* —— World: ambient field particles + one puffer —— */
  function World() {
    this.width = 0;
    this.height = 0;
    this.time = 0;
    this.particles = [];
    this.puffer = null;
    this.events = [];
    this.pointer = { x: 0, y: 0, active: false };
    this._cur = { x: 0, y: 0 };
  }

  World.prototype.resize = function (width, height, cellW, cellH) {
    var first = this.width === 0;
    this.width = width;
    this.height = height;
    this.cellW = cellW;
    this.cellH = cellH;
    if (first || !this.puffer) this.seed();
    else {
      this.puffer.x = clamp(this.puffer.x, width * 0.15, width * 0.85);
      this.puffer.y = clamp(this.puffer.y, height * 0.2, height * 0.75);
    }
  };

  World.prototype.seed = function () {
    var W = this.width;
    var H = this.height;
    var n = clamp(Math.round((W * H) / 5200), 90, 220);
    this.particles = [];
    for (var i = 0; i < n; i++) {
      var ang = rand(0, TAU);
      var spd = rand(8, 22);
      this.particles.push({
        x: rand(0, W),
        y: rand(0, H),
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        phase: rand(0, TAU),
        depth: rand(0.35, 1),
        glyph: FIELD_GLYPHS[(Math.random() * FIELD_GLYPHS.length) | 0],
        kind: Math.random() < 0.18 ? 1 : 0 // 1 = slightly larger dash
      });
    }

    this.puffer = {
      x: W * 0.5,
      y: H * 0.48,
      inflate: 0, // continuous 0 rest .. 1 mid .. 2 full
      targetInflate: 0,
      holdFullUntil: 0,
      halfW: Math.min(W, H) * 0.22,
      halfH: Math.min(W, H) * 0.16
    };
  };

  World.prototype.splash = function (x, y) {
    this.events.push({ kind: "splash", x: x, y: y });
    var p = this.puffer;
    if (p) {
      // Click anywhere on the stage: obvious full, then ease back.
      p.targetInflate = 2;
      p.holdFullUntil = this.time + 1.9;
    }
    var r = 200;
    for (var i = 0; i < this.particles.length; i++) {
      var f = this.particles[i];
      var dx = f.x - x;
      var dy = f.y - y;
      var dd = Math.hypot(dx, dy);
      if (dd > r || dd < 1e-3) continue;
      var k = (1 - dd / r) * 180;
      f.vx += (dx / dd) * k;
      f.vy += (dy / dd) * k;
    }
  };

  World.prototype.step = function (dt) {
    this.time += dt;
    this.stepParticles(dt);
    this.stepPuffer(dt);
  };

  World.prototype.stepParticles = function (dt) {
    var W = this.width;
    var H = this.height;
    var t = this.time;
    var cur = this._cur;
    var puf = this.puffer;
    var fearRx = puf ? puf.halfW || 160 : 0;
    var fearRy = puf ? puf.halfH || 110 : 0;

    for (var i = 0; i < this.particles.length; i++) {
      var f = this.particles[i];
      current(f.x, f.y, t, cur);
      var ax = cur.x * 0.35 + (Math.random() - 0.5) * 28;
      var ay = cur.y * 0.35 + (Math.random() - 0.5) * 28;

      if (puf && fearRx > 1 && fearRy > 1) {
        var dx = f.x - puf.x;
        var dy = f.y - puf.y;
        var nd = Math.hypot(dx / fearRx, dy / fearRy);
        var d = Math.hypot(dx, dy);
        if (nd < 1.2 && d > 1e-3) {
          var w = Math.pow(1 - nd / 1.2, 2) * (50 + puf.inflate * 30);
          ax += (dx / d) * w;
          ay += (dy / d) * w;
        }
      }

      if (this.pointer.active) {
        var px = f.x - this.pointer.x;
        var py = f.y - this.pointer.y;
        var pd = Math.hypot(px, py);
        if (pd < 100 && pd > 1e-3) {
          var pw = Math.pow(1 - pd / 100, 2) * 90;
          ax += (px / pd) * pw;
          ay += (py / pd) * pw;
        }
      }

      f.vx += ax * dt;
      f.vy += ay * dt;
      var spd = Math.hypot(f.vx, f.vy);
      var maxS = 36 + f.depth * 12;
      if (spd > maxS) {
        f.vx *= maxS / spd;
        f.vy *= maxS / spd;
      }
      f.vx *= Math.exp(-dt * 0.35);
      f.vy *= Math.exp(-dt * 0.35);
      // keep a cruise so the field never freezes
      if (spd < 6) {
        current(f.x, f.y, t + i, cur);
        var cl = Math.hypot(cur.x, cur.y) || 1;
        f.vx += (cur.x / cl) * 10 * dt;
        f.vy += (cur.y / cl) * 10 * dt;
      }

      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.phase += dt * (2.5 + spd * 0.08);

      // wrap quietly
      if (f.x < -20) f.x = W + 20;
      else if (f.x > W + 20) f.x = -20;
      if (f.y < -20) f.y = H + 20;
      else if (f.y > H + 20) f.y = -20;
    }
  };

  World.prototype.stepPuffer = function (dt) {
    var p = this.puffer;
    if (!p) return;
    var W = this.width;
    var H = this.height;
    var t = this.time;
    var layout = fishLayout(W, H, this.cellW, this.cellH);
    // Upright frame. A few pixels of drift — no rotation, no cursor chase.
    var driftX = this.still ? 0 : Math.sin(t * 0.22) * 8;
    var driftY = this.still ? 0 : Math.cos(t * 0.17) * 5;
    var top = Math.max(52, (H - layout.gridH) * 0.5 - H * 0.02);
    p.x = W * 0.5 + driftX;
    p.y = top + layout.gridH * 0.5 + driftY;
    var span = clamp(p.inflate / 2, 0, 1);
    p.halfW = layout.gridW * (0.22 + 0.26 * span);
    p.halfH = layout.gridH * (0.2 + 0.26 * span);

    if (this.still) {
      p.inflate = 0;
      p.targetInflate = 0;
      return;
    }

    var breath = (Math.sin(t * 0.7) + 1) / 2;
    breath = easeInOut(breath);
    var idle = breath * 0.16; // rest body + light spines; below the mid swap

    var target = idle;
    if (t < p.holdFullUntil) {
      target = 2;
    } else if (this.pointer.active) {
      var dx = (this.pointer.x - p.x) / Math.max(90, layout.gridW * 0.46);
      var dy = (this.pointer.y - p.y) / Math.max(70, layout.gridH * 0.5);
      var dist = Math.sqrt(dx * dx + dy * dy);
      var prox = dist >= 1 ? 0 : (1 - dist) * (1 - dist);
      if (prox > 0.001) target = idle + (1 - idle) * easeInOut(prox);
    }
    p.targetInflate = target;
    var speed = target > p.inflate ? 3.4 : 1.7;
    var diff = target - p.inflate;
    if (Math.abs(diff) < 0.002) p.inflate = target;
    else p.inflate += Math.sign(diff) * Math.min(Math.abs(diff), speed * dt);
  };

  /* —— Paper-mode ASCII renderer —— */
  function AsciiRenderer(canvas) {
    var ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("2D canvas unavailable");
    this.canvas = canvas;
    this.ctx = ctx;
    this.dpr = 1;
    this.width = 0;
    this.height = 0;
    this.cw = 11;
    this.ch = 16;
    this.cols = 0;
    this.rows = 0;
    this.fontFamily = '"JetBrains Mono", ui-monospace, monospace';
    this.energy = new Float32Array(0);
    this.energyTmp = new Float32Array(0);
    this.cellFlag = new Uint8Array(0); // 0 empty, 1 body, 2 edge, 3 spine, 4 eye, 5 fin
    this.cellShade = new Float32Array(0);
    this.cellKey = new Uint32Array(0);
    this.particleStamp = new Uint32Array(0);
    this.frameId = 0;
    this.hitFlag = 0;
    this.hitShade = 0;
    this.hitDist = 0;
  }

  Object.defineProperty(AsciiRenderer.prototype, "cellWidth", {
    get: function () {
      return this.cw;
    }
  });
  Object.defineProperty(AsciiRenderer.prototype, "cellHeight", {
    get: function () {
      return this.ch;
    }
  });

  AsciiRenderer.prototype.setFontFamily = function (family) {
    if (family) this.fontFamily = family;
  };

  AsciiRenderer.prototype.resize = function (width, height, dpr) {
    var prevCols = this.cols;
    var prevRows = this.rows;
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.cw = clamp(Math.round(width / 118), 8, 13);
    this.ch = Math.round(this.cw * 1.45);
    this.cols = Math.ceil(width / this.cw);
    this.rows = Math.ceil(height / this.ch);
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    var n = this.cols * this.rows;
    if (this.cols !== prevCols || this.rows !== prevRows) {
      this.energy = new Float32Array(n);
      this.energyTmp = new Float32Array(n);
      this.cellFlag = new Uint8Array(n);
      this.cellShade = new Float32Array(n);
      this.cellKey = new Uint32Array(n);
      this.particleStamp = new Uint32Array(n);
    }
  };

  AsciiRenderer.prototype.cellIndex = function (x, y) {
    var c = Math.floor(x / this.cw);
    var r = Math.floor(y / this.ch);
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return -1;
    return r * this.cols + c;
  };

  AsciiRenderer.prototype.stamp = function (field, x, y, radius, amount) {
    var c0 = Math.floor(x / this.cw);
    var r0 = Math.floor(y / this.ch);
    for (var r = r0 - radius; r <= r0 + radius; r++) {
      for (var c = c0 - radius; c <= c0 + radius; c++) {
        if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) continue;
        var d = Math.hypot(c - c0, (r - r0) * 1.4);
        if (d > radius + 0.5) continue;
        var i = r * this.cols + c;
        field[i] = Math.min(1.5, field[i] + amount * (1 - d / (radius + 1)));
      }
    }
  };

  AsciiRenderer.prototype.consumeEvents = function (world) {
    for (var i = 0; i < world.events.length; i++) {
      var e = world.events[i];
      this.stamp(this.energy, e.x, e.y, 5, 1.1);
    }
    world.events.length = 0;
  };

  AsciiRenderer.prototype.depositWake = function (world) {
    var energy = this.energy;
    var p = world.puffer;
    if (p) {
      var rad = 2 + ((p.inflate * 0.8) | 0);
      this.stamp(energy, p.x, p.y + (p.halfH || 40) * 0.72, rad, 0.035);
    }
    if (world.pointer.active) {
      this.stamp(energy, world.pointer.x, world.pointer.y, 1, 0.05);
    }
    for (var i = 0; i < world.particles.length; i++) {
      var f = world.particles[i];
      if (f.kind !== 1) continue;
      var idx = this.cellIndex(f.x, f.y);
      if (idx >= 0) energy[idx] = Math.min(1.4, energy[idx] + 0.008);
    }
  };

  AsciiRenderer.prototype.diffuse = function (dt) {
    var cols = this.cols;
    var rows = this.rows;
    var energy = this.energy;
    var tmp = this.energyTmp;
    var decay = Math.exp(-dt * 1.35);
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var i = r * cols + c;
        var l = c > 0 ? energy[i - 1] : energy[i];
        var rt = c < cols - 1 ? energy[i + 1] : energy[i];
        var u = r > 0 ? energy[i - cols] : energy[i];
        var d = r < rows - 1 ? energy[i + cols] : energy[i];
        tmp[i] = (energy[i] * 4 + l + rt + u + d) * 0.125 * decay;
      }
    }
    this.energy = tmp;
    this.energyTmp = energy;
  };

  AsciiRenderer.prototype.stampLockedFrame = function (p) {
    var flag = this.cellFlag;
    flag.fill(0);
    this.frameGrid = null;
    if (!p) return;
    var layout = fishLayout(this.width, this.height, this.cw, this.ch);
    var grid = sampleGrid(p.inflate);
    var ox = p.x - layout.gridW / 2;
    var oy = p.y - layout.gridH / 2;
    if (layout.aligned) {
      ox = Math.round(ox / this.cw) * this.cw;
      oy = Math.round(oy / this.ch) * this.ch;
    }
    this.fishOx = ox;
    this.fishOy = oy;
    this.fishCw = layout.fishCw;
    this.fishCh = layout.fishCh;
    this.frameGrid = grid;
    this.inflateLevel = p.inflate;
    var cols = this.cols;
    var rows = this.rows;
    for (var r = 0; r < FRAME_ROWS; r++) {
      var line = grid[r];
      var y = oy + (r + 0.5) * layout.fishCh;
      for (var c = 0; c < FRAME_COLS; c++) {
        if (line.charAt(c) === " ") continue;
        var x = ox + (c + 0.5) * layout.fishCw;
        var cc = Math.floor(x / this.cw);
        var rr = Math.floor(y / this.ch);
        if (cc < 0 || rr < 0 || cc >= cols || rr >= rows) continue;
        flag[rr * cols + cc] = 1;
      }
    }
  };

  AsciiRenderer.prototype.drawLockedFrame = function () {
    var grid = this.frameGrid;
    if (!grid) return;
    var ctx = this.ctx;
    var cw = this.fishCw;
    var ch = this.fishCh;
    var ox = this.fishOx;
    var oy = this.fishOy;
    ctx.save();
    ctx.font = "500 " + Math.max(9, Math.round(ch * 0.92)) + "px " + this.fontFamily;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (var r = 0; r < FRAME_ROWS; r++) {
      var line = grid[r];
      var yy = oy + (r + 0.5) * ch;
      for (var c = 0; c < FRAME_COLS; c++) {
        var glyph = line.charAt(c);
        if (glyph === " ") continue;
        var mark =
          SPINE_MASK && this.inflateLevel < 0.5 ? SPINE_MASK[r].charAt(c) : "0";
        if (mark === "1") ctx.fillStyle = "rgba(63,60,55,0.58)";
        else if (mark === "2") ctx.fillStyle = "rgba(63,60,55,0.4)";
        else ctx.fillStyle = glyphInk(glyph).rgba;
        ctx.fillText(glyph, ox + (c + 0.5) * cw, yy);
      }
    }
    ctx.restore();
  };

  AsciiRenderer.prototype.render = function (world, dt) {
    var ctx = this.ctx;
    var dpr = this.dpr;
    var cols = this.cols;
    var rows = this.rows;
    var cw = this.cw;
    var ch = this.ch;
    if (cols === 0) return;
    var t = world.time;
    var W = this.width;
    var H = this.height;

    this.consumeEvents(world);
    this.stampLockedFrame(world.puffer);
    this.depositWake(world);
    this.diffuse(dt);

    // clear to transparent — page paper shows through
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.font = "500 " + Math.round(ch * 0.72) + "px " + this.fontFamily;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // wake field as soft ink dots
    var energy = this.energy;
    var cellFlag = this.cellFlag;
    var n = cols * rows;
    for (var i = 0; i < n; i++) {
      var e = energy[i];
      if (e < 0.12 || cellFlag[i]) continue;
      var col = i % cols;
      var row = (i / cols) | 0;
      var a = clamp((e - 0.12) * 0.55, 0.04, 0.28);
      ctx.fillStyle = "rgba(" + INK[0] + "," + INK[1] + "," + INK[2] + "," + a.toFixed(3) + ")";
      var g = e > 0.55 ? ":" : "·";
      ctx.fillText(g, col * cw + cw / 2, row * ch + ch / 2 + 1);
    }

    // ambient particles
    var frame = ++this.frameId;
    var stamp = this.particleStamp;
    for (var pi = 0; pi < world.particles.length; pi++) {
      var f = world.particles[pi];
      var idx = this.cellIndex(f.x, f.y);
      if (idx < 0 || cellFlag[idx] || stamp[idx] === frame) continue;
      stamp[idx] = frame;
      var alpha = (0.18 + 0.35 * f.depth) * (0.75 + 0.25 * Math.sin(f.phase));
      alpha = clamp(alpha, 0.1, 0.48);
      ctx.fillStyle =
        "rgba(" + INK[0] + "," + INK[1] + "," + INK[2] + "," + alpha.toFixed(3) + ")";
      var glyph = f.kind ? "-" : f.glyph;
      ctx.fillText(glyph, (idx % cols) * cw + cw / 2, ((idx / cols) | 0) * ch + ch / 2 + 1);
    }

    this.drawLockedFrame();
  };

  /* —— Engine (OceanEngine patterns) —— */
  function Engine(canvas) {
    this.canvas = canvas;
    this.world = new World();
    this.renderer = new AsciiRenderer(canvas);
    var family = getComputedStyle(canvas).fontFamily || '"JetBrains Mono", monospace';
    this.renderer.setFontFamily(family);
    this.raf = 0;
    this.last = 0;
    this.acc = 0;
    this.visible = true;
    this.disposed = false;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    this.resizeObserver = new ResizeObserver(this.resize.bind(this));
    this.resizeObserver.observe(canvas.parentElement || canvas);
    this.intersectionObserver = new IntersectionObserver(
      function (entries) {
        this.visible = !!(entries[0] && entries[0].isIntersecting);
        this.schedule();
      }.bind(this),
      { threshold: 0.01 }
    );
    this.intersectionObserver.observe(canvas);

    this.onMotion = this.onMotion.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.frame = this.frame.bind(this);

    this.reducedMotion.addEventListener("change", this.onMotion);
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("pointerdown", this.onPointerDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", this.onPointerLeave);
    window.addEventListener("blur", this.onPointerLeave);

    this.resize();
    var self = this;
    if (document.fonts && document.fonts.load) {
      document.fonts.load("500 16px " + family).then(function () {
        if (!self.disposed && self.reducedMotion.matches) self.drawStill();
      });
    }
    this.schedule();
  }

  Engine.prototype.destroy = function () {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.reducedMotion.removeEventListener("change", this.onMotion);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerdown", this.onPointerDown);
    document.documentElement.removeEventListener("pointerleave", this.onPointerLeave);
    window.removeEventListener("blur", this.onPointerLeave);
  };

  Engine.prototype.resize = function () {
    var el = this.canvas.parentElement || this.canvas;
    var rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.resize(rect.width, rect.height, dpr);
    this.world.still = this.reducedMotion.matches;
    this.world.resize(rect.width, rect.height, this.renderer.cellWidth, this.renderer.cellHeight);
    if (this.reducedMotion.matches) this.drawStill();
  };

  Engine.prototype.schedule = function () {
    cancelAnimationFrame(this.raf);
    if (this.disposed || !this.visible || this.reducedMotion.matches) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  };

  Engine.prototype.frame = function (now) {
    var dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.acc += dt;
    var steps = 0;
    while (this.acc >= STEP && steps < MAX_STEPS) {
      this.world.step(STEP);
      this.acc -= STEP;
      steps++;
    }
    if (steps === MAX_STEPS) this.acc = 0;
    this.renderer.render(this.world, dt);
    this.raf = requestAnimationFrame(this.frame);
  };

  Engine.prototype.drawStill = function () {
    if (this.world.time < 3) {
      for (var i = 0; i < 180; i++) this.world.step(STEP);
    }
    this.renderer.render(this.world, STEP);
  };

  Engine.prototype.onMotion = function () {
    this.world.still = this.reducedMotion.matches;
    if (this.reducedMotion.matches) {
      cancelAnimationFrame(this.raf);
      if (this.world.puffer) this.world.puffer.inflate = 0;
      this.drawStill();
    } else {
      this.schedule();
    }
  };

  Engine.prototype.toLocal = function (e) {
    var rect = this.canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    return { x: x, y: y, inside: inside };
  };

  Engine.prototype.onPointerMove = function (e) {
    var loc = this.toLocal(e);
    var p = this.world.pointer;
    p.x = loc.x;
    p.y = loc.y;
    p.active = loc.inside && e.pointerType !== "touch";
  };

  Engine.prototype.onPointerDown = function (e) {
    var loc = this.toLocal(e);
    if (loc.inside && !this.reducedMotion.matches) this.world.splash(loc.x, loc.y);
  };

  Engine.prototype.onPointerLeave = function () {
    this.world.pointer.active = false;
  };

  Engine.prototype.setState = function (state) {
    var map = { rest: 0, mid: 1, full: 2 };
    if (!(state in map) || !this.world.puffer) return;
    this.world.puffer.targetInflate = map[state];
    this.world.puffer.inflate = map[state];
    if (state === "full") this.world.puffer.holdFullUntil = this.world.time + 2;
  };

  /* —— public API —— */
  var instances = new WeakMap();

  var Puffer = {
    mount: function (el, opts) {
      if (!el || el.tagName !== "CANVAS") return null;
      var prev = instances.get(el);
      if (prev) prev.destroy();
      // ensure mono face for ASCII
      el.style.fontFamily = '"JetBrains Mono", ui-monospace, monospace';
      var eng = new Engine(el);
      instances.set(el, eng);
      return eng;
    },
    destroy: function (el) {
      var eng = instances.get(el);
      if (eng) {
        eng.destroy();
        instances.delete(el);
      }
    },
    setState: function (el, state) {
      var eng = instances.get(el);
      if (eng) eng.setState(state);
    }
  };

  global.Puffer = Puffer;
})(typeof window !== "undefined" ? window : this);
