// Discord slash commands for commander.host — Discord sends every command, button click and
// name-autocomplete here; we answer with branded cards. (Runs on Vercel: it answers commands
// and buttons; it can't read normal chat messages.)
import { NextResponse, after } from "next/server";
import { createPublicKey, verify } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { SOCIALS, SUPPORT_CHANNEL_ID } from "@/lib/discord-socials";
import { TIKTOK_URL } from "@/lib/theme";
import { GENERAL_BY_KEY, FACTIONS, isGeneralKey, type GeneralKey } from "@/lib/generals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = "https://www.commander.host";
const ICON = `${SITE}/icons/icon-192.png`;
const API = "https://discord.com/api/v10";
const AMBER = 0xe8a63d, GREEN = 0x8fbf4f, RED = 0xdc2626, MUTED = 0x83866f;
const MIN_MATCHES_FOR_RANK = 3; // same rule as the leaderboard
const PAGE = 1000;
const LADDER = "ladder";

type SocialKey = keyof typeof SOCIALS;
const SOCIAL_LABEL: Record<SocialKey, string> = { youtube: "YouTube", tiktok: "TikTok", kick: "Kick", twitch: "Twitch" };
const isSocial = (name: string): name is SocialKey => Object.prototype.hasOwnProperty.call(SOCIAL_LABEL, name);
const SUPPORT_COMMANDS = new Set(["support", "مساعدة"]);
const activeSocials = () => (Object.keys(SOCIAL_LABEL) as SocialKey[]).filter((k) => !!SOCIALS[k]);

type Option = { name: string; value?: string | number | boolean; focused?: boolean };
type Interaction = { type: number; token: string; application_id: string; locale?: string; data?: { name?: string; options?: Option[]; custom_id?: string } };
type Embed = {
  title?: string; description?: string; url?: string; color?: number; timestamp?: string;
  author?: { name: string; icon_url?: string; url?: string };
  thumbnail?: { url: string }; image?: { url: string };
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string; icon_url?: string };
};
type Button = { type: 2; style: 1 | 2 | 5; label: string; url?: string; custom_id?: string; emoji?: { name: string }; disabled?: boolean };
type Reply = { content?: string; embeds?: Embed[]; components?: { type: 1; components: Button[] }[]; flags?: number };
type Entry = { name: string; rating: number; wins: number; losses: number };
type Lang = "en" | "ar";

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
  const ranked = everyone.filter((e) => e.wins + e.losses >= MIN_MATCHES_FOR_RANK).sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
  return { ranked, everyone };
}

type MatchRow = { mode: string; participants: string[] | null; winners: string[] | null; map: string | null; created_at: string; generals?: unknown; rating_changes?: Record<string, number> | null };
async function matchesOf(name: string, limit = 2000): Promise<MatchRow[]> {
  const db = supabase();
  const cols = "mode, participants, winners, map, created_at, rating_changes";
  const a = await db.from("matches").select(`${cols}, generals`).contains("participants", [name]).order("created_at", { ascending: false }).limit(limit);
  if (!a.error) return (a.data ?? []) as unknown as MatchRow[];
  const b = await db.from("matches").select(cols).contains("participants", [name]).order("created_at", { ascending: false }).limit(limit);
  return (b.data ?? []) as unknown as MatchRow[];
}

