import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileView, { type ProfileData } from "@/components/profile/ProfileView";
import "@/app/auth.css";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  let name = username;
  try {
    name = decodeURIComponent(username);
  } catch {}
  return {
    title: `${name} · Commander`,
    description: `${name}'s ratings, match history and medals on Commander, the Generals Zero Hour community.`,
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio, created_at, is_team, is_admin, is_owner, rating_team, rating_ffa")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwnProfile = user?.id === profile.id;

  return <ProfileView profile={profile as ProfileData} isOwnProfile={isOwnProfile} />;
}
