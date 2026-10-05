import type { Metadata } from "next";

// Page title and description for search engines and link previews.
export const metadata: Metadata = {
  title: "Set a new password",
  description: "Set a new Commander password.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
