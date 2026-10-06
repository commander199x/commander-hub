import type { Metadata } from "next";
import LiveView from "@/components/live/LiveView";

export const metadata: Metadata = {
  title: "Live on TikTok",
  description: "Watch Commander live on TikTok: Generals Zero Hour ranked games, tournaments and community nights.",
};

export default function LivePage() {
  return <LiveView />;
}
