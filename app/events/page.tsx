import type { Metadata } from "next";
import EventsView from "@/components/events/EventsView";

export const metadata: Metadata = {
  title: "Events",
  description: "Commander clan nights, tournaments and live streams — RSVP and get a reminder before it starts.",
};

export default function EventsPage() {
  return <EventsView />;
}
