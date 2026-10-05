import type { Metadata } from "next";
import AboutView from "@/components/about/AboutView";
import "@/app/animations.css";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story behind Commander — a Generals Zero Hour community built around matches, strategy, and staying connected on and off the battlefield.",
};

export default function AboutPage() {
  return <AboutView />;
}
