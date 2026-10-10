"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Medal, Sparkles, Trophy, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ACHIEVEMENTS, TIER_COLORS, type Tier } from "@/lib/achievements";
import { useAchievements } from "@/lib/achievementsData";
import AchievementBadge from "@/components/achievements/AchievementBadge";

const WRAP = "mx-auto max-w-[1312px] px-6 md:px-16";
const TEXT = {
  en: {
    eyebrow: "Service record", title: "Achievements", sub: "Earned in battle, saved forever. Unlock them by playing ranked matches — you get a notification the moment one is yours.",
    all: "All", unlocks: "Total unlocks", rarest: "Rarest", yours: (n: number, t: number) => `You: ${n} of ${t}`, signIn: "Log in to track your progress",
    recent: "Recent unlocks", none: "No unlocks yet — play a ranked match!", top: "Most decorated", needSql: "Achievements are being calculated from matches — an admin can run sql/events-achievements.sql to save unlock dates and rarity.",
  },
  ar: {
    eyebrow: "السجل العسكري", title: "الإنجازات", sub: "تُكسب في المعركة وتبقى للأبد. افتحها بلعب المباريات المصنّفة — يصلك إشعار لحظة فتح أي إنجاز.",
    all: "الكل", unlocks: "مجموع الإنجازات", rarest: "الأندر", yours: (n: number, t: number) => `أنت: ${n} من ${t}`, signIn: "سجّل الدخول لتتابع تقدّمك",
    recent: "آخر الإنجازات", none: "لا إنجازات بعد — العب مباراة مصنّفة!", top: "الأكثر أوسمة", needSql: "تُحسب الإنجازات من المباريات — يمكن للمشرف تشغيل sql/events-achievements.sql لحفظ التواريخ والندرة.",
  },
};

