/*!
 * puffer.js — living ASCII 河豚 field for Yen's homepage
 *
 * Adapted from ascii-sharks (MIT) https://github.com/stackedlol/ascii-sharks
 * Copyright (c) 2026 drewdi — OceanEngine / AsciiRenderer patterns:
 * fixed timestep, offscreen pause, prefers-reduced-motion → still, DPR≤2,
 * SKIN_RAMP + supersampled silhouette + wake diffusion.
 *
 * Motif change: paper-white (#fafaf7) transparent canvas, dark ink glyphs,
 * one 河豚 with rest/mid/full inflate — not shark schools / dark ocean / cyan wakes.
 *
 * API: Puffer.mount(el, opts), Puffer.destroy(el), Puffer.setState(el, state)
 */
(function (global) {
  "use strict";

  var TAU = Math.PI * 2;
  var STEP = 1 / 60;
  var MAX_STEPS = 4;
  var SKIN_RAMP = ":;t%SX8#@";
  var EDGE_HEAVY = ":;";
  var EDGE_LIGHT = ".',`";
  var SPINE_GLYPHS = "|;:/\\";
  var FIELD_GLYPHS = "·:.'`,;:~-";
  var PAPER = "#fafaf7";
  var INK = [28, 27, 25];
  var SUBSAMPLES = [0.25, 0.3, 0.75, 0.3, 0.25, 0.72, 0.75, 0.72];
  var PUFFER_NODES = 14;

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

    var px = W * 0.58;
    var py = H * 0.42;
    var heading = rand(-0.4, 0.4);
    var nodes = new Float32Array(PUFFER_NODES * 2);
    var baseLen = clamp(Math.min(W, H) * 0.22, 90, 180);
    var seg = baseLen / (PUFFER_NODES - 1);
    for (var k = 0; k < PUFFER_NODES; k++) {
      nodes[k * 2] = px - Math.cos(heading) * seg * k * 0.35;
      nodes[k * 2 + 1] = py - Math.sin(heading) * seg * k * 0.35;
    }
    this.puffer = {
      x: px,
      y: py,
      heading: heading,
      speed: 18,
      phase: rand(0, TAU),
      turn: 0,
      wander: 0,
      inflate: 0, // continuous 0..2
      targetInflate: 0,
      holdFullUntil: 0,
      baseRadius: baseLen * 0.42,
      nodes: nodes,
      eyeBlink: 0
    };
  };

  World.prototype.splash = function (x, y) {
    this.events.push({ kind: "splash", x: x, y: y });
    var p = this.puffer;
    if (!p) return;
    var d = Math.hypot(p.x - x, p.y - y);
    if (d < p.baseRadius * (1.4 + p.inflate * 0.5) + 80) {
      p.targetInflate = 2;
      p.holdFullUntil = this.time + 1.8;
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
    var fearR = puf ? puf.baseRadius * (1.2 + puf.inflate * 0.7) + 40 : 0;

    for (var i = 0; i < this.particles.length; i++) {
      var f = this.particles[i];
      current(f.x, f.y, t, cur);
      var ax = cur.x * 0.35 + (Math.random() - 0.5) * 28;
      var ay = cur.y * 0.35 + (Math.random() - 0.5) * 28;

      if (puf) {
        var dx = f.x - puf.x;
        var dy = f.y - puf.y;
        var d = Math.hypot(dx, dy);
        if (d < fearR && d > 1e-3) {
          var w = Math.pow(1 - d / fearR, 2) * (40 + puf.inflate * 50);
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
    var cur = this._cur;

    // Inflate from pointer proximity (soft mid) or click-hold full
    var target = 0;
    if (t < p.holdFullUntil) {
      target = 2;
    } else if (this.pointer.active) {
      var dist = Math.hypot(p.x - this.pointer.x, p.y - this.pointer.y);
      var near = p.baseRadius * 1.6 + 220;
      if (dist < near) {
        // 0 at edge → ~1.15 mid when close
        target = clamp((1 - dist / near) * 1.35, 0, 1.25);
      }
    }
    p.targetInflate = target;
    var rate = p.targetInflate > p.inflate ? 2.4 : 1.4;
    p.inflate += (p.targetInflate - p.inflate) * Math.min(1, dt * rate);

    // Wander + current cruise; soft orbit around stage center-right
    current(p.x, p.y, t, cur);
    p.wander = clamp(p.wander + (Math.random() - 0.5) * dt * 2.4, -0.9, 0.9);
    var dx = Math.cos(p.heading) + Math.cos(p.heading + p.wander) * 0.5;
    var dy = Math.sin(p.heading) + Math.sin(p.heading + p.wander) * 0.5;
    dx += cur.x * 0.00045;
    dy += cur.y * 0.00045;

    var cx = W * 0.55;
    var cy = H * 0.44;
    var toCx = cx - p.x;
    var toCy = cy - p.y;
    var td = Math.hypot(toCx, toCy) || 1;
    // soft leash so it stays in the reading field
    if (td > Math.min(W, H) * 0.28) {
      dx += (toCx / td) * 0.55;
      dy += (toCy / td) * 0.55;
    }

    // shy from pointer a little when not fully inflated
    if (this.pointer.active && p.inflate < 1.5) {
      var sx = p.x - this.pointer.x;
      var sy = p.y - this.pointer.y;
      var sd = Math.hypot(sx, sy);
      if (sd < 160 && sd > 1e-3) {
        dx += (sx / sd) * 0.35;
        dy += (sy / sd) * 0.35;
      }
    }

    var desired = Math.atan2(dy, dx);
    var maxTurn = (0.7 + p.inflate * 0.15) * dt;
    var turned = clamp(angleDiff(p.heading, desired), -maxTurn, maxTurn);
    p.heading += turned;
    p.turn += (turned / dt - p.turn) * Math.min(1, dt * 4);

    var cruise = 14 + (2 - p.inflate) * 6; // slower when puffed
    p.speed += (cruise - p.speed) * Math.min(1, dt * 1.2);
    p.phase += dt * (1.6 + p.speed / 20);
    p.x += Math.cos(p.heading) * p.speed * dt;
    p.y += Math.sin(p.heading) * p.speed * dt;
    p.x = clamp(p.x, 40, W - 40);
    p.y = clamp(p.y, 50, H - 50);

    // soft body chain (short spine for sampling)
    var nodes = p.nodes;
    nodes[0] = p.x;
    nodes[1] = p.y;
    var radius = p.baseRadius * (0.85 + p.inflate * 0.38);
    var seg = (radius * 1.1) / (PUFFER_NODES - 1);
    var prevAngle = p.heading + Math.PI;
    for (var k = 1; k < PUFFER_NODES; k++) {
      var px0 = nodes[(k - 1) * 2];
      var py0 = nodes[(k - 1) * 2 + 1];
      var ang = Math.atan2(nodes[k * 2 + 1] - py0, nodes[k * 2] - px0);
      ang = prevAngle + clamp(angleDiff(prevAngle, ang), -0.2, 0.2);
      // idle breathe wave
      var wave = Math.sin(p.phase - k * 0.45) * radius * 0.04 * (1 - p.inflate * 0.3);
      nodes[k * 2] = px0 + Math.cos(ang) * seg - Math.sin(ang) * wave;
      nodes[k * 2 + 1] = py0 + Math.sin(ang) * seg + Math.cos(ang) * wave;
      prevAngle = ang;
    }
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
      var rad = 1 + (p.inflate * 0.6) | 0;
      this.stamp(energy, p.x, p.y, rad, 0.04 + p.speed * 0.0008);
      // soft trail behind
      var bx = p.x - Math.cos(p.heading) * p.baseRadius * 0.6;
      var by = p.y - Math.sin(p.heading) * p.baseRadius * 0.6;
      this.stamp(energy, bx, by, 1, 0.03);
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

  /** Puffer silhouette: round body + spines that grow with inflate. */
  AsciiRenderer.prototype.samplePuffer = function (px, py, p) {
    var dx = px - p.x;
    var dy = py - p.y;
    // orient into heading frame
    var c = Math.cos(-p.heading);
    var s = Math.sin(-p.heading);
    var lx = dx * c - dy * s;
    var ly = dx * s + dy * c;

    var inflate = p.inflate;
    var R = p.baseRadius * (0.78 + inflate * 0.42);
    // slightly oval: longer along heading when rest, rounder when full
    var ovalX = 1.05 - inflate * 0.12;
    var ovalY = 0.88 + inflate * 0.14;
    var nx = lx / (R * ovalX);
    var ny = ly / (R * ovalY);
    var rr = Math.hypot(nx, ny);
    this.hitDist = rr * R;

    // eye
    var eyeX = R * 0.42;
    var eyeY = -R * 0.18;
    if (Math.hypot(lx - eyeX, ly - eyeY) < R * 0.09) {
      this.hitFlag = 4;
      this.hitShade = 0.1;
      return true;
    }

    // pectoral fins (small)
    var finReach = R * (0.35 + inflate * 0.08);
    if (ly > 0 && lx > -R * 0.2 && lx < R * 0.45) {
      var fin = Math.abs(ly) / finReach + Math.abs(lx - R * 0.1) / (R * 0.55);
      if (fin < 1 && rr > 0.7) {
        this.hitFlag = 5;
        this.hitShade = 0.4;
        return true;
      }
    }

    // spines: radial spikes stronger with inflate
    var spineCount = 12;
    var ang = Math.atan2(ly, lx);
    var spineIdx = Math.round(((ang + Math.PI) / TAU) * spineCount) % spineCount;
    var spineAng = -Math.PI + (spineIdx / spineCount) * TAU;
    var angDist = Math.abs(angleDiff(ang, spineAng));
    var spineLen = R * (0.08 + inflate * 0.38);
    var spineWidth = 0.11 + inflate * 0.04;
    if (rr > 0.85 && rr < 1 + spineLen / R && angDist < spineWidth) {
      this.hitFlag = 3;
      this.hitShade = clamp(1.1 - (rr - 1) * 2, 0.3, 1);
      return true;
    }

    if (rr <= 1) {
      // body shading: lit from top-left
      var across = rr;
      var facing = (-nx * 0.55 - ny * 0.75) * across;
      var shade = 0.55 - across * across * 0.4 + facing * 0.28;
      // mouth hint
      if (lx > R * 0.55 && Math.abs(ly) < R * 0.12) shade *= 0.55;
      this.hitFlag = 1;
      this.hitShade = clamp(shade, 0, 1);
      return true;
    }

    // soft edge band
    if (rr < 1.12) {
      this.hitFlag = 2;
      this.hitShade = clamp(1.2 - rr, 0, 1);
      return true;
    }
    return false;
  };

  AsciiRenderer.prototype.rasterizePuffer = function (p, t) {
    var flag = this.cellFlag;
    var shade = this.cellShade;
    var key = this.cellKey;
    flag.fill(0);
    if (!p) return;

    var R = p.baseRadius * (0.78 + p.inflate * 0.42);
    var reach = R * (1.55 + p.inflate * 0.35);
    var c0 = Math.max(0, Math.floor((p.x - reach) / this.cw));
    var c1 = Math.min(this.cols - 1, Math.floor((p.x + reach) / this.cw));
    var r0 = Math.max(0, Math.floor((p.y - reach) / this.ch));
    var r1 = Math.min(this.rows - 1, Math.floor((p.y + reach) / this.ch));

    for (var r = r0; r <= r1; r++) {
      for (var c = c0; c <= c1; c++) {
        var x = c * this.cw;
        var y = r * this.ch;
        var centerHit = this.samplePuffer(x + this.cw / 2, y + this.ch / 2, p);
        if (!centerHit && this.hitDist > reach) continue;
        var f0 = this.hitFlag;
        var s0 = this.hitShade;
        var hits = centerHit ? 1 : 0;
        for (var k = 0; k < SUBSAMPLES.length; k += 2) {
          if (this.samplePuffer(x + SUBSAMPLES[k] * this.cw, y + SUBSAMPLES[k + 1] * this.ch, p))
            hits++;
        }
        if (hits === 0) continue;
        var coverage = hits / 5;
        var i = r * this.cols + c;
        key[i] = (hash3(c, r, (p.inflate * 10) | 0) * 4294967295) >>> 0;
        if (centerHit && coverage >= 0.55) {
          flag[i] = f0;
          var flicker = (hash3(c, r, Math.floor(t * 5)) - 0.5) * 0.05;
          shade[i] = clamp(s0 + flicker, 0, 1);
        } else {
          flag[i] = 2;
          shade[i] = coverage;
        }
      }
    }
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
    this.rasterizePuffer(world.puffer, t);
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

    // puffer body
    var shadeArr = this.cellShade;
    var keyArr = this.cellKey;
    for (var j = 0; j < n; j++) {
      var fl = cellFlag[j];
      if (!fl) continue;
      var cc = j % cols;
      var rr = (j / cols) | 0;
      var xx = cc * cw;
      var yy = rr * ch;
      var sh = shadeArr[j];
      var key = keyArr[j];
      var level, glyph2, alpha2;

      if (fl === 2) {
        // edge
        var set = sh >= 0.5 ? EDGE_HEAVY : EDGE_LIGHT;
        glyph2 = set[(key >>> 8) % set.length];
        alpha2 = 0.35 + sh * 0.4;
        ctx.fillStyle =
          "rgba(" + INK[0] + "," + INK[1] + "," + INK[2] + "," + alpha2.toFixed(3) + ")";
        ctx.fillText(glyph2, xx + cw / 2, yy + ch / 2 + 1);
        continue;
      }

      if (fl === 4) {
        glyph2 = "o";
        alpha2 = 0.85;
      } else if (fl === 3) {
        glyph2 = SPINE_GLYPHS[(key >>> 8) % SPINE_GLYPHS.length];
        alpha2 = 0.45 + sh * 0.4;
      } else if (fl === 5) {
        glyph2 = ";%t"[(key >>> 8) % 3];
        alpha2 = 0.4 + sh * 0.3;
      } else {
        var gi = clamp(Math.floor((1 - sh) * 8.99), 0, SKIN_RAMP.length - 1);
        glyph2 = SKIN_RAMP[gi];
        alpha2 = 0.42 + sh * 0.48;
      }
      ctx.fillStyle =
        "rgba(" + INK[0] + "," + INK[1] + "," + INK[2] + "," + alpha2.toFixed(3) + ")";
      ctx.fillText(glyph2, xx + cw / 2, yy + ch / 2 + 1);
    }
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
    if (this.reducedMotion.matches) {
      cancelAnimationFrame(this.raf);
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
