"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { api, getAccessToken } from "@/lib/api";
import type { AdminLead } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLeads() {
      const token = await getAccessToken();
      if (!token) {
        setError("Sign in with an admin account to view leads.");
        return;
      }
      try {
        setLeads(await api.getAdminLeads(token));
      } catch {
        setError("Could not load waitlist leads.");
      }
    }
    loadLeads();
  }, []);

  async function downloadCsv() {
    const token = await getAccessToken();
    if (!token) {
      return;
    }
    const response = await fetch(`${API_BASE_URL}/api/admin/leads?format=csv`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      setError("CSV download failed.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "leads.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <div style={{ display: "grid", gap: 20 }}>
        <header style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
          <div>
            <h1 style={{ marginBottom: 8 }}>Waitlist leads</h1>
            <p style={{ color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>Export and review free waitlist signups.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="button-primary" onClick={downloadCsv} type="button">
              Download CSV
            </button>
            <Link className="button-secondary" href="/admin/founders">
              View founders
            </Link>
          </div>
        </header>
        {error ? <div style={{ color: "#b42318", fontWeight: 700 }}>{error}</div> : null}
        <section className="panel" style={{ overflow: "auto" }}>
          <table style={{ borderCollapse: "collapse", minWidth: 720, width: "100%" }}>
            <thead>
              <tr style={{ background: "#eef5f1", textAlign: "left" }}>
                <th style={cellStyle}>Email</th>
                <th style={cellStyle}>First name</th>
                <th style={cellStyle}>Source</th>
                <th style={cellStyle}>Created</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={`${lead.email}-${lead.created_at}`}>
                  <td style={cellStyle}>{lead.email}</td>
                  <td style={cellStyle}>{lead.first_name}</td>
                  <td style={cellStyle}>{lead.source}</td>
                  <td style={cellStyle}>{lead.created_at}</td>
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
