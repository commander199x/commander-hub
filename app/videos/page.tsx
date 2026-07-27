import type { Metadata } from "next";
import { Radio } from "lucide-react";
import { C } from "@/lib/theme";
import { fetchYouTubeVideos } from "@/lib/youtube";
import { tiktokVideos } from "@/lib/videos-data";
import VideosGrid, { type Video } from "@/components/VideosGrid";

export const metadata: Metadata = {
  title: "Videos",
  description: "YouTube and TikTok videos for Generals Zero Hour — guides, mods, and gameplay.",
};

const YOUTUBE_CHANNEL_ID = "UCy-BDxvj_nHw-0jnucOnaUg";

export default async function VideosPage() {
  const ytVideos = await fetchYouTubeVideos(YOUTUBE_CHANNEL_ID, 12);

  const videos: Video[] = [
    ...ytVideos.map((v) => ({
      title: v.title,
      platform: "YouTube" as const,
      description: "",
      category: "Gameplay",
      thumbnail: v.thumbnail,
      link: v.link,
    })),
    ...tiktokVideos,
  ];

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
          <span style={{ color: C.amber }}>Transmissions</span>
        </h1>

        <div
          className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 pt-6 text-xs uppercase tracking-wide"
          style={{ borderTop: `1px solid ${C.line}`, color: C.muted }}
        >
          <span>
            Log entries <b style={{ color: C.paper }}>{String(videos.length).padStart(2, "0")}</b>
          </span>
          <span>
            Status <b style={{ color: C.radar }}>Broadcasting</b>
          </span>
        </div>

        <VideosGrid videos={videos} />
      </div>
    </main>
  );
}