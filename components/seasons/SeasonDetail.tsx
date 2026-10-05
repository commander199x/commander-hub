"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Swords, Activity, Flame, ArrowLeft, ArrowRight, CalendarRange, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { loadSeasons, type Season } from "@/lib/seasons";
import { WRAP, SEASON_CSS, LiveBadge, Podium, PODIUM } from "@/components/seasons/shared";

const TEXT = {
  en: {
    season: (n: number) => `Season ${n}`, final: "Final results", live: "Live standings", liveNote: "This season is still running — standings update with every match.",
    team: "Team", ffa: "FFA", mostActive: "Most active", streak: "Longest win streak", total: "Total matches", inARow: (n: number, m: string) => `${n} wins in a row (${m})`,
    matches: (n: number) => `${n} matches`, standings: "Top 10", none: "No qualifying players yet.", all: "All seasons", prev: "Previous", next: "Next",
    notFound: "This season doesn't exist yet.", loading: "Replaying the season…", now: "now",
  },
  ar: {
    season: (n: number) => `الموسم ${n}`, final: "النتائج النهائية", live: "الترتيب المباشر", liveNote: "هذا الموسم ما زال جارياً — يتحدّث الترتيب مع كل مباراة.",
    team: "الفرق", ffa: "FFA", mostActive: "الأكثر نشاطاً", streak: "أطول سلسلة انتصارات", total: "مجموع المباريات", inARow: (n: number, m: string) => `${n} انتصارات متتالية (${m})`,
    matches: (n: number) => `${n} مباراة`, standings: "أفضل 10", none: "لا يوجد لاعبون مؤهَّلون بعد.", all: "كل المواسم", prev: "السابق", next: "التالي",
    notFound: "هذا الموسم غير موجود بعد.", loading: "جارٍ إعادة تشغيل الموسم…", now: "الآن",
  },
};

