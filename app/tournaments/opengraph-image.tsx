import { ImageResponse } from "next/og";
import { OG, OG_SIZE, ogDb, ogFonts, OgFrame, OgAvatar } from "@/lib/og";

// Card shown when the tournaments link is shared: the latest tournament and its champion.
export const alt = "Commander tournaments";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 1800;

type M = { participants: string[] | null; winners: string[] | null; tournament_name: string | null; round: string | null; created_at: string };

async function latest() {
  const db = ogDb();
  if (!db) return null;
  try {
    const { data } = await db.from("matches").select("participants, winners, tournament_name, round, created_at").not("tournament_name", "is", null).order("created_at", { ascending: false }).limit(1000);
    const rows = (data ?? []) as M[];
    if (!rows.length) return null;
    const name = rows[0].tournament_name!;
    const list = rows.filter((m) => m.tournament_name === name);
    const isFinal = (r: string | null) => !!r && /final|نهائي/i.test(r) && !/semi|quarter|نصف|ربع|1\/2|1\/4/i.test(r);
    const fin = list.find((m) => isFinal(m.round));
    let champs = fin?.winners ?? [];
    if (!champs.length) {
      const w: Record<string, number> = {};
      for (const m of list) for (const p of m.winners ?? []) w[p] = (w[p] ?? 0) + 1;
      const top = Object.entries(w).sort((a, b) => b[1] - a[1])[0];
      champs = top ? [top[0]] : [];
    }
    const players = new Set(list.flatMap((m) => m.participants ?? [])).size;
    const { data: profs } = champs.length ? await db.from("profiles").select("username, avatar_url").in("username", champs) : { data: [] };
    const av: Record<string, string | null> = {};
    for (const p of (profs ?? []) as { username: string; avatar_url: string | null }[]) av[p.username] = p.avatar_url;
    return { name, champs, decided: !!fin, matches: list.length, players, av };
  } catch {
    return null;
  }
}

export default async function Image() {
  const t = await latest();
  const { heading, fonts } = await ogFonts(`COMMANDERTOURNAMENTSCHAMPIONLEADERMATCHESPLAYERSNEXTEVENTSOON${t ? t.name.toUpperCase() + t.champs.join("").toUpperCase() : ""}0123456789`);
  return new ImageResponse(
    (
      <OgFrame label="TOURNAMENTS" heading={heading}>
        {!t ? (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
            <div style={{ display: "flex", fontSize: 96, fontWeight: 800, fontFamily: heading, color: OG.amber }}>TOURNAMENTS</div>
            <div style={{ display: "flex", fontSize: 34, color: OG.muted, marginTop: 12 }}>Next event coming soon — join the clan on Discord</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
            <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: OG.amber }}>{t.decided ? "CHAMPION" : "CURRENT LEADER"}</div>
            <div style={{ display: "flex", fontSize: t.name.length > 22 ? 64 : 84, fontWeight: 800, fontFamily: heading, lineHeight: 1, marginTop: 8 }}>{t.name.toUpperCase()}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 26, marginTop: 34 }}>
              <div style={{ display: "flex" }}>
                {t.champs.slice(0, 4).map((c, i) => (
                  <div key={c} style={{ display: "flex", marginLeft: i ? -26 : 0 }}><OgAvatar src={t.av[c]} name={c} size={110} ring={OG.amber} /></div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", fontSize: 54, fontWeight: 800, fontFamily: heading, color: OG.amber }}>{t.champs.join(", ").toUpperCase() || "—"}</div>
                <div style={{ display: "flex", fontSize: 26, color: OG.muted, marginTop: 6 }}>{t.matches} matches · {t.players} players</div>
              </div>
            </div>
          </div>
        )}
      </OgFrame>
    ),
    { ...size, fonts }
  );
}
