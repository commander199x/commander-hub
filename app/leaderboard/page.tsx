"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import "@/app/leaderboard.css";
import TankSpinner from "@/components/TankSpinner";
import { logAdminAction } from "@/lib/auditLog";
import { useFeedback } from "@/components/FeedbackProvider";
import { restoreMatchFromTrash } from "@/lib/matchTrash";

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
  map: string | null;
  created_at: string;
};

type StatRow = {
  username: string;
  wins: number;
  losses: number;
  avatar_url: string | null;
  rating: number;
  streak: number;
};

type SortKey = "wins" | "winrate" | "rating" | "matches";
type DateRange = "all" | "week" | "month";

export default function LeaderboardPage() {
  const supabase = createClient();
  const fb = useFeedback();
  const [view, setView] = useState<"team" | "ffa">("team");
  const [teamSizeFilter, setTeamSizeFilter] = useState<"all" | "2v2" | "3v3" | "4v4">("all");
  const [matches, setMatches] = useState<Match[]>([]);
  const [profiles, setProfiles] = useState<
    Record<string, { avatar_url: string | null; rating_team: number; rating_ffa: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUsername, setAdminUsername] = useState<string>("unknown");

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [matchesPage, setMatchesPage] = useState(1);
  const MATCHES_PAGE_SIZE = 10;

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
        .select("is_admin, username")
        .eq("id", user.id)
        .single();
      setIsAdmin(!!myProfile?.is_admin);
      setAdminUsername(myProfile?.username ?? "unknown");
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
    const confirmed = await fb.confirm({
      title: "Delete this match?",
      message:
        "Its rating changes will be reversed. You'll get an Undo button right after, and it stays recoverable from Admin → Deleted matches.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!confirmed) return;

    const matchToDelete = matches.find((m) => m.id === id);

    // Delete first, so a failure here can't leave ratings reversed for a
    // match that still exists.
    const { error: deleteError } = await supabase.from("matches").delete().eq("id", id);
    if (deleteError) {
      fb.error(`Couldn't delete the match: ${deleteError.message}`);
      return;
    }

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

    await logAdminAction(supabase, adminUsername, "delete_match", {
      match_id: id,
      mode: matchToDelete?.mode,
      participants: matchToDelete?.participants,
      winners: matchToDelete?.winners,
    });
    fb.toast("Match deleted.", {
      kind: "info",
      action: {
        label: "Undo",
        onClick: () => {
          void undoDeleteMatch(id);
        },
      },
    });
    loadData();
  }

  async function undoDeleteMatch(id: string) {
    const result = await restoreMatchFromTrash(supabase, { matchId: id });
    if (!result.ok) {
      fb.error(`Couldn't undo the delete: ${result.error}`);
      return;
    }
    await logAdminAction(supabase, adminUsername, "restore_match", { match_id: id, via: "undo" });
    fb.success("Match restored.");
    loadData();
  }

  async function handleReportMatch(id: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      fb.info("Please log in to report a match.");
      return;
    }

    const reason = await fb.prompt({
      title: "Report this match",
      message: "Tell the admins what's wrong with this result so they can review it.",
      placeholder: "e.g. wrong winner, suspected cheating",
      multiline: true,
      confirmLabel: "Send report",
    });
    if (!reason || !reason.trim()) return;

    const { error } = await supabase.from("match_reports").insert({
      match_id: id,
      reported_by: user?.id ?? null,
      reason: reason.trim(),
    });

    if (error) {
      fb.error(`Couldn't submit the report: ${error.message}`);
    } else {
      fb.success("Report submitted. An admin will review this match.");
    }
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
        fb.error(`Replay upload failed: ${uploadError.message}`);
        setSavingReplay(false);
        return;
      }

      const { data } = supabase.storage.from("replays").getPublicUrl(path);
      replayUrl = data.publicUrl;
    } else if (editReplayLink.trim()) {
      replayUrl = editReplayLink.trim();
    }

    if (!replayUrl) {
      fb.info("Paste a link or choose a file first.");
      setSavingReplay(false);
      return;
    }

    const { error: saveError } = await supabase.from("matches").update({ replay_url: replayUrl }).eq("id", matchId);
    setSavingReplay(false);
    if (saveError) {
      fb.error(`Couldn't save the replay: ${saveError.message}`);
      return;
    }
    fb.success("Replay added.");
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
    if (m.mode === "ffa") return false;
    if (teamSizeFilter === "all") return true;
    return m.mode === teamSizeFilter;
  });

  const filtered = viewFiltered;

  function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"} ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  const stats = new Map<string, StatRow>();
  function ratingFor(username: string): number {
    const p = profiles[username];
    if (!p) return 1000;
    return view === "ffa" ? p.rating_ffa : p.rating_team;
  }
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
    const aTotal = a.wins + a.losses;
    const bTotal = b.wins + b.losses;
    const aRate = aTotal > 0 ? a.wins / aTotal : 0;
    const bRate = bTotal > 0 ? b.wins / bTotal : 0;
    return bRate - aRate || a.username.localeCompare(b.username);
  });

  const MIN_MATCHES_FOR_RANK = 3;
  const qualifiedRanked = ranked.filter((p) => p.wins + p.losses >= MIN_MATCHES_FOR_RANK);
  const provisionalRanked = ranked.filter((p) => p.wins + p.losses < MIN_MATCHES_FOR_RANK);

  return (
    <main className="leaderboard-page">
      <div className="leaderboard-container">
        <h1>Leaderboard</h1>

        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", borderBottom: "1px solid #222" }}>
          {(["team", "ffa"] as const).map((v) => (
            <button
              key={v}
              onClick={() => { setView(v); setMatchesPage(1); }}
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
                onClick={() => { setTeamSizeFilter(size); setMatchesPage(1); }}
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
            onChange={(e) => { setDateRange(e.target.value as DateRange); setMatchesPage(1); }}
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

              {qualifiedRanked.map((p, i) => {
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
                      {total >= 30 ? (
                        <span
                          title={`${total} matches played`}
                          style={{
                            fontSize: "0.65rem",
                            color: "#c084fc",
                            border: "1px solid #c084fc",
                            borderRadius: "3px",
                            padding: "0.05rem 0.35rem",
                            flexShrink: 0,
                            whiteSpace: "nowrap",
                          }}
                        >
                          🎖️ Veteran
                        </span>
                      ) : total >= 15 ? (
                        <span
                          title={`${total} matches played`}
                          style={{
                            fontSize: "0.65rem",
                            color: "#60a5fa",
                            border: "1px solid #60a5fa",
                            borderRadius: "3px",
                            padding: "0.05rem 0.35rem",
                            flexShrink: 0,
                            whiteSpace: "nowrap",
                          }}
                        >
                          ⚔️ Active
                        </span>
                      ) : null}
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

              {qualifiedRanked.length === 0 && (
                <p className="leaderboard-empty">
                  No players have reached {MIN_MATCHES_FOR_RANK} matches yet in this view.
                </p>
              )}
            </div>

            {provisionalRanked.length > 0 && (
              <div style={{ marginTop: "1.5rem" }}>
                <p style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: "0.5rem" }}>
                  Provisional — needs {MIN_MATCHES_FOR_RANK} matches to hold an official rank
                </p>
                <div className="leaderboard-table" style={{ display: "flex", flexDirection: "column", opacity: 0.7 }}>
                  {provisionalRanked.map((p) => {
                    const total = p.wins + p.losses;
                    const winRate = total > 0 ? Math.round((p.wins / total) * 100) : 0;
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
                          padding: "0.5rem 0.75rem",
                        }}
                      >
                        <span className="lb-rank" style={{ whiteSpace: "nowrap", fontSize: "0.75rem" }}>
                          {total}/{MIN_MATCHES_FOR_RANK}
                        </span>
                        <span
                          className="lb-player"
                          style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0, overflow: "hidden" }}
                        >
                          <img
                            src={p.avatar_url || "/default-avatar.svg"}
                            alt={p.username}
                            className="lb-avatar"
                            style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                          />
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.9rem" }}>
                            {p.username}
                          </span>
                        </span>
                        <span className="lb-stat" style={{ whiteSpace: "nowrap", textAlign: "right" }}>{p.rating}</span>
                        <span className="lb-stat lb-wins" style={{ whiteSpace: "nowrap", textAlign: "right" }}>{p.wins}</span>
                        <span className="lb-stat lb-losses" style={{ whiteSpace: "nowrap", textAlign: "right" }}>{p.losses}</span>
                        <span className="lb-stat" style={{ whiteSpace: "nowrap", textAlign: "right" }}>{winRate}%</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <h2 style={{ marginTop: "2rem" }}>Recent Matches</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "32px 1fr 1fr 140px auto auto auto auto",
                alignItems: "center",
                gap: "1rem",
                padding: "0.5rem 1rem",
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#666",
                borderBottom: "1px solid #222",
                marginBottom: "0.4rem",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <span>#</span>
              <span>Teams</span>
              <span></span>
              <span>Map</span>
              <span style={{ textAlign: "center" }}>Type</span>
              <span style={{ textAlign: "right" }}>Time</span>
              <span style={{ textAlign: "center" }}>Replay</span>
              <span style={{ textAlign: "center" }}>Report</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", width: "100%" }}>
              {filtered.slice((matchesPage - 1) * MATCHES_PAGE_SIZE, matchesPage * MATCHES_PAGE_SIZE).map((m, idx) => {
                const losers = m.participants.filter((p) => !m.winners.includes(p));
                const rowNumber = (matchesPage - 1) * MATCHES_PAGE_SIZE + idx + 1;

                const renderPlayer = (username: string, won: boolean) => (
                  <div key={username} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <img
                      src={profiles[username]?.avatar_url || "/default-avatar.svg"}
                      alt={username}
                      style={{ width: "22px", height: "22px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "0.85rem", color: "#eee", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {username}
                    </span>
                    {m.rating_changes && username in m.rating_changes && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: won ? "#22c55e" : "#ef4444",
                          background: won ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                          borderRadius: "3px",
                          padding: "0.1rem 0.4rem",
                          flexShrink: 0,
                        }}
                      >
                        {m.rating_changes[username] >= 0 ? "+" : ""}
                        {m.rating_changes[username]}
                      </span>
                    )}
                    <span style={{ color: won ? "#22c55e" : "#ef4444", fontSize: "0.8rem", flexShrink: 0 }}>
                      {won ? "✓" : "✕"}
                    </span>
                  </div>
                );

                return (
                  <div key={m.id} style={{ width: "100%" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "32px 1fr 1fr 140px auto auto auto auto",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.85rem 1rem",
                      background: rowNumber % 2 === 0 ? "#12161c" : "#0d1015",
                      border: "1px solid #222",
                      borderRadius: "6px",
                      flexWrap: "wrap",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <span
                      style={{
                        width: "26px",
                        height: "26px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#1c222b",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        color: "#888",
                        flexShrink: 0,
                      }}
                    >
                      {rowNumber}
                    </span>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.3rem",
                        background: "rgba(34,197,94,0.06)",
                        border: "1px solid rgba(34,197,94,0.4)",
                        borderRadius: "4px",
                        padding: "0.5rem 0.75rem",
                        minWidth: "180px",
                      }}
                    >
                      {m.winners.map((w) => renderPlayer(w, true))}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.3rem",
                        background: "rgba(239,68,68,0.05)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: "4px",
                        padding: "0.5rem 0.75rem",
                        minWidth: "180px",
                      }}
                    >
                      {losers.length > 0 ? losers.map((l) => renderPlayer(l, false)) : (
                        <span style={{ fontSize: "0.8rem", opacity: 0.4 }}>—</span>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "#ccc",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={m.map ?? undefined}
                    >
                      {m.map || "—"}
                    </span>

                    <span
                      style={{
                        fontSize: "0.7rem",
                        textTransform: "uppercase",
                        color: "#f5a623",
                        border: "1px solid #f5a623",
                        borderRadius: "3px",
                        padding: "0.15rem 0.4rem",
                        whiteSpace: "nowrap",
                        justifySelf: "center",
                      }}
                    >
                      {m.mode}
                    </span>

                    <span style={{ fontSize: "0.75rem", opacity: 0.55, whiteSpace: "nowrap", textAlign: "right" }}>
                      {timeAgo(m.created_at)}
                    </span>

                    {m.replay_url ? (
                      <a
                        href={m.replay_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Download replay"
                        style={{ color: "#f5a623", fontSize: "1rem", textDecoration: "none", justifySelf: "center" }}
                      >
                        ⬇
                      </a>
                    ) : isAdmin ? (
                      <button
                        onClick={() => startEditingReplay(m.id)}
                        title="Add a replay"
                        style={{
                          background: "none",
                          border: "1px dashed #444",
                          color: "#666",
                          borderRadius: "3px",
                          padding: "0.1rem 0.4rem",
                          fontSize: "0.65rem",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        + Replay
                      </button>
                    ) : (
                      <span style={{ opacity: 0.2, fontSize: "1rem", justifySelf: "center" }}>—</span>
                    )}

                    <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", alignItems: "center" }}>
                      <button
                        onClick={() => handleReportMatch(m.id)}
                        title="Report this match"
                        style={{
                          background: "none",
                          border: "1px solid #666",
                          color: "#888",
                          borderRadius: "3px",
                          padding: "0.15rem 0.4rem",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          lineHeight: 1,
                        }}
                      >
                        🚩
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteMatch(m.id)}
                          style={{
                            background: "none",
                            border: "1px solid #ef4444",
                            color: "#ef4444",
                            borderRadius: "3px",
                            padding: "0.15rem 0.5rem",
                            fontSize: "0.7rem",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {m.tournament_name && (
                    <p style={{ fontSize: "0.7rem", opacity: 0.5, marginTop: "0.25rem", marginLeft: "3rem" }}>
                      {m.tournament_name}
                      {m.round ? ` · ${m.round}` : ""}
                    </p>
                  )}

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

            {filtered.length > MATCHES_PAGE_SIZE && (
              <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem", flexWrap: "wrap", marginTop: "1rem" }}>
                {(() => {
                  const totalMatchPages = Math.max(1, Math.ceil(filtered.length / MATCHES_PAGE_SIZE));
                  const pageNumbers: (number | "...")[] = [];
                  const neighbors = 1;
                  for (let p = 1; p <= totalMatchPages; p++) {
                    if (p === 1 || p === totalMatchPages || (p >= matchesPage - neighbors && p <= matchesPage + neighbors)) {
                      pageNumbers.push(p);
                    } else if (pageNumbers[pageNumbers.length - 1] !== "...") {
                      pageNumbers.push("...");
                    }
                  }

                  return (
                    <>
                      <button
                        onClick={() => setMatchesPage((p) => Math.max(1, p - 1))}
                        disabled={matchesPage === 1}
                        style={{
                          padding: "0.4rem 0.8rem",
                          fontSize: "0.75rem",
                          background: "none",
                          border: "1px solid #444",
                          color: matchesPage === 1 ? "#444" : "#eee",
                          cursor: matchesPage === 1 ? "default" : "pointer",
                          borderRadius: "3px",
                        }}
                      >
                        ← Prev
                      </button>

                      {pageNumbers.map((p, i) =>
                        p === "..." ? (
                          <span key={`ellipsis-${i}`} style={{ padding: "0.4rem 0.4rem", fontSize: "0.75rem", opacity: 0.5 }}>
                            …
                          </span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setMatchesPage(p)}
                            style={{
                              padding: "0.4rem 0.7rem",
                              fontSize: "0.75rem",
                              background: p === matchesPage ? "#f5a623" : "none",
                              color: p === matchesPage ? "#000" : "#eee",
                              border: "1px solid #444",
                              fontWeight: p === matchesPage ? 700 : 400,
                              cursor: "pointer",
                              borderRadius: "3px",
                            }}
                          >
                            {p}
                          </button>
                        )
                      )}

                      <button
                        onClick={() => setMatchesPage((p) => Math.min(totalMatchPages, p + 1))}
                        disabled={matchesPage === totalMatchPages}
                        style={{
                          padding: "0.4rem 0.8rem",
                          fontSize: "0.75rem",
                          background: "none",
                          border: "1px solid #444",
                          color: matchesPage === totalMatchPages ? "#444" : "#eee",
                          cursor: matchesPage === totalMatchPages ? "default" : "pointer",
                          borderRadius: "3px",
                        }}
                      >
                        Next →
                      </button>
                    </>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
