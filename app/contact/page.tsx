import type { Metadata } from "next";
import ContactView from "@/components/contact/ContactView";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Commander team on Discord.",
};

export default function ContactPage() {
  return <ContactView />;
}
