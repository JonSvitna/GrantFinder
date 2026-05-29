import Link from "next/link";

const fundingMatches = [
  { name: "Maryland Entrepreneur Hub Grants", amount: "$10,000" },
  { name: "MD Dept. of Commerce Loan Guarantee", amount: "$25,000" },
  { name: "Prince George's County Incentive", amount: "$5,000" },
];

const progressSteps = [
  "Profile",
  "Paperwork",
  "Registrations",
  "Apply for Funding",
  "Launch",
];

export function DashboardPreviewCard() {
  return (
    <aside aria-label="Dashboard preview" className="landing-preview panel">
      <h2 style={{ fontSize: 18, lineHeight: 1.4, margin: 0 }}>
        Welcome back, Alex! Here&apos;s your business readiness overview.
      </h2>
      <div className="landing-preview-gauge">
        <span>78% On Track</span>
        <span className="landing-preview-gauge-copy">Strong profile, 2 steps left</span>
      </div>

      <div className="landing-preview-section">
        <h3 className="landing-preview-section-title">Top Funding Matches</h3>
        {fundingMatches.map((match) => (
          <div className="landing-preview-match" key={match.name}>
            <span>{match.name}</span>
            <span className="landing-preview-match-amount">{match.amount}</span>
          </div>
        ))}
      </div>

      <div className="landing-preview-section">
        <h3 className="landing-preview-section-title">Next Recommended Step</h3>
        <div className="landing-preview-next">
          <strong style={{ color: "var(--navy)", fontSize: 14 }}>Get your EIN</strong>
          <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
            Apply for a federal Employer Identification Number before opening a business bank account.
          </p>
          <Link className="button-blue" href="/wizard" style={{ fontSize: 13, minHeight: 36, padding: "0 12px" }}>
            Start Step
          </Link>
        </div>
      </div>

      <div className="landing-preview-section">
        <h3 className="landing-preview-section-title">Progress</h3>
        <div className="landing-preview-stepper">
          {progressSteps.map((step, index) => (
            <div
              className={`landing-preview-step${index === 3 ? " landing-preview-step-active" : ""}`}
              key={step}
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
