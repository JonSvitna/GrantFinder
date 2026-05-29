# Email + Password Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace OTP/magic-link login with email + password authentication via Supabase Auth — tabs on `/login`, forgot-password flow, reset page, and updated founder welcome copy.

**Architecture:** Client-side `AuthCredentialsForm` calls Supabase `signUp`, `signInWithPassword`, `resetPasswordForEmail`, and `resend`. Email confirmation and password recovery still exchange codes at `/auth/callback` (narrowed to those flows only). Successful password sign-in reuses existing `resolvePostLoginPath`. Error mappers live in `auth-errors.ts`.

**Tech Stack:** Next.js 16 App Router, React 19, `@supabase/ssr` + `@supabase/supabase-js`, existing CSS vars (`--border`, `--green`, `--navy`, `--muted`), `resolvePostLoginPath` from `@/lib/post-login-routing`.

**Spec:** `docs/superpowers/specs/2026-05-28-email-password-auth-design.md`

---

## File Structure

```text
apps/web/
  lib/
    auth-errors.ts                    # NEW — signIn/signUp/reset error mappers + isSupabaseConfigured
    post-login-routing.ts             # unchanged — resolvePostLoginPath
  components/
    auth-credentials-form.tsx         # NEW — tabs, sign-in, sign-up, forgot-password
    auth-otp-form.tsx                 # DELETE
    founder-tier-card.tsx             # MODIFY — email + password copy
  app/
    login/page.tsx                    # MODIFY — AuthCredentialsForm, URL param handling
    auth/
      callback/route.ts               # MODIFY — confirmation vs recovery redirects
      reset-password/page.tsx         # NEW — set new password after recovery link
    founder/welcome/page.tsx          # MODIFY — AuthCredentialsForm instead of OTP
```

No API changes. No new env vars.

---

## Task 1: Auth error mappers

**Files:**
- Create: `apps/web/lib/auth-errors.ts`

- [ ] **Step 1: Create auth-errors.ts**

```typescript
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return (
    Boolean(url && anonKey) &&
    !url.includes("placeholder") &&
    !anonKey.includes("placeholder") &&
    url.includes("supabase.co")
  );
}

export function signInErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return "Email or password is incorrect.";
  }
  if (lower.includes("email not confirmed")) {
    return "Check your inbox and confirm your email before signing in.";
  }
  if (lower.includes("rate") || lower.includes("too many")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (lower.includes("invalid api key")) {
    return "Copy fresh anon key from Supabase into `.env.local` and restart dev server.";
  }
  if (lower.includes("email") && lower.includes("invalid")) {
    return "That email address looks invalid. Check for typos and try again.";
  }
  return message;
}

export function signUpErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("already registered") ||
    lower.includes("already exists") ||
    lower.includes("user already registered")
  ) {
    return "An account with this email already exists. Try signing in.";
  }
  if (lower.includes("password") && (lower.includes("short") || lower.includes("least"))) {
    return "Password must be at least 8 characters.";
  }
  if (lower.includes("rate") || lower.includes("too many")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (lower.includes("invalid api key")) {
    return "Copy fresh anon key from Supabase into `.env.local` and restart dev server.";
  }
  if (lower.includes("signup") || lower.includes("signups")) {
    return "Sign-ups are disabled for this project. Ask an admin to enable email sign-in in Supabase Auth settings.";
  }
  if (lower.includes("email") && lower.includes("invalid")) {
    return "That email address looks invalid. Check for typos and try again.";
  }
  return message;
}

export function resetPasswordErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("rate") || lower.includes("too many")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (lower.includes("expired") || lower.includes("invalid")) {
    return "This link expired. Request a new reset link.";
  }
  if (lower.includes("invalid api key")) {
    return "Copy fresh anon key from Supabase into `.env.local` and restart dev server.";
  }
  if (lower.includes("email") && lower.includes("invalid")) {
    return "That email address looks invalid. Check for typos and try again.";
  }
  return message;
}

export function updatePasswordErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("password") && (lower.includes("short") || lower.includes("least"))) {
    return "Password must be at least 8 characters.";
  }
  if (lower.includes("same") && lower.includes("password")) {
    return "Choose a different password than your current one.";
  }
  if (lower.includes("session") || lower.includes("expired")) {
    return "This link expired. Request a new reset link.";
  }
  return message;
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: PASS (no errors from new file)

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/auth-errors.ts
git commit -m "feat(web): add auth error message mappers for password auth"
```

