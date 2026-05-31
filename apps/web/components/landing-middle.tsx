function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m22 4-10 10.01-3-3" />
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 2"/>
    </svg>
  );
}

const checklistItems = [
  { label: "Get your EIN", status: "done" },
  { label: "Register your business with Maryland", status: "done" },
  { label: "Set up a business bank account", status: "done" },
  { label: "Create a SAM.gov account", status: "prog" },
  { label: "Apply for funding opportunities", status: "todo" },
] as const;

const howSteps = [
  { title: "Create your profile", desc: "Tell us your business type, county, and stage — takes about 5 minutes." },
  { title: "Get matched & guided", desc: "See ranked funding matches and a plain-English paperwork checklist." },
  { title: "Take action & grow", desc: "Work the list, upload documents once, and apply with confidence." },
];

const formChips = ["W-9", "EIN", "SAM.gov", "eMMA", "Business Registration", "Trader's License", "Combined Registration"];

function ChecklistIcon({ status }: { status: "done" | "prog" | "todo" }) {
  if (status === "done") {
    return (
      <span className="lp-check-icon lp-check-done">
        <CheckIcon />
      </span>
    );
  }
  if (status === "prog") {
    return (
      <span className="lp-check-icon lp-check-prog">
        <ClockIcon />
      </span>
    );
  }
  return <span className="lp-check-icon lp-check-todo" />;
}

export function LandingMiddle() {
  return (
    <section className="landing-section landing-section-alt" id="how-it-works">
      <div className="landing-section-inner">
        <div className="landing-section-head">
          <div className="landing-section-kicker">How it works</div>
          <h2 className="landing-section-h2">Three steps to a clearer path</h2>
          <p className="landing-section-sub">Profile to plan in minutes — then a living checklist that updates as you go.</p>
        </div>
        <div className="landing-middle-grid">
        <article className="landing-middle-card">
          <h3>How it works</h3>
          <div style={{ display: "grid", gap: 20 }}>
            {howSteps.map((step, i) => (
              <div className="landing-how-step" key={step.title}>
                <span className="landing-step-number">{i + 1}</span>
                <div>
                  <div className="landing-step-title">{step.title}</div>
                  <div className="landing-step-desc">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="landing-middle-card">
          <h3>Plain-English checklist</h3>
          <div>
            {checklistItems.map((item) => (
              <div className="lp-check-row" key={item.label}>
                <ChecklistIcon status={item.status} />
                <span style={{ color: item.status === "todo" ? "var(--muted)" : "var(--foreground)" }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="landing-middle-card">
          <h3>Common forms &amp; registrations</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px", lineHeight: 1.55 }}>
            We translate the forms every Maryland business runs into — and reuse what you upload.
          </p>
          <div className="lp-form-chips">
            {formChips.map((f) => (
              <span className="lp-form-pill" key={f}>
                <span className="lp-form-dot" aria-hidden="true" />
                {f}
              </span>
            ))}
          </div>
        </article>
        </div>
      </div>
    </section>
  );
}
