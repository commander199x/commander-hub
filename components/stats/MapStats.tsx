"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Map as MapIcon, Search, Trophy, ThumbsUp, ThumbsDown, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { loadMatches, isWin, type StatMatch } from "@/lib/matchData";
import { maps as MAP_FILES } from "@/lib/maps-data";
import StatsShell, { WRAP } from "@/components/stats/StatsShell";

const WIN = C.radar;
const LOSS = "#F87171";
const MIN_PLAYER_GAMES = 3;

const TEXT = {
  en: {
    title: "Map stats", sub: "Where the battles happen: the most played maps, who rules each one, and every player's best and worst maps.",
    maps: "Maps", games: (n: number) => `${n} ${n === 1 ? "game" : "games"}`, share: "of all games", team: "Team", ffa: "FFA",
    last: "Last played", king: "Most wins", lookup: "Player lookup", lookupSub: `Best and worst maps for a player (at least ${MIN_PLAYER_GAMES} games on a map).`,
    search: "Type a player name", best: "Best maps", worst: "Toughest maps", none: "Not enough games on any map yet.", noMaps: "No maps recorded on matches yet.",
    loading: "Scanning the maps…", unknown: "Unknown map", download: "Download",
  },
  ar: {
    title: "إحصائيات الخرائط", sub: "أين تدور المعارك: الخرائط الأكثر لعباً، ومن يسيطر على كل خريطة، وأفضل وأصعب خرائط كل لاعب.",
    maps: "الخرائط", games: (n: number) => `${n} مباراة`, share: "من كل المباريات", team: "الفرق", ffa: "FFA",
    last: "آخر مباراة", king: "الأكثر فوزاً", lookup: "بحث عن لاعب", lookupSub: `أفضل وأصعب الخرائط للاعب (${MIN_PLAYER_GAMES} مباريات على الأقل في الخريطة).`,
    search: "اكتب اسم لاعب", best: "أفضل الخرائط", worst: "أصعب الخرائط", none: "لا توجد مباريات كافية على أي خريطة بعد.", noMaps: "لم تُسجّل أي خريطة في المباريات بعد.",
    loading: "جارٍ مسح الخرائط…", unknown: "خريطة غير معروفة", download: "تحميل",
  },
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]/g, "");

