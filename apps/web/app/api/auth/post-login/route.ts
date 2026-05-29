import { NextResponse } from "next/server";
import { resolvePostLoginPath } from "@/lib/post-login-routing";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next");

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = await resolvePostLoginPath({
    next,
    accessToken: session.access_token,
    email: user?.email,
  });

  return NextResponse.json({ path });
}
