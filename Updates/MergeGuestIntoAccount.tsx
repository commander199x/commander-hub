"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logAdminAction } from "@/lib/auditLog";

type Match = {
  id: string;
  participants: string[];
  winners: string[];
  rating_changes: Record<string, number> | null;
};

/**
 * Fixes the "same person, two identities" problem: a guest played some
 * matches under one spelling/casing (e.g. "MrmedCOM"), then later signed up
 * for a real account under a different casing (e.g. "MRMEDCOM"). This tool
 * rewrites every match referencing the guest name to the real username,
 * and removes the now-redundant guest_ratings row.
 *
 * After merging, click "Recalculate All Ratings" so the combined history
 * produces a correct, unified rating.
 */
export default function MergeGuestIntoAccount({ adminUsername = "unknown" }: { adminUsername?: string }) {
  const supabase = createClient();
  const [guestName, setGuestName] = useState("");
  const [targetUsername, setTargetUsername] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleMerge() {
    const guest = guestName.trim();
    const target = targetUsername.trim();

    if (!guest || !target) {
      setResult("Enter both the guest name and the registered username to merge into.");
      return;
    }
    if (guest === target) {
      setResult("Guest name and target username are identical — nothing to merge.");
      return;
    }

    const confirmed = window.confirm(
      `Merge all matches for guest "${guest}" into registered account "${target}"? This rewrites match history and cannot be easily undone.`
    );
    if (!confirmed) return;

    setRunning(true);
    setResult(null);

    // Confirm the target is actually a registered profile, not another guest.
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", target)
      .maybeSingle();

    if (!targetProfile) {
      setResult(`"${target}" is not a registered account. Double-check the spelling.`);
      setRunning(false);
      return;
    }

    // Find every match that includes the guest name.
    const { data: matches, error: fetchError } = await supabase
      .from("matches")
      .select("id, participants, winners, rating_changes")
      .contains("participants", [guest]);

    if (fetchError) {
      setResult(`Error loading matches: ${fetchError.message}`);
      setRunning(false);
      return;
    }

    let updated = 0;
    for (const m of (matches ?? []) as Match[]) {
      const newParticipants = m.participants.map((p) => (p === guest ? target : p));
      const newWinners = m.winners.map((w) => (w === guest ? target : w));

      let newRatingChanges = m.rating_changes;
      if (newRatingChanges && guest in newRatingChanges) {
        newRatingChanges = { ...newRatingChanges };
        newRatingChanges[target] = newRatingChanges[guest];
        delete newRatingChanges[guest];
      }

      const { error: updateError } = await supabase
        .from("matches")
        .update({
          participants: newParticipants,
          winners: newWinners,
          rating_changes: newRatingChanges,
        })
        .eq("id", m.id);

      if (!updateError) updated++;
    }

    // Remove the now-redundant guest rating row.
    await supabase.from("guest_ratings").delete().eq("name", guest);

    await logAdminAction(supabase, adminUsername, "merge_guest_into_account", {
      guest_name: guest,
      target_username: target,
      matches_updated: updated,
    });

    setResult(
      `Done. Merged ${updated} match(es) from "${guest}" into "${target}". Now click "Recalculate All Ratings" below to correctly combine their history.`
    );
    setGuestName("");
    setTargetUsername("");
    setRunning(false);
  }

  return (
    <div style={{ border: "1px solid #f5a623", padding: "1rem", marginTop: "1.5rem" }}>
      <h3>Merge Guest Into Account</h3>
      <p style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "0.75rem" }}>
        Use this when a guest player later signs up for a real account (often under different
        capitalization or spacing), causing them to show up as two separate people. This
        rewrites their match history to the registered account and removes the leftover
        guest entry. Run "Recalculate All Ratings" afterward.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        <input
          type="text"
          placeholder="Guest name exactly as logged (e.g. MrmedCOM)"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          style={{
            flex: "1 1 220px",
            background: "#131313",
            border: "1px solid #333",
            color: "#eee",
            padding: "0.4rem 0.6rem",
            fontFamily: "inherit",
          }}
        />
        <input
          type="text"
          placeholder="Real registered username (e.g. MRMEDCOM)"
          value={targetUsername}
          onChange={(e) => setTargetUsername(e.target.value)}
          style={{
            flex: "1 1 220px",
            background: "#131313",
            border: "1px solid #333",
            color: "#eee",
            padding: "0.4rem 0.6rem",
            fontFamily: "inherit",
          }}
        />
      </div>
      <button
        onClick={handleMerge}
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
        {running ? "Merging..." : "Merge Guest Into Account"}
      </button>
      {result && <p style={{ fontSize: "0.8rem", marginTop: "0.6rem", color: "#22c55e" }}>{result}</p>}
    </div>
  );
}
