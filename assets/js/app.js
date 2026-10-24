/*
 * تشغيل الصفحة: السمة، والقائمة، وأرقام البداية، ومخطط المستويات، وتبويبات التثبيت، وقائمة التحقق.
 */
(function () {
  "use strict";

  var CSG = window.CSG;

  /* ---------- قائمة الأقسام على الشاشات الصغيرة ---------- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var list = document.getElementById("nav-list");
    if (!toggle || !list) return;
    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      list.classList.toggle("is-open", open);
    }
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    list.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener("click", function (event) {
      if (toggle.getAttribute("aria-expanded") === "true" && !event.target.closest(".site-nav")) setOpen(false);
    });
  }

  /* ---------- أرقام البداية: تُحسب من البيانات ---------- */
  function initHero() {
    var usedFields = {};
    CSG.skills.forEach(function (skill) { skill.fields.forEach(function (id) { usedFields[id] = true; }); });
    var counts = {
      skills: CSG.skills.length,
      fields: CSG.fields.filter(function (field) { return usedFields[field.id]; }).length,
      "s-tier": CSG.skills.filter(function (skill) { return skill.tier === "S"; }).length,
      stacks: CSG.stacks.length
    };

    document.querySelectorAll("[data-noun]").forEach(function (node) {
      var kind = node.getAttribute("data-noun");
      node.textContent = CSG.noun(kind, counts[kind]);
    });
    document.querySelectorAll("[data-count]").forEach(function (node) {
      CSG.countUp(node, counts[node.getAttribute("data-count")] || 0);
    });

    var latest = CSG.skills.reduce(function (max, skill) { return skill.verifiedAt > max ? skill.verifiedAt : max; }, "");
    var time = document.getElementById("last-updated");
    if (time && latest) {
      time.setAttribute("datetime", latest);
      time.textContent = CSG.formatDate(latest);
    }
  }

  /* ---------- مخطط مستويات التحميل ---------- */
  function initLevels() {
    var figure = document.getElementById("levels");
    var replay = document.getElementById("levels-replay");
    if (!figure) return;
    if (CSG.reducedMotion() || !("IntersectionObserver" in window)) {
      figure.classList.add("is-static");
      if (replay) replay.hidden = true;
      return;
    }
    figure.classList.add("is-armed");
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        figure.classList.add("is-playing");
        observer.disconnect();
      });
    }, { threshold: 0.4 });
    observer.observe(figure);
    if (replay) {
      replay.addEventListener("click", function () {
        figure.classList.remove("is-playing");
        void figure.offsetWidth; // إعادة تشغيل الانتقالات
        figure.classList.add("is-playing");
      });
    }
  }

  /* ---------- تبويبات التثبيت (نمط ARIA tabs، الأسهم معكوسة في RTL) ---------- */
  function initTabs() {
    var tablist = document.querySelector("#install-tabs [role=tablist]");
    if (!tablist) return;
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll("[role=tab]"));

    function select(tab, focus) {
      tabs.forEach(function (other) {
        var selected = other === tab;
        other.setAttribute("aria-selected", selected ? "true" : "false");
        other.setAttribute("tabindex", selected ? "0" : "-1");
        var panel = document.getElementById(other.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
      });
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () { select(tab, false); });
      tab.addEventListener("keydown", function (event) {
        var rtl = getComputedStyle(tablist).direction === "rtl";
        var next = null;
        if (event.key === "ArrowLeft") next = rtl ? index + 1 : index - 1;
        else if (event.key === "ArrowRight") next = rtl ? index - 1 : index + 1;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        select(tabs[(next + tabs.length) % tabs.length], true);
      });
    });
  }

  /* ---------- قائمة التحقق ---------- */
  function initChecklist() {
    var list = document.getElementById("checklist");
    if (!list) return;
    var KEY = "csg-checklist-v1";
    var boxes = Array.prototype.slice.call(list.querySelectorAll("input[type=checkbox]"));
    var progress = document.getElementById("check-progress");
    var text = document.getElementById("progress-text");
    var note = document.getElementById("storage-note");

    if (!CSG.store.available() && note) note.hidden = false;

    var saved = [];
    try { saved = JSON.parse(CSG.store.get(KEY) || "[]"); } catch (e) { saved = []; }
    if (!Array.isArray(saved)) saved = [];
    boxes.forEach(function (box) { box.checked = saved.indexOf(box.getAttribute("data-key")) > -1; });

    function sync(save) {
      var done = boxes.filter(function (box) { return box.checked; });
      progress.max = boxes.length;
      progress.value = done.length;
      text.textContent = done.length + " من " + boxes.length;
      list.classList.toggle("is-complete", done.length === boxes.length);
      if (save) CSG.store.set(KEY, JSON.stringify(done.map(function (box) { return box.getAttribute("data-key"); })));
    }

    list.addEventListener("change", function () { sync(true); });
    document.getElementById("checklist-reset").addEventListener("click", function () {
      boxes.forEach(function (box) { box.checked = false; });
      CSG.store.remove(KEY);
      sync(false);
      CSG.toast("أُعيدت القائمة إلى البداية");
    });
    sync(false);
  }

  function boot() {
    CSG.initTheme();
    initNav();
    initHero();
    initLevels();
    initTabs();
    CSG.initCopy();
    CSG.initExplorer();
    CSG.initGenerator();
    initChecklist();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
