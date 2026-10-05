"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crosshair, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { readGenerals, generalName, GENERAL_BY_KEY, FACTIONS, type GeneralKey } from "@/lib/generals";

// "Generals" section of a player profile. Hides itself until generals are recorded.
const TEXT = {
  en: { title: "Generals", fav: "Favourite general", games: (n: number) => `${n} ${n === 1 ? "game" : "games"}`, meta: "Generals meta" },
  ar: { title: "الجنرالات", fav: "الجنرال المفضّل", games: (n: number) => `${n} مباراة`, meta: "ميتا الجنرالات" },
};

export default function GeneralsPanel({ username }: { username: string }) {
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];
  const [rows, setRows] = useState<{ key: GeneralKey; g: number; w: number }[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await createClient().from("matches").select("winners, generals").contains("participants", [username]).limit(5000);
      if (cancelled || error) return;
      const agg: Record<string, { g: number; w: number }> = {};
      for (const m of (data ?? []) as { winners: string[] | null; generals: unknown }[]) {
        const key = readGenerals(m.generals)[username];
        if (!key) continue;
        const won = (m.winners ?? []).includes(username) ? 1 : 0;
        agg[key] = { g: (agg[key]?.g ?? 0) + 1, w: (agg[key]?.w ?? 0) + won };
      }
      setRows(Object.entries(agg).map(([key, v]) => ({ key: key as GeneralKey, ...v })).sort((a, b) => b.g - a.g));
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (!rows || rows.length === 0) return null;
  const fav = rows[0];
  const favInfo = GENERAL_BY_KEY[fav.key];
  const max = fav.g;

  return (
    <section className="mt-12">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="cz-display flex items-center gap-2.5 text-2xl uppercase" style={{ fontWeight: 600 }}>
          <Crosshair size={18} style={{ color: C.amber }} aria-hidden="true" />
          {tx.title}
        </h2>
        <Link href="/stats/generals" className="inline-flex items-center gap-1 text-xs uppercase tracking-widest" style={{ color: C.amber }}>
          {tx.meta} <ArrowUpRight size={13} className="rtl:-scale-x-100" aria-hidden="true" />
        </Link>
      </div>
      <div className="grid gap-6 border p-5 md:grid-cols-[280px_1fr] md:p-6" style={{ background: C.panel, borderColor: C.line }}>
        <div className="border p-5" style={{ borderColor: `${FACTIONS[favInfo.faction].color}66`, background: `linear-gradient(160deg, ${FACTIONS[favInfo.faction].color}1f, transparent 70%)` }}>
          <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>{tx.fav}</div>
          <div className="mt-1 text-xs font-bold tracking-widest" style={{ color: FACTIONS[favInfo.faction].color }}>{FACTIONS[favInfo.faction][lang]}</div>
          <div className="cz-display mt-1 text-3xl uppercase leading-tight" style={{ fontWeight: 700 }}>{generalName(fav.key, lang)}</div>
          <div className="mt-3 text-sm" style={{ color: C.muted }}>
            {tx.games(fav.g)} · <span style={{ color: fav.w / fav.g >= 0.5 ? C.radar : "#F87171", fontWeight: 700 }}>{Math.round((fav.w / fav.g) * 100)}%</span>
          </div>
        </div>
        <ul className="flex flex-col gap-3">
          {rows.map((r) => {
            const info = GENERAL_BY_KEY[r.key];
            const wr = Math.round((r.w / r.g) * 100);
            return (
              <li key={r.key}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate"><span className="me-2 text-[11px] font-bold tracking-widest" style={{ color: FACTIONS[info.faction].color }}>{FACTIONS[info.faction].code}</span>{generalName(r.key, lang)}</span>
                  <span className="shrink-0 text-xs tabular-nums" style={{ color: C.muted }}>{r.w}W · {r.g - r.w}L · <span style={{ color: wr >= 50 ? C.radar : "#F87171", fontWeight: 700 }}>{wr}%</span></span>
                </div>
                <div className="mt-1.5 h-1.5" style={{ background: C.line }} dir="ltr">
                  <div className="h-full transition-[width] duration-700" style={{ width: `${(r.g / max) * 100}%`, background: FACTIONS[info.faction].color }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
