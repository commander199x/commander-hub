"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Map, Swords, Wrench, Download, ArrowUpRight, Radio, Search, X, Check, ChevronLeft, ChevronRight,
  HelpCircle, Copy, Star, Users, ChevronDown,
} from "lucide-react";
import { C, MODS_DISCORD_URL } from "@/lib/theme";
import type { MapEntry } from "@/lib/maps-data";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Mod {
  name: string;
  description: string;
  version: string;
}

interface Tool {
  name: string;
  description: string;
  tag: string;
}

type Tab = "maps" | "mods" | "tools";
type MapType = "all" | "1v1" | "4v4" | "8p" | "coop";
type DlState = { pct: number | null; done: boolean };

const WRAP = "mx-auto max-w-[1312px] px-6 md:px-16";
const PAGE_SIZE = 12;
const MAPS_FOLDER = "%USERPROFILE%\\Documents\\Command and Conquer Generals Zero Hour Data\\Maps";
const CONTROL =
  "min-h-[44px] border border-[#8A6425] bg-[#12150E] px-3 text-sm text-[#EDEAE0] transition-colors focus:border-[#E8A63D]";

// New text for this layout (existing titles still come from translations.ts). Arabic needs a native review.
const TEXT = {
  en: {
    toolsLabel: "Tools",
    tabs: { maps: "Maps", mods: "Mods", tools: "Tools" },
    search: "Search maps",
    clear: "Clear search",
    types: { all: "All", "1v1": "1v1", "4v4": "4v4", "8p": "8 players", coop: "Co-op" },
    sortDefault: "Default order",
    sortAZ: "Name A–Z",
    sortZA: "Name Z–A",
    clanMap: "Clan map",
    featured: "Featured",
    howTitle: "How to install a map",
    howToggle: "New to custom maps?",
    steps: [
      "Download the map package and extract the .zip file.",
      "Open this folder. Paste it into the File Explorer address bar (create the Maps folder if it doesn't exist):",
      "Copy the extracted map folder into it. Each map keeps its own folder.",
      "Start Zero Hour and pick the map in Skirmish or Network.",
    ],
    copy: "Copy path",
    copied: "Copied",
    downloading: "Downloading…",
    downloaded: "Downloaded",
    prev: "Previous",
    next: "Next",
  },
  ar: {
    toolsLabel: "الأدوات",
    tabs: { maps: "الخرائط", mods: "التعديلات", tools: "الأدوات" },
    search: "ابحث عن خريطة",
    clear: "مسح البحث",
    types: { all: "الكل", "1v1": "1v1", "4v4": "4v4", "8p": "8 لاعبين", coop: "تعاوني" },
    sortDefault: "الترتيب الافتراضي",
    sortAZ: "الاسم (أ–ي)",
    sortZA: "الاسم (ي–أ)",
    clanMap: "خريطة الكلان",
    featured: "مميّز",
    howTitle: "كيف تثبّت خريطة",
    howToggle: "جديد على الخرائط المخصّصة؟",
    steps: [
      "حمّل حزمة الخريطة وفك ضغط ملف ‎.zip.",
      "افتح هذا المجلد بلصقه في شريط العنوان في مستكشف الملفات (أنشئ مجلد Maps إن لم يكن موجوداً):",
      "انسخ مجلد الخريطة المستخرج إليه، فلكل خريطة مجلدها الخاص.",
      "شغّل الساعة الصفر واختر الخريطة من Skirmish أو Network.",
    ],
    copy: "نسخ المسار",
    copied: "تم النسخ",
    downloading: "جارٍ التحميل…",
    downloaded: "تم التحميل",
    prev: "السابق",
    next: "التالي",
  },
};

// Work out a map's type from its name/description (no extra data needed).
function mapType(m: MapEntry): Exclude<MapType, "all"> | null {
  const s = `${m.name} ${m.description}`.toLowerCase();
  if (/co-?op|art of defense|\baod\b/.test(s)) return "coop";
  if (/8-player|2v2v2v2|8 players/.test(s)) return "8p";
  if (/4v4/.test(s)) return "4v4";
  if (/1v1/.test(s)) return "1v1";
  return null;
}
const isClanMap = (m: MapEntry) => /commander/i.test(`${m.name} ${m.description}`);

