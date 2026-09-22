// Mesura — public site behaviour. Everything here is an enhancement:
// the pages read correctly with scripts disabled.
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Language ----------
  function storedLang() {
    try { return localStorage.getItem("mesura.lang"); } catch (e) { return null; }
  }
  function storeLang(lang) {
    try { localStorage.setItem("mesura.lang", lang); } catch (e) { /* private mode */ }
  }
  function initialLang() {
    var fromURL = new URLSearchParams(location.search).get("lang");
    if (fromURL === "tr" || fromURL === "en") return fromURL;
    var saved = storedLang();
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
    if (remember) storeLang(lang);
  }
  setLang(initialLang(), false);
  document.querySelectorAll("[data-set-lang]").forEach(function (button) {
    button.addEventListener("click", function () { setLang(button.getAttribute("data-set-lang"), true); });
  });

  // ---------- Sticky bar hairline ----------
  var bar = document.querySelector(".bar");
  function onScrollBar() { if (bar) bar.classList.toggle("is-stuck", window.scrollY > 8); }

  // ---------- Hero ruler: scrolls like the app's weight picker ----------
  var track = document.querySelector(".ruler-track");
  var readout = document.querySelector("[data-readout]");
  var meter = document.querySelector(".meter span");
  var unit = 12; // px per tick, matches --unit

  function onScrollRuler() {
    if (!track || reduceMotion) return;
    var shift = -((window.scrollY * 0.6) % (unit * 10 * 20));
    track.style.setProperty("--shift", shift.toFixed(1) + "px");
  }

  // Count the hero readout up once, from a resting value that is already correct.
  if (readout && !reduceMotion) {
    var target = Number(readout.getAttribute("data-readout"));
    var start = performance.now();
    var duration = 1200;
    var fmt = new Intl.NumberFormat(root.lang === "tr" ? "tr-TR" : "en-US");
    var tick = function (now) {
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      readout.textContent = fmt.format(Math.round(target * (0.55 + 0.45 * eased)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    if (meter) {
      var fill = getComputedStyle(meter).getPropertyValue("--fill") || "62%";
      meter.style.setProperty("--fill", "12%");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { meter.style.setProperty("--fill", fill.trim()); });
      });
    }
  }

  // ---------- Policy page: reading gauge + active section ----------
  var sections = Array.prototype.slice.call(document.querySelectorAll(".prose section[id]"));
  var gaugePin = document.querySelector("[data-gauge-value]");

  function onScrollRead() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var read = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
    root.style.setProperty("--read", read.toFixed(4));
    if (gaugePin) gaugePin.textContent = Math.round(read * 100) + " cm";
  }

  if (sections.length && "IntersectionObserver" in window) {
    var links = {};
    document.querySelectorAll(".toc a[href^='#']").forEach(function (a) {
      var key = a.getAttribute("href").slice(1);
      (links[key] = links[key] || []).push(a);
    });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        document.querySelectorAll(".toc a.is-active").forEach(function (a) { a.classList.remove("is-active"); });
        (links[entry.target.id] || []).forEach(function (a) { a.classList.add("is-active"); });
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    sections.forEach(function (s) { observer.observe(s); });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      onScrollBar();
      onScrollRuler();
      onScrollRead();
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  // ---------- Year ----------
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