---

## Task 2: AuthCredentialsForm component

**Files:**
- Create: `apps/web/components/auth-credentials-form.tsx`

- [ ] **Step 1: Create auth-credentials-form.tsx**

```tsx
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
import { resolvePostLoginPath } from "@/lib/post-login-routing";

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
      const path = await resolvePostLoginPath({ next, accessToken: session.access_token });
      router.push(path);
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

    const { error: signUpError } = await supabase.auth.signUp({
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
```

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/auth-credentials-form.tsx
git commit -m "feat(web): add AuthCredentialsForm with sign-in, sign-up, forgot password"
```

---

## Task 3: Reset password page

**Files:**
- Create: `apps/web/app/auth/reset-password/page.tsx`

- [ ] **Step 1: Create reset-password page**

```tsx
"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";
import { updatePasswordErrorMessage } from "@/lib/auth-errors";

const inputStyle = {
  border: "1px solid var(--border)",
  minHeight: 44,
  padding: "0 12px",
  width: "100%",
};

function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setIsSubmitting(false);

    if (updateError) {
      setError(updatePasswordErrorMessage(updateError.message));
      return;
    }

    router.push("/login?mode=signin&passwordUpdated=1");
  }

  return (
    <div className="panel" style={{ display: "grid", gap: 18, margin: "48px auto", maxWidth: 520, padding: 24 }}>
      <header>
        <h1 style={{ marginBottom: 8, marginTop: 0 }}>Set a new password</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>
          Choose a new password for your account.
        </p>
      </header>

      <form onSubmit={(event) => void handleSubmit(event)} style={{ display: "grid", gap: 14 }}>
        <div style={{ position: "relative" }}>
          <input
            autoComplete="new-password"
            className="panel"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            required
            style={{ ...inputStyle, paddingRight: 72 }}
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="button-secondary"
            onClick={() => setShowPassword((current) => !current)}
            style={{ minHeight: 44, padding: "0 12px", position: "absolute", right: 0, top: 0 }}
            type="button"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: "-6px 0 0" }}>At least 8 characters</p>
        <div style={{ position: "relative" }}>
          <input
            autoComplete="new-password"
            className="panel"
            minLength={8}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            required
            style={{ ...inputStyle, paddingRight: 72 }}
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
          />
          <button
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            className="button-secondary"
            onClick={() => setShowConfirmPassword((current) => !current)}
            style={{ minHeight: 44, padding: "0 12px", position: "absolute", right: 0, top: 0 }}
            type="button"
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>
        </div>
        {error ? <div style={{ color: "#b42318", fontWeight: 700 }}>{error}</div> : null}
        <button className="button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="panel" style={{ margin: "48px auto", maxWidth: 520, padding: 24 }}>
            Loading...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AppShell>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/auth/reset-password/page.tsx
