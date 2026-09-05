"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import "@/app/leaderboard.css";
import TankSpinner from "@/components/TankSpinner";

type Match = {
  id: string;
  mode: "2v2" | "3v3" | "4v4" | "ffa";
  participants: string[];
  winners: string[];
  notes: string | null;
  tournament_name: string | null;
  round: string | null;
  rating_changes: Record<string, number> | null;
  replay_url: string | null;
  created_at: string;
};

type StatRow = {
  username: string;
  wins: number;
  losses: number;
  avatar_url: string | null;
  rating: number;
  streak: number; // positive = win streak, negative = loss streak
};

type SortKey = "wins" | "winrate" | "rating" | "matches";
type DateRange = "all" | "week" | "month";

export default function LeaderboardPage() {
  const supabase = createClient();
  const [view, setView] = useState<"team" | "ffa">("team");
  const [teamSizeFilter, setTeamSizeFilter] = useState<"all" | "2v2" | "3v3" | "4v4">("all");
  const [matches, setMatches] = useState<Match[]>([]);
  const [profiles, setProfiles] = useState<
    Record<string, { avatar_url: string | null; rating_team: number; rating_ffa: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [sortKey, setSortKey] = useState<SortKey>("rating");

  const [editingReplayId, setEditingReplayId] = useState<string | null>(null);
  const [editReplayLink, setEditReplayLink] = useState("");
  const [editReplayFile, setEditReplayFile] = useState<File | null>(null);
  const [savingReplay, setSavingReplay] = useState(false);

  async function loadData() {
    setLoading(true);
    const { data: matchData } = await supabase
      .from("matches")
      .select("*")
      .order("created_at", { ascending: false });
    setMatches(matchData ?? []);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("username, avatar_url, rating_team, rating_ffa");
    const profileMap: Record<
      string,
      { avatar_url: string | null; rating_team: number; rating_ffa: number }
    > = {};
    for (const p of profileData ?? []) {
      profileMap[p.username] = {
        avatar_url: p.avatar_url,
        rating_team: p.rating_team ?? 1000,
        rating_ffa: p.rating_ffa ?? 1000,
      };
    }

    // Merge in guest ratings (players with no site account) so their
    // rating displays correctly too, not just the 1000 default.
    const { data: guestData } = await supabase.from("guest_ratings").select("name, rating_team, rating_ffa");
    for (const g of guestData ?? []) {
      profileMap[g.name] = {
        avatar_url: null,
        rating_team: g.rating_team ?? 1000,
        rating_ffa: g.rating_ffa ?? 1000,
      };
    }

    setProfiles(profileMap);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      setIsAdmin(!!myProfile?.is_admin);
    } else {
      setIsAdmin(false);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDeleteMatch(id: string) {
    const confirmed = window.confirm("Delete this match? This cannot be undone.");
    if (!confirmed) return;

    // Reverse this match's rating changes before deleting it, so ratings
    // stay in sync with actual match history instead of drifting.
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
    loadData();
  }

  function startEditingReplay(matchId: string) {
    setEditingReplayId(matchId);
    setEditReplayLink("");
    setEditReplayFile(null);
  }

  function cancelEditingReplay() {
    setEditingReplayId(null);
    setEditReplayLink("");
    setEditReplayFile(null);
  }

  async function saveReplayForMatch(matchId: string) {
    setSavingReplay(true);

    let replayUrl: string | null = null;

    if (editReplayFile) {
      const ext = editReplayFile.name.split(".").pop() || "rep";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("replays")
        .upload(path, editReplayFile);

      if (uploadError) {
        alert(`Replay upload failed: ${uploadError.message}`);
        setSavingReplay(false);
        return;
      }

      const { data } = supabase.storage.from("replays").getPublicUrl(path);
      replayUrl = data.publicUrl;
    } else if (editReplayLink.trim()) {
      replayUrl = editReplayLink.trim();
    }

    if (!replayUrl) {
      alert("Paste a link or choose a file first.");
      setSavingReplay(false);
      return;
    }

    await supabase.from("matches").update({ replay_url: replayUrl }).eq("id", matchId);
    setSavingReplay(false);
    cancelEditingReplay();
    loadData();
  }

  const now = Date.now();
  const dateFiltered = matches.filter((m) => {
    if (dateRange === "all") return true;
    const ageMs = now - new Date(m.created_at).getTime();
    if (dateRange === "week") return ageMs <= 7 * 24 * 60 * 60 * 1000;
    if (dateRange === "month") return ageMs <= 30 * 24 * 60 * 60 * 1000;
    return true;
  });

  const viewFiltered = dateFiltered.filter((m) => {
    if (view === "ffa") return m.mode === "ffa";
    // view === "team": include 2v2/3v3/4v4, optionally narrowed by size
    if (m.mode === "ffa") return false;
    if (teamSizeFilter === "all") return true;
    return m.mode === teamSizeFilter;
  });

  const filtered = viewFiltered;

  // matches are already newest-first; build stats + streaks
  const stats = new Map<string, StatRow>();
  function ratingFor(username: string): number {
    const p = profiles[username];
    if (!p) return 1000;
    return view === "ffa" ? p.rating_ffa : p.rating_team;
  }
  // iterate oldest-first for correct streak computation, but we already have newest-first,
  // so reverse a copy for streak calc while keeping win/loss totals order-independent
  const oldestFirst = [...filtered].slice().reverse();

  for (const m of oldestFirst) {
    for (const username of m.participants) {
      const row =
        stats.get(username) ??
        ({
          username,
          wins: 0,
          losses: 0,
          avatar_url: profiles[username]?.avatar_url ?? null,
          rating: ratingFor(username),
          streak: 0,
        } as StatRow);

      const won = m.winners.includes(username);
      if (won) {
        row.wins += 1;
        row.streak = row.streak >= 0 ? row.streak + 1 : 1;
      } else {
        row.losses += 1;
        row.streak = row.streak <= 0 ? row.streak - 1 : -1;
      }
      stats.set(username, row);
    }
  }

  let ranked = Array.from(stats.values());

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    ranked = ranked.filter((p) => p.username.toLowerCase().includes(q));
  }

  ranked.sort((a, b) => {
    if (sortKey === "wins") return b.wins - a.wins || a.username.localeCompare(b.username);
    if (sortKey === "rating") return b.rating - a.rating || a.username.localeCompare(b.username);
    if (sortKey === "matches")
      return b.wins + b.losses - (a.wins + a.losses) || a.username.localeCompare(b.username);
    // winrate
    const aTotal = a.wins + a.losses;
    const bTotal = b.wins + b.losses;
    const aRate = aTotal > 0 ? a.wins / aTotal : 0;
    const bRate = bTotal > 0 ? b.wins / bTotal : 0;
    return bRate - aRate || a.username.localeCompare(b.username);
  });

  return (
    <main className="leaderboard-page">
      <div className="leaderboard-container">
        <h1>Leaderboard</h1>

        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", borderBottom: "1px solid #222" }}>
          {(["team", "ffa"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.5rem 0.25rem",
                fontFamily: "inherit",
                textTransform: "uppercase",
                fontSize: "0.9rem",
                letterSpacing: "0.05em",
                color: view === v ? "#f5a623" : "#888",
                fontWeight: view === v ? 700 : 400,
                borderBottom: view === v ? "2px solid #f5a623" : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {v === "team" ? "Team (2v2/3v3/4v4)" : "FFA"}
            </button>
          ))}
        </div>

        {view === "team" && (
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            {(["all", "2v2", "3v3", "4v4"] as const).map((size) => (
              <button
                key={size}
                onClick={() => setTeamSizeFilter(size)}
                style={{
                  background: teamSizeFilter === size ? "#f5a623" : "none",
                  color: teamSizeFilter === size ? "#000" : "#888",
                  border: "1px solid #f5a623",
                  borderRadius: "3px",
                  padding: "0.2rem 0.6rem",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontWeight: teamSizeFilter === size ? 700 : 400,
                }}
              >
                {size === "all" ? "All sizes" : size}
              </button>
            ))}
          </div>
        )}

        {/* Search / filter / sort controls */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search player..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "#131313",
              border: "1px solid #333",
              color: "#eee",
              padding: "0.4rem 0.6rem",
              fontFamily: "inherit",
              flex: "1 1 180px",
            }}
          />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            style={{ background: "#131313", border: "1px solid #333", color: "#f5a623", padding: "0.4rem 0.6rem", fontFamily: "inherit" }}
          >
            <option value="all">All time</option>
            <option value="month">This month</option>
            <option value="week">This week</option>
          </select>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            style={{ background: "#131313", border: "1px solid #333", color: "#f5a623", padding: "0.4rem 0.6rem", fontFamily: "inherit" }}
          >
            <option value="wins">Sort: Wins</option>
            <option value="winrate">Sort: Win %</option>
            <option value="rating">Sort: Rating</option>
            <option value="matches">Sort: Matches played</option>
          </select>
        </div>

        {loading ? (
          <TankSpinner label="Loading leaderboard..." />
        ) : (
          <>
            <div className="leaderboard-table" style={{ display: "flex", flexDirection: "column" }}>
              <div
                className="leaderboard-header-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px 1fr 70px 50px 50px 70px",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.6rem 0.75rem",
                }}
              >
                <span className="lb-rank" style={{ whiteSpace: "nowrap" }}>#</span>
                <span className="lb-player" style={{ whiteSpace: "nowrap" }}>Player</span>
                <span className="lb-stat" style={{ whiteSpace: "nowrap", textAlign: "right" }}>Rating</span>
                <span className="lb-stat" style={{ whiteSpace: "nowrap", textAlign: "right" }}>W</span>
                <span className="lb-stat" style={{ whiteSpace: "nowrap", textAlign: "right" }}>L</span>
                <span className="lb-stat" style={{ whiteSpace: "nowrap", textAlign: "right" }}>Win %</span>
              </div>

              {ranked.map((p, i) => {
                const total = p.wins + p.losses;
                const winRate = total > 0 ? Math.round((p.wins / total) * 100) : 0;

                const podiumStyles = [
                  {
                    background: "linear-gradient(90deg, rgba(245,166,35,0.14), rgba(245,166,35,0.02))",
                    borderLeft: "3px solid #f5a623",
                  },
                  {
                    background: "linear-gradient(90deg, rgba(192,192,192,0.12), rgba(192,192,192,0.02))",
                    borderLeft: "3px solid #c0c0c0",
                  },
                  {
                    background: "linear-gradient(90deg, rgba(205,127,50,0.12), rgba(205,127,50,0.02))",
                    borderLeft: "3px solid #cd7f32",
                  },
                ];
                const medal = ["🥇", "🥈", "🥉"];

                return (
                  <Link
                    key={p.username}
                    href={`/profile/${p.username}`}
                    className="leaderboard-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "40px 1fr 70px 50px 50px 70px",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: i < 3 ? "0.8rem 0.75rem" : "0.6rem 0.75rem",
                      ...(i < 3 ? podiumStyles[i] : {}),
                    }}
                  >
                    <span
                      className="lb-rank"
                      style={{ whiteSpace: "nowrap", fontSize: i < 3 ? "1.1rem" : "1rem" }}
                    >
                      {i < 3 ? medal[i] : i + 1}
                    </span>
                    <span
                      className="lb-player"
                      style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0, overflow: "hidden" }}
                    >
                      <img
                        src={p.avatar_url || "/default-avatar.svg"}
                        alt={p.username}
                        className="lb-avatar"
                        style={{
                          width: i < 3 ? "34px" : "28px",
                          height: i < 3 ? "34px" : "28px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          flexShrink: 0,
                          border: i < 3 ? `2px solid ${["#f5a623", "#c0c0c0", "#cd7f32"][i]}` : "none",
                        }}
                      />
                      <span
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontWeight: i < 3 ? 700 : 400,
                        }}
                      >
                        {p.username}
                      </span>
                      {p.streak >= 3 && (
                        <span style={{ fontSize: "0.75rem", color: "#f97316", flexShrink: 0 }}>🔥{p.streak}</span>
                      )}
                    </span>
                    <span
                      className="lb-stat"
                      style={{
                        whiteSpace: "nowrap",
                        textAlign: "right",
                        fontWeight: i < 3 ? 700 : 400,
                        color: i < 3 ? "#f5a623" : "inherit",
                      }}
                    >
                      {p.rating}
                    </span>
                    <span className="lb-stat lb-wins" style={{ whiteSpace: "nowrap", textAlign: "right" }}>{p.wins}</span>
                    <span className="lb-stat lb-losses" style={{ whiteSpace: "nowrap", textAlign: "right" }}>{p.losses}</span>
                    <span className="lb-stat" style={{ whiteSpace: "nowrap", textAlign: "right" }}>{winRate}%</span>
                  </Link>
                );
              })}

              {ranked.length === 0 && (
                <p className="leaderboard-empty">No matches logged yet in this view.</p>
              )}
            </div>

            <h2 style={{ marginTop: "2rem" }}>Recent Matches</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {filtered.slice(0, 20).map((m) => {
                const losers = m.participants.filter((p) => !m.winners.includes(p));
                return (
                  <div key={m.id}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.75rem 1rem",
                      background: "#0e0e0e",
                      border: "1px solid #222",
                      borderRadius: "6px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        flex: "1 1 220px",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        background: "rgba(34,197,94,0.08)",
                        border: "1px solid rgba(34,197,94,0.5)",
                        borderRadius: "4px",
                        padding: "0.5rem 0.75rem",
                      }}
                    >
                      <span style={{ color: "#22c55e", fontSize: "0.9rem" }}>✓</span>
                      <span style={{ fontSize: "0.85rem", color: "#eee", flex: 1 }}>
                        {m.winners.join(", ")}
                        {m.rating_changes && (
                          <span style={{ color: "#22c55e", marginLeft: "0.4rem" }}>
                            (+{m.rating_changes[m.winners[0]] ?? 0})
                          </span>
                        )}
                      </span>
                    </div>

                    <span style={{ opacity: 0.5, fontSize: "0.75rem", flex: "0 0 auto" }}>VS</span>

                    <div
                      style={{
                        flex: "1 1 220px",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        background: "rgba(239,68,68,0.06)",
                        border: "1px solid rgba(239,68,68,0.35)",
                        borderRadius: "4px",
                        padding: "0.5rem 0.75rem",
                      }}
                    >
                      <span style={{ color: "#ef4444", fontSize: "0.9rem" }}>✕</span>
                      <span style={{ fontSize: "0.85rem", color: "#999" }}>
                        {losers.join(", ") || "—"}
                        {m.rating_changes && losers[0] && (
                          <span style={{ color: "#ef4444", marginLeft: "0.4rem" }}>
                            ({m.rating_changes[losers[0]] ?? 0})
                          </span>
                        )}
                      </span>
                    </div>

                    {m.replay_url ? (
                      <a
                        href={m.replay_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Download replay"
                        style={{
                          flex: "0 0 auto",
                          fontSize: "0.7rem",
                          color: "#f5a623",
                          border: "1px solid #f5a623",
                          borderRadius: "3px",
                          padding: "0.25rem 0.6rem",
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ⬇ Replay
                      </a>
                    ) : isAdmin ? (
                      <button
                        onClick={() => startEditingReplay(m.id)}
                        style={{
                          flex: "0 0 auto",
                          fontSize: "0.7rem",
                          color: "#888",
                          background: "none",
                          border: "1px dashed #444",
                          borderRadius: "3px",
                          padding: "0.25rem 0.6rem",
                          whiteSpace: "nowrap",
                          cursor: "pointer",
                        }}
                      >
                        No replay — Add one
                      </button>
                    ) : (
                      <span
                        style={{
                          flex: "0 0 auto",
                          fontSize: "0.7rem",
                          color: "#666",
                          border: "1px solid #333",
                          borderRadius: "3px",
                          padding: "0.25rem 0.6rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        No replay found
                      </span>
                    )}

                    <span
                      style={{
                        flex: "0 0 auto",
                        fontSize: "0.7rem",
                        textTransform: "uppercase",
                        color: "#f5a623",
                        border: "1px solid #f5a623",
                        borderRadius: "3px",
                        padding: "0.15rem 0.4rem",
                      }}
                    >
                      {m.mode}
                    </span>

                    {m.tournament_name && (
                      <span style={{ flex: "0 0 auto", fontSize: "0.7rem", opacity: 0.7 }}>
                        {m.tournament_name}
                        {m.round ? ` · ${m.round}` : ""}
                      </span>
                    )}

                    <span style={{ flex: "0 0 auto", fontSize: "0.75rem", opacity: 0.6 }}>
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteMatch(m.id)}
                        style={{
                          flex: "0 0 auto",
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
                    )}
                  </div>

                  {editingReplayId === m.id && (
                    <div
                      style={{
                        marginTop: "0.4rem",
                        padding: "0.6rem",
                        border: "1px dashed #f5a623",
                        borderRadius: "4px",
                        background: "#111",
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Replay link"
                        value={editReplayLink}
                        onChange={(e) => {
                          setEditReplayLink(e.target.value);
                          if (e.target.value) setEditReplayFile(null);
                        }}
                        disabled={!!editReplayFile}
                        style={{
                          flex: "1 1 180px",
                          background: "#131313",
                          border: "1px solid #333",
                          color: editReplayFile ? "#666" : "#eee",
                          padding: "0.35rem 0.6rem",
                          fontFamily: "inherit",
                          fontSize: "0.8rem",
                        }}
                      />
                      <input
                        type="file"
                        id={`replay-edit-${m.id}`}
                        accept=".rep,.zip"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setEditReplayFile(file);
                          if (file) setEditReplayLink("");
                        }}
                        style={{ display: "none" }}
                      />
                      <label
                        htmlFor={`replay-edit-${m.id}`}
                        style={{
                          fontSize: "0.75rem",
                          color: "#f5a623",
                          border: "1px solid #f5a623",
                          borderRadius: "3px",
                          padding: "0.35rem 0.6rem",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {editReplayFile ? editReplayFile.name : "Choose file"}
                      </label>
                      <button
                        onClick={() => saveReplayForMatch(m.id)}
                        disabled={savingReplay}
                        style={{
                          fontSize: "0.75rem",
                          background: "#f5a623",
                          color: "#000",
                          border: "none",
                          borderRadius: "3px",
                          padding: "0.35rem 0.7rem",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        {savingReplay ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={cancelEditingReplay}
                        style={{
                          fontSize: "0.75rem",
                          background: "none",
                          color: "#888",
                          border: "1px solid #444",
                          borderRadius: "3px",
                          padding: "0.35rem 0.7rem",
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

              {filtered.length === 0 && (
                <p className="leaderboard-empty">No matches logged yet in this view.</p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
