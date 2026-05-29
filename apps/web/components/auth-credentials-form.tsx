"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  isSupabaseConfigured,
  resetPasswordErrorMessage,
  signInErrorMessage,
  signUpErrorMessage,
} from "@/lib/auth-errors";

const RESEND_COOLDOWN_SEC = 60;

const inputStyle = {
  border: "1px solid var(--border)",
  minHeight: 44,
  padding: "0 12px",
  width: "100%",
};

type AuthMode = "signin" | "signup" | "forgot";

function PasswordInput({
  autoComplete,
  onChange,
  placeholder,
  required = true,
  value,
}: {
  autoComplete: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  value: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <input
        autoComplete={autoComplete}
        className="panel"
        minLength={8}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        style={{ ...inputStyle, paddingRight: 72 }}
        type={visible ? "text" : "password"}
        value={value}
      />
      <button
        aria-label={visible ? "Hide password" : "Show password"}
        className="button-secondary"
        onClick={() => setVisible((current) => !current)}
        style={{
          minHeight: 44,
          padding: "0 12px",
          position: "absolute",
          right: 0,
          top: 0,
        }}
        type="button"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export function AuthCredentialsForm({
  defaultEmail = "",
  defaultMode = "signin",
  description = "Sign in with your email and password.",
  heading = "Log in",
  next,
  showConfirmedBanner = false,
}: {
  defaultEmail?: string;
  defaultMode?: "signin" | "signup";
  description?: string;
  heading?: string;
  next?: string | null;
  showConfirmedBanner?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [signupComplete, setSignupComplete] = useState(false);
  const [showUnconfirmedResend, setShowUnconfirmedResend] = useState(false);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  useEffect(() => {
    setEmail(defaultEmail);
  }, [defaultEmail]);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setResendCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setInfo("");
    setPassword("");
    setConfirmPassword("");
    setSignupComplete(false);
    setShowUnconfirmedResend(false);
  }

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setShowUnconfirmedResend(false);

    if (!isSupabaseConfigured()) {
      setError(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in apps/web/.env.local, then restart the dev server.",
      );
      return;
    }

    setIsSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setIsSubmitting(false);
      setError(signInErrorMessage(signInError.message));
      if (signInError.message.toLowerCase().includes("email not confirmed")) {
        setShowUnconfirmedResend(true);
      }
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setIsSubmitting(false);
      setError("Sign-in succeeded but the session was not ready. Try again.");
      return;
    }

    try {
      const query = next ? `?next=${encodeURIComponent(next)}` : "";
      const response = await fetch(`/api/auth/post-login${query}`);
      if (!response.ok) {
        router.push("/founder/checkout");
        return;
      }
      const payload = (await response.json()) as { path: string };
      router.push(payload.path);
    } catch {
      router.push("/founder/checkout");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isSupabaseConfigured()) {
      setError(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in apps/web/.env.local, then restart the dev server.",
      );
      return;
    }

    setIsSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpErrorMessage(signUpError.message));
      return;
    }

    // Supabase returns success with empty identities when email already exists — no email sent.
    if (data.user?.identities?.length === 0) {
      setError(
        "An account with this email already exists. Try signing in. If you never confirmed it, use “Resend confirmation” on the Sign in tab.",
      );
      setMode("signin");
      setShowUnconfirmedResend(true);
      return;
    }

    setSignupComplete(true);
    setInfo(`Check your email to confirm ${email.trim()} before signing in.`);
    setResendCooldown(RESEND_COOLDOWN_SEC);
  }

  async function handleForgotPassword(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!isSupabaseConfigured()) {
      setError(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in apps/web/.env.local, then restart the dev server.",
      );
      return;
    }

    setIsSubmitting(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-password`,
    });

    setIsSubmitting(false);

    if (resetError) {
      setError(resetPasswordErrorMessage(resetError.message));
      return;
    }

    setInfo(`If an account exists for ${email.trim()}, we sent a password reset link.`);
  }

  async function handleResendConfirmation() {
    if (resendCooldown > 0 || isSubmitting) {
      return;
    }

    setError("");
    setInfo("");
    setIsSubmitting(true);

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    setIsSubmitting(false);

    if (resendError) {
      setError(signUpErrorMessage(resendError.message));
      return;
    }

    setInfo(`Confirmation email resent to ${email.trim()}.`);
    setResendCooldown(RESEND_COOLDOWN_SEC);
  }

  const tabButtonStyle = (active: boolean) => ({
    background: active ? "var(--navy)" : "transparent",
    border: "1px solid var(--border)",
    borderRadius: 7,
    color: active ? "white" : "var(--navy)",
    cursor: "pointer",
    flex: 1,
    fontWeight: 700,
    minHeight: 44,
    padding: "0 12px",
  });

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <header>
        <h1 style={{ marginBottom: 8, marginTop: 0 }}>{heading}</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>{description}</p>
      </header>

      {showConfirmedBanner && mode === "signin" ? (
        <div
          role="status"
          style={{
            background: "#eef5f1",
            border: "1px solid var(--border)",
            borderRadius: 7,
            color: "var(--green)",
            fontWeight: 700,
            padding: "12px 14px",
          }}
        >
          Email confirmed — you can sign in now.
        </div>
      ) : null}

      {mode !== "forgot" ? (
        <div role="tablist" aria-label="Authentication mode" style={{ display: "flex", gap: 8 }}>
          <button
            aria-selected={mode === "signin"}
            onClick={() => switchMode("signin")}
            role="tab"
            style={tabButtonStyle(mode === "signin")}
            type="button"
          >
            Sign in
          </button>
          <button
            aria-selected={mode === "signup"}
            onClick={() => switchMode("signup")}
            role="tab"
            style={tabButtonStyle(mode === "signup")}
            type="button"
          >
            Create account
          </button>
        </div>
      ) : null}

      {mode === "signin" ? (
        <form onSubmit={(event) => void handleSignIn(event)} style={{ display: "grid", gap: 14 }}>
          <input
            autoComplete="email"
            className="panel"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@business.com"
            required
            style={inputStyle}
            type="email"
            value={email}
          />
          <PasswordInput
            autoComplete="current-password"
            onChange={setPassword}
            placeholder="Password"
            value={password}
          />
          {error ? <div style={{ color: "#b42318", fontWeight: 700 }}>{error}</div> : null}
          {info ? <div style={{ color: "var(--green)", fontWeight: 700 }}>{info}</div> : null}
          <button className="button-primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
            <button
              className="button-secondary"
              onClick={() => switchMode("forgot")}
              style={{ minHeight: 44, padding: "0 12px" }}
              type="button"
            >
              Forgot password?
            </button>
            <Link href="/founder/checkout" style={{ color: "var(--green)", fontWeight: 700, lineHeight: "44px" }}>
              Become a Founder
            </Link>
          </div>
          {showUnconfirmedResend ? (
            <div style={{ display: "grid", gap: 8 }}>
              <p style={{ color: "var(--muted)", margin: 0 }}>
                Didn&apos;t get the email? Resend confirmation.
              </p>
              <button
                className="button-secondary"
                disabled={resendCooldown > 0 || isSubmitting}
                onClick={() => void handleResendConfirmation()}
                type="button"
              >
                {resendCooldown > 0 ? `Resend confirmation (${resendCooldown}s)` : "Resend confirmation"}
              </button>
            </div>
          ) : null}
        </form>
      ) : null}

      {mode === "signup" ? (
        signupComplete ? (
          <div style={{ display: "grid", gap: 14 }}>
            {info ? <div style={{ color: "var(--green)", fontWeight: 700 }}>{info}</div> : null}
            {error ? <div style={{ color: "#b42318", fontWeight: 700 }}>{error}</div> : null}
            <button
              className="button-secondary"
              disabled={resendCooldown > 0 || isSubmitting}
              onClick={() => void handleResendConfirmation()}
              type="button"
            >
              {resendCooldown > 0 ? `Resend confirmation (${resendCooldown}s)` : "Resend confirmation"}
            </button>
            <button className="button-secondary" onClick={() => switchMode("signin")} type="button">
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={(event) => void handleSignUp(event)} style={{ display: "grid", gap: 14 }}>
            <input
              autoComplete="email"
              className="panel"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@business.com"
              required
              style={inputStyle}
              type="email"
              value={email}
            />
            <PasswordInput
              autoComplete="new-password"
              onChange={setPassword}
              placeholder="Password"
              value={password}
            />
            <p style={{ color: "var(--muted)", fontSize: 13, margin: "-6px 0 0" }}>At least 8 characters</p>
            <PasswordInput
              autoComplete="new-password"
              onChange={setConfirmPassword}
              placeholder="Confirm password"
              value={confirmPassword}
            />
            {error ? <div style={{ color: "#b42318", fontWeight: 700 }}>{error}</div> : null}
            {info ? <div style={{ color: "var(--green)", fontWeight: 700 }}>{info}</div> : null}
            <button className="button-primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>
        )
      ) : null}

      {mode === "forgot" ? (
        <form onSubmit={(event) => void handleForgotPassword(event)} style={{ display: "grid", gap: 14 }}>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Enter your email and we&apos;ll send a password reset link.
          </p>
          <input
            autoComplete="email"
            className="panel"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@business.com"
            required
            style={inputStyle}
            type="email"
            value={email}
          />
          {error ? <div style={{ color: "#b42318", fontWeight: 700 }}>{error}</div> : null}
          {info ? <div style={{ color: "var(--green)", fontWeight: 700 }}>{info}</div> : null}
          <button className="button-primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Sending..." : "Send reset link"}
          </button>
          <button className="button-secondary" onClick={() => switchMode("signin")} type="button">
            Back to sign in
          </button>
        </form>
      ) : null}
    </div>
  );
}
