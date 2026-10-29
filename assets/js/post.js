(function () {
  "use strict";

  /* —— Article pages: one small koi in the left margin, and footnotes
        pulled into the right margin on wide screens. —— */

  var RAIL_MIN = 1180;
  var GAP = 12;

  var post = document.querySelector(".post");
  var prose = document.querySelector(".post-prose");
  var ocean = null;

  function placeKoi() {
    if (!ocean || !post) return;
    var left = post.getBoundingClientRect().left;
    // Keep clear of the paper wash's feathered edge.
    ocean.setLane([16, left - 40]);
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
    placeKoi();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var canvas = document.querySelector("canvas[data-koi]");
    if (canvas && window.OceanEngine) {
      ocean = new window.OceanEngine(canvas, [{ kind: "koi", size: 0.62 }], 0);
      ocean.setCalm(true, true);
    }
    buildRail();
    layout();
    window.addEventListener("resize", layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  });
})();
