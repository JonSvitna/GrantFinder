const features = [
  {
    icon: "🔍",
    title: "Funding Matches",
    copy: "Personalized grants, loans, tax credits, rebates, and procurement opportunities matched to your profile.",
  },
  {
    icon: "📄",
    title: "Paperwork Navigator",
    copy: "Plain-English guidance for W-9, EIN, SAM.gov, eMMA, SDAT, certifications, and grant budget basics.",
  },
  {
    icon: "📊",
    title: "Readiness Dashboard",
    copy: "Track progress toward fundable status with a prioritized checklist and missing-document alerts.",
  },
  {
    icon: "📍",
    title: "County/State Incentives",
    copy: "Discover Maryland county and city programs alongside statewide funding options.",
  },
];

export function LandingFeatures() {
  return (
    <section className="landing-section" id="features">
      <h2 className="landing-section-heading">Feature highlights</h2>
      <div className="landing-feature-grid">
        {features.map((feature) => (
          <article className="landing-feature-card" key={feature.title}>
            <div className="landing-feature-icon" aria-hidden="true">
              {feature.icon}
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
