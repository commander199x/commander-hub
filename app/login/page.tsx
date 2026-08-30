"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";
import "@/app/auth.css";

// Same Site Key as the signup page
const TURNSTILE_SITE_KEY = "0x4AAAAAAEiHWtic0AyMmCY1";

declare global {
  interface Window {
    turnstile: any;
    onTurnstileLoadLogin: () => void;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!captchaToken) {
      setError("Please complete the CAPTCHA.");
      return;
    }

    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    });

    setLoading(false);

    if (loginError) {
      if (loginError.message.toLowerCase().includes("email not confirmed")) {
        setError("Please confirm your email before logging in. Check your inbox for the confirmation link.");
      } else {
        setError(loginError.message);
      }
      window.turnstile?.reset(widgetId.current ?? undefined);
      setCaptchaToken(null);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoadLogin&render=explicit"
        strategy="afterInteractive"
        onLoad={() => {
          window.onTurnstileLoadLogin = () => setTurnstileReady(true);
          if (window.turnstile) setTurnstileReady(true);
        }}
      />

      <main className="auth-page">
        <form onSubmit={handleLogin} className="auth-form">
          <h1>Log in</h1>

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
          />

          <div ref={captchaRef} style={{ margin: "1rem 0" }} />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>

          <p className="auth-switch">
            No account? <a href="/signup">Sign up</a>
          </p>
        </form>
      </main>
    </>
  );
}
