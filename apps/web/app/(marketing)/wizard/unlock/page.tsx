"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BlurredScoreBar } from "@/components/blurred-score-bar";
import { PaywallPanel } from "@/components/paywall-panel";
import type { PreviewDashboardPayload } from "@/lib/types";

const PREVIEW_KEY = "smbfn_unlock_preview";

export default function WizardUnlockPage() {
  const [preview, setPreview] = useState<PreviewDashboardPayload | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(PREVIEW_KEY);
    if (!raw) {
      return;
    }
    try {
      setPreview(JSON.parse(raw) as PreviewDashboardPayload);
    } catch {
      setPreview(null);
    }
  }, []);

  if (!preview) {
    return (
      <div className="panel" style={{ padding: 24 }}>
        <h1 style={{ marginTop: 0 }}>No preview available</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.55 }}>
          Complete the wizard first to generate your readiness preview.
        </p>
        <Link className="button-primary" href="/wizard">
          Start wizard
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 24, padding: "24px 0" }}>
      <header>
        <span style={{ color: "var(--green)", fontWeight: 800 }}>Your readiness preview</span>
        <h1 style={{ color: "var(--navy)", marginBottom: 8, marginTop: 8 }}>Unlock your full plan</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>
          We saved your profile for {preview.user.email}. Scores are hidden until you unlock Founder Access.
        </p>
      </header>

      <section style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
        {preview.categories.map((category) => (
          <BlurredScoreBar key={category.key} label={category.label} reason={category.reason} />
        ))}
      </section>

      <PaywallPanel
        capReached={preview.cap_reached}
        email={preview.user.email}
        spotsRemaining={preview.spots_remaining}
        userId={preview.user.id}
      />
    </div>
  );
}
