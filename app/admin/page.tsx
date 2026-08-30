"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import "@/app/admin.css";

interface Profile {
  id: string;
  username: string;
  banned: boolean;
  is_admin: boolean;
  is_team: boolean;
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
        .select("id, username, banned, is_admin, is_team")
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
                {u.is_admin && <span className="admin-badge">ADMIN</span>}
                {u.is_team && <span className="admin-badge admin-badge-team">TEAM</span>}
              </span>
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
                  disabled={u.is_admin}
                  title={u.is_admin ? "Cannot ban an admin" : undefined}
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
