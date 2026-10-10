import type { Metadata } from "next";
import AchievementsView from "@/components/achievements/AchievementsView";

export const metadata: Metadata = {
  title: "Achievements",
  description: "Every Commander achievement for Generals Zero Hour players — from First Blood to Twelve Commands — and how rare each one is.",
};

export default function AchievementsPage() {
  return <AchievementsView />;
}
