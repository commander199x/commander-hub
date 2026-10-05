import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

// The card Discord, WhatsApp, X etc. show when someone shares a profile link.
export const alt = "Commander player profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 1800;

const VOID = "#0A0C08";
const PANEL = "#12150E";
const LINE = "#272B1E";
const AMBER = "#E8A63D";
const AMBER_DIM = "#8A6425";
const RADAR = "#8FBF4F";
const PAPER = "#EDEAE0";
const MUTED = "#83866F";

const TIERS: [number, string][] = [
  [-Infinity, "Private"], [900, "Corporal"], [1000, "Sergeant"], [1100, "Lieutenant"], [1200, "Captain"],
  [1300, "Major"], [1400, "Colonel"], [1500, "Brigadier General"], [1600, "General"], [1700, "Commander"],
];
// Load the site's display font (Oswald) for just the characters on the card.
// If Google Fonts can't be reached, the card still renders with the default font.
async function loadOswald(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Oswald:wght@700&text=${encodeURIComponent(text)}`)).text();
    const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!src) return null;
    const res = await fetch(src);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

const tierName = (r: number) => TIERS.reduce((acc, [min, name]) => (r >= min ? name : acc), "Private");

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username: raw } = await params;
  let username = raw;
  try {
    username = decodeURIComponent(raw);
  } catch {}

  let avatar: string | null = null;
  let team = 1000;
  let ffa = 1000;
  let games = 0;
  let wins = 0;
  let role: string | null = null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && key) {
    try {
      const db = createClient(url, key, { auth: { persistSession: false } });
      const [{ data: p }, g, w] = await Promise.all([
        db.from("profiles").select("username, avatar_url, rating_team, rating_ffa, is_owner, is_admin, is_team").eq("username", username).maybeSingle(),
        db.from("matches").select("id", { count: "exact", head: true }).contains("participants", [username]),
        db.from("matches").select("id", { count: "exact", head: true }).contains("winners", [username]),
      ]);
      if (p) {
        avatar = p.avatar_url ?? null;
        team = Math.round(Number(p.rating_team ?? 1000));
        ffa = Math.round(Number(p.rating_ffa ?? 1000));
        role = p.is_owner ? "OWNER" : p.is_admin ? "ADMIN" : p.is_team ? "TEAM" : null;
        username = p.username ?? username;
      }
      games = g.count ?? 0;
      wins = w.count ?? 0;
    } catch {
      // fall back to a plain card
    }
  }

  const winRate = games ? Math.round((wins / games) * 100) : 0;
  const stats: [string, string][] = [
    ["TEAM RATING", String(team)],
    ["FFA RATING", String(ffa)],
    ["MATCHES", String(games)],
    ["WIN RATE", `${winRate}%`],
  ];

  const display = "Oswald";
  const fontData = await loadOswald(
    `COMMANDERPLAYER PROFILE${username.toUpperCase()}${tierName(team).toUpperCase()}${role ?? ""}${stats.map((x) => x.join("")).join("")}0123456789%`
  );
  const fonts = fontData ? [{ name: display, data: fontData, weight: 700 as const, style: "normal" as const }] : undefined;
  const heading = fontData ? display : "sans-serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: `radial-gradient(ellipse 60% 70% at 85% 30%, rgba(143,191,79,0.16), transparent 60%), radial-gradient(ellipse 50% 60% at 10% 100%, rgba(232,166,61,0.18), transparent 60%), ${VOID}`,
          color: PAPER,
          padding: "56px 64px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 999, border: `2px solid ${RADAR}`, display: "flex" }} />
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 2, color: AMBER, fontFamily: heading }}>COMMANDER</div>
          </div>
          <div style={{ fontSize: 20, letterSpacing: 6, color: RADAR }}>PLAYER PROFILE</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 48, marginTop: 44 }}>
          <div style={{ display: "flex", width: 236, height: 236, borderRadius: 999, padding: 6, background: `linear-gradient(135deg, ${AMBER}, ${RADAR})` }}>
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} width={224} height={224} style={{ borderRadius: 999, objectFit: "cover", border: `6px solid ${VOID}` }} />
            ) : (
              <div style={{ width: 224, height: 224, borderRadius: 999, background: PANEL, border: `6px solid ${VOID}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 110, fontWeight: 800, color: AMBER }}>
                {username.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex", fontSize: username.length > 14 ? 80 : 108, fontWeight: 800, lineHeight: 1, textTransform: "uppercase", fontFamily: heading }}>{username}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 18 }}>
              <div style={{ fontSize: 38, fontWeight: 700, color: AMBER, textTransform: "uppercase", fontFamily: heading }}>{tierName(team)}</div>
              {role && <div style={{ fontSize: 20, fontWeight: 800, color: VOID, background: AMBER, padding: "4px 10px", letterSpacing: 2 }}>{role}</div>}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", marginTop: "auto", border: `2px solid ${LINE}` }}>
          {stats.map(([label, value], i) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", flex: 1, padding: "20px 26px", background: PANEL, borderLeft: i ? `2px solid ${LINE}` : "none" }}>
              <div style={{ fontSize: 18, letterSpacing: 3, color: MUTED }}>{label}</div>
              <div style={{ fontSize: 58, fontWeight: 800, color: i === 0 ? AMBER : PAPER, marginTop: 4, fontFamily: heading }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontSize: 20, color: MUTED }}>
          <div style={{ display: "flex" }}>Generals Zero Hour ranked community</div>
          <div style={{ display: "flex", color: AMBER_DIM }}>www.commander.host</div>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
