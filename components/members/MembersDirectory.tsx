"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Users, ShieldCheck, CalendarDays, Trophy } from "lucide-react";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export type Member = {
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  is_team?: boolean | null;
  is_admin?: boolean | null;
  is_owner?: boolean | null;
  rating_team?: number | null;
};

type Filter = "all" | "team" | "staff";
type Sort = "newest" | "name" | "rating";

const WRAP = "mx-auto max-w-[1312px] px-6 md:px-16";
const CONTROL =
  "min-h-[44px] border border-[#8A6425] bg-[#12150E] px-3 text-sm text-[#EDEAE0] transition-colors focus:border-[#E8A63D]";

// Arabic needs a native review.
const TEXT = {
  en: {
    eyebrow: "Roster",
    title: "Members",
    count: (n: number) => `${n} ${n === 1 ? "commander" : "commanders"} enlisted`,
    search: "Search members",
    all: "All",
    team: "Team",
    staff: "Staff",
    newest: "Newest first",
    name: "Name A–Z",
    rating: "Highest rating",
    joined: "Joined",
    rated: "Team rating",
    owner: "Owner",
    admin: "Admin",
    teamBadge: "Team",
    empty: "No members yet.",
    noResults: (q: string) => `No members match “${q}”.`,
    showing: (n: number, total: number) => `Showing ${n} of ${total}`,
  },
  ar: {
    eyebrow: "قائمة الأعضاء",
    title: "الأعضاء",
    count: (n: number) => `${n} قائد مسجّل`,
    search: "ابحث عن عضو",
    all: "الكل",
    team: "الفريق",
    staff: "الإدارة",
    newest: "الأحدث أولاً",
    name: "الاسم (أ–ي)",
    rating: "الأعلى تقييماً",
    joined: "انضم",
    rated: "تقييم الفرق",
    owner: "المالك",
    admin: "مشرف",
    teamBadge: "الفريق",
    empty: "لا يوجد أعضاء بعد.",
    noResults: (q: string) => `لا يوجد أعضاء يطابقون «${q}».`,
    showing: (n: number, total: number) => `عرض ${n} من ${total}`,
  },
};

const MEMBERS_CSS = `
@keyframes czm-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
.czm-card { animation: czm-in 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czm-card .czm-corner { opacity: 0; transition: opacity 0.25s ease; }
.czm-card:hover .czm-corner, .czm-card:focus-visible .czm-corner { opacity: 1; }
.czm-card .czm-avatar { transition: transform 0.3s ease, box-shadow 0.3s ease; }
.czm-card:hover .czm-avatar { transform: scale(1.06); box-shadow: 0 0 0 3px rgba(232,166,61,0.25), 0 0 28px rgba(232,166,61,0.25); }
.czm-card { transition: transform 0.25s ease, border-color 0.25s ease, background-color 0.25s ease; }
.czm-card:hover { transform: translateY(-4px); }
@media (prefers-reduced-motion: reduce) {
  .czm-card { animation: none !important; transition: none !important; }
  .czm-card:hover { transform: none !important; }
  .czm-card .czm-avatar { transition: none !important; }
  .czm-card:hover .czm-avatar { transform: none !important; }
}
`;

const CORNERS = [
  "top-2 left-2 border-t border-l",
  "top-2 right-2 border-t border-r",
  "bottom-2 left-2 border-b border-l",
  "bottom-2 right-2 border-b border-r",
];

