"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Trophy, Crown, Swords, Users, CalendarDays, Layers, Download, Map as MapIcon, Medal, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Match = {
  id: string;
  mode: string;
  participants: string[] | null;
  winners: string[] | null;
  tournament_name: string | null;
  round: string | null;
  created_at: string;
  map?: string | null;
  replay_url?: string | null;
  rating_changes?: Record<string, number> | null;
};

type Row = { username: string; wins: number; losses: number };

const WRAP = "mx-auto max-w-[1312px] px-6 md:px-16";
const PAGE = 1000;
const WIN = C.radar;
const LOSS = "#F87171";
const PODIUM = [C.amber, "#C9CCC0", "#B87333"];
const UNLABELED = "__unlabeled__";

// Arabic needs a native review.
const TEXT = {
  en: {
    eyebrow: "Tournament command",
    title: "Tournament standings",
    sub: "Every tournament match logged on the site, grouped by event and round.",
    loading: "Loading tournaments…",
    empty: "No tournament-tagged matches yet. Add a tournament name when logging a match on /admin to see it here.",
    matches: "Matches",
    players: "Players",
    rounds: "Rounds",
    days: "Days",
    champion: "Champion",
    champions: "Champions",
    runnerUp: "Runner-up",
    leader: "Current leader",
    leaderHint: "No round named “Final” yet, so this is whoever has the most wins.",
    standings: "Standings",
    player: "Player",
    W: "W",
    L: "L",
    winRate: "Win %",
    bracket: "Rounds",
    traceHint: "Hover or tap a player to trace their path through the event.",
    unlabeled: "Unlabeled round",
    beat: "beat",
    replay: "Download replay",
    clear: "Clear",
    tracing: (n: string) => `Tracing ${n}`,
  },
  ar: {
    eyebrow: "قيادة البطولات",
    title: "ترتيب البطولات",
    sub: "كل مباريات البطولات المسجّلة في الموقع، مجمّعة حسب البطولة والجولة.",
    loading: "جارٍ تحميل البطولات…",
    empty: "لا توجد مباريات بطولات بعد. أضف اسم البطولة عند تسجيل مباراة من /admin لتظهر هنا.",
    matches: "المباريات",
    players: "اللاعبون",
    rounds: "الجولات",
    days: "الأيام",
    champion: "البطل",
    champions: "الأبطال",
    runnerUp: "الوصيف",
    leader: "المتصدّر الحالي",
    leaderHint: "لا توجد جولة باسم «Final» بعد، لذا هذا صاحب أكثر الانتصارات.",
    standings: "الترتيب",
    player: "اللاعب",
    W: "ف",
    L: "خ",
    winRate: "نسبة الفوز",
    bracket: "الجولات",
    traceHint: "مرّر أو اضغط على لاعب لتتبّع مساره في البطولة.",
    unlabeled: "جولة بلا اسم",
    beat: "تغلّب على",
    replay: "تحميل الإعادة",
    clear: "إلغاء",
    tracing: (n: string) => `تتبّع ${n}`,
  },
};

const CSS = `
@keyframes czt-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes czt-rays { to { transform: rotate(360deg); } }
@keyframes czt-shine { 0% { transform: translateX(-130%) skewX(-20deg); } 60%, 100% { transform: translateX(230%) skewX(-20deg); } }
@keyframes czt-twinkle { 0%, 100% { opacity: 0; transform: scale(0.4); } 50% { opacity: 1; transform: scale(1); } }
@keyframes czt-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
.czt-in { animation: czt-in 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czt-rays { animation: czt-rays 14s linear infinite; }
.czt-shine::after { content: ""; position: absolute; top: 0; bottom: 0; width: 35%; pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(232,166,61,0.18), transparent); animation: czt-shine 4.5s ease-in-out 0.6s infinite; }
.czt-spark { position: absolute; width: 6px; height: 6px; background: #E8A63D; clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%); animation: czt-twinkle 2.4s ease-in-out infinite; }
.czt-float { animation: czt-float 3.2s ease-in-out infinite; }
.czt-bar { transform-origin: left; transform: scaleX(0); transition: transform 0.9s cubic-bezier(0.2, 0.7, 0.2, 1); }
[dir="rtl"] .czt-bar { transform-origin: right; }
.czt-bar.on { transform: scaleX(1); }
.czt-link { transform-origin: left; transform: scaleX(0); transition: transform 0.7s ease 0.3s; }
[dir="rtl"] .czt-link { transform-origin: right; }
.czt-link.on { transform: scaleX(1); }
.czt-match { transition: opacity 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease; }
.czt-pick { transition: transform 0.25s ease, border-color 0.25s ease, background-color 0.25s ease; }
.czt-pick:hover { transform: translateY(-3px); }
.czt-scroll { scrollbar-width: thin; scrollbar-color: #3A4029 transparent; }
@media (prefers-reduced-motion: reduce) {
  .czt-in, .czt-rays, .czt-spark, .czt-float, .czt-shine::after { animation: none !important; }
  .czt-bar, .czt-link { transform: scaleX(1) !important; transition: none !important; }
  .czt-match, .czt-pick { transition: none !important; }
  .czt-pick:hover { transform: none !important; }
}
`;

function reducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return setInView(true);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView] as const;
}

function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (reducedMotion()) return setShown(value);
    let raf = 0;
    const start = performance.now();
    setShown(0);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 900);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{shown}</>;
}

function Avatar({ src, size, ring }: { src: string | null | undefined; size: number; ring?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src || "/default-avatar.svg"} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size, border: `${ring ? 2 : 1}px solid ${ring ?? C.lineStrong}` }} />
  );
}

function Title({ icon: Icon, children, right }: { icon: typeof Trophy; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <h2 className="cz-display flex items-center gap-2.5 text-3xl uppercase" style={{ fontWeight: 600 }}>
        <Icon size={20} style={{ color: C.amber }} aria-hidden="true" />
        {children}
      </h2>
      {right}
    </div>
  );
}

/**
 * Tournament view: pick a tournament name (tagged on matches via the "Tournament name"
 * field in the admin Log a Match form) and see its champion, standings and rounds.
 * It groups already-logged matches by the tournament_name/round you typed in when logging them.
 */
export default function TournamentStandingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];

  const [matches, setMatches] = useState<Match[]>([]);
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [trace, setTrace] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [standRef, standIn] = useInView<HTMLDivElement>();
  const [roundsRef, roundsIn] = useInView<HTMLDivElement>();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const all: Match[] = [];
      for (let from = 0; from < 50_000; from += PAGE) {
        const { data, error } = await supabase
          .from("matches")
          .select("*")
          .not("tournament_name", "is", null)
          .order("created_at", { ascending: false })
          .range(from, from + PAGE - 1);
        if (error) {
          console.warn("[tournaments] could not read matches:", error.message);
          break;
        }
        const rows = (data ?? []) as Match[];
        all.push(...rows);
        if (rows.length < PAGE) break;
      }
      setMatches(all);
      setLoading(false);

      const names = Array.from(new Set(all.flatMap((m) => m.participants ?? [])));
      if (names.length) {
        const { data: profs } = await supabase.from("profiles").select("username, avatar_url").in("username", names.slice(0, 1000));
        const map: Record<string, string | null> = {};
        for (const p of (profs ?? []) as { username: string; avatar_url: string | null }[]) map[p.username] = p.avatar_url;
        setAvatars(map);
      }
    }
    load();
  }, [supabase]);

  // Tournaments, newest first, with their date range and size
  const tournaments = useMemo(() => {
    const byName = new Map<string, Match[]>();
    for (const m of matches) {
      if (!m.tournament_name) continue;
      const list = byName.get(m.tournament_name) ?? [];
      list.push(m);
      byName.set(m.tournament_name, list);
    }
    return Array.from(byName.entries()).map(([name, list]) => {
      const times = list.map((m) => new Date(m.created_at).getTime());
      return {
        name,
        list,
        first: Math.min(...times),
        last: Math.max(...times),
        players: new Set(list.flatMap((m) => m.participants ?? [])).size,
      };
    }).sort((a, b) => b.last - a.last);
  }, [matches]);

  // Open the tournament named in the URL (?t=…), otherwise the newest
  useEffect(() => {
    if (selected || tournaments.length === 0) return;
    const fromUrl = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("t") : null;
    setSelected(fromUrl && tournaments.some((x) => x.name === fromUrl) ? fromUrl : tournaments[0].name);
  }, [tournaments, selected]);

  function choose(name: string) {
    setSelected(name);
    setTrace(null);
    setPinned(null);
    const sp = new URLSearchParams(window.location.search);
    sp.set("t", name);
    window.history.replaceState(null, "", `${window.location.pathname}?${sp.toString()}`);
  }

  const current = tournaments.find((x) => x.name === selected) ?? null;
  const tournamentMatches = current?.list ?? [];

  const view = useMemo(() => {
    const standings = new Map<string, Row>();
    for (const m of tournamentMatches) {
      for (const p of m.participants ?? []) {
        const row = standings.get(p) ?? { username: p, wins: 0, losses: 0 };
        if ((m.winners ?? []).includes(p)) row.wins += 1;
        else row.losses += 1;
        standings.set(p, row);
      }
    }
    const ranked = Array.from(standings.values()).sort(
      (a, b) => b.wins - a.wins || a.losses - b.losses || a.username.localeCompare(b.username)
    );

    // Rounds in the order they were played
    const byRound = new Map<string, Match[]>();
    for (const m of tournamentMatches) {
      const key = m.round?.trim() || UNLABELED;
      const list = byRound.get(key) ?? [];
      list.push(m);
      byRound.set(key, list);
    }
    const rounds = Array.from(byRound.entries())
      .map(([name, list]) => ({
        name,
        list: [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        start: Math.min(...list.map((m) => new Date(m.created_at).getTime())),
      }))
      .sort((a, b) => a.start - b.start);

    // Champion = winners of the latest match in a round called "Final" (not semi/quarter)
    const isFinal = (r: string) => /final|نهائي|النهائي/i.test(r) && !/semi|quarter|نصف|ربع|1\/2|1\/4/i.test(r);
    const finalRound = [...rounds].reverse().find((r) => r.name !== UNLABELED && isFinal(r.name));
    const finalMatch = finalRound ? finalRound.list[finalRound.list.length - 1] : null;
    const champions = finalMatch ? finalMatch.winners ?? [] : ranked[0] ? [ranked[0].username] : [];
    const runnersUp = finalMatch ? (finalMatch.participants ?? []).filter((p) => !(finalMatch.winners ?? []).includes(p)) : [];

    return { ranked, rounds, champions, runnersUp, decided: !!finalMatch };
  }, [tournamentMatches]);

  const active = pinned ?? trace;
  const days = current ? Math.max(1, Math.round((current.last - current.first) / 86400000) + 1) : 0;
  const fmtDate = (ms: number) => new Date(ms).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  const roundLabel = (r: string) => (r === UNLABELED ? tx.unlabeled : r);

  return (
    <main className="min-h-screen w-full pb-24" style={{ background: C.void, color: C.paper }}>
      <style>{CSS}</style>

      {/* ================= HEADER ================= */}
      <header className="border-b" style={{ borderColor: C.line }}>
        <div className={`${WRAP} pb-10 pt-14 md:pt-20`}>
          <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>
            <Trophy size={14} aria-hidden="true" />
            {tx.eyebrow}
          </div>
          <h1 className="cz-display mt-3 text-5xl uppercase leading-none md:text-7xl" style={{ fontWeight: 700 }}>
            {tx.title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed" style={{ color: C.muted }}>
            {tx.sub}
          </p>
        </div>
      </header>

      <div className={WRAP}>
        {loading ? (
          <p className="py-16 text-sm" style={{ color: C.muted }} aria-live="polite">
            {tx.loading}
          </p>
        ) : tournaments.length === 0 ? (
          <div className="mt-10 border px-6 py-16 text-center" style={{ background: C.panel, borderColor: C.line }}>
            <Trophy size={36} className="mx-auto" style={{ color: C.lineStrong }} aria-hidden="true" />
            <p className="mx-auto mt-4 max-w-md text-sm" style={{ color: C.muted }}>
              {tx.empty}
            </p>
          </div>
        ) : (
          <>
            {/* ================= TOURNAMENT PICKER ================= */}
            <div className="czt-scroll -mx-2 mt-8 flex snap-x gap-3 overflow-x-auto px-2 pb-3" role="tablist" aria-label={tx.title}>
              {tournaments.map((tn, i) => {
                const on = tn.name === selected;
                return (
                  <button
                    key={tn.name}
                    role="tab"
                    aria-selected={on}
                    onClick={() => choose(tn.name)}
                    className="czt-pick czt-in w-[250px] shrink-0 snap-start border p-4 text-start"
                    style={{
                      animationDelay: `${i * 0.05}s`,
                      background: on ? "linear-gradient(160deg, rgba(232,166,61,0.14), #12150E 60%)" : C.panel,
                      borderColor: on ? C.amber : C.line,
                      boxShadow: on ? "0 0 26px rgba(232,166,61,0.15)" : "none",
                    }}
                  >
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest" style={{ color: on ? C.amber : C.muted }}>
                      <Trophy size={13} aria-hidden="true" />
                      {fmtDate(tn.last)}
                    </div>
                    <div className="cz-display mt-2 truncate text-xl uppercase" style={{ color: C.paper, fontWeight: 600 }} dir="auto">
                      {tn.name}
                    </div>
                    <div className="mt-2 flex gap-4 text-xs" style={{ color: C.muted }}>
                      <span className="inline-flex items-center gap-1"><Swords size={12} aria-hidden="true" />{tn.list.length}</span>
                      <span className="inline-flex items-center gap-1"><Users size={12} aria-hidden="true" />{tn.players}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {current && (
              <div key={current.name}>
                {/* ================= CHAMPION ================= */}
                <section className="czt-in czt-shine relative mt-6 overflow-hidden border" style={{ borderColor: C.amberDim, background: "linear-gradient(120deg, rgba(232,166,61,0.10), #12150E 45%, #0D100A)" }}>
                  <div aria-hidden="true" className="pointer-events-none absolute -top-40 end-[-6rem] h-[420px] w-[420px] opacity-60">
                    <div className="czt-rays absolute inset-0 rounded-full" style={{ background: "repeating-conic-gradient(from 0deg, rgba(232,166,61,0.10) 0deg 6deg, transparent 6deg 18deg)" }} />
                  </div>
                  {[["12%", "18%", "0s"], ["78%", "22%", "0.7s"], ["64%", "70%", "1.3s"], ["30%", "76%", "1.9s"], ["88%", "58%", "1s"]].map(([l, t, d], i) => (
                    <span key={i} aria-hidden="true" className="czt-spark" style={{ left: l, top: t, animationDelay: d }} />
                  ))}

                  <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:p-8">
                    <div className="czt-float flex h-24 w-24 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(232,166,61,0.12)", border: `1px solid ${C.amberDim}`, boxShadow: "0 0 40px rgba(232,166,61,0.25)" }}>
                      {view.decided ? <Trophy size={44} style={{ color: C.amber }} aria-hidden="true" /> : <Crown size={44} style={{ color: C.amber }} aria-hidden="true" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.amber }}>
                        <Sparkles size={13} aria-hidden="true" />
                        {view.decided ? (view.champions.length > 1 ? tx.champions : tx.champion) : tx.leader}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
                        {view.champions.map((p) => (
                          <Link key={p} href={`/profile/${p}`} className="group flex items-center gap-3">
                            <Avatar src={avatars[p]} size={52} ring={C.amber} />
                            <span className="cz-display text-3xl uppercase leading-none group-hover:underline md:text-4xl" style={{ fontWeight: 700 }}>
                              {p}
                            </span>
                          </Link>
                        ))}
                      </div>
                      {view.decided && view.runnersUp.length > 0 && (
                        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm" style={{ color: C.muted }}>
                          <Medal size={14} style={{ color: PODIUM[1] }} aria-hidden="true" />
                          {tx.runnerUp}:
                          {view.runnersUp.map((p, i) => (
                            <span key={p}>
                              {i > 0 && ", "}
                              <Link href={`/profile/${p}`} className="hover:underline" style={{ color: C.paper }}>{p}</Link>
                            </span>
                          ))}
                        </div>
                      )}
                      {!view.decided && (
                        <p className="mt-3 text-xs" style={{ color: C.muted }}>{tx.leaderHint}</p>
                      )}
                    </div>
                  </div>
                </section>

                {/* ================= STATS ================= */}
                <div className="czt-in mt-4 grid grid-cols-2 gap-px border sm:grid-cols-4" style={{ background: C.line, borderColor: C.line, animationDelay: "0.1s" }}>
                  {[
                    { icon: Swords, label: tx.matches, value: tournamentMatches.length },
                    { icon: Users, label: tx.players, value: current.players },
                    { icon: Layers, label: tx.rounds, value: view.rounds.length },
                    { icon: CalendarDays, label: tx.days, value: days, sub: `${fmtDate(current.first)} → ${fmtDate(current.last)}` },
                  ].map((s) => (
                    <div key={s.label} className="px-5 py-4" style={{ background: C.panel }}>
                      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>
                        <s.icon size={12} aria-hidden="true" />
                        {s.label}
                      </div>
                      <div className="cz-display mt-1 text-4xl leading-none tabular-nums" style={{ color: C.amber, fontWeight: 700 }}>
                        <CountUp value={s.value} />
                      </div>
                      {s.sub && <div className="mt-1.5 text-[11px]" style={{ color: C.muted }} dir="ltr">{s.sub}</div>}
                    </div>
                  ))}
                </div>

                <div className="mt-10 grid gap-8 lg:grid-cols-[380px_1fr]">
                  {/* ================= STANDINGS ================= */}
                  <section ref={standRef}>
                    <Title icon={Medal}>{tx.standings}</Title>
                    <div className="flex flex-col gap-px border" style={{ background: C.line, borderColor: C.line }}>
                      {view.ranked.map((p, i) => {
                        const total = p.wins + p.losses;
                        const wr = total > 0 ? Math.round((p.wins / total) * 100) : 0;
                        const on = active === p.username;
                        return (
                          <button
                            key={p.username}
                            onMouseEnter={() => setTrace(p.username)}
                            onMouseLeave={() => setTrace(null)}
                            onFocus={() => setTrace(p.username)}
                            onBlur={() => setTrace(null)}
                            onClick={() => setPinned((x) => (x === p.username ? null : p.username))}
                            aria-pressed={pinned === p.username}
                            className="czt-in grid grid-cols-[36px_1fr_auto] items-center gap-3 px-4 py-3 text-start transition-colors"
                            style={{
                              animationDelay: `${Math.min(i, 12) * 0.04}s`,
                              background: on ? "rgba(232,166,61,0.10)" : C.panel,
                              borderInlineStart: `3px solid ${i < 3 ? PODIUM[i] : "transparent"}`,
                            }}
                          >
                            <span className="cz-display text-xl tabular-nums" style={{ color: i < 3 ? PODIUM[i] : C.muted, fontWeight: 700 }}>
                              {i + 1}
                            </span>
                            <span className="flex min-w-0 items-center gap-2.5">
                              <Avatar src={avatars[p.username]} size={28} ring={i < 3 ? PODIUM[i] : undefined} />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm" style={{ color: C.paper, fontWeight: 600 }}>{p.username}</span>
                                <span className="mt-1 block h-1 w-full" style={{ background: "rgba(248,113,113,0.3)" }} dir="ltr">
                                  <span className={`czt-bar block h-full ${standIn ? "on" : ""}`} style={{ width: `${wr}%`, background: WIN, transitionDelay: `${Math.min(i, 12) * 0.05}s` }} />
                                </span>
                              </span>
                            </span>
                            <span className="text-end text-xs tabular-nums">
                              <span style={{ color: WIN }}>{p.wins}{tx.W}</span>{" "}
                              <span style={{ color: LOSS }}>{p.losses}{tx.L}</span>
                              <span className="block" style={{ color: C.muted }}>{wr}%</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  {/* ================= ROUNDS ================= */}
                  <section ref={roundsRef} className="min-w-0">
                    <Title
                      icon={Layers}
                      right={
                        active ? (
                          <button onClick={() => { setPinned(null); setTrace(null); }} className="inline-flex min-h-[36px] items-center gap-2 border px-3 text-xs uppercase tracking-widest" style={{ borderColor: C.amber, color: C.amber }}>
                            {tx.tracing(active)} · {tx.clear}
                          </button>
                        ) : (
                          <span className="text-xs" style={{ color: C.muted }}>{tx.traceHint}</span>
                        )
                      }
                    >
                      {tx.bracket}
                    </Title>

                    <div className="czt-scroll -mx-2 flex gap-0 overflow-x-auto px-2 pb-4">
                      {view.rounds.map((r, ri) => (
                        <div key={r.name} className="flex shrink-0 items-stretch">
                          <div className="w-[280px]">
                            <div className="mb-3 flex items-center justify-between border-b pb-2" style={{ borderColor: C.line }}>
                              <span className="cz-display truncate text-lg uppercase" style={{ color: ri === view.rounds.length - 1 ? C.amber : C.paper, fontWeight: 600 }} dir="auto">
                                {roundLabel(r.name)}
                              </span>
                              <span className="text-xs tabular-nums" style={{ color: C.muted }}>{r.list.length}</span>
                            </div>
                            <div className="flex flex-col gap-3">
                              {r.list.map((m, mi) => {
                                const winners = m.winners ?? [];
                                const losers = (m.participants ?? []).filter((p) => !winners.includes(p));
                                const involved = !!active && (m.participants ?? []).includes(active);
                                const wonIt = !!active && winners.includes(active);
                                return (
                                  <article
                                    key={m.id}
                                    className="czt-match czt-in border"
                                    style={{
                                      animationDelay: `${ri * 0.12 + mi * 0.05}s`,
                                      background: C.panel,
                                      borderColor: involved ? (wonIt ? WIN : LOSS) : C.line,
                                      opacity: active && !involved ? 0.3 : 1,
                                      boxShadow: involved ? `0 0 20px ${wonIt ? "rgba(143,191,79,0.22)" : "rgba(248,113,113,0.18)"}` : "none",
                                      transform: involved ? "translateY(-2px)" : "none",
                                    }}
                                  >
                                    <div className="px-3 py-2" style={{ borderInlineStart: `3px solid ${WIN}` }}>
                                      {winners.map((p) => (
                                        <Link key={p} href={`/profile/${p}`} className="flex items-center gap-2 py-0.5 text-sm hover:underline" style={{ color: p === active ? C.amber : C.paper, fontWeight: p === active ? 700 : 500 }}>
                                          <Avatar src={avatars[p]} size={20} />
                                          <span className="truncate">{p}</span>
                                        </Link>
                                      ))}
                                    </div>
                                    <div className="border-t px-3 py-2" style={{ borderColor: C.line, borderInlineStart: `3px solid ${C.lineStrong}` }}>
                                      {losers.length ? losers.map((p) => (
                                        <Link key={p} href={`/profile/${p}`} className="flex items-center gap-2 py-0.5 text-sm hover:underline" style={{ color: p === active ? C.amber : C.muted, fontWeight: p === active ? 700 : 400 }}>
                                          <Avatar src={avatars[p]} size={20} />
                                          <span className="truncate">{p}</span>
                                        </Link>
                                      )) : <span className="text-sm" style={{ color: C.muted }}>—</span>}
                                    </div>
                                    <div className="flex items-center gap-2 border-t px-3 py-1.5 text-[11px]" style={{ borderColor: C.line, color: C.muted }}>
                                      <span className="uppercase tracking-widest" style={{ color: C.amber }}>{m.mode}</span>
                                      {m.map && (
                                        <span className="inline-flex min-w-0 items-center gap-1 truncate">
                                          <MapIcon size={11} aria-hidden="true" />
                                          {m.map}
                                        </span>
                                      )}
                                      {m.replay_url && (
                                        <a href={m.replay_url} target="_blank" rel="noopener noreferrer" aria-label={tx.replay} title={tx.replay} className="ms-auto inline-flex h-7 w-7 items-center justify-center hover:bg-[#171B10]" style={{ color: C.amber }}>
                                          <Download size={13} aria-hidden="true" />
                                        </a>
                                      )}
                                    </div>
                                  </article>
                                );
                              })}
                            </div>
                          </div>
                          {/* connector to the next round */}
                          {ri < view.rounds.length - 1 && (
                            <div className="flex w-10 shrink-0 items-start pt-[70px]" aria-hidden="true">
                              <span className={`czt-link block h-[2px] w-full ${roundsIn ? "on" : ""}`} style={{ background: `linear-gradient(90deg, ${C.lineStrong}, ${C.amberDim})`, transitionDelay: `${0.3 + ri * 0.15}s` }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
