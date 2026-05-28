"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { Disclaimer } from "@/components/disclaimer";
import { ProgramCard, TaskRow } from "@/components/cards";
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
      <div style={{ display: "grid", gap: 22 }}>
        <header>
          <h1 style={{ marginBottom: 8 }}>Readiness dashboard</h1>
          <p style={{ color: "var(--muted)", lineHeight: 1.55 }}>Your Maryland-first next steps, based on the profile you submitted.</p>
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
            <section style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
              {scores.map(([key, value]) => (
                <ScoreBar key={key} label={value.label} reason={value.reason} score={value.score} />
              ))}
            </section>
            <section style={{ display: "grid", gap: 14, gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
              <div className="panel" style={{ padding: 18 }}>
                <h2 style={{ marginTop: 0 }}>Missing paperwork</h2>
                <ul style={{ color: "var(--muted)", lineHeight: 1.8 }}>
                  {dashboard.readiness.missing_paperwork.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="panel" style={{ padding: 18 }}>
                <h2 style={{ marginTop: 0 }}>Priority actions</h2>
                <div style={{ display: "grid", gap: 10 }}>
                  {dashboard.priority_actions.slice(0, 3).map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </div>
              </div>
            </section>
            <section>
              <h2>Top matches</h2>
              <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                {dashboard.matches.slice(0, 3).map((match) => (
                  <ProgramCard key={match.program.id} program={match.program} />
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
