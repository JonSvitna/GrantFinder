import Link from "next/link";

export function ScoreBar({
  label,
  score,
  reason,
  compact = false,
}: {
  label: string;
  score: number;
  reason?: string;
  compact?: boolean;
}) {
  const color = score >= 75 ? "var(--green)" : score >= 50 ? "var(--navy)" : "#b45309";

  if (compact) {
    return (
      <div className="dashboard-score-card panel">
        <div
          className="dashboard-score-ring"
          style={{
            borderColor: color,
            color,
          }}
        >
          {score}%
        </div>
        <strong className="dashboard-score-label">{label}</strong>
      </div>
    );
  }

  return (
    <div className="panel" style={{ display: "grid", gap: 8, padding: 14 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
        <div
          style={{
            alignItems: "center",
            background: "#eef5f1",
            border: `4px solid ${color}`,
            borderRadius: "50%",
            display: "grid",
            flexShrink: 0,
            height: 44,
            placeItems: "center",
            width: 44,
          }}
        >
          <span style={{ color, fontSize: 11, fontWeight: 800 }}>{score}%</span>
        </div>
        <div style={{ display: "grid", gap: 2 }}>
          <strong style={{ fontSize: 13 }}>{label}</strong>
          <span style={{ color, fontSize: 18, fontWeight: 800 }}>{score}%</span>
        </div>
      </div>
      {reason ? <p style={{ color: "var(--muted)", fontSize: 11, lineHeight: 1.45, margin: 0 }}>{reason}</p> : null}
    </div>
  );
}

export function OverallScoreGauge({ score }: { score: number }) {
  const color = score >= 75 ? "var(--green)" : score >= 50 ? "var(--navy)" : "#b45309";

  return (
    <div className="dashboard-overall panel">
      <div className="dashboard-overall-ring" style={{ borderColor: color, color }}>
        <span className="dashboard-overall-value">{score}%</span>
        <span className="dashboard-overall-caption">On track</span>
      </div>
      <strong style={{ color: "var(--navy)", fontSize: 16 }}>Overall readiness score</strong>
      <Link href="/dashboard" style={{ color: "var(--green)", fontSize: 13, fontWeight: 700 }}>
        See dashboard
      </Link>
    </div>
  );
}
