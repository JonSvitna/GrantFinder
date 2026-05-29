"use client";

import { LandingHeader } from "@/components/landing-header";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { fetchBillingCap } from "@/lib/subscription";

export function AppShell({ children }: { children: ReactNode }) {
  const [spotsRemaining, setSpotsRemaining] = useState<number | undefined>();
  const [capReached, setCapReached] = useState(false);

  useEffect(() => {
    fetchBillingCap()
      .then((cap) => {
        setSpotsRemaining(cap.spots_remaining);
        setCapReached(cap.cap_reached);
      })
      .catch(() => {
        setSpotsRemaining(undefined);
      });
  }, []);

  return (
    <>
      <LandingHeader capReached={capReached} spotsRemaining={spotsRemaining} />
      <main className="page-shell">{children}</main>
    </>
  );
}
