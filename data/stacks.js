/*
 * حزم جاهزة: كل حزمة قائمة مرتبة تشير إلى مهارات من data/skills.js عبر id.
 * items[].noteAr يشرح سبب وجود المهارة في هذه الحزمة تحديدًا.
 * noteAr على مستوى الحزمة لملاحظة صريحة عن حدودها.
 */
window.STACKS_DATA = [
  {
    id: "day-one",
    titleAr: "أساسيات اليوم الأول",
    blurbAr: "إن لم تثبّت شيئًا بعد، فابدأ بهذه. تحسّن طريقة العمل نفسها في أي مشروع، قبل أي مهارة متخصصة.",
    items: [
      { id: "superpowers", noteAr: "الإطار العام: أسئلة ثم خطة ثم اختبار قبل الكود." },
      { id: "karpathy-guidelines", noteAr: "يكبح الافتراضات الصامتة والتعديلات الزائدة." },
      { id: "context7", noteAr: "يمنع اختراع واجهات API قديمة أو غير موجودة." },
      { id: "grill-me", noteAr: "قبل أي ميزة كبيرة، دعه يستجوب خطتك." },
      { id: "skill-creator", noteAr: "حين تلاحظ أنك تكرر التعليمات نفسها، حوّلها إلى مهارة." }
    ],
    noteAr: "Superpowers وGrill Me تتقاطعان في مرحلة الأسئلة. إن شعرت بتكرار فأبقِ Superpowers للعمل اليومي واستخدم `/grill-me` عند الحاجة فقط."
  },
  {
    id: "web-fullstack",
    titleAr: "ويب متكامل (Next.js وReact)",
    blurbAr: "لمن يبني تطبيقات React أو Next.js مع قاعدة بيانات: أداء، وبنية مكوّنات، واختبار فعلي في المتصفح.",
    items: [
      { id: "vercel-react-best-practices", noteAr: "قواعد الأداء أثناء الكتابة لا بعدها." },
      { id: "vercel-composition-patterns", noteAr: "حين تبدأ المكوّنات بالتضخم." },
      { id: "web-design-guidelines", noteAr: "مراجعة الوصول والتركيز والنماذج قبل الإطلاق." },
      { id: "webapp-testing", noteAr: "يتأكد أن الميزة تعمل في المتصفح فعلًا." },
      { id: "supabase", noteAr: "إن كانت قاعدة بياناتك Supabase: مصادقة وRLS صحيحة." }
    ]
  },
  {
    id: "design-dev",
    titleAr: "مصمم ومطوّر",
    blurbAr: "واجهات لا تبدو مصنوعة بالذكاء الاصطناعي: اتجاه بصري مقصود، ثم تدقيق، ثم مراجعة مقابل قواعد واضحة.",
    items: [
      { id: "frontend-design", noteAr: "يضع الاتجاه البصري قبل أول سطر CSS." },
      { id: "impeccable", noteAr: "أوامر تلميع وكاشف آلي أثناء العمل." },
      { id: "avoid-ai-design", noteAr: "فحص أخير بحثًا عن علامات القوالب المكررة." },
      { id: "web-design-guidelines", noteAr: "الجمال لا يغني عن الوصول والتركيز المرئي." },
      { id: "webapp-testing", noteAr: "لقطات شاشة حقيقية لتقييم النتيجة، لا تخمين." }
    ],
    noteAr: "Impeccable وavoid-ai-design تتقاطعان في الفحص. ابدأ بإحداهما، وأضف الأخرى إن احتجت رأيًا ثانيًا."
  },
  {
    id: "security-review",
    titleAr: "أمان ومراجعة كود",
    blurbAr: "طبقات مراجعة قبل الدمج: التغييرات نفسها، ثم أدوات التحليل، ثم الاعتماديات.",
    items: [
      { id: "differential-review", noteAr: "مراجعة أمنية لكل PR قبل دمجه." },
      { id: "static-analysis", noteAr: "Semgrep وCodeQL مع فرز النتائج." },
      { id: "supply-chain-risk-auditor", noteAr: "ما تجلبه الاعتماديات معها." },
      { id: "superpowers", noteAr: "مراجعة الكود بين المهام وقبل إنهاء الفرع." }
    ]
  },
  {
    id: "documents",
    titleAr: "إنتاج المستندات",
    blurbAr: "تقارير وعروض وجداول وملفات PDF من داخل Claude Code. في claude.ai تعمل هذه المهارات تلقائيًا دون تثبيت.",
    items: [
      { id: "docx", noteAr: "تقارير وعقود بتنسيق حقيقي." },
      { id: "xlsx", noteAr: "بيانات نظيفة وصيغ حية." },
      { id: "pptx", noteAr: "عروض قابلة للتعديل من بيانات جاهزة." },
      { id: "pdf", noteAr: "استخراج ودمج وتعبئة نماذج." }
    ],
    noteAr: "الأربع متاحة المصدر وليست مفتوحة المصدر. ثبّتها معًا بحزمة `document-skills`."
  },
  {
    id: "flutter-supabase",
    titleAr: "Flutter مع Supabase",
    blurbAr: "مهارات Flutter وDart الرسمية، ومعها مهارات Supabase لقاعدة البيانات والمصادقة.",
    items: [
      { id: "flutter-agent-plugins", noteAr: "الأساس الرسمي: اختبارات وتخطيط وتوجيه." },
      { id: "dart-skills", noteAr: "تعارض الحزم والتحليل الساكن واختبارات الوحدات." },
      { id: "supabase", noteAr: "المخطط والمصادقة وسياسات RLS." },
      { id: "supabase-postgres-best-practices", noteAr: "حين يبطؤ استعلام أو يكبر الجدول." },
      { id: "vgv-ai-flutter-plugin", noteAr: "اختيارية، إن كان فريقك يعتمد Bloc وأسلوب VGV." }
    ],
    noteAr: "لم نجد مهارة موثّقة تغطي مكتبة `supabase_flutter` تحديدًا؛ مهارات Supabase الرسمية تكتب أمثلتها لـ `supabase-js`. قواعد المخطط والمصادقة وRLS تنطبق كما هي، أما كود العميل بلغة Dart فراجعه بنفسك."
  }
];
