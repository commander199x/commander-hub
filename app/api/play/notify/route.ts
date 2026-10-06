// After a challenge is sent/answered, or a player marks themselves ready:
//   • pings the other player's phone (if they turned on phone notifications)
//   • posts to Discord (challenges and "ready" only)
// Everything is checked with the caller's own login, so nobody can ping or post for someone else.
//
// Env (Vercel): DISCORD_LFG_WEBHOOK_URL (falls back to DISCORD_RECAP_WEBHOOK_URL),
//               NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY + VAPID_SUBJECT for phone pushes.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPings } from "@/lib/webpush";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = "https://www.commander.host";
const FRESH_MS = 5 * 60 * 1000;

async function discord(embed: Record<string, unknown>) {
  const hook = process.env.DISCORD_LFG_WEBHOOK_URL || process.env.DISCORD_RECAP_WEBHOOK_URL;
  if (!hook) return false;
  const res = await fetch(hook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "Commander", avatar_url: `${SITE}/icons/icon-192.png`, embeds: [{ color: 0xe8a63d, timestamp: new Date().toISOString(), footer: { text: "commander.host/play" }, ...embed }], allowed_mentions: { parse: [] } }),
  });
  return res.ok;
}

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !key) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = createClient(url, key, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: u } = await db.auth.getUser(token);
  if (!u?.user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { kind?: string; id?: string; discord?: boolean };

  if (body.kind === "challenge" && body.id) {
    // database rules: only the two players involved can read it
    const { data: c } = await db.from("challenges").select("*").eq("id", body.id).maybeSingle();
    if (!c) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    const changedAt = Date.parse(c.responded_at ?? c.created_at);
    if (Date.now() - changedAt > FRESH_MS) return NextResponse.json({ ok: false, error: "too old" }, { status: 409 });

    const { data: targets } = await db.rpc("challenge_push_targets", { p_id: body.id });
    const pushed = await sendPings(((targets ?? []) as { endpoint: string }[]).map((t) => t.endpoint));

    let posted = false;
    const iAmChallenger = c.from_user === u.user.id;
    if (body.discord && iAmChallenger && c.status === "pending") {
      posted = await discord({ title: `⚔️ ${c.from_username} challenged ${c.to_username} to a ${String(c.mode).toUpperCase()}!`, description: c.message ? `“${c.message}”` : "Who takes the win? 🫡", url: `${SITE}/play` });
    } else if (body.discord && !iAmChallenger && c.status === "accepted") {
      posted = await discord({ title: `✅ ${c.to_username} accepted ${c.from_username}'s ${String(c.mode).toUpperCase()} challenge`, description: "Game on — report the result at commander.host/report", url: `${SITE}/report`, color: 0x8fbf4f });
    }
    return NextResponse.json({ ok: true, pushed, posted });
  }

  if (body.kind === "ready" && body.discord) {
    const { data: r } = await db.from("ready_players").select("*").eq("user_id", u.user.id).maybeSingle();
    if (!r || Date.parse(r.until) < Date.now()) return NextResponse.json({ ok: false, error: "not ready" }, { status: 409 });
    if (Date.now() - Date.parse(r.updated_at) > FRESH_MS) return NextResponse.json({ ok: false, error: "too old" }, { status: 409 });
    const modes = ((r.modes ?? []) as string[]).map((m) => m.toUpperCase()).join(" · ") || "any mode";
    const posted = await discord({ title: `🟢 ${r.username} is ready to play — ${modes}`, description: `${r.note ? `“${r.note}”\n` : ""}Challenge them at commander.host/play`, url: `${SITE}/play`, color: 0x8fbf4f });
    return NextResponse.json({ ok: true, posted });
  }

  return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
}
