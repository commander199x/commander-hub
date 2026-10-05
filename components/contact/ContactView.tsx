"use client";

import { useState } from "react";
import Link from "next/link";
import { Radio, ArrowUpRight, HelpCircle, Bug, Gavel, Trophy, MessageSquare, Copy, Check, ChevronDown, Clock, LifeBuoy } from "lucide-react";
import { C, DISCORD_URL, SUPPORT_DISCORD_URL } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const WRAP = "mx-auto max-w-[1312px] px-6 md:px-16";

// Arabic needs a native review.
const TEXT = {
  en: {
    eyebrow: "Field Comms",
    title: "Contact us",
    lead: "Questions, bug reports, ban appeals, tournament ideas, or anything else — the fastest way to reach the Commander team is on Discord. Admins and mods are active there and usually respond quickly.",
    join: "Join our Discord",
    support: "Support server",
    response: "Admins usually reply quickly",
    topics: "What do you need?",
    cards: [
      ["Questions", "Anything about the site, the clan or how ranked works.", "#general"],
      ["Bug reports", "Something broken on the site? Tell us what you clicked and what happened.", "#support"],
      ["Ban appeals", "Explain your case calmly. An admin will review it.", "#support"],
      ["Tournament ideas", "Formats, maps, prize ideas — we love hearing them.", "#general"],
    ],
    channel: "Channel",
    copy: "Copy channel name",
    copied: "Copied",
    faq: "Frequently asked",
    faqs: [
      ["How do I get on the leaderboard?", "Play matches that an admin logs on the site. After 3 matches in a ladder (Team or FFA) you hold an official rank."],
      ["A match result is wrong. What do I do?", "On the leaderboard, open Recent matches and press the flag on that match to report it. An admin will review it."],
      ["How do I join the clan?", "Fill in the application on the Join page. Admins review it and give you your team role on Discord."],
      ["How do I install a custom map?", "The Downloads page has a step-by-step guide, including the exact folder path to paste."],
    ],
    links: ["/leaderboard", "/leaderboard", "/join", "/downloads"],
    open: "Open",
    afterJoin: "Once you're in, check the #support or #general channel and someone will help you out.",
  },
  ar: {
    eyebrow: "قناة الاتصال",
    title: "تواصل معنا",
    lead: "أسئلة، أو بلاغات أخطاء، أو طعون في الحظر، أو أفكار بطولات، أو أي شيء آخر: أسرع طريقة للوصول إلى فريق كوماندر هي ديسكورد. المشرفون نشطون هناك ويردّون عادةً بسرعة.",
    join: "انضم إلى ديسكورد",
    support: "سيرفر الدعم",
    response: "يردّ المشرفون عادةً بسرعة",
    topics: "ماذا تحتاج؟",
    cards: [
      ["أسئلة", "أي شيء عن الموقع أو الكلان أو طريقة عمل التصنيف.", "#general"],
      ["بلاغات الأخطاء", "شيء لا يعمل في الموقع؟ أخبرنا ماذا ضغطت وماذا حدث.", "#support"],
      ["طعون الحظر", "اشرح موقفك بهدوء وسيراجعه أحد المشرفين.", "#support"],
      ["أفكار البطولات", "أنظمة وخرائط وجوائز، نحب سماع أفكارك.", "#general"],
    ],
    channel: "القناة",
    copy: "نسخ اسم القناة",
    copied: "تم النسخ",
    faq: "أسئلة شائعة",
    faqs: [
      ["كيف أظهر في لوحة الصدارة؟", "العب مباريات يسجّلها أحد المشرفين في الموقع. بعد 3 مباريات في تصنيف (الفرق أو FFA) تحصل على ترتيب رسمي."],
      ["نتيجة مباراة خاطئة، ماذا أفعل؟", "في لوحة الصدارة افتح آخر المباريات واضغط على العلم بجانب المباراة للإبلاغ عنها، وسيراجعها أحد المشرفين."],
      ["كيف أنضم إلى الكلان؟", "املأ طلب الانضمام في صفحة الانضمام، وسيراجعه المشرفون ويمنحونك رتبة الفريق في ديسكورد."],
      ["كيف أثبّت خريطة مخصّصة؟", "في صفحة التحميلات دليل خطوة بخطوة، مع مسار المجلد الدقيق للصقه."],
    ],
    links: ["/leaderboard", "/leaderboard", "/join", "/downloads"],
    open: "افتح",
    afterJoin: "بعد دخولك، تفقّد قناة ‎#support أو ‎#general وسيساعدك أحدهم.",
  },
};

