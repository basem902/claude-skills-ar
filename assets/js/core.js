/*
 * أدوات مشتركة: التخزين الآمن، وتطبيع العربية، والنسخ، والإشعارات، والسمة، والعدّادات.
 * كل الدوال تحت window.CSG حتى تعمل السكربتات الكلاسيكية دون وحدات (modules).
 */
(function () {
  "use strict";

  var CSG = window.CSG = window.CSG || {};
  var root = document.documentElement;

  /* ---------- التخزين: كل قراءة وكتابة داخل try/catch ---------- */
  CSG.store = {
    get: function (key) {
      try { return window.localStorage.getItem(key); } catch (e) { return null; }
    },
    set: function (key, value) {
      try { window.localStorage.setItem(key, value); return true; } catch (e) { return false; }
    },
    remove: function (key) {
      try { window.localStorage.removeItem(key); return true; } catch (e) { return false; }
    },
    available: function () {
      try {
        var probe = "__csg_probe__";
        window.localStorage.setItem(probe, "1");
        window.localStorage.removeItem(probe);
        return true;
      } catch (e) { return false; }
    }
  };

  /* ---------- الحركة ---------- */
  var motionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  CSG.reducedMotion = function () { return !!(motionQuery && motionQuery.matches); };

  /* ---------- تطبيع النص العربي للبحث ---------- */
  var ARABIC_DIGITS = /[٠-٩۰-۹]/g;
  CSG.normalize = function (text) {
    return String(text == null ? "" : text)
      .toLowerCase()
      .replace(/[ً-ٰٟۖ-ۭ]/g, "") // التشكيل والعلامات القرآنية
      .replace(/ـ/g, "")                            // التطويل
      .replace(/[آأإٱ]/g, "ا")  // آ أ إ ٱ ← ا
      .replace(/ة/g, "ه")                      // ة ← ه
      .replace(/ى/g, "ي")                      // ى ← ي
      .replace(ARABIC_DIGITS, function (d) {
        var code = d.charCodeAt(0);
        return String(code >= 0x06F0 ? code - 0x06F0 : code - 0x0660);
      })
      .replace(/\s+/g, " ")
      .trim();
  };

  /* ---------- الجمع العربي مع الأعداد ---------- */
  var pluralRules = null;
  try { pluralRules = new Intl.PluralRules("ar"); } catch (e) { pluralRules = null; }
  CSG.pluralCategory = function (n) {
    if (pluralRules) return pluralRules.select(n);
    var r = n % 100;
    if (n === 0) return "zero";
    if (n === 1) return "one";
    if (n === 2) return "two";
    if (r >= 3 && r <= 10) return "few";
    if (r >= 11 && r <= 99) return "many";
    return "other";
  };
  CSG.nouns = {
    skills: { zero: "مهارة", one: "مهارة", two: "مهارتين", few: "مهارات", many: "مهارة", other: "مهارة" },
    fields: { zero: "مجال", one: "مجال", two: "مجالين", few: "مجالات", many: "مجالًا", other: "مجال" },
    stacks: { zero: "حزمة", one: "حزمة", two: "حزمتين", few: "حزم", many: "حزمة", other: "حزمة" }
  };
  CSG.noun = function (kind, n) {
    var forms = CSG.nouns[kind];
    return forms[CSG.pluralCategory(n)] || forms.other;
  };

  /* ---------- التاريخ بأرقام غربية وتقويم ميلادي ---------- */
  CSG.formatDate = function (iso) {
    if (!iso) return "";
    try {
      var parts = iso.split("-");
      var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return new Intl.DateTimeFormat("ar-u-nu-latn-ca-gregory", { day: "numeric", month: "long", year: "numeric" }).format(date);
    } catch (e) { return iso; }
  };

  /* ---------- بناء العناصر بأمان ---------- */
  CSG.escape = function (text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };
  // نصوص البيانات تقبل `كود` بين علامتي backtick؛ يُعرض داخل <code dir="ltr">.
  CSG.rich = function (text) {
    return CSG.escape(text).replace(/`([^`]+)`/g, '<code dir="ltr">$1</code>');
  };
  CSG.el = function (tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value == null || value === false) return;
        if (key === "text") node.textContent = value;
        else if (key === "html") node.innerHTML = value;
        else if (key === "className") node.className = value;
        else node.setAttribute(key, value === true ? "" : value);
      });
    }
    (children || []).forEach(function (child) {
      if (child == null) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  };

  /* ---------- الإشعار: منطقة aria-live واحدة ---------- */
  var toastTimer = null;
  CSG.toast = function (message) {
    var toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = "";
    toast.classList.add("is-visible");
    // تفريغ ثم كتابة حتى يُعلن قارئ الشاشة الرسالة نفسها إن تكررت.
    window.setTimeout(function () { toast.textContent = message; }, 30);
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove("is-visible"); }, 2200);
  };

  /* ---------- النسخ إلى الحافظة مع بديل للمتصفحات القديمة وfile:// ---------- */
  function legacyCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-9999px";
    area.style.left = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }
  CSG.copy = function (text) {
    var done = function (ok) {
      CSG.toast(ok ? "تم النسخ" : "تعذّر النسخ. حدّد النص وانسخه يدويًا.");
      return ok;
    };
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return done(true); }, function () { return done(legacyCopy(text)); });
    }
    return Promise.resolve(done(legacyCopy(text)));
  };

  // زر نسخ داخل .cmd أو .codeblock ينسخ نص عنصر code المجاور.
  CSG.labelCopyButtons = function (scope) {
    (scope || document).querySelectorAll(".cmd .copy, .codeblock .copy").forEach(function (button) {
      var code = button.parentNode.querySelector("code");
      if (code && !button.hasAttribute("aria-label")) button.setAttribute("aria-label", "انسخ: " + code.textContent);
    });
  };
  CSG.initCopy = function () {
    CSG.labelCopyButtons(document);
    document.addEventListener("click", function (event) {
      var button = event.target.closest ? event.target.closest(".copy") : null;
      if (!button) return;
      var holder = button.closest(".cmd, .codeblock");
      var code = holder ? holder.querySelector("code") : null;
      if (!code) return;
      CSG.copy(code.textContent).then(function (ok) {
        if (!ok) return;
        var label = button.textContent;
        button.classList.add("is-done");
        button.textContent = "نُسخ";
        window.setTimeout(function () { button.classList.remove("is-done"); button.textContent = label; }, 1600);
      });
    });
  };

  /* ---------- السمة: النظام افتراضيًا، والاختيار اليدوي يُحفظ ---------- */
  var darkQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  CSG.currentTheme = function () {
    var forced = root.getAttribute("data-theme");
    if (forced === "light" || forced === "dark") return forced;
    return darkQuery && darkQuery.matches ? "dark" : "light";
  };
  function syncThemeButton() {
    var button = document.getElementById("theme-toggle");
    if (!button) return;
    var dark = CSG.currentTheme() === "dark";
    button.setAttribute("aria-label", dark ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن");
    button.setAttribute("data-mode", dark ? "dark" : "light");
  }
  CSG.initTheme = function () {
    var button = document.getElementById("theme-toggle");
    syncThemeButton();
    if (darkQuery && darkQuery.addEventListener) darkQuery.addEventListener("change", syncThemeButton);
    if (!button) return;
    button.addEventListener("click", function () {
      var next = CSG.currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      CSG.store.set("csg-theme", next);
      syncThemeButton();
    });
  };

  /* ---------- العدّادات ---------- */
  CSG.countUp = function (node, target) {
    if (CSG.reducedMotion() || !window.requestAnimationFrame || target === 0) {
      node.textContent = String(target);
      return;
    }
    var duration = 900;
    var start = null;
    function frame(time) {
      if (start === null) start = time;
      var progress = Math.min(1, (time - start) / duration);
      var eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = String(Math.round(target * eased));
      if (progress < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  };

  /* ---------- إظهار البطاقات تدريجيًا ---------- */
  var revealObserver = null;
  CSG.reveal = function (nodes) {
    if (CSG.reducedMotion() || !("IntersectionObserver" in window)) return;
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        var batch = 0;
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.style.setProperty("--d", String(Math.min(batch++, 6)));
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -40px 0px", threshold: 0.05 });
    }
    nodes.forEach(function (node) {
      node.classList.add("reveal");
      revealObserver.observe(node);
    });
  };

  /* ---------- بيانات مشتركة ---------- */
  CSG.skills = window.SKILLS_DATA || [];
  CSG.fields = window.FIELDS_DATA || [];
  CSG.tiers = window.TIERS_DATA || [];
  CSG.stacks = window.STACKS_DATA || [];
  CSG.skillById = {};
  CSG.skills.forEach(function (skill) { CSG.skillById[skill.id] = skill; });
  CSG.fieldLabel = function (id) {
    for (var i = 0; i < CSG.fields.length; i++) if (CSG.fields[i].id === id) return CSG.fields[i].labelAr;
    return id;
  };
  CSG.tierInfo = function (id) {
    for (var i = 0; i < CSG.tiers.length; i++) if (CSG.tiers[i].id === id) return CSG.tiers[i];
    return { id: id, labelAr: id, descAr: "" };
  };
  CSG.kindLabel = { skill: "مهارة", collection: "مجموعة مهارات", plugin: "إضافة" };
  CSG.methodLabel = { plugin: "إضافة Claude Code", cli: "أداة skills", manual: "نسخ يدوي", vendor: "أداة المؤلف" };

  // ختم الدرجة: الحرف والتسمية معًا حتى لا يعتمد المعنى على اللون.
  CSG.tierBadge = function (tier, size) {
    var info = CSG.tierInfo(tier);
    var badge = CSG.el("span", { className: "tier tier-" + tier + (size ? " tier-" + size : "") });
    badge.appendChild(CSG.el("span", { className: "tier-letter", "aria-hidden": "true", text: tier }));
    badge.appendChild(CSG.el("span", { className: "tier-label", text: info.labelAr }));
    badge.appendChild(CSG.el("span", { className: "visually-hidden", text: " (الدرجة " + tier + ")" }));
    return badge;
  };
})();
