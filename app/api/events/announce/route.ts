// Posts a new event to Discord. Admins only.
// Env (Vercel): DISCORD_EVENTS_WEBHOOK_URL (falls back to DISCORD_LFG_WEBHOOK_URL, then DISCORD_RECAP_WEBHOOK_URL).
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const SITE = "https://www.commander.host";

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !key) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = createClient(url, key, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: u } = await db.auth.getUser(token);
  if (!u?.user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { data: me } = await db.from("profiles").select("is_admin").eq("id", u.user.id).single();
  if (!me?.is_admin) return NextResponse.json({ ok: false, error: "admins only" }, { status: 403 });

  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  const { data: e } = await db.from("events").select("*").eq("id", id ?? "").maybeSingle();
  if (!e) return NextResponse.json({ ok: false, error: "event not found" }, { status: 404 });

  const hook = process.env.DISCORD_EVENTS_WEBHOOK_URL || process.env.DISCORD_LFG_WEBHOOK_URL || process.env.DISCORD_RECAP_WEBHOOK_URL;
  if (!hook) return NextResponse.json({ ok: false, error: "Set DISCORD_EVENTS_WEBHOOK_URL in Vercel first." }, { status: 500 });
  const when = Math.floor(Date.parse(e.starts_at) / 1000);
  const res = await fetch(hook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "Commander",
      avatar_url: `${SITE}/icons/icon-192.png`,
      embeds: [{
        title: `📅 ${e.title}`,
        url: `${SITE}/events#${e.id}`,
        // Discord shows <t:…> in each reader's own time zone, with a live countdown
        description: `${e.description ? e.description + "\n\n" : ""}🕒 <t:${when}:F> — <t:${when}:R>\n\nRSVP and get a reminder: ${SITE}/events`,
        color: 0xe8a63d,
        footer: { text: "commander.host/events" },
      }],
      allowed_mentions: { parse: [] },
    }),
  });
  if (!res.ok) return NextResponse.json({ ok: false, error: `Discord said ${res.status}` }, { status: 502 });
  return NextResponse.json({ ok: true });
}
