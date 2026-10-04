"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search, Flame, Medal, Swords, Download, Flag, Trash2, Plus, Check, X, ChevronLeft, ChevronRight, Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import "@/app/leaderboard.css";
import TankSpinner from "@/components/TankSpinner";
import { logAdminAction } from "@/lib/auditLog";
import { useFeedback } from "@/components/FeedbackProvider";
import { restoreMatchFromTrash } from "@/lib/matchTrash";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Match = {
  id: string;
  mode: "2v2" | "3v3" | "4v4" | "ffa";
  participants: string[];
  winners: string[];
  notes: string | null;
  tournament_name: string | null;
  round: string | null;
  rating_changes: Record<string, number> | null;
  replay_url: string | null;
  map: string | null;
  created_at: string;
};

type StatRow = {
  username: string;
  wins: number;
  losses: number;
  avatar_url: string | null;
  rating: number;
  streak: number;
};

type SortKey = "wins" | "winrate" | "rating" | "matches";
type DateRange = "all" | "week" | "month";

// Same width as the homepage sections.
const WRAP = "mx-auto max-w-[1312px] px-6 md:px-16";
const WIN_TEXT = C.radar;
const LOSS_TEXT = "#F87171"; // readable red on the dark panels
const DANGER = "#DC2626";
const PODIUM = [C.amber, "#C9CCC0", "#B87333"]; // gold, silver, bronze
const MIN_MATCHES_FOR_RANK = 3;

// Everything players see, in both languages. Arabic needs a native review.
const TEXT = {
  en: {
    eyebrow: "Ranked ladder",
    title: "Leaderboard",
    sub: (n: number) => `Ratings update after every match. Play ${n} matches to earn an official rank.`,
    team: "Team",
    ffa: "FFA",
    allSizes: "All sizes",
    search: "Search player",
    all: "All time",
    month: "This month",
    week: "This week",
    sortRating: "Sort by rating",
    sortWins: "Sort by wins",
    sortWinrate: "Sort by win rate",
    sortMatches: "Sort by matches played",
    player: "Player",
    rating: "Rating",
    w: "W",
    l: "L",
    winRate: "Win %",
    loading: "Loading leaderboard…",
    emptyRanked: (n: number) => `No players have reached ${n} matches yet in this view.`,
    provisional: "Provisional",
    provisionalHint: (n: number) => `Needs ${n} matches to hold an official rank`,
    recent: "Recent matches",
    emptyMatches: "No matches logged yet in this view.",
    winners: "Winners",
    losers: "Losers",
    replay: "Download replay",
    addReplay: "Replay",
    addReplayTitle: "Add a replay",
    report: "Report this match",
    del: "Delete match",
    prev: "Previous",
    next: "Next",
    veteran: "Veteran",
    active: "Active",
    streak: (n: number) => `${n}-win streak`,
    played: (n: number) => `${n} matches played`,
    replayLink: "Replay link",
    chooseFile: "Choose file",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    noMap: "Unknown map",
    loginToReport: "Please log in to report a match.",
    reportTitle: "Report this match",
    reportMessage: "Tell the admins what's wrong with this result so they can review it.",
    reportPlaceholder: "e.g. wrong winner, suspected cheating",
    reportSend: "Send report",
    reportFail: "Couldn't submit the report:",
    reportOk: "Report submitted. An admin will review this match.",
  },
  ar: {
    eyebrow: "التصنيف التنافسي",
    title: "لوحة الصدارة",
    sub: (n: number) => `يتحدّث التقييم بعد كل مباراة. العب ${n} مباريات لتحصل على ترتيب رسمي.`,
    team: "الفرق",
    ffa: "FFA",
    allSizes: "كل الأحجام",
    search: "ابحث عن لاعب",
    all: "كل الأوقات",
    month: "هذا الشهر",
    week: "هذا الأسبوع",
    sortRating: "ترتيب حسب التقييم",
    sortWins: "حسب الانتصارات",
    sortWinrate: "حسب نسبة الفوز",
    sortMatches: "حسب عدد المباريات",
    player: "اللاعب",
    rating: "التقييم",
    w: "ف",
    l: "خ",
    winRate: "نسبة الفوز",
    loading: "جارٍ تحميل لوحة الصدارة…",
    emptyRanked: (n: number) => `لم يصل أي لاعب إلى ${n} مباريات بعد في هذا العرض.`,
    provisional: "ترتيب مؤقت",
    provisionalHint: (n: number) => `يحتاج ${n} مباريات للحصول على ترتيب رسمي`,
    recent: "آخر المباريات",
    emptyMatches: "لا توجد مباريات مسجّلة بعد في هذا العرض.",
    winners: "الفائزون",
    losers: "الخاسرون",
    replay: "تحميل الإعادة",
    addReplay: "إعادة",
    addReplayTitle: "إضافة إعادة",
    report: "الإبلاغ عن المباراة",
    del: "حذف المباراة",
    prev: "السابق",
    next: "التالي",
    veteran: "مخضرم",
    active: "نشط",
    streak: (n: number) => `سلسلة من ${n} انتصارات`,
    played: (n: number) => `${n} مباراة`,
    replayLink: "رابط الإعادة",
    chooseFile: "اختر ملفاً",
    save: "حفظ",
    saving: "جارٍ الحفظ…",
    cancel: "إلغاء",
    noMap: "خريطة غير معروفة",
    loginToReport: "سجّل الدخول للإبلاغ عن مباراة.",
    reportTitle: "الإبلاغ عن هذه المباراة",
    reportMessage: "أخبر المشرفين بالخطأ في هذه النتيجة لكي يراجعوها.",
    reportPlaceholder: "مثال: فائز خاطئ، اشتباه غش",
    reportSend: "إرسال البلاغ",
    reportFail: "تعذّر إرسال البلاغ:",
    reportOk: "تم إرسال البلاغ. سيراجع أحد المشرفين هذه المباراة.",
  },
};

