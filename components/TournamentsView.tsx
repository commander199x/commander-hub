"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Radio, Trophy, ArrowUpRight, Crown, Swords, Users, CalendarDays, Sparkles, Medal, Timer } from "lucide-react";
import { C, DISCORD_URL } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// UPCOMING EVENTS (optional)
// These are the placeholder events from before. They stay hidden until you set
// SHOW_EVENTS to true. Add a `date` (e.g. "2026-11-20T18:00:00Z") to show a live countdown.
// Past tournaments and their champions appear automatically from logged matches.
// ---------------------------------------------------------------------------
const SHOW_EVENTS = false;

type Status = "Registration Open" | "Coming Soon" | "Active";

interface Event {
  name: string;
  status: Status;
  info: string;
  date?: string;
}

const events: Event[] = [
  { name: "Commander Tournament 2026", status: "Registration Open", info: "1v1 and team battles." },
  { name: "Clan Championship", status: "Coming Soon", info: "International Generals Zero Hour event." },
  { name: "Weekly Community War", status: "Active", info: "Play with the best players." },
];

type TMatch = { id: string; participants: string[] | null; winners: string[] | null; tournament_name: string | null; round: string | null; created_at: string };

const WRAP = "mx-auto max-w-[1312px] px-6 md:px-16";
const PAGE = 1000;

// Arabic needs a native review.
const TEXT = {
  en: {
    held: "Tournaments held",
    matches: "Tournament matches",
    players: "Competitors",
    crowned: "Champions crowned",
    standings: "View standings",
    upcoming: "Upcoming events",
    hall: "Hall of champions",
    hallSub: "Every tournament logged on Commander and who took the crown.",
    champion: "Champion",
    leader: "Leader",
    open: "Open standings",
    days: "d",
    hours: "h",
    mins: "m",
    secs: "s",
    liveNow: "Live now",
    startsIn: "Starts in",
    nextEvent: "Next event",
    nextEventDesc: "The next tournament will be announced on Discord. Join so you don't miss registration.",
  },
  ar: {
    held: "البطولات المُقامة",
    matches: "مباريات البطولات",
    players: "المتنافسون",
    crowned: "الأبطال المتوَّجون",
    standings: "عرض الترتيب",
    upcoming: "البطولات القادمة",
    hall: "قاعة الأبطال",
    hallSub: "كل بطولة سُجّلت في كوماندر ومن نال لقبها.",
    champion: "البطل",
    leader: "المتصدّر",
    open: "افتح الترتيب",
    days: "ي",
    hours: "س",
    mins: "د",
    secs: "ث",
    liveNow: "مباشر الآن",
    startsIn: "تبدأ خلال",
    nextEvent: "البطولة القادمة",
    nextEventDesc: "سيتم الإعلان عن البطولة القادمة على ديسكورد. انضم حتى لا يفوتك التسجيل.",
  },
};

const CSS = `
@keyframes czh-in { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes czh-rays { to { transform: rotate(360deg); } }
@keyframes czh-float { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-10px) rotate(2deg); } }
@keyframes czh-twinkle { 0%, 100% { opacity: 0; transform: scale(0.3) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes czh-shine { 0% { transform: translateX(-130%) skewX(-20deg); } 55%, 100% { transform: translateX(240%) skewX(-20deg); } }
@keyframes czh-tick { from { transform: translateY(-40%); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes czh-orbit { to { transform: rotate(360deg); } }
.czh-in { animation: czh-in 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czh-rays { animation: czh-rays 22s linear infinite; }
.czh-float { animation: czh-float 4s ease-in-out infinite; }
.czh-spark { position: absolute; width: 8px; height: 8px; background: #E8A63D; clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%); animation: czh-twinkle 2.6s ease-in-out infinite; }
.czh-card { position: relative; overflow: hidden; transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease; }
.czh-card:hover { transform: translateY(-5px); border-color: #8A6425 !important; box-shadow: 0 18px 40px rgba(0,0,0,0.35), 0 0 30px rgba(232,166,61,0.12); }
.czh-card::after { content: ""; position: absolute; top: 0; bottom: 0; width: 35%; pointer-events: none; transform: translateX(-130%) skewX(-20deg);
  background: linear-gradient(90deg, transparent, rgba(232,166,61,0.16), transparent); }
.czh-card:hover::after { animation: czh-shine 1s ease; }
.czh-tick { display: inline-block; animation: czh-tick 0.35s ease-out both; }
.czh-orbit { animation: czh-orbit 9s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .czh-in, .czh-rays, .czh-float, .czh-spark, .czh-tick, .czh-orbit, .czh-card:hover::after { animation: none !important; }
  .czh-card { transition: none !important; }
  .czh-card:hover { transform: none !important; }
}
`;

