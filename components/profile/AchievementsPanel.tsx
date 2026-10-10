"use client";

import Link from "next/link";
import { Medal, ArrowUpRight } from "lucide-react";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ACHIEVEMENTS, TIER_COLORS } from "@/lib/achievements";
import { useAchievements } from "@/lib/achievementsData";
import AchievementBadge from "@/components/achievements/AchievementBadge";

const TIER_ORDER = { legendary: 0, gold: 1, silver: 2, bronze: 3 } as const;

// Profile section: every achievement — unlocked first (rarest tier first), then the rest with progress bars.
export default function AchievementsPanel({ username }: { username: string }) {
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const { unlocked, progress, rarity, saved, loading } = useAchievements(username);
  const count = Object.keys(unlocked).length;
  const list = [...ACHIEVEMENTS].sort((a, b) => Number(!(a.key in unlocked)) - Number(!(b.key in unlocked)) || TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);
  return (
    <section id="achievements" className="mt-12 scroll-mt-28">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="cz-display flex items-center gap-2.5 text-2xl uppercase" style={{ fontWeight: 600 }}>
          <Medal size={18} style={{ color: C.amber }} aria-hidden="true" />
          {lang === "ar" ? "الإنجازات" : "Achievements"}
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-sm tabular-nums" style={{ color: C.muted }}>{lang === "ar" ? `${count} من ${ACHIEVEMENTS.length} مفتوحة` : `${count} of ${ACHIEVEMENTS.length} unlocked`}</span>
          <Link href="/achievements" className="inline-flex items-center gap-1 text-xs uppercase tracking-widest" style={{ color: C.amber }}>{lang === "ar" ? "كل الإنجازات" : "All achievements"}<ArrowUpRight size={13} className="rtl:-scale-x-100" aria-hidden="true" /></Link>
        </div>
      </div>
      <div className="mb-4 flex h-1.5 overflow-hidden" style={{ background: C.line }} dir="ltr" aria-hidden="true">
        {(["legendary", "gold", "silver", "bronze"] as const).map((t) => {
          const n = ACHIEVEMENTS.filter((a) => a.tier === t && a.key in unlocked).length;
          return <span key={t} style={{ width: `${(n / ACHIEVEMENTS.length) * 100}%`, background: TIER_COLORS[t].main, transition: "width 0.8s ease" }} />;
        })}
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-40 border" style={{ borderColor: C.line, background: C.panel, opacity: 0.5 }} />)}</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {list.map((a) => (
            <AchievementBadge key={a.key} def={a} lang={lang} unlockedAt={a.key in unlocked ? unlocked[a.key] ?? "" : null} have={progress[a.key] ?? 0} rarity={saved ? rarity[a.key] ?? 0 : null} />
          ))}
        </div>
      )}
    </section>
  );
}