git commit -m "feat(web): add reset-password page after recovery link"
```

---

## Task 4: Login page

**Files:**
- Modify: `apps/web/app/login/page.tsx`

- [ ] **Step 1: Replace AuthOtpForm with AuthCredentialsForm and URL params**

Replace entire file with:

```tsx
"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AuthCredentialsForm } from "@/components/auth-credentials-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="panel" style={{ margin: "48px auto", maxWidth: 520, padding: 24 }}>
            Loading...
          </div>
        </AppShell>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const mode = searchParams.get("mode");
  const confirmed = searchParams.get("confirmed") === "1";
  const passwordUpdated = searchParams.get("passwordUpdated") === "1";

  return (
    <AppShell>
      <div className="panel" style={{ display: "grid", gap: 18, margin: "48px auto", maxWidth: 520, padding: 24 }}>
        {passwordUpdated ? (
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
            Password updated — sign in with your new password.
          </div>
        ) : null}
        <AuthCredentialsForm
          defaultMode={mode === "signup" ? "signup" : "signin"}
          next={next}
          showConfirmedBanner={confirmed}
        />
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
```

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/login/page.tsx
git commit -m "feat(web): wire login page to AuthCredentialsForm and URL params"
```

---

## Task 5: Auth callback route

**Files:**
- Modify: `apps/web/app/auth/callback/route.ts`

- [ ] **Step 1: Narrow callback to confirmation and recovery only**

Replace entire file with:

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${SITE_URL}/login`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${SITE_URL}/login`);
  }

  if (next === "/auth/reset-password") {
    return NextResponse.redirect(`${SITE_URL}/auth/reset-password`);
  }

  return NextResponse.redirect(`${SITE_URL}/login?confirmed=1`);
}
```

- [ ] **Step 2: Verify no stale resolvePostLoginPath import**

Run: `rg "resolvePostLoginPath" apps/web/app/auth/callback/route.ts`
Expected: no matches

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/auth/callback/route.ts
git commit -m "feat(web): narrow auth callback to confirmation and recovery redirects"
```

---

## Task 6: Founder welcome page

**Files:**
- Modify: `apps/web/app/founder/welcome/page.tsx`

- [ ] **Step 1: Replace AuthOtpForm with AuthCredentialsForm and update copy**

Replace entire file with:

```tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AuthCredentialsForm } from "@/components/auth-credentials-form";
import { createClient } from "@/lib/supabase/client";
import { fetchSubscription } from "@/lib/subscription";

const MAX_ATTEMPTS = 15;

export default function FounderWelcomePage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="panel" style={{ margin: "48px auto", maxWidth: 620, padding: 24 }}>
            Confirming payment...
          </div>
        </AppShell>
      }
    >
      <FounderWelcomeContent />
    </Suspense>
  );
}

function FounderWelcomeContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"polling" | "success" | "timeout" | "needs_sign_in">("polling");
  const [founderNumber, setFounderNumber] = useState<number | null>(null);
  const [prefillEmail, setPrefillEmail] = useState("");
  const [message, setMessage] = useState("Confirming your Founder Access payment...");
  const supabase = createClient();

  useEffect(() => {
    const previewRaw = sessionStorage.getItem("smbfn_unlock_preview");
    if (previewRaw) {
      try {
        const preview = JSON.parse(previewRaw) as { user?: { email?: string } };
        if (preview.user?.email) {
          setPrefillEmail(preview.user.email);
        }
      } catch {
        // Ignore malformed preview payload.
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setPrefillEmail((current) => current || data.user?.email || "");
      }
    });
  }, [supabase.auth]);

  useEffect(() => {
    if (!sessionId) {
      setStatus("timeout");
      setMessage("Missing checkout session. Return to checkout and try again.");
      return;
    }

    let attempts = 0;
    let cancelled = false;

    async function pollSubscription() {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();

      if (!initialSession?.access_token) {
        setStatus("needs_sign_in");
        setMessage("Payment confirmed — sign in with your account to open your dashboard.");
        return;
      }

      while (!cancelled && attempts < MAX_ATTEMPTS) {
        attempts += 1;
        const {
          data: { session: activeSession },
        } = await supabase.auth.getSession();

        if (activeSession?.access_token) {
          try {
            const subscription = await fetchSubscription(activeSession.access_token);
            if (subscription.status === "active") {
              setPrefillEmail((current) => current || subscription.email);
              setFounderNumber(subscription.founder_number);
              setStatus("success");
              setMessage("Payment confirmed. Your Founder Access is active.");
              return;
            }
          } catch {
            // Keep polling while webhook processes.
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      if (!cancelled) {
        setStatus("timeout");
        setMessage(
          "Payment is still processing — refresh in a minute or sign in with your account below.",
        );
      }
    }

    pollSubscription();

    return () => {
      cancelled = true;
    };
  }, [sessionId, supabase.auth]);

  const showCredentialsForm = status === "needs_sign_in" || status === "timeout";

  return (
    <AppShell>
      <div className="panel" style={{ display: "grid", gap: 18, margin: "48px auto", maxWidth: 620, padding: 24 }}>
        <span style={{ color: "var(--green)", fontWeight: 800 }}>Founder Access</span>
        <h1 style={{ color: "var(--navy)", margin: 0 }}>
          {status === "success" ? "Welcome, Founder" : "Almost there"}
        </h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>{message}</p>
        {founderNumber ? (
          <p style={{ color: "var(--navy)", fontWeight: 800, margin: 0 }}>Founder #{founderNumber} of 50</p>
        ) : null}

        {showCredentialsForm ? (
          <AuthCredentialsForm
            defaultEmail={prefillEmail}
            description="Sign in with your email and password, or create an account if you haven't yet."
            heading="Sign in to your dashboard"
            next="/dashboard"
          />
        ) : null}

        {status === "success" ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link className="button-primary" href="/dashboard">
              Open dashboard
            </Link>
          </div>
        ) : status === "polling" ? null : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link className="button-secondary" href="/login">
              Go to login
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 2: Verify no OTP references remain**

Run: `rg "AuthOtpForm|sign-in code|OTP|magic link" apps/web/app/founder/welcome/page.tsx`
Expected: no matches

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/founder/welcome/page.tsx
git commit -m "feat(web): replace founder welcome OTP with password credentials form"
```

