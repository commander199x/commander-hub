import type { Metadata } from "next";
import MapStats from "@/components/stats/MapStats";

export const metadata: Metadata = {
  title: "Map stats",
  description: "The most played Generals Zero Hour maps on Commander, and every player's best and worst maps.",
};

export default function MapStatsPage() {
  return <MapStats />;
}
