import Link from "next/link";
import { WaitlistForm } from "@/components/waitlist-form";

const linkColumns = [
  {
    title: "Product",
    links: [
      { href: "/funding", label: "Funding Matches" },
      { href: "/paperwork", label: "Paperwork Navigator" },
      { href: "/dashboard", label: "Readiness Dashboard" },
      { href: "/founder/checkout", label: "Pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/#how-it-works", label: "Maryland programs" },
      { href: "/paperwork", label: "Forms library" },
      { href: "/#how-it-works", label: "Guides" },
      { href: "/#about", label: "About" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="landing-footer" id="about">
      <div className="landing-footer-grid">
        <div className="landing-footer-brand">
          <div className="landing-footer-brand-mark-row">
            <span className="landing-brand-mark" aria-hidden="true" />
            <span className="landing-footer-brand-title">SMB Funding Navigator</span>
          </div>
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
          <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
            Maryland funding deadlines and new programs, monthly.
          </p>
          <WaitlistForm source="landing_footer" variant="subscribe" />
        </div>
      </div>

      <div className="landing-legal-bar">
        <div className="landing-legal-bar-inner">
          <div className="landing-legal-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">Disclaimer</a>
          </div>
          <span>© 2026 SMB Funding Navigator · Built for Maryland businesses 🦀</span>
        </div>
      </div>
    </footer>
  );
}
