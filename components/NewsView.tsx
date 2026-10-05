"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Radio, Megaphone, CalendarDays, Search, X, ArrowUpRight, Sparkles } from "lucide-react";
import { C } from "@/lib/theme";
import LiveBanner from "@/components/LiveBanner";
import { posts, type Post } from "@/lib/news-data";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const WRAP = "mx-auto max-w-[1312px] px-6 md:px-16";

// Post types are stored in English; show them in the reader's language. Arabic needs a native review.
const TYPE_LABEL: Record<string, { en: string; ar: string }> = {
  Event: { en: "Event", ar: "فعالية" },
  News: { en: "News", ar: "خبر" },
  Update: { en: "Update", ar: "تحديث" },
  Tournament: { en: "Tournament", ar: "بطولة" },
};
const TEXT = {
  en: { all: "All", search: "Search news", clear: "Clear search", latest: "Latest dispatch", readMore: "Read more", posts: (n: number) => `${n} ${n === 1 ? "post" : "posts"}`, noResults: "No posts match your search.", lastUpdate: "Last update" },
  ar: { all: "الكل", search: "ابحث في الأخبار", clear: "مسح البحث", latest: "أحدث بلاغ", readMore: "اقرأ المزيد", posts: (n: number) => `${n} منشور`, noResults: "لا توجد منشورات تطابق البحث.", lastUpdate: "آخر تحديث" },
};

