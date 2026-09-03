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
  tournament_name: string | null;
  round: string | null;
  rating_changes: Record<string, number> | null;
  created_at: string;
};

type StatRow = {
  username: string;
  wins: number;
  losses: number;
  avatar_url: string | null;
  rating: number;
  streak: number; // positive = win streak, negative = loss streak
};

type SortKey = "wins" | "winrate" | "rating" | "matches";
type DateRange = "all" | "week" | "month";

export default function LeaderboardPage() {
  const supabase = createClient();
  const [mode, setMode] = useState<"3v3" | "4v4" | "ffa">("4v4");
  const [matches, setMatches] = useState<Match[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { avatar_url: string | null; rating: number }>>({});
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [sortKey, setSortKey] = useState<SortKey>("wins");

  async function loadData() {
    setLoading(true);
    const { data: matchData } = await supabase
      .from("matches")
      .select("*")
      .order("created_at", { ascending: false });
    setMatches(matchData ?? []);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("username, avatar_url, rating");
    const profileMap: Record<string, { avatar_url: string | null; rating: number }> = {};
    for (const p of profileData ?? []) {
      profileMap[p.username] = { avatar_url: p.avatar_url, rating: p.rating ?? 1000 };
    }
    setProfiles(profileMap);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      setIsAdmin(!!myProfile?.is_admin);
    } else {
      setIsAdmin(false);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDeleteMatch(id: string) {
    const confirmed = window.confirm("Delete this match? This cannot be undone.");
    if (!confirmed) return;
    await supabase.from("matches").delete().eq("id", id);
    loadData();
  }

  const now = Date.now();
  const dateFiltered = matches.filter((m) => {
    if (dateRange === "all") return true;
    const ageMs = now - new Date(m.created_at).getTime();
    if (dateRange === "week") return ageMs <= 7 * 24 * 60 * 60 * 1000;
    if (dateRange === "month") return ageMs <= 30 * 24 * 60 * 60 * 1000;
    return true;
  });

  const filtered = dateFiltered.filter((m) => m.mode === mode);

  // matches are already newest-first; build stats + streaks
  const stats = new Map<string, StatRow>();
  // iterate oldest-first for correct streak computation, but we already have newest-first,
  // so reverse a copy for streak calc while keeping win/loss totals order-independent
  const oldestFirst = [...filtered].slice().reverse();

  for (const m of oldestFirst) {
    for (const username of m.participants) {
      const row =
        stats.get(username) ??
        ({
          username,
          wins: 0,
          losses: 0,
          avatar_url: profiles[username]?.avatar_url ?? null,
          rating: profiles[username]?.rating ?? 1000,
          streak: 0,
        } as StatRow);

      const won = m.winners.includes(username);
      if (won) {
        row.wins += 1;
        row.streak = row.streak >= 0 ? row.streak + 1 : 1;
      } else {
        row.losses += 1;
        row.streak = row.streak <= 0 ? row.streak - 1 : -1;
      }
      stats.set(username, row);
    }
  }

  let ranked = Array.from(stats.values());

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    ranked = ranked.filter((p) => p.username.toLowerCase().includes(q));
  }

  ranked.sort((a, b) => {
    if (sortKey === "wins") return b.wins - a.wins;
    if (sortKey === "rating") return b.rating - a.rating;
    if (sortKey === "matches") return b.wins + b.losses - (a.wins + a.losses);
    // winrate
    const aTotal = a.wins + a.losses;
    const bTotal = b.wins + b.losses;
    const aRate = aTotal > 0 ? a.wins / aTotal : 0;
    const bRate = bTotal > 0 ? b.wins / bTotal : 0;
    return bRate - aRate;
  });

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

        {/* Search / filter / sort controls */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search player..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "#131313",
              border: "1px solid #333",
              color: "#eee",
              padding: "0.4rem 0.6rem",
              fontFamily: "inherit",
              flex: "1 1 180px",
            }}
          />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            style={{ background: "#131313", border: "1px solid #333", color: "#f5a623", padding: "0.4rem 0.6rem", fontFamily: "inherit" }}
          >
            <option value="all">All time</option>
            <option value="month">This month</option>
            <option value="week">This week</option>
          </select>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            style={{ background: "#131313", border: "1px solid #333", color: "#f5a623", padding: "0.4rem 0.6rem", fontFamily: "inherit" }}
          >
            <option value="wins">Sort: Wins</option>
            <option value="winrate">Sort: Win %</option>
            <option value="rating">Sort: Rating</option>
            <option value="matches">Sort: Matches played</option>
          </select>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className="leaderboard-table">
              <div className="leaderboard-row leaderboard-header-row">
                <span className="lb-rank">#</span>
                <span className="lb-player">Player</span>
                <span className="lb-stat">Rating</span>
                <span className="lb-stat">W</span>
                <span className="lb-stat">L</span>
                <span className="lb-stat">Win %</span>
              </div>

              {ranked.map((p, i) => {
                const total = p.wins + p.losses;
                const winRate = total > 0 ? Math.round((p.wins / total) * 100) : 0;
                return (
                  <Link key={p.username} href={`/profile/${p.username}`} className="leaderboard-row">
                    <span className="lb-rank">
                      {i === 0 ? "👑" : i + 1}
                    </span>
                    <span className="lb-player" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <img
                        src={p.avatar_url || "/default-avatar.svg"}
                        alt={p.username}
                        className="lb-avatar"
                        style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
                      />
                      {p.username}
                      {p.streak >= 3 && (
                        <span style={{ fontSize: "0.75rem", color: "#f97316" }}>🔥{p.streak}</span>
                      )}
                    </span>
                    <span className="lb-stat">{p.rating}</span>
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
                        {m.rating_changes && (
                          <span style={{ color: "#22c55e", marginLeft: "0.4rem" }}>
                            (+{m.rating_changes[m.winners[0]] ?? 0})
                          </span>
                        )}
                      </span>
                    </div>

                    <span style={{ opacity: 0.5, fontSize: "0.75rem", flex: "0 0 auto" }}>VS</span>

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
                        {m.rating_changes && losers[0] && (
                          <span style={{ color: "#ef4444", marginLeft: "0.4rem" }}>
                            ({m.rating_changes[losers[0]] ?? 0})
                          </span>
                        )}
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

                    {m.tournament_name && (
                      <span style={{ flex: "0 0 auto", fontSize: "0.7rem", opacity: 0.7 }}>
                        {m.tournament_name}
                        {m.round ? ` · ${m.round}` : ""}
                      </span>
                    )}

                    <span style={{ flex: "0 0 auto", fontSize: "0.75rem", opacity: 0.6 }}>
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteMatch(m.id)}
                        style={{
                          flex: "0 0 auto",
                          background: "none",
                          border: "1px solid #ef4444",
                          color: "#ef4444",
                          borderRadius: "3px",
                          padding: "0.15rem 0.5rem",
                          fontSize: "0.7rem",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    )}
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
