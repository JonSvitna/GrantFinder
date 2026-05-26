export function ScoreBar({ label, score, reason }: { label: string; score: number; reason?: string }) {
  const color = score >= 75 ? "var(--green)" : score >= 50 ? "var(--blue)" : "#b45309";

  return (
    <div className="panel" style={{ padding: 16 }}>
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 12 }}>
        <strong>{label}</strong>
        <span style={{ color, fontWeight: 800 }}>{score}%</span>
      </div>
      <div style={{ background: "#e8eef4", borderRadius: 999, height: 10, marginTop: 12, overflow: "hidden" }}>
        <div style={{ background: color, height: "100%", width: `${Math.max(0, Math.min(score, 100))}%` }} />
      </div>
      {reason ? <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.45, marginBottom: 0 }}>{reason}</p> : null}
    </div>
  );
}
