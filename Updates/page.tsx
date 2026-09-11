import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story behind Commander — a Generals Zero Hour community built around matches, strategy, and staying connected on and off the battlefield.",
};

export default function AboutPage() {
  return (
    <main style={{ maxWidth: "780px", margin: "0 auto", padding: "3rem 1.5rem" }}>
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
          margin: "0.5rem 0 1.5rem",
        }}
      >
        About Commander
      </h1>

      <p style={{ lineHeight: 1.7, marginBottom: "1.25rem" }}>
        Commander started as a home for Generals Zero Hour content — matches, strategy
        breakdowns, tutorials, and the kind of practical know-how that only comes from
        putting in the hours on the battlefield. Over time it grew into something bigger:
        a full headquarters for the community itself.
      </p>

      <p style={{ lineHeight: 1.7, marginBottom: "1.25rem" }}>
        Today, Commander brings together everything a Zero Hour player needs in one place —
        replays worth studying, maps and mods worth downloading, a leaderboard worth
        climbing, and a clan worth joining. Whether you're here to sharpen your build orders,
        catch up on the mod scene (ShockWave, Generals Online, and more), or just find
        people to play with, this is the place.
      </p>

      <h2 style={{ fontSize: "1.3rem", fontWeight: 600, textTransform: "uppercase", marginTop: "2.5rem", marginBottom: "1rem" }}>
        What we're about
      </h2>

      <ul style={{ lineHeight: 1.9, paddingLeft: "1.25rem", marginBottom: "1.5rem" }}>
        <li>Competitive matches, tracked and ranked — 2v2, 3v3, 4v4, and FFA</li>
        <li>Strategy and tactics content to help every player improve</li>
        <li>Tutorials and fixes for the common headaches of running an old game on modern hardware</li>
        <li>A home for mods like ShockWave and Generals Online, and the tools that support them</li>
        <li>Tournaments, replays, and a community that shows up to compete</li>
      </ul>

      <h2 style={{ fontSize: "1.3rem", fontWeight: 600, textTransform: "uppercase", marginTop: "2.5rem", marginBottom: "1rem" }}>
        Join the army
      </h2>

      <p style={{ lineHeight: 1.7 }}>
        Generals Zero Hour has stayed alive because people like you kept showing up for it.
        If that's you, there's a seat waiting in the Commander clan — jump into Discord,
        check the leaderboard, or just say hello in chat. See you on the battlefield.
      </p>
    </main>
  );
}
