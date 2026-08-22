import type { Metadata } from "next";
import { maps } from "@/lib/maps-data";
import DownloadsView from "@/components/DownloadsView";

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
    <DownloadsView
      query={query}
      currentPage={currentPage}
      totalPages={totalPages}
      start={start}
      pageMaps={pageMaps}
      totalMapsCount={maps.length}
      filteredCount={filtered.length}
      mods={MODS}
      tools={TOOLS}
    />
  );
}