export default function MembersDirectory({ members }: { members: Member[] }) {
  const { locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");

  const counts = useMemo(
    () => ({
      all: members.length,
      team: members.filter((m) => m.is_team).length,
      staff: members.filter((m) => m.is_admin || m.is_owner).length,
    }),
    [members]
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = members.filter((m) => {
      if (filter === "team" && !m.is_team) return false;
      if (filter === "staff" && !(m.is_admin || m.is_owner)) return false;
      if (!q) return true;
      return m.username.toLowerCase().includes(q) || (m.bio ?? "").toLowerCase().includes(q);
    });
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.username.localeCompare(b.username);
      if (sort === "rating") return (b.rating_team ?? 1000) - (a.rating_team ?? 1000) || a.username.localeCompare(b.username);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [members, query, filter, sort]);

  function joined(iso: string) {
    return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", year: "numeric" });
  }

  return (
    <main className="min-h-screen w-full pb-24" style={{ background: C.void, color: C.paper }}>
      <style>{MEMBERS_CSS}</style>

      {/* Page header */}
      <header className="border-b" style={{ borderColor: C.line }}>
        <div className={`${WRAP} flex flex-wrap items-end justify-between gap-6 pb-10 pt-14 md:pt-20`}>
          <div>
            <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>
              <Users size={14} aria-hidden="true" />
              {tx.eyebrow}
            </div>
            <h1 className="cz-display mt-3 text-5xl uppercase leading-none md:text-7xl" style={{ fontWeight: 700 }}>
              {tx.title}
            </h1>
            <p className="mt-4 text-base" style={{ color: C.muted }}>
              {tx.count(members.length)}
            </p>
          </div>
        </div>
      </header>

      <div className={WRAP}>
        {/* Toolbar */}
        <div className="sticky top-0 z-10 -mx-2 mt-8 flex flex-wrap items-center gap-3 px-2 py-3" style={{ background: "rgba(10,12,8,0.92)", backdropFilter: "blur(6px)" }}>
          <label className="relative flex-[1_1_240px]">
            <span className="sr-only">{tx.search}</span>
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 -translate-y-1/2"
              style={{ insetInlineStart: 12, color: C.muted }}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tx.search}
              className={`${CONTROL} w-full ps-9`}
            />
          </label>

          <div className="flex gap-2" role="group" aria-label={tx.title}>
            {(["all", "team", "staff"] as const).map((f) => (
              <button
                key={f}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className="inline-flex min-h-[44px] items-center gap-2 border px-3 text-xs uppercase tracking-widest transition-colors"
                style={{
                  background: filter === f ? C.amber : "transparent",
                  color: filter === f ? C.void : C.paper,
                  borderColor: filter === f ? C.amber : C.amberDim,
                  fontWeight: filter === f ? 700 : 500,
                }}
              >
                {tx[f]}
                <span className="tabular-nums" style={{ opacity: 0.7 }}>
                  {counts[f]}
                </span>
              </button>
            ))}
          </div>

          <label>
            <span className="sr-only">{tx.newest}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={CONTROL}>
              <option value="newest">{tx.newest}</option>
              <option value="name">{tx.name}</option>
              <option value="rating">{tx.rating}</option>
            </select>
          </label>
        </div>

        {(query || filter !== "all") && members.length > 0 && (
          <p className="mt-2 text-sm" style={{ color: C.muted }} aria-live="polite">
            {tx.showing(shown.length, members.length)}
          </p>
        )}

        {/* Grid */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((m, i) => {
            const badge = m.is_owner
              ? { label: tx.owner, color: C.amber, filled: true }
              : m.is_admin
                ? { label: tx.admin, color: C.amber, filled: false }
                : m.is_team
                  ? { label: tx.teamBadge, color: C.radar, filled: false }
                  : null;
            return (
              <Link
                key={m.username}
                href={`/profile/${m.username}`}
                className="czm-card group relative flex flex-col border p-5 hover:border-[#8A6425] hover:bg-[#171B10]"
                style={{ background: C.panel, borderColor: C.line, animationDelay: `${Math.min(i, 16) * 0.04}s` }}
              >
                {CORNERS.map((pos) => (
                  <span key={pos} aria-hidden="true" className={`czm-corner pointer-events-none absolute h-3 w-3 ${pos}`} style={{ borderColor: C.amber }} />
                ))}

                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.avatar_url || "/default-avatar.svg"}
                    alt=""
                    className="czm-avatar h-16 w-16 shrink-0 rounded-full object-cover"
                    style={{ border: `2px solid ${badge ? badge.color : C.lineStrong}` }}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-lg" style={{ color: C.paper, fontWeight: 600 }}>
                      {m.username}
                    </div>
                    {badge && (
                      <span
                        className="mt-1 inline-flex items-center gap-1 px-1.5 py-px text-[10px] uppercase tracking-widest"
                        style={{
                          color: badge.filled ? C.void : badge.color,
                          background: badge.filled ? badge.color : "transparent",
                          border: `1px solid ${badge.color}`,
                          fontWeight: 700,
                        }}
                      >
                        {(m.is_owner || m.is_admin) && <ShieldCheck size={10} aria-hidden="true" />}
                        {badge.label}
                      </span>
                    )}
                  </div>
                </div>

                <p
                  className="mt-4 flex-1 text-sm leading-relaxed"
                  style={{
                    color: m.bio ? C.muted : C.lineStrong,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    minHeight: "2.9em",
                  }}
                >
                  {m.bio || "—"}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3 text-xs" style={{ borderColor: C.line, color: C.muted }}>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={13} aria-hidden="true" />
                    {tx.joined} {joined(m.created_at)}
                  </span>
                  {typeof m.rating_team === "number" && (
                    <span className="inline-flex items-center gap-1.5 tabular-nums" title={tx.rated} style={{ color: C.amber }}>
                      <Trophy size={13} aria-hidden="true" />
                      {Math.round(m.rating_team)}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </section>

        {members.length === 0 && (
          <p className="mt-6 border px-4 py-12 text-center text-sm" style={{ borderColor: C.line, background: C.panel, color: C.muted }}>
            {tx.empty}
          </p>
        )}
        {members.length > 0 && shown.length === 0 && (
          <p className="mt-6 border px-4 py-12 text-center text-sm" style={{ borderColor: C.line, background: C.panel, color: C.muted }}>
            {tx.noResults(query.trim())}
          </p>
        )}
      </div>
    </main>
  );
}
