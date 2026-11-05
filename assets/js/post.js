(function () {
  "use strict";
  // where Yen is: one setting for the whole site (assets/js/sky.js); Taipei if that file did not load
  var CITY = (window.siteSky && window.siteSky.CITY) || { name: "Taipei", short: "taipei", tz: 8 };

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
    var title = document.querySelector(".post-title");
    var sub = document.querySelector(".post-subtitle");
    var meta = document.querySelector(".post-meta");
    var end = document.querySelector(".post-end");
    var h = window.innerHeight;

    function show(el) { if (el) el.classList.add("is-shown"); }

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

    typeTitle(function () { typeMeta(streamProse); });
  }

  /* —— Back to the list. Opened from the notes list, the list is still one
        step back in history, and the browser keeps that page as it was
        (back/forward cache): going back shows it at once, as it was, with
        no reload. Opened any other way (a shared link, a new tab),
        follow the link to the home page's notes view. —— */
  // opened from the list on the home page (it says so as it leaves, day.js): the list is one step back
  var FROM_LIST = false;
  try { FROM_LIST = sessionStorage.getItem("post-from-list") === location.pathname; sessionStorage.removeItem("post-from-list"); } catch (e) {}
  function cameFromNotes() {
    var nav = window.navigation, canBack = nav && typeof nav.canGoBack === "boolean" ? nav.canGoBack : history.length > 1;
    if (FROM_LIST) return canBack;
    var from;
    try { from = new URL(document.referrer); } catch (e) { return false; }
    if (from.origin !== location.origin) return false;
    if (!/\/notes\/?$/.test(from.pathname) && from.searchParams.get("view") !== "notes") return false;
    return canBack;
  }
  function backToNotes() {
    markReturn(true);
    if (cameFromNotes()) { history.back(); return; }
    var a = document.querySelector(".post-to-notes");
    location.href = a ? a.href : new URL("./?view=notes", document.baseURI).href;
  }
  // ← Notes on the date card: back to the list
  document.querySelectorAll(".post-to-notes").forEach(function (el) {
    el.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      backToNotes();
    });
  });

  /* —— Leaving: the home page reads this, so it can come back the way a
        shell does when a pager quits: no fade, the notes list as it was with
        `cat <file>` in its history, and other views printed line by line.
        Set on every way out (the link, a typed command, the back button). —— */
  var FILE = decodeURIComponent(location.pathname.split("/").pop() || "").replace(/\.html?$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "") + ".md";
  // toList: leaving for the notes list (← Notes), so the home page shows the list again.
  // home: leaving by Home, so the home page starts clean. Neither (the browser's back button): back to the list too.
  var leavingToList = false, leavingHome = false;
  function markReturn(to) {
    if (to === true) leavingToList = true;
    if (to === "home") leavingHome = true;
    try { sessionStorage.setItem("post-return", JSON.stringify({ path: location.pathname, file: FILE, t: Date.now(), toList: leavingToList, home: leavingHome })); } catch (e) {}
  }
  document.querySelectorAll(".post-home").forEach(function (el) {
    el.addEventListener("click", function () { markReturn("home"); });
  });
  window.addEventListener("pagehide", function () { markReturn(); });
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    leavingToList = false; leavingHome = false;
    try { sessionStorage.removeItem("post-return"); } catch (err) {}
  });

  /* —— The date card at the top: today where Yen is, as on the home page (CITY: see the top of this file). —— */
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function two(n) { return (n < 10 ? "0" : "") + n; }
  function tick() {
    var d = new Date(Date.now() + CITY.tz * 3600e3);
    var date = document.querySelector('[data-clock="date"]'), time = document.querySelector('[data-clock="time"]');
    if (!date || !time) return;
    date.textContent = d.getUTCFullYear() + "." + two(d.getUTCMonth() + 1) + "." + two(d.getUTCDate());
    // the weekday in its own span: a narrow screen leaves it out (site.css .wd)
    var wd = DAYS[d.getUTCDay()];
    // the weekday and city stay put; the time, to the second, rolls digit by digit (sky.js rollClock)
    if (time.getAttribute("data-wd") !== wd) {
      time.setAttribute("data-wd", wd);
      time.innerHTML = '<span class="wd">' + wd + " · </span>" + CITY.name + ' <span class="roll"></span>';
    }
    if (window.siteSky && siteSky.rollClock) siteSky.rollClock(time.querySelector(".roll"));
    window.setTimeout(tick, 1000 - (Date.now() % 1000) + 15);
  }

  document.addEventListener("DOMContentLoaded", function () {
    tick();
    // Start typing once the fonts are in (at most 400ms), so the first
    // characters don't stall while the Chinese face is still coming in.
    requestAnimationFrame(function () {
      var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      var cap = new Promise(function (res) { window.setTimeout(res, 400); });
      Promise.race([fonts, cap]).then(stream, stream);
    });
    buildRail();
    buildLightbox();
    layout();
    window.addEventListener("resize", layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  });
})();
