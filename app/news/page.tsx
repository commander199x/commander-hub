import type { Metadata } from "next";
import { Radio } from "lucide-react";
import { C } from "@/lib/theme";
import LiveBanner from "@/components/LiveBanner";
import NewsFeed from "@/components/NewsFeed";

export const metadata: Metadata = {
  title: "News & Events",
  description: "Latest news, updates, and upcoming events for the Commander Generals Zero Hour community.",
};

export default function NewsPage() {
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
          News
          <br />
          <span style={{ color: C.amber }}>&amp; Events</span>
        </h1>

        <div className="mt-8">
          <LiveBanner />
        </div>

        <div className="mt-10">
          <NewsFeed />
        </div>
      </div>
    </main>
  );
}