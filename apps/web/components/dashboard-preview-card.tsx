const programs = [
  { name: "Maryland Small Business Relief Grant", match: 92 },
  { name: "MDOT MBE / DBE Certification Support", match: 88 },
  { name: "Anne Arundel Economic Development Loan", match: 81 },
];

function ReadinessGauge({ value, size = 92 }: { value: number; size?: number }) {
  const r = size / 2 - 9;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  const cx = size / 2;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e9eef2" strokeWidth="9" />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="var(--green)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <div>
          <div style={{ fontSize: Math.round(size * 0.26), fontWeight: 800, color: "var(--navy)", lineHeight: 1 }}>
            {value}
          </div>
          <div
            style={{
              fontSize: Math.max(8, Math.round(size * 0.09)),
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginTop: 2,
            }}
          >
            Ready
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--green)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export function DashboardPreviewCard() {
  return (
    <aside aria-label="Dashboard preview" className="landing-preview">
      <div className="lp-pv-head">
        <div className="lp-pv-head-title">Welcome back, Alex 👋</div>
        <span className="lp-pv-badge">71% On Track</span>
      </div>

      <div className="lp-pv-row">
        <ReadinessGauge value={71} size={92} />
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--navy)" }}>Business readiness overview</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 5, lineHeight: 1.5 }}>
            Chesapeake Print Co. · Anne Arundel
          </div>
        </div>
      </div>

      <div className="lp-pv-list-label">Top funding matches</div>
      <div className="lp-pv-list">
        {programs.map((p) => (
          <div className="lp-pv-match" key={p.name}>
            <span style={{ fontWeight: 600, fontSize: 12.5, color: "var(--foreground)" }}>{p.name}</span>
            <span className="lp-pv-match-badge">{p.match}%</span>
          </div>
        ))}
      </div>

      <div className="lp-pv-next">
        <div>
          <div className="lp-pv-next-lab">Next recommended step</div>
          <div className="lp-pv-next-step">Complete SAM.gov registration</div>
        </div>
        <ArrowIcon />
      </div>
    </aside>
  );
}
