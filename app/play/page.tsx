import type { Metadata } from "next";
import PlayView from "@/components/play/PlayView";

export const metadata: Metadata = {
  title: "Find a game",
  description: "See who's online and ready to play Generals Zero Hour on Commander, and challenge them to a match.",
};

export default function PlayPage() {
  return <PlayView />;
}
