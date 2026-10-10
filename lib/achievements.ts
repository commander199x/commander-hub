// Achievement definitions. The keys and English names MUST match sql/events-achievements.sql,
// which is what actually awards them (and sends the "Achievement unlocked" notification).
import type { LucideIcon } from "lucide-react";
import { Swords, Award, Medal, ShieldCheck, Star, Flame, Zap, Globe, Target, Trophy, Crown, Archive, Skull, Layers, Flag, Crosshair, Sparkles } from "lucide-react";

export type Tier = "bronze" | "silver" | "gold" | "legendary";
export type AchievementDef = { key: string; icon: LucideIcon; tier: Tier; need: number; en: [string, string]; ar: [string, string] };

export const TIER_COLORS: Record<Tier, { main: string; glow: string; en: string; ar: string }> = {
  bronze: { main: "#C1834F", glow: "rgba(193,131,79,0.35)", en: "Bronze", ar: "برونزي" },
  silver: { main: "#C9CCC0", glow: "rgba(201,204,192,0.30)", en: "Silver", ar: "فضي" },
  gold: { main: "#E8A63D", glow: "rgba(232,166,61,0.40)", en: "Gold", ar: "ذهبي" },
  legendary: { main: "#8FBF4F", glow: "rgba(143,191,79,0.45)", en: "Legendary", ar: "أسطوري" },
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "first_win", icon: Swords, tier: "bronze", need: 1, en: ["First Blood", "Win your first match"], ar: ["أول دم", "اربح أول مباراة"] },
  { key: "games30", icon: ShieldCheck, tier: "bronze", need: 30, en: ["Veteran", "Play 30 matches"], ar: ["مخضرم", "العب 30 مباراة"] },
  { key: "maps10", icon: Globe, tier: "bronze", need: 10, en: ["Globetrotter", "Play on 10 different maps"], ar: ["رحّالة", "العب على 10 خرائط مختلفة"] },
  { key: "tournament", icon: Trophy, tier: "bronze", need: 1, en: ["Tournament Contender", "Play a tournament match"], ar: ["منافس البطولات", "العب مباراة في بطولة"] },
  { key: "replay", icon: Archive, tier: "bronze", need: 1, en: ["Archivist", "Play a match that has a replay"], ar: ["أمين الأرشيف", "العب مباراة لها إعادة"] },
  { key: "wins10", icon: Award, tier: "silver", need: 10, en: ["Battle-Hardened", "Win 10 matches"], ar: ["صلب المعارك", "اربح 10 مباريات"] },
  { key: "games100", icon: Star, tier: "silver", need: 100, en: ["Centurion", "Play 100 matches"], ar: ["قائد المئة", "العب 100 مباراة"] },
  { key: "streak5", icon: Flame, tier: "silver", need: 5, en: ["Hot Streak", "Win 5 in a row"], ar: ["سلسلة نارية", "اربح 5 مباريات متتالية"] },
  { key: "mapMaster", icon: Target, tier: "silver", need: 10, en: ["Map Master", "Win 10 matches on one map"], ar: ["سيد الخريطة", "اربح 10 مباريات على خريطة واحدة"] },
  { key: "ffa_winner", icon: Skull, tier: "silver", need: 1, en: ["Last One Standing", "Win an FFA"], ar: ["آخر الصامدين", "اربح مباراة FFA"] },
  { key: "wins50", icon: Medal, tier: "gold", need: 50, en: ["War Hero", "Win 50 matches"], ar: ["بطل حرب", "اربح 50 مباراة"] },
  { key: "streak10", icon: Zap, tier: "gold", need: 10, en: ["Unstoppable", "Win 10 in a row"], ar: ["لا يُوقف", "اربح 10 مباريات متتالية"] },
  { key: "all_modes", icon: Layers, tier: "gold", need: 4, en: ["Combined Arms", "Win in 2v2, 3v3, 4v4 and FFA"], ar: ["أسلحة مشتركة", "اربح في 2v2 و3v3 و4v4 وFFA"] },
  { key: "three_factions", icon: Flag, tier: "gold", need: 3, en: ["Three Flags", "Win with USA, China and GLA"], ar: ["ثلاث رايات", "اربح بأمريكا والصين وجيش التحرير"] },
  { key: "general_master", icon: Crosshair, tier: "gold", need: 10, en: ["Signature General", "Win 10 matches with one general"], ar: ["الجنرال المميّز", "اربح 10 مباريات بجنرال واحد"] },
  { key: "top3", icon: Crown, tier: "legendary", need: 1, en: ["High Command", "Reach the Team top 3"], ar: ["القيادة العليا", "ادخل أفضل 3 في تصنيف الفرق"] },
  { key: "champion", icon: Trophy, tier: "legendary", need: 1, en: ["Champion", "Win a tournament final"], ar: ["البطل", "اربح نهائي بطولة"] },
  { key: "all_generals", icon: Sparkles, tier: "legendary", need: 12, en: ["Twelve Commands", "Play all 12 generals"], ar: ["الأوامر الاثنا عشر", "العب بكل الجنرالات الـ 12"] },
];

export type ProgressMatch = { mode: string; participants: string[] | null; winners: string[] | null; map: string | null; created_at: string; tournament_name: string | null; round: string | null; replay_url: string | null; generals?: unknown };

/** How far a player is towards each achievement (same rules as the database). */
export function achievementProgress(username: string, matches: ProgressMatch[]): Record<string, number> {
  const mine = matches.filter((m) => (m.participants ?? []).includes(username)).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const won = (m: ProgressMatch) => (m.winners ?? []).includes(username);
  const wins = mine.filter(won);
  let run = 0, best = 0;
  for (const m of mine) {
    run = won(m) ? run + 1 : 0;
    best = Math.max(best, run);
  }
  const mapWins: Record<string, number> = {};
  for (const m of wins) if (m.map) mapWins[m.map] = (mapWins[m.map] ?? 0) + 1;
  const gen = (m: ProgressMatch) => {
    const g = m.generals && typeof m.generals === "object" ? (m.generals as Record<string, unknown>)[username] : undefined;
    return typeof g === "string" ? g : null;
  };
  const genWins: Record<string, number> = {};
  for (const m of wins) { const g = gen(m); if (g) genWins[g] = (genWins[g] ?? 0) + 1; }
  const isFinal = (r: string | null) => !!r && /final/i.test(r) && !/(semi|quarter|1\/2|1\/4|نصف|ربع)/i.test(r);
  return {
    first_win: wins.length,
    wins10: wins.length,
    wins50: wins.length,
    games30: mine.length,
    games100: mine.length,
    streak5: best,
    streak10: best,
    maps10: new Set(mine.map((m) => m.map).filter(Boolean)).size,
    mapMaster: Math.max(0, ...Object.values(mapWins)),
    tournament: mine.some((m) => m.tournament_name) ? 1 : 0,
    replay: mine.some((m) => m.replay_url) ? 1 : 0,
    ffa_winner: wins.filter((m) => m.mode === "ffa").length,
    all_modes: new Set(wins.map((m) => m.mode)).size,
    champion: wins.some((m) => m.tournament_name && isFinal(m.round)) ? 1 : 0,
    three_factions: new Set(wins.map(gen).filter(Boolean).map((g) => (g as string).split("_")[0])).size,
    general_master: Math.max(0, ...Object.values(genWins)),
    all_generals: new Set(mine.map(gen).filter(Boolean)).size,
    top3: 0,
  };
}
