"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";

type TopPlayer = {
  username: string;
  avatar_url: string | null;
  rating: number;
};

const MEDALS = ["🥇", "🥈", "🥉"];

function PlayerRow({ p, i }: { p: TopPlayer; i: number }) {
  return (
    <Link
      href={`/profile/${p.username}`}
      className="flex items-center gap-3 py-2 group"
      style={{ borderBottom: i < 2 ? `1px solid ${C.line}` : "none" }}
    >
      <span style={{ width: "22px", fontSize: "1rem", textAlign: "center" }}>{MEDALS[i]}</span>
      <img
        src={p.avatar_url || "/default-avatar.svg"}
        alt={p.username}
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          objectFit: "cover",
          border: `1px solid ${["#f5a623", "#c0c0c0", "#cd7f32"][i]}`,
        }}
      />
      <span
        className="text-sm flex-1 truncate"
        style={{ color: C.paper, fontWeight: 600 }}
      >
        {p.username}
      </span>
      <span className="text-xs" style={{ color: C.amber, fontWeight: 700 }}>
        {p.rating}
      </span>
    </Link>
  );
}

export default function HomeLeaderboardPreview() {
  const supabase = createClient();
  const [teamTop, setTeamTop] = useState<TopPlayer[]>([]);
  const [ffaTop, setFfaTop] = useState<TopPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Registered accounts
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, avatar_url, rating_team, rating_ffa");

      // Guest players (no site account) — they can still outrank registered
      // users, so they must be included for an accurate top 3.
      const { data: guestData } = await supabase
        .from("guest_ratings")
        .select("name, rating_team, rating_ffa");

      // Build separate lists per mode since a player's team rank and FFA
      // rank use different numbers.
      const teamList: TopPlayer[] = [
        ...(profileData ?? []).map((p) => ({ username: p.username, avatar_url: p.avatar_url, rating: p.rating_team ?? 1000 })),
        ...(guestData ?? []).map((g) => ({ username: g.name, avatar_url: null, rating: g.rating_team ?? 1000 })),
      ];
      const ffaList: TopPlayer[] = [
        ...(profileData ?? []).map((p) => ({ username: p.username, avatar_url: p.avatar_url, rating: p.rating_ffa ?? 1000 })),
        ...(guestData ?? []).map((g) => ({ username: g.name, avatar_url: null, rating: g.rating_ffa ?? 1000 })),
      ];

      const sortFn = (a: TopPlayer, b: TopPlayer) =>
        b.rating - a.rating || a.username.localeCompare(b.username);

      setTeamTop(teamList.sort(sortFn).slice(0, 3));
      setFfaTop(ffaList.sort(sortFn).slice(0, 3));
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return null;
  if (teamTop.length === 0 && ffaTop.length === 0) return null;

  return (
    <div className="mt-14">
      <div className="flex items-center justify-between mb-4">
        <h2 className="cz-display uppercase text-2xl" style={{ fontWeight: 600 }}>
          Top Commanders
        </h2>
        <Link href="/leaderboard" className="text-xs uppercase tracking-widest" style={{ color: C.amber }}>
          View Leaderboard
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="cz-card p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <span className="text-[10px] uppercase tracking-widest" style={{ color: C.muted }}>
            Team (2v2/3v3/4v4)
          </span>
          <div className="mt-3">
            {teamTop.length > 0 ? (
              teamTop.map((p, i) => <PlayerRow key={p.username} p={p} i={i} />)
            ) : (
              <p className="text-xs mt-2" style={{ color: C.muted }}>
                No ranked players yet.
              </p>
            )}
          </div>
        </div>

        <div className="cz-card p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <span className="text-[10px] uppercase tracking-widest" style={{ color: C.muted }}>
            FFA
          </span>
          <div className="mt-3">
            {ffaTop.length > 0 ? (
              ffaTop.map((p, i) => <PlayerRow key={p.username} p={p} i={i} />)
            ) : (
              <p className="text-xs mt-2" style={{ color: C.muted }}>
                No ranked players yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <Link
        href="/leaderboard"
        className="flex items-center justify-center gap-2 mt-4 text-xs uppercase tracking-widest py-3 sm:hidden"
        style={{ border: `1px solid ${C.amber}`, color: C.amber }}
      >
        View Full Leaderboard
        <ArrowUpRight size={14} />
      </Link>
    </div>
  );
}