"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Swords, CalendarRange, ArrowUpRight, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { loadSeasons, type Season } from "@/lib/seasons";
import { WRAP, SEASON_CSS, LiveBadge } from "@/components/seasons/shared";

// Arabic needs a native review.
const TEXT = {
  en: {
    eyebrow: "Hall of Fame", title: "Seasons", sub: "Every ranked season on Commander. Champions are crowned when an admin closes the season; the current one updates live with every match.",
    season: (n: number) => `Season ${n}`, live: "Live", now: "now", team: "Team champion", ffa: "FFA champion", leader: "Leading", matches: (n: number) => `${n} matches`,
    open: "Open season", none: "—", loading: "Replaying history…", error: "Seasons couldn't be loaded:",
  },
  ar: {
    eyebrow: "قاعة المشاهير", title: "المواسم", sub: "كل المواسم المصنّفة في كوماندر. يُتوَّج الأبطال عند إغلاق الموسم، والموسم الحالي يتحدّث مباشرة مع كل مباراة.",
    season: (n: number) => `الموسم ${n}`, live: "مباشر", now: "الآن", team: "بطل الفرق", ffa: "بطل FFA", leader: "المتصدّر", matches: (n: number) => `${n} مباراة`,
    open: "افتح الموسم", none: "—", loading: "جارٍ إعادة تشغيل التاريخ…", error: "تعذّر تحميل المواسم:",
  },
};

export default function SeasonsView() {
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];
  const [seasons, setSeasons] = useState<Season[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSeasons(createClient()).then((r) => {
      setSeasons([...r.seasons].reverse());
      setError(r.error);
    });
  }, []);

  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" }) : tx.now);

  return (
    <main className="min-h-screen w-full cz-grid-bg pb-24" style={{ color: C.paper }}>
      <style>{SEASON_CSS}</style>
      <header className="relative overflow-hidden border-b" style={{ borderColor: C.line }}>
        <div aria-hidden="true" className="pointer-events-none absolute end-[-12%] top-1/2 h-[640px] w-[640px] -translate-y-1/2 opacity-70">
          <div className="czse-rays absolute inset-0 rounded-full" style={{ background: "repeating-conic-gradient(from 0deg, rgba(232,166,61,0.08) 0deg 5deg, transparent 5deg 15deg)", maskImage: "radial-gradient(circle, black 15%, transparent 65%)", WebkitMaskImage: "radial-gradient(circle, black 15%, transparent 65%)" }} />
        </div>
        <div className={`${WRAP} relative pb-12 pt-14 md:pt-20`}>
          <div className="czse-in flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}><Trophy size={14} aria-hidden="true" />{tx.eyebrow}</div>
          <h1 className="czse-in cz-display mt-3 text-6xl uppercase leading-none md:text-8xl" style={{ fontWeight: 700, color: C.amber, animationDelay: "0.06s" }}>{tx.title}</h1>
          <p className="czse-in mt-4 max-w-2xl text-base leading-relaxed" style={{ color: C.muted, animationDelay: "0.12s" }}>{tx.sub}</p>
        </div>
      </header>

      <div className={`${WRAP} mt-10`}>
        {error && (
          <p className="mb-6 flex items-start gap-2 border px-4 py-3 text-sm" style={{ borderColor: "rgba(248,113,113,0.5)", color: "#F87171" }}>
            <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {tx.error} {error}
          </p>
        )}
        {!seasons ? (
          <p className="text-sm" style={{ color: C.muted }}>{tx.loading}</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {seasons.map((s, i) => (
              <Link key={s.n} href={`/seasons/${s.n}`} className="czse-in czse-card group flex flex-col border p-6" style={{ background: s.live ? "linear-gradient(150deg, rgba(220,38,38,0.08), #12150E 50%)" : "linear-gradient(150deg, rgba(232,166,61,0.10), #12150E 55%)", borderColor: s.live ? "rgba(220,38,38,0.45)" : C.line, animationDelay: `${i * 0.07}s` }}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="cz-display text-4xl uppercase" style={{ fontWeight: 700 }}>{tx.season(s.n)}</h2>
                  {s.live && <LiveBadge label={tx.live} />}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm" style={{ color: C.muted }}>
                  <span className="inline-flex items-center gap-1.5"><CalendarRange size={14} aria-hidden="true" />{fmt(s.start)} → {fmt(s.end)}</span>
                  <span className="inline-flex items-center gap-1.5"><Swords size={14} aria-hidden="true" />{tx.matches(s.matches)}</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-px border" style={{ background: C.line, borderColor: C.line }}>
                  {[{ label: tx.team, row: s.team[0] }, { label: tx.ffa, row: s.ffa[0] }].map((c) => (
                    <div key={c.label} className="p-4" style={{ background: C.panel }}>
                      <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: s.live ? "#F87171" : C.amber }}>{s.live ? `${tx.leader} · ${c.label.split(" ")[0]}` : c.label}</div>
                      <div className="cz-display mt-1 truncate text-2xl uppercase" style={{ fontWeight: 700 }}>{c.row?.username ?? tx.none}</div>
                      {c.row && <div className="text-sm tabular-nums" style={{ color: C.muted }}>{c.row.rating} · {c.row.wins}W {c.row.losses}L</div>}
                    </div>
                  ))}
                </div>
                <span className="mt-5 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest" style={{ color: C.amber, fontWeight: 600 }}>
                  {tx.open} <ArrowUpRight size={14} className="rtl:-scale-x-100 transition-transform group-hover:-translate-y-0.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
