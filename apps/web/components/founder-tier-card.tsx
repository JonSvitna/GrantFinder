import Link from "next/link";

export function FounderTierCard({
  spotsRemaining,
  capReached,
  variant = "default",
}: {
  spotsRemaining: number;
  capReached: boolean;
  variant?: "default" | "hero";
}) {
  const seatLabel = capReached ? "Sold out" : `${spotsRemaining}/50 left`;

  if (variant === "hero") {
    return (
      <article className="landing-tier-card landing-tier-card-founder">
        <span className="landing-tier-label">Founder Access · {seatLabel}</span>
        <div className="landing-tier-price">$19/mo</div>
        <p className="landing-tier-copy">Future price $49/mo — locked in for life</p>
        <ul className="landing-tier-list">
          <li>• Full dashboard today</li>
          <li>• Wizard → unlock your plan</li>
          <li>• Magic-link login</li>
        </ul>
        {capReached ? (
          <Link className="button-secondary" href="/waitlist/thanks">
            Join waitlist for next cohort
          </Link>
        ) : (
          <Link className="button-primary" href="/founder/checkout">
            Become a Founder
          </Link>
        )}
      </article>
    );
  }

  return (
    <article className="panel" style={{ display: "grid", gap: 16, padding: 24 }}>
      <span className="landing-tier-label">Founder Access · {seatLabel}</span>
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
