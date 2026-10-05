"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ArrowUpRight, PenLine } from "lucide-react";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { GUIDES } from "@/lib/guides";
import { GENERALS, FACTIONS, type Faction } from "@/lib/generals";
import StatsShell, { WRAP } from "@/components/stats/StatsShell";

const TEXT = {
  en: {
    title: "Strategy guides", sub: "Build orders, counters and tips for every Zero Hour general — written by the Commander community, in English and Arabic.",
    all: "All", read: "Read guide", soon: "Guide wanted", soonText: "Know this general well? Help write the guide.", write: "Write it",
    levels: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" },
  },
  ar: {
    title: "الأدلة الاستراتيجية", sub: "ترتيب البناء والمواجهات والنصائح لكل جنرال في الساعة الصفر — من مجتمع كوماندر، بالعربية والإنجليزية.",
    all: "الكل", read: "اقرأ الدليل", soon: "دليل مطلوب", soonText: "تعرف هذا الجنرال جيداً؟ ساعدنا في كتابة الدليل.", write: "اكتبه",
    levels: { beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم" },
  },
};

export default function GuidesIndex() {
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];
  const [faction, setFaction] = useState<"all" | Faction>("all");
  const generals = GENERALS.filter((g) => faction === "all" || g.faction === faction);

  return (
    <StatsShell title={tx.title} sub={tx.sub} icon={BookOpen}>
      <div className={`${WRAP} mt-8`}>
        <div className="flex flex-wrap gap-2" role="group">
          {(["all", "usa", "china", "gla"] as const).map((f) => {
            const on = faction === f;
            const color = f === "all" ? C.amber : FACTIONS[f].color;
            return (
              <button key={f} aria-pressed={on} onClick={() => setFaction(f)} className="inline-flex min-h-[44px] items-center border px-4 text-xs uppercase tracking-widest transition-colors" style={{ background: on ? color : "transparent", color: on ? C.void : C.paper, borderColor: on ? color : C.amberDim, fontWeight: on ? 700 : 500 }}>
                {f === "all" ? tx.all : FACTIONS[f][lang]}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {generals.map((g, i) => {
            const guide = GUIDES.find((x) => x.general === g.key);
            const color = FACTIONS[g.faction].color;
            const inner = (
              <>
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em]">
                  <span style={{ color, fontWeight: 700 }}>{FACTIONS[g.faction][lang]}</span>
                  {guide ? <span style={{ color: C.muted }}>{tx.levels[guide.difficulty]}</span> : <span style={{ color: C.lineStrong }}>{tx.soon}</span>}
                </div>
                <h2 className="cz-display mt-3 text-3xl uppercase leading-tight" style={{ fontWeight: 700, color: guide ? C.paper : C.muted }}>{g[lang]}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: C.muted }}>{guide ? guide.title[lang] : tx.soonText}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 border-t pt-3 text-xs uppercase tracking-widest" style={{ borderColor: C.line, color: guide ? C.amber : C.muted, fontWeight: 600 }}>
                  {guide ? tx.read : <><PenLine size={13} aria-hidden="true" /> {tx.write}</>}
                  <ArrowUpRight size={14} className="rtl:-scale-x-100" aria-hidden="true" />
                </span>
              </>
            );
            const cls = "czst-in czst-card flex h-full flex-col border p-5";
            const style = { background: guide ? `linear-gradient(160deg, ${color}1a, #12150E 55%)` : C.panel, borderColor: C.line, borderTop: `3px solid ${guide ? color : C.line}`, animationDelay: `${Math.min(i, 11) * 0.04}s` };
            return guide ? (
              <Link key={g.key} href={`/guides/${guide.slug}`} className={cls} style={style}>{inner}</Link>
            ) : (
              <Link key={g.key} href="/contact" className={`${cls} opacity-70`} style={style}>{inner}</Link>
            );
          })}
        </div>
      </div>
    </StatsShell>
  );
}
