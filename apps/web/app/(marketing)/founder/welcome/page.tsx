"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthCredentialsForm } from "@/components/auth-credentials-form";
import { createClient } from "@/lib/supabase/client";
import { fetchSubscription } from "@/lib/subscription";

const MAX_ATTEMPTS = 15;

export default function FounderWelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="panel" style={{ margin: "48px auto", maxWidth: 620, padding: 24 }}>
          Confirming payment...
        </div>
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
  );
}
