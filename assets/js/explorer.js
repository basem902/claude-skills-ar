/*
 * المستكشف: الفلاتر والبحث ومزامنة الرابط والبطاقات، ونافذة التفاصيل، والحزم، وقائمة مصادر المستودعات.
 */
(function () {
  "use strict";

  var CSG = window.CSG;
  var el = CSG.el;
  var TIER_ORDER = { S: 0, A: 1, B: 2 };

  var state = { fields: [], tiers: [], q: "" };
  var searchIndex = {};
  var nodes = {};
  var revealed = false;

  /* ---------- الرابط: ?field=design,security&tier=S&q=... ---------- */
  function paramsFromLocation() {
    var search = window.location.search;
    var hash = window.location.hash || "";
    var source = search && search.length > 1 ? search.slice(1) : "";
    if (!source && hash.indexOf("?") > -1) source = hash.slice(hash.indexOf("?") + 1);
    var result = {};
    source.split("&").forEach(function (pair) {
      if (!pair) return;
      var index = pair.indexOf("=");
      var key = decodeURIComponent((index > -1 ? pair.slice(0, index) : pair).replace(/\+/g, " "));
      var value = index > -1 ? decodeURIComponent(pair.slice(index + 1).replace(/\+/g, " ")) : "";
      result[key] = value;
    });
    return result;
  }

  function readState() {
    var params = paramsFromLocation();
    var fieldIds = CSG.fields.map(function (f) { return f.id; });
    var tierIds = CSG.tiers.map(function (t) { return t.id; });
    state.fields = (params.field || "").split(",").filter(function (id) { return fieldIds.indexOf(id) > -1; });
    state.tiers = (params.tier || "").toUpperCase().split(",").filter(function (id) { return tierIds.indexOf(id) > -1; });
    state.q = (params.q || "").slice(0, 120);
  }

  function queryString() {
    var parts = [];
    if (state.fields.length) parts.push("field=" + state.fields.map(encodeURIComponent).join(","));
    if (state.tiers.length) parts.push("tier=" + state.tiers.join(","));
    if (state.q.trim()) parts.push("q=" + encodeURIComponent(state.q.trim()));
    return parts.join("&");
  }

  function writeState() {
    var qs = queryString();
    var hash = window.location.hash || "";
    if (hash.indexOf("?") > -1) hash = hash.slice(0, hash.indexOf("?"));
    try {
      window.history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : "") + hash);
    } catch (e) {
      // بعض المتصفحات ترفض replaceState على file://؛ نحفظ الحالة في الـ hash بدلًا منه.
      try { window.location.replace("#explorer" + (qs ? "?" + qs : "")); } catch (e2) { /* لا شيء نفعله */ }
    }
  }

  /* ---------- البحث ---------- */
  function buildIndex() {
    CSG.skills.forEach(function (skill) {
      var parts = [skill.id, skill.name, skill.nameAr, skill.author, skill.summaryAr, skill.whatAr,
        CSG.kindLabel[skill.kind] || "", CSG.tierInfo(skill.tier).labelAr]
        .concat(skill.fields.map(CSG.fieldLabel))
        .concat(skill.includes || []);
      searchIndex[skill.id] = CSG.normalize(parts.join(" ").replace(/`/g, ""));
    });
  }

  function matches(skill, tokens) {
    if (state.fields.length && !skill.fields.some(function (f) { return state.fields.indexOf(f) > -1; })) return false;
    if (state.tiers.length && state.tiers.indexOf(skill.tier) === -1) return false;
    if (!tokens.length) return true;
    var haystack = searchIndex[skill.id];
    return tokens.every(function (token) { return haystack.indexOf(token) > -1; });
  }

  /* ---------- الفلاتر ---------- */
  function chip(label, pressed, onToggle, extraClass) {
    var button = el("button", { type: "button", className: "chip" + (extraClass ? " " + extraClass : ""), "aria-pressed": pressed ? "true" : "false" });
    button.innerHTML = '<svg class="chip-check" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
    button.appendChild(label);
    button.addEventListener("click", function () {
      var next = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", next ? "true" : "false");
      onToggle(next);
    });
    return button;
  }

  function toggleIn(list, id, on) {
    var index = list.indexOf(id);
    if (on && index === -1) list.push(id);
    if (!on && index > -1) list.splice(index, 1);
  }

  function renderFilters() {
    nodes.fieldChips.innerHTML = "";
    CSG.fields.forEach(function (field) {
      var count = CSG.skills.filter(function (s) { return s.fields.indexOf(field.id) > -1; }).length;
      if (!count) return;
      var label = el("span", {}, [field.labelAr + " ", el("span", { className: "chip-count", text: String(count) })]);
      nodes.fieldChips.appendChild(chip(label, state.fields.indexOf(field.id) > -1, function (on) {
        toggleIn(state.fields, field.id, on);
        update(true);
      }));
    });

    nodes.tierChips.innerHTML = "";
    CSG.tiers.forEach(function (tier) {
      var label = el("span", { className: "chip-tier" }, [CSG.tierBadge(tier.id, "mini")]);
      nodes.tierChips.appendChild(chip(label, state.tiers.indexOf(tier.id) > -1, function (on) {
        toggleIn(state.tiers, tier.id, on);
        update(true);
      }, "chip-has-tier"));
    });

    nodes.legend.innerHTML = "";
    CSG.tiers.forEach(function (tier) {
      var row = el("div", { className: "legend-row" });
      row.appendChild(el("dt", {}, [CSG.tierBadge(tier.id, "mini")]));
      row.appendChild(el("dd", { text: tier.descAr }));
      nodes.legend.appendChild(row);
    });
  }

  function syncChips() {
    var fieldButtons = nodes.fieldChips.querySelectorAll(".chip");
    var visibleFields = CSG.fields.filter(function (field) {
      return CSG.skills.some(function (s) { return s.fields.indexOf(field.id) > -1; });
    });
    visibleFields.forEach(function (field, i) {
      if (fieldButtons[i]) fieldButtons[i].setAttribute("aria-pressed", state.fields.indexOf(field.id) > -1 ? "true" : "false");
    });
    var tierButtons = nodes.tierChips.querySelectorAll(".chip");
    CSG.tiers.forEach(function (tier, i) {
      if (tierButtons[i]) tierButtons[i].setAttribute("aria-pressed", state.tiers.indexOf(tier.id) > -1 ? "true" : "false");
    });
  }

  /* ---------- البطاقات ---------- */
  function whereLabel(cmd) {
    return cmd.charAt(0) === "/" ? "داخل Claude Code" : "في الطرفية";
  }

  function commandRow(cmd) {
    return el("div", { className: "cmd" }, [
      el("span", { className: "cmd-where", text: whereLabel(cmd) }),
      el("code", { dir: "ltr", text: cmd }),
      el("button", { type: "button", className: "copy", "aria-label": "انسخ: " + cmd, text: "نسخ" })
    ]);
  }

  function card(skill) {
    var article = el("article", { className: "skill-card", "data-tier": skill.tier, "aria-labelledby": "card-" + skill.id });

    var top = el("div", { className: "card-top" }, [CSG.tierBadge(skill.tier)]);
    if (skill.kind && skill.kind !== "skill") top.appendChild(el("span", { className: "kind", text: CSG.kindLabel[skill.kind] }));
    article.appendChild(top);

    var open = el("button", { type: "button", className: "card-open", id: "card-" + skill.id, "data-skill": skill.id, "aria-haspopup": "dialog" }, [
      el("span", { className: "latin", text: skill.name })
    ]);
    article.appendChild(el("h3", { className: "card-title" }, [open]));
    article.appendChild(el("p", { className: "card-ar", text: skill.nameAr }));
    article.appendChild(el("p", { className: "card-summary", html: CSG.rich(skill.summaryAr) }));

    var meta = el("dl", { className: "card-meta" }, [
      el("div", {}, [el("dt", { text: "المؤلف" }), el("dd", { className: "latin-ok", text: skill.author })]),
      el("div", {}, [el("dt", { text: "المجال" }), el("dd", { text: skill.fields.map(CSG.fieldLabel).join("، ") })])
    ]);
    article.appendChild(meta);

    if (skill.cautionAr) {
      article.appendChild(el("p", { className: "card-flag", html: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3 2.5 20h19z"/><path d="M12 10v4.5M12 17.2v.3"/></svg><span>فيها تنبيه أمني، اقرأه في التفاصيل</span>' }));
    }

    var first = skill.install[0];
    var install = el("div", { className: "card-install" }, [
      el("p", { className: "install-label", text: first.labelAr || CSG.methodLabel[first.method] })
    ]);
    first.cmds.forEach(function (cmd) { install.appendChild(commandRow(cmd)); });
    if (skill.install.length > 1) install.appendChild(el("p", { className: "install-more", text: "وطرق أخرى في التفاصيل" }));
    article.appendChild(install);

    return el("li", { className: "skill-item" }, [article]);
  }

  function update(syncUrl) {
    var tokens = CSG.normalize(state.q).split(" ").filter(Boolean);
    var shown = CSG.skills
      .filter(function (skill) { return matches(skill, tokens); })
      .sort(function (a, b) { return TIER_ORDER[a.tier] - TIER_ORDER[b.tier]; });

    nodes.grid.innerHTML = "";
    var items = shown.map(card);
    items.forEach(function (item) { nodes.grid.appendChild(item); });
    // التدرج يظهر في العرض الأول فقط؛ أثناء الكتابة في البحث تظهر النتائج فورًا.
    if (!revealed) {
      revealed = true;
      CSG.reveal(items.map(function (item) { return item.firstChild; }));
    }

    var total = CSG.skills.length;
    nodes.count.textContent = shown.length
      ? "يعرض " + shown.length + " من " + total + " " + CSG.noun("skills", total)
      : "لا نتائج من " + total + " " + CSG.noun("skills", total);
    nodes.empty.hidden = shown.length > 0;
    nodes.clear.disabled = !(state.fields.length || state.tiers.length || state.q.trim());

    syncChips();
    if (syncUrl) writeState();
  }

  function clearFilters() {
    state.fields = [];
    state.tiers = [];
    state.q = "";
    nodes.search.value = "";
    update(true);
  }

  /* ---------- نافذة التفاصيل ---------- */
  var dialog, lastTrigger = null;

  function section(title, content) {
    var block = el("section", { className: "dlg-section" }, [el("h3", { text: title })]);
    (Array.isArray(content) ? content : [content]).forEach(function (child) { block.appendChild(child); });
    return block;
  }

  function linkTo(url, label) {
    return el("a", { href: url, rel: "noopener", dir: "ltr", className: "ltr-link", text: label || url });
  }

  function fillDialog(skill) {
    var badges = document.getElementById("dlg-badges");
    badges.innerHTML = "";
    badges.appendChild(CSG.tierBadge(skill.tier, "large"));
    if (skill.kind && skill.kind !== "skill") badges.appendChild(el("span", { className: "kind", text: CSG.kindLabel[skill.kind] }));

    var title = document.getElementById("dlg-title");
    title.innerHTML = "";
    title.appendChild(el("span", { className: "latin", text: skill.name }));
    title.setAttribute("tabindex", "-1");

    var sub = document.getElementById("dlg-sub");
    sub.innerHTML = "";
    sub.appendChild(el("span", { className: "dlg-ar", text: skill.nameAr }));
    sub.appendChild(el("span", { className: "dlg-author" }, ["من إعداد ", el("span", { className: "latin-ok", text: skill.author })]));

    var body = document.getElementById("dlg-body");
    body.innerHTML = "";
    body.appendChild(section("ماذا تفعل", el("p", { html: CSG.rich(skill.whatAr) })));

    if (skill.includes && skill.includes.length) {
      var list = el("ul", { className: "code-list" });
      skill.includes.forEach(function (name) { list.appendChild(el("li", {}, [el("code", { dir: "ltr", text: name })])); });
      body.appendChild(section("أبرز ما تضمّه", list));
    }

    body.appendChild(section("لماذا اخترناها", el("p", { html: CSG.rich(skill.whyAr) })));

    if (skill.cautionAr) {
      body.appendChild(el("aside", { className: "caution", "aria-label": "تنبيه أمني" }, [
        el("h3", { html: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3 2.5 20h19z"/><path d="M12 10v4.5M12 17.2v.3"/></svg><span>تنبيه أمني</span>' }),
        el("p", { html: CSG.rich(skill.cautionAr) })
      ]));
    }

    body.appendChild(section("جرّبها", [
      el("p", { className: "dlg-label", text: "اكتب في Claude Code مثلًا:" }),
      el("div", { className: "codeblock" }, [
        el("code", { dir: "ltr", text: skill.examplePrompt }),
        el("button", { type: "button", className: "copy", "aria-label": "انسخ المثال", text: "نسخ" })
      ]),
      el("p", { className: "prompt-note", html: CSG.rich(skill.promptNoteAr) })
    ]));

    body.appendChild(section("ماذا تحصل عليه", el("p", { html: CSG.rich(skill.resultAr) })));

    var installWrap = [];
    skill.install.forEach(function (method) {
      var block = el("div", { className: "install-method" }, [
        el("h4", { text: method.labelAr || CSG.methodLabel[method.method] })
      ]);
      var steps = el("ol", { className: "install-steps" });
      method.cmds.forEach(function (cmd) { steps.appendChild(el("li", {}, [commandRow(cmd)])); });
      block.appendChild(steps);
      if (method.noteAr) block.appendChild(el("p", { className: "install-note", html: CSG.rich(method.noteAr) }));
      installWrap.push(block);
    });
    if (skill.noteAr) installWrap.push(el("p", { className: "dlg-note", html: CSG.rich(skill.noteAr) }));
    body.appendChild(section("التثبيت", installWrap));

    var facts = el("dl", { className: "facts-list" });
    facts.appendChild(el("div", {}, [el("dt", { text: "المستودع" }), el("dd", {}, [linkTo(skill.repo, skill.repo.replace(/^https:\/\/(www\.)?github\.com\//, ""))])]));
    var licenseDd = el("dd", {}, [skill.license ? el("span", { className: "latin-ok", text: skill.license }) : el("span", { text: "غير مذكورة في المستودع" })]);
    if (skill.licenseNoteAr) licenseDd.appendChild(el("span", { className: "license-note", html: CSG.rich(skill.licenseNoteAr) }));
    facts.appendChild(el("div", {}, [el("dt", { text: "الرخصة" }), licenseDd]));
    facts.appendChild(el("div", {}, [el("dt", { text: "تم التحقق في" }), el("dd", {}, [el("time", { datetime: skill.verifiedAt, text: CSG.formatDate(skill.verifiedAt) })])]));
    var sources = el("ul", { className: "dlg-sources" });
    skill.sources.forEach(function (url) { sources.appendChild(el("li", {}, [linkTo(url, url.replace(/^https:\/\//, ""))])); });
    facts.appendChild(el("div", {}, [el("dt", { text: "المصادر" }), el("dd", {}, [sources])]));
    body.appendChild(section("بيانات المراجعة", facts));

    body.scrollTop = 0;
  }

  function focusables() {
    return Array.prototype.filter.call(
      dialog.querySelectorAll('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'),
      function (node) { return node.offsetParent !== null || node === document.activeElement; }
    );
  }

  CSG.openSkill = function (id, trigger) {
    var skill = CSG.skillById[id];
    if (!skill || !dialog) return;
    lastTrigger = trigger || document.activeElement;
    fillDialog(skill);
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    document.documentElement.classList.add("dialog-open");
    document.getElementById("dlg-title").focus();
  };

  function closeDialog() {
    if (!dialog) return;
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else { dialog.removeAttribute("open"); onClosed(); }
  }

  function onClosed() {
    document.documentElement.classList.remove("dialog-open");
    var target = lastTrigger;
    lastTrigger = null;
    if (target && document.contains(target) && typeof target.focus === "function") target.focus();
    else if (nodes.search) nodes.search.focus();
  }

  function initDialog() {
    dialog = document.getElementById("skill-dialog");
    if (!dialog) return;
    document.getElementById("dlg-close").addEventListener("click", closeDialog);
    dialog.addEventListener("close", onClosed);
    dialog.addEventListener("cancel", function () { /* Esc: يغلق المتصفح النافذة، ونعيد التركيز في close */ });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) closeDialog();
    });
    dialog.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && typeof dialog.showModal !== "function") { event.preventDefault(); closeDialog(); return; }
      if (event.key !== "Tab") return;
      var items = focusables();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === document.getElementById("dlg-title"))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    document.addEventListener("click", function (event) {
      var trigger = event.target.closest ? event.target.closest("[data-skill]") : null;
      if (!trigger || trigger.tagName !== "BUTTON") return;
      CSG.openSkill(trigger.getAttribute("data-skill"), trigger);
    });
  }

  /* ---------- الحزم ---------- */
  function renderStacks() {
    var holder = document.getElementById("stack-list");
    if (!holder) return;
    holder.innerHTML = "";
    CSG.stacks.forEach(function (stack) {
      var article = el("article", { className: "stack", "aria-labelledby": "stack-" + stack.id });
      article.appendChild(el("h3", { id: "stack-" + stack.id, className: "stack-title", text: stack.titleAr }));
      article.appendChild(el("p", { className: "stack-blurb", html: CSG.rich(stack.blurbAr) }));
      var list = el("ol", { className: "stack-items" });
      stack.items.forEach(function (item) {
        var skill = CSG.skillById[item.id];
        if (!skill) {
          if (window.console) console.warn("stacks.js: مهارة غير معروفة " + item.id);
          return;
        }
        var button = el("button", { type: "button", className: "stack-skill", "data-skill": skill.id, "aria-haspopup": "dialog" }, [
          el("span", { className: "stack-name latin", text: skill.name }),
          CSG.tierBadge(skill.tier, "mini")
        ]);
        list.appendChild(el("li", {}, [button, el("p", { className: "stack-why", html: CSG.rich(item.noteAr) })]));
      });
      article.appendChild(list);
      if (stack.noteAr) article.appendChild(el("p", { className: "stack-note", html: CSG.rich(stack.noteAr) }));
      holder.appendChild(article);
    });
  }

  /* ---------- مصادر المستودعات: تُستخرج من البيانات نفسها ---------- */
  function renderRepoSources() {
    var holder = document.getElementById("sources-repos");
    if (!holder) return;
    var official = {};
    document.querySelectorAll("#sources-official a").forEach(function (a) { official[a.href] = true; });
    var seen = {};
    var urls = [];
    CSG.skills.forEach(function (skill) {
      skill.sources.forEach(function (url) {
        if (seen[url] || official[url]) return;
        seen[url] = true;
        urls.push({ url: url, date: skill.verifiedAt });
      });
    });
    urls.forEach(function (entry) {
      var label = entry.url.replace(/^https:\/\/(www\.)?/, "").replace(/^github\.com\//, "").replace(/\/blob\/(main|master)\//, "/").replace(/\/tree\/(main|master)\//, "/");
      holder.appendChild(el("li", {}, [
        el("a", { href: entry.url, rel: "noopener", dir: "ltr", className: "ltr-link", text: label }),
        el("span", { className: "src-meta" }, [el("time", { datetime: entry.date, text: entry.date })])
      ]));
    });
  }

  /* ---------- التهيئة ---------- */
  CSG.initExplorer = function () {
    nodes.search = document.getElementById("search");
    nodes.fieldChips = document.getElementById("field-chips");
    nodes.tierChips = document.getElementById("tier-chips");
    nodes.legend = document.getElementById("tier-legend");
    nodes.grid = document.getElementById("skill-grid");
    nodes.count = document.getElementById("result-count");
    nodes.empty = document.getElementById("empty-state");
    nodes.clear = document.getElementById("clear-filters");
    if (!nodes.grid) return;

    buildIndex();
    readState();
    nodes.search.value = state.q;
    renderFilters();
    update(false);

    var timer = null;
    nodes.search.addEventListener("input", function () {
      state.q = nodes.search.value;
      update(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(writeState, 250);
    });
    nodes.clear.addEventListener("click", clearFilters);
    document.getElementById("empty-clear").addEventListener("click", function () {
      clearFilters();
      nodes.search.focus();
    });

    // "/" ينقل التركيز إلى البحث ما لم يكن المستخدم يكتب في حقل.
    document.addEventListener("keydown", function (event) {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      var target = event.target;
      var tag = target && target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (target && target.isContentEditable)) return;
      if (dialog && dialog.open) return;
      event.preventDefault();
      nodes.search.focus();
      nodes.search.select();
      var explorer = document.getElementById("explorer");
      if (explorer && explorer.scrollIntoView) explorer.scrollIntoView({ block: "start", behavior: CSG.reducedMotion() ? "auto" : "smooth" });
    });

    initDialog();
    renderStacks();
    renderRepoSources();
  };
})();
