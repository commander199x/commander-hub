import type { Metadata } from "next";
import { DISCORD_URL } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Commander collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main style={{ maxWidth: "780px", margin: "0 auto", padding: "3rem 1.5rem", lineHeight: 1.7 }}>
      <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "#888" }}>
        Legal
      </span>
      <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 700, textTransform: "uppercase", margin: "0.5rem 0 0.5rem" }}>
        Privacy Policy
      </h1>
      <p style={{ fontSize: "0.8rem", color: "#666", marginBottom: "2rem" }}>Last updated: September 2026</p>

      <p style={{ marginBottom: "1.25rem" }}>
        This page explains what information Commander collects when you use this site, how
        it's used, and how you can control it. We keep this simple: we're a community project,
        not a data business — we don't sell your information, and we don't run ads.
      </p>

      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, textTransform: "uppercase", marginTop: "2rem", marginBottom: "0.75rem" }}>
        Information we collect
      </h2>
      <ul style={{ paddingLeft: "1.25rem", marginBottom: "1rem" }}>
        <li><b>Account information</b> — your email address, username, and password when you sign up. Passwords are handled securely by our authentication provider (Supabase) and are never visible to us in plain text.</li>
        <li><b>Profile information</b> — anything you choose to add, like an avatar or bio.</li>
        <li><b>Activity data</b> — match results, win/loss records, and chat messages you post on the site, since these are core to how the leaderboard and community features work.</li>
        <li><b>Basic usage analytics</b> — we use Vercel Analytics, a privacy-friendly, cookieless analytics tool, to understand which pages are used. It doesn't track you individually across other websites.</li>
      </ul>

      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, textTransform: "uppercase", marginTop: "2rem", marginBottom: "0.75rem" }}>
        How we use it
      </h2>
      <p style={{ marginBottom: "1rem" }}>
        We use your information to run your account, display your profile and match history,
        keep the leaderboard accurate, send account-related emails (like email confirmation or
        password resets, via our email provider Resend), and moderate the community (e.g.
        enforcing bans for rule violations).
      </p>

      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, textTransform: "uppercase", marginTop: "2rem", marginBottom: "0.75rem" }}>
        Third-party services
      </h2>
      <p style={{ marginBottom: "1rem" }}>
        We rely on a small number of trusted third-party services to run the site:
        Supabase (accounts, database, and authentication), Vercel (hosting and analytics),
        Resend (transactional emails), and Cloudflare Turnstile (bot/spam protection on our
        signup and login forms). Each of these providers processes data only as needed to
        provide their service to us.
      </p>

      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, textTransform: "uppercase", marginTop: "2rem", marginBottom: "0.75rem" }}>
        Data retention and deletion
      </h2>
      <p style={{ marginBottom: "1rem" }}>
        We keep your account information for as long as your account exists. If you'd like
        your account and associated personal data deleted, message an admin on our Discord
        and we'll take care of it.
      </p>

      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, textTransform: "uppercase", marginTop: "2rem", marginBottom: "0.75rem" }}>
        Children's privacy
      </h2>
      <p style={{ marginBottom: "1rem" }}>
        Commander is not intended for children under 13. We don't knowingly collect
        information from anyone under that age.
      </p>

      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, textTransform: "uppercase", marginTop: "2rem", marginBottom: "0.75rem" }}>
        Changes to this policy
      </h2>
      <p style={{ marginBottom: "1rem" }}>
        If this policy changes, we'll update this page and the "last updated" date above.
      </p>

      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, textTransform: "uppercase", marginTop: "2rem", marginBottom: "0.75rem" }}>
        Questions
      </h2>
      <p>
        For any privacy questions or requests, reach out to us on{" "}
        <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#f5a623" }}>
          Discord
        </a>
        .
      </p>
    </main>
  );
}