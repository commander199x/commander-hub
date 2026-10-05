// Weekly recap: every Monday, posts last week's highlights to a Discord channel.
//
// Setup (Vercel → Settings → Environment Variables, Production):
//   CRON_SECRET                  any long random text — Vercel sends it automatically to prove the call is genuine
//   DISCORD_RECAP_WEBHOOK_URL    Discord → channel settings → Integrations → Webhooks → New Webhook → Copy URL
// The schedule lives in vercel.json ("0 17 * * 1" = Mondays 17:00 UTC).
//
// Preview without posting: https://www.commander.host/api/cron/weekly-recap?preview=1&key=YOUR_CRON_SECRET

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = "https://www.commander.host";
const DAY = 86_400_000;

type M = { participants: string[] | null; winners: string[] | null; mode: string | null; map: string | null; created_at: string; rating_changes: Record<string, number> | null };

async function buildRecap() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  const db = createClient(url, key, { auth: { persistSession: false } });
  const since = new Date(Date.now() - 7 * DAY).toISOString();

  const { data, error } = await db.from("matches").select("participants, winners, mode, map, created_at, rating_changes").gte("created_at", since).order("created_at", { ascending: true }).limit(5000);
  if (error) throw new Error(error.message);
  const matches = ((data ?? []) as M[]).filter((m) => Array.isArray(m.participants) && m.participants.length);
  const { count: newMembers } = await db.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since);

  const net: Record<string, number> = {};
  const played: Record<string, number> = {};
  const run: Record<string, number> = {};
  const best: Record<string, number> = {};
  let upset: { gain: number; m: M; winner: string } | null = null;

  for (const m of matches) {
    const winners = m.winners ?? [];
    for (const p of m.participants!) {
      played[p] = (played[p] ?? 0) + 1;
      const d = Number(m.rating_changes?.[p] ?? 0);
      net[p] = (net[p] ?? 0) + d;
      run[p] = winners.includes(p) ? (run[p] ?? 0) + 1 : 0;
      best[p] = Math.max(best[p] ?? 0, run[p]);
      if (winners.includes(p) && d > (upset?.gain ?? 0)) upset = { gain: d, m, winner: p };
    }
  }
  const top = (rec: Record<string, number>) => Object.entries(rec).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] ?? null;
  const climber = top(net);
  const streak = top(best);
  const active = top(played);

  return {
    week: { from: since.slice(0, 10), to: new Date().toISOString().slice(0, 10) },
    matches: matches.length,
    players: Object.keys(played).length,
    newMembers: newMembers ?? 0,
    climber: climber && climber[1] > 0 ? { name: climber[0], gain: Math.round(climber[1]) } : null,
    streak: streak && streak[1] >= 2 ? { name: streak[0], wins: streak[1] } : null,
    active: active ? { name: active[0], games: active[1] } : null,
    matchOfWeek: upset
      ? {
          winners: (upset as { m: M }).m.winners ?? [],
          losers: (upset as { m: M }).m.participants!.filter((p) => !((upset as { m: M }).m.winners ?? []).includes(p)),
          map: (upset as { m: M }).m.map,
          mode: (upset as { m: M }).m.mode,
          gain: Math.round((upset as { gain: number }).gain),
        }
      : null,
  };
}

function toDiscord(r: Awaited<ReturnType<typeof buildRecap>>) {
  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: "⚔️ Matches", value: String(r.matches), inline: true },
    { name: "🪖 Active players", value: String(r.players), inline: true },
    { name: "🆕 New members", value: String(r.newMembers), inline: true },
  ];
  if (r.climber) fields.push({ name: "📈 Top climber", value: `**${r.climber.name}** +${r.climber.gain} rating`, inline: true });
  if (r.streak) fields.push({ name: "🔥 Longest win streak", value: `**${r.streak.name}** ${r.streak.wins} in a row`, inline: true });
  if (r.active) fields.push({ name: "🎖️ Most active", value: `**${r.active.name}** ${r.active.games} matches`, inline: true });
  if (r.matchOfWeek)
    fields.push({
      name: "💥 Match of the week",
      value: `**${r.matchOfWeek.winners.join(", ")}** beat ${r.matchOfWeek.losers.join(", ") || "—"}${r.matchOfWeek.map ? ` on *${r.matchOfWeek.map}*` : ""} (+${r.matchOfWeek.gain} rating, ${r.matchOfWeek.mode ?? ""})`,
    });
  return {
    username: "Commander",
    avatar_url: `${SITE}/icons/icon-192.png`,
    embeds: [
      {
        title: "📡 Weekly recap",
        url: `${SITE}/leaderboard`,
        description: r.matches ? `Highlights from **${r.week.from}** to **${r.week.to}**.` : "A quiet week on the battlefield — no ranked matches. Time to queue up! 🫡",
        color: 0xe8a63d,
        fields: r.matches ? fields : [],
        footer: { text: "commander.host · see the full ladder" },
        timestamp: new Date().toISOString(),
      },
    ],
    allowed_mentions: { parse: [] },
  };
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const u = new URL(req.url);
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? u.searchParams.get("key");
  if (!secret || given !== secret) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  try {
    const recap = await buildRecap();
    const payload = toDiscord(recap);
    if (u.searchParams.get("preview")) return NextResponse.json({ ok: true, preview: true, recap, payload });

    const hook = process.env.DISCORD_RECAP_WEBHOOK_URL;
    if (!hook) return NextResponse.json({ ok: false, error: "DISCORD_RECAP_WEBHOOK_URL is not set", recap }, { status: 500 });
    const res = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) return NextResponse.json({ ok: false, error: `Discord said ${res.status}: ${await res.text()}` }, { status: 502 });
    return NextResponse.json({ ok: true, posted: true, recap });
  } catch (e) {
    console.error("[weekly-recap]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
