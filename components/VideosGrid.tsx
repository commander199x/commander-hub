"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type JSX } from "react";
import { Play, ArrowUpRight, Crosshair, X, Search } from "lucide-react";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export type Platform = "YouTube" | "TikTok";

export interface Video {
  title: string;
  platform: Platform;
  description: string;
  category?: string;
  thumbnail: string | null;
  link: string;
}

const PLATFORM_ICON: Record<Platform, JSX.Element> = {
  YouTube: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.5V8.5l6.3 3.5-6.3 3.5Z" />
    </svg>
  ),
  TikTok: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 2h-3.2v14.1a3.1 3.1 0 1 1-2.6-3.06V9.8a6.3 6.3 0 1 0 5.8 6.28V8.3a8.2 8.2 0 0 0 4.8 1.55V6.7a5 5 0 0 1-4.8-4.7Z" />
    </svg>
  ),
};

// Arabic needs a native review.
const TEXT = {
  en: {
    search: "Search videos",
    clear: "Clear search",
    featured: "Latest transmission",
    play: "Play",
    watch: "Watch transmission",
    openOn: (p: string) => `Open on ${p}`,
    close: "Close video",
    fieldClip: "Field clip",
    noFeed: "No feed capture",
  },
  ar: {
    search: "ابحث عن فيديو",
    clear: "مسح البحث",
    featured: "أحدث بث",
    play: "تشغيل",
    watch: "شاهد البث",
    openOn: (p: string) => `افتح على ${p}`,
    close: "إغلاق الفيديو",
    fieldClip: "مقطع ميداني",
    noFeed: "لا توجد صورة",
  },
};

const CSS = `
@keyframes czv-in { from { opacity: 0; transform: translateY(18px) scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes czv-scan { from { transform: translateY(-100%); } to { transform: translateY(260%); } }
@keyframes czv-pulse { 0% { box-shadow: 0 0 0 0 rgba(232,166,61,0.55); } 100% { box-shadow: 0 0 0 22px rgba(232,166,61,0); } }
@keyframes czv-modal { from { opacity: 0; transform: scale(0.94) translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes czv-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes czv-grad { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
.czv-card { animation: czv-in 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) both; transform: perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)); transition: transform 0.2s ease-out, border-color 0.3s ease; transform-style: preserve-3d; }
.czv-card:hover { border-color: #8A6425 !important; }
.czv-card::before { content: ""; position: absolute; inset: 0; z-index: 15; pointer-events: none; opacity: 0; transition: opacity 0.3s ease;
  background: radial-gradient(280px circle at var(--mx, 50%) var(--my, 50%), rgba(232,166,61,0.14), transparent 70%); }
.czv-card:hover::before { opacity: 1; }
.czv-thumb { filter: grayscale(0.4) contrast(1.05); transition: transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1), filter 0.5s ease; }
.czv-card:hover .czv-thumb, .czv-feature:hover .czv-thumb { filter: none; transform: scale(1.07); }
.czv-scanline { position: absolute; left: 0; right: 0; top: 0; height: 40%; pointer-events: none; opacity: 0;
  background: linear-gradient(180deg, transparent, rgba(232,166,61,0.18), transparent); }
.czv-card:hover .czv-scanline { opacity: 1; animation: czv-scan 1.5s linear infinite; }
.czv-playbtn { transition: transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1); }
.czv-card:hover .czv-playbtn, .czv-feature:hover .czv-playbtn { transform: scale(1.12); }
.czv-pulse { animation: czv-pulse 1.8s ease-out infinite; }
.czv-modal { animation: czv-modal 0.3s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czv-backdrop { animation: czv-fade 0.25s ease both; }
.czv-indicator { transition: left 0.35s cubic-bezier(0.2, 0.7, 0.2, 1), width 0.35s cubic-bezier(0.2, 0.7, 0.2, 1); }
.czv-nofeed { background: linear-gradient(110deg, #0D100A, #1d2215, #0D100A, #1d2215); background-size: 200% 100%; animation: czv-grad 6s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .czv-card, .czv-pulse, .czv-modal, .czv-backdrop, .czv-nofeed, .czv-card:hover .czv-scanline { animation: none !important; }
  .czv-card { transform: none !important; transition: none !important; }
  .czv-thumb, .czv-playbtn, .czv-indicator { transition: none !important; }
  .czv-card:hover .czv-thumb, .czv-feature:hover .czv-thumb, .czv-card:hover .czv-playbtn { transform: none !important; }
}
`;

