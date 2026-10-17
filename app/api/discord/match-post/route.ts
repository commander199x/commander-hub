// Posts a match result card to Discord automatically when an admin logs or approves a match.
// Env (Vercel): DISCORD_RESULTS_WEBHOOK_URL (falls back to DISCORD_LFG_WEBHOOK_URL, then DISCORD_RECAP_WEBHOOK_URL).
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GENERAL_BY_KEY, FACTIONS, isGeneralKey } from "@/lib/generals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const SITE = "https://www.commander.host";
const ACH: Record<string, string> = {
  first_win: "First Blood", games30: "Veteran", maps10: "Globetrotter", tournament: "Tournament Contender", replay: "Archivist", wins10: "Battle-Hardened",
  games100: "Centurion", streak5: "Hot Streak", mapMaster: "Map Master", ffa_winner: "Last One Standing", wins50: "War Hero", streak10: "Unstoppable",
  all_modes: "Combined Arms", three_factions: "Three Flags", general_master: "Signature General", top3: "High Command", champion: "Champion", all_generals: "Twelve Commands",
};
const esc = (s: string) => s.replace(/([\\*_`~|>])/g, "\\$1");

export async function POST(req: Request) {
  const hook = process.env.DISCORD_RESULTS_WEBHOOK_URL || process.env.DISCORD_LFG_WEBHOOK_URL || process.env.DISCORD_RECAP_WEBHOOK_URL;
  if (!hook) return NextResponse.json({ ok: true, skipped: "no webhook set" });
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !key) return NextResponse.json({ ok: false }, { status: 401 });
  const db = createClient(url, key, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: u } = await db.auth.getUser(token);
  if (!u?.user) return NextResponse.json({ ok: false }, { status: 401 });
  const { data: me } = await db.from("profiles").select("is_admin").eq("id", u.user.id).single();
  if (!me?.is_admin) return NextResponse.json({ ok: false }, { status: 403 });

  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  let res = await db.from("matches").select("id, mode, participants, winners, map, tournament_name, round, rating_changes, replay_url, generals").eq("id", id ?? "").maybeSingle();
  if (res.error) res = (await db.from("matches").select("id, mode, participants, winners, map, tournament_name, round, rating_changes, replay_url").eq("id", id ?? "").maybeSingle()) as typeof res;
  const m = res.data as { mode: string; participants: string[]; winners: string[]; map: string | null; tournament_name: string | null; round: string | null; rating_changes: Record<string, number> | null; replay_url: string | null; generals?: unknown } | null;
  if (!m) return NextResponse.json({ ok: false, error: "match not found" }, { status: 404 });

  const gens = m.generals && typeof m.generals === "object" ? (m.generals as Record<string, unknown>) : {};
  const line = (n: string) => {
    const g = gens[n];
    const d = m.rating_changes?.[n];
    return `**${esc(n)}**${isGeneralKey(g) ? ` · ${FACTIONS[GENERAL_BY_KEY[g].faction].code} ${GENERAL_BY_KEY[g].short}` : ""}${typeof d === "number" ? ` \`${d >= 0 ? "+" : ""}${d}\`` : ""}`;
  };
  const losers = (m.participants ?? []).filter((p) => !(m.winners ?? []).includes(p));
  // achievements unlocked by this match (awarded by the database moments ago)
  const { data: ach } = await db.from("player_achievements").select("username, key").in("username", m.participants ?? []).gt("unlocked_at", new Date(Date.now() - 3 * 60_000).toISOString());
  const unlocked = ((ach ?? []) as { username: string; key: string }[]).map((a) => `🏅 **${esc(a.username)}** unlocked **${ACH[a.key] ?? a.key}**`);

  const body = {
    username: "Commander",
    avatar_url: `${SITE}/icons/icon-192.png`,
    embeds: [{
      author: { name: m.tournament_name ? `🏆 ${m.tournament_name}${m.round ? ` · ${m.round}` : ""}` : "Ranked result", icon_url: `${SITE}/icons/icon-192.png` },
      title: `${m.mode.toUpperCase()}${m.map ? ` · ${m.map}` : ""}`,
      url: `${SITE}/leaderboard`,
      color: m.tournament_name ? 0xe8a63d : 0x8fbf4f,
      fields: [
        { name: "🏆 Victory", value: (m.winners ?? []).map(line).join("\n") || "—", inline: true },
        { name: "💀 Defeat", value: losers.map(line).join("\n") || "—", inline: true },
        ...(unlocked.length ? [{ name: "Unlocked", value: unlocked.slice(0, 8).join("\n") }] : []),
      ],
      footer: { text: "commander.host", icon_url: `${SITE}/icons/icon-192.png` },
      timestamp: new Date().toISOString(),
    }],
    components: [],
    allowed_mentions: { parse: [] },
  };
  const out = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return NextResponse.json({ ok: out.ok });
}
