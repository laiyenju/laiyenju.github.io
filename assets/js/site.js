(function () {
  "use strict";

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* —— Homepage ASCII: assemble line-by-line ONCE on load, then stop.
        Spec: Ink locked decision — NOT Figma's infinite loop. —— */
  function initAsciiLoad() {
    var box = document.querySelector(".ascii-load");
    if (!box || box.dataset.played === "1") return;
    box.dataset.played = "1";
    var lines = box.querySelectorAll(".ascii-line");
    if (!lines.length) return;
    if (reduceMotion) {
      box.classList.add("is-done");
      return;
    }
    var delays = [120, 320, 520];
    lines.forEach(function (line, i) {
      window.setTimeout(function () {
        line.classList.add("is-visible");
        if (i === lines.length - 1) {
          window.setTimeout(function () {
            box.classList.add("is-done");
          }, 200);
        }
      }, delays[i] || 600);
    });
  }

  /* —— Footnotes: clone into side rail (desktop) + bottom (mobile) —— */
  function initFootnotes() {
    var prose =
      document.querySelector(".prose.reveal-source") ||
      document.querySelector(".prose");
    var side = document.querySelector(".footnote-side");
    var bottom = document.querySelector(".footnote-bottom");
    if (!prose || !side || !bottom) return;

    var fn = prose.querySelector(".footnotes");
    if (!fn) return;

    var items = fn.querySelectorAll("li");
    if (!items.length) return;

    var sideOl = document.createElement("ol");
    var bottomOl = document.createElement("ol");

    items.forEach(function (li, idx) {
      var cloneSide = li.cloneNode(true);
      var cloneBottom = li.cloneNode(true);
      cloneSide.querySelectorAll(".reversefootnote").forEach(function (a) {
        a.remove();
      });
      cloneBottom.querySelectorAll(".reversefootnote").forEach(function (a) {
        a.remove();
      });
      var n = idx + 1;
      var prefix = document.createTextNode(n + "  ");
      if (cloneSide.firstChild) {
        cloneSide.insertBefore(prefix, cloneSide.firstChild);
      } else {
        cloneSide.appendChild(prefix);
      }
      var prefix2 = document.createTextNode(n + "  ");
      if (cloneBottom.firstChild) {
        cloneBottom.insertBefore(prefix2, cloneBottom.firstChild);
      } else {
        cloneBottom.appendChild(prefix2);
      }
      sideOl.appendChild(cloneSide);
      bottomOl.appendChild(cloneBottom);
    });

    var rail = document.createElement("div");
    rail.className = "rail";
    side.appendChild(rail);
    side.appendChild(sideOl);
    side.classList.add("has-notes");

    bottom.appendChild(bottomOl);
    bottom.classList.add("has-notes");
  }

  function revealFootnotes() {
    document
      .querySelectorAll(".footnote-side, .footnote-bottom")
      .forEach(function (el) {
        el.classList.add("is-fn-visible");
      });
  }

  /* —— Scroll-driven typewriter (no auto-play) ——
     scroll progress → target char index; display lerps toward target.
     Title types first, then body. Footnotes only after full reveal.
     Footnote rail is absolutely parked (CSS) so typing never shoves it. —— */
  function initReveal() {
    var host = document.querySelector(".reveal-host");
    if (!host) return;

    var source = host.querySelector(".reveal-source");
    var live = host.querySelector(".reveal-live");
    var controls = document.querySelector(".scroll-reveal-controls");
    var titleEl = document.querySelector(".article-title");
    if (!source || !live) return;

    /* Capture body HTML / plain text without the footnotes block */
    var fnBlock = source.querySelector(".footnotes");
    var fnHTML = fnBlock ? fnBlock.outerHTML : "";
    if (fnBlock) fnBlock.remove();

    var fullHTML = source.innerHTML;
    var plain = (source.innerText || source.textContent || "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/^\s+|\s+$/g, "");

    /* Restore footnotes in source (display:none) so DOM stays complete */
    if (fnHTML) {
      source.insertAdjacentHTML("beforeend", fnHTML);
    }

    /* Title → measure (holds space) + live overlay */
    var titleText = "";
    var titleLive = null;
    var titleMeasure = null;
    if (titleEl) {
      titleText = (titleEl.textContent || "").replace(/\s+/g, " ").trim();
      titleEl.textContent = "";
      titleMeasure = document.createElement("span");
      titleMeasure.className = "title-measure";
      titleMeasure.setAttribute("aria-hidden", "true");
      titleMeasure.textContent = titleText;
      titleLive = document.createElement("span");
      titleLive.className = "title-live";
      titleEl.appendChild(titleMeasure);
      titleEl.appendChild(titleLive);
      titleEl.classList.add("is-typing");
    }

    var titleLen = titleText.length;
    var totalChars = titleLen + plain.length;

    var display = 0;
    var target = 0;
    var paused = false;
    var fast = false;
    var done = false;
    var raf = null;
    var LERP = 0.22;
    var cursorEl = null;
    var spacer = null;

    function maxScroll() {
      var doc = document.documentElement;
      return Math.max(1, (doc.scrollHeight || 0) - (window.innerHeight || 0));
    }

    function scrollProgress() {
      var y = window.scrollY || window.pageYOffset || 0;
      return Math.min(1, Math.max(0, y / maxScroll()));
    }

    function syncTarget() {
      var p = scrollProgress();
      /* Complete a little before absolute bottom so finish is reachable */
      var mapped = Math.min(1, p / 0.9);
      /* Fast: steeper scroll→chars curve; still requires scroll (no auto-play) */
      var factor = fast ? 2.4 : 1;
      target = Math.min(totalChars, mapped * totalChars * factor);
    }

    function ensureScrollRoom() {
      /* Source already locks most height; add spacer if the page still
         cannot scroll enough for a full reveal (short article / tall screen). */
      var need = Math.max(window.innerHeight * 0.55, Math.ceil(totalChars * 1.8));
      var natural = maxScroll();
      if (natural >= need) return;
      spacer = document.createElement("div");
      spacer.className = "reveal-scroll-spacer";
      spacer.style.height = need - natural + 48 + "px";
      spacer.setAttribute("aria-hidden", "true");
      var page = document.querySelector(".article-page");
      if (page) page.appendChild(spacer);
    }

    function removeSpacer() {
      if (spacer && spacer.parentNode) spacer.parentNode.removeChild(spacer);
      spacer = null;
    }

    function ensureCursor(parent) {
      if (done) {
        if (cursorEl && cursorEl.parentNode) cursorEl.parentNode.removeChild(cursorEl);
        cursorEl = null;
        return;
      }
      if (!cursorEl) {
        cursorEl = document.createElement("span");
        cursorEl.className = "typewriter-cursor";
        cursorEl.setAttribute("aria-hidden", "true");
      }
      if (parent && cursorEl.parentNode !== parent) {
        parent.appendChild(cursorEl);
      }
    }

    function render(n) {
      var chars = Math.max(0, Math.min(totalChars, n));
      if (titleLive) {
        if (chars < titleLen) {
          titleLive.textContent = titleText.slice(0, chars);
          live.textContent = "";
          ensureCursor(titleLive);
        } else {
          titleLive.textContent = titleText;
          live.textContent = plain.slice(0, chars - titleLen);
          ensureCursor(live);
        }
      } else {
        live.textContent = plain.slice(0, chars);
        ensureCursor(live);
      }
    }

    function finish() {
      if (done) return;
      done = true;
      display = totalChars;
      target = totalChars;

      if (titleLive && titleEl) {
        titleLive.textContent = titleText;
        titleEl.classList.remove("is-typing");
        titleEl.classList.add("is-title-done");
      }

      host.classList.remove("is-revealing");
      host.classList.add("is-done");
      live.innerHTML = fullHTML;

      if (cursorEl && cursorEl.parentNode) cursorEl.parentNode.removeChild(cursorEl);
      cursorEl = null;

      removeSpacer();
      revealFootnotes();

      if (controls) controls.hidden = true;

      live.style.transition = "opacity 280ms ease";
      live.style.opacity = "0.92";
      window.setTimeout(function () {
        live.style.opacity = "1";
      }, 40);
    }

    function showFullImmediate() {
      if (titleEl) {
        if (titleText) titleEl.textContent = titleText;
        titleEl.classList.remove("is-typing");
        titleEl.classList.add("is-title-done");
      }
      host.classList.remove("is-revealing");
      host.classList.add("is-done");
      live.innerHTML = fullHTML;
      source.setAttribute("hidden", "");
      removeSpacer();
      revealFootnotes();
      if (controls) controls.hidden = true;
      done = true;
    }

    if (reduceMotion || totalChars === 0) {
      showFullImmediate();
      return;
    }

    /* Source stays in flow (invisible) to lock scroll height; live overlays */
    host.classList.add("is-revealing");
    live.textContent = "";
    if (titleLive) titleLive.textContent = "";
    render(0);
    ensureScrollRoom();

    if (controls) {
      var btnPause = controls.querySelector("[data-action=pause]");
      var btnFast = controls.querySelector("[data-action=fast]");
      if (btnPause) {
        btnPause.addEventListener("click", function () {
          paused = !paused;
          host.classList.toggle("is-paused", paused);
          btnPause.classList.toggle("is-active", paused);
          btnPause.textContent = paused ? "Resume" : "Pause";
          if (!paused) {
            syncTarget();
            kick();
          }
        });
      }
      if (btnFast) {
        btnFast.addEventListener("click", function () {
          fast = !fast;
          btnFast.classList.toggle("is-active", fast);
          syncTarget();
          kick();
        });
      }
    }

    function tick() {
      raf = null;
      if (done) return;

      if (!paused) {
        var diff = target - display;
        if (Math.abs(diff) < 0.35) {
          display = target;
        } else {
          display += diff * LERP;
        }
      }

      render(Math.floor(display));

      if (display >= totalChars - 0.35 && target >= totalChars) {
        finish();
        return;
      }

      /* Keep lerping only while catching up — no auto-advance without scroll */
      if (!paused && Math.abs(target - display) >= 0.35) {
        raf = window.requestAnimationFrame(tick);
      }
    }

    function kick() {
      if (done || raf) return;
      raf = window.requestAnimationFrame(tick);
    }

    window.addEventListener(
      "scroll",
      function () {
        if (done) return;
        syncTarget();
        kick();
      },
      { passive: true }
    );

    window.addEventListener(
      "resize",
      function () {
        if (done) return;
        syncTarget();
        kick();
      },
      { passive: true }
    );

    /* Load: zero prose typed. Do NOT start a typing loop. */
    syncTarget();
    if (target > 0) kick();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initAsciiLoad();
    initFootnotes();
    initReveal();
  });
})();
