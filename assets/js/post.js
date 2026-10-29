(function () {
  "use strict";

  /* —— Article pages: plain paper while reading. When (END) comes into view,
        one small koi swims across it, once. Footnotes move into the right
        margin on wide screens. —— */

  /* The column (680) stays centred; the rail needs 28px + at least 160px + 16px
     on its right: (680 + 2 × 204) = 1088. Narrower, the notes go to the end. */
  var RAIL_MIN = 1088;
  var GAP = 12;

  var post = document.querySelector(".post");
  var prose = document.querySelector(".post-prose");

  /* Kramdown footnotes: <sup><a class="footnote" href="#fn:1"> in the text,
     <div class="footnotes"><ol><li id="fn:1"> at the end. */
  var rail = null;
  var notes = [];

  function buildRail() {
    var refs = prose ? prose.querySelectorAll("a.footnote") : [];
    if (!refs.length) return;
    rail = document.createElement("aside");
    rail.className = "post-rail";
    rail.setAttribute("aria-hidden", "true");
    refs.forEach(function (ref, i) {
      var id = decodeURIComponent((ref.getAttribute("href") || "").slice(1));
      var li = document.getElementById(id);
      if (!li) return;
      var note = document.createElement("div");
      note.className = "post-note";
      note.innerHTML = '<span class="post-note-n">' + (i + 1) + "</span>" + li.innerHTML;
      note.querySelectorAll(".reversefootnote").forEach(function (a) { a.remove(); });
      rail.appendChild(note);
      notes.push({ ref: ref, note: note });
      ref.addEventListener("mouseenter", function () { note.classList.add("is-lit"); });
      ref.addEventListener("mouseleave", function () { note.classList.remove("is-lit"); });
    });
    post.appendChild(rail);
  }

  function layoutRail() {
    if (!rail) return;
    var wide = window.innerWidth >= RAIL_MIN;
    document.body.classList.toggle("has-rail", wide);
    rail.hidden = !wide;
    if (!wide) return;
    var top = post.getBoundingClientRect().top;
    var floor = 0;
    notes.forEach(function (n) {
      // Level with the reference's line; push down if the previous note is still there.
      var y = Math.max(n.ref.getBoundingClientRect().top - top - 2, floor);
      n.note.style.top = y + "px";
      floor = y + n.note.offsetHeight + GAP;
    });
  }

  function layout() {
    layoutRail();
  }

  /** Label code blocks with their language (Rouge puts it in a class), and give each a line-number gutter. */
  function labelCode() {
    document.querySelectorAll(".post-prose div.highlighter-rouge").forEach(function (el) {
      var m = /\blanguage-([\w+#-]+)/.exec(el.className);
      if (m && m[1] !== "plaintext") el.setAttribute("data-lang", m[1]);
    });
    document.querySelectorAll(".post-prose pre > code").forEach(function (code) {
      var lines = code.textContent.replace(/\n$/, "").split("\n").length;
      var gutter = document.createElement("span");
      gutter.className = "code-gutter";
      gutter.setAttribute("aria-hidden", "true");
      for (var i = 1; i <= lines; i++) gutter.textContent += (i > 1 ? "\n" : "") + i;
      code.parentNode.insertBefore(gutter, code);
      code.parentNode.classList.add("has-gutter");
    });
  }

  /* —— Arrival, like `cat` in a terminal: the command (unless it was typed on
        the notes list and carried up), the title typed character by
        character, the date line typed out, then the first screen of prose
        streamed in line by line. Below the first screen everything is simply
        there. A key, a scroll or a tap finishes it at once. Off when motion
        is reduced: the head script then never adds .post-print. —— */
  var timers = [];
  function later(ms, fn) { timers.push(window.setTimeout(fn, ms)); }

  /** Type an element's plain text in place; the untyped rest keeps its room, so nothing reflows. */
  function typeText(el, perChar, done, withCursor) {
    var text = el.textContent;
    var shown = document.createElement("span");
    var rest = document.createElement("span");
    rest.className = "type-rest";
    rest.textContent = text;
    el.textContent = "";
    el.appendChild(shown);
    if (withCursor) {
      // The cursor sits right after the typed part, not after the hidden rest.
      var cursor = document.createElement("span");
      cursor.className = "type-cursor";
      cursor.setAttribute("aria-hidden", "true");
      el.appendChild(cursor);
    }
    el.appendChild(rest);
    var n = 0;
    (function step() {
      n++;
      shown.textContent = text.slice(0, n);
      rest.textContent = text.slice(n);
      if (n < text.length) later(perChar, step);
      else if (withCursor) later(140, function () { el.textContent = text; if (done) done(); });
      else { el.textContent = text; if (done) done(); }
    })();
    return function finish() { el.textContent = text; };
  }

  var finishers = [];
  function stream() {
    var root = document.documentElement;
    if (!root.classList.contains("post-print")) return;
    var bar = document.querySelector(".post-bar");
    var cmd = document.querySelector(".post-cmd-text");
    var title = document.querySelector(".post-title");
    var meta = document.querySelector(".post-meta");
    var end = document.querySelector(".post-end");
    var h = window.innerHeight;

    function show(el) { if (el) el.classList.add("is-shown"); }

    function typeBar(next) {
      show(bar);
      if (!cmd) return next();
      finishers.push(typeText(cmd, 26, function () { later(120, next); }));
    }
    function typeTitle(next) {
      if (!title) return next();
      show(title);
      var len = title.textContent.length;
      var per = Math.max(16, Math.min(42, Math.floor(600 / Math.max(1, len))));
      finishers.push(typeText(title, per, next, true));
    }
    function typeMeta(next) {
      if (!meta) return next();
      var chars = meta.textContent.length;
      meta.style.setProperty("--type-chars", chars);
      meta.style.setProperty("--type-dur", chars * 12 + "ms");
      show(meta);
      later(chars * 12 + 120, next);
    }
    function streamProse() {
      // Each first-screen block uncovers one line at a time, one block after another.
      var t = 0;
      document.querySelectorAll(".post-prose > *").forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < h) {
          var lh = parseFloat(getComputedStyle(el).lineHeight) || 28;
          var lines = Math.max(1, Math.round(r.height / lh));
          var dur = lines * 34;
          el.style.setProperty("--stream-lines", lines);
          el.style.setProperty("--stream-dur", dur + "ms");
          el.style.setProperty("--stream-delay", t + "ms");
          t += dur + 40;
        }
        el.classList.add("is-streaming");
      });
      if (end) {
        if (end.getBoundingClientRect().top < h) later(t, function () { show(end); });
        else show(end);
      }
      later(t, done);
    }
    function done() {
      timers.forEach(window.clearTimeout);
      timers = [];
      finishers.forEach(function (f) { f(); });
      root.classList.add("stream-done");
      stopListening();
    }
    var SKIP = ["keydown", "wheel", "touchstart", "mousedown"];
    function stopListening() { SKIP.forEach(function (ev) { window.removeEventListener(ev, done, true); }); }
    SKIP.forEach(function (ev) { window.addEventListener(ev, done, { capture: true, passive: true }); });

    typeBar(function () { typeTitle(function () { typeMeta(streamProse); }); });
  }

  /* —— The end: once (END) is fully in view, a koi swims across it, once per
        visit, from a random side; day or night radicals to match the page.
        The engine stops and clears itself when the koi is out. Skipped when
        motion is reduced. —— */
  function watchEnd(canvas) {
    var eof = document.querySelector(".post-eof");
    if (!canvas || !eof || !window.OceanEngine || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      var themes = window.OceanThemes || {};
      var night = document.body.classList.contains("theme-night");
      var ocean = new window.OceanEngine(canvas, [{ kind: "koi", size: 0.62 }], 0, night ? themes.GLYPH_NIGHT : themes.GLYPH_DAY);
      ocean.setGrid(false);
      var r = eof.getBoundingClientRect();
      ocean.swimAcross(r.top + r.height / 2, Math.random() < 0.5 ? 1 : -1);
    }, { threshold: 1 });
    io.observe(eof);
  }

  /* —— The prompt after (END): a few commands, like the notes shell. —— */
  function setupShell() {
    var input = document.getElementById("post-input");
    var out = document.querySelector(".post-end .sh-out");
    if (!input || !out) return;
    function link(sel) { var a = document.querySelector(sel); return a ? a.href : null; }
    var to = {
      notes: link(".post-back"),
      next: link('.post-pager a[data-pager="next"]'),
      prev: link('.post-pager a[data-pager="prev"]'),
    };
    var root = new URL("./", to.notes || location.href).href.replace(/notes\/$/, "");
    function say(text, prompt) {
      var p = document.createElement("p");
      if (prompt) {
        p.innerHTML = '<span class="sh-prompt">yen@taiwan</span>:<span class="sh-path">~/notes</span>$ ';
        p.appendChild(document.createTextNode(text));
      } else {
        p.className = "sh-dim";
        p.textContent = text;
      }
      out.appendChild(p);
      while (out.children.length > 14) out.removeChild(out.firstChild);
    }
    function theme(arg) {
      var t = window.siteTheme;
      if (!t) return say("theme: not available");
      if (arg === "day" || arg === "night" || arg === "auto") { t.set(arg); return say("theme: " + arg); }
      say("theme: " + t.pref() + "　（用法：theme day / night / auto）");
    }
    function go(url) { window.setTimeout(function () { location.href = url; }, 260); }
    function run(raw) {
      var line = raw.trim().replace(/\s+/g, " ");
      if (!line) return;
      say(line, true);
      var w = line.split(" ");
      var arg = w[1] || "";
      if (w[0] === "cd") {
        if (arg === "" || arg === "~" || arg === "~/" || arg === "/") return go(root);
        if (arg === ".." || arg === "../" || arg === "~/notes" || arg === "notes") return go(to.notes);
        if (arg === "-") return window.setTimeout(function () { history.back(); }, 260);
        if (arg === "works" || arg === "../works" || arg === "~/works") return go(root + "works/");
        return say("cd: no such file or directory: " + arg);
      }
      if (w[0] === "ls") return go(to.notes);
      if (w[0] === "next" || w[0] === "prev" || (w[0] === "cat" && (arg === "next" || arg === "prev"))) {
        var which = w[0] === "cat" ? arg : w[0];
        if (to[which]) return go(to[which]);
        return say(which === "next" ? "this is the newest note. 這已經是最新的一篇。" : "this is the first note. 這是第一篇。");
      }
      if (w[0] === "top") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      if (w[0] === "clear") { out.innerHTML = ""; return; }
      if (w[0] === "theme") return theme(arg);
      if (w[0] === "whoami") return say("yen — product manager @Taiwan. I build things, then make sense of them.");
      if (w[0] === "pwd") return say("/home/yen/notes");
      if (w[0] === "sudo") return say("yen is not in the sudoers file. This incident will be reported.");
      if (w[0] === "exit" || w[0] === "home") return go(root);
      if (w[0] === "help") {
        say("cd ..     back to notes        回到文章列表（也可以打 ls）");
        say("cd ~      go home              回首頁");
        say("cd -      go back              回上一頁");
        say("next      newer note           下一篇（較新）");
        say("prev      older note           上一篇（較舊）");
        say("top       back to the top      回到頁首");
        say("theme     day / night / auto   切換日夜（auto 跟隨系統）");
        say("whoami    who is Yen           我是誰");
        say("clear     clear the screen     清除畫面");
        return say("help      show this list       列出這些指令");
      }
      say("sh: command not found: " + w[0] + " — try help（輸入 help 看看可以做什麼）");
    }
    input.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      run(input.value);
      input.value = "";
    });
    // Back from the next page: an empty prompt again.
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) { input.value = ""; out.innerHTML = ""; }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    labelCode();
    // Start typing once any page transition has finished (pagereveal has fired
    // by the first frame) and the fonts are in (at most 400ms), so the first
    // characters don't stall while the Chinese face is still coming in.
    requestAnimationFrame(function () {
      var landed = (document.activeViewTransition && document.activeViewTransition.finished) || Promise.resolve();
      var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      var cap = new Promise(function (res) { window.setTimeout(res, 400); });
      var go = function () { Promise.race([fonts, cap]).then(stream, stream); };
      landed.then(go, go);
    });
    setupShell();
    watchEnd(document.querySelector("canvas[data-koi]"));
    buildRail();
    layout();
    window.addEventListener("resize", layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  });
})();
