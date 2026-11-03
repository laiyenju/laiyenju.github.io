(function () {
  "use strict";

  /* —— Home views: notes / works swap in place of the home copy.
        The nav stays put; the old view is cleared at once, like a terminal
        screen, and the new one types itself out a line at a time (print
        below). The click startles the koi: they bolt out of frame and one
        small koi stays. The new view waits a beat so the scatter reads first. —— */

  var OUT_MS = 200;
  var LIST_LIMIT = 6;
  var TYPE_MS = 8; // ms per character for a line of output
  var TYPE_MAX = 260; // no line of output takes longer than this (ms)
  var TITLES = { home: "hey, I'm Yen", notes: "Notes · Yen", works: "Works · Yen" };

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var current = "home";
  var busy = 0;

  /* —— The printer: every line of the home, notes and works types itself
        out left to right, one character a step, like a teletype; the next
        line starts before the last one is done, so a list reads as one run.
        Jobs run in order: lines, or a task such as typing a command.
        Lines are hidden the moment they are queued. A key, a click, a scroll
        or a tap prints the rest at once. —— */
  var printer = (function () {
    var queue = [];
    var cur = null;
    var timers = [];
    var SKIP = ["keydown", "wheel", "touchstart", "mousedown"];
    var listening = false;

    function later(ms, fn) { timers.push(window.setTimeout(fn, ms)); }
    function hide(el) { el.classList.add("pr-wait"); }
    function reveal(el) {
      el.classList.remove("pr-wait");
      if (el.getAnimations) el.getAnimations().forEach(function (a) { if (a.id === "pr-type") a.finish(); });
    }
    function listen(on) {
      if (on === listening) return;
      listening = on;
      SKIP.forEach(function (ev) {
        if (on) window.addEventListener(ev, flush, { capture: true, passive: true });
        else window.removeEventListener(ev, flush, { capture: true, passive: true });
      });
    }

    /** The text a line shows: not the whole-word copies kept for screen readers (home.html). */
    function seenText(el) {
      var text = "";
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      var node;
      while ((node = walker.nextNode())) {
        if (!node.parentElement.closest(".sr-only")) text += node.nodeValue;
      }
      return text.replace(/\s+/g, " ").trim();
    }
    /** Type one line; returns how long it takes. */
    function type(el) {
      reveal(el);
      var r = el.getBoundingClientRect();
      var text = seenText(el);
      if (!r.width || !text || !el.animate) return 0;
      var range = document.createRange();
      range.selectNodeContents(el);
      var tr = range.getBoundingClientRect();
      // Clip from where the text starts (centred lines start mid-box).
      var right = Math.max(0, r.right - (tr.width ? tr.left : r.left));
      var n = Math.min(text.length, 120);
      var per = Number(el.getAttribute("data-type-ms")) || TYPE_MS;
      var dur = per > TYPE_MS ? n * per : Math.max(60, Math.min(TYPE_MAX, n * per));
      el.animate(
        [{ clipPath: "inset(-6px " + right + "px -6px -12px)" }, { clipPath: "inset(-6px 0px -6px -12px)" }],
        { duration: dur, easing: "steps(" + n + ", end)", id: "pr-type" }
      );
      return dur;
    }

    function pump() {
      if (cur) return;
      var job = queue.shift();
      if (!job) { listen(false); return; }
      cur = job;
      if (reduceMotion) return finishJob(job);
      listen(true);
      function next() { if (cur !== job) return; cur = null; pump(); }
      if (job.task) return job.task.start(next);
      var i = 0;
      (function step() {
        if (cur !== job) return;
        if (i >= job.lines.length) return next();
        var dur = type(job.lines[i++]);
        // The next line starts as this one is half typed; the last one finishes.
        later(i < job.lines.length ? Math.max(30, dur * 0.5) : dur, step);
      })();
    }
    function finishJob(job) {
      if (job.task) job.task.finish();
      else job.lines.forEach(reveal);
      if (cur === job) cur = null;
      pump();
    }
    /** Everything queued, printed at once. */
    function flush() {
      timers.forEach(window.clearTimeout);
      timers = [];
      var guard = 0;
      while ((cur || queue.length) && guard++ < 100) {
        var job = cur || queue.shift();
        cur = null;
        if (job.task) job.task.finish();
        else job.lines.forEach(reveal);
      }
      listen(false);
    }
    return {
      lines: function (list) {
        list = list.filter(Boolean);
        list.forEach(hide);
        queue.push({ lines: list });
        pump();
      },
      // task: { start(next), finish() } — finish must leave it as start would end.
      task: function (task) { queue.push({ task: task }); pump(); },
      flush: flush,
    };
  })();

  /** A view's lines, top to bottom: list rows and shell output one by one. */
  function linesOf(view) {
    var out = [];
    Array.prototype.forEach.call(view.children, function (el) {
      if (el.hidden) return;
      if (el.classList.contains("panel-list") || el.classList.contains("sh-out")) {
        Array.prototype.forEach.call(el.children, function (c) { if (!c.hidden) out.push(c); });
      } else out.push(el);
    });
    return out;
  }

  /** A view comes on screen: home prints its copy; a list is run by its shell (shell.js). */
  function arrive(name, back, withNav) {
    if (withNav) printer.lines([document.querySelector(".home-nav")]);
    var shell = window.homeShells && window.homeShells[name];
    if (shell) shell.arrive(back);
    else printer.lines(linesOf(viewEl(name)));
  }

  function viewEl(name) {
    return document.querySelector('.home-view[data-view="' + name + '"]');
  }

  // Opened as …/index.html (raw.githack serves no directory index): stay on that file.
  var onFile = /\/index\.html$/.test(location.pathname);

  function urlFor(name) {
    var path = onFile
      ? "index.html" + (name === "home" ? "" : "?view=" + name)
      : name === "home" ? "./" : name + "/";
    return new URL(path, document.baseURI).href;
  }

  function markNav(name) {
    document.body.setAttribute("data-view", name);
    document.querySelectorAll(".home-nav a[data-view-link]").forEach(function (a) {
      if (a.getAttribute("data-view-link") === name) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  /** Lists show LIST_LIMIT rows; "view all" reveals the rest. */
  function setupList(panel) {
    var rows = panel.querySelectorAll(".panel-list li");
    var more = panel.querySelector(".panel-more");
    rows.forEach(function (li, i) {
      li.style.setProperty("--i", String(Math.min(i, LIST_LIMIT)));
      if (i >= LIST_LIMIT) li.hidden = true;
    });
    if (!more || rows.length <= LIST_LIMIT) return;
    more.hidden = false;
    more.textContent = "view all (" + rows.length + ")";
    more.addEventListener("click", function () {
      var extra = [];
      rows.forEach(function (li, i) {
        if (i < LIST_LIMIT) return;
        li.style.setProperty("--i", String(i - LIST_LIMIT));
        li.hidden = false;
        extra.push(li);
      });
      more.hidden = true;
      printer.lines(extra);
    });
  }

  /** opts.back: arriving back from an article; opts.nav: print the nav first (page load). */
  function show(name, animate, x, y, opts) {
    opts = opts || {};
    if (name === current) return;
    var from = viewEl(current);
    var to = viewEl(name);
    if (!to) return;
    var token = ++busy;
    printer.flush();
    current = name;
    markNav(name);
    document.title = TITLES[name] || TITLES.home;
    if (window.homeOcean) window.homeOcean.setCalm(name !== "home", !animate, x, y);

    function enter() {
      if (token !== busy) return;
      document.querySelectorAll(".home-view").forEach(function (el) { el.hidden = el !== to; });
      window.scrollTo(0, 0);
      arrive(name, opts.back, opts.nav);
      if (name !== "home") to.focus({ preventScroll: true });
    }

    if (!animate || !from) {
      enter();
      return;
    }
    // Cleared at once, like a terminal screen; the koi scatter, then the new view prints.
    from.hidden = true;
    window.setTimeout(enter, OUT_MS);
  }

  function go(name, x, y) {
    if (name === current) return;
    history.pushState({ view: name }, "", urlFor(name));
    show(name, !reduceMotion, x, y);
  }

  function start() {
    document.querySelectorAll(".home-panel").forEach(setupList);

    // notes/ and works/ redirect here with ?view=…; put the clean URL back.
    var params = new URLSearchParams(location.search);
    var initial = params.get("view");
    if (initial !== "notes" && initial !== "works") initial = "home";
    history.replaceState({ view: initial }, "", urlFor(initial));
    markNav("home");
    // Every visit prints the page out, nav first (the head script has kept it blank till now).
    var back = window.postReturn;
    window.postReturn = null;
    if (initial === "home") arrive("home", back, true);
    else show(initial, false, undefined, undefined, { back: back, nav: true });
    document.documentElement.classList.remove("print-pending");

    // Back to this page from the back/forward cache (shell.js has put the
    // list back first): print the view again, as on any arrival.
    window.addEventListener("pageshow", function (e) {
      if (!e.persisted) return;
      var r = window.postReturn;
      window.postReturn = null;
      if (!r) return;
      printer.flush();
      arrive(current, r, false);
    });

    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[data-view-link]");
      if (!a || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      var name = a.getAttribute("data-view-link");
      // A second click on the open section goes back home.
      go(name === current && name !== "home" ? "home" : name, e.clientX, e.clientY);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && current !== "home") go("home");
    });

    window.addEventListener("popstate", function (e) {
      var name = (e.state && e.state.view) || "home";
      show(name, !reduceMotion);
    });
  }

  window.homeViews = { start: start };
  window.homePrint = printer;
})();