// ---------- look & language ----------
const esc = (s: string) => s.replace(/([\\*_`~|>])/g, "\\$1");
const T = (l: Lang, en: string, ar: string) => (l === "ar" ? ar : en);
const langOf = (i: Interaction): Lang => (i.locale?.startsWith("ar") ? "ar" : "en");
const footer = { text: "commander.host", icon_url: ICON };
const card = (e: Embed): Embed => ({ color: AMBER, footer, timestamp: new Date().toISOString(), ...e });
const links = (...items: [string, string, string?][]): Reply["components"] => [{ type: 1, components: items.map(([label, url, emoji]) => ({ type: 2 as const, style: 5 as const, label, url, ...(emoji ? { emoji: { name: emoji } } : {}) })) }];
const profileUrl = (n: string) => `${SITE}/profile/${encodeURIComponent(n)}`;
const MEDAL = ["🥇", "🥈", "🥉"];
const TIERS: [number, string, string][] = [
  [-Infinity, "Private", "جندي"], [900, "Corporal", "عريف"], [1000, "Sergeant", "رقيب"], [1100, "Lieutenant", "ملازم"], [1200, "Captain", "نقيب"],
  [1300, "Major", "رائد"], [1400, "Colonel", "عقيد"], [1500, "Brigadier General", "عميد"], [1600, "General", "لواء"], [1700, "Commander", "قائد"],
];
const tier = (r: number, l: Lang) => { const t = TIERS.reduce((acc, x) => (r >= x[0] ? x : acc), TIERS[0]); return l === "ar" ? t[2] : t[1]; };
const genOf = (m: MatchRow, n: string): GeneralKey | null => { const g = m.generals && typeof m.generals === "object" ? (m.generals as Record<string, unknown>)[n] : null; return isGeneralKey(g) ? g : null; };
const genLabel = (k: GeneralKey, l: Lang) => `${FACTIONS[GENERAL_BY_KEY[k].faction].code} ${l === "ar" ? GENERAL_BY_KEY[k].shortAr : GENERAL_BY_KEY[k].short}`;
const ts = (iso: string, style: "F" | "R" | "f" | "d" | "t" = "R") => `<t:${Math.floor(Date.parse(iso) / 1000)}:${style}>`;

/** Finds a player by exact or unique partial name. */
async function findPlayer(q: string): Promise<{ username: string; avatar_url: string | null; rating_team: number | null; rating_ffa: number | null; created_at: string; banner_url?: string | null } | { many: string[] } | null> {
  const db = supabase();
  const base = "username, avatar_url, rating_team, rating_ffa, created_at";
  let res = await db.from("profiles").select(`${base}, banner_url`).ilike("username", `%${q.replace(/[%_]/g, "")}%`).eq("banned", false).limit(10);
  if (res.error) res = (await db.from("profiles").select(base).ilike("username", `%${q.replace(/[%_]/g, "")}%`).eq("banned", false).limit(10)) as typeof res;
  const rows = (res.data ?? []) as { username: string; avatar_url: string | null; rating_team: number | null; rating_ffa: number | null; created_at: string; banner_url?: string | null }[];
  const exact = rows.find((r) => r.username.toLowerCase() === q.toLowerCase());
  if (exact) return exact;
  if (rows.length === 1) return rows[0];
  if (rows.length > 1) return { many: rows.map((r) => r.username) };
  return null;
}

// ---------- replies ----------
async function ladderReply(mode: "team" | "ffa", l: Lang): Promise<Reply> {
  const modeLabel = mode === "team" ? T(l, "Team", "الفرق") : "FFA";
  const { ranked } = await loadLadder(mode);
  const lines = ranked.slice(0, 10).map((e, i) => {
    const g = e.wins + e.losses;
    return `${MEDAL[i] ?? `\`${String(i + 1).padStart(2, " ")}\``}  **${esc(e.name)}** — **${e.rating}** · ${tier(e.rating, l)}  ·  ${e.wins}W ${e.losses}L (${g ? Math.round((e.wins / g) * 100) : 0}%)`;
  });
  return {
    embeds: [card({
      author: { name: T(l, "Commander ranked ladder", "تصنيف كوماندر"), icon_url: ICON, url: `${SITE}/leaderboard` },
      title: T(l, `Top 10 · ${modeLabel} ladder`, `أفضل 10 · تصنيف ${modeLabel}`),
      url: `${SITE}/leaderboard`,
      description: lines.length ? lines.join("\n") : T(l, `Nobody is ranked yet — ${MIN_MATCHES_FOR_RANK} matches needed.`, `لا أحد مصنّف بعد — يلزم ${MIN_MATCHES_FOR_RANK} مباريات.`),
      fields: [{ name: T(l, "Ranked players", "اللاعبون المصنّفون"), value: String(ranked.length), inline: true }],
    })],
    components: [{ type: 1, components: [
      { type: 2, style: mode === "team" ? 1 : 2, label: T(l, "Team", "الفرق"), custom_id: "ladder:team", disabled: mode === "team" },
      { type: 2, style: mode === "ffa" ? 1 : 2, label: "FFA", custom_id: "ladder:ffa", disabled: mode === "ffa" },
      { type: 2, style: 5, label: T(l, "Full leaderboard", "التصنيف الكامل"), url: `${SITE}/leaderboard` },
    ] }],
  };
}

async function playerReply(q: string, l: Lang): Promise<Reply> {
  const p = await findPlayer(q);
  if (!p) return { flags: 64, content: T(l, `No player called “${esc(q)}” on commander.host.`, `لا يوجد لاعب باسم «${esc(q)}» على commander.host.`) };
  if ("many" in p) return { flags: 64, content: T(l, `Several players match: ${p.many.map(esc).join(", ")}. Pick one from the list as you type.`, `عدة لاعبين يطابقون: ${p.many.map(esc).join("، ")}. اختر واحداً من القائمة.`) };
  const db = supabase();
  const [team, ms, ach] = await Promise.all([
    loadLadder("team"),
    matchesOf(p.username),
    db.from("player_achievements").select("key", { count: "exact", head: true }).eq("username", p.username),
  ]);
  const won = (m: MatchRow) => (m.winners ?? []).includes(p.username);
  const wins = ms.filter(won).length, losses = ms.length - wins;
  let streak = 0;
  for (const m of ms) { if (won(m)) streak++; else break; }
  const form = ms.slice(0, 5).map((m) => (won(m) ? "✅" : "❌")).join(" ") || "—";
  const gens: Record<string, number> = {};
  for (const m of ms) { const g = genOf(m, p.username); if (g) gens[g] = (gens[g] ?? 0) + 1; }
  const fav = Object.entries(gens).sort((a, b) => b[1] - a[1])[0];
  const rt = toRating(p.rating_team), rf = toRating(p.rating_ffa);
  const pos = team.ranked.findIndex((e) => e.name === p.username);
  return {
    embeds: [card({
      author: { name: T(l, "Commander file", "ملف قائد"), icon_url: ICON },
      title: p.username,
      url: profileUrl(p.username),
      description: `**${tier(rt, l)}**${pos >= 0 ? `  ·  ${MEDAL[pos] ?? ""} **#${pos + 1}** ${T(l, `of ${team.ranked.length} on the Team ladder`, `من ${team.ranked.length} في تصنيف الفرق`)}` : `  ·  ${T(l, "unranked", "غير مصنّف")}`}`,
      color: pos >= 0 && pos < 3 ? AMBER : pos >= 0 ? GREEN : MUTED,
      thumbnail: p.avatar_url ? { url: p.avatar_url } : { url: ICON },
      ...(p.banner_url ? { image: { url: p.banner_url } } : {}),
      fields: [
        { name: T(l, "Team rating", "تقييم الفرق"), value: `**${rt}**`, inline: true },
        { name: T(l, "FFA rating", "تقييم FFA"), value: `**${rf}**`, inline: true },
        { name: T(l, "Record", "السجل"), value: `${wins}W ${losses}L · ${ms.length ? Math.round((wins / ms.length) * 100) : 0}%`, inline: true },
        { name: T(l, "Last 5", "آخر 5"), value: form, inline: true },
        { name: T(l, "Win streak", "سلسلة الفوز"), value: streak ? `🔥 ${streak}` : "—", inline: true },
        { name: T(l, "Favourite general", "الجنرال المفضّل"), value: fav ? `${genLabel(fav[0] as GeneralKey, l)} (${fav[1]})` : "—", inline: true },
        ...(ach.error ? [] : [{ name: T(l, "Achievements", "الإنجازات"), value: `🏅 ${ach.count ?? 0} / 18`, inline: true }]),
        { name: T(l, "Member since", "عضو منذ"), value: ts(p.created_at, "d"), inline: true },
      ],
    })],
    components: links([T(l, "View profile", "عرض الملف"), profileUrl(p.username), "👤"], [T(l, "Challenge", "تحدٍّ"), profileUrl(p.username), "⚔️"], [T(l, "Head-to-head", "مواجهة"), `${SITE}/stats/h2h?a=${encodeURIComponent(p.username)}`, "🆚"]),
  };
}

async function h2hReply(a: string, b: string, l: Lang): Promise<Reply> {
  const [pa, pb] = await Promise.all([findPlayer(a), findPlayer(b)]);
  const bad = (x: typeof pa, q: string) => !x || "many" in x ? T(l, `Couldn't find a single player for “${esc(q)}”.`, `لم أجد لاعباً واحداً باسم «${esc(q)}».`) : null;
  const e = bad(pa, a) ?? bad(pb, b);
  if (e) return { flags: 64, content: e };
  const A = (pa as { username: string }).username, B = (pb as { username: string }).username;
  if (A === B) return { flags: 64, content: T(l, "Pick two different players.", "اختر لاعبَين مختلفين.") };
  const shared = (await matchesOf(A)).filter((m) => (m.participants ?? []).includes(B));
  let aw = 0, bw = 0, tw = 0, tl = 0;
  for (const m of shared) {
    const aW = (m.winners ?? []).includes(A), bW = (m.winners ?? []).includes(B);
    if (aW && bW) tw++;
    else if (!aW && !bW && m.mode !== "ffa") tl++;
    else if (aW) aw++;
    else if (bW) bw++;
  }
  const last = shared.slice(0, 5).map((m) => {
    const aW = (m.winners ?? []).includes(A), bW = (m.winners ?? []).includes(B);
    const r = aW && bW ? T(l, "won together", "فازا معاً") : aW ? `**${esc(A)}**` : bW ? `**${esc(B)}**` : T(l, "lost together", "خسرا معاً");
    return `\`${m.mode.toUpperCase()}\` ${r}${m.map ? ` · ${esc(m.map)}` : ""} · ${ts(m.created_at)}`;
  });
  return {
    embeds: [card({
      author: { name: T(l, "Head-to-head", "مواجهة مباشرة"), icon_url: ICON },
      title: `${A}  ${aw} — ${bw}  ${B}`,
      url: `${SITE}/stats/h2h?a=${encodeURIComponent(A)}&b=${encodeURIComponent(B)}`,
      color: aw === bw ? MUTED : AMBER,
      description: shared.length ? (aw === bw ? T(l, "Dead even.", "تعادل تام.") : T(l, `**${esc(aw > bw ? A : B)}** leads the rivalry.`, `**${esc(aw > bw ? A : B)}** يتقدّم في المنافسة.`)) : T(l, "These two haven't played each other yet.", "لم يلعب هذان ضد بعضهما بعد."),
      fields: shared.length ? [
        { name: T(l, "Shared matches", "مباريات مشتركة"), value: String(shared.length), inline: true },
        { name: T(l, "As teammates", "كزملاء"), value: `${tw}W ${tl}L`, inline: true },
        { name: T(l, "Latest", "الأحدث"), value: last.join("\n") },
      ] : [],
    })],
    components: links([T(l, "Full head-to-head", "المواجهة الكاملة"), `${SITE}/stats/h2h?a=${encodeURIComponent(A)}&b=${encodeURIComponent(B)}`, "🆚"]),
  };
}

async function metaReply(l: Lang): Promise<Reply> {
  const db = supabase();
  const res = await db.from("matches").select("participants, winners, generals").limit(20000);
  if (res.error) return { flags: 64, content: T(l, "General stats aren't switched on yet.", "إحصائيات الجنرالات غير مفعّلة بعد.") };
  const st: Record<string, { p: number; w: number }> = {};
  for (const m of (res.data ?? []) as { participants: string[] | null; winners: string[] | null; generals: unknown }[]) {
    for (const n of m.participants ?? []) {
      const g = genOf(m as MatchRow, n);
      if (!g) continue;
      const s = (st[g] ??= { p: 0, w: 0 });
      s.p++;
      if ((m.winners ?? []).includes(n)) s.w++;
    }
  }
  const rows = Object.entries(st).filter(([, s]) => s.p >= 5).sort((a, b) => b[1].w / b[1].p - a[1].w / a[1].p);
  const total = Object.values(st).reduce((a, s) => a + s.p, 0);
  if (!rows.length) return { content: T(l, "Not enough tagged games yet — the meta appears once generals are tagged on matches.", "لا توجد مباريات كافية بعد — تظهر الميتا عند تسجيل الجنرالات.") };
  const most = Object.entries(st).sort((a, b) => b[1].p - a[1].p)[0];
  return {
    embeds: [card({
      author: { name: T(l, "Generals meta", "ميتا الجنرالات"), icon_url: ICON },
      title: T(l, "Who's winning right now", "من يفوز الآن"),
      url: `${SITE}/stats/generals`,
      description: rows.slice(0, 8).map(([g, s], i) => `${MEDAL[i] ?? "▫️"} **${genLabel(g as GeneralKey, l)}** — ${Math.round((s.w / s.p) * 100)}% ${T(l, "wins", "فوز")} · ${s.p} ${T(l, "games", "مباراة")}`).join("\n"),
      fields: [
        { name: T(l, "Most picked", "الأكثر اختياراً"), value: `${genLabel(most[0] as GeneralKey, l)} · ${Math.round((most[1].p / Math.max(1, total)) * 100)}%`, inline: true },
        { name: T(l, "Games tagged", "مباريات مسجّلة"), value: String(total), inline: true },
      ],
    })],
    components: links([T(l, "Full meta & matchups", "الميتا والمواجهات"), `${SITE}/stats/generals`, "📊"]),
  };
}

async function eventsReply(l: Lang): Promise<Reply> {
  const db = supabase();
  const res = await db.from("events").select("id, title, kind, starts_at, description").gt("starts_at", new Date(Date.now() - 3 * 3600_000).toISOString()).order("starts_at").limit(4);
  if (res.error) return { flags: 64, content: T(l, "Events aren't switched on yet.", "الفعاليات غير مفعّلة بعد.") };
  const evs = (res.data ?? []) as { id: string; title: string; kind: string; starts_at: string; description: string | null }[];
  const rs = evs.length ? await db.from("event_rsvps").select("event_id, status").in("event_id", evs.map((e) => e.id)) : { data: [] };
  const going = (id: string) => ((rs.data ?? []) as { event_id: string; status: string }[]).filter((r) => r.event_id === id && r.status === "going").length;
  const ICONS: Record<string, string> = { clan_night: "🎮", tournament: "🏆", stream: "🔴", training: "🎯", other: "📌" };
  return {
    embeds: [card({
      author: { name: T(l, "Operations calendar", "تقويم العمليات"), icon_url: ICON },
      title: T(l, "Upcoming events", "الفعاليات القادمة"),
      url: `${SITE}/events`,
      description: evs.length ? undefined : T(l, "Nothing scheduled yet — check back soon.", "لا شيء مجدول بعد — تابعنا قريباً."),
      fields: evs.map((e) => ({ name: `${ICONS[e.kind] ?? "📌"} ${e.title}`, value: `${ts(e.starts_at, "F")} — ${ts(e.starts_at, "R")}\n👥 ${going(e.id)} ${T(l, "going", "حاضر")} · [RSVP](${SITE}/events#${e.id})` })),
    })],
    components: links([T(l, "RSVP & reminders", "سجّل حضورك"), `${SITE}/events`, "📅"]),
  };
}

async function liveReply(l: Lang): Promise<Reply> {
  const db = supabase();
  const [live, stream, lobby, queue] = await Promise.all([
    db.from("site_settings").select("value").eq("key", "live").maybeSingle(),
    db.from("site_settings").select("value").eq("key", "stream").maybeSingle(),
    db.from("stream_lobby").select("username", { count: "exact", head: true }),
    db.from("stream_queue").select("username", { count: "exact", head: true }),
  ]);
  const lv = (live.data as { value?: { live?: boolean; until?: string } } | null)?.value;
  const isLive = !!lv?.live && (!lv.until || Date.parse(lv.until) > Date.now());
  const sv = (stream.data as { value?: { open?: boolean; size?: number; mode?: string } } | null)?.value;
  const tiktokLive = TIKTOK_URL.replace(/\/$/, "") + "/live";
  return {
    embeds: [card({
      author: { name: "Commander LIVE", icon_url: ICON },
      title: isLive ? T(l, "🔴 We're live on TikTok!", "🔴 نحن مباشر على تيك توك!") : T(l, "Off air right now", "لسنا على الهواء الآن"),
      url: `${SITE}/live`,
      color: isLive ? RED : MUTED,
      description: isLive ? T(l, "Jump in, say hi in chat — and grab a seat in the FFA queue.", "ادخل وسلّم في الدردشة — واحجز مقعدك في طابور FFA.") : T(l, "Follow on TikTok so you never miss a stream.", "تابعنا على تيك توك حتى لا يفوتك أي بث."),
      fields: sv ? [
        { name: T(l, "Stream queue", "طابور البث"), value: sv.open ? T(l, "🟢 Open", "🟢 مفتوح") : T(l, "🔒 Closed", "🔒 مغلق"), inline: true },
        { name: T(l, "Lobby", "اللوبي"), value: `${lobby.count ?? 0}/${sv.size ?? 7}`, inline: true },
        { name: T(l, "Waiting", "بالانتظار"), value: String(queue.count ?? 0), inline: true },
      ] : [],
    })],
    components: links(...([[isLive ? T(l, "Watch on TikTok", "شاهد على تيك توك") : T(l, "Follow on TikTok", "تابع على تيك توك"), isLive ? tiktokLive : TIKTOK_URL, "📺"], ...(sv?.open ? [[T(l, "Join the queue", "انضم للطابور"), `${SITE}/q`, "🎮"]] : [])] as [string, string, string][])),
  };
}

async function queueReply(l: Lang): Promise<Reply> {
  const db = supabase();
  const [stream, lobby, queue] = await Promise.all([
    db.from("site_settings").select("value").eq("key", "stream").maybeSingle(),
    db.from("stream_lobby").select("username, seat").order("seat"),
    db.from("stream_queue").select("username").order("joined_at"),
  ]);
  if (lobby.error) return { flags: 64, content: T(l, "The stream queue isn't switched on yet.", "طابور البث غير مفعّل بعد.") };
  const sv = ((stream.data as { value?: { open?: boolean; size?: number; mode?: string } } | null)?.value) ?? {};
  const seats = (lobby.data ?? []) as { username: string; seat: number }[];
  const waiting = (queue.data ?? []) as { username: string }[];
  return {
    embeds: [card({
      author: { name: T(l, "Stream lobby · FFA", "لوبي البث · FFA"), icon_url: ICON },
      title: sv.open ? T(l, "🟢 Queue open — join now", "🟢 الطابور مفتوح — انضم الآن") : T(l, "🔒 Queue closed", "🔒 الطابور مغلق"),
      url: `${SITE}/live`,
      color: sv.open ? GREEN : MUTED,
      fields: [
        { name: `${T(l, "Lobby", "اللوبي")} ${seats.length}/${sv.size ?? 7}`, value: seats.length ? seats.map((s, i) => `${i === 0 ? "👑" : `\`${s.seat}\``} ${esc(s.username)}`).join("\n") : "—", inline: true },
        { name: `${sv.mode === "fair" ? T(l, "In the draw", "في القرعة") : T(l, "Next up", "التالي")} · ${waiting.length}`, value: waiting.length ? waiting.slice(0, 10).map((w, i) => (sv.mode === "fair" ? `• ${esc(w.username)}` : `\`${i + 1}\` ${esc(w.username)}`)).join("\n") + (waiting.length > 10 ? `\n+${waiting.length - 10}` : "") : "—", inline: true },
        { name: T(l, "How to join", "كيف تنضم"), value: T(l, `Go to **commander.host/q** — the winner keeps their seat and the queue rotates in (${sv.mode === "fair" ? "fair draw" : "first come, first served"}).`, `ادخل على **commander.host/q** — الفائز يحتفظ بمقعده والطابور يتناوب (${sv.mode === "fair" ? "قرعة عادلة" : "الأسبق أولاً"}).`) },
      ],
    })],
    components: links([T(l, "Join the queue", "انضم للطابور"), `${SITE}/q`, "🎮"]),
  };
}

