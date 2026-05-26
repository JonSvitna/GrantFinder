"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Disclaimer } from "@/components/disclaimer";
import { api } from "@/lib/api";
import type { DocumentItem } from "@/lib/types";

export default function DocumentDetailPage() {
  const params = useParams<{ documentId: string }>();
  const [document, setDocument] = useState<DocumentItem | null>(null);

  useEffect(() => {
    api.getDocument(params.documentId).then(setDocument).catch(() => setDocument(null));
  }, [params.documentId]);

  return (
    <AppShell>
      {document ? (
        <article style={{ display: "grid", gap: 18, maxWidth: 860 }}>
          <span style={{ color: "var(--blue)", fontWeight: 800 }}>{document.category}</span>
          <h1 style={{ margin: 0 }}>{document.name}</h1>
          <p style={{ color: "var(--muted)", fontSize: 18, lineHeight: 1.6 }}>{document.summary}</p>
          <Info title="Who needs it" copy={document.who_needs_it} />
          <Info title="Why it matters" copy={document.why_it_matters} />
          <section className="panel" style={{ padding: 20 }}>
            <h2 style={{ marginTop: 0 }}>Information required</h2>
            <ul style={{ color: "var(--muted)", lineHeight: 1.8 }}>
              {document.required_information.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
          <section className="panel" style={{ padding: 20 }}>
            <h2 style={{ marginTop: 0 }}>Common mistakes</h2>
            <ul style={{ color: "var(--muted)", lineHeight: 1.8 }}>
              {document.common_mistakes.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
          <section className="panel" style={{ padding: 20 }}>
            <h2 style={{ marginTop: 0 }}>Steps</h2>
            <ol style={{ color: "var(--muted)", lineHeight: 1.8 }}>
              {document.steps.map((item) => <li key={item}>{item}</li>)}
            </ol>
            <a className="button-primary" href={document.official_url} rel="noreferrer" target="_blank">Open official form or source</a>
          </section>
          <Disclaimer />
        </article>
      ) : (
        <p>Loading document...</p>
      )}
    </AppShell>
  );
}

function Info({ title, copy }: { title: string; copy: string }) {
  return (
    <section className="panel" style={{ padding: 20 }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <p style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: 0 }}>{copy}</p>
    </section>
  );
}
