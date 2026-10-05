import type { Metadata } from "next";

// Page title and description for search engines and link previews.
export const metadata: Metadata = {
  title: "Season 1 Hall of Fame",
  description: "Final results of Commander Season 1: team and FFA champions, longest win streaks and most active players.",
};

export default function Season1Layout({ children }: { children: React.ReactNode }) {
  return children;
}
