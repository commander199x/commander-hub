"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Trophy, Crown, Swords, Activity, Flame, ClipboardCopy, Check, CalendarClock, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { computeTeamMatchDeltas, computeFfaMatchDeltas, DEFAULT_RATING } from "@/lib/elo";
import TankSpinner from "@/components/TankSpinner";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const MIN_MATCHES_FOR_RANK = 3;
const PAGE = 1000;
const WRAP = "mx-auto max-w-[1312px] px-6 md:px-16";
const PODIUM = [C.amber, "#C9CCC0", "#B87333"];

type Match = {
  mode: "2v2" | "3v3" | "4v4" | "ffa";
  participants: string[];
  winners: string[];
  created_at: string;
};

type StandingRow = { username: string; rating: number; wins: number; losses: number };

// Arabic needs a native review.
const TEXT = {
  en: {
    eyebrow: "Hall of Fame",
    title: "Season 1",
    sub: "Final results",
    ended: (d: string) => `Season ended ${d}`,
    team: "Team champions",
    ffa: "FFA champions",
    none: "No qualifying players.",
    mostActive: "Most active",
    matchesPlayed: (n: number) => `${n} matches played`,
    streak: "Longest win streak",
    inARow: (n: number, m: string) => `${n} wins in a row (${m})`,
    total: "Total matches",
    thisSeason: "played this season",
    copy: "Copy Discord announcement",
    copied: "Copied! Paste it into Discord",
    leaderboard: "Current season leaderboard",
    loading: "Replaying Season 1 history...",
    missingReset: "Couldn't find a 'reset_season_ratings' entry in the audit log. Make sure you ran the reset through the admin panel (not directly in the database).",
  },
  ar: {
    eyebrow: "قاعة المشاهير",
    title: "الموسم 1",
    sub: "النتائج النهائية",
    ended: (d: string) => `انتهى الموسم في ${d}`,
    team: "أبطال الفرق",
    ffa: "أبطال FFA",
    none: "لا يوجد لاعبون مؤهَّلون.",
    mostActive: "الأكثر نشاطاً",
    matchesPlayed: (n: number) => `${n} مباراة`,
    streak: "أطول سلسلة انتصارات",
    inARow: (n: number, m: string) => `${n} انتصارات متتالية (${m})`,
    total: "مجموع المباريات",
    thisSeason: "لُعبت هذا الموسم",
    copy: "نسخ إعلان ديسكورد",
    copied: "تم النسخ! الصقه في ديسكورد",
    leaderboard: "ترتيب الموسم الحالي",
    loading: "جارٍ إعادة تشغيل تاريخ الموسم 1...",
    missingReset: "تعذّر العثور على سجل 'reset_season_ratings' في سجل التدقيق. تأكد من أنك أعدت الضبط من لوحة الإدارة وليس من قاعدة البيانات مباشرة.",
  },
};

