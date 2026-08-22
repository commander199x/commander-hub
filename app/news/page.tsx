import type { Metadata } from "next";
import NewsView from "@/components/NewsView";

export const metadata: Metadata = {
  title: "News & Events",
  description: "Latest news, updates, and upcoming events for the Commander Generals Zero Hour community.",
};

export default function NewsPage() {
  return <NewsView />;
}
