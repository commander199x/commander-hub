"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";
import "@/app/auth.css";

// Real Turnstile Site Key
const TURNSTILE_SITE_KEY = "0x4AAAAAAEiHWtic0AyMmCY1";

declare global {
  interface Window {
    turnstile: any;
    onTurnstileLoadSignup: () => void;
  }
}

export default function SignupPage() {
  const supabase = createClient();
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [turnstileReady, setTurnstileReady] = useState(false);

  useEffect(() => {
    if (turnstileReady && window.turnstile && captchaRef.current && !widgetId.current) {
      widgetId.current = window.turnstile.render(captchaRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => setCaptchaToken(token),
        "expired-callback": () => setCaptchaToken(null),
      });
    }
  }, [turnstileReady]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const usernamePattern = /^[a-zA-Z0-9_]+$/;
    if (!usernamePattern.test(username)) {
      setError("Username can only contain letters, numbers, and underscores (no spaces or symbols).");
      return;
    }

    if (!captchaToken) {
      setError("Please complete the CAPTCHA.");
      return;
    }

    setLoading(true);

    // Username is passed as metadata; a database trigger creates the
    // matching profiles row (works even before email confirmation, since
    // no session exists yet at this point).
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        captchaToken,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      window.turnstile?.reset(widgetId.current ?? undefined);
      setCaptchaToken(null);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="auth-page">
        <div className="auth-form">
          <h1>Check your email</h1>
          <p className="auth-switch" style={{ marginTop: 0 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it
            to activate your account, then come back and log in.
          </p>
          <p className="auth-switch">
            Didn&apos;t get it? Check your spam folder, or{" "}
            <a href="/signup">try signing up again</a>.
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoadSignup&render=explicit"
        strategy="afterInteractive"
        onLoad={() => {
          window.onTurnstileLoadSignup = () => setTurnstileReady(true);
          if (window.turnstile) setTurnstileReady(true);
        }}
      />

      <main className="auth-page">
        <form onSubmit={handleSignup} className="auth-form">
          <h1>Create account</h1>

          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={24}
            pattern="[a-zA-Z0-9_]+"
            title="Letters, numbers, and underscores only"
          />
          <p className="auth-switch" style={{ margin: "0.2rem 0 0 0", textAlign: "left", fontSize: "0.7rem" }}>
            Letters, numbers, and underscores only.
          </p>

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={9}
          />

          <div ref={captchaRef} style={{ margin: "1rem 0" }} />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </button>

          <p className="auth-switch">
            Already have an account? <a href="/login">Log in</a>
          </p>
        </form>
      </main>
    </>
  );
}
