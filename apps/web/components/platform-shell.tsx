"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { api, getAccessToken } from "@/lib/api";
import { PRODUCT_NAV } from "@/lib/navigation";

export function PlatformShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState("Welcome back");
  const [businessName, setBusinessName] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function loadHeader() {
      const token = await getAccessToken();
      const userId = localStorage.getItem("smbfn_user_id");
      if (!token || !userId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) {
          setDisplayName(user.email.split("@")[0] || user.email);
        }
        return;
      }

      try {
        const dashboard = await api.getDashboard(userId, token);
        setBusinessName(dashboard.profile.business_name || "");
        setDisplayName(dashboard.profile.business_name || dashboard.user.email.split("@")[0] || dashboard.user.email);
      } catch {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) {
          setDisplayName(user.email.split("@")[0] || user.email);
        }
      }
    }

    loadHeader();
  }, [supabase.auth]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return (
    <div className="app-layout user-dashboard-layout">
      <aside className="user-sidebar">
        <div className="user-sidebar-brand">
          <Link className="user-sidebar-title" href="/dashboard">
            SMB Funding Navigator
          </Link>
          <div className="user-sidebar-subtitle">Maryland MVP</div>
        </div>
        <nav className="user-nav">
          {PRODUCT_NAV.map((item) => (
            <Link
              key={item.href}
              className={`user-nav-link${
                pathname === item.href || pathname.startsWith(`${item.href}/`) ? " user-nav-link-active" : ""
              }`}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="user-sidebar-card">
          <strong style={{ color: "var(--navy)", fontSize: 13 }}>Get business-ready faster</strong>
          <div className="user-sidebar-progress">
            <span style={{ background: "var(--green)", borderRadius: 999, height: 6, width: "75%" }} />
          </div>
          <span style={{ color: "var(--muted)", fontSize: 11 }}>75% complete</span>
          <Link href="/dashboard" style={{ color: "var(--green)", fontSize: 12, fontWeight: 700 }}>
            View my progress
          </Link>
        </div>
        <button className="button-secondary" onClick={signOut} style={{ justifySelf: "start" }} type="button">
          Sign out
        </button>
      </aside>
      <div className="app-main">
        <header className="user-topbar">
          <span className="landing-header-badge">Maryland-first</span>
          <div className="user-topbar-actions">
            <span aria-hidden="true" className="user-topbar-bell">
              🔔
            </span>
            <div className="user-topbar-profile">
              <span className="user-topbar-avatar">{initials || "U"}</span>
              <div>
                <div style={{ color: "var(--navy)", fontSize: 13, fontWeight: 800 }}>{displayName}</div>
                {businessName ? (
                  <div style={{ color: "var(--muted)", fontSize: 11 }}>{businessName}</div>
                ) : null}
              </div>
            </div>
          </div>
        </header>
        <main className="app-content user-dashboard-content">{children}</main>
      </div>
    </div>
  );
}
