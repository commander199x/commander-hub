import type { Metadata } from "next";
import DonateView from "@/components/DonateView";

export const metadata: Metadata = {
  title: "Donate",
  description: "Support the Commander Generals Zero Hour community.",
};

export default function DonatePage() {
  return <DonateView />;
}
