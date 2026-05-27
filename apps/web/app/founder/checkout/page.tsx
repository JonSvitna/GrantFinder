"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SpotsRemainingBadge } from "@/components/spots-remaining-badge";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { fetchBillingCap } from "@/lib/subscription";

export default function FounderCheckoutPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="panel" style={{ margin: "48px auto", maxWidth: 720, padding: 24 }}>
            Loading checkout...
          </div>
        </AppShell>
      }
    >
      <FounderCheckoutContent />
    </Suspense>
  );
}

function FounderCheckoutContent() {
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled") === "1";
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [spotsRemaining, setSpotsRemaining] = useState(50);
  const [capReached, setCapReached] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchBillingCap()
      .then((cap) => {
        setSpotsRemaining(cap.spots_remaining);
        setCapReached(cap.cap_reached);
      })
      .catch(() => undefined);

    const storedUserId = localStorage.getItem("smbfn_user_id");
    if (storedUserId) {
      setUserId(storedUserId);
    }

    const previewRaw = sessionStorage.getItem("smbfn_unlock_preview");
    if (previewRaw) {
      try {
        const preview = JSON.parse(previewRaw) as { user?: { id?: string; email?: string } };
        if (preview.user?.id) {
          setUserId(preview.user.id);
        }
        if (preview.user?.email) {
          setEmail(preview.user.email);
        }
      } catch {
        // Ignore malformed preview payload.
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setEmail((current) => current || data.user?.email || "");
      }
    });
  }, [supabase.auth]);

  async function startCheckout() {
    setError("");
    if (!email || !userId) {
      setError("Complete the wizard first so we can link your profile to checkout.");
      return;
    }

    setIsCheckingOut(true);
    try {
      const url = await api.startFounderCheckout({ email, userId });
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout could not be started.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  return (
    <AppShell>
      <div style={{ display: "grid", gap: 24, margin: "32px auto", maxWidth: 720 }}>
        <header>
          <span style={{ color: "var(--green)", fontWeight: 800 }}>Founder Access</span>
          <h1 style={{ color: "var(--navy)", marginBottom: 8, marginTop: 8 }}>Lock in $19/mo launch pricing</h1>
          <p style={{ color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>
            Unlock your full readiness dashboard, funding matches, and prioritized paperwork tasks.
          </p>
        </header>

        {canceled ? (
          <div className="panel" style={{ color: "#b45309", fontWeight: 700, padding: 16 }}>
            Checkout was canceled. You can try again when you are ready.
          </div>
        ) : null}

        <div className="panel" style={{ display: "grid", gap: 16, padding: 24 }}>
          <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
            <div style={{ alignItems: "baseline", display: "flex", gap: 10 }}>
              <span style={{ color: "var(--navy)", fontSize: 36, fontWeight: 800 }}>$19</span>
              <span style={{ color: "var(--muted)" }}>/mo</span>
              <span style={{ color: "var(--muted)", textDecoration: "line-through" }}>$49/mo</span>
            </div>
            <SpotsRemainingBadge capReached={capReached} spotsRemaining={spotsRemaining} />
          </div>

          {!userId ? (
            <p style={{ color: "var(--muted)", margin: 0 }}>
              <Link href="/wizard" style={{ color: "var(--green)", fontWeight: 700 }}>
                Complete the wizard
              </Link>{" "}
              first so we can attach your profile to checkout.
            </p>
          ) : null}

          <input
            className="panel"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Checkout email"
            style={inputStyle}
            type="email"
            value={email}
          />

          {error ? <div style={{ color: "#b42318", fontWeight: 700 }}>{error}</div> : null}

          {capReached ? (
            <Link className="button-secondary" href="/waitlist/thanks">
              Join waitlist — sold out
            </Link>
          ) : (
            <button className="button-primary" disabled={isCheckingOut || !userId} onClick={startCheckout} type="button">
              {isCheckingOut ? "Redirecting to Stripe..." : "Continue to Stripe Checkout"}
            </button>
          )}
        </div>
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
