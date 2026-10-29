(function () {
  "use strict";

  /* —— Article pages: one small koi roams the plain paper and hurries
        across the text; footnotes move into the right margin on wide
        screens. —— */

  var RAIL_MIN = 1180;
  var GAP = 12;

  var post = document.querySelector(".post");
  var prose = document.querySelector(".post-prose");
  var ocean = null;

  var TEXT = ".post-head, .post-prose > *, .post-note, .post-foot";
  var queued = false;

  /** Hand the koi the on-screen text boxes (the canvas is fixed, so client px = canvas px). */
  function markText() {
    queued = false;
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

  document.addEventListener("DOMContentLoaded", function () {
    var canvas = document.querySelector("canvas[data-koi]");
    if (canvas && window.OceanEngine) {
      ocean = new window.OceanEngine(canvas, [{ kind: "koi", size: 0.62 }], 0);
      ocean.setCalm(true, true);
      ocean.setGrid(false);
    }
    buildRail();
    layout();
    window.addEventListener("resize", layout);
    window.addEventListener("scroll", queueText, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  });
})();
