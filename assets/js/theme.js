(function () {
  "use strict";

  /* —— Day / night. "auto" follows the system; "day" and "night" are the
        reader's own choice, kept in localStorage. The button in the top
        right steps auto → the opposite of the system → the other → auto,
        and the shells take `theme day|night|auto`. Pages that draw the koi
        listen for "themechange" to redraw in the new palette. —— */

  var KEY = "theme";
  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : { matches: false };
  var button = null;

  function pref() {
    var p;
    try { p = localStorage.getItem(KEY); } catch (e) {}
    return p === "day" || p === "night" ? p : "auto";
  }

  function isNight(p) {
    return p === "night" || (p === "auto" && media.matches);
  }

  function label() {
    if (!button) return;
    var p = pref();
    button.textContent = "theme: " + p;
    button.setAttribute("aria-label", "切換日夜，目前：" + (p === "auto" ? "跟隨系統" : p === "night" ? "夜間" : "日間"));
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
    button = document.querySelector(".theme-toggle");
    if (button) button.addEventListener("click", function () { set(next()); });
    label();
  });

  window.siteTheme = { pref: pref, set: set };
})();
