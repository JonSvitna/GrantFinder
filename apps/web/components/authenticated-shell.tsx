"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { api, getAccessToken } from "@/lib/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/funding", label: "Funding" },
  { href: "/paperwork", label: "Paperwork" },
  { href: "/tasks", label: "Tasks" },
];

export function AuthenticatedShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [headerTitle, setHeaderTitle] = useState("Welcome back");
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
          setHeaderTitle(user.email);
        }
        return;
      }

      try {
        const dashboard = await api.getDashboard(userId, token);
        setHeaderTitle(dashboard.profile.business_name || dashboard.user.email);
      } catch {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) {
          setHeaderTitle(user.email);
        }
      }
    }

    loadHeader();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <Link className="app-sidebar-title" href="/">
            SMB Funding Navigator
          </Link>
          <div className="app-sidebar-subtitle">Maryland MVP</div>
        </div>
        <nav className="app-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              className={`app-nav-link${pathname === item.href || pathname.startsWith(`${item.href}/`) ? " app-nav-link-active" : ""}`}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button className="button-secondary" onClick={signOut} style={{ justifySelf: "start" }} type="button">
          Sign out
        </button>
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-label">Founder dashboard</div>
          <h1 className="app-topbar-title">{headerTitle}</h1>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