---

## Task 7: Founder tier card copy

**Files:**
- Modify: `apps/web/components/founder-tier-card.tsx`

- [ ] **Step 1: Update magic-link bullets to email + password**

Change line 23 from:
```tsx
          <li>• Magic-link login</li>
```
to:
```tsx
          <li>• Email + password login</li>
```

Change line 54 from:
```tsx
        <li>Magic-link login — no password to remember</li>
```
to:
```tsx
        <li>Email + password login — sign in anytime</li>
```

- [ ] **Step 2: Verify no magic-link copy remains**

Run: `rg -i "magic.link|magic-link|otp" apps/web/components/founder-tier-card.tsx`
Expected: no matches

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/founder-tier-card.tsx
git commit -m "docs(web): update founder tier card to email + password copy"
```

---

## Task 8: Delete OTP form

**Files:**
- Delete: `apps/web/components/auth-otp-form.tsx`

- [ ] **Step 1: Delete auth-otp-form.tsx**

```bash
rm apps/web/components/auth-otp-form.tsx
```

- [ ] **Step 2: Verify no imports remain**

Run: `rg "auth-otp-form|AuthOtpForm" apps/web`
Expected: no matches

- [ ] **Step 3: Commit**

```bash
git add -A apps/web/components/auth-otp-form.tsx
git commit -m "refactor(web): remove OTP auth form superseded by password auth"
```

---

## Task 9: Supabase dashboard configuration (manual)

**Files:** none (Supabase dashboard only)

- [ ] **Step 1: Auth provider settings**

In Supabase → Authentication → Providers → Email:

| Setting | Value |
|---|---|
| Email provider | Enabled |
| Confirm email | ON |
| Secure email change | ON |
| Minimum password length | 8 |
| Enable sign-ups | ON |

- [ ] **Step 2: Redirect URLs**

In Authentication → URL Configuration, add (production + local dev):

- `{SITE_URL}/auth/callback`
- `{SITE_URL}/auth/reset-password`
- `{SITE_URL}/login`

Local example: `http://localhost:3001/auth/callback`, `http://localhost:3001/auth/reset-password`, `http://localhost:3001/login`

- [ ] **Step 3: Confirm signup email template**

Subject: `Confirm your SMB Funding Navigator account`

Body CTA via `{{ .ConfirmationURL }}`. Copy mentions confirming email then signing in with password. Remove any `{{ .Token }}` placeholder.

- [ ] **Step 4: Reset password email template**

Subject: `Reset your SMB Funding Navigator password`

Body CTA via `{{ .ConfirmationURL }}`. Copy notes link expires in 1 hour; ignore if not requested.

- [ ] **Step 5: Verify env vars**

Confirm `apps/web/.env.local` has fresh values:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

API `.env` must have matching `SUPABASE_JWT_SECRET` for the same project.

---

