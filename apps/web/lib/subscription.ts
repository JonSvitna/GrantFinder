const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export interface BillingCap {
  active_founders: number;
  spots_remaining: number;
  cap_reached: boolean;
}

export interface SubscriptionStatus {
  status: string;
  founder_number: number | null;
  spots_remaining: number;
  email: string;
}

export async function fetchBillingCap(): Promise<BillingCap> {
  const response = await fetch(`${API_BASE_URL}/api/billing/cap`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Could not load founder availability.");
  }
  return response.json() as Promise<BillingCap>;
}

export async function fetchSubscription(accessToken: string): Promise<SubscriptionStatus> {
  const response = await fetch(`${API_BASE_URL}/api/me/subscription`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Could not load subscription status.");
  }
  return response.json() as Promise<SubscriptionStatus>;
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) {
    return false;
  }
  const allowlist =
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
    process.env.ADMIN_EMAILS ||
    "";
  const admins = allowlist
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}
