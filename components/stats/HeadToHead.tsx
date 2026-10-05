"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Swords, ArrowLeftRight, Search, Handshake, Map as MapIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { loadMatches, isWin, opponentsOf, type StatMatch } from "@/lib/matchData";
import { readGenerals, generalShort, GENERAL_BY_KEY, FACTIONS, type GeneralKey } from "@/lib/generals";
import StatsShell, { WRAP, GeneralChip } from "@/components/stats/StatsShell";

const A_COLOR = C.amber;
const B_COLOR = C.radar;
const LOSS = "#F87171";

const TEXT = {
  en: {
    title: "Head-to-head", sub: "Settle the rivalry: pick two players to compare their record against each other, ratings over time, and every match they shared.",
    p1: "Player 1", p2: "Player 2", swap: "Swap players", pick: "Pick two different players to compare.", vs: "VS",
    against: "Against each other", wins: "wins", together: "As teammates", togetherRec: (w: number, l: number) => `${w}W · ${l}L together`, never: "Never played together",
    team: "Team rating", ffa: "FFA rating", games: "Matches", winRate: "Win rate", fav: "Favourite general",
    history: "Team rating over time", shared: "Shared matches", noShared: "These two haven't played in the same match yet.",
    beat: "beat", sameSide: "Same side", won: "Won", lost: "Lost", loading: "Loading the files…", unknown: "Unknown map",
  },
  ar: {
    title: "مواجهة مباشرة", sub: "احسم التنافس: اختر لاعبَين لمقارنة سجلّهما ضد بعضهما، وتطوّر تقييمهما، وكل مباراة جمعتهما.",
    p1: "اللاعب 1", p2: "اللاعب 2", swap: "تبديل اللاعبين", pick: "اختر لاعبَين مختلفَين للمقارنة.", vs: "ضد",
    against: "ضد بعضهما", wins: "فوز", together: "كزميلين", togetherRec: (w: number, l: number) => `${w} فوز · ${l} خسارة معاً`, never: "لم يلعبا معاً أبداً",
    team: "تقييم الفرق", ffa: "تقييم FFA", games: "المباريات", winRate: "نسبة الفوز", fav: "الجنرال المفضّل",
    history: "تقييم الفرق عبر الزمن", shared: "المباريات المشتركة", noShared: "لم يلعب هذان اللاعبان في المباراة نفسها بعد.",
    beat: "تغلّب على", sameSide: "نفس الفريق", won: "فاز", lost: "خسر", loading: "جارٍ تحميل الملفات…", unknown: "خريطة غير معروفة",
  },
};

type Ratings = Record<string, { team: number; ffa: number; avatar: string | null }>;

function readParam(k: string) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(k) ?? "";
}

