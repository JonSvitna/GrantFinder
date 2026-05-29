import type { ReactNode } from "react";

export function AdminKpiGrid({ children }: { children: ReactNode }) {
  return <section className="admin-kpi-grid">{children}</section>;
}

export function AdminKpiCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="admin-kpi-card">
      <span style={{ color: "var(--muted)", fontSize: 12 }}>{label}</span>
      <strong style={{ color: "var(--navy)", fontSize: 28 }}>{value}</strong>
      <span style={{ color: "var(--green)", fontSize: 12 }}>{detail}</span>
    </div>
  );
}

export function AdminTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <section className="panel" style={{ overflow: "auto", padding: 0 }}>
      <table style={{ borderCollapse: "collapse", minWidth: 720, width: "100%" }}>
        <thead>
          <tr style={{ background: "#eef5f1", textAlign: "left" }}>
            {headers.map((header) => (
              <th key={header} style={cellStyle}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </section>
  );
}

export function PhaseTwoNote() {
  return (
    <section className="phase-note">
      <strong style={{ fontSize: 13 }}>Phase 2 admin (reference mockup)</strong>
      <p style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.5, margin: 0 }}>
        Review queue, ingestion sync, KPI sparklines, and forms library management ship after launch.
      </p>
    </section>
  );
}

const cellStyle = {
  borderBottom: "1px solid var(--border)",
  padding: 14,
};

export { cellStyle };
