"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { api, getAccessToken } from "@/lib/api";
import type { AdminFoundersResponse } from "@/lib/types";

export default function AdminFoundersPage() {
  const [data, setData] = useState<AdminFoundersResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFounders() {
      const token = await getAccessToken();
      if (!token) {
        setError("Sign in with an admin account to view founders.");
        return;
      }
      try {
        setData(await api.getAdminFounders(token));
      } catch {
        setError("Could not load founder roster.");
      }
    }
    loadFounders();
  }, []);

  return (
    <AppShell>
      <div style={{ display: "grid", gap: 20 }}>
        <header style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
          <div>
            <h1 style={{ marginBottom: 8 }}>Founder roster</h1>
            <p style={{ color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>
              {data ? `${data.seat_count}/${data.cap} seats filled` : "Loading seat count..."}
            </p>
          </div>
          <Link className="button-secondary" href="/admin/leads">
            View waitlist leads
          </Link>
        </header>
        {error ? <div style={{ color: "#b42318", fontWeight: 700 }}>{error}</div> : null}
        <section className="panel" style={{ overflow: "auto" }}>
          <table style={{ borderCollapse: "collapse", minWidth: 760, width: "100%" }}>
            <thead>
              <tr style={{ background: "#eef5f1", textAlign: "left" }}>
                <th style={cellStyle}>#</th>
                <th style={cellStyle}>Email</th>
                <th style={cellStyle}>Name</th>
                <th style={cellStyle}>Status</th>
                <th style={cellStyle}>Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {(data?.founders || []).map((founder) => (
                <tr key={founder.founder_number}>
                  <td style={cellStyle}>{founder.founder_number}</td>
                  <td style={cellStyle}>{founder.email}</td>
                  <td style={cellStyle}>{founder.first_name || "—"}</td>
                  <td style={cellStyle}>{founder.subscription_status}</td>
                  <td style={cellStyle}>{founder.subscribed_at || "—"}</td>
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
