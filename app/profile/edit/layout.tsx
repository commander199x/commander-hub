import type { Metadata } from "next";

// Page title and description for search engines and link previews.
export const metadata: Metadata = {
  title: "Edit profile",
  description: "Edit your Commander profile.",
  robots: { index: false, follow: false },
};

export default function ProfileEditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
