import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import "@/app/members.css";

export default async function MembersPage() {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("profiles")
    .select("username, avatar_url, bio, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="members-page">
      <div className="members-container">
        <h1>Members</h1>
        <p className="members-count">
          {members?.length ?? 0} {members?.length === 1 ? "member" : "members"}
        </p>

        <div className="members-grid">
          {members?.map((m) => (
            <Link
              key={m.username}
              href={`/profile/${m.username}`}
              className="member-card"
            >
              <img
                src={m.avatar_url || "/default-avatar.svg"}
                alt={`${m.username}'s avatar`}
                className="member-avatar"
              />
              <span className="member-username">{m.username}</span>
              {m.bio && <span className="member-bio">{m.bio}</span>}
            </Link>
          ))}

          {(!members || members.length === 0) && (
            <p className="members-empty">No members yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
