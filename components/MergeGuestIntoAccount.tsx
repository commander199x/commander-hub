"use client";

import { useEffect, useState } from "react";
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
 * and removes the now-redundant guest_ratings row (if one exists).
 *
 * The "guest" dropdown includes BOTH real guest_ratings entries AND any
 * orphaned names that only exist inside old match records with no
 * guest_ratings or profiles row at all (a leftover from an older bug),
 * since those need merging too.
 *
 * After merging, click "Recalculate All Ratings" so the combined history
 * produces a correct, unified rating.
 */
export default function MergeGuestIntoAccount({ adminUsername = "unknown" }: { adminUsername?: string }) {
  const supabase = createClient();
  const [guestNames, setGuestNames] = useState<string[]>([]);
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [guestName, setGuestName] = useState("");
  const [targetUsername, setTargetUsername] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptions() {
      const { data: members } = await supabase.from("profiles").select("username").order("username");
      const memberSet = new Set((members ?? []).map((m) => m.username));
      setMemberNames(Array.from(memberSet).sort());

      const { data: guestRows } = await supabase.from("guest_ratings").select("name");
      const guestSet = new Set((guestRows ?? []).map((g) => g.name));

      // Also catch orphaned names: anyone who appears in match history but
      // has no profiles row AND no guest_ratings row.
      const { data: allMatches } = await supabase.from("matches").select("participants");
      for (const m of allMatches ?? []) {
        for (const p of m.participants as string[]) {
          if (!memberSet.has(p)) guestSet.add(p);
        }
      }

      setGuestNames(Array.from(guestSet).sort());
    }
    loadOptions();
  }, [supabase]);

  async function handleMerge() {
    const guest = guestName.trim();
    const target = targetUsername.trim();

    if (!guest || !target) {
      setResult("Pick both a guest and a registered account to merge into.");
      return;
    }
    if (guest === target) {
      setResult("Guest name and target username are identical — nothing to merge.");
      return;
    }

    const confirmed = window.confirm(
      `Merge all matches for "${guest}" into registered account "${target}"? This rewrites match history and cannot be easily undone.`
    );
    if (!confirmed) return;

    setRunning(true);
    setResult(null);

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

    // Remove the guest rating row if one exists — harmless no-op if not.
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
    setGuestNames((prev) => prev.filter((g) => g !== guest));
  }

  const selectStyle: React.CSSProperties = {
    flex: "1 1 220px",
    background: "#131313",
    border: "1px solid #333",
    color: "#eee",
    padding: "0.4rem 0.6rem",
    fontFamily: "inherit",
  };

  return (
    <div style={{ border: "1px solid #f5a623", padding: "1rem", marginTop: "1.5rem" }}>
      <h3>Merge Guest Into Account</h3>
      <p style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "0.75rem" }}>
        Use this when a guest player later signs up for a real account (often under different
        capitalization or spacing), causing them to show up as two separate people. The guest
        list includes anyone who's ever appeared in a match but isn't a registered account —
        including old orphaned names with no rating record at all. Pick from the lists below —
        no typing required. Run "Recalculate All Ratings" afterward.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        <select value={guestName} onChange={(e) => setGuestName(e.target.value)} style={selectStyle}>
          <option value="">Select guest...</option>
          {guestNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <select value={targetUsername} onChange={(e) => setTargetUsername(e.target.value)} style={selectStyle}>
          <option value="">Select registered account...</option>
          {memberNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={handleMerge}
        disabled={running || !guestName || !targetUsername}
        style={{
          background: running || !guestName || !targetUsername ? "#555" : "#f5a623",
          color: "#000",
          fontWeight: 700,
          padding: "0.5rem 1.2rem",
          border: "none",
          borderRadius: "4px",
          cursor: running || !guestName || !targetUsername ? "default" : "pointer",
          fontSize: "0.85rem",
        }}
      >
        {running ? "Merging..." : "Merge Guest Into Account"}
      </button>
      {result && <p style={{ fontSize: "0.8rem", marginTop: "0.6rem", color: "#22c55e" }}>{result}</p>}
    </div>
  );
}