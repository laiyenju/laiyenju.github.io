(function () {
  "use strict";

  /* —— Day and night on the notes: the same as the home page, no switch. The page takes the colour
        of the sky over the city (sky.js); when the sky is dark the text turns light (body.theme-night).
        theme-boot.html paints it before first paint; this keeps it in step, once a minute.
        Choices saved by the old theme command (day / night) are dropped. —— */

  try { localStorage.removeItem("theme"); } catch (e) {}

  function apply() {
    if (!window.siteSky) return;
    var night = window.siteSky.paintNotes();
    var changed = document.body.classList.contains("theme-night") !== night;
    document.body.classList.toggle("theme-night", night);
    if (changed) document.dispatchEvent(new CustomEvent("themechange", { detail: { night: night } }));
  }
  window.setInterval(apply, 60000);
  // back from another page (back/forward cache): the sky may have moved meanwhile
  window.addEventListener("pageshow", function (e) { if (e.persisted) apply(); });

  document.addEventListener("DOMContentLoaded", function () {
    // Labels for screen readers and tooltips, in the interface language.
    if (document.documentElement.classList.contains("ui-zh")) {
      document.querySelectorAll("[data-label-zh]").forEach(function (el) { el.setAttribute("aria-label", el.getAttribute("data-label-zh")); });
      document.querySelectorAll("[data-title-zh]").forEach(function (el) { el.setAttribute("title", el.getAttribute("data-title-zh")); });
    }
  });
})();
