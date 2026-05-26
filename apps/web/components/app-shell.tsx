import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/funding", label: "Funding" },
  { href: "/paperwork", label: "Paperwork" },
  { href: "/tasks", label: "Tasks" },
  { href: "/admin/sources", label: "Admin" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.88)" }}>
        <div className="page-shell" style={{ alignItems: "center", display: "flex", justifyContent: "space-between", paddingBottom: 16, paddingTop: 16 }}>
          <Link href="/" style={{ color: "var(--navy)", fontSize: 20, fontWeight: 800 }}>
            SMB Funding Navigator
          </Link>
          <nav style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} style={{ color: "var(--muted)", fontSize: 14, fontWeight: 700 }}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="page-shell">{children}</main>
    </>
  );
}
