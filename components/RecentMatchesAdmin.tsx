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
 * Drop this into the admin page below MatchForm, e.g.:
 *   <RecentMatchesAdmin />
 *
 * Shows the last 15 matches across all modes, with Delete and
 * Add/attach-replay controls, so admins don't have to leave /admin.
 */
export default function RecentMatchesAdmin() {
  const supabase = createClient();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLink, setEditLink] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadMatches() {
    setLoading(true);
    const { data } = await supabase
      .from("matches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15);
    setMatches(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this match? This cannot be undone.");
    if (!confirmed) return;

    const matchToDelete = matches.find((m) => m.id === id);
    if (matchToDelete?.rating_changes) {
      const column = matchToDelete.mode === "ffa" ? "rating_ffa" : "rating_team";
      const usernames = Object.keys(matchToDelete.rating_changes);

      const { data: currentProfiles } = await supabase
        .from("profiles")
        .select(`username, ${column}`)
        .in("username", usernames);

      const foundInProfiles = new Set((currentProfiles ?? []).map((p: any) => p.username));

      for (const p of (currentProfiles ?? []) as any[]) {
        const delta = matchToDelete.rating_changes[p.username] ?? 0;
        const revertedRating = (p[column] ?? 1000) - delta;
        await supabase.from("profiles").update({ [column]: revertedRating }).eq("username", p.username);
      }

      const guestUsernames = usernames.filter((u) => !foundInProfiles.has(u));
      if (guestUsernames.length > 0) {
        const { data: currentGuests } = await supabase
          .from("guest_ratings")
          .select(`name, ${column}`)
          .in("name", guestUsernames);

        for (const g of (currentGuests ?? []) as any[]) {
          const delta = matchToDelete.rating_changes[g.name] ?? 0;
          const revertedRating = (g[column] ?? 1000) - delta;
          await supabase.from("guest_ratings").update({ [column]: revertedRating }).eq("name", g.name);
        }
      }
    }

    await supabase.from("matches").delete().eq("id", id);
    loadMatches();
  }

  function startEditing(id: string) {
    setEditingId(id);
    setEditLink("");
    setEditFile(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditLink("");
    setEditFile(null);
  }

  async function saveReplay(id: string) {
    setSaving(true);
    let replayUrl: string | null = null;

    if (editFile) {
      const ext = editFile.name.split(".").pop() || "rep";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("replays").upload(path, editFile);
      if (uploadError) {
        alert(`Upload failed: ${uploadError.message}`);
        setSaving(false);
        return;
      }
      const { data } = supabase.storage.from("replays").getPublicUrl(path);
      replayUrl = data.publicUrl;
    } else if (editLink.trim()) {
      replayUrl = editLink.trim();
    }

    if (!replayUrl) {
      alert("Paste a link or choose a file first.");
      setSaving(false);
      return;
    }

    await supabase.from("matches").update({ replay_url: replayUrl }).eq("id", id);
    setSaving(false);
    cancelEditing();
    loadMatches();
  }

  if (loading) return <p style={{ opacity: 0.6 }}>Loading recent matches...</p>;

  return (
    <div style={{ border: "1px solid #333", padding: "1rem", marginTop: "1.5rem" }}>
      <h3>Recent Matches</h3>

      {matches.length === 0 && <p style={{ opacity: 0.6 }}>No matches logged yet.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
        {matches.map((m) => {
          const losers = m.participants.filter((p) => !m.winners.includes(p));
          return (
            <div key={m.id}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.6rem 0.8rem",
                  background: "#111",
                  border: "1px solid #222",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ color: "#f5a623", fontSize: "0.65rem", textTransform: "uppercase", flexShrink: 0 }}>
                  {m.mode}
                </span>
                <span style={{ color: "#22c55e" }}>{m.winners.join(", ")}</span>
                <span style={{ opacity: 0.5, flexShrink: 0 }}>beat</span>
                <span style={{ color: "#ef4444" }}>{losers.join(", ") || "—"}</span>
                <span style={{ marginLeft: "auto", opacity: 0.5, flexShrink: 0 }}>
                  {new Date(m.created_at).toLocaleDateString()}
                </span>

                {m.replay_url ? (
                  <a
                    href={m.replay_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flexShrink: 0,
                      color: "#f5a623",
                      border: "1px solid #f5a623",
                      borderRadius: "3px",
                      padding: "0.15rem 0.5rem",
                      textDecoration: "none",
                      fontSize: "0.7rem",
                    }}
                  >
                    ⬇ Replay
                  </a>
                ) : (
                  <button
                    onClick={() => startEditing(m.id)}
                    style={{
                      flexShrink: 0,
                      background: "none",
                      color: "#888",
                      border: "1px dashed #444",
                      borderRadius: "3px",
                      padding: "0.15rem 0.5rem",
                      fontSize: "0.7rem",
                      cursor: "pointer",
                    }}
                  >
                    Add replay
                  </button>
                )}

                <button
                  onClick={() => handleDelete(m.id)}
                  style={{
                    flexShrink: 0,
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
              </div>

              {editingId === m.id && (
                <div
                  style={{
                    marginTop: "0.3rem",
                    padding: "0.5rem",
                    border: "1px dashed #f5a623",
                    borderRadius: "4px",
                    display: "flex",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Replay link"
                    value={editLink}
                    onChange={(e) => {
                      setEditLink(e.target.value);
                      if (e.target.value) setEditFile(null);
                    }}
                    disabled={!!editFile}
                    style={{
                      flex: "1 1 160px",
                      background: "#131313",
                      border: "1px solid #333",
                      color: "#eee",
                      padding: "0.3rem 0.5rem",
                      fontSize: "0.75rem",
                    }}
                  />
                  <input
                    type="file"
                    id={`admin-replay-${m.id}`}
                    accept=".rep,.zip"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setEditFile(file);
                      if (file) setEditLink("");
                    }}
                    style={{ display: "none" }}
                  />
                  <label
                    htmlFor={`admin-replay-${m.id}`}
                    style={{
                      fontSize: "0.7rem",
                      color: "#f5a623",
                      border: "1px solid #f5a623",
                      borderRadius: "3px",
                      padding: "0.3rem 0.5rem",
                      cursor: "pointer",
                    }}
                  >
                    {editFile ? editFile.name : "Choose file"}
                  </label>
                  <button
                    onClick={() => saveReplay(m.id)}
                    disabled={saving}
                    style={{
                      fontSize: "0.7rem",
                      background: "#f5a623",
                      color: "#000",
                      fontWeight: 700,
                      border: "none",
                      borderRadius: "3px",
                      padding: "0.3rem 0.6rem",
                      cursor: "pointer",
                    }}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={cancelEditing}
                    style={{
                      fontSize: "0.7rem",
                      background: "none",
                      color: "#888",
                      border: "1px solid #444",
                      borderRadius: "3px",
                      padding: "0.3rem 0.6rem",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
