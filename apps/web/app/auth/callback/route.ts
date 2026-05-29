import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolvePostLoginPath } from "@/lib/post-login-routing";

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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    const path = await resolvePostLoginPath({
      next,
      accessToken: session.access_token,
    });
    return NextResponse.redirect(`${SITE_URL}${path}`);
  }

  return NextResponse.redirect(`${SITE_URL}/login`);
}
