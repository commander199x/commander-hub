"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { ShieldCheck, Check, Circle, MailCheck } from "lucide-react";
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
    onTurnstileLoadSignup: () => void;
  }
}

// Arabic needs a native review.
const TEXT = {
  en: {
    eyebrow: "Enlist",
    title: "Create account",
    discord: "Continue with Discord",
    redirecting: "Redirecting…",
    username: "Username",
    ruleLen: "3–24 characters",
    ruleChars: "Letters, numbers and underscores only",
    email: "Email",
    password: "Password",
    strength: ["Too short", "Weak", "Fair", "Good", "Strong"],
    minPass: "At least 9 characters",
    captcha: "Security check",
    submit: "Sign up",
    submitting: "Creating account…",
    haveAccount: "Already have an account?",
    login: "Log in",
    badUsername: "Username can only contain letters, numbers, and underscores (no spaces or symbols).",
    needCaptcha: "Please complete the CAPTCHA.",
    checkTitle: "Check your email",
    checkText: (e: string) => `We sent a confirmation link to ${e}. Click it to activate your account, then come back and log in.`,
    spam: "Didn't get it? Check your spam folder, or",
    again: "try signing up again",
  },
  ar: {
    eyebrow: "التجنيد",
    title: "إنشاء حساب",
    discord: "المتابعة عبر ديسكورد",
    redirecting: "جارٍ التحويل…",
    username: "اسم المستخدم",
    ruleLen: "من 3 إلى 24 حرفاً",
    ruleChars: "حروف إنجليزية وأرقام وشرطة سفلية فقط",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    strength: ["قصيرة جداً", "ضعيفة", "مقبولة", "جيدة", "قوية"],
    minPass: "9 أحرف على الأقل",
    captcha: "التحقق الأمني",
    submit: "إنشاء الحساب",
    submitting: "جارٍ إنشاء الحساب…",
    haveAccount: "لديك حساب بالفعل؟",
    login: "سجّل الدخول",
    badUsername: "يمكن أن يحتوي اسم المستخدم على حروف وأرقام وشرطة سفلية فقط (بدون مسافات أو رموز).",
    needCaptcha: "يرجى إكمال التحقق.",
    checkTitle: "تفقّد بريدك",
    checkText: (e: string) => `أرسلنا رابط تأكيد إلى ${e}. اضغط عليه لتفعيل حسابك، ثم عُد وسجّل الدخول.`,
    spam: "لم يصلك؟ تفقّد مجلد الرسائل غير المرغوبة، أو",
    again: "حاول التسجيل مرة أخرى",
  },
};

function strengthOf(pw: string) {
  if (pw.length < 9) return 0;
  let s = 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) s++;
  return Math.min(4, s);
}
const STRENGTH_COLORS = ["#F87171", "#F87171", "#E8A63D", "#8FBF4F", "#8FBF4F"];

export default function SignupPage() {
  const supabase = createClient();
  const { locale } = useLanguage();
  const tx = TEXT[locale === "ar" ? "ar" : "en"];
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const usernamePattern = /^[a-zA-Z0-9_]+$/;
    if (!usernamePattern.test(username)) {
      setError(tx.badUsername);
      return;
    }

    if (!captchaToken) {
      setError(tx.needCaptcha);
      return;
    }

    setLoading(true);

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

  async function handleDiscordSignup() {
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

  if (submitted) {
    return (
      <AuthShell eyebrow={tx.eyebrow} title={tx.checkTitle}>
        <div className="czau-in border p-6 text-center" style={{ borderColor: C.amberDim, background: "linear-gradient(160deg, rgba(232,166,61,0.10), #12150E 60%)" }}>
          <span className="czau-pop mx-auto flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "rgba(143,191,79,0.12)", border: `1px solid ${C.radar}`, boxShadow: "0 0 30px rgba(143,191,79,0.25)" }}>
            <MailCheck size={36} style={{ color: C.radar }} aria-hidden="true" />
          </span>
          <p className="mt-5 text-base leading-relaxed">{tx.checkText(email)}</p>
          <p className="mt-4 text-sm" style={{ color: C.muted }}>
            {tx.spam} <AuthLink href="/signup">{tx.again}</AuthLink>.
          </p>
        </div>
      </AuthShell>
    );
  }

  const lenOk = username.length >= 3 && username.length <= 24;
  const charsOk = username.length > 0 && /^[a-zA-Z0-9_]+$/.test(username);
  const strength = strengthOf(password);

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

      <AuthShell eyebrow={tx.eyebrow} title={tx.title}>
        <DiscordButton onClick={handleDiscordSignup} loading={discordLoading} label={tx.discord} loadingLabel={tx.redirecting} />

        <form onSubmit={handleSignup}>
          <Field
            id="username"
            label={tx.username}
            hint={
              <ul className="flex flex-col gap-1">
                {[
                  [lenOk, tx.ruleLen],
                  [charsOk, tx.ruleChars],
                ].map(([ok, text]) => (
                  <li key={String(text)} className="flex items-center gap-2 transition-colors" style={{ color: ok ? C.radar : C.muted }}>
                    {ok ? <Check size={13} className="czau-pop" aria-hidden="true" /> : <Circle size={11} aria-hidden="true" />}
                    {text}
                  </li>
                ))}
              </ul>
            }
          >
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={24}
              pattern="[a-zA-Z0-9_]+"
              title="Letters, numbers, and underscores only"
              className="czau-input"
              dir="ltr"
            />
          </Field>

          <Field id="email" label={tx.email}>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="czau-input" />
          </Field>

          <Field
            id="password"
            label={tx.password}
            hint={
              <div>
                <div className="flex gap-1" dir="ltr" aria-hidden="true">
                  {[1, 2, 3, 4].map((n) => (
                    <span key={n} className="h-1.5 flex-1 transition-colors duration-300" style={{ background: password && strength >= n ? STRENGTH_COLORS[strength] : C.line }} />
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between">
                  <span>{tx.minPass}</span>
                  {password && <span style={{ color: STRENGTH_COLORS[strength], fontWeight: 600 }}>{tx.strength[strength]}</span>}
                </div>
              </div>
            }
          >
            <PasswordInput id="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={9} />
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
            {tx.haveAccount} <AuthLink href="/login">{tx.login}</AuthLink>
          </p>
        </form>
      </AuthShell>
    </>
  );
}
