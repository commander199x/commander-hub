// Shared match loading for the stats pages. Reads every match in pages of 1000,
// and works whether or not the `generals` column has been added yet.

import type { SupabaseClient } from "@supabase/supabase-js";

export type StatMatch = {
  id: string;
  mode: string;
  participants: string[];
  winners: string[];
  map: string | null;
  created_at: string;
  rating_changes: Record<string, number> | null;
  replay_url: string | null;
  tournament_name?: string | null;
  generals?: unknown;
};

const BASE = "id, mode, participants, winners, map, created_at, rating_changes, replay_url, tournament_name";
const PAGE = 1000;

async function readAll(db: SupabaseClient, cols: string) {
  const rows: StatMatch[] = [];
  for (let from = 0; from < 100_000; from += PAGE) {
    const { data, error } = await db.from("matches").select(cols).order("created_at", { ascending: false }).range(from, from + PAGE - 1);
    if (error) return { rows, error: error.message };
    const page = (data ?? []) as unknown as StatMatch[];
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  return { rows, error: null as string | null };
}

/** All matches, newest first. `hasGenerals` is false until sql/generals.sql has been run. */
export async function loadMatches(db: SupabaseClient): Promise<{ matches: StatMatch[]; hasGenerals: boolean }> {
  let res = await readAll(db, `${BASE}, generals`);
  let hasGenerals = true;
  if (res.error) {
    hasGenerals = false;
    res = await readAll(db, BASE);
    if (res.error) console.warn("[stats] could not read matches:", res.error);
  }
  const matches = res.rows
    .filter((m) => Array.isArray(m.participants) && m.participants.length > 0)
    .map((m) => ({ ...m, winners: Array.isArray(m.winners) ? m.winners : [] }));
  return { matches, hasGenerals };
}

export const isWin = (m: StatMatch, p: string) => m.winners.includes(p);

/** Players on the other side of a match from `p` (everyone else in FFA). */
export function opponentsOf(m: StatMatch, p: string): string[] {
  const won = isWin(m, p);
  return m.participants.filter((x) => x !== p && (m.mode === "ffa" || isWin(m, x) !== won));
}
