import type { Metadata } from "next";
import GuidesIndex from "@/components/guides/GuidesIndex";

export const metadata: Metadata = {
  title: "Strategy guides",
  description: "Generals Zero Hour strategy guides for every general: build orders, counters and tips from the Commander community, in English and Arabic.",
};

export default function GuidesPage() {
  return <GuidesIndex />;
}
