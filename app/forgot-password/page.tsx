"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";
import "@/app/auth.css";

// Same Site Key used on signup/login
const TURNSTILE_SITE_KEY = "0x4AAAAAAEiHWtic0AyMmCY1";

declare global {
  interface Window {
    turnstile: any;
    onTurnstileLoadForgot: () => void;
  }
}

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [email, setEmail] = useState("");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!captchaToken) {
      setError("Please complete the CAPTCHA.");
      return;
    }

    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
      captchaToken,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
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
            If an account exists for <strong>{email}</strong>, we sent a
            password reset link. Click it to set a new password.
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoadForgot&render=explicit"
        strategy="afterInteractive"
        onLoad={() => {
          window.onTurnstileLoadForgot = () => setTurnstileReady(true);
          if (window.turnstile) setTurnstileReady(true);
        }}
      />

      <main className="auth-page">
        <form onSubmit={handleSubmit} className="auth-form">
          <h1>Reset password</h1>
          <p className="auth-switch" style={{ marginTop: 0, marginBottom: "1rem" }}>
            Enter your email and we&apos;ll send you a reset link.
          </p>

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div ref={captchaRef} style={{ margin: "1rem 0" }} />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </button>

          <p className="auth-switch">
            Remembered it? <a href="/login">Log in</a>
          </p>
        </form>
      </main>
    </>
  );
}
