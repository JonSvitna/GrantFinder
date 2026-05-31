import Link from "next/link";
import { DashboardPreviewCard } from "@/components/dashboard-preview-card";

function ShieldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2 4 6v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-4Z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0, marginTop: 1 }}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function LandingHeroCopy() {
  return (
    <div className="landing-hero-copy">
      <span className="landing-eyebrow">
        <ShieldIcon />
        Built for Maryland small businesses
      </span>
      <h1 className="landing-hero-title">
        Find funding. Decode paperwork.{" "}
        <span className="landing-hero-accent">Get business-ready faster.</span>
      </h1>
      <p className="landing-hero-subtitle">
        A Maryland-first assistant for grants, loans, tax credits, incentives, forms, and registrations — built for
        small businesses, startups, solo founders, and new LLC owners.
      </p>
      <div className="landing-hero-ctas">
        <Link className="button-primary landing-cta-lg" href="/wizard">
          Find Funding &amp; Paperwork Steps
        </Link>
        <Link className="button-secondary landing-cta-lg" href="#how-it-works">
          See How It Works
        </Link>
      </div>
      <div className="landing-trust-stats">
        <div className="landing-trust-stat">
          <span className="landing-trust-num">40+</span>
          <span className="landing-trust-label">Maryland programs tracked</span>
        </div>
        <div className="landing-trust-stat">
          <span className="landing-trust-num">24</span>
          <span className="landing-trust-label">Counties supported</span>
        </div>
        <div className="landing-trust-stat">
          <span className="landing-trust-num">5 min</span>
          <span className="landing-trust-label">To your first matches</span>
        </div>
      </div>
      <div className="landing-trust-line">
        <InfoIcon />
        <span>
          Trusted guidance, not legal or tax advice. We simplify official information — but we do not submit forms for
          you.
        </span>
      </div>
    </div>
  );
}

export function LandingHeroSection() {
  return (
    <section className="landing-hero-universal">
      <LandingHeroCopy />
      <DashboardPreviewCard />
    </section>
  );
}