const CONTROL =
  "min-h-[44px] border border-[#8A6425] bg-[#12150E] px-3 text-sm text-[#EDEAE0] transition-colors focus:border-[#E8A63D]";

function Avatar({ src, size, ring }: { src: string | null | undefined; size: number; ring?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || "/default-avatar.svg"}
      alt=""
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size, border: ring ? `2px solid ${ring}` : `1px solid ${C.line}` }}
    />
  );
}

export default function LeaderboardPage() {
  const supabase = createClient();
  const fb = useFeedback();
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];

  const [view, setView] = useState<"team" | "ffa">("team");
  const [teamSizeFilter, setTeamSizeFilter] = useState<"all" | "2v2" | "3v3" | "4v4">("all");
  const [matches, setMatches] = useState<Match[]>([]);
  const [profiles, setProfiles] = useState<
    Record<string, { avatar_url: string | null; rating_team: number; rating_ffa: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUsername, setAdminUsername] = useState<string>("unknown");

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [matchesPage, setMatchesPage] = useState(1);
  const MATCHES_PAGE_SIZE = 10;

  const [editingReplayId, setEditingReplayId] = useState<string | null>(null);
  const [editReplayLink, setEditReplayLink] = useState("");
  const [editReplayFile, setEditReplayFile] = useState<File | null>(null);
  const [savingReplay, setSavingReplay] = useState(false);

  async function loadData() {
    setLoading(true);
    const { data: matchData } = await supabase
      .from("matches")
      .select("*")
      .order("created_at", { ascending: false });
    setMatches(matchData ?? []);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("username, avatar_url, rating_team, rating_ffa");
    const profileMap: Record<
      string,
      { avatar_url: string | null; rating_team: number; rating_ffa: number }
    > = {};
    for (const p of profileData ?? []) {
      profileMap[p.username] = {
        avatar_url: p.avatar_url,
        rating_team: p.rating_team ?? 1000,
        rating_ffa: p.rating_ffa ?? 1000,
      };
    }

    const { data: guestData } = await supabase.from("guest_ratings").select("name, rating_team, rating_ffa");
    for (const g of guestData ?? []) {
      profileMap[g.name] = {
        avatar_url: null,
        rating_team: g.rating_team ?? 1000,
        rating_ffa: g.rating_ffa ?? 1000,
      };
    }

    setProfiles(profileMap);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("is_admin, username")
        .eq("id", user.id)
        .single();
      setIsAdmin(!!myProfile?.is_admin);
      setAdminUsername(myProfile?.username ?? "unknown");
    } else {
      setIsAdmin(false);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDeleteMatch(id: string) {
    const confirmed = await fb.confirm({
      title: "Delete this match?",
      message:
        "Its rating changes will be reversed. You'll get an Undo button right after, and it stays recoverable from Admin → Deleted matches.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!confirmed) return;

    const matchToDelete = matches.find((m) => m.id === id);

    // Delete first, so a failure here can't leave ratings reversed for a
    // match that still exists.
    const { error: deleteError } = await supabase.from("matches").delete().eq("id", id);
    if (deleteError) {
      fb.error(`Couldn't delete the match: ${deleteError.message}`);
      return;
    }

    if (matchToDelete?.rating_changes) {
      const column = matchToDelete.mode === "ffa" ? "rating_ffa" : "rating_team";
      const usernames = Object.keys(matchToDelete.rating_changes);

      const { data: currentProfiles } = await supabase
        .from("profiles")
        .select(`username, ${column}`)
        .in("username", usernames);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const foundInProfiles = new Set((currentProfiles ?? []).map((p: any) => p.username));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const p of (currentProfiles ?? []) as any[]) {
        const delta = matchToDelete.rating_changes[p.username] ?? 0;
        const revertedRating = (p[column] ?? 1000) - delta;
        await supabase.from("profiles").update({ [column]: revertedRating }).eq("username", p.username);
      }

      const guestUsernames = usernames.filter((u) => !foundInProfiles.has(u));
      if (guestUsernames.length > 0) {
        const { data: currentGuests } = await supabase
          .from("guest_ratings")
          .select(`name, ${column}`)
          .in("name", guestUsernames);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const g of (currentGuests ?? []) as any[]) {
          const delta = matchToDelete.rating_changes[g.name] ?? 0;
          const revertedRating = (g[column] ?? 1000) - delta;
          await supabase.from("guest_ratings").update({ [column]: revertedRating }).eq("name", g.name);
        }
      }
    }

    await logAdminAction(supabase, adminUsername, "delete_match", {
      match_id: id,
      mode: matchToDelete?.mode,
      participants: matchToDelete?.participants,
      winners: matchToDelete?.winners,
    });
    fb.toast("Match deleted.", {
      kind: "info",
      action: {
        label: "Undo",
        onClick: () => {
          void undoDeleteMatch(id);
        },
      },
    });
    loadData();
  }

  async function undoDeleteMatch(id: string) {
    const result = await restoreMatchFromTrash(supabase, { matchId: id });
    if (!result.ok) {
      fb.error(`Couldn't undo the delete: ${result.error}`);
      return;
    }
    await logAdminAction(supabase, adminUsername, "restore_match", { match_id: id, via: "undo" });
    fb.success("Match restored.");
    loadData();
  }

  async function handleReportMatch(id: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      fb.info(tx.loginToReport);
      return;
    }

    const reason = await fb.prompt({
      title: tx.reportTitle,
      message: tx.reportMessage,
      placeholder: tx.reportPlaceholder,
      multiline: true,
      confirmLabel: tx.reportSend,
    });
    if (!reason || !reason.trim()) return;

    const { error } = await supabase.from("match_reports").insert({
      match_id: id,
      reported_by: user?.id ?? null,
      reason: reason.trim(),
    });

    if (error) {
      fb.error(`${tx.reportFail} ${error.message}`);
    } else {
      fb.success(tx.reportOk);
    }
  }

  function startEditingReplay(matchId: string) {
    setEditingReplayId(matchId);
    setEditReplayLink("");
    setEditReplayFile(null);
  }

  function cancelEditingReplay() {
    setEditingReplayId(null);
    setEditReplayLink("");
    setEditReplayFile(null);
  }

  async function saveReplayForMatch(matchId: string) {
    setSavingReplay(true);

    let replayUrl: string | null = null;

    if (editReplayFile) {
      const ext = editReplayFile.name.split(".").pop() || "rep";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("replays")
        .upload(path, editReplayFile);

      if (uploadError) {
        fb.error(`Replay upload failed: ${uploadError.message}`);
        setSavingReplay(false);
        return;
      }

      const { data } = supabase.storage.from("replays").getPublicUrl(path);
      replayUrl = data.publicUrl;
    } else if (editReplayLink.trim()) {
      replayUrl = editReplayLink.trim();
    }

    if (!replayUrl) {
      fb.info("Paste a link or choose a file first.");
      setSavingReplay(false);
      return;
    }

    const { error: saveError } = await supabase.from("matches").update({ replay_url: replayUrl }).eq("id", matchId);
    setSavingReplay(false);
    if (saveError) {
      fb.error(`Couldn't save the replay: ${saveError.message}`);
      return;
    }
    fb.success("Replay added.");
    cancelEditingReplay();
    loadData();
  }

  const now = Date.now();
  const dateFiltered = matches.filter((m) => {
    if (dateRange === "all") return true;
    const ageMs = now - new Date(m.created_at).getTime();
    if (dateRange === "week") return ageMs <= 7 * 24 * 60 * 60 * 1000;
    if (dateRange === "month") return ageMs <= 30 * 24 * 60 * 60 * 1000;
    return true;
  });

  const viewFiltered = dateFiltered.filter((m) => {
    if (view === "ffa") return m.mode === "ffa";
    if (m.mode === "ffa") return false;
    if (teamSizeFilter === "all") return true;
    return m.mode === teamSizeFilter;
  });

  const filtered = viewFiltered;

  function timeAgo(dateStr: string): string {
    const diff = Math.round((new Date(dateStr).getTime() - Date.now()) / 1000);
    if (!Number.isFinite(diff)) return "";
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
    const abs = Math.abs(diff);
    if (abs < 60) return rtf.format(diff, "second");
    if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
    if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
    if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
    return new Date(dateStr).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const stats = new Map<string, StatRow>();
  function ratingFor(username: string): number {
    const p = profiles[username];
    if (!p) return 1000;
    return view === "ffa" ? p.rating_ffa : p.rating_team;
  }
  const oldestFirst = [...filtered].slice().reverse();

  for (const m of oldestFirst) {
    for (const username of m.participants) {
      const row =
        stats.get(username) ??
        ({
          username,
          wins: 0,
          losses: 0,
          avatar_url: profiles[username]?.avatar_url ?? null,
          rating: ratingFor(username),
          streak: 0,
        } as StatRow);

      const won = m.winners.includes(username);
      if (won) {
        row.wins += 1;
        row.streak = row.streak >= 0 ? row.streak + 1 : 1;
      } else {
        row.losses += 1;
        row.streak = row.streak <= 0 ? row.streak - 1 : -1;
      }
      stats.set(username, row);
    }
  }

  let ranked = Array.from(stats.values());

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    ranked = ranked.filter((p) => p.username.toLowerCase().includes(q));
  }

  ranked.sort((a, b) => {
    if (sortKey === "wins") return b.wins - a.wins || a.username.localeCompare(b.username);
    if (sortKey === "rating") return b.rating - a.rating || a.username.localeCompare(b.username);
    if (sortKey === "matches")
      return b.wins + b.losses - (a.wins + a.losses) || a.username.localeCompare(b.username);
    const aTotal = a.wins + a.losses;
    const bTotal = b.wins + b.losses;
    const aRate = aTotal > 0 ? a.wins / aTotal : 0;
    const bRate = bTotal > 0 ? b.wins / bTotal : 0;
    return bRate - aRate || a.username.localeCompare(b.username);
  });

  const qualifiedRanked = ranked.filter((p) => p.wins + p.losses >= MIN_MATCHES_FOR_RANK);
  const provisionalRanked = ranked.filter((p) => p.wins + p.losses < MIN_MATCHES_FOR_RANK);

  // Top three get a podium when we're looking at the whole ladder (not a search result).
  const showPodium = !search.trim() && qualifiedRanked.length >= 3;
  const podium = showPodium ? qualifiedRanked.slice(0, 3) : [];
  const tableRows = showPodium ? qualifiedRanked.slice(3) : qualifiedRanked;
  const tableOffset = showPodium ? 3 : 0;

  const totalMatchPages = Math.max(1, Math.ceil(filtered.length / MATCHES_PAGE_SIZE));

  function Badges({ p }: { p: StatRow }) {
    const total = p.wins + p.losses;
    return (
      <>
        {p.streak >= 3 && (
          <span
            title={tx.streak(p.streak)}
            aria-label={tx.streak(p.streak)}
            className="inline-flex shrink-0 items-center gap-1 text-xs"
            style={{ color: C.amber }}
          >
            <Flame size={14} aria-hidden="true" />
            {p.streak}
          </span>
        )}
        {total >= 30 ? (
          <span
            title={tx.played(total)}
            className="inline-flex shrink-0 items-center gap-1 border px-1.5 py-0.5 text-[11px] uppercase tracking-wider"
            style={{ color: C.amber, borderColor: C.amberDim }}
          >
            <Medal size={12} aria-hidden="true" />
            {tx.veteran}
          </span>
        ) : total >= 15 ? (
          <span
            title={tx.played(total)}
            className="inline-flex shrink-0 items-center gap-1 border px-1.5 py-0.5 text-[11px] uppercase tracking-wider"
            style={{ color: C.radar, borderColor: "rgba(143,191,79,0.45)" }}
          >
            <Swords size={12} aria-hidden="true" />
            {tx.active}
          </span>
        ) : null}
      </>
    );
  }

  const ROW_GRID = "grid grid-cols-[44px_1fr_72px] items-center gap-3 sm:grid-cols-[56px_1fr_88px_56px_56px_72px]";

  function LadderRow({ p, rank, provisional }: { p: StatRow; rank: number; provisional?: boolean }) {
    const total = p.wins + p.losses;
    const winRate = total > 0 ? Math.round((p.wins / total) * 100) : 0;
    return (
      <Link
        href={`/profile/${p.username}`}
        className={`${ROW_GRID} bg-[#12150E] px-4 py-3 transition-colors hover:bg-[#171B10]`}
      >
        <span className="cz-display text-lg tabular-nums" style={{ color: provisional ? C.muted : C.paper, fontWeight: 600 }}>
          {provisional ? (
            <span className="font-sans text-xs" title={tx.provisionalHint(MIN_MATCHES_FOR_RANK)}>
              {total}/{MIN_MATCHES_FOR_RANK}
            </span>
          ) : (
            rank
          )}
        </span>
        <span className="flex min-w-0 items-center gap-3">
          <Avatar src={p.avatar_url} size={32} />
          <span className="min-w-0">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-[15px]" style={{ color: C.paper, fontWeight: 500 }}>
                {p.username}
              </span>
              {!provisional && <Badges p={p} />}
            </span>
            <span className="mt-0.5 block text-xs tabular-nums sm:hidden" style={{ color: C.muted }}>
              {p.wins}
              {tx.w} {p.losses}
              {tx.l} · {winRate}%
            </span>
          </span>
        </span>
        <span className="text-end text-base tabular-nums" style={{ color: provisional ? C.muted : C.amber, fontWeight: 600 }}>
          {p.rating}
        </span>
        <span className="hidden text-end text-sm tabular-nums sm:block" style={{ color: WIN_TEXT }}>
          {p.wins}
        </span>
        <span className="hidden text-end text-sm tabular-nums sm:block" style={{ color: LOSS_TEXT }}>
          {p.losses}
        </span>
        <span className="hidden text-end text-sm tabular-nums sm:block" style={{ color: C.paper }}>
          {winRate}%
        </span>
      </Link>
    );
  }

  function TableHead() {
    return (
      <div className={`${ROW_GRID} px-4 py-2 text-[11px] uppercase tracking-[0.18em]`} style={{ color: C.muted }}>
        <span>#</span>
        <span>{tx.player}</span>
        <span className="text-end">{tx.rating}</span>
        <span className="hidden text-end sm:block">{tx.w}</span>
        <span className="hidden text-end sm:block">{tx.l}</span>
        <span className="hidden text-end sm:block">{tx.winRate}</span>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full pb-24" style={{ background: C.void, color: C.paper }}>
      {/* Page header */}
      <header className="border-b" style={{ borderColor: C.line }}>
        <div className={`${WRAP} pb-10 pt-14 md:pb-12 md:pt-20`}>
          <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>
            <Trophy size={14} aria-hidden="true" />
            {tx.eyebrow}
          </div>
          <h1 className="cz-display mt-3 text-5xl uppercase leading-none md:text-7xl" style={{ fontWeight: 700 }}>
            {tx.title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed" style={{ color: C.muted }}>
            {tx.sub(MIN_MATCHES_FOR_RANK)}
          </p>
        </div>
      </header>

      <div className={WRAP}>
        {/* Controls */}
        <div className="sticky top-0 z-10 -mx-2 mt-8 px-2 py-3" style={{ background: "rgba(10,12,8,0.92)", backdropFilter: "blur(6px)" }}>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            <div role="tablist" aria-label={tx.title} className="flex gap-6 border-b" style={{ borderColor: C.line }}>
              {(["team", "ffa"] as const).map((v) => (
                <button
                  key={v}
                  role="tab"
                  aria-selected={view === v}
                  onClick={() => { setView(v); setMatchesPage(1); }}
                  className="cz-display -mb-px min-h-[44px] border-b-2 px-1 text-lg uppercase tracking-wide transition-colors"
                  style={{
                    color: view === v ? C.amber : C.muted,
                    borderColor: view === v ? C.amber : "transparent",
                    fontWeight: 600,
                  }}
                >
                  {v === "team" ? tx.team : tx.ffa}
                </button>
              ))}
            </div>

            {view === "team" && (
              <div className="flex flex-wrap gap-2">
                {(["all", "2v2", "3v3", "4v4"] as const).map((size) => (
                  <button
                    key={size}
                    aria-pressed={teamSizeFilter === size}
                    onClick={() => { setTeamSizeFilter(size); setMatchesPage(1); }}
                    className="min-h-[36px] border px-3 text-xs uppercase tracking-widest transition-colors"
                    style={{
                      background: teamSizeFilter === size ? C.amber : "transparent",
                      color: teamSizeFilter === size ? C.void : C.paper,
                      borderColor: teamSizeFilter === size ? C.amber : C.amberDim,
                      fontWeight: teamSizeFilter === size ? 700 : 500,
                    }}
                  >
                    {size === "all" ? tx.allSizes : size}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <label className="relative flex-[1_1_220px]">
              <span className="sr-only">{tx.search}</span>
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 -translate-y-1/2"
                style={{ insetInlineStart: 12, color: C.muted }}
              />
              <input
                type="search"
                placeholder={tx.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${CONTROL} w-full ps-9`}
              />
            </label>
            <label>
              <span className="sr-only">{tx.all}</span>
              <select
                value={dateRange}
                onChange={(e) => { setDateRange(e.target.value as DateRange); setMatchesPage(1); }}
                className={CONTROL}
              >
                <option value="all">{tx.all}</option>
                <option value="month">{tx.month}</option>
                <option value="week">{tx.week}</option>
              </select>
            </label>
            <label>
              <span className="sr-only">{tx.sortRating}</span>
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className={CONTROL}>
                <option value="rating">{tx.sortRating}</option>
                <option value="wins">{tx.sortWins}</option>
                <option value="winrate">{tx.sortWinrate}</option>
                <option value="matches">{tx.sortMatches}</option>
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="py-24">
            <TankSpinner label={tx.loading} />
          </div>
        ) : (
          <>
            {/* Podium */}
            {showPodium && (
              <section aria-label="Top 3" className="mt-8 grid gap-4 md:grid-cols-3 md:items-end">
                {podium.map((p, i) => {
                  const total = p.wins + p.losses;
                  const winRate = total > 0 ? Math.round((p.wins / total) * 100) : 0;
                  const order = ["md:order-2", "md:order-1", "md:order-3"][i];
                  return (
                    <Link
                      key={p.username}
                      href={`/profile/${p.username}`}
                      className={`${order} group relative block border p-5 transition-colors hover:bg-[#171B10] ${i === 0 ? "md:pb-9 md:pt-8" : ""}`}
                      style={{ background: C.panel, borderColor: i === 0 ? C.amberDim : C.line, borderTop: `3px solid ${PODIUM[i]}` }}
                    >
                      <div className="flex items-center gap-4">
                        <span className="cz-display text-5xl leading-none" style={{ color: PODIUM[i], fontWeight: 700 }}>
                          {i + 1}
                        </span>
                        <Avatar src={p.avatar_url} size={i === 0 ? 56 : 48} ring={PODIUM[i]} />
                        <div className="min-w-0">
                          <div className="truncate text-lg" style={{ color: C.paper, fontWeight: 600 }}>
                            {p.username}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badges p={p} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 flex items-end justify-between gap-4 border-t pt-4" style={{ borderColor: C.line }}>
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>
                            {tx.rating}
                          </div>
                          <div className="cz-display text-3xl leading-none tabular-nums" style={{ color: C.amber, fontWeight: 700 }}>
                            {p.rating}
                          </div>
                        </div>
                        <div className="text-end text-sm tabular-nums" style={{ color: C.muted }}>
                          <span style={{ color: WIN_TEXT }}>{p.wins}{tx.w}</span>{" "}
                          <span style={{ color: LOSS_TEXT }}>{p.losses}{tx.l}</span>
                          <div style={{ color: C.paper }}>{winRate}%</div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </section>
            )}

            {/* Ladder */}
            <section className="mt-8">
              {tableRows.length > 0 && <TableHead />}
              <div className="flex flex-col gap-px border" style={{ background: C.line, borderColor: C.line }}>
                {tableRows.map((p, i) => (
                  <LadderRow key={p.username} p={p} rank={i + 1 + tableOffset} />
                ))}
              </div>
              {qualifiedRanked.length === 0 && (
                <p className="border px-4 py-10 text-center text-sm" style={{ borderColor: C.line, color: C.muted, background: C.panel }}>
                  {tx.emptyRanked(MIN_MATCHES_FOR_RANK)}
                </p>
              )}
            </section>

            {/* Provisional */}
            {provisionalRanked.length > 0 && (
              <section className="mt-12">
                <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="cz-display text-2xl uppercase" style={{ fontWeight: 600 }}>
                    {tx.provisional}
                  </h2>
                  <span className="text-sm" style={{ color: C.muted }}>
                    {tx.provisionalHint(MIN_MATCHES_FOR_RANK)}
                  </span>
                </div>
                <div className="flex flex-col gap-px border" style={{ background: C.line, borderColor: C.line }}>
                  {provisionalRanked.map((p) => (
                    <LadderRow key={p.username} p={p} rank={0} provisional />
                  ))}
                </div>
              </section>
            )}

            {/* Recent matches */}
            <section className="mt-16">
              <h2 className="cz-display mb-5 text-3xl uppercase md:text-4xl" style={{ fontWeight: 600 }}>
                {tx.recent}
              </h2>

              <div className="flex flex-col gap-3">
                {filtered.slice((matchesPage - 1) * MATCHES_PAGE_SIZE, matchesPage * MATCHES_PAGE_SIZE).map((m, idx) => {
                  const losers = m.participants.filter((p) => !m.winners.includes(p));
                  const rowNumber = (matchesPage - 1) * MATCHES_PAGE_SIZE + idx + 1;

                  const renderPlayer = (username: string, won: boolean) => (
                    <Link
                      key={username}
                      href={`/profile/${username}`}
                      className="flex min-h-[32px] items-center gap-2.5 hover:underline"
                    >
                      <Avatar src={profiles[username]?.avatar_url} size={24} />
                      <span className="min-w-0 flex-1 truncate text-sm" style={{ color: C.paper }}>
                        {username}
                      </span>
                      {m.rating_changes && username in m.rating_changes && (
                        <span
                          className="shrink-0 px-1.5 py-0.5 text-xs tabular-nums"
                          style={{
                            fontWeight: 700,
                            color: won ? WIN_TEXT : LOSS_TEXT,
                            background: won ? "rgba(143,191,79,0.12)" : "rgba(248,113,113,0.12)",
                          }}
                        >
                          {m.rating_changes[username] >= 0 ? "+" : ""}
                          {m.rating_changes[username]}
                        </span>
                      )}
                    </Link>
                  );

                  return (
                    <article key={m.id} className="border" style={{ background: C.panel, borderColor: C.line }}>
                      <header
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-2.5"
                        style={{ borderColor: C.line }}
                      >
                        <span className="text-xs tabular-nums" style={{ color: C.muted }}>
                          #{rowNumber}
                        </span>
                        <span
                          className="border px-2 py-0.5 text-[11px] uppercase tracking-widest"
                          style={{ color: C.amber, borderColor: C.amberDim }}
                        >
                          {m.mode}
                        </span>
                        <span className="min-w-0 truncate text-sm" style={{ color: C.paper }} title={m.map ?? undefined}>
                          {m.map || tx.noMap}
                        </span>
                        {m.tournament_name && (
                          <span className="text-xs" style={{ color: C.muted }}>
                            {m.tournament_name}
                            {m.round ? ` · ${m.round}` : ""}
                          </span>
                        )}
                        <span className="ms-auto flex items-center gap-1">
                          <span className="me-2 text-xs" style={{ color: C.muted }}>
                            {timeAgo(m.created_at)}
                          </span>
                          {m.replay_url ? (
                            <a
                              href={m.replay_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={tx.replay}
                              aria-label={tx.replay}
                              className="inline-flex h-9 w-9 items-center justify-center transition-colors hover:bg-[#171B10]"
                              style={{ color: C.amber }}
                            >
                              <Download size={17} aria-hidden="true" />
                            </a>
                          ) : isAdmin ? (
                            <button
                              onClick={() => startEditingReplay(m.id)}
                              title={tx.addReplayTitle}
                              className="inline-flex h-9 items-center gap-1 border border-dashed px-2 text-xs transition-colors hover:bg-[#171B10]"
                              style={{ borderColor: C.lineStrong, color: C.muted }}
                            >
                              <Plus size={14} aria-hidden="true" />
                              {tx.addReplay}
                            </button>
                          ) : null}
                          <button
                            onClick={() => handleReportMatch(m.id)}
                            title={tx.report}
                            aria-label={tx.report}
                            className="inline-flex h-9 w-9 items-center justify-center transition-colors hover:bg-[#171B10]"
                            style={{ color: C.muted }}
                          >
                            <Flag size={16} aria-hidden="true" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteMatch(m.id)}
                              title={tx.del}
                              aria-label={tx.del}
                              className="inline-flex h-9 w-9 items-center justify-center transition-colors hover:bg-[rgba(220,38,38,0.12)]"
                              style={{ color: LOSS_TEXT }}
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          )}
                        </span>
                      </header>

                      <div className="grid gap-px sm:grid-cols-2" style={{ background: C.line }}>
                        <div className="p-4" style={{ background: C.panel, borderInlineStart: `3px solid ${WIN_TEXT}` }}>
                          <div className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em]" style={{ color: WIN_TEXT }}>
                            <Check size={13} aria-hidden="true" />
                            {tx.winners}
                          </div>
                          <div className="flex flex-col gap-1">{m.winners.map((w) => renderPlayer(w, true))}</div>
                        </div>
                        <div className="p-4" style={{ background: C.panel, borderInlineStart: `3px solid ${C.lineStrong}` }}>
                          <div className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>
                            <X size={13} aria-hidden="true" />
                            {tx.losers}
                          </div>
                          <div className="flex flex-col gap-1">
                            {losers.length > 0 ? (
                              losers.map((l) => renderPlayer(l, false))
                            ) : (
                              <span className="text-sm" style={{ color: C.muted }}>
                                —
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {editingReplayId === m.id && (
                        <div className="flex flex-wrap items-center gap-2 border-t p-4" style={{ borderColor: C.line }}>
                          <label className="flex-[1_1_220px]">
                            <span className="sr-only">{tx.replayLink}</span>
                            <input
                              type="text"
                              placeholder={tx.replayLink}
                              value={editReplayLink}
                              onChange={(e) => {
                                setEditReplayLink(e.target.value);
                                if (e.target.value) setEditReplayFile(null);
                              }}
                              disabled={!!editReplayFile}
                              className={`${CONTROL} w-full disabled:opacity-50`}
                            />
                          </label>
                          <input
                            type="file"
                            id={`replay-edit-${m.id}`}
                            accept=".rep,.zip"
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              setEditReplayFile(file);
                              if (file) setEditReplayLink("");
                            }}
                            className="sr-only"
                          />
                          <label
                            htmlFor={`replay-edit-${m.id}`}
                            className="inline-flex min-h-[44px] cursor-pointer items-center border px-4 text-sm"
                            style={{ color: C.amber, borderColor: C.amberDim }}
                          >
                            {editReplayFile ? editReplayFile.name : tx.chooseFile}
                          </label>
                          <button
                            onClick={() => saveReplayForMatch(m.id)}
                            disabled={savingReplay}
                            className="min-h-[44px] px-5 text-sm uppercase tracking-widest disabled:opacity-60"
                            style={{ background: C.amber, color: C.void, fontWeight: 700 }}
                          >
                            {savingReplay ? tx.saving : tx.save}
                          </button>
                          <button
                            onClick={cancelEditingReplay}
                            className="min-h-[44px] border px-4 text-sm"
                            style={{ borderColor: C.lineStrong, color: C.muted }}
                          >
                            {tx.cancel}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}

                {filtered.length === 0 && (
                  <p className="border px-4 py-10 text-center text-sm" style={{ borderColor: C.line, color: C.muted, background: C.panel }}>
                    {tx.emptyMatches}
                  </p>
                )}
              </div>

              {filtered.length > MATCHES_PAGE_SIZE && (
                <nav aria-label={tx.recent} className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
                  {(() => {
                    const pageNumbers: (number | "...")[] = [];
                    const neighbors = 1;
                    for (let p = 1; p <= totalMatchPages; p++) {
                      if (p === 1 || p === totalMatchPages || (p >= matchesPage - neighbors && p <= matchesPage + neighbors)) {
                        pageNumbers.push(p);
                      } else if (pageNumbers[pageNumbers.length - 1] !== "...") {
                        pageNumbers.push("...");
                      }
                    }
                    const btn = "inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-1 border px-3 text-sm transition-colors";
                    return (
                      <>
                        <button
                          onClick={() => setMatchesPage((p) => Math.max(1, p - 1))}
                          disabled={matchesPage === 1}
                          className={`${btn} hover:bg-[#171B10] disabled:opacity-40 disabled:hover:bg-transparent`}
                          style={{ borderColor: C.amberDim, color: C.paper }}
                        >
                          <ChevronLeft size={16} className="rtl:-scale-x-100" aria-hidden="true" />
                          {tx.prev}
                        </button>
                        {pageNumbers.map((p, i) =>
                          p === "..." ? (
                            <span key={`ellipsis-${i}`} className="px-1 text-sm" style={{ color: C.muted }}>
                              …
                            </span>
                          ) : (
                            <button
                              key={p}
                              onClick={() => setMatchesPage(p)}
                              aria-current={p === matchesPage ? "page" : undefined}
                              className={`${btn} tabular-nums`}
                              style={{
                                background: p === matchesPage ? C.amber : "transparent",
                                color: p === matchesPage ? C.void : C.paper,
                                borderColor: p === matchesPage ? C.amber : C.amberDim,
                                fontWeight: p === matchesPage ? 700 : 400,
                              }}
                            >
                              {p}
                            </button>
                          )
                        )}
                        <button
                          onClick={() => setMatchesPage((p) => Math.min(totalMatchPages, p + 1))}
                          disabled={matchesPage === totalMatchPages}
                          className={`${btn} hover:bg-[#171B10] disabled:opacity-40 disabled:hover:bg-transparent`}
                          style={{ borderColor: C.amberDim, color: C.paper }}
                        >
                          {tx.next}
                          <ChevronRight size={16} className="rtl:-scale-x-100" aria-hidden="true" />
                        </button>
                      </>
                    );
                  })()}
                </nav>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
