"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resolvePostLoginPath } from "@/lib/post-login-routing";

const RESEND_COOLDOWN_SEC = 60;

const inputStyle = {
  border: "1px solid var(--border)",
  minHeight: 44,
  padding: "0 12px",
  width: "100%",
};

function otpErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("rate") || lower.includes("too many")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (lower.includes("expired") || lower.includes("invalid") || lower.includes("otp")) {
    return "That code didn't work. Check the latest email or request a new code.";
  }
  return message;
}

export function AuthOtpForm({
  defaultEmail = "",
  next,
  heading = "Log in",
  description = "We'll email you a 6-digit code. Enter it on this page to sign in — works with any email app.",
}: {
  defaultEmail?: string;
  next?: string | null;
  heading?: string;
  description?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<"email" | "verify">("email");
  const [email, setEmail] = useState(defaultEmail);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setResendCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  async function sendCode(targetEmail: string) {
    setError("");
    setInfo("");
    setIsSubmitting(true);

    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: targetEmail,
    });

    setIsSubmitting(false);
    if (sendError) {
      setError(sendError.message);
      return;
    }

    setEmail(targetEmail);
    setStep("verify");
    setToken("");
    setInfo(`We sent a 6-digit code to ${targetEmail}.`);
    setResendCooldown(RESEND_COOLDOWN_SEC);
  }

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    await sendCode(email.trim());
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setIsSubmitting(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: "email",
    });

    if (verifyError) {
      setIsSubmitting(false);
      setError(otpErrorMessage(verifyError.message));
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

  async function handleResend() {
    if (resendCooldown > 0 || isSubmitting) {
      return;
    }
    await sendCode(email.trim());
  }

  function useDifferentEmail() {
    setStep("email");
    setToken("");
    setError("");
    setInfo("");
    setResendCooldown(0);
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <header>
        <h1 style={{ marginBottom: 8, marginTop: 0 }}>{heading}</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>{description}</p>
      </header>

      {step === "email" ? (
        <form onSubmit={handleSend} style={{ display: "grid", gap: 14 }}>
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
          {info ? <div style={{ color: "var(--green)", fontWeight: 700 }}>{info}</div> : null}
          <button className="button-primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Sending..." : "Send sign-in code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} style={{ display: "grid", gap: 14 }}>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Code sent to <strong style={{ color: "var(--navy)" }}>{email}</strong>
          </p>
          <input
            className="panel"
            inputMode="numeric"
            maxLength={6}
            pattern="[0-9]{6}"
            placeholder="123456"
            required
            style={{ ...inputStyle, letterSpacing: "0.2em", textAlign: "center" }}
            type="text"
            value={token}
            onChange={(event) => setToken(event.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          {error ? <div style={{ color: "#b42318", fontWeight: 700 }}>{error}</div> : null}
          {info ? <div style={{ color: "var(--green)", fontWeight: 700 }}>{info}</div> : null}
          <button className="button-primary" disabled={isSubmitting || token.length !== 6} type="submit">
            {isSubmitting ? "Verifying..." : "Verify & sign in"}
          </button>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <button
              className="button-secondary"
              disabled={resendCooldown > 0 || isSubmitting}
              onClick={() => void handleResend()}
              type="button"
            >
              {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
            </button>
            <button className="button-secondary" onClick={useDifferentEmail} type="button">
              Use a different email
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
