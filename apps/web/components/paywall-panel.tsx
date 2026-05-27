"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { WaitlistForm } from "@/components/waitlist-form";
import { SpotsRemainingBadge } from "@/components/spots-remaining-badge";

export function PaywallPanel({
  userId,
  email,
  spotsRemaining,
  capReached,
}: {
  userId: string;
  email: string;
  spotsRemaining: number;
  capReached: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);

  async function unlock() {
    setError("");
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
    <div className="panel" style={{ display: "grid", gap: 18, padding: 24 }}>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>Unlock your full readiness plan</h2>
        <SpotsRemainingBadge capReached={capReached} spotsRemaining={spotsRemaining} />
      </div>
      <p style={{ color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>
        Your profile is saved. Founder Access unlocks funding matches, paperwork priorities, and your complete readiness scores.
      </p>
      {capReached ? (
        <p style={{ color: "#b42318", fontWeight: 700, margin: 0 }}>
          All 50 founder seats are taken. Join the free waitlist and we will notify you when spots reopen.
        </p>
      ) : null}
      {error ? <div style={{ color: "#b42318", fontWeight: 700 }}>{error}</div> : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {!capReached ? (
          <button className="button-primary" disabled={isCheckingOut} onClick={unlock} type="button">
            {isCheckingOut ? "Redirecting..." : "Unlock for $19/mo"}
          </button>
        ) : null}
        <button className="button-secondary" onClick={() => setShowWaitlist((current) => !current)} type="button">
          {showWaitlist ? "Hide waitlist form" : "Join free waitlist"}
        </button>
        <Link className="button-secondary" href="/wizard">
          Edit answers
        </Link>
      </div>
      {showWaitlist ? <WaitlistForm compact source="paywall" /> : null}
      {!capReached ? (
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
          Prefer to explore first?{" "}
          <button
            onClick={() => router.push("/founder/checkout")}
            style={{ background: "none", border: 0, color: "var(--green)", cursor: "pointer", fontWeight: 700, padding: 0 }}
            type="button"
          >
            View Founder checkout
          </button>
        </p>
      ) : null}
    </div>
  );
}
