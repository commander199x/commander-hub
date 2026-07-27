"use client";

import { useState, type JSX } from "react";
import { Play, ArrowUpRight, Crosshair } from "lucide-react";
import { C } from "@/lib/theme";

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

export default function VideosGrid({ videos }: { videos: Video[] }) {
  const platforms: Array<Platform | "All"> = ["All", ...Array.from(new Set(videos.map((v) => v.platform)))];
  const [filter, setFilter] = useState<Platform | "All">("All");

  const shown = filter === "All" ? videos : videos.filter((v) => v.platform === filter);

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-10">
        {platforms.map((p) => {
          const active = filter === p;
          return (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className="text-xs uppercase tracking-widest px-4 py-2 transition-colors"
              style={{
                background: active ? C.amber : "transparent",
                color: active ? C.void : C.muted,
                border: `1px solid ${active ? C.amber : C.line}`,
                fontWeight: active ? 600 : 400,
              }}
            >
              {p}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <p className="text-xs uppercase tracking-widest mt-8" style={{ color: C.muted }}>
          No videos to show here yet.
        </p>
      ) : (
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {shown.map((video, i) => (
            
            <a  key={video.link}
              href={video.link}
              target="_blank"
              rel="noopener noreferrer"
              className="cz-card group relative block"
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
                <span className="flex items-center gap-1.5" style={{ color: C.paper }}>
                  {PLATFORM_ICON[video.platform]}
                  {video.platform}
                </span>
                <span>Log {String(i + 1).padStart(2, "0")}</span>
              </div>

              <div className="relative overflow-hidden" style={{ aspectRatio: "16 / 9", background: "#000" }}>
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    style={{ filter: "grayscale(0.35) contrast(1.05)" }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ color: C.lineStrong }}>
                    <Crosshair size={28} />
                    <span className="text-[11px] tracking-widest uppercase">No feed capture</span>
                  </div>
                )}

                <span
                  className="cz-sweep pointer-events-none absolute left-0 w-full"
                  style={{ height: "40%", top: "-40%", background: `linear-gradient(180deg, transparent, ${C.amber}22, transparent)` }}
                />

                <span
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `${C.void}66` }}
                >
                  <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: C.amber }}>
                    <Play size={16} color={C.void} fill={C.void} />
                  </span>
                </span>
              </div>

              <div className="p-4">
                <span
                  className="inline-block text-[10px] uppercase tracking-widest px-2 py-1 mb-3"
                  style={{ border: `1px solid ${C.lineStrong}`, color: C.radar }}
                >
                  {video.category ?? "Field clip"}
                </span>

                <h2 className="text-[15px] leading-snug" style={{ color: C.paper, fontWeight: 500, minHeight: "3.2em" }}>
                  {video.title}
                </h2>

                <p className="text-xs mt-3" style={{ color: C.muted }}>
                  {video.description}
                </p>

                <div
                  className="flex items-center justify-between mt-5 pt-3 text-xs uppercase tracking-widest"
                  style={{ borderTop: `1px solid ${C.line}`, color: C.amber }}
                >
                  <span>Watch transmission</span>
                  <ArrowUpRight size={14} />
                </div>
              </div>
            </a>
          ))}
        </section>
      )}
    </>
  );
}