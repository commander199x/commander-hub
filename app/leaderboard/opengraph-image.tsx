import { ImageResponse } from "next/og";
import { OG, OG_SIZE, ogDb, ogFonts, OgFrame, OgAvatar } from "@/lib/og";

// Card shown when the leaderboard link is shared: the current Team top 5.
export const alt = "Commander leaderboard — top players";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 1800;

type Row = { name: string; rating: number; w: number; l: number; avatar: string | null };

async function topFive(): Promise<Row[]> {
  const db = ogDb();
  if (!db) return [];
  try {
    const matches: { participants: string[] | null; winners: string[] | null; mode: string | null }[] = [];
    for (let from = 0; from < 50_000; from += 1000) {
      const { data, error } = await db.from("matches").select("participants, winners, mode").range(from, from + 999);
      if (error) break;
      matches.push(...((data ?? []) as typeof matches));
      if (!data || data.length < 1000) break;
    }
    const [{ data: profs }, { data: guests }] = await Promise.all([
      db.from("profiles").select("username, avatar_url, rating_team"),
      db.from("guest_ratings").select("name, rating_team"),
    ]);
    // same rules as the leaderboard: profiles then guest ratings, 3+ team matches to be ranked
    const rating: Record<string, number> = {};
    const avatar: Record<string, string | null> = {};
    for (const p of (profs ?? []) as { username: string; avatar_url: string | null; rating_team: number | null }[]) {
      rating[p.username] = Math.round(Number(p.rating_team ?? 1000));
      avatar[p.username] = p.avatar_url;
    }
    for (const g of (guests ?? []) as { name: string; rating_team: number | null }[]) rating[g.name] = Math.round(Number(g.rating_team ?? 1000));
    const stats: Record<string, { w: number; l: number }> = {};
    for (const m of matches) {
      if (m.mode === "ffa" || !Array.isArray(m.participants)) continue;
      for (const p of m.participants) {
        const s = (stats[p] ??= { w: 0, l: 0 });
        if ((m.winners ?? []).includes(p)) s.w++;
        else s.l++;
      }
    }
    return Object.entries(stats)
      .filter(([, s]) => s.w + s.l >= 3)
      .map(([name, s]) => ({ name, rating: rating[name] ?? 1000, w: s.w, l: s.l, avatar: avatar[name] ?? null }))
      .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name))
      .slice(0, 5);
  } catch {
    return [];
  }
}

export default async function Image() {
  const rows = await topFive();
  const { heading, fonts } = await ogFonts(`COMMANDERLEADERBOARDTEAM LADDERTOP${rows.map((r) => r.name.toUpperCase() + r.rating).join("")}0123456789#`);
  const podium = [OG.amber, OG.silver, OG.bronze];
  return new ImageResponse(
    (
      <OgFrame label="LEADERBOARD" heading={heading}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 30 }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, fontFamily: heading, lineHeight: 1 }}>TEAM LADDER</div>
          <div style={{ display: "flex", fontSize: 24, color: OG.muted }}>Top {rows.length || 5}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 26, border: `2px solid ${OG.line}`, flex: 1 }}>
          {rows.length === 0 ? (
            <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", fontSize: 32, color: OG.muted, background: OG.panel }}>Climb the ranked ladder</div>
          ) : (
            rows.map((r, i) => (
              <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 22, flex: 1, padding: "0 26px", background: i % 2 ? OG.void : OG.panel, borderLeft: `6px solid ${podium[i] ?? OG.line}` }}>
                <div style={{ display: "flex", width: 54, fontSize: 40, fontWeight: 800, fontFamily: heading, color: podium[i] ?? OG.muted }}>{i + 1}</div>
                <OgAvatar src={r.avatar} name={r.name} size={58} ring={podium[i] ?? OG.line} />
                <div style={{ display: "flex", flex: 1, fontSize: 34, fontWeight: 700, fontFamily: heading }}>{r.name.toUpperCase()}</div>
                <div style={{ display: "flex", fontSize: 22, color: OG.muted, marginRight: 24 }}>{r.w}W · {r.l}L</div>
                <div style={{ display: "flex", fontSize: 40, fontWeight: 800, fontFamily: heading, color: OG.amber }}>{r.rating}</div>
              </div>
            ))
          )}
        </div>
      </OgFrame>
    ),
    { ...size, fonts }
  );
}
