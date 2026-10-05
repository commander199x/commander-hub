"use client";

import Link from "next/link";
import { BookOpen, ThumbsUp, ThumbsDown, ListOrdered, Target, Shield, Lightbulb, ArrowLeft, BarChart3, AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { guideBySlug } from "@/lib/guides";
import { GENERAL_BY_KEY, FACTIONS } from "@/lib/generals";
import StatsShell, { WRAP } from "@/components/stats/StatsShell";

const TEXT = {
  en: {
    strengths: "Strengths", weaknesses: "Weaknesses", opening: "Opening build order", plan: "Game plan", counters: "Matchups & counters", tips: "Pro tips",
    draft: "Community draft — written to get you started. Spotted something wrong? Tell us on Discord and we'll fix it.", updated: "Updated", back: "All guides", meta: "See how this general performs",
    levels: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" },
  },
  ar: {
    strengths: "نقاط القوة", weaknesses: "نقاط الضعف", opening: "ترتيب البناء الافتتاحي", plan: "خطة اللعب", counters: "المواجهات والردود", tips: "نصائح المحترفين",
    draft: "مسودة من المجتمع — كُتبت لتبدأ بها. وجدت خطأ؟ أخبرنا على ديسكورد وسنصلحه.", updated: "آخر تحديث", back: "كل الأدلة", meta: "شاهد أداء هذا الجنرال",
    levels: { beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم" },
  },
};

function Block({ icon: Icon, title, color, children, delay = 0 }: { icon: typeof BookOpen; title: string; color: string; children: ReactNode; delay?: number }) {
  return (
    <section className="czst-in border p-5 md:p-6" style={{ background: C.panel, borderColor: C.line, animationDelay: `${delay}s` }}>
      <h2 className="cz-display mb-4 flex items-center gap-2.5 text-2xl uppercase" style={{ fontWeight: 700 }}>
        <Icon size={18} style={{ color }} aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function GuideView({ slug }: { slug: string }) {
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];
  const g = guideBySlug(slug)!;
  const gen = GENERAL_BY_KEY[g.general];
  const color = FACTIONS[gen.faction].color;
  const list = (items: { en: string; ar: string }[], c: string) => (
    <ul className="flex flex-col gap-2.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45" style={{ background: c }} aria-hidden="true" />
          {it[lang]}
        </li>
      ))}
    </ul>
  );

  return (
    <StatsShell title={gen[lang]} sub={g.summary[lang]} icon={BookOpen}>
      <div className={`${WRAP} mt-8`}>
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest">
          <Link href="/guides" className="inline-flex min-h-[40px] items-center gap-1.5 border px-3 transition-colors hover:bg-[#171B10]" style={{ borderColor: C.lineStrong, color: C.paper }}>
            <ArrowLeft size={14} className="rtl:-scale-x-100" aria-hidden="true" /> {tx.back}
          </Link>
          <span className="border px-3 py-2" style={{ borderColor: `${color}88`, color, fontWeight: 700 }}>{FACTIONS[gen.faction][lang]}</span>
          <span className="border px-3 py-2" style={{ borderColor: C.lineStrong, color: C.paper }}>{tx.levels[g.difficulty]}</span>
          <span style={{ color: C.muted }}>{tx.updated} {g.updated}</span>
        </div>

        <h2 className="cz-display mt-6 text-3xl uppercase md:text-4xl" style={{ fontWeight: 700, color }}>{g.title[lang]}</h2>

        <p className="mt-4 flex items-start gap-2 border px-4 py-3 text-sm" style={{ borderColor: C.amberDim, background: "rgba(232,166,61,0.06)", color: C.muted }}>
          <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: C.amber }} aria-hidden="true" />
          {tx.draft}
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Block icon={ThumbsUp} title={tx.strengths} color={C.radar}>{list(g.strengths, C.radar)}</Block>
          <Block icon={ThumbsDown} title={tx.weaknesses} color="#F87171" delay={0.05}>{list(g.weaknesses, "#F87171")}</Block>
        </div>

        <div className="mt-6">
          <Block icon={ListOrdered} title={tx.opening} color={C.amber} delay={0.1}>
            <ol className="relative flex flex-col gap-4" style={{ paddingInlineStart: 44 }}>
              <span aria-hidden="true" className="absolute top-2 bottom-2 w-px" style={{ insetInlineStart: 15, background: `linear-gradient(180deg, ${C.amber}, ${C.line})` }} />
              {g.opening.map((st, i) => (
                <li key={i} className="czst-in relative text-[15px] leading-relaxed" style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
                  <span className="cz-display absolute flex h-8 w-8 items-center justify-center text-lg" style={{ insetInlineStart: -44, top: -2, background: C.void, border: `2px solid ${C.amber}`, color: C.amber, fontWeight: 700 }}>{i + 1}</span>
                  {st[lang]}
                </li>
              ))}
            </ol>
          </Block>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Block icon={Target} title={tx.plan} color={C.amber} delay={0.15}>{list(g.plan, C.amber)}</Block>
          <Block icon={Shield} title={tx.counters} color={color} delay={0.2}>{list(g.counters, color)}</Block>
          <Block icon={Lightbulb} title={tx.tips} color={C.radar} delay={0.25}>{list(g.tips, C.radar)}</Block>
        </div>

        <Link href="/stats/generals" className="czst-in czst-card mt-8 flex items-center gap-3 border p-5" style={{ background: C.panel, borderColor: C.amberDim }}>
          <BarChart3 size={22} style={{ color: C.amber }} aria-hidden="true" />
          <span className="cz-display text-xl uppercase" style={{ fontWeight: 700 }}>{tx.meta}</span>
        </Link>
      </div>
    </StatsShell>
  );
}
