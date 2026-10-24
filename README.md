# دليل مهارات Claude

دليل عربي مستقل وتفاعلي لمهارات Claude (Agent Skills): ما هي المهارة، وكيف تثبّتها خطوة بخطوة، وأي المهارات تستحق التثبيت حسب مجالك، وحزم جاهزة، ومولّد لملف `SKILL.md`.

الموقع صفحة ثابتة: HTML وCSS وJavaScript عادية، بلا إطار عمل ولا خطوة بناء ولا اعتماديات npm. يعمل عند فتح `index.html` مباشرة من الملفات، ويُنشر على GitHub Pages كما هو.

## التشغيل محليًا

أسهل طريقة: افتح `index.html` في المتصفح مباشرة.

ولتجربته عبر خادم محلي (أقرب إلى بيئة النشر):

```bash
npx serve .
```

ثم افتح العنوان الذي يطبعه الأمر في الطرفية، وهو عادة `http://localhost:3000`.

## النشر على GitHub Pages

1. أنشئ مستودعًا جديدًا على GitHub.
2. ادفع المشروع إلى الفرع `main`:

   ```bash
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```

3. في صفحة المستودع افتح **Settings** ثم **Pages**.
4. تحت **Build and deployment** اختر **Deploy from a branch**، ثم الفرع `main` والمجلد `/ (root)`، واحفظ.
5. بعد دقيقة أو اثنتين يظهر رابط الموقع في الصفحة نفسها.

ملف `.nojekyll` الفارغ في الجذر يطلب من GitHub Pages نشر الملفات كما هي دون معالجة Jekyll.

## بنية المشروع

```text
index.html             الصفحة كاملة
assets/css/styles.css  الأنماط: الرموز، والسمتان الفاتحة والداكنة، وكل المكوّنات
assets/js/core.js      أدوات مشتركة: التخزين الآمن، وتطبيع العربية، والنسخ، والسمة
assets/js/explorer.js  المستكشف، ونافذة التفاصيل، والحزم، ومصادر المستودعات
assets/js/generator.js مولّد SKILL.md
assets/js/app.js       تشغيل الصفحة: الأرقام، والمخطط، والتبويبات، وقائمة التحقق
data/skills.js         المصدر الوحيد لبيانات المهارات والمجالات والدرجات
data/stacks.js         الحزم الجاهزة
```

السكربتات كلاسيكية (`<script defer>`) وليست وحدات، والبيانات متغيرات عامة على `window`، حتى يعمل الموقع من `file://` دون طلبات `fetch`.

## إضافة مهارة أو تعديلها

كل شيء في `data/skills.js`. الأرقام في أعلى الصفحة، وعدد المجالات، وتاريخ «آخر تحديث»، وقائمة مصادر المستودعات، كلها تُحسب من هذا الملف.

```js
{
  id: "frontend-design",            // فريد، ويُستخدم في الحزم
  name: "Frontend Design",
  nameAr: "تصميم الواجهات",
  kind: "skill",                    // "skill" | "collection" | "plugin"
  author: "Anthropic",
  repo: "https://github.com/anthropics/skills/tree/main/skills/frontend-design",
  fields: ["design"],               // من FIELDS_DATA
  tier: "S",                        // "S" | "A" | "B"
  summaryAr: "سطر واحد للبطاقة",
  whatAr: "ماذا تفعل",
  whyAr: "لماذا اخترناها",
  examplePrompt: "English prompt as typed",
  promptNoteAr: "شرح المثال",
  resultAr: "ماذا تحصل عليه",
  includes: ["..."],                // اختياري، للمجموعات
  install: [{
    method: "cli",                  // "plugin" | "cli" | "manual" | "vendor"
    labelAr: "اختياري",
    cmds: ["npx skills add ..."],   // بالترتيب؛ ما يبدأ بـ / يُكتب داخل Claude Code
    noteAr: "اختياري"
  }],
  noteAr: "ملاحظة عامة، اختيارية",
  cautionAr: "تنبيه أمني، اختياري",
  license: "Apache-2.0",            // أو null إن لم تُذكر
  licenseNoteAr: "اختياري",
  verifiedAt: "YYYY-MM-DD",
  sources: ["https://..."]
}
```

قواعد البيانات:

- انقل أمر التثبيت كما ورد في README المستودع أو التوثيق الرسمي، ولا تخترع أوامر.
- حدّث `verifiedAt` و`sources` كلما راجعت المهارة من جديد.
- لا تعرض أعداد النجوم أو التثبيت؛ فهي تتقادم بسرعة.
- النصوص العربية تقبل `كودًا` بين علامتي backtick، ويظهر داخل `<code dir="ltr">`.

## إمكانية الوصول والخصوصية

- الصفحة RTL بالكامل وتستخدم الخصائص المنطقية في CSS.
- كل الأوامر والمسارات داخل `<code dir="ltr">` معزولة عن اتجاه النص العربي.
- السمة تتبع إعداد النظام، ويُحفظ الاختيار اليدوي في `localStorage`. كل قراءة وكتابة للتخزين داخل `try/catch`، فيعمل الموقع كاملًا إن كان التخزين معطلًا.
- الحركة تتوقف عند تفعيل «تقليل الحركة» في النظام.
- لا تحليلات ولا ملفات تعريف ارتباط. الطلب الخارجي الوحيد هو خطوط Google Fonts.

## إخلاء مسؤولية

دليل مستقل، لا يتبع Anthropic ولا مؤلفي المهارات المذكورة. كل مهارة ملك لمؤلفها وتخضع لرخصتها. استلهمنا تقسيم الأقسام من [دليل أحمد منسي](https://ahmadmansy.github.io/claude-skills/)، أما النصوص والتصميم فمن عملنا.
