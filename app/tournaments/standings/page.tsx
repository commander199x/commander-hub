"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Match = {
  id: string;
  mode: "3v3" | "4v4" | "ffa";
  participants: string[];
  winners: string[];
  tournament_name: string | null;
  round: string | null;
  created_at: string;
};

/**
 * Lightweight tournament view: pick a tournament name (tagged on matches
 * via the "Tournament name" field in the admin Log a Match form), and see
 * all matches + a simple win-count standings table for that tournament.
 *
 * This is NOT a full bracket system — it just groups already-logged
 * matches by the tournament_name/round you typed in when logging them.
 */
export default function TournamentStandingsPage() {
  const supabase = createClient();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("matches")
        .select("*")
        .not("tournament_name", "is", null)
        .order("created_at", { ascending: false });
      setMatches(data ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const tournamentNames = Array.from(
    new Set(matches.map((m) => m.tournament_name).filter((n): n is string => !!n))
  );

  useEffect(() => {
    if (!selected && tournamentNames.length > 0) setSelected(tournamentNames[0]);
  }, [tournamentNames, selected]);

  const tournamentMatches = matches.filter((m) => m.tournament_name === selected);

  const standings = new Map<string, { wins: number; losses: number }>();
  for (const m of tournamentMatches) {
    for (const p of m.participants) {
      const row = standings.get(p) ?? { wins: 0, losses: 0 };
      if (m.winners.includes(p)) row.wins += 1;
      else row.losses += 1;
      standings.set(p, row);
    }
  }
  const ranked = Array.from(standings.entries())
    .map(([username, s]) => ({ username, ...s }))
    .sort((a, b) => b.wins - a.wins);

  // Group matches by round for display
  const rounds = Array.from(new Set(tournamentMatches.map((m) => m.round || "Unlabeled round")));

  return (
    <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Tournament Standings</h1>

      {loading ? (
        <p>Loading...</p>
      ) : tournamentNames.length === 0 ? (
        <p style={{ opacity: 0.6 }}>
          No tournament-tagged matches yet. Add a tournament name when logging a match on /admin to see it here.
        </p>
      ) : (
        <>
          <div style={{ marginBottom: "1.5rem" }}>
            <select
              value={selected ?? ""}
              onChange={(e) => setSelected(e.target.value)}
              style={{ background: "#131313", color: "#f5a623", border: "1px solid #333", padding: "0.4rem 0.6rem" }}
            >
              {tournamentNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <h2>Standings</h2>
          <div style={{ marginBottom: "2rem" }}>
            {ranked.map((p, i) => {
              const total = p.wins + p.losses;
              const winRate = total > 0 ? Math.round((p.wins / total) * 100) : 0;
              return (
                <div
                  key={p.username}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.5rem 0.75rem",
                    borderBottom: "1px solid #222",
                    fontSize: "0.9rem",
                  }}
                >
                  <span>
                    {i + 1}. {p.username}
                  </span>
                  <span>
                    {p.wins}W - {p.losses}L ({winRate}%)
                  </span>
                </div>
              );
            })}
          </div>

          <h2>Matches by Round</h2>
          {rounds.map((round) => (
            <div key={round} style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ color: "#f5a623", fontSize: "1rem" }}>{round}</h3>
              {tournamentMatches
                .filter((m) => (m.round || "Unlabeled round") === round)
                .map((m) => {
                  const losers = m.participants.filter((p) => !m.winners.includes(p));
                  return (
                    <div key={m.id} style={{ fontSize: "0.85rem", padding: "0.4rem 0", opacity: 0.85 }}>
                      <span style={{ color: "#22c55e" }}>{m.winners.join(", ")}</span> beat{" "}
                      <span style={{ color: "#ef4444" }}>{losers.join(", ") || "—"}</span>
                    </div>
                  );
                })}
            </div>
          ))}
        </>
      )}
    </main>
  );
}
