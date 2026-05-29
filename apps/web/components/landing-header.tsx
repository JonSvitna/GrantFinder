import Link from "next/link";

const navItems = [
  { href: "/funding", label: "Funding" },
  { href: "/paperwork", label: "Paperwork" },
  { href: "/#features", label: "Incentives" },
  { href: "/#how-it-works", label: "Resources" },
  { href: "/#about", label: "About" },
];

export function LandingHeader({
  spotsRemaining,
  capReached,
}: {
  spotsRemaining?: number;
  capReached?: boolean;
}) {
  return (
    <header className="landing-header">
      <div className="landing-header-inner">
        <Link className="landing-brand" href="/">
          <span aria-hidden="true" className="landing-brand-mark" />
          <span className="landing-brand-text">
            <span className="landing-brand-title">SMB Funding Navigator</span>
            <span className="landing-brand-subtitle">Maryland MVP</span>
          </span>
          <span className="landing-header-badge">Maryland-first</span>
        </Link>

        <nav aria-label="Primary" className="landing-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
              <span aria-hidden="true"> ▾</span>
            </Link>
          ))}
        </nav>

        <div className="landing-actions">
          <Link className="button-secondary landing-header-button" href="/login">
            Log in
          </Link>
          {spotsRemaining !== undefined && !capReached ? (
            <span className="landing-header-badge landing-header-spots">{spotsRemaining}/50 spots left</span>
          ) : null}
          <Link
            className={`landing-header-button ${capReached ? "button-secondary" : "button-primary"}`}
            href={capReached ? "/waitlist/thanks" : "/founder/checkout"}
          >
            {capReached ? "Founder seats full" : "Become a Founder"}
          </Link>
        </div>
      </div>
    </header>
  );
}
