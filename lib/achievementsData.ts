// Loads saved achievements, rarity and a player's progress. Works before the SQL is run
// (then "unlocked" is worked out from progress, without dates).
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ACHIEVEMENTS, achievementProgress, type ProgressMatch } from "@/lib/achievements";

const COLS = "mode, participants, winners, map, created_at, tournament_name, round, replay_url";

export async function loadPlayerMatches(username: string): Promise<ProgressMatch[]> {
  const db = createClient();
  const first = await db.from("matches").select(`${COLS}, generals`).contains("participants", [username]).limit(5000);
  if (!first.error) return (first.data ?? []) as unknown as ProgressMatch[];
  // before sql/generals.sql: same query without the generals column
  const plain = await db.from("matches").select(COLS).contains("participants", [username]).limit(5000);
  return (plain.data ?? []) as unknown as ProgressMatch[];
}

export function useAchievements(username: string | null) {
  const [unlocked, setUnlocked] = useState<Record<string, string | null>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [rarity, setRarity] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const db = createClient();
      const [rows, mine, all, people] = await Promise.all([
        username ? db.from("player_achievements").select("key, unlocked_at").eq("username", username) : Promise.resolve({ data: [], error: null }),
        username ? loadPlayerMatches(username) : Promise.resolve([] as ProgressMatch[]),
        db.from("player_achievements").select("key").limit(20000),
        db.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      if (cancelled) return;
      const prog = username ? achievementProgress(username, mine) : {};
      setProgress(prog);
      if (rows.error || all.error) {
        // before sql/events-achievements.sql: work it out from progress
        setSaved(false);
        const u: Record<string, string | null> = {};
        for (const a of ACHIEVEMENTS) if (a.key !== "top3" && (prog[a.key] ?? 0) >= a.need) u[a.key] = null;
        setUnlocked(u);
      } else {
        setSaved(true);
        setUnlocked(Object.fromEntries(((rows.data ?? []) as { key: string; unlocked_at: string }[]).map((r) => [r.key, r.unlocked_at])));
        const total = Math.max(1, people.count ?? 1);
        const counts: Record<string, number> = {};
        for (const r of (all.data ?? []) as { key: string }[]) counts[r.key] = (counts[r.key] ?? 0) + 1;
        setRarity(Object.fromEntries(ACHIEVEMENTS.map((a) => [a.key, Math.round(((counts[a.key] ?? 0) / total) * 1000) / 10])));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  return { unlocked, progress, rarity, saved, loading };
}
