import { LandingHeader } from "@/components/landing-header";
import type { ReactNode } from "react";

export function LandingShell({
  children,
  spotsRemaining,
  capReached,
}: {
  children: ReactNode;
  spotsRemaining?: number;
  capReached?: boolean;
}) {
  return (
    <>
      <LandingHeader capReached={capReached} spotsRemaining={spotsRemaining} />
      <main>{children}</main>
    </>
  );
}
