"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { computeTeamMatchDeltas, computeFfaMatchDeltas, DEFAULT_RATING } from "@/lib/elo";
import TankSpinner from "@/components/TankSpinner";

const MIN_MATCHES_FOR_RANK = 3;

type Match = {
  mode: "2v2" | "3v3" | "4v4" | "ffa";
  participants: string[];
  winners: string[];
  created_at: string;
};

type StandingRow = { username: string; rating: number; wins: number; losses: number };

export default function Season1SummaryPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [teamStandings, setTeamStandings] = useState<StandingRow[]>([]);
  const [ffaStandings, setFfaStandings] = useState<StandingRow[]>([]);
  const [mostActive, setMostActive] = useState<{ username: string; matches: number } | null>(null);
  const [longestStreak, setLongestStreak] = useState<{ username: string; streak: number; mode: string } | null>(null);
  const [totalMatches, setTotalMatches] = useState(0);
  const [seasonEndLabel, setSeasonEndLabel] = useState<string>("");

  useEffect(() => {
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
        setErrorMsg(
          "Couldn't find a 'reset_season_ratings' entry in the audit log. Make sure you ran the reset through the admin panel (not directly in the database)."
        );
        setLoading(false);
        return;
      }

      const seasonEnd = resetEntry.created_at;
      setSeasonEndLabel(new Date(seasonEnd).toLocaleString());

      const { data: matchData } = await supabase
        .from("matches")
        .select("mode, participants, winners, created_at")
        .lt("created_at", seasonEnd)
        .order("created_at", { ascending: true }); // oldest first, required for correct replay

      const matches = (matchData ?? []) as Match[];
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
          .filter((name) => (stats[name].wins + stats[name].losses) >= MIN_MATCHES_FOR_RANK)
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

      setLoading(false);
    }

    compute();
  }, [supabase]);

  function buildDiscordAnnouncement(): string {
    const lines: string[] = [];
    lines.push("🏆 **SEASON 1 — FINAL RESULTS** 🏆");
    lines.push("");
    lines.push("**Team (2v2/3v3/4v4):**");
    teamStandings.forEach((p, i) => {
      const medal = ["🥇", "🥈", "🥉"][i];
      lines.push(`${medal} ${p.username} — ${p.rating} rating (${p.wins}W/${p.losses}L)`);
    });
    lines.push("");
    lines.push("**FFA:**");
    ffaStandings.forEach((p, i) => {
      const medal = ["🥇", "🥈", "🥉"][i];
      lines.push(`${medal} ${p.username} — ${p.rating} rating (${p.wins}W/${p.losses}L)`);
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
    await navigator.clipboard.writeText(buildDiscordAnnouncement());
    alert("Copied! Paste this into Discord.");
  }

  if (loading) {
    return (
      <main style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
        <TankSpinner label="Replaying Season 1 history..." />
      </main>
    );
  }

  if (errorMsg) {
    return (
      <main style={{ maxWidth: "600px", margin: "0 auto", padding: "3rem 1.5rem", textAlign: "center" }}>
        <p style={{ color: "#ef4444" }}>{errorMsg}</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "#888" }}>
        Hall of Fame
      </span>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 700, textTransform: "uppercase", margin: "0.3rem 0 0.3rem" }}>
        Season 1 — Final Results
      </h1>
      <p style={{ fontSize: "0.75rem", opacity: 0.5, marginBottom: "1.5rem" }}>
        Season ended {seasonEndLabel}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        <div>
          <h2 style={{ fontSize: "1rem", color: "#f5a623", marginBottom: "0.75rem" }}>🛡️ Team Champions</h2>
          {teamStandings.length === 0 && <p style={{ opacity: 0.5, fontSize: "0.85rem" }}>No qualifying players.</p>}
          {teamStandings.map((p, i) => (
            <div key={p.username} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #222" }}>
              <span>{["🥇", "🥈", "🥉"][i]} {p.username}</span>
              <span style={{ color: "#f5a623" }}>{p.rating}</span>
            </div>
          ))}
        </div>
        <div>
          <h2 style={{ fontSize: "1rem", color: "#f5a623", marginBottom: "0.75rem" }}>⚔️ FFA Champions</h2>
          {ffaStandings.length === 0 && <p style={{ opacity: 0.5, fontSize: "0.85rem" }}>No qualifying players.</p>}
          {ffaStandings.map((p, i) => (
            <div key={p.username} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #222" }}>
              <span>{["🥇", "🥈", "🥉"][i]} {p.username}</span>
              <span style={{ color: "#f5a623" }}>{p.rating}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        {mostActive && (
          <div style={{ border: "1px solid #60a5fa", borderRadius: "6px", padding: "0.75rem 1rem", flex: "1 1 200px" }}>
            <p style={{ fontSize: "0.7rem", color: "#60a5fa", textTransform: "uppercase" }}>Most Active</p>
            <p style={{ fontWeight: 700 }}>{mostActive.username}</p>
            <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>{mostActive.matches} matches played</p>
          </div>
        )}
        {longestStreak && longestStreak.streak > 0 && (
          <div style={{ border: "1px solid #f97316", borderRadius: "6px", padding: "0.75rem 1rem", flex: "1 1 200px" }}>
            <p style={{ fontSize: "0.7rem", color: "#f97316", textTransform: "uppercase" }}>Longest Win Streak</p>
            <p style={{ fontWeight: 700 }}>{longestStreak.username}</p>
            <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>{longestStreak.streak} wins in a row ({longestStreak.mode})</p>
          </div>
        )}
        <div style={{ border: "1px solid #444", borderRadius: "6px", padding: "0.75rem 1rem", flex: "1 1 200px" }}>
          <p style={{ fontSize: "0.7rem", color: "#888", textTransform: "uppercase" }}>Total Matches</p>
          <p style={{ fontWeight: 700 }}>{totalMatches}</p>
          <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>played this season</p>
        </div>
      </div>

      <button
        onClick={copyAnnouncement}
        style={{
          background: "#f5a623",
          color: "#000",
          fontWeight: 700,
          padding: "0.6rem 1.4rem",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "0.85rem",
        }}
      >
        📋 Copy Discord Announcement
      </button>
    </main>
  );
}