export default function SeasonDetail({ n }: { n: number }) {
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];
  const [all, setAll] = useState<Season[] | null>(null);
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const db = createClient();
    let cancelled = false;
    loadSeasons(db).then(async (r) => {
      if (cancelled) return;
      setAll(r.seasons);
      const s = r.seasons.find((x) => x.n === n);
      const names = s ? Array.from(new Set([...s.team.slice(0, 10), ...s.ffa.slice(0, 10)].map((x) => x.username))) : [];
      if (names.length) {
        const { data } = await db.from("profiles").select("username, avatar_url").in("username", names);
        const map: Record<string, string | null> = {};
        for (const p of (data ?? []) as { username: string; avatar_url: string | null }[]) map[p.username] = p.avatar_url;
        if (!cancelled) setAvatars(map);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [n]);

  const s = all?.find((x) => x.n === n) ?? null;
  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "long", day: "numeric", year: "numeric" }) : tx.now);

  return (
    <main className="min-h-screen w-full pb-24" style={{ background: C.void, color: C.paper }}>
      <style>{SEASON_CSS}</style>
      <section className="relative overflow-hidden border-b text-center" style={{ borderColor: C.line }}>
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 opacity-70">
          <div className="czse-rays absolute inset-0 rounded-full" style={{ background: "repeating-conic-gradient(from 0deg, rgba(232,166,61,0.08) 0deg 5deg, transparent 5deg 15deg)", maskImage: "radial-gradient(circle, black 15%, transparent 62%)", WebkitMaskImage: "radial-gradient(circle, black 15%, transparent 62%)" }} />
        </div>
        <div className={`${WRAP} relative pb-12 pt-14 md:pt-20`}>
          <div className="czse-in inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em]" style={{ color: C.radar }}><Sparkles size={14} aria-hidden="true" />{s?.live ? tx.live : tx.final}</div>
          <h1 className="czse-in cz-display mt-3 uppercase leading-[0.85]" style={{ fontSize: "clamp(3.5rem, 11vw, 8.5rem)", fontWeight: 700, color: C.amber, textShadow: "0 0 40px rgba(232,166,61,0.25)", animationDelay: "0.08s" }}>{tx.season(n)}</h1>
          {s && (
            <div className="czse-in mt-5 flex flex-wrap items-center justify-center gap-3 text-sm" style={{ color: C.muted, animationDelay: "0.16s" }}>
              {s.live && <LiveBadge label={tx.live} />}
              <span className="inline-flex items-center gap-1.5 border px-3 py-1.5" style={{ borderColor: C.line }}><CalendarRange size={14} aria-hidden="true" />{fmt(s.start)} → {fmt(s.end)}</span>
            </div>
          )}
          {s?.live && <p className="mt-3 text-sm" style={{ color: C.muted }}>{tx.liveNote}</p>}
        </div>
      </section>

      <div className={`${WRAP} mt-8`}>
        {!all ? (
          <p className="text-sm" style={{ color: C.muted }}>{tx.loading}</p>
        ) : !s ? (
          <p className="border px-4 py-10 text-center text-sm" style={{ borderColor: C.line, background: C.panel, color: C.muted }}>{tx.notFound}</p>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              {[{ label: tx.team, rows: s.team, icon: Trophy }, { label: tx.ffa, rows: s.ffa, icon: Swords }].map((col, ci) => (
                <section key={col.label} className="czse-in border p-6" style={{ background: C.panel, borderColor: C.line, animationDelay: `${0.1 + ci * 0.1}s` }}>
                  <h2 className="cz-display flex items-center gap-2.5 text-2xl uppercase" style={{ fontWeight: 700 }}><col.icon size={20} style={{ color: C.amber }} aria-hidden="true" />{col.label}</h2>
                  {col.rows.length === 0 ? (
                    <p className="mt-6 text-sm" style={{ color: C.muted }}>{tx.none}</p>
                  ) : (
                    <>
                      <div className="mt-6"><Podium rows={col.rows} avatars={avatars} delay={0.1 + ci * 0.15} /></div>
                      {col.rows.length > 3 && (
                        <ol className="mt-6 flex flex-col gap-px border" style={{ background: C.line, borderColor: C.line }}>
                          {col.rows.slice(3, 10).map((r, i) => (
                            <li key={r.username} className="flex items-center gap-3 px-3 py-2 text-sm" style={{ background: C.void }}>
                              <span className="cz-display w-6 tabular-nums" style={{ color: C.muted, fontWeight: 700 }}>{i + 4}</span>
                              <Link href={`/profile/${r.username}`} className="min-w-0 flex-1 truncate hover:underline">{r.username}</Link>
                              <span className="tabular-nums" style={{ color: C.muted }}>{r.wins}W {r.losses}L</span>
                              <span className="w-14 text-end tabular-nums" style={{ color: C.amber, fontWeight: 700 }}>{r.rating}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </>
                  )}
                </section>
              ))}
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {s.mostActive && (
                <Link href={`/profile/${s.mostActive.username}`} className="czse-in czse-card block border p-6" style={{ background: C.panel, borderColor: C.line, animationDelay: "0.4s" }}>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: C.radar }}><Activity size={14} aria-hidden="true" />{tx.mostActive}</div>
                  <div className="cz-display mt-3 truncate text-3xl uppercase" style={{ fontWeight: 700 }}>{s.mostActive.username}</div>
                  <div className="mt-1 text-sm" style={{ color: C.muted }}>{tx.matches(s.mostActive.matches)}</div>
                </Link>
              )}
              {s.streak && (
                <Link href={`/profile/${s.streak.username}`} className="czse-in czse-card block border p-6" style={{ background: "linear-gradient(160deg, rgba(232,166,61,0.10), #12150E 60%)", borderColor: C.amberDim, animationDelay: "0.5s" }}>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: C.amber }}><Flame size={14} aria-hidden="true" />{tx.streak}</div>
                  <div className="cz-display mt-3 truncate text-3xl uppercase" style={{ fontWeight: 700 }}>{s.streak.username}</div>
                  <div className="mt-1 text-sm" style={{ color: C.muted }}>{tx.inARow(s.streak.streak, s.streak.mode)}</div>
                </Link>
              )}
              <div className="czse-in border p-6" style={{ background: C.panel, borderColor: C.line, animationDelay: "0.6s" }}>
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: C.muted }}><Swords size={14} aria-hidden="true" />{tx.total}</div>
                <div className="cz-display mt-3 text-5xl tabular-nums leading-none" style={{ color: PODIUM[0], fontWeight: 700 }}>{s.matches}</div>
              </div>
            </div>

            <nav className="mt-10 flex flex-wrap items-center justify-between gap-3">
              <Link href="/seasons" className="inline-flex min-h-[44px] items-center gap-2 border px-4 text-xs uppercase tracking-widest transition-colors hover:bg-[#171B10]" style={{ borderColor: C.amberDim, color: C.paper }}>
                <ArrowLeft size={14} className="rtl:-scale-x-100" aria-hidden="true" />{tx.all}
              </Link>
              <div className="flex gap-2">
                {n > 1 && <Link href={`/seasons/${n - 1}`} className="inline-flex min-h-[44px] items-center gap-2 border px-4 text-xs uppercase tracking-widest transition-colors hover:bg-[#171B10]" style={{ borderColor: C.lineStrong, color: C.paper }}><ArrowLeft size={14} className="rtl:-scale-x-100" aria-hidden="true" />{tx.prev}</Link>}
                {n < all.length && <Link href={`/seasons/${n + 1}`} className="inline-flex min-h-[44px] items-center gap-2 border px-4 text-xs uppercase tracking-widest transition-colors hover:bg-[#171B10]" style={{ borderColor: C.lineStrong, color: C.paper }}>{tx.next}<ArrowRight size={14} className="rtl:-scale-x-100" aria-hidden="true" /></Link>}
              </div>
            </nav>
          </>
        )}
      </div>
    </main>
  );
}
