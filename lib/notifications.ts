import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Notifies every registered participant in a match about their result and
 * rating change. Guests are silently skipped since they have no user_id.
 */
export async function notifyMatchResult(
  supabase: SupabaseClient,
  mode: string,
  deltas: Record<string, number>,
  winners: string[],
  newRatings: Record<string, number>
) {
  const usernames = Object.keys(deltas);
  if (usernames.length === 0) return;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("username", usernames);

  for (const p of profiles ?? []) {
    const won = winners.includes(p.username);
    const delta = deltas[p.username] ?? 0;
    const newRating = newRatings[p.username];
    const message = won
      ? `You won a ${mode.toUpperCase()} match! Rating ${delta >= 0 ? "+" : ""}${delta} (now ${newRating})`
      : `You lost a ${mode.toUpperCase()} match. Rating ${delta} (now ${newRating})`;

    await supabase.from("notifications").insert({
      user_id: p.id,
      message,
      link: "/leaderboard",
      read: false,
    });
  }
}

/**
 * Fetches the current top 3 usernames for a given rating column. Call this
 * BEFORE applying a match's rating changes to get the "before" snapshot,
 * and again AFTER to get the "after" snapshot.
 */
export async function getTopThreeUsernames(
  supabase: SupabaseClient,
  column: "rating_team" | "rating_ffa"
): Promise<string[]> {
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .order(column, { ascending: false })
    .limit(3);
  return (data ?? []).map((p) => p.username);
}

/**
 * Compares before/after top-3 snapshots and notifies anyone who newly
 * entered or dropped out.
 */
export async function notifyTopThreeChanges(
  supabase: SupabaseClient,
  modeLabel: "Team" | "FFA",
  beforeTop3: string[],
  afterTop3: string[]
) {
  const entered = afterTop3.filter((u) => !beforeTop3.includes(u));
  const left = beforeTop3.filter((u) => !afterTop3.includes(u));

  const allUsernames = [...entered, ...left];
  if (allUsernames.length === 0) return;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("username", allUsernames);

  const idMap: Record<string, string> = {};
  for (const p of profiles ?? []) idMap[p.username] = p.id;

  for (const username of entered) {
    if (!idMap[username]) continue;
    await supabase.from("notifications").insert({
      user_id: idMap[username],
      message: `🎉 You entered the Top 3 ${modeLabel} leaderboard!`,
      link: "/leaderboard",
      read: false,
    });
  }

  for (const username of left) {
    if (!idMap[username]) continue;
    await supabase.from("notifications").insert({
      user_id: idMap[username],
      message: `You've dropped out of the Top 3 ${modeLabel} leaderboard.`,
      link: "/leaderboard",
      read: false,
    });
  }
}

/**
 * Checks whether a tournament name has never been used before (call this
 * BEFORE inserting the new match), and if so, notifies every registered
 * user that a new tournament was announced.
 */
export async function checkAndNotifyNewTournament(supabase: SupabaseClient, tournamentName: string) {
  if (!tournamentName.trim()) return;

  const { data: existing } = await supabase
    .from("matches")
    .select("id")
    .eq("tournament_name", tournamentName)
    .limit(1);

  if (existing && existing.length > 0) return; // not new

  const { data: allProfiles } = await supabase.from("profiles").select("id");
  for (const p of allProfiles ?? []) {
    await supabase.from("notifications").insert({
      user_id: p.id,
      message: `📢 New tournament announced: ${tournamentName}!`,
      link: "/tournaments/standings",
      read: false,
    });
  }
}