function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return setShown(value);
    let raf = 0;
    const start = performance.now();
    setShown(0);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1000);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{shown}</>;
}

function Countdown({ date, tx }: { date: string; tx: (typeof TEXT)["en"] }) {
  const target = new Date(date).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now === null || !Number.isFinite(target)) return null;
  const diff = Math.max(0, target - now);
  if (diff === 0) {
    return (
      <span className="inline-flex items-center gap-2 text-sm uppercase tracking-widest" style={{ color: C.radar, fontWeight: 700 }}>
        <span className="cz-blink inline-block h-2 w-2 rounded-full" style={{ background: C.radar }} />
        {tx.liveNow}
      </span>
    );
  }
  const parts = [
    [Math.floor(diff / 86400000), tx.days],
    [Math.floor(diff / 3600000) % 24, tx.hours],
    [Math.floor(diff / 60000) % 60, tx.mins],
    [Math.floor(diff / 1000) % 60, tx.secs],
  ] as const;
  return (
    <div className="flex gap-2" dir="ltr" aria-label={tx.startsIn}>
      {parts.map(([v, u], i) => (
        <div key={i} className="min-w-[52px] border px-2 py-1.5 text-center" style={{ borderColor: C.amberDim, background: C.void }}>
          <span key={v} className="czh-tick cz-display text-2xl leading-none tabular-nums" style={{ color: C.amber, fontWeight: 700 }}>
            {String(v).padStart(2, "0")}
          </span>
          <span className="ms-0.5 text-[10px] uppercase" style={{ color: C.muted }}>{u}</span>
        </div>
      ))}
    </div>
  );
}

const STATUS_STYLE: Record<Status, { color: string; live: boolean }> = {
  "Registration Open": { color: C.radar, live: true },
  Active: { color: C.radar, live: true },
  "Coming Soon": { color: C.muted, live: false },
};