export default function HeadToHead() {
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];
  const [matches, setMatches] = useState<StatMatch[]>([]);
  const [ratings, setRatings] = useState<Ratings>({});
  const [loading, setLoading] = useState(true);
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  useEffect(() => {
    setA(readParam("a"));
    setB(readParam("b"));
    const db = createClient();
    let cancelled = false;
    (async () => {
      const [{ matches }, { data: profs }, { data: guests }] = await Promise.all([
        loadMatches(db),
        db.from("profiles").select("username, avatar_url, rating_team, rating_ffa"),
        db.from("guest_ratings").select("name, rating_team, rating_ffa"),
      ]);
      if (cancelled) return;
      const r: Ratings = {};
      for (const p of (profs ?? []) as { username: string; avatar_url: string | null; rating_team: number | null; rating_ffa: number | null }[])
        r[p.username] = { team: Math.round(Number(p.rating_team ?? 1000)), ffa: Math.round(Number(p.rating_ffa ?? 1000)), avatar: p.avatar_url };
      for (const g of (guests ?? []) as { name: string; rating_team: number | null; rating_ffa: number | null }[])
        r[g.name] = { team: Math.round(Number(g.rating_team ?? 1000)), ffa: Math.round(Number(g.rating_ffa ?? 1000)), avatar: r[g.name]?.avatar ?? null };
      setMatches(matches);
      setRatings(r);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // keep the URL shareable: /stats/h2h?a=Ace&b=Bob
  useEffect(() => {
    const sp = new URLSearchParams();
    if (a) sp.set("a", a);
    if (b) sp.set("b", b);
    const qs = sp.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [a, b]);

  const names = useMemo(() => Array.from(new Set(matches.flatMap((m) => m.participants))).sort((x, y) => x.localeCompare(y)), [matches]);
  const resolve = (v: string) => names.find((n) => n.toLowerCase() === v.trim().toLowerCase()) ?? null;
  const A = resolve(a);
  const B = resolve(b);
  const ready = !!A && !!B && A !== B;

  const s = useMemo(() => {
    if (!ready) return null;
    const pa = A!, pb = B!;
    const shared = matches.filter((m) => m.participants.includes(pa) && m.participants.includes(pb));
    let aWins = 0, bWins = 0, togetherW = 0, togetherL = 0;
    for (const m of shared) {
      const opposed = opponentsOf(m, pa).includes(pb);
      if (opposed) {
        if (isWin(m, pa) && !isWin(m, pb)) aWins++;
        else if (isWin(m, pb) && !isWin(m, pa)) bWins++;
      } else if (isWin(m, pa)) togetherW++;
      else togetherL++;
    }
    const summary = (p: string) => {
      const mine = matches.filter((m) => m.participants.includes(p));
      const w = mine.filter((m) => isWin(m, p)).length;
      const gens: Record<string, number> = {};
      for (const m of mine) {
        const g = readGenerals(m.generals)[p];
        if (g) gens[g] = (gens[g] ?? 0) + 1;
      }
      const fav = Object.entries(gens).sort((x, y) => y[1] - x[1])[0]?.[0] as GeneralKey | undefined;
      // team rating history, walking back from the current rating
      const team = mine.filter((m) => m.mode !== "ffa");
      let after = ratings[p]?.team ?? 1000;
      const pts: { t: number; r: number }[] = [];
      for (const m of team) {
        pts.push({ t: new Date(m.created_at).getTime(), r: after });
        after -= Math.round(m.rating_changes?.[p] ?? 0);
      }
      if (team.length) pts.push({ t: new Date(team[team.length - 1].created_at).getTime() - 1, r: after });
      return { games: mine.length, wr: mine.length ? Math.round((w / mine.length) * 100) : 0, fav, hist: pts.reverse() };
    };
    return { shared, aWins, bWins, togetherW, togetherL, sa: summary(pa), sb: summary(pb) };
  }, [ready, A, B, matches, ratings]);

  const fmt = (iso: string) => new Date(iso).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  const avatar = (p: string, size: number, color: string) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={ratings[p]?.avatar || "/default-avatar.svg"} alt="" className="rounded-full object-cover" style={{ width: size, height: size, border: `3px solid ${color}` }} />
  );

  // chart
  const chart = (() => {
    if (!s || (s.sa.hist.length < 2 && s.sb.hist.length < 2)) return null;
    const all = [...s.sa.hist, ...s.sb.hist];
    const t0 = Math.min(...all.map((p) => p.t)), t1 = Math.max(...all.map((p) => p.t));
    let lo = Math.min(...all.map((p) => p.r)), hi = Math.max(...all.map((p) => p.r));
    if (hi - lo < 40) { lo -= 20; hi += 20; }
    const W = 800, H = 240, P = 40;
    const x = (t: number) => P + ((t - t0) / Math.max(1, t1 - t0)) * (W - P * 2);
    const y = (r: number) => 16 + ((hi - r) / (hi - lo)) * (H - 40);
    const path = (h: { t: number; r: number }[]) => h.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.r).toFixed(1)}`).join(" ");
    return { W, H, P, lo, hi, y, pa: path(s.sa.hist), pb: path(s.sb.hist) };
  })();

  return (
    <StatsShell title={tx.title} sub={tx.sub} icon={Swords}>
      <div className={`${WRAP} mt-8`}>
        {/* pickers */}
        <div className="grid items-end gap-3 md:grid-cols-[1fr_auto_1fr]">
          {[{ v: a, set: setA, label: tx.p1, color: A_COLOR, id: "h2h-a" }, null, { v: b, set: setB, label: tx.p2, color: B_COLOR, id: "h2h-b" }].map((p, i) =>
            p ? (
              <label key={p.id} className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.2em]" style={{ color: p.color }}>{p.label}</span>
                <span className="relative block">
                  <Search size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 -translate-y-1/2" style={{ insetInlineStart: 12, color: C.muted }} />
                  <input id={p.id} list="h2h-names" value={p.v} onChange={(e) => p.set(e.target.value)} className="min-h-[48px] w-full border bg-[#0A0C08] pe-3 ps-9 text-base text-[#EDEAE0]" style={{ borderColor: p.color }} />
                </span>
              </label>
            ) : (
              <button key={i} onClick={() => { setA(b); setB(a); }} aria-label={tx.swap} title={tx.swap} className="mx-auto inline-flex h-12 w-12 items-center justify-center border transition-colors hover:bg-[#171B10]" style={{ borderColor: C.lineStrong, color: C.paper }}>
                <ArrowLeftRight size={18} aria-hidden="true" />
              </button>
            )
          )}
          <datalist id="h2h-names">{names.map((n) => <option key={n} value={n} />)}</datalist>
        </div>

        {loading ? (
          <p className="mt-10 text-sm" style={{ color: C.muted }}>{tx.loading}</p>
        ) : !s ? (
          <p className="mt-10 border px-4 py-10 text-center text-sm" style={{ borderColor: C.line, background: C.panel, color: C.muted }}>{tx.pick}</p>
        ) : (
          <div key={`${A}|${B}`}>
            {/* VS banner */}
            <section className="czst-in mt-8 grid items-center gap-6 border p-6 md:grid-cols-[1fr_auto_1fr] md:p-8" style={{ background: "linear-gradient(90deg, rgba(232,166,61,0.10), #12150E 40%, #12150E 60%, rgba(143,191,79,0.10))", borderColor: C.line }}>
              {[{ p: A!, sum: s.sa, color: A_COLOR, w: s.aWins }, null, { p: B!, sum: s.sb, color: B_COLOR, w: s.bWins }].map((side, i) =>
                side ? (
                  <Link key={side.p} href={`/profile/${side.p}`} className={`group flex items-center gap-4 ${i === 2 ? "md:flex-row-reverse md:text-end" : ""}`}>
                    {avatar(side.p, 84, side.color)}
                    <div className="min-w-0">
                      <div className="cz-display truncate text-3xl uppercase leading-none group-hover:underline" style={{ fontWeight: 700 }}>{side.p}</div>
                      <div className="cz-display mt-2 text-6xl leading-none tabular-nums" style={{ color: side.color, fontWeight: 700 }}>{side.w}</div>
                      <div className="text-xs uppercase tracking-widest" style={{ color: C.muted }}>{tx.wins}</div>
                    </div>
                  </Link>
                ) : (
                  <div key="vs" className="text-center">
                    <div className="cz-display text-5xl" style={{ color: C.lineStrong, fontWeight: 700 }}>{tx.vs}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>{tx.against}</div>
                    {s.aWins + s.bWins > 0 && (
                      <div className="mx-auto mt-3 flex h-2 w-40 overflow-hidden" dir="ltr">
                        <span className="czst-bar h-full" style={{ width: `${(s.aWins / (s.aWins + s.bWins)) * 100}%`, background: A_COLOR }} />
                        <span className="h-full flex-1" style={{ background: B_COLOR }} />
                      </div>
                    )}
                  </div>
                )
              )}
            </section>

            {/* side-by-side numbers */}
            <div className="mt-6 grid gap-px border sm:grid-cols-2" style={{ background: C.line, borderColor: C.line }}>
              {[{ p: A!, sum: s.sa, color: A_COLOR }, { p: B!, sum: s.sb, color: B_COLOR }].map((side) => (
                <div key={side.p} className="grid grid-cols-2 gap-4 p-5 lg:grid-cols-4" style={{ background: C.panel, borderTop: `3px solid ${side.color}` }}>
                  {[[tx.team, ratings[side.p]?.team ?? 1000], [tx.ffa, ratings[side.p]?.ffa ?? 1000], [tx.games, side.sum.games], [tx.winRate, `${side.sum.wr}%`]].map(([label, val]) => (
                    <div key={String(label)}>
                      <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: C.muted }}>{label}</div>
                      <div className="cz-display mt-1 text-3xl leading-none tabular-nums" style={{ color: side.color, fontWeight: 700 }}>{val}</div>
                    </div>
                  ))}
                  {side.sum.fav && (
                    <div className="col-span-2 lg:col-span-4">
                      <div className="mb-1 text-[11px] uppercase tracking-[0.16em]" style={{ color: C.muted }}>{tx.fav}</div>
                      <GeneralChip faction={FACTIONS[GENERAL_BY_KEY[side.sum.fav].faction].code} label={generalShort(side.sum.fav, lang)} color={FACTIONS[GENERAL_BY_KEY[side.sum.fav].faction].color} size="md" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 inline-flex items-center gap-2 text-sm" style={{ color: C.muted }}>
              <Handshake size={15} style={{ color: C.radar }} aria-hidden="true" />
              {tx.together}: {s.togetherW + s.togetherL ? tx.togetherRec(s.togetherW, s.togetherL) : tx.never}
            </p>

            {/* rating history */}
            {chart && (
              <section className="czst-in mt-8 border p-5" style={{ background: C.panel, borderColor: C.line }}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="cz-display text-2xl uppercase" style={{ fontWeight: 700 }}>{tx.history}</h2>
                  <div className="flex gap-4 text-xs">
                    <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4" style={{ background: A_COLOR }} />{A}</span>
                    <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4" style={{ background: B_COLOR }} />{B}</span>
                  </div>
                </div>
                <svg viewBox={`0 0 ${chart.W} ${chart.H}`} className="block w-full" role="img" aria-label={tx.history} style={{ direction: "ltr" }}>
                  {[0, 1, 2, 3].map((k) => {
                    const v = Math.round(chart.hi - ((chart.hi - chart.lo) * k) / 3);
                    return (
                      <g key={k}>
                        <line x1={chart.P} x2={chart.W - chart.P} y1={chart.y(v)} y2={chart.y(v)} stroke={C.line} strokeDasharray="3 5" />
                        <text x={chart.P - 6} y={chart.y(v) + 4} textAnchor="end" fontSize="11" fill={C.muted}>{v}</text>
                      </g>
                    );
                  })}
                  {chart.pa && <path d={chart.pa} fill="none" stroke={A_COLOR} strokeWidth="2.5" pathLength={1} className="czst-line" />}
                  {chart.pb && <path d={chart.pb} fill="none" stroke={B_COLOR} strokeWidth="2.5" pathLength={1} className="czst-line" style={{ animationDelay: "0.2s" }} />}
                </svg>
              </section>
            )}

            {/* shared matches */}
            <h2 className="cz-display mt-10 text-3xl uppercase" style={{ fontWeight: 600 }}>{tx.shared} <span className="text-xl" style={{ color: C.muted }}>{s.shared.length}</span></h2>
            {s.shared.length === 0 ? (
              <p className="mt-4 border px-4 py-10 text-center text-sm" style={{ borderColor: C.line, background: C.panel, color: C.muted }}>{tx.noShared}</p>
            ) : (
              <div className="mt-4 flex flex-col gap-px border" style={{ background: C.line, borderColor: C.line }}>
                {s.shared.slice(0, 25).map((m, i) => {
                  const opposed = opponentsOf(m, A!).includes(B!);
                  const aw = isWin(m, A!);
                  const gens = readGenerals(m.generals);
                  const tag = opposed ? (aw ? `${A} ${tx.beat} ${B}` : isWin(m, B!) ? `${B} ${tx.beat} ${A}` : "—") : `${tx.sameSide} · ${aw ? tx.won : tx.lost}`;
                  const color = opposed ? (aw ? A_COLOR : B_COLOR) : aw ? C.radar : LOSS;
                  return (
                    <div key={m.id} className="czst-in flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3" style={{ background: C.panel, borderInlineStart: `4px solid ${color}`, animationDelay: `${Math.min(i, 10) * 0.03}s` }}>
                      <span className="text-sm" style={{ color, fontWeight: 700 }}>{tag}</span>
                      <span className="text-[11px] uppercase tracking-widest" style={{ color: C.amber }}>{m.mode}</span>
                      <span className="inline-flex min-w-0 items-center gap-1 truncate text-sm" style={{ color: C.paper }}><MapIcon size={13} style={{ color: C.muted }} aria-hidden="true" />{m.map || tx.unknown}</span>
                      {[A!, B!].filter((p) => gens[p]).map((p) => (
                        <GeneralChip key={p} faction={FACTIONS[GENERAL_BY_KEY[gens[p]].faction].code} label={`${p}: ${generalShort(gens[p], lang)}`} color={FACTIONS[GENERAL_BY_KEY[gens[p]].faction].color} />
                      ))}
                      <span className="ms-auto text-xs" style={{ color: C.muted }}>{fmt(m.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </StatsShell>
  );
}
