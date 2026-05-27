import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscription } from "@/lib/subscription";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${SITE_URL}/login`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${SITE_URL}/login`);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    try {
      const subscription = await fetchSubscription(session.access_token);
      if (subscription.status === "active") {
        return NextResponse.redirect(`${SITE_URL}${next}`);
      }
    } catch {
      // Fall through to checkout redirect.
    }
  }

  return NextResponse.redirect(`${SITE_URL}/founder/checkout`);
}
