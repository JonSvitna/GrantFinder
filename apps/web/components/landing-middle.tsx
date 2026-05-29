import Link from "next/link";

const checklistItems = [
  { label: "Get your EIN", status: "Complete" },
  { label: "Register your business with Maryland", status: "Complete" },
  { label: "Set up a business bank account", status: "Complete" },
  { label: "Create a SAM.gov account", status: "In Progress" },
  { label: "Apply for funding opportunities", status: "Not Started" },
];

const formTiles = [
  { label: "W-9", href: "/paperwork" },
  { label: "SAM.gov", href: "/paperwork" },
  { label: "eMMA", href: "/paperwork" },
  { label: "EIN", href: "/paperwork" },
  { label: "Business Registration", href: "/paperwork" },
];

function statusClass(status: string) {
  if (status === "Complete") return "landing-status-complete";
  if (status === "In Progress") return "landing-status-progress";
  return "landing-status-not-started";
}

export function LandingMiddle() {
  return (
    <section className="landing-section">
      <div className="landing-middle-grid">
        <article className="landing-middle-card" id="how-it-works">
          <h3>How It Works</h3>
          <ol className="landing-step-list">
            <li>
              <span className="landing-step-number">1</span>
              Create Your Profile
            </li>
            <li>
              <span className="landing-step-number">2</span>
              Get Matched &amp; Guided
            </li>
            <li>
              <span className="landing-step-number">3</span>
              Take Action &amp; Grow
            </li>
          </ol>
        </article>

        <article className="landing-middle-card">
          <h3>Plain-English Checklist</h3>
          {checklistItems.map((item) => (
            <div className="landing-checklist-row" key={item.label}>
              <span>{item.label}</span>
              <span className={`landing-status-pill ${statusClass(item.status)}`}>{item.status}</span>
            </div>
          ))}
        </article>

        <article className="landing-middle-card">
          <h3>Common Forms &amp; Registrations</h3>
          <div className="landing-forms-grid">
            {formTiles.map((tile) => (
              <Link className="landing-form-tile" href={tile.href} key={tile.label}>
                <span aria-hidden="true">📋</span>
                {tile.label}
              </Link>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
