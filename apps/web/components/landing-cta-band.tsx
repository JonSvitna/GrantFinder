import Link from "next/link";

export function LandingCtaBand() {
  return (
    <section className="landing-section landing-section-cta">
      <div className="landing-section-inner">
        <div className="landing-cta-band">
        <div>
          <h2 className="landing-cta-band-h2">Ready to find your funding?</h2>
          <p className="landing-cta-band-p">
            Join the Maryland founder cohort and get a personalized readiness plan today. Free to start — no card
            required.
          </p>
        </div>
        <Link className="landing-cta-band-btn" href="/founder/checkout">
          Become a Founder
        </Link>
        </div>
      </div>
    </section>
  );
}
