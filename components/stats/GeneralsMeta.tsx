"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Info, Crown, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { loadMatches, opponentsOf, isWin, type StatMatch } from "@/lib/matchData";
import { GENERALS, FACTIONS, readGenerals, generalName, generalShort, type GeneralKey, type Faction } from "@/lib/generals";
import StatsShell, { WRAP, GeneralChip } from "@/components/stats/StatsShell";

type Mode = "all" | "team" | "ffa";
const MIN_GAMES = 5; // below this a win rate is shown as "low sample"
const WIN = C.radar;
const LOSS = "#F87171";

const TEXT = {
  en: {
    title: "Generals meta",
    sub: "Which generals win most on Commander — pick rates, win rates and matchups, straight from tagged ranked matches.",
    all: "All modes", team: "Team", ffa: "FFA",
    tagged: (n: number, t: number) => `${n} of ${t} matches have generals recorded`,
    factions: "Factions", generals: "Generals", picks: "Picks", winRate: "Win rate", pickRate: "Pick rate",
    low: "Low sample", best: "Highest win rate", popular: "Most picked",
    matchups: "Matchups", matchupsSub: "Win rate of the row general against the column general (team and FFA games, opposing sides only).",
    vs: "vs", noData: "No generals recorded yet.",
    howTo: "Admins tag which general each player used in Admin → Generals. The meta fills in automatically as matches get tagged.",
    needSql: "Generals aren't set up on the database yet — an admin needs to run sql/generals.sql once in Supabase.",
    loading: "Reading the battlefield…", games: (n: number) => `${n} games`,
  },
  ar: {
    title: "ميتا الجنرالات",
    sub: "أي الجنرالات يفوز أكثر في كوماندر: نسب الاختيار والفوز والمواجهات من المباريات المصنّفة المُسجّلة.",
    all: "كل الأنماط", team: "الفرق", ffa: "FFA",
    tagged: (n: number, t: number) => `${n} من ${t} مباراة مُسجّل فيها الجنرالات`,
    factions: "الفصائل", generals: "الجنرالات", picks: "مرات الاختيار", winRate: "نسبة الفوز", pickRate: "نسبة الاختيار",
    low: "عينة صغيرة", best: "أعلى نسبة فوز", popular: "الأكثر اختياراً",
    matchups: "المواجهات", matchupsSub: "نسبة فوز جنرال الصف ضد جنرال العمود (مباريات الفرق وFFA، الأطراف المتقابلة فقط).",
    vs: "ضد", noData: "لم يُسجّل أي جنرال بعد.",
    howTo: "يسجّل المشرفون الجنرال الذي استخدمه كل لاعب من الإدارة ← الجنرالات، وتمتلئ هذه الصفحة تلقائياً.",
    needSql: "لم تُجهّز الجنرالات في قاعدة البيانات بعد — يجب على أحد المشرفين تشغيل sql/generals.sql مرة واحدة في Supabase.",
    loading: "جارٍ قراءة ساحة المعركة…", games: (n: number) => `${n} مباراة`,
  },
};

type Agg = { picks: number; wins: number };

