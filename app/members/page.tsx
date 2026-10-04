import { createClient } from "@/lib/supabase/server";
import MembersDirectory, { type Member } from "@/components/members/MembersDirectory";
import "@/app/members.css";

export default async function MembersPage() {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("profiles")
    .select("username, avatar_url, bio, created_at, is_team, is_admin, is_owner, rating_team")
    .order("created_at", { ascending: false });

  return <MembersDirectory members={(members ?? []) as Member[]} />;
}
