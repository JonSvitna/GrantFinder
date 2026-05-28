import Link from "next/link";
import { SpotsRemainingBadge } from "@/components/spots-remaining-badge";

export function FounderTierCard({
  spotsRemaining,
  capReached,
}: {
  spotsRemaining: number;
  capReached: boolean;
}) {
  return (
    <article className="panel" style={{ display: "grid", gap: 16, padding: 24 }}>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <span style={{ color: "var(--green)", fontSize: 13, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Founder Access
        </span>
        <SpotsRemainingBadge capReached={capReached} spotsRemaining={spotsRemaining} />
      </div>
      <div>
        <div style={{ alignItems: "baseline", display: "flex", gap: 10 }}>
          <span style={{ color: "var(--navy)", fontSize: 40, fontWeight: 800, lineHeight: 1 }}>$19</span>
          <span style={{ color: "var(--muted)", fontSize: 18 }}>/mo</span>
          <span style={{ color: "var(--muted)", fontSize: 16, textDecoration: "line-through" }}>$49/mo</span>
        </div>
        <p style={{ color: "var(--muted)", lineHeight: 1.55, marginBottom: 0, marginTop: 10 }}>
          Lock in launch pricing, unlock your full readiness dashboard, funding matches, and prioritized tasks.
        </p>
      </div>
      <ul style={{ color: "var(--navy)", display: "grid", gap: 8, lineHeight: 1.5, margin: 0, paddingLeft: 18 }}>
        <li>Full wizard results — no blurred scores</li>
        <li>Funding matches and paperwork checklist</li>
        <li>Magic-link login — no password to remember</li>
      </ul>
      {capReached ? (
        <Link className="button-secondary" href="/waitlist/thanks">
          Join waitlist for next cohort
        </Link>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Link className="button-primary" href="/founder/checkout">
            Become a Founder
          </Link>
          <Link className="button-secondary" href="/wizard">
            Start with wizard
          </Link>
        </div>
      )}
    </article>
  );
}
