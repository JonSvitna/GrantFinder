"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DocumentCard } from "@/components/cards";
import { api } from "@/lib/api";
import type { DocumentItem } from "@/lib/types";

export default function PaperworkPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  useEffect(() => {
    api.getDocuments().then(setDocuments).catch(() => setDocuments([]));
  }, []);

  return (
    <AppShell>
      <div style={{ display: "grid", gap: 20 }}>
        <header>
          <h1 style={{ marginBottom: 8 }}>Paperwork navigator</h1>
          <p style={{ color: "var(--muted)", lineHeight: 1.55 }}>Plain-English guides for common business, tax, procurement, and grant documents.</p>
        </header>
        <section style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {documents.map((document) => <DocumentCard document={document} key={document.id} />)}
        </section>
      </div>
    </AppShell>
  );
}
