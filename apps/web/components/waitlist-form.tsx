"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { WaitlistInput } from "@/lib/types";

export function WaitlistForm({
  source,
  compact = false,
  variant = "default",
}: {
  source: WaitlistInput["source"];
  compact?: boolean;
  variant?: "default" | "hero" | "subscribe";
}) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isHero = variant === "hero";
  const isSubscribe = variant === "subscribe";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await api.joinWaitlist({ email, first_name: firstName, source });
      router.push("/waitlist/thanks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not save your signup.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: isHero || isSubscribe ? 12 : compact ? 10 : 14 }}>
      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: isHero || compact || isSubscribe ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        {isHero || isSubscribe ? (
          <>
            <input
              className="panel"
              placeholder="Email"
              required
              style={inputStyle}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <input
              className="panel"
              placeholder="First name"
              required
              style={inputStyle}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </>
        ) : (
          <>
            <input
              className="panel"
              placeholder="First name"
              required
              style={inputStyle}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
            <input
              className="panel"
              placeholder="Email"
              required
              style={inputStyle}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </>
        )}
      </div>
      {error ? <div style={{ color: "#b42318", fontWeight: 700 }}>{error}</div> : null}
      <button
        className={isHero ? "button-navy" : isSubscribe ? "button-blue" : "button-primary"}
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Joining..." : isHero ? "Join waitlist" : isSubscribe ? "Subscribe" : "Join free waitlist"}
      </button>
    </form>
  );
}

const inputStyle = {
  border: "1px solid var(--border)",
  minHeight: 44,
  padding: "0 12px",
  width: "100%",
};
