"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import "@/app/auth.css";

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, bio, avatar_url")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUsername(profile.username ?? "");
        setBio(profile.bio ?? "");
        setAvatarUrl(profile.avatar_url ?? "");
        setAvatarPreview(profile.avatar_url ?? "");
      }

      setLoading(false);
    }

    loadProfile();
  }, [router, supabase]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB.");
      return;
    }

    setError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function uploadAvatarIfNeeded(): Promise<string> {
    if (!avatarFile || !userId) return avatarUrl;

    setUploading(true);

    const ext = avatarFile.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true });

    setUploading(false);

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    // Cache-bust so the new image shows immediately instead of a stale cached one
    return `${data.publicUrl}?t=${Date.now()}`;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    if (!userId) {
      router.push("/login");
      return;
    }

    try {
      const finalAvatarUrl = await uploadAvatarIfNeeded();

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ username, bio, avatar_url: finalAvatarUrl })
        .eq("id", userId);

      if (updateError) throw new Error(updateError.message);

      router.push(`/profile/${username}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="profile-page">Loading...</main>;
  }

  return (
    <main className="auth-page">
      <form onSubmit={handleSave} className="auth-form">
        <h1>Edit profile</h1>

        <div className="avatar-upload-row">
          <img
            src={avatarPreview || "/default-avatar.png"}
            alt="Avatar preview"
            className="avatar-preview"
          />
          <label htmlFor="avatarFile" className="avatar-upload-btn">
            {uploading ? "Uploading..." : "Change photo"}
          </label>
          <input
            id="avatarFile"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </div>

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

        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={280}
          rows={4}
        />

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={saving || uploading}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </main>
  );
}
