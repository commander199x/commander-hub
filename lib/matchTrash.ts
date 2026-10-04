import type { SupabaseClient } from "@supabase/supabase-js";

type RestoreKey = { trashId: string } | { matchId: string };

/**
 * Puts a deleted match back (from matches_trash) and re-applies its rating
 * changes, since deleting a match reverses them.
 *
 * Note: ratings are adjusted by the match's original +/- values. If other
 * matches were played in between, "Recalculate All Ratings" will re-sync
 * everything exactly.
 */
export async function restoreMatchFromTrash(
  supabase: SupabaseClient,
  key: RestoreKey
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result =
    "trashId" in key
      ? await supabase.from("matches_trash").select("id, match_id, data").eq("id", key.trashId)
      : await supabase
          .from("matches_trash")
          .select("id, match_id, data")
          .eq("match_id", key.matchId)
          .order("deleted_at", { ascending: false })
          .limit(1);

  const { data: rows, error: trashError } = result;
  const trash = rows?.[0];

  if (trashError || !trash) {
    return { ok: false, error: trashError?.message ?? "That deleted match couldn't be found." };
  }

  const original = trash.data as Record<string, any>;

  // If the match somehow already exists again, don't create a duplicate.
  const { data: existing } = await supabase.from("matches").select("id").eq("id", original.id).maybeSingle();
  if (existing) {
    await supabase.from("matches_trash").delete().eq("id", trash.id);
    return { ok: true };
  }

  const { error: insertError } = await supabase.from("matches").insert(original);
  if (insertError) return { ok: false, error: insertError.message };

  // Re-apply the rating changes that deleting the match had reversed.
  const deltas = (original.rating_changes ?? null) as Record<string, number> | null;
  if (deltas) {
    const column = original.mode === "ffa" ? "rating_ffa" : "rating_team";
    const usernames = Object.keys(deltas);

    const { data: profileRows } = await supabase
      .from("profiles")
      .select(`username, ${column}`)
      .in("username", usernames);

    const foundInProfiles = new Set<string>();
    for (const p of (profileRows ?? []) as any[]) {
      foundInProfiles.add(p.username);
      const newRating = (p[column] ?? 1000) + (deltas[p.username] ?? 0);
      await supabase.from("profiles").update({ [column]: newRating }).eq("username", p.username);
    }

    const guestNames = usernames.filter((u) => !foundInProfiles.has(u));
    if (guestNames.length > 0) {
      const { data: guestRows } = await supabase
        .from("guest_ratings")
        .select(`name, ${column}`)
        .in("name", guestNames);

      const guestCurrent: Record<string, number> = {};
      for (const g of (guestRows ?? []) as any[]) guestCurrent[g.name] = g[column] ?? 1000;

      for (const name of guestNames) {
        const newRating = (guestCurrent[name] ?? 1000) + (deltas[name] ?? 0);
        await supabase
          .from("guest_ratings")
          .upsert({ name, [column]: newRating }, { onConflict: "name" });
      }
    }
  }

  await supabase.from("matches_trash").delete().eq("id", trash.id);
  return { ok: true };
}
