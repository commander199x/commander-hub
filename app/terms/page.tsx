import type { Metadata } from "next";
import { DISCORD_URL } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules for using Commander.",
};

export default function TermsPage() {
  return (
    <main style={{ maxWidth: "780px", margin: "0 auto", padding: "3rem 1.5rem", lineHeight: 1.7 }}>
      <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "#888" }}>
        Legal
      </span>
      <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 700, textTransform: "uppercase", margin: "0.5rem 0 0.5rem" }}>
        Terms of Service
      </h1>
      <p style={{ fontSize: "0.8rem", color: "#666", marginBottom: "2rem" }}>Last updated: September 2026</p>

      <p style={{ marginBottom: "1.25rem" }}>
        By creating an account or using Commander, you agree to these terms. They exist to
        keep the community fair and the site running smoothly for everyone.
      </p>

      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, textTransform: "uppercase", marginTop: "2rem", marginBottom: "0.75rem" }}>
        Fan project, not official
      </h2>
      <p style={{ marginBottom: "1rem" }}>
        Commander is an independent, fan-run community site for Command & Conquer: Generals –
        Zero Hour. We are not affiliated with, endorsed by, or connected to Electronic Arts or
        any official rights holder of the game. All game names, trademarks, and assets belong
        to their respective owners.
      </p>

      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, textTransform: "uppercase", marginTop: "2rem", marginBottom: "0.75rem" }}>
        Your account
      </h2>
      <p style={{ marginBottom: "1rem" }}>
        You're responsible for keeping your account credentials secure and for anything that
        happens under your account. Usernames must be your own — impersonating another player
        or staff member isn't allowed.
      </p>

      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, textTransform: "uppercase", marginTop: "2rem", marginBottom: "0.75rem" }}>
        Community conduct
      </h2>
      <ul style={{ paddingLeft: "1.25rem", marginBottom: "1rem" }}>
        <li>No cheating, exploiting bugs, or manipulating match results.</li>
        <li>No harassment, hate speech, or abusive behavior toward other members, in chat or elsewhere on the site.</li>
        <li>No spam or attempts to disrupt the site or Discord.</li>
      </ul>
      <p style={{ marginBottom: "1rem" }}>
        Admins may warn, ban, or remove content from users who break these rules, at their
        discretion.
      </p>

      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, textTransform: "uppercase", marginTop: "2rem", marginBottom: "0.75rem" }}>
        Match results and leaderboard
      </h2>
      <p style={{ marginBottom: "1rem" }}>
        Match results, ratings, and leaderboard standings are logged and maintained by admins
        on a best-effort basis. While we aim for accuracy, we don't guarantee the leaderboard
        is error-free, and admins may correct, adjust, or remove entries as needed.
      </p>

      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, textTransform: "uppercase", marginTop: "2rem", marginBottom: "0.75rem" }}>
        Your content
      </h2>
      <p style={{ marginBottom: "1rem" }}>
        You keep ownership of content you post (bios, chat messages, submitted replays), but
        by posting it you allow us to display it on the site as part of normal operation. We
        may remove content that violates these terms.
      </p>

      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, textTransform: "uppercase", marginTop: "2rem", marginBottom: "0.75rem" }}>
        Donations
      </h2>
      <p style={{ marginBottom: "1rem" }}>
        Donations are voluntary and go toward hosting, tournament prizes, and community
        tools as described on our Donate page. Donations are non-refundable.
      </p>

      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, textTransform: "uppercase", marginTop: "2rem", marginBottom: "0.75rem" }}>
        No warranty
      </h2>
      <p style={{ marginBottom: "1rem" }}>
        Commander is provided as-is, run by volunteers in our spare time. We don't guarantee
        the site will always be available, error-free, or uninterrupted.
      </p>

      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, textTransform: "uppercase", marginTop: "2rem", marginBottom: "0.75rem" }}>
        Changes to these terms
      </h2>
      <p style={{ marginBottom: "1rem" }}>
        We may update these terms from time to time. Continued use of the site after changes
        means you accept the updated terms.
      </p>

      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, textTransform: "uppercase", marginTop: "2rem", marginBottom: "0.75rem" }}>
        Questions
      </h2>
      <p>
        Reach out to us on{" "}
        <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#f5a623" }}>
          Discord
        </a>{" "}
        with any questions about these terms.
      </p>
    </main>
  );
}