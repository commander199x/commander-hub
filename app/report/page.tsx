import type { Metadata } from "next";
import ReportView from "@/components/report/ReportView";

export const metadata: Metadata = {
  title: "Report a result",
  description: "Report your Commander match result for confirmation.",
  robots: { index: false, follow: false },
};

export default function ReportPage() {
  return <ReportView />;
}
