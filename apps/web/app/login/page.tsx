"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${SITE_URL}/auth/callback`,
      },
    });

    setIsSubmitting(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }

    setMessage("Check your email for a magic link to sign in.");
  }

  return (
    <AppShell>
      <div className="panel" style={{ display: "grid", gap: 18, margin: "48px auto", maxWidth: 520, padding: 24 }}>
        <header>
          <h1 style={{ marginBottom: 8, marginTop: 0 }}>Log in</h1>
          <p style={{ color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>
            We will email you a magic link. No password required.
          </p>
        </header>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <input
            className="panel"
            placeholder="you@business.com"
            required
            style={inputStyle}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {error ? <div style={{ color: "#b42318", fontWeight: 700 }}>{error}</div> : null}
          {message ? <div style={{ color: "var(--green)", fontWeight: 700 }}>{message}</div> : null}
          <button className="button-primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Sending..." : "Send magic link"}
          </button>
        </form>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          New here?{" "}
          <Link href="/founder/checkout" style={{ color: "var(--green)", fontWeight: 700 }}>
            Become a Founder
          </Link>
        </p>
      </div>
    </AppShell>
  );
}

const inputStyle = {
  border: "1px solid var(--border)",
  minHeight: 44,
  padding: "0 12px",
  width: "100%",
};
