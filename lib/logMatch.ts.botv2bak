// Logs a match exactly the way the admin "Log a match" form always has:
// read current ratings → compute ELO deltas → save the match → apply the new ratings → send notifications.
// Used by the admin form AND by approving a player-reported result, so both always rate the same way.
import type { SupabaseClient } from "@supabase/supabase-js";
import { computeTeamMatchDeltas, computeFfaMatchDeltas, DEFAULT_RATING } from "@/lib/elo";
import { notifyMatchResult, getTopThreeUsernames, notifyTopThreeChanges, checkAndNotifyNewTournament } from "@/lib/notifications";

export type Mode = "2v2" | "3v3" | "4v4" | "ffa";

export type LogMatchInput = {
  mode: Mode;
  participants: string[];
  winners: string[];
  notes?: string | null;
  tournamentName?: string | null;
  round?: string | null;
  map?: string | null;
  createdAt: string;
  replayUrl: string | null;
  generals?: Record<string, string>;
};

// 2v2/3v3/4v4 share one combined "team" rating; FFA has its own.
export function ratingColumnFor(m: Mode): "rating_team" | "rating_ffa" {
  if (m === "ffa") return "rating_ffa";
  return "rating_team";
}

/** Current ratings; registered players come from profiles, everyone else from guest_ratings. */
export async function fetchRatings(supabase: SupabaseClient, mode: Mode, usernames: string[]) {
  const column = ratingColumnFor(mode);
  const ratings: Record<string, number> = {};
  const registered = new Set<string>();

  if (usernames.length > 0) {
    const { data } = await supabase.from("profiles").select(`username, ${column}`).in("username", usernames);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (data ?? []) as any[]) {
      registered.add(row.username);
      ratings[row.username] = row[column] ?? DEFAULT_RATING;
    }
  }

  const guests = usernames.filter((u) => !registered.has(u));
  if (guests.length > 0) {
    const { data } = await supabase.from("guest_ratings").select(`name, ${column}`).in("name", guests);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (data ?? []) as any[]) ratings[row.name] = row[column] ?? DEFAULT_RATING;
  }

  return { ratings, registered };
}

export async function applyRatingChanges(
  supabase: SupabaseClient,
  mode: Mode,
  deltas: Record<string, number>,
  currentRatings: Record<string, number>,
  registered: Set<string>
) {
  const column = ratingColumnFor(mode);
  for (const username of Object.keys(deltas)) {
    const newRating = (currentRatings[username] ?? DEFAULT_RATING) + deltas[username];
    if (registered.has(username)) {
      await supabase.from("profiles").update({ [column]: newRating }).eq("username", username);
    } else {
      await supabase.from("guest_ratings").upsert({ name: username, [column]: newRating }, { onConflict: "name" });
    }
  }
}

export async function logMatch(supabase: SupabaseClient, input: LogMatchInput): Promise<{ error: string | null; matchId: string | null; deltas: Record<string, number> }> {
  const isTeam = input.mode !== "ffa";
  const losers = input.participants.filter((p) => !input.winners.includes(p));
  const { ratings: currentRatings, registered } = await fetchRatings(supabase, input.mode, input.participants);
  const deltas = isTeam
    ? computeTeamMatchDeltas(currentRatings, input.winners, losers)
    : computeFfaMatchDeltas(currentRatings, input.winners[0], losers);

  // Snapshot the top 3 before this match's rating changes are applied,
  // so we can detect who entered/left after.
  const column = ratingColumnFor(input.mode);
  const beforeTop3 = await getTopThreeUsernames(supabase, column);

  // Check for a new tournament BEFORE inserting, so the "does this
  // tournament already exist" check doesn't just find this match itself.
  if (input.tournamentName?.trim()) {
    await checkAndNotifyNewTournament(supabase, input.tournamentName.trim());
  }

  const row = {
    mode: input.mode,
    participants: input.participants,
    winners: input.winners,
    notes: input.notes || null,
    tournament_name: input.tournamentName || null,
    round: input.round || null,
    map: input.map || null,
    rating_changes: deltas,
    created_at: input.createdAt,
    replay_url: input.replayUrl,
  };
  const generals = input.generals && Object.keys(input.generals).length > 0 ? input.generals : null;

  const payload: Record<string, unknown> = generals ? { ...row, generals } : row;
  let res = await supabase.from("matches").insert(payload).select("id").single();
  // Before sql/generals.sql has been run the column doesn't exist: save the match without generals.
  if (res.error && generals && /generals/i.test(res.error.message)) {
    res = await supabase.from("matches").insert(row).select("id").single();
  }
  if (res.error) return { error: res.error.message, matchId: null, deltas };

  await applyRatingChanges(supabase, input.mode, deltas, currentRatings, registered);

  const newRatings: Record<string, number> = {};
  for (const username of Object.keys(deltas)) newRatings[username] = (currentRatings[username] ?? DEFAULT_RATING) + deltas[username];
  await notifyMatchResult(supabase, input.mode, deltas, input.winners, newRatings);

  const afterTop3 = await getTopThreeUsernames(supabase, column);
  await notifyTopThreeChanges(supabase, isTeam ? "Team" : "FFA", beforeTop3, afterTop3);

  return { error: null, matchId: (res.data as { id?: string } | null)?.id ?? null, deltas };
}
