import type { Metadata } from "next";
import HeadToHead from "@/components/stats/HeadToHead";

export const metadata: Metadata = {
  title: "Head-to-head",
  description: "Compare two Commander players: their record against each other, rating history side by side, and every shared match.",
};

export default function HeadToHeadPage() {
  return <HeadToHead />;
}
