import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import "@/app/leaderboard.css";

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("profiles")
    .select("username, avatar_url, wins, losses")
    .order("wins", { ascending: false })
    .limit(50);

  const ranked = (players ?? []).filter((p) => p.wins + p.losses > 0);

  return (
    <main className="leaderboard-page">
      <div className="leaderboard-container">
        <h1>Leaderboard</h1>
        <p className="leaderboard-subtitle">Ranked by wins</p>

        <div className="leaderboard-table">
          <div className="leaderboard-row leaderboard-header-row">
            <span className="lb-rank">#</span>
            <span className="lb-player">Player</span>
            <span className="lb-stat">W</span>
            <span className="lb-stat">L</span>
            <span className="lb-stat">Win %</span>
          </div>

          {ranked.map((p, i) => {
            const total = p.wins + p.losses;
            const winRate = total > 0 ? Math.round((p.wins / total) * 100) : 0;
            return (
              <Link
                key={p.username}
                href={`/profile/${p.username}`}
                className="leaderboard-row"
              >
                <span className="lb-rank">
                  {i === 0 && "🥇"}
                  {i === 1 && "🥈"}
                  {i === 2 && "🥉"}
                  {i > 2 && `#${i + 1}`}
                </span>
                <span className="lb-player">
                  <img
                    src={p.avatar_url || "/default-avatar.svg"}
                    alt={p.username}
                    className="lb-avatar"
                  />
                  {p.username}
                </span>
                <span className="lb-stat lb-wins">{p.wins}</span>
                <span className="lb-stat lb-losses">{p.losses}</span>
                <span className="lb-stat">{winRate}%</span>
              </Link>
            );
          })}

          {ranked.length === 0 && (
            <p className="leaderboard-empty">
              No ranked players yet. Play some matches!
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