export default function MapStats() {
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];
  const [matches, setMatches] = useState<StatMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadMatches(createClient()).then(({ matches }) => {
      if (!cancelled) {
        setMatches(matches);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const images = useMemo(() => {
    const m = new Map<string, { image: string; file: string }>();
    for (const f of MAP_FILES) m.set(norm(f.name), { image: f.image, file: f.file });
    return m;
  }, []);

  const s = useMemo(() => {
    const withMap = matches.filter((m) => m.map && m.map.trim());
    const by = new Map<string, StatMatch[]>();
    for (const m of withMap) {
      const k = m.map!.trim();
      by.set(k, [...(by.get(k) ?? []), m]);
    }
    const rows = Array.from(by.entries()).map(([name, list]) => {
      const wins: Record<string, number> = {};
      for (const m of list) for (const w of m.winners) wins[w] = (wins[w] ?? 0) + 1;
      const king = Object.entries(wins).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] ?? null;
      return {
        name,
        games: list.length,
        team: list.filter((m) => m.mode !== "ffa").length,
        ffa: list.filter((m) => m.mode === "ffa").length,
        last: list[0].created_at,
        king,
        art: images.get(norm(name)) ?? null,
      };
    }).sort((a, b) => b.games - a.games);
    const names = Array.from(new Set(matches.flatMap((m) => m.participants))).sort((a, b) => a.localeCompare(b));
    return { rows, total: withMap.length, names };
  }, [matches, images]);

  const lookup = useMemo(() => {
    const p = s.names.find((n) => n.toLowerCase() === player.trim().toLowerCase());
    if (!p) return null;
    const agg: Record<string, { g: number; w: number }> = {};
    for (const m of matches) {
      if (!m.map || !m.participants.includes(p)) continue;
      const k = m.map.trim();
      agg[k] = { g: (agg[k]?.g ?? 0) + 1, w: (agg[k]?.w ?? 0) + (isWin(m, p) ? 1 : 0) };
    }
    const list = Object.entries(agg).filter(([, v]) => v.g >= MIN_PLAYER_GAMES).map(([map, v]) => ({ map, ...v, wr: v.w / v.g }));
    return {
      name: p,
      best: [...list].sort((a, b) => b.wr - a.wr || b.g - a.g).slice(0, 3),
      worst: [...list].sort((a, b) => a.wr - b.wr || b.g - a.g).slice(0, 3),
      any: list.length > 0,
    };
  }, [player, matches, s.names]);

  const fmt = (iso: string) => new Date(iso).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  const max = s.rows[0]?.games ?? 1;

  return (
    <StatsShell title={tx.title} sub={tx.sub} icon={MapIcon}>
      <div className={`${WRAP} mt-8`}>
        {/* player lookup */}
        <section className="czst-in border p-5 md:p-6" style={{ background: C.panel, borderColor: C.amberDim }}>
          <h2 className="cz-display text-2xl uppercase" style={{ fontWeight: 700 }}>{tx.lookup}</h2>
          <p className="mt-1 text-sm" style={{ color: C.muted }}>{tx.lookupSub}</p>
          <label className="relative mt-4 block max-w-md">
            <span className="sr-only">{tx.search}</span>
            <Search size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 -translate-y-1/2" style={{ insetInlineStart: 12, color: C.muted }} />
            <input list="czst-players" value={player} onChange={(e) => setPlayer(e.target.value)} placeholder={tx.search} className="min-h-[44px] w-full border border-[#8A6425] bg-[#0A0C08] pe-3 ps-9 text-sm text-[#EDEAE0] focus:border-[#E8A63D]" />
            <datalist id="czst-players">{s.names.map((n) => <option key={n} value={n} />)}</datalist>
          </label>
          {lookup && (
            lookup.any ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {[{ list: lookup.best, label: tx.best, icon: ThumbsUp, color: WIN }, { list: lookup.worst, label: tx.worst, icon: ThumbsDown, color: LOSS }].map((col) => (
                  <div key={col.label}>
                    <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: col.color }}><col.icon size={13} aria-hidden="true" />{col.label}</div>
                    <ul className="flex flex-col gap-2">
                      {col.list.map((r, i) => (
                        <li key={r.map} className="czst-in border px-3 py-2" style={{ borderColor: C.line, background: C.void, animationDelay: `${i * 0.06}s` }}>
                          <div className="flex justify-between gap-2 text-sm"><span className="truncate">{r.map}</span><span className="tabular-nums" style={{ color: col.color, fontWeight: 700 }}>{Math.round(r.wr * 100)}%</span></div>
                          <div className="mt-1 h-1.5" style={{ background: C.line }} dir="ltr"><div className="czst-bar h-full" style={{ width: `${r.wr * 100}%`, background: col.color }} /></div>
                          <div className="mt-1 text-xs" style={{ color: C.muted }}>{r.w}W · {r.g - r.w}L · {tx.games(r.g)}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm" style={{ color: C.muted }}>{tx.none}</p>
            )
          )}
        </section>

        {/* map cards */}
        <h2 className="cz-display mt-12 text-3xl uppercase" style={{ fontWeight: 600 }}>{tx.maps}</h2>
        {loading ? (
          <p className="mt-6 text-sm" style={{ color: C.muted }}>{tx.loading}</p>
        ) : s.rows.length === 0 ? (
          <p className="mt-6 border px-4 py-10 text-center text-sm" style={{ borderColor: C.line, background: C.panel, color: C.muted }}>{tx.noMaps}</p>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {s.rows.map((r, i) => (
              <article key={r.name} className="czst-in czst-card flex flex-col overflow-hidden border" style={{ background: C.panel, borderColor: i === 0 ? C.amberDim : C.line, animationDelay: `${Math.min(i, 9) * 0.05}s` }}>
                <div className="relative h-32 overflow-hidden" style={{ background: "linear-gradient(135deg, #12150E, #1d2215)" }}>
                  {r.art && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={encodeURI(r.art.image)} alt="" className="h-full w-full object-cover opacity-70" style={{ filter: "grayscale(0.3)" }} />
                  )}
                  <span className="absolute inset-0" style={{ background: "linear-gradient(0deg, #12150E, rgba(18,21,14,0.1) 70%)" }} />
                  <span className="cz-display absolute start-4 top-3 text-5xl leading-none" style={{ color: "rgba(232,166,61,0.85)", fontWeight: 700 }}>#{i + 1}</span>
                </div>
                <div className="flex flex-1 flex-col p-5 pt-2">
                  <h3 className="cz-display truncate text-2xl uppercase" style={{ fontWeight: 700 }} dir="auto">{r.name}</h3>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <span className="cz-display text-3xl tabular-nums leading-none" style={{ color: C.amber, fontWeight: 700 }}>{r.games}</span>
                    <span className="text-xs" style={{ color: C.muted }}>{s.total ? Math.round((r.games / s.total) * 100) : 0}% {tx.share}</span>
                  </div>
                  <div className="mt-2 h-1.5" style={{ background: C.line }} dir="ltr"><div className="czst-bar h-full" style={{ width: `${(r.games / max) * 100}%`, background: C.amber, animationDelay: `${i * 0.05}s` }} /></div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: C.muted }}>
                    <span>{tx.team} <b style={{ color: C.paper }}>{r.team}</b></span>
                    <span>{tx.ffa} <b style={{ color: C.paper }}>{r.ffa}</b></span>
                    <span className="inline-flex items-center gap-1"><Clock size={11} aria-hidden="true" />{fmt(r.last)}</span>
                  </div>
                  {r.king && (
                    <Link href={`/profile/${r.king[0]}`} className="mt-4 flex items-center gap-2 border-t pt-3 text-sm hover:underline" style={{ borderColor: C.line }}>
                      <Trophy size={14} style={{ color: C.amber }} aria-hidden="true" />
                      <span style={{ color: C.muted }}>{tx.king}:</span>
                      <span className="truncate" style={{ fontWeight: 600 }}>{r.king[0]}</span>
                      <span className="ms-auto tabular-nums" style={{ color: WIN }}>{r.king[1]}W</span>
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </StatsShell>
  );
}
