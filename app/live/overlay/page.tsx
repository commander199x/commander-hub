import type { Metadata } from "next";
import StreamOverlay from "@/components/live/StreamOverlay";

export const metadata: Metadata = { title: "Stream overlay", robots: { index: false, follow: false } };

export default function StreamOverlayPage() {
  return <StreamOverlay />;
}
