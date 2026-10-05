import type { Metadata } from "next";
import GeneralsMeta from "@/components/stats/GeneralsMeta";

export const metadata: Metadata = {
  title: "Generals meta",
  description: "Which Generals Zero Hour generals win most: pick rates, win rates and matchups from real Commander ranked matches.",
};

export default function GeneralsMetaPage() {
  return <GeneralsMeta />;
}
