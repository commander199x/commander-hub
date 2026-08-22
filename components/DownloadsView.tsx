"use client";

import Image from "next/image";
import { Map, Swords, Wrench, Download, ArrowUpRight, Radio } from "lucide-react";
import { C, MODS_DISCORD_URL } from "@/lib/theme";
import type { MapEntry } from "@/lib/maps-data";
import MapSearch from "@/components/MapSearch";
import Pagination from "@/components/Pagination";
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

export default function DownloadsView({
  query,
  currentPage,
  totalPages,
  start,
  pageMaps,
  totalMapsCount,
  filteredCount,
  mods,
  tools,
}: {
  query: string;
  currentPage: number;
  totalPages: number;
  start: number;
  pageMaps: MapEntry[];
  totalMapsCount: number;
  filteredCount: number;
  mods: Mod[];
  tools: Tool[];
}) {
  const { t } = useLanguage();
  const PAGE_SIZE = 12;

  const BRACKETS = [
    "top-2 start-2 border-t border-s",
    "top-2 end-2 border-t border-e",
    "bottom-2 start-2 border-b border-s",
    "bottom-2 end-2 border-b border-e",
  ];

  return (
    <main className="min-h-screen w-full cz-grid-bg">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
        <div className="flex items-center gap-2 text-xs tracking-widest uppercase" style={{ color: C.radar }}>
          <Radio size={13} className="cz-live" />
          <span>{t("common.fieldComms")}</span>
        </div>

        <h1
          className="cz-display uppercase mt-4 leading-[0.95]"
          style={{ fontSize: "clamp(2.6rem, 6vw, 4.5rem)", fontWeight: 700, letterSpacing: "0.01em" }}
        >
          {t("downloads.titleLine1")}
          <br />
          <span style={{ color: C.amber }}>{t("downloads.titleLine2")}</span>
        </h1>

        <div
          className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 pt-6 text-xs uppercase tracking-wide"
          style={{ borderTop: `1px solid ${C.line}`, color: C.muted }}
        >
          <span>
            {t("downloads.mapsLabel")} <b style={{ color: C.paper }}>{String(totalMapsCount).padStart(2, "0")}</b>
          </span>
          <span>
            {t("downloads.modsLabel")} <b style={{ color: C.paper }}>{String(mods.length).padStart(2, "0")}</b>
          </span>
          <span>
            {t("downloads.statusLabel")} <b style={{ color: C.radar }}>{t("downloads.statusValue")}</b>
          </span>
        </div>

        <div className="flex items-center gap-2 mt-14 mb-2">
          <Map size={16} style={{ color: C.amber }} />
          <h2 className="cz-display uppercase text-2xl" style={{ fontWeight: 600 }}>
            {t("downloads.mapsLibrary")}
          </h2>
        </div>

        <MapSearch defaultValue={query} />

        <p className="text-[11px] uppercase tracking-widest mt-4" style={{ color: C.muted }}>
          {filteredCount === 0
            ? t("downloads.noMapsMatch")
            : t("downloads.showing")
                .replace("{from}", String(start + 1))
                .replace("{to}", String(Math.min(start + PAGE_SIZE, filteredCount)))
                .replace("{total}", String(filteredCount))}
        </p>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {pageMaps.map((map, i) => (
            <div
              key={map.name}
              className="cz-card group relative"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              {BRACKETS.map((pos) => (
                <span
                  key={pos}
                  className={`cz-bracket pointer-events-none absolute w-3 h-3 ${pos} opacity-0 transition-opacity duration-300 z-20`}
                  style={{ borderColor: C.amber }}
                />
              ))}

              <div
                className="flex items-center justify-between px-4 py-2.5 text-[11px] uppercase tracking-widest"
                style={{ borderBottom: `1px solid ${C.line}`, color: C.muted }}
              >
                <span style={{ color: C.paper }}>{t("downloads.mapPack")}</span>
                <span>{t("downloads.logPrefix")} {String(start + i + 1).padStart(3, "0")}</span>
              </div>

              <div className="relative" style={{ aspectRatio: "16 / 9", background: "#000" }}>
                <Image
                  src={map.image}
                  alt={map.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                  style={{ filter: "grayscale(0.35) contrast(1.05)" }}
                />
              </div>

              <div className="p-4">
                <h3 className="text-[15px]" style={{ color: C.paper, fontWeight: 500 }}>
                  {map.name}
                </h3>

                <p
                  className="text-xs mt-3"
                  style={{
                    color: C.muted,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {map.description}
                </p>

                <a
                  href={map.file}
                  download
                  className="flex items-center justify-between mt-5 pt-3 text-xs uppercase tracking-widest transition-colors"
                  style={{ borderTop: `1px solid ${C.line}`, color: C.amber }}
                >
                  <span className="flex items-center gap-2">
                    <Download size={13} />
                    {t("common.downloadPackage")}
                  </span>
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          ))}
        </section>

        <Pagination currentPage={currentPage} totalPages={totalPages} query={query} />

        <div className="flex items-center gap-2 mt-16 mb-6">
          <Swords size={16} style={{ color: C.amber }} />
          <h2 className="cz-display uppercase text-2xl" style={{ fontWeight: 600 }}>
            {t("downloads.mods")}
          </h2>
        </div>

        <p className="text-[11px] uppercase tracking-widest mb-4" style={{ color: C.muted }}>
          {t("downloads.modsDistributed")}
        </p>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mods.map((mod) => (
            <a
              key={mod.name}
              href={MODS_DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="cz-card group relative block p-5"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              {BRACKETS.map((pos) => (
                <span
                  key={pos}
                  className={`cz-bracket pointer-events-none absolute w-3 h-3 ${pos} opacity-0 transition-opacity duration-300`}
                  style={{ borderColor: C.amber }}
                />
              ))}

              <div className="flex items-center justify-between mb-4">
                <Swords size={20} style={{ color: C.amber }} />
                <span
                  className="text-[10px] uppercase tracking-widest px-2 py-1"
                  style={{ border: `1px solid ${C.lineStrong}`, color: C.radar }}
                >
                  {mod.version}
                </span>
              </div>

              <h3 className="text-[15px]" style={{ color: C.paper, fontWeight: 500 }}>
                {mod.name}
              </h3>

              <p className="text-xs mt-3" style={{ color: C.muted }}>
                {mod.description}
              </p>

              <div
                className="flex items-center justify-between mt-5 pt-3 text-xs uppercase tracking-widest"
                style={{ borderTop: `1px solid ${C.line}`, color: C.amber }}
              >
                <span>{t("common.getOnDiscord")}</span>
                <ArrowUpRight size={14} />
              </div>
            </a>
          ))}
        </section>

        <div className="flex items-center gap-2 mt-16 mb-6">
          <Wrench size={16} style={{ color: C.amber }} />
          <h2 className="cz-display uppercase text-2xl" style={{ fontWeight: 600 }}>
            {t("downloads.tools")}
          </h2>
        </div>

        <p className="text-[11px] uppercase tracking-widest mb-4" style={{ color: C.muted }}>
          {t("downloads.toolsDistributed")}
        </p>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
          {tools.map((tool) => (
            <a
              key={tool.name}
              href={MODS_DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="cz-card group relative block p-5"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              {BRACKETS.map((pos) => (
                <span
                  key={pos}
                  className={`cz-bracket pointer-events-none absolute w-3 h-3 ${pos} opacity-0 transition-opacity duration-300`}
                  style={{ borderColor: C.amber }}
                />
              ))}

              <div className="flex items-center justify-between mb-4">
                <Wrench size={20} style={{ color: C.amber }} />
                <span
                  className="text-[10px] uppercase tracking-widest px-2 py-1"
                  style={{ border: `1px solid ${C.lineStrong}`, color: C.radar }}
                >
                  {tool.tag}
                </span>
              </div>

              <h3 className="text-[15px]" style={{ color: C.paper, fontWeight: 500 }}>
                {tool.name}
              </h3>

              <p className="text-xs mt-3" style={{ color: C.muted }}>
                {tool.description}
              </p>

              <div
                className="flex items-center justify-between mt-5 pt-3 text-xs uppercase tracking-widest"
                style={{ borderTop: `1px solid ${C.line}`, color: C.amber }}
              >
                <span>{t("common.getOnDiscord")}</span>
                <ArrowUpRight size={14} />
              </div>
            </a>
          ))}
        </section>
      </div>
    </main>
  );
}
