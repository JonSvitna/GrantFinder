"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { href: "/admin/leads", label: "Waitlist leads" },
  { href: "/admin/founders", label: "Founder roster" },
  { href: "/admin/sources", label: "Sources" },
];

export function AdminShell({
  children,
  title,
  description,
  actions,
}: {
  children: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="app-layout admin-layout">
      <aside className="admin-sidebar">
        <div>
          <div style={{ color: "var(--navy)", fontSize: 15, fontWeight: 800 }}>SMB Funding Navigator</div>
          <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>Admin MVP</div>
        </div>
        <nav style={{ display: "grid", gap: 6 }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              className={`admin-nav-link${pathname === item.href ? " admin-nav-link-active" : ""}`}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p style={{ color: "var(--muted)", fontSize: 11, lineHeight: 1.5, margin: 0 }}>
          Phase 2: review queue, ingestion, KPIs
        </p>
      </aside>
      <div className="app-main">
        <header
          className="app-topbar"
          style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}
        >
          <div>
            <h1 className="app-topbar-title" style={{ marginTop: 0 }}>
              {title}
            </h1>
            <p style={{ color: "var(--muted)", lineHeight: 1.55, margin: "6px 0 0" }}>{description}</p>
          </div>
          {actions ? <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>{actions}</div> : null}
        </header>
        <main className="app-content" style={{ display: "grid", gap: 16 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
