import type { Metadata } from "next";

// Page title and description for search engines and link previews.
export const metadata: Metadata = {
  title: "Tournament standings",
  description: "Champions, standings and round-by-round results from every Commander Generals Zero Hour tournament.",
};

export default function TournamentsStandingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
