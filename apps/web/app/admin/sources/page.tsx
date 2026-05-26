"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { api } from "@/lib/api";
import type { Source } from "@/lib/types";

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    api.getAdminSources().then(setSources).catch(() => setSources([]));
  }, []);

  return (
    <AppShell>
      <div style={{ display: "grid", gap: 20 }}>
        <header>
          <h1 style={{ marginBottom: 8 }}>Source management</h1>
          <p style={{ color: "var(--muted)", lineHeight: 1.55 }}>Basic MVP visibility into official sources, seeded programs, and paperwork records.</p>
        </header>
        <section className="panel" style={{ overflow: "auto" }}>
          <table style={{ borderCollapse: "collapse", minWidth: 760, width: "100%" }}>
            <thead>
              <tr style={{ background: "#eef5f1", textAlign: "left" }}>
                <th style={cellStyle}>Source</th>
                <th style={cellStyle}>Agency</th>
                <th style={cellStyle}>Jurisdiction</th>
                <th style={cellStyle}>Records</th>
                <th style={cellStyle}>Last checked</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id}>
                  <td style={cellStyle}><a href={source.url} rel="noreferrer" target="_blank">{source.name}</a></td>
                  <td style={cellStyle}>{source.agency}</td>
                  <td style={cellStyle}>{source.jurisdiction}</td>
                  <td style={cellStyle}>{source.program_count ?? 0} programs / {source.document_count ?? 0} docs</td>
                  <td style={cellStyle}>{source.last_checked_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}

const cellStyle = {
  borderBottom: "1px solid var(--border)",
  padding: 14,
};
