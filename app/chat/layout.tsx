import type { Metadata } from "next";

// Page title and description for search engines and link previews.
export const metadata: Metadata = {
  title: "Community chat",
  description: "Talk tactics, find teammates and set up Generals Zero Hour games with the Commander community.",
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
