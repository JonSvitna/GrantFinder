import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${SITE_URL}/login`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${SITE_URL}/login`);
  }

  if (next === "/auth/reset-password") {
    return NextResponse.redirect(`${SITE_URL}/auth/reset-password`);
  }

  return NextResponse.redirect(`${SITE_URL}/login?confirmed=1`);
}