const CSS = `
@keyframes czn-in { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes czn-border { to { transform: rotate(360deg); } }
@keyframes czn-ping { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(2.8); opacity: 0; } }
@keyframes czn-grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
.czn-in { animation: czn-in 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czn-reveal { opacity: 0; transform: translateY(22px); transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1); }
.czn-reveal.on { opacity: 1; transform: none; }
.czn-ring { position: relative; overflow: hidden; }
.czn-ring::before { content: ""; position: absolute; inset: -150%; background: conic-gradient(from 0deg, transparent 0deg, #E8A63D 50deg, transparent 100deg, transparent 180deg, #8FBF4F 230deg, transparent 280deg); animation: czn-border 6s linear infinite; }
.czn-ring > .czn-ring-inner { position: relative; }
.czn-ping { animation: czn-ping 1.8s ease-out infinite; }
.czn-line { transform-origin: top; animation: czn-grow 1.2s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.czn-card { transition: transform 0.25s ease, border-color 0.25s ease, background-color 0.25s ease; }
.czn-card:hover { transform: translateX(4px); border-color: #8A6425 !important; background-color: #171B10 !important; }
[dir="rtl"] .czn-card:hover { transform: translateX(-4px); }
@media (prefers-reduced-motion: reduce) {
  .czn-in, .czn-ring::before, .czn-ping, .czn-line { animation: none !important; }
  .czn-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
  .czn-card { transition: none !important; }
  .czn-card:hover { transform: none !important; }
}
`;

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return setOn(true);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setOn(true);
        io.disconnect();
      }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`czn-reveal ${on ? "on" : ""}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

function PostLink({ post, className, style, children }: { post: Post; className: string; style?: React.CSSProperties; children: ReactNode }) {
  if (!post.link) return <div className={className} style={style}>{children}</div>;
  const external = post.link.startsWith("http");
  return (
    <a href={post.link} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className={className} style={style}>
      {children}
    </a>
  );
}

export default function NewsView() {
  const { t, locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");

  const sorted = useMemo(() => [...posts].sort((a, b) => (a.date < b.date ? 1 : -1)), []);
  const types = useMemo(() => Array.from(new Set(sorted.map((p) => String(p.type)))), [sorted]);
  const q = query.trim().toLowerCase();
  const filtered = sorted.filter(
    (p) => (type === "all" || String(p.type) === type) && (!q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
  );
  const featured = !q && type === "all" ? filtered[0] : undefined;
  const rest = featured ? filtered.slice(1) : filtered;

  const label = (ty: string) => TYPE_LABEL[ty]?.[lang] ?? ty;
  const fmt = (d: string, opts: Intl.DateTimeFormatOptions) => new Date(d + "T00:00:00").toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", opts);
  const monthKey = (d: string) => d.slice(0, 7);

  return (
    <main className="min-h-screen w-full cz-grid-bg pb-24" style={{ color: C.paper }}>
      <style>{CSS}</style>

      <header className="border-b" style={{ borderColor: C.line }}>
        <div className={`${WRAP} flex flex-wrap items-end justify-between gap-6 pb-10 pt-14 md:pt-20`}>
          <div>
            <div className="czn-in flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>
              <Radio size={14} className="cz-live" aria-hidden="true" />
              <span>{t("common.fieldComms")}</span>
            </div>
            <h1 className="czn-in cz-display mt-3 uppercase leading-[0.92]" style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", fontWeight: 700, animationDelay: "0.08s" }}>
              {t("news.titleLine1")} <span style={{ color: C.amber }}>{t("news.titleLine2")}</span>
            </h1>
          </div>
          {sorted.length > 0 && (
            <div className="czn-in grid grid-cols-2 gap-px border" style={{ background: C.line, borderColor: C.line, animationDelay: "0.16s" }}>
              <div className="px-5 py-3" style={{ background: C.panel }}>
                <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>{tx.posts(sorted.length).replace(/^\d+\s*/, "")}</div>
                <div className="cz-display text-3xl leading-none tabular-nums" style={{ color: C.amber, fontWeight: 700 }}>{sorted.length}</div>
              </div>
              <div className="px-5 py-3" style={{ background: C.panel }}>
                <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>{tx.lastUpdate}</div>
                <div className="mt-1 text-sm" style={{ color: C.paper }}>{fmt(sorted[0].date, { month: "short", day: "numeric", year: "numeric" })}</div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className={WRAP}>
        <div className="mt-8 empty:hidden">
          <LiveBanner />
        </div>

        {sorted.length === 0 ? (
          <p className="mt-10 border px-4 py-12 text-center text-sm" style={{ borderColor: C.line, background: C.panel, color: C.muted }}>
            {t("news.nothingPosted")}
          </p>
        ) : (
          <>
            {/* Toolbar */}
            <div className="sticky top-0 z-10 -mx-2 mt-8 flex flex-wrap items-center gap-3 px-2 py-3" style={{ background: "rgba(10,12,8,0.92)", backdropFilter: "blur(6px)" }}>
              <div className="flex flex-wrap gap-2">
                {["all", ...types].map((k) => {
                  const on = type === k;
                  const n = k === "all" ? sorted.length : sorted.filter((p) => String(p.type) === k).length;
                  return (
                    <button
                      key={k}
                      aria-pressed={on}
                      onClick={() => setType(k)}
                      className="inline-flex min-h-[44px] items-center gap-2 border px-3 text-xs uppercase tracking-widest transition-all duration-200"
                      style={{ background: on ? C.amber : "transparent", color: on ? C.void : C.paper, borderColor: on ? C.amber : C.amberDim, fontWeight: on ? 700 : 500, transform: on ? "translateY(-1px)" : "none" }}
                    >
                      {k === "all" ? tx.all : label(k)}
                      <span className="tabular-nums" style={{ opacity: 0.7 }}>{n}</span>
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

            {/* Featured */}
            {featured && (
              <div className="czn-ring czn-in mt-6 p-[1.5px]">
                <PostLink post={featured} className="czn-ring-inner group block p-6 md:p-10" style={{ background: "linear-gradient(130deg, rgba(232,166,61,0.12), #12150E 50%, #0D100A)" }}>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.22em]">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1" style={{ background: C.amber, color: C.void, fontWeight: 700 }}>
                      <Sparkles size={12} aria-hidden="true" />
                      {tx.latest}
                    </span>
                    <span style={{ color: String(featured.type) === "Event" ? C.radar : C.amber }}>{label(String(featured.type))}</span>
                    <time dateTime={featured.date} style={{ color: C.muted }}>{fmt(featured.date, { month: "long", day: "numeric", year: "numeric" })}</time>
                  </div>
                  <h2 className="cz-display mt-5 max-w-4xl text-4xl uppercase leading-[0.95] md:text-6xl" style={{ fontWeight: 700 }}>
                    {featured.title}
                  </h2>
                  <p className="mt-5 max-w-2xl text-base leading-relaxed md:text-lg" style={{ color: C.muted }}>{featured.description}</p>
                  {featured.link && (
                    <span className="mt-7 inline-flex items-center gap-2 text-sm uppercase tracking-widest" style={{ color: C.amber, fontWeight: 600 }}>
                      {tx.readMore}
                      <ArrowUpRight size={16} className="rtl:-scale-x-100 transition-transform group-hover:-translate-y-0.5" aria-hidden="true" />
                    </span>
                  )}
                </PostLink>
              </div>
            )}

            {/* Timeline */}
            {rest.length === 0 && !featured ? (
              <p className="mt-6 border px-4 py-12 text-center text-sm" style={{ borderColor: C.line, background: C.panel, color: C.muted }}>{tx.noResults}</p>
            ) : (
              <div className="relative mt-10" style={{ paddingInlineStart: 36 }}>
                <span aria-hidden="true" className="czn-line absolute top-0 bottom-0 w-px" style={{ insetInlineStart: 11, background: `linear-gradient(180deg, ${C.amber}, ${C.lineStrong} 30%, ${C.line})` }} />
                {rest.map((p, i) => {
                  const showMonth = i === 0 || monthKey(rest[i - 1].date) !== monthKey(p.date);
                  const isEvent = String(p.type) === "Event";
                  const Icon = isEvent ? CalendarDays : Megaphone;
                  return (
                    <div key={`${p.title}-${p.date}`}>
                      {showMonth && (
                        <div className="relative mb-4 mt-8 first:mt-0">
                          <span aria-hidden="true" className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rotate-45" style={{ insetInlineStart: -31, background: C.void, border: `2px solid ${C.amber}` }} />
                          <span className="cz-display text-xl uppercase" style={{ color: C.amber, fontWeight: 600 }}>{fmt(p.date, { month: "long", year: "numeric" })}</span>
                        </div>
                      )}
                      <Reveal delay={Math.min(i, 6) * 0.05}>
                        <div className="relative mb-4">
                          <span aria-hidden="true" className="absolute top-6 inline-flex h-3 w-3" style={{ insetInlineStart: -30 }}>
                            {i === 0 && !featured && <span className="czn-ping absolute inset-0 rounded-full" style={{ background: C.amber }} />}
                            <span className="relative inline-block h-3 w-3 rounded-full" style={{ background: isEvent ? C.radar : C.amberDim, border: `2px solid ${C.void}` }} />
                          </span>
                          <PostLink post={p} className="czn-card group block border p-5" style={{ background: C.panel, borderColor: C.line }}>
                            <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-widest">
                              <span className="inline-flex items-center gap-2" style={{ color: isEvent ? C.radar : C.amber }}>
                                <Icon size={14} aria-hidden="true" />
                                {label(String(p.type))}
                              </span>
                              <time dateTime={p.date} style={{ color: C.muted }}>{fmt(p.date, { month: "short", day: "numeric", year: "numeric" })}</time>
                            </div>
                            <h3 className="mt-3 text-lg leading-snug" style={{ fontWeight: 600 }}>{p.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed" style={{ color: C.muted }}>{p.description}</p>
                            {p.link && (
                              <span className="mt-3 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest" style={{ color: C.amber }}>
                                {tx.readMore}
                                <ArrowUpRight size={13} className="rtl:-scale-x-100" aria-hidden="true" />
                              </span>
                            )}
                          </PostLink>
                        </div>
                      </Reveal>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
