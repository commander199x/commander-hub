import type { Metadata } from "next";
import TournamentsView from "@/components/TournamentsView";

export const metadata: Metadata = {
  title: "Tournaments",
  description: "Events, rankings and clan wars for the Generals Zero Hour community.",
};

export default function Tournaments() {
  return <TournamentsView />;
}
