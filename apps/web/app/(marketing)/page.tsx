import { LandingCtaBand } from "@/components/landing-cta-band";
import { LandingFeatures } from "@/components/landing-features";
import { LandingFooter } from "@/components/landing-footer";
import { LandingHeroSection } from "@/components/landing-hero";
import { LandingMiddle } from "@/components/landing-middle";

export default function HomePage() {
  return (
    <>
      <LandingHeroSection />
      <LandingFeatures />
      <LandingMiddle />
      <LandingCtaBand />
      <LandingFooter />
    </>
  );
}
