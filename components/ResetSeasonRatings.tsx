"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_RATING } from "@/lib/elo";

/**
 * Fresh-season reset: sets EVERY player's rating_team and rating_ffa back
 * to 1000, ignoring match history entirely. Unlike RecalculateRatings,
 * this does NOT look at past matches — it's a hard wipe.
 *
 * Match history itself (the matches table, win/loss records, replays,
 * tournament tags) is untouched — only the rating numbers reset.
 */
export default function ResetSeasonRatings() {
  const supabase = createClient();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleReset() {
    const firstConfirm = window.confirm(
      "This will reset EVERY player's rating back to 1000, ignoring all match history. This is for starting a new season. Continue?"
    );
    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      "Are you sure? This cannot be undone — everyone's rating progress will be wiped. Match history and W/L records stay intact, only ratings reset."
    );
    if (!secondConfirm) return;

    setRunning(true);
    setResult(null);

    const { data: allProfiles, error: fetchError } = await supabase.from("profiles").select("username");

    if (fetchError || !allProfiles) {
      setResult(`Error loading players: ${fetchError?.message}`);
      setRunning(false);
      return;
    }

    let updated = 0;
    for (const p of allProfiles) {
      const { error } = await supabase
        .from("profiles")
        .update({ rating_team: DEFAULT_RATING, rating_ffa: DEFAULT_RATING })
        .eq("username", p.username);
      if (!error) updated++;
    }

    const { data: allGuests } = await supabase.from("guest_ratings").select("name");
    for (const g of allGuests ?? []) {
      await supabase
        .from("guest_ratings")
        .update({ rating_team: DEFAULT_RATING, rating_ffa: DEFAULT_RATING })
        .eq("name", g.name);
      updated++;
    }

    setRunning(false);
    setResult(`Done. Reset ratings to 1000 for ${updated} player(s).`);
  }

  return (
    <div style={{ border: "1px solid #ef4444", padding: "1rem", marginTop: "1.5rem" }}>
      <h3 style={{ color: "#ef4444" }}>Reset Season (Wipe All Ratings)</h3>
      <p style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "0.6rem" }}>
        Resets every player's Team and FFA rating back to 1000, ignoring match history. Use this
        to start a new season/ladder. Match records, W/L history, and replays are NOT deleted —
        only the rating numbers are wiped.
      </p>
      <button
        onClick={handleReset}
        disabled={running}
        style={{
          background: running ? "#555" : "#ef4444",
          color: "#fff",
          fontWeight: 700,
          padding: "0.5rem 1.2rem",
          border: "none",
          borderRadius: "4px",
          cursor: running ? "default" : "pointer",
          fontSize: "0.85rem",
        }}
      >
        {running ? "Resetting..." : "Reset Season (Wipe All Ratings)"}
      </button>
      {result && <p style={{ fontSize: "0.8rem", marginTop: "0.6rem", color: "#22c55e" }}>{result}</p>}
    </div>
  );
}