## Task 10: Build and typecheck verification

**Files:** none (verification only)

- [ ] **Step 1: Typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: PASS (exit code 0, no errors)

- [ ] **Step 2: Production build**

Run: `cd apps/web && npm run build`
Expected: PASS — routes include `/login`, `/auth/callback`, `/auth/reset-password`, `/founder/welcome`

- [ ] **Step 3: Grep for stale OTP references in web app**

Run: `rg -i "AuthOtpForm|auth-otp-form|signInWithOtp|verifyOtp|magic.link|magic-link|sign-in code|6-digit" apps/web --glob '!docs/**'`
Expected: no matches in `apps/web` source (docs references OK)

---

## Task 11: Manual testing checklist

**Files:** none (verification only)

- [ ] **Step 1: Sign up flow**

1. Open `/login?mode=signup`
2. Create account with new email + password (≥8 chars)
3. See "Check your email" state
4. Click confirmation link in email
5. Land on `/login?confirmed=1` with green banner
6. Sign in → correct redirect per subscription/admin status

- [ ] **Step 2: Sign in errors**

1. Wrong password → "Email or password is incorrect."
2. Unconfirmed email → blocked with resend confirmation button

- [ ] **Step 3: Forgot password flow**

1. Click Forgot password? on sign-in tab
2. Submit email → generic success copy
3. Click reset link in email → `/auth/reset-password`
4. Set new password → redirect `/login?mode=signin&passwordUpdated=1`
5. Sign in with new password → success

- [ ] **Step 4: Post-checkout welcome**

1. Complete founder checkout (or simulate `/founder/welcome?session_id=...`)
2. When unsigned, see `AuthCredentialsForm` (not OTP)
3. Sign in → dashboard after subscription active

- [ ] **Step 5: Route gating**

1. Visit `/dashboard` unsigned → redirect `/login?next=/dashboard`
2. After sign-in with active sub → lands on `/dashboard`

- [ ] **Step 6: Admin routing**

Admin email without subscription → `/admin/leads` after sign-in

---

## Task 12: Spec status update

**Files:**
- Modify: `docs/superpowers/specs/2026-05-28-email-password-auth-design.md`

- [ ] **Step 1: Mark ready for implementation (if not already done at plan time)**

Ensure line 4 reads:

```markdown
Status: Approved — ready for implementation
```

- [ ] **Step 2: Commit docs**

```bash
git add docs/superpowers/specs/2026-05-28-email-password-auth-design.md docs/superpowers/plans/2026-05-28-email-password-auth.md
git commit -m "docs: add email + password auth implementation plan"
```

---

## Spec coverage self-review

| Spec requirement | Task |
|---|---|
| Open sign-up with email confirmation | Task 2 (signUp + resend), Task 9 |
| Single `/login` with Sign in \| Create account tabs | Task 2, Task 4 |
| OTP/magic-link removed | Task 8, Task 10 grep |
| Forgot password inline view | Task 2 |
| `/auth/reset-password` page | Task 3 |
| Callback: recovery → reset page | Task 5 |
| Callback: confirmation → `/login?confirmed=1` | Task 5 |
| Callback no longer primary login | Task 5 (removed resolvePostLoginPath) |
| `?mode=signup` opens Create account tab | Task 4 |
| `?confirmed=1` banner | Task 2, Task 4 |
| Password show/hide toggle | Task 2, Task 3 |
| `resolvePostLoginPath` after sign-in | Task 2 |
| Founder welcome credentials form | Task 6 |
| Founder tier card copy | Task 7 |
| Error message mappers | Task 1 |
| Supabase dashboard config | Task 9 |
| `npm run build` + typecheck | Task 10 |
| Manual testing checklist | Task 11 |
| Accessibility: tablist, aria-selected, 44px inputs | Task 2 |

Placeholder scan: no TBD, TODO, or "similar to Task N" references.

Type consistency: `AuthMode`, `defaultMode`, callback `next=/auth/reset-password`, and redirect URLs align across Tasks 2, 3, 4, 5.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-28-email-password-auth.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints after Task 8 (code complete) and Task 10 (build verification)

Which approach?
