"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AuthCredentialsForm } from "@/components/auth-credentials-form";

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
  const mode = searchParams.get("mode");
  const confirmed = searchParams.get("confirmed") === "1";
  const passwordUpdated = searchParams.get("passwordUpdated") === "1";

  return (
    <AppShell>
      <div className="panel" style={{ display: "grid", gap: 18, margin: "48px auto", maxWidth: 520, padding: 24 }}>
        {passwordUpdated ? (
          <div
            role="status"
            style={{
              background: "#eef5f1",
              border: "1px solid var(--border)",
              borderRadius: 7,
              color: "var(--green)",
              fontWeight: 700,
              padding: "12px 14px",
            }}
          >
            Password updated — sign in with your new password.
          </div>
        ) : null}
        <AuthCredentialsForm
          defaultMode={mode === "signup" ? "signup" : "signin"}
          next={next}
          showConfirmedBanner={confirmed}
        />
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
