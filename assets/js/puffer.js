/*!
 * puffer.js — living ASCII 河豚 for Yen's homepage
 * Frames: Ink 96×42 rest→mid→full (ascii-sharks pipeline, paper light mode)
 * API: Puffer.mount(el, {fps}), Puffer.destroy(el), Puffer.setState(el, state)
 */
(function (global) {
  "use strict";

  var COLS = 96;
  var ROWS = 42;
  var INK = "#5c574f";
  var INK_DEEP = "#1c1b19";
  var STATES = ["rest", "mid", "full"];
  var STATE_INDEX = { rest: 0, mid: 1, full: 2 };

  var FRAMES = {
    rest: "                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                          ,,,%``.'%`.'                                          \n                                     '.8@@@@#8###@@@:...#`.                                     \n                                  .`##@#X#8#8S88X.:......::@''                                  \n                                 `X#88SS888XSXSS.:(\u00b7)..(\u00b7):..X.                                 \n                               %''XS8SSX%XXSX%8.:::.....:::::#,,                                \n                               :,`8XXX8%XXSX%SXX..::::-:::..@8`.                                \n                                 ,8SX8XSX%XX%S%%S:::.::.::.8#'.                                 \n                                  .,8XXSXtt%S%S%S%SSS%SX####',                                  \n                                     ,'8SSX8S8S8X888XXX#X`'                                     \n                                          .`..',`'t;;%S                                         \n                                                                                                \n                                        ..~~~~~~~~~~~~~..                                       \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n",
    mid: "                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                           tttStt%SS:                                           \n                                           ::t;%,,;SS                                           \n                                       ''`.,,'`.#@,,,`,,,                                       \n                                  `,,,.`@@#@#@@@#@###@##''',,                                   \n                               .`,'`@@#@8##@#8#@#@@@@@@@#@@@'',,'.                              \n                             '.'`###888@@@8#8#@#8@@@888#@@@@@###`,'                             \n                            ',.88@####8###X##XX88#8XX#X#@@@@@#@#@..,                            \n                          `''8##8##X#X88#S88888SXSS#8X88#8#8@@@#@@.`.                           \n                         '``8#8XX#8XXXXXXSSSSX88X8SSSSSXXXX#8#@#@#@#,'                          \n                        `',XXX#X#88XSXXS8X%8X%XX%SXX8S.:SX8#88#@@8#@@`.                         \n                       `'.####XXXX8XS88%XSXX%%SSX8.::...::::8X8#88#@@``,                        \n                      .'8#X8SX88X8SXXSXX%XSXS%XX:.:......:::..XXX###@@,,'                       \n                      :'.#8XXSSS88SXSS%%XXXXSXX..:(\u00b7)...:(\u00b7).::#8X@8@@@`,'                      \n                    S;%.,8X#XSS8S%%%X%%S%XXSX%8.:::.....::::::.#8X@8##@''                       \n                    %;:'.XXX8SS8XSSSSSX%XXSX%S8...::::::::..:.:8X###8#`.,                       \n                      t,,SX8XX8S%XX%SXXSX%XX%S%S.:::.::-::...:8X#8#@@@'`                        \n                       .,;8SS8XS%%SXXSSSX%%SXSSSXX.::::..:.:SX8X#XX#@@,,                        \n                        ``XSXXXS%SS%XS%X%%SX%S%XSXXXXSS8SX88SSSS88#8@',.                        \n                        '';8888StSSt%%%SS%tt%S%S%tStSttS%SS%XSXX8X#8@'`                         \n                        ,'.XX88XSXS%t%t%tS%%%%%StSt%tS%%SSSXS%#X88X8''                          \n                         '``,SXXXXSSSS%%S%%SStSt%tt%%SS%XSXSSX888X88.,                          \n                            ,``XS8%SXXt%%S%S%%t%tSS%SS%%XS88#XX8#'`,                            \n                             `.'.XX88XSXS%SSS%t%XXSSXX8SS88X#8X...                              \n                                ','`8XX888SSXXX8S88XS8SX8X#8.,`,                                \n                                   '.'S8SSXX888SSS8888XX8,'.`                                   \n                                     `''','`,,.``,``'..`';;                                     \n                                                    :;S;;%:                                     \n                                                                                                \n                                   ...~~~~~~~~~~~~~~~~~~~~~...                                  \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n",
    full: "                                         %t...,``@.`.%:                                         \n                                   ''.,..,,,,.'##@@#.,'```.`.                                   \n                               `','.`'`.;:@@#@@@##@###::,`',,,,,'                               \n                       ...`'`..'''';@@@@@#@#@@#@@#@@@#@@@@@@;'''...`                            \n                       '`';#'.`:@#@@@8@#8###88##8#8#@@@@@@#@@#@@..`''``,,''                     \n                       '':####@@###8@@@8#@@888#####8@##8@@@@##@@##@,`..`'`'                     \n                      .'`;8@@@88@88@@#@#@X@888X@#8#8@@##@#8@@@@@@#@@@@#@#..                     \n                    .`.'`#@88#@@@#XXX#XXX#X888X88X88X888##@#@###@@@@@@##:``'                    \n                   ,.''@88#@8###8#X8#8#8X8XX#X##X8X88##8X##8####8@@#@###@.`',                   \n                  ,.,,#8@8X8###888X###XXXXX88888SXXX8X8##XX8#8#8#@@#@@##@#...'                  \n                 ',':888#X88X#8X#8#SX8SXX8S8S888SXSSS8SX88#8X8#8#@8#8@#@@@@;.`.                 \n                `,`;@8XXX#XXXX8XXXSSXXSXSXX8XSX8X88XXX8XSXX##8X888#8#@#@#@##:''`                \n               ..`;8@X###XXX8X88SXXXSSS888SXSX8XS8X8SSSX8X88XXXXX8#8@8#88@#@#;'..               \n              `'.:X88888888S888SS8X8XXS88X%XX%%SSXS%S8%X88888S8S8X8888@##@#@@@;.,,              \n             ''`'X#X##X##SSSXSXXS88SX%SSX%SXXXX%S%%XS%SS8XXS888SX8X8#X@##@#@#@@',,.             \n          ',`'`X###8#8#888X8S8XSSXS%SSSSS%%%%SXXSX%SSSS:.SS8SX8XXS#X#XX@@@@@#@@:`'`             \n         '`';8###8X88#SXS8SSSS8%XXXS%SS%XS%XS%XXSX.::..:...:.:X88SS888X88#@8##@@`,,.            \n          ',.'88#8#8XS8XSS8888%SSSXS%XX%XSXX%%SX.:.::...::::.:::SSXX#X8X8@8#@8@@@@',.'`         \n          :;,`.#88#S8XXXX8SXSSXXSX%SSSXX%XSXS%8::.:......:::..:..XXXX##X#8##8##@@@#;.'.         \n        t%;:'',88X8S88SSS8XSS%%%XX%SSS%%XXXXS8X..:(\u00b7)...:.(\u00b7)::..S8S8#8XXXX####8@@.`'`          \n       %%t:;''.88XS8X8888XS8S%%X%%%%X%%S%XXSXS:.:::.....::::::.::.8SXX#X#88###@@#,''            \n       ::;%t.',X888XS8S8XSSSX%%XXSSSSSX%XXSX%S8...::::::::..:.::.88XSSX#X#88888##`,.            \n        %ttt'.`X#8SS8SSXXSSXSSX%%XX%SXXSX%SX%%S:.:::.::.-:...:...X888X#XX#X@8@@##,``            \n          tS,``:8X8X8SX8S8X%%XS%%%SXXSSSXt%SXSSX8..::::..:.:...X8SSX888XXX#8@8@@;.',            \n            t'':88SS8XSSXSS%SSSS%SS%XS%X%%SX%S%XS88.::::::..:SS%XX8S8SXXX##888#8:'`,            \n             `,.XSS8SSXSSSSXXXX%%XX%SSSXXSt%SXSXStX%8SS8X8XSXSXXXSXS8XSX8#XX@8##'`'             \n             ',,:S8888SX%S%SSXXS%XXS%S%S%XSSSSSX%X%S%XSSXXSXS%XSXXSS8S#8888#@#8:`.'             \n             ',`,8XSXX8%%%S%%t%%%%%%SS%%S%%SStSt%tt%%SStS%S%tt%SS%S%X%SS8X8@#@@'''.             \n              ,`'SSS8S88%t%%%%S%tSt%%St%%S%S%%t%tSS%SSttS%S%SttSXX%SXSX8X8X@88`.,.              \n              ,`88SSSS888%S%%ttS%%%SS%tS%t%SS%t%SS%%SSSttSStSS%XXS%S%XX#X#XX@;'.`               \n             `''SX8XX8XXSSXSt%S%%%S%S%%SSStt%%%StSS%tSt%S%S%%S%XXSSSSX8XXX8#8@`''               \n             ''..'`':88SS8XX%t%tS%St%StStt%%SSStttSSSS%%S%t%%S%%%SS88X88XX#XX@;``               \n                 ',...S88SSSXXXStStt%tSS%%SSttt%%tt%%%Stt%SXXXX%%X#XX888#@@@;,,'.'              \n                   ..``888S8%8XX%%%SttStSSt%S%SSS%S%t%tt%%%XS%%XX8#88XX8X'`,,'```               \n                    ..'.'X8SXS88S%%%S%%%%S%S%%tt%S%t%%tSSXXXXXXXS##88XX.''``                    \n                      `,''`XXS8XS8SSSXtSS%StS%tSSt%SS%SXS888S8SXX8X#8..,,'                      \n                        '..,'XX8XXXSS8SXS8XX8%%X8X8XSXX8SSXSSXX#X##'.`',                        \n                          `,,,,`SXXSX%8SXSSSXSX88XXS88SX8SXX#8X#``',''                          \n                            ,.'''8X8XSXSSX8SS8S88XSSSXXXXXSS8..'.,,,                            \n                               ,,S8SX.``;:X8X888SXXXS8X8SS8S',','                               \n                               `.,`.,`..`,''''''',.'.','.8S...S                                 \n                             ...`''`~~~~~',``''``.'''S:%`'.'`S;.....                            \n"
  };

  var instances = new WeakMap();

  function parseFrame(text) {
    var lines = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    if (lines.length && lines[lines.length - 1] === "") lines.pop();
    while (lines.length < ROWS) lines.push(new Array(COLS + 1).join(" "));
    return lines.slice(0, ROWS).map(function (line) {
      if (line.length < COLS) return line + new Array(COLS - line.length + 1).join(" ");
      return line.slice(0, COLS);
    });
  }

  var GRID = {
    rest: parseFrame(FRAMES.rest),
    mid: parseFrame(FRAMES.mid),
    full: parseFrame(FRAMES.full)
  };

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  /** Blend two grids by density: pick denser glyph when t→1 favors b. */
  function blendChar(ca, cb, t) {
    if (t <= 0.02) return ca;
    if (t >= 0.98) return cb;
    if (ca === " " && cb === " ") return " ";
    if (ca === " ") return t > 0.45 ? cb : " ";
    if (cb === " ") return t < 0.55 ? ca : " ";
    // Prefer the target frame's glyph as we approach it
    return t < 0.5 ? ca : cb;
  }

  function sampleGrid(level) {
    // level 0=rest, 1=mid, 2=full
    level = clamp(level, 0, 2);
    var i0 = Math.floor(level);
    var i1 = Math.min(2, i0 + 1);
    var t = level - i0;
    var a = GRID[STATES[i0]];
    var b = GRID[STATES[i1]];
    if (t < 0.001) return a;
    if (t > 0.999) return b;
    var out = new Array(ROWS);
    for (var y = 0; y < ROWS; y++) {
      var row = new Array(COLS);
      var la = a[y];
      var lb = b[y];
      for (var x = 0; x < COLS; x++) {
        row[x] = blendChar(la.charAt(x), lb.charAt(x), t);
      }
      out[y] = row.join("");
    }
    return out;
  }

  function PufferInstance(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.fps = (opts && opts.fps) || 24;
    this.frameMs = 1000 / this.fps;
    this.disposed = false;
    this.visible = true;
    this.raf = 0;
    this.lastDraw = 0;
    this.acc = 0;
    this.time = 0;
    this.level = 0; // continuous 0..2
    this.targetLevel = 0;
    this.manualState = null; // if set via setState, hold until cleared by breathe
    this.holdUntil = 0;
    this.pointerNear = false;
    this.w = 0;
    this.h = 0;
    this.dpr = 1;
    this.cellW = 8;
    this.cellH = 12;
    this.fontFamily = '"IBM Plex Mono", "iA Writer Mono", ui-monospace, monospace';

    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.onMotion = this.onMotion.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.frame = this.frame.bind(this);

    this.resizeObserver = new ResizeObserver(this.resize.bind(this));
    this.resizeObserver.observe(canvas.parentElement || canvas);

    this.intersectionObserver = new IntersectionObserver(
      function (entries) {
        var entry = entries[0];
        this.visible = !!(entry && entry.isIntersecting);
        this.schedule();
      }.bind(this),
      { threshold: 0.01 }
    );
    this.intersectionObserver.observe(canvas);

    this.reducedMotion.addEventListener("change", this.onMotion);
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("pointerdown", this.onPointerDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", this.onPointerLeave);
    window.addEventListener("blur", this.onPointerLeave);

    this.resize();
    var self = this;
    if (document.fonts && document.fonts.load) {
      document.fonts.load("400 12px " + this.fontFamily).then(function () {
        if (!self.disposed) self.draw(true);
      });
    }
    if (this.reducedMotion.matches) {
      this.level = 0;
      this.targetLevel = 0;
      this.draw(true);
    } else {
      this.schedule();
    }
  }

  PufferInstance.prototype.destroy = function () {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.reducedMotion.removeEventListener("change", this.onMotion);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerdown", this.onPointerDown);
    document.documentElement.removeEventListener("pointerleave", this.onPointerLeave);
    window.removeEventListener("blur", this.onPointerLeave);
  };

  PufferInstance.prototype.setState = function (state) {
    if (STATE_INDEX[state] == null) return;
    this.manualState = state;
    this.targetLevel = STATE_INDEX[state];
    this.holdUntil = performance.now() + 1800;
    if (this.reducedMotion.matches) {
      this.level = this.targetLevel;
      this.draw(true);
    } else {
      this.schedule();
    }
  };

  PufferInstance.prototype.onMotion = function () {
    if (this.reducedMotion.matches) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.level = 0;
      this.targetLevel = 0;
      this.draw(true);
    } else {
      this.schedule();
    }
  };

  PufferInstance.prototype.resize = function () {
    var el = this.canvas;
    var parent = el.parentElement || el;
    var rect = parent.getBoundingClientRect();
    var w = Math.max(1, Math.floor(rect.width));
    var h = Math.max(1, Math.floor(rect.height));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (w === this.w && h === this.h && dpr === this.dpr) return;
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    el.width = Math.floor(w * dpr);
    el.height = Math.floor(h * dpr);
    el.style.width = w + "px";
    el.style.height = h + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Fit 96×42 grid with padding; prefer covering ~72% of the shorter axis
    var padX = w * 0.08;
    var padY = h * 0.1;
    var availW = w - padX * 2;
    var availH = h - padY * 2;
    var cellW = availW / COLS;
    var cellH = availH / ROWS;
    // monospace: keep cell aspect ~0.6 so glyphs don't stretch
    var aspect = 0.58;
    if (cellW / cellH > aspect) {
      cellW = cellH * aspect;
    } else {
      cellH = cellW / aspect;
    }
    // Cap so fish doesn't get tiny on ultrawide / huge
    var maxCellH = Math.min(h * 0.028, 18);
    var minCellH = 7;
    cellH = clamp(cellH, minCellH, maxCellH);
    cellW = cellH * aspect;
    this.cellW = cellW;
    this.cellH = cellH;
    this.draw(true);
  };

  PufferInstance.prototype.schedule = function () {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.disposed || !this.visible || this.reducedMotion.matches) return;
    this.lastDraw = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  };

  PufferInstance.prototype.frame = function (now) {
    if (this.disposed || !this.visible || this.reducedMotion.matches) {
      this.raf = 0;
      return;
    }
    var dt = Math.min(0.05, (now - this.lastDraw) / 1000);
    this.lastDraw = now;
    this.acc += dt * 1000;
    this.time += dt;

    this.updateTarget(now);
    // Ease level toward target
    var speed = 1.6; // units per second across 0..2
    var diff = this.targetLevel - this.level;
    if (Math.abs(diff) < 0.002) {
      this.level = this.targetLevel;
    } else {
      this.level += Math.sign(diff) * Math.min(Math.abs(diff), speed * dt);
    }

    if (this.acc >= this.frameMs) {
      this.acc = this.acc % this.frameMs;
      this.draw(false);
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  PufferInstance.prototype.updateTarget = function (now) {
    if (this.manualState && now < this.holdUntil) {
      this.targetLevel = STATE_INDEX[this.manualState];
      return;
    }
    if (this.manualState && now >= this.holdUntil) {
      this.manualState = null;
    }
    if (this.pointerNear) {
      // Quiet swell toward mid–full
      this.targetLevel = 1.35;
      return;
    }
    // Gentle breathe rest ↔ mid (0 .. ~0.85)
    var breath = (Math.sin(this.time * 0.55) + 1) / 2; // 0..1
    breath = easeInOut(breath);
    this.targetLevel = lerp(0.05, 0.85, breath);
  };

  PufferInstance.prototype.toLocal = function (e) {
    var rect = this.canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    // "near" = inside a soft center region around the fish
    var cx = rect.width / 2;
    var cy = rect.height / 2;
    var dx = (x - cx) / (rect.width * 0.28);
    var dy = (y - cy) / (rect.height * 0.32);
    var near = dx * dx + dy * dy < 1;
    return { x: x, y: y, inside: inside, near: near };
  };

  PufferInstance.prototype.onPointerMove = function (e) {
    if (this.reducedMotion.matches) return;
    var loc = this.toLocal(e);
    this.pointerNear = loc.near && e.pointerType !== "touch";
  };

  PufferInstance.prototype.onPointerDown = function (e) {
    if (this.reducedMotion.matches) return;
    var loc = this.toLocal(e);
    if (!loc.inside) return;
    // Startle → full, then ease back
    this.manualState = "full";
    this.targetLevel = 2;
    this.holdUntil = performance.now() + 1400;
  };

  PufferInstance.prototype.onPointerLeave = function () {
    this.pointerNear = false;
  };

  PufferInstance.prototype.draw = function () {
    var ctx = this.ctx;
    var w = this.w;
    var h = this.h;
    if (w < 1 || h < 1) return;
    ctx.clearRect(0, 0, w, h);

    var grid = sampleGrid(this.level);
    var cw = this.cellW;
    var ch = this.cellH;
    var gridW = COLS * cw;
    var gridH = ROWS * ch;
    var ox = (w - gridW) / 2;
    var oy = (h - gridH) / 2 - h * 0.02; // slight optical lift

    var fontPx = Math.max(8, Math.floor(ch * 0.92));
    ctx.font = "400 " + fontPx + "px " + this.fontFamily;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    // Soft ink: deeper toward full inflation
    var deep = clamp(this.level / 2, 0, 1);
    ctx.fillStyle = deep > 0.55 ? INK_DEEP : INK;

    for (var y = 0; y < ROWS; y++) {
      var line = grid[y];
      var py = oy + y * ch;
      // Draw run-length of non-space for a bit of speed
      var x = 0;
      while (x < COLS) {
        while (x < COLS && line.charAt(x) === " ") x++;
        if (x >= COLS) break;
        var start = x;
        while (x < COLS && line.charAt(x) !== " ") x++;
        ctx.fillText(line.slice(start, x), ox + start * cw, py);
      }
    }
  };

  function mount(el, opts) {
    if (!el || el.tagName !== "CANVAS") {
      throw new Error("Puffer.mount expects a <canvas>");
    }
    destroy(el);
    var inst = new PufferInstance(el, opts || {});
    instances.set(el, inst);
    el.setAttribute("data-puffer-mounted", "1");
    return inst;
  }

  function destroy(el) {
    var inst = instances.get(el);
    if (inst) {
      inst.destroy();
      instances.delete(el);
      el.removeAttribute("data-puffer-mounted");
    }
  }

  function setState(el, state) {
    var inst = instances.get(el);
    if (inst) inst.setState(state);
  }

  global.Puffer = {
    mount: mount,
    destroy: destroy,
    setState: setState
  };
})(typeof window !== "undefined" ? window : this);
