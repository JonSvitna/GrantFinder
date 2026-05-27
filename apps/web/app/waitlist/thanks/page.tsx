import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export default function WaitlistThanksPage() {
  return (
    <AppShell>
      <div className="panel" style={{ display: "grid", gap: 18, margin: "48px auto", maxWidth: 620, padding: 24 }}>
        <span style={{ color: "var(--green)", fontWeight: 800 }}>You are on the list</span>
        <h1 style={{ color: "var(--navy)", margin: 0 }}>Thanks for joining the waitlist</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>
          We will email you when new Maryland funding guidance and paperwork explainers ship.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link className="button-primary" href="/wizard">
            Start readiness wizard
          </Link>
          <Link className="button-secondary" href="/">
            Back to home
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
