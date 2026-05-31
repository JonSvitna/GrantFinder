"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { AdminKpiCard, AdminKpiGrid, AdminTable, PhaseTwoNote, cellStyle } from "@/components/admin-ui";
import { api, getAccessToken } from "@/lib/api";
import type { AdminFoundersResponse, AdminLead, Source } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [founders, setFounders] = useState<AdminFoundersResponse | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAdminData() {
      const token = await getAccessToken();
      if (!token) {
        setError("Sign in with an admin account to view leads.");
        return;
      }
      try {
        const [leadRows, founderRows, sourceRows] = await Promise.all([
          api.getAdminLeads(token),
          api.getAdminFounders(token),
          api.getAdminSources(token),
        ]);
        setLeads(leadRows);
        setFounders(founderRows);
        setSources(sourceRows);
      } catch {
        setError("Could not load waitlist leads.");
      }
    }
    loadAdminData();
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
    <AdminShell
      actions={
        <>
          <button className="button-primary" onClick={downloadCsv} type="button">
            Download CSV
          </button>
          <Link className="button-secondary" href="/admin/founders">
            View founders
          </Link>
        </>
      }
      description="Export and review free waitlist signups."
      title="Waitlist leads"
    >
      {error ? <div style={{ color: "#b42318", fontWeight: 700 }}>{error}</div> : null}
      <AdminKpiGrid>
        <AdminKpiCard detail={`${leads.length} total signups`} label="Waitlist leads" value={String(leads.length)} />
        <AdminKpiCard
          detail={founders ? `${founders.cap - founders.seat_count} spots left` : "Loading seats..."}
          label="Founder seats"
          value={founders ? `${founders.seat_count}/${founders.cap}` : "—"}
        />
        <AdminKpiCard detail="Seeded Maryland data" label="Active sources" value={String(sources.length)} />
      </AdminKpiGrid>
      <AdminTable headers={["Email", "First name", "Source", "Created"]}>
        {leads.map((lead) => (
          <tr key={`${lead.email}-${lead.created_at}`}>
            <td style={cellStyle}>{lead.email}</td>
            <td style={cellStyle}>{lead.first_name}</td>
            <td style={cellStyle}>{lead.source}</td>
            <td style={cellStyle}>{lead.created_at}</td>
          </tr>
        ))}
      </AdminTable>
      <PhaseTwoNote />
    </AdminShell>
  );
}
