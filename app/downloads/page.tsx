import type { Metadata } from "next";
import Image from "next/image";
import { Radio, Map, Swords, Wrench, Download, ArrowUpRight } from "lucide-react";
import { C, MODS_DISCORD_URL } from "@/lib/theme";
import { maps } from "@/lib/maps-data";
import MapSearch from "@/components/MapSearch";
import Pagination from "@/components/Pagination";

export const metadata: Metadata = {
  title: "Downloads",
  description: "Maps, mods and tools for Generals Zero Hour.",
};

interface Mod {
  name: string;
  description: string;
  version: string;
}

const MODS: Mod[] = [
  {
    name: "Shockwave",
    description: "Overhauled economy, new units, and rebalanced factions built for competitive play.",
    version: "v2.6.2",
  },
  {
    name: "Contra",
    description: "Total conversion — new factions, general powers, campaigns, and a fully reworked tech tree.",
    version: "v0.164",
  },
  {
    name: "Custom community mods",
    description: "Balance tweaks, map bundles, and quality-of-life fixes maintained by the Commander clan.",
    version: "Rolling",
  },
];

interface Tool {
  name: string;
  description: string;
  tag: string;
}

const TOOLS: Tool[] = [
  {
    name: "Map editor patches",
    description: "Fixes for common Worldbuilder crashes and export errors on modern Windows.",
    tag: "Utility",
  },
  {
    name: "Worldbuilder fixes",
    description: "Compatibility patches to get the original map editor running smoothly.",
    tag: "Utility",
  },
  {
    name: "Community utilities",
    description: "Small tools maintained by the community — replay viewers, stat trackers, and more.",
    tag: "Toolkit",
  },
];

const PAGE_SIZE = 12;

export default async function Downloads({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const filtered = query
    ? maps.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.description.toLowerCase().includes(query.toLowerCase())
      )
    : maps;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, parseInt(params.page ?? "1", 10) || 1), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageMaps = filtered.slice(start, start + PAGE_SIZE);

  return (
    <main className="min-h-screen w-full cz-grid-bg">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
        <div className="flex items-center gap-2 text-xs tracking-widest uppercase" style={{ color: C.radar }}>
          <Radio size={13} className="cz-live" />
          <span>Field comms &middot; Generals Zero Hour</span>
        </div>

        <h1
          className="cz-display uppercase mt-4 leading-[0.95]"
          style={{ fontSize: "clamp(2.6rem, 6vw, 4.5rem)", fontWeight: 700, letterSpacing: "0.01em" }}
        >
          Commander
          <br />
          <span style={{ color: C.amber }}>Downloads</span>
        </h1>

        <div
          className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 pt-6 text-xs uppercase tracking-wide"
          style={{ borderTop: `1px solid ${C.line}`, color: C.muted }}
        >
          <span>
            Maps <b style={{ color: C.paper }}>{String(maps.length).padStart(2, "0")}</b>
          </span>
          <span>
            Mods <b style={{ color: C.paper }}>{String(MODS.length).padStart(2, "0")}</b>
          </span>
          <span>
            Status <b style={{ color: C.radar }}>Supply lines open</b>
          </span>
        </div>

        <div className="flex items-center gap-2 mt-14 mb-2">
          <Map size={16} style={{ color: C.amber }} />
          <h2 className="cz-display uppercase text-2xl" style={{ fontWeight: 600 }}>
            Maps library
          </h2>
        </div>

        <MapSearch defaultValue={query} />

        <p className="text-[11px] uppercase tracking-widest mt-4" style={{ color: C.muted }}>
          {filtered.length === 0
            ? "No maps match that search"
            : `Showing ${start + 1}\u2013${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length}`}
        </p>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {pageMaps.map((map, i) => (
            <div
              key={map.name}
              className="cz-card group relative"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              {["top-2 left-2 border-t border-l", "top-2 right-2 border-t border-r", "bottom-2 left-2 border-b border-l", "bottom-2 right-2 border-b border-r"].map(
                (pos) => (
                  <span
                    key={pos}
                    className={`cz-bracket pointer-events-none absolute w-3 h-3 ${pos} opacity-0 transition-opacity duration-300 z-20`}
                    style={{ borderColor: C.amber }}
                  />
                )
              )}

              <div
                className="flex items-center justify-between px-4 py-2.5 text-[11px] uppercase tracking-widest"
                style={{ borderBottom: `1px solid ${C.line}`, color: C.muted }}
              >
                <span style={{ color: C.paper }}>Map pack</span>
                <span>Log {String(start + i + 1).padStart(3, "0")}</span>
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
                    Download package
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
            Mods
          </h2>
        </div>

        <p className="text-[11px] uppercase tracking-widest mb-4" style={{ color: C.muted }}>
          Distributed through our Discord &mdash; click through to grab the current build
        </p>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODS.map((mod) => (
            <a
              key={mod.name}
              href={MODS_DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="cz-card group relative block p-5"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              {["top-2 left-2 border-t border-l", "top-2 right-2 border-t border-r", "bottom-2 left-2 border-b border-l", "bottom-2 right-2 border-b border-r"].map(
                (pos) => (
                  <span
                    key={pos}
                    className={`cz-bracket pointer-events-none absolute w-3 h-3 ${pos} opacity-0 transition-opacity duration-300`}
                    style={{ borderColor: C.amber }}
                  />
                )
              )}

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
                <span>Get on Discord</span>
                <ArrowUpRight size={14} />
              </div>
            </a>
          ))}
        </section>

        <div className="flex items-center gap-2 mt-16 mb-6">
          <Wrench size={16} style={{ color: C.amber }} />
          <h2 className="cz-display uppercase text-2xl" style={{ fontWeight: 600 }}>
            Tools &amp; files
          </h2>
        </div>

        <p className="text-[11px] uppercase tracking-widest mb-4" style={{ color: C.muted }}>
          Distributed through our Discord &mdash; click through to grab the current build
        </p>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
          {TOOLS.map((tool) => (
            <a
              key={tool.name}
              href={MODS_DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="cz-card group relative block p-5"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              {["top-2 left-2 border-t border-l", "top-2 right-2 border-t border-r", "bottom-2 left-2 border-b border-l", "bottom-2 right-2 border-b border-r"].map(
                (pos) => (
                  <span
                    key={pos}
                    className={`cz-bracket pointer-events-none absolute w-3 h-3 ${pos} opacity-0 transition-opacity duration-300`}
                    style={{ borderColor: C.amber }}
                  />
                )
              )}

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
                <span>Get on Discord</span>
                <ArrowUpRight size={14} />
              </div>
            </a>
          ))}
        </section>
      </div>
    </main>
  );
}
