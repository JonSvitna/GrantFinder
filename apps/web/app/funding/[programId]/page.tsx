"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Disclaimer } from "@/components/disclaimer";
import { api } from "@/lib/api";
import type { Program } from "@/lib/types";

export default function ProgramDetailPage() {
  const params = useParams<{ programId: string }>();
  const [program, setProgram] = useState<Program | null>(null);

  useEffect(() => {
    api.getProgram(params.programId).then(setProgram).catch(() => setProgram(null));
  }, [params.programId]);

  return (
    <AppShell>
      {program ? (
        <article style={{ display: "grid", gap: 18, maxWidth: 860 }}>
          <span style={{ color: "var(--green)", fontWeight: 800 }}>{program.funding_type}</span>
          <h1 style={{ margin: 0 }}>{program.name}</h1>
          <p style={{ color: "var(--muted)", fontSize: 18, lineHeight: 1.6 }}>{program.best_fit}</p>
          <section className="panel" style={{ padding: 20 }}>
            <h2 style={{ marginTop: 0 }}>Eligibility summary</h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>{program.eligibility_summary}</p>
            <p><strong>Confidence:</strong> {program.confidence}</p>
            <p><strong>Difficulty:</strong> {program.difficulty}</p>
            <p><strong>Estimated time:</strong> {program.estimated_time}</p>
          </section>
          <section className="panel" style={{ padding: 20 }}>
            <h2 style={{ marginTop: 0 }}>Documents likely needed</h2>
            <ul style={{ color: "var(--muted)", lineHeight: 1.8 }}>
              {program.required_documents.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
          <section className="panel" style={{ padding: 20 }}>
            <h2 style={{ marginTop: 0 }}>Next best action</h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>{program.next_action}</p>
            <a className="button-primary" href={program.official_url} rel="noreferrer" target="_blank">Open official source</a>
          </section>
          <Disclaimer />
        </article>
      ) : (
        <p>Loading program...</p>
      )}
    </AppShell>
  );
}