function youtubeId(link: string): string | null {
  const m = link.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([\w-]{11})/);
  return m ? m[1] : null;
}
const embedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;

function reducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

// 3D tilt + spotlight that follow the mouse
function onTilt(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width;
  const py = (e.clientY - r.top) / r.height;
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
  if (reducedMotion()) return;
  el.style.setProperty("--ry", `${(px - 0.5) * 8}deg`);
  el.style.setProperty("--rx", `${(0.5 - py) * 6}deg`);
}
function offTilt(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.style.setProperty("--rx", "0deg");
  e.currentTarget.style.setProperty("--ry", "0deg");
}

const BRACKETS = [
  "top-2 start-2 border-t border-s",
  "top-2 end-2 border-t border-e",
  "bottom-2 start-2 border-b border-s",
  "bottom-2 end-2 border-b border-e",
];

export default function VideosGrid({ videos }: { videos: Video[] }) {
  const { t, locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];

  const platforms: Array<Platform | "All"> = ["All", ...Array.from(new Set(videos.map((v) => v.platform)))];
  const [filter, setFilter] = useState<Platform | "All">("All");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<Video | null>(null);
  const [featurePlaying, setFeaturePlaying] = useState(false);

  // sliding filter indicator
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [ind, setInd] = useState({ left: 0, width: 0 });
  useLayoutEffect(() => {
    const measure = () => {
      const el = btnRefs.current[filter];
      if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [filter, lang]);

  // Esc closes the player
  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setModal(null);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [modal]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: videos.length };
    for (const v of videos) c[v.platform] = (c[v.platform] ?? 0) + 1;
    return c;
  }, [videos]);

  const q = query.trim().toLowerCase();
  const shown = videos.filter(
    (v) =>
      (filter === "All" || v.platform === filter) &&
      (!q || v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q) || (v.category ?? "").toLowerCase().includes(q))
  );

  // Big featured player: newest YouTube video, only on the unfiltered view
  const featured = !q && filter !== "TikTok" ? shown.find((v) => v.platform === "YouTube" && youtubeId(v.link)) ?? null : null;
  const featuredId = featured ? youtubeId(featured.link) : null;
  const rest = featured ? shown.filter((v) => v !== featured) : shown;

  function openVideo(v: Video, e: React.MouseEvent) {
    // YouTube plays in an on-page player; TikTok opens in a new tab
    if (v.platform === "YouTube" && youtubeId(v.link) && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      setModal(v);
    }
  }

  return (
    <>
      <style>{CSS}</style>

      {/* Toolbar */}
      <div className="sticky top-0 z-20 -mx-2 mt-8 flex flex-wrap items-center gap-4 px-2 py-3" style={{ background: "rgba(10,12,8,0.92)", backdropFilter: "blur(6px)" }}>
        <div className="relative flex border" style={{ borderColor: C.amberDim }} role="group">
          <span aria-hidden="true" className="czv-indicator absolute inset-y-0" style={{ left: ind.left, width: ind.width, background: C.amber }} />
          {platforms.map((p) => {
            const active = filter === p;
            return (
              <button
                key={p}
                ref={(el) => {
                  btnRefs.current[p] = el;
                }}
                aria-pressed={active}
                onClick={() => {
                  setFilter(p);
                  setFeaturePlaying(false);
                }}
                className="relative z-10 inline-flex min-h-[44px] items-center gap-2 px-4 text-xs uppercase tracking-widest transition-colors duration-300"
                style={{ color: active ? C.void : C.paper, fontWeight: active ? 700 : 500 }}
              >
                {p !== "All" && PLATFORM_ICON[p]}
                {p === "All" ? t("videos.all") : p}
                <span className="tabular-nums" style={{ opacity: 0.65 }}>{counts[p] ?? 0}</span>
              </button>
            );
          })}
        </div>
        <label className="relative flex-[1_1_220px]">
          <span className="sr-only">{tx.search}</span>
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 -translate-y-1/2" style={{ insetInlineStart: 12, color: C.muted }} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tx.search}
            className="min-h-[44px] w-full border border-[#8A6425] bg-[#12150E] pe-10 ps-9 text-sm text-[#EDEAE0] transition-colors focus:border-[#E8A63D]"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label={tx.clear} className="absolute top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center" style={{ insetInlineEnd: 6, color: C.muted }}>
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </label>
      </div>

      {/* Featured player */}
      {featured && featuredId && (
        <section className="czv-feature group mt-6 grid overflow-hidden border lg:grid-cols-[1.6fr_1fr]" style={{ borderColor: C.amberDim, background: C.panel }}>
          <div className="relative overflow-hidden" style={{ aspectRatio: "16 / 9", background: "#000" }}>
            {featurePlaying ? (
              <iframe
                src={embedUrl(featuredId)}
                title={featured.title}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <button onClick={() => setFeaturePlaying(true)} className="absolute inset-0 block h-full w-full" aria-label={`${tx.play}: ${featured.title}`}>
                {featured.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={featured.thumbnail} alt="" className="czv-thumb h-full w-full object-cover" />
                )}
                <span className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(10,12,8,0.75), rgba(10,12,8,0.05) 60%)" }} />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="czv-playbtn czv-pulse flex h-20 w-20 items-center justify-center rounded-full" style={{ background: C.amber }}>
                    <Play size={30} color={C.void} fill={C.void} aria-hidden="true" />
                  </span>
                </span>
              </button>
            )}
          </div>
          <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>
              <span className="relative inline-flex h-2 w-2">
                <span className="cz-blink absolute inset-0 rounded-full" style={{ background: C.radar }} />
                <span className="relative inline-block h-2 w-2 rounded-full" style={{ background: C.radar }} />
              </span>
              {tx.featured}
            </div>
            <h2 className="cz-display text-3xl uppercase leading-tight md:text-4xl" style={{ fontWeight: 600 }} dir="auto">
              {featured.title}
            </h2>
            {featured.description && <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{featured.description}</p>}
            <div className="flex flex-wrap gap-3">
              {!featurePlaying && (
                <button
                  onClick={() => setFeaturePlaying(true)}
                  className="inline-flex min-h-[44px] items-center gap-2 px-5 text-xs uppercase tracking-widest"
                  style={{ background: C.amber, color: C.void, fontWeight: 700 }}
                >
                  <Play size={14} fill="currentColor" aria-hidden="true" />
                  {tx.play}
                </button>
              )}
              <a
                href={featured.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 border px-5 text-xs uppercase tracking-widest transition-colors hover:bg-[#171B10]"
                style={{ borderColor: C.amberDim, color: C.paper }}
              >
                {PLATFORM_ICON.YouTube}
                {tx.openOn("YouTube")}
                <ArrowUpRight size={14} className="rtl:-scale-x-100" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      )}

      {shown.length === 0 ? (
        <p className="mt-8 border px-4 py-12 text-center text-sm" style={{ borderColor: C.line, background: C.panel, color: C.muted }}>
          {t("videos.noVideos")}
        </p>
      ) : (
        <section key={`${filter}-${q}`} className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3" style={{ perspective: "1200px" }}>
          {rest.map((video, i) => (
            <a
              key={video.link}
              href={video.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => openVideo(video, e)}
              onMouseMove={onTilt}
              onMouseLeave={offTilt}
              className="czv-card group relative block border"
              style={{ background: C.panel, borderColor: C.line, animationDelay: `${Math.min(i, 12) * 0.05}s` }}
            >
              {BRACKETS.map((pos) => (
                <span key={pos} aria-hidden="true" className={`pointer-events-none absolute z-20 h-3 w-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${pos}`} style={{ borderColor: C.amber }} />
              ))}

              <div className="flex items-center justify-between border-b px-4 py-2.5 text-[11px] uppercase tracking-widest" style={{ borderColor: C.line, color: C.muted }}>
                <span className="flex items-center gap-1.5" style={{ color: video.platform === "YouTube" ? C.paper : C.radar }}>
                  {PLATFORM_ICON[video.platform]}
                  {video.platform}
                </span>
                <span className="tabular-nums">Log {String(i + (featured ? 2 : 1)).padStart(2, "0")}</span>
              </div>

              <div className="relative overflow-hidden" style={{ aspectRatio: "16 / 9", background: "#000" }}>
                {video.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={video.thumbnail} alt="" loading="lazy" className="czv-thumb h-full w-full object-cover" />
                ) : (
                  <div className="czv-nofeed flex h-full w-full flex-col items-center justify-center gap-2" style={{ color: C.lineStrong }}>
                    <Crosshair size={28} aria-hidden="true" />
                    <span className="text-[11px] uppercase tracking-widest">{tx.noFeed}</span>
                  </div>
                )}
                <span className="czv-scanline" aria-hidden="true" />
                <span className="absolute inset-0 flex items-center justify-center" style={{ background: "linear-gradient(0deg, rgba(10,12,8,0.55), rgba(10,12,8,0) 55%)" }}>
                  <span className="czv-playbtn flex h-12 w-12 items-center justify-center rounded-full opacity-90 group-hover:opacity-100" style={{ background: C.amber, boxShadow: "0 0 24px rgba(232,166,61,0.45)" }}>
                    <Play size={18} color={C.void} fill={C.void} aria-hidden="true" />
                  </span>
                </span>
              </div>

              <div className="p-4">
                <span className="mb-3 inline-block border px-2 py-1 text-[10px] uppercase tracking-widest" style={{ borderColor: C.lineStrong, color: C.radar }}>
                  {video.category ?? tx.fieldClip}
                </span>
                <h3 className="text-base leading-snug" style={{ color: C.paper, fontWeight: 600, minHeight: "2.8em" }} dir="auto">
                  {video.title}
                </h3>
                {video.description && (
                  <p className="mt-2 text-sm" style={{ color: C.muted, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {video.description}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs uppercase tracking-widest" style={{ borderColor: C.line, color: C.amber, fontWeight: 600 }}>
                  <span>{tx.watch}</span>
                  <ArrowUpRight size={15} className="rtl:-scale-x-100 transition-transform group-hover:-translate-y-0.5" aria-hidden="true" />
                </div>
              </div>
            </a>
          ))}
        </section>
      )}

      {/* On-page player */}
      {modal && youtubeId(modal.link) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10" role="dialog" aria-modal="true" aria-label={modal.title}>
          <button className="czv-backdrop absolute inset-0" style={{ background: "rgba(5,6,4,0.88)", backdropFilter: "blur(6px)" }} onClick={() => setModal(null)} aria-label={tx.close} />
          <div className="czv-modal relative w-full max-w-5xl border" style={{ borderColor: C.amberDim, background: C.void, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
            <div className="flex items-center gap-3 border-b px-4 py-2.5" style={{ borderColor: C.line }}>
              <span style={{ color: C.paper }}>{PLATFORM_ICON.YouTube}</span>
              <span className="min-w-0 flex-1 truncate text-sm" style={{ color: C.paper, fontWeight: 600 }} dir="auto">{modal.title}</span>
              <a href={modal.link} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1 text-xs uppercase tracking-widest sm:inline-flex" style={{ color: C.amber }}>
                {tx.openOn("YouTube")}
                <ArrowUpRight size={13} className="rtl:-scale-x-100" aria-hidden="true" />
              </a>
              <button onClick={() => setModal(null)} autoFocus aria-label={tx.close} className="inline-flex h-9 w-9 items-center justify-center transition-colors hover:bg-[#171B10]" style={{ color: C.paper }}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="relative" style={{ aspectRatio: "16 / 9" }}>
              <iframe
                src={embedUrl(youtubeId(modal.link)!)}
                title={modal.title}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
