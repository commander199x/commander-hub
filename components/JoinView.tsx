"use client";

import { useState } from "react";
import { Radio, Users, ArrowUpRight, Trophy, Swords, MessageSquare, ClipboardList, ShieldCheck, BadgeCheck } from "lucide-react";
import { C, DISCORD_URL, JOIN_FORM_URL, JOIN_FORM_EMBED_URL } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const WRAP = "mx-auto max-w-[1312px] px-6 md:px-16";

// New text for this layout. Arabic needs a native review.
const TEXT = {
  en: {
    why: "Why join Commander",
    perks: [
      { t: "Ranked ladder", d: "Every match counts. Climb the Team and FFA ladders and earn medals on your profile." },
      { t: "Tournaments", d: "Clan cups and community wars with brackets, champions and prize pools." },
      { t: "A real squad", d: "Find teammates, study replays and play every week with people who take the game seriously." },
    ],
    how: "How it works",
    steps: [
      { t: "Apply", d: "Fill in the form below. It takes about two minutes." },
      { t: "Review", d: "Our admins check your application, usually within a few days." },
      { t: "Deploy", d: "You get your team role on Discord and start playing ranked." },
    ],
    discord: "Join our Discord",
  },
  ar: {
    why: "لماذا تنضم إلى كوماندر",
    perks: [
      { t: "تصنيف تنافسي", d: "كل مباراة لها وزن. تسلّق تصنيفي الفرق وFFA واجمع الأوسمة في ملفك." },
      { t: "بطولات", d: "كؤوس الكلان وحروب المجتمع مع جداول وأبطال وجوائز." },
      { t: "فريق حقيقي", d: "اعثر على زملاء وادرس الإعادات والعب كل أسبوع مع لاعبين جادّين." },
    ],
    how: "كيف يعمل الأمر",
    steps: [
      { t: "قدّم طلبك", d: "املأ النموذج أدناه، يستغرق نحو دقيقتين." },
      { t: "المراجعة", d: "يراجع المشرفون طلبك، عادةً خلال أيام قليلة." },
      { t: "الانطلاق", d: "تحصل على رتبة الفريق في ديسكورد وتبدأ اللعب التنافسي." },
    ],
    discord: "انضم إلى ديسكورد",
  },
};

const CSS = `
@keyframes czj-in { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes czj-shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
@keyframes czj-line { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes czj-sweep { to { transform: rotate(360deg); } }
.czj-in { animation: czj-in 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czj-card { transition: transform 0.3s ease, border-color 0.3s ease; }
.czj-card:hover { transform: translateY(-5px); border-color: #8A6425 !important; }
.czj-card:hover .czj-icon { transform: scale(1.12) rotate(-6deg); color: #EDEAE0; }
.czj-icon { transition: transform 0.3s ease, color 0.3s ease; }
.czj-shimmer { background: linear-gradient(90deg, #12150E 0%, #1d2215 50%, #12150E 100%); background-size: 200% 100%; animation: czj-shimmer 1.4s linear infinite; }
.czj-line { transform-origin: left; animation: czj-line 1s cubic-bezier(0.2, 0.7, 0.2, 1) 0.4s both; }
[dir="rtl"] .czj-line { transform-origin: right; }
.czj-sweep { animation: czj-sweep 3s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .czj-in, .czj-shimmer, .czj-line, .czj-sweep { animation: none !important; }
  .czj-card, .czj-icon { transition: none !important; }
  .czj-card:hover, .czj-card:hover .czj-icon { transform: none !important; }
}
`;

