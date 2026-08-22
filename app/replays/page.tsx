import type { Metadata } from "next";
import ReplaysView from "@/components/ReplaysView";

export const metadata: Metadata = {
  title: "Replay Library",
  description: "Download professional Generals Zero Hour match replays.",
};

export default function Replays() {
  return <ReplaysView />;
}
