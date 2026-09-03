"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import "@/app/leaderboard.css";

type Match = {
  id: string;
  mode: "3v3" | "4v4" | "ffa";
  participants: string[];
  winners: string[];
  notes: string | null;
  created_at: string;
};

type StatRow = { username: string; wins: number; losses: number; avatar_url: string | null };

export default function LeaderboardPage() {
  const supabase = createClient();
  const [mode, setMode] = useState<"3v3" | "4v4" | "ffa">("4v4");
  const [matches, setMatches] = useState<Match[]>([]);
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: matchData } = await supabase
        .from("matches")
        .select("*")
        .order("created_at", { ascending: false });
      setMatches(matchData ?? []);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, avatar_url");
      const avatarMap: Record<string, string | null> = {};
      for (const p of profileData ?? []) {
        avatarMap[p.username] = p.avatar_url;
      }
      setAvatars(avatarMap);

      setLoading(false);
    }
    load();
  }, [supabase]);

  const filtered = matches.filter((m) => m.mode === mode);

  const stats = new Map<string, StatRow>();
  for (const m of filtered) {
    for (const username of m.participants) {
      const row = stats.get(username) ?? {
        username,
        wins: 0,
        losses: 0,
        avatar_url: avatars[username] ?? null,
      };
      if (m.winners.includes(username)) row.wins += 1;
      else row.losses += 1;
      stats.set(username, row);
    }
  }

  const ranked = Array.from(stats.values()).sort((a, b) => b.wins - a.wins);

  return (
    <main className="leaderboard-page">
      <div className="leaderboard-container">
        <h1>Leaderboard</h1>

        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem", borderBottom: "1px solid #222" }}>
          {(["3v3", "4v4", "ffa"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.5rem 0.25rem",
                fontFamily: "inherit",
                textTransform: "uppercase",
                fontSize: "0.9rem",
                letterSpacing: "0.05em",
                color: mode === m ? "#f5a623" : "#888",
                fontWeight: mode === m ? 700 : 400,
                borderBottom: mode === m ? "2px solid #f5a623" : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className="leaderboard-table">
              <div className="leaderboard-row leaderboard-header-row">
                <span className="lb-rank">#</span>
                <span className="lb-player">Player</span>
                <span className="lb-stat">W</span>
                <span className="lb-stat">L</span>
                <span className="lb-stat">Win %</span>
              </div>

              {ranked.map((p, i) => {
                const total = p.wins + p.losses;
                const winRate = total > 0 ? Math.round((p.wins / total) * 100) : 0;
                return (
                  <Link key={p.username} href={`/profile/${p.username}`} className="leaderboard-row">
                    <span className="lb-rank">{i + 1}</span>
                    <span className="lb-player" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <img
                        src={p.avatar_url || "/default-avatar.svg"}
                        alt={p.username}
                        className="lb-avatar"
                        style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
                      />
                      {p.username}
                    </span>
                    <span className="lb-stat lb-wins">{p.wins}</span>
                    <span className="lb-stat lb-losses">{p.losses}</span>
                    <span className="lb-stat">{winRate}%</span>
                  </Link>
                );
              })}

              {ranked.length === 0 && (
                <p className="leaderboard-empty">No {mode.toUpperCase()} matches logged yet.</p>
              )}
            </div>

            <h2 style={{ marginTop: "2rem" }}>Recent Matches</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {filtered.slice(0, 20).map((m) => {
                const losers = m.participants.filter((p) => !m.winners.includes(p));
                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.75rem 1rem",
                      background: "#0e0e0e",
                      border: "1px solid #222",
                      borderRadius: "6px",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Winner box */}
                    <div
                      style={{
                        flex: "1 1 220px",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        background: "rgba(34,197,94,0.08)",
                        border: "1px solid rgba(34,197,94,0.5)",
                        borderRadius: "4px",
                        padding: "0.5rem 0.75rem",
                      }}
                    >
                      <span style={{ color: "#22c55e", fontSize: "0.9rem" }}>✓</span>
                      <span style={{ fontSize: "0.85rem", color: "#eee" }}>
                        {m.winners.join(", ")}
                      </span>
                    </div>

                    <span style={{ opacity: 0.5, fontSize: "0.75rem", flex: "0 0 auto" }}>VS</span>

                    {/* Loser box */}
                    <div
                      style={{
                        flex: "1 1 220px",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        background: "rgba(239,68,68,0.06)",
                        border: "1px solid rgba(239,68,68,0.35)",
                        borderRadius: "4px",
                        padding: "0.5rem 0.75rem",
                      }}
                    >
                      <span style={{ color: "#ef4444", fontSize: "0.9rem" }}>✕</span>
                      <span style={{ fontSize: "0.85rem", color: "#999" }}>
                        {losers.join(", ") || "—"}
                      </span>
                    </div>

                    <span
                      style={{
                        flex: "0 0 auto",
                        fontSize: "0.7rem",
                        textTransform: "uppercase",
                        color: "#f5a623",
                        border: "1px solid #f5a623",
                        borderRadius: "3px",
                        padding: "0.15rem 0.4rem",
                      }}
                    >
                      {m.mode}
                    </span>

                    <span style={{ flex: "0 0 auto", fontSize: "0.75rem", opacity: 0.6 }}>
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <p className="leaderboard-empty">No {mode.toUpperCase()} matches logged yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
