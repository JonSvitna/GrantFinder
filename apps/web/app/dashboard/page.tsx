"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { MatchRow, PriorityTaskRow } from "@/components/cards";
import { Disclaimer } from "@/components/disclaimer";
import { OverallScoreGauge, ScoreBar } from "@/components/score-bar";
import { api, getAccessToken } from "@/lib/api";
import type { DashboardPayload } from "@/lib/types";

const progressSteps = ["Profile", "Paperwork", "Registrations", "Apply for Funding", "Launch"];

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

  const overallScore =
    scores.length > 0 ? Math.round(scores.reduce((sum, [, value]) => sum + value.score, 0) / scores.length) : 0;

  const businessName = dashboard?.profile.business_name || "Your business";
  const location = dashboard?.profile.county || "Maryland";

  return (
    <AuthenticatedShell>
      <div className="user-dashboard-page">
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
            <header className="dashboard-hero panel">
              <div className="dashboard-hero-copy">
                <span className="dashboard-hero-kicker">Welcome back!</span>
                <h1 className="dashboard-hero-title">{businessName}</h1>
                <p className="dashboard-hero-meta">{location}</p>
              </div>
              <div aria-hidden="true" className="dashboard-hero-art">
                Maryland
              </div>
            </header>

            <section className="dashboard-readiness-band">
              <OverallScoreGauge score={overallScore} />
              <div className="dashboard-score-grid">
                {scores.map(([key, value]) => (
                  <ScoreBar compact key={key} label={value.label} score={value.score} />
                ))}
              </div>
            </section>

            <section className="dashboard-columns">
              <article className="dashboard-col panel">
                <h2 className="dashboard-section-title">Top funding matches</h2>
                <div style={{ display: "grid", gap: 10 }}>
                  {dashboard.matches.slice(0, 3).map((match) => (
                    <MatchRow key={match.program.id} match={match} />
                  ))}
                </div>
              </article>

              <article className="dashboard-col panel">
                <h2 className="dashboard-section-title">Next best steps</h2>
                <div style={{ display: "grid", gap: 10 }}>
                  {dashboard.priority_actions.slice(0, 4).map((task) => (
                    <PriorityTaskRow key={task.id} task={task} />
                  ))}
                </div>
              </article>

              <article className="dashboard-col panel">
                <h2 className="dashboard-section-title">Missing documents</h2>
                <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                  {dashboard.readiness.missing_paperwork.map((item) => (
                    <div className="missing-item" key={item}>
                      <span className="missing-dot" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <h2 className="dashboard-section-title">Your progress timeline</h2>
                <div className="landing-preview-stepper">
                  {progressSteps.map((step, index) => (
                    <div
                      className={`landing-preview-step${index === 3 ? " landing-preview-step-active" : ""}`}
                      key={step}
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <Disclaimer />
          </>
        ) : null}
      </div>
    </AuthenticatedShell>
  );
}
