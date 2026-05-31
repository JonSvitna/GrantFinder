function FundingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v10M9.5 9.2c0-1.1 1.1-1.7 2.5-1.7s2.5.7 2.5 1.8c0 2.4-5 1.4-5 3.8 0 1.1 1.1 1.8 2.5 1.8s2.5-.6 2.5-1.7"/>
    </svg>
  );
}

function PaperworkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
      <path d="M14 3v5h5"/>
      <path d="M9 13h6M9 17h4"/>
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" rx="1.5"/>
      <rect x="14" y="3" width="7" height="5" rx="1.5"/>
      <rect x="14" y="12" width="7" height="9" rx="1.5"/>
      <rect x="3" y="16" width="7" height="5" rx="1.5"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>
    </svg>
  );
}

const features = [
  {
    Icon: FundingIcon,
    title: "Funding Matches",
    copy: "Personalized grants, loans, tax credits, and incentives across Maryland.",
  },
  {
    Icon: PaperworkIcon,
    title: "Paperwork Navigator",
    copy: "Step-by-step guidance for forms and registrations in plain English.",
  },
  {
    Icon: DashboardIcon,
    title: "Readiness Dashboard",
    copy: "Track progress, see what's next, and stay on track to fundable.",
  },
  {
    Icon: ShieldIcon,
    title: "County & State Incentives",
    copy: "Local and statewide incentives that fit your business and location.",
  },
];

export function LandingFeatures() {
  return (
    <section className="landing-section" id="features">
      <div className="landing-section-inner">
        <div className="landing-section-head">
          <div className="landing-section-kicker">What you get</div>
          <h2 className="landing-section-h2">Everything you need to go from idea to fundable</h2>
        </div>
        <div className="landing-feature-grid">
        {features.map((feature) => (
          <article className="landing-feature-card" key={feature.title}>
            <div className="landing-feature-icon-wrap" aria-hidden="true">
              <feature.Icon />
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.copy}</p>
          </article>
        ))}
        </div>
      </div>
    </section>
  );
}
