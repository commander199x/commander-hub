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
 * For when the SAME real person accidentally created two registered
 * accounts (e.g. "MrmedCOM" and "MRMEDCOM"). Rewrites all match history
 * from the secondary account onto the primary account, resets the
 * secondary account's ratings, and bans the secondary account so it can't
 * be used to log in or play separately anymore.
 *
 * This does NOT delete the secondary account's login/auth entry — that
 * would require elevated server-side access this app intentionally
 * doesn't keep lying around. Banning achieves the same practical result
 * (can't post, can't play) without that risk.
 */
export default function MergeDuplicateAccounts({ adminUsername = "unknown" }: { adminUsername?: string }) {
  const supabase = createClient();
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [primaryUsername, setPrimaryUsername] = useState("");
  const [secondaryUsername, setSecondaryUsername] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptions() {
      const { data: members } = await supabase
        .from("profiles")
        .select("username, banned")
        .order("username");
      // Only show non-banned accounts as merge candidates — an already-banned
      // account is presumably already dealt with.
      setMemberNames((members ?? []).filter((m) => !m.banned).map((m) => m.username));
    }
    loadOptions();
  }, [supabase]);

  async function handleMerge() {
    const primary = primaryUsername.trim();
    const secondary = secondaryUsername.trim();

    if (!primary || !secondary) {
      setResult("Pick both accounts.");
      return;
    }
    if (primary === secondary) {
      setResult("Primary and secondary usernames are identical — nothing to merge.");
      return;
    }

    const confirmed = window.confirm(
      `Merge "${secondary}" into "${primary}"?\n\n"${primary}" will keep all combined match history.\n"${secondary}" will be BANNED and its rating reset.\n\nThis cannot be easily undone. Continue?`
    );
    if (!confirmed) return;

    setRunning(true);
    setResult(null);

    const { data: matches, error: fetchError } = await supabase
      .from("matches")
      .select("id, participants, winners, rating_changes")
      .contains("participants", [secondary]);

    if (fetchError) {
      setResult(`Error loading matches: ${fetchError.message}`);
      setRunning(false);
      return;
    }

    let updated = 0;
    for (const m of (matches ?? []) as Match[]) {
      const newParticipants = m.participants.map((p) => (p === secondary ? primary : p));
      const newWinners = m.winners.map((w) => (w === secondary ? primary : w));

      let newRatingChanges = m.rating_changes;
      if (newRatingChanges && secondary in newRatingChanges) {
        newRatingChanges = { ...newRatingChanges };
        newRatingChanges[primary] = newRatingChanges[secondary];
        delete newRatingChanges[secondary];
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

    await supabase
      .from("profiles")
      .update({ rating_team: 1000, rating_ffa: 1000, banned: true })
      .eq("username", secondary);

    await logAdminAction(supabase, adminUsername, "merge_duplicate_accounts", {
      primary_username: primary,
      secondary_username: secondary,
      matches_updated: updated,
    });

    setResult(
      `Done. Merged ${updated} match(es) from "${secondary}" into "${primary}". "${secondary}" has been banned and its rating reset. Now click "Recalculate All Ratings" below to correctly combine their history.`
    );
    setPrimaryUsername("");
    setSecondaryUsername("");
    setRunning(false);
    setMemberNames((prev) => prev.filter((n) => n !== secondary));
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
    <div style={{ border: "1px solid #ef4444", padding: "1rem", marginTop: "1.5rem" }}>
      <h3 style={{ color: "#ef4444" }}>Merge Duplicate Accounts</h3>
      <p style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "0.75rem" }}>
        Use this when the SAME real person has two separate registered accounts (e.g. a typo
        or different casing at signup). Choose which account to keep. The other one is
        rewritten into the primary account's history, then banned so it can't be used
        separately anymore.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        <select value={primaryUsername} onChange={(e) => setPrimaryUsername(e.target.value)} style={selectStyle}>
          <option value="">Select primary (KEEP)...</option>
          {memberNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <select value={secondaryUsername} onChange={(e) => setSecondaryUsername(e.target.value)} style={selectStyle}>
          <option value="">Select secondary (BAN)...</option>
          {memberNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={handleMerge}
        disabled={running || !primaryUsername || !secondaryUsername}
        style={{
          background: running || !primaryUsername || !secondaryUsername ? "#555" : "#ef4444",
          color: "#fff",
          fontWeight: 700,
          padding: "0.5rem 1.2rem",
          border: "none",
          borderRadius: "4px",
          cursor: running || !primaryUsername || !secondaryUsername ? "default" : "pointer",
          fontSize: "0.85rem",
        }}
      >
        {running ? "Merging..." : "Merge Duplicate Accounts"}
      </button>
      {result && <p style={{ fontSize: "0.8rem", marginTop: "0.6rem", color: "#22c55e" }}>{result}</p>}
    </div>
  );
}
