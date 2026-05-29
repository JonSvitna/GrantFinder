"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navSections = [
  {
    label: "Overview",
    items: [{ href: "/admin/leads", label: "Waitlist leads" }],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/founders", label: "Founder roster" },
      { href: "/admin/sources", label: "Source management" },
    ],
  },
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
        {navSections.map((section) => (
          <div key={section.label} className="admin-nav-section">
            <div className="admin-nav-section-label">{section.label}</div>
            <nav style={{ display: "grid", gap: 4 }}>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  className={`admin-nav-link${pathname === item.href ? " admin-nav-link-active" : ""}`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        ))}
        <p style={{ color: "var(--muted)", fontSize: 11, lineHeight: 1.5, margin: 0 }}>
          Phase 2: review queue, ingestion, KPIs
        </p>
      </aside>
      <div className="app-main">
        <header className="admin-topbar">
          <div className="admin-topbar-copy">
            <h1 className="admin-topbar-title">{title}</h1>
            <p className="admin-topbar-description">{description}</p>
          </div>
          {actions ? <div className="admin-topbar-actions">{actions}</div> : null}
        </header>
        <main className="app-content admin-dashboard-content">{children}</main>
      </div>
    </div>
  );
}
