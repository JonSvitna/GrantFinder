"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";
import { fetchSubscription } from "@/lib/subscription";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
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
  const [status, setStatus] = useState<"polling" | "success" | "timeout">("polling");
  const [founderNumber, setFounderNumber] = useState<number | null>(null);
  const [message, setMessage] = useState("Confirming your Founder Access payment...");
  const supabase = createClient();

  useEffect(() => {
    let attempts = 0;
    let cancelled = false;

    async function pollSubscription() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) {
          await supabase.auth.signInWithOtp({
            email: user.email,
            options: { emailRedirectTo: `${SITE_URL}/auth/callback` },
          });
          setMessage("Check your email for a magic link to finish signing in.");
        }
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
              setFounderNumber(subscription.founder_number);
              setStatus("success");
              setMessage("Payment confirmed. Check your email for a magic link if you are not signed in yet.");
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
        setMessage("Payment is still processing — refresh in a minute or check your email for a magic link.");
      }
    }

    if (sessionId) {
      pollSubscription();
    } else {
      setStatus("timeout");
      setMessage("Missing checkout session. Return to checkout and try again.");
    }

    return () => {
      cancelled = true;
    };
  }, [sessionId, supabase.auth]);

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
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link className="button-primary" href="/login">
            Go to login
          </Link>
          <Link className="button-secondary" href="/dashboard">
            Open dashboard
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
