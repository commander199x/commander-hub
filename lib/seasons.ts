// Seasons: every "reset_season_ratings" entry in the admin audit log ends a season.
// Season standings are rebuilt by replaying that season's matches with the site's rating rules.
import type { SupabaseClient } from "@supabase/supabase-js";
import { computeTeamMatchDeltas, computeFfaMatchDeltas, DEFAULT_RATING } from "@/lib/elo";

export const MIN_MATCHES_FOR_RANK = 3;
export type SeasonRow = { username: string; rating: number; wins: number; losses: number };
export type Season = {
  n: number;
  start: string | null;
  end: string | null;
  live: boolean;
  matches: number;
  team: SeasonRow[];
  ffa: SeasonRow[];
  mostActive: { username: string; matches: number } | null;
  streak: { username: string; streak: number; mode: "Team" | "FFA" } | null;
};
type M = { mode: string; participants: string[]; winners: string[]; created_at: string };

function replay(matches: M[], team: boolean) {
  const relevant = matches.filter((m) => (team ? m.mode !== "ffa" : m.mode === "ffa"));
  const ratings: Record<string, number> = {};
  const stats: Record<string, { wins: number; losses: number }> = {};
  const run: Record<string, number> = {};
  let bestName = "", bestValue = 0;
  for (const m of relevant) {
    const current: Record<string, number> = {};
    for (const p of m.participants) current[p] = ratings[p] ?? DEFAULT_RATING;
    const losers = m.participants.filter((p) => !m.winners.includes(p));
    const deltas = team ? computeTeamMatchDeltas(current, m.winners, losers) : computeFfaMatchDeltas(current, m.winners[0], losers);
    for (const p of m.participants) {
      ratings[p] = (ratings[p] ?? DEFAULT_RATING) + (deltas[p] ?? 0);
      const s = (stats[p] ??= { wins: 0, losses: 0 });
      const won = m.winners.includes(p);
      if (won) s.wins++;
      else s.losses++;
      run[p] = won ? (run[p] ?? 0) + 1 : 0;
      if (run[p] > bestValue) {
        bestValue = run[p];
        bestName = p;
      }
    }
  }
  const standings = Object.keys(ratings)
    .filter((u) => stats[u].wins + stats[u].losses >= MIN_MATCHES_FOR_RANK)
    .map((u) => ({ username: u, rating: Math.round(ratings[u]), wins: stats[u].wins, losses: stats[u].losses }))
    .sort((a, b) => b.rating - a.rating || a.username.localeCompare(b.username));
  return { standings, bestName, bestValue };
}

export async function loadSeasons(db: SupabaseClient): Promise<{ seasons: Season[]; error: string | null }> {
  const { data: resets, error: resetError } = await db
    .from("admin_audit_log")
    .select("created_at")
    .eq("action", "reset_season_ratings")
    .order("created_at", { ascending: true });
  if (resetError) return { seasons: [], error: resetError.message };

  const all: M[] = [];
  for (let from = 0; from < 100_000; from += 1000) {
    const { data, error } = await db.from("matches").select("mode, participants, winners, created_at").order("created_at", { ascending: true }).range(from, from + 999);
    if (error) return { seasons: [], error: error.message };
    const rows = (data ?? []) as M[];
    all.push(...rows.filter((m) => Array.isArray(m.participants) && Array.isArray(m.winners) && m.participants.length > 0));
    if (rows.length < 1000) break;
  }

  const ends = ((resets ?? []) as { created_at: string }[]).map((r) => r.created_at);
  const bounds: (string | null)[] = [null, ...ends, null];
  const seasons: Season[] = [];
  for (let i = 1; i < bounds.length; i++) {
    const start = bounds[i - 1], end = bounds[i];
    const list = all.filter((m) => (!start || m.created_at >= start) && (!end || m.created_at < end));
    const t = replay(list, true), f = replay(list, false);
    const activity: Record<string, number> = {};
    for (const m of list) for (const p of m.participants) activity[p] = (activity[p] ?? 0) + 1;
    const top = Object.entries(activity).sort((a, b) => b[1] - a[1])[0];
    const streak = t.bestValue >= f.bestValue ? { username: t.bestName, streak: t.bestValue, mode: "Team" as const } : { username: f.bestName, streak: f.bestValue, mode: "FFA" as const };
    seasons.push({
      n: i,
      start: start ?? (list[0]?.created_at ?? null),
      end,
      live: end === null,
      matches: list.length,
      team: t.standings,
      ffa: f.standings,
      mostActive: top ? { username: top[0], matches: top[1] } : null,
      streak: streak.streak > 0 ? streak : null,
    });
  }
  return { seasons, error: null };
}