async function playReply(l: Lang): Promise<Reply> {
  const db = supabase();
  const res = await db.from("ready_players").select("username, modes, note, until").gt("until", new Date().toISOString()).order("updated_at", { ascending: false }).limit(15);
  if (res.error) return { flags: 64, content: T(l, "Find a game isn't switched on yet.", "البحث عن مباراة غير مفعّل بعد.") };
  const rows = (res.data ?? []) as { username: string; modes: string[]; note: string | null; until: string }[];
  return {
    embeds: [card({
      author: { name: T(l, "Find a game", "ابحث عن مباراة"), icon_url: ICON },
      title: rows.length ? T(l, `🟢 ${rows.length} ready to play`, `🟢 ${rows.length} جاهزون للعب`) : T(l, "Nobody's on the ready list right now", "لا أحد في قائمة الجاهزين الآن"),
      url: `${SITE}/play`,
      color: rows.length ? GREEN : MUTED,
      description: rows.length ? rows.map((r) => `**${esc(r.username)}** · ${r.modes.map((m) => `\`${m.toUpperCase()}\``).join(" ")}${r.note ? ` — _${esc(r.note)}_` : ""} · ${T(l, "until", "حتى")} ${ts(r.until, "t")}`).join("\n") : T(l, "Be the first — mark yourself ready and get challenged.", "كن الأول — أعلن جاهزيتك وتلقَّ التحديات."),
    })],
    components: links([T(l, "Find a game", "ابحث عن مباراة"), `${SITE}/play`, "⚔️"]),
  };
}

async function recentReply(l: Lang): Promise<Reply> {
  const db = supabase();
  let res = await db.from("matches").select("mode, participants, winners, map, created_at, generals").order("created_at", { ascending: false }).limit(6);
  if (res.error) res = (await db.from("matches").select("mode, participants, winners, map, created_at").order("created_at", { ascending: false }).limit(6)) as typeof res;
  const rows = (res.data ?? []) as unknown as MatchRow[];
  return {
    embeds: [card({
      author: { name: T(l, "Latest results", "آخر النتائج"), icon_url: ICON },
      title: T(l, "Recent ranked matches", "آخر المباريات المصنّفة"),
      url: `${SITE}/leaderboard`,
      description: rows.length ? rows.map((m) => {
        const w = m.winners ?? [], lo = (m.participants ?? []).filter((p) => !w.includes(p));
        return `\`${m.mode.toUpperCase()}\` 🏆 **${w.map(esc).join(" + ")}** ${T(l, "beat", "هزم")} ${lo.map(esc).join(" + ")}${m.map ? ` · ${esc(m.map)}` : ""} · ${ts(m.created_at)}`;
      }).join("\n") : "—",
    })],
    components: links([T(l, "Leaderboard", "التصنيف"), `${SITE}/leaderboard`, "📈"]),
  };
}

