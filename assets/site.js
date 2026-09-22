// Mesura — public site. Enhancements only: every page reads correctly
// with scripts off (Turkish shows by default).
(function () {
  "use strict";

  var root = document.documentElement;

  // ---------- Language ----------
  function read() {
    try { return localStorage.getItem("mesura.lang"); } catch (e) { return null; }
  }
  function write(lang) {
    try { localStorage.setItem("mesura.lang", lang); } catch (e) { /* private mode */ }
  }
  function initial() {
    var fromURL = new URLSearchParams(location.search).get("lang");
    if (fromURL === "tr" || fromURL === "en") return fromURL;
    var saved = read();
    if (saved === "tr" || saved === "en") return saved;
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || "tr";
    return /^tr\b/i.test(nav) ? "tr" : "en";
  }
  function setLang(lang, remember) {
    root.lang = lang;
    document.querySelectorAll("[data-set-lang]").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.getAttribute("data-set-lang") === lang));
    });
    var title = document.querySelector("meta[name='title-" + lang + "']");
    if (title) document.title = title.content;
    if (remember) write(lang);
  }
  setLang(initial(), false);
  document.querySelectorAll("[data-set-lang]").forEach(function (button) {
    button.addEventListener("click", function () { setLang(button.getAttribute("data-set-lang"), true); });
  });

  // ---------- Policy: mark the section being read in the contents ----------
  var sections = document.querySelectorAll(".prose section[id]");
  if (sections.length && "IntersectionObserver" in window) {
    var links = {};
    document.querySelectorAll(".toc a[href^='#']").forEach(function (a) {
      links[a.getAttribute("href").slice(1)] = a;
    });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var link = links[entry.target.id];
        if (!link) return;
        link.closest("ol").querySelectorAll("a.is-active").forEach(function (a) { a.classList.remove("is-active"); });
        link.classList.add("is-active");
      });
    }, { rootMargin: "-25% 0px -65% 0px" });
    sections.forEach(function (s) { observer.observe(s); });
  }
})();
