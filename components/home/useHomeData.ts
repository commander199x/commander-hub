"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Leader = {
  name: string;
  rating: number;
  wins: number;
  losses: number;
  avatarUrl: string | null;
};

export type HomeData = {
  loaded: boolean;
  members: number;
  matches: number;
  replays: number;
  teamTop: Leader[];
  ffaTop: Leader[];
};

const EMPTY: HomeData = { loaded: false, members: 0, matches: 0, replays: 0, teamTop: [], ffaTop: [] };

// Same rule as the leaderboard: you need this many matches to hold a rank.
const MIN_MATCHES_FOR_RANK = 3;

type ProfileRow = { username: string; avatar_url: string | null; rating_team: number | null; rating_ffa: number | null; banned: boolean | null };
type GuestRow = { name: string; rating_team: number | null; rating_ffa: number | null };
type MatchRow = { participants: string[]; winners: string[]; mode: string; replay_url: string | null };
type Info = { team: number; ffa: number; avatar: string | null; banned: boolean };

/**
 * One shared fetch for everything the homepage's live numbers need:
 * counts for the hero, and the top three per ladder for the radar and the podium.
 */
export function useHomeData(): HomeData {
  const [data, setData] = useState<HomeData>(EMPTY);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const [profilesRes, guestsRes, matchesRes] = await Promise.all([
        supabase.from("profiles").select("username, avatar_url, rating_team, rating_ffa, banned"),
        supabase.from("guest_ratings").select("name, rating_team, rating_ffa"),
        supabase.from("matches").select("participants, winners, mode, replay_url"),
      ]);

      const profiles = (profilesRes.data ?? []) as ProfileRow[];
      const guests = (guestsRes.data ?? []) as GuestRow[];
      const matches = (matchesRes.data ?? []) as MatchRow[];

      const info = new Map<string, Info>();
      for (const g of guests) {
        info.set(g.name, { team: g.rating_team ?? 1000, ffa: g.rating_ffa ?? 1000, avatar: null, banned: false });
      }
      for (const p of profiles) {
        info.set(p.username, {
          team: p.rating_team ?? 1000,
          ffa: p.rating_ffa ?? 1000,
          avatar: p.avatar_url,
          banned: !!p.banned,
        });
      }

      function top(teamView: boolean): Leader[] {
        const stats = new Map<string, { w: number; l: number }>();
        for (const m of matches) {
          const isFfa = m.mode === "ffa";
          if (teamView ? isFfa : !isFfa) continue;
          for (const name of m.participants) {
            const row = stats.get(name) ?? { w: 0, l: 0 };
            if (m.winners.includes(name)) row.w += 1;
            else row.l += 1;
            stats.set(name, row);
          }
        }

        return Array.from(stats.entries())
          .filter(([name, s]) => s.w + s.l >= MIN_MATCHES_FOR_RANK && !info.get(name)?.banned)
          .map(([name, s]) => ({
            name,
            rating: (teamView ? info.get(name)?.team : info.get(name)?.ffa) ?? 1000,
            wins: s.w,
            losses: s.l,
            avatarUrl: info.get(name)?.avatar ?? null,
          }))
          .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name))
          .slice(0, 3);
      }

      if (!cancelled) {
        setData({
          loaded: true,
          members: profiles.filter((p) => !p.banned).length,
          matches: matches.length,
          replays: matches.filter((m) => !!m.replay_url).length,
          teamTop: top(true),
          ffaTop: top(false),
        });
      }
    }

    load().catch(() => {
      if (!cancelled) setData({ ...EMPTY, loaded: true });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