export default function TournamentsView() {
  const { t, locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];

  const STATUS_LABEL: Record<Status, string> = {
    "Registration Open": t("tournaments.statusRegistrationOpen"),
    Active: t("tournaments.statusActive"),
    "Coming Soon": t("tournaments.statusComingSoon"),
  };

  const [matches, setMatches] = useState<TMatch[]>([]);
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const all: TMatch[] = [];
      for (let from = 0; from < 50_000; from += PAGE) {
        const { data, error } = await supabase
          .from("matches")
          .select("id, participants, winners, tournament_name, round, created_at")
          .not("tournament_name", "is", null)
          .order("created_at", { ascending: false })
          .range(from, from + PAGE - 1);
        if (error) {
          console.warn("[tournaments] could not read matches:", error.message);
          break;
        }
        const rows = (data ?? []) as TMatch[];
        all.push(...rows);
        if (rows.length < PAGE) break;
      }
      if (cancelled) return;
      setMatches(all);
      setLoaded(true);
      const names = Array.from(new Set(all.flatMap((m) => m.winners ?? [])));
      if (names.length) {
        const { data } = await supabase.from("profiles").select("username, avatar_url").in("username", names.slice(0, 500));
        const map: Record<string, string | null> = {};
        for (const p of (data ?? []) as { username: string; avatar_url: string | null }[]) map[p.username] = p.avatar_url;
        if (!cancelled) setAvatars(map);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Each tournament with its champion (winners of the latest "Final"), or its leader
  const hall = useMemo(() => {
    const by = new Map<string, TMatch[]>();
    for (const m of matches) {
      if (!m.tournament_name) continue;
      const list = by.get(m.tournament_name) ?? [];
      list.push(m);
      by.set(m.tournament_name, list);
    }
    const isFinal = (r: string) => /final|نهائي/i.test(r) && !/semi|quarter|نصف|ربع|1\/2|1\/4/i.test(r);
    return Array.from(by.entries())
      .map(([name, list]) => {
        const times = list.map((m) => new Date(m.created_at).getTime());
        const finals = list.filter((m) => m.round && isFinal(m.round)).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        let champs: string[] = [];
        let decided = false;
        if (finals[0]) {
          champs = finals[0].winners ?? [];
          decided = true;
        } else {
          const wins = new Map<string, number>();
          for (const m of list) for (const w of m.winners ?? []) wins.set(w, (wins.get(w) ?? 0) + 1);
          const top = Array.from(wins.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
          champs = top ? [top[0]] : [];
        }
        return {
          name,
          matches: list.length,
          players: new Set(list.flatMap((m) => m.participants ?? [])).size,
          first: Math.min(...times),
          last: Math.max(...times),
          champs,
          decided,
        };
      })
      .sort((a, b) => b.last - a.last);
  }, [matches]);

  const totals = useMemo(
    () => ({
      held: hall.length,
      matches: matches.length,
      players: new Set(matches.flatMap((m) => m.participants ?? [])).size,
      crowned: new Set(hall.filter((h) => h.decided).flatMap((h) => h.champs)).size,
    }),
    [hall, matches]
  );

  const shownEvents = SHOW_EVENTS ? events : [];
  const activeCount = shownEvents.filter((e) => e.status !== "Coming Soon").length;
  const fmt = (ms: number) => new Date(ms).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  const nothingYet = loaded && hall.length === 0 && shownEvents.length === 0;

  return (
    <main className="min-h-screen w-full cz-grid-bg pb-24" style={{ color: C.paper }}>
      <style>{CSS}</style>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b" style={{ borderColor: C.line }}>
        <div aria-hidden="true" className="pointer-events-none absolute end-[-10%] top-1/2 h-[720px] w-[720px] -translate-y-1/2 opacity-70">
          <div className="czh-rays absolute inset-0 rounded-full" style={{ background: "repeating-conic-gradient(from 0deg, rgba(232,166,61,0.09) 0deg 5deg, transparent 5deg 15deg)", maskImage: "radial-gradient(circle, black 20%, transparent 68%)", WebkitMaskImage: "radial-gradient(circle, black 20%, transparent 68%)" }} />
        </div>
        {[["8%", "22%", "0s"], ["46%", "12%", "1.1s"], ["70%", "30%", "0.5s"], ["86%", "70%", "1.7s"], ["58%", "78%", "2.2s"], ["30%", "82%", "0.9s"]].map(([l, tp, d], i) => (
          <span key={i} aria-hidden="true" className="czh-spark" style={{ left: l, top: tp, animationDelay: d }} />
        ))}

        <div className={`${WRAP} relative grid gap-10 pb-14 pt-14 md:pt-20 lg:grid-cols-[1fr_auto] lg:items-center`}>
          <div className="czh-in">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>
              <Radio size={14} className="cz-live" aria-hidden="true" />
              <span>{t("common.fieldComms")}</span>
            </div>
            <h1 className="cz-display mt-3 uppercase leading-[0.9]" style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)", fontWeight: 700 }}>
              <span style={{ color: C.amber }}>{t("tournaments.title")}</span>
            </h1>
            <p className="mt-4 text-sm uppercase tracking-widest" style={{ color: C.muted }}>
              {t("tournaments.tags")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/tournaments/standings"
                className="inline-flex min-h-[52px] items-center gap-2 px-7 text-sm uppercase tracking-[0.12em]"
                style={{ background: C.amber, color: C.void, fontWeight: 700, boxShadow: "0 0 34px rgba(232,166,61,0.3)" }}
              >
                <Medal size={16} aria-hidden="true" />
                {tx.standings}
              </Link>
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[52px] items-center gap-2 border px-6 text-sm uppercase tracking-[0.12em] transition-colors hover:bg-[#171B10]"
                style={{ borderColor: C.amberDim, color: C.paper, fontWeight: 600 }}
              >
                {t("tournaments.getNotified")}
                <ArrowUpRight size={15} className="rtl:-scale-x-100" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* floating trophy with orbiting ring */}
          <div className="relative mx-auto hidden h-64 w-64 items-center justify-center lg:flex" aria-hidden="true">
            <div className="czh-orbit absolute inset-0 rounded-full" style={{ border: `1px dashed ${C.amberDim}` }}>
              <span className="absolute -top-1.5 start-1/2 h-3 w-3 -translate-x-1/2 rounded-full" style={{ background: C.amber, boxShadow: "0 0 14px #E8A63D" }} />
            </div>
            <div className="absolute inset-8 rounded-full" style={{ border: `1px solid ${C.line}`, background: "radial-gradient(circle, rgba(232,166,61,0.18), transparent 70%)" }} />
            <Trophy size={110} className="czh-float" style={{ color: C.amber, filter: "drop-shadow(0 0 24px rgba(232,166,61,0.45))" }} />
          </div>
        </div>

        {/* stats */}
        <div className={`${WRAP} relative pb-10`}>
          <div className="czh-in grid grid-cols-2 gap-px border sm:grid-cols-4" style={{ background: C.line, borderColor: C.line, animationDelay: "0.15s" }}>
            {[
              { icon: Trophy, label: tx.held, value: totals.held },
              { icon: Swords, label: tx.matches, value: totals.matches },
              { icon: Users, label: tx.players, value: totals.players },
              { icon: Crown, label: tx.crowned, value: totals.crowned },
            ].map((s) => (
              <div key={s.label} className="px-5 py-4" style={{ background: C.panel }}>
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>
                  <s.icon size={12} aria-hidden="true" />
                  {s.label}
                </div>
                <div className="cz-display mt-1 text-4xl leading-none tabular-nums" style={{ color: C.amber, fontWeight: 700 }}>
                  {loaded ? <CountUp value={s.value} /> : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className={WRAP}>
        {/* ================= UPCOMING ================= */}
        <section className="mt-14">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <h2 className="cz-display flex items-center gap-2.5 text-3xl uppercase md:text-4xl" style={{ fontWeight: 600 }}>
              <CalendarDays size={22} style={{ color: C.amber }} aria-hidden="true" />
              {tx.upcoming}
            </h2>
            {shownEvents.length > 0 && (
              <span className="text-xs uppercase tracking-widest" style={{ color: C.muted }}>
                {t("tournaments.eventsLabel")} <b style={{ color: C.paper }}>{String(shownEvents.length).padStart(2, "0")}</b>
                <span className="mx-3">·</span>
                {t("tournaments.openNowLabel")} <b style={{ color: C.radar }}>{String(activeCount).padStart(2, "0")}</b>
              </span>
            )}
          </div>

          {shownEvents.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {shownEvents.map((event, i) => {
                const st = STATUS_STYLE[event.status];
                return (
                  <div key={event.name} className="czh-card czh-in border p-6" style={{ background: C.panel, borderColor: C.line, animationDelay: `${i * 0.08}s` }}>
                    <div className="flex items-center justify-between">
                      <Trophy size={24} style={{ color: C.amber }} aria-hidden="true" />
                      <span className="flex items-center gap-1.5 border px-2 py-1 text-[10px] uppercase tracking-widest" style={{ borderColor: C.lineStrong, color: st.color }}>
                        <span className={st.live ? "cz-live" : ""} style={{ width: 6, height: 6, borderRadius: "50%", background: st.color, display: "inline-block" }} />
                        {STATUS_LABEL[event.status]}
                      </span>
                    </div>
                    <h3 className="cz-display mt-5 text-2xl uppercase" style={{ fontWeight: 600 }}>{event.name}</h3>
                    <p className="mt-2 text-sm" style={{ color: C.muted }}>{event.info}</p>
                    {event.date && (
                      <div className="mt-5">
                        <div className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>
                          <Timer size={12} aria-hidden="true" />
                          {tx.startsIn}
                        </div>
                        <Countdown date={event.date} tx={tx} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="czh-card czh-in group flex flex-col gap-5 border p-6 md:flex-row md:items-center md:p-8"
              style={{ background: "linear-gradient(120deg, rgba(143,191,79,0.08), #12150E 50%)", borderColor: C.line }}
            >
              <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full" style={{ border: `1px solid rgba(143,191,79,0.5)` }} aria-hidden="true">
                <span className="czh-orbit absolute inset-0 rounded-full" style={{ background: "conic-gradient(from 0deg, rgba(143,191,79,0) 0deg, rgba(143,191,79,0) 280deg, rgba(143,191,79,0.55) 360deg)" }} />
                <Radio size={24} style={{ color: C.radar }} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>{tx.nextEvent}</div>
                <div className="cz-display mt-1 text-2xl uppercase md:text-3xl" style={{ fontWeight: 600 }}>{t("tournaments.comingSoon")}</div>
                <p className="mt-2 max-w-xl text-sm" style={{ color: C.muted }}>{tx.nextEventDesc}</p>
              </div>
              <span className="inline-flex min-h-[44px] shrink-0 items-center gap-2 px-5 text-xs uppercase tracking-widest" style={{ background: C.amber, color: C.void, fontWeight: 700 }}>
                {t("tournaments.getNotified")}
                <ArrowUpRight size={14} className="rtl:-scale-x-100" aria-hidden="true" />
              </span>
            </a>
          )}
        </section>

        {/* ================= HALL OF CHAMPIONS ================= */}
        <section className="mt-16">
          <h2 className="cz-display flex items-center gap-2.5 text-3xl uppercase md:text-4xl" style={{ fontWeight: 600 }}>
            <Crown size={22} style={{ color: C.amber }} aria-hidden="true" />
            {tx.hall}
          </h2>
          <p className="mt-2 text-sm" style={{ color: C.muted }}>{tx.hallSub}</p>

          {!loaded ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
              {[0, 1, 2].map((i) => <div key={i} className="h-56 border" style={{ background: C.panel, borderColor: C.line, opacity: 0.6 }} />)}
            </div>
          ) : nothingYet ? (
            <div className="mt-6 border px-6 py-14 text-center" style={{ background: C.panel, borderColor: C.line }}>
              <Trophy size={36} className="mx-auto" style={{ color: C.lineStrong }} aria-hidden="true" />
              <p className="mx-auto mt-4 max-w-md text-sm" style={{ color: C.muted }}>{t("tournaments.comingSoonDesc")}</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {hall.map((h, i) => (
                <Link
                  key={h.name}
                  href={`/tournaments/standings?t=${encodeURIComponent(h.name)}`}
                  className="czh-card czh-in group flex flex-col border"
                  style={{ background: i === 0 ? "linear-gradient(160deg, rgba(232,166,61,0.12), #12150E 55%)" : C.panel, borderColor: i === 0 ? C.amberDim : C.line, animationDelay: `${Math.min(i, 9) * 0.07}s` }}
                >
                  <div className="flex items-center justify-between border-b px-5 py-3 text-[11px] uppercase tracking-widest" style={{ borderColor: C.line, color: C.muted }}>
                    <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} aria-hidden="true" />{fmt(h.last)}</span>
                    <span className="inline-flex items-center gap-3">
                      <span className="inline-flex items-center gap-1"><Swords size={12} aria-hidden="true" />{h.matches}</span>
                      <span className="inline-flex items-center gap-1"><Users size={12} aria-hidden="true" />{h.players}</span>
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="cz-display text-2xl uppercase leading-tight" style={{ fontWeight: 600 }} dir="auto">{h.name}</h3>
                    <div className="mt-5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em]" style={{ color: C.amber }}>
                      {h.decided ? <Trophy size={13} aria-hidden="true" /> : <Sparkles size={13} aria-hidden="true" />}
                      {h.decided ? tx.champion : tx.leader}
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex -space-x-3 rtl:space-x-reverse">
                        {h.champs.slice(0, 4).map((p) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={p} src={avatars[p] || "/default-avatar.svg"} alt="" className="h-11 w-11 rounded-full object-cover" style={{ border: `2px solid ${C.amber}`, background: C.void }} />
                        ))}
                      </div>
                      <div className="min-w-0 truncate text-base" style={{ color: C.paper, fontWeight: 600 }}>
                        {h.champs.join(", ") || "—"}
                      </div>
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs uppercase tracking-widest" style={{ borderColor: C.line, color: C.amber, fontWeight: 600, marginTop: "1.25rem" }}>
                      <span>{tx.open}</span>
                      <ArrowUpRight size={15} className="rtl:-scale-x-100 transition-transform group-hover:-translate-y-0.5" aria-hidden="true" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