const CSS = `
@keyframes czs-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
@keyframes czs-rise { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes czs-rays { to { transform: rotate(360deg); } }
@keyframes czs-twinkle { 0%, 100% { opacity: 0; transform: scale(0.3) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes czs-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes czs-pop { 0% { opacity: 0; transform: scale(0.5) translateY(10px); } 70% { transform: scale(1.08); } 100% { opacity: 1; transform: none; } }
.czs-in { animation: czs-in 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czs-rise { transform-origin: bottom; animation: czs-rise 1s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czs-rays { animation: czs-rays 24s linear infinite; }
.czs-spark { position: absolute; width: 8px; height: 8px; background: #E8A63D; clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%); animation: czs-twinkle 2.6s ease-in-out infinite; }
.czs-float { animation: czs-float 3.4s ease-in-out infinite; }
.czs-pop { animation: czs-pop 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czs-award { transition: transform 0.3s ease, border-color 0.3s ease; }
.czs-award:hover { transform: translateY(-5px); border-color: #8A6425 !important; }
@media (prefers-reduced-motion: reduce) {
  .czs-in, .czs-rise, .czs-rays, .czs-spark, .czs-float, .czs-pop { animation: none !important; }
  .czs-award { transition: none !important; }
  .czs-award:hover { transform: none !important; }
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
      const p = Math.min(1, (now - start) / 1300);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{shown.toLocaleString("en")}</>;
}

function Podium({ title, icon: Icon, rows, avatars, noneText, delay }: { title: string; icon: typeof Trophy; rows: StandingRow[]; avatars: Record<string, string | null>; noneText: string; delay: number }) {
  // Display order 2 · 1 · 3 with rising pillars
  const slots = [1, 0, 2].filter((i) => rows[i]);
  const heights = [168, 120, 92];
  return (
    <section className="czs-in border p-6" style={{ background: C.panel, borderColor: C.line, animationDelay: `${delay}s` }}>
      <h2 className="cz-display flex items-center gap-2.5 text-2xl uppercase" style={{ fontWeight: 600 }}>
        <Icon size={20} style={{ color: C.amber }} aria-hidden="true" />
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm" style={{ color: C.muted }}>{noneText}</p>
      ) : (
        <div className="mt-6 flex items-end justify-center gap-3" dir="ltr">
          {slots.map((i, k) => {
            const p = rows[i];
            return (
              <Link key={p.username} href={`/profile/${p.username}`} className="group flex w-1/3 max-w-[150px] flex-col items-center">
                <div className="czs-pop flex flex-col items-center" style={{ animationDelay: `${delay + 0.7 + k * 0.15}s` }}>
                  {i === 0 && <Crown size={22} className="czs-float mb-1" style={{ color: C.amber }} aria-hidden="true" />}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatars[p.username] || "/default-avatar.svg"} alt="" className="rounded-full object-cover transition-transform group-hover:scale-105" style={{ width: i === 0 ? 72 : 56, height: i === 0 ? 72 : 56, border: `3px solid ${PODIUM[i]}`, boxShadow: i === 0 ? "0 0 26px rgba(232,166,61,0.45)" : "none" }} />
                  <div className="mt-2 max-w-full truncate text-center text-sm group-hover:underline" style={{ fontWeight: 700 }}>{p.username}</div>
                  <div className="cz-display text-xl tabular-nums leading-none" style={{ color: PODIUM[i], fontWeight: 700 }}>{Math.round(p.rating)}</div>
                  <div className="mb-2 text-[11px] tabular-nums" style={{ color: C.muted }}>{p.wins}W · {p.losses}L</div>
                </div>
                <div
                  className="czs-rise flex w-full items-start justify-center pt-2"
                  style={{ height: heights[i], animationDelay: `${delay + 0.2 + k * 0.12}s`, background: `linear-gradient(180deg, ${PODIUM[i]}33, ${PODIUM[i]}0d)`, borderTop: `3px solid ${PODIUM[i]}` }}
                >
                  <span className="cz-display text-4xl" style={{ color: PODIUM[i], fontWeight: 700 }}>{i + 1}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function Season1SummaryPage() {
  const supabase = createClient();
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [teamStandings, setTeamStandings] = useState<StandingRow[]>([]);
  const [ffaStandings, setFfaStandings] = useState<StandingRow[]>([]);
  const [mostActive, setMostActive] = useState<{ username: string; matches: number } | null>(null);
  const [longestStreak, setLongestStreak] = useState<{ username: string; streak: number; mode: string } | null>(null);
  const [totalMatches, setTotalMatches] = useState(0);
  const [seasonEnd, setSeasonEnd] = useState<string>("");
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});
  const [copied, setCopied] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    async function compute() {
      // Pull the EXACT reset timestamp from the audit log itself, rather
      // than guessing — avoids any timezone conversion errors entirely.
      const { data: resetEntry, error: resetError } = await supabase
        .from("admin_audit_log")
        .select("created_at")
        .eq("action", "reset_season_ratings")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (resetError || !resetEntry) {
        setErrorMsg("missing");
        setLoading(false);
        return;
      }

      const end = resetEntry.created_at as string;
      setSeasonEnd(end);

      // Read every match before the reset, in pages (Supabase returns max 1000 rows per request)
      const matches: Match[] = [];
      for (let from = 0; from < 100_000; from += PAGE) {
        const { data: matchData, error } = await supabase
          .from("matches")
          .select("mode, participants, winners, created_at")
          .lt("created_at", end)
          .order("created_at", { ascending: true }) // oldest first, required for correct replay
          .range(from, from + PAGE - 1);
        if (error) break;
        const rows = (matchData ?? []) as Match[];
        matches.push(...rows.filter((m) => Array.isArray(m.participants) && Array.isArray(m.winners)));
        if (rows.length < PAGE) break;
      }
      setTotalMatches(matches.length);

      function buildView(isTeamView: boolean) {
        const relevant = matches.filter((m) => (isTeamView ? m.mode !== "ffa" : m.mode === "ffa"));
        const ratings: Record<string, number> = {};
        const stats: Record<string, { wins: number; losses: number }> = {};
        const streaks: Record<string, number> = {};
        let bestStreakName = "";
        let bestStreakValue = 0;

        for (const m of relevant) {
          const allPlayers = m.participants;
          const currentRatings: Record<string, number> = {};
          for (const p of allPlayers) currentRatings[p] = ratings[p] ?? DEFAULT_RATING;

          const winners = m.winners;
          const losers = allPlayers.filter((p) => !winners.includes(p));

          const deltas = isTeamView
            ? computeTeamMatchDeltas(currentRatings, winners, losers)
            : computeFfaMatchDeltas(currentRatings, winners[0], losers);

          for (const p of allPlayers) {
            ratings[p] = (ratings[p] ?? DEFAULT_RATING) + (deltas[p] ?? 0);
            const s = stats[p] ?? { wins: 0, losses: 0 };
            const won = winners.includes(p);
            if (won) s.wins += 1;
            else s.losses += 1;
            stats[p] = s;

            streaks[p] = won ? (streaks[p] ?? 0) + 1 : 0;
            if (streaks[p] > bestStreakValue) {
              bestStreakValue = streaks[p];
              bestStreakName = p;
            }
          }
        }

        const standings: StandingRow[] = Object.keys(ratings)
          .filter((name) => stats[name].wins + stats[name].losses >= MIN_MATCHES_FOR_RANK)
          .map((name) => ({ username: name, rating: ratings[name], wins: stats[name].wins, losses: stats[name].losses }))
          .sort((a, b) => b.rating - a.rating || a.username.localeCompare(b.username));

        return { standings, bestStreakName, bestStreakValue };
      }

      const teamResult = buildView(true);
      const ffaResult = buildView(false);

      setTeamStandings(teamResult.standings.slice(0, 3));
      setFfaStandings(ffaResult.standings.slice(0, 3));

      if (teamResult.bestStreakValue >= ffaResult.bestStreakValue) {
        setLongestStreak({ username: teamResult.bestStreakName, streak: teamResult.bestStreakValue, mode: "Team" });
      } else {
        setLongestStreak({ username: ffaResult.bestStreakName, streak: ffaResult.bestStreakValue, mode: "FFA" });
      }

      const activityCount: Record<string, number> = {};
      for (const m of matches) {
        for (const p of m.participants) {
          activityCount[p] = (activityCount[p] ?? 0) + 1;
        }
      }
      const topActive = Object.entries(activityCount).sort((a, b) => b[1] - a[1])[0];
      if (topActive) setMostActive({ username: topActive[0], matches: topActive[1] });

      // Avatars for everyone on the podiums
      const names = Array.from(new Set([...teamResult.standings.slice(0, 3), ...ffaResult.standings.slice(0, 3)].map((r) => r.username)));
      if (names.length) {
        const { data: profs } = await supabase.from("profiles").select("username, avatar_url").in("username", names);
        const map: Record<string, string | null> = {};
        for (const p of (profs ?? []) as { username: string; avatar_url: string | null }[]) map[p.username] = p.avatar_url;
        setAvatars(map);
      }

      setLoading(false);
    }

    compute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buildDiscordAnnouncement(): string {
    const lines: string[] = [];
    lines.push("🏆 **SEASON 1 — FINAL RESULTS** 🏆");
    lines.push("");
    lines.push("**Team (2v2/3v3/4v4):**");
    teamStandings.forEach((p, i) => {
      const medal = ["🥇", "🥈", "🥉"][i];
      lines.push(`${medal} ${p.username} — ${Math.round(p.rating)} rating (${p.wins}W/${p.losses}L)`);
    });
    lines.push("");
    lines.push("**FFA:**");
    ffaStandings.forEach((p, i) => {
      const medal = ["🥇", "🥈", "🥉"][i];
      lines.push(`${medal} ${p.username} — ${Math.round(p.rating)} rating (${p.wins}W/${p.losses}L)`);
    });
    lines.push("");
    if (mostActive) lines.push(`🎖️ Most Active: ${mostActive.username} (${mostActive.matches} matches)`);
    if (longestStreak && longestStreak.streak > 0) {
      lines.push(`🔥 Longest Win Streak: ${longestStreak.username} — ${longestStreak.streak} in a row (${longestStreak.mode})`);
    }
    lines.push("");
    lines.push(`Total matches played this season: ${totalMatches}`);
    lines.push("");
    lines.push("GG to everyone who competed — Season 2 is live now! 🫡");
    return lines.join("\n");
  }

  async function copyAnnouncement() {
    try {
      await navigator.clipboard.writeText(buildDiscordAnnouncement());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt(tx.copy, buildDiscordAnnouncement());
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center p-12" style={{ background: C.void }}>
        <TankSpinner label={tx.loading} />
      </main>
    );
  }

  if (errorMsg) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6 py-12" style={{ background: C.void }}>
        <p className="max-w-xl border px-5 py-4 text-center text-sm" style={{ borderColor: "rgba(248,113,113,0.5)", background: "rgba(248,113,113,0.08)", color: "#F87171" }}>
          {tx.missingReset}
        </p>
      </main>
    );
  }

  const endLabel = seasonEnd ? new Date(seasonEnd).toLocaleString(lang === "ar" ? "ar-EG" : "en-US", { dateStyle: "long", timeStyle: "short" }) : "";

  return (
    <main className="min-h-screen w-full pb-24" style={{ background: C.void, color: C.paper }}>
      <style>{CSS}</style>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b" style={{ borderColor: C.line }}>
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 opacity-70">
          <div className="czs-rays absolute inset-0 rounded-full" style={{ background: "repeating-conic-gradient(from 0deg, rgba(232,166,61,0.08) 0deg 5deg, transparent 5deg 15deg)", maskImage: "radial-gradient(circle, black 15%, transparent 62%)", WebkitMaskImage: "radial-gradient(circle, black 15%, transparent 62%)" }} />
        </div>
        {[["10%", "24%", "0s"], ["26%", "70%", "1.2s"], ["74%", "20%", "0.6s"], ["88%", "64%", "1.8s"], ["52%", "14%", "2.3s"]].map(([l, t, d], i) => (
          <span key={i} aria-hidden="true" className="czs-spark" style={{ left: l, top: t, animationDelay: d }} />
        ))}
        <div className={`${WRAP} relative pb-14 pt-16 text-center md:pt-24`}>
          <div className="czs-in inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em]" style={{ color: C.radar }}>
            <Sparkles size={14} aria-hidden="true" />
            {tx.eyebrow}
          </div>
          <h1 className="czs-in cz-display mt-3 uppercase leading-[0.85]" style={{ fontSize: "clamp(3.5rem, 11vw, 9rem)", fontWeight: 700, animationDelay: "0.1s", textShadow: "0 0 40px rgba(232,166,61,0.25)" }}>
            <span style={{ color: C.amber }}>{tx.title}</span>
          </h1>
          <div className="czs-in cz-display mt-2 text-2xl uppercase tracking-[0.2em] md:text-3xl" style={{ color: C.paper, fontWeight: 500, animationDelay: "0.2s" }}>{tx.sub}</div>
          {endLabel && (
            <div className="czs-in mt-5 inline-flex items-center gap-2 border px-3 py-1.5 text-xs" style={{ borderColor: C.line, color: C.muted, animationDelay: "0.3s" }}>
              <CalendarClock size={13} aria-hidden="true" />
              {tx.ended(endLabel)}
            </div>
          )}
        </div>
      </section>

      <div className={WRAP}>
        {/* ================= PODIUMS ================= */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Podium title={tx.team} icon={Trophy} rows={teamStandings} avatars={avatars} noneText={tx.none} delay={0.1} />
          <Podium title={tx.ffa} icon={Swords} rows={ffaStandings} avatars={avatars} noneText={tx.none} delay={0.25} />
        </div>

        {/* ================= AWARDS ================= */}
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {mostActive && (
            <Link href={`/profile/${mostActive.username}`} className="czs-award czs-in block border p-6" style={{ background: C.panel, borderColor: C.line, animationDelay: "0.5s" }}>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: C.radar }}>
                <Activity size={14} aria-hidden="true" />
                {tx.mostActive}
              </div>
              <div className="cz-display mt-3 truncate text-3xl uppercase" style={{ fontWeight: 700 }}>{mostActive.username}</div>
              <div className="mt-1 text-sm" style={{ color: C.muted }}>{tx.matchesPlayed(mostActive.matches)}</div>
            </Link>
          )}
          {longestStreak && longestStreak.streak > 0 && (
            <Link href={`/profile/${longestStreak.username}`} className="czs-award czs-in block border p-6" style={{ background: "linear-gradient(160deg, rgba(232,166,61,0.10), #12150E 60%)", borderColor: C.amberDim, animationDelay: "0.6s" }}>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: C.amber }}>
                <Flame size={14} aria-hidden="true" />
                {tx.streak}
              </div>
              <div className="cz-display mt-3 truncate text-3xl uppercase" style={{ fontWeight: 700 }}>{longestStreak.username}</div>
              <div className="mt-1 text-sm" style={{ color: C.muted }}>{tx.inARow(longestStreak.streak, longestStreak.mode)}</div>
            </Link>
          )}
          <div className="czs-award czs-in border p-6" style={{ background: C.panel, borderColor: C.line, animationDelay: "0.7s" }}>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>
              <Swords size={14} aria-hidden="true" />
              {tx.total}
            </div>
            <div className="cz-display mt-3 text-5xl leading-none tabular-nums" style={{ color: C.amber, fontWeight: 700 }}>
              <CountUp value={totalMatches} />
            </div>
            <div className="mt-1 text-sm" style={{ color: C.muted }}>{tx.thisSeason}</div>
          </div>
        </div>

        {/* ================= ACTIONS ================= */}
        <div className="czs-in mt-10 flex flex-wrap justify-center gap-3" style={{ animationDelay: "0.8s" }}>
          <button
            onClick={copyAnnouncement}
            className="inline-flex min-h-[52px] items-center gap-2 px-6 text-sm uppercase tracking-[0.12em] transition-[filter] hover:brightness-110"
            style={{ background: copied ? C.radar : C.amber, color: C.void, fontWeight: 700 }}
            aria-live="polite"
          >
            {copied ? <Check size={16} aria-hidden="true" /> : <ClipboardCopy size={16} aria-hidden="true" />}
            {copied ? tx.copied : tx.copy}
          </button>
          <Link href="/leaderboard" className="inline-flex min-h-[52px] items-center gap-2 border px-6 text-sm uppercase tracking-[0.12em] transition-colors hover:bg-[#171B10]" style={{ borderColor: C.amberDim, color: C.paper, fontWeight: 600 }}>
            {tx.leaderboard}
          </Link>
        </div>
      </div>
    </main>
  );
}
