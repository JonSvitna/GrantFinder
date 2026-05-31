"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { AdminKpiCard, AdminKpiGrid, AdminTable, cellStyle } from "@/components/admin-ui";
import { api, getAccessToken } from "@/lib/api";
import type { AdminFoundersResponse, AdminLead, Source } from "@/lib/types";

export default function AdminFoundersPage() {
  const [data, setData] = useState<AdminFoundersResponse | null>(null);
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFounders() {
      const token = await getAccessToken();
      if (!token) {
        setError("Sign in with an admin account to view founders.");
        return;
      }
      try {
        const [founderRows, leadRows, sourceRows] = await Promise.all([
          api.getAdminFounders(token),
          api.getAdminLeads(token),
          api.getAdminSources(token),
        ]);
        setData(founderRows);
        setLeads(leadRows);
        setSources(sourceRows);
      } catch {
        setError("Could not load founder roster.");
      }
    }
    loadFounders();
  }, []);

  return (
    <AdminShell
      actions={
        <Link className="button-secondary" href="/admin/leads">
          View waitlist leads
        </Link>
      }
      description={data ? `${data.seat_count}/${data.cap} seats filled` : "Loading seat count..."}
      title="Founder roster"
    >
      {error ? <div style={{ color: "#b42318", fontWeight: 700 }}>{error}</div> : null}
      <AdminKpiGrid>
        <AdminKpiCard detail={`${leads.length} total signups`} label="Waitlist leads" value={String(leads.length)} />
        <AdminKpiCard
          detail={data ? `${data.cap - data.seat_count} spots left` : "Loading seats..."}
          label="Founder seats"
          value={data ? `${data.seat_count}/${data.cap}` : "—"}
        />
        <AdminKpiCard detail="Seeded Maryland data" label="Active sources" value={String(sources.length)} />
      </AdminKpiGrid>
      <AdminTable headers={["#", "Email", "Name", "Status", "Subscribed"]}>
        {(data?.founders || []).map((founder) => (
          <tr key={founder.founder_number}>
            <td style={cellStyle}>{founder.founder_number}</td>
            <td style={cellStyle}>{founder.email}</td>
            <td style={cellStyle}>{founder.first_name || "—"}</td>
            <td style={cellStyle}>{founder.subscription_status}</td>
            <td style={cellStyle}>{founder.subscribed_at || "—"}</td>
          </tr>
        ))}
      </AdminTable>
    </AdminShell>
  );
}
