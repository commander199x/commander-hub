// Discord slash command endpoint for commander.host
// Discord sends every use of the command here; we reply with the player's rank.
import { NextResponse, after } from "next/server";
import { createPublicKey, verify } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = "https://commander.host";
const API = "https://discord.com/api/v10";
const AMBER = 0xe8a63d;
const MUTED = 0x83866f;
const MIN_MATCHES_FOR_RANK = 3; // same rule as the leaderboard
const PAGE = 1000;

type Option = { name: string; value?: string | number | boolean };
type Interaction = {
  type: number;
  token: string;
  application_id: string;
  data?: { name?: string; options?: Option[] };
};
type Embed = {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
};
type Reply = { content?: string; embeds?: Embed[] };
type Entry = { name: string; rating: number; wins: number; losses: number };

// ---------- request signature check (required by Discord) ----------
function signatureIsValid(body: string, signature: string, timestamp: string, publicKeyHex: string): boolean {
  try {
    const der = Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(publicKeyHex.trim(), "hex")]);
    const key = createPublicKey({ key: der, format: "der", type: "spki" });
    return verify(null, Buffer.from(timestamp + body), key, Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

// ---------- data ----------
function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase URL/key env vars are missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchAll<T>(label: string, page: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < 50_000; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(`could not read ${label}: ${error.message}`);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

const toRating = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 1000;
};

/** Same rules as the website: ratings from profiles (overriding guests), banned players hidden, 3+ matches to be ranked. */
async function loadLadder(mode: "team" | "ffa"): Promise<{ ranked: Entry[]; everyone: Entry[] }> {
  const db = supabase();
  const [profiles, guests, matches] = await Promise.all([
    fetchAll<{ username: string; rating_team: number | null; rating_ffa: number | null; banned: boolean | null }>("profiles", (a, b) =>
      db.from("profiles").select("username, rating_team, rating_ffa, banned").order("username").range(a, b)
    ),
    fetchAll<{ name: string; rating_team: number | null; rating_ffa: number | null }>("guest_ratings", (a, b) =>
      db.from("guest_ratings").select("name, rating_team, rating_ffa").order("name").range(a, b)
    ),
    fetchAll<{ participants: string[] | null; winners: string[] | null; mode: string | null }>("matches", (a, b) =>
      db.from("matches").select("participants, winners, mode").range(a, b)
    ),
  ]);

  const rating = new Map<string, number>();
  const banned = new Set<string>();
  for (const g of guests) if (g?.name) rating.set(g.name, toRating(mode === "team" ? g.rating_team : g.rating_ffa));
  for (const p of profiles) {
    if (!p?.username) continue;
    rating.set(p.username, toRating(mode === "team" ? p.rating_team : p.rating_ffa));
    if (p.banned) banned.add(p.username);
  }

  const stats = new Map<string, { w: number; l: number }>();
  for (const m of matches) {
    const parts = Array.isArray(m?.participants) ? m.participants : [];
    const wins = Array.isArray(m?.winners) ? m.winners : [];
    if ((m?.mode === "ffa") !== (mode === "ffa")) continue;
    for (const name of parts) {
      if (!name) continue;
      const s = stats.get(name) ?? { w: 0, l: 0 };
      if (wins.includes(name)) s.w++;
      else s.l++;
      stats.set(name, s);
    }
  }

  const everyone: Entry[] = Array.from(stats.entries())
    .filter(([name]) => !banned.has(name))
    .map(([name, s]) => ({ name, rating: rating.get(name) ?? 1000, wins: s.w, losses: s.l }));
  const ranked = everyone
    .filter((e) => e.wins + e.losses >= MIN_MATCHES_FOR_RANK)
    .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
  return { ranked, everyone };
}

// ---------- replies ----------
const esc = (s: string) => s.replace(/([\\*_`~|>])/g, "\\$1");

async function buildReply(player: string, mode: "team" | "ffa"): Promise<Reply> {
  const modeLabel = mode === "team" ? "Team" : "FFA";
  const { ranked, everyone } = await loadLadder(mode);

  if (!player) {
    if (ranked.length === 0) return { content: `Nobody is ranked on the ${modeLabel} ladder yet (${MIN_MATCHES_FOR_RANK} matches needed).` };
    const lines = ranked.slice(0, 5).map((e, i) => `**${i + 1}.** ${esc(e.name)}  ·  **${e.rating}**  (${e.wins}W ${e.losses}L)`);
    return {
      embeds: [{ title: `Top 5 · ${modeLabel} ladder`, url: SITE, description: lines.join("\n"), color: AMBER, footer: { text: "commander.host" } }],
    };
  }

  const q = player.toLowerCase();
  let found = everyone.find((e) => e.name.toLowerCase() === q);
  if (!found) {
    const partial = everyone.filter((e) => e.name.toLowerCase().includes(q));
    if (partial.length === 1) found = partial[0];
    else if (partial.length > 1) {
      return { content: `Several players match “${esc(player)}”: ${partial.slice(0, 8).map((e) => esc(e.name)).join(", ")}. Try the full name.` };
    }
  }
  if (!found) return { content: `No player called “${esc(player)}” has played on the ${modeLabel} ladder yet.` };

  const games = found.wins + found.losses;
  const position = ranked.findIndex((e) => e.name === found!.name);
  const winRate = games ? Math.round((found.wins / games) * 100) : 0;
  return {
    embeds: [
      {
        title: found.name,
        url: SITE,
        description:
          position >= 0
            ? `**#${position + 1}** of ${ranked.length} on the ${modeLabel} ladder`
            : `Unranked on the ${modeLabel} ladder (${games}/${MIN_MATCHES_FOR_RANK} matches played)`,
        color: position >= 0 ? AMBER : MUTED,
        fields: [
          { name: "Rating", value: String(found.rating), inline: true },
          { name: "Wins", value: String(found.wins), inline: true },
          { name: "Losses", value: String(found.losses), inline: true },
          { name: "Win rate", value: `${winRate}%`, inline: true },
        ],
        footer: { text: "commander.host" },
      },
    ],
  };
}

