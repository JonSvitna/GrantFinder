"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProgramCard } from "@/components/cards";
import { api } from "@/lib/api";
import type { Program } from "@/lib/types";

export default function FundingPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filter, setFilter] = useState("all");
  const categories = ["all", ...Array.from(new Set(programs.map((program) => program.category)))];
  const visible = filter === "all" ? programs : programs.filter((program) => program.category === filter);

  useEffect(() => {
    api.getPrograms().then(setPrograms).catch(() => setPrograms([]));
  }, []);

  return (
    <AppShell>
      <div style={{ display: "grid", gap: 20 }}>
        <header>
          <h1 style={{ marginBottom: 8 }}>Funding matches and readiness programs</h1>
          <p style={{ color: "var(--muted)", lineHeight: 1.55 }}>Explore Maryland-first grants, loans, procurement steps, rebates, and support categories.</p>
        </header>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {categories.map((category) => (
            <button className={filter === category ? "button-primary" : "button-secondary"} key={category} onClick={() => setFilter(category)} type="button">
              {category}
            </button>
          ))}
        </div>
        <section style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {visible.map((program) => <ProgramCard key={program.id} program={program} />)}
        </section>
      </div>
    </AppShell>
  );
}
