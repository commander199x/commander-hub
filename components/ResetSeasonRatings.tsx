"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_RATING } from "@/lib/elo";
import { logAdminAction } from "@/lib/auditLog";
import { useFeedback } from "@/components/FeedbackProvider";

/**
 * Fresh-season reset: sets EVERY player's rating_team and rating_ffa back
 * to 1000, ignoring match history entirely. Unlike RecalculateRatings,
 * this does NOT look at past matches — it's a hard wipe.
 *
 * Match history itself (the matches table, win/loss records, replays,
 * tournament tags) is untouched — only the rating numbers reset.
 */
export default function ResetSeasonRatings({ adminUsername = "unknown" }: { adminUsername?: string }) {
  const supabase = createClient();
  const fb = useFeedback();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleReset() {
    const firstConfirm = await fb.confirm({
      title: "Start a new season?",
      message:
        "This resets EVERY player's rating back to 1000, ignoring match history. Match records, W/L and replays stay intact, only ratings reset.\n\nA snapshot of the final standings is saved in the Audit Log first, so this season's results aren't lost.",
      confirmLabel: "Continue",
      danger: true,
    });
    if (!firstConfirm) return;

    const typed = await fb.prompt({
      title: "Type RESET to confirm",
      message: "Final step. Type RESET (in capitals) to wipe every rating. This cannot be undone.",
      placeholder: "RESET",
      confirmLabel: "Reset ratings",
    });
    if (typed === null) return;
    if (typed.trim() !== "RESET") {
      fb.info("Reset cancelled: you didn't type RESET exactly.");
      return;
    }

    setRunning(true);
    setResult(null);

    const { data: allProfiles, error: fetchError } = await supabase
      .from("profiles")
      .select("username, rating_team, rating_ffa");

    if (fetchError || !allProfiles) {
      fb.error(`Couldn't load players: ${fetchError?.message}`);
      setRunning(false);
      return;
    }

    const { data: allGuests } = await supabase.from("guest_ratings").select("name, rating_team, rating_ffa");

    // Save the final standings BEFORE wiping them, inside the audit-log
    // entry, so this season's results can always be recovered later.
    // Only players whose rating actually changed are stored, to keep it small.
    const hasProgress = (r: any) =>
      (r.rating_team ?? DEFAULT_RATING) !== DEFAULT_RATING || (r.rating_ffa ?? DEFAULT_RATING) !== DEFAULT_RATING;
    const snapshot = {
      profiles: (allProfiles as any[])
        .filter(hasProgress)
        .map((p) => ({ username: p.username, rating_team: p.rating_team, rating_ffa: p.rating_ffa })),
      guests: ((allGuests ?? []) as any[])
        .filter(hasProgress)
        .map((g) => ({ name: g.name, rating_team: g.rating_team, rating_ffa: g.rating_ffa })),
    };

    let updated = 0;
    for (const p of allProfiles) {
      const { error } = await supabase
        .from("profiles")
        .update({ rating_team: DEFAULT_RATING, rating_ffa: DEFAULT_RATING })
        .eq("username", p.username);
      if (!error) updated++;
    }

    for (const g of allGuests ?? []) {
      await supabase
        .from("guest_ratings")
        .update({ rating_team: DEFAULT_RATING, rating_ffa: DEFAULT_RATING })
        .eq("name", g.name);
      updated++;
    }

    setRunning(false);
    setResult(`Done. Reset ratings to 1000 for ${updated} player(s).`);
    fb.success(`Season reset: ${updated} player(s) back to 1000. Final standings were saved to the Audit Log.`);
    await logAdminAction(supabase, adminUsername, "reset_season_ratings", {
      players_reset: updated,
      final_ratings_snapshot: snapshot,
    });
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