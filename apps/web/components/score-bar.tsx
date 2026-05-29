export function ScoreBar({ label, score, reason }: { label: string; score: number; reason?: string }) {
  const color = score >= 75 ? "var(--green)" : score >= 50 ? "var(--blue)" : "#b45309";

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
