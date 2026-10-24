/*
 * مولّد SKILL.md: يتحقق من قواعد المواصفة ويبني الترويسة والمتن ويعاين النتيجة مباشرة.
 * القواعد من agentskills.io/specification وتوثيق Anthropic:
 *   name: 1-64 حرفًا، [a-z0-9] وشرطات، لا تبدأ ولا تنتهي بشرطة ولا شرطتين متتاليتين، دون claude أو anthropic.
 *   description: 1-1024 حرفًا، دون وسوم XML.
 */
(function () {
  "use strict";

  var CSG = window.CSG;
  var NAME_MAX = 64;
  var DESC_MAX = 1024;
  var RESERVED = ["anthropic", "claude"];

  var EXAMPLES = {
    flutter: {
      name: "flutter-clean-architecture-review",
      description: "Reviews Flutter and Dart code against Clean Architecture boundaries (presentation, domain, data). Use when the user asks to review a Flutter pull request or a feature folder, or asks whether code respects layer dependencies.",
      body: [
        "1. Identify the feature under review and list its files by layer: presentation, domain, data.",
        "2. Check the dependency rule: domain must not import Flutter, data sources, or presentation code.",
        "3. Check that use cases depend on repository interfaces in domain, not on implementations in data.",
        "4. Flag business logic inside widgets and suggest moving it to a use case or a state holder.",
        "5. Report findings grouped by severity, each with the file path and a concrete fix."
      ].join("\n"),
      examples: [
        "\"Review lib/features/checkout\" → findings grouped by layer, each with a file path and a fix",
        "\"Does the profile feature respect Clean Architecture?\" → a verdict per rule, with the offending import quoted"
      ].join("\n"),
      guidelines: [
        "Do not rewrite code during a review unless the user asks for fixes",
        "Quote the import line that breaks a dependency rule",
        "Prefer small, local fixes over restructuring the whole feature"
      ].join("\n")
    },
    commits: {
      name: "conventional-commit-messages",
      description: "Writes git commit messages in the Conventional Commits format, such as feat(auth): add password reset. Use when the user asks to commit, to write a commit message, or to summarize staged changes.",
      body: [
        "1. Run `git diff --staged` and read the whole change before writing anything.",
        "2. Pick the type: feat, fix, docs, style, refactor, perf, test, build, ci, or chore.",
        "3. Add a scope in parentheses when the change is limited to one module.",
        "4. Write the subject in the imperative mood, under 72 characters, with no trailing period.",
        "5. Add a body only when the reason for the change is not obvious from the subject.",
        "6. Mark breaking changes with `!` after the type and a `BREAKING CHANGE:` footer."
      ].join("\n"),
      examples: [
        "New login screen → feat(auth): add login screen",
        "Crash on an empty cart → fix(cart): handle empty cart at checkout"
      ].join("\n"),
      guidelines: [
        "One logical change per commit; suggest splitting when the diff mixes concerns",
        "Never invent a scope that does not exist in the codebase"
      ].join("\n")
    }
  };

  var f = {};
  var touched = { name: false, description: false };

  /* ---------- التحقق ---------- */
  function nameError(value) {
    if (!value) return "اكتب اسمًا للمهارة.";
    if (value.length > NAME_MAX) return "الاسم أطول من " + NAME_MAX + " حرفًا (" + value.length + " الآن).";
    if (/[A-Z]/.test(value)) return "استخدم حروفًا صغيرة فقط، مثل review-code لا Review-Code.";
    if (/[^a-z0-9-]/.test(value)) return "المسموح: حروف إنجليزية صغيرة وأرقام وشرطات. أزل المسافات والرموز الأخرى.";
    if (/^-|-$/.test(value)) return "لا يبدأ الاسم بشرطة ولا ينتهي بها.";
    if (/--/.test(value)) return "لا تضع شرطتين متتاليتين.";
    for (var i = 0; i < RESERVED.length; i++) {
      if (value.indexOf(RESERVED[i]) > -1) return "الكلمة " + RESERVED[i] + " محجوزة ولا تُقبل في الاسم.";
    }
    return "";
  }

  function descError(value) {
    if (!value.trim()) return "الوصف إلزامي، ومنه يقرر Claude متى يستدعي المهارة.";
    if (value.length > DESC_MAX) return "الوصف أطول من " + DESC_MAX + " حرفًا بـ " + (value.length - DESC_MAX) + ".";
    if (/<\/?[a-zA-Z][^>]*>/.test(value)) return "أزل وسوم XML أو HTML من الوصف.";
    return "";
  }

  function showError(input, errorNode, message, show) {
    var visible = show && message;
    errorNode.textContent = visible ? message : "";
    if (visible) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  /* ---------- بناء الملف ---------- */
  function yamlValue(text) {
    var value = text.replace(/\s+/g, " ").trim();
    var plainSafe = value &&
      !/^[\s\-?:,\[\]{}#&*!|>'"%@`]/.test(value) &&
      !/: |\s#/.test(value) &&
      !/:$/.test(value) &&
      !/^(true|false|yes|no|null|~|[-+]?\d[\d._]*)$/i.test(value);
    // JSON string صالح كقيمة YAML بين علامتي تنصيص مزدوجتين.
    return plainSafe ? value : JSON.stringify(value);
  }

  function titleFromName(name) {
    if (!name) return "My Skill";
    return name.split("-").filter(Boolean).map(function (part) {
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join(" ");
  }

  function bullets(text) {
    return text.split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean).map(function (line) {
      return /^([-*+]|\d+[.)])\s/.test(line) ? line : "- " + line;
    }).join("\n");
  }

  function buildSkill() {
    var name = f.name.value.trim();
    var description = f.desc.value;
    var body = f.body.value.replace(/\s+$/, "");
    var examples = bullets(f.examples.value);
    var guidelines = bullets(f.guidelines.value);

    var out = [
      "---",
      "name: " + (name || "my-skill"),
      "description: " + (yamlValue(description) || "\"\""),
      "---",
      "",
      "# " + titleFromName(name),
      "",
      "## Instructions",
      "",
      body || "<!-- Write the steps Claude should follow -->"
    ];
    if (examples) out.push("", "## Examples", "", examples);
    if (guidelines) out.push("", "## Guidelines", "", guidelines);
    return out.join("\n") + "\n";
  }

  // تلوين بسيط للمعاينة؛ النص يُهرَّب أولًا ثم تُضاف وسوم span.
  function highlight(text) {
    var inFront = false;
    var fenceCount = 0;
    return text.split("\n").map(function (line) {
      var safe = CSG.escape(line);
      if (line === "---" && fenceCount < 2) {
        fenceCount++;
        inFront = fenceCount === 1;
        return '<span class="tk-fence">' + safe + "</span>";
      }
      if (inFront) {
        return safe.replace(/^([a-z-]+)(:)/, '<span class="tk-key">$1</span><span class="tk-punct">$2</span>');
      }
      if (/^#{1,6}\s/.test(line)) return '<span class="tk-head">' + safe + "</span>";
      if (/^<!--/.test(line)) return '<span class="tk-comment">' + safe + "</span>";
      return safe.replace(/^(\s*(?:[-*+]|\d+[.)]))(\s)/, '<span class="tk-bullet">$1</span>$2');
    }).join("\n");
  }

  function render() {
    var name = f.name.value.trim();
    var description = f.desc.value;
    showError(f.name, f.nameError, nameError(name), touched.name);
    showError(f.desc, f.descError, descError(description), touched.description);

    var length = description.length;
    f.count.textContent = length + " / " + DESC_MAX;
    f.count.classList.toggle("is-over", length > DESC_MAX);

    f.path.textContent = "~/.claude/skills/" + (name && !nameError(name) ? name : "<name>") + "/SKILL.md";
    f.preview.innerHTML = highlight(buildSkill());
  }

  function validateAll() {
    touched.name = true;
    touched.description = true;
    render();
    if (nameError(f.name.value.trim())) { f.name.focus(); return false; }
    if (descError(f.desc.value)) { f.desc.focus(); return false; }
    return true;
  }

  function fill(example) {
    f.name.value = example.name;
    f.desc.value = example.description;
    f.body.value = example.body;
    f.examples.value = example.examples || "";
    f.guidelines.value = example.guidelines || "";
    if (f.optional && (example.examples || example.guidelines)) f.optional.open = true;
    touched.name = true;
    touched.description = true;
    render();
  }

  function reset() {
    f.form.reset();
    touched.name = false;
    touched.description = false;
    render();
    f.name.focus();
    CSG.toast("مُسحت الحقول");
  }

  function download() {
    if (!validateAll()) { CSG.toast("صحّح الحقول المعلَّمة أولًا"); return; }
    try {
      var blob = new Blob([buildSkill()], { type: "text/markdown;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "SKILL.md";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      CSG.toast("نُزّل الملف SKILL.md");
    } catch (e) {
      CSG.toast("تعذّر التنزيل في هذا المتصفح. انسخ الملف بدلًا من ذلك.");
    }
  }

  CSG.initGenerator = function () {
    f.form = document.getElementById("gen-form");
    if (!f.form) return;
    f.name = document.getElementById("g-name");
    f.desc = document.getElementById("g-desc");
    f.body = document.getElementById("g-body");
    f.examples = document.getElementById("g-examples");
    f.guidelines = document.getElementById("g-guidelines");
    f.optional = f.form.querySelector("details");
    f.nameError = document.getElementById("g-name-error");
    f.descError = document.getElementById("g-desc-error");
    f.count = document.getElementById("g-desc-count");
    f.path = document.getElementById("g-path");
    f.preview = document.getElementById("g-preview");

    f.form.addEventListener("input", render);
    f.form.addEventListener("submit", function (event) { event.preventDefault(); });
    f.name.addEventListener("blur", function () { if (f.name.value) { touched.name = true; render(); } });
    f.desc.addEventListener("blur", function () { if (f.desc.value) { touched.description = true; render(); } });

    document.querySelectorAll("[data-example]").forEach(function (button) {
      button.addEventListener("click", function () {
        var example = EXAMPLES[button.getAttribute("data-example")];
        if (!example) return;
        fill(example);
        CSG.toast("عُبّئ المثال، عدّله كما تريد");
      });
    });

    document.getElementById("g-copy").addEventListener("click", function () {
      if (!validateAll()) { CSG.toast("صحّح الحقول المعلَّمة أولًا"); return; }
      CSG.copy(buildSkill());
    });
    document.getElementById("g-download").addEventListener("click", download);
    document.getElementById("g-reset").addEventListener("click", reset);

    render();
  };

  // للاختبار: تعرض الدوال الخالصة دون تغيير الواجهة.
  CSG.generator = { nameError: nameError, descError: descError, yamlValue: yamlValue, build: function () { return buildSkill(); } };
})();
