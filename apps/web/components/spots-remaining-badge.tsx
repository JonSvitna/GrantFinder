export function SpotsRemainingBadge({ spotsRemaining, capReached }: { spotsRemaining: number; capReached: boolean }) {
  if (capReached) {
    return (
      <span
        style={{
          background: "#fdecea",
          border: "1px solid #f5c2c0",
          borderRadius: 999,
          color: "#b42318",
          display: "inline-flex",
          fontSize: 13,
          fontWeight: 800,
          padding: "6px 12px",
        }}
      >
        Sold out — join waitlist
      </span>
    );
  }

  return (
    <span
      style={{
        background: "#eef5f1",
        border: "1px solid var(--border)",
        borderRadius: 999,
        color: "var(--navy)",
        display: "inline-flex",
        fontSize: 13,
        fontWeight: 800,
        padding: "6px 12px",
      }}
    >
      {spotsRemaining} founder {spotsRemaining === 1 ? "spot" : "spots"} left
    </span>
  );
}
