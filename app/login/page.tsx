"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { AuthShell, Field, PasswordInput, DiscordButton, SubmitButton, ErrorBox, AuthLink } from "@/components/auth/AuthShell";
import "@/app/auth.css";

// Real Turnstile Site Key
const TURNSTILE_SITE_KEY = "0x4AAAAAAEiHWtic0AyMmCY1";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    turnstile: any;
    onTurnstileLoadLogin: () => void;
  }
}

// Arabic needs a native review.
const TEXT = {
  en: {
    eyebrow: "Welcome back",
    title: "Log in",
    discord: "Continue with Discord",
    redirecting: "Redirecting…",
    email: "Email",
    password: "Password",
    forgot: "Forgot password?",
    captcha: "Security check",
    submit: "Log in",
    submitting: "Logging in…",
    noAccount: "No account?",
    signup: "Sign up",
    needCaptcha: "Please complete the CAPTCHA.",
    confirmEmail: "Please confirm your email before logging in. Check your inbox for the confirmation link.",
  },
  ar: {
    eyebrow: "أهلاً بعودتك",
    title: "تسجيل الدخول",
    discord: "المتابعة عبر ديسكورد",
    redirecting: "جارٍ التحويل…",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    forgot: "نسيت كلمة المرور؟",
    captcha: "التحقق الأمني",
    submit: "دخول",
    submitting: "جارٍ الدخول…",
    noAccount: "ليس لديك حساب؟",
    signup: "أنشئ حساباً",
    needCaptcha: "يرجى إكمال التحقق.",
    confirmEmail: "يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول. تفقّد صندوق الوارد لرابط التأكيد.",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { locale } = useLanguage();
  const tx = TEXT[locale === "ar" ? "ar" : "en"];
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [turnstileReady, setTurnstileReady] = useState(false);

  useEffect(() => {
    if (turnstileReady && window.turnstile && captchaRef.current && !widgetId.current) {
      widgetId.current = window.turnstile.render(captchaRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "dark",
        callback: (token: string) => setCaptchaToken(token),
        "expired-callback": () => setCaptchaToken(null),
      });
    }
  }, [turnstileReady]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!captchaToken) {
      setError(tx.needCaptcha);
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
        setError(tx.confirmEmail);
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

  async function handleDiscordLogin() {
    setError(null);
    setDiscordLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setDiscordLoading(false);
    }
    // On success, the browser redirects to Discord — no further code runs here.
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

      <AuthShell eyebrow={tx.eyebrow} title={tx.title}>
        <DiscordButton onClick={handleDiscordLogin} loading={discordLoading} label={tx.discord} loadingLabel={tx.redirecting} />

        <form onSubmit={handleLogin} noValidate={false}>
          <Field id="email" label={tx.email}>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="czau-input" />
          </Field>

          <Field id="password" label={tx.password}>
            <PasswordInput id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <div className="mt-2 text-end text-xs">
              <AuthLink href="/forgot-password">{tx.forgot}</AuthLink>
            </div>
          </Field>

          <div className="mb-5">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em]" style={{ color: captchaToken ? C.radar : C.muted }}>
              <ShieldCheck size={13} aria-hidden="true" />
              {tx.captcha}
            </div>
            <div ref={captchaRef} className="min-h-[65px]" />
          </div>

          <ErrorBox message={error} />

          <SubmitButton loading={loading} label={tx.submit} loadingLabel={tx.submitting} />

          <p className="mt-6 text-center text-sm" style={{ color: C.muted }}>
            {tx.noAccount} <AuthLink href="/signup">{tx.signup}</AuthLink>
          </p>
        </form>
      </AuthShell>
    </>
  );
}
