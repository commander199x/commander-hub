"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, bio, avatar_url")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUsername(profile.username ?? "");
        setBio(profile.bio ?? "");
        setAvatarUrl(profile.avatar_url ?? "");
      }

      setLoading(false);
    }

    loadProfile();
  }, [router, supabase]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username, bio, avatar_url: avatarUrl })
      .eq("id", user.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push(`/profile/${username}`);
  }

  if (loading) {
    return <main className="profile-page">Loading...</main>;
  }

  return (
    <main className="auth-page">
      <form onSubmit={handleSave} className="auth-form">
        <h1>Edit profile</h1>

        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={24}
        />

        <label htmlFor="avatarUrl">Avatar URL</label>
        <input
          id="avatarUrl"
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://..."
        />

        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={280}
          rows={4}
        />

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </main>
  );
}
