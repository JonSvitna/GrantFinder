import Link from "next/link";
import { DashboardPreviewCard } from "@/components/dashboard-preview-card";
import { LandingIllustration } from "@/components/landing-illustration";

function LandingHeroCopy() {
  return (
    <div className="landing-hero-copy">
      <h1 className="landing-hero-title">
        Find funding. Decode paperwork.
        <br />
        Get business-ready faster.
      </h1>
      <p className="landing-hero-subtitle">
        Maryland-first assistant for grants, loans, tax credits, incentives, forms, and registrations—built for small
        businesses, startups, solo founders, and new LLC owners.
      </p>
      <div className="landing-hero-ctas">
        <Link className="button-blue" href="/wizard">
          Find Funding &amp; Paperwork Steps
        </Link>
        <Link className="button-secondary" href="#how-it-works">
          See How It Works
        </Link>
      </div>
      <p className="landing-trust-line">
        <span aria-hidden="true">🛡️</span>
        Trusted guidance, not legal or tax advice. We simplify official information—but we don&apos;t submit forms for
        you.
      </p>
    </div>
  );
}

export function LandingHeroSection() {
  return (
    <section className="landing-hero-universal">
      <LandingHeroCopy />
      <DashboardPreviewCard />
      <LandingIllustration />
    </section>
  );
}
