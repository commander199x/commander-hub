// Posts "we're live on TikTok" to Discord. Only works for signed-in admins.
// Setup (Vercel → Environment Variables): DISCORD_LIVE_WEBHOOK_URL
// (if not set, it uses DISCORD_RECAP_WEBHOOK_URL so both go to the same channel).
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

  // Check the caller is a signed-in admin, using their own session (database rules apply)
  const db = createClient(url, key, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: userData } = await db.auth.getUser(token);
  if (!userData?.user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { data: me } = await db.from("profiles").select("username, is_admin").eq("id", userData.user.id).single();
  if (!me?.is_admin) return NextResponse.json({ ok: false, error: "admins only" }, { status: 403 });

  const hook = process.env.DISCORD_LIVE_WEBHOOK_URL || process.env.DISCORD_RECAP_WEBHOOK_URL;
  if (!hook) return NextResponse.json({ ok: false, error: "Set DISCORD_LIVE_WEBHOOK_URL in Vercel first." }, { status: 500 });

  const body = (await req.json().catch(() => ({}))) as { title?: string; url?: string };
  const title = (body.title || "Commander is live on TikTok").slice(0, 200);
  const watch = body.url && /^https:\/\/(www\.)?tiktok\.com\//.test(body.url) ? body.url : `${SITE}/live`;

  const res = await fetch(hook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "Commander",
      avatar_url: `${SITE}/icons/icon-192.png`,
      embeds: [{ title: `🔴 ${title}`, url: watch, description: "We're **LIVE on TikTok** right now — come watch and say hi! 🎮", color: 0xdc2626, footer: { text: "commander.host/live" }, timestamp: new Date().toISOString() }],
      allowed_mentions: { parse: [] },
    }),
  });
  if (!res.ok) return NextResponse.json({ ok: false, error: `Discord said ${res.status}` }, { status: 502 });
  return NextResponse.json({ ok: true });
}
