(function () {
  "use strict";

  /* —— Day / night. "auto" follows the system; "day" and "night" are the
        reader's own choice, kept in localStorage. The switch in the top
        right sets one of the three, and the shells take `theme day|night|auto`
        (the touch button steps auto → the opposite of the system → the other). Pages that draw the koi
        listen for "themechange" to redraw in the new palette. —— */

  var KEY = "theme";
  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : { matches: false };
  var choices = [];

  function pref() {
    var p;
    try { p = localStorage.getItem(KEY); } catch (e) {}
    return p === "day" || p === "night" ? p : "auto";
  }

  function isNight(p) {
    return p === "night" || (p === "auto" && media.matches);
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
    var system = media.matches ? "night" : "day";
    var other = system === "night" ? "day" : "night";
    return p === "auto" ? other : p === other ? system : "auto";
  }

  if (media.addEventListener) media.addEventListener("change", function () { if (pref() === "auto") apply(); });

  document.addEventListener("DOMContentLoaded", function () {
    choices = Array.prototype.slice.call(document.querySelectorAll("[data-theme-set]"));
    choices.forEach(function (b) {
      b.addEventListener("click", function () { set(b.getAttribute("data-theme-set")); });
    });
    label();
  });

  window.siteTheme = { pref: pref, set: set, next: next };
})();
