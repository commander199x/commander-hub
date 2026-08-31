"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import "@/app/auth.css";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (success) {
    return (
      <main className="auth-page">
        <div className="auth-form">
          <h1>Password updated</h1>
          <p className="auth-switch" style={{ marginTop: 0 }}>
            Redirecting you to login...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>Set a new password</h1>

        <label htmlFor="password">New password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={9}
        />

        <label htmlFor="confirmPassword">Confirm password</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={9}
        />

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Update password"}
        </button>
      </form>
    </main>
  );
}
