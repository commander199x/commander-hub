import { NextResponse } from "next/server";

// Commander's YouTube channel ID. YouTube publishes a free, public RSS
// feed for every channel — no API key or quota needed.
const CHANNEL_ID = "UCy-BDxvj_nHw-0jnucOnaUg";
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const MAX_VIDEOS = 6;

function decodeXml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function GET() {
  try {
    // Fetched on the server (browsers can't call YouTube's feed directly
    // because of CORS), and cached for 30 minutes so we don't hit YouTube
    // on every page view.
    const res = await fetch(FEED_URL, { next: { revalidate: 1800 } });
    if (!res.ok) {
      return NextResponse.json({ videos: [] }, { status: 200 });
    }

    const xml = await res.text();
    const entries = xml.split("<entry>").slice(1);

    const videos = entries.slice(0, MAX_VIDEOS).map((entry) => {
      const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? "";
      const title = decodeXml(entry.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
      const published = entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? "";
      return { id, title, published };
    }).filter((v) => v.id);

    return NextResponse.json(
      { videos },
      { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } }
    );
  } catch {
    // Never break the homepage over a YouTube hiccup.
    return NextResponse.json({ videos: [] }, { status: 200 });
  }
}