export default function JoinView() {
  const { t, locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];
  const [formReady, setFormReady] = useState(false);
  const perkIcons = [Trophy, Swords, Users];
  const stepIcons = [ClipboardList, ShieldCheck, BadgeCheck];

  return (
    <main className="min-h-screen w-full cz-grid-bg pb-24" style={{ color: C.paper }}>
      <style>{CSS}</style>

      <header className="border-b" style={{ borderColor: C.line }}>
        <div className={`${WRAP} pb-12 pt-14 md:pt-20`}>
          <div className="czj-in flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>
            <Radio size={14} className="cz-live" aria-hidden="true" />
            <span>{t("common.fieldComms")}</span>
          </div>
          <h1 className="czj-in cz-display mt-3 uppercase leading-[0.92]" style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", fontWeight: 700, animationDelay: "0.08s" }}>
            {t("join.titleLine1")} <span style={{ color: C.amber }}>{t("join.titleLine2")}</span>
          </h1>
          <p className="czj-in mt-5 max-w-xl text-base leading-relaxed" style={{ color: C.muted, animationDelay: "0.16s" }}>
            {t("join.desc")}
          </p>
          <div className="czj-in mt-8 flex flex-wrap gap-3" style={{ animationDelay: "0.24s" }}>
            <a href="#apply" className="inline-flex min-h-[52px] items-center gap-2 px-7 text-sm uppercase tracking-[0.12em]" style={{ background: C.amber, color: C.void, fontWeight: 700, boxShadow: "0 0 30px rgba(232,166,61,0.3)" }}>
              <ClipboardList size={16} aria-hidden="true" />
              {t("join.registrationForm")}
            </a>
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[52px] items-center gap-2 border px-6 text-sm uppercase tracking-[0.12em] transition-colors hover:bg-[#171B10]" style={{ borderColor: C.amberDim, color: C.paper, fontWeight: 600 }}>
              <MessageSquare size={16} aria-hidden="true" />
              {tx.discord}
              <ArrowUpRight size={14} className="rtl:-scale-x-100" aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>

      <div className={WRAP}>
        {/* Why join */}
        <section className="mt-14">
          <h2 className="cz-display text-3xl uppercase md:text-4xl" style={{ fontWeight: 600 }}>{tx.why}</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {tx.perks.map((p, i) => {
              const Icon = perkIcons[i];
              return (
                <div key={p.t} className="czj-card czj-in border p-6" style={{ background: C.panel, borderColor: C.line, animationDelay: `${i * 0.1}s` }}>
                  <span className="czj-icon inline-flex h-12 w-12 items-center justify-center" style={{ border: `1px solid ${C.amberDim}`, color: C.amber }}>
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <h3 className="cz-display mt-5 text-2xl uppercase" style={{ fontWeight: 600 }}>{p.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: C.muted }}>{p.d}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="mt-16">
          <h2 className="cz-display text-3xl uppercase md:text-4xl" style={{ fontWeight: 600 }}>{tx.how}</h2>
          <ol className="relative mt-8 grid gap-8 md:grid-cols-3">
            <span aria-hidden="true" className="czj-line absolute top-6 hidden h-px md:block" style={{ insetInlineStart: "8%", insetInlineEnd: "8%", background: `linear-gradient(90deg, ${C.amberDim}, ${C.amber}, ${C.amberDim})` }} />
            {tx.steps.map((s, i) => {
              const Icon = stepIcons[i];
              return (
                <li key={s.t} className="czj-in relative flex flex-col items-center text-center" style={{ animationDelay: `${0.2 + i * 0.15}s` }}>
                  <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: C.void, border: `2px solid ${C.amber}`, color: C.amber, boxShadow: "0 0 20px rgba(232,166,61,0.3)" }}>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="mt-3 text-[11px] uppercase tracking-[0.22em]" style={{ color: C.radar }}>0{i + 1}</span>
                  <h3 className="cz-display mt-1 text-2xl uppercase" style={{ fontWeight: 600 }}>{s.t}</h3>
                  <p className="mt-1 max-w-xs text-sm" style={{ color: C.muted }}>{s.d}</p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Form */}
        <section id="apply" className="mt-16 scroll-mt-24">
          <h2 className="cz-display flex items-center gap-2.5 text-3xl uppercase md:text-4xl" style={{ fontWeight: 600 }}>
            <Users size={22} style={{ color: C.amber }} aria-hidden="true" />
            {t("join.registrationForm")}
          </h2>

          <div className="relative mt-6 border" style={{ borderColor: C.line, background: C.panel }}>
            {!formReady && (
              <div className="absolute inset-0 z-10 flex flex-col gap-4 p-6" aria-live="polite">
                <div className="flex items-center gap-3 text-sm" style={{ color: C.muted }}>
                  <span className="relative inline-block h-5 w-5 overflow-hidden rounded-full" style={{ border: `1px solid ${C.radar}` }} aria-hidden="true">
                    <span className="czj-sweep absolute inset-0" style={{ background: "conic-gradient(from 0deg, rgba(143,191,79,0) 0deg, rgba(143,191,79,0) 270deg, rgba(143,191,79,0.85) 360deg)" }} />
                  </span>
                  {t("join.loadingForm")}
                </div>
                {[70, 100, 55, 100, 40, 100].map((w, i) => (
                  <span key={i} className="czj-shimmer block" style={{ height: i % 2 ? 44 : 14, width: `${w}%` }} />
                ))}
              </div>
            )}
            <iframe
              src={JOIN_FORM_EMBED_URL}
              width="100%"
              height="900"
              onLoad={() => setFormReady(true)}
              style={{ border: "none", display: "block", opacity: formReady ? 1 : 0, transition: "opacity 0.5s ease" }}
              title="Commander team registration form"
            >
              {t("join.loadingForm")}
            </iframe>
          </div>

          <p className="mt-4 text-sm" style={{ color: C.muted }}>
            {t("join.formNotLoading")}{" "}
            <a href={JOIN_FORM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline-offset-2 hover:underline" style={{ color: C.amber }}>
              {t("join.openInNewTab")}
              <ArrowUpRight size={13} className="rtl:-scale-x-100" aria-hidden="true" />
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
