(function () {
  "use strict";

  /* —— Article pages: one small koi roams the plain paper and hurries
        across the text; footnotes move into the right margin on wide
        screens. —— */

  var RAIL_MIN = 1180;
  /* Phones get no koi (the canvas is also hidden in CSS below this width). */
  var KOI_MIN = 760;
  var GAP = 12;

  var post = document.querySelector(".post");
  var prose = document.querySelector(".post-prose");
  var ocean = null;

  var TEXT = ".post-head, .post-prose > *, .post-end, .post-note";
  var queued = false;

  var heads = [];
  var currentHead = null;

  /** The cursor sits on the title, then on whichever h2 the reader has scrolled past. */
  function markHead() {
    var line = window.innerHeight * 0.4;
    var next = heads[0] || null;
    for (var i = 1; i < heads.length; i++) {
      if (heads[i].getBoundingClientRect().top < line) next = heads[i];
    }
    if (next === currentHead) return;
    if (currentHead) currentHead.classList.remove("is-current");
    if (next) next.classList.add("is-current");
    currentHead = next;
  }

  /** Hand the koi the on-screen text boxes (the canvas is fixed, so client px = canvas px). */
  function markText() {
    queued = false;
    markHead();
    if (!ocean) return;
    var boxes = [];
    var h = window.innerHeight;
    document.querySelectorAll(TEXT).forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > h || !r.width) return;
      boxes.push(r.left, r.top, r.right, r.bottom);
    });
    ocean.setTextRects(new Float32Array(boxes));
  }

  function queueText() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(markText);
  }

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
    markText();
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

  /* —— Print: the blocks on the first screen appear one after another, like
        terminal output; everything below is shown at once. (Off when motion
        is reduced: the head script then never adds .post-print.) —— */
  var PRINT = ".post-head > *, .post-prose > *, .post-end";
  function print() {
    var root = document.documentElement;
    if (!root.classList.contains("post-print")) return;
    var h = window.innerHeight;
    var n = 0;
    document.querySelectorAll(PRINT).forEach(function (el) {
      var top = el.getBoundingClientRect().top;
      el.style.setProperty("--print-delay", (top < h ? n++ * 30 : 0) + "ms");
      el.classList.add("is-printed");
    });
  }

  /** Day radicals on paper, night radicals on the dark palette. */
  function startKoi(canvas) {
    if (ocean) ocean.destroy();
    var themes = window.OceanThemes || {};
    var night = document.body.classList.contains("theme-night");
    ocean = new window.OceanEngine(canvas, [{ kind: "koi", size: 0.62 }], 0, night ? themes.GLYPH_NIGHT : themes.GLYPH_DAY);
    ocean.setCalm(true, true);
    ocean.setGrid(false);
    queueText();
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
    print();
    setupShell();
    heads = Array.prototype.slice.call(document.querySelectorAll(".post-title, .post-prose h2"));
    var canvas = document.querySelector("canvas[data-koi]");
    if (canvas && window.OceanEngine && window.innerWidth >= KOI_MIN) startKoi(canvas);
    var dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    if (dark) dark.addEventListener("change", function (e) {
      document.body.classList.toggle("theme-night", e.matches);
      if (ocean) startKoi(canvas);
    });
    buildRail();
    layout();
    window.addEventListener("resize", layout);
    window.addEventListener("scroll", queueText, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  });
})();