const DL_CSS = `
@keyframes czd-in { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes czd-spin { to { transform: rotate(360deg); } }
@keyframes czd-pop { 0% { transform: scale(0.6); opacity: 0; } 70% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
@keyframes czd-scan { from { transform: translateY(-100%); } to { transform: translateY(100%); } }
.czd-card { animation: czd-in 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both; transition: transform 0.3s ease, border-color 0.3s ease; }
.czd-card:hover { transform: translateY(-4px); border-color: #8A6425 !important; }
.czd-card::before {
  content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity 0.3s ease; z-index: 5;
  background: radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), rgba(232,166,61,0.12), transparent 70%);
}
.czd-card:hover::before { opacity: 1; }
.czd-img { filter: grayscale(0.45) contrast(1.05); transform: scale(1); transition: transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1), filter 0.5s ease; }
.czd-card:hover .czd-img { filter: grayscale(0) contrast(1.08) saturate(1.1); transform: scale(1.08); }
.czd-scan { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity 0.3s ease;
  background: linear-gradient(180deg, transparent 0%, rgba(143,191,79,0.22) 50%, transparent 100%); }
.czd-card:hover .czd-scan { opacity: 1; animation: czd-scan 1.6s linear infinite; }
.czd-dl .czd-dl-icon { transition: transform 0.25s ease; }
.czd-dl:hover .czd-dl-icon { transform: translateY(3px); }
.czd-pop { animation: czd-pop 0.35s ease-out both; }
.czd-spin { animation: czd-spin 1s linear infinite; }
.czd-indicator { transition: left 0.35s cubic-bezier(0.2, 0.7, 0.2, 1), width 0.35s cubic-bezier(0.2, 0.7, 0.2, 1); }
.czd-panel { animation: czd-in 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .czd-card, .czd-pop, .czd-spin, .czd-panel, .czd-card:hover .czd-scan { animation: none !important; }
  .czd-card, .czd-img, .czd-indicator { transition: none !important; }
  .czd-card:hover, .czd-card:hover .czd-img { transform: none !important; }
}
`;

function reducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (reducedMotion()) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 900);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    setShown(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{String(shown).padStart(2, "0")}</>;
}

