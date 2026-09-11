"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import TankSpinner from "@/components/TankSpinner";

interface AuditEntry {
  id: string;
  admin_username: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  ban_user: "Banned a user",
  unban_user: "Unbanned a user",
  delete_all_messages: "Deleted all messages from a user",
  delete_match: "Deleted a match",
  recalculate_all_ratings: "Recalculated all ratings",
  reset_season_ratings: "Reset season ratings",
};

export default function AuditLogPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [entries, setEntries] = useState<AuditEntry[]>([]);

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

      const { data } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      setEntries(data ?? []);
      setLoading(false);
    }

    checkAccessAndLoad();
  }, [router, supabase]);

  if (loading) {
    return (
      <main style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
        <TankSpinner label="Loading audit log..." />
      </main>
    );
  }

  if (!authorized) return null;

  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <h1>Admin Audit Log</h1>
        <Link href="/admin" style={{ fontSize: "0.8rem", color: "#f5a623" }}>
          ← Back to admin panel
        </Link>
      </div>

      <p style={{ fontSize: "0.8rem", opacity: 0.6, marginBottom: "1.5rem" }}>
        A record of significant admin actions (bans, match deletions, rating recalculations/resets) for
        accountability. Shows the most recent 100 entries.
      </p>

      {entries.length === 0 ? (
        <p style={{ opacity: 0.6 }}>No actions logged yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                padding: "0.75rem 1rem",
                background: "#0e0e0e",
                border: "1px solid #222",
                borderRadius: "6px",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <span>
                  <span style={{ color: "#f5a623", fontWeight: 700 }}>{entry.admin_username}</span>{" "}
                  <span style={{ opacity: 0.8 }}>{ACTION_LABELS[entry.action] ?? entry.action}</span>
                </span>
                <span style={{ opacity: 0.5, fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </div>
              {entry.details && (
                <pre
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.7rem",
                    opacity: 0.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {JSON.stringify(entry.details, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
