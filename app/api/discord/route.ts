import { NextRequest, NextResponse } from "next/server";
import nacl from "tweetnacl";
import { createClient } from "@supabase/supabase-js";

// This is the single HTTP endpoint Discord calls for ALL interactions
// (slash commands, buttons, etc.) once you set it as your application's
// "Interactions Endpoint URL". Every request must be signature-verified
// using your application's public key — Discord will disable the
// endpoint if verification isn't implemented correctly.

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!;
const MIN_MATCHES_FOR_RANK = 3;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function verifyDiscordRequest(req: NextRequest, rawBody: string): Promise<boolean> {
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");
  if (!signature || !timestamp) return false;

  try {
    return nacl.sign.detached.verify(
      Buffer.from(timestamp + rawBody),
      Buffer.from(signature, "hex"),
      Buffer.from(DISCORD_PUBLIC_KEY, "hex")
    );
  } catch {
    return false;
  }
}

type Match = { participants: string[]; winners: string[]; mode: string };

async function computeRank(
  supabase: ReturnType<typeof getSupabase>,
  username: string
): Promise<{ team: string; ffa: string }> {
  const { data: matches } = await supabase
    .from("matches")
    .select("participants, winners, mode");

  const allMatches = (matches ?? []) as Match[];

  function buildStandings(isTeamView: boolean) {
    const relevant = allMatches.filter((m) =>
      isTeamView ? m.mode !== "ffa" : m.mode === "ffa"
    );
    const stats = new Map<string, { wins: number; losses: number }>();
    for (const m of relevant) {
      for (const p of m.participants) {
        const row = stats.get(p) ?? { wins: 0, losses: 0 };
        if (m.winners.includes(p)) row.wins += 1;
        else row.losses += 1;
        stats.set(p, row);
      }
    }
    return stats;
  }

  async function rankFor(isTeamView: boolean): Promise<string> {
    const stats = buildStandings(isTeamView);
    const qualifiedNames = Array.from(stats.entries())
      .filter(([, s]) => s.wins + s.losses >= MIN_MATCHES_FOR_RANK)
      .map(([name]) => name);

    const column = isTeamView ? "rating_team" : "rating_ffa";

    const { data: profileRows } = await supabase
      .from("profiles")
      .select(`username, ${column}`)
      .in("username", qualifiedNames.length > 0 ? qualifiedNames : ["__none__"]);
    const { data: guestRows } = await supabase
      .from("guest_ratings")
      .select(`name, ${column}`)
      .in("name", qualifiedNames.length > 0 ? qualifiedNames : ["__none__"]);

    const ratingMap: Record<string, number> = {};
    for (const p of (profileRows ?? []) as any[]) ratingMap[p.username] = p[column] ?? 1000;
    for (const g of (guestRows ?? []) as any[]) ratingMap[g.name] = g[column] ?? 1000;

    const sorted = qualifiedNames
      .map((name) => ({ name, rating: ratingMap[name] ?? 1000 }))
      .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));

    const position = sorted.findIndex((p) => p.name === username);
    const myStats = stats.get(username);

    if (!myStats || myStats.wins + myStats.losses < MIN_MATCHES_FOR_RANK) {
      const played = myStats ? myStats.wins + myStats.losses : 0;
      return `Unranked (${played}/${MIN_MATCHES_FOR_RANK} matches played)`;
    }
    if (position === -1) return "Not ranked";

    const total = myStats.wins + myStats.losses;
    const winRate = total > 0 ? Math.round((myStats.wins / total) * 100) : 0;
    return `#${position + 1} — Rating ${ratingMap[username] ?? 1000} — ${myStats.wins}W/${myStats.losses}L (${winRate}%)`;
  }

  const [team, ffa] = await Promise.all([rankFor(true), rankFor(false)]);
  return { team, ffa };
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const isValid = await verifyDiscordRequest(req, rawBody);
  if (!isValid) {
    return new NextResponse("Invalid request signature", { status: 401 });
  }

  const body = JSON.parse(rawBody);

  // Type 1 = PING, Discord's way of checking the endpoint is alive.
  if (body.type === 1) {
    return NextResponse.json({ type: 1 });
  }

  // Type 2 = a slash command was used.
  if (body.type === 2 && body.data?.name === "rank") {
    const discordUserId: string | undefined = body.member?.user?.id ?? body.user?.id;

    if (!discordUserId) {
      return NextResponse.json({
        type: 4,
        data: { content: "Couldn't identify your Discord account.", flags: 64 },
      });
    }

    const supabase = getSupabase();
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("discord_id", discordUserId)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({
        type: 4,
        data: {
          content:
            "I couldn't find a Commander account linked to your Discord. Sign in at commander.host using \"Continue with Discord\" first, then try again.",
          flags: 64,
        },
      });
    }

    const { team, ffa } = await computeRank(supabase, profile.username);

    return NextResponse.json({
      type: 4,
      data: {
        content: `**${profile.username}**\n🛡️ Team (2v2/3v3/4v4): ${team}\n⚔️ FFA: ${ffa}`,
        flags: 64, // ephemeral — only the user who ran the command sees this
      },
    });
  }

  return NextResponse.json({ type: 4, data: { content: "Unknown command.", flags: 64 } });
}
