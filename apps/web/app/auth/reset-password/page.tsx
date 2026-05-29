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
