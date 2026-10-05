import type { Metadata } from "next";
import SeasonsView from "@/components/seasons/SeasonsView";

export const metadata: Metadata = {
  title: "Seasons",
  description: "Every Commander ranked season: champions, Hall of Fame and live standings for the current Generals Zero Hour season.",
};

export default function SeasonsPage() {
  return <SeasonsView />;
}
