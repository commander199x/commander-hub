import type { Metadata } from "next";

// Page title and description for search engines and link previews.
export const metadata: Metadata = {
  title: "Members",
  description: "Every commander in the Commander Generals Zero Hour clan: roles, ratings and profiles.",
};

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
