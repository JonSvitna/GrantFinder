import Link from "next/link";
import { Disclaimer } from "@/components/disclaimer";
import { WaitlistForm } from "@/components/waitlist-form";

const linkColumns = [
  {
    title: "Funding",
    links: [
      { href: "/funding", label: "Overview" },
      { href: "/funding", label: "Programs" },
    ],
  },
  {
    title: "Paperwork",
    links: [
      { href: "/paperwork", label: "Forms" },
      { href: "/paperwork", label: "Registrations" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "#how-it-works", label: "How It Works" },
      { href: "#features", label: "Incentives" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "#about", label: "About Us" },
      { href: "#disclaimer", label: "Disclaimer" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="landing-footer" id="about">
      <div className="landing-footer-grid">
        <div className="landing-footer-brand">
          <span className="landing-footer-brand-title">SMB Funding Navigator</span>
          <p className="landing-footer-brand-copy">
            Maryland-first guidance for funding, paperwork, and business readiness.
          </p>
        </div>

        {linkColumns.map((column) => (
          <div className="landing-footer-column" key={column.title}>
            <h4>{column.title}</h4>
            {column.links.map((link) => (
              <Link href={link.href} key={link.label}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}

        <div className="landing-footer-subscribe">
          <h4>Stay in the loop</h4>
          <WaitlistForm source="landing_footer" variant="subscribe" />
          <div className="landing-footer-social">
            <a href="#">LinkedIn</a>
            <a href="#">Facebook</a>
            <a href="#">YouTube</a>
            <a href="#">Email</a>
          </div>
        </div>
      </div>

      <div id="disclaimer">
        <Disclaimer />
      </div>

      <div className="landing-legal-bar">
        <span>© 2026 SMB Funding Navigator</span>
        <span>
          <a href="#">Privacy Policy</a>
          {" · "}
          <a href="#">Terms of Use</a>
          {" · "}
          <a href="#disclaimer">Disclaimer</a>
        </span>
        <span>Built for Maryland businesses 🦀</span>
      </div>
    </footer>
  );
}
