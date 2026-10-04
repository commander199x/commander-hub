"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Radio, Disc3, Download, ArrowUpRight, Search, Check, Map as MapIcon, Trophy, Clock } from "lucide-react";
import { C, DISCORD_URL } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";

// Every match on the site that has a replay attached shows up here automatically.
interface Replay {
  id: string;
  mode: string;
  participants: string[];
  winners: string[];
  map: string | null;
  created_at: string;
  replay_url: string;
  tournament_name: string | null;
  round: string | null;
}

type ModeFilter = "all" | "2v2" | "3v3" | "4v4" | "ffa";
type DlState = { pct: number | null; done: boolean };

const WRAP = "mx-auto max-w-[1312px] px-6 md:px-16";
const PAGE = 1000;
const SHOW_STEP = 24;
const NEW_DAYS = 7;
const CONTROL =
  "min-h-[44px] border border-[#8A6425] bg-[#12150E] px-3 text-sm text-[#EDEAE0] transition-colors focus:border-[#E8A63D]";

// New text for this layout (existing titles still come from translations.ts). Arabic needs a native review.
const TEXT = {
  en: {
    search: "Search player or map",
    all: "All",
    newest: "Newest first",
    oldest: "Oldest first",
    newBadge: "New",
    vs: "vs",
    winners: "Won",
    unknownMap: "Unknown map",
    loadMore: "Load more",
    noResults: "No replays match your filters.",
    latest: "Latest upload",
    maps: "Maps",
    downloading: "Downloading…",
    downloaded: "Downloaded",
    showing: (n: number, t: number) => `Showing ${n} of ${t}`,
  },
  ar: {
    search: "ابحث عن لاعب أو خريطة",
    all: "الكل",
    newest: "الأحدث أولاً",
    oldest: "الأقدم أولاً",
    newBadge: "جديد",
    vs: "ضد",
    winners: "فاز",
    unknownMap: "خريطة غير معروفة",
    loadMore: "عرض المزيد",
    noResults: "لا توجد إعادات تطابق الفلاتر.",
    latest: "آخر رفع",
    maps: "الخرائط",
    downloading: "جارٍ التحميل…",
    downloaded: "تم التحميل",
    showing: (n: number, t: number) => `عرض ${n} من ${t}`,
  },
};

const REPLAYS_CSS = `
@keyframes czr-in { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes czr-wave { 0%, 100% { transform: scaleY(0.35); } 50% { transform: scaleY(1); } }
@keyframes czr-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(143,191,79,0.0); } 50% { box-shadow: 0 0 0 4px rgba(143,191,79,0.18); } }
@keyframes czr-shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
@keyframes czr-spin { to { transform: rotate(360deg); } }
@keyframes czr-pop { 0% { transform: scale(0.6); opacity: 0; } 70% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
.czr-card { animation: czr-in 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both; transition: transform 0.3s ease, border-color 0.3s ease; }
.czr-card:hover { transform: translateY(-4px); border-color: #8A6425 !important; }
.czr-card::before {
  content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity 0.3s ease;
  background: radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), rgba(232,166,61,0.13), transparent 70%);
}
.czr-card:hover::before { opacity: 1; }
.czr-bar { transform-origin: bottom; transform: scaleY(0.35); transition: transform 0.4s ease; }
.czr-card:hover .czr-bar { animation: czr-wave 0.9s ease-in-out infinite; }
.czr-disc { transition: transform 0.6s ease; }
.czr-card:hover .czr-disc { animation: czr-spin 2.4s linear infinite; }
.czr-dl .czr-dl-icon { transition: transform 0.25s ease; }
.czr-dl:hover .czr-dl-icon { transform: translateY(3px); }
.czr-new { animation: czr-glow 2s ease-in-out infinite; }
.czr-shimmer { background: linear-gradient(90deg, #12150E 0%, #1d2215 50%, #12150E 100%); background-size: 200% 100%; animation: czr-shimmer 1.4s linear infinite; }
.czr-pop { animation: czr-pop 0.35s ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .czr-card, .czr-new, .czr-shimmer, .czr-pop, .czr-card:hover .czr-bar, .czr-card:hover .czr-disc { animation: none !important; }
  .czr-card { transition: none !important; }
  .czr-card:hover { transform: none !important; }
}
`;

