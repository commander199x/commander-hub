import type { Metadata } from "next";
import { redirect } from "next/navigation";

// Short link to say on stream: commander.host/q → the stream queue, joining automatically.
export const metadata: Metadata = { title: "Join the stream queue", robots: { index: false, follow: false } };

export default function JoinQueueShortcut() {
  redirect("/live?join=1");
}
