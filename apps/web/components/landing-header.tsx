"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MARKETING_NAV } from "@/lib/navigation";
import { fetchSubscription, isAdminEmail } from "@/lib/subscription";

export function LandingHeader({
  spotsRemaining,
  capReached,
}: {
  spotsRemaining?: number;
  capReached?: boolean;
}) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [hasProductAccess, setHasProductAccess] = useState(false);
  const [roleHome, setRoleHome] = useState("/dashboard");

  useEffect(() => {
    async function loadAuthState() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsSignedIn(false);
        return;
      }

      setIsSignedIn(true);
      const email = session.user.email;
      if (isAdminEmail(email)) {
        setHasProductAccess(true);
        setRoleHome("/admin/leads");
        return;
      }

      try {
        const subscription = await fetchSubscription(session.access_token);
        if (subscription.status === "active") {
          setHasProductAccess(true);
          setRoleHome("/dashboard");
        } else {
          setHasProductAccess(false);
          setRoleHome("/founder/checkout");
        }
      } catch {
        setHasProductAccess(false);
        setRoleHome("/founder/checkout");
      }
    }

    loadAuthState();
  }, []);

  function resolveNavHref(item: (typeof MARKETING_NAV)[number]): string {
    if (!item.productLink) {
      return item.href;
    }
    if (hasProductAccess) {
      return item.href;
    }
    if (isSignedIn) {
      return "/founder/checkout";
    }
    return `/login?next=${encodeURIComponent(item.href)}`;
  }

  return (
    <header className="landing-header">
      <div className="landing-header-inner">
        <div className="landing-brand-row">
          <Link className="landing-brand" href="/">
            <span aria-hidden="true" className="landing-brand-mark" />
            <span className="landing-brand-text">
              <span className="landing-brand-title">SMB Funding Navigator</span>
              <span className="landing-brand-subtitle">Maryland MVP</span>
            </span>
          </Link>
          <span className="landing-header-badge">Maryland-first</span>
        </div>

        <nav aria-label="Primary" className="landing-nav">
          {MARKETING_NAV.map((item) => (
            <Link key={item.href} href={resolveNavHref(item)}>
              {item.label}
              <span aria-hidden="true"> ▾</span>
            </Link>
          ))}
        </nav>

        <div className="landing-actions">
          {isSignedIn ? (
            <Link className="button-secondary landing-header-button" href={roleHome}>
              {hasProductAccess ? "Dashboard" : "Founder checkout"}
            </Link>
          ) : (
            <Link className="button-secondary landing-header-button" href="/login">
              Log in
            </Link>
          )}
          {spotsRemaining !== undefined && !capReached ? (
            <span className="landing-header-badge landing-header-spots">{spotsRemaining}/50 spots left</span>
          ) : null}
          <Link
            className={`landing-header-button ${capReached ? "button-secondary" : "button-primary"}`}
            href={capReached ? "/waitlist/thanks" : "/founder/checkout"}
          >
            {capReached ? "Founder seats full" : "Become a Founder"}
          </Link>
        </div>
      </div>
    </header>
  );
}
