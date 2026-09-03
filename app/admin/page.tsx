"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MatchForm from "@/components/MatchForm";
import RecentMatchesAdmin from "@/components/RecentMatchesAdmin";
import "@/app/admin.css";

interface Profile {
  id: string;
  username: string;
  banned: boolean;
  is_admin: boolean;
  is_team: boolean;
  is_owner: boolean;
  wins: number;
  losses: number;
}

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function checkAccessAndLoad() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: myProfile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!myProfile?.is_admin) {
        router.push("/");
        return;
      }

      setAuthorized(true);

      const { data: allUsers } = await supabase
        .from("profiles")
        .select("id, username, banned, is_admin, is_team, is_owner, wins, losses")
        .order("username", { ascending: true });

      setUsers(allUsers ?? []);
      setLoading(false);
    }

    checkAccessAndLoad();
  }, [router, supabase]);

  async function toggleBan(id: string, current: boolean) {
    const { error } = await supabase
      .from("profiles")
      .update({ banned: !current })
      .eq("id", id);

    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, banned: !current } : u))
      );
    }
  }

  async function deleteAllMessages(id: string, username: string) {
    const confirmed = window.confirm(
      `Delete ALL messages from "${username}"? This cannot be undone.`
    );
    if (!confirmed) return;

    await supabase.from("messages").delete().eq("user_id", id);
  }

  async function toggleTeam(id: string, current: boolean) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_team: !current })
      .eq("id", id);

    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_team: !current } : u))
      );
    }
  }

  async function adjustWins(id: string, delta: number) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const newWins = Math.max(0, user.wins + delta);

    const { error } = await supabase
      .from("profiles")
      .update({ wins: newWins })
      .eq("id", id);

    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, wins: newWins } : u))
      );
    }
  }

  async function adjustLosses(id: string, delta: number) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const newLosses = Math.max(0, user.losses + delta);

    const { error } = await supabase
      .from("profiles")
      .update({ losses: newLosses })
      .eq("id", id);

    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, losses: newLosses } : u))
      );
    }
  }

  if (loading) {
    return <main className="admin-page">Loading...</main>;
  }

  if (!authorized) return null;

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="admin-page">
      <div className="admin-panel">
        <MatchForm allUsers={users.map((u) => ({ username: u.username }))} />

        <RecentMatchesAdmin />

        <h1>User Moderation</h1>

        <input
          type="text"
          placeholder="Search username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search"
        />

        <div className="admin-user-list">
          {filtered.map((u) => (
            <div key={u.id} className="admin-user-row">
              <span className="admin-username">
                {u.username}
                {u.is_owner && <span className="admin-badge admin-badge-owner">OWNER</span>}
                {u.is_admin && <span className="admin-badge">ADMIN</span>}
                {u.is_team && <span className="admin-badge admin-badge-team">TEAM</span>}
              </span>
              <div className="admin-stats-controls">
                <span className="admin-stat-label">W</span>
                <button className="admin-stat-btn" onClick={() => adjustWins(u.id, -1)}>-</button>
                <span className="admin-stat-value admin-stat-wins">{u.wins}</span>
                <button className="admin-stat-btn" onClick={() => adjustWins(u.id, 1)}>+</button>

                <span className="admin-stat-label">L</span>
                <button className="admin-stat-btn" onClick={() => adjustLosses(u.id, -1)}>-</button>
                <span className="admin-stat-value admin-stat-losses">{u.losses}</span>
                <button className="admin-stat-btn" onClick={() => adjustLosses(u.id, 1)}>+</button>
              </div>
              <div className="admin-actions">
                <button
                  className={u.is_team ? "admin-unteam-btn" : "admin-team-btn"}
                  onClick={() => toggleTeam(u.id, u.is_team)}
                >
                  {u.is_team ? "Remove Team" : "Make Team"}
                </button>
                <button
                  className="admin-delete-msgs-btn"
                  onClick={() => deleteAllMessages(u.id, u.username)}
                >
                  Delete Messages
                </button>
                <button
                  className={u.banned ? "admin-unban-btn" : "admin-ban-btn"}
                  onClick={() => toggleBan(u.id, u.banned)}
                  disabled={u.is_admin || u.is_owner}
                  title={u.is_admin || u.is_owner ? "Cannot ban an admin/owner" : undefined}
                >
                  {u.banned ? "Unban" : "Ban"}
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="admin-empty">No users found.</p>
          )}
        </div>
      </div>
    </main>
  );
}
