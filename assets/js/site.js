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
    var prose = document.querySelector(".prose");
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
      // Strip reverse link noise for quieter presentation
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

  /* —— Typewriter / scroll-speed reveal —— */
  function initReveal() {
    var host = document.querySelector(".reveal-host");
    if (!host) return;

    var source = host.querySelector(".reveal-source");
    var live = host.querySelector(".reveal-live");
    var controls = document.querySelector(".scroll-reveal-controls");
    if (!source || !live) return;

    var fullHTML = source.innerHTML;
    // Use text for progressive reveal, keep simple HTML tags via textContent path for safety
    // Progressive reveal of text nodes while preserving structure is hard;
    // we reveal by growing a text Content mirror then swap to full HTML when done.
    var plain = source.innerText || source.textContent || "";
    plain = plain.replace(/\n{3,}/g, "\n\n").trim();

    var idx = 0;
    var paused = false;
    var fast = false;
    var done = false;
    var lastScrollY = window.scrollY || 0;
    var scrollBoost = 0;
    var raf = null;

    function baseCharsPerTick() {
      if (fast) return 4;
      return 1;
    }

    function tick() {
      if (done) return;
      if (paused) {
        raf = window.requestAnimationFrame(tick);
        return;
      }
      var step = baseCharsPerTick();
      if (scrollBoost > 0) {
        step += Math.min(8, Math.floor(scrollBoost / 40));
        scrollBoost *= 0.85;
      }
      idx = Math.min(plain.length, idx + step);
      live.textContent = plain.slice(0, idx);
      // ensure cursor element exists
      var cursor = live.querySelector(".typewriter-cursor");
      if (!cursor) {
        // textContent wiped children; re-append cursor via sibling
      }
      updateCursor();
      if (idx >= plain.length) {
        finish();
        return;
      }
      var delay = fast ? 8 : 28;
      window.setTimeout(function () {
        raf = window.requestAnimationFrame(tick);
      }, delay);
    }

    function updateCursor() {
      var existing = host.querySelector(".typewriter-cursor");
      if (done) {
        if (existing) existing.remove();
        return;
      }
      if (!existing) {
        existing = document.createElement("span");
        existing.className = "typewriter-cursor";
        existing.setAttribute("aria-hidden", "true");
        live.parentNode.insertBefore(existing, live.nextSibling);
      }
    }

    function finish() {
      done = true;
      host.classList.add("is-done");
      live.innerHTML = fullHTML;
      var existing = host.querySelector(".typewriter-cursor");
      if (existing) existing.remove();
      // subtle coalesce: brief opacity dip
      live.style.transition = "opacity 280ms ease";
      live.style.opacity = "0.92";
      window.setTimeout(function () {
        live.style.opacity = "1";
      }, 40);
      if (controls) controls.hidden = true;
    }

    function showFullImmediate() {
      finish();
    }

    if (reduceMotion) {
      showFullImmediate();
      if (controls) controls.hidden = true;
      return;
    }

    // Start empty
    source.setAttribute("hidden", "");
    live.textContent = "";
    host.classList.add("is-revealing");
    updateCursor();

    if (controls) {
      var btnPause = controls.querySelector("[data-action=pause]");
      var btnFast = controls.querySelector("[data-action=fast]");
      if (btnPause) {
        btnPause.addEventListener("click", function () {
          paused = !paused;
          host.classList.toggle("is-paused", paused);
          btnPause.classList.toggle("is-active", paused);
          btnPause.textContent = paused ? "Resume" : "Pause";
        });
      }
      if (btnFast) {
        btnFast.addEventListener("click", function () {
          fast = !fast;
          btnFast.classList.toggle("is-active", fast);
        });
      }
    }

    window.addEventListener(
      "scroll",
      function () {
        var y = window.scrollY || 0;
        var dy = Math.abs(y - lastScrollY);
        lastScrollY = y;
        scrollBoost += dy;
      },
      { passive: true }
    );

    raf = window.requestAnimationFrame(tick);
  }

  document.addEventListener("DOMContentLoaded", function () {
    initAsciiLoad();
    initFootnotes();
    initReveal();
  });
})();
