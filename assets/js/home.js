(function () {
  "use strict";

  /* —— Home views: notes / works swap in place of the home copy.
        The nav stays put; the old view fades up and out, the new one
        settles in from just below, list rows a beat apart. The click
        startles the koi: they bolt out of frame and one small koi stays.
        The list waits a beat so the scatter reads first. —— */

  var OUT_MS = 340;
  var LIST_LIMIT = 6;
  var PRINT_TICK = 28; // ms per line when a view prints itself, back from an article
  var TITLES = { home: "hey, I'm Yen", notes: "Notes · Yen", works: "Works · Yen" };

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var current = "home";
  var busy = 0;

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
      if (reduceMotion) return;
      extra.forEach(function (li) { li.classList.add("is-before"); });
      void panel.offsetHeight;
      extra.forEach(function (li) { li.classList.remove("is-before"); });
    });
  }

  function show(name, animate, x, y) {
    if (name === current) return;
    var from = viewEl(current);
    var to = viewEl(name);
    if (!to) return;
    var token = ++busy;
    current = name;
    markNav(name);
    document.title = TITLES[name] || TITLES.home;
    if (window.homeOcean) window.homeOcean.setCalm(name !== "home", !animate, x, y);

    function enter() {
      if (token !== busy) return;
      document.querySelectorAll(".home-view").forEach(function (el) {
        el.hidden = el !== to;
        el.classList.remove("is-out");
      });
      window.scrollTo(0, 0);
      if (animate) {
        to.classList.add("is-before");
        void to.offsetHeight;
        to.classList.remove("is-before");
      }
      if (name !== "home") to.focus({ preventScroll: true });
    }

    if (!animate || !from) {
      enter();
      return;
    }
    from.classList.add("is-out");
    window.setTimeout(enter, OUT_MS);
  }

  /* Back from an article to home or works: the view prints a line at a
     time, top to bottom, like command output. No fade, no slide. */
  function linesOf(view) {
    var out = [];
    Array.prototype.forEach.call(view.children, function (el) {
      if (el.hidden) return;
      if (el.classList.contains("panel-list")) {
        Array.prototype.forEach.call(el.children, function (li) { if (!li.hidden) out.push(li); });
      } else out.push(el);
    });
    return out;
  }
  function print(name) {
    var lines = [document.querySelector(".home-nav")].concat(linesOf(viewEl(name)));
    lines.forEach(function (el) { el.classList.add("pr-wait"); });
    document.documentElement.classList.remove("post-return-print");
    if (reduceMotion) { lines.forEach(function (el) { el.classList.remove("pr-wait"); }); return; }
    var i = 0;
    (function step() {
      lines[i++].classList.remove("pr-wait");
      if (i < lines.length) window.setTimeout(step, PRINT_TICK);
    })();
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
    show(initial, false);
    if (document.documentElement.classList.contains("post-return-print")) print(initial);
    // The note is for this arrival only (shell.js reads it first, for the lists).
    window.setTimeout(function () { window.postReturn = null; }, 0);

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
})();
