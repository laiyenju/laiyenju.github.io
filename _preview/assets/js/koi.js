/*!
 * koi.js — living ASCII 錦鯉 field for Yen's homepage
 *
 * Adapted from ascii-sharks (MIT) https://github.com/stackedlol/ascii-sharks
 * Copyright (c) 2026 drewdi — OceanEngine patterns:
 * fixed timestep, offscreen pause, prefers-reduced-motion → still, DPR≤2.
 *
 * One side-view koi, head right. Poses: cruise (idle), near (pointer attention),
 * lift (a little dorsal/tail rise on the swim). No rest→mid→full inflate.
 * Body amber #C45C26; #@% spots and the (·) eye stay dark ink. Field stays gray.
 *
 * API: Koi.mount(el, opts), Koi.destroy(el), Koi.setState(el, state)
 */
(function (global) {
  "use strict";

  var TAU = Math.PI * 2;
  var STEP = 1 / 60;
  var MAX_STEPS = 4;
  var FIELD_GLYPHS = "·:.'`,;:~-";
  var INK = [28, 27, 25];

  /* Ink-locked 96×42 koi poses. Creature layer only — the field stays gray. */
  var FRAME_COLS = 96;
  var FRAME_ROWS = 42;
  var FRAME_TEXT = {
    cruise: "                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n               ;St;S                                        ;;%tt;:S                            \n               :%S%;%;t:%t:%                       .'8#8#XX#X8X8#X8X####8':                     \n                      SS%:;;;%:%SS''''SSX8##88###X#@%#8X888SXXSXX8XS##%#XX::(\u00b7).                \n                      tS;:tSStS:%%%S%SS8SSSSXSS%X%#@##XSS%X@##@%%X%%S%%SX%:...::                \n               :t%%:%t;%t%S;                ;ttS:St%XSSX8SSS#@X88X8S8SXXtS;                     \n               :%::t                                                 tS%S                       \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n",
    near: "                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n           :t                                                   :%tt                            \n           %%tt;St;S;                                        ;%tt;:S;t:                         \n                %S%;%;t:%t:                      `.:8X8X8SS8SXSX8SXS8888@%S88':                 \n                    S%SS%:;;;%:%,%XXXSSSSX88XSXXXS#@%#@SXXX%SS@SSXS%S%%#@#%SSX:.(\u00b7)..           \n                  St:;tS;:tSStS::StS%SSXt%%%StttSt#@##S%%tSt##@##Stt%tt%@%%SSS%:%%..:           \n           t%:::t%%:%t;%t%S                t;ttS:St%S%%SX%%%X@@%XSX%X%X%tSXS%%'..               \n           t;S::%                                                  ,``,%S%S;;                   \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n",
    lift: "                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n               S%:;:                                           :%                               \n                  :;S%S                                     ;%:::%tt                            \n                    ;:%StSS                          `,;8#888##XXXX8'#@.                        \n                       :%t:%S;             ,`XX8#8@@@@8X8SS@@##X8SXS%##@8#::.                   \n               %SS;SS%SS%:;;;%:%SS#88XXSSX88XSXXXS%S%SXSXXS#@%@%%XS%S%%%XX::(\u00b7)..'              \n                 ;St:;tS;:tSStS:%%:`       S;:SS8SXSXX8XXS8S88SS%XS%S%%S8%:...:                 \n                                                                '',,`::%tS                      \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n                                                                                                \n"
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
    cruise: parseFrame(FRAME_TEXT.cruise),
    near: parseFrame(FRAME_TEXT.near),
    lift: parseFrame(FRAME_TEXT.lift)
  };
  var BLEND_ROWS = new Array(FRAME_ROWS);
  var SPINE_MASK = null;

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

  function blendGrid(a, b, t) {
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

  /** nearT 0..1 cruise→near. liftT 0..1 mixes a little lift while still cruising. */
  function samplePose(nearT, liftT) {
    nearT = clamp(nearT, 0, 1);
    liftT = clamp(liftT, 0, 1);
    if (nearT >= 0.98) return GRIDS.near;
    var base = nearT <= 0.02 ? GRIDS.cruise : blendGrid(GRIDS.cruise, GRIDS.near, nearT);
    var liftMix = liftT * (1 - nearT);
    if (liftMix <= 0.02) return base;
    return blendGrid(base, GRIDS.lift, liftMix);
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

  /* Body amber around #C45C26. #@% spots and the eye stay dark ink. */
  function glyphInk(ch) {
    if (ch === "·" || ch === "(" || ch === ")") return { rgba: "rgba(28,27,25,1)" };
    if ("#%@".indexOf(ch) >= 0) return { rgba: "rgba(28,27,25,0.9)" };
    if (".,'`~".indexOf(ch) >= 0) return { rgba: "rgba(214,146,96,0.74)" };
    if (":;|/'\\t".indexOf(ch) >= 0) return { rgba: "rgba(196,92,38,0.88)" };
    return { rgba: "rgba(158,66,26,0.92)" };
  }

  /** Glyph center, rotated by heading around the fish center. No cell snap. */
  function glyphPoint(c, r, cx, cy, fishCw, fishCh, heading) {
    var lx = (c + 0.5 - FRAME_COLS / 2) * fishCw;
    var ly = (r + 0.5 - FRAME_ROWS / 2) * fishCh;
    var co = Math.cos(heading || 0);
    var si = Math.sin(heading || 0);
    return { x: cx + lx * co - ly * si, y: cy + lx * si + ly * co };
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

  /* —— World: ambient field particles + one fishfer —— */
  function World() {
    this.width = 0;
    this.height = 0;
    this.time = 0;
    this.particles = [];
    this.koi = null;
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
    if (first || !this.koi) this.seed();
    else {
      this.koi.x = clamp(this.koi.x, width * 0.15, width * 0.85);
      this.koi.y = clamp(this.koi.y, height * 0.2, height * 0.75);
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

    this.koi = {
      x: W * 0.5,
      y: H * 0.48,
      heading: 0,
      speed: 0,
      phase: 0,
      near: 0,
      lift: 0,
      halfW: Math.min(W, H) * 0.28,
      halfH: Math.min(W, H) * 0.12
    };
  };

  World.prototype.splash = function (x, y) {
    this.events.push({ kind: "splash", x: x, y: y });
    var p = this.koi;
    if (!p) return;

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
    var fish = this.koi;
    var fearRx = fish ? fish.halfW || 160 : 0;
    var fearRy = fish ? fish.halfH || 110 : 0;

    for (var i = 0; i < this.particles.length; i++) {
      var f = this.particles[i];
      current(f.x, f.y, t, cur);
      var ax = cur.x * 0.35 + (Math.random() - 0.5) * 28;
      var ay = cur.y * 0.35 + (Math.random() - 0.5) * 28;

      if (fish && fearRx > 1 && fearRy > 1) {
        var dx = f.x - fish.x;
        var dy = f.y - fish.y;
        var nd = Math.hypot(dx / fearRx, dy / fearRy);
        var d = Math.hypot(dx, dy);
        if (nd < 1.2 && d > 1e-3) {
          var w = Math.pow(1 - nd / 1.2, 2) * (50 + (fish.near || 0) * 18);
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
    var p = this.koi;
    if (!p) return;
    var W = this.width;
    var H = this.height;
    var t = this.time;
    var layout = fishLayout(W, H, this.cellW, this.cellH);
    // Lane sits above the lower-left title/slogan. Horizontal cruise, not a diagonal cut.
    var homeX = W * 0.56;
    var homeY = H * 0.36;
    var attn = clamp(p.near, 0, 1);
    p.halfW = layout.gridW * (0.28 + 0.06 * attn);
    p.halfH = layout.gridH * (0.12 + 0.04 * attn);

    if (this.still) {
      p.near = 0;
      p.lift = 0;
      p.heading = 0;
      p.speed = 0;
      p.x = homeX;
      p.y = homeY;
      return;
    }

    if (p.phase == null) p.phase = 0;
    if (p.heading == null) p.heading = 0;
    if (p.speed == null) p.speed = 0;
    var pace = 0.32 * (1 - attn * 0.12);
    p.phase += dt * pace;
    var orbitX = Math.min(72, W * 0.055);
    var orbitY = Math.min(8, H * 0.01);
    var ang = p.phase;
    // Same-period shallow wave: speed eases at each end, the body stays in the lane.
    p.x = homeX + Math.sin(ang) * orbitX;
    p.y = homeY + Math.sin(ang) * orbitY;
    var tvx = Math.cos(ang) * orbitX * pace;
    var tvy = Math.cos(ang) * orbitY * pace;
    var pitch = clamp(Math.atan2(tvy, Math.abs(tvx) + 0.001), -0.12, 0.12);
    var turn = angleDiff(p.heading, pitch);
    var turnGain = 0.25 + 0.75 * easeInOut(clamp(Math.abs(turn) / 0.4, 0, 1));
    var maxTurn = 0.65 * turnGain * dt;
    p.heading += clamp(turn, -maxTurn, maxTurn);
    var cruise = 15 * (1 - attn * 0.1);
    p.speed += (cruise - p.speed) * Math.min(1, dt * 1.5);

    // Swim rhythm: a little lift, still the cruise fish. Pointer eases to near — not inflate.
    var rhythm = easeInOut((Math.sin(t * 0.5) + 1) / 2);
    var liftTarget = rhythm * 0.38;
    var nearTarget = 0;
    if (p.holdPose === "lift") {
      liftTarget = 1;
      nearTarget = 0;
    } else if (p.holdPose === "near") {
      nearTarget = 1;
      liftTarget = 0;
    } else if (p.holdPose === "cruise") {
      liftTarget = 0;
      nearTarget = 0;
    } else if (this.pointer.active) {
      var dx = (this.pointer.x - p.x) / Math.max(100, layout.gridW * 0.42);
      var dy = (this.pointer.y - p.y) / Math.max(70, layout.gridH * 0.46);
      var dist = Math.sqrt(dx * dx + dy * dy);
      var prox = dist >= 1 ? 0 : (1 - dist) * (1 - dist);
      if (prox > 0.001) {
        nearTarget = easeInOut(prox);
        liftTarget = liftTarget * (1 - nearTarget);
        if (prox > 0.84) liftTarget = Math.max(liftTarget, (prox - 0.84) / 0.16 * 0.55);
      }
    }
    function easeTo(cur, target, rate) {
      var diff = target - cur;
      if (Math.abs(diff) < 0.002) return target;
      return cur + Math.sign(diff) * Math.min(Math.abs(diff), rate * dt);
    }
    p.near = easeTo(p.near || 0, nearTarget, nearTarget > p.near ? 1.6 : 1.1);
    p.lift = easeTo(p.lift || 0, liftTarget, 1.2);
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
    var p = world.koi;
    if (p) {
      var rad = 2;
      var back = 18 + (p.halfH || 40) * 0.08;
      this.stamp(
        energy,
        p.x - Math.cos(p.heading || 0) * back,
        p.y - Math.sin(p.heading || 0) * back * 0.35 + (p.halfH || 40) * 0.15,
        rad,
        0.03
      );
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
    var grid = samplePose(p.near || 0, p.lift || 0);
    this.fishCx = p.x;
    this.fishCy = p.y;
    this.heading = p.heading || 0;
    this.fishCw = layout.fishCw;
    this.fishCh = layout.fishCh;
    this.frameGrid = grid;
    this.inflateLevel = p.near || 0;
    var cols = this.cols;
    var rows = this.rows;
    for (var r = 0; r < FRAME_ROWS; r++) {
      var line = grid[r];
      for (var c = 0; c < FRAME_COLS; c++) {
        if (line.charAt(c) === " ") continue;
        var pt = glyphPoint(c, r, p.x, p.y, layout.fishCw, layout.fishCh, this.heading);
        var cc = Math.floor(pt.x / this.cw);
        var rr = Math.floor(pt.y / this.ch);
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
    var heading = this.heading || 0;
    ctx.save();
    ctx.font = "500 " + Math.max(9, Math.round(ch * 0.92)) + "px " + this.fontFamily;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (var r = 0; r < FRAME_ROWS; r++) {
      var line = grid[r];
      for (var c = 0; c < FRAME_COLS; c++) {
        var glyph = line.charAt(c);
        if (glyph === " ") continue;
        ctx.fillStyle = glyphInk(glyph).rgba;
        var pt = glyphPoint(c, r, this.fishCx, this.fishCy, cw, ch, heading);
        ctx.fillText(glyph, pt.x, pt.y);
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
    this.stampLockedFrame(world.koi);
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
      if (this.world.koi) { this.world.koi.near = 0; this.world.koi.lift = 0; }
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
    var p = this.world.koi;
    if (!p) return;
    if (state === "cruise" || state === "near" || state === "lift") p.holdPose = state;
    else p.holdPose = null;
  };

  /* —— public API —— */
  var instances = new WeakMap();

  var Koi = {
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

  global.Koi = Koi;
})(typeof window !== "undefined" ? window : this);
