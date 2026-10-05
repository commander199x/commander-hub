// Strategy guides (English + Arabic). These are COMMUNITY DRAFTS — have your best players
// check every detail, then edit the text here. Add a new guide by copying one block.
import type { GeneralKey } from "@/lib/generals";

export type T = { en: string; ar: string };
export type Guide = {
  slug: string;
  general: GeneralKey;
  difficulty: "beginner" | "intermediate" | "advanced";
  updated: string; // YYYY-MM-DD
  title: T;
  summary: T;
  strengths: T[];
  weaknesses: T[];
  opening: T[];
  plan: T[];
  counters: T[];
  tips: T[];
};

export const GUIDES: Guide[] = [
  {
    slug: "china-nuke-general",
    general: "china_nuke",
    difficulty: "intermediate",
    updated: "2026-10-05",
    title: { en: "Nuke General: radiation and raw power", ar: "جنرال النووي: الإشعاع والقوة الخام" },
    summary: {
      en: "General Tao trades a little early speed for some of the hardest-hitting late-game tools in Zero Hour. Survive the opening, then out-trade your opponent with nuclear firepower.",
      ar: "يضحّي الجنرال تاو ببعض السرعة في البداية مقابل أقوى أدوات منتصف ونهاية اللعبة في الساعة الصفر. اصمد في الافتتاح، ثم تفوّق على خصمك بالقوة النووية.",
    },
    strengths: [
      { en: "Nuclear-powered tanks move faster than standard Chinese armor.", ar: "الدبابات العاملة بالطاقة النووية أسرع من الدروع الصينية العادية." },
      { en: "Devastating late-game options: Nuke Cannons and the Nuclear Missile.", ar: "خيارات مدمّرة في نهاية اللعبة: مدافع النووي والصاروخ النووي." },
      { en: "Tactical nuke air strikes punish clumped armies and bases.", ar: "الضربات الجوية النووية التكتيكية تعاقب الجيوش والقواعد المتكدّسة." },
    ],
    weaknesses: [
      { en: "Destroyed nuclear tanks leave radiation that can hurt your own units — research Isotope Stability.", ar: "الدبابات النووية المدمّرة تترك إشعاعاً قد يضرّ وحداتك — طوّر «استقرار النظائر»." },
      { en: "Expensive army; losing a big fight early is hard to recover from.", ar: "جيش مكلف؛ خسارة معركة كبيرة مبكراً يصعب التعافي منها." },
      { en: "Vulnerable to fast air harassment before you have anti-air.", ar: "عرضة لمضايقات جوية سريعة قبل امتلاك دفاع جوي." },
    ],
    opening: [
      { en: "Dozer builds a Supply Center; the Command Center trains a second Dozer.", ar: "يبني الجرّار مركز الإمداد، ومركز القيادة يدرّب جرّاراً ثانياً." },
      { en: "Second Dozer builds a Power Plant, then Barracks.", ar: "الجرّار الثاني يبني محطة طاقة ثم الثكنات." },
      { en: "Red Guard pair to scout and guard your supply line.", ar: "زوج من الحرس الأحمر للاستطلاع وحماية خط الإمداد." },
      { en: "War Factory as soon as income allows; add Supply Trucks.", ar: "مصنع الحرب فور السماح بالدخل، مع شاحنات إمداد إضافية." },
      { en: "Tech toward Propaganda Center and Nuclear upgrades once your economy is stable.", ar: "اتجه نحو مركز الدعاية والتحسينات النووية بعد استقرار الاقتصاد." },
    ],
    plan: [
      { en: "Hold the map with Battlemasters and Gattling Tanks while you build up.", ar: "سيطر على الخريطة بدبابات باتلماستر وغاتلينغ بينما تبني قوتك." },
      { en: "Spread your armor out so a single strike or a dying tank's radiation can't wipe it.", ar: "وزّع دروعك حتى لا تمسحها ضربة واحدة أو إشعاع دبابة مدمّرة." },
      { en: "Use Nuke Cannons from behind your tank line to break defenses.", ar: "استخدم مدافع النووي من خلف خط الدبابات لكسر الدفاعات." },
    ],
    counters: [
      { en: "Air-heavy USA: build Gattling Tanks and Gattling Cannons early.", ar: "أمريكا الجوية: ابنِ دبابات وغاتلينغ ومدافع غاتلينغ مبكراً." },
      { en: "GLA hit-and-run: keep a small mobile force at home; don't chase into ambushes.", ar: "كرّ وفرّ جيش التحرير: احتفظ بقوة متحركة صغيرة في القاعدة ولا تطارد نحو الكمائن." },
      { en: "Artillery: flank it with fast tanks instead of attacking head-on.", ar: "المدفعية: التفّ عليها بدبابات سريعة بدل الهجوم المباشر." },
    ],
    tips: [
      { en: "Watch your radiation — never retreat your army through it.", ar: "انتبه للإشعاع — لا تسحب جيشك عبره أبداً." },
      { en: "Scout before committing to an expensive tech path.", ar: "استطلع قبل الالتزام بمسار تقني مكلف." },
      { en: "Save the Nuclear Missile for when it decides the game, not just for damage.", ar: "احتفظ بالصاروخ النووي للحظة الحاسمة، لا لمجرد الضرر." },
    ],
  },
  {
    slug: "gla-toxin-general",
    general: "gla_toxin",
    difficulty: "beginner",
    updated: "2026-10-05",
    title: { en: "Toxin General: poison everything", ar: "جنرال السموم: سمّم كل شيء" },
    summary: {
      en: "Dr. Thrax turns the GLA arsenal toxic. Toxins shred infantry and punish anything that sits still — perfect for players who like constant pressure.",
      ar: "يحوّل د. ثراكس ترسانة جيش التحرير إلى سامّة. السموم تمزّق المشاة وتعاقب كل ما يقف ساكناً — مثالي لمن يحب الضغط المستمر.",
    },
    strengths: [
      { en: "Toxin units and upgrades melt infantry and garrisoned buildings.", ar: "وحدات وتحسينات السموم تذيب المشاة والمباني المحصّنة." },
      { en: "Toxin Tractors deny ground and break entrenched positions.", ar: "جرارات السموم تمنع التمركز وتكسر المواقع المحصّنة." },
      { en: "Cheap, fast GLA units make early pressure easy.", ar: "وحدات جيش التحرير الرخيصة والسريعة تسهّل الضغط المبكر." },
    ],
    weaknesses: [
      { en: "Toxins are much weaker against tanks and aircraft.", ar: "السموم أضعف بكثير ضد الدبابات والطائرات." },
      { en: "Fragile units — losing your army to a direct fight is costly.", ar: "وحدات هشّة — خسارة جيشك في مواجهة مباشرة مكلفة." },
      { en: "Needs good micro to avoid poisoning its own forces.", ar: "يحتاج تحكماً جيداً لتجنّب تسميم قواته." },
    ],
    opening: [
      { en: "Workers build a Supply Stash and Barracks right away; queue more Workers.", ar: "يبني العمّال مخزن الإمداد والثكنات فوراً، مع تدريب عمّال إضافيين." },
      { en: "Rebels to scout and grab nearby oil derricks or supply piles.", ar: "متمردون للاستطلاع والسيطرة على آبار النفط أو الإمدادات القريبة." },
      { en: "Arms Dealer early for Technicals and Toxin Tractors.", ar: "تاجر الأسلحة مبكراً للتكنيكال وجرارات السموم." },
      { en: "Palace when stable, then toxin upgrades.", ar: "القصر عند الاستقرار، ثم تحسينات السموم." },
    ],
    plan: [
      { en: "Harass supply lines with fast units to slow your opponent.", ar: "ضايق خطوط الإمداد بوحدات سريعة لإبطاء خصمك." },
      { en: "Use toxins on infantry and defensive buildings; add anti-tank units for armor.", ar: "استخدم السموم على المشاة والمباني الدفاعية، وأضف مضادات دروع للدبابات." },
      { en: "Tunnel Networks keep your army mobile and your base safe.", ar: "شبكات الأنفاق تبقي جيشك متحركاً وقاعدتك آمنة." },
    ],
    counters: [
      { en: "Tank-heavy China: mix in RPG Troopers and Rocket Buggies.", ar: "الصين الثقيلة بالدبابات: أضف جنود RPG وعربات الصواريخ." },
      { en: "USA air: Quad Cannons and Stinger Sites before they mass aircraft.", ar: "طيران أمريكا: مدافع رباعية ومواقع ستينغر قبل أن يتكدّس الطيران." },
      { en: "Infantry-heavy opponents: this is your best matchup — attack early.", ar: "خصوم يعتمدون على المشاة: هذه أفضل مواجهة لك — هاجم مبكراً." },
    ],
    tips: [
      { en: "Never park your own units in toxic ground.", ar: "لا توقف وحداتك أبداً في أرض مسمومة." },
      { en: "Keep Workers busy — GLA economy wins long games.", ar: "أبقِ العمّال مشغولين — اقتصاد جيش التحرير يربح المباريات الطويلة." },
      { en: "Rebuild with salvage: picking up crates upgrades your vehicles.", ar: "استفد من الحطام: التقاط الصناديق يطوّر مركباتك." },
    ],
  },
  {
    slug: "usa-air-force-general",
    general: "usa_air",
    difficulty: "advanced",
    updated: "2026-10-05",
    title: { en: "Air Force General: rule the skies", ar: "جنرال القوات الجوية: سيطر على السماء" },
    summary: {
      en: "General Granger builds the best air force in the game. You win by controlling the sky and striking where the enemy isn't — not by trading on the ground.",
      ar: "يبني الجنرال غرانجر أقوى سلاح جو في اللعبة. تنتصر بالسيطرة على السماء والضرب حيث لا يكون العدو — لا بالمواجهة البرية.",
    },
    strengths: [
      { en: "Elite aircraft such as King Raptors and Combat Chinooks.", ar: "طائرات نخبة مثل كينغ رابتور وشينوك القتالية." },
      { en: "Strikes anywhere on the map — punishes undefended economy.", ar: "يضرب أي مكان في الخريطة — يعاقب الاقتصاد غير المحمي." },
      { en: "Strong scouting and map control from the air.", ar: "استطلاع قوي وسيطرة على الخريطة من الجو." },
    ],
    weaknesses: [
      { en: "Weaker ground army than other USA generals — avoid head-on tank fights.", ar: "جيش بري أضعف من جنرالات أمريكا الآخرين — تجنّب المواجهات المباشرة بالدبابات." },
      { en: "Aircraft are expensive; massed anti-air can erase your investment.", ar: "الطائرات مكلفة؛ الدفاع الجوي المكثف قد يمحو استثمارك." },
      { en: "Needs high attention (APM) to use well.", ar: "يحتاج تركيزاً وسرعة تحكم عالية ليُستخدم جيداً." },
    ],
    opening: [
      { en: "Dozer builds Supply Center and Power Plant; train a second Dozer.", ar: "يبني الجرّار مركز الإمداد ومحطة الطاقة، ودرّب جرّاراً ثانياً." },
      { en: "Barracks for a couple of Rangers and Missile Defenders to hold the base.", ar: "الثكنات لبعض جنود الرينجر ومدافعي الصواريخ لحماية القاعدة." },
      { en: "Airfield as early as your economy allows.", ar: "المطار في أبكر وقت يسمح به اقتصادك." },
      { en: "Extra Chinooks for income; a Strategy Center when stable.", ar: "طائرات شينوك إضافية للدخل، ومركز الاستراتيجية عند الاستقرار." },
    ],
    plan: [
      { en: "Hunt Supply Trucks and Workers to starve the opponent.", ar: "اصطد شاحنات الإمداد والعمّال لتجويع الخصم." },
      { en: "Pick off anti-air first, then commit your air force.", ar: "دمّر الدفاع الجوي أولاً، ثم ادفع بسلاحك الجوي." },
      { en: "Keep a ground line just strong enough to buy time.", ar: "احتفظ بخط بري قوي بما يكفي لكسب الوقت فقط." },
    ],
    counters: [
      { en: "Gattling-heavy China: avoid the cannons, strike their economy elsewhere.", ar: "الصين المعتمدة على الغاتلينغ: تجنّب المدافع واضرب اقتصادهم في مكان آخر." },
      { en: "GLA Stinger Sites: scout them before every air attack.", ar: "مواقع ستينغر لجيش التحرير: استطلعها قبل كل هجوم جوي." },
      { en: "Fast tank rushes: build base defenses early, then out-tech.", ar: "هجمات الدبابات السريعة: ابنِ دفاعات مبكراً ثم تفوّق تقنياً." },
    ],
    tips: [
      { en: "Don't send aircraft one by one — strike together.", ar: "لا ترسل الطائرات واحدة تلو الأخرى — اضرب دفعة واحدة." },
      { en: "Retreat damaged aircraft to repair; they're too valuable to lose.", ar: "اسحب الطائرات المتضررة للإصلاح؛ إنها أثمن من أن تُخسر." },
      { en: "Use the minimap constantly to find undefended targets.", ar: "راقب الخريطة المصغّرة باستمرار لإيجاد أهداف غير محمية." },
    ],
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug) ?? null;
