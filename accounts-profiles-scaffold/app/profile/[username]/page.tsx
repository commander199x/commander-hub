import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url, bio, created_at")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  const joined = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="profile-page">
      <div className="profile-card">
        <img
          src={profile.avatar_url || "/default-avatar.png"}
          alt={`${profile.username}'s avatar`}
          className="profile-avatar"
        />
        <h1>{profile.username}</h1>
        <p className="profile-joined">Member since {joined}</p>
        {profile.bio && <p className="profile-bio">{profile.bio}</p>}
      </div>
    </main>
  );
}