const ACH: Record<string, [string, string, string]> = {
  first_win: ["🥉", "First Blood", "أول دم"], games30: ["🥉", "Veteran", "مخضرم"], maps10: ["🥉", "Globetrotter", "رحّالة"], tournament: ["🥉", "Tournament Contender", "منافس البطولات"], replay: ["🥉", "Archivist", "أمين الأرشيف"],
  wins10: ["🥈", "Battle-Hardened", "صلب المعارك"], games100: ["🥈", "Centurion", "قائد المئة"], streak5: ["🥈", "Hot Streak", "سلسلة نارية"], mapMaster: ["🥈", "Map Master", "سيد الخريطة"], ffa_winner: ["🥈", "Last One Standing", "آخر الصامدين"],
  wins50: ["🥇", "War Hero", "بطل حرب"], streak10: ["🥇", "Unstoppable", "لا يُوقف"], all_modes: ["🥇", "Combined Arms", "أسلحة مشتركة"], three_factions: ["🥇", "Three Flags", "ثلاث رايات"], general_master: ["🥇", "Signature General", "الجنرال المميّز"],
  top3: ["💠", "High Command", "القيادة العليا"], champion: ["💠", "Champion", "البطل"], all_generals: ["💠", "Twelve Commands", "الأوامر الاثنا عشر"],
};
async function achievementsReply(q: string, l: Lang): Promise<Reply> {
  const p = await findPlayer(q);
  if (!p || "many" in p) return { flags: 64, content: T(l, `Couldn't find a single player for “${esc(q)}”.`, `لم أجد لاعباً واحداً باسم «${esc(q)}».`) };
  const res = await supabase().from("player_achievements").select("key, unlocked_at").eq("username", p.username).order("unlocked_at", { ascending: false });
  if (res.error) return { flags: 64, content: T(l, "Achievements aren't switched on yet.", "الإنجازات غير مفعّلة بعد.") };
  const rows = (res.data ?? []) as { key: string; unlocked_at: string }[];
  const order = ["💠", "🥇", "🥈", "🥉"];
  const sorted = [...rows].sort((a, b) => order.indexOf(ACH[a.key]?.[0] ?? "🥉") - order.indexOf(ACH[b.key]?.[0] ?? "🥉"));
  return {
    embeds: [card({
      author: { name: T(l, "Service record", "السجل العسكري"), icon_url: ICON },
      title: `${p.username} · ${rows.length}/18 🏅`,
      url: `${profileUrl(p.username)}#achievements`,
      thumbnail: { url: p.avatar_url || ICON },
      description: sorted.length ? sorted.map((r) => `${ACH[r.key]?.[0] ?? "🏅"} **${l === "ar" ? ACH[r.key]?.[2] : ACH[r.key]?.[1] ?? r.key}** · ${ts(r.unlocked_at, "d")}`).join("\n") : T(l, "No achievements yet — the first one is a single win away.", "لا إنجازات بعد — أول إنجاز يبعد فوزاً واحداً."),
    })],
    components: links([T(l, "All achievements", "كل الإنجازات"), `${SITE}/achievements`, "🏅"]),
  };
}

