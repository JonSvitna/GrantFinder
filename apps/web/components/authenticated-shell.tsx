"use client";

import Link from "next/link";
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
  const [welcome, setWelcome] = useState("Welcome back");
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
          setWelcome(user.email);
        }
        return;
      }

      try {
        const dashboard = await api.getDashboard(userId, token);
        setWelcome(dashboard.user.email);
        setBusinessName(dashboard.profile.business_name);
      } catch {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) {
          setWelcome(user.email);
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
    <div style={{ display: "grid", minHeight: "100vh", gridTemplateColumns: "240px 1fr" }}>
      <aside style={{ background: "var(--navy)", color: "white", display: "grid", gap: 24, padding: 24 }}>
        <Link href="/" style={{ color: "white", fontSize: 18, fontWeight: 800 }}>
          SMB Funding Navigator
        </Link>
        <nav style={{ display: "grid", gap: 10 }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ color: "rgba(255,255,255,0.88)", fontSize: 15, fontWeight: 700 }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          className="button-secondary"
          onClick={signOut}
          style={{ justifySelf: "start" }}
          type="button"
        >
          Sign out
        </button>
      </aside>
      <div>
        <header style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.92)" }}>
          <div className="page-shell" style={{ paddingBottom: 16, paddingTop: 16 }}>
            <div style={{ color: "var(--muted)", fontSize: 14, fontWeight: 700 }}>Founder dashboard</div>
            <h1 style={{ color: "var(--navy)", fontSize: 28, margin: "6px 0 0" }}>{businessName || welcome}</h1>
          </div>
        </header>
        <main className="page-shell">{children}</main>
      </div>
    </div>
  );
}