export default function GeneralsMeta() {
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];
  const [matches, setMatches] = useState<StatMatch[]>([]);
  const [hasGenerals, setHasGenerals] = useState(true);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("all");
  const [hover, setHover] = useState<[GeneralKey, GeneralKey] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMatches(createClient()).then(({ matches, hasGenerals }) => {
      if (cancelled) return;
      setMatches(matches);
      setHasGenerals(hasGenerals);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const s = useMemo(() => {
    const inMode = matches.filter((m) => mode === "all" || (mode === "ffa" ? m.mode === "ffa" : m.mode !== "ffa"));
    const tagged = inMode.filter((m) => Object.keys(readGenerals(m.generals)).length > 0);
    const gen: Record<string, Agg> = {};
    const fac: Record<string, Agg> = {};
    const mu: Record<string, Agg> = {}; // "a|b" -> a's record vs b
    let totalPicks = 0;
    for (const m of tagged) {
      const g = readGenerals(m.generals);
      for (const [player, key] of Object.entries(g)) {
        if (!m.participants.includes(player)) continue;
        const w = isWin(m, player) ? 1 : 0;
        const f = GENERALS.find((x) => x.key === key)!.faction;
        gen[key] = { picks: (gen[key]?.picks ?? 0) + 1, wins: (gen[key]?.wins ?? 0) + w };
        fac[f] = { picks: (fac[f]?.picks ?? 0) + 1, wins: (fac[f]?.wins ?? 0) + w };
        totalPicks++;
        // matchups: only decisive pairs (one side won, the other lost)
        for (const opp of opponentsOf(m, player)) {
          const ok = g[opp];
          if (!ok || isWin(m, opp) === isWin(m, player)) continue;
          const k = `${key}|${ok}`;
          mu[k] = { picks: (mu[k]?.picks ?? 0) + 1, wins: (mu[k]?.wins ?? 0) + w };
        }
      }
    }
    const rows = GENERALS.map((g) => ({ ...g, picks: gen[g.key]?.picks ?? 0, wins: gen[g.key]?.wins ?? 0 }))
      .map((r) => ({ ...r, wr: r.picks ? r.wins / r.picks : 0, pr: totalPicks ? r.picks / totalPicks : 0 }))
      .sort((a, b) => (b.picks >= MIN_GAMES ? 1 : 0) - (a.picks >= MIN_GAMES ? 1 : 0) || b.wr - a.wr || b.picks - a.picks);
    const qualified = rows.filter((r) => r.picks >= MIN_GAMES);
    const best = qualified[0] ?? null;
    const popular = [...rows].sort((a, b) => b.picks - a.picks)[0];
    const usedKeys = GENERALS.filter((g) => (gen[g.key]?.picks ?? 0) > 0).map((g) => g.key);
    return { tagged: tagged.length, total: inMode.length, rows, fac, mu, best, popular: popular?.picks ? popular : null, usedKeys, totalPicks };
  }, [matches, mode]);

  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const wrColor = (x: number) => (x >= 0.55 ? WIN : x <= 0.45 ? LOSS : C.amber);

  return (
    <StatsShell title={tx.title} sub={tx.sub} icon={BarChart3}>
      <div className={`${WRAP} mt-8`}>
        {/* mode filter + coverage */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2" role="group">
            {(["all", "team", "ffa"] as const).map((k) => (
              <button key={k} aria-pressed={mode === k} onClick={() => setMode(k)} className="inline-flex min-h-[44px] items-center border px-4 text-xs uppercase tracking-widest transition-colors" style={{ background: mode === k ? C.amber : "transparent", color: mode === k ? C.void : C.paper, borderColor: mode === k ? C.amber : C.amberDim, fontWeight: mode === k ? 700 : 500 }}>
                {tx[k]}
              </button>
            ))}
          </div>
          {!loading && hasGenerals && <span className="text-sm" style={{ color: C.muted }}>{tx.tagged(s.tagged, s.total)}</span>}
        </div>

        {loading ? (
          <p className="mt-10 text-sm" style={{ color: C.muted }}>{tx.loading}</p>
        ) : !hasGenerals || s.tagged === 0 ? (
          <div className="czst-in mt-8 flex items-start gap-4 border p-6" style={{ borderColor: C.amberDim, background: C.panel }}>
            <Info size={22} className="mt-0.5 shrink-0" style={{ color: C.amber }} aria-hidden="true" />
            <div>
              <div className="cz-display text-2xl uppercase" style={{ fontWeight: 700 }}>{tx.noData}</div>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: C.muted }}>{hasGenerals ? tx.howTo : tx.needSql}</p>
            </div>
          </div>
        ) : (
          <>
            {/* highlights */}
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {s.best && (
                <div className="czst-in czst-card border p-6" style={{ background: "linear-gradient(140deg, rgba(143,191,79,0.10), #12150E 60%)", borderColor: C.line }}>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: WIN }}><Crown size={14} aria-hidden="true" />{tx.best}</div>
                  <div className="cz-display mt-3 text-4xl uppercase" style={{ fontWeight: 700 }}>{generalName(s.best.key, lang)}</div>
                  <div className="mt-2 text-sm" style={{ color: C.muted }}><span className="cz-display text-2xl" style={{ color: WIN, fontWeight: 700 }}>{pct(s.best.wr)}</span> · {tx.games(s.best.picks)}</div>
                </div>
              )}
              {s.popular && (
                <div className="czst-in czst-card border p-6" style={{ background: "linear-gradient(140deg, rgba(232,166,61,0.10), #12150E 60%)", borderColor: C.line, animationDelay: "0.08s" }}>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: C.amber }}><Flame size={14} aria-hidden="true" />{tx.popular}</div>
                  <div className="cz-display mt-3 text-4xl uppercase" style={{ fontWeight: 700 }}>{generalName(s.popular.key, lang)}</div>
                  <div className="mt-2 text-sm" style={{ color: C.muted }}><span className="cz-display text-2xl" style={{ color: C.amber, fontWeight: 700 }}>{pct(s.popular.pr)}</span> {tx.pickRate.toLowerCase()} · {tx.games(s.popular.picks)}</div>
                </div>
              )}
            </div>

            {/* factions */}
            <h2 className="cz-display mt-12 text-3xl uppercase" style={{ fontWeight: 600 }}>{tx.factions}</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-3">
              {(Object.keys(FACTIONS) as Faction[]).map((f, i) => {
                const a = s.fac[f] ?? { picks: 0, wins: 0 };
                const wr = a.picks ? a.wins / a.picks : 0;
                return (
                  <div key={f} className="czst-in czst-card border p-5" style={{ background: C.panel, borderColor: C.line, borderTop: `3px solid ${FACTIONS[f].color}`, animationDelay: `${i * 0.06}s` }}>
                    <div className="cz-display text-3xl uppercase" style={{ color: FACTIONS[f].color, fontWeight: 700 }}>{FACTIONS[f][lang]}</div>
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>{tx.winRate}</div>
                        <div className="cz-display text-4xl leading-none" style={{ color: a.picks ? wrColor(wr) : C.muted, fontWeight: 700 }}>{a.picks ? pct(wr) : "—"}</div>
                      </div>
                      <div className="text-end text-sm" style={{ color: C.muted }}>{tx.games(a.picks)}<br />{s.totalPicks ? pct(a.picks / s.totalPicks) : "0%"} {tx.pickRate.toLowerCase()}</div>
                    </div>
                    <div className="mt-4 h-1.5" style={{ background: C.line }} dir="ltr">
                      <div className="czst-bar h-full" style={{ width: pct(wr), background: FACTIONS[f].color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* generals table */}
            <h2 className="cz-display mt-12 text-3xl uppercase" style={{ fontWeight: 600 }}>{tx.generals}</h2>
            <div className="mt-4 flex flex-col gap-px border" style={{ background: C.line, borderColor: C.line }}>
              <div className="grid grid-cols-[1fr_70px_90px] items-center gap-3 px-4 py-2 text-[11px] uppercase tracking-[0.16em] sm:grid-cols-[1fr_80px_100px_1.2fr]" style={{ background: C.panel, color: C.muted }}>
                <span>{tx.generals}</span><span className="text-end">{tx.picks}</span><span className="text-end">{tx.winRate}</span><span className="hidden sm:block">{tx.pickRate}</span>
              </div>
              {s.rows.map((r, i) => (
                <div key={r.key} className="czst-in grid grid-cols-[1fr_70px_90px] items-center gap-3 px-4 py-3 sm:grid-cols-[1fr_80px_100px_1.2fr]" style={{ background: C.panel, opacity: r.picks ? 1 : 0.45, animationDelay: `${Math.min(i, 11) * 0.03}s` }}>
                  <GeneralChip faction={FACTIONS[r.faction].code} label={generalShort(r.key, lang)} color={FACTIONS[r.faction].color} size="md" />
                  <span className="text-end tabular-nums">{r.picks}</span>
                  <span className="text-end tabular-nums" style={{ color: r.picks ? wrColor(r.wr) : C.muted, fontWeight: 700 }}>
                    {r.picks ? pct(r.wr) : "—"}
                    {r.picks > 0 && r.picks < MIN_GAMES && <span className="block text-[10px] font-normal uppercase tracking-widest" style={{ color: C.muted }}>{tx.low}</span>}
                  </span>
                  <span className="hidden h-2 sm:block" style={{ background: C.line }} dir="ltr">
                    <span className="czst-bar block h-full" style={{ width: pct(r.pr), background: FACTIONS[r.faction].color, animationDelay: `${i * 0.04}s` }} />
                  </span>
                </div>
              ))}
            </div>

            {/* matchups heatmap */}
            {s.usedKeys.length >= 2 && (
              <>
                <h2 className="cz-display mt-12 text-3xl uppercase" style={{ fontWeight: 600 }}>{tx.matchups}</h2>
                <p className="mt-1 text-sm" style={{ color: C.muted }}>{tx.matchupsSub}</p>
                <div className="mt-4 overflow-x-auto border p-4" style={{ background: C.panel, borderColor: C.line }} dir="ltr">
                  <div className="grid gap-[3px]" style={{ gridTemplateColumns: `140px repeat(${s.usedKeys.length}, minmax(52px, 1fr))`, minWidth: 140 + s.usedKeys.length * 55 }}>
                    <span />
                    {s.usedKeys.map((c) => (
                      <span key={c} className="truncate px-1 pb-1 text-center text-[10px] uppercase tracking-wider" style={{ color: hover?.[1] === c ? C.amber : C.muted }} title={generalName(c, lang)}>{generalShort(c, lang)}</span>
                    ))}
                    {s.usedKeys.map((r) => (
                      <div key={r} className="contents">
                        <span className="truncate pe-2 text-xs" style={{ color: hover?.[0] === r ? C.amber : C.paper }} title={generalName(r, lang)}>{generalShort(r, lang)}</span>
                        {s.usedKeys.map((c) => {
                          const a = s.mu[`${r}|${c}`];
                          const wr = a && a.picks ? a.wins / a.picks : null;
                          const bg = wr === null ? C.void : wr >= 0.5 ? `rgba(143,191,79,${0.15 + (wr - 0.5) * 1.5})` : `rgba(248,113,113,${0.15 + (0.5 - wr) * 1.5})`;
                          return (
                            <span
                              key={c}
                              onMouseEnter={() => setHover([r, c])}
                              onMouseLeave={() => setHover(null)}
                              title={wr === null ? `${generalName(r, lang)} ${tx.vs} ${generalName(c, lang)}: —` : `${generalName(r, lang)} ${tx.vs} ${generalName(c, lang)}: ${pct(wr)} (${tx.games(a.picks)})`}
                              className="czst-cell flex min-h-[40px] items-center justify-center text-xs tabular-nums"
                              style={{ background: bg, border: `1px solid ${C.line}`, color: wr === null ? C.lineStrong : C.paper, fontWeight: 600 }}
                            >
                              {wr === null ? "·" : pct(wr)}
                            </span>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </StatsShell>
  );
}
