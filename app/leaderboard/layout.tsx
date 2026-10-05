import type { Metadata } from "next";

// Page title and description for search engines and link previews.
export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Live Generals Zero Hour ranked ladder: team and FFA ratings, win rates and recent matches from the Commander community.",
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
