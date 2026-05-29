import { LandingFeatures } from "@/components/landing-features";
import { LandingFooter } from "@/components/landing-footer";
import { LandingHeroSection } from "@/components/landing-hero";
import { LandingMiddle } from "@/components/landing-middle";
import { LandingShell } from "@/components/landing-shell";
import { fetchBillingCap } from "@/lib/subscription";

export default async function HomePage() {
  let spotsRemaining: number | undefined;
  let capReached = false;

  try {
    const cap = await fetchBillingCap();
    spotsRemaining = cap.spots_remaining;
    capReached = cap.cap_reached;
  } catch {
    spotsRemaining = undefined;
  }

  return (
    <LandingShell capReached={capReached} spotsRemaining={spotsRemaining}>
      <LandingHeroSection />
      <LandingFeatures />
      <LandingMiddle />
      <LandingFooter />
    </LandingShell>
  );
}
