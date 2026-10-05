import type { Metadata } from "next";

// Page title and description for search engines and link previews.
export const metadata: Metadata = {
  title: "Reset password",
  description: "Reset your Commander password.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
