export function BlurredScoreBar({ label, reason }: { label: string; reason?: string }) {
  return (
    <div className="panel" style={{ padding: 16, position: "relative" }}>
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 12 }}>
        <strong>{label}</strong>
        <span
          style={{
            color: "var(--muted)",
            filter: "blur(6px)",
            fontWeight: 800,
            userSelect: "none",
          }}
        >
          ??
        </span>
      </div>
      <div style={{ background: "#e8eef4", borderRadius: 999, height: 10, marginTop: 12, overflow: "hidden", position: "relative" }}>
        <div
          style={{
            background: "var(--green)",
            filter: "blur(8px)",
            height: "100%",
            opacity: 0.35,
            width: "62%",
          }}
        />
      </div>
      {reason ? <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.45, marginBottom: 0 }}>{reason}</p> : null}
    </div>
  );
}