// ---------- handlers ----------
export async function POST(req: Request) {
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    console.error("[discord] DISCORD_PUBLIC_KEY is not set");
    return new NextResponse("not configured", { status: 500 });
  }

  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");
  const body = await req.text();
  if (!signature || !timestamp || !signatureIsValid(body, signature, timestamp, publicKey)) {
    return new NextResponse("invalid request signature", { status: 401 });
  }

  const interaction = JSON.parse(body) as Interaction;

  // Discord's "is this endpoint alive?" check when you save the URL in the portal
  if (interaction.type === 1) return NextResponse.json({ type: 1 });

  if (interaction.type === 2) {
    const opts = new Map((interaction.data?.options ?? []).map((o) => [o.name, o.value]));
    const playerOpt = opts.get("player");
    const player = typeof playerOpt === "string" ? playerOpt.trim() : "";
    const mode = opts.get("mode") === "ffa" ? "ffa" : "team";

    // Reply "thinking…" right away (Discord allows only 3 seconds), then fill in the answer.
    after(async () => {
      let reply: Reply;
      try {
        reply = await buildReply(player, mode);
      } catch (err) {
        console.error("[discord] command failed:", err);
        reply = { content: "Couldn't load the ladder right now. Try again in a minute." };
      }
      const res = await fetch(`${API}/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reply, allowed_mentions: { parse: [] } }),
      });
      if (!res.ok) console.error("[discord] could not send reply:", res.status, await res.text());
    });
    return NextResponse.json({ type: 5 });
  }

  return NextResponse.json({ type: 4, data: { content: "This action isn't supported.", flags: 64 } });
}

// Health check: open https://commander.host/api/discord/interactions in a browser.
export async function GET() {
  return NextResponse.json({
    ok: true,
    publicKeySet: !!process.env.DISCORD_PUBLIC_KEY,
    supabaseSet: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  });
}