/** /ladder: one player's card when a name is given, otherwise the top 10. */
async function buildReply(player: string, mode: "team" | "ffa", l: Lang): Promise<Reply> {
  return player ? playerReply(player, l) : ladderReply(mode, l);
}

function helpReply(l: Lang): Reply {
  const socials = activeSocials().map((k) => `\`/${k}\``).join(" ");
  const sec = (title: string, lines: string[]) => ({ name: title, value: lines.join("\n") });
  return {
    embeds: [card({
      author: { name: T(l, "Commander bot", "بوت كوماندر"), icon_url: ICON, url: SITE },
      title: T(l, "Everything I can do", "كل ما أستطيع فعله"),
      url: SITE,
      description: SUPPORT_CHANNEL_ID ? T(l, `Need a human? Head to <#${SUPPORT_CHANNEL_ID}>.`, `تحتاج شخصاً؟ توجّه إلى <#${SUPPORT_CHANNEL_ID}>.`) : undefined,
      fields: [
        sec(T(l, "📈 Rankings", "📈 التصنيف"), [`\`/${LADDER}\` — ${T(l, "top 10 (Team / FFA buttons)", "أفضل 10 (أزرار الفرق / FFA)")}`, `\`/player\` — ${T(l, "a full commander file", "ملف قائد كامل")}`, `\`/h2h\` — ${T(l, "two players head-to-head", "مواجهة بين لاعبَين")}`, `\`/achievements\` — ${T(l, "a player's medals", "أوسمة لاعب")}`]),
        sec(T(l, "⚔️ Play", "⚔️ اللعب"), [`\`/play\` — ${T(l, "who's ready right now", "من جاهز الآن")}`, `\`/recent\` — ${T(l, "latest results", "آخر النتائج")}`, `\`/meta\` — ${T(l, "best generals right now", "أفضل الجنرالات الآن")}`, `\`/events\` — ${T(l, "upcoming events", "الفعاليات القادمة")}`]),
        sec(T(l, "🔴 Stream", "🔴 البث"), [`\`/live\` — ${T(l, "are we live?", "هل نحن مباشر؟")}`, `\`/queue\` — ${T(l, "the stream lobby and queue", "لوبي البث والطابور")}`]),
        sec(T(l, "ℹ️ More", "ℹ️ المزيد"), [...(socials ? [`${socials} — ${T(l, "our channels", "قنواتنا")}`] : []), ...(SUPPORT_CHANNEL_ID ? [`\`/support\` \`/مساعدة\` — ${T(l, "get help", "المساعدة")}`] : []), `\`/whoareu\` — ${T(l, "about me", "من أنا")}`]),
      ],
    })],
    components: links([T(l, "Open commander.host", "افتح commander.host"), SITE, "🌐"], [T(l, "Join a game", "ابحث عن مباراة"), `${SITE}/play`, "⚔️"]),
  };
}

