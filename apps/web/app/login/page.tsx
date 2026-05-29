"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AuthOtpForm } from "@/components/auth-otp-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="panel" style={{ margin: "48px auto", maxWidth: 520, padding: 24 }}>
            Loading...
          </div>
        </AppShell>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  return (
    <AppShell>
      <div className="panel" style={{ display: "grid", gap: 18, margin: "48px auto", maxWidth: 520, padding: 24 }}>
        <AuthOtpForm next={next} />
        <p style={{ color: "var(--muted)", margin: 0 }}>
          New here?{" "}
          <Link href="/founder/checkout" style={{ color: "var(--green)", fontWeight: 700 }}>
            Become a Founder
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
