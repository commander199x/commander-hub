import type { Metadata } from "next";
import JoinView from "@/components/JoinView";

export const metadata: Metadata = {
  title: "Join Our Team",
  description: "Apply to join the Commander Generals Zero Hour clan.",
};

export default function JoinPage() {
  return <JoinView />;
}
