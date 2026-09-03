"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { computeTeamMatchDeltas, computeFfaMatchDeltas, DEFAULT_RATING } from "@/lib/elo";

type Match = {
  id: string;
  mode: "2v2" | "3v3" | "4v4" | "ffa";
  participants: string[];
  winners: string[];
  created_at: string;
};

/**
 * One-time repair tool: replays every remaining match in chronological
 * order and recomputes everyone's rating from scratch (starting at 1000).
 * Use this if ratings have drifted out of sync with match history — e.g.
 * from matches deleted before the delete-reverses-rating fix existed.
 *
 * This does NOT change any match's stored rating_changes (so match
 * history displays are untouched) — it only fixes the final profiles.rating
 * numbers going forward.
 */
export default function RecalculateRatings() {
  const supabase = createClient();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleRecalculate() {
    const confirmed = window.confirm(
      "This will reset EVERY player's rating and recompute it from your full match history, in order. Continue?"
    );
    if (!confirmed) return;

    setRunning(true);
    setResult(null);

    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .select("id, mode, participants, winners, created_at")
      .order("created_at", { ascending: true });

    if (matchError || !matchData) {
      setResult(`Error loading matches: ${matchError?.message}`);
      setRunning(false);
      return;
    }

    const teamRatings: Record<string, number> = {};
    const ffaRatings: Record<string, number> = {};

    for (const m of matchData as Match[]) {
      const losers = m.participants.filter((p) => !m.winners.includes(p));
      const isTeamMode = m.mode === "2v2" || m.mode === "3v3" || m.mode === "4v4";
      const pool = isTeamMode ? teamRatings : ffaRatings;

      const deltas = isTeamMode
        ? computeTeamMatchDeltas(pool, m.winners, losers)
        : computeFfaMatchDeltas(pool, m.winners[0], losers);

      for (const username of m.participants) {
        const current = pool[username] ?? DEFAULT_RATING;
        pool[username] = current + (deltas[username] ?? 0);
      }
    }

    const allUsernames = new Set<string>([...Object.keys(teamRatings), ...Object.keys(ffaRatings)]);

    const { data: registeredProfiles } = await supabase.from("profiles").select("username");
    const registeredSet = new Set((registeredProfiles ?? []).map((p) => p.username));

    let updated = 0;
    for (const username of allUsernames) {
      const values = {
        rating_team: teamRatings[username] ?? DEFAULT_RATING,
        rating_ffa: ffaRatings[username] ?? DEFAULT_RATING,
      };

      if (registeredSet.has(username)) {
        const { error } = await supabase.from("profiles").update(values).eq("username", username);
        if (!error) updated++;
      } else {
        const { error } = await supabase
          .from("guest_ratings")
          .upsert({ name: username, ...values }, { onConflict: "name" });
        if (!error) updated++;
      }
    }

    setRunning(false);
    setResult(`Done. Recalculated ratings for ${updated} player(s) based on ${matchData.length} match(es).`);
  }

  return (
    <div style={{ border: "1px solid #333", padding: "1rem", marginTop: "1.5rem" }}>
      <h3>Recalculate All Ratings</h3>
      <p style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "0.6rem" }}>
        Use this if ratings look wrong or out of sync with match history (e.g. after deleting
        matches before this was fixed). It replays every remaining match in order and resets
        everyone's rating to what it should actually be. Safe to run any time — it doesn't
        touch match records themselves, only the final rating numbers.
      </p>
      <button
        onClick={handleRecalculate}
        disabled={running}
        style={{
          background: running ? "#555" : "#f5a623",
          color: "#000",
          fontWeight: 700,
          padding: "0.5rem 1.2rem",
          border: "none",
          borderRadius: "4px",
          cursor: running ? "default" : "pointer",
          fontSize: "0.85rem",
        }}
      >
        {running ? "Recalculating..." : "Recalculate All Ratings"}
      </button>
      {result && <p style={{ fontSize: "0.8rem", marginTop: "0.6rem", color: "#22c55e" }}>{result}</p>}
    </div>
  );
}