function onSpotlight(e: React.MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

const BRACKETS = [
  "top-2 start-2 border-t border-s",
  "top-2 end-2 border-t border-e",
  "bottom-2 start-2 border-b border-s",
  "bottom-2 end-2 border-b border-e",
];

export default function DownloadsView({
  maps,
  initialQuery,
  initialPage,
  initialTab,
  mods,
  tools,
}: {
  maps: MapEntry[];
  initialQuery: string;
  initialPage: number;
  initialTab: Tab;
  mods: Mod[];
  tools: Tool[];
}) {
  const { t, locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];

  const [tab, setTab] = useState<Tab>(initialTab);
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<MapType>("all");
  const [sort, setSort] = useState<"default" | "az" | "za">("default");
  const [page, setPage] = useState(initialPage);
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloads, setDownloads] = useState<Record<string, DlState>>({});

  // ---------- sliding tab underline ----------
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ maps: null, mods: null, tools: null });
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  useLayoutEffect(() => {
    function measure() {
      const el = tabRefs.current[tab];
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [tab, lang]);

  // ---------- filtering ----------
  const typeCounts = useMemo(() => {
    const c: Record<MapType, number> = { all: maps.length, "1v1": 0, "4v4": 0, "8p": 0, coop: 0 };
    for (const m of maps) {
      const k = mapType(m);
      if (k) c[k]++;
    }
    return c;
  }, [maps]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = maps.filter((m) => {
      if (type !== "all" && mapType(m) !== type) return false;
      if (!q) return true;
      return m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
    });
    if (sort !== "default") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name) * (sort === "az" ? 1 : -1));
    }
    return list;
  }, [maps, query, type, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageMaps = filtered.slice(start, start + PAGE_SIZE);

  // Keep the URL in sync without reloading the page, so links can be shared.
  useEffect(() => {
    const h = setTimeout(() => {
      const sp = new URLSearchParams();
      if (query.trim()) sp.set("q", query.trim());
      if (currentPage > 1) sp.set("page", String(currentPage));
      if (tab !== "maps") sp.set("tab", tab);
      const qs = sp.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
    }, 300);
    return () => clearTimeout(h);
  }, [query, currentPage, tab]);

  function goToPage(p: number) {
    setPage(p);
    document.getElementById("czd-maps-top")?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  }

  // ---------- downloads with a progress ring ----------
  async function download(m: MapEntry) {
    const key = m.file;
    if (downloads[key] && !downloads[key].done) return;
    setDownloads((d) => ({ ...d, [key]: { pct: 0, done: false } }));
    try {
      const res = await fetch(encodeURI(m.file));
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const total = Number(res.headers.get("content-length")) || 0;
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let got = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        got += value.length;
        setDownloads((d) => ({ ...d, [key]: { pct: total ? got / total : null, done: false } }));
      }
      const url = URL.createObjectURL(new Blob(chunks as BlobPart[], { type: "application/zip" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = decodeURIComponent(m.file.split("/").pop() || `${m.name}.zip`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setDownloads((d) => ({ ...d, [key]: { pct: 1, done: true } }));
      setTimeout(() => setDownloads((d) => {
        const n = { ...d };
        delete n[key];
        return n;
      }), 2600);
    } catch {
      setDownloads((d) => {
        const n = { ...d };
        delete n[key];
        return n;
      });
      window.location.href = encodeURI(m.file);
    }
  }

  async function copyPath() {
    try {
      await navigator.clipboard.writeText(MAPS_FOLDER);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(tx.copy, MAPS_FOLDER);
    }
  }

  const showingText =
    filtered.length === 0
      ? t("downloads.noMapsMatch")
      : t("downloads.showing")
          .replace("{from}", String(start + 1))
          .replace("{to}", String(Math.min(start + PAGE_SIZE, filtered.length)))
          .replace("{total}", String(filtered.length));

  const pageNumbers: (number | "…")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1) pageNumbers.push(p);
    else if (pageNumbers[pageNumbers.length - 1] !== "…") pageNumbers.push("…");
  }

  const tabIcon = { maps: Map, mods: Swords, tools: Wrench };
  const tabCount = { maps: maps.length, mods: mods.length, tools: tools.length };

  return (
    <main className="min-h-screen w-full cz-grid-bg pb-24" style={{ color: C.paper }}>
      <style>{DL_CSS}</style>

      {/* ================= HEADER ================= */}
      <header className="border-b" style={{ borderColor: C.line }}>
        <div className={`${WRAP} pb-10 pt-14 md:pt-20`}>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: C.radar }}>
            <Radio size={14} className="cz-live" aria-hidden="true" />
            <span>{t("common.fieldComms")}</span>
          </div>
          <h1 className="cz-display mt-3 uppercase leading-[0.92]" style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", fontWeight: 700, letterSpacing: "0.01em" }}>
            {t("downloads.titleLine1")} <span style={{ color: C.amber }}>{t("downloads.titleLine2")}</span>
          </h1>

          <div className="mt-8 grid max-w-3xl grid-cols-2 gap-px border sm:grid-cols-4" style={{ background: C.line, borderColor: C.line }}>
            {[
              { label: t("downloads.mapsLabel"), value: maps.length, color: C.amber },
              { label: t("downloads.modsLabel"), value: mods.length, color: C.paper },
              { label: tx.toolsLabel, value: tools.length, color: C.paper },
            ].map((s) => (
              <div key={s.label} className="px-5 py-4" style={{ background: C.panel }}>
                <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>
                  {s.label}
                </div>
                <div className="cz-display mt-1 text-4xl leading-none tabular-nums" style={{ color: s.color, fontWeight: 700 }}>
                  <CountUp value={s.value} />
                </div>
              </div>
            ))}
            <div className="px-5 py-4" style={{ background: C.panel }}>
              <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>
                {t("downloads.statusLabel")}
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm uppercase tracking-widest" style={{ color: C.radar, fontWeight: 700 }}>
                <span className="relative inline-flex h-2 w-2">
                  <span className="cz-blink absolute inset-0 rounded-full" style={{ background: C.radar }} />
                  <span className="relative inline-block h-2 w-2 rounded-full" style={{ background: C.radar }} />
                </span>
                {t("downloads.statusValue")}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className={WRAP}>
        {/* ================= TABS ================= */}
        <div className="sticky top-0 z-20 -mx-2 px-2 pt-4" style={{ background: "rgba(10,12,8,0.92)", backdropFilter: "blur(6px)" }}>
          <div role="tablist" aria-label={t("downloads.titleLine1")} className="relative flex gap-6 border-b md:gap-10" style={{ borderColor: C.line }}>
            {(["maps", "mods", "tools"] as const).map((k) => {
              const Icon = tabIcon[k];
              const on = tab === k;
              return (
                <button
                  key={k}
                  ref={(el) => {
                    tabRefs.current[k] = el;
                  }}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setTab(k)}
                  className="cz-display inline-flex min-h-[52px] items-center gap-2 text-lg uppercase tracking-wide transition-colors"
                  style={{ color: on ? C.amber : C.muted, fontWeight: 600 }}
                >
                  <Icon size={17} aria-hidden="true" />
                  {tx.tabs[k]}
                  <span className="font-sans text-xs tabular-nums" style={{ color: on ? C.amber : C.lineStrong }}>
                    {tabCount[k]}
                  </span>
                </button>
              );
            })}
            <span
              aria-hidden="true"
              className="czd-indicator absolute -bottom-px h-[2px]"
              style={{ left: indicator.left, width: indicator.width, background: C.amber, boxShadow: "0 0 12px rgba(232,166,61,0.6)" }}
            />
          </div>

          {/* Map toolbar */}
          {tab === "maps" && (
            <div className="flex flex-wrap items-center gap-3 py-3">
              <label className="relative flex-[1_1_240px]">
                <span className="sr-only">{tx.search}</span>
                <Search size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 -translate-y-1/2" style={{ insetInlineStart: 12, color: C.muted }} />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder={tx.search}
                  className={`${CONTROL} w-full pe-10 ps-9`}
                />
                {query && (
                  <button
                    onClick={() => {
                      setQuery("");
                      setPage(1);
                    }}
                    aria-label={tx.clear}
                    className="absolute top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center"
                    style={{ insetInlineEnd: 6, color: C.muted }}
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                )}
              </label>
              <div className="flex flex-wrap gap-2" role="group">
                {(["all", "1v1", "4v4", "8p", "coop"] as const).map((k) => {
                  if (k !== "all" && typeCounts[k] === 0) return null;
                  const on = type === k;
                  return (
                    <button
                      key={k}
                      aria-pressed={on}
                      onClick={() => {
                        setType(k);
                        setPage(1);
                      }}
                      className="inline-flex min-h-[44px] items-center gap-2 border px-3 text-xs uppercase tracking-widest transition-all duration-200"
                      style={{
                        background: on ? C.amber : "transparent",
                        color: on ? C.void : C.paper,
                        borderColor: on ? C.amber : C.amberDim,
                        fontWeight: on ? 700 : 500,
                        transform: on ? "translateY(-1px)" : "none",
                      }}
                    >
                      {tx.types[k]}
                      <span className="tabular-nums" style={{ opacity: 0.7 }}>{typeCounts[k]}</span>
                    </button>
                  );
                })}
              </div>
              <label>
                <span className="sr-only">{tx.sortDefault}</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as "default" | "az" | "za")} className={CONTROL}>
                  <option value="default">{tx.sortDefault}</option>
                  <option value="az">{tx.sortAZ}</option>
                  <option value="za">{tx.sortZA}</option>
                </select>
              </label>
            </div>
          )}
        </div>

        {/* ================= MAPS ================= */}
        {tab === "maps" && (
          <section key="maps" className="czd-panel" role="tabpanel" aria-label={tx.tabs.maps}>
            <div id="czd-maps-top" className="scroll-mt-40" />

            {/* How to install */}
            <div className="mt-4 border" style={{ borderColor: C.line, background: C.panel }}>
              <button
                onClick={() => setShowHelp((v) => !v)}
                aria-expanded={showHelp}
                className="flex min-h-[52px] w-full items-center gap-3 px-4 text-start"
              >
                <HelpCircle size={18} style={{ color: C.radar }} aria-hidden="true" />
                <span className="text-sm" style={{ color: C.muted }}>{tx.howToggle}</span>
                <span className="text-sm" style={{ color: C.paper, fontWeight: 600 }}>{tx.howTitle}</span>
                <ChevronDown size={16} className="ms-auto transition-transform duration-300" style={{ color: C.muted, transform: showHelp ? "rotate(180deg)" : "none" }} aria-hidden="true" />
              </button>
              <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: showHelp ? "1fr" : "0fr" }}>
                <div className="overflow-hidden">
                  <ol className="grid gap-4 border-t px-4 py-5 md:grid-cols-4" style={{ borderColor: C.line }}>
                    {tx.steps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="cz-display flex h-8 w-8 shrink-0 items-center justify-center text-lg" style={{ border: `1px solid ${C.amberDim}`, color: C.amber, fontWeight: 700 }}>
                          {i + 1}
                        </span>
                        <div className="min-w-0 text-sm leading-relaxed" style={{ color: C.paper }}>
                          {step}
                          {i === 1 && (
                            <div className="mt-2 flex items-stretch gap-2">
                              <code dir="ltr" className="min-w-0 flex-1 break-all px-2 py-1.5 text-[11px]" style={{ background: C.void, border: `1px solid ${C.line}`, color: C.amber }}>
                                {MAPS_FOLDER}
                              </code>
                              <button
                                onClick={copyPath}
                                aria-label={tx.copy}
                                title={tx.copy}
                                className="inline-flex w-10 shrink-0 items-center justify-center border transition-colors hover:bg-[#171B10]"
                                style={{ borderColor: C.amberDim, color: copied ? C.radar : C.amber }}
                              >
                                {copied ? <Check size={15} className="czd-pop" aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            <p className="mt-4 text-[11px] uppercase tracking-widest" style={{ color: C.muted }} aria-live="polite">
              {showingText}
            </p>

            <div key={`${currentPage}-${type}-${sort}`} className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {pageMaps.map((map, i) => {
                const kind = mapType(map);
                const clan = isClanMap(map);
                const dl = downloads[map.file];
                const R = 10;
                const CIRC = 2 * Math.PI * R;
                return (
                  <article
                    key={map.file}
                    onMouseMove={onSpotlight}
                    className="czd-card group relative flex flex-col overflow-hidden border"
                    style={{ background: C.panel, borderColor: clan ? C.amberDim : C.line, animationDelay: `${i * 0.05}s` }}
                  >
                    {BRACKETS.map((pos) => (
                      <span key={pos} aria-hidden="true" className={`pointer-events-none absolute z-20 h-3 w-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${pos}`} style={{ borderColor: C.amber }} />
                    ))}

                    <div className="flex items-center justify-between border-b px-4 py-2.5 text-[11px] uppercase tracking-widest" style={{ borderColor: C.line, color: C.muted }}>
                      <span className="flex items-center gap-2" style={{ color: C.paper }}>
                        {t("downloads.mapPack")}
                        {clan && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-px" style={{ background: C.amber, color: C.void, fontWeight: 700 }}>
                            <Star size={10} aria-hidden="true" />
                            {tx.clanMap}
                          </span>
                        )}
                      </span>
                      <span className="tabular-nums">
                        {t("downloads.logPrefix")} {String(start + i + 1).padStart(3, "0")}
                      </span>
                    </div>

                    <div className="relative overflow-hidden" style={{ aspectRatio: "16 / 9", background: "#000" }}>
                      <Image
                        src={map.image}
                        alt={map.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="czd-img object-cover"
                      />
                      <span className="czd-scan" aria-hidden="true" />
                      {kind && (
                        <span
                          className="absolute bottom-2 start-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 text-[11px] uppercase tracking-widest"
                          style={{ background: "rgba(10,12,8,0.85)", color: C.radar, border: `1px solid rgba(143,191,79,0.45)`, fontWeight: 700 }}
                        >
                          <Users size={11} aria-hidden="true" />
                          {tx.types[kind]}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <h3 dir="auto" className="text-base" style={{ color: C.paper, fontWeight: 600 }}>
                        {map.name}
                      </h3>
                      <p
                        className="mt-2 flex-1 text-sm leading-relaxed"
                        style={{ color: C.muted, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                      >
                        {map.description}
                      </p>

                      <button
                        onClick={() => download(map)}
                        className="czd-dl mt-4 flex min-h-[48px] items-center justify-between border-t pt-3 text-xs uppercase tracking-widest"
                        style={{ borderColor: C.line, color: C.amber, fontWeight: 600 }}
                      >
                        <span className="flex items-center gap-2" aria-live="polite">
                          {dl?.done ? (
                            <>
                              <Check size={15} className="czd-pop" style={{ color: C.radar }} aria-hidden="true" />
                              <span style={{ color: C.radar }}>{tx.downloaded}</span>
                            </>
                          ) : dl ? (
                            <>
                              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className={dl.pct === null ? "czd-spin" : undefined}>
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
                              <Download size={15} className="czd-dl-icon" aria-hidden="true" />
                              {t("common.downloadPackage")}
                            </>
                          )}
                        </span>
                        <ArrowUpRight size={15} className="rtl:-scale-x-100" aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <nav aria-label={tx.tabs.maps} className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
                <button
                  onClick={() => goToPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex min-h-[40px] items-center gap-1 border px-3 text-sm transition-colors hover:bg-[#171B10] disabled:opacity-40"
                  style={{ borderColor: C.amberDim, color: C.paper }}
                >
                  <ChevronLeft size={16} className="rtl:-scale-x-100" aria-hidden="true" />
                  {tx.prev}
                </button>
                {pageNumbers.map((p, i) =>
                  p === "…" ? (
                    <span key={`e${i}`} className="px-1 text-sm" style={{ color: C.muted }}>…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      aria-current={p === currentPage ? "page" : undefined}
                      className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center border px-3 text-sm tabular-nums transition-colors"
                      style={{
                        background: p === currentPage ? C.amber : "transparent",
                        color: p === currentPage ? C.void : C.paper,
                        borderColor: p === currentPage ? C.amber : C.amberDim,
                        fontWeight: p === currentPage ? 700 : 400,
                      }}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex min-h-[40px] items-center gap-1 border px-3 text-sm transition-colors hover:bg-[#171B10] disabled:opacity-40"
                  style={{ borderColor: C.amberDim, color: C.paper }}
                >
                  {tx.next}
                  <ChevronRight size={16} className="rtl:-scale-x-100" aria-hidden="true" />
                </button>
              </nav>
            )}
          </section>
        )}

        {/* ================= MODS ================= */}
        {tab === "mods" && (
          <section key="mods" className="czd-panel pt-6" role="tabpanel" aria-label={tx.tabs.mods}>
            <p className="mb-5 text-sm" style={{ color: C.muted }}>{t("downloads.modsDistributed")}</p>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {mods.map((mod, i) => {
                const featured = i === 0;
                return (
                  <a
                    key={mod.name}
                    href={MODS_DISCORD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseMove={onSpotlight}
                    className={`czd-card group relative flex flex-col overflow-hidden border p-6 ${featured ? "md:col-span-2 lg:col-span-1 lg:row-span-1" : ""}`}
                    style={{
                      background: featured ? "linear-gradient(160deg, rgba(232,166,61,0.12), #12150E 55%)" : C.panel,
                      borderColor: featured ? C.amberDim : C.line,
                      animationDelay: `${i * 0.07}s`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-11 w-11 items-center justify-center" style={{ border: `1px solid ${C.amberDim}`, color: C.amber }}>
                        <Swords size={20} aria-hidden="true" />
                      </span>
                      <div className="flex items-center gap-2">
                        {featured && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-widest" style={{ background: C.amber, color: C.void, fontWeight: 700 }}>
                            <Star size={10} aria-hidden="true" />
                            {tx.featured}
                          </span>
                        )}
                        <span className="px-2 py-1 text-[11px] tracking-widest" style={{ border: `1px solid ${C.lineStrong}`, color: C.radar }}>
                          {mod.version}
                        </span>
                      </div>
                    </div>
                    <h3 className="cz-display mt-5 text-2xl uppercase" style={{ color: C.paper, fontWeight: 600 }}>
                      {mod.name}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: C.muted }}>
                      {mod.description}
                    </p>
                    <div className="mt-5 flex items-center justify-between border-t pt-3 text-xs uppercase tracking-widest" style={{ borderColor: C.line, color: C.amber, fontWeight: 600 }}>
                      <span>{t("common.getOnDiscord")}</span>
                      <ArrowUpRight size={15} className="rtl:-scale-x-100 transition-transform group-hover:-translate-y-0.5" aria-hidden="true" />
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* ================= TOOLS ================= */}
        {tab === "tools" && (
          <section key="tools" className="czd-panel pt-6" role="tabpanel" aria-label={tx.tabs.tools}>
            <p className="mb-5 text-sm" style={{ color: C.muted }}>{t("downloads.toolsDistributed")}</p>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool, i) => (
                <a
                  key={tool.name}
                  href={MODS_DISCORD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseMove={onSpotlight}
                  className="czd-card group relative flex flex-col overflow-hidden border p-6"
                  style={{ background: C.panel, borderColor: C.line, animationDelay: `${i * 0.07}s` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-11 w-11 items-center justify-center" style={{ border: `1px solid ${C.amberDim}`, color: C.amber }}>
                      <Wrench size={20} aria-hidden="true" />
                    </span>
                    <span className="px-2 py-1 text-[11px] uppercase tracking-widest" style={{ border: `1px solid ${C.lineStrong}`, color: C.radar }}>
                      {tool.tag}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg" style={{ color: C.paper, fontWeight: 600 }}>
                    {tool.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: C.muted }}>
                    {tool.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t pt-3 text-xs uppercase tracking-widest" style={{ borderColor: C.line, color: C.amber, fontWeight: 600 }}>
                    <span>{t("common.getOnDiscord")}</span>
                    <ArrowUpRight size={15} className="rtl:-scale-x-100 transition-transform group-hover:-translate-y-0.5" aria-hidden="true" />
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
