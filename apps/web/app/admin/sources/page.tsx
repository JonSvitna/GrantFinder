"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { AdminKpiCard, AdminKpiGrid, AdminTable, cellStyle } from "@/components/admin-ui";
import { api, getAccessToken } from "@/lib/api";
import type { AdminFoundersResponse, AdminLead, Source } from "@/lib/types";

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [founders, setFounders] = useState<AdminFoundersResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSources() {
      const token = await getAccessToken();
      if (!token) {
        setError("Sign in with an admin account to view sources.");
        return;
      }
      try {
        const [sourceRows, leadRows, founderRows] = await Promise.all([
          api.getAdminSources(token),
          api.getAdminLeads(token),
          api.getAdminFounders(token),
        ]);
        setSources(sourceRows);
        setLeads(leadRows);
        setFounders(founderRows);
      } catch {
        setError("Could not load source visibility.");
      }
    }
    loadSources();
  }, []);

  return (
    <AdminShell
      actions={
        <Link className="button-secondary" href="/admin/leads">
          View waitlist leads
        </Link>
      }
      description="Basic MVP visibility into official sources, seeded programs, and paperwork records."
      title="Sources"
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
      <AdminTable headers={["Source", "Agency", "Jurisdiction", "Records", "Last checked"]}>
        {sources.map((source) => (
          <tr key={source.id}>
            <td style={cellStyle}>
              <a href={source.url} rel="noreferrer" target="_blank">
                {source.name}
              </a>
            </td>
            <td style={cellStyle}>{source.agency}</td>
            <td style={cellStyle}>{source.jurisdiction}</td>
            <td style={cellStyle}>
              {source.program_count ?? 0} programs / {source.document_count ?? 0} docs
            </td>
            <td style={cellStyle}>{source.last_checked_at}</td>
          </tr>
        ))}
      </AdminTable>
    </AdminShell>
  );
}