export default function AchievementsView() {
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];
  const [me, setMe] = useState<string | null | undefined>(undefined);
  const [tier, setTier] = useState<"all" | Tier>("all");
  const [feed, setFeed] = useState<{ username: string; key: string; unlocked_at: string }[]>([]);
  const [top, setTop] = useState<[string, number][]>([]);
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const db = createClient();
    (async () => {
      const { data: { user } } = await db.auth.getUser();
      if (user) {
        const { data } = await db.from("profiles").select("username").eq("id", user.id).single();
        setMe((data as { username?: string } | null)?.username ?? null);
      } else setMe(null);
      const [{ data: recent }, { data: all }] = await Promise.all([
        db.from("player_achievements").select("username, key, unlocked_at").order("unlocked_at", { ascending: false }).limit(12),
        db.from("player_achievements").select("username").limit(20000),
      ]);
      const rows = (recent ?? []) as { username: string; key: string; unlocked_at: string }[];
      setFeed(rows);
      const counts: Record<string, number> = {};
      for (const r of (all ?? []) as { username: string }[]) counts[r.username] = (counts[r.username] ?? 0) + 1;
      const t5 = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5);
      setTop(t5);
      setTotal(((all ?? []) as unknown[]).length);
      const names = Array.from(new Set([...rows.map((r) => r.username), ...t5.map((x) => x[0])]));
      if (names.length) {
        const { data: p } = await db.from("profiles").select("username, avatar_url").in("username", names);
        setAvatars(Object.fromEntries(((p ?? []) as { username: string; avatar_url: string | null }[]).map((x) => [x.username, x.avatar_url])));
      }
    })();
  }, []);

  const { unlocked, progress, rarity, saved } = useAchievements(me ?? null);
  // rarest = the achievement the fewest commanders hold (but at least one does)
  const rarest = useMemo(() => (saved ? [...ACHIEVEMENTS].filter((a) => (rarity[a.key] ?? 0) > 0).sort((a, b) => (rarity[a.key] ?? 0) - (rarity[b.key] ?? 0))[0] ?? null : null), [saved, rarity]);
  const shown = ACHIEVEMENTS.filter((a) => tier === "all" || a.tier === tier);
  const defOf = (k: string) => ACHIEVEMENTS.find((a) => a.key === k);
  const ago = (iso: string) => {
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return "";
    const m = Math.max(0, Math.round((Date.now() - t) / 60000));
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
    return m < 60 ? rtf.format(-m, "minute") : m < 1440 ? rtf.format(-Math.round(m / 60), "hour") : rtf.format(-Math.round(m / 1440), "day");
  };

  return (
    <main className="min-h-screen w-full cz-grid-bg pb-24" style={{ color: C.paper }}>
      <header className="relative overflow-hidden border-b" style={{ borderColor: C.line }}>
        <div aria-hidden="true" className="pointer-events-none absolute end-[-6%] top-1/2 hidden -translate-y-1/2 md:block" style={{ opacity: 0.08 }}><Medal size={420} /></div>
        <div className={`${WRAP} relative pb-10 pt-14 md:pt-20`}>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}><Medal size={14} aria-hidden="true" />{tx.eyebrow}</div>
          <h1 className="cz-display mt-3 uppercase leading-none" style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", fontWeight: 700 }}>{tx.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed" style={{ color: C.muted }}>{tx.sub}</p>
          <div className="mt-7 grid max-w-3xl grid-cols-2 gap-px border sm:grid-cols-3" style={{ background: C.line, borderColor: C.line }}>
            <div className="px-5 py-4" style={{ background: C.panel }}>
              <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>{tx.unlocks}</div>
              <div className="cz-display mt-1 text-4xl leading-none" style={{ color: C.amber, fontWeight: 700 }}>{total}</div>
            </div>
            <div className="px-5 py-4" style={{ background: C.panel }}>
              <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>{tx.rarest}</div>
              <div className="mt-1 truncate text-base" style={{ color: rarest ? TIER_COLORS[rarest.tier].main : C.muted, fontWeight: 700 }}>{rarest ? rarest[lang][0] : "—"}</div>
              {rarest && <div className="text-xs" style={{ color: C.muted }}>{rarity[rarest.key] ?? 0}%</div>}
            </div>
            <div className="col-span-2 px-5 py-4 sm:col-span-1" style={{ background: C.panel }}>
              <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>{me ? tx.yours(Object.keys(unlocked).length, ACHIEVEMENTS.length) : tx.signIn}</div>
              {me ? (
                <div className="mt-3 flex h-2 overflow-hidden" style={{ background: C.line }} dir="ltr">
                  {(["legendary", "gold", "silver", "bronze"] as const).map((t) => <span key={t} style={{ width: `${(ACHIEVEMENTS.filter((a) => a.tier === t && a.key in unlocked).length / ACHIEVEMENTS.length) * 100}%`, background: TIER_COLORS[t].main }} />)}
                </div>
              ) : me === null ? <Link href="/login" className="mt-2 inline-block text-sm" style={{ color: C.amber }}>→ Log in</Link> : null}
            </div>
          </div>
        </div>
      </header>

      <div className={`${WRAP} mt-8 grid gap-8 lg:grid-cols-[1fr_320px]`}>
        <div>
          {saved === false && <p className="mb-5 border px-4 py-3 text-sm" style={{ borderColor: C.amberDim, background: C.panel, color: C.muted }}>{tx.needSql}</p>}
          <div className="mb-5 flex flex-wrap gap-2" role="group">
            {(["all", "legendary", "gold", "silver", "bronze"] as const).map((t) => {
              const on = tier === t;
              const col = t === "all" ? C.amber : TIER_COLORS[t].main;
              return (
                <button key={t} type="button" aria-pressed={on} onClick={() => setTier(t)} className="inline-flex min-h-[42px] items-center gap-2 border px-4 text-xs uppercase tracking-widest" style={{ background: on ? col : "transparent", color: on ? C.void : C.paper, borderColor: on ? col : C.lineStrong, fontWeight: on ? 700 : 500 }}>
                  {t !== "all" && <span className="h-2 w-2 rotate-45" style={{ background: on ? C.void : col }} />}
                  {t === "all" ? tx.all : TIER_COLORS[t][lang]}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {shown.map((a) => <AchievementBadge key={a.key} def={a} lang={lang} unlockedAt={me && a.key in unlocked ? unlocked[a.key] ?? "" : null} have={me ? progress[a.key] ?? 0 : 0} rarity={saved ? rarity[a.key] ?? 0 : null} />)}
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="border" style={{ background: C.panel, borderColor: C.line }}>
            <h2 className="cz-display flex items-center gap-2 border-b px-5 py-3 text-lg uppercase" style={{ borderColor: C.line, fontWeight: 700 }}><Sparkles size={15} style={{ color: C.amber }} aria-hidden="true" />{tx.recent}</h2>
            {feed.length === 0 ? <p className="px-5 py-5 text-sm" style={{ color: C.muted }}>{tx.none}</p> : (
              <ul>
                {feed.map((f, i) => {
                  const d = defOf(f.key);
                  if (!d) return null;
                  const Icon = d.icon;
                  return (
                    <li key={`${f.username}-${f.key}-${i}`} className="flex items-center gap-3 border-b px-5 py-3 last:border-b-0" style={{ borderColor: C.line }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatars[f.username] || "/default-avatar.svg"} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" style={{ border: `1px solid ${C.lineStrong}` }} />
                      <div className="min-w-0 flex-1 text-sm">
                        <Link href={`/profile/${f.username}`} className="hover:underline" style={{ fontWeight: 700 }}>{f.username}</Link>
                        <div className="flex items-center gap-1.5 truncate text-xs" style={{ color: TIER_COLORS[d.tier].main }}><Icon size={12} aria-hidden="true" />{d[lang][0]}</div>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 text-[10px]" style={{ color: C.muted }}><Clock size={10} aria-hidden="true" />{ago(f.unlocked_at)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          {top.length > 0 && (
            <section className="border" style={{ background: C.panel, borderColor: C.line }}>
              <h2 className="cz-display flex items-center gap-2 border-b px-5 py-3 text-lg uppercase" style={{ borderColor: C.line, fontWeight: 700 }}><Trophy size={15} style={{ color: C.amber }} aria-hidden="true" />{tx.top}</h2>
              <ol>
                {top.map(([n, c], i) => (
                  <li key={n} className="flex items-center gap-3 border-b px-5 py-2.5 last:border-b-0" style={{ borderColor: C.line }}>
                    <span className="cz-display w-5 text-lg" style={{ color: i === 0 ? C.amber : C.muted, fontWeight: 700 }}>{i + 1}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatars[n] || "/default-avatar.svg"} alt="" className="h-7 w-7 rounded-full object-cover" />
                    <Link href={`/profile/${n}#achievements`} className="min-w-0 flex-1 truncate text-sm hover:underline">{n}</Link>
                    <span className="inline-flex items-center gap-1 text-sm tabular-nums" style={{ color: C.amber, fontWeight: 700 }}><Medal size={13} aria-hidden="true" />{c}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
