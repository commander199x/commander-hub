"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import TankSpinner from "@/components/TankSpinner";
import { useFeedback } from "@/components/FeedbackProvider";
import { restoreMatchFromTrash } from "@/lib/matchTrash";
import { logAdminAction } from "@/lib/auditLog";

type TrashRow = {
  id: string;
  match_id: string;
  deleted_at: string;
  data: {
    mode: string;
    participants: string[];
    winners: string[];
    map?: string | null;
    tournament_name?: string | null;
    created_at?: string;
  };
};

export default function DeletedMatchesPage() {
  const router = useRouter();
  const supabase = createClient();
  const fb = useFeedback();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [adminUsername, setAdminUsername] = useState("unknown");
  const [rows, setRows] = useState<TrashRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: myProfile } = await supabase
        .from("profiles")
        .select("is_admin, username")
        .eq("id", user.id)
        .single();

      if (!myProfile?.is_admin) {
        router.push("/");
        return;
      }

      setAuthorized(true);
      setAdminUsername(myProfile.username ?? "unknown");

      const { data } = await supabase
        .from("matches_trash")
        .select("id, match_id, deleted_at, data")
        .order("deleted_at", { ascending: false })
        .limit(100);

      setRows((data ?? []) as TrashRow[]);
      setLoading(false);
    }
    load();
  }, [router, supabase]);

  async function handleRestore(row: TrashRow) {
    const ok = await fb.confirm({
      title: "Restore this match?",
      message: `This puts the ${row.data.mode.toUpperCase()} match back on the leaderboard and re-applies its rating changes.`,
      confirmLabel: "Restore",
    });
    if (!ok) return;

    setBusyId(row.id);
    const result = await restoreMatchFromTrash(supabase, { trashId: row.id });
    setBusyId(null);

    if (!result.ok) {
      fb.error(`Couldn't restore the match: ${result.error}`);
      return;
    }

    await logAdminAction(supabase, adminUsername, "restore_match", {
      match_id: row.match_id,
      mode: row.data.mode,
      participants: row.data.participants,
      winners: row.data.winners,
    });

    setRows((prev) => prev.filter((r) => r.id !== row.id));
    fb.success("Match restored.");
  }

  if (loading) {
    return (
      <main style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
        <TankSpinner label="Loading deleted matches..." />
      </main>
    );
  }

  if (!authorized) return null;

  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <h1>Deleted Matches</h1>
        <Link href="/admin" style={{ fontSize: "0.8rem", color: "#f5a623" }}>
          ← Back to admin panel
        </Link>
      </div>

      <p style={{ fontSize: "0.8rem", opacity: 0.6, marginBottom: "1.5rem" }}>
        Every match that gets deleted is saved here automatically. Restore one to put it back on the
        leaderboard with its original rating changes. Showing the 100 most recent.
      </p>

      {rows.length === 0 ? (
        <p style={{ opacity: 0.6 }}>Nothing has been deleted since this safety net was turned on.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {rows.map((row) => {
            const losers = row.data.participants.filter((p) => !row.data.winners.includes(p));
            return (
              <div
                key={row.id}
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
                <span
                  style={{
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    color: "#f5a623",
                    border: "1px solid #f5a623",
                    borderRadius: "3px",
                    padding: "0.15rem 0.4rem",
                  }}
                >
                  {row.data.mode}
                </span>

                <div style={{ flex: "1 1 280px", fontSize: "0.82rem", lineHeight: 1.5 }}>
                  <div style={{ color: "#22c55e" }}>✓ {row.data.winners.join(", ")}</div>
                  <div style={{ color: "#ef4444" }}>✕ {losers.join(", ") || "—"}</div>
                  {(row.data.map || row.data.tournament_name) && (
                    <div style={{ opacity: 0.5, fontSize: "0.7rem", marginTop: "0.2rem" }}>
                      {[row.data.map, row.data.tournament_name].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>

                <span style={{ fontSize: "0.72rem", opacity: 0.55, whiteSpace: "nowrap" }}>
                  Deleted {new Date(row.deleted_at).toLocaleString()}
                </span>

                <button
                  onClick={() => handleRestore(row)}
                  disabled={busyId === row.id}
                  style={{
                    background: "none",
                    border: "1px solid #22c55e",
                    color: "#22c55e",
                    borderRadius: "3px",
                    padding: "0.3rem 0.8rem",
                    fontSize: "0.75rem",
                    cursor: busyId === row.id ? "default" : "pointer",
                    opacity: busyId === row.id ? 0.6 : 1,
                  }}
                >
                  {busyId === row.id ? "Restoring..." : "↺ Restore"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