const BARS = [0.5, 0.8, 0.35, 0.95, 0.6, 0.75, 0.4, 0.9, 0.55, 0.7, 0.3, 0.85, 0.5, 0.65, 0.45, 0.8, 0.6, 0.38];

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Counts up from 0 to the target when it first appears. */
function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion() || value === 0) {
      setShown(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 900;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{shown.toLocaleString("en")}</>;
}

function fileNameFor(r: Replay): string {
  const ext = (r.replay_url.split("?")[0].match(/\.([a-z0-9]{2,4})$/i)?.[1] ?? "rep").toLowerCase();
  const base = `${r.map || "replay"}-${r.mode}-${r.created_at.slice(0, 10)}`.replace(/[^\w.-]+/g, "_");
  return `${base}.${ext}`;
}

export default function ReplaysView() {
  const { t, locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];

  const [replays, setReplays] = useState<Replay[]>([]);
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<ModeFilter>("all");
  const [order, setOrder] = useState<"newest" | "oldest">("newest");
  const [visible, setVisible] = useState(SHOW_STEP);
  const [downloads, setDownloads] = useState<Record<string, DlState>>({});
  const loadedOnce = useRef(false);

  useEffect(() => {
    if (loadedOnce.current) return;
    loadedOnce.current = true;
    const supabase = createClient();

    (async () => {
      const rows: Replay[] = [];
      for (let from = 0; from < 50_000; from += PAGE) {
        const { data, error } = await supabase
          .from("matches")
          .select("id, mode, participants, winners, map, created_at, replay_url, tournament_name, round")
          .not("replay_url", "is", null)
          .order("created_at", { ascending: false })
          .range(from, from + PAGE - 1);
        if (error) {
          console.warn("[replays] could not read matches:", error.message);
          break;
        }
        const page = (data ?? []) as Replay[];
        rows.push(...page.filter((r) => !!r.replay_url));
        if (page.length < PAGE) break;
      }
      setReplays(rows);
      setLoading(false);

      const names = Array.from(new Set(rows.flatMap((r) => r.participants ?? [])));
      if (names.length) {
        const { data: profs } = await supabase.from("profiles").select("username, avatar_url").in("username", names.slice(0, 1000));
        const map: Record<string, string | null> = {};
        for (const p of (profs ?? []) as { username: string; avatar_url: string | null }[]) map[p.username] = p.avatar_url;
        setAvatars(map);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = replays.filter((r) => {
      if (mode !== "all" && r.mode !== mode) return false;
      if (!q) return true;
      return (
        (r.map ?? "").toLowerCase().includes(q) ||
        (r.participants ?? []).some((p) => p.toLowerCase().includes(q)) ||
        (r.tournament_name ?? "").toLowerCase().includes(q)
      );
    });
    return order === "oldest" ? [...list].reverse() : list;
  }, [replays, query, mode, order]);

  useEffect(() => setVisible(SHOW_STEP), [query, mode, order]);

  const modeCounts = useMemo(() => {
    const c: Record<string, number> = { all: replays.length };
    for (const r of replays) c[r.mode] = (c[r.mode] ?? 0) + 1;
    return c;
  }, [replays]);
  const mapCount = useMemo(() => new Set(replays.map((r) => r.map).filter(Boolean)).size, [replays]);

  function timeAgo(iso: string) {
    const diff = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
    const abs = Math.abs(diff);
    if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
    if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
    if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
    return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  // Downloads with a live progress ring. Falls back to opening the link if the host doesn't allow it.
  async function download(r: Replay) {
    if (downloads[r.id]?.pct !== undefined && downloads[r.id]?.pct !== null && !downloads[r.id]?.done) return;
    setDownloads((d) => ({ ...d, [r.id]: { pct: 0, done: false } }));
    try {
      const res = await fetch(r.replay_url);
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const total = Number(res.headers.get("content-length")) || 0;
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        setDownloads((d) => ({ ...d, [r.id]: { pct: total ? received / total : null, done: false } }));
      }
      const blob = new Blob(chunks as BlobPart[], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileNameFor(r);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setDownloads((d) => ({ ...d, [r.id]: { pct: 1, done: true } }));
      setTimeout(() => setDownloads((d) => {
        const next = { ...d };
        delete next[r.id];
        return next;
      }), 2600);
    } catch {
      setDownloads((d) => {
        const next = { ...d };
        delete next[r.id];
        return next;
      });
      window.open(r.replay_url, "_blank", "noopener,noreferrer");
    }
  }

  function onCardMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  const latest = replays[0];
  const shownList = filtered.slice(0, visible);
  const now = Date.now();

  return (
    <main className="min-h-screen w-full cz-grid-bg pb-24" style={{ color: C.paper }}>
      <style>{REPLAYS_CSS}</style>

      {/* Header */}
      <header className="border-b" style={{ borderColor: C.line }}>
        <div className={`${WRAP} pb-10 pt-14 md:pt-20`}>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>
            <Radio size={14} className="cz-live" aria-hidden="true" />
            <span>{t("common.fieldComms")}</span>
          </div>

          <h1 className="cz-display mt-3 uppercase leading-[0.92]" style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", fontWeight: 700, letterSpacing: "0.01em" }}>
            {t("replays.titleLine1")} <span style={{ color: C.amber }}>{t("replays.titleLine2")}</span>
          </h1>

          {/* Live stats */}
          <div className="mt-8 grid max-w-3xl grid-cols-2 gap-px border sm:grid-cols-4" style={{ background: C.line, borderColor: C.line }}>
            <div className="px-5 py-4" style={{ background: C.panel }}>
              <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>
                {t("replays.recordsLabel")}
              </div>
              <div className="cz-display mt-1 text-4xl leading-none tabular-nums" style={{ color: C.amber, fontWeight: 700 }}>
                {loading ? "—" : <CountUp value={replays.length} />}
              </div>
            </div>
            <div className="px-5 py-4" style={{ background: C.panel }}>
              <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>
                {tx.maps}
              </div>
              <div className="cz-display mt-1 text-4xl leading-none tabular-nums" style={{ color: C.paper, fontWeight: 700 }}>
                {loading ? "—" : <CountUp value={mapCount} />}
              </div>
            </div>
            <div className="px-5 py-4" style={{ background: C.panel }}>
              <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>
                {t("replays.statusLabel")}
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm uppercase tracking-widest" style={{ color: replays.length > 0 ? C.radar : C.muted, fontWeight: 700 }}>
                <span className="relative inline-flex h-2 w-2">
                  {replays.length > 0 && <span className="cz-blink absolute inset-0 rounded-full" style={{ background: C.radar }} />}
                  <span className="relative inline-block h-2 w-2 rounded-full" style={{ background: replays.length > 0 ? C.radar : C.muted }} />
                </span>
                {replays.length > 0 ? t("replays.statusOnline") : t("replays.statusAwaiting")}
              </div>
            </div>
            <div className="px-5 py-4" style={{ background: C.panel }}>
              <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>
                {tx.latest}
              </div>
              <div className="mt-2 text-sm" style={{ color: C.paper }}>
                {latest ? timeAgo(latest.created_at) : "—"}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className={WRAP}>
        {/* Toolbar */}
        {(loading || replays.length > 0) && (
          <div className="sticky top-0 z-10 -mx-2 mt-8 flex flex-wrap items-center gap-3 px-2 py-3" style={{ background: "rgba(10,12,8,0.92)", backdropFilter: "blur(6px)" }}>
            <label className="relative flex-[1_1_240px]">
              <span className="sr-only">{tx.search}</span>
              <Search size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 -translate-y-1/2" style={{ insetInlineStart: 12, color: C.muted }} />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tx.search} className={`${CONTROL} w-full ps-9`} />
            </label>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Mode">
              {(["all", "2v2", "3v3", "4v4", "ffa"] as const).map((m) => {
                const n = modeCounts[m] ?? 0;
                if (m !== "all" && n === 0) return null;
                const on = mode === m;
                return (
                  <button
                    key={m}
                    aria-pressed={on}
                    onClick={() => setMode(m)}
                    className="inline-flex min-h-[44px] items-center gap-2 border px-3 text-xs uppercase tracking-widest transition-all duration-200"
                    style={{
                      background: on ? C.amber : "transparent",
                      color: on ? C.void : C.paper,
                      borderColor: on ? C.amber : C.amberDim,
                      fontWeight: on ? 700 : 500,
                      transform: on ? "translateY(-1px)" : "none",
                    }}
                  >
                    {m === "all" ? tx.all : m}
                    <span className="tabular-nums" style={{ opacity: 0.7 }}>
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>
            <label>
              <span className="sr-only">{tx.newest}</span>
              <select value={order} onChange={(e) => setOrder(e.target.value as "newest" | "oldest")} className={CONTROL}>
                <option value="newest">{tx.newest}</option>
                <option value="oldest">{tx.oldest}</option>
              </select>
            </label>
          </div>
        )}

        {(query || mode !== "all") && replays.length > 0 && (
          <p className="mt-2 text-sm" style={{ color: C.muted }} aria-live="polite">
            {tx.showing(Math.min(visible, filtered.length), filtered.length)}
          </p>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border p-5" style={{ borderColor: C.line, background: C.panel }}>
                <div className="czr-shimmer h-16" />
                <div className="czr-shimmer mt-4 h-5 w-2/3" />
                <div className="czr-shimmer mt-3 h-4 w-1/2" />
                <div className="czr-shimmer mt-6 h-10" />
              </div>
            ))}
          </div>
        )}

        {/* Empty library */}
        {!loading && replays.length === 0 && (
          <div className="mt-10 py-16 text-center" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <Disc3 size={36} className="mx-auto" style={{ color: C.lineStrong }} aria-hidden="true" />
            <h2 className="cz-display mt-5 text-2xl uppercase" style={{ fontWeight: 600 }}>
              {t("replays.noReplaysTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm" style={{ color: C.muted }}>
              {t("replays.noReplaysDesc")}
            </p>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-[44px] items-center gap-2 px-6 text-xs uppercase tracking-widest"
              style={{ background: C.amber, color: C.void, fontWeight: 700 }}
            >
              {t("replays.submitReplay")}
              <ArrowUpRight size={14} className="rtl:-scale-x-100" aria-hidden="true" />
            </a>
          </div>
        )}

        {/* No filter results */}
        {!loading && replays.length > 0 && filtered.length === 0 && (
          <p className="mt-6 border px-4 py-12 text-center text-sm" style={{ borderColor: C.line, background: C.panel, color: C.muted }}>
            {tx.noResults}
          </p>
        )}

        {/* Cards */}
        {!loading && filtered.length > 0 && (
          <section className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {shownList.map((r, i) => {
              const isNew = now - new Date(r.created_at).getTime() < NEW_DAYS * 86400000;
              const winners = r.winners ?? [];
              const losers = (r.participants ?? []).filter((p) => !winners.includes(p));
              const dl = downloads[r.id];
              const R = 10;
              const CIRC = 2 * Math.PI * R;
              return (
                <article
                  key={r.id}
                  onMouseMove={onCardMove}
                  className="czr-card relative flex flex-col overflow-hidden border"
                  style={{ background: C.panel, borderColor: C.line, animationDelay: `${Math.min(i % SHOW_STEP, 12) * 0.05}s` }}
                >
                  {/* Tape strip with waveform */}
                  <div className="relative flex h-20 items-end gap-[3px] overflow-hidden border-b px-5 pb-3 pt-4" style={{ borderColor: C.line, background: "linear-gradient(180deg, #0D100A, #12150E)" }} aria-hidden="true">
                    {BARS.map((h, b) => (
                      <span
                        key={b}
                        className="czr-bar w-[5px] flex-none"
                        style={{ height: `${h * 100}%`, background: b % 5 === 0 ? C.amber : C.amberDim, animationDelay: `${(b % 6) * 0.08}s` }}
                      />
                    ))}
                    <Disc3 size={34} className="czr-disc absolute top-1/2 -translate-y-1/2" style={{ insetInlineEnd: 18, color: C.amber, opacity: 0.85 }} />
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest">
                      <span className="border px-2 py-0.5" style={{ color: C.amber, borderColor: C.amberDim }}>
                        {r.mode}
                      </span>
                      {isNew && (
                        <span className="czr-new px-2 py-0.5" style={{ background: C.radar, color: C.void, fontWeight: 700 }}>
                          {tx.newBadge}
                        </span>
                      )}
                      <span className="ms-auto inline-flex items-center gap-1 normal-case tracking-normal" style={{ color: C.muted }}>
                        <Clock size={12} aria-hidden="true" />
                        {timeAgo(r.created_at)}
                      </span>
                    </div>

                    <h2 className="cz-display mt-4 flex items-center gap-2 text-2xl uppercase leading-tight" style={{ fontWeight: 600 }}>
                      <MapIcon size={18} className="shrink-0" style={{ color: C.muted }} aria-hidden="true" />
                      <span className="truncate">{r.map || tx.unknownMap}</span>
                    </h2>
                    {r.tournament_name && (
                      <div className="mt-1 inline-flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
                        <Trophy size={12} aria-hidden="true" />
                        {r.tournament_name}
                        {r.round ? ` · ${r.round}` : ""}
                      </div>
                    )}

                    {/* Line-up */}
                    <div className="mt-4 flex items-center gap-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 text-[10px] uppercase tracking-[0.18em]" style={{ color: C.radar }}>
                          {tx.winners}
                        </div>
                        <div className="flex flex-col gap-1">
                          {winners.slice(0, 4).map((p) => (
                            <Link key={p} href={`/profile/${p}`} className="flex min-w-0 items-center gap-2 hover:underline">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={avatars[p] || "/default-avatar.svg"} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover" />
                              <span className="truncate" style={{ color: C.paper }}>{p}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                      <span className="cz-display shrink-0 text-lg uppercase" style={{ color: C.lineStrong, fontWeight: 700 }}>
                        {tx.vs}
                      </span>
                      <div className="min-w-0 flex-1 text-end">
                        <div className="mb-1.5 h-[15px]" />
                        <div className="flex flex-col items-end gap-1">
                          {losers.slice(0, 4).map((p) => (
                            <Link key={p} href={`/profile/${p}`} className="flex min-w-0 items-center gap-2 hover:underline">
                              <span className="truncate" style={{ color: C.muted }}>{p}</span>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={avatars[p] || "/default-avatar.svg"} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover opacity-80" />
                            </Link>
                          ))}
                          {losers.length === 0 && <span style={{ color: C.muted }}>—</span>}
                        </div>
                      </div>
                    </div>

                    {/* Download */}
                    <button
                      onClick={() => download(r)}
                      className="czr-dl mt-5 flex min-h-[48px] items-center justify-between border-t pt-3 text-xs uppercase tracking-widest transition-colors hover:text-[#EDEAE0]"
                      style={{ borderColor: C.line, color: C.amber, fontWeight: 600 }}
                    >
                      <span className="flex items-center gap-2" aria-live="polite">
                        {dl?.done ? (
                          <>
                            <Check size={15} className="czr-pop" style={{ color: C.radar }} aria-hidden="true" />
                            <span style={{ color: C.radar }}>{tx.downloaded}</span>
                          </>
                        ) : dl ? (
                          <>
                            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={dl.pct === null ? { animation: "czr-spin 1s linear infinite" } : undefined}>
                              <circle cx="12" cy="12" r={R} fill="none" stroke={C.line} strokeWidth="2.5" />
                              <circle
                                cx="12" cy="12" r={R} fill="none" stroke={C.amber} strokeWidth="2.5" strokeLinecap="round"
                                strokeDasharray={CIRC}
                                strokeDashoffset={CIRC * (1 - (dl.pct ?? 0.3))}
                                transform="rotate(-90 12 12)"
                                style={{ transition: "stroke-dashoffset 0.15s linear" }}
                              />
                            </svg>
                            {tx.downloading}
                            {dl.pct !== null && <span className="tabular-nums">{Math.round(dl.pct * 100)}%</span>}
                          </>
                        ) : (
                          <>
                            <Download size={15} className="czr-dl-icon" aria-hidden="true" />
                            {t("replays.downloadReplay")}
                          </>
                        )}
                      </span>
                      <ArrowUpRight size={15} className="rtl:-scale-x-100" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {!loading && filtered.length > visible && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setVisible((v) => v + SHOW_STEP)}
              className="inline-flex min-h-[48px] items-center gap-2 border px-8 text-xs uppercase tracking-widest transition-colors hover:bg-[#E8A63D] hover:text-[#0A0C08]"
              style={{ borderColor: C.amber, color: C.amber, fontWeight: 700 }}
            >
              {tx.loadMore}
              <span className="tabular-nums" style={{ opacity: 0.7 }}>
                {filtered.length - visible}
              </span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
