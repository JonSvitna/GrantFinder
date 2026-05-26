import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Disclaimer } from "@/components/disclaimer";

export default function HomePage() {
  return (
    <AppShell>
      <section style={{ display: "grid", gap: 24, padding: "48px 0" }}>
        <div style={{ display: "grid", gap: 18, maxWidth: 780 }}>
          <span style={{ color: "var(--green)", fontWeight: 800 }}>Maryland-first business guidance</span>
          <h1 style={{ color: "var(--navy)", fontSize: "clamp(40px, 7vw, 72px)", lineHeight: 1, margin: 0 }}>
            Find funding and paperwork steps without decoding government pages alone.
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 20, lineHeight: 1.55, margin: 0 }}>
            SMB Funding Navigator helps Maryland founders and small business owners identify likely funding, incentives,
            procurement readiness steps, and forms to review next.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link className="button-primary" href="/wizard">
              Find Funding & Paperwork Steps
            </Link>
            <Link className="button-secondary" href="/paperwork">
              Browse paperwork guides
            </Link>
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: 28 }}>
        {[
          ["Funding matches", "See grants, loans, rebates, tax credits, procurement steps, and county programs that may fit."],
          ["Plain-English paperwork", "Understand W-9, EIN, SAM.gov, eMMA, SDAT, certifications, NAICS, and grant budget basics."],
          ["Readiness dashboard", "Turn missing documents and profile answers into a prioritized action list."],
        ].map(([title, copy]) => (
          <article className="panel" key={title} style={{ padding: 20 }}>
            <h2 style={{ fontSize: 22, marginTop: 0 }}>{title}</h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.55, marginBottom: 0 }}>{copy}</p>
          </article>
        ))}
      </section>

      <Disclaimer />
    </AppShell>
  );
}