function introReply(l: Lang): Reply {
  return {
    embeds: [card({
      author: { name: "Commander", icon_url: ICON, url: SITE },
      title: T(l, "The official Commander clan bot", "البوت الرسمي لكلان كوماندر"),
      url: SITE,
      thumbnail: { url: ICON },
      description: T(l,
        "I run the ranked ladder for **C&C Generals Zero Hour** on commander.host — ratings, ranks, head-to-heads, the generals meta, events and our stream queue, right here in Discord.\n\nType `/help` to see everything.",
        "أدير التصنيف المصنّف لـ **جنرالات الساعة الصفر** على commander.host — التقييمات والرتب والمواجهات وميتا الجنرالات والفعاليات وطابور البث، هنا في ديسكورد.\n\nاكتب `/help` لترى كل شيء."),
    })],
    components: links([T(l, "Visit commander.host", "زُر commander.host"), SITE, "🌐"]),
  };
}

function socialReply(key: SocialKey, l: Lang): Reply {
  const url = SOCIALS[key];
  const label = SOCIAL_LABEL[key];
  if (!url) return { flags: 64, content: T(l, `The ${label} link isn't set up yet.`, `رابط ${label} غير مضاف بعد.`) };
  return { embeds: [card({ author: { name: `Commander · ${label}`, icon_url: ICON }, title: T(l, `Follow Commander on ${label}`, `تابع كوماندر على ${label}`), url })], components: links([T(l, `Open ${label}`, `افتح ${label}`), url]) };
}