const CARD_ICONS = [HelpCircle, Bug, Gavel, Trophy];

const CSS = `
@keyframes czc2-in { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes czc2-wave { 0% { transform: scale(0.6); opacity: 0.7; } 100% { transform: scale(2.4); opacity: 0; } }
@keyframes czc2-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
.czc2-in { animation: czc2-in 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czc2-wave { animation: czc2-wave 2.4s ease-out infinite; }
.czc2-pop { animation: czc2-pop 0.3s ease-out both; }
.czc2-card { transition: transform 0.3s ease, border-color 0.3s ease; }
.czc2-card:hover { transform: translateY(-5px); border-color: #8A6425 !important; }
.czc2-card:hover .czc2-icon { transform: scale(1.12) rotate(-6deg); }
.czc2-icon { transition: transform 0.3s ease; }
@media (prefers-reduced-motion: reduce) {
  .czc2-in, .czc2-wave, .czc2-pop { animation: none !important; }
  .czc2-card, .czc2-icon { transition: none !important; }
  .czc2-card:hover, .czc2-card:hover .czc2-icon { transform: none !important; }
}
`;

export default function ContactView() {
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];
  const [copied, setCopied] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  async function copy(text: string, i: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1800);
    } catch {
      /* clipboard not available */
    }
  }

  return (
    <main className="min-h-screen w-full cz-grid-bg pb-24" style={{ color: C.paper }}>
      <style>{CSS}</style>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b" style={{ borderColor: C.line }}>
        <div className={`${WRAP} relative grid gap-10 pb-14 pt-14 md:pt-20 lg:grid-cols-[1.3fr_1fr] lg:items-center`}>
          <div>
            <div className="czc2-in flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>
              <Radio size={14} className="cz-live" aria-hidden="true" />
              {tx.eyebrow}
            </div>
            <h1 className="czc2-in cz-display mt-3 uppercase leading-[0.9]" style={{ fontSize: "clamp(3rem, 8vw, 6rem)", fontWeight: 700, animationDelay: "0.08s" }}>
              {tx.title}
            </h1>
            <p className="czc2-in mt-5 max-w-xl text-base leading-relaxed md:text-lg" style={{ color: C.muted, animationDelay: "0.16s" }}>{tx.lead}</p>
            <div className="czc2-in mt-8 flex flex-wrap gap-3" style={{ animationDelay: "0.24s" }}>
              <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[52px] items-center gap-2 px-7 text-sm uppercase tracking-[0.12em]" style={{ background: C.amber, color: C.void, fontWeight: 700, boxShadow: "0 0 30px rgba(232,166,61,0.3)" }}>
                <MessageSquare size={16} aria-hidden="true" />
                {tx.join}
                <ArrowUpRight size={15} className="rtl:-scale-x-100" aria-hidden="true" />
              </a>
              <a href={SUPPORT_DISCORD_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[52px] items-center gap-2 border px-6 text-sm uppercase tracking-[0.12em] transition-colors hover:bg-[#171B10]" style={{ borderColor: C.amberDim, color: C.paper, fontWeight: 600 }}>
                <LifeBuoy size={16} aria-hidden="true" />
                {tx.support}
              </a>
            </div>
          </div>

          {/* signal beacon */}
          <div className="relative mx-auto hidden h-64 w-64 items-center justify-center lg:flex" aria-hidden="true">
            {[0, 0.8, 1.6].map((d) => (
              <span key={d} className="czc2-wave absolute h-28 w-28 rounded-full" style={{ border: `2px solid ${C.amber}`, animationDelay: `${d}s` }} />
            ))}
            <span className="relative flex h-28 w-28 items-center justify-center rounded-full" style={{ background: "radial-gradient(circle, rgba(232,166,61,0.25), rgba(232,166,61,0.05))", border: `1px solid ${C.amberDim}` }}>
              <MessageSquare size={44} style={{ color: C.amber }} />
            </span>
            <span className="absolute bottom-2 inline-flex items-center gap-2 border px-3 py-1.5 text-[11px] uppercase tracking-widest" style={{ borderColor: C.line, background: C.panel, color: C.radar }}>
              <Clock size={12} />
              {tx.response}
            </span>
          </div>
        </div>
      </section>

      <div className={WRAP}>
        {/* ================= TOPICS ================= */}
        <section className="mt-14">
          <h2 className="cz-display text-3xl uppercase md:text-4xl" style={{ fontWeight: 600 }}>{tx.topics}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {tx.cards.map(([title, desc, channel], i) => {
              const Icon = CARD_ICONS[i];
              return (
                <div key={title} className="czc2-card czc2-in flex flex-col border p-5" style={{ background: C.panel, borderColor: C.line, animationDelay: `${i * 0.08}s` }}>
                  <span className="czc2-icon inline-flex h-11 w-11 items-center justify-center" style={{ border: `1px solid ${C.amberDim}`, color: C.amber }}>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <h3 className="cz-display mt-4 text-xl uppercase" style={{ fontWeight: 600 }}>{title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: C.muted }}>{desc}</p>
                  <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3" style={{ borderColor: C.line }}>
                    <span className="text-xs" style={{ color: C.muted }}>
                      {tx.channel}: <code dir="ltr" style={{ color: C.radar }}>{channel}</code>
                    </span>
                    <button
                      onClick={() => copy(channel, i)}
                      aria-label={tx.copy}
                      title={tx.copy}
                      className="inline-flex h-9 w-9 items-center justify-center transition-colors hover:bg-[#171B10]"
                      style={{ color: copied === i ? C.radar : C.amber }}
                    >
                      {copied === i ? <Check size={15} className="czc2-pop" aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-sm" style={{ color: C.muted }}>{tx.afterJoin}</p>
        </section>

        {/* ================= FAQ ================= */}
        <section className="mt-16 max-w-4xl">
          <h2 className="cz-display text-3xl uppercase md:text-4xl" style={{ fontWeight: 600 }}>{tx.faq}</h2>
          <div className="mt-6 flex flex-col gap-px border" style={{ background: C.line, borderColor: C.line }}>
            {tx.faqs.map(([q, a], i) => {
              const open = openFaq === i;
              return (
                <div key={q} style={{ background: open ? "#171B10" : C.panel }} className="transition-colors">
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="flex min-h-[60px] w-full items-center gap-4 px-5 text-start"
                  >
                    <span className="cz-display text-lg tabular-nums" style={{ color: open ? C.amber : C.lineStrong, fontWeight: 700 }}>0{i + 1}</span>
                    <span className="flex-1 text-base" style={{ fontWeight: 600 }}>{q}</span>
                    <ChevronDown size={18} className="shrink-0 transition-transform duration-300" style={{ transform: open ? "rotate(180deg)" : "none", color: open ? C.amber : C.muted }} aria-hidden="true" />
                  </button>
                  <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
                    <div className="overflow-hidden">
                      <div className="flex flex-col gap-3 px-5 pb-5 sm:flex-row sm:items-end sm:justify-between" style={{ paddingInlineStart: 64 }}>
                        <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{a}</p>
                        <Link href={tx.links[i]} className="inline-flex shrink-0 items-center gap-1.5 text-xs uppercase tracking-widest" style={{ color: C.amber, fontWeight: 600 }}>
                          {tx.open}
                          <ArrowUpRight size={13} className="rtl:-scale-x-100" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
