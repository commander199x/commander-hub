export interface YouTubeVideo {
  title: string;
  videoId: string;
  thumbnail: string;
  publishedAt: string;
  link: string;
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Fetches the latest videos from a YouTube channel's public RSS feed.
 * No API key needed. YouTube's feed only returns the ~15 most recent uploads —
 * that's a platform limitation, not something we can configure around.
 * Cached for 1 hour via Next's fetch revalidation, so we're not hitting
 * YouTube on every single page load.
 */
export async function fetchYouTubeVideos(channelId: string, limit = 12): Promise<YouTubeVideo[]> {
  if (!channelId) return [];

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

  try {
    const res = await fetch(feedUrl, { next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const xml = await res.text();
    const entries = xml.split("<entry>").slice(1);

    return entries
      .slice(0, limit)
      .map((entry) => {
        const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] ?? "";
        const rawTitle = entry.match(/<title>(.*?)<\/title>/)?.[1] ?? "Untitled";
        const publishedAt = entry.match(/<published>(.*?)<\/published>/)?.[1] ?? "";

        return {
          title: decodeXmlEntities(rawTitle),
          videoId,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          publishedAt,
          link: `https://www.youtube.com/watch?v=${videoId}`,
        };
      })
      .filter((v) => v.videoId);
  } catch {
    return [];
  }
}