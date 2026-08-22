import type { Metadata } from "next";
import { fetchYouTubeVideos } from "@/lib/youtube";
import { tiktokVideos } from "@/lib/videos-data";
import VideosView from "@/components/VideosView";
import type { Video } from "@/components/VideosGrid";

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

  return <VideosView videos={videos} />;
}
