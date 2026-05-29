"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { MatchRow, PriorityTaskRow } from "@/components/cards";
import { Disclaimer } from "@/components/disclaimer";
import { ScoreBar } from "@/components/score-bar";
import { api, getAccessToken } from "@/lib/api";
import type { DashboardPayload } from "@/lib/types";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const userId = localStorage.getItem("smbfn_user_id");
      const token = await getAccessToken();
      if (!userId) {
        setError("Complete the wizard first so we can build your dashboard.");
        return;
      }
      try {
        setDashboard(await api.getDashboard(userId, token || undefined));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Dashboard unavailable.");
      }
    }
    loadDashboard();
  }, []);

  const scores = dashboard
    ? Object.entries(dashboard.readiness).filter((entry): entry is [string, { label: string; score: number; reason: string }] => {
        const [, value] = entry;
        return !Array.isArray(value);
      })
    : [];

  return (
    <AuthenticatedShell>
      <div style={{ display: "grid", gap: 20 }}>
        <header>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Readiness dashboard</h1>
          <p style={{ color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>
            Your Maryland-first next steps, based on the profile you submitted.
          </p>
        </header>
        {error ? (
          <div className="panel" style={{ padding: 20 }}>
            <p style={{ color: "var(--muted)" }}>{error}</p>
            <Link className="button-primary" href="/wizard">
              Start wizard
            </Link>
          </div>
        ) : null}
        {dashboard ? (
          <>
            <section className="dashboard-score-grid">
              {scores.map(([key, value]) => (
                <ScoreBar key={key} label={value.label} reason={value.reason} score={value.score} />
              ))}
            </section>
            <section className="dashboard-two-col">
              <div className="panel" style={{ padding: 18 }}>
                <h2 className="dashboard-section-title">Missing paperwork</h2>
                <div style={{ display: "grid", gap: 10 }}>
                  {dashboard.readiness.missing_paperwork.map((item) => (
                    <div className="missing-item" key={item}>
                      <span className="missing-dot" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel" style={{ padding: 18 }}>
                <h2 className="dashboard-section-title">Priority actions</h2>
                <div style={{ display: "grid", gap: 10 }}>
                  {dashboard.priority_actions.slice(0, 3).map((task) => (
                    <PriorityTaskRow key={task.id} task={task} />
                  ))}
                </div>
              </div>
            </section>
            <section className="panel" style={{ padding: 18 }}>
              <h2 className="dashboard-section-title">Top matches</h2>
              <div style={{ display: "grid", gap: 10 }}>
                {dashboard.matches.slice(0, 3).map((match) => (
                  <MatchRow key={match.program.id} match={match} />
                ))}
              </div>
            </section>
            <Disclaimer />
          </>
        ) : null}
      </div>
    </AuthenticatedShell>
  );
}