function supportReply(l: Lang): Reply {
  if (!SUPPORT_CHANNEL_ID) return { flags: 64, content: T(l, "The support channel isn't set up yet.", "قناة المساعدة غير مضافة بعد.") };
  const ch = `<#${SUPPORT_CHANNEL_ID}>`;
  return { content: `للمساعدة توجّه إلى ${ch} واكتب سؤالك هناك.\nFor help, head to ${ch} and post your question there.` };
}

// ---------- autocomplete: player names as you type ----------
async function suggestPlayers(q: string) {
  const { data } = await supabase().from("profiles").select("username").ilike("username", `%${q.replace(/[%_]/g, "")}%`).eq("banned", false).order("username").limit(25);
  return ((data ?? []) as { username: string }[]).map((p) => ({ name: p.username, value: p.username }));
}

// ---------- handlers ----------
const send = (data: Reply, type = 4) => NextResponse.json({ type, data: { ...data, allowed_mentions: { parse: [] } } });

function later(i: Interaction, build: () => Promise<Reply>) {
  after(async () => {
    let reply: Reply;
    try {
      reply = await build();
    } catch (err) {
      console.error("[discord] command failed:", err);
      reply = { content: T(langOf(i), "Couldn't load that right now — try again in a minute.", "تعذّر التحميل الآن — حاول بعد دقيقة.") };
    }
    const res = await fetch(`${API}/webhooks/${i.application_id}/${i.token}/messages/@original`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...reply, allowed_mentions: { parse: [] } }),
    });
    if (!res.ok) console.error("[discord] could not send reply:", res.status, await res.text());
  });
}

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
  const i = JSON.parse(body) as Interaction;
  const l = langOf(i);

  if (i.type === 1) return NextResponse.json({ type: 1 }); // Discord's "are you alive?" check

  // name suggestions while typing
  if (i.type === 4) {
    const focused = (i.data?.options ?? []).find((o) => o.focused);
    const choices = focused ? await suggestPlayers(String(focused.value ?? "")).catch(() => []) : [];
    return NextResponse.json({ type: 8, data: { choices } });
  }

  // buttons (Team / FFA on the ladder card)
  if (i.type === 3) {
    const id = i.data?.custom_id ?? "";
    if (id === "ladder:team" || id === "ladder:ffa") {
      later(i, () => ladderReply(id === "ladder:ffa" ? "ffa" : "team", l));
      return NextResponse.json({ type: 6 }); // "updating…" — then the card is replaced in place
    }
    return send({ flags: 64, content: "This button has expired." });
  }

  if (i.type === 2) {
    const cmd = i.data?.name ?? "";
    const opts = new Map((i.data?.options ?? []).map((o) => [o.name, o.value]));
    const str = (k: string) => (typeof opts.get(k) === "string" ? String(opts.get(k)).trim() : "");

    if (cmd === "whoareu") return send(introReply(l));
    if (cmd === "help") return send(helpReply(l));
    if (SUPPORT_COMMANDS.has(cmd)) return send(supportReply(l));
    if (isSocial(cmd)) return send(socialReply(cmd, l));

    // database commands: answer "thinking…" now (Discord allows 3 seconds), then fill in the card
    const build: (() => Promise<Reply>) | null =
      cmd === LADDER ? () => buildReply(str("player"), opts.get("mode") === "ffa" ? "ffa" : "team", l)
      : cmd === "player" ? () => playerReply(str("name"), l)
      : cmd === "h2h" ? () => h2hReply(str("player1"), str("player2"), l)
      : cmd === "meta" ? () => metaReply(l)
      : cmd === "events" ? () => eventsReply(l)
      : cmd === "live" ? () => liveReply(l)
      : cmd === "queue" ? () => queueReply(l)
      : cmd === "play" ? () => playReply(l)
      : cmd === "recent" ? () => recentReply(l)
      : cmd === "achievements" ? () => achievementsReply(str("name"), l)
      : null;
    if (!build) return send({ flags: 64, content: T(l, "I don't know that command yet — try /help.", "لا أعرف هذا الأمر بعد — جرّب /help.") });
    later(i, build);
    return NextResponse.json({ type: 5 });
  }

  return send({ content: "This action isn't supported.", flags: 64 });
}

// Health check: open https://www.commander.host/api/discord/interactions in a browser.
export async function GET() {
  return NextResponse.json({
    ok: true,
    publicKeySet: !!process.env.DISCORD_PUBLIC_KEY,
    supabaseSet: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  });
}
