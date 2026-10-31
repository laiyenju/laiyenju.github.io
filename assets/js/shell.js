(function () {
  "use strict";

  /* —— Notes / works shell. Each panel types its ls command when it opens,
        then takes commands on its last prompt (a small easter egg):
        cd ~ / cd .. go home, cd - goes back, cd notes / cd works, ls,
        clear, whoami, help. —— */

  function view() { return document.body.getAttribute("data-view") || "home"; }
  // Interface language, set before first paint (theme-boot.html).
  var ZH = document.documentElement.classList.contains("ui-zh");
  function t(en, zh) { return ZH ? zh : en; }
  function touch() { return !!window.matchMedia && window.matchMedia("(hover: none) and (pointer: coarse)").matches; }

  /* Touch screens get a row of commands as buttons under the prompt, since
     typing would call up the keyboard and push the page up (CSS shows the
     row and hides the input only there). "theme" runs as the next setting. */
  function tapCommands(input, cmds, run) {
    var row = document.createElement("div");
    row.className = "sh-taps";
    cmds.forEach(function (cmd) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = cmd;
      b.addEventListener("click", function () {
        run(cmd === "theme" && window.siteTheme && window.siteTheme.next ? "theme " + window.siteTheme.next() : cmd);
      });
      row.appendChild(b);
    });
    input.closest(".sh-live").after(row);
  }

  var previous = "home";
  var shown = view();
  var shells = {};
  Array.prototype.forEach.call(document.querySelectorAll(".sh-panel"), function (panel) {
    var name = panel.getAttribute("data-view");
    var cmd = panel.querySelector(".sh-cmd");
    var out = panel.querySelector(".sh-out");
    var input = panel.querySelector(".sh-input");
    if (ZH && input.getAttribute("data-label-zh")) input.setAttribute("aria-label", input.getAttribute("data-label-zh"));
    var path = panel.getAttribute("data-path");
    var other = name === "notes" ? "works" : "notes";
    var typing = 0;

    function typeCommand(then) {
      var text = cmd.getAttribute("data-cmd");
      var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.clearInterval(typing);
      function done() {
        cmd.classList.remove("is-typing");
        panel.classList.remove("is-listing");
        if (then) then();
      }
      if (still) { cmd.textContent = text; done(); return; }
      var n = 0;
      cmd.textContent = "";
      cmd.classList.add("is-typing");
      panel.classList.add("is-listing");
      typing = window.setInterval(function () {
        cmd.textContent = text.slice(0, ++n);
        if (n >= text.length) { window.clearInterval(typing); window.setTimeout(done, 180); }
      }, 70);
    }
    // Clear wipes the whole screen, list included, then the shell lists again.
    function relist() {
      out.innerHTML = "";
      cmd.textContent = "";
      panel.classList.add("is-listing");
      window.setTimeout(function () { typeCommand(function () { input.focus({ preventScroll: true }); }); }, 260);
    }
    function say(text, prompt) {
      var p = document.createElement("p");
      if (prompt) {
        // A command that has run keeps only a short prompt; the full one is
        // for the line you can still type on.
        p.innerHTML = '<span class="sh-dir"></span> <span class="sh-arrow">❯</span> ';
        p.querySelector(".sh-dir").textContent = path;
        p.appendChild(document.createTextNode(text));
      } else {
        p.className = "sh-dim";
        p.textContent = text;
      }
      out.appendChild(p);
      while (out.children.length > 14) out.removeChild(out.firstChild);
    }
    function goTo(to) {
      window.setTimeout(function () {
        var link = to === "home" ? panel.querySelector(".panel-back") : document.querySelector('.home-nav a[data-view-link="' + to + '"]');
        if (link) link.click();
      }, 260);
    }
    var list = name === "notes" ? t("list notes again", "列出文章") : t("list works again", "列出作品");
    var COMMANDS = {
      help: function () {
        // Touch screens: only what the buttons below can do, short enough for a phone.
        if (touch()) {
          say(t("tap a command below", "點選下方的指令"));
          say("whoami  " + t("who is Yen", "看網站作者是誰"));
          say("theme   " + t("day / night / auto", "切換日夜主題模式"));
          return say("cd ~    " + t("go home", "回首頁"));
        }
        say("cd ~      " + t("go home (or cd, cd ..)", "回首頁（也可以輸入 cd 或 cd ..）"));
        say("cd -      " + t("go back", "回上一頁"));
        say("cd " + other + "  " + (other === "notes" ? t("read notes", "查看文章") : t("see works", "查看作品")));
        say("ls        " + list);
        say("theme     " + t("day / night / auto (auto follows the system)", "切換日夜主題模式（auto 跟隨系統）"));
        say("whoami    " + t("who is Yen", "看網站作者是誰"));
        say("clear     " + t("clear the screen", "清除畫面並重新列出"));
        say("help      " + t("show this list", "查看操作指令"));
      },
      theme: function (arg) {
        var th = window.siteTheme;
        if (!th) return say("theme: not available");
        if (arg === "day" || arg === "night" || arg === "auto") { th.set(arg); return say("theme: " + arg); }
        say("theme: " + th.pref() + t("  (usage: theme day / night / auto)", "　（用法：theme day / night / auto）"));
      },
      whoami: function () { say("yen — product manager @Taiwan. I write about how products get decided."); },
      pwd: function () { say("/home/yen/" + name); },
      ls: relist,
      clear: relist,
    };
    function run(raw) {
      var line = raw.trim().replace(/\s+/g, " ");
      if (!line) return;
      say(line, true);
      var words = line.split(" ");
      if (words[0] === "cd") {
        var to = words[1] || "~";
        if (to === "~" || to === ".." || to === "/" || to === "~/") return goTo("home");
        if (to === "-") return goTo(previous === name ? "home" : previous);
        if (to === "." || to === path || to === name) return;
        if (to === other || to === "../" + other || to === "~/" + other) return goTo(other);
        return say("cd: no such file or directory: " + to);
      }
      if (words[0] === "ls") return relist();
      if (words[0] === "sudo") return say("yen is not in the sudoers file. This incident will be reported.");
      if (words[0] === "exit" || words[0] === "home") return goTo("home");
      if (COMMANDS[words[0]]) return COMMANDS[words[0]](words[1]);
      say("sh: command not found: " + words[0] + t(" — try help", "（輸入 help 查看操作指令）"));
    }
    input.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      run(input.value);
      input.value = "";
    });
    tapCommands(input, ["help", "whoami", "theme", "cd ~"], run);
    shells[name] = { open: function () { out.innerHTML = ""; typeCommand(); }, input: input };
  });

  new MutationObserver(function () {
    if (view() === shown) return;
    previous = shown;
    shown = view();
    if (shells[shown]) shells[shown].open();
  }).observe(document.body, { attributes: true, attributeFilter: ["data-view"] });

  document.addEventListener("keydown", function (e) {
    var sh = shells[view()];
    if (!sh || (e.key !== "ArrowDown" && e.key !== "ArrowUp") || e.target === sh.input) return;
    var rows = Array.prototype.slice.call(document.querySelectorAll('.home-panel[data-view="' + view() + '"] .panel-list li:not([hidden]) a'));
    if (!rows.length) return;
    e.preventDefault();
    var i = rows.indexOf(document.activeElement);
    i = i < 0 ? (e.key === "ArrowDown" ? 0 : rows.length - 1) : (i + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length;
    rows[i].focus();
  });

  /* —— Opening a note, the way `cat` works in a terminal: the row stays lit,
        the prompt types `cat name.md`, the note prints out below it line by
        line, and the screen scrolls up a line at a time until the command sits
        where the article page has it. Then the article page takes over; it is
        already on screen in the same place, so there is nothing to see (the
        head script there skips its own typing and any transition). Only the
        first screen is printed here. A key, a click or a scroll jumps straight
        to the article. —— */
  var notesPanel = document.querySelector('.home-panel[data-view="notes"]');
  var opening = false;
  var LINE = 30; // px the output advances per step: about one line of prose
  var TICK = 24; // ms per step

  // Each note is fetched once, as soon as its row is pointed at or focused.
  var pages = {};
  function load(href) {
    if (!pages[href]) {
      pages[href] = fetch(href, { credentials: "same-origin" }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      });
      pages[href].catch(function () { delete pages[href]; });
    }
    return pages[href];
  }

  /** The note's header and text, as the article page lays them out. */
  function noteCopy(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var head = doc.querySelector(".post-head");
    var prose = doc.querySelector(".post-prose");
    if (!head || !prose) return null;
    var wrap = document.createElement("div");
    wrap.className = "sh-cat";
    wrap.setAttribute("aria-hidden", "true");
    var post = document.createElement("article");
    post.className = "post";
    post.appendChild(document.importNode(head, true));
    post.appendChild(document.importNode(prose, true));
    // No duplicate ids (footnotes) while it is on this page.
    post.querySelectorAll("[id]").forEach(function (el) { el.removeAttribute("id"); });
    // What post.js adds on the article page, so code blocks match at the handoff.
    post.querySelectorAll("div.highlighter-rouge").forEach(function (el) {
      var m = /\blanguage-([\w+#-]+)/.exec(el.className);
      if (m && m[1] !== "plaintext") el.setAttribute("data-lang", m[1]);
    });
    post.querySelectorAll("pre > code").forEach(function (code) {
      var lines = code.textContent.replace(/\n$/, "").split("\n").length;
      var gutter = document.createElement("span");
      gutter.className = "code-gutter";
      for (var i = 1; i <= lines; i++) gutter.textContent += (i > 1 ? "\n" : "") + i;
      code.parentNode.insertBefore(gutter, code);
      code.parentNode.classList.add("has-gutter");
    });
    wrap.appendChild(post);
    return wrap;
  }

  function open(a) {
    var url = new URL(a.href, location.href);
    var go = function () {
      try { sessionStorage.setItem("post-handoff", url.pathname); } catch (err) {}
      location.href = url.href;
    };
    var plain = function () { location.href = url.href; };
    var live = notesPanel.querySelector(".sh-live");
    var input = notesPanel.querySelector(".sh-input");
    var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still || !live || !input) return plain();

    var file = decodeURIComponent(url.pathname.split("/").pop() || "").replace(/\.html?$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "") + ".md";
    var text = "cat " + file;
    var page = load(url.href);
    var chrome = document.querySelector(".home-chrome");
    var canvas = document.querySelector("canvas[data-koi]");
    var timers = [];
    var done = false;

    // Any key, click or scroll: straight to the article.
    var SKIP = ["keydown", "wheel", "touchstart", "mousedown"];
    function skip() { finish(plain); }
    function finish(how) {
      if (done) return;
      done = true;
      timers.forEach(window.clearTimeout);
      SKIP.forEach(function (ev) { window.removeEventListener(ev, skip, true); });
      how();
    }
    SKIP.forEach(function (ev) { window.addEventListener(ev, skip, { capture: true, passive: true }); });

    // 1. Type the command.
    var n = 0;
    var per = Math.max(8, Math.min(16, Math.floor(280 / text.length)));
    (function type() {
      input.value = text.slice(0, ++n);
      if (n < text.length) return timers.push(window.setTimeout(type, per));
      page.then(function (html) {
        if (done) return;
        var copy = noteCopy(html);
        if (!copy) return finish(plain);
        timers.push(window.setTimeout(function () { print(copy); }, 90));
      }, function () { finish(plain); });
    })();

    // 2. Print it below, scrolling a line at a time, until the command is where the article has it.
    function print(copy) {
      live.after(copy);
      live.hidden = true; // the copy's own command line stands in for it, in the same text
      if (canvas) canvas.classList.add("is-leaving");
      var bar = copy.querySelector(".post-bar") || copy.firstChild;
      var top = window.matchMedia("(max-width: 640px)").matches ? 48 : 72; // the article's top padding
      var bottom = window.innerHeight;
      var start = copy.getBoundingClientRect().top;
      var chromeTop = chrome.getBoundingClientRect().top;
      var end = start + copy.offsetHeight;
      var target = Math.max(0, bar.getBoundingClientRect().top - top); // how far the screen scrolls
      var shown = start + bar.offsetHeight; // the printed edge, in page coordinates
      var shift = 0;
      function frame() {
        copy.style.clipPath = "inset(0 0 " + Math.max(0, end - shown) + "px 0)";
        chrome.style.transform = shift ? "translateY(" + -shift + "px)" : "";
        // The line `top` px down is the window's upper edge, as on the article
        // page: whatever scrolls past it is gone, so nothing is left above the
        // command when the page takes over.
        chrome.style.clipPath = "inset(" + Math.max(0, top + shift - chromeTop) + "px 0 0 0)";
      }
      frame();
      (function step() {
        if (done) return;
        if (shown < end) shown = Math.min(end, shown + LINE);
        // Keep the printed edge on screen, like a terminal follows its output.
        shift = Math.min(target, Math.max(shift, shown - bottom));
        if (shown >= end && shift < target) shift = Math.min(target, shift + LINE);
        frame();
        if (shift >= target && (shown >= end || shown - shift >= bottom)) {
          timers.push(window.setTimeout(function () { finish(go); }, 60));
          return;
        }
        timers.push(window.setTimeout(step, TICK));
      })();
    }
  }

  if (notesPanel) notesPanel.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest(".panel-list a");
    if (!a || opening || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (new URL(a.href, location.href).origin !== location.origin) return;
    e.preventDefault();
    opening = true;
    a.classList.add("is-opening");
    open(a);
  });

  // Back from the article (page restored from the cache): the list as it was.
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted || !notesPanel) return;
    opening = false;
    var input = notesPanel.querySelector(".sh-input");
    if (input) input.value = "";
    var live = notesPanel.querySelector(".sh-live");
    if (live) live.hidden = false;
    notesPanel.querySelectorAll(".sh-cat").forEach(function (c) { c.remove(); });
    var chrome = document.querySelector(".home-chrome");
    if (chrome) { chrome.style.transform = ""; chrome.style.clipPath = ""; }
    var canvas = document.querySelector("canvas[data-koi]");
    if (canvas) canvas.classList.remove("is-leaving");
    notesPanel.querySelectorAll(".is-opening").forEach(function (a) { a.classList.remove("is-opening"); });
  });

  if (notesPanel) ["pointerenter", "focusin", "touchstart"].forEach(function (ev) {
    notesPanel.addEventListener(ev, function (e) {
      var a = e.target.closest && e.target.closest(".panel-list a");
      if (a && new URL(a.href, location.href).origin === location.origin) load(a.href);
    }, { capture: true, passive: true });
  });
})();
