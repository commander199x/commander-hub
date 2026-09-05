"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Match = {
  id: string;
  mode: "2v2" | "3v3" | "4v4" | "ffa";
  participants: string[];
  winners: string[];
  rating_changes: Record<string, number> | null;
  replay_url: string | null;
  created_at: string;
};

/**
 * Drop this into a player's profile page, e.g.:
 *   <PlayerMatchHistory username={profile.username} />
 *
 * Shows a stats summary (rating, W/L, win %) plus a clean match history
 * list, from that player's point of view.
 */
export default function PlayerMatchHistory({ username }: { username: string }) {
  const supabase = createClient();
  const [matches, setMatches] = useState<Match[]>([]);
  const [ratingTeam, setRatingTeam] = useState<number | null>(null);
  const [ratingFfa, setRatingFfa] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 15;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    async function load() {
      setLoading(true);

      const { data: matchData } = await supabase
        .from("matches")
        .select("*")
        .contains("participants", [username])
        .order("created_at", { ascending: false });
      setMatches(matchData ?? []);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("rating_team, rating_ffa")
        .eq("username", username)
        .single();
      setRatingTeam(profileData?.rating_team ?? 1000);
      setRatingFfa(profileData?.rating_ffa ?? 1000);

      setLoading(false);
    }
    load();
  }, [supabase, username]);

  if (loading) {
    return <p style={{ opacity: 0.6, fontSize: "0.85rem" }}>Loading match history...</p>;
  }

  const wins = matches.filter((m) => m.winners.includes(username)).length;
  const losses = matches.length - wins;
  const total = matches.length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const displayedMatches = matches.slice(0, visibleCount);

  return (
    <div>
      {/* Stats summary bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
          gap: "1px",
          background: "#222",
          border: "1px solid #222",
          borderRadius: "6px",
          overflow: "hidden",
          marginBottom: "1.25rem",
        }}
      >
        {[
          { label: "Team Rating", value: ratingTeam ?? "—", color: "#f5a623" },
          { label: "FFA Rating", value: ratingFfa ?? "—", color: "#f5a623" },
          { label: "Wins", value: wins, color: "#22c55e" },
          { label: "Losses", value: losses, color: "#ef4444" },
          { label: "Win Rate", value: `${winRate}%`, color: "#eee" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "#0e0e0e",
              padding: "0.75rem 0.5rem",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "1.15rem", fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: "0.65rem", textTransform: "uppercase", opacity: 0.6, letterSpacing: "0.05em", marginTop: "0.15rem" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Match list */}
      {matches.length === 0 ? (
        <p style={{ opacity: 0.6, fontSize: "0.85rem" }}>No matches logged yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {displayedMatches.map((m, i) => {
            const won = m.winners.includes(username);
            const others = m.participants.filter((p) => p !== username);
            const delta = m.rating_changes?.[username];

            return (
              <div
                key={m.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 44px 1fr auto auto auto",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.6rem 0.25rem",
                  borderBottom: i < displayedMatches.length - 1 ? "1px solid #1c1c1c" : "none",
                  fontSize: "0.82rem",
                }}
              >
                <span
                  style={{
                    color: won ? "#22c55e" : "#ef4444",
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    letterSpacing: "0.03em",
                  }}
                >
                  {won ? "WIN" : "LOSS"}
                </span>

                <span
                  style={{
                    color: "#f5a623",
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                    border: "1px solid #f5a623",
                    borderRadius: "3px",
                    padding: "0.1rem 0.35rem",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.mode}
                </span>

                <span
                  style={{
                    opacity: 0.75,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={others.join(", ")}
                >
                  vs {others.join(", ") || "—"}
                </span>

                {typeof delta === "number" ? (
                  <span
                    style={{
                      color: delta >= 0 ? "#22c55e" : "#ef4444",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {delta >= 0 ? `+${delta}` : delta}
                  </span>
                ) : (
                  <span />
                )}

                <span style={{ opacity: 0.45, fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                  {new Date(m.created_at).toLocaleDateString()}
                </span>

                {m.replay_url ? (
                  <a
                    href={m.replay_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Download replay"
                    style={{ color: "#f5a623", textDecoration: "none", fontSize: "0.9rem" }}
                  >
                    ⬇
                  </a>
                ) : (
                  <span style={{ opacity: 0.2, fontSize: "0.9rem" }}>—</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {matches.length > displayedMatches.length && (
        <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
          <button
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            style={{
              background: "none",
              border: "1px solid #f5a623",
              color: "#f5a623",
              padding: "0.4rem 1rem",
              borderRadius: "4px",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            Load more ({matches.length - displayedMatches.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
}