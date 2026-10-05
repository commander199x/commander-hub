import type { Metadata } from "next";
import { C, DISCORD_URL } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Commander team on Discord.",
};

export default function ContactPage() {
  return (
    <main
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "4rem 1.5rem",
        textAlign: "center",
      }}
    >
      <span
        style={{
          fontSize: "0.7rem",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          color: "#888",
        }}
      >
        Field Comms
      </span>

      <h1
        style={{
          fontSize: "clamp(2rem, 5vw, 2.8rem)",
          fontWeight: 700,
          textTransform: "uppercase",
          margin: "0.5rem 0 1.25rem",
        }}
      >
        Contact Us
      </h1>

      <p style={{ lineHeight: 1.7, color: C.muted, marginBottom: "2rem" }}>
        Questions, bug reports, ban appeals, tournament ideas, or anything else — the
        fastest way to reach the Commander team is on Discord. Admins and mods are active
        there and usually respond quickly.
      </p>

      <a
        href={DISCORD_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          background: C.amber,
          color: C.void,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontSize: "0.85rem",
          padding: "0.9rem 2rem",
          textDecoration: "none",
        }}
      >
        Join our Discord
      </a>

      <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "2rem" }}>
        Once you're in, check the #support or #general channel and someone will help you
        out.
      </p>
    </main>
  );
}