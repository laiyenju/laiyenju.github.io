(function () {
  "use strict";

  /* —— Notes / works shell. Each panel types its ls command when it opens,
        then takes commands on its last prompt (a small easter egg):
        cd ~ / cd .. go home, cd - goes back, cd notes / cd works, ls,
        clear, whoami, help. —— */

  function view() { return document.body.getAttribute("data-view") || "home"; }

  var previous = "home";
  var shown = view();
  var shells = {};
  Array.prototype.forEach.call(document.querySelectorAll(".sh-panel"), function (panel) {
    var name = panel.getAttribute("data-view");
    var cmd = panel.querySelector(".sh-cmd");
    var out = panel.querySelector(".sh-out");
    var input = panel.querySelector(".sh-input");
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
        p.innerHTML = '<span class="sh-prompt">yen@taiwan</span>:<span class="sh-path"></span>$ ';
        p.querySelector(".sh-path").textContent = path;
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
    var list = name === "notes" ? "list notes again     重新列出文章" : "list works again     重新列出作品";
    var COMMANDS = {
      help: function () {
        say("cd ~      go home              回首頁（也可以打 cd 或 cd ..）");
        say("cd -      go back              回上一頁");
        say("cd " + other + (other === "notes" ? "  read notes           去看文章" : "  see works            去看作品"));
        say("ls        " + list);
        say("whoami    who is Yen           我是誰");
        say("clear     clear the screen     清除畫面，重新列出");
        say("help      show this list       列出這些指令");
      },
      whoami: function () { say("yen — product manager @Taiwan. I build things, then make sense of them."); },
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
      if (COMMANDS[words[0]]) return COMMANDS[words[0]]();
      say("sh: command not found: " + words[0] + " — try help（輸入 help 看看可以做什麼）");
    }
    input.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      run(input.value);
      input.value = "";
    });
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

  /* —— Opening a note: the row stays lit, the prompt types `cat name.md`,
        then the page changes. The prompt line carries the view-transition
        name, so browsers that support cross-document transitions carry it up
        to the same line at the top of the article, where the note then types
        itself out (post.js). The article is told, through sessionStorage,
        that the command has already been typed. —— */
  var notesPanel = document.querySelector('.home-panel[data-view="notes"]');
  var opening = false;
  if (notesPanel) notesPanel.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest(".panel-list a");
    if (!a || opening || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    e.preventDefault();
    opening = true;
    var file = decodeURIComponent(url.pathname.split("/").pop() || "").replace(/\.html?$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "") + ".md";
    a.classList.add("is-opening");
    var input = notesPanel.querySelector(".sh-input");
    var live = notesPanel.querySelector(".sh-live");
    if (live) live.style.viewTransitionName = "post-cmd";
    try { sessionStorage.setItem("post-cmd-typed", url.pathname); } catch (err) {}
    var text = "cat " + file;
    var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still || !input) { location.href = url.href; return; }
    var n = 0;
    var step = Math.max(8, Math.min(16, Math.floor(280 / text.length)));
    var timer = window.setInterval(function () {
      input.value = text.slice(0, ++n);
      if (n < text.length) return;
      window.clearInterval(timer);
      window.setTimeout(function () { location.href = url.href; }, 90);
    }, step);
  });
  // Back from the article (page restored from the cache): a clean prompt and no lingering transition name.
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted || !notesPanel) return;
    opening = false;
    var input = notesPanel.querySelector(".sh-input");
    if (input) input.value = "";
    var live = notesPanel.querySelector(".sh-live");
    if (live) live.style.viewTransitionName = "";
    notesPanel.querySelectorAll(".is-opening").forEach(function (a) { a.classList.remove("is-opening"); });
  });
})();
