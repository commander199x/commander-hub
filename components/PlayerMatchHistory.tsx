"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Match = {
  id: string;
  mode: "3v3" | "4v4" | "ffa";
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
 * Shows that player's recent matches across all modes, with W/L
 * and rating change highlighted from their point of view.
 */
export default function PlayerMatchHistory({ username }: { username: string }) {
  const supabase = createClient();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("matches")
        .select("*")
        .contains("participants", [username])
        .order("created_at", { ascending: false })
        .limit(20);
      setMatches(data ?? []);
      setLoading(false);
    }
    load();
  }, [supabase, username]);

  if (loading) return <p style={{ opacity: 0.6 }}>Loading match history...</p>;
  if (matches.length === 0) return <p style={{ opacity: 0.6 }}>No matches logged yet.</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {matches.map((m) => {
        const won = m.winners.includes(username);
        const others = m.participants.filter((p) => p !== username);
        const delta = m.rating_changes?.[username];

        return (
          <div
            key={m.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.6rem 0.9rem",
              background: won ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.05)",
              border: `1px solid ${won ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.3)"}`,
              borderRadius: "4px",
              fontSize: "0.85rem",
              flexWrap: "wrap",
            }}
          >
            <span style={{ color: won ? "#22c55e" : "#ef4444", fontWeight: 700, minWidth: "50px" }}>
              {won ? "WIN" : "LOSS"}
            </span>
            <span style={{ color: "#f5a623", fontSize: "0.7rem", textTransform: "uppercase" }}>{m.mode}</span>
            <span style={{ opacity: 0.7 }}>vs {others.join(", ") || "—"}</span>
            {typeof delta === "number" && (
              <span style={{ color: delta >= 0 ? "#22c55e" : "#ef4444" }}>
                {delta >= 0 ? `+${delta}` : delta}
              </span>
            )}
            <span style={{ marginLeft: "auto", opacity: 0.5, fontSize: "0.75rem" }}>
              {new Date(m.created_at).toLocaleDateString()}
            </span>
            {m.replay_url && (
              <a
                href={m.replay_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Download replay"
                style={{ color: "#f5a623", textDecoration: "none" }}
              >
                ⬇
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
