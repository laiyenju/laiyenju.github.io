(function () {
  "use strict";

  /* —— Article pages: plain paper, nothing moving while reading. Footnotes
        move into the right margin on wide screens. —— */

  /* The column (680) stays centred; the rail needs 28px + at least 160px + 16px
     on its right: (680 + 2 × 204) = 1088. Narrower, the notes go to the end. */
  var RAIL_MIN = 1088;
  var GAP = 12;

  var post = document.querySelector(".post");
  var prose = document.querySelector(".post-prose");
  // Interface language, set before first paint (theme-boot.html).
  var ZH = document.documentElement.classList.contains("ui-zh");
  function t(en, zh) { return ZH ? zh : en; }

  /* —— Images. A paragraph holding only images becomes figures: one image
        on its own, two or more side by side (.post-gallery). The caption is
        the image's title, ![alt](src "caption"). Built before the arrival
        measures the first screen. —— */
  var figures = [];
  function buildFigures() {
    if (!prose) return;
    prose.querySelectorAll(":scope > p").forEach(function (p) {
      var imgs = p.querySelectorAll(":scope > img");
      if (!imgs.length) return;
      var onlyImages = Array.prototype.every.call(p.childNodes, function (n) {
        return (n.nodeType === 1 && (n.tagName === "IMG" || n.tagName === "BR")) || (n.nodeType === 3 && !n.textContent.trim());
      });
      if (!onlyImages) return;
      var box = imgs.length > 1 ? document.createElement("div") : null;
      if (box) box.className = "post-gallery";
      var made = Array.prototype.map.call(imgs, function (img) {
        var fig = document.createElement("figure");
        fig.className = "post-fig";
        var cap = img.getAttribute("title") || "";
        img.removeAttribute("title");
        fig.appendChild(img);
        if (cap) {
          var fc = document.createElement("figcaption");
          fc.textContent = cap;
          fig.appendChild(fc);
        }
        // A tall image alone is set narrower, so it doesn't fill more than a screen.
        function measure() {
          if (!box && img.naturalHeight > img.naturalWidth * 1.1) fig.classList.add("is-tall");
        }
        if (img.complete) measure(); else img.addEventListener("load", measure);
        figures.push({ img: img, cap: cap });
        return fig;
      });
      var node = box || made[0];
      if (box) made.forEach(function (f) { box.appendChild(f); });
      p.replaceWith(node);
    });
  }
  buildFigures();

  /* —— Headings run in: a heading followed by a paragraph becomes the
        start of that paragraph. It stays a heading for screen readers
        (role, level) and keeps its id, so links to it still work. —— */
  function runInHeadings() {
    if (!prose) return;
    prose.querySelectorAll(":scope > :is(h1, h2, h3, h4, h5, h6)").forEach(function (h) {
      var p = h.nextElementSibling;
      if (!p || p.tagName !== "P") return;
      var s = document.createElement("span");
      s.className = "post-runin";
      s.setAttribute("role", "heading");
      s.setAttribute("aria-level", h.tagName.charAt(1));
      if (h.id) s.id = h.id;
      s.innerHTML = h.innerHTML;
      p.insertBefore(s, p.firstChild);
      h.remove();
    });
  }
  runInHeadings();

  /* —— Enlarged view: click an image. Esc or a click on the image closes;
        arrows, the buttons or a swipe go to the other images of the note. —— */
  var ICON = {
    close: '<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M2 2 42 42M42 2 2 42"/></svg>',
    prev: '<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M42 22H2M22 2 2 22l20 20"/></svg>',
    next: '<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M2 22h40M22 2l20 20-20 20"/></svg>',
  };
  var lb = null;
  var lbAt = 0;
  var lbReturn = null;
  function lbButton(cls, icon, en, zh) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.setAttribute("aria-label", t(en, zh));
    b.innerHTML = ICON[icon];
    return b;
  }
  function buildLightbox() {
    if (!figures.length) return;
    lb = document.createElement("div");
    lb.className = "lb";
    lb.hidden = true;
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", t("Image", "圖片"));
    lb.tabIndex = -1;
    var close = lbButton("lb-close", "close", "Close", "關閉");
    var prev = lbButton("lb-prev", "prev", "Previous image", "上一張");
    var next = lbButton("lb-next", "next", "Next image", "下一張");
    var count = document.createElement("p");
    count.className = "lb-count";
    count.setAttribute("aria-live", "polite");
    var cap = document.createElement("p");
    cap.className = "lb-cap";
    var stage = document.createElement("div");
    stage.className = "lb-stage";
    var img = document.createElement("img");
    img.className = "lb-img";
    img.alt = "";
    stage.appendChild(img);
    [close, cap, prev, count, next, stage].forEach(function (el) { lb.appendChild(el); });
    lb.classList.toggle("is-single", figures.length < 2);
    document.body.appendChild(lb);

    close.addEventListener("click", closeLightbox);
    stage.addEventListener("click", closeLightbox);
    prev.addEventListener("click", function () { showAt(lbAt - 1); });
    next.addEventListener("click", function () { showAt(lbAt + 1); });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); closeLightbox(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); showAt(lbAt - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); showAt(lbAt + 1); }
      else if (e.key === "Tab") {
        // Keep focus inside: close, prev, next.
        var f = [close, prev, next].filter(function (b) { return getComputedStyle(b).visibility !== "hidden"; });
        var i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
      }
    });
    var x0 = null;
    stage.addEventListener("touchstart", function (e) { x0 = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 50 && figures.length > 1) { e.preventDefault(); showAt(lbAt + (dx < 0 ? 1 : -1)); }
    });

    function showAt(i) {
      lbAt = (i + figures.length) % figures.length;
      var f = figures[lbAt];
      img.src = f.img.currentSrc || f.img.src;
      img.alt = f.img.alt || "";
      cap.textContent = f.cap;
      count.textContent = lbAt + 1 + " / " + figures.length;
    }
    function openAt(i) {
      lbReturn = document.activeElement;
      showAt(i);
      lb.hidden = false;
      document.documentElement.classList.add("lb-lock");
      requestAnimationFrame(function () { lb.classList.add("is-open"); });
      // Focus the dialog itself: keys work at once, and no ring around close after a click.
      lb.focus();
    }
    function closeLightbox() {
      lb.classList.remove("is-open");
      document.documentElement.classList.remove("lb-lock");
      lb.hidden = true;
      if (lbReturn && lbReturn.focus) lbReturn.focus();
    }
    figures.forEach(function (f, i) {
      f.img.addEventListener("click", function () { openAt(i); });
    });
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
    // Rows of images reach into the margin; a note never sits beside one.
    var rows = Array.prototype.map.call(prose.querySelectorAll(".post-gallery"), function (g) {
      var r = g.getBoundingClientRect();
      return { top: r.top - top, bottom: r.bottom - top };
    });
    notes.forEach(function (n) {
      // Level with the reference's line; push down if the previous note is still there.
      var y = Math.max(n.ref.getBoundingClientRect().top - top - 2, floor);
      var h = n.note.offsetHeight;
      rows.forEach(function (r) { if (y < r.bottom + GAP && y + h > r.top - GAP) y = r.bottom + GAP; });
      n.note.style.top = y + "px";
      floor = y + h + GAP;
    });
  }

  function layout() {
    layoutRail();
  }

  /* —— Arrival, like `cat` in a terminal: the title typed character by
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
    var title = document.querySelector(".post-title");
    var sub = document.querySelector(".post-subtitle");
    var meta = document.querySelector(".post-meta");
    var end = document.querySelector(".post-end");
    var h = window.innerHeight;

    function show(el) { if (el) el.classList.add("is-shown"); }

    function typeBar(next) {
      show(bar);
      next();
    }
    function typeTitle(next) {
      if (!title) return next();
      show(title);
      var len = title.textContent.length;
      var per = Math.max(16, Math.min(42, Math.floor(600 / Math.max(1, len))));
      finishers.push(typeText(title, per, next, true));
    }
    function typeMeta(next) {
      show(sub);
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
    var root = new URL("./", to.notes || location.href).href;
    function say(text, prompt) {
      var p = document.createElement("p");
      if (prompt) {
        p.innerHTML = '<span class="sh-dir">~/notes</span> <span class="sh-arrow">❯</span> '; // short, as in shell.js
        p.appendChild(document.createTextNode(text));
      } else {
        p.className = "sh-dim";
        p.textContent = text;
      }
      out.appendChild(p);
      while (out.children.length > 14) out.removeChild(out.firstChild);
    }
    if (ZH && input.getAttribute("data-label-zh")) input.setAttribute("aria-label", input.getAttribute("data-label-zh"));
    function theme(arg) {
      var th = window.siteTheme;
      if (!th) return say("theme: not available");
      if (arg === "day" || arg === "night" || arg === "auto") { th.set(arg); return say("theme: " + arg); }
      say("theme: " + th.pref() + t("  (usage: theme day / night / auto)", "　（用法：theme day / night / auto）"));
    }
    function go(url) { window.setTimeout(function () { markReturn(); location.href = url; }, 260); }
    function run(raw) {
      var line = raw.trim().replace(/\s+/g, " ");
      if (!line) return;
      say(line, true);
      var w = line.split(" ");
      var arg = w[1] || "";
      if (w[0] === "cd") {
        if (arg === "" || arg === "~" || arg === "~/" || arg === "/") return go(root);
        if (arg === ".." || arg === "../" || arg === "~/notes" || arg === "notes") return window.setTimeout(backToNotes, 260);
        if (arg === "-") return window.setTimeout(function () { history.back(); }, 260);
        if (arg === "works" || arg === "../works" || arg === "~/works") return go(root + "?view=works");
        return say("cd: no such file or directory: " + arg);
      }
      if (w[0] === "ls") return window.setTimeout(backToNotes, 260);
      if (w[0] === "next" || w[0] === "prev" || (w[0] === "cat" && (arg === "next" || arg === "prev"))) {
        var which = w[0] === "cat" ? arg : w[0];
        if (to[which]) return go(to[which]);
        return say(which === "next" ? t("this is the newest note.", "這已經是最新的一篇。") : t("this is the first note.", "這是第一篇。"));
      }
      if (w[0] === "top") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      if (w[0] === "clear") { out.innerHTML = ""; return; }
      if (w[0] === "theme") return theme(arg);
      if (w[0] === "whoami") return say("yen — product manager @Taiwan. I write about how products get decided.");
      if (w[0] === "pwd") return say("/home/yen/notes");
      if (w[0] === "sudo") return say("yen is not in the sudoers file. This incident will be reported.");
      if (w[0] === "exit" || w[0] === "home") return go(root);
      if (w[0] === "help" && window.matchMedia && window.matchMedia("(hover: none) and (pointer: coarse)").matches) {
        // Touch screens: only what the buttons below can do (see shell.js).
        say(t("tap a command below", "點選下方的指令"));
        say("top     " + t("back to the top", "回到頁首"));
        say("cd ..   " + t("back to notes", "回到文章列表"));
        return say("theme   " + t("day / night / auto", "切換日夜主題模式"));
      }
      if (w[0] === "help") {
        say("cd ..     " + t("back to notes (or ls)", "回到文章列表（也可以輸入 ls）"));
        say("cd ~      " + t("go home", "回首頁"));
        say("cd -      " + t("go back", "回上一頁"));
        say("next      " + t("newer note", "下一個（較新的文章）"));
        say("prev      " + t("older note", "上一個（較舊的文章）"));
        say("top       " + t("back to the top", "回到頁首"));
        say("theme     " + t("day / night / auto (auto follows the system)", "切換日夜主題模式（auto 跟隨系統）"));
        say("whoami    " + t("who is Yen", "看網站作者是誰"));
        say("clear     " + t("clear the screen", "清除畫面"));
        return say("help      " + t("show this list", "查看操作指令"));
      }
      say("sh: command not found: " + w[0] + t(" — try help", "（輸入 help 查看操作指令）"));
    }
    input.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      run(input.value);
      input.value = "";
    });
    // Touch screens: the commands as buttons, so the keyboard never comes up (see shell.js).
    var row = document.createElement("div");
    row.className = "sh-taps";
    ["help", "top", "cd ..", "theme"].forEach(function (cmd) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = cmd;
      b.addEventListener("click", function () {
        run(cmd === "theme" && window.siteTheme && window.siteTheme.next ? "theme " + window.siteTheme.next() : cmd);
      });
      row.appendChild(b);
    });
    input.closest(".sh-live").after(row);
    // Back from the next page: an empty prompt again.
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) { input.value = ""; out.innerHTML = ""; }
    });
  }

  /* —— Back to the list. Opened from the notes list, the list is still one
        step back in history, and the browser keeps that page as it was
        (back/forward cache): going back shows it at once, as it was, with
        no reload. Opened any other way (a shared link, a new tab, next/prev),
        follow the link to the home page's notes view. —— */
  function cameFromNotes() {
    var from;
    try { from = new URL(document.referrer); } catch (e) { return false; }
    if (from.origin !== location.origin) return false;
    if (!/\/notes\/?$/.test(from.pathname) && from.searchParams.get("view") !== "notes") return false;
    var nav = window.navigation;
    return nav && typeof nav.canGoBack === "boolean" ? nav.canGoBack : history.length > 1;
  }
  function backToNotes() {
    markReturn();
    if (cameFromNotes()) { history.back(); return; }
    var a = document.querySelector(".post-back");
    location.href = a ? a.href : new URL("./?view=notes", document.baseURI).href;
  }
  // $ cd .. stays lit in reverse video for a beat, as a list row does when it
  // opens, then the page is gone in one cut (no fade: see home.html).
  var back = document.querySelector(".post-back");
  if (back) back.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    back.classList.add("is-opening");
    window.setTimeout(backToNotes, 90);
  });

  /* —— Leaving: the home page reads this, so it can come back the way a
        shell does when a pager quits: no fade, the notes list as it was with
        `cat <file>` in its history, and other views printed line by line.
        Set on every way out (the link, a typed command, the back button). —— */
  var FILE = decodeURIComponent(location.pathname.split("/").pop() || "").replace(/\.html?$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "") + ".md";
  function markReturn() {
    try { sessionStorage.setItem("post-return", JSON.stringify({ path: location.pathname, file: FILE, t: Date.now() })); } catch (e) {}
  }
  window.addEventListener("pagehide", markReturn);
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    if (back) back.classList.remove("is-opening");
    try { sessionStorage.removeItem("post-return"); } catch (err) {}
  });

  document.addEventListener("DOMContentLoaded", function () {
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
    buildRail();
    buildLightbox();
    layout();
    window.addEventListener("resize", layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  });
})();
