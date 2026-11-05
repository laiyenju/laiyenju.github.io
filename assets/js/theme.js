(function () {
  "use strict";

  /* —— Day / night. "auto" follows the sky over Taipei, like the home page (sky.js:
        the page takes the sky's colour, with light text when it is dark); "day" and "night" are the
        reader's own choice, kept in localStorage. The switch in the top
        right sets one of the three, and the shells take `theme day|night|auto`
        (the touch button steps auto → the opposite of the system → the other). Pages that draw the koi
        listen for "themechange" to redraw in the new palette. —— */

  var KEY = "theme";
  var choices = [];

  function pref() {
    var p;
    try { p = localStorage.getItem(KEY); } catch (e) {}
    return p === "day" || p === "night" ? p : "auto";
  }

  // auto paints the sky colour and says whether it is dark; day / night drop it for the fixed paper or ink ground
  function isNight(p) {
    var sky = window.siteSky;
    if (p !== "auto") { if (sky) sky.clearNotes(); return p === "night"; }
    return sky ? sky.paintNotes() : false;
  }

  function label() {
    var p = pref();
    choices.forEach(function (b) { b.setAttribute("aria-checked", String(b.getAttribute("data-theme-set") === p)); });
  }

  function apply() {
    var night = isNight(pref());
    var changed = document.body.classList.contains("theme-night") !== night;
    document.body.classList.toggle("theme-night", night);
    label();
    if (changed) document.dispatchEvent(new CustomEvent("themechange", { detail: { night: night } }));
  }

  function set(p) {
    try {
      if (p === "auto") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, p);
    } catch (e) {}
    apply();
  }

  function next() {
    var p = pref();
    var system = window.siteSky && window.siteSky.isDark() ? "night" : "day";
    var other = system === "night" ? "day" : "night";
    return p === "auto" ? other : p === other ? system : "auto";
  }

  // the sky moves: repaint every minute while on auto
  window.setInterval(function () { if (pref() === "auto") apply(); }, 60000);

  document.addEventListener("DOMContentLoaded", function () {
    // Labels for screen readers and tooltips, in the interface language.
    if (document.documentElement.classList.contains("ui-zh")) {
      document.querySelectorAll("[data-label-zh]").forEach(function (el) { el.setAttribute("aria-label", el.getAttribute("data-label-zh")); });
      document.querySelectorAll("[data-title-zh]").forEach(function (el) { el.setAttribute("title", el.getAttribute("data-title-zh")); });
    }
    choices = Array.prototype.slice.call(document.querySelectorAll("[data-theme-set]"));
    choices.forEach(function (b) {
      b.addEventListener("click", function () { set(b.getAttribute("data-theme-set")); });
    });
    label();
  });

  window.siteTheme = { pref: pref, set: set, next: next };
})();